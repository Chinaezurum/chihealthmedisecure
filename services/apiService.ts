import { User, Patient, Appointment, ClinicalNote, LabTest, Prescription, Referral, Organization, UserRole } from '../types';

// In development, the frontend runs on :5173 and the backend on :8080.
// Prefer a direct backend URL in that case so health probes and direct API calls
// work even if the dev proxy isn't active or the user started the servers separately.
// Allow overriding the API base URL via a Vite env var when needed (VITE_API_BASE_URL)
// This is useful if the backend runs on a different port than the default 8080.
export const API_BASE_URL = ((): string => {
  try {
    // Prefer explicit Vite env override when present
    // Use a safe any cast for import.meta.env to avoid TS types depending on Vite types
    const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL;
    if (envBase) return envBase;

  const port = window.location.port;
  const hostname = window.location.hostname;
  // If we're running on localhost during development and not already on the backend port,
  // prefer the backend at :8080 so probes and direct API calls go to the running backend.
  if (hostname === 'localhost' && port && port !== '8080') return 'http://localhost:8080';
  } catch (e) {
    // In non-browser environments, fall back to origin
  }
  return window.location.origin;
})();
const AUTH_TOKEN_KEY = 'chihealth_auth_token';

// --- Token Management ---
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

// --- API Fetch Wrapper ---
const apiFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

  const response = await fetch(`${API_BASE_URL}/api${url}`, { ...options, headers });

    // Read text first to avoid calling response.json() on empty bodies
    const raw = await response.text().catch(() => '');

    if (!response.ok) {
      // Try to parse JSON error body, otherwise surface raw text
      let parsedErr: any = { message: 'An unknown API error occurred.' };
      if (raw) {
        try { parsedErr = JSON.parse(raw); } catch { parsedErr = { message: raw }; }
      }

      // For 401 responses, don't mutate auth state here. Let the caller decide how to handle it.
  if (response.status === 401) {
        const e = new Error(parsedErr.message || 'Unauthorized');
        (e as any).status = 401;
        throw e;
      }
      throw new Error(parsedErr.message || parsedErr.error || 'An unknown API error occurred.');
    }

    // If no content, return null
    if (!raw) return null;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('API request failed - backend may not be running:', url);
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    throw error;
  }
};

// --- Auth & User ---
export const fetchCurrentUser = (): Promise<User> => {
  // Add timeout to prevent hanging - increased to 8 seconds for better reliability
  return Promise.race([
    apiFetch('/users/me'),
    new Promise<User>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout - backend may not be running')), 8000)
    )
  ]);
};

export const getSsoUserData = (tempToken: string): Promise<Partial<Patient>> => {
    return apiFetch(`/auth/sso/user-data?tempToken=${tempToken}`);
};

export const registerOrganizationAndAdmin = (orgData: any, adminData: any): Promise<{organization: Organization}> => {
    return apiFetch('/auth/register-org', {
        method: 'POST',
        body: JSON.stringify({ orgData, adminData }),
    });
};

export const switchOrganization = async (orgId: string): Promise<User> => {
    const { user, token } = await apiFetch('/users/switch-organization', {
        method: 'POST',
        body: JSON.stringify({ organizationId: orgId }),
    });
    setAuthToken(token);
    // Reload the page to refetch all data for the new organization context
    window.location.reload();
    return user;
};
export const updateUser = (user: User): Promise<User> => {
    return apiFetch(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) });
};

// Create new staff member
export const createStaff = (staffData: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  departmentIds?: string[];
  organizationIds?: string[];
}): Promise<User> => {
  return apiFetch('/admin/staff', { 
    method: 'POST', 
    body: JSON.stringify(staffData) 
  });
};

// Upload avatar image (multipart/form-data)
export const uploadAvatar = (file: File) => {
  const form = new FormData();
  form.append('avatar', file);
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  return fetch(`${API_BASE_URL}/api/users/avatar`, { method: 'POST', body: form, headers }).then(async (res) => {
    const raw = await res.text().catch(() => '');
    if (!res.ok) {
      let parsed: any = { message: 'Failed to upload avatar' };
      if (raw) {
        try { parsed = JSON.parse(raw); } catch { parsed = { message: raw }; }
      }
      throw new Error(parsed.message || 'Upload failed');
    }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  });
};


// --- Patient Dashboard ---
export const fetchPatientData = () => apiFetch('/patient/dashboard');
export const bookAppointment = (appointment: Omit<Appointment, 'id' | 'status' | 'patientId'>) => {
  return apiFetch('/patient/appointments', {
    method: 'POST',
    body: JSON.stringify(appointment),
  });
};
export const deleteAppointment = (appointmentId: string) => {
  return apiFetch(`/patient/appointments/${appointmentId}`, { method: 'DELETE' });
};

export const rescheduleAppointment = (appointmentId: string, updates: Partial<Appointment>) => {
  return apiFetch(`/patient/appointments/${appointmentId}`, { method: 'PUT', body: JSON.stringify(updates) });
};
export const simulateWearableData = () => apiFetch('/patient/simulate-wearable', { method: 'POST' });
export const addWearableDevice = (device: { name: string; type: string }) => {
  return apiFetch('/patient/devices', { method: 'POST', body: JSON.stringify(device) });
};
export const removeWearableDevice = (deviceId: string) => {
  return apiFetch(`/patient/devices/${deviceId}`, { method: 'DELETE' });
};

// --- HCW Dashboard ---
export const fetchHcwData = () => apiFetch('/hcw/dashboard');
export const createClinicalNote = (note: Omit<ClinicalNote, 'id' | 'doctorId' | 'doctorName'>) => {
    return apiFetch('/hcw/notes', { method: 'POST', body: JSON.stringify(note) });
};
export const orderLabTest = (test: Omit<LabTest, 'id' | 'orderedById' | 'status'>) => {
    return apiFetch('/hcw/lab-tests', { method: 'POST', body: JSON.stringify(test) });
};
export const createPrescription = (rx: Omit<Prescription, 'id' | 'prescriberId'>) => {
    return apiFetch('/hcw/prescriptions', { method: 'POST', body: JSON.stringify(rx) });
};
export const referPatient = (referral: Omit<Referral, 'id' | 'fromDoctorId'>) => {
    return apiFetch('/hcw/referrals', { method: 'POST', body: JSON.stringify(referral) });
};


// --- Shared / Other Dashboards ---
export const sendMessage = (message: { recipientId: string; content: string; patientId?: string, senderId: string; }) => {
  return apiFetch('/messages', {
    method: 'POST',
    body: JSON.stringify(message),
  });
};
export const fetchAdminData = () => apiFetch('/admin/dashboard');
export const fetchPharmacistData = () => apiFetch('/pharmacist/dashboard');
export const fetchNurseData = () => apiFetch('/nurse/dashboard');
export const fetchLabTechnicianData = () => apiFetch('/lab/dashboard');
export const fetchReceptionistData = () => apiFetch('/receptionist/dashboard');
export const fetchLogisticsData = () => apiFetch('/logistics/dashboard');

// --- Command Center ---
export const fetchCommandCenterData = () => apiFetch('/command-center/dashboard');
export const admitPatient = (patientId: string, bedId: string, reason: string) => {
    return apiFetch('/command-center/admit', { method: 'POST', body: JSON.stringify({ patientId, bedId, reason }) });
};
export const dischargePatient = (patientId: string) => {
    return apiFetch('/command-center/discharge', { method: 'POST', body: JSON.stringify({ patientId }) });
};


// --- Updates ---
export const updatePrescriptionStatus = (id: string, status: Prescription['status']) => {
    return apiFetch(`/prescriptions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
};
export const updateLabTest = (id: string, status: LabTest['status'], result?: string) => {
    return apiFetch(`/lab-tests/${id}`, { method: 'PUT', body: JSON.stringify({ status, result }) });
};
export const checkInPatient = (appointmentId: string) => {
    return apiFetch(`/appointments/${appointmentId}/check-in`, { method: 'POST' });
};
export const saveVitals = (patientId: string, vitals: any) => {
    return apiFetch(`/triage/${patientId}/vitals`, { method: 'POST', body: JSON.stringify(vitals) });
};
export const updateTransportRequestStatus = (id: string, status: any) => {
    return apiFetch(`/transport/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
};
export const updateLabSampleStatus = (id: string, status: any) => {
    return apiFetch(`/lab-samples/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
};
export const linkOrganization = (childId: string, parentId: string) => {
    return apiFetch('/admin/organizations/link', { method: 'POST', body: JSON.stringify({ childId, parentId }) });
};
export const unlinkOrganization = (childId: string) => {
    return apiFetch('/admin/organizations/unlink', { method: 'POST', body: JSON.stringify({ childId }) });
};

// --- Facility Management ---
export const createDepartment = (name: string) => {
    return apiFetch('/admin/departments', { method: 'POST', body: JSON.stringify({ name }) });
};
export const createRoom = (name: string, type: string) => {
    return apiFetch('/admin/rooms', { method: 'POST', body: JSON.stringify({ name, type }) });
};
export const createBed = (name: string, roomId: string) => {
    return apiFetch('/admin/beds', { method: 'POST', body: JSON.stringify({ name, roomId }) });
};

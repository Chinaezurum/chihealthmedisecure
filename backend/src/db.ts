import type { User, Patient, Appointment, Prescription, LabTest, ClinicalNote, Message, Organization, Bill, TriageEntry, TransportRequest, Referral, Bed, ActivityLog, Department, Room, RoomType, BillingCode, Encounter, InsuranceProvider, PatientInsurance, InsuranceClaim, PaymentTransaction, PricingCatalog, IncomingReferral, InterDepartmentalNote, ExternalLabResult } from '../../types.js';
import { hashPassword, comparePassword } from './auth/password.js';
import { seedData } from '../prisma/seed.js';

const initialData = seedData();

// Fix: Explicitly type arrays to avoid overly specific type inference from seed data.
let users: User[] = initialData.users as User[];
let organizations: Organization[] = initialData.organizations;
let appointments: Appointment[] = initialData.appointments;
let prescriptions: Prescription[] = initialData.prescriptions;
let labTests: LabTest[] = initialData.labTests;
let clinicalNotes: ClinicalNote[] = initialData.clinicalNotes;
let messages: Message[] = initialData.messages;
let bills: Bill[] = initialData.bills;
let triageQueue: TriageEntry[] = initialData.triageQueue;
let transportRequests: TransportRequest[] = initialData.transportRequests;
let referrals: Referral[] = initialData.referrals;
let departments: Department[] = initialData.departments;
let rooms: Room[] = initialData.rooms;
let beds: Bed[] = initialData.beds;
let activityLogs: ActivityLog[] = initialData.activityLogs;
let billingCodes: BillingCode[] = initialData.billingCodes || [];
let encounters: Encounter[] = initialData.encounters || [];
let insuranceProviders: InsuranceProvider[] = initialData.insuranceProviders || [];
let patientInsurances: PatientInsurance[] = initialData.patientInsurances || [];
let insuranceClaims: InsuranceClaim[] = initialData.insuranceClaims || [];
let paymentTransactions: PaymentTransaction[] = initialData.paymentTransactions || [];
let pricingCatalogs: PricingCatalog[] = initialData.pricingCatalogs || [];

// New data structures for incoming referrals and inter-departmental communication
let incomingReferrals: IncomingReferral[] = [];
let interDepartmentalNotes: InterDepartmentalNote[] = [];
let externalLabResults: ExternalLabResult[] = [];


// --- User Management ---
export const findUserById = async (id: string): Promise<User | undefined> => users.find(u => u.id === id);
export const findUserByEmail = async (email: string): Promise<User | undefined> => users.find(u => u.email === email);
export const createUser = async (data: Partial<User> & { password?: string, dateOfBirth?: string }): Promise<User> => {
    // Defensive validation: ensure required fields are present
    if (!data.name) throw new Error('createUser: missing name');
    if (!data.email) throw new Error('createUser: missing email');
    const passwordHash = data.password ? await hashPassword(data.password) : undefined;
    const defaultOrg = organizations[0];
    const newUser: User = {
        id: `user-new-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role || 'patient',
        passwordHash,
        organizations: [defaultOrg],
        currentOrganization: defaultOrg,
        ...data.role === 'patient' && { dateOfBirth: data.dateOfBirth || '1990-01-01', lastVisit: new Date().toISOString().split('T')[0] }
    };
    users.push(newUser);
    return newUser;
};
export const loginUser = async (email: string, password: string): Promise<User | null> => {
    const user = await findUserByEmail(email);
    if (user && user.passwordHash && await comparePassword(password, user.passwordHash)) {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }
    return null;
};
export const updateUser = async (id: string, data: Partial<User> & { organizationIds?: string[] }): Promise<User> => {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error("User not found");
    const user = users[userIndex];
    
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.role) user.role = data.role;
    if (data.departmentIds) user.departmentIds = data.departmentIds;

    if (data.organizationIds) {
        const newOrgs = organizations.filter(org => data.organizationIds!.includes(org.id));
        user.organizations = newOrgs;
        // If current org is no longer in the list, default to the first one
        if (!newOrgs.some(org => org.id === user.currentOrganization.id)) {
            user.currentOrganization = newOrgs[0];
        }
    }
    
    // This handles the case where only the current organization is changed via switcher
        if (data.currentOrganization && user.organizations.some((org: any) => org.id === data.currentOrganization!.id)) {
            user.currentOrganization = data.currentOrganization;
        }

        // Support avatar URL updates
        if ((data as any).avatarUrl) {
            (user as any).avatarUrl = (data as any).avatarUrl;
        }

    return user;
};
export const switchUserOrganization = async (userId: string, organizationId: string): Promise<User> => {
    const user = await findUserById(userId);
    const org = organizations.find(o => o.id === organizationId);
    if (!user || !org || !user.organizations.some((o: any) => o.id === org.id)) {
        throw new Error("Invalid user or organization");
    }
    user.currentOrganization = org;
    return user;
};

// --- Patient Search ---
export const searchPatients = async (query: string, organizationId: string): Promise<User[]> => {
    const searchTerm = query.toLowerCase().trim();
    return users.filter(user => {
        // Only return patients from the same organization
        if (user.role !== 'patient') return false;
        if (!user.organizations.some((org: any) => org.id === organizationId)) return false;
        
        // Search by name or email
        const nameMatch = user.name?.toLowerCase().includes(searchTerm);
        const emailMatch = user.email?.toLowerCase().includes(searchTerm);
        
        return nameMatch || emailMatch;
    }).slice(0, 20); // Limit to 20 results
};


// --- Organization Management ---
export const createOrganizationAndAdmin = async (orgData: any, adminData: any): Promise<{organization: Organization, admin: User}> => {
    const newOrg: Organization = {
        id: `org-${Date.now()}`,
        name: orgData.name,
        type: orgData.type,
        planId: 'professional', // Default plan for new orgs
    };
    organizations.push(newOrg);
    
    const adminUser = await createUser({
        ...adminData,
        role: 'admin'
    });
    // Associate admin with the new org
    adminUser.organizations = [newOrg];
    adminUser.currentOrganization = newOrg;
    
    return { organization: newOrg, admin: adminUser };
}
export const linkOrganizations = async (childId: string, parentId: string) => {
    const child = organizations.find(o => o.id === childId);
    if (child) child.parentOrganizationId = parentId;
};
export const unlinkOrganization = async (childId: string) => {
    const child = organizations.find(o => o.id === childId);
    if (child) child.parentOrganizationId = undefined;
};

// --- Patient Dashboard ---
export const getPatientDashboardData = async (patientId: string) => {
    const patient = users.find(u => u.id === patientId && u.role === 'patient') as Patient;
    const patientAppointments = appointments.filter(a => a.patientId === patientId);
    const patientPrescriptions = prescriptions.filter(p => p.patientId === patientId);
    const patientLabTests = labTests.filter(l => l.patientId === patientId);
    const patientNotes = clinicalNotes.filter(cn => cn.patientId === patientId);
    const patientMessages = messages.filter(m => m.senderId === patientId || m.recipientId === patientId);
    const contacts = users.filter(u => u.role !== 'patient' && u.currentOrganization.id === patient.currentOrganization.id);
    const patientBills = bills.filter(b => b.patientId === patientId);
    const notifications = [
        { id: 'notif-1', message: 'Your new lab results are available for review.', timestamp: new Date(Date.now() - 3600000).toISOString(), isRead: false },
        { id: 'notif-2', message: 'A payment is due for your recent consultation.', timestamp: new Date(Date.now() - 86400000).toISOString(), isRead: false },
        { id: 'notif-3', message: 'Your prescription for Lisinopril is ready for a refill.', timestamp: new Date(Date.now() - 172800000).toISOString(), isRead: true },
    ];
    // Mock care plan
    const carePlan = {
      lifestyleRecommendations: [{ category: 'Diet' as const, recommendation: 'Reduce sodium intake', details: 'Avoid processed foods and limit added salt.'}],
      monitoringSuggestions: [{ parameter: 'Blood Pressure', frequency: 'Daily', notes: 'Check every morning before medication.'}],
      followUpAppointments: [{ specialty: 'Cardiology', timeframe: 'In 3 months', reason: 'Routine follow-up for hypertension.'}]
    };
    const carePlanAdherence = {
        adherenceScore: 82,
        comment: "Patient is doing well with diet, but needs to be more consistent with daily blood pressure monitoring.",
        details: [
            { category: 'Diet', target: 'Reduce sodium', status: 'On Track' as const },
            { category: 'Monitoring', target: 'Daily BP check', status: 'Needs Improvement' as const },
        ]
    };
    return { 
        appointments: patientAppointments, 
        prescriptions: patientPrescriptions,
        labTests: patientLabTests,
        clinicalNotes: patientNotes,
        messages: patientMessages,
        contacts,
        bills: patientBills,
        notifications,
        carePlan,
        carePlanAdherence,
        rooms: rooms.filter(r => r.organizationId === patient.currentOrganization.id),
    };
};
export const addSimulatedWearableData = async (patientId: string) => {
    const patient = users.find(u => u.id === patientId) as Patient | undefined;
    if (!patient) return;
    if (!patient.wearableData) patient.wearableData = [];
    patient.wearableData.push({
        timestamp: new Date().toISOString(),
        heartRate: 60 + Math.floor(Math.random() * 10),
        steps: (patient.wearableData.length > 0 ? patient.wearableData[patient.wearableData.length - 1]?.steps : 0) || 0 + Math.floor(Math.random() * 500),
        sleepHours: Math.random() > 0.5 ? 7 + Math.random() : undefined
    });
};

// --- HCW Dashboard ---
export const getHcwDashboardData = async (hcwId: string, orgId: string) => {
    // In a real DB, this would be a complex query. Here we just filter.
    const orgPatientIds = users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId).map(p => p.id);
    return {
        appointments: appointments.filter(a => orgPatientIds.includes(a.patientId) || a.doctorId === hcwId),
        patients: users.filter(u => orgPatientIds.includes(u.id)),
        messages: messages.filter(m => orgPatientIds.includes(m.patientId || '')),
        prescriptions: prescriptions.filter(p => orgPatientIds.includes(p.patientId)),
        labTests: labTests.filter(l => orgPatientIds.includes(l.patientId)),
        clinicalNotes: clinicalNotes.filter(cn => orgPatientIds.includes(cn.patientId)),
        referrals: referrals.filter(r => orgPatientIds.includes(r.patientId)),
    }
};

// --- Admin Dashboard ---
export const getAdminDashboardData = async (orgId: string) => {
     const childOrgs = organizations.filter(o => o.parentOrganizationId === orgId).map(o => o.id);
     const relevantOrgIds = [orgId, ...childOrgs];

    const staff = users.filter(u => u.role !== 'patient' && u.organizations.some((org: any) => relevantOrgIds.includes(org.id)));
     const patients = users.filter(u => u.role === 'patient' && relevantOrgIds.includes(u.currentOrganization.id));
     const orgAppointments = appointments.filter(a => relevantOrgIds.includes(users.find(u => u.id === a.patientId)!.currentOrganization.id));
     const totalRevenue = bills.filter(b => b.status === 'Paid' && relevantOrgIds.includes(users.find(u => u.id === b.patientId)!.currentOrganization.id)).reduce((sum, b) => sum + b.amount, 0);
     const orgDepartments = departments.filter(d => d.organizationId === orgId);
     const orgRooms = rooms.filter(r => r.organizationId === orgId);
     const orgRoomIds = orgRooms.map(r => r.id);
     const orgBeds = beds.filter(b => orgRoomIds.includes(b.roomId));

     return {
        staff,
        patients,
        appointments: orgAppointments,
        totalRevenue,
        organizations, // Return all orgs for linking purposes
        departments: orgDepartments,
        rooms: orgRooms,
        beds: orgBeds,
     }
}

// --- Command Center Dashboard ---
export const getCommandCenterDashboardData = async (orgId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const admissionsToday = activityLogs.filter(log => log.type === 'ADMISSION' && log.timestamp.startsWith(today)).length;
    const dischargesToday = activityLogs.filter(log => log.type === 'DISCHARGE' && log.timestamp.startsWith(today)).length;
    const allBedsInOrg = beds.filter(b => rooms.find(r => r.id === b.roomId)?.organizationId === orgId);
    const occupiedBeds = allBedsInOrg.filter(b => b.isOccupied).length;

    return {
        beds: allBedsInOrg,
        rooms: rooms.filter(r => r.organizationId === orgId),
        activityLogs: activityLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        patients: users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId),
        kpis: {
            bedOccupancy: allBedsInOrg.length > 0 ? Math.round((occupiedBeds / allBedsInOrg.length) * 100) : 0,
            admissionsToday,
            dischargesToday,
            avgLengthOfStay: 5.2, // Mocked
            erWaitTime: 45, // Mocked in minutes
        }
    };
};


// --- Other Dashboards ---
export const getPharmacistDashboardData = async (orgId: string) => ({
    prescriptions: prescriptions.filter(p => users.find(u => u.id === p.patientId)?.currentOrganization.id === orgId),
    patients: users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId),
    doctors: users.filter(u => u.role === 'hcw' && u.currentOrganization.id === orgId)
});
export const getNurseDashboardData = async (orgId: string) => ({
    triageQueue: triageQueue.filter(t => users.find(u => u.id === t.patientId)?.currentOrganization.id === orgId),
    inpatients: users.filter(u => u.role === 'patient' && u.inpatientStay && u.currentOrganization.id === orgId) as Patient[],
});
export const getLabDashboardData = async (orgId: string) => ({
    labTests: labTests.filter(l => users.find(u => u.id === l.patientId)?.currentOrganization.id === orgId),
});
export const getReceptionistDashboardData = async (orgId: string) => ({
    appointments: appointments.filter(a => users.find(u => u.id === a.patientId)?.currentOrganization.id === orgId),
    patients: users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId),
});
export const getLogisticsDashboardData = async (orgId: string) => ({
    transportRequests: transportRequests, // Simplified for mock
    labSamples: labTests.filter(l => (l.status === 'Awaiting Pickup' || l.status === 'In Transit' || l.status === 'Delivered')), // Simplified
})

// --- Data Creation/Update ---
export const createAppointment = async (patientId: string, data: any) => {
    const newAppt: Appointment = { id: `appt-${Date.now()}`, patientId, status: 'Confirmed', ...data };
    appointments.push(newAppt);
    return newAppt;
};

export const deleteAppointment = async (appointmentId: string) => {
    const idx = appointments.findIndex(a => a.id === appointmentId);
    if (idx === -1) return false;
    appointments.splice(idx, 1);
    return true;
};

export const updateAppointment = async (appointmentId: string, updates: Partial<Appointment>) => {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) throw new Error('Appointment not found');
    // Only allow updating a small set of fields for the mock
    if (updates.date) appt.date = updates.date;
    if (updates.time) appt.time = updates.time;
    if ((updates as any).consultingRoomName) appt.consultingRoomName = (updates as any).consultingRoomName;
    if (updates.status) appt.status = updates.status as Appointment['status'];
    if ((updates as any).doctorId) appt.doctorId = (updates as any).doctorId;
    if ((updates as any).specialty) appt.specialty = (updates as any).specialty;
    return appt;
};
export const createMessage = async (senderId: string, data: any) => {
    const newMsg: Message = { id: `msg-${Date.now()}`, senderId, timestamp: new Date().toISOString(), ...data };
    messages.push(newMsg);
    return newMsg;
}
export const createClinicalNote = async (doctorId: string, data: any) => {
    const doctor = await findUserById(doctorId);
    const newNote: ClinicalNote = { id: `note-${Date.now()}`, doctorId, doctorName: doctor!.name, ...data };
    clinicalNotes.push(newNote);
    return newNote;
};
export const createLabTest = async (orderedById: string, data: any) => {
    const newTest: LabTest = { id: `lab-${Date.now()}`, orderedById, status: 'Ordered', ...data };
    labTests.push(newTest);
    return newTest;
};
export const updateLabTest = async (id: string, status: LabTest['status'], result?: string) => {
    const test = labTests.find(l => l.id === id);
    if (!test) throw new Error("Test not found");
    test.status = status;
    if (result) test.result = result;
    return test;
};
export const createPrescription = async (prescriberId: string, data: any) => {
    const newRx: Prescription = { id: `rx-${Date.now()}`, prescriberId, ...data };
    prescriptions.push(newRx);
    return newRx;
};
export const updatePrescription = async (id: string, status: Prescription['status']) => {
    const rx = prescriptions.find(p => p.id === id);
    if (!rx) throw new Error("Prescription not found");
    rx.status = status;
    return rx;
};
export const createReferral = async (fromDoctorId: string, data: any) => {
    const newRef: Referral = { 
        id: `ref-${Date.now()}`, 
        fromDoctorId, 
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        ...data 
    };
    referrals.push(newRef);
    return newRef;
}
export const checkInPatient = async (appointmentId: string) => {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) throw new Error("Appointment not found");
    appt.status = 'Checked-in';
    // Add to triage queue
    triageQueue.push({
        appointmentId,
        patientId: appt.patientId,
        patientName: users.find(u => u.id === appt.patientId)!.name,
        arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
        chiefComplaint: appt.specialty, // using specialty as a mock complaint
        priority: 'Medium',
    });
    return appt;
};
export const recordVitals = async (patientId: string, vitals: any) => {
    const triageIndex = triageQueue.findIndex(t => t.patientId === patientId);
    if (triageIndex > -1) {
        triageQueue.splice(triageIndex, 1);
    }
    // Persist vitals into patient record for demo purposes
    const patient = users.find(u => u.id === patientId) as Patient | undefined;
    if (!patient) return;
    const entry = { timestamp: new Date().toISOString(), ...vitals };
    if (!patient.vitalHistory) patient.vitalHistory = [];
    patient.vitalHistory.unshift(entry);

    // If patient is admitted, update inpatient current vitals
    if (patient.inpatientStay) {
        patient.inpatientStay.currentVitals = {
            heartRate: vitals.heartRate || patient.inpatientStay.currentVitals.heartRate,
            bloodPressure: vitals.bloodPressure || patient.inpatientStay.currentVitals.bloodPressure,
            respiratoryRate: vitals.respiratoryRate || patient.inpatientStay.currentVitals.respiratoryRate,
            spO2: vitals.spO2 || patient.inpatientStay.currentVitals.spO2
        };
        if (!patient.inpatientStay.vitalHistory) patient.inpatientStay.vitalHistory = [];
        patient.inpatientStay.vitalHistory.unshift({ timestamp: entry.timestamp, heartRate: entry.heartRate, bloodPressure: entry.bloodPressure, spO2: entry.spO2 });
    }
};
export const updateTransportRequest = async (id: string, status: TransportRequest['status']) => {
    const req = transportRequests.find(t => t.id === id);
    if (!req) throw new Error("Request not found");
    req.status = status;
    return req;
};
export const admitPatient = async (patientId: string, bedId: string, reason: string) => {
    const patient = users.find(u => u.id === patientId);
    const bed = beds.find(b => b.id === bedId);
    if (!patient || !bed || bed.isOccupied) throw new Error("Invalid patient or bed is occupied");
    
    const room = rooms.find(r => r.id === bed.roomId);
    if (!room) throw new Error("Bed is not in a valid room");

    bed.isOccupied = true;
    bed.patientId = patient.id;
    bed.patientName = patient.name;
    
    patient.inpatientStay = {
        bedId: bed.id,
        roomNumber: room.name,
        admissionDate: new Date().toISOString(),
        currentVitals: { heartRate: 78, bloodPressure: '120/80', respiratoryRate: 16, spO2: 98 },
        vitalHistory: []
    };

    activityLogs.unshift({
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'ADMISSION',
        details: `${patient.name} admitted to room ${room.name}. Reason: ${reason}`
    });
};
export const dischargePatient = async (patientId: string) => {
    const patient = users.find(u => u.id === patientId);
    if (!patient || !patient.inpatientStay) throw new Error("Patient not found or not admitted");

    const bed = beds.find(b => b.id === patient.inpatientStay?.bedId);
    if (bed) {
        bed.isOccupied = false;
        delete bed.patientId;
        delete bed.patientName;
    }

    const roomName = patient.inpatientStay.roomNumber;
    patient.inpatientStay.dischargeDate = new Date().toISOString();
    
    activityLogs.unshift({
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'DISCHARGE',
        details: `${patient.name} discharged from room ${roomName}.`
    });
    
    // In a real app we might archive the inpatientStay, but here we'll just remove it
    delete patient.inpatientStay;
};

// --- Facility Management ---
export const createDepartment = async (name: string, organizationId: string): Promise<Department> => {
    const newDept: Department = { id: `dept-${Date.now()}`, name, organizationId };
    departments.push(newDept);
    return newDept;
};

export const createRoom = async (name: string, type: RoomType, organizationId: string): Promise<Room> => {
    const newRoom: Room = { id: `room-${Date.now()}`, name, type, organizationId };
    rooms.push(newRoom);
    return newRoom;
};

export const createBed = async (name: string, roomId: string): Promise<Bed> => {
    const newBed: Bed = { id: `bed-${Date.now()}`, name, roomId, isOccupied: false };
    beds.push(newBed);
    return newBed;
};

export const addWearableDevice = async (patientId: string, device: { name: string; type: string }) => {
    const patient = users.find(u => u.id === patientId) as Patient | undefined;
    if (!patient) throw new Error('Patient not found');
    if (!patient.wearableDevices) patient.wearableDevices = [];
    const newDevice = { id: `device-${Date.now()}`, name: device.name, type: device.type, addedAt: new Date().toISOString() } as any;
    patient.wearableDevices.push(newDevice);
    return newDevice;
};

export const removeWearableDevice = async (patientId: string, deviceId: string) => {
    const patient = users.find(u => u.id === patientId) as Patient | undefined;
    if (!patient) throw new Error('Patient not found');
    if (!patient.wearableDevices) return false;
    const idx = patient.wearableDevices.findIndex((d: any) => d.id === deviceId);
    if (idx === -1) return false;
    patient.wearableDevices.splice(idx, 1);
    return true;
};

// --- Billing System ---

// Billing Codes Management
export const getBillingCodes = async (orgId?: string) => {
    if (orgId) {
        const catalog = pricingCatalogs.find(c => c.organizationId === orgId && c.isActive);
        return catalog ? catalog.billingCodes : billingCodes.filter(bc => bc.isActive);
    }
    return billingCodes.filter(bc => bc.isActive);
};

export const createBillingCode = async (data: Omit<BillingCode, 'id'>) => {
    const newCode: BillingCode = { id: `bc-${Date.now()}`, ...data };
    billingCodes.push(newCode);
    return newCode;
};

export const updateBillingCode = async (id: string, updates: Partial<BillingCode>) => {
    const code = billingCodes.find(bc => bc.id === id);
    if (!code) throw new Error('Billing code not found');
    Object.assign(code, updates);
    return code;
};

// Pricing Catalog Management
export const getPricingCatalog = async (orgId: string) => {
    return pricingCatalogs.find(pc => pc.organizationId === orgId && pc.isActive);
};

export const createPricingCatalog = async (data: Omit<PricingCatalog, 'id'>) => {
    const newCatalog: PricingCatalog = { id: `catalog-${Date.now()}`, ...data };
    pricingCatalogs.push(newCatalog);
    return newCatalog;
};

// Encounter Management
export const createEncounter = async (data: Omit<Encounter, 'id' | 'createdAt'>) => {
    const newEncounter: Encounter = {
        id: `enc-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
    };
    encounters.push(newEncounter);
    return newEncounter;
};

export const getEncounterById = async (id: string) => {
    return encounters.find(e => e.id === id);
};

export const getEncountersByOrganization = async (orgId: string) => {
    const orgPatientIds = users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId).map(u => u.id);
    return encounters.filter(e => orgPatientIds.includes(e.patientId));
};

export const getPendingEncounters = async (orgId: string) => {
    const orgPatientIds = users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId).map(u => u.id);
    return encounters.filter(e => orgPatientIds.includes(e.patientId) && e.status === 'Submitted' && !e.billId);
};

export const updateEncounter = async (id: string, updates: Partial<Encounter>) => {
    const encounter = encounters.find(e => e.id === id);
    if (!encounter) throw new Error('Encounter not found');
    Object.assign(encounter, updates);
    return encounter;
};

// Bill Management
export const createBill = async (data: Omit<Bill, 'id' | 'invoiceNumber'>) => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    const newBill: Bill = { 
        id: `bill-${Date.now()}`,
        invoiceNumber,
        ...data 
    };
    bills.push(newBill);
    
    // Update encounter if linked
    if (data.encounterId) {
        const encounter = encounters.find(e => e.id === data.encounterId);
        if (encounter) {
            encounter.billId = newBill.id;
            encounter.status = 'Billed';
        }
    }
    
    return newBill;
};

export const getBillById = async (id: string) => {
    return bills.find(b => b.id === id);
};

export const getBillsByOrganization = async (orgId: string) => {
    const orgPatientIds = users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId).map(u => u.id);
    return bills.filter(b => orgPatientIds.includes(b.patientId));
};

export const updateBillStatus = async (billId: string, status: Bill['status'], updates?: Partial<Bill>) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');
    bill.status = status;
    if (updates) Object.assign(bill, updates);
    if (status === 'Paid') {
        bill.paidDate = new Date().toISOString();
    }
    return bill;
};

// Payment Processing
export const processPayment = async (billId: string, paymentData: { 
    amount: number, 
    paymentMethod: 'Cash' | 'Card' | 'Insurance' | 'Mobile Money',
    transactionId: string,
    processedBy: string,
    cardLast4?: string,
    mobileMoneyNumber?: string
}) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) throw new Error('Bill not found');
    
    const transaction: PaymentTransaction = {
        id: `txn-${Date.now()}`,
        billId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
        status: 'Completed',
        paymentDate: new Date().toISOString(),
        processedBy: paymentData.processedBy,
        cardLast4: paymentData.cardLast4,
        mobileMoneyNumber: paymentData.mobileMoneyNumber
    };
    
    paymentTransactions.push(transaction);
    
    bill.status = 'Paid';
    bill.paidDate = new Date().toISOString();
    bill.paymentMethod = paymentData.paymentMethod;
    bill.transactionId = paymentData.transactionId;
    
    return { bill, transaction };
};

// Insurance Management
export const getInsuranceProviders = async () => {
    return insuranceProviders.filter(ip => ip.isActive);
};

export const createInsuranceProvider = async (data: Omit<InsuranceProvider, 'id'>) => {
    const newProvider: InsuranceProvider = { id: `ins-provider-${Date.now()}`, ...data };
    insuranceProviders.push(newProvider);
    return newProvider;
};

export const getPatientInsurance = async (patientId: string) => {
    return patientInsurances.find(pi => pi.patientId === patientId && pi.isActive);
};

export const createPatientInsurance = async (data: Omit<PatientInsurance, 'id'>) => {
    // Deactivate existing insurance for patient
    patientInsurances.filter(pi => pi.patientId === data.patientId).forEach(pi => pi.isActive = false);
    
    const newInsurance: PatientInsurance = { id: `pat-ins-${Date.now()}`, ...data };
    patientInsurances.push(newInsurance);
    
    // Update patient object
    const patient = users.find(u => u.id === data.patientId) as Patient;
    if (patient) {
        patient.insurance = newInsurance;
    }
    
    return newInsurance;
};

export const verifyInsurance = async (patientId: string) => {
    const insurance = patientInsurances.find(pi => pi.patientId === patientId && pi.isActive);
    if (!insurance) throw new Error('No active insurance found');
    
    // Mock verification - in real system would call insurance API
    const isValid = Math.random() > 0.1; // 90% success rate
    insurance.verificationStatus = isValid ? 'Verified' : 'Failed';
    insurance.lastVerified = new Date().toISOString();
    
    return insurance;
};

// Insurance Claims
export const createInsuranceClaim = async (data: Omit<InsuranceClaim, 'id' | 'claimNumber' | 'submittedDate'>) => {
    const claimNumber = `CLM-${Date.now().toString().slice(-10)}`;
    const newClaim: InsuranceClaim = {
        id: `claim-${Date.now()}`,
        claimNumber,
        submittedDate: new Date().toISOString(),
        ...data
    };
    insuranceClaims.push(newClaim);
    
    // Update bill with claim info
    const bill = bills.find(b => b.id === data.billId);
    if (bill) {
        bill.insuranceClaimId = newClaim.id;
        bill.insuranceClaimStatus = 'Pending';
    }
    
    return newClaim;
};

export const updateInsuranceClaimStatus = async (claimId: string, status: InsuranceClaim['status'], updates?: Partial<InsuranceClaim>) => {
    const claim = insuranceClaims.find(c => c.id === claimId);
    if (!claim) throw new Error('Insurance claim not found');
    
    claim.status = status;
    claim.processedDate = new Date().toISOString();
    if (updates) Object.assign(claim, updates);
    
    // Update bill
    const bill = bills.find(b => b.id === claim.billId);
    if (bill) {
        bill.insuranceClaimStatus = status as 'Pending' | 'Approved' | 'Denied' | 'Partial';
        if (status === 'Approved' && claim.approvedAmount) {
            bill.insuranceCoverage = claim.approvedAmount;
            bill.patientResponsibility = bill.amount - claim.approvedAmount;
        }
    }
    
    return claim;
};

export const getInsuranceClaimsByOrganization = async (orgId: string) => {
    const orgPatientIds = users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId).map(u => u.id);
    return insuranceClaims.filter(c => orgPatientIds.includes(c.patientId));
};

// Accountant Dashboard
export const getAccountantDashboardData = async (orgId: string) => {
    const orgPatientIds = users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId).map(u => u.id);
    
    const pendingEncounters = encounters.filter(e => 
        orgPatientIds.includes(e.patientId) && 
        e.status === 'Submitted' && 
        !e.billId
    );
    
    const draftBills = bills.filter(b => 
        orgPatientIds.includes(b.patientId) && 
        b.status === 'Draft'
    );
    
    const pendingBills = bills.filter(b => 
        orgPatientIds.includes(b.patientId) && 
        (b.status === 'Pending' || b.status === 'Due')
    );
    
    const paidBills = bills.filter(b => 
        orgPatientIds.includes(b.patientId) && 
        b.status === 'Paid'
    );
    
    const recentTransactions = paymentTransactions
        .filter(t => bills.find(b => b.id === t.billId && orgPatientIds.includes(b.patientId)))
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
        .slice(0, 20);
    
    const pendingClaims = insuranceClaims.filter(c => 
        orgPatientIds.includes(c.patientId) && 
        (c.status === 'Submitted' || c.status === 'Pending')
    );
    
    const totalRevenue = paidBills.reduce((sum, b) => sum + b.amount, 0);
    const pendingRevenue = pendingBills.reduce((sum, b) => sum + b.amount, 0);
    const insuranceRevenue = paidBills
        .filter(b => b.paymentType === 'Insurance' || b.paymentType === 'Mixed')
        .reduce((sum, b) => sum + (b.insuranceCoverage || 0), 0);
    
    return {
        pendingEncounters,
        draftBills,
        pendingBills,
        paidBills,
        recentTransactions,
        pendingClaims,
        billingCodes: await getBillingCodes(orgId),
        insuranceProviders: await getInsuranceProviders(),
        patients: users.filter(u => u.role === 'patient' && orgPatientIds.includes(u.id)),
        stats: {
            totalRevenue,
            pendingRevenue,
            insuranceRevenue,
            cashRevenue: totalRevenue - insuranceRevenue,
            pendingEncountersCount: pendingEncounters.length,
            pendingBillsCount: pendingBills.length,
            pendingClaimsCount: pendingClaims.length
        }
    };
};

// --- Incoming Referrals Management ---
export const getIncomingReferrals = async (orgId: string) => {
    return incomingReferrals.filter(r => r.toOrganizationId === orgId);
};

export const createIncomingReferral = async (data: Omit<IncomingReferral, 'id' | 'status' | 'referralDate'>): Promise<IncomingReferral> => {
    const newReferral: IncomingReferral = {
        id: `inc-ref-${Date.now()}`,
        status: 'Pending',
        referralDate: new Date().toISOString(),
        ...data
    };
    incomingReferrals.push(newReferral);
    return newReferral;
};

export const updateIncomingReferralStatus = async (
    id: string, 
    status: IncomingReferral['status'],
    acceptedBy?: string,
    registeredPatientId?: string,
    responseNotes?: string
): Promise<IncomingReferral> => {
    const referral = incomingReferrals.find(r => r.id === id);
    if (!referral) throw new Error('Incoming referral not found');
    
    referral.status = status;
    if (acceptedBy) referral.acceptedBy = acceptedBy;
    if (registeredPatientId) referral.registeredPatientId = registeredPatientId;
    if (responseNotes) referral.responseNotes = responseNotes;
    if (status === 'Accepted') {
        referral.acceptedDate = new Date().toISOString();
    }
    
    return referral;
};

// --- Inter-Departmental Notes Management ---
export const getInterDepartmentalNotes = async (doctorId: string) => {
    return interDepartmentalNotes
        .filter(n => !n.toDoctorId || n.toDoctorId === doctorId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getInterDepartmentalNotesByPatient = async (patientId: string) => {
    return interDepartmentalNotes
        .filter(n => n.patientId === patientId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const createInterDepartmentalNote = async (data: Omit<InterDepartmentalNote, 'id' | 'timestamp' | 'isRead'>): Promise<InterDepartmentalNote> => {
    const newNote: InterDepartmentalNote = {
        id: `dept-note-${Date.now()}`,
        timestamp: new Date().toISOString(),
        isRead: false,
        ...data
    };
    interDepartmentalNotes.push(newNote);
    return newNote;
};

export const markInterDepartmentalNoteAsRead = async (id: string): Promise<InterDepartmentalNote> => {
    const note = interDepartmentalNotes.find(n => n.id === id);
    if (!note) throw new Error('Note not found');
    note.isRead = true;
    return note;
};

// --- External Lab Results Management ---
export const getExternalLabResults = async (patientId?: string) => {
    if (patientId) {
        return externalLabResults.filter(r => r.patientId === patientId);
    }
    return externalLabResults;
};

export const createExternalLabResult = async (data: Omit<ExternalLabResult, 'id' | 'uploadedDate' | 'status'>): Promise<ExternalLabResult> => {
    const newResult: ExternalLabResult = {
        id: `ext-lab-${Date.now()}`,
        uploadedDate: new Date().toISOString(),
        status: 'Pending Review',
        ...data
    };
    externalLabResults.push(newResult);
    return newResult;
};

export const updateExternalLabResultStatus = async (id: string, status: ExternalLabResult['status']): Promise<ExternalLabResult> => {
    const result = externalLabResults.find(r => r.id === id);
    if (!result) throw new Error('External lab result not found');
    result.status = status;
    return result;
};
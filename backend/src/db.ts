import type { User, Patient, Appointment, Prescription, LabTest, ClinicalNote, Message, Organization, Bill, TriageEntry, TransportRequest, Referral, Bed, ActivityLog, Department, Room, RoomType } from '../../types.js';
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
    const newRef: Referral = { id: `ref-${Date.now()}`, fromDoctorId, ...data };
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
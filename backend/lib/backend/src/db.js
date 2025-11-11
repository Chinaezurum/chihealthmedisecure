var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { hashPassword, comparePassword } from './auth/password.js';
import { seedData } from '../prisma/seed.js';
const initialData = seedData();
// Fix: Explicitly type arrays to avoid overly specific type inference from seed data.
let users = initialData.users;
let organizations = initialData.organizations;
let appointments = initialData.appointments;
let prescriptions = initialData.prescriptions;
let labTests = initialData.labTests;
let clinicalNotes = initialData.clinicalNotes;
let messages = initialData.messages;
let bills = initialData.bills;
let triageQueue = initialData.triageQueue;
let transportRequests = initialData.transportRequests;
let referrals = initialData.referrals;
let departments = initialData.departments;
let rooms = initialData.rooms;
let beds = initialData.beds;
let activityLogs = initialData.activityLogs;
// --- User Management ---
export const findUserById = async (id) => users.find(u => u.id === id);
export const findUserByEmail = async (email) => users.find(u => u.email === email);
export const createUser = async (data) => {
    // Defensive validation: ensure required fields are present
    if (!data.name)
        throw new Error('createUser: missing name');
    if (!data.email)
        throw new Error('createUser: missing email');
    const passwordHash = data.password ? await hashPassword(data.password) : undefined;
    const defaultOrg = organizations[0];
    const newUser = Object.assign({ id: `user-new-${Date.now()}`, name: data.name, email: data.email, role: data.role || 'patient', passwordHash, organizations: [defaultOrg], currentOrganization: defaultOrg }, data.role === 'patient' && { dateOfBirth: data.dateOfBirth || '1990-01-01', lastVisit: new Date().toISOString().split('T')[0] });
    users.push(newUser);
    return newUser;
};
export const loginUser = async (email, password) => {
    const user = await findUserByEmail(email);
    if (user && user.passwordHash && await comparePassword(password, user.passwordHash)) {
        const { passwordHash } = user, userWithoutPassword = __rest(user, ["passwordHash"]);
        return userWithoutPassword;
    }
    return null;
};
export const updateUser = async (id, data) => {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1)
        throw new Error("User not found");
    const user = users[userIndex];
    if (data.name)
        user.name = data.name;
    if (data.email)
        user.email = data.email;
    if (data.role)
        user.role = data.role;
    if (data.departmentIds)
        user.departmentIds = data.departmentIds;
    if (data.organizationIds) {
        const newOrgs = organizations.filter(org => data.organizationIds.includes(org.id));
        user.organizations = newOrgs;
        // If current org is no longer in the list, default to the first one
        if (!newOrgs.some(org => org.id === user.currentOrganization.id)) {
            user.currentOrganization = newOrgs[0];
        }
    }
    // This handles the case where only the current organization is changed via switcher
    if (data.currentOrganization && user.organizations.some((org) => org.id === data.currentOrganization.id)) {
        user.currentOrganization = data.currentOrganization;
    }
    // Support avatar URL updates
    if (data.avatarUrl) {
        user.avatarUrl = data.avatarUrl;
    }
    return user;
};
export const switchUserOrganization = async (userId, organizationId) => {
    const user = await findUserById(userId);
    const org = organizations.find(o => o.id === organizationId);
    if (!user || !org || !user.organizations.some((o) => o.id === org.id)) {
        throw new Error("Invalid user or organization");
    }
    user.currentOrganization = org;
    return user;
};
// --- Organization Management ---
export const createOrganizationAndAdmin = async (orgData, adminData) => {
    const newOrg = {
        id: `org-${Date.now()}`,
        name: orgData.name,
        type: orgData.type,
        planId: 'professional', // Default plan for new orgs
    };
    organizations.push(newOrg);
    const adminUser = await createUser(Object.assign(Object.assign({}, adminData), { role: 'admin' }));
    // Associate admin with the new org
    adminUser.organizations = [newOrg];
    adminUser.currentOrganization = newOrg;
    return { organization: newOrg, admin: adminUser };
};
export const linkOrganizations = async (childId, parentId) => {
    const child = organizations.find(o => o.id === childId);
    if (child)
        child.parentOrganizationId = parentId;
};
export const unlinkOrganization = async (childId) => {
    const child = organizations.find(o => o.id === childId);
    if (child)
        child.parentOrganizationId = undefined;
};
// --- Patient Dashboard ---
export const getPatientDashboardData = async (patientId) => {
    const patient = users.find(u => u.id === patientId && u.role === 'patient');
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
        lifestyleRecommendations: [{ category: 'Diet', recommendation: 'Reduce sodium intake', details: 'Avoid processed foods and limit added salt.' }],
        monitoringSuggestions: [{ parameter: 'Blood Pressure', frequency: 'Daily', notes: 'Check every morning before medication.' }],
        followUpAppointments: [{ specialty: 'Cardiology', timeframe: 'In 3 months', reason: 'Routine follow-up for hypertension.' }]
    };
    const carePlanAdherence = {
        adherenceScore: 82,
        comment: "Patient is doing well with diet, but needs to be more consistent with daily blood pressure monitoring.",
        details: [
            { category: 'Diet', target: 'Reduce sodium', status: 'On Track' },
            { category: 'Monitoring', target: 'Daily BP check', status: 'Needs Improvement' },
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
export const addSimulatedWearableData = async (patientId) => {
    var _a;
    const patient = users.find(u => u.id === patientId);
    if (!patient)
        return;
    if (!patient.wearableData)
        patient.wearableData = [];
    patient.wearableData.push({
        timestamp: new Date().toISOString(),
        heartRate: 60 + Math.floor(Math.random() * 10),
        steps: (patient.wearableData.length > 0 ? (_a = patient.wearableData[patient.wearableData.length - 1]) === null || _a === void 0 ? void 0 : _a.steps : 0) || 0 + Math.floor(Math.random() * 500),
        sleepHours: Math.random() > 0.5 ? 7 + Math.random() : undefined
    });
};
// --- HCW Dashboard ---
export const getHcwDashboardData = async (hcwId, orgId) => {
    // In a real DB, this would be a complex query. Here we just filter.
    const orgPatientIds = users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId).map(p => p.id);
    return {
        appointments: appointments.filter(a => orgPatientIds.includes(a.patientId) || a.doctorId === hcwId),
        patients: users.filter(u => orgPatientIds.includes(u.id)),
        messages: messages.filter(m => orgPatientIds.includes(m.patientId || '')),
        prescriptions: prescriptions.filter(p => orgPatientIds.includes(p.patientId)),
        labTests: labTests.filter(l => orgPatientIds.includes(l.patientId)),
    };
};
// --- Admin Dashboard ---
export const getAdminDashboardData = async (orgId) => {
    const childOrgs = organizations.filter(o => o.parentOrganizationId === orgId).map(o => o.id);
    const relevantOrgIds = [orgId, ...childOrgs];
    const staff = users.filter(u => u.role !== 'patient' && u.organizations.some((org) => relevantOrgIds.includes(org.id)));
    const patients = users.filter(u => u.role === 'patient' && relevantOrgIds.includes(u.currentOrganization.id));
    const orgAppointments = appointments.filter(a => relevantOrgIds.includes(users.find(u => u.id === a.patientId).currentOrganization.id));
    const totalRevenue = bills.filter(b => b.status === 'Paid' && relevantOrgIds.includes(users.find(u => u.id === b.patientId).currentOrganization.id)).reduce((sum, b) => sum + b.amount, 0);
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
    };
};
// --- Command Center Dashboard ---
export const getCommandCenterDashboardData = async (orgId) => {
    const today = new Date().toISOString().split('T')[0];
    const admissionsToday = activityLogs.filter(log => log.type === 'ADMISSION' && log.timestamp.startsWith(today)).length;
    const dischargesToday = activityLogs.filter(log => log.type === 'DISCHARGE' && log.timestamp.startsWith(today)).length;
    const allBedsInOrg = beds.filter(b => { var _a; return ((_a = rooms.find(r => r.id === b.roomId)) === null || _a === void 0 ? void 0 : _a.organizationId) === orgId; });
    const occupiedBeds = allBedsInOrg.filter(b => b.isOccupied).length;
    return {
        beds: allBedsInOrg,
        rooms: rooms.filter(r => r.organizationId === orgId),
        activityLogs: activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
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
export const getPharmacistDashboardData = async (orgId) => ({
    prescriptions: prescriptions.filter(p => { var _a; return ((_a = users.find(u => u.id === p.patientId)) === null || _a === void 0 ? void 0 : _a.currentOrganization.id) === orgId; }),
    patients: users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId),
    doctors: users.filter(u => u.role === 'hcw' && u.currentOrganization.id === orgId)
});
export const getNurseDashboardData = async (orgId) => ({
    triageQueue: triageQueue.filter(t => { var _a; return ((_a = users.find(u => u.id === t.patientId)) === null || _a === void 0 ? void 0 : _a.currentOrganization.id) === orgId; }),
    inpatients: users.filter(u => u.role === 'patient' && u.inpatientStay && u.currentOrganization.id === orgId),
});
export const getLabDashboardData = async (orgId) => ({
    labTests: labTests.filter(l => { var _a; return ((_a = users.find(u => u.id === l.patientId)) === null || _a === void 0 ? void 0 : _a.currentOrganization.id) === orgId; }),
});
export const getReceptionistDashboardData = async (orgId) => ({
    appointments: appointments.filter(a => { var _a; return ((_a = users.find(u => u.id === a.patientId)) === null || _a === void 0 ? void 0 : _a.currentOrganization.id) === orgId; }),
    patients: users.filter(u => u.role === 'patient' && u.currentOrganization.id === orgId),
});
export const getLogisticsDashboardData = async (orgId) => ({
    transportRequests: transportRequests, // Simplified for mock
    labSamples: labTests.filter(l => (l.status === 'Awaiting Pickup' || l.status === 'In Transit' || l.status === 'Delivered')), // Simplified
});
// --- Data Creation/Update ---
export const createAppointment = async (patientId, data) => {
    const newAppt = Object.assign({ id: `appt-${Date.now()}`, patientId, status: 'Confirmed' }, data);
    appointments.push(newAppt);
    return newAppt;
};
export const deleteAppointment = async (appointmentId) => {
    const idx = appointments.findIndex(a => a.id === appointmentId);
    if (idx === -1)
        return false;
    appointments.splice(idx, 1);
    return true;
};
export const updateAppointment = async (appointmentId, updates) => {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt)
        throw new Error('Appointment not found');
    // Only allow updating a small set of fields for the mock
    if (updates.date)
        appt.date = updates.date;
    if (updates.time)
        appt.time = updates.time;
    if (updates.consultingRoomName)
        appt.consultingRoomName = updates.consultingRoomName;
    if (updates.status)
        appt.status = updates.status;
    if (updates.doctorId)
        appt.doctorId = updates.doctorId;
    if (updates.specialty)
        appt.specialty = updates.specialty;
    return appt;
};
export const createMessage = async (senderId, data) => {
    const newMsg = Object.assign({ id: `msg-${Date.now()}`, senderId, timestamp: new Date().toISOString() }, data);
    messages.push(newMsg);
    return newMsg;
};
export const createClinicalNote = async (doctorId, data) => {
    const doctor = await findUserById(doctorId);
    const newNote = Object.assign({ id: `note-${Date.now()}`, doctorId, doctorName: doctor.name }, data);
    clinicalNotes.push(newNote);
    return newNote;
};
export const createLabTest = async (orderedById, data) => {
    const newTest = Object.assign({ id: `lab-${Date.now()}`, orderedById, status: 'Ordered' }, data);
    labTests.push(newTest);
    return newTest;
};
export const updateLabTest = async (id, status, result) => {
    const test = labTests.find(l => l.id === id);
    if (!test)
        throw new Error("Test not found");
    test.status = status;
    if (result)
        test.result = result;
    return test;
};
export const createPrescription = async (prescriberId, data) => {
    const newRx = Object.assign({ id: `rx-${Date.now()}`, prescriberId }, data);
    prescriptions.push(newRx);
    return newRx;
};
export const updatePrescription = async (id, status) => {
    const rx = prescriptions.find(p => p.id === id);
    if (!rx)
        throw new Error("Prescription not found");
    rx.status = status;
    return rx;
};
export const createReferral = async (fromDoctorId, data) => {
    const newRef = Object.assign({ id: `ref-${Date.now()}`, fromDoctorId }, data);
    referrals.push(newRef);
    return newRef;
};
export const checkInPatient = async (appointmentId) => {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt)
        throw new Error("Appointment not found");
    appt.status = 'Checked-in';
    // Add to triage queue
    triageQueue.push({
        appointmentId,
        patientId: appt.patientId,
        patientName: users.find(u => u.id === appt.patientId).name,
        arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        chiefComplaint: appt.specialty, // using specialty as a mock complaint
        priority: 'Medium',
    });
    return appt;
};
export const recordVitals = async (patientId, vitals) => {
    const triageIndex = triageQueue.findIndex(t => t.patientId === patientId);
    if (triageIndex > -1) {
        triageQueue.splice(triageIndex, 1);
    }
    // Persist vitals into patient record for demo purposes
    const patient = users.find(u => u.id === patientId);
    if (!patient)
        return;
    const entry = Object.assign({ timestamp: new Date().toISOString() }, vitals);
    if (!patient.vitalHistory)
        patient.vitalHistory = [];
    patient.vitalHistory.unshift(entry);
    // If patient is admitted, update inpatient current vitals
    if (patient.inpatientStay) {
        patient.inpatientStay.currentVitals = {
            heartRate: vitals.heartRate || patient.inpatientStay.currentVitals.heartRate,
            bloodPressure: vitals.bloodPressure || patient.inpatientStay.currentVitals.bloodPressure,
            respiratoryRate: vitals.respiratoryRate || patient.inpatientStay.currentVitals.respiratoryRate,
            spO2: vitals.spO2 || patient.inpatientStay.currentVitals.spO2
        };
        if (!patient.inpatientStay.vitalHistory)
            patient.inpatientStay.vitalHistory = [];
        patient.inpatientStay.vitalHistory.unshift({ timestamp: entry.timestamp, heartRate: entry.heartRate, bloodPressure: entry.bloodPressure, spO2: entry.spO2 });
    }
};
export const updateTransportRequest = async (id, status) => {
    const req = transportRequests.find(t => t.id === id);
    if (!req)
        throw new Error("Request not found");
    req.status = status;
    return req;
};
export const admitPatient = async (patientId, bedId, reason) => {
    const patient = users.find(u => u.id === patientId);
    const bed = beds.find(b => b.id === bedId);
    if (!patient || !bed || bed.isOccupied)
        throw new Error("Invalid patient or bed is occupied");
    const room = rooms.find(r => r.id === bed.roomId);
    if (!room)
        throw new Error("Bed is not in a valid room");
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
export const dischargePatient = async (patientId) => {
    const patient = users.find(u => u.id === patientId);
    if (!patient || !patient.inpatientStay)
        throw new Error("Patient not found or not admitted");
    const bed = beds.find(b => { var _a; return b.id === ((_a = patient.inpatientStay) === null || _a === void 0 ? void 0 : _a.bedId); });
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
export const createDepartment = async (name, organizationId) => {
    const newDept = { id: `dept-${Date.now()}`, name, organizationId };
    departments.push(newDept);
    return newDept;
};
export const createRoom = async (name, type, organizationId) => {
    const newRoom = { id: `room-${Date.now()}`, name, type, organizationId };
    rooms.push(newRoom);
    return newRoom;
};
export const createBed = async (name, roomId) => {
    const newBed = { id: `bed-${Date.now()}`, name, roomId, isOccupied: false };
    beds.push(newBed);
    return newBed;
};
export const addWearableDevice = async (patientId, device) => {
    const patient = users.find(u => u.id === patientId);
    if (!patient)
        throw new Error('Patient not found');
    if (!patient.wearableDevices)
        patient.wearableDevices = [];
    const newDevice = { id: `device-${Date.now()}`, name: device.name, type: device.type, addedAt: new Date().toISOString() };
    patient.wearableDevices.push(newDevice);
    return newDevice;
};
export const removeWearableDevice = async (patientId, deviceId) => {
    const patient = users.find(u => u.id === patientId);
    if (!patient)
        throw new Error('Patient not found');
    if (!patient.wearableDevices)
        return false;
    const idx = patient.wearableDevices.findIndex((d) => d.id === deviceId);
    if (idx === -1)
        return false;
    patient.wearableDevices.splice(idx, 1);
    return true;
};
//# sourceMappingURL=db.js.map
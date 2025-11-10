import bcrypt from 'bcryptjs';

const hashPasswordSync = bcrypt.hashSync;

// This function generates the initial seed data for the in-memory database.
export const seedData = () => {
    const password = hashPasswordSync('password123', 10);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const organizations = [
        { id: 'org-1', name: 'ChiHealth General Hospital', type: 'Hospital' as const, planId: 'professional' as const },
        { id: 'org-2', name: 'ChiHealth Clinic Ikoyi', type: 'Clinic' as const, planId: 'professional' as const, parentOrganizationId: 'org-1' },
    ];

    const departments = [
        { id: 'dept-1', name: 'Cardiology', organizationId: 'org-1' },
        { id: 'dept-2', name: 'Dermatology', organizationId: 'org-1' },
        { id: 'dept-3', name: 'General Practice', organizationId: 'org-1' },
        { id: 'dept-4', name: 'Neurology', organizationId: 'org-1' },
    ];

    const users = [
        // Patients
        {
            id: 'user-patient-01',
            name: 'Amina Bello',
            email: 'amina.bello@example.com',
            role: 'patient' as const,
            passwordHash: password,
            dateOfBirth: '1985-05-15',
            lastVisit: yesterday,
            organizations: [organizations[0]],
            currentOrganization: organizations[0],
            wearableData: [
                { timestamp: `${yesterday}T22:00:00Z`, heartRate: 65, steps: 8021, sleepHours: 7.5 },
                { timestamp: `${today}T09:00:00Z`, heartRate: 72, steps: 1234 },
            ],
            inpatientStay: undefined
        },
        {
            id: 'user-patient-02',
            name: 'Chinedu Eze',
            email: 'chinedu.eze@example.com',
            role: 'patient' as const,
            passwordHash: password,
            dateOfBirth: '1992-11-20',
            lastVisit: '2023-12-10',
            organizations: [organizations[0]],
            currentOrganization: organizations[0],
            inpatientStay: {
                roomNumber: '302',
                admissionDate: yesterday,
                bedId: 'bed-10',
                currentVitals: { heartRate: 88, bloodPressure: '130/85', respiratoryRate: 18, spO2: 97 },
                vitalHistory: [
                    { timestamp: `${today}T08:00:00Z`, heartRate: 90, bloodPressure: '132/86', spO2: 98 },
                    { timestamp: `${today}T08:05:00Z`, heartRate: 89, bloodPressure: '130/85', spO2: 97 },
                    { timestamp: `${today}T08:10:00Z`, heartRate: 88, bloodPressure: '130/85', spO2: 97 },
                ]
            }
        },
        // Staff
        { id: 'user-admin-01', name: 'Admin User', email: 'admin@chihealth.com', role: 'admin' as const, passwordHash: password, organizations: [organizations[0], organizations[1]], currentOrganization: organizations[0] },
        { id: 'user-cmd-01', name: 'Command Center', email: 'cmd@chihealth.com', role: 'command_center' as const, passwordHash: password, organizations: [organizations[0]], currentOrganization: organizations[0] },
        { id: 'user-hcw-01', name: 'Dr. Adebayo', email: 'dr.adebayo@chihealth.com', role: 'hcw' as const, passwordHash: password, organizations: [organizations[0], organizations[1]], currentOrganization: organizations[0], departmentIds: ['dept-1', 'dept-3'] },
        { id: 'user-nurse-01', name: 'Nurse Joy', email: 'nurse.joy@chihealth.com', role: 'nurse' as const, passwordHash: password, organizations: [organizations[0]], currentOrganization: organizations[0], departmentIds: ['dept-3'] },
        { id: 'user-pharma-01', name: 'Pharmacist Ken', email: 'pharma.ken@chihealth.com', role: 'pharmacist' as const, passwordHash: password, organizations: [organizations[0]], currentOrganization: organizations[0] },
        { id: 'user-lab-01', name: 'Lab Tech', email: 'lab.tech@chihealth.com', role: 'lab_technician' as const, passwordHash: password, organizations: [organizations[0]], currentOrganization: organizations[0] },
        { id: 'user-recep-01', name: 'Receptionist', email: 'receptionist@chihealth.com', role: 'receptionist' as const, passwordHash: password, organizations: [organizations[0]], currentOrganization: organizations[0] },
        { id: 'user-logist-01', name: 'Logistics Sam', email: 'logistics.sam@chihealth.com', role: 'logistics' as const, passwordHash: password, organizations: [organizations[0]], currentOrganization: organizations[0] },
        { id: 'user-hcw-02', name: 'Dr. Okoro', email: 'dr.okoro@chihealth.com', role: 'hcw' as const, passwordHash: password, organizations: [organizations[1]], currentOrganization: organizations[1], departmentIds: ['dept-2'] },
    ];
    
    const rooms = [
        { id: 'room-1', name: 'Consulting Room 1', type: 'Consulting Room' as const, organizationId: 'org-1' },
        { id: 'room-2', name: 'Consulting Room 2', type: 'Consulting Room' as const, organizationId: 'org-1' },
        { id: 'room-3', name: 'Room 301', type: 'Patient Room' as const, organizationId: 'org-1' },
        { id: 'room-4', name: 'Room 302', type: 'Patient Room' as const, organizationId: 'org-1' },
        { id: 'room-5', name: 'Operating Theater A', type: 'Operating Theater' as const, organizationId: 'org-1' },
    ];
    
    const appointments = [
        { id: 'appt-001', patientId: 'user-patient-01', doctorId: 'user-hcw-01', doctorName: 'Dr. Adebayo', date: today, time: '10:00', specialty: 'General Checkup', status: 'Confirmed' as const, consultingRoomId: 'room-1', consultingRoomName: 'Consulting Room 1' },
        { id: 'appt-002', patientId: 'user-patient-02', doctorId: 'user-hcw-01', doctorName: 'Dr. Adebayo', date: today, time: '11:30', specialty: 'Follow-up', status: 'Confirmed' as const, consultingRoomId: 'room-2', consultingRoomName: 'Consulting Room 2' },
        { id: 'appt-003', patientId: 'user-patient-01', doctorId: 'user-hcw-02', doctorName: 'Dr. Okoro', date: yesterday, time: '15:00', specialty: 'Dermatology', status: 'Completed' as const, consultingRoomId: 'room-1', consultingRoomName: 'Consulting Room 1' },
    ];

    const prescriptions = [
        { id: 'rx-001', patientId: 'user-patient-01', prescriberId: 'user-hcw-01', medication: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', startDate: '2023-01-15', status: 'Active' as const },
        { id: 'rx-002', patientId: 'user-patient-01', prescriberId: 'user-hcw-01', medication: 'Potassium Chloride', dosage: '20mEq', frequency: 'Once daily', startDate: '2023-01-15', status: 'Active' as const },
    ];

    const labTests = [
        { id: 'lab-001', patientId: 'user-patient-01', patientName: 'Amina Bello', orderedById: 'user-hcw-01', testName: 'Complete Blood Count (CBC)', dateOrdered: yesterday, result: 'WBC 5.4, RBC 4.5, HGB 14.1', status: 'Completed' as const },
        { id: 'lab-002', patientId: 'user-patient-02', patientName: 'Chinedu Eze', orderedById: 'user-hcw-01', testName: 'Basic Metabolic Panel (BMP)', dateOrdered: today, status: 'Ordered' as const },
    ];

    const clinicalNotes = [
        { id: 'note-001', patientId: 'user-patient-01', doctorId: 'user-hcw-01', doctorName: 'Dr. Adebayo', date: yesterday, content: 'Patient presented for annual checkup. Vitals stable. Discussed importance of medication adherence for hypertension.' },
    ];
    
    const messages = [
        { id: 'msg-001', senderId: 'user-hcw-01', senderName: 'Dr. Adebayo', recipientId: 'user-patient-01', patientId: 'user-patient-01', content: 'Your lab results are in and look good. We can discuss them at your next visit.', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ];

    const bills = [
        { id: 'bill-001', patientId: 'user-patient-01', date: yesterday, service: 'Dermatology Consultation', amount: 15000, status: 'Paid' as const },
        { id: 'bill-002', patientId: 'user-patient-01', date: today, service: 'General Checkup', amount: 10000, status: 'Due' as const },
    ];

    const triageQueue: any[] = [];
    
    const transportRequests = [
        {id: 'tr-001', type: 'Sample' as const, from: 'ChiHealth Clinic Ikoyi', to: 'ChiHealth General Hospital Lab', status: 'Pending' as const}
    ];

    const referrals: any[] = [];

    const beds = [
        // Beds for Room 301
        { id: 'bed-1', name: 'Bed 1', roomId: 'room-3', isOccupied: false },
        { id: 'bed-2', name: 'Bed 2', roomId: 'room-3', isOccupied: false },
        // Beds for Room 302
        { id: 'bed-9', name: 'Bed 1', roomId: 'room-4', isOccupied: false },
        { id: 'bed-10', name: 'Bed 2', roomId: 'room-4', isOccupied: true, patientId: 'user-patient-02', patientName: 'Chinedu Eze' },
    ];

    const activityLogs = [
        { id: 'act-1', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), type: 'INFO' as const, details: 'System maintenance scheduled for 2:00 AM.' },
        { id: 'act-2', timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(), type: 'ADMISSION' as const, details: 'Chinedu Eze admitted to room 302.' },
    ];

    return { users, organizations, appointments, prescriptions, labTests, clinicalNotes, messages, bills, triageQueue, transportRequests, referrals, departments, rooms, beds, activityLogs };
};
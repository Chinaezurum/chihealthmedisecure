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
                // 7 days of historical data for proper chart rendering
                { timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), heartRate: 68, steps: 8234, sleepHours: 7.2 },
                { timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), heartRate: 72, steps: 9821, sleepHours: 6.8 },
                { timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), heartRate: 65, steps: 7456, sleepHours: 8.1 },
                { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), heartRate: 70, steps: 10234, sleepHours: 7.5 },
                { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), heartRate: 69, steps: 8945, sleepHours: 7.0 },
                { timestamp: `${yesterday}T22:00:00Z`, heartRate: 65, steps: 8021, sleepHours: 7.5 },
                { timestamp: `${today}T09:00:00Z`, heartRate: 72, steps: 1234 },
            ],
            wearableDevices: [
                {
                    id: 'device-fitbit-01',
                    name: 'Fitbit Charge 5',
                    type: 'Fitness Tracker',
                    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    lastSync: new Date().toISOString()
                }
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
        { id: 'user-accountant-01', name: 'Finance Manager', email: 'accountant@chihealth.com', role: 'accountant' as const, passwordHash: password, organizations: [organizations[0]], currentOrganization: organizations[0] },
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

    // Billing System Data
    const billingCodes = [
        { id: 'bc-001', code: '99213', category: 'Consultation' as const, description: 'Office/Outpatient Visit - Moderate Complexity', price: 15000, insuranceCoverage: 70, isActive: true },
        { id: 'bc-002', code: '99214', category: 'Consultation' as const, description: 'Office/Outpatient Visit - High Complexity', price: 25000, insuranceCoverage: 70, isActive: true },
        { id: 'bc-003', code: '99215', category: 'Consultation' as const, description: 'Office/Outpatient Visit - Very High Complexity', price: 35000, insuranceCoverage: 70, isActive: true },
        { id: 'bc-004', code: '80053', category: 'Lab' as const, description: 'Comprehensive Metabolic Panel', price: 8000, insuranceCoverage: 80, isActive: true },
        { id: 'bc-005', code: '85025', category: 'Lab' as const, description: 'Complete Blood Count (CBC)', price: 5000, insuranceCoverage: 80, isActive: true },
        { id: 'bc-006', code: '71045', category: 'Imaging' as const, description: 'Chest X-Ray - Single View', price: 12000, insuranceCoverage: 75, isActive: true },
        { id: 'bc-007', code: '73610', category: 'Imaging' as const, description: 'Ankle X-Ray', price: 10000, insuranceCoverage: 75, isActive: true },
        { id: 'bc-008', code: '10060', category: 'Procedure' as const, description: 'Incision and Drainage - Simple', price: 18000, insuranceCoverage: 65, isActive: true },
        { id: 'bc-009', code: '12001', category: 'Procedure' as const, description: 'Simple Wound Repair', price: 20000, insuranceCoverage: 65, isActive: true },
        { id: 'bc-010', code: '90471', category: 'Procedure' as const, description: 'Immunization Administration', price: 3000, insuranceCoverage: 90, isActive: true },
        { id: 'bc-011', code: 'MED001', category: 'Medication' as const, description: 'Amoxicillin 500mg (30 tablets)', price: 2500, insuranceCoverage: 50, isActive: true },
        { id: 'bc-012', code: 'MED002', category: 'Medication' as const, description: 'Lisinopril 10mg (30 tablets)', price: 3500, insuranceCoverage: 50, isActive: true },
    ];

    const insuranceProviders = [
        { id: 'ins-prov-001', name: 'NHIS - National Health Insurance Scheme', code: 'NHIS', contactEmail: 'claims@nhis.gov.ng', contactPhone: '+234-800-123-4567', coveragePercentage: 70, isActive: true },
        { id: 'ins-prov-002', name: 'Hygeia HMO', code: 'HYGEIA', contactEmail: 'claims@hygeiahmo.com', contactPhone: '+234-1-270-2429', coveragePercentage: 75, isActive: true },
        { id: 'ins-prov-003', name: 'Reliance HMO', code: 'RELIANCE', contactEmail: 'claims@reliancehmo.com', contactPhone: '+234-700-7354-2623', coveragePercentage: 80, isActive: true },
    ];

    const patientInsurances = [
        { 
            id: 'pat-ins-001', 
            patientId: 'user-patient-01', 
            providerId: 'ins-prov-002', 
            providerName: 'Hygeia HMO',
            policyNumber: 'HYG-2024-001234', 
            groupNumber: 'GRP-CORP-789',
            coverageType: 'Partial' as const, 
            coveragePercentage: 75, 
            startDate: '2024-01-01', 
            isActive: true,
            verificationStatus: 'Verified' as const,
            lastVerified: today
        },
    ];

    // Update patient object with insurance
    const patient = users.find(u => u.id === 'user-patient-01');
    if (patient) {
        (patient as any).insurance = patientInsurances[0];
    }

    const pricingCatalogs = [
        {
            id: 'catalog-001',
            organizationId: 'org-1',
            name: 'Standard Pricing 2024',
            billingCodes: billingCodes,
            effectiveDate: '2024-01-01',
            isActive: true
        }
    ];

    const encounters = [
        {
            id: 'enc-001',
            patientId: 'user-patient-01',
            patientName: 'Amina Bello',
            doctorId: 'user-hcw-01',
            doctorName: 'Dr. Adebayo',
            appointmentId: 'appt-001',
            date: yesterday,
            chiefComplaint: 'Skin rash on arms',
            diagnosis: 'Contact dermatitis',
            servicesRendered: ['Physical examination', 'Consultation', 'Prescription'],
            billingCodes: [billingCodes[0], billingCodes[10]], // Consultation + Medication
            totalAmount: 17500,
            duration: 30,
            status: 'Billed' as const,
            billId: 'bill-001',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'enc-002',
            patientId: 'user-patient-01',
            patientName: 'Amina Bello',
            doctorId: 'user-hcw-01',
            doctorName: 'Dr. Adebayo',
            date: today,
            chiefComplaint: 'Routine checkup',
            diagnosis: 'General wellness examination',
            servicesRendered: ['Physical examination', 'Blood pressure check', 'Lab tests ordered'],
            billingCodes: [billingCodes[0], billingCodes[4]], // Consultation + CBC
            totalAmount: 20000,
            duration: 45,
            status: 'Submitted' as const,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
    ];

    const updatedBills = [
        { 
            id: 'bill-001', 
            patientId: 'user-patient-01',
            encounterId: 'enc-001',
            invoiceNumber: 'INV-00001234',
            date: yesterday, 
            service: 'Dermatology Consultation + Medication', 
            amount: 17500,
            subtotal: 17500,
            tax: 0,
            discount: 0,
            status: 'Paid' as const,
            paymentMethod: 'Insurance' as const,
            paymentType: 'Mixed' as const,
            insuranceCoverage: 12250, // 70% of 17500
            patientResponsibility: 5250,
            transactionId: 'TXN-2024-001',
            billingCodes: [billingCodes[0], billingCodes[10]],
            paidDate: yesterday,
            dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdBy: 'user-accountant-01',
            reviewedBy: 'user-accountant-01'
        },
        { 
            id: 'bill-002', 
            patientId: 'user-patient-01',
            invoiceNumber: 'INV-00001235',
            date: today, 
            service: 'General Checkup', 
            amount: 10000,
            subtotal: 10000,
            tax: 0,
            discount: 0,
            status: 'Due' as const,
            paymentType: 'Cash' as const,
            billingCodes: [billingCodes[0]],
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            createdBy: 'user-accountant-01'
        },
    ];

    const insuranceClaims = [
        {
            id: 'claim-001',
            billId: 'bill-001',
            patientId: 'user-patient-01',
            providerId: 'ins-prov-002',
            providerName: 'Hygeia HMO',
            policyNumber: 'HYG-2024-001234',
            claimAmount: 17500,
            approvedAmount: 12250,
            status: 'Approved' as const,
            submittedDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
            processedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            claimNumber: 'CLM-2024-0001'
        }
    ];

    const paymentTransactions = [
        {
            id: 'txn-001',
            billId: 'bill-001',
            amount: 5250, // Patient responsibility after insurance
            paymentMethod: 'Card' as const,
            transactionId: 'TXN-2024-001',
            status: 'Completed' as const,
            paymentDate: yesterday,
            processedBy: 'user-accountant-01',
            cardLast4: '4532'
        }
    ];

    return { 
        users, 
        organizations, 
        appointments, 
        prescriptions, 
        labTests, 
        clinicalNotes, 
        messages, 
        bills: updatedBills, 
        triageQueue, 
        transportRequests, 
        referrals, 
        departments, 
        rooms, 
        beds, 
        activityLogs,
        billingCodes,
        encounters,
        insuranceProviders,
        patientInsurances,
        insuranceClaims,
        paymentTransactions,
        pricingCatalogs
    };
};
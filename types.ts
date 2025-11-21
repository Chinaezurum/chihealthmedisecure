// Fix: Removed circular self-import of `UserRole`.
// types.ts

export type UserRole = 'patient' | 'hcw' | 'admin' | 'nurse' | 'pharmacist' | 'lab_technician' | 'receptionist' | 'logistics' | 'command_center' | 'accountant' | 'radiologist' | 'dietician' | 'it_support';

export interface Organization {
  id: string;
  name: string;
  type: 'Hospital' | 'Clinic' | 'Pharmacy' | 'Laboratory' | 'Headquarters';
  planId: 'basic' | 'professional' | 'enterprise';
  parentOrganizationId?: string;
  // Contact Information
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phoneNumbers?: string[]; // Multiple phone numbers
  emails?: string[]; // Multiple email addresses
  website?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string;
  organizations: Organization[];
  currentOrganization: Organization;
  inpatientStay?: InpatientStay;
  departmentIds?: string[];
  insurance?: PatientInsurance;
  // Staff member additional fields
  address?: string;
  phoneNumbers?: string[]; // Multiple phone numbers
  emails?: string[]; // Multiple email addresses
  certificationId?: string; // Professional certification/license number
  certificationStatus?: 'Active' | 'Expired' | 'Pending' | 'Suspended';
  certificationExpiry?: string; // ISO date string
  specialization?: string; // For clinical staff
  // MFA fields
  mfaEnabled?: boolean;
  mfaMethod?: 'totp' | 'webauthn' | 'both';
  mfaSecret?: string; // Encrypted TOTP secret
  webAuthnCredentials?: Array<{
    id: string;
    publicKey: string;
    counter: number;
    deviceName?: string;
    createdAt: string;
    lastUsed?: string;
  }>;
  backupCodes?: string[]; // Hashed backup codes
  mfaEnrolledAt?: string;
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  lastVisit: string;
  wearableData?: WearableDataPoint[];
  // Added fields used across UI and backend helpers
  vitalHistory?: any[];
  wearableDevices?: any[];
  insurance?: PatientInsurance;
}

export interface WearableDataPoint {
  timestamp: string;
  heartRate?: number;
  steps?: number;
  sleepHours?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  patientName?: string;
  date: string;
  time: string;
  specialty: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled' | 'Checked-in';
  consultingRoomId?: string;
  consultingRoomName?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  prescriberId: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  status: 'Active' | 'Inactive' | 'Filled';
}

export interface LabTest {
  id: string;
  patientId: string;
  patientName: string;
  orderedById: string;
  testName: string;
  dateOrdered: string;
  result?: string;
  status: 'Ordered' | 'In-progress' | 'Pending' | 'Completed' | 'Awaiting Pickup' | 'In Transit' | 'Delivered';
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  content: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  patientId?: string; // For patient-centric channels
  content: string;
  timestamp: string;
}

export interface Bill {
  id: string;
  patientId: string;
  encounterId?: string;
  invoiceNumber: string;
  date: string;
  service: string;
  amount: number;
  subtotal: number;
  tax: number;
  discount: number;
  status: 'Draft' | 'Pending' | 'Paid' | 'Due' | 'Overdue' | 'Cancelled';
  paymentMethod?: 'Cash' | 'Card' | 'Insurance' | 'Mobile Money';
  paymentType: 'Cash' | 'Insurance' | 'Mixed';
  insuranceCoverage?: number;
  patientResponsibility?: number;
  insuranceClaimId?: string;
  insuranceClaimStatus?: 'Pending' | 'Approved' | 'Denied' | 'Partial';
  transactionId?: string;
  billingCodes: BillingCode[];
  paidDate?: string;
  dueDate?: string;
  notes?: string;
  createdBy: string;
  reviewedBy?: string;
}

export interface TriageEntry {
  appointmentId: string;
  patientId: string;
  patientName: string;
  arrivalTime: string;
  chiefComplaint: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface Vitals {
    date: string;
    temperature: string;
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    notes?: string;
}

export interface TransportRequest {
    id: string;
    type: 'Sample' | 'Equipment' | 'Patient';
    from: string;
    to: string;
    status: 'Pending' | 'In-Transit' | 'Delivered' | 'Cancelled';
    description?: string;
    priority?: 'Normal' | 'Urgent' | 'Emergency';
    patientId?: string;
    patientName?: string;
    requestedById?: string;
    requestedByName?: string;
    contactPerson?: string;
    contactPhone?: string;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Referral {
    id: string;
    patientId: string;
    fromDoctorId: string;
    toSpecialty: string;
    toDepartment?: string; // Internal department referral
    toFacility?: string; // External facility referral
    facilityAddress?: string; // Address of external facility
    facilityContact?: string; // Contact info for external facility
    reason: string;
    date: string;
    status: 'Pending' | 'Accepted' | 'Completed';
}

export interface IncomingReferral {
    id: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    fromFacility: string;
    fromDoctor: string;
    fromDoctorContact: string;
    toOrganizationId: string;
    specialty: string;
    reason: string;
    transferNotes: string;
    medicalHistory?: string;
    currentMedications?: string;
    allergies?: string;
    vitalSigns?: string;
    labResults?: string;
    imagingReports?: string;
    urgencyLevel: 'Routine' | 'Urgent' | 'Emergency';
    referralDate: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Patient Registered';
    acceptedBy?: string;
    acceptedDate?: string;
    registeredPatientId?: string;
    responseNotes?: string;
}

export interface InterDepartmentalNote {
    id: string;
    patientId: string;
    patientName: string;
    fromRole: UserRole;
    fromUserId: string;
    fromUserName: string;
    toRole?: UserRole; // Can send to any role
    toUserId?: string; // Specific user or null for all in role
    toUserName?: string; // Name of recipient if specific
    relatedEntityId?: string; // Lab test ID, Prescription ID, etc.
    relatedEntityType?: 'lab' | 'prescription' | 'vitals' | 'general';
    subject: string;
    message: string;
    priority: 'Low' | 'Normal' | 'High';
    timestamp: string;
    isRead: boolean;
    organizationId: string; // For filtering by organization
}

export interface ExternalLabResult {
    id: string;
    patientId: string;
    patientName: string;
    labName: string;
    labContact: string;
    testName: string;
    result: string;
    resultDate: string;
    uploadedBy: string;
    uploadedDate: string;
    relatedLabTestId?: string;
    status: 'Pending Review' | 'Reviewed' | 'Integrated';
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// Gemini Service Specific Types

export interface TriageSuggestion {
  recommendation: 'self-care' | 'appointment';
  reasoning: string;
  specialty: string;
}

export interface PredictiveRiskResult {
  condition: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  justification: string;
}

export interface LifestyleRecommendation {
    category: 'Diet' | 'Exercise';
    recommendation: string;
    details: string;
}

export interface DiagnosticSuggestion {
    testName: string;
    reason: string;
}

export interface ReferralSuggestion {
    specialty: string;
    reason: string;
}

export interface CarePlan {
    lifestyleRecommendations: LifestyleRecommendation[];
    monitoringSuggestions: { parameter: string; frequency: string; notes: string }[];
    followUpAppointments: { specialty: string; timeframe: string; reason: string }[];
    diagnosticSuggestions?: DiagnosticSuggestion[];
}

export interface CarePlanAdherence {
    adherenceScore: number;
    comment: string;
    details: {
        category: string;
        target: string;
        status: 'On Track' | 'Needs Improvement' | 'Off Track';
    }[];
}

export interface VitalTrendAlert {
    alertType: 'critical' | 'warning';
    summary: string;
    details: string;
}

export interface PharmacySafetyCheckResult {
    status: 'pass' | 'warn';
    interactionSeverity?: 'Low' | 'Medium' | 'High';
    interactionDetails?: string;
    recommendation?: string;
}

export interface InpatientStay {
    roomNumber: string;
    admissionDate: string;
    dischargeDate?: string;
    bedId?: string;
    currentVitals: {
        heartRate: number;
        bloodPressure: string;
        respiratoryRate: number;
        spO2?: number;
    };
    vitalHistory: {
        timestamp: string;
        heartRate: number;
        bloodPressure: string;
        spO2?: number;
    }[];
}

// Facility & Command Center Types
export interface Department {
    id: string;
    name: string;
    organizationId: string;
}

export type RoomType = 'Patient Room' | 'Consulting Room' | 'Operating Theater' | 'Utility';

export interface Room {
    id: string;
    name: string;
    type: RoomType;
    organizationId: string;
}

export interface Bed {
    id: string;
    name: string; // e.g., "Bed 1", "Bed 2"
    roomId: string;
    isOccupied: boolean;
    patientId?: string;
    patientName?: string;
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    type: 'ADMISSION' | 'DISCHARGE' | 'ALERT' | 'INFO';
    details: string;
}

export interface CommandCenterData {
    beds: Bed[];
    rooms: Room[];
    activityLogs: ActivityLog[];
    patients: Patient[];
    kpis: {
        bedOccupancy: number;
        admissionsToday: number;
        dischargesToday: number;
        avgLengthOfStay: number;
        erWaitTime: number; // in minutes
    };
}


// Chat Interface Types
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}
export interface ChatMessage {
  role: MessageRole;
  content: string;
  imageUrl?: string;
}


// Auth Types
export interface PasswordStrengthResult {
  score: -1 | 0 | 1 | 2 | 3 | 4;
  hasLowerCase: boolean;
  hasUpperCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  isLongEnough: boolean;
}


// Toast Types
export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Billing and Insurance Types
export interface BillingCode {
  id: string;
  code: string; // e.g., "99213" (CPT-like)
  category: 'Consultation' | 'Procedure' | 'Lab' | 'Imaging' | 'Medication' | 'Other';
  description: string;
  price: number;
  insuranceCoverage: number; // Percentage covered by insurance (0-100)
  isActive: boolean;
}

export interface PricingCatalog {
  id: string;
  organizationId: string;
  name: string;
  billingCodes: BillingCode[];
  effectiveDate: string;
  expiryDate?: string;
  isActive: boolean;
}

export interface Encounter {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  date: string;
  chiefComplaint: string;
  diagnosis: string;
  servicesRendered: string[];
  billingCodes: BillingCode[];
  totalAmount: number;
  duration: number; // minutes
  notes?: string;
  status: 'Draft' | 'Submitted' | 'Billed' | 'Cancelled';
  billId?: string;
  createdAt: string;
}

export interface InsuranceProvider {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  contactPhone: string;
  coveragePercentage: number; // Default coverage
  isActive: boolean;
}

export interface PatientInsurance {
  id: string;
  patientId: string;
  providerId: string;
  providerName: string;
  policyNumber: string;
  groupNumber?: string;
  coverageType: 'Full' | 'Partial' | 'Basic';
  coveragePercentage: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  verificationStatus: 'Verified' | 'Pending' | 'Failed';
  lastVerified?: string;
}

export interface InsuranceClaim {
  id: string;
  billId: string;
  patientId: string;
  providerId: string;
  providerName: string;
  policyNumber: string;
  claimAmount: number;
  approvedAmount?: number;
  deniedAmount?: number;
  status: 'Submitted' | 'Pending' | 'Approved' | 'Partial' | 'Denied';
  submittedDate: string;
  processedDate?: string;
  denialReason?: string;
  claimNumber: string;
}

export interface PaymentTransaction {
  id: string;
  billId: string;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Insurance' | 'Mobile Money';
  transactionId: string;
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  paymentDate: string;
  processedBy: string;
  notes?: string;
  cardLast4?: string;
  mobileMoneyNumber?: string;
}

// Audit Log Types
export type AuditAction = 
  // User Management
  | 'user.create' | 'user.update' | 'user.delete' | 'user.suspend' | 'user.activate'
  | 'user.password_reset' | 'user.role_change' | 'user.permission_change'
  // Authentication
  | 'auth.login' | 'auth.logout' | 'auth.login_failed' | 'auth.session_timeout'
  | 'auth.mfa_enabled' | 'auth.mfa_disabled' | 'auth.password_change'
  // Data Access
  | 'data.patient_view' | 'data.patient_edit' | 'data.medical_record_view'
  | 'data.export' | 'data.bulk_export' | 'data.import' | 'data.bulk_import'
  // System Operations
  | 'system.backup_start' | 'system.backup_complete' | 'system.restore'
  | 'system.config_change' | 'system.maintenance_mode' | 'system.update'
  // Security
  | 'security.alert_resolve' | 'security.unauthorized_access' | 'security.permission_denied'
  | 'security.suspicious_activity' | 'security.policy_violation'
  // IT Operations
  | 'it.ticket_create' | 'it.ticket_resolve' | 'it.log_export' | 'it.report_generate'
  | 'it.user_export' | 'it.system_refresh'
  // Admin Operations
  | 'admin.org_create' | 'admin.org_update' | 'admin.org_delete'
  | 'admin.settings_change' | 'admin.report_view' | 'admin.dashboard_export'
  // Financial
  | 'finance.bill_create' | 'finance.bill_update' | 'finance.payment_process'
  | 'finance.refund' | 'finance.report_export';

export type AuditCategory = 'user' | 'auth' | 'data' | 'system' | 'security' | 'it' | 'admin' | 'finance';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  organizationId: string;
  organizationName: string;
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  resourceType?: string; // e.g., 'Patient', 'User', 'Bill', 'Report'
  resourceId?: string; // ID of the affected resource
  resourceName?: string; // Name/identifier of the resource
  description: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, { old: any; new: any }>; // For tracking field changes
  metadata?: Record<string, any>; // Additional context
  success: boolean;
  errorMessage?: string;
}

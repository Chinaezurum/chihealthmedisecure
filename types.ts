// Fix: Removed circular self-import of `UserRole`.
// types.ts

export type UserRole = 'patient' | 'hcw' | 'admin' | 'nurse' | 'pharmacist' | 'lab_technician' | 'receptionist' | 'logistics' | 'command_center';

export interface Organization {
  id: string;
  name: string;
  type: 'Hospital' | 'Clinic' | 'Pharmacy' | 'Laboratory' | 'Headquarters';
  planId: 'basic' | 'professional' | 'enterprise';
  parentOrganizationId?: string;
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
}

export interface Patient extends User {
  role: 'patient';
  dateOfBirth: string;
  lastVisit: string;
  wearableData?: WearableDataPoint[];
  // Added fields used across UI and backend helpers
  vitalHistory?: any[];
  wearableDevices?: any[];
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
  status: 'Ordered' | 'In-progress' | 'Completed' | 'Awaiting Pickup' | 'In Transit' | 'Delivered';
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
  date: string;
  service: string;
  amount: number;
  status: 'Paid' | 'Due';
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
}

export interface Referral {
    id: string;
    patientId: string;
    fromDoctorId: string;
    toSpecialty: string;
    reason: string;
    date: string;
    status: 'Pending' | 'Accepted' | 'Completed';
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

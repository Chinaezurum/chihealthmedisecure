/**
 * Input Validation Middleware
 * Comprehensive validation rules for all API endpoints
 */

import { body, param, query, ValidationChain } from 'express-validator';

// --- Authentication Validation ---

export const validateRegister: ValidationChain[] = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number')
    .matches(/[@$!%*?&#]/).withMessage('Password must contain special character'),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters')
    .escape(),
];

export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// --- Appointment Validation ---

export const validateAppointment: ValidationChain[] = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isString().trim().escape(),
  body('doctorId')
    .notEmpty().withMessage('Doctor ID is required')
    .isString().trim().escape(),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('time')
    .notEmpty().withMessage('Time is required')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format (HH:MM)'),
  body('type')
    .notEmpty().withMessage('Appointment type is required')
    .isIn(['Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Lab Test', 'Radiology'])
    .withMessage('Invalid appointment type'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes too long (max 1000 characters)')
    .escape(),
];

// --- Prescription Validation ---

export const validatePrescription: ValidationChain[] = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isString().trim().escape(),
  body('medication')
    .notEmpty().withMessage('Medication name is required')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Medication name must be 2-200 characters')
    .escape(),
  body('dosage')
    .notEmpty().withMessage('Dosage is required')
    .trim()
    .isLength({ max: 100 }).withMessage('Dosage too long')
    .escape(),
  body('frequency')
    .notEmpty().withMessage('Frequency is required')
    .trim()
    .isLength({ max: 100 }).withMessage('Frequency too long')
    .escape(),
  body('duration')
    .notEmpty().withMessage('Duration is required')
    .trim()
    .isLength({ max: 100 }).withMessage('Duration too long')
    .escape(),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Instructions too long (max 500 characters)')
    .escape(),
];

// --- Lab Test Validation ---

export const validateLabTest: ValidationChain[] = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isString().trim().escape(),
  body('testType')
    .notEmpty().withMessage('Test type is required')
    .trim()
    .isLength({ max: 200 }).withMessage('Test type too long')
    .escape(),
  body('priority')
    .optional()
    .isIn(['Routine', 'Urgent', 'STAT']).withMessage('Invalid priority'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes too long')
    .escape(),
];

// --- Clinical Notes Validation ---

export const validateClinicalNote: ValidationChain[] = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isString().trim().escape(),
  body('subjective')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Subjective section too long')
    .escape(),
  body('objective')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Objective section too long')
    .escape(),
  body('assessment')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Assessment section too long')
    .escape(),
  body('plan')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Plan section too long')
    .escape(),
];

// --- Message Validation ---

export const validateMessage: ValidationChain[] = [
  body('recipientId')
    .notEmpty().withMessage('Recipient ID is required')
    .isString().trim().escape(),
  body('content')
    .notEmpty().withMessage('Message content is required')
    .trim()
    .isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters')
    .escape(),
];

// --- Patient Search Validation ---

export const validatePatientSearch: ValidationChain[] = [
  query('q')
    .notEmpty().withMessage('Search query is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Query must be 2-100 characters')
    .escape(),
];

// --- ID Parameter Validation ---

export const validateId: ValidationChain[] = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .trim()
    .escape(),
];

// --- User Update Validation ---

export const validateUserUpdate: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters')
    .escape(),
  body('email')
    .optional()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number format')
    .isLength({ max: 20 }).withMessage('Phone number too long'),
];

// --- Billing Validation ---

export const validateBill: ValidationChain[] = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .isString().trim().escape(),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description too long')
    .escape(),
  body('items')
    .optional()
    .isArray().withMessage('Items must be an array'),
  body('items.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Item description too long')
    .escape(),
  body('items.*.amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Item amount must be positive'),
];

// --- Organization Switch Validation ---

export const validateOrgSwitch: ValidationChain[] = [
  body('organizationId')
    .notEmpty().withMessage('Organization ID is required')
    .isString().trim().escape(),
];

// --- MFA Validation ---

export const validateMfaToken: ValidationChain[] = [
  body('token')
    .notEmpty().withMessage('MFA token is required')
    .trim()
    .matches(/^\d{6}$/).withMessage('Invalid token format (must be 6 digits)'),
];

export const validateMfaSetup: ValidationChain[] = [
  body('secret')
    .notEmpty().withMessage('Secret is required')
    .trim()
    .isLength({ min: 16, max: 64 }).withMessage('Invalid secret length'),
];

// --- Staff Management Validation ---

export const validateStaff: ValidationChain[] = [
  body('name')
    .notEmpty().withMessage('Staff name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name contains invalid characters')
    .escape(),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['patient', 'hcw', 'nurse', 'admin', 'pharmacist', 'lab', 'receptionist', 'logistics', 'accountant', 'radiologist', 'dietician', 'it'])
    .withMessage('Invalid role'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Department name too long')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number format')
    .isLength({ max: 20 }).withMessage('Phone number too long'),
];

// --- Department Management Validation ---

export const validateDepartment: ValidationChain[] = [
  body('name')
    .notEmpty().withMessage('Department name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description too long')
    .escape(),
  body('headId')
    .optional()
    .trim()
    .escape(),
];

// --- Room Management Validation ---

export const validateRoom: ValidationChain[] = [
  body('roomNumber')
    .notEmpty().withMessage('Room number is required')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('Room number must be 1-20 characters')
    .escape(),
  body('type')
    .notEmpty().withMessage('Room type is required')
    .isIn(['ICU', 'General', 'Private', 'Emergency', 'Operating', 'Consultation'])
    .withMessage('Invalid room type'),
  body('departmentId')
    .optional()
    .trim()
    .escape(),
  body('floor')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Floor must be between 0-100'),
];

// --- Bed Management Validation ---

export const validateBed: ValidationChain[] = [
  body('bedNumber')
    .notEmpty().withMessage('Bed number is required')
    .trim()
    .isLength({ min: 1, max: 20 }).withMessage('Bed number must be 1-20 characters')
    .escape(),
  body('roomId')
    .notEmpty().withMessage('Room ID is required')
    .trim()
    .escape(),
  body('status')
    .optional()
    .isIn(['Available', 'Occupied', 'Maintenance', 'Reserved'])
    .withMessage('Invalid bed status'),
];

// --- Admission/Discharge Validation ---

export const validateAdmission: ValidationChain[] = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .trim()
    .escape(),
  body('bedId')
    .notEmpty().withMessage('Bed ID is required')
    .trim()
    .escape(),
  body('admissionReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Admission reason too long')
    .escape(),
  body('expectedDuration')
    .optional()
    .isInt({ min: 1 }).withMessage('Expected duration must be positive'),
];

export const validateDischarge: ValidationChain[] = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .trim()
    .escape(),
  body('dischargeReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Discharge reason too long')
    .escape(),
  body('followUpInstructions')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Follow-up instructions too long')
    .escape(),
];

// --- Referral Validation ---

export const validateReferral: ValidationChain[] = [
  body('patientId')
    .notEmpty().withMessage('Patient ID is required')
    .trim()
    .escape(),
  body('referralType')
    .notEmpty().withMessage('Referral type is required')
    .isIn(['Specialist', 'Hospital', 'Imaging', 'Laboratory', 'Therapy'])
    .withMessage('Invalid referral type'),
  body('reason')
    .notEmpty().withMessage('Referral reason is required')
    .trim()
    .isLength({ min: 10, max: 1000 }).withMessage('Reason must be 10-1000 characters')
    .escape(),
  body('urgency')
    .optional()
    .isIn(['Routine', 'Urgent', 'Emergency'])
    .withMessage('Invalid urgency level'),
];

// --- Billing Code Validation ---

export const validateBillingCode: ValidationChain[] = [
  body('code')
    .notEmpty().withMessage('Billing code is required')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Code must be 1-50 characters')
    .matches(/^[A-Z0-9\-\.]+$/).withMessage('Invalid code format')
    .escape(),
  body('description')
    .notEmpty().withMessage('Description is required')
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Description must be 5-500 characters')
    .escape(),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('category')
    .optional()
    .isIn(['Consultation', 'Procedure', 'Medication', 'Laboratory', 'Imaging', 'Room', 'Other'])
    .withMessage('Invalid category'),
];

// --- Lab Sample Validation ---

export const validateLabSample: ValidationChain[] = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['Collected', 'Processing', 'Completed', 'Rejected'])
    .withMessage('Invalid lab sample status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes too long')
    .escape(),
];

// --- Wearable Device Validation ---

export const validateWearableData: ValidationChain[] = [
  body('heartRate')
    .optional()
    .isInt({ min: 30, max: 300 }).withMessage('Heart rate must be 30-300 bpm'),
  body('bloodPressure')
    .optional()
    .matches(/^\d{2,3}\/\d{2,3}$/).withMessage('Invalid blood pressure format (e.g., 120/80)'),
  body('steps')
    .optional()
    .isInt({ min: 0, max: 1000000 }).withMessage('Steps must be 0-1,000,000'),
  body('sleepHours')
    .optional()
    .isFloat({ min: 0, max: 24 }).withMessage('Sleep hours must be 0-24'),
];

export const validateDevice: ValidationChain[] = [
  body('deviceType')
    .notEmpty().withMessage('Device type is required')
    .isIn(['Smartwatch', 'Fitness Tracker', 'Blood Pressure Monitor', 'Glucose Monitor', 'Other'])
    .withMessage('Invalid device type'),
  body('deviceName')
    .notEmpty().withMessage('Device name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Device name must be 2-100 characters')
    .escape(),
  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Serial number too long')
    .escape(),
];

// --- Organization Link Validation ---

export const validateOrgLink: ValidationChain[] = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .trim()
    .escape(),
  body('organizationId')
    .notEmpty().withMessage('Organization ID is required')
    .trim()
    .escape(),
  body('role')
    .optional()
    .isIn(['patient', 'hcw', 'nurse', 'admin', 'pharmacist', 'lab', 'receptionist', 'logistics', 'accountant', 'radiologist', 'dietician', 'it'])
    .withMessage('Invalid role'),
];

// --- Incoming Referral Validation ---

export const validateIncomingReferral: ValidationChain[] = [
  body('patientName')
    .notEmpty().withMessage('Patient name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
    .escape(),
  body('patientDOB')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('referringFacility')
    .notEmpty().withMessage('Referring facility is required')
    .trim()
    .isLength({ max: 200 }).withMessage('Facility name too long')
    .escape(),
  body('reason')
    .notEmpty().withMessage('Referral reason is required')
    .trim()
    .isLength({ min: 10, max: 2000 }).withMessage('Reason must be 10-2000 characters')
    .escape(),
];

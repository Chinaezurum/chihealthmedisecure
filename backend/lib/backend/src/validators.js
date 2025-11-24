/**
 * Input Validation Middleware
 * Comprehensive validation rules for all API endpoints
 */
import { body, param, query } from 'express-validator';
// --- Authentication Validation ---
export const validateRegister = [
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
export const validateLogin = [
    body('email')
        .isEmail().withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
];
// --- Appointment Validation ---
export const validateAppointment = [
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
export const validatePrescription = [
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
export const validateLabTest = [
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
export const validateClinicalNote = [
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
export const validateMessage = [
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
export const validatePatientSearch = [
    query('q')
        .notEmpty().withMessage('Search query is required')
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Query must be 2-100 characters')
        .escape(),
];
// --- ID Parameter Validation ---
export const validateId = [
    param('id')
        .notEmpty().withMessage('ID is required')
        .trim()
        .escape(),
];
// --- User Update Validation ---
export const validateUserUpdate = [
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
export const validateBill = [
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
export const validateOrgSwitch = [
    body('organizationId')
        .notEmpty().withMessage('Organization ID is required')
        .isString().trim().escape(),
];
// --- MFA Validation ---
export const validateMfaToken = [
    body('token')
        .notEmpty().withMessage('MFA token is required')
        .trim()
        .matches(/^\d{6}$/).withMessage('Invalid token format (must be 6 digits)'),
];
export const validateMfaSetup = [
    body('secret')
        .notEmpty().withMessage('Secret is required')
        .trim()
        .isLength({ min: 16, max: 64 }).withMessage('Invalid secret length'),
];
//# sourceMappingURL=validators.js.map
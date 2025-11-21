import { User, UserRole } from '../types.ts';

const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    'scheduling', 'ehr', 'prescribing', 'patient_portal', 'ai_summary',
    'role_hcw', 'role_receptionist', 'role_accountant', 'admin_dashboard',
  ],
  professional: [
    'scheduling', 'ehr', 'prescribing', 'patient_portal', 'ai_summary',
    'lab', 'pharmacy', 'inpatient', 'triage', 'ai_proactive_care', 'admin_dashboard',
    'role_hcw', 'role_receptionist', 'role_nurse', 'role_pharmacist', 'role_lab_technician', 'role_accountant',
  ],
  enterprise: [
    'scheduling', 'ehr', 'prescribing', 'patient_portal', 'ai_summary',
    'lab', 'pharmacy', 'inpatient', 'triage', 'ai_proactive_care', 'admin_dashboard',
    'logistics', 'data_io', 'audit_log', 'api_access', 'role_hcw', 'role_receptionist', 
    'role_nurse', 'role_pharmacist', 'role_lab_technician', 'role_logistics', 'role_admin', 'role_accountant',
    'multi_tenancy', 'staff_management',
  ],
};

// Plan-based limits for facility management
export const PLAN_LIMITS = {
  basic: {
    maxDepartments: 5,
    maxRooms: 10,
    maxBeds: 20,
    maxStaff: 10,
    maxFacilityLocations: 1,
    features: 'Core features only',
  },
  professional: {
    maxDepartments: 20,
    maxRooms: 50,
    maxBeds: 100,
    maxStaff: 50,
    maxFacilityLocations: 3,
    features: 'Advanced clinical modules',
  },
  enterprise: {
    maxDepartments: -1, // unlimited
    maxRooms: -1,
    maxBeds: -1,
    maxStaff: -1,
    maxFacilityLocations: -1,
    features: 'All features + customization',
  },
};

// Define permissions for each role (matches backend)
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  patient: [
    'view_own_appointments',
    'create_own_appointments',
    'cancel_own_appointments',
    'view_own_medical_records',
    'view_own_prescriptions',
    'view_own_lab_results',
    'view_own_bills',
    'make_own_payments',
    'video_call_with_hcw',
    'message_hcw',
  ],
  hcw: [
    'view_patient_list',
    'view_patient_records',
    'create_medical_notes',
    'create_prescriptions',
    'order_lab_tests',
    'create_referrals',
    'video_call_with_patient',
    'message_patient',
    'view_appointments',
    'update_appointments',
  ],
  nurse: [
    'view_patient_list',
    'view_patient_records',
    'create_medical_notes',
    'view_prescriptions',
    'administer_medications',
    'record_vitals',
    'triage_patients',
    'video_call_with_patient',
    'message_patient',
    'message_staff',
    'view_appointments',
  ],
  pharmacist: [
    'view_prescriptions',
    'dispense_medications',
    'manage_inventory',
    'view_dispensing_history',
    'create_drug_interactions',
    'message_hcw',
    'message_patient',
    'message_staff',
    'video_call_with_patient',
  ],
  lab_technician: [
    'view_lab_orders',
    'process_lab_tests',
    'upload_lab_results',
    'manage_lab_inventory',
    'message_hcw',
    'message_staff',
    'video_call_with_patient',
  ],
  receptionist: [
    'view_patient_list',
    'create_appointments',
    'update_appointments',
    'cancel_appointments',
    'register_patients',
    'check_in_patients',
    'view_schedules',
    'message_staff',
  ],
  accountant: [
    'view_all_bills',
    'create_bills',
    'process_payments',
    'view_transactions',
    'manage_insurance_claims',
    'view_financial_reports',
    'manage_billing_codes',
    'view_patient_billing_info',
  ],
  logistics: [
    'manage_inventory',
    'track_supplies',
    'create_purchase_orders',
    'view_supply_reports',
    'manage_vendors',
    'message_staff',
  ],
  admin: [
    'manage_users',
    'manage_staff',
    'manage_departments',
    'manage_organizations',
    'view_audit_logs',
    'manage_system_settings',
    'view_all_data',
    'export_data',
    'manage_roles',
    'view_analytics',
  ],
  command_center: [
    'view_all_organizations',
    'view_system_metrics',
    'view_all_data',
    'manage_subscriptions',
    'view_all_analytics',
    'system_administration',
  ],
  radiologist: [
    'view_patient_list',
    'view_patient_records',
    'view_imaging_studies',
    'create_radiology_reports',
    'message_patient',
    'message_staff',
    'view_appointments',
  ],
  dietician: [
    'view_patient_list',
    'view_patient_records',
    'create_nutrition_plans',
    'create_dietary_consultations',
    'message_patient',
    'message_staff',
    'view_appointments',
  ],
  it_support: [
    'view_system_logs',
    'manage_users',
    'view_user_list',
    'manage_system_settings',
    'view_security_alerts',
    'manage_backups',
    'view_system_status',
    'manage_support_tickets',
    'view_all_data',
    'system_administration',
    'view_audit_logs',
  ],
};

export const canCreateMore = (
  user: User | null,
  resourceType: 'departments' | 'rooms' | 'beds' | 'staff',
  currentCount: number
): { allowed: boolean; limit: number; message?: string } => {
  if (!user?.currentOrganization) {
    return { allowed: false, limit: 0, message: 'No organization context' };
  }

  const plan = user.currentOrganization.planId || 'basic';
  const limits = PLAN_LIMITS[plan];
  const limitKey = `max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}` as keyof typeof limits;
  const limit = limits[limitKey] as number;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1 };
  }

  const allowed = currentCount < limit;
  const message = allowed
    ? undefined
    : `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan limit reached (${limit} ${resourceType}). Upgrade to create more.`;

  return { allowed, limit, message };
};

export const getPlanLimits = (planId: 'basic' | 'professional' | 'enterprise') => {
  return PLAN_LIMITS[planId];
};

export const canAccessFeature = (user: User | null, feature: string): boolean => {
  if (!user) return false;
  
  if (user.currentOrganization?.type === 'Headquarters') {
    return true;
  }
  
  const plan = user.currentOrganization?.planId || 'basic';
  const allowedFeatures = PLAN_FEATURES[plan] || [];
  
  return allowedFeatures.includes(feature);
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  // Admin and command_center have all permissions
  if (user.role === 'admin' || user.role === 'command_center') return true;
  
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Check if user has specific role(s)
 */
export const hasRole = (user: User | null, roles: UserRole | UserRole[]): boolean => {
  if (!user) return false;
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.includes(user.role);
};

/**
 * Get all permissions for user's role
 */
export const getUserPermissions = (user: User | null): string[] => {
  if (!user) return [];
  return ROLE_PERMISSIONS[user.role] || [];
};

/**
 * Check if user can access another user's data
 */
export const canAccessUserData = (currentUser: User | null, targetUserId: string): boolean => {
  if (!currentUser) return false;
  
  // User can always access their own data
  if (currentUser.id === targetUserId) return true;
  
  // Admin and command_center can access all data
  if (currentUser.role === 'admin' || currentUser.role === 'command_center') return true;
  
  // Medical staff can access patient data
  if (['hcw', 'nurse', 'pharmacist', 'lab_technician'].includes(currentUser.role)) {
    return true; // Would need to check if target is a patient
  }
  
  return false;
};

/**
 * Warn about missing permissions (for debugging)
 */
export const warnMissingPermission = (user: User | null, permission: string): void => {
  if (!hasPermission(user, permission)) {
    console.warn(`Permission denied: User ${user?.id} (${user?.role}) lacks permission: ${permission}`);
  }
};

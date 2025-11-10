import { User } from '../types.ts';

const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    'scheduling', 'ehr', 'prescribing', 'patient_portal', 'ai_summary',
    'role_hcw', 'role_receptionist', 'admin_dashboard',
  ],
  professional: [
    'scheduling', 'ehr', 'prescribing', 'patient_portal', 'ai_summary',
    'lab', 'pharmacy', 'inpatient', 'triage', 'ai_proactive_care', 'admin_dashboard',
    'role_hcw', 'role_receptionist', 'role_nurse', 'role_pharmacist', 'role_lab_technician',
  ],
  enterprise: [
    'scheduling', 'ehr', 'prescribing', 'patient_portal', 'ai_summary',
    'lab', 'pharmacy', 'inpatient', 'triage', 'ai_proactive_care', 'admin_dashboard',
    'logistics', 'data_io', 'audit_log', 'api_access', 'role_hcw', 'role_receptionist', 
    'role_nurse', 'role_pharmacist', 'role_lab_technician', 'role_logistics', 'role_admin',
    'multi_tenancy'
  ],
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

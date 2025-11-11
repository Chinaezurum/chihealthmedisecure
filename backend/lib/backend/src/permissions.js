const PLAN_FEATURES = {
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
        'multi_tenancy', 'staff_management',
    ],
};
const canAccessFeature = (organization, feature) => {
    if (!organization)
        return false;
    if (organization.type === 'Headquarters')
        return true;
    const plan = organization.planId || 'basic';
    const allowedFeatures = PLAN_FEATURES[plan] || [];
    return allowedFeatures.includes(feature);
};
export const authorizeFeature = (feature) => (req, res, next) => {
    if (canAccessFeature(req.organizationContext, feature)) {
        return next();
    }
    return res.status(403).json({ message: `Forbidden: Your plan does not include the '${feature}' feature.` });
};
//# sourceMappingURL=permissions.js.map
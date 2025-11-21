// Define permissions for each role
const ROLE_PERMISSIONS = {
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
        'view_imaging_orders',
        'upload_imaging_results',
        'create_radiology_reports',
        'message_hcw',
        'message_staff',
    ],
    dietician: [
        'view_patient_list',
        'view_patient_records',
        'create_meal_plans',
        'view_nutritional_assessments',
        'message_hcw',
        'message_patient',
        'message_staff',
    ],
    it_support: [
        'view_system_logs',
        'manage_users',
        'view_audit_logs',
        'manage_technical_issues',
        'system_administration',
        'view_all_data',
        'export_data',
    ],
};
// Resource ownership checks
const OWNERSHIP_RULES = {
    appointment: (user, resourceId, resource) => {
        if (user.role === 'patient')
            return resource.patientId === user.id;
        if (user.role === 'hcw')
            return resource.hcwId === user.id;
        if (['receptionist', 'admin'].includes(user.role))
            return true;
        return false;
    },
    medical_record: (user, resourceId, resource) => {
        if (user.role === 'patient')
            return resource.patientId === user.id;
        if (['hcw', 'nurse', 'pharmacist', 'lab_technician'].includes(user.role))
            return true;
        return false;
    },
    bill: (user, resourceId, resource) => {
        if (user.role === 'patient')
            return resource.patientId === user.id;
        if (['accountant', 'admin'].includes(user.role))
            return true;
        return false;
    },
    prescription: (user, resourceId, resource) => {
        if (user.role === 'patient')
            return resource.patientId === user.id;
        if (['hcw', 'pharmacist', 'nurse'].includes(user.role))
            return true;
        return false;
    },
};
/**
 * Check if user has a specific permission
 */
export const hasPermission = (user, permission) => {
    if (!user)
        return false;
    // Admin and command_center have all permissions
    if (user.role === 'admin' || user.role === 'command_center')
        return true;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
};
/**
 * Middleware to require specific permission
 */
export const requirePermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        const permissions = Array.isArray(permission) ? permission : [permission];
        const hasAnyPermission = permissions.some(p => hasPermission(user, p));
        if (!hasAnyPermission) {
            console.warn(`RBAC: User ${user.id} (${user.role}) denied access - missing permission: ${permissions.join(' or ')}`);
            res.status(403).json({
                message: 'Access denied: Insufficient permissions',
                code: 'FORBIDDEN',
                requiredPermission: permissions,
                userRole: user.role
            });
            return;
        }
        next();
    };
};
/**
 * Middleware to require specific role(s)
 */
export const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
            return;
        }
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(user.role)) {
            console.warn(`RBAC: User ${user.id} (${user.role}) denied access - required role: ${allowedRoles.join(' or ')}`);
            res.status(403).json({
                message: 'Access denied: Insufficient role privileges',
                code: 'FORBIDDEN',
                requiredRole: allowedRoles,
                userRole: user.role
            });
            return;
        }
        next();
    };
};
/**
 * Check resource ownership
 */
export const checkOwnership = (resourceType, getResource) => {
    return async (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        // Admin and command_center bypass ownership checks
        if (user.role === 'admin' || user.role === 'command_center') {
            return next();
        }
        try {
            const resource = await getResource(req);
            if (!resource) {
                return res.status(404).json({
                    message: 'Resource not found',
                    code: 'NOT_FOUND'
                });
            }
            const ownershipCheck = OWNERSHIP_RULES[resourceType];
            if (!ownershipCheck) {
                console.warn(`RBAC: No ownership rule defined for resource type: ${resourceType}`);
                return next(); // Allow if no rule defined (fail open)
            }
            const hasOwnership = ownershipCheck(user, req.params.id || '', resource);
            if (!hasOwnership) {
                console.warn(`RBAC: User ${user.id} (${user.role}) denied access to ${resourceType} ${req.params.id} - not owner`);
                return res.status(403).json({
                    message: 'Access denied: You do not have access to this resource',
                    code: 'FORBIDDEN',
                    resourceType
                });
            }
            // Attach resource to request for use in handler
            req.resource = resource;
            next();
        }
        catch (error) {
            console.error(`RBAC: Error checking ownership:`, error);
            return res.status(500).json({
                message: 'Error checking resource access',
                code: 'INTERNAL_ERROR'
            });
        }
    };
};
/**
 * Ensure user can only access data from their organization
 */
export const requireSameOrganization = (req, res, next) => {
    var _a;
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
        });
    }
    // Command center can access all organizations
    if (user.role === 'command_center') {
        return next();
    }
    // Check if request includes organization context
    const requestOrgId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
    if (requestOrgId && requestOrgId !== ((_a = user.currentOrganization) === null || _a === void 0 ? void 0 : _a.id)) {
        console.warn(`RBAC: User ${user.id} attempted to access different organization ${requestOrgId}`);
        return res.status(403).json({
            message: 'Access denied: Cannot access resources from other organizations',
            code: 'FORBIDDEN'
        });
    }
    next();
};
/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role) => {
    return ROLE_PERMISSIONS[role] || [];
};
/**
 * Export for use in frontend
 */
export const canUserPerform = (user, action) => {
    if (!user)
        return false;
    return hasPermission(user, action);
};
//# sourceMappingURL=rbac.js.map
import { AuditLog, AuditAction, AuditCategory, AuditSeverity, User } from '../types.ts';

/**
 * Audit Service
 * Handles logging of all security-sensitive operations for compliance and security monitoring
 */

// In-memory storage for demo - will be replaced with database calls
let auditLogs: AuditLog[] = [];
let logIdCounter = 1;

/**
 * Get action category from action type
 */
const getActionCategory = (action: AuditAction): AuditCategory => {
  const prefix = action.split('.')[0];
  switch (prefix) {
    case 'user': return 'user';
    case 'auth': return 'auth';
    case 'data': return 'data';
    case 'system': return 'system';
    case 'security': return 'security';
    case 'it': return 'it';
    case 'admin': return 'admin';
    case 'finance': return 'finance';
    default: return 'system';
  }
};

/**
 * Get default severity for action type
 */
const getDefaultSeverity = (action: AuditAction): AuditSeverity => {
  // Critical actions
  if (action.includes('delete') || action.includes('suspend') || action === 'security.unauthorized_access') {
    return 'critical';
  }
  // High priority actions
  if (action.includes('password') || action.includes('permission') || action.includes('export') || action === 'auth.login_failed') {
    return 'high';
  }
  // Medium priority actions
  if (action.includes('update') || action.includes('change') || action.includes('resolve')) {
    return 'medium';
  }
  // Low priority actions (views, logins)
  return 'low';
};

/**
 * Create an audit log entry
 */
export const logAudit = (params: {
  user: User;
  action: AuditAction;
  description: string;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}): AuditLog => {
  const log: AuditLog = {
    id: `audit-${logIdCounter++}`,
    timestamp: new Date().toISOString(),
    userId: params.user.id,
    userEmail: params.user.email,
    userName: params.user.name,
    userRole: params.user.role,
    organizationId: params.user.currentOrganization.id,
    organizationName: params.user.currentOrganization.name,
    action: params.action,
    category: getActionCategory(params.action),
    severity: params.severity || getDefaultSeverity(params.action),
    description: params.description,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    resourceName: params.resourceName,
    changes: params.changes,
    metadata: params.metadata,
    success: params.success !== undefined ? params.success : true,
    errorMessage: params.errorMessage,
    ipAddress: params.ipAddress || 'Unknown',
    userAgent: params.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'),
  };

  auditLogs.unshift(log); // Add to beginning for chronological order
  
  // Keep only last 1000 logs in memory (will be handled by database in production)
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(0, 1000);
  }

  // In production, this would be an API call to store in database
  console.log('[AUDIT]', log);

  return log;
};

/**
 * User Management Audit Helpers
 */
export const logUserCreated = (user: User, targetUser: { id: string; name: string; email: string; role: string }) => {
  return logAudit({
    user,
    action: 'user.create',
    description: `Created user account: ${targetUser.name} (${targetUser.email})`,
    severity: 'high',
    resourceType: 'User',
    resourceId: targetUser.id,
    resourceName: targetUser.email,
    metadata: { role: targetUser.role }
  });
};

export const logUserUpdated = (user: User, targetUserId: string, targetUserEmail: string, changes: Record<string, { old: any; new: any }>) => {
  return logAudit({
    user,
    action: 'user.update',
    description: `Updated user account: ${targetUserEmail}`,
    severity: 'medium',
    resourceType: 'User',
    resourceId: targetUserId,
    resourceName: targetUserEmail,
    changes
  });
};

export const logUserSuspended = (user: User, targetUserId: string, targetUserEmail: string) => {
  return logAudit({
    user,
    action: 'user.suspend',
    description: `Suspended user account: ${targetUserEmail}`,
    severity: 'critical',
    resourceType: 'User',
    resourceId: targetUserId,
    resourceName: targetUserEmail
  });
};

export const logUserActivated = (user: User, targetUserId: string, targetUserEmail: string) => {
  return logAudit({
    user,
    action: 'user.activate',
    description: `Activated user account: ${targetUserEmail}`,
    severity: 'high',
    resourceType: 'User',
    resourceId: targetUserId,
    resourceName: targetUserEmail
  });
};

export const logPasswordReset = (user: User, targetUserId: string, targetUserEmail: string) => {
  return logAudit({
    user,
    action: 'user.password_reset',
    description: `Initiated password reset for: ${targetUserEmail}`,
    severity: 'high',
    resourceType: 'User',
    resourceId: targetUserId,
    resourceName: targetUserEmail
  });
};

/**
 * Authentication Audit Helpers
 */
export const logLogin = (user: User, ipAddress?: string) => {
  return logAudit({
    user,
    action: 'auth.login',
    description: `User logged in successfully`,
    severity: 'low',
    ipAddress
  });
};

export const logLoginFailed = (email: string, reason: string, ipAddress?: string) => {
  // Create a minimal user object for failed login
  const tempUser: User = {
    id: 'unknown',
    name: 'Unknown User',
    email,
    role: 'patient',
    organizations: [],
    currentOrganization: { id: 'unknown', name: 'Unknown', type: 'Hospital', planId: 'basic' }
  };
  
  return logAudit({
    user: tempUser,
    action: 'auth.login_failed',
    description: `Failed login attempt for ${email}: ${reason}`,
    severity: 'high',
    success: false,
    errorMessage: reason,
    ipAddress
  });
};

export const logLogout = (user: User) => {
  return logAudit({
    user,
    action: 'auth.logout',
    description: `User logged out`,
    severity: 'low'
  });
};

/**
 * Data Access Audit Helpers
 */
export const logPatientView = (user: User, patientId: string, patientName: string) => {
  return logAudit({
    user,
    action: 'data.patient_view',
    description: `Viewed patient record: ${patientName}`,
    severity: 'medium',
    resourceType: 'Patient',
    resourceId: patientId,
    resourceName: patientName
  });
};

export const logDataExport = (user: User, exportType: string, recordCount: number) => {
  return logAudit({
    user,
    action: 'data.export',
    description: `Exported ${exportType} data (${recordCount} records)`,
    severity: 'high',
    resourceType: exportType,
    metadata: { recordCount }
  });
};

export const logBulkExport = (user: User, modules: string[], recordCount: number) => {
  return logAudit({
    user,
    action: 'data.bulk_export',
    description: `Bulk export of ${modules.join(', ')} (${recordCount} total records)`,
    severity: 'critical',
    metadata: { modules, recordCount }
  });
};

export const logDataImport = (user: User, importType: string, successCount: number, failedCount: number) => {
  return logAudit({
    user,
    action: 'data.import',
    description: `Imported ${importType} data: ${successCount} successful, ${failedCount} failed`,
    severity: 'high',
    resourceType: importType,
    metadata: { successCount, failedCount },
    success: failedCount === 0
  });
};

/**
 * System Operations Audit Helpers
 */
export const logBackupStart = (user: User, backupType: string) => {
  return logAudit({
    user,
    action: 'system.backup_start',
    description: `Started ${backupType} backup`,
    severity: 'medium',
    metadata: { backupType }
  });
};

export const logBackupComplete = (user: User, backupId: string, size: string) => {
  return logAudit({
    user,
    action: 'system.backup_complete',
    description: `Backup completed (${size})`,
    severity: 'low',
    resourceId: backupId,
    metadata: { size }
  });
};

export const logSystemConfigChange = (user: User, configKey: string, oldValue: any, newValue: any) => {
  return logAudit({
    user,
    action: 'system.config_change',
    description: `Changed system configuration: ${configKey}`,
    severity: 'critical',
    changes: { [configKey]: { old: oldValue, new: newValue } }
  });
};

/**
 * Security Audit Helpers
 */
export const logSecurityAlertResolved = (user: User, alertId: string, alertType: string) => {
  return logAudit({
    user,
    action: 'security.alert_resolve',
    description: `Resolved security alert: ${alertType}`,
    severity: 'medium',
    resourceId: alertId,
    metadata: { alertType }
  });
};

export const logUnauthorizedAccess = (user: User, resource: string, requiredPermission: string) => {
  return logAudit({
    user,
    action: 'security.unauthorized_access',
    description: `Unauthorized access attempt to ${resource} (requires: ${requiredPermission})`,
    severity: 'critical',
    success: false,
    metadata: { resource, requiredPermission }
  });
};

/**
 * IT Operations Audit Helpers
 */
export const logReportGenerated = (user: User, reportType: string) => {
  return logAudit({
    user,
    action: 'it.report_generate',
    description: `Generated ${reportType} report`,
    severity: 'low',
    metadata: { reportType }
  });
};

export const logSystemLogsExported = (user: User, logCount: number) => {
  return logAudit({
    user,
    action: 'it.log_export',
    description: `Exported system logs (${logCount} entries)`,
    severity: 'high',
    metadata: { logCount }
  });
};

export const logUsersExported = (user: User, userCount: number) => {
  return logAudit({
    user,
    action: 'it.user_export',
    description: `Exported user list (${userCount} users)`,
    severity: 'high',
    metadata: { userCount }
  });
};

/**
 * Admin Operations Audit Helpers
 */
export const logOrganizationCreated = (user: User, orgId: string, orgName: string) => {
  return logAudit({
    user,
    action: 'admin.org_create',
    description: `Created organization: ${orgName}`,
    severity: 'critical',
    resourceType: 'Organization',
    resourceId: orgId,
    resourceName: orgName
  });
};

export const logSettingsChanged = (user: User, settingName: string, changes: Record<string, { old: any; new: any }>) => {
  return logAudit({
    user,
    action: 'admin.settings_change',
    description: `Changed settings: ${settingName}`,
    severity: 'high',
    changes
  });
};

export const logDashboardExport = (user: User, dashboardType: string) => {
  return logAudit({
    user,
    action: 'admin.dashboard_export',
    description: `Exported ${dashboardType} dashboard data`,
    severity: 'medium',
    metadata: { dashboardType }
  });
};

/**
 * Query audit logs
 */
export const getAuditLogs = (filters?: {
  userId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): AuditLog[] => {
  let filtered = [...auditLogs];

  if (filters?.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId);
  }
  if (filters?.action) {
    filtered = filtered.filter(log => log.action === filters.action);
  }
  if (filters?.category) {
    filtered = filtered.filter(log => log.category === filters.category);
  }
  if (filters?.severity) {
    filtered = filtered.filter(log => log.severity === filters.severity);
  }
  if (filters?.startDate) {
    filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
  }

  const limit = filters?.limit || 100;
  return filtered.slice(0, limit);
};

/**
 * Get audit statistics
 */
export const getAuditStats = () => {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const recentLogs = auditLogs.filter(log => log.timestamp >= last24h);
  const weekLogs = auditLogs.filter(log => log.timestamp >= last7d);

  return {
    total: auditLogs.length,
    last24Hours: recentLogs.length,
    last7Days: weekLogs.length,
    bySeverity: {
      critical: auditLogs.filter(log => log.severity === 'critical').length,
      high: auditLogs.filter(log => log.severity === 'high').length,
      medium: auditLogs.filter(log => log.severity === 'medium').length,
      low: auditLogs.filter(log => log.severity === 'low').length,
    },
    byCategory: {
      user: auditLogs.filter(log => log.category === 'user').length,
      auth: auditLogs.filter(log => log.category === 'auth').length,
      data: auditLogs.filter(log => log.category === 'data').length,
      system: auditLogs.filter(log => log.category === 'system').length,
      security: auditLogs.filter(log => log.category === 'security').length,
      it: auditLogs.filter(log => log.category === 'it').length,
      admin: auditLogs.filter(log => log.category === 'admin').length,
      finance: auditLogs.filter(log => log.category === 'finance').length,
    },
    failedActions: auditLogs.filter(log => !log.success).length,
  };
};

/**
 * Export audit logs to CSV
 */
export const exportAuditLogsToCSV = (logs: AuditLog[]): string => {
  const headers = [
    'Timestamp',
    'User',
    'Email',
    'Role',
    'Organization',
    'Action',
    'Category',
    'Severity',
    'Description',
    'Resource Type',
    'Resource ID',
    'Success',
    'IP Address',
    'Error Message'
  ];

  const rows = logs.map(log => [
    log.timestamp,
    log.userName,
    log.userEmail,
    log.userRole,
    log.organizationName,
    log.action,
    log.category,
    log.severity,
    `"${log.description}"`,
    log.resourceType || '',
    log.resourceId || '',
    log.success ? 'Yes' : 'No',
    log.ipAddress || '',
    log.errorMessage ? `"${log.errorMessage}"` : ''
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

// Initialize with some sample audit logs for demo
const initializeSampleLogs = () => {
  const sampleUser: User = {
    id: 'user-admin-01',
    name: 'John Admin',
    email: 'admin@chihealth.com',
    role: 'admin',
    organizations: [{ id: 'org-1', name: 'ChiHealth General Hospital', type: 'Hospital', planId: 'enterprise' }],
    currentOrganization: { id: 'org-1', name: 'ChiHealth General Hospital', type: 'Hospital', planId: 'enterprise' }
  };

  const itUser: User = {
    id: 'user-it-01',
    name: 'IT Support Admin',
    email: 'it@chihealth.com',
    role: 'it_support',
    organizations: [{ id: 'org-1', name: 'ChiHealth General Hospital', type: 'Hospital', planId: 'enterprise' }],
    currentOrganization: { id: 'org-1', name: 'ChiHealth General Hospital', type: 'Hospital', planId: 'enterprise' }
  };

  // Sample audit logs
  logLogin(sampleUser, '192.168.1.100');
  logPatientView(sampleUser, 'patient-123', 'John Doe');
  logDataExport(sampleUser, 'Patients', 150);
  logUserSuspended(itUser, 'user-123', 'suspicious@email.com');
  logSecurityAlertResolved(itUser, 'alert-1', 'Multiple Failed Logins');
  logBackupStart(itUser, 'Full');
  logReportGenerated(itUser, 'System Uptime');
  logDashboardExport(sampleUser, 'Admin Dashboard');
  logLoginFailed('hacker@bad.com', 'Invalid credentials', '192.168.1.45');
  logUnauthorizedAccess(sampleUser, 'System Configuration', 'system_administration');
};

// Initialize sample logs
if (auditLogs.length === 0) {
  initializeSampleLogs();
}

export default {
  logAudit,
  logUserCreated,
  logUserUpdated,
  logUserSuspended,
  logUserActivated,
  logPasswordReset,
  logLogin,
  logLoginFailed,
  logLogout,
  logPatientView,
  logDataExport,
  logBulkExport,
  logDataImport,
  logBackupStart,
  logBackupComplete,
  logSystemConfigChange,
  logSecurityAlertResolved,
  logUnauthorizedAccess,
  logReportGenerated,
  logSystemLogsExported,
  logUsersExported,
  logOrganizationCreated,
  logSettingsChanged,
  logDashboardExport,
  getAuditLogs,
  getAuditStats,
  exportAuditLogsToCSV
};

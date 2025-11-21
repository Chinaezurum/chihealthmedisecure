import React, { useState } from 'react';
import { User } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { Button } from '../../components/common/Button.tsx';
import * as Icons from '../../components/icons/index.tsx';
import { SettingsView } from '../common/SettingsView.tsx';
import { getAuditLogs, getAuditStats, exportAuditLogsToCSV, logPasswordReset, logUserSuspended, logUserActivated, logUsersExported, logSystemLogsExported, logReportGenerated, logDataExport } from '../../services/auditService.ts';
import { AuditCategory, AuditSeverity } from '../../types.ts';

interface ITDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

type ITView = 'overview' | 'systems' | 'users' | 'security' | 'backups' | 'support' | 'logs' | 'reports' | 'audit' | 'settings';

interface SystemStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'maintenance';
  uptime: string;
  lastChecked: string;
  responseTime?: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignedTo?: string;
  createdAt: string;
  description: string;
}

interface SecurityAlert {
  id: string;
  type: 'login-failure' | 'unauthorized-access' | 'data-breach' | 'malware' | 'policy-violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface BackupStatus {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'completed' | 'in-progress' | 'failed' | 'scheduled';
  startTime: string;
  endTime?: string;
  size?: string;
  location: string;
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  failedAttempts: number;
  accountCreated: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'system' | 'security' | 'database' | 'application' | 'network';
  message: string;
  source: string;
  details?: string;
}

interface ITReport {
  id: string;
  type: 'uptime' | 'security-audit' | 'user-activity' | 'backup-status';
  title: string;
  description: string;
  generated: string;
  status: 'ready' | 'generating' | 'scheduled';
}

const Sidebar: React.FC<{ 
  activeView: ITView; 
  setActiveView: (view: ITView) => void;
  alertCount: number;
  ticketCount: number;
}> = ({ activeView, setActiveView, alertCount, ticketCount }) => {
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: Icons.LayoutDashboardIcon, count: 0 },
    { id: 'systems', label: 'System Status', icon: Icons.ActivityIcon, count: 0 },
    { id: 'users', label: 'User Management', icon: Icons.UsersIcon, count: 0 },
    { id: 'security', label: 'Security Alerts', icon: Icons.ShieldCheckIcon, count: alertCount },
    { id: 'backups', label: 'Backups & Recovery', icon: Icons.DatabaseIcon, count: 0 },
    { id: 'support', label: 'Support Tickets', icon: Icons.MessageSquareIcon, count: ticketCount },
    { id: 'logs', label: 'System Logs', icon: Icons.FileTextIcon, count: 0 },
    { id: 'audit', label: 'Audit Logs', icon: Icons.ClipboardListIcon, count: 0 },
    { id: 'reports', label: 'Reports', icon: Icons.BarChart3Icon, count: 0 },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button 
      onClick={() => setActiveView(item.id as ITView)} 
      className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}
    >
      <item.icon />
      <span>{item.label}</span>
      {item.count > 0 && (
        <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
          {item.count}
        </span>
      )}
    </button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('overview')} className="sidebar-logo-button">
        <Logo />
        <h1>ChiHealth</h1>
      </button>
      <nav className="flex-1 space-y-1">
        {navItems.map(item => <NavLink key={item.id} item={item} />)}
      </nav>
      <div>
        <button 
          onClick={() => setActiveView('settings')} 
          className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}
        >
          <Icons.SettingsIcon />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

const ITDashboard: React.FC<ITDashboardProps> = ({ user, onSignOut, onSwitchOrganization, theme, toggleTheme }) => {
  const [activeView, setActiveView] = useState<ITView>('overview');
  const { addToast } = useToasts();

  // Mock data
  const systems: SystemStatus[] = [
    { id: '1', name: 'EHR System', status: 'operational', uptime: '99.98%', lastChecked: new Date().toISOString(), responseTime: '120ms' },
    { id: '2', name: 'Database Cluster', status: 'operational', uptime: '99.95%', lastChecked: new Date().toISOString(), responseTime: '45ms' },
    { id: '3', name: 'Authentication Service', status: 'operational', uptime: '100%', lastChecked: new Date().toISOString(), responseTime: '80ms' },
    { id: '4', name: 'File Storage', status: 'degraded', uptime: '98.5%', lastChecked: new Date().toISOString(), responseTime: '350ms' },
    { id: '5', name: 'Email Service', status: 'operational', uptime: '99.9%', lastChecked: new Date().toISOString(), responseTime: '200ms' },
    { id: '6', name: 'Backup System', status: 'maintenance', uptime: '99.0%', lastChecked: new Date().toISOString() },
  ];

  const [tickets] = useState<SupportTicket[]>([
    { id: '1', ticketNumber: 'TKT-2025-001', title: 'Cannot access patient records', department: 'Cardiology', priority: 'high', status: 'in-progress', assignedTo: 'IT Support', createdAt: new Date(Date.now() - 3600000).toISOString(), description: 'Dr. Smith unable to access patient EHR' },
    { id: '2', ticketNumber: 'TKT-2025-002', title: 'Printer not working', department: 'Pharmacy', priority: 'medium', status: 'open', createdAt: new Date(Date.now() - 7200000).toISOString(), description: 'Prescription printer offline' },
    { id: '3', ticketNumber: 'TKT-2025-003', title: 'Slow system performance', department: 'Lab', priority: 'medium', status: 'in-progress', assignedTo: user.name, createdAt: new Date(Date.now() - 10800000).toISOString(), description: 'Lab test entry system running slowly' },
    { id: '4', ticketNumber: 'TKT-2025-004', title: 'Password reset request', department: 'Reception', priority: 'low', status: 'resolved', createdAt: new Date(Date.now() - 14400000).toISOString(), description: 'User forgot password' },
  ]);

  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([
    { id: '1', type: 'login-failure', severity: 'medium', message: 'Multiple failed login attempts from IP 192.168.1.45', timestamp: new Date(Date.now() - 1800000).toISOString(), resolved: false },
    { id: '2', type: 'unauthorized-access', severity: 'high', message: 'Unauthorized access attempt to admin panel', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: false },
    { id: '3', type: 'policy-violation', severity: 'low', message: 'User accessed system outside work hours', timestamp: new Date(Date.now() - 7200000).toISOString(), resolved: true },
  ]);

  const backups: BackupStatus[] = [
    { id: '1', type: 'full', status: 'completed', startTime: new Date(Date.now() - 86400000).toISOString(), endTime: new Date(Date.now() - 82800000).toISOString(), size: '45.2 GB', location: 'AWS S3 Backup' },
    { id: '2', type: 'incremental', status: 'completed', startTime: new Date(Date.now() - 43200000).toISOString(), endTime: new Date(Date.now() - 41400000).toISOString(), size: '2.8 GB', location: 'AWS S3 Backup' },
    { id: '3', type: 'incremental', status: 'in-progress', startTime: new Date(Date.now() - 1800000).toISOString(), location: 'AWS S3 Backup' },
  ];

  const [systemUsers] = useState<SystemUser[]>([
    { id: '1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@chihealth.com', role: 'healthcare_worker', department: 'Cardiology', status: 'active', lastLogin: new Date(Date.now() - 1800000).toISOString(), failedAttempts: 0, accountCreated: '2024-01-15' },
    { id: '2', name: 'John Admin', email: 'admin@chihealth.com', role: 'admin', department: 'Administration', status: 'active', lastLogin: new Date(Date.now() - 3600000).toISOString(), failedAttempts: 0, accountCreated: '2023-12-01' },
    { id: '3', name: 'Mary Nurse', email: 'mary.nurse@chihealth.com', role: 'nurse', department: 'Emergency', status: 'active', lastLogin: new Date(Date.now() - 7200000).toISOString(), failedAttempts: 0, accountCreated: '2024-03-10' },
    { id: '4', name: 'Tom Pharmacist', email: 'tom.pharm@chihealth.com', role: 'pharmacist', department: 'Pharmacy', status: 'active', lastLogin: new Date(Date.now() - 14400000).toISOString(), failedAttempts: 0, accountCreated: '2024-02-20' },
    { id: '5', name: 'Jane Smith', email: 'jane.smith@chihealth.com', role: 'receptionist', department: 'Front Desk', status: 'inactive', lastLogin: new Date(Date.now() - 604800000).toISOString(), failedAttempts: 3, accountCreated: '2024-01-05' },
    { id: '6', name: 'Dr. Michael Chen', email: 'michael.chen@chihealth.com', role: 'healthcare_worker', department: 'Radiology', status: 'active', lastLogin: new Date(Date.now() - 10800000).toISOString(), failedAttempts: 0, accountCreated: '2024-04-01' },
    { id: '7', name: 'Lisa Lab Tech', email: 'lisa.lab@chihealth.com', role: 'lab_tech', department: 'Laboratory', status: 'suspended', lastLogin: new Date(Date.now() - 1209600000).toISOString(), failedAttempts: 5, accountCreated: '2024-01-25' },
  ]);

  const [systemLogs] = useState<SystemLog[]>([
    { id: '1', timestamp: new Date(Date.now() - 300000).toISOString(), level: 'info', category: 'system', message: 'Database backup completed successfully', source: 'Backup Service', details: 'Full backup: 45.2 GB' },
    { id: '2', timestamp: new Date(Date.now() - 600000).toISOString(), level: 'warning', category: 'security', message: 'Failed login attempt detected', source: 'Authentication Service', details: 'User: jane.smith@chihealth.com, IP: 192.168.1.45' },
    { id: '3', timestamp: new Date(Date.now() - 900000).toISOString(), level: 'error', category: 'application', message: 'API timeout on patient records endpoint', source: 'EHR System', details: 'Endpoint: /api/patients/123, Duration: 30s' },
    { id: '4', timestamp: new Date(Date.now() - 1200000).toISOString(), level: 'info', category: 'database', message: 'Database connection pool resized', source: 'Database Manager', details: 'New size: 100 connections' },
    { id: '5', timestamp: new Date(Date.now() - 1500000).toISOString(), level: 'critical', category: 'system', message: 'File storage reaching capacity', source: 'Storage Monitor', details: 'Usage: 92% of 500GB' },
    { id: '6', timestamp: new Date(Date.now() - 1800000).toISOString(), level: 'info', category: 'network', message: 'Network latency within normal range', source: 'Network Monitor', details: 'Average: 45ms' },
    { id: '7', timestamp: new Date(Date.now() - 2100000).toISOString(), level: 'warning', category: 'security', message: 'Unusual access pattern detected', source: 'Security Monitor', details: 'User accessing 50+ patient records in 5 minutes' },
    { id: '8', timestamp: new Date(Date.now() - 2400000).toISOString(), level: 'info', category: 'application', message: 'System health check passed', source: 'Health Check Service', details: 'All services operational' },
  ]);

  const [reports] = useState<ITReport[]>([
    { id: '1', type: 'uptime', title: 'Monthly System Uptime Report', description: 'Comprehensive uptime statistics for all systems', generated: new Date(Date.now() - 86400000).toISOString(), status: 'ready' },
    { id: '2', type: 'security-audit', title: 'Security Audit Report - November 2025', description: 'Security incidents, alerts, and compliance status', generated: new Date(Date.now() - 172800000).toISOString(), status: 'ready' },
    { id: '3', type: 'user-activity', title: 'User Activity Report', description: 'Login patterns, failed attempts, and usage statistics', generated: new Date(Date.now() - 259200000).toISOString(), status: 'ready' },
    { id: '4', type: 'backup-status', title: 'Backup Status Report', description: 'Backup completion rates and storage usage', generated: new Date().toISOString(), status: 'generating' },
  ]);

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress');
  const unresolvedAlerts = securityAlerts.filter(a => !a.resolved);

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'low': return 'text-gray-600 bg-gray-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
    }
  };

  const getSeverityColor = (severity: SecurityAlert['severity']) => {
    switch (severity) {
      case 'low': return 'text-gray-600 bg-gray-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <div className="stat-card-content">
            <Icons.ActivityIcon className="w-8 h-8 text-white opacity-80" />
            <div className="stat-card-details">
              <p className="stat-card-value text-white">{systems.filter(s => s.status === 'operational').length}/{systems.length}</p>
              <p className="stat-card-label text-white opacity-90">Systems Operational</p>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
          <div className="stat-card-content">
            <Icons.MessageSquareIcon className="w-8 h-8 text-white opacity-80" />
            <div className="stat-card-details">
              <p className="stat-card-value text-white">{openTickets.length}</p>
              <p className="stat-card-label text-white opacity-90">Open Tickets</p>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
          <div className="stat-card-content">
            <Icons.ShieldCheckIcon className="w-8 h-8 text-white opacity-80" />
            <div className="stat-card-details">
              <p className="stat-card-value text-white">{unresolvedAlerts.length}</p>
              <p className="stat-card-label text-white opacity-90">Security Alerts</p>
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
          <div className="stat-card-content">
            <Icons.DatabaseIcon className="w-8 h-8 text-white opacity-80" />
            <div className="stat-card-details">
              <p className="stat-card-value text-white">{backups.filter(b => b.status === 'completed').length}</p>
              <p className="stat-card-label text-white opacity-90">Successful Backups</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">System Status Overview</h2>
          <Button onClick={() => setActiveView('systems')}>View All</Button>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {systems.slice(0, 4).map(system => (
              <div key={system.id} className="flex items-center justify-between p-3 border border-border-primary rounded-lg hover:bg-background-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <Icons.ActivityIcon className="w-5 h-5 text-text-secondary" />
                  <div>
                    <p className="font-medium text-text-primary">{system.name}</p>
                    <p className="text-sm text-text-secondary">Uptime: {system.uptime} • {system.responseTime || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(system.status)}`}>
                  {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Support Tickets</h2>
          <Button onClick={() => setActiveView('support')}>View All</Button>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {tickets.slice(0, 4).map(ticket => (
              <div key={ticket.id} className="flex items-center justify-between p-3 border border-border-primary rounded-lg hover:bg-background-secondary transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-text-primary">{ticket.title}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{ticket.ticketNumber} • {ticket.department}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-background-tertiary text-text-primary">
                  {ticket.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {unresolvedAlerts.length > 0 && (
        <div className="card border-2 border-red-200">
          <div className="card-header bg-red-50">
            <h2 className="card-title text-red-700">Security Alerts</h2>
            <Button onClick={() => setActiveView('security')} style={{ backgroundColor: '#ef4444' }}>View All</Button>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {unresolvedAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
                  <Icons.AlertTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-text-secondary">{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-text-primary">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSystems = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">System Status</h2>
        <Button onClick={() => addToast('Systems refreshed', 'success')}>
          <Icons.RefreshCwIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {systems.map(system => (
            <div key={system.id} className="p-4 border border-border-primary rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icons.ActivityIcon className="w-6 h-6 text-text-secondary" />
                  <h3 className="font-semibold text-text-primary">{system.name}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(system.status)}`}>
                  {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Uptime</p>
                  <p className="font-medium text-text-primary">{system.uptime}</p>
                </div>
                {system.responseTime && (
                  <div>
                    <p className="text-text-secondary">Response Time</p>
                    <p className="font-medium text-text-primary">{system.responseTime}</p>
                  </div>
                )}
                <div>
                  <p className="text-text-secondary">Last Checked</p>
                  <p className="font-medium text-text-primary">{new Date(system.lastChecked).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Security Alerts</h2>
        <Button onClick={() => setSecurityAlerts(alerts => alerts.map(a => ({ ...a, resolved: true })))} style={{ backgroundColor: '#10b981' }}>
          Resolve All
        </Button>
      </div>
      <div className="card-body">
        <div className="space-y-3">
          {securityAlerts.map(alert => (
            <div key={alert.id} className={`p-4 border rounded-lg ${alert.resolved ? 'border-border-primary bg-background-secondary' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Icons.ShieldCheckIcon className={`w-5 h-5 mt-0.5 ${alert.resolved ? 'text-green-600' : 'text-red-600'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-background-tertiary text-text-primary">
                        {alert.type.replace(/-/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary mb-1">{alert.message}</p>
                    <p className="text-xs text-text-secondary">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                {!alert.resolved && (
                  <Button 
                    onClick={() => setSecurityAlerts(alerts => alerts.map(a => a.id === alert.id ? { ...a, resolved: true } : a))}
                    style={{ backgroundColor: '#10b981' }}
                  >
                    Resolve
                  </Button>
                )}
                {alert.resolved && <span className="text-xs text-green-600 font-semibold">RESOLVED</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBackups = () => {
    const getBackupStatusColor = (status: BackupStatus['status']) => {
      switch (status) {
        case 'completed': return 'text-green-600 bg-green-100';
        case 'in-progress': return 'text-blue-600 bg-blue-100';
        case 'failed': return 'text-red-600 bg-red-100';
        case 'scheduled': return 'text-gray-600 bg-gray-100';
      }
    };

    const getBackupTypeIcon = () => {
      return Icons.DatabaseIcon;
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="stat-card-content">
              <Icons.CheckCircleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{backups.filter(b => b.status === 'completed').length}</p>
                <p className="stat-card-label text-white opacity-90">Completed Backups</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="stat-card-content">
              <Icons.DatabaseIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{backups.filter(b => b.status === 'in-progress').length}</p>
                <p className="stat-card-label text-white opacity-90">In Progress</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <div className="stat-card-content">
              <Icons.XCircleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{backups.filter(b => b.status === 'failed').length}</p>
                <p className="stat-card-label text-white opacity-90">Failed Backups</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Backup & Recovery</h2>
            <div className="flex gap-2">
              <Button onClick={() => addToast('Starting manual backup...', 'info')}>
                <Icons.DatabaseIcon className="w-4 h-4 mr-2" />
                Start Backup
              </Button>
              <Button onClick={() => addToast('Backup schedule updated', 'success')}>
                <Icons.CalendarIcon className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {backups.map(backup => {
                const BackupIcon = getBackupTypeIcon();
                return (
                  <div key={backup.id} className="p-4 border border-border-primary rounded-lg hover:bg-background-secondary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <BackupIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-background-tertiary text-text-primary">
                              {backup.type.toUpperCase()} BACKUP
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBackupStatusColor(backup.status)}`}>
                              {backup.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-text-secondary">Start Time</p>
                              <p className="font-medium text-text-primary">{new Date(backup.startTime).toLocaleString()}</p>
                            </div>
                            {backup.endTime && (
                              <div>
                                <p className="text-text-secondary">End Time</p>
                                <p className="font-medium text-text-primary">{new Date(backup.endTime).toLocaleString()}</p>
                              </div>
                            )}
                            {backup.size && (
                              <div>
                                <p className="text-text-secondary">Size</p>
                                <p className="font-medium text-text-primary">{backup.size}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-text-secondary">Location</p>
                              <p className="font-medium text-text-primary">{backup.location}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {backup.status === 'completed' && (
                        <Button onClick={() => addToast('Restore functionality coming soon', 'info')}>
                          <Icons.RefreshCwIcon className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Backup Schedule</h2>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border-primary rounded-lg">
                <div className="flex items-center gap-3">
                  <Icons.CalendarIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">Daily Incremental Backup</p>
                    <p className="text-sm text-text-secondary">Every day at 2:00 AM</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 border border-border-primary rounded-lg">
                <div className="flex items-center gap-3">
                  <Icons.CalendarIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">Weekly Full Backup</p>
                    <p className="text-sm text-text-secondary">Every Sunday at 1:00 AM</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 border border-border-primary rounded-lg">
                <div className="flex items-center gap-3">
                  <Icons.CalendarIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">Monthly Differential Backup</p>
                    <p className="text-sm text-text-secondary">First Sunday of each month at 12:00 AM</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSupport = () => {
    const getTicketStatusColor = (status: SupportTicket['status']) => {
      switch (status) {
        case 'open': return 'text-blue-600 bg-blue-100';
        case 'in-progress': return 'text-yellow-600 bg-yellow-100';
        case 'resolved': return 'text-green-600 bg-green-100';
        case 'closed': return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="stat-card-content">
              <Icons.MessageSquareIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{tickets.filter(t => t.status === 'open').length}</p>
                <p className="stat-card-label text-white opacity-90">Open Tickets</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <div className="stat-card-content">
              <Icons.ClockIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{tickets.filter(t => t.status === 'in-progress').length}</p>
                <p className="stat-card-label text-white opacity-90">In Progress</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="stat-card-content">
              <Icons.CheckCircleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{tickets.filter(t => t.status === 'resolved').length}</p>
                <p className="stat-card-label text-white opacity-90">Resolved</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <div className="stat-card-content">
              <Icons.AlertTriangleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{tickets.filter(t => t.priority === 'high' || t.priority === 'critical').length}</p>
                <p className="stat-card-label text-white opacity-90">High Priority</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Support Tickets</h2>
            <div className="flex gap-2">
              <Button onClick={() => addToast('Ticket export started', 'info')}>
                <Icons.DownloadCloudIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => addToast('Create ticket feature coming soon', 'info')}>
                <Icons.FileTextIcon className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {tickets.map(ticket => (
                <div key={ticket.id} className="p-4 border border-border-primary rounded-lg hover:bg-background-secondary transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-text-primary">{ticket.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getTicketStatusColor(ticket.status)}`}>
                          {ticket.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-text-tertiary">
                        <span>{ticket.ticketNumber}</span>
                        <span>•</span>
                        <span>{ticket.department}</span>
                        {ticket.assignedTo && (
                          <>
                            <span>•</span>
                            <span>Assigned to: {ticket.assignedTo}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button onClick={() => addToast('Ticket details view coming soon', 'info')}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    const getUserStatusColor = (status: SystemUser['status']) => {
      switch (status) {
        case 'active': return 'text-green-600 bg-green-100';
        case 'inactive': return 'text-gray-600 bg-gray-100';
        case 'suspended': return 'text-red-600 bg-red-100';
      }
    };

    const handleResetPassword = (userId: string) => {
      const targetUser = systemUsers.find(u => u.id === userId);
      if (targetUser) {
        logPasswordReset(user, targetUser.id, targetUser.email);
      }
      addToast('Password reset email sent successfully', 'success');
    };

    const handleSuspendUser = (userId: string) => {
      const targetUser = systemUsers.find(u => u.id === userId);
      if (targetUser) {
        logUserSuspended(user, targetUser.id, targetUser.email);
      }
      addToast('User account suspended', 'success');
    };

    const handleActivateUser = (userId: string) => {
      const targetUser = systemUsers.find(u => u.id === userId);
      if (targetUser) {
        logUserActivated(user, targetUser.id, targetUser.email);
      }
      addToast('User account activated', 'success');
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="stat-card-content">
              <Icons.UsersIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{systemUsers.filter(u => u.status === 'active').length}</p>
                <p className="stat-card-label text-white opacity-90">Active Users</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <div className="stat-card-content">
              <Icons.ShieldCheckIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{systemUsers.filter(u => u.failedAttempts > 2).length}</p>
                <p className="stat-card-label text-white opacity-90">Security Flags</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="stat-card-content">
              <Icons.UsersIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{systemUsers.length}</p>
                <p className="stat-card-label text-white opacity-90">Total Users</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Management</h2>
            <div className="flex gap-2">
              <Button onClick={() => {
                logUsersExported(user, systemUsers.length);
                addToast('User export started', 'info');
              }}>
                <Icons.DownloadCloudIcon className="w-4 h-4 mr-2" />
                Export Users
              </Button>
              <Button onClick={() => addToast('Add user feature coming soon', 'info')}>
                <Icons.UserPlusIcon className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Failed Attempts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {systemUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <p className="font-medium text-text-primary">{user.name}</p>
                          <p className="text-sm text-text-secondary">{user.email}</p>
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-background-tertiary text-text-primary">
                          {user.role.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-text-primary">{user.department}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getUserStatusColor(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="text-sm text-text-secondary">
                        {new Date(user.lastLogin).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <span className={`font-semibold ${user.failedAttempts > 2 ? 'text-red-600' : 'text-text-secondary'}`}>
                          {user.failedAttempts}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="text-primary hover:text-primary-dark text-sm font-medium"
                            onClick={() => handleResetPassword(user.id)}
                            title="Reset Password"
                          >
                            Reset
                          </button>
                          {user.status === 'active' ? (
                            <button 
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                              onClick={() => handleSuspendUser(user.id)}
                              title="Suspend User"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button 
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                              onClick={() => handleActivateUser(user.id)}
                              title="Activate User"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLogs = () => {
    const getLogLevelColor = (level: SystemLog['level']) => {
      switch (level) {
        case 'info': return 'text-blue-600 bg-blue-100';
        case 'warning': return 'text-yellow-600 bg-yellow-100';
        case 'error': return 'text-orange-600 bg-orange-100';
        case 'critical': return 'text-red-600 bg-red-100';
      }
    };

    const getCategoryIcon = (category: SystemLog['category']) => {
      switch (category) {
        case 'system': return Icons.SettingsIcon;
        case 'security': return Icons.ShieldCheckIcon;
        case 'database': return Icons.DatabaseIcon;
        case 'application': return Icons.ActivityIcon;
        case 'network': return Icons.ActivityIcon;
      }
    };

    const handleExportLogs = () => {
      const csvContent = [
        ['Timestamp', 'Level', 'Category', 'Source', 'Message', 'Details'].join(','),
        ...systemLogs.map(log => [
          log.timestamp,
          log.level,
          log.category,
          log.source,
          `"${log.message}"`,
          `"${log.details || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      logSystemLogsExported(user, systemLogs.length);
      addToast('System logs exported successfully', 'success');
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="stat-card-content">
              <Icons.FileTextIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{systemLogs.length}</p>
                <p className="stat-card-label text-white opacity-90">Total Logs</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <div className="stat-card-content">
              <Icons.AlertTriangleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{systemLogs.filter(l => l.level === 'warning').length}</p>
                <p className="stat-card-label text-white opacity-90">Warnings</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <div className="stat-card-content">
              <Icons.XCircleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{systemLogs.filter(l => l.level === 'error' || l.level === 'critical').length}</p>
                <p className="stat-card-label text-white opacity-90">Errors</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="stat-card-content">
              <Icons.CheckCircleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{systemLogs.filter(l => l.level === 'info').length}</p>
                <p className="stat-card-label text-white opacity-90">Info Logs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">System Logs</h2>
            <div className="flex gap-2">
              <Button onClick={handleExportLogs}>
                <Icons.DownloadCloudIcon className="w-4 h-4 mr-2" />
                Export Logs
              </Button>
              <Button onClick={() => addToast('Logs refreshed', 'info')}>
                <Icons.RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {systemLogs.map(log => {
                const CategoryIcon = getCategoryIcon(log.category);
                return (
                  <div key={log.id} className="p-4 border border-border-primary rounded-lg hover:bg-background-secondary transition-colors">
                    <div className="flex items-start gap-3">
                      <CategoryIcon className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-background-tertiary text-text-primary">
                            {log.category.toUpperCase()}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                          <span className="text-xs text-text-tertiary">• {log.source}</span>
                        </div>
                        <p className="text-sm text-text-primary mb-1 font-medium">{log.message}</p>
                        {log.details && (
                          <p className="text-xs text-text-secondary mt-2 p-2 bg-background-tertiary rounded">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    const getReportIcon = (type: ITReport['type']) => {
      switch (type) {
        case 'uptime': return Icons.ActivityIcon;
        case 'security-audit': return Icons.ShieldCheckIcon;
        case 'user-activity': return Icons.UsersIcon;
        case 'backup-status': return Icons.DatabaseIcon;
      }
    };

    const handleGenerateReport = (reportType: ITReport['type']) => {
      logReportGenerated(user, reportType.replace(/-/g, ' '));
      addToast(`Generating ${reportType.replace(/-/g, ' ')} report...`, 'info');
    };

    const handleDownloadReport = (_reportId: string, title: string) => {
      logDataExport(user, 'Report', 1);
      addToast(`Downloading ${title}...`, 'success');
    };

    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">IT Reports</h2>
            <Button onClick={() => addToast('Generate custom report coming soon', 'info')}>
              <Icons.FileTextIcon className="w-4 h-4 mr-2" />
              Custom Report
            </Button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map(report => {
                const ReportIcon = getReportIcon(report.type);
                return (
                  <div key={report.id} className="p-6 border border-border-primary rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary bg-opacity-10">
                        <ReportIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary mb-2">{report.title}</h3>
                        <p className="text-sm text-text-secondary mb-4">{report.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-text-tertiary">
                              Generated: {new Date(report.generated).toLocaleDateString()}
                            </p>
                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                              report.status === 'ready' ? 'text-green-600 bg-green-100' :
                              report.status === 'generating' ? 'text-blue-600 bg-blue-100' :
                              'text-gray-600 bg-gray-100'
                            }`}>
                              {report.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {report.status === 'ready' && (
                              <Button onClick={() => handleDownloadReport(report.id, report.title)}>
                                <Icons.DownloadCloudIcon className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            )}
                            {report.status !== 'generating' && (
                              <Button 
                                onClick={() => handleGenerateReport(report.type)}
                                style={{ backgroundColor: '#10b981' }}
                              >
                                <Icons.RefreshCwIcon className="w-4 h-4 mr-2" />
                                Regenerate
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Report Generation</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => handleGenerateReport('uptime')}
                fullWidth
                style={{ padding: '1rem' }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icons.ActivityIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">System Uptime</span>
                </div>
              </Button>

              <Button 
                onClick={() => handleGenerateReport('security-audit')}
                fullWidth
                style={{ padding: '1rem' }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icons.ShieldCheckIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">Security Audit</span>
                </div>
              </Button>

              <Button 
                onClick={() => handleGenerateReport('user-activity')}
                fullWidth
                style={{ padding: '1rem' }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icons.UsersIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">User Activity</span>
                </div>
              </Button>

              <Button 
                onClick={() => handleGenerateReport('backup-status')}
                fullWidth
                style={{ padding: '1rem' }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icons.DatabaseIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">Backup Status</span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Report Schedule</h2>
            <Button onClick={() => addToast('Schedule management coming soon', 'info')}>
              <Icons.CalendarIcon className="w-4 h-4 mr-2" />
              Manage Schedule
            </Button>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border-primary rounded-lg">
                <div className="flex items-center gap-3">
                  <Icons.CalendarIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">Weekly System Uptime Report</p>
                    <p className="text-sm text-text-secondary">Every Monday at 9:00 AM</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 border border-border-primary rounded-lg">
                <div className="flex items-center gap-3">
                  <Icons.CalendarIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">Monthly Security Audit</p>
                    <p className="text-sm text-text-secondary">First day of each month at 8:00 AM</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 border border-border-primary rounded-lg">
                <div className="flex items-center gap-3">
                  <Icons.CalendarIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-text-primary">Daily Backup Status Report</p>
                    <p className="text-sm text-text-secondary">Every day at 6:00 AM</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAuditLogs = () => {
    const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'all'>('all');
    const [severityFilter, setSeverityFilter] = useState<AuditSeverity | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const auditStats = getAuditStats();
    let auditLogs = getAuditLogs({ limit: 500 });

    // Apply filters
    if (categoryFilter !== 'all') {
      auditLogs = auditLogs.filter(log => log.category === categoryFilter);
    }
    if (severityFilter !== 'all') {
      auditLogs = auditLogs.filter(log => log.severity === severityFilter);
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      auditLogs = auditLogs.filter(log => 
        log.description.toLowerCase().includes(search) ||
        log.userName.toLowerCase().includes(search) ||
        log.userEmail.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search)
      );
    }

    const getSeverityColor = (severity: AuditSeverity) => {
      switch (severity) {
        case 'low': return 'text-gray-600 bg-gray-100';
        case 'medium': return 'text-yellow-600 bg-yellow-100';
        case 'high': return 'text-orange-600 bg-orange-100';
        case 'critical': return 'text-red-600 bg-red-100';
      }
    };

    const getCategoryIcon = (category: AuditCategory) => {
      switch (category) {
        case 'user': return Icons.UsersIcon;
        case 'auth': return Icons.KeyIcon;
        case 'data': return Icons.DatabaseIcon;
        case 'system': return Icons.SettingsIcon;
        case 'security': return Icons.ShieldCheckIcon;
        case 'it': return Icons.ActivityIcon;
        case 'admin': return Icons.ShieldCheckIcon;
        case 'finance': return Icons.CreditCardIcon;
      }
    };

    const handleExportAuditLogs = () => {
      const csv = exportAuditLogsToCSV(auditLogs);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      addToast('Audit logs exported successfully', 'success');
    };

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="stat-card-content">
              <Icons.ClipboardListIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{auditStats.last24Hours}</p>
                <p className="stat-card-label text-white opacity-90">Last 24 Hours</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <div className="stat-card-content">
              <Icons.AlertTriangleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{auditStats.bySeverity.critical + auditStats.bySeverity.high}</p>
                <p className="stat-card-label text-white opacity-90">High/Critical</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <div className="stat-card-content">
              <Icons.XCircleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{auditStats.failedActions}</p>
                <p className="stat-card-label text-white opacity-90">Failed Actions</p>
              </div>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className="stat-card-content">
              <Icons.CheckCircleIcon className="w-8 h-8 text-white opacity-80" />
              <div className="stat-card-details">
                <p className="stat-card-value text-white">{auditStats.total}</p>
                <p className="stat-card-label text-white opacity-90">Total Logs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as AuditCategory | 'all')}
                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  <option value="user">User</option>
                  <option value="auth">Authentication</option>
                  <option value="data">Data</option>
                  <option value="system">System</option>
                  <option value="security">Security</option>
                  <option value="it">IT Operations</option>
                  <option value="admin">Admin</option>
                  <option value="finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as AuditSeverity | 'all')}
                  className="w-full px-3 py-2 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleExportAuditLogs} fullWidth>
                  <Icons.DownloadCloudIcon className="w-4 h-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Audit Trail ({auditLogs.length} entries)</h2>
            <Button onClick={() => {
              setCategoryFilter('all');
              setSeverityFilter('all');
              setSearchTerm('');
              addToast('Filters cleared', 'info');
            }}>
              Clear Filters
            </Button>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Icons.ClipboardListIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                  <p className="text-text-secondary">No audit logs found matching your filters</p>
                </div>
              ) : (
                auditLogs.map(log => {
                  const CategoryIcon = getCategoryIcon(log.category);
                  return (
                    <div 
                      key={log.id} 
                      className={`p-4 border rounded-lg hover:bg-background-secondary transition-colors ${
                        !log.success ? 'border-red-300 bg-red-50' : 'border-border-primary'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <CategoryIcon className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                              {log.severity.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-background-tertiary text-text-primary">
                              {log.category.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-600">
                              {log.action}
                            </span>
                            {!log.success && (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white">
                                FAILED
                              </span>
                            )}
                            <span className="text-xs text-text-secondary ml-auto">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-text-primary mb-2 font-medium">{log.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-text-secondary">
                            <div>
                              <span className="font-medium">User:</span> {log.userName}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span> {log.userEmail}
                            </div>
                            <div>
                              <span className="font-medium">Role:</span> {log.userRole}
                            </div>
                            <div>
                              <span className="font-medium">IP:</span> {log.ipAddress}
                            </div>
                          </div>

                          {log.resourceType && (
                            <div className="mt-2 text-xs text-text-tertiary">
                              <span className="font-medium">Resource:</span> {log.resourceType}
                              {log.resourceId && ` (${log.resourceId})`}
                              {log.resourceName && ` - ${log.resourceName}`}
                            </div>
                          )}

                          {log.errorMessage && (
                            <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
                              <span className="font-medium">Error:</span> {log.errorMessage}
                            </div>
                          )}

                          {log.changes && Object.keys(log.changes).length > 0 && (
                            <div className="mt-2 p-2 bg-background-tertiary rounded text-xs">
                              <span className="font-medium text-text-primary">Changes:</span>
                              <div className="mt-1 space-y-1">
                                {Object.entries(log.changes).map(([key, value]) => (
                                  <div key={key} className="text-text-secondary">
                                    <span className="font-medium">{key}:</span> {JSON.stringify(value.old)} → {JSON.stringify(value.new)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-text-tertiary">
                              <span className="font-medium">Details:</span> {JSON.stringify(log.metadata)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Audit Statistics by Category</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(auditStats.byCategory).map(([category, count]) => {
                const Icon = getCategoryIcon(category as AuditCategory);
                return (
                  <div key={category} className="p-4 border border-border-primary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold text-text-primary">{count}</p>
                        <p className="text-sm text-text-secondary capitalize">{category}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return renderOverview();
      case 'systems':
        return renderSystems();
      case 'users':
        return renderUsers();
      case 'security':
        return renderSecurity();
      case 'backups':
        return renderBackups();
      case 'support':
        return renderSupport();
      case 'logs':
        return renderLogs();
      case 'audit':
        return renderAuditLogs();
      case 'reports':
        return renderReports();
      case 'settings':
        return <SettingsView user={user} />;
      default:
        return (
          <div className="card">
            <div className="card-body text-center py-12">
              <Icons.SettingsIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">This feature is coming soon</p>
            </div>
          </div>
        );
    }
  };

  const sidebar = (
    <Sidebar 
      activeView={activeView} 
      setActiveView={setActiveView}
      alertCount={unresolvedAlerts.length}
      ticketCount={openTickets.length}
    />
  );

  const header = (
    <DashboardHeader
      user={user}
      onSignOut={onSignOut}
      onSwitchOrganization={onSwitchOrganization}
      title={activeView === 'overview' ? 'IT Dashboard' : activeView.charAt(0).toUpperCase() + activeView.slice(1).replace('-', ' ')}
      theme={theme}
      toggleTheme={toggleTheme}
      notifications={[]}
      onMarkNotificationsAsRead={() => {}}
    />
  );

  return (
    <DashboardLayout sidebar={sidebar} header={header}>
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default ITDashboard;

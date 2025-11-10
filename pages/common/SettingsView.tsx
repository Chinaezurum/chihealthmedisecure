import React, { useState, useEffect } from 'react';
import { User, Patient } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { SecuritySettingsView } from './SecuritySettingsView.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import * as api from '../../services/apiService.ts';
import * as Icons from '../../components/icons/index.tsx';

interface SettingsViewProps {
  user: User | Patient;
  onUpdateUser?: (user: User | Patient) => void;
}

type SettingsTab = 'profile' | 'security' | 'notifications' | 'preferences' | 'role-specific';

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: Icons.UsersIcon },
    { id: 'security', label: 'Security', icon: Icons.ShieldCheckIcon },
    { id: 'notifications', label: 'Notifications', icon: Icons.BellIcon },
    { id: 'preferences', label: 'Preferences', icon: Icons.SettingsIcon },
  ];

  // Add role-specific tab if applicable
  if (user.role !== 'patient') {
    tabs.push({ id: 'role-specific', label: getRoleSpecificLabel(user.role), icon: Icons.SettingsIcon });
  }

  return (
    <div className="dashboard-content">
      <div className="content-container">
        <h1>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage your account settings and preferences</p>
        
        <div className="content-card">
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', marginBottom: '1.5rem', overflowX: 'auto' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'profile' && (
              <ProfileSettings user={user} onUpdate={onUpdateUser} isSaving={isSaving} setIsSaving={setIsSaving} />
            )}
            {activeTab === 'security' && <SecuritySettingsView user={user} />}
            {activeTab === 'notifications' && <NotificationSettings user={user} />}
            {activeTab === 'preferences' && <PreferencesSettings user={user} />}
            {activeTab === 'role-specific' && <RoleSpecificSettings user={user} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSettings: React.FC<{
  user: User | Patient;
  onUpdate?: (user: User | Patient) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}> = ({ user, onUpdate, isSaving, setIsSaving }) => {
  const { addToast } = useToasts();
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    dateOfBirth: 'dateOfBirth' in user ? user.dateOfBirth : '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user as any).avatarUrl || null);

  // Update avatar URL when user prop changes
  useEffect(() => {
    if ((user as any).avatarUrl) {
      const url = (user as any).avatarUrl;
      const fullUrl = url.startsWith('http') 
        ? url 
        : url.startsWith('/')
          ? `${window.location.origin}${url}`
          : url;
      setAvatarUrl(fullUrl);
    } else {
      setAvatarUrl(null);
    }
  }, [(user as any).avatarUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // In a real app, call API to update user
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      addToast('Profile updated successfully', 'success');
      if (onUpdate) {
        onUpdate({ ...user, ...formData } as User | Patient);
      }
    } catch (error) {
      addToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Personal Information</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <div className="profile-avatar-wrapper">
          <img
            src={avatarUrl || (user as any).avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`}
            alt={user.name}
            className="profile-avatar"
            onError={(e) => {
              // Fallback to default avatar if image fails to load
              (e.target as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${user.id}`;
            }}
          />
          <div>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  addToast('File too large. Maximum 2MB.', 'error');
                  return;
                }
                
                // Show preview immediately
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target?.result) {
                    setAvatarUrl(event.target.result as string);
                  }
                };
                reader.readAsDataURL(file);
                
                try {
                  setIsSaving(true);
                  const res = await api.uploadAvatar(file as File);
                  
                  // Update avatar URL from response
                  const newAvatarUrl = res.avatarUrl || (res.user as any)?.avatarUrl;
                  if (newAvatarUrl) {
                    // If the response includes a full URL, use it; otherwise construct it
                    const fullUrl = newAvatarUrl.startsWith('http') 
                      ? newAvatarUrl 
                      : newAvatarUrl.startsWith('/')
                        ? `${window.location.origin}${newAvatarUrl}`
                        : newAvatarUrl;
                    setAvatarUrl(fullUrl);
                  }
                  
                  addToast('Avatar uploaded successfully.', 'success');
                  
                  // Update parent component with new user data
                  const updatedUser = res.user || { ...user, avatarUrl: newAvatarUrl };
                  if (onUpdate) {
                    onUpdate(updatedUser);
                  }
                } catch (err: any) {
                  console.error('Avatar upload failed', err);
                  // Revert to original avatar on error
                  setAvatarUrl((user as any).avatarUrl || null);
                  addToast(err?.message || 'Failed to upload avatar', 'error');
                } finally { 
                  setIsSaving(false);
                  // Reset file input
                  e.target.value = '';
                }
              }}
            />
            <label htmlFor="avatarInput">
              <Button type="button" disabled={isSaving}>
                {isSaving ? 'Uploading...' : 'Change Photo'}
              </Button>
            </label>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>JPG, PNG or GIF. Max size 2MB</p>
          </div>
        </div>

        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          disabled
          title="Email cannot be changed"
        />
        {'dateOfBirth' in user && (
          <Input
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem' }}>
          <Button type="button" onClick={() => setFormData({ name: user.name, email: user.email, dateOfBirth: 'dateOfBirth' in user ? user.dateOfBirth : '' })}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

const NotificationSettings: React.FC<{ user: User | Patient }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    labResults: true,
    newMessages: true,
    prescriptionUpdates: true,
    billingAlerts: true,
    systemUpdates: false,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    addToast('Notification preference saved', 'success');
  };

  const notificationOptions = [
    { key: 'emailNotifications' as const, label: 'Email Notifications', description: 'Receive notifications via email' },
    { key: 'pushNotifications' as const, label: 'Push Notifications', description: 'Receive browser push notifications' },
    { key: 'appointmentReminders' as const, label: 'Appointment Reminders', description: 'Get reminded about upcoming appointments' },
    { key: 'labResults' as const, label: 'Lab Results', description: 'Notify when new lab results are available' },
    { key: 'newMessages' as const, label: 'New Messages', description: 'Alert when you receive new messages' },
    { key: 'prescriptionUpdates' as const, label: 'Prescription Updates', description: 'Updates about prescription status' },
    { key: 'billingAlerts' as const, label: 'Billing Alerts', description: 'Notifications about bills and payments' },
    { key: 'systemUpdates' as const, label: 'System Updates', description: 'Important system announcements' },
  ];

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Notification Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '42rem' }}>
        {notificationOptions.map((option) => (
          <ToggleSetting
            key={option.key}
            label={option.label}
            description={option.description}
            checked={notifications[option.key]}
            onChange={() => handleToggle(option.key)}
          />
        ))}
      </div>
    </div>
  );
};

const PreferencesSettings: React.FC<{ user: User | Patient }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [preferences, setPreferences] = useState({
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    autoSave: true,
  });

  const handleSave = () => {
    // Save to localStorage or API
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    addToast('Preferences saved successfully', 'success');
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <div className="form-group">
          <label className="form-label">Language</label>
          <select
            className="form-input"
            value={preferences.language}
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Date Format</label>
          <select
            className="form-input"
            value={preferences.dateFormat}
            onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Time Format</label>
          <select
            className="form-input"
            value={preferences.timeFormat}
            onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
          >
            <option value="12h">12-hour (AM/PM)</option>
            <option value="24h">24-hour</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Timezone</label>
          <select
            className="form-input"
            value={preferences.timezone}
            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <ToggleSetting
          label="Auto-save"
          description="Automatically save changes as you work"
          checked={preferences.autoSave}
          onChange={(checked) => setPreferences({ ...preferences, autoSave: checked })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </div>
    </div>
  );
};

const RoleSpecificSettings: React.FC<{ user: User | Patient }> = ({ user: _user }) => {
  switch (_user.role) {
    case 'hcw':
      return <HCWSettings user={_user as User} />;
    case 'nurse':
      return <NurseSettings user={_user as User} />;
    case 'pharmacist':
      return <PharmacistSettings user={_user as User} />;
    case 'lab_technician':
      return <LabTechnicianSettings user={_user as User} />;
    case 'admin':
      return <AdminSettings user={_user as User} />;
    case 'receptionist':
      return <ReceptionistSettings user={_user as User} />;
    case 'logistics':
      return <LogisticsSettings user={_user as User} />;
    case 'command_center':
      return <CommandCenterSettings user={_user as User} />;
    default:
      return <div>No role-specific settings available</div>;
  }
};

// Role-specific settings components
const HCWSettings: React.FC<{ user: User }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [settings, setSettings] = useState({
    defaultNoteTemplate: 'soap',
    autoSaveNotes: true,
    showPatientPhotos: true,
    enableTelemedicine: true,
    consultationDuration: '30',
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Clinical Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <div className="form-group">
          <label className="form-label">Default Note Template</label>
          <select
            className="form-input"
            value={settings.defaultNoteTemplate}
            onChange={(e) => setSettings({ ...settings, defaultNoteTemplate: e.target.value })}
          >
            <option value="soap">SOAP</option>
            <option value="progress">Progress Note</option>
            <option value="consultation">Consultation</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Default Consultation Duration (minutes)</label>
          <select
            className="form-input"
            value={settings.consultationDuration}
            onChange={(e) => setSettings({ ...settings, consultationDuration: e.target.value })}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>

        <ToggleSetting
          label="Auto-save Clinical Notes"
          description="Automatically save notes as you type"
          checked={settings.autoSaveNotes}
          onChange={(checked) => setSettings({ ...settings, autoSaveNotes: checked })}
        />

        <ToggleSetting
          label="Show Patient Photos"
          description="Display patient photos in patient lists"
          checked={settings.showPatientPhotos}
          onChange={(checked) => setSettings({ ...settings, showPatientPhotos: checked })}
        />

        <ToggleSetting
          label="Enable Telemedicine"
          description="Allow video consultations with patients"
          checked={settings.enableTelemedicine}
          onChange={(checked) => setSettings({ ...settings, enableTelemedicine: checked })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

const NurseSettings: React.FC<{ user: User }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [settings, setSettings] = useState({
    triagePriority: 'high',
    vitalAlerts: true,
    bedAssignmentNotifications: true,
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Nursing Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <div className="form-group">
          <label className="form-label">Default Triage Priority</label>
          <select
            className="form-input"
            value={settings.triagePriority}
            onChange={(e) => setSettings({ ...settings, triagePriority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <ToggleSetting
          label="Vital Signs Alerts"
          description="Get alerts for abnormal vital signs"
          checked={settings.vitalAlerts}
          onChange={(checked) => setSettings({ ...settings, vitalAlerts: checked })}
        />

        <ToggleSetting
          label="Bed Assignment Notifications"
          description="Notify when beds are assigned or vacated"
          checked={settings.bedAssignmentNotifications}
          onChange={(checked) => setSettings({ ...settings, bedAssignmentNotifications: checked })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

const PharmacistSettings: React.FC<{ user: User }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [settings, setSettings] = useState({
    autoSafetyCheck: true,
    inventoryAlerts: true,
    lowStockThreshold: '10',
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Pharmacy Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <ToggleSetting
          label="Auto Safety Check"
          description="Automatically run drug interaction checks"
          checked={settings.autoSafetyCheck}
          onChange={(checked) => setSettings({ ...settings, autoSafetyCheck: checked })}
        />

        <ToggleSetting
          label="Inventory Alerts"
          description="Get notified when inventory is low"
          checked={settings.inventoryAlerts}
          onChange={(checked) => setSettings({ ...settings, inventoryAlerts: checked })}
        />

        <div className="form-group">
          <label className="form-label">Low Stock Threshold</label>
          <Input
            type="number"
            name="lowStockThreshold"
            value={settings.lowStockThreshold}
            onChange={(e) => setSettings({ ...settings, lowStockThreshold: e.target.value })}
            label=""
          />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Alert when stock falls below this number</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

const LabTechnicianSettings: React.FC<{ user: User }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [settings, setSettings] = useState({
    resultFormat: 'standard',
    autoNotify: true,
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Laboratory Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <div className="form-group">
          <label className="form-label">Result Format</label>
          <select
            className="form-input"
            value={settings.resultFormat}
            onChange={(e) => setSettings({ ...settings, resultFormat: e.target.value })}
          >
            <option value="standard">Standard</option>
            <option value="detailed">Detailed</option>
            <option value="abbreviated">Abbreviated</option>
          </select>
        </div>

        <ToggleSetting
          label="Auto-notify on Completion"
          description="Automatically notify when tests are completed"
          checked={settings.autoNotify}
          onChange={(checked) => setSettings({ ...settings, autoNotify: checked })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

const AdminSettings: React.FC<{ user: User }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [settings, setSettings] = useState({
    auditLogRetention: '365',
    enableMfaForAll: false,
    dataExportFormat: 'csv',
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Administrative Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <div className="form-group">
          <label className="form-label">Audit Log Retention (days)</label>
          <Input
            type="number"
            name="auditLogRetention"
            value={settings.auditLogRetention}
            onChange={(e) => setSettings({ ...settings, auditLogRetention: e.target.value })}
            label=""
          />
        </div>

        <div className="form-group">
          <label className="form-label">Data Export Format</label>
          <select
            className="form-input"
            value={settings.dataExportFormat}
            onChange={(e) => setSettings({ ...settings, dataExportFormat: e.target.value })}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="xlsx">Excel</option>
          </select>
        </div>

        <ToggleSetting
          label="Require MFA for All Users"
          description="Enforce multi-factor authentication for all organization users"
          checked={settings.enableMfaForAll}
          onChange={(checked) => setSettings({ ...settings, enableMfaForAll: checked })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

const ReceptionistSettings: React.FC<{ user: User }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [settings, setSettings] = useState({
    defaultCheckInTime: '15',
    autoAssignRooms: false,
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Reception Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <div className="form-group">
          <label className="form-label">Default Check-in Window (minutes before appointment)</label>
          <Input
            type="number"
            name="defaultCheckInTime"
            value={settings.defaultCheckInTime}
            onChange={(e) => setSettings({ ...settings, defaultCheckInTime: e.target.value })}
            label=""
          />
        </div>

        <ToggleSetting
          label="Auto-assign Rooms"
          description="Automatically assign available rooms to appointments"
          checked={settings.autoAssignRooms}
          onChange={(checked) => setSettings({ ...settings, autoAssignRooms: checked })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

const LogisticsSettings: React.FC<{ user: User }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [settings, setSettings] = useState({
    transportNotifications: true,
    sampleTracking: true,
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Logistics Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <ToggleSetting
          label="Transport Notifications"
          description="Get notified about transport requests"
          checked={settings.transportNotifications}
          onChange={(checked) => setSettings({ ...settings, transportNotifications: checked })}
        />

        <ToggleSetting
          label="Sample Tracking"
          description="Enable real-time tracking of lab samples"
          checked={settings.sampleTracking}
          onChange={(checked) => setSettings({ ...settings, sampleTracking: checked })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

const CommandCenterSettings: React.FC<{ user: User }> = ({ user: _user }) => {
  const { addToast } = useToasts();
  const [settings, setSettings] = useState({
    bedAlerts: true,
    occupancyThreshold: '80',
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Command Center Preferences</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '42rem' }}>
        <div className="form-group">
          <label className="form-label">Bed Occupancy Alert Threshold (%)</label>
          <Input
            type="number"
            name="occupancyThreshold"
            value={settings.occupancyThreshold}
            onChange={(e) => setSettings({ ...settings, occupancyThreshold: e.target.value })}
            label=""
          />
        </div>

        <ToggleSetting
          label="Bed Alerts"
          description="Get alerts when bed occupancy exceeds threshold"
          checked={settings.bedAlerts}
          onChange={(checked) => setSettings({ ...settings, bedAlerts: checked })}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
          <Button onClick={() => addToast('Settings saved', 'success')}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

// Helper component for toggle switches
const ToggleSetting: React.FC<{
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      backgroundColor: 'var(--background-tertiary)',
      borderRadius: '0.5rem',
      border: '1px solid var(--border-primary)'
    }}>
      <div style={{ flex: 1 }}>
        <label style={{ fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: description ? '0.25rem' : 0 }}>
          {label}
        </label>
        {description && (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{description}</p>
        )}
      </div>
      <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
        <div style={{
          width: '2.75rem',
          height: '1.5rem',
          backgroundColor: checked ? 'var(--primary)' : 'var(--border-primary)',
          borderRadius: '9999px',
          position: 'relative',
          transition: 'background-color 0.2s',
        }}>
          <div style={{
            position: 'absolute',
            top: '2px',
            left: checked ? 'calc(100% - 1.375rem)' : '2px',
            width: '1.25rem',
            height: '1.25rem',
            backgroundColor: 'white',
            border: '1px solid var(--border-primary)',
            borderRadius: '9999px',
            transition: 'left 0.2s',
          }} />
        </div>
      </label>
    </div>
  );
};

function getRoleSpecificLabel(role: string): string {
  const labels: Record<string, string> = {
    hcw: 'Clinical',
    nurse: 'Nursing',
    pharmacist: 'Pharmacy',
    lab_technician: 'Laboratory',
    admin: 'Administrative',
    receptionist: 'Reception',
    logistics: 'Logistics',
    command_center: 'Operations',
  };
  return labels[role] || 'Role Settings';
}


import React, { useState } from 'react';
import { Patient } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { SecuritySettingsView } from '../common/SecuritySettingsView.tsx';

interface SettingsViewProps {
  user: Patient;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  return (
    <div>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Settings</h2>
      
      <div className="flex border-b border-border-primary mb-6">
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'security' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
        >
          Security
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'notifications' ? 'border-b-2 border-primary text-primary' : 'text-text-secondary'}`}
        >
          Notifications
        </button>
      </div>

      <div className="content-card p-8 max-w-2xl mx-auto">
        {activeTab === 'profile' && <ProfileSettings user={user} />}
        {activeTab === 'security' && <SecuritySettingsView user={user} />}
        {activeTab === 'notifications' && <NotificationSettings />}
      </div>
    </div>
  );
};


const ProfileSettings: React.FC<{ user: Patient }> = ({ user }) => {
    return (
        <form className="space-y-6">
            <h3 className="text-xl font-semibold text-text-primary">Personal Information</h3>
            <Input label="Full Name" name="name" defaultValue={user.name} />
            <Input label="Email Address" name="email" defaultValue={user.email} disabled />
            <Input label="Date of Birth" name="dob" defaultValue={user.dateOfBirth} type="date" />
            <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
            </div>
        </form>
    );
};

const NotificationSettings = () => {
    return (
         <div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">Notification Preferences</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-md">
                    <label htmlFor="appointmentReminders" className="font-medium text-text-primary">Appointment Reminders</label>
                    <input type="checkbox" id="appointmentReminders" className="toggle-switch" defaultChecked />
                </div>
                 <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-md">
                    <label htmlFor="labResults" className="font-medium text-text-primary">New Lab Results</label>
                    <input type="checkbox" id="labResults" className="toggle-switch" defaultChecked />
                </div>
                 <div className="flex items-center justify-between p-4 bg-background-tertiary rounded-md">
                    <label htmlFor="newMessages" className="font-medium text-text-primary">New Messages</label>
                    <input type="checkbox" id="newMessages" className="toggle-switch" defaultChecked />
                </div>
            </div>
        </div>
    );
};

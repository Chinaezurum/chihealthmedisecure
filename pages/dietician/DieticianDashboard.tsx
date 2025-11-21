import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { TeamMessagingView } from '../../components/common/TeamMessagingView.tsx';
import { InterDepartmentalNotesView } from '../hcw/InterDepartmentalNotesView.tsx';
import { PatientLookupView } from '../receptionist/PatientLookupView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

type DieticianView = 'patients' | 'consultations' | 'meal-plans' | 'lookup' | 'messages' | 'dept-notes' | 'settings';

interface DieticianDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: DieticianView; setActiveView: (view: DieticianView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'patients', label: 'My Patients', icon: Icons.UsersIcon },
    { id: 'consultations', label: 'Consultations', icon: Icons.CalendarIcon },
    { id: 'meal-plans', label: 'Meal Plans', icon: Icons.DietIcon },
    { id: 'lookup', label: 'Patient Lookup', icon: Icons.SearchIcon },
    { id: 'messages', label: 'Team Messages', icon: Icons.MessageSquareIcon },
    { id: 'dept-notes', label: 'Dept. Notes', icon: Icons.BellIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as DieticianView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}>
      <item.icon />
      <span>{item.label}</span>
    </button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('patients')} className="sidebar-logo-button">
        <Logo />
        <h1>ChiHealth Nutrition</h1>
      </button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div>
        <button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}>
          <Icons.SettingsIcon />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

const DieticianDashboard: React.FC<DieticianDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<DieticianView>('patients');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dieticianData, staff] = await Promise.all([
        api.fetchHcwData(), // Reusing HCW data structure
        api.fetchStaffUsers()
      ]);
      setData(dieticianData);
      setStaffUsers(staff);
    } catch (error) {
      console.error('Failed to fetch dietician data:', error);
      addToast('Failed to load nutrition dashboard.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const renderContent = () => {
    if (activeView === 'lookup') {
      return <PatientLookupView />;
    }

    if (isLoading || !data) return <FullScreenLoader message="Loading nutrition dashboard..." />;

    switch (activeView) {
      case 'patients':
        return (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-text-primary">My Patients</h2>
              <p className="text-text-secondary mt-1">Patients under nutritional care and monitoring</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.patients?.map((patient: Patient) => (
                <div key={patient.id} className="bg-background-secondary border border-border-primary rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icons.UsersIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">{patient.name}</h3>
                      <p className="text-sm text-text-secondary">ID: {patient.id}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Last Visit:</span>
                      <span className="text-text-primary font-medium">{patient.lastVisit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">DOB:</span>
                      <span className="text-text-primary">{patient.dateOfBirth}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addToast('Opening patient nutrition profile...', 'info')}
                    className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                  >
                    View Nutrition Plan
                  </button>
                </div>
              ))}
            </div>
          </>
        );

      case 'consultations':
        return (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-text-primary">Nutrition Consultations</h2>
              <p className="text-text-secondary mt-1">Scheduled and completed dietary assessments</p>
            </div>
            <div className="space-y-4">
              {data.appointments?.map((appt: any) => (
                <div key={appt.id} className="bg-background-secondary border border-border-primary rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-text-primary">{appt.patientName}</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        <Icons.CalendarIcon className="inline w-4 h-4 mr-1" />
                        {appt.date} at {appt.time}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      appt.status === 'Confirmed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                      appt.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {appt.status === 'Confirmed' && (
                      <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm">
                        Start Consultation
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        );

      case 'meal-plans':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-text-primary">Meal Plans</h2>
                <p className="text-text-secondary mt-1">Customized nutrition plans and dietary guidelines</p>
              </div>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                <span className="text-xl mr-2">+</span>
                Create New Plan
              </button>
            </div>
            <div className="grid gap-4">
              <div className="bg-background-secondary border border-border-primary rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Icons.DietIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary text-lg">Diabetic Diet Plan</h3>
                    <p className="text-text-secondary text-sm mt-1">Low glycemic index, balanced macros</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-text-secondary">
                        <strong className="text-text-primary">Calories:</strong> 1800 kcal/day
                      </span>
                      <span className="text-text-secondary">
                        <strong className="text-text-primary">Duration:</strong> 4 weeks
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors text-sm">
                    Assign to Patient
                  </button>
                </div>
              </div>
            </div>
          </>
        );

      case 'messages':
        return (
          <TeamMessagingView
            messages={data.messages || []}
            currentUser={props.user}
            staffContacts={staffUsers}
            onSendMessage={async (recipientId, content) => {
              await api.sendMessage({ recipientId, content, senderId: props.user.id });
              fetchData();
            }}
            onStartCall={() => addToast('Call feature coming soon', 'info')}
          />
        );

      case 'dept-notes':
        return <InterDepartmentalNotesView />;

      case 'settings':
        return <SettingsView user={props.user} />;

      default:
        return <div>My Patients</div>;
    }
  };

  return (
    <DashboardLayout
      onSignOut={props.onSignOut}
      sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />}
      header={
        <DashboardHeader
          user={props.user}
          onSignOut={props.onSignOut}
          onSwitchOrganization={props.onSwitchOrganization}
          notifications={[]}
          onMarkNotificationsAsRead={() => {}}
          title="Dietician Dashboard"
          theme={props.theme}
          toggleTheme={props.toggleTheme}
        />
      }
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default DieticianDashboard;

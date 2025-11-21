import React, { useState, useEffect, useCallback } from 'react';
import { User, LabTest } from '../../types.ts';
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
import { TransportRequestButton } from '../../components/common/TransportRequestButton.tsx';

type RadiologistView = 'queue' | 'completed' | 'lookup' | 'messages' | 'dept-notes' | 'settings';

interface RadiologistDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: RadiologistView; setActiveView: (view: RadiologistView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'queue', label: 'Imaging Queue', icon: Icons.MicroscopeIcon },
    { id: 'completed', label: 'Completed Studies', icon: Icons.ClipboardListIcon },
    { id: 'lookup', label: 'Patient Lookup', icon: Icons.SearchIcon },
    { id: 'messages', label: 'Team Messages', icon: Icons.MessageSquareIcon },
    { id: 'dept-notes', label: 'Dept. Notes', icon: Icons.BellIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as RadiologistView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}>
      <item.icon />
      <span>{item.label}</span>
    </button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('queue')} className="sidebar-logo-button">
        <Logo />
        <h1>ChiHealth Radiology</h1>
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

const RadiologistDashboard: React.FC<RadiologistDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<RadiologistView>('queue');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [radiologyData, staff] = await Promise.all([
        api.fetchLabTechnicianData(), // Reusing lab data structure for imaging studies
        api.fetchStaffUsers()
      ]);
      setData(radiologyData);
      setStaffUsers(staff);
    } catch (error) {
      console.error('Failed to fetch radiology data:', error);
      addToast('Failed to load radiology dashboard.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleUpdateStudy = async (studyId: string, status: LabTest['status'], result?: string) => {
    await api.updateLabTest(studyId, status, result);
    addToast('Imaging study updated.', 'success');
    fetchData();
  };

  const renderContent = () => {
    if (activeView === 'lookup') {
      return <PatientLookupView />;
    }

    if (isLoading || !data) return <FullScreenLoader message="Loading radiology dashboard..." />;

    switch (activeView) {
      case 'queue':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-text-primary">Imaging Studies Queue</h2>
                <p className="text-text-secondary mt-1">X-rays, CT scans, MRIs, and ultrasounds pending review</p>
              </div>
              <TransportRequestButton
                currentUserId={props.user.id}
                currentUserName={props.user.name}
                currentLocation="Radiology Department"
                organizationId={props.user.currentOrganization.id}
                onRequestCreated={fetchData}
              />
            </div>
            <div className="space-y-6">
              {/* Pending Studies */}
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-4">Pending Interpretation</h3>
                <div className="grid gap-4">
                  {data.labTests?.filter((t: LabTest) => t.status === 'Pending' || t.status === 'Ordered').map((study: LabTest) => (
                    <div key={study.id} className="bg-background-secondary border border-border-primary rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-text-primary">{study.patientName}</h4>
                          <p className="text-sm text-text-secondary">ID: {study.patientId}</p>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">
                          {study.status}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-text-primary">Study Type:</p>
                        <p className="text-text-secondary">{study.testName}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStudy(study.id, 'In-progress')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Start Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress */}
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-4">In Review</h3>
                <div className="grid gap-4">
                  {data.labTests?.filter((t: LabTest) => t.status === 'In-progress').map((study: LabTest) => (
                    <div key={study.id} className="bg-background-secondary border border-border-primary rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-text-primary">{study.patientName}</h4>
                          <p className="text-sm text-text-secondary">ID: {study.patientId}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                          In Review
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-text-primary">Study Type:</p>
                        <p className="text-text-secondary">{study.testName}</p>
                      </div>
                      <div className="space-y-3">
                        <textarea
                          placeholder="Enter radiology report and findings..."
                          className="input w-full"
                          rows={4}
                          defaultValue={study.result}
                        />
                        <button
                          onClick={() => {
                            const textarea = document.querySelector(`textarea[defaultValue="${study.result}"]`) as HTMLTextAreaElement;
                            handleUpdateStudy(study.id, 'Completed', textarea?.value || '');
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Complete & Submit Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        );

      case 'completed':
        return (
          <>
            <h2 className="text-3xl font-bold text-text-primary mb-6">Completed Studies</h2>
            <div className="grid gap-4">
              {data.labTests?.filter((t: LabTest) => t.status === 'Completed').map((study: LabTest) => (
                <div key={study.id} className="bg-background-secondary border border-border-primary rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-text-primary">{study.patientName}</h4>
                      <p className="text-sm text-text-secondary">ID: {study.patientId}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                      Completed
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-text-primary">Study Type:</p>
                    <p className="text-text-secondary">{study.testName}</p>
                  </div>
                  {study.result && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                      <p className="text-sm font-semibold text-text-primary mb-2">Report:</p>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{study.result}</p>
                    </div>
                  )}
                </div>
              ))}
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
        return <div>Imaging Queue</div>;
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
          title="Radiologist Dashboard"
          theme={props.theme}
          toggleTheme={props.toggleTheme}
        />
      }
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default RadiologistDashboard;

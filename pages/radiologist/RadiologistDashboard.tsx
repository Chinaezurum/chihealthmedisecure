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

type RadiologistView = 'queue' | 'completed' | 'lookup' | 'records' | 'messages' | 'dept-notes' | 'settings';

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
    { id: 'records', label: 'Patient Records', icon: Icons.FileTextIcon },
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

      case 'records':
        return (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-text-primary">Patient Clinical Records</h2>
              <p className="text-text-secondary mt-1">View patient information relevant to imaging interpretation</p>
            </div>
            
            {/* Patient Search */}
            <div className="card mb-6">
              <div className="card-body">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Search by Patient ID or Name..."
                    className="input flex-1"
                  />
                  <button className="btn btn-primary">
                    <Icons.SearchIcon className="w-4 h-4 mr-2" />
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Clinical Information Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demographics & Key Info */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Patient Demographics</h3>
                </div>
                <div className="card-body space-y-3">
                  <div className="flex justify-between py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Age/Sex:</span>
                    <span className="text-text-primary font-medium">Critical for anatomy interpretation</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border-primary">
                    <span className="text-text-secondary">Height/Weight:</span>
                    <span className="text-text-primary font-medium">BMI affects imaging protocols</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-text-secondary">Pregnancy Status:</span>
                    <span className="text-text-primary font-medium">Critical for radiation safety</span>
                  </div>
                </div>
              </div>

              {/* Allergies & Contraindications */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Allergies & Contraindications</h3>
                </div>
                <div className="card-body">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">⚠️ Contrast Allergies</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">Check before administering contrast media</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">⚠️ Implants/Devices</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Pacemakers, metallic implants for MRI safety</p>
                  </div>
                </div>
              </div>

              {/* Clinical History */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Clinical History</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Presenting Symptoms:</p>
                      <p className="text-sm text-text-secondary mt-1">Guides interpretation focus</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Relevant Diagnoses:</p>
                      <p className="text-sm text-text-secondary mt-1">Known conditions affecting imaging</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Recent Procedures:</p>
                      <p className="text-sm text-text-secondary mt-1">Post-operative changes to note</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Current Medications</h3>
                </div>
                <div className="card-body">
                  <p className="text-sm text-text-secondary mb-3">Medications that may affect imaging or require precautions</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-text-secondary">Anticoagulants (bleeding risk for procedures)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-text-secondary">Metformin (hold before contrast)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="text-text-secondary">Beta blockers (for cardiac imaging)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prior Imaging */}
              <div className="card lg:col-span-2">
                <div className="card-header">
                  <h3 className="card-title">Prior Imaging Studies</h3>
                </div>
                <div className="card-body">
                  <p className="text-sm text-text-secondary mb-4">Previous studies for comparison</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border-primary">
                          <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Date</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Study Type</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Key Findings</th>
                          <th className="text-left py-2 px-3 text-sm font-semibold text-text-primary">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border-primary">
                          <td className="py-2 px-3 text-sm text-text-secondary" colSpan={4}>
                            No prior imaging studies available
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Lab Results */}
              <div className="card lg:col-span-2">
                <div className="card-header">
                  <h3 className="card-title">Relevant Lab Results</h3>
                </div>
                <div className="card-body">
                  <p className="text-sm text-text-secondary mb-4">Lab values relevant to imaging interpretation</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-background-tertiary rounded-lg">
                      <p className="text-xs text-text-secondary">Creatinine</p>
                      <p className="text-sm font-semibold text-text-primary">Renal function for contrast</p>
                    </div>
                    <div className="p-3 bg-background-tertiary rounded-lg">
                      <p className="text-xs text-text-secondary">WBC Count</p>
                      <p className="text-sm font-semibold text-text-primary">Infection indicators</p>
                    </div>
                    <div className="p-3 bg-background-tertiary rounded-lg">
                      <p className="text-xs text-text-secondary">Platelet Count</p>
                      <p className="text-sm font-semibold text-text-primary">Bleeding risk assessment</p>
                    </div>
                    <div className="p-3 bg-background-tertiary rounded-lg">
                      <p className="text-xs text-text-secondary">Tumor Markers</p>
                      <p className="text-sm font-semibold text-text-primary">When relevant to study</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Indication */}
              <div className="card lg:col-span-2">
                <div className="card-header">
                  <h3 className="card-title">Clinical Indication for Imaging</h3>
                </div>
                <div className="card-body">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📋 Ordering Physician's Clinical Question
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      This section shows the specific clinical question the ordering physician needs answered, 
                      guiding focused interpretation and relevant differential diagnoses.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mt-6 bg-primary bg-opacity-10 border border-primary rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icons.AlertTriangleIcon className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-text-primary">Clinical Context for Imaging Interpretation</p>
                  <p className="text-sm text-text-secondary mt-1">
                    This view provides essential patient information for accurate image interpretation. 
                    Always review clinical history, allergies, and prior studies before finalizing reports.
                  </p>
                </div>
              </div>
            </div>
          </>
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

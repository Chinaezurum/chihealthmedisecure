import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient, LabTest } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { LabQueueView } from './LabQueueView.tsx';
import { CompletedTestsView } from './CompletedTestsView.tsx';
import { CreateLabTestRequestModal } from './CreateLabTestRequestModal.tsx';
import { InterDepartmentalNotesView } from '../hcw/InterDepartmentalNotesView.tsx';
import { PatientLookupView } from '../receptionist/PatientLookupView.tsx';
import { MessagingView } from '../../components/common/MessagingView.tsx';
import { TelemedicineView } from '../common/TelemedicineView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

type LabView = 'queue' | 'lookup' | 'history' | 'dept-notes' | 'messages' | 'telemedicine' | 'settings';

interface LabTechnicianDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: LabView; setActiveView: (view: LabView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'queue', label: 'Lab Test Queue', icon: Icons.FlaskConicalIcon },
    { id: 'history', label: 'Completed Tests', icon: Icons.ClipboardListIcon },
    { id: 'dept-notes', label: 'Team Messages', icon: Icons.BellIcon },
    { id: 'lookup', label: 'Patient Lookup', icon: Icons.SearchIcon },
    { id: 'messages', label: 'Chat', icon: Icons.MessageSquareIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as LabView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}><item.icon /><span>{item.label}</span></button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('queue')} className="sidebar-logo-button"><Logo /><h1>ChiHealth Labs</h1></button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div><button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}><Icons.SettingsIcon /><span>Settings</span></button></div>
    </aside>
  );
};

const LabTechnicianDashboard: React.FC<LabTechnicianDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<LabView>('queue');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [selectedPatientForCall, setSelectedPatientForCall] = useState<Patient | null>(null);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
  const [sessionStartTime] = useState(new Date().toISOString());
  const { addToast } = useToasts();

  // Audit-logged view switcher
  const handleViewChange = useCallback((newView: LabView) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'lab_technician',
      action: 'switch_view',
      fromView: activeView,
      toView: newView,
      organizationId: props.user.currentOrganization.id
    };
    console.log('Lab Dashboard View Navigation Audit:', auditLog);
    setActiveView(newView);
  }, [activeView, props.user.id, props.user.currentOrganization.id]);

  // Session tracking
  useEffect(() => {
    const sessionAudit = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'lab_technician',
      action: 'session_start',
      organizationId: props.user.currentOrganization.id,
      sessionId: `${props.user.id}_${sessionStartTime}`
    };
    console.log('Lab Dashboard Session Start Audit:', sessionAudit);

    return () => {
      const sessionEndAudit = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'lab_technician',
        action: 'session_end',
        organizationId: props.user.currentOrganization.id,
        sessionId: `${props.user.id}_${sessionStartTime}`,
        sessionDuration: new Date().getTime() - new Date(sessionStartTime).getTime()
      };
      console.log('Lab Dashboard Session End Audit:', sessionEndAudit);
    };
  }, [props.user.id, props.user.currentOrganization.id, sessionStartTime]);

  const handleStartCall = (contact: User | Patient) => {
    if (contact.role === 'patient') {
      setSelectedPatientForCall(contact as Patient);
      handleViewChange('telemedicine');
    } else {
      addToast('Video calls are available for patients only', 'info');
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Audit logging for data fetch
      const auditLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'lab_technician',
        action: 'fetch_lab_dashboard_data',
        organizationId: props.user.currentOrganization.id
      };
      console.log('Lab Dashboard Data Fetch Audit:', auditLog);
      
      const [labData, staff] = await Promise.all([
        api.fetchLabTechnicianData(),
        api.fetchStaffUsers()
      ]);
      setData(labData);
      setStaffUsers(staff);
    } catch (error) {
      console.error("Failed to fetch lab data:", error);
      addToast('Failed to load lab data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, props.user.id, props.user.currentOrganization.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleUpdateTest = async (testId: string, status: LabTest['status'], result?: string, notes?: string) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      action: 'update_lab_test',
      testId,
      status,
      result: result || null,
      notes: notes || null
    };
    console.log('Lab Test Update Audit:', auditLog);
    
    await api.updateLabTest(testId, status, result);
    addToast(`Test ${testId} updated to ${status}.`, 'success');
    fetchData();
  };
  
  const handleEditTest = async (testId: string, updates: Partial<LabTest>) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      action: 'edit_lab_test_request',
      testId,
      updates
    };
    console.log('Lab Test Request Edit Audit:', auditLog);
    
    await api.updateLabTest(testId, updates.status || 'Ordered', updates.result);
    addToast(`Test request updated successfully.`, 'success');
    fetchData();
  };
  
  const handleCancelTest = async (testId: string, reason: string) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      action: 'cancel_lab_test',
      testId,
      cancellationReason: reason
    };
    console.log('Lab Test Cancellation Audit:', auditLog);
    
    await api.updateLabTest(testId, 'Ordered', reason);
    addToast(`Test request cancelled: ${reason}`, 'info');
    fetchData();
  };
  
  const handleCreateRequest = async (request: Omit<LabTest, 'id' | 'status'>) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      action: 'create_lab_test_request_from_lab',
      request
    };
    console.log('Lab Test Request Creation Audit:', auditLog);
    
    await api.orderLabTest(request);
    addToast('Lab test request created successfully.', 'success');
    fetchData();
  };

  const renderContent = () => {
    if (activeView === 'lookup') {
      return <PatientLookupView />;
    }
    
    if (isLoading || !data) return <FullScreenLoader message="Loading laboratory dashboard..." />;
    
    switch (activeView) {
      case 'queue': 
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-text-primary">Lab Test Queue</h2>
                <p className="text-text-secondary mt-1">Manage test requests from HCWs and direct requests</p>
              </div>
              <button
                onClick={() => setIsCreateRequestModalOpen(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <span className="text-xl">+</span>
                New Test Request
              </button>
            </div>
            <LabQueueView 
              labTests={data.labTests} 
              onUpdateTest={handleUpdateTest}
              onEditTest={handleEditTest}
              onCancelTest={handleCancelTest}
              currentUserId={props.user.id}
            />
          </>
        );
      case 'history': 
        return (
          <CompletedTestsView 
            labTests={data.labTests} 
            onUpdateTest={handleUpdateTest}
            currentUserId={props.user.id}
          />
        );
      case 'dept-notes': 
        return <InterDepartmentalNotesView />;
      case 'messages': return <MessagingView messages={data.messages || []} currentUser={props.user} contacts={[...(data.patients || []), ...staffUsers]} onSendMessage={async (rec, content, patId) => { await api.sendMessage({recipientId: rec, content, patientId: patId, senderId: props.user.id}); fetchData(); }} onStartCall={handleStartCall} onAiChannelCommand={async () => { addToast('AI feature coming soon', 'info'); return ''; }} />;
      case 'telemedicine': return selectedPatientForCall ? <TelemedicineView currentUser={props.user} availableContacts={data.patients || []} onEndCall={() => handleViewChange('messages')} onStartCall={(contactId: string) => { const patient = data.patients.find((p: Patient) => p.id === contactId); if (patient) { setSelectedPatientForCall(patient); } }} /> : <div>Loading...</div>;
      case 'settings': return <SettingsView user={props.user} />;
      default: return <div>Lab Queue</div>;
    }
  };

  return (
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={handleViewChange} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Lab Technician Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {/* Audit Logging Warning */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <Icons.AlertCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Audit & Compliance Notice:</strong> All actions including data access, test modifications, searches, and view navigation are logged for HIPAA compliance and security monitoring.
            </p>
          </div>
        </div>
      </div>
      {renderContent()}
      
      {/* Create Lab Test Request Modal */}
      <CreateLabTestRequestModal
        isOpen={isCreateRequestModalOpen}
        onClose={() => setIsCreateRequestModalOpen(false)}
        onCreateRequest={handleCreateRequest}
        currentUserId={props.user.id}
      />
    </DashboardLayout>
  );
};

export default LabTechnicianDashboard;

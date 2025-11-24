import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient, TriageEntry } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import { useWebSocket } from '../../hooks/useWebSocket.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { TriageQueueView } from './TriageQueueView.tsx';
import { InpatientView } from './InpatientView.tsx';
import { PatientLookupView } from '../receptionist/PatientLookupView.tsx';
import { TeamMessagingView } from '../../components/common/TeamMessagingView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';
import { InterDepartmentalNotesView } from '../hcw/InterDepartmentalNotesView.tsx';
import { TelemedicineView } from '../common/TelemedicineView.tsx';

type NurseView = 'triage' | 'inpatients' | 'lookup' | 'messages' | 'telemedicine' | 'dept-notes' | 'settings';

interface NurseDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: NurseView; setActiveView: (view: NurseView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'triage', label: 'Triage Queue', icon: Icons.UsersIcon },
    { id: 'inpatients', label: 'Inpatient Monitoring', icon: Icons.BedIcon },
    { id: 'lookup', label: 'Patient Lookup', icon: Icons.SearchIcon },
    { id: 'messages', label: 'Messages', icon: Icons.MessageSquareIcon },
    { id: 'dept-notes', label: 'Dept. Notes', icon: Icons.BellIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as NurseView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}><item.icon /><span>{item.label}</span></button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('triage')} className="sidebar-logo-button"><Logo /><h1>ChiHealth Nursing</h1></button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div><button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}><Icons.SettingsIcon /><span>Settings</span></button></div>
    </aside>
  );
};

const NurseDashboard: React.FC<NurseDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<NurseView>('triage');
  const [data, setData] = useState<{ triageQueue: TriageEntry[], inpatients: Patient[], messages: any[], patients: Patient[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [selectedPatientForCall, setSelectedPatientForCall] = useState<Patient | null>(null);
  const [_lastUpdated, _setLastUpdated] = useState<Date>(new Date());
  const { addToast } = useToasts();

  // WebSocket for real-time triage and patient updates
  useWebSocket('nurse-dashboard', () => {
    fetchData();
  });

  const handleStartCall = (contact: User | Patient) => {
    if (contact.role === 'patient') {
      setSelectedPatientForCall(contact as Patient);
      setActiveView('telemedicine');
    } else {
      addToast('Video calls are available for patients only', 'info');
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [nurseData, staff] = await Promise.all([
        api.fetchNurseData(),
        api.fetchStaffUsers()
      ]);
      setData(nurseData);
      setStaffUsers(staff);
      _setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch nurse data:", error);
      addToast('Failed to load nursing data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, props.user.currentOrganization.id]);

  const handleSaveVitals = async (patientId: string, vitals: any) => {
    await api.saveVitals(patientId, vitals);
    addToast('Vitals saved successfully. Patient moved to waiting room.', 'success');
    fetchData();
  };

  const renderContent = () => {
    if (activeView === 'lookup') {
      return <PatientLookupView />;
    }
    
    if (isLoading || !data) return <FullScreenLoader message="Loading nursing station..." />;
    
    switch (activeView) {
      case 'triage': return <TriageQueueView triageQueue={data.triageQueue} onSaveVitals={handleSaveVitals} />;
      case 'inpatients': return <InpatientView patients={data.inpatients} />;
      case 'messages': return <TeamMessagingView messages={data.messages || []} currentUser={props.user} staffContacts={staffUsers} onSendMessage={async (rec, content) => { await api.sendMessage({recipientId: rec, content, senderId: props.user.id}); fetchData(); }} onStartCall={handleStartCall} />;
      case 'telemedicine': return selectedPatientForCall ? <TelemedicineView currentUser={props.user} availableContacts={data.patients || []} onEndCall={() => setActiveView('messages')} onStartCall={(contactId) => { const patient = data.patients.find(p => p.id === contactId); if (patient) { setSelectedPatientForCall(patient); } }} /> : <div>Loading...</div>;
      case 'dept-notes': return <InterDepartmentalNotesView />;
      case 'settings': return <SettingsView user={props.user} />;
      default: return <div>Triage Queue</div>;
    }
  };

  return (
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Nurse Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default NurseDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient, LabTest, Message } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { HCWDashboardOverview } from './HCWDashboardOverview.tsx';
import { ScheduleView } from './ScheduleView.tsx';
import { MyPatientsView } from './MyPatientsView.tsx';
import { EHRView } from '../../components/common/EHRView.tsx';
import { PrescriptionsView } from './PrescriptionsView.tsx';
import { LabRequestsView } from './LabRequestsView.tsx';
import { MessagingView } from '../../components/common/MessagingView.tsx';
import { TelemedicineView } from '../common/TelemedicineView.tsx';
import { ClinicalNoteModal } from '../../components/hcw/ClinicalNoteModal.tsx';
import { generatePdfFromHtml } from '../../utils/generatePdf.ts';
import { generateAiChannelResponse } from '../../services/geminiService.ts';
import { SettingsView } from '../common/SettingsView.tsx';

type HcwView = 'overview' | 'schedule' | 'patients' | 'ehr' | 'prescriptions' | 'labs' | 'messages' | 'telemedicine' | 'settings';

interface HealthcareWorkerDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: HcwView; setActiveView: (view: HcwView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Icons.LayoutDashboardIcon },
    { id: 'schedule', label: "Today's Schedule", icon: Icons.CalendarIcon },
    { id: 'patients', label: 'My Patients', icon: Icons.UsersIcon },
    { id: 'messages', label: 'Messages', icon: Icons.MessageSquareIcon },
    { id: 'prescriptions', label: 'E-Prescriptions', icon: Icons.PillIcon },
    { id: 'labs', label: 'Lab Requests', icon: Icons.FlaskConicalIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as HcwView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}><item.icon /><span>{item.label}</span></button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('overview')} className="sidebar-logo-button"><Logo /><h1>ChiHealth</h1></button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div><button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}><Icons.SettingsIcon /><span>Settings</span></button></div>
    </aside>
  );
};

const HealthcareWorkerDashboard: React.FC<HealthcareWorkerDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<HcwView>('overview');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [noteFromCall, setNoteFromCall] = useState('');
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const hcwData = await api.fetchHcwData();
      setData(hcwData);
    } catch (error) {
      console.error("Failed to fetch HCW data:", error);
      addToast('Failed to load dashboard data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveView('ehr');
  };
  
  const handleStartCall = (patientId: string) => {
    const patient = data?.patients.find((p: Patient) => p.id === patientId);
    if (patient) {
        setSelectedPatient(patient);
        setActiveView('telemedicine');
    }
  };

  const handleEndCall = (aiNote?: string) => {
    setActiveView('schedule');
    if (aiNote) {
        setNoteFromCall(aiNote);
        setNoteModalOpen(true);
        addToast('Telemedicine call ended. Review the AI-generated note.', 'info');
    }
  };

  const handleAiCommand = async (command: string, patientId: string) => {
    const patient = data.patients.find((p: Patient) => p.id === patientId);
    if (!patient) return;
    const patientNotes = await Promise.resolve([]); // Fetch notes for patient if not already loaded
    const patientLabs = data.labTests.filter((l: LabTest) => l.patientId === patientId);
    
    const response = await generateAiChannelResponse(command, patient, patientNotes, patientLabs);
    
    const aiMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'ai-assistant',
      senderName: 'AI Assistant',
      recipientId: props.user.id,
      patientId,
      content: response,
      timestamp: new Date().toISOString()
    };
    setData((prev: any) => ({...prev, messages: [...prev.messages, aiMessage]}));
  };

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading clinician dashboard..." />;
    
    switch (activeView) {
      case 'overview': return <HCWDashboardOverview user={props.user} appointments={data.appointments} messages={data.messages} labTests={data.labTests} />;
  case 'schedule': return <ScheduleView appointments={data.appointments} patients={data.patients} onStartCall={handleStartCall} onRefresh={fetchData} />;
      case 'patients': return <MyPatientsView patients={data.patients} onSelectPatient={handleSelectPatient} />;
      case 'ehr': return selectedPatient ? <EHRView
        patient={selectedPatient}
        currentUser={props.user}
        clinicalNotes={[]}
        labTests={data.labTests.filter((l: LabTest) => l.patientId === selectedPatient.id)}
        onDownload={async () => {
          const notesHtml = '';
          const labsHtml = data.labTests.filter((l: LabTest) => l.patientId === selectedPatient.id).map((l: LabTest) => `<div><strong>${l.testName}</strong>: ${l.result || 'Pending'} (${l.status})</div>`).join('');
          const html = `
            <h1>Patient: ${selectedPatient.name} (ID: ${selectedPatient.id})</h1>
            <p>DOB: ${selectedPatient.dateOfBirth || ''}</p>
            <h2>Clinical Notes</h2>
            ${notesHtml || '<p>No notes available</p>'}
            <h2>Lab Tests</h2>
            ${labsHtml || '<p>No lab results</p>'}
          `;
          try { await generatePdfFromHtml(html); } catch (err) { console.error('Failed to open print window', err); addToast('Failed to generate PDF.', 'error'); }
        }}
        onBack={() => setActiveView('patients')}
        onCreateClinicalNote={async (note) => { await api.createClinicalNote(note); addToast('Note saved.', 'success'); fetchData(); }}
        onOrderLabTest={async (test) => { await api.orderLabTest(test); addToast('Lab test ordered.', 'success'); fetchData(); }}
        onCreatePrescription={async (rx) => { await api.createPrescription(rx); addToast('Prescription created.', 'success'); fetchData(); }}
        onReferPatient={async (ref) => { await api.referPatient(ref); addToast('Referral sent.', 'success'); fetchData(); }}
      /> : <div>Please select a patient.</div>;
      case 'prescriptions': return <PrescriptionsView prescriptions={data.prescriptions} patients={data.patients} onCreatePrescription={async (rx) => { await api.createPrescription(rx); addToast('Prescription created.', 'success'); fetchData(); }} />;
      case 'labs': return <LabRequestsView labTests={data.labTests} />;
      case 'messages': return <MessagingView messages={data.messages} currentUser={props.user} contacts={data.patients} onSendMessage={async (rec, content, patId) => { await api.sendMessage({recipientId: rec, content, patientId: patId, senderId: props.user.id}); fetchData(); }} onStartCall={(contact) => handleStartCall(contact.id)} onAiChannelCommand={handleAiCommand} />;
      case 'telemedicine': return selectedPatient ? <TelemedicineView onEndCall={handleEndCall} patientName={selectedPatient.name} doctorName={props.user.name} /> : <div>No call active.</div>
      case 'settings': return <SettingsView user={props.user} />;
      default: return <div>Overview</div>;
    }
  };

  return (
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Clinician Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {renderContent()}
       {selectedPatient && <ClinicalNoteModal isOpen={isNoteModalOpen} onClose={() => setNoteModalOpen(false)} patient={selectedPatient} doctor={props.user} onSave={async (note) => { await api.createClinicalNote(note); addToast('Note from call saved.', 'success'); fetchData(); setNoteModalOpen(false); setNoteFromCall(''); }} initialContent={noteFromCall} />}
    </DashboardLayout>
  );
};

export default HealthcareWorkerDashboard;

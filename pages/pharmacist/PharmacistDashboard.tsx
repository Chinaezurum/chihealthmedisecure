import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient, Prescription } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import { useWebSocket } from '../../hooks/useWebSocket.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { PharmacyQueueView } from './PharmacyQueueView.tsx';
import { PatientLookupView } from '../receptionist/PatientLookupView.tsx';
import { SafetyCheckModal } from '../../components/pharmacist/SafetyCheckModal.tsx';
import { runPharmacySafetyCheck } from '../../services/geminiService.ts';
import { SettingsView } from '../common/SettingsView.tsx';
import { TeamMessagingView } from '../../components/common/TeamMessagingView.tsx';
import { InterDepartmentalNotesView } from '../hcw/InterDepartmentalNotesView.tsx';
import { InventoryView } from './InventoryView.tsx';
import { DispensingHistoryView } from './DispensingHistoryView.tsx';
import { TelemedicineView } from '../common/TelemedicineView.tsx';

type PharmacistView = 'queue' | 'lookup' | 'inventory' | 'history' | 'messages' | 'telemedicine' | 'dept-notes' | 'settings';

interface PharmacistDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: PharmacistView; setActiveView: (view: PharmacistView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'queue', label: 'Fulfillment Queue', icon: Icons.PillIcon },
    { id: 'lookup', label: 'Patient Lookup', icon: Icons.SearchIcon },
    { id: 'inventory', label: 'Inventory', icon: Icons.ArchiveIcon },
    { id: 'history', label: 'Dispensing History', icon: Icons.ClipboardListIcon },
    { id: 'messages', label: 'Messages', icon: Icons.MessageSquareIcon },
    { id: 'dept-notes', label: 'Dept. Notes', icon: Icons.BellIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as PharmacistView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}><item.icon /><span>{item.label}</span></button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('queue')} className="sidebar-logo-button"><Logo /><h1>ChiHealth Pharmacy</h1></button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div><button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}><Icons.SettingsIcon /><span>Settings</span></button></div>
    </aside>
  );
};

const PharmacistDashboard: React.FC<PharmacistDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<PharmacistView>('queue');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSafetyModalOpen, setSafetyModalOpen] = useState(false);
  const [safetyCheckResult, setSafetyCheckResult] = useState(null);
  const [isSafetyCheckLoading, setIsSafetyCheckLoading] = useState(false);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [selectedPatientForCall, setSelectedPatientForCall] = useState<Patient | null>(null);
  const [_lastUpdated, _setLastUpdated] = useState<Date>(new Date());
  const { addToast } = useToasts();

  // WebSocket for real-time prescription updates
  useWebSocket('pharmacist-dashboard', () => {
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
      const [pharmacistData, staff] = await Promise.all([
        api.fetchPharmacistData(),
        api.fetchStaffUsers()
      ]);
      setData(pharmacistData);
      setStaffUsers(staff);
      _setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch pharmacist data:", error);
      addToast('Failed to load pharmacy data.', 'error');
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

  const handleUpdateStatus = async (prescriptionId: string, status: Prescription['status']) => {
    // Audit log for prescription status update
    const auditLog = {
      action: 'UPDATE_PRESCRIPTION_STATUS',
      prescriptionId,
      newStatus: status,
      updatedDateTime: new Date().toISOString(),
      updatedBy: props.user.id || 'PHARM001',
      updatedByName: props.user.name || 'Current Pharmacist',
    };
    console.log('Prescription status update audit:', auditLog);
    
    await api.updatePrescriptionStatus(prescriptionId, status);
    addToast(`Prescription marked as ${status}.`, 'success');
    fetchData();
  };

  const handleRunSafetyCheck = async (prescriptionId: string) => {
    // Audit log for safety check
    const auditLog = {
      action: 'RUN_SAFETY_CHECK',
      prescriptionId,
      checkInitiatedDateTime: new Date().toISOString(),
      initiatedBy: props.user.id || 'PHARM001',
      initiatedByName: props.user.name || 'Current Pharmacist',
    };
    console.log('Safety check audit:', auditLog);
    
    setSafetyModalOpen(true);
    setIsSafetyCheckLoading(true);
    setSafetyCheckResult(null);
    try {
      const rx = data.prescriptions.find((p: Prescription) => p.id === prescriptionId);
      const patientPrescriptions = data.prescriptions.filter((p: Prescription) => p.patientId === rx.patientId && p.id !== rx.id && p.status === 'Active');
      
      const result = await runPharmacySafetyCheck(rx.medication, patientPrescriptions.map((p: Prescription) => p.medication));
      setSafetyCheckResult(result as any);
      
      // Log safety check completion
      console.log('Safety check completed:', {
        ...auditLog,
        checkCompletedDateTime: new Date().toISOString(),
        result: result ? 'Success' : 'Failed',
      });
    } catch (error) {
       addToast('AI Safety Check failed to run.', 'error');
       setSafetyModalOpen(false);
    } finally {
        setIsSafetyCheckLoading(false);
    }
  };

  const renderContent = () => {
    if (activeView === 'lookup') {
      return <PatientLookupView />;
    }
    
    if (isLoading || !data) return <FullScreenLoader message="Loading pharmacy dashboard..." />;
    
    switch (activeView) {
      case 'queue': return <PharmacyQueueView prescriptions={data.prescriptions} patients={data.patients} doctors={data.doctors} onUpdateStatus={handleUpdateStatus} onRunSafetyCheck={handleRunSafetyCheck} />;
      case 'inventory': return <InventoryView />;
      case 'history': return <DispensingHistoryView />;
      case 'messages': return <TeamMessagingView messages={data.messages || []} currentUser={props.user} staffContacts={staffUsers} onSendMessage={async (rec, content) => { await api.sendMessage({recipientId: rec, content, senderId: props.user.id}); fetchData(); }} onStartCall={handleStartCall} />;
      case 'telemedicine': return selectedPatientForCall ? <TelemedicineView currentUser={props.user} availableContacts={data.patients || []} onEndCall={() => setActiveView('messages')} onStartCall={(contactId) => { const patient = data.patients.find((p: Patient) => p.id === contactId); if (patient) { setSelectedPatientForCall(patient); } }} /> : <div>Loading...</div>;
      case 'dept-notes': return <InterDepartmentalNotesView />;
      case 'settings': return <SettingsView user={props.user} />;
      default: return <div>Queue</div>;
    }
  };

  return (
    <>
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Pharmacist Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
        {renderContent()}
      </DashboardLayout>
      <SafetyCheckModal 
        isOpen={isSafetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
        isLoading={isSafetyCheckLoading}
        result={safetyCheckResult}
      />
    </>
  );
};

export default PharmacistDashboard;

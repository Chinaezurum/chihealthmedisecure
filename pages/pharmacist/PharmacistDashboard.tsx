import React, { useState, useEffect, useCallback } from 'react';
import { User, Prescription } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { PharmacyQueueView } from './PharmacyQueueView.tsx';
import { SafetyCheckModal } from '../../components/pharmacist/SafetyCheckModal.tsx';
import { runPharmacySafetyCheck } from '../../services/geminiService.ts';
import { SettingsView } from '../common/SettingsView.tsx';

type PharmacistView = 'queue' | 'inventory' | 'history' | 'settings';

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
    { id: 'inventory', label: 'Inventory (Soon)', icon: Icons.ArchiveIcon },
    { id: 'history', label: 'Dispensing History (Soon)', icon: Icons.ClipboardListIcon },
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
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const pharmacistData = await api.fetchPharmacistData();
      setData(pharmacistData);
    } catch (error) {
      console.error("Failed to fetch pharmacist data:", error);
      addToast('Failed to load pharmacy data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleUpdateStatus = async (prescriptionId: string, status: Prescription['status']) => {
    await api.updatePrescriptionStatus(prescriptionId, status);
    addToast(`Prescription marked as ${status}.`, 'success');
    fetchData();
  };

  const handleRunSafetyCheck = async (prescriptionId: string) => {
    setSafetyModalOpen(true);
    setIsSafetyCheckLoading(true);
    setSafetyCheckResult(null);
    try {
      const rx = data.prescriptions.find((p: Prescription) => p.id === prescriptionId);
      const patientPrescriptions = data.prescriptions.filter((p: Prescription) => p.patientId === rx.patientId && p.id !== rx.id && p.status === 'Active');
      
      const result = await runPharmacySafetyCheck(rx.medication, patientPrescriptions.map((p: Prescription) => p.medication));
      setSafetyCheckResult(result as any);
    } catch (error) {
       addToast('AI Safety Check failed to run.', 'error');
       setSafetyModalOpen(false);
    } finally {
        setIsSafetyCheckLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading pharmacy dashboard..." />;
    
    switch (activeView) {
      case 'queue': return <PharmacyQueueView prescriptions={data.prescriptions} patients={data.patients} doctors={data.doctors} onUpdateStatus={handleUpdateStatus} onRunSafetyCheck={handleRunSafetyCheck} />;
      case 'inventory': return <div>Inventory Management Coming Soon</div>;
      case 'history': return <div>Dispensing History Coming Soon</div>;
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

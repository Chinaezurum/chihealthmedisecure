import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient, TriageEntry } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { TriageQueueView } from './TriageQueueView.tsx';
import { InpatientView } from './InpatientView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

type NurseView = 'triage' | 'inpatients' | 'settings';

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
  const [data, setData] = useState<{ triageQueue: TriageEntry[], inpatients: Patient[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const nurseData = await api.fetchNurseData();
      setData(nurseData);
    } catch (error) {
      console.error("Failed to fetch nurse data:", error);
      addToast('Failed to load nursing data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleSaveVitals = async (patientId: string, vitals: any) => {
    await api.saveVitals(patientId, vitals);
    addToast('Vitals saved successfully. Patient moved to waiting room.', 'success');
    fetchData();
  };

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading nursing station..." />;
    
    switch (activeView) {
      case 'triage': return <TriageQueueView triageQueue={data.triageQueue} onSaveVitals={handleSaveVitals} />;
      case 'inpatients': return <InpatientView patients={data.inpatients} />;
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

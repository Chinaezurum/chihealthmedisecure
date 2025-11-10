import React, { useState, useEffect, useCallback } from 'react';
import { User, LabTest } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { LabQueueView } from './LabQueueView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

type LabView = 'queue' | 'history' | 'settings';

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
    { id: 'history', label: 'Completed Tests (Soon)', icon: Icons.ClipboardListIcon },
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
  const [data, setData] = useState<{ labTests: LabTest[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const labData = await api.fetchLabTechnicianData();
      setData(labData);
    } catch (error) {
      console.error("Failed to fetch lab data:", error);
      addToast('Failed to load lab data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleUpdateTest = async (testId: string, status: LabTest['status'], result?: string) => {
    await api.updateLabTest(testId, status, result);
    addToast(`Test ${testId} updated to ${status}.`, 'success');
    fetchData();
  };

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading laboratory dashboard..." />;
    
    switch (activeView) {
      case 'queue': return <LabQueueView labTests={data.labTests} onUpdateTest={handleUpdateTest} />;
      case 'history': return <div>Completed Test History Coming Soon</div>;
      case 'settings': return <SettingsView user={props.user} />;
      default: return <div>Lab Queue</div>;
    }
  };

  return (
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Lab Technician Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default LabTechnicianDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { User, TransportRequest, LabTest } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { TransportView } from './TransportView.tsx';
import { LabSampleTrackingView } from './LabSampleTrackingView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

type LogisticsView = 'transport' | 'samples' | 'settings';

interface LogisticsDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: LogisticsView; setActiveView: (view: LogisticsView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'transport', label: 'Transport Requests', icon: Icons.TruckIcon },
    { id: 'samples', label: 'Sample Tracking', icon: Icons.MicroscopeIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as LogisticsView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}><item.icon /><span>{item.label}</span></button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('transport')} className="sidebar-logo-button"><Logo /><h1>ChiHealth Logistics</h1></button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div><button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}><Icons.SettingsIcon /><span>Settings</span></button></div>
    </aside>
  );
};

const LogisticsDashboard: React.FC<LogisticsDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<LogisticsView>('transport');
  const [data, setData] = useState<{ transportRequests: TransportRequest[], labSamples: LabTest[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const logisticsData = await api.fetchLogisticsData();
      setData(logisticsData);
    } catch (error) {
      console.error("Failed to fetch logistics data:", error);
      addToast('Failed to load logistics data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleUpdateTransportStatus = async (id: string, status: TransportRequest['status']) => {
    await api.updateTransportRequestStatus(id, status);
    addToast(`Transport request ${id} updated.`, 'success');
    fetchData();
  };

  const handleUpdateSampleStatus = async (id: string, status: LabTest['status']) => {
    await api.updateLabSampleStatus(id, status);
    addToast(`Lab sample ${id} updated.`, 'success');
    fetchData();
  };

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading logistics dashboard..." />;
    
    switch (activeView) {
      case 'transport': return <TransportView requests={data.transportRequests} onUpdateStatus={handleUpdateTransportStatus} />;
      case 'samples': return <LabSampleTrackingView labTests={data.labSamples} onUpdateStatus={handleUpdateSampleStatus} />;
      case 'settings': return <SettingsView user={props.user} />;
      default: return <div>Transport Requests</div>;
    }
  };

  return (
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Logistics Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default LogisticsDashboard;

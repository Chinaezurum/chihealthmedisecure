import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient, Appointment } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { CheckInView } from './CheckInView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

type ReceptionistView = 'checkin' | 'walkin' | 'settings';

interface ReceptionistDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: ReceptionistView; setActiveView: (view: ReceptionistView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'checkin', label: 'Patient Check-In', icon: Icons.ClipboardListIcon },
    { id: 'walkin', label: 'Register Walk-In (Soon)', icon: Icons.UsersIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as ReceptionistView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}><item.icon /><span>{item.label}</span></button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('checkin')} className="sidebar-logo-button"><Logo /><h1>ChiHealth Reception</h1></button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div><button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}><Icons.SettingsIcon /><span>Settings</span></button></div>
    </aside>
  );
};

const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<ReceptionistView>('checkin');
  const [data, setData] = useState<{ appointments: Appointment[], patients: Patient[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const receptionistData = await api.fetchReceptionistData();
      setData(receptionistData);
    } catch (error) {
      console.error("Failed to fetch receptionist data:", error);
      addToast('Failed to load appointment data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);
  
  const handleCheckIn = async (appointmentId: string) => {
    await api.checkInPatient(appointmentId);
    addToast('Patient checked in successfully!', 'success');
    fetchData();
  }

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading reception desk..." />;
    
    switch (activeView) {
      case 'checkin': return <CheckInView appointments={data.appointments} patients={data.patients} onCheckIn={handleCheckIn} />;
      case 'walkin': return <div>Walk-in registration coming soon.</div>;
      case 'settings': return <SettingsView user={props.user} />;
      default: return <div>Check-In</div>;
    }
  };

  return (
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Receptionist Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default ReceptionistDashboard;

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
import { TeamMessagingView } from '../../components/common/TeamMessagingView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

type LogisticsView = 'transport' | 'samples' | 'messages' | 'settings';

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
    { id: 'messages', label: 'Team Messages', icon: Icons.MessageSquareIcon },
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
  const [data, setData] = useState<{ transportRequests: TransportRequest[], labSamples: LabTest[], messages?: any[], patients?: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [sessionStartTime] = useState(new Date().toISOString());
  const { addToast } = useToasts();

  // Session tracking
  useEffect(() => {
    const sessionLog = {
      timestamp: sessionStartTime,
      userId: props.user.id,
      userName: props.user.name,
      userRole: 'logistics',
      action: 'session_start',
      organizationId: props.user.currentOrganization.id
    };
    console.log('Logistics Session Start Audit:', sessionLog);

    return () => {
      const sessionEndLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userName: props.user.name,
        userRole: 'logistics',
        action: 'session_end',
        sessionDuration: Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 1000),
        organizationId: props.user.currentOrganization.id
      };
      console.log('Logistics Session End Audit:', sessionEndLog);
    };
  }, [props.user.id, props.user.name, props.user.currentOrganization.id, sessionStartTime]);

  // View navigation tracking
  useEffect(() => {
    const navLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'logistics',
      action: 'view_navigation',
      view: activeView,
      organizationId: props.user.currentOrganization.id
    };
    console.log('Logistics View Navigation Audit:', navLog);
  }, [activeView, props.user.id, props.user.currentOrganization.id]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Audit log for data fetch
      const fetchLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'logistics',
        action: 'fetch_dashboard_data',
        organizationId: props.user.currentOrganization.id
      };
      console.log('Logistics Data Fetch Audit:', fetchLog);
      
      const logisticsData = await api.fetchLogisticsData();
      setData(logisticsData);
      
      // Fetch staff users for messaging
      try {
        const staff = await api.fetchStaffUsers();
        setStaffUsers(staff);
      } catch (error) {
        console.error('Failed to fetch staff users:', error);
        // Continue even if staff fetch fails
      }
    } catch (error) {
      console.error("Failed to fetch logistics data:", error);
      addToast('Failed to load logistics data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, props.user.id, props.user.currentOrganization.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleUpdateTransportStatus = async (id: string, status: TransportRequest['status']) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'logistics',
      action: 'update_transport_status',
      transportRequestId: id,
      newStatus: status,
      organizationId: props.user.currentOrganization.id
    };
    console.log('Logistics Transport Status Update Audit:', auditLog);
    
    await api.updateTransportRequestStatus(id, status);
    addToast(`Transport request ${id} updated to ${status}.`, 'success');
    fetchData();
  };

  const handleUpdateSampleStatus = async (id: string, status: LabTest['status']) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'logistics',
      action: 'update_sample_status',
      sampleId: id,
      newStatus: status,
      organizationId: props.user.currentOrganization.id
    };
    console.log('Logistics Sample Status Update Audit:', auditLog);
    
    await api.updateLabSampleStatus(id, status);
    addToast(`Lab sample ${id} updated to ${status}.`, 'success');
    fetchData();
  };

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading logistics dashboard..." />;
    
    switch (activeView) {
      case 'transport': 
        return <TransportView 
          requests={data.transportRequests} 
          onUpdateStatus={handleUpdateTransportStatus}
          currentUserId={props.user.id}
        />;
      case 'samples': 
        return <LabSampleTrackingView 
          labTests={data.labSamples} 
          onUpdateStatus={handleUpdateSampleStatus}
          currentUserId={props.user.id}
        />;
      case 'messages':
        return <TeamMessagingView 
          messages={data.messages || []} 
          currentUser={props.user} 
          staffContacts={staffUsers} 
          onSendMessage={async (recipientId, content) => {
            // Audit logging
            const auditLog = {
              timestamp: new Date().toISOString(),
              userId: props.user.id,
              userRole: 'logistics',
              action: 'send_team_message',
              recipientId,
              organizationId: props.user.currentOrganization.id
            };
            console.log('Logistics Team Message Send Audit:', auditLog);
            
            await api.sendMessage({recipientId, content, senderId: props.user.id}); 
            fetchData();
          }} 
          onStartCall={() => addToast('Call feature coming soon', 'info')} 
        />;
      case 'settings': 
        return <SettingsView user={props.user} />;
      default: 
        return <div>Transport Requests</div>;
    }
  };

  return (
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Logistics Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default LogisticsDashboard;

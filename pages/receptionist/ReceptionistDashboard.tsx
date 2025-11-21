import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient, Appointment, IncomingReferral } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { CheckInView } from './CheckInView.tsx';
import { WalkInRegistrationView } from './WalkInRegistrationView.tsx';
import { PatientLookupView } from './PatientLookupView.tsx';
import { IncomingReferralsView } from './IncomingReferralsView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';
import { InterDepartmentalNotesView } from '../hcw/InterDepartmentalNotesView.tsx';
import { MessagingView } from '../../components/common/MessagingView.tsx';
import { TelemedicineView } from '../common/TelemedicineView.tsx';

type ReceptionistView = 'lookup' | 'checkin' | 'walkin' | 'referrals' | 'dept-notes' | 'messages' | 'telemedicine' | 'settings';

interface ReceptionistDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: ReceptionistView; setActiveView: (view: ReceptionistView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'lookup', label: 'Patient Lookup', icon: Icons.SearchIcon },
    { id: 'checkin', label: 'Patient Check-In', icon: Icons.ClipboardListIcon },
    { id: 'walkin', label: 'Register Walk-In', icon: Icons.UserPlusIcon },
    { id: 'referrals', label: 'Incoming Referrals', icon: Icons.UsersIcon },
    { id: 'dept-notes', label: 'Team Messages', icon: Icons.BellIcon },
    { id: 'messages', label: 'Chat', icon: Icons.MessageSquareIcon },
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
  const [activeView, setActiveView] = useState<ReceptionistView>('lookup');
  const [data, setData] = useState<{ appointments: Appointment[], patients: Patient[], messages?: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralToRegister, setReferralToRegister] = useState<IncomingReferral | null>(null);
  const [sessionStartTime] = useState(new Date().toISOString());
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [selectedPatientForCall, setSelectedPatientForCall] = useState<Patient | null>(null);
  const { addToast } = useToasts();

  // Audit-logged view switcher
  const handleViewChange = useCallback((newView: ReceptionistView) => {
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'receptionist',
      action: 'switch_view',
      fromView: activeView,
      toView: newView,
      organizationId: props.user.currentOrganization.id
    };
    console.log('Receptionist Dashboard View Navigation Audit:', auditLog);
    setActiveView(newView);
  }, [activeView, props.user.id, props.user.currentOrganization.id]);

  // Session tracking
  useEffect(() => {
    const sessionAudit = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'receptionist',
      action: 'session_start',
      organizationId: props.user.currentOrganization.id,
      sessionId: `${props.user.id}_${sessionStartTime}`
    };
    console.log('Receptionist Dashboard Session Start Audit:', sessionAudit);

    return () => {
      const sessionEndAudit = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'receptionist',
        action: 'session_end',
        organizationId: props.user.currentOrganization.id,
        sessionId: `${props.user.id}_${sessionStartTime}`,
        sessionDuration: new Date().getTime() - new Date(sessionStartTime).getTime()
      };
      console.log('Receptionist Dashboard Session End Audit:', sessionEndAudit);
    };
  }, [props.user.id, props.user.currentOrganization.id, sessionStartTime]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Audit logging for data fetch
      const auditLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'receptionist',
        action: 'fetch_receptionist_dashboard_data',
        organizationId: props.user.currentOrganization.id
      };
      console.log('Receptionist Dashboard Data Fetch Audit:', auditLog);
      
      const receptionistData = await api.fetchReceptionistData();
      setData(receptionistData);
      
      // Fetch staff users for messaging
      const staff = await api.fetchStaffUsers();
      setStaffUsers(staff);
    } catch (error) {
      console.error("Failed to fetch receptionist data:", error);
      addToast('Failed to load appointment data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, props.user.id, props.user.currentOrganization.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);
  
  const handleCheckIn = async (appointmentId: string) => {
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'receptionist',
      action: 'check_in_patient',
      appointmentId,
      organizationId: props.user.currentOrganization.id
    };
    console.log('Patient Check-In Audit:', auditLog);
    
    await api.checkInPatient(appointmentId);
    addToast('Patient checked in successfully!', 'success');
    fetchData();
  }

  const handleStartCall = (contact: User | Patient) => {
    if (contact.role === 'patient') {
      setSelectedPatientForCall(contact as Patient);
      handleViewChange('telemedicine');
    } else {
      addToast('Video calls are available for patients only', 'info');
    }
  };

  const handleRegisterFromReferral = (referral: IncomingReferral) => {
    setReferralToRegister(referral);
    setActiveView('walkin');
  };

  const renderContent = () => {
    if (activeView === 'lookup') {
      return <PatientLookupView currentUserId={props.user.id} />;
    }

    if (activeView === 'referrals') {
      return <IncomingReferralsView onRegisterPatient={handleRegisterFromReferral} currentUserId={props.user.id} />;
    }
    
    if (isLoading || !data) return <FullScreenLoader message="Loading reception desk..." />;
    
    switch (activeView) {
      case 'checkin': return <CheckInView appointments={data.appointments} patients={data.patients} onCheckIn={handleCheckIn} currentUserId={props.user.id} />;
      case 'walkin': return <WalkInRegistrationView 
        currentUserId={props.user.id}
        onRegistrationComplete={(patientId?: string) => {
          if (referralToRegister && patientId) {
            // Update referral status to "Patient Registered"
            api.updateIncomingReferralStatus(referralToRegister.id, 'Patient Registered', patientId, 'Patient successfully registered in our system');
          }
          setReferralToRegister(null);
          fetchData();
          addToast('Patient registered successfully!', 'success');
        }} 
        prefillData={referralToRegister ? {
          name: referralToRegister.patientName,
          dateOfBirth: '', // Calculate from age if needed
          allergies: referralToRegister.allergies || '',
          currentMedications: referralToRegister.currentMedications || ''
        } : undefined}
      />;
      case 'dept-notes': 
        return <InterDepartmentalNotesView />;
      case 'messages': 
        return <MessagingView 
          messages={data?.messages || []} 
          currentUser={props.user} 
          contacts={[...(data?.patients || []), ...staffUsers]} 
          onSendMessage={async (recipientId, content, patientId) => {
            // Audit logging
            const auditLog = {
              timestamp: new Date().toISOString(),
              userId: props.user.id,
              userRole: 'receptionist',
              action: 'send_message',
              recipientId,
              patientId,
              organizationId: props.user.currentOrganization.id
            };
            console.log('Receptionist Message Send Audit:', auditLog);
            
            await api.sendMessage({recipientId, content, patientId, senderId: props.user.id});
            fetchData();
          }} 
          onStartCall={handleStartCall} 
          onAiChannelCommand={async () => { 
            addToast('AI feature coming soon', 'info'); 
            return ''; 
          }} 
        />;
      case 'telemedicine': 
        return selectedPatientForCall ? (
          <TelemedicineView 
            currentUser={props.user} 
            availableContacts={data?.patients || []} 
            onEndCall={() => handleViewChange('messages')} 
            onStartCall={(contactId: string) => { 
              const patient = data?.patients.find((p: Patient) => p.id === contactId); 
              if (patient) { 
                setSelectedPatientForCall(patient); 
              } 
            }} 
          />
        ) : <div>Loading...</div>;
      case 'settings': return <SettingsView user={props.user} />;
      default: return <div>Check-In</div>;
    }
  };

  return (
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={handleViewChange} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={props.onSwitchOrganization} notifications={[]} onMarkNotificationsAsRead={()=>{}} title="Receptionist Dashboard" theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {/* Audit Logging Warning */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <Icons.AlertCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Audit & Compliance Notice:</strong> All reception actions including patient check-ins, registrations, searches, and referral processing are logged for HIPAA compliance.
            </p>
          </div>
        </div>
      </div>
      {renderContent()}
    </DashboardLayout>
  );
};

export default ReceptionistDashboard;

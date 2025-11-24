import React, { useState, useEffect, useCallback } from 'react';
import { Patient, Appointment } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import { useWebSocket } from '../../hooks/useWebSocket.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { DashboardOverview } from './DashboardOverview.tsx';
import { AppointmentsView } from './AppointmentsView.tsx';
import { MessagingView } from '../../components/common/MessagingView.tsx';
import { PrescriptionsView } from './PrescriptionsView.tsx';
import { BillingView } from './BillingView.tsx';
import { EHRView } from '../../components/common/EHRView.tsx';
import { generatePdfFromHtml } from '../../utils/generatePdf.ts';
import { SymptomChecker } from './SymptomChecker.tsx';
import { WearablesView } from './WearablesView.tsx';
import { TelemedicineView } from '../common/TelemedicineView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';
import { InsuranceView } from './InsuranceView.tsx';
import { translations } from '../../translations.ts';

export type PatientView = 'overview' | 'appointments' | 'telemedicine' | 'messages' | 'prescriptions' | 'billing' | 'insurance' | 'records' | 'symptom-checker' | 'wearables' | 'settings';

interface PatientDashboardProps {
  user: Patient;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: PatientView; setActiveView: (view: PatientView) => void; t: (key: string) => string }> = ({ activeView, setActiveView, t }) => {
  const navItems = [
    { id: 'overview', label: t('dashboard'), icon: Icons.LayoutDashboardIcon },
    { id: 'appointments', label: t('appointments'), icon: Icons.CalendarIcon },
    { id: 'telemedicine', label: 'Telemedicine', icon: Icons.VideoIcon },
    { id: 'symptom-checker', label: t('symptomChecker'), icon: Icons.BotMessageSquareIcon },
    { id: 'messages', label: t('messages'), icon: Icons.MessageSquareIcon },
    { id: 'prescriptions', label: t('prescriptions'), icon: Icons.PillIcon },
    { id: 'billing', label: t('billing'), icon: Icons.CreditCardIcon },
    { id: 'insurance', label: 'Insurance', icon: Icons.ShieldCheckIcon },
    { id: 'records', label: t('medicalRecords'), icon: Icons.FolderSearchIcon },
    { id: 'wearables', label: t('healthMetrics'), icon: Icons.HeartPulseIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as PatientView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}><item.icon /><span>{item.label}</span></button>
  );

  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('overview')} className="sidebar-logo-button"><Logo /><h1>ChiHealth</h1></button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div><button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}><Icons.SettingsIcon /><span>{t('settings')}</span></button></div>
    </aside>
  );
};

const PatientDashboard: React.FC<PatientDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<PatientView>('overview');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackgroundRefresh, setIsBackgroundRefresh] = useState(false);
  const [suggestedSpecialty, setSuggestedSpecialty] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [sessionStartTime] = useState(new Date().toISOString());
  const [_lastUpdated, _setLastUpdated] = useState<Date>(new Date());
  const { addToast } = useToasts();

  // WebSocket for real-time patient updates
  useWebSocket('patient-dashboard', () => {
    fetchData(); // Refresh on appointments, prescriptions, billing, lab results updates
  });

  // Session tracking for audit logging
  useEffect(() => {
    const sessionLog = {
      timestamp: sessionStartTime,
      userId: props.user.id,
      userName: props.user.name,
      userRole: 'patient',
      action: 'session_start',
      organizationId: props.user.currentOrganization?.id
    };
    console.log('Patient Dashboard Session Start Audit:', sessionLog);

    return () => {
      const sessionEndLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userName: props.user.name,
        userRole: 'patient',
        action: 'session_end',
        sessionDuration: Math.floor((Date.now() - new Date(sessionStartTime).getTime()) / 1000),
        organizationId: props.user.currentOrganization?.id
      };
      console.log('Patient Dashboard Session End Audit:', sessionEndLog);
    };
  }, [props.user.id, props.user.name, props.user.currentOrganization?.id, sessionStartTime]);

  // RBAC permission check utility
  const hasPermission = useCallback((permission: string): boolean => {
    // Patient role permissions based on backend RBAC
    const patientPermissions = [
      'view_own_appointments',
      'create_own_appointments',
      'cancel_own_appointments',
      'view_own_medical_records',
      'view_own_prescriptions',
      'view_own_lab_results',
      'view_own_bills',
      'make_own_payments',
      'video_call_with_hcw',
      'message_hcw',
    ];

    // Admin and command_center have all permissions
    const role = props.user.role as string;
    if (role === 'admin' || role === 'command_center') return true;

    return patientPermissions.includes(permission);
  }, [props.user.role]);

  // Plan-based feature access (requires Professional+ for telemedicine, wearables)
  const canAccessFeature = useCallback((feature: string): boolean => {
    const plan = props.user.currentOrganization?.planId || 'basic';

    const basicFeatures = ['scheduling', 'patient_portal', 'ehr'];
    const professionalFeatures = [...basicFeatures, 'telemedicine', 'wearables', 'ai_proactive_care'];
    const enterpriseFeatures = [...professionalFeatures, 'audit_log', 'api_access'];

    if (plan === 'enterprise') return enterpriseFeatures.includes(feature);
    if (plan === 'professional') return professionalFeatures.includes(feature);
    return basicFeatures.includes(feature);
  }, [props.user.currentOrganization?.planId]);

  // View navigation audit logging
  const handleViewChange = useCallback((newView: PatientView) => {
    const navLog = {
      timestamp: new Date().toISOString(),
      userId: props.user.id,
      userRole: 'patient',
      action: 'view_navigation',
      fromView: activeView,
      toView: newView,
      organizationId: props.user.currentOrganization?.id
    };
    console.log('Patient Dashboard View Navigation Audit:', navLog);
    setActiveView(newView);
  }, [activeView, props.user.id, props.user.currentOrganization?.id]);

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) {
        setIsBackgroundRefresh(true);
      } else {
        setIsLoading(true);
      }

      // Audit log for data fetch
      const fetchLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'patient',
        action: 'fetch_patient_data',
        organizationId: props.user.currentOrganization?.id
      };
      console.log('Patient Dashboard Data Fetch Audit:', fetchLog);

      const patientData = await api.fetchPatientData();
      setData(patientData);
      _setLastUpdated(new Date());

      // Fetch staff users (including receptionists) for messaging
      try {
        const staff = await api.fetchStaffUsers();
        setStaffUsers(staff);
      } catch (staffError) {
        console.warn('Failed to fetch staff users:', staffError);
        // Don't fail the whole dashboard if staff fetch fails
      }
    } catch (error: any) {
      console.error("Failed to fetch patient data:", error);
      // Audit log for fetch error
      const errorLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'patient',
        action: 'fetch_patient_data_error',
        error: error?.message || 'Unknown error',
        organizationId: props.user.currentOrganization?.id
      };
      console.error('Patient Dashboard Data Fetch Error Audit:', errorLog);

      // Only show error toast for foreground refreshes
      if (!isBackground) {
        if (error?.status === 401) {
          addToast('Session may have expired. Please refresh if issues persist.', 'info');
        } else {
          addToast('Failed to load dashboard data. Please try again.', 'error');
        }
      }
    } finally {
      if (isBackground) {
        setIsBackgroundRefresh(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [addToast, props.user.id, props.user.currentOrganization?.id]);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 minutes (300 seconds) - much less disruptive
    // Uses background refresh to avoid showing loading spinner
    const interval = setInterval(() => {
      // Skip refresh if user is actively typing or in a form
      const activeElement = document.activeElement;
      if (!activeElement || 
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        fetchData(true); // Background refresh
      }
    }, 300000); // 5 minutes instead of 30-60 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleBookAppointment = async (newAppointment: Omit<Appointment, 'id' | 'status' | 'patientId'>) => {
    try {
      // Audit log before booking
      const bookingLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'patient',
        action: 'book_appointment',
        appointmentDetails: {
          doctorId: newAppointment.doctorId,
          specialty: newAppointment.specialty,
          date: newAppointment.date,
          time: newAppointment.time
        },
        organizationId: props.user.currentOrganization?.id
      };
      console.log('Patient Appointment Booking Audit:', bookingLog);

      await api.bookAppointment(newAppointment);
      addToast('Appointment booked successfully!', 'success');

      // Audit log after successful booking
      const successLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'patient',
        action: 'book_appointment_success',
        organizationId: props.user.currentOrganization?.id
      };
      console.log('Patient Appointment Booking Success Audit:', successLog);

      // Refresh data to show the new appointment
      try {
        await fetchData();
      } catch (fetchError) {
        // If fetch fails, don't throw - just log it
        console.warn('Failed to refresh data after booking:', fetchError);
      }
      handleViewChange('appointments');
    } catch (error: any) {
      console.error('Failed to book appointment:', error);

      // Audit log for booking error
      const errorLog = {
        timestamp: new Date().toISOString(),
        userId: props.user.id,
        userRole: 'patient',
        action: 'book_appointment_error',
        error: error?.message || 'Unknown error',
        organizationId: props.user.currentOrganization?.id
      };
      console.error('Patient Appointment Booking Error Audit:', errorLog);

      // Never sign out on booking errors - just show error message
      if (error?.status === 401) {
        addToast('Authentication error. Please try again or refresh the page.', 'error');
      } else if (error?.message) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to book appointment. Please try again.', 'error');
      }
      // Re-throw error so modal can handle it (keep modal open)
      throw error;
    }
  };

  const handleBookAppointmentWithSuggestion = (specialty: string) => {
    setSuggestedSpecialty(specialty);
    handleViewChange('appointments');
  };

  const handleSimulateWearableData = async () => {
    await api.simulateWearableData();
    addToast('New wearable data has been simulated.', 'info');
    fetchData();
  }

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading your dashboard..." />;

    switch (activeView) {
      case 'overview': return <DashboardOverview
        user={props.user}
        appointments={data.appointments}
        prescriptions={data.prescriptions}
        messages={data.messages}
        contacts={[...(data.contacts || []), ...staffUsers]}
        carePlan={data.carePlan}
        t={t}
        setActiveView={handleViewChange}
      />;

      case 'appointments': {
        if (!hasPermission('view_own_appointments')) {
          return <div className="p-8 text-center text-gray-600">
            <Icons.LockIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p>You don't have permission to view appointments.</p>
          </div>;
        }
        const canBookAppointments = hasPermission('create_own_appointments');
        return <AppointmentsView
          appointments={data.appointments}
          rooms={data.rooms}
          onBookAppointment={canBookAppointments ? handleBookAppointment : async () => {
            addToast('You do not have permission to book appointments', 'error');
          }}
          suggestedSpecialty={suggestedSpecialty}
          onSuggestionHandled={() => setSuggestedSpecialty(null)}
          onRefresh={fetchData}
        />;
      }

      case 'messages': {
        if (!hasPermission('message_hcw')) {
          return <div className="p-8 text-center text-gray-600">
            <Icons.LockIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p>You don't have permission to send messages.</p>
          </div>;
        }
        return <MessagingView
          messages={data.messages || []}
          currentUser={props.user}
          contacts={[...(data.contacts || data.doctors || []), ...staffUsers]}
          onSendMessage={async (recId, content, patientId) => {
            await api.sendMessage({ recipientId: recId, content, patientId, senderId: props.user.id });
            fetchData();
          }}
          onStartCall={() => { }}
        />;
      }

      case 'prescriptions': {
        if (!hasPermission('view_own_prescriptions')) {
          return <div className="p-8 text-center text-gray-600">
            <Icons.LockIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p>You don't have permission to view prescriptions.</p>
          </div>;
        }
        // Audit log for prescription access
        const prescriptionLog = {
          timestamp: new Date().toISOString(),
          userId: props.user.id,
          userRole: 'patient',
          action: 'view_own_prescriptions',
          resourceType: 'prescriptions',
          prescriptionCount: data.prescriptions?.length || 0,
          organizationId: props.user.currentOrganization?.id
        };
        console.log('Patient Prescriptions View Audit:', prescriptionLog);
        return <PrescriptionsView prescriptions={data.prescriptions} />;
      }

      case 'billing': {
        if (!hasPermission('view_own_bills')) {
          return <div className="p-8 text-center text-gray-600">
            <Icons.LockIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p>You don't have permission to view billing information.</p>
          </div>;
        }
        // Audit log for billing access
        const billingLog = {
          timestamp: new Date().toISOString(),
          userId: props.user.id,
          userRole: 'patient',
          action: 'view_own_bills',
          resourceType: 'bills',
          billCount: data.bills?.length || 0,
          organizationId: props.user.currentOrganization?.id
        };
        console.log('Patient Billing View Audit:', billingLog);

        const canMakePayments = hasPermission('make_own_payments');
        return <BillingView bills={data.bills} onPayBill={
          canMakePayments
            ? (billId: string) => {
              // Audit log for payment
              const paymentLog = {
                timestamp: new Date().toISOString(),
                userId: props.user.id,
                userRole: 'patient',
                action: 'make_own_payment',
                resourceType: 'payment',
                resourceId: billId,
                organizationId: props.user.currentOrganization?.id
              };
              console.log('Patient Payment Audit:', paymentLog);

              addToast('Payment successful!', 'success');
              fetchData();
            }
            : (_billId: string) => {
              addToast('You do not have permission to make payments', 'error');
            }
        } />;
      }

      case 'insurance': return <InsuranceView patient={props.user} />;

      case 'records': {
        if (!hasPermission('view_own_medical_records')) {
          return <div className="p-8 text-center text-gray-600">
            <Icons.LockIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p>You don't have permission to view medical records.</p>
          </div>;
        }
        // Audit log for medical records access
        const recordsAccessLog = {
          timestamp: new Date().toISOString(),
          userId: props.user.id,
          userRole: 'patient',
          action: 'view_own_medical_records',
          resourceType: 'medical_records',
          recordTypes: ['clinical_notes', 'lab_tests', 'care_plan'],
          organizationId: props.user.currentOrganization?.id
        };
        console.log('Patient Medical Records Access Audit:', recordsAccessLog);

        return <EHRView
          patient={props.user}
          currentUser={props.user}
          clinicalNotes={data.clinicalNotes}
          labTests={data.labTests}
          onDownload={async () => {
            // Audit log for record download
            const downloadLog = {
              timestamp: new Date().toISOString(),
              userId: props.user.id,
              userRole: 'patient',
              action: 'download_medical_records',
              organizationId: props.user.currentOrganization?.id
            };
            console.log('Patient Medical Records Download Audit:', downloadLog);

            // Build a small printable summary
            const notesHtml = (data.clinicalNotes || []).map((n: any) => `<h4>${new Date(n.date).toDateString()} - Dr. ${n.doctorName}</h4><pre>${n.content}</pre>`).join('<hr/>');
            const labsHtml = (data.labTests || []).map((l: any) => `<div><strong>${l.testName}</strong>: ${l.result || 'Pending'} (${l.status})</div>`).join('');
            const html = `
              <h1>Patient: ${props.user.name} (ID: ${props.user.id})</h1>
              <p>DOB: ${props.user.dateOfBirth || ''}</p>
              <h2>Clinical Notes</h2>
              ${notesHtml || '<p>No notes available</p>'}
              <h2>Lab Tests</h2>
              ${labsHtml || '<p>No lab results</p>'}
            `;
            try {
              await generatePdfFromHtml(html);
            } catch (err) {
              console.error('Failed to open print window', err);
              alert('Failed to generate PDF.');
            }
          }}
          carePlan={data.carePlan}
          carePlanAdherence={data.carePlanAdherence}
        />;
      }

      case 'symptom-checker': return <SymptomChecker onBookAppointmentWithSuggestion={handleBookAppointmentWithSuggestion} />;

      case 'wearables': {
        if (!canAccessFeature('wearables')) {
          return <div className="p-8 text-center text-gray-600">
            <Icons.LockIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Feature Unavailable</h3>
            <p>Wearable integration requires a Professional or Enterprise plan.</p>
            <p className="mt-2 text-sm text-gray-500">Contact your administrator to upgrade your plan.</p>
          </div>;
        }
        return <WearablesView patient={props.user} onSimulateData={handleSimulateWearableData} />;
      }

      case 'telemedicine': {
        if (!canAccessFeature('telemedicine')) {
          return <div className="p-8 text-center text-gray-600">
            <Icons.LockIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Feature Unavailable</h3>
            <p>Telemedicine requires a Professional or Enterprise plan.</p>
            <p className="mt-2 text-sm text-gray-500">Contact your administrator to upgrade your plan.</p>
          </div>;
        }
        if (!hasPermission('video_call_with_hcw')) {
          return <div className="p-8 text-center text-gray-600">
            <Icons.LockIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p>You don't have permission to make video calls.</p>
          </div>;
        }
        return data ? <TelemedicineView
          currentUser={props.user}
          availableContacts={data.doctors || data.contacts || []}
          onEndCall={() => {
            addToast('Consultation ended', 'info');
            handleViewChange('overview');
          }}
        /> : <FullScreenLoader />;
      }

      case 'settings': return <SettingsView user={props.user} onUpdateUser={async (updatedUser) => {
        // Update the user state and refresh data
        setData((prev: any) => ({ ...prev, user: updatedUser }));
        // Also update props.user if possible (though props are read-only, we'll refresh from API)
        await fetchData();
      }} />;
      default: return <div>Overview</div>;
    }
  };

  return (
    <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={handleViewChange} t={t} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={() => { }} notifications={data?.notifications || []} onMarkNotificationsAsRead={fetchData} title={t('patientDashboard')} language={language} onLanguageChange={setLanguage} theme={props.theme} toggleTheme={props.toggleTheme} />}>
      {/* Background refresh indicator */}
      {isBackgroundRefresh && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fadeIn">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Updating...</span>
        </div>
      )}
      {renderContent()}
    </DashboardLayout>
  );
};

export default PatientDashboard;

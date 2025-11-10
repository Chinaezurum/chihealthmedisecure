import React, { useState, useEffect, useCallback } from 'react';
import { Patient, Appointment } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
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
import { SettingsView } from '../common/SettingsView.tsx';
import { translations } from '../../translations.ts';

export type PatientView = 'overview' | 'appointments' | 'messages' | 'prescriptions' | 'billing' | 'records' | 'symptom-checker' | 'wearables' | 'settings';

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
    { id: 'symptom-checker', label: t('symptomChecker'), icon: Icons.BotMessageSquareIcon },
    { id: 'messages', label: t('messages'), icon: Icons.MessageSquareIcon },
    { id: 'prescriptions', label: t('prescriptions'), icon: Icons.PillIcon },
    { id: 'billing', label: t('billing'), icon: Icons.CreditCardIcon },
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
  const [suggestedSpecialty, setSuggestedSpecialty] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const { addToast } = useToasts();
  
  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const patientData = await api.fetchPatientData();
      setData(patientData);
    } catch (error: any) {
      console.error("Failed to fetch patient data:", error);
      // Don't sign out on errors - just show a message
      if (error?.status === 401) {
        // Session might have expired, but don't force sign out
        // Let the user continue working - they can manually sign out if needed
        addToast('Session may have expired. Please refresh if issues persist.', 'warning');
      } else {
        addToast('Failed to load dashboard data. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBookAppointment = async (newAppointment: Omit<Appointment, 'id' | 'status' | 'patientId'>) => {
    try {
      await api.bookAppointment(newAppointment);
      addToast('Appointment booked successfully!', 'success');
      // Refresh data to show the new appointment
      try {
        await fetchData();
      } catch (fetchError) {
        // If fetch fails, don't throw - just log it
        console.warn('Failed to refresh data after booking:', fetchError);
      }
      setActiveView('appointments');
    } catch (error: any) {
      console.error('Failed to book appointment:', error);
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
      setActiveView('appointments');
  };
  
  const handleSimulateWearableData = async () => {
    await api.simulateWearableData();
    addToast('New wearable data has been simulated.', 'info');
    fetchData();
  }

  const renderContent = () => {
    if (isLoading || !data) return <FullScreenLoader message="Loading your dashboard..." />;
    
    switch (activeView) {
      case 'overview': return <DashboardOverview user={props.user} appointments={data.appointments} prescriptions={data.prescriptions} messages={data.messages} contacts={data.contacts} carePlan={data.carePlan} t={t} setActiveView={setActiveView} />;
  case 'appointments': return <AppointmentsView appointments={data.appointments} rooms={data.rooms} onBookAppointment={handleBookAppointment} suggestedSpecialty={suggestedSpecialty} onSuggestionHandled={() => setSuggestedSpecialty(null)} onRefresh={fetchData} />;
      case 'messages': return <MessagingView messages={data.messages} currentUser={props.user} contacts={data.contacts} onSendMessage={async (recId, content) => { await api.sendMessage({recipientId: recId, content, senderId: props.user.id}); fetchData(); }} onStartCall={() => {}} />;
      case 'prescriptions': return <PrescriptionsView prescriptions={data.prescriptions} />;
      case 'billing': return <BillingView bills={data.bills} onPayBill={async () => { addToast('Payment successful!', 'success'); fetchData();}} />;
      case 'records': return <EHRView
        patient={props.user}
        currentUser={props.user}
        clinicalNotes={data.clinicalNotes}
        labTests={data.labTests}
        onDownload={async () => {
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
      case 'symptom-checker': return <SymptomChecker onBookAppointmentWithSuggestion={handleBookAppointmentWithSuggestion} />;
      case 'wearables': return <WearablesView patient={props.user} onSimulateData={handleSimulateWearableData} />;
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
  <DashboardLayout onSignOut={props.onSignOut} sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} t={t} />} header={<DashboardHeader user={props.user} onSignOut={props.onSignOut} onSwitchOrganization={() => {}} notifications={data?.notifications || []} onMarkNotificationsAsRead={fetchData} title={t('patientDashboard')} language={language} onLanguageChange={setLanguage} theme={props.theme} toggleTheme={props.toggleTheme}/>}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default PatientDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { User, Patient } from '../../types.ts';
import * as api from '../../services/apiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import * as Icons from '../../components/icons/index.tsx';
import { Logo } from '../../components/common/Logo.tsx';
import { DashboardLayout } from '../../components/common/DashboardLayout.tsx';
import { DashboardHeader } from '../../components/common/DashboardHeader.tsx';
import { FullScreenLoader } from '../../components/common/FullScreenLoader.tsx';
import { TeamMessagingView } from '../../components/common/TeamMessagingView.tsx';
import { InterDepartmentalNotesView } from '../hcw/InterDepartmentalNotesView.tsx';
import { PatientLookupView } from '../receptionist/PatientLookupView.tsx';
import { SettingsView } from '../common/SettingsView.tsx';

type DieticianView = 'patients' | 'consultations' | 'meal-plans' | 'lookup' | 'messages' | 'dept-notes' | 'settings';

interface DieticianDashboardProps {
  user: User;
  onSignOut: () => void;
  onSwitchOrganization: (orgId: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<{ activeView: DieticianView; setActiveView: (view: DieticianView) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'patients', label: 'My Patients', icon: Icons.UsersIcon },
    { id: 'consultations', label: 'Consultations', icon: Icons.CalendarIcon },
    { id: 'meal-plans', label: 'Meal Plans', icon: Icons.DietIcon },
    { id: 'lookup', label: 'Patient Lookup', icon: Icons.SearchIcon },
    { id: 'messages', label: 'Team Messages', icon: Icons.MessageSquareIcon },
    { id: 'dept-notes', label: 'Dept. Notes', icon: Icons.BellIcon },
  ];

  const NavLink: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button onClick={() => setActiveView(item.id as DieticianView)} className={`sidebar-link ${activeView === item.id ? 'active' : ''}`}>
      <item.icon />
      <span>{item.label}</span>
    </button>
  );
  
  return (
    <aside className="sidebar">
      <button onClick={() => setActiveView('patients')} className="sidebar-logo-button">
        <Logo />
        <h1>ChiHealth Nutrition</h1>
      </button>
      <nav className="flex-1 space-y-1">{navItems.map(item => <NavLink key={item.id} item={item} />)}</nav>
      <div>
        <button onClick={() => setActiveView('settings')} className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`}>
          <Icons.SettingsIcon />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

const DieticianDashboard: React.FC<DieticianDashboardProps> = (props) => {
  const [activeView, setActiveView] = useState<DieticianView>('patients');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const { addToast } = useToasts();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dieticianData, staff] = await Promise.all([
        api.fetchDieticianData(), // Use dietician-specific endpoint
        api.fetchStaffUsers()
      ]);
      setData(dieticianData);
      setStaffUsers(staff);
    } catch (error) {
      console.error('Failed to fetch dietician data:', error);
      addToast('Failed to load nutrition dashboard.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData, props.user.currentOrganization.id]);

  const handleUpdatePlan = () => {
    if (isEditingPlan) {
      // Save the plan
      addToast('Nutrition plan updated successfully!', 'success');
      setIsEditingPlan(false);
    } else {
      // Enter edit mode
      setIsEditingPlan(true);
      addToast('Edit mode enabled - modify the plan below', 'info');
    }
  };

  const handleAddNote = () => {
    if (showNoteInput && newNote.trim()) {
      // Save the note
      addToast('Progress note added successfully!', 'success');
      setNewNote('');
      setShowNoteInput(false);
    } else {
      // Show note input
      setShowNoteInput(true);
    }
  };

  const handlePrintPlan = () => {
    if (!selectedPatient) return;
    
    // Create printable content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Nutrition Plan - ${selectedPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            .patient-info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-row { display: flex; margin: 10px 0; }
            .info-label { font-weight: bold; width: 150px; }
            .macros { display: flex; gap: 20px; margin: 20px 0; }
            .macro-box { flex: 1; background: #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; }
            .recommendations li { margin: 10px 0; }
            .check { color: green; font-weight: bold; }
            .cross { color: red; font-weight: bold; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Nutrition Plan</h1>
          <div class="patient-info">
            <h2>Patient Information</h2>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span>${selectedPatient.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Patient ID:</span>
              <span>${selectedPatient.id}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date of Birth:</span>
              <span>${selectedPatient.dateOfBirth || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Last Visit:</span>
              <span>${selectedPatient.lastVisit || 'N/A'}</span>
            </div>
          </div>

          <h2>Current Meal Plan</h2>
          <p><strong>Balanced Nutrition Plan</strong></p>
          <p>Daily intake: 2000 kcal | Duration: 4 weeks</p>
          
          <h3>Macronutrient Distribution</h3>
          <div class="macros">
            <div class="macro-box">
              <div>Protein</div>
              <div style="font-size: 24px; font-weight: bold;">25%</div>
            </div>
            <div class="macro-box">
              <div>Carbohydrates</div>
              <div style="font-size: 24px; font-weight: bold;">45%</div>
            </div>
            <div class="macro-box">
              <div>Fats</div>
              <div style="font-size: 24px; font-weight: bold;">30%</div>
            </div>
          </div>

          <h2>Dietary Recommendations</h2>
          <ul class="recommendations">
            <li><span class="check">✓</span> Increase fiber intake through whole grains and vegetables</li>
            <li><span class="check">✓</span> Maintain adequate hydration - at least 8 glasses of water daily</li>
            <li><span class="check">✓</span> Limit processed foods and added sugars</li>
            <li><span class="cross">✗</span> Avoid high-sodium foods and excessive caffeine</li>
          </ul>

          <h2>Progress Notes</h2>
          <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin: 10px 0;">
            <strong>Week 1 - Nov 17, 2025</strong>
            <p>Patient showing good adherence to meal plan. Weight stable.</p>
          </div>
          <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; margin: 10px 0;">
            <strong>Initial Assessment - Nov 10, 2025</strong>
            <p>Baseline assessment completed. Custom meal plan created.</p>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <p><strong>Dietician:</strong> ${props.user.name}</p>
            <p><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</p>
          </div>

          <button onclick="window.print()" style="background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Print</button>
        </body>
        </html>
      `);
      printWindow.document.close();
      addToast('Opening print preview...', 'success');
    } else {
      addToast('Please allow popups to print', 'error');
    }
  };

  const renderContent = () => {
    if (activeView === 'lookup') {
      return <PatientLookupView />;
    }

    if (isLoading || !data) return <FullScreenLoader message="Loading nutrition dashboard..." />;

    switch (activeView) {
      case 'patients':
        return (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-text-primary">My Patients</h2>
              <p className="text-text-secondary mt-1">Patients under nutritional care and monitoring</p>
            </div>
            {!data.patients || data.patients.length === 0 ? (
              <div className="bg-background-secondary border border-border-primary rounded-lg p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icons.UsersIcon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Patients Yet</h3>
                <p className="text-text-secondary mb-6">You don't have any patients assigned for nutritional care yet.</p>
                <button
                  onClick={() => setActiveView('lookup')}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Search Patients
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.patients.map((patient: Patient) => (
                  <div key={patient.id} className="bg-background-secondary border border-border-primary rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icons.UsersIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary">{patient.name}</h3>
                        <p className="text-sm text-text-secondary">ID: {patient.id}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Last Visit:</span>
                        <span className="text-text-primary font-medium">{patient.lastVisit || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">DOB:</span>
                        <span className="text-text-primary">{patient.dateOfBirth || 'N/A'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        addToast(`Opening nutrition plan for ${patient.name}...`, 'success');
                      }}
                      className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      View Nutrition Plan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        );

      case 'consultations':
        return (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-text-primary">Nutrition Consultations</h2>
              <p className="text-text-secondary mt-1">Scheduled and completed dietary assessments</p>
            </div>
            {!data.appointments || data.appointments.length === 0 ? (
              <div className="bg-background-secondary border border-border-primary rounded-lg p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                  <Icons.CalendarIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No Consultations Scheduled</h3>
                <p className="text-text-secondary mb-6">You don't have any upcoming nutrition consultations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.appointments.map((appt: any) => (
                  <div key={appt.id} className="bg-background-secondary border border-border-primary rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-text-primary">{appt.patientName}</h3>
                        <p className="text-sm text-text-secondary mt-1">
                          <Icons.CalendarIcon className="inline w-4 h-4 mr-1" />
                          {appt.date} at {appt.time}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        appt.status === 'Confirmed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        appt.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {appt.status === 'Confirmed' && (
                        <button 
                          onClick={() => addToast('Starting nutrition consultation...', 'info')}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                        >
                          Start Consultation
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );

      case 'meal-plans':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-text-primary">Meal Plans</h2>
                <p className="text-text-secondary mt-1">Customized nutrition plans and dietary guidelines</p>
              </div>
              <button 
                onClick={() => addToast('Creating new meal plan...', 'info')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <span className="text-xl mr-2">+</span>
                Create New Plan
              </button>
            </div>
            <div className="grid gap-4">
              {/* Sample meal plan templates */}
              <div className="bg-background-secondary border border-border-primary rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Icons.DietIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary text-lg">Diabetic Diet Plan</h3>
                    <p className="text-text-secondary text-sm mt-1">Low glycemic index, balanced macros</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-text-secondary">
                        <strong className="text-text-primary">Calories:</strong> 1800 kcal/day
                      </span>
                      <span className="text-text-secondary">
                        <strong className="text-text-primary">Duration:</strong> 4 weeks
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => addToast('Opening meal plan details...', 'info')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => addToast('Assigning meal plan to patient...', 'info')}
                    className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors text-sm"
                  >
                    Assign to Patient
                  </button>
                </div>
              </div>
              
              <div className="bg-background-secondary border border-border-primary rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Icons.DietIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary text-lg">Weight Management Plan</h3>
                    <p className="text-text-secondary text-sm mt-1">Calorie deficit, high protein</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-text-secondary">
                        <strong className="text-text-primary">Calories:</strong> 1500 kcal/day
                      </span>
                      <span className="text-text-secondary">
                        <strong className="text-text-primary">Duration:</strong> 8 weeks
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => addToast('Opening meal plan details...', 'info')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => addToast('Assigning meal plan to patient...', 'info')}
                    className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors text-sm"
                  >
                    Assign to Patient
                  </button>
                </div>
              </div>
              
              <div className="bg-background-secondary border border-border-primary rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Icons.DietIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary text-lg">Heart-Healthy Diet</h3>
                    <p className="text-text-secondary text-sm mt-1">Low sodium, healthy fats, fiber-rich</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-text-secondary">
                        <strong className="text-text-primary">Calories:</strong> 2000 kcal/day
                      </span>
                      <span className="text-text-secondary">
                        <strong className="text-text-primary">Duration:</strong> 12 weeks
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => addToast('Opening meal plan details...', 'info')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => addToast('Assigning meal plan to patient...', 'info')}
                    className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors text-sm"
                  >
                    Assign to Patient
                  </button>
                </div>
              </div>
            </div>
          </>
        );

      case 'messages':
        return (
          <TeamMessagingView
            messages={data.messages || []}
            currentUser={props.user}
            staffContacts={staffUsers}
            onSendMessage={async (recipientId, content) => {
              await api.sendMessage({ recipientId, content, senderId: props.user.id });
              fetchData();
            }}
            onStartCall={() => addToast('Call feature coming soon', 'info')}
          />
        );

      case 'dept-notes':
        return <InterDepartmentalNotesView />;

      case 'settings':
        return <SettingsView user={props.user} />;

      default:
        return <div>My Patients</div>;
    }
  };

  return (
    <>
      <DashboardLayout
        onSignOut={props.onSignOut}
        sidebar={<Sidebar activeView={activeView} setActiveView={setActiveView} />}
        header={
          <DashboardHeader
            user={props.user}
            onSignOut={props.onSignOut}
            onSwitchOrganization={props.onSwitchOrganization}
            notifications={[]}
            onMarkNotificationsAsRead={() => {}}
            title="Dietician Dashboard"
            theme={props.theme}
            toggleTheme={props.toggleTheme}
          />
        }
      >
        {renderContent()}
      </DashboardLayout>

      {/* Nutrition Plan Modal */}
      {selectedPatient && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" 
          onClick={() => {
            setSelectedPatient(null);
            setIsEditingPlan(false);
            setShowNoteInput(false);
            setNewNote('');
          }}
        >
          <div className="bg-background-primary border border-border-primary rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-background-primary border-b border-border-primary px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Nutrition Plan</h2>
                <p className="text-text-secondary text-sm mt-1">{selectedPatient.name} - ID: {selectedPatient.id}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedPatient(null);
                  setIsEditingPlan(false);
                  setShowNoteInput(false);
                  setNewNote('');
                }} 
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <Icons.XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="bg-background-secondary border border-border-primary rounded-lg p-4">
                <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Icons.UsersIcon className="w-5 h-5" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Name:</span>
                    <span className="text-text-primary font-medium ml-2">{selectedPatient.name}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">DOB:</span>
                    <span className="text-text-primary font-medium ml-2">{selectedPatient.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Last Visit:</span>
                    <span className="text-text-primary font-medium ml-2">{selectedPatient.lastVisit || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">Patient ID:</span>
                    <span className="text-text-primary font-medium ml-2">{selectedPatient.id}</span>
                  </div>
                </div>
              </div>

              {/* Current Nutrition Plan */}
              <div className="bg-background-secondary border border-border-primary rounded-lg p-4">
                <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Icons.DietIcon className="w-5 h-5" />
                  Current Meal Plan
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1">Balanced Nutrition Plan</h4>
                    <p className="text-sm text-green-700 dark:text-green-400">Daily intake: 2000 kcal | Duration: 4 weeks</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 bg-background-tertiary rounded-lg">
                      <div className="text-text-secondary text-xs mb-1">Protein</div>
                      <div className="text-text-primary font-bold text-lg">25%</div>
                    </div>
                    <div className="p-3 bg-background-tertiary rounded-lg">
                      <div className="text-text-secondary text-xs mb-1">Carbs</div>
                      <div className="text-text-primary font-bold text-lg">45%</div>
                    </div>
                    <div className="p-3 bg-background-tertiary rounded-lg">
                      <div className="text-text-secondary text-xs mb-1">Fats</div>
                      <div className="text-text-primary font-bold text-lg">30%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dietary Recommendations */}
              <div className="bg-background-secondary border border-border-primary rounded-lg p-4">
                <h3 className="font-bold text-text-primary mb-3">Dietary Recommendations</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-text-primary">Increase fiber intake through whole grains and vegetables</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-text-primary">Maintain adequate hydration - at least 8 glasses of water daily</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span className="text-text-primary">Limit processed foods and added sugars</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">✗</span>
                    <span className="text-text-primary">Avoid high-sodium foods and excessive caffeine</span>
                  </li>
                </ul>
              </div>

              {/* Progress Tracking */}
              <div className="bg-background-secondary border border-border-primary rounded-lg p-4">
                <h3 className="font-bold text-text-primary mb-3">Progress Notes</h3>
                
                {/* New Note Input */}
                {showNoteInput && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter progress note..."
                      className="w-full p-2 border border-border-primary rounded bg-background-primary text-text-primary resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Note
                      </button>
                      <button
                        onClick={() => {
                          setShowNoteInput(false);
                          setNewNote('');
                        }}
                        className="px-3 py-1 border border-border-primary text-text-primary rounded text-sm hover:bg-background-tertiary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-background-tertiary rounded">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-text-primary">Week 1</span>
                      <span className="text-text-secondary text-xs">Nov 17, 2025</span>
                    </div>
                    <p className="text-text-secondary">Patient showing good adherence to meal plan. Weight stable.</p>
                  </div>
                  <div className="p-3 bg-background-tertiary rounded">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-text-primary">Initial Assessment</span>
                      <span className="text-text-secondary text-xs">Nov 10, 2025</span>
                    </div>
                    <p className="text-text-secondary">Baseline assessment completed. Custom meal plan created.</p>
                  </div>
                </div>
              </div>

              {/* Edit Mode Indicator */}
              {isEditingPlan && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                    <Icons.AlertTriangleIcon className="w-5 h-5" />
                    <span className="font-medium">Edit Mode Active</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Make changes to the nutrition plan above, then click "Save Changes" to update.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleUpdatePlan}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {isEditingPlan ? 'Save Changes' : 'Update Plan'}
                </button>
                <button
                  onClick={handleAddNote}
                  className="flex-1 px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors"
                >
                  Add Note
                </button>
                <button
                  onClick={handlePrintPlan}
                  className="px-4 py-2 border border-border-primary text-text-primary rounded-lg hover:bg-background-tertiary transition-colors"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DieticianDashboard;

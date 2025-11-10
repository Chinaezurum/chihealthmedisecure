import React, { useState } from 'react';
import { Patient, LabTest, ClinicalNote, User, Prescription, Referral, CarePlan, CarePlanAdherence, DiagnosticSuggestion, LifestyleRecommendation, ReferralSuggestion } from '../../types.ts';
import { Button } from './Button.tsx';
import { SparklesIcon, TargetIcon, MicroscopeIcon, DietIcon, RepeatIcon, DownloadCloudIcon, FileTextIcon, CalendarIcon, UserIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from '../icons/index.tsx';
import { AISummaryModal } from './AISummaryModal.tsx';
import * as geminiService from '../../services/geminiService.ts';
import { ClinicalNoteModal } from '../hcw/ClinicalNoteModal.tsx';
import { CreatePrescriptionModal } from '../../pages/hcw/CreatePrescriptionModal.tsx';
// Fix: Add .tsx extension to local module import.
import { OrderLabTestModal } from '../../pages/hcw/OrderLabTestModal.tsx';
import { ReferralModal } from '../hcw/ReferralModal.tsx';
import { CarePlanDisplay } from '../hcw/CarePlanDisplay.tsx';
import { CarePlanAdherenceView } from '../hcw/CarePlanAdherenceView.tsx';
import { DiagnosticSuggestionsModal } from '../hcw/DiagnosticSuggestionsModal.tsx';
import { LifestylePlanModal } from '../hcw/LifestylePlanModal.tsx';
import { ReferralSuggestionModal } from '../hcw/ReferralSuggestionModal.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import { canAccessFeature } from '../../services/permissionService.ts';

interface EHRViewProps {
  patient: Patient;
  currentUser: User;
  labTests: LabTest[];
  clinicalNotes: ClinicalNote[];
  carePlan?: CarePlan;
  carePlanAdherence?: CarePlanAdherence;
  onDownload: () => void;
  onBack?: () => void;
  // HCW-specific actions
  onCreateClinicalNote?: (note: Omit<ClinicalNote, 'id' | 'doctorId' | 'doctorName'>) => void;
  onOrderLabTest?: (test: Omit<LabTest, 'id' | 'orderedById' | 'status'>) => void;
  onCreatePrescription?: (rx: Omit<Prescription, 'id' | 'prescriberId'>) => void;
  onReferPatient?: (referral: Omit<Referral, 'id'| 'fromDoctorId'>) => void;
}

const GeneratingState: React.FC<{ title?: string }> = ({ title = "Proactive Care Plan" }) => (
    <div className="recommendation-generating-state">
        <SparklesIcon className="generating-icon" />
        <h4 className="generating-title">Generating {title}...</h4>
        <p className="generating-subtitle">Our AI is analyzing the patient's record to create personalized recommendations. This may take a moment.</p>
        <ul className="generating-steps">
            <li>Analyzing clinical notes & history...</li>
            <li>Evaluating recent lab results...</li>
            <li>Cross-referencing latest medical guidelines...</li>
            <li>Formulating personalized recommendations...</li>
        </ul>
    </div>
);


export const EHRView: React.FC<EHRViewProps> = (props) => {
  const isHcw = props.currentUser.role === 'hcw';
  const { addToast } = useToasts();
  const [isSummaryModalOpen, setSummaryModalOpen] = useState(false);
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [isRxModalOpen, setRxModalOpen] = useState(false);
  const [isLabModalOpen, setLabModalOpen] = useState(false);
  const [isReferralModalOpen, setReferralModalOpen] = useState(false);
  
  const [summary, setSummary] = useState('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showAdherence, setShowAdherence] = useState(false);

  // State for the recommendation wizard
  type WizardStep = 'selection' | 'generating' | 'review';
  const [wizardStep, setWizardStep] = useState<WizardStep>('selection');
  const [generatedPlan, setGeneratedPlan] = useState<CarePlan | null>(null);

  // State for other recommendation modals
  const [isDiagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);
  const [diagnosticSuggestions, setDiagnosticSuggestions] = useState<DiagnosticSuggestion[] | null>(null);
  const [isLifestyleModalOpen, setLifestyleModalOpen] = useState(false);
  const [lifestylePlan, setLifestylePlan] = useState<LifestyleRecommendation[] | null>(null);
  const [isReferralSuggestionModalOpen, setReferralSuggestionModalOpen] = useState(false);
  const [referralSuggestion, setReferralSuggestion] = useState<ReferralSuggestion | null>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);


  const activeCarePlan = props.carePlan;

  const recommendationOptions = [
    { type: 'care_plan', title: 'Full Proactive Care Plan', description: 'Generate a comprehensive plan including lifestyle, monitoring, and follow-ups.', icon: SparklesIcon, feature: 'ai_proactive_care' },
    { type: 'diagnostics', title: 'Diagnostic Suggestions', description: 'Get suggestions for relevant lab tests or imaging based on patient data.', icon: MicroscopeIcon, feature: 'ai_proactive_care' },
    { type: 'lifestyle', title: 'Lifestyle & Diet Plan', description: 'Create a personalized diet and exercise plan for the patient.', icon: DietIcon, feature: 'ai_proactive_care' },
    { type: 'referral', title: 'Referral Suggestion', description: 'Receive a recommendation for which specialty to refer the patient to.', icon: RepeatIcon, feature: 'ai_proactive_care' },
  ];

  const handleGenerateSummary = async () => {
    setSummaryModalOpen(true);
    setIsLoadingSummary(true);
    try {
      const result = await geminiService.generateEHRSummary(props.patient, props.clinicalNotes, props.labTests);
  setSummary(result && result.length ? result : 'No summary could be generated.');
    } catch (e) {
  const msg = (e && (e as any).message) ? (e as any).message : 'Failed to generate summary.';
  setSummary(`Error: ${msg}`);
  addToast(`AI Summary failed: ${msg}`, 'error');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleGenerateCarePlan = async () => {
    setWizardStep('generating');
    setGeneratedPlan(null);
    try {
        const plan = await geminiService.generateProactiveCarePlan(props.patient, props.clinicalNotes, props.labTests);
        setGeneratedPlan(plan);
        setWizardStep('review');
    } catch (error) {
        console.error("Failed to generate care plan", error);
        addToast("An error occurred while generating the care plan. Please try again.", 'error');
        setWizardStep('selection');
    }
  };
  
  const handleGenerateDiagnostics = async () => {
    setIsLoadingRecommendation(true);
    setDiagnosticsModalOpen(true);
    setDiagnosticSuggestions(null);
    try {
        const suggestions = await geminiService.generateDiagnosticSuggestions(props.patient, props.clinicalNotes, props.labTests);
        setDiagnosticSuggestions(suggestions);
    } catch(e) {
        console.error(e);
        addToast("Failed to generate suggestions.", 'error');
        setDiagnosticsModalOpen(false);
    } finally {
        setIsLoadingRecommendation(false);
    }
  };

  const handleGenerateLifestyle = async () => {
    setIsLoadingRecommendation(true);
    setLifestyleModalOpen(true);
    setLifestylePlan(null);
    try {
        const plan = await geminiService.generateLifestylePlan(props.patient, props.clinicalNotes, props.labTests);
        setLifestylePlan(plan);
    } catch(e) {
        console.error(e);
        addToast("Failed to generate plan.", 'error');
        setLifestyleModalOpen(false);
    } finally {
        setIsLoadingRecommendation(false);
    }
  };

  const handleGenerateReferral = async () => {
    setIsLoadingRecommendation(true);
    setReferralSuggestionModalOpen(true);
    setReferralSuggestion(null);
    try {
        const suggestion = await geminiService.generateReferralSuggestion(props.patient, props.clinicalNotes, props.labTests);
        setReferralSuggestion(suggestion);
    } catch(e) {
        console.error(e);
        addToast("Failed to generate suggestion.", 'error');
        setReferralSuggestionModalOpen(false);
    } finally {
        setIsLoadingRecommendation(false);
    }
  };

  const handleRecommendationClick = (type: string) => {
    switch(type) {
        case 'care_plan': return handleGenerateCarePlan();
        case 'diagnostics': return handleGenerateDiagnostics();
        case 'lifestyle': return handleGenerateLifestyle();
        case 'referral': return handleGenerateReferral();
        default: addToast(`Coming soon: ${type}`, 'info');
    }
  }
  
  const handleSavePlan = () => {
    // In a real app, this would trigger an API call to save the plan.
    addToast("Care plan saved to patient's EHR!", 'success');
    setWizardStep('selection');
    setGeneratedPlan(null);
    // You would then trigger a data refresh to show the new active plan.
  };

  const handleDiscardPlan = () => {
    setWizardStep('selection');
    setGeneratedPlan(null);
  };

  const renderWizardContent = () => {
    switch(wizardStep) {
        case 'generating':
            return <GeneratingState />;
        case 'review':
            if (!generatedPlan) return <p>An error occurred.</p>;
            return (
                <div>
                    <CarePlanDisplay plan={generatedPlan} />
                    <div className="flex justify-end gap-4 mt-6">
                        <Button onClick={handleDiscardPlan} className="btn-secondary">Discard</Button>
                        <Button onClick={handleSavePlan}>Save to EHR</Button>
                    </div>
                </div>
            );
        case 'selection':
        default:
            return (
                <>
                    <p className="text-sm text-text-secondary mb-4">
                        Step 1: What would you like help with?
                    </p>
                    <div className="recommendation-wizard-grid">
                        {recommendationOptions
                          .filter(opt => canAccessFeature(props.currentUser, opt.feature))
                          .map(opt => (
                            <button 
                                key={opt.type} 
                                className="recommendation-wizard-card" 
                                onClick={() => handleRecommendationClick(opt.type)}
                            >
                                <div className="recommendation-wizard-card-icon">
                                    <opt.icon />
                                </div>
                                <h4 className="recommendation-wizard-card-title">{opt.title}</h4>
                                <p className="recommendation-wizard-card-description">{opt.description}</p>
                            </button>
                        ))}
                    </div>
                </>
            );
    }
  }


  return (
    <>
      <div className="ehr-page-header">
        <div className="ehr-header-content">
          <div className="ehr-header-icon-wrapper">
            <FileTextIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="ehr-page-title">Medical Records</h2>
            <p className="ehr-page-subtitle">{props.patient.name} • Patient ID: {props.patient.id}</p>
          </div>
        </div>
        <div className="ehr-header-actions">
          {props.onBack && (
            <button onClick={props.onBack} className="ehr-back-button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
          )}
          <button onClick={props.onDownload} className="ehr-download-button" aria-label="Download medical record PDF">
            <DownloadCloudIcon className="w-5 h-5" />
            <span>Download PDF</span>
          </button>
          {canAccessFeature(props.currentUser, 'ai_summary') && (
            <button onClick={handleGenerateSummary} className="ehr-ai-button">
              <SparklesIcon className="w-5 h-5" />
              <span>AI Summary</span>
            </button>
          )}
        </div>
      </div>
      
      {isHcw && (
        <div className="ehr-quick-actions">
          <button onClick={() => setNoteModalOpen(true)} className="ehr-quick-action-button">
            <FileTextIcon className="w-4 h-4" />
            <span>Add Note</span>
          </button>
          {canAccessFeature(props.currentUser, 'prescribing') && (
            <button onClick={() => setRxModalOpen(true)} className="ehr-quick-action-button">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Prescription</span>
            </button>
          )}
          {canAccessFeature(props.currentUser, 'lab') && (
            <button onClick={() => setLabModalOpen(true)} className="ehr-quick-action-button">
              <MicroscopeIcon className="w-4 h-4" />
              <span>Lab Test</span>
            </button>
          )}
          <button onClick={() => setReferralModalOpen(true)} className="ehr-quick-action-button">
            <RepeatIcon className="w-4 h-4" />
            <span>Referral</span>
          </button>
        </div>
      )}

      <div className="ehr-content-grid">
        {/* Patient Information Card */}
        <div className="ehr-section-card">
          <div className="ehr-section-header">
            <div className="ehr-section-icon">
              <UserIcon className="w-5 h-5" />
            </div>
            <h3 className="ehr-section-title">Patient Information</h3>
          </div>
          <div className="ehr-patient-info">
            <div className="ehr-info-item">
              <span className="ehr-info-label">Full Name</span>
              <span className="ehr-info-value">{props.patient.name}</span>
            </div>
            <div className="ehr-info-item">
              <span className="ehr-info-label">Date of Birth</span>
              <span className="ehr-info-value">{props.patient.dateOfBirth || 'Not provided'}</span>
            </div>
            <div className="ehr-info-item">
              <span className="ehr-info-label">Email</span>
              <span className="ehr-info-value">{props.patient.email}</span>
            </div>
            {props.patient.lastVisit && (
              <div className="ehr-info-item">
                <span className="ehr-info-label">Last Visit</span>
                <span className="ehr-info-value">{props.patient.lastVisit}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* AI Proactive Care & Recommendation Modules */}
        {isHcw && activeCarePlan && !generatedPlan && (
            <div className="ehr-section-card ehr-section-card-full">
                <div className="ehr-section-header">
                    <div className="ehr-section-icon">
                        <TargetIcon className="w-5 h-5" />
                    </div>
                    <h3 className="ehr-section-title">Current Proactive Care Plan</h3>
                </div>
                <div className="ehr-care-plan-content">
                    <CarePlanDisplay plan={activeCarePlan} />
                    
                    {props.carePlanAdherence && (
                        <div className="ehr-adherence-toggle">
                            <button 
                                onClick={() => setShowAdherence(!showAdherence)} 
                                className="ehr-adherence-button"
                            >
                                <TargetIcon className="w-4 h-4" />
                                <span>{showAdherence ? 'Hide Adherence Report' : 'View Adherence Report'}</span>
                            </button>
                        </div>
                    )}

                    {showAdherence && props.carePlanAdherence && (
                        <div className="ehr-adherence-content">
                            <CarePlanAdherenceView plan={activeCarePlan} adherence={props.carePlanAdherence} />
                        </div>
                    )}
                </div>
            </div>
        )}
        
        {isHcw && canAccessFeature(props.currentUser, 'ai_proactive_care') && (
            <div className="ehr-section-card ehr-section-card-full">
                <div className="ehr-section-header">
                    <div className="ehr-section-icon">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <h3 className="ehr-section-title">AI Recommendation Assistant</h3>
                </div>
                <div className="ehr-ai-assistant-content">
                    {renderWizardContent()}
                </div>
            </div>
        )}


        {/* Clinical Notes Section */}
        <div className="ehr-section-card ehr-section-card-full">
          <div className="ehr-section-header">
            <div className="ehr-section-icon">
              <FileTextIcon className="w-5 h-5" />
            </div>
            <h3 className="ehr-section-title">Clinical Notes</h3>
            <span className="ehr-section-count">{props.clinicalNotes.length}</span>
          </div>
          <div className="ehr-clinical-notes">
            {props.clinicalNotes.length > 0 ? (
              props.clinicalNotes.map(note => {
                const noteDate = new Date(note.date);
                const isRecent = (Date.now() - noteDate.getTime()) < 7 * 24 * 60 * 60 * 1000; // Within 7 days
                
                return (
                  <div key={note.id} className={`ehr-note-card ${isRecent ? 'ehr-note-recent' : ''}`}>
                    <div className="ehr-note-header">
                      <div className="ehr-note-date">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{noteDate.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="ehr-note-doctor">
                        <UserIcon className="w-4 h-4" />
                        <span>Dr. {note.doctorName}</span>
                      </div>
                    </div>
                    <div className="ehr-note-content">
                      <p>{note.content}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="ehr-empty-state">
                <FileTextIcon className="w-12 h-12" />
                <p className="ehr-empty-title">No Clinical Notes</p>
                <p className="ehr-empty-message">Clinical notes will appear here once they are added to your record.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Lab Test Results Section */}
        <div className="ehr-section-card ehr-section-card-full">
          <div className="ehr-section-header">
            <div className="ehr-section-icon">
              <MicroscopeIcon className="w-5 h-5" />
            </div>
            <h3 className="ehr-section-title">Lab Test Results</h3>
            <span className="ehr-section-count">{props.labTests.length}</span>
          </div>
          <div className="ehr-lab-tests">
            {props.labTests.length > 0 ? (
              props.labTests.map(test => {
                const isCompleted = test.status === 'Completed';
                const isPending = test.status === 'Pending';
                const isAbnormal = test.result && (
                  test.result.toLowerCase().includes('high') || 
                  test.result.toLowerCase().includes('low') ||
                  test.result.toLowerCase().includes('abnormal')
                );
                
                return (
                  <div key={test.id} className={`ehr-lab-test-card ${isAbnormal ? 'ehr-lab-test-abnormal' : ''}`}>
                    <div className="ehr-lab-test-header">
                      <div className="ehr-lab-test-name">
                        {isCompleted ? (
                          isAbnormal ? (
                            <AlertCircleIcon className="w-5 h-5" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5" />
                          )
                        ) : (
                          <ClockIcon className="w-5 h-5" />
                        )}
                        <div>
                          <h4 className="ehr-lab-test-title">{test.testName}</h4>
                          <p className="ehr-lab-test-date">
                            <CalendarIcon className="w-3 h-3" />
                            <span>Ordered: {test.dateOrdered}</span>
                          </p>
                        </div>
                      </div>
                      <span className={`ehr-lab-test-status ehr-lab-test-status-${test.status.toLowerCase()}`}>
                        {test.status}
                      </span>
                    </div>
                    {test.result && (
                      <div className="ehr-lab-test-result">
                        <span className="ehr-lab-test-result-label">Result:</span>
                        <span className="ehr-lab-test-result-value">{test.result}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="ehr-empty-state">
                <MicroscopeIcon className="w-12 h-12" />
                <p className="ehr-empty-title">No Lab Tests</p>
                <p className="ehr-empty-message">Lab test results will appear here once they are ordered and completed.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AISummaryModal isOpen={isSummaryModalOpen} onClose={() => setSummaryModalOpen(false)} summary={summary} isLoading={isLoadingSummary} />
      {isHcw && props.onCreateClinicalNote && <ClinicalNoteModal isOpen={isNoteModalOpen} onClose={() => setNoteModalOpen(false)} patient={props.patient} doctor={props.currentUser} onSave={(note) => { props.onCreateClinicalNote!(note); setNoteModalOpen(false); }} />}
      {isHcw && props.onCreatePrescription && canAccessFeature(props.currentUser, 'prescribing') && <CreatePrescriptionModal isOpen={isRxModalOpen} onClose={() => setRxModalOpen(false)} patients={[props.patient]} onCreatePrescription={(rx) => { props.onCreatePrescription!(rx); setRxModalOpen(false); }} />}
      {isHcw && props.onOrderLabTest && canAccessFeature(props.currentUser, 'lab') && <OrderLabTestModal isOpen={isLabModalOpen} onClose={() => setLabModalOpen(false)} patient={props.patient} onOrderLabTest={(test) => { props.onOrderLabTest!(test); setLabModalOpen(false); }} />}
      {isHcw && props.onReferPatient && <ReferralModal isOpen={isReferralModalOpen} onClose={() => setReferralModalOpen(false)} patient={props.patient} onReferPatient={(referral) => { props.onReferPatient!(referral); setReferralModalOpen(false); }} />}
      
      {/* AI Recommendation Modals */}
      <DiagnosticSuggestionsModal 
        isOpen={isDiagnosticsModalOpen}
        onClose={() => setDiagnosticsModalOpen(false)}
        isLoading={isLoadingRecommendation}
        suggestions={diagnosticSuggestions}
        onSave={() => { addToast('Suggestions saved to a new draft clinical note.', 'success'); setDiagnosticsModalOpen(false); }}
      />
      <LifestylePlanModal
        isOpen={isLifestyleModalOpen}
        onClose={() => setLifestyleModalOpen(false)}
        isLoading={isLoadingRecommendation}
        recommendations={lifestylePlan}
        onSave={() => { addToast("Lifestyle plan saved and added to the patient's active care plan.", 'success'); setLifestyleModalOpen(false); }}
      />
      <ReferralSuggestionModal
        isOpen={isReferralSuggestionModalOpen}
        onClose={() => setReferralSuggestionModalOpen(false)}
        isLoading={isLoadingRecommendation}
        suggestion={referralSuggestion}
        onSave={() => { setReferralSuggestionModalOpen(false); setReferralModalOpen(true); }}
      />
    </>
  );
};
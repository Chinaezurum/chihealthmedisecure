import React, { useState } from 'react';
import { Patient, VitalTrendAlert } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { SparklesIcon, HeartPulseIcon, ActivityIcon, LungIcon, BedIcon } from '../../components/icons/index.tsx';
import { useToasts } from '../../hooks/useToasts.ts';
import * as geminiService from '../../services/geminiService.ts';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { Modal } from '../../components/common/Modal.tsx';

const PatientVitalsCard: React.FC<{ patient: Patient }> = ({ patient }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [alert, setAlert] = useState<VitalTrendAlert | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToasts();
    const inpatientInfo = patient.inpatientStay!;

    const handleAnalyzeVitals = async () => {
        setIsLoading(true);
        setAlert(null);
        try {
            const result = await geminiService.checkForVitalAnomalies(inpatientInfo.vitalHistory);
            if (result) {
                setAlert(result);
                setIsModalOpen(true);
            } else {
                addToast(`No anomalies detected for ${patient.name}.`, 'info');
            }
        } catch (error) {
            console.error(error);
            addToast('AI analysis failed to run.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const vitals = inpatientInfo.currentVitals;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{patient.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <BedIcon className="w-4 h-4" />
                            Room {inpatientInfo.roomNumber}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            Last updated: {(() => {
                                const t = (inpatientInfo.vitalHistory && inpatientInfo.vitalHistory[0]?.timestamp) || (patient.vitalHistory && patient.vitalHistory[0]?.timestamp);
                                if (!t) return 'Unknown';
                                try { return new Date(String(t)).toLocaleString(); } catch { return 'Unknown'; }
                            })()}
                        </p>
                    </div>
                </div>
                <Button onClick={handleAnalyzeVitals} isLoading={isLoading}>
                    <SparklesIcon className="w-4 h-4 mr-2"/>
                    Analyze Vitals
                </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-100 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-1">
                        <HeartPulseIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <p className="text-xs font-semibold text-red-900 dark:text-red-300">Heart Rate</p>
                    </div>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300">{vitals.heartRate} <span className="text-sm font-normal">bpm</span></p>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 border border-cyan-100 dark:border-cyan-800">
                    <div className="flex items-center gap-2 mb-1">
                        <ActivityIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        <p className="text-xs font-semibold text-cyan-900 dark:text-cyan-300">Blood Pressure</p>
                    </div>
                    <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300">{vitals.bloodPressure} <span className="text-sm font-normal">mmHg</span></p>
                </div>
                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-100 dark:border-sky-800">
                    <div className="flex items-center gap-2 mb-1">
                        <LungIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        <p className="text-xs font-semibold text-sky-900 dark:text-sky-300">Respiratory</p>
                    </div>
                    <p className="text-xl font-bold text-sky-700 dark:text-sky-300">{vitals.respiratoryRate} <span className="text-sm font-normal">rpm</span></p>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 border border-violet-100 dark:border-violet-800">
                    <div className="flex items-center gap-2 mb-1">
                        <HeartPulseIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        <p className="text-xs font-semibold text-violet-900 dark:text-violet-300">Oxygen Level</p>
                    </div>
                    <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{vitals.spO2 || '--'} <span className="text-sm font-normal">%</span></p>
                </div>
            </div>
             {isModalOpen && alert && (
                <Modal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={`AI Vital Alert for ${patient.name}`}
                    footer={<Button onClick={() => setIsModalOpen(false)}>Acknowledge</Button>}
                >
                    <div className={`p-4 rounded-lg border ${alert.alertType === 'critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                        <h4 className={`font-bold text-lg ${alert.alertType === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>{alert.summary}</h4>
                        <p className="text-text-secondary mt-2">{alert.details}</p>
                    </div>
                </Modal>
            )}
        </div>
    )
};


export const InpatientView: React.FC<{ patients: Patient[] }> = ({ patients }) => {
    const inpatients = patients.filter(p => p.inpatientStay);
    
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inpatient Monitoring</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {inpatients.length} {inpatients.length === 1 ? 'patient' : 'patients'} admitted for care
                </p>
            </div>
            {inpatients.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {inpatients.map(p => <PatientVitalsCard key={p.id} patient={p} />)}
                </div>
            ) : (
                <div className="mt-8">
                    <EmptyState 
                        icon={BedIcon}
                        title="No Inpatients Admitted"
                        message="Patients admitted for inpatient care will appear here."
                    />
                </div>
            )}
        </div>
    );
};
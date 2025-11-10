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
        <div className="content-card p-6">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-text-primary">{patient.name}</h3>
                    <p className="text-sm text-text-secondary">Room: {inpatientInfo.roomNumber}</p>
                    <p className="text-xs text-text-tertiary">Last updated: {(() => {
                        const t = (inpatientInfo.vitalHistory && inpatientInfo.vitalHistory[0]?.timestamp) || (patient.vitalHistory && patient.vitalHistory[0]?.timestamp);
                        if (!t) return 'Unknown';
                        try { return new Date(String(t)).toLocaleString(); } catch { return 'Unknown'; }
                    })()}</p>
                </div>
                <Button onClick={handleAnalyzeVitals} isLoading={isLoading}>
                    <SparklesIcon className="w-4 h-4 mr-2"/>
                    Analyze Vitals
                </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <HeartPulseIcon className="w-5 h-5 text-red-500" />
                    <div><p className="font-semibold text-text-secondary">HR</p><p>{vitals.heartRate} bpm</p></div>
                </div>
                 <div className="flex items-center gap-2">
                    <ActivityIcon className="w-5 h-5 text-cyan-500" />
                    <div><p className="font-semibold text-text-secondary">BP</p><p>{vitals.bloodPressure} mmHg</p></div>
                </div>
                 <div className="flex items-center gap-2">
                    <LungIcon className="w-5 h-5 text-sky-500" />
                    <div><p className="font-semibold text-text-secondary">RR</p><p>{vitals.respiratoryRate} rpm</p></div>
                </div>
                 <div className="flex items-center gap-2">
                    <HeartPulseIcon className="w-5 h-5 text-violet-500" />
                    <div><p className="font-semibold text-text-secondary">SpO2</p><p>{vitals.spO2 || '--'}%</p></div>
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
        <div>
            <h2 className="text-3xl font-bold text-text-primary mb-6">Inpatient Monitoring</h2>
            {inpatients.length > 0 ? (
                <div className="space-y-4">
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
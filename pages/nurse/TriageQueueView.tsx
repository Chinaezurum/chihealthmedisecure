import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { TriageEntry, Vitals } from '../../types.ts';
import { VitalsModal } from './VitalsModal.tsx';
import { ClockIcon, UsersIcon } from '../../components/icons/index.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';

interface TriageQueueViewProps {
  triageQueue: TriageEntry[];
  onSaveVitals: (patientId: string, vitals: Omit<Vitals, 'date'>) => void;
}

const TriageCard: React.FC<{ entry: TriageEntry, onOpenVitals: (entry: TriageEntry) => void }> = ({ entry, onOpenVitals }) => {
    const getPriorityClasses = (priority: 'Low' | 'Medium' | 'High') => {
        switch (priority) {
            case 'High': return 'border-red-500/50 bg-red-500/5';
            case 'Medium': return 'border-amber-500/50 bg-amber-500/5';
            case 'Low': return 'border-cyan-500/50 bg-cyan-500/5';
        }
    };
    
    return (
        <div className={`triage-card ${getPriorityClasses(entry.priority)}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-text-primary">{entry.patientName}</p>
                    <p className="text-sm text-text-secondary">ID: {entry.patientId}</p>
                </div>
                 <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <ClockIcon className="w-4 h-4"/>
                    <span>Arrival: {entry.arrivalTime}</span>
                 </div>
            </div>
            <div className="my-4">
                <p className="text-sm font-semibold text-text-primary">Reason for Visit:</p>
                <p className="text-text-secondary">{entry.chiefComplaint}</p>
            </div>
            <div className="flex justify-between items-center">
                <div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getPriorityClasses(entry.priority).replace('border-', 'text-').replace('/5', '/80').replace('bg-', '')}`}>
                        PRIORITY: {entry.priority.toUpperCase()}
                    </span>
                </div>
                 <Button onClick={() => onOpenVitals(entry)}>Record Vitals</Button>
            </div>
        </div>
    )
}

export const TriageQueueView: React.FC<TriageQueueViewProps> = ({ triageQueue, onSaveVitals }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<TriageEntry | null>(null);

  const handleOpenModal = (patient: TriageEntry) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleSaveVitalsAndClose = (vitals: Omit<Vitals, 'date'>) => {
    if (selectedPatient) {
      onSaveVitals(selectedPatient.patientId, vitals);
    }
    setIsModalOpen(false);
    setSelectedPatient(null);
  };


  return (
    <>
      <h2 className="text-3xl font-bold text-text-primary mb-6">Triage Queue</h2>
      
      {triageQueue.length > 0 ? (
        <div className="space-y-4">
            {triageQueue
                .sort((a,b) => {
                    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map(entry => (
                    <TriageCard key={entry.appointmentId} entry={entry} onOpenVitals={handleOpenModal} />
                ))
            }
        </div>
      ) : (
         <div className="mt-8">
            <EmptyState 
              icon={UsersIcon}
              title="Triage Queue is Empty" 
              message="Patients will appear here after they are checked-in by the receptionist."
            />
         </div>
      )}
      
      {isModalOpen && selectedPatient && (
        <VitalsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          patient={selectedPatient}
          onSave={handleSaveVitalsAndClose}
        />
      )}
    </>
  );
};
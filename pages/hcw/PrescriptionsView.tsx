import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Prescription, Patient } from '../../types.ts';
import { CreatePrescriptionModal } from './CreatePrescriptionModal.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { PillIcon } from '../../components/icons/index.tsx';

interface PrescriptionsViewProps {
  prescriptions: Prescription[];
  patients: Patient[];
  onCreatePrescription: (newPrescription: Omit<Prescription, 'id' | 'prescriberId'>) => void;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({ prescriptions, patients, onCreatePrescription }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const getPatientName = (patientId: string) => {
    return patients.find(p => p.id === patientId)?.name || 'Unknown Patient';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">E-Prescriptions</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage and issue new prescriptions for your patients.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Create New Prescription</Button>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
        {prescriptions.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Medication</th>
                <th className="p-4 font-semibold">Dosage</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {prescriptions.map(rx => (
                <tr key={rx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{getPatientName(rx.patientId)}</td>
                  <td className="p-4">{rx.medication}</td>
                  <td className="p-4">{rx.dosage}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      rx.status === 'Active' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    }`}>{rx.status}</span>
                  </td>
                  <td className="p-4">{new Date(rx.startDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
           <EmptyState icon={PillIcon} title="No Prescriptions Issued" message="Use the 'Create New Prescription' button to issue the first one." />
        )}
      </div>

      <CreatePrescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patients={patients}
        onCreatePrescription={onCreatePrescription}
      />
    </>
  );
};
import React, { useState } from 'react';
import { Prescription, Patient, User } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';
import { ShieldCheckIcon, PillIcon } from '../../components/icons/index.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';

interface PharmacyQueueViewProps {
  prescriptions: Prescription[];
  patients: Patient[];
  doctors: User[];
  onUpdateStatus: (prescriptionId: string, status: Prescription['status']) => void;
  onRunSafetyCheck: (prescriptionId: string) => Promise<void>;
}

export const PharmacyQueueView: React.FC<PharmacyQueueViewProps> = ({ prescriptions, patients, doctors, onUpdateStatus, onRunSafetyCheck }) => {
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const activeQueue = prescriptions.filter(rx => rx.status === 'Active');

  const getPatientName = (patientId: string) => patients.find(p => p.id === patientId)?.name || 'Unknown';
  const getDoctorName = (doctorId: string) => doctors.find(d => d.id === doctorId)?.name || 'Unknown';

  const handleSafetyCheck = async (id: string) => {
    setCheckingId(id);
    await onRunSafetyCheck(id);
    setCheckingId(null);
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">Prescription Fulfillment Queue</h2>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
        {activeQueue.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Patient</th>
                <th className="p-4 font-semibold">Medication</th>
                <th className="p-4 font-semibold">Prescriber</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {activeQueue.map(rx => (
                <tr key={rx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="p-4">{new Date(rx.startDate).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{getPatientName(rx.patientId)}</td>
                  <td className="p-4">{rx.medication} - {rx.dosage} ({rx.frequency})</td>
                  <td className="p-4">{getDoctorName(rx.prescriberId)}</td>
                  <td className="p-4 flex gap-2">
                    <Button 
                      onClick={() => handleSafetyCheck(rx.id)}
                      isLoading={checkingId === rx.id}
                      className="btn-secondary"
                    >
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                      AI Safety Check
                    </Button>
                    <Button onClick={() => onUpdateStatus(rx.id, 'Filled')}>Mark as Filled</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState icon={PillIcon} title="Queue is Empty" message="There are no active prescriptions awaiting fulfillment." />
        )}
      </div>
    </>
  );
};
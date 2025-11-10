
import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { TriageEntry, Vitals } from '../../types.ts';

interface VitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: TriageEntry;
  onSave: (vitals: Omit<Vitals, 'date'>) => void;
}

export const VitalsModal: React.FC<VitalsModalProps> = ({ isOpen, onClose, patient, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vitals, setVitals] = useState<Omit<Vitals, 'date'>>({
      temperature: '',
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setVitals({ ...vitals, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate saving
    setTimeout(() => {
        setIsLoading(false);
        onSave(vitals);
    }, 1000);
  }

  const footerContent = (
    <>
      <button
        onClick={onClose}
        type="button"
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
      >
        Cancel
      </button>
      <Button type="submit" form="vitalsForm" isLoading={isLoading}>
        Save Vitals
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Vitals for ${patient.patientName}`} footer={footerContent}>
      <form id="vitalsForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Temperature (°C)" name="temperature" value={vitals.temperature} onChange={handleChange} required />
        <Input label="Blood Pressure (mmHg)" name="bloodPressure" placeholder="e.g., 120/80" value={vitals.bloodPressure} onChange={handleChange} required />
        <Input label="Heart Rate (bpm)" name="heartRate" value={vitals.heartRate} onChange={handleChange} required />
        <Input label="Respiratory Rate (rpm)" name="respiratoryRate" value={vitals.respiratoryRate} onChange={handleChange} required />
        <Input label="Notes (optional)" name="notes" value={vitals.notes || ''} onChange={handleChange} />
      </form>
    </Modal>
  );
};
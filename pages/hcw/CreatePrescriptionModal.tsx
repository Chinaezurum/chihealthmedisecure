import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Prescription, Patient } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';

interface CreatePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onCreatePrescription: (newPrescription: Omit<Prescription, 'id' | 'prescriberId'>) => void;
}

export const CreatePrescriptionModal: React.FC<CreatePrescriptionModalProps> = ({ isOpen, onClose, patients, onCreatePrescription }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToasts();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    
    const newPrescription = {
        patientId: formData.get('patientId') as string,
        medication: formData.get('medication') as string,
        dosage: formData.get('dosage') as string,
        frequency: formData.get('frequency') as string,
        startDate: new Date().toISOString().split('T')[0],
        status: 'Active' as 'Active',
    };

    if (!newPrescription.patientId || !newPrescription.medication || !newPrescription.dosage || !newPrescription.frequency) {
        addToast('Please fill out all required fields.', 'error');
        return;
    }

    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        onCreatePrescription(newPrescription);
        addToast('Prescription created successfully!', 'success');
        onClose();
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
      <Button type="submit" form="prescriptionForm" isLoading={isLoading}>
        Issue Prescription
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New E-Prescription" footer={footerContent}>
      <form id="prescriptionForm" onSubmit={handleSubmit} className="space-y-4">
        <Select label="Select Patient" name="patientId" required>
            <option value="">Select a patient...</option>
            {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
        </Select>
        <Input label="Medication" name="medication" placeholder="e.g., Lisinopril" required />
        <Input label="Dosage" name="dosage" placeholder="e.g., 10mg" required />
        <Input label="Frequency" name="frequency" placeholder="e.g., Once daily" required />
        <Input name="notes" label="Additional Notes (optional)" placeholder="e.g., Take with food" />
      </form>
    </Modal>
  );
};
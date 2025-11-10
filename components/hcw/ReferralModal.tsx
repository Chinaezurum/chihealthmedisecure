import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { Select } from '../common/Select.tsx';
import { Patient, Referral } from '../../types.ts';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onReferPatient: (referral: Omit<Referral, 'id' | 'fromDoctorId'>) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose, patient, onReferPatient }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newReferral = {
        patientId: patient.id,
        toSpecialty: formData.get('toSpecialty') as string,
        reason: formData.get('reason') as string,
        date: new Date().toISOString(),
        status: 'Pending' as const,
    };
    if (!newReferral.toSpecialty || !newReferral.reason) {
        alert("Please fill all fields.");
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
        onReferPatient(newReferral);
        setIsLoading(false);
        onClose();
    }, 1000);
  };

  const footerContent = (
    <>
      <Button onClick={onClose} type="button" style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>
        Cancel
      </Button>
      <Button type="submit" form="referralForm" isLoading={isLoading}>
        Submit Referral
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Refer ${patient.name}`} footer={footerContent}>
      <form id="referralForm" onSubmit={handleSubmit} className="space-y-4">
        <Input label="Patient" name="patientName" value={patient.name} disabled />
        <Select label="Refer to Specialty" name="toSpecialty" required>
            <option value="">Select specialty...</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Endocrinology">Endocrinology</option>
        </Select>
        <Input name="reason" label="Reason for Referral" placeholder="e.g., Patient experiencing arrhythmia" required />
      </form>
    </Modal>
  );
};

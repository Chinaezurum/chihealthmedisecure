import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Patient } from '../../types.ts';

interface DischargePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDischarge: (patientId: string) => void;
  inpatients: Patient[];
}

export const DischargePatientModal: React.FC<DischargePatientModalProps> = ({ isOpen, onClose, onDischarge, inpatients }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      alert('Please select a patient to discharge.');
      return;
    }
    setIsLoading(true);
    onDischarge(patientId);
    setIsLoading(false);
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" className="btn-secondary">Cancel</Button>
      <Button type="submit" form="dischargeForm" isLoading={isLoading} disabled={!patientId}>
        Discharge Patient
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Discharge Patient" footer={footer}>
      <form id="dischargeForm" onSubmit={handleSubmit} className="space-y-4">
        <Select label="Select Inpatient" name="patientId" value={patientId} onChange={e => setPatientId(e.target.value)} required>
          <option value="">Select a patient...</option>
          {inpatients.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} (Room: {p.inpatientStay?.roomNumber})
            </option>
          ))}
        </Select>
        <p className="text-sm text-text-secondary">Discharging a patient will update their record and mark their bed as available.</p>
      </form>
    </Modal>
  );
};
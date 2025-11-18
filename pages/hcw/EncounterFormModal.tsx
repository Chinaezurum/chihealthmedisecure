import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { User, BillingCode } from '../../types.ts';
import * as api from '../../services/apiService.ts';

interface EncounterFormModalProps {
  patient: User;
  doctor: User;
  appointmentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EncounterFormModal: React.FC<EncounterFormModalProps> = ({
  patient,
  doctor,
  appointmentId,
  onClose,
  onSuccess,
}) => {
  const [billingCodes, setBillingCodes] = useState<BillingCode[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBillingCodes();
  }, []);

  const fetchBillingCodes = async () => {
    try {
      const codes = await api.getBillingCodes();
      setBillingCodes(codes);
    } catch (error) {
      console.error('Failed to fetch billing codes:', error);
    }
  };

  const toggleCode = (codeId: string) => {
    setSelectedCodes(prev =>
      prev.includes(codeId)
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  const selectedBillingCodes = billingCodes.filter(code =>
    selectedCodes.includes(code.id)
  );

  const totalAmount = selectedBillingCodes.reduce((sum, code) => sum + code.price, 0);

  const handleSubmit = async () => {
    if (!chiefComplaint || !diagnosis || selectedCodes.length === 0) {
      alert('Please fill in all required fields and select at least one service');
      return;
    }

    try {
      setIsSubmitting(true);

      const services = selectedBillingCodes.map(code => code.description);

      const encounterData = {
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        appointmentId,
        date: new Date().toISOString().split('T')[0],
        chiefComplaint,
        diagnosis,
        servicesRendered: services,
        billingCodes: selectedBillingCodes,
        totalAmount,
        duration,
        notes,
        status: 'Submitted' as const,
      };

      await api.createEncounter(encounterData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create encounter:', error);
      alert('Failed to submit encounter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const codesByCategory = billingCodes.reduce((acc, code) => {
    if (!acc[code.category]) acc[code.category] = [];
    acc[code.category].push(code);
    return acc;
  }, {} as Record<string, BillingCode[]>);

  return (
    <Modal isOpen={true} onClose={onClose} title="Document Patient Encounter">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="bg-background-secondary p-4 rounded-lg">
          <h4 className="font-semibold text-text-primary mb-2">Patient Information</h4>
          <p className="text-sm text-text-secondary">Name: {patient.name}</p>
          <p className="text-sm text-text-secondary">Email: {patient.email}</p>
        </div>

        <Input
          label="Chief Complaint *"
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="Patient's primary concern..."
          required
        />

        <Input
          label="Diagnosis *"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Clinical diagnosis..."
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Duration (minutes)
          </label>
          <input
            type="range"
            min="15"
            max="120"
            step="15"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-text-secondary mt-1">{duration} minutes</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Services Rendered * (Select billing codes)
          </label>
          <div className="space-y-4 max-h-64 overflow-y-auto border border-border-primary rounded-lg p-3">
            {Object.entries(codesByCategory).map(([category, codes]) => (
              <div key={category}>
                <h5 className="font-semibold text-text-primary mb-2 text-sm">{category}</h5>
                <div className="space-y-2">
                  {codes.map(code => (
                    <label key={code.id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-background-secondary rounded">
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(code.id)}
                        onChange={() => toggleCode(code.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-sm text-text-primary">{code.code}</span>
                            <p className="text-sm text-text-secondary">{code.description}</p>
                          </div>
                          <span className="font-mono text-sm text-text-primary">₦{code.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background-secondary p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-text-primary">Total Amount:</span>
            <span className="font-mono text-lg font-bold text-primary">₦{totalAmount.toLocaleString()}</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {selectedCodes.length} service(s) selected
          </p>
        </div>

        <Input
          label="Clinical Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about the encounter..."
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedCodes.length === 0}>
            {isSubmitting ? 'Submitting...' : 'Submit for Billing'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

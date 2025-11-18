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
  const [referralType, setReferralType] = useState<'internal' | 'external'>('internal');
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newReferral: Omit<Referral, 'id' | 'fromDoctorId'> = {
        patientId: patient.id,
        toSpecialty: formData.get('toSpecialty') as string,
        reason: formData.get('reason') as string,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending' as const,
    };
    
    if (referralType === 'internal') {
        newReferral.toDepartment = formData.get('toDepartment') as string;
    } else {
        newReferral.toFacility = formData.get('toFacility') as string;
        newReferral.facilityAddress = formData.get('facilityAddress') as string;
        newReferral.facilityContact = formData.get('facilityContact') as string;
    }
    
    if (!newReferral.toSpecialty || !newReferral.reason) {
        alert("Please fill all required fields.");
        return;
    }
    
    if (referralType === 'external' && !newReferral.toFacility) {
        alert("Please enter the facility name.");
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
        
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Referral Type</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="referralType"
                value="internal"
                checked={referralType === 'internal'}
                onChange={() => setReferralType('internal')}
                className="mr-2"
              />
              <span>Internal (Same Organization)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="referralType"
                value="external"
                checked={referralType === 'external'}
                onChange={() => setReferralType('external')}
                className="mr-2"
              />
              <span>External (Other Facility)</span>
            </label>
          </div>
        </div>
        
        <Select label="Refer to Specialty" name="toSpecialty" required>
            <option value="">Select specialty...</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Endocrinology">Endocrinology</option>
            <option value="Oncology">Oncology</option>
            <option value="Psychiatry">Psychiatry</option>
            <option value="Radiology">Radiology</option>
        </Select>
        
        {referralType === 'internal' ? (
          <Select label="Department" name="toDepartment">
            <option value="">Select department...</option>
            <option value="Cardiology">Cardiology Department</option>
            <option value="Dermatology">Dermatology Department</option>
            <option value="Neurology">Neurology Department</option>
            <option value="Orthopedics">Orthopedics Department</option>
          </Select>
        ) : (
          <>
            <Input name="toFacility" label="External Facility Name" placeholder="e.g., Lagos State Teaching Hospital" required />
            <Input name="facilityAddress" label="Facility Address (Optional)" placeholder="e.g., 1-5 Oba Akinjobi Street, Ikeja" />
            <Input name="facilityContact" label="Facility Contact (Optional)" placeholder="e.g., +234 803 123 4567" />
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Reason for Referral <span className="text-red-500">*</span></label>
          <textarea
            name="reason"
            rows={6}
            placeholder="Provide a detailed reason for this referral. Include relevant symptoms, test results, and specific concerns that require specialist attention..."
            required
            className="w-full px-4 py-3 bg-background-secondary border-2 border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-y min-h-[150px]"
          />
        </div>
      </form>
    </Modal>
  );
};

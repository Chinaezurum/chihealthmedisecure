import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Select } from '../../components/common/Select.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Patient, LabTest } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';

interface OrderLabTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onOrderLabTest: (newTest: Omit<LabTest, 'id' | 'orderedById' | 'status'>) => void;
}

const commonLabTests = [
    "Complete Blood Count (CBC)",
    "Basic Metabolic Panel (BMP)",
    "Comprehensive Metabolic Panel (CMP)",
    "Lipid Panel",
    "Thyroid Stimulating Hormone (TSH)",
    "Hemoglobin A1c (HbA1c)",
    "Urinalysis",
];

export const OrderLabTestModal: React.FC<OrderLabTestModalProps> = ({ isOpen, onClose, patient, onOrderLabTest }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToasts();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const testName = formData.get('testName') as string;

    if (!testName) {
        addToast('Please select a test to order.', 'error');
        return;
    }
    
    const newTest = {
        patientId: patient.id,
        patientName: patient.name,
        testName: testName,
        dateOrdered: new Date().toISOString().split('T')[0],
    };

    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        onOrderLabTest(newTest);
        onClose();
    }, 1000);
  };
  
  const footerContent = (
    <>
      <Button onClick={onClose} type="button" style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>
        Cancel
      </Button>
      <Button type="submit" form="orderLabForm" isLoading={isLoading}>
        Submit Order
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order Lab Test for ${patient.name}`} footer={footerContent}>
        <form id="orderLabForm" onSubmit={handleSubmit} className="space-y-4">
            <Input label="Patient" name="patientName" value={patient.name} disabled />
            <Select label="Test Name" name="testName" required>
                <option value="">Select a common test...</option>
                {commonLabTests.map(test => (
                    <option key={test} value={test}>{test}</option>
                ))}
            </Select>
            <Input name="notes" label="Clinical Notes / Reason for Test (optional)" placeholder="e.g., Routine screening" />
        </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Bill, User } from '../../types.ts';
import * as api from '../../services/apiService.ts';

interface InsuranceClaimModalProps {
  bill: Bill;
  patient: User;
  insuranceProviders: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const InsuranceClaimModal: React.FC<InsuranceClaimModalProps> = ({
  bill,
  patient,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!patient.insurance) {
      alert('Patient does not have active insurance');
      return;
    }

    try {
      setIsSubmitting(true);

      const claimData = {
        billId: bill.id,
        patientId: patient.id,
        providerId: patient.insurance.providerId,
        providerName: patient.insurance.providerName,
        policyNumber: patient.insurance.policyNumber,
        claimAmount: bill.insuranceCoverage || 0,
        status: 'Submitted' as const,
      };

      await api.createInsuranceClaim(claimData);
      onSuccess();
    } catch (error) {
      console.error('Failed to submit claim:', error);
      alert('Failed to submit insurance claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Submit Insurance Claim">
      <div className="space-y-4">
        <div className="bg-background-secondary p-4 rounded-lg">
          <h4 className="font-semibold text-text-primary mb-2">Claim Details</h4>
          <p className="text-sm text-text-secondary">Invoice: {bill.invoiceNumber}</p>
          <p className="text-sm text-text-secondary">Patient: {patient.name}</p>
          <p className="text-sm text-text-secondary">Total Bill Amount: ₦{bill.amount.toLocaleString()}</p>
        </div>

        {patient.insurance ? (
          <div className="bg-background-secondary p-4 rounded-lg">
            <h4 className="font-semibold text-text-primary mb-2">Insurance Information</h4>
            <p className="text-sm text-text-secondary">Provider: {patient.insurance.providerName}</p>
            <p className="text-sm text-text-secondary">Policy Number: {patient.insurance.policyNumber}</p>
            <p className="text-sm text-text-secondary">Coverage: {patient.insurance.coveragePercentage}%</p>
            <p className="text-sm font-semibold text-primary mt-2">
              Claim Amount: ₦{(bill.insuranceCoverage || 0).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              Patient does not have active insurance on file.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !patient.insurance}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

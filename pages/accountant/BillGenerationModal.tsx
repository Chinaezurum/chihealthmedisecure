import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Encounter, BillingCode, User } from '../../types.ts';
import * as api from '../../services/apiService.ts';

interface BillGenerationModalProps {
  encounter: Encounter;
  billingCodes: BillingCode[];
  patient: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const BillGenerationModal: React.FC<BillGenerationModalProps> = ({
  encounter,
  patient,
  onClose,
  onSuccess,
}) => {
  const [paymentType, setPaymentType] = useState<'Cash' | 'Insurance' | 'Mixed'>('Cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = encounter.totalAmount;
  const tax = 0; // Can add tax calculation here
  const totalAmount = subtotal + tax - discount;

  // Calculate insurance coverage if applicable
  const insuranceCoverage = paymentType !== 'Cash' && patient.insurance 
    ? Math.round(subtotal * (patient.insurance.coveragePercentage / 100))
    : 0;
  const patientResponsibility = paymentType !== 'Cash' 
    ? totalAmount - insuranceCoverage 
    : totalAmount;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 days payment term

      const billData = {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
        date: new Date().toISOString().split('T')[0],
        service: encounter.servicesRendered.join(', '),
        amount: totalAmount,
        subtotal,
        tax,
        discount,
        status: 'Pending' as const,
        paymentType,
        insuranceCoverage: paymentType !== 'Cash' ? insuranceCoverage : undefined,
        patientResponsibility: paymentType !== 'Cash' ? patientResponsibility : undefined,
        billingCodes: encounter.billingCodes,
        dueDate: dueDate.toISOString().split('T')[0],
        notes,
        createdBy: 'current-user-id', // Should be from auth context
      };

      await api.createBill(billData);
      onSuccess();
    } catch (error) {
      console.error('Failed to generate bill:', error);
      alert('Failed to generate bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Generate Bill">
      <div className="space-y-4">
        <div className="bg-background-secondary p-4 rounded-lg">
          <h4 className="font-semibold text-text-primary mb-2">Encounter Details</h4>
          <p className="text-sm text-text-secondary">Patient: {encounter.patientName}</p>
          <p className="text-sm text-text-secondary">Doctor: {encounter.doctorName}</p>
          <p className="text-sm text-text-secondary">Date: {new Date(encounter.date).toLocaleDateString()}</p>
          <p className="text-sm text-text-secondary">Diagnosis: {encounter.diagnosis}</p>
        </div>

        <div className="bg-background-secondary p-4 rounded-lg">
          <h4 className="font-semibold text-text-primary mb-2">Services & Billing Codes</h4>
          {encounter.billingCodes.map((code) => (
            <div key={code.id} className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">{code.code} - {code.description}</span>
              <span className="font-mono text-text-primary">₦{code.price.toLocaleString()}</span>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Payment Type
          </label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value as any)}
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary"
          >
            <option value="Cash">Cash</option>
            <option value="Insurance" disabled={!patient.insurance}>Insurance (No active insurance)</option>
            <option value="Mixed" disabled={!patient.insurance}>Mixed Payment</option>
          </select>
          {patient.insurance && paymentType !== 'Cash' && (
            <p className="text-sm text-text-secondary mt-1">
              Insurance Coverage: {patient.insurance.providerName} ({patient.insurance.coveragePercentage}%)
            </p>
          )}
        </div>

        <Input
          label="Discount Amount (₦)"
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          min={0}
          max={subtotal}
        />

        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional billing notes..."
        />

        <div className="bg-background-secondary p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal:</span>
            <span className="font-mono text-text-primary">₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Discount:</span>
            <span className="font-mono text-text-primary">-₦{discount.toLocaleString()}</span>
          </div>
          {paymentType !== 'Cash' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Insurance Coverage:</span>
                <span className="font-mono text-green-600">-₦{insuranceCoverage.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-text-primary">Patient Responsibility:</span>
                <span className="font-mono text-text-primary">₦{patientResponsibility.toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="border-t border-border-primary pt-2 flex justify-between font-bold">
            <span className="text-text-primary">Total Amount:</span>
            <span className="font-mono text-primary">₦{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Generating...' : 'Generate Bill'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

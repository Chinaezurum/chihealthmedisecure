import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Bill, User } from '../../types.ts';
import * as api from '../../services/apiService.ts';

interface PaymentModalProps {
  bill: Bill;
  patient: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  bill,
  patient,
  onClose,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile Money'>('Cash');
  const [cardNumber, setCardNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [amount, setAmount] = useState(bill.patientResponsibility || bill.amount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const transactionId = `TXN-${Date.now()}`;

      const paymentData = {
        amount,
        paymentMethod,
        transactionId,
        cardLast4: paymentMethod === 'Card' ? cardNumber.slice(-4) : undefined,
        mobileMoneyNumber: paymentMethod === 'Mobile Money' ? mobileNumber : undefined,
      };

      // Audit log for payment processing
      const auditLog = {
        action: 'PROCESS_PAYMENT',
        billId: bill.id,
        invoiceNumber: bill.invoiceNumber,
        patientId: bill.patientId,
        patientName: patient.name,
        amount,
        paymentMethod,
        transactionId,
        processedDateTime: new Date().toISOString(),
        processedBy: 'ACC001', // Would come from auth context
        processedByName: 'Current Accountant',
      };
      console.log('Payment processing audit:', auditLog);

      await api.processPayment(bill.id, paymentData);
      onSuccess();
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Process Payment">
      <div className="space-y-4">
        <div className="bg-background-secondary p-4 rounded-lg">
          <h4 className="font-semibold text-text-primary mb-2">Bill Details</h4>
          <p className="text-sm text-text-secondary">Invoice: {bill.invoiceNumber}</p>
          <p className="text-sm text-text-secondary">Patient: {patient.name}</p>
          <p className="text-sm text-text-secondary">Total Amount: ₦{bill.amount.toLocaleString()}</p>
          {bill.patientResponsibility && (
            <p className="text-sm font-semibold text-text-primary mt-2">
              Patient Responsibility: ₦{bill.patientResponsibility.toLocaleString()}
            </p>
          )}
        </div>

        <Input
          label="Payment Amount (₦)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={0}
          max={bill.patientResponsibility || bill.amount}
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary"
          >
            <option value="Cash">Cash</option>
            <option value="Card">Credit/Debit Card</option>
            <option value="Mobile Money">Mobile Money</option>
          </select>
        </div>

        {paymentMethod === 'Card' && (
          <Input
            label="Card Number"
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="Enter card number"
            maxLength={16}
          />
        )}

        {paymentMethod === 'Mobile Money' && (
          <Input
            label="Mobile Money Number"
            type="text"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Enter mobile number"
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : `Process Payment (₦${amount.toLocaleString()})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

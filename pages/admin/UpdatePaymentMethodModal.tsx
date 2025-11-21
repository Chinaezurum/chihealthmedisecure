import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { CreditCardIcon, LockIcon } from '../../components/icons/index.tsx';

interface UpdatePaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (paymentData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  }) => Promise<void>;
}

export const UpdatePaymentMethodModal: React.FC<UpdatePaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const cleaned = value.replace(/\s/g, '');
      const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'expiryMonth' || name === 'expiryYear') {
      // Only allow numbers
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'cvv') {
      const numericValue = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate card number (basic length check)
    const cardDigits = formData.cardNumber.replace(/\s/g, '');
    if (!cardDigits) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardDigits.length < 15 || cardDigits.length > 16) {
      newErrors.cardNumber = 'Invalid card number';
    }

    // Validate cardholder name
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    // Validate expiry month
    const month = parseInt(formData.expiryMonth);
    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Month is required';
    } else if (month < 1 || month > 12) {
      newErrors.expiryMonth = 'Invalid month';
    }

    // Validate expiry year
    const currentYear = new Date().getFullYear() % 100;
    const year = parseInt(formData.expiryYear);
    if (!formData.expiryYear) {
      newErrors.expiryYear = 'Year is required';
    } else if (year < currentYear) {
      newErrors.expiryYear = 'Card has expired';
    }

    // Validate CVV
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(formData);
      onClose();
      // Reset form
      setFormData({
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardholderName: '',
      });
    } catch (error) {
      console.error('Failed to update payment method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <>
      <Button
        onClick={onClose}
        type="button"
        style={{
          backgroundColor: 'var(--background-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)',
        }}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button onClick={handleSubmit} isLoading={isLoading} type="submit">
        Update Payment Method
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Payment Method" footer={footer}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Security Notice */}
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <LockIcon className="w-5 h-5 text-teal-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-text-primary mb-1">Secure Payment</h4>
              <p className="text-xs text-text-secondary">
                Your payment information is encrypted and secure. We never store your full card details.
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Cardholder Name"
          name="cardholderName"
          value={formData.cardholderName}
          onChange={handleChange}
          error={errors.cardholderName}
          placeholder="Name as it appears on card"
          required
        />

        <div>
          <label className="form-label">
            Card Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              maxLength={19}
              className={`form-input pl-10 ${errors.cardNumber ? 'border-red-500' : ''}`}
              placeholder="1234 5678 9012 3456"
              required
            />
            <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          </div>
          {errors.cardNumber && <p className="form-error-text">{errors.cardNumber}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Input
              label="Month"
              name="expiryMonth"
              value={formData.expiryMonth}
              onChange={handleChange}
              error={errors.expiryMonth}
              placeholder="MM"
              maxLength={2}
              required
            />
          </div>
          <div>
            <Input
              label="Year"
              name="expiryYear"
              value={formData.expiryYear}
              onChange={handleChange}
              error={errors.expiryYear}
              placeholder="YY"
              maxLength={2}
              required
            />
          </div>
          <div>
            <Input
              label="CVV"
              name="cvv"
              type="password"
              value={formData.cvv}
              onChange={handleChange}
              error={errors.cvv}
              placeholder="123"
              maxLength={4}
              required
            />
          </div>
        </div>

        <div className="text-xs text-text-secondary mt-4">
          By updating your payment method, you authorize ChiHealth MediSecure to charge this card for future subscription payments.
        </div>
      </form>
    </Modal>
  );
};

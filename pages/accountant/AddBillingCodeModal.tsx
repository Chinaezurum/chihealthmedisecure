import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import * as api from '../../services/apiService.ts';

interface AddBillingCodeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddBillingCodeModal: React.FC<AddBillingCodeModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    category: 'Consultation',
    price: '',
    insuranceCoverage: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Consultation', 'Procedure', 'Lab', 'Imaging', 'Medication', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.code.trim()) {
      setError('Billing code is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return;
    }
    const coverage = parseFloat(formData.insuranceCoverage);
    if (isNaN(coverage) || coverage < 0 || coverage > 100) {
      setError('Insurance coverage must be between 0 and 100');
      return;
    }

    setIsSubmitting(true);

    try {
      const billingCodeData = {
        code: formData.code.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        insuranceCoverage: coverage,
        isActive: true,
      };

      await api.createBillingCode(billingCodeData);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add billing code:', err);
      setError(err.message || 'Failed to add billing code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} title="Add New Billing Code" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          label="Billing Code"
          placeholder="e.g., CONS-001"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the service or procedure"
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
            required
          />
        </div>

        <Input
          label="Price (₦)"
          type="number"
          placeholder="0.00"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          min="0"
          step="0.01"
          required
        />

        <Input
          label="Insurance Coverage (%)"
          type="number"
          placeholder="0"
          value={formData.insuranceCoverage}
          onChange={(e) => setFormData({ ...formData, insuranceCoverage: e.target.value })}
          min="0"
          max="100"
          step="1"
          required
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Billing Code'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

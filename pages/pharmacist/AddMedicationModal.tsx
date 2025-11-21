import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Modal } from '../../components/common/Modal.tsx';

interface AddMedicationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Analgesics',
    stock: '',
    minStock: '',
    unit: 'tablets',
    expiryDate: '',
    batchNumber: '',
    manufacturer: '',
    dosage: '',
    price: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  
  // Audit fields
  const createdDateTime = new Date().toISOString();
  const createdBy = 'PHARM001'; // Would come from auth context

  const categories = ['Analgesics', 'Antibiotics', 'Gastrointestinal', 'Antidiabetic', 'Cardiovascular', 'Antihypertensive', 'Antihistamine', 'Other'];
  const units = ['tablets', 'capsules', 'ml', 'bottles', 'vials', 'tubes', 'boxes'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Medication name is required');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      setError('Valid stock quantity is required');
      return;
    }
    if (!formData.minStock || parseInt(formData.minStock) < 0) {
      setError('Valid minimum stock is required');
      return;
    }
    if (!formData.expiryDate) {
      setError('Expiry date is required');
      return;
    }
    if (!formData.batchNumber.trim()) {
      setError('Batch number is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // API call would go here
      // await api.createMedication({ ...formData, createdDateTime, createdBy });
      console.log('Adding medication:', {
        ...formData,
        createdDateTime,
        createdBy,
        createdByName: 'Current Pharmacist', // Would come from auth context
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add medication:', err);
      setError(err.message || 'Failed to add medication. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} title="Add New Medication" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Medication Name"
              placeholder="e.g., Paracetamol 500mg"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Category
            </label>
            <div className="flex gap-2">
              <select
                value={showCustomCategory ? 'custom' : formData.category}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setShowCustomCategory(true);
                    setFormData({ ...formData, category: '' });
                  } else {
                    setShowCustomCategory(false);
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="flex-1 px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="custom">+ Create New Category</option>
              </select>
            </div>
            {showCustomCategory && (
              <div className="mt-2">
                <Input
                  label=""
                  placeholder="Enter new category name"
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setFormData({ ...formData, category: e.target.value });
                  }}
                  required
                />
              </div>
            )}
          </div>

          <Input
            label="Dosage"
            placeholder="e.g., 500mg"
            value={formData.dosage}
            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          />

          <Input
            label="Initial Stock Quantity"
            type="number"
            placeholder="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            min="0"
            required
          />

          <Input
            label="Minimum Stock Level"
            type="number"
            placeholder="0"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            min="0"
            required
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <Input
            label="Price per Unit (₦)"
            type="number"
            placeholder="0.00"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            min="0"
            step="0.01"
            required
          />

          <Input
            label="Batch Number"
            placeholder="e.g., B2024001"
            value={formData.batchNumber}
            onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            required
          />

          <Input
            label="Expiry Date"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            required
          />

          <div className="col-span-2">
            <Input
              label="Manufacturer"
              placeholder="e.g., Pfizer Inc."
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            />
          </div>
        </div>

        {/* Audit Information */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Audit Information</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Created Date & Time:</p>
              <p className="font-semibold text-gray-900">
                {new Date(createdDateTime).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Created By:</p>
              <p className="font-semibold text-gray-900">{createdBy}</p>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            ℹ️ This medication addition will be logged for audit purposes
          </p>
        </div>

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
            {isSubmitting ? 'Adding...' : 'Add Medication'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

import React, { useState } from 'react';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { Modal } from '../../components/common/Modal.tsx';

interface AdjustStockModalProps {
  medication: {
    id: string;
    name: string;
    stock: number;
    unit: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ medication, onClose, onSuccess }) => {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Audit fields - auto-populated with current date/time and user
  const adjustmentDateTime = new Date().toISOString();
  const editorId = 'PHARM001'; // This would come from auth context in real app

  const reasons = {
    add: ['Stock Replenishment', 'Received Order', 'Stock Transfer In', 'Correction', 'Other'],
    remove: ['Dispensed', 'Expired', 'Damaged', 'Stock Transfer Out', 'Returned to Supplier', 'Other'],
  };

  const newStock = adjustmentType === 'add' 
    ? medication.stock + (parseInt(quantity) || 0)
    : medication.stock - (parseInt(quantity) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!quantity || parseInt(quantity) <= 0) {
      setError('Valid quantity is required');
      return;
    }

    if (adjustmentType === 'remove' && parseInt(quantity) > medication.stock) {
      setError('Cannot remove more than current stock');
      return;
    }

    if (!reason) {
      setError('Reason is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // API call would go here
      // await api.adjustMedicationStock(medication.id, { adjustmentType, quantity, reason, adjustmentDateTime, editorId });
      console.log('Adjusting stock:', {
        medicationId: medication.id,
        adjustmentType,
        quantity,
        reason,
        newStock,
        adjustmentDateTime,
        editorId,
        editorName: 'Current Pharmacist', // Would come from auth context
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to adjust stock:', err);
      setError(err.message || 'Failed to adjust stock. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} title="Adjust Stock" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Medication Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">{medication.name}</h4>
          <p className="text-sm text-blue-700">
            Current Stock: <span className="font-semibold">{medication.stock} {medication.unit}</span>
          </p>
        </div>

        {/* Adjustment Type */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Adjustment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjustmentType('add')}
              className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                adjustmentType === 'add'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              ➕ Add Stock
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('remove')}
              className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                adjustmentType === 'remove'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              ➖ Remove Stock
            </button>
          </div>
        </div>

        <Input
          label="Quantity"
          type="number"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          required
        />

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Reason
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select reason...</option>
            {reasons[adjustmentType].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* New Stock Preview */}
        {quantity && (
          <div className={`p-4 border-2 rounded-lg ${
            newStock < 0 
              ? 'bg-red-50 border-red-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className="text-sm font-medium text-gray-700">
              New Stock Level: 
              <span className={`ml-2 text-lg font-bold ${
                newStock < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {newStock} {medication.unit}
              </span>
            </p>
          </div>
        )}

        {/* Audit Information */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">📋 Audit Information</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Date & Time:</p>
              <p className="font-semibold text-gray-900">
                {new Date(adjustmentDateTime).toLocaleString('en-US', {
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
              <p className="text-gray-600">Editor ID:</p>
              <p className="font-semibold text-gray-900">{editorId}</p>
            </div>
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            ⚠️ This adjustment will be logged for audit purposes
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
            disabled={isSubmitting || newStock < 0}
          >
            {isSubmitting ? 'Adjusting...' : 'Confirm Adjustment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

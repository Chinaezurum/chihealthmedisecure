import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Bill, User } from '../../types.ts';
import * as api from '../../services/apiService.ts';

interface NewClaimModalProps {
  onClose: () => void;
  onSuccess: () => void;
  insuranceProviders: any[];
  bills: Bill[];
  patients: User[];
}

export const NewClaimModal: React.FC<NewClaimModalProps> = ({ 
  onClose, 
  onSuccess, 
  insuranceProviders,
  bills,
  patients 
}) => {
  const [formData, setFormData] = useState({
    billId: '',
    patientId: '',
    insuranceProvider: '',
    claimAmount: '',
    policyNumber: '',
    diagnosisCode: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filter bills that don't have claims yet
  const availableBills = bills.filter(bill => bill.status === 'Pending');

  const handleBillChange = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      setFormData(prev => ({
        ...prev,
        billId,
        patientId: bill.patientId,
        claimAmount: bill.amount?.toString() || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.billId || !formData.insuranceProvider || !formData.claimAmount) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create claim (this endpoint would need to be implemented in the backend)
      await api.createInsuranceClaim({
        billId: formData.billId,
        patientId: formData.patientId,
        insuranceProvider: formData.insuranceProvider,
        claimAmount: parseFloat(formData.claimAmount),
        policyNumber: formData.policyNumber,
        diagnosisCode: formData.diagnosisCode,
        notes: formData.notes,
        submissionDate: new Date().toISOString(),
        status: 'Pending',
      });

      onSuccess();
    } catch (err: any) {
      console.error('Failed to create claim:', err);
      setError(err.message || 'Failed to create insurance claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Insurance Claim">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Bill Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Bill <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.billId}
            onChange={(e) => handleBillChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          >
            <option value="">-- Select a bill --</option>
            {availableBills.map(bill => {
              const patient = patients.find(p => p.id === bill.patientId);
              return (
                <option key={bill.id} value={bill.id}>
                  {bill.id} - {patient?.name || 'Unknown'} - ₦{bill.amount?.toLocaleString()}
                </option>
              );
            })}
          </select>
          {availableBills.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No pending bills available for claims</p>
          )}
        </div>

        {/* Patient (auto-filled) */}
        {formData.patientId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <input
              type="text"
              value={patients.find(p => p.id === formData.patientId)?.name || formData.patientId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              disabled
            />
          </div>
        )}

        {/* Insurance Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Insurance Provider <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.insuranceProvider}
            onChange={(e) => setFormData(prev => ({ ...prev, insuranceProvider: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          >
            <option value="">-- Select insurance provider --</option>
            {insuranceProviders.map((provider, index) => (
              <option key={index} value={typeof provider === 'string' ? provider : provider.name}>
                {typeof provider === 'string' ? provider : provider.name}
              </option>
            ))}
          </select>
          {insuranceProviders.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No insurance providers configured. Add one first.</p>
          )}
        </div>

        {/* Claim Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Claim Amount (₦) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.claimAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, claimAmount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Policy Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Policy Number
          </label>
          <input
            type="text"
            value={formData.policyNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter policy number"
            disabled={isSubmitting}
          />
        </div>

        {/* Diagnosis Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis/Procedure Code (ICD-10)
          </label>
          <input
            type="text"
            value={formData.diagnosisCode}
            onChange={(e) => setFormData(prev => ({ ...prev, diagnosisCode: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., M54.5, Z00.00"
            disabled={isSubmitting}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Any additional information for the claim..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || availableBills.length === 0 || insuranceProviders.length === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

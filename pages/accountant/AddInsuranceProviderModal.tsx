import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';

interface AddInsuranceProviderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddInsuranceProviderModal: React.FC<AddInsuranceProviderModalProps> = ({ 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    contactEmail: '',
    phone: '',
    address: '',
    website: '',
    claimSubmissionEmail: '',
    policyTypes: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Provider name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Audit log for insurance provider creation
      const auditLog = {
        action: 'ADD_INSURANCE_PROVIDER',
        providerName: formData.name,
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
        phone: formData.phone,
        createdDateTime: new Date().toISOString(),
        createdBy: 'ACC001', // Would come from auth context
        createdByName: 'Current Accountant',
      };
      console.log('Insurance provider creation audit:', auditLog);
      
      // This would need to be implemented in the backend API
      const response = await fetch('/api/accountant/insurance-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to add insurance provider');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to add provider:', err);
      setError(err.message || 'Failed to add insurance provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Insurance Provider">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Provider Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., NHIS, Hygeia HMO, Reliance HMO"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Person
          </label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Full name of contact person"
            disabled={isSubmitting}
          />
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="contact@provider.com"
            disabled={isSubmitting}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="+234 XXX XXX XXXX"
            disabled={isSubmitting}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Office Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Street address, city, state"
            disabled={isSubmitting}
          />
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="https://www.provider.com"
            disabled={isSubmitting}
          />
        </div>

        {/* Claim Submission Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Claim Submission Email
          </label>
          <input
            type="email"
            value={formData.claimSubmissionEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, claimSubmissionEmail: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="claims@provider.com"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">Email address for submitting claims</p>
        </div>

        {/* Policy Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Policy Types Offered
          </label>
          <input
            type="text"
            value={formData.policyTypes}
            onChange={(e) => setFormData(prev => ({ ...prev, policyTypes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g., Individual, Family, Corporate"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Contract details, special requirements, etc."
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Audit Information */}
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
          <h4 className="text-sm font-semibold text-indigo-900 mb-2">📋 Audit Information</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Registration Date & Time:</p>
              <p className="font-semibold text-gray-900">
                {new Date().toLocaleString('en-US', {
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
              <p className="text-gray-600">Registered By:</p>
              <p className="font-semibold text-gray-900">ACC001</p>
            </div>
          </div>
          <p className="text-xs text-indigo-700 mt-2">
            ℹ️ This provider registration will be logged for audit purposes
          </p>
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Provider'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

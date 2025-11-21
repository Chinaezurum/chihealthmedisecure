import React, { useState } from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { TruckIcon, ArchiveIcon, BedIcon } from '../icons/index.tsx';

interface CreateTransportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRequest: (request: {
    type: 'Sample' | 'Equipment' | 'Patient';
    from: string;
    to: string;
    description?: string;
    priority?: 'Normal' | 'Urgent' | 'Emergency';
    patientId?: string;
    patientName?: string;
    contactPerson?: string;
    contactPhone?: string;
    notes?: string;
  }) => void;
  currentUserId: string;
  currentUserName: string;
  currentLocation?: string;
}

export const CreateTransportRequestModal: React.FC<CreateTransportRequestModalProps> = ({
  isOpen,
  onClose,
  onCreateRequest,
  currentUserId,
  currentUserName,
  currentLocation
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [requestType, setRequestType] = useState<'Sample' | 'Equipment' | 'Patient'>('Sample');
  
  const [formData, setFormData] = useState({
    from: currentLocation || '',
    to: '',
    description: '',
    priority: 'Normal' as 'Normal' | 'Urgent' | 'Emergency',
    patientId: '',
    patientName: '',
    contactPerson: currentUserName,
    contactPhone: '',
    notes: ''
  });

  const requestTypes = [
    { value: 'Sample', label: 'Lab Sample', icon: ArchiveIcon, description: 'Transport lab samples and specimens' },
    { value: 'Equipment', label: 'Medical Equipment', icon: TruckIcon, description: 'Move medical equipment and supplies' },
    { value: 'Patient', label: 'Patient Transfer', icon: BedIcon, description: 'Patient transport between facilities' }
  ];

  const commonLocations = [
    'Emergency Department',
    'Outpatient Clinic',
    'Inpatient Ward 3rd Floor',
    'Inpatient Ward 4th Floor',
    'Operating Theater',
    'Laboratory',
    'Radiology Department',
    'Pharmacy',
    'Intensive Care Unit',
    'Maternity Ward',
    'Pediatric Ward',
    'Physiotherapy',
    'Main Reception',
    'ChiHealth Clinic Ikoyi',
    'ChiHealth Clinic Victoria Island',
    'ChiHealth General Hospital'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.from.trim()) {
      alert('Please specify the pickup location.');
      return;
    }
    
    if (!formData.to.trim()) {
      alert('Please specify the destination.');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Please provide a description of what needs to be transported.');
      return;
    }

    // Validate patient-specific fields
    if (requestType === 'Patient' && !formData.patientName.trim()) {
      alert('Please enter the patient name for patient transport requests.');
      return;
    }

    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      action: 'create_transport_request',
      requestType,
      from: formData.from,
      to: formData.to,
      priority: formData.priority,
      description: formData.description
    };
    console.log('Transport Request Creation Audit:', auditLog);

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onCreateRequest({
        type: requestType,
        from: formData.from,
        to: formData.to,
        description: formData.description,
        priority: formData.priority,
        ...(requestType === 'Patient' && {
          patientId: formData.patientId,
          patientName: formData.patientName
        }),
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        notes: formData.notes
      });
      onClose();
      
      // Reset form
      setFormData({
        from: currentLocation || '',
        to: '',
        description: '',
        priority: 'Normal',
        patientId: '',
        patientName: '',
        contactPerson: currentUserName,
        contactPhone: '',
        notes: ''
      });
      setRequestType('Sample');
    }, 500);
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFormData({
      from: currentLocation || '',
      to: '',
      description: '',
      priority: 'Normal',
      patientId: '',
      patientName: '',
      contactPerson: currentUserName,
      contactPhone: '',
      notes: ''
    });
    setRequestType('Sample');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Request Logistics Transport">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type Selection */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Transport Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {requestTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setRequestType(type.value as any)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    requestType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 ${requestType === type.value ? 'text-primary' : 'text-text-secondary'}`} />
                    <span className={`font-semibold ${requestType === type.value ? 'text-primary' : 'text-text-primary'}`}>
                      {type.label}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Priority Level *
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className="input w-full"
            required
          >
            <option value="Normal">Normal - Standard delivery</option>
            <option value="Urgent">Urgent - Within 2 hours</option>
            <option value="Emergency">Emergency - Immediate</option>
          </select>
        </div>

        {/* Locations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Pickup Location (From) *
            </label>
            <input
              list="from-locations"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              className="input w-full"
              placeholder="Enter or select location"
              required
            />
            <datalist id="from-locations">
              {commonLocations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Destination (To) *
            </label>
            <input
              list="to-locations"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="input w-full"
              placeholder="Enter or select location"
              required
            />
            <datalist id="to-locations">
              {commonLocations.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input w-full"
            rows={3}
            placeholder={
              requestType === 'Sample' 
                ? 'e.g., 3 blood samples for CBC, chemistry panel. Keep refrigerated.' 
                : requestType === 'Equipment'
                ? 'e.g., Portable X-ray machine, 2 IV poles, 1 wheelchair'
                : 'Patient requires ambulance transfer with oxygen support'
            }
            required
          />
        </div>

        {/* Patient-specific fields */}
        {requestType === 'Patient' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
            <h4 className="font-semibold text-text-primary">Patient Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Patient ID"
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                placeholder="Optional"
              />
              
              <Input
                label="Patient Name *"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="Enter patient name"
                required
              />
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="Your name"
          />
          
          <Input
            label="Contact Phone"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            placeholder="Phone number"
            type="tel"
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input w-full"
            rows={2}
            placeholder="Any special instructions or handling requirements..."
          />
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Logistics will be notified immediately. {formData.priority === 'Emergency' ? 'Emergency requests receive immediate attention.' : formData.priority === 'Urgent' ? 'Urgent requests are prioritized for same-day delivery.' : 'Normal requests are processed in order received.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

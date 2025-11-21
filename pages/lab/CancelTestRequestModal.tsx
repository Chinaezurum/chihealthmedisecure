import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { LabTest } from '../../types.ts';

interface CancelTestRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: LabTest;
  onCancel: (reason: string) => void;
  currentUserId: string;
}

export const CancelTestRequestModal: React.FC<CancelTestRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  test, 
  onCancel, 
  currentUserId 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  
  const commonReasons = [
    'Duplicate test order',
    'Test no longer needed',
    'Patient declined test',
    'Incorrect test ordered',
    'Sample quality insufficient',
    'Equipment malfunction',
    'Other (specify below)'
  ];
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const finalReason = selectedReason === 'Other (specify below)' ? reason : selectedReason;
    
    if (!finalReason.trim()) {
      alert('Please select or enter a cancellation reason.');
      return;
    }
    
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      action: 'cancel_test_request',
      testId: test.id,
      testName: test.testName,
      patientId: test.patientId,
      patientName: test.patientName,
      previousStatus: test.status,
      cancellationReason: finalReason,
      dateOrdered: test.dateOrdered
    };
    console.log('Lab Test Request Cancellation Audit:', auditLog);
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onCancel(finalReason);
    }, 1000);
  };

  const footerContent = (
    <>
      <button
        onClick={onClose}
        type="button"
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
      >
        Go Back
      </button>
      <Button type="submit" form="cancelForm" isLoading={isLoading}>
        Confirm Cancellation
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Test Request" footer={footerContent}>
      <div className="space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ Warning</p>
          <p className="text-sm text-text-secondary">
            This action will cancel the test request. This operation cannot be undone. 
            Please ensure this is the correct action before proceeding.
          </p>
        </div>
        
        <div className="bg-background-tertiary p-4 rounded-lg border border-border-primary">
          <p className="text-sm text-text-secondary mb-2">Test Information</p>
          <p className="text-text-primary font-medium text-lg">{test.testName}</p>
          <p className="text-sm text-text-secondary mt-2">Patient: {test.patientName} ({test.patientId})</p>
          <p className="text-sm text-text-secondary">Ordered: {new Date(test.dateOrdered).toLocaleString()}</p>
          <p className="text-sm text-text-secondary">Current Status: <span className="font-medium">{test.status}</span></p>
        </div>
        
        <form id="cancelForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select a reason...</option>
              {commonReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          {selectedReason === 'Other (specify below)' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Please Specify Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Enter detailed reason for cancellation"
                required
              />
            </div>
          )}
        </form>
        
        {/* Audit UI Section */}
        <div className="border-t border-border-primary pt-4 mt-4">
          <p className="text-xs text-text-tertiary mb-2">Audit Information</p>
          <div className="bg-background-tertiary p-3 rounded-lg space-y-1">
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Timestamp:</span> {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Lab Technician ID:</span> {currentUserId}
            </p>
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Action:</span> Cancel Test Request
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

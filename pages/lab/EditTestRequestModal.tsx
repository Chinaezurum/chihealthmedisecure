import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { LabTest } from '../../types.ts';

interface EditTestRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: LabTest;
  onSave: (updates: Partial<LabTest>) => void;
  currentUserId: string;
}

export const EditTestRequestModal: React.FC<EditTestRequestModalProps> = ({ 
  isOpen, 
  onClose, 
  test, 
  onSave, 
  currentUserId 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    testName: test.testName,
    priority: (test as any).priority || 'Normal',
    notes: (test as any).notes || '',
    status: test.status
  });
  
  useEffect(() => {
    setFormData({
      testName: test.testName,
      priority: (test as any).priority || 'Normal',
      notes: (test as any).notes || '',
      status: test.status
    });
  }, [test]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.testName.trim()) {
      alert('Please enter a test name.');
      return;
    }
    
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      action: 'edit_test_request',
      testId: test.id,
      patientId: test.patientId,
      patientName: test.patientName,
      changes: {
        testName: { old: test.testName, new: formData.testName },
        priority: { old: (test as any).priority || 'Normal', new: formData.priority },
        notes: { old: (test as any).notes || '', new: formData.notes },
        status: { old: test.status, new: formData.status }
      }
    };
    console.log('Lab Test Request Edit Audit:', auditLog);
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSave(formData);
    }, 1000);
  };

  const footerContent = (
    <>
      <button
        onClick={onClose}
        type="button"
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
      >
        Cancel
      </button>
      <Button type="submit" form="editRequestForm" isLoading={isLoading}>
        Save Changes
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Test Request" footer={footerContent}>
      <div className="space-y-4">
        <div className="bg-background-tertiary p-4 rounded-lg border border-border-primary">
          <p className="text-sm text-text-secondary mb-1">Patient Information</p>
          <p className="text-text-primary font-medium">{test.patientName}</p>
          <p className="text-sm text-text-secondary">ID: {test.patientId}</p>
          <p className="text-sm text-text-secondary mt-2">Ordered: {new Date(test.dateOrdered).toLocaleString()}</p>
        </div>
        
        <form id="editRequestForm" onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Test Name" 
            name="testName" 
            value={formData.testName} 
            onChange={(e) => setFormData({ ...formData, testName: e.target.value })} 
            placeholder="Enter test name"
            required 
          />
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Ordered">Ordered</option>
              <option value="In-progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Awaiting Pickup">Awaiting Pickup</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Add notes about the test request"
            />
          </div>
        </form>
        
        {/* Audit UI Section */}
        <div className="border-t border-border-primary pt-4 mt-4">
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                Audit Trail - Changes will be logged
              </p>
            </div>
          </div>
          <div className="bg-background-tertiary p-3 rounded-lg space-y-1">
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Timestamp:</span> {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Lab Technician ID:</span> {currentUserId}
            </p>
            <p className="text-xs text-text-secondary">
              <span className="font-medium">Action:</span> Edit Test Request
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

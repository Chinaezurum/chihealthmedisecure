
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { LabTest } from '../../types.ts';

interface EnterResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: LabTest;
  onSave: (result: string, notes: string) => void;
  currentUserId: string;
}

export const EnterResultsModal: React.FC<EnterResultsModalProps> = ({ isOpen, onClose, test, onSave, currentUserId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  useEffect(() => {
    if (test.result) {
      setResult(test.result);
      setIsEditMode(true);
    } else {
      setResult('');
      setIsEditMode(false);
    }
    setNotes('');
  }, [test]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!result.trim()) {
        alert('Please enter a result.');
        return;
    }
    
    // Audit logging
    const auditLog = {
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      action: isEditMode ? 'edit_test_result' : 'enter_test_result',
      testId: test.id,
      testName: test.testName,
      patientId: test.patientId,
      patientName: test.patientName,
      oldResult: isEditMode ? test.result : null,
      newResult: result,
      notes: notes,
      status: 'completed'
    };
    console.log('Lab Test Result Audit:', auditLog);
    
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        onSave(result, notes);
    }, 1000);
  }

  const footerContent = (
    <>
      <button
        onClick={onClose}
        type="button"
        className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
      >
        Cancel
      </button>
      <Button type="submit" form="resultsForm" isLoading={isLoading}>
        {isEditMode ? 'Update Results' : 'Save Results'}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${isEditMode ? 'Edit' : 'Enter'} Results for ${test.testName}`} footer={footerContent}>
      <div className="space-y-4">
        <div className="bg-background-tertiary p-4 rounded-lg border border-border-primary">
          <p className="text-sm text-text-secondary mb-1">Patient Information</p>
          <p className="text-text-primary font-medium">{test.patientName}</p>
          <p className="text-sm text-text-secondary">ID: {test.patientId}</p>
          <p className="text-sm text-text-secondary mt-2">Ordered: {new Date(test.dateOrdered).toLocaleString()}</p>
        </div>
        
        <form id="resultsForm" onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Test Result" 
            name="result" 
            value={result} 
            onChange={(e) => setResult(e.target.value)} 
            placeholder="Enter quantitative or qualitative result"
            required 
          />
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Add any relevant observations or comments"
            />
          </div>
          
          {isEditMode && test.result && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">Previous Result:</p>
              <p className="text-text-primary">{test.result}</p>
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
              <span className="font-medium">Action:</span> {isEditMode ? 'Edit Test Result' : 'Enter Test Result'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
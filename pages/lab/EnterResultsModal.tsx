
import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.tsx';
import { Button } from '../../components/common/Button.tsx';
import { Input } from '../../components/common/Input.tsx';
import { LabTest } from '../../types.ts';

interface EnterResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: LabTest;
  onSave: (result: string) => void;
}

export const EnterResultsModal: React.FC<EnterResultsModalProps> = ({ isOpen, onClose, test, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!result) {
        alert('Please enter a result.');
        return;
    }
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        onSave(result);
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
        Save Results
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Enter Results for ${test.testName}`} footer={footerContent}>
      <p className="text-slate-400 mb-4">Patient: {test.patientName} ({test.patientId})</p>
      <form id="resultsForm" onSubmit={handleSubmit} className="space-y-4">
        <Input 
            label="Test Result" 
            name="result" 
            value={result} 
            onChange={(e) => setResult(e.target.value)} 
            placeholder="Enter quantitative or qualitative result"
            required 
        />
      </form>
    </Modal>
  );
};
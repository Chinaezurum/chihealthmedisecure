import React, { useState } from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';
import { Select } from './Select.tsx';
import { InterDepartmentalNote } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';

interface InterDepartmentalNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  relatedEntityId?: string;
  relatedEntityType?: 'lab' | 'prescription' | 'vitals' | 'general';
  onSendNote: (note: Omit<InterDepartmentalNote, 'id' | 'timestamp' | 'isRead' | 'fromUserId' | 'fromUserName' | 'fromRole'>) => void;
}

export const InterDepartmentalNotesModal: React.FC<InterDepartmentalNotesModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  relatedEntityId,
  relatedEntityType = 'general',
  onSendNote
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Normal' | 'High'>('Normal');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToasts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      onSendNote({
        patientId,
        patientName,
        toRole: 'hcw',
        relatedEntityId,
        relatedEntityType,
        subject,
        message,
        priority
      });
      
      addToast('Note sent to doctor successfully', 'success');
      setSubject('');
      setMessage('');
      setPriority('Normal');
      onClose();
    } catch (error) {
      console.error('Failed to send note:', error);
      addToast('Failed to send note', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectSuggestions = () => {
    switch (relatedEntityType) {
      case 'lab':
        return [
          'Lab test completed',
          'Lab results require attention',
          'Issue with lab sample',
          'Additional testing recommended'
        ];
      case 'prescription':
        return [
          'Prescription dispensed',
          'Medication out of stock',
          'Drug interaction concern',
          'Dosage clarification needed'
        ];
      case 'vitals':
        return [
          'Vitals recorded',
          'Abnormal vital signs detected',
          'Patient requires immediate attention',
          'Follow-up vitals needed'
        ];
      default:
        return [
          'Patient update',
          'Urgent attention needed',
          'Question about treatment plan',
          'General observation'
        ];
    }
  };

  const footerContent = (
    <>
      <Button
        onClick={onClose}
        type="button"
        style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
      >
        Cancel
      </Button>
      <Button type="submit" form="noteForm" isLoading={isLoading}>
        Send Note to Doctor
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Send Note to Doctor - ${patientName}`}
      footer={footerContent}
    >
      <form id="noteForm" onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            This note will be sent to the attending doctor(s) for <strong>{patientName}</strong>.
            {relatedEntityType !== 'general' && ` It's related to a ${relatedEntityType} record.`}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 bg-background-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Brief subject line..."
            required
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {getSubjectSuggestions().map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setSubject(suggestion)}
                className="px-3 py-1 text-xs bg-background-secondary border border-border-primary rounded-full text-text-secondary hover:bg-primary hover:text-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'Low' | 'Normal' | 'High')}
        >
          <option value="Low">Low - Routine information</option>
          <option value="Normal">Normal - Standard communication</option>
          <option value="High">High - Requires prompt attention</option>
        </Select>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-background-secondary border-2 border-border-primary rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-y min-h-[150px]"
            placeholder="Provide details about the patient status, test results, concerns, or questions..."
            required
          />
        </div>

        <div className="text-xs text-text-tertiary">
          <p>💡 <strong>Tip:</strong> Be specific and include relevant details such as test values, observations, or time-sensitive information.</p>
        </div>
      </form>
    </Modal>
  );
};

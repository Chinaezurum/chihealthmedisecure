import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { Patient, User, ClinicalNote } from '../../types.ts';

interface ClinicalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  doctor: User;
  onSave: (note: Omit<ClinicalNote, 'id' | 'doctorId' | 'doctorName'>) => void;
  initialContent?: string;
}

export const ClinicalNoteModal: React.FC<ClinicalNoteModalProps> = ({ isOpen, onClose, patient, doctor: _doctor, onSave, initialContent }) => {
  const [content, setContent] = useState(initialContent || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Note content cannot be empty.');
      return;
    }
    setIsLoading(true);
    
    const newNote = {
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      content,
    };

    // Simulate API call
    setTimeout(() => {
      onSave(newNote);
      setIsLoading(false);
      setContent('');
      onClose();
    }, 1000);
  };

  const footer = (
    <>
      <Button onClick={onClose} type="button" style={{backgroundColor: 'var(--background-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)'}}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} isLoading={isLoading}>
        Save Note
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`New Clinical Note for ${patient.name}`} footer={footer}>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter clinical notes (e.g., SOAP format)..."
          className="w-full h-48 p-2 border border-border-primary rounded-md bg-background-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </form>
    </Modal>
  );
};
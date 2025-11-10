import React, { useEffect, useState } from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialTime?: string;
  onSave: (date: string, time: string) => Promise<void> | void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ isOpen, onClose, initialDate, initialTime, onSave }) => {
  const [date, setDate] = useState(initialDate || '');
  const [time, setTime] = useState(initialTime || '09:00');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || '');
      setTime(initialTime || '09:00');
    }
  }, [isOpen, initialDate, initialTime]);

  const handleSave = async () => {
    if (!date || !time) return alert('Please enter both date and time');
    setIsSaving(true);
    try {
      await onSave(date, time);
      onClose();
    } catch (err: any) {
      alert('Failed to reschedule: ' + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Appointment" footer={(
      <>
        <Button onClick={onClose} className="btn-secondary">Cancel</Button>
        <Button onClick={handleSave} className="btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
      </>
    )}>
      <div className="space-y-4">
        <label className="block">
          <div className="text-sm font-medium mb-1">Date</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </label>
        <label className="block">
          <div className="text-sm font-medium mb-1">Time</div>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
        </label>
      </div>
    </Modal>
  );
};

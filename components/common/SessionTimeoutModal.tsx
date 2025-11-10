import React from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  countdown: number;
  onStay: () => void;
  onLogout: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ isOpen, countdown, onStay, onLogout }) => {
  if (!isOpen) return null;

  const footer = (
    <div className="flex gap-4 w-full">
      <Button onClick={onLogout} fullWidth>
        Log Out
      </Button>
      <Button onClick={onStay} fullWidth>
        Stay Logged In
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onLogout} title="Session Timeout Warning" footer={footer}>
      <div className="text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-4">You have been inactive for a while. For your security, you will be logged out automatically.</p>
        <p className="text-lg font-bold text-slate-800 dark:text-white">
          Time remaining: <span className="text-red-500">{countdown}</span> seconds
        </p>
      </div>
    </Modal>
  );
};

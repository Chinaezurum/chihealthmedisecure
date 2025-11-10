import React from 'react';
import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';
import { AlertTriangleIcon, SparklesIcon } from '../icons/index.tsx';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'info' }) => {
  const Icon = type === 'danger' ? AlertTriangleIcon : SparklesIcon;
  const iconClass = type === 'danger' ? 'danger' : 'info';

  const footer = (
    <>
      <Button onClick={onClose} className="btn-secondary">
        {cancelText}
      </Button>
      <Button onClick={onConfirm} className={type === 'danger' ? 'btn-danger' : 'btn-primary'}>
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
      <div className="text-center p-4">
        <div className={`confirmation-modal-icon ${iconClass}`}>
            <Icon />
        </div>
        <p className="text-text-secondary mt-4">{message}</p>
      </div>
    </Modal>
  );
};

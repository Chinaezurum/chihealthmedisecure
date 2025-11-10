import React from 'react';
import { Toast as ToastTypeInterface, ToastType } from '../../types.ts';
import { CheckCircleIcon, AlertTriangleIcon, SparklesIcon } from '../icons/index.tsx';

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircleIcon,
  error: AlertTriangleIcon,
  info: SparklesIcon,
};

const Toast: React.FC<{ toast: ToastTypeInterface; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  React.useEffect(() => {
    const timer = setTimeout(handleClose, 5000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  const Icon = ICONS[toast.type];

  return (
    <div 
      role="status"
      aria-live="polite"
      className={`toast ${isExiting ? 'exiting' : ''}`}
    >
      <div className={`toast-icon ${toast.type}`}>
        <Icon />
      </div>
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
      </div>
      <button onClick={handleClose} className="toast-close-button" aria-label="Close notification">
        &times;
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastTypeInterface[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container" aria-live="assertive">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

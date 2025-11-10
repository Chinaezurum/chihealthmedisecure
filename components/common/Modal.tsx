import React, { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 id="modal-title" className="text-xl font-bold text-teal-600 dark:text-teal-400">{title}</h2>
            <button 
              onClick={onClose} 
              className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white text-3xl font-light leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}
        {!title && (
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={onClose} 
              className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white text-2xl font-light leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
            <div className="flex justify-between items-center p-5 border-t border-slate-200 dark:border-slate-700 gap-3">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};
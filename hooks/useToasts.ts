import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext.tsx';

export const useToasts = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
};

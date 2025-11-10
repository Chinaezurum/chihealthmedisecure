import React from 'react';
import { FolderSearchIcon } from '../icons/index.tsx';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  message: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon = FolderSearchIcon, title, message, children }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {children && <div style={{marginTop: '1.5rem'}}>{children}</div>}
    </div>
  );
};
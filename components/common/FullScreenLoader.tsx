import React from 'react';
import { Logo } from './Logo.tsx';

export const FullScreenLoader: React.FC<{ message?: string }> = ({ message = 'Initializing...' }) => {
  return (
    <div className="full-screen-loader" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--background-primary)',
      color: 'var(--text-primary)'
    }}>
      <div className="loader-content" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        textAlign: 'center'
      }}>
        <Logo />
        <p style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{message}</p>
      </div>
    </div>
  );
};
import React from 'react';
import { AuthHeader } from './AuthHeader.tsx';

interface AuthLayoutProps {
  children: React.ReactNode;
  onNavigate: () => void;
  pageType: 'login' | 'registerOrg' | 'ssoComplete' | 'forgotPassword' | 'pricing';
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, onNavigate, pageType, theme, toggleTheme }) => {
  return (
    <div className="auth-container">
      <AuthHeader onNavigate={onNavigate} pageType={pageType} theme={theme} toggleTheme={toggleTheme} />
      <div className="auth-content">
        {children}
      </div>
    </div>
  );
};
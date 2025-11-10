import React from 'react';
import { Logo } from '../../components/common/Logo.tsx';
import { ThemeToggle } from '../../components/common/ThemeToggle.tsx';

interface AuthHeaderProps {
  onNavigate: () => void;
  pageType: 'login' | 'registerOrg' | 'ssoComplete' | 'forgotPassword' | 'pricing';
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ onNavigate, pageType, theme, toggleTheme }) => {
  const getButtonText = () => {
    switch(pageType) {
      case 'registerOrg':
      case 'forgotPassword':
      case 'pricing':
        return '← Back to Sign In';
      case 'ssoComplete':
        return 'Cancel & Sign In';
      case 'login':
      default:
        return 'Register a Facility →';
    }
  };

  const logoIsButton = pageType !== 'login';

  const LogoComponent = logoIsButton ? (
    <button onClick={onNavigate} className="header-logo" aria-label="Back to Sign In">
      <Logo />
      <span>ChiHealth MediSecure</span>
    </button>
  ) : (
    <div className="header-logo">
      <Logo />
      <span>ChiHealth MediSecure</span>
    </div>
  );

  return (
    <header className="auth-header">
      {LogoComponent}
      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <button onClick={onNavigate} className="btn btn-secondary">
          {getButtonText()}
        </button>
      </div>
    </header>
  );
};
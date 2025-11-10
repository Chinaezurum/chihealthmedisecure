

import React from 'react';
import { AuthForm } from './AuthForm.tsx';
import { Patient, User } from '../../types.ts';
import { SecurityAssurance } from '../../components/auth/SecurityAssurance.tsx';

interface AuthProps {
  onSsoSuccess: (user: Partial<Patient>) => void;
  onForgotPassword: () => void;
  onAuthSuccess: (user: User) => void;
  onNavigateToPricing: () => void;
  initialTab?: 'login' | 'register';
}

const Auth: React.FC<AuthProps> = ({ onSsoSuccess, onForgotPassword, onAuthSuccess, onNavigateToPricing, initialTab }) => {
  return (
    <>
      <div className="main-headline">
          <h1>Secure, Intelligent Healthcare</h1>
          <p>Your complete health record, accessible anytime, anywhere.</p>
      </div>
      <SecurityAssurance />
      <AuthForm 
        initialTab={initialTab}
        onSsoSuccess={onSsoSuccess} 
        onForgotPassword={onForgotPassword} 
        onAuthSuccess={onAuthSuccess} 
      />
       <div className="auth-sub-link">
          Looking to register a facility?{' '}
          <button onClick={onNavigateToPricing} className="auth-card__link">
            View our plans
          </button>
      </div>
    </>
  );
};

export default Auth;
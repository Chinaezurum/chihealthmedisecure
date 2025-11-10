import React from 'react';

interface SSOButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  providerName: string;
  isLoading?: boolean;
}

export const SSOButton: React.FC<SSOButtonProps> = ({ children, providerName, isLoading, ...props }) => {
  return (
    <button
      type="button"
      className="sso-btn"
      aria-label={`Continue with ${providerName}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <svg style={{ animation: 'spin 1s linear infinite' }} className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"></circle>
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"></path>
        </svg>
      ) : (
        children
      )}
    </button>
  );
};
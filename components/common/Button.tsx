import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, isLoading = false, fullWidth = false, ...props }) => {
  const classNames = ['btn', 'btn-primary'];
  if (fullWidth) {
    classNames.push('btn-full-width');
  }

  return (
    <button
      className={classNames.join(' ')}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <svg style={{
          animation: 'spin 1s linear infinite', 
          position: 'absolute'
        }} width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"></circle>
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"></path>
        </svg>
      )}
      <span style={{ opacity: isLoading ? 0 : 1 }}>{children}</span>
    </button>
  );
};
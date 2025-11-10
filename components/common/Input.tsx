import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

export const Input: React.FC<InputProps> = ({ label, name, error, multiline, rows = 3, ...props }) => {
  const inputClasses = `form-input ${error ? 'form-input-error' : ''} ${multiline ? 'form-textarea' : ''}`;
  
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          className={inputClasses}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={name}
          name={name}
          className={inputClasses}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <p className="form-error-text">{error}</p>}
    </div>
  );
};
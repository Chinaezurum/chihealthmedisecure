import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, name, error, children, ...props }) => {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <div className="select-wrapper">
        <select
          id={name}
          name={name}
          className={`form-select ${error ? 'form-input-error' : ''} ${props.disabled ? 'form-select-disabled' : ''}`}
          {...props}
        >
          {children}
        </select>
        <svg className="select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error && <p className="form-error-text">{error}</p>}
    </div>
  );
};
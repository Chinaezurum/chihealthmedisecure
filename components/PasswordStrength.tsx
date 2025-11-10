import React from 'react';
import { PasswordStrengthResult } from '../utils/validation.ts';

interface PasswordStrengthProps {
  strength: PasswordStrengthResult;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ strength }) => {
  if (strength.score < 0) return null;

  const levels = [
    { text: 'Very Weak', color: '#ef4444' }, // red-500
    { text: 'Weak', color: '#f97316' }, // orange-500
    { text: 'Medium', color: '#eab308' }, // yellow-500
    { text: 'Strong', color: '#84cc16' }, // lime-500
    { text: 'Very Strong', color: '#22c55e' }, // green-500
  ];

  const currentLevel = levels[strength.score];
  const strengthPercentage = ((strength.score + 1) / 5) * 100;
  
  const strengthColor = strength.score < 2 ? 'var(--warning-color)' : 'var(--success-color)';

  return (
    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{
        width: '100%',
        backgroundColor: 'var(--border-primary)',
        borderRadius: '9999px',
        height: '6px',
        overflow: 'hidden'
      }}>
        <div
          style={{
            height: '100%',
            borderRadius: '9999px',
            transition: 'width 0.3s, background-color 0.3s',
            backgroundColor: currentLevel.color,
            width: `${strengthPercentage}%`
          }}
        ></div>
      </div>
      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: strengthColor }}>
        Strength: {currentLevel.text}
      </p>
    </div>
  );
};
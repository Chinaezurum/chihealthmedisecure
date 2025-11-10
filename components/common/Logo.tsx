import React from 'react';

export const Logo: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ChiHealth MediSecure Logo">
    <defs>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'var(--teal-400)' }} />
        <stop offset="100%" style={{ stopColor: 'var(--teal-500)' }} />
      </linearGradient>
    </defs>
    
    {/* The 'C' shape, representing Chi, Care, and Connectivity */}
    <path
      d="M17.65 17.65A8 8 0 1 1 17.65 6.35"
      stroke="url(#logo-gradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* The Plus/Cross shape, representing Health and Medicine */}
    <path
      d="M12 9V15M9 12H15"
      stroke="var(--teal-300)"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
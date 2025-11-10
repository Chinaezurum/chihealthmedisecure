import React from 'react';
import { SunIcon, MoonIcon } from '../icons/index.tsx';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-button"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? 
        <MoonIcon style={{height: '18px', width: '18px'}} /> : 
        <SunIcon style={{height: '18px', width: '18px'}} />
      }
    </button>
  );
};
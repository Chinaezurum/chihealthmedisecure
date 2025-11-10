import React from 'react';

const ShieldIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-cyan-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M12 11v4"></path>
    <path d="M10 13h4"></path>
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 shadow-lg sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center space-x-4">
        <ShieldIcon />
        <div>
          <h1 className="text-xl font-bold text-cyan-300">
            Secure Healthcare Platform Architect
          </h1>
          <p className="text-sm text-gray-400">
            AI-Powered Brainstorming for a Secure Medical Infrastructure
          </p>
        </div>
      </div>
    </header>
  );
};
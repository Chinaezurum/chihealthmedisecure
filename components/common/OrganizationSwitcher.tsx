import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types.ts';
import { BuildingIcon } from '../icons/index.tsx';

interface OrganizationSwitcherProps {
  user: User;
  onSwitch: (orgId: string) => void;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({ user, onSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (orgId: string) => {
    if (orgId !== user.currentOrganization.id) {
        onSwitch(orgId);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
      >
        <BuildingIcon className="w-4 h-4" />
        <span className="truncate max-w-[150px]">{user.currentOrganization.name}</span>
        <svg className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-20">
          {user.organizations.map(org => (
            <button
              key={org.id}
              onClick={() => handleSelect(org.id)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center ${org.id === user.currentOrganization.id ? 'font-bold text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}
            >
              {org.name}
              {org.id === user.currentOrganization.id && <span className="text-teal-500">&#10003;</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

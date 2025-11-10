import React from 'react';
import * as Icons from '../icons/index.tsx';

interface DashboardLayoutProps {
    sidebar: React.ReactNode;
    header: React.ReactNode;
    children: React.ReactNode;
    onSignOut?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ sidebar, header, children, onSignOut }) => {
    return (
        <div className="dashboard">
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <div className="dashboard-sidebar-wrapper">
                {sidebar}
                {onSignOut && (
                    <div className="dashboard-sidebar-footer">
                        <button onClick={onSignOut} className="sidebar-link sidebar-sign-out" aria-label="Sign Out from sidebar">
                            <Icons.LogOutIcon />
                            <span>Sign Out</span>
                        </button>
                    </div>
                )}
            </div>
            <div className="dashboard-main">
                {header}
                <main id="main-content" className="dashboard-content">
                    <div className="content-container">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
import React from 'react';
import * as Icons from '../icons/index.tsx';
import { ConfirmationModal } from './ConfirmationModal.tsx';

interface DashboardLayoutProps {
    sidebar: React.ReactNode;
    header: React.ReactNode;
    children: React.ReactNode;
    onSignOut?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ sidebar, header, children, onSignOut }) => {
    const [showSignOutModal, setShowSignOutModal] = React.useState(false);

    const handleSignOut = () => {
        setShowSignOutModal(false);
        onSignOut?.();
    };

    return (
        <div className="dashboard">
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <div className="dashboard-sidebar-wrapper">
                {sidebar}
                {onSignOut && (
                    <div className="dashboard-sidebar-footer">
                        <button 
                            onClick={() => setShowSignOutModal(true)} 
                            className="sidebar-link sidebar-sign-out" 
                            aria-label="Sign Out from sidebar"
                        >
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

            {onSignOut && (
                <ConfirmationModal
                    isOpen={showSignOutModal}
                    onClose={() => setShowSignOutModal(false)}
                    onConfirm={handleSignOut}
                    title="Confirm Sign Out"
                    message="Are you sure you want to sign out of your account?"
                    confirmText="Sign Out"
                    type="danger"
                />
            )}
        </div>
    );
};
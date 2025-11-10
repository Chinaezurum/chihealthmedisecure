import React, { useState, useEffect, useCallback } from 'react';
import Auth from './pages/auth/Auth';
import SsoComplete from './pages/auth/SsoComplete';
import RegisterOrg from './pages/auth/RegisterOrg';
import ForgotPassword from './pages/auth/ForgotPassword';
import { AuthLayout } from './pages/auth/AuthLayout';
import { PricingPage } from './pages/auth/PricingPage';

import PatientDashboard from './pages/patient/PatientDashboard';
import HealthcareWorkerDashboard from './pages/hcw/HealthcareWorkerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import NurseDashboard from './pages/nurse/NurseDashboard';
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';
import LabTechnicianDashboard from './pages/lab/LabTechnicianDashboard';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import LogisticsDashboard from './pages/logistics/LogisticsDashboard';
import CommandCenterDashboard from './pages/command-center/CommandCenterDashboard.tsx';

import { FullScreenLoader } from './components/common/FullScreenLoader';
import { SessionTimeoutModal } from './components/common/SessionTimeoutModal';

import { User, Patient } from './types';
import * as api from './services/apiService';
import { useDarkMode } from './hooks/useDarkMode';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useWebSocket } from './hooks/useWebSocket';

type View = 'auth' | 'ssoComplete' | 'dashboard' | 'registerOrg' | 'forgotPassword' | 'pricing';

const App: React.FC = () => {
  console.log("App: Component rendering");
  
  const [user, setUser] = useState<User | null>(null);
  const [ssoUser, setSsoUser] = useState<Partial<Patient> | null>(null);
  // Start with loading false - show auth immediately
  // Don't wait for token check - show content right away
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<View>('auth');
  const [initialTab, setInitialTab] = useState<'login' | 'register'>('login');
  
  // Removed aggressive 1-second timeout - let fetchUser handle its own timeout (10 seconds)
  // This prevents false logouts on slow network connections
  
  console.log("App: Initializing hooks");
  let theme: 'light' | 'dark';
  let toggleTheme: () => void;
  
  try {
    [theme, toggleTheme] = useDarkMode();
    console.log("App: useDarkMode hook initialized");
  } catch (error) {
    console.error("App: Error in useDarkMode:", error);
    theme = 'dark';
    toggleTheme = () => {};
  }

  const handleSignOut = useCallback(() => {
    api.clearAuthToken();
    setUser(null);
    setView('auth');
  }, []);
  
  const { isWarningModalOpen, countdown, handleStay } = useSessionTimeout(handleSignOut);

  const fetchUser = useCallback(async () => {
    console.log("App: fetchUser called");
    setIsLoading(true);
    
    // Add a fallback timeout to ensure loading never gets stuck - increased to 10 seconds
    const loadingTimeout = setTimeout(() => {
      console.warn("App: fetchUser timeout - forcing stop loading");
      setIsLoading(false);
      // Don't clear token or change view on timeout - might be network issue
      // Just stop loading and let user see current state
    }, 10000); // 10 second max
    
    try {
      const token = api.getAuthToken();
      if (token) {
        console.log("App: Token found, fetching user data");
        try {
          const userData = await api.fetchCurrentUser();
          
          console.log("App: User data fetched successfully", userData);
          clearTimeout(loadingTimeout);
          setUser(userData);
          setView('dashboard');
          setIsLoading(false);
          return;
        } catch (error: any) {
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          
          // Only clear token and sign out on actual 401 Unauthorized errors
          if (error?.status === 401 || (error?.message && error.message.includes('Unauthorized'))) {
            console.error("App: Session expired or invalid (401)", error);
            api.clearAuthToken();
            setView('auth');
            return;
          }
          
          // For network errors, timeouts, or other errors, don't sign out
          // Just log the error and keep the user logged in (token might still be valid)
          console.warn("App: Failed to fetch user data (non-critical):", error);
          // Don't change view - user might still be authenticated, just network issue
          // The token remains in localStorage, so user can retry
          return;
        }
      } else {
        console.log("App: No token found, showing auth page");
        clearTimeout(loadingTimeout);
        setView('auth');
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("App: Error in fetchUser:", error);
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      // Don't clear token or change view on unexpected errors
      // Might be a temporary issue
    }
  }, [handleSignOut]);

  // Safe refetch function for WebSocket updates - never signs out on errors
  const refetchUserData = useCallback(async () => {
    console.log("App: refetchUserData called (safe refetch)");
    
    try {
      const token = api.getAuthToken();
      if (!token) {
        console.log("App: No token found in refetchUserData - skipping");
        return;
      }

      // Only update user data if we're already logged in
      if (!user) {
        console.log("App: No user state in refetchUserData - skipping");
        return;
      }

      try {
        const userData = await api.fetchCurrentUser();
        console.log("App: User data refreshed successfully", userData);
        setUser(userData);
        // Don't change view or loading state - just update user data
      } catch (error: any) {
        // On error, just log it - don't sign out or change view
        console.warn("App: Failed to refresh user data (non-critical):", error);
        // User can continue working - this is just a background refresh
      }
    } catch (error) {
      // Catch any unexpected errors
      console.warn("App: Unexpected error in refetchUserData:", error);
      // Don't sign out - let user continue working
    }
  }, [user]);
  
  useWebSocket(user?.id, refetchUserData);

  useEffect(() => {
    console.log("App: useEffect for SSO callback running");
    
    const checkSsoCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tempToken = urlParams.get('tempToken');
        const isNewUser = urlParams.get('isNewUser');
        const error = urlParams.get('error');

        if (error) {
          // Handle SSO error
          console.error('App: SSO Error:', error);
          window.history.replaceState({}, document.title, window.location.pathname);
          setView('auth');
          setIsLoading(false);
          return;
        }
        
        if (tempToken) {
          console.log("App: Temp token found, processing SSO");
          setIsLoading(true); // Show loading for SSO flow
          if (isNewUser === 'true') {
              try {
                const userData = await api.getSsoUserData(tempToken);
                setSsoUser(userData);
                setView('ssoComplete');
                setIsLoading(false);
              } catch (error) {
                console.error("App: Error fetching SSO user data:", error);
                setView('auth');
                setIsLoading(false);
              }
          } else {
              api.setAuthToken(tempToken);
              await fetchUser();
              window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // Check for existing token
          const token = api.getAuthToken();
          if (token) {
            console.log("App: Token found, fetching user");
            setIsLoading(true);
            await fetchUser();
          } else {
            console.log("App: No token - showing auth page immediately");
            setView('auth');
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("App: Error in checkSsoCallback:", error);
        setView('auth'); // Show auth page on any error
        setIsLoading(false);
      }
    };
    
    checkSsoCallback();
  }, [fetchUser]);

  const handleAuthSuccess = (authedUser: User) => {
    setUser(authedUser);
    setView('dashboard');
  };

  const renderDashboard = () => {
    if (!user) return <Auth onAuthSuccess={handleAuthSuccess} onSsoSuccess={setSsoUser} onForgotPassword={() => setView('forgotPassword')} onNavigateToPricing={() => setView('pricing')} />;
    switch (user.role) {
      case 'patient':
        return <PatientDashboard user={user as Patient} onSignOut={() => handleSignOut()} theme={theme} toggleTheme={toggleTheme} />;
      case 'hcw':
        return <HealthcareWorkerDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
      case 'admin':
        return <AdminDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
      case 'nurse':
        return <NurseDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
      case 'pharmacist':
        return <PharmacistDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
      case 'lab_technician':
        return <LabTechnicianDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
      case 'receptionist':
         return <ReceptionistDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
      case 'logistics':
        return <LogisticsDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
      case 'command_center':
        return <CommandCenterDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
      default:
        return <div>Unknown user role. Please contact support.</div>;
    }
  };
  
  const renderContent = () => {
    console.log("App: renderContent called, isLoading:", isLoading, "view:", view);
    
    // If loading, show loader - let fetchUser handle its own timeout
    if (isLoading) {
      console.log("App: Showing FullScreenLoader");
      return <FullScreenLoader message="Loading..." />;
    }

    console.log("App: Not loading, rendering view:", view);
    
    try {
      switch (view) {
        case 'auth':
          console.log("App: Rendering auth view");
          try {
            const authContent = (
              <AuthLayout onNavigate={() => setView('pricing')} pageType='login' theme={theme} toggleTheme={toggleTheme}>
                <Auth 
                  initialTab={initialTab}
                  onAuthSuccess={handleAuthSuccess} 
                  onSsoSuccess={setSsoUser} 
                  onForgotPassword={() => setView('forgotPassword')}
                  onNavigateToPricing={() => setView('pricing')}
                />
              </AuthLayout>
            );
            console.log("App: Auth content created successfully");
            return authContent;
          } catch (authError) {
            console.error("App: Error rendering auth:", authError);
            return (
              <div style={{ padding: '2rem', color: '#ef4444', backgroundColor: '#fff', minHeight: '100vh' }}>
                <h1>Error Loading Auth Page</h1>
                <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
                  {authError instanceof Error ? authError.message : String(authError)}
                  {authError instanceof Error && authError.stack && (
                    <>
                      <br /><br />
                      {authError.stack}
                    </>
                  )}
                </pre>
                <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', background: '#0d9488', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Reload Page
                </button>
              </div>
            );
          }
      case 'ssoComplete':
         return (
          <AuthLayout onNavigate={() => { setSsoUser(null); setView('auth'); }} pageType='ssoComplete' theme={theme} toggleTheme={toggleTheme}>
            {ssoUser && <SsoComplete user={ssoUser} onAuthSuccess={handleAuthSuccess} onCancel={() => { setSsoUser(null); setView('auth'); }} />}
          </AuthLayout>
         );
      case 'registerOrg':
        return (
          <AuthLayout onNavigate={() => setView('auth')} pageType='registerOrg' theme={theme} toggleTheme={toggleTheme}>
            <RegisterOrg onNavigate={() => { setView('auth'); setInitialTab('login'); }} />
          </AuthLayout>
        );
      case 'forgotPassword':
        return (
          <AuthLayout onNavigate={() => setView('auth')} pageType='forgotPassword' theme={theme} toggleTheme={toggleTheme}>
            <ForgotPassword onBackToLogin={() => setView('auth')} />
          </AuthLayout>
        );
      case 'pricing':
        return (
            <AuthLayout onNavigate={() => setView('auth')} pageType='pricing' theme={theme} toggleTheme={toggleTheme}>
                <PricingPage onSelectPlan={() => setView('registerOrg')} onSelectPatientPlan={() => { setView('auth'); setInitialTab('register'); }}/>
            </AuthLayout>
        );
      case 'dashboard':
        return renderDashboard();
        default:
          console.warn("App: Unknown view:", view, "- defaulting to auth");
          return (
            <div style={{ padding: '2rem', color: 'var(--text-primary, #000)', backgroundColor: 'var(--background-primary, #fff)' }}>
              <h1>Unknown View</h1>
              <p>View: {view}</p>
              <button onClick={() => { setView('auth'); setIsLoading(false); }} style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}>Go to Login</button>
            </div>
          );
      }
    } catch (renderError) {
      console.error("App: Error in renderContent switch:", renderError);
      return (
        <div style={{ 
          padding: '2rem', 
          color: '#ef4444',
          backgroundColor: '#fff',
          minHeight: '100vh'
        }}>
          <h1>Error Rendering Content</h1>
          <p>View: {view}</p>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>{renderError instanceof Error ? renderError.message : String(renderError)}</pre>
          <button onClick={() => { setView('auth'); setIsLoading(false); }} style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer', background: '#0d9488', color: 'white', border: 'none', borderRadius: '4px' }}>Reset to Login</button>
        </div>
      );
    }
  }

  console.log("App: About to render main component, isLoading:", isLoading, "view:", view, "user:", user);
  
  try {
    const content = renderContent();
    console.log("App: Content rendered successfully");
    
    return (
      <>
        {content}
        <SessionTimeoutModal isOpen={isWarningModalOpen} countdown={countdown} onStay={handleStay} onLogout={handleSignOut} />
      </>
    );
  } catch (error) {
    console.error("App: Error during render:", error);
    return (
      <div style={{ 
        padding: '2rem', 
        color: '#ef4444',
        backgroundColor: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1>Error rendering app</h1>
        <pre style={{ 
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          maxWidth: '600px',
          overflow: 'auto'
        }}>
          {error instanceof Error ? error.message : String(error)}
          {error instanceof Error && error.stack && (
            <>
              <br />
              <br />
              {error.stack}
            </>
          )}
        </pre>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }
};

export default App;
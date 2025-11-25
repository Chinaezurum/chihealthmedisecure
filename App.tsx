import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Auth from './pages/auth/Auth';
import SsoComplete from './pages/auth/SsoComplete';
import RegisterOrg from './pages/auth/RegisterOrg';
import ForgotPassword from './pages/auth/ForgotPassword';
import { AuthLayout } from './pages/auth/AuthLayout';
import { PricingPage } from './pages/auth/PricingPage';

// Lazy load heavy dashboards for code splitting
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const HealthcareWorkerDashboard = lazy(() => import('./pages/hcw/HealthcareWorkerDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const NurseDashboard = lazy(() => import('./pages/nurse/NurseDashboard'));
const PharmacistDashboard = lazy(() => import('./pages/pharmacist/PharmacistDashboard'));
const LabTechnicianDashboard = lazy(() => import('./pages/lab/LabTechnicianDashboard'));
const ReceptionistDashboard = lazy(() => import('./pages/receptionist/ReceptionistDashboard'));
const LogisticsDashboard = lazy(() => import('./pages/logistics/LogisticsDashboard'));
const CommandCenterDashboard = lazy(() => import('./pages/command-center/CommandCenterDashboard.tsx'));
// TEMPORARILY DISABLED: AccountantDashboard has circular dependency issues
// const AccountantDashboard = lazy(() => import('./pages/accountant/AccountantDashboard.tsx').then(m => ({ default: m.AccountantDashboard })));
const RadiologistDashboard = lazy(() => import('./pages/radiologist/RadiologistDashboard.tsx'));
const DieticianDashboard = lazy(() => import('./pages/dietician/DieticianDashboard.tsx'));
const ITDashboard = lazy(() => import('./pages/it/ITDashboard.tsx'));

import { FullScreenLoader } from './components/common/FullScreenLoader';
import { SessionTimeoutModal } from './components/common/SessionTimeoutModal';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { PwaUpdatePrompt } from './components/common/PwaUpdatePrompt';

import { User, Patient } from './types';
import * as api from './services/apiService';
import { useDarkMode } from './hooks/useDarkMode';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useWebSocket } from './hooks/useWebSocket';

// Create a QueryClient instance for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // Data is fresh for 1 minute
      gcTime: 300000, // Cache kept for 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: 1, // Only retry failed requests once
    },
  },
});

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
    
    // Wrap all dashboards in Suspense for lazy loading
    return (
      <Suspense fallback={<FullScreenLoader message="Loading dashboard..." />}>
        {(() => {
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
            case 'accountant':
              // TEMPORARILY DISABLED: Show maintenance message
              return (
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                  <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard Under Maintenance</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      The Accountant Dashboard is temporarily unavailable for maintenance. We're working to restore it shortly.
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              );
            case 'lab_technician':
              return <LabTechnicianDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
            case 'receptionist':
              return <ReceptionistDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
            case 'logistics':
              return <LogisticsDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
            case 'command_center':
              return <CommandCenterDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
            case 'radiologist':
              return <RadiologistDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
            case 'dietician':
              return <DieticianDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
            case 'it_support':
              return <ITDashboard user={user} onSignOut={handleSignOut} onSwitchOrganization={api.switchOrganization} theme={theme} toggleTheme={toggleTheme} />;
            default:
              return <div>Unknown user role. Please contact support.</div>;
          }
        })()}
      </Suspense>
    );
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
      <QueryClientProvider client={queryClient}>
        {content}
        <SessionTimeoutModal isOpen={isWarningModalOpen} countdown={countdown} onStay={handleStay} onLogout={handleSignOut} />
        <PwaInstallPrompt />
        <PwaUpdatePrompt />
      </QueryClientProvider>
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
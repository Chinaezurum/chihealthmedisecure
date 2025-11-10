import React, { useState, useRef, useEffect } from 'react';
import { LoginForm } from './LoginForm.tsx';
import { RegisterForm } from './RegisterForm.tsx';
import { SSOButton } from '../../components/common/SSOButton.tsx';
import { GoogleIcon, MicrosoftIcon } from '../../components/icons/index.tsx';
import * as authService from '../../services/authService.ts';
import * as api from '../../services/apiService.ts';
import { Patient, User } from '../../types.ts';
import { useToasts } from '../../hooks/useToasts.ts';

interface AuthFormProps {
    onSsoSuccess: (user: Partial<Patient>) => void;
    onForgotPassword: () => void;
    onAuthSuccess: (user: User) => void;
    initialTab?: 'login' | 'register';
}

type AuthView = 'login' | 'register';

export const AuthForm: React.FC<AuthFormProps> = ({ onSsoSuccess: _onSsoSuccess, onForgotPassword, onAuthSuccess, initialTab = 'login' }) => {
    const [view, setView] = useState<AuthView>(initialTab);
    const [isSsoLoading, setIsSsoLoading] = useState(false);
    const [formHeight, setFormHeight] = useState<number | undefined>(undefined);
    const formRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToasts();

    useEffect(() => {
        const formElement = formRef.current;
        if (!formElement) return;

        // Use ResizeObserver to automatically update height on content changes,
        // such as the password strength meter appearing.
        const resizeObserver = new ResizeObserver(() => {
            if (formRef.current) {
                setFormHeight(formRef.current.scrollHeight);
            }
        });

        resizeObserver.observe(formElement);

        // Set initial height
        setFormHeight(formElement.scrollHeight);

        // Cleanup observer on component unmount or when view changes
        return () => {
            if (formElement) {
                resizeObserver.unobserve(formElement);
            }
        };
    }, [view]); // Rerun when the view changes to attach the observer to the new form content

    // Probe backend health to show a friendly warning if API proxy is down
    const [backendHealthy, setBackendHealthy] = React.useState<boolean | null>(null);
    useEffect(() => {
        let mounted = true;

        const probeHealth = async () => {
                const timeoutMs = 3000; // Increased timeout
                const tryFetchWithTimeout = async (probeUrl: string) => {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), timeoutMs);
                    try {
                        const res = await fetch(probeUrl, { 
                            signal: controller.signal,
                            mode: 'cors',
                            credentials: 'omit'
                        });
                        clearTimeout(id);
                        return res;
                    } catch (err) {
                        clearTimeout(id);
                        throw err;
                    }
                };

                // Candidate probe URLs (order matters): proxied path first, then configured backend, then origin
                const normalizedApiBase = api.API_BASE_URL.replace(/\/$/, '');
                const originBase = window.location.origin.replace(/\/$/, '');
                const localLoopbacks = ['localhost', '127.0.0.1', '::1'];
                const loopbackCandidates: string[] = [];
                if (localLoopbacks.includes(window.location.hostname)) {
                    loopbackCandidates.push('http://localhost:8080/api/health', 'http://127.0.0.1:8080/api/health');
                }

                const candidates = [
                    '/api/health',
                    `${normalizedApiBase}/api/health`,
                    `${originBase}/api/health`,
                    ...loopbackCandidates
                ].filter((value, index, self) => self.indexOf(value) === index);

                let lastError: Error | null = null;
                try {
                    for (const url of candidates) {
                        if (!mounted) return;
                        try {
                            const res = await tryFetchWithTimeout(url);

                            // If the endpoint exists and returns 2xx, mark healthy and stop
                            if (res && res.ok) {
                                if (!mounted) return;
                                setBackendHealthy(true);
                                return;
                            }

                            // If 404 or other non-OK, try the next candidate instead of failing immediately
                            continue;
                        } catch (err) {
                            // Track the last error but continue trying other candidates
                            lastError = err as Error;
                            // network error or timeout -> try next candidate
                            continue;
                        }
                    }

                    // Only mark as unhealthy if we got network errors (not just 404s)
                    // This prevents false positives when the health endpoint doesn't exist but backend is running
                    if (mounted && lastError) {
                        // Check if it's a real network error (not just a 404)
                        const isNetworkError = lastError.name === 'AbortError' || 
                                             lastError.message.includes('fetch') ||
                                             lastError.message.includes('Failed to fetch') ||
                                             lastError.message.includes('NetworkError');
                        if (isNetworkError) {
                            setBackendHealthy(false);
                        } else {
                            // If we got here but no network errors, backend might be reachable
                            // Set to null (unknown) rather than false to avoid false warnings
                            setBackendHealthy(null);
                        }
                    } else if (mounted) {
                        // No errors but no successful response - set to null (unknown)
                        setBackendHealthy(null);
                    }
                } catch (err) {
                    // Only set to false if we have a clear network error
                    if (mounted) {
                        const error = err as Error;
                        if (error.message.includes('fetch') || error.name === 'TypeError') {
                            setBackendHealthy(false);
                        } else {
                            setBackendHealthy(null);
                        }
                    }
                }
            };

        // Delay the health check slightly to avoid race conditions on page load
        const timeoutId = setTimeout(() => {
            probeHealth();
        }, 500);

        return () => { 
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    const handleSsoLogin = async (provider: 'Google') => {
        setIsSsoLoading(true);
        try {
            await authService.signInWithSso(provider);
            // The browser will be redirected, so we don't need to do anything else here.
            // The loading state will be reset if the user navigates back.
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown SSO error occurred.';
            addToast(message, 'error');
            setIsSsoLoading(false);
        }
    };
    
    return (
        <div className="auth-card">
             <div className="auth-tabs">
                <button onClick={() => setView('login')} className={`auth-tab ${view === 'login' ? 'active' : ''}`}>
                    Sign In
                </button>
                <button onClick={() => setView('register')} className={`auth-tab ${view === 'register' ? 'active' : ''}`}>
                    Create Account
                </button>
            </div>

            <div className="auth-form-wrapper" style={{ height: formHeight }}>
                {backendHealthy === false && (
                    <div className="text-sm text-red-600 mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <strong>Connection issue:</strong> The backend API appears unreachable. Please ensure the backend server is running on port 8080.
                        <br />
                        <small className="text-xs mt-1 block">You can start it with: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npm run dev:backend</code> or <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">npm run dev:all</code></small>
                    </div>
                )}
                <div ref={formRef}>
                {view === 'login' ? (
                    <LoginForm onForgotPassword={onForgotPassword} onAuthSuccess={onAuthSuccess} />
                ) : (
                    <RegisterForm 
                        onSuccess={() => {
                            addToast('Registration successful! Please sign in.', 'success');
                            setView('login');
                        }}
                    />
                )}
                </div>
            </div>

            <div className="auth-card__divider">
                <span>Or continue with</span>
            </div>

            <div className="sso-providers">
                <SSOButton providerName="Google" onClick={() => handleSsoLogin('Google')} isLoading={isSsoLoading}><GoogleIcon /></SSOButton>
                <SSOButton providerName="Microsoft" disabled><MicrosoftIcon /></SSOButton>
            </div>
        </div>
    );
};
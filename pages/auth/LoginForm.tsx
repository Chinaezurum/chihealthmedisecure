import React, { useState } from 'react';
import { Input } from '../../components/common/Input.tsx';
import { Button } from '../../components/common/Button.tsx';
import * as authService from '../../services/authService.ts';
import * as mfaService from '../../services/mfaService.ts';
import * as api from '../../services/apiService.ts';
import { User } from '../../types.ts';
// KeyIcon removed from login form UI

interface LoginFormProps {
    onForgotPassword: () => void;
    onAuthSuccess: (user: User) => void;
    onMfaRequired?: (user: User, token: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword, onAuthSuccess, onMfaRequired }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { user, token } = await authService.signInWithEmail(credentials.email, credentials.password);
            
            // Check if MFA is required (production environment)
            const mfaRequired = mfaService.isMfaRequired();
            const userHasMfa = mfaService.isMfaEnabled(user);
            
            // In production, enforce MFA for all users
            if (mfaRequired && !userHasMfa) {
                // User must set up MFA before proceeding
                setError('Two-factor authentication is required. Please set up MFA to continue.');
                if (onMfaRequired) {
                    onMfaRequired(user, token);
                }
                setIsLoading(false);
                return;
            }
            
            // If user has MFA enabled, require verification
            if (userHasMfa) {
                // Don't set the auth token yet - wait for MFA verification
                if (onMfaRequired) {
                    onMfaRequired(user, token);
                }
                setIsLoading(false);
                return;
            }
            
            // No MFA required (dev environment only)
            api.setAuthToken(token);
            onAuthSuccess(user);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="auth-form-body">
            <div className="form-field-container">
                <Input name="email" type="email" label="Email Address" value={credentials.email} onChange={handleChange} autoComplete="email" required />
            </div>
            <div className="form-field-container">
                <Input name="password" type="password" label="Password" value={credentials.password} onChange={handleChange} autoComplete="current-password" required />
            </div>

            {error && <p className="form-error-text text-center">{error}</p>}
            
            {mfaService.isMfaRequired() && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-700 dark:text-blue-400 text-center">
                        🔒 Two-factor authentication is required for all accounts in production
                    </p>
                </div>
            )}
            
            <Button type="submit" isLoading={isLoading} fullWidth>
                Sign In
            </Button>
            
            <div className="text-center mt-4">
                <button type="button" onClick={onForgotPassword} className="auth-card__link">
                    Forgot password?
                </button>
            </div>
        </form>
    );
};

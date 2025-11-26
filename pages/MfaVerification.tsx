import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import * as mfaService from '../services/mfaService';
import * as apiService from '../services/apiService';
import { User } from '../types';
import { ShieldCheckIcon, KeyIcon } from '../components/icons';

// Fingerprint icon placeholder
const FingerprintIcon = ShieldCheckIcon;

interface MfaVerificationProps {
  pendingUser?: User;
  pendingToken?: string;
  onSuccess: (user: User) => void;
  onCancel?: () => void;
}

const MfaVerification: React.FC<MfaVerificationProps> = ({ pendingUser, onSuccess, onCancel }) => {
  const [verificationMethod, setVerificationMethod] = useState<'totp' | 'webauthn' | 'backup' | 'security_questions'>('totp');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [user] = useState<User | undefined>(pendingUser);
  const [securityQuestions, setSecurityQuestions] = useState<Array<{ questionId: string; answer: string }>>([]);

  useEffect(() => {
    // Check if biometrics are supported
    setBiometricSupported(mfaService.isWebAuthnSupported());

    // Auto-trigger appropriate MFA method based on user's preference
    if (user?.mfaMethod === 'webauthn' && mfaService.isWebAuthnSupported()) {
      setVerificationMethod('webauthn');
      handleBiometricAuth();
    } else if (user?.mfaMethod === 'security_questions') {
      setVerificationMethod('security_questions');
      loadSecurityQuestions();
    }
  }, [user]);

  const handleBiometricAuth = async () => {
    if (!user) {
      setError('User information not available');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Start WebAuthn authentication
      const options = await mfaService.startWebAuthnAuthentication(user.id);
      
      // Request biometric authentication from browser
      const credential = await navigator.credentials.get({
        publicKey: options
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Biometric authentication cancelled');
      }

      // Complete authentication
      const result = await mfaService.completeWebAuthnAuthentication(user.id, credential);

      if (result.success && result.token) {
        apiService.setAuthToken(result.token);
        onSuccess(user);
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
      setError(err instanceof Error ? err.message : 'Biometric authentication failed. Please try another method.');
      setVerificationMethod('totp'); // Fallback to TOTP
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecurityQuestions = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // Fetch user's configured question IDs
      const response = await fetch(`${apiService.API_BASE_URL}/api/mfa/security-questions/${user.id}`, {
        headers: {
          'x-csrf-token': apiService.getCsrfToken() || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load security questions');
      }

      const data = await response.json();
      
      // Initialize empty answers for each question
      setSecurityQuestions(data.questionIds.map((qId: string) => ({
        questionId: qId,
        answer: ''
      })));
    } catch (err) {
      console.error('Load security questions error:', err);
      setError('Failed to load security questions. Please try another method.');
      setVerificationMethod('backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('User information not available');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await mfaService.verifySecurityQuestions(user.id, securityQuestions);
      
      if (result.success) {
        // Create a mock token - this should come from the backend in production
        const mockToken = 'mfa-verified-' + Date.now();
        apiService.setAuthToken(mockToken);
        onSuccess(user);
      } else {
        throw new Error('Incorrect answers');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityAnswerChange = (index: number, value: string) => {
    const updated = [...securityQuestions];
    updated[index].answer = value;
    setSecurityQuestions(updated);
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('User information not available');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await mfaService.verifyTotp(user.id, code);
      
      if (result.success && result.token) {
        apiService.setAuthToken(result.token);
        onSuccess(user);
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('User information not available');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await mfaService.verifyBackupCode(user.id, code);
      
      if (result.success && result.token) {
        apiService.setAuthToken(result.token);
        onSuccess(user);
      } else {
        throw new Error('Invalid backup code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid backup code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="auth-card w-full max-w-md">
          <div className="text-center">
            <p className="text-text-secondary">Session expired. Please log in again.</p>
            <Button onClick={onCancel || (() => {})} className="mt-4">
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="auth-card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-text-secondary">
            Please verify your identity to continue
          </p>
        </div>

        {/* Method Selection */}
        <div className="flex gap-2 mb-6">
          {(user?.mfaMethod === 'totp' || user?.mfaMethod === 'both') && (
            <button
              onClick={() => {
                setVerificationMethod('totp');
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                verificationMethod === 'totp'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <KeyIcon className="w-5 h-5 inline-block mr-2" />
              Authenticator
            </button>
          )}
          {biometricSupported && (user?.mfaMethod === 'webauthn' || user?.mfaMethod === 'both') && (
            <button
              onClick={() => {
                setVerificationMethod('webauthn');
                setError('');
                handleBiometricAuth();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                verificationMethod === 'webauthn'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <FingerprintIcon className="w-5 h-5 inline-block mr-2" />
              Biometric
            </button>
          )}
          {user?.mfaMethod === 'security_questions' && (
            <button
              onClick={() => {
                setVerificationMethod('security_questions');
                setError('');
                loadSecurityQuestions();
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                verificationMethod === 'security_questions'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <ShieldCheckIcon className="w-5 h-5 inline-block mr-2" />
              Questions
            </button>
          )}
        </div>

        {/* TOTP Verification */}
        {verificationMethod === 'totp' && (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <div>
              <Input
                label="Verification Code"
                name="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-text-secondary mt-1">
                Enter the code from your authenticator app
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Verify
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setVerificationMethod('backup');
                  setCode('');
                  setError('');
                }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Use backup code instead
              </button>
            </div>
          </form>
        )}

        {/* WebAuthn Verification */}
        {verificationMethod === 'webauthn' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <FingerprintIcon className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4" />
              {isLoading ? (
                <p className="text-text-secondary">
                  Waiting for biometric authentication...
                </p>
              ) : (
                <>
                  <p className="text-text-secondary mb-4">
                    Use your fingerprint, face, or security key
                  </p>
                  <Button onClick={handleBiometricAuth} isLoading={isLoading}>
                    Authenticate
                  </Button>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setVerificationMethod('totp');
                  setError('');
                }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Use authenticator code instead
              </button>
            </div>
          </div>
        )}

        {/* Backup Code Verification */}
        {verificationMethod === 'backup' && (
          <form onSubmit={handleBackupCodeSubmit} className="space-y-4">
            <div>
              <Input
                label="Backup Code"
                name="backupCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter backup code"
                required
                autoFocus
              />
              <p className="text-xs text-text-secondary mt-1">
                Enter one of your backup recovery codes
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Verify
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setVerificationMethod('totp');
                  setCode('');
                  setError('');
                }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Back to authenticator
              </button>
            </div>
          </form>
        )}

        {/* Security Questions Verification */}
        {verificationMethod === 'security_questions' && (
          <form onSubmit={handleSecurityQuestionsSubmit} className="space-y-4">
            <p className="text-sm text-text-secondary mb-4">
              Please answer your security questions to verify your identity
            </p>

            {isLoading && securityQuestions.length === 0 ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-sm text-text-secondary mt-2">Loading your questions...</p>
              </div>
            ) : (
              securityQuestions.map((sq, index) => {
                const question = mfaService.SECURITY_QUESTIONS.find(q => q.id === sq.questionId);
                return (
                  <div key={index}>
                    <Input
                      label={question?.question || `Question ${index + 1}`}
                      name={`security-answer-${index}`}
                      type="text"
                      value={sq.answer}
                      onChange={(e) => handleSecurityAnswerChange(index, e.target.value)}
                      placeholder="Your answer"
                      required
                      autoFocus={index === 0}
                    />
                  </div>
                );
              })
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading} disabled={securityQuestions.length === 0}>
              Verify
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setVerificationMethod('backup');
                  setError('');
                }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Use backup code instead
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Having trouble?{' '}
            <a href="/support" className="text-primary-600 dark:text-primary-400 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MfaVerification;

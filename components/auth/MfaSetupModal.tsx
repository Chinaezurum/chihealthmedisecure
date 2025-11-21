import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import * as mfaService from '../../services/mfaService.ts';
import { User } from '../../types.ts';
import { KeyIcon, CheckIcon, ShieldCheckIcon } from '../icons/index.tsx';

interface MfaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess?: () => void;
}

type SetupStep = 'method' | 'totp-setup' | 'totp-verify' | 'webauthn-setup' | 'backup-codes' | 'complete';

export const MfaSetupModal: React.FC<MfaSetupModalProps> = ({ isOpen, onClose, user, onSuccess }) => {
    const [step, setStep] = useState<SetupStep>('method');
    // Fingerprint icon placeholder
    const FingerprintIcon = ShieldCheckIcon;
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [biometricSupported, setBiometricSupported] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);

    useEffect(() => {
        setBiometricSupported(mfaService.isWebAuthnSupported());
    }, []);

    const handleMethodSelect = (method: 'totp' | 'webauthn') => {
        if (method === 'totp') {
            startTotpSetup();
        } else {
            startWebAuthnSetup();
        }
    };

    const startTotpSetup = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await mfaService.setupTotp(user.id);
            setQrCodeUrl(response.qrCodeUrl || '');
            setSecret(response.secret || '');
            setStep('totp-setup');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to setup authenticator');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTotpVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await mfaService.verifyTotpSetup(user.id, verificationCode, secret);
            if (result.success) {
                setBackupCodes(result.backupCodes);
                setStep('backup-codes');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid verification code');
        } finally {
            setIsLoading(false);
        }
    };

    const startWebAuthnSetup = async () => {
        if (!mfaService.isWebAuthnSupported()) {
            setError('Biometric authentication is not supported on this device');
            return;
        }

        setIsLoading(true);
        setError('');
        setStep('webauthn-setup');

        try {
            // Get credential creation options from server
            const options = await mfaService.startWebAuthnRegistration(user.id, user.name, user.email);
            
            // Request credential from browser (triggers biometric prompt)
            const credential = await navigator.credentials.create({
                publicKey: options
            }) as PublicKeyCredential;

            if (!credential) {
                throw new Error('Biometric enrollment cancelled');
            }

            // Complete registration with server
            const result = await mfaService.completeWebAuthnRegistration(
                user.id,
                credential,
                getDeviceName()
            );

            if (result.success) {
                setBackupCodes(result.backupCodes);
                setStep('backup-codes');
            }
        } catch (err) {
            console.error('WebAuthn setup error:', err);
            setError(err instanceof Error ? err.message : 'Biometric enrollment failed');
            setStep('method');
        } finally {
            setIsLoading(false);
        }
    };

    const getDeviceName = (): string => {
        const ua = navigator.userAgent;
        if (ua.includes('iPhone')) return 'iPhone';
        if (ua.includes('iPad')) return 'iPad';
        if (ua.includes('Android')) return 'Android Device';
        if (ua.includes('Mac')) return 'Mac';
        if (ua.includes('Windows')) return 'Windows PC';
        return 'Unknown Device';
    };

    const handleCopyBackupCodes = () => {
        const codesText = backupCodes.join('\n');
        navigator.clipboard.writeText(codesText);
        setCopiedCodes(true);
        setTimeout(() => setCopiedCodes(false), 2000);
    };

    const handleComplete = () => {
        setStep('complete');
        setTimeout(() => {
            onSuccess?.();
            onClose();
            // Reset state
            setStep('method');
            setError('');
            setVerificationCode('');
            setBackupCodes([]);
            setCopiedCodes(false);
        }, 2000);
    };

    const renderMethodSelection = () => (
        <div className="space-y-4">
            <p className="text-sm text-text-secondary">
                Choose how you'd like to secure your account with two-factor authentication:
            </p>

            {/* TOTP Option */}
            <button
                onClick={() => handleMethodSelect('totp')}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
            >
                <div className="flex items-start gap-3">
                    <KeyIcon className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-text-primary mb-1">Authenticator App</h4>
                        <p className="text-sm text-text-secondary">
                            Use apps like Google Authenticator, Authy, or 1Password to generate verification codes
                        </p>
                    </div>
                </div>
            </button>

            {/* WebAuthn Option */}
            <button
                onClick={() => handleMethodSelect('webauthn')}
                disabled={!biometricSupported}
                className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                    biometricSupported
                        ? 'border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500'
                        : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                }`}
            >
                <div className="flex items-start gap-3">
                    <FingerprintIcon className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-text-primary mb-1">
                            Biometric Authentication
                            {!biometricSupported && (
                                <span className="ml-2 text-xs font-normal text-text-tertiary">(Not Available)</span>
                            )}
                        </h4>
                        <p className="text-sm text-text-secondary">
                            Use fingerprint, facial recognition, or security keys for passwordless authentication
                        </p>
                    </div>
                </div>
            </button>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}
        </div>
    );

    const renderTotpSetup = () => (
        <div className="space-y-4">
            <p className="text-sm text-text-secondary">
                1. Scan this QR code with your authenticator app
            </p>
            <div className="flex justify-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
            </div>
            <div className="text-center">
                <p className="text-sm text-text-secondary mb-2">
                    Can't scan? Enter this setup key manually:
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm break-all">
                    {secret}
                </div>
            </div>
            <Button onClick={() => setStep('totp-verify')} fullWidth>
                Continue
            </Button>
        </div>
    );

    const renderTotpVerify = () => (
        <form onSubmit={handleTotpVerify} className="space-y-4">
            <p className="text-sm text-text-secondary">
                2. Enter the 6-digit code from your authenticator app to verify
            </p>
            <Input
                label="Verification Code"
                name="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                autoFocus
            />
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}
            <div className="flex gap-2">
                <Button type="button" onClick={() => setStep('totp-setup')} fullWidth>
                    Back
                </Button>
                <Button type="submit" isLoading={isLoading} fullWidth>
                    Verify & Enable
                </Button>
            </div>
        </form>
    );

    const renderWebAuthnSetup = () => (
        <div className="space-y-4">
            <div className="text-center py-6">
                <FingerprintIcon className="w-16 h-16 mx-auto text-primary-600 dark:text-primary-400 mb-4" />
                {isLoading ? (
                    <>
                        <h4 className="font-semibold text-text-primary mb-2">
                            Follow your device's prompts
                        </h4>
                        <p className="text-sm text-text-secondary">
                            Use your fingerprint, face, or security key to complete enrollment
                        </p>
                    </>
                ) : (
                    <>
                        <h4 className="font-semibold text-text-primary mb-2">Ready to enroll</h4>
                        <p className="text-sm text-text-secondary mb-4">
                            Click below to start biometric enrollment
                        </p>
                        <Button onClick={startWebAuthnSetup} isLoading={isLoading}>
                            Start Enrollment
                        </Button>
                    </>
                )}
            </div>
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}
        </div>
    );

    const renderBackupCodes = () => (
        <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                    Save Your Backup Codes
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-500">
                    Store these codes in a safe place. You can use them to access your account if you lose your authentication device.
                </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                        <div key={index} className="bg-white dark:bg-gray-900 rounded px-3 py-2 text-center">
                            {code}
                        </div>
                    ))}
                </div>
            </div>

            <Button
                onClick={handleCopyBackupCodes}
                fullWidth
                className="flex items-center justify-center gap-2"
            >
                {copiedCodes ? (
                    <>
                        <CheckIcon className="w-5 h-5" />
                        Copied!
                    </>
                ) : (
                    <>
                        Copy All Codes
                    </>
                )}
            </Button>

            <Button onClick={handleComplete} fullWidth>
                I've Saved My Codes
            </Button>
        </div>
    );

    const renderComplete = () => (
        <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-xl font-semibold text-text-primary mb-2">
                MFA Enabled Successfully!
            </h4>
            <p className="text-text-secondary">
                Your account is now protected with two-factor authentication
            </p>
        </div>
    );

    const getTitle = () => {
        switch (step) {
            case 'method': return 'Set Up Two-Factor Authentication';
            case 'totp-setup': return 'Scan QR Code';
            case 'totp-verify': return 'Verify Setup';
            case 'webauthn-setup': return 'Biometric Enrollment';
            case 'backup-codes': return 'Backup Recovery Codes';
            case 'complete': return 'Setup Complete';
            default: return 'MFA Setup';
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={step === 'complete' ? onClose : () => {
                if (step === 'method') {
                    onClose();
                } else {
                    setStep('method');
                    setError('');
                }
            }} 
            title={getTitle()}
            footer={step === 'complete' ? undefined : (
                step === 'method' ? (
                    <Button onClick={onClose}>Cancel</Button>
                ) : null
            )}
        >
            {step === 'method' && renderMethodSelection()}
            {step === 'totp-setup' && renderTotpSetup()}
            {step === 'totp-verify' && renderTotpVerify()}
            {step === 'webauthn-setup' && renderWebAuthnSetup()}
            {step === 'backup-codes' && renderBackupCodes()}
            {step === 'complete' && renderComplete()}
        </Modal>
    );
};

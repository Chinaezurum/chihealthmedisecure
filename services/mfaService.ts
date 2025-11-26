/**
 * MFA Service - Multi-Factor Authentication with Biometric Support
 * Supports TOTP, WebAuthn (biometrics, facial recognition), backup codes, and security questions
 */

import { User } from '../types';
import * as apiService from './apiService';

export type MfaMethod = 'totp' | 'webauthn' | 'backup_code' | 'security_questions';

export interface MfaSetupResponse {
  secret?: string; // For TOTP
  qrCodeUrl?: string; // For TOTP
  backupCodes?: string[]; // Backup recovery codes
  credentialId?: string; // For WebAuthn
  securityQuestions?: SecurityQuestion[]; // For security questions
}

export interface SecurityQuestion {
  id: string;
  question: string;
}

export interface SecurityQuestionAnswer {
  questionId: string;
  answer: string;
}

export const SECURITY_QUESTIONS: SecurityQuestion[] = [
  { id: 'mother_maiden', question: "What is your mother's maiden name?" },
  { id: 'first_pet', question: 'What was the name of your first pet?' },
  { id: 'birth_city', question: 'In what city were you born?' },
  { id: 'first_school', question: 'What was the name of your first school?' },
  { id: 'favorite_teacher', question: "What was your favorite teacher's name?" },
  { id: 'first_car', question: 'What was the make of your first car?' },
  { id: 'childhood_nickname', question: 'What was your childhood nickname?' },
  { id: 'first_job', question: 'Where did you work your first job?' },
];

export interface WebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceName?: string;
  createdAt: string;
  lastUsed?: string;
}

/**
 * Check if user has MFA enabled
 */
export const isMfaEnabled = (user: User): boolean => {
  return user.mfaEnabled === true;
};

/**
 * Check if MFA is required (production environment)
 * TEMPORARILY DISABLED FOR DEVELOPMENT
 */
export const isMfaRequired = (): boolean => {
  return false; // Temporarily disabled for development
  // return import.meta.env.PROD || import.meta.env.VITE_ENFORCE_MFA === 'true';
};

/**
 * Initialize TOTP-based MFA setup
 * Returns secret and QR code URL for authenticator apps
 */
export const setupTotp = async (userId: string): Promise<MfaSetupResponse> => {
  try {
    const response = await apiService.apiRequest<MfaSetupResponse>(
      `/api/mfa/setup/totp`,
      'POST',
      { userId }
    );
    return response;
  } catch (error) {
    console.error('TOTP setup error:', error);
    throw new Error('Failed to setup TOTP authentication');
  }
};

/**
 * Verify TOTP code during setup
 */
export const verifyTotpSetup = async (
  userId: string,
  code: string,
  secret: string
): Promise<{ success: boolean; backupCodes: string[] }> => {
  try {
    const response = await apiService.apiRequest<{ success: boolean; backupCodes: string[] }>(
      `/api/mfa/verify/totp-setup`,
      'POST',
      { userId, code, secret }
    );
    return response;
  } catch (error) {
    console.error('TOTP verification error:', error);
    throw new Error('Invalid verification code');
  }
};

/**
 * Check if WebAuthn (biometrics/facial recognition) is supported
 */
export const isWebAuthnSupported = (): boolean => {
  return !!(
    window.PublicKeyCredential &&
    navigator.credentials &&
    navigator.credentials.create
  );
};

/**
 * Start WebAuthn registration (biometric enrollment)
 * Returns credential options for the browser
 */
export const startWebAuthnRegistration = async (
  userId: string,
  userName: string,
  userEmail: string
): Promise<PublicKeyCredentialCreationOptions> => {
  try {
    const response = await apiService.apiRequest<{ options: PublicKeyCredentialCreationOptions }>(
      `/api/mfa/setup/webauthn/start`,
      'POST',
      { userId, userName, userEmail }
    );
    
    // Convert base64 strings back to ArrayBuffer
    return {
      ...response.options,
      challenge: base64ToArrayBuffer(response.options.challenge as any),
      user: {
        ...response.options.user,
        id: base64ToArrayBuffer(response.options.user.id as any)
      }
    };
  } catch (error) {
    console.error('WebAuthn registration start error:', error);
    throw new Error('Failed to start biometric registration');
  }
};

/**
 * Complete WebAuthn registration
 */
export const completeWebAuthnRegistration = async (
  userId: string,
  credential: PublicKeyCredential,
  deviceName?: string
): Promise<{ success: boolean; credentialId: string; backupCodes: string[] }> => {
  try {
    const credentialJSON = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64((credential.response as any).clientDataJSON),
        attestationObject: arrayBufferToBase64((credential.response as any).attestationObject)
      },
      type: credential.type
    };

    const response = await apiService.apiRequest<{ success: boolean; credentialId: string; backupCodes: string[] }>(
      `/api/mfa/setup/webauthn/complete`,
      'POST',
      { userId, credential: credentialJSON, deviceName }
    );
    
    return response;
  } catch (error) {
    console.error('WebAuthn registration complete error:', error);
    throw new Error('Failed to complete biometric registration');
  }
};

/**
 * Start WebAuthn authentication (biometric verification)
 */
export const startWebAuthnAuthentication = async (
  userId: string
): Promise<PublicKeyCredentialRequestOptions> => {
  try {
    const response = await apiService.apiRequest<{ options: PublicKeyCredentialRequestOptions }>(
      `/api/mfa/verify/webauthn/start`,
      'POST',
      { userId }
    );
    
    // Convert base64 strings back to ArrayBuffer
    return {
      ...response.options,
      challenge: base64ToArrayBuffer(response.options.challenge as any),
      allowCredentials: response.options.allowCredentials?.map(cred => ({
        ...cred,
        id: base64ToArrayBuffer(cred.id as any)
      }))
    };
  } catch (error) {
    console.error('WebAuthn authentication start error:', error);
    throw new Error('Failed to start biometric authentication');
  }
};

/**
 * Complete WebAuthn authentication
 */
export const completeWebAuthnAuthentication = async (
  userId: string,
  credential: PublicKeyCredential
): Promise<{ success: boolean; token?: string }> => {
  try {
    const credentialJSON = {
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64((credential.response as any).clientDataJSON),
        authenticatorData: arrayBufferToBase64((credential.response as any).authenticatorData),
        signature: arrayBufferToBase64((credential.response as any).signature),
        userHandle: (credential.response as any).userHandle 
          ? arrayBufferToBase64((credential.response as any).userHandle)
          : null
      },
      type: credential.type
    };

    const response = await apiService.apiRequest<{ success: boolean; token?: string }>(
      `/api/mfa/verify/webauthn/complete`,
      'POST',
      { userId, credential: credentialJSON }
    );
    
    return response;
  } catch (error) {
    console.error('WebAuthn authentication complete error:', error);
    throw new Error('Biometric authentication failed');
  }
};

/**
 * Verify TOTP code during login
 */
export const verifyTotp = async (
  userId: string,
  code: string
): Promise<{ success: boolean; token?: string }> => {
  try {
    const response = await apiService.apiRequest<{ success: boolean; token?: string }>(
      `/api/mfa/verify/totp`,
      'POST',
      { userId, code }
    );
    return response;
  } catch (error) {
    console.error('TOTP verification error:', error);
    throw new Error('Invalid verification code');
  }
};

/**
 * Verify backup code during login
 */
export const verifyBackupCode = async (
  userId: string,
  code: string
): Promise<{ success: boolean; token?: string }> => {
  try {
    const response = await apiService.apiRequest<{ success: boolean; token?: string }>(
      `/api/mfa/verify/backup-code`,
      'POST',
      { userId, code }
    );
    return response;
  } catch (error) {
    console.error('Backup code verification error:', error);
    throw new Error('Invalid backup code');
  }
};

/**
 * Get user's registered WebAuthn credentials
 */
export const getWebAuthnCredentials = async (
  userId: string
): Promise<WebAuthnCredential[]> => {
  try {
    const response = await apiService.apiRequest<{ credentials: WebAuthnCredential[] }>(
      `/api/mfa/credentials/${userId}`,
      'GET'
    );
    return response.credentials;
  } catch (error) {
    console.error('Get credentials error:', error);
    return [];
  }
};

/**
 * Remove a WebAuthn credential
 */
export const removeWebAuthnCredential = async (
  userId: string,
  credentialId: string
): Promise<{ success: boolean }> => {
  try {
    const response = await apiService.apiRequest<{ success: boolean }>(
      `/api/mfa/credentials/${credentialId}`,
      'DELETE',
      { userId }
    );
    return response;
  } catch (error) {
    console.error('Remove credential error:', error);
    throw new Error('Failed to remove credential');
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (
  userId: string
): Promise<{ backupCodes: string[] }> => {
  try {
    const response = await apiService.apiRequest<{ backupCodes: string[] }>(
      `/api/mfa/backup-codes/regenerate`,
      'POST',
      { userId }
    );
    return response;
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    throw new Error('Failed to regenerate backup codes');
  }
};

/**
 * Disable MFA (requires password confirmation)
 */
export const disableMfa = async (
  userId: string,
  password: string
): Promise<{ success: boolean }> => {
  try {
    const response = await apiService.apiRequest<{ success: boolean }>(
      `/api/mfa/disable`,
      'POST',
      { userId, password }
    );
    return response;
  } catch (error) {
    console.error('Disable MFA error:', error);
    throw new Error('Failed to disable MFA');
  }
};

/**
 * Setup security questions for MFA
 */
export const setupSecurityQuestions = async (
  userId: string,
  answers: SecurityQuestionAnswer[]
): Promise<{ success: boolean }> => {
  try {
    const response = await apiService.apiRequest<{ success: boolean }>(
      `/api/mfa/setup/security-questions`,
      'POST',
      { userId, answers }
    );
    return response;
  } catch (error) {
    console.error('Setup security questions error:', error);
    throw new Error('Failed to setup security questions');
  }
};

/**
 * Verify security questions for MFA
 */
export const verifySecurityQuestions = async (
  userId: string,
  answers: SecurityQuestionAnswer[]
): Promise<{ success: boolean }> => {
  try {
    const response = await apiService.apiRequest<{ success: boolean }>(
      `/api/mfa/verify/security-questions`,
      'POST',
      { userId, answers }
    );
    return response;
  } catch (error) {
    console.error('Verify security questions error:', error);
    throw new Error('Failed to verify security questions');
  }
};

// Utility functions for WebAuthn ArrayBuffer conversions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

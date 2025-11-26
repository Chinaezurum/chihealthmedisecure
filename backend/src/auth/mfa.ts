/**
 * MFA Backend Routes - Multi-Factor Authentication with Biometric Support
 * Supports TOTP (Time-based One-Time Password) and WebAuthn (biometrics, facial recognition)
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import * as db from '../db.js';

const router = Router();

// Configure TOTP
authenticator.options = { window: 1 }; // Allow 30 second window

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Hash backup code for storage
 */
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Setup TOTP - Generate secret and QR code
 */
router.post('/setup/totp',
  body('userId').not().isEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    try {
      const { userId } = req.body;

      // Generate TOTP secret
      const secret = authenticator.generateSecret();
      
      // Get user for label
      const user = await db.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate otpauth URL for QR code
      const otpauthUrl = authenticator.keyuri(
        user.email,
        'ChiHealth MediSecure',
        secret
      );

      // Generate QR code URL (using a QR code service)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpauthUrl)}`;

      return res.json({
        secret,
        qrCodeUrl,
        otpauthUrl
      });
    } catch (error: any) {
      console.error('TOTP setup error:', error);
      return res.status(500).json({ message: 'Failed to setup TOTP' });
    }
  }
);

/**
 * Verify TOTP setup - Confirm code and enable MFA
 */
router.post('/verify/totp-setup',
  body('userId').not().isEmpty(),
  body('code').isLength({ min: 6, max: 6 }),
  body('secret').not().isEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    try {
      const { userId, code, secret } = req.body;

      // Verify the code
      const isValid = authenticator.verify({ token: code, secret });
      
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes();
      const hashedCodes = backupCodes.map(code => hashBackupCode(code));

      // Save MFA settings to user (in real app, update database)
      await db.updateUserMfa(userId, {
        mfaEnabled: true,
        mfaMethod: 'totp',
        mfaSecret: secret, // In production, encrypt this
        backupCodes: hashedCodes,
        mfaEnrolledAt: new Date().toISOString()
      });

      return res.json({
        success: true,
        backupCodes // Return unhashed codes to user once
      });
    } catch (error: any) {
      console.error('TOTP verification error:', error);
      return res.status(500).json({ message: 'Failed to verify TOTP' });
    }
  }
);

/**
 * Verify TOTP during login
 */
router.post('/verify/totp',
  body('userId').not().isEmpty(),
  body('code').isLength({ min: 6, max: 6 }),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    try {
      const { userId, code } = req.body;

      const user = await db.getUserById(userId);
      if (!user || !user.mfaSecret) {
        return res.status(404).json({ message: 'MFA not configured' });
      }

      // Verify the code
      const isValid = authenticator.verify({ 
        token: code, 
        secret: user.mfaSecret 
      });

      if (!isValid) {
        return res.status(401).json({ message: 'Invalid verification code' });
      }

      // Generate JWT token
      const { generateToken } = await import('./auth.js');
      const token = generateToken(user.id, user.currentOrganization.id);

      return res.json({
        success: true,
        token
      });
    } catch (error: any) {
      console.error('TOTP verification error:', error);
      return res.status(500).json({ message: 'Verification failed' });
    }
  }
);

/**
 * Verify backup code during login
 */
router.post('/verify/backup-code',
  body('userId').not().isEmpty(),
  body('code').not().isEmpty(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    try {
      const { userId, code } = req.body;

      const user = await db.getUserById(userId);
      if (!user || !user.backupCodes || user.backupCodes.length === 0) {
        return res.status(404).json({ message: 'No backup codes available' });
      }

      // Hash the provided code
      const hashedCode = hashBackupCode(code);

      // Check if code exists
      const codeIndex = user.backupCodes.indexOf(hashedCode);
      if (codeIndex === -1) {
        return res.status(401).json({ message: 'Invalid backup code' });
      }

      // Remove used code
      const updatedCodes = [...user.backupCodes];
      updatedCodes.splice(codeIndex, 1);
      await db.updateUserMfa(userId, { backupCodes: updatedCodes });

      // Generate JWT token
      const { generateToken } = await import('./auth.js');
      const token = generateToken(user.id, user.currentOrganization.id);

      return res.json({
        success: true,
        token,
        remainingCodes: updatedCodes.length
      });
    } catch (error: any) {
      console.error('Backup code verification error:', error);
      return res.status(500).json({ message: 'Verification failed' });
    }
  }
);

/**
 * Start WebAuthn registration
 */
router.post('/setup/webauthn/start',
  body('userId').not().isEmpty(),
  body('userName').not().isEmpty(),
  body('userEmail').isEmail(),
  async (req: Request, res: Response) => {
    try {
      const { userId, userName, userEmail } = req.body;

      // Generate challenge
      const challenge = crypto.randomBytes(32);
      
      // Store challenge temporarily (in production, use Redis)
      // For demo, we'll include it in the response and trust the client
      
      const options: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: 'ChiHealth MediSecure',
          id: process.env.WEBAUTHN_RP_ID || 'localhost'
        },
        user: {
          id: Buffer.from(userId),
          name: userEmail,
          displayName: userName
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },  // ES256
          { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Prefer platform authenticators (biometrics)
          userVerification: 'required',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
      };

      // Convert buffers to base64 for JSON
      const optionsJSON = {
        ...options,
        challenge: challenge.toString('base64'),
        user: {
          ...options.user,
          id: Buffer.from(userId).toString('base64')
        }
      };

      return res.json({ options: optionsJSON });
    } catch (error: any) {
      console.error('WebAuthn registration start error:', error);
      return res.status(500).json({ message: 'Failed to start registration' });
    }
  }
);

/**
 * Complete WebAuthn registration
 */
router.post('/setup/webauthn/complete',
  body('userId').not().isEmpty(),
  body('credential').isObject(),
  async (req: Request, res: Response) => {
    try {
      const { userId, credential, deviceName } = req.body;

      // In production, verify attestation here
      // For demo, we'll trust the client

      // Generate backup codes
      const backupCodes = generateBackupCodes();
      const hashedCodes = backupCodes.map(code => hashBackupCode(code));

      // Store credential
      const webAuthnCredential = {
        id: credential.id,
        publicKey: credential.response.attestationObject, // In production, extract and store properly
        counter: 0,
        deviceName: deviceName || 'Unknown Device',
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };

      // Update user's MFA settings
      const user = await db.getUserById(userId);
      const existingMethod = user?.mfaMethod;
      const newMethod = existingMethod === 'totp' ? 'both' : 'webauthn';

      await db.updateUserMfa(userId, {
        mfaEnabled: true,
        mfaMethod: newMethod,
        webAuthnCredentials: [webAuthnCredential],
        backupCodes: hashedCodes,
        mfaEnrolledAt: user?.mfaEnrolledAt || new Date().toISOString()
      });

      return res.json({
        success: true,
        credentialId: credential.id,
        backupCodes
      });
    } catch (error: any) {
      console.error('WebAuthn registration complete error:', error);
      return res.status(500).json({ message: 'Failed to complete registration' });
    }
  }
);

/**
 * Start WebAuthn authentication
 */
router.post('/verify/webauthn/start',
  body('userId').not().isEmpty(),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      const user = await db.getUserById(userId);
      if (!user || !user.webAuthnCredentials || user.webAuthnCredentials.length === 0) {
        return res.status(404).json({ message: 'No biometric credentials found' });
      }

      // Generate challenge
      const challenge = crypto.randomBytes(32);

      const options: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        rpId: process.env.WEBAUTHN_RP_ID || 'localhost',
        allowCredentials: user.webAuthnCredentials.map(cred => ({
          type: 'public-key' as const,
          id: Buffer.from(cred.id, 'base64')
        })),
        userVerification: 'required',
        timeout: 60000
      };

      // Convert buffers to base64
      const optionsJSON = {
        ...options,
        challenge: challenge.toString('base64'),
        allowCredentials: user.webAuthnCredentials.map(cred => ({
          type: 'public-key',
          id: cred.id
        }))
      };

      return res.json({ options: optionsJSON });
    } catch (error: any) {
      console.error('WebAuthn authentication start error:', error);
      return res.status(500).json({ message: 'Failed to start authentication' });
    }
  }
);

/**
 * Complete WebAuthn authentication
 */
router.post('/verify/webauthn/complete',
  body('userId').not().isEmpty(),
  body('credential').isObject(),
  async (req: Request, res: Response) => {
    try {
      const { userId, credential } = req.body;

      // In production, verify signature here
      // For demo, we'll trust the client

      // Update last used timestamp
      const user = await db.getUserById(userId);
      if (user?.webAuthnCredentials) {
        const updatedCredentials = user.webAuthnCredentials.map(cred =>
          cred.id === credential.id
            ? { ...cred, lastUsed: new Date().toISOString() }
            : cred
        );
        await db.updateUserMfa(userId, { webAuthnCredentials: updatedCredentials });
      }

      // Generate JWT token
      const { generateToken } = await import('./auth.js');
      const token = generateToken(user!.id, user!.currentOrganization.id);

      return res.json({
        success: true,
        token
      });
    } catch (error: any) {
      console.error('WebAuthn authentication complete error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  }
);

/**
 * Get user's WebAuthn credentials
 */
router.get('/credentials/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const credentials = user.webAuthnCredentials || [];
    
    // Don't send private keys, only metadata
    const safeCredentials = credentials.map(cred => ({
      id: cred.id,
      deviceName: cred.deviceName,
      createdAt: cred.createdAt,
      lastUsed: cred.lastUsed
    }));

    return res.json({ credentials: safeCredentials });
  } catch (error: any) {
    console.error('Get credentials error:', error);
    return res.status(500).json({ message: 'Failed to get credentials' });
  }
});

/**
 * Remove a WebAuthn credential
 */
router.delete('/credentials/:credentialId',
  body('userId').not().isEmpty(),
  async (req: Request, res: Response) => {
    try {
      const { credentialId } = req.params;
      const { userId } = req.body;

      const user = await db.getUserById(userId);
      if (!user || !user.webAuthnCredentials) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updatedCredentials = user.webAuthnCredentials.filter(
        cred => cred.id !== credentialId
      );

      await db.updateUserMfa(userId, { webAuthnCredentials: updatedCredentials });

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Remove credential error:', error);
      return res.status(500).json({ message: 'Failed to remove credential' });
    }
  }
);

/**
 * Regenerate backup codes
 */
router.post('/backup-codes/regenerate',
  body('userId').not().isEmpty(),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;

      const backupCodes = generateBackupCodes();
      const hashedCodes = backupCodes.map(code => hashBackupCode(code));

      await db.updateUserMfa(userId, { backupCodes: hashedCodes });

      return res.json({ backupCodes });
    } catch (error: any) {
      console.error('Regenerate backup codes error:', error);
      return res.status(500).json({ message: 'Failed to regenerate codes' });
    }
  }
);

/**
 * Disable MFA (requires password confirmation)
 */
router.post('/disable',
  body('userId').not().isEmpty(),
  body('password').not().isEmpty(),
  async (req: Request, res: Response) => {
    try {
      const { userId, password } = req.body;

      const user = await db.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify password
      const { comparePassword } = await import('./password.js');
      const isValid = await comparePassword(password, user.passwordHash || '');
      
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      // Disable MFA
      await db.updateUserMfa(userId, {
        mfaEnabled: false,
        mfaMethod: undefined,
        mfaSecret: undefined,
        webAuthnCredentials: [],
        backupCodes: []
      });

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Disable MFA error:', error);
      return res.status(500).json({ message: 'Failed to disable MFA' });
    }
  }
);

/**
 * Setup security questions for MFA
 */
router.post('/setup/security-questions',
  body('userId').not().isEmpty(),
  body('answers').isArray({ min: 3, max: 5 }),
  async (req: Request, res: Response) => {
    try {
      const { userId, answers } = req.body;

      // Validate answer structure
      for (const answer of answers) {
        if (!answer.questionId || typeof answer.questionId !== 'string' || !answer.answer) {
          return res.status(400).json({ message: 'Invalid answer format' });
        }
      }

      // Hash answers (case-insensitive)
      const hashedQuestions = answers.map((qa: any) => ({
        questionId: qa.questionId,
        hashedAnswer: crypto.createHash('sha256')
          .update(qa.answer.toLowerCase().trim())
          .digest('hex')
      }));

      // Update user MFA settings
      await db.updateUserMfa(userId, {
        mfaEnabled: true,
        mfaMethod: 'security_questions',
        securityQuestions: hashedQuestions,
        mfaEnrolledAt: new Date().toISOString()
      });

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Setup security questions error:', error);
      return res.status(500).json({ message: 'Failed to setup security questions' });
    }
  }
);

/**
 * Verify security questions for MFA
 */
router.post('/verify/security-questions',
  body('userId').not().isEmpty(),
  body('answers').isArray({ min: 3, max: 5 }),
  async (req: Request, res: Response) => {
    try {
      const { userId, answers } = req.body;

      const user = await db.getUserById(userId);
      if (!user || !user.securityQuestions) {
        return res.status(404).json({ message: 'User not found or security questions not configured' });
      }

      const storedQuestions = user.securityQuestions as Array<{
        questionId: string;
        hashedAnswer: string;
      }>;

      // Verify all answers match
      for (const answer of answers) {
        const stored = storedQuestions.find(q => q.questionId === answer.questionId);
        if (!stored) {
          return res.status(400).json({ message: 'Invalid question ID' });
        }

        const hashedAnswer = crypto.createHash('sha256')
          .update(answer.answer.toLowerCase().trim())
          .digest('hex');

        if (hashedAnswer !== stored.hashedAnswer) {
          return res.status(401).json({ message: 'Incorrect answer' });
        }
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error('Verify security questions error:', error);
      return res.status(500).json({ message: 'Failed to verify security questions' });
    }
  }
);

/**
 * Get user's security question IDs (not the answers)
 */
router.get('/security-questions/:userId',
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await db.getUserById(userId);
      if (!user || !user.securityQuestions) {
        return res.status(404).json({ message: 'User not found or security questions not configured' });
      }

      const storedQuestions = user.securityQuestions as Array<{
        questionId: string;
        hashedAnswer: string;
      }>;

      const questionIds = storedQuestions.map(q => q.questionId);

      return res.json({ questionIds });
    } catch (error: any) {
      console.error('Get security questions error:', error);
      return res.status(500).json({ message: 'Failed to get security questions' });
    }
  }
);

export default router;

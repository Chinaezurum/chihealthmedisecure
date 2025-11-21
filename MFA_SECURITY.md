# Multi-Factor Authentication (MFA) - Production Security

## Overview
ChiHealth MediSecure enforces mandatory two-factor authentication (MFA) for **all user accounts in production environments**. This is a critical security requirement for protecting sensitive healthcare data and ensuring HIPAA compliance.

## MFA Enforcement

### Production Environment
- **Required**: MFA is **MANDATORY** for all users
- **Enforcement**: Users without MFA will be prompted to set it up immediately after login
- **Cannot Skip**: Production users cannot skip MFA setup
- **Environment Detection**: Automatically detected via `import.meta.env.PROD` or `VITE_ENFORCE_MFA=true`

### Development Environment
- **Optional**: MFA can be skipped during development
- **Testing**: Full MFA functionality available for testing
- **Environment**: Detected when `import.meta.env.DEV` is true

## Supported MFA Methods

### 1. TOTP (Time-based One-Time Password)
**Authenticator Apps:**
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- LastPass Authenticator
- Any RFC 6238 compliant TOTP app

**Setup Process:**
1. User scans QR code with authenticator app
2. App generates 6-digit codes every 30 seconds
3. User enters code to verify setup
4. Backup recovery codes are generated

### 2. WebAuthn (Biometric Authentication)
**Supported Methods:**
- **Fingerprint** (Touch ID, Windows Hello Fingerprint)
- **Facial Recognition** (Face ID, Windows Hello Face)
- **Security Keys** (YubiKey, Google Titan Key)
- **Platform Authenticators** (built-in device biometrics)

**Requirements:**
- HTTPS connection (required for WebAuthn)
- Compatible device with biometric hardware
- Modern browser supporting WebAuthn API

**Browser Support:**
- Chrome/Edge 67+
- Firefox 60+
- Safari 13+
- Opera 54+

### 3. Backup Recovery Codes
- **Purpose**: Account recovery if primary MFA method unavailable
- **Quantity**: 10 codes generated during setup
- **Usage**: Single-use, deleted after authentication
- **Regeneration**: Available through user settings
- **Storage**: Hashed using SHA-256 before storage

## Setup Flow

### First Login (Production)
1. User enters email and password
2. System detects no MFA configured
3. User redirected to mandatory MFA setup
4. User chooses TOTP or Biometric method
5. Setup wizard guides through enrollment:
   - **TOTP**: Scan QR code → Verify code → Save backup codes
   - **Biometric**: Browser prompts for fingerprint/face → Save backup codes
6. Backup codes displayed (must be saved)
7. User redirected to dashboard after completion

### Subsequent Logins
1. User enters email and password
2. System detects MFA is enabled
3. User redirected to MFA verification:
   - **TOTP Method**: Enter 6-digit code from authenticator
   - **Biometric Method**: Browser prompts for fingerprint/face
   - **Both Methods**: User can choose preferred method
4. Fallback: "Use backup code" option if primary method unavailable
5. Successful verification → Dashboard access

## API Endpoints

### Setup Endpoints
```
POST /api/mfa/setup/totp
POST /api/mfa/verify/totp-setup
POST /api/mfa/setup/webauthn/start
POST /api/mfa/setup/webauthn/complete
```

### Verification Endpoints
```
POST /api/mfa/verify/totp
POST /api/mfa/verify/webauthn/start
POST /api/mfa/verify/webauthn/complete
POST /api/mfa/verify/backup-code
```

### Management Endpoints
```
GET    /api/mfa/credentials/:userId
DELETE /api/mfa/credentials/:credentialId
POST   /api/mfa/backup-codes/regenerate
POST   /api/mfa/disable
```

## Security Features

### TOTP Security
- **Algorithm**: HMAC-SHA1 (RFC 6238 standard)
- **Time Window**: 30-second intervals
- **Code Length**: 6 digits
- **Validation Window**: ±30 seconds (prevents clock drift issues)
- **Secret Storage**: Encrypted at rest (production requirement)

### WebAuthn Security
- **Protocol**: FIDO2 / Web Authentication API
- **Public Key Cryptography**: Asymmetric encryption
- **User Verification**: Required (biometric or PIN)
- **Attestation**: None (privacy-preserving)
- **Credential Storage**: Public key only, private key never leaves device
- **Challenge-Response**: Prevents replay attacks

### Backup Codes Security
- **Hashing**: SHA-256 with salt
- **Single Use**: Deleted immediately after successful use
- **Quantity**: 10 codes (sufficient for emergency access)
- **Format**: XXXX-XXXX (easy to type, print-friendly)

## User Experience

### MFA Verification Page
- **Method Selection**: Tab interface for TOTP/Biometric
- **Auto-Detection**: Biometric option shown only if supported
- **Auto-Trigger**: Biometric prompt appears automatically if configured
- **Fallback Options**: Clear path to backup codes
- **Error Handling**: User-friendly messages with recovery steps
- **Support Link**: Direct contact to help desk

### MFA Setup Modal
- **Step-by-Step Wizard**: Guided setup process
- **QR Code Display**: Large, scannable QR code for TOTP
- **Manual Key**: Alternative setup method if camera unavailable
- **Device Detection**: Auto-identifies device type for biometrics
- **Progress Indication**: Clear visual feedback during enrollment
- **Backup Code Display**: Prominent "Save These Codes" warning
- **Copy Function**: One-click copy all codes
- **Completion Feedback**: Success message with security benefits

## Database Schema

### User Model Extensions
```prisma
model User {
  // ... existing fields
  mfaEnabled          Boolean?  @default(false)
  mfaMethod           String?   // 'totp' | 'webauthn' | 'both'
  mfaSecret           String?   // Encrypted TOTP secret
  webAuthnCredentials Json?     // Array of credentials
  backupCodes         String[]  // Hashed codes
  mfaEnrolledAt       DateTime?
  
  @@index([mfaEnabled])
}
```

### Audit Logging
All MFA operations are logged via the audit system:
- `auth.mfa_enabled` - MFA enrollment completed
- `auth.mfa_verified` - Successful MFA verification
- `auth.mfa_failed` - Failed MFA attempt
- `auth.mfa_backup_used` - Backup code used
- `auth.mfa_disabled` - MFA disabled (requires password)

## Compliance

### HIPAA Requirements
✅ Multi-factor authentication for PHI access  
✅ Audit trail of all authentication attempts  
✅ Secure credential storage (encrypted secrets)  
✅ Session management with timeout  
✅ Failed login attempt tracking  

### GDPR Compliance
✅ User consent for biometric data collection  
✅ Right to disable MFA (with password verification)  
✅ Data minimization (only necessary credential data stored)  
✅ Secure deletion of credentials  

## Troubleshooting

### Lost Authenticator Device
1. User clicks "Use backup code instead"
2. Enters one of 10 backup codes
3. Access granted, backup code consumed
4. User can regenerate new backup codes in settings
5. User can re-enroll new authenticator device

### Biometric Not Working
1. User switches to "Authenticator" tab
2. Enters TOTP code from authenticator app
3. Or uses backup code as last resort

### All MFA Methods Lost
1. User contacts support
2. Identity verification required
3. Admin can temporarily disable MFA
4. User must re-enroll immediately upon login

## Configuration

### Environment Variables

#### Frontend
```bash
# Force MFA enforcement (even in development)
VITE_ENFORCE_MFA=true
```

#### Backend
```bash
# WebAuthn Relying Party ID (must match domain)
WEBAUTHN_RP_ID=yourdomain.com

# For production, ensure HTTPS
NODE_ENV=production
```

### Feature Flags
```typescript
// Check if MFA is required
import { isMfaRequired } from './services/mfaService';
if (isMfaRequired()) {
  // Enforce MFA setup
}

// Check if user has MFA enabled
import { isMfaEnabled } from './services/mfaService';
if (isMfaEnabled(user)) {
  // Require verification
}
```

## Best Practices

### For Users
1. **Save Backup Codes**: Print or store in password manager
2. **Use Biometrics**: Faster and more convenient
3. **Multiple Devices**: Enroll biometrics on all devices you use
4. **Keep Authenticator Updated**: Ensure app is current version
5. **Don't Share Codes**: MFA codes are single-use and personal

### For Administrators
1. **Monitor MFA Adoption**: Track enrollment rates
2. **Audit Failed Attempts**: Investigate repeated failures
3. **Grace Period**: Allow brief window for enrollment (development only)
4. **User Training**: Provide MFA setup documentation
5. **Support Readiness**: Train support staff on MFA issues

### For Developers
1. **Test All Flows**: TOTP, WebAuthn, backup codes
2. **Error Handling**: Graceful fallbacks for all scenarios
3. **Browser Compatibility**: Test WebAuthn across browsers
4. **Mobile Support**: Ensure biometrics work on mobile devices
5. **Security Audits**: Regular penetration testing

## Implementation Checklist

- [x] MFA service with TOTP, WebAuthn, backup codes
- [x] User type extended with MFA fields
- [x] MFA verification page with method selection
- [x] MFA setup modal with wizard flow
- [x] Login flow updated with MFA enforcement
- [x] Backend API routes for all MFA operations
- [x] Database schema updated with MFA fields
- [x] Production environment detection
- [x] Audit logging integration
- [ ] User documentation and training materials
- [ ] Admin panel for MFA management
- [ ] MFA statistics dashboard
- [ ] Automated testing suite for MFA flows

## Support

For MFA-related issues:
- **User Support**: Contact your system administrator
- **Technical Issues**: Check browser compatibility and HTTPS
- **Lost Access**: Use backup codes or contact support
- **Security Concerns**: Report to security@chihealth.com

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: Production Ready

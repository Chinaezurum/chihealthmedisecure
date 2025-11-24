import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.chihealth.medisecure',
  appName: 'ChiHealth MediSecure',
  webDir: 'dist',
  server: {
    // Production API endpoint - update before building for stores
    // url: 'https://api.chihealth.com', // Uncomment and replace with your actual API URL
    cleartext: false, // Enforce HTTPS only (HIPAA requirement)
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a1929',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark' as any,
      backgroundColor: '#0a1929',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Preferences: {
      // Secure storage for sensitive data (HIPAA compliant)
      group: 'com.chihealth.medisecure.preferences',
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'ChiHealth',
  },
  android: {
    buildOptions: {
      keystorePath: 'path/to/your/keystore',
      keystoreAlias: 'chihealth',
    },
    allowMixedContent: false, // HIPAA: no mixed HTTP/HTTPS content
  },
};

export default config;

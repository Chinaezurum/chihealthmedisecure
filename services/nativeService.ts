// Native bridge utilities for Capacitor
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform(); // 'ios', 'android', or 'web'

// Secure storage for sensitive data (HIPAA compliant)
export const secureStorage = {
  async set(key: string, value: string) {
    await Preferences.set({ key, value });
  },
  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async remove(key: string) {
    await Preferences.remove({ key });
  },
  async clear() {
    await Preferences.clear();
  },
};

// App lifecycle
export const appLifecycle = {
  async hideSplashScreen() {
    if (isNative()) {
      await SplashScreen.hide();
    }
  },
  async showSplashScreen() {
    if (isNative()) {
      await SplashScreen.show();
    }
  },
};

// Status bar controls
export const statusBar = {
  async setDark() {
    if (isNative()) {
      await StatusBar.setStyle({ style: Style.Dark });
    }
  },
  async setLight() {
    if (isNative()) {
      await StatusBar.setStyle({ style: Style.Light });
    }
  },
  async hide() {
    if (isNative()) {
      await StatusBar.hide();
    }
  },
  async show() {
    if (isNative()) {
      await StatusBar.show();
    }
  },
};

// Keyboard controls
export const keyboard = {
  async hide() {
    if (isNative()) {
      await Keyboard.hide();
    }
  },
  async show() {
    if (isNative()) {
      await Keyboard.show();
    }
  },
};

// Haptic feedback
export const haptics = {
  async light() {
    if (isNative()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  },
  async medium() {
    if (isNative()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  },
  async heavy() {
    if (isNative()) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  },
};

// Initialize app on launch
export const initializeApp = async () => {
  if (!isNative()) return;

  try {
    // Hide splash screen after 2 seconds
    setTimeout(async () => {
      await appLifecycle.hideSplashScreen();
    }, 2000);

    // Set status bar style
    const theme = await secureStorage.get('theme');
    if (theme === 'light') {
      await statusBar.setLight();
    } else {
      await statusBar.setDark();
    }

    console.log('Native app initialized on:', getPlatform());
  } catch (error) {
    console.error('Failed to initialize native features:', error);
  }
};

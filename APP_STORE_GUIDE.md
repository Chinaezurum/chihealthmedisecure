# App Store Deployment Guide

## ChiHealth MediSecure - App Store Configuration

This guide covers deploying to both **iOS App Store** and **Google Play Store**.

---

## 🎯 Prerequisites

### For iOS (App Store)
- **Mac computer** (required for iOS builds)
- **Xcode 15+** installed from Mac App Store
- **Apple Developer Account** ($99/year)
- **CocoaPods** installed: `sudo gem install cocoapods`

### For Android (Play Store)
- **Android Studio** (any OS)
- **Google Play Console Account** ($25 one-time)
- **Java JDK 17+** installed

---

## 📱 Current Configuration

**App Details:**
- **Name:** ChiHealth MediSecure
- **Bundle ID:** com.chihealth.medisecure
- **Platforms:** iOS + Android
- **Build Output:** `dist/`

**Capacitor Plugins Installed:**
- ✅ Preferences (secure storage)
- ✅ Splash Screen
- ✅ Status Bar
- ✅ Keyboard
- ✅ Haptics
- ✅ Camera
- ✅ Push Notifications

---

## 🚀 Build & Deploy Steps

### Step 1: Build Web Assets
```bash
npm run build
```

### Step 2: Add Native Platforms

**For iOS:**
```bash
npx cap add ios
```

**For Android:**
```bash
npx cap add android
```

### Step 3: Sync Assets to Native Projects
```bash
npx cap sync
```

### Step 4: Open Native IDEs

**iOS (Xcode):**
```bash
npx cap open ios
```

**Android (Android Studio):**
```bash
npx cap open android
```

---

## 🍎 iOS App Store Submission

### 1. Configure Xcode Project

Open `ios/App/App.xcworkspace` in Xcode:

**General Tab:**
- Set **Display Name:** ChiHealth MediSecure
- Set **Bundle Identifier:** com.chihealth.medisecure
- Set **Version:** 1.0.0
- Set **Build:** 1
- Select **Team:** Your Apple Developer Team

**Signing & Capabilities:**
- Enable **Automatic Signing**
- Add Capabilities:
  - ✅ Push Notifications
  - ✅ Background Modes (Background fetch, Remote notifications)
  - ✅ HealthKit (optional - for wearables integration)
  - ✅ Camera
  - ✅ Photo Library

**Info.plist Required Permissions:**
Add these privacy descriptions:
```xml
<key>NSCameraUsageDescription</key>
<string>ChiHealth needs camera access to capture medical images and documentation</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>ChiHealth needs photo library access to select and upload medical documents</string>

<key>NSFaceIDUsageDescription</key>
<string>ChiHealth uses Face ID for secure authentication</string>

<key>NSHealthShareUsageDescription</key>
<string>ChiHealth needs access to read your health data for comprehensive care</string>

<key>NSHealthUpdateUsageDescription</key>
<string>ChiHealth needs access to update your health data</string>
```

### 2. App Store Assets Required

**App Icon:** 1024x1024px PNG (no transparency)
- Located in: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Screenshots Required (per device):**
- iPhone 6.7" (1290x2796px) - 3-10 screenshots
- iPhone 6.5" (1284x2778px) - 3-10 screenshots  
- iPad Pro 12.9" (2048x2732px) - 3-10 screenshots

**App Preview Video (optional):**
- 15-30 seconds, 1290x2796px

### 3. App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app: **Apps → + → New App**
3. Fill in metadata:
   - **Name:** ChiHealth MediSecure
   - **Primary Language:** English
   - **Bundle ID:** com.chihealth.medisecure
   - **SKU:** CHIHEALTH001
   - **Category:** Medical (Primary), Health & Fitness (Secondary)
   - **Age Rating:** 17+ (Unrestricted Web Access)

4. **App Privacy:**
   - Data Collection: Yes (Patient health data)
   - Data Types: Health & Fitness, Identifiers, Contact Info
   - Purpose: Analytics, Product Personalization, App Functionality
   - Linked to User: Yes
   - Used for Tracking: No

5. **App Description:**
```
ChiHealth MediSecure is a comprehensive healthcare management platform designed for patients, healthcare providers, and medical staff.

FEATURES:
• Secure Patient Portal - Access medical records, lab results, prescriptions
• Appointment Management - Book, reschedule, and video consultations
• AI Health Assistant - Symptom checker with intelligent triage
• Real-time Messaging - Communicate with care team
• Prescription Management - Digital prescriptions and refill tracking
• Billing & Insurance - View bills, make payments, track claims
• Wearable Integration - Sync health data from devices
• Multi-role Support - Patients, doctors, nurses, pharmacists, lab techs

SECURITY:
• HIPAA compliant architecture
• End-to-end encryption
• Biometric authentication (Face ID / Touch ID)
• Multi-factor authentication
• Secure data storage

Perfect for healthcare organizations, clinics, hospitals, and individual practitioners seeking a modern, integrated healthcare management solution.
```

6. **Keywords:** healthcare, medical records, telemedicine, patient portal, ehr, hipaa, prescriptions, appointments, doctor, hospital

7. **Support URL:** https://chihealth.com/support
8. **Privacy Policy URL:** https://chihealth.com/privacy (REQUIRED - must create this)

### 4. Build & Upload to App Store

**In Xcode:**
1. Select **Any iOS Device** as build target
2. Product → Archive
3. Wait for archive to complete
4. Click **Distribute App**
5. Select **App Store Connect**
6. Upload to App Store
7. Wait for processing (~30 minutes)

**Submit for Review:**
1. Go to App Store Connect
2. Select your app version
3. Add screenshots and metadata
4. Click **Submit for Review**
5. Wait 1-3 days for review

---

## 🤖 Google Play Store Submission

### 1. Configure Android Project

Open `android/` in Android Studio:

**File: `android/app/build.gradle`**
```gradle
android {
    namespace "com.chihealth.medisecure"
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.chihealth.medisecure"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Permissions in `AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

### 2. Generate Signing Key

```bash
# Generate keystore
keytool -genkey -v -keystore chihealth-release.keystore -alias chihealth -keyalg RSA -keysize 2048 -validity 10000

# Save keystore in android/app/
# DO NOT commit keystore to git - add to .gitignore
```

**File: `android/app/key.properties`** (create this)
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=chihealth
storeFile=chihealth-release.keystore
```

**Update `android/app/build.gradle`:**
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('app/key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

### 3. Build Release APK/AAB

```bash
# Build App Bundle (preferred by Play Store)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Play Console Setup

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app: **Create app**
3. Fill in details:
   - **App name:** ChiHealth MediSecure
   - **Default language:** English
   - **App or game:** App
   - **Free or paid:** Free
   - **Category:** Medical
   - **Content rating:** Medical reference app

4. **Store Listing:**
   - **Short description:** (80 chars) Secure healthcare platform with AI assistant, telemedicine, and patient portal
   - **Full description:** (4000 chars) Same as iOS description above
   - **App icon:** 512x512px PNG (32-bit with transparency)
   - **Feature graphic:** 1024x500px PNG or JPG
   - **Screenshots:** 
     - Phone: 16:9 or 9:16 ratio (min 320px, max 3840px)
     - 7" Tablet: Min 2 screenshots
     - 10" Tablet: Min 2 screenshots

5. **Privacy Policy:** https://chihealth.com/privacy (REQUIRED)

6. **Data Safety:**
   - Collects: Health data, Personal info, Financial info
   - Shares: No (unless using third-party analytics)
   - Encryption: In transit and at rest
   - User can request deletion: Yes

7. **Content Rating:**
   - Complete questionnaire
   - Select "Reference" category for medical apps

8. **Upload App Bundle:**
   - Internal testing → Upload AAB
   - Create release
   - Add release notes
   - Review and rollout

### 5. Submit for Review

1. Complete all setup sections
2. Click **Send for review**
3. Wait 1-3 days for approval

---

## 🔐 HIPAA Compliance Checklist

### Required for Healthcare Apps

**Data Security:**
- ✅ Encryption at rest (Capacitor Preferences with encryption)
- ✅ Encryption in transit (HTTPS only)
- ✅ Biometric authentication (Face ID / Touch ID)
- ✅ Session timeout (implemented)
- ✅ Audit logging (implemented)

**Business Associate Agreement (BAA):**
- 📋 Sign BAA with Apple (for iCloud services if used)
- 📋 Sign BAA with Google (for Firebase if used)
- 📋 Sign BAA with hosting provider
- 📋 Document all third-party services handling PHI

**Privacy Requirements:**
- ✅ Privacy Policy URL (must create)
- ✅ Data collection disclosure
- ✅ User data deletion capability
- ✅ Breach notification procedures

---

## 📋 Pre-Submission Checklist

### iOS App Store
- [ ] App builds and runs without errors
- [ ] All features tested on physical device
- [ ] Icons and splash screens look correct
- [ ] Privacy descriptions added to Info.plist
- [ ] Signing certificates configured
- [ ] Screenshots prepared (all required sizes)
- [ ] App Store description written
- [ ] Privacy policy URL live and accessible
- [ ] Support URL live
- [ ] App Store Connect metadata complete
- [ ] Age rating set (17+)
- [ ] Export compliance documentation

### Google Play Store
- [ ] App builds and runs without errors
- [ ] All features tested on physical device
- [ ] Release APK/AAB signed with production key
- [ ] Icons and feature graphic ready
- [ ] Screenshots prepared (phone + tablet)
- [ ] Store listing complete
- [ ] Privacy policy URL live
- [ ] Data safety section complete
- [ ] Content rating questionnaire complete
- [ ] Internal testing track created

---

## 🔧 Common Issues & Solutions

### iOS Issues

**"Provisioning profile doesn't include signing certificate"**
- Solution: Revoke and regenerate certificates in Apple Developer portal

**"App is in a state that is not eligible for export"**
- Solution: Ensure Info.plist has all required privacy descriptions

**"Missing compliance documentation"**
- Solution: In App Store Connect, declare encryption usage

### Android Issues

**"Upload failed: Duplicate SHA1 fingerprint"**
- Solution: Use new keystore or update existing app

**"APK not supported on any devices"**
- Solution: Check minSdkVersion (should be 24+)

**"Missing required privacy policy"**
- Solution: Add privacy policy URL in Play Console

---

## 📱 Testing Before Submission

### TestFlight (iOS)
```bash
# Upload to App Store Connect
# Invite internal testers via email
# Get feedback before public release
```

### Internal Testing (Android)
```bash
# Upload AAB to internal testing track
# Add tester emails
# Share internal testing link
```

---

## 🎉 Post-Launch

### App Updates
1. Increment version number (versionCode/Build)
2. Build new release
3. Upload to stores
4. Add "What's new" release notes
5. Submit for review

### Monitoring
- Set up crash reporting (Sentry, Firebase Crashlytics)
- Monitor reviews and ratings
- Track download analytics
- Respond to user feedback

---

## 🆘 Support Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **iOS Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Android Guidelines:** https://play.google.com/console/about/guides/
- **HIPAA Guidance:** https://www.hhs.gov/hipaa/for-professionals/security/guidance/index.html

---

## 📞 Need Help?

This is a complex process. Common services that can help:
- **App submission services** (CodePush, AppCenter)
- **Professional app publishers** ($500-2000)
- **Healthcare app consultants** for HIPAA compliance

**Estimated Timeline:**
- Initial setup: 2-3 days
- iOS review: 1-3 days
- Android review: 1-3 days
- Total: ~1 week for first submission

Good luck with your app store launch! 🚀

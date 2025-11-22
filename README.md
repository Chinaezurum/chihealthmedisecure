# ChiHealth MediSecure 🏥

> **Comprehensive Healthcare Management Platform**  
> Multi-tenant EHR system with 13 specialized roles, AI-powered clinical assistance, and HIPAA-compliant architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [User Roles](#user-roles)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

ChiHealth MediSecure is a modern, full-stack healthcare management system designed for clinics, hospitals, and multi-facility healthcare organizations. Built with React, TypeScript, Node.js, and PostgreSQL, it provides end-to-end patient care workflow management from appointment booking to billing.

### Key Statistics

- **13 User Roles** with granular permissions
- **60+ REST API Endpoints**
- **55+ React Components**
- **Multi-Factor Authentication** (TOTP, WebAuthn, Backup Codes)
- **Real-time Communication** via WebSocket
- **PWA-Ready** with offline support
- **Mobile Apps** via Capacitor (iOS & Android)

---

## ✨ Features

### 🔐 Security & Compliance

- ✅ **Multi-Factor Authentication (MFA)**
  - Time-based One-Time Passwords (TOTP)
  - Biometric authentication (WebAuthn)
  - Backup recovery codes
- ✅ **Role-Based Access Control (RBAC)**
  - 13 distinct roles
  - 100+ granular permissions
  - Organization-level isolation
- ✅ **Comprehensive Audit Logging**
  - User actions, authentication events
  - Data access tracking
  - HIPAA-compliant audit trails
- ✅ **Data Encryption**
  - HTTPS in transit
  - Encrypted PHI storage
  - Secure session management

### 🏥 Clinical Features

- **Electronic Health Records (EHR)**
  - Patient demographics
  - Medical history
  - Allergy tracking
  - Immunization records
- **Clinical Documentation**
  - SOAP notes
  - Progress notes
  - Consultation notes
- **E-Prescribing**
  - Drug interaction checking
  - Allergy alerts
  - Prescription history
- **Lab Management**
  - Test ordering
  - Results upload
  - Critical value alerts
- **Imaging & Radiology**
  - Imaging orders
  - Report generation
  - PACS integration ready

### 📊 Administrative Features

- **Appointment Scheduling**
  - Online booking
  - Walk-in registration
  - Waitlist management
- **Bed Management**
  - Real-time bed status
  - Admission/discharge workflow
  - Transfer tracking
- **Billing & Finance**
  - Invoice generation
  - Insurance claims
  - Payment processing
  - Pricing catalog management
- **Inventory Management**
  - Medication tracking
  - Supply ordering
  - Vendor management

### 🤖 AI-Powered Features

- **Symptom Checker**
  - Conversational AI assistant
  - Preliminary diagnosis suggestions
  - Health risk assessment
- **Clinical Decision Support**
  - Treatment recommendations
  - Proactive care plans
  - EHR summarization
- **Predictive Analytics** (Planned)
  - Patient outcome prediction
  - Resource utilization forecasting

### 📱 Multi-Platform Support

- **Web App** (PWA)
  - Responsive design
  - Offline-first architecture
  - Service worker caching
- **Mobile Apps**
  - iOS (via Capacitor)
  - Android (via Capacitor)
  - Native camera, biometrics, push notifications
- **Telemedicine** (Planned)
  - Video consultations
  - Screen sharing
  - Digital prescriptions

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Web Browser (PWA)    │    iOS App (Capacitor)   │  Android App     │
│  ─────────────────────────────────────────────────────────────────  │
│           React 19 + TypeScript + Vite + TailwindCSS                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTPS / WebSocket
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                      APPLICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                     Express.js REST API                              │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │ Auth Service │  RBAC Module │ Audit Logger │ AI Proxy     │     │
│  └──────────────┴──────────────┴──────────────┴──────────────┘     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │         WebSocket Server (Real-time messaging)            │      │
│  └──────────────────────────────────────────────────────────┘      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ Prisma ORM
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                        DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                      PostgreSQL Database                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │    Users     │  Patients    │ Appointments │  EHR Data    │     │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤     │
│  │ Prescriptions│  Lab Tests   │   Billing    │  Audit Logs  │     │
│  └──────────────┴──────────────┴──────────────┴──────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Google Cloud Storage  │  Gemini AI API  │  OAuth Providers (Google)│
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.2.2
- **Styling**: TailwindCSS with custom theme
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Routing**: React Router (planned)
- **PWA**: vite-plugin-pwa 1.1.0
- **Mobile**: Capacitor 7.4.4

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.18
- **Language**: TypeScript 5.9.3
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: JWT + Passport.js
- **WebSocket**: ws 8.14
- **File Upload**: Multer + Google Cloud Storage

#### Security
- **Password Hashing**: bcrypt
- **MFA**: otplib (TOTP), @simplewebauthn (WebAuthn)
- **Session**: JWT with 8-hour expiration
- **Validation**: express-validator

#### AI Integration
- **Provider**: Google Gemini API
- **Use Cases**: Symptom analysis, clinical summaries, care planning

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ (or Docker)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chinaezurum/chihealthmedisecure.git
   cd chihealthmedisecure
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Configure environment variables**

   **Frontend** (create `.env` in root):
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```

   **Backend** (create `backend/.env`):
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/chihealth

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-me-minimum-32-chars
   
   # OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

   # AI (optional)
   GEMINI_API_KEY=your-gemini-api-key

   # Storage (optional)
   GCS_BUCKET_NAME=your-gcs-bucket
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma db seed
   cd ..
   ```

5. **Start the servers**

   **Option A**: Run both servers concurrently
   ```bash
   npm run dev:all
   ```

   **Option B**: Run servers separately
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - API Health Check: http://localhost:8080/api/health

### Default Login Credentials

See `backend/prisma/seed.ts` for sample users. Example:

- **Patient**: amina.bello@example.com / password123
- **Doctor**: sarah.johnson@example.com / password123
- **Admin**: admin@chihealth.com / admin123

---

## 👥 User Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Patient** | End users receiving care | View own EHR, book appointments, messaging |
| **Healthcare Worker (HCW)** | Physicians, Doctors | Full EHR access, prescribing, clinical notes |
| **Nurse** | Nursing staff | Triage, vitals, inpatient care, medication admin |
| **Receptionist** | Front desk staff | Appointment booking, registration, check-in |
| **Pharmacist** | Pharmacy staff | Prescription review, dispensing, inventory |
| **Lab Technician** | Lab staff | Test processing, results upload |
| **Radiologist** | Imaging specialists | Imaging reports, diagnostic interpretation |
| **Dietician** | Nutritionists | Meal planning, dietary consultations |
| **Logistics** | Supply chain staff | Transport, sample tracking, inventory |
| **Accountant** | Finance staff | Billing, invoicing, payment processing |
| **Admin** | System administrators | User management, facility management, settings |
| **IT Support** | Technical staff | System monitoring, backups, user troubleshooting |
| **Command Center** | Operations oversight | Bed management, facility overview, analytics |

### Role Hierarchy

```
┌─────────────────────┐
│   Command Center    │  ◄── Highest level oversight
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│       Admin         │  ◄── Organization management
└──────────┬──────────┘
           │
┌──────────▼──────────┬──────────┬──────────┬──────────┐
│   IT Support        │  HCW     │  Nurse   │ Accountant│
└─────────────────────┴──────────┴──────────┴──────────┘
           │
┌──────────▼──────────┬──────────┬──────────┬──────────┐
│  Receptionist       │Pharmacist│ Lab Tech │ Radiologist│
└─────────────────────┴──────────┴──────────┴──────────┘
           │
┌──────────▼──────────┬──────────┐
│   Logistics         │ Dietician│
└─────────────────────┴──────────┘
           │
┌──────────▼──────────┐
│      Patient        │  ◄── End users
└─────────────────────┘
```

---

## 🔒 Security

### Authentication Flow

```
User Login
   │
   ├─── Email/Password ───► JWT Token
   │                             │
   │                             ▼
   └─── Google OAuth ───► MFA Check ───► Dashboard
                             │
                             ├─── TOTP (Authenticator App)
                             ├─── Biometric (Face ID/Touch ID)
                             └─── Backup Code
```

### Authorization (RBAC)

Every API request goes through:
1. **Authentication Middleware**: Validates JWT token
2. **RBAC Middleware**: Checks user permissions
3. **Organization Context**: Ensures data isolation

Example:
```typescript
app.get('/api/patient/:id/records', 
  authenticate,              // Step 1: Who are you?
  requirePermission('view_patient_records'), // Step 2: Are you allowed?
  async (req, res) => {
    // Step 3: Org isolation applied automatically
  }
);
```

### HIPAA Compliance Features

- ✅ Unique user identification
- ✅ Emergency access procedures (planned)
- ✅ Automatic logoff (8-hour sessions)
- ✅ Encryption in transit (HTTPS)
- ⚠️ Encryption at rest (pending DB migration)
- ✅ Audit controls (comprehensive logging)
- ✅ Access controls (RBAC)
- ⚠️ Data integrity controls (checksums planned)

**Current HIPAA Readiness**: 60% (see SECURITY.md for details)

---

## 📚 API Documentation

### Base URL
- Development: `http://localhost:8080/api`
- Production: `https://your-domain.com/api`

### Authentication

All protected endpoints require a Bearer token:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/users/me
```

### Core Endpoints

#### Authentication
```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Email/password login
GET    /api/auth/google            # Initiate Google OAuth
GET    /api/auth/google/callback   # OAuth callback
POST   /api/auth/logout            # End session
GET    /api/auth/oauth/status      # Check OAuth config
```

#### MFA
```
POST   /api/auth/mfa/setup         # Initiate MFA setup
POST   /api/auth/mfa/verify        # Verify MFA code
POST   /api/auth/mfa/disable       # Disable MFA
GET    /api/auth/mfa/backup-codes  # Generate backup codes
```

#### User Management
```
GET    /api/users/me               # Get current user
PUT    /api/users/me               # Update profile
POST   /api/users/avatar           # Upload avatar
GET    /api/users/search           # Search users (admin)
```

#### Patient Portal
```
GET    /api/patient/dashboard      # Patient dashboard data
GET    /api/patient/appointments   # Get appointments
POST   /api/patient/appointments   # Book appointment
GET    /api/patient/prescriptions  # Get prescriptions
GET    /api/patient/lab-tests      # Get lab results
POST   /api/patient/messages       # Send message to HCW
```

#### Clinical Workflows
```
GET    /api/hcw/dashboard          # HCW dashboard
GET    /api/hcw/patients           # Patient list
POST   /api/hcw/clinical-notes     # Create clinical note
POST   /api/hcw/prescriptions      # Create prescription
POST   /api/hcw/lab-orders         # Order lab tests
```

#### Administration
```
GET    /api/admin/dashboard        # Admin dashboard
GET    /api/admin/users            # List all users
POST   /api/admin/staff            # Add staff member
GET    /api/admin/departments      # List departments
POST   /api/admin/departments      # Create department
GET    /api/admin/analytics        # System analytics
```

### Error Responses

All errors follow this format:
```json
{
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}  // Optional additional context
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

Full API documentation: See [API.md](docs/API.md) (coming soon)

---

## 🚢 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
cd ..
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Cloud Run (GCP)

```bash
# Build and deploy
gcloud builds submit --config=cloudbuild.yaml

# Set environment variables
gcloud run services update chihealth-medisecure \
  --set-env-vars="DATABASE_URL=postgresql://..." \
  --set-env-vars="JWT_SECRET=..." \
  --region=us-west1
```

### Environment Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Configure production `DATABASE_URL`
- [ ] Set up SSL certificates (HTTPS)
- [ ] Configure CORS for your domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable database backups
- [ ] Configure monitoring (planned: DataDog, Sentry)
- [ ] Set up log aggregation
- [ ] Run security audit: `npm audit`
- [ ] Review SECURITY.md

---

## 📖 Documentation

- [START_SERVERS.md](START_SERVERS.md) - Development setup
- [RUNBOOK.md](RUNBOOK.md) - Operational procedures
- [SECURITY.md](SECURITY.md) - Security architecture
- [MFA_SECURITY.md](MFA_SECURITY.md) - MFA implementation details
- [DATABASE_ARCHITECTURE.md](backend/DATABASE_ARCHITECTURE.md) - Database design
- [APP_STORE_GUIDE.md](APP_STORE_GUIDE.md) - Mobile app submission
- [PATIENT_DASHBOARD_SYNC.md](PATIENT_DASHBOARD_SYNC.md) - Real-time sync features

---

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm test

# E2E tests (Playwright)
npm run test:e2e

# Component tests
npm run test:ui
```

### Test Coverage

Current: ~5% (see code review report)
Target: 80%+

Priority test areas:
1. Authentication & MFA
2. RBAC middleware
3. Audit logging
4. Payment processing
5. Prescription creation

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- Meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- React team for React 19
- Prisma team for the excellent ORM
- Capacitor team for mobile bridge
- Google for Gemini AI API
- All open-source contributors

---

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/Chinaezurum/chihealthmedisecure/wiki)
- **Issues**: [GitHub Issues](https://github.com/Chinaezurum/chihealthmedisecure/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Chinaezurum/chihealthmedisecure/discussions)
- **Email**: support@chihealth.com

---

## 🗺️ Roadmap

### Q1 2026
- [ ] Complete database migration (PostgreSQL + Prisma)
- [ ] Achieve 80% test coverage
- [ ] Obtain HIPAA certification
- [ ] Launch mobile apps (iOS + Android)

### Q2 2026
- [ ] Add telehealth features (video consultations)
- [ ] Implement GraphQL API
- [ ] Add advanced analytics dashboard
- [ ] Multi-language support (5+ languages)

### Q3 2026
- [ ] FHIR API compliance
- [ ] HL7 integration
- [ ] Machine learning predictions
- [ ] Multi-region deployment

### Q4 2026
- [ ] Blockchain audit trail
- [ ] Federated learning for AI
- [ ] Wearable device integration
- [ ] Patient mobile app

---

**Built with ❤️ by the ChiHealth Team**

*Making healthcare accessible, efficient, and secure for everyone.*
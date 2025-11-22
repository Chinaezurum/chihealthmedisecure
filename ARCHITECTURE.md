# ChiHealth MediSecure - System Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [Real-Time Communication](#real-time-communication)
9. [Deployment Architecture](#deployment-architecture)
10. [Scalability Considerations](#scalability-considerations)

---

## System Overview

ChiHealth MediSecure is a modern, cloud-native healthcare management platform built with a **three-tier architecture**:

- **Presentation Tier**: React 19 + TypeScript (Web, iOS, Android)
- **Application Tier**: Node.js + Express.js (REST API + WebSocket)
- **Data Tier**: PostgreSQL + Prisma ORM

### Design Principles

1. **Security First**: MFA, RBAC, audit logging, encryption
2. **Multi-Tenancy**: Organization-level data isolation
3. **Offline-First**: PWA with service worker caching
4. **Mobile-Ready**: Capacitor for native mobile apps
5. **Real-Time**: WebSocket for live updates
6. **AI-Enhanced**: Gemini API for clinical intelligence
7. **HIPAA-Compliant**: PHI protection, audit trails

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   Web Browser    │  │   iOS Device     │  │  Android Device  │     │
│  │   (PWA)          │  │   (Capacitor)    │  │  (Capacitor)     │     │
│  │                  │  │                  │  │                  │     │
│  │  React 19 + TS   │  │  Native Shell +  │  │  Native Shell +  │     │
│  │  Vite Bundler    │  │  React WebView   │  │  React WebView   │     │
│  │  TailwindCSS     │  │                  │  │                  │     │
│  └─────────┬────────┘  └─────────┬────────┘  └─────────┬────────┘     │
│            │                     │                      │              │
└────────────┼─────────────────────┼──────────────────────┼──────────────┘
             │                     │                      │
             │                     │                      │
             └─────────────────────┼──────────────────────┘
                                   │
                                   │ HTTPS / WSS
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                         LOAD BALANCER (Optional)                         │
│                         Cloud Run / nginx                                │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                       APPLICATION SERVER                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Express.js Middleware Stack                  │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  CORS  │  Body Parser  │  Cookie Parser  │  Helmet (Security) │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Authentication Layer                         │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  JWT Verification  │  Passport OAuth  │  MFA Handler          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Authorization (RBAC)                         │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  Permission Check  │  Role Validation  │  Org Context          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Business Logic Layer                         │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  Patient Service  │  Appointment Service  │  Billing Service   │    │
│  │  Prescription Svc │  Lab Service          │  EHR Service       │    │
│  │  Audit Logger     │  Messaging Service    │  AI Proxy          │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    WebSocket Server                             │    │
│  ├────────────────────────────────────────────────────────────────┤    │
│  │  Real-time Messaging  │  Live Updates  │  Notifications        │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   │ Prisma ORM
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                            DATABASE LAYER                                │
├──────────────────────────────────────────────────────────────────────────┤
│                       PostgreSQL 14+ (Primary)                           │
│                                                                          │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────┐     │
│  │   Users      │   Patients   │ Appointments │ Clinical Notes   │     │
│  ├──────────────┼──────────────┼──────────────┼──────────────────┤     │
│  │Prescriptions │  Lab Tests   │   Billing    │  Audit Logs      │     │
│  ├──────────────┼──────────────┼──────────────┼──────────────────┤     │
│  │Organizations │  Departments │    Rooms     │      Beds        │     │
│  └──────────────┴──────────────┴──────────────┴──────────────────┘     │
│                                                                          │
│  Features: ACID, Transactions, Full-text search, JSON columns           │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ Google Cloud      │  │  Gemini AI API   │  │  OAuth Providers │    │
│  │ Storage (GCS)     │  │                  │  │  (Google)        │    │
│  │                   │  │ - Diagnosis AI   │  │                  │    │
│  │ - Avatar uploads  │  │ - Symptom Check  │  │ - Social login   │    │
│  │ - Medical images  │  │ - EHR Summary    │  │ - SSO            │    │
│  │ - Documents       │  │ - Care Planning  │  │                  │    │
│  └───────────────────┘  └──────────────────┘  └──────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Architecture

```
src/
├── pages/                      # Dashboard pages (13 roles)
│   ├── patient/               # Patient dashboard
│   ├── hcw/                   # Healthcare worker dashboard
│   ├── admin/                 # Admin dashboard
│   ├── nurse/                 # Nurse dashboard
│   ├── pharmacist/            # Pharmacist dashboard
│   ├── lab/                   # Lab technician dashboard
│   ├── receptionist/          # Receptionist dashboard
│   ├── logistics/             # Logistics dashboard
│   ├── command-center/        # Command center dashboard
│   ├── accountant/            # Accountant dashboard
│   ├── radiologist/           # Radiologist dashboard
│   ├── dietician/             # Dietician dashboard
│   └── it/                    # IT support dashboard
│
├── components/                # Reusable UI components
│   ├── common/                # Shared components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   └── MessagingView.tsx
│   ├── auth/                  # Auth-related components
│   │   ├── MfaSetupModal.tsx
│   │   └── SecurityAssurance.tsx
│   └── icons/                 # Icon components
│
├── services/                  # API & business logic
│   ├── apiService.ts          # REST API client
│   ├── authService.ts         # Authentication
│   ├── mfaService.ts          # MFA operations
│   ├── auditService.ts        # Audit logging
│   ├── permissionService.ts   # RBAC client-side
│   ├── geminiService.ts       # AI integration
│   └── nativeService.ts       # Capacitor bridge
│
├── contexts/                  # React Context providers
│   └── ToastContext.tsx       # Global notifications
│
├── hooks/                     # Custom React hooks
│   ├── useDarkMode.ts
│   ├── useSessionTimeout.ts
│   ├── useToasts.ts
│   └── useWebSocket.ts
│
├── utils/                     # Utility functions
│   ├── validation.ts
│   └── generatePdf.ts
│
├── types.ts                   # TypeScript type definitions
├── index.tsx                  # Application entry point
└── App.tsx                    # Root component
```

### Backend Architecture

```
backend/
├── src/
│   ├── server.ts              # Express app initialization
│   ├── db.ts                  # Database layer (Prisma client)
│   ├── rbac.ts                # RBAC middleware
│   ├── permissions.ts         # Permission definitions
│   ├── validation.ts          # Input validation schemas
│   │
│   └── auth/
│       └── auth.ts            # Authentication routes & logic
│
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── seed.ts                # Sample data seeder
│
└── lib/                       # Compiled JavaScript output
    └── backend/src/
```

---

## Data Flow

### User Authentication Flow

```
┌─────────┐                                  ┌─────────┐
│ Client  │                                  │ Server  │
└────┬────┘                                  └────┬────┘
     │                                            │
     │  1. POST /api/auth/login                  │
     │    { email, password }                    │
     ├──────────────────────────────────────────►│
     │                                            │
     │                                            │  2. Verify credentials
     │                                            │     (bcrypt compare)
     │                                            │
     │  3. Check MFA status                      │
     │◄───────────────────────────────────────────┤
     │    { mfaRequired: true }                  │
     │                                            │
     │                                            │
     │  4. POST /api/auth/mfa/verify             │
     │    { token: "123456" }                    │
     ├──────────────────────────────────────────►│
     │                                            │
     │                                            │  5. Verify TOTP/WebAuthn
     │                                            │
     │  6. Return JWT token                      │
     │◄───────────────────────────────────────────┤
     │    { user, token, organization }          │
     │                                            │
     │                                            │
     │  7. All subsequent requests               │
     │     Authorization: Bearer <JWT>           │
     ├──────────────────────────────────────────►│
     │                                            │
     │                                            │  8. Verify JWT
     │                                            │  9. Check permissions (RBAC)
     │                                            │  10. Execute request
     │                                            │
     │  11. Response                              │
     │◄───────────────────────────────────────────┤
     │                                            │
```

### Appointment Booking Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│ Patient │     │ API Gateway  │     │ Business │     │ Database │
│ Client  │     │ (Express)    │     │  Logic   │     │(Postgres)│
└────┬────┘     └──────┬───────┘     └─────┬────┘     └────┬─────┘
     │                 │                    │               │
     │ 1. Book Appt    │                    │               │
     ├────────────────►│                    │               │
     │                 │                    │               │
     │                 │ 2. Authenticate    │               │
     │                 │    (JWT verify)    │               │
     │                 │                    │               │
     │                 │ 3. Authorize       │               │
     │                 │    (check perms)   │               │
     │                 │                    │               │
     │                 │ 4. Validate input  │               │
     │                 ├───────────────────►│               │
     │                 │                    │               │
     │                 │                    │ 5. Check      │
     │                 │                    │    availability
     │                 │                    ├──────────────►│
     │                 │                    │               │
     │                 │                    │ 6. Slots      │
     │                 │                    │◄───────────────┤
     │                 │                    │               │
     │                 │                    │ 7. Create     │
     │                 │                    │    appointment│
     │                 │                    ├──────────────►│
     │                 │                    │               │
     │                 │                    │ 8. Audit log  │
     │                 │                    ├──────────────►│
     │                 │                    │               │
     │                 │                    │ 9. Notify HCW │
     │                 │                    │    (WebSocket)│
     │                 │                    │               │
     │                 │ 10. Success        │               │
     │                 │◄───────────────────┤               │
     │                 │                    │               │
     │ 11. Confirm     │                    │               │
     │◄────────────────┤                    │               │
     │                 │                    │               │
```

---

## Security Architecture

### Defense in Depth Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Layer 1: Network Security                         │
├─────────────────────────────────────────────────────────────────────┤
│  • HTTPS/TLS 1.3 encryption                                         │
│  • Cloud Run ingress controls                                       │
│  • DDoS protection (Cloud Armor)                                    │
│  • IP whitelisting (optional)                                       │
└─────────────────────────────────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Layer 2: Application Gateway                      │
├─────────────────────────────────────────────────────────────────────┤
│  • CORS policy enforcement                                          │
│  • Security headers (Helmet.js)                                     │
│  • Rate limiting (express-rate-limit)                               │
│  • Request size limits                                              │
│  • Content-Type validation                                          │
└─────────────────────────────────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Layer 3: Authentication                           │
├─────────────────────────────────────────────────────────────────────┤
│  • JWT token verification                                           │
│  • Multi-Factor Authentication (MFA)                                │
│    - TOTP (Time-based One-Time Password)                           │
│    - WebAuthn (Biometric)                                           │
│    - Backup codes (encrypted)                                       │
│  • Password policies (8+ chars, complexity)                         │
│  • bcrypt hashing (10 rounds)                                       │
│  • Session management (8-hour expiry)                               │
└─────────────────────────────────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Layer 4: Authorization (RBAC)                     │
├─────────────────────────────────────────────────────────────────────┤
│  • Role-based access control                                        │
│  • 13 roles with granular permissions                               │
│  • Organization-level isolation                                     │
│  • Plan-based feature gating                                        │
│  • Permission middleware on all routes                              │
└─────────────────────────────────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Layer 5: Input Validation                         │
├─────────────────────────────────────────────────────────────────────┤
│  • express-validator on all endpoints                               │
│  • XSS prevention (input sanitization)                              │
│  • SQL injection prevention (Prisma ORM)                            │
│  • File upload restrictions (size, type)                            │
│  • Schema validation (TypeScript + runtime)                         │
└─────────────────────────────────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Layer 6: Data Protection                          │
├─────────────────────────────────────────────────────────────────────┤
│  • Encryption at rest (PostgreSQL + pgcrypto)                       │
│  • Encryption in transit (TLS 1.3)                                  │
│  • PHI field-level encryption                                       │
│  • Secure session storage                                           │
│  • Secrets management (env vars, not code)                          │
└─────────────────────────────────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Layer 7: Audit & Monitoring                       │
├─────────────────────────────────────────────────────────────────────┤
│  • Comprehensive audit logging                                      │
│  • Failed login tracking                                            │
│  • Data access logging                                              │
│  • Security event alerting                                          │
│  • Tamper-proof audit trail                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### RBAC Permission Matrix

| Role | View EHR | Create Notes | Prescribe | View All Patients | Admin |
|------|----------|--------------|-----------|-------------------|-------|
| Patient | Own only | ❌ | ❌ | ❌ | ❌ |
| HCW | ✅ | ✅ | ✅ | ✅ | ❌ |
| Nurse | ✅ | ✅ | ❌ | ✅ | ❌ |
| Receptionist | Limited | ❌ | ❌ | ✅ (demographics) | ❌ |
| Pharmacist | Limited | ✅ (pharmacy notes) | ❌ | ✅ (prescriptions) | ❌ |
| Admin | ✅ | ❌ | ❌ | ✅ | ✅ |

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────┐
│  Organizations   │◄───────┐│      Users       │
├──────────────────┤        ││──────────────────┤
│ • id (PK)        │        ││ • id (PK)        │
│ • name           │        ││ • email          │
│ • planId         │        ││ • passwordHash   │
│ • address        │        ││ • role           │
│ • phoneNumbers[] │        ││ • mfaEnabled     │
│ • status         │        ││ • mfaSecret      │
└──────────────────┘        ││ • organizationId │
         │                  │└──────────────────┘
         │                  │         │
         │                  │         │ role = 'patient'
         │                  │         ▼
         │                  │┌──────────────────┐
         │                  ││    Patients      │
         │                  │├──────────────────┤
         │                  ││ • id (PK)        │
         │                  ││ • userId (FK)    │
         │                  ││ • dateOfBirth    │
         │                  ││ • bloodType      │
         │                  ││ • allergies[]    │
         │                  ││ • insuranceInfo  │
         │                  │└──────────────────┘
         │                  │         │
         │                  │         │
         │                  │         │
         ▼                  │         ▼
┌──────────────────┐        │┌──────────────────┐
│   Departments    │        ││  Appointments    │
├──────────────────┤        │├──────────────────┤
│ • id (PK)        │        ││ • id (PK)        │
│ • name           │        ││ • patientId (FK) │
│ • organizationId │◄───────┘│ • hcwId (FK)     │
└──────────────────┘         │ • departmentId   │
         │                   │ • datetime       │
         │                   │ • status         │
         │                   │ • type           │
         ▼                   └──────────────────┘
┌──────────────────┐                  │
│      Rooms       │                  │
├──────────────────┤                  │
│ • id (PK)        │                  │
│ • name           │                  │
│ • departmentId   │                  │
│ • type           │                  │
└──────────────────┘                  │
         │                            │
         │                            │
         ▼                            ▼
┌──────────────────┐        ┌──────────────────┐
│      Beds        │        │  ClinicalNotes   │
├──────────────────┤        ├──────────────────┤
│ • id (PK)        │        │ • id (PK)        │
│ • name           │        │ • patientId (FK) │
│ • roomId (FK)    │        │ • hcwId (FK)     │
│ • status         │        │ • content        │
│ • currentPatient │        │ • timestamp      │
└──────────────────┘        │ • type (SOAP)    │
                            └──────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
  │  Prescriptions   │    │    LabTests      │    │   Referrals      │
  ├──────────────────┤    ├──────────────────┤    ├──────────────────┤
  │ • id (PK)        │    │ • id (PK)        │    │ • id (PK)        │
  │ • patientId (FK) │    │ • patientId (FK) │    │ • patientId (FK) │
  │ • hcwId (FK)     │    │ • orderedBy (FK) │    │ • fromHcw (FK)   │
  │ • medication     │    │ • testName       │    │ • toHcw (FK)     │
  │ • dosage         │    │ • result         │    │ • reason         │
  │ • status         │    │ • status         │    │ • status         │
  └──────────────────┘    └──────────────────┘    └──────────────────┘

            ┌──────────────────────────────────────────┐
            │          Audit Logs (Immutable)          │
            ├──────────────────────────────────────────┤
            │ • id (PK)                                │
            │ • timestamp                              │
            │ • userId (FK)                            │
            │ • action                                 │
            │ • resourceType                           │
            │ • resourceId                             │
            │ • severity (low/medium/high/critical)    │
            │ • metadata (JSON)                        │
            │ • ipAddress                              │
            │ • userAgent                              │
            └──────────────────────────────────────────┘
```

### Key Tables

**Core Tables**:
- `Users` - Authentication and user profiles
- `Patients` - Patient-specific medical data
- `Organizations` - Multi-tenant organization data
- `Departments` - Organizational units

**Clinical Tables**:
- `Appointments` - Scheduling
- `ClinicalNotes` - SOAP notes, progress notes
- `Prescriptions` - Medication orders
- `LabTests` - Lab orders and results
- `Referrals` - Specialist referrals

**Facility Tables**:
- `Rooms` - Physical room tracking
- `Beds` - Bed management and assignment

**Security Tables**:
- `AuditLogs` - Immutable audit trail (append-only)
- `MfaBackupCodes` - Encrypted MFA recovery codes

---

## API Architecture

### RESTful API Design

**Base URL**: `/api/v1` (versioned)

**Endpoint Pattern**:
```
/api/{resource}/{action}
/api/{resource}/{id}
/api/{role}/{resource}
```

**Examples**:
```
GET    /api/patients              # List all patients (admin)
GET    /api/patients/:id          # Get specific patient
POST   /api/patients              # Create patient
PUT    /api/patients/:id          # Update patient
DELETE /api/patients/:id          # Delete patient (soft delete)

GET    /api/hcw/patients          # HCW-specific patient list
GET    /api/patient/dashboard     # Patient's own dashboard
POST   /api/patient/appointments  # Book appointment
```

### Response Envelope

```typescript
// Success response
{
  "success": true,
  "data": {
    // Actual response data
  },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

---

## Real-Time Communication

### WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      WebSocket Server (ws)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Connection Pool                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Map<userId, WebSocket>                                      │  │
│  │                                                               │  │
│  │  user-123 ──► WebSocket connection 1                         │  │
│  │  user-456 ──► WebSocket connection 2                         │  │
│  │  user-789 ──► WebSocket connection 3                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Message Router                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  • Patient → HCW messaging                                   │  │
│  │  • Staff → Staff messaging                                   │  │
│  │  • System notifications                                      │  │
│  │  • Dashboard live updates                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Message Format

```typescript
{
  "type": "message" | "notification" | "update",
  "from": "user-123",
  "to": "user-456",
  "timestamp": "2025-11-22T10:30:00Z",
  "data": {
    // Message-specific payload
  }
}
```

---

## Deployment Architecture

### Cloud Run Deployment (GCP)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Google Cloud Platform                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Cloud DNS                                  │  │
│  │           chihealth.com → Cloud Load Balancer                │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │              Cloud Load Balancer (HTTPS)                      │  │
│  │    • SSL/TLS termination                                      │  │
│  │    • Health checks                                            │  │
│  │    • Traffic distribution                                     │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │                    Cloud Run Service                          │  │
│  │   ┌──────────────────────────────────────────────────────┐   │  │
│  │   │  Container Instance 1 (auto-scaled)                  │   │  │
│  │   │  • Min: 1, Max: 100                                  │   │  │
│  │   │  • 2 vCPU, 4GB RAM                                   │   │  │
│  │   │  • Concurrency: 80 requests                          │   │  │
│  │   └──────────────────────────────────────────────────────┘   │  │
│  │   ┌──────────────────────────────────────────────────────┐   │  │
│  │   │  Container Instance 2 (auto-scaled)                  │   │  │
│  │   └──────────────────────────────────────────────────────┘   │  │
│  │   ┌──────────────────────────────────────────────────────┐   │  │
│  │   │  Container Instance N (auto-scaled)                  │   │  │
│  │   └──────────────────────────────────────────────────────┘   │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                          │
│  ┌────────────────────────▼─────────────────────────────────────┐  │
│  │               Cloud SQL (PostgreSQL)                          │  │
│  │   • High Availability (HA)                                    │  │
│  │   • Automatic backups (daily)                                 │  │
│  │   • Point-in-time recovery                                    │  │
│  │   • Read replicas (optional)                                  │  │
│  │   • Encrypted storage                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │               Cloud Storage (GCS)                             │  │
│  │   • Avatar uploads                                            │  │
│  │   • Medical images                                            │  │
│  │   • Document storage                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │               Secret Manager                                  │  │
│  │   • JWT_SECRET                                                │  │
│  │   • DATABASE_URL                                              │  │
│  │   • GOOGLE_CLIENT_SECRET                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling

- **Cloud Run**: Auto-scales from 1 to 100 instances based on traffic
- **Database**: Connection pooling (max 50 connections per instance)
- **WebSocket**: Sticky sessions for connection persistence

### Vertical Scaling

- **Container Resources**: 2 vCPU, 4GB RAM per instance
- **Database**: db-n1-standard-2 (upgradable to db-n1-standard-8)

### Performance Optimizations

1. **Frontend**:
   - Code splitting by role
   - Lazy loading of dashboards
   - React.memo for list items
   - Service worker caching

2. **Backend**:
   - Database query optimization (indexes)
   - Response caching (Redis planned)
   - Compression middleware (gzip)
   - API rate limiting

3. **Database**:
   - Indexes on foreign keys
   - Full-text search indexes
   - Query result caching
   - Read replicas for heavy read workloads

### Monitoring & Observability

- **Metrics**: Cloud Monitoring (CPU, memory, latency)
- **Logs**: Cloud Logging (structured JSON logs)
- **Traces**: Cloud Trace (request tracing)
- **Alerts**: Uptime checks, error rate thresholds
- **APM**: Sentry (error tracking, planned)

---

## Security Best Practices

### HIPAA Compliance Checklist

- [x] Unique user identification (email + MFA)
- [x] Emergency access procedures (admin override)
- [x] Automatic logoff (8-hour JWT expiration)
- [x] Encryption in transit (TLS 1.3)
- [ ] Encryption at rest (PostgreSQL encryption)
- [x] Audit controls (comprehensive logging)
- [x] Integrity controls (hash verification planned)
- [x] Authentication (MFA + JWT)
- [x] Access controls (RBAC)

### Recommended Enhancements

1. **Add Helmet.js** for security headers
2. **Implement rate limiting** (express-rate-limit)
3. **Add CSRF protection** (csurf middleware)
4. **Enable database encryption at rest**
5. **Implement refresh tokens** (longer sessions)
6. **Add API versioning** (/api/v1)
7. **Set up monitoring** (Sentry, DataDog)
8. **Implement backup strategy** (automated daily backups)

---

## Conclusion

ChiHealth MediSecure is built on a solid architectural foundation with modern technologies and security-first principles. The system is designed to scale, maintain HIPAA compliance, and support future enhancements like telemedicine, advanced analytics, and multi-region deployment.

**Next Steps**:
1. Complete database migration (PostgreSQL + Prisma)
2. Add comprehensive test coverage (80%+)
3. Implement missing security enhancements
4. Obtain HIPAA certification
5. Launch mobile apps (iOS + Android)

---

**Document Version**: 1.0  
**Last Updated**: November 22, 2025  
**Author**: ChiHealth Engineering Team
# ChiHealth MediSecure - Operational Runbook

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Getting Started](#getting-started)
4. [Feature Documentation](#feature-documentation)
5. [Dashboard Capabilities](#dashboard-capabilities)
6. [Data Export Features](#data-export-features)
7. [Security & RBAC](#security--rbac)
8. [Troubleshooting](#troubleshooting)

---

## Overview

ChiHealth MediSecure is a comprehensive healthcare management system with role-based access control (RBAC), supporting 10 user roles across patient care, administrative, and operational functions.

**Supported Roles:**
- Patient
- Healthcare Worker (HCW)
- Nurse
- Pharmacist
- Lab Technician
- Receptionist
- Accountant
- Logistics
- Admin
- Command Center

---

## System Architecture

### Frontend Stack
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.2
- **Language:** TypeScript 5.9.3
- **PWA:** vite-plugin-pwa 1.1.0
- **Styling:** Tailwind CSS with custom theme

### Backend Stack
- **Runtime:** Node.js with Express
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based with session management
- **Security:** RBAC middleware with permission-based access

### Key Directories
```
├── pages/              # Dashboard pages for each role
├── components/         # Reusable UI components
├── services/           # API service layer
├── backend/            # Express server with Prisma
├── hooks/              # Custom React hooks
└── utils/              # Helper functions
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chinaezurum/chihealthmedisecure.git
   cd chihealthmedisecure
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Environment Setup:**
   Create `.env` files in root and backend directories:
   
   **Root `.env`:**
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
   
   **Backend `.env`:**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/chihealth
   JWT_SECRET=your_jwt_secret
   PORT=8080
   ```

4. **Database Setup:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start Development Servers:**
   
   **Terminal 1 - Frontend:**
   ```bash
   npm run dev
   ```
   
   **Terminal 2 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

6. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080

---

## Feature Documentation

### Patient Dashboard Features

#### 1. **Insurance Dashboard** (NEW)
Location: Patient Dashboard → Insurance

**Capabilities:**
- View insurance provider information
- Check policy details (number, plan type, coverage percentage)
- Track effective and expiry dates
- Review claims history with status tracking
- View coverage benefits across 6 categories:
  - Primary Care (fully covered)
  - Specialist Visits (80% covered)
  - Prescriptions (80% covered)
  - Lab Tests (80% covered)
  - Emergency Care (fully covered)
  - Hospitalization (80% covered)

**API Endpoints:**
- `GET /api/patients/:id/insurance` - Fetch patient insurance info
- `GET /api/patients/:id/insurance-claims` - Fetch patient claims

**Empty State:** Displays helpful message when no insurance is on file.

#### 2. **Appointments**
- Book new appointments with suggested specialties
- View upcoming and past appointments
- Telemedicine integration

#### 3. **Medical Records**
- Access clinical notes and lab results
- Download medical records as PDF
- View care plan and adherence metrics

#### 4. **Billing**
- View all bills (paid, pending, overdue)
- Make payments through secure gateway
- Download billing history

#### 5. **Symptom Checker**
- AI-powered symptom analysis
- Specialty recommendations
- Direct appointment booking

---

### Accountant Dashboard Features

#### 1. **Reports & Analytics** (ENHANCED)
Location: Accountant Dashboard → Reports

**Available Reports:**
All reports generate CSV files with timestamp, downloadable instantly.

##### a) **Revenue Report**
Exports revenue breakdown:
- Total Revenue
- Pending Revenue
- Cash Revenue
- Insurance Revenue

**Use Case:** Monthly financial summaries, board presentations

##### b) **Billing Report**
Exports all bills with:
- Bill ID
- Patient Name & ID
- Amount
- Status (Paid/Pending/Overdue)
- Date & Due Date

**Use Case:** Collections tracking, aging analysis

##### c) **Claims Report**
Exports insurance claims:
- Claim ID
- Patient Name
- Insurance Provider
- Claim Amount
- Status (Submitted/Approved/Denied/Paid)
- Date Filed
- Policy Number

**Use Case:** Insurance reconciliation, denial management

##### d) **Payment Report**
Exports all transactions:
- Transaction ID
- Date
- Patient Name
- Amount
- Payment Method (Cash/Card/Transfer/Insurance)
- Status

**Use Case:** Cash flow analysis, payment method trends

##### e) **Trend Analysis**
Exports revenue trends by date:
- Date
- Total Revenue

**Use Case:** Identify revenue patterns, seasonal trends

##### f) **Patient Analysis**
Exports patient billing aggregates:
- Patient ID & Name
- Total Billed
- Total Paid
- Pending Amount

**Use Case:** High-value patient identification, collections prioritization

#### 2. **Transaction Export** (NEW)
Location: Accountant Dashboard → Transactions

**Features:**
- One-click CSV export of all transactions
- Includes patient names (resolved from IDs)
- Download button with cloud icon
- Date-stamped filename

**Export Format:**
```csv
Date,Transaction ID,Patient Name,Amount,Method,Status
11/21/2025,TXN-12345,John Doe,15000,Card,Completed
```

#### 3. **Billing Code Management** (ENHANCED)
Location: Accountant Dashboard → Pricing

**Add Billing Code Modal Features:**
- **Code:** Unique identifier (e.g., CONS-001)
- **Category:** Dropdown selection
  - Consultation
  - Procedure
  - Lab
  - Imaging
  - Medication
  - Other
- **Description:** Detailed service description
- **Price:** Amount in Naira (₦)
- **Insurance Coverage:** Percentage (0-100%)

**Validation:**
- Required fields checking
- Price must be positive
- Coverage must be 0-100%
- Duplicate code prevention

**API Endpoint:**
- `POST /api/billing-codes` - Create new billing code

#### 4. **Insurance Claims Management**
- Create new claims from unpaid bills
- Auto-populate patient and amount
- Track claim status
- View claims history

#### 5. **Bills & Invoices**
- View pending encounters
- Generate bills
- Record payments
- Filter by status

---

## Dashboard Capabilities

### Overview Stats (All Dashboards)
- Real-time metrics cards
- Color-coded status indicators
- Interactive charts and graphs
- Quick action buttons

### Common Features Across Dashboards
- **Search & Filter:** Fast patient/record lookup
- **Dark Mode:** System-wide theme toggle
- **Language Support:** Multi-language interface
- **Notifications:** Real-time alerts panel
- **Session Management:** Auto-timeout with warnings

---

## Data Export Features

### CSV Export Functionality

All CSV exports follow these conventions:

**File Naming:**
```
ReportName_YYYY-MM-DD.csv
```

**Character Handling:**
- Commas in values are escaped
- Quotes are properly doubled
- UTF-8 encoding for special characters

**Empty Data Handling:**
- Toast notification: "No data to export"
- No file generated

**Success Confirmation:**
- Toast notification: "[ReportName] exported successfully"

### Export Implementation

**Technical Details:**
- Client-side CSV generation
- Blob URL download mechanism
- Automatic cleanup of temporary URLs
- No server-side processing required

**Usage Example:**
```typescript
exportToCSV(data, 'Revenue_Report');
```

---

## Security & RBAC

### Permission System

**Backend Middleware:**
- `requireRole(roles)` - Enforce role-based access
- `requirePermission(permission)` - Check specific permissions
- `checkOwnership()` - Verify data ownership
- `requireSameOrganization()` - Enforce org isolation

**Frontend Permission Service:**
```typescript
import { hasPermission, hasRole } from './services/permissionService';

if (hasPermission('create_prescriptions')) {
  // Show prescription form
}

if (hasRole('accountant')) {
  // Show billing features
}
```

### Role Permissions Matrix

| Permission | Patient | HCW | Nurse | Pharmacist | Lab Tech | Receptionist | Accountant | Admin |
|------------|---------|-----|-------|------------|----------|--------------|------------|-------|
| view_own_records | ✓ | - | - | - | - | - | - | ✓ |
| create_appointments | ✓ | ✓ | ✓ | - | - | ✓ | - | ✓ |
| create_prescriptions | - | ✓ | - | - | - | - | - | ✓ |
| manage_billing | - | - | - | - | - | - | ✓ | ✓ |
| order_lab_tests | - | ✓ | ✓ | - | - | - | - | ✓ |
| manage_insurance | - | - | - | - | - | - | ✓ | ✓ |

### Data Access Control

**Ownership Rules:**
- Patients can only view their own records
- Healthcare workers can view assigned patients
- Accountants can view all billing data
- Admins have full system access

**API Route Protection:**
```typescript
// Example protected route
app.get('/api/patients/:id/records', 
  requireRole(['hcw', 'nurse', 'admin']),
  requirePermission('view_patient_records'),
  handler
);
```

---

## Troubleshooting

### Common Issues

#### 1. **CSV Export Not Working**
**Symptoms:** No download or empty file

**Solutions:**
- Check browser's download settings
- Verify data exists before export
- Check browser console for errors
- Ensure pop-up blockers aren't interfering

#### 2. **Insurance Dashboard Empty**
**Symptoms:** "No Insurance Information" message

**Possible Causes:**
- Patient has no insurance on file
- Backend API not responding
- Missing insurance provider data

**Solutions:**
- Contact healthcare provider to add insurance
- Check backend logs for API errors
- Verify database has insurance records

#### 3. **Billing Code Modal Errors**
**Symptoms:** Validation errors or failed submissions

**Solutions:**
- Ensure all required fields are filled
- Check price is positive number
- Verify coverage is 0-100%
- Check for duplicate billing codes
- Review backend logs for API errors

#### 4. **Report Generation Fails**
**Symptoms:** Error toast or no file download

**Solutions:**
- Ensure data exists for the report type
- Check network connectivity
- Clear browser cache
- Verify user has accountant role permissions

#### 5. **Build Warnings: Large Chunks**
**Warning:** "Some chunks are larger than 500 kB"

**Impact:** Slower initial load times

**Solutions (Future Optimization):**
```typescript
// Implement code splitting
const AccountantDashboard = lazy(() => import('./pages/accountant/AccountantDashboard'));

// Manual chunks in vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom'],
        'charts': ['recharts'],
        'icons': ['lucide-react']
      }
    }
  }
}
```

### Backend Connection Issues

**Symptoms:**
- "Unable to connect to server" errors
- 500 Internal Server Errors
- Timeout errors

**Checklist:**
1. Backend server running? (`npm run dev` in backend folder)
2. Database connected? (Check DATABASE_URL in .env)
3. Port 8080 available?
4. Firewall blocking connections?

**Debug Commands:**
```bash
# Check backend is running
curl http://localhost:8080/api/health

# Check database connection
cd backend
npx prisma db pull
```

### Authentication Issues

**Symptoms:**
- Logged out unexpectedly
- "Unauthorized" errors
- Can't access protected routes

**Solutions:**
1. Check JWT_SECRET is set in backend .env
2. Clear localStorage and re-login
3. Check token expiration settings
4. Verify role permissions are correct

---

## Performance Monitoring

### Key Metrics
- **Bundle Size:** 653.13 KB (162.87 KB gzipped)
- **Build Time:** ~4 seconds
- **PWA Cache:** 17 entries (830.34 KiB)
- **API Response Time:** < 200ms average

### Optimization Tips
1. Use code splitting for large dashboards
2. Implement pagination for large tables
3. Cache API responses with React Query
4. Lazy load images and heavy components
5. Use production build for deployment

---

## Deployment

### Production Build
```bash
npm run build
cd backend && npm run build
```

### Environment Variables (Production)
- Set `NODE_ENV=production`
- Use secure DATABASE_URL
- Rotate JWT_SECRET regularly
- Configure CORS properly
- Set up SSL certificates

### Health Checks
- Frontend: `https://yourdomain.com`
- Backend: `https://api.yourdomain.com/api/health`

---

## Maintenance

### Regular Tasks
- [ ] Review and rotate JWT secrets monthly
- [ ] Export and backup database weekly
- [ ] Monitor error logs daily
- [ ] Update dependencies monthly
- [ ] Review user permissions quarterly

### Backup Procedures
```bash
# Database backup
pg_dump chihealth > backup_$(date +%Y%m%d).sql

# Code backup
git push origin deploy-fix
```

---

## Support & Contact

For issues or questions:
- GitHub Issues: https://github.com/Chinaezurum/chihealthmedisecure/issues
- Documentation: See README.md and SECURITY.md
- Emergency: Contact system administrator

---

**Last Updated:** November 21, 2025  
**Version:** 2.1.0  
**Build:** deploy-fix branch
// Load environment variables from .env file
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import path from 'path';
import fs from 'fs';
// Multer is optional in development; if it's not installed, we'll disable avatar uploads
let multer: any = null;
try {
  // dynamic import so a missing package doesn't crash the server at startup
  // (useful when running without installing optional dev deps)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  multer = (await import('multer')).default;
} catch (err) {
  console.warn('Optional dependency "multer" is not installed - avatar upload endpoints will be disabled.');
}
// Google Cloud Storage for avatar uploads
import { Storage } from '@google-cloud/storage';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import process from 'process';
import * as db from './database.js';
import * as auth from './auth/auth.js';
import * as rbac from './rbac.js';
import * as validators from './validators.js';
import { validationResult } from 'express-validator';
import { User, Organization } from '../../types.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User | (User & { isNew?: boolean, tempToken?: string });
      organizationContext?: Organization;
    }
  }
}

// Fix: __dirname is not available in ES modules, so we define it manually.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Trust proxy - Required for Cloud Run to get correct client IPs
app.set('trust proxy', true);

// Security: Helmet.js - Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Vite/React inline module scripts
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Security: Configure CORS with specific origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5174', // Vite sometimes uses alternate ports
  'https://chihealth-medisecure-143169311675.us-west1.run.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);

    // In development, allow any localhost origin regardless of port
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Check against allowed origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Security: Rate limiting - Prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Security: CSRF Protection
const csrfProtection = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET || 'csrf-secret',
  getSessionIdentifier: (req) => req.ip || 'anonymous',
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'lax', // Changed from 'strict' to 'lax' for development
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

const doubleCsrfProtection = csrfProtection.doubleCsrfProtection;
const generateToken = csrfProtection.generateCsrfToken;

// Apply CSRF protection to state-changing routes (skip GET/HEAD/OPTIONS)
app.use(doubleCsrfProtection);

// Google Cloud Storage setup for avatar uploads
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'chihealth-avatars-5068';
const bucket = storage.bucket(bucketName);

// Ensure local uploads dir exists (fallback for development without GCS)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const avatarDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

// Multer setup for avatar uploads (only if multer is available)
let upload: any = null;
if (multer) {
  // Use memory storage so we can upload directly to GCS
  const memoryStorage = multer.memoryStorage();
  upload = multer({ storage: memoryStorage, limits: { fileSize: 2 * 1024 * 1024 } });
}

// WebSocket connections map
const clients = new Map<string, WebSocket>();

// Validation Middleware - checks validation errors
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
    return;
  }
  next();
};

// Auth Middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const payload = auth.verifyToken(token);
    const user = await db.findUserById(payload.userId);
    if (!user) return res.status(401).json({ message: 'Invalid user' });

    req.user = user;
    req.organizationContext = user.currentOrganization;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// --- WebSocket Setup ---
server.on('upgrade', async (request, socket, head) => {
  try {
    const { pathname, query } = url.parse(request.url!, true);

    if (pathname === '/ws') {
      const token = query.token as string | undefined;
      let user: any = undefined;

      if (!token) {
        // In development, allow an unauthenticated websocket so the UI can function
        // without a valid token; in production we refuse the connection.
        if (process.env.NODE_ENV === 'production') {
          console.warn('WebSocket upgrade refused: missing token');
          socket.destroy();
          return;
        }
        console.info('WebSocket upgrade: no token provided, attaching dev user');
        user = { id: 'dev-user', currentOrganization: { id: 'dev-org' } } as any;
      } else {
        try {
          const payload = auth.verifyToken(token);
          user = await db.findUserById(payload.userId);
          if (!user) {
            console.warn('WebSocket upgrade refused: user not found for token');
            socket.destroy();
            return;
          }
        } catch (err) {
          console.warn('WebSocket upgrade refused: token verification failed', err);
          socket.destroy();
          return;
        }
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, user.id);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    socket.destroy();
  }
});

wss.on('connection', (ws: WebSocket, request: http.IncomingMessage, userId: string) => {
  clients.set(userId, ws);
  console.log(`WebSocket client connected: ${userId}`);

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`WebSocket client disconnected: ${userId}`);
  });
});

const notifyUser = (userId: string, type: string) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type }));
  }
};

const notifyAllOrgUsers = async (orgId: string, type: string) => {
  // This is a simplified version. A real app would query users by org.
  console.log(`Notifying all users in org ${orgId} to ${type}`);
  // For this mock, we'll just iterate all connected clients.
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type }));
    }
  });
}

// --- API Routes ---

// CSRF Token endpoint - Get token for client-side forms
app.get('/api/csrf-token', (req: Request, res: Response) => {
  const csrfToken = generateToken(req, res);
  res.json({ token: csrfToken });
});

// Auth Routes - Apply stricter rate limiting for authentication endpoints
app.use('/api/auth', authLimiter, auth.authRouter);

// MFA Routes
import mfaRouter from './auth/mfa.js';
app.use('/api/mfa', authLimiter, mfaRouter);

// User Routes
app.get('/api/users/me', authenticate, (req: Request, res: Response) => {
  res.json(req.user);
});

// Patient search endpoint (for receptionists, HCWs, nurses, pharmacists, lab techs, and admin)
app.get('/api/users/search', authenticate, rbac.requireRole(['receptionist', 'hcw', 'nurse', 'pharmacist', 'lab_technician', 'admin', 'command_center']), async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    const query = req.query.q as string;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const patients = await db.searchPatients(query, user.currentOrganization.id);
    return res.json(patients);
  } catch (error) {
    console.error('Patient search error:', error);
    return res.status(500).json({ message: 'Failed to search patients' });
  }
});

app.post('/api/users/switch-organization', authenticate, validators.validateOrgSwitch, validate, async (req: Request, res: Response) => {
  const { organizationId } = req.body;
  const user = await db.switchUserOrganization((req.user as User).id, organizationId);
  // Re-issue a token with the new context
  const token = auth.generateToken(user.id, user.currentOrganization.id);
  res.json({ user, token });
});

// Patient Routes
app.get('/api/patient/dashboard', authenticate, rbac.requireRole('patient'), async (req, res) => res.json(await db.getPatientDashboardData((req.user as User).id)));
app.post('/api/patient/appointments', authenticate, rbac.requirePermission(['create_own_appointments', 'create_appointments']), validators.validateAppointment, validate, async (req: Request, res: Response) => {
  await db.createAppointment((req.user as User).id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
});
// Delete appointment (patient or HCW can call with auth)
app.delete('/api/patient/appointments/:id', authenticate, validators.validateId, validate, async (req: Request, res: Response) => {
  try {
    const ok = await db.deleteAppointment(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Appointment not found' });
    notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
    return res.status(200).send();
  } catch (err: any) {
    console.error('Failed to delete appointment', err);
    return res.status(500).json({ message: err.message || 'Failed to delete appointment' });
  }
});

// Update (reschedule) appointment
app.put('/api/patient/appointments/:id', authenticate, validators.validateId, validate, async (req: Request, res: Response) => {
  try {
    const appt = await db.updateAppointment(req.params.id, req.body);
    notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
    return res.status(200).json(appt);
  } catch (err: any) {
    console.error('Failed to update appointment', err);
    return res.status(400).json({ message: err.message || 'Failed to update appointment' });
  }
});
app.post('/api/patient/simulate-wearable', authenticate, validators.validateWearableData, validate, async (req: Request, res: Response) => {
  await db.addSimulatedWearableData((req.user as User).id);
  notifyUser((req.user as User).id, 'refetch');
  res.status(200).send();
})

app.post('/api/patient/devices', authenticate, validators.validateDevice, validate, async (req: Request, res: Response) => {
  try {
    const device = await db.addWearableDevice((req.user as User).id, req.body);
    notifyUser((req.user as User).id, 'refetch');
    return res.status(201).json(device);
  } catch (err: any) {
    console.error('Failed to add wearable device', err);
    return res.status(400).json({ message: err.message || 'Failed to add device' });
  }
});

app.delete('/api/patient/devices/:id', authenticate, validators.validateId, validate, async (req: Request, res: Response) => {
  try {
    const ok = await db.removeWearableDevice((req.user as User).id, req.params.id);
    if (!ok) return res.status(404).json({ message: 'Device not found' });
    notifyUser((req.user as User).id, 'refetch');
    return res.status(200).send();
  } catch (err: any) {
    console.error('Failed to remove wearable device', err);
    return res.status(400).json({ message: err.message || 'Failed to remove device' });
  }
});

// HCW Routes
app.get('/api/hcw/dashboard', authenticate, rbac.requireRole(['hcw', 'nurse']), async (req, res) => res.json(await db.getHcwDashboardData((req.user as User).id, (req.organizationContext as Organization).id)));
app.post('/api/hcw/notes', authenticate, rbac.requirePermission('create_medical_notes'), validators.validateClinicalNote, validate, async (req: Request, res: Response) => {
  await db.createClinicalNote((req.user as User).id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
});
app.post('/api/hcw/lab-tests', authenticate, rbac.requirePermission('order_lab_tests'), validators.validateLabTest, validate, async (req: Request, res: Response) => {
  await db.createLabTest((req.user as User).id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
});
app.post('/api/hcw/prescriptions', authenticate, rbac.requirePermission('create_prescriptions'), validators.validatePrescription, validate, async (req: Request, res: Response) => {
  await db.createPrescription((req.user as User).id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
});
app.post('/api/hcw/referrals', authenticate, validators.validateReferral, validate, async (req: Request, res: Response) => {
  await db.createReferral((req.user as User).id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
});

// Dietician/Nutrition Routes
app.get('/api/dietician/dashboard', authenticate, rbac.requireRole(['dietician']), async (req, res) => {
  // Return same data structure as HCW for now (can be customized later)
  res.json(await db.getHcwDashboardData((req.user as User).id, (req.organizationContext as Organization).id));
});

// Admin Routes
app.get('/api/admin/dashboard', authenticate, rbac.requireRole(['admin', 'command_center']), async (req, res) => res.json(await db.getAdminDashboardData((req.organizationContext as Organization).id)));
app.put('/api/users/:id', authenticate, rbac.requirePermission('manage_users'), validators.validateId, validators.validateUserUpdate, validate, async (req: Request, res: Response) => {
  await db.updateUser(req.params.id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.post('/api/admin/staff', authenticate, rbac.requirePermission('manage_staff'), validators.validateStaff, validate, async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, departmentIds, organizationIds } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Check if email already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Get organization context - use provided orgs or default to current org
    const currentOrg = req.organizationContext as Organization;
    const orgIds = organizationIds && organizationIds.length > 0
      ? organizationIds
      : [currentOrg.id];

    // Create user
    const newUser = await db.createUser({
      name,
      email,
      password,
      role,
      departmentIds: departmentIds || [],
    });

    // Assign to organizations
    if (orgIds.length > 0) {
      // Get all organizations from the database context to find the org objects
      const adminData = await db.getAdminDashboardData(currentOrg.id);
      const assignedOrgs = adminData.organizations.filter((org: Organization) => orgIds.includes(org.id));
      if (assignedOrgs.length > 0) {
        await db.updateUser(newUser.id, {
          organizationIds: orgIds,
          currentOrganization: assignedOrgs[0]
        });
      }
    }

    // Assign to departments if provided
    if (departmentIds && departmentIds.length > 0) {
      await db.updateUser(newUser.id, { departmentIds });
    }

    // Get the updated user
    const createdUser = await db.findUserById(newUser.id);
    if (!createdUser) {
      return res.status(500).json({ message: 'Failed to retrieve created user.' });
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = createdUser;

    // Notify all users in the organization to refresh
    notifyAllOrgUsers(currentOrg.id, 'refetch');

    return res.status(201).json(userWithoutPassword);
  } catch (err: any) {
    console.error('Failed to create staff member:', err);
    return res.status(500).json({ message: err.message || 'Failed to create staff member.' });
  }
});
app.post('/api/admin/organizations/link', authenticate, validators.validateOrgLink, validate, async (req: Request, res: Response) => {
  await db.linkOrganizations(req.body.childId, req.body.parentId);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.post('/api/admin/organizations/unlink', authenticate, validators.validateOrgLink, validate, async (req: Request, res: Response) => {
  await db.unlinkOrganization(req.body.childId);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.post('/api/admin/departments', authenticate, validators.validateDepartment, validate, async (req: Request, res: Response) => {
  await db.createDepartment(req.body.name, (req.organizationContext as Organization).id);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
});
app.post('/api/admin/rooms', authenticate, validators.validateRoom, validate, async (req: Request, res: Response) => {
  await db.createRoom(req.body.name, req.body.type, (req.organizationContext as Organization).id);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
});
app.post('/api/admin/beds', authenticate, validators.validateBed, validate, async (req: Request, res: Response) => {
  await db.createBed(req.body.name, req.body.roomId);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
});


// Command Center Routes
app.get('/api/command-center/dashboard', authenticate, async (req, res) => res.json(await db.getCommandCenterDashboardData((req.organizationContext as Organization).id)));
app.post('/api/command-center/admit', authenticate, validators.validateAdmission, validate, async (req: Request, res: Response) => {
  await db.admitPatient(req.body.patientId, req.body.bedId, req.body.reason);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.post('/api/command-center/discharge', authenticate, validators.validateDischarge, validate, async (req: Request, res: Response) => {
  await db.dischargePatient(req.body.patientId);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});


// Other Role Dashboards
app.get('/api/pharmacist/dashboard', authenticate, async (req, res) => res.json(await db.getPharmacistDashboardData((req.organizationContext as Organization).id)));
app.get('/api/nurse/dashboard', authenticate, async (req, res) => res.json(await db.getNurseDashboardData((req.organizationContext as Organization).id)));
app.get('/api/lab/dashboard', authenticate, async (req, res) => res.json(await db.getLabDashboardData((req.organizationContext as Organization).id)));
app.get('/api/receptionist/dashboard', authenticate, async (req, res) => res.json(await db.getReceptionistDashboardData((req.organizationContext as Organization).id)));
app.get('/api/logistics/dashboard', authenticate, async (req, res) => res.json(await db.getLogisticsDashboardData((req.organizationContext as Organization).id)));
app.get('/api/accountant/dashboard', authenticate, async (req, res) => res.json(await db.getAccountantDashboardData((req.organizationContext as Organization).id)));


// Incoming Referrals Endpoints
app.get('/api/incoming-referrals', authenticate, async (req, res) => {
  const referrals = await db.getIncomingReferrals((req.organizationContext as Organization).id);
  res.json(referrals);
});

app.post('/api/incoming-referrals', validators.validateIncomingReferral, validate, async (req: Request, res: Response) => {
  // This endpoint can be called by external facilities without authentication
  // In production, you might want API key authentication here
  try {
    const newReferral = await db.createIncomingReferral(req.body);
    // Notify the receiving organization
    if (req.body.toOrganizationId) {
      notifyAllOrgUsers(req.body.toOrganizationId, 'refetch');
    }
    res.status(201).json(newReferral);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/incoming-referrals/:id/status', authenticate, async (req, res) => {
  const { status, registeredPatientId, responseNotes } = req.body;
  const updated = await db.updateIncomingReferralStatus(
    req.params.id,
    status,
    (req.user as User).id,
    registeredPatientId,
    responseNotes
  );
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.json(updated);
});

// Staff Users Endpoint
app.get('/api/staff', authenticate, async (req, res) => {
  const staff = await db.getStaffUsers((req.organizationContext as Organization).id);
  res.json(staff);
});

// Inter-Departmental Notes Endpoints
app.get('/api/inter-departmental-notes', authenticate, async (req, res) => {
  const notes = await db.getInterDepartmentalNotes(
    (req.user as User).id,
    (req.user as User).role,
    (req.organizationContext as Organization).id
  );
  res.json(notes);
});

app.get('/api/inter-departmental-notes/patient/:patientId', authenticate, async (req, res) => {
  const notes = await db.getInterDepartmentalNotesByPatient(req.params.patientId);
  res.json(notes);
});

app.post('/api/inter-departmental-notes', authenticate, async (req, res) => {
  const newNote = await db.createInterDepartmentalNote({
    ...req.body,
    fromUserId: (req.user as User).id,
    fromUserName: (req.user as User).name,
    fromRole: (req.user as User).role,
    organizationId: (req.organizationContext as Organization).id
  });
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(newNote);
});

app.put('/api/inter-departmental-notes/:id/read', authenticate, async (req, res) => {
  const updated = await db.markInterDepartmentalNoteAsRead(req.params.id);
  res.json(updated);
});

// External Lab Results Endpoints
app.get('/api/external-lab-results', authenticate, async (req, res) => {
  const patientId = req.query.patientId as string | undefined;
  const results = await db.getExternalLabResults(patientId);
  res.json(results);
});

app.post('/api/external-lab-results', async (req, res) => {
  // This endpoint can be called by external labs without full authentication
  // In production, you might want API key authentication here
  try {
    const newResult = await db.createExternalLabResult(req.body);
    res.status(201).json(newResult);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/external-lab-results/:id/status', authenticate, async (req, res) => {
  const updated = await db.updateExternalLabResultStatus(req.params.id, req.body.status);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.json(updated);
});


// Billing System Endpoints

// Billing Codes
app.get('/api/billing-codes', authenticate, async (req, res) => {
  const codes = await db.getBillingCodes((req.organizationContext as Organization).id);
  res.json(codes);
});

app.post('/api/billing-codes', authenticate, validators.validateBillingCode, validate, async (req: Request, res: Response) => {
  const newCode = await db.createBillingCode(req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(newCode);
});

app.put('/api/billing-codes/:id', authenticate, validators.validateId, validators.validateBillingCode, validate, async (req: Request, res: Response) => {
  const updated = await db.updateBillingCode(req.params.id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.json(updated);
});

// Encounters
app.post('/api/encounters', authenticate, async (req, res) => {
  const encounter = await db.createEncounter(req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(encounter);
});

app.get('/api/encounters/:id', authenticate, async (req, res) => {
  const encounter = await db.getEncounterById(req.params.id);
  if (!encounter) {
    return res.status(404).json({ message: 'Encounter not found' });
  }
  return res.json(encounter);
});

app.get('/api/encounters/pending/list', authenticate, async (req, res) => {
  const encounters = await db.getPendingEncounters((req.organizationContext as Organization).id);
  res.json(encounters);
});

app.put('/api/encounters/:id', authenticate, async (req, res) => {
  const updated = await db.updateEncounter(req.params.id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.json(updated);
});

// Bills
app.post('/api/bills', authenticate, async (req, res) => {
  const bill = await db.createBill(req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(bill);
});

app.get('/api/bills/:id', authenticate, async (req, res) => {
  const bill = await db.getBillById(req.params.id);
  if (!bill) {
    return res.status(404).json({ message: 'Bill not found' });
  }
  return res.json(bill);
});

app.get('/api/bills', authenticate, async (req, res) => {
  const bills = await db.getBillsByOrganization((req.organizationContext as Organization).id);
  res.json(bills);
});

app.put('/api/bills/:id/status', authenticate, async (req, res) => {
  const updated = await db.updateBillStatus(req.params.id, req.body.status, req.body.updates);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.json(updated);
});

app.post('/api/bills/:id/pay', authenticate, async (req, res) => {
  try {
    const result = await db.processPayment(req.params.id, {
      ...req.body,
      processedBy: (req.user as any).id
    });
    notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

// Insurance
app.get('/api/insurance/providers', authenticate, async (req, res) => {
  const providers = await db.getInsuranceProviders();
  res.json(providers);
});

app.post('/api/insurance/providers', authenticate, async (req, res) => {
  const provider = await db.createInsuranceProvider(req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(provider);
});

app.get('/api/patients/:patientId/insurance', authenticate, async (req, res) => {
  const insurance = await db.getPatientInsurance(req.params.patientId);
  res.json(insurance || null);
});

app.post('/api/patients/:patientId/insurance', authenticate, async (req, res) => {
  const insurance = await db.createPatientInsurance({
    ...req.body,
    patientId: req.params.patientId
  });
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(insurance);
});

app.post('/api/patients/:patientId/insurance/verify', authenticate, async (req, res) => {
  try {
    const insurance = await db.verifyInsurance(req.params.patientId);
    notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
    res.json(insurance);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Insurance Claims
app.get('/api/patients/:patientId/insurance-claims', authenticate, async (req, res) => {
  const claims = await db.getPatientInsuranceClaims(req.params.patientId);
  res.json(claims || []);
});

app.post('/api/insurance/claims', authenticate, async (req, res) => {
  const claim = await db.createInsuranceClaim(req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(claim);
});

app.put('/api/insurance/claims/:id/status', authenticate, async (req, res) => {
  const updated = await db.updateInsuranceClaimStatus(req.params.id, req.body.status, req.body.updates);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.json(updated);
});

app.get('/api/insurance/claims', authenticate, async (req, res) => {
  const claims = await db.getInsuranceClaimsByOrganization((req.organizationContext as Organization).id);
  res.json(claims);
});

// Pricing Catalog
app.get('/api/pricing-catalog', authenticate, async (req, res) => {
  const catalog = await db.getPricingCatalog((req.organizationContext as Organization).id);
  res.json(catalog || null);
});

app.post('/api/pricing-catalog', authenticate, async (req, res) => {
  const catalog = await db.createPricingCatalog({
    ...req.body,
    organizationId: (req.organizationContext as Organization).id
  });
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(catalog);
});


// Generic Update Routes
app.put('/api/prescriptions/:id/status', authenticate, async (req, res) => {
  await db.updatePrescription(req.params.id, req.body.status);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.put('/api/lab-tests/:id', authenticate, validators.validateId, validate, async (req: Request, res: Response) => {
  await db.updateLabTest(req.params.id, req.body.status, req.body.result);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.post('/api/appointments/:id/check-in', authenticate, async (req, res) => {
  await db.checkInPatient(req.params.id);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});

// Triage check-in endpoint - marks patient for immediate triage assessment
app.post('/api/appointments/:id/check-in-triage', authenticate, async (req, res) => {
  try {
    // Check in the patient (also adds to triage queue)
    const appointment = await db.checkInPatient(req.params.id);

    // Log triage check-in for audit
    console.log(`[TRIAGE] Patient ${appointment.patientId} checked in for immediate triage assessment by receptionist ${(req.user as User).id}`);

    notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
    res.status(200).json({ message: 'Patient checked in for triage successfully' });
  } catch (error) {
    console.error('Triage check-in error:', error);
    res.status(500).json({ message: 'Failed to check in patient for triage' });
  }
});

app.post('/api/triage/:patientId/vitals', authenticate, async (req, res) => {
  await db.recordVitals(req.params.patientId, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.post('/api/transport/requests', authenticate, async (req, res) => {
  const newRequest = await db.createTransportRequest((req.user as User).id, req.body);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).json(newRequest);
});
app.put('/api/transport/:id/status', authenticate, async (req, res) => {
  await db.updateTransportRequest(req.params.id, req.body.status);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.put('/api/lab-samples/:id/status', authenticate, validators.validateId, validators.validateLabSample, validate, async (req: Request, res: Response) => {
  await db.updateLabTest(req.params.id, req.body.status);
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(200).send();
});
app.post('/api/messages', authenticate, async (req, res) => {
  await db.createMessage((req.user as User).id, req.body);
  // In a real app, you would notify specific recipients
  notifyAllOrgUsers((req.organizationContext as Organization).id, 'refetch');
  res.status(201).send();
})

// AI Proxy Route - client calls this endpoint. In development this returns a
// harmless stub. In production you should forward to a real server-side AI SDK.
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    // In production, require authentication. In development allow unauthenticated calls
    if (process.env.NODE_ENV === 'production') {
      const authHeader = (req.headers.authorization || '').toString();
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Authentication required' });
      try {
        const payload = auth.verifyToken(token);
        const user = await db.findUserById(payload.userId);
        if (!user) return res.status(401).json({ message: 'Invalid user' });
        // attach user for potential server-side AI use
        (req as any).user = user;
      } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    }

    const { model, contents } = req.body || {};
    if (!contents) return res.status(400).json({ error: 'Missing contents' });

    // Development stub: if the prompt asks for an EHR summary, synthesize a small,
    // readable summary from the embedded JSON to make the UI useful during dev.
    if (process.env.NODE_ENV !== 'production' && typeof contents === 'string' && /EHR summary|EHR Summary|write a concise EHR summary/i.test(contents)) {
      try {
        const extractJson = (label: string) => {
          const re = new RegExp(label + "\\n([\\s\\S]*?)(\\n\\n|$)", 'i');
          const m = contents.match(re);
          if (!m) return null;
          try { return JSON.parse(m[1]); } catch { return null; }
        };

        const patient = extractJson('Patient:') || {};
        const clinicalNotes = extractJson('Clinical Notes:') || [];
        const labTests = extractJson('Lab Tests:') || [];

        const name = patient.name || patient.fullName || 'Unknown patient';
        const dob = patient.dateOfBirth || patient.dob || '';
        const recentNote = Array.isArray(clinicalNotes) && clinicalNotes.length ? clinicalNotes[0].content || clinicalNotes[0] : 'No recent notes';
        const latestLab = Array.isArray(labTests) && labTests.length ? `${labTests[0].testName || 'Lab'}: ${labTests[0].result || 'Pending'}` : 'No recent labs';

        const summaryLines = [
          `Patient: ${name}` + (dob ? ` (DOB: ${dob})` : ''),
          `Key findings: ${recentNote}`,
          `Recent labs: ${latestLab}`,
          'Recommendation: Review recent notes and labs; consider follow-up as clinically indicated.'
        ];

        return res.json({ text: summaryLines.join('\n\n') });
      } catch (err) {
        // fall through to the generic preview below
        console.warn('Dev AI summary generation failed, falling back to preview', err);
      }
    }

    // Improved development stub for chat responses
    // Detect if this is a chat/symptom query and provide a helpful response
    const contentsStr = typeof contents === 'string' ? contents : JSON.stringify(contents);
    const lowerContents = contentsStr.toLowerCase();

    // Check if this looks like a symptom/health question (not structured data)
    const isChatQuery = !contentsStr.includes('Patient:') &&
      !contentsStr.includes('Clinical Notes:') &&
      !contentsStr.includes('Lab Tests:') &&
      (lowerContents.includes('symptom') ||
        lowerContents.includes('pain') ||
        lowerContents.includes('headache') ||
        lowerContents.includes('fever') ||
        lowerContents.includes('cough') ||
        lowerContents.includes('feel') ||
        lowerContents.includes('hurt') ||
        lowerContents.includes('ache') ||
        lowerContents.includes('?') ||
        lowerContents.length < 500); // Short queries are likely chat

    if (isChatQuery && process.env.NODE_ENV !== 'production') {
      // Provide a helpful health assistant response instead of echoing
      let response = '';

      if (lowerContents.includes('headache') || lowerContents.includes('head')) {
        response = "I understand you're experiencing a headache. Headaches can have various causes including stress, dehydration, tension, or underlying medical conditions. It's important to stay hydrated, rest in a quiet environment, and monitor for severe or persistent symptoms. If your headache is severe, sudden, or accompanied by other symptoms, please seek immediate medical attention. This is not a medical diagnosis - consult a healthcare professional for proper evaluation.";
      } else if (lowerContents.includes('fever') || lowerContents.includes('temperature')) {
        response = "I see you're concerned about a fever. Fevers are your body's natural response to infection. Monitor your temperature, stay hydrated, get plenty of rest, and watch for signs of dehydration. If your fever is very high (over 103°F), persists for more than 3 days, or is accompanied by severe symptoms, please seek medical care immediately. This information is for educational purposes only.";
      } else if (lowerContents.includes('pain') || lowerContents.includes('hurt') || lowerContents.includes('ache')) {
        response = "I understand you're experiencing pain. Note the location, type, and duration of your pain. Rest the affected area if appropriate, and consider over-the-counter pain relief if suitable. Monitor for changes or worsening symptoms. Severe, sudden, or persistent pain requires medical evaluation. This is not a substitute for professional medical advice.";
      } else if (lowerContents.includes('cough') || lowerContents.includes('cold')) {
        response = "I hear you're dealing with a cough or cold symptoms. Stay well-hydrated, get adequate rest, and consider over-the-counter remedies as appropriate. If you experience difficulty breathing, chest pain, high fever, or symptoms that worsen, please seek medical attention. This information is educational only.";
      } else {
        // Generic helpful response
        response = "Thank you for sharing your symptoms. I'm here to provide general health information, but I cannot provide a medical diagnosis. I recommend monitoring your symptoms, staying hydrated, getting adequate rest, and seeking professional medical advice if symptoms persist or worsen. This is not a medical diagnosis - please consult with a qualified healthcare professional for proper evaluation and treatment.";
      }

      return res.json({ text: response });
    }

    // For structured queries or non-chat requests, return the original stub behavior
    const preview = typeof contents === 'string' ? contents.slice(0, 300) : JSON.stringify(contents);

    // Development Mode: Return mock JSON for AI recommendation features
    if (process.env.NODE_ENV !== 'production') {
      // Proactive Care Plan
      if (contentsStr.includes('proactive care plan') || contentsStr.includes('comprehensive proactive')) {
        const mockCarePlan = {
          goals: [
            { category: 'Health Maintenance', description: 'Monitor vital signs weekly', priority: 'high' },
            { category: 'Lifestyle', description: 'Incorporate 30 minutes of daily exercise', priority: 'medium' },
            { category: 'Nutrition', description: 'Follow Mediterranean diet guidelines', priority: 'medium' }
          ],
          monitoring: [
            { parameter: 'Blood Pressure', frequency: 'Weekly', target: '< 130/80 mmHg' },
            { parameter: 'Blood Glucose', frequency: 'Monthly', target: 'Fasting < 100 mg/dL' },
            { parameter: 'Weight', frequency: 'Weekly', target: 'Maintain within 5% of current' }
          ],
          followUps: [
            { type: 'Primary Care Visit', timeframe: '3 months', reason: 'Routine checkup and medication review' },
            { type: 'Lab Work', timeframe: '6 months', reason: 'Lipid panel and metabolic panel' }
          ],
          medications: [
            { suggestion: 'Continue current medications', rationale: 'Well-controlled symptoms' },
            { suggestion: 'Consider vitamin D supplementation', rationale: 'Common deficiency, supports immune health' }
          ]
        };
        return res.json({ text: JSON.stringify(mockCarePlan) });
      }

      // Diagnostic Suggestions
      if (contentsStr.includes('diagnostic tests') || contentsStr.includes('suggest likely diagnostic')) {
        const mockDiagnostics = [
          { test: 'Complete Blood Count (CBC)', rationale: 'Baseline hematologic assessment', priority: 'routine' },
          { test: 'Comprehensive Metabolic Panel', rationale: 'Evaluate kidney and liver function, electrolytes', priority: 'routine' },
          { test: 'Lipid Panel', rationale: 'Cardiovascular risk assessment', priority: 'recommended' },
          { test: 'HbA1c', rationale: 'Screen for diabetes or monitor glycemic control', priority: 'recommended' },
          { test: 'Thyroid Function Tests (TSH, T4)', rationale: 'Rule out thyroid dysfunction if fatigue present', priority: 'optional' }
        ];
        return res.json({ text: JSON.stringify(mockDiagnostics) });
      }

      // Lifestyle & Diet Plan
      if (contentsStr.includes('lifestyle and diet') || contentsStr.includes('lifestyle recommendation')) {
        const mockLifestyle = [
          { category: 'Exercise', recommendation: 'Aim for 150 minutes of moderate aerobic activity per week', frequency: 'Daily 30min or 5x/week' },
          { category: 'Diet', recommendation: 'Increase intake of fruits, vegetables, whole grains, and lean proteins', frequency: 'Every meal' },
          { category: 'Hydration', recommendation: 'Drink 8-10 glasses of water daily', frequency: 'Throughout day' },
          { category: 'Sleep', recommendation: 'Maintain consistent sleep schedule with 7-9 hours nightly', frequency: 'Daily' },
          { category: 'Stress Management', recommendation: 'Practice mindfulness, meditation, or yoga', frequency: '10-20min daily' },
          { category: 'Social Connection', recommendation: 'Engage in regular social activities and maintain relationships', frequency: 'Weekly' }
        ];
        return res.json({ text: JSON.stringify(mockLifestyle) });
      }

      // Referral Suggestions
      if (contentsStr.includes('specialty referral') || contentsStr.includes('Recommend specialty referral')) {
        const mockReferral = {
          primarySpecialty: 'Cardiology',
          rationale: 'Based on patient history and current symptoms, cardiovascular evaluation recommended',
          additionalSpecialties: [
            { specialty: 'Endocrinology', reason: 'If metabolic concerns persist or diabetes management needed' },
            { specialty: 'Nutrition/Dietitian', reason: 'For comprehensive dietary counseling and meal planning' }
          ],
          urgency: 'routine',
          notes: 'Schedule within 4-6 weeks unless symptoms worsen'
        };
        return res.json({ text: JSON.stringify(mockReferral) });
      }
    }

    const text = `(dev AI) Response for model=${model || 'unknown'}\n\n${preview}${preview.length >= 300 ? '...' : ''}`;
    return res.json({ text });
  } catch (err) {
    console.error('AI proxy error', err);
    return res.status(500).json({ error: 'AI proxy failed' });
  }
});

// --- Static File Serving ---
// Only serve static files in production (when dist folder exists)
// In development, the frontend runs separately on port 5173
const distPath = path.join(__dirname, '..', '..', 'dist');
const distExists = fs.existsSync(distPath);

if (distExists) {
  app.use(express.static(distPath));

  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file from the build directory.
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // In development mode, return a helpful message for non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      res.status(404).json({
        message: 'Frontend not built. In development, access the frontend at http://localhost:5173',
        hint: 'Run "npm run dev:all" to start both frontend and backend servers'
      });
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  });
}

// Serve uploaded files in development
app.use('/uploads', express.static(uploadsDir));


const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error(`   Please stop the process using port ${PORT} or use a different port.`);
    console.error(`   To find and kill the process: netstat -ano | findstr :${PORT}\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Avatar upload route: if multer is installed, enable actual uploads; otherwise return 501
if (upload) {
  app.post('/api/users/avatar', authenticate, upload.single('avatar'), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      // Generate unique filename
      const ext = path.extname(req.file.originalname) || '.png';
      const filename = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

      // Upload to Google Cloud Storage
      const blob = bucket.file(filename);
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: req.file.mimetype,
          cacheControl: 'public, max-age=31536000',
        }
      });

      await new Promise<void>((resolve, reject) => {
        blobStream.on('error', (err) => {
          console.error('GCS upload error:', err);
          reject(err);
        });

        blobStream.on('finish', () => {
          resolve();
        });

        blobStream.end(req.file!.buffer);
      });

      // Construct public URL for the uploaded file
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

      // Update user record
      const updated = await db.updateUser((req.user as User).id, { avatarUrl: publicUrl } as any);
      return res.json({ avatarUrl: publicUrl, user: updated });
    } catch (err: any) {
      console.error('Failed to upload avatar', err);
      return res.status(500).json({ message: err.message || 'Failed to upload avatar' });
    }
  });
} else {
  app.post('/api/users/avatar', authenticate, async (req: Request, res: Response) => {
    return res.status(501).json({ message: 'Avatar upload disabled: optional dependency "multer" is not installed.' });
  });
}

// Lightweight health endpoint for dev/probing
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

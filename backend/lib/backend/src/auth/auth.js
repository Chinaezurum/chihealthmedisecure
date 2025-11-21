import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as db from '../db.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-super-secret-key-that-is-long';
const router = Router();
// --- Token Generation & Verification ---
export const generateToken = (userId, orgId) => {
    return jwt.sign({ userId, orgId }, JWT_SECRET, { expiresIn: '8h' });
};
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
// A simple in-memory store for new SSO users pending registration completion.
// In a production app, this would be a cache like Redis.
const ssoTempStore = new Map();
// Check if OAuth is properly configured
const isOAuthConfigured = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    return clientId && clientSecret &&
        clientId !== 'mock-client-id' &&
        clientSecret !== 'mock-client-secret' &&
        clientId.length > 10 &&
        clientSecret.length > 10;
};
// --- Passport Google SSO Strategy ---
// Only configure the strategy if valid credentials are provided
if (isOAuthConfigured()) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Use an explicit callback URL so the redirect_uri exactly matches the
        // value registered in the Google Cloud Console. Prefer an env var but
        // fall back to API_BASE_URL or localhost:8080 for development.
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        var _a;
        try {
            const email = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0].value;
            if (!email) {
                return done(new Error("No email found from Google profile."), undefined);
            }
            let user = await db.findUserByEmail(email);
            if (user) {
                // User exists, proceed to log them in
                return done(null, user);
            }
            else {
                // This is a new user. Create a temporary profile.
                const tempUser = {
                    name: profile.displayName,
                    email: email,
                    role: 'patient',
                };
                // Create a short-lived token to manage this temporary state
                const tempToken = jwt.sign({ email: tempUser.email }, JWT_SECRET, { expiresIn: '10m' });
                ssoTempStore.set(tempToken, tempUser);
                // Pass a special object to the callback handler to signify a new user
                return done(null, { isNew: true, tempToken });
            }
        }
        catch (error) {
            return done(error, undefined);
        }
    }));
}
else {
    console.warn('⚠️  Google OAuth is NOT properly configured.');
    console.warn('   Set these environment variables to enable OAuth:');
    console.warn('   - GOOGLE_CLIENT_ID');
    console.warn('   - GOOGLE_CLIENT_SECRET');
    console.warn('   - GOOGLE_CALLBACK_URL (optional)');
}
// Debugging: log the configured Google callback URL and OAuth status
console.info('Google OAuth callbackURL =', process.env.GOOGLE_CALLBACK_URL || `${process.env.API_BASE_URL || 'http://localhost:8080'}/api/auth/google/callback`);
console.info('Google OAuth configured:', isOAuthConfigured());
// --- Auth Routes ---
// OAuth configuration status endpoint
router.get('/oauth/status', (req, res) => {
    res.json({
        configured: isOAuthConfigured(),
        message: isOAuthConfigured()
            ? 'OAuth is properly configured'
            : 'OAuth is not configured. Please set valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
    });
});
// Local Email/Password Registration
router.post('/register', body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 8 }), body('fullName').not().isEmpty().trim().escape(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array().map(e => e.msg).join(', ') });
    }
    // Log the incoming body for debugging in development
    console.info('Register endpoint called with body:', req.body);
    const { fullName, email, password } = req.body;
    try {
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        const user = await db.createUser({ name: fullName, email, password, role: 'patient' });
        return res.status(201).json({ user });
    }
    catch (error) {
        console.error('Registration error:', error);
        const payload = { message: 'Server error during registration.' };
        if (process.env.NODE_ENV !== 'production')
            payload.detail = error.message || String(error);
        if (process.env.NODE_ENV !== 'production' && (error === null || error === void 0 ? void 0 : error.stack))
            payload.stack = error.stack;
        return res.status(500).json(payload);
    }
});
// Local Email/Password Login
router.post('/login', body('email').isEmail().normalizeEmail(), body('password').not().isEmpty(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid input.' });
    }
    const { email, password } = req.body;
    try {
        const user = await db.loginUser(email, password);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const token = generateToken(user.id, user.currentOrganization.id);
        return res.json({ user, token });
    }
    catch (error) {
        console.error('Login error:', error);
        const payload = { message: 'Server error during login.' };
        if (process.env.NODE_ENV !== 'production')
            payload.detail = error.message || String(error);
        if (process.env.NODE_ENV !== 'production' && (error === null || error === void 0 ? void 0 : error.stack))
            payload.stack = error.stack;
        return res.status(500).json(payload);
    }
});
// Register Organization & Admin
router.post('/register-org', async (req, res) => {
    const { orgData, adminData } = req.body;
    try {
        if (!orgData.name || !orgData.type || !adminData.name || !adminData.email || !adminData.password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const existingAdmin = await db.findUserByEmail(adminData.email);
        if (existingAdmin) {
            return res.status(409).json({ message: 'An admin with this email-already-in-use' });
        }
        const { organization, admin } = await db.createOrganizationAndAdmin(orgData, adminData);
        return res.status(201).json({ organization, admin: { id: admin.id, name: admin.name } });
    }
    catch (error) {
        console.error('Create org error:', error);
        const payload = { message: 'Failed to create organization.' };
        if (process.env.NODE_ENV !== 'production')
            payload.detail = error.message || String(error);
        if (process.env.NODE_ENV !== 'production' && (error === null || error === void 0 ? void 0 : error.stack))
            payload.stack = error.stack;
        return res.status(500).json(payload);
    }
});
// --- SSO Routes ---
router.get('/google', (req, res, next) => {
    if (!isOAuthConfigured()) {
        return res.status(503).json({
            message: 'OAuth is not configured on this server. Please contact your system administrator or use email/password login.',
            details: 'Missing or invalid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
        });
    }
    return passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});
router.get('/google/callback', (req, res, next) => {
    if (!isOAuthConfigured()) {
        return res.redirect('/?error=oauth_not_configured');
    }
    passport.authenticate('google', { failureRedirect: '/?error=sso_failed', session: false })(req, res, next);
}, (req, res) => {
    const user = req.user;
    if (user.isNew && user.tempToken) {
        // New user: redirect to the frontend to complete their profile
        res.redirect(`/?tempToken=${user.tempToken}&isNewUser=true`);
    }
    else {
        // Existing user: generate their auth token and send it to the frontend
        const token = generateToken(user.id, user.currentOrganization.id);
        res.redirect(`/?tempToken=${token}&isNewUser=false`);
    }
});
// Get temporary user data for the frontend's completion page
router.get('/sso/user-data', (req, res) => {
    const tempToken = req.query.tempToken;
    try {
        const tempUser = ssoTempStore.get(tempToken);
        if (!tempUser) {
            return res.status(404).json({ message: "Session expired or invalid." });
        }
        return res.json(tempUser);
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid token." });
    }
});
// Finalize SSO registration after user provides additional details
router.post('/sso/complete', async (req, res) => {
    const { tempToken, dateOfBirth } = req.body;
    if (!tempToken || !dateOfBirth) {
        return res.status(400).json({ message: 'Missing required information.' });
    }
    try {
        const tempUser = ssoTempStore.get(tempToken);
        if (!tempUser) {
            return res.status(401).json({ message: 'Your session has expired. Please try again.' });
        }
        // Finalize user creation in the database
        const newUser = await db.createUser({
            name: tempUser.name,
            email: tempUser.email,
            role: 'patient',
            dateOfBirth: dateOfBirth,
        });
        // Clean up the temporary store
        ssoTempStore.delete(tempToken);
        // Generate the final authentication token and send the response
        const token = generateToken(newUser.id, newUser.currentOrganization.id);
        return res.status(201).json({ user: newUser, token });
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to complete registration.' });
    }
});
export { router as authRouter };
//# sourceMappingURL=auth.js.map
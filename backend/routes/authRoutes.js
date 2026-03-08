const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const rateLimit = require('express-rate-limit'); // NEW: For brute-force protection
const { body, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// const { loginLimiter } = require('../middleware/rateLimiters'); // NEW: Rate limiter middleware

// Brute Force Protection for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

const setAuthCookie = (res, payload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Keep 1h expiry
    
    // NEW: Set HTTP-only cookie instead of returning token in response body
    res.cookie('token', token, {
        httpOnly: true, // Prevents client-side JavaScript access (XSS defense)
        secure: process.env.NODE_ENV === 'production', // NEW: Only send over HTTPS in production
        sameSite: 'Strict', // NEW: CSRF defense
        maxAge: 3600000, // 1 hour in milliseconds
    });
}



// Register User
router.post('/register', 
    // NEW: Input Validation using express-validator
    [
        body('username').notEmpty().trim().escape(),
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty().isLength({ min: 8 }).matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, "i").withMessage('Password must be at least 8 chars and include uppercase, lowercase, and numbers.'),
    ],
    async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        console.log('[AUTH] login attempt for', email, 'found user:', !!user, user && user._id ? user._id.toString() : null);
        if (user) return res.status(400).json({ msg: 'User already exists' });
        
        // Ensure only admins can register other admins (this route is public initially)
        // If this route is public, role should default to 'user'
        const assignedRole = 'user';
        // If you want an admin to create users with specific roles, that should be a separate admin route.
        // For public registration, always default to 'user'.
        
        user = new User({ username, email, password, role: assignedRole });
        await user.save();

        const payload = { user: { id: user.id, username: user.username, email: user.email, role: user.role } };
        // NEW: Set cookie instead of returning token in JSON
        setAuthCookie(res, payload);
        // jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        //     if (err) throw err;
        //     res.status(201).json({ token, user: payload.user }); // 201 Created
        // });
        res.status(201).json({ msg: 'Registration successful', user: payload.user }); // Respond with user data, no token
    } catch (err) {
        console.error(err.message);
        // NEW: Better production error handling
        const statusCode = err.code === 11000 ? 409 : 500; // 409 Conflict for unique constraint violations
        res.status(statusCode).send('Server error or duplicate entry.');
    }
});

// Login User
router.post('/login',
    //loginLimiter, // NEW: Apply rate limiting to login route
    // NEW: Input Validation
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty(),
    ],
    async (req, res) => {
        
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
        // Automatic temporary unlock handling using `lockedUntil`
        const lockMinutes = parseInt(process.env.ACCOUNT_LOCK_DURATION_MINUTES || '30', 10);
        const lockDurationMs = lockMinutes * 60 * 1000;

        // If there's a timed lock and it's expired, clear it (auto-unlock)
        if (user.lockedUntil && user.lockedUntil instanceof Date && user.lockedUntil.getTime() <= Date.now()) {
            user.isLocked = false;
            user.lockedUntil = null;
            user.failedLoginAttempts = 0;
            await user.save();
            console.info(`[AUTH] auto-unlocked account for ${email} (lockedUntil expired)`);
        }
        // const payload = { user: { id: user.id, username: user.username, email: user.email, role: user.role } };
        // jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            //     if (err) throw err;
            //     res.json({ token, user: payload.user });
            // });
            
            // NEW: Check for locked account before trying to compare password
            if (user.isLocked) {
                return res.status(403).json({ msg: 'Account is locked. Please reset your password or wait.' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('[AUTH] bcrypt.compare result for', email, isMatch);
            if (!isMatch) {
            // NEW: Brute-force defense logic
            user.failedLoginAttempts += 1;
            user.lastLoginAttempt = new Date();

            if (user.failedLoginAttempts >= 5) { // Lock after 5 attempts
                user.isLocked = true;
                user.lockedUntil = new Date(Date.now() + lockDurationMs);
                console.warn(`Account locked for email: ${email} until ${user.lockedUntil.toISOString()}`);
            }
            await user.save();

            // If just locked, return locked status
            if (user.isLocked) {
                return res.status(403).json({ msg: 'Account locked due to too many failed attempts. Try again later.' });
            }

            // NEW: Generic error message (Crucial for security)
            return res.status(400).json({ msg: 'Invalid Credentials' }); 
        }
        
        // NEW: Reset attempts on successful login
        user.failedLoginAttempts = 0;
        user.lastLoginAttempt = new Date();
        await user.save();
        
        const payload = { user: { id: user.id, username: user.username, email: user.email, role: user.role } };
        
        // NEW: Set cookie instead of returning token in JSON
        setAuthCookie(res, payload); 

        res.status(200).json({ msg: 'Login successful', user: payload.user }); // Respond with user data, no token
    } catch (err) {
        console.error(err.message);
        // NEW: Better production error handling
        res.status(500).send('Server error');
    }
});

// Google Login/Signup
router.post('/google', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let user = await User.findOne({ 
            $or: [
                { googleId: googleId },
                { email: email }
            ]
        });

        if (user) {
            // Update googleId if user was previously a local user
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Generate a unique username
            let baseUsername = name.replace(/\s+/g, '').toLowerCase();
            let username = baseUsername;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `${baseUsername}${Math.floor(Math.random() * 10000)}` || `${baseUsername}${counter++}`;
            }

            user = new User({
                username,
                email,
                googleId,
                profilePicture: picture,
                role: 'user'
            });
            await user.save();
        }

        const authPayload = { user: { id: user.id, username: user.username, email: user.email, role: user.role } };
        setAuthCookie(res, authPayload);

        res.status(200).json({ msg: 'Google login successful', user: authPayload.user });
    } catch (err) {
        console.error('[AUTH] Google auth error:', err.message);
        res.status(401).json({ msg: 'Google authentication failed' });
    }
});





// Local auth middleware for routes that need the token
const requireAuth = async (req, res, next) => {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ msg: 'No token found in cookies, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        // Re-check user lock status in DB to avoid stale token issues
        const dbUser = await User.findById(req.user.id).select('isLocked lockedUntil failedLoginAttempts');
        if (!dbUser) {
            res.clearCookie('token');
            return res.status(401).json({ msg: 'User not found' });
        }

        // Auto-unlock if lockedUntil has passed
        if (dbUser.lockedUntil && dbUser.lockedUntil instanceof Date && dbUser.lockedUntil.getTime() <= Date.now()) {
            dbUser.isLocked = false;
            dbUser.lockedUntil = null;
            dbUser.failedLoginAttempts = 0;
            await dbUser.save();
            return next();
        }

        if (dbUser.isLocked) return res.status(403).json({ msg: 'Account is locked. Please contact support.' });
        return next();
    } catch (err) {
        res.clearCookie('token');
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Get logged in user data (private route)
router.get('/user', requireAuth, async (req, res) => {
    try {
        // Fetch user, but now we *don't* need to select('-password') because the JWT payload is the source of truth
        const user = await User.findById(req.user.id).select('-password');
        // We use req.user from the decoded JWT payload for speed, but fetch DB for full profile/role check
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Lightweight session check: returns 204 No Content when session cookie is valid
router.get('/session', requireAuth, (req, res) => {
    // req.user is set by requireAuth middleware
    return res.sendStatus(204);
});

// NEW: Logout Route (for token revocation)
router.post('/logout', (req, res) => {
    // Clears the token cookie on the client side
    res.clearCookie('token', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'Strict' 
    });
    res.status(200).json({ msg: 'Logged out successfully' });
});




// Temporary OTP store (for dev; use Redis in production)
const otpSessions = {};

// POST: Request password reset OTP
router.post('/forgot-password-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Always respond the same to avoid info leak
        if (!user) return res.json({ message: 'If this email exists, an OTP has been sent.' });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpToken = crypto.randomBytes(32).toString('hex');

        // Store OTP securely (expires in 5 mins)
        otpSessions[otpToken] = { email, otp, expiresAt: Date.now() + 5 * 60 * 1000 };

        // Automatically delete OTP after expiry
        setTimeout(() => delete otpSessions[otpToken], 5 * 60 * 1000);

        // Configure mailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP - MyEdu',
            text: `Your OTP for password reset is ${otp}. It expires in 5 minutes.`,
        });

        // Set HttpOnly cookie
        res.cookie('otp_token', otpToken, {
            httpOnly: true,
            sameSite: 'Strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 5 * 60 * 1000,
        });

        res.json({ message: 'If this email exists, an OTP has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST: Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const otpToken = req.cookies.otp_token;
        const session = otpSessions[otpToken];

        if (!session || session.expiresAt < Date.now()) {
            delete otpSessions[otpToken];
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        if (session.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user = await User.findOne({ email: session.email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Optional: Validate new password strength
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        }

        user.password = newPassword; // pre-save hook hashes it
        await user.save();

        // Cleanup
        delete otpSessions[otpToken];
        res.clearCookie('otp_token');

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

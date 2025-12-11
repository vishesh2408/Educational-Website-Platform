
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');



const helmet = require('helmet'); // NEW: For setting security headers
const compression = require('compression'); // NEW: Gzip/deflate compression for responses
const path = require('path');
const rateLimit = require('express-rate-limit'); // NEW: For brute-force protection
const { body, validationResult } = require('express-validator'); // NEW: For input validation
const cookieParser = require('cookie-parser'); // NEW: For parsing cookies

// Import LangChain components
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');

const Topic = require('./models/Topic');
const Module = require('./models/Module');
const Course = require('./models/Course');
const User = require('./models/User');
const Notification = require('./models/Notification');
const Contest = require('./models/Contest');
const ForumPost = require('./models/ForumPost');
const ForumPremium = require('./models/ForumPremium');
const Quiz = require('./models/Quiz');
const Skill = require('./models/Skill');
const Track = require('./models/Track');
const Note = require('./models/Note');
const QuizAttempt = require('./models/QuizAttempt');
const UserProgress = require('./models/UserProgress');


const authRoutes = require('./routes/authRoutes');

const profileRoutes = require('./routes/profileRoutes');
const CourseRoutes = require('./routes/CourseRoutes');
const QuizeRoutes = require('./routes/QuizeRoutes');
const ContestRoutes = require('./routes/ContestRoutes');
const GeneratequizeRoutes = require('./routes/GeneratequizeRoutes');
const SocialRoutes = require('./routes/SocialRoutes');
const ForumRoutes = require('./routes/ForumRoutes');

const adminRoutes = require('./routes/adminRoutes');

// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(helmet()); // NEW: Sets various HTTP headers for security
// Configure CORS to allow credentials (for cookies) from the frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

app.use(cookieParser()); // NEW: Parse cookies from incoming requests

// // Brute Force Protection for Login
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Limit each IP to 5 login requests per windowMs
//   message: 'Too many login attempts from this IP, please try again after 15 minutes.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

app.use(express.json()); // Body parser for JSON


// Simple configurable logger
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const currentLevel = LOG_LEVELS[configuredLevel] !== undefined ? LOG_LEVELS[configuredLevel] : LOG_LEVELS.info;
const logger = {
    error: (...args) => { if (currentLevel >= LOG_LEVELS.error) console.error(...args); },
    warn: (...args) => { if (currentLevel >= LOG_LEVELS.warn) console.warn(...args); },
    info: (...args) => { if (currentLevel >= LOG_LEVELS.info) console.log(...args); },
    debug: (...args) => { if (currentLevel >= LOG_LEVELS.debug) console.debug(...args); },
};

// Simple API request logger for debugging route matching (respect LOG_LEVEL)
app.use('/api', (req, res, next) => {
    // Log as info by default. Set LOG_LEVEL=warn to silence info messages.
    logger.info(`[API] ${new Date().toISOString()} ${req.method} ${req.originalUrl} from ${req.ip}`);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// --- Database Schemas ---

// ✅ Register route
app.use('/api/auth', authRoutes);
// app.use('/upload', express.static('upload')); // serve profile images
// app.use('/api/profile', uploadPicRoute);

// app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/profile', profileRoutes);
// NOTE: CourseRoutes contains both public and user-protected endpoints.
// We'll mount CourseRoutes after auth middleware is declared so we can apply
// `authMiddleware` to `/api/user/*` paths at the server level (not inside route files).


// --- Middleware for Authentication and Authorization ---

// Middleware to verify JWT token (moved to separate module)
const authMiddleware = require('./middleware/authMiddleware');

// Middleware to authorize admin role
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied, admin privilege required' });
    }
    next();
};

// Apply authentication middleware to any '/api/user/*' requests.
// This keeps middleware mounting in server.js rather than inside route files.
app.use('/api/user', authMiddleware);

// Now mount CourseRoutes at '/api' so it serves public and user routes.
app.use('/api', CourseRoutes);

// Enable gzip/deflate compression for responses
app.use(compression());

// Serve uploaded profile images with a cache TTL (7 days)
app.use('/upload', express.static('upload', { maxAge: '7d' }));

// Serve frontend production build with caching for static assets
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '..', 'myedu', 'build');
    app.use(express.static(buildPath, {
        maxAge: '7d',
        setHeaders: (res, filePath) => {
            // If file name contains a long hex fingerprint, serve as immutable
            if (/\.[0-9a-f]{8,}\./.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
        }
    }));
}

// Temporary debug route to expose non-sensitive DB connection info
app.get('/api/debug/db-info', (req, res) => {
    try {
        const info = {
            dbName: mongoose.connection.name,
            host: mongoose.connection.host,
            readyState: mongoose.connection.readyState // 0 disconnected, 1 connected, etc.
        };
        res.json(info);
    } catch (err) {
        console.error('Debug route error:', err.message);
        res.status(500).json({ error: 'Could not read DB info', detail: err.message });
    }
});





app.use('/api/auth/register', authRoutes);
app.use('/api/auth/login', authRoutes);
app.use('/api/auth/user',authMiddleware, authRoutes);
app.use('/api/auth/logout', authRoutes);



// ✅ NEW/FIXED ADMIN ROUTES WITH EXPLICIT POPULATION

// Course Population Fix: Deep population of Modules and Topics
const adminRouteFactory = require('./routes/adminRoutes');
app.use('/api/admin/courses', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Course, 'courses', [{ path: 'modules', populate: { path: 'topics' } }]));
// Module Population Fix: Populate Topics on Module requests
app.use('/api/admin/modules', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Module, 'modules', ['topics']));

// Topic Population: Populate Quiz ID on Topic requests
app.use('/api/admin/topics', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Topic, 'topics', ['quizId']));

// keep the rest as it is
app.use('/api/admin/contests', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Contest, 'contests'));
app.use('/api/admin/forum-posts', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(ForumPost, 'forum-posts'));
// Admin CRUD for ForumPremium (pricing, features, free lists, limits)
// Extracted to a dedicated router for better organization
require('./routes/forummanagement')(app, authMiddleware, adminMiddleware);

// Forum premium admin endpoints moved to backend/routes/forummanagement.js
app.use('/api/admin/quizzes', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Quiz, 'quizzes'));
app.use('/api/admin/skills', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Skill, 'skills'));
app.use('/api/admin/tracks', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Track, 'tracks'));
app.use('/api/admin/notes', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Note, 'notes'));
// Admin CRUD for Users
app.use('/api/admin/users', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(User, 'users'));

// Admin utilities (sanitize preview, etc.)
app.use('/api/admin/util', authMiddleware, adminMiddleware, adminRouteFactory.adminUtilitiesRouter());


// --- Admin CRUD mounts (use factory from routes/adminRoutes.js) ---
const adminRoutesFactory = require('./routes/adminRoutes');

app.use('/api/admin/courses', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Course, 'courses', [{ path: 'modules', populate: { path: 'topics' } }]));
app.use('/api/admin/modules', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Module, 'modules', ['topics']));
app.use('/api/admin/topics', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Topic, 'topics', ['quizId']));
app.use('/api/admin/contests', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Contest, 'contests'));
app.use('/api/admin/forum-posts', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(ForumPost, 'forum-posts'));
// Forum premium admin endpoints are handled separately in routes/forummanagement
app.use('/api/admin/quizzes', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Quiz, 'quizzes'));
app.use('/api/admin/skills', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Skill, 'skills'));
app.use('/api/admin/tracks', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Track, 'tracks'));
app.use('/api/admin/notes', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Note, 'notes'));
app.use('/api/admin/users', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(User, 'users'));

// lightweight ping route for quick health checks
app.get('/api/ping', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});






// Mount ContestRoutes at the API root; the router defines '/public/contests'
app.use('/api', ContestRoutes);




// Social routes (handles `/api/user/*` paths)
app.use('/api', SocialRoutes);

// Admin: promote a user to staff
app.post('/api/admin/promote-to-staff', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { userId, staffProfile } = req.body;
        if (!userId) return res.status(400).json({ msg: 'userId is required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.role = 'staff';
        user.staffProfile = Object.assign({}, user.staffProfile || {}, staffProfile || {});

        await user.save();
        res.json({ msg: 'User promoted to staff', user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Staff dashboard (basic): returns recent posts and replies with staff highlights
app.get('/api/staff/dashboard', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'staff' && req.user.role !== 'admin') return res.status(403).json({ msg: 'Staff access required' });

        const staffId = req.user.id;

        // Return recent top-level posts with their replies; mark replies authored by this staff
        const topLevelPosts = await ForumPost.find({ parentId: null }).sort({ createdAt: -1 }).limit(50).populate('userId', 'username role');
        const response = [];

        for (const post of topLevelPosts) {
            // Normalize admin author display
            if (post.userId && typeof post.userId === 'object' && post.userId.role === 'admin') {
                post.userId.username = 'LearnBent';
            }
            const replies = await ForumPost.find({ parentId: post._id }).sort({ createdAt: 1 }).populate('userId', 'username role');
            // Ensure admin reply authors show LearnBent as well
            replies.forEach(r => {
                if (r.userId && typeof r.userId === 'object' && r.userId.role === 'admin') r.userId.username = 'LearnBent';
            });
            // flag replies authored by the staff
            const flaggedReplies = replies.map(r => ({
                _id: r._id,
                content: r.content,
                userId: r.userId,
                createdAt: r.createdAt,
                authoredByCurrentStaff: String(r.userId && r.userId._id) === String(staffId)
            }));

            response.push({ post, replies: flaggedReplies });
        }

        res.json({ dashboard: response });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Allow authenticated users (staff/admin) to reply to a top-level post via API
app.post('/api/forum-posts/:postId/replies', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;
        const { content, imageUrl } = req.body;

        if (!content || !content.trim()) return res.status(400).json({ msg: 'Reply content is required' });

        const parent = await ForumPost.findById(postId);
        if (!parent) return res.status(404).json({ msg: 'Parent post not found' });

        const reply = new ForumPost({
            content: content.trim(),
            imageUrl: imageUrl || null,
            parentId: parent._id,
            userId: userId,
            visibility: 'public',
        });

        await reply.save();

        // Populate the reply's userId so frontend receives author details (username, role, profilePicture)
        const populatedReply = await ForumPost.findById(reply._id).populate('userId', 'username role profilePicture');

        // Create a notification for the parent post author (if different)
        try {
            const parentAuthorId = parent.userId;
            if (parentAuthorId && String(parentAuthorId) !== String(userId)) {
                const notif = await Notification.create({
                    user: parentAuthorId,
                    actor: userId,
                    type: 'reply',
                    message: 'Someone replied to your post',
                    metadata: { postId: parent._id, replyId: reply._id }
                });
                await User.findByIdAndUpdate(parentAuthorId, { $push: { notifications: notif._id } });
            }
        } catch (nerr) {
            console.error('Notification create error for reply:', nerr.message);
        }

        res.status(201).json({ msg: 'Reply created', reply: populatedReply });
    } catch (err) {
        console.error('Create reply error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/forum-posts/top-contributors
// @desc    Get top forum contributors based on number of posts created
// @access  Public
app.get('/api/public/forum-posts/top-contributors', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10; // Default to top 10
        // Aggregate to count posts per user (only top-level posts, not replies)
        const contributorsWithDetails = await ForumPost.aggregate([
            { $match: { parentId: null } },
            { $group: { _id: '$userId', discussions: { $sum: 1 } } },
            { $sort: { discussions: -1 } },
            { $limit: limit },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $project: {
                id: '$_id',
                username: '$user.username',
                role: '$user.role',
                email: { $ifNull: ['$user.email', ''] },
                profilePicture: { $ifNull: ['$user.profilePicture', ''] },
                discussions: 1
            }}
        ]);

        // Map to final shape and override admin display name
        const mapped = contributorsWithDetails.map(c => ({
            id: c.id,
            name: c.role === 'admin' ? 'LearnBent' : (c.username || 'Unknown User'),
            email: c.email || '',
            profilePicture: c.profilePicture || '',
            discussions: c.discussions || 0
        }));

        res.json(mapped);
    } catch (err) {
        console.error('Error fetching top contributors:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/users
// @desc    Public list of users (profile pic, username, bio, role)
// @access  Public
app.get('/api/public/users', async (req, res) => {
    try {
        const users = await User.find().select('username role profilePicture bio staffProfile').lean();
        // Map staff bios to prefer staffProfile.bio when available
        const mapped = users.map(u => ({
            id: u._id,
            username: u.username || 'Unknown',
            role: u.role || 'user',
            profilePicture: u.profilePicture || '',
            bio: (u.role === 'staff' && u.staffProfile && u.staffProfile.bio) ? u.staffProfile.bio : (u.bio || '')
        }));
        res.json(mapped);
    } catch (err) {
        console.error('Error fetching public users:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/quizzes
// @desc    Get all quizzes (public)
// @access  Public
app.get('/api/public/quizzes', async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        res.json(quizzes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/skills
// @desc    Get all skills (public)
// @access  Public
app.get('/api/public/skills', async (req, res) => {
    try {
        const skills = await Skill.find();
        res.json(skills);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/public/pricing-plans
// @desc    Get available pricing plans
// @access  Public
app.get('/api/public/pricing-plans', async (req, res) => {
    try {
        // Count courses for each plan feature
        const totalCourses = await Course.countDocuments();
        const paidCourses = await Course.countDocuments({ type: 'paid' });
        const freeCourses = await Course.countDocuments({ type: 'free' });

        const plans = [
            {
                name: 'Starter',
                description: 'Perfect for beginners getting started',
                monthlyPrice: 29,
                yearlyPrice: 290,
                courseAccess: Math.min(50, freeCourses),
                totalCourses: totalCourses,
                features: [
                    `Access to ${Math.min(50, freeCourses)}+ courses`,
                    'Basic project templates',
                    'Community forum access',
                    'Email support',
                    'Certificate of completion',
                    'Mobile app access'
                ],
                isPopular: false,
                planType: 'starter'
            },
            {
                name: 'Professional',
                description: 'Most popular for serious learners',
                monthlyPrice: 59,
                yearlyPrice: 590,
                courseAccess: Math.floor(paidCourses * 0.6),
                totalCourses: totalCourses,
                features: [
                    `Access to ${Math.floor(paidCourses * 0.6)}+ courses`,
                    'Advanced project templates',
                    'Priority community support',
                    'Live Q&A sessions',
                    'Verified certificates',
                    'Career guidance',
                    'Coding challenges',
                    'GitHub integration'
                ],
                isPopular: true,
                planType: 'professional'
            },
            {
                name: 'Enterprise',
                description: 'For teams and organizations',
                monthlyPrice: 99,
                yearlyPrice: 990,
                courseAccess: totalCourses,
                totalCourses: totalCourses,
                features: [
                    'Access to all courses',
                    'Custom learning paths',
                    'Team management',
                    'Advanced analytics',
                    'Dedicated support',
                    'Custom integrations',
                    'White-label options',
                    'API access'
                ],
                isPopular: false,
                planType: 'enterprise'
            }
        ];

        res.json(plans);
    } catch (err) {
        console.error('Error fetching pricing plans:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/user/subscription/subscribe
// @desc    Subscribe user to a plan
// @access  Private (User)
app.post('/api/user/subscription/subscribe', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { planType, billingPeriod } = req.body; // planType: 'starter', 'professional', 'enterprise'

        if (!['starter', 'professional', 'enterprise'].includes(planType)) {
            return res.status(400).json({ msg: 'Invalid plan type' });
        }

        if (!['monthly', 'yearly'].includes(billingPeriod)) {
            return res.status(400).json({ msg: 'Invalid billing period' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Calculate end date
        const startDate = new Date();
        const endDate = new Date();
        if (billingPeriod === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Update user subscription
        user.subscription = {
            plan: planType,
            status: 'active',
            startDate: startDate,
            endDate: endDate,
            billingPeriod: billingPeriod,
            autoRenew: false
        };

        await user.save();

        res.json({ 
            msg: 'Subscription activated successfully',
            subscription: user.subscription
        });
    } catch (err) {
        console.error('Error subscribing user:', err.message);
        res.status(500).send('Server Error');
    }
});


// QuizeRoutes defines user quiz endpoints relative to '/api' (e.g. '/user/quizzes/attempt')
// We already apply `authMiddleware` to '/api/user' globally above, so mount the router at '/api'
app.use('/api', QuizeRoutes);






// Forum routes (public + authenticated)
app.use('/api', ForumRoutes);



app.use('/api/generate-quiz', authMiddleware, GeneratequizeRoutes);

// --- Server Start ---
const PORT = process.env.PORT || 3001; // Changed default port to 3001 as per common practice and frontend URL
// Temporary debug route to inspect active mongoose connection (dbName, host, readyState)
app.get('/api/debug/db-info', (req, res) => {
    try {
        const conn = mongoose.connection;
        const clientUrl = conn && conn.client && conn.client.s ? conn.client.s.url : null;
        res.json({
            readyState: conn.readyState, // 0 = disconnected, 1 = connected
            dbName: conn.name || null,
            host: conn.host || null,
            port: conn.port || null,
            clientUrl: clientUrl
        });
    } catch (err) {
        console.error('Debug route error:', err);
        res.status(500).json({ error: 'Failed to read DB connection info' });
    }
});

// Catch-all route for SPA - must be AFTER all API routes
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '..', 'myedu', 'build');
    app.get(/^\/(?!api).*/, (req, res) => {
        res.sendFile(path.join(buildPath, 'index.html'));
    });
}

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

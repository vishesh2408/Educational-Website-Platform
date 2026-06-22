
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
const Tutorial = require('./models/Tutorial');
const TutorialModule = require('./models/TutorialModule');
const TutorialTopic = require('./models/TutorialTopic');
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
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Order = require('./models/Order');
const { seedSubscriptionPlans } = require('./utils/seeder');


const authRoutes = require('./routes/authRoutes');

const profileRoutes = require('./routes/profileRoutes');
const CourseRoutes = require('./routes/CourseRoutes');
const QuizeRoutes = require('./routes/QuizeRoutes');
const ContestRoutes = require('./routes/ContestRoutes');
const GeneratequizeRoutes = require('./routes/GeneratequizeRoutes');
const SocialRoutes = require('./routes/SocialRoutes');
const ForumRoutes = require('./routes/ForumRoutes');
const PaymentRoutes = require('./routes/PaymentRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');

const adminRoutes = require('./routes/adminRoutes');
const adminUploadsRoutes = require('./routes/adminUploadsRoutes');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render/Vercel) for secure cookies

app.use(helmet()); // NEW: Sets various HTTP headers for security
// Configure CORS to allow credentials (for cookies) from the frontend
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://educational-website-platform.vercel.app',
    'https://educational-website-platform.onrender.com',
    process.env.FRONTEND_URL,
].filter(Boolean);

// Allow common preview domains so Vercel preview links work (and future custom domain)
const allowedOriginPatterns = [
    /^http:\/\/localhost(:\d+)?$/,
    /\.vercel\.app$/,
    /\.onrender\.com$/,
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const explicitlyAllowed = allowedOrigins.includes(origin);
        const patternAllowed = allowedOriginPatterns.some((pattern) => pattern.test(origin));

        if (explicitlyAllowed || patternAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(cookieParser()); // NEW: Parse cookies from incoming requests

// Capture raw request body for webhook HMAC signature verification.
// express.json() parses the body, and JSON.stringify(parsed) can produce
// different byte ordering than the original payload, breaking HMAC checks.
// This middleware stores the original raw buffer on req.rawBody.
app.use('/api/payment', express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// // Brute Force Protection for Login
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // Limit each IP to 5 login requests per windowMs
//   message: 'Too many login attempts from this IP, please try again after 15 minutes.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

app.use(express.json({ limit: '5mb' })); // Body parser for JSON
app.use(express.urlencoded({ limit: '5mb', extended: true }));


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

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB connected successfully');
    seedSubscriptionPlans().then(async () => {
        try {
            const result = await SubscriptionPlan.updateMany(
                { quizLimit: { $exists: false } },
                { $set: { quizLimit: 3 } }
            );
            if (result.modifiedCount > 0) {
                console.log(`Migration: Updated ${result.modifiedCount} subscription plans with default quizLimit.`);
            }
        } catch (migrationErr) {
            console.error('Migration failed:', migrationErr);
        }
    });
})
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

// Serve frontend production build with caching for static assets (only if build exists)
const fs = require('fs');
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '..', 'myedu', 'build');
    // Only serve static files if the build directory exists (for standalone backend deployments)
    if (fs.existsSync(buildPath)) {
        logger.info('Frontend build directory found, serving static files');
        app.use(express.static(buildPath, {
            maxAge: '7d',
            setHeaders: (res, filePath) => {
                // If file name contains a long hex fingerprint, serve as immutable
                if (/\.[0-9a-f]{8,}\./.test(filePath)) {
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                }
            }
        }));
    } else {
        logger.info('Frontend build directory not found, running as API-only backend');
    }
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


// Temporary debug route to expose deployment information
app.get('/api/debug/deploy-info', (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const { execSync } = require('child_process');

        let gitCommit = 'N/A';
        try {
            gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        } catch (e) {
            gitCommit = 'Exec failed: ' + e.message;
            // Try reading refs directly
            try {
                const gitHeadPath = path.join(__dirname, '.git', 'HEAD');
                if (fs.existsSync(gitHeadPath)) {
                    const headContent = fs.readFileSync(gitHeadPath, 'utf8').trim();
                    if (headContent.startsWith('ref:')) {
                        const refPath = path.join(__dirname, '.git', headContent.split(' ')[1]);
                        if (fs.existsSync(refPath)) {
                            gitCommit = fs.readFileSync(refPath, 'utf8').trim();
                        }
                    }
                }
            } catch (fsErr) {
                gitCommit += ' / FS check failed: ' + fsErr.message;
            }
        }

        let courseRoutesSize = -1;
        let courseRoutesLines = -1;
        let courseRoutesExists = false;
        try {
            const crPath = path.join(__dirname, 'routes', 'CourseRoutes.js');
            if (fs.existsSync(crPath)) {
                courseRoutesExists = true;
                const stats = fs.statSync(crPath);
                courseRoutesSize = stats.size;
                const content = fs.readFileSync(crPath, 'utf8');
                courseRoutesLines = content.split('\n').length;
            }
        } catch (err) {
            console.error(err);
        }

        // List files in routes directory
        let routesFiles = [];
        try {
            const routesDir = path.join(__dirname, 'routes');
            if (fs.existsSync(routesDir)) {
                routesFiles = fs.readdirSync(routesDir);
            }
        } catch (err) {
            console.error(err);
        }

        res.json({
            timestamp: new Date().toISOString(),
            gitCommit,
            courseRoutes: {
                exists: courseRoutesExists,
                size: courseRoutesSize,
                lines: courseRoutesLines,
            },
            routesFiles,
            env: {
                NODE_ENV: process.env.NODE_ENV,
                PORT: process.env.PORT,
            }
        });
    } catch (err) {
        console.error('Debug deploy-info route error:', err.message);
        res.status(500).json({ error: 'Could not read deploy info', detail: err.message });
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
app.use('/api/admin/tutorials', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Tutorial, 'tutorials', [{ path: 'modules', populate: { path: 'topics' } }]));
// Module Population Fix: Populate Topics on Module requests
app.use('/api/admin/modules', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Module, 'modules', ['topics']));
app.use('/api/admin/tutorial-modules', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(TutorialModule, 'tutorial-modules', ['topics']));

// Topic Population: Populate nested Quiz IDs on Topic articles
app.use('/api/admin/topics', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Topic, 'topics', ['articles.quizId']));
app.use('/api/admin/tutorial-topics', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(TutorialTopic, 'tutorial-topics', ['articles.quizId']));

// keep the rest as it is
app.use('/api/admin/contests', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Contest, 'contests'));
app.use('/api/admin/forum-posts', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(ForumPost, 'forum-posts'));
// Admin CRUD for ForumPremium (pricing, features, free lists, limits)
// Extracted to a dedicated router for better organization
require('./routes/forummanagement')(app, authMiddleware, adminMiddleware);

// Newsletter: public subscribe + admin management
require('./routes/newsletterRoutes')(app, authMiddleware, adminMiddleware);

// Forum premium admin endpoints moved to backend/routes/forummanagement.js
app.use('/api/admin/quizzes', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Quiz, 'quizzes'));
app.use('/api/admin/skills', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Skill, 'skills'));
app.use('/api/admin/tracks', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Track, 'tracks'));
app.use('/api/admin/notes', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(Note, 'notes'));
// Admin CRUD for Users
app.use('/api/admin/users', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(User, 'users'));
app.use('/api/admin/subscription-plans', authMiddleware, adminMiddleware, adminRouteFactory.createCrudRoutes(SubscriptionPlan, 'subscription-plans', ['freeFor.users']));

// Admin utilities (sanitize preview, etc.)
app.use('/api/admin/util', authMiddleware, adminMiddleware, adminRouteFactory.adminUtilitiesRouter());

// Admin uploads for embedding files/images in markdown notes
app.use('/api/admin/uploads', authMiddleware, adminMiddleware, adminUploadsRoutes);


// --- Admin CRUD mounts (use factory from routes/adminRoutes.js) ---
const adminRoutesFactory = require('./routes/adminRoutes');

app.use('/api/admin/courses', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Course, 'courses', [{ path: 'modules', populate: { path: 'topics' } }]));
app.use('/api/admin/tutorials', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Tutorial, 'tutorials', [{ path: 'modules', populate: { path: 'topics' } }]));
app.use('/api/admin/modules', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Module, 'modules', ['topics']));
app.use('/api/admin/tutorial-modules', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(TutorialModule, 'tutorial-modules', ['topics']));
app.use('/api/admin/topics', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Topic, 'topics', ['articles.quizId']));
app.use('/api/admin/tutorial-topics', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(TutorialTopic, 'tutorial-topics', ['articles.quizId']));
app.use('/api/admin/contests', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Contest, 'contests'));
app.use('/api/admin/forum-posts', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(ForumPost, 'forum-posts'));
// Forum premium admin endpoints are handled separately in routes/forummanagement
app.use('/api/admin/quizzes', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Quiz, 'quizzes'));
app.use('/api/admin/skills', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Skill, 'skills'));
app.use('/api/admin/tracks', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Track, 'tracks'));
app.use('/api/admin/notes', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(Note, 'notes'));
app.use('/api/admin/users', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(User, 'users'));
app.use('/api/admin/subscription-plans', authMiddleware, adminMiddleware, adminRoutesFactory.createCrudRoutes(SubscriptionPlan, 'subscription-plans', ['freeFor.users']));

// Admin: grant free access to a subscription plan
app.post('/api/admin/subscription-plans/grant-free', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { planId, userIdOrEmail } = req.body;
        if (!planId || !userIdOrEmail) {
            return res.status(400).json({ msg: 'planId and userIdOrEmail are required' });
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ msg: 'Subscription plan not found' });

        let user = null;
        if (mongoose.Types.ObjectId.isValid(userIdOrEmail)) {
            user = await User.findById(userIdOrEmail);
        }
        if (!user) {
            user = await User.findOne({ email: userIdOrEmail });
        }
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (!plan.freeFor) {
            plan.freeFor = { users: [] };
        }
        if (!plan.freeFor.users.map(String).includes(String(user._id))) {
            plan.freeFor.users.push(user._id);
            await plan.save();
        }

        const updatedPlan = await SubscriptionPlan.findById(planId).populate('freeFor.users', 'username email');
        res.json({ msg: 'Free access granted successfully', plan: updatedPlan });
    } catch (err) {
        console.error('Error granting free access:', err.message);
        res.status(500).send('Server Error');
    }
});

// Admin: revoke free access from a subscription plan
app.post('/api/admin/subscription-plans/revoke-free', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { planId, userId } = req.body;
        if (!planId || !userId) {
            return res.status(400).json({ msg: 'planId and userId are required' });
        }

        const plan = await SubscriptionPlan.findById(planId);
        if (!plan) return res.status(404).json({ msg: 'Subscription plan not found' });

        if (plan.freeFor && plan.freeFor.users) {
            plan.freeFor.users = plan.freeFor.users.filter(u => u.toString() !== userId.toString());
            await plan.save();
        }

        const updatedPlan = await SubscriptionPlan.findById(planId).populate('freeFor.users', 'username email');
        res.json({ msg: 'Free access revoked successfully', plan: updatedPlan });
    } catch (err) {
        console.error('Error revoking free access:', err.message);
        res.status(500).send('Server Error');
    }
});

// Admin: fetch payments (order history) list
app.get('/api/admin/payments', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'username email')
            .populate('planId', 'name planType isForumPremium')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('Error fetching payments for admin:', err.message);
        res.status(500).send('Server Error');
    }
});

// Admin: update payment (order detail)
app.put('/api/admin/payments/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { amount, status, billingPeriod, endDate } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { amount, status, billingPeriod, endDate: endDate ? new Date(endDate) : null },
            { new: true }
        ).populate('userId', 'username email')
         .populate('planId', 'name planType isForumPremium');

        if (!updatedOrder) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        res.json(updatedOrder);
    } catch (err) {
        console.error('Error updating payment for admin:', err.message);
        res.status(500).send('Server Error');
    }
});

// Admin: delete payment (order detail)
app.delete('/api/admin/payments/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        res.json({ msg: 'Order deleted successfully', id: req.params.id });
    } catch (err) {
        console.error('Error deleting payment for admin:', err.message);
        res.status(500).send('Server Error');
    }
});

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

// @route   GET /api/user/subscription/status
// @desc    Get user's current subscription status
// @access  Private (User)
app.get('/api/user/subscription/status', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('subscription');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ 
            subscription: user.subscription || { plan: 'free', status: 'inactive' }
        });
    } catch (err) {
        console.error('Error fetching subscription status:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// QuizeRoutes defines user quiz endpoints relative to '/api' (e.g. '/user/quizzes/attempt')
// We already apply `authMiddleware` to '/api/user' globally above, so mount the router at '/api'
app.use('/api', QuizeRoutes);






// Forum routes (public + authenticated)
app.use('/api', ForumRoutes);
app.use('/api', PaymentRoutes);
app.use('/api', supportTicketRoutes);



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

// Catch-all route for SPA - must be AFTER all API routes (only if build exists)
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, '..', 'myedu', 'build');
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        app.get(/^\/(?!api).*/, (req, res) => {
            res.sendFile(indexPath);
        });
    }
}

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

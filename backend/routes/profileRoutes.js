const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
//const authMiddleware = require('./server'); // Assuming you create this if not already done, or use the one from server.js
const User = require('../models/User'); // Adjust path if necessary

// --- Replicating Auth Middleware for route protection, as it was in server.js ---
// Since I can't see your actual middleware file, I'll redefine it based on your server.js context
// In a real setup, you should import it: const authMiddleware = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // Assuming token is sent in cookies
    if (!token) return res.status(401).json({ msg: 'No token found in cookies, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        if (req.user.isLocked) {
            return res.status(403).json({ msg: 'Account is locked. Please contact support.' });
        }
        next();
    } catch (err) {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('token', { 
            httpOnly: true, 
            secure: isProd, 
            sameSite: isProd ? 'None' : 'Lax' 
        });
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
// -------------------------------------------------------------------------------


// --- Validation for profile fields ---
const profileValidators = [
    body('bio').optional().trim().escape().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters.'),
    body('technicalSkills').optional().isArray().custom(arr => arr.every(s => typeof s === 'string' && s.trim().length > 0)).withMessage('technicalSkills must be an array of non-empty strings.'),
    body('softSkills').optional().isArray().custom(arr => arr.every(s => typeof s === 'string' && s.trim().length > 0)).withMessage('softSkills must be an array of non-empty strings.'),
    body('skillsToLearn').optional().isArray().custom(arr => arr.every(s => typeof s === 'string' && s.trim().length > 0)).withMessage('skillsToLearn must be an array of non-empty strings.'),
    body('projects').optional().isArray().withMessage('projects must be an array.'),
    body('extraCurricular').optional().isArray().custom(arr => arr.every(s => typeof s === 'string' && s.trim().length > 0)).withMessage('extraCurricular must be an array of non-empty strings.'),
    body('other').optional().trim().escape(),
];

// --- Profile Picture Upload (Base64 to DB) ---
const profilePicValidator = [
    authMiddleware,
    body('profilePictureBase64').optional().isString().withMessage('Profile picture must be a string (Base64).'),
    body('username').optional().trim().escape(),
    body('bio').optional().trim().escape(), // Re-include common fields if update is combined
];

// @route   GET api/profile/me
// @desc    Get current user's profile data (including all new fields)
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires');

        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (!user.activity) {
            user.activity = { lastActive: '', activeSessions: 0, totalMinutes: 0 };
        }
        user.activity.lastActive = new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
        await user.save();

        // Map project status for easier frontend handling if needed, but for now, send as is.
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST/PUT api/profile/update
// @desc    Update user profile information (Username, Bio, Skills, Projects, etc.)
// @access  Private
router.post('/update', authMiddleware, profileValidators, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, bio, technicalSkills, softSkills, skillsToLearn, projects, extraCurricular, other } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update fields if they are provided (and not null/empty string/array)
        if (username) user.username = username.trim();
        if (bio !== undefined) user.bio = bio;
        if (technicalSkills) user.technicalSkills = technicalSkills;
        if (softSkills) user.softSkills = softSkills;
        if (skillsToLearn) user.skillsToLearn = skillsToLearn;
        if (projects) user.projects = projects;
        if (extraCurricular) user.extraCurricular = extraCurricular;
        if (other !== undefined) user.other = other;

        await user.save();
        // Return public user data without password
        const updatedUser = await User.findById(req.user.id).select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires');

        res.json({ msg: 'Profile updated successfully', user: updatedUser });
    } catch (err) {
        console.error(err.message);
        // Handle unique constraint violation for username
        if (err.code === 11000 && err.keyPattern && err.keyPattern.username) {
            return res.status(409).json({ msg: 'Username is already taken.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/profile/picture
// @desc    Upload and save profile picture to DB (Base64)
// @access  Private
router.post('/picture', profilePicValidator, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { profilePictureBase64, username } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // 1. Update Profile Picture
        if (profilePictureBase64) {
            // In MongoDB, storing images directly as Base64 in a String field is possible,
            // but it's generally discouraged for large images due to BSON size limits (16MB for a document field).
            // Assuming the frontend sends a clean Base64 string without the 'data:image/...' prefix
            // or we strip it here for cleanliness. For a production app, use GridFS or a cloud service.
            
            // Check if it looks like a full Data URL and strip prefix if necessary
            let base64Data = profilePictureBase64;
            if (base64Data.startsWith('data:image/')) {
                base64Data = base64Data.split(',')[1];
            }
            
            user.profilePicture = base64Data;
        }
        
        // 2. Update username if provided (to combine operations)
        if (username) user.username = username.trim();

        await user.save();

        // Return success message and the new image data (or path if stored externally)
        res.json({ msg: 'Profile picture updated successfully', profilePicture: user.profilePicture, username: user.username });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile/picture
// @desc    Remove profile picture (set to default)
// @access  Private
router.delete('/picture', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.profilePicture = ''; // Reset to default/empty string
        await user.save();

        res.json({ msg: 'Profile picture removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- CRUD for Projects (Assuming projects are managed as an array within the user document) ---

// @route   POST api/profile/projects
// @desc    Add a new project
// @access  Private
router.post('/projects', authMiddleware, [
    body('title').notEmpty().trim().escape(),
    body('description').notEmpty().trim().escape(),
    body('status').notEmpty().trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, status } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const newProject = { title, description, status };
        user.projects.push(newProject);
        await user.save();

        // Return the *last* project added, which is the new one
        res.status(201).json({ msg: 'Project added', project: user.projects[user.projects.length - 1] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/projects/:projectId
// @desc    Update an existing project
// @access  Private
router.put('/projects/:projectId', authMiddleware, [
    body('title').optional().trim().escape(),
    body('description').optional().trim().escape(),
    body('status').optional().trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { projectId } = req.params;
    const updateFields = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const projectIndex = user.projects.findIndex(p => p._id.toString() === projectId);

        if (projectIndex === -1) return res.status(404).json({ msg: 'Project not found for this user' });

        // Merge existing project data with new fields
        user.projects[projectIndex] = { ...user.projects[projectIndex].toObject(), ...updateFields };

        await user.save();
        res.json({ msg: 'Project updated successfully', project: user.projects[projectIndex] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile/projects/:projectId
// @desc    Delete a project
// @access  Private
router.delete('/projects/:projectId', authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const initialLength = user.projects.length;
        user.projects = user.projects.filter(p => p._id.toString() !== projectId);

        if (user.projects.length === initialLength) {
            return res.status(404).json({ msg: 'Project not found for this user' });
        }

        await user.save();
        res.json({ msg: 'Project deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.post('/add-friend', authMiddleware, [
    body('friendName').notEmpty().trim().escape().withMessage('Friend name is required.'),
], async (req, res) => {        
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { friendName } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Check if friend already exists
        if (user.friends.some(friend => friend.name === friendName)) {
            return res.status(400).json({ msg: 'Friend already added' });
        }

        user.friends.push({ name: friendName });
        await user.save();

        res.status(201).json({ msg: 'Friend added successfully', friend: { name: friendName } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/settings
// @desc    Get user settings
// @access  Private
router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        // Return settings (fallback to defaults if undefined)
        const settings = user.settings || {
            emailNotifications: true,
            pushNotifications: true,
            theme: 'dark',
            language: 'English',
            location: ''
        };
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/profile/settings
// @desc    Update user settings
// @access  Private
router.post('/settings', authMiddleware, async (req, res) => {
    const { emailNotifications, pushNotifications, theme, language, location } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (!user.settings) user.settings = {};
        
        if (emailNotifications !== undefined) user.settings.emailNotifications = emailNotifications;
        if (pushNotifications !== undefined) user.settings.pushNotifications = pushNotifications;
        if (theme !== undefined) user.settings.theme = theme;
        if (language !== undefined) user.settings.language = language;
        if (location !== undefined) user.settings.location = location;

        await user.save();
        res.json({ msg: 'Settings updated successfully', settings: user.settings });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/profile/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authMiddleware, [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (user.googleId) {
            return res.status(400).json({ msg: 'Google login accounts cannot change password directly.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect.' });
        }

        user.password = newPassword; // Pre-save hook will hash it automatically
        await user.save();
        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
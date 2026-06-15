const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Course = require('./Course');
const Quiz = require('./Quiz');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Pending', 'Ongoing', 'Completed'], default: 'Pending' }
});

// FollowRequestSchema removed — using friendRequests arrays on the User model instead

const RelationshipSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const BlockSchema = new mongoose.Schema({
  blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blocked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: String,
  createdAt: { type: Date, default: Date.now },
});


const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Receiver
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who triggered it
  type: { type: String, enum: ['follow_request', 'accepted', 'rejected', 'blocked'], required: true },
  message: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const ActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: String,
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: function() { return !this.googleId; } },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    // New fields for user-specific data tracking (for Courses and Quizzes)
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    likedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    registeredContests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contest', default: [] }],

    // Profile picture
    profilePicture: { type: String, default: '' },

    project: [projectSchema],

    // Skills & Profile Details
    bio: { type: String, default: '' },
    technicalSkills: [{ type: String }],
    softSkills: [{ type: String }],
    skillsToLearn: [{ type: String }],
    projects: [{ title: String, description: String, status: String }],
    extraCurricular: [{ type: String }],
    other: { type: String },

    // --- ADDITIONS FOR ROBUSTNESS (Keep current logic) ---
    failedLoginAttempts: { type: Number, default: 0 },
    lastLoginAttempt: { type: Date },
    isLocked: { type: Boolean, default: false },
    // When locked due to too many failed attempts, this stores the unlock time
    lockedUntil: { type: Date, default: null },
    
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },


    // New fields for frontend
    activity: {
        lastActive: { type: String, default: '' },
        activeSessions: { type: Number, default: 0 },
        totalMinutes: { type: Number, default: 0 }
    },
    
    social: {
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        friends: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

        // Relationships
    followersList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followingList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Friend request arrays (store user ids)
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // (Using friend requests model — followRequests fields removed to avoid duplication)

    // Blocks
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Block' }],
    blockedByUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Block' }],

    // Notifications
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],

    // Activity logs
    activityLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ActivityLog' }]
    },

    // Staff-specific profile (only relevant when role === 'staff')
    staffProfile: {
      isVerified: { type: Boolean, default: false },
      bio: { type: String, default: '' },
      expertiseTags: [{ type: String }],
      hourlyRate: { type: Number, default: 0 },
      publicVisibility: { type: String, enum: ['public','friends'], default: 'friends' }
    },

    quizzesGenerated: { type: Number, default: 0 },

    // Subscription/Plan fields
    subscription: {
        plan: { 
            type: String, 
            enum: ['free', 'starter', 'professional', 'enterprise'], 
            default: 'free' 
        },
        status: { 
            type: String, 
            enum: ['active', 'cancelled', 'expired'], 
            default: 'active' 
        },
        startDate: { type: Date },
        endDate: { type: Date },
        billingPeriod: { 
            type: String, 
            enum: ['monthly', 'yearly'], 
            default: 'monthly' 
        },
        autoRenew: { type: Boolean, default: false }
    },
    settings: {
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
        language: { type: String, default: 'English' },
        location: { type: String, default: '' },
    }
});


// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
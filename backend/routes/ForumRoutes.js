const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ForumPost = require('../models/ForumPost');
const ForumPremium = require('../models/ForumPremium');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');





// Public forum routes and authenticated forum routes
// All paths here are relative to the API base (server mounts this router at '/api')

// @route   GET /public/forum-posts
// @desc    Get all forum posts that are visible to an unauthenticated user (public + admin posts)
// @access  Public
router.get('/public/forum-posts', async (req, res) => {
    try {
        const topLevelPosts = await ForumPost.find({ parentId: null }).populate('userId', 'username role profilePicture').sort({ createdAt: -1 });
        const allPostsAndReplies = [];

        for (const post of topLevelPosts) {
            if (post.userId && typeof post.userId === 'object' && post.userId.role === 'admin') {
                post.userId.username = 'LearnBent';
            }
            const author = post.userId || {};
            const isAuthorAdmin = author.role === 'admin';
            if (post.visibility === 'public' || post.visibility === 'admin' || isAuthorAdmin) {
                allPostsAndReplies.push(post);
                const replies = await ForumPost.find({ parentId: post._id }).sort({ createdAt: 1 }).populate('userId', 'username role profilePicture');
                replies.forEach(r => {
                    if (r.userId && typeof r.userId === 'object' && r.userId.role === 'admin') r.userId.username = 'LearnBent';
                });
                allPostsAndReplies.push(...replies);
            }
        }
        res.json(allPostsAndReplies);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Authenticated feed: GET /forum-posts/feed
router.get('/forum-posts/feed', authMiddleware, async (req, res) => {
    try {
        const currentUserId = req.user && req.user.id;
        const currentUser = currentUserId ? await User.findById(currentUserId).select('social.friends') : null;
        const friends = (currentUser && currentUser.social && currentUser.social.friends) ? currentUser.social.friends.map(String) : [];

        const topLevelPosts = await ForumPost.find({ parentId: null }).populate('userId', 'username role profilePicture').sort({ createdAt: -1 });
        const feed = [];

        for (const post of topLevelPosts) {
            if (post.userId && typeof post.userId === 'object' && post.userId.role === 'admin') {
                post.userId.username = 'LearnBent';
            }
            const author = post.userId || {};
            const authorIdStr = author._id ? String(author._id) : null;

            let include = false;
            if (post.visibility === 'public') include = true;
            if (author.role === 'admin') include = true;
            if (post.visibility === 'admin' && req.user && req.user.role === 'admin') include = true;
            if (post.visibility === 'friends') {
                if (authorIdStr && (authorIdStr === currentUserId || friends.includes(authorIdStr))) include = true;
            }

            if (include) {
                feed.push(post);
                const replies = await ForumPost.find({ parentId: post._id }).sort({ createdAt: 1 }).populate('userId', 'username role profilePicture');
                replies.forEach(r => {
                    if (r.userId && typeof r.userId === 'object' && r.userId.role === 'admin') r.userId.username = 'LearnBent';
                });
                feed.push(...replies);
            }
        }

        res.json(feed);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create top-level post (authenticated)
router.post('/forum-posts', authMiddleware, async (req, res) => {
    const { title, content, imageUrl, category, tags } = req.body;
    try {
        const userId = req.user && req.user.id;
        const user = userId ? await User.findById(userId).select('subscription email role') : null;
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const SubscriptionPlan = require('../models/SubscriptionPlan');
        const grantedPlan = await SubscriptionPlan.findOne({
            'freeFor.users': userId,
            active: true
        });

        const activePremium = await ForumPremium.findOne({ active: true }).lean();
        let isExempt = false;
        if (grantedPlan) isExempt = true;
        if (activePremium) {
            if (activePremium.freeFor && Array.isArray(activePremium.freeFor.users) && activePremium.freeFor.users.map(String).includes(String(userId))) isExempt = true;
            if (!isExempt && activePremium.freeFor && Array.isArray(activePremium.freeFor.roles) && user.role && activePremium.freeFor.roles.includes(user.role)) isExempt = true;
            if (!isExempt && activePremium.freeFor && Array.isArray(activePremium.freeFor.emails) && user.email && activePremium.freeFor.emails.includes(user.email)) isExempt = true;
        }

        const subscription = grantedPlan ? {
            plan: grantedPlan.planType,
            status: 'active',
            startDate: user.subscription?.startDate || new Date(),
            endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
            billingPeriod: 'yearly',
            autoRenew: false,
            grantedByAdmin: true,
            grantedPlanId: grantedPlan._id,
            isForumPremium: grantedPlan.isForumPremium
        } : (user.subscription || { plan: 'free', status: 'active' });

        if (!isExempt && subscription.plan === 'free' && subscription.status === 'active') return res.status(403).json({ msg: 'Subscription required to post. Please subscribe to a plan to access forum posting features.' });
        if (!isExempt && subscription.status === 'expired') return res.status(403).json({ msg: 'Your subscription has expired. Please renew your subscription to continue posting.' });

        if (!isExempt && activePremium && activePremium.postLimit && activePremium.postLimit > 0) {
            const userPostCount = await ForumPost.countDocuments({ userId: userId, parentId: null });
            if (userPostCount >= activePremium.postLimit) return res.status(403).json({ msg: `Post limit reached (${activePremium.postLimit}). Please contact admin or upgrade.` });
        }

        const newPost = new ForumPost({ title, content, userId: userId, imageUrl, category, tags, parentId: null });
        const post = await newPost.save();
        res.status(201).json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add a reply to a post
router.post('/forum-posts/:parentId/replies', authMiddleware, async (req, res) => {
    const { content, imageUrl } = req.body;
    const { parentId } = req.params;
    try {
        const parentPost = await ForumPost.findById(parentId);
        if (!parentPost) return res.status(404).json({ msg: 'Parent post not found' });

        const userId = req.user && req.user.id;
        const SubscriptionPlan = require('../models/SubscriptionPlan');
        const grantedPlan = await SubscriptionPlan.findOne({
            'freeFor.users': userId,
            active: true
        });

        const activePremium = await ForumPremium.findOne({ active: true }).lean();
        let isExempt = false;
        if (grantedPlan) isExempt = true;
        if (activePremium) {
            if (activePremium.freeFor && Array.isArray(activePremium.freeFor.users) && activePremium.freeFor.users.map(String).includes(String(userId))) isExempt = true;
            if (!isExempt && activePremium.freeFor && Array.isArray(activePremium.freeFor.roles)) {
                const user = await User.findById(userId).select('role');
                if (user && user.role && activePremium.freeFor.roles.includes(user.role)) isExempt = true;
            }
        }

        if (!isExempt && activePremium && activePremium.replyLimit && activePremium.replyLimit > 0) {
            const replyCount = await ForumPost.countDocuments({ userId: req.user && req.user.id, parentId: { $ne: null } });
            if (replyCount >= activePremium.replyLimit) return res.status(403).json({ msg: `Reply limit reached (${activePremium.replyLimit}). Please contact admin or upgrade.` });
        }

        const newReply = new ForumPost({ content, userId: req.user && req.user.id, imageUrl, parentId: parentId, category: parentPost.category, title: `Re: ${parentPost.title ? parentPost.title.substring(0, 50) + '...' : 'Untitled Post'}` });
        const reply = await newReply.save();
        res.status(201).json(reply);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Like/unlike a post
router.put('/forum-posts/like/:postId', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;
        const post = await ForumPost.findById(postId);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        const isLiked = post.likedBy.map(String).includes(String(userId));
        if (isLiked) {
            post.likedBy = post.likedBy.filter(id => String(id) !== String(userId));
        } else {
            post.likedBy.push(userId);
        }
        post.likes = post.likedBy.length;

        await post.save();
        res.json({ msg: isLiked ? 'Post unliked' : 'Post liked', likes: post.likes, likedBy: post.likedBy, postId: post._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark/unmark a reply as solution
router.put('/forum-posts/mark-solution/:postId/:replyId', authMiddleware, async (req, res) => {
    try {
        const { postId, replyId } = req.params;
        const userId = req.user && req.user.id;

        const post = await ForumPost.findById(postId);
        const reply = await ForumPost.findById(replyId);
        if (!post) return res.status(404).json({ msg: 'Original post not found' });
        if (!reply) return res.status(404).json({ msg: 'Reply not found' });

        if (String(post.userId) !== String(userId)) return res.status(403).json({ msg: 'Unauthorized: Only the original poster can mark a solution.' });
        if (!reply.parentId || reply.parentId.toString() !== postId) return res.status(400).json({ msg: 'Invalid request: Provided reply is not a reply to this post.' });

        if (post.solutionId && post.solutionId.toString() === replyId) {
            post.solutionId = null;
            await post.save();
            return res.json({ msg: 'Solution unmarked successfully', solutionId: null, postId: post._id });
        }

        post.solutionId = replyId;
        await post.save();
        res.json({ msg: 'Solution marked successfully', solutionId: replyId, postId: post._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Configure Multer for Forum Post Image Uploads
const UPLOAD_FORUM_ROOT = path.join(__dirname, '..', 'upload', 'forum');

function ensureForumUploadDir() {
  try {
    fs.mkdirSync(UPLOAD_FORUM_ROOT, { recursive: true });
  } catch (e) {
    // ignore
  }
}

const forumStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureForumUploadDir();
    cb(null, UPLOAD_FORUM_ROOT);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueId}${ext}`);
  },
});

const forumUpload = multer({
  storage: forumStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Upload an image attachment for forum posts (authenticated)
router.post('/forum-posts/upload-image', authMiddleware, forumUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const urlPath = `/upload/forum/${req.file.filename}`;
    return res.json({
      url: urlPath,
      msg: 'Image uploaded successfully'
    });
  } catch (err) {
    console.error('Forum image upload error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const Course = require('../models/Course');
const Track = require('../models/Track');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Tutorial = require('../models/Tutorial');
// Routes below are expressed relative to the API base (server mounts this router at '/api')





// @route   GET /user/progress/:courseId
// @desc    Get user progress for a specific course
// @access  Private (User)
router.get('/user/progress/:courseId', async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;

        const progress = await UserProgress.findOne({ userId, courseId });
        // If progress doesn't exist, return a default/empty object
        if (!progress) {
            return res.json({
                userId,
                courseId,
                globalStartTime: null,
                totalTimeSpent: 0,
                lastViewedTopicId: null,
                topicProgress: []
            });
        }
        res.json(progress);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST /user/progress/view-topic/:courseId/:topicId
// @desc    Update user progress (last viewed topic and start timer)
// @access  Private (User)
router.post('/user/progress/view-topic/:courseId/:topicId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { courseId, topicId } = req.params;
        const { isCompleted, timeSpentOnTopic } = req.body; // New data to save

        let progress = await UserProgress.findOne({ userId, courseId });

        if (!progress) {
            progress = new UserProgress({
                userId,
                courseId,
                globalStartTime: new Date(),
                topicProgress: []
            });
        }

        // 1. Update overall course timers/resume
        progress.lastViewedTopicId = topicId;
        // Logic to update global timer (in a real app, this would be handled with periodic check-ins)
        // For simplicity here, we'll just track the last viewed ID.

        // 2. Update topic-specific progress
        let topicEntry = progress.topicProgress.find(p => p.topicId.toString() === topicId);

        if (!topicEntry) {
            topicEntry = { topicId, isCompleted: isCompleted || false, timeSpent: timeSpentOnTopic || 0 };
            progress.topicProgress.push(topicEntry);
        } else {
            topicEntry.lastViewed = new Date();
            if (isCompleted !== undefined) {
                topicEntry.isCompleted = isCompleted;
            }
            if (timeSpentOnTopic) {
                topicEntry.timeSpent += timeSpentOnTopic; // Accumulate time
            }
        }
        
        await progress.save();
        res.json({ msg: 'Progress updated successfully', progress });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});




router.get('/user/subscription/status', async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('subscription');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if subscription is expired
        if (user.subscription && user.subscription.endDate) {
            const now = new Date();
            if (new Date(user.subscription.endDate) < now && user.subscription.status === 'active') {
                user.subscription.status = 'expired';
                await user.save();
            }
        }

        // Check if the user is granted free access in any active SubscriptionPlan
        const SubscriptionPlan = require('../models/SubscriptionPlan');
        const grantedPlan = await SubscriptionPlan.findOne({
            'freeFor.users': userId,
            active: true
        });

        if (grantedPlan) {
            return res.json({
                subscription: {
                    plan: grantedPlan.planType,
                    status: 'active',
                    startDate: user.subscription?.startDate || new Date(),
                    endDate: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // far future
                    billingPeriod: 'yearly',
                    autoRenew: false,
                    grantedByAdmin: true,
                    grantedPlanId: grantedPlan._id,
                    isForumPremium: grantedPlan.isForumPremium
                }
            });
        }

        res.json({ subscription: user.subscription || { plan: 'free', status: 'active' } });
    } catch (err) {
        console.error('Error fetching subscription status:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /public/tracks
// @desc    Get all tracks (public)
// @access  Public
router.get('/public/tracks', async (req, res) => {
    try {
        const tracks = await Track.find();
        res.json(tracks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- User-specific API Routes (Protected by authMiddleware) ---

// @route   POST /user/courses/enroll/:courseId
// @desc    Enroll a user in a course
// @access  Private (User)
router.post('/user/courses/enroll/:courseId', async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;

        const user = await User.findById(userId);
        const course = await Course.findById(courseId);

        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        if (user.enrolledCourses.includes(courseId)) {
            return res.status(400).json({ msg: 'User already enrolled in this course.' });
        }

        user.enrolledCourses.push(courseId);
        await user.save();


        // 2. Initialize UserProgress for this course
        const existingProgress = await UserProgress.findOne({ userId, courseId });
        if (!existingProgress) {
             await new UserProgress({
                userId,
                courseId,
                globalStartTime: new Date(),
                totalTimeSpent: 0,
                lastViewedTopicId: null,
                topicProgress: []
            }).save();
        }

        res.json({ msg: 'Successfully enrolled in course', courseId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route   GET /user/courses/enrolled
// @desc    Get all courses a user is enrolled in
// @access  Private (User)
router.get('/user/courses/enrolled', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'enrolledCourses',
      populate: {
        path: 'modules',
        populate: { path: 'topics' }
      }
    });

    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json(user.enrolledCourses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST /user/courses/like/:courseId
// @desc    Like/Unlike a course
// @access  Private (User)
router.post('/user/courses/like/:courseId', async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;

        const user = await User.findById(userId);
        const course = await Course.findById(courseId);

        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        const isLiked = user.likedCourses.includes(courseId);

        if (isLiked) {
            user.likedCourses = user.likedCourses.filter(id => id.toString() !== courseId);
            res.json({ msg: 'Course unliked', liked: false });
        } else {
            user.likedCourses.push(courseId);
            res.json({ msg: 'Course liked', liked: true });
        }
        await user.save();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /user/courses/liked
// @desc    Get all courses a user has liked
// @access  Private (User)
router.get('/user/courses/liked', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('likedCourses');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user.likedCourses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});





// --- Public API Routes (for frontend pages to fetch data without auth) ---

// @route   GET /public/courses
// @desc    Get all courses (public)
// @access  Public
router.get('/public/courses', async (req, res) => {
    try {
        const courses = await Course.find().populate({ 
            path: 'modules',
            populate: {
                path: 'topics',
                model: 'Topic'
            }
        }).sort({ createdAt: -1 }); //optional: sort by newest first
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /public/courses/:id
// @desc    Get single course by id with modules and topics
// @access  Public
router.get('/public/courses/:id', async (req, res) => {
    console.log('Received request: GET /api/public/courses/:id ->', req.params.id);
    try {
        let course = await Course.findById(req.params.id).populate({
            path: 'modules',
            populate: { path: 'topics', model: 'Topic' }
        });
        if (!course) {
            const Skill = require('../models/Skill');
            course = await Skill.findById(req.params.id).populate({
                path: 'modules',
                populate: { path: 'topics', model: 'Topic' }
            });
        }
        if (!course) {
            const Track = require('../models/Track');
            course = await Track.findById(req.params.id).populate({
                path: 'modules',
                populate: { path: 'topics', model: 'Topic' }
            });
        }
        if (!course) return res.status(404).json({ msg: 'Course, Skill, or Track not found' });
        res.json(course);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid id' });
        res.status(500).send('Server Error');
    }
});

// @route   GET /public/tutorials
// @desc    Get all tutorials (public)
// @access  Public
router.get('/public/tutorials', async (req, res) => {
    try {
        const tutorials = await Tutorial.find().populate({ 
            path: 'modules',
            populate: {
                path: 'topics',
                model: 'TutorialTopic'
            }
        }).sort({ createdAt: -1 });
        res.json(tutorials);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /public/tutorials/:id
// @desc    Get single tutorial by id with modules and topics
// @access  Public
router.get('/public/tutorials/:id', async (req, res) => {
    console.log('Received request: GET /api/public/tutorials/:id ->', req.params.id);
    try {
        const tutorial = await Tutorial.findById(req.params.id).populate({
            path: 'modules',
            populate: { path: 'topics', model: 'TutorialTopic' }
        });
        if (!tutorial) return res.status(404).json({ msg: 'Tutorial not found' });
        res.json(tutorial);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(400).json({ msg: 'Invalid tutorial id' });
        res.status(500).send('Server Error');
    }
});

module.exports = router;
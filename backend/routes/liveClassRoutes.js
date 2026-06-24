const express = require('express');
const router = express.Router();
const LiveClass = require('../models/LiveClass');
const Course = require('../models/Course');
const User = require('../models/User');

// Get live classes for a course (Student access)
router.get('/course/:courseId', async (req, res) => {
    try {
        const userId = req.user.id;
        const courseId = req.params.courseId;
        
        const user = await User.findById(userId);
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ msg: 'Course not found' });
        
        // If course is premium (paid), verify enrollment
        if (course.type === 'paid' && (!user || !user.enrolledCourses.includes(courseId)) && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. You must be enrolled in this course.' });
        }
        
        const liveClasses = await LiveClass.find({ courseId }).sort({ scheduledAt: 1 });
        res.json(liveClasses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get a single live class by ID (Student access)
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const liveClass = await LiveClass.findById(req.params.id);
        if (!liveClass) return res.status(404).json({ msg: 'Live class not found' });
        
        const course = await Course.findById(liveClass.courseId);
        if (course && course.type === 'paid' && req.user.role !== 'admin') {
            const user = await User.findById(userId);
            if (!user || !user.enrolledCourses.includes(course._id.toString())) {
                return res.status(403).json({ msg: 'Access denied. You must be enrolled in this course.' });
            }
        }
        
        res.json(liveClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

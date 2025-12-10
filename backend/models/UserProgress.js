
const mongoose = require('mongoose');
const User = require('./User');
const Course = require('./Course');
const Topic = require('./Topic');



// UserProgress Schema (Crucial for Resume/Timer)
const userProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    globalStartTime: { type: Date }, // Course started time
    globalEndTime: { type: Date }, // Course completion time
    totalTimeSpent: { type: Number, default: 0 }, // Global timer in seconds
    lastViewedTopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null }, // Resume button
    // Array to track completion status per topic
    topicProgress: [{
        topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
        isCompleted: { type: Boolean, default: false },
        lastViewed: { type: Date, default: Date.now },
        timeSpent: { type: Number, default: 0 }, // Time spent on this specific topic
    }],
}, {
    // Compound unique index for efficient lookup
    indexes: [{ unique: true, fields: ['userId', 'courseId'] }] 
});

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;
const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    streamURL: { type: String, default: '' },
    scheduledAt: { type: Date, required: true },
    duration: { type: String, default: '1 Hour' },
    status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
    createdAt: { type: Date, default: Date.now }
});

const LiveClass = mongoose.model('LiveClass', liveClassSchema);

module.exports = LiveClass;

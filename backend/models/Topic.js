
const mongoose = require('mongoose');
const Module = require('./Module');
const Quiz = require('./Quiz');

const topicSchema = new mongoose.Schema({
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true }, // ✅ ensures each topic belongs to a module
    title: { type: String, required: true },
    order: { type: Number, required: true },
    // Core Content
    notes: { type: String, default: '' }, // Quill/Markdown content
    videoURL: { type: String, default: '' },
    otherResources: [{ 
        name: { type: String }, 
        url: { type: String } 
    }],
    // Linked Resources
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null }, 
    // Engagement
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;
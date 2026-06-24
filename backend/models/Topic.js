
const mongoose = require('mongoose');

const topicArticleSchema = new mongoose.Schema({
    heading: { type: String, default: '' },
    content: { type: String, default: '' }, // Markdown or HTML
    videoURL: { type: String, default: '' },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
    order: { type: Number, default: 0 },
}, { _id: true, timestamps: true });

const topicSchema = new mongoose.Schema({
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true }, // ✅ ensures each topic belongs to a module
    title: { type: String, required: true },
    order: { type: Number, required: true },
    // Multi-article topic content
    articles: { type: [topicArticleSchema], default: [] },
    videos: [{
        title: { type: String, default: '' },
        videoURL: { type: String, default: '' }
    }],
    otherResources: [{ 
        name: { type: String }, 
        url: { type: String } 
    }],
    // Engagement
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;
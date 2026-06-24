const mongoose = require('mongoose');

const topicArticleSchema = new mongoose.Schema({
    heading: { type: String, default: '' },
    content: { type: String, default: '' }, // Markdown or HTML
    videoURL: { type: String, default: '' },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
    order: { type: Number, default: 0 },
}, { _id: true, timestamps: true });

const tutorialTopicSchema = new mongoose.Schema({
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "TutorialModule", required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    articles: { type: [topicArticleSchema], default: [] },
    videos: [{
        title: { type: String, default: '' },
        videoURL: { type: String, default: '' }
    }],
    otherResources: [{ 
        name: { type: String }, 
        url: { type: String } 
    }],
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const TutorialTopic = mongoose.model('TutorialTopic', tutorialTopicSchema);

module.exports = TutorialTopic;

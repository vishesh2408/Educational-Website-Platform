const mongoose = require('mongoose');

const tutorialModuleSchema = new mongoose.Schema({
    tutorialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutorial', required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TutorialTopic' }],
    createdAt: { type: Date, default: Date.now },
});
const TutorialModule = mongoose.model('TutorialModule', tutorialModuleSchema);

module.exports = TutorialModule;

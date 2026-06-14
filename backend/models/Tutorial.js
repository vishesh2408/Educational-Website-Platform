const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['paid', 'free'], default: 'free' },
    price: { type: String, default: 'Free' }, // e.g., '₹9,999' or 'Free'
    status: { type: String, enum: ['running', 'upcoming'], default: 'running' },
    imageUrl: { type: String },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TutorialModule' }],
    createdAt: { type: Date, default: Date.now },
});
const Tutorial = mongoose.model('Tutorial', tutorialSchema);

module.exports = Tutorial;

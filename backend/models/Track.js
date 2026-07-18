

const mongoose = require('mongoose');


// Track Schema
const trackSchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon: { type: String, required: true }, // e.g., "https://img.icons8.com/..."
    description: { type: String, default: '' },
    type: { type: String, enum: ['paid', 'free'], default: 'free' },
    price: { type: String, default: 'Free' },
    status: { type: String, enum: ['running', 'upcoming'], default: 'running' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    createdAt: { type: Date, default: Date.now },
});
const Track = mongoose.model('Track', trackSchema);


module.exports = Track;

const mongoose = require('mongoose');




// Contest Schema
const contestSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ['Live', 'Upcoming', 'Past'], default: 'Upcoming' },
    startTime: { type: Date },
    endTime: { type : Date },
    participants: { type: Number, default: 0 },
    prize: { type: String, default: '$0' }, // e.g., '$5,000'
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    isFeatured: { type: Boolean, default: false },
    winner: { type: String }, // Optional, for past contests
    createdAt: { type: Date, default: Date.now },
});
const Contest = mongoose.model('Contest', contestSchema);

module.exports = Contest;
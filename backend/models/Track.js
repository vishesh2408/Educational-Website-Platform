

const mongoose = require('mongoose');


// Track Schema
const trackSchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon: { type: String, required: true }, // e.g., "https://img.icons8.com/..."
    createdAt: { type: Date, default: Date.now },
});
const Track = mongoose.model('Track', trackSchema);


module.exports = Track;
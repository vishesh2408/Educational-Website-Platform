
const mongoose = require('mongoose');



// Skill Schema
const skillSchema = new mongoose.Schema({
    title: { type: String, required: true },
    icon: { type: String, required: true }, // e.g., "fab fa-html5" or "https://img.icons8.com/..."
    createdAt: { type: Date, default: Date.now },
});
const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
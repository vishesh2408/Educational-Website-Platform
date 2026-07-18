const mongoose = require('mongoose');

const resourceSectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    type: { type: String, enum: ['roadmap', 'interview', 'placement', 'software_tool', 'miscellaneous'], required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ResourceSection', resourceSectionSchema);

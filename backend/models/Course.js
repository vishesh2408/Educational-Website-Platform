
const mongoose = require('mongoose');
const Module = require('./Module');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['paid', 'free'], default: 'free' },
    price: { type: String, default: 'Free' }, // e.g., '₹9,999' or 'Free'
    status: { type: String, enum: ['running', 'upcoming'], default: 'running' },
    imageUrl: { type: String }, // Added imageUrl for CourseCard
    rating: { type: Number, min: 0, max: 5, default: 0 }, // Added rating
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }], // New reference to modules
    createdAt: { type: Date, default: Date.now },
});
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;


const mongoose = require('mongoose');
const Topic = require('./Topic');
const Course = require('./Course');


const moduleSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }], // Array of topics
    createdAt: { type: Date, default: Date.now },
});
const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
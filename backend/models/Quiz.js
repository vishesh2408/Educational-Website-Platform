
const mongoose = require('mongoose');



// Quiz & Question Schema
const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    type: { type: String, enum: ['Multiple choice', 'True or False'], default: 'Multiple choice' },
    options: [{ type: String, required: true }], // Array of answer options
    correctAnswer: { type: String, required: true },
    isTimedPerQuestion: { type: Boolean, default: true }, // New: per-question timing
    questionTimeLimit: { type: Number }, // New: Time limit per question in seconds
    selectedOptionCounts: { type: Object, default: {} }, // New: for quiz stats
});


const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'CodeIcon' }, // String name of Lucide icon
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Link quiz to a course
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    noOfQuestions: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    passMark: { type: Number, required: true, min: 0 },
    duration: { type: String }, // e.g., "30 Minutes" or "No Limit"
    isTimedQuiz: { type: Boolean, default: false }, // New: Overall quiz timing
    questions: [questionSchema], // Array of nested question objects
    attemptsCount: { type: Number, default: 0 }, // For quiz stats
    totalScoreSum: { type: Number, default: 0 }, // For quiz stats
    isReleased: { type: Boolean, default: true }, // Whether results are immediately visible or admin-released
    allowDirectResultAccess: { type: Boolean, default: true }, // New field for result access control
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
});
const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
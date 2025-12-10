
const mongoose = require('mongoose');
const Quiz = require('./Quiz');
const User = require('./User');


// NEW: QuizAttempt Schema (to record user quiz results)
const quizAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    attemptedAt: { type: Date, default: Date.now },
    // Optional: Store user's answers or specific feedback
    userResponses: [{
        questionId: { type: mongoose.Schema.Types.ObjectId }, // Or index if not separate schema
        userAnswer: { type: String },
        isCorrect: { type: Boolean },
    }],
});
const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);


module.exports = QuizAttempt;
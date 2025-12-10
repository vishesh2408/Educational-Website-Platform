const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// @route   POST /user/quizzes/attempt
// @desc    Submit a quiz attempt
// @access  Private (User)
router.post('/user/quizzes/attempt', async (req, res) => {
    const { quizId, score, totalQuestions, correctAnswers, userResponses } = req.body;
    try {
        const userId = req.user.id;
        const quiz = await Quiz.findById(quizId);

        if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

        const newAttempt = new QuizAttempt({
            userId,
            quizId,
            score,
            totalQuestions,
            correctAnswers,
            userResponses,
        });
        await newAttempt.save();

        // Update quiz stats (attemptsCount, totalScoreSum)
        quiz.attemptsCount += 1;
        quiz.totalScoreSum += score;
        // Also update selectedOptionCounts for each question if available
        if (userResponses && quiz.questions) {
            userResponses.forEach(userRes => {
                // Find the question by its _id within the quiz's questions array
                const questionInQuiz = quiz.questions.find(q => q._id.toString() === userRes.questionId);
                if (questionInQuiz && userRes.userAnswer) {
                    const optionCounts = questionInQuiz.selectedOptionCounts || {};
                    optionCounts[userRes.userAnswer] = (optionCounts[userRes.userAnswer] || 0) + 1;
                    questionInQuiz.selectedOptionCounts = optionCounts; // Update the subdocument
                }
            });
        }
        await quiz.save();

        res.status(201).json({ msg: 'Quiz attempt recorded', attemptId: newAttempt._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /user/quizzes/attempts
// @desc    Get all quiz attempts for the logged-in user
// @access  Private (User)
router.get('/user/quizzes/attempts', async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ userId: req.user.id }).populate('quizId');
        res.json(attempts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
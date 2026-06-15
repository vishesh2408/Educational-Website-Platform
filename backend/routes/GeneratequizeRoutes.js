const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Endpoint to generate quiz using Google Gemini API
router.post('/', async (req, res) => {
    const { topic, num_questions = 5, difficulty = 'Intermediate' } = req.body;

    if (!topic) {
        return res.status(400).json({ message: 'Topic is required to generate a quiz.' });
    }

    // 1. Enforce authentication check
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'You must be logged in to generate custom quizzes.' });
    }

    const userId = req.user.id;

    try {
        // Fetch user from database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User account not found.' });
        }

        // 2. Resolve active subscription plan type
        let activePlanType = 'free';

        // Check if free access is granted by admin
        const grantedPlan = await SubscriptionPlan.findOne({
            'freeFor.users': userId,
            active: true
        });

        if (grantedPlan) {
            activePlanType = grantedPlan.planType;
        } else if (user.subscription && user.subscription.status === 'active') {
            // Check if subscription has expired
            if (user.subscription.endDate && new Date(user.subscription.endDate) < new Date()) {
                user.subscription.status = 'expired';
                await user.save();
            } else {
                activePlanType = user.subscription.plan;
            }
        }

        // 3. Determine the generation limit
        let limit = 2; // Default limit for free users
        if (activePlanType !== 'free') {
            const planDoc = await SubscriptionPlan.findOne({
                planType: activePlanType,
                active: true
            });
            if (planDoc && planDoc.quizLimit !== undefined && planDoc.quizLimit !== null) {
                limit = planDoc.quizLimit;
            } else {
                limit = 3; // Seeded default for existing premium plans
            }
        }

        // 4. Validate current generation count
        const currentCount = user.quizzesGenerated || 0;
        if (currentCount >= limit) {
            return res.status(403).json({
                message: `You have reached the limit of ${limit} quiz generations for your account (${activePlanType} plan). Please contact support or upgrade your subscription plan to get more generations.`,
                limit,
                currentCount,
                plan: activePlanType
            });
        }

        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return res.status(500).json({ message: 'Gemini API key is not configured in backend .env.' });
        }

        const prompt = `You are an expert quiz generator for computer science topics. Your task is to create multiple-choice questions for a quiz.

Generate exactly ${num_questions} multiple-choice questions at "${difficulty}" difficulty level on the topic of "${topic}".
Each question should have 4 options, and one correct answer.
The output MUST be in a valid JSON array format, where each object has:
- "question": (string)
- "options": (array of 4 strings)
- "correctAnswer": (string, which must be one of the options)
`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
        }

        const resData = await response.json();
        const responseString = resData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseString) {
            throw new Error('No text returned from Gemini API response.');
        }

        let quizData;
        try {
            quizData = JSON.parse(responseString);

            // Robustly check if the parsed data is an array or contains an array
            if (!Array.isArray(quizData) && typeof quizData === 'object') {
                const potentialArrayKeys = Object.keys(quizData).filter(key => Array.isArray(quizData[key]));
                if (potentialArrayKeys.length > 0) {
                    quizData = quizData[potentialArrayKeys[0]]; // Take the first array found
                }
            }
            if (!Array.isArray(quizData) || quizData.length === 0) {
                if (!Array.isArray(quizData)) { // If it's a single object, wrap it
                    quizData = [quizData];
                }
                if (quizData.length === 0 || !quizData[0].question || !quizData[0].options || !quizData[0].correctAnswer) {
                    throw new Error("Generated data is not a valid quiz array or is empty.");
                }
            }

            // Ensure each question has default fields for DB persistence if needed
            quizData = quizData.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                type: q.type || 'Multiple choice', // Default to Multiple choice if not specified
                isTimedPerQuestion: q.isTimedPerQuestion ?? false, // Default to false
                questionTimeLimit: q.questionTimeLimit ?? null,
                selectedOptionCounts: q.options.reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}),
            }));

        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON:", responseString, parseError);
            return res.status(500).json({ 
                message: 'Failed to parse generated quiz data. Ensure LLM output is valid JSON. Trying again might help.', 
                rawResponse: responseString 
            });
        }

        // Increment user's generated quiz count
        user.quizzesGenerated = (user.quizzesGenerated || 0) + 1;
        await user.save();

        res.json({ quiz: quizData });

    } catch (error) {
        console.error('Error generating quiz via Gemini API:', error);
        res.status(500).json({ message: 'Failed to generate quiz.', error: error.message });
    }
});

module.exports = router;
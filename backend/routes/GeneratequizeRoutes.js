
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Import LangChain components
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');

// --- LangChain/OpenAI Integration for Quiz Generation ---

// Initialize LangChain OpenAI model
const chatModel = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo", // Use gpt-3.5-turbo for broader access
    temperature: 0.7,
});

// Define the prompt template for quiz generation
const quizPromptTemplate = PromptTemplate.fromTemplate(
    `You are an expert quiz generator for computer science topics. Your task is to create multiple-choice questions for a quiz.

Generate exactly {num_questions} multiple-choice questions on the topic of "{topic}".
Each question should have 4 options, and one correct answer.
The output should be in a JSON array format, where each object has:
- "question": (string)
- "options": (array of 4 strings)
- "correctAnswer": (string, which must be one of the options)

Ensure the JSON output is valid and can be directly parsed.
`
);

// Define the output parser to convert string output to JSON
const parser = new StringOutputParser(); // We will manually parse the string output as JSON


// Create the LangChain sequence (prompt -> model -> parser)
const quizGenerationChain = RunnableSequence.from([
    quizPromptTemplate,
    chatModel,
    parser,
]);


// Endpoint to generate quiz using LangChain
// Route is relative so it can be mounted at '/api/generate-quiz'
router.post('/', async (req, res) => {
    const { topic, num_questions = 5 } = req.body;

    if (!topic) {
        return res.status(400).json({ message: 'Topic is required to generate a quiz.' });
    }

    try {
        // Invoke the LangChain sequence
        const responseString = await quizGenerationChain.invoke({
            topic: topic,
            num_questions: num_questions
        });

        let quizData;
        try {
            // LangChain's StringOutputParser gives a string, so we manually parse it
            quizData = JSON.parse(responseString);

            // Robustly check if the parsed data is an array or contains an array
            if (!Array.isArray(quizData) && typeof quizData === 'object') {
                const potentialArrayKeys = Object.keys(quizData).filter(key => Array.isArray(quizData[key]));
                if (potentialArrayKeys.length > 0) {
                    quizData = quizData[potentialArrayKeys[0]]; // Take the first array found
                }
            }
            if (!Array.isArray(quizData) || quizData.length === 0) {
                // If it's not an array, or empty, try a more lenient parse or assume a single question
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
            console.error("Failed to parse LLM response as JSON:", responseString, parseError);
            return res.status(500).json({ message: 'Failed to parse generated quiz data. Ensure LLM output is valid JSON. Trying again might help.', rawResponse: responseString });
        }

        res.json({ quiz: quizData });

    } catch (error) {
        console.error('Error generating quiz via LangChain:', error);
        // More detailed error logging for LangChain errors
        if (error.response) {
            console.error('LangChain/OpenAI API error data:', error.response.data);
        }
        res.status(500).json({ message: 'Failed to generate quiz (Recharge your API key).', error: error.message });
    }
});

module.exports = router;
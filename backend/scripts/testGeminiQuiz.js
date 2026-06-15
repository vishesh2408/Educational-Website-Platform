const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');

async function runTest() {
    const jwtSecret = process.env.JWT_SECRET;
    const mongoUri = process.env.MONGO_URI;
    const port = process.env.PORT || 3001;

    if (!jwtSecret || !mongoUri) {
        console.error('Error: JWT_SECRET or MONGO_URI is not defined in backend/.env');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Find a real user in the DB to test with
    let testUser = await User.findOne({ role: 'user' });
    if (!testUser) {
        testUser = await User.findOne();
    }

    if (!testUser) {
        console.log('No user found in database. Creating a temporary test user...');
        testUser = new User({
            username: 'QuizTestUser',
            email: 'quiztest@example.com',
            password: 'password123',
            role: 'user'
        });
        await testUser.save();
        console.log(`Created temporary user: ${testUser.username}`);
    }

    // Resolve active subscription plan type
    let activePlanType = 'free';
    const grantedPlan = await SubscriptionPlan.findOne({
        'freeFor.users': testUser._id,
        active: true
    });

    if (grantedPlan) {
        activePlanType = grantedPlan.planType;
    } else if (testUser.subscription && testUser.subscription.status === 'active') {
        activePlanType = testUser.subscription.plan;
    }

    let limit = 2; // Default limit for free users
    if (activePlanType !== 'free') {
        const planDoc = await SubscriptionPlan.findOne({
            planType: activePlanType,
            active: true
        });
        if (planDoc && planDoc.quizLimit !== undefined && planDoc.quizLimit !== null) {
            limit = planDoc.quizLimit;
        } else {
            limit = 3;
        }
    }

    console.log(`\nUser details:`);
    console.log(`- Username: ${testUser.username}`);
    console.log(`- Resolved Plan: ${activePlanType}`);
    console.log(`- Configured Quiz Limit: ${limit}`);

    // Let's set the count to exactly the limit, so the next request is guaranteed to be blocked
    testUser.quizzesGenerated = limit;
    await testUser.save();
    console.log(`Set user quizzesGenerated count to ${testUser.quizzesGenerated} (equal to limit of ${limit}).`);

    console.log('\nGenerating test token...');
    const payload = {
        user: {
            id: testUser._id.toString(),
            username: testUser.username,
            email: testUser.email,
            role: testUser.role,
            isLocked: false
        }
    };

    // Sign the token
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    console.log(`\n--- RUNNING BLOCKED GENERATION TEST ---`);
    console.log(`Sending quiz generation request. Expecting 403 Forbidden since count (${testUser.quizzesGenerated}) >= limit (${limit})...`);
    await sendQuizRequest(port, token, 'JavaScript Objects', 2);

    // Clean up if it was a temporary user
    if (testUser.username === 'QuizTestUser') {
        await User.deleteOne({ _id: testUser._id });
        console.log('\nTemporary test user removed.');
    }

    // Disconnect mongoose
    await mongoose.disconnect();
    console.log('\nTest completed and database disconnected.');
}

async function sendQuizRequest(port, token, topic, num_questions) {
    try {
        const response = await fetch(`http://localhost:${port}/api/generate-quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${token}`
            },
            body: JSON.stringify({
                topic: topic,
                num_questions: num_questions
            })
        });

        const status = response.status;
        console.log(`Response status: ${status}`);

        const data = await response.json();

        if (!response.ok) {
            console.log(`Response body:`, data);
            return data;
        }

        console.log('SUCCESS! Generated Quiz count in response:', data.quiz?.length);
        return data;
    } catch (err) {
        console.error('Fetch request failed:', err.message);
        return null;
    }
}

runTest();

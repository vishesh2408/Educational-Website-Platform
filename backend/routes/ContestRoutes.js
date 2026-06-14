const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const Contest = require('../models/Contest');

// @route   GET /public/contests
// @desc    Get all contests (public)
// @access  Public
router.get('/public/contests', async (req, res) => {
    try {
        const contests = await Contest.find();
        res.json(contests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   POST /user/contests/register/:contestId
// @desc    Register user for a contest
// @access  Private (User)
router.post('/user/contests/register/:contestId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const contestId = req.params.contestId;

        const contest = await Contest.findById(contestId);
        if (!contest) return res.status(404).json({ msg: 'Contest not found' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (!user.registeredContests) {
            user.registeredContests = [];
        }

        const isAlreadyRegistered = user.registeredContests.some(id => id.toString() === contestId);
        if (isAlreadyRegistered) {
            return res.json({ msg: 'Already registered for this contest', registeredContests: user.registeredContests });
        }

        user.registeredContests.push(contestId);
        await user.save();

        contest.participants = (contest.participants || 0) + 1;
        await contest.save();

        res.json({ msg: 'Registered for contest successfully', registeredContests: user.registeredContests });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
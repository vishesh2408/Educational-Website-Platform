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

module.exports = router;
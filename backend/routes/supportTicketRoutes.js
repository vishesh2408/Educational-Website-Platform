const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');

// Middleware for auth verification
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: 'No token found in cookies, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        if (req.user.isLocked) {
            return res.status(403).json({ msg: 'Account is locked. Please contact support.' });
        }
        next();
    } catch (err) {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('token', { 
            httpOnly: true, 
            secure: isProd, 
            sameSite: isProd ? 'None' : 'Lax' 
        });
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware for admin verification
const adminMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Admin only' });
        }
        next();
    });
};

// @route   POST api/profile/support-tickets
// @desc    Submit a support ticket (authenticated or public)
// @access  Public / Private
router.post('/profile/support-tickets', async (req, res) => {
    const { message, email, username } = req.body;
    if (!message || !message.trim()) {
        return res.status(400).json({ msg: 'Message is required' });
    }

    let userId = null;
    let senderEmail = email;
    let senderUsername = username;

    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.user.id;
            const user = await User.findById(userId);
            if (user) {
                senderEmail = user.email;
                senderUsername = user.username;
            }
        } catch (err) {
            // Ignore error, fallback to body params if provided
        }
    }

    if (!senderEmail || !senderUsername) {
        return res.status(400).json({ msg: 'Email and Username are required for support requests.' });
    }

    try {
        const newTicket = new SupportTicket({
            user: userId,
            email: senderEmail,
            username: senderUsername,
            message: message.trim()
        });
        await newTicket.save();
        res.status(201).json({ msg: 'Support request submitted successfully!', ticket: newTicket });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/support-tickets
// @desc    Get all support tickets with pagination
// @access  Private (Admin)
router.get('/admin/support-tickets', adminMiddleware, async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    try {
        const totalTickets = await SupportTicket.countDocuments();
        const tickets = await SupportTicket.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'username email');

        res.json({
            tickets,
            totalPages: Math.ceil(totalTickets / limit),
            currentPage: page,
            totalTickets
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/support-tickets/:ticketId/resolve
// @desc    Mark a support ticket as resolved
// @access  Private (Admin)
router.put('/admin/support-tickets/:ticketId/resolve', adminMiddleware, async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.ticketId);
        if (!ticket) {
            return res.status(404).json({ msg: 'Support ticket not found' });
        }

        ticket.status = 'resolved';
        ticket.resolvedAt = new Date();
        await ticket.save();

        res.json({ msg: 'Ticket resolved successfully', ticket });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

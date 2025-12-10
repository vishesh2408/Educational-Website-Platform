const express = require('express');

module.exports = function(app, authMiddleware, adminMiddleware) {
    const ForumPremium = require('../models/ForumPremium');
    const User = require('../models/User');

    // Admin CRUD for forum-premiums
    app.get('/api/admin/forum-premiums', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const items = await ForumPremium.find().sort({ createdAt: 1 });
            res.json(items);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    app.get('/api/admin/forum-premiums/:id', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const item = await ForumPremium.findById(req.params.id);
            if (!item) return res.status(404).json({ msg: 'Item not found' });
            res.json(item);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    app.post('/api/admin/forum-premiums', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const newItem = new ForumPremium(req.body);
            const item = await newItem.save();
            res.status(201).json(item);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    app.put('/api/admin/forum-premiums/:id', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            let item = await ForumPremium.findById(req.params.id);
            if (!item) return res.status(404).json({ msg: 'Item not found' });
            Object.assign(item, req.body);
            await item.save();
            res.json(item);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    app.delete('/api/admin/forum-premiums/:id', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const item = await ForumPremium.findById(req.params.id);
            if (!item) return res.status(404).json({ msg: 'Item not found' });
            await ForumPremium.deleteOne({ _id: req.params.id });
            res.json({ msg: 'Item removed' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

    // Admin: grant free forum premium access to a user
    app.post('/api/admin/forum-premiums/grant-free', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const { forumPremiumId, userId, expiresAt } = req.body; // expiresAt optional
            const premium = await ForumPremium.findById(forumPremiumId);
            if (!premium) return res.status(404).json({ msg: 'Forum premium config not found' });

            if (!premium.freeFor.users.map(String).includes(String(userId))) {
                premium.freeFor.users.push(userId);
                await premium.save();
            }

            // Optionally update the user's subscription to mark as premium granted (no payment)
            if (userId) {
                const user = await User.findById(userId);
                if (user) {
                    user.subscription = user.subscription || {};
                    user.subscription.plan = 'premium';
                    user.subscription.status = 'active';
                    user.subscription.grantedByAdmin = true;
                    if (expiresAt) user.subscription.endDate = new Date(expiresAt);
                    await user.save();
                }
            }

            res.json({ msg: 'Free access granted', forumPremium: premium });
        } catch (err) {
            console.error('Error granting free access:', err.message);
            res.status(500).send('Server Error');
        }
    });

    // Admin: revoke free forum premium access from a user
    app.post('/api/admin/forum-premiums/revoke-free', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const { forumPremiumId, userId } = req.body;
            const premium = await ForumPremium.findById(forumPremiumId);
            if (!premium) return res.status(404).json({ msg: 'Forum premium config not found' });

            premium.freeFor.users = premium.freeFor.users.filter(u => u.toString() !== userId);
            await premium.save();

            // Optionally update user's subscription if it was granted
            if (userId) {
                const user = await User.findById(userId);
                if (user && user.subscription && user.subscription.grantedByAdmin) {
                    user.subscription = { plan: 'free', status: 'active' };
                    await user.save();
                }
            }

            res.json({ msg: 'Free access revoked', forumPremium: premium });
        } catch (err) {
            console.error('Error revoking free access:', err.message);
            res.status(500).send('Server Error');
        }
    });

    // Admin: update global premium settings quickly
    app.post('/api/admin/forum-premiums/update-global', authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const { forumPremiumId, updates } = req.body; // updates: object with fields to update
            const premium = await ForumPremium.findById(forumPremiumId);
            if (!premium) return res.status(404).json({ msg: 'Forum premium config not found' });

            Object.assign(premium, updates);
            await premium.save();
            res.json({ msg: 'Forum premium updated', forumPremium: premium });
        } catch (err) {
            console.error('Error updating forum premium:', err.message);
            res.status(500).send('Server Error');
        }
    });
};

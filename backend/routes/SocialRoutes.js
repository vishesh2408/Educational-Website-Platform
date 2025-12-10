const express = require('express');
const router = express.Router();
const crypto = require('crypto');   

const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');


// Send Friend Request by User ID


// Send a friend request (user -> receiver)
router.post('/user/friend-request', authMiddleware, async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;
        if (!receiverId) return res.status(400).json({ msg: 'receiverId is required' });
        if (receiverId === senderId) return res.status(400).json({ msg: 'Cannot friend yourself' });

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        if (!receiver) return res.status(404).json({ msg: 'Receiver not found' });

        // Prevent duplicate requests
        if (sender.social.friendRequestsSent.map(String).includes(String(receiverId))) {
            return res.status(400).json({ msg: 'Friend request already sent' });
        }

        // Add to arrays
        sender.social.friendRequestsSent.push(receiver._id);
        receiver.social.friendRequestsReceived.push(sender._id);

        await sender.save();
        await receiver.save();
        
        // Create a notification for the receiver
        try {
            const notif = await Notification.create({
                user: receiver._id,
                actor: sender._id,
                type: 'friend_request',
                message: `${sender.username} sent you a friend request`,
                metadata: { senderId: sender._id }
            });
            receiver.notifications.push(notif._id);
            await receiver.save();
        } catch (nerr) {
            console.error('Notification create error:', nerr.message);
        }

        res.json({ msg: 'Friend request sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Send friend request by username (convenience for frontend)
router.post('/user/friend-request-by-username', authMiddleware, async (req, res) => {
    try {
        const senderId = req.user.id;
        const { username } = req.body;
        if (!username) return res.status(400).json({ msg: 'username is required' });

        const receiver = await User.findOne({ username: username.trim() });
        if (!receiver) return res.status(404).json({ msg: 'User not found' });

        // Prevent sending to self
        if (String(receiver._id) === String(senderId)) return res.status(400).json({ msg: 'Cannot friend yourself' });

        const sender = await User.findById(senderId);

        // Prevent duplicate requests
        if (sender.social.friendRequestsSent.map(String).includes(String(receiver._id))) {
            return res.status(400).json({ msg: 'Friend request already sent' });
        }

        sender.social.friendRequestsSent.push(receiver._id);
        receiver.social.friendRequestsReceived.push(sender._id);

        await sender.save();
        await receiver.save();
        
        // Create notification for receiver
        try {
            const notif = await Notification.create({
                user: receiver._id,
                actor: sender._id,
                type: 'friend_request',
                message: `${sender.username} sent you a friend request`,
                metadata: { senderId: sender._id }
            });
            receiver.notifications.push(notif._id);
            await receiver.save();
        } catch (nerr) {
            console.error('Notification create error:', nerr.message);
        }

        res.json({ msg: 'Friend request sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Accept a friend request (receiver accepts sender)
router.post('/user/friend-request/accept', authMiddleware, async (req, res) => {
    try {
        const receiverId = req.user.id;
        const { senderId } = req.body;
        if (!senderId) return res.status(400).json({ msg: 'senderId is required' });

        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        if (!sender || !receiver) return res.status(404).json({ msg: 'User not found' });

        // Check that a pending request exists
        const sentIndex = sender.social.friendRequestsSent.map(String).indexOf(String(receiverId));
        const receivedIndex = receiver.social.friendRequestsReceived.map(String).indexOf(String(senderId));

        if (sentIndex === -1 || receivedIndex === -1) {
            return res.status(400).json({ msg: 'No pending friend request from this user' });
        }

        // Remove the request entries
        sender.social.friendRequestsSent.splice(sentIndex, 1);
        receiver.social.friendRequestsReceived.splice(receivedIndex, 1);

        // Add to friends arrays (mutual)
        if (!sender.social.friends.map(String).includes(String(receiverId))) sender.social.friends.push(receiver._id);
        if (!receiver.social.friends.map(String).includes(String(senderId))) receiver.social.friends.push(sender._id);

        await sender.save();
        await receiver.save();
        
        // Create notifications for both users: inform sender that their request was accepted
        try {
            const notif = await Notification.create({
                user: sender._id,
                actor: receiver._id,
                type: 'accepted',
                message: `${receiver.username} accepted your friend request`,
                metadata: { receiverId: receiver._id }
            });
            sender.notifications.push(notif._id);
            await sender.save();
        } catch (nerr) {
            console.error('Notification create error (accept):', nerr.message);
        }

        res.json({ msg: 'Friend request accepted', friends: receiver.social.friends });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Decline/cancel a friend request
router.post('/user/friend-request/decline', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.body; // could be sender or receiver depending on who cancels
        if (!otherUserId) return res.status(400).json({ msg: 'otherUserId is required' });

        const user = await User.findById(userId);
        const other = await User.findById(otherUserId);
        if (!user || !other) return res.status(404).json({ msg: 'User not found' });

        // Remove from any pending arrays
        user.social.friendRequestsSent = user.social.friendRequestsSent.filter(id => String(id) !== String(otherUserId));
        user.social.friendRequestsReceived = user.social.friendRequestsReceived.filter(id => String(id) !== String(otherUserId));
        other.social.friendRequestsSent = other.social.friendRequestsSent.filter(id => String(id) !== String(userId));
        other.social.friendRequestsReceived = other.social.friendRequestsReceived.filter(id => String(id) !== String(userId));

        await user.save();
        await other.save();
        
        // Notify the other user that the request was declined/cancelled (if appropriate)
        try {
            const actor = await User.findById(userId).select('username');
            const notif = await Notification.create({
                user: other._id,
                actor: actor._id,
                type: 'rejected',
                message: `${actor.username} cancelled/declined the friend request`,
                metadata: { by: actor._id }
            });
            other.notifications.push(notif._id);
            await other.save();
        } catch (nerr) {
            console.error('Notification create error (decline):', nerr.message);
        }

        res.json({ msg: 'Friend request removed/cancelled' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// List friends for current user
router.get('/user/friends', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('social.friends').populate('social.friends', 'username profilePicture role');
        res.json({ friends: user.social.friends });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// List users the current user is following
router.get('/user/following', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('social.followingList').populate('social.followingList', 'username profilePicture role');
        const following = (user && user.social && user.social.followingList) ? user.social.followingList : [];
        // return array of user objects (frontend can normalize id or _id)
        res.json(following.map(u => ({ id: u._id, username: u.username, profilePicture: u.profilePicture, role: u.role })));
    } catch (err) {
        console.error('Error fetching following list:', err.message);
        res.status(500).send('Server Error');
    }
});

// List friend-requests (sent and received) with basic user info
router.get('/user/friend-requests', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('social.friendRequestsSent social.friendRequestsReceived').lean();

        const sentIds = (user && user.social && user.social.friendRequestsSent) ? user.social.friendRequestsSent : [];
        const receivedIds = (user && user.social && user.social.friendRequestsReceived) ? user.social.friendRequestsReceived : [];

        const sent = await User.find({ _id: { $in: sentIds } }).select('username profilePicture role');
        const received = await User.find({ _id: { $in: receivedIds } }).select('username profilePicture role');

        res.json({ sent, received });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Follow a user (authenticated) - creates follower/following relationship
router.post('/user/follow', authMiddleware, async (req, res) => {
    try {
        const followerId = req.user.id;
        const { targetUserId } = req.body;
        if (!targetUserId) return res.status(400).json({ msg: 'targetUserId is required' });
        if (String(followerId) === String(targetUserId)) return res.status(400).json({ msg: 'Cannot follow yourself' });

        const follower = await User.findById(followerId);
        const target = await User.findById(targetUserId);
        if (!target) return res.status(404).json({ msg: 'Target user not found' });

        // Prevent duplicate follow
        if (follower.social && follower.social.followingList && follower.social.followingList.map(String).includes(String(targetUserId))) {
            return res.status(400).json({ msg: 'Already following' });
        }

        // Initialize social objects if missing
        follower.social = follower.social || {};
        target.social = target.social || {};

        follower.social.following = (follower.social.following || 0) + 1;
        target.social.followers = (target.social.followers || 0) + 1;

        follower.social.followingList = follower.social.followingList || [];
        target.social.followersList = target.social.followersList || [];
        follower.social.followingList.push(target._id);
        target.social.followersList.push(follower._id);

        await follower.save();
        await target.save();

        // Notification to target
        try {
            const notif = await Notification.create({
                user: target._id,
                actor: follower._id,
                type: 'follow_request',
                message: `${follower.username} started following you`,
            });
            target.notifications.push(notif._id);
            await target.save();
        } catch (nerr) {
            console.error('Notification create error (follow):', nerr.message);
        }

        res.json({ msg: 'Followed', followerId: follower._id, targetUserId: target._id });
    } catch (err) {
        console.error('Error in follow endpoint:', err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
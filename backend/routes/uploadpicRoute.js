const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const router = express.Router();

// Multer config to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to simulate authentication (replace with real auth)
router.use((req, res, next) => {
    req.user = { id: req.body.userId }; // In real app, get from token/session
    next();
});


// Multer config to store file in memory
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// Upload / Update Profile Picture (store in DB as Base64)
router.post('/upload', upload.single('profilePicture'), async (req, res) => {
  try {
    // Get userId from form-data
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ msg: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    // Convert file buffer to Base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    user.profilePicture = base64Image;
    await user.save();

    res.json({ msg: 'Profile picture updated', profilePicture: user.profilePicture });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Delete Profile Picture
router.delete('/delete', async (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ msg: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.profilePicture = '';
    await user.save();

    res.json({ msg: 'Profile picture deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// Update other fields (bio, skills, projects, etc.)
router.put('/update-profile', async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const allowedFields = ['bio', 'technicalSkills', 'softSkills', 'skillsToLearn', 'projects', 'extraCurricular', 'other'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) user[field] = req.body[field];
        });

        await user.save();
        res.json({ msg: 'Profile updated', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;

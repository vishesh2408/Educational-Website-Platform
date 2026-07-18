const express = require('express');
const router = express.Router();
const ResourceSection = require('../models/ResourceSection');
const Note = require('../models/Note');

// Fetch all sections of a specific type (e.g. roadmap, interview, etc.)
router.get('/sections', async (req, res) => {
    try {
        const { type } = req.query;
        const query = type ? { type } : {};
        const sections = await ResourceSection.find(query).sort({ createdAt: -1 });
        return res.json(sections);
    } catch (err) {
        console.error('Error fetching resource sections:', err);
        return res.status(500).json({ msg: 'Server error fetching resource sections' });
    }
});

// Fetch all notes of sections of a specific type (e.g. type=miscellaneous)
router.get('/notes', async (req, res) => {
    try {
        const { type } = req.query;
        if (!type) {
            return res.status(400).json({ msg: 'type query parameter is required' });
        }
        const sections = await ResourceSection.find({ type });
        const sectionIds = sections.map(s => s._id);
        const notes = await Note.find({ sectionId: { $in: sectionIds }, isDraft: false })
            .select('title subject content format imageUrl updatedAt sectionId')
            .sort({ createdAt: -1 });
        return res.json(notes);
    } catch (err) {
        console.error('Error fetching public notes:', err);
        return res.status(500).json({ msg: 'Server error fetching notes' });
    }
});

// Fetch details for a specific section
router.get('/sections/:id', async (req, res) => {
    try {
        const section = await ResourceSection.findById(req.params.id);
        if (!section) {
            return res.status(404).json({ msg: 'Section not found' });
        }
        return res.json(section);
    } catch (err) {
        console.error('Error fetching resource section details:', err);
        return res.status(500).json({ msg: 'Server error fetching resource section' });
    }
});

// Fetch all notes/articles associated with a specific section
router.get('/sections/:id/notes', async (req, res) => {
    try {
        const notes = await Note.find({ sectionId: req.params.id, isDraft: false })
            .select('title subject content format imageUrl updatedAt')
            .sort({ createdAt: 1 }); // Sorted in chronological order for roadmaps
        return res.json(notes);
    } catch (err) {
        console.error('Error fetching notes for section:', err);
        return res.status(500).json({ msg: 'Server error fetching section notes' });
    }
});

module.exports = router;

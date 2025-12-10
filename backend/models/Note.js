
const mongoose = require('mongoose');


// NEW: Note Schema (for Admin Dashboard Notes Management)
const versionSchema = new mongoose.Schema({
    title: String,
    subject: String,
    content: String,
    imageUrl: String,
    label: { type: String, default: null },
    reason: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String },
    content: { type: String }, // Rich text content from Quill
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    imageUrl: { type: String },
    isDraft: { type: Boolean, default: false },
    versions: { type: [versionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
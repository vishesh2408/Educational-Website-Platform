
const mongoose = require('mongoose');

// Forum Post/Reply Schema
const forumPostSchema = new mongoose.Schema({
    title: { type: String }, // Optional for replies
    content: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The ID of the user who posted/replied
    // Visibility controls who can see this post. 'public' = everyone, 'friends' = friends-only, 'admin' = admin-only
    visibility: { type: String, enum: ['public', 'friends', 'admin'], default: 'public' },
    createdAt: { type: Date, default: Date.now },
    imageUrl: { type: String }, // URL of attached image
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }], // Array of user IDs who liked
    category: { type: String, enum: ['discussion', 'question', 'bug', 'feature'], default: 'discussion' },
    tags: [{ type: String }], // Array of strings, e.g., ['react', 'firebase']
    // ParentId refers to the _id of the top-level post if this is a reply.
    // This allows replies to be fetched by the parent's ID.
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', default: null },
    // SolutionId on a top-level post refers to the _id of a reply that is marked as a solution.
    solutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', default: null },
});
const ForumPost = mongoose.model('ForumPost', forumPostSchema);


module.exports = ForumPost;
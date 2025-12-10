const mongoose = require('mongoose');

const forumPremiumSchema = new mongoose.Schema({
  name: { type: String, default: 'Forum Premium' },
  monthlyPrice: { type: Number, default: 99 },
  yearlyPrice: { type: Number, default: 999 },
  features: [{ type: String }],
  postLimit: { type: Number, default: 0 }, // 0 = unlimited
  replyLimit: { type: Number, default: 0 }, // 0 = unlimited
  active: { type: Boolean, default: true },
  // freeFor: can list specific users, roles or emails that get free access
  freeFor: {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    roles: [{ type: String }],
    emails: [{ type: String }]
  },
  // Optional auto-free rule: if set, users who meet criteria might be auto-granted
  autoFreeAfterDays: { type: Number, default: 0 }, // 0 = disabled
  // Optional: additional admin notes
  notes: { type: String },
}, { timestamps: true });

const ForumPremium = mongoose.model('ForumPremium', forumPremiumSchema);
module.exports = ForumPremium;

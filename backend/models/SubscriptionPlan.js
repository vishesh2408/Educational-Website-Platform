const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: { type: String, required: true },
    planType: { 
        type: String, 
        required: true, 
        enum: ['starter', 'professional', 'enterprise'] 
    },
    description: { type: String },
    monthlyPrice: { type: Number, required: true },
    yearlyPrice: { type: Number, required: true },
    features: [{ type: String }],
    isPopular: { type: Boolean, default: false },
    isForumPremium: { type: Boolean, default: false },
    quizLimit: { type: Number, default: 3 },
    active: { type: Boolean, default: true },
    freeFor: {
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }
}, { timestamps: true });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
module.exports = SubscriptionPlan;

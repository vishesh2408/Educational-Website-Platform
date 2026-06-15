const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    planId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'SubscriptionPlan', 
        required: true 
    },
    billingPeriod: { 
        type: String, 
        enum: ['monthly', 'yearly'], 
        required: true 
    },
    razorpayOrderId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    razorpayPaymentId: { 
        type: String 
    },
    razorpaySignature: { 
        type: String 
    },
    gatewayOrderId: {
        type: String,
        unique: true,
        sparse: true
    },
    gatewayPaymentId: {
        type: String
    },
    gatewaySignature: {
        type: String
    },
    planType: {
        type: String,
        enum: ['starter', 'professional', 'enterprise'],
        required: false
    },
    currency: {
        type: String,
        default: 'INR'
    },
    amount: { 
        type: Number, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'paid', 'failed'], 
        default: 'pending' 
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    // Idempotency key to prevent duplicate order creation on double-clicks
    // Format: userId_planType_billingPeriod_isForumPremium_timestamp-bucket
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true // Allow null for legacy orders
    },
    // Optimistic concurrency version for safe status transitions
    version: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;

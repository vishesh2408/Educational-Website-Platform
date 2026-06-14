const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Course = require('../models/Course');
const Order = require('../models/Order');

// ─── Helpers ────────────────────────────────────────────────────────

// Initialize Razorpay (only if keys exist, otherwise we show a warning or fallback)
const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        console.warn('WARNING: Razorpay API keys (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing from .env');
        return null;
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
};

/**
 * Timing-safe HMAC comparison to prevent timing attacks.
 * Returns true only if both hex digests match.
 */
const timingSafeEqual = (a, b) => {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Activate a user's subscription based on a verified order.
 * Shared by verify endpoint and webhook to keep logic DRY.
 */
const activateSubscription = async (userId, dbOrder) => {
    const user = await User.findById(userId);
    if (!user) return null;

    const plan = await SubscriptionPlan.findById(dbOrder.planId);
    const planName = plan ? plan.planType : 'starter';

    const startDate = new Date();
    const endDate = new Date();
    if (dbOrder.billingPeriod === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
    } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
    }

    user.subscription = {
        plan: planName,
        status: 'active',
        startDate,
        endDate,
        billingPeriod: dbOrder.billingPeriod,
        autoRenew: false
    };

    await user.save();
    return user;
};

// ─── Rate Limiters ──────────────────────────────────────────────────

const orderCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 order creation attempts per 15 min per IP
    message: { msg: 'Too many payment attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 verification attempts per 15 min per IP
    message: { msg: 'Too many verification attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Validation Rules ───────────────────────────────────────────────

const orderValidation = [
    body('planType')
        .isIn(['starter', 'professional', 'enterprise'])
        .withMessage('Invalid plan type.'),
    body('billingPeriod')
        .isIn(['monthly', 'yearly'])
        .withMessage('Invalid billing period.'),
    body('isForumPremium')
        .optional()
        .isBoolean()
        .withMessage('isForumPremium must be a boolean.'),
    body('idempotencyKey')
        .optional()
        .isString()
        .isLength({ max: 200 })
        .withMessage('Invalid idempotency key.'),
];

const verifyValidation = [
    body('razorpay_order_id')
        .matches(/^order_[A-Za-z0-9]+$/)
        .withMessage('Invalid Razorpay order ID format.'),
    body('razorpay_payment_id')
        .matches(/^pay_[A-Za-z0-9]+$/)
        .withMessage('Invalid Razorpay payment ID format.'),
    body('razorpay_signature')
        .isHexadecimal()
        .isLength({ min: 64, max: 64 })
        .withMessage('Invalid Razorpay signature format.'),
];

// ─── Routes ─────────────────────────────────────────────────────────

// @route   POST /user/payment/order
// @desc    Create a new Razorpay Order for a subscription (idempotent)
// @access  Private (User)
router.post('/user/payment/order', orderCreationLimiter, orderValidation, async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
    }

    const { planType, billingPeriod, isForumPremium, idempotencyKey } = req.body;
    try {
        const rzp = getRazorpayInstance();
        if (!rzp) {
            return res.status(500).json({ msg: 'Payment configuration error: Razorpay API keys are missing on the server.' });
        }

        // ── Idempotency check ──
        // If the frontend sent an idempotency key, check if we already have
        // a pending order for this exact request. Return it instead of creating a duplicate.
        if (idempotencyKey) {
            const existingOrder = await Order.findOne({
                idempotencyKey,
                status: 'pending'
            });

            if (existingOrder) {
                console.log(`[Payment] Returning existing pending order for idempotency key: ${idempotencyKey}`);
                return res.json({
                    keyId: process.env.RAZORPAY_KEY_ID,
                    amount: existingOrder.amount * 100, // amount in paise
                    currency: 'INR',
                    orderId: existingOrder.razorpayOrderId,
                    planType,
                    billingPeriod
                });
            }
        }

        // Query SubscriptionPlan from the database securely
        const plan = await SubscriptionPlan.findOne({
            planType,
            isForumPremium: isForumPremium || false,
            active: true
        });

        if (!plan) {
            return res.status(400).json({ msg: 'Subscription plan not found or is currently inactive.' });
        }

        const secureAmount = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

        const options = {
            amount: secureAmount * 100, // amount in paise
            currency: "INR",
            receipt: `rcpt_${req.user.id.slice(-8)}_${Date.now()}`
        };

        const order = await rzp.orders.create(options);

        // Store a pending transaction order in the database
        const dbOrder = new Order({
            userId: req.user.id,
            planId: plan._id,
            billingPeriod,
            razorpayOrderId: order.id,
            amount: secureAmount,
            status: 'pending',
            idempotencyKey: idempotencyKey || null,
            version: 0
        });
        await dbOrder.save();

        res.json({
            keyId: process.env.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            orderId: order.id,
            planType,
            billingPeriod
        });
    } catch (err) {
        // Handle duplicate key error for idempotencyKey race condition
        if (err.code === 11000 && err.keyPattern && err.keyPattern.idempotencyKey) {
            // Another concurrent request won the race — find and return that order
            const existingOrder = await Order.findOne({
                idempotencyKey: req.body.idempotencyKey,
                status: 'pending'
            });
            if (existingOrder) {
                return res.json({
                    keyId: process.env.RAZORPAY_KEY_ID,
                    amount: existingOrder.amount * 100,
                    currency: 'INR',
                    orderId: existingOrder.razorpayOrderId,
                    planType,
                    billingPeriod
                });
            }
        }
        console.error('Razorpay Create Order Error:', err);
        res.status(500).json({ msg: 'Server error creating payment order', error: err.message });
    }
});

// @route   POST /user/payment/verify
// @desc    Verify Razorpay payment signature and activate subscription (idempotent)
// @access  Private (User)
router.post('/user/payment/verify', verifyLimiter, verifyValidation, async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ msg: 'Validation failed', errors: errors.array() });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    try {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            return res.status(500).json({ msg: 'Payment configuration error: Razorpay Secret key is missing.' });
        }

        // 1. Verify signature using timing-safe comparison
        const expectedDigest = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (!timingSafeEqual(expectedDigest, razorpay_signature)) {
            return res.status(400).json({ msg: 'Payment signature verification failed. Transaction is invalid.' });
        }

        // 2. Atomic status transition: pending → paid
        // Using findOneAndUpdate with { status: 'pending' } as a filter eliminates the
        // race condition where two concurrent verify/webhook calls both read 'pending'
        // and both try to transition to 'paid'.
        const dbOrder = await Order.findOneAndUpdate(
            {
                razorpayOrderId: razorpay_order_id,
                status: 'pending' // Only transition if still pending
            },
            {
                $set: {
                    status: 'paid',
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature
                },
                $inc: { version: 1 }
            },
            { new: true }
        );

        // 3. If no pending order was found, it was either already paid or doesn't exist
        if (!dbOrder) {
            // Check if it's already paid (idempotent success)
            const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });
            if (existingOrder && existingOrder.status === 'paid') {
                const user = await User.findById(req.user.id).select('subscription');
                return res.json({
                    msg: 'Payment already verified and subscription is active!',
                    subscription: user ? user.subscription : null
                });
            }
            return res.status(404).json({ msg: 'Payment order record not found in the database.' });
        }

        // 4. Verify that the order amounts match (safeguard against tampering)
        const plan = await SubscriptionPlan.findById(dbOrder.planId);
        if (!plan) {
            // Rollback order status
            await Order.findByIdAndUpdate(dbOrder._id, { $set: { status: 'failed' }, $inc: { version: 1 } });
            return res.status(400).json({ msg: 'Subscription plan not found.' });
        }

        const expectedPrice = dbOrder.billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
        if (dbOrder.amount !== expectedPrice) {
            await Order.findByIdAndUpdate(dbOrder._id, { $set: { status: 'failed' }, $inc: { version: 1 } });
            return res.status(400).json({ msg: 'Payment verification failed: Amount mismatch.' });
        }

        // 5. Activate subscription
        const user = await activateSubscription(req.user.id, dbOrder);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'Payment verified and subscription activated successfully!', subscription: user.subscription });
    } catch (err) {
        console.error('Razorpay Verify Payment Error:', err);
        res.status(500).json({ msg: 'Server error verifying payment', error: err.message });
    }
});

// @route   POST /payment/webhook
// @desc    Receive payment confirmation from global gateway and activate subscription
// @access  Public (Authenticated via Gateway HMAC Signature)
router.post('/payment/webhook', async (req, res) => {
    try {
        const webhookSecret = process.env.GATEWAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('[Webhook] GATEWAY_WEBHOOK_SECRET is not configured. Rejecting request.');
            return res.status(500).json({ msg: 'Webhook secret is not configured on the server.' });
        }

        const signature = req.headers['x-gateway-signature'];
        if (!signature) {
            return res.status(401).json({ msg: 'Missing webhook signature header.' });
        }

        // Use raw body for HMAC verification (falls back to JSON.stringify if rawBody unavailable)
        const payload = req.rawBody || JSON.stringify(req.body);

        // 1. Verify the signature using timing-safe comparison
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');

        if (!timingSafeEqual(expectedSignature, signature)) {
            return res.status(401).json({ msg: 'Unauthorized: signature verification failed' });
        }
        
        // 2. If signature matches and status is success, update subscription in database
        if (req.body.status === 'success') {
            const customerEmail = req.body.customer.email;
            
            // Calculate plan dates (e.g. 30 days expiry)
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            
            await User.findOneAndUpdate(
                { email: customerEmail },
                {
                    $set: {
                        'subscription.plan': 'starter', // Or parse from order metadata
                        'subscription.status': 'active',
                        'subscription.startDate': startDate,
                        'subscription.endDate': endDate,
                        'subscription.billingPeriod': 'monthly',
                        'subscription.autoRenew': false
                    }
                }
            );
            console.log(`Activated subscription for user: ${customerEmail}`);
        }
        res.status(200).json({ received: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ msg: 'Server error handling webhook' });
    }
});

// @route   GET /public/pricing-plans
// @desc    Get available pricing plans from database
// @access  Public
router.get('/public/pricing-plans', async (req, res) => {
    try {
        const totalCourses = await Course.countDocuments();
        const paidCourses = await Course.countDocuments({ type: 'paid' });
        const freeCourses = await Course.countDocuments({ type: 'free' });

        const plans = await SubscriptionPlan.find({ active: true }).lean();

        const formattedPlans = plans.map(plan => {
            const formattedFeatures = plan.features.map(f => {
                return f
                    .replace('{freeCourses}', Math.min(50, freeCourses))
                    .replace('{paidCourses}', Math.floor(paidCourses * 0.6))
                    .replace('{totalCourses}', totalCourses);
            });
            return {
                ...plan,
                features: formattedFeatures
            };
        });

        res.json(formattedPlans);
    } catch (err) {
        console.error('Error fetching pricing plans:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /payment/razorpay-webhook
// @desc    Receive payment confirmation from Razorpay webhook and activate subscription
// @access  Public (Authenticated via Razorpay Webhook Signature)
router.post('/payment/razorpay-webhook', async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Rejecting request.');
        return res.status(500).json({ msg: 'Webhook secret is not configured on the server.' });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        return res.status(400).json({ msg: 'Missing Razorpay signature header.' });
    }

    try {
        // Use raw body buffer for correct HMAC verification
        const payload = req.rawBody || JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload)
            .digest('hex');

        if (!timingSafeEqual(expectedSignature, signature)) {
            return res.status(400).json({ msg: 'Webhook signature verification failed.' });
        }

        const { event, payload: eventPayload } = req.body;

        if (event === 'order.paid') {
            const orderEntity = eventPayload.order.entity;
            const paymentEntity = eventPayload.payment.entity;

            const razorpayOrderId = orderEntity.id;
            const razorpayPaymentId = paymentEntity.id;

            // Atomic status transition: pending → paid
            // If verify endpoint already transitioned this order, this is a no-op
            const dbOrder = await Order.findOneAndUpdate(
                {
                    razorpayOrderId,
                    status: 'pending'
                },
                {
                    $set: {
                        status: 'paid',
                        razorpayPaymentId
                    },
                    $inc: { version: 1 }
                },
                { new: true }
            );

            if (dbOrder) {
                // Activate subscription only if we won the atomic transition
                const user = await activateSubscription(dbOrder.userId, dbOrder);
                if (user) {
                    const plan = await SubscriptionPlan.findById(dbOrder.planId);
                    const planName = plan ? plan.planType : 'unknown';
                    console.log(`[Webhook] Activated subscription ${planName} for user ${user.email}`);
                }
            } else {
                // Order was already paid by verify endpoint — this is expected and fine
                console.log(`[Webhook] Order ${razorpayOrderId} already processed. Skipping.`);
            }
        }

        res.json({ status: 'ok' });
    } catch (err) {
        console.error('Razorpay Webhook Error:', err);
        res.status(500).json({ msg: 'Server error handling webhook' });
    }
});

module.exports = router;

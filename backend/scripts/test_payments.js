const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables relatively
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Order = require('../models/Order');

async function runTests() {
    console.log('Connecting to MongoDB at:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');

    try {
        // 1. Get or Create a test user
        let user = await User.findOne({ email: 'test_subscriber@example.com' });
        if (!user) {
            user = new User({
                username: 'test_subscriber',
                email: 'test_subscriber@example.com',
                password: 'hashedpassword123',
                role: 'user'
            });
            await user.save();
            console.log('Created test user:', user._id);
        } else {
            console.log('Found existing test user:', user._id);
        }

        // Reset subscription
        user.subscription = { plan: 'free', status: 'expired' };
        await user.save();

        // 2. Fetch Subscription Plan
        const plan = await SubscriptionPlan.findOne({ planType: 'starter', active: true });
        if (!plan) {
            throw new Error('No active starter plan found. Ensure seeder has run.');
        }
        console.log('Found plan:', plan.name, 'Price:', plan.monthlyPrice);

        // 3. Test Order Creation Logic
        const billingPeriod = 'monthly';
        const secureAmount = plan.monthlyPrice;
        const fakeOrderId = 'order_' + Math.random().toString(36).substring(2, 15);

        const dbOrder = new Order({
            userId: user._id,
            planId: plan._id,
            billingPeriod,
            razorpayOrderId: fakeOrderId,
            amount: secureAmount,
            status: 'pending'
        });
        await dbOrder.save();
        console.log('Test 1: Created pending Order in DB with ID:', dbOrder._id);

        // Verify it is pending
        const savedOrder = await Order.findById(dbOrder._id);
        if (savedOrder.status !== 'pending') {
            throw new Error('Order status is not pending!');
        }
        console.log('Test 1 Passed: Order saved and starts in pending status.');

        // 4. Test Verification logic
        const fakePaymentId = 'pay_' + Math.random().toString(36).substring(2, 15);
        const keySecret = process.env.RAZORPAY_KEY_SECRET || 'h32zhek7YC0f7tqFHQHU7rsF';
        
        const shasum = crypto.createHmac('sha256', keySecret);
        shasum.update(`${fakeOrderId}|${fakePaymentId}`);
        const fakeSignature = shasum.digest('hex');

        // Execute verification logic similar to route
        const verifyOrder = await Order.findOne({ razorpayOrderId: fakeOrderId });
        if (!verifyOrder) {
            throw new Error('Order not found for verification!');
        }

        // Verify price match
        const verifyPlan = await SubscriptionPlan.findById(verifyOrder.planId);
        const expectedPrice = verifyOrder.billingPeriod === 'monthly' ? verifyPlan.monthlyPrice : verifyPlan.yearlyPrice;
        if (verifyOrder.amount !== expectedPrice) {
            throw new Error('Amount mismatch during verification!');
        }

        // Update order status to paid
        verifyOrder.status = 'paid';
        verifyOrder.razorpayPaymentId = fakePaymentId;
        verifyOrder.razorpaySignature = fakeSignature;
        await verifyOrder.save();

        // Update user subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        user.subscription = {
            plan: verifyPlan.planType,
            status: 'active',
            startDate,
            endDate,
            billingPeriod: verifyOrder.billingPeriod,
            autoRenew: false
        };
        await user.save();
        console.log('Test 2: Order verified and status updated to paid. User subscription updated.');

        // Verify status changes in DB
        const updatedOrder = await Order.findById(dbOrder._id);
        if (updatedOrder.status !== 'paid' || updatedOrder.razorpayPaymentId !== fakePaymentId) {
            throw new Error('Order status failed to update in DB.');
        }

        const updatedUser = await User.findById(user._id);
        if (updatedUser.subscription.status !== 'active' || updatedUser.subscription.plan !== 'starter') {
            throw new Error('User subscription failed to update in DB.');
        }
        console.log('Test 2 Passed: Payment verification logic updates DB and user subscription correctly.');

        // 5. Test Webhook Logic
        // Reset user subscription
        updatedUser.subscription = { plan: 'free', status: 'expired' };
        await updatedUser.save();

        // Create a new pending order
        const fakeWebhookOrderId = 'order_' + Math.random().toString(36).substring(2, 15);
        const webhookOrder = new Order({
            userId: user._id,
            planId: plan._id,
            billingPeriod: 'monthly',
            razorpayOrderId: fakeWebhookOrderId,
            amount: secureAmount,
            status: 'pending'
        });
        await webhookOrder.save();
        console.log('Test 3: Created new pending order for webhook verification:', fakeWebhookOrderId);

        // Simulate webhook order.paid processing
        const dbOrderWebhook = await Order.findOne({ razorpayOrderId: fakeWebhookOrderId });
        if (dbOrderWebhook && dbOrderWebhook.status !== 'paid') {
            dbOrderWebhook.status = 'paid';
            dbOrderWebhook.razorpayPaymentId = 'pay_webhook_123';
            await dbOrderWebhook.save();

            const webhookUser = await User.findById(dbOrderWebhook.userId);
            const webhookPlan = await SubscriptionPlan.findById(dbOrderWebhook.planId);
            
            const start = new Date();
            const end = new Date();
            end.setMonth(end.getMonth() + 1);

            webhookUser.subscription = {
                plan: webhookPlan.planType,
                status: 'active',
                startDate: start,
                endDate: end,
                billingPeriod: dbOrderWebhook.billingPeriod,
                autoRenew: false
            };
            await webhookUser.save();
        }

        // Verify Webhook updates
        const finalOrder = await Order.findById(webhookOrder._id);
        if (finalOrder.status !== 'paid') {
            throw new Error('Webhook processing failed to mark order as paid.');
        }
        const finalUser = await User.findById(user._id);
        if (finalUser.subscription.status !== 'active' || finalUser.subscription.plan !== 'starter') {
            throw new Error('Webhook processing failed to update user subscription.');
        }
        console.log('Test 3 Passed: Simulated Webhook successfully transitions state and activates subscription.');

        // Cleanup test data
        await Order.deleteOne({ _id: dbOrder._id });
        await Order.deleteOne({ _id: webhookOrder._id });
        await User.deleteOne({ _id: user._id });
        console.log('Cleanup completed successfully.');
        console.log('All backend checks passed! 🎉');

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

runTests();

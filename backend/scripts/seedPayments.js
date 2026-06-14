const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Order = require('../models/Order');

async function seedPayments() {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    try {
        // 1. Ensure test users exist
        console.log('Ensuring test users exist...');
        const usersInfo = [
            { username: 'admin_test', email: 'admin_test@example.test', role: 'admin' },
            { username: 'jane_staff', email: 'jane_staff@example.test', role: 'staff' },
            { username: 'john_staff', email: 'john_staff@example.test', role: 'staff' },
            { username: 'amy_user', email: 'amy_user@example.test', role: 'user' },
            { username: 'bob_user', email: 'bob_user@example.test', role: 'user' },
            { username: 'developer_coder', email: 'coder@example.test', role: 'user' }
        ];

        const users = {};
        for (const info of usersInfo) {
            let u = await User.findOne({ email: info.email });
            if (!u) {
                u = new User({
                    username: info.username,
                    email: info.email,
                    password: 'TestPassword123', // plaintext password, schema save hook will hash
                    role: info.role,
                    bio: `${info.username} profile bio`
                });
                await u.save();
                console.log(`Created user: ${info.email}`);
            } else {
                console.log(`User already exists: ${info.email}`);
            }
            users[info.username] = u;
        }

        // 2. Ensure plans exist
        console.log('Fetching plans...');
        const plans = await SubscriptionPlan.find();
        if (plans.length === 0) {
            console.log('No plans found, please run seeder or start backend first.');
            return;
        }

        const planMap = {};
        plans.forEach(p => {
            planMap[p.planType + (p.isForumPremium ? '_forum' : '')] = p;
        });

        // If plans don't map completely, try mapping by name
        plans.forEach(p => {
            planMap[p.name.toLowerCase()] = p;
        });

        console.log('Available plan types mapped:', Object.keys(planMap));

        // 3. Create mock orders
        console.log('Creating mock orders...');

        // Clear existing orders to have a clean slate for the demo/dashboard
        const deleteRes = await Order.deleteMany({});
        console.log(`Deleted ${deleteRes.deletedCount} existing orders.`);

        const mockOrders = [
            {
                user: users.amy_user,
                plan: planMap['starter'] || plans[0],
                billingPeriod: 'monthly',
                amount: (planMap['starter'] || plans[0]).monthlyPrice,
                status: 'paid',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
            },
            {
                user: users.bob_user,
                plan: planMap['professional'] || plans[1] || plans[0],
                billingPeriod: 'yearly',
                amount: (planMap['professional'] || plans[1] || plans[0]).yearlyPrice,
                status: 'paid',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
            },
            {
                user: users.developer_coder,
                plan: planMap['enterprise'] || plans[2] || plans[0],
                billingPeriod: 'monthly',
                amount: (planMap['enterprise'] || plans[2] || plans[0]).monthlyPrice,
                status: 'paid',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
            },
            {
                user: users.amy_user,
                plan: planMap['forum premium'] || planMap['professional_forum'] || plans[3] || plans[0],
                billingPeriod: 'monthly',
                amount: (planMap['forum premium'] || planMap['professional_forum'] || plans[3] || plans[0]).monthlyPrice,
                status: 'paid',
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
            },
            {
                user: users.jane_staff,
                plan: planMap['forum premium'] || planMap['professional_forum'] || plans[3] || plans[0],
                billingPeriod: 'yearly',
                amount: (planMap['forum premium'] || planMap['professional_forum'] || plans[3] || plans[0]).yearlyPrice,
                status: 'paid',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
            },
            {
                user: users.john_staff,
                plan: planMap['starter'] || plans[0],
                billingPeriod: 'monthly',
                amount: (planMap['starter'] || plans[0]).monthlyPrice,
                status: 'pending',
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
            },
            {
                user: users.developer_coder,
                plan: planMap['professional'] || plans[1] || plans[0],
                billingPeriod: 'monthly',
                amount: (planMap['professional'] || plans[1] || plans[0]).monthlyPrice,
                status: 'failed',
                createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
            }
        ];

        for (const item of mockOrders) {
            if (!item.user || !item.plan) {
                console.log(`Skipping order item due to missing user or plan reference.`);
                continue;
            }
            const orderId = 'order_' + Math.random().toString(36).substring(2, 15);
            const paymentId = item.status === 'paid' ? 'pay_' + Math.random().toString(36).substring(2, 15) : undefined;
            
            const newOrder = new Order({
                userId: item.user._id,
                planId: item.plan._id,
                billingPeriod: item.billingPeriod,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                amount: item.amount,
                status: item.status,
                createdAt: item.createdAt,
                updatedAt: item.createdAt
            });

            await newOrder.save();
            console.log(`Saved mock order: ${item.user.username} - ${item.plan.name} (${item.status}) - ₹${item.amount}`);
        }

        console.log('Mock payments seeding completed successfully!');
    } catch (e) {
        console.error('Seeding payments error:', e);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

seedPayments();

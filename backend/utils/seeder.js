const SubscriptionPlan = require('../models/SubscriptionPlan');

const seedSubscriptionPlans = async () => {
    try {
        const count = await SubscriptionPlan.countDocuments();
        if (count === 0) {
            const defaultPlans = [
                {
                    name: 'Starter',
                    planType: 'starter',
                    description: 'Perfect for beginners getting started',
                    monthlyPrice: 29,
                    yearlyPrice: 290,
                    features: [
                        'Access to {freeCourses}+ courses',
                        'Basic project templates',
                        'Community forum access',
                        'Email support',
                        'Certificate of completion',
                        'Mobile app access'
                    ],
                    isPopular: false,
                    isForumPremium: false,
                    quizLimit: 3,
                    active: true
                },
                {
                    name: 'Professional',
                    planType: 'professional',
                    description: 'Most popular for serious learners',
                    monthlyPrice: 59,
                    yearlyPrice: 590,
                    features: [
                        'Access to {paidCourses}+ courses',
                        'Advanced project templates',
                        'Priority community support',
                        'Live Q&A sessions',
                        'Verified certificates',
                        'Career guidance',
                        'Coding challenges',
                        'GitHub integration'
                    ],
                    isPopular: true,
                    isForumPremium: false,
                    quizLimit: 3,
                    active: true
                },
                {
                    name: 'Enterprise',
                    planType: 'enterprise',
                    description: 'For teams and organizations',
                    monthlyPrice: 99,
                    yearlyPrice: 990,
                    features: [
                        'Access to all courses',
                        'Custom learning paths',
                        'Team management',
                        'Advanced analytics',
                        'Dedicated support',
                        'Custom integrations',
                        'White-label options',
                        'API access'
                    ],
                    isPopular: false,
                    isForumPremium: false,
                    quizLimit: 3,
                    active: true
                },
                {
                    name: 'Forum Premium',
                    planType: 'professional',
                    description: 'Unlock priority posting and premium previews in the forum',
                    monthlyPrice: 99,
                    yearlyPrice: 999,
                    features: [
                        'Unlimited posts & replies',
                        'Priority visibility',
                        'Premium course previews',
                        'Ad-free browsing',
                        'Badge & priority support',
                        'Post analytics'
                    ],
                    isPopular: false,
                    isForumPremium: true,
                    quizLimit: 3,
                    active: true
                }
            ];
            await SubscriptionPlan.insertMany(defaultPlans);
            console.log('Seeded default subscription plans successfully.');
        }
    } catch (err) {
        console.error('Error seeding subscription plans:', err);
    }
};

module.exports = { seedSubscriptionPlans };

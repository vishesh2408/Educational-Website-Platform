const SubscriptionPlan = require('../models/SubscriptionPlan');
const ResourceSection = require('../models/ResourceSection');
const Note = require('../models/Note');

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

const seedResourceSections = async () => {
    try {
        const count = await ResourceSection.countDocuments();
        if (count === 0) {
            const sections = [
                // Roadmaps
                {
                    title: 'Frontend Developer Roadmap',
                    description: 'A comprehensive guide to becoming a frontend engineer in 2026, starting from HTML/CSS to React, Next.js, and advanced performance optimizations.',
                    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
                    type: 'roadmap'
                },
                {
                    title: 'Backend Developer Roadmap',
                    description: 'Learn servers, databases, APIs, system design, microservices, and deployment architectures using Node.js, Express, and databases.',
                    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
                    type: 'roadmap'
                },
                // Interviews
                {
                    title: 'React.js Core Concepts Q&A',
                    description: 'Top technical interview questions on Virtual DOM, Hooks, state managers, rendering cycles, and architectural patterns.',
                    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
                    type: 'interview'
                },
                {
                    title: 'System Design Fundamentals',
                    description: 'Master scale, caching, databases, load balancing, CDNs, and proxy architectures for high-load systems.',
                    imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
                    type: 'interview'
                },
                // Placements
                {
                    title: 'Ultimate Resume & Portfolio Guide',
                    description: 'How to write a standard resume, showcase projects, optimize LinkedIn, and stand out to top technical recruiters.',
                    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
                    type: 'placement'
                },
                {
                    title: 'Off-Campus Placement Blueprint',
                    description: 'How to look for referrals, apply on job boards, use cold emails, and leverage community networks effectively.',
                    imageUrl: 'https://images.unsplash.com/photo-1521791136368-1a9b7d89536d?auto=format&fit=crop&w=600&q=80',
                    type: 'placement'
                },
                // Software & Tools
                {
                    title: 'Must-Have VS Code Extensions',
                    description: 'Increase your coding speed with extensions for formatting, git tools, refactoring, and AI-assisted autocomplete.',
                    imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80',
                    type: 'software_tool'
                },
                {
                    title: 'Design & Visual Assets for Developers',
                    description: 'Curated design tools, SVG libraries, HSL palettes, glassmorphism generators, and illustration kits.',
                    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
                    type: 'software_tool'
                },
                // Miscellaneous
                {
                    title: 'General Tech & Coding Tips',
                    description: 'Explore miscellaneous articles, coding tips, Git guides, and general computer science topics.',
                    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
                    type: 'miscellaneous'
                }
            ];
            
            const savedSections = await ResourceSection.insertMany(sections);
            console.log('Seeded default resource sections successfully.');
            
            // Seed a few starter notes attached to these sections!
            const notes = [
                {
                    title: 'HTML & CSS Essentials',
                    subject: 'Frontend Roadmap: Step 1',
                    content: '<h2>Step 1: HTML & CSS</h2><p>Understand semantic elements (header, nav, article), responsive layouts using Flexbox and Grid, and custom CSS variables for design systems.</p>',
                    sectionId: savedSections[0]._id
                },
                {
                    title: 'JavaScript Deep Dive',
                    subject: 'Frontend Roadmap: Step 2',
                    content: '<h2>Step 2: Modern JavaScript</h2><p>Master scopes, closures, async/await promises, ES6 syntax modules, DOM selectors, and HTTP fetch operations.</p>',
                    sectionId: savedSections[0]._id
                },
                {
                    title: 'Node.js & Express Basics',
                    subject: 'Backend Roadmap: Step 1',
                    content: '<h2>Step 1: Runtime & Server</h2><p>Understand Node.js event loop, file system APIs, and building clean RESTful APIs using Express middleware and routing.</p>',
                    sectionId: savedSections[1]._id
                },
                {
                    title: 'React State Management Q&A',
                    subject: 'Interview Prep: React',
                    content: '<h2>React State Management</h2><p>Q: What is the difference between Context API and Redux?<br>A: Context API is built-in for passing props down. Redux is a global store with actions/reducers for complex state.</p>',
                    sectionId: savedSections[2]._id
                },
                {
                    title: 'How to structure your Project list',
                    subject: 'Placement: Resume Building',
                    content: '<h2>Showcasing Projects</h2><p>Always use the STAR method (Situation, Task, Action, Result) when describing your developer projects on your resume.</p>',
                    sectionId: savedSections[4]._id
                },
                {
                    title: 'Top VS Code Extensions',
                    subject: 'Software & Tools',
                    content: '<h2>Productivity Boosters</h2><ul><li>Prettier: Code formatter</li><li>GitLens: Blame annotations</li><li>Thunder Client: REST API client</li></ul>',
                    sectionId: savedSections[6]._id
                },
                {
                    title: 'Git & GitHub Basics',
                    subject: 'Git Tools',
                    content: '<h2>Git Version Control</h2><p>Learn how to initialize a repository, track files, commit code, and push to remote systems like GitHub.</p>',
                    sectionId: savedSections[8]._id
                }
            ];
            await Note.insertMany(notes);
            console.log('Seeded starter resource notes successfully.');
        } else {
            // If database is already seeded but doesn't have miscellaneous type sections
            const miscCount = await ResourceSection.countDocuments({ type: 'miscellaneous' });
            if (miscCount === 0) {
                const miscSec = await ResourceSection.create({
                    title: 'General Tech & Coding Tips',
                    description: 'Explore miscellaneous articles, coding tips, Git guides, and general computer science topics.',
                    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
                    type: 'miscellaneous'
                });
                await Note.create({
                    title: 'Git & GitHub Basics',
                    subject: 'Git Tools',
                    content: '<h2>Git Version Control</h2><p>Learn how to initialize a repository, track files, commit code, and push to remote systems like GitHub.</p>',
                    sectionId: miscSec._id
                });
                console.log('Seeded default miscellaneous resource section & note successfully.');
            }
        }
    } catch (err) {
        console.error('Error seeding resource sections:', err);
    }
};

module.exports = { seedSubscriptionPlans, seedResourceSections };

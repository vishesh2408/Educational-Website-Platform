const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const ForumPost = require('../models/ForumPost');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/myedu';

async function seed() {
  console.log('Connecting to', MONGO);
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Helper to create or find user
    async function findOrCreateUser({ username, email, password, role = 'user', profilePicture = '', bio = '', staffBio = '' }) {
      let user = await User.findOne({ email });
      if (user) {
        console.log('Found existing user:', email);
        return user;
      }

      // NOTE: `User` schema has a pre('save') hook that hashes the password.
      // Do NOT pre-hash here; pass the plaintext password so the hook runs once.
      user = new User({ username, email, password, role, profilePicture, bio });
      if (role === 'staff') {
        user.staffProfile = user.staffProfile || {};
        user.staffProfile.bio = staffBio || bio;
      }
      await user.save();
      console.log('Created user:', email);
      return user;
    }

    // Create users
    const admin = await findOrCreateUser({ username: 'admin_test', email: 'admin_test@example.test', password: 'AdminPass123', role: 'admin', profilePicture: '', bio: 'Site admin' });
    const staff1 = await findOrCreateUser({ username: 'jane_staff', email: 'jane_staff@example.test', password: 'StaffPass123', role: 'staff', profilePicture: '', bio: 'Staff mentor', staffBio: 'Experienced mentor in algorithms' });
    const staff2 = await findOrCreateUser({ username: 'john_staff', email: 'john_staff@example.test', password: 'StaffPass123', role: 'staff', profilePicture: '', bio: 'Staff helper', staffBio: 'React and frontend expert' });
    const user1 = await findOrCreateUser({ username: 'amy_user', email: 'amy_user@example.test', password: 'UserPass123', role: 'user', profilePicture: '', bio: 'Learner of CS' });
    const user2 = await findOrCreateUser({ username: 'bob_user', email: 'bob_user@example.test', password: 'UserPass123', role: 'user', profilePicture: '', bio: 'Competitive programmer' });

    // Create posts (only if they don't exist)
    async function createPostIfMissing({ title, content, userId, visibility = 'public' }) {
      const exists = await ForumPost.findOne({ title, userId });
      if (exists) {
        console.log('Post exists:', title);
        return exists;
      }
      const p = new ForumPost({ title, content, userId, visibility, parentId: null });
      await p.save();
      console.log('Created post:', title);
      return p;
    }

    // Two admin posts
    await createPostIfMissing({ title: 'Welcome to LearnBent', content: 'This is an official announcement from LearnBent admin.', userId: admin._id });
    await createPostIfMissing({ title: 'Platform Updates', content: 'We have rolled out some improvements.', userId: admin._id });

    // Some user posts
    await createPostIfMissing({ title: 'How to study algorithms?', content: 'Any suggestions on resources to practice algorithms?', userId: user1._id });
    await createPostIfMissing({ title: 'React state management', content: 'What patterns do you use for local/global state?', userId: user2._id });

    console.log('\nSeeding complete.');
    // Show sample counts
    const counts = {
      users: await User.countDocuments(),
      posts: await ForumPost.countDocuments({ parentId: null })
    };
    console.log('Totals:', counts);
  } catch (e) {
    console.error('Seed error', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();

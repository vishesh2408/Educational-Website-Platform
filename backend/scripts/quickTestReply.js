const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const ForumPost = require('../models/ForumPost');

const BASE_URL = process.env.BACKEND_URI || 'http://localhost:3001';

async function main(){
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myedu';
  const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB for quickTestReply');

  // Create or find staff user
  let staff = await User.findOne({ email: 'test-staff@example.com' });
  let createdStaff = false;
  if (!staff) {
    const hashed = await bcrypt.hash('Password123', 10);
    staff = new User({ username: 'test-staff', email: 'test-staff@example.com', password: hashed, role: 'staff' });
    await staff.save();
    createdStaff = true;
    console.log('Created test staff user:', staff._id.toString());
  } else {
    console.log('Found existing staff user:', staff._id.toString());
  }

  // Create or find post author
  let author = await User.findOne({ email: 'test-poster@example.com' });
  let createdAuthor = false;
  if (!author) {
    const hashed = await bcrypt.hash('Password123', 10);
    author = new User({ username: 'test-poster', email: 'test-poster@example.com', password: hashed, role: 'user' });
    await author.save();
    createdAuthor = true;
    console.log('Created test post author:', author._id.toString());
  } else {
    console.log('Found existing post author:', author._id.toString());
  }

  // Create a top-level post
  const post = new ForumPost({
    title: 'Quick Test Post',
    content: 'This is a quick test post for automated reply test',
    userId: author._id,
    visibility: 'public',
  });
  await post.save();
  console.log('Created test post:', post._id.toString());

  // Sign JWT for staff user
  const payload = { user: { id: staff._id.toString(), username: staff.username, email: staff.email, role: staff.role } };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

  // Use fetch to call the API (Node 18+ has global fetch)
  const url = `${BASE_URL}/api/forum-posts/${post._id}/replies`;
  console.log('Posting reply to', url);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `token=${token}` },
      body: JSON.stringify({ content: 'Automated test reply from script' }),
    });

    const json = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(json, null, 2));

    // Clean up: delete reply, post, and optionally created users
    if (json && json.reply && json.reply._id) {
      await ForumPost.deleteOne({ _id: json.reply._id });
      console.log('Deleted created reply');
    }
  } catch (err) {
    console.error('Error calling API:', err);
  } finally {
    await ForumPost.deleteOne({ _id: post._id });
    console.log('Deleted test post');

    if (createdStaff) {
      await User.deleteOne({ _id: staff._id });
      console.log('Deleted test staff');
    }
    if (createdAuthor) {
      await User.deleteOne({ _id: author._id });
      console.log('Deleted test author');
    }

    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

main().catch(err => {
  console.error('Quick test error:', err);
  process.exit(1);
});

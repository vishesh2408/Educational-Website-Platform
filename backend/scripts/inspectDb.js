const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ForumPost = require('../models/ForumPost');

dotenv.config();

async function inspect() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/myedu';
  console.log('Connecting to', uri);
  await mongoose.connect(uri);
  console.log('Connected');

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:');
  collections.forEach(c => console.log(' -', c.name));

  // Try using the ForumPost model
  try {
    const count = await ForumPost.countDocuments();
    console.log('ForumPost.countDocuments =', count);
    const sample = await ForumPost.findOne().lean();
    console.log('ForumPost.sample:', sample);
  } catch (err) {
    console.error('ForumPost model query failed:', err.message);
  }

  // Native collection access (raw)
  try {
    const raw = mongoose.connection.db.collection('forumposts');
    const rawCount = await raw.countDocuments();
    console.log('Raw forumposts.countDocuments =', rawCount);
    const rawSample = await raw.findOne();
    console.log('Raw forumposts.sample:', rawSample);
  } catch (err) {
    console.error('Raw collection access failed:', err.message);
  }

  await mongoose.disconnect();
  console.log('Disconnected');
}

inspect().catch(err => {
  console.error('Inspect failed', err);
  process.exit(1);
});

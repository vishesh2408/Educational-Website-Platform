const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User');

dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to DB for migration');

  const posts = await ForumPost.find();
  console.log(`Found ${posts.length} forum posts`);

  for (const post of posts) {
    try {
      if (!post.userId) continue;
      const uid = post.userId;
      // If already an ObjectId, skip
      if (typeof uid === 'object' && uid._bsontype === 'ObjectID') continue;

      // If looks like a 24-hex string, cast to ObjectId if user exists
      if (typeof uid === 'string' && /^[0-9a-fA-F]{24}$/.test(uid)) {
        const user = await User.findById(uid);
        if (user) {
          post.userId = mongoose.Types.ObjectId(uid);
          await post.save();
          console.log(`Converted string id to ObjectId for post ${post._id}`);
          continue;
        }
      }

      // Otherwise try to find user by username or email matching the stored string
      if (typeof uid === 'string') {
        let user = await User.findOne({ username: uid });
        if (!user) user = await User.findOne({ email: uid });
        if (user) {
          post.userId = user._id;
          await post.save();
          console.log(`Mapped username/email to user ObjectId for post ${post._id}`);
          continue;
        }
      }

      console.warn(`Could not migrate userId for post ${post._id}: ${uid}`);
    } catch (err) {
      console.error('Error migrating post', post._id, err.message);
    }
  }

  console.log('Migration complete');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed', err);
  process.exit(1);
});

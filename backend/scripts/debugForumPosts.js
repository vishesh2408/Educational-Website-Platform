(async function(){
  const mongoose = require('mongoose');
  const fetch = global.fetch || (await import('node-fetch')).default;
  const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/myedu';
  try{
    console.log('Connecting to', dbUri);
    await mongoose.connect(dbUri);
    const ForumPost = require('../models/ForumPost');
    const User = require('../models/User');

    const posts = await ForumPost.find().limit(30).lean();
    console.log('Sample forum posts (up to 30):');
    posts.forEach(p => {
      console.log({
        _id: String(p._id),
        parentId: p.parentId ? String(p.parentId) : null,
        userId_type: typeof p.userId,
        userId_value: p.userId,
        title: p.title || null,
        createdAt: p.createdAt
      });
    });

    // Run the same aggregation used by server to get top contributors
    const limit = 10;
    const agg = await ForumPost.aggregate([
      { $match: { parentId: null } },
      { $group: { _id: '$userId', discussions: { $sum: 1 } } },
      { $sort: { discussions: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { id: '$_id', name: { $ifNull: ['$user.username', 'Unknown User'] }, email: { $ifNull: ['$user.email', ''] }, profilePicture: { $ifNull: ['$user.profilePicture', ''] }, discussions: 1 } }
    ]);

    console.log('\nTop contributors aggregation result:');
    console.log(agg);

    // For contributors that show Unknown User, try to find the referenced user doc
    for(const c of agg){
      if(c.name === 'Unknown User'){
        try{
          const id = c.id;
          console.log('\nLooking up user doc for id:', id);
          const u = await User.findById(id).lean();
          console.log('lookup result:', u);
        }catch(e){
          console.error('lookup error for', c.id, e && e.message);
        }
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  }catch(e){
    console.error('debugForumPosts error', e);
    process.exit(1);
  }
})();

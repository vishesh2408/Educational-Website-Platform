const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Topic = require('../models/Topic');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myedu';

async function verify() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    const courseCount = await Course.countDocuments();
    const moduleCount = await Module.countDocuments();
    const topicCount = await Topic.countDocuments();

    console.log(`Counts: courses=${courseCount}, modules=${moduleCount}, topics=${topicCount}`);

    const courses = await Course.find({ title: { $in: ['Java Programming', 'C++ Programming'] } }).lean();
    for (const c of courses) {
      console.log('\nCourse:', c.title, `(_id:${c._id})`);
      const mods = await Module.find({ courseId: c._id }).lean();
      console.log(`  Modules: ${mods.length}`);
      for (const m of mods) {
        const topics = await Topic.find({ moduleId: m._id }).lean();
        console.log(`    - ${m.title} (_id:${m._id}) -> topics: ${topics.length}`);
        for (const t of topics.slice(0,3)) {
          console.log(`       • ${t.title} (_id:${t._id})`);
        }
      }
    }

  } catch (err) {
    console.error('Verify error:', err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

verify();

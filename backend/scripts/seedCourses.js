const mongoose = require('mongoose');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Topic = require('../models/Topic');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myedu';

const seedData = [
  {
    title: 'Java Programming',
    description: 'Comprehensive Java course from basics to advanced topics, including OOP, Collections and Concurrency.',
    type: 'free',
    price: 'Free',
    imageUrl: '',
    modules: [
      {
        title: 'Java Basics',
        topics: [
          { title: 'Introduction & Setup', notes: 'JDK, JRE, IDE setup, first program' },
          { title: 'Syntax & Datatypes', notes: 'Variables, primitive types, operators' },
          { title: 'Control Flow', notes: 'if, switch, loops' }
        ]
      },
      {
        title: 'Object-Oriented Programming',
        topics: [
          { title: 'Classes & Objects', notes: 'Defining classes, constructors, this keyword' },
          { title: 'Inheritance & Polymorphism', notes: 'extends, method overriding, instanceof' },
          { title: 'Encapsulation & Abstraction', notes: 'Access modifiers, abstract classes, interfaces' }
        ]
      },
      {
        title: 'Collections & Generics',
        topics: [
          { title: 'Collections Framework', notes: 'List, Set, Map, Queue overview' },
          { title: 'ArrayList vs LinkedList', notes: 'Use-cases and complexity' },
          { title: 'Generics', notes: 'Generic classes and methods' }
        ]
      },
      {
        title: 'Concurrency',
        topics: [
          { title: 'Threads & Runnable', notes: 'Creating threads, Runnable interface' },
          { title: 'Synchronization', notes: 'synchronized, locks' },
          { title: 'Executors & Concurrent Collections', notes: 'Thread pools, ConcurrentHashMap' }
        ]
      },
      {
        title: 'I/O & JDBC',
        topics: [
          { title: 'File I/O', notes: 'Streams, Readers/Writers, NIO basics' },
          { title: 'JDBC Basics', notes: 'Connecting to DB, executing queries' }
        ]
      }
    ]
  },
  {
    title: 'C++ Programming',
    description: 'Practical C++ course covering syntax, memory management, STL and modern C++ features.',
    type: 'free',
    price: 'Free',
    imageUrl: '',
    modules: [
      {
        title: 'C++ Fundamentals',
        topics: [
          { title: 'Setup & Hello World', notes: 'Compiler setup, first program' },
          { title: 'Syntax & Types', notes: 'Variables, primitives, operators' },
          { title: 'Control Flow', notes: 'if, switch, loops' }
        ]
      },
      {
        title: 'Functions & OOP',
        topics: [
          { title: 'Functions & Overloading', notes: 'Function signatures, default args' },
          { title: 'Classes & Objects', notes: 'Constructors, destructors, this pointer' },
          { title: 'Inheritance & Polymorphism', notes: 'virtual functions, RTTI' }
        ]
      },
      {
        title: 'Memory Management',
        topics: [
          { title: 'Pointers & References', notes: 'Pointer arithmetic, references' },
          { title: 'Dynamic Allocation', notes: 'new/delete, RAII' },
          { title: 'Smart Pointers', notes: 'unique_ptr, shared_ptr, weak_ptr' }
        ]
      },
      {
        title: 'STL & Templates',
        topics: [
          { title: 'Containers', notes: 'vector, list, map, set' },
          { title: 'Algorithms', notes: 'sort, find, transform' },
          { title: 'Templates', notes: 'Function and class templates' }
        ]
      },
      {
        title: 'Modern C++',
        topics: [
          { title: 'C++11/14/17 Features', notes: 'auto, range-for, lambda, move semantics' },
          { title: 'Concurrency', notes: 'std::thread, mutex, condition_variable' }
        ]
      }
    ]
  }
];

const readline = require('readline');

const args = process.argv.slice(2);
const FORCE = args.includes('--force') || args.includes('--recreate');
const CONFIRM_YES = args.includes('--yes') || args.includes('-y');

async function askConfirmation(prompt) {
  if (CONFIRM_YES) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes' || answer.trim() === 'YES');
    });
  });
}

async function seed() {
  console.log('Connecting to MongoDB:', MONGO_URI);
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  if (FORCE) {
    console.log('Force mode enabled: existing seeded courses will be removed before seeding.');
    const confirmed = await askConfirmation('Type YES to confirm deletion of seeded courses: ');
    if (!confirmed) {
      console.log('Aborting seed: user did not confirm.');
      await mongoose.disconnect();
      process.exit(0);
    }

    try {
      for (const courseData of seedData) {
        const existing = await Course.findOne({ title: courseData.title });
        if (!existing) continue;
        // find modules for this course
        const mods = await Module.find({ courseId: existing._id });
        const modIds = mods.map(m => m._id);
        if (modIds.length) {
          await Topic.deleteMany({ moduleId: { $in: modIds } });
        }
        await Module.deleteMany({ courseId: existing._id });
        await Course.deleteOne({ _id: existing._id });
        console.log(`Deleted existing seeded course and related modules/topics: ${courseData.title}`);
      }
    } catch (err) {
      console.error('Error while deleting existing seeded data:', err);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  try {
    for (const courseData of seedData) {
      const existing = await Course.findOne({ title: courseData.title });
      if (existing) {
        console.log(`Course "${courseData.title}" already exists. Skipping.`);
        continue;
      }

      const course = new Course({
        title: courseData.title,
        description: courseData.description,
        type: courseData.type,
        price: courseData.price,
        imageUrl: courseData.imageUrl || '',
        rating: 0,
        modules: []
      });

      await course.save();
      console.log(`Created course: ${course.title} (${course._id})`);

      let moduleOrder = 1;
      for (const modData of courseData.modules) {
        const mod = new Module({
          courseId: course._id,
          title: modData.title,
          order: moduleOrder++,
          topics: []
        });
        await mod.save();

        let topicOrder = 1;
        for (const t of modData.topics) {
          const topic = new Topic({
            moduleId: mod._id,
            title: t.title,
            order: topicOrder++,
            articles: Array.isArray(t.articles) ? t.articles : [
              {
                heading: t.title || '',
                content: t.notes || '',
                videoURL: t.videoURL || '',
                quizId: t.quizId || null,
                order: 0,
              }
            ],
          });
          await topic.save();
          mod.topics.push(topic._id);
        }

        await mod.save();
        course.modules.push(mod._id);
        console.log(`  Added module: ${mod.title} (${mod._id}) with ${mod.topics.length} topics`);
      }

      await course.save();
      console.log(`Finished seeding course: ${course.title}`);
    }

    console.log('Seeding completed.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});

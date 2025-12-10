// const mongoose = require("mongoose");
// const Topic = require("./models/Topic");
// const Module = require("./models/Module");

// const migrateModuleId = async () => {
//   try {
//     // ✅ Connect to MongoDB
//     await mongoose.connect("mongodb://localhost:27017/eduDB", {
//       serverSelectionTimeoutMS: 5000,
//     });
//     console.log("MongoDB connected successfully 🚀");

//     // ✅ Step 1: Get or create a default module
//     let defaultModule = await Module.findOne();
//     if (!defaultModule) {
//       defaultModule = await Module.create({ name: "Default Module" });
//       console.log("Created default module:", defaultModule._id);
//     }

//     // ✅ Step 2: Find topics missing `moduleId`
//     const topics = await Topic.find({ moduleId: { $exists: false } });
//     console.log(`Found ${topics.length} topics to migrate.`);

//     // ✅ Step 3: Update topics
//     if (topics.length > 0) {
//       await Promise.all(
//         topics.map((topic) =>
//           Topic.updateOne(
//             { _id: topic._id },
//             { $set: { moduleId: defaultModule._id } }
//           )
//         )
//       );
//       console.log("Migration complete ✅");
//     } else {
//       console.log("No topics required migration ✅");
//     }

//     await mongoose.disconnect();
//     console.log("MongoDB disconnected successfully 🟢");
//   } catch (error) {
//     console.error("Migration failed ❌", error);
//     await mongoose.disconnect();
//   }
// };

// migrateModuleId();


// // test.js
// const mongoose = require("mongoose");
// const User = require("./models/User"); // Adjust path if needed

// // Connect to MongoDB
// mongoose.connect("mongodb://localhost:27017/eduDB");

// const migrateUserLoginFields = async () => {
//   try {
//     // Step 1: Find users missing any of the new fields
//     const users = await User.find({
//       $or: [
//         { otp: { $exists: false } },
//         { otpExpires: { $exists: false } },
//         { resetPasswordToken: { $exists: false } },
//         { resetPasswordExpires: { $exists: false } },
//         // { failedLoginAttempts: { $exists: false } },
//         // { lastLoginAttempt: { $exists: false } },
//         // { isLocked: { $exists: false } },
//       ],
//     });

//     console.log(`Found ${users.length} users to migrate.`);

//     // Step 2: Update each user
//     const updates = users.map((user) => {
//       const update = {};
//       if (user.otp === undefined) {
//         update.otp = null;
//       }
//       if (user.otpExpires === undefined) {
//         update.otpExpires = null;
//       }
//       if (user.resetPasswordToken === undefined) {
//         update.resetPasswordToken = null;
//       }
//       if (user.resetPasswordExpires === undefined) {
//         update.resetPasswordExpires = null;
//       }
//       // if (user.failedLoginAttempts === undefined) {
//       //   update.failedLoginAttempts = 0;
//       // }
//       // if (user.lastLoginAttempt === undefined) {
//       //   update.lastLoginAttempt = null;
//       // }
//       // if (user.isLocked === undefined) {
//       //   update.isLocked = false;
//       // }

//       return User.updateOne({ _id: user._id }, { $set: update });
//     });

//     await Promise.all(updates);
//     console.log("Migration complete ✅");
//   } catch (error) {
//     console.error("Migration failed ❌", error);
//   } finally {
//     mongoose.disconnect();
//   }
// };

// migrateUserLoginFields();



// const mongoose = require("mongoose");
// const User = require("./models/User");       // Adjust path if needed
// const Course = require("./models/Course");
// const Topic = require("./models/Topic");
// const UserProgress = require("./models/UserProgress");

// // Connect to MongoDB
// mongoose.connect("mongodb://localhost:27017/eduDB");

// const migrateUserProgress = async () => {
//   try {
//     const users = await User.find();
//     const courses = await Course.find();

//     console.log(`Found ${users.length} users and ${courses.length} courses.`);

//     for (const user of users) {
//       for (const course of courses) {
//         // Check if progress already exists
//         const existing = await UserProgress.findOne({
//           userId: user._id,
//           courseId: course._id,
//         });

//         if (existing) continue;

//         // Get topics for this course (assuming course has a module/topic relationship)
//         const topics = await Topic.find({ moduleId: { $in: course.modules || [] } });

//         const topicProgress = topics.map((topic) => ({
//           topicId: topic._id,
//           isCompleted: false,
//           lastViewed: new Date(),
//           timeSpent: 0,
//         }));

//         await UserProgress.create({
//           userId: user._id,
//           courseId: course._id,
//           globalStartTime: null,
//           globalEndTime: null,
//           totalTimeSpent: 0,
//           lastViewedTopicId: null,
//           topicProgress,
//         });

//         console.log(`Created progress for user ${user.username} in course ${course.name}`);
//       }
//     }

//     console.log("Migration complete ✅");
//   } catch (error) {
//     console.error("Migration failed ❌", error);
//   } finally {
//     mongoose.disconnect();
//   }
// };

// migrateUserProgress();




// const mongoose = require("mongoose");
// const User = require("./models/User");

// mongoose.connect("mongodb://localhost:27017/eduDB");

// const migrateUserLoginFields = async () => {
//   try {
//     const users = await User.find({
//       $or: [
//         { otp: { $exists: false } },
//         { otpExpires: { $exists: false } },
//         { resetPasswordToken: { $exists: false } },
//         { resetPasswordExpires: { $exists: false } },
//       ],
//     });

//     console.log(`Found ${users.length} users to migrate.`);

//     const updates = users.map((user) => {
//       const update = {};

//       if (user.otp === undefined) update.otp = null;
//       if (user.otpExpires === undefined) update.otpExpires = null;
//       if (user.resetPasswordToken === undefined) update.resetPasswordToken = null;
//       if (user.resetPasswordExpires === undefined) update.resetPasswordExpires = null;

//       if (Object.keys(update).length > 0) {
//         return User.updateOne({ _id: user._id }, { $set: update });
//       } else {
//         return Promise.resolve(); // No update needed
//       }
//     });

//     await Promise.all(updates);
//     console.log("Migration complete ✅");
//   } catch (error) {
//     console.error("Migration failed ❌", error);
//   } finally {
//     mongoose.disconnect();
//   }
// };

// migrateUserLoginFields();

// const mongoose = require("mongoose");
// const User = require("./models/User"); // Make sure this schema includes all login fields
// const { use } = require("react");
// const { useNavigate } = require("react-router-dom");

// mongoose.connect("mongodb://localhost:27017/eduDB");

// const seedUsers = async () => {
//   try {
//     const dummyUsers = [
//       {
//         username: "alice",
//         email: "alice@example.com",
//         password: "hashedpassword1",
//         otp: null,
//         otpExpires: null,
//         resetPasswordToken: null,
//         resetPasswordExpires: null,
//         failedLoginAttempts: 0,
//         lastLoginAttempt: null,
//         isLocked: false,
//       },
//       {
//         username: "bob",
//         email: "bob@example.com",
//         password: "hashedpassword2",
//         // intentionally missing some fields to test migration
//         failedLoginAttempts: 1,
//         isLocked: false,
//       },
//       {
//         username: "charlie",
//         email: "charlie@example.com",
//         password: "hashedpassword3",
//         otp: "123456",
//         otpExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 mins from now
//         resetPasswordToken: "resettoken123",
//         resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
//         failedLoginAttempts: 2,
//         lastLoginAttempt: new Date(),
//         isLocked: true,
//       },
//     ];

//     await User.deleteMany({}); // Clear existing users
//     await User.insertMany(dummyUsers);
//     console.log("Dummy users seeded ✅");
//   } catch (error) {
//     console.error("Seeding failed ❌", error);
//   } finally {
//     mongoose.disconnect();
//   }
// };

// seedUsers();



const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://localhost:27017/eduDB");

const migrateUserLoginFields = async () => {
  try {
    const users = await User.find({
      $or: [
        { activity: { $exists: false } },
        { social: { $exists: false } }
      ]
    });

    const updates = users.map(user => {
      const update = {};
      
      if (!user.activity) {
        update.activity = {
          lastActive: '',
          activeSessions: 0,
          totalMinutes: 0
        };
      }
      if (!user.social) {
        update.social = {
          followers: 0,
          following: 0,
          friends: []
        };
      }
      
      return User.updateOne({ _id: user._id }, { $set: update });
    });

    // Legacy fields


        // { project: { $exists: false } },
        
    // {profilePicture: { $exists: false }},
    // {bio: { $exists: false }},
    // {technicalSkills: { $exists: false }},
    // {softSkills: { $exists: false }},
    // {skillsToLearn: { $exists: false }},
    // {projects: { $exists: false }},
    // {extraCurricular: { $exists: false }},
    // {other: { $exists: false }},
        // { otp: { $exists: false } },
        // { otpExpires: { $exists: false } },
        // { resetPasswordToken: { $exists: false } },
        // { resetPasswordExpires: { $exists: false } },
    //   ],
    // });

    console.log(`Found ${users.length} users to migrate.`);

    // const updates = users.map((user) => {
    //   const update = {};
    //   if (user.project === undefined) update.project = [];
      // if (user.profilePicture === undefined) update.profilePicture = '';
      // if (user.bio === undefined) update.bio = '';
      // if (user.technicalSkills === undefined) update.technicalSkills = [];
      // if (user.softSkills === undefined) update.softSkills = [];
      // if (user.skillsToLearn === undefined) update.skillsToLearn = [];
      // if (user.projects === undefined) update.projects = [];
      // if (user.extraCurricular === undefined) update.extraCurricular = [];
      // if (user.other === undefined) update.other = '';
      // if (user.otp === undefined) update.otp = null;
      // if (user.otpExpires === undefined) update.otpExpires = null;
      // if (user.resetPasswordToken === undefined) update.resetPasswordToken = null;
      // if (user.resetPasswordExpires === undefined) update.resetPasswordExpires = null;

    //   if (Object.keys(update).length > 0) {
    //     return User.updateOne({ _id: user._id }, { $set: update });
    //   } else {
    //     return Promise.resolve(); // No update needed
    //   }
    // });
        
    await Promise.all(updates); 
    console.log("Migration complete ✅");
  } catch (error) {
    console.error("Migration failed ❌", error);
  } finally {
    mongoose.disconnect();
  }
};

migrateUserLoginFields();
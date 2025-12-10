(async function(){
  const mongoose = require('mongoose');
  const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/myedu';
  try{
    await mongoose.connect(dbUri);
    require('../models/User');
    const User = mongoose.model('User');
    const users = await User.find().limit(20).lean();
    console.log('Users (up to 20):', users.map(u=>({_id:u._id, email:u.email, username:u.username, role:u.role}))); 
    const admin = await User.findOne({ email: 'admin_test@example.test' }).lean();
    console.log('admin_test lookup:', admin);
    await mongoose.disconnect();
  }catch(e){
    console.error('debugListUsers error', e);
    process.exit(1);
  }
})();

(async function(){
  const fetch = global.fetch || (await import('node-fetch')).default;
  const mongoose = require('mongoose');
  const bcrypt = require('bcryptjs');
  const base = process.env.BACKEND_URI || 'http://localhost:3001';
  let dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/myedu';

  // Helper to extract cookie like earlier test
  function extractTokenCookie(res){
    const sc = res.headers.get('set-cookie');
    if(!sc) return null;
    const parts = sc.split(/, (?=token=)|, (?=connect.sid=)/g);
    for(const p of parts){
      const m = p.match(/(token=[^;]+)/);
      if(m) return m[1];
    }
    return sc.split(';')[0];
  }

  try{
    // Try to detect which DB the running server is connected to and prefer that
    try {
      const dbg = await fetch(base + '/api/debug/db-info');
      if (dbg.ok) {
        const info = await dbg.json().catch(() => null);
        if (info && info.dbName && info.host) {
          const host = info.host;
          // if host already contains a port, keep it
          const hostPart = host.includes(':') ? host : `${host}:27017`;
          const serverDbUri = `mongodb://${hostPart}/${info.dbName}`;
          console.log('Detected server DB URI (using):', serverDbUri);
          dbUri = serverDbUri; // override
        }
      }
    } catch (e) {
      console.warn('Could not call debug endpoint, falling back to MONGO_URI/env dbUri');
    }

    await mongoose.connect(dbUri);
    // Ensure models are registered with mongoose by requiring the model files
    require('../models/User');
    const User = mongoose.model('User');

    // Create admin user directly in DB for testing
    const adminUsername = 'admin_test';
    const adminEmail = 'admin_test@example.test';
    const adminPassword = 'AdminPass1';

    // remove previous if exists
    await User.deleteOne({ email: adminEmail });
    const hashed = await bcrypt.hash(adminPassword, 10);
    const admin = new User({ username: adminUsername, email: adminEmail, password: hashed, role: 'admin' });
    await admin.save();
    console.log('Admin created:', admin._id.toString());

    // Disconnect mongoose - further operations use HTTP endpoints
    await mongoose.disconnect();

    // create two regular users via register endpoint
    const makeRandom = (prefix)=> prefix + Math.random().toString(36).slice(2,8);
    const usernameA = makeRandom('userA_');
    const usernameB = makeRandom('userB_');
    const emailA = `${usernameA}@example.test`;
    const emailB = `${usernameB}@example.test`;
    const pwd = 'Password123';

    async function register(username,email){
      const res = await fetch(base + '/api/auth/register',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username, email, password: pwd })
      });
      const body = await res.json().catch(()=>null);
      const cookie = extractTokenCookie(res);
      return { ok: res.ok, status: res.status, body, cookie };
    }

    async function login(email, pass = pwd){
      const res = await fetch(base + '/api/auth/login',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password: pass })
      });
      const body = await res.json().catch(()=>null);
      const cookie = extractTokenCookie(res);
      return { ok: res.ok, status: res.status, body, cookie };
    }

    console.log('Registering users...');
    const rA = await register(usernameA, emailA);
    console.log('A register', rA.status, rA.body && rA.body.user ? rA.body.user : rA.body);
    const rB = await register(usernameB, emailB);
    console.log('B register', rB.status, rB.body && rB.body.user ? rB.body.user : rB.body);

    // login both to get cookies
    const lA = await login(emailA);
    const lB = await login(emailB);

    const cookieA = lA.cookie || rA.cookie;
    const cookieB = lB.cookie || rB.cookie;
    if(!cookieA || !cookieB){
      console.error('Failed to obtain auth cookies.');
      return process.exit(1);
    }

    // send friend request A -> B
    console.log(`A (${usernameA}) sending friend request to B (${usernameB})`);
    const send = await fetch(base + '/api/user/friend-request-by-username',{
      method:'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ username: usernameB })
    });
    console.log('send status', send.status);

    // accept as B
    const senderId = (lA.body && lA.body.user && lA.body.user.id) || (rA.body && rA.body.user && rA.body.user.id);
    const accept = await fetch(base + '/api/user/friend-request/accept',{
      method:'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ senderId })
    });
    console.log('accept status', accept.status);

    // Login as admin to promote B
    const adminLogin = await login(adminEmail, adminPassword);
    console.log('adminLogin', adminLogin.status, adminLogin.body);
    const adminCookie = adminLogin.cookie;
    if(!adminCookie){
      console.error('Failed to login as admin');
      return process.exit(1);
    }

    // promote B to staff
    const promoteRes = await fetch(base + '/api/admin/promote-to-staff',{
      method:'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ userId: (lB.body && lB.body.user && lB.body.user.id) || (rB.body && rB.body.user && rB.body.user.id) })
    });
    const promoteBody = await promoteRes.json().catch(()=>null);
    console.log('promote status', promoteRes.status, promoteBody);

    console.log('Test finished');

  }catch(err){
    console.error('Test script error', err);
    process.exit(1);
  }
})();

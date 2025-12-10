(async function(){
  const fetch = global.fetch || (await import('node-fetch')).default;
  const base = process.env.API_ ||  'http://localhost:3001';
  const makeRandom = (prefix)=> prefix + Math.random().toString(36).slice(2,8);

  const usernameA = makeRandom('userA_');
  const usernameB = makeRandom('userB_');
  const emailA = `${usernameA}@example.test`;
  const emailB = `${usernameB}@example.test`;
  const pwd = 'Password123';

  function extractTokenCookie(res){
    const sc = res.headers.get('set-cookie');
    if(!sc) return null;
    // If multiple cookies, take the one starting with token=
    const parts = sc.split(/, (?=token=)|, (?=connect.sid=)/g);
    // parts may contain multiple cookie strings
    for(const p of parts){
      const m = p.match(/(token=[^;]+)/);
      if(m) return m[1];
    }
    // fallback to first segment before ;
    return sc.split(';')[0];
  }

  async function register(username,email){
    const res = await fetch(base + '/api/auth/register',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, email, password: pwd })
    });
    const body = await res.json().catch(()=>null);
    const cookie = extractTokenCookie(res);
    return { ok: res.ok, status: res.status, body, cookie };
  }
  async function login(email){
    const res = await fetch(base + '/api/auth/login',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password: pwd })
    });
    const body = await res.json().catch(()=>null);
    const cookie = extractTokenCookie(res);
    return { ok: res.ok, status: res.status, body, cookie };
  }

  async function getAuthUser(cookie){
    const res = await fetch(base + '/api/auth/user',{ headers: { Cookie: cookie } });
    const body = await res.json().catch(()=>null);
    return { ok: res.ok, status: res.status, body };
  }

  async function sendFriendRequestByUsername(cookie, username){
    const res = await fetch(base + '/api/user/friend-request-by-username',{
      method:'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ username })
    });
    const body = await res.json().catch(()=>null);
    return { ok: res.ok, status: res.status, body };
  }

  async function acceptFriendRequest(cookie, senderId){
    const res = await fetch(base + '/api/user/friend-request/accept',{
      method:'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ senderId })
    });
    const body = await res.json().catch(()=>null);
    return { ok: res.ok, status: res.status, body };
  }

  try{
    console.log('Registering users...');
    const rA = await register(usernameA, emailA);
    console.log('A register', rA.status, rA.body && rA.body.user ? rA.body.user : rA.body);
    const rB = await register(usernameB, emailB);
    console.log('B register', rB.status, rB.body && rB.body.user ? rB.body.user : rB.body);

    // login both to get cookies
    console.log('Logging in A...');
    const lA = await login(emailA);
    console.log('A login', lA.status, lA.body);
    console.log('Logging in B...');
    const lB = await login(emailB);
    console.log('B login', lB.status, lB.body);

    const cookieA = lA.cookie || rA.cookie;
    const cookieB = lB.cookie || rB.cookie;
    if(!cookieA || !cookieB){
      console.error('Failed to obtain auth cookies. Headers:', { rA: rA.cookie, lA: lA.cookie, rB: rB.cookie, lB: lB.cookie });
      return process.exit(1);
    }

    // send friend request A -> B
    console.log(`A (${usernameA}) sending friend request to B (${usernameB})`);
    const send = await sendFriendRequestByUsername(cookieA, usernameB);
    console.log('send response', send.status, send.body);

    // Inspect B's auth user data
    const bData = await getAuthUser(cookieB);
    console.log('B user after receiving request', bData.status, bData.body && bData.body.social ? { friendRequestsReceivedCount: bData.body.social.friendRequestsReceived.length } : bData.body);

    // Accept as B
    const senderId = (lA.body && lA.body.user && lA.body.user.id) || (rA.body && rA.body.user && rA.body.user.id);
    console.log('B accepting friend request from', senderId);
    const accept = await acceptFriendRequest(cookieB, senderId);
    console.log('accept response', accept.status, accept.body);

    // List friends for B
    const friendsRes = await fetch(base + '/api/user/friends',{ headers: { Cookie: cookieB } });
    const friendsBody = await friendsRes.json().catch(()=>null);
    console.log('B friends:', friendsRes.status, friendsBody);

    console.log('Test complete');
  }catch(err){
    console.error('Test script error', err);
    process.exit(1);
  }
})();

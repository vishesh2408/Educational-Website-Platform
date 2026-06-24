const BASE = 'https://educational-website-platform.onrender.com';

const endpoints = [
  '/api/ping',
  '/api/public/courses',
  '/api/public/tutorials',
  '/api/public/quizzes',
  '/api/public/skills',
  '/api/public/tracks',
  '/api/debug/db-info',
];

async function testAll() {
  console.log(`\n🔍 Testing Render API: ${BASE}\n`);
  console.log('='.repeat(70));

  for (const ep of endpoints) {
    const url = `${BASE}${ep}`;
    try {
      const start = Date.now();
      const res = await fetch(url);
      const elapsed = Date.now() - start;
      const body = await res.text();

      const status = res.status;
      const icon = status === 200 ? '✅' : '❌';
      const preview = body.length > 120 ? body.slice(0, 120) + '...' : body;

      console.log(`${icon} [${status}] ${ep}  (${elapsed}ms)`);
      console.log(`   Response: ${preview}`);
      console.log('');
    } catch (err) {
      console.log(`❌ [ERR] ${ep}`);
      console.log(`   Error: ${err.message}`);
      console.log('');
    }
  }
  console.log('='.repeat(70));
  console.log('Done.\n');
}

testAll();

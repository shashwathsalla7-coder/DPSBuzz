const BASE = 'https://dpsbuzz.in';

async function testEndpoints() {
  const cookie = 'dpsbuzz_user=' + encodeURIComponent(JSON.stringify({
    id: '7b80acfc-33d6-5691-b4dc-bc6a99271650',
    username: 'shashwath71845',
    role: 'admin'
  }));

  const endpoints = [
    '/login',
    '/home',
    '/api/auth/profile?username=shashwath71845',
    '/api/calls?username=shashwath71845',
    '/api/sync?username=shashwath71845',
    '/api/sync?username=shashwath71845&mode=incoming',
    '/api/posts',
    '/api/chats',
    '/api/notifications?username=shashwath71845'
  ];

  console.log(`=== TESTING API RESPONSE TIMES ON ${BASE} ===`);
  for (const ep of endpoints) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE}${ep}`, {
        headers: { cookie }
      });
      const duration = Date.now() - t0;
      const text = await res.text();
      console.log(`[${res.status}] ${ep.padEnd(50)} : ${duration}ms (length: ${text.length})`);
    } catch (err) {
      const duration = Date.now() - t0;
      console.log(`[FAIL] ${ep.padEnd(50)} : ${duration}ms (${err.message})`);
    }
  }
}

testEndpoints();

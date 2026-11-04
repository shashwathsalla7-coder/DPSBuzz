async function verify() {
  const endpoints = [
    'https://dpsbuzz.in',
    'https://dpsbuzz.in/login',
    'https://dpsbuzz.in/api/auth/profile?username=shashwath71845',
  ];

  for (const url of endpoints) {
    try {
      const start = Date.now();
      const res = await fetch(url);
      console.log(`[${res.status}] ${url} (${Date.now() - start}ms)`);
    } catch (e) {
      console.error(`Error on ${url}:`, e.message);
    }
  }
}

verify().catch(console.error);

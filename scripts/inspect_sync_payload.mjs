const BASE = 'https://dpsbuzz.in';

async function inspectPayload() {
  const cookie = 'dpsbuzz_user=' + encodeURIComponent(JSON.stringify({
    id: '7b80acfc-33d6-5691-b4dc-bc6a99271650',
    username: 'shashwath71845',
    role: 'admin'
  }));

  const res = await fetch(`${BASE}/api/sync?username=shashwath71845`, {
    headers: { cookie }
  });
  const data = await res.json();
  console.log('Keys in sync response:');
  for (const [k, v] of Object.entries(data)) {
    const size = JSON.stringify(v).length;
    const count = Array.isArray(v) ? v.length : (typeof v === 'object' && v !== null ? Object.keys(v).length : 1);
    console.log(` - ${k}: ${size} bytes (${count} items)`);
  }
}

inspectPayload();

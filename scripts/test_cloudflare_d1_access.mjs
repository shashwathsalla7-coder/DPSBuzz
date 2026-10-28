const CF_ACCOUNT_ID = 'a674b4cebe06334d4a0e284e138cc6a1';
const CF_DATABASE_ID = 'a88d4fa9-4472-4876-bf32-045b966b0f77';
const CF_API_TOKEN = process.argv[2] || process.env.CLOUDFLARE_API_TOKEN || '';

async function checkD1() {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT 1 as connected, datetime("now") as utc_time;',
      }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      console.log('SUCCESS: Cloudflare D1 is fully connected and ready!');
      console.log('Query result:', json.result[0].results);
      process.exit(0);
    } else {
      console.log('D1 Check Status:', res.status, JSON.stringify(json.errors || json));
      process.exit(1);
    }
  } catch (e) {
    console.error('Connection error:', e.message);
    process.exit(1);
  }
}

checkD1();

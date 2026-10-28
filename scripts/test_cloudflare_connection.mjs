const CF_ACCOUNT_ID = 'a674b4cebe06334d4a0e284e138cc6a1';
const CF_DATABASE_ID = 'a88d4fa9-4472-4876-bf32-045b966b0f77';
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

async function testConnection() {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  console.log('Testing Cloudflare D1 connection to:', endpoint);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: 'SELECT 1 as connection_test, datetime("now") as server_time;',
      }),
    });

    console.log('HTTP Status:', res.status, res.statusText);
    const json = await res.json();
    console.log('Response JSON:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testConnection();

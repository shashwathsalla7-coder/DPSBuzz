async function check() {
  const res = await fetch('https://dpsbuzz.in/api/auth/profile?username=shashwath71845');
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  const body = await res.text();
  console.log('Body:', body.substring(0, 500));
}

check().catch(console.error);

async function poll() {
  for (let i = 1; i <= 8; i++) {
    console.log(`Attempt ${i}: checking https://dpsbuzz.in/api/auth/profile?username=shashwath71845 ...`);
    try {
      const res = await fetch('https://dpsbuzz.in/api/auth/profile?username=shashwath71845');
      console.log(`Status: ${res.status}`);
      if (res.status === 200) {
        const data = await res.json();
        console.log('SUCCESS! Profile data:', {
          username: data.profile?.username,
          avatar: data.profile?.avatar_url || data.profile?.avatar,
          fullName: data.profile?.fullName,
        });
        
        // Also test alias resolution
        console.log('Testing alias resolution with vignesh_7___49__ ...');
        const aliasRes = await fetch('https://dpsbuzz.in/api/auth/profile?username=vignesh_7___49__');
        const aliasData = await aliasRes.json();
        console.log('Alias test result:', {
          status: aliasRes.status,
          username: aliasData.profile?.username,
          resolvedFromAlias: aliasData.resolvedFromAlias,
        });
        return;
      }
    } catch (e) {
      console.error('Fetch error:', e.message);
    }
    await new Promise(r => setTimeout(r, 8000));
  }
}

poll().catch(console.error);

async function testLive() {
  console.log('=== 1. CHECKING PRIMARY PROFILE (@shashwath71845) ===');
  const p1 = await (await fetch('https://dpsbuzz.in/api/auth/profile?username=shashwath71845')).json();
  console.log('p1:', {
    success: p1.success,
    username: p1.profile?.username,
    avatar: p1.profile?.avatar,
    spiritPoints: p1.profile?.spiritPoints,
  });

  console.log('\n=== 2. CHECKING ALIAS RESOLUTION (@vignesh_7___49__) ===');
  const p2 = await (await fetch('https://dpsbuzz.in/api/auth/profile?username=vignesh_7___49__')).json();
  console.log('p2:', {
    success: p2.success,
    resolvedProfile: p2.profile?.username,
    fullName: p2.profile?.fullName,
    resolvedFromAlias: p2.resolvedFromAlias,
  });

  console.log('\n=== 3. CHECKING ALIAS RESOLUTION (@varshithjella) ===');
  const p3 = await (await fetch('https://dpsbuzz.in/api/auth/profile?username=varshithjella')).json();
  console.log('p3:', {
    success: p3.success,
    resolvedProfile: p3.profile?.username,
    fullName: p3.profile?.fullName,
    resolvedFromAlias: p3.resolvedFromAlias,
  });

  console.log('\n=== 4. CHECKING DUPLICATE SIGNUP GUARD ===');
  const p4 = await (await fetch('https://dpsbuzz.in/api/auth/profile?checkName=shashwath%20salla&class=8&section=A')).json();
  console.log('p4 (check duplicate):', p4);
}

testLive().catch(console.error);

async function testDuplicate() {
  console.log('Testing duplicate check for Vignesh (Class 8-G)...');
  const res = await (await fetch('https://dpsbuzz.in/api/auth/profile?checkName=vignesh&class=8&section=G')).json();
  console.log('Result:', res);
}

testDuplicate().catch(console.error);

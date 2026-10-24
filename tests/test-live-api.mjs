async function testNetlifyApi() {
  try {
    const res = await fetch('https://dpsbuzz.netlify.app/api/chats?conversationId=shashwath71845__testing&username=shashwath71845');
    console.log('Netlify GET /api/chats status:', res.status);
    const data = await res.json();
    console.log('Netlify GET data success:', data.success, 'messages count:', data.messages?.length);
  } catch (e) {
    console.error('Netlify API Error:', e);
  }
}
testNetlifyApi();

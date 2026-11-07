import assert from 'node:assert';
import { sanitizeText, isValidMediaUrl, checkRateLimit } from '../src/lib/security.ts';
import { d1Query, isD1Configured } from '../src/lib/cloudflare/d1.ts';

const BASE_URL = 'http://localhost:3000';

async function runPenetrationAndSecurityTests() {
  console.log('='.repeat(70));
  console.log('DPS BUZZ ENTERPRISE DEFENSIVE SECURITY & PEN-TEST SUITE');
  console.log('Cloudflare Edge Security, XSS Defense, SSRF Shield & RBAC Hardening');
  console.log('='.repeat(70));

  let passedTests = 0;
  let totalTests = 0;

  function record(testName, passed, details = '') {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`[PASS] Test ${totalTests}: ${testName} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - ${details}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 1: INPUT SANITIZATION & XSS NEUTRALIZATION
  // --------------------------------------------------------------------------
  console.log('\n--- 1. Input Sanitization & Anti-XSS Engine ---');
  {
    const scriptPayload = 'Hello <script>alert("hacked")</script> World!';
    const cleanedScript = sanitizeText(scriptPayload);
    record('Neutralize <script> tags', cleanedScript === 'Hello  World!', `Output: "${cleanedScript}"`);

    const imgPayload = '<img src="x" onerror="stealCookies()">Nice photo!';
    const cleanedImg = sanitizeText(imgPayload);
    record('Strip onerror= event handlers', !cleanedImg.includes('onerror') && !cleanedImg.includes('stealCookies'), `Output: "${cleanedImg}"`);

    const iframePayload = '<iframe src="https://attacker.com/exploit"></iframe>Check this out';
    const cleanedIframe = sanitizeText(iframePayload);
    record('Strip dangerous <iframe> injection', !cleanedIframe.includes('<iframe'), `Output: "${cleanedIframe}"`);

    const jsUrlPayload = 'Click <a href="javascript:alert(1)">here</a>';
    const cleanedJsUrl = sanitizeText(jsUrlPayload);
    record('Strip javascript: protocol execution', !cleanedJsUrl.includes('javascript:'), `Output: "${cleanedJsUrl}"`);

    const lengthTest = 'A'.repeat(5000);
    const capped = sanitizeText(lengthTest, 200);
    record('Enforce maximum string truncation length', capped.length === 200, `Length: ${capped.length}`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: SSRF SHIELD & MEDIA DOMAIN WHITELIST
  // --------------------------------------------------------------------------
  console.log('\n--- 2. SSRF Protection & Media Domain Whitelist ---');
  {
    const metadataAttack = 'http://169.254.169.254/latest/meta-data/iam/credentials';
    record('Block AWS/Cloud metadata IP SSRF attack', !isValidMediaUrl(metadataAttack), 'Blocked 169.254.x.x');

    const localhostAttack = 'http://127.0.0.1:8080/admin/secrets';
    record('Block localhost/loopback IP SSRF attack', !isValidMediaUrl(localhostAttack), 'Blocked 127.0.0.1');

    const privateSubnetAttack = 'http://192.168.1.100/router-config';
    record('Block RFC-1918 private subnet IP SSRF attack', !isValidMediaUrl(privateSubnetAttack), 'Blocked 192.168.x.x');

    const internalAttack = 'http://internal.service.local/dump';
    record('Block .internal/.local domains', !isValidMediaUrl(internalAttack), 'Blocked .local');

    const validCloudinary = 'https://res.cloudinary.com/ogfaxmjw/image/upload/sample.jpg';
    record('Allow valid Cloudinary HTTPS CDN asset', isValidMediaUrl(validCloudinary), 'Allowed res.cloudinary.com');

    const validWiki = 'https://upload.wikimedia.org/wikipedia/commons/test.png';
    record('Allow valid Wikimedia educational CDN asset', isValidMediaUrl(validWiki), 'Allowed upload.wikimedia.org');

    const validLocal = '/uploads/sample.jpg';
    record('Allow valid local static upload path', isValidMediaUrl(validLocal), 'Allowed /uploads/');
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 3: EDGE RATE LIMITER (SLIDING WINDOW)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Edge Rate Limiter & Sliding Window Defense ---');
  {
    const testIp = 'pentest-ip-' + Math.random().toString(36).substring(2, 7);
    let allowedCount = 0;
    let blockedCount = 0;

    for (let i = 0; i < 35; i++) {
      const check = checkRateLimit(`mutation:${testIp}`, 30, 60000);
      if (check.allowed) allowedCount++;
      else blockedCount++;
    }

    record('Allow up to 30 requests in rate-limiting window', allowedCount === 30, `Allowed: ${allowedCount}`);
    record('Block subsequent requests with 429 backpressure', blockedCount === 5, `Blocked: ${blockedCount}`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: ENDPOINT PRIVILEGE ESCALATION & AUTH WALL
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Role Spoofing & Middleware Authentication Wall ---');
  {
    // A. Unauthenticated request to /api/campus POST should fail (401)
    try {
      const unauthRes = await fetch(`${BASE_URL}/api/campus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_broadcast', title: 'Hacked', content: 'Test' }),
      });
      record('Unauthenticated POST /api/campus returns HTTP 401 Unauthorized', unauthRes.status === 401, `Status: ${unauthRes.status}`);
    } catch (e) {
      record('Unauthenticated POST /api/campus returns HTTP 401 Unauthorized', false, e.message);
    }

    // B. Attempt role spoofing via body { requesterRole: 'admin' }
    const fakeStudentCookie = encodeURIComponent(JSON.stringify({ username: 'fake_student', role: 'student' }));
    try {
      const spoofRes = await fetch(`${BASE_URL}/api/campus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `dpsbuzz_user=${fakeStudentCookie}`,
        },
        body: JSON.stringify({
          action: 'create_broadcast',
          requesterRole: 'admin',
          username: 'fake_student',
          title: 'Fake Announcement',
          content: 'This should be blocked',
        }),
      });
      record('Role spoofing (requesterRole: admin) blocked with 403 Forbidden', spoofRes.status === 403, `Status: ${spoofRes.status}`);
    } catch (e) {
      record('Role spoofing (requesterRole: admin) blocked with 403 Forbidden', false, e.message);
    }

    // C. Attempt username substring bypass (e.g. 'fake_teacher') to lock a channel
    const fakeTeacherCookie = encodeURIComponent(JSON.stringify({ username: 'student_teacher_fan', role: 'student' }));
    try {
      const substringRes = await fetch(`${BASE_URL}/api/campus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `dpsbuzz_user=${fakeTeacherCookie}`,
        },
        body: JSON.stringify({
          action: 'toggle_channel_lock',
          username: 'student_teacher_fan',
          channelId: 'class-9a',
          locked: true,
        }),
      });
      record('Substring username attack (student_teacher_fan) rejected with 403 Forbidden', substringRes.status === 403, `Status: ${substringRes.status}`);
    } catch (e) {
      record('Substring username attack (student_teacher_fan) rejected with 403 Forbidden', false, e.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: LIVE CONTENT SANITIZATION IN POSTS
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Content Injection Neutralization in Live APIs ---');
  {
    const testUser = 'shashwath71845';
    const authCookie = encodeURIComponent(JSON.stringify({ username: testUser, role: 'admin' }));
    const postPayload = {
      post: {
        id: `sec-post-${Date.now()}`,
        username: testUser,
        fullName: 'Shashwath Salla',
        caption: 'Safe Post <script>alert("xss")</script><img src="x" onerror="evil()">',
        imageUrl: 'http://169.254.169.254/ssrf-attempt.jpg', // Should be wiped by SSRF shield
        videoUrl: 'https://evil-unwhitelisted-domain.com/bad.mp4', // Should be wiped
        createdAt: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch(`${BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `dpsbuzz_user=${authCookie}`,
        },
        body: JSON.stringify(postPayload),
      });

      const data = await res.json();
      record('Post creation API responded with success', data.success === true);

      // Verify that the saved post has sanitized text and wiped malicious URLs
      record('XSS stripped from saved post caption', !data.post.caption.includes('<script>') && !data.post.caption.includes('onerror'), `Caption: "${data.post.caption}"`);
      record('Malicious SSRF imageUrl was sanitized/nullified', data.post.imageUrl === null, `ImageUrl: ${data.post.imageUrl}`);
      record('Unwhitelisted videoUrl was sanitized/nullified', data.post.videoUrl === null, `VideoUrl: ${data.post.videoUrl}`);

      // Clean up test post
      await fetch(`${BASE_URL}/api/posts?id=${postPayload.post.id}`, { method: 'DELETE' });
    } catch (e) {
      record('Content injection neutralization in live APIs', false, e.message);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 6: ZERO IMPACT ON AUTHENTIC USERS
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Zero Disruption & Database Integrity Verification ---');
  {
    const AUTHENTIC_USERS = [
      'shashwath71845',
      'madam_principal',
      'dpsbuzz',
      'sahana_3009',
      'rishi_one9',
      'rohan728',
      'kvsishaan',
      'mokshith7b',
      'ishanvi',
      'ashwith',
      'chandan',
      'sreekrishna',
      'vignesh',
      'varshithjella',
    ];

    if (isD1Configured()) {
      try {
        const users = await d1Query('SELECT username, role FROM profiles;');
        const foundUsernames = new Set(users.map((u) => u.username.toLowerCase()));
        let allFound = true;
        for (const u of AUTHENTIC_USERS) {
          if (!foundUsernames.has(u.toLowerCase())) {
            allFound = false;
            console.error(`[CRITICAL] Missing authentic user: ${u}`);
          }
        }
        record('All 14 authentic production users verified intact in Cloudflare D1', allFound, `Count: ${foundUsernames.size}`);
      } catch (err) {
        record('All 14 authentic production users verified intact in Cloudflare D1', false, err.message);
      }
    } else {
      record('Cloudflare D1 is configured and accessible', false, 'D1 not configured');
    }
  }

  console.log('='.repeat(70));
  console.log(`TOTAL PEN-TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log(`SECURITY COMPLIANCE SCORE: ${(passedTests / totalTests * 100).toFixed(1)}%`);
  console.log('='.repeat(70));

  if (passedTests === totalTests) {
    console.log('ALL DEFENSIVE SECURITY AND PEN-TEST AUDITS COMPLETED SUCCESSFULLY.');
    process.exit(0);
  } else {
    console.error('ONE OR MORE SECURITY AUDITS FAILED.');
    process.exit(1);
  }
}

runPenetrationAndSecurityTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

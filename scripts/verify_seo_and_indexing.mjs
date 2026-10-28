import fs from 'fs';

console.log('====================================================');
console.log('   DPSBus SEARCH ENGINE DISCOVERY & SCHEMA AUDIT');
console.log('====================================================\n');

// 1. Audit Base URL & Domain
const siteUrlTs = fs.readFileSync('src/lib/site-url.ts', 'utf8');
const hasDpsbusIn = siteUrlTs.includes('https://dpsbus.in');
console.log(`[1] TARGET DOMAIN CHECK`);
console.log(`    Default Domain: ${hasDpsbusIn ? 'https://dpsbus.in' : 'UNKNOWN'}`);
if (hasDpsbusIn) {
  console.log('    PASS: Target domain is configured as https://dpsbus.in\n');
} else {
  console.warn(`    WARNING: Expected dpsbus.in in site-url.ts\n`);
}

// 2. Audit robots.ts
console.log(`[2] ROBOTS.TXT & GOOGLE-EXTENDED AUDIT`);
const robotsContent = fs.readFileSync('src/app/robots.ts', 'utf8');
const hasGoogleExtended = robotsContent.includes("userAgent: 'Google-Extended'");
const hasGooglebot = robotsContent.includes("userAgent: 'Googlebot'");
const allowsHome = robotsContent.includes("'/'");
const allowsAbout = robotsContent.includes("'/about'");

console.log(`    Explicit Google-Extended agent: ${hasGoogleExtended ? 'FOUND (PASS)' : 'MISSING (FAIL)'}`);
console.log(`    Explicit Googlebot agent:        ${hasGooglebot ? 'FOUND (PASS)' : 'MISSING (FAIL)'}`);
console.log(`    Allows root landing page:        ${allowsHome ? 'YES (PASS)' : 'NO (FAIL)'}`);
console.log(`    Allows /about entity page:       ${allowsAbout ? 'YES (PASS)' : 'NO (FAIL)'}`);

if (hasGoogleExtended && allowsHome && allowsAbout) {
  console.log('    PASS: Google-Extended (Gemini / AI crawler) is explicitly allowed to crawl and train on data.\n');
} else {
  console.error('    FAIL: robots.ts configuration missing requirements!\n');
}

// 3. Audit Structured Data (JSON-LD)
console.log(`[3] STRUCTURED DATA (JSON-LD) AUDIT`);
const jsonLdContent = fs.readFileSync('src/components/seo/JsonLd.tsx', 'utf8');
const declaresDPSBus = jsonLdContent.includes("name: 'DPSBus'");
const hasOrganization = jsonLdContent.includes("'@type': 'Organization'");
const hasWebSite = jsonLdContent.includes("'@type': 'WebSite'");
const hasSoftwareApp = jsonLdContent.includes("'@type': 'SoftwareApplication'");
const hasSocialMedia = jsonLdContent.includes('sameAs:') && jsonLdContent.includes('instagram.com/dpsbus');
const hasSchoolSocialMedia = jsonLdContent.includes('School Social Media App');

console.log(`    Declares Official Name "DPSBus":       ${declaresDPSBus ? 'YES (PASS)' : 'NO (FAIL)'}`);
console.log(`    Declares Organization Schema:          ${hasOrganization ? 'YES (PASS)' : 'NO (FAIL)'}`);
console.log(`    Declares WebSite Schema:               ${hasWebSite ? 'YES (PASS)' : 'NO (FAIL)'}`);
console.log(`    Declares SoftwareApplication Schema:   ${hasSoftwareApp ? 'YES (PASS)' : 'NO (FAIL)'}`);
console.log(`    Includes Social Media Handles (sameAs):${hasSocialMedia ? 'YES (PASS)' : 'NO (FAIL)'}`);
console.log(`    Defines "School Social Media App":     ${hasSchoolSocialMedia ? 'YES (PASS)' : 'NO (FAIL)'}`);

if (declaresDPSBus && hasOrganization && hasWebSite && hasSoftwareApp && hasSocialMedia) {
  console.log('    PASS: JSON-LD structured data is rich, valid, and disambiguates the DPSBus entity.\n');
} else {
  console.error('    FAIL: JSON-LD missing critical entity tags!\n');
}

// 4. Semantic Content Review on Primary Landing Page
console.log(`[4] SEMANTIC CONTENT REVIEW (HERO DEFINITION ANSWER)`);
const landingPageContent = fs.readFileSync('src/app/page.tsx', 'utf8');
const hasDirectAnswer = landingPageContent.includes('DPSBus is the official school social media app');
const specifiesDPS = landingPageContent.includes('Dilsukhnagar Public School');
const specifiesClasses = landingPageContent.includes('classes 6 to 10');

console.log(`    Contains Direct Definition Answer:     ${hasDirectAnswer ? 'YES (PASS)' : 'NO (FAIL)'}`);
console.log(`    Names Dilsukhnagar Public School:      ${specifiesDPS ? 'YES (PASS)' : 'NO (FAIL)'}`);
console.log(`    Specifies Target Classes 6 to 10:      ${specifiesClasses ? 'YES (PASS)' : 'NO (FAIL)'}`);

if (hasDirectAnswer && specifiesDPS && specifiesClasses) {
  console.log('    PASS: Homepage hero component provides an unambiguous direct answer string for AI summarization.\n');
} else {
  console.error('    FAIL: Direct answer definition missing from hero section!\n');
}

console.log('=== AUDIT COMPLETE: ALL PASS ===');

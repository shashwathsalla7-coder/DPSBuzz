import fs from 'fs';
import path from 'path';

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File does not exist: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [target, replacement] of replacements) {
    if (typeof target === 'string') {
      content = content.replaceAll(target, replacement);
    } else {
      content = content.replace(target, replacement);
    }
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// 1. Update src/config/theme.ts
replaceInFile('src/config/theme.ts', [
  ['// Clear Campus Wire Emerald Green (#22C55E)', '// Clear Emerald Green (#22C55E)']
]);

// 2. Update src/hooks/useChatMessages.ts
replaceInFile('src/hooks/useChatMessages.ts', [
  ['(Campus Wire ticks live update)', '(Campus Wire delivery ticks live update)']
]);

// 3. Update src/components/layout/DesktopSidebar.tsx
replaceInFile('src/components/layout/DesktopSidebar.tsx', [
  ["{ href: '/wire', icon: Users, label: 'School Campus Wire' }", "{ href: '/campus-wire', icon: Users, label: 'Campus Wire' }"]
]);

// 4. Update src/components/layout/TopBar.tsx
replaceInFile('src/components/layout/TopBar.tsx', [
  ["{ title: 'School Campus Wire', href: '/wire', icon: Users, desc: 'Class Campus Wire, dispatches & homework' }", "{ title: 'Campus Wire', href: '/campus-wire', icon: Users, desc: 'Class dispatches, homework & notices' }"]
]);

// 5. Update src/components/home/CampusHeroHUD.tsx
replaceInFile('src/components/home/CampusHeroHUD.tsx', [
  ['{/* Sleek Rapid Flight Deck: 4 Direct Action Pills (Campus Wire, AI Diary, Notes, Lost & Found) */}', '{/* Sleek Rapid Flight Deck: 4 Direct Action Pills (Campus Wire, AI Diary, Notes, Lost & Found) */}'],
  ['Class Campus Wire', 'Campus Wire'],
  ['/wire', '/campus-wire']
]);

// 6. Update src/components/home/CampusHubChips.tsx
replaceInFile('src/components/home/CampusHubChips.tsx', [
  ["subtitle: 'Class Campus Wire & Chat',", "subtitle: 'Campus Wire & Chat',"],
  ["badge: 'Campus Wire',", "badge: 'Wire',"],
  ["href: '/wire'", "href: '/campus-wire'"]
]);

// 7. Update src/app/(main)/chats/page.tsx
replaceInFile('src/app/(main)/chats/page.tsx', [
  ['{/* Message Info Modal: Campus Wire-style Delivery & Read Receipts Inspection */}', '{/* Message Info Modal: Campus Wire Delivery & Read Receipts Inspection */}']
]);

// 8. Update src/app/(main)/download/page.tsx
replaceInFile('src/app/(main)/download/page.tsx', [
  ['Shareable via Campus Wire or Bluetooth', 'Shareable via Campus Wire or Bluetooth']
]);

// 9. Update src/lib/schoolFeatures.ts
replaceInFile('src/lib/schoolFeatures.ts', [
  ['export interface Campus WireChannel {', 'export interface CampusWireChannel {'],
  ['export interface Campus WireMessage {', 'export interface CampusWireMessage {'],
  ['let dbCampus WireChannels: Campus WireChannel[] = [];', 'let dbWireChannels: CampusWireChannel[] = [];'],
  ['let dbCampus WireMessages: Campus WireMessage[] = [];', 'let dbWireMessages: CampusWireMessage[] = [];'],
  ['dbCampus WireChannels', 'dbWireChannels'],
  ['dbCampus WireMessages', 'dbWireMessages'],
  ['Campus WireChannel', 'CampusWireChannel'],
  ['Campus WireMessage', 'CampusWireMessage'],
  ['// --- CAMPUS_WIRE SCHOOL HUB ---', '// --- CAMPUS WIRE SCHOOL HUB ---'],
  ['getCampus WireChannels', 'getWireChannels'],
  ['getCampus WireMessages', 'getWireMessages'],
  ['sendCampus WireMessage', 'sendWireMessage'],
  ['createCampus WireChannel', 'createWireChannel'],
  ['dispatchCampus WireTemplate', 'dispatchWireTemplate'],
  ["action: 'send_wire_message',", "action: 'send_wire_message',"],
  ["action: 'create_wire_channel',", "action: 'create_wire_channel',"],
  ["action: 'dispatch_wire_template',", "action: 'dispatch_wire_template',"],
  ['data.wireChannels', 'data.wireChannels'],
  ['data.wireMessages', 'data.wireMessages'],
  ['wireChannels', 'wireChannels'],
  ['wireMessages', 'wireMessages']
]);

// 10. Update src/app/(main)/groups/page.tsx
replaceInFile('src/app/(main)/groups/page.tsx', [
  ['Campus WireChannel', 'CampusWireChannel'],
  ['Campus WireMessage', 'CampusWireMessage'],
  ['send_wire_message', 'send_wire_message'],
  ['wire_messages', 'wire_messages'],
  ['wire_channels', 'wire_channels'],
  ['createCampus WireChannel', 'createWireChannel'],
  ['getCampus WireChannels', 'getWireChannels'],
  ['getCampus WireMessages', 'getWireMessages'],
  ['data.wireChannels', 'data.wireChannels'],
  ['data.wireMessages', 'data.wireMessages'],
  ['wireChannels', 'wireChannels'],
  ['wireMessages', 'wireMessages']
]);

// 11. Update src/app/api/campus/route.ts
replaceInFile('src/app/api/campus/route.ts', [
  ["// FAST PATH: Incremental Campus Wire Messages Polling (Used by Class Groups)", "// FAST PATH: Incremental Campus Wire Messages Polling (Used by Class Groups)"],
  ["if (action === 'wire_messages')", "if (action === 'wire_messages')"],
  ["campus_wire_messages", "campus_wire_messages"],
  ["wireMessages:", "wireMessages:"],
  ["// FAST PATH: Campus Wire Channels List Only (<80ms)", "// FAST PATH: Campus Wire Channels List Only (<80ms)"],
  ["if (action === 'wire_channels')", "if (action === 'wire_channels')"],
  ["campus_wire_channels", "campus_wire_channels"],
  ["const wireChannels = rawChannels.map((c) => ({", "const wireChannels = rawChannels.map((c) => ({"],
  ["{ success: true, channels: wireChannels, wireChannels },", "{ success: true, channels: wireChannels, wireChannels },\n          { success: true, channels: wireChannels, wireChannels },"],
  ["wireChannels,", "wireChannels,"],
  ["wireChannels", "wireChannels"],
  ["wireMessages", "wireMessages"],
  ["// 8. Campus Wire Channels", "// 8. Campus Wire Channels"],
  ["// 9. Campus Wire Messages", "// 9. Campus Wire Messages"],
  ["action === 'send_wire_message'", "action === 'send_wire_message'"],
  ["action === 'create_wire_channel'", "action === 'create_wire_channel'"],
  ["action === 'dispatch_wire_template'", "action === 'dispatch_wire_template'"]
]);

console.log('Core replacements executed.');

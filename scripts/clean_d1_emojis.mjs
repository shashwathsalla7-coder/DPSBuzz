import { d1Execute, d1Query, isD1Configured } from '../src/lib/cloudflare/d1.ts';

async function clean() {
  console.log('Cleaning D1 channels and messages...');
  if (!isD1Configured()) {
    console.error('D1 not configured!');
    return;
  }

  await d1Execute(`
    UPDATE campus_wire_channels SET name = 'Class 8-G Official Classroom' WHERE id = 'channel-class-8g';
    UPDATE campus_wire_channels SET name = 'Class 9-B Official Classroom' WHERE id = 'channel-class-9b';
    UPDATE campus_wire_channels SET name = 'Class 10-A Official Classroom' WHERE id = 'channel-class-10a';
    UPDATE campus_wire_channels SET name = 'DPS Ramanujan & Aryabhatta Science Club' WHERE id = 'channel-science-club';
    UPDATE campus_wire_channels SET name = 'DPS Official Principal Dispatches' WHERE id = 'channel-school-broadcast';
  `);

  await d1Execute(`
    UPDATE campus_wire_channels SET last_message = 'Science practical notebooks submission today', last_message_time = '09:15 AM' WHERE id = 'channel-class-8g';
    UPDATE campus_wire_channels SET last_message = 'Merchant of Venice review on Wednesday', last_message_time = '08:30 AM' WHERE id = 'channel-class-9b';
    UPDATE campus_wire_channels SET last_message = 'Quadratic equations practice exercises', last_message_time = '10:00 AM' WHERE id = 'channel-class-10a';
    UPDATE campus_wire_channels SET last_message = 'Regional Science Fair registration open', last_message_time = '11:20 AM' WHERE id = 'channel-science-club';
    UPDATE campus_wire_channels SET last_message = 'Term 1 examination schedule published', last_message_time = '07:45 AM' WHERE id = 'channel-school-broadcast';
  `);

  await d1Execute(`
    DELETE FROM campus_wire_messages WHERE text = 'hi hello' OR text = 'HI ALL OF YOU' OR text = 'hi';
  `);

  const updated = await d1Query('SELECT id, name, last_message, last_message_time FROM campus_wire_channels;');
  console.log('Cleaned D1 channels:', updated);
}

clean().catch(console.error);

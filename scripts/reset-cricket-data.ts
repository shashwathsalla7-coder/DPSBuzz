import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdvoeddebquguuqgyscl.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkdm9lZGRlYnF1Z3V1cWd5c2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNDE4NjQsImV4cCI6MjEwNzcxNzg2NH0.w7HbWCGQmyK-tayzXR8l06rLzCsPQtIrnGhJQjhzUbg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🧹 Clearing cricket leaderboard & match history in Supabase app_settings...');

  const { error: err1 } = await supabase
    .from('app_settings')
    .upsert({ key: 'cricket_leaderboard', value: '[]' });

  if (err1) {
    console.error('Error resetting leaderboard:', err1.message);
  } else {
    console.log('✅ Successfully reset cricket_leaderboard to []');
  }

  const { error: err2 } = await supabase
    .from('app_settings')
    .upsert({ key: 'cricket_match_history', value: '[]' });

  if (err2) {
    console.error('Error resetting match history:', err2.message);
  } else {
    console.log('✅ Successfully reset cricket_match_history to []');
  }

  process.exit(0);
}

main();

import fs from 'fs';
import path from 'path';

const migDir = 'supabase/migrations';
const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();

console.log(`Found ${files.length} migration files in ${migDir}:`);

const allTables = new Set();
const allFunctions = new Set();
const allTriggers = new Set();
const allPolicies = new Set();
const allIndexes = new Set();

for (const file of files) {
  const content = fs.readFileSync(path.join(migDir, file), 'utf8');
  
  // Tables
  const tableMatches = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi);
  for (const m of tableMatches) {
    allTables.add(m[1].toLowerCase());
  }

  // Functions
  const funcMatches = content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)/gi);
  for (const m of funcMatches) {
    allFunctions.add(m[1].toLowerCase());
  }

  // Triggers
  const trigMatches = content.matchAll(/CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)/gi);
  for (const m of trigMatches) {
    allTriggers.add(m[1].toLowerCase());
  }

  // Policies
  const polMatches = content.matchAll(/CREATE\s+POLICY\s+["']?([^"'\n]+)["']?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)/gi);
  for (const m of polMatches) {
    allPolicies.add(`${m[1]} ON ${m[2].toLowerCase()}`);
  }

  // Indexes
  const idxMatches = content.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi);
  for (const m of idxMatches) {
    allIndexes.add(m[1].toLowerCase());
  }
}

console.log('\n--- Migration Tables (' + allTables.size + ') ---');
console.log(Array.from(allTables).sort().join(', '));

console.log('\n--- Migration Functions (' + allFunctions.size + ') ---');
console.log(Array.from(allFunctions).sort().join(', '));

console.log('\n--- Migration Triggers (' + allTriggers.size + ') ---');
console.log(Array.from(allTriggers).sort().join(', '));

console.log('\n--- Migration Policies Count: ' + allPolicies.size + ' ---');
console.log('\n--- Migration Indexes Count: ' + allIndexes.size + ' ---');

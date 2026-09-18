#!/usr/bin/env node
// Preflight check: blocks build if ESM-only patterns sneak into server files
// These crash the CommonJS esbuild output on Gandi

const fs = require('fs');
const path = require('path');

const checks = [
  { pattern: /fileURLToPath/, name: 'fileURLToPath (ESM-only)' },
  { pattern: /import\.meta\.url/, name: 'import.meta.url (ESM-only)' },
  { pattern: /from 'node:/, name: 'node: protocol imports (incompatible)' },
];

const serverDir = path.join(__dirname, '../server');
const files = walkDir(serverDir);

let failed = false;
for (const file of files) {
  if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const { pattern, name } of checks) {
    if (pattern.test(content)) {
      console.error(`\n❌ PREFLIGHT FAIL: ${name} found in ${file}`);
      console.error('   This will crash the CommonJS server build. Remove it before deploying.\n');
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('✅ Preflight passed — no ESM-only patterns in server files');
}

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) results.push(...walkDir(full));
    else results.push(full);
  }
  return results;
}

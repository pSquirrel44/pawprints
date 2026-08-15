#!/usr/bin/env node
// Pawprint Network — Pre-flight build check
// Runs before npm run build. Catches the fileURLToPath/import.meta.url crash bug.
const fs = require('fs');
const path = require('path');
const RED = '\x1b[31m'; const GREEN = '\x1b[32m'; const RESET = '\x1b[0m';
let failed = false;

function checkFile(file, checks) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  // Strip comment lines before checking so we don't flag our own warning comment
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  const codeOnly = lines
    .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    .join('\n');
  for (const { pattern, message } of checks) {
    if (pattern.test(codeOnly)) {
      console.error(`${RED}✗ FAIL${RESET}  ${file}\n      ${message}\n`);
      failed = true;
    }
  }
}

checkFile('server.ts', [
  { pattern: /fileURLToPath/,     message: 'fileURLToPath is ESM-only and crashes the CJS build. Remove it from server.ts.' },
  { pattern: /import\.meta\.url/, message: 'import.meta.url is ESM-only and crashes the CJS build. Remove it from server.ts.' },
  { pattern: /const __dirname\s*=/, message: '__dirname via fileURLToPath is ESM-only. Remove it from server.ts.' },
]);

if (failed) {
  console.error(`${RED}Pre-flight FAILED — build blocked. Fix the above before deploying.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✓ Pre-flight passed — safe to build.${RESET}`);
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mainJsPath = path.resolve(__dirname, '../dist-electron/main.js');

console.log('[Smoke Test] Verifying build artifact:', mainJsPath);

if (!fs.existsSync(mainJsPath)) {
  console.error('[Smoke Test Fail] dist-electron/main.js does not exist. Run build first.');
  process.exit(1);
}

// Validate JavaScript syntax using Node.js builtin syntax check
try {
  execSync(`node --check "${mainJsPath}"`, { stdio: 'pipe' });
  console.log('[Smoke Test Pass] dist-electron/main.js syntax and bundle verification passed successfully.');
} catch (err) {
  console.error('[Smoke Test Fail] Syntax or parse error in dist-electron/main.js:', err.stderr?.toString() || err.message);
  process.exit(1);
}


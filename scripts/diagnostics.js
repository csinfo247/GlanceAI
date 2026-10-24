/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
const fs = require('fs');
const path = require('path');

console.log('🔍 Running GlanceAI Comprehensive Static & Runtime Diagnostic...');

// 1. Audit DOM IDs in index.html vs renderer.js
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const rendererJs = fs.readFileSync(path.join(__dirname, '../renderer.js'), 'utf8');

const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const queriedIds = new Set();
while ((match = idRegex.exec(rendererJs)) !== null) {
  queriedIds.add(match[1]);
}

const missingIds = [];
for (const id of queriedIds) {
  const pattern = new RegExp(`id=["']${id}["']`);
  if (!pattern.test(indexHtml)) {
    missingIds.push(id);
  }
}

console.log(`\n1. DOM Element Audit (index.html):`);
console.log(`   Total IDs queried by renderer.js: ${queriedIds.size}`);
if (missingIds.length === 0) {
  console.log(`   ✅ 100% of queried element IDs exist in index.html!`);
} else {
  console.warn(`   ⚠️ Missing IDs found:`, missingIds);
}

// 2. Audit DOM IDs in mentor.html
const mentorHtml = fs.readFileSync(path.join(__dirname, '../mentor.html'), 'utf8');
const queriedMentorIds = new Set();
while ((match = idRegex.exec(mentorHtml)) !== null) {
  queriedMentorIds.add(match[1]);
}

const missingMentorIds = [];
for (const id of queriedMentorIds) {
  const pattern = new RegExp(`id=["']${id}["']`);
  if (!pattern.test(mentorHtml)) {
    missingMentorIds.push(id);
  }
}

console.log(`\n2. Mentor DOM Element Audit (mentor.html):`);
console.log(`   Total IDs queried in mentor.html: ${queriedMentorIds.size}`);
if (missingMentorIds.length === 0) {
  console.log(`   ✅ 100% of queried element IDs exist in mentor.html!`);
} else {
  console.warn(`   ⚠️ Missing Mentor IDs found:`, missingMentorIds);
}

// 3. Audit IPC Event Listeners: main.js -> renderer.js
const mainJs = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');
const preloadJs = fs.readFileSync(path.join(__dirname, '../preload.js'), 'utf8');

const webContentsSendRegex = /mainWindow\.webContents\.send\(['"]([^'"]+)['"]/g;
const sentEvents = new Set();
while ((match = webContentsSendRegex.exec(mainJs)) !== null) {
  sentEvents.add(match[1]);
}

console.log(`\n3. IPC Event Channels Audit (main.js -> preload.js):`);
console.log(`   Events sent by main.js: ${Array.from(sentEvents).join(', ')}`);
const unhandledEvents = [];
for (const ev of sentEvents) {
  if (!preloadJs.includes(`'${ev}'`) && !preloadJs.includes(`"${ev}"`)) {
    unhandledEvents.push(ev);
  }
}
if (unhandledEvents.length === 0) {
  console.log(`   ✅ 100% of main.js window events are handled in preload.js!`);
} else {
  console.warn(`   ⚠️ Unhandled events in preload.js:`, unhandledEvents);
}

// 4. Audit invoke/handle channels
const handleRegex = /ipcMain\.handle\(['"]([^'"]+)['"]/g;
const handledChannels = new Set();
while ((match = handleRegex.exec(mainJs)) !== null) {
  handledChannels.add(match[1]);
}

const invokeRegex = /ipcRenderer\.invoke\(['"]([^'"]+)['"]/g;
const invokedChannels = new Set();
while ((match = invokeRegex.exec(preloadJs)) !== null) {
  invokedChannels.add(match[1]);
}

console.log(`\n4. IPC Invoke Channels Audit (preload.js <-> main.js):`);
console.log(`   Handled in main.js: ${handledChannels.size}`);
console.log(`   Invoked in preload.js: ${invokedChannels.size}`);
const missingHandlers = [];
for (const ch of invokedChannels) {
  if (!handledChannels.has(ch)) {
    missingHandlers.push(ch);
  }
}
if (missingHandlers.length === 0) {
  console.log(`   ✅ 100% of ipcRenderer.invoke channels have matching ipcMain.handle!`);
} else {
  console.warn(`   ⚠️ Invoked channels without handler in main.js:`, missingHandlers);
}

// 5. AST Syntax Parse Check
// Syntax only. Undeclared-identifier and scope checks are enforced by ESLint (`npm run lint`),
// which does not lint inline <script> blocks — so mentor.html's inline script is parsed here.
const acorn = require('acorn');

function parseCheck(code, filename) {
  acorn.parse(code, { ecmaVersion: 2022, sourceType: 'script' });
  console.log(`\n5. AST Syntax Parse Check for ${filename}:`);
  console.log(`   ✅ Parsed successfully with 0 syntax errors.`);
}

try {
  parseCheck(rendererJs, 'renderer.js');
  parseCheck(mainJs, 'main.js');
  parseCheck(mentorHtml.substring(mentorHtml.indexOf('<script>') + 8, mentorHtml.indexOf('</script>')), 'mentor.html script');
} catch (astErr) {
  console.error('❌ AST Error:', astErr);
  process.exitCode = 1;
}

console.log('\nAudit complete.');

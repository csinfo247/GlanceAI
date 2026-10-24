/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
/**
 * GlanceAI - Prompt ↔ Parser Contract Test
 * lib/prompts.js tells the model which sections and markers to emit; lib/interview-engine.js
 * (running in the renderer) parses them back out of the stream. These checks feed each prompt
 * template's own example format into the matching parser, so editing one side without the
 * other fails here instead of silently breaking the HUD.
 */

const {
  buildSystemPrompt,
  buildTurn,
  QUICK_ACTIONS
} = require('./lib/prompts');
const {
  OUTPUT_MARKERS,
  extractRecognizedQuestion,
  extractGlanceAnchors,
  extractProgressionTalkingPoints
} = require('./lib/interview-engine');

console.log('='.repeat(70));
console.log('  GLANCEAI PROMPT ↔ PARSER CONTRACT AUDIT (lib/prompts.js ↔ lib/interview-engine.js)');
console.log('='.repeat(70));

let passes = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passes++;
    console.log(`  ✅ PASS: ${testName} ${details ? '— ' + details : ''}`);
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? '— ' + details : ''}`);
  }
}

// Returns the text of a `### <heading>` section (up to the next ### heading or code fence)
function section(text, heading) {
  const start = text.indexOf(heading);
  if (start === -1) return '';
  const rest = text.slice(start);
  const end = rest.slice(heading.length).search(/\n###|\n```/);
  return end === -1 ? rest : rest.slice(0, heading.length + end);
}

// 1. Marker contracts
console.log('\n[CONTRACT 1]: Output markers are shared, not re-typed');
const autoWatch = buildTurn({ kind: 'auto_watch' }, { codeLanguage: 'python' });
assert(autoWatch.userText.trim().endsWith(OUTPUT_MARKERS.NO_PROBLEM_DETECTED), 'Auto-Watch prompt ends with the NO_PROBLEM_DETECTED sentinel the renderer checks for');
const autoWatchOcr = buildTurn({ kind: 'auto_watch', ocrText: '1. Two Sum' }, {});
assert(autoWatchOcr.userText.includes('"""\n1. Two Sum\n"""') && autoWatchOcr.userText.trim().endsWith(OUTPUT_MARKERS.NO_PROBLEM_DETECTED), 'Auto-Watch with OCR text: OCR included, sentinel still last');

const verbalSystem = buildSystemPrompt('adaptive', '', 'cpp', 'What is a mutex?');
const recognizedLine = verbalSystem.split('\n').find(line => line.includes(OUTPUT_MARKERS.RECOGNIZED_QUESTION));
assert(!!recognizedLine, 'Adaptive verbal prompt asks for the Recognized Question marker line');
assert(extractRecognizedQuestion(recognizedLine || '') === 'Clean, reconstructed technical question', "Renderer parser extracts the prompt's own Recognized Question example", extractRecognizedQuestion(recognizedLine || ''));
assert(extractRecognizedQuestion('**🎯 Recognized Question:** What is a mutex?\n> "A mutex is..."') === 'What is a mutex?', 'Parser handles a realistic streamed line');

// 2. Glance Anchors contract (coding templates → chip strip)
console.log('\n[CONTRACT 2]: Glance Anchors section ↔ extractGlanceAnchors');
const codingTemplates = {
  'adaptive (coding question)': buildSystemPrompt('adaptive', '', 'cpp', 'Write the code for LRU cache'),
  'coding mode': buildSystemPrompt('coding', '', 'python', ''),
  'teleprompter mode': buildSystemPrompt('interview_teleprompter', '', 'java', '')
};
for (const [label, template] of Object.entries(codingTemplates)) {
  const anchors = extractGlanceAnchors(section(template, '### 🏷️ Glance Anchors'));
  const labels = anchors.map(a => a.split(':')[0]);
  assert(labels.join(',') === 'Brute,Bridge,Core,Trap', `${label}: template's anchors parse into Brute/Bridge/Core/Trap chips`, labels.join(','));
}

// 3. Progression talking points contract (coding template → notch pill bullets)
console.log('\n[CONTRACT 3]: Brute-to-optimal ladder ↔ extractProgressionTalkingPoints');
const codingTemplate = codingTemplates['adaptive (coding question)'];
const bridgeLine = codingTemplate.split('\n').find(line => line.includes('**Optimization Insight**:'));
const ladderPoints = extractProgressionTalkingPoints(`> "Say this first."\n${bridgeLine}`);
assert(!!bridgeLine && ladderPoints.bullet2.startsWith('1 sentence stating the data structure/pattern'), 'Notch bullet 2 reads the Optimization Insight line the template asks for', ladderPoints.bullet2);

// 4. Debugger contract (debug prompt → notch pill + Trap chip)
console.log('\n[CONTRACT 4]: Instant debugger format ↔ parsers');
const debugTurn = buildTurn({ kind: 'debug', ocrText: 'Test 3 failed' }, { codeLanguage: 'go' });
const failureLine = debugTurn.userText.split('\n').find(line => line.includes('**Failure Mechanism**:'));
const debugPoints = extractProgressionTalkingPoints(`> "Off by one."\n${failureLine}`);
assert(!!failureLine && debugPoints.bullet2.startsWith('1 punchy sentence explaining WHY'), 'Notch bullet 2 reads the Failure Mechanism line the debug prompt asks for', debugPoints.bullet2);
assert(debugTurn.userText.includes('```go\n'), 'Debug patch fence uses the selected language');

// 5. Single classification: system prompt and user turn always agree
console.log('\n[CONTRACT 5]: One classification drives system prompt, user turn, and token ceiling');
const questions = [
  'Write the code for LRU cache',
  'What is the difference between a process and a thread?',
  'Show me a code snippet for binary search',
  'Explain consistent hashing'
];
for (const question of questions) {
  const turn = buildTurn({ kind: 'spoken_question', question }, {});
  const system = buildSystemPrompt('adaptive', '', 'cpp', turn.contextQuestion, '', { isCoding: turn.isCoding });
  const systemSaysCode = system.includes('The interviewer asked for CODE / IMPLEMENTATION');
  const userSaysCode = turn.userText.includes('You MUST output the complete, compile-ready');
  assert(systemSaysCode === turn.isCoding && userSaysCode === turn.isCoding && (turn.maxTokens === 2500) === turn.isCoding,
    `"${question}" → ${turn.isCoding ? 'coding' : 'verbal'} everywhere`);
}

// 6. Quick actions are always grounded in the resume
console.log('\n[CONTRACT 6]: Quick actions declare resume grounding');
for (const action of Object.keys(QUICK_ACTIONS)) {
  const turn = buildTurn({ kind: 'quick_action', action }, {});
  const system = buildSystemPrompt('adaptive', 'RESUME-MARKER-TEXT', 'cpp', turn.contextQuestion, '', { isCoding: turn.isCoding, isCandidateSpecific: turn.isCandidateSpecific });
  assert(system.includes('RESUME-MARKER-TEXT') && turn.displayQuestion === QUICK_ACTIONS[action].display, `${action}: resume included, display "${turn.displayQuestion}"`);
}

console.log('\n' + '='.repeat(70));
const passRate = totalTests > 0 ? Math.round((passes / totalTests) * 100) : 100;
console.log(`  CONTRACT AUDIT COMPLETE: ${passes}/${totalTests} CHECKS PASSED (${passRate}%)`);
console.log('='.repeat(70) + '\n');

if (passes < totalTests) {
  process.exit(1);
}

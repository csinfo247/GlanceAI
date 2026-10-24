/**
 * GlanceAI - Groq Stream Pipeline Regression Test
 * Drives the REAL `start-groq-stream` IPC handler in main.js end-to-end, with Electron,
 * the Groq SDK, and the Gemini HTTPS call replaced by in-process fakes.
 * Hermetic: uses a temp userData dir and never touches the network or your glanceai-config.json.
 */

const Module = require('module');
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { EventEmitter } = require('events');

const TEST_KEY = 'gsk_test_key_0123456789';
const PRIMARY_MODEL = 'qwen/qwen3.8-27b';

// Hermetic config: loadStoredConfig() reads from app.getPath('userData')
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'glanceai-stream-test-'));
const configPath = path.join(userDataDir, 'glanceai-config.json');
delete process.env.GROQ_BACKUP_API_KEY;
delete process.env.GOOGLE_AI_KEY;

// Fake Groq SDK: each test sets groqBehavior(payload) to return a stream or throw
const groqRequests = [];
let groqBehavior = () => { throw new Error('groqBehavior not configured'); };

class FakeGroq {
  constructor(options) {
    this.options = options;
    this.chat = {
      completions: {
        create: async (payload) => {
          groqRequests.push({ ...payload, apiKey: this.options.apiKey });
          return groqBehavior(payload, this.options.apiKey);
        }
      }
    };
  }
}

// Load main.js with stubbed electron + groq-sdk and capture its IPC handlers
const ipcHandlers = {};
const originalLoad = Module._load;
Module._load = function (request) {
  if (request === 'electron') {
    return {
      app: { getPath: () => userDataDir },
      ipcMain: {
        handle: (channel, fn) => { ipcHandlers[channel] = fn; },
        on: (channel, fn) => { ipcHandlers[channel] = fn; }
      }
    };
  }
  if (request === 'groq-sdk') return FakeGroq;
  return originalLoad.apply(this, arguments);
};
require('./main');
Module._load = originalLoad;

console.log('='.repeat(70));
console.log('  GLANCEAI GROQ STREAM PIPELINE: REGRESSION AUDIT (start-groq-stream IPC)');
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

function streamOf(...deltas) {
  return (async function* () {
    for (const content of deltas) {
      yield { choices: [{ delta: { content } }] };
    }
  })();
}

function rateLimitError(model) {
  const err = new Error(`429 Rate limit reached for model ${model}`);
  err.status = 429;
  return err;
}

function lastUserText(request) {
  const userMsg = request.messages[request.messages.length - 1];
  if (typeof userMsg.content === 'string') return userMsg.content;
  const textPart = userMsg.content.find(p => p.type === 'text');
  return textPart ? textPart.text : '';
}

/**
 * Invokes the real IPC handler and collects everything main.js sends back to the renderer.
 * main.js logs are buffered and only printed if an assertion in the case fails.
 */
async function runStream(payload) {
  const sent = [];
  const event = {
    sender: {
      send: (channel, data) => sent.push({ channel, data }),
      isDestroyed: () => false
    }
  };
  groqRequests.length = 0;

  const logs = [];
  const savedConsole = { log: console.log, warn: console.warn, error: console.error };
  console.log = console.warn = console.error = (...args) => logs.push(args.map(String).join(' '));
  let uncaught = null;
  try {
    await ipcHandlers['start-groq-stream'](event, payload);
  } catch (err) {
    uncaught = err;
  } finally {
    Object.assign(console, savedConsole);
  }

  return {
    uncaught,
    logs,
    channels: sent.map(s => s.channel),
    start: (sent.find(s => s.channel === 'groq-stream-start') || {}).data,
    chunks: sent.filter(s => s.channel === 'groq-stream-chunk').map(s => s.data),
    end: (sent.find(s => s.channel === 'groq-stream-end') || {}).data,
    error: (sent.find(s => s.channel === 'groq-stream-error') || {}).data
  };
}

function systemText(request) {
  return request ? request.messages[0].content : '';
}

async function testCase(title, fn) {
  console.log(`\n[STREAM CASE]: ${title}`);
  const failuresBefore = totalTests - passes;
  const result = await fn();
  if (totalTests - passes > failuresBefore && result) {
    if (result.uncaught) console.error(`  ↳ uncaught: ${result.uncaught.stack || result.uncaught}`);
    if (result.error) console.error(`  ↳ groq-stream-error: ${result.error}`);
    result.logs.forEach(line => console.error(`  ↳ ${line}`));
  }
}

function assertCleanCompletion(result) {
  assert(!result.uncaught, 'Handler does not throw', result.uncaught ? result.uncaught.message : '');
  assert(!result.error, 'No groq-stream-error sent to renderer', result.error || '');
  assert(!!result.end, 'groq-stream-end sent to renderer');
}

async function run() {
  // 1. Typed question (no transcript) — regression: "isCoding is not defined" failed every tier
  await testCase('Typed question streams to completion on the primary model', async () => {
    groqBehavior = () => streamOf('> "A hash map', ' gives O(1) average lookups."');
    const result = await runStream({ apiKey: TEST_KEY, intent: { kind: 'freeform', text: 'What is a hash map?' } });
    assertCleanCompletion(result);
    assert(result.start?.displayQuestion === 'What is a hash map?', 'groq-stream-start carries the display question', result.start?.displayQuestion);
    assert(result.channels.indexOf('groq-stream-start') < result.channels.indexOf('groq-stream-chunk'), 'groq-stream-start arrives before the first chunk');
    assert(result.chunks.length === 2, 'Each delta forwarded as a groq-stream-chunk', `${result.chunks.length} chunks`);
    assert(result.end?.fullText === '> "A hash map gives O(1) average lookups."', 'fullText is the concatenated stream');
    assert(result.end?.modelUsed === PRIMARY_MODEL, 'Primary model used when no rate limit', result.end?.modelUsed);
    assert(groqRequests[0]?.max_completion_tokens === 1500, 'Verbal question gets the 1500-token ceiling', String(groqRequests[0]?.max_completion_tokens));
    return result;
  });

  // 2. Spoken verbal question — regression: uncaught ReferenceError on the Auto-Pilot path
  await testCase('Spoken verbal question (Auto-Pilot path) builds the teleprompter turn', async () => {
    groqBehavior = () => streamOf('> "Threads share an address space; processes do not."');
    const question = 'What is the difference between a process and a thread?';
    const result = await runStream({
      apiKey: TEST_KEY,
      intent: { kind: 'spoken_question', question, priorContext: 'Okay, let us begin.' }
    });
    assertCleanCompletion(result);
    const userText = groqRequests[0] ? lastUserText(groqRequests[0]) : '';
    assert(userText.includes(`[Active Turn from Interviewer (Question to Answer NOW)]:\n${question}`), 'User turn includes the active interviewer section');
    assert(userText.includes('[Prior Discussion Context (Past Turns / Original Problem Statement)]:\nOkay, let us begin.'), 'Prior transcript context included when there is no message history');
    assert(!userText.includes('[Direct User Instruction'), 'No instruction section unless the user typed one');
    assert(userText.includes('Glance-and-Speak teleprompter format'), 'Verbal question gets the teleprompter instruction');
    assert(result.start?.isCoding === false && result.start?.isFollowUp === false, 'Classified as verbal, not a follow-up');
    assert(groqRequests[0]?.max_completion_tokens === 1500, 'Verbal question gets the 1500-token ceiling', String(groqRequests[0]?.max_completion_tokens));
    return result;
  });

  // 3. Spoken coding question — isCoding must drive the instruction, prompt cleanup, and token ceiling
  await testCase('Spoken coding question switches to code instruction and 2500-token ceiling', async () => {
    groqBehavior = () => streamOf('```cpp\nclass LRUCache {};\n```');
    const question = 'Write the code for LRU cache';
    const result = await runStream({
      apiKey: TEST_KEY,
      codeLanguage: 'cpp',
      intent: { kind: 'spoken_question', question }
    });
    assertCleanCompletion(result);
    const userText = groqRequests[0] ? lastUserText(groqRequests[0]) : '';
    assert(userText.includes('You MUST output the complete, compile-ready Modern C++ (C++17/20 STL) code'), 'Coding question gets the code instruction');
    assert(!userText.includes('Glance-and-Speak teleprompter'), 'No contradictory teleprompter instruction in a coding turn');
    assert(systemText(groqRequests[0]).includes('The interviewer asked for CODE / IMPLEMENTATION'), 'System prompt agrees: coding template');
    assert(groqRequests[0]?.max_completion_tokens === 2500, 'Coding question gets the 2500-token ceiling', String(groqRequests[0]?.max_completion_tokens));
    assert(result.start?.isCoding === true, 'groq-stream-start reports isCoding');
    return result;
  });

  // Single classification: a spoken follow-up to a coding question stays coding in BOTH system and user turn
  await testCase('Spoken follow-up to a coding question is classified once, consistently', async () => {
    groqBehavior = () => streamOf('> "Sort and use two pointers for O(1) space."');
    const history = [{ turnId: 1, question: 'Write the code for Two Sum', solutionSummary: 'Key Spoken Answer: "Use a hash map."', timestamp: Date.now() }];
    const result = await runStream({
      apiKey: TEST_KEY,
      intent: { kind: 'spoken_question', question: 'Can we do it without extra space?', priorContext: 'ignored when history exists' },
      conversationHistory: history
    });
    assertCleanCompletion(result);
    const request = groqRequests[0];
    const userText = request ? lastUserText(request) : '';
    assert(result.start?.isFollowUp === true && result.start?.isCoding === true, 'Classified as a coding follow-up', JSON.stringify(result.start));
    assert(userText.includes('[CRITICAL MULTI-TURN FOLLOW-UP DIRECTIVE (STAFF COGNITION)]'), 'Follow-up directive included');
    assert(userText.includes('You MUST output the complete, compile-ready'), 'User turn: coding instruction');
    assert(systemText(request).includes('The interviewer asked for CODE / IMPLEMENTATION'), 'System prompt: coding template (no verbal/coding mismatch)');
    assert(!userText.includes('ignored when history exists'), 'Prior transcript context omitted when message history carries the context');
    assert(request?.messages.length === 4 && request.messages[1].content === 'Write the code for Two Sum', 'History sent as prior user/assistant messages');
    assert(request?.max_completion_tokens === 2500, 'Coding follow-up keeps the 2500-token ceiling', String(request?.max_completion_tokens));
    return result;
  });

  // Quick actions declare resume grounding explicitly (previously 3 of 4 silently dropped the resume)
  await testCase('Resume quick actions always include the uploaded resume', async () => {
    groqBehavior = () => streamOf('> "Here are your STAR stories."');
    const resume = 'Jane Doe\nSenior Backend Engineer\nBuilt a payments ledger at Acme handling 80k QPS.';
    let lastResult;
    for (const action of ['resume_pitch', 'star_stories', 'stack_defense', 'why_this_role']) {
      lastResult = await runStream({ apiKey: TEST_KEY, projectContext: resume, intent: { kind: 'quick_action', action } });
      assert(!lastResult.error && systemText(groqRequests[0]).includes('80k QPS'), `${action}: resume text present in system prompt`);
    }
    return lastResult;
  });

  await testCase('Unknown request kinds are rejected before any model call', async () => {
    groqBehavior = () => streamOf('should not be called');
    let lastResult;
    for (const intent of [{ kind: 'shell_exec' }, { kind: 'toString' }, null, { kind: 'quick_action', action: 'nope' }]) {
      lastResult = await runStream({ apiKey: TEST_KEY, intent });
      assert(!lastResult.uncaught && /Unknown (request kind|quick action)/.test(lastResult.error || ''), `Rejected intent ${JSON.stringify(intent)}`, lastResult.error || '');
      assert(groqRequests.length === 0 && !lastResult.start, 'No Groq request and no stream start for a rejected intent');
    }
    return lastResult;
  });

  // 4. Rate limit on the primary tier falls through to the next model
  await testCase('429 on primary model falls back to the next tier', async () => {
    groqBehavior = (payload) => {
      if (payload.model === PRIMARY_MODEL) throw rateLimitError(payload.model);
      return streamOf('fallback answer');
    };
    const result = await runStream({ apiKey: TEST_KEY, intent: { kind: 'freeform', text: 'Explain consistent hashing' } });
    assertCleanCompletion(result);
    const modelsTried = groqRequests.map(r => r.model);
    assert(modelsTried[0] === PRIMARY_MODEL && modelsTried[1] === 'openai/gpt-oss-120b', 'Tiers tried in order', modelsTried.join(' -> '));
    assert(result.end?.modelUsed === 'openai/gpt-oss-120b', 'modelUsed reports the fallback tier', result.end?.modelUsed);
    assert(groqRequests[1]?.reasoning_effort === 'low', 'gpt-oss fallback forces low reasoning effort');
    return result;
  });

  // 3e. Auto-Watch under rate limits: the text-only fallback model must still be able to read the screen
  await testCase('Auto-Watch falls back to a text-only model WITH the screen OCR text', async () => {
    groqBehavior = (payload) => {
      if (payload.model === PRIMARY_MODEL) throw rateLimitError(payload.model);
      return streamOf('> "Use a hash map of complements."');
    };
    const result = await runStream({
      apiKey: 'gsk_autowatch_key_0004',
      intent: { kind: 'auto_watch', ocrText: '1. Two Sum\nGiven an array of integers nums and an integer target' },
      imageBase64: 'data:image/jpeg;base64,/9j/AAAA'
    });
    assertCleanCompletion(result);
    const fallback = groqRequests[1];
    const fallbackText = fallback ? lastUserText(fallback) : '';
    assert(fallback?.model === 'openai/gpt-oss-120b' && typeof fallback.messages[fallback.messages.length - 1].content === 'string', 'Vision model rate-limited → text-only fallback with the image stripped');
    assert(fallbackText.includes('1. Two Sum') && fallbackText.includes('Given an array of integers'), 'Fallback still receives the on-screen problem via OCR text');
    return result;
  });

  // 4a. The text-model dropdown selection is honored (gpt-oss-120b used to be silently rewritten to qwen)
  await testCase('Selected text model from the dropdown is actually used', async () => {
    groqBehavior = () => streamOf('> "Answer from the selected model."');
    const result = await runStream({
      apiKey: 'gsk_dropdown_key_0003',
      model: 'openai/gpt-oss-120b',
      intent: { kind: 'freeform', text: 'Explain the CAP theorem' }
    });
    assertCleanCompletion(result);
    assert(groqRequests[0]?.model === 'openai/gpt-oss-120b' && groqRequests[0]?.reasoning_effort === 'low', 'gpt-oss-120b selection dispatched as selected (with low reasoning effort)', groqRequests[0]?.model);
    assert(result.end?.modelUsed === 'openai/gpt-oss-120b', 'modelUsed reports the selected model');
    return result;
  });

  // 4b. Two-key pool: rotate keys on the same model, and remember the cooled-down key across requests
  await testCase('Rate-limited key rotates to the backup key and stays skipped on the next request', async () => {
    const keyA = 'gsk_rotation_key_A_0001';
    const keyB = 'gsk_rotation_key_B_0002';
    groqBehavior = (payload, apiKey) => {
      if (apiKey === keyA) throw rateLimitError(payload.model);
      return streamOf('answer from backup key');
    };
    const first = await runStream({ apiKey: keyA, backupApiKey: keyB, intent: { kind: 'freeform', text: 'Explain consistent hashing' } });
    assertCleanCompletion(first);
    assert(groqRequests.map(r => `${r.model}@${r.apiKey.slice(-4)}`).join(',') === `${PRIMARY_MODEL}@0001,${PRIMARY_MODEL}@0002`, 'Key #1 rate-limited → key #2 on the same model', groqRequests.map(r => r.apiKey.slice(-4)).join(','));
    assert(first.end?.modelUsed === PRIMARY_MODEL, 'Primary model still serves the answer');

    const second = await runStream({ apiKey: keyA, backupApiKey: keyB, intent: { kind: 'freeform', text: 'And how do virtual nodes help?' } });
    assertCleanCompletion(second);
    assert(groqRequests.length === 1 && groqRequests[0].apiKey === keyB, 'Next request skips the cooled-down key entirely', groqRequests.map(r => r.apiKey.slice(-4)).join(','));
    return second;
  });

  // 4c. Comma-separated backup keys: a third key is used when the first two are rate-limited
  await testCase('Backup field with two comma-separated keys gives a three-key pool', async () => {
    const keyA = 'gsk_pool_key_A_0011';
    const keyB = 'gsk_pool_key_B_0012';
    const keyC = 'gsk_pool_key_C_0013';
    groqBehavior = (payload, apiKey) => {
      if (apiKey === keyA || apiKey === keyB) throw rateLimitError(payload.model);
      return streamOf('answer from the third key');
    };
    const result = await runStream({ apiKey: keyA, backupApiKey: `${keyB}, ${keyC}`, intent: { kind: 'freeform', text: 'Explain Raft leader election' } });
    assertCleanCompletion(result);
    assert(groqRequests.map(r => r.apiKey.slice(-4)).join(',') === '0011,0012,0013' && groqRequests.every(r => r.model === PRIMARY_MODEL), 'Key #1 and #2 rate-limited → key #3 on the same model', groqRequests.map(r => `${r.model}@${r.apiKey.slice(-4)}`).join(','));
    return result;
  });

  // 5. Gemini vision fallback — regression: "isScreenOrCoding is not defined" before the request was sent
  await testCase('All Groq vision tiers exhausted falls back to Gemini 2.0 Flash', async () => {
    fs.writeFileSync(configPath, JSON.stringify({ googleAiKey: 'test-google-ai-key' }), 'utf8');
    groqBehavior = (payload) => { throw rateLimitError(payload.model); };

    const geminiRequests = [];
    const originalRequest = https.request;
    https.request = (options, onResponse) => {
      const req = new EventEmitter();
      let body = '';
      req.write = (data) => { body += data; };
      req.end = () => {
        geminiRequests.push({ options, body: JSON.parse(body) });
        setImmediate(() => {
          const res = new EventEmitter();
          onResponse(res);
          res.emit('data', JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Gemini answer' }] } }] }));
          res.emit('end');
        });
      };
      return req;
    };

    let result;
    try {
      result = await runStream({
        apiKey: TEST_KEY,
        intent: { kind: 'screen', ocrText: '', instruction: '', title: 'Two Sum' },
        imageBase64: 'data:image/jpeg;base64,/9j/AAAA'
      });
    } finally {
      https.request = originalRequest;
      fs.rmSync(configPath, { force: true });
    }

    assertCleanCompletion(result);
    assert(geminiRequests.length === 1, 'Gemini request dispatched', `${geminiRequests.length} requests`);
    assert(geminiRequests[0]?.options.hostname === 'generativelanguage.googleapis.com', 'Gemini request targets the Generative Language API');
    assert(geminiRequests[0]?.options.headers['x-goog-api-key'] === 'test-google-ai-key' && !geminiRequests[0]?.options.path.includes('key='), 'Google AI key sent in the x-goog-api-key header, never in the URL', geminiRequests[0]?.options.path);
    assert(geminiRequests[0]?.body.generationConfig.maxOutputTokens === 2500, 'Vision fallback keeps the 2500-token ceiling', String(geminiRequests[0]?.body.generationConfig.maxOutputTokens));
    assert(geminiRequests[0]?.body.contents[0].parts.some(p => p.inline_data?.mime_type === 'image/jpeg'), 'Screenshot forwarded as inline image data');
    assert(result.end?.modelUsed === 'gemini-2.0-flash (fallback)' && result.end?.fullText === 'Gemini answer', 'Gemini answer delivered via groq-stream-end', result.end?.modelUsed);
    return result;
  });

  fs.rmSync(userDataDir, { recursive: true, force: true });

  console.log('\n' + '='.repeat(70));
  const passRate = totalTests > 0 ? Math.round((passes / totalTests) * 100) : 100;
  console.log(`  STREAM AUDIT COMPLETE: ${passes}/${totalTests} CHECKS PASSED (${passRate}%)`);
  console.log('='.repeat(70) + '\n');

  if (passes < totalTests) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  fs.rmSync(userDataDir, { recursive: true, force: true });
  process.exit(1);
});

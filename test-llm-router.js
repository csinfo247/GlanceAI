/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
/**
 * GlanceAI - LLM Router & Model Catalog Unit Test
 * Exercises lib/llm/router.js and lib/llm/models.js directly with fake providers, the real
 * ModelCircuitBreaker, and an injected sleep — deterministic, no network, no real waiting.
 */

const { buildCandidates, openFirstAvailable, keyFingerprint } = require('./lib/llm/router');
const {
  DEFAULT_MODEL,
  FALLBACK_TIERS,
  getModelInfo,
  resolveRequestModels,
  migrateSavedModels,
  modelTiers
} = require('./lib/llm/models');
const { ModelCircuitBreaker } = require('./lib/interview-engine');

console.log('='.repeat(70));
console.log('  GLANCEAI LLM ROUTER & MODEL CATALOG AUDIT (lib/llm)');
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

const silenced = { log: console.log, warn: console.warn };
function quiet() { console.log = console.warn = () => {}; }
function loud() { Object.assign(console, silenced); }

function rateLimit(message = '429 Rate limit reached') {
  const err = new Error(message);
  err.status = 429;
  return err;
}

/** Fake candidate list: behaviors[id] is an array of outcomes consumed per open() call ('ok' | Error). */
function fakeCandidates(specs, behaviors, opened) {
  return specs.map(([model, keyIndex, extra = {}]) => {
    const id = `${model}#k${keyIndex}`;
    return {
      id,
      label: `${model} (Key #${keyIndex})`,
      model,
      modelUsed: model,
      tracked: extra.tracked !== false,
      fastRetry: Boolean(extra.fastRetry),
      imageStripped: Boolean(extra.imageStripped),
      open: async () => {
        opened.push(id);
        const outcome = (behaviors[id] || ['ok']).shift() || 'ok';
        if (outcome instanceof Error) throw outcome;
        return (async function* () { yield `answer from ${id}`; })();
      }
    };
  });
}

async function runRouter(specs, behaviors, { breaker = new ModelCircuitBreaker(), signal = null, exhaustedHint = '' } = {}) {
  const opened = [];
  const sleeps = [];
  quiet();
  try {
    const result = await openFirstAvailable(fakeCandidates(specs, behaviors, opened), {
      breaker,
      signal,
      exhaustedHint,
      sleep: async (ms) => { sleeps.push(ms); }
    });
    return { opened, sleeps, candidate: result.candidate, breaker };
  } catch (error) {
    return { opened, sleeps, error, breaker };
  } finally {
    loud();
  }
}

async function run() {
  // 1. Model catalog
  console.log('\n[ROUTER 1]: Model catalog');
  assert(modelTiers(DEFAULT_MODEL).join(',') === [DEFAULT_MODEL, ...FALLBACK_TIERS].join(','), 'Tiers: selected model first, then fallbacks');
  assert(modelTiers('openai/gpt-oss-20b').join(',') === `openai/gpt-oss-20b,openai/gpt-oss-120b,${DEFAULT_MODEL}`, 'Non-default selection: de-duplicated, with the fast default as the last fallback');
  assert(getModelInfo('qwen/qwen3.8-27b').vision === true && getModelInfo('openai/gpt-oss-120b').vision === false, 'Vision capability comes from the catalog');
  assert(getModelInfo('openai/gpt-oss-999b-preview').reasoningEffort === 'low' && getModelInfo('llama-3.1-8b-instant').vision === false, 'Unknown ids fall back to name-based inference');
  assert(resolveRequestModels('llama-3.3-70b-versatile', 'llama-3.2-90b-vision-preview').textModel === DEFAULT_MODEL, 'Decommissioned models rewritten at request time');
  for (const option of ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b']) {
    assert(resolveRequestModels(option, '').textModel === option, `Dropdown option ${option} is honored at request time`);
    assert(migrateSavedModels({ textModel: option }).textModel === option, `Saved selection ${option} survives an app restart`);
  }
  assert(resolveRequestModels('', '').textModel === DEFAULT_MODEL && resolveRequestModels('', '').visionModel === DEFAULT_MODEL, 'Empty selection falls back to the default model');
  assert(migrateSavedModels({ textModel: 'llama-3.1-8b-instant', visionModel: 'llama-3.2-11b-vision-preview' }).visionModel === DEFAULT_MODEL, 'Saved config: decommissioned models migrated');

  // 2. Candidate construction
  console.log('\n[ROUTER 2]: Candidate construction (model tiers × API keys)');
  const opens = [];
  const fakeGroq = ({ apiKey }) => ({ open: async (req) => { opens.push({ apiKey, ...req }); return (async function* () {})(); } });
  const fakeGemini = ({ apiKey }) => ({ open: async (req) => { opens.push({ apiKey, gemini: true, ...req }); return (async function* () {})(); } });
  const visionMessages = [
    { role: 'system', content: 'sys' },
    { role: 'user', content: [{ type: 'text', text: 'Solve this' }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AAA' } }] }
  ];
  const candidates = buildCandidates({
    primaryModel: DEFAULT_MODEL, isVision: true, messages: visionMessages, maxTokens: 2500,
    groqKeys: ['gsk_key_one_0001', 'gsk_key_two_0002'], googleAiKey: 'google-key',
    createGroq: fakeGroq, createGemini: fakeGemini
  });
  assert(candidates.map(c => c.label).join(' | ') === 'qwen/qwen3.8-27b (Key #1) | qwen/qwen3.8-27b (Key #2) | openai/gpt-oss-120b (Key #1) | openai/gpt-oss-120b (Key #2) | openai/gpt-oss-20b (Key #1) | openai/gpt-oss-20b (Key #2) | gemini-2.0-flash',
    'Order: each model tier across every key, Gemini last');
  assert(candidates[0].id !== candidates[1].id && !candidates[0].id.includes('gsk_'), 'Breaker ids are per model+key and never contain the raw key', candidates[0].id);
  assert(candidates[0].id === `qwen/qwen3.8-27b#${keyFingerprint('gsk_key_one_0001')}`, 'Breaker id = model#sha256(key) prefix');
  quiet();
  for (const c of candidates) await c.open();
  loud();
  assert(Array.isArray(opens[0].messages[1].content), 'Vision model receives the image');
  assert(typeof opens[2].messages[1].content === 'string' && opens[2].reasoningEffort === 'low', 'Text-only gpt-oss receives image-stripped text and low reasoning effort');
  assert(opens[6].gemini === true && opens[6].apiKey === 'google-key' && opens[6].maxTokens === 2500, 'Gemini receives the Google key and token ceiling');
  const textOnly = buildCandidates({ primaryModel: DEFAULT_MODEL, isVision: false, messages: [], maxTokens: 1500, groqKeys: ['gsk_key_one_0001'], googleAiKey: 'google-key', createGroq: fakeGroq, createGemini: fakeGemini });
  assert(!textOnly.some(c => c.model === 'gemini-2.0-flash'), 'No Gemini fallback for text-only requests');

  // 3. Fallback behavior
  console.log('\n[ROUTER 3]: Fallback, key rotation, and per-key circuit breaker');
  const Q = 'qwen/qwen3.8-27b';
  const BIG = 'openai/gpt-oss-120b';
  let r = await runRouter([[Q, 1, { fastRetry: true }], [BIG, 1]], {});
  assert(r.candidate.id === `${Q}#k1` && r.opened.length === 1, 'First candidate that opens wins');

  const sharedBreaker = new ModelCircuitBreaker();
  r = await runRouter([[Q, 1, { fastRetry: true }], [Q, 2, { fastRetry: true }], [BIG, 1]], { [`${Q}#k1`]: [rateLimit()] }, { breaker: sharedBreaker });
  assert(r.opened.join(',') === `${Q}#k1,${Q}#k2` && r.candidate.id === `${Q}#k2`, 'Rate limit on key #1 rotates to key #2 on the same model');
  assert(r.sleeps.length === 0, 'Key rotation never waits');
  r = await runRouter([[Q, 1, { fastRetry: true }], [Q, 2, { fastRetry: true }], [BIG, 1]], {}, { breaker: sharedBreaker });
  assert(r.opened.join(',') === `${Q}#k2`, 'Next request skips the cooled-down key and goes straight to key #2', r.opened.join(','));

  r = await runRouter([[Q, 1, { fastRetry: true }], [BIG, 1]], { [`${Q}#k1`]: [rateLimit('429 Please try again in 1.2s'), 'ok'] });
  assert(r.sleeps.length === 0 && r.candidate.id === `${BIG}#k1`, 'Short cooldown on the fast model: falls back to the next model immediately (no waiting)', r.opened.join(' → '));

  r = await runRouter([[Q, 1, { fastRetry: true }], [BIG, 1]], { [`${Q}#k1`]: [rateLimit('429 Please try again in 1.2s'), 'ok'], [`${BIG}#k1`]: [new Error('503 overloaded')] });
  assert(r.sleeps.join(',') === '1700' && r.opened.join(',') === `${Q}#k1,${BIG}#k1,${Q}#k1` && r.candidate.id === `${Q}#k1`, 'Every fallback failed too: waits out the short cooldown (cooldown + 2s buffer − 1.5s) and retries the fast model', `slept ${r.sleeps.join(',')}ms`);

  r = await runRouter([[Q, 1, { fastRetry: true }], [BIG, 1, { imageStripped: true }]], { [`${Q}#k1`]: [rateLimit('429 Please try again in 1.2s'), 'ok'] });
  assert(r.sleeps.join(',') === '1700' && r.candidate.id === `${Q}#k1`, 'Screenshot request: waits briefly for the vision model instead of a text-only fallback that drops the image', r.opened.join(' → '));

  r = await runRouter([[BIG, 1], [Q, 1]], { [`${BIG}#k1`]: [rateLimit('429 Please try again in 1.2s')] });
  assert(r.sleeps.length === 0 && r.candidate.id === `${Q}#k1`, 'Slow (non-fastRetry) model falls back instead of waiting');

  r = await runRouter([[Q, 1, { fastRetry: true }], [BIG, 1]], { [`${Q}#k1`]: [rateLimit('429 tokens per day (TPD) exceeded')] });
  assert(r.sleeps.length === 0 && r.candidate.id === `${BIG}#k1` && !r.breaker.isAvailable(`${Q}#k1`), 'Daily quota (long cooldown) falls back and opens the breaker');

  r = await runRouter([[Q, 1, { fastRetry: true }], [BIG, 1]], { [`${Q}#k1`]: [Object.assign(new Error('500 Internal Server Error'), { status: 500 })] });
  assert(r.candidate.id === `${BIG}#k1` && r.breaker.isAvailable(`${Q}#k1`), 'Non-rate-limit error falls back without opening the breaker');

  const controller = new AbortController();
  const abortErr = Object.assign(new Error('Request was aborted.'), { name: 'APIUserAbortError' });
  controller.abort();
  r = await runRouter([[Q, 1], [BIG, 1]], { [`${Q}#k1`]: [abortErr] }, { signal: controller.signal });
  assert(r.error === abortErr && r.opened.length === 1, 'Abort is rethrown immediately without trying other candidates');

  const coolBreaker = new ModelCircuitBreaker();
  coolBreaker.recordFailure(`${Q}#k1`, rateLimit('429 try again in 50s'));
  coolBreaker.recordFailure(`${BIG}#k1`, rateLimit('429 try again in 10s'));
  r = await runRouter([[Q, 1], [BIG, 1], ['gemini-2.0-flash', 0, { tracked: false }]], { [`${BIG}#k1`]: [rateLimit()], [`${Q}#k1`]: [rateLimit()] }, { breaker: coolBreaker });
  assert(r.opened.join(',') === `${BIG}#k1,${Q}#k1,gemini-2.0-flash#k0`, 'All cooling down: still tried earliest-recovery first, untracked Gemini last', r.opened.join(','));

  r = await runRouter([[Q, 1], [BIG, 1]], { [`${Q}#k1`]: [rateLimit()], [`${BIG}#k1`]: [new Error('503 overloaded')] }, { exhaustedHint: ' Tip: test.' });
  assert(r.error && r.error.message === `All model tiers failed (${Q} (Key #1): 429 Rate limit reached -> ${BIG} (Key #1): 503 overloaded). Tip: test.`, 'Exhausted error lists every attempt in order, plus the hint', r.error && r.error.message);

  console.log('\n' + '='.repeat(70));
  const passRate = totalTests > 0 ? Math.round((passes / totalTests) * 100) : 100;
  console.log(`  ROUTER AUDIT COMPLETE: ${passes}/${totalTests} CHECKS PASSED (${passRate}%)`);
  console.log('='.repeat(70) + '\n');

  if (passes < totalTests) {
    process.exit(1);
  }
}

run().catch((err) => {
  loud();
  console.error(err);
  process.exit(1);
});

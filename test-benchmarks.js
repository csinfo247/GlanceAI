// test-benchmarks.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

// Locate glanceai-config.json in userData
function getGlanceaiConfig() {
  const possiblePaths = [
    path.join(os.homedir(), 'Library', 'Application Support', 'glanceai', 'glanceai-config.json'),
    path.join(os.homedir(), 'AppData', 'Roaming', 'glanceai', 'glanceai-config.json'),
    path.join(__dirname, 'glanceai-config.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (_) {}
    }
  }
  return {};
}

const config = getGlanceaiConfig();
const groqApiKey = config.groqApiKey || process.env.GROQ_API_KEY;
const deepgramApiKey = config.deepgramApiKey || process.env.DEEPGRAM_API_KEY;

console.log('='.repeat(70));
console.log('  GLANCEAI INTERVIEW READINESS & BENCHMARK SUITE');
console.log('='.repeat(70));
console.log(`[Config Check] Groq API Key:     ${groqApiKey ? 'FOUND (Masked: ' + groqApiKey.slice(0, 7) + '...' + groqApiKey.slice(-4) + ')' : 'MISSING'}`);
console.log(`[Config Check] Deepgram API Key: ${deepgramApiKey ? 'FOUND (Masked: ' + deepgramApiKey.slice(0, 7) + '...' + deepgramApiKey.slice(-4) + ')' : 'MISSING'}`);
console.log(`[Config Check] Selected Model:   ${config.textModel || config.groqModel || 'llama-3.3-70b-versatile'}`);
console.log(`[Config Check] Code Language:    ${config.codeLanguage || 'cpp'}`);
console.log(`[Config Check] Auto-Pilot:       ${(config.autoPilotEnabled !== false && config.isAutoPilotEnabled !== false) ? 'ENABLED' : 'DISABLED'}`);
console.log(`[Config Check] LAN Companion:    ${config.lanCompanionEnabled !== false ? 'ENABLED (Port: ' + (config.lanCompanionPort || 4242) + ')' : 'DISABLED'}`);
console.log('-'.repeat(70));

// Auto-Pilot Question Detection Heuristic Test
function testAutoPilotHeuristics() {
  console.log('\n--- TEST SUITE 1: AUTO-PILOT QUESTION DETECTION ACCURACY ---');

  const testCases = [
    { text: "Can you explain how virtual DOM works in React and how reconciliation happens?", expected: true, type: "Standard Technical Question" },
    { text: "What is the time complexity of quicksort in the worst case?", expected: true, type: "Short Fact Question" },
    { text: "How would you design a distributed cache like Redis from scratch?", expected: true, type: "System Design Question" },
    { text: "Tell me about a time when you had a disagreement with an engineering lead.", expected: true, type: "Behavioral Question" },
    { text: "Yeah exactly, that makes total sense. Okay cool.", expected: false, type: "Conversational Filler" },
    { text: "Right, so let's continue with the rest of the problem.", expected: false, type: "Interviewer Transition" },
    { text: "Hmm okay, let me see your screen for a second.", expected: false, type: "Logistical Chit-Chat" },
    { text: "Why would you choose Postgres over MongoDB for this specific transactional system?", expected: true, type: "Architecture Justification" },
  ];

  // Logic mirroring renderer.js
  const questionKeywords = [
    'what', 'why', 'how', 'when', 'where', 'who', 'which',
    'can you', 'could you', 'would you', 'explain', 'describe',
    'tell me', 'walk me through', 'implement', 'design', 'difference between',
    'compare', 'optimize', 'write a', 'solve', 'time complexity', 'space complexity'
  ];

  function detectQuestion(t) {
    const clean = t.trim().toLowerCase();
    if (clean.length < 8) return false;
    const hasQuestionMark = clean.includes('?');
    const hasKeyword = questionKeywords.some(kw => {
      const regex = new RegExp(`(^|[\\s,.;!?])${kw}([\\s,.;!?]|$)`, 'i');
      return regex.test(clean);
    });
    return hasQuestionMark || hasKeyword;
  }

  let passed = 0;
  testCases.forEach((tc, idx) => {
    const detected = detectQuestion(tc.text);
    const ok = detected === tc.expected;
    if (ok) passed++;
    console.log(`  [Case ${idx + 1}] ${ok ? '✅ PASS' : '❌ FAIL'} | ${tc.type}: "${tc.text.slice(0, 50)}..." -> Detected: ${detected}`);
  });

  const accuracy = (passed / testCases.length) * 100;
  console.log(`  => Question Detection Accuracy: ${passed}/${testCases.length} (${accuracy.toFixed(1)}%)`);
}

// Groq Live Inference Benchmark
async function testGroqBenchmarks() {
  if (!groqApiKey) {
    console.log('\n[SKIP] Groq API Key not found, skipping live inference benchmark.');
    return;
  }

  console.log('\n--- TEST SUITE 2: GROQ INFERENCE SPEED & METRICS ---');

  const DEPRECATED_TEXT_MAP = {
    'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
    'llama-3.1-70b-versatile': 'openai/gpt-oss-120b',
    'llama-3.1-8b-instant': 'openai/gpt-oss-20b'
  };

  const configuredModel = config.groqModel || 'openai/gpt-oss-120b';
  const targetModel = DEPRECATED_TEXT_MAP[configuredModel] || configuredModel;

  const modelsToTest = [
    { id: targetModel, label: `Configured Model (${targetModel})` },
    { id: 'qwen/qwen3.8-27b', label: 'Ultra-Fast Flash Model (qwen/qwen3.8-27b)' },
    { id: 'openai/gpt-oss-120b', label: 'Flagship Architecture Model (openai/gpt-oss-120b)' }
  ];

  // De-duplicate
  const uniqueModels = [];
  const seen = new Set();
  for (const m of modelsToTest) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      uniqueModels.push(m);
    }
  }

  const { Groq } = require('groq-sdk');
  const groq = new Groq({ apiKey: groqApiKey });

  const systemPrompt = `You are GlanceAI, an ultra-low-latency real-time technical interview copilot and teleprompter.
A developer is in a live video/audio interview call.
The candidate can only glance at their screen for 2-3 seconds at a time while speaking.

CRITICAL TELEPROMPTER OUTPUT RULES:
1. ALWAYS start your response with a Markdown Blockquote containing the EXACT verbatim 1-2 sentence anchor answer:
> "[Concise, natural, authoritative 1-2 sentence verbal talking point that directly answers the question]"

2. Bullet points with high-density technical depth:
- Key architectural reasoning
- Trade-offs and edge cases
- Time & Space complexity if applicable

3. If code is requested, provide clean C++ code.`;

  const interviewScenarios = [
    {
      name: "DSA / Coding: Two Sum O(n)",
      prompt: "The interviewer verbally asked this question in the call: \"Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Can you do it in O(n)?\". Provide your Glance-and-Speak Teleprompter answer."
    },
    {
      name: "System Design: Distributed Rate Limiter 100k RPS",
      prompt: "The interviewer verbally asked this question in the call: \"How would you design a distributed rate limiter that can handle 100,000 requests per second across multiple data centers?\". Provide your Glance-and-Speak Teleprompter answer."
    },
    {
      name: "Deep Dive / Architecture: Optimistic vs Pessimistic Locking",
      prompt: "The interviewer verbally asked this question in the call: \"What is the practical difference between optimistic and pessimistic locking, and when would you pick one over the other in Postgres?\". Provide your Glance-and-Speak Teleprompter answer."
    }
  ];

  for (const modelObj of uniqueModels) {
    console.log(`\n============================================================`);
    console.log(`  MODEL BENCHMARK: ${modelObj.label}`);
    console.log(`============================================================`);

    for (const scenario of interviewScenarios) {
      console.log(`\n  Scenario: [${scenario.name}]`);
      const tStart = Date.now();
      let tFirstContentToken = null;
      let totalTokens = 0;
      let fullOutput = '';

      try {
        const stream = await groq.chat.completions.create({
          model: modelObj.id,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: scenario.prompt }
          ],
          temperature: 0.2,
          max_tokens: 600,
          stream: true
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            if (!tFirstContentToken) {
              tFirstContentToken = Date.now();
            }
            fullOutput += delta;
            totalTokens++;
          }
        }

        const tEnd = Date.now();
        const ttft = tFirstContentToken ? (tFirstContentToken - tStart) : null;
        const totalTime = tEnd - tStart;
        const tps = totalTokens > 0 ? (totalTokens / (totalTime / 1000)).toFixed(1) : 0;

        console.log(`    ⚡ Time to First Token (TTFT):       ${ttft} ms`);
        console.log(`    ⏱️  Total Response Time:              ${totalTime} ms`);
        console.log(`    📊 Throughput:                       ${tps} tokens/sec`);

        // Check Anchor Quote
        const quoteMatch = fullOutput.match(/> "([^"]+)"/);
        if (quoteMatch) {
          console.log(`    🗣️ Teleprompter Anchor:             "${quoteMatch[1]}"`);
        } else {
          const firstLine = fullOutput.split('\n').filter(l => l.trim().length > 0)[0] || '';
          console.log(`    🗣️ First Line:                      ${firstLine.slice(0, 100)}...`);
        }
      } catch (err) {
        console.error(`    ❌ Benchmark Failed: ${err.message}`);
      }
    }
  }
}

// LAN Companion Server Latency Test
async function testCompanionLatency() {
  console.log('\n--- TEST SUITE 3: LAN COMPANION SERVER LATENCY & ENDPOINTS ---');
  const port = config.lanCompanionPort || 4242;

  // Check if companion server is responding
  const checkEndpoint = (path, method = 'GET') => {
    return new Promise((resolve) => {
      const t0 = Date.now();
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: method,
        timeout: 1500
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, latency: Date.now() - t0, bodyLength: body.length });
        });
      });
      req.on('error', (err) => resolve({ error: err.message, latency: Date.now() - t0 }));
      req.on('timeout', () => { req.destroy(); resolve({ error: 'TIMEOUT', latency: 1500 }); });
      req.end();
    });
  };

  const statusRes = await checkEndpoint('/api/status');
  if (statusRes.error) {
    console.log(`  ℹ️ Companion server not currently running on port ${port} (normal if main app isn't open).`);
  } else {
    console.log(`  ✅ /api/status HTTP ${statusRes.status} in ${statusRes.latency} ms`);
  }

  const htmlRes = await checkEndpoint('/');
  if (!htmlRes.error) {
    console.log(`  ✅ / (companion.html) HTTP ${htmlRes.status} (${htmlRes.bodyLength} bytes) in ${htmlRes.latency} ms`);
  }
}

async function run() {
  testAutoPilotHeuristics();
  await testGroqBenchmarks();
  await testCompanionLatency();
  console.log('\n' + '='.repeat(70));
  console.log('  BENCHMARK SUITE COMPLETE');
  console.log('='.repeat(70) + '\n');
}

run();

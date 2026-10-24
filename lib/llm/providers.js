/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
/**
 * GlanceAI - LLM Providers (Main Process)
 * Every provider exposes `open(request) → Promise<AsyncIterable<string>>`: the promise settles once the
 * response has started (so rate limits surface before any text is emitted and the router can fall back),
 * then the iterable yields text deltas.
 */

const https = require('https');
const Groq = require('groq-sdk');
const { GEMINI_FALLBACK } = require('./models');

const TEMPERATURE = 0.15;
const TOP_P = 0.95;

// groq-sdk's built-in agent drops idle sockets after 4s, so questions asked 15-90s apart each paid a fresh
// DNS + TCP + TLS handshake. This agent keeps idle sockets for 60s (Groq held idle connections open 90s+ in testing).
const IDLE_SOCKET_TIMEOUT_MS = 60000;
const keepAliveAgent = new https.Agent({ keepAlive: true, timeout: IDLE_SOCKET_TIMEOUT_MS });

async function* groqTextDeltas(stream) {
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) yield delta;
  }
}

/**
 * Groq chat completions (OpenAI-compatible streaming). maxRetries: 0 so the router fails over instantly.
 * Every client shares keepAliveAgent (unless a proxy agent is configured), so a client per request keeps connections warm.
 */
function createGroqProvider({ apiKey, httpAgent = null }) {
  const options = { apiKey: apiKey.trim(), maxRetries: 0, httpAgent: httpAgent || keepAliveAgent };
  const client = new Groq(options);

  return {
    async open({ model, messages, maxTokens, reasoningEffort, signal }) {
      const requestPayload = {
        model,
        messages,
        temperature: TEMPERATURE,
        max_completion_tokens: maxTokens,
        top_p: TOP_P,
        stream: true
      };
      if (reasoningEffort) {
        requestPayload.reasoning_effort = reasoningEffort;
      }
      const stream = await client.chat.completions.create(requestPayload, { signal });
      return groqTextDeltas(stream);
    }
  };
}

/**
 * Google Gemini generateContent (non-streaming): the whole answer is yielded as a single delta.
 * Uses the system prompt plus the latest multimodal user turn; prior history is not sent.
 */
function createGeminiProvider({ apiKey, agent = null }) {
  return {
    async open({ messages, maxTokens, signal }) {
      const systemText = messages[0]?.role === 'system' ? messages[0].content : '';
      const userMsg = messages.find(m => m.role === 'user' && Array.isArray(m.content));
      const textPart = userMsg?.content?.find(p => p.type === 'text');
      const imagePart = userMsg?.content?.find(p => p.type === 'image_url');
      const base64Match = (imagePart?.image_url?.url || '').match(/^data:image\/(.*?);base64,(.+)$/);
      if (!base64Match || !textPart) {
        throw new Error('Gemini fallback requires a base64 image and text prompt');
      }

      const postData = JSON.stringify({
        contents: [{
          parts: [
            { text: `${systemText}\n\n${textPart.text}` },
            { inline_data: { mime_type: `image/${base64Match[1]}`, data: base64Match[2] } }
          ]
        }],
        generationConfig: {
          temperature: TEMPERATURE,
          maxOutputTokens: maxTokens
        }
      });

      const reqOpts = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${GEMINI_FALLBACK.model}:generateContent`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          // Header, not ?key= query param, so the key never lands in proxy or access logs
          'x-goog-api-key': apiKey.trim()
        }
      };
      if (agent) reqOpts.agent = agent;
      if (signal) reqOpts.signal = signal;

      const text = await new Promise((resolve, reject) => {
        const req = https.request(reqOpts, (res) => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                resolve(parsed.candidates[0].content.parts[0].text);
              } else {
                reject(new Error(parsed.error?.message || 'Gemini returned empty response'));
              }
            } catch (e) {
              reject(new Error('Gemini response parse error: ' + e.message));
            }
          });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });

      return (async function* () { yield text; })();
    }
  };
}

/**
 * Replaces multimodal user content with its text part, for text-only fallback models
 * (the OCR text already embedded in the prompt still reaches them).
 */
function stripImages(messages) {
  return messages.map((m) => {
    if (m.role === 'user' && Array.isArray(m.content)) {
      const textPart = m.content.find(p => p.type === 'text');
      return { role: 'user', content: textPart ? textPart.text : '' };
    }
    return m;
  });
}

module.exports = {
  createGroqProvider,
  createGeminiProvider,
  stripImages
};

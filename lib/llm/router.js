/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
/**
 * GlanceAI - LLM Fallback Router (Main Process)
 * Turns one request into an ordered list of (model × API key) candidates and opens the first one that
 * starts streaming. Rate limits rotate keys, then models; the circuit breaker remembers cooldowns per
 * model+key so a quota-exhausted key is skipped on later requests while other keys stay in use.
 */

const crypto = require('crypto');
const { isRateLimitError, parseCooldownDurationMs } = require('../interview-engine');
const { getModelInfo, modelTiers, GEMINI_FALLBACK } = require('./models');
const { createGroqProvider, createGeminiProvider, stripImages } = require('./providers');

// A rate limit asking us to wait at most this long is retried on the same fast model instead of falling back
const SHORT_COOLDOWN_MS = 5000;

function keyFingerprint(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 12);
}

function keySuffix(apiKey) {
  return apiKey.length > 4 ? `...${apiKey.slice(-4)}` : 'Key';
}

function isAbortError(err, signal) {
  if (!err) return false;
  return (
    err.name === 'AbortError' ||
    err.name === 'APIUserAbortError' ||
    Boolean(signal && signal.aborted) ||
    String(err.message || '').toLowerCase().includes('aborted')
  );
}

/**
 * @returns {Array<{ id, label, model, modelUsed, tracked, fastRetry, open: () => Promise<AsyncIterable<string>> }>}
 *   `tracked` candidates participate in the circuit breaker; the Gemini fallback does not.
 */
function buildCandidates({
  primaryModel,
  isVision = false,
  messages,
  maxTokens,
  signal = null,
  groqKeys = [],
  googleAiKey = '',
  httpAgent = null,
  createGroq = createGroqProvider,
  createGemini = createGeminiProvider
}) {
  const candidates = [];

  for (const model of modelTiers(primaryModel)) {
    const info = getModelInfo(model);
    const textOnlyFallback = isVision && !info.vision;
    const modelMessages = textOnlyFallback ? stripImages(messages) : messages;

    groqKeys.forEach((apiKey, keyIndex) => {
      candidates.push({
        id: `${model}#${keyFingerprint(apiKey)}`,
        label: `${model} (Key #${keyIndex + 1})`,
        model,
        modelUsed: model,
        tracked: true,
        fastRetry: Boolean(info.fastRetry),
        imageStripped: textOnlyFallback,
        open: () => {
          console.log(`[GlanceAI LLM] Dispatching Groq stream with model: ${model}${textOnlyFallback ? ' (Vision text fallback)' : ''} [${keySuffix(apiKey)}]`);
          return createGroq({ apiKey, httpAgent }).open({ model, messages: modelMessages, maxTokens, reasoningEffort: info.reasoningEffort, signal });
        }
      });
    });
  }

  if (isVision && googleAiKey) {
    candidates.push({
      id: GEMINI_FALLBACK.model,
      label: GEMINI_FALLBACK.label,
      model: GEMINI_FALLBACK.model,
      modelUsed: GEMINI_FALLBACK.modelUsed,
      tracked: false,
      fastRetry: false,
      open: () => {
        console.log('[GlanceAI LLM] All Groq vision candidates exhausted. Attempting Gemini 2.0 Flash fallback...');
        return createGemini({ apiKey: googleAiKey, agent: httpAgent }).open({ messages, maxTokens, signal });
      }
    });
  }

  return candidates;
}

/**
 * Opens the first candidate that starts streaming.
 * Breaker-tracked candidates in cooldown are skipped (or, if all are cooling down, tried earliest-recovery
 * first); untracked candidates (Gemini) always run last.
 * A fast model on a short cooldown falls through to the next model immediately (gpt-oss starts in ~0.5s,
 * faster than waiting out the cooldown) and is retried only if every other candidate fails, except when the
 * remaining fallbacks would drop the screenshot, where a brief wait for the vision model is worth it.
 * @returns {Promise<{ stream: AsyncIterable<string>, candidate: object }>}
 */
async function openFirstAvailable(candidates, {
  breaker,
  signal = null,
  exhaustedHint = '',
  sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
} = {}) {
  const tracked = candidates.filter(c => c.tracked);
  const byId = new Map(tracked.map(c => [c.id, c]));
  const ordered = [
    ...breaker.getPrioritizedCandidates(tracked.map(c => c.id)).map(id => byId.get(id)),
    ...candidates.filter(c => !c.tracked)
  ];

  const errors = [];
  const deferred = [];
  for (let i = 0; i < ordered.length; i++) {
    const candidate = ordered[i];
    try {
      const stream = await candidate.open();
      if (candidate.tracked) breaker.recordSuccess(candidate.id);
      return { stream, candidate };
    } catch (err) {
      if (isAbortError(err, signal)) throw err;
      errors.push(`${candidate.label}: ${err.message}`);

      if (candidate.tracked && isRateLimitError(err)) {
        const next = ordered[i + 1];
        const anotherKeyForModel = next && next.tracked && next.model === candidate.model;
        const waitMs = parseCooldownDurationMs(err.message);

        if (anotherKeyForModel) {
          console.warn(`[GlanceAI LLM] ${candidate.label} rate-limited. Rotating to ${next.label}...`);
        } else if (waitMs <= SHORT_COOLDOWN_MS && candidate.fastRetry) {
          const fallbackDropsImage = !candidate.imageStripped && ordered.slice(i + 1).filter(c => c.tracked).every(c => c.imageStripped);
          if (fallbackDropsImage) {
            // Screenshot request: every fallback is text-only, so a brief wait for the vision model is worth it
            console.log(`[GlanceAI LLM] Short cooldown (${waitMs}ms) on ${candidate.label}. Waiting to keep the screenshot...`);
            await sleep(Math.max(500, waitMs - 1500));
            try {
              const stream = await candidate.open();
              breaker.recordSuccess(candidate.id);
              return { stream, candidate };
            } catch (retryErr) {
              if (isAbortError(retryErr, signal)) throw retryErr;
              console.warn(`[GlanceAI LLM] Fast retry on ${candidate.label} also failed: ${retryErr.message}`);
            }
          } else {
            deferred.push({ candidate, waitMs });
          }
        }
        breaker.recordFailure(candidate.id, err);
      } else {
        console.warn(`[GlanceAI LLM] ${candidate.label} failed (${err.message}).`);
      }

      if (i + 1 < ordered.length) {
        console.log(`[GlanceAI LLM] Falling back to ${ordered[i + 1].label}`);
      }
    }
  }

  // Every other candidate failed too: now a short wait for the fast model beats giving up
  if (deferred.length) {
    const { candidate, waitMs } = deferred.sort((a, b) => a.waitMs - b.waitMs)[0];
    console.log(`[GlanceAI LLM] All fallbacks failed. Waiting out the short cooldown (${waitMs}ms) on ${candidate.label}...`);
    await sleep(Math.max(500, waitMs - 1500));
    try {
      const stream = await candidate.open();
      breaker.recordSuccess(candidate.id);
      return { stream, candidate };
    } catch (retryErr) {
      if (isAbortError(retryErr, signal)) throw retryErr;
      errors.push(`${candidate.label} (after cooldown): ${retryErr.message}`);
    }
  }

  throw new Error(`All model tiers failed (${errors.join(' -> ')}).${exhaustedHint}`);
}

module.exports = {
  buildCandidates,
  openFirstAvailable,
  isAbortError,
  keyFingerprint
};

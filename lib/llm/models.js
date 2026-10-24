/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
/**
 * GlanceAI - Model Catalog (Main Process)
 * Single source of truth for model ids, capabilities, fallback order, and model-id rewrites.
 */

const DEFAULT_MODEL = 'qwen/qwen3.8-27b';

// Tried in order after the user's selected model when it is rate-limited or failing
const FALLBACK_TIERS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

/**
 * vision:          accepts image_url content (text-only models get the image stripped, OCR text stays)
 * reasoningEffort: sent as reasoning_effort to skip long hidden reasoning on gpt-oss models
 * fastRetry:       on a short (<= 5s) rate-limit cooldown, wait and retry this model instead of falling back
 */
const MODEL_INFO = {
  'qwen/qwen3.8-27b': { vision: true, fastRetry: true },
  'openai/gpt-oss-120b': { vision: false, reasoningEffort: 'low' },
  'openai/gpt-oss-20b': { vision: false, reasoningEffort: 'low', fastRetry: true }
};

// Last-resort vision fallback (non-streaming), used only when a Google AI key is configured
const GEMINI_FALLBACK = {
  model: 'gemini-2.0-flash',
  label: 'gemini-2.0-flash',
  modelUsed: 'gemini-2.0-flash (fallback)'
};

const DECOMMISSIONED_TEXT_MODELS = {
  'llama-3.3-70b-versatile': DEFAULT_MODEL,
  'llama-3.1-70b-versatile': DEFAULT_MODEL,
  'llama-3.1-8b-instant': DEFAULT_MODEL
};

const DECOMMISSIONED_VISION_MODELS = {
  'llama-3.2-11b-vision-preview': DEFAULT_MODEL,
  'llama-3.2-90b-vision-preview': DEFAULT_MODEL
};

/**
 * Capabilities for a model id. Unknown ids fall back to name-based inference.
 */
function getModelInfo(modelId = '') {
  if (MODEL_INFO[modelId]) return MODEL_INFO[modelId];
  return {
    vision: !/gpt-oss|llama-3\.[13]/.test(modelId),
    reasoningEffort: /gpt-oss/.test(modelId) ? 'low' : undefined,
    fastRetry: /gpt-oss-20b/.test(modelId)
  };
}

// Only decommissioned models are rewritten: every model offered in the dropdown is honored as selected
function resolveRequestModels(textModel, visionModel) {
  return {
    textModel: DECOMMISSIONED_TEXT_MODELS[textModel] || textModel || DEFAULT_MODEL,
    visionModel: DECOMMISSIONED_VISION_MODELS[visionModel] || visionModel || DEFAULT_MODEL
  };
}

function migrateSavedModels(config) {
  if (DECOMMISSIONED_TEXT_MODELS[config.textModel]) {
    config.textModel = DECOMMISSIONED_TEXT_MODELS[config.textModel];
  }
  if (DECOMMISSIONED_VISION_MODELS[config.visionModel]) {
    config.visionModel = DECOMMISSIONED_VISION_MODELS[config.visionModel];
  }
  return config;
}

/**
 * Ordered, de-duplicated model tiers for a request: selected model first, then FALLBACK_TIERS,
 * then DEFAULT_MODEL (so a non-default selection still falls back to the fast default).
 */
function modelTiers(primaryModel) {
  return [...new Set([primaryModel, ...FALLBACK_TIERS, DEFAULT_MODEL].filter(Boolean))];
}

module.exports = {
  DEFAULT_MODEL,
  FALLBACK_TIERS,
  GEMINI_FALLBACK,
  getModelInfo,
  resolveRequestModels,
  migrateSavedModels,
  modelTiers
};

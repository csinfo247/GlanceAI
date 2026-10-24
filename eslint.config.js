/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
/**
 * GlanceAI - ESLint Flat Config
 * Catches undeclared identifiers (which `node -c` cannot) across every process:
 * Electron main/preload (Node), renderer (browser), and the Chrome extension.
 */

const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**', 'vendor/**', 'bin/**', 'dist/**', 'build/**', 'out/**']
  },
  {
    // Default: Node.js CommonJS (main.js, preload.js, companion-server.js, scripts, tests)
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }]
    }
  },
  {
    // Shared engine is a UMD module loaded by both Node and the renderer <script> tag
    files: ['lib/interview-engine.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.node, ...globals.browser }
    }
  },
  {
    // Renderer runs as a classic <script> after vendor/marked, vendor/purify, and lib/interview-engine
    files: ['renderer.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        marked: 'readonly',
        DOMPurify: 'readonly',
        GlanceAIEngine: 'readonly'
      }
    }
  },
  {
    files: ['extensions/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.serviceworker, ...globals.webextensions }
    }
  }
];

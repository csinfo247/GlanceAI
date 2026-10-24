/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
/**
 * GlanceAI - Notch (Gaze-Lock) Pill Geometry (Main Process)
 * The pill sits centered directly below the webcam. Its width stays narrow so reading it barely moves the
 * eyes; its height follows the content the renderer reports, within fixed bounds.
 */

const NOTCH_MAX_WIDTH = 520;
const NOTCH_WIDTH_RATIO = 0.45;
const NOTCH_DEFAULT_HEIGHT = 96;
const NOTCH_MIN_HEIGHT = 44;
const NOTCH_MAX_HEIGHT = 220;

function clampNotchHeight(height, workAreaHeight = Infinity) {
  const requested = Number.isFinite(height) ? Math.round(height) : NOTCH_DEFAULT_HEIGHT;
  return Math.max(NOTCH_MIN_HEIGHT, Math.min(requested, NOTCH_MAX_HEIGHT, workAreaHeight));
}

function computeNotchBounds(workArea, displayBounds, platform) {
  const width = Math.min(NOTCH_MAX_WIDTH, Math.round(workArea.width * NOTCH_WIDTH_RATIO));
  return {
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    // macOS: just under the menu bar, where the camera notch is
    y: displayBounds.y + (platform === 'darwin' ? 36 : 10),
    width,
    height: clampNotchHeight(NOTCH_DEFAULT_HEIGHT, workArea.height)
  };
}

module.exports = {
  NOTCH_MAX_WIDTH,
  NOTCH_MIN_HEIGHT,
  NOTCH_MAX_HEIGHT,
  clampNotchHeight,
  computeNotchBounds
};

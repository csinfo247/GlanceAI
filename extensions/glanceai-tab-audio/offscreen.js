/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
// offscreen.js - Offscreen Tab Audio Capture & Streaming Relay

let mediaRecorder = null;
let currentStream = null;
let audioContext = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_OFFSCREEN_STREAM') {
    (async () => {
      try {
        const streamId = msg.streamId;

        // 1. Capture tab media stream using chromeMediaSourceId
        let stream;
        try {
          // Attempt audio-only capture first
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
              }
            },
            video: false
          });
        } catch (err) {
          console.warn('[GlanceAI Tab Audio] Audio-only constraint fallback to dual constraint:', err);
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
              }
            },
            video: {
              mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
              }
            }
          });
        }
        currentStream = stream;

        // 2. Extract the pristine audio stream (do NOT stop video tracks as that aborts Chromium tabCapture session!)
        const audioTracks = currentStream.getAudioTracks();
        if (!audioTracks || audioTracks.length === 0) {
          throw new Error('No audio tracks found in captured tab stream');
        }
        const audioStream = new MediaStream(audioTracks);

        // 4. Mirror audio to speakers/headphones so candidate can hear the call!
        try {
          audioContext = new AudioContext();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          const source = audioContext.createMediaStreamSource(audioStream);
          source.connect(audioContext.destination);
        } catch (audioErr) {
          console.warn('[GlanceAI Tab Audio] AudioContext mirror note:', audioErr);
        }

        // 5. Encode audio into 100ms chunks and stream to GlanceAI server
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
        }
        let chunkIndex = 0;
        const chunkQueue = [];
        let isFlushingQueue = false;
        let lastRecorderRestartAt = 0;

        // Pairing token from the background worker (chrome.runtime is the only extension API offscreen documents get)
        const glanceaiToken = msg.glanceaiToken || '';

        async function flushQueue() {
          if (isFlushingQueue) return;
          isFlushingQueue = true;

          // Cap queue to 75 chunks (~7.5s at 100ms) to guarantee zero memory accumulation if host sleeps
          while (chunkQueue.length > 75) {
            chunkQueue.shift();
          }

          while (chunkQueue.length > 0) {
            const item = chunkQueue.shift();
            try {
              const headers = {
                'Content-Type': 'application/octet-stream',
                'X-Chunk-Index': String(item.index),
                'X-Is-Header': String(item.index === 0)
              };
              if (glanceaiToken) {
                headers['X-GlanceAI-Token'] = glanceaiToken;
              } else {
                headers['X-GlanceAI-Token'] = '';
              }

              let signal;
              try {
                if (typeof AbortSignal?.timeout === 'function') {
                  signal = AbortSignal.timeout(2500);
                }
              } catch (_) {}

              let res;
              try {
                res = await fetch('http://127.0.0.1:4242/api/tab-audio', {
                  method: 'POST',
                  headers,
                  body: item.data,
                  signal
                });
              } catch (_) {
                // Secondary fallback to localhost if 127.0.0.1 hits DNS quirks
                res = await fetch('http://localhost:4242/api/tab-audio', {
                  method: 'POST',
                  headers,
                  body: item.data,
                  signal
                });
              }

              if (!res.ok) {
                console.warn('[GlanceAI Tab Audio] Server returned HTTP', res.status);
              } else if ((await res.json().catch(() => null))?.needsHeader) {
                restartRecorderForHeader();
              }
            } catch (err) {
              console.warn('[GlanceAI Tab Audio] Failed to post chunk:', err);
            }
          }
          isFlushingQueue = false;
        }

        // Each recorder produces its own WebM stream; only its first chunk carries the header Deepgram needs to decode
        function startRecorder() {
          mediaRecorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
          mediaRecorder.onerror = (err) => {
            console.warn('[GlanceAI Tab Audio] MediaRecorder note:', err);
          };
          chunkIndex = 0;
          chunkQueue.length = 0;
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              const currentIdx = chunkIndex++;
              chunkQueue.push({ index: currentIdx, data: e.data });
              flushQueue();
            }
          };
          mediaRecorder.start(100); // 100ms slices: interviewer audio reaches GlanceAI ~150ms sooner than 250ms slices
        }

        // GlanceAI restarted mid-capture and never saw this stream's header, so Meet audio cannot be transcribed:
        // begin a fresh stream (at most every 3s)
        function restartRecorderForHeader() {
          if (Date.now() - lastRecorderRestartAt < 3000) return;
          lastRecorderRestartAt = Date.now();
          console.log('[GlanceAI Tab Audio] GlanceAI has no header for this stream (it restarted). Starting a fresh stream.');
          const previous = mediaRecorder;
          previous.ondataavailable = null; // the old stream's tail must not follow the new header
          try { previous.stop(); } catch (_) {}
          startRecorder();
        }

        startRecorder();
        console.log('[GlanceAI Tab Audio] Streaming active to http://localhost:4242/api/tab-audio');
        sendResponse({ success: true });
      } catch (err) {
        console.warn('[GlanceAI Tab Audio] Error starting audio stream:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // Ground truth for the popup: an extension reload or a closed tab ends capture whatever storage says
  if (msg.type === 'GET_OFFSCREEN_STATUS') {
    sendResponse({ recording: Boolean(mediaRecorder && mediaRecorder.state === 'recording') });
    return true;
  }

  if (msg.type === 'STOP_OFFSCREEN_STREAM') {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder = null;
    }
    if (currentStream) {
      currentStream.getTracks().forEach(t => t.stop());
      currentStream = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    console.log('[GlanceAI Tab Audio] Stream stopped');
    sendResponse({ success: true });
    return true;
  }
});

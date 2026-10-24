// background.js - GlanceAI Tab Audio Bridge Background Service Worker

let isCapturing = false;
let activeStreamId = null;

// Initialize state from storage when service worker starts
chrome.storage.local.get(['isCapturing', 'activeStreamId'], (res) => {
  if (res?.isCapturing !== undefined) isCapturing = res.isCapturing;
  if (res?.activeStreamId) activeStreamId = res.activeStreamId;
});

// Ensure offscreen document exists for handling WebRTC audio processing
async function ensureOffscreenDocument() {
  try {
    if (chrome.offscreen?.hasDocument && await chrome.offscreen.hasDocument()) {
      return;
    }
    if (chrome.runtime.getContexts) {
      const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
      });
      if (existingContexts.length > 0) {
        return;
      }
    }

    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Captures and streams meeting tab audio directly to local GlanceAI server'
    });
  } catch (err) {
    // If an offscreen document was already created in a race condition, ignore the error
    if (!err.message?.includes('Only a single offscreen document')) {
      console.warn('[GlanceAI Tab Audio] ensureOffscreenDocument note:', err.message);
    }
  }
}

// Asks the offscreen recorder whether it is actually recording. The stored flag survives an extension reload
// or browser restart even though the recorder does not, which made the popup show "Stop Tab Stream" while
// nothing was being captured.
async function isOffscreenRecording() {
  try {
    let hasDocument = false;
    if (chrome.offscreen?.hasDocument) {
      hasDocument = await chrome.offscreen.hasDocument();
    } else if (chrome.runtime.getContexts) {
      hasDocument = (await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length > 0;
    }
    if (!hasDocument) return false;
    const res = await chrome.runtime.sendMessage({ type: 'GET_OFFSCREEN_STATUS' });
    return Boolean(res && res.recording);
  } catch (_) {
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_STATUS') {
    isOffscreenRecording().then((recording) => {
      if (!recording && isCapturing) {
        isCapturing = false;
        activeStreamId = null;
        chrome.storage.local.set({ isCapturing: false, activeStreamId: null });
      }
      sendResponse({ isCapturing: recording });
    });
    return true;
  }

  if (msg.type === 'START_CAPTURE') {
    (async () => {
      try {
        await ensureOffscreenDocument();

        // The offscreen document can only use chrome.runtime (no chrome.storage), so the pairing token travels
        // with the start message; without it every audio chunk is rejected with HTTP 401
        const { glanceaiToken = '' } = await chrome.storage.local.get(['glanceaiToken']);

        // Obtain tab capture media stream ID for the target tab
        chrome.tabCapture.getMediaStreamId({ targetTabId: msg.tabId }, (streamId) => {
          if (chrome.runtime.lastError || !streamId) {
            sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Could not get stream ID' });
            return;
          }

          activeStreamId = streamId;

          // Dispatch stream ID to offscreen document with resilient retry
          const attemptDispatch = (retriesLeft = 6) => {
            chrome.runtime.sendMessage({
              type: 'START_OFFSCREEN_STREAM',
              streamId,
              glanceaiToken
            }, (offscreenRes) => {
              if (chrome.runtime.lastError || !offscreenRes) {
                if (retriesLeft > 0) {
                  setTimeout(() => attemptDispatch(retriesLeft - 1), 150);
                  return;
                }
                isCapturing = false;
                chrome.storage.local.set({ isCapturing: false, activeStreamId: null });
                sendResponse({ success: false, error: chrome.runtime.lastError?.message || 'Offscreen document did not respond' });
                return;
              }
              if (offscreenRes.success) {
                isCapturing = true;
                chrome.storage.local.set({ isCapturing: true, activeStreamId });
                sendResponse({ success: true });
              } else {
                isCapturing = false;
                chrome.storage.local.set({ isCapturing: false, activeStreamId: null });
                sendResponse({ success: false, error: offscreenRes.error || 'Offscreen audio failed' });
              }
            });
          };

          attemptDispatch();
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (msg.type === 'STOP_CAPTURE') {
    (async () => {
      try {
        chrome.runtime.sendMessage({ type: 'STOP_OFFSCREEN_STREAM' }, () => {
          if (chrome.runtime.lastError) { /* the offscreen document is already gone: nothing left to stop */ }
          isCapturing = false;
          activeStreamId = null;
          chrome.storage.local.set({ isCapturing: false, activeStreamId: null });
          sendResponse({ success: true });
        });
      } catch (err) {
        isCapturing = false;
        activeStreamId = null;
        chrome.storage.local.set({ isCapturing: false, activeStreamId: null });
        sendResponse({ success: true });
      }
    })();
    return true;
  }
});

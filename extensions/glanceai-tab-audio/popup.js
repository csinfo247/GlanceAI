/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 GlanceAI Contributors
 * Copyright (c) 2026 the original upstream authors
 * See the LICENSE file in the project root for full license text.
 */
// popup.js - GlanceAI Tab Audio Bridge Popup Controller

const btnToggle = document.getElementById('btn-toggle');
const streamStatus = document.getElementById('stream-status');
const vuFill = document.getElementById('vu-fill');

const tabNameEl = document.getElementById('tab-name');
const serverStatus = document.getElementById('server-status');

const pairStatus = document.getElementById('pair-status');
const pairCard = document.getElementById('pair-card');
const inputPairToken = document.getElementById('input-pair-token');
const btnPair = document.getElementById('btn-pair');

let isCapturing = false;

// Real-time server health check (liveness only: the server never discloses its token over HTTP)
async function checkServerHealth() {
  try {
    const res = await fetch('http://localhost:4242/api/health', { method: 'GET' });
    if (res.ok) {
      if (serverStatus) serverStatus.innerHTML = '<span class="status-dot active"></span>localhost:4242 (Online)';
      return true;
    }
  } catch (_) {}
  if (serverStatus) serverStatus.innerHTML = '<span class="status-dot" style="background:#ef4444;box-shadow:0 0 6px #ef4444;"></span>localhost:4242 (GlanceAI Closed)';
  return false;
}

// Accepts any GlanceAI link carrying ?token=... (e.g. "Copy Mobile" / "Copy Mentor") or the bare token
function extractToken(rawInput) {
  const text = (rawInput || '').trim();
  const linkMatch = text.match(/[?&#]token=([^&#\s]+)/i);
  if (!linkMatch) return text;
  try {
    return decodeURIComponent(linkMatch[1]);
  } catch (_) {
    return linkMatch[1];
  }
}

// Verifies a token against an authenticated endpoint: 'valid' | 'rejected' | 'offline'
async function verifyToken(token) {
  if (!token) return 'rejected';
  try {
    const res = await fetch('http://localhost:4242/api/status', { headers: { 'X-GlanceAI-Token': token } });
    if (res.ok) return 'valid';
    return res.status === 401 ? 'rejected' : 'offline';
  } catch (_) {
    return 'offline';
  }
}

function renderPairing(state) {
  const labels = {
    valid: '<span class="status-dot active"></span>Paired',
    rejected: '<span class="status-dot" style="background:#f59e0b;box-shadow:0 0 6px #f59e0b;"></span>Not paired',
    offline: '<span class="status-dot"></span>Unknown (GlanceAI Closed)'
  };
  if (pairStatus) pairStatus.innerHTML = labels[state] || labels.offline;
  if (pairCard) pairCard.style.display = state === 'rejected' ? 'block' : 'none';
}

async function refreshPairing() {
  const { glanceaiToken } = await chrome.storage.local.get(['glanceaiToken']);
  const state = await verifyToken(glanceaiToken);
  renderPairing(state);
  return state;
}

checkServerHealth().then(refreshPairing);

if (btnPair && inputPairToken) {
  btnPair.addEventListener('click', async () => {
    const token = extractToken(inputPairToken.value);
    btnPair.textContent = '...';
    const state = await verifyToken(token);
    btnPair.textContent = 'Pair';
    if (state === 'valid') {
      await chrome.storage.local.set({ glanceaiToken: token });
      inputPairToken.value = '';
      renderPairing('valid');
    } else if (state === 'rejected') {
      alert('GlanceAI rejected that token.\n\nIn GlanceAI settings click "Copy Mobile" and paste the full link here.');
    } else {
      alert('GlanceAI is not running. Start GlanceAI first, then pair.');
    }
  });

  inputPairToken.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnPair.click();
  });
}

// Display the currently active tab title so candidate knows exactly what is being captured
chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  if (tab && tabNameEl) {
    const title = tab.title || 'Unknown Tab';
    tabNameEl.textContent = title;
    tabNameEl.title = title;
  }
});

// Query current capture status from background
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
  if (chrome.runtime.lastError || !res) return;
  updateUI(res.isCapturing);
});

btnToggle.addEventListener('click', async () => {
  if (!isCapturing) {
    const isUp = await checkServerHealth();
    if (!isUp) {
      alert('GlanceAI app is not running!\n\nPlease start GlanceAI first in your terminal:\ncd ~/Desktop/glanceai && npm start');
      return;
    }

    if (await refreshPairing() !== 'valid') {
      if (inputPairToken) inputPairToken.focus();
      alert('Pair this extension with GlanceAI first (one-time setup):\nIn GlanceAI settings click "Copy Mobile", then paste the link into the Pair box.');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      alert('No active tab found. Please open your interview meeting tab first.');
      return;
    }

    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
      alert('Please switch to your Google Meet or Zoom tab first before starting tab audio capture.');
      return;
    }

    btnToggle.textContent = 'Connecting...';
    chrome.runtime.sendMessage({ type: 'START_CAPTURE', tabId: tab.id }, (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        alert('Could not start tab audio capture: ' + (res?.error || chrome.runtime.lastError?.message || 'Unknown error'));
        updateUI(false);
      } else {
        updateUI(true);
      }
    });
  } else {
    chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' }, () => {
      updateUI(false);
    });
  }
});

function updateUI(capturing) {
  isCapturing = capturing;
  if (isCapturing) {
    btnToggle.className = 'btn-toggle stop';
    btnToggle.innerHTML = '<span>⏹️ Stop Tab Stream</span>';
    streamStatus.innerHTML = '<span class="status-dot streaming"></span>Streaming';
    vuFill.style.width = '75%';
  } else {
    btnToggle.className = 'btn-toggle';
    btnToggle.innerHTML = '<span>🎙️ Stream Current Tab Audio</span>';
    streamStatus.innerHTML = '<span class="status-dot"></span>Idle';
    vuFill.style.width = '0%';
  }
}

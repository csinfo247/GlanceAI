/**
 * GlanceAI LAN Companion Subsystem
 * Lightweight built-in HTTP & SSE server allowing secondary devices (phone, iPad, laptop)
 * on the same local Wi-Fi / LAN to view live answers, transcript, and trigger screen capture.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

let serverInstance = null;
let activeClients = new Set();
let serverPort = 4242;
let serverAuthToken = '';
let isRunning = false;
let isBoundToLan = false;
let heartbeatTimer = null;

let onCaptureHandler = null;
let onQueryHandler = null;
let getResumeStatusHandler = null;
let onMentorWhisperHandler = null;
let onTabAudioChunkHandler = null;
let onTabAudioRejectedHandler = null;
let lastTabAudioRejectionAt = 0;

let mentorAudioSubscribers = new Set();
let cachedTabAudioHeader = null;
let lastTabAudioTimestamp = 0;
let totalTabAudioBytes = 0;
let tabAudioPacketsCount = 0;

/**
 * Checks if a buffer begins with WebM EBML element identifier (0x1A 0x45 0xDF 0xA3)
 */
function isWebMHeader(buf) {
  if (!buf || buf.length < 4) return false;
  return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
}

/**
 * Discovers non-internal IPv4 LAN IP addresses
 */
function getLocalLanIps() {
  const interfaces = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        results.push({
          interface: name,
          ip: iface.address
        });
      }
    }
  }
  return results;
}

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

// Remote tunnels (Cloudflare Tunnel, ngrok, localtunnel), matched as exact domain suffixes
const TUNNEL_HOST_SUFFIXES = [
  '.trycloudflare.com',
  '.ngrok-free.dev',
  '.ngrok-free.app',
  '.ngrok.app',
  '.ngrok.io',
  '.localtunnel.me'
];

function isTunnelHostname(hostname) {
  return TUNNEL_HOST_SUFFIXES.some(suffix => hostname.endsWith(suffix));
}

/**
 * Validates the Host header to strictly prevent DNS rebinding attacks
 */
function isAuthorizedHost(hostHeader) {
  if (!hostHeader) return false;
  // Strip port from Host header if present (e.g. "localhost:4242" -> "localhost")
  const host = hostHeader.trim().toLowerCase().replace(/:\d+$/, '');

  // Always allow loopback hosts
  if (LOOPBACK_HOSTNAMES.has(host)) {
    return true;
  }

  // If bound to LAN, allow registered local network interface IPs
  if (isBoundToLan) {
    const lanIps = getLocalLanIps().map(item => item.ip.toLowerCase());
    if (lanIps.includes(host)) {
      return true;
    }
  }

  return isTunnelHostname(host);
}

/**
 * Returns current companion server status and access URLs with authentication token.
 * Defaults strictly to 127.0.0.1 when LAN mode is disabled.
 */
function getCompanionInfo() {
  const ips = getLocalLanIps();
  const tokenQuery = serverAuthToken ? `?token=${serverAuthToken}` : '';

  let urls = [];
  let primaryUrl = '';
  let mentorUrl = '';

  if (isBoundToLan && ips.length > 0) {
    urls = ips.map((item) => `http://${item.ip}:${serverPort}${tokenQuery}`);
    primaryUrl = urls[0];
    mentorUrl = `http://${ips[0].ip}:${serverPort}/mentor${tokenQuery}`;
  } else {
    primaryUrl = `http://127.0.0.1:${serverPort}${tokenQuery}`;
    mentorUrl = `http://127.0.0.1:${serverPort}/mentor${tokenQuery}`;
    urls = [primaryUrl];
  }

  return {
    running: isRunning,
    port: serverPort,
    token: serverAuthToken,
    boundToLan: isBoundToLan,
    bindLan: isBoundToLan,
    clientsCount: activeClients.size,
    audioListenersCount: mentorAudioSubscribers.size,
    isAudioStreaming: (Date.now() - lastTabAudioTimestamp) < 3500 && lastTabAudioTimestamp > 0,
    primaryUrl,
    mentorUrl,
    urls,
    ips
  };
}

/**
 * Broadcasts an SSE event to all connected devices on the local LAN
 */
function broadcastCompanionEvent(eventType, data) {
  if (!isRunning || activeClients.size === 0) return;

  const payload = typeof data === 'object' ? JSON.stringify(data) : data;
  const message = `event: ${eventType}\ndata: ${payload}\n\n`;

  for (const res of activeClients) {
    try {
      res.write(message);
    } catch (err) {
      activeClients.delete(res);
    }
  }
}

/**
 * Constant-time token comparison (avoids leaking the token through response timing)
 */
function tokensMatch(candidate, expected) {
  if (typeof candidate !== 'string' || !candidate || !expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Validates request authorization: checks query param ?token= or X-GlanceAI-Token header
 * When a security token is configured, ALL callers must authenticate. There is deliberately no
 * loopback exemption: cloudflared / ngrok proxy remote internet traffic from 127.0.0.1, so a
 * loopback socket address does not prove the caller is on this machine.
 */
function isAuthorizedRequest(req, url) {
  if (!serverAuthToken) return true;

  const tokenInQuery = url.searchParams.get('token');
  const tokenInHeader = req.headers['x-glanceai-token'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  return tokensMatch(tokenInQuery, serverAuthToken) || tokensMatch(tokenInHeader, serverAuthToken);
}

/**
 * Exact origin allowlist: loopback, chrome-extension, registered tunnel domains, or this machine's LAN IPs.
 * Hostnames are compared exactly / by domain suffix, never by substring.
 */
function isAllowedOrigin(origin) {
  let parsed;
  try {
    parsed = new URL(origin);
  } catch (_) {
    return false;
  }
  if (parsed.protocol === 'chrome-extension:') return true;
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  const hostname = parsed.hostname.toLowerCase();
  return LOOPBACK_HOSTNAMES.has(hostname) ||
    isTunnelHostname(hostname) ||
    getLocalLanIps().some(item => item.ip === hostname);
}

/**
 * Sets secure CORS headers: forbids wildcard * for browser origins; echoes only allowlisted origins
 */
function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-GlanceAI-Token, X-Chunk-Index, X-Is-Header, ngrok-skip-browser-warning');
}

/**
 * Starts the LAN Companion & Remote Mentor HTTP / SSE Server
 */
function startCompanionServer({ port = 4242, bindLan = false, token = null, onCapture, onQuery, getResumeStatus, onMentorWhisper, onTabAudioChunk, onTabAudioRejected }) {
  if (onCapture) onCaptureHandler = onCapture;
  if (onQuery) onQueryHandler = onQuery;
  if (getResumeStatus) getResumeStatusHandler = getResumeStatus;
  if (onMentorWhisper) onMentorWhisperHandler = onMentorWhisper;
  if (onTabAudioChunk) onTabAudioChunkHandler = onTabAudioChunk;
  if (onTabAudioRejected) onTabAudioRejectedHandler = onTabAudioRejected;

  if (token === false) {
    serverAuthToken = '';
  } else if (typeof token === 'string' && token.length > 0) {
    serverAuthToken = token;
  } else if (!serverAuthToken) {
    serverAuthToken = crypto.randomBytes(16).toString('hex');
  }

  if (isRunning) {
    console.log(`[GlanceAI Companion] Server already running on port ${serverPort}`);
    return getCompanionInfo();
  }

  serverPort = port;
  isBoundToLan = !!bindLan;

  const htmlPath = path.join(__dirname, 'companion.html');
  const mentorHtmlPath = path.join(__dirname, 'mentor.html');

  serverInstance = http.createServer((req, res) => {
    // Apply secure CORS
    applyCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Safe URL parsing with resilient fallback to prevent uncaught exceptions on malformed Host headers
    let url;
    try {
      url = new URL(req.url, 'http://127.0.0.1:4242');
    } catch (_) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Malformed request URL' }));
      return;
    }

    // Strict Host header validation against DNS rebinding attacks
    if (!isAuthorizedHost(req.headers.host)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Forbidden: Invalid or unauthorized Host header' }));
      return;
    }

    // Unauthenticated Health Check Endpoint (liveness only — never discloses the token, since
    // tunnel traffic also arrives from loopback). Local tools read the token from glanceai-config.json.
    if (url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        running: isRunning,
        port: serverPort
      }));
      return;
    }

    // Public Static Vendor Libraries (pinned locally to prevent CDN outages and exfiltration)
    if (url.pathname === '/vendor/marked.min.js') {
      const markedPath = path.join(__dirname, 'vendor', 'marked.min.js');
      try {
        const content = fs.readFileSync(markedPath);
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(content);
      } catch (_) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
      return;
    }

    if (url.pathname === '/vendor/purify.min.js') {
      const purifyPath = path.join(__dirname, 'vendor', 'purify.min.js');
      try {
        const content = fs.readFileSync(purifyPath);
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(content);
      } catch (_) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
      return;
    }

    // Check authorization for all protected routes
    if (!isAuthorizedRequest(req, url)) {
      // Rejected Meet audio otherwise looks like "no audio"; tell the HUD (at most every 2s, ~20 chunks/s arrive)
      if (url.pathname === '/api/tab-audio' && Date.now() - lastTabAudioRejectionAt > 2000) {
        lastTabAudioRejectionAt = Date.now();
        console.warn('[GlanceAI Companion] Rejected tab audio from the Chrome extension (missing or wrong token). Reload the extension at chrome://extensions, check it says Paired, then Start Tab Stream again.');
        if (typeof onTabAudioRejectedHandler === 'function') onTabAudioRejectedHandler();
      }
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid or missing GlanceAI security token' }));
      return;
    }

    // 1. Root: Serve mobile-optimized candidate companion web app
    if (url.pathname === '/' || url.pathname === '/index.html') {
      try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to load companion.html: ' + err.message);
      }
      return;
    }

    // 1.1 Duo Mode: Serve Remote Mentor Web Portal
    if (url.pathname === '/mentor' || url.pathname === '/mentor.html') {
      try {
        const html = fs.readFileSync(mentorHtmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to load mentor.html: ' + err.message);
      }
      return;
    }

    // 2. SSE Stream: Real-time broadcast channel
    if (url.pathname === '/api/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      });
      res.flushHeaders?.();

      activeClients.add(res);
      console.log(`[GlanceAI Companion] Client connected. Total clients: ${activeClients.size}`);

      // Send initial welcome & resume status
      res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', port: serverPort })}\n\n`);

      if (typeof getResumeStatusHandler === 'function') {
        try {
          const resume = getResumeStatusHandler();
          if (resume && resume.fileName) {
            res.write(`event: resume_status\ndata: ${JSON.stringify({
              loaded: true,
              fileName: resume.fileName,
              title: resume.intelligence?.candidateTitle || 'Candidate',
              skillsCount: resume.intelligence?.skills?.length || 0
            })}\n\n`);
          }
        } catch (_) {}
      }

      req.on('close', () => {
        activeClients.delete(res);
        console.log(`[GlanceAI Companion] Client disconnected. Total clients: ${activeClients.size}`);
      });
      return;
    }

    // 3. Remote Trigger Screen Capture
    if (url.pathname === '/api/capture' && req.method === 'POST') {
      if (typeof onCaptureHandler === 'function') {
        try {
          onCaptureHandler();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Screen capture dispatched on host' }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Capture handler not bound' }));
      }
      return;
    }

    // 4. Remote Custom Query (Enforced 64KB body limit)
    if (url.pathname === '/api/query' && req.method === 'POST') {
      let body = '';
      let bytesCount = 0;
      const MAX_QUERY_SIZE = 64 * 1024;
      let isAborted = false;

      req.on('data', chunk => {
        if (isAborted) return;
        bytesCount += chunk.length;
        if (bytesCount > MAX_QUERY_SIZE) {
          isAborted = true;
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Payload Too Large: Exceeded 64KB limit' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', () => {
        if (isAborted) return;
        try {
          const parsed = JSON.parse(body || '{}');
          if (typeof onQueryHandler === 'function') {
            onQueryHandler(parsed.prompt || '');
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // 5. Duo Mode: Remote Mentor Whisper Injection (Enforced 64KB body limit)
    if (url.pathname === '/api/mentor/whisper' && req.method === 'POST') {
      let body = '';
      let bytesCount = 0;
      const MAX_WHISPER_SIZE = 64 * 1024;
      let isAborted = false;

      req.on('data', chunk => {
        if (isAborted) return;
        bytesCount += chunk.length;
        if (bytesCount > MAX_WHISPER_SIZE) {
          isAborted = true;
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Payload Too Large: Exceeded 64KB limit' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', () => {
        if (isAborted) return;
        try {
          const parsed = JSON.parse(body || '{}');
          const whisper = (parsed.whisper || '').trim();
          const author = (parsed.author || 'Mentor').trim();

          if (!whisper) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Whisper text required' }));
            return;
          }

          if (typeof onMentorWhisperHandler === 'function') {
            onMentorWhisperHandler(whisper, author);
          }

          broadcastCompanionEvent('mentor_whisper', {
            whisper,
            author,
            timestamp: Date.now()
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // 6. Virtual Browser Extension Tab Audio Ingestion (Enforced 5MB chunk limit)
    if (url.pathname === '/api/tab-audio' && req.method === 'POST') {
      const isHeader = req.headers['x-chunk-index'] === '0' || req.headers['x-is-header'] === 'true';
      const chunkIndex = parseInt(req.headers['x-chunk-index'] || '0', 10);
      const chunks = [];
      let totalAudioBytes = 0;
      const MAX_AUDIO_CHUNK_SIZE = 5 * 1024 * 1024;
      let isAborted = false;

      req.on('data', chunk => {
        if (isAborted) return;
        totalAudioBytes += chunk.length;
        if (totalAudioBytes > MAX_AUDIO_CHUNK_SIZE) {
          isAborted = true;
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Payload Too Large: Audio chunk exceeded 5MB' }));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });

      req.on('end', () => {
        if (isAborted) return;
        try {
          const audioBuffer = Buffer.concat(chunks);
          if (audioBuffer.length > 0) {
            lastTabAudioTimestamp = Date.now();
            totalTabAudioBytes += audioBuffer.length;
            tabAudioPacketsCount++;

            // Cache initialization header for mid-stream mentor connections
            if (isWebMHeader(audioBuffer)) {
              cachedTabAudioHeader = audioBuffer;
            }

            // Broadcast audio chunk to all connected remote mentor audio listeners in real time
            if (mentorAudioSubscribers.size > 0) {
              for (const sub of mentorAudioSubscribers) {
                try {
                  // Backpressure Shield: discard stalled/slow clients if buffer exceeds 1MB (~20s of audio)
                  if (sub.writableLength > 1024 * 1024 || sub.destroyed) {
                    try { sub.end(); } catch (_) {}
                    mentorAudioSubscribers.delete(sub);
                    continue;
                  }
                  sub.write(audioBuffer);
                } catch (_) {
                  mentorAudioSubscribers.delete(sub);
                }
              }
            }

            // Periodic heartbeat event over SSE to notify portal of active tab audio stream
            if (tabAudioPacketsCount % 8 === 1) {
              broadcastCompanionEvent('tab_audio_state', {
                active: true,
                listenersCount: mentorAudioSubscribers.size,
                timestamp: lastTabAudioTimestamp
              });
            }

            if (typeof onTabAudioChunkHandler === 'function') {
              onTabAudioChunkHandler(audioBuffer, { isHeader, chunkIndex });
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          // needsHeader: GlanceAI (re)started mid-stream and cannot decode Meet audio until the extension restarts its recorder
          res.end(JSON.stringify({ success: true, bytes: audioBuffer.length, chunkIndex, needsHeader: !cachedTabAudioHeader }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    // 6.1 Duo Mode: Live Tab Audio Stream for Remote Mentors (HTTP chunked WebM Opus)
    if (url.pathname === '/api/mentor/audio-stream' && req.method === 'GET') {
      // Concurrency Shield: Cap max mentor audio listeners to 8 to prevent socket exhaustion
      if (mentorAudioSubscribers.size >= 8) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Too many concurrent mentor listeners (max 8)' }));
        return;
      }

      req.socket.setKeepAlive?.(true, 5000);
      req.socket.setNoDelay?.(true);

      res.writeHead(200, {
        'Content-Type': 'audio/webm; codecs=opus',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      });
      res.flushHeaders?.();

      // Immediately write the cached WebM header so browser media engine can decode subsequent audio chunks
      if (cachedTabAudioHeader) {
        try {
          res.write(cachedTabAudioHeader);
        } catch (_) {}
      }

      mentorAudioSubscribers.add(res);
      console.log(`[GlanceAI Companion] Mentor audio listener connected. Total listeners: ${mentorAudioSubscribers.size}`);

      req.on('close', () => {
        mentorAudioSubscribers.delete(res);
        console.log(`[GlanceAI Companion] Mentor audio listener disconnected. Total listeners: ${mentorAudioSubscribers.size}`);
      });
      return;
    }

    // 6.2 Duo Mode: Live Tab Audio Status & Health Diagnostics
    if (url.pathname === '/api/mentor/audio-status' && req.method === 'GET') {
      const now = Date.now();
      const isStreaming = (now - lastTabAudioTimestamp) < 3500 && lastTabAudioTimestamp > 0;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        isStreaming,
        listenersCount: mentorAudioSubscribers.size,
        hasHeader: !!cachedTabAudioHeader,
        lastTimestamp: lastTabAudioTimestamp,
        totalBytes: totalTabAudioBytes,
        packetsCount: tabAudioPacketsCount
      }));
      return;
    }

    // 7. Diagnostics Status (Protected by token)
    if (url.pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getCompanionInfo()));
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  isRunning = true;
  const host = isBoundToLan ? '0.0.0.0' : '127.0.0.1';
  serverInstance.listen(serverPort, host, () => {
    isRunning = true;
    const info = getCompanionInfo();
    console.log(`[GlanceAI Companion] Server listening on ${host}:${serverPort} (${isBoundToLan ? 'LAN Broadcast Active' : 'Localhost Only'})`);
    // Never print the token: terminal logs get copied and shared. The settings Copy buttons give the full link.
    console.log(`[GlanceAI Companion] Access URL: ${info.primaryUrl.replace(/token=[^&]+/, 'token=<hidden>')} (use Copy Mobile / Copy Mentor in settings for the full link)`);
  });

  serverInstance.on('error', (err) => {
    console.error('[GlanceAI Companion] Server error:', err);
    isRunning = false;
  });

  // Keep-alive heartbeat every 15s to keep mobile browser connections awake
  heartbeatTimer = setInterval(() => {
    if (isRunning && activeClients.size > 0) {
      for (const res of activeClients) {
        try {
          res.write(': heartbeat\n\n');
        } catch (_) {
          activeClients.delete(res);
        }
      }
    }
  }, 15000);

  return getCompanionInfo();
}

/**
 * Stops the LAN Companion Server
 */
function stopCompanionServer() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  for (const res of activeClients) {
    try {
      res.end();
    } catch (_) {}
  }
  activeClients.clear();

  for (const sub of mentorAudioSubscribers) {
    try {
      sub.end();
    } catch (_) {}
  }
  mentorAudioSubscribers.clear();
  cachedTabAudioHeader = null;
  lastTabAudioTimestamp = 0;
  totalTabAudioBytes = 0;
  tabAudioPacketsCount = 0;

  if (serverInstance) {
    serverInstance.close(() => {
      console.log('[GlanceAI Companion] Server stopped.');
    });
    serverInstance = null;
  }
  isRunning = false;
  return getCompanionInfo();
}

/**
 * Returns diagnostic metrics for the tab audio stream
 */
function getTabAudioStatus() {
  const now = Date.now();
  return {
    isStreaming: (now - lastTabAudioTimestamp) < 3500 && lastTabAudioTimestamp > 0,
    listenersCount: mentorAudioSubscribers.size,
    hasHeader: !!cachedTabAudioHeader,
    lastTimestamp: lastTabAudioTimestamp,
    totalBytes: totalTabAudioBytes,
    packetsCount: tabAudioPacketsCount
  };
}

module.exports = {
  startCompanionServer,
  stopCompanionServer,
  broadcastCompanionEvent,
  getLocalLanIps,
  getCompanionInfo,
  isAuthorizedHost,
  isAuthorizedRequest,
  getTabAudioStatus
};

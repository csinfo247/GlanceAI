#!/usr/bin/env node

/**
 * GlanceAI Duo Mode — Internet Mentor Tunnel CLI
 *
 * Automatically creates a secure HTTPS tunnel to your local GlanceAI instance (port 4242)
 * using ngrok (fastest & rock-solid on all ISPs) or Cloudflare Tunnel (zero-account fallback),
 * retrieves your active security token, formats the exact Duo Mentor URL, and copies it
 * directly to your clipboard.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = process.env.GLANCEAI_PORT || 4242;
const args = process.argv.slice(2);
const forceCloudflare = args.includes('--cf') || args.includes('--cloudflare');
const forceNgrok = args.includes('--ngrok');

function checkGlanceAI(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (_) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

/**
 * Reads the companion security token from GlanceAI's persisted config (Electron userData dir).
 * The token is intentionally NOT served over HTTP: tunnel traffic reaches the server from loopback.
 */
function readCompanionToken() {
  const appDataDir = process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library', 'Application Support')
    : process.platform === 'win32'
      ? (process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'))
      : (process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'));
  try {
    const config = JSON.parse(fs.readFileSync(path.join(appDataDir, 'glanceai', 'glanceai-config.json'), 'utf8'));
    return config.companionToken || '';
  } catch (_) {
    return '';
  }
}

function copyToClipboard(text) {
  try {
    if (process.platform === 'darwin') {
      execSync('pbcopy', { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    } else if (process.platform === 'win32') {
      execSync('clip', { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    } else {
      execSync('xclip -selection clipboard', { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    }
  } catch (_) {
    return false;
  }
}

function findBinary(name) {
  const candidates = [
    name,
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/bin/${name}`
  ];
  for (const bin of candidates) {
    try {
      execSync(`which ${bin}`, { stdio: 'ignore' });
      return bin;
    } catch (_) {}
  }
  return null;
}

async function main() {
  console.log('\n🔍 Checking GlanceAI instance on port ' + PORT + '...');
  const health = await checkGlanceAI(PORT);

  const token = readCompanionToken();
  if (health && health.status === 'ok') {
    console.log(`✅ GlanceAI is active on port ${PORT}!`);
  } else {
    console.log(`⚠️ GlanceAI is not running yet on port ${PORT}.`);
    console.log('   (Start GlanceAI in another terminal with "npm start" for live audio & teleprompter sync).');
  }
  if (!token) {
    console.log('⚠️ No companion token found in glanceai-config.json. Start GlanceAI once to generate it,');
    console.log('   otherwise the mentor link will be rejected with 401 Unauthorized.');
  }

  const ngrok = findBinary('ngrok');
  const cloudflared = findBinary('cloudflared');

  let tunnelProc = null;
  let provider = '';

  // ngrok is preferred by default on systems where it is installed/configured
  // because *.trycloudflare.com is often DNS-blocked or delayed by Indian ISPs (Airtel/Jio/ACT)
  if ((ngrok && !forceCloudflare) || forceNgrok) {
    provider = 'ngrok';
    try {
      execSync('pkill -f "ngrok http" 2>/dev/null || true');
    } catch (_) {}
    console.log('⚡ Starting ngrok tunnel (global ISP-friendly SSL)...');
    tunnelProc = spawn(ngrok, ['http', String(PORT), '--log=stdout', '--log-level=info'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } else if (cloudflared) {
    provider = 'Cloudflare Tunnel';
    console.log('⚡ Starting Cloudflare Tunnel...');
    tunnelProc = spawn(cloudflared, ['tunnel', '--url', `http://localhost:${PORT}`], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } else {
    console.error('\n❌ Neither ngrok nor cloudflared was found on your system.');
    console.log('Run: brew install cloudflared  OR  brew install ngrok');
    process.exit(1);
  }

  let capturedUrl = '';

  const parseOutput = (data) => {
    const text = data.toString();
    const cfMatch = text.match(/https:\/\/[a-zA-Z0-9.-]+\.trycloudflare\.com/);
    if (cfMatch && !capturedUrl) {
      capturedUrl = cfMatch[0];
      displayMentorLink(capturedUrl, token, provider);
    }
  };

  tunnelProc.stdout.on('data', parseOutput);
  tunnelProc.stderr.on('data', parseOutput);

  // For ngrok: poll local management API for rapid discovery
  if (provider === 'ngrok') {
    let attempts = 0;
    const pollNgrok = setInterval(() => {
      attempts++;
      http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            const httpsTunnel = parsed.tunnels?.find(t => t.proto === 'https');
            if (httpsTunnel && !capturedUrl) {
              capturedUrl = httpsTunnel.public_url;
              clearInterval(pollNgrok);
              displayMentorLink(capturedUrl, token, provider);
            }
          } catch (_) {}
        });
      }).on('error', () => {
        if (attempts > 30) clearInterval(pollNgrok);
      });
    }, 400);
  }

  tunnelProc.on('error', (err) => {
    console.error('❌ Failed to run tunnel:', err.message);
  });

  tunnelProc.on('exit', (code) => {
    console.log(`\n🛑 Tunnel exited (code ${code}).`);
    process.exit(code || 0);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down tunnel...');
    if (tunnelProc) tunnelProc.kill('SIGINT');
    process.exit(0);
  });
}

function displayMentorLink(publicUrl, token, provider) {
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  const mentorLink = `${publicUrl}/mentor${tokenQuery}`;

  const copied = copyToClipboard(mentorLink);

  console.log('\n' + '='.repeat(68));
  console.log(`🛡️   GlanceAI Duo Mode — Internet Mentor Portal (${provider})`);
  console.log('='.repeat(68));
  console.log(`\n🌐 Public Base URL:   ${publicUrl}`);
  console.log(`\n👉 MENTOR LINK (Send this directly to your mentor):`);
  console.log(`\n    \x1b[33m\x1b[1m${mentorLink}\x1b[0m\n`);
  if (copied) {
    console.log('📋 \x1b[32m\x1b[1mCOPIED TO CLIPBOARD!\x1b[0m Just press Cmd+V in WhatsApp / Discord / Slack.');
  }
  if (provider === 'ngrok') {
    console.log('\n💡 Mentor Note: When opening for the first time, click the blue');
    console.log('   "Visit Site" button on the ngrok confirmation page.');
  }
  console.log('\n💡 Real-time features active:');
  console.log('   • Live Audio Transcripts (turn-by-turn)');
  console.log('   • Live Teleprompter (AI answers stream in real time)');
  console.log('   • 1-Click Whisper Hints injected into your HUD');
  console.log('   • Remote Screen Snap preview');
  console.log('='.repeat(68));
  console.log('Press Ctrl+C to close the tunnel when your interview is finished.\n');
}

main();

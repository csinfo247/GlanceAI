/**
 * GlanceAI - Production-Grade macOS Developer Overlay Subsystem
 * Architecture: Electron Main Process & Subsystem Controller
 * Refactored for Zero Silent Failures, Retina Downscaling & Dynamic Multi-Monitor Layouts
 */

const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  desktopCapturer,
  screen,
  session,
  dialog,
  shell
} = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const Groq = require('groq-sdk');
const {
  startCompanionServer,
  stopCompanionServer,
  broadcastCompanionEvent,
  getCompanionInfo
} = require('./companion-server');
const {
  hasMeaningfulVisualChange,
  ModelCircuitBreaker,
  isCodingQuestion,
  sanitizeInterviewCode,
  extractProgressionTalkingPoints,
  extractGlanceAnchors
} = require('./lib/interview-engine');
const { buildSystemPrompt, buildTurn } = require('./lib/prompts');
const { DEFAULT_MODEL, resolveRequestModels, migrateSavedModels } = require('./lib/llm/models');
const { buildCandidates, openFirstAvailable, isAbortError } = require('./lib/llm/router');
const { computeNotchBounds, clampNotchHeight } = require('./lib/notch-geometry');

const globalCircuitBreaker = new ModelCircuitBreaker();

let mainWindow = null;
let isClickThrough = false;
let currentGroqAbortController = null;
let currentProxyUrl = '';
let currentProxyAgent = null;

const os = require('os');

// Config file path for persistent credentials and settings
const userDataDir = (app && typeof app.getPath === 'function')
  ? app.getPath('userData')
  : path.join(os.homedir(), process.platform === 'darwin' ? 'Library/Application Support/glanceai' : '.config/glanceai');
const configPath = path.join(userDataDir, 'glanceai-config.json');

function loadStoredConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return migrateSavedModels(JSON.parse(data));
    }
  } catch (err) {
    console.warn('[GlanceAI Main] Could not load stored config:', err);
  }
  return {};
}

function saveStoredConfig(newConfig) {
  try {
    const existing = loadStoredConfig();
    const updated = { ...existing, ...newConfig };
    writeConfigAtomically(JSON.stringify(updated, null, 2));
    return true;
  } catch (err) {
    console.error('[GlanceAI Main] Could not save config:', err);
    return false;
  }
}

/**
 * Writes the config to a temp file, fsyncs it, then renames it over the real one. A crash mid-write used to leave a
 * torn file, which loadStoredConfig() reads as {} and the next save persisted, wiping every API key and the companion
 * token. The file keeps its permissions (it holds API keys and is usually 0600).
 */
function writeConfigAtomically(contents) {
  const tmpPath = `${configPath}.tmp`;
  let mode = null;
  try { mode = fs.statSync(configPath).mode & 0o777; } catch (_) {}

  // A failure here leaves the real config untouched
  const fd = fs.openSync(tmpPath, 'w');
  try {
    if (mode !== null) fs.fchmodSync(fd, mode);
    fs.writeFileSync(fd, contents, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }

  try {
    fs.renameSync(tmpPath, configPath);
  } catch (err) {
    // Never worse than the old direct write (e.g. a Windows file lock blocking the rename)
    try { fs.unlinkSync(tmpPath); } catch (_) {}
    console.warn('[GlanceAI Main] Config rename failed, writing directly:', err.message);
    fs.writeFileSync(configPath, contents, 'utf8');
  }
}

// Resume Document & Candidate Intelligence Subsystem
let mammothMod = null;

async function getMammoth() {
  if (!mammothMod) {
    mammothMod = require('mammoth');
  }
  return mammothMod;
}

async function extractTextFromBuffer(buffer, ext) {
  const extension = (ext || '').toLowerCase().replace(/^\./, '');
  if (extension === 'pdf') {
    const pdfPkg = require('pdf-parse');
    // Dual compatibility: supports pdf-parse v1 (callable function) and v2 (PDFParse class)
    if (typeof pdfPkg === 'function') {
      const parsed = await pdfPkg(buffer);
      return (parsed && parsed.text ? parsed.text : '').trim();
    } else if (pdfPkg && (pdfPkg.PDFParse || typeof pdfPkg.default === 'function')) {
      const Parser = pdfPkg.PDFParse || pdfPkg.default;
      const parserInstance = new Parser({ data: buffer });
      try {
        const parsed = await parserInstance.getText();
        return (parsed && parsed.text ? parsed.text : '').trim();
      } finally {
        try { await parserInstance.destroy(); } catch (_) {}
      }
    } else {
      throw new Error('Unsupported pdf-parse module export format');
    }
  } else if (extension === 'docx') {
    const mammoth = await getMammoth();
    const result = await mammoth.convertToMarkdown({ buffer });
    return (result.value || '').trim();
  } else {
    return buffer.toString('utf8').trim();
  }
}

const COMMON_SKILLS = [
  'Python', 'C\\+\\+', 'C#', 'Java', 'Go', 'Golang', 'Rust', 'JavaScript', 'TypeScript', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'SQL', 'Bash', 'R', 'Dart', 'Solidity',
  'React', 'Next\\.js', 'Vue', 'Angular', 'Node\\.js', 'Express', 'Fastify', 'NestJS', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'gRPC', 'GraphQL', 'REST',
  'PostgreSQL', 'Postgres', 'MySQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'SQLite', 'ScyllaDB', 'ClickHouse', 'BigQuery', 'Snowflake',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'K8s', 'Terraform', 'Helm', 'CI/CD', 'GitHub Actions', 'Linux', 'Prometheus', 'Grafana', 'OpenTelemetry', 'Nginx',
  'Microservices', 'Distributed Systems', 'System Design', 'High Availability', 'Concurrency', 'Multithreading', 'Event-Driven', 'Caching', 'Load Balancing'
];

function extractResumeIntelligence(text) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  let candidateName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.includes('@') || line.includes('http') || line.includes('github') || line.includes('linkedin') || /^\+?\d/.test(line)) continue;
    if (line.length >= 3 && line.length <= 40 && /^[A-Z][a-zA-Z\s\.\-]+$/.test(line)) {
      candidateName = line;
      break;
    }
  }

  let candidateTitle = '';
  const titleRegex = /(senior|staff|principal|lead|junior|associate)?\s*(software|systems|backend|frontend|full[\s-]stack|cloud|devops|data|ml|ai|site\s*reliability|platform)\s*(engineer|developer|architect|lead|specialist)/i;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const m = lines[i].match(titleRegex);
    if (m) {
      candidateTitle = lines[i].length < 65 ? lines[i] : m[0];
      break;
    }
  }

  const matchedSkills = new Set();
  for (const skill of COMMON_SKILLS) {
    let rx;
    if (skill === 'C\\+\\+') {
      rx = /(?:^|\W)C\+\+(?=\W|$)/i;
    } else if (skill === 'C#') {
      rx = /(?:^|\W)C#(?=\W|$)/i;
    } else {
      rx = new RegExp(`\\b${skill}\\b`, 'i');
    }
    if (rx.test(text)) {
      let cleanSkill = skill.replace(/\\\+/g, '+').replace(/\\\./g, '.');
      if (cleanSkill.toLowerCase() === 'golang') cleanSkill = 'Go';
      if (cleanSkill.toLowerCase() === 'postgres') cleanSkill = 'PostgreSQL';
      if (cleanSkill.toLowerCase() === 'k8s') cleanSkill = 'Kubernetes';
      matchedSkills.add(cleanSkill);
    }
  }

  const metricsPatterns = [
    /\b(\d+(?:\.\d+)?\s*(?:k|m|b|\%|x|\+)?\s*(?:qps|rps|users|events|requests|transactions|ms|seconds|min|concurrent|uptime|reduction|increase|improvement))\b[^\n\.\;]{0,60}/gi,
    /\b(reduced|increased|improved|scaled|saved|optimized|accelerated|delivered)\b[^\n\.\;]{0,50}\b\d+(?:\.\d+)?(?:\%|x|\+|(?:k|m|b)?\s*(?:qps|rps|users|dollars|\$))?[^\n\.\;]{0,40}/gi
  ];
  const matchedMetrics = new Set();
  for (const pat of metricsPatterns) {
    let match;
    while ((match = pat.exec(text)) !== null) {
      const snippet = match[0].trim().replace(/^[\-\*\•\–\—\s]+/, '').replace(/\s+/g, ' ');
      if (snippet.length >= 10 && snippet.length <= 110) {
        matchedMetrics.add(snippet);
      }
      if (matchedMetrics.size >= 8) break;
    }
  }

  return {
    candidateName: candidateName || 'Candidate',
    candidateTitle: candidateTitle || 'Software Engineer',
    skills: Array.from(matchedSkills).slice(0, 25),
    metrics: Array.from(matchedMetrics).slice(0, 6)
  };
}

function extractJobDescriptionIntelligence(text) {
  if (!text || typeof text !== 'string') return null;

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  let roleTitle = '';
  const titlePrefixRegex = /(?:job\s*title|role|position|opening|title)\s*[:\-–]\s*([^\r\n]+)/i;
  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const m = lines[i].match(titlePrefixRegex);
    if (m && m[1] && m[1].trim().length >= 3 && m[1].trim().length <= 60) {
      roleTitle = m[1].trim();
      break;
    }
  }

  if (!roleTitle) {
    const commonTitleRegex = /(?:senior|staff|principal|lead|junior|associate|director)?\s*(?:software|systems|backend|frontend|full[\s-]stack|cloud|devops|data|ml|ai|site\s*reliability|platform|security|mobile|ios|android|qa)\s*(?:engineer|developer|architect|lead|specialist|manager)/i;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const m = lines[i].match(commonTitleRegex);
      if (m) {
        roleTitle = lines[i].length <= 65 ? lines[i] : m[0];
        break;
      }
    }
  }

  let companyName = '';
  const companyPrefixRegex = /(?:company|organization|at|about)\s*[:\-–]\s*([A-Za-z0-9\s\.\,\&]+)/i;
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const m = lines[i].match(companyPrefixRegex);
    if (m && m[1] && m[1].trim().length >= 2 && m[1].trim().length <= 40) {
      const cand = m[1].trim();
      if (!/requirements|qualifications|about us|overview|the role/i.test(cand)) {
        companyName = cand;
        break;
      }
    }
  }

  if (!companyName) {
    const aboutRegex = /(?:at|joining|welcome to)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?)[,\s]/;
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const m = lines[i].match(aboutRegex);
      if (m && m[1] && m[1].length >= 3 && m[1].length <= 30 && !/software|engineering|the|our|team/i.test(m[1])) {
        companyName = m[1].trim();
        break;
      }
    }
  }

  const matchedSkills = new Set();
  for (const skill of COMMON_SKILLS) {
    let rx;
    if (skill === 'C\\+\\+') {
      rx = /(?:^|\W)C\+\+(?=\W|$)/i;
    } else if (skill === 'C#') {
      rx = /(?:^|\W)C#(?=\W|$)/i;
    } else {
      rx = new RegExp(`\\b${skill}\\b`, 'i');
    }
    if (rx.test(text)) {
      let cleanSkill = skill.replace(/\\\+/g, '+').replace(/\\\./g, '.');
      if (cleanSkill.toLowerCase() === 'golang') cleanSkill = 'Go';
      if (cleanSkill.toLowerCase() === 'postgres') cleanSkill = 'PostgreSQL';
      if (cleanSkill.toLowerCase() === 'k8s') cleanSkill = 'Kubernetes';
      matchedSkills.add(cleanSkill);
    }
  }

  return {
    roleTitle: roleTitle || 'Target Engineering Role',
    companyName: companyName || '',
    skills: Array.from(matchedSkills).slice(0, 18),
    rawCharCount: text.length
  };
}

let HttpsProxyAgentClass = null;
let SocksProxyAgentClass = null;

/**
 * Lazily loads proxy agent modules via dynamic import (compatible with ESM-only packages)
 */
async function getProxyAgent(proxyUrl) {
  if (!proxyUrl || typeof proxyUrl !== 'string' || !proxyUrl.trim()) return null;
  const clean = proxyUrl.trim();
  try {
    if (clean.toLowerCase().startsWith('socks')) {
      if (!SocksProxyAgentClass) {
        const socksMod = await import('socks-proxy-agent');
        SocksProxyAgentClass = socksMod.SocksProxyAgent || socksMod.default;
      }
      return new SocksProxyAgentClass(clean);
    }
    if (!HttpsProxyAgentClass) {
      const httpsMod = await import('https-proxy-agent');
      HttpsProxyAgentClass = httpsMod.HttpsProxyAgent || httpsMod.default;
    }
    return new HttpsProxyAgentClass(clean);
  } catch (err) {
    console.error('[GlanceAI Main] Failed to construct Proxy Agent:', err);
    return null;
  }
}

/**
 * Applies Outbound Proxy configuration across Chromium Session, Node.js Environment & Groq SDK
 */
async function applyProxyConfig(proxyUrl) {
  currentProxyUrl = (proxyUrl || '').trim();
  currentProxyAgent = await getProxyAgent(currentProxyUrl);

  try {
    if (currentProxyUrl) {
      await session.defaultSession.setProxy({
        proxyRules: currentProxyUrl,
        proxyBypassRules: '<local>,localhost,127.0.0.1'
      });
      process.env.HTTP_PROXY = currentProxyUrl;
      process.env.HTTPS_PROXY = currentProxyUrl;
      process.env.ALL_PROXY = currentProxyUrl;
      console.log(`[GlanceAI Main] Outbound proxy configured: ${currentProxyUrl}`);
    } else {
      await session.defaultSession.setProxy({ mode: 'system' });
      delete process.env.HTTP_PROXY;
      delete process.env.HTTPS_PROXY;
      delete process.env.ALL_PROXY;
      console.log('[GlanceAI Main] Outbound proxy cleared (Direct/System).');
    }
  } catch (err) {
    console.warn('[GlanceAI Main] Failed to set Chromium proxy:', err);
  }
}

/**
 * Calculates window position dynamically against active display workArea
 * Prevents HUD from rendering off-screen on multi-monitor setups
 */
function getActiveDisplayBounds() {
  const cursorPoint = screen.getCursorScreenPoint();
  const activeDisplay = screen.getDisplayNearestPoint(cursorPoint) || screen.getPrimaryDisplay();
  const workArea = activeDisplay.workArea;

  const hudWidth = 520;
  const hudHeight = Math.min(940, workArea.height - 40);
  const posX = workArea.x + workArea.width - hudWidth - 24;
  const posY = workArea.y + 20;

  return { x: posX, y: posY, width: hudWidth, height: hudHeight, displayId: activeDisplay.id };
}

function createWindow() {
  const bounds = getActiveDisplayBounds();

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 320,
    minHeight: 40,
    frame: false,
    transparent: true,
    hasShadow: false,
    skipTaskbar: true, // Utility HUD overlay does not clutter OS dock or taskbar
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false // Keep audio and streaming responsive when unfocused
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 1. CRITICAL: Screen-Share Privacy Protection
  // Invisible to Zoom, Microsoft Teams, Google Meet, and native Screen Recording capture pipelines
  try {
    mainWindow.setContentProtection(true);
    console.log('[GlanceAI Main] Window content protection enabled (Screen-Share proof).');
  } catch (err) {
    console.warn('[GlanceAI Main] Failed to enable content protection:', err);
  }

  // 2. CRITICAL: Cross-Platform Window Level & Multi-Workspace Persistence
  // Ensures HUD floats above full-screen IDEs on macOS, Windows, and Linux
  try {
    if (process.platform === 'darwin') {
      mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    } else {
      mainWindow.setAlwaysOnTop(true, 'status');
    }
    console.log('[GlanceAI Main] Window level set to always-on-top.');
  } catch (err) {
    try { mainWindow.setAlwaysOnTop(true); } catch (_) {}
    console.warn('[GlanceAI Main] Window level fallback applied:', err);
  }

  // 3. Restore persisted window opacity (default: 0.95)
  try {
    const storedCfg = loadStoredConfig();
    const initialOpacity = typeof storedCfg.opacity === 'number' ? storedCfg.opacity : 0.95;
    mainWindow.setOpacity(initialOpacity);
  } catch (_) {}

  // Initial mouse events state
  mainWindow.setIgnoreMouseEvents(false);

  // Debug flag: Auto-open detached DevTools if DEBUG=true or --debug argument
  if (process.env.DEBUG === 'true' || process.argv.includes('--debug')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    console.log('[GlanceAI Main] Detached DevTools opened via DEBUG flag.');
  }

  // 4. Security Lockdown: Prevent window navigation & clickjacking
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      if (navigationUrl.startsWith('http:') || navigationUrl.startsWith('https:')) {
        shell.openExternal(navigationUrl);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  registerHotkeys();
}

/**
 * Adjust HUD window opacity dynamically with persistence and toast feedback
 */
function adjustOpacity(delta) {
  if (!mainWindow) return;
  let current = 0.95;
  try {
    const raw = mainWindow.getOpacity();
    if (typeof raw === 'number' && !isNaN(raw) && raw > 0) {
      current = raw;
    } else {
      const cfg = loadStoredConfig();
      if (typeof cfg.opacity === 'number' && !isNaN(cfg.opacity) && cfg.opacity > 0) {
        current = cfg.opacity;
      }
    }
  } catch (_) {}
  const next = Math.max(0.20, Math.min(1.0, Math.round((current + delta) * 100) / 100));
  try { mainWindow.setOpacity(next); } catch (_) {}
  saveStoredConfig({ opacity: next });
  mainWindow.webContents.send('opacity-changed', next);
  console.log(`[GlanceAI Main] Opacity adjusted to: ${next}`);
}

/**
 * Register macOS Global System Shortcuts
 */
function registerHotkeys() {
  globalShortcut.unregisterAll();

  // 1. Click-Through Toggle: Cmd+Alt+M and clash-free Cmd+Alt+J
  const clickThroughShortcuts = ['CommandOrControl+Alt+M', 'CommandOrControl+Alt+J'];
  clickThroughShortcuts.forEach((shortcut) => {
    const registered = globalShortcut.register(shortcut, () => {
      toggleClickThrough();
    });
    if (registered) {
      console.log(`[GlanceAI Main] Registered Click-Through shortcut: ${shortcut}`);
    }
  });

  // 2. Visibility Toggle: Cmd+Alt+H (uses showInactive to prevent stealing focus)
  const visibilityShortcut = 'CommandOrControl+Alt+H';
  const registeredH = globalShortcut.register(visibilityShortcut, () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      console.log('[GlanceAI Main] Window hidden.');
    } else {
      // Reposition dynamically onto current active display if cursor moved
      const bounds = getActiveDisplayBounds();
      mainWindow.setBounds({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
      // Use showInactive so showing HUD never steals focus from the editor
      mainWindow.showInactive();
      if (process.platform === 'darwin') {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      } else {
        mainWindow.setAlwaysOnTop(true, 'status');
      }
      console.log('[GlanceAI Main] Window restored without stealing editor focus (showInactive).');
    }
  });
  if (!registeredH) {
    console.error(`[GlanceAI Main] Failed to register global shortcut: ${visibilityShortcut}`);
  } else {
    console.log(`[GlanceAI Main] Registered shortcut: ${visibilityShortcut} (Visibility Toggle)`);
  }

  // 3. Screen Capture Engine: Cmd+Alt+C (CommandOrControl+Alt+C)
  const captureShortcut = 'CommandOrControl+Alt+C';
  const registeredC = globalShortcut.register(captureShortcut, async () => {
    console.log('[GlanceAI Main] Shortcut triggered: Screen Capture');
    await executeScreenCapture();
  });
  if (!registeredC) {
    console.error(`[GlanceAI Main] Failed to register global shortcut: ${captureShortcut}`);
  } else {
    console.log(`[GlanceAI Main] Registered shortcut: ${captureShortcut} (Screen Capture)`);
  }

  // 4. Opacity Controls: Cmd+Alt+[ (decrease opacity) and Cmd+Alt+] (increase opacity)
  globalShortcut.register('CommandOrControl+Alt+[', () => adjustOpacity(-0.1));
  globalShortcut.register('CommandOrControl+Alt+]', () => adjustOpacity(0.1));

  // 5. Emergency Force Solve Latest Audio: Cmd+Alt+S / Ctrl+Alt+S
  const forceSolveShortcut = 'CommandOrControl+Alt+S';
  const registeredS = globalShortcut.register(forceSolveShortcut, () => {
    console.log('[GlanceAI Main] Shortcut triggered: Force Solve Audio');
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('trigger-force-solve');
    }
  });
  if (registeredS) console.log(`[GlanceAI Main] Registered shortcut: ${forceSolveShortcut} (Force Solve)`);

  // 6. Emergency Panic Screen Clear / Abort: Cmd+Alt+X / Ctrl+Alt+X
  const panicShortcut = 'CommandOrControl+Alt+X';
  const registeredX = globalShortcut.register(panicShortcut, () => {
    console.log('[GlanceAI Main] Shortcut triggered: Panic Clear');
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('trigger-panic-clear');
    }
  });
  if (registeredX) console.log(`[GlanceAI Main] Registered shortcut: ${panicShortcut} (Panic Clear)`);

  // 7. Candidate Speaking Mute Toggle: Cmd+Alt+P / Ctrl+Alt+P
  const speakerToggleShortcut = 'CommandOrControl+Alt+P';
  const registeredP = globalShortcut.register(speakerToggleShortcut, () => {
    console.log('[GlanceAI Main] Shortcut triggered: Toggle Candidate Speaking');
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('toggle-candidate-speaking');
    }
  });
  if (registeredP) console.log(`[GlanceAI Main] Registered shortcut: ${speakerToggleShortcut} (Candidate Speaking Toggle)`);

  // 8. Instant Test-Case Debugger / Fixer: Cmd+Alt+D / Ctrl+Alt+D
  const debugShortcut = 'CommandOrControl+Alt+D';
  const registeredD = globalShortcut.register(debugShortcut, async () => {
    console.log('[GlanceAI Main] Shortcut triggered: Instant Test-Case Debugger (Cmd+Alt+D)');
    await executeScreenCapture(false, true);
  });
  if (registeredD) console.log(`[GlanceAI Main] Registered shortcut: ${debugShortcut} (Instant Debugger)`);

  // 9. Webcam Notch Mode Gaze-Lock Pill: Cmd+Alt+N / Ctrl+Alt+N
  const notchShortcut = 'CommandOrControl+Alt+N';
  const registeredN = globalShortcut.register(notchShortcut, () => {
    console.log('[GlanceAI Main] Shortcut triggered: Toggle Notch Mode (Cmd+Alt+N)');
    toggleNotchMode();
  });
  if (registeredN) console.log(`[GlanceAI Main] Registered shortcut: ${notchShortcut} (Notch Gaze-Lock)`);
}

/**
 * Click-Through State Machine with Cross-Platform Mouse Forwarding
 */
function toggleClickThrough() {
  if (!mainWindow) return;
  isClickThrough = !isClickThrough;

  // On macOS forward: true propagates mouse movement while letting clicks pass through.
  // On Windows/Linux setIgnoreMouseEvents directly toggles click-through.
  if (process.platform === 'darwin') {
    mainWindow.setIgnoreMouseEvents(isClickThrough, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(isClickThrough);
  }

  console.log(`[GlanceAI Main] Click-Through toggled: ${isClickThrough}`);
  mainWindow.webContents.send('click-through-changed', isClickThrough);
}

/**
 * Webcam Notch Mode Gaze-Lock State Machine
 * Shrinks the window to a compact pill directly below the camera lens (<2.5 deg offset); the renderer then
 * sizes its height to the answer it shows (set-notch-height)
 */
let isNotchMode = false;
let preNotchBounds = null;

function toggleNotchMode() {
  if (!mainWindow) return;
  isNotchMode = !isNotchMode;

  const currentBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayNearestPoint({
    x: currentBounds.x + Math.round(currentBounds.width / 2),
    y: currentBounds.y + 20
  }) || screen.getPrimaryDisplay();
  const workArea = currentDisplay.workArea || currentDisplay.bounds;

  if (isNotchMode) {
    preNotchBounds = currentBounds;
    const notchBounds = computeNotchBounds(workArea, currentDisplay.bounds, process.platform);

    mainWindow.setMinimumSize(300, 40);
    mainWindow.setBounds(notchBounds, true);
    mainWindow.webContents.send('notch-mode-changed', isNotchMode);
    console.log(`[GlanceAI Main] Notch Mode engaged directly below camera (y=${notchBounds.y}, w=${notchBounds.width}).`);
  } else {
    mainWindow.setMinimumSize(320, 40);
    if (preNotchBounds) {
      mainWindow.setBounds(preNotchBounds, true);
    } else {
      const defaultBounds = getActiveDisplayBounds();
      mainWindow.setBounds({ x: defaultBounds.x, y: defaultBounds.y, width: defaultBounds.width, height: defaultBounds.height }, true);
    }
    mainWindow.webContents.send('notch-mode-changed', isNotchMode);
    console.log('[GlanceAI Main] Notch Mode disengaged. Full HUD bounds restored.');
  }
}

/**
 * Screen Capture Engine with Native Downscaling & JPEG Compression
 * Prevents 413 Payload Too Large / Network Timeouts with Groq Vision
 */
async function executeScreenCapture(isAutoWatch = false, isDebugger = false) {
  if (!mainWindow) return { success: false, error: 'Window not initialized' };

  try {

    // Identify active display
    const cursorPoint = screen.getCursorScreenPoint();
    const activeDisplay = screen.getDisplayNearestPoint(cursorPoint) || screen.getPrimaryDisplay();

    // Query screen sources
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 2560, height: 1440 },
      fetchWindowIcons: false
    });

    if (!sources || sources.length === 0) {
      throw new Error(
        'No screen display sources available. Please ensure macOS Screen Recording permission is granted to GlanceAI in System Settings > Privacy & Security > Screen Recording.'
      );
    }

    // Match source to active display if available
    let targetSource = sources[0];
    if (sources.length > 1) {
      const matched = sources.find(s => s.display_id === String(activeDisplay.id));
      if (matched) targetSource = matched;
    }

    const thumbnail = targetSource.thumbnail;
    if (!thumbnail || thumbnail.isEmpty()) {
      throw new Error(
        'Captured thumbnail is empty. macOS Screen Recording permission may be missing or denied.'
      );
    }

    // DOWNSCALING & COMPRESSION:
    // Retina 2560x1440 PNGs are >12MB, crashing Groq payloads.
    // Downscale to max width 1600px with 80% JPEG compression (~200KB-400KB).
    const originalSize = thumbnail.getSize();
    let processedImage = thumbnail;
    const maxAllowedWidth = 1600;

    if (originalSize.width > maxAllowedWidth) {
      const targetHeight = Math.round((originalSize.height * maxAllowedWidth) / originalSize.width);
      processedImage = thumbnail.resize({
        width: maxAllowedWidth,
        height: targetHeight,
        quality: 'better'
      });
    }

    // Native JPEG conversion with 80% quality
    const jpegBuffer = processedImage.toJPEG(80);
    const base64Jpeg = jpegBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Jpeg}`;

    // Native Apple Vision OCR extraction if on macOS and binary exists.
    // Async: a sync call froze the main process (IPC, hotkeys, companion server, Meet audio relay) for ~0.6-1.5s.
    let ocrText = '';
    const ocrBinaryPath = path.join(__dirname, 'bin', 'macos_ocr');
    if (process.platform === 'darwin' && fs.existsSync(ocrBinaryPath)) {
      try {
        // Unique name: captures can now overlap (auto-watch tick + manual capture)
        const tmpImagePath = path.join(os.tmpdir(), `glanceai_ocr_${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`);
        fs.writeFileSync(tmpImagePath, jpegBuffer);
        try {
          const { stdout } = await execFileAsync(ocrBinaryPath, [tmpImagePath], {
            encoding: 'utf8',
            timeout: 4000,
            maxBuffer: 2 * 1024 * 1024
          });
          ocrText = stdout.trim();
        } finally {
          try { fs.unlinkSync(tmpImagePath); } catch (_) {}
        }
        if (ocrText) {
          console.log(`[GlanceAI Main] Native Apple Vision OCR extracted ${ocrText.split('\n').length} lines (${ocrText.length} chars).`);
        }
      } catch (ocrErr) {
        console.warn('[GlanceAI Main] Native OCR extraction note:', ocrErr.message);
      }
    }

    if (isDebugger) {
      mainWindow.webContents.send('trigger-instant-debug', {
        success: true,
        dataUrl,
        ocrText,
        sourceName: targetSource.name,
        timestamp: Date.now(),
        byteSize: jpegBuffer.length
      });
      return { success: true, dataUrl, ocrText, byteSize: jpegBuffer.length, jpegBuffer };
    }

    if (!isAutoWatch) {
      console.log(
        `[GlanceAI Main] Screen capture optimized: Original ${originalSize.width}x${originalSize.height}, Compressed JPEG: ${Math.round(jpegBuffer.length / 1024)} KB`
      );

      mainWindow.webContents.send('screen-captured', {
        success: true,
        dataUrl,
        ocrText,
        sourceName: targetSource.name,
        timestamp: Date.now(),
        byteSize: jpegBuffer.length
      });

      broadcastCompanionEvent('screenshot', { dataUrl, ocrText });
    }

    return { success: true, dataUrl, ocrText, byteSize: jpegBuffer.length, jpegBuffer };
  } catch (err) {
    console.error('[GlanceAI Main] Screen capture failure:', err);
    if (isDebugger) {
      mainWindow.webContents.send('trigger-instant-debug', {
        success: false,
        error: err.message || 'Screen capture failed for debugger.'
      });
    } else if (!isAutoWatch) {
      mainWindow.webContents.send('screen-captured', {
        success: false,
        error: err.message || 'Screen capture failed. Check macOS Screen Recording permissions.'
      });
    }
    return { success: false, error: err.message };
  }
}

/**
 * Autonomous Code Screen Watcher & Platform OCR Engine
 * Continuously samples the screen in the background and notifies renderer when visual changes / IDE tabs appear
 */
let autoWatchTimer = null;
let isAutoWatchActive = false;
let autoWatchIntervalMs = 5000;

let lastCapturedScreenBuffer = null;
let autoWatchTickInFlight = false;

// Uses robust hasMeaningfulVisualChange imported from lib/interview-engine.js

function startAutoScreenWatcher(intervalMs = 5000) {
  if (autoWatchTimer) clearInterval(autoWatchTimer);
  isAutoWatchActive = true;
  autoWatchIntervalMs = intervalMs;
  console.log(`[GlanceAI Main] Auto-Watch Screen Watcher started with interval ${autoWatchIntervalMs}ms`);

  autoWatchTimer = setInterval(async () => {
    if (!isAutoWatchActive || !mainWindow || mainWindow.isDestroyed()) return;
    // OCR is async now, so a slow tick could overlap the next one; skip instead (the old sync OCR serialized them)
    if (autoWatchTickInFlight) return;
    autoWatchTickInFlight = true;
    try {
      const res = await executeScreenCapture(true);
      if (res && res.success && res.jpegBuffer) {
        const hasVisualChange = hasMeaningfulVisualChange(lastCapturedScreenBuffer, res.jpegBuffer);
        lastCapturedScreenBuffer = res.jpegBuffer;

        mainWindow.webContents.send('auto-screen-watch-tick', {
          dataUrl: res.dataUrl,
          ocrText: res.ocrText || '',
          hasVisualChange,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.warn('[GlanceAI Main] Auto-watch tick error:', err);
    } finally {
      autoWatchTickInFlight = false;
    }
  }, autoWatchIntervalMs);

  return { active: true, intervalMs: autoWatchIntervalMs };
}

function stopAutoScreenWatcher() {
  if (autoWatchTimer) {
    clearInterval(autoWatchTimer);
    autoWatchTimer = null;
  }
  isAutoWatchActive = false;
  lastCapturedScreenBuffer = null;
  console.log('[GlanceAI Main] Auto-Watch Screen Watcher stopped');
  return { active: false };
}

let activeGenerationId = 0;

/**
 * Ultra-Low-Latency Groq LLM & Multimodal Vision Streaming Pipeline
 * Strict OpenAI-Compatible Payload Schema + Smart Fallback Retry
 * The renderer sends a structured `intent` ({ kind, ... }); all prompt text is built by lib/prompts.js.
 */
async function handleGroqStream(event, payload) {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    visionModel = DEFAULT_MODEL,
    responseMode = 'adaptive',
    codeLanguage = 'cpp',
    projectContext = '',
    jobDescriptionContext = '',
    intent = null,
    imageBase64 = null,
    conversationHistory = [],
    backupApiKey = ''
  } = payload;

  const storedConfig = loadStoredConfig();
  const rawBackup = backupApiKey || storedConfig.groqBackupApiKey || process.env.GROQ_BACKUP_API_KEY || '';

  // Extract all unique, valid API keys from primary and backup inputs (supports comma-delimited strings too)
  const allCandidateKeys = [
    ...(typeof apiKey === 'string' ? apiKey.split(',') : []),
    ...(typeof rawBackup === 'string' ? rawBackup.split(',') : [])
  ].map(k => k.trim()).filter(k => k.length >= 10);

  const apiKeyPool = [...new Set(allCandidateKeys)];

  if (apiKeyPool.length === 0) {
    event.sender.send('groq-stream-error', 'GROQ_API_KEY is missing. Please enter your API key in the top settings bar.');
    return;
  }

  // Single classification + prompt assembly for this request
  let turn;
  try {
    turn = buildTurn(intent, { responseMode, codeLanguage, conversationHistory, hasImage: !!imageBase64 });
  } catch (err) {
    event.sender.send('groq-stream-error', err.message);
    return;
  }

  const { textModel: sanitizedTextModel, visionModel: sanitizedVisionModel } = resolveRequestModels(model, visionModel);

  const generationId = ++activeGenerationId;

  // Abort any ongoing stream
  if (currentGroqAbortController) {
    try {
      currentGroqAbortController.abort();
    } catch (_) {}
  }
  const abortController = new AbortController();
  currentGroqAbortController = abortController;

  const resolvedJD = jobDescriptionContext || storedConfig.jobDescriptionContext || storedConfig.jobDescription?.extractedText || '';
  const finalSystemInstruction = buildSystemPrompt(responseMode, projectContext, codeLanguage, turn.contextQuestion, resolvedJD, {
    isCoding: turn.isCoding,
    isCandidateSpecific: turn.isCandidateSpecific
  });
  const combinedText = turn.userText;

  // Tell the renderer how this request was classified (question card, follow-up badge, history)
  event.sender.send('groq-stream-start', {
    kind: turn.kind,
    displayQuestion: turn.displayQuestion,
    isFollowUp: turn.isFollowUp,
    isCoding: turn.isCoding
  });

  // Construct Messages strictly to OpenAI-compatible schema
  let userContent = [];
  const isVision = Boolean(imageBase64);

  if (isVision) {
    let formattedUrl = imageBase64;
    if (!formattedUrl.startsWith('data:')) {
      formattedUrl = `data:image/jpeg;base64,${imageBase64}`;
    }

    userContent = [
      {
        type: 'text',
        text: combinedText
      },
      {
        type: 'image_url',
        image_url: {
          url: formattedUrl
        }
      }
    ];
  } else {
    userContent = combinedText;
  }

  // Shared by the Groq stream and the Gemini fallback (decided once in buildTurn)
  const maxCompletionTokens = turn.maxTokens;

  // Multi-Turn Conversation History (User Question + Assistant Answer - keep latest 2 turns to protect TPM token budget)
  const priorMessages = [];
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    const recentTurns = conversationHistory.slice(-2);
    for (const turn of recentTurns) {
      if (turn.question && (turn.solutionSummary || turn.solution)) {
        priorMessages.push({
          role: 'user',
          content: turn.question
        });
        priorMessages.push({
          role: 'assistant',
          content: turn.solutionSummary || turn.solution
        });
      }
    }
  }

  const messages = [
    {
      role: 'system',
      content: finalSystemInstruction
    },
    ...priorMessages,
    {
      role: 'user',
      content: userContent
    }
  ];

  const googleAiKey = storedConfig.googleAiKey || process.env.GOOGLE_AI_KEY || '';

  try {
    // Ordered (model × API key) candidates, plus Gemini as the last-resort vision fallback
    const candidates = buildCandidates({
      primaryModel: isVision ? sanitizedVisionModel : sanitizedTextModel,
      isVision,
      messages,
      maxTokens: maxCompletionTokens,
      signal: abortController.signal,
      groqKeys: apiKeyPool,
      googleAiKey,
      httpAgent: currentProxyAgent
    });
    const { stream, candidate } = await openFirstAvailable(candidates, {
      breaker: globalCircuitBreaker,
      signal: abortController.signal,
      exhaustedHint: isVision && !googleAiKey ? ' Tip: Add a Google AI key in settings for free Gemini 2.0 Flash vision fallback.' : ''
    });
    const actualModelUsed = candidate.modelUsed;

    if (generationId !== activeGenerationId || abortController.signal.aborted) return;

    broadcastCompanionEvent('groq_start', { kind: turn.kind, targetQuestionDisplay: turn.displayQuestion });

    const safeSend = (channel, ...args) => {
      if (event?.sender && !event.sender.isDestroyed()) {
        try {
          event.sender.send(channel, ...args);
        } catch (_) {}
      }
    };

    let fullText = '';
    for await (const delta of stream) {
      if (generationId !== activeGenerationId || abortController.signal.aborted || event.sender?.isDestroyed()) {
        console.log(`[GlanceAI Main] Breaking out of superseded/closed generation ${generationId}`);
        break;
      }
      fullText += delta;
      safeSend('groq-stream-chunk', delta);
      broadcastCompanionEvent('groq_chunk', { chunk: delta });
    }

    if (generationId === activeGenerationId && !event.sender?.isDestroyed()) {
      safeSend('groq-stream-end', {
        fullText,
        modelUsed: actualModelUsed
      });
      broadcastCompanionEvent('groq_done', {
        fullText,
        modelUsed: actualModelUsed
      });
      console.log(`[GlanceAI Main] LLM stream completed successfully using ${actualModelUsed}.`);
    }
  } catch (err) {
    if (generationId !== activeGenerationId || event.sender?.isDestroyed()) {
      return;
    }
    if (isAbortError(err, abortController.signal)) {
      console.log('[GlanceAI Main] Groq stream aborted by user.');
      if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send('groq-stream-aborted');
      }
      broadcastCompanionEvent('groq_aborted', {});
    } else {
      console.error('[GlanceAI Main] Groq streaming error:', err);
      if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send('groq-stream-error', err.message || 'Groq API request failed.');
      }
      broadcastCompanionEvent('groq_error', { error: err.message || 'Groq API request failed.' });
    }
  } finally {
    if (generationId === activeGenerationId) {
      currentGroqAbortController = null;
    }
  }
}

// Module scope (not inside the ipcMain block) because app.whenReady() also calls it
function createCompanionServerCallbacks() {
  return {
    onCapture: async () => {
      console.log('[GlanceAI Main] Companion triggered remote screen capture');
      await executeScreenCapture();
    },
    onQuery: (prompt) => {
      console.log('[GlanceAI Main] Companion triggered remote query:', prompt);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('companion-remote-query', prompt);
      }
    },
    onMentorWhisper: (whisper, author) => {
      console.log('[GlanceAI Main] Mentor Whisper received:', whisper);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mentor-whisper-received', {
          whisper,
          author: author || 'Mentor',
          timestamp: Date.now()
        });
      }
    },
    onTabAudioRejected: () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tab-audio-rejected');
      }
    },
    onTabAudioChunk: (buffer, meta = {}) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('tab-audio-chunk', {
          chunkBase64: buffer.toString('base64'),
          isHeader: !!meta.isHeader,
          chunkIndex: meta.chunkIndex || 0
        });
      }
    },
    getResumeStatus: () => loadStoredConfig().resume,
    getJDStatus: () => loadStoredConfig().jobDescription
  };
}

// IPC Handlers
if (ipcMain) {
  ipcMain.handle('toggle-notch-mode', () => {
    toggleNotchMode();
    return isNotchMode;
  });

  // Audio pipeline events from the renderer, so a pasted terminal log shows what Meet audio and the mic did
  ipcMain.on('renderer-log', (event, message) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) return;
    console.log(`[GlanceAI Audio] ${String(message).slice(0, 300)}`);
  });

  // The notch pill reports its content height; only the height changes, so a dragged pill stays put
  ipcMain.on('set-notch-height', (event, height) => {
    if (!mainWindow || !isNotchMode || event.sender !== mainWindow.webContents) return;
    const bounds = mainWindow.getBounds();
    const { workArea } = screen.getDisplayMatching(bounds);
    const nextHeight = clampNotchHeight(Number(height), workArea.height);
    if (Math.abs(bounds.height - nextHeight) < 2) return;
    mainWindow.setBounds({ ...bounds, height: nextHeight });
  });

ipcMain.handle('set-window-opacity', (event, opacity) => {
  if (mainWindow) {
    const num = parseFloat(opacity);
    const clamped = Math.max(0.15, Math.min(1.0, (isNaN(num) || num <= 0) ? 0.95 : num));
    try { mainWindow.setOpacity(clamped); } catch (_) {}
    saveStoredConfig({ opacity: clamped });
    mainWindow.webContents.send('opacity-changed', clamped);
    return clamped;
  }
  return 1.0;
});

ipcMain.handle('trigger-capture', async () => {
  return await executeScreenCapture();
});

ipcMain.handle('start-auto-watch', (event, intervalMs) => {
  return startAutoScreenWatcher(intervalMs || 5000);
});

ipcMain.handle('stop-auto-watch', () => {
  return stopAutoScreenWatcher();
});

ipcMain.handle('start-groq-stream', async (event, payload) => {
  return await handleGroqStream(event, payload);
});

ipcMain.handle('abort-groq-stream', () => {
  if (currentGroqAbortController) {
    currentGroqAbortController.abort();
    currentGroqAbortController = null;
    return true;
  }
  return false;
});

// Zero-Downtime Groq Whisper LPU Audio Transcription Fallback
ipcMain.handle('transcribe-audio-groq', async (event, { audioBase64, mimeType = 'audio/webm' }) => {
  try {
    const config = loadStoredConfig();
    const apiKey = config.groqApiKey || process.env.GROQ_API_KEY || config.groqBackupApiKey || process.env.GROQ_BACKUP_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'GROQ_API_KEY is missing. Please configure it in GlanceAI.' };
    }
    const groqOptions = { apiKey: apiKey.trim() };
    if (currentProxyAgent) {
      groqOptions.httpAgent = currentProxyAgent;
    }
    const groq = new Groq(groqOptions);

    const buffer = Buffer.from(audioBase64, 'base64');
    const ext = mimeType && mimeType.includes('wav') ? 'wav' : 'webm';
    const tempFile = path.join(app.getPath('temp'), `glanceai-audio-${Date.now()}.${ext}`);
    fs.writeFileSync(tempFile, buffer);

    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
        temperature: 0.0
      });
      return { success: true, text: transcription.text || '' };
    } finally {
      try { fs.unlinkSync(tempFile); } catch (_) {}
    }
  } catch (err) {
    console.error('[GlanceAI Main] Groq Whisper transcription error:', err);
    return { success: false, error: err.message || 'Groq Whisper transcription failed' };
  }
});

ipcMain.handle('load-config', () => {
  return loadStoredConfig();
});

ipcMain.handle('save-config', (event, config) => {
  return saveStoredConfig(config);
});

// Resume Document & Intelligence IPC Handlers
ipcMain.handle('select-and-parse-resume', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Resume Document',
      buttonLabel: 'Upload Resume',
      filters: [
        { name: 'Resume Documents', extensions: ['pdf', 'docx', 'txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);
    const stat = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    const extractedText = await extractTextFromBuffer(buffer, ext);
    if (!extractedText || extractedText.trim().length === 0) {
      return { success: false, error: 'No readable text could be extracted from this document.' };
    }

    const intelligence = extractResumeIntelligence(extractedText);
    const resumePayload = {
      fileName,
      fileSize: stat.size,
      fileExt: ext.replace(/^\./, '').toUpperCase(),
      extractedText,
      intelligence,
      updatedAt: new Date().toISOString()
    };

    saveStoredConfig({ resume: resumePayload, projectContext: extractedText });

    broadcastCompanionEvent('resume_status', {
      loaded: true,
      fileName,
      title: intelligence?.candidateTitle || 'Candidate',
      skillsCount: intelligence?.skills?.length || 0
    });

    return {
      success: true,
      ...resumePayload
    };
  } catch (err) {
    console.error('[GlanceAI Main] Failed to select and parse resume:', err);
    return { success: false, error: err.message || 'Failed to parse resume document' };
  }
});

ipcMain.handle('parse-resume-buffer', async (event, { bufferBase64, fileName, mimeType }) => {
  try {
    if (!bufferBase64) return { success: false, error: 'No buffer data provided' };
    const buffer = Buffer.from(bufferBase64, 'base64');
    const ext = path.extname(fileName || '') || (mimeType === 'application/pdf' ? '.pdf' : '.txt');
    const extractedText = await extractTextFromBuffer(buffer, ext);

    if (!extractedText || extractedText.trim().length === 0) {
      return { success: false, error: 'No readable text could be extracted from this document.' };
    }

    const intelligence = extractResumeIntelligence(extractedText);
    const resumePayload = {
      fileName: fileName || ('Uploaded_Resume' + ext),
      fileSize: buffer.length,
      fileExt: ext.replace(/^\./, '').toUpperCase(),
      extractedText,
      intelligence,
      updatedAt: new Date().toISOString()
    };

    saveStoredConfig({ resume: resumePayload, projectContext: extractedText });

    broadcastCompanionEvent('resume_status', {
      loaded: true,
      fileName: resumePayload.fileName,
      title: intelligence?.candidateTitle || 'Candidate',
      skillsCount: intelligence?.skills?.length || 0
    });

    return {
      success: true,
      ...resumePayload
    };
  } catch (err) {
    console.error('[GlanceAI Main] Failed to parse resume buffer:', err);
    return { success: false, error: err.message || 'Failed to parse resume buffer' };
  }
});

ipcMain.handle('delete-resume', async () => {
  try {
    saveStoredConfig({ resume: null });
    broadcastCompanionEvent('resume_status', { loaded: false });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Job Description (JD) & Target Role IPC Handlers
ipcMain.handle('select-and-parse-jd', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Job Description Document',
      buttonLabel: 'Upload JD',
      filters: [
        { name: 'Job Description Documents', extensions: ['pdf', 'docx', 'txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);
    const stat = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    const extractedText = await extractTextFromBuffer(buffer, ext);
    if (!extractedText || extractedText.trim().length === 0) {
      return { success: false, error: 'No readable text could be extracted from this JD document.' };
    }

    const intelligence = extractJobDescriptionIntelligence(extractedText);
    const jdPayload = {
      fileName,
      fileSize: stat.size,
      fileExt: ext.replace(/^\./, '').toUpperCase(),
      extractedText,
      intelligence,
      updatedAt: new Date().toISOString()
    };

    saveStoredConfig({ jobDescription: jdPayload, jobDescriptionContext: extractedText });

    broadcastCompanionEvent('jd_status', {
      loaded: true,
      fileName,
      roleTitle: intelligence?.roleTitle || 'Target Role',
      company: intelligence?.companyName || ''
    });

    return {
      success: true,
      ...jdPayload
    };
  } catch (err) {
    console.error('[GlanceAI Main] Failed to select and parse JD:', err);
    return { success: false, error: err.message || 'Failed to parse JD document' };
  }
});

ipcMain.handle('parse-jd-buffer', async (event, { bufferBase64, fileName, mimeType }) => {
  try {
    if (!bufferBase64) return { success: false, error: 'No buffer data provided' };
    const buffer = Buffer.from(bufferBase64, 'base64');
    const ext = path.extname(fileName || '') || (mimeType === 'application/pdf' ? '.pdf' : '.txt');
    const extractedText = await extractTextFromBuffer(buffer, ext);

    if (!extractedText || extractedText.trim().length === 0) {
      return { success: false, error: 'No readable text could be extracted from this JD document.' };
    }

    const intelligence = extractJobDescriptionIntelligence(extractedText);
    const jdPayload = {
      fileName: fileName || ('Target_Job_Description' + ext),
      fileSize: buffer.length,
      fileExt: ext.replace(/^\./, '').toUpperCase(),
      extractedText,
      intelligence,
      updatedAt: new Date().toISOString()
    };

    saveStoredConfig({ jobDescription: jdPayload, jobDescriptionContext: extractedText });

    broadcastCompanionEvent('jd_status', {
      loaded: true,
      fileName: jdPayload.fileName,
      roleTitle: intelligence?.roleTitle || 'Target Role',
      company: intelligence?.companyName || ''
    });

    return {
      success: true,
      ...jdPayload
    };
  } catch (err) {
    console.error('[GlanceAI Main] Failed to parse JD buffer:', err);
    return { success: false, error: err.message || 'Failed to parse JD buffer' };
  }
});

ipcMain.handle('save-jd-text', async (event, { text, fileName }) => {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      saveStoredConfig({ jobDescription: null, jobDescriptionContext: '' });
      broadcastCompanionEvent('jd_status', { loaded: false });
      return { success: true, cleared: true };
    }

    const cleanText = text.trim();
    const intelligence = extractJobDescriptionIntelligence(cleanText);
    const jdPayload = {
      fileName: fileName || 'Pasted_Job_Description.txt',
      fileSize: Buffer.byteLength(cleanText, 'utf8'),
      fileExt: 'TXT',
      extractedText: cleanText,
      intelligence,
      updatedAt: new Date().toISOString()
    };

    saveStoredConfig({ jobDescription: jdPayload, jobDescriptionContext: cleanText });

    broadcastCompanionEvent('jd_status', {
      loaded: true,
      fileName: jdPayload.fileName,
      roleTitle: intelligence?.roleTitle || 'Target Role',
      company: intelligence?.companyName || ''
    });

    return {
      success: true,
      ...jdPayload
    };
  } catch (err) {
    console.error('[GlanceAI Main] Failed to save JD text:', err);
    return { success: false, error: err.message || 'Failed to save JD text' };
  }
});

ipcMain.handle('delete-jd', async () => {
  try {
    saveStoredConfig({ jobDescription: null, jobDescriptionContext: '' });
    broadcastCompanionEvent('jd_status', { loaded: false });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Network Proxy & LAN Companion IPC Handlers
ipcMain.handle('set-proxy-config', async (event, proxyUrl) => {
  await applyProxyConfig(proxyUrl);
  saveStoredConfig({ proxyUrl: currentProxyUrl });
  return currentProxyUrl;
});

ipcMain.handle('get-lan-companion-info', () => {
  return getCompanionInfo();
});

ipcMain.handle('toggle-lan-companion', async (event, enabled, port, bindLan) => {
  const cfg = loadStoredConfig();
  if (enabled) {
    stopCompanionServer();
    const info = startCompanionServer({
      port: port || cfg.lanCompanionPort || 4242,
      bindLan: bindLan !== undefined ? bindLan : !!cfg.lanCompanionBindLan,
      token: cfg.companionToken || undefined,
      ...createCompanionServerCallbacks()
    });
    saveStoredConfig({ lanCompanionEnabled: true, lanCompanionPort: port || 4242 });
    return info;
  } else {
    const info = stopCompanionServer();
    saveStoredConfig({ lanCompanionEnabled: false });
    return info;
  }
});

ipcMain.on('broadcast-transcript-to-companion', (event, text) => {
  broadcastCompanionEvent('transcript', { text });
});

ipcMain.handle('minimize-app', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('close-app', () => {
    app.quit();
  });
}

// App Lifecycle
if (app && typeof app.whenReady === 'function') {
  app.whenReady().then(async () => {
    const config = loadStoredConfig();
    if (config.proxyUrl) {
      await applyProxyConfig(config.proxyUrl);
    }

    createWindow();

    // Start companion server by default (binds to localhost only unless LAN is explicitly enabled)
    if (config.lanCompanionEnabled !== false) {
      let companionToken = config.companionToken;
      if (!companionToken) {
        const crypto = require('crypto');
        companionToken = crypto.randomBytes(16).toString('hex');
        saveStoredConfig({ companionToken });
      }
      startCompanionServer({
        port: config.lanCompanionPort || 4242,
        bindLan: !!config.lanCompanionBindLan,
        token: companionToken,
        ...createCompanionServerCallbacks()
      });
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    stopCompanionServer();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildSystemPrompt,
    isCodingQuestion,
    extractResumeIntelligence,
    extractJobDescriptionIntelligence,
    extractTextFromBuffer,
    loadStoredConfig,
    saveStoredConfig,
    sanitizeInterviewCode,
    extractProgressionTalkingPoints,
    extractGlanceAnchors
  };
}

/**
 * GlanceAI - Preload Bridge
 * Context Isolation & Secure IPC Interface
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('glanceaiAPI', {
  // OS & Window Subsystem
  getPlatform: () => process.platform,
  setOpacity: (opacity) => ipcRenderer.invoke('set-window-opacity', opacity),
  triggerCapture: () => ipcRenderer.invoke('trigger-capture'),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  toggleNotchMode: () => ipcRenderer.invoke('toggle-notch-mode'),
  setNotchHeight: (height) => ipcRenderer.send('set-notch-height', height),
  logToTerminal: (message) => ipcRenderer.send('renderer-log', String(message).slice(0, 300)),

  // Interview Code Sanitization & Talking Points
  sanitizeCode: (code, lang) => {
    try {
      const { sanitizeInterviewCode } = require('./lib/interview-engine');
      return sanitizeInterviewCode(code, lang);
    } catch (_) {
      return code;
    }
  },
  extractGlanceAnchors: (text) => {
    try {
      const { extractGlanceAnchors } = require('./lib/interview-engine');
      return extractGlanceAnchors(text);
    } catch (_) {
      return [];
    }
  },

  // Config Persistence
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  // Resume Document & Candidate Intelligence Pipeline
  selectAndParseResume: () => ipcRenderer.invoke('select-and-parse-resume'),
  parseResumeBuffer: (payload) => ipcRenderer.invoke('parse-resume-buffer', payload),
  deleteResume: () => ipcRenderer.invoke('delete-resume'),

  // Job Description (JD) & Target Role Pipeline
  selectAndParseJD: () => ipcRenderer.invoke('select-and-parse-jd'),
  parseJDBuffer: (payload) => ipcRenderer.invoke('parse-jd-buffer', payload),
  saveJDText: (payload) => ipcRenderer.invoke('save-jd-text', payload),
  deleteJD: () => ipcRenderer.invoke('delete-jd'),

  // Network Proxy & LAN Companion
  setProxy: (proxyUrl) => ipcRenderer.invoke('set-proxy-config', proxyUrl),
  getLanCompanionInfo: () => ipcRenderer.invoke('get-lan-companion-info'),
  toggleLanCompanion: (enabled, port, bindLan) => ipcRenderer.invoke('toggle-lan-companion', enabled, port, bindLan),
  broadcastTranscriptToCompanion: (text) => ipcRenderer.send('broadcast-transcript-to-companion', text),

  // Groq LLM & Multimodal Vision Streaming
  startGroqStream: (payload) => ipcRenderer.invoke('start-groq-stream', payload),
  abortGroqStream: () => ipcRenderer.invoke('abort-groq-stream'),
  transcribeAudioGroq: (payload) => ipcRenderer.invoke('transcribe-audio-groq', payload),

  // Event Listeners
  onScreenCaptured: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('screen-captured', handler);
    return () => ipcRenderer.removeListener('screen-captured', handler);
  },
  onClickThroughChanged: (callback) => {
    const handler = (event, isEnabled) => callback(isEnabled);
    ipcRenderer.on('click-through-changed', handler);
    return () => ipcRenderer.removeListener('click-through-changed', handler);
  },
  onOpacityChanged: (callback) => {
    const handler = (event, opacity) => callback(opacity);
    ipcRenderer.on('opacity-changed', handler);
    return () => ipcRenderer.removeListener('opacity-changed', handler);
  },
  onGroqStart: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('groq-stream-start', handler);
    return () => ipcRenderer.removeListener('groq-stream-start', handler);
  },
  onGroqChunk: (callback) => {
    const handler = (event, chunk) => callback(chunk);
    ipcRenderer.on('groq-stream-chunk', handler);
    return () => ipcRenderer.removeListener('groq-stream-chunk', handler);
  },
  onGroqEnd: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('groq-stream-end', handler);
    return () => ipcRenderer.removeListener('groq-stream-end', handler);
  },
  onGroqError: (callback) => {
    const handler = (event, error) => callback(error);
    ipcRenderer.on('groq-stream-error', handler);
    return () => ipcRenderer.removeListener('groq-stream-error', handler);
  },
  onGroqAborted: (callback) => {
    const handler = (event) => callback();
    ipcRenderer.on('groq-stream-aborted', handler);
    return () => ipcRenderer.removeListener('groq-stream-aborted', handler);
  },
  onCompanionRemoteQuery: (callback) => {
    const handler = (event, prompt) => callback(prompt);
    ipcRenderer.on('companion-remote-query', handler);
    return () => ipcRenderer.removeListener('companion-remote-query', handler);
  },
  onTriggerForceSolve: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('trigger-force-solve', handler);
    return () => ipcRenderer.removeListener('trigger-force-solve', handler);
  },
  onTriggerPanicClear: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('trigger-panic-clear', handler);
    return () => ipcRenderer.removeListener('trigger-panic-clear', handler);
  },
  onToggleCandidateSpeaking: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('toggle-candidate-speaking', handler);
    return () => ipcRenderer.removeListener('toggle-candidate-speaking', handler);
  },
  onNotchModeChanged: (callback) => {
    const handler = (event, isNotch) => callback(isNotch);
    ipcRenderer.on('notch-mode-changed', handler);
    return () => ipcRenderer.removeListener('notch-mode-changed', handler);
  },
  onTriggerInstantDebug: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('trigger-instant-debug', handler);
    return () => ipcRenderer.removeListener('trigger-instant-debug', handler);
  },

  // Autonomous Code Screen Watcher & Platform OCR
  startAutoWatch: (intervalMs) => ipcRenderer.invoke('start-auto-watch', intervalMs),
  stopAutoWatch: () => ipcRenderer.invoke('stop-auto-watch'),
  onAutoScreenWatchTick: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('auto-screen-watch-tick', handler);
    return () => ipcRenderer.removeListener('auto-screen-watch-tick', handler);
  },

  // Duo Mode Remote Mentor Whispers
  onMentorWhisper: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('mentor-whisper-received', handler);
    return () => ipcRenderer.removeListener('mentor-whisper-received', handler);
  },

  // Virtual Tab Audio Bridge
  onTabAudioChunk: (callback) => {
    const handler = (event, payload) => {
      if (typeof payload === 'string') {
        callback(payload, { isHeader: false, chunkIndex: -1 });
      } else if (payload && payload.chunkBase64) {
        callback(payload.chunkBase64, payload);
      }
    };
    ipcRenderer.on('tab-audio-chunk', handler);
    return () => ipcRenderer.removeListener('tab-audio-chunk', handler);
  },
  onTabAudioRejected: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('tab-audio-rejected', handler);
    return () => ipcRenderer.removeListener('tab-audio-rejected', handler);
  }
});

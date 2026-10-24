/**
 * GlanceAI - Production-Grade Renderer Subsystem
 * Dual-Channel CoreAudio Routing, Lifecycle-Safe Deepgram WebSocket & Groq Vision Inference
 * Refactored for Zero-Crash Resilience, LocalStorage Persistence & macOS Permission Defense
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements - Titlebar & Badges
  const systemStatusDot = document.getElementById('system-status-dot');
  const badgePassthrough = document.getElementById('badge-passthrough');
  const badgeModel = document.getElementById('badge-model');
  const passthroughToast = document.getElementById('passthrough-toast');

  // Titlebar Action Buttons
  const btnToggleConfig = document.getElementById('btn-toggle-config');
  const btnManualCapture = document.getElementById('btn-manual-capture');
  const btnMinimizeWindow = document.getElementById('btn-minimize-window');
  const btnCloseWindow = document.getElementById('btn-close-window');

  // Config Pane Elements
  const paneConfig = document.getElementById('pane-config');
  const audioDeviceSelect = document.getElementById('audio-device-select');
  const audioPipelineBadge = document.getElementById('audio-pipeline-badge');
  const tabAudioBadge = document.getElementById('tab-audio-badge');
  const btnRequestAudioPerm = document.getElementById('btn-request-audio-perm');
  const loopbackGuideHint = document.getElementById('loopback-guide-hint');
  const btnToggleAudio = document.getElementById('btn-toggle-audio');
  const btnAudioText = document.getElementById('btn-audio-text');
  const btnClearTranscript = document.getElementById('btn-clear-transcript');

  const inputGroqKey = document.getElementById('input-groq-key');
  const btnSaveGroqKey = document.getElementById('btn-save-groq-key');
  const groqKeyStatus = document.getElementById('groq-key-status');

  const inputGroqBackupKey = document.getElementById('input-groq-backup-key');
  const btnSaveGroqBackupKey = document.getElementById('btn-save-groq-backup-key');
  const groqBackupKeyStatus = document.getElementById('groq-backup-key-status');

  const inputDeepgramKey = document.getElementById('input-deepgram-key');
  const btnSaveDeepgramKey = document.getElementById('btn-save-deepgram-key');
  const deepgramKeyStatus = document.getElementById('deepgram-key-status');

  const inputGoogleAiKey = document.getElementById('input-google-ai-key');
  const btnSaveGoogleAiKey = document.getElementById('btn-save-google-ai-key');
  const googleAiKeyStatus = document.getElementById('google-ai-key-status');

  const selectTextModel = document.getElementById('select-text-model');
  const selectVisionModel = document.getElementById('select-vision-model');
  const selectCodeLanguage = document.getElementById('select-code-language');

  const selectResponseMode = document.getElementById('select-response-mode');
  const modeStatusBadge = document.getElementById('mode-status-badge');
  const inputProjectContext = document.getElementById('input-project-context');
  const projectContextStatus = document.getElementById('project-context-status');
  const contextCharCount = document.getElementById('context-char-count');
  const btnSaveProjectContext = document.getElementById('btn-save-project-context');

  // Resume & Candidate Grounding Elements
  const resumeDropzone = document.getElementById('resume-dropzone');
  const resumeFileInput = document.getElementById('resume-file-input');
  const btnBrowseResume = document.getElementById('btn-browse-resume');
  const resumeStatusBadge = document.getElementById('resume-status-badge');
  const resumeProfileCard = document.getElementById('resume-profile-card');
  const resumeFileBadge = document.getElementById('resume-file-badge');
  const resumeFilename = document.getElementById('resume-filename');
  const resumeFilesize = document.getElementById('resume-filesize');
  const resumeCandidateTitle = document.getElementById('resume-candidate-title');
  const resumeHeadlineRow = document.getElementById('resume-headline-row');
  const resumeSkillChips = document.getElementById('resume-skill-chips');
  const resumeSkillsRow = document.getElementById('resume-skills-row');
  const resumeMetricsCount = document.getElementById('resume-metrics-count');
  const resumeMetricsRow = document.getElementById('resume-metrics-row');
  const resumeEditorWrap = document.getElementById('resume-editor-wrap');
  const btnToggleResumeEditor = document.getElementById('btn-toggle-resume-editor');
  const btnReplaceResume = document.getElementById('btn-replace-resume');
  const btnDeleteResume = document.getElementById('btn-delete-resume');
  const btnResumePitch = document.getElementById('btn-resume-pitch');

  // Job Description (JD) & Target Role Grounding Elements
  const jdDropzone = document.getElementById('jd-dropzone');
  const jdFileInput = document.getElementById('jd-file-input');
  const btnBrowseJD = document.getElementById('btn-browse-jd');
  const jdStatusBadge = document.getElementById('jd-status-badge');
  const jdProfileCard = document.getElementById('jd-profile-card');
  const jdFileBadge = document.getElementById('jd-file-badge');
  const jdFilename = document.getElementById('jd-filename');
  const jdFilesize = document.getElementById('jd-filesize');
  const jdRoleTitle = document.getElementById('jd-role-title');
  const jdTitleRow = document.getElementById('jd-title-row');
  const jdCompanyName = document.getElementById('jd-company-name');
  const jdCompanyRow = document.getElementById('jd-company-row');
  const jdSkillChips = document.getElementById('jd-skill-chips');
  const jdSkillsRow = document.getElementById('jd-skills-row');
  const jdEditorWrap = document.getElementById('jd-editor-wrap');
  const btnToggleJdEditor = document.getElementById('btn-toggle-jd-editor');
  const btnReplaceJD = document.getElementById('btn-replace-jd');
  const btnDeleteJD = document.getElementById('btn-delete-jd');
  const btnJdPitch = document.getElementById('btn-jd-pitch');
  const inputJdContext = document.getElementById('input-jd-context');
  const jdContextStatus = document.getElementById('jd-context-status');
  const jdCharCount = document.getElementById('jd-char-count');
  const btnSaveJdContext = document.getElementById('btn-save-jd-context');

  // Quick Action Grounding Chips
  const chipResumePitch = document.getElementById('chip-resume-pitch');
  const chipStarStories = document.getElementById('chip-star-stories');
  const chipStackDefense = document.getElementById('chip-stack-defense');
  const chipWhyThisRole = document.getElementById('chip-why-this-role');

  const inputOpacitySlider = document.getElementById('input-opacity-slider');
  const opacityValBadge = document.getElementById('opacity-val-badge');

  const inputProxyUrl = document.getElementById('input-proxy-url');
  const btnSaveProxy = document.getElementById('btn-save-proxy');
  const proxyStatusBadge = document.getElementById('proxy-status-badge');
  const companionStatusBadge = document.getElementById('companion-status-badge');
  const companionPrimaryUrl = document.getElementById('companion-primary-url');
  const btnCopyCompanionUrl = document.getElementById('btn-copy-companion-url');
  const companionClientsCount = document.getElementById('companion-clients-count');

  const btnToggleAutopilot = document.getElementById('btn-toggle-autopilot');
  const autopilotLabel = document.getElementById('autopilot-label');
  const btnSpeakerMode = document.getElementById('btn-speaker-mode');
  const speakerModeText = document.getElementById('speaker-mode-text');
  const btnForceSolve = document.getElementById('btn-force-solve');
  const btnToggleAutowatch = document.getElementById('btn-toggle-autowatch');
  const autowatchLabel = document.getElementById('autowatch-label');

  // Transcript Pane Elements
  const transcriptLog = document.getElementById('transcript-log');
  const transcriptEmptyState = document.getElementById('transcript-empty-state');
  const transcriptPulse = document.getElementById('transcript-listening-pulse');
  const currentChannelLabel = document.getElementById('current-channel-label');
  const btnSendTranscriptToGroq = document.getElementById('btn-send-transcript-to-groq');
  const btnNewTranscriptTurn = document.getElementById('btn-new-transcript-turn');
  const transcriptWordCount = document.getElementById('transcript-word-count');
  const paneTranscript = document.getElementById('pane-transcript');
  const transcriptLastHeard = document.getElementById('transcript-last-heard');
  const btnToggleTranscript = document.getElementById('btn-toggle-transcript');

  // Solution Pane Elements
  const btnCopySolution = document.getElementById('btn-copy-solution');
  const btnClearSolution = document.getElementById('btn-clear-solution');
  const screenshotPreviewPill = document.getElementById('screenshot-preview-pill');
  const screenshotThumbnailImg = document.getElementById('screenshot-thumbnail-img');
  const inputCustomQuery = document.getElementById('input-custom-query');
  const btnRunQuery = document.getElementById('btn-run-query');
  const solutionRenderBox = document.getElementById('solution-render-box');
  const solutionEmptyState = document.getElementById('solution-empty-state');
  const mentorWhisperCard = document.getElementById('mentor-whisper-card');
  const whisperAuthor = document.getElementById('whisper-author');
  const whisperText = document.getElementById('whisper-text');
  const btnDismissWhisper = document.getElementById('btn-dismiss-whisper');
  const btnCopyMentorUrl = document.getElementById('btn-copy-mentor-url');
  const activeQuestionCard = document.getElementById('active-question-card');
  const activeQuestionText = document.getElementById('active-question-text');
  const glanceAnchorsStrip = document.getElementById('glance-anchors-strip');
  const solutionMarkdownBody = document.getElementById('solution-markdown-body');
  const streamingCursor = document.getElementById('streaming-cursor');
  const btnCleanCopy = document.getElementById('btn-clean-copy');

  // Gaze-Lock Notch Pill Elements
  const btnToggleNotch = document.getElementById('btn-toggle-notch');
  const notchPillView = document.getElementById('notch-pill-view');
  const notchBullet1 = document.getElementById('notch-bullet-1');
  const notchBullet2 = document.getElementById('notch-bullet-2');
  const notchCues = document.getElementById('notch-cues');
  const notchQuestion = document.getElementById('notch-question');
  const notchStatusDot = document.getElementById('notch-status-dot');
  const btnExpandNotch = document.getElementById('btn-expand-notch');

  // Notch pill state: the question being answered, a short error, and the last answer it showed
  // (Auto-Watch scans and errors must not blank a good answer)
  let isNotchActive = false;
  let notchQuestionText = '';
  let notchIsFollowUp = false;
  let notchError = '';
  let notchAwaitingAnswer = false;
  let lastNotchGlance = null;
  let lastNotchSignature = '';
  let lastReportedNotchHeight = 0;

  // Storage Keys for Guaranteed Persistence
  const STORAGE_GROQ = 'glanceai_groq_api_key';
  const STORAGE_GROQ_BACKUP = 'glanceai_groq_backup_api_key';
  const STORAGE_DEEPGRAM = 'glanceai_deepgram_api_key';
  const STORAGE_AUDIO_DEVICE = 'glanceai_selected_audio_device';
  const STORAGE_TEXT_MODEL = 'glanceai_text_model';
  const STORAGE_VISION_MODEL = 'glanceai_vision_model';
  const STORAGE_RESPONSE_MODE = 'glanceai_response_mode';
  const STORAGE_PROJECT_CONTEXT = 'glanceai_project_context';
  const STORAGE_CODE_LANGUAGE = 'glanceai_code_language';
  const STORAGE_OPACITY = 'glanceai_opacity';
  const STORAGE_RESUME = 'glanceai_resume_data';
  const STORAGE_JD = 'glanceai_jd_data';
  const STORAGE_JD_CONTEXT = 'glanceai_jd_context';
  const STORAGE_GOOGLE_AI = 'glanceai_google_ai_key';

  // VU Meter & Audio Signal Monitor
  const vuFill = document.getElementById('vu-fill');
  let audioContext = null;
  let analyserNode = null;
  let vuAnimFrameId = null;

  // Cross-Platform OS Detection (macOS, Windows, Linux)
  const currentPlatform = (window.glanceaiAPI && window.glanceaiAPI.getPlatform) ? window.glanceaiAPI.getPlatform() : 'darwin';
  const isMac = currentPlatform === 'darwin';
  const isWin = currentPlatform === 'win32';
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  // Strict Lifecycle State Machine
  // States: 'IDLE' | 'STARTING' | 'STREAMING' | 'STOPPING'
  let audioState = 'IDLE';
  let mediaStream = null;
  let mediaRecorder = null;
  let deepgramSocket = null;

  let fullTranscripts = [];
  let fullTranscriptsWithSpeakers = [];
  // One live (interim) line per audio source: 'tab' (interviewer on Meet) and 'mic'. They overlap often, and a single
  // shared slot froze each other's half-sentences into finished lines, so one sentence showed up two or three times.
  const liveInterims = {}; // sourceKey -> { span, text, speakerLabel, updatedAt }

  let lastCapturedScreenshot = null;
  let currentGroqBuffer = '';
  // Pending coalesced render of the streaming answer (see scheduleStreamRender)
  let streamRenderTimer = null;
  let toastTimeout = null;
  let isAutoWatchActive = false;
  let isAutoWatchInferencing = false;

  // Initialize Markdown Engine safely
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }

  // --------------------------------------------------------------------------
  // 1. Dual-Layer Persistence (localStorage + Main IPC Config)
  // --------------------------------------------------------------------------
  async function initConfig() {
    // Phase A: Synchronously hydrate from localStorage for instantaneous 0ms display
    const localGroq = localStorage.getItem(STORAGE_GROQ);
    const localDeepgram = localStorage.getItem(STORAGE_DEEPGRAM);
    const localAudioDevice = localStorage.getItem(STORAGE_AUDIO_DEVICE);
    const localTextModel = localStorage.getItem(STORAGE_TEXT_MODEL);
    const localVisionModel = localStorage.getItem(STORAGE_VISION_MODEL);

    const localResponseMode = localStorage.getItem(STORAGE_RESPONSE_MODE);
    const localProjectContext = localStorage.getItem(STORAGE_PROJECT_CONTEXT);
    const localCodeLanguage = localStorage.getItem(STORAGE_CODE_LANGUAGE);
    const localOpacity = localStorage.getItem(STORAGE_OPACITY);

    if (localGroq) {
      inputGroqKey.value = localGroq;
      groqKeyStatus.textContent = 'Configured';
      groqKeyStatus.classList.add('ready');
    }
    const localGroqBackup = localStorage.getItem(STORAGE_GROQ_BACKUP);
    if (localGroqBackup && inputGroqBackupKey) {
      inputGroqBackupKey.value = localGroqBackup;
      groqBackupKeyStatus.textContent = 'Configured';
      groqBackupKeyStatus.classList.add('ready');
    }
    if (localDeepgram) {
      inputDeepgramKey.value = localDeepgram;
      deepgramKeyStatus.textContent = 'Configured';
      deepgramKeyStatus.classList.add('ready');
    }
    const localGoogleAi = localStorage.getItem(STORAGE_GOOGLE_AI);
    if (localGoogleAi) {
      inputGoogleAiKey.value = localGoogleAi;
      googleAiKeyStatus.textContent = 'Configured';
      googleAiKeyStatus.classList.add('ready');
    }
    if (localAudioDevice) {
      audioDeviceSelect.dataset.preferredDevice = localAudioDevice;
    }
    if (localCodeLanguage && selectCodeLanguage && selectCodeLanguage.querySelector(`option[value="${localCodeLanguage}"]`)) {
      selectCodeLanguage.value = localCodeLanguage;
    }
    if (localOpacity && localOpacity !== 'null' && localOpacity !== 'undefined' && inputOpacitySlider && opacityValBadge) {
      const parsed = parseFloat(localOpacity);
      if (!isNaN(parsed) && parsed > 0) {
        const pct = Math.round(parsed * 100);
        inputOpacitySlider.value = pct;
        opacityValBadge.textContent = `${pct}%`;
        window.glanceaiAPI.setOpacity(parsed);
      }
    }
    if (localResponseMode && selectResponseMode.querySelector(`option[value="${localResponseMode}"]`)) {
      selectResponseMode.value = localResponseMode;
    }
    if (localProjectContext) {
      inputProjectContext.value = localProjectContext;
      contextCharCount.textContent = `${localProjectContext.length} characters`;
      projectContextStatus.textContent = localProjectContext.trim().length > 0 ? 'Saved' : 'Optional';
      if (localProjectContext.trim().length > 0) projectContextStatus.classList.add('ready');
    }

    const localResume = localStorage.getItem(STORAGE_RESUME);
    if (localResume) {
      try {
        const parsedResume = JSON.parse(localResume);
        renderResumeProfileCard(parsedResume);
      } catch (_) {}
    }

    const localJd = localStorage.getItem(STORAGE_JD);
    if (localJd) {
      try {
        const parsedJd = JSON.parse(localJd);
        renderJdProfileCard(parsedJd);
      } catch (_) {}
    } else {
      const localJdContext = localStorage.getItem(STORAGE_JD_CONTEXT);
      if (localJdContext && inputJdContext) {
        inputJdContext.value = localJdContext;
        if (jdCharCount) jdCharCount.textContent = `${localJdContext.length} characters`;
        if (jdContextStatus) {
          jdContextStatus.textContent = 'Saved';
          jdContextStatus.classList.add('ready');
        }
      }
    }

    // Automatic migration of decommissioned or rate-limited models
    // Decommissioned models only (mirrors lib/llm/models.js); every dropdown option is honored
    const DEPRECATED_TEXT_MAP = {
      'llama-3.3-70b-versatile': 'qwen/qwen3.8-27b',
      'llama-3.1-70b-versatile': 'qwen/qwen3.8-27b',
      'llama-3.1-8b-instant': 'qwen/qwen3.8-27b'
    };
    const DEPRECATED_VISION_MAP = {
      'llama-3.2-11b-vision-preview': 'qwen/qwen3.8-27b',
      'llama-3.2-90b-vision-preview': 'qwen/qwen3.8-27b'
    };

    let activeTextModel = DEPRECATED_TEXT_MAP[localTextModel] || localTextModel || 'qwen/qwen3.8-27b';
    let activeVisionModel = DEPRECATED_VISION_MAP[localVisionModel] || localVisionModel || 'qwen/qwen3.8-27b';

    if (selectTextModel.querySelector(`option[value="${activeTextModel}"]`)) {
      selectTextModel.value = activeTextModel;
    }
    if (selectVisionModel.querySelector(`option[value="${activeVisionModel}"]`)) {
      selectVisionModel.value = activeVisionModel;
    }

    // Phase B: Asynchronously merge with Electron config.json
    // For API keys the config file wins: every Save writes both stores, and a key restored or fixed in the
    // file must not be shadowed by an older cached copy
    try {
      const fileConfig = await window.glanceaiAPI.loadConfig();
      if (fileConfig.groqApiKey && inputGroqKey.value !== fileConfig.groqApiKey) {
        inputGroqKey.value = fileConfig.groqApiKey;
        localStorage.setItem(STORAGE_GROQ, fileConfig.groqApiKey);
        groqKeyStatus.textContent = 'Configured';
        groqKeyStatus.classList.add('ready');
      }
      if (inputGroqBackupKey && fileConfig.groqBackupApiKey && inputGroqBackupKey.value !== fileConfig.groqBackupApiKey) {
        inputGroqBackupKey.value = fileConfig.groqBackupApiKey;
        localStorage.setItem(STORAGE_GROQ_BACKUP, fileConfig.groqBackupApiKey);
        groqBackupKeyStatus.textContent = 'Configured';
        groqBackupKeyStatus.classList.add('ready');
      }
      if (fileConfig.deepgramApiKey && inputDeepgramKey.value !== fileConfig.deepgramApiKey) {
        inputDeepgramKey.value = fileConfig.deepgramApiKey;
        localStorage.setItem(STORAGE_DEEPGRAM, fileConfig.deepgramApiKey);
        deepgramKeyStatus.textContent = 'Configured';
        deepgramKeyStatus.classList.add('ready');
      }
      if (fileConfig.googleAiKey && inputGoogleAiKey.value !== fileConfig.googleAiKey) {
        inputGoogleAiKey.value = fileConfig.googleAiKey;
        localStorage.setItem(STORAGE_GOOGLE_AI, fileConfig.googleAiKey);
        googleAiKeyStatus.textContent = 'Configured';
        googleAiKeyStatus.classList.add('ready');
      }
      if (!audioDeviceSelect.dataset.preferredDevice && fileConfig.selectedAudioDevice) {
        audioDeviceSelect.dataset.preferredDevice = fileConfig.selectedAudioDevice;
        localStorage.setItem(STORAGE_AUDIO_DEVICE, fileConfig.selectedAudioDevice);
      }
      if (fileConfig.codeLanguage && selectCodeLanguage && selectCodeLanguage.querySelector(`option[value="${fileConfig.codeLanguage}"]`)) {
        selectCodeLanguage.value = fileConfig.codeLanguage;
        localStorage.setItem(STORAGE_CODE_LANGUAGE, fileConfig.codeLanguage);
      }
      if (typeof fileConfig.opacity === 'number' && !isNaN(fileConfig.opacity) && fileConfig.opacity > 0 && inputOpacitySlider && opacityValBadge) {
        const pct = Math.round(fileConfig.opacity * 100);
        inputOpacitySlider.value = pct;
        opacityValBadge.textContent = `${pct}%`;
        localStorage.setItem(STORAGE_OPACITY, String(fileConfig.opacity));
      }
      if (fileConfig.textModel) {
        const migratedText = DEPRECATED_TEXT_MAP[fileConfig.textModel] || fileConfig.textModel;
        if (selectTextModel.querySelector(`option[value="${migratedText}"]`)) {
          selectTextModel.value = migratedText;
          localStorage.setItem(STORAGE_TEXT_MODEL, migratedText);
        }
      }
      if (fileConfig.visionModel) {
        const migratedVision = DEPRECATED_VISION_MAP[fileConfig.visionModel] || fileConfig.visionModel;
        if (selectVisionModel.querySelector(`option[value="${migratedVision}"]`)) {
          selectVisionModel.value = migratedVision;
          localStorage.setItem(STORAGE_VISION_MODEL, migratedVision);
        }
      }
      if (fileConfig.responseMode && selectResponseMode.querySelector(`option[value="${fileConfig.responseMode}"]`)) {
        selectResponseMode.value = fileConfig.responseMode;
        localStorage.setItem(STORAGE_RESPONSE_MODE, fileConfig.responseMode);
      }
      if (fileConfig.projectContext !== undefined && !inputProjectContext.value) {
        inputProjectContext.value = fileConfig.projectContext;
        localStorage.setItem(STORAGE_PROJECT_CONTEXT, fileConfig.projectContext);
        contextCharCount.textContent = `${fileConfig.projectContext.length} characters`;
        projectContextStatus.textContent = fileConfig.projectContext.trim().length > 0 ? 'Saved' : 'Optional';
        if (fileConfig.projectContext.trim().length > 0) projectContextStatus.classList.add('ready');
      }
      if (fileConfig.resume) {
        localStorage.setItem(STORAGE_RESUME, JSON.stringify(fileConfig.resume));
        renderResumeProfileCard(fileConfig.resume);
      }
      if (fileConfig.jobDescription) {
        localStorage.setItem(STORAGE_JD, JSON.stringify(fileConfig.jobDescription));
        renderJdProfileCard(fileConfig.jobDescription);
      }
      if (fileConfig.jobDescriptionContext && inputJdContext && !inputJdContext.value) {
        inputJdContext.value = fileConfig.jobDescriptionContext;
        localStorage.setItem(STORAGE_JD_CONTEXT, fileConfig.jobDescriptionContext);
        if (jdCharCount) jdCharCount.textContent = `${fileConfig.jobDescriptionContext.length} characters`;
        if (jdContextStatus) {
          jdContextStatus.textContent = 'Saved';
          jdContextStatus.classList.add('ready');
        }
      }
      if (fileConfig.proxyUrl !== undefined && inputProxyUrl) {
        inputProxyUrl.value = fileConfig.proxyUrl;
        if (fileConfig.proxyUrl.trim()) {
          proxyStatusBadge.textContent = 'Proxy Active';
          proxyStatusBadge.classList.add('ready');
        } else {
          proxyStatusBadge.textContent = 'Direct';
          proxyStatusBadge.classList.remove('ready');
        }
      }

      if (window.glanceaiAPI.getLanCompanionInfo) {
        try {
          const info = await window.glanceaiAPI.getLanCompanionInfo();
          if (info && companionPrimaryUrl) {
            companionPrimaryUrl.textContent = info.primaryUrl || 'http://localhost:4242';
            if (info.urls && info.urls.length) companionPrimaryUrl.title = info.urls.join('\n');
            if (companionStatusBadge) companionStatusBadge.textContent = info.running ? 'Live' : 'Off';
            if (companionClientsCount) companionClientsCount.textContent = `${info.clientsCount || 0} connected`;
          }
        } catch (_) {}
      }

      const savedAutopilot = localStorage.getItem('glanceai_autopilot_enabled');
      if (savedAutopilot === 'false') {
        isAutoPilotEnabled = false;
        if (btnToggleAutopilot && autopilotLabel) {
          btnToggleAutopilot.className = 'btn-autopilot inactive';
          autopilotLabel.textContent = '⚡ Auto-Pilot: OFF';
        }
      }

      const savedAutowatch = localStorage.getItem('glanceai_autowatch_enabled');
      if (savedAutowatch === 'true') {
        isAutoWatchActive = true;
        if (btnToggleAutowatch && autowatchLabel) {
          btnToggleAutowatch.className = 'btn-autowatch active';
          autowatchLabel.textContent = '👁️ Auto-Watch: ON';
        }
        if (window.glanceaiAPI && window.glanceaiAPI.startAutoWatch) {
          window.glanceaiAPI.startAutoWatch(5000);
        }
      }
    } catch (err) {
      console.warn('[GlanceAI Renderer] Config merge notice:', err);
    }

    updateModelBadge();
    updateModeBadge();
  }

  async function persistCredentials(updates) {
    if (updates.proxyUrl !== undefined) {
      localStorage.setItem('glanceai_proxy_url', updates.proxyUrl);
    }
    if (updates.groqApiKey !== undefined) {
      localStorage.setItem(STORAGE_GROQ, updates.groqApiKey);
    }
    if (updates.groqBackupApiKey !== undefined) {
      localStorage.setItem(STORAGE_GROQ_BACKUP, updates.groqBackupApiKey);
    }
    if (updates.deepgramApiKey !== undefined) {
      localStorage.setItem(STORAGE_DEEPGRAM, updates.deepgramApiKey);
    }
    if (updates.selectedAudioDevice !== undefined) {
      localStorage.setItem(STORAGE_AUDIO_DEVICE, updates.selectedAudioDevice);
    }
    if (updates.textModel !== undefined) {
      localStorage.setItem(STORAGE_TEXT_MODEL, updates.textModel);
    }
    if (updates.visionModel !== undefined) {
      localStorage.setItem(STORAGE_VISION_MODEL, updates.visionModel);
    }
    if (updates.responseMode !== undefined) {
      localStorage.setItem(STORAGE_RESPONSE_MODE, updates.responseMode);
    }
    if (updates.projectContext !== undefined) {
      localStorage.setItem(STORAGE_PROJECT_CONTEXT, updates.projectContext);
    }
    if (updates.codeLanguage !== undefined) {
      localStorage.setItem(STORAGE_CODE_LANGUAGE, updates.codeLanguage);
    }
    if (updates.opacity !== undefined) {
      localStorage.setItem(STORAGE_OPACITY, String(updates.opacity));
    }
    if (updates.googleAiKey !== undefined) {
      localStorage.setItem(STORAGE_GOOGLE_AI, updates.googleAiKey);
    }
    await window.glanceaiAPI.saveConfig(updates);
  }

  function updateModelBadge() {
    const isVision = !!lastCapturedScreenshot;
    const model = isVision ? selectVisionModel.value : selectTextModel.value;
    if (isVision) {
      badgeModel.textContent = '👁️ QWEN VISION';
      badgeModel.style.color = '#38bdf8';
    } else if (model && model.includes('qwen')) {
      badgeModel.textContent = '⚡ QWEN 27B';
      badgeModel.style.color = '#38bdf8';
    } else if (model && model.includes('20b')) {
      badgeModel.textContent = '⚡ GROQ 20B';
      badgeModel.style.color = '#34d399';
    } else {
      badgeModel.textContent = '⚡ GROQ 120B';
      badgeModel.style.color = '#fb923c';
    }
  }

  function updateModeBadge() {
    if (!modeStatusBadge || !selectResponseMode) return;
    const mode = selectResponseMode.value;
    const labels = {
      interview_teleprompter: 'Teleprompter',
      adaptive: 'Adaptive',
      coding: 'Coding',
      system_design: 'SysDesign',
      project_behavioral: 'Project'
    };
    modeStatusBadge.textContent = labels[mode] || 'Adaptive';
  }

  selectResponseMode.addEventListener('change', async () => {
    updateModeBadge();
    await persistCredentials({ responseMode: selectResponseMode.value });
  });

  let projectContextDebounce = null;
  inputProjectContext.addEventListener('input', () => {
    const len = inputProjectContext.value.length;
    contextCharCount.textContent = `${len} characters`;
    projectContextStatus.textContent = 'Saving...';
    projectContextStatus.classList.remove('ready');
    clearTimeout(projectContextDebounce);
    projectContextDebounce = setTimeout(async () => {
      await persistCredentials({ projectContext: inputProjectContext.value });
      projectContextStatus.textContent = inputProjectContext.value.trim().length > 0 ? 'Saved' : 'Optional';
      if (inputProjectContext.value.trim().length > 0) projectContextStatus.classList.add('ready');
    }, 600);
  });

  btnSaveProjectContext.addEventListener('click', async () => {
    await persistCredentials({ projectContext: inputProjectContext.value });
    projectContextStatus.textContent = inputProjectContext.value.trim().length > 0 ? 'Saved' : 'Optional';
    if (inputProjectContext.value.trim().length > 0) projectContextStatus.classList.add('ready');
    btnSaveProjectContext.textContent = 'Saved!';
    setTimeout(() => { btnSaveProjectContext.textContent = 'Save Context'; }, 1500);
  });

  // --------------------------------------------------------------------------
  // Resume Document & Candidate Intelligence Controller
  // --------------------------------------------------------------------------
  function renderResumeProfileCard(resumeData) {
    if (!resumeData || !resumeData.extractedText) return;

    if (resumeFileBadge) resumeFileBadge.textContent = resumeData.fileExt || 'DOC';
    if (resumeFilename) resumeFilename.textContent = resumeData.fileName || 'Resume Document';
    if (resumeFilesize) {
      const kb = Math.round((resumeData.fileSize || 0) / 1024);
      resumeFilesize.textContent = `${kb > 0 ? kb + ' KB' : 'Document'} • Grounded`;
    }

    const intel = resumeData.intelligence;
    if (intel) {
      if (intel.candidateTitle && resumeHeadlineRow && resumeCandidateTitle) {
        resumeHeadlineRow.style.display = 'flex';
        const namePrefix = intel.candidateName && intel.candidateName !== 'Candidate' ? `${intel.candidateName} — ` : '';
        resumeCandidateTitle.textContent = `${namePrefix}${intel.candidateTitle}`;
      } else if (resumeHeadlineRow) {
        resumeHeadlineRow.style.display = 'none';
      }

      if (intel.skills && Array.isArray(intel.skills) && intel.skills.length > 0 && resumeSkillsRow && resumeSkillChips) {
        resumeSkillsRow.style.display = 'flex';
        resumeSkillChips.innerHTML = '';
        intel.skills.slice(0, 14).forEach(skill => {
          const chip = document.createElement('span');
          chip.className = 'resume-skill-chip';
          chip.textContent = skill;
          resumeSkillChips.appendChild(chip);
        });
      } else if (resumeSkillsRow) {
        resumeSkillsRow.style.display = 'none';
      }

      if (intel.metrics && Array.isArray(intel.metrics) && intel.metrics.length > 0 && resumeMetricsRow && resumeMetricsCount) {
        resumeMetricsRow.style.display = 'flex';
        resumeMetricsCount.textContent = `${intel.metrics.length} quantifiable metrics detected (${intel.metrics[0].slice(0, 45)}...)`;
      } else if (resumeMetricsRow) {
        resumeMetricsRow.style.display = 'none';
      }
    }

    if (resumeProfileCard) resumeProfileCard.style.display = 'flex';
    if (resumeStatusBadge) {
      resumeStatusBadge.textContent = 'Active & Grounded';
      resumeStatusBadge.classList.add('ready');
    }

    // Populate extracted text into inputProjectContext unconditionally
    if (inputProjectContext) {
      inputProjectContext.value = resumeData.extractedText || '';
      if (contextCharCount) contextCharCount.textContent = `${(resumeData.extractedText || '').length} characters`;
      if (projectContextStatus) {
        projectContextStatus.textContent = 'Grounded';
        projectContextStatus.classList.add('ready');
      }
    }
  }

  function clearResumeProfileCard() {
    if (resumeProfileCard) resumeProfileCard.style.display = 'none';
    if (resumeStatusBadge) {
      resumeStatusBadge.textContent = 'No Resume';
      resumeStatusBadge.classList.remove('ready');
    }
    if (resumeHeadlineRow) resumeHeadlineRow.style.display = 'none';
    if (resumeSkillsRow) resumeSkillsRow.style.display = 'none';
    if (resumeMetricsRow) resumeMetricsRow.style.display = 'none';
    if (resumeSkillChips) resumeSkillChips.innerHTML = '';
    localStorage.removeItem(STORAGE_RESUME);
  }

  if (resumeDropzone) {
    resumeDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resumeDropzone.classList.add('drag-active');
    });
    resumeDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resumeDropzone.classList.remove('drag-active');
    });
    resumeDropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      resumeDropzone.classList.remove('drag-active');

      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const validExtensions = ['.pdf', '.docx', '.txt', '.md', '.markdown'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        showToast('Please upload a PDF, DOCX, TXT, or Markdown resume.');
        return;
      }

      showToast(`Parsing ${file.name}...`);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const bufferBase64 = reader.result.split(',')[1];
          const result = await window.glanceaiAPI.parseResumeBuffer({
            bufferBase64,
            fileName: file.name,
            mimeType: file.type
          });

          if (result && result.success) {
            localStorage.setItem(STORAGE_RESUME, JSON.stringify(result));
            renderResumeProfileCard(result);
            showToast(`Resume Grounded: ${result.fileName}`);
          } else {
            showToast(result?.error || 'Failed to parse resume document');
          }
        } catch (err) {
          console.error('[GlanceAI Renderer] Drop parse error:', err);
          showToast('Error parsing resume document');
        }
      };
      reader.readAsDataURL(file);
    });

    resumeDropzone.addEventListener('click', async (e) => {
      if (e.target === resumeFileInput) return;
      try {
        const result = await window.glanceaiAPI.selectAndParseResume();
        if (result && result.success) {
          localStorage.setItem(STORAGE_RESUME, JSON.stringify(result));
          renderResumeProfileCard(result);
          showToast(`Resume Grounded: ${result.fileName}`);
        } else if (result && !result.canceled && result.error) {
          showToast(result.error);
        }
      } catch (err) {
        console.error('[GlanceAI Renderer] Select resume error:', err);
      }
    });
  }

  if (btnBrowseResume) {
    btnBrowseResume.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const result = await window.glanceaiAPI.selectAndParseResume();
        if (result && result.success) {
          localStorage.setItem(STORAGE_RESUME, JSON.stringify(result));
          renderResumeProfileCard(result);
          showToast(`Resume Grounded: ${result.fileName}`);
        } else if (result && !result.canceled && result.error) {
          showToast(result.error);
        }
      } catch (err) {
        console.error('[GlanceAI Renderer] Browse resume error:', err);
      }
    });
  }

  if (btnReplaceResume) {
    btnReplaceResume.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const result = await window.glanceaiAPI.selectAndParseResume();
        if (result && result.success) {
          localStorage.setItem(STORAGE_RESUME, JSON.stringify(result));
          renderResumeProfileCard(result);
          showToast(`Replaced with ${result.fileName}`);
        }
      } catch (err) {
        console.error('[GlanceAI Renderer] Replace resume error:', err);
      }
    });
  }

  if (btnDeleteResume) {
    btnDeleteResume.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Remove uploaded resume? This will clear candidate context grounding.')) {
        await window.glanceaiAPI.deleteResume();
        clearResumeProfileCard();
        if (inputProjectContext) {
          inputProjectContext.value = '';
          if (contextCharCount) contextCharCount.textContent = '0 characters';
          if (projectContextStatus) {
            projectContextStatus.textContent = 'Optional';
            projectContextStatus.classList.remove('ready');
          }
          await persistCredentials({ projectContext: '' });
        }
        showToast('Resume removed');
      }
    });
  }

  if (btnToggleResumeEditor) {
    btnToggleResumeEditor.addEventListener('click', (e) => {
      e.stopPropagation();
      if (resumeEditorWrap) {
        const isHidden = resumeEditorWrap.style.display === 'none';
        resumeEditorWrap.style.display = isHidden ? 'flex' : 'none';
        if (isHidden && inputProjectContext) inputProjectContext.focus();
      }
    });
  }

  // Quick Action Grounding Handlers
  async function triggerResumePitch() {
    const resumeText = (inputProjectContext?.value || '').trim();
    if (!resumeText) {
      showToast('Please upload a resume first.');
      paneConfig.classList.remove('collapsed');
      return;
    }
    await executeGroqInference({ kind: 'quick_action', action: 'resume_pitch' });
  }

  async function triggerStarStories() {
    const resumeText = (inputProjectContext?.value || '').trim();
    if (!resumeText) {
      showToast('Please upload a resume first.');
      paneConfig.classList.remove('collapsed');
      return;
    }
    await executeGroqInference({ kind: 'quick_action', action: 'star_stories' });
  }

  async function triggerStackDefense() {
    const resumeText = (inputProjectContext?.value || '').trim();
    if (!resumeText) {
      showToast('Please upload a resume first.');
      paneConfig.classList.remove('collapsed');
      return;
    }
    await executeGroqInference({ kind: 'quick_action', action: 'stack_defense' });
  }

  if (btnResumePitch) btnResumePitch.addEventListener('click', triggerResumePitch);
  if (chipResumePitch) chipResumePitch.addEventListener('click', triggerResumePitch);
  if (chipStarStories) chipStarStories.addEventListener('click', triggerStarStories);
  if (chipStackDefense) chipStackDefense.addEventListener('click', triggerStackDefense);

  // --------------------------------------------------------------------------
  // Job Description (JD) & Target Role Controller
  // --------------------------------------------------------------------------
  function renderJdProfileCard(jdData) {
    if (!jdData || !jdData.extractedText) return;

    if (jdFileBadge) jdFileBadge.textContent = jdData.fileExt || 'JD';
    if (jdFilename) jdFilename.textContent = jdData.fileName || 'Job Description';
    if (jdFilesize) {
      const kb = Math.round((jdData.fileSize || 0) / 1024);
      jdFilesize.textContent = `${kb > 0 ? kb + ' KB' : 'Pasted Text'} • Role Grounded`;
    }

    const intel = jdData.intelligence;
    if (intel) {
      if (intel.roleTitle && jdTitleRow && jdRoleTitle) {
        jdTitleRow.style.display = 'flex';
        jdRoleTitle.textContent = intel.roleTitle;
      } else if (jdTitleRow) {
        jdTitleRow.style.display = 'none';
      }

      if (intel.companyName && jdCompanyRow && jdCompanyName) {
        jdCompanyRow.style.display = 'flex';
        jdCompanyName.textContent = intel.companyName;
      } else if (jdCompanyRow) {
        jdCompanyRow.style.display = 'none';
      }

      if (intel.skills && Array.isArray(intel.skills) && intel.skills.length > 0 && jdSkillsRow && jdSkillChips) {
        jdSkillsRow.style.display = 'flex';
        jdSkillChips.innerHTML = '';
        intel.skills.slice(0, 14).forEach(skill => {
          const chip = document.createElement('span');
          chip.className = 'resume-skill-chip jd-chip';
          chip.style.borderColor = 'rgba(245, 158, 11, 0.35)';
          chip.style.color = '#fbbf24';
          chip.style.background = 'rgba(245, 158, 11, 0.12)';
          chip.textContent = skill;
          jdSkillChips.appendChild(chip);
        });
      } else if (jdSkillsRow) {
        jdSkillsRow.style.display = 'none';
      }
    }

    if (jdProfileCard) jdProfileCard.style.display = 'flex';
    if (jdStatusBadge) {
      jdStatusBadge.textContent = 'Role Grounded';
      jdStatusBadge.classList.add('ready');
    }

    if (inputJdContext) {
      inputJdContext.value = jdData.extractedText || '';
      if (jdCharCount) jdCharCount.textContent = `${(jdData.extractedText || '').length} characters`;
      if (jdContextStatus) {
        jdContextStatus.textContent = 'Grounded';
        jdContextStatus.classList.add('ready');
      }
    }
  }

  function clearJdProfileCard() {
    if (jdProfileCard) jdProfileCard.style.display = 'none';
    if (jdStatusBadge) {
      jdStatusBadge.textContent = 'No JD';
      jdStatusBadge.classList.remove('ready');
    }
    if (jdTitleRow) jdTitleRow.style.display = 'none';
    if (jdCompanyRow) jdCompanyRow.style.display = 'none';
    if (jdSkillsRow) jdSkillsRow.style.display = 'none';
    if (jdSkillChips) jdSkillChips.innerHTML = '';
    localStorage.removeItem(STORAGE_JD);
  }

  if (jdDropzone) {
    jdDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      jdDropzone.classList.add('drag-active');
    });
    jdDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      jdDropzone.classList.remove('drag-active');
    });
    jdDropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      jdDropzone.classList.remove('drag-active');

      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const validExtensions = ['.pdf', '.docx', '.txt', '.md', '.markdown'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!validExtensions.includes(fileExt)) {
        showToast('Please upload a PDF, DOCX, TXT, or Markdown JD.');
        return;
      }

      showToast(`Parsing JD: ${file.name}...`);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const bufferBase64 = reader.result.split(',')[1];
          const result = await window.glanceaiAPI.parseJDBuffer({
            bufferBase64,
            fileName: file.name,
            mimeType: file.type
          });

          if (result && result.success) {
            localStorage.setItem(STORAGE_JD, JSON.stringify(result));
            renderJdProfileCard(result);
            showToast(`Role Grounded: ${result.fileName}`);
          } else {
            showToast(result?.error || 'Failed to parse JD document');
          }
        } catch (err) {
          console.error('[GlanceAI Renderer] Drop parse error for JD:', err);
          showToast('Error parsing JD document');
        }
      };
      reader.readAsDataURL(file);
    });

    jdDropzone.addEventListener('click', async (e) => {
      if (e.target === jdFileInput) return;
      try {
        const result = await window.glanceaiAPI.selectAndParseJD();
        if (result && result.success) {
          localStorage.setItem(STORAGE_JD, JSON.stringify(result));
          renderJdProfileCard(result);
          showToast(`Role Grounded: ${result.fileName}`);
        } else if (result && !result.canceled && result.error) {
          showToast(result.error);
        }
      } catch (err) {
        console.error('[GlanceAI Renderer] Select JD error:', err);
      }
    });
  }

  if (btnBrowseJD) {
    btnBrowseJD.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const result = await window.glanceaiAPI.selectAndParseJD();
        if (result && result.success) {
          localStorage.setItem(STORAGE_JD, JSON.stringify(result));
          renderJdProfileCard(result);
          showToast(`Role Grounded: ${result.fileName}`);
        } else if (result && !result.canceled && result.error) {
          showToast(result.error);
        }
      } catch (err) {
        console.error('[GlanceAI Renderer] Browse JD error:', err);
      }
    });
  }

  if (btnReplaceJD) {
    btnReplaceJD.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const result = await window.glanceaiAPI.selectAndParseJD();
        if (result && result.success) {
          localStorage.setItem(STORAGE_JD, JSON.stringify(result));
          renderJdProfileCard(result);
          showToast(`Replaced JD with ${result.fileName}`);
        }
      } catch (err) {
        console.error('[GlanceAI Renderer] Replace JD error:', err);
      }
    });
  }

  if (btnDeleteJD) {
    btnDeleteJD.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Remove target Job Description? This will clear role context grounding.')) {
        await window.glanceaiAPI.deleteJD();
        clearJdProfileCard();
        if (inputJdContext) {
          inputJdContext.value = '';
          if (jdCharCount) jdCharCount.textContent = '0 characters';
          if (jdContextStatus) {
            jdContextStatus.textContent = 'Optional';
            jdContextStatus.classList.remove('ready');
          }
          localStorage.removeItem(STORAGE_JD_CONTEXT);
        }
        showToast('Job Description removed');
      }
    });
  }

  if (btnToggleJdEditor) {
    btnToggleJdEditor.addEventListener('click', (e) => {
      e.stopPropagation();
      if (jdEditorWrap) {
        const isHidden = jdEditorWrap.style.display === 'none';
        jdEditorWrap.style.display = isHidden ? 'flex' : 'none';
        if (isHidden && inputJdContext) inputJdContext.focus();
      }
    });
  }

  if (inputJdContext) {
    inputJdContext.addEventListener('input', () => {
      const len = inputJdContext.value.length;
      if (jdCharCount) jdCharCount.textContent = `${len} characters`;
      if (jdContextStatus) {
        jdContextStatus.textContent = len > 0 ? 'Unsaved' : 'Optional';
        if (len > 0) jdContextStatus.classList.remove('ready');
      }
    });
  }

  if (btnSaveJdContext) {
    btnSaveJdContext.addEventListener('click', async () => {
      const text = (inputJdContext?.value || '').trim();
      try {
        const result = await window.glanceaiAPI.saveJDText({ text, fileName: 'Pasted_Job_Description.txt' });
        if (result && result.success) {
          localStorage.setItem(STORAGE_JD, JSON.stringify(result));
          localStorage.setItem(STORAGE_JD_CONTEXT, text);
          renderJdProfileCard(result);
          if (jdContextStatus) {
            jdContextStatus.textContent = 'Grounded';
            jdContextStatus.classList.add('ready');
          }
          btnSaveJdContext.textContent = 'Saved!';
          setTimeout(() => { btnSaveJdContext.textContent = 'Save JD'; }, 1500);
          showToast('Job Description Saved & Grounded');
        }
      } catch (err) {
        console.error('[GlanceAI Renderer] Save JD text error:', err);
        showToast('Error saving Job Description');
      }
    });
  }

  async function triggerWhyThisRolePitch() {
    const jdText = (inputJdContext?.value || '').trim();
    const resumeText = (inputProjectContext?.value || '').trim();
    if (!jdText && !resumeText) {
      showToast('Please upload a Job Description (JD) or Resume first.');
      paneConfig.classList.remove('collapsed');
      return;
    }
    await executeGroqInference({ kind: 'quick_action', action: 'why_this_role' });
  }

  if (btnJdPitch) btnJdPitch.addEventListener('click', triggerWhyThisRolePitch);
  if (chipWhyThisRole) chipWhyThisRole.addEventListener('click', triggerWhyThisRolePitch);

  selectTextModel.addEventListener('change', async () => {
    updateModelBadge();
    await persistCredentials({ textModel: selectTextModel.value });
  });

  selectVisionModel.addEventListener('change', async () => {
    updateModelBadge();
    await persistCredentials({ visionModel: selectVisionModel.value });
  });

  if (selectCodeLanguage) {
    selectCodeLanguage.addEventListener('change', async () => {
      await persistCredentials({ codeLanguage: selectCodeLanguage.value });
      showToast(`💻 DSA Language set to ${selectCodeLanguage.options[selectCodeLanguage.selectedIndex]?.text || 'C++'}`);
    });
  }

  if (inputOpacitySlider) {
    inputOpacitySlider.addEventListener('input', async () => {
      const val = parseInt(inputOpacitySlider.value, 10);
      if (opacityValBadge) opacityValBadge.textContent = `${val}%`;
      const numericVal = Math.round((val / 100) * 100) / 100;
      await window.glanceaiAPI.setOpacity(numericVal);
      await persistCredentials({ opacity: numericVal });
    });
  }

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const op = parseFloat(btn.dataset.opacity);
      const pct = Math.round(op * 100);
      if (inputOpacitySlider) inputOpacitySlider.value = pct;
      if (opacityValBadge) opacityValBadge.textContent = `${pct}%`;
      await window.glanceaiAPI.setOpacity(op);
      await persistCredentials({ opacity: op });
      showToast(`👻 HUD Opacity: ${pct}%`);
    });
  });

  window.glanceaiAPI.onOpacityChanged((nextOpacity) => {
    const pct = Math.round(nextOpacity * 100);
    if (inputOpacitySlider) inputOpacitySlider.value = pct;
    if (opacityValBadge) opacityValBadge.textContent = `${pct}%`;
    localStorage.setItem(STORAGE_OPACITY, String(nextOpacity));
    showToast(`👻 HUD Opacity: ${pct}%`);
  });

  if (btnSaveProxy && inputProxyUrl) {
    btnSaveProxy.addEventListener('click', async () => {
      const url = inputProxyUrl.value.trim();
      btnSaveProxy.textContent = 'Applying...';
      try {
        await window.glanceaiAPI.setProxy(url);
        await persistCredentials({ proxyUrl: url });
        if (url) {
          proxyStatusBadge.textContent = 'Proxy Active';
          proxyStatusBadge.classList.add('ready');
          showToast(`🌐 Outbound Proxy applied: ${url}`);
        } else {
          proxyStatusBadge.textContent = 'Direct';
          proxyStatusBadge.classList.remove('ready');
          showToast('🌐 Direct connection enabled');
        }
      } catch (err) {
        alert('Failed to set proxy: ' + err.message);
      } finally {
        btnSaveProxy.textContent = 'Apply';
      }
    });
  }

  if (btnCopyCompanionUrl && companionPrimaryUrl) {
    btnCopyCompanionUrl.addEventListener('click', async () => {
      const url = companionPrimaryUrl.textContent.trim();
      if (url) {
        try {
          await navigator.clipboard.writeText(url);
          showToast(`📱 Copied LAN Companion URL: ${url}`);
        } catch (_) {
          prompt('LAN Companion URL (copy to phone):', url);
        }
      }
    });
  }

  const btnToggleCompanion = document.getElementById('btn-toggle-companion');
  if (btnToggleCompanion) {
    btnToggleCompanion.addEventListener('click', async () => {
      try {
        const currentInfo = (await window.glanceaiAPI?.getLanCompanionInfo()) || {};
        const isCurrentlyLan = Boolean(currentInfo.boundToLan !== undefined ? currentInfo.boundToLan : currentInfo.bindLan);
        const newBindLan = !isCurrentlyLan;
        const res = await window.glanceaiAPI?.toggleLanCompanion(true, currentInfo.port || 4242, newBindLan);
        if (res) {
          if (companionPrimaryUrl) companionPrimaryUrl.textContent = res.primaryUrl || '';
          showToast(newBindLan ? '🌐 Companion: LAN Mode (0.0.0.0) Active' : '🔒 Companion: Localhost-only (127.0.0.1) Active');
        }
      } catch (err) {
        console.warn('[GlanceAI] Toggle companion mode error:', err);
      }
    });
  }

  if (window.glanceaiAPI.onCompanionRemoteQuery) {
    window.glanceaiAPI.onCompanionRemoteQuery(async (remotePrompt) => {
      if (remotePrompt === '__GLANCEAI_FORCE_SOLVE_AUDIO__') {
        showToast('📱 Phone triggered Force Solve Audio');
        await triggerEmergencyForceSolve();
        return;
      }
      showToast(`📱 Phone requested: ${remotePrompt}`);
      await executeGroqInference({ kind: 'freeform', text: remotePrompt }, { imageBase64: lastCapturedScreenshot });
    });
  }

  if (btnToggleAutopilot) {
    btnToggleAutopilot.addEventListener('click', () => {
      isAutoPilotEnabled = !isAutoPilotEnabled;
      clearTimeout(autoPilotSilenceTimer);
      if (isAutoPilotEnabled) {
        btnToggleAutopilot.className = 'btn-autopilot active';
        autopilotLabel.textContent = '⚡ Auto-Pilot: ON';
        showToast('⚡ Hands-Free Auto-Pilot ENABLED: Will auto-answer interviewer questions');
      } else {
        btnToggleAutopilot.className = 'btn-autopilot inactive';
        autopilotLabel.textContent = '⚡ Auto-Pilot: OFF';
        showToast('⚡ Hands-Free Auto-Pilot PAUSED: Click Reason Over Transcript manually');
      }
      localStorage.setItem('glanceai_autopilot_enabled', String(isAutoPilotEnabled));
    });
  }

  if (btnCopyMentorUrl) {
    btnCopyMentorUrl.addEventListener('click', async () => {
      let mentorUrl = '';
      if (window.glanceaiAPI && window.glanceaiAPI.getLanCompanionInfo) {
        try {
          const info = await window.glanceaiAPI.getLanCompanionInfo();
          mentorUrl = info?.mentorUrl;
        } catch (_) {}
      }
      if (!mentorUrl && companionPrimaryUrl) {
        mentorUrl = companionPrimaryUrl.textContent.trim() + '/mentor';
      }
      if (mentorUrl) {
        try {
          await navigator.clipboard.writeText(mentorUrl);
          showToast(`🛡️ Copied Duo Mode Mentor URL: ${mentorUrl}`);
          btnCopyMentorUrl.textContent = '✓ Copied';
          setTimeout(() => { btnCopyMentorUrl.textContent = '🛡️ Copy Mentor'; }, 2000);
        } catch (_) {
          prompt('Duo Mode Mentor URL (share with mentor):', mentorUrl);
        }
      }
    });
  }

  if (btnToggleAutowatch) {
    btnToggleAutowatch.addEventListener('click', async () => {
      isAutoWatchActive = !isAutoWatchActive;
      if (isAutoWatchActive) {
        btnToggleAutowatch.className = 'btn-autowatch active';
        if (autowatchLabel) autowatchLabel.textContent = '👁️ Auto-Watch: ON';
        showToast('👁️ Auto-Watch ACTIVE: Continuous silent coding platform detection enabled');
        if (window.glanceaiAPI && window.glanceaiAPI.startAutoWatch) {
          await window.glanceaiAPI.startAutoWatch(5000);
        }
      } else {
        btnToggleAutowatch.className = 'btn-autowatch inactive';
        if (autowatchLabel) autowatchLabel.textContent = '👁️ Auto-Watch: OFF';
        showToast('👁️ Auto-Watch PAUSED');
        if (window.glanceaiAPI && window.glanceaiAPI.stopAutoWatch) {
          await window.glanceaiAPI.stopAutoWatch();
        }
      }
      localStorage.setItem('glanceai_autowatch_enabled', String(isAutoWatchActive));
    });
  }

  if (btnDismissWhisper && mentorWhisperCard) {
    btnDismissWhisper.addEventListener('click', () => {
      mentorWhisperCard.style.display = 'none';
    });
  }

  btnSaveGroqKey.addEventListener('click', async () => {
    const key = inputGroqKey.value.trim();
    if (key) {
      await persistCredentials({ groqApiKey: key });
      groqKeyStatus.textContent = 'Saved';
      groqKeyStatus.classList.add('ready');
      setTimeout(() => { groqKeyStatus.textContent = 'Configured'; }, 2000);
      showToast('🔑 GROQ_API_KEY saved successfully');
    }
  });

  // Auto-save on blur as well so user never loses their key
  inputGroqKey.addEventListener('change', async () => {
    const key = inputGroqKey.value.trim();
    if (key) {
      await persistCredentials({ groqApiKey: key });
      groqKeyStatus.textContent = 'Configured';
      groqKeyStatus.classList.add('ready');
    }
  });

  if (btnSaveGroqBackupKey && inputGroqBackupKey) {
    btnSaveGroqBackupKey.addEventListener('click', async () => {
      const key = inputGroqBackupKey.value.trim();
      await persistCredentials({ groqBackupApiKey: key });
      groqBackupKeyStatus.textContent = key ? 'Saved' : 'Optional';
      if (key) {
        groqBackupKeyStatus.classList.add('ready');
        setTimeout(() => { groqBackupKeyStatus.textContent = 'Configured'; }, 2000);
        showToast('🔑 GROQ_BACKUP_KEY saved successfully');
      } else {
        groqBackupKeyStatus.classList.remove('ready');
      }
    });

    inputGroqBackupKey.addEventListener('change', async () => {
      const key = inputGroqBackupKey.value.trim();
      await persistCredentials({ groqBackupApiKey: key });
      if (key) {
        groqBackupKeyStatus.textContent = 'Configured';
        groqBackupKeyStatus.classList.add('ready');
      } else {
        groqBackupKeyStatus.textContent = 'Optional';
        groqBackupKeyStatus.classList.remove('ready');
      }
    });
  }

  btnSaveDeepgramKey.addEventListener('click', async () => {
    const key = inputDeepgramKey.value.trim();
    await persistCredentials({ deepgramApiKey: key });
    deepgramKeyStatus.textContent = key ? 'Saved' : 'Optional';
    if (key) {
      deepgramKeyStatus.classList.add('ready');
      setTimeout(() => { deepgramKeyStatus.textContent = 'Configured'; }, 2000);
      showToast('🎙️ DEEPGRAM_API_KEY saved successfully');
    } else {
      deepgramKeyStatus.classList.remove('ready');
    }
  });

  inputDeepgramKey.addEventListener('change', async () => {
    const key = inputDeepgramKey.value.trim();
    await persistCredentials({ deepgramApiKey: key });
    if (key) {
      deepgramKeyStatus.textContent = 'Configured';
      deepgramKeyStatus.classList.add('ready');
    } else {
      deepgramKeyStatus.textContent = 'Optional';
      deepgramKeyStatus.classList.remove('ready');
    }
  });

  // Google AI Key Save Handler
  if (btnSaveGoogleAiKey) {
    btnSaveGoogleAiKey.addEventListener('click', async () => {
      const key = inputGoogleAiKey.value.trim();
      localStorage.setItem(STORAGE_GOOGLE_AI, key);
      await persistCredentials({ googleAiKey: key });
      googleAiKeyStatus.textContent = key ? 'Saved' : 'Optional';
      if (key) {
        googleAiKeyStatus.classList.add('ready');
        setTimeout(() => { googleAiKeyStatus.textContent = 'Configured'; }, 2000);
        showToast('🔮 GOOGLE_AI_KEY saved — Gemini 2.0 Flash vision fallback enabled');
      } else {
        googleAiKeyStatus.classList.remove('ready');
      }
    });
  }

  if (inputGoogleAiKey) {
    inputGoogleAiKey.addEventListener('change', async () => {
      const key = inputGoogleAiKey.value.trim();
      localStorage.setItem(STORAGE_GOOGLE_AI, key);
      await persistCredentials({ googleAiKey: key });
      if (key) {
        googleAiKeyStatus.textContent = 'Configured';
        googleAiKeyStatus.classList.add('ready');
      } else {
        googleAiKeyStatus.textContent = 'Optional';
        googleAiKeyStatus.classList.remove('ready');
      }
    });
  }

  btnToggleConfig.addEventListener('click', () => {
    paneConfig.classList.toggle('collapsed');
  });

  btnMinimizeWindow?.addEventListener('click', () => window.glanceaiAPI?.minimizeApp?.());
  btnCloseWindow?.addEventListener('click', () => window.glanceaiAPI?.closeApp?.());

  // --------------------------------------------------------------------------
  // 2. macOS Audio Device Enumeration & Loopback Routing
  // --------------------------------------------------------------------------
  async function enumerateAudioDevices(hasExplicitPermission = false) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');

      // Check if labels are empty (macOS TCC Catch-22)
      const hasLabels = audioInputs.some(d => d.label && d.label.trim().length > 0);

      audioDeviceSelect.innerHTML = '';

      if (!hasLabels && !hasExplicitPermission) {
        audioPipelineBadge.textContent = 'Auth Required';
        audioPipelineBadge.className = 'device-status-badge warning';
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '⚠️ Mic access needed for names (Click Grant / Refresh)';
        audioDeviceSelect.appendChild(opt);
        return;
      }

      audioPipelineBadge.textContent = 'Audio: Standby';
      audioPipelineBadge.className = 'device-status-badge';

      if (audioInputs.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No audio input devices detected';
        audioDeviceSelect.appendChild(opt);
        return;
      }

      const preferredId = audioDeviceSelect.dataset.preferredDevice || localStorage.getItem(STORAGE_AUDIO_DEVICE);
      let selectedOption = null;
      let hasLoopbackDriver = false;

      audioInputs.forEach((device, idx) => {
        const opt = document.createElement('option');
        opt.value = device.deviceId;
        const label = device.label || `Audio Input ${idx + 1}`;

        // Detect cross-platform virtual loopback drivers:
        // macOS: BlackHole, Soundflower, Loopback
        // Windows: Stereo Mix, VB-Audio Cable, Virtual Cable, What U Hear
        // Linux: Monitor of Built-in Audio, PulseAudio, PipeWire
        const isLoopback = /blackhole|loopback|soundflower|virtual|cable|aggregate|stereo mix|what u hear|wave out|monitor|pulse|pipewire/i.test(label);
        if (isLoopback) {
          hasLoopbackDriver = true;
          opt.textContent = `🔊 [Loopback / Speaker] ${label}`;
        } else {
          opt.textContent = `🎙️ [Mic] ${label}`;
        }

        if (device.deviceId === preferredId || (!selectedOption && isLoopback)) {
          selectedOption = opt;
        }

        audioDeviceSelect.appendChild(opt);
      });

      if (selectedOption) {
        selectedOption.selected = true;
      }

      // If no loopback driver is detected, display platform-specific setup hint
      if (!hasLoopbackDriver) {
        loopbackGuideHint.style.display = 'block';
        if (isMac) {
          loopbackGuideHint.innerHTML = '<span>💡 Speaker Audio: Install <kbd>brew install blackhole-2ch</kbd> to intercept Zoom/Teams voice.</span>';
        } else if (isWin) {
          loopbackGuideHint.innerHTML = '<span>💡 Speaker Audio: Enable "Stereo Mix" in Windows Sound Settings or install <kbd>VB-CABLE</kbd>.</span>';
        } else {
          loopbackGuideHint.innerHTML = '<span>💡 Speaker Audio: Route via <kbd>pavucontrol</kbd> (Monitor of Audio Device).</span>';
        }

        const hintOption = document.createElement('option');
        hintOption.value = '';
        hintOption.disabled = true;
        hintOption.textContent = isMac
          ? '⚠️ No loopback driver found (Install BlackHole 2ch)'
          : (isWin ? '⚠️ No loopback driver found (Enable Stereo Mix / VB-Cable)' : '⚠️ No loopback driver found (Check PulseAudio/PipeWire)');
        audioDeviceSelect.appendChild(hintOption);
      } else {
        loopbackGuideHint.style.display = 'none';
      }

      updateChannelLabel();
    } catch (err) {
      console.error('[GlanceAI Renderer] Audio enumeration failed:', err);
      audioPipelineBadge.textContent = 'Audio: Error';
    }
  }

  async function requestMicrophonePermissionAndEnumerate() {
    btnRequestAudioPerm.textContent = 'Requesting...';
    try {
      // Safe, single-frame audio probe to trigger macOS TCC dialog
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      testStream.getTracks().forEach(track => track.stop());
      btnRequestAudioPerm.textContent = 'Granted ✓';
      btnRequestAudioPerm.style.color = '#34d399';
      setTimeout(() => {
        btnRequestAudioPerm.textContent = 'Refresh';
        btnRequestAudioPerm.style.color = '';
      }, 2000);
      await enumerateAudioDevices(true);
      return true;
    } catch (err) {
      console.warn('[GlanceAI Renderer] Microphone permission rejected:', err);
      btnRequestAudioPerm.textContent = 'Denied ✗';
      btnRequestAudioPerm.style.color = '#fb7185';
      audioPipelineBadge.textContent = 'Audio: Denied';
      audioPipelineBadge.className = 'device-status-badge warning';
      alert('Microphone permission denied. To resolve, open macOS System Settings > Privacy & Security > Microphone and permit GlanceAI.');
      return false;
    }
  }

  btnRequestAudioPerm.addEventListener('click', () => {
    requestMicrophonePermissionAndEnumerate();
  });

  function updateChannelLabel() {
    const selectedText = audioDeviceSelect.options[audioDeviceSelect.selectedIndex]?.textContent || 'Mic';
    const lower = selectedText.toLowerCase();
    const isLoopback = lower.includes('blackhole') ||
                       lower.includes('loopback') ||
                       lower.includes('cable') ||
                       lower.includes('virtual') ||
                       lower.includes('stereo mix');
    currentChannelLabel.textContent = isLoopback ? '🎧 Interviewer (Isolated Loopback)' : '🎙️ Candidate Mic';
    currentChannelLabel.style.color = isLoopback ? '#34d399' : 'var(--text-dim)';
  }

  audioDeviceSelect.addEventListener('change', async () => {
    updateChannelLabel();
    const devId = audioDeviceSelect.value;
    if (devId) {
      audioDeviceSelect.dataset.preferredDevice = devId;
      await persistCredentials({ selectedAudioDevice: devId });
    }
    if (audioState === 'STREAMING') {
      stopAudioListening();
      await startAudioListening();
    }
  });

  if (navigator.mediaDevices) {
    navigator.mediaDevices.addEventListener('devicechange', () => enumerateAudioDevices(false));
  }

  // --------------------------------------------------------------------------
  // 3. Technical Lexicon & Phonetic Auto-Correction Engine
  // --------------------------------------------------------------------------
  // 100ms recorder slices: audio reaches Deepgram ~150ms sooner than 250ms slices (Deepgram suggests 20-100ms)
  const AUDIO_TIMESLICE_MS = 100;
  // ~25s of recent audio kept for the Groq Whisper fallback on Force Solve
  const RECENT_AUDIO_CHUNK_LIMIT = Math.round(25000 / AUDIO_TIMESLICE_MS);
  let recentAudioChunks = [];
  let micAudioHeaderBuffer = null;
  let currentDeepgramModel = 'nova-3';


  function sanitizeTechnicalTranscript(text) {
    if (typeof GlanceAIEngine !== 'undefined' && typeof GlanceAIEngine.sanitizeTechnicalTranscript === 'function') {
      return GlanceAIEngine.sanitizeTechnicalTranscript(text);
    }
    return text;
  }

  // --------------------------------------------------------------------------
  // 4. Live Audio Streaming Engine (Nova-3 + Groq Whisper Backup)
  // --------------------------------------------------------------------------
  async function startAudioListening() {
    if (audioState !== 'IDLE') return;

    const deepgramKey = inputDeepgramKey.value.trim();
    const groqKey = inputGroqKey.value.trim();
    const groqBackupKey = inputGroqBackupKey ? inputGroqBackupKey.value.trim() : '';

    if (!deepgramKey && !groqKey && !groqBackupKey) {
      paneConfig.classList.remove('collapsed');
      inputGroqKey.focus();
      appendTranscriptEntry(
        '⚠️ API Key required: Please enter GROQ_API_KEY (for Whisper fallback) or DEEPGRAM_API_KEY in settings.',
        true,
        true
      );
      showToast('⚠️ API Key required for audio capture');
      return;
    }

    const deviceId = audioDeviceSelect.value;
    audioState = 'STARTING';
    audioPipelineBadge.textContent = 'Connecting...';
    audioPipelineBadge.className = 'device-status-badge';
    btnAudioText.textContent = 'Initializing Audio...';
    recentAudioChunks = [];

    try {
      // 1. Detect if selected device is a virtual loopback driver (e.g. BlackHole, VB-Cable, Stereo Mix)
      const selectedLabel = (audioDeviceSelect.options[audioDeviceSelect.selectedIndex]?.textContent || '').toLowerCase();
      const isLoopback = /blackhole|loopback|cable|virtual|stereo mix|what u hear/i.test(selectedLabel);

      // Disable AEC and noise suppression on loopback to prevent WebRTC from phase-cancelling the interviewer's speech
      const constraints = {
        audio: {
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          echoCancellation: !isLoopback,
          noiseSuppression: !isLoopback,
          autoGainControl: !isLoopback,
          channelCount: 1
        }
      };
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Resilient track monitoring: auto-reacquire if meeting app or macOS claims/resets device
      mediaStream.getAudioTracks().forEach(track => {
        track.onended = () => {
          console.warn('[GlanceAI Audio] Mic audio track ended (device switched or detached). Re-acquiring...');
          if (audioState === 'STREAMING') {
            setTimeout(() => {
              if (audioState === 'STREAMING') {
                stopAudioListening();
                startAudioListening();
              }
            }, 600);
          }
        };
        track.onmute = () => {
          console.warn('[GlanceAI Audio] Mic audio track muted by system.');
        };
        track.onunmute = () => {
          console.log('[GlanceAI Audio] Mic audio track unmuted.');
        };
      });

      // 2. Select supported Opus mimeType
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      }

      mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);

      mediaRecorder.onerror = (e) => {
        console.error('[GlanceAI Audio] MediaRecorder error:', e);
        if (audioState === 'STREAMING') {
          setTimeout(() => {
            if (audioState === 'STREAMING') {
              stopAudioListening();
              startAudioListening();
            }
          }, 500);
        }
      };

      // 3. Connect Live Audio VU Meter for Instant Signal Confirmation
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 128;
        const audioSource = audioContext.createMediaStreamSource(mediaStream);
        audioSource.connect(analyserNode);

        const freqData = new Uint8Array(analyserNode.frequencyBinCount);
        const updateAudioMeter = () => {
          if (audioState !== 'STREAMING' && audioState !== 'STARTING') {
            if (vuFill) vuFill.style.width = '0%';
            return;
          }
          analyserNode.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < freqData.length; i++) {
            sum += freqData[i];
          }
          const avg = sum / freqData.length;
          const level = Math.min(100, Math.round((avg / 64) * 100));
          if (vuFill) vuFill.style.width = `${level}%`;
          vuAnimFrameId = requestAnimationFrame(updateAudioMeter);
        };
        updateAudioMeter();
      } catch (meterErr) {
        console.warn('[GlanceAI Audio] VU Meter initialization notice:', meterErr);
      }

      // If Deepgram key is available, connect to Deepgram live WebSocket
      if (deepgramKey) {
        connectDeepgramWebSocket(deepgramKey);
      } else {
        // Groq Whisper Standby Mode
        audioState = 'STREAMING';
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            if (!micAudioHeaderBuffer) {
              micAudioHeaderBuffer = event.data;
            }
            recentAudioChunks.push(event.data);
            if (recentAudioChunks.length > RECENT_AUDIO_CHUNK_LIMIT) recentAudioChunks.shift();
          }
        };
        mediaRecorder.start(AUDIO_TIMESLICE_MS);
        btnToggleAudio.classList.add('recording');
        btnAudioText.textContent = 'Stop Listening';
        transcriptPulse.classList.add('live');
        audioPipelineBadge.textContent = 'Audio: Groq Whisper';
        audioPipelineBadge.className = 'device-status-badge active';
        showToast('🎙️ Live Audio Active (Groq Whisper backup engine)');
      }

    } catch (err) {
      console.error('[GlanceAI Audio] Audio pipeline start failed:', err);
      audioState = 'IDLE';
      audioPipelineBadge.textContent = 'Audio: Denied';
      audioPipelineBadge.className = 'device-status-badge warning';
      btnAudioText.textContent = 'Start Listening';
      alert(`Audio device access error: ${err.message}. Please check macOS Microphone permissions.`);
    }
  }

  let deepgramReconnectAttempts = 0;

  function connectDeepgramWebSocket(deepgramKey, retryModel = null) {
    if (retryModel) {
      currentDeepgramModel = retryModel;
    }
    // Nova-3 with 600ms endpointing, 1200ms utterance end, English language constraint, punctuation, numerals, and native utterance_end detection
    const deepgramUrl = `wss://api.deepgram.com/v1/listen?${GlanceAIEngine.buildDeepgramListenQuery({ model: currentDeepgramModel, diarize: true, contextText: inputProjectContext?.value || '' })}`;

    deepgramSocket = new WebSocket(deepgramUrl, ['token', deepgramKey]);
    deepgramSocket.binaryType = 'arraybuffer';

    deepgramSocket.onopen = () => {
      if (audioState !== 'STARTING' && audioState !== 'STREAMING') return;
      audioState = 'STREAMING';
      deepgramReconnectAttempts = 0;
      logAudioEvent(`Mic live: Deepgram connected (${currentDeepgramModel}).`);

      // If we have a saved container header and MediaRecorder is already recording mid-session,
      // immediately dispatch the WebM container header to the newly opened socket!
      if (micAudioHeaderBuffer && mediaRecorder.state === 'recording') {
        try {
          deepgramSocket.send(micAudioHeaderBuffer);
          console.log('[GlanceAI Audio] Replayed WebM container header to new Deepgram WebSocket session.');
        } catch (hErr) {
          console.warn('[GlanceAI Audio] Failed to replay container header:', hErr);
        }
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          if (!micAudioHeaderBuffer) {
            micAudioHeaderBuffer = event.data;
          }
          recentAudioChunks.push(event.data);
          if (recentAudioChunks.length > RECENT_AUDIO_CHUNK_LIMIT) recentAudioChunks.shift();

          if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
            deepgramSocket.send(event.data);
          }
        }
      };

      // Flush or start MediaRecorder cleanly without throwing InvalidStateError on stopping/recording states
      if (mediaRecorder.state === 'recording') {
        try { mediaRecorder.requestData(); } catch (_) {}
      } else if (mediaRecorder.state === 'inactive') {
        try { mediaRecorder.start(AUDIO_TIMESLICE_MS); } catch (_) {}
      }

      btnToggleAudio.classList.add('recording');
      btnAudioText.textContent = 'Stop Listening';
      transcriptPulse.classList.add('live');
      audioPipelineBadge.textContent = `Audio: ${currentDeepgramModel.toUpperCase()} Live`;
      audioPipelineBadge.className = 'device-status-badge active';
    };

    deepgramSocket.onmessage = (event) => {
      handleDeepgramTranscriptMessage(event.data);
    };

    const thisSocket = deepgramSocket;

    deepgramSocket.onerror = (err) => {
      console.error('[GlanceAI Audio] Deepgram WebSocket error:', err);
    };

    deepgramSocket.onclose = (event) => {
      if (deepgramSocket !== thisSocket) return;
      logAudioEvent(`Mic Deepgram connection closed (code ${event.code}${event.reason ? `: ${event.reason}` : ''}).`);

      if (currentDeepgramModel === 'nova-3' && (event.code === 4001 || event.code === 1002)) {
        console.warn('[GlanceAI Audio] Code 4001/1002 on Nova-3. Falling back to Nova-2...');
        currentDeepgramModel = 'nova-2';
        setTimeout(() => {
          if (audioState === 'STREAMING') {
            connectDeepgramWebSocket(deepgramKey, 'nova-2');
          }
        }, 300);
      } else if (audioState === 'STREAMING') {
        deepgramReconnectAttempts = (deepgramReconnectAttempts || 0) + 1;
        if (deepgramReconnectAttempts <= 5) {
          const delay = Math.min(1000 * Math.pow(1.5, deepgramReconnectAttempts), 4000);
          console.warn(`[GlanceAI Audio] Auto-reconnecting Deepgram in ${delay}ms (attempt ${deepgramReconnectAttempts}/5)...`);
          setTimeout(() => {
            if (audioState === 'STREAMING' && deepgramSocket === thisSocket) {
              connectDeepgramWebSocket(deepgramKey);
            }
          }, delay);
        }
      }
    };
  }

  function stopAudioListening() {
    if (audioState === 'IDLE' || audioState === 'STOPPING') return;
    audioState = 'STOPPING';

    btnToggleAudio.classList.remove('recording');
    btnAudioText.textContent = 'Start Listening';
    transcriptPulse.classList.remove('live');
    audioPipelineBadge.textContent = 'Audio: Standby';
    audioPipelineBadge.className = 'device-status-badge';

    // 1. Teardown MediaRecorder cleanly
    if (mediaRecorder) {
      mediaRecorder.ondataavailable = null;
      if (mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (_) {}
      }
      mediaRecorder = null;
    }
    micAudioHeaderBuffer = null;

    // 2. Stop VU Meter & AudioContext
    if (vuAnimFrameId) {
      cancelAnimationFrame(vuAnimFrameId);
      vuAnimFrameId = null;
    }
    if (audioContext) {
      try { audioContext.close(); } catch (_) {}
      audioContext = null;
    }
    analyserNode = null;
    if (vuFill) vuFill.style.width = '0%';

    // 3. Stop all hardware audio tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        try { track.stop(); } catch (_) {}
      });
      mediaStream = null;
    }

    // 4. Close WebSocket cleanly without unhandled pipe errors
    if (deepgramSocket) {
      const sock = deepgramSocket;
      deepgramSocket = null;
      sock.onopen = null;
      sock.onmessage = null;
      sock.onerror = null;
      sock.onclose = null;
      try {
        if (sock.readyState === WebSocket.OPEN || sock.readyState === WebSocket.CONNECTING) {
          sock.close(1000, 'Normal Closure');
        }
      } catch (_) {}
    }

    // Finalize the mic's pending speech line (Meet audio keeps its own)
    finalizeLiveInterim('mic');

    audioState = 'IDLE';
    console.log('[GlanceAI Audio] Audio pipeline cleanly stopped.');
  }

  btnToggleAudio.addEventListener('click', () => {
    if (audioState === 'STREAMING' || audioState === 'STARTING') {
      micStoppedByUser = true;
      stopAudioListening();
    } else {
      micStoppedByUser = false;
      startAudioListening();
    }
  });

  // Deepgram Message Handler with UtteranceEnd & Phonetic Auto-Correction
  function handleDeepgramTranscriptMessage(jsonString, meta = {}) {
    try {
      const data = JSON.parse(jsonString);

      // Deepgram native VAD UtteranceEnd event (triggers response when speaker ceases)
      if (data.type === 'UtteranceEnd') {
        // A finalized question (or same-question continuation) is waiting: the speaker is done, answer now
        if (autoPilotPending && autoPilotPending.source === (meta.source || 'mic') && isAutoPilotEnabled) {
          scheduleAutoPilotTrigger(autoPilotPending.question, true, false, true, { continuation: autoPilotPending.continuation });
          return;
        }
        if (pendingDetectedQuestion && isAutoPilotEnabled && (!isCandidateSpeaking || meta.isInterviewer)) {
          const activeOrRecent = currentlyInferencingQuestion || lastAnsweredQuestionText;
          if (activeOrRecent && isSameQuestion(pendingDetectedQuestion, activeOrRecent)) {
            if (isGroqInferencing || (Date.now() - lastQuestionTriggerTime) < 4000) {
              pendingDetectedQuestion = null;
              return;
            }
          }
          scheduleAutoPilotTrigger(pendingDetectedQuestion, true);
        }
        return;
      }

      const alternative = data.channel?.alternatives?.[0];
      if (!alternative) return;

      const rawTranscript = alternative.transcript;
      if (!rawTranscript || rawTranscript.trim().length === 0) {
        // End-of-speech often arrives as an empty final after the words were already finalized:
        // treat it as the end of the question waiting on this same audio source
        const source = meta.source || 'mic';
        if (data.speech_final && autoPilotPending && autoPilotPending.source === source) {
          scheduleAutoPilotTrigger(autoPilotPending.question, false, false, true, { continuation: autoPilotPending.continuation });
        }
        return;
      }

      const sanitized = sanitizeTechnicalTranscript(rawTranscript);
      const isFinal = data.is_final;
      let speakerId = alternative.words?.[0]?.speaker;

      // Force speakerId 0 for Tab Audio (always interviewer)
      if (meta.isInterviewer || meta.source === 'tab') {
        speakerId = 0;
      }

      // speech_final: Deepgram detected the end of the utterance (endpointing silence), so Auto-Pilot need not wait again
      renderRealtimeTranscript(sanitized, isFinal, speakerId, { ...meta, speechFinal: Boolean(data.speech_final) });
    } catch (err) {
      console.warn('[GlanceAI Audio] Parse notice on Deepgram payload:', err);
    }
  }

  let lastFinalizedSpeaker = null;
  let lastFinalizedTime = 0;
  let lastFinalizedEntrySpan = null; // reference to the last finalized <div> text element for merging
  const MERGE_WINDOW_MS = 2500; // merge consecutive same-speaker utterances within 2.5s

  function renderRealtimeTranscript(text, isFinal, speakerId = undefined, meta = {}) {
    if (transcriptEmptyState.style.display !== 'none') {
      transcriptEmptyState.style.display = 'none';
    }

    const isTabAudio = Boolean(meta && (meta.isInterviewer || meta.source === 'tab'));
    const sourceKey = isTabAudio ? 'tab' : 'mic';

    // --- Determine speaker label BEFORE deciding whether to merge ---
    let speakerLabel = 'INTERVIEWER';
    let tagBg = 'rgba(56, 189, 248, 0.2)';
    let tagColor = '#7dd3fc';

    const isLoopbackActive = Boolean(currentChannelLabel && currentChannelLabel.textContent.includes('Loopback'));
    const isTabAudioLive = (tabAudioState === 'STREAMING');

    if (isTabAudio) {
      // Audio from Chrome extension tab capture → always the interviewer
      speakerLabel = 'INTERVIEWER (MEET)';
      tagBg = 'rgba(52, 211, 153, 0.2)';
      tagColor = '#6ee7b7';
    } else if (isTabAudioLive) {
      // KEY FIX: When tab audio is streaming the interviewer's voice from Meet,
      // the mic is exclusively picking up the CANDIDATE's voice.
      // No manual toggle or NLP heuristic needed.
      speakerLabel = 'CANDIDATE';
      tagBg = 'rgba(168, 85, 247, 0.15)';
      tagColor = '#c084fc';
    } else if (isLoopbackActive) {
      // Loopback device: use Deepgram's diarization speakerId
      speakerLabel = speakerId === 0 ? 'INTERVIEWER' : 'CANDIDATE';
      if (speakerId === 0) {
        tagBg = 'rgba(56, 189, 248, 0.2)';
        tagColor = '#7dd3fc';
      } else {
        tagBg = 'rgba(168, 85, 247, 0.15)';
        tagColor = '#c084fc';
      }
    } else if (isCandidateSpeaking) {
      speakerLabel = 'CANDIDATE';
      tagBg = 'rgba(168, 85, 247, 0.15)';
      tagColor = '#c084fc';
    } else {
      // Direct Microphone while in Interviewer Listening Mode (!isCandidateSpeaking)
      const isCandidateSpeech = isCandidateHonorificAddress(text) || (isDeclarativeAnswer(text) && !isLikelyInterviewQuestion(text));
      if (isCandidateSpeech) {
        speakerLabel = 'CANDIDATE';
        tagBg = 'rgba(168, 85, 247, 0.15)';
        tagColor = '#c084fc';
      } else {
        speakerLabel = 'INTERVIEWER';
        tagBg = 'rgba(56, 189, 248, 0.2)';
        tagColor = '#7dd3fc';
      }
    }

    // --- Merge check: can we append to the previous finalized entry? ---
    const now = Date.now();
    const canMerge = isFinal &&
      lastFinalizedEntrySpan &&
      lastFinalizedSpeaker === speakerLabel &&
      (now - lastFinalizedTime) < MERGE_WINDOW_MS &&
      lastFinalizedEntrySpan.parentElement; // ensure DOM node is still attached

    const live = liveInterims[sourceKey];
    if (canMerge) {
      // If an interim line was created for this utterance, remove it: its text is merged into the previous entry
      if (live && live.span.parentElement) {
        const parentEntry = live.span.closest('.transcript-entry');
        if (parentEntry && parentEntry !== lastFinalizedEntrySpan.closest('.transcript-entry')) {
          parentEntry.remove();
        }
      }
      delete liveInterims[sourceKey];

      // Merge into existing entry instead of creating a new one
      lastFinalizedEntrySpan.textContent += ' ' + text;
      if (fullTranscripts.length > 0) {
        fullTranscripts[fullTranscripts.length - 1] += ' ' + text;
      } else {
        fullTranscripts.push(text);
      }
      if (fullTranscriptsWithSpeakers.length > 0) {
        fullTranscriptsWithSpeakers[fullTranscriptsWithSpeakers.length - 1] += ' ' + text;
      } else {
        fullTranscriptsWithSpeakers.push(`${speakerLabel}: ${text}`);
      }
      lastFinalizedTime = now;
      // Only the new segment: Auto-Pilot assembles the interviewer's turn itself, so nothing is appended twice
      handleAutoPilotStream(text, true, speakerId, { ...meta, speakerLabel });
      updateWordCount();
      transcriptLog.scrollTop = transcriptLog.scrollHeight;
      return;
    }

    let lineSpan = live ? live.span : null;
    if (!lineSpan) {
      const entryWrap = document.createElement('div');
      entryWrap.className = 'transcript-entry';

      const entryHeader = document.createElement('div');
      entryHeader.className = 'transcript-entry-header';

      const tag = document.createElement('span');
      tag.className = 'transcript-tag';
      tag.textContent = speakerLabel;
      tag.style.background = tagBg;
      tag.style.color = tagColor;

      const time = document.createElement('span');
      time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      entryHeader.appendChild(tag);
      entryHeader.appendChild(time);
      entryWrap.appendChild(entryHeader);

      lineSpan = document.createElement('div');
      lineSpan.className = 'transcript-interim';
      entryWrap.appendChild(lineSpan);

      transcriptLog.appendChild(entryWrap);
    }

    if (isFinal) {
      lineSpan.className = 'transcript-text';
      lineSpan.textContent = text;
      fullTranscripts.push(text);
      fullTranscriptsWithSpeakers.push(`${speakerLabel}: ${text}`);
      delete liveInterims[sourceKey];
      // Store merge state for next utterance
      lastFinalizedSpeaker = speakerLabel;
      lastFinalizedTime = now;
      lastFinalizedEntrySpan = lineSpan;
      handleAutoPilotStream(text, true, speakerId, { ...meta, speakerLabel });
    } else {
      lineSpan.className = 'transcript-interim';
      lineSpan.textContent = text;
      liveInterims[sourceKey] = { span: lineSpan, text, speakerLabel, updatedAt: now };
      handleAutoPilotStream(text, false, speakerId, { ...meta, speakerLabel });
    }

    updateWordCount();
    transcriptLog.scrollTop = transcriptLog.scrollHeight;
  }

  // Commits a source's live line as final (e.g. the mic stops mid-sentence)
  function finalizeLiveInterim(sourceKey) {
    const live = liveInterims[sourceKey];
    delete liveInterims[sourceKey];
    if (!live || !live.text) return;
    live.span.className = 'transcript-text';
    fullTranscripts.push(live.text);
    fullTranscriptsWithSpeakers.push(`${live.speakerLabel}: ${live.text}`);
    lastFinalizedSpeaker = live.speakerLabel;
    lastFinalizedTime = Date.now();
    lastFinalizedEntrySpan = live.span;
    updateWordCount();
    const meta = sourceKey === 'tab' ? { source: 'tab', isInterviewer: true } : {};
    handleAutoPilotStream(live.text, true, undefined, { ...meta, speakerLabel: live.speakerLabel });
  }

  // The live lines, oldest first (for the last-heard preview, companion feed and manual solve)
  function liveInterimLines() {
    return Object.values(liveInterims).filter(live => live.text).sort((a, b) => a.updatedAt - b.updatedAt);
  }

  // Collapsed transcript shows only the latest line ("SPEAKER: text"); the full log is one click away
  function renderLastHeard(line, kind = '') {
    if (!transcriptLastHeard) return;
    transcriptLastHeard.textContent = '';
    if (!line) {
      const empty = document.createElement('span');
      empty.className = 'last-heard-empty';
      empty.textContent = 'Waiting for audio — click Start Listening';
      transcriptLastHeard.appendChild(empty);
      transcriptLastHeard.title = '';
      return;
    }
    const match = line.match(/^([A-Z][A-Z ()]*):\s*([\s\S]*)$/);
    const speaker = match ? match[1] : '';
    const text = match ? match[2] : line;
    if (speaker) {
      const tag = document.createElement('span');
      tag.className = 'last-heard-speaker' + (kind ? ` ${kind}` : (speaker.startsWith('CANDIDATE') ? ' candidate' : ''));
      tag.textContent = speaker.replace(' (MEET)', '');
      transcriptLastHeard.appendChild(tag);
    }
    transcriptLastHeard.appendChild(document.createTextNode(text));
    transcriptLastHeard.title = text;
  }

  try {
    if (localStorage.getItem('glanceai_transcript_expanded') === 'true') paneTranscript?.classList.remove('collapsed');
  } catch (_) {}
  btnToggleTranscript?.addEventListener('click', () => {
    const expanded = paneTranscript.classList.toggle('collapsed') === false;
    btnToggleTranscript.title = expanded ? 'Collapse to the last line heard' : 'Show full transcript';
    try { localStorage.setItem('glanceai_transcript_expanded', String(expanded)); } catch (_) {}
    if (expanded) transcriptLog.scrollTop = transcriptLog.scrollHeight;
  });

  function appendTranscriptEntry(text, isSystem = false, isError = false) {
    renderLastHeard(`${isSystem ? 'SYSTEM' : 'AUDIO'}: ${text}`, isSystem ? 'system' : '');
    if (transcriptEmptyState.style.display !== 'none') {
      transcriptEmptyState.style.display = 'none';
    }
    const entry = document.createElement('div');
    entry.className = 'transcript-entry';
    entry.innerHTML = `
      <div class="transcript-entry-header">
        <span class="transcript-tag" style="${isError ? 'background: rgba(244,63,94,0.2); color: #fda4af;' : ''}">${isSystem ? 'SYSTEM' : 'AUDIO'}</span>
        <span>${new Date().toLocaleTimeString()}</span>
      </div>
      <div class="transcript-text" style="${isError ? 'color: #fb7185;' : ''}">${escapeHtml(text)}</div>
    `;
    transcriptLog.appendChild(entry);
    transcriptLog.scrollTop = transcriptLog.scrollHeight;
  }

  // --------------------------------------------------------------------------
  // Conversational Turn Management & Anti-Confusion Checkpointing
  // --------------------------------------------------------------------------
  let lastAnsweredTranscriptIndex = 0;
  let answeredTurnCount = 0;

  function markTranscriptAsAnswered(summary = '') {
    // Mark all existing entries as answered/dimmed
    const entries = transcriptLog.querySelectorAll('.transcript-entry:not(.answered)');
    entries.forEach(entry => entry.classList.add('answered'));

    answeredTurnCount++;
    lastAnsweredTranscriptIndex = fullTranscripts.length;
    autoPilotRecentSentences = []; // Reset auto-pilot buffer

    // Insert visual turn divider
    const divider = document.createElement('div');
    divider.className = 'transcript-turn-divider';
    divider.innerHTML = `<span class="transcript-turn-badge">✓ Question #${answeredTurnCount} Answered</span>`;
    transcriptLog.appendChild(divider);
    transcriptLog.scrollTop = transcriptLog.scrollHeight;
  }

  function getActiveTranscriptWindow() {
    const freshEntries = fullTranscripts.slice(lastAnsweredTranscriptIndex);
    const activeInterimText = (liveInterims.tab || liveInterims.mic || {}).text || '';
    let text = '';
    if (freshEntries.length > 0) {
      text = freshEntries.join('\n');
    } else if (activeInterimText) {
      // If no fresh final entries yet, but speech is actively streaming in interim, use interim!
      text = activeInterimText;
    } else if (fullTranscripts.length > 0) {
      // Fallback: only if user manually triggers and no fresh audio or interim text appeared at all, take ONLY the single latest entry
      text = fullTranscripts.slice(-1).join('\n');
    }

    if (freshEntries.length > 0 && activeInterimText) {
      text = text ? `${text}\n${activeInterimText}` : activeInterimText;
    }
    return text.trim();
  }

  // Extracts prior context (up to 5 past transcript sentences) for coreference resolution
  function getPriorTranscriptContext() {
    if (lastAnsweredTranscriptIndex > 0) {
      const priorSlice = fullTranscripts.slice(0, lastAnsweredTranscriptIndex);
      return priorSlice.slice(-5).join('\n');
    }
    return '';
  }

  btnClearTranscript.addEventListener('click', () => {
    fullTranscripts = [];
    fullTranscriptsWithSpeakers = [];
    lastFinalizedSpeaker = null;
    lastFinalizedTime = 0;
    lastFinalizedEntrySpan = null;
    for (const sourceKey of Object.keys(liveInterims)) delete liveInterims[sourceKey];
    lastAnsweredTranscriptIndex = 0;
    answeredTurnCount = 0;
    autoPilotRecentSentences = [];
    autoPilotPending = null;
    continuationArmedAt = 0;
    conversationHistory = [];
    currentActiveQuestion = '';
    currentFollowUpCount = 0;
    if (activeQuestionCard) activeQuestionCard.style.display = 'none';
    transcriptLog.innerHTML = '';
    transcriptEmptyState.style.display = 'flex';
    transcriptLog.appendChild(transcriptEmptyState);
    updateWordCount(true);
  });

  if (btnNewTranscriptTurn) {
    btnNewTranscriptTurn.addEventListener('click', () => {
      markTranscriptAsAnswered('Manual Reset');
      showToast('⚡ Turn reset: Ready for next question');
    });
  }

  let lastCompanionBroadcastTime = 0;
  let companionBroadcastTimer = null;

  function updateWordCount(forceBroadcast = false) {
    const totalWords = fullTranscripts.join(' ').split(/\s+/).filter(Boolean).length;
    transcriptWordCount.textContent = `${totalWords} words captured`;
    const liveLines = liveInterimLines().map(live => `${live.speakerLabel}: ${live.text}`);
    renderLastHeard(liveLines[liveLines.length - 1] || fullTranscriptsWithSpeakers[fullTranscriptsWithSpeakers.length - 1] || '');
    if (window.glanceaiAPI.broadcastTranscriptToCompanion) {
      const now = Date.now();
      const fullText = [...fullTranscriptsWithSpeakers, ...liveLines].join('\n');
      if (forceBroadcast || now - lastCompanionBroadcastTime >= 1000) {
        clearTimeout(companionBroadcastTimer);
        lastCompanionBroadcastTime = now;
        window.glanceaiAPI.broadcastTranscriptToCompanion(fullText);
      } else {
        clearTimeout(companionBroadcastTimer);
        companionBroadcastTimer = setTimeout(() => {
          lastCompanionBroadcastTime = Date.now();
          window.glanceaiAPI.broadcastTranscriptToCompanion(fullText);
        }, 800);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Auto-Pilot Hands-Free Question Detection Engine (Edge-Case Fortified)
  // --------------------------------------------------------------------------
  // Auto-Pilot Hands-Free Question Detection Engine (Multi-Turn Enhanced)
  // --------------------------------------------------------------------------
  let isAutoPilotEnabled = true;
  let isCandidateSpeaking = false;
  let isGroqInferencing = false;
  let currentlyInferencingQuestion = null;
  let autoPilotSilenceTimer = null;
  let autoPilotFirstDetectTime = null;
  let autoPilotRecentSentences = [];
  const AUTOPILOT_SILENCE_DELAY = 1200;       // 1.2s natural pause for general speech
  const AUTOPILOT_FAST_SILENCE_DELAY = 700;   // 700ms for syntactically complete questions (ends with ?)
  const AUTOPILOT_INTERIM_DELAY = 2500;       // fallback only: finals + Deepgram end-of-speech normally answer first
  const AUTOPILOT_MAX_WAIT = 8000;            // 8s hard max: long questions rely on Deepgram end-of-speech / UtteranceEnd
  // After Deepgram's end-of-speech (speech_final, already 600ms of silence): only a short grace period remains
  const AUTOPILOT_END_OF_SPEECH_DELAY = 150;        // syntactically complete question
  const AUTOPILOT_END_OF_SPEECH_LOOSE_DELAY = 400;  // question-like but less clearly finished
  // A final WITHOUT speech_final means the speaker has not paused yet (Deepgram docs): wait for end-of-speech, capped
  const AUTOPILOT_AWAIT_END_OF_SPEECH_DELAY = 2000;
  // The interviewer's turn: consecutive finals less than this apart belong to the same question
  const TURN_SENTENCE_GAP_MS = 8000;
  // Interviewer resuming within this window after Auto-Pilot fired is still asking the same question
  const CONTINUATION_WINDOW_MS = 2500;
  const CONTINUATION_EXPIRY_MS = 15000;
  let lastAnsweredQuestionText = '';
  let lastQuestionTriggerTime = 0;
  let pendingDetectedQuestion = null;
  // Final-transcript question waiting on its Auto-Pilot timer, and which audio source (tab / mic) it came from
  let autoPilotPending = null;
  // Set when the interviewer starts speaking again right after Auto-Pilot fired (same question, more detail)
  let continuationArmedAt = 0;

  // Multi-Turn Conversation Memory across questions and follow-ups
  let conversationHistory = [];
  let currentActiveQuestion = '';
  let currentFollowUpCount = 0;

  function isCandidateHonorificAddress(text) {
    if (typeof GlanceAIEngine !== 'undefined' && typeof GlanceAIEngine.isCandidateHonorificAddress === 'function') {
      return GlanceAIEngine.isCandidateHonorificAddress(text);
    }
    return false;
  }

  function isDeclarativeAnswer(text) {
    if (typeof GlanceAIEngine !== 'undefined' && typeof GlanceAIEngine.isDeclarativeAnswer === 'function') {
      return GlanceAIEngine.isDeclarativeAnswer(text);
    }
    return false;
  }

  function isLikelyInterviewQuestion(text) {
    if (typeof GlanceAIEngine !== 'undefined' && typeof GlanceAIEngine.isLikelyInterviewQuestion === 'function') {
      return GlanceAIEngine.isLikelyInterviewQuestion(text);
    }
    return false;
  }

  function isSameQuestion(q1, q2) {
    if (typeof GlanceAIEngine !== 'undefined' && typeof GlanceAIEngine.isSameQuestion === 'function') {
      return GlanceAIEngine.isSameQuestion(q1, q2);
    }
    const clean1 = (q1 || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const clean2 = (q2 || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean1 || !clean2) return false;
    if (clean1 === clean2) return true;
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    return false;
  }

  function isContinuationClause(text) {
    if (typeof GlanceAIEngine !== 'undefined' && typeof GlanceAIEngine.isContinuationClause === 'function') {
      return GlanceAIEngine.isContinuationClause(text);
    }
    return /^(where|which|that|when|who|and|specifically|in\s+which|how\s+you|where\s+you|what\s+you|how\s+to|to\s+solve|while|with)\b/i.test((text || '').trim());
  }

  function extractSolutionSummary(solutionText) {
    if (!solutionText) return '';
    const quoteMatch = solutionText.match(/blockquote>([\s\S]*?)<\/blockquote>/i) || solutionText.match(/>\s*"(.*?)"/);
    const quote = quoteMatch ? quoteMatch[1].trim() : '';

    const codeMatch = solutionText.match(/```(?:cpp|python|java|go)?([\s\S]*?)```/i);
    const code = codeMatch ? codeMatch[0].trim() : '';

    if (quote && code) {
      return `Key Spoken Answer: "${quote}"\nCode Snippet:\n${code.substring(0, 300)}`;
    }
    if (quote) {
      return `Key Spoken Answer: "${quote}"`;
    }
    return solutionText.substring(0, 300);
  }

  /**
   * endOfSpeech: true = Deepgram speech_final (speaker paused), false = final while still speaking,
   * undefined = unknown source (old fixed delays). continuation: merged follow-on to the question just answered,
   * so it must not be suppressed as a duplicate of it.
   */
  // Merged transcript entries repeat sentences already asked (same-speaker finals within 2.5s join into one
  // entry): drop those leading sentences so an answered question is never sent again with the new one
  function currentTurnText() {
    const turn = [];
    for (let i = autoPilotRecentSentences.length - 1; i >= 0; i--) {
      const s = autoPilotRecentSentences[i];
      if (turn.length && turn[0].t - s.t > TURN_SENTENCE_GAP_MS) break;
      turn.unshift(s);
    }
    return turn
      .map(s => s.text)
      .filter(t => !/^(alright|okay|ok|sure|yes|yeah|cool|great|hmm|so|right)[.?!,]?$/i.test(t.trim()))
      .join(' ');
  }

  function stripAlreadyAsked(text, asked) {
    if (!asked) return text;
    const sentences = text.split(/(?<=[.?!])\s+/);
    while (sentences.length && asked.includes(sentences[0].trim())) sentences.shift();
    return sentences.join(' ').trim();
  }

  function scheduleAutoPilotTrigger(questionToAnswer, forceImmediate = false, isInterim = false, endOfSpeech = undefined, { continuation = false } = {}) {
    if (isCandidateSpeaking) return;

    if (!autoPilotFirstDetectTime) {
      autoPilotFirstDetectTime = Date.now();
    }

    // Hard Max Noise Timeout: If speech has been trickling for > 3.2s, force trigger now only when not mid-interim-sentence
    const elapsed = Date.now() - autoPilotFirstDetectTime;
    if (elapsed >= AUTOPILOT_MAX_WAIT && !isInterim) {
      forceImmediate = true;
    }

    clearTimeout(autoPilotSilenceTimer);

    if (btnToggleAutopilot && autopilotLabel) {
      btnToggleAutopilot.className = 'btn-autopilot detecting';
      autopilotLabel.textContent = '⚡ Question Detected...';
    }

    const capturedQuestion = (questionToAnswer || pendingDetectedQuestion || '').trim();

    // Trailing connector check: if the sentence ends with a mid-sentence connector (e.g. "and", "or", "because"),
    // apply a longer debounce pause rather than aborting, so the question is never dropped!
    const isTrailingConnector = /\b(and|or|but|because|so|if|then|with|also|plus|such as|for example)\s*[.…]?$/i.test(capturedQuestion);

    // Instant Visual Feedback: show active question immediately so the user knows HUD locked on!
    if (capturedQuestion && capturedQuestion.length > 5 && activeQuestionCard && activeQuestionText) {
      activeQuestionText.textContent = capturedQuestion.length > 180 ? capturedQuestion.substring(0, 180) + '...' : capturedQuestion;
      activeQuestionText.title = capturedQuestion;
      activeQuestionCard.style.display = 'flex';
    }

    const executeTrigger = async () => {
      autoPilotFirstDetectTime = null;
      autoPilotPending = null;
      continuationArmedAt = 0;
      if (!isAutoPilotEnabled || (audioState !== 'STREAMING' && tabAudioState !== 'STREAMING')) {
        return;
      }
      if (isCandidateSpeaking && !forceImmediate) {
        return;
      }

      const qToExecute = (questionToAnswer || pendingDetectedQuestion || capturedQuestion || '').trim();
      if (!qToExecute || qToExecute.length < 5) {
        return;
      }

      // Check if we are currently inferencing this exact question (a continuation is a superset of it, never a duplicate)
      if (isGroqInferencing) {
        const activeQ = currentlyInferencingQuestion || lastAnsweredQuestionText;
        if (!continuation && activeQ && isSameQuestion(qToExecute, activeQ)) {
          console.log('[GlanceAI AutoPilot] Duplicate trigger ignored — already generating answer for:', qToExecute);
          pendingDetectedQuestion = null;
          return;
        }

        // Genuine interruption with a DIFFERENT question: pre-empt ongoing answer
        console.log('[GlanceAI AutoPilot] Interviewer interrupted ongoing answer with a NEW question! Pre-empting for:', qToExecute);
        try { window.glanceaiAPI.abortGroqStream(); } catch (_) {}
      } else if (!continuation && lastAnsweredQuestionText && (Date.now() - lastQuestionTriggerTime) < 4000) {
        // Question was already answered very recently (< 4s) and inference has finished
        if (isSameQuestion(qToExecute, lastAnsweredQuestionText)) {
          console.log('[GlanceAI AutoPilot] Suppressing duplicate trigger — recently answered within 4s:', qToExecute);
          pendingDetectedQuestion = null;
          return;
        }
      }

      console.log('[GlanceAI AutoPilot] Silence confirmed! Auto-triggering Groq for:', qToExecute);
      lastAnsweredQuestionText = qToExecute;
      lastQuestionTriggerTime = Date.now();

      if (btnToggleAutopilot && autopilotLabel) {
        btnToggleAutopilot.className = 'btn-autopilot reasoning';
        autopilotLabel.textContent = '⚡ Answering...';
      }

      // Reset pending buffers immediately so no duplicate triggers occur
      pendingDetectedQuestion = null;
      autoPilotRecentSentences = [];

      markTranscriptAsAnswered(qToExecute);
      showToast('⚡ Auto-Pilot: Answering question...');

      try {
        // Audio/voice questions never attach stale screenshots
        await executeGroqInference({
          kind: 'spoken_question',
          question: qToExecute,
          priorContext: getPriorTranscriptContext()
        });
      } catch (err) {
        console.error('[GlanceAI AutoPilot] Inference error:', err);
      } finally {
        setTimeout(() => {
          if (btnToggleAutopilot && autopilotLabel && isAutoPilotEnabled && !isGroqInferencing) {
            btnToggleAutopilot.className = 'btn-autopilot active';
            autopilotLabel.textContent = '⚡ Auto-Pilot: ON';
          }
        }, 1500);
      }
    };

    if (forceImmediate) {
      executeTrigger();
    } else {
      const isComplete = capturedQuestion.endsWith('?') || (
        /^(what|why|how|can|could|would|should|give me|explain|describe|walk me)\b/i.test(capturedQuestion) &&
        capturedQuestion.split(/\s+/).length >= 5
      );
      // A pause right after a function word ("tell me about the...") is a mid-question breath, not the end
      const endsMidPhrase = /\b(about|the|a|an|of|for|to|in|on|your|my|is|are|was|like|um|uh|basically)\s*[.…,]?$/i.test(capturedQuestion);
      let delay;
      if (isInterim) {
        delay = AUTOPILOT_INTERIM_DELAY;
      } else if (isTrailingConnector) {
        delay = 2200;
      } else if (endOfSpeech === true && !endsMidPhrase) {
        delay = isComplete ? AUTOPILOT_END_OF_SPEECH_DELAY : AUTOPILOT_END_OF_SPEECH_LOOSE_DELAY;
      } else if (endOfSpeech === false) {
        // Still speaking: Deepgram's end-of-speech (speech_final / UtteranceEnd) will cut this short
        delay = AUTOPILOT_AWAIT_END_OF_SPEECH_DELAY;
      } else {
        delay = isComplete ? AUTOPILOT_FAST_SILENCE_DELAY : AUTOPILOT_SILENCE_DELAY;
      }
      autoPilotSilenceTimer = setTimeout(executeTrigger, delay);
    }
  }

  function handleAutoPilotStream(text, isFinal, speakerId = undefined, meta = {}) {
    if (!isAutoPilotEnabled || (audioState !== 'STREAMING' && tabAudioState !== 'STREAMING')) return;
    if (isCandidateSpeaking && !meta?.isInterviewer && meta?.source !== 'tab') return;
    // Mic speech during active tab audio capture is the candidate talking, not the interviewer
    if (tabAudioState === 'STREAMING' && meta?.source !== 'tab' && !meta?.isInterviewer) return;
    // CRITICAL: Under no circumstances should candidate speech trigger Groq inference!
    if (meta?.speakerLabel === 'CANDIDATE') return;
    if (!text || text.trim().length === 0) return;

    const trimmed = text.trim();

    // If this speech segment is obviously a declarative answer/explanation, ignore it
    if (isDeclarativeAnswer(trimmed)) {
      return;
    }

    const now = Date.now();
    const source = meta?.source || 'mic';
    const sinceTrigger = now - lastQuestionTriggerTime;
    // Tab audio and loopback carry only the interviewer, so speech right after a trigger is the interviewer continuing
    const interviewerOnlySource = source === 'tab' || meta?.isInterviewer ||
      Boolean(currentChannelLabel && currentChannelLabel.textContent.includes('Loopback'));

    // Interviewer resumed right after Auto-Pilot fired ("…what is a deadlock? [pause] How would you prevent it?",
    // problem statement → "Write the code in C++"): it is the same question with more detail, not a new one
    if (lastAnsweredQuestionText && !isSameQuestion(trimmed, lastAnsweredQuestionText) &&
        ((interviewerOnlySource && sinceTrigger < CONTINUATION_WINDOW_MS) || (isContinuationClause(trimmed) && sinceTrigger < 4000))) {
      if (!continuationArmedAt) continuationArmedAt = now;
    }
    const continuationArmed = continuationArmedAt && (now - continuationArmedAt) < CONTINUATION_EXPIRY_MS;

    if (!isFinal) {
      // Interim transcripts are cumulative hypotheses: never merge or fire on them while a continuation is forming
      if (continuationArmed) return;
      const activeOrRecent = currentlyInferencingQuestion || lastAnsweredQuestionText;
      if (activeOrRecent && isSameQuestion(trimmed, activeOrRecent)) {
        if (isGroqInferencing || (Date.now() - lastQuestionTriggerTime) < 4000) {
          return;
        }
      }
      // A finalized turn is already waiting on Deepgram's end-of-speech: let it, rather than a raw fragment, answer
      if (autoPilotPending && !autoPilotPending.continuation) return;
      const turnSoFar = currentTurnText();
      const interimQuestion = turnSoFar ? `${turnSoFar} ${trimmed}` : trimmed;
      pendingDetectedQuestion = interimQuestion;
      if (isLikelyInterviewQuestion(interimQuestion)) {
        scheduleAutoPilotTrigger(interimQuestion, false, true);
      }
      return;
    }

    if (continuationArmed) {
      // Stays armed until the re-ask fires, so a continuation spoken as several finals keeps accumulating
      const base = (autoPilotPending && autoPilotPending.continuation) ? autoPilotPending.question : lastAnsweredQuestionText;
      const newPart = stripAlreadyAsked(trimmed, base);
      const merged = newPart ? `${base} ${newPart}` : base;
      if (merged !== base) {
        console.log('[GlanceAI AutoPilot] Same question continued; re-asking with the full turn:', merged);
        pendingDetectedQuestion = merged;
        autoPilotPending = { question: merged, source, continuation: true };
        scheduleAutoPilotTrigger(merged, false, false, meta?.speechFinal, { continuation: true });
      }
      return;
    }
    continuationArmedAt = 0;

    const fresh = stripAlreadyAsked(trimmed, lastAnsweredQuestionText);
    if (!fresh) return;

    // Keep the interviewer's current turn: finals spoken close together, minus anything already answered
    autoPilotRecentSentences = autoPilotRecentSentences.filter(s => !isSameQuestion(s.text, lastAnsweredQuestionText));
    const previous = autoPilotRecentSentences[autoPilotRecentSentences.length - 1];
    // Same-speaker finals within 2.5s arrive merged (previous text + new text): replace rather than repeat
    if (previous && fresh.startsWith(previous.text)) autoPilotRecentSentences.pop();
    autoPilotRecentSentences.push({ text: fresh, t: now });
    if (autoPilotRecentSentences.length > 5) {
      autoPilotRecentSentences.shift();
    }
    // The question is the whole turn: lead-ins ("I see you worked on payments…"), problem statements, and the ask
    // itself, so compound and multi-part questions are never cut down to their last sentence
    const candidateText = currentTurnText();

    if (candidateText && isLikelyInterviewQuestion(candidateText)) {
      const activeOrRecent = currentlyInferencingQuestion || lastAnsweredQuestionText;
      if (activeOrRecent && isSameQuestion(candidateText, activeOrRecent)) {
        if (isGroqInferencing || (Date.now() - lastQuestionTriggerTime) < 4000) {
          return;
        }
      }
      pendingDetectedQuestion = candidateText;
      autoPilotPending = { question: candidateText, source, continuation: false };
      scheduleAutoPilotTrigger(candidateText, false, false, meta?.speechFinal);
    }
  }

  // --------------------------------------------------------------------------
  // Candidate Speaking Toggle & Emergency Actions
  // --------------------------------------------------------------------------
  function toggleCandidateSpeaking() {
    isCandidateSpeaking = !isCandidateSpeaking;
    if (btnSpeakerMode && speakerModeText) {
      if (isCandidateSpeaking) {
        btnSpeakerMode.classList.add('candidate');
        speakerModeText.textContent = '🗣️ Candidate Speaking (Paused)';
        showToast('🗣️ Candidate Speaking: Auto-Pilot paused so your voice won\'t trigger answers.');
      } else {
        btnSpeakerMode.classList.remove('candidate');
        speakerModeText.textContent = '🎙️ Interviewer Speaking';
        showToast('🎙️ Interviewer Speaking: Auto-Pilot active.');
      }
    }
  }

  if (btnSpeakerMode) {
    btnSpeakerMode.addEventListener('click', toggleCandidateSpeaking);
  }

  async function triggerEmergencyForceSolve() {
    let activeText = getActiveTranscriptWindow();

    // Zero-Downtime Groq Whisper LPU Fallback:
    // If no text was transcribed via Deepgram yet, but audio chunks were buffered,
    // dispatch the audio buffer directly to Groq Whisper LPU!
    if ((!activeText || activeText.length < 5) && recentAudioChunks.length > 0 && window.glanceaiAPI?.transcribeAudioGroq) {
      showToast('⚡ Transcribing speech with Groq Whisper LPU...');
      try {
        const chunksToSend = (micAudioHeaderBuffer && recentAudioChunks[0] !== micAudioHeaderBuffer)
          ? [micAudioHeaderBuffer, ...recentAudioChunks]
          : recentAudioChunks;
        const audioBlob = new Blob(chunksToSend, { type: mediaRecorder?.mimeType || 'audio/webm' });
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result;
            const commaIdx = res.indexOf(',');
            resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res);
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(audioBlob);
        const audioBase64 = await base64Promise;

        const res = await window.glanceaiAPI.transcribeAudioGroq({
          audioBase64,
          mimeType: mediaRecorder?.mimeType || 'audio/webm'
        });

        if (res && res.success && res.text && res.text.trim().length > 3) {
          activeText = sanitizeTechnicalTranscript(res.text.trim());
          appendTranscriptEntry(activeText, false, false);
          fullTranscripts.push(activeText);
          recentAudioChunks = [];
        }
      } catch (whisperErr) {
        console.warn('[GlanceAI Audio] Groq Whisper fallback notice:', whisperErr);
      }
    }

    if (!activeText || activeText.length < 5) {
      showToast('⚠️ No audio captured yet to solve. Click Start Listening first.');
      return;
    }

    // Clear recent audio chunks so the same audio is not re-transcribed on the next force solve
    recentAudioChunks = [];

    if (btnToggleAutopilot && autopilotLabel) {
      btnToggleAutopilot.className = 'btn-autopilot reasoning';
      autopilotLabel.textContent = '⚡ Force Solving...';
    }

    // Isolate the latest single question/instruction instead of bundling all past utterances
    let targetQuestion = activeText;
    let priorContext = '';
    if (typeof GlanceAIEngine !== 'undefined' && typeof GlanceAIEngine.extractLatestQuestionFromTranscript === 'function') {
      const extracted = GlanceAIEngine.extractLatestQuestionFromTranscript(activeText);
      if (extracted.targetQuestion) {
        targetQuestion = extracted.targetQuestion;
        priorContext = extracted.priorContext;
      }
    }

    const cleanQuestion = sanitizeTechnicalTranscript(targetQuestion);

    markTranscriptAsAnswered(cleanQuestion);
    showToast('⚡ Force Solving latest question...');

    executeGroqInference({
      kind: 'spoken_question',
      question: cleanQuestion,
      priorContext: priorContext || getPriorTranscriptContext()
    });
  }

  if (btnForceSolve) {
    btnForceSolve.addEventListener('click', triggerEmergencyForceSolve);
  }

  function triggerPanicClear() {
    try { window.glanceaiAPI.abortGroqStream(); } catch (_) {}
    isGroqInferencing = false;
    cancelStreamRender();
    currentGroqBuffer = '';
    solutionMarkdownBody.innerHTML = '';
    solutionMarkdownBody.style.display = 'none';
    if (glanceAnchorsStrip) {
      glanceAnchorsStrip.innerHTML = '';
      glanceAnchorsStrip.style.display = 'none';
    }
    solutionEmptyState.style.display = 'flex';
    streamingCursor.style.display = 'none';
    systemStatusDot.classList.remove('pulsing');
    if (activeQuestionCard) activeQuestionCard.style.display = 'none';
    pendingDetectedQuestion = null;
    // Cancel a queued Auto-Pilot answer so it cannot pop up right after the wipe
    clearTimeout(autoPilotSilenceTimer);
    autoPilotPending = null;
    continuationArmedAt = 0;
    autoPilotRecentSentences = [];
    autoPilotFirstDetectTime = null;
    conversationHistory = [];
    currentActiveQuestion = '';
    currentFollowUpCount = 0;
    currentlyInferencingQuestion = null;
    lastAnsweredQuestionText = '';
    if (btnToggleAutopilot && autopilotLabel && isAutoPilotEnabled) {
      btnToggleAutopilot.className = 'btn-autopilot active';
      autopilotLabel.textContent = '⚡ Auto-Pilot: ON';
    }
    showToast('🕶️ Panic Clear: Teleprompter & solutions wiped clean');
  }

  // Keyboard Shortcuts inside Window
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !e.target.matches('input, textarea')) {
      triggerPanicClear();
    }
    if (e.key === 'Enter' && !e.target.matches('input, textarea') && !isGroqInferencing) {
      e.preventDefault();
      triggerEmergencyForceSolve();
    }
  });

  // Global IPC Bindings
  if (window.glanceaiAPI.onTriggerForceSolve) {
    window.glanceaiAPI.onTriggerForceSolve(triggerEmergencyForceSolve);
  }
  if (window.glanceaiAPI.onTriggerPanicClear) {
    window.glanceaiAPI.onTriggerPanicClear(triggerPanicClear);
  }
  if (window.glanceaiAPI.onToggleCandidateSpeaking) {
    window.glanceaiAPI.onToggleCandidateSpeaking(toggleCandidateSpeaking);
  }

  // Webcam Notch Mode (Gaze-Lock Pill) IPC Binding
  if (window.glanceaiAPI.onNotchModeChanged) {
    window.glanceaiAPI.onNotchModeChanged((isNotch) => {
      const hudDragHandle = document.getElementById('hud-drag-handle');
      const hudMain = document.querySelector('.hud-main');
      isNotchActive = isNotch;
      lastNotchSignature = '';
      lastReportedNotchHeight = 0;
      if (isNotch) {
        document.body.classList.add('notch-mode-active');
        if (notchPillView) notchPillView.style.display = 'flex';
        if (hudDragHandle) hudDragHandle.style.display = 'none';
        if (hudMain) hudMain.style.display = 'none';
        syncNotchTeleprompter();
      } else {
        document.body.classList.remove('notch-mode-active');
        if (notchPillView) notchPillView.style.display = 'none';
        if (hudDragHandle) hudDragHandle.style.display = 'flex';
        if (hudMain) hudMain.style.display = 'flex';
      }
    });
  }

  // Instant Test-Case Debugger / Fixer IPC Binding (Cmd+Alt+D)
  if (window.glanceaiAPI.onTriggerInstantDebug) {
    window.glanceaiAPI.onTriggerInstantDebug(async (result) => {
      if (!result.success) {
        showToast(`⚠️ Instant Debugger Error: ${result.error}`);
        return;
      }

      console.log(`[GlanceAI Renderer] Instant Debugger triggered. Size: ${Math.round((result.byteSize || 0) / 1024)} KB`);
      lastCapturedScreenshot = result.dataUrl;

      // Show thumbnail pill
      if (screenshotThumbnailImg) screenshotThumbnailImg.src = result.dataUrl;
      if (screenshotPreviewPill) screenshotPreviewPill.style.display = 'inline-flex';
      updateModelBadge();

      // Preempt any stale ongoing inference for urgent test case diagnosis
      if (isGroqInferencing && window.glanceaiAPI.abortGroqStream) {
        try { await window.glanceaiAPI.abortGroqStream(); } catch (_) {}
      }

      if (activeQuestionText && activeQuestionCard) {
        activeQuestionText.textContent = '🐞 Instant Test-Case Debugger (Fixing Failed Test)';
        activeQuestionCard.style.display = 'flex';
      }

      const rawOcr = (result.ocrText || '').trim();
      const cleanedOcr = cleanOcrScreenText(rawOcr) || rawOcr;

      await executeGroqInference({ kind: 'debug', ocrText: cleanedOcr }, { imageBase64: lastCapturedScreenshot });
    });
  }

  // Autonomous Code Screen Watcher & Platform OCR (LockedIn AI / Parakeet AI)
  if (window.glanceaiAPI.onAutoScreenWatchTick) {
    window.glanceaiAPI.onAutoScreenWatchTick(async (tick) => {
      if (!isAutoWatchActive) return;
      if (isGroqInferencing || isAutoWatchInferencing) return;
      if (!tick || !tick.hasVisualChange || !tick.dataUrl) return;

      const apiKey = inputGroqKey.value.trim() || (inputGroqBackupKey ? inputGroqBackupKey.value.trim() : '');
      if (!apiKey) return;

      try {
        isAutoWatchInferencing = true;
        if (btnToggleAutowatch && autowatchLabel) {
          btnToggleAutowatch.className = 'btn-autowatch scanning';
          autowatchLabel.textContent = '👁️ Auto-Watch: OCR...';
        }

        if (screenshotThumbnailImg && screenshotPreviewPill) {
          screenshotThumbnailImg.src = tick.dataUrl;
          screenshotPreviewPill.style.display = 'inline-flex';
        }

        // OCR text lets text-only fallback models still read the screen when the vision model is rate-limited
        const rawOcr = (tick.ocrText || '').trim();
        await executeGroqInference({ kind: 'auto_watch', ocrText: cleanOcrScreenText(rawOcr) || rawOcr }, { imageBase64: tick.dataUrl, isAutoWatch: true });
      } catch (err) {
        console.warn('[GlanceAI Renderer] Auto-watch tick processing error:', err);
      } finally {
        isAutoWatchInferencing = false;
        if (isAutoWatchActive && btnToggleAutowatch && autowatchLabel && !isGroqInferencing) {
          btnToggleAutowatch.className = 'btn-autowatch active';
          autowatchLabel.textContent = '👁️ Auto-Watch: ON';
        }
      }
    });
  }

  // Remote Mentor / Duo Mode Whispers (LockedIn AI)
  if (window.glanceaiAPI.onMentorWhisper) {
    window.glanceaiAPI.onMentorWhisper((whisperPayload) => {
      console.log('[GlanceAI Renderer] Mentor Whisper received:', whisperPayload);
      if (!whisperPayload) return;
      const text = typeof whisperPayload === 'string'
        ? whisperPayload
        : (whisperPayload.whisper || whisperPayload.text || '');
      const author = (typeof whisperPayload === 'object' && whisperPayload.author)
        ? whisperPayload.author
        : 'Remote Mentor';

      if (!text || text.trim().length === 0) return;

      if (mentorWhisperCard && whisperAuthor && whisperText) {
        whisperAuthor.textContent = author;
        whisperText.textContent = text;
        mentorWhisperCard.style.display = 'flex';
        solutionEmptyState.style.display = 'none';
        showToast(`🛡️ Mentor Whisper: "${text.length > 35 ? text.substring(0, 35) + '...' : text}"`);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Dedicated Zero-Cable Tab Audio Engine (Google Meet / Zoom / Teams Bridge)
  // --------------------------------------------------------------------------
  let deepgramTabSocket = null;
  let tabAudioHeaderBuffer = null;
  let tabAudioPendingChunks = [];
  let isConnectingTabSocket = false;
  let tabAudioState = 'IDLE'; // 'IDLE' | 'CONNECTING' | 'STREAMING'
  let tabChunkCount = 0;
  let tabAudioIdleTimer = null;
  let micStoppedByUser = false;

  function logAudioEvent(message) {
    console.log(`[GlanceAI Audio] ${message}`);
    if (window.glanceaiAPI && window.glanceaiAPI.logToTerminal) window.glanceaiAPI.logToTerminal(message);
  }

  function connectDeepgramTabWebSocket(deepgramKey, retryModel = null) {
    if (isConnectingTabSocket) return;
    if (deepgramTabSocket && (deepgramTabSocket.readyState === WebSocket.OPEN || deepgramTabSocket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    isConnectingTabSocket = true;
    tabAudioState = 'CONNECTING';

    const modelToUse = retryModel || currentDeepgramModel;
    // Tab Audio: responsive 600ms endpointing with 1200ms utterance end
    const deepgramUrl = `wss://api.deepgram.com/v1/listen?${GlanceAIEngine.buildDeepgramListenQuery({ model: modelToUse, diarize: false, contextText: inputProjectContext?.value || '' })}`;

    try {
      deepgramTabSocket = new WebSocket(deepgramUrl, ['token', deepgramKey]);
      deepgramTabSocket.binaryType = 'arraybuffer';

      deepgramTabSocket.onopen = () => {
        isConnectingTabSocket = false;
        tabAudioState = 'STREAMING';
        logAudioEvent(`Meet audio live: Deepgram connected (${modelToUse}), stream header ${tabAudioHeaderBuffer ? 'present' : 'MISSING'}.`);

        // The interviewer is on Meet, so the mic carries the candidate: make sure it is listening, or the
        // candidate's answers never reach the transcript (the mic is off after every GlanceAI restart)
        if (audioState === 'IDLE' && !micStoppedByUser) {
          logAudioEvent('Mic was off: starting it so your voice is transcribed as CANDIDATE.');
          showToast('🎙️ Mic listening started: your answers will show as CANDIDATE');
          startAudioListening();
        }

        if (tabAudioBadge) {
          tabAudioBadge.textContent = '🎧 Tab: Live';
          tabAudioBadge.style.background = 'rgba(52, 211, 153, 0.15)';
          tabAudioBadge.style.color = '#34d399';
          tabAudioBadge.style.borderColor = 'rgba(52, 211, 153, 0.3)';
        }

        // 1. Send the saved WebM container header first if we have one and it's not already at the front of pending chunks
        if (tabAudioHeaderBuffer && (tabAudioPendingChunks.length === 0 || tabAudioPendingChunks[0] !== tabAudioHeaderBuffer)) {
          try {
            deepgramTabSocket.send(tabAudioHeaderBuffer);
          } catch (err) {
            console.warn('[GlanceAI Tab Audio] Failed to send container header:', err);
          }
        }

        // 2. Flush pending chunks that arrived while connecting
        while (tabAudioPendingChunks.length > 0) {
          const chunk = tabAudioPendingChunks.shift();
          try {
            deepgramTabSocket.send(chunk);
          } catch (_) {}
        }
      };

      deepgramTabSocket.onmessage = (event) => {
        handleDeepgramTranscriptMessage(event.data, { isInterviewer: true, source: 'tab' });
      };

      const thisTabSocket = deepgramTabSocket;

      deepgramTabSocket.onerror = (err) => {
        console.warn('[GlanceAI Tab Audio] Deepgram Tab WebSocket error:', err);
      };

      deepgramTabSocket.onclose = (event) => {
        logAudioEvent(`Meet audio Deepgram connection closed (code ${event.code}${event.reason ? `: ${event.reason}` : ''}).`);
        const wasNova3 = (modelToUse === 'nova-3');
        if (deepgramTabSocket === thisTabSocket) {
          deepgramTabSocket = null;
          isConnectingTabSocket = false;
          tabAudioState = 'IDLE';
        }

        if (wasNova3 && (event.code === 4001 || event.code === 1002)) {
          console.warn('[GlanceAI Tab Audio] Unsupported model code on Nova-3. Falling back to nova-2 for Tab Audio.');
          setTimeout(() => connectDeepgramTabWebSocket(deepgramKey, 'nova-2'), 400);
          return;
        }

        if (tabAudioBadge) {
          tabAudioBadge.textContent = '🎧 Tab: Standby';
          tabAudioBadge.style.background = 'rgba(56, 189, 248, 0.12)';
          tabAudioBadge.style.color = '#38bdf8';
          tabAudioBadge.style.borderColor = 'rgba(56, 189, 248, 0.25)';
        }
      };
    } catch (err) {
      isConnectingTabSocket = false;
      tabAudioState = 'IDLE';
      console.error('[GlanceAI Tab Audio] Failed to create WebSocket:', err);
    }
  }

  // The server refused the extension's audio (missing or wrong token): say so instead of a silent "Standby"
  let hasShownTabRejectionToast = false;
  if (window.glanceaiAPI.onTabAudioRejected) {
    window.glanceaiAPI.onTabAudioRejected(() => {
      if (tabAudioState === 'STREAMING') return;
      if (tabAudioBadge) {
        tabAudioBadge.textContent = '🎧 Tab: Rejected';
        tabAudioBadge.style.background = 'rgba(244, 63, 94, 0.15)';
        tabAudioBadge.style.color = '#fb7185';
        tabAudioBadge.style.borderColor = 'rgba(244, 63, 94, 0.35)';
      }
      if (!hasShownTabRejectionToast) {
        hasShownTabRejectionToast = true;
        showToast('Meet audio rejected: reload the GlanceAI extension in chrome://extensions, check it says Paired, then Start Tab Stream again');
      }
    });
  }

  // Browser Extension Zero-Cable Tab Audio Stream Listener
  if (window.glanceaiAPI.onTabAudioChunk) {
    window.glanceaiAPI.onTabAudioChunk((chunkBase64, meta = {}) => {
      if (!chunkBase64) return;
      try {
        const binaryString = window.atob(chunkBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        tabChunkCount++;
        if (tabChunkCount === 1) logAudioEvent(`Meet audio arriving from the Chrome extension (chunk #${meta.chunkIndex}).`);

        // Reset tab idle watchdog (disconnect tab socket if no chunks for 25s)
        clearTimeout(tabAudioIdleTimer);
        tabAudioIdleTimer = setTimeout(() => {
          if (deepgramTabSocket) {
            console.log('[GlanceAI Tab Audio] Inactivity timeout: closing idle tab audio socket.');
            try { deepgramTabSocket.close(); } catch (_) {}
            deepgramTabSocket = null;
            tabAudioState = 'IDLE';
          }
        }, 25000);

        // Valid WebM EBML header starts with 0x1A 0x45 0xDF 0xA3
        const isEbmlHeader = bytes.length >= 4 && bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3;
        if (isEbmlHeader || meta.isHeader || (meta.chunkIndex === 0 && !tabAudioHeaderBuffer)) {
          tabAudioHeaderBuffer = bytes.buffer;
        }

        const deepgramKey = inputDeepgramKey.value.trim();

        if (deepgramTabSocket && deepgramTabSocket.readyState === WebSocket.OPEN) {
          deepgramTabSocket.send(bytes.buffer);
          if (transcriptPulse) transcriptPulse.classList.add('live');
          if (tabAudioBadge) {
            tabAudioBadge.textContent = `🎧 Tab: Live (${tabChunkCount})`;
            tabAudioBadge.style.background = 'rgba(52, 211, 153, 0.15)';
            tabAudioBadge.style.color = '#34d399';
            tabAudioBadge.style.borderColor = 'rgba(52, 211, 153, 0.3)';
          }
        } else {
          // Queue recent chunks while socket connects
          tabAudioPendingChunks.push(bytes.buffer);
          if (tabAudioPendingChunks.length > 50) tabAudioPendingChunks.shift(); // ~5s of 100ms extension chunks

          if (tabAudioBadge) {
            tabAudioBadge.textContent = '🎧 Tab: Connecting...';
            tabAudioBadge.style.background = 'rgba(251, 191, 36, 0.15)';
            tabAudioBadge.style.color = '#fbbf24';
            tabAudioBadge.style.borderColor = 'rgba(251, 191, 36, 0.3)';
          }

          if (deepgramKey && tabAudioState !== 'CONNECTING') {
            connectDeepgramTabWebSocket(deepgramKey);
          }
        }
      } catch (err) {
        console.warn('[GlanceAI Renderer] Error routing tab audio chunk:', err);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. Click-Through State Machine & Feedback
  // --------------------------------------------------------------------------
  window.glanceaiAPI.onClickThroughChanged((isEnabled) => {
    // Update only the label so the badge keeps its key-hint chip
    const passthroughLabel = badgePassthrough.querySelector('span');
    badgePassthrough.classList.toggle('active', isEnabled);
    if (passthroughLabel) passthroughLabel.textContent = isEnabled ? 'Passthrough ON' : 'Passthrough';
    if (isEnabled) {
      showToast(`🖱️ Click-Through ACTIVE: clicks pass through GlanceAI. Press ${modKey}+Alt+M to edit.`);
    } else {
      showToast('✏️ Edit Mode ACTIVE: GlanceAI is interactive.');
    }
  });

  function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    const toastMsgEl = passthroughToast.querySelector('.toast-msg');
    if (toastMsgEl) {
      toastMsgEl.textContent = message;
    }
    passthroughToast.classList.add('show');
    toastTimeout = setTimeout(() => {
      passthroughToast.classList.remove('show');
    }, 2800);
  }

  // --------------------------------------------------------------------------
  // 5. Screen Capture Engine (Cmd+Alt+C) & Downscaled JPEG OCR
  // --------------------------------------------------------------------------
  btnManualCapture.addEventListener('click', async () => {
    btnManualCapture.style.transform = 'scale(0.9)';
    setTimeout(() => { btnManualCapture.style.transform = ''; }, 150);
    await window.glanceaiAPI.triggerCapture();
  });

  function cleanOcrScreenText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const isNoiseLine = (line) => {
      // macOS / Browser top menu bars & tabs
      if (/^(Apple|Chrome|Safari|Firefox|Brave|Arc|Edge|File\s+Edit\s+View|Window\s+Help|Bookmarks|Profiles|History|Tab\s+Window)/i.test(line)) return true;
      if (/^(https?:\/\/|[a-z0-9_.-]+\.(com|org|io|dev|net|co)\b)/i.test(line)) return true;
      if (/^[✕✖_x-]\s*(chrome|tab|new tab)?/i.test(line)) return true;
      if (/^(Description|Editorial|Solutions|Submissions|Problem List|Premium)\s*$/i.test(line)) return true;
      // Tab titles or Google Docs / Gmail / GitHub chrome
      if (/^(Inbox\s*[-–]|Untitled\s+document|Extensions|\d+AZ[a-zA-Z0-9_-]+)/i.test(line)) return true;
      if (/(sriramvarun|glanceai|\bgithub\b)/i.test(line)) return true;
      if (/^[•·*]?\s*[a-z0-9_.-]+\/[a-z0-9_.-]*\s*[x✕✖]?$/i.test(line)) return true;
      if (/^(10\.5|\b[B I U A]\b|normal\s+text|arial|calibri)/i.test(line)) return true;
      return false;
    };
    return lines.filter(l => !isNoiseLine(l)).join('\n');
  }

  function extractProblemTitleFromOcr(ocrText) {
    if (!ocrText) return '';
    const lines = ocrText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    // 1. LeetCode / competitive programming tab titles: e.g. "Substring with Concatenation... - Le..."
    for (const line of lines.slice(0, 15)) {
      const tabMatch = line.match(/^([A-Za-z0-9\s\-]+?)\s*[-–]\s*Le/i);
      if (tabMatch && tabMatch[1].length >= 3 && tabMatch[1].length < 60 && !/(sriram|github|glanceai)/i.test(tabMatch[1])) {
        return tabMatch[1].trim();
      }
    }
    // 2. LeetCode numbered problem pattern: e.g. "30. Substring with Concatenation", "38. Count and Say"
    for (const line of lines.slice(0, 15)) {
      const match = line.match(/^(\d+[\.\-\:]\s*[A-Za-z0-9\s\-]+)/);
      if (match && match[1].length < 60) return match[1].trim();
    }
    // 3. Problem/Question headers
    for (const line of lines.slice(0, 15)) {
      if (/^(Problem|Question|Task|Challenge)\s*[:#\d]*/i.test(line) && line.length < 80) {
        return line.trim();
      }
    }
    // 4. Fallback: first descriptive problem statement line under 80 chars
    for (const line of lines.slice(0, 10)) {
      if (line.length >= 8 && line.length <= 80 &&
          !/^(Constraints|Example|Input|Output|Note):/i.test(line) &&
          !/(sriram|varun|glanceai|github|google|docs|chrome|inbox|gmail|\/)/i.test(line) &&
          !/^[•·*]/.test(line)) {
        return line;
      }
    }
    return '';
  }

  window.glanceaiAPI.onScreenCaptured(async (result) => {
    if (!result.success) {
      appendTranscriptEntry(`Screen Capture Error: ${result.error}`, true, true);
      alert(`Screen capture failed:\n${result.error}\n\nTo resolve, grant Screen Recording permissions to GlanceAI in macOS System Settings > Privacy & Security > Screen Recording.`);
      return;
    }

    console.log(`[GlanceAI Renderer] Screenshot received. Compressed Size: ${Math.round((result.byteSize || result.dataUrl.length) / 1024)} KB`);
    lastCapturedScreenshot = result.dataUrl;

    // Show thumbnail pill
    screenshotThumbnailImg.src = result.dataUrl;
    screenshotPreviewPill.style.display = 'inline-flex';
    updateModelBadge();

    // Trigger Groq Multimodal Reasoning automatically on capture with Apple Vision OCR context
    const rawOcr = (result.ocrText || '').trim();
    const cleanedOcr = cleanOcrScreenText(rawOcr) || rawOcr;
    await executeGroqInference({
      kind: 'screen',
      ocrText: cleanedOcr,
      instruction: inputCustomQuery.value.trim(),
      title: extractProblemTitleFromOcr(cleanedOcr)
    }, { imageBase64: lastCapturedScreenshot });
  });

  screenshotPreviewPill.addEventListener('click', () => {
    if (confirm('Clear attached screenshot?')) {
      lastCapturedScreenshot = null;
      screenshotPreviewPill.style.display = 'none';
      updateModelBadge();
    }
  });

  // --------------------------------------------------------------------------
  // 6. Groq Ultra-Low Latency Inference & Stream Rendering
  // --------------------------------------------------------------------------
  btnRunQuery.addEventListener('click', async () => {
    // Empty text falls back to the default analyze prompt in lib/prompts.js
    await executeGroqInference({ kind: 'freeform', text: inputCustomQuery.value.trim() }, { imageBase64: lastCapturedScreenshot });
  });

  inputCustomQuery.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnRunQuery.click();
    }
  });

  btnSendTranscriptToGroq.addEventListener('click', async () => {
    const activeTranscript = getActiveTranscriptWindow();
    if (!activeTranscript) {
      showToast('No new audio captured for this turn yet.');
      return;
    }

    let targetQuestion = activeTranscript;
    let priorContext = '';
    if (typeof GlanceAIEngine !== 'undefined' && typeof GlanceAIEngine.extractLatestQuestionFromTranscript === 'function') {
      const extracted = GlanceAIEngine.extractLatestQuestionFromTranscript(activeTranscript);
      if (extracted.targetQuestion) {
        targetQuestion = extracted.targetQuestion;
        priorContext = extracted.priorContext;
      }
    }
    const cleanQuestion = sanitizeTechnicalTranscript(targetQuestion);

    markTranscriptAsAnswered(cleanQuestion);

    await executeGroqInference({
      kind: 'spoken_question',
      question: cleanQuestion,
      priorContext: priorContext || getPriorTranscriptContext(),
      instruction: inputCustomQuery.value.trim()
    }, { imageBase64: lastCapturedScreenshot });
  });

  /**
   * Dispatches one structured request to the main process. `intent` describes WHAT was asked
   * ({ kind: 'spoken_question' | 'freeform' | 'quick_action' | 'screen' | 'debug' | 'auto_watch', ... });
   * all prompt text and the coding/follow-up classification live in lib/prompts.js (main process).
   */
  async function executeGroqInference(intent, { imageBase64 = null, isAutoWatch = false } = {}) {
    const primaryKey = inputGroqKey.value.trim();
    const backupKey = inputGroqBackupKey ? inputGroqBackupKey.value.trim() : '';
    const activeKey = primaryKey || backupKey;
    if (!activeKey) {
      paneConfig.classList.remove('collapsed');
      inputGroqKey.focus();
      alert('Please enter your GROQ_API_KEY in the configuration bar.');
      return;
    }

    isGroqInferencing = true;
    cancelStreamRender();
    currentGroqBuffer = '';

    // If this is an automatic background screen scan, do not wipe the current answer
    // until a real coding problem is actually confirmed!
    if (!isAutoWatch) {
      solutionEmptyState.style.display = 'none';
      if (glanceAnchorsStrip) {
        glanceAnchorsStrip.innerHTML = '';
        glanceAnchorsStrip.style.display = 'none';
      }
      solutionMarkdownBody.style.display = 'block';
      solutionMarkdownBody.innerHTML = '';
      solutionRenderBox.scrollTop = 0; // Lock to top so teleprompter quote is immediately visible!
    }
    streamingCursor.style.display = 'flex';
    systemStatusDot.classList.add('pulsing');

    // Auto-Pilot de-duplication needs this synchronously; the display question arrives with groq-stream-start
    currentlyInferencingQuestion = intent.question || intent.text || '';

    const textModel = selectTextModel.value;
    const visionModel = selectVisionModel.value;
    const responseMode = selectResponseMode ? selectResponseMode.value : 'adaptive';
    const projectContext = inputProjectContext ? inputProjectContext.value.trim() : '';
    const jobDescriptionContext = inputJdContext ? inputJdContext.value.trim() : '';
    const codeLanguage = selectCodeLanguage ? selectCodeLanguage.value : 'cpp';

    const payload = {
      apiKey: primaryKey || backupKey,
      backupApiKey: primaryKey ? backupKey : '',
      model: textModel,
      visionModel,
      responseMode,
      codeLanguage,
      projectContext,
      jobDescriptionContext,
      intent,
      imageBase64,
      conversationHistory: conversationHistory.slice(-2)
    };

    try {
      await window.glanceaiAPI.startGroqStream(payload);
    } catch (err) {
      isGroqInferencing = false;
      currentlyInferencingQuestion = null;
      console.error('[GlanceAI Renderer] Failed to dispatch Groq stream:', err);
      renderGroqError(err.message || 'Failed to dispatch Groq stream');
    }
  }

  // Main process classified the request: update the question card from its single decision
  window.glanceaiAPI.onGroqStart(({ displayQuestion = '', isFollowUp = false } = {}) => {
    currentActiveQuestion = displayQuestion;
    if (activeQuestionText && !isAutoWatchInferencing) activeQuestionText.title = displayQuestion;
    if (!isAutoWatchInferencing) {
      // A new question: the notch must never keep showing the previous answer while this one loads
      notchQuestionText = displayQuestion;
      notchIsFollowUp = isFollowUp;
      notchError = '';
      notchAwaitingAnswer = true;
      lastNotchGlance = null;
      syncNotchTeleprompter();
    }
    // Auto-Watch keeps the existing card until a real problem is detected on screen
    if (isAutoWatchInferencing || displayQuestion.length <= 3 || !activeQuestionCard || !activeQuestionText) return;

    if (isFollowUp && conversationHistory.length > 0) {
      currentFollowUpCount++;
      const parentQ = conversationHistory[conversationHistory.length - 1].question;
      const parentShort = parentQ.length > 28 ? parentQ.substring(0, 28) + '...' : parentQ;
      activeQuestionText.innerHTML = `<span style="display:inline-flex;align-items:center;padding:1px 6px;margin-right:8px;font-size:10px;font-weight:700;color:var(--hud-accent-blue);background:rgba(56,189,248,0.12);border:1px solid rgba(56,189,248,0.25);border-radius:4px;letter-spacing:0.5px;text-transform:uppercase;">🎯 Follow-up #${currentFollowUpCount} (${escapeHtml(parentShort)})</span> <span class="active-question-body">${escapeHtml(displayQuestion)}</span>`;
    } else {
      currentFollowUpCount = 0;
      activeQuestionText.textContent = displayQuestion.length > 180 ? displayQuestion.substring(0, 180) + '...' : displayQuestion;
    }
    activeQuestionCard.style.display = 'flex';
  });

  // Groq can deliver several hundred deltas per second; re-rendering the whole answer on each one kept the renderer
  // ~90% busy and the final text landed ~0.7s late. Deltas are buffered and rendered at most once per frame instead.
  const STREAM_RENDER_INTERVAL_MS = 16;

  function scheduleStreamRender() {
    if (streamRenderTimer) return;
    streamRenderTimer = setTimeout(renderStreamFrame, STREAM_RENDER_INTERVAL_MS);
  }

  function cancelStreamRender() {
    clearTimeout(streamRenderTimer);
    streamRenderTimer = null;
  }

  // Runs a pending render now, so end/abort handling sees every delta applied (same order as per-delta rendering)
  function flushStreamRender() {
    if (!streamRenderTimer) return;
    cancelStreamRender();
    renderStreamFrame();
  }

  window.glanceaiAPI.onGroqChunk((chunk) => {
    currentGroqBuffer += chunk;
    scheduleStreamRender();
  });

  function renderStreamFrame() {
    streamRenderTimer = null;

    // If auto-watch background scan is checking the screen, do not show the no-problem sentinel
    if (isAutoWatchInferencing) {
      const trimmed = currentGroqBuffer.trim();
      const noProblem = GlanceAIEngine.OUTPUT_MARKERS.NO_PROBLEM_DETECTED;
      if (noProblem.startsWith(trimmed) || trimmed.startsWith(noProblem)) {
        return;
      }
      solutionEmptyState.style.display = 'none';
      solutionMarkdownBody.style.display = 'block';
    }

    renderMarkdownBuffer(currentGroqBuffer);
    renderGlanceAnchors(currentGroqBuffer);
    syncNotchTeleprompter();

    // Live-extract cleanly reconstructed question from LLM stream to update activeQuestionCard banner
    if (activeQuestionCard && activeQuestionText && currentGroqBuffer) {
      const cleanRecognized = GlanceAIEngine.extractRecognizedQuestion(currentGroqBuffer);
      if (cleanRecognized.length > 5 && !activeQuestionText.innerHTML.includes('Follow-up') && activeQuestionText.textContent !== cleanRecognized) {
        activeQuestionText.textContent = cleanRecognized.length > 180 ? cleanRecognized.substring(0, 180) + '...' : cleanRecognized;
        currentActiveQuestion = cleanRecognized;
        activeQuestionCard.style.display = 'flex';
      }
    }
  }

  window.glanceaiAPI.onGroqEnd(() => {
    flushStreamRender();
    isGroqInferencing = false;
    notchAwaitingAnswer = false;
    currentlyInferencingQuestion = null;
    streamingCursor.style.display = 'none';
    systemStatusDot.classList.remove('pulsing');

    // Auto-Watch: check if model returned the no-problem sentinel
    if (currentGroqBuffer && currentGroqBuffer.trim().startsWith(GlanceAIEngine.OUTPUT_MARKERS.NO_PROBLEM_DETECTED)) {
      currentGroqBuffer = '';
      // Retain whatever answer was already on screen - do NOT wipe it out!
      if (btnToggleAutowatch && autowatchLabel && isAutoWatchActive) {
        btnToggleAutowatch.className = 'btn-autowatch active';
        autowatchLabel.textContent = '👁️ Auto-Watch: ON';
      }
      return;
    }

    renderMarkdownBuffer(currentGroqBuffer);
    renderGlanceAnchors(currentGroqBuffer);
    syncNotchTeleprompter();
    bindCodeCopyButtons();
    if (btnToggleAutopilot && autopilotLabel && isAutoPilotEnabled) {
      btnToggleAutopilot.className = 'btn-autopilot active';
      autopilotLabel.textContent = '⚡ Auto-Pilot: ON';
    }
    if (btnToggleAutowatch && autowatchLabel && isAutoWatchActive) {
      btnToggleAutowatch.className = 'btn-autowatch active';
      autowatchLabel.textContent = '👁️ Auto-Watch: ON';
    }

    // Persist turn in conversationHistory for multi-turn follow-up grounding
    if (currentActiveQuestion && currentGroqBuffer && currentGroqBuffer.trim().length > 20) {
      conversationHistory.push({
        turnId: conversationHistory.length + 1,
        question: currentActiveQuestion,
        solutionSummary: extractSolutionSummary(currentGroqBuffer.trim()),
        timestamp: Date.now()
      });
      if (conversationHistory.length > 6) {
        conversationHistory.shift();
      }
    }
  });

  window.glanceaiAPI.onGroqError((err) => {
    // A late frame must not paint the partial answer over the error card
    cancelStreamRender();
    isGroqInferencing = false;
    currentlyInferencingQuestion = null;
    streamingCursor.style.display = 'none';
    systemStatusDot.classList.remove('pulsing');
    renderGroqError(err);
    if (btnToggleAutopilot && autopilotLabel && isAutoPilotEnabled) {
      btnToggleAutopilot.className = 'btn-autopilot active';
      autopilotLabel.textContent = '⚡ Auto-Pilot: ON';
    }
    if (btnToggleAutowatch && autowatchLabel && isAutoWatchActive) {
      btnToggleAutowatch.className = 'btn-autowatch active';
      autowatchLabel.textContent = '👁️ Auto-Watch: ON';
    }
  });

  window.glanceaiAPI.onGroqAborted(() => {
    flushStreamRender();
    isGroqInferencing = false;
    currentlyInferencingQuestion = null;
    streamingCursor.style.display = 'none';
    systemStatusDot.classList.remove('pulsing');
    if (btnToggleAutopilot && autopilotLabel && isAutoPilotEnabled) {
      btnToggleAutopilot.className = 'btn-autopilot active';
      autopilotLabel.textContent = '⚡ Auto-Pilot: ON';
    }
    if (btnToggleAutowatch && autowatchLabel && isAutoWatchActive) {
      btnToggleAutowatch.className = 'btn-autowatch active';
      autowatchLabel.textContent = '👁️ Auto-Watch: ON';
    }
  });

  function renderGroqError(errorMessage) {
    if (glanceAnchorsStrip) {
      glanceAnchorsStrip.innerHTML = '';
      glanceAnchorsStrip.style.display = 'none';
    }
    const isRateLimit = errorMessage.includes('429') || /rate.*limit/i.test(errorMessage);
    const isAuth = errorMessage.includes('401') || /invalid.*api.*key|api_key/i.test(errorMessage);

    if (!isAutoWatchInferencing) {
      notchAwaitingAnswer = false;
      notchError = isRateLimit
        ? 'Rate limited. Wait 10-15s, then ask again.'
        : (isAuth ? 'Groq API key rejected. Open the full HUD to fix it.' : 'Answer failed. Open the full HUD for details.');
      syncNotchTeleprompter();
    }

    let advice = escapeHtml(errorMessage);
    if (isRateLimit) {
      advice = '<strong>Groq Rate Limit Exceeded (429).</strong> Automatic model fallback was attempted. Please wait 10–15 seconds before requesting another query to allow your token bucket to refresh.';
    } else if (isAuth) {
      advice = '<strong>Invalid or Expired GROQ_API_KEY.</strong> Please check and update your key in the settings panel above.';
      paneConfig.classList.remove('collapsed');
      inputGroqKey.focus();
    }

    solutionMarkdownBody.innerHTML = `
      <div style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 12px; color: #fecdd3;">
        <h3 style="color: #fb7185; margin: 0 0 6px 0; border: none;">⚠️ ${isRateLimit ? 'Rate Limit (429)' : (isAuth ? 'Authentication Error' : 'Groq Inference Error')}</h3>
        <p style="margin: 0; font-size: 11.5px; line-height: 1.5;">${advice}</p>
      </div>
    `;
  }

  function sanitizeHtmlOutput(html) {
    if (!html || typeof html !== 'string') return '';
    if (typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
      return DOMPurify.sanitize(html);
    }
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
      .replace(/\s+on\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '');
  }

  function renderMarkdownBuffer(markdownText) {
    if (typeof marked !== 'undefined') {
      const displayMarkdown = markdownText.replace(/###\s*🏷️?\s*Glance Anchors\s*[\s\S]*?(?=###|```|$)/i, '').trim();
      const rawHtml = marked.parse(displayMarkdown);
      const safeHtml = sanitizeHtmlOutput(rawHtml);
      solutionMarkdownBody.innerHTML = enhanceCodeBlocks(safeHtml);
      bindCodeCopyButtons();
    } else {
      solutionMarkdownBody.textContent = markdownText;
    }
  }

  function enhanceCodeBlocks(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const preElements = tempDiv.querySelectorAll('pre');
    preElements.forEach((pre) => {
      const code = pre.querySelector('code');
      if (!code) return;

      const codeClass = code.className || '';
      const match = codeClass.match(/language-(\w+)/);
      const language = match ? match[1] : 'code';

      const container = document.createElement('div');
      container.className = 'code-container';

      const header = document.createElement('div');
      header.className = 'code-header';
      header.innerHTML = `
        <div class="code-header-dots">
          <span></span><span></span><span></span>
        </div>
        <span class="code-lang-label">${language}</span>
        <button class="code-copy-btn" title="Copy snippet">
          <svg class="icon-svg" viewBox="0 0 24 24" width="12" height="12">
            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
          <span>Copy</span>
        </button>
      `;

      container.appendChild(header);
      pre.parentNode.insertBefore(container, pre);
      container.appendChild(pre);
    });

    return tempDiv.innerHTML;
  }

  function isAutoWatchSentinelBuffer(text) {
    const noProblem = GlanceAIEngine.OUTPUT_MARKERS.NO_PROBLEM_DETECTED;
    return isAutoWatchInferencing && (noProblem.startsWith(text) || text.startsWith(noProblem));
  }

  // Notch pill: the line to say, then keyword cues (or one supporting sentence), then the question it answers
  function syncNotchTeleprompter() {
    if (!isNotchActive || !notchBullet1) return;

    const buffer = currentGroqBuffer.trim();
    if (buffer && !isAutoWatchSentinelBuffer(buffer)) {
      const glance = GlanceAIEngine.extractProgressionTalkingPoints(buffer);
      if (glance.bullet1) lastNotchGlance = glance;
      const recognized = GlanceAIEngine.extractRecognizedQuestion(buffer);
      if (recognized.length > 5) {
        notchQuestionText = recognized;
      } else if (isAutoWatchInferencing && glance.bullet1) {
        notchQuestionText = 'Problem detected on screen';
        notchIsFollowUp = false;
      }
    }

    const isAnswering = notchAwaitingAnswer;
    let say = 'Waiting for the interview question...';
    let sayState = 'placeholder';
    let detail = '';
    let cues = [];
    if (lastNotchGlance) {
      say = lastNotchGlance.bullet1;
      sayState = '';
      cues = lastNotchGlance.cues || [];
      detail = cues.length ? '' : lastNotchGlance.bullet2;
    } else if (notchError) {
      say = `⚠ ${notchError}`;
      sayState = 'error';
    } else if (isAnswering) {
      say = 'Answering...';
    }

    const shortcut = isMac ? '⌥⌘N' : 'Ctrl+Alt+N';
    const question = notchQuestionText
      ? `${notchIsFollowUp ? 'Follow-up · ' : ''}${notchQuestionText}`
      : `Gaze-Lock · ${shortcut} for full HUD`;
    const dotState = isAnswering ? 'is-live' : (notchError && !lastNotchGlance ? 'is-error' : '');

    const signature = JSON.stringify([say, sayState, detail, cues, question, dotState]);
    if (signature === lastNotchSignature) return;
    lastNotchSignature = signature;

    notchBullet1.textContent = say;
    notchBullet1.className = `notch-say${sayState ? ` is-${sayState}` : ''}`;
    if (notchBullet2) {
      notchBullet2.textContent = detail;
      notchBullet2.style.display = detail ? '' : 'none';
    }
    if (notchCues) {
      notchCues.replaceChildren(...cues.map(cue => {
        const chip = document.createElement('span');
        chip.className = `notch-cue kind-${cue.kind || 'point'}`;
        if (cue.label) {
          const label = document.createElement('span');
          label.className = 'notch-cue-label';
          label.textContent = cue.label;
          chip.appendChild(label);
        }
        chip.appendChild(document.createTextNode(cue.text));
        return chip;
      }));
      notchCues.style.display = cues.length ? '' : 'none';
    }
    if (notchQuestion) {
      notchQuestion.textContent = question;
      notchQuestion.title = notchQuestionText;
    }
    if (notchStatusDot) notchStatusDot.className = `notch-pill-dot${dotState ? ` ${dotState}` : ''}`;
  }

  // The notch window grows and shrinks with its content (main clamps the height and keeps the position)
  if (notchPillView && typeof ResizeObserver !== 'undefined' && window.glanceaiAPI && window.glanceaiAPI.setNotchHeight) {
    new ResizeObserver(() => {
      if (!isNotchActive) return;
      const height = Math.ceil(notchPillView.getBoundingClientRect().height);
      if (height > 0 && height !== lastReportedNotchHeight) {
        lastReportedNotchHeight = height;
        window.glanceaiAPI.setNotchHeight(height);
      }
    }).observe(notchPillView);
  }

  function renderGlanceAnchors(text) {
    if (!glanceAnchorsStrip) return;
    if (!text || typeof text !== 'string') {
      glanceAnchorsStrip.innerHTML = '';
      glanceAnchorsStrip.style.display = 'none';
      return;
    }

    const extractFn = (typeof GlanceAIEngine !== 'undefined' && GlanceAIEngine.extractGlanceAnchors)
      ? GlanceAIEngine.extractGlanceAnchors
      : ((window.glanceaiAPI && window.glanceaiAPI.extractGlanceAnchors) ? window.glanceaiAPI.extractGlanceAnchors : null);

    if (!extractFn) return;

    const anchors = extractFn(text);
    if (!anchors || anchors.length === 0) {
      glanceAnchorsStrip.innerHTML = '';
      glanceAnchorsStrip.style.display = 'none';
      return;
    }

    let chipsHtml = '';
    for (const anchor of anchors) {
      let chipClass = 'anchor-chip';
      let icon = '⚡';
      let label = anchor;

      if (/^brute/i.test(anchor)) {
        chipClass += ' chip-brute';
        icon = '⚡';
      } else if (/^bridge/i.test(anchor)) {
        chipClass += ' chip-bridge';
        icon = '🌉';
      } else if (/^core/i.test(anchor)) {
        chipClass += ' chip-core';
        icon = '🛡️';
      } else if (/^(trap|edge)/i.test(anchor)) {
        chipClass += ' chip-trap';
        icon = '⚠️';
      } else if (/^time/i.test(anchor) || /o\(/i.test(anchor)) {
        chipClass += ' chip-core';
        icon = '⏱️';
      }

      chipsHtml += `<span class="${chipClass}"><span class="chip-icon">${icon}</span><span>${escapeHtml(label)}</span></span>`;
    }

    glanceAnchorsStrip.innerHTML = chipsHtml;
    glanceAnchorsStrip.style.display = 'flex';
  }

  function bindCodeCopyButtons() {
    const copyBtns = solutionMarkdownBody.querySelectorAll('.code-copy-btn');
    copyBtns.forEach((btn) => {
      btn.onclick = () => {
        const pre = btn.closest('.code-container')?.querySelector('pre');
        if (pre) {
          const rawText = pre.innerText.trim();
          const activeLanguage = selectCodeLanguage ? selectCodeLanguage.value : 'cpp';
          const sanitizeFn = (typeof GlanceAIEngine !== 'undefined' && GlanceAIEngine.sanitizeInterviewCode)
            ? GlanceAIEngine.sanitizeInterviewCode
            : ((window.glanceaiAPI && window.glanceaiAPI.sanitizeCode) ? window.glanceaiAPI.sanitizeCode : (c) => c);
          const cleanText = sanitizeFn(rawText, activeLanguage) || rawText;

          navigator.clipboard.writeText(cleanText).then(() => {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✓ Copied';
            btn.style.color = '#34d399';
            setTimeout(() => {
              btn.innerHTML = originalText;
              btn.style.color = '';
            }, 1800);
          });
        }
      };
    });
  }

  if (btnCleanCopy) {
    btnCleanCopy.addEventListener('click', () => {
      if (!currentGroqBuffer) {
        showToast('⚠️ No active solution to copy');
        return;
      }
      const activeLanguage = selectCodeLanguage ? selectCodeLanguage.value : 'cpp';
      let rawCode = '';
      // Match complete or in-progress code fence
      const match = currentGroqBuffer.match(/```(?:[a-zA-Z0-9_+-]+)?\r?\n([\s\S]*?)```/) ||
                    currentGroqBuffer.match(/```(?:[a-zA-Z0-9_+-]+)?\r?\n([\s\S]*)$/);
      if (match && match[1]) {
        rawCode = match[1];
      } else {
        const pre = solutionMarkdownBody.querySelector('pre code') || solutionMarkdownBody.querySelector('pre');
        if (pre) {
          rawCode = pre.innerText;
        } else {
          rawCode = currentGroqBuffer;
        }
      }

      const sanitizeFn = (typeof GlanceAIEngine !== 'undefined' && GlanceAIEngine.sanitizeInterviewCode)
        ? GlanceAIEngine.sanitizeInterviewCode
        : ((window.glanceaiAPI && window.glanceaiAPI.sanitizeCode) ? window.glanceaiAPI.sanitizeCode : (c) => c);

      const cleanCode = sanitizeFn(rawCode, activeLanguage);
      if (!cleanCode) {
        showToast('⚠️ No code found in answer');
        return;
      }

      navigator.clipboard.writeText(cleanCode).then(() => {
        btnCleanCopy.classList.add('copied');
        const origText = btnCleanCopy.innerHTML;
        btnCleanCopy.innerHTML = '✓ CLEAN COPIED';
        showToast('⚡ Copied clean function (zero comments) to clipboard');
        setTimeout(() => {
          btnCleanCopy.classList.remove('copied');
          btnCleanCopy.innerHTML = origText;
        }, 1800);
      }).catch((err) => {
        console.error('Clipboard copy failed:', err);
        showToast('❌ Clipboard copy failed');
      });
    });
  }

  if (btnToggleNotch) {
    btnToggleNotch.addEventListener('click', () => {
      if (window.glanceaiAPI && window.glanceaiAPI.toggleNotchMode) {
        window.glanceaiAPI.toggleNotchMode();
      }
    });
  }

  if (btnExpandNotch) {
    btnExpandNotch.addEventListener('click', () => {
      if (window.glanceaiAPI && window.glanceaiAPI.toggleNotchMode) {
        window.glanceaiAPI.toggleNotchMode();
      }
    });
  }

  btnCopySolution.addEventListener('click', () => {
    if (!currentGroqBuffer) return;
    navigator.clipboard.writeText(currentGroqBuffer).then(() => {
      showToast('📋 Copied full solution to clipboard');
    });
  });

  btnClearSolution.addEventListener('click', () => {
    cancelStreamRender();
    currentGroqBuffer = '';
    solutionMarkdownBody.innerHTML = '';
    solutionMarkdownBody.style.display = 'none';
    if (glanceAnchorsStrip) {
      glanceAnchorsStrip.innerHTML = '';
      glanceAnchorsStrip.style.display = 'none';
    }
    if (activeQuestionCard) activeQuestionCard.style.display = 'none';
    solutionEmptyState.style.display = 'flex';
    notchQuestionText = '';
    notchIsFollowUp = false;
    notchError = '';
    notchAwaitingAnswer = false;
    lastNotchGlance = null;
    syncNotchTeleprompter();
  });

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K to Reset Turn
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      markTranscriptAsAnswered('Manual Reset');
      showToast('⚡ Turn reset: Ready for next question');
    }
  });

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function applyPlatformLabels() {
    if (!isMac) {
      document.querySelectorAll('.hotkey-chip kbd').forEach((k) => {
        if (k.textContent === 'Cmd') k.textContent = 'Ctrl';
      });
      document.querySelectorAll('.solution-empty-state kbd').forEach((k) => {
        if (k.textContent === 'Cmd') k.textContent = 'Ctrl';
      });
      badgePassthrough.title = 'Ctrl+Alt+M to toggle click-through';
      const passthroughKey = badgePassthrough.querySelector('kbd');
      if (passthroughKey) passthroughKey.textContent = 'Ctrl+Alt+M';
      btnManualCapture.title = 'Capture Screen & Analyze (Ctrl+Alt+C)';
    }
  }

  // Initial Safe Boot
  applyPlatformLabels();
  await initConfig();
  await enumerateAudioDevices(false);
  console.log('[GlanceAI] Renderer initialization completed on platform:', currentPlatform);
});

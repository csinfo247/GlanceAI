# Contributing to GlanceAI

Thank you for your interest in contributing to **GlanceAI** — the open-source developer overlay for ultra-low-latency coding assistance, audio transcription, and screen reasoning.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js** v18+ (v20 or v22 recommended)
- **npm** v9+
- Operating System: **macOS**, **Windows 10/11**, or **Linux** (X11 / Wayland)

### 2. Clone & Install
```bash
git clone https://github.com/csinfo247/GlanceAI.git
cd GlanceAI
npm install
```

### 3. Run Locally
```bash
npm start
```

### 4. Run with Detached DevTools
```bash
DEBUG=true npm start
# On Windows PowerShell:
$env:DEBUG="true"; npm start
```

### 5. Verify Syntax
```bash
npm run test:syntax
```

---

## 🧭 Subsystem Architecture

- **`main.js`**: Electron Main process handling OS-level subsystems (always-on-top window levels, global keyboard shortcuts, desktop screen capture, and Groq API streaming).
- **`preload.js`**: Secure context isolation bridge using Electron `contextBridge` to expose safe IPC channels to the renderer without node integration vulnerabilities.
- **`renderer.js`**: Client-side logic for dual-channel audio hardware enumeration, Deepgram WebSocket streaming, live VU decibel meter, and markdown rendering.
- **`index.html` & `styles.css`**: Apple-style glassmorphic UI container with `-webkit-app-region: drag` titlebar.

---

## 🎧 Cross-Platform Audio Testing

When contributing audio features, please verify behavior on your platform:
- **macOS**: Test physical microphone and virtual loopback ([BlackHole 2ch](https://github.com/ExistentialAudio/BlackHole)).
- **Windows**: Test "Stereo Mix" or [VB-Audio Virtual Cable](https://vb-audio.com/Cable/).
- **Linux**: Test PulseAudio or PipeWire monitor sources via `pavucontrol`.

---

## 📜 Pull Request Process

1. Fork the repo and create your feature branch: `git checkout -b feature/my-enhancement`.
2. Ensure no lint or syntax errors: `npm run test:syntax`.
3. Commit with clear, descriptive messages: `git commit -m "feat(audio): add pipewire monitor auto-detection"`.
4. Push to your branch and open a Pull Request.

---

## ⚖️ License
By contributing to GlanceAI, you agree that your contributions will be licensed under its [MIT License](LICENSE).

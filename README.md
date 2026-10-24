# GlanceAI — Live Interview Copilot & Teleprompter Overlay

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-brightgreen.svg)](#platform-notes)
[![Inference: Groq](https://img.shields.io/badge/Inference-Groq-orange.svg)](https://groq.com)
[![Speech: Deepgram Nova-3](https://img.shields.io/badge/Speech-Deepgram%20Nova--3-purple.svg)](https://deepgram.com)
[![Electron 33](https://img.shields.io/badge/Electron-33-blue.svg)](https://electronjs.org)

GlanceAI is a desktop overlay (Electron) that listens to a technical conversation, recognizes the interviewer's questions, and streams a structured answer you can glance at and say out loud. It reads coding problems off your screen, grounds answers in your resume and the job description, and has a compact "notch" mode that sits right under your webcam.

Everything runs on your machine with your own API keys (Groq for answers, Deepgram for live transcription). There is no GlanceAI account, server, or subscription.

---

## Contents

1. [What GlanceAI does](#what-glanceai-does)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [First-time setup guide](#first-time-setup-guide)
5. [Using GlanceAI in a session](#using-glanceai-in-a-session)
6. [Keyboard shortcuts](#keyboard-shortcuts)
7. [The interface](#the-interface)
8. [Audio and speaker detection](#audio-and-speaker-detection)
9. [How Auto-Pilot decides what to answer](#how-auto-pilot-decides-what-to-answer)
10. [Answer formats and response modes](#answer-formats-and-response-modes)
11. [Screen features: capture, Auto-Watch, debugger](#screen-features-capture-auto-watch-debugger)
12. [Notch mode](#notch-mode)
13. [Models, keys and automatic fallback](#models-keys-and-automatic-fallback)
14. [Phone companion and mentor portal](#phone-companion-and-mentor-portal)
15. [Privacy and security](#privacy-and-security)
16. [Platform notes](#platform-notes)
17. [Troubleshooting](#troubleshooting)
18. [Development](#development)
19. [License](#license)

---

## What GlanceAI does

| Feature | What you get |
| :--- | :--- |
| **Live transcription** | Interviewer and candidate speech transcribed in real time with Deepgram Nova-3, tuned for technical vocabulary and Indian English mishearings ("radio routing" → "rate limiting"). |
| **Speaker detection** | Call audio is labeled `INTERVIEWER (MEET)` and your microphone `CANDIDATE`. Only the interviewer's speech can trigger an answer. |
| **Auto-Pilot** | When the interviewer finishes a question, GlanceAI answers on its own: it waits for the end of speech, joins multi-sentence questions, recognizes follow-ups, and ignores small talk. |
| **Glance-and-speak answers** | Every verbal answer starts with one sentence to say out loud, followed by short talking points, a production gotcha and the likely follow-up question. |
| **Coding answers** | Coding questions get a brute-force → optimal ladder with complexity, glance anchors and clean code in C++, Python, Java or Go. |
| **Screen reading** | Capture the screen with one shortcut, or let Auto-Watch spot a new coding problem automatically. On macOS a local OCR step reads the problem text. |
| **Test-case debugger** | One shortcut reads a failing test off the screen and returns the root cause, a minimal patch and a dry run. |
| **Resume and JD grounding** | Upload your resume and the job description; project and behavioral answers use your real work, and quick actions generate a 60-second pitch, STAR stories and more. |
| **Notch mode** | A compact pill under the webcam showing the line to say, keyword cues and the question being answered. |
| **Phone companion and mentor portal** | View answers on your phone, or give a coach a token-protected page with the live transcript and a way to send short hints. |
| **Model fallback** | If a Groq model or key is rate-limited, GlanceAI moves to your backup key and then to fallback models without dropping the request. |
| **Overlay controls** | Always on top, click-through, hide/show, adjustable opacity. The window is excluded from screen capture by the operating system. |

---

## Requirements

| Requirement | Notes |
| :--- | :--- |
| **Node.js 20.16+** (or 22) | Required by `pdf-parse` v2 for resume parsing. |
| **Groq API key** (required) | Free at [console.groq.com](https://console.groq.com). Powers every answer. Optional backup keys (comma-separated in the backup field) are tried in order when one is rate-limited; Groq limits are per account, so keys only add headroom when they come from different accounts. |
| **Deepgram API key** (recommended) | From [deepgram.com](https://deepgram.com). Needed for live transcription and Auto-Pilot. Without it, audio is only transcribed when you press Solve (via Groq Whisper). |
| **Google AI Studio key** (optional) | Last-resort fallback for screenshot questions when every Groq option is rate-limited. |
| **Chrome, Brave or Edge** | For the tab-audio extension that captures Google Meet, Zoom (web) or Teams (web) audio. |
| **macOS** (recommended) | Everything works on macOS. Windows and Linux work with a few differences; see [Platform notes](#platform-notes). |

---

## Installation

```bash
git clone https://github.com/csinfo247/GlanceAI.git
cd GlanceAI
npm install
npm start
```

Keep the terminal open: GlanceAI logs what it is doing there (`[GlanceAI Audio]`, `[GlanceAI LLM]` lines), which is the first place to look when something seems off.

**Running in the background (macOS / Linux):**

```bash
npm run bg     # start detached; you can close the terminal
npm run stop   # stop it again (or click ✕ in the GlanceAI title bar)
```

**Windows (PowerShell):** `Start-Process npm -ArgumentList "start" -WindowStyle Hidden`

**Updating:** `git pull`, then `npm install`, then restart GlanceAI. If the update touched `extensions/`, also click reload (↻) on the extension in `chrome://extensions`. Chrome keeps running the old extension code until you do.

---

## First-time setup guide

Do this once, ideally a day before you need GlanceAI.

### Step 1: Add your API keys

1. Start GlanceAI (`npm start`) and click the **gear icon** in the title bar to open settings.
2. Paste your **Groq key** and click Save. Add **backup Groq keys** if you have them, separated by commas (`gsk_…, gsk_…`); they are tried in order.
3. Paste your **Deepgram key** and click Save.
4. Optionally paste a **Google AI key** for the screenshot fallback.

Keys are saved to a config file on your machine (see [Privacy and security](#privacy-and-security)) and reload automatically on the next start.

### Step 2: Choose models and defaults

| Setting | Recommended | Why |
| :--- | :--- | :--- |
| Text model | `qwen/qwen3.8-27b` | Fastest to first word; the fallback chain covers rate limits. |
| Vision model | `qwen/qwen3.8-27b` | Used for screenshots. |
| Response mode | **Smart Adaptive** | Picks verbal or coding format per question. See [response modes](#response-modes). |
| Code language | Your interview language | C++ (17/20 STL), Python 3, Java or Go. |

### Step 3: Add your resume and the job description

1. In settings, drop your resume (`.pdf`, `.docx`, `.txt` or `.md`) on the **resume dropzone**.
2. Open the **resume editor** and check the extracted text. Fix anything the parser got wrong; this text is what answers are grounded in.
3. Do the same for the **job description** (upload or paste).

Your resume also teaches the transcriber your project names, so names like "Vasool" or "LangGraph" come out spelled correctly.

### Step 4: Allow microphone and screen access

- **macOS:** the first time you click **Start Listening**, macOS asks for microphone access; allow it. Screen capture needs **System Settings → Privacy & Security → Screen Recording** enabled for Electron (or the terminal you launch it from). Restart GlanceAI after granting it.
- **Windows:** allow microphone access for desktop apps in Settings → Privacy → Microphone.

### Step 5: Install and pair the Chrome extension

The extension captures the call audio straight from the browser tab, so you can wear any headphones (AirPods included) and no virtual audio cable is needed.

1. Open `chrome://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and choose the `extensions/glanceai-tab-audio` folder.
3. **Pair once:** with GlanceAI running, click **Copy Mobile** in GlanceAI settings, open the extension popup, paste the link into the **Pair** box and click **Pair**. The popup should show **localhost:4242 (Online)** and **Paired**. The pairing survives restarts.

### Step 6: Do a test run

1. Open any interview video (for example a mock system-design interview on YouTube) in a Chrome tab and play it.
2. Click the extension icon on that tab and click **Stream Current Tab Audio**.
3. In GlanceAI, the Tab badge goes **Connecting… → Live**, the video's speech appears as `INTERVIEWER (MEET)`, and your mic starts automatically.
4. Say something yourself: it should appear as `CANDIDATE`.
5. When the video asks a question, an answer should start streaming within a couple of seconds.

If any step fails, see [Troubleshooting](#troubleshooting).

---

## Using GlanceAI in a session

### Before the call

1. Start GlanceAI and check the title bar shows your model and the settings are filled in.
2. Join the call **in the browser** (Google Meet, or Zoom / Teams via "join from browser").
3. On the call tab, click the extension and **Stream Current Tab Audio**. Wait for **Tab: Live**.
4. Check **Auto-Pilot: ON** in the bottom bar.
5. Position the window, or press <kbd>⌘</kbd><kbd>⌥</kbd><kbd>N</kbd> for [notch mode](#notch-mode).

### During the call

- **Questions answer themselves.** When the interviewer finishes speaking, the question appears in the question card and the answer streams in, usually 1–2 seconds after they stop (1.3–2.1 s in end-to-end tests).
- **Read the top line first.** Say the quoted sentence, then talk through the bullet points in your own words. See [Answer formats](#answer-formats-and-response-modes).
- **Follow-ups are linked.** A follow-up ("what if the array is sorted?") is answered in the context of the previous question and marked **Follow-up #n**.
- **Type your own question** in the Ask box and press <kbd>Enter</kbd> or **Stream**, for example "give me the Java version" or "explain the second step".
- **Force an answer** with <kbd>Enter</kbd> (window focused) or <kbd>⌘</kbd><kbd>⌥</kbd><kbd>S</kbd> if Auto-Pilot has not triggered.
- **Coding problem on screen?** Press <kbd>⌘</kbd><kbd>⌥</kbd><kbd>C</kbd>, or turn on **Auto-Watch** before the coding round.
- **Failing test case?** Press <kbd>⌘</kbd><kbd>⌥</kbd><kbd>D</kbd> with the error visible.
- **Thinking out loud for a while?** Press <kbd>⌘</kbd><kbd>⌥</kbd><kbd>P</kbd> to pause Auto-Pilot, and again to resume.
- **Need to click through the overlay?** <kbd>⌘</kbd><kbd>⌥</kbd><kbd>M</kbd> toggles click-through; the **Passthrough** badge shows the state.
- **Clear the screen instantly:** <kbd>Esc</kbd> or <kbd>⌘</kbd><kbd>⌥</kbd><kbd>X</kbd>.

### After the call

Stop the tab stream in the extension popup, then clear the transcript with the trash icon if you do not want it in the next session's context.

---

## Keyboard shortcuts

On Windows and Linux, use <kbd>Ctrl</kbd> instead of <kbd>⌘</kbd> and <kbd>Alt</kbd> instead of <kbd>⌥</kbd>. GlanceAI's on-screen hints switch automatically.

### Global (work even when GlanceAI is in the background)

| Shortcut | Action |
| :--- | :--- |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>M</kbd> or <kbd>⌘</kbd><kbd>⌥</kbd><kbd>J</kbd> | Toggle click-through (mouse passes through the overlay). |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>H</kbd> | Hide / show the overlay (transcription keeps running). |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>C</kbd> | Capture the screen and answer the problem on it. |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>S</kbd> | Force-solve the latest transcript now. |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>X</kbd> | Panic clear: stop the answer, wipe it, and forget the follow-up context. |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>P</kbd> | Toggle **Candidate Speaking** (pauses Auto-Pilot; mic speech is labeled `CANDIDATE`). |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>D</kbd> | Debug the failing test case on screen. |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>N</kbd> | Toggle notch mode. |
| <kbd>⌘</kbd><kbd>⌥</kbd><kbd>[</kbd> / <kbd>]</kbd> | Decrease / increase overlay opacity (20–100%). |

### Inside the GlanceAI window

| Shortcut | Action |
| :--- | :--- |
| <kbd>Enter</kbd> (outside text boxes) | Force-solve the latest transcript. |
| <kbd>Enter</kbd> (in the Ask box) | Send your typed question. |
| <kbd>Esc</kbd> (outside text boxes) | Panic clear. |
| <kbd>⌘</kbd><kbd>K</kbd> / <kbd>Ctrl</kbd><kbd>K</kbd> | New turn: mark the current transcript as answered so the next question starts fresh. |

---

## The interface

| Area | What is there |
| :--- | :--- |
| **Title bar** | Status dot, **Passthrough** badge (click-through state), active model, notch-mode button, screen-capture button, settings (gear), minimize, close. |
| **Ask row** | Type a question or instruction and press **Stream**. |
| **Question card** | The question being answered, with a **Follow-up #n** tag when it builds on the previous one. |
| **Answer pane** | The streamed answer. **Clean Code** copies only the code; the copy and trash icons copy or clear the whole answer. Before any answer, quick-action chips appear here. |
| **Mentor whisper card** | Amber card with hints sent from the mentor portal; dismiss with ✕. |
| **Transcript bar** | Collapsed by default to the last line heard. Holds **Start/Stop Listening**, the **Tab** badge, the speaker-mode button, **New Turn**, clear, and expand. |
| **Bottom bar** | **⚡ Solve Audio (Enter)**, **Auto-Pilot ON/OFF**, **Auto-Watch ON/OFF**. |
| **Settings panel** | API keys, models, response mode, code language, audio device, opacity, resume and JD, companion links and LAN mode, proxy. |

---

## Audio and speaker detection

### Option 1: Chrome extension (recommended)

The extension streams the call tab's audio to GlanceAI in 100 ms chunks and plays it back to your headphones, so you hear the call normally.

- **Labels:** call audio is `INTERVIEWER (MEET)` (also for Zoom and Teams in the browser). While call audio is live, your mic is always `CANDIDATE`.
- **Your mic starts itself:** as soon as call audio goes live, GlanceAI starts your mic so your answers are transcribed too. If you stop the mic yourself, it stays off.
- **Restarting GlanceAI mid-call is safe:** the extension notices and starts a fresh audio stream, so you do not need to restart the tab stream.
- **Works on any tab:** the extension records whichever tab you start it on. Start it on the tab where the call is actually running; if Zoom or Teams opens the meeting in a new tab or window, start (or restart) the stream there.

**Tab badge states:**

| Badge | Meaning | What to do |
| :--- | :--- | :--- |
| **Tab: Standby** | No call audio is arriving. | Start the stream from the extension popup on the call tab. |
| **Tab: Connecting…** | Audio is arriving; GlanceAI is connecting to Deepgram. | Wait a second; if it stays, check your Deepgram key. |
| **Tab: Live (n)** | Working. `n` counts audio chunks. | Nothing. |
| **Tab: Rejected** | GlanceAI refused the audio because the extension is not paired. | Reload the extension, check the popup says **Paired**, pair again if needed, and restart the stream. |

### Option 2: Virtual audio device (desktop meeting apps)

For the Zoom or Teams desktop apps, route their output through a loopback device and select it in GlanceAI's audio device list (it shows as `🔊 [Loopback / Speaker]`). GlanceAI then uses Deepgram's speaker diarization: the first speaker is treated as the interviewer.

- **macOS:** `brew install blackhole-2ch`, then in **Audio MIDI Setup** create a **Multi-Output Device** with your headphones and BlackHole 2ch, set it as the meeting app's output, and select BlackHole in GlanceAI.
- **Windows:** install [VB-Audio Virtual Cable](https://vb-audio.com/Cable/), set the meeting app's speaker to `CABLE Input`, enable "Listen to this device" on `CABLE Output` to hear it, and select `CABLE Output` in GlanceAI. Stereo Mix also works.

### Option 3: Microphone only

If the interviewer comes through your speakers into the same mic, GlanceAI defaults to **Interviewer** listening mode: speech is labeled `INTERVIEWER` unless it clearly sounds like a candidate answer ("Sir, can I assume…", "So I'll start coding…"). Press <kbd>⌘</kbd><kbd>⌥</kbd><kbd>P</kbd> while you answer so your speech is labeled `CANDIDATE` and cannot trigger Auto-Pilot.

### Transcription quality

- Deepgram Nova-3 with about 80 boosted technical terms (data structures, system design, databases, Indian payments and compliance terms) plus project names from your resume.
- A local correction layer fixes common mishearings before anything is shown or answered: "two some" → "Two Sum", "spill light" → "SQLite", "yellow you cache" → "LRU cache", "radio routing" → "rate limiting", "3 c n f" → "BCNF".
- **No Deepgram key?** GlanceAI keeps the last ~25 seconds of mic audio and transcribes it with Groq Whisper when you press Solve.

---

## How Auto-Pilot decides what to answer

1. **Only the interviewer can trigger it.** Call audio always can; your mic never can while call audio is live or while **Candidate Speaking** is on.
2. **It waits for the end of the question.** Deepgram's end-of-speech signal fires the answer immediately; if a sentence ends mid-phrase ("…the difference between"), GlanceAI waits for the rest.
3. **Multi-sentence questions are joined.** "Let's say you have a payments system. It gets duplicate webhooks. How would you make it idempotent?" becomes one question.
4. **Quick continuations update the answer.** If the interviewer adds a clause within a couple of seconds ("…and how would you test it?"), the answer is regenerated for the whole question instead of starting a second one.
5. **Small talk is ignored.** Greetings and call logistics ("Can you hear me?", "What happened?", "How is it?") and remarks that only contain words like "could" mid-sentence do not trigger answers.
6. **Repeats are skipped.** The same question asked again within a few seconds is not answered twice.
7. **Follow-ups use context.** The previous two questions and answers are sent along, so "what about its space complexity?" is answered about the right thing.

Turn Auto-Pilot off with the bottom-bar button when you only want answers on demand.

---

## Answer formats and response modes

### Verbal questions

```markdown
> "A hash map stores key-value pairs in buckets, using a hash function to jump straight
>  to the right bucket, so lookups, inserts and deletes are O(1) on average."

### ⏱️ Complexity: Time: O(1) average | Space: O(n)

### 🧠 Core Talking Points
* **Hash Function:** Maps a key to a bucket index.
* **Collision Handling:** Chaining or open addressing.
* **Load Factor & Rehashing:** Doubles capacity past ~0.75.

### ⚠️ Senior Production Gotcha / Real-World Trade-Off
* **Hash Flooding:** Adversarial keys degrade lookups to O(n).

### 🎯 Anticipated Follow-Up Question
* *Interviewer will likely ask:* "How would you build an LRU cache on top of this?"
```

**How to use it:** say the quoted line first, glance at the bold labels to structure the rest in your own words, and close with the gotcha.

### Coding questions

Coding answers follow a brute-force → optimal ladder:

1. **Spoken line:** the naive approach, why it fails, and the better data structure.
2. **Glance anchors:** four chips (`BRUTE`, `BRIDGE`, `CORE`, `TRAP`) you can absorb at a glance.
3. **Brute force:** the naive approach and its bottleneck, to say first.
4. **The bridge:** the insight that gets you to the optimal solution.
5. **Clean implementation:** in your chosen language, without comments or boilerplate.
6. **Follow-up and edge cases:** a space optimization and the traps to mention.

Coding answers get a larger token budget (2,500 vs 1,500) so code is never cut off.

### Debugger answers (<kbd>⌘</kbd><kbd>⌥</kbd><kbd>D</kbd>)

One sentence explaining the bug, the **root cause**, a **1-line patch** shown as a diff, and a **dry run** proving the fix.

### Response modes

| Mode | Best for | Behavior |
| :--- | :--- | :--- |
| **🧠 Smart Adaptive** (recommended) | Mixed rounds | Chooses verbal or coding format per question. |
| **🎙️ Live Interview Teleprompter** | Verbal screens | Always the glance-and-speak format. |
| **💻 Algorithm & LeetCode** | Live coding rounds | Always the coding ladder with complexity analysis. |
| **🏗️ System Design & Architecture** | Design rounds | Requirements and scale, architecture and data flow, storage and schema, bottlenecks and trade-offs. |
| **💼 Project & Behavioral** | Hiring-manager rounds | STAR answers grounded in your resume. |

### Quick actions

The chips under the answer pane (and the pitch buttons next to your resume and JD) generate:

- **Tell me about yourself:** a 60-second pitch from your resume.
- **Top STAR stories:** three behavioral stories with metrics from your resume.
- **Tech stack defense:** why you chose the technologies on your resume.
- **Why this role:** a pitch matching your resume to the job description.

---

## Screen features: capture, Auto-Watch, debugger

- **Screen capture (<kbd>⌘</kbd><kbd>⌥</kbd><kbd>C</kbd> or the camera button):** captures the display under your cursor, downscales it to keep requests fast, and asks the vision model to solve the problem on screen. On macOS, a local Apple Vision OCR step also extracts the text, so the question title shows as `Screen: <problem name>` and text-only fallback models can still read the problem.
- **Auto-Watch (bottom-bar toggle):** checks the screen every 5 seconds and only sends a request when the screen meaningfully changes. If the model sees no coding problem it answers `[NO_PROBLEM_DETECTED]` and your current answer stays untouched.
- **Instant debugger (<kbd>⌘</kbd><kbd>⌥</kbd><kbd>D</kbd>):** captures the screen with the failing test and error, and returns a root cause, a minimal patch and a dry run.

---

## Notch mode

Press <kbd>⌘</kbd><kbd>⌥</kbd><kbd>N</kbd> (or the notch button) to shrink GlanceAI into a pill centered just below the webcam. Reading it keeps your eyes close to the camera.

- **Top line:** the full sentence to say, in large text.
- **Keyword cues:** talking-point names for verbal answers, or the Brute / Bridge / Core / Trap anchors for coding. A trade-off or gotcha shows in amber.
- **Footer:** the question being answered (marked **Follow-up** when it is one) and a status dot that pulses while the answer streams.
- **States:** shows **Answering…** while a new answer loads, so the previous answer never lingers, and a short message if the request fails ("Rate limited. Wait 10-15s, then ask again.").
- **Size:** the pill is up to 520 px wide and grows or shrinks with the answer. Drag it by the footer; press ✕ or <kbd>⌘</kbd><kbd>⌥</kbd><kbd>N</kbd> to return to the full HUD.

---

## Models, keys and automatic fallback

### Models

| Model | Use |
| :--- | :--- |
| `qwen/qwen3.8-27b` (default) | Fastest to the first word; also the vision model for screenshots. |
| `openai/gpt-oss-120b` | Strongest reasoning; first fallback. |
| `openai/gpt-oss-20b` | Very fast; second fallback. |
| Gemini 2.0 Flash | Only with a Google AI key, only for screenshots, only after every Groq option fails. |

### What happens on a rate limit

For each request GlanceAI builds an ordered list of (model × key) options and opens the first that starts streaming:

```
your selected model   → Key #1, then Key #2
openai/gpt-oss-120b   → Key #1, then Key #2
openai/gpt-oss-20b    → Key #1, then Key #2
qwen/qwen3.8-27b      → (if it was not already first)
Gemini 2.0 Flash      → screenshots only, with a Google AI key
```

- A rate-limited key is remembered per model, so later requests skip it until its cooldown ends while your other key keeps serving that model.
- A short cooldown (≤ 5 s) on a fast model moves on immediately and only comes back to that model if everything else fails.
- For screenshots, text-only fallback models receive the OCR text instead of the image (macOS), so they can still answer.

**Tip:** free Groq limits are tight during a long session. A backup key, or a paid Groq plan, removes most waits. The terminal logs every fallback (`Rotating to … (Key #2)`, `Falling back to …`).

---

## Phone companion and mentor portal

GlanceAI runs a small local server on port `4242`, which is how the Chrome extension, the phone companion and the mentor portal talk to it.

- **Localhost only by default.** Click **🌐 Mode** in settings to also serve it on your local network (needed for your phone).
- **Token-protected.** Every page and API needs the security token; only a basic health check and the two bundled script files are public. **Copy Mobile** and **Copy Mentor** copy links that include the token. The token persists across restarts, and it is never printed in the terminal.
- **Phone companion (`/`):** the live answer, an Ask box, quick-action chips, and a blackout button that turns the phone screen black.
- **Mentor portal (`/mentor`):** the live transcript, the detected question, the streaming answer, an optional live audio monitor of the call audio, a screenshot on request, and one-click or custom **whispers** that appear in GlanceAI's amber whisper card.
- **Over the internet:** `npm run tunnel` (macOS / Linux) starts a Cloudflare Tunnel (or ngrok if installed) and copies a public HTTPS mentor link with the token to your clipboard.

Anyone with a mentor or mobile link can see your session, so share links only with people you trust and restart the tunnel to stop sharing.

---

## Privacy and security

- **Your keys, your machine.** Keys and settings are stored in a JSON config file (not encrypted) in your user profile:
  - macOS: `~/Library/Application Support/glanceai/glanceai-config.json`
  - Windows: `%APPDATA%\glanceai\glanceai-config.json`
  - Linux: `~/.config/glanceai/glanceai-config.json`

  The file is in `.gitignore`; never commit or share it.
- **Where data goes.**
  - Audio goes to Deepgram (or to Groq Whisper without a Deepgram key).
  - Questions, transcript context, your resume and JD text, and screenshots go to Groq.
  - Screenshots go to Google only when the Gemini fallback is used.
  - Nothing goes to any GlanceAI server.
- **Local server.** Bound to `127.0.0.1` unless you switch on LAN mode. Everything except a basic health check and the bundled script files needs the token. Requests through a tunnel are treated as remote even though they arrive from localhost, and the Chrome extension must be paired.
- **Screen capture exclusion.** The GlanceAI window uses the operating system's content protection, so it does not appear in screen shares, screenshots or recordings, including your own. On Windows this needs Windows 10 version 2004 or newer; Linux is not supported.

---

## Platform notes

| | macOS | Windows | Linux |
| :--- | :---: | :---: | :---: |
| Overlay, shortcuts, notch mode | ✅ | ✅ (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>) | ✅ |
| Chrome extension + speaker labels | ✅ | ✅ | ✅ |
| Excluded from screen capture | ✅ | ✅ Windows 10 2004+ | ❌ not supported by Electron |
| Local OCR for screenshots | ✅ Apple Vision | ❌ (vision model only) | ❌ (vision model only) |
| `npm run bg` / `stop` / `dev` / `tunnel` | ✅ | ❌ use the PowerShell command above | ✅ |

GlanceAI is developed and tested on macOS. On Windows, without local OCR, screenshot answers depend on the vision model; when it is rate-limited, the text-only fallbacks cannot read the screen. Do a full trial run on a new machine before relying on it.

---

## Troubleshooting

| Problem | Fix |
| :--- | :--- |
| **Tab badge stays on Standby** | Start the stream from the extension popup **on the call tab**. If the popup shows "Stop Tab Stream" but nothing arrives, click Stop, then Start. |
| **Tab badge shows Rejected** | The extension is not paired, or Chrome is running old extension code. Reload the extension in `chrome://extensions`, check the popup says **Paired** (pair again with the **Copy Mobile** link if not), then restart the stream. |
| **Your own voice is not transcribed** | Check the mic button says **Stop Listening** and the right device is selected. The mic starts automatically when call audio goes live, unless you stopped it yourself earlier in the session. |
| **Everyone is labeled INTERVIEWER** | Call audio is not reaching GlanceAI (see the Tab badge), so only the mic is heard. Fix the tab stream, or use <kbd>⌘</kbd><kbd>⌥</kbd><kbd>P</kbd> while you speak. |
| **Answers are slow or show "Rate limited"** | Groq limits were hit. Add a backup key, wait 10–15 s, or check the terminal for which models fell back. |
| **"Groq API key rejected"** | Re-paste the key in settings and click Save. |
| **Screen capture does nothing (macOS)** | Grant **Screen Recording** permission (System Settings → Privacy & Security) to Electron or your terminal, then restart GlanceAI. |
| **GlanceAI disappeared** | Press <kbd>⌘</kbd><kbd>⌥</kbd><kbd>H</kbd> to show it. If it ignores clicks, press <kbd>⌘</kbd><kbd>⌥</kbd><kbd>M</kbd> to turn off click-through. |
| **A shortcut does nothing** | Another app may own it. The terminal lists every shortcut GlanceAI registered at startup. |
| **Extension changes are not taking effect** | Click reload (↻) on the extension in `chrome://extensions` after every update that touches `extensions/`. |
| **Something else** | Look at the terminal. `[GlanceAI Audio]` lines show when call audio arrives and when each Deepgram connection opens or closes; `[GlanceAI LLM]` lines show every model attempt. |

---

## Development

### Project structure

```
main.js                  Electron main process: window, shortcuts, screen capture + OCR, IPC, LLM streaming
preload.js               The bridge that exposes a small, explicit API to the page
renderer.js              UI, audio pipelines (mic + tab), Deepgram sockets, Auto-Pilot, notch mode
index.html / styles.css  The HUD
lib/interview-engine.js  Shared logic: question detection, transcript sanitizer, Deepgram vocabulary,
                         talking-point and anchor extraction, circuit breaker
lib/prompts.js           System prompts and per-request turn building (one classification per request)
lib/llm/models.js        Model catalogue, fallback tiers, saved-model migration
lib/llm/providers.js     Groq and Gemini streaming providers
lib/llm/router.js        Model × key candidates and the fallback / rate-limit logic
lib/notch-geometry.js    Notch pill position and size
companion-server.js      Local HTTP/SSE server: tab audio, phone companion, mentor portal (token auth)
companion.html           Phone companion page
mentor.html              Mentor portal page
extensions/glanceai-tab-audio/  Chrome MV3 extension (popup, background worker, offscreen recorder)
scripts/                 Diagnostics, tunnel launcher, macOS OCR source (ocr.swift)
bin/macos_ocr            Compiled Apple Vision OCR helper
vendor/                  Bundled marked + DOMPurify used by the HUD and companion pages
```

### Tests

```bash
npm test                 # lint + syntax + every suite below (offline, no API calls)
npm run test:prompts     # prompt and output-format contracts
npm run test:router      # model × key fallback and rate-limit behavior
npm run test:stream      # main-process streaming with mocked providers
npm run test:edge-cases  # question detection, sanitizer, companion auth, extension, notch, vocabulary
npm run test:benchmark   # real Groq latency benchmark (uses your key and quota)
```

`npm test` runs entirely offline. Only `test:benchmark` makes real API calls.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## License

GlanceAI is released under the [MIT License](LICENSE).

Copyright (c) 2026 GlanceAI Contributors<br>
Copyright (c) 2026 the original upstream authors

GlanceAI bundles and depends on third-party software under their own licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

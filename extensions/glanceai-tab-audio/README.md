# GlanceAI Tab Audio Bridge (Chrome / Chromium Extension)

A lightweight Manifest V3 Chrome Extension that streams digital interviewer audio directly from **Google Meet**, **Zoom Web**, **Microsoft Teams**, or **HackerRank** into GlanceAI with **zero virtual audio cables** (no BlackHole / VB-Cable setup needed).

---

### Features
- 🎧 **Zero Audio Cable Hassle**: Works seamlessly even when you wear AirPods, Bluetooth headsets, or noise-canceling headphones.
- 🔊 **Audio Mirroring**: Automatically routes audio to your headphones so you hear the call normally while GlanceAI receives pristine digital audio.
- ⚡ **Ultra-Low Latency**: Slices audio into 100ms chunks and streams via local HTTP (`localhost:4242/api/tab-audio`) directly to Deepgram Nova-3.
- 🔒 **Local-First & Secure**: Audio never touches third-party relay servers; streams strictly to your local GlanceAI instance on `localhost`.

---

### Installation (Takes 15 Seconds)
1. Open Chrome, Brave, Edge, or Arc browser and navigate to:
   ```text
   chrome://extensions
   ```
2. Enable **Developer mode** toggle in the top-right corner.
3. Click **Load unpacked** (top-left).
4. Select the `extensions/glanceai-tab-audio` folder from your GlanceAI installation directory.
5. **Pair once**: with GlanceAI running, click **Copy Mobile** in GlanceAI settings, open the extension popup, paste the link into the **Pair** box and click **Pair**. The popup then shows **Paired**. GlanceAI rejects unpaired audio, and its Tab badge shows **Rejected** if pairing is missing.

After pulling GlanceAI updates that touch `extensions/`, click reload (↻) on the extension in `chrome://extensions`. Chrome keeps running the old code until you do.

---

### Usage During an Interview
1. Open your meeting tab (e.g. `meet.google.com`, or Zoom / Teams joined **in the browser**, not the desktop app).
2. Click the **GlanceAI Tab Audio** extension icon in your Chrome toolbar, on the tab where the call is running.
3. Click **🎙️ Stream Current Tab Audio**.
4. GlanceAI's Tab badge switches to **🎧 Tab: Live**. The call audio is labeled `INTERVIEWER (MEET)`, and GlanceAI starts your mic automatically (unless you turned it off) so your answers are labeled `CANDIDATE`.

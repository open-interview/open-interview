# Voice Recording Debug - Quick Start

## 🚨 Recording/Transcript Not Working? Start Here!

### 1️⃣ Check Your Browser (30 seconds)

**Open the app in one of these:**
- ✅ **Chrome** (recommended)
- ✅ **Microsoft Edge**
- ✅ **Safari**

**NOT these:**
- ❌ Firefox (doesn't support Web Speech API)
- ❌ Opera
- ❌ Other browsers

👉 **Action:** If you're using Firefox, switch to Chrome now.

---

### 2️⃣ Open Browser Console (10 seconds)

**Press F12** (or Cmd+Option+I on Mac)

You should see a console with logs. Keep it open!

---

### 3️⃣ Navigate to Voice Practice

Go to: `/voice-interview` or `/training`

---

### 4️⃣ Check System Status Panel (at top of page)

Look for the status panel. It should show:

✅ **Good:**
```
Speech API: ✓ Available
Recognition: ✓ Ready
Protocol: https:
Recording: idle
```

❌ **Bad:**
```
Speech API: ✗ Not Available
```
→ **Fix:** Switch to Chrome/Edge/Safari

⚠️ **Warning:**
```
Recognition: ⏳ Initializing...
```
→ **Fix:** Wait 5 seconds. If it doesn't change, check console for errors.

---

### 5️⃣ Click "Start Recording"

**What should happen:**
1. Browser asks for microphone permission → Click "Allow"
2. Timer starts counting
3. Speak into your microphone
4. Transcript appears in real-time

**What you see in console:**
```
=== START RECORDING CLICKED ===
🎤 Checking microphone permissions...
✅ Microphone access granted
✅ MediaRecorder started
🎤 Starting speech recognition...
🎤 Speech recognition STARTED
📝 Speech result received
⏳ Interim transcript: "hello"
✅ Final transcript: "hello"
```

---

### 6️⃣ If Nothing Happens

**Check console for errors:**

#### Error: "not-allowed" or "permission-denied"
```
❌ Speech recognition ERROR: not-allowed
```
**Fix:**
1. Click microphone icon (🎤) in address bar
2. Select "Allow"
3. Refresh page

#### Error: "Speech recognition not supported"
```
❌ Speech recognition not supported in this browser
```
**Fix:** You're using Firefox or unsupported browser. Switch to Chrome.

#### Error: "network"
```
❌ Speech recognition ERROR: network
```
**Fix:** Check your internet connection. Web Speech API requires internet.

#### No errors, but nothing happens
**Fix:** Run the diagnostic tool (see step 7)

---

### 7️⃣ Run Diagnostic Tool

Open in new tab: `/test-speech-recognition.html`

This will:
- ✅ Check browser compatibility
- ✅ Check HTTPS protocol
- ✅ Test microphone permissions
- ✅ Test speech recognition
- ✅ Show detailed logs

Follow the on-screen instructions.

---

## 🎯 Most Common Issues

### Issue: "Microphone access denied"
**Solution:**
1. Look for microphone icon (🎤) in browser address bar
2. Click it
3. Select "Allow"
4. Refresh page

### Issue: Using Firefox
**Solution:** Firefox doesn't support Web Speech API. Use Chrome or Edge.

### Issue: HTTP instead of HTTPS
**Solution:** Access the app via HTTPS or localhost.

### Issue: No internet connection
**Solution:** Connect to internet. Web Speech API requires it.

---

## 📋 Quick Checklist

Before reporting an issue, verify:

- [ ] Using Chrome, Edge, or Safari (NOT Firefox)
- [ ] URL starts with `https://` or `http://localhost`
- [ ] Browser console is open (F12)
- [ ] System Status shows "✓ Ready"
- [ ] Microphone permission granted (check address bar)
- [ ] Internet connection is active
- [ ] System microphone permission enabled (OS settings)

---

## 🆘 Still Not Working?

### Share This Information:

1. **Browser & Version:**
   - Example: Chrome 120.0.6099.109
   - Find it: chrome://version or edge://version

2. **Console Logs:**
   - Copy everything from console (F12)
   - Especially lines with ❌ or ⚠️

3. **Diagnostic Tool Results:**
   - Run `/test-speech-recognition.html`
   - Screenshot or copy results

4. **What You See:**
   - What does System Status panel show?
   - What happens when you click "Start Recording"?
   - Any error messages?

---

## 📚 More Help

- **Full Guide:** `VOICE_RECORDING_TROUBLESHOOTING.md`
- **Technical Details:** `VOICE_RECORDING_DEBUG_SUMMARY.md`
- **Diagnostic Tool:** `/test-speech-recognition.html`

---

## ⚡ TL;DR

1. Use Chrome (not Firefox)
2. Open console (F12)
3. Go to Voice Practice
4. Check System Status panel
5. Click "Start Recording"
6. Allow microphone
7. Speak
8. Check console for errors

**If it doesn't work:** Run `/test-speech-recognition.html` and share results.

---

**Last Updated:** January 19, 2026

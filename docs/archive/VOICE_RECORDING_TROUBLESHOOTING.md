# Voice Recording Troubleshooting Guide

## Issue: No Recording or Transcript Visible

If you're experiencing issues with voice recording and transcription not working, follow this comprehensive troubleshooting guide.

## Quick Diagnostic Steps

### 1. Check Browser Compatibility

**Supported Browsers:**
- ✅ Chrome (recommended)
- ✅ Microsoft Edge
- ✅ Safari (macOS/iOS)

**NOT Supported:**
- ❌ Firefox (does not support Web Speech API)
- ❌ Opera
- ❌ Most other browsers

**Action:** Open the app in Chrome or Edge.

### 2. Check Protocol (HTTPS)

The Web Speech API requires a secure connection (HTTPS) or localhost.

**Check your URL:**
- ✅ `https://your-domain.com` - Good
- ✅ `http://localhost:3000` - Good
- ❌ `http://your-domain.com` - Won't work

**Action:** Ensure you're accessing the app via HTTPS or localhost.

### 3. Check Microphone Permissions

**Chrome/Edge:**
1. Look for the microphone icon (🎤) in the address bar
2. Click it and select "Allow"
3. If you previously blocked it, you need to reset:
   - Click the lock icon in address bar
   - Find "Microphone" permission
   - Change to "Allow"
   - Refresh the page

**Safari:**
1. Safari → Settings → Websites → Microphone
2. Find your site and set to "Allow"
3. Refresh the page

**Action:** Grant microphone permissions and refresh.

### 4. Check Internet Connection

The Web Speech API requires an active internet connection for speech-to-text processing.

**Action:** Ensure you have a stable internet connection.

### 5. Check System Microphone

**macOS:**
1. System Settings → Privacy & Security → Microphone
2. Ensure your browser is checked
3. Restart browser if you just enabled it

**Windows:**
1. Settings → Privacy → Microphone
2. Ensure "Allow apps to access your microphone" is ON
3. Ensure your browser is allowed
4. Restart browser if you just enabled it

**Action:** Verify system-level microphone permissions.

## Diagnostic Tool

We've created a diagnostic tool to help identify the exact issue:

1. Navigate to: `/test-speech-recognition.html`
2. The tool will check:
   - Browser compatibility
   - Protocol (HTTPS)
   - Microphone permissions
   - Speech Recognition API availability
3. Follow the on-screen instructions
4. Check the diagnostic log for specific errors

## Console Debugging

The VoicePractice component has extensive logging. To view:

1. Open browser console (F12 or Cmd+Option+I on Mac)
2. Go to the Console tab
3. Look for messages starting with:
   - `=== INITIALIZING SPEECH RECOGNITION ===`
   - `✅` (success messages)
   - `❌` (error messages)
   - `⚠️` (warning messages)

### Common Console Errors

#### Error: "not-allowed" or "permission-denied"
```
❌ Speech recognition ERROR: not-allowed
```
**Solution:** Grant microphone permissions (see step 3 above)

#### Error: "network"
```
❌ Speech recognition ERROR: network
```
**Solution:** Check your internet connection

#### Error: "no-speech"
```
⚠️ No speech detected
```
**Solution:** This is normal if you haven't spoken yet. Start speaking after clicking "Start Recording"

#### Error: "Speech recognition not supported"
```
❌ Speech recognition not supported in this browser
```
**Solution:** Switch to Chrome, Edge, or Safari

## Step-by-Step Test

1. **Open the app in Chrome**
2. **Navigate to Voice Practice** (`/voice-interview` or `/training`)
3. **Check the System Status panel** at the top:
   - Speech API should show: ✓ Available
   - Recognition should show: ✓ Ready
   - Protocol should show: https: or http: (if localhost)
4. **Click "Start Recording"**
5. **Allow microphone access** when prompted
6. **Speak clearly** into your microphone
7. **Watch for:**
   - Timer should start counting
   - Transcript should appear in real-time
   - Console should show: `🎤 Speech recognition STARTED`
   - Console should show: `📝 Speech result received`

## Still Not Working?

### Check Console Logs

Open console (F12) and look for the initialization sequence:

```
=== INITIALIZING SPEECH RECOGNITION ===
Window location: https://...
Protocol: https:
isSpeechSupported: true
SpeechRecognition available: true
✅ Recognition instance created successfully
✅ Recognition configured
✅ Recognition stored in ref and ready to use
✅ Recognition ready state set to true
```

If you see any ❌ errors, that's your issue.

### Test with Diagnostic Tool

1. Open `/test-speech-recognition.html` in a new tab
2. Click "Request Microphone Permission"
3. Click "Start Speech Recognition Test"
4. Speak into your microphone
5. Check if transcript appears

If the diagnostic tool works but the app doesn't, there may be a component-specific issue.

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Initializing..." never completes | Refresh page, check console for errors |
| Microphone permission popup doesn't appear | Check if you previously blocked it, reset permissions |
| Transcript appears but is inaccurate | Speak more clearly, reduce background noise |
| Recording stops immediately | Check internet connection, may be network timeout |
| "Start Recording" button disabled | Wait for "Recognition: ✓ Ready" status |

## Browser-Specific Issues

### Chrome
- Works best, recommended
- Requires HTTPS (except localhost)
- May require "Use microphone" permission in site settings

### Edge
- Works well, based on Chromium
- Same requirements as Chrome

### Safari
- Works but may have delays
- Requires explicit microphone permission
- May need to enable in Safari settings

### Firefox
- **NOT SUPPORTED** - Firefox does not implement the Web Speech API
- Use Chrome or Edge instead

## Technical Details

### What's Happening Behind the Scenes

1. **Initialization:**
   - Component creates `SpeechRecognition` instance
   - Configures: continuous=true, interimResults=true, lang=en-US
   - Sets up event handlers (onstart, onresult, onerror, onend)

2. **Starting Recording:**
   - Requests microphone permission via `getUserMedia()`
   - Starts `MediaRecorder` for audio playback
   - Starts `SpeechRecognition` for transcription
   - Sets recording state to 'recording'

3. **During Recording:**
   - Speech API sends interim results (gray text)
   - Speech API sends final results (white text)
   - Transcript updates in real-time
   - Timer counts up

4. **Stopping Recording:**
   - Stops `SpeechRecognition`
   - Stops `MediaRecorder`
   - Calculates feedback (word count, duration)
   - Reveals answer (in interview mode)

### Why It Might Not Work

1. **Browser doesn't support Web Speech API**
   - Solution: Use Chrome/Edge/Safari

2. **No HTTPS connection**
   - Solution: Use HTTPS or localhost

3. **Microphone permission denied**
   - Solution: Grant permission and refresh

4. **No internet connection**
   - Solution: Connect to internet (API requires it)

5. **System-level microphone blocked**
   - Solution: Enable in OS settings

6. **Microphone in use by another app**
   - Solution: Close other apps using microphone

## Getting Help

If you've tried everything and it still doesn't work:

1. **Collect Information:**
   - Browser name and version
   - Operating system
   - URL protocol (http/https)
   - Console error messages
   - Diagnostic tool results

2. **Check Console:**
   - Open console (F12)
   - Copy all messages starting with `===` or `❌`
   - Include in your bug report

3. **Test Diagnostic Tool:**
   - Run `/test-speech-recognition.html`
   - Take screenshot of results
   - Include in your bug report

## Quick Reference

### Keyboard Shortcuts
- **F12** - Open browser console (Windows/Linux)
- **Cmd+Option+I** - Open browser console (Mac)
- **Cmd+R** / **Ctrl+R** - Refresh page

### URLs
- Voice Practice: `/voice-interview` or `/training`
- Diagnostic Tool: `/test-speech-recognition.html`

### Status Indicators
- ✓ Available - Feature is working
- ⏳ Initializing - Please wait
- ✗ Not Available - Feature not supported

### Recording States
- **idle** - Ready to record
- **recording** - Currently recording
- **recorded** - Recording complete

---

**Last Updated:** January 19, 2026
**Component:** `client/src/pages/VoicePractice.tsx`
**Diagnostic Tool:** `client/public/test-speech-recognition.html`

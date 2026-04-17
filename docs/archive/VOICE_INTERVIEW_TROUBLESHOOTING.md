# Voice Interview Troubleshooting Guide

## Quick Diagnostics

### Step 1: Check Browser Compatibility

**Supported Browsers:**
- ✅ Chrome (recommended)
- ✅ Edge (Chromium)
- ✅ Safari
- ❌ Firefox (no Web Speech API support)

**Action**: If using Firefox, switch to Chrome or Edge.

### Step 2: Verify Microphone Access

**Check Permissions:**
1. Click the lock icon in the address bar
2. Look for "Microphone" permission
3. Ensure it's set to "Allow"

**Test Microphone:**
1. Open system sound settings
2. Speak into microphone
3. Verify input levels are moving

**Action**: If denied, grant permission and refresh page.

### Step 3: Open Browser Console

**How to Open:**
- Windows/Linux: Press `F12` or `Ctrl+Shift+I`
- Mac: Press `Cmd+Option+I`

**What to Look For:**
```
✅ Good Signs:
- "Speech recognition started"
- "Speech recognition result received: X"
- "Interim transcript: [your words]"
- "Final transcript: [your words]"

❌ Bad Signs:
- "Microphone access denied"
- "Speech recognition error: not-allowed"
- No logs at all
- Red error messages
```

### Step 4: Test Recording Flow

1. **Navigate to Voice Interview**
   - URL: `/voice-interview`
   - Should see question and "Start Recording" button

2. **Click "Start Recording"**
   - Should see red pulsing dot
   - Should see "Recording" text
   - Should see "(Listening...)" if not speaking yet
   - Transcript area should appear with placeholder

3. **Speak Clearly**
   - Say: "Hello, this is a test"
   - Should see gray text appear (interim)
   - After pause, should see white text (final)
   - Console should log each word

4. **Click "Stop Recording"**
   - Should transition to editing mode
   - Should see textarea with transcript
   - Should see "Submit Answer" button

## Common Issues

### Issue 1: No Transcript Appears

**Symptoms:**
- Recording indicator shows
- Console logs appear
- But transcript area is empty

**Diagnosis:**
```javascript
// Open React DevTools
// Find VoiceInterview component
// Check state:
{
  state: 'recording',
  transcript: '',        // ← Should update as you speak
  interimTranscript: '', // ← Should update in real-time
}
```

**Solutions:**
1. Check if `transcript` state is updating in React DevTools
2. Verify `onresult` handler is firing (check console)
3. Try speaking louder or more clearly
4. Check if microphone is muted in system settings

### Issue 2: "Microphone Access Denied"

**Symptoms:**
- Error message appears
- Cannot start recording
- Console shows "not-allowed" error

**Solutions:**

**Chrome/Edge:**
1. Click lock icon in address bar
2. Click "Site settings"
3. Find "Microphone" → Change to "Allow"
4. Refresh page

**Safari:**
1. Safari menu → Settings → Websites
2. Click "Microphone"
3. Find your site → Change to "Allow"
4. Refresh page

**System Level (Mac):**
1. System Settings → Privacy & Security
2. Click "Microphone"
3. Enable for your browser
4. Restart browser

### Issue 3: Recording Stops After Few Seconds

**Symptoms:**
- Recording starts fine
- Stops automatically after 5-10 seconds
- Console shows "onend" events

**Diagnosis:**
```
Console logs:
"Speech recognition ended, state: recording"
"Restarting recognition..."
"Speech recognition started"
```

**Solutions:**
1. This is normal behavior - recognition restarts automatically
2. If it doesn't restart, check console for errors
3. Try speaking continuously to keep it active
4. May be browser limitation - try different browser

### Issue 4: Inaccurate Transcription

**Symptoms:**
- Transcript appears but words are wrong
- Missing words or garbled text

**Solutions:**
1. Speak more clearly and at moderate pace
2. Reduce background noise
3. Check microphone quality
4. Use the edit feature to correct errors
5. This is a browser speech recognition limitation

### Issue 5: No Console Logs

**Symptoms:**
- Click "Start Recording"
- Nothing happens
- No console logs appear

**Diagnosis:**
1. Check if using supported browser
2. Verify console is open (F12)
3. Check if page loaded correctly

**Solutions:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Try incognito/private mode
4. Check for JavaScript errors in console
5. Verify dev server is running

### Issue 6: Transcript Area Not Visible

**Symptoms:**
- Recording starts
- No transcript area appears
- Console logs show results

**Diagnosis:**
Check if element exists in DOM:
```javascript
// In browser console:
document.querySelector('.bg-\\[\\#0d1117\\].rounded-xl.min-h-\\[120px\\]')
// Should return an element, not null
```

**Solutions:**
1. Check if CSS is loaded correctly
2. Verify component is rendering (React DevTools)
3. Check for CSS conflicts
4. Try different viewport size
5. Check browser zoom level (should be 100%)

## Advanced Debugging

### Enable Verbose Logging

Add to `VoiceInterview.tsx`:
```typescript
recognition.onaudiostart = () => console.log('Audio capture started');
recognition.onaudioend = () => console.log('Audio capture ended');
recognition.onsoundstart = () => console.log('Sound detected');
recognition.onsoundend = () => console.log('Sound ended');
recognition.onspeechstart = () => console.log('Speech detected');
recognition.onspeechend = () => console.log('Speech ended');
```

### Check Speech Recognition API

In browser console:
```javascript
// Check if API exists
console.log('SpeechRecognition' in window);
console.log('webkitSpeechRecognition' in window);

// Should log: true (in Chrome/Edge/Safari)

// Test basic recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.start();
// Should prompt for microphone access
```

### Monitor State Changes

Add to component:
```typescript
useEffect(() => {
  console.log('State changed:', state);
  console.log('Transcript:', transcript);
  console.log('Interim:', interimTranscript);
}, [state, transcript, interimTranscript]);
```

### Check Microphone Input

In browser console:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('Microphone access granted');
    console.log('Audio tracks:', stream.getAudioTracks());
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.error('Microphone access denied:', err);
  });
```

## Performance Issues

### Slow Transcription

**Symptoms:**
- Long delay between speaking and text appearing
- Laggy UI

**Solutions:**
1. Close other browser tabs
2. Check CPU usage
3. Disable browser extensions
4. Try different browser
5. Check network connection (if using cloud services)

### Memory Leaks

**Symptoms:**
- Browser becomes slow over time
- High memory usage

**Solutions:**
1. Refresh page periodically
2. Check for console errors
3. Monitor memory in DevTools Performance tab
4. Report issue with reproduction steps

## Getting Help

### Information to Provide

When reporting issues, include:

1. **Browser & Version**
   - Example: Chrome 120.0.6099.109

2. **Operating System**
   - Example: macOS 14.2, Windows 11, etc.

3. **Console Logs**
   - Copy all logs from console
   - Include errors and warnings

4. **Steps to Reproduce**
   - Exact steps that cause the issue
   - What you expected vs what happened

5. **Screenshots/Video**
   - Screen recording of the issue
   - Screenshot of console errors

### Where to Report

- GitHub Issues: [Create new issue]
- Include label: `bug`, `voice-interview`
- Use template: Bug Report

## Related Documentation

- [Voice Interview Transcript Fix](./VOICE_INTERVIEW_TRANSCRIPT_FIX.md)
- [Test Helper Script](../script/test-voice-transcript.js)
- [E2E Tests](../e2e/features/voice-transcript.spec.ts)

## Quick Reference

### Keyboard Shortcuts

- `F12` - Open DevTools
- `Ctrl+Shift+R` - Hard refresh
- `Ctrl+Shift+I` - Open DevTools (alternative)

### Console Commands

```javascript
// Check speech recognition support
'SpeechRecognition' in window || 'webkitSpeechRecognition' in window

// Test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })

// Check current state (in React DevTools)
$r.state // or $r.props
```

### URLs

- Voice Interview: `/voice-interview`
- Voice Session: `/voice-session`
- Profile: `/profile`

---

**Last Updated**: 2024
**Version**: 1.0

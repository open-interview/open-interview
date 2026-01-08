# Training Mode - Read & Record Answers

## Overview

Training Mode is a new practice feature that helps users improve their speaking skills by reading technical interview answers aloud and recording themselves. It includes progressive answer reveal and automatic recording cutoff based on word count.

## Key Features

### 1. ✅ Progressive Answer Reveal (Cut-off at Multiple Points)
- Answers are split into segments of ~30 words each
- Users can reveal segments progressively as they practice
- "Reveal More" button shows the next segment
- "Show All" toggle to see the complete answer
- Helps users practice in manageable chunks

### 2. ✅ Auto-Stop Recording After Word Count
- Recording automatically stops after reaching target word count + 5 word buffer
- Uses Web Speech Recognition API to count words in real-time
- Visual progress bar shows words spoken vs target
- Green checkmark when target is reached
- Prevents over-recording and keeps practice focused

### 3. Voice Recording with Playback
- Record your answer using the microphone
- Play back your recording to review
- Reset and re-record as many times as needed
- Audio stored as WebM blob

### 4. Progressive Question Selection
- Uses RAG-based question selection for related topics
- Adaptive difficulty based on your progress
- Questions from all subscribed channels

### 5. Progress Tracking
- Visual progress bar showing completion
- Completed questions counter
- Question navigation (previous/next)

## How It Works

### Progressive Reveal Algorithm
```typescript
1. Split answer into sentences
2. Group sentences into ~30 word segments
3. Show first segment initially
4. User clicks "Reveal More" to see next segment
5. Continue until all segments revealed or "Show All" clicked
```

### Auto-Stop Recording
```typescript
1. Start recording with microphone
2. Web Speech Recognition transcribes speech in real-time
3. Count words in transcript
4. When wordCount >= targetWords + 5:
   - Automatically stop recording
   - Stop speech recognition
   - Mark question as completed
```

### Word Counting
- Uses Web Speech Recognition API (Chrome/Edge)
- Counts words in real-time as user speaks
- Target = sum of revealed segment word counts
- Buffer = 5 extra words before auto-stop

## User Flow

1. **Navigate to Training Mode** - Click "Practice" → "Training Mode" in nav
2. **Read Question** - Question is displayed at top
3. **Reveal Answer Segments** - Click "Reveal More" to see answer chunks
4. **Start Recording** - Click "Start Recording" button
5. **Read Aloud** - Speak the answer while recording
6. **Auto-Stop** - Recording stops automatically after target words
7. **Review** - Play back your recording
8. **Next Question** - Move to next question or re-record

## Technical Implementation

### Speech Recognition
```typescript
const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  // Count words and auto-stop when target reached
};
```

### Audio Recording
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data);
};
```

### Answer Segmentation
```typescript
function splitIntoSegments(text: string, wordsPerSegment: number) {
  // Split by sentences
  // Group into segments of ~wordsPerSegment
  // Return array of segments with word counts
}
```

## Browser Compatibility

### Speech Recognition
- ✅ Chrome/Edge (webkitSpeechRecognition)
- ✅ Safari (SpeechRecognition)
- ❌ Firefox (not supported)

### MediaRecorder
- ✅ All modern browsers
- Requires HTTPS or localhost

## Configuration

```typescript
const TARGET_WORDS_PER_SEGMENT = 30; // Words per reveal segment
const AUTO_STOP_BUFFER = 5; // Stop recording N words after target
```

## Files

### New Files
- `client/src/pages/TrainingMode.tsx` - Main training mode component

### Modified Files
- `client/src/App.tsx` - Added route for `/training`
- `client/src/components/layout/UnifiedNav.tsx` - Added nav link in Practice section

## Access

**URL**: `/training`

**Navigation**: Practice → Training Mode

**Requirements**: 
- Subscribed to at least one channel
- Microphone permissions
- HTTPS or localhost (for MediaRecorder)

## Future Enhancements

1. **AI Feedback** - Analyze recording and provide feedback on:
   - Pronunciation
   - Pace/speed
   - Completeness
   - Technical accuracy

2. **Comparison** - Compare user recording with AI-generated ideal answer

3. **Scoring** - Score based on:
   - Word count accuracy
   - Time taken
   - Fluency

4. **Practice History** - Save recordings and track improvement over time

5. **Custom Segments** - Allow users to set custom segment sizes

6. **Offline Support** - Cache questions for offline practice

## Benefits

1. **Improves Speaking Skills** - Practice articulating technical concepts
2. **Builds Confidence** - Get comfortable speaking about complex topics
3. **Manageable Practice** - Progressive reveal prevents overwhelm
4. **Focused Sessions** - Auto-stop keeps practice sessions concise
5. **Self-Review** - Listen to recordings to identify areas for improvement
6. **Interview Prep** - Simulates verbal interview scenarios

## Tips for Users

1. **Start Small** - Begin with beginner difficulty questions
2. **Reveal Gradually** - Don't show full answer immediately
3. **Practice Multiple Times** - Re-record until satisfied
4. **Listen Back** - Always review your recordings
5. **Speak Clearly** - Enunciate for better word recognition
6. **Natural Pace** - Don't rush, speak at interview pace
7. **Use Examples** - Add your own examples when speaking

## Known Limitations

1. **Speech Recognition Accuracy** - May not be 100% accurate in noisy environments
2. **Browser Support** - Firefox doesn't support Web Speech Recognition
3. **Language** - Currently only supports English (en-US)
4. **Network Required** - Speech recognition requires internet connection
5. **Microphone Required** - Cannot practice without microphone access

## Troubleshooting

**Recording doesn't start:**
- Check microphone permissions in browser settings
- Ensure using HTTPS or localhost
- Try refreshing the page

**Word count not updating:**
- Check browser compatibility (Chrome/Edge/Safari)
- Ensure internet connection (speech recognition needs network)
- Speak clearly and at moderate pace

**Auto-stop not working:**
- Verify speech recognition is active
- Check if word count is incrementing
- May need to speak louder or clearer

**No questions available:**
- Subscribe to channels first
- Refresh the page
- Check if questions are loaded in other pages

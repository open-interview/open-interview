# Voice Interview - Quick Start Guide

## What Changed?

Voice Interview now uses the same component as Training Mode, but with a key difference:

**The answer is hidden until after you record your response!**

This creates a more realistic interview experience where you test yourself first, then see the ideal answer.

## How to Use

### 1. Navigate to Voice Interview

```
URL: /voice-interview
```

Or click "Voice Interview" from the home page.

### 2. You'll See

- ✅ The interview question
- ❌ Answer is **hidden** (not visible)
- 🎤 "Interview Mode" badge in header
- 📝 Placeholder: "Answer Hidden - Record your answer first"

### 3. Record Your Answer

1. Click **"Start Recording"**
2. Answer the question in your own words
3. Speak naturally and clearly
4. Click **"Stop Recording"** when done

### 4. See the Results

After recording, you'll see:

- ✅ **Answer is revealed!** (labeled "Ideal Answer")
- 📊 Your performance score
- 📈 Key terms you covered vs missed
- 💬 Your transcript
- 🎯 Feedback on your answer

### 5. Compare and Learn

- Read the ideal answer
- See which key terms you mentioned
- Identify what you missed
- Learn from the comparison

### 6. Continue

- Click **"Next Question"** to continue
- Answer will be hidden again for the next question
- Or click **"Try Again"** to re-record your answer

## Tips for Success

### Before Recording

1. **Read the question carefully**
2. **Think about your answer** (take a moment)
3. **Organize your thoughts** (intro, main points, conclusion)
4. **Take a deep breath** and start recording

### While Recording

1. **Speak clearly** and at moderate pace
2. **Use technical terms** from the domain
3. **Structure your answer** (don't ramble)
4. **Give examples** when relevant
5. **Be concise** but thorough

### After Recording

1. **Review the ideal answer** carefully
2. **Note the key terms** you missed
3. **Understand the structure** used
4. **Try again** if you want to improve
5. **Move on** when ready

## Comparison with Training Mode

| Feature | Training Mode | Interview Mode |
|---------|--------------|----------------|
| Answer Visible | ✅ Yes, from start | ❌ No, until after recording |
| Purpose | Practice reading | Test yourself |
| Best For | Learning | Assessment |

## When to Use Interview Mode

✅ **Use Interview Mode when you want to:**
- Test your knowledge
- Simulate a real interview
- Identify knowledge gaps
- Build confidence
- Challenge yourself

❌ **Don't use Interview Mode when you:**
- Are learning new material (use Training Mode)
- Want to practice pronunciation (use Training Mode)
- Need to memorize answers (use Training Mode)

## Workflow Recommendation

### For New Topics

```
1. Training Mode (5-10 questions)
   ↓
2. Interview Mode (same questions)
   ↓
3. Training Mode (review missed ones)
   ↓
4. Interview Mode (confirm mastery)
```

### For Review

```
1. Interview Mode (test retention)
   ↓
2. Training Mode (only for questions you struggled with)
   ↓
3. Interview Mode (verify improvement)
```

## Keyboard Shortcuts

- `Space` - Start/Stop recording (when focused)
- `Enter` - Submit answer (when in editing mode)
- `Esc` - Cancel/Go back

## Troubleshooting

### "Answer Hidden" doesn't go away after recording

**Solution**: Make sure you clicked "Stop Recording" and the recording completed successfully. Check the console for errors.

### Can't see the answer even after recording

**Solution**: 
1. Check if you're in interview mode (look for "Interview Mode" badge)
2. Verify recording completed (should show feedback)
3. Try refreshing the page

### Want to see answer before recording

**Solution**: Use Training Mode (`/training`) instead! That's what it's designed for.

### Recording doesn't start

**Solution**: 
1. Grant microphone permission
2. Check browser compatibility (Chrome/Edge/Safari)
3. See [Voice Interview Troubleshooting](./VOICE_INTERVIEW_TROUBLESHOOTING.md)

## Browser Support

- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Safari
- ❌ Firefox (no Web Speech API)

## Privacy

- 🔒 All recording happens in your browser
- 🔒 Audio is not uploaded to any server
- 🔒 Only transcript is processed locally
- 🔒 Session data stored in localStorage only

## Features

### Recording
- ✅ Real-time transcription
- ✅ Interim results (gray text)
- ✅ Final results (white text)
- ✅ Edit transcript before submitting
- ✅ Re-record if needed

### Feedback
- ✅ Overall score (0-100%)
- ✅ Words spoken vs target
- ✅ Duration tracking
- ✅ Key terms matching
- ✅ Detailed breakdown

### Progress
- ✅ Session persistence
- ✅ Resume where you left off
- ✅ Completed questions tracking
- ✅ Progress bar

## Advanced Tips

### Improve Your Score

1. **Use Technical Terms**: The system looks for domain-specific keywords
2. **Be Comprehensive**: Cover multiple aspects of the topic
3. **Structure Your Answer**: Intro → Main Points → Conclusion
4. **Give Examples**: Concrete examples boost your score
5. **Practice**: The more you practice, the better you'll get

### Maximize Learning

1. **Record First Attempt**: Don't peek at the answer
2. **Review Carefully**: Read the ideal answer thoroughly
3. **Note Patterns**: Look for common structures
4. **Try Again**: Re-record to improve
5. **Track Progress**: Monitor your scores over time

### Time Management

- Aim for 1-2 minutes per answer
- Don't rush, but don't ramble
- Practice concise explanations
- Use the timer as a guide

## Getting Help

- 📖 [Full Documentation](./VOICE_INTERVIEW_TRANSCRIPT_FIX.md)
- 🐛 [Troubleshooting Guide](./VOICE_INTERVIEW_TROUBLESHOOTING.md)
- 📊 [Mode Comparison](./VOICE_MODES_COMPARISON.md)
- 🔧 [Technical Details](../VOICE_INTERVIEW_REFACTOR_SUMMARY.md)

## Feedback

Found a bug or have a suggestion? Please open an issue on GitHub!

---

**Happy Interviewing! 🎤**

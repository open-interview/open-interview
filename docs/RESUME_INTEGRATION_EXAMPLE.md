# Resume Feature Integration Example

## How to Add Resume Tracking to Your Component

This guide shows how to integrate resume tracking into existing activity components.

## Example: Test Session Component

### Before (No Resume Tracking)

```typescript
export default function TestSession() {
  const { channelId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const startTest = () => {
    const sessionQuestions = getSessionQuestions(test, 15);
    setQuestions(sessionQuestions);
    setCurrentIndex(0);
    setAnswers({});
  };

  const handleAnswer = (optionId: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: [optionId] };
    setAnswers(newAnswers);
    setCurrentIndex(currentIndex + 1);
  };

  const completeTest = () => {
    // Calculate score and show results
    const score = calculateScore(questions, answers);
    setResult(score);
  };
}
```

### After (With Resume Tracking)

```typescript
import { saveTestSession, updateTestSession, clearSession } from '../lib/session-tracker';

export default function TestSession() {
  const { channelId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  // Load existing session on mount
  useEffect(() => {
    const sessionKey = `test-session-${channelId}`;
    const existing = localStorage.getItem(sessionKey);
    
    if (existing) {
      try {
        const data = JSON.parse(existing);
        setQuestions(data.questions);
        setCurrentIndex(data.currentQuestionIndex);
        setAnswers(data.answers);
        // Update timestamp to show it was accessed
        updateTestSession(channelId, data.currentQuestionIndex, data.answers);
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    }
  }, [channelId]);

  const startTest = () => {
    const sessionQuestions = getSessionQuestions(test, 15);
    setQuestions(sessionQuestions);
    setCurrentIndex(0);
    setAnswers({});
    
    // 🆕 Save initial session state
    saveTestSession(
      channelId,
      test.channelName,
      sessionQuestions,
      0,
      {}
    );
  };

  const handleAnswer = (optionId: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: [optionId] };
    setAnswers(newAnswers);
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    // 🆕 Update session progress
    updateTestSession(channelId, newIndex, newAnswers);
  };

  const completeTest = () => {
    // Calculate score and show results
    const score = calculateScore(questions, answers);
    setResult(score);
    
    // 🆕 Clear session when completed
    clearSession(`test-session-${channelId}`);
  };
}
```

## Key Changes Explained

### 1. Import Session Tracker
```typescript
import { saveTestSession, updateTestSession, clearSession } from '../lib/session-tracker';
```

### 2. Load Existing Session on Mount
```typescript
useEffect(() => {
  const sessionKey = `test-session-${channelId}`;
  const existing = localStorage.getItem(sessionKey);
  
  if (existing) {
    const data = JSON.parse(existing);
    // Restore state
    setQuestions(data.questions);
    setCurrentIndex(data.currentQuestionIndex);
    setAnswers(data.answers);
    // Update timestamp
    updateTestSession(channelId, data.currentQuestionIndex, data.answers);
  }
}, [channelId]);
```

### 3. Save Session When Starting
```typescript
const startTest = () => {
  // ... existing code ...
  
  saveTestSession(
    channelId,
    test.channelName,
    sessionQuestions,
    0,
    {}
  );
};
```

### 4. Update Session on Progress
```typescript
const handleAnswer = (optionId: string) => {
  // ... existing code ...
  
  updateTestSession(channelId, newIndex, newAnswers);
};
```

### 5. Clear Session on Completion
```typescript
const completeTest = () => {
  // ... existing code ...
  
  clearSession(`test-session-${channelId}`);
};
```

## Example: Voice Interview Component

### Integration Points

```typescript
import { updateSessionTimestamp } from '../lib/session-tracker';

export default function VoiceSession() {
  // Load session state
  useEffect(() => {
    const state = loadSessionState();
    if (state) {
      // Restore session
      setSession(state.session);
      setQuestions(state.questions);
      setCurrentQuestionIndex(state.currentQuestionIndex);
      setAnswers(state.answers);
      
      // 🆕 Update timestamp
      updateSessionTimestamp('voice-session-state');
    }
  }, []);

  // Save state on every change
  useEffect(() => {
    if (session && questions.length > 0) {
      const state = {
        session,
        questions,
        currentQuestionIndex,
        answers,
        startedAt
      };
      saveSessionState(state); // Already includes timestamp
    }
  }, [session, questions, currentQuestionIndex, answers]);

  // Clear on completion
  const handleComplete = () => {
    // ... existing code ...
    clearSessionState(); // Removes from localStorage
  };
}
```

## Example: Certification Exam Component

### Integration Points

```typescript
import { saveCertificationSession, updateCertificationSession, clearSession } from '../lib/session-tracker';

export default function CertificationExam() {
  const { certId } = useParams();

  // Load existing session
  useEffect(() => {
    const sessionKey = `certification-session-${certId}`;
    const existing = localStorage.getItem(sessionKey);
    
    if (existing) {
      const data = JSON.parse(existing);
      // Restore state
      setQuestions(data.questions);
      setCurrentIndex(data.currentQuestionIndex);
      setAnswers(data.answers);
      
      // Update timestamp
      updateCertificationSession(certId, data.currentQuestionIndex, data.answers);
    }
  }, [certId]);

  // Save on start
  const startExam = () => {
    const examQuestions = generatePracticeSession(certification, 65);
    setQuestions(examQuestions);
    setCurrentIndex(0);
    setAnswers({});
    
    saveCertificationSession(
      certId,
      certification.name,
      examQuestions,
      0,
      {}
    );
  };

  // Update on progress
  const handleAnswer = (optionId: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: [optionId] };
    setAnswers(newAnswers);
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    updateCertificationSession(certId, newIndex, newAnswers);
  };

  // Clear on completion
  const completeExam = () => {
    const score = calculateScore(questions, answers);
    setResult(score);
    
    clearSession(`certification-session-${certId}`);
  };
}
```

## Testing Your Integration

### Manual Test Checklist

1. **Start Activity**
   - [ ] Session is saved to localStorage
   - [ ] Session key follows pattern (e.g., `test-session-aws`)
   - [ ] Session data includes all required fields

2. **Progress Through Activity**
   - [ ] Session is updated on each question
   - [ ] `lastAccessedAt` timestamp is updated
   - [ ] Progress is accurately tracked

3. **Navigate Away**
   - [ ] Session persists in localStorage
   - [ ] Resume tile appears on home page
   - [ ] Progress percentage is correct

4. **Resume Activity**
   - [ ] Session state is restored
   - [ ] User continues from correct question
   - [ ] All answers are preserved

5. **Complete Activity**
   - [ ] Session is removed from localStorage
   - [ ] Resume tile disappears from home page
   - [ ] Results are shown correctly

### Debug Tips

```typescript
// Check session in console
const sessionKey = 'test-session-aws';
const session = localStorage.getItem(sessionKey);
console.log('Session:', JSON.parse(session));

// Verify timestamp
const data = JSON.parse(session);
console.log('Last accessed:', new Date(data.lastAccessedAt));

// Check all sessions
const sessions = getInProgressSessions();
console.log('All sessions:', sessions);
```

## Common Pitfalls

### 1. Forgetting to Update Timestamp
```typescript
// ❌ Bad - timestamp not updated
const handleAnswer = () => {
  setAnswers(newAnswers);
  setCurrentIndex(newIndex);
};

// ✅ Good - timestamp updated
const handleAnswer = () => {
  setAnswers(newAnswers);
  setCurrentIndex(newIndex);
  updateTestSession(channelId, newIndex, newAnswers);
};
```

### 2. Not Clearing Session on Completion
```typescript
// ❌ Bad - session persists after completion
const completeTest = () => {
  setResult(score);
};

// ✅ Good - session cleared
const completeTest = () => {
  setResult(score);
  clearSession(`test-session-${channelId}`);
};
```

### 3. Invalid Session Data
```typescript
// ❌ Bad - missing required fields
saveTestSession(channelId, null, [], 0, {});

// ✅ Good - all fields provided
saveTestSession(
  channelId,
  test.channelName,
  questions,
  currentIndex,
  answers
);
```

### 4. Not Handling Load Errors
```typescript
// ❌ Bad - no error handling
const data = JSON.parse(localStorage.getItem(sessionKey));
setQuestions(data.questions);

// ✅ Good - error handling
try {
  const data = JSON.parse(localStorage.getItem(sessionKey));
  if (data && data.questions) {
    setQuestions(data.questions);
  }
} catch (e) {
  console.error('Failed to load session:', e);
}
```

## Advanced: Custom Session Types

### Adding a New Activity Type

1. **Update Resume Service**
```typescript
// client/src/lib/resume-service.ts

function getCustomActivitySessions(): ResumeSession[] {
  const sessions: ResumeSession[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('custom-activity-')) {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      
      sessions.push({
        id: key,
        type: 'custom-activity',
        title: data.title,
        subtitle: `Step ${data.currentStep} of ${data.totalSteps}`,
        progress: (data.currentStep / data.totalSteps) * 100,
        totalItems: data.totalSteps,
        completedItems: data.currentStep,
        lastAccessedAt: data.lastAccessedAt,
        sessionData: data,
        icon: 'custom-icon',
        color: '#custom-color'
      });
    }
  }
  
  return sessions;
}
```

2. **Add Navigation Logic**
```typescript
// client/src/components/home/ResumeSection.tsx

const handleResume = (session: ResumeSession) => {
  switch (session.type) {
    case 'custom-activity':
      setLocation(`/custom-activity/${session.sessionData.activityId}`);
      break;
    // ... other cases
  }
};
```

3. **Implement Session Tracking**
```typescript
// Your custom activity component

import { updateSessionTimestamp } from '../lib/session-tracker';

const saveCustomSession = (activityId, data) => {
  const sessionKey = `custom-activity-${activityId}`;
  const sessionData = {
    ...data,
    lastAccessedAt: new Date().toISOString()
  };
  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
};
```

## Summary

To add resume tracking to any activity:

1. ✅ Import session tracker utilities
2. ✅ Load existing session on mount
3. ✅ Save session when starting
4. ✅ Update session on progress
5. ✅ Clear session on completion
6. ✅ Handle errors gracefully
7. ✅ Test thoroughly

The resume feature will automatically detect and display your sessions!

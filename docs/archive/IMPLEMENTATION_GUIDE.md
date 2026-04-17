# Implementation Guide: Unified Question Views
## Quick Start for Migrating to the New Architecture

---

## 🚀 Quick Start

### 1. Import the Unified Component

```tsx
import { UnifiedQuestionView } from '../components/shared/UnifiedQuestionView';
```

### 2. Replace Your Existing Question Display

**Before (TestSession.tsx example):**
```tsx
<div className="question-container">
  <div className="question-header">
    <span>{currentIndex + 1} / {questions.length}</span>
    <span>{difficulty}</span>
  </div>
  <div className="question-text">
    {question.question}
  </div>
  {showAnswer && (
    <div className="answer-text">
      {question.answer}
    </div>
  )}
  <button onClick={handleNext}>Next</button>
</div>
```

**After:**
```tsx
<UnifiedQuestionView
  question={question}
  questionNumber={currentIndex + 1}
  totalQuestions={questions.length}
  mode="test"
  showAnswer={showAnswer}
  onAnswerToggle={() => setShowAnswer(!showAnswer)}
  onNext={handleNext}
  onPrevious={handlePrevious}
  timeLimit={testConfig.timeLimit}
  timeRemaining={timeRemaining}
/>
```

---

## 📋 Component API Reference

### UnifiedQuestionView Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `question` | `Question` | ✅ | The question object to display |
| `questionNumber` | `number` | ✅ | Current question number (1-indexed) |
| `totalQuestions` | `number` | ✅ | Total number of questions |
| `mode` | `'browse' \| 'test' \| 'interview' \| 'certification' \| 'review'` | ✅ | Display mode (affects styling and behavior) |
| `showAnswer` | `boolean` | ❌ | Whether to show the answer (default: false) |
| `onAnswerToggle` | `() => void` | ❌ | Callback when answer visibility toggles |
| `onNext` | `() => void` | ❌ | Callback for next button |
| `onPrevious` | `() => void` | ❌ | Callback for previous button |
| `onBookmark` | `() => void` | ❌ | Callback for bookmark button |
| `isBookmarked` | `boolean` | ❌ | Whether question is bookmarked |
| `timeLimit` | `number` | ❌ | Time limit in seconds (for tests) |
| `timeRemaining` | `number` | ❌ | Time remaining in seconds |
| `autoReveal` | `boolean` | ❌ | Auto-reveal answer after delay (browse mode) |
| `className` | `string` | ❌ | Additional CSS classes |

---

## 🎯 Mode-Specific Examples

### Browse Mode (Channels, Learning Paths)

**Use Case**: Browsing questions in a channel or learning path

```tsx
import { useState } from 'react';
import { UnifiedQuestionView } from '../components/shared/UnifiedQuestionView';

function ChannelBrowser({ channelId }: { channelId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  
  const questions = useQuestionsForChannel(channelId);
  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
    setShowAnswer(false);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    setShowAnswer(false);
  };

  const handleBookmark = () => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  };

  return (
    <UnifiedQuestionView
      question={currentQuestion}
      questionNumber={currentIndex + 1}
      totalQuestions={questions.length}
      mode="browse"
      showAnswer={showAnswer}
      onAnswerToggle={() => setShowAnswer(!showAnswer)}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onBookmark={handleBookmark}
      isBookmarked={bookmarkedIds.has(currentQuestion.id)}
      autoReveal={true}
    />
  );
}
```

---

### Test Mode (Quizzes, Assessments)

**Use Case**: Timed tests with scoring

```tsx
import { useState, useEffect } from 'react';
import { UnifiedQuestionView } from '../components/shared/UnifiedQuestionView';

function TestSession({ testId }: { testId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  
  const test = useTest(testId);
  const questions = test.questions;
  const currentQuestion = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleSubmitAnswer = () => {
    // Record answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: true // or false based on user selection
    }));
    
    // Show answer
    setShowAnswer(true);
    
    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false);
      }
    }, 2000);
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
    setShowAnswer(false);
  };

  return (
    <UnifiedQuestionView
      question={currentQuestion}
      questionNumber={currentIndex + 1}
      totalQuestions={questions.length}
      mode="test"
      showAnswer={showAnswer}
      onAnswerToggle={handleSubmitAnswer}
      onNext={handleNext}
      timeLimit={600}
      timeRemaining={timeRemaining}
    />
  );
}
```

---

### Interview Mode (Voice Interview, Mock Interviews)

**Use Case**: Practice interviews with voice recording

```tsx
import { useState } from 'react';
import { UnifiedQuestionView } from '../components/shared/UnifiedQuestionView';

function VoiceInterview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const questions = useInterviewQuestions();
  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
    setShowAnswer(false);
    setIsRecording(false);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    setShowAnswer(false);
    setIsRecording(false);
  };

  return (
    <div className="relative">
      <UnifiedQuestionView
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        mode="interview"
        showAnswer={showAnswer}
        onAnswerToggle={() => setShowAnswer(!showAnswer)}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
      
      {/* Voice recording UI overlay */}
      {!showAnswer && (
        <div className="fixed bottom-24 left-0 right-0 px-4 pb-safe">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-full py-4 rounded-xl font-medium ${
              isRecording 
                ? 'bg-red-500 text-white' 
                : 'bg-purple-500 text-white'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### Certification Mode (Exam Prep)

**Use Case**: Certification exam practice with domain tracking

```tsx
import { useState } from 'react';
import { UnifiedQuestionView } from '../components/shared/UnifiedQuestionView';

function CertificationExam({ certId }: { certId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  
  const exam = useCertificationExam(certId);
  const questions = exam.questions;
  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
    setShowExplanation(false);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
    setShowExplanation(false);
  };

  return (
    <UnifiedQuestionView
      question={currentQuestion}
      questionNumber={currentIndex + 1}
      totalQuestions={questions.length}
      mode="certification"
      showAnswer={showExplanation}
      onAnswerToggle={() => setShowExplanation(!showExplanation)}
      onNext={handleNext}
      onPrevious={handlePrevious}
      timeLimit={7200}
      timeRemaining={timeRemaining}
    />
  );
}
```

---

### Review Mode (Spaced Repetition)

**Use Case**: Daily review with SRS algorithm

```tsx
import { useState } from 'react';
import { UnifiedQuestionView } from '../components/shared/UnifiedQuestionView';
import { getDueCards, recordReview } from '../lib/spaced-repetition';

function ReviewSession() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const dueCards = getDueCards();
  const questions = dueCards.map(card => getQuestionById(card.questionId));
  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (showAnswer) {
      // Record review before moving to next
      recordReview(dueCards[currentIndex].questionId, 'good');
    }
    
    setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
    setShowAnswer(false);
  };

  return (
    <UnifiedQuestionView
      question={currentQuestion}
      questionNumber={currentIndex + 1}
      totalQuestions={questions.length}
      mode="review"
      showAnswer={showAnswer}
      onAnswerToggle={() => setShowAnswer(!showAnswer)}
      onNext={handleNext}
    />
  );
}
```

---

## 🎨 Customization

### Custom Styling

You can add custom classes to the component:

```tsx
<UnifiedQuestionView
  {...props}
  className="my-custom-class"
/>
```

### Mode-Specific Behavior

The component automatically adjusts styling and behavior based on the `mode` prop:

- **browse**: Cyan accent, auto-reveal option, relaxed pace
- **test**: Amber accent, timer emphasis, no auto-reveal
- **interview**: Purple accent, focus on thinking time
- **certification**: Blue accent, exam-like experience
- **review**: Green accent, SRS-optimized flow

---

## 🔧 Advanced Usage

### Custom Answer Toggle Logic

```tsx
const handleAnswerToggle = () => {
  if (!showAnswer) {
    // Before showing answer
    trackEvent('answer_revealed', { questionId: question.id });
  } else {
    // Before hiding answer
    trackEvent('answer_hidden', { questionId: question.id });
  }
  
  setShowAnswer(!showAnswer);
};

<UnifiedQuestionView
  {...props}
  onAnswerToggle={handleAnswerToggle}
/>
```

### Conditional Bookmark Button

```tsx
<UnifiedQuestionView
  {...props}
  onBookmark={isLoggedIn ? handleBookmark : undefined}
  isBookmarked={isLoggedIn && bookmarkedIds.has(question.id)}
/>
```

### Custom Timer Logic

```tsx
const [timeRemaining, setTimeRemaining] = useState(testConfig.timeLimit);

useEffect(() => {
  if (timeRemaining <= 0) {
    handleTimeUp();
    return;
  }
  
  const timer = setInterval(() => {
    setTimeRemaining(prev => {
      const next = prev - 1;
      
      // Save progress every 10 seconds
      if (next % 10 === 0) {
        saveProgress({ timeRemaining: next });
      }
      
      return next;
    });
  }, 1000);
  
  return () => clearInterval(timer);
}, [timeRemaining]);

<UnifiedQuestionView
  {...props}
  timeLimit={testConfig.timeLimit}
  timeRemaining={timeRemaining}
/>
```

---

## 📱 Mobile Considerations

### Safe Area Handling

The component automatically handles safe areas for notched devices (iPhone 13, etc.):

```tsx
// Top bar includes pt-safe
// Bottom bar includes pb-safe
```

### Touch Targets

All interactive elements meet the 44x44px minimum:

```tsx
// Buttons are automatically sized
// No additional work needed
```

### Swipe Gestures

The component includes built-in swipe animations:

```tsx
// Swipe left: Next question
// Swipe right: Previous question
// Animations are automatic
```

---

## 🐛 Troubleshooting

### Answer Not Showing

**Problem**: Answer doesn't appear when toggled

**Solution**: Ensure `showAnswer` state is properly managed:

```tsx
const [showAnswer, setShowAnswer] = useState(false);

<UnifiedQuestionView
  showAnswer={showAnswer}
  onAnswerToggle={() => setShowAnswer(!showAnswer)}
/>
```

### Timer Not Working

**Problem**: Timer doesn't count down

**Solution**: Implement timer logic in parent component:

```tsx
useEffect(() => {
  const timer = setInterval(() => {
    setTimeRemaining(prev => Math.max(0, prev - 1));
  }, 1000);
  
  return () => clearInterval(timer);
}, []);
```

### Navigation Buttons Disabled

**Problem**: Next/Previous buttons are disabled

**Solution**: Check question bounds:

```tsx
// Previous disabled when questionNumber === 1
// Next disabled when questionNumber === totalQuestions
```

---

## ✅ Checklist

Before deploying:

- [ ] Import UnifiedQuestionView component
- [ ] Replace existing question display
- [ ] Set correct mode prop
- [ ] Implement state management (showAnswer, currentIndex)
- [ ] Add navigation handlers (onNext, onPrevious)
- [ ] Add timer logic (if needed)
- [ ] Test on mobile (iPhone 13)
- [ ] Test on desktop
- [ ] Verify accessibility
- [ ] Check performance

---

## 🎉 Benefits

After migration:

✅ Consistent UI across all question types  
✅ Mobile-optimized (iPhone 13)  
✅ Beautiful animations  
✅ Accessible  
✅ Maintainable  
✅ Type-safe  

---

## 📚 Additional Resources

- [REORGANIZATION_PLAN.md](./REORGANIZATION_PLAN.md) - Full architecture overview
- [Design System](./client/src/styles/design-system.css) - Color palette and variables
- [Component Source](./client/src/components/shared/) - View component code

---

## 💬 Support

Questions? Check the component source code or refer to the reorganization plan document.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MessageSquare } from 'lucide-react';

interface NpsSurveyProps {
  onSubmit: (score: number, feedback?: string) => void;
  onDismiss: () => void;
}

export function NpsSurvey({ onSubmit, onDismiss }: NpsSurveyProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState<'score' | 'feedback'>('score');

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setStep('feedback');
  };

  const getScoreDescription = (score: number): string => {
    if (score <= 6) return 'Detractor - Not likely to recommend';
    if (score <= 8) return 'Passive - Neutral';
    return 'Promoter - Very likely to recommend';
  };

  const handleSubmit = () => {
    if (score !== null) {
      onSubmit(score, feedback || undefined);
    }
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 9) return 'Promoter';
    if (score >= 7) return 'Passive';
    return 'Detractor';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 9) return 'text-green-500';
    if (score >= 7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">How likely are you to recommend us?</h3>
            </div>
            <button
              onClick={onDismiss}
              aria-label="Close survey"
              className="p-1 hover:bg-muted rounded-lg transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {step === 'score' ? (
            <>
              {/* NPS Score Selection */}
              <p className="text-sm text-muted-foreground mb-6">
                On a scale of 0-10, how likely are you to recommend Open Interview to a friend or colleague?
              </p>

               <div className="grid grid-cols-11 gap-1 mb-4" role="radiogroup" aria-label="Net Promoter Score from 0 to 10">
                 {Array.from({ length: 11 }, (_, i) => (
                   <button
                     key={i}
                     role="radio"
                     aria-checked={score === i}
                     aria-label={`Score ${i}: ${getScoreDescription(i)}`}
                     onClick={() => handleScoreSelect(i)}
                     className={`h-10 rounded-lg font-semibold text-sm transition-all ${
                       score === i
                         ? 'bg-primary text-primary-foreground scale-110'
                         : 'bg-muted hover:bg-muted/80 hover:scale-105'
                     }`}
                   >
                     {i}
                   </button>
                 ))}
               </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not likely</span>
                <span>Very likely</span>
              </div>
            </>
          ) : (
            <>
              {/* Feedback Step */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star className={`w-5 h-5 ${score !== null ? getScoreColor(score) : ''}`} aria-hidden="true" />
                  <span className="font-semibold">
                    You selected {score}/10 ({score !== null ? getScoreLabel(score) : ''})
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {score !== null && score >= 9
                    ? 'Thank you for being a promoter! What do you love most?'
                    : score !== null && score >= 7
                    ? 'Thank you for your feedback! What can we improve?'
                    : 'We\'re sorry to hear that. How can we make it better?'}
                </p>

                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Tell us more (optional)..."
                  className="w-full h-24 px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

               <div className="flex gap-3">
                 <button
                   onClick={onDismiss}
                   className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
                 >
                   Skip
                 </button>
                 <button
                   onClick={handleSubmit}
                   className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                   aria-describedby="nps-submit-status"
                 >
                   Submit
                 </button>
               </div>
               <div id="nps-submit-status" aria-live="polite" className="sr-only" />
            </>
          )}

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Your feedback helps us improve Open Interview
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

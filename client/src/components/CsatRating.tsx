import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';

interface CsatRatingProps {
  context?: string;
  onSubmit: (rating: number, context?: string) => void;
  onDismiss?: () => void;
  inline?: boolean;
}

export function CsatRating({ onSubmit, onDismiss, context = 'general', inline = false }: CsatRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating !== null) {
      onSubmit(rating, context);
      setSubmitted(true);
      setTimeout(() => {
        onDismiss?.();
      }, 2000);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 text-sm text-green-500"
      >
        <ThumbsUp className="w-4 h-4" />
        <span>Thank you for your feedback!</span>
      </motion.div>
    );
  }

  const getRatingLabel = (star: number): string => {
    const labels = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];
    return `${star} star${star > 1 ? 's' : ''}: ${labels[star]}`;
  };

  if (inline) {
    return (
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rate your experience">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            role="radio"
            aria-checked={rating === star}
            aria-label={getRatingLabel(star)}
            onClick={() => {
              setRating(star);
              onSubmit(star, context);
            }}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-4 h-4 ${
                star <= (hoveredRating ?? rating ?? 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 shadow-lg"
      role="group"
      aria-label="Customer satisfaction rating"
    >
      <p className="text-sm font-medium mb-3">How was your experience?</p>

      <div className="flex items-center gap-2 mb-3" role="radiogroup" aria-label="Rate from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            role="radio"
            aria-checked={rating === star}
            aria-label={getRatingLabel(star)}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoveredRating ?? rating ?? 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === null}
          className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          aria-describedby={rating === null ? 'csat-rating-required' : 'csat-submit-help'}
        >
          Submit
        </button>
      </div>
      {rating === null && (
        <p id="csat-rating-required" className="mt-1 text-xs text-red-500" role="alert">
          Please select a rating before submitting
        </p>
      )}
      <p id="csat-submit-help" className="sr-only">
        Submit your {rating}-star rating
      </p>
    </motion.div>
  );
}

// Quick thumbs up/down component for simple feedback
export function QuickFeedback({ onSubmit }: { onSubmit: (positive: boolean) => void }) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);

  const handleClick = (positive: boolean) => {
    setFeedback(positive ? 'positive' : 'negative');
    onSubmit(positive);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Was this helpful?</span>
      <button
        onClick={() => handleClick(true)}
        className={`p-1 rounded transition-colors ${
          feedback === 'positive' ? 'text-green-500 bg-green-500/10' : 'text-muted-foreground hover:text-green-500'
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleClick(false)}
        className={`p-1 rounded transition-colors ${
          feedback === 'negative' ? 'text-red-500 bg-red-500/10' : 'text-muted-foreground hover:text-red-500'
        }`}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}

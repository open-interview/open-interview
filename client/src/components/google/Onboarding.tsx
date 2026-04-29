import { useState, useCallback } from "react";
import "./Onboarding.css";
import {
  WelcomeIllustration,
  PersonalizedLearningIllustration,
  TrackProgressIllustration,
  EarnRewardsIllustration,
  GoalTargetIllustration,
  CelebrationIllustration,
} from "./illustrations";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

interface WelcomeStepProps {
  userName?: string;
  onNext: () => void;
  onSkip: () => void;
}

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface FeatureHighlightsProps {
  features: Feature[];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

interface Goal {
  id: string;
  icon: string;
  title: string;
  target: number;
  unit: string;
}

interface ProgressSetupProps {
  goals: Goal[];
  selectedGoals: string[];
  onGoalToggle: (goalId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface OnboardingCompleteProps {
  userName?: string;
  onComplete: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({
  userName = "there",
  onNext,
  onSkip,
}) => {
  return (
    <div className="onboarding-step onboarding-welcome">
      <div className="onboarding-illustration">
        <WelcomeIllustration className="illustration-welcome" />
        <div className="illustration-particles">
          <span className="particle particle-1">✦</span>
          <span className="particle particle-2">✦</span>
          <span className="particle particle-3">✦</span>
        </div>
      </div>
      <div className="onboarding-content">
        <h1 className="onboarding-title animate-slide-up">
          Welcome{userName !== "there" ? `, ${userName}` : ""}!
        </h1>
        <p className="onboarding-description animate-slide-up delay-1">
          We're excited to help you achieve your learning goals. Let's get you
          set up in just a few steps.
        </p>
      </div>
      <div className="onboarding-actions animate-slide-up delay-2">
        <button className="onboarding-button onboarding-button-secondary" onClick={onSkip}>
          Skip
        </button>
        <button className="onboarding-button onboarding-button-primary" onClick={onNext}>
          Get Started
          <span className="button-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

const FeatureHighlights: React.FC<FeatureHighlightsProps> = ({
  features,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}) => {
  const feature = features[currentStep - 1];
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="onboarding-step onboarding-features">
      <div className="step-indicator">
        <div className="step-dots">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <span
              key={index}
              className={`step-dot ${
                index + 1 <= currentStep ? "step-dot-active" : ""
              }`}
            />
          ))}
        </div>
        <span className="step-count">
          {currentStep} of {totalSteps}
        </span>
      </div>

      <div className="onboarding-illustration">
        {currentStep - 1 === 0 && <PersonalizedLearningIllustration className="feature-illustration" />}
        {currentStep - 1 === 1 && <TrackProgressIllustration className="feature-illustration" />}
        {currentStep - 1 === 2 && <EarnRewardsIllustration className="feature-illustration" />}
      </div>

      <div className="onboarding-content">
        <h2 className="onboarding-title">{feature.title}</h2>
        <p className="onboarding-description">{feature.description}</p>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="onboarding-actions">
        <button className="onboarding-button onboarding-button-secondary" onClick={onSkip}>
          Skip
        </button>
        <div className="button-group">
          {currentStep > 1 && (
            <button
              className="onboarding-button onboarding-button-outline"
              onClick={onPrevious}
            >
              ← Back
            </button>
          )}
          <button className="onboarding-button onboarding-button-primary" onClick={onNext}>
            {currentStep === totalSteps ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProgressSetup: React.FC<ProgressSetupProps> = ({
  goals,
  selectedGoals,
  onGoalToggle,
  onNext,
  onPrevious,
}) => {
  return (
    <div className="onboarding-step onboarding-setup">
      <div className="step-indicator">
        <span className="step-label">Set Your Goals</span>
      </div>

      <div className="onboarding-illustration">
        <GoalTargetIllustration className="illustration-setup" />
      </div>

      <div className="onboarding-content">
        <h2 className="onboarding-title">What do you want to achieve?</h2>
        <p className="onboarding-description">
          Select your primary goals. You can always adjust these later.
        </p>
      </div>

      <div className="goals-grid">
        {goals.map((goal) => (
          <button
            key={goal.id}
            className={`goal-card ${
              selectedGoals.includes(goal.id) ? "goal-card-selected" : ""
            }`}
            onClick={() => onGoalToggle(goal.id)}
          >
            <span className="goal-icon">{goal.icon}</span>
            <span className="goal-title">{goal.title}</span>
            <span className="goal-target">
              {goal.target} {goal.unit}
            </span>
            <div className="goal-check">
              {selectedGoals.includes(goal.id) && (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="onboarding-actions">
        <button className="onboarding-button onboarding-button-secondary" onClick={onPrevious}>
          ← Back
        </button>
        <button
          className="onboarding-button onboarding-button-primary"
          onClick={onNext}
          disabled={selectedGoals.length === 0}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const OnboardingComplete: React.FC<OnboardingCompleteProps> = ({
  userName,
  onComplete,
}) => {
  return (
    <div className="onboarding-step onboarding-complete">
      <div className="celebration-container">
        <div className="confetti confetti-1" />
        <div className="confetti confetti-2" />
        <div className="confetti confetti-3" />
        <div className="confetti confetti-4" />
        <div className="confetti confetti-5" />
        <div className="confetti confetti-6" />
      </div>

      <div className="onboarding-illustration">
        <div className="success-illustration">
          <CelebrationIllustration className="illustration-complete" />
          <div className="success-rings">
            <div className="success-ring ring-1" />
            <div className="success-ring ring-2" />
            <div className="success-ring ring-3" />
          </div>
        </div>
      </div>

      <div className="onboarding-content">
        <h2 className="onboarding-title animate-bounce">You're All Set!</h2>
        <p className="onboarding-description animate-fade-in delay-1">
          {userName
            ? `Great work, ${userName}! Your personalized learning journey awaits.`
            : "You're ready to start your personalized learning journey."}
        </p>
        <div className="celebration-badge animate-scale-in delay-2">
          <span className="badge-icon">🎉</span>
          <span className="badge-text">Onboarding Complete</span>
        </div>
      </div>

      <div className="onboarding-actions animate-slide-up delay-3">
        <button className="onboarding-button onboarding-button-primary onboarding-button-large" onClick={onComplete}>
          Start Learning
          <span className="button-arrow">→</span>
        </button>
      </div>
    </div>
  );
};

interface OnboardingProps {
  userName?: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const defaultFeatures: Feature[] = [
  {
    id: "1",
    icon: "📚",
    title: "Personalized Learning",
    description:
      "Get customized study paths that adapt to your pace and learning style.",
  },
  {
    id: "2",
    icon: "🎯",
    title: "Track Your Progress",
    description:
      "Monitor your achievements with detailed analytics and insights.",
  },
  {
    id: "3",
    icon: "🏆",
    title: "Earn Rewards",
    description:
      "Collect badges, complete challenges, and level up your skills.",
  },
];

const defaultGoals: Goal[] = [
  { id: "daily", icon: "📅", title: "Daily Practice", target: 30, unit: "min/day" },
  { id: "weekly", icon: "📊", title: "Weekly Reviews", target: 5, unit: "sessions/week" },
  { id: "mastery", icon: "⭐", title: "Master Topics", target: 10, unit: "topics/month" },
  { id: "streak", icon: "🔥", title: "Build Streak", target: 7, unit: "day streak" },
];

export const Onboarding: React.FC<OnboardingProps> = ({
  userName,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalSteps = 4;

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      setIsCompleted(true);
      onComplete();
    }
  }, [onSkip, onComplete]);

  const handleGoalToggle = useCallback((goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setIsCompleted(true);
    onComplete();
  }, [onComplete]);

  if (isCompleted || currentStep > totalSteps) {
    return (
      <OnboardingComplete
        userName={userName}
        onComplete={onComplete}
      />
    );
  }

  switch (currentStep) {
    case 1:
      return (
        <WelcomeStep
          userName={userName}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      );
    case 2:
    case 3:
    case 4:
      if (currentStep === 4) {
        return (
          <ProgressSetup
            goals={defaultGoals}
            selectedGoals={selectedGoals}
            onGoalToggle={handleGoalToggle}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      }
      return (
        <FeatureHighlights
          features={defaultFeatures}
          currentStep={currentStep - 1}
          totalSteps={defaultFeatures.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
        />
      );
    default:
      return null;
  }
};

export { WelcomeStep, FeatureHighlights, ProgressSetup, OnboardingComplete };
export type { OnboardingProps, WelcomeStepProps, FeatureHighlightsProps, ProgressSetupProps, OnboardingCompleteProps, Feature, Goal };
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { userProfileDAO } from "@/db/dao";
import { databaseManager } from "@/db/manager";
import { toast } from "sonner";

interface OnboardingFlowProps {
  onComplete: (userProfile: any) => void;
}

interface UserProfileInput {
  targetCompanies: string[];
  targetRole: string;
  experienceLevel: "entry" | "mid" | "senior" | "staff" | "principal";
}

const STARTING_CREDITS = 100;
const STARTING_XP = 0;
const STARTING_LEVEL = 1;

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [profile, setProfile] = useState<UserProfileInput>({
    targetCompanies: [],
    targetRole: "",
    experienceLevel: "mid",
  });
  const [companyInput, setCompanyInput] = useState("");

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      try {
        await databaseManager.initialize();
      } catch (error) {
        console.error("Failed to initialize database:", error);
        toast.error("Failed to initialize app. Please refresh.");
      }
    };
    init();
  }, []);

  const handleAddCompany = () => {
    if (
      companyInput.trim() &&
      !profile.targetCompanies.includes(companyInput.trim())
    ) {
      setProfile((prev) => ({
        ...prev,
        targetCompanies: [...prev.targetCompanies, companyInput.trim()],
      }));
      setCompanyInput("");
    }
  };

  const handleRemoveCompany = (company: string) => {
    setProfile((prev) => ({
      ...prev,
      targetCompanies: prev.targetCompanies.filter((c) => c !== company),
    }));
  };

  const handleNext = async () => {
    if (step < 2) {
      // Validate current step
      if (step === 1) {
        if (!profile.targetRole.trim()) {
          toast.error("Please enter your target role");
          return;
        }
        if (profile.targetCompanies.length === 0) {
          toast.error("Please add at least one target company");
          return;
        }
      }
      setStep(step + 1);
    } else {
      // Complete onboarding - save to database
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setIsInitializing(true);

    try {
      const now = new Date();

      // Create the complete profile
      const completeProfile = {
        id: crypto.randomUUID(),
        targetCompanies: profile.targetCompanies,
        targetRole: profile.targetRole,
        experienceLevel: profile.experienceLevel,
        xp: STARTING_XP,
        level: STARTING_LEVEL,
        credits: STARTING_CREDITS,
        streak: 0,
        voiceEnabled: true,
        aiVoice: "professional-female" as const,
        difficulty: "adaptive" as const,
        theme: "dark" as const,
        isPremium: false,
        weeklyGoalMinutes: 300,
        lastActiveDate: now,
        createdAt: now,
        updatedAt: now,
      };

      // Save to database
      await userProfileDAO.create(completeProfile);

      // Update stores
      useUserStore.getState().setProfile(completeProfile);
      useGamificationStore.getState().addXP(STARTING_XP);
      useGamificationStore.getState().addCredits(STARTING_CREDITS);
      useGamificationStore.getState().updateStreak(0);

      toast.success("Welcome to Interview Buddy AI!");

      // Call onComplete with the created profile
      onComplete(completeProfile);
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save your profile. Please try again.");
      setIsInitializing(false);
    }
  };

  const handleModelDownload = async () => {
    setIsInitializing(true);

    // Simulate initialization progress
    const totalSteps = 10;
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setInitializationProgress((i / totalSteps) * 100);
    }

    await completeOnboarding();
  };

  const steps = [
    {
      title: "Welcome to Interview Buddy AI",
      content: (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Welcome!</h1>
          <p className="text-xl text-primary-200 mb-8">
            Your AI-powered interview preparation companion
          </p>
          <p className="text-primary-300 mb-8">
            Practice interviews with our local AI, get instant feedback, and
            land your dream job.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
            <div className="bg-background-secondary p-4 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-white font-semibold">Smart Questions</div>
              <div className="text-primary-300 text-sm">
                Personalized to your goals
              </div>
            </div>
            <div className="bg-background-secondary p-4 rounded-lg">
              <div className="text-2xl mb-2">🤖</div>
              <div className="text-white font-semibold">AI Feedback</div>
              <div className="text-primary-300 text-sm">
                Real-time evaluation
              </div>
            </div>
            <div className="bg-background-secondary p-4 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-white font-semibold">Track Progress</div>
              <div className="text-primary-300 text-sm">
                Monitor your growth
              </div>
            </div>
            <div className="bg-background-secondary p-4 rounded-lg">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-white font-semibold">Private & Local</div>
              <div className="text-primary-300 text-sm">
                Your data stays on device
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Set Your Goals",
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">
            Tell us about your goals
          </h2>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Target Role *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-background-secondary border border-primary-700 rounded-lg text-white"
              placeholder="e.g. Senior Frontend Engineer"
              value={profile.targetRole}
              onChange={(e) =>
                setProfile({ ...profile, targetRole: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Experience Level *
            </label>
            <select
              className="w-full px-4 py-2 bg-background-secondary border border-primary-700 rounded-lg text-white"
              value={profile.experienceLevel}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  experienceLevel: e.target
                    .value as UserProfileInput["experienceLevel"],
                })
              }
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="staff">Staff Level</option>
              <option value="principal">Principal Level</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Target Companies *
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                className="flex-1 px-4 py-2 bg-background-secondary border border-primary-700 rounded-lg text-white"
                placeholder="e.g. Google"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddCompany())
                }
              />
              <button
                onClick={handleAddCompany}
                disabled={!companyInput.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.targetCompanies.map((company) => (
                <span
                  key={company}
                  className="inline-flex items-center px-3 py-1 bg-primary-700 text-white rounded-full text-sm"
                >
                  {company}
                  <button
                    onClick={() => handleRemoveCompany(company)}
                    className="ml-2 text-primary-300 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {profile.targetCompanies.length === 0 && (
              <p className="text-primary-400 text-sm mt-1">
                Add at least one company you're targeting
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Prepare AI Assistant",
      content: (
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Ready to Start!</h2>
          <p className="text-primary-200">
            We're setting up your personalized interview practice environment.
          </p>

          <div className="bg-background-secondary p-6 rounded-lg border border-primary-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-primary-200">Starting Credits</span>
                <span className="text-white font-bold">
                  {STARTING_CREDITS} 💰
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary-200">Starting Level</span>
                <span className="text-white font-bold">
                  {STARTING_LEVEL} ⭐
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary-200">Target Role</span>
                <span className="text-white font-bold">
                  {profile.targetRole || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-primary-200">Target Companies</span>
                <span className="text-white font-bold">
                  {profile.targetCompanies.length} companies
                </span>
              </div>
            </div>
          </div>

          {isInitializing ? (
            <div className="space-y-4">
              <div className="w-full bg-background-tertiary rounded-full h-4">
                <div
                  className="bg-primary-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${initializationProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-primary-300">
                Setting up your profile... {Math.round(initializationProgress)}%
              </p>
            </div>
          ) : (
            <div className="text-sm text-primary-400">
              Click "Get Started" to create your account and begin practicing!
            </div>
          )}
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-primary to-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">🤖</span>
            </div>
          </div>

          <div className="flex justify-center space-x-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                  index <= step ? "bg-primary-500" : "bg-primary-800"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="glass-morphism p-8 rounded-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            {currentStep.title}
          </h2>
          {currentStep.content}

          <div className="mt-8 flex space-x-4">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={isInitializing}
                className="flex-1 py-3 px-4 border border-primary-600 text-primary-300 rounded-lg hover:bg-background-secondary disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 2 ? handleModelDownload : handleNext}
              disabled={isInitializing}
              className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isInitializing ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Setting up...
                </span>
              ) : step === steps.length - 1 ? (
                "Get Started"
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

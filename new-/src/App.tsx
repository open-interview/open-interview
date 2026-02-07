import { useEffect, useState } from "react";
import { Toaster } from "sonner";

// Components
import { AppLayout } from "@/components/layout/AppLayout";
import OnboardingFlow from "@/features/onboarding/OnboardingFlow";
import Dashboard from "@/features/dashboard/Dashboard";
import ChatInterface from "@/features/chat/ChatInterface";

// Hooks
import { useUserStore } from "@/store/userStore";
import { db } from "@/db/schema";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<
    "onboarding" | "dashboard" | "chat"
  >("onboarding");
  const { setProfile } = useUserStore();

  const initializeApp = async () => {
    try {
      // Initialize database
      await db.open();

      // Check if user exists
      const existingProfile = await db.userProfiles.toArray();

      if (existingProfile.length > 0) {
        setProfile(existingProfile[0]);
        setCurrentView("dashboard");
      }

      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const handleOnboardingComplete = (userProfile: any) => {
    setProfile(userProfile);
    setCurrentView("dashboard");
  };

  const handleStartChat = () => {
    setCurrentView("chat");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-200">Initializing Interview Buddy...</p>
        </div>
      </div>
    );
  }

  if (currentView === "onboarding") {
    return (
      <>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
        <Toaster position="top-center" theme="dark" richColors />
      </>
    );
  }

  if (currentView === "chat") {
    return (
      <>
        <ChatInterface sessionType="daily" onClose={handleBackToDashboard} />
        <Toaster position="top-center" theme="dark" richColors />
      </>
    );
  }

  return (
    <>
      <AppLayout>
        <Dashboard onStartChat={handleStartChat} />
      </AppLayout>
      <Toaster position="top-center" theme="dark" richColors />
    </>
  );
}

export default App;

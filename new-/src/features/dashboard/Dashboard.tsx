import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { useProgressStore } from "@/store/progressStore";
import { conversationDAO, dailyStatsDAO, progressDAO } from "@/db/dao";
import { databaseManager } from "@/db/manager";
import type { WeeklyStats, ProgressStats } from "@/types";
import { toast } from "sonner";

interface DashboardProps {
  onStartChat: () => void;
}

export default function Dashboard({ onStartChat }: DashboardProps) {
  const { profile } = useUserStore();
  const gamification = useGamificationStore();
  const progress = useProgressStore();

  const [isLoading, setIsLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(
    null,
  );
  const [recentConversations, setRecentConversations] = useState<
    Array<{ id: string; questionText: string; score: number; timestamp: Date }>
  >([]);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!profile) return;

      try {
        setIsLoading(true);

        // Initialize database
        await databaseManager.initialize();

        // Load weekly stats
        const weekly = await dailyStatsDAO.getWeeklyStats(profile.id);
        setWeeklyStats(weekly);

        // Load progress stats
        const stats = await progressDAO.getStats(profile.id);
        setProgressStats(stats);

        // Load recent conversations
        const conversations = await conversationDAO.getByUserId(profile.id, 5);
        setRecentConversations(
          conversations.map((c) => ({
            id: c.id,
            questionText:
              c.questionText.substring(0, 50) +
              (c.questionText.length > 50 ? "..." : ""),
            score: c.score,
            timestamp: new Date(c.timestamp),
          })),
        );

        // Get questions answered count
        const allConversations = await conversationDAO.getByUserId(profile.id);
        setQuestionsAnswered(allConversations.length);

        // Get current streak from profile
        setCurrentStreak(profile.streak);

        // Update local stores with fresh data
        await progress.refreshStats(profile.id);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [profile?.id]);

  const getMasteryPercentage = () => {
    if (!progressStats || progressStats.total === 0) return 0;
    return Math.round(progressStats.masteryRate);
  };

  const getWeeklyProgress = () => {
    if (!weeklyStats) return 0;
    const weeklyGoal = profile?.weeklyGoalMinutes || 300; // 5 hours default
    const minutesSpent = Math.round(weeklyStats.timeSpent / 60);
    return Math.min(100, Math.round((minutesSpent / weeklyGoal) * 100));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-200">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome back, {profile?.targetRole || "Learner"}!
        </h1>
        <p className="text-primary-200">
          Ready to practice your interview skills?
        </p>
        {profile?.targetCompanies && profile.targetCompanies.length > 0 && (
          <p className="text-primary-300 mt-2">
            Targeting: {profile.targetCompanies.join(", ")}
          </p>
        )}
      </div>

      {/* Stats Overview */}
      <div className="glass-morphism p-6 rounded-xl">
        <h3 className="text-xl font-semibold text-white mb-4">Your Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500">
              {questionsAnswered}
            </div>
            <div className="text-sm text-primary-200">Questions Answered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500">
              {currentStreak}
            </div>
            <div className="text-sm text-primary-200">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500">
              {gamification.credits}
            </div>
            <div className="text-sm text-primary-200">Credits</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-500">
              {gamification.level}
            </div>
            <div className="text-sm text-primary-200">Level</div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">
            Daily Practice
          </h3>
          <p className="text-primary-200 mb-4">
            Continue your daily interview practice and maintain your streak.
          </p>
          <button onClick={onStartChat} className="button-primary w-full">
            Start Practice
          </button>
        </div>

        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">
            Mock Interview
          </h3>
          <p className="text-primary-200 mb-4">
            Take a full mock interview with real-time feedback.
          </p>
          <button
            className="button-secondary w-full"
            onClick={() => toast.info("Coming soon!")}
          >
            Coming Soon
          </button>
        </div>

        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">
            Progress Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-primary-200">Mastery Rate</span>
              <span className="text-white font-semibold">
                {getMasteryPercentage()}%
              </span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getMasteryPercentage()}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-primary-200">Weekly Goal</span>
              <span className="text-white font-semibold">
                {getWeeklyProgress()}%
              </span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getWeeklyProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      {weeklyStats && (
        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">This Week</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {weeklyStats.questionsAnswered}
              </div>
              <div className="text-sm text-primary-200">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {weeklyStats.averageScore.toFixed(1)}
              </div>
              <div className="text-sm text-primary-200">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {Math.round(weeklyStats.timeSpent / 60)}m
              </div>
              <div className="text-sm text-primary-200">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {weeklyStats.xpEarned}
              </div>
              <div className="text-sm text-primary-200">XP Earned</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Stats Detail */}
      {progressStats && (
        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">
            Question Mastery
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {progressStats.total}
              </div>
              <div className="text-sm text-primary-200">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {progressStats.mastered}
              </div>
              <div className="text-sm text-primary-200">Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {progressStats.learning}
              </div>
              <div className="text-sm text-primary-200">Learning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {progressStats.reviewing}
              </div>
              <div className="text-sm text-primary-200">Reviewing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">
                {progressStats.new}
              </div>
              <div className="text-sm text-primary-200">New</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentConversations.length > 0 && (
        <div className="glass-morphism p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentConversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between p-3 bg-background-primary rounded-lg"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-white text-sm truncate">
                    {conv.questionText}
                  </p>
                  <p className="text-primary-400 text-xs">
                    {conv.timestamp.toLocaleDateString()}
                  </p>
                </div>
                <div
                  className={`text-lg font-bold ${
                    conv.score >= 80
                      ? "text-green-500"
                      : conv.score >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                >
                  {conv.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streak Status */}
      <div className="glass-morphism p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              {currentStreak > 0 ? "🔥 Keep it up!" : "Start your streak"}
            </h3>
            <p className="text-primary-200">
              {currentStreak > 0
                ? `You're on a ${currentStreak}-day streak! Practice daily to maintain it.`
                : "Practice today to start your streak and earn bonus XP!"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-primary-500">
              {currentStreak}
            </div>
            <div className="text-sm text-primary-200">day streak</div>
          </div>
        </div>
      </div>
    </div>
  );
}

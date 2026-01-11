/**
 * Achievement Engine - Client-Side Only
 * Tracks progress and awards achievements automatically
 */

import { 
  Achievement, 
  AchievementProgress, 
  UserEvent, 
  UserMetrics,
  Reward,
  AchievementUnlock,
  Requirement
} from './types';
import { ALL_ACHIEVEMENTS, getAchievementById } from './definitions';
import { 
  getMetrics, 
  updateMetrics, 
  incrementMetric,
  getUnlockedAchievements as getUnlockedAchievementIds,
  unlockAchievement,
  isAchievementUnlocked,
  addAchievementToHistory
} from './storage';
import { getLevelByXP, getNextLevel, XP_REWARDS, calculateXPWithStreak } from './levels';

// ============================================
// ACHIEVEMENT ENGINE
// ============================================

class AchievementEngineClass {
  private listeners: Set<(achievements: Achievement[]) => void> = new Set();
  
  // ============================================
  // EVENT PROCESSING
  // ============================================
  
  // Process user event and check for achievements
  processEvent(event: UserEvent): Achievement[] {
    const newlyUnlocked: Achievement[] = [];
    
    // Update metrics based on event
    this.updateMetricsFromEvent(event);
    
    // Check all achievements
    const progress = this.calculateProgress();
    
    for (const ap of progress) {
      if (!ap.isUnlocked && ap.progress >= 100) {
        // Achievement unlocked!
        this.unlockAchievement(ap.achievement);
        newlyUnlocked.push(ap.achievement);
      }
    }
    
    // Notify listeners
    if (newlyUnlocked.length > 0) {
      this.notifyListeners(newlyUnlocked);
    }
    
    return newlyUnlocked;
  }
  
  // Update metrics based on event
  private updateMetricsFromEvent(event: UserEvent): void {
    const metrics = getMetrics();
    
    switch (event.type) {
      case 'question_completed':
        incrementMetric('totalCompleted');
        incrementMetric('questionsThisSession');
        
        // Track difficulty
        const difficulty = event.data?.difficulty;
        if (difficulty === 'beginner') incrementMetric('beginnerCompleted');
        if (difficulty === 'intermediate') incrementMetric('intermediateCompleted');
        if (difficulty === 'advanced') incrementMetric('advancedCompleted');
        
        // Track channel
        const channel = event.data?.channel;
        if (channel && !metrics.channelsExplored.includes(channel)) {
          updateMetrics({
            channelsExplored: [...metrics.channelsExplored, channel]
          });
        }
        
        // Award XP
        const xp = this.calculateQuestionXP(difficulty);
        this.awardXP(xp);
        break;
        
      case 'quiz_answered':
        const isCorrect = event.data?.isCorrect;
        if (isCorrect) {
          incrementMetric('quizTotalCorrect');
          incrementMetric('quizCorrectStreak');
          this.awardXP(XP_REWARDS.QUIZ_CORRECT);
        } else {
          incrementMetric('quizTotalWrong');
          updateMetrics({ quizCorrectStreak: 0 });
        }
        break;
        
      case 'voice_interview_completed':
        incrementMetric('voiceInterviews');
        const verdict = event.data?.verdict;
        if (verdict === 'hire' || verdict === 'strong-hire') {
          incrementMetric('voiceSuccesses');
          this.awardXP(XP_REWARDS.VOICE_ATTEMPT + XP_REWARDS.VOICE_SUCCESS);
        } else {
          this.awardXP(XP_REWARDS.VOICE_ATTEMPT);
        }
        break;
        
      case 'srs_review':
        const rating = event.data?.rating;
        if (rating === 'good') {
          this.awardXP(XP_REWARDS.SRS_GOOD);
        } else if (rating === 'easy') {
          this.awardXP(XP_REWARDS.SRS_EASY);
        }
        break;
        
      case 'session_started':
        incrementMetric('totalSessions');
        updateMetrics({ 
          questionsThisSession: 0,
          sessionStartTime: Date.now()
        });
        break;
        
      case 'session_ended':
        // Check for speed demon achievement
        break;
        
      case 'daily_login':
        this.awardXP(XP_REWARDS.DAILY_LOGIN);
        updateMetrics({ lastStudyTime: new Date().toISOString() });
        break;
        
      case 'streak_updated':
        const newStreak = event.data?.streak || 0;
        updateMetrics({ 
          currentStreak: newStreak,
          longestStreak: Math.max(metrics.longestStreak, newStreak)
        });
        break;
    }
  }
  
  // Calculate XP for question based on difficulty
  private calculateQuestionXP(difficulty?: string): number {
    let baseXP = 10;
    
    if (difficulty === 'beginner') baseXP = XP_REWARDS.QUESTION_BEGINNER;
    else if (difficulty === 'intermediate') baseXP = XP_REWARDS.QUESTION_INTERMEDIATE;
    else if (difficulty === 'advanced') baseXP = XP_REWARDS.QUESTION_ADVANCED;
    
    // Apply streak multiplier
    const metrics = getMetrics();
    return calculateXPWithStreak(baseXP, metrics.currentStreak);
  }
  
  // ============================================
  // ACHIEVEMENT CHECKING
  // ============================================
  
  // Calculate progress for all achievements
  calculateProgress(): AchievementProgress[] {
    const metrics = getMetrics();
    const unlocked = getUnlockedAchievementIds();
    
    return ALL_ACHIEVEMENTS.map(achievement => {
      const isUnlocked = !!unlocked[achievement.id];
      const current = this.getCurrentValue(achievement, metrics);
      const target = this.getTargetValue(achievement);
      const progress = Math.min((current / target) * 100, 100);
      
      return {
        achievement,
        current,
        target,
        isUnlocked,
        unlockedAt: unlocked[achievement.id],
        progress,
        canClaim: !isUnlocked && progress >= 100,
        lastEarnedAt: unlocked[achievement.id]
      };
    });
  }
  
  // Get current value for achievement requirement
  private getCurrentValue(achievement: Achievement, metrics: UserMetrics): number {
    const req = achievement.requirements[0]; // Simplified: use first requirement
    
    switch (req.metric) {
      case 'total_completed': return metrics.totalCompleted;
      case 'beginner_completed': return metrics.beginnerCompleted;
      case 'intermediate_completed': return metrics.intermediateCompleted;
      case 'advanced_completed': return metrics.advancedCompleted;
      case 'current_streak': return metrics.currentStreak;
      case 'channels_explored': return metrics.channelsExplored.length;
      case 'quiz_correct_streak': return metrics.quizCorrectStreak;
      case 'session_questions': return metrics.questionsThisSession;
      case 'weekend_streak': return metrics.weekendStreak;
      case 'voice_interviews_this_week': return metrics.voiceInterviewsThisWeek || 0;
      case 'questions_today': return metrics.questionsToday || 0;
      case 'questions_this_week': return metrics.questionsThisWeek || 0;
      case 'channels_this_week': return (metrics.channelsThisWeek || []).length;
      case 'quiz_correct_today': return metrics.quizCorrectToday || 0;
      case 'channel_completion': {
        const completions = Object.values(metrics.channelCompletions || {});
        return completions.length > 0 ? Math.max(...completions) : 0;
      }
      case 'study_hour': {
        if (metrics.lastStudyTime) {
          return new Date(metrics.lastStudyTime).getHours();
        }
        return 0;
      }
      // Voice metrics
      case 'voice_interviews': return metrics.voiceInterviews;
      case 'voice_successes': return metrics.voiceSuccesses;
      // SRS metrics
      case 'srs_reviews': return metrics.srsReviews || 0;
      // Training metrics
      case 'training_sessions': return metrics.trainingSessions || 0;
      // Coding metrics
      case 'coding_challenges_completed': return metrics.codingChallengesCompleted || 0;
      case 'coding_challenges_passed': return metrics.codingChallengesPassed || 0;
      // Certification metrics
      case 'certifications_passed': return metrics.certificationsPassed || 0;
      default: return 0;
    }
  }
  
  // Get target value for achievement
  private getTargetValue(achievement: Achievement): number {
    return achievement.requirements[0]?.target || 1;
  }
  
  // Check if requirement is met
  private checkRequirement(req: Requirement, metrics: UserMetrics): boolean {
    const current = this.getCurrentValue({ requirements: [req] } as Achievement, metrics);
    const operator = req.operator || 'gte';
    
    switch (operator) {
      case 'gte': return current >= req.target;
      case 'lte': return current <= req.target;
      case 'eq': return current === req.target;
      default: return false;
    }
  }
  
  // ============================================
  // REWARD DISTRIBUTION
  // ============================================
  
  // Unlock achievement and award rewards
  private unlockAchievement(achievement: Achievement): void {
    const timestamp = new Date().toISOString();
    
    // Mark as unlocked
    unlockAchievement(achievement.id, timestamp);
    
    // Award rewards
    const rewardsEarned = this.awardRewards(achievement.rewards);
    
    // Add to history
    const unlock: AchievementUnlock = {
      achievementId: achievement.id,
      unlockedAt: timestamp,
      rewardsEarned,
      context: {
        trigger: 'auto',
        metrics: getMetrics()
      }
    };
    addAchievementToHistory(unlock);
    
    console.log(`🎉 Achievement unlocked: ${achievement.name}`);
  }
  
  // Award rewards
  private awardRewards(rewards: Reward[]): Reward[] {
    const awarded: Reward[] = [];
    
    for (const reward of rewards) {
      switch (reward.type) {
        case 'xp':
          this.awardXP(reward.amount);
          awarded.push(reward);
          break;
          
        case 'credits':
          this.awardCredits(reward.amount);
          awarded.push(reward);
          break;
          
        case 'title':
          // Titles are just tracked, not stored separately
          awarded.push(reward);
          break;
          
        case 'streak-bonus':
          // Streak bonuses are applied automatically
          awarded.push(reward);
          break;
          
        case 'unlock':
          // Feature unlocks are checked by level
          awarded.push(reward);
          break;
      }
    }
    
    return awarded;
  }
  
  // Award XP and check for level up
  awardXP(amount: number): void {
    const metrics = getMetrics();
    const oldLevel = metrics.level;
    const newXP = metrics.totalXP + amount;
    
    // Calculate new level
    const newLevelData = getLevelByXP(newXP);
    
    updateMetrics({
      totalXP: newXP,
      level: newLevelData.level
    });
    
    // Check for level up
    if (newLevelData.level > oldLevel) {
      this.onLevelUp(oldLevel, newLevelData.level);
    }
  }
  
  // Award credits (integrate with existing credit system)
  private awardCredits(amount: number): void {
    // This will integrate with the existing credits system
    // For now, just log it
    console.log(`💰 Awarded ${amount} credits`);
    
    // TODO: Call existing credit system
    // earnCredits(amount, 'Achievement reward');
  }
  
  // Handle level up
  private onLevelUp(oldLevel: number, newLevel: number): void {
    console.log(`🎊 Level up! ${oldLevel} → ${newLevel}`);
    
    // Award level up rewards
    const levelData = getNextLevel(oldLevel);
    if (levelData && levelData.rewards) {
      this.awardRewards(levelData.rewards);
    }
  }
  
  // ============================================
  // LISTENERS
  // ============================================
  
  // Add listener for achievement unlocks
  addListener(callback: (achievements: Achievement[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  // Notify all listeners
  private notifyListeners(achievements: Achievement[]): void {
    this.listeners.forEach(callback => callback(achievements));
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  // Get progress for specific achievement
  getAchievementProgress(achievementId: string): AchievementProgress | null {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return null;
    
    const allProgress = this.calculateProgress();
    return allProgress.find(ap => ap.achievement.id === achievementId) || null;
  }
  
  // Get all unlocked achievements
  getUnlockedAchievements(): Achievement[] {
    const unlocked = getUnlockedAchievementIds();
    return ALL_ACHIEVEMENTS.filter(a => unlocked[a.id]);
  }
  
  // Get achievements by category
  getAchievementsByCategory(category: string): AchievementProgress[] {
    return this.calculateProgress().filter(ap => ap.achievement.category === category);
  }
  
  // Get next achievements to unlock
  getNextAchievements(limit: number = 5): AchievementProgress[] {
    return this.calculateProgress()
      .filter(ap => !ap.isUnlocked && ap.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const achievementEngine = new AchievementEngineClass();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export function processUserEvent(event: UserEvent): Achievement[] {
  return achievementEngine.processEvent(event);
}

export function calculateAchievementProgress(): AchievementProgress[] {
  return achievementEngine.calculateProgress();
}

export function getAchievementProgress(achievementId: string): AchievementProgress | null {
  return achievementEngine.getAchievementProgress(achievementId);
}

export function getUnlockedAchievements(): Achievement[] {
  return achievementEngine.getUnlockedAchievements();
}

export function getAchievementsByCategory(category: string): AchievementProgress[] {
  return achievementEngine.getAchievementsByCategory(category);
}

export function getNextAchievements(limit?: number): AchievementProgress[] {
  return achievementEngine.getNextAchievements(limit);
}

export function addAchievementListener(callback: (achievements: Achievement[]) => void): () => void {
  return achievementEngine.addListener(callback);
}

export function awardXP(amount: number): void {
  achievementEngine.awardXP(amount);
}

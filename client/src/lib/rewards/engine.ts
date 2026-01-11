/**
 * Unified Reward Engine
 * Central engine that processes all activities and distributes rewards
 */

import {
  ActivityEvent,
  ActivityType,
  RewardResult,
  UnlockedAchievement,
  LevelUpReward,
  RewardSummary,
} from './types';
import {
  ACTIVITY_REWARDS,
  XP_CONFIG,
  CREDIT_CONFIG,
  getStreakMultiplier,
  getDifficultyMultiplier,
  calculateLevelUpCredits,
} from './config';
import { rewardStorage } from './storage';
import { 
  processUserEvent as processAchievementEvent,
  Achievement,
  UserEvent,
} from '../achievements';

// ============================================
// REWARD ENGINE CLASS
// ============================================

class RewardEngineClass {
  private listeners: Set<(result: RewardResult) => void> = new Set();
  
  // ============================================
  // MAIN PROCESSING
  // ============================================
  
  /**
   * Process an activity and distribute all rewards
   */
  processActivity(event: ActivityEvent): RewardResult {
    const progress = rewardStorage.getProgress();
    const config = ACTIVITY_REWARDS[event.type];
    
    // Initialize result
    let xpEarned = 0;
    let creditsEarned = 0;
    let creditsSpent = 0;
    let xpMultiplier = 1.0;
    
    // Update streak if this is an activity that counts
    const streakResult = this.shouldUpdateStreak(event.type) 
      ? rewardStorage.updateStreak() 
      : { currentStreak: progress.currentStreak, isNewDay: false, streakBroken: false };
    
    // Calculate XP
    if (config.baseXP > 0) {
      xpEarned = this.calculateXP(event, config.baseXP);
      
      // Apply streak multiplier if applicable
      if (config.streakMultiplier) {
        xpMultiplier = getStreakMultiplier(streakResult.currentStreak);
        xpEarned = Math.round(xpEarned * xpMultiplier);
      }
      
      // Apply difficulty multiplier if applicable
      if (config.difficultyMultiplier && event.data?.difficulty) {
        const diffMultiplier = getDifficultyMultiplier(event.data.difficulty);
        xpEarned = Math.round(xpEarned * diffMultiplier);
      }
    }
    
    // Calculate credits
    if (config.baseCredits !== 0) {
      creditsEarned = this.calculateCredits(event, config.baseCredits);
    }
    
    // Handle credit costs
    if (config.creditCost && config.creditCost > 0) {
      const spendResult = rewardStorage.spendCredits(config.creditCost);
      if (spendResult.success) {
        creditsSpent = config.creditCost;
      }
    }
    
    // Award XP
    const oldLevel = progress.level;
    let newLevel = oldLevel;
    let leveledUp = false;
    const levelRewards: LevelUpReward[] = [];
    
    if (xpEarned > 0) {
      const xpResult = rewardStorage.addXP(xpEarned);
      newLevel = xpResult.newLevel;
      leveledUp = xpResult.leveledUp;
      
      // Award level up rewards
      if (leveledUp) {
        const levelCredits = calculateLevelUpCredits(newLevel);
        rewardStorage.addCredits(levelCredits);
        creditsEarned += levelCredits;
        levelRewards.push({ type: 'credits', amount: levelCredits });
        
        // Add level up notification
        rewardStorage.addNotification({
          type: 'level_up',
          title: 'Level Up!',
          message: `You reached level ${newLevel}!`,
          icon: 'trophy',
          color: '#ffd700',
          amount: newLevel,
        });
      }
    }
    
    // Award credits
    if (creditsEarned > 0) {
      rewardStorage.addCredits(creditsEarned);
    }
    
    // Update activity-specific metrics
    this.updateActivityMetrics(event);
    
    // Process achievements
    const achievementsUnlocked = this.processAchievements(event);
    
    // Award achievement rewards
    for (const achievement of achievementsUnlocked) {
      xpEarned += achievement.rewards.xp;
      creditsEarned += achievement.rewards.credits;
      
      if (achievement.rewards.xp > 0) {
        rewardStorage.addXP(achievement.rewards.xp);
      }
      if (achievement.rewards.credits > 0) {
        rewardStorage.addCredits(achievement.rewards.credits);
      }
      
      // Add achievement notification
      rewardStorage.addNotification({
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: achievement.name,
        icon: achievement.icon,
        color: this.getTierColor(achievement.tier),
      });
    }
    
    // Get final state
    const finalProgress = rewardStorage.getProgress();
    
    // Build result
    const result: RewardResult = {
      xpEarned,
      xpMultiplier,
      totalXP: xpEarned,
      newTotalXP: finalProgress.totalXP,
      
      creditsEarned,
      creditsSpent,
      netCredits: creditsEarned - creditsSpent,
      newBalance: finalProgress.creditBalance,
      
      leveledUp,
      oldLevel,
      newLevel,
      levelRewards: levelRewards.length > 0 ? levelRewards : undefined,
      
      achievementsUnlocked,
      
      streakBonus: xpMultiplier > 1 ? Math.round((xpMultiplier - 1) * 100) : 0,
      currentStreak: streakResult.currentStreak,
      
      summary: this.buildSummary(xpEarned, creditsEarned, creditsSpent, leveledUp, achievementsUnlocked),
    };
    
    // Notify listeners
    this.notifyListeners(result);
    
    return result;
  }
  
  // ============================================
  // XP CALCULATION
  // ============================================
  
  private calculateXP(event: ActivityEvent, baseXP: number): number {
    let xp = baseXP;
    
    switch (event.type) {
      case 'question_completed':
        // Adjust based on difficulty
        if (event.data?.difficulty === 'beginner') xp = XP_CONFIG.QUESTION_BEGINNER;
        else if (event.data?.difficulty === 'intermediate') xp = XP_CONFIG.QUESTION_INTERMEDIATE;
        else if (event.data?.difficulty === 'advanced') xp = XP_CONFIG.QUESTION_ADVANCED;
        break;
        
      case 'quiz_answered':
        xp = event.data?.isCorrect ? XP_CONFIG.QUIZ_CORRECT : XP_CONFIG.QUIZ_WRONG;
        break;
        
      case 'srs_card_rated':
        const rating = event.data?.rating;
        if (rating === 'again') xp = XP_CONFIG.SRS_AGAIN;
        else if (rating === 'hard') xp = XP_CONFIG.SRS_HARD;
        else if (rating === 'good') xp = XP_CONFIG.SRS_GOOD;
        else if (rating === 'easy') xp = XP_CONFIG.SRS_EASY;
        break;
        
      case 'voice_interview_completed':
        xp = XP_CONFIG.VOICE_ATTEMPT;
        const verdict = event.data?.verdict;
        if (verdict === 'hire' || verdict === 'strong-hire') {
          xp += XP_CONFIG.VOICE_SUCCESS;
        }
        break;
    }
    
    return xp;
  }
  
  // ============================================
  // CREDIT CALCULATION
  // ============================================
  
  private calculateCredits(event: ActivityEvent, baseCredits: number): number {
    let credits = baseCredits;
    
    switch (event.type) {
      case 'quiz_answered':
        credits = event.data?.isCorrect ? CREDIT_CONFIG.QUIZ_CORRECT : CREDIT_CONFIG.QUIZ_WRONG;
        // Don't go negative
        if (credits < 0) {
          const balance = rewardStorage.getCreditBalance();
          credits = Math.max(credits, -balance);
        }
        break;
        
      case 'srs_card_rated':
        const rating = event.data?.rating;
        if (rating === 'again') credits = CREDIT_CONFIG.SRS_AGAIN;
        else if (rating === 'hard') credits = CREDIT_CONFIG.SRS_HARD;
        else if (rating === 'good') credits = CREDIT_CONFIG.SRS_GOOD;
        else if (rating === 'easy') credits = CREDIT_CONFIG.SRS_EASY;
        // Don't go negative
        if (credits < 0) {
          const balance = rewardStorage.getCreditBalance();
          credits = Math.max(credits, -balance);
        }
        break;
        
      case 'voice_interview_completed':
        credits = CREDIT_CONFIG.VOICE_ATTEMPT;
        const verdict = event.data?.verdict;
        if (verdict === 'hire' || verdict === 'strong-hire') {
          credits += CREDIT_CONFIG.VOICE_SUCCESS_BONUS;
        }
        break;
    }
    
    return credits;
  }
  
  // ============================================
  // METRIC UPDATES
  // ============================================
  
  private updateActivityMetrics(event: ActivityEvent): void {
    switch (event.type) {
      case 'question_completed':
        rewardStorage.incrementProgress('questionsCompleted');
        rewardStorage.incrementSessionQuestions();
        rewardStorage.incrementTodayQuestions();
        rewardStorage.incrementThisWeekQuestions();
        
        // Track difficulty
        if (event.data?.difficulty === 'beginner') {
          rewardStorage.incrementProgress('beginnerCompleted');
        } else if (event.data?.difficulty === 'intermediate') {
          rewardStorage.incrementProgress('intermediateCompleted');
        } else if (event.data?.difficulty === 'advanced') {
          rewardStorage.incrementProgress('advancedCompleted');
        }
        
        // Track channel
        if (event.data?.channel) {
          rewardStorage.trackChannelExplored(event.data.channel);
          rewardStorage.updateChannelProgress(event.data.channel, 1);
        }
        break;
        
      case 'quiz_answered':
        if (event.data?.isCorrect) {
          rewardStorage.incrementProgress('quizAnswersCorrect');
        } else {
          rewardStorage.incrementProgress('quizAnswersWrong');
        }
        break;
        
      case 'voice_interview_completed':
        rewardStorage.incrementProgress('voiceInterviews');
        if (event.data?.verdict === 'hire' || event.data?.verdict === 'strong-hire') {
          rewardStorage.incrementProgress('voiceSuccesses');
        }
        break;
        
      case 'srs_card_rated':
        rewardStorage.incrementProgress('srsReviews');
        break;
        
      case 'session_started':
        rewardStorage.startSession();
        break;
    }
  }
  
  // ============================================
  // ACHIEVEMENT PROCESSING
  // ============================================
  
  private processAchievements(event: ActivityEvent): UnlockedAchievement[] {
    // Map to achievement system event type
    const achievementEvent = this.mapToAchievementEvent(event);
    if (!achievementEvent) return [];
    
    // Process through achievement engine
    const unlocked = processAchievementEvent(achievementEvent);
    
    // Map to our format
    return unlocked.map(a => this.mapAchievement(a));
  }
  
  private mapToAchievementEvent(event: ActivityEvent): UserEvent | null {
    const typeMap: Partial<Record<ActivityType, string>> = {
      'question_completed': 'question_completed',
      'quiz_answered': 'quiz_answered',
      'voice_interview_completed': 'voice_interview_completed',
      'srs_card_rated': 'srs_review',
      'session_started': 'session_started',
      'session_ended': 'session_ended',
      'daily_login': 'daily_login',
      'streak_updated': 'streak_updated',
    };
    
    const mappedType = typeMap[event.type];
    if (!mappedType) return null;
    
    return {
      type: mappedType as any,
      timestamp: event.timestamp,
      data: event.data,
    };
  }
  
  private mapAchievement(achievement: Achievement): UnlockedAchievement {
    const xpReward = achievement.rewards.find(r => r.type === 'xp');
    const creditReward = achievement.rewards.find(r => r.type === 'credits');
    const titleReward = achievement.rewards.find(r => r.type === 'title');
    
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      tier: achievement.tier,
      icon: achievement.icon,
      rewards: {
        xp: xpReward?.amount || 0,
        credits: creditReward?.amount || 0,
        title: titleReward?.item,
      },
    };
  }
  
  // ============================================
  // HELPERS
  // ============================================
  
  private shouldUpdateStreak(type: ActivityType): boolean {
    const streakActivities: ActivityType[] = [
      'question_completed',
      'quiz_answered',
      'voice_interview_completed',
      'srs_card_rated',
      'daily_login',
    ];
    return streakActivities.includes(type);
  }
  
  private getTierColor(tier: string): string {
    const colors: Record<string, string> = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2',
      diamond: '#b9f2ff',
    };
    return colors[tier] || '#888';
  }
  
  private buildSummary(
    xp: number,
    creditsEarned: number,
    creditsSpent: number,
    leveledUp: boolean,
    achievements: UnlockedAchievement[]
  ): RewardSummary {
    const details: string[] = [];
    
    if (xp > 0) details.push(`+${xp} XP`);
    if (creditsEarned > 0) details.push(`+${creditsEarned} credits`);
    if (creditsSpent > 0) details.push(`-${creditsSpent} credits`);
    if (leveledUp) details.push('Level up!');
    if (achievements.length > 0) {
      details.push(`${achievements.length} achievement${achievements.length > 1 ? 's' : ''} unlocked`);
    }
    
    const hasRewards = xp > 0 || creditsEarned > 0 || leveledUp || achievements.length > 0;
    
    return {
      hasRewards,
      message: hasRewards ? details.join(' • ') : '',
      details,
    };
  }
  
  // ============================================
  // LISTENERS
  // ============================================
  
  addListener(callback: (result: RewardResult) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  private notifyListeners(result: RewardResult): void {
    this.listeners.forEach(callback => callback(result));
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  /**
   * Get current user progress summary
   */
  getProgressSummary() {
    const progress = rewardStorage.getProgress();
    return {
      level: progress.level,
      totalXP: progress.totalXP,
      creditBalance: progress.creditBalance,
      currentStreak: progress.currentStreak,
      questionsCompleted: progress.questionsCompleted,
      channelsExplored: progress.channelsExplored.length,
    };
  }
  
  /**
   * Check if user can afford an action
   */
  canAfford(amount: number): boolean {
    return rewardStorage.canAfford(amount);
  }
  
  /**
   * Get streak multiplier for current streak
   */
  getStreakMultiplier(): number {
    return getStreakMultiplier(rewardStorage.getCurrentStreak());
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const rewardEngine = new RewardEngineClass();

// ============================================
// CONVENIENCE EXPORTS
// ============================================

export const processActivity = (event: ActivityEvent) => rewardEngine.processActivity(event);
export const getProgressSummary = () => rewardEngine.getProgressSummary();
export const canAffordActivity = (amount: number) => rewardEngine.canAfford(amount);
export const addRewardListener = (callback: (result: RewardResult) => void) => rewardEngine.addListener(callback);

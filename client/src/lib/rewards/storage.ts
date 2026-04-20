/**
 * Unified Reward Storage
 * Centralized storage for all user progress, XP, credits, and achievements
 */

import { UserProgressState, RewardNotification } from './types';

// Storage keys
const STORAGE_KEYS = {
  PROGRESS: 'unified-progress',
  NOTIFICATIONS: 'reward-notifications',
  VERSION: 'reward-system-version',
} as const;

const CURRENT_VERSION = '2.0.0';

// ============================================
// DEFAULT STATE
// ============================================

function getDefaultProgressState(): UserProgressState {
  return {
    // XP & Level
    totalXP: 0,
    level: 1,
    
    // Credits
    creditBalance: 500, // New user bonus
    totalCreditsEarned: 500,
    totalCreditsSpent: 0,
    
    // Streaks
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    
    // Activity counts
    questionsCompleted: 0,
    quizAnswersCorrect: 0,
    quizAnswersWrong: 0,
    voiceInterviews: 0,
    voiceSuccesses: 0,
    srsReviews: 0,
    
    // Difficulty breakdown
    beginnerCompleted: 0,
    intermediateCompleted: 0,
    advancedCompleted: 0,
    
    // Channel exploration
    channelsExplored: [],
    channelProgress: {},
    
    // Session tracking
    currentSessionQuestions: 0,
    todayQuestions: 0,
    thisWeekQuestions: 0,
    
    // Timestamps
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// ============================================
// STORAGE CLASS
// ============================================

class RewardStorageManager {
  private progressCache: UserProgressState | null = null;
  private notificationsCache: RewardNotification[] = [];
  
  constructor() {
    this.initialize();
  }
  
  private initialize(): void {
    try {
      // Check version and migrate if needed
      const version = localStorage.getItem(STORAGE_KEYS.VERSION);
      if (version !== CURRENT_VERSION) {
        this.migrate(version, CURRENT_VERSION);
      }
      
      // Load progress
      const progressStr = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (progressStr) {
        this.progressCache = JSON.parse(progressStr);
      } else {
        // Try to migrate from old systems
        this.migrateFromLegacySystems();
      }
      
      // Load notifications
      const notificationsStr = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (notificationsStr) {
        this.notificationsCache = JSON.parse(notificationsStr);
      }
    } catch (error) {
      console.error('Failed to initialize reward storage:', error);
      this.progressCache = getDefaultProgressState();
    }
  }
  
  private migrate(fromVersion: string | null, toVersion: string): void {
    console.log(`Migrating reward system from ${fromVersion || 'none'} to ${toVersion}`);
    localStorage.setItem(STORAGE_KEYS.VERSION, toVersion);
  }
  
  private migrateFromLegacySystems(): void {
    const progress = getDefaultProgressState();
    
    try {
      // Migrate from old achievement system
      const oldMetrics = localStorage.getItem('achievement-metrics');
      if (oldMetrics) {
        const metrics = JSON.parse(oldMetrics);
        progress.totalXP = metrics.totalXP || 0;
        progress.level = metrics.level || 1;
        progress.currentStreak = metrics.currentStreak || 0;
        progress.longestStreak = metrics.longestStreak || 0;
        progress.questionsCompleted = metrics.totalCompleted || 0;
        progress.beginnerCompleted = metrics.beginnerCompleted || 0;
        progress.intermediateCompleted = metrics.intermediateCompleted || 0;
        progress.advancedCompleted = metrics.advancedCompleted || 0;
        progress.channelsExplored = metrics.channelsExplored || [];
        progress.quizAnswersCorrect = metrics.quizTotalCorrect || 0;
        progress.quizAnswersWrong = metrics.quizTotalWrong || 0;
        progress.voiceInterviews = metrics.voiceInterviews || 0;
        progress.voiceSuccesses = metrics.voiceSuccesses || 0;
      }
      
      // Migrate from old credits system
      const oldCredits = localStorage.getItem('user-credits');
      if (oldCredits) {
        const credits = JSON.parse(oldCredits);
        progress.creditBalance = credits.balance || 500;
        progress.totalCreditsEarned = credits.totalEarned || 500;
        progress.totalCreditsSpent = credits.totalSpent || 0;
      }
      
      // Migrate from old badge stats
      const oldBadgeStats = localStorage.getItem('badge-stats');
      if (oldBadgeStats) {
        const stats = JSON.parse(oldBadgeStats);
        if (stats.totalCompleted && !progress.questionsCompleted) {
          progress.questionsCompleted = stats.totalCompleted;
        }
        if (stats.streak && !progress.currentStreak) {
          progress.currentStreak = stats.streak;
        }
      }
      
      console.log('Migrated from legacy systems');
    } catch (error) {
      console.error('Failed to migrate from legacy systems:', error);
    }
    
    this.progressCache = progress;
    this.saveProgress();
  }
  
  private saveProgress(): void {
    if (!this.progressCache) return;
    
    try {
      this.progressCache.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.progressCache));
    } catch (error) {
      console.error('Failed to save progress:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupOldData();
      }
    }
  }
  
  private saveNotifications(): void {
    try {
      // Keep only last 50 notifications
      const trimmed = this.notificationsCache.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }
  
  private cleanupOldData(): void {
    // Clear old notification data
    this.notificationsCache = this.notificationsCache.slice(0, 20);
    this.saveNotifications();
  }
  
  // ============================================
  // PUBLIC API - Progress
  // ============================================
  
  getProgress(): UserProgressState {
    if (!this.progressCache) {
      this.progressCache = getDefaultProgressState();
      this.saveProgress();
    }
    return { ...this.progressCache };
  }
  
  updateProgress(updates: Partial<UserProgressState>): UserProgressState {
    if (!this.progressCache) {
      this.progressCache = getDefaultProgressState();
    }
    
    this.progressCache = { ...this.progressCache, ...updates };
    this.saveProgress();
    
    return { ...this.progressCache };
  }
  
  incrementProgress<K extends keyof UserProgressState>(
    key: K,
    amount: number = 1
  ): UserProgressState {
    const progress = this.getProgress();
    const currentValue = progress[key];
    
    if (typeof currentValue === 'number') {
      return this.updateProgress({ [key]: currentValue + amount } as Partial<UserProgressState>);
    }
    
    return progress;
  }
  
  // ============================================
  // PUBLIC API - Credits
  // ============================================
  
  getCreditBalance(): number {
    return this.getProgress().creditBalance;
  }
  
  addCredits(amount: number): number {
    const progress = this.getProgress();
    const newBalance = progress.creditBalance + amount;
    const newTotalEarned = progress.totalCreditsEarned + amount;
    
    this.updateProgress({
      creditBalance: newBalance,
      totalCreditsEarned: newTotalEarned,
    });
    
    return newBalance;
  }
  
  spendCredits(amount: number): { success: boolean; balance: number } {
    const progress = this.getProgress();
    
    if (progress.creditBalance < amount) {
      return { success: false, balance: progress.creditBalance };
    }
    
    const newBalance = progress.creditBalance - amount;
    const newTotalSpent = progress.totalCreditsSpent + amount;
    
    this.updateProgress({
      creditBalance: newBalance,
      totalCreditsSpent: newTotalSpent,
    });
    
    return { success: true, balance: newBalance };
  }
  
  canAfford(amount: number): boolean {
    return this.getCreditBalance() >= amount;
  }
  
  // ============================================
  // PUBLIC API - XP & Level
  // ============================================
  
  getTotalXP(): number {
    return this.getProgress().totalXP;
  }
  
  getLevel(): number {
    return this.getProgress().level;
  }
  
  addXP(amount: number): { newXP: number; newLevel: number; leveledUp: boolean } {
    const progress = this.getProgress();
    const oldLevel = progress.level;
    const newXP = progress.totalXP + amount;
    
    // Calculate new level (imported from levels system)
    const newLevel = this.calculateLevel(newXP);
    const leveledUp = newLevel > oldLevel;
    
    this.updateProgress({
      totalXP: newXP,
      level: newLevel,
    });
    
    return { newXP, newLevel, leveledUp };
  }
  
  private calculateLevel(xp: number): number {
    // Level thresholds (same as levels.ts)
    const thresholds = [
      0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
      4800, 6000, 7400, 9000, 10800, 12800, 15300, 18300, 21800, 25800,
      45800, 85800, 145800, 225800, 325800, 450800
    ];
    
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i]) {
        // Map index to level (1, 2, 3, ..., 20, 25, 30, 35, 40, 45, 50)
        if (i <= 19) return i + 1;
        return [25, 30, 35, 40, 45, 50][i - 20] || 50;
      }
    }
    
    return 1;
  }
  
  // ============================================
  // PUBLIC API - Streaks
  // ============================================
  
  getCurrentStreak(): number {
    return this.getProgress().currentStreak;
  }
  
  updateStreak(): { currentStreak: number; isNewDay: boolean; streakBroken: boolean } {
    const progress = this.getProgress();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let currentStreak = progress.currentStreak;
    let isNewDay = false;
    let streakBroken = false;
    
    if (progress.lastActivityDate) {
      const lastDate = new Date(progress.lastActivityDate);
      const lastDay = lastDate.toISOString().split('T')[0];
      
      if (lastDay === today) {
        // Same day, no change
        return { currentStreak, isNewDay: false, streakBroken: false };
      }
      
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        currentStreak += 1;
        isNewDay = true;
      } else if (daysDiff > 1) {
        // Streak broken
        currentStreak = 1;
        isNewDay = true;
        streakBroken = true;
      }
    } else {
      // First activity
      currentStreak = 1;
      isNewDay = true;
    }
    
    const longestStreak = Math.max(progress.longestStreak, currentStreak);
    
    this.updateProgress({
      currentStreak,
      longestStreak,
      lastActivityDate: today,
    });
    
    return { currentStreak, isNewDay, streakBroken };
  }
  
  // ============================================
  // PUBLIC API - Notifications
  // ============================================
  
  getNotifications(): RewardNotification[] {
    return [...this.notificationsCache];
  }
  
  addNotification(notification: Omit<RewardNotification, 'id' | 'timestamp' | 'dismissed'>): void {
    const newNotification: RewardNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    
    this.notificationsCache.unshift(newNotification);
    this.saveNotifications();
  }
  
  dismissNotification(id: string): void {
    const index = this.notificationsCache.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notificationsCache[index].dismissed = true;
      this.saveNotifications();
    }
  }
  
  clearNotifications(): void {
    this.notificationsCache = [];
    this.saveNotifications();
  }
  
  // ============================================
  // PUBLIC API - Channel Tracking
  // ============================================
  
  trackChannelExplored(channel: string): boolean {
    const progress = this.getProgress();
    
    if (!progress.channelsExplored.includes(channel)) {
      this.updateProgress({
        channelsExplored: [...progress.channelsExplored, channel],
      });
      return true; // New channel
    }
    
    return false;
  }
  
  updateChannelProgress(channel: string, questionsCompleted: number): void {
    const progress = this.getProgress();
    const channelProgress = { ...progress.channelProgress };
    channelProgress[channel] = (channelProgress[channel] || 0) + questionsCompleted;
    
    this.updateProgress({ channelProgress });
  }
  
  // ============================================
  // PUBLIC API - Session Tracking
  // ============================================
  
  startSession(): void {
    this.updateProgress({
      currentSessionQuestions: 0,
    });
  }
  
  incrementSessionQuestions(): number {
    const progress = this.getProgress();
    const newCount = progress.currentSessionQuestions + 1;
    this.updateProgress({ currentSessionQuestions: newCount });
    return newCount;
  }
  
  // ============================================
  // PUBLIC API - Daily/Weekly Tracking
  // ============================================
  
  incrementTodayQuestions(): void {
    this.checkAndResetDailyWeekly();
    this.incrementProgress('todayQuestions');
  }
  
  incrementThisWeekQuestions(): void {
    this.checkAndResetDailyWeekly();
    this.incrementProgress('thisWeekQuestions');
  }
  
  private checkAndResetDailyWeekly(): void {
    const progress = this.getProgress();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (progress.lastActivityDate !== today) {
      // Reset daily counter
      this.updateProgress({ todayQuestions: 0 });
      
      // Check if we need to reset weekly (Monday)
      if (now.getDay() === 1) {
        this.updateProgress({ thisWeekQuestions: 0 });
      }
    }
  }
  
  // ============================================
  // PUBLIC API - Export/Import
  // ============================================
  
  exportData(): string {
    return JSON.stringify({
      progress: this.getProgress(),
      notifications: this.getNotifications(),
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
  
  importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.progress) {
        this.progressCache = data.progress;
        this.saveProgress();
      }
      
      if (data.notifications) {
        this.notificationsCache = data.notifications;
        this.saveNotifications();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
  
  resetAll(): void {
    this.progressCache = getDefaultProgressState();
    this.notificationsCache = [];
    this.saveProgress();
    this.saveNotifications();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const rewardStorage = new RewardStorageManager();

// ============================================
// CONVENIENCE EXPORTS
// ============================================

export const getProgress = () => rewardStorage.getProgress();
export const updateProgress = (updates: Partial<UserProgressState>) => rewardStorage.updateProgress(updates);
export const getCreditBalance = () => rewardStorage.getCreditBalance();
export const addCredits = (amount: number) => rewardStorage.addCredits(amount);
export const spendCredits = (amount: number) => rewardStorage.spendCredits(amount);
export const canAfford = (amount: number) => rewardStorage.canAfford(amount);
export const getTotalXP = () => rewardStorage.getTotalXP();
export const getLevel = () => rewardStorage.getLevel();
export const addXP = (amount: number) => rewardStorage.addXP(amount);
export const getCurrentStreak = () => rewardStorage.getCurrentStreak();
export const updateStreak = () => rewardStorage.updateStreak();

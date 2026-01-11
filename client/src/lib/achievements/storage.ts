/**
 * Achievement Storage - LocalStorage Only
 * Optimized for static GitHub Pages deployment
 */

import { UserMetrics, AchievementUnlock, AchievementStorage } from './types';

// Storage keys
const STORAGE_KEYS = {
  METRICS: 'achievement-metrics',
  UNLOCKED: 'achievement-unlocked',
  HISTORY: 'achievement-history',
  VERSION: 'achievement-version',
} as const;

const CURRENT_VERSION = '1.0.0';

// ============================================
// STORAGE CLASS
// ============================================

class AchievementStorageManager {
  private cache: Map<string, any> = new Map();
  
  constructor() {
    this.loadFromStorage();
  }
  
  // Load all data from localStorage
  private loadFromStorage(): void {
    try {
      const version = localStorage.getItem(STORAGE_KEYS.VERSION);
      
      // Handle version migration if needed
      if (version && version !== CURRENT_VERSION) {
        this.migrate(version, CURRENT_VERSION);
      }
      
      // Load metrics
      const metricsStr = localStorage.getItem(STORAGE_KEYS.METRICS);
      if (metricsStr) {
        this.cache.set('metrics', JSON.parse(metricsStr));
      }
      
      // Load unlocked achievements
      const unlockedStr = localStorage.getItem(STORAGE_KEYS.UNLOCKED);
      if (unlockedStr) {
        this.cache.set('unlocked', JSON.parse(unlockedStr));
      }
      
      // Load history
      const historyStr = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (historyStr) {
        this.cache.set('history', JSON.parse(historyStr));
      }
    } catch (error) {
      console.error('Failed to load achievement data:', error);
      this.initializeDefaults();
    }
  }
  
  // Initialize default data
  private initializeDefaults(): void {
    const defaultMetrics: UserMetrics = {
      totalCompleted: 0,
      beginnerCompleted: 0,
      intermediateCompleted: 0,
      advancedCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      channelsExplored: [],
      channelCompletions: {},
      totalSessions: 0,
      questionsThisSession: 0,
      studyTimeToday: 0,
      quizCorrectStreak: 0,
      quizTotalCorrect: 0,
      quizTotalWrong: 0,
      voiceInterviews: 0,
      voiceSuccesses: 0,
      weekendStreak: 0,
      earlyBirdCount: 0,
      nightOwlCount: 0,
      totalXP: 0,
      level: 1,
      // New metrics
      srsReviews: 0,
      trainingSessions: 0,
      codingChallengesCompleted: 0,
      codingChallengesPassed: 0,
      certificationsPassed: 0,
      questionsToday: 0,
      questionsThisWeek: 0,
      channelsThisWeek: [],
      voiceInterviewsThisWeek: 0,
      quizCorrectToday: 0,
    };
    
    this.cache.set('metrics', defaultMetrics);
    this.cache.set('unlocked', {});
    this.cache.set('history', []);
    
    this.saveToStorage();
  }
  
  // Save all data to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
      
      const metrics = this.cache.get('metrics');
      if (metrics) {
        localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
      }
      
      const unlocked = this.cache.get('unlocked');
      if (unlocked) {
        localStorage.setItem(STORAGE_KEYS.UNLOCKED, JSON.stringify(unlocked));
      }
      
      const history = this.cache.get('history');
      if (history) {
        // Keep only last 100 entries to avoid localStorage limits
        const trimmedHistory = history.slice(0, 100);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error('Failed to save achievement data:', error);
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupOldData();
      }
    }
  }
  
  // Cleanup old data if storage is full
  private cleanupOldData(): void {
    const history = this.cache.get('history') || [];
    // Keep only last 50 entries
    this.cache.set('history', history.slice(0, 50));
    this.saveToStorage();
  }
  
  // Migrate data between versions
  private migrate(fromVersion: string, toVersion: string): void {
    console.log(`Migrating achievement data from ${fromVersion} to ${toVersion}`);
    // Add migration logic here when needed
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  // Get metrics
  getMetrics(): UserMetrics {
    let metrics = this.cache.get('metrics');
    if (!metrics) {
      this.initializeDefaults();
      metrics = this.cache.get('metrics');
    }
    return { ...metrics };
  }
  
  // Update metrics
  updateMetrics(updates: Partial<UserMetrics>): void {
    const current = this.getMetrics();
    const updated = { ...current, ...updates };
    this.cache.set('metrics', updated);
    this.saveToStorage();
  }
  
  // Increment metric
  incrementMetric(key: keyof UserMetrics, amount: number = 1): void {
    const metrics = this.getMetrics();
    const currentValue = metrics[key];
    
    if (typeof currentValue === 'number') {
      this.updateMetrics({ [key]: currentValue + amount } as Partial<UserMetrics>);
    }
  }
  
  // Get unlocked achievements
  getUnlocked(): Record<string, string> {
    return { ...(this.cache.get('unlocked') || {}) };
  }
  
  // Unlock achievement
  unlock(achievementId: string, timestamp?: string): void {
    const unlocked = this.getUnlocked();
    const unlockedAt = timestamp || new Date().toISOString();
    
    if (!unlocked[achievementId]) {
      unlocked[achievementId] = unlockedAt;
      this.cache.set('unlocked', unlocked);
      this.saveToStorage();
    }
  }
  
  // Check if achievement is unlocked
  isUnlocked(achievementId: string): boolean {
    const unlocked = this.getUnlocked();
    return !!unlocked[achievementId];
  }
  
  // Get achievement history
  getHistory(): AchievementUnlock[] {
    return [...(this.cache.get('history') || [])];
  }
  
  // Add to history
  addToHistory(unlock: AchievementUnlock): void {
    const history = this.getHistory();
    history.unshift(unlock);
    this.cache.set('history', history);
    this.saveToStorage();
  }
  
  // ============================================
  // EXPORT / IMPORT (for backup)
  // ============================================
  
  // Export all data as JSON
  export(): string {
    const data: AchievementStorage = {
      metrics: this.getMetrics(),
      unlockedAchievements: this.getUnlocked(),
      history: this.getHistory(),
      lastSync: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  // Import data from JSON
  import(jsonString: string): boolean {
    try {
      const data: AchievementStorage = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data.metrics || !data.unlockedAchievements) {
        throw new Error('Invalid data format');
      }
      
      // Import data
      this.cache.set('metrics', data.metrics);
      this.cache.set('unlocked', data.unlockedAchievements);
      this.cache.set('history', data.history || []);
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import achievement data:', error);
      return false;
    }
  }
  
  // Clear all data (for testing or reset)
  clear(): void {
    this.cache.clear();
    localStorage.removeItem(STORAGE_KEYS.METRICS);
    localStorage.removeItem(STORAGE_KEYS.UNLOCKED);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.VERSION);
    this.initializeDefaults();
  }
  
  // ============================================
  // MIGRATION FROM OLD BADGE SYSTEM
  // ============================================
  
  // Migrate from old badge system
  migrateFromOldSystem(): void {
    try {
      // Check if old badge data exists
      const oldBadges = localStorage.getItem('user-badges');
      const oldStats = localStorage.getItem('badge-stats');
      
      if (!oldBadges && !oldStats) {
        return; // Nothing to migrate
      }
      
      console.log('Migrating from old badge system...');
      
      // Parse old data
      const badges = oldBadges ? JSON.parse(oldBadges) : {};
      const stats = oldStats ? JSON.parse(oldStats) : {};
      
      // Migrate unlocked badges
      const unlocked = this.getUnlocked();
      Object.entries(badges).forEach(([badgeId, unlockedAt]) => {
        if (!unlocked[badgeId]) {
          unlocked[badgeId] = unlockedAt as string;
        }
      });
      this.cache.set('unlocked', unlocked);
      
      // Migrate stats
      const metrics = this.getMetrics();
      if (stats.totalCompleted) metrics.totalCompleted = stats.totalCompleted;
      if (stats.streak) metrics.currentStreak = stats.streak;
      if (stats.channelsExplored) metrics.channelsExplored = stats.channelsExplored;
      if (stats.difficultyStats) {
        metrics.beginnerCompleted = stats.difficultyStats.beginner || 0;
        metrics.intermediateCompleted = stats.difficultyStats.intermediate || 0;
        metrics.advancedCompleted = stats.difficultyStats.advanced || 0;
      }
      this.cache.set('metrics', metrics);
      
      this.saveToStorage();
      console.log('Migration complete!');
      
      // Don't delete old data yet - keep for safety
    } catch (error) {
      console.error('Failed to migrate old badge data:', error);
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const achievementStorage = new AchievementStorageManager();

// Auto-migrate on first load
if (typeof window !== 'undefined') {
  achievementStorage.migrateFromOldSystem();
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export function getMetrics(): UserMetrics {
  return achievementStorage.getMetrics();
}

export function updateMetrics(updates: Partial<UserMetrics>): void {
  achievementStorage.updateMetrics(updates);
}

export function incrementMetric(key: keyof UserMetrics, amount?: number): void {
  achievementStorage.incrementMetric(key, amount);
}

export function getUnlockedAchievements(): Record<string, string> {
  return achievementStorage.getUnlocked();
}

export function unlockAchievement(achievementId: string, timestamp?: string): void {
  achievementStorage.unlock(achievementId, timestamp);
}

export function isAchievementUnlocked(achievementId: string): boolean {
  return achievementStorage.isUnlocked(achievementId);
}

export function getAchievementHistory(): AchievementUnlock[] {
  return achievementStorage.getHistory();
}

export function addAchievementToHistory(unlock: AchievementUnlock): void {
  achievementStorage.addToHistory(unlock);
}

export function exportAchievementData(): string {
  return achievementStorage.export();
}

export function importAchievementData(jsonString: string): boolean {
  return achievementStorage.import(jsonString);
}

export function clearAchievementData(): void {
  achievementStorage.clear();
}

/**
 * Badge System - Apple Watch-style achievement badges
 * Tracks user progress and grants badges for various accomplishments
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'streak' | 'completion' | 'mastery' | 'explorer' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirement: number;
  unit: string;
  color: string;
  gradient: string;
}

export interface BadgeProgress {
  badge: Badge;
  current: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0-100
}

// Badge definitions organized by category
export const BADGES: Badge[] = [
  // === STREAK BADGES ===
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Study for 3 consecutive days',
    icon: 'flame',
    category: 'streak',
    tier: 'bronze',
    requirement: 3,
    unit: 'days',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800'
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Study for 7 consecutive days',
    icon: 'flame',
    category: 'streak',
    tier: 'silver',
    requirement: 7,
    unit: 'days',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500'
  },
  {
    id: 'streak-14',
    name: 'Fortnight Fighter',
    description: 'Study for 14 consecutive days',
    icon: 'flame',
    category: 'streak',
    tier: 'gold',
    requirement: 14,
    unit: 'days',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Study for 30 consecutive days',
    icon: 'flame',
    category: 'streak',
    tier: 'platinum',
    requirement: 30,
    unit: 'days',
    color: '#e5e4e2',
    gradient: 'from-slate-200 to-slate-400'
  },
  {
    id: 'streak-100',
    name: 'Century Legend',
    description: 'Study for 100 consecutive days',
    icon: 'crown',
    category: 'streak',
    tier: 'diamond',
    requirement: 100,
    unit: 'days',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500'
  },

  // === COMPLETION BADGES ===
  {
    id: 'complete-10',
    name: 'First Steps',
    description: 'Complete 10 questions',
    icon: 'check-circle',
    category: 'completion',
    tier: 'bronze',
    requirement: 10,
    unit: 'questions',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800'
  },
  {
    id: 'complete-50',
    name: 'Warming Up',
    description: 'Complete 50 questions',
    icon: 'check-circle',
    category: 'completion',
    tier: 'silver',
    requirement: 50,
    unit: 'questions',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500'
  },
  {
    id: 'complete-100',
    name: 'Century Club',
    description: 'Complete 100 questions',
    icon: 'award',
    category: 'completion',
    tier: 'gold',
    requirement: 100,
    unit: 'questions',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'complete-250',
    name: 'Knowledge Seeker',
    description: 'Complete 250 questions',
    icon: 'award',
    category: 'completion',
    tier: 'platinum',
    requirement: 250,
    unit: 'questions',
    color: '#e5e4e2',
    gradient: 'from-slate-200 to-slate-400'
  },
  {
    id: 'complete-500',
    name: 'Interview Ready',
    description: 'Complete 500 questions',
    icon: 'trophy',
    category: 'completion',
    tier: 'diamond',
    requirement: 500,
    unit: 'questions',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500'
  },

  // === MASTERY BADGES (Difficulty-based) ===
  {
    id: 'beginner-25',
    name: 'Foundation Builder',
    description: 'Complete 25 beginner questions',
    icon: 'book-open',
    category: 'mastery',
    tier: 'bronze',
    requirement: 25,
    unit: 'beginner',
    color: '#22c55e',
    gradient: 'from-green-400 to-green-600'
  },
  {
    id: 'intermediate-25',
    name: 'Rising Star',
    description: 'Complete 25 intermediate questions',
    icon: 'trending-up',
    category: 'mastery',
    tier: 'silver',
    requirement: 25,
    unit: 'intermediate',
    color: '#eab308',
    gradient: 'from-yellow-400 to-yellow-600'
  },
  {
    id: 'advanced-25',
    name: 'Challenge Accepted',
    description: 'Complete 25 advanced questions',
    icon: 'zap',
    category: 'mastery',
    tier: 'gold',
    requirement: 25,
    unit: 'advanced',
    color: '#ef4444',
    gradient: 'from-red-400 to-red-600'
  },
  {
    id: 'advanced-100',
    name: 'Elite Performer',
    description: 'Complete 100 advanced questions',
    icon: 'star',
    category: 'mastery',
    tier: 'diamond',
    requirement: 100,
    unit: 'advanced',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500'
  },

  // === EXPLORER BADGES (Channel-based) ===
  {
    id: 'explorer-3',
    name: 'Curious Mind',
    description: 'Complete questions in 3 different channels',
    icon: 'compass',
    category: 'explorer',
    tier: 'bronze',
    requirement: 3,
    unit: 'channels',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800'
  },
  {
    id: 'explorer-5',
    name: 'Versatile Learner',
    description: 'Complete questions in 5 different channels',
    icon: 'compass',
    category: 'explorer',
    tier: 'silver',
    requirement: 5,
    unit: 'channels',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500'
  },
  {
    id: 'explorer-all',
    name: 'Renaissance Dev',
    description: 'Complete at least 1 question in every channel',
    icon: 'globe',
    category: 'explorer',
    tier: 'gold',
    requirement: 10,
    unit: 'channels',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'channel-master',
    name: 'Channel Master',
    description: 'Complete 100% of any channel',
    icon: 'medal',
    category: 'explorer',
    tier: 'platinum',
    requirement: 100,
    unit: 'percent',
    color: '#e5e4e2',
    gradient: 'from-slate-200 to-slate-400'
  },

  // === SPECIAL BADGES ===
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Study before 7 AM',
    icon: 'sunrise',
    category: 'special',
    tier: 'bronze',
    requirement: 1,
    unit: 'sessions',
    color: '#f97316',
    gradient: 'from-orange-400 to-orange-600'
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Study after 11 PM',
    icon: 'moon',
    category: 'special',
    tier: 'bronze',
    requirement: 1,
    unit: 'sessions',
    color: '#6366f1',
    gradient: 'from-indigo-400 to-indigo-600'
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Study on 4 consecutive weekends',
    icon: 'calendar',
    category: 'special',
    tier: 'silver',
    requirement: 4,
    unit: 'weekends',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500'
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete 10 questions in a single session',
    icon: 'rocket',
    category: 'special',
    tier: 'gold',
    requirement: 10,
    unit: 'questions',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600'
  },
];

// Storage keys
const BADGES_STORAGE_KEY = 'user-badges';
const BADGE_STATS_KEY = 'badge-stats';

interface BadgeStats {
  totalCompleted: number;
  streak: number;
  channelsExplored: string[];
  difficultyStats: { beginner: number; intermediate: number; advanced: number };
  sessionQuestions: number;
  weekendStreak: number;
  lastStudyTime?: string;
}

// Get stored badge unlocks
export function getUnlockedBadges(): Record<string, string> {
  try {
    const stored = localStorage.getItem(BADGES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save badge unlock
export function unlockBadge(badgeId: string): void {
  const unlocked = getUnlockedBadges();
  if (!unlocked[badgeId]) {
    unlocked[badgeId] = new Date().toISOString();
    localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(unlocked));
  }
}

// Get badge stats from localStorage
export function getBadgeStats(): BadgeStats {
  try {
    const stored = localStorage.getItem(BADGE_STATS_KEY);
    return stored ? JSON.parse(stored) : {
      totalCompleted: 0,
      streak: 0,
      channelsExplored: [],
      difficultyStats: { beginner: 0, intermediate: 0, advanced: 0 },
      sessionQuestions: 0,
      weekendStreak: 0
    };
  } catch {
    return {
      totalCompleted: 0,
      streak: 0,
      channelsExplored: [],
      difficultyStats: { beginner: 0, intermediate: 0, advanced: 0 },
      sessionQuestions: 0,
      weekendStreak: 0
    };
  }
}

// Update badge stats
export function updateBadgeStats(stats: Partial<BadgeStats>): void {
  const current = getBadgeStats();
  const updated = { ...current, ...stats };
  localStorage.setItem(BADGE_STATS_KEY, JSON.stringify(updated));
}

// Calculate all badge progress
export function calculateBadgeProgress(
  totalCompleted: number,
  streak: number,
  channelsExplored: string[],
  difficultyStats: { beginner: number; intermediate: number; advanced: number },
  channelCompletionPcts: number[],
  totalChannels: number
): BadgeProgress[] {
  const unlocked = getUnlockedBadges();
  const stats = getBadgeStats();
  
  return BADGES.map(badge => {
    let current = 0;
    
    switch (badge.id) {
      // Streak badges
      case 'streak-3':
      case 'streak-7':
      case 'streak-14':
      case 'streak-30':
      case 'streak-100':
        current = streak;
        break;
      
      // Completion badges
      case 'complete-10':
      case 'complete-50':
      case 'complete-100':
      case 'complete-250':
      case 'complete-500':
        current = totalCompleted;
        break;
      
      // Mastery badges
      case 'beginner-25':
        current = difficultyStats.beginner;
        break;
      case 'intermediate-25':
        current = difficultyStats.intermediate;
        break;
      case 'advanced-25':
      case 'advanced-100':
        current = difficultyStats.advanced;
        break;
      
      // Explorer badges
      case 'explorer-3':
      case 'explorer-5':
        current = channelsExplored.length;
        break;
      case 'explorer-all':
        current = Math.min(channelsExplored.length, totalChannels);
        break;
      case 'channel-master':
        current = Math.max(...channelCompletionPcts, 0);
        break;
      
      // Special badges
      case 'early-bird':
        current = stats.lastStudyTime ? (new Date(stats.lastStudyTime).getHours() < 7 ? 1 : 0) : 0;
        break;
      case 'night-owl':
        current = stats.lastStudyTime ? (new Date(stats.lastStudyTime).getHours() >= 23 ? 1 : 0) : 0;
        break;
      case 'weekend-warrior':
        current = stats.weekendStreak || 0;
        break;
      case 'speed-demon':
        current = stats.sessionQuestions || 0;
        break;
    }
    
    const isUnlocked = !!unlocked[badge.id] || current >= badge.requirement;
    const progress = Math.min((current / badge.requirement) * 100, 100);
    
    // Auto-unlock if requirement met
    if (current >= badge.requirement && !unlocked[badge.id]) {
      unlockBadge(badge.id);
    }
    
    return {
      badge,
      current,
      isUnlocked,
      unlockedAt: unlocked[badge.id],
      progress
    };
  });
}

// Get badges by category
export function getBadgesByCategory(category: Badge['category']): Badge[] {
  return BADGES.filter(b => b.category === category);
}

// Get tier color
export function getTierColor(tier: Badge['tier']): string {
  switch (tier) {
    case 'bronze': return '#cd7f32';
    case 'silver': return '#c0c0c0';
    case 'gold': return '#ffd700';
    case 'platinum': return '#e5e4e2';
    case 'diamond': return '#b9f2ff';
    default: return '#888';
  }
}

// Get category label
export function getCategoryLabel(category: Badge['category']): string {
  switch (category) {
    case 'streak': return 'Consistency';
    case 'completion': return 'Progress';
    case 'mastery': return 'Difficulty';
    case 'explorer': return 'Explorer';
    case 'special': return 'Special';
    default: return category;
  }
}

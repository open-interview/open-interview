/**
 * Achievement Definitions
 * All achievements, badges, challenges, and milestones
 */

import { Achievement } from './types';

// ============================================
// STREAK ACHIEVEMENTS
// ============================================

const STREAK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak-3',
    type: 'badge',
    name: 'Getting Started',
    description: 'Study for 3 consecutive days',
    category: 'streak',
    tier: 'bronze',
    icon: 'flame',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800',
    requirements: [{ type: 'streak', metric: 'current_streak', target: 3 }],
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'credits', amount: 50 }
    ]
  },
  {
    id: 'streak-7',
    type: 'badge',
    name: 'Week Warrior',
    description: 'Study for 7 consecutive days',
    category: 'streak',
    tier: 'silver',
    icon: 'flame',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'streak', metric: 'current_streak', target: 7 }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 100 },
      { type: 'streak-bonus', amount: 1, multiplier: 1.1 }
    ]
  },
  {
    id: 'streak-14',
    type: 'badge',
    name: 'Fortnight Fighter',
    description: 'Study for 14 consecutive days',
    category: 'streak',
    tier: 'gold',
    icon: 'flame',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'streak', metric: 'current_streak', target: 14 }],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'credits', amount: 200 },
      { type: 'streak-bonus', amount: 1, multiplier: 1.2 }
    ]
  },
  {
    id: 'streak-30',
    type: 'badge',
    name: 'Monthly Master',
    description: 'Study for 30 consecutive days',
    category: 'streak',
    tier: 'platinum',
    icon: 'flame',
    color: '#e5e4e2',
    gradient: 'from-slate-200 to-slate-400',
    requirements: [{ type: 'streak', metric: 'current_streak', target: 30 }],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'credits', amount: 500 },
      { type: 'streak-bonus', amount: 1, multiplier: 1.5 },
      { type: 'title', amount: 1, item: 'Dedicated' }
    ]
  },
  {
    id: 'streak-100',
    type: 'badge',
    name: 'Century Legend',
    description: 'Study for 100 consecutive days',
    category: 'streak',
    tier: 'diamond',
    icon: 'crown',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500',
    requirements: [{ type: 'streak', metric: 'current_streak', target: 100 }],
    rewards: [
      { type: 'xp', amount: 2000 },
      { type: 'credits', amount: 2000 },
      { type: 'streak-bonus', amount: 1, multiplier: 2.0 },
      { type: 'title', amount: 1, item: 'Unstoppable' }
    ]
  },
];

// ============================================
// COMPLETION ACHIEVEMENTS
// ============================================

const COMPLETION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'complete-10',
    type: 'milestone',
    name: 'First Steps',
    description: 'Complete 10 questions',
    category: 'completion',
    tier: 'bronze',
    icon: 'check-circle',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800',
    requirements: [{ type: 'count', metric: 'total_completed', target: 10 }],
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'credits', amount: 50 }
    ]
  },
  {
    id: 'complete-50',
    type: 'milestone',
    name: 'Warming Up',
    description: 'Complete 50 questions',
    category: 'completion',
    tier: 'silver',
    icon: 'check-circle',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'count', metric: 'total_completed', target: 50 }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 100 }
    ]
  },
  {
    id: 'complete-100',
    type: 'milestone',
    name: 'Century Club',
    description: 'Complete 100 questions',
    category: 'completion',
    tier: 'gold',
    icon: 'award',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'total_completed', target: 100 }],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'credits', amount: 200 },
      { type: 'title', amount: 1, item: 'Committed' }
    ]
  },
  {
    id: 'complete-250',
    type: 'milestone',
    name: 'Knowledge Seeker',
    description: 'Complete 250 questions',
    category: 'completion',
    tier: 'platinum',
    icon: 'award',
    color: '#e5e4e2',
    gradient: 'from-slate-200 to-slate-400',
    requirements: [{ type: 'count', metric: 'total_completed', target: 250 }],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'credits', amount: 500 },
      { type: 'title', amount: 1, item: 'Scholar' }
    ]
  },
  {
    id: 'complete-500',
    type: 'milestone',
    name: 'Interview Ready',
    description: 'Complete 500 questions',
    category: 'completion',
    tier: 'diamond',
    icon: 'trophy',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500',
    requirements: [{ type: 'count', metric: 'total_completed', target: 500 }],
    rewards: [
      { type: 'xp', amount: 1000 },
      { type: 'credits', amount: 1000 },
      { type: 'title', amount: 1, item: 'Interview Ready' }
    ]
  },
  {
    id: 'complete-1000',
    type: 'milestone',
    name: 'The Thousand',
    description: 'Complete 1000 questions',
    category: 'completion',
    tier: 'diamond',
    icon: 'crown',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500',
    requirements: [{ type: 'count', metric: 'total_completed', target: 1000 }],
    rewards: [
      { type: 'xp', amount: 5000 },
      { type: 'credits', amount: 5000 },
      { type: 'title', amount: 1, item: 'Master' }
    ]
  },
];

// ============================================
// MASTERY ACHIEVEMENTS (Difficulty-based)
// ============================================

const MASTERY_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'beginner-25',
    type: 'badge',
    name: 'Foundation Builder',
    description: 'Complete 25 beginner questions',
    category: 'mastery',
    tier: 'bronze',
    icon: 'book-open',
    color: '#22c55e',
    gradient: 'from-green-400 to-green-600',
    requirements: [{ type: 'count', metric: 'beginner_completed', target: 25 }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 100 }
    ]
  },
  {
    id: 'intermediate-25',
    type: 'badge',
    name: 'Rising Star',
    description: 'Complete 25 intermediate questions',
    category: 'mastery',
    tier: 'silver',
    icon: 'trending-up',
    color: '#eab308',
    gradient: 'from-yellow-400 to-yellow-600',
    requirements: [{ type: 'count', metric: 'intermediate_completed', target: 25 }],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'credits', amount: 150 }
    ]
  },
  {
    id: 'advanced-25',
    type: 'badge',
    name: 'Challenge Accepted',
    description: 'Complete 25 advanced questions',
    category: 'mastery',
    tier: 'gold',
    icon: 'zap',
    color: '#ef4444',
    gradient: 'from-red-400 to-red-600',
    requirements: [{ type: 'count', metric: 'advanced_completed', target: 25 }],
    rewards: [
      { type: 'xp', amount: 300 },
      { type: 'credits', amount: 200 },
      { type: 'title', amount: 1, item: 'Challenger' }
    ]
  },
  {
    id: 'advanced-100',
    type: 'badge',
    name: 'Elite Performer',
    description: 'Complete 100 advanced questions',
    category: 'mastery',
    tier: 'diamond',
    icon: 'star',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500',
    requirements: [{ type: 'count', metric: 'advanced_completed', target: 100 }],
    rewards: [
      { type: 'xp', amount: 1000 },
      { type: 'credits', amount: 1000 },
      { type: 'title', amount: 1, item: 'Elite' }
    ]
  },
];

// ============================================
// EXPLORER ACHIEVEMENTS (Channel-based)
// ============================================

const EXPLORER_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'explorer-3',
    type: 'badge',
    name: 'Curious Mind',
    description: 'Complete questions in 3 different channels',
    category: 'explorer',
    tier: 'bronze',
    icon: 'compass',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800',
    requirements: [{ type: 'count', metric: 'channels_explored', target: 3 }],
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'credits', amount: 50 }
    ]
  },
  {
    id: 'explorer-5',
    type: 'badge',
    name: 'Versatile Learner',
    description: 'Complete questions in 5 different channels',
    category: 'explorer',
    tier: 'silver',
    icon: 'compass',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'count', metric: 'channels_explored', target: 5 }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 100 }
    ]
  },
  {
    id: 'explorer-10',
    type: 'badge',
    name: 'Renaissance Dev',
    description: 'Complete questions in 10 different channels',
    category: 'explorer',
    tier: 'gold',
    icon: 'globe',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'channels_explored', target: 10 }],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'credits', amount: 200 },
      { type: 'title', amount: 1, item: 'Polymath' }
    ]
  },
  {
    id: 'channel-master',
    type: 'badge',
    name: 'Channel Master',
    description: 'Complete 100% of any channel',
    category: 'explorer',
    tier: 'platinum',
    icon: 'medal',
    color: '#e5e4e2',
    gradient: 'from-slate-200 to-slate-400',
    requirements: [{ type: 'percentage', metric: 'channel_completion', target: 100 }],
    rewards: [
      { type: 'xp', amount: 300 },
      { type: 'credits', amount: 300 },
      { type: 'title', amount: 1, item: 'Completionist' }
    ]
  },
];

// ============================================
// SPECIAL ACHIEVEMENTS
// ============================================

const SPECIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'early-bird',
    type: 'special',
    name: 'Early Bird',
    description: 'Study before 7 AM',
    category: 'special',
    tier: 'bronze',
    icon: 'sunrise',
    color: '#f97316',
    gradient: 'from-orange-400 to-orange-600',
    requirements: [{ type: 'time', metric: 'study_hour', target: 7, operator: 'lte' }],
    rewards: [
      { type: 'xp', amount: 25 },
      { type: 'credits', amount: 25 },
      { type: 'title', amount: 1, item: 'Early Bird' }
    ],
    isRepeatable: true,
    cooldown: 24
  },
  {
    id: 'night-owl',
    type: 'special',
    name: 'Night Owl',
    description: 'Study after 11 PM',
    category: 'special',
    tier: 'bronze',
    icon: 'moon',
    color: '#6366f1',
    gradient: 'from-indigo-400 to-indigo-600',
    requirements: [{ type: 'time', metric: 'study_hour', target: 23, operator: 'gte' }],
    rewards: [
      { type: 'xp', amount: 25 },
      { type: 'credits', amount: 25 },
      { type: 'title', amount: 1, item: 'Night Owl' }
    ],
    isRepeatable: true,
    cooldown: 24
  },
  {
    id: 'weekend-warrior',
    type: 'badge',
    name: 'Weekend Warrior',
    description: 'Study on 4 consecutive weekends',
    category: 'special',
    tier: 'silver',
    icon: 'calendar',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'streak', metric: 'weekend_streak', target: 4 }],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'credits', amount: 200 },
      { type: 'title', amount: 1, item: 'Weekend Warrior' }
    ]
  },
  {
    id: 'speed-demon',
    type: 'badge',
    name: 'Speed Demon',
    description: 'Complete 10 questions in a single session',
    category: 'special',
    tier: 'gold',
    icon: 'rocket',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'session_questions', target: 10 }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 100 },
      { type: 'title', amount: 1, item: 'Speed Demon' }
    ],
    isRepeatable: true,
    cooldown: 24
  },
  {
    id: 'perfectionist',
    type: 'badge',
    name: 'Perfectionist',
    description: 'Get 10 quiz questions correct in a row',
    category: 'special',
    tier: 'gold',
    icon: 'target',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'quiz_correct_streak', target: 10 }],
    rewards: [
      { type: 'xp', amount: 150 },
      { type: 'credits', amount: 150 },
      { type: 'title', amount: 1, item: 'Perfectionist' }
    ]
  },
  {
    id: 'comeback-kid',
    type: 'special',
    name: 'Comeback Kid',
    description: 'Return after 30 days away',
    category: 'special',
    tier: 'silver',
    icon: 'rotate-ccw',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'count', metric: 'days_since_last_visit', target: 30, operator: 'gte' }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 200 },
      { type: 'title', amount: 1, item: 'Comeback Kid' }
    ],
    isHidden: true
  },
];

// ============================================
// DAILY CHALLENGES
// ============================================

const DAILY_CHALLENGES: Achievement[] = [
  {
    id: 'daily-dozen',
    type: 'challenge',
    name: 'Daily Dozen',
    description: 'Complete 12 questions today',
    category: 'daily',
    tier: 'bronze',
    icon: 'target',
    color: '#3b82f6',
    gradient: 'from-blue-400 to-blue-600',
    requirements: [{ type: 'count', metric: 'questions_today', target: 12 }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 50 }
    ],
    isRepeatable: true,
    cooldown: 24
  },
  {
    id: 'daily-quiz-master',
    type: 'challenge',
    name: 'Quiz Master',
    description: 'Get 5 quiz questions correct today',
    category: 'daily',
    tier: 'bronze',
    icon: 'brain',
    color: '#3b82f6',
    gradient: 'from-blue-400 to-blue-600',
    requirements: [{ type: 'count', metric: 'quiz_correct_today', target: 5 }],
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'credits', amount: 30 }
    ],
    isRepeatable: true,
    cooldown: 24
  },
];

// ============================================
// WEEKLY CHALLENGES
// ============================================

const WEEKLY_CHALLENGES: Achievement[] = [
  {
    id: 'weekly-warrior',
    type: 'challenge',
    name: 'Weekly Warrior',
    description: 'Complete 50 questions this week',
    category: 'weekly',
    tier: 'silver',
    icon: 'trophy',
    color: '#8b5cf6',
    gradient: 'from-purple-400 to-purple-600',
    requirements: [{ type: 'count', metric: 'questions_this_week', target: 50 }],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'credits', amount: 200 }
    ],
    isRepeatable: true,
    cooldown: 168  // 7 days in hours
  },
  {
    id: 'weekly-diverse',
    type: 'challenge',
    name: 'Diverse Learner',
    description: 'Study 5 different channels this week',
    category: 'weekly',
    tier: 'silver',
    icon: 'compass',
    color: '#8b5cf6',
    gradient: 'from-purple-400 to-purple-600',
    requirements: [{ type: 'count', metric: 'channels_this_week', target: 5 }],
    rewards: [
      { type: 'xp', amount: 300 },
      { type: 'credits', amount: 150 }
    ],
    isRepeatable: true,
    cooldown: 168
  },
  {
    id: 'weekly-voice',
    type: 'challenge',
    name: 'Voice Champion',
    description: 'Complete 3 voice interviews this week',
    category: 'weekly',
    tier: 'gold',
    icon: 'mic',
    color: '#8b5cf6',
    gradient: 'from-purple-400 to-purple-600',
    requirements: [{ type: 'count', metric: 'voice_interviews_this_week', target: 3 }],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'credits', amount: 300 }
    ],
    isRepeatable: true,
    cooldown: 168
  },
];

// ============================================
// VOICE INTERVIEW ACHIEVEMENTS
// ============================================

const VOICE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'voice-first',
    type: 'badge',
    name: 'First Interview',
    description: 'Complete your first voice interview',
    category: 'special',
    tier: 'bronze',
    icon: 'mic',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800',
    requirements: [{ type: 'count', metric: 'voice_interviews', target: 1 }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 100 }
    ]
  },
  {
    id: 'voice-5',
    type: 'badge',
    name: 'Interview Practice',
    description: 'Complete 5 voice interviews',
    category: 'special',
    tier: 'silver',
    icon: 'mic',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'count', metric: 'voice_interviews', target: 5 }],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'credits', amount: 200 }
    ]
  },
  {
    id: 'voice-10',
    type: 'badge',
    name: 'Interview Pro',
    description: 'Complete 10 voice interviews',
    category: 'special',
    tier: 'gold',
    icon: 'mic',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'voice_interviews', target: 10 }],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'credits', amount: 500 },
      { type: 'title', amount: 1, item: 'Interview Pro' }
    ]
  },
  {
    id: 'voice-success-3',
    type: 'badge',
    name: 'Hired!',
    description: 'Get 3 successful voice interview results',
    category: 'special',
    tier: 'gold',
    icon: 'check-circle',
    color: '#22c55e',
    gradient: 'from-green-400 to-green-600',
    requirements: [{ type: 'count', metric: 'voice_successes', target: 3 }],
    rewards: [
      { type: 'xp', amount: 300 },
      { type: 'credits', amount: 300 },
      { type: 'title', amount: 1, item: 'Hired' }
    ]
  },
  {
    id: 'voice-success-10',
    type: 'badge',
    name: 'Interview Master',
    description: 'Get 10 successful voice interview results',
    category: 'special',
    tier: 'diamond',
    icon: 'star',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500',
    requirements: [{ type: 'count', metric: 'voice_successes', target: 10 }],
    rewards: [
      { type: 'xp', amount: 1000 },
      { type: 'credits', amount: 1000 },
      { type: 'title', amount: 1, item: 'Interview Master' }
    ]
  },
];

// ============================================
// CERTIFICATION ACHIEVEMENTS
// ============================================

const CERTIFICATION_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'cert-first',
    type: 'milestone',
    name: 'First Certification',
    description: 'Pass your first certification exam',
    category: 'completion',
    tier: 'gold',
    icon: 'award',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'certifications_passed', target: 1 }],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'credits', amount: 500 },
      { type: 'title', amount: 1, item: 'Certified' }
    ]
  },
  {
    id: 'cert-3',
    type: 'milestone',
    name: 'Triple Certified',
    description: 'Pass 3 certification exams',
    category: 'completion',
    tier: 'platinum',
    icon: 'award',
    color: '#e5e4e2',
    gradient: 'from-slate-200 to-slate-400',
    requirements: [{ type: 'count', metric: 'certifications_passed', target: 3 }],
    rewards: [
      { type: 'xp', amount: 1500 },
      { type: 'credits', amount: 1500 },
      { type: 'title', amount: 1, item: 'Multi-Certified' }
    ]
  },
  {
    id: 'cert-5',
    type: 'milestone',
    name: 'Certification Expert',
    description: 'Pass 5 certification exams',
    category: 'completion',
    tier: 'diamond',
    icon: 'crown',
    color: '#b9f2ff',
    gradient: 'from-cyan-300 to-blue-500',
    requirements: [{ type: 'count', metric: 'certifications_passed', target: 5 }],
    rewards: [
      { type: 'xp', amount: 3000 },
      { type: 'credits', amount: 3000 },
      { type: 'title', amount: 1, item: 'Certification Expert' }
    ]
  },
];

// ============================================
// CODING CHALLENGE ACHIEVEMENTS
// ============================================

const CODING_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'code-first',
    type: 'badge',
    name: 'First Code',
    description: 'Complete your first coding challenge',
    category: 'mastery',
    tier: 'bronze',
    icon: 'code',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800',
    requirements: [{ type: 'count', metric: 'coding_challenges_completed', target: 1 }],
    rewards: [
      { type: 'xp', amount: 100 },
      { type: 'credits', amount: 100 }
    ]
  },
  {
    id: 'code-10',
    type: 'badge',
    name: 'Code Warrior',
    description: 'Complete 10 coding challenges',
    category: 'mastery',
    tier: 'silver',
    icon: 'code',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'count', metric: 'coding_challenges_completed', target: 10 }],
    rewards: [
      { type: 'xp', amount: 300 },
      { type: 'credits', amount: 300 }
    ]
  },
  {
    id: 'code-25',
    type: 'badge',
    name: 'Code Master',
    description: 'Complete 25 coding challenges',
    category: 'mastery',
    tier: 'gold',
    icon: 'code',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'coding_challenges_completed', target: 25 }],
    rewards: [
      { type: 'xp', amount: 750 },
      { type: 'credits', amount: 750 },
      { type: 'title', amount: 1, item: 'Code Master' }
    ]
  },
  {
    id: 'code-pass-10',
    type: 'badge',
    name: 'All Tests Pass',
    description: 'Pass 10 coding challenges with all tests',
    category: 'mastery',
    tier: 'gold',
    icon: 'check-circle',
    color: '#22c55e',
    gradient: 'from-green-400 to-green-600',
    requirements: [{ type: 'count', metric: 'coding_challenges_passed', target: 10 }],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'credits', amount: 500 },
      { type: 'title', amount: 1, item: 'Bug Free' }
    ]
  },
];

// ============================================
// TRAINING ACHIEVEMENTS
// ============================================

const TRAINING_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'training-first',
    type: 'badge',
    name: 'Training Started',
    description: 'Complete your first training session',
    category: 'completion',
    tier: 'bronze',
    icon: 'dumbbell',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800',
    requirements: [{ type: 'count', metric: 'training_sessions', target: 1 }],
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'credits', amount: 50 }
    ]
  },
  {
    id: 'training-10',
    type: 'badge',
    name: 'Training Regular',
    description: 'Complete 10 training sessions',
    category: 'completion',
    tier: 'silver',
    icon: 'dumbbell',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'count', metric: 'training_sessions', target: 10 }],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'credits', amount: 200 }
    ]
  },
  {
    id: 'training-25',
    type: 'badge',
    name: 'Training Pro',
    description: 'Complete 25 training sessions',
    category: 'completion',
    tier: 'gold',
    icon: 'dumbbell',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'training_sessions', target: 25 }],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'credits', amount: 500 },
      { type: 'title', amount: 1, item: 'Training Pro' }
    ]
  },
];

// ============================================
// SRS REVIEW ACHIEVEMENTS
// ============================================

const SRS_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'srs-first',
    type: 'badge',
    name: 'Memory Training',
    description: 'Complete your first SRS review session',
    category: 'completion',
    tier: 'bronze',
    icon: 'brain',
    color: '#cd7f32',
    gradient: 'from-amber-600 to-amber-800',
    requirements: [{ type: 'count', metric: 'srs_reviews', target: 1 }],
    rewards: [
      { type: 'xp', amount: 25 },
      { type: 'credits', amount: 25 }
    ]
  },
  {
    id: 'srs-50',
    type: 'badge',
    name: 'Memory Builder',
    description: 'Complete 50 SRS reviews',
    category: 'completion',
    tier: 'silver',
    icon: 'brain',
    color: '#c0c0c0',
    gradient: 'from-slate-300 to-slate-500',
    requirements: [{ type: 'count', metric: 'srs_reviews', target: 50 }],
    rewards: [
      { type: 'xp', amount: 150 },
      { type: 'credits', amount: 150 }
    ]
  },
  {
    id: 'srs-200',
    type: 'badge',
    name: 'Memory Master',
    description: 'Complete 200 SRS reviews',
    category: 'completion',
    tier: 'gold',
    icon: 'brain',
    color: '#ffd700',
    gradient: 'from-yellow-400 to-amber-600',
    requirements: [{ type: 'count', metric: 'srs_reviews', target: 200 }],
    rewards: [
      { type: 'xp', amount: 400 },
      { type: 'credits', amount: 400 },
      { type: 'title', amount: 1, item: 'Memory Master' }
    ]
  },
];

// ============================================
// EXPORT ALL ACHIEVEMENTS
// ============================================

export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...STREAK_ACHIEVEMENTS,
  ...COMPLETION_ACHIEVEMENTS,
  ...MASTERY_ACHIEVEMENTS,
  ...EXPLORER_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
  ...DAILY_CHALLENGES,
  ...WEEKLY_CHALLENGES,
  ...VOICE_ACHIEVEMENTS,
  ...CERTIFICATION_ACHIEVEMENTS,
  ...CODING_ACHIEVEMENTS,
  ...TRAINING_ACHIEVEMENTS,
  ...SRS_ACHIEVEMENTS,
];

// Helper functions
export function getAchievementById(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: string): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementsByType(type: string): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.type === type);
}

export function getAchievementsByTier(tier: string): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.tier === tier);
}

export function getDailyChallenges(): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === 'daily');
}

export function getWeeklyChallenges(): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(a => a.category === 'weekly');
}

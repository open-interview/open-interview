/**
 * Google-Style Analytics Dashboard
 * Clean metric cards, charts, and progress visualization
 */

import '../styles/google-stats.css';

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { useGlobalStats } from '../hooks/use-progress';
import { useAchievements } from '../hooks/use-achievements';
import { useLevel } from '../hooks/use-level';
import { channels, getQuestions, getAllQuestions, getQuestionDifficulty } from '../lib/data';
import { SEOHead } from '../components/SEOHead';
import { GitHubAnalytics } from '../components/GitHubAnalytics';
import { AchievementGrid, LevelDisplay } from '../components/unified';
import {
  Trophy, Flame, Zap, Target, Activity, TrendingUp,
  ChevronRight, BarChart2, Calendar, TrendingDown, Minus
} from 'lucide-react';

/* ===================== SVG Components ===================== */

function FloatingDots({ count = 20 }: { count?: number }) {
  const dots = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      cx: Math.random() * 100,
      cy: Math.random() * 100,
      r: 1 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.25,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      color: ['var(--color-primary)', 'var(--color-red-500)', 'var(--color-yellow-500)', 'var(--color-green-500)'][Math.floor(Math.random() * 4)]
    }));
  }, [count]);

  return (
    <svg className="floating-dots-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <style>{`
          @keyframes floatDot {
            0%, 100% { transform: translate(0, 0); }
            25% { transform: translate(2px, -4px); }
            50% { transform: translate(-2px, -8px); }
            75% { transform: translate(3px, -4px); }
          }
        `}</style>
      </defs>
      {dots.map(dot => (
        <circle
          key={dot.id}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill={dot.color}
          opacity={dot.opacity}
          style={{
            animation: `floatDot ${dot.duration}s ease-in-out ${dot.delay}s infinite`
          }}
        />
      ))}
    </svg>
  );
}

function FireIconWithGlow({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-label="Fire streak icon"
    >
      <defs>
        <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <radialGradient id="fireGradient" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="50%" stopColor="#f7931e" />
          <stop offset="100%" stopColor="#ff4444" />
        </radialGradient>
        <animate
          attributeName="opacity"
          values="0.8;1;0.8"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </defs>
      <g filter="url(#fireGlow)">
        <path
          d="M12 2C12 2 6 8 6 12C6 15.3 8.7 18 12 18C15.3 18 18 15.3 18 12C18 8 12 2 12 2Z"
          fill="url(#fireGradient)"
          opacity="0.9"
        >
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1;1.05;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M12 8C12 8 9 11 9 13C9 14.7 10.3 16 12 16C13.7 16 15 14.7 15 13C15 11 12 8 12 8Z"
          fill="#ffdd57"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}

function SVGProgressBarRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color = '#4285f4',
  gradientId = 'progressGradient',
  showGradient = true
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  gradientId?: string;
  showGradient?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="google-ring-svg">
      <defs>
        {showGradient && (
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        )}
        <filter id={`ringShadow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color} floodOpacity="0.3" />
        </filter>
      </defs>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-surface-2, #e8eaed)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={showGradient ? `url(#${gradientId})` : color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        transform={`rotate(-90 ${center} ${center})`}
        filter={`url(#ringShadow-${gradientId})`}
      />
    </svg>
  );
}

function SVGProgressBarRingCard({ label, completed, total, color }: {
  label: string;
  completed: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const gradientId = `gradient-${label.toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="google-ring-card"
    >
      <div className="google-ring">
        <SVGProgressBarRing progress={pct} color={color} gradientId={gradientId} />
        <div className="google-ring-value" style={{ color }}>
          {pct}%
        </div>
      </div>
      <div className="google-ring-label">{label}</div>
      <div className="google-ring-stats">{completed}/{total}</div>
    </motion.div>
  );
}

function SVGBarChart({ data, height = 120 }: { data: number[]; height?: number }) {
  const maxVal = Math.max(...data, 1);
  const barWidth = 100 / data.length;
  const googleColors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#ff6d01', '#46bdc6', '#7b61ff'];

  return (
    <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="svg-bar-chart">
      <defs>
        <style>{`
          @keyframes barGrow {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
          }
          .svg-bar {
            transform-origin: bottom;
            animation: barGrow 0.4s ease-out forwards;
          }
          .svg-bar:hover {
            filter: brightness(1.2);
          }
        `}</style>
        {googleColors.map((color, i) => (
          <linearGradient key={i} id={`barGrad-${i}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        ))}
      </defs>
      {data.map((val, i) => {
        const barHeight = (val / maxVal) * (height - 20);
        const x = i * barWidth;
        const y = height - barHeight - 10;
        return (
          <g key={i} className="svg-bar-group">
            <motion.rect
              x={`${x + 0.5}%`}
              y={y}
              width={`${barWidth - 1}%`}
              height={barHeight}
              fill={`url(#barGrad-${i % googleColors.length})`}
              rx="2"
              initial={{ height: 0, y: height - 10 }}
              animate={{ height: barHeight, y }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="svg-bar"
            />
            {val > 0 && (
              <text
                x={`${x + barWidth / 2}%`}
                y={y - 4}
                textAnchor="middle"
                fontSize="8"
                fill="var(--color-text-secondary, #5f6368)"
                className="svg-bar-label"
              >
                {val}
              </text>
            )}
          </g>
        );
      })}
      <line x1="0" y1={height - 10} x2="100%" y2={height - 10} stroke="var(--color-surface-2, #e8eaed)" strokeWidth="1" />
    </svg>
  );
}

function SVGLineChart({ data, width = 100, height = 80 }: { data: number[]; width?: number; height?: number }) {
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="svg-line-chart">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4285f4" />
          <stop offset="50%" stopColor="#ea4335" />
          <stop offset="100%" stopColor="#34a853" />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4285f4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4285f4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`M${points.split(' ').map((p, i) => {
          const [x, y] = p.split(',');
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ')}`}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <motion.path
        d={`M${points.split(' ').map((p, i) => {
          const [x, y] = p.split(',');
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ')} L${width},${height} L0,${height} Z`}
        fill="url(#areaGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      {points.split(' ').map((p, i) => {
        const [x, y] = p.split(',');
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#4285f4"
            stroke="white"
            strokeWidth="1.5"
            initial={{ r: 0 }}
            animate={{ r: 3 }}
            transition={{ delay: i * 0.05 + 0.5, duration: 0.2 }}
          />
        );
      })}
    </svg>
  );
}

function SVGHeatmap({ data, days, cellSize = 14, gap = 3 }: { data: any[]; days: number; cellSize?: number; gap?: number }) {
  const weeks = Math.ceil(days / 7);
  const googleColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

  const getColor = (count: number) => {
    if (count === 0) return googleColors[0];
    if (count === 1) return googleColors[1];
    if (count <= 3) return googleColors[2];
    if (count <= 5) return googleColors[3];
    return googleColors[4];
  };

  const svgWidth = weeks * (cellSize + gap) - gap;
  const svgHeight = 7 * (cellSize + gap) - gap;

  return (
    <svg width="100%" height={svgHeight + 20} viewBox={`0 0 ${svgWidth} ${svgHeight + 20}`} className="svg-heatmap">
      <defs>
        <style>{`
          @keyframes cellPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .heatmap-cell:hover rect {
            stroke: #333;
            stroke-width: 1;
          }
        `}</style>
      </defs>
      {data.map((day, i) => {
        const week = Math.floor(i / 7);
        const dow = i % 7;
        const x = week * (cellSize + gap);
        const y = dow * (cellSize + gap);
        const color = day ? getColor(day.count) : googleColors[0];
        const hasActivity = day && day.count > 0;

        return (
          <g key={i} className="heatmap-cell" title={day ? `${day.date}: ${day.count} questions` : ''}>
            <motion.rect
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx="2"
              ry="2"
              fill={color}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.003, duration: 0.2 }}
            />
            {hasActivity && (
              <motion.rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx="2"
                ry="2"
                fill={color}
                opacity="0.6"
                animate={{ opacity: [0.6, 0.3, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
              />
            )}
          </g>
        );
      })}
      <div className="svg-heatmap-day-labels">
        {['S', '', 'T', '', 'T', '', 'S'].map((d, i) => (
          <text key={i} x="-5" y={i * (cellSize + gap) + cellSize - 2} textAnchor="end" fontSize="9" fill="#666">
            {d}
          </text>
        ))}
      </div>
    </svg>
  );
}

function AchievementBadgeSVG({ name, isUnlocked, progress = 100, icon = '🏆' }: {
  name: string;
  isUnlocked: boolean;
  progress?: number;
  icon?: string;
}) {
  const badgeSize = 60;
  const center = badgeSize / 2;

  return (
    <svg width={badgeSize} height={badgeSize} viewBox={`0 0 ${badgeSize} ${badgeSize}`} className="achievement-badge-svg">
      <defs>
        <radialGradient id={`badgeGrad-${name}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={isUnlocked ? '#FFD700' : '#d1d5db'} />
          <stop offset="100%" stopColor={isUnlocked ? '#FFA500' : '#9ca3af'} />
        </radialGradient>
        <filter id={`badgeGlow-${name}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          {isUnlocked && <feComposite in="SourceGraphic" in2="blur" operator="over" />}
        </filter>
        <clipPath id={`badgeClip-${name}`}>
          <circle cx={center} cy={center} r={center - 4} />
        </clipPath>
        {isUnlocked && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${center} ${center}`}
            to={`360 ${center} ${center}`}
            dur="10s"
            repeatCount="indefinite"
          />
        )}
      </defs>
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        filter={isUnlocked ? `url(#badgeGlow-${name})` : undefined}
      >
        <circle cx={center} cy={center} r={center - 4} fill={`url(#badgeGrad-${name})`} />
        {isUnlocked && (
          <circle cx={center} cy={center} r={center - 6} fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
        )}
        <text x={center} y={center + 2} textAnchor="middle" dominantBaseline="central" fontSize="24">
          {icon}
        </text>
        {!isUnlocked && progress < 100 && (
          <circle
            cx={center}
            cy={center}
            r={center - 4}
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeDasharray={`${progress} ${100 - progress}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            opacity="0.6"
          />
        )}
        {isUnlocked && (
          <>
            <circle cx={center} cy="8" r="3" fill="#FFD700" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={badgeSize - 8} cy={center + 5} r="2" fill="#FFD700" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </motion.g>
    </svg>
  );
}

export default function GoogleStats() {
  const [, setLocation] = useLocation();
  const { stats } = useGlobalStats();
  const { progress: achievementProgress, nextUp } = useAchievements();
  const level = useLevel();
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365'>('90');

  const days = parseInt(timeRange);

  const {
    totalCompleted,
    totalQuestions,
    overallPct,
    streak,
    totalSessions,
    globalDifficulty,
    moduleProgress,
    activityData,
    sessionHistory,
    prevPeriodCount
  } = useMemo(() => {
    const allQuestions = getAllQuestions();
    const allCompletedIds = new Set<string>();
    const channelsWithProgress: string[] = [];
    const channelCompletionPcts: number[] = [];

    const globalDiff = {
      beginner: { total: 0, done: 0 },
      intermediate: { total: 0, done: 0 },
      advanced: { total: 0, done: 0 }
    };

    const modProgress = channels.map(ch => {
      const questions = getQuestions(ch.id);
      const stored = localStorage.getItem(`progress-${ch.id}`);
      const completedIds = stored ? new Set(JSON.parse(stored)) : new Set();

      Array.from(completedIds).forEach((id) => allCompletedIds.add(id as string));
      if (completedIds.size > 0) channelsWithProgress.push(ch.id);

      const difficulty = {
        beginner: { total: 0, done: 0 },
        intermediate: { total: 0, done: 0 },
        advanced: { total: 0, done: 0 }
      };

      questions.forEach(q => {
        const d = getQuestionDifficulty(q);
        difficulty[d].total++;
        globalDiff[d].total++;
        if (completedIds.has(q.id)) {
          difficulty[d].done++;
          globalDiff[d].done++;
        }
      });

      const validCompleted = Math.min(completedIds.size, questions.length);
      const pct = questions.length > 0 ? Math.min(100, Math.round((validCompleted / questions.length) * 100)) : 0;
      if (questions.length > 0) channelCompletionPcts.push(pct);

      return {
        id: ch.id,
        name: ch.name,
        completed: validCompleted,
        total: questions.length,
        pct,
        difficulty
      };
    }).filter(m => m.total > 0).sort((a, b) => b.pct - a.pct);

    let currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) currentStreak++;
      else break;
    }

    const actData: { date: string; count: number; week: number; dayOfWeek: number }[] = [];
    const today = new Date();
    let currentPeriodCount = 0;
    let prevPeriodCount = 0;
    const halfDays = Math.floor(days / 2);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const activity = stats.find(s => s.date === dateStr);
      const count = activity?.count || 0;
      if (i < halfDays) currentPeriodCount += count;
      else prevPeriodCount += count;
      actData.push({
        date: dateStr,
        count,
        week: Math.floor((days - 1 - i) / 7),
        dayOfWeek: date.getDay()
      });
    }

    const sessionHist: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const activity = stats.find(s => s.date === dateStr);
      sessionHist.push(activity?.count || 0);
    }

    const validTotalCompleted = Math.min(allCompletedIds.size, allQuestions.length);
    return {
      totalCompleted: validTotalCompleted,
      totalQuestions: allQuestions.length,
      overallPct: allQuestions.length > 0 ? Math.min(100, Math.round((validTotalCompleted / allQuestions.length) * 100)) : 0,
      streak: currentStreak,
      totalSessions: stats.reduce((a, c) => a + c.count, 0),
      globalDifficulty: globalDiff,
      moduleProgress: modProgress,
      activityData: actData,
      sessionHistory: sessionHist,
      prevPeriodCount: currentPeriodCount - prevPeriodCount
    };
  }, [stats, days]);

  const changePercent = prevPeriodCount !== 0
    ? Math.round(((activityData.slice(0, Math.floor(days / 2)).reduce((a, d) => a + d.count, 0) - prevPeriodCount) / prevPeriodCount) * 100)
    : activityData.slice(0, Math.floor(days / 2)).reduce((a, d) => a + d.count, 0) > 0 ? 100 : 0;

  return (
    <>
      <SEOHead
        title="Track Your Interview Prep Progress - Stats & Analytics | Code Reels"
        description="Monitor your technical interview preparation progress with detailed analytics."
        canonical="https://open-interview.github.io/stats"
      />

      <AppLayout title="Statistics">
        <div className="google-stats">
          <FloatingDots count={30} />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LevelDisplay
              {...level.levelProgress}
              currentStreak={level.currentStreak}
              streakMultiplier={level.streakMultiplier}
              variant="card"
            />
          </motion.div>

          <div className="google-metric-grid">
            <GoogleMetricCard
              label="Progress"
              value={overallPct}
              unit="%"
              subtext={`${totalCompleted} of ${totalQuestions} questions`}
              trend={overallPct > 50 ? 'up' : overallPct > 25 ? 'neutral' : 'down'}
              color="primary"
            />
            <GoogleMetricCard
              label="Current Streak"
              value={streak}
              unit=""
              subtext={
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FireIconWithGlow size={14} /> days
                </span>
              }
              trend={streak > 0 ? 'up' : 'neutral'}
              color="orange"
            />
            <GoogleMetricCard
              label="Total Sessions"
              value={totalSessions}
              unit=""
              subtext="completed"
              trend={totalSessions > 10 ? 'up' : 'neutral'}
              color="blue"
            />
            <GoogleMetricCard
              label={`${timeRange}d Activity`}
              value={activityData.reduce((a, d) => a + d.count, 0)}
              unit=""
              subtext="questions solved"
              trend={changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral'}
              color="purple"
              change={changePercent}
            />
          </div>

          <div className="google-chart-section">
            <div className="google-chart-card">
              <div className="google-chart-header">
                <h3>Activity Trend</h3>
                <span>Last 14 days</span>
              </div>
              <SVGBarChart data={sessionHistory} height={140} />
              <div style={{ marginTop: '12px' }}>
                <SVGLineChart data={sessionHistory} width={100} height={80} />
              </div>
            </div>
          </div>

          <div className="google-progress-section">
            <div className="google-progress-grid">
              <SVGProgressBarRingCard
                label="Beginner"
                completed={globalDifficulty.beginner.done}
                total={globalDifficulty.beginner.total}
                color="#34A853"
              />
              <SVGProgressBarRingCard
                label="Intermediate"
                completed={globalDifficulty.intermediate.done}
                total={globalDifficulty.intermediate.total}
                color="#FBBC05"
              />
              <SVGProgressBarRingCard
                label="Advanced"
                completed={globalDifficulty.advanced.done}
                total={globalDifficulty.advanced.total}
                color="#EA4335"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="google-badges-card"
          >
            <div className="google-card-header">
              <h3>
                <Trophy className="icon-primary" />
                Achievements
              </h3>
              <button onClick={() => setLocation('/badges')} className="google-view-all">
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="google-achievement-svg-grid">
              {achievementProgress.filter(a => a.isUnlocked).slice(0, 8).map((ap) => (
                <div
                  key={ap.achievement.id}
                  className="google-achievement-svg-item"
                  onClick={() => setLocation('/badges')}
                  title={ap.achievement.name}
                >
                  <AchievementBadgeSVG
                    name={ap.achievement.id}
                    isUnlocked={ap.isUnlocked}
                    progress={ap.progress}
                    icon={ap.achievement.icon || '🏆'}
                  />
                  <span className="google-achievement-svg-name">{ap.achievement.name}</span>
                </div>
              ))}
            </div>
            {nextUp.length > 0 && (
              <div className="google-next-section">
                <div className="google-next-label">Next Up</div>
                <div className="google-next-grid">
                  {nextUp.slice(0, 4).map((ap) => (
                    <div key={ap.achievement.id} className="google-next-item">
                      <AchievementBadgeSVG
                        name={ap.achievement.id}
                        isUnlocked={false}
                        progress={ap.progress}
                        icon={ap.achievement.icon || '🏆'}
                      />
                      <div className="google-next-info">
                        <div className="google-next-name">{ap.achievement.name}</div>
                        <div className="google-next-progress">{Math.round(ap.progress)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          <GitHubAnalytics />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="google-activity-card"
          >
            <div className="google-card-header">
              <h3>
                <Calendar className="icon-primary" />
                Activity
              </h3>
              <div className="google-time-filter">
                {(['30', '90', '365'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`google-time-btn ${timeRange === r ? 'active' : ''}`}
                  >
                    {r === '365' ? '1Y' : r + 'D'}
                  </button>
                ))}
              </div>
            </div>
            <SVGHeatmap data={activityData} days={days} cellSize={14} gap={3} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="google-channels-card"
          >
            <div className="google-card-header">
              <h3>
                <BarChart2 className="icon-primary" />
                Channel Progress
              </h3>
            </div>
            <div className="google-channels-list">
              {moduleProgress.slice(0, 10).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setLocation(`/channel/${m.id}`)}
                  className="google-channel-item"
                >
                  <div className="google-channel-info">
                    <span className="google-channel-name">{m.name}</span>
                    <span className="google-channel-stats">
                      {m.completed}/{m.total}
                    </span>
                  </div>
                  <div className="google-channel-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.pct}%` }}
                      transition={{ duration: 0.4, delay: i * 0.03 }}
                      className="google-channel-fill"
                    />
                  </div>
                  <span className="google-channel-pct">{m.pct}%</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </AppLayout>
    </>
  );
}

function GoogleMetricCard({ label, value, unit, subtext, trend, color, change }: {
  label: string;
  value: number;
  unit: string;
  subtext: string | React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  change?: number;
}) {
  const trendIcon = trend === 'up' ? <TrendingUp /> : trend === 'down' ? <TrendingDown /> : <Minus />;
  const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : 'trend-neutral';
  
  const colors: Record<string, string> = {
    primary: 'var(--color-primary)',
    orange: '#f97316',
    blue: '#3b82f6',
    purple: '#4285F4'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="google-metric-card"
    >
      <div className="google-metric-header">
        <span className="google-metric-label">{label}</span>
        {change !== undefined && (
          <span className={`google-metric-trend ${trendClass}`}>
            {trendIcon}
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div className="google-metric-value" style={{ color: colors[color] }}>
        {value.toLocaleString()}<span className="google-metric-unit">{unit}</span>
      </div>
      <div className="google-metric-subtext">{subtext}</div>
    </motion.div>
  );
}

// Old components removed - replaced with SVG components above
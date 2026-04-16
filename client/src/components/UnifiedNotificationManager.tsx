// Primary notification system — Sonner (ui/sonner.tsx) is used for simple toasts only
/**
 * Unified Notification Manager
 * Single queue system for all notifications - achievements, badges, toasts, and system messages
 * Shows one notification at a time to prevent visual clutter
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Coins, Star, X, CheckCircle, AlertCircle, Info, Bell, Award } from 'lucide-react';
import { Achievement, Reward } from '../lib/achievements';
import { Badge } from '../lib/badges';
import { cn } from '../lib/utils';

// Notification types
type NotificationType = 'achievement' | 'badge' | 'levelup' | 'toast' | 'system';
type ToastVariant = 'default' | 'success' | 'destructive' | 'warning';

interface BaseNotification {
  id: string;
  type: NotificationType;
  priority: number; // Higher = more important, shown first
  duration: number;
  createdAt: number;
}

interface AchievementNotification extends BaseNotification {
  type: 'achievement';
  achievement: Achievement;
  rewards: Reward[];
}

interface BadgeNotification extends BaseNotification {
  type: 'badge';
  badge: Badge;
}

interface LevelUpNotification extends BaseNotification {
  type: 'levelup';
  from: number;
  to: number;
  title: string;
  rewards: Reward[];
}

interface ToastNotification extends BaseNotification {
  type: 'toast';
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface SystemNotification extends BaseNotification {
  type: 'system';
  title: string;
  description?: string;
  icon?: ReactNode;
}

type UnifiedNotification = AchievementNotification | BadgeNotification | LevelUpNotification | ToastNotification | SystemNotification;

interface NotificationContextType {
  showAchievement: (achievement: Achievement, rewards?: Reward[]) => void;
  showBadge: (badge: Badge) => void;
  showLevelUp: (from: number, to: number, title: string, rewards?: Reward[]) => void;
  showToast: (title: string, description?: string, variant?: ToastVariant) => void;
  showSystem: (title: string, description?: string, icon?: ReactNode) => void;
  dismissCurrent: () => void;
  clearAll: () => void;
  queueLength: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Priority levels
const PRIORITY = {
  levelup: 100,
  achievement: 80,
  badge: 75,
  system: 50,
  toast: 30,
};

// Default durations
const DURATION = {
  levelup: 6000,
  achievement: 4000,
  badge: 4000,
  system: 3500,
  toast: 3000,
};

export function UnifiedNotificationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<UnifiedNotification[]>([]);
  const [current, setCurrent] = useState<UnifiedNotification | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Process queue - show next notification
  useEffect(() => {
    if (current || isAnimating || queue.length === 0) return;

    // Sort by priority (highest first), then by creation time (oldest first)
    const sorted = [...queue].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.createdAt - b.createdAt;
    });

    const next = sorted[0];
    setQueue(prev => prev.filter(n => n.id !== next.id));
    setCurrent(next);
  }, [queue, current, isAnimating]);

  // Auto-dismiss current notification
  useEffect(() => {
    if (!current) return;

    const timer = setTimeout(() => {
      dismissCurrent();
    }, current.duration);

    return () => clearTimeout(timer);
  }, [current]);

  const dismissCurrent = useCallback(() => {
    setIsAnimating(true);
    setCurrent(null);
    // Small delay before showing next
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const addToQueue = useCallback((notification: UnifiedNotification) => {
    setQueue(prev => {
      // Dedupe by checking for similar notifications
      const isDupe = prev.some(n => {
        if (n.type !== notification.type) return false;
        if (n.type === 'achievement' && notification.type === 'achievement') {
          return n.achievement.id === notification.achievement.id;
        }
        if (n.type === 'toast' && notification.type === 'toast') {
          return n.title === notification.title && n.description === notification.description;
        }
        return false;
      });
      if (isDupe) return prev;
      return [...prev, notification];
    });
  }, []);

  const showAchievement = useCallback((achievement: Achievement, rewards: Reward[] = []) => {
    addToQueue({
      id: `achievement-${achievement.id}-${Date.now()}`,
      type: 'achievement',
      priority: PRIORITY.achievement,
      duration: DURATION.achievement,
      createdAt: Date.now(),
      achievement,
      rewards: rewards.length > 0 ? rewards : achievement.rewards,
    });
  }, [addToQueue]);

  const showLevelUp = useCallback((from: number, to: number, title: string, rewards: Reward[] = []) => {
    addToQueue({
      id: `levelup-${to}-${Date.now()}`,
      type: 'levelup',
      priority: PRIORITY.levelup,
      duration: DURATION.levelup,
      createdAt: Date.now(),
      from,
      to,
      title,
      rewards,
    });
  }, [addToQueue]);

  const showToast = useCallback((title: string, description?: string, variant: ToastVariant = 'default') => {
    addToQueue({
      id: `toast-${Date.now()}-${Math.random()}`,
      type: 'toast',
      priority: PRIORITY.toast,
      duration: DURATION.toast,
      createdAt: Date.now(),
      title,
      description,
      variant,
    });
  }, [addToQueue]);

  const showSystem = useCallback((title: string, description?: string, icon?: ReactNode) => {
    addToQueue({
      id: `system-${Date.now()}-${Math.random()}`,
      type: 'system',
      priority: PRIORITY.system,
      duration: DURATION.system,
      createdAt: Date.now(),
      title,
      description,
      icon,
    });
  }, [addToQueue]);

  const clearAll = useCallback(() => {
    setQueue([]);
    setCurrent(null);
  }, []);

  const showBadge = useCallback((badge: Badge) => {
    addToQueue({
      id: `badge-${badge.id}-${Date.now()}`,
      type: 'badge',
      priority: PRIORITY.badge,
      duration: DURATION.badge,
      createdAt: Date.now(),
      badge,
    });
  }, [addToQueue]);

  return (
    <NotificationContext.Provider
      value={{
        showAchievement,
        showBadge,
        showLevelUp,
        showToast,
        showSystem,
        dismissCurrent,
        clearAll,
        queueLength: queue.length,
      }}
    >
      {children}
      <NotificationRenderer 
        notification={current} 
        queueLength={queue.length}
        onDismiss={dismissCurrent} 
      />
    </NotificationContext.Provider>
  );
}

// Notification Renderer
function NotificationRenderer({ 
  notification, 
  queueLength,
  onDismiss 
}: { 
  notification: UnifiedNotification | null;
  queueLength: number;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <AnimatePresence mode="wait">
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pointer-events-auto"
          >
            {notification.type === 'achievement' && (
              <AchievementCard notification={notification} onDismiss={onDismiss} queueLength={queueLength} />
            )}
            {notification.type === 'badge' && (
              <BadgeCard notification={notification} onDismiss={onDismiss} queueLength={queueLength} />
            )}
            {notification.type === 'levelup' && (
              <LevelUpCard notification={notification} onDismiss={onDismiss} />
            )}
            {notification.type === 'toast' && (
              <ToastCard notification={notification} onDismiss={onDismiss} queueLength={queueLength} />
            )}
            {notification.type === 'system' && (
              <SystemCard notification={notification} onDismiss={onDismiss} queueLength={queueLength} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Achievement Card
function AchievementCard({ 
  notification, 
  onDismiss,
  queueLength 
}: { 
  notification: AchievementNotification;
  onDismiss: () => void;
  queueLength: number;
}) {
  const { achievement, rewards } = notification;
  
  return (
    <div className={cn(
      "w-[340px] rounded-xl shadow-2xl overflow-hidden",
      "bg-gradient-to-br",
      achievement.gradient || "from-amber-500 to-orange-600"
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
          >
            <Trophy className="w-6 h-6 text-white" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
              Achievement Unlocked
            </div>
            <h3 className="text-base font-bold text-white leading-tight">
              {achievement.name}
            </h3>
            <p className="text-xs text-white/90 mt-0.5 line-clamp-2">
              {achievement.description}
            </p>
            
            {rewards.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {rewards.map((reward, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full"
                  >
                    {reward.type === 'xp' && <Zap className="w-3 h-3 text-white" />}
                    {reward.type === 'credits' && <Coins className="w-3 h-3 text-white" />}
                    {reward.type === 'title' && <Star className="w-3 h-3 text-white" />}
                    <span className="text-xs font-semibold text-white">
                      +{reward.amount} {reward.type === 'title' ? reward.item : reward.type.toUpperCase()}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Dismiss achievement notification"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
        
        {queueLength > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20 text-center">
            <span className="text-[10px] text-white/70">
              +{queueLength} more notification{queueLength > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Level Up Confetti
function LevelUpConfetti() {
  const colors = ['#ffd700', '#ff8c00', '#7c3aed', '#06b6d4', '#10b981', '#f43f5e', '#a78bfa'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      {Array.from({ length: 24 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-sm"
          style={{ background: colors[i % colors.length], left: `${5 + (i * 3.8) % 90}%`, top: '60%' }}
          initial={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{
            y: [-8, -70 - (i % 5) * 18],
            x: [(i % 2 === 0 ? 1 : -1) * (6 + (i * 5) % 28)],
            opacity: [1, 0],
            scale: [1, 0.3],
            rotate: [0, (i % 2 === 0 ? 1 : -1) * 540],
          }}
          transition={{ duration: 0.9 + (i % 4) * 0.12, ease: 'easeOut', delay: i * 0.02 }}
        />
      ))}
    </div>
  );
}

// Level Up Card
function LevelUpCard({ 
  notification, 
  onDismiss 
}: { 
  notification: LevelUpNotification;
  onDismiss: () => void;
}) {
  return (
    <div className="relative w-[300px] rounded-xl shadow-2xl overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-violet-600">
      <LevelUpConfetti />

      <div className="relative p-5 text-center">
        {/* Stars decoration */}
        <div className="absolute top-3 left-4 text-yellow-200/60 text-lg">✦</div>
        <div className="absolute top-5 right-8 text-yellow-200/40 text-sm">✦</div>

        <div className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mb-2">
          ⚡ Level Up!
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
          className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center border-2 border-white/40"
          style={{ boxShadow: '0 0 32px rgba(255,215,0,0.6)' }}
        >
          <span className="text-4xl font-black text-white">{notification.to}</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-black text-white mb-0.5"
        >
          {notification.title}
        </motion.h2>
        <p className="text-xs text-white/70 mb-3">Level {notification.from} → {notification.to}</p>

        {notification.rewards.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {notification.rewards.map((reward, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/20 rounded-full"
              >
                {reward.type === 'xp' && <Zap className="w-3 h-3 text-yellow-200" />}
                {reward.type === 'credits' && <Coins className="w-3 h-3 text-yellow-200" />}
                {reward.type === 'unlock' && <Star className="w-3 h-3 text-yellow-200" />}
                <span className="text-xs font-bold text-white">
                  {reward.type === 'unlock' ? reward.item?.replace(/_/g, ' ') : `+${reward.amount} ${reward.type.toUpperCase()}`}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          aria-label="Dismiss level up notification"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  );
}

// Toast Card
function ToastCard({ 
  notification, 
  onDismiss,
  queueLength 
}: { 
  notification: ToastNotification;
  onDismiss: () => void;
  queueLength: number;
}) {
  const variantStyles = {
    default: 'bg-gray-900/95 border-gray-700/50',
    success: 'bg-green-950/95 border-green-500/30',
    destructive: 'bg-red-950/95 border-red-500/30',
    warning: 'bg-amber-950/95 border-amber-500/30',
  };
  
  const variantIcons = {
    default: <Bell className="w-4 h-4 text-gray-400" />,
    success: <CheckCircle className="w-4 h-4 text-green-400" />,
    destructive: <AlertCircle className="w-4 h-4 text-red-400" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400" />,
  };
  
  const variantText = {
    default: 'text-white',
    success: 'text-green-200',
    destructive: 'text-red-200',
    warning: 'text-amber-200',
  };
  
  return (
    <div className={cn(
      "w-[300px] rounded-xl shadow-xl border backdrop-blur-sm",
      variantStyles[notification.variant]
    )}>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            {variantIcons[notification.variant]}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={cn("text-sm font-semibold", variantText[notification.variant])}>
              {notification.title}
            </h4>
            {notification.description && (
              <p className="text-xs text-white/70 mt-0.5">
                {notification.description}
              </p>
            )}
          </div>
          
          <button
            onClick={onDismiss}
            className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Dismiss toast notification"
          >
            <X className="w-3 h-3 text-white/50" />
          </button>
        </div>
        
        {queueLength > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10 text-center">
            <span className="text-[10px] text-white/50">
              +{queueLength} more
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Badge Card
function BadgeCard({ 
  notification, 
  onDismiss,
  queueLength 
}: { 
  notification: BadgeNotification;
  onDismiss: () => void;
  queueLength: number;
}) {
  const { badge } = notification;
  
  return (
    <div className={cn(
      "w-[340px] rounded-xl shadow-2xl overflow-hidden",
      "bg-gradient-to-br",
      badge.gradient || "from-purple-500 to-indigo-600"
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0"
          >
            <Award className="w-6 h-6 text-white" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
              🏆 Badge Unlocked
            </div>
            <h3 className="text-base font-bold text-white leading-tight">
              {badge.name}
            </h3>
            <p className="text-xs text-white/90 mt-0.5 line-clamp-2">
              {badge.description}
            </p>
          </div>
          
          <button
            onClick={onDismiss}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Dismiss badge notification"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
        
        {queueLength > 0 && (
          <div className="mt-2 pt-2 border-t border-white/20 text-center">
            <span className="text-[10px] text-white/70">
              +{queueLength} more notification{queueLength > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// System Card
function SystemCard({ 
  notification, 
  onDismiss,
  queueLength 
}: { 
  notification: SystemNotification;
  onDismiss: () => void;
  queueLength: number;
}) {
  return (
    <div className="w-[300px] rounded-xl shadow-xl border border-gray-700/50 bg-gray-900/95 backdrop-blur-sm">
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            {notification.icon || <Info className="w-4 h-4 text-blue-400" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">
              {notification.title}
            </h4>
            {notification.description && (
              <p className="text-xs text-white/70 mt-0.5">
                {notification.description}
              </p>
            )}
          </div>
          
          <button
            onClick={onDismiss}
            className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Dismiss system notification"
          >
            <X className="w-3 h-3 text-white/50" />
          </button>
        </div>
        
        {queueLength > 0 && (
          <div className="mt-2 pt-2 border-t border-white/10 text-center">
            <span className="text-[10px] text-white/50">
              +{queueLength} more
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to use unified notifications
export function useUnifiedNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useUnifiedNotifications must be used within UnifiedNotificationProvider');
  }
  return context;
}

// Global event bridge - allows showing notifications from anywhere
export function setupNotificationBridge() {
  // This will be called from the provider to set up global event listeners
}

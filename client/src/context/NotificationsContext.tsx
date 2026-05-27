import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { rewardStorage } from '../lib/rewards';
import { useRewardContext } from './RewardContext';
import type { Notification, NotificationType } from '../types';

// Re-export Notification type for backward compatibility
export type { Notification };

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

function mapToRewardNotifications(n: { title: string; description?: string; type: NotificationType; link?: string }) {
  return {
    type: (n.type === 'error' ? 'credits' : 'xp') as 'xp' | 'credits' | 'level_up' | 'achievement' | 'streak',
    title: n.title,
    message: n.description || '',
    ...(n.link ? { icon: '🔗' } : {}),
  };
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { notifications: rewardNotifs, dismissNotification, clearNotifications, refresh } = useRewardContext();

  const notifications = useMemo<Notification[]>(() =>
    rewardNotifs.map(r => ({
      id: r.id,
      title: r.title,
      description: r.message,
      type: 'info' as NotificationType,
      timestamp: r.timestamp,
      read: r.dismissed,
    })),
    [rewardNotifs]
  );

  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.read).length,
    [notifications]
  );

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    rewardStorage.addNotification(mapToRewardNotifications(notification));
    refresh();
  }, [refresh]);

  const markAsRead = useCallback((id: string) => {
    dismissNotification(id);
  }, [dismissNotification]);

  const markAllAsRead = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);

  const clearNotification = useCallback((id: string) => {
    dismissNotification(id);
  }, [dismissNotification]);

  const clearAll = useCallback(() => {
    clearNotifications();
  }, [clearNotifications]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

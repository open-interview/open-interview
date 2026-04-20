/**
 * Notifications Page
 * Shows all past toast notifications
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page';
import { SEOHead } from '../components/SEOHead';
import {
  Bell, Trash2, CheckCheck, Info, AlertCircle,
  CheckCircle, AlertTriangle, X
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
  read: boolean;
  link?: string;
}

const STORAGE_KEY = 'app-notifications';

const typeIcons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const typeColors = {
  success: 'bg-green-500/10 border-green-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
};

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setNotifications(stored ? JSON.parse(stored) : []);
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();

    const handleNewNotification = () => loadNotifications();
    window.addEventListener('notification-added', handleNewNotification);
    return () => window.removeEventListener('notification-added', handleNewNotification);
  }, []);

  const saveNotifications = (updated: Notification[]) => {
    setNotifications(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleNotificationClick = (notification: Notification) => {
    const updated = notifications.map(n =>
      n.id === notification.id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    if (notification.link) setLocation(notification.link);
  };

  const markAllAsRead = () => saveNotifications(notifications.map(n => ({ ...n, read: true })));

  const clearNotification = (id: string) => saveNotifications(notifications.filter(n => n.id !== id));

  const clearAll = () => saveNotifications([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <>
      <SEOHead
        title="Notifications - Open Interview"
        description="View your notifications and alerts"
      />

      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">
            <PageHeader title="Notifications" subtitle="Your alerts and updates" />
            <div className="max-w-4xl mx-auto">

              {/* Header Actions */}
              {notifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between mb-6"
                >
                  <div className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </div>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors duration-150 ease-out cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-sm font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors duration-150 ease-out cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear all
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Notifications List */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {notifications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card rounded-2xl border border-border p-10 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                      <p className="text-base text-muted-foreground mb-6">
                        You're all caught up! Notifications will appear here as you use the app.
                      </p>
                      <button
                        onClick={() => setLocation('/')}
                        className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors duration-150 ease-out cursor-pointer"
                      >
                        Browse Questions
                      </button>
                    </motion.div>
                  ) : (
                    notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
                        className={`bg-card rounded-xl border overflow-hidden transition-colors duration-150 ease-out ${
                          notification.read ? 'border-border' : typeColors[notification.type]
                        } ${notification.link ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                      >
                        <div
                          className="flex items-start gap-3 p-4"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {typeIcons[notification.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-medium text-base leading-snug ${notification.read ? 'text-muted-foreground' : ''}`}>
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="flex-shrink-0 w-[44px] h-[44px] flex items-center justify-center -mr-2 -mt-2 hover:bg-muted rounded-lg transition-colors duration-150 ease-out cursor-pointer"
                                aria-label="Dismiss notification"
                              >
                                <X className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                            {notification.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-primary" />
                              )}
                              {notification.link && (
                                <span className="text-xs text-primary">Tap to view →</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

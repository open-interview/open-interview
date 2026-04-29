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
  success: <CheckCircle className="w-5 h-5 text-emerald-600" />,
  error: <AlertCircle className="w-5 h-5 text-red-600" />,
  info: <Info className="w-5 h-5 text-blue-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
};

const typeColors = {
  success: 'bg-emerald-50 border-emerald-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-amber-50 border-amber-200',
};

const typeDots = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
};

const unreadDots = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
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

  const handleSwipeDelete = (id: string, e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    clearNotification(id);
  };

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
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24">
            <PageHeader title="Notifications" subtitle="Your alerts and updates" />
            <div className="max-w-3xl mx-auto">

              {/* Header Actions */}
              {notifications.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100"
                >
                  <div className="text-sm text-gray-600 font-medium">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </div>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-150 ease-out cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4" />
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150 ease-out cursor-pointer"
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
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                       className="bg-white rounded-2xl border border-gray-200 p-12 text-center"
                    >
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                        <Bell className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                      <p className="text-base text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                        You're all caught up. Notifications will appear here when there's something new.
                      </p>
                      <button
                        onClick={() => setLocation('/')}
                         className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors duration-150 ease-out cursor-pointer"
                      >
                        Browse Questions
                      </button>
                    </motion.div>
                  ) : (
                    notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
                         className={`group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 ease-out ${
                          notification.read ? 'border-gray-200' : typeColors[notification.type]
                         } ${notification.link ? 'cursor-pointer' : ''}`}
                      >
                        {/* Swipe to delete indicator */}
                        <div className="absolute inset-y-0 right-0 w-20 bg-red-500 rounded-r-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => handleSwipeDelete(notification.id, e)}
                            className="w-full h-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                            aria-label="Swipe to delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div
                          className="flex items-start gap-4 p-4"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {/* Colored dot indicator */}
                          <div className="flex flex-col items-center gap-2">
                            {!notification.read && (
                              <div className={`w-2.5 h-2.5 rounded-full ${unreadDots[notification.type]} ring-2 ring-white`} />
                            )}
                            <div className="flex-shrink-0 p-1.5 rounded-full bg-gray-50">
                              {typeIcons[notification.type]}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className={`font-medium text-[15px] leading-snug ${notification.read ? 'text-gray-500' : 'text-gray-900'}`}>
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="flex-shrink-0 w-[36px] h-[36px] flex items-center justify-center -mr-1 -mt-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all duration-150 ease-out cursor-pointer"
                                aria-label="Dismiss notification"
                              >
                                <X className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                            {notification.description && (
                              <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                {notification.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2.5">
                              <span className="text-xs text-gray-400 font-medium">
                                {formatTime(notification.timestamp)}
                              </span>
                              {notification.link && (
                                <span className="text-xs text-indigo-600 font-medium">View →</span>
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

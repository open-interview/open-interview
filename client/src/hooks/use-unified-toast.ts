/**
 * Unified Toast Hook
 * Bridges the existing useToast API to the unified notification system
 * Drop-in replacement for useToast that routes to unified notifications
 */

import { useCallback } from 'react';
import { useUnifiedNotifications } from '../components/UnifiedNotificationManager';

type ToastVariant = 'default' | 'destructive' | 'success' | 'warning';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

// Notification storage helper - stores toasts as notifications for history
function saveToNotifications(title: string, description?: string, variant?: string) {
  try {
    const STORAGE_KEY = 'app-notifications';
    const MAX_NOTIFICATIONS = 50;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    
    const type = variant === 'destructive' ? 'error' : variant === 'success' ? 'success' : 'info';
    
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      title: typeof title === 'string' ? title : 'Notification',
      description: typeof description === 'string' ? description : undefined,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    const updated = [newNotification, ...notifications].slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Dispatch custom event so NotificationsContext can update
    window.dispatchEvent(new CustomEvent('notification-added'));
  } catch (e) {
    console.error('Failed to save notification:', e);
  }
}

/**
 * Hook that provides toast functionality through the unified notification system
 * API-compatible with the original useToast hook
 */
export function useUnifiedToast() {
  const { showToast } = useUnifiedNotifications();
  
  const toast = useCallback((props: ToastProps) => {
    const { title, description, variant = 'default' } = props;
    
    if (title) {
      // Map variants to the unified system
      const unifiedVariant = variant === 'destructive' ? 'destructive' 
        : variant === 'success' ? 'success'
        : variant === 'warning' ? 'warning'
        : 'default';
      showToast(title, description, unifiedVariant);
      
      // Also save to notification history
      saveToNotifications(title, description, variant);
    }
    
    // Return a mock dismiss function for API compatibility
    return {
      id: `toast-${Date.now()}`,
      dismiss: () => {},
      update: () => {},
    };
  }, [showToast]);
  
  return {
    toast,
    toasts: [], // Empty - unified system manages display
    dismiss: () => {},
  };
}

/**
 * Progressive Onboarding
 * 
 * Non-blocking onboarding that collects user preferences progressively
 * while they're using the app. Never blocks direct URL access.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles, Check } from 'lucide-react';
import { rolesConfig, getRecommendedChannels } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';

import { 
  Layout, Server, Layers, Smartphone, Activity, Shield, 
  Cpu, Users, Database, Brain, Workflow, Box
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'layout': <Layout className="w-5 h-5" />,
  'server': <Server className="w-5 h-5" />,
  'layers': <Layers className="w-5 h-5" />,
  'smartphone': <Smartphone className="w-5 h-5" />,
  'infinity': <Activity className="w-5 h-5" />,
  'activity': <Activity className="w-5 h-5" />,
  'workflow': <Workflow className="w-5 h-5" />,
  'brain': <Brain className="w-5 h-5" />,
  'shield': <Shield className="w-5 h-5" />,
  'cpu': <Cpu className="w-5 h-5" />,
  'users': <Users className="w-5 h-5" />,
  'box': <Box className="w-5 h-5" />,
  'database': <Database className="w-5 h-5" />
};

const DISMISSED_KEY = 'progressive-onboarding-dismissed';
const ROLE_PROMPT_DELAY = 3000;

interface ProgressiveOnboardingProps {
  onComplete?: () => void;
}

export function ProgressiveOnboarding({ onComplete }: ProgressiveOnboardingProps) {
  const { preferences, setRole, subscribeChannel, unsubscribeChannel, needsOnboarding } = useUserPreferences();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<'role' | 'channels'>('role');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!needsOnboarding) return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;
    const timer = setTimeout(() => setIsVisible(true), ROLE_PROMPT_DELAY);
    return () => clearTimeout(timer);
  }, [needsOnboarding]);

  // Focus heading on step change
  useEffect(() => {
    if (isVisible) headingRef.current?.focus();
  }, [step, isVisible]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const recommended = getRecommendedChannels(roleId);
    setSelectedChannels(new Set(recommended.map(c => c.id)));
    setStep('channels');
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const handleComplete = () => {
    if (selectedRole) {
      setRole(selectedRole);
      const recommended = getRecommendedChannels(selectedRole);
      const recommendedIds = new Set(recommended.map(c => c.id));
      recommendedIds.forEach(id => {
        if (!selectedChannels.has(id)) unsubscribeChannel(id);
      });
      selectedChannels.forEach(id => {
        if (!recommendedIds.has(id)) subscribeChannel(id);
      });
      setIsVisible(false);
      onComplete?.();
    }
  };

  const recommendedChannels = selectedRole ? getRecommendedChannels(selectedRole) : [];
  const isCompleteDisabled = selectedChannels.size === 0;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progressive-onboarding-heading"
      >
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: 'rgba(20,20,25,0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: '12px 12px 32px rgba(0,0,0,0.5), -4px -4px 16px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
          {/* Header */}
          <div className="bg-primary/10 px-4 py-3 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span id="progressive-onboarding-heading" className="font-semibold text-sm">
                {step === 'role' ? 'Personalize Your Experience' : 'Select Your Channels'}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              aria-label="Skip onboarding"
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              {step === 'role' ? (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <p
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-sm text-muted-foreground mb-4 outline-none"
                  >
                    What's your role? We'll recommend the best channels for you.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {rolesConfig.slice(0, 8).map(role => (
                      <motion.button
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        aria-pressed={selectedRole === role.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 border rounded-lg text-left group"
                        style={{
                          background: selectedRole === role.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.025)',
                          border: `1px solid ${selectedRole === role.id ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`,
                          boxShadow: selectedRole === role.id 
                            ? '0 4px 16px rgba(124,58,237,0.25), inset 0 1px 0 rgba(124,58,237,0.15)' 
                            : '4px 4px 12px rgba(0,0,0,0.3), -2px -2px 8px rgba(255,255,255,0.02)',
                        }}
                      >
                        <div className="text-muted-foreground group-hover:text-primary mb-1">
                          {iconMap[role.icon] || <Cpu className="w-5 h-5" />}
                        </div>
                        <div className="font-medium text-xs">{role.name}</div>
                      </motion.button>
                    ))}
                  </div>

                  <button
                    onClick={handleDismiss}
                    aria-label="Skip onboarding"
                    className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    I'll explore on my own
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="channels"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-sm text-muted-foreground mb-3 outline-none"
                  >
                    We've selected {selectedChannels.size} channels for you. Tap to toggle.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto mb-4">
                    {recommendedChannels.map(channel => {
                      const isSelected = selectedChannels.has(channel.id);
                      return (
                        <motion.button
                          key={channel.id}
                          onClick={() => toggleChannel(channel.id)}
                          aria-pressed={isSelected}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
                          style={{
                            background: isSelected 
                              ? 'rgba(124,58,237,0.2)' 
                              : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isSelected ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.05)'}`,
                            boxShadow: isSelected 
                              ? '0 3px 12px rgba(124,58,237,0.25), inset 0 1px 0 rgba(124,58,237,0.15)' 
                              : '3px 3px 8px rgba(0,0,0,0.25), -2px -2px 6px rgba(255,255,255,0.015)',
                            color: '#e2d9f3',
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {channel.name}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setStep('role')}
                      aria-label="Go back to role selection"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '3px 3px 8px rgba(0,0,0,0.2), -2px -2px 6px rgba(255,255,255,0.015)',
                      }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      onClick={handleComplete}
                      disabled={isCompleteDisabled}
                      aria-disabled={isCompleteDisabled}
                      whileHover={isCompleteDisabled ? {} : { scale: 1.02 }}
                      whileTap={isCompleteDisabled ? {} : { scale: 0.95 }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      style={{
                        background: isCompleteDisabled 
                          ? 'rgba(255,255,255,0.06)' 
                          : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                        color: 'white',
                        boxShadow: isCompleteDisabled 
                          ? 'none' 
                          : '0 4px 16px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                        cursor: isCompleteDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Start Learning <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pb-3" aria-hidden="true">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 'role' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 'channels' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ProgressiveOnboarding;

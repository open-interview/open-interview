/**
 * Credits Context
 * Provides global access to credits state and actions
 * Now integrated with the unified reward system
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getCreditsState,
  getBalance,
  earnCredits,
  spendCredits,
  redeemCoupon,
  trackQuestionSwipe,
  shouldShowVoiceReminder,
  markVoiceReminderShown,
  awardVoiceInterviewCredits,
  deductQuestionViewCredits,
  processQuizAnswer,
  processSRSReview,
  formatCredits,
  CREDIT_CONFIG,
  type CreditsState,
  type CreditTransaction,
  getTransactionHistory,
} from '../lib/credits';
import { rewardStorage, rewardEngine } from '../lib/rewards';

interface CreditsContextType {
  balance: number;
  state: CreditsState;
  history: CreditTransaction[];
  // Credit change splash
  creditChange: { amount: number; show: boolean };
  clearCreditChange: () => void;
  // Actions
  refreshBalance: () => void;
  onQuestionView: () => { success: boolean; cost: number };
  onVoiceInterview: (verdict: string) => { totalCredits: number; bonusCredits: number };
  onRedeemCoupon: (code: string) => { success: boolean; message: string; credits?: number };
  onQuestionSwipe: () => { shouldRemind: boolean };
  dismissVoiceReminder: () => void;
  shouldShowVoiceReminder: boolean;
  // Quiz & SRS actions
  onQuizAnswer: (isCorrect: boolean) => { amount: number };
  onSRSReview: (rating: 'again' | 'hard' | 'good' | 'easy') => { amount: number };
  // Helpers
  formatCredits: (amount: number) => string;
  canAfford: (amount: number) => boolean;
  config: typeof CREDIT_CONFIG;
  // Unified system access
  level: number;
  totalXP: number;
  streak: number;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [state, setState] = useState<CreditsState>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    usedCoupons: [],
    initialized: false,
  });
  const [history, setHistory] = useState<CreditTransaction[]>([]);
  const [showVoiceReminder, setShowVoiceReminder] = useState(false);
  const [creditChange, setCreditChange] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });
  
  // Unified reward state
  const [rewardState, setRewardState] = useState(() => rewardStorage.getProgress());

  // Show credit splash animation
  const showCreditSplash = useCallback((amount: number) => {
    setCreditChange({ amount, show: true });
    // Auto-hide after 2 seconds
    setTimeout(() => {
      setCreditChange(prev => ({ ...prev, show: false }));
    }, 2000);
  }, []);

  const clearCreditChange = useCallback(() => {
    setCreditChange({ amount: 0, show: false });
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshBalance();
  }, []);
  
  // Subscribe to reward engine updates
  useEffect(() => {
    const unsubscribe = rewardEngine.addListener((result) => {
      setRewardState(rewardStorage.getProgress());
      // Sync credit balance
      const newState = getCreditsState();
      setState(newState);
      setBalance(newState.balance);
      
      // Show splash for credit changes
      if (result.netCredits !== 0) {
        showCreditSplash(result.netCredits);
      }
    });
    return unsubscribe;
  }, [showCreditSplash]);

  const refreshBalance = useCallback(() => {
    const newState = getCreditsState();
    setState(newState);
    setBalance(newState.balance);
    setHistory(getTransactionHistory());
    setShowVoiceReminder(shouldShowVoiceReminder());
    setRewardState(rewardStorage.getProgress());
  }, []);

  const onQuestionView = useCallback(() => {
    const result = deductQuestionViewCredits();
    if (result.success) {
      setBalance(result.balance);
      showCreditSplash(-result.cost);
      // Also update unified system
      rewardStorage.spendCredits(result.cost);
      refreshBalance();
    }
    return { success: result.success, cost: result.cost };
  }, [refreshBalance, showCreditSplash]);

  const onVoiceInterview = useCallback((verdict: string) => {
    const result = awardVoiceInterviewCredits(verdict);
    setBalance(result.newBalance);
    setShowVoiceReminder(false);
    showCreditSplash(result.totalCredits);
    
    // Also process through unified system
    rewardEngine.processActivity({
      type: 'voice_interview_completed',
      timestamp: new Date().toISOString(),
      data: { verdict: verdict as 'strong-hire' | 'hire' | 'no-hire' | 'needs-improvement' },
    });
    
    refreshBalance();
    return { totalCredits: result.totalCredits, bonusCredits: result.bonusCredits };
  }, [refreshBalance, showCreditSplash]);

  const onRedeemCoupon = useCallback((code: string) => {
    const result = redeemCoupon(code);
    if (result.success && result.newBalance !== undefined) {
      setBalance(result.newBalance);
      if (result.credits) {
        showCreditSplash(result.credits);
        // Also update unified system
        rewardStorage.addCredits(result.credits);
      }
      refreshBalance();
    }
    return { success: result.success, message: result.message, credits: result.credits };
  }, [refreshBalance, showCreditSplash]);

  const onQuestionSwipe = useCallback(() => {
    const result = trackQuestionSwipe();
    if (result.shouldRemind) {
      setShowVoiceReminder(true);
    }
    return { shouldRemind: result.shouldRemind };
  }, []);

  const dismissVoiceReminder = useCallback(() => {
    markVoiceReminderShown();
    setShowVoiceReminder(false);
  }, []);

  const onQuizAnswer = useCallback((isCorrect: boolean) => {
    const result = processQuizAnswer(isCorrect);
    if (result.amount !== 0) {
      setBalance(result.newBalance);
      showCreditSplash(result.amount);
      refreshBalance();
    }
    
    // Also process through unified system
    rewardEngine.processActivity({
      type: 'quiz_answered',
      timestamp: new Date().toISOString(),
      data: { isCorrect },
    });
    
    return { amount: result.amount };
  }, [refreshBalance, showCreditSplash]);

  const onSRSReview = useCallback((rating: 'again' | 'hard' | 'good' | 'easy') => {
    const result = processSRSReview(rating);
    if (result.amount !== 0) {
      setBalance(result.newBalance);
      showCreditSplash(result.amount);
      refreshBalance();
    }
    
    // Also process through unified system
    rewardEngine.processActivity({
      type: 'srs_card_rated',
      timestamp: new Date().toISOString(),
      data: { rating },
    });
    
    return { amount: result.amount };
  }, [refreshBalance, showCreditSplash]);

  const canAffordCheck = useCallback((amount: number) => {
    return balance >= amount;
  }, [balance]);

  return (
    <CreditsContext.Provider
      value={{
        balance,
        state,
        history,
        creditChange,
        clearCreditChange,
        refreshBalance,
        onQuestionView,
        onVoiceInterview,
        onRedeemCoupon,
        onQuestionSwipe,
        dismissVoiceReminder,
        shouldShowVoiceReminder: showVoiceReminder,
        onQuizAnswer,
        onSRSReview,
        formatCredits,
        canAfford: canAffordCheck,
        config: CREDIT_CONFIG,
        // Unified system values
        level: rewardState.level,
        totalXP: rewardState.totalXP,
        streak: rewardState.currentStreak,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}

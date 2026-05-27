/**
 * @deprecated Use RewardContext instead.
 * Credits Context — kept for backward compatibility.
 * Derives data from the unified RewardContext.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  getCreditsState,
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
import { rewardStorage } from '../lib/rewards';
import { useRewardContext } from './RewardContext';

interface CreditsContextType {
  balance: number;
  state: CreditsState;
  history: CreditTransaction[];
  creditChange: { amount: number; show: boolean };
  clearCreditChange: () => void;
  refreshBalance: () => void;
  onQuestionView: () => { success: boolean; cost: number };
  onVoiceInterview: (verdict: string) => { totalCredits: number; bonusCredits: number };
  onRedeemCoupon: (code: string) => { success: boolean; message: string; credits?: number };
  onQuestionSwipe: () => { shouldRemind: boolean };
  dismissVoiceReminder: () => void;
  shouldShowVoiceReminder: boolean;
  onQuizAnswer: (isCorrect: boolean) => { amount: number };
  onSRSReview: (rating: 'again' | 'hard' | 'good' | 'easy') => { amount: number };
  formatCredits: (amount: number) => string;
  canAfford: (amount: number) => boolean;
  config: typeof CREDIT_CONFIG;
  level: number;
  totalXP: number;
  streak: number;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const reward = useRewardContext();
  const [state, setState] = useState<CreditsState>(() => getCreditsState());
  const [history, setHistory] = useState<CreditTransaction[]>(() => getTransactionHistory());
  const [showVoiceReminder, setShowVoiceReminder] = useState(() => shouldShowVoiceReminder());
  const [creditChange, setCreditChange] = useState<{ amount: number; show: boolean }>({ amount: 0, show: false });

  const showCreditSplash = useCallback((amount: number) => {
    setCreditChange({ amount, show: true });
    setTimeout(() => {
      setCreditChange(prev => ({ ...prev, show: false }));
    }, 2000);
  }, []);

  const clearCreditChange = useCallback(() => {
    setCreditChange({ amount: 0, show: false });
  }, []);

  const refreshBalance = useCallback(() => {
    setState(getCreditsState());
    setHistory(getTransactionHistory());
    setShowVoiceReminder(shouldShowVoiceReminder());
    reward.refresh();
  }, [reward]);

  const onQuestionView = useCallback(() => {
    const result = deductQuestionViewCredits();
    if (result.success) {
      showCreditSplash(-result.cost);
      rewardStorage.spendCredits(result.cost);
      refreshBalance();
    }
    return { success: result.success, cost: result.cost };
  }, [refreshBalance, showCreditSplash, reward]);

  const onVoiceInterview = useCallback((verdict: string) => {
    const result = awardVoiceInterviewCredits(verdict);
    setShowVoiceReminder(false);
    showCreditSplash(result.totalCredits);
    reward.onVoiceInterview(verdict as any);
    refreshBalance();
    return { totalCredits: result.totalCredits, bonusCredits: result.bonusCredits };
  }, [refreshBalance, showCreditSplash, reward]);

  const onRedeemCoupon = useCallback((code: string) => {
    const result = redeemCoupon(code);
    if (result.success && result.newBalance !== undefined) {
      if (result.credits) {
        showCreditSplash(result.credits);
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
      showCreditSplash(result.amount);
      refreshBalance();
    }
    reward.onQuizAnswered(isCorrect);
    return { amount: result.amount };
  }, [refreshBalance, showCreditSplash, reward]);

  const onSRSReview = useCallback((rating: 'again' | 'hard' | 'good' | 'easy') => {
    const result = processSRSReview(rating);
    if (result.amount !== 0) {
      showCreditSplash(result.amount);
      refreshBalance();
    }
    reward.onSRSReview(rating);
    return { amount: result.amount };
  }, [refreshBalance, showCreditSplash, reward]);

  const canAffordCheck = useCallback((amount: number) => {
    return getCreditsState().balance >= amount;
  }, []);

  return (
    <CreditsContext.Provider
      value={{
        balance: getCreditsState().balance,
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
        level: reward.level,
        totalXP: reward.totalXP,
        streak: reward.streak,
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

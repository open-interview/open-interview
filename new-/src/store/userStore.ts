// Basic user store using local storage for now
import { create } from 'zustand';
import type { UserProfile } from '@/types/database';

interface UserStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  setProfile: (profile: UserProfile | null) => set({ profile }),
  updateProfile: (updates: Partial<UserProfile>) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),
}));
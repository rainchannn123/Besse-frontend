import { create } from 'zustand';
import { User } from '../types/auth';

export interface PairingStatus {
  isInQueue: boolean;
  position: number;
  estimatedWaitTime: number; // seconds
  isPaired: boolean;
  pairId: string | null;
  partnerSessionId: string | null;
  teamRole: 'Team A' | 'Team B' | null;
  pairStatus?: 'active' | 'team_a_eliminated' | 'team_b_eliminated' | 'completed' | null;
}

interface UserStore {
  // User data
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;

  // Pairing system
  pairingStatus: PairingStatus | null;
  setPairingStatus: (status: PairingStatus | null) => void;
  updatePairingStatus: (updates: Partial<PairingStatus>) => void;
  clearPairingStatus: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  // Initial user state
  currentUser: null,

  setCurrentUser: (user: User) => set({ currentUser: user }),

  updateUser: (updates: Partial<User>) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
    })),

  clearUser: () => set({ currentUser: null }),

  // Initial pairing state
  pairingStatus: null,

  setPairingStatus: (status: PairingStatus | null) => set({ pairingStatus: status }),

  updatePairingStatus: (updates: Partial<PairingStatus>) =>
    set((state) => ({
      pairingStatus: state.pairingStatus ? { ...state.pairingStatus, ...updates } : null,
    })),

  clearPairingStatus: () => set({ pairingStatus: null }),
}));

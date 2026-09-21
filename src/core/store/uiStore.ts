/**
 * UI Store — Zustand
 * College Knowledge Vault
 *
 * Global UI state management (toast, active tab, etc.).
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface UIState {
  activeTab: string;
  toastMessage: string | null;
  toastType: ToastType | null;
  isToastVisible: boolean;
  setActiveTab: (tab: string) => void;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'HomeTab',
  toastMessage: null,
  toastType: null,
  isToastVisible: false,

  setActiveTab: (tab: string) =>
    set({ activeTab: tab }),

  showToast: (message: string, type: ToastType) =>
    set({
      toastMessage: message,
      toastType: type,
      isToastVisible: true,
    }),

  hideToast: () =>
    set({
      toastMessage: null,
      toastType: null,
      isToastVisible: false,
    }),
}));

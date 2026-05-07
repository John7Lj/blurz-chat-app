import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'dark' | 'light';
  activeChatId: string | null;
  contactsPanelOpen: boolean;
  mobileSidebarOpen: boolean;

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setActiveChat: (chatId: string | null) => void;
  openContactsPanel: () => void;
  closeContactsPanel: () => void;
  toggleMobileSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeChatId: null,
      contactsPanelOpen: false,
      mobileSidebarOpen: true,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setActiveChat: (chatId) =>
        set({ activeChatId: chatId, contactsPanelOpen: false }),
      openContactsPanel: () => set({ contactsPanelOpen: true }),
      closeContactsPanel: () => set({ contactsPanelOpen: false }),
      toggleMobileSidebar: () =>
        set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
    }),
    {
      name: 'blurz-ui',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

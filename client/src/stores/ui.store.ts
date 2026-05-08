import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Timer handles stored outside Zustand to avoid serialization issues
const _typingTimers: Record<string, ReturnType<typeof setTimeout>> = {};

interface UIState {
  theme: 'dark' | 'light';
  activeChatId: string | null;
  contactsPanelOpen: boolean;
  mobileSidebarOpen: boolean;

  // Typing indicator: chatId → userId currently typing
  typingUsers: Record<string, string>;

  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setActiveChat: (chatId: string | null) => void;
  openContactsPanel: () => void;
  closeContactsPanel: () => void;
  toggleMobileSidebar: () => void;
  setTyping: (chatId: string, userId: string) => void;
  clearTyping: (chatId: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeChatId: null,
      contactsPanelOpen: false,
      mobileSidebarOpen: true,
      typingUsers: {},

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setActiveChat: (chatId) =>
        set({ activeChatId: chatId, contactsPanelOpen: false }),
      openContactsPanel: () => set({ contactsPanelOpen: true }),
      closeContactsPanel: () => set({ contactsPanelOpen: false }),
      toggleMobileSidebar: () =>
        set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

      setTyping: (chatId, userId) => {
        // Clear existing timer for this chat
        if (_typingTimers[chatId]) clearTimeout(_typingTimers[chatId]);

        // Auto-clear after 3 seconds of no new typing events
        _typingTimers[chatId] = setTimeout(() => {
          set((s) => {
            const next = { ...s.typingUsers };
            delete next[chatId];
            return { typingUsers: next };
          });
          delete _typingTimers[chatId];
        }, 3000);

        set((s) => ({
          typingUsers: { ...s.typingUsers, [chatId]: userId },
        }));
      },

      clearTyping: (chatId) => {
        if (_typingTimers[chatId]) {
          clearTimeout(_typingTimers[chatId]);
          delete _typingTimers[chatId];
        }
        set((s) => {
          const next = { ...s.typingUsers };
          delete next[chatId];
          return { typingUsers: next };
        });
      },
    }),
    {
      name: 'blurz-ui',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

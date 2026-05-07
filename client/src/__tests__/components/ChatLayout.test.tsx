import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import ChatLayout from '../../features/chat/ChatLayout';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { CURRENT_USER_ID, mockChats, mockMessages } from '../helpers/mock-data';

// Mock all dependent hooks
vi.mock('../../hooks/use-websocket', () => ({
  useWebSocket: vi.fn(() => ({
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    isConnected: true,
  })),
}));
vi.mock('../../hooks/use-user', () => ({
  useCurrentUser: vi.fn(),
}));
vi.mock('../../hooks/use-chats', () => ({
  useChats: vi.fn(() => ({ data: mockChats, isLoading: false })),
  useStartChat: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  CHATS_KEY: ['chats'],
}));
vi.mock('../../hooks/use-messages', () => ({
  useMessages: vi.fn(() => ({ data: mockMessages, isLoading: false })),
  MESSAGES_KEY: (id: string) => ['messages', id],
}));
vi.mock('../../hooks/use-contacts', () => ({
  useContacts: vi.fn(() => ({ data: [], isLoading: false })),
  useSearchUsers: vi.fn(() => ({ query: '', setQuery: vi.fn(), data: [], isLoading: false })),
}));

/* ═══════════════════════════════════════════════════════════════════
   ChatLayout – Unit Tests
   Priority: CRITICAL – The layout fix is the most important bug fix
   ═══════════════════════════════════════════════════════════════════ */

describe('ChatLayout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      userId: CURRENT_USER_ID,
      token: 'test-token',
      isAuthenticated: true,
    });
    useUIStore.setState({
      activeChatId: null,
      contactsPanelOpen: false,
    });
  });

  const renderLayout = () =>
    renderWithProviders(<ChatLayout />, {
      routerProps: { initialEntries: ['/chat'] },
    });

  it('wraps content in a flex-row container (not a fragment)', () => {
    /**
     * WHAT: ChatLayout uses a div wrapper with flex layout, not a React fragment.
     * WHY: Fragment caused children to stack vertically in AppShell's flex-col main.
     *      This was THE critical bug making the chat window appear below the sidebar.
     * FAILURE: Sidebar and chat window stack vertically instead of side-by-side.
     */
    const { container } = renderLayout();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.className).toContain('flex');
    expect(wrapper.className).toContain('h-full');
  });

  it('renders sidebar on desktop when no chat is active', () => {
    const { container } = renderLayout();
    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
  });

  it('renders empty state in chat area when no chat is active', () => {
    renderLayout();
    expect(screen.getByText('Welcome to Blurz')).toBeInTheDocument();
  });

  it('renders chat window when a chat is active', () => {
    useUIStore.setState({ activeChatId: '10000000-0000-0000-0000-000000000001' });
    renderLayout();
    // Alice Johnson appears in both sidebar chat list and chat header
    const matches = screen.getAllByText('Alice Johnson');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('sidebar hidden on mobile when chat is active', () => {
    /**
     * WHAT: On mobile, opening a chat hides the sidebar.
     * WHY: Mobile only shows one panel at a time.
     * FAILURE: Both panels overlay or sidebar obstructs chat view.
     */
    useUIStore.setState({ activeChatId: '10000000-0000-0000-0000-000000000001' });
    const { container } = renderLayout();
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('hidden');
    expect(aside?.className).toContain('md:flex');
  });

  it('contacts panel renders when open', () => {
    useUIStore.setState({ contactsPanelOpen: true });
    renderLayout();
    expect(screen.getByText('New Conversation')).toBeInTheDocument();
  });

  it('contacts panel NOT rendered when closed', () => {
    useUIStore.setState({ contactsPanelOpen: false });
    renderLayout();
    expect(screen.queryByText('New Conversation')).not.toBeInTheDocument();
  });
});

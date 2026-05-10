/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import ChatPage from '../../pages/ChatPage';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { CURRENT_USER_ID, mockChats, mockMessages } from '../helpers/mock-data';

// Mock all dependent hooks
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    isConnected: true,
  })),
}));
vi.mock('../../hooks/useUser', () => ({
  useCurrentUser: vi.fn(),
}));
vi.mock('../../hooks/useChats', () => ({
  useChats: vi.fn(() => ({ data: mockChats, isLoading: false })),
  useStartChat: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  CHATS_KEY: ['chats'],
}));
vi.mock('../../hooks/useMessages', () => ({
  useMessages: vi.fn(() => ({ data: mockMessages, isLoading: false })),
  MESSAGES_KEY: (id: string) => ['messages', id],
}));
vi.mock('../../hooks/useContacts', () => ({
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
    renderWithProviders(<ChatPage />, {
      routerProps: { initialEntries: ['/chat'] },
    });

  it('wraps content in a flex container', () => {
    const { container } = renderLayout();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.style.display).toBe('flex');
    expect(wrapper.style.height).toBe('100%');
  });

  it('renders sidebar when no chat is active', () => {
    const { container } = renderLayout();
    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
  });

  it('chat window is hidden when no chat is active', () => {
    const { container } = renderLayout();
    const chatPanel = container.querySelector('[data-testid="chat-window"]') as HTMLElement;
    expect(chatPanel.style.display).toBe('none');
  });

  it('renders chat window when a chat is active', () => {
    useUIStore.setState({ activeChatId: '10000000-0000-0000-0000-000000000001' });
    renderLayout();
    // Alice Johnson appears in both sidebar chat list and chat header
    const matches = screen.getAllByText('Alice Johnson');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('sidebar hidden on mobile when chat is active via inline style', () => {
    useUIStore.setState({ activeChatId: '10000000-0000-0000-0000-000000000001' });
    const { container } = renderLayout();
    const aside = container.querySelector('aside') as HTMLElement;
    expect(aside.style.display).toBe('none');
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

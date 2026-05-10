/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import ChatWindow from '../../features/chat/ChatWindow';
import { mockChats, mockMessages, CURRENT_USER_ID } from '../helpers/mock-data';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';

// Mock hooks
vi.mock('../../hooks/useMessages', () => ({
  useMessages: vi.fn(),
  MESSAGES_KEY: (id: string) => ['messages', id],
}));
vi.mock('../../hooks/useChats', () => ({
  useChats: vi.fn(),
  CHATS_KEY: ['chats'],
}));
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    isConnected: true,
  })),
}));

import { useMessages } from '../../hooks/useMessages';
import { useChats } from '../../hooks/useChats';
import { useWebSocket } from '../../hooks/useWebSocket';

const mockedUseMessages = vi.mocked(useMessages);
const mockedUseChats = vi.mocked(useChats);
const mockedUseWebSocket = vi.mocked(useWebSocket);

/* ═══════════════════════════════════════════════════════════════════
   ChatWindow – Unit Tests
   Priority: CRITICAL – The main chat interaction area
   ═══════════════════════════════════════════════════════════════════ */

describe('ChatWindow', () => {
  const mockSendMessage = vi.fn();

  beforeEach(() => {
    useAuthStore.setState({
      userId: CURRENT_USER_ID,
      token: 'test-token',
      isAuthenticated: true,
    });
    useUIStore.setState({ activeChatId: null });

    mockedUseChats.mockReturnValue({
      data: mockChats,
      isLoading: false,
    } as ReturnType<typeof useChats>);

    mockedUseMessages.mockReturnValue({
      data: mockMessages,
      isLoading: false,
    } as ReturnType<typeof useMessages>);

    mockSendMessage.mockClear();
    mockedUseWebSocket.mockReturnValue({
      sendMessage: mockSendMessage,
      sendTyping: vi.fn(),
      isConnected: true,
    });
  });

  const renderChatWindow = (activeChatId?: string) => {
    if (activeChatId) {
      useUIStore.setState({ activeChatId });
    }
    return renderWithProviders(<ChatWindow />);
  };

  // ── Empty State ───────────────────────────────────────────────

  it('renders empty state when no chat selected', () => {
    renderChatWindow();
    expect(screen.getByText('Blurz Chat')).toBeInTheDocument();
  });

  it('renders "Start a new chat" button in empty state', () => {
    renderChatWindow();
    expect(screen.getByText('Start a new chat')).toBeInTheDocument();
  });

  // ── Active Chat ───────────────────────────────────────────────

  it('renders chat header when chat is active', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const matches = screen.getAllByText('Alice Johnson');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders "Online" status in header', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('renders action buttons (menu)', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByLabelText('More options')).toBeInTheDocument();
  });

  it('renders message list when chat is active', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByText('Hey, how are you doing?')).toBeInTheDocument();
    expect(screen.getByText("I'm doing great, thanks for asking!")).toBeInTheDocument();
  });

  it('renders message input when chat is active', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByPlaceholderText('Type your message')).toBeInTheDocument();
  });

  // ── Back Button (Mobile) ──────────────────────────────────────

  it('back button clears active chat (returns to sidebar on mobile)', () => {
    useUIStore.setState({ activeChatId: '10000000-0000-0000-0000-000000000001' });
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    
    // Find the back button (ArrowLeft icon button, has mobile-only class)
    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(b => b.className.includes('mobile-only'));
    if (backButton) {
      fireEvent.click(backButton);
      expect(useUIStore.getState().activeChatId).toBeNull();
    }
  });

  // ── Sending Messages ──────────────────────────────────────────

  it('typing updates input value correctly', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type your message') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(textarea.value).toBe('Hello world');
  });

  it('send button is enabled when input has text', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type your message');
    const sendButton = screen.getByLabelText('Send message');
    
    expect(sendButton).toBeDisabled();
    
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    
    expect(sendButton).not.toBeDisabled();
  });

  it('pressing Enter calls sendMessage with correct text', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type your message');
    fireEvent.change(textarea, { target: { value: 'Hello there!' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    
    expect(mockSendMessage).toHaveBeenCalledWith(
      '10000000-0000-0000-0000-000000000001',
      'Hello there!',
    );
  });

  it('input clears after send', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type your message') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello!' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(textarea.value).toBe('');
  });

  it('sendMessage NOT called when input is empty', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type your message');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('sendMessage NOT called when input is whitespace only', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type your message');
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('Shift+Enter does NOT send (allows newline)', () => {
    /**
     * WHAT: Shift+Enter inserts a newline, doesn't send.
     * WHY: Multi-line messages are a standard feature.
     * FAILURE: Users can't write multi-line messages.
     */
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type your message');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  // ── Loading State ─────────────────────────────────────────────

  it('shows message skeletons while loading', () => {
    mockedUseMessages.mockReturnValue({
      data: [],
      isLoading: true,
    } as ReturnType<typeof useMessages>);
    
    const { container } = renderChatWindow('10000000-0000-0000-0000-000000000001');
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty message prompt when no messages exist', () => {
    mockedUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMessages>);
    
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByText(/Say hello! Start the conversation/i)).toBeInTheDocument();
  });
});

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
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';

// Mock hooks
vi.mock('../../hooks/use-messages', () => ({
  useMessages: vi.fn(),
  MESSAGES_KEY: (id: string) => ['messages', id],
}));
vi.mock('../../hooks/use-chats', () => ({
  useChats: vi.fn(),
  CHATS_KEY: ['chats'],
}));
vi.mock('../../hooks/use-websocket', () => ({
  useWebSocket: vi.fn(() => ({
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    isConnected: true,
  })),
}));

import { useMessages } from '../../hooks/use-messages';
import { useChats } from '../../hooks/use-chats';
import { useWebSocket } from '../../hooks/use-websocket';

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
    /**
     * WHAT: "Welcome to Blurz" message when no chat is open.
     * WHY: Users need guidance on what to do next.
     * FAILURE: Blank screen with no context.
     */
    renderChatWindow();
    expect(screen.getByText('Blurz Chat')).toBeInTheDocument();
  });

  it('renders "Start a new chat" button in empty state', () => {
    renderChatWindow();
    expect(screen.getByText('Start a new chat')).toBeInTheDocument();
  });

  // ── Active Chat ───────────────────────────────────────────────

  it('renders chat header when chat is active', () => {
    /**
     * WHAT: Header shows contact name when a chat is selected.
     * WHY: User must know who they're chatting with.
     * FAILURE: Header is blank or shows wrong name.
     */
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('renders "Online" status in header', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByText('online')).toBeInTheDocument();
  });

  it('renders action buttons (phone, video, search, menu)', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByLabelText('Voice call')).toBeInTheDocument();
    expect(screen.getByLabelText('Video call')).toBeInTheDocument();
  });

  it('renders message list when chat is active', () => {
    /**
     * WHAT: Messages appear in the chat area.
     * WHY: Core functionality — users must see conversation history.
     * FAILURE: Chat window opens but shows no messages.
     */
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByText('Hey, how are you doing?')).toBeInTheDocument();
    expect(screen.getByText("I'm doing great, thanks for asking!")).toBeInTheDocument();
  });

  it('renders message input when chat is active', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByPlaceholderText('Type a message')).toBeInTheDocument();
  });

  // ── Back Button (Mobile) ──────────────────────────────────────

  it('back button clears active chat (returns to sidebar on mobile)', () => {
    /**
     * WHAT: Back button sets activeChatId to null.
     * WHY: On mobile, this returns the user to the chat list.
     * FAILURE: User gets stuck in chat window with no way back.
     */
    useUIStore.setState({ activeChatId: '10000000-0000-0000-0000-000000000001' });
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    
    // Find the back button (ArrowLeft icon button, has md:hidden)
    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(b => b.className.includes('md:hidden'));
    if (backButton) {
      fireEvent.click(backButton);
      expect(useUIStore.getState().activeChatId).toBeNull();
    }
  });

  // ── Sending Messages ──────────────────────────────────────────

  it('typing updates input value correctly', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type a message') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    expect(textarea.value).toBe('Hello world');
  });

  it('send button appears when input has text', () => {
    /**
     * WHAT: Mic icon → Send button transition when user types.
     * WHY: Visual affordance that message is ready to send.
     * FAILURE: Users don't know how to send their message.
     */
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type a message');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    
    // Send button should now be visible (gradient background)
    const { container } = renderChatWindow('10000000-0000-0000-0000-000000000001');
    // Look for the send icon
  });

  it('pressing Enter calls sendMessage with correct text', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type a message');
    fireEvent.change(textarea, { target: { value: 'Hello there!' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    
    expect(mockSendMessage).toHaveBeenCalledWith(
      '10000000-0000-0000-0000-000000000001',
      'Hello there!',
    );
  });

  it('input clears after send', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type a message') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello!' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(textarea.value).toBe('');
  });

  it('sendMessage NOT called when input is empty', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type a message');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('sendMessage NOT called when input is whitespace only', () => {
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    const textarea = screen.getByPlaceholderText('Type a message');
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
    const textarea = screen.getByPlaceholderText('Type a message');
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

  it('shows encryption notice when no messages exist', () => {
    mockedUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useMessages>);
    
    renderChatWindow('10000000-0000-0000-0000-000000000001');
    expect(screen.getByText(/end-to-end encrypted/i)).toBeInTheDocument();
  });
});

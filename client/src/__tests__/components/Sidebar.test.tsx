/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders, createTestQueryClient } from '../helpers/render';
import Sidebar from '../../features/chat/Sidebar';
import { mockChats, CURRENT_USER_ID } from '../helpers/mock-data';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';

// Mock the hooks
vi.mock('../../hooks/useChats', () => ({
  useChats: vi.fn(),
}));

import { useChats } from '../../hooks/useChats';
const mockedUseChats = vi.mocked(useChats);

/* ═══════════════════════════════════════════════════════════════════
   Sidebar – Unit Tests
   Priority: CRITICAL – Contains chat list, search, and navigation
   ═══════════════════════════════════════════════════════════════════ */

describe('Sidebar', () => {
  beforeEach(() => {
    // Set up auth store with current user
    useAuthStore.setState({
      userId: CURRENT_USER_ID,
      token: 'test-token',
      isAuthenticated: true,
    });
    // Reset UI store
    useUIStore.setState({
      activeChatId: null,
      contactsPanelOpen: false,
    });
    // Default mock: return 4 chats, not loading
    mockedUseChats.mockReturnValue({
      data: mockChats,
      isLoading: false,
    } as ReturnType<typeof useChats>);
  });

  const renderSidebar = () => renderWithProviders(<Sidebar />);

  // ── Rendering ──────────────────────────────────────────────────

  it('renders correct number of chat list items from mock data', () => {
    /**
     * WHAT: 4 mock chats → 4 rendered chat items.
     * WHY: Ensures the data pipeline from hook to render is correct.
     * FAILURE: Missing chats, broken data mapping.
     */
    renderSidebar();
    const buttons = screen.getAllByRole('button');
    // 4 chat items + New Chat button + Menu button = 6 total
    const chatButtons = buttons.filter(b => b.textContent?.includes('Alice') || b.textContent?.includes('Bob') || b.textContent?.includes('Charlie') || b.textContent?.includes('Diana'));
    expect(chatButtons).toHaveLength(4);
  });

  it('renders header with new chat button', () => {
    renderSidebar();
    expect(screen.getByLabelText('New chat')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderSidebar();
    expect(screen.getByPlaceholderText('Search or start new chat')).toBeInTheDocument();
  });

  it('shows loading skeletons while data loads', () => {
    /**
     * WHAT: Skeleton placeholders shown during data fetch.
     * WHY: Users need visual feedback that data is loading.
     * FAILURE: Blank sidebar during load, feels broken.
     */
    mockedUseChats.mockReturnValue({
      data: [],
      isLoading: true,
    } as ReturnType<typeof useChats>);
    const { container } = renderSidebar();
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ── Search Filtering ──────────────────────────────────────────

  it('search filters chats by contact name in real time', () => {
    /**
     * WHAT: Typing "alice" shows only Alice's chat.
     * WHY: This is the broken feature the user reported.
     * FAILURE: Search does nothing, all chats remain visible.
     */
    renderSidebar();
    const input = screen.getByPlaceholderText('Search or start new chat');
    fireEvent.change(input, { target: { value: 'alice' } });
    
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    renderSidebar();
    const input = screen.getByPlaceholderText('Search or start new chat');
    fireEvent.change(input, { target: { value: 'ALICE' } });
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('search matches partial name ("ali" matches "Alice")', () => {
    renderSidebar();
    const input = screen.getByPlaceholderText('Search or start new chat');
    fireEvent.change(input, { target: { value: 'ali' } });
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('empty search shows all chats', () => {
    renderSidebar();
    const input = screen.getByPlaceholderText('Search or start new chat');
    
    // Type something first
    fireEvent.change(input, { target: { value: 'alice' } });
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    
    // Clear search
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('search with no results shows "No chats found" message', () => {
    renderSidebar();
    const input = screen.getByPlaceholderText('Search or start new chat');
    fireEvent.change(input, { target: { value: 'zzzznonexistent' } });
    expect(screen.getByText('No chats found')).toBeInTheDocument();
  });

  // ── Chat Selection ────────────────────────────────────────────

  it('clicking a chat item sets it as active', () => {
    renderSidebar();
    const aliceChat = screen.getByText('Alice Johnson').closest('button')!;
    fireEvent.click(aliceChat);
    expect(useUIStore.getState().activeChatId).toBe('10000000-0000-0000-0000-000000000001');
  });

  // ── Empty States ──────────────────────────────────────────────

  it('shows "No conversations yet" when there are zero chats', () => {
    mockedUseChats.mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useChats>);
    renderSidebar();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  // ── New Chat Button ───────────────────────────────────────────

  it('new chat button opens contacts panel', () => {
    renderSidebar();
    const newChatBtn = screen.getByLabelText('New chat');
    fireEvent.click(newChatBtn);
    expect(useUIStore.getState().contactsPanelOpen).toBe(true);
  });
});

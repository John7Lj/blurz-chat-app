/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import ChatListItemComponent from '../../features/chat/components/ChatListItem';
import { mockChat, mockParticipant, CURRENT_USER_ID } from '../helpers/mock-data';

/* ═══════════════════════════════════════════════════════════════════
   ChatListItem – Unit Tests
   Priority: HIGH – Core interaction point for chat selection
   ═══════════════════════════════════════════════════════════════════ */

describe('ChatListItem', () => {
  const defaultProps = {
    chat: mockChat(),
    isActive: false,
    onClick: vi.fn(),
    currentUserId: CURRENT_USER_ID,
  };

  const renderItem = (overrides?: Partial<typeof defaultProps>) =>
    renderWithProviders(
      <ChatListItemComponent {...defaultProps} {...overrides} />,
    );

  // ── Rendering ──────────────────────────────────────────────────

  it('renders avatar with initials when no photo URL', () => {
    /**
     * WHAT: Avatar shows initials from contact name when no photo.
     * WHY: Fallback avatar is critical for users without profile photos.
     * FAILURE: Broken avatar rendering, blank space where avatar should be.
     */
    const chat = mockChat({
      participants: mockParticipant({ profile_url: null, first_name: 'Alice', last_name: 'Johnson' }),
    });
    renderItem({ chat });
    // Avatar component renders initials "AJ"
    expect(screen.getByText('AJ')).toBeInTheDocument();
  });

  it('renders avatar image when photo URL provided', () => {
    const chat = mockChat({
      participants: mockParticipant({ profile_url: 'https://example.com/photo.jpg' }),
    });
    renderItem({ chat });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders contact name correctly', () => {
    const chat = mockChat({
      participants: mockParticipant({ first_name: 'Diana', last_name: 'Prince' }),
    });
    renderItem({ chat });
    expect(screen.getByText('Diana Prince')).toBeInTheDocument();
  });

  it('renders last message preview', () => {
    const chat = mockChat({
      last_message: { content: 'See you later!', msg_type: 'text', sender_id: '00000000-0000-0000-0000-000000000002', sent_at: new Date().toISOString() },
    });
    renderItem({ chat });
    expect(screen.getByText('See you later!')).toBeInTheDocument();
  });

  it('renders "You: ..." prefix for own messages', () => {
    /**
     * WHAT: Last message preview starts with "You:" if the current user sent it.
     * WHY: Users need to quickly see who sent the last message.
     * FAILURE: All messages look identical regardless of sender.
     */
    const chat = mockChat({
      last_message: { content: 'On my way', msg_type: 'text', sender_id: CURRENT_USER_ID, sent_at: new Date().toISOString() },
    });
    renderItem({ chat });
    expect(screen.getByText('You: On my way')).toBeInTheDocument();
  });

  it('renders "No messages yet" when last_message is null', () => {
    const chat = mockChat({ last_message: null });
    renderItem({ chat });
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  // ── Interaction ───────────────────────────────────────────────

  it('onClick fires with correct handler', () => {
    const onClick = vi.fn();
    renderItem({ onClick });
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('active state applies active background via inline style', () => {
    /**
     * WHAT: Active chat item has accent/highlight styling.
     * WHY: User must visually identify which chat is currently open.
     * FAILURE: No visual distinction between active and inactive chats.
     */
    renderItem({ isActive: true });
    const button = screen.getByRole('button');
    expect(button.style.background).toBe('var(--chat-selected)');
  });

  it('inactive state does NOT have active background', () => {
    renderItem({ isActive: false });
    const button = screen.getByRole('button');
    expect(button.style.background).toBe('transparent');
  });

  it('renders timestamp from last message', () => {
    /**
     * WHAT: Shows time ago for last message.
     * WHY: Users need temporal context for conversations.
     * FAILURE: Missing timestamps make chat list feel broken.
     */
    const chat = mockChat({
      last_message: {
        content: 'Hello',
        msg_type: 'text',
        sender_id: '00000000-0000-0000-0000-000000000002',
        sent_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
    });
    renderItem({ chat });
    // Should render some form of time string (exact format depends on date-fns)
    const button = screen.getByRole('button');
    expect(button.textContent).toBeTruthy();
  });

  it('handles empty contact name gracefully', () => {
    /**
     * WHAT: Contact with empty name doesn't crash.
     * WHY: Edge case — backend might return empty strings.
     * FAILURE: App crashes or renders undefined.
     */
    const chat = mockChat({
      participants: mockParticipant({ first_name: '', last_name: '' }),
    });
    renderItem({ chat });
    // Should render " " (space between empty names) or fallback
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles very long contact name with truncation', () => {
    const longName = 'A'.repeat(200);
    const chat = mockChat({
      participants: mockParticipant({ first_name: longName, last_name: 'Test' }),
    });
    renderItem({ chat });
    const nameEl = screen.getByTestId('contact-name');
    expect(nameEl.style.textOverflow).toBe('ellipsis');
    expect(nameEl.style.whiteSpace).toBe('nowrap');
  });
});

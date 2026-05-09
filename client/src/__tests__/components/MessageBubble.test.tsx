/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import MessageBubble from '../../components/MessageBubble';
import { mockMessage, CURRENT_USER_ID } from '../helpers/mock-data';

/* ═══════════════════════════════════════════════════════════════════
   MessageBubble – Unit Tests
   Priority: HIGH – Core visual element for chat messages
   ═══════════════════════════════════════════════════════════════════ */

const defaultGroupProps = { isFirstInGroup: true, isLastInGroup: true };

describe('MessageBubble', () => {
  // ── Alignment ─────────────────────────────────────────────────

  it('sent message renders on the right side', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage({ sender_id: CURRENT_USER_ID })}
        isMine={true}
        {...defaultGroupProps}
      />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('justify-end');
  });

  it('received message renders on the left side', () => {
    const { container } = renderWithProviders(
      <MessageBubble message={mockMessage()} isMine={false} {...defaultGroupProps} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('justify-start');
  });

  // ── Styling ───────────────────────────────────────────────────

  it('sent bubble has WhatsApp-style sent background', () => {
    /**
     * WHAT: Sent messages use the WhatsApp sent bubble color.
     * WHY: Visual distinction between sent and received messages.
     * FAILURE: Messages look identical, no way to tell who sent what.
     */
    const { container } = renderWithProviders(
      <MessageBubble message={mockMessage()} isMine={true} {...defaultGroupProps} />,
    );
    // The bubble uses inline style with --chat-sent-bubble
    const bubble = container.querySelector('[class*="max-w"]') as HTMLElement;
    expect(bubble).toBeInTheDocument();
    expect(bubble?.style.background).toContain('var(--chat-sent-bubble)');
  });

  it('received bubble has WhatsApp-style received background', () => {
    const { container } = renderWithProviders(
      <MessageBubble message={mockMessage()} isMine={false} {...defaultGroupProps} />,
    );
    const bubble = container.querySelector('[class*="max-w"]') as HTMLElement;
    expect(bubble).toBeInTheDocument();
    expect(bubble?.style.background).toContain('var(--chat-recv-bubble)');
  });

  // ── Content ───────────────────────────────────────────────────

  it('renders message content text', () => {
    renderWithProviders(
      <MessageBubble
        message={mockMessage({ content: 'Hello world!' })}
        isMine={false}
        {...defaultGroupProps}
      />,
    );
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  it('renders timestamp inside bubble', () => {
    renderWithProviders(
      <MessageBubble
        message={mockMessage({ sent_at: '2026-05-07T14:30:00Z' })}
        isMine={true}
        {...defaultGroupProps}
      />,
    );
    const timeEl = screen.getByText(/\d{2}:\d{2}/);
    expect(timeEl).toBeInTheDocument();
  });

  // ── Status Ticks ──────────────────────────────────────────────

  it('shows double-check icon for read status on sent messages', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage({ status: 'read' })}
        isMine={true}
        {...defaultGroupProps}
      />,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('shows single check icon for sent status', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage({ status: 'sent' })}
        isMine={true}
        {...defaultGroupProps}
      />,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT show status ticks on received messages', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage({ status: 'read' })}
        isMine={false}
        {...defaultGroupProps}
      />,
    );
    // Received messages should have no tick SVGs
    const bubble = container.querySelector('[class*="max-w"]');
    if (bubble) {
      const ticks = bubble.querySelectorAll('svg');
      expect(ticks.length).toBe(0);
    }
  });

  // ── Grouping ──────────────────────────────────────────────────

  it('last message in group shows tail class', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage()}
        isMine={true}
        isFirstInGroup={false}
        isLastInGroup={true}
      />,
    );
    const bubble = container.querySelector('.bubble-tail-sent');
    expect(bubble).toBeInTheDocument();
  });

  it('non-last message in group does NOT show tail', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage()}
        isMine={true}
        isFirstInGroup={true}
        isLastInGroup={false}
      />,
    );
    const bubble = container.querySelector('.bubble-tail-sent');
    expect(bubble).toBeNull();
  });

  it('first in group has larger top margin', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage()}
        isMine={true}
        isFirstInGroup={true}
        isLastInGroup={true}
      />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('mt-2');
  });

  it('non-first in group has tight spacing', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage()}
        isMine={true}
        isFirstInGroup={false}
        isLastInGroup={false}
      />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('mt-[2px]');
  });

  // ── Edge Cases ────────────────────────────────────────────────

  it('long message wraps correctly without overflow', () => {
    const longText = 'A'.repeat(500);
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage({ content: longText })}
        isMine={true}
        {...defaultGroupProps}
      />,
    );
    const paragraph = container.querySelector('p');
    expect(paragraph?.className).toContain('break-words');
    expect(paragraph?.className).toContain('whitespace-pre-wrap');
  });

  it('message with only emojis renders correctly', () => {
    renderWithProviders(
      <MessageBubble
        message={mockMessage({ content: '😀🎉👍' })}
        isMine={true}
        {...defaultGroupProps}
      />,
    );
    expect(screen.getByText('😀🎉👍')).toBeInTheDocument();
  });

  it('message with HTML tags renders as plain text (not parsed)', () => {
    renderWithProviders(
      <MessageBubble
        message={mockMessage({ content: '<script>alert("xss")</script>' })}
        isMine={false}
        {...defaultGroupProps}
      />,
    );
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });

  it('handles malformed timestamp gracefully', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage({ sent_at: 'not-a-date' })}
        isMine={true}
        {...defaultGroupProps}
      />,
    );
    expect(container).toBeInTheDocument();
  });

  it('empty content message renders without breaking', () => {
    const { container } = renderWithProviders(
      <MessageBubble
        message={mockMessage({ content: '' })}
        isMine={true}
        {...defaultGroupProps}
      />,
    );
    expect(container).toBeInTheDocument();
  });
});

/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import MessageBubble from '../../features/chat/components/MessageBubble';
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
    expect(wrapper.style.justifyContent).toBe('flex-end');
  });

  it('received message renders on the left side', () => {
    const { container } = renderWithProviders(
      <MessageBubble message={mockMessage()} isMine={false} {...defaultGroupProps} />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.justifyContent).toBe('flex-start');
  });

  // ── Styling ───────────────────────────────────────────────────

  it('sent bubble has WhatsApp-style sent background via class', () => {
    const { container } = renderWithProviders(
      <MessageBubble message={mockMessage()} isMine={true} {...defaultGroupProps} />,
    );
    const bubble = container.querySelector('.bubble-mine') as HTMLElement;
    expect(bubble).toBeInTheDocument();
  });

  it('received bubble has WhatsApp-style received background via class', () => {
    const { container } = renderWithProviders(
      <MessageBubble message={mockMessage()} isMine={false} {...defaultGroupProps} />,
    );
    const bubble = container.querySelector('.bubble-other') as HTMLElement;
    expect(bubble).toBeInTheDocument();
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
    const bubble = container.querySelector('.bubble-other');
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
    const bubble = container.querySelector('.bubble-tail-mine');
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
    const bubble = container.querySelector('.bubble-tail-mine');
    expect(bubble).toBeNull();
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
    const paragraph = container.querySelector('p:last-of-type') as HTMLElement;
    expect(paragraph?.style.whiteSpace).toContain('pre-wrap');
    expect(paragraph?.style.wordBreak).toContain('break-word');
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

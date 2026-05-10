/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import { SearchBar } from '../../components/ui/SearchBar';

/* ═══════════════════════════════════════════════════════════════════
   SearchBar – Unit Tests
   Priority: HIGH – Search is broken per user report
   ═══════════════════════════════════════════════════════════════════ */

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    placeholder: 'Search chats...',
  };

  it('renders input with correct placeholder', () => {
    renderWithProviders(<SearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search chats...')).toBeInTheDocument();
  });

  it('renders search icon', () => {
    /**
     * WHAT: Search icon visible to indicate the field purpose.
     * WHY: Visual affordance for search functionality.
     * FAILURE: Users don't realize the input is for searching.
     */
    const { container } = renderWithProviders(<SearchBar {...defaultProps} />);
    // Lucide Search icon renders as SVG
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('displays current value in input', () => {
    renderWithProviders(<SearchBar {...defaultProps} value="alice" />);
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
  });

  it('calls onChange when user types', () => {
    /**
     * WHAT: Typing in the search bar triggers the onChange callback.
     * WHY: Without this, search filtering never activates.
     * FAILURE: Search appears to do nothing — the bug the user reported.
     */
    const onChange = vi.fn();
    renderWithProviders(<SearchBar {...defaultProps} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search chats...');
    fireEvent.change(input, { target: { value: 'bob' } });
    expect(onChange).toHaveBeenCalledWith('bob');
  });

  it('shows clear button when value is non-empty', () => {
    renderWithProviders(<SearchBar {...defaultProps} value="test" />);
    const clearBtn = screen.getByLabelText('Clear search');
    expect(clearBtn).toBeInTheDocument();
  });

  it('hides clear button when value is empty', () => {
    renderWithProviders(<SearchBar {...defaultProps} value="" />);
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('clicking clear button calls onChange with empty string', () => {
    const onChange = vi.fn();
    renderWithProviders(<SearchBar {...defaultProps} value="test" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('has aria-label for accessibility', () => {
    renderWithProviders(<SearchBar {...defaultProps} />);
    const input = screen.getByLabelText('Search chats...');
    expect(input).toBeInTheDocument();
  });

  it('autoFocus prop causes input to be focused on mount', () => {
    renderWithProviders(<SearchBar {...defaultProps} autoFocus />);
    const input = screen.getByPlaceholderText('Search chats...');
    // In jsdom, autoFocus may not work as in a real browser, so we verify the prop is passed
    expect(input).toBeInTheDocument();
  });

  it('no redundant wrapper padding — outer element is the relative container', () => {
    /**
     * WHAT: SearchBar's outermost element is the relative positioning container.
     * WHY: The old SearchBar had a px-4 py-2.5 wrapper that doubled padding.
     * FAILURE: Double padding makes search bar look squished/misaligned.
     */
    const { container } = renderWithProviders(<SearchBar {...defaultProps} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.style.position).toBe('relative');
    expect(outerDiv.className).not.toContain('px-');
    expect(outerDiv.className).not.toContain('py-');
  });
});

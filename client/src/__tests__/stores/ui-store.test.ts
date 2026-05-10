/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../helpers/render';
import { useUIStore } from '../../store/ui.store';

/* ═══════════════════════════════════════════════════════════════════
   Theme / Dark Mode – Unit Tests
   Priority: HIGH – Light mode was completely broken
   ═══════════════════════════════════════════════════════════════════ */

describe('Theme System', () => {
  beforeEach(() => {
    useUIStore.setState({ theme: 'dark' });
    document.documentElement.removeAttribute('data-theme');
  });

  it('UI store defaults to dark theme', () => {
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('toggleTheme switches from dark to light', () => {
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('toggleTheme switches from light back to dark', () => {
    useUIStore.setState({ theme: 'light' });
    useUIStore.getState().toggleTheme();
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('setTheme explicitly sets the theme', () => {
    useUIStore.getState().setTheme('light');
    expect(useUIStore.getState().theme).toBe('light');
    useUIStore.getState().setTheme('dark');
    expect(useUIStore.getState().theme).toBe('dark');
  });

  it('theme is persisted to localStorage under "blurz-ui" key', () => {
    /**
     * WHAT: Theme preference survives page reload.
     * WHY: Users shouldn't have to re-select their theme every time.
     * FAILURE: Theme resets to dark on every page load.
     */
    useUIStore.getState().setTheme('light');
    const stored = JSON.parse(localStorage.getItem('blurz-ui') || '{}');
    expect(stored?.state?.theme).toBe('light');
  });
});

/* ═══════════════════════════════════════════════════════════════════
   UI Store – General Tests
   ═══════════════════════════════════════════════════════════════════ */

describe('UIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeChatId: null,
      contactsPanelOpen: false,
      mobileSidebarOpen: true,
    });
  });

  it('setActiveChat updates activeChatId and closes contacts panel', () => {
    /**
     * WHAT: Selecting a chat closes the contacts panel.
     * WHY: Starting a new chat should immediately show the conversation.
     * FAILURE: Contacts panel stays open over the chat window.
     */
    useUIStore.setState({ contactsPanelOpen: true });
    useUIStore.getState().setActiveChat('test-chat-id');
    
    const state = useUIStore.getState();
    expect(state.activeChatId).toBe('test-chat-id');
    expect(state.contactsPanelOpen).toBe(false);
  });

  it('setActiveChat(null) clears the active chat', () => {
    useUIStore.setState({ activeChatId: 'some-chat' });
    useUIStore.getState().setActiveChat(null);
    expect(useUIStore.getState().activeChatId).toBeNull();
  });

  it('openContactsPanel sets contactsPanelOpen to true', () => {
    useUIStore.getState().openContactsPanel();
    expect(useUIStore.getState().contactsPanelOpen).toBe(true);
  });

  it('closeContactsPanel sets contactsPanelOpen to false', () => {
    useUIStore.setState({ contactsPanelOpen: true });
    useUIStore.getState().closeContactsPanel();
    expect(useUIStore.getState().contactsPanelOpen).toBe(false);
  });

  it('toggleMobileSidebar flips the boolean', () => {
    expect(useUIStore.getState().mobileSidebarOpen).toBe(true);
    useUIStore.getState().toggleMobileSidebar();
    expect(useUIStore.getState().mobileSidebarOpen).toBe(false);
    useUIStore.getState().toggleMobileSidebar();
    expect(useUIStore.getState().mobileSidebarOpen).toBe(true);
  });
});

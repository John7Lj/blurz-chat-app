/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useWebSocket } from '../hooks/useWebSocket';
import { useCurrentUser } from '../hooks/useUser';
import { useUIStore } from '../store/ui.store';
import Sidebar from '../features/chat/Sidebar';
import ChatWindow from '../features/chat/ChatWindow';
import { ContactsPanel } from '../features/contacts/ContactsPanel';

export default function ChatLayout() {
  useWebSocket();
  useCurrentUser();

  const activeChatId = useUIStore((s) => s.activeChatId);
  const contactsPanelOpen = useUIStore((s) => s.contactsPanelOpen);

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', width: '100%', minHeight: 0 }}>
      {/*
       * ── Left Sidebar ──────────────────────────────────────────────
       * On mobile:
       *   - If no chat selected → show full width
       *   - If chat selected   → hide (0 width)
       * On desktop: always show at 340px
       */}
      <aside
        data-testid="sidebar"
        className="chat-sidebar"
        style={{
          /*
           * Mobile-first: we use a CSS class to handle show/hide.
           * On mobile: full width when no chat, hidden when chat active.
           * On desktop: always 340px.
           */
          display: activeChatId ? 'none' : 'flex',
        }}
      >
        <Sidebar />
      </aside>

      {/*
       * ── Right Panel ───────────────────────────────────────────────
       * On mobile: show only when chat is selected
       * On desktop: always show
       */}
      <div
        data-testid="chat-window"
        className="chat-panel"
        style={{
          display: activeChatId ? 'flex' : 'none',
        }}
      >
        <ChatWindow />
      </div>

      {/* Contacts slide-over */}
      {contactsPanelOpen && <ContactsPanel />}
    </div>
  );
}

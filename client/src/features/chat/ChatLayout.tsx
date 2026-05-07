import { useWebSocket } from '../../hooks/use-websocket';
import { useCurrentUser } from '../../hooks/use-user';
import { useUIStore } from '../../stores/ui.store';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { ContactsPanel } from '../contacts/ContactsPanel';

export default function ChatLayout() {
  useWebSocket();
  useCurrentUser();

  const activeChatId = useUIStore((s) => s.activeChatId);
  const contactsPanelOpen = useUIStore((s) => s.contactsPanelOpen);

  return (
    <div className="flex flex-1 min-h-0 h-full w-full">
      {/* ── Left Sidebar (340px on desktop) ───────────────────────── */}
      <aside
        data-testid="sidebar"
        className={[
          'flex-shrink-0 flex flex-col h-full',
          'w-full md:w-[340px]',
          activeChatId ? 'hidden md:flex' : 'flex',
        ].join(' ')}
        style={{
          background: 'var(--chat-sidebar-bg)',
          borderRight: '1px solid var(--chat-border)',
        }}
      >
        <Sidebar />
      </aside>

      {/* ── Right Panel (Chat Window) ─────────────────────────────── */}
      <div
        data-testid="chat-window"
        className={[
          'flex-1 flex flex-col min-w-0 h-full',
          activeChatId ? 'flex' : 'hidden md:flex',
        ].join(' ')}
        style={{ background: 'var(--chat-msg-bg)' }}
      >
        <ChatWindow />
      </div>

      {/* ── Contacts slide-over panel ────────────────────────────── */}
      {contactsPanelOpen && <ContactsPanel />}
    </div>
  );
}

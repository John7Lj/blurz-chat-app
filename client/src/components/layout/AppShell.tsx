import { Outlet, useLocation } from 'react-router';
import NavRail from './NavRail';
import MobileTabBar from './MobileTabBar';
import { useUIStore } from '../../stores/ui.store';

export default function AppShell() {
  const activeChatId = useUIStore((s) => s.activeChatId);
  const location = useLocation();
  const isInChat = location.pathname.startsWith('/chat') && !!activeChatId;

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--color-bg-primary)',
      }}
    >
      {/* Desktop nav rail — hidden on mobile */}
      <NavRail />

      {/* Main content — on mobile add bottom padding only when tab bar shows */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
          // Bottom padding for mobile tab bar (only when tab bar is shown)
          paddingBottom: isInChat ? 0 : undefined,
        }}
        className={isInChat ? '' : 'mobile-main-padded'}
      >
        <Outlet />
      </main>

      {/* Mobile bottom tab bar — only when NOT viewing a chat */}
      {!isInChat && <MobileTabBar />}
    </div>
  );
}

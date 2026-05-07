import { Outlet, useLocation } from 'react-router';
import NavRail from './NavRail';
import MobileTabBar from './MobileTabBar';
import { useUIStore } from '../../stores/ui.store';

export default function AppShell() {
  const activeChatId = useUIStore((s) => s.activeChatId);
  const location = useLocation();
  const isChatActive = location.pathname.startsWith('/chat') && activeChatId;

  return (
    <div
      className="flex h-dvh overflow-hidden"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Desktop nav rail */}
      <NavRail />

      {/* Main content area */}
      <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isChatActive ? 'pb-0' : 'pb-16 md:pb-0'}`}>
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      {!isChatActive && <MobileTabBar />}
    </div>
  );
}

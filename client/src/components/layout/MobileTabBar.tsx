import { useLocation, useNavigate } from 'react-router';
import { MessageCircle, Users, Bell, Settings, User } from 'lucide-react';

const tabs = [
  { path: '/chat', icon: MessageCircle, label: 'Chats' },
  { path: '/contacts', icon: Users, label: 'People' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-[60px]"
      style={{
        background: 'var(--color-bg-nav-rail)',
        borderTop: '1px solid var(--color-border)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150"
            style={{
              color: isActive ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
              background: 'transparent',
              border: 'none',
            }}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {isActive && (
              <div
                className="absolute top-0 w-8 h-[2px] rounded-b-full"
                style={{ background: 'var(--color-accent)' }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

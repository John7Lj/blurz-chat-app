import { useLocation, useNavigate } from 'react-router';
import { MessageCircle, Users, Bell, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { path: '/chat', icon: MessageCircle, label: 'Chats' },
  { path: '/contacts', icon: Users, label: 'Contacts' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function NavRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'User';

  return (
    <nav className="nav-rail hidden md:flex">
      {/* Logo */}
      <button
        onClick={() => navigate('/chat')}
        className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center mb-6 transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
        style={{ background: 'transparent' }}
        title="Blurz Chat"
      >
        <img src="/blurz-logo.png" alt="Blurz" className="w-[80px] h-[80px] object-contain" />
      </button>

      <div className="divider mb-3" style={{ width: '36px' }} />

      {/* Nav items */}
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <div key={item.path} className="tooltip-container">
            <button
              onClick={() => navigate(item.path)}
              className={`nav-rail-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <item.icon size={20} />
            </button>
            <span className="tooltip-text">{item.label}</span>
          </div>
        );
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <div className="tooltip-container">
        <button
          onClick={() => navigate('/settings')}
          className={`nav-rail-item ${location.pathname.startsWith('/settings') ? 'active' : ''}`}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
        <span className="tooltip-text">Settings</span>
      </div>

      {/* User avatar */}
      <div className="tooltip-container mt-2">
        <button
          onClick={() => navigate('/profile')}
          className="nav-rail-item"
          aria-label={fullName}
        >
          <Avatar src={user?.profile_url} name={fullName} size="sm" />
        </button>
        <span className="tooltip-text">{fullName}</span>
      </div>
    </nav>
  );
}

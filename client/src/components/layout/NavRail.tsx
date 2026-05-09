/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useLocation, useNavigate } from 'react-router';
import { MessageCircle, Users, Bell, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { path: '/chat',          icon: MessageCircle, label: 'Chats'         },
  { path: '/contacts',      icon: Users,         label: 'Contacts'      },
  { path: '/notifications', icon: Bell,          label: 'Notifications' },
];

export default function NavRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'User';

  return (
    <nav className="nav-rail" id="desktop-nav-rail">
      {/* Logo */}
      <button
        onClick={() => navigate('/chat')}
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        title="Blurz Chat"
      >
        <img src="/blurz-logo.png" alt="Blurz" style={{ width: 72, height: 72, objectFit: 'contain' }} />
      </button>

      <div className="divider" style={{ width: 32, marginBottom: 8 }} />

      {/* Nav items */}
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`nav-rail-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            title={item.label}
          >
            <item.icon size={20} />
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Settings */}
      <button
        onClick={() => navigate('/settings')}
        className={`nav-rail-item ${location.pathname.startsWith('/settings') ? 'active' : ''}`}
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {/* User avatar */}
      <button
        onClick={() => navigate('/profile')}
        className="nav-rail-item"
        style={{ marginTop: 4 }}
        aria-label={fullName}
        title={fullName}
      >
        <Avatar src={user?.profile_url} name={fullName} size="sm" />
      </button>
    </nav>
  );
}

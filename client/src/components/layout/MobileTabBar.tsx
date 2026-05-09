/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useLocation, useNavigate } from 'react-router';
import { MessageCircle, Users, Bell, Settings, User } from 'lucide-react';

const tabs = [
  { path: '/chat',          icon: MessageCircle, label: 'Chats'    },
  { path: '/contacts',      icon: Users,         label: 'People'   },
  { path: '/notifications', icon: Bell,          label: 'Alerts'   },
  { path: '/settings',      icon: Settings,      label: 'Settings' },
  { path: '/profile',       icon: User,          label: 'Profile'  },
];

export default function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="mobile-tab-bar">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`tab-item ${isActive ? 'active' : ''}`}
          >
            <tab.icon size={21} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { Palette, Bell, Shield, User, LogOut, ChevronRight, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { useLogout } from '../../hooks/use-auth';
import { Avatar } from '../../components/ui/Avatar';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'account', label: 'Account', icon: User },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('appearance');
  const user = useAuthStore(s => s.user);
  const theme = useUIStore(s => s.theme);
  const toggleTheme = useUIStore(s => s.toggleTheme);
  const logout = useLogout();
  
  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden" style={{ background: 'var(--color-bg-main)' }}>
      {/* Settings Navigation */}
      <aside className="w-full md:w-[280px] flex-shrink-0 flex flex-col overflow-y-auto" style={{ background: 'var(--color-bg-panel)', borderRight: '1px solid var(--color-border)' }}>
        {/* Consistent 60px header */}
        <header
          className="flex items-center px-5 h-[60px] flex-shrink-0 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h1 className="text-[17px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
        </header>

        <div className="p-3 flex flex-col gap-1">
          {/* Mini Profile Card */}
          <div
            className="flex items-center gap-3 p-3 mb-2 rounded-xl"
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Avatar src={user?.profile_url} name={`${user?.first_name} ${user?.last_name}`} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{user?.first_name} {user?.last_name}</p>
              <p className="text-[12px] truncate" style={{ color: 'var(--color-text-secondary)' }}>@{user?.username}</p>
            </div>
          </div>

          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
            >
              <section.icon size={18} />
              <span className="flex-1">{section.label}</span>
              <ChevronRight size={16} className="opacity-50" />
            </button>
          ))}

          <div className="divider my-2" />

          <button
            onClick={() => logout.mutate()}
            className="settings-nav-item"
            style={{ color: 'var(--color-danger)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Content header (mobile only — shown on md+ via aside) */}
        <header
          className="flex md:hidden items-center px-5 h-[60px] flex-shrink-0 border-b"
          style={{
            background: 'var(--color-bg-panel)',
            borderColor: 'var(--color-border)',
          }}
        >
          <h2 className="text-[17px] font-bold capitalize" style={{ color: 'var(--color-text-primary)' }}>
            {activeSection}
          </h2>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-2xl w-full mx-auto">
            {activeSection === 'appearance' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Appearance</h2>
                <div className="glass-card p-6 space-y-5">
                  <h3 className="text-[14px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Theme</h3>
                  
                  {/* Dark Mode Toggle */}
                  <div
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-input)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? (
                        <Moon size={18} style={{ color: 'var(--color-accent-light)' }} />
                      ) : (
                        <Sun size={18} className="text-amber-500" />
                      )}
                      <div>
                        <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </p>
                        <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                          {theme === 'dark' ? 'Easier on the eyes in low light' : 'Bright and clean look'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
                      onClick={toggleTheme}
                      role="switch"
                      aria-checked={theme === 'dark'}
                      aria-label="Toggle dark mode"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTheme(); }}
                    />
                  </div>

                  {/* Theme Preview Cards */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      onClick={() => useUIStore.getState().setTheme('dark')}
                      className="p-4 rounded-xl border-2 transition-all"
                      style={{
                        background: '#0e0f1a',
                        borderColor: theme === 'dark' ? 'var(--color-accent)' : 'var(--color-border)',
                        boxShadow: theme === 'dark' ? '0 0 0 1px var(--color-accent)' : 'none',
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Moon size={20} className="text-violet-400" />
                        <span className="text-[12px] font-semibold text-slate-300">Dark</span>
                      </div>
                    </button>
                    <button
                      onClick={() => useUIStore.getState().setTheme('light')}
                      className="p-4 rounded-xl border-2 transition-all"
                      style={{
                        background: '#f8f9fc',
                        borderColor: theme === 'light' ? 'var(--color-accent)' : 'var(--color-border)',
                        boxShadow: theme === 'light' ? '0 0 0 1px var(--color-accent)' : 'none',
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Sun size={20} className="text-amber-500" />
                        <span className="text-[12px] font-semibold text-slate-700">Light</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Notifications</h2>
                <div className="glass-card p-6 space-y-1">
                  {[
                    { title: 'Message Alerts', desc: 'Sound and popup when receiving messages' },
                    { title: 'Desktop Notifications', desc: 'Show native OS notifications' },
                    { title: 'Unread Badge', desc: 'Show unread count on app icon' }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl transition-colors"
                      style={{ border: '1px solid transparent' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-hover)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div>
                        <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
                        <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{item.desc}</p>
                      </div>
                      <div className="toggle-switch active" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Privacy & Security</h2>
                <div className="glass-card p-6 flex items-center justify-center min-h-[200px]" style={{ color: 'var(--color-text-muted)' }}>
                  Privacy settings coming soon.
                </div>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Account Settings</h2>
                <div className="glass-card p-6">
                  <p className="text-[14px] mb-6" style={{ color: 'var(--color-text-secondary)' }}>To update your profile information and avatar, please visit your Profile page.</p>
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      border: '1px solid rgba(239,68,68,0.2)',
                      background: 'rgba(239,68,68,0.05)',
                    }}
                  >
                    <h3 className="text-[14px] font-bold mb-2" style={{ color: 'var(--color-danger)' }}>Danger Zone</h3>
                    <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-secondary)' }}>Once you delete your account, there is no going back. Please be certain.</p>
                    <button
                      className="px-4 py-2 rounded-lg font-medium text-[13px] transition-colors"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: 'var(--color-danger)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

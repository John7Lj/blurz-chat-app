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
    <div className="flex flex-col md:flex-row h-full bg-[var(--color-bg-main)]">
      {/* Settings Navigation */}
      <aside className="w-full md:w-[280px] flex-shrink-0 bg-[var(--color-bg-panel)] border-r border-[var(--color-border)] flex flex-col">
        <header className="px-4 py-4 border-b border-[var(--color-border)]">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        </header>

        <div className="p-4 flex flex-col gap-1.5">
          {/* Mini Profile Card */}
          <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-[var(--color-bg-input)] border border-[var(--color-border)]">
            <Avatar src={user?.profile_url} name={`${user?.first_name} ${user?.last_name}`} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[var(--color-text-primary)] truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-[12px] text-[var(--color-text-secondary)] truncate">@{user?.username}</p>
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
            className="settings-nav-item text-[var(--color-danger)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--color-danger)]"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Settings Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl w-full mx-auto">
          {activeSection === 'appearance' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Appearance</h2>
              <div className="glass-card p-6 space-y-5">
                <h3 className="text-[14px] font-bold text-[var(--color-text-primary)]">Theme</h3>
                
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-input)]">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon size={18} className="text-[var(--color-accent-light)]" />
                    ) : (
                      <Sun size={18} className="text-amber-500" />
                    )}
                    <div>
                      <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </p>
                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
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
                    className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}
                    style={{ background: '#0e0f1a' }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Moon size={20} className="text-violet-400" />
                      <span className="text-[12px] font-semibold text-slate-300">Dark</span>
                    </div>
                  </button>
                  <button
                    onClick={() => useUIStore.getState().setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}
                    style={{ background: '#f8f9fc' }}
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
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Notifications</h2>
              <div className="glass-card p-6 space-y-4">
                {[
                  { title: 'Message Alerts', desc: 'Sound and popup when receiving messages' },
                  { title: 'Desktop Notifications', desc: 'Show native OS notifications' },
                  { title: 'Unread Badge', desc: 'Show unread count on app icon' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors border border-transparent hover:border-[var(--color-border)]">
                    <div>
                      <p className="text-[14px] font-medium text-[var(--color-text-primary)]">{item.title}</p>
                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">{item.desc}</p>
                    </div>
                    <div className="toggle-switch active" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Privacy & Security</h2>
              <div className="glass-card p-6 flex items-center justify-center min-h-[200px] text-[var(--color-text-muted)]">
                Privacy settings coming soon.
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6">Account Settings</h2>
              <div className="glass-card p-6">
                <p className="text-[14px] text-[var(--color-text-secondary)] mb-6">To update your profile information and avatar, please visit your Profile page.</p>
                <div className="p-4 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)]">
                  <h3 className="text-[14px] font-bold text-[var(--color-danger)] mb-2">Danger Zone</h3>
                  <p className="text-[13px] text-[var(--color-text-secondary)] mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)] font-medium text-[13px] hover:bg-[rgba(239,68,68,0.2)] transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

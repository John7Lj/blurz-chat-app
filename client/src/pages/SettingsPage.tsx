/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { Palette, Bell, Shield, User, LogOut, ChevronRight, Sun, Moon, Lock } from 'lucide-react';
import { useSettings } from '../features/settings/hooks/useSettings';
import { Avatar } from '../components/ui/Avatar';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'account', label: 'Account', icon: User },
];

export default function SettingsPage() {
  const {
    activeSection,
    setActiveSection,
    user,
    theme,
    toggleTheme,
    setTheme,
    logout,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteAccountMutation,
    passwordForm,
    setPasswordField,
    handleChangePassword,
    isChangingPassword,
  } = useSettings();

  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };
  
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

            {/* ═══════ APPEARANCE ═══════ */}
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
                      onClick={() => setTheme('dark')}
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
                      onClick={() => setTheme('light')}
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

            {/* ═══════ NOTIFICATIONS ═══════ */}
            {activeSection === 'notifications' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Notifications</h2>
                <div className="glass-card p-6 space-y-1">
                  <div
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
                      <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>Desktop Notifications</p>
                      <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        {notifPermission === 'granted'
                          ? 'Notifications are enabled — you will receive alerts for new messages'
                          : notifPermission === 'denied'
                            ? 'Notifications are blocked — enable them in your browser settings'
                            : 'Click to enable native browser notifications'}
                      </p>
                    </div>
                    <div 
                      className={`toggle-switch ${notifPermission === 'granted' ? 'active' : ''}`} 
                      onClick={handleRequestNotifications}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ═══════ PRIVACY & SECURITY ═══════ */}
            {activeSection === 'privacy' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Privacy & Security</h2>
                <div className="glass-card p-6 space-y-6">
                  <section>
                    <h3 className="text-[16px] font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Privacy Policy</h3>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
                      <p>Blurz Chat App ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>
                      <h4 style={{ fontWeight: 600, marginTop: 12, marginBottom: 6, color: 'var(--color-text-primary)', fontSize: 14 }}>Information We Collect</h4>
                      <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <li><strong>Account Information:</strong> When you register, we collect information such as your email address, username, and password.</li>
                        <li><strong>Profile Information:</strong> You may choose to provide additional information, such as a profile picture.</li>
                        <li><strong>Messages:</strong> We store the messages you send and receive through the service to deliver them to the intended recipients and provide chat history.</li>
                        <li><strong>Usage Data:</strong> We may collect information on how the service is accessed and used.</li>
                      </ul>
                      <h4 style={{ fontWeight: 600, marginTop: 12, marginBottom: 6, color: 'var(--color-text-primary)', fontSize: 14 }}>Data Storage and Security</h4>
                      <p>Your data is stored in our databases. We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet is 100% secure.</p>
                      <h4 style={{ fontWeight: 600, marginTop: 12, marginBottom: 6, color: 'var(--color-text-primary)', fontSize: 14 }}>Your Choices</h4>
                      <p>You can update your account information and preferences at any time by logging into your account settings. You may also request the deletion of your account and associated data.</p>
                    </div>
                  </section>
                  <div className="divider" />
                  <section>
                    <h3 className="text-[16px] font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Terms of Service</h3>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
                      <h4 style={{ fontWeight: 600, marginBottom: 6, color: 'var(--color-text-primary)', fontSize: 14 }}>Description of Service</h4>
                      <p>Blurz is a real-time chat application that allows users to send and receive messages. We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.</p>
                      <h4 style={{ fontWeight: 600, marginTop: 12, marginBottom: 6, color: 'var(--color-text-primary)', fontSize: 14 }}>Acceptable Use</h4>
                      <p style={{ marginBottom: 6 }}>You agree not to use the service to:</p>
                      <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <li>Transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy.</li>
                        <li>Impersonate any person or entity.</li>
                        <li>Transmit any material that contains software viruses or any other computer code designed to interrupt, destroy, or limit the functionality of any computer software or hardware.</li>
                      </ul>
                      <h4 style={{ fontWeight: 600, marginTop: 12, marginBottom: 6, color: 'var(--color-text-primary)', fontSize: 14 }}>Termination</h4>
                      <p>We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* ═══════ ACCOUNT ═══════ */}
            {activeSection === 'account' && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Account Settings</h2>
                
                {/* Change Password */}
                <div className="glass-card p-6 mb-6">
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                    <Lock size={15} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                    Change Password
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={setPasswordField('currentPassword')}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2.5 rounded-lg text-[13px]"
                        style={{
                          background: 'var(--color-bg-input)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={setPasswordField('newPassword')}
                        placeholder="Enter new password (min 8 chars)"
                        className="w-full px-3 py-2.5 rounded-lg text-[13px]"
                        style={{
                          background: 'var(--color-bg-input)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={setPasswordField('confirmPassword')}
                        placeholder="Confirm new password"
                        className="w-full px-3 py-2.5 rounded-lg text-[13px]"
                        style={{
                          background: 'var(--color-bg-input)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="px-4 py-2.5 rounded-lg font-medium text-[13px] text-white transition-colors mt-2"
                      style={{
                        background: 'var(--color-accent)',
                        opacity: isChangingPassword ? 0.6 : 1,
                      }}
                    >
                      {isChangingPassword ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Profile link + Danger Zone */}
                <div className="glass-card p-6">
                  <p className="text-[14px] mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                    To update your profile information and avatar, please visit your Profile page.
                  </p>
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      border: '1px solid rgba(239,68,68,0.2)',
                      background: 'rgba(239,68,68,0.05)',
                    }}
                  >
                    <h3 className="text-[14px] font-bold mb-2" style={{ color: 'var(--color-danger)' }}>Danger Zone</h3>
                    <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-secondary)' }}>Once you delete your account, there is no going back. Please be certain.</p>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
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
                    ) : (
                      <div className="flex items-center gap-3">
                        <p className="text-[13px] font-medium" style={{ color: 'var(--color-danger)' }}>Are you sure?</p>
                        <button
                          onClick={() => deleteAccountMutation.mutate()}
                          disabled={deleteAccountMutation.isPending}
                          className="px-4 py-2 rounded-lg font-bold text-[13px] text-white transition-colors"
                          style={{ background: '#ef4444' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
                        >
                          {deleteAccountMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 rounded-lg font-medium text-[13px] transition-colors"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
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

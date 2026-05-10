/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Camera, Mail, Phone, User, Loader2 } from 'lucide-react';
import { useLogout } from '../hooks/useAuth';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useProfileForm } from '../features/profile/hooks/useProfileForm';

export default function ProfilePage() {
  const {
    user,
    isLoading,
    form,
    setFieldValue,
    handleSave,
    handleFileChange,
    isUploading,
    fileInputRef,
    fullName,
    isSaving,
  } = useProfileForm();
  
  const logoutMutation = useLogout();

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg-main)' }}>
      {/* ── Page Header (60px — matches chat header) ────────────── */}
      <header
        className="flex items-center px-5 h-[60px] flex-shrink-0 border-b"
        style={{
          background: 'var(--color-bg-panel)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h1 className="text-[17px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Profile
        </h1>
      </header>

      {/* ── Scrollable content ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Skeleton variant="circle" className="w-20 h-20" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48 opacity-60" />
            </div>
          ) : (
            <>
              {/* ── Avatar section ──────────────────────────────── */}
              <div
                className="glass-card p-6 flex flex-col items-center gap-4"
                style={{ textAlign: 'center' }}
              >
                <div className="relative">
                  <Avatar
                    src={user?.profile_url}
                    name={fullName}
                    size="xl"
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/jpeg, image/png, image/webp" 
                    style={{ display: 'none' }} 
                  />
                  <button
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{
                      background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                      border: '2px solid var(--color-bg-primary)',
                      boxShadow: '0 4px 12px rgba(109,40,217,0.4)',
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                      opacity: isUploading ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => !isUploading && (e.currentTarget.style.filter = 'brightness(1.15)')}
                    onMouseLeave={(e) => !isUploading && (e.currentTarget.style.filter = 'none')}
                    title="Change photo"
                  >
                    {isUploading ? (
                      <Loader2 size={13} className="animate-spin" style={{ color: 'white' }} />
                    ) : (
                      <Camera size={13} style={{ color: 'white' }} />
                    )}
                  </button>
                </div>

                <div>
                  <p
                    className="text-[18px] font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {fullName || 'Blurz User'}
                  </p>
                  <p
                    className="text-[14px] mt-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {user?.email}
                  </p>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
                  style={
                    user?.is_verified
                      ? {
                          background: 'rgba(34,197,94,0.1)',
                          color: 'var(--color-success)',
                          border: '1px solid rgba(34,197,94,0.2)',
                        }
                      : {
                          background: 'rgba(245,158,11,0.1)',
                          color: 'var(--color-warning)',
                          border: '1px solid rgba(245,158,11,0.2)',
                        }
                  }
                >
                  {user?.is_verified ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Verified
                    </>
                  ) : (
                    <>⏳ Unverified</>
                  )}
                </span>
              </div>

              {/* ── Edit form ───────────────────────────────────── */}
              <div className="glass-card p-6 space-y-4">
                <h2
                  className="text-[12px] font-semibold uppercase tracking-widest pb-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Account Details
                </h2>

                <Input
                  label="Username"
                  value={form.username}
                  onChange={setFieldValue('username')}
                  icon={<User size={15} />}
                  maxLength={20}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={form.first_name}
                    onChange={setFieldValue('first_name')}
                  />
                  <Input
                    label="Last Name"
                    value={form.last_name}
                    onChange={setFieldValue('last_name')}
                  />
                </div>

                <Input
                  label="Bio / About"
                  value={form.bio || ''}
                  onChange={setFieldValue('bio')}
                  placeholder="Hey there! I am using Blurz."
                  maxLength={150}
                  hint="Max 150 characters"
                />

                <Input
                  label="Email"
                  type="email"
                  value={user?.email ?? ''}
                  icon={<Mail size={15} />}
                  hint="Email cannot be changed"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                />

                <Input
                  label="Phone"
                  type="tel"
                  value={user?.phone ?? ''}
                  icon={<Phone size={15} />}
                  hint="Phone cannot be changed"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                />

                <div className="pt-1">
                  <Button
                    onClick={handleSave}
                    loading={isSaving}
                    className="w-full"
                    size="md"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>

              {/* ── Danger zone ─────────────────────────────────── */}
              <div className="glass-card p-6">
                <p
                  className="text-[12px] font-semibold uppercase tracking-widest mb-4"
                  style={{ color: 'var(--color-danger)' }}
                >
                  Danger Zone
                </p>
                <Button
                  variant="danger"
                  onClick={() => logoutMutation.mutate()}
                  loading={logoutMutation.isPending}
                  className="w-full"
                  size="md"
                >
                  Sign Out
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

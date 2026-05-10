/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BellRing } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg-main)' }}>
      {/* ── Consistent 60px page header ────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 h-[60px] flex-shrink-0 border-b"
        style={{
          background: 'var(--color-bg-panel)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h1 className="text-[17px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Notifications</h1>
        <button
          className="text-[13px] font-medium transition-colors"
          style={{ color: 'var(--color-accent-light)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-accent-light)')}
        >
          Mark all as read
        </button>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto p-6">
          <div className="glass-card flex flex-col items-center justify-center p-12 text-center animate-fade-in" style={{ minHeight: '300px' }}>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{
                background: 'var(--color-bg-active)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 0 40px rgba(109,40,217,0.15)',
              }}
            >
              <BellRing size={32} style={{ color: 'var(--color-accent)' }} className="animate-pulse" />
            </div>
            <h3 className="text-[18px] font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>You're all caught up!</h3>
            <p className="text-[14px] max-w-[280px]" style={{ color: 'var(--color-text-secondary)' }}>
              No new notifications right now. We'll let you know when something happens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

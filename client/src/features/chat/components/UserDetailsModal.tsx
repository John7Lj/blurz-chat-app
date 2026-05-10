/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { X, Phone, User, Info } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import type { Participant } from '../../../types/chat.types';

interface UserDetailsModalProps {
  participant: Participant;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailsModal({ participant, isOpen, onClose }: UserDetailsModalProps) {
  if (!isOpen) return null;

  const fullName = `${participant.first_name} ${participant.last_name}`.trim();

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-bg-panel)',
          borderRadius: 20,
          width: '100%',
          maxWidth: 400,
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Contact Info
          </h2>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Avatar & Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
            <Avatar src={participant.profile_url} name={fullName} size="xl" />
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                {fullName}
              </h3>
            </div>
          </div>

          {/* Details List */}
          <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Phone */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ padding: 8, background: 'rgba(109,40,217,0.1)', borderRadius: 10, color: 'var(--color-accent)' }}>
                <Phone size={18} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                  Phone Number
                </p>
                <p style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {participant.phone || 'Not provided'}
                </p>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--color-border)', margin: '0 -16px' }} />

            {/* Bio */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ padding: 8, background: 'rgba(109,40,217,0.1)', borderRadius: 10, color: 'var(--color-accent)' }}>
                <Info size={18} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                  About
                </p>
                <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                  {participant.bio || 'Hey there! I am using Blurz.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

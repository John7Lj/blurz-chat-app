import { BellRing } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="flex h-full bg-[var(--color-bg-main)]">
      <div className="w-full max-w-2xl mx-auto flex flex-col p-6">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Notifications</h1>
            <p className="text-[var(--color-text-secondary)]">Stay updated with your activity</p>
          </div>
          <button className="text-[13px] font-medium text-[var(--color-accent-light)] hover:text-white transition-colors">
            Mark all as read
          </button>
        </header>

        <div className="glass-card flex-1 flex flex-col items-center justify-center p-12 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-[var(--color-bg-active)] flex items-center justify-center mb-6 border border-[var(--color-border)] shadow-[0_0_40px_rgba(109,40,217,0.15)]">
            <BellRing size={32} className="text-[var(--color-accent)] animate-pulse" />
          </div>
          <h3 className="text-[18px] font-bold text-[var(--color-text-primary)] mb-2">You're all caught up!</h3>
          <p className="text-[14px] text-[var(--color-text-secondary)] max-w-[280px]">
            No new notifications right now. We'll let you know when something happens.
          </p>
        </div>
      </div>
    </div>
  );
}

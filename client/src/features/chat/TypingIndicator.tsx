interface TypingIndicatorProps {
  name?: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 16px',
        minHeight: 28,
        background: 'var(--chat-input-bg)',
        borderTop: '1px solid var(--chat-border)',
      }}
    >
      <div className="typing-dots">
        <span />
        <span />
        <span />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent-light)' }}>
        {name || 'Someone'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--chat-text-2)' }}>is typing</span>
    </div>
  );
}

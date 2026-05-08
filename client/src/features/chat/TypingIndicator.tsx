interface TypingIndicatorProps {
  name?: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5 animate-fade-in"
      style={{ minHeight: '28px' }}
    >
      {/* Three bouncing dots — vuetify-chat ThreeDots style */}
      <div className="typing-dots">
        <span />
        <span />
        <span />
      </div>
      <span
        className="text-[12px] font-semibold"
        style={{ color: 'var(--color-accent-light)' }}
      >
        {name ? `${name}` : 'typing'}
      </span>
      <span className="text-[12px]" style={{ color: 'var(--chat-text-2)' }}>
        is typing
      </span>
    </div>
  );
}

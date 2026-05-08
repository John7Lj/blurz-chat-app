interface TypingIndicatorProps {
  name?: string;
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <div
      className="flex items-center gap-2 px-[4%] py-1.5 animate-fade-in"
      style={{ minHeight: '28px' }}
    >
      <div className="typing-indicator shadow-sm">
        <span />
        <span />
        <span />
      </div>
      <span
        className="text-[12px] font-medium"
        style={{ color: 'var(--chat-text-2)' }}
      >
        {name ? `${name} is typing...` : 'typing...'}
      </span>
    </div>
  );
}

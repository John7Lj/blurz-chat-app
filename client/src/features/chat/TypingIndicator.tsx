export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
      <div className="typing-indicator shadow-sm">
        <span />
        <span />
        <span />
      </div>
      <span className="text-[11px] font-medium text-[var(--color-text-muted)] animate-pulse">
        typing...
      </span>
    </div>
  );
}

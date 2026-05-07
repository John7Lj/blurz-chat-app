interface DateDividerProps {
  label: string;
}

export default function DateDivider({ label }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center py-3 select-none">
      <span
        className="px-3 py-[5px] rounded-lg text-[12px] font-medium shadow-sm"
        style={{
          background: 'var(--chat-divider-bg)',
          color: 'var(--chat-divider-text)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

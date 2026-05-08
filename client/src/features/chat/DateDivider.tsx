interface DateDividerProps {
  label: string;
}

export default function DateDivider({ label }: DateDividerProps) {
  return (
    <div className="date-separator">
      <span>{label}</span>
    </div>
  );
}

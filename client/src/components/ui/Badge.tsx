export function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="badge absolute -top-1 -right-1 shadow-[0_0_0_2px_var(--color-bg-panel)]">
      {count > 99 ? '99+' : count}
    </span>
  );
}

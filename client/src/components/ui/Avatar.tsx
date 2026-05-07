interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showOnline?: boolean;
}

const sizeMap = {
  xs: { box: 'w-6 h-6',   text: '9px',  ring: 1, dot: 'w-2 h-2' },
  sm: { box: 'w-8 h-8',   text: '11px', ring: 1.5, dot: 'w-2.5 h-2.5' },
  md: { box: 'w-10 h-10', text: '13px', ring: 2, dot: 'w-3 h-3' },
  lg: { box: 'w-14 h-14', text: '18px', ring: 2, dot: 'w-3.5 h-3.5' },
  xl: { box: 'w-20 h-20', text: '26px', ring: 2.5, dot: 'w-4 h-4' },
};

function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function nameToGradient(name?: string): [string, string] {
  if (!name) return ['#4c1d95', '#6d28d9'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return [
    `hsl(${hue}, 60%, 22%)`,
    `hsl(${(hue + 30) % 360}, 65%, 35%)`,
  ];
}

export function Avatar({ src, name, size = 'md', className = '', onClick, showOnline = false }: AvatarProps) {
  const s = sizeMap[size];
  const [from, to] = nameToGradient(name);
  const clickable = onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : '';

  const base = [
    s.box, 'rounded-full flex-shrink-0 relative', clickable, className
  ].join(' ');

  const ring = `ring-[${s.ring}px] ring-[var(--color-border)]`;

  const inner = src ? (
    <img
      data-testid="avatar-img"
      src={src}
      alt={name || 'Avatar'}
      onClick={onClick}
      className={`${base} object-cover ${ring}`}
    />
  ) : (
    <div
      data-testid="avatar-initials"
      onClick={onClick}
      className={`${base} flex items-center justify-center font-semibold ${ring}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, fontSize: s.text, color: `hsl(${0}, 70%, 90%)` }}
    >
      {getInitials(name)}
    </div>
  );

  if (!showOnline) return inner;

  return (
    <div className="relative flex-shrink-0">
      {inner}
      <span
        className={`absolute bottom-0 right-0 ${s.dot} rounded-full border-[2px] border-[var(--color-bg-secondary)]`}
        style={{ background: 'var(--color-success)' }}
      />
    </div>
  );
}

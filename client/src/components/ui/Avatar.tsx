interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showOnline?: boolean;
}

const sizeInPx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap = {
  xs: '9px',
  sm: '11px',
  md: '13px',
  lg: '18px',
  xl: '26px',
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
  const [from, to] = nameToGradient(name);
  const px = sizeInPx[size];
  const fontSize = fontSizeMap[size];

  const containerStyle: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    flexShrink: 0,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onClick ? 'pointer' : 'default',
    overflow: 'visible',
    border: '1px solid var(--color-border)',
  };

  const inner = src ? (
    <img
      src={src}
      alt={name || 'Avatar'}
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        objectFit: 'cover',
      }}
    />
  ) : (
    <div
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: fontSize,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
      }}
    >
      {getInitials(name)}
    </div>
  );

  return (
    <div style={containerStyle} className={className}>
      {inner}
      {showOnline && (
        <span
          style={{
            position: 'absolute',
            bottom: size === 'xs' ? 0 : 1,
            right: size === 'xs' ? 0 : 1,
            width: size === 'xl' ? 14 : size === 'lg' ? 12 : 10,
            height: size === 'xl' ? 14 : size === 'lg' ? 12 : 10,
            background: 'var(--color-success)',
            borderRadius: '50%',
            border: '2px solid var(--color-bg-primary)',
          }}
        />
      )}
    </div>
  );
}

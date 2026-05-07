import { Search as SearchIcon, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, placeholder = 'Search…', autoFocus }: SearchBarProps) {
  return (
    <div className="relative">
      <SearchIcon
        size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        aria-label={placeholder}
        className="w-full h-10 pl-10 pr-3 rounded-xl text-[13px] transition-all duration-200 focus:outline-none placeholder:opacity-50"
        style={{
          background: 'var(--color-bg-input)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          paddingRight: value ? '2.25rem' : '0.75rem',
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = '1px solid var(--color-border-focus)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = '1px solid var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

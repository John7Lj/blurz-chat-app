interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
}

export function Skeleton({ className = '', variant = 'rect' }: SkeletonProps) {
  const shape = variant === 'circle' ? 'rounded-full' : 'rounded-lg';
  return <div className={`skeleton ${shape} ${className}`} />;
}

/** Pre-built skeleton for a chat list row */
export function ChatListSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton variant="circle" className="w-10 h-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2.5 w-40 opacity-60" />
      </div>
      <Skeleton className="h-2.5 w-8 opacity-50" />
    </div>
  );
}

/** Pre-built skeleton for a message bubble */
export function MessageSkeleton({ isMine = false }: { isMine?: boolean }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-4 py-1`}>
      <Skeleton className={`h-9 ${isMine ? 'w-36' : 'w-52'} rounded-2xl`} />
    </div>
  );
}

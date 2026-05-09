/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="badge absolute -top-1 -right-1 shadow-[0_0_0_2px_var(--color-bg-panel)]">
      {count > 99 ? '99+' : count}
    </span>
  );
}

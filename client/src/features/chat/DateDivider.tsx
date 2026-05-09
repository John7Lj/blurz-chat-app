/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

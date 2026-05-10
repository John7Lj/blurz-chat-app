/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AlertCircle } from 'lucide-react';

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
        fontSize: 11,
        color: '#f87171',
        lineHeight: 1.3,
      }}
    >
      <AlertCircle size={12} style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}

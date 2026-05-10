/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemo } from 'react';
import { calculatePasswordStrength, PASSWORD_STRENGTH_SEGMENTS } from '../../../utils/password';

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => calculatePasswordStrength(password || ''), [password]);

  if (!password) return null;

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {Array.from({ length: PASSWORD_STRENGTH_SEGMENTS }, (_, i) => i + 1).map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, color: strength.color }}>{strength.label}</span>
    </div>
  );
}

/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import { useUIStore } from '../../../store/ui.store';
import { useLogout } from '../../../hooks/useAuth';

export function useSettings() {
  const [activeSection, setActiveSection] = useState('appearance');
  const user = useAuthStore(s => s.user);
  const theme = useUIStore(s => s.theme);
  const toggleTheme = useUIStore(s => s.toggleTheme);
  const setTheme = useUIStore(s => s.setTheme);
  const logout = useLogout();

  return {
    activeSection,
    setActiveSection,
    user,
    theme,
    toggleTheme,
    setTheme,
    logout,
  };
}

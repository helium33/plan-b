import { useEffect, type ReactNode } from 'react';

import { applyTheme, useThemeStore } from '@/app/stores/theme-store';

/**
 * Keeps the <html> class in sync with the theme store and, while the user is on
 * `system`, with live OS-level theme changes.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  return <>{children}</>;
}

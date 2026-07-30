import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  /** What the user picked. `system` follows the OS preference live. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Cycles light → dark → light, resolving `system` to its current value first. */
  toggle: () => void;
}

const STORAGE_KEY = 'pbv-theme';

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

/**
 * Writes the resolved theme to <html>. Kept outside React so the pre-paint
 * inline script in index.html and the store can share one implementation shape.
 */
export function applyTheme(mode: ThemeMode): 'light' | 'dark' {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;

  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#12151c' : '#ffffff');

  return resolved;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode });
      },
      toggle: () => {
        const next = resolveTheme(get().mode) === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ mode: next });
      },
    }),
    {
      name: STORAGE_KEY,
      // Re-apply after rehydration: the inline boot script guessed from the raw
      // localStorage value, this confirms it against the parsed state.
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode);
      },
    },
  ),
);

import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { resolveTheme, useThemeStore } from '@/app/stores/theme-store';

/**
 * Compact light/dark switch for the top bar.
 *
 * ── Why this is CSS and not an animation library ───────────────────────────
 * Both icons stay mounted and cross-rotate on a `transition`, keyed off the
 * resolved theme. The previous version did the same thing with
 * `AnimatePresence`, which meant every buyer downloaded ~43 kB of animation
 * runtime on first paint to fade one 18px icon. Two transformed icons get the
 * identical effect for nothing, and the reduced-motion rule in `theme.css`
 * neutralises them along with everything else.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  const resolved = resolveTheme(mode);
  const isDark = resolved === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('theme.toggle')}
      title={`${t('theme.label')}: ${t(`theme.${resolved}`)}`}
      className={cn(
        'relative grid h-11 w-11 place-items-center rounded-full text-muted-foreground',
        'transition-colors hover:bg-accent hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Sun
        aria-hidden="true"
        strokeWidth={1.9}
        className={cn(
          'absolute h-[1.15rem] w-[1.15rem] transition-all duration-200',
          isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
      <Moon
        aria-hidden="true"
        strokeWidth={1.9}
        className={cn(
          'absolute h-[1.15rem] w-[1.15rem] transition-all duration-200',
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0',
        )}
      />
    </button>
  );
}

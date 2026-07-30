import { Monitor, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/components/ui/utils';
import { resolveTheme, useThemeStore, type ThemeMode } from '@/app/stores/theme-store';

const ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

/**
 * Compact light/dark switch for the header.
 *
 * Click toggles light↔dark; the icon crossfades so the change reads as
 * deliberate rather than as a repaint.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  const resolved = resolveTheme(mode);
  const Icon = ICONS[resolved];

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t('theme.toggle')}
      title={`${t('theme.label')}: ${t(`theme.${resolved}`)}`}
      className={cn(
        'relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground',
        'transition-colors hover:bg-accent hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={resolved}
          initial={{ opacity: 0, rotate: -75, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 75, scale: 0.6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute grid place-items-center"
        >
          <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/**
 * Three-way light / dark / system selector. Used in the mobile menu and later
 * in account settings, where there is room to expose `system` explicitly.
 */
export function ThemeModeSelect({ className }: { className?: string }) {
  const { t } = useTranslation();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const options: ThemeMode[] = ['light', 'dark', 'system'];

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className={cn('inline-flex rounded-full border border-border bg-muted/60 p-1', className)}
    >
      {options.map((option) => {
        const Icon = ICONS[option];
        const active = mode === option;

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(option)}
            className={cn(
              'relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-mode-pill"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className="relative h-4 w-4" strokeWidth={1.9} />
            <span className="relative">{t(`theme.${option}`)}</span>
          </button>
        );
      })}
    </div>
  );
}

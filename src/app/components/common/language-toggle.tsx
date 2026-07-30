import { Check, Languages } from 'lucide-react';
import { motion } from 'motion/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { cn } from '@/app/components/ui/utils';
import { useLanguage } from '@/app/hooks/use-language';
import { LANGUAGE_META, SUPPORTED_LANGUAGES } from '@/app/i18n';

/**
 * Header language picker. A menu rather than a blind toggle: with only two
 * languages a toggle would work, but the menu shows which one is active — and
 * it stays correct when a third locale is added.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('language.toggle')}
          title={`${t('language.label')}: ${LANGUAGE_META[language].label}`}
          className={cn(
            'flex h-9 items-center gap-1.5 rounded-full px-2.5 text-muted-foreground',
            'transition-colors hover:bg-accent hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            className,
          )}
        >
          <Languages className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
          <span className="text-xs font-semibold tracking-wide">
            {LANGUAGE_META[language].short}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        {SUPPORTED_LANGUAGES.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setLanguage(code)}
            className="flex cursor-pointer items-center justify-between gap-3"
          >
            <span className={code === 'my' ? 'font-myanmar' : undefined}>
              {LANGUAGE_META[code].label}
            </span>
            {code === language && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Segmented EN / MM switch for the mobile menu, where a dropdown inside a
 * slide-over panel is one nested layer too many.
 */
export function LanguageSegmented({ className }: { className?: string }) {
  const { t, language, setLanguage } = useLanguage();

  return (
    <div
      role="radiogroup"
      aria-label={t('language.label')}
      className={cn('inline-flex rounded-full border border-border bg-muted/60 p-1', className)}
    >
      {SUPPORTED_LANGUAGES.map((code) => {
        const active = code === language;

        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLanguage(code)}
            className={cn(
              'relative rounded-full px-4 py-1.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              code === 'my' && 'font-myanmar',
            )}
          >
            {active && (
              <motion.span
                layoutId="language-pill"
                className="absolute inset-0 rounded-full bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{LANGUAGE_META[code].label}</span>
          </button>
        );
      })}
    </div>
  );
}

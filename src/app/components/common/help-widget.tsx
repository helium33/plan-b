/**
 * The floating help widget.
 *
 * ── Why this exists as well as the PDP section ─────────────────────────────
 * The scripted chat originally lived only at the bottom of the product detail
 * page. That is the right place for "how to buy *this*", but it made the feature
 * unreachable until the catalogue had products in it — and unfindable even then,
 * three screens down a long page. A customer with a question does not scroll to
 * look for a chat; they leave.
 *
 * So the same scripted engine is also mounted here, in `SiteLayout`, as a bubble
 * present on every page. `findReply` is shared with the PDP section, so both
 * answer identically and there is one place to change the replies.
 *
 * Hidden on the admin pages: staff have no use for a customer help bubble sitting
 * over the upload form.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bot, MessageCircle, Phone, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { findReply, type TopicId } from '@/app/components/product/how-to-buy';
import { telHref } from '@/config/store';

type Message = { role: 'customer' | 'shop'; topic?: TopicId; text?: string };

export function HelpWidget() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const language = i18n.resolvedLanguage === 'my' ? 'my' : 'en';

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'shop', topic: 'greeting' as TopicId },
  ]);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Scroll the transcript, not the page — scrolling the window would drag the
  // customer away from whatever they were reading behind the panel.
  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, open]);

  // Escape closes, which is what anyone expects from a floating panel.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Close on navigation: a panel left open over a new page reads as stuck.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Staff do not need a customer help bubble over the admin tools.
  if (location.pathname.startsWith('/admin')) return null;

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { role: 'customer', text: trimmed },
      { role: 'shop', topic: findReply(trimmed, language) },
    ]);
    setDraft('');
  };

  return (
    <>
      {/* Launcher. `z-30` sits above page content but below the modals and the
          compare tray, so it never covers a dialog's controls. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="help-panel"
        aria-label={open ? t('help.close') : t('help.open')}
        className={cn(
          'fixed bottom-4 right-4 z-30 grid h-12 w-12 place-items-center rounded-full shadow-lg transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          open
            ? 'bg-muted text-foreground'
            : 'bg-primary text-primary-foreground hover:opacity-90',
        )}
      >
        {open ? (
          <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        ) : (
          <MessageCircle className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        )}
      </button>

      {open ? (
        <motion.div
          ref={panelRef}
          id="help-panel"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-label={t('help.title')}
          className="fixed bottom-20 right-4 z-30 flex max-h-[min(30rem,75vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        >
          <header className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
              <Bot className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{t('help.title')}</p>
              {/* Says what it is. Not an assistant, not AI. */}
              <p className="truncate text-[0.7rem] text-muted-foreground">
                {t('howToBuy.chatSubtitle')}
              </p>
            </div>
          </header>

          <div
            ref={transcriptRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn('flex', message.role === 'customer' ? 'justify-end' : 'justify-start')}
              >
                <p
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    message.role === 'customer'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                  )}
                >
                  {message.role === 'customer'
                    ? message.text
                    : t(`howToBuy.replies.${message.topic ?? 'fallback'}`)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2.5">
            {(['prescription', 'pd', 'delivery', 'visit'] as const).map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => send(t(`howToBuy.suggestions.${topic}`))}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[0.7rem] text-muted-foreground transition-colors hover:border-brand-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-brand-700"
              >
                {t(`howToBuy.suggestions.${topic}`)}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <label htmlFor="help-input" className="sr-only">
              {t('howToBuy.inputLabel')}
            </label>
            <Input
              id="help-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t('howToBuy.inputPlaceholder')}
              className="h-9 flex-1 text-sm"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" aria-label={t('howToBuy.send')} disabled={!draft.trim()}>
              <Send className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
            </Button>
          </form>

          {/* The human is always one tap away, on every screen of the widget. */}
          <a
            href={telHref()}
            className="flex items-center justify-center gap-1.5 border-t border-border bg-muted/30 px-4 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-muted/60"
          >
            <Phone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {t('howToBuy.callUs')}
          </a>
        </motion.div>
      ) : null}
    </>
  );
}

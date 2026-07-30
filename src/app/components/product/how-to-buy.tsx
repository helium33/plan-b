/**
 * "How to buy", plus a scripted help widget.
 *
 * ── This chat is not AI, and does not pretend to be ────────────────────────
 * It matches the customer's question against a small set of keywords and replies
 * with a prepared answer. It is labelled as automatic replies, not as an
 * assistant, and every path offers the shop's phone number.
 *
 * That framing is the whole design. A widget that presents itself as intelligent
 * and then fails to answer "will these suit my prescription of -8.50?" damages
 * trust more than no widget at all — and in an optical shop, a confidently wrong
 * answer about a prescription is a genuine harm, not just a poor experience. The
 * scripted replies stay inside what the site actually knows, and hand off to a
 * human everywhere else.
 *
 * Replacing this with a real model later means swapping `findReply`. The transcript
 * shape and the UI do not change.
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Phone, Send, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/components/ui/utils';
import { ROUTES } from '@/app/config/navigation';
import { telHref } from '@/config/store';

/* ── Scripted replies ──────────────────────────────────────────────────────── */

/**
 * Keyword → reply topic.
 *
 * Keywords are held per language rather than translated at match time, because a
 * customer asking in Burmese will not type "prescription". Matching is a plain
 * substring test on the lower-cased message — crude, and appropriate: anything
 * cleverer would raise expectations this cannot meet.
 */
const TOPICS = [
  {
    id: 'prescription',
    en: ['prescription', 'power', 'sph', 'cyl', 'axis', 'lens', 'progressive', 'reading'],
    my: ['မျက်မှန်စာရွက်', 'ပါဝါ', 'မှန်ဘီလူး', 'အနီးအမြင်'],
  },
  {
    id: 'pd',
    en: ['pd', 'pupillary', 'pupil distance', 'measure'],
    my: ['ပီဒီ', 'တိုင်း', 'မျက်ဆံအကွာ'],
  },
  {
    id: 'delivery',
    en: ['deliver', 'shipping', 'post', 'how long', 'when will'],
    my: ['ပို့', 'ပေးပို့', 'ဘယ်တော့'],
  },
  {
    id: 'payment',
    en: ['pay', 'payment', 'cash', 'transfer', 'kpay', 'wave'],
    my: ['ပေးချေ', 'ငွေ', 'လွှဲ'],
  },
  {
    id: 'fit',
    en: ['fit', 'size', 'face shape', 'suit', 'too big', 'too small'],
    my: ['အံဝင်', 'အရွယ်', 'မျက်နှာသဏ္ဌာန်', 'ကြီး', 'သေး'],
  },
  {
    id: 'returns',
    en: ['return', 'refund', 'exchange', 'warranty', 'broken'],
    my: ['ပြန်', 'အာမခံ', 'ကျိုး'],
  },
  {
    id: 'visit',
    en: ['visit', 'shop', 'address', 'open', 'appointment', 'book'],
    my: ['ဆိုင်', 'လိပ်စာ', 'ဖွင့်', 'ချိန်း'],
  },
] as const;

/** Exported so the floating `HelpWidget` shares the same reply set. */
export type TopicId = (typeof TOPICS)[number]['id'] | 'fallback' | 'greeting';

/**
 * Finds the best matching topic, or `fallback`.
 *
 * Matches against the reader's language **and** the English list, always. That is
 * not laziness — Burmese speakers routinely write technical terms in Latin script,
 * so "PD ဆိုတာ ဘာလဲ" is a completely normal way to ask. Searching only the Burmese
 * keywords made the shop's own suggested question return "I don't know", which was
 * how this was caught.
 */
export function findReply(message: string, language: 'en' | 'my'): TopicId {
  const needle = message.trim().toLowerCase();
  if (!needle) return 'fallback';

  const candidates = TOPICS.flatMap((topic) => {
    // De-duplicated so a keyword present in both lists is not weighted twice.
    const keywords = new Set([...topic[language], ...topic.en]);
    return [...keywords].map((keyword) => ({
      id: topic.id as TopicId,
      keyword: keyword.toLowerCase(),
    }));
  })
    // Longest keyword first, so "pupil distance" beats a stray "pd" and the more
    // specific topic wins.
    .sort((a, b) => b.keyword.length - a.keyword.length);

  return candidates.find(({ keyword }) => needle.includes(keyword))?.id ?? 'fallback';
}

/* ── Component ─────────────────────────────────────────────────────────────── */

type Message = { role: 'customer' | 'shop'; topic?: TopicId; text?: string };

export function HowToBuy() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === 'my' ? 'my' : 'en';

  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'shop', topic: 'greeting' as TopicId }]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  /**
   * Keep the newest message in view.
   *
   * Scrolls the transcript container, not the page — scrolling the window would
   * yank the customer away from whatever else they were reading on the PDP.
   */
  useEffect(() => {
    const node = transcriptRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

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

  const steps = ['choose', 'lenses', 'order', 'collect'] as const;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-foreground">{t('howToBuy.title')}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t('howToBuy.intro')}</p>

      {/* The four steps */}
      <ol className="mt-5 grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => {
          const Icon = [ShoppingBag, Sparkles, Send, Truck][index];

          return (
            <li key={step} className="flex gap-3 rounded-xl border border-border p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
                <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  <span className="mr-1.5 text-muted-foreground">{index + 1}.</span>
                  {t(`howToBuy.steps.${step}.title`)}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t(`howToBuy.steps.${step}.body`)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* ── Chat ──────────────────────────────────────────────────────────── */}
      <div className="mt-7 overflow-hidden rounded-xl border border-border">
        <header className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white">
            <Bot className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{t('howToBuy.chatTitle')}</p>
            {/* Labelled honestly. Not "assistant", not "AI". */}
            <p className="text-[0.7rem] text-muted-foreground">{t('howToBuy.chatSubtitle')}</p>
          </div>
        </header>

        <div
          ref={transcriptRef}
          // `role="log"` with polite updates: new replies are announced without
          // interrupting, which is right for a transcript.
          role="log"
          aria-live="polite"
          aria-label={t('howToBuy.chatTitle')}
          className="max-h-72 space-y-3 overflow-y-auto p-4"
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

        {/* Suggested questions. Most people will not type anything, and these show
            what the widget can actually answer. */}
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3">
          {(['prescription', 'pd', 'delivery', 'visit'] as const).map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => send(t(`howToBuy.suggestions.${topic}`))}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-brand-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-brand-700"
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
          <label htmlFor="chat-input" className="sr-only">
            {t('howToBuy.inputLabel')}
          </label>
          <Input
            id="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('howToBuy.inputPlaceholder')}
            className="flex-1"
          />
          <Button type="submit" size="icon" aria-label={t('howToBuy.send')} disabled={!draft.trim()}>
            <Send className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </Button>
        </form>
      </div>

      {/* Always available, on every path through the widget. */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={telHref()}>
            <Phone className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
            {t('howToBuy.callUs')}
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.booking}>{t('actions.bookAppointment')}</Link>
        </Button>
      </div>
    </section>
  );
}

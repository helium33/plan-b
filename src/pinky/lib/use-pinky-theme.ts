/**
 * Pins the document to Pinky Beauty's fixed light identity while it is mounted.
 *
 * ── Why this is needed at all ──────────────────────────────────────────────
 * The wholesale app follows the OS light/dark preference and paints `<body>`
 * from a theme token. Pinky Beauty does not have a dark mode — a blush-and-white
 * brand dimmed to charcoal is a different brand — so on a device set to dark two
 * things go wrong that a `bg-[#fff5f8]` on the root div cannot fix:
 *
 *  1. `<body>` stays dark, so the overscroll gutter above and below the page
 *     flashes charcoal against pink on every rubber-band scroll.
 *  2. `color-scheme: dark` makes the browser render *native* controls dark —
 *     the region and township `<select>`s, the file picker, the radio dots. A
 *     dark dropdown inside a pink form is the most obviously broken thing on
 *     the checkout, and no amount of CSS on our side changes it.
 *
 * Both are properties of the document, not of any component, so they are set
 * here and restored exactly on unmount — leaving them applied would follow the
 * user back to the wholesale app and light-mode it permanently.
 */
import { useEffect } from 'react';

import { PINK } from '@/pinky/components/ui';

export function usePinkyTheme(title: string): void {
  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;

    const previous = {
      title: document.title,
      bodyBackground: body.style.backgroundColor,
      colorScheme: root.style.colorScheme,
      hadDarkClass: root.classList.contains('dark'),
    };

    document.title = title;
    body.style.backgroundColor = PINK.soft;
    root.style.colorScheme = 'light';
    // The `dark` class drives the wholesale token set. Removing it stops those
    // tokens leaking into anything Pinky shares — `cn`, the shadcn primitives —
    // without touching the user's stored preference, which lives in the theme
    // store rather than on this element.
    root.classList.remove('dark');

    return () => {
      document.title = previous.title;
      body.style.backgroundColor = previous.bodyBackground;
      root.style.colorScheme = previous.colorScheme;
      if (previous.hadDarkClass) root.classList.add('dark');
    };
  }, [title]);
}

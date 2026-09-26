/**
 * Telegram and Viber marks.
 *
 * Inlined because the app's icon set has no brand glyphs, and shared between the
 * voucher's dispatch panel and the cart drawer — the two places an order can
 * leave from. Both take `currentColor`, so they sit inside a button without
 * needing a variant per theme.
 */

export function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.95.46l.34-4.8L18.35 6c.38-.34-.08-.53-.59-.19l-10.8 6.8-4.65-1.46c-1.01-.32-1.03-1.01.21-1.5l18.17-7c.84-.31 1.58.2 1.25 1.65Z" />
    </svg>
  );
}

/** Simplified to a single path so it inherits `currentColor` cleanly. */
export function ViberIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.1 1.5c-2.9 0-5 .3-6.6 1.2C3.8 3.6 2.6 5.4 2.2 8c-.3 2-.3 4.4.1 6.4.4 2 1.5 3.5 3 4.4l.6.3v3.4c0 .5.6.8 1 .4l2.6-2.6c.9.1 1.8.1 2.6.1 2.9 0 5-.3 6.6-1.2 1.7-.9 2.9-2.7 3.3-5.3.3-2 .3-4.4-.1-6.4-.4-2-1.5-3.5-3-4.4-1.6-.9-3.7-1.2-6.8-1.2Zm.3 2.9c2.5 0 4.2.3 5.3 1 1.1.6 1.8 1.6 2.1 3.2.3 1.7.3 3.8 0 5.5-.3 1.6-1 2.6-2.1 3.2-1.1.7-2.8 1-5.3 1-.9 0-1.9 0-2.8-.2l-.5-.1-1.6 1.6v-2.3l-.7-.3c-1.2-.6-2-1.6-2.3-3.1-.3-1.7-.3-3.8 0-5.5.3-1.6 1-2.6 2.1-3.2 1.1-.6 2.8-.9 5.3-.9Zm-2.9 2.9a.9.9 0 0 0-.7.3l-.6.7c-.5.6-.5 1.4-.1 2.2.7 1.6 2.2 3.1 3.8 3.8.8.4 1.6.4 2.2-.1l.7-.6a.9.9 0 0 0 0-1.4l-1.2-1a.9.9 0 0 0-1.2 0l-.4.4a5.6 5.6 0 0 1-1.6-1.6l.4-.4a.9.9 0 0 0 0-1.2l-1-1.2a.9.9 0 0 0-.3-.2Zm3.2-.1a.7.7 0 0 0 .1 1.4c1.4.2 2.3 1.1 2.5 2.5a.7.7 0 0 0 1.4-.2c-.3-2-1.7-3.4-3.7-3.7h-.3Z" />
    </svg>
  );
}

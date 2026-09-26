/**
 * Pinky Beauty — storefront, checkout and the B2B Credit/AR dashboard.
 *
 * ── Why the cart lives here ────────────────────────────────────────────────
 * The three tabs are views of one session: adding from the shop has to show up
 * in the checkout summary, and placing an order has to empty the bag. Holding
 * the cart at this level is what makes the tabs feel like one app rather than
 * three screens that happen to share a header.
 *
 * ── Navigation ────────────────────────────────────────────────────────────
 * Tabs in the header from `md` up; a fixed bottom bar below it, which is where a
 * thumb rests on a phone. Both drive the same state, so there is one source of
 * truth for which view is showing.
 */
import { useState } from 'react';
import { LayoutGrid, Receipt, ShoppingBag, Wallet } from 'lucide-react';

import { cn } from '@/app/components/ui/utils';
import { ArDashboard } from '@/pinky/components/ar-dashboard';
import { Checkout } from '@/pinky/components/checkout';
import { Storefront } from '@/pinky/components/storefront';
import { SERIF } from '@/pinky/components/ui';
import { usePinkyTheme } from '@/pinky/lib/use-pinky-theme';
import type { CartLine } from '@/pinky/lib/checkout';
import type { PinkyProduct } from '@/pinky/data/seed';

type Tab = 'shop' | 'checkout' | 'admin-ar';

const TABS: { id: Tab; label: string; short: string; icon: typeof LayoutGrid }[] = [
  { id: 'shop', label: 'Shop', short: 'Shop', icon: LayoutGrid },
  { id: 'checkout', label: 'Checkout', short: 'Bag', icon: Receipt },
  { id: 'admin-ar', label: 'Credit & AR System', short: 'AR', icon: Wallet },
];

export function PinkyApp() {
  const [tab, setTab] = useState<Tab>('shop');
  const [cart, setCart] = useState<CartLine[]>([]);

  usePinkyTheme('Pinky Beauty — Eyewear & Credit/AR');

  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);

  /** Adds, or bumps the quantity if the product is already in the bag. */
  const add = (product: PinkyProduct, qty: number) =>
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.id === product.id ? { ...line, qty: Math.min(99, line.qty + qty) } : line,
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          priceKyat: product.priceKyat,
          qty,
          image: product.image,
        },
      ];
    });

  // Dropping to zero removes the line rather than leaving a `0 ×` row that still
  // has to be tidied away by hand.
  const setQty = (id: string, qty: number) =>
    setCart((current) =>
      qty <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => (line.id === id ? { ...line, qty: Math.min(99, qty) } : line)),
    );

  return (
    <div className="min-h-dvh bg-[#fff5f8] text-[#2d1f2d]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-pink-100 bg-white/90 px-4 py-3 backdrop-blur-md lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setTab('shop')}
            style={{ fontFamily: SERIF }}
            className="text-xl font-bold tracking-wide text-[#ff2a85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85] md:text-2xl"
          >
            Pinky
          </button>

          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-current={tab === entry.id ? 'page' : undefined}
                onClick={() => setTab(entry.id)}
                className={cn(
                  'min-h-11 rounded-full px-4 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]',
                  tab === entry.id
                    ? 'bg-pink-100 font-bold text-[#ff2a85]'
                    : 'text-[#8c7a8b] hover:text-[#ff2a85]',
                )}
              >
                {entry.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setTab('checkout')}
            aria-label={`Open bag, ${itemCount} items`}
            className="relative grid h-11 w-11 place-items-center rounded-full text-[#8c7a8b] transition-colors hover:text-[#ff2a85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 ? (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff2a85] px-1 text-[10px] font-bold text-white">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      {/* `pb-24` on mobile clears the fixed bottom bar. */}
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 md:px-6 md:pb-10 lg:px-8">
        {tab === 'shop' ? (
          <Storefront onAdd={add} onShopNow={() => setTab('checkout')} />
        ) : null}

        {tab === 'checkout' ? (
          <Checkout
            lines={cart}
            onQty={setQty}
            onRemove={(id) => setCart((c) => c.filter((line) => line.id !== id))}
            onPlaced={() => setCart([])}
          />
        ) : null}

        {tab === 'admin-ar' ? <ArDashboard /> : null}
      </main>

      {/* ── Bottom bar, phones only ────────────────────────────────────────── */}
      <nav
        aria-label="Sections"
        // `env(safe-area-inset-bottom)` keeps the bar above the iOS home
        // indicator, which otherwise sits on top of the right-hand tab.
        className="fixed inset-x-0 bottom-0 z-50 border-t border-pink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="flex">
          {TABS.map((entry) => {
            const Icon = entry.icon;
            const active = tab === entry.id;

            return (
              <button
                key={entry.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setTab(entry.id)}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[0.68rem] font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff2a85]',
                  active ? 'text-[#ff2a85]' : 'text-[#8c7a8b]',
                )}
              >
                <span className="relative">
                  <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                  {entry.id === 'checkout' && itemCount > 0 ? (
                    <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff2a85] px-1 text-[10px] font-bold text-white">
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  ) : null}
                </span>
                {entry.short}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

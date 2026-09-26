/**
 * The Pinky Beauty storefront: hero, category filters, product grid, quick view.
 *
 * Responsive shape, per the brief:
 *   phone   2 columns, filters as a horizontal rail
 *   tablet  3 columns
 *   desktop 4 columns
 *
 * Two columns rather than one on a phone is deliberate: these are small, visually
 * similar products bought by comparison, and a single column shows one at a time,
 * which turns choosing a shade into scrolling back and forth.
 */
import { useMemo, useState } from 'react';
import { Heart, Plus, Search, Sparkles, X } from 'lucide-react';

import { cn } from '@/app/components/ui/utils';
import {
  Badge,
  Card,
  Heading,
  PinkButton,
  SERIF,
  inputClass,
  ks,
} from '@/pinky/components/ui';
import {
  CATEGORY_LABELS,
  PINKY_PRODUCTS,
  PRODUCT_CATEGORIES,
  type PinkyProduct,
  type ProductCategory,
} from '@/pinky/data/seed';

const BADGE_LABEL: Record<NonNullable<PinkyProduct['badge']>, string> = {
  bestseller: 'Bestseller',
  new: 'New',
  'low-stock': 'Low stock',
};

const BADGE_TONE = {
  bestseller: 'pink',
  new: 'emerald',
  'low-stock': 'amber',
} as const;

/* ── Quick view ────────────────────────────────────────────────────────────── */

function QuickView({
  product,
  onClose,
  onAdd,
}: {
  product: PinkyProduct;
  onClose: () => void;
  onAdd: (product: PinkyProduct, qty: number) => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      {/*
        Bottom sheet on a phone, centred card from `sm` up — the brief's
        "bottom-sheet style menus" on mobile. `stopPropagation` so a tap inside
        the panel does not fall through to the backdrop's close handler.
      */}
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <Heading as="h3" className="text-xl">
            {product.name}
          </Heading>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick view"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#8c7a8b] transition-colors hover:bg-pink-50 hover:text-[#ff2a85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-3 flex gap-4">
          <img
            src={product.image}
            alt={product.name}
            className="h-28 w-28 shrink-0 rounded-2xl object-cover sm:h-36 sm:w-36"
          />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#8c7a8b]">{product.shade}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#2d1f2d]">{product.blurb}</p>
            <p className="mt-3 text-xl font-bold text-[#ff2a85]" style={{ fontFamily: SERIF }}>
              {ks(product.priceKyat)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-2xl border border-pink-200 p-1">
            <button
              type="button"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              aria-label="Decrease quantity"
              className="grid h-10 w-10 place-items-center rounded-xl text-[#8c7a8b] hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((n) => Math.min(99, n + 1))}
              aria-label="Increase quantity"
              className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff2a85] text-white hover:bg-[#e02072] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
            >
              +
            </button>
          </div>

          <PinkButton
            className="flex-1"
            onClick={() => {
              onAdd(product, qty);
              onClose();
            }}
          >
            Add to bag · {ks(product.priceKyat * qty)}
          </PinkButton>
        </div>
      </div>
    </div>
  );
}

/* ── Product card ──────────────────────────────────────────────────────────── */

function ProductCard({
  product,
  saved,
  onToggleSave,
  onQuickView,
  onAdd,
}: {
  product: PinkyProduct;
  saved: boolean;
  onToggleSave: () => void;
  onQuickView: () => void;
  onAdd: () => void;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-2xl p-3 transition-shadow hover:shadow-lg hover:shadow-pink-200/60">
      <button
        type="button"
        onClick={onQuickView}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="mb-2 aspect-square w-full rounded-xl object-cover"
        />

        {product.badge ? (
          <Badge tone={BADGE_TONE[product.badge]}>{BADGE_LABEL[product.badge]}</Badge>
        ) : null}

        <h3 className="mt-1.5 truncate text-sm font-semibold text-[#2d1f2d]">{product.name}</h3>
        <p className="truncate text-[0.7rem] text-[#8c7a8b]">{product.shade}</p>
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-[#2d1f2d]">{ks(product.priceKyat)}</span>

        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add ${product.name} to bag`}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#ff2a85] text-white shadow-md shadow-pink-200 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
        >
          <Plus size={18} strokeWidth={2.6} />
        </button>
      </div>

      {/* Outside the quick-view button, so saving never opens the sheet. */}
      <button
        type="button"
        onClick={onToggleSave}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from favourites` : `Save ${product.name}`}
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]"
      >
        <Heart
          size={16}
          strokeWidth={2.2}
          className={cn(saved ? 'fill-[#ff2a85] text-[#ff2a85]' : 'text-[#8c7a8b]')}
        />
      </button>
    </Card>
  );
}

/* ── Storefront ────────────────────────────────────────────────────────────── */

export function Storefront({
  onAdd,
  onShopNow,
}: {
  onAdd: (product: PinkyProduct, qty: number) => void;
  onShopNow: () => void;
}) {
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [quickView, setQuickView] = useState<PinkyProduct | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PINKY_PRODUCTS.filter(
      (product) =>
        (category === null || product.category === category) &&
        (needle === '' ||
          `${product.name} ${product.shade} ${product.blurb}`.toLowerCase().includes(needle)),
    );
  }, [category, query]);

  const toggleSave = (id: string) =>
    setSaved((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [id, ...current],
    );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-pink-100 to-rose-50 p-6 md:flex-row md:p-12">
        <div className="space-y-4 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-200/60 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-[#ff2a85]">
            <Sparkles size={12} /> Love Yourself
          </span>

          <Heading as="h1" className="text-3xl leading-tight md:text-5xl">
            Your Eyes,
            <br />
            <span className="italic text-[#ff2a85]">Your Confidence.</span>
          </Heading>

          <p className="mx-auto max-w-md text-sm text-[#8c7a8b] md:mx-0 md:text-base">
            Natural contact lenses, soft-toned frames and lash edits to lift your everyday glow.
          </p>

          <PinkButton onClick={onShopNow} className="rounded-full px-8">
            Shop Now →
          </PinkButton>
        </div>

        <div className="aspect-square w-48 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl sm:w-64 md:w-80">
          <img
            src={PINKY_PRODUCTS[1].image}
            alt="Barbie Hall Blue contact lens"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* ── Search and categories ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8c7a8b]"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search shades, frames, lashes…"
            aria-label="Search products"
            className={cn(inputClass, 'pl-10 [&::-webkit-search-cancel-button]:hidden')}
          />
        </div>

        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {([null, ...PRODUCT_CATEGORIES] as (ProductCategory | null)[]).map((entry) => (
            <button
              key={entry ?? 'all'}
              type="button"
              aria-pressed={category === entry}
              onClick={() => setCategory(entry)}
              className={cn(
                'min-h-11 shrink-0 rounded-full border px-4 text-xs font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff2a85]',
                category === entry
                  ? 'border-[#ff2a85] bg-[#ff2a85] text-white'
                  : 'border-pink-200 bg-white text-[#8c7a8b] hover:text-[#ff2a85]',
              )}
            >
              {entry === null ? 'All' : CATEGORY_LABELS[entry]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <div>
        <Heading as="h2" className="mb-3 text-xl">
          {category === null ? 'Bestsellers' : CATEGORY_LABELS[category]}
        </Heading>

        {visible.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-sm font-semibold text-[#2d1f2d]">Nothing matches that search</p>
            <p className="mt-1 text-xs text-[#8c7a8b]">Try a different shade or clear the box.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                saved={saved.includes(product.id)}
                onToggleSave={() => toggleSave(product.id)}
                onQuickView={() => setQuickView(product)}
                onAdd={() => onAdd(product, 1)}
              />
            ))}
          </div>
        )}
      </div>

      {quickView ? (
        <QuickView product={quickView} onClose={() => setQuickView(null)} onAdd={onAdd} />
      ) : null}
    </div>
  );
}

/**
 * Sample catalogue, for demonstrating the app before real stock is uploaded.
 *
 * Chosen for *coverage*, not realism. The set is deliberately built so that:
 *
 *  - every category, material and shape has at least two frames, so no filter
 *    combination lands on an empty grid;
 *  - assortment sizes vary from one to five C-numbers, so lines of very
 *    different sizes appear on one voucher;
 *  - one frame has a single colour, so "take one of every colour" is exercised
 *    on a model where that means exactly one piece;
 *  - one frame has an out-of-stock colour, so the "orderable variants" path is
 *    covered by real data rather than only in principle;
 *  - one frame is unpublished, so the hidden path is too;
 *  - one frame is left unweighed, so the card's missing-spec path is exercised;
 *  - three are flagged `bestSeller` and two ship without a case, so both
 *    catalogue shelves and the accessories badge have something to show.
 *
 * Prices are plausible Myanmar wholesale in MMK, per piece.
 *
 * `videos` is empty throughout. There is no way to generate a real clip here, and
 * a broken `<video>` looks like a defect.
 */
import type { FrameDoc } from '@/lib/product';
import { frameSlug } from '@/lib/product';
import { frameImages } from '@/lib/seed/frame-artwork';

/** Colours used across the sample set, so swatches stay consistent. */
const COLORS = {
  black: { name: 'Matte Black', hex: '#1e293b' },
  tortoise: { name: 'Tortoiseshell', hex: '#8a5a2b' },
  crystal: { name: 'Crystal Clear', hex: '#a8b3c2' },
  navy: { name: 'Navy', hex: '#1e3a5f' },
  rose: { name: 'Rose Gold', hex: '#c08a7d' },
  gunmetal: { name: 'Gunmetal', hex: '#4b5563' },
  olive: { name: 'Olive', hex: '#5f6b3a' },
  burgundy: { name: 'Burgundy', hex: '#6b2737' },
  silver: { name: 'Silver', hex: '#9ca3af' },
  coral: { name: 'Coral', hex: '#d9776a' },
} as const;

type ColorKey = keyof typeof COLORS;

/** Builds the variant list for a frame from a list of colours. */
function variants(frameCode: string, keys: ColorKey[], outOfStock: ColorKey[] = []) {
  return keys.map((key, index) => {
    const color = COLORS[key];
    const cNumber = `C${index + 1}`;
    return {
      cNumber,
      colorName: color.name,
      swatch: color.hex,
      images: frameImages(color.hex, `${frameCode} ${cNumber}`),
      videos: [] as string[],
      inStock: !outOfStock.includes(key),
    };
  });
}

/** `mm(52, 18, 142)` reads like the stamp inside a temple arm. */
const mm = (lensWidth: number, bridge: number, templeLength: number) => ({
  lensWidth,
  bridge,
  templeLength,
});

/**
 * Spaced-out timestamps so "newest first" has a deterministic order.
 * Counts backwards one day at a time from a fixed date — a fixed base keeps
 * re-seeding idempotent, which `Date.now()` would not.
 */
const BASE_MS = Date.UTC(2026, 7, 1); // 1 August 2026
const day = (n: number) => BASE_MS - n * 86_400_000;

/**
 * The two shelf flags are optional here and defaulted at export.
 *
 * Most sample frames want the same answer to both — a case in the box, and not
 * a best seller — and repeating that on all thirteen entries would bury the two
 * or three where the answer is actually interesting.
 */
type SampleFrame = Omit<FrameDoc, 'id' | 'includesCase' | 'bestSeller'> & {
  includesCase?: boolean;
  bestSeller?: boolean;
};

const SAMPLES: SampleFrame[] = [
  {
    brand: 'Plan B',
    frameCode: 'PBW-2041',
    stockStatus: 'in-stock',
    bestSeller: true,
    name: 'Yangon Round',
    wholesalePrice: 16_500,
    category: 'Female',
    material: 'Acetate',
    shape: 'Round',
    dimensions: mm(52, 18, 142),
    weightGrams: 24,
    variants: variants('PBW-2041', ['tortoise', 'rose', 'crystal']),
    description: 'Full acetate build, front and temples. Keyhole bridge, spring hinges.',
    createdAtMs: day(0),
    published: true,
  },
  {
    brand: 'Plan B',
    frameCode: 'PBW-1180',
    stockStatus: 'in-stock',
    name: 'Inle Square',
    wholesalePrice: 24_000,
    category: 'Male',
    material: 'Titanium',
    shape: 'Square',
    dimensions: mm(55, 17, 145),
    weightGrams: 8.2,
    variants: variants('PBW-1180', ['gunmetal', 'navy', 'black', 'silver']),
    description: 'Beta-titanium, flat top bar, adjustable pads.',
    createdAtMs: day(1),
    published: true,
  },
  {
    brand: 'Aureum',
    frameCode: 'AU-330',
    stockStatus: 'low-stock',
    bestSeller: true,
    name: 'Bagan Cat-Eye',
    wholesalePrice: 12_800,
    category: 'Female',
    material: 'Metal',
    shape: 'Cat-Eye',
    dimensions: mm(51, 16, 140),
    weightGrams: 18,
    variants: variants('AU-330', ['rose', 'burgundy', 'silver']),
    description: 'Upswept fine-metal cat-eye. Soldered hinges, adjustable pads.',
    createdAtMs: day(2),
    published: true,
  },
  {
    brand: 'Aureum',
    frameCode: 'AU-505',
    stockStatus: 'in-stock',
    name: 'Mandalay Aviator',
    wholesalePrice: 14_200,
    category: 'Male',
    material: 'Metal',
    shape: 'Aviator',
    dimensions: mm(58, 14, 140),
    weightGrams: 21,
    // One colour withdrawn: the catalogue must never offer it, and a full set of
    // the rest must still earn its discount.
    variants: variants('AU-505', ['gunmetal', 'olive', 'black'], ['olive']),
    description: 'Double-bridge aviator, wire-thin. Wide fit.',
    createdAtMs: day(3),
    published: true,
  },
  {
    brand: 'Loom',
    frameCode: 'LM-014',
    stockStatus: 'in-stock',
    name: 'Studio Rectangle',
    wholesalePrice: 9_500,
    category: 'Unisex',
    material: 'TR90',
    shape: 'Rectangle',
    dimensions: mm(53, 17, 143),
    weightGrams: 19,
    variants: variants('LM-014', ['black', 'navy', 'crystal', 'tortoise', 'olive']),
    description: 'Injection-moulded TR90. Five colours, deep assortment.',
    createdAtMs: day(4),
    published: true,
  },
  {
    brand: 'Loom',
    frameCode: 'LM-077',
    stockStatus: 'pre-order',
    name: 'Thanlyin Oversize',
    wholesalePrice: 11_000,
    category: 'Female',
    material: 'Acetate',
    shape: 'Square',
    dimensions: mm(56, 16, 145),
    weightGrams: 23,
    variants: variants('LM-077', ['tortoise', 'coral']),
    description: 'Oversized, low bridge, matte finish. Full acetate — front and temples, no metal.',
    createdAtMs: day(5),
    published: true,
  },
  {
    brand: 'Verdant',
    frameCode: 'VD-201',
    stockStatus: 'in-stock',
    name: 'Bamboo Eco Round',
    wholesalePrice: 8_200,
    category: 'Unisex',
    material: 'Metal',
    shape: 'Round',
    dimensions: mm(50, 20, 140),
    weightGrams: 26,
    variants: variants('VD-201', ['olive', 'tortoise', 'black']),
    description: 'Plain alloy round at entry price. Nickel-free plating.',
    createdAtMs: day(6),
    published: true,
  },
  {
    brand: 'Verdant',
    frameCode: 'VD-088',
    stockStatus: 'in-stock',
    // Kids' frames here ship loose in a poly bag, not a hard case.
    includesCase: false,
    name: 'Little Explorer',
    wholesalePrice: 6_800,
    category: 'Kids',
    material: 'TR90',
    shape: 'Round',
    dimensions: mm(44, 16, 125),
    weightGrams: 14,
    variants: variants('VD-088', ['coral', 'navy', 'olive']),
    description: 'Spring hinges, rounded everything, silicone nose. Ages 5–9.',
    createdAtMs: day(7),
    published: true,
  },
  {
    brand: 'Verdant',
    frameCode: 'VD-090',
    stockStatus: 'low-stock',
    name: 'Little Explorer Metal',
    wholesalePrice: 7_400,
    category: 'Kids',
    material: 'Metal',
    shape: 'Geometric',
    dimensions: mm(46, 16, 128),
    weightGrams: 16,
    variants: variants('VD-090', ['navy', 'rose']),
    description: 'Alloy kids’ frame with cable temples. Ages 7–12.',
    createdAtMs: day(8),
    published: true,
  },
  {
    brand: 'Meridian',
    frameCode: 'MD-410',
    stockStatus: 'in-stock',
    bestSeller: true,
    name: 'Half-Rim Classic',
    wholesalePrice: 21_000,
    category: 'Male',
    material: 'Titanium',
    shape: 'Rectangle',
    dimensions: mm(54, 18, 145),
    weightGrams: 6.9,
    variants: variants('MD-410', ['silver', 'gunmetal', 'navy']),
    description: 'Nylon-cord half rim in titanium.',
    createdAtMs: day(9),
    published: true,
  },
  {
    brand: 'Meridian',
    frameCode: 'MD-155',
    stockStatus: 'in-stock',
    name: 'Petite Oval',
    wholesalePrice: 10_400,
    category: 'Female',
    material: 'Metal',
    shape: 'Cat-Eye',
    dimensions: mm(47, 18, 135),
    // Left unweighed on purpose: the card must simply omit the spec rather than
    // print "0 g" or a dash where a number belongs.
    weightGrams: null,
    variants: variants('MD-155', ['rose', 'silver', 'burgundy']),
    description: 'Properly scaled small oval, not a shrunken men’s frame.',
    createdAtMs: day(10),
    published: true,
  },
  {
    brand: 'Meridian',
    frameCode: 'MD-700',
    stockStatus: 'pre-order',
    name: 'Counter Single',
    wholesalePrice: 13_600,
    category: 'Unisex',
    material: 'Combo',
    shape: 'Geometric',
    dimensions: mm(52, 19, 142),
    weightGrams: 22,
    // Deliberately one colour: proves a single-variant model cannot earn the
    // C-set discount, which would otherwise be free margin on a one-piece order.
    variants: variants('MD-700', ['black']),
    description: 'Single-colour line. Acetate front, metal temples.',
    createdAtMs: day(11),
    published: true,
  },
  {
    brand: 'Loom',
    frameCode: 'LM-999',
    stockStatus: 'pre-order',
    name: 'Winter Preview',
    wholesalePrice: 15_000,
    category: 'Unisex',
    material: 'Combo',
    shape: 'Aviator',
    dimensions: mm(54, 18, 144),
    weightGrams: 20,
    variants: variants('LM-999', ['navy', 'olive']),
    description: 'Not released yet. Present so the unpublished path is covered by real data.',
    createdAtMs: day(12),
    // Deliberately hidden: proves `published: false` is honoured everywhere.
    published: false,
  },
];

/** The sample catalogue, with deterministic ids derived from brand + code. */
export const SAMPLE_FRAMES: FrameDoc[] = SAMPLES.map((frame) => ({
  ...frame,
  includesCase: frame.includesCase ?? true,
  bestSeller: frame.bestSeller ?? false,
  id: frameSlug(frame.brand, frame.frameCode),
}));

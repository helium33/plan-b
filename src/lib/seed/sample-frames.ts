/**
 * Mock catalogue for demonstrating the recommendation engine.
 *
 * Chosen for *coverage*, not realism. The set is deliberately built so that:
 *
 *  - every face shape has at least two exact matches, in different sizes, so no
 *    answer combination lands on an empty page;
 *  - every frame size including `Custom` appears, so the adjacent-size partial
 *    credit in `scoreFrame` is exercised;
 *  - all five materials and all three comfort features appear, so Module 6's
 *    filters have something to filter;
 *  - a kids' frame exists, so the age rule can be seen working;
 *  - one frame is out of stock and one is unpublished, so the empty/hidden paths
 *    are covered by real data rather than only by unit tests.
 *
 * Prices are plausible Myanmar retail in MMK — frame only, before lenses.
 *
 * `videos` is empty throughout. There is no way to generate a real clip here,
 * and a broken <video> looks like a defect; Module 5 attaches real footage on
 * upload, and Module 7's gallery already has to handle "no video" anyway.
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

/**
 * Spaced-out timestamps so "newest first" has a deterministic order.
 * Counts backwards one day at a time from a fixed date — a fixed base keeps
 * re-seeding idempotent, which `Date.now()` would not.
 */
const BASE_MS = Date.UTC(2026, 6, 20); // 20 July 2026
const day = (n: number) => BASE_MS - n * 86_400_000;

type SampleFrame = Omit<FrameDoc, 'id'>;

const SAMPLES: SampleFrame[] = [
  {
    brand: 'Plan B',
    frameCode: 'PBV-2041',
    name: 'Yangon Round',
    price: 68_000,
    compareAtPrice: 85_000,
    faceShapes: ['Square', 'Heart', 'Diamond'],
    categories: ['Women', 'Best Seller'],
    frameSize: 'Medium',
    material: 'Acetate',
    comfortFeatures: ['Lightweight', 'Spring hinges'],
    suitedFor: ['Female'],
    variants: variants('PBV-2041', ['tortoise', 'rose', 'crystal']),
    description:
      'A soft round acetate that takes the edge off a strong jaw. Hand-polished, with a keyhole bridge that keeps weight off the nose.',
    createdAtMs: day(0),
    published: true,
  },
  {
    brand: 'Plan B',
    frameCode: 'PBV-1180',
    name: 'Inle Square',
    price: 74_000,
    compareAtPrice: null,
    faceShapes: ['Round', 'Oval'],
    categories: ['Men', 'New Arrival'],
    frameSize: 'Large',
    material: 'Titanium',
    comfortFeatures: ['Lightweight', 'Adjustable nose pads'],
    suitedFor: ['Male'],
    variants: variants('PBV-1180', ['gunmetal', 'navy', 'black']),
    description:
      'Squared titanium with a flat top bar. Structure for a rounder face, at a weight you stop noticing by mid-morning.',
    createdAtMs: day(1),
    published: true,
  },
  {
    brand: 'Aureum',
    frameCode: 'AU-330',
    name: 'Bagan Cat-Eye',
    price: 92_000,
    compareAtPrice: null,
    faceShapes: ['Round', 'Square', 'Oval'],
    categories: ['Women', 'New Arrival', 'Best Seller'],
    frameSize: 'Small',
    material: 'Metal',
    comfortFeatures: ['Adjustable nose pads'],
    suitedFor: ['Female'],
    variants: variants('AU-330', ['rose', 'burgundy', 'silver']),
    description:
      'An upswept cat-eye in fine metal. Lifts the cheekbone without tipping into costume.',
    createdAtMs: day(2),
    published: true,
  },
  {
    brand: 'Aureum',
    frameCode: 'AU-505',
    name: 'Mandalay Aviator',
    price: 110_000,
    compareAtPrice: 128_000,
    faceShapes: ['Oval', 'Heart', 'Diamond'],
    categories: ['Men', 'Best Seller'],
    frameSize: 'Large',
    material: 'Metal',
    comfortFeatures: ['Adjustable nose pads', 'Spring hinges'],
    suitedFor: ['Male'],
    variants: variants('AU-505', ['gunmetal', 'olive'], ['olive']),
    description:
      'The double-bridge aviator, wire-thin and unfussy. Wide enough to balance a broad forehead.',
    createdAtMs: day(3),
    published: true,
  },
  {
    brand: 'Loom',
    frameCode: 'LM-014',
    name: 'Studio Rectangle',
    price: 56_000,
    compareAtPrice: null,
    faceShapes: ['Round', 'Oval', 'Heart'],
    categories: ['Men', 'Women'],
    frameSize: 'Medium',
    material: 'Plastic',
    comfortFeatures: ['Lightweight'],
    suitedFor: ['Male', 'Female'],
    variants: variants('LM-014', ['black', 'navy', 'crystal']),
    description:
      'A plain rectangle that does its job and gets out of the way. The frame to own if you only own one.',
    createdAtMs: day(4),
    published: true,
  },
  {
    brand: 'Loom',
    frameCode: 'LM-077',
    name: 'Thanlyin Oversize',
    price: 79_000,
    compareAtPrice: null,
    faceShapes: ['Diamond', 'Heart', 'Square'],
    categories: ['Women', 'New Arrival'],
    frameSize: 'Extra Large',
    material: 'Acetate',
    comfortFeatures: ['Spring hinges'],
    suitedFor: ['Female'],
    variants: variants('LM-077', ['tortoise', 'coral']),
    description:
      'Deliberately oversized, with a low bridge that suits a narrower nose. Reads as confidence, not disguise.',
    createdAtMs: day(5),
    published: true,
  },
  {
    brand: 'Verdant',
    frameCode: 'VD-201',
    name: 'Bamboo Eco Round',
    price: 64_000,
    compareAtPrice: null,
    faceShapes: ['Square', 'Diamond'],
    categories: ['Men', 'Women'],
    frameSize: 'Medium',
    material: 'Eco-friendly',
    comfortFeatures: ['Lightweight', 'Adjustable nose pads'],
    suitedFor: ['Male', 'Female'],
    variants: variants('VD-201', ['olive', 'tortoise', 'black']),
    description:
      'Plant-based acetate from castor oil, not petroleum. Warmer to the touch than plastic, and it ages rather than yellows.',
    createdAtMs: day(6),
    published: true,
  },
  {
    brand: 'Verdant',
    frameCode: 'VD-088',
    name: 'Little Explorer',
    price: 38_000,
    compareAtPrice: null,
    faceShapes: ['Round', 'Oval', 'Square', 'Heart', 'Diamond'],
    categories: ['Kid'],
    frameSize: 'Extra Small',
    material: 'Plastic',
    comfortFeatures: ['Lightweight', 'Spring hinges'],
    suitedFor: ['Male', 'Female'],
    variants: variants('VD-088', ['coral', 'navy', 'olive']),
    description:
      'Built for a six-year-old who has not yet learned to take glasses off before a football match. Spring hinges, rounded everything.',
    createdAtMs: day(7),
    published: true,
  },
  {
    brand: 'Meridian',
    frameCode: 'MD-410',
    name: 'Half-Rim Classic',
    price: 71_000,
    compareAtPrice: null,
    faceShapes: ['Oval', 'Square'],
    categories: ['Men'],
    frameSize: 'Medium',
    material: 'Titanium',
    comfortFeatures: ['Lightweight'],
    suitedFor: ['Male'],
    variants: variants('MD-410', ['silver', 'gunmetal', 'navy']),
    description:
      'Nylon-cord half rim. Almost nothing on the face, and the lens edge does the framing.',
    createdAtMs: day(8),
    published: true,
  },
  {
    brand: 'Meridian',
    frameCode: 'MD-155',
    name: 'Petite Oval',
    price: 59_000,
    compareAtPrice: 69_000,
    faceShapes: ['Heart', 'Diamond', 'Round'],
    categories: ['Women', 'Best Seller'],
    frameSize: 'Small',
    material: 'Metal',
    comfortFeatures: ['Adjustable nose pads', 'Lightweight'],
    suitedFor: ['Female'],
    variants: variants('MD-155', ['rose', 'silver', 'burgundy']),
    description:
      'A small oval for a small face — properly scaled, not a shrunken men’s frame with a different colour.',
    createdAtMs: day(9),
    published: true,
  },
  {
    brand: 'Plan B',
    frameCode: 'PBV-9000',
    name: 'Bespoke Fit',
    price: 145_000,
    compareAtPrice: null,
    // Made to measure, so it flatters whatever face it is cut for.
    faceShapes: ['Round', 'Square', 'Oval', 'Heart', 'Diamond'],
    categories: ['Men', 'Women'],
    frameSize: 'Custom',
    material: 'Acetate',
    comfortFeatures: ['Lightweight', 'Adjustable nose pads', 'Spring hinges'],
    suitedFor: ['Male', 'Female'],
    variants: variants('PBV-9000', ['black', 'tortoise', 'burgundy', 'crystal']),
    description:
      'Measured, cut and fitted in store over two visits. For faces that no stock size has ever quite suited.',
    createdAtMs: day(10),
    published: true,
  },
  {
    brand: 'Loom',
    frameCode: 'LM-999',
    name: 'Winter Preview',
    price: 88_000,
    compareAtPrice: null,
    faceShapes: ['Oval', 'Square'],
    categories: ['New Arrival'],
    frameSize: 'Medium',
    material: 'Acetate',
    comfortFeatures: ['Lightweight'],
    suitedFor: ['Male', 'Female'],
    variants: variants('LM-999', ['navy', 'olive']),
    description:
      'Not released yet. Present in the catalogue so the unpublished path is covered by real data.',
    createdAtMs: day(11),
    // Deliberately hidden: proves `published: false` is honoured everywhere.
    published: false,
  },
];

/** The sample catalogue, with deterministic ids derived from brand + code. */
export const SAMPLE_FRAMES: FrameDoc[] = SAMPLES.map((frame) => ({
  ...frame,
  id: frameSlug(frame.brand, frame.frameCode),
}));

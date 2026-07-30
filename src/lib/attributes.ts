/**
 * The controlled vocabularies shared by the personalisation form (Module 3),
 * the admin upload form (Module 5) and the shop filters (Module 6).
 *
 * These live in one file on purpose. A face shape offered in the onboarding
 * form but spelled differently in the product uploader produces a filter that
 * silently matches nothing — and that bug is invisible until a customer
 * notices an empty shop page. Defining each list once, `as const`, means a
 * mismatch is a TypeScript error instead.
 *
 * The values are the exact strings stored in Firestore. Labels are *not* here:
 * they are translated through `t('attributes.…')` so the same stored value can
 * render in English or Burmese.
 */

export const FACE_SHAPES = ['Round', 'Square', 'Oval', 'Heart', 'Diamond'] as const;
export type FaceShape = (typeof FACE_SHAPES)[number];

export const FRAME_SIZES = [
  'Extra Small',
  'Small',
  'Medium',
  'Large',
  'Extra Large',
  'Custom',
] as const;
export type FrameSize = (typeof FRAME_SIZES)[number];

export const CATEGORIES = ['Men', 'Women', 'Kid', 'New Arrival', 'Best Seller'] as const;
export type Category = (typeof CATEGORIES)[number];

export const MATERIALS = ['Plastic', 'Metal', 'Eco-friendly', 'Titanium', 'Acetate'] as const;
export type Material = (typeof MATERIALS)[number];

export const COMFORT_FEATURES = [
  'Lightweight',
  'Adjustable nose pads',
  'Spring hinges',
] as const;
export type ComfortFeature = (typeof COMFORT_FEATURES)[number];

/**
 * Customer gender.
 *
 * The in-store POS records only `Male` / `Female`. This site offers a third
 * option because refusing to let someone answer honestly is a poor welcome,
 * and because the field's only job here is to bias frame recommendations. The
 * POS export maps `Other` to an empty value rather than inventing one, so the
 * counter never displays something the customer did not choose — see
 * `toPosCustomer` in `membership.ts`.
 */
export const GENDERS = ['Male', 'Female', 'Other'] as const;
export type Gender = (typeof GENDERS)[number];

/**
 * Translation-key helpers.
 *
 * `t(faceShapeKey('Oval'))` resolves to `attributes.faceShape.Oval`. The
 * template literal is returned `as const` so its type is the *literal* key
 * path, which means the typed `t()` still rejects it if the locale file is
 * missing that entry — the type safety survives the indirection.
 */
export const faceShapeKey = (v: FaceShape) => `attributes.faceShape.${v}` as const;
export const frameSizeKey = (v: FrameSize) => `attributes.frameSize.${v}` as const;
export const categoryKey = (v: Category) => `attributes.category.${v}` as const;
export const materialKey = (v: Material) => `attributes.material.${v}` as const;
export const comfortKey = (v: ComfortFeature) => `attributes.comfort.${v}` as const;
export const genderKey = (v: Gender) => `attributes.gender.${v}` as const;

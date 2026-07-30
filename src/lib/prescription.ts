/**
 * Prescription values, lens options and pricing.
 *
 * Pure — no React, no Firestore — so the validation and the arithmetic can be
 * tested. Both matter more here than anywhere else in the app: a wrong number in
 * this file becomes a pair of glasses somebody cannot see through.
 *
 * ── What the fields mean ───────────────────────────────────────────────────
 *  **Sph** (sphere)   Overall power. Negative for short-sight, positive for long.
 *  **Cyl** (cylinder) Astigmatism correction. Always paired with an axis.
 *  **Axis**           Orientation of the cylinder, 1–180 degrees.
 *  **Add**            Reading addition, progressives and bifocals only. Positive.
 *  **PD**             Pupillary distance in mm — how far apart the pupils are.
 *
 * ── The rule that drives most of the validation ────────────────────────────
 * Cyl and Axis are meaningless apart. A cylinder with no axis has no orientation
 * to grind, and an axis with no cylinder describes nothing. Opticians treat one
 * without the other as an incomplete prescription, so this file does too.
 */

/* ── Ranges ────────────────────────────────────────────────────────────────── */

/**
 * Bounds are deliberately generous — wider than most prescriptions, narrow enough
 * to catch a decimal point in the wrong place. `-52.5` instead of `-5.25` is the
 * mistake worth catching; refusing a genuine −14.00 would turn away a customer who
 * needs us most.
 */
export const SPH_MIN = -20;
export const SPH_MAX = 20;
export const CYL_MIN = -6;
export const CYL_MAX = 6;
export const AXIS_MIN = 1;
export const AXIS_MAX = 180;
export const ADD_MIN = 0.75;
export const ADD_MAX = 3.5;

/** Adult PD is 54–74mm; children go lower. Outside this, something is wrong. */
export const PD_MIN = 48;
export const PD_MAX = 80;

/** Lens powers are ground in quarter-dioptre steps. Anything else is unfillable. */
export const DIOPTRE_STEP = 0.25;

/* ── Lens options ──────────────────────────────────────────────────────────── */

export const LENS_TYPES = ['single-vision', 'progressive', 'bifocal', 'reading'] as const;
export type LensType = (typeof LENS_TYPES)[number];

/** Only these need a reading addition. */
export const LENS_TYPES_NEEDING_ADD: readonly LensType[] = ['progressive', 'bifocal', 'reading'];

export const LENS_COATINGS = ['blue-block', 'photochromic', 'anti-glare', 'scratch-resistant'] as const;
export type LensCoating = (typeof LENS_COATINGS)[number];

/**
 * Lens prices in MMK, on top of the frame.
 *
 * The shop's numbers to set — gathered here so they can be changed in one edit
 * and reviewed at a glance, rather than scattered through the wizard.
 */
export const LENS_PRICES: Record<LensType, number> = {
  'single-vision': 25_000,
  progressive: 120_000,
  bifocal: 65_000,
  reading: 20_000,
};

export const COATING_PRICES: Record<LensCoating, number> = {
  'blue-block': 18_000,
  photochromic: 45_000,
  'anti-glare': 15_000,
  'scratch-resistant': 10_000,
};

/**
 * High-index lenses, needed for strong prescriptions.
 *
 * Not a style choice: past about ±4.00 a standard lens becomes thick enough to
 * sit outside the frame's rim, so the wizard recommends this rather than offering
 * it as an upsell.
 */
export const HIGH_INDEX_PRICE = 35_000;
export const HIGH_INDEX_THRESHOLD = 4;

/* ── Types ─────────────────────────────────────────────────────────────────── */

/** One eye. `null` means "not entered", which is distinct from zero. */
export type EyePrescription = {
  sph: number | null;
  cyl: number | null;
  axis: number | null;
  add: number | null;
};

export type Prescription = {
  right: EyePrescription;
  left: EyePrescription;
  /** Millimetres. A single binocular PD, which is what a card measurement gives. */
  pd: number | null;
  /** How the PD was arrived at, so the shop knows how much to trust it. */
  pdSource: 'card' | 'known' | 'in-store' | null;
};

export type LensSelection = {
  lensType: LensType;
  coatings: LensCoating[];
  highIndex: boolean;
  prescription: Prescription;
  /**
   * Set when the customer would rather bring their prescription to the shop.
   * A legitimate choice — and for progressives, often the better one.
   */
  deferToStore: boolean;
};

export const EMPTY_EYE: EyePrescription = { sph: null, cyl: null, axis: null, add: null };

export const EMPTY_PRESCRIPTION: Prescription = {
  right: { ...EMPTY_EYE },
  left: { ...EMPTY_EYE },
  pd: null,
  pdSource: null,
};

export function emptySelection(): LensSelection {
  return {
    lensType: 'single-vision',
    coatings: [],
    highIndex: false,
    prescription: {
      right: { ...EMPTY_EYE },
      left: { ...EMPTY_EYE },
      pd: null,
      pdSource: null,
    },
    deferToStore: false,
  };
}

/* ── Validation ────────────────────────────────────────────────────────────── */

/**
 * Issue codes, as a closed union rather than `string`.
 *
 * This is what lets the wizard call `t(\`lens.issues.${code}\`)` and have the typed
 * `t()` verify it: a `string` here would widen the template literal to
 * `lens.issues.${string}`, which matches no known key, and the compiler would
 * either reject it or need a cast that hides a genuinely missing translation.
 */
export type PrescriptionIssueCode =
  | 'sphRange'
  | 'cylRange'
  | 'axisRange'
  | 'addRange'
  | 'pdRange'
  | 'step'
  | 'axisRequired'
  | 'cylRequired'
  | 'addRequired'
  | 'sphRequired'
  | 'pdRequired';

export type PrescriptionIssue = {
  /** Which control to point at. */
  field: 'right.sph' | 'right.cyl' | 'right.axis' | 'right.add'
    | 'left.sph' | 'left.cyl' | 'left.axis' | 'left.add'
    | 'pd' | 'lensType';
  /** Translation key suffix under `lens.issues`. */
  code: PrescriptionIssueCode;
  /** Interpolation values for the message. */
  values?: Record<string, number | string>;
};

/** True when a value sits on a grindable quarter-dioptre step. */
export function isOnDioptreStep(value: number): boolean {
  // Scaled to integers before the modulo: 0.25 cannot be represented exactly in
  // binary floating point, so `value % 0.25` returns 0.24999… for some inputs.
  return Math.round(value * 100) % Math.round(DIOPTRE_STEP * 100) === 0;
}

function checkEye(
  eye: EyePrescription,
  side: 'right' | 'left',
  needsAdd: boolean,
): PrescriptionIssue[] {
  const issues: PrescriptionIssue[] = [];
  const field = (name: 'sph' | 'cyl' | 'axis' | 'add') =>
    `${side}.${name}` as PrescriptionIssue['field'];

  if (eye.sph !== null) {
    if (eye.sph < SPH_MIN || eye.sph > SPH_MAX) {
      issues.push({ field: field('sph'), code: 'sphRange', values: { min: SPH_MIN, max: SPH_MAX } });
    } else if (!isOnDioptreStep(eye.sph)) {
      issues.push({ field: field('sph'), code: 'step' });
    }
  }

  if (eye.cyl !== null) {
    if (eye.cyl < CYL_MIN || eye.cyl > CYL_MAX) {
      issues.push({ field: field('cyl'), code: 'cylRange', values: { min: CYL_MIN, max: CYL_MAX } });
    } else if (!isOnDioptreStep(eye.cyl)) {
      issues.push({ field: field('cyl'), code: 'step' });
    }
  }

  if (eye.axis !== null) {
    if (!Number.isInteger(eye.axis) || eye.axis < AXIS_MIN || eye.axis > AXIS_MAX) {
      issues.push({ field: field('axis'), code: 'axisRange', values: { min: AXIS_MIN, max: AXIS_MAX } });
    }
  }

  // The pairing rule. A non-zero cylinder must have an axis, and an axis is
  // meaningless without a cylinder to orient.
  const hasCyl = eye.cyl !== null && eye.cyl !== 0;
  const hasAxis = eye.axis !== null;

  if (hasCyl && !hasAxis) issues.push({ field: field('axis'), code: 'axisRequired' });
  if (hasAxis && !hasCyl) issues.push({ field: field('cyl'), code: 'cylRequired' });

  if (needsAdd) {
    if (eye.add === null) {
      issues.push({ field: field('add'), code: 'addRequired' });
    } else if (eye.add < ADD_MIN || eye.add > ADD_MAX) {
      issues.push({ field: field('add'), code: 'addRange', values: { min: ADD_MIN, max: ADD_MAX } });
    } else if (!isOnDioptreStep(eye.add)) {
      issues.push({ field: field('add'), code: 'step' });
    }
  }

  return issues;
}

/**
 * Every problem with a selection, or an empty array when it is fillable.
 *
 * Returns all issues rather than the first, because a prescription form has ten
 * fields and fixing them one error at a time is miserable.
 *
 * A `deferToStore` selection skips prescription checks entirely — there is nothing
 * to validate when the customer is bringing the numbers in person.
 */
export function validateSelection(selection: LensSelection): PrescriptionIssue[] {
  if (selection.deferToStore) return [];

  const issues: PrescriptionIssue[] = [];
  const needsAdd = LENS_TYPES_NEEDING_ADD.includes(selection.lensType);

  issues.push(...checkEye(selection.prescription.right, 'right', needsAdd));
  issues.push(...checkEye(selection.prescription.left, 'left', needsAdd));

  const { pd } = selection.prescription;
  if (pd === null) {
    issues.push({ field: 'pd', code: 'pdRequired' });
  } else if (pd < PD_MIN || pd > PD_MAX) {
    issues.push({ field: 'pd', code: 'pdRange', values: { min: PD_MIN, max: PD_MAX } });
  }

  // At least one eye needs a power, or there is nothing to make.
  const anyPower =
    selection.prescription.right.sph !== null || selection.prescription.left.sph !== null;
  if (!anyPower) issues.push({ field: 'right.sph', code: 'sphRequired' });

  return issues;
}

/** Whether the wizard can proceed to checkout. */
export function isSelectionComplete(selection: LensSelection): boolean {
  return validateSelection(selection).length === 0;
}

/* ── Recommendations ───────────────────────────────────────────────────────── */

/**
 * The strongest absolute power across both eyes, which is what decides lens
 * thickness — a −1.00 right eye and a −6.00 left still needs a thin left lens.
 */
export function strongestPower(prescription: Prescription): number {
  const values = [prescription.right.sph, prescription.left.sph]
    .filter((value): value is number => value !== null)
    .map(Math.abs);

  return values.length > 0 ? Math.max(...values) : 0;
}

export function recommendsHighIndex(prescription: Prescription): boolean {
  return strongestPower(prescription) >= HIGH_INDEX_THRESHOLD;
}

/* ── Pricing ───────────────────────────────────────────────────────────────── */

export type PriceBreakdown = {
  frameKyat: number;
  lensKyat: number;
  coatingsKyat: number;
  highIndexKyat: number;
  totalKyat: number;
  lines: Array<{ labelKey: string; values?: Record<string, string>; kyat: number }>;
};

/**
 * Itemised total for a frame plus lenses.
 *
 * Returns the lines as well as the sum so the summary can show its working. A
 * single total invites "why is it that much?", and this is the one place in the
 * flow where the price roughly triples.
 */
export function priceSelection(framePriceKyat: number, selection: LensSelection): PriceBreakdown {
  const lines: PriceBreakdown['lines'] = [
    { labelKey: 'lens.priceLines.frame', kyat: framePriceKyat },
  ];

  // A deferred selection prices the frame alone — lenses are quoted in store once
  // the prescription is confirmed.
  if (selection.deferToStore) {
    return {
      frameKyat: framePriceKyat,
      lensKyat: 0,
      coatingsKyat: 0,
      highIndexKyat: 0,
      totalKyat: framePriceKyat,
      lines,
    };
  }

  const lensKyat = LENS_PRICES[selection.lensType];
  lines.push({
    labelKey: `lens.types.${selection.lensType}`,
    kyat: lensKyat,
  });

  let coatingsKyat = 0;
  for (const coating of selection.coatings) {
    const price = COATING_PRICES[coating];
    coatingsKyat += price;
    lines.push({ labelKey: `lens.coatings.${coating}`, kyat: price });
  }

  const highIndexKyat = selection.highIndex ? HIGH_INDEX_PRICE : 0;
  if (selection.highIndex) {
    lines.push({ labelKey: 'lens.highIndex', kyat: highIndexKyat });
  }

  return {
    frameKyat: framePriceKyat,
    lensKyat,
    coatingsKyat,
    highIndexKyat,
    totalKyat: framePriceKyat + lensKyat + coatingsKyat + highIndexKyat,
    lines,
  };
}

/* ── Formatting ────────────────────────────────────────────────────────────── */

/**
 * Formats a dioptre value the way an optician writes it: signed, two decimals.
 *
 * The explicit `+` is not decoration. On a prescription, `2.00` and `+2.00` mean
 * the same thing but `-2.00` is a different lens entirely, so the sign is always
 * written to remove any doubt about an omitted minus.
 */
export function formatDioptre(value: number | null): string {
  if (value === null) return '—';
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(2)}`;
}

export function formatAxis(value: number | null): string {
  // Axis is conventionally written to three digits: 5 degrees is "005".
  return value === null ? '—' : `${String(value).padStart(3, '0')}°`;
}

/** A one-line summary for the Telegram order message (Module 8). */
export function summarisePrescription(prescription: Prescription): string {
  const eye = (side: EyePrescription) => {
    const parts = [`SPH ${formatDioptre(side.sph)}`];
    if (side.cyl !== null && side.cyl !== 0) {
      parts.push(`CYL ${formatDioptre(side.cyl)}`, `AXIS ${formatAxis(side.axis)}`);
    }
    if (side.add !== null) parts.push(`ADD ${formatDioptre(side.add)}`);
    return parts.join(' ');
  };

  const pd = prescription.pd === null ? '—' : `${prescription.pd}mm`;
  return `R: ${eye(prescription.right)} | L: ${eye(prescription.left)} | PD: ${pd}`;
}

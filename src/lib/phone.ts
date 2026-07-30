/**
 * Myanmar phone number parsing.
 *
 * The phone number is the primary key for a Plan B Vision member, because it is
 * the one identifier that already exists on both sides of the counter: the shop
 * staff type it into the POS, and the customer types it into this site. That
 * only works if both sides agree on *one* spelling of a given number, so every
 * phone number entering the system goes through `parsePhone` first.
 *
 * A single customer will write their number at least these ways:
 *
 *   09 771 234 567      +95 9 771 234 567      0095 9771234567
 *   09-771-234-567      959771234567           ၀၉၇၇၁၂၃၄၅၆၇
 *
 * All six are the same person and must collapse to the same key.
 */

/** Myanmar country calling code. */
const COUNTRY_CODE = '95';

/**
 * Myanmar mobile numbers, written without the trunk `0`, always start with `9`
 * and run 8–11 digits in total.
 *
 * This validates the *structure* rather than checking a table of operator
 * prefixes (MPT / ATOM / Ooredoo / Mytel). Operators are issued new prefixes
 * regularly, and rejecting a real customer's brand-new number is a far worse
 * failure than accepting a typo that the OTP will catch a second later anyway.
 */
const NSN_PATTERN = /^9\d{7,10}$/;

/** Myanmar digits ၀–၉ occupy a contiguous Unicode block at U+1040. */
const MYANMAR_ZERO = 0x1040;

export type PhoneErrorCode =
  | 'empty'
  | 'unsupportedCountry'
  | 'tooShort'
  | 'tooLong'
  | 'invalid';

export type ParsedPhone = {
  /** Canonical international form, e.g. `+959771234567`. Store this. */
  e164: string;
  /**
   * Firestore document id for the member: `e164` without the `+`, e.g.
   * `959771234567`. Firestore allows `+` in ids, but a key that also survives
   * URLs, file names and CSV exports untouched is worth the two characters.
   */
  key: string;
  /** National significant number — `e164` without the country code. */
  nsn: string;
  /** How a Myanmar customer expects to read it back: `09 771 234 567`. */
  display: string;
};

export type PhoneParseResult =
  | { ok: true; phone: ParsedPhone }
  | { ok: false; code: PhoneErrorCode };

/** Rewrites Myanmar numerals to ASCII so ၀၉ and 09 parse identically. */
function toAsciiDigits(input: string): string {
  let out = '';
  for (const char of input) {
    const code = char.codePointAt(0) ?? 0;
    out +=
      code >= MYANMAR_ZERO && code <= MYANMAR_ZERO + 9
        ? String(code - MYANMAR_ZERO)
        : char;
  }
  return out;
}

/**
 * Strips a leading `95` — but only when the remainder is still a plausible
 * national number.
 *
 * This guard is the whole reason this is a function. MPT issues numbers like
 * `09 5xx xxx xx`, which become `95xxxxxxx` once the trunk `0` is gone, so a
 * blind two-character chop would silently mangle a large chunk of the country's
 * subscribers into a different, valid-looking number.
 */
function stripCountryCode(digits: string): string {
  if (!digits.startsWith(COUNTRY_CODE)) return digits;
  const remainder = digits.slice(COUNTRY_CODE.length);
  return NSN_PATTERN.test(remainder) ? remainder : digits;
}

/**
 * Parses any of the forms above into one canonical shape.
 *
 * @param input Raw user text — spaces, dashes, brackets and Myanmar numerals
 *              are all fine.
 */
export function parsePhone(input: string): PhoneParseResult {
  const raw = toAsciiDigits(input).trim();
  if (!raw) return { ok: false, code: 'empty' };

  // A `+` only means "country code follows" in the leading position; anywhere
  // else it is a typo, and stripping it quietly is kinder than erroring.
  const isExplicitlyInternational = raw.startsWith('+') || raw.startsWith('00');
  const digits = raw.replace(/\D/g, '');
  if (!digits) return { ok: false, code: 'invalid' };

  let nsn: string;

  if (isExplicitlyInternational) {
    const withoutExitCode = raw.startsWith('00') ? digits.slice(2) : digits;
    if (!withoutExitCode.startsWith(COUNTRY_CODE)) {
      // The customer told us the country and it is not Myanmar. Say so, rather
      // than guessing at a number we cannot deliver an SMS to.
      return { ok: false, code: 'unsupportedCountry' };
    }
    nsn = withoutExitCode.slice(COUNTRY_CODE.length);
  } else if (digits.startsWith('0')) {
    // Trunk prefix. Drop it first, then re-check for a country code, because
    // `0 95 9771234567` is a common way to mash both together.
    nsn = stripCountryCode(digits.replace(/^0+/, ''));
  } else {
    nsn = stripCountryCode(digits);
  }

  if (!NSN_PATTERN.test(nsn)) {
    if (!nsn.startsWith('9')) return { ok: false, code: 'invalid' };
    if (nsn.length < 8) return { ok: false, code: 'tooShort' };
    return { ok: false, code: 'tooLong' };
  }

  const e164 = `+${COUNTRY_CODE}${nsn}`;

  return {
    ok: true,
    phone: {
      e164,
      key: `${COUNTRY_CODE}${nsn}`,
      nsn,
      display: formatNational(nsn),
    },
  };
}

/**
 * Groups a national number the way it is written on Myanmar shopfronts and
 * business cards: `09 771 234 567`, trailing group short if it has to be.
 */
function formatNational(nsn: string): string {
  const subscriber = nsn.slice(1);
  const groups = subscriber.match(/\d{1,3}/g) ?? [];
  return `09 ${groups.join(' ')}`.trim();
}

/** Convenience predicate for form-level validation. */
export function isValidPhone(input: string): boolean {
  return parsePhone(input).ok;
}

/**
 * Formats a stored `e164` back for display without re-running validation.
 * Falls back to the input untouched so a legacy or foreign number imported
 * from the POS still renders as *something* rather than blank.
 */
export function formatPhone(e164: string): string {
  const result = parsePhone(e164);
  return result.ok ? result.phone.display : e164;
}

/**
 * The doc id for a phone number, or `null` if it does not parse.
 * Use this anywhere a member document is addressed.
 */
export function phoneKey(input: string): string | null {
  const result = parsePhone(input);
  return result.ok ? result.phone.key : null;
}

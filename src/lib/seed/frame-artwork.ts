/**
 * Placeholder frame artwork, drawn as SVG data URIs.
 *
 * Why generated art instead of stock photography:
 *
 *  - **It cannot break.** No external host, no CSP exception, no expired CDN
 *    link, and it renders with the network off. Seed data that shows broken
 *    image icons is worse than no seed data, because it reads as a bug in the
 *    shop rather than as missing content.
 *  - **The colour is real.** Each drawing is tinted from the variant's own
 *    swatch, so clicking through C-numbers visibly changes the picture — which
 *    is precisely the behaviour the catalogue needs to demonstrate.
 *  - **It is honestly fake.** A line drawing is obviously a placeholder. Real
 *    photographs of frames the shop does not stock would be a small lie sitting
 *    in the database waiting to reach a customer.
 *
 * Module 5 replaces these with Firebase Storage download URLs from real uploads.
 * Nothing downstream cares which it is: both are just strings in `images`.
 */

/** Two angles per colour, so the brief's "at least 2 images" is real content. */
export type Angle = 'front' | 'angled';

/**
 * Encodes SVG for a data URI.
 *
 * `encodeURIComponent` rather than base64: it keeps the markup legible in the
 * Firestore console (useful when debugging seed data) and avoids the ~33% size
 * increase base64 would add to every document.
 */
function toDataUri(svg: string): string {
  const compact = svg.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(compact)}`;
}

/**
 * A pair of glasses in the given colour.
 *
 * @param color  Frame colour — any CSS colour string.
 * @param angle  `front` is symmetrical; `angled` foreshortens one side and shows
 *               a temple arm, so the two images are visibly different rather
 *               than the same picture twice.
 * @param label  Drawn faintly in the corner, so it is obvious at a glance which
 *               C-number a card is showing while testing.
 */
export function frameImage(color: string, angle: Angle, label: string): string {
  const front = angle === 'front';

  // Angled view: squash horizontally and shear slightly for a sense of turn.
  const transform = front
    ? 'translate(200 150)'
    : 'translate(200 150) scale(0.86 1) skewX(-6)';

  const lensFill = 'rgba(148,163,184,0.20)';

  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f8fafc"/>
          <stop offset="1" stop-color="#e9eef5"/>
        </linearGradient>
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.05"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0.30"/>
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill="url(#bg)"/>

      <g ${front ? '' : 'opacity="0.97"'} transform="${transform}"
         fill="none" stroke="${color}" stroke-width="9"
         stroke-linecap="round" stroke-linejoin="round">
        <!-- Lenses -->
        <rect x="-152" y="-46" width="126" height="86" rx="30" fill="${lensFill}"/>
        <rect x="26" y="-46" width="126" height="86" rx="30" fill="${lensFill}"/>
        <!-- Bridge -->
        <path d="M-26 -12 q26 -18 52 0"/>
        <!-- Temple arms -->
        <path d="M-152 -20 l-34 -12"/>
        ${
          front
            ? '<path d="M152 -20 l34 -12"/>'
            : '<path d="M152 -20 l40 6 l6 74" stroke-width="8"/>'
        }
      </g>

      <!-- Specular highlight, so the lens reads as glass rather than a hole -->
      <g transform="${transform}" opacity="0.75">
        <rect x="-146" y="-40" width="52" height="74" rx="24" fill="url(#sheen)"/>
        <rect x="32" y="-40" width="52" height="74" rx="24" fill="url(#sheen)"/>
      </g>

      <text x="376" y="284" text-anchor="end" font-family="system-ui, sans-serif"
            font-size="13" fill="#94a3b8">${label}</text>
    </svg>
  `);
}

/** Both angles for one colourway, in card order (front first). */
export function frameImages(color: string, label: string): string[] {
  return [frameImage(color, 'front', label), frameImage(color, 'angled', label)];
}

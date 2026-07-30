/**
 * Placeholder lookbook imagery, generated as SVG data URIs.
 *
 * Same reasoning as the frame artwork: no external host, cannot 404, works
 * offline, and is visibly a placeholder rather than a photograph of someone who
 * never modelled for this shop.
 *
 * These are stylised portraits — a shoulders-and-head silhouette wearing the
 * frame — on a two-tone backdrop. Enough to judge layout, spacing and the
 * pairing of frame shape to face shape, which is what a lookbook grid has to
 * prove before real photography exists.
 */

export type Palette = {
  /** Backdrop gradient. */
  from: string;
  to: string;
  /** Silhouette fill. */
  figure: string;
  /** Frame colour. */
  frame: string;
};

export const LOOKBOOK_PALETTES: Record<string, Palette> = {
  warmClay: { from: '#e8d5c4', to: '#d4a58a', figure: '#8a5a44', frame: '#3b2418' },
  coolSlate: { from: '#dde4ec', to: '#b3c2d4', figure: '#4a5a70', frame: '#1e293b' },
  softSage: { from: '#dfe7dc', to: '#b8c9b4', figure: '#556b52', frame: '#2f3e2c' },
  duskRose: { from: '#f0dce0', to: '#d8adb8', figure: '#7d5560', frame: '#4a2a33' },
  amberDusk: { from: '#f2e3c8', to: '#dcbc84', figure: '#7a6035', frame: '#3d2f18' },
  deepTeal: { from: '#d3e6e6', to: '#a3c8c8', figure: '#3f6363', frame: '#16302f' },
};

/**
 * Face silhouette widths, so a "square face" look actually shows a squarer jaw.
 * Crude, but the alternative — the same head on every card — would make the
 * face-shape pairing the lookbook is meant to demonstrate meaningless.
 */
type HeadShape = 'round' | 'square' | 'oval' | 'heart' | 'diamond';

const HEAD_PATHS: Record<HeadShape, string> = {
  round: 'M100 34 C126 34 142 58 142 88 C142 122 124 148 100 148 C76 148 58 122 58 88 C58 58 74 34 100 34 Z',
  square: 'M64 40 L136 40 C140 40 142 44 142 48 L142 126 C142 140 132 150 118 150 L82 150 C68 150 58 140 58 126 L58 48 C58 44 60 40 64 40 Z',
  oval: 'M100 30 C124 30 140 58 140 90 C140 126 122 152 100 152 C78 152 60 126 60 90 C60 58 76 30 100 30 Z',
  heart: 'M60 50 C72 38 86 32 100 32 C114 32 128 38 140 50 C142 74 136 100 120 126 C112 140 105 148 100 152 C95 148 88 140 80 126 C64 100 58 74 60 50 Z',
  diamond: 'M100 30 C112 30 124 48 130 70 C138 82 142 90 142 96 C142 106 134 122 122 136 C112 148 105 152 100 154 C95 152 88 148 78 136 C66 122 58 106 58 96 C58 90 62 82 70 70 C76 48 88 30 100 30 Z',
};

function toDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

/**
 * A stylised portrait wearing the frame.
 *
 * @param palette   Colour scheme.
 * @param head      Face silhouette to draw, matching the look's face shape.
 * @param label     Small caption in the corner, so the card is identifiable
 *                  while testing without reading the surrounding markup.
 * @param portrait  Taller aspect for the editorial grid's feature tiles.
 */
export function lookbookImage(
  palette: Palette,
  head: HeadShape,
  label: string,
  portrait = false,
): string {
  const height = portrait ? 260 : 200;

  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ${height}" width="200" height="${height}">
      <defs>
        <linearGradient id="bd" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="${palette.from}"/>
          <stop offset="1" stop-color="${palette.to}"/>
        </linearGradient>
      </defs>

      <rect width="200" height="${height}" fill="url(#bd)"/>

      <!-- Shoulders, anchored to the bottom edge so the figure is cropped like
           a real portrait rather than floating in the middle. -->
      <path d="M40 ${height} C46 ${height - 46} 74 ${height - 62} 100 ${height - 62}
               C126 ${height - 62} 154 ${height - 46} 160 ${height} Z"
            fill="${palette.figure}" opacity="0.9"/>

      <!-- Neck -->
      <rect x="88" y="${height - 90}" width="24" height="34" fill="${palette.figure}" opacity="0.9"/>

      <!-- Head -->
      <g transform="translate(0 ${height - 260 + 44})">
        <path d="${HEAD_PATHS[head]}" fill="${palette.figure}"/>

        <!-- Glasses: two lenses, bridge, temple. Drawn over the face so the
             pairing of frame width to jaw width is actually visible. -->
        <g fill="none" stroke="${palette.frame}" stroke-width="5"
           stroke-linecap="round" stroke-linejoin="round">
          <rect x="63" y="76" width="32" height="24" rx="9" fill="rgba(255,255,255,0.22)"/>
          <rect x="105" y="76" width="32" height="24" rx="9" fill="rgba(255,255,255,0.22)"/>
          <path d="M95 84 q5 -5 10 0"/>
          <path d="M63 82 l-9 -3"/>
          <path d="M137 82 l9 -3"/>
        </g>
      </g>

      <text x="190" y="${height - 10}" text-anchor="end"
            font-family="system-ui, sans-serif" font-size="9"
            fill="${palette.frame}" opacity="0.55">${label}</text>
    </svg>
  `);
}

/**
 * A video placeholder frame: the same portrait, dimmed, with a play glyph.
 *
 * Drawn rather than composited in CSS so the "this is a video" affordance
 * survives into the lightbox and into any screenshot, and so the card cannot
 * ever render as a broken <video> element.
 */
export function lookbookVideoPoster(
  palette: Palette,
  head: HeadShape,
  label: string,
): string {
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="bd" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stop-color="${palette.from}"/>
          <stop offset="1" stop-color="${palette.to}"/>
        </linearGradient>
      </defs>

      <rect width="200" height="200" fill="url(#bd)"/>

      <path d="M40 200 C46 154 74 138 100 138 C126 138 154 154 160 200 Z"
            fill="${palette.figure}" opacity="0.9"/>
      <rect x="88" y="110" width="24" height="34" fill="${palette.figure}" opacity="0.9"/>

      <g transform="translate(0 -16)">
        <path d="${HEAD_PATHS[head]}" fill="${palette.figure}"/>
        <g fill="none" stroke="${palette.frame}" stroke-width="5"
           stroke-linecap="round" stroke-linejoin="round">
          <rect x="63" y="76" width="32" height="24" rx="9" fill="rgba(255,255,255,0.22)"/>
          <rect x="105" y="76" width="32" height="24" rx="9" fill="rgba(255,255,255,0.22)"/>
          <path d="M95 84 q5 -5 10 0"/>
        </g>
      </g>

      <rect width="200" height="200" fill="#0b1220" opacity="0.28"/>

      <circle cx="100" cy="100" r="26" fill="#ffffff" opacity="0.92"/>
      <path d="M92 88 L92 112 L114 100 Z" fill="${palette.frame}"/>

      <text x="100" y="176" text-anchor="middle"
            font-family="system-ui, sans-serif" font-size="10"
            fill="#ffffff" opacity="0.85">${label}</text>
    </svg>
  `);
}

export type { HeadShape };

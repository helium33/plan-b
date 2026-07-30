/**
 * Drawn face-shape outlines.
 *
 * The single most important design decision in the onboarding form: almost
 * nobody knows their own face shape as a word. Offering a dropdown of
 * "Round / Square / Oval / Heart / Diamond" asks a question the customer cannot
 * answer, and a guessed answer poisons every recommendation that follows.
 *
 * A picture they can hold up against a mirror turns an exam question into a
 * comparison. The outlines are deliberately schematic — a recognisable silhouette
 * beats an anatomically careful drawing that reads as a specific person's face.
 */
import type { FaceShape } from '@/lib/attributes';

/**
 * SVG path per shape, all drawn in the same 100×120 box so they are directly
 * comparable — the differences between them are the entire point, and any
 * variation in scale or framing would read as a difference in shape.
 */
const OUTLINES: Record<FaceShape, string> = {
  // Equal width and height, continuous curve, no corners.
  Round: 'M50 8 C74 8 88 30 88 58 C88 90 71 112 50 112 C29 112 12 90 12 58 C12 30 26 8 50 8 Z',
  // Flat forehead and flat jaw, near-vertical sides, softened corners.
  Square: 'M18 14 L82 14 C86 14 88 17 88 21 L88 96 C88 104 82 110 74 110 L26 110 C18 110 12 104 12 96 L12 21 C12 17 14 14 18 14 Z',
  // Longer than wide, widest at the cheek, tapering both ends.
  Oval: 'M50 6 C70 6 84 26 84 58 C84 92 69 114 50 114 C31 114 16 92 16 58 C16 26 30 6 50 6 Z',
  // Broad forehead, narrow chin, coming to a point.
  Heart: 'M14 26 C24 16 38 12 50 12 C62 12 76 16 86 26 C88 46 82 68 68 88 C62 98 56 108 50 112 C44 108 38 98 32 88 C18 68 12 46 14 26 Z',
  // Narrow forehead, wide cheekbones, narrow chin.
  Diamond: 'M50 6 C60 6 70 20 76 38 C84 48 88 56 88 60 C88 66 82 78 74 90 C64 104 56 112 50 114 C44 112 36 104 26 90 C18 78 12 66 12 60 C12 56 16 48 24 38 C30 20 40 6 50 6 Z',
};

/**
 * One face outline.
 *
 * `aria-hidden` because the shape's name and description are always rendered as
 * text beside it — announcing the drawing as well would just repeat them.
 */
export function FaceShapeOutline({
  shape,
  className,
}: {
  shape: FaceShape;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      <path
        d={OUTLINES[shape]}
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Eye line and mouth: without them the outlines read as abstract blobs
          rather than faces, which makes them much harder to match to a mirror. */}
      <circle cx="36" cy="52" r="2.6" fill="currentColor" opacity="0.5" />
      <circle cx="64" cy="52" r="2.6" fill="currentColor" opacity="0.5" />
      <path
        d="M41 78 Q50 84 59 78"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

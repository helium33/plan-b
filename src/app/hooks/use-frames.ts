/**
 * Loads the catalogue once for a page.
 *
 * Extracted because the shop, wishlist and compare pages all need the same
 * fetch-and-handle-failure dance, and three copies of it would drift. Returns the
 * three states a page has to render — loading, failed, loaded — rather than a
 * bare array, so none of them can be forgotten.
 */
import { useEffect, useState } from 'react';

import { listFrames } from '@/lib/firestore/frames';
import type { FrameDoc } from '@/lib/product';

export type UseFrames = {
  /** `null` while loading. */
  frames: FrameDoc[] | null;
  failed: boolean;
  /** Look up by id — wishlist and compare both store ids, not documents. */
  byId: (id: string) => FrameDoc | undefined;
};

export function useFrames(): UseFrames {
  const [frames, setFrames] = useState<FrameDoc[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    listFrames()
      .then((result) => {
        if (active) setFrames(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    frames,
    failed,
    byId: (id) => frames?.find((frame) => frame.id === id),
  };
}

/**
 * Resolves a list of ids to frames, in the order the ids were given.
 *
 * Ids that no longer resolve are dropped silently. That happens for real: a frame
 * saved to a wishlist last month can be deleted or unpublished by the shop since,
 * and the alternative — rendering a gap or an error per missing frame — would make
 * the shop's own catalogue edits look like a bug in the customer's list.
 */
export function resolveFrames(ids: string[], frames: FrameDoc[] | null): FrameDoc[] {
  if (!frames) return [];
  const index = new Map(frames.map((frame) => [frame.id, frame]));
  return ids.map((id) => index.get(id)).filter((frame): frame is FrameDoc => frame !== undefined);
}

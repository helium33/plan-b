/**
 * Loads the catalogue once for a page.
 *
 * Extracted because the catalogue and the voucher both need the same
 * fetch-and-handle-failure dance, and two copies of it would drift. Returns the
 * three states a page has to render — loading, failed, loaded — rather than a
 * bare array, so none of them can be forgotten.
 */
import { useCallback, useEffect, useState } from 'react';

import { env } from '@/lib/env';
import { listFrames } from '@/lib/firestore/frames';
import type { FrameDoc } from '@/lib/product';

export type UseFrames = {
  /** `null` while loading. */
  frames: FrameDoc[] | null;
  failed: boolean;
  /** Fetch again — after the POS sync has added frames, for one. */
  reload: () => void;
};

/**
 * The demo catalogue, loaded only when `VITE_USE_SAMPLE_CATALOGUE=true`.
 *
 * A dynamic import so the sample data and its generated artwork stay in their
 * own chunk, never fetched by a real deployment. The flag exists because this
 * app is useless to look at without a catalogue, and standing up a Firebase
 * project is a poor first step for someone who just wants to see whether the
 * ordering flow suits their shop.
 */
const loadSamples = () => import('@/lib/seed/sample-frames');

export function useFrames(): UseFrames {
  const [frames, setFrames] = useState<FrameDoc[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;

    const request = env.useSampleCatalogue
      ? loadSamples().then(({ SAMPLE_FRAMES }) =>
          // Filtered here rather than in the fixture, so the demo shows exactly
          // what a buyer would see and the unpublished sample still proves the
          // `published` flag is honoured.
          SAMPLE_FRAMES.filter((frame) => frame.published),
        )
      : listFrames();

    request
      .then((result) => {
        if (active) setFrames(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { frames, failed, reload };
}

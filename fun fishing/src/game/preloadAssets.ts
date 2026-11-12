import {
  FISHING_AREAS,
  RODS,
  REELS,
  LURES,
  FISH_COLLECTION,
  getRodSpriteUrl,
  getReelSpriteUrl,
  getLureSpriteUrl,
  getAreaBannerUrl,
  getFishSpriteUrl,
} from './fishingLogic';
import { BOATS_CATALOG, getBoatSpriteUrl } from './commercialLogic';
import { soundManager } from './audioLogic';

// Global in-memory cache retaining HTMLImageElement references throughout app lifetime.
// Keeping live DOM image objects prevents the browser from discarding decoded bitmaps.
export const GLOBAL_IMAGE_CACHE = new Map<string, HTMLImageElement>();

export function preloadSingleImage(url: string): Promise<void> {
  if (!url) return Promise.resolve();
  if (GLOBAL_IMAGE_CACHE.has(url)) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      GLOBAL_IMAGE_CACHE.set(url, img);
      resolve();
    };
    img.onerror = () => {
      // Resolve anyway so loading screen is never stuck
      resolve();
    };
    img.src = url;
  });
}

/**
 * Preloads all high-priority visual assets (all 6 area backgrounds, all rods,
 * reels, lures, boats, junk, and starter fish).
 */
export async function preloadCriticalGameAssets(
  onProgress?: (progressPct: number) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Audio preloading (all ambient tracks and reeling sfx)
  soundManager.preloadAllAudio();

  // 2. Critical assets needed on the immediate screens
  const criticalUrls: string[] = [
    ...FISHING_AREAS.map((a) => getAreaBannerUrl(a.id)),
    ...RODS.map((r) => getRodSpriteUrl(r.id)),
    ...REELS.map((r) => getReelSpriteUrl(r.id)),
    ...LURES.map((l) => getLureSpriteUrl(l.id)),
    ...BOATS_CATALOG.map((b) => getBoatSpriteUrl(b.id)),
    './fish/bluegill.png',
    './fish/largemouth_bass.png',
    './fish/rainbow_trout.png',
    './fish/yellow_perch.png',
    './fish/channel_catfish.png',
    './fish/treasure_chest.png',
    './junk/waterlogged_boot.png',
    './junk/rusty_tin_can.png',
    './junk/clump_of_seaweed.png',
    './junk/sunken_driftwood.png',
    './lures/none.png',
  ];

  let loadedCount = 0;
  const total = criticalUrls.length;

  const promises = criticalUrls.map(async (url) => {
    await preloadSingleImage(url);
    loadedCount += 1;
    if (onProgress) {
      onProgress(Math.min(100, Math.round((loadedCount / total) * 100)));
    }
  });

  await Promise.all(promises);

  // 3. Background stream all remaining fish catalog species into memory
  const remainingFishUrls = FISH_COLLECTION.map((f) => getFishSpriteUrl(f)).filter(
    (url) => !GLOBAL_IMAGE_CACHE.has(url)
  );

  let idx = 0;
  const batchSize = 8;
  const pumpRemaining = () => {
    const batch = remainingFishUrls.slice(idx, idx + batchSize);
    for (const url of batch) {
      preloadSingleImage(url);
    }
    idx += batchSize;
    if (idx < remainingFishUrls.length) {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(pumpRemaining, { timeout: 400 });
      } else {
        setTimeout(pumpRemaining, 50);
      }
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(pumpRemaining, { timeout: 250 });
  } else {
    setTimeout(pumpRemaining, 40);
  }
}

/**
 * Legacy non-blocking kick-off
 */
export function preloadGameAssets(): void {
  preloadCriticalGameAssets();
}

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

const preloadedImages = new Set<string>();

function preloadSingleImage(url: string): Promise<void> {
  if (!url || preloadedImages.has(url)) return Promise.resolve();
  preloadedImages.add(url);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Preloads all audio tracks and visual sprites so that web gameplay is instant
 * with zero loading lag, flickering, or audio delay.
 */
export function preloadGameAssets(): void {
  if (typeof window === 'undefined') return;

  // 1. Audio preloading (all ambient tracks and reeling sfx)
  soundManager.preloadAllAudio();

  // 2. High-priority images (Area banners, starter rods/reels/lures, common catches)
  const highPriorityUrls: string[] = [
    ...FISHING_AREAS.map((a) => getAreaBannerUrl(a.id)),
    ...RODS.slice(0, 6).map((r) => getRodSpriteUrl(r.id)),
    ...REELS.slice(0, 6).map((r) => getReelSpriteUrl(r.id)),
    ...LURES.slice(0, 8).map((l) => getLureSpriteUrl(l.id)),
    ...BOATS_CATALOG.slice(0, 4).map((b) => getBoatSpriteUrl(b.id)),
    './fish/bluegill.png',
    './fish/largemouth_bass.png',
    './fish/rainbow_trout.png',
    './fish/yellow_perch.png',
    './fish/treasure_chest.png',
    './fish/channel_catfish.png',
  ];

  for (const url of highPriorityUrls) {
    preloadSingleImage(url);
  }

  // 3. Progressive background preload for all remaining items, boats, and fish catalog
  const backgroundUrls: string[] = [
    ...RODS.slice(6).map((r) => getRodSpriteUrl(r.id)),
    ...REELS.slice(6).map((r) => getReelSpriteUrl(r.id)),
    ...LURES.slice(8).map((l) => getLureSpriteUrl(l.id)),
    ...BOATS_CATALOG.slice(4).map((b) => getBoatSpriteUrl(b.id)),
    ...FISH_COLLECTION.map((f) => getFishSpriteUrl(f)),
  ];

  let index = 0;
  const batchSize = 6;
  const loadNextBatch = () => {
    const slice = backgroundUrls.slice(index, index + batchSize);
    for (const url of slice) {
      preloadSingleImage(url);
    }
    index += batchSize;
    if (index < backgroundUrls.length) {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(loadNextBatch, { timeout: 500 });
      } else {
        setTimeout(loadNextBatch, 80);
      }
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(loadNextBatch, { timeout: 300 });
  } else {
    setTimeout(loadNextBatch, 60);
  }
}

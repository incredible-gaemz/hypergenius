import React from 'react';
import {
  FISHING_AREAS,
  FishingAreaDef,
  FISH_COLLECTION,
  CatalogEntry,
  getRarityTextStyle,
  getRarityBadgeStyle,
  getAreaBannerUrl,
} from '../game/fishingLogic';

interface AreasTabProps {
  money: number;
  unlockedAreaIds: string[];
  selectedAreaId: string;
  catalogMap: Record<number, CatalogEntry>;
  onUnlockArea: (area: FishingAreaDef) => void;
  onSelectArea: (areaId: string) => void;
}

export const AreasTab: React.FC<AreasTabProps> = ({
  money,
  unlockedAreaIds,
  selectedAreaId,
  catalogMap,
  onUnlockArea,
  onSelectArea,
}) => {
  const totalCaughtSpecies = Object.keys(catalogMap).filter(
    (id) => catalogMap[Number(id)]?.caughtCount > 0
  ).length;

  return (
    <div className="border border-[#2a2d34] bg-[#181a1f] p-4 text-[#e3e6eb] space-y-3">
      <div className="flex items-center justify-between border-b border-[#292d36] pb-2 text-xs">
        <span className="font-bold text-[#f1f3f5]">Fishing Areas</span>
        <span className="text-[#8c94a2]">
          Unlocked: {unlockedAreaIds.length} / {FISHING_AREAS.length}
        </span>
      </div>

      <div className="space-y-3">
        {FISHING_AREAS.map((area) => {
          const isUnlocked = unlockedAreaIds.includes(area.id);
          const isSelected = selectedAreaId === area.id;
          const areaFish = FISH_COLLECTION.filter((f) => f.areaId === area.id);

          // STRICT REQUIREMENT: Only fish that have actually been caught are revealed!
          const caughtInThisArea = areaFish.filter(
            (f) => catalogMap[f.id]?.caughtCount > 0
          );

          const canUnlockWithMoney = money >= area.unlockCost;
          const meetsSpeciesReq = totalCaughtSpecies >= area.requiredSpecies;
          const canUnlock = canUnlockWithMoney && meetsSpeciesReq;

          return (
            <div
              key={area.id}
              className={`p-3.5 border transition-all ${
                isSelected
                  ? `${area.theme.accentBgClass} border-current`
                  : isUnlocked
                  ? 'border-[#292d36] bg-[#1a1d22]'
                  : 'border-[#22252c] bg-[#14161a] opacity-85'
              }`}
            >
              {/* Long Panoramic Area Thumbnail Banner */}
              {isUnlocked ? (
                <div className="relative w-full h-24 sm:h-28 mb-3 border border-[#2c313a] bg-[#111317] overflow-hidden">
                  <img
                    src={getAreaBannerUrl(area.id)}
                    alt={area.name}
                    className="w-full h-full object-cover select-none"
                    style={{
                      imageRendering: 'pixelated',
                      objectPosition: area.bannerPosition || 'center center',
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="relative w-full h-24 sm:h-28 mb-3 border border-[#22252c] bg-[#0c0d10] overflow-hidden flex items-center justify-center select-none">
                  {/* Veiled Silhouette */}
                  <img
                    src={getAreaBannerUrl(area.id)}
                    alt="Locked Area Silhouette"
                    className="w-full h-full object-cover filter brightness-[0.05] contrast-150 blur-[2px] opacity-30 select-none pointer-events-none"
                    style={{
                      imageRendering: 'pixelated',
                      objectPosition: area.bannerPosition || 'center center',
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  {/* Mystery Lock Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a0d] via-[#090a0d]/80 to-transparent flex flex-col items-center justify-center p-3 text-center">
                    <div className="w-7 h-7 rounded-full border border-[#3b404d] bg-[#14161d] flex items-center justify-center mb-1 text-[#8c94a2]">
                      <svg className="w-3.5 h-3.5 text-[#8c94a2]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-xs font-bold text-[#b4bac6] uppercase tracking-wider">
                      Uncharted Waters
                    </div>
                    <div className="text-[10px] text-[#6d7482] mt-0.5 font-semibold">
                      Hidden until unlocked ({!meetsSpeciesReq ? `Catch ${area.requiredSpecies} Species` : `$${area.unlockCost.toLocaleString()}`})
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#f1f3f5]">
                      {area.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 border border-emerald-500/80 bg-emerald-950/40 text-emerald-300">
                        Active Area
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8c94a2] mt-1">
                    {area.description}
                  </div>
                  <div className="text-[11px] text-[#717885] mt-1">
                    Discovered here: {caughtInThisArea.length} / {areaFish.length} species
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isSelected ? (
                    <span className="px-3 py-1.5 text-xs font-bold border border-emerald-600/80 bg-emerald-950/40 text-emerald-300">
                      Current
                    </span>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => onSelectArea(area.id)}
                      className="px-3 py-1.5 border border-[#3b404c] bg-[#22252c] hover:bg-[#2b2f38] text-xs font-bold text-[#f1f3f5] cursor-pointer"
                    >
                      Travel Here
                    </button>
                  ) : (
                    <button
                      onClick={() => onUnlockArea(area)}
                      disabled={!canUnlock}
                      className={`px-3 py-1.5 border text-xs font-bold ${
                        canUnlock
                          ? 'border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer'
                          : 'border-[#282a32] bg-[#1a1c20] text-[#555a64] cursor-not-allowed'
                      }`}
                    >
                      {!meetsSpeciesReq
                        ? `Need ${area.requiredSpecies} Species · ${totalCaughtSpecies}/${area.requiredSpecies}`
                        : `Unlock · $${area.unlockCost.toLocaleString()}`}
                    </button>
                  )}
                </div>
              </div>

              {/* Only show badges for fish the player has actually caught in this area */}
              <div className="mt-3 pt-2 border-t border-[#24272e]">
                {caughtInThisArea.length === 0 ? (
                  <div className="text-[11px] text-[#606775] italic">
                    No species recorded in these waters yet.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {caughtInThisArea.map((f) => (
                      <span
                        key={f.id}
                        className={`text-[10px] px-2 py-0.5 border ${getRarityBadgeStyle(f.tier)} ${getRarityTextStyle(f.tier)}`}
                      >
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

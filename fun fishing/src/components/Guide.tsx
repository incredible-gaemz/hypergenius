import React, { useState, useMemo, useEffect } from 'react';
import {
  FISH_COLLECTION,
  FISHING_AREAS,
  LURES,
  WEATHER_TYPES,
  WeatherDef,
  CatalogEntry,
  FishSpecies,
  CaughtFish,
  getFishPreferredWeather,
  getRarityTextStyle,
  getRarityBadgeStyle,
  getFishSpriteUrl,
  getLureSpriteUrl,
  getMutationFilterStyle,
} from '../game/fishingLogic';
import { FISH_GUIDE_DATA, FishGuideDetails } from '../game/fishGuideData';
import { HatcheryTank, HatcheryMutation } from '../game/hatcheryLogic';

interface GuideProps {
  catalogMap: Record<number, CatalogEntry>;
  currentWeather?: WeatherDef;
  inventory?: CaughtFish[];
  hatcheryTanks?: HatcheryTank[];
}

type GuideFilterStatus = 'all' | 'unlocked' | 'locked';

const ALL_MUTATIONS: Array<{
  id: HatcheryMutation;
  name: string;
  description: string;
  valueMultiplier: number;
  badgeStyle: string;
}> = [
  {
    id: 'piebald',
    name: 'Piebald Calico',
    description: 'Striking marbled calico pattern with patchy high-contrast markings.',
    valueMultiplier: 1.9,
    badgeStyle: 'border-orange-600/70 bg-orange-950/60 text-orange-300 font-bold',
  },
  {
    id: 'albino',
    name: 'Ghost Albino',
    description: 'Pure translucent white pigmentation with distinctive ruby red eyes.',
    valueMultiplier: 2.0,
    badgeStyle: 'border-slate-300/80 bg-slate-100/10 text-slate-100 font-bold',
  },
  {
    id: 'melanistic',
    name: 'Midnight Melanistic',
    description: 'Dense obsidian hyper-pigmentation giving scales a deep shadowy cast.',
    valueMultiplier: 2.2,
    badgeStyle: 'border-purple-600/70 bg-purple-950/60 text-purple-300 font-bold',
  },
  {
    id: 'bioluminescent',
    name: 'Bioluminescent Neon',
    description: 'Soft glowing cyan luminescence that shines even in murky abyssal depths.',
    valueMultiplier: 2.8,
    badgeStyle: 'border-cyan-500/80 bg-cyan-950/70 text-cyan-300 font-bold',
  },
  {
    id: 'golden',
    name: 'Gilded Golden Strain',
    description: 'Radiant metallic golden iridescence, exceptionally prized by master collectors.',
    valueMultiplier: 3.5,
    badgeStyle: 'border-amber-400/80 bg-amber-950/70 text-amber-200 font-bold',
  },
];

export const Guide: React.FC<GuideProps> = ({
  catalogMap,
  currentWeather,
  inventory,
  hatcheryTanks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<GuideFilterStatus>('all');
  const [inspectedFish, setInspectedFish] = useState<FishSpecies | null>(null);
  const [inspectedTab, setInspectedTab] = useState<'profile' | 'mutations'>('profile');
  const [previewMutation, setPreviewMutation] = useState<HatcheryMutation | null>(null);

  const totalSpecies = FISH_COLLECTION.length;

  // Unlocked count: Species caught 1 or more times
  const unlockedCount = useMemo(() => {
    return FISH_COLLECTION.filter((f) => (catalogMap[f.id]?.caughtCount || 0) >= 1).length;
  }, [catalogMap]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedFish(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered fish list
  const filteredFish = useMemo(() => {
    return FISH_COLLECTION.filter((fish) => {
      // Area filter
      if (selectedArea !== 'all' && fish.areaId !== selectedArea) {
        return false;
      }
      // Tier filter
      if (selectedTier !== 'all' && fish.tier !== selectedTier) {
        return false;
      }
      // Status filter
      const isUnlocked = (catalogMap[fish.id]?.caughtCount || 0) > 0;
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;
      // Search query (only matches unlocked fish names or areas)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        if (isUnlocked) {
          const matchName = fish.name.toLowerCase().includes(q);
          const matchArea = FISHING_AREAS.find((a) => a.id === fish.areaId)
            ?.name.toLowerCase()
            .includes(q);
          if (!matchName && !matchArea) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedArea, selectedTier, statusFilter, catalogMap]);

  const activeGuideDetails: FishGuideDetails | null = useMemo(() => {
    if (!inspectedFish) return null;
    return FISH_GUIDE_DATA[inspectedFish.id] || null;
  }, [inspectedFish]);

  const inspectedArea = useMemo(() => {
    if (!inspectedFish) return null;
    return FISHING_AREAS.find((a) => a.id === inspectedFish.areaId);
  }, [inspectedFish]);

  const inspectedWeatherList = useMemo(() => {
    if (!inspectedFish) return [];
    return getFishPreferredWeather(inspectedFish.name, inspectedFish.areaId);
  }, [inspectedFish]);

  const inspectedLure = useMemo(() => {
    if (!inspectedFish) return null;
    return LURES.find((l) => l.id === inspectedFish.bestLureId);
  }, [inspectedFish]);

  const inspectedEntry: CatalogEntry | undefined = useMemo(() => {
    if (!inspectedFish) return undefined;
    return catalogMap[inspectedFish.id];
  }, [inspectedFish, catalogMap]);

  // All unlocked mutations for the inspected fish
  const unlockedMutationsForInspected = useMemo(() => {
    if (!inspectedFish) return new Set<string>();
    const entry = catalogMap[inspectedFish.id];
    const set = new Set<string>(entry?.unlockedMutations || []);
    if ((entry?.caughtCount || 0) > 0) {
      set.add('normal');
    }
    if (inventory) {
      for (const item of inventory) {
        if (item.fishId === inspectedFish.id && item.mutation) {
          set.add(item.mutation);
        }
      }
    }
    if (hatcheryTanks) {
      for (const tank of hatcheryTanks) {
        if (
          tank.speciesId === inspectedFish.id &&
          tank.mutationStrain &&
          tank.mutationStrain !== 'normal'
        ) {
          set.add(tank.mutationStrain);
        }
      }
    }
    return set;
  }, [inspectedFish, catalogMap, inventory, hatcheryTanks]);

  const unlockedMutationsCount = useMemo(() => {
    return Array.from(unlockedMutationsForInspected).filter((m) => m !== 'normal').length;
  }, [unlockedMutationsForInspected]);

  const handleOpenFishModal = (fish: FishSpecies) => {
    setInspectedFish(fish);
    setInspectedTab('profile');
    setPreviewMutation(null);
  };

  return (
    <div className="space-y-4 select-none">
      {/* Header Summary */}
      <div className="border border-[#2d323e] bg-[#14161c] p-3.5 sm:p-4 text-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#f1f3f5] tracking-wide uppercase pixel-title">
              Angler&apos;s Field Guide
            </h2>
            <div className="text-[11px] text-[#8c94a2] mt-0.5">
              Comprehensive biological survey of North American and oceanic species.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 border border-emerald-600 bg-emerald-950/60 text-emerald-300 font-bold">
              {unlockedCount} / {totalSpecies} Species Discovered
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#1e222b] h-2.5 border border-[#2a2e39] overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${Math.round((unlockedCount / totalSpecies) * 100)}%` }}
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <input
            type="text"
            placeholder="Search discovered fish or waters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-[#2d323c] bg-[#181a22] px-2.5 py-1.5 text-[#f1f3f5] placeholder-[#555d6b] focus:outline-none focus:border-sky-500"
          />

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="border border-[#2d323c] bg-[#181a22] px-2.5 py-1.5 text-[#f1f3f5] focus:outline-none cursor-pointer"
          >
            <option value="all">All Waters ({totalSpecies})</option>
            {FISHING_AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="border border-[#2d323c] bg-[#181a22] px-2.5 py-1.5 text-[#f1f3f5] focus:outline-none cursor-pointer"
          >
            <option value="all">All Rarity Tiers</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as GuideFilterStatus)}
            className="border border-[#2d323c] bg-[#181a22] px-2.5 py-1.5 text-[#f1f3f5] focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="unlocked">Discovered Only</option>
            <option value="locked">Undiscovered Only</option>
          </select>
        </div>
      </div>

      {/* Species Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredFish.map((fish) => {
          const entry = catalogMap[fish.id];
          const isUnlocked = (entry?.caughtCount || 0) > 0;
          const count = entry?.caughtCount || 0;
          const preferredWeather = getFishPreferredWeather(fish.name, fish.areaId);
          const weatherMatch = currentWeather && preferredWeather.includes(currentWeather.id);

          if (isUnlocked) {
            return (
              <div
                key={fish.id}
                onClick={() => handleOpenFishModal(fish)}
                className="group border border-[#2d323c] hover:border-emerald-500 bg-[#15171d] hover:bg-[#1a1d24] p-3 text-xs flex items-center gap-3 cursor-pointer transition-colors shadow-xs"
              >
                {/* Visual Fish Sprite Preview */}
                <div className="w-16 h-14 shrink-0 bg-[#0c0e12] border border-[#232732] flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={getFishSpriteUrl(fish)}
                    alt={fish.name}
                    className="w-full h-full object-contain select-none group-hover:scale-105 transition-transform"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <span className={`font-bold text-sm truncate ${getRarityTextStyle(fish.tier)}`}>
                      {fish.name}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                      View
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 border uppercase tracking-wider font-semibold ${getRarityBadgeStyle(
                        fish.tier
                      )}`}
                    >
                      {fish.tier}
                    </span>
                    {entry?.hasTrophy && (
                      <span
                        className="text-[10px] px-1.5 py-0.2 border border-amber-500/80 bg-amber-950/60 text-amber-300 font-bold"
                        title="Trophy Record"
                      >
                        Trophy
                      </span>
                    )}
                    {weatherMatch && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 border border-amber-500/50 bg-amber-950/30 text-amber-300 font-semibold"
                        title="Preferred weather active"
                      >
                        Favored Weather
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#8c94a2] flex items-center justify-between pt-0.5">
                    <span>
                      Range:{' '}
                      <strong className="text-[#c0c5ce]">
                        {fish.minWeight} - {fish.maxWeight} lbs
                      </strong>
                    </span>
                    <span>
                      Caught: <strong className="text-emerald-400">x{count}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Undiscovered
          return (
            <div
              key={fish.id}
              className="p-3 border border-[#21242b] bg-[#131518] text-[#555d6b] flex items-center gap-3 text-xs opacity-75"
            >
              {/* Undiscovered Fish Silhouette */}
              <div className="w-16 h-14 shrink-0 bg-[#0a0b0e] border border-[#1a1c22] flex items-center justify-center p-1 overflow-hidden">
                <img
                  src={getFishSpriteUrl(fish)}
                  alt="Undiscovered Fish"
                  className="w-full h-full object-contain select-none opacity-20 brightness-0"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="font-bold tracking-widest text-[#555e70]">???</div>
                <div className="text-[10px] uppercase text-[#424855]">Undiscovered Species</div>
                <div className="text-[10px] text-[#3b414e]">
                  Native to {FISHING_AREAS.find((a) => a.id === fish.areaId)?.name || 'Unknown Waters'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Field Guide Detail Inspector Modal */}
      {inspectedFish && activeGuideDetails && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => setInspectedFish(null)}
        >
          <div
            className="w-full max-w-lg border-2 border-[#3e4452] bg-[#171920] p-5 sm:p-6 text-xs text-[#e3e6eb] space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Modal Header */}
            <div className="border-b border-[#292d36] pb-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-lg font-bold ${getRarityTextStyle(inspectedFish.tier)}`}>
                    {inspectedFish.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 border uppercase tracking-wider font-semibold ${getRarityBadgeStyle(
                      inspectedFish.tier
                    )}`}
                  >
                    {inspectedFish.tier}
                  </span>
                  {inspectedEntry?.hasTrophy && (
                    <span
                      className="text-[11px] px-1.5 py-0.5 border border-amber-500/80 bg-amber-950/60 text-amber-300 font-bold"
                      title="Trophy Record"
                    >
                      Trophy
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#8c94a2] italic mt-0.5 font-serif">
                  {activeGuideDetails.scientificName}
                </div>
              </div>

              <button
                onClick={() => setInspectedFish(null)}
                className="text-xs text-[#8c94a2] hover:text-[#f1f3f5] border border-[#2d313b] hover:border-[#4a505e] px-2.5 py-1 bg-[#1c1f26] cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-[#292d36] gap-2 pt-0.5 text-xs">
              <button
                onClick={() => setInspectedTab('profile')}
                className={`py-1.5 px-3 font-bold border-b-2 transition-colors cursor-pointer ${
                  inspectedTab === 'profile'
                    ? 'border-sky-400 text-sky-300'
                    : 'border-transparent text-[#7e8796] hover:text-[#c0c5ce]'
                }`}
              >
                Species Profile
              </button>
              <button
                onClick={() => setInspectedTab('mutations')}
                className={`py-1.5 px-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  inspectedTab === 'mutations'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-[#7e8796] hover:text-[#c0c5ce]'
                }`}
              >
                <span>Mutations</span>
                <span className="text-[10px] px-1.5 py-0.2 border border-[#3b404d] bg-[#1a1c22] text-[#f1f3f5]">
                  {unlockedMutationsCount}/5
                </span>
              </button>
            </div>

            {/* Tab 1: Species Profile */}
            {inspectedTab === 'profile' && (
              <div className="space-y-4">
                {/* Pixel Art Sprite Preview */}
                {getFishSpriteUrl(inspectedFish) && (
                  <div className="py-3 px-4 border border-[#282b34] bg-[#121418] flex items-center justify-center">
                    <img
                      src={getFishSpriteUrl(inspectedFish)!}
                      alt={inspectedFish.name}
                      className="h-28 w-auto max-w-full object-contain select-none"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                )}

                {/* Weights & Biometrics */}
                <div className="grid grid-cols-3 gap-2 p-3 border border-[#282b34] bg-[#121418] text-center">
                  <div>
                    <div className="text-[10px] uppercase text-[#717885] font-semibold">
                      Typical Weight
                    </div>
                    <div className="text-xs font-bold text-[#f1f3f5] mt-0.5">
                      {inspectedFish.minWeight} - {inspectedFish.maxWeight} lbs
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#717885] font-semibold">
                      Trophy Threshold
                    </div>
                    <div className="text-xs font-bold text-amber-300 mt-0.5">
                      Trophy: {inspectedFish.trophyWeight} lbs
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#717885] font-semibold">
                      Market Base
                    </div>
                    <div className="text-xs font-bold text-emerald-400 mt-0.5">
                      ${inspectedFish.basePrice}
                    </div>
                  </div>
                </div>

                {/* Preferred Weather Section */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9aa2b0]">
                    Preferred Weather Conditions
                  </div>
                  <div className="bg-[#13151a] p-3 border border-[#242730] flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {inspectedWeatherList.map((wId) => {
                        const wDef = WEATHER_TYPES.find((w) => w.id === wId);
                        const isCurrent = currentWeather?.id === wId;
                        return (
                          <span
                            key={wId}
                            className={`text-xs px-2.5 py-1 border flex items-center gap-1.5 font-semibold ${
                              isCurrent
                                ? 'border-amber-500/80 bg-amber-950/60 text-amber-300'
                                : 'border-[#2d313a] bg-[#1a1d23] text-[#c0c5ce]'
                            }`}
                          >
                            <span>{wDef?.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] text-amber-400 ml-1 font-bold">
                                Active Now
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-[11px] text-[#8c94a2]">
                      +100% encounter boost in favored weather
                    </span>
                  </div>
                </div>

                {/* Visual Description */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9aa2b0]">
                    Visual Identification
                  </div>
                  <p className="text-[#c0c5ce] leading-relaxed bg-[#13151a] p-3 border border-[#242730]">
                    {activeGuideDetails.visualDescription}
                  </p>
                </div>

                {/* Habitat Waters & Depth Behavior */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9aa2b0]">
                    Habitat &amp; Behavior
                  </div>
                  <div className="bg-[#13151a] p-3 border border-[#242730] space-y-1.5">
                    <div>
                      <span className="text-[#717885]">Waters: </span>
                      <span className="font-semibold text-[#f1f3f5]">{inspectedArea?.name}</span>
                      <span className="text-[#8c94a2] block text-[11px] mt-0.5">
                        {inspectedArea?.description}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-[#1e2128]">
                      <span className="text-[#717885]">Water Column: </span>
                      <span className="text-[#c0c5ce]">{activeGuideDetails.habitatBehavior}</span>
                    </div>
                  </div>
                </div>

                {/* Diet & Recommended Tackle */}
                <div className="space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9aa2b0]">
                    Diet &amp; Recommended Bait
                  </div>
                  <div className="bg-[#13151a] p-3 border border-[#242730] space-y-1.5">
                    <div>
                      <span className="text-[#717885]">Natural Diet: </span>
                      <span className="text-[#c0c5ce]">{activeGuideDetails.dietNotes}</span>
                    </div>
                    {inspectedLure && (
                      <div className="pt-1 border-t border-[#1e2128] flex items-center justify-between">
                        <span className="text-[#717885]">Recommended Lure/Bait:</span>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <img
                            src={getLureSpriteUrl(inspectedLure.id)}
                            alt={inspectedLure.name}
                            className="w-6 h-6 object-contain select-none"
                            style={{ imageRendering: 'pixelated' }}
                          />
                          <span>{inspectedLure.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Angler Field Record */}
                <div className="p-3 border border-[#282b34] bg-[#14161c] flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#717885] uppercase font-semibold">
                      Personal Record
                    </span>
                    <div className="font-bold text-sm text-[#f1f3f5]">
                      {inspectedEntry?.maxWeight ? `${inspectedEntry.maxWeight} lbs` : '—'}
                    </div>
                  </div>

                  <div className="space-y-0.5 text-center">
                    <span className="text-[10px] text-[#717885] uppercase font-semibold">
                      Total Landed
                    </span>
                    <div className="font-bold text-sm text-emerald-400">
                      x{inspectedEntry?.caughtCount || 0}
                    </div>
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-[#717885] uppercase font-semibold">
                      Trophy Status
                    </span>
                    <div className="font-bold text-sm text-amber-300">
                      {inspectedEntry?.hasTrophy ? 'Trophy Achieved' : 'Not yet'}
                    </div>
                  </div>
                </div>

                {/* Wikipedia Article External Link */}
                <div className="pt-1 flex items-center justify-between border-t border-[#292d36]">
                  <span className="text-[11px] text-[#717885]">Biological Reference:</span>
                  <a
                    href={activeGuideDetails.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1.5 px-3 border border-[#3b404d] bg-[#1a1d24] hover:bg-[#252934] hover:border-[#525a6b] text-sky-400 hover:text-sky-300 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Read Wikipedia Article</span>
                    <span className="text-[10px]">&gt;</span>
                  </a>
                </div>
              </div>
            )}

            {/* Tab 2: Genetic Mutations */}
            {inspectedTab === 'mutations' && (
              <div className="space-y-4">
                {/* Quick-Switch Morph Selector Pills */}
                <div className="flex items-center gap-1.5 flex-wrap pb-1">
                  <button
                    onClick={() => setPreviewMutation(null)}
                    className={`px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
                      previewMutation === null
                        ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300'
                        : 'border-[#2d323e] bg-[#14161c] text-[#8c94a2] hover:text-[#f1f3f5]'
                    }`}
                  >
                    Wild Standard
                  </button>
                  {ALL_MUTATIONS.map((m) => {
                    const isUnlocked = unlockedMutationsForInspected.has(m.id);
                    const isSelected = previewMutation === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPreviewMutation(m.id)}
                        className={`px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? m.id === 'golden'
                              ? 'border-amber-400 bg-amber-950/70 text-amber-200'
                              : m.id === 'bioluminescent'
                              ? 'border-cyan-400 bg-cyan-950/70 text-cyan-200'
                              : m.id === 'albino'
                              ? 'border-slate-200 bg-slate-900/80 text-white'
                              : m.id === 'melanistic'
                              ? 'border-purple-400 bg-purple-950/70 text-purple-200'
                              : 'border-orange-400 bg-orange-950/70 text-orange-200'
                            : isUnlocked
                            ? 'border-[#2d323e] bg-[#14161c] text-[#c0c5ce] hover:text-white'
                            : 'border-[#20232a] bg-[#111216] text-[#555d6b]'
                        }`}
                      >
                        <span>{m.name.split(' ')[0]}</span>
                        {!isUnlocked && <span className="text-[9px] text-[#717885]">(Locked)</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Featured Morph Exhibition Stage */}
                {(() => {
                  const activeDetail = previewMutation
                    ? ALL_MUTATIONS.find((m) => m.id === previewMutation)
                    : null;
                  const isStageUnlocked = previewMutation ? unlockedMutationsForInspected.has(previewMutation) : true;
                  
                  let stageBg = 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.16) 0%, rgba(18, 20, 24, 0.98) 75%)';
                  let stageBorder = 'border-[#384050]';
                  let stageGlow = 'shadow-none';
                  let stageTitle = 'Wild Standard Morphology';
                  let stagePhenotype = 'Standard wild pigmentation & morphology';

                  if (previewMutation === 'golden') {
                    stageBg = 'radial-gradient(ellipse at center, rgba(234, 179, 8, 0.28) 0%, rgba(20, 20, 26, 0.98) 75%)';
                    stageBorder = 'border-amber-400';
                    stageGlow = 'shadow-[0_0_20px_rgba(234,179,8,0.25)]';
                    stageTitle = 'Gilded Golden Strain';
                    stagePhenotype = 'Phenotype: Xanthic Hyper-Pigmentation · Metallic Gold Sheen';
                  } else if (previewMutation === 'bioluminescent') {
                    stageBg = 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.32) 0%, rgba(10, 16, 28, 0.98) 75%)';
                    stageBorder = 'border-cyan-400';
                    stageGlow = 'shadow-[0_0_20px_rgba(6,182,212,0.3)]';
                    stageTitle = 'Bioluminescent Neon';
                    stagePhenotype = 'Phenotype: Photophore Luciferase Synthesis · Glowing Cyan Aura';
                  } else if (previewMutation === 'albino') {
                    stageBg = 'radial-gradient(ellipse at center, rgba(244, 114, 182, 0.22) 0%, rgba(22, 22, 28, 0.98) 75%)';
                    stageBorder = 'border-slate-300';
                    stageGlow = 'shadow-[0_0_20px_rgba(255,255,255,0.2)]';
                    stageTitle = 'Ghost Albino';
                    stagePhenotype = 'Phenotype: Tyrosinase-Negative Leucism · Translucent Pearl Scales';
                  } else if (previewMutation === 'melanistic') {
                    stageBg = 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.28) 0%, rgba(12, 12, 18, 0.98) 75%)';
                    stageBorder = 'border-purple-400';
                    stageGlow = 'shadow-[0_0_20px_rgba(168,85,247,0.25)]';
                    stageTitle = 'Midnight Melanistic';
                    stagePhenotype = 'Phenotype: Eumelanin Super-Saturation · Obsidian Velvet Cast';
                  } else if (previewMutation === 'piebald') {
                    stageBg = 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.28) 0%, rgba(24, 18, 22, 0.98) 75%)';
                    stageBorder = 'border-orange-400';
                    stageGlow = 'shadow-[0_0_20px_rgba(249,115,22,0.25)]';
                    stageTitle = 'Piebald Calico';
                    stagePhenotype = 'Phenotype: Variegated Melanophore Chimerism · Patchy Calico Marks';
                  }

                  return (
                    <div
                      className={`border-2 ${stageBorder} ${stageGlow} p-4 text-center space-y-2 transition-all relative overflow-hidden`}
                      style={{ background: stageBg }}
                    >
                      <div className="flex items-center justify-between text-xs border-b border-[#2d323e]/60 pb-2">
                        <span className="font-bold tracking-wide text-[#f1f3f5]">{stageTitle}</span>
                        {previewMutation ? (
                          isStageUnlocked ? (
                            <span className="text-[10px] px-2 py-0.5 border border-emerald-500/80 bg-emerald-950/70 text-emerald-300 font-bold uppercase">
                              Discovered Specimen
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 border border-[#3b404d] bg-[#1a1c22] text-[#788294] font-semibold uppercase">
                              Preview / Undiscovered
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 border border-[#3b404d] bg-[#14161c] text-[#8c94a2] font-semibold">
                            Natural Wild
                          </span>
                        )}
                      </div>

                      <div className="py-3 flex items-center justify-center min-h-[120px]">
                        <img
                          src={getFishSpriteUrl(inspectedFish)!}
                          alt={inspectedFish.name}
                          className={`h-28 w-auto max-w-full object-contain select-none transition-all ${
                            !isStageUnlocked && previewMutation ? 'opacity-40 grayscale contrast-125' : ''
                          }`}
                          style={{
                            ...(isStageUnlocked || !previewMutation ? getMutationFilterStyle(previewMutation) : {}),
                            imageRendering: 'pixelated',
                          }}
                        />
                      </div>

                      <div className="text-[11px] text-[#c0c5ce] italic">
                        {stagePhenotype}
                      </div>

                      {activeDetail && (
                        <div className="flex items-center justify-center gap-3 pt-1 text-xs">
                          <span className="font-bold text-emerald-400">
                            +{Math.round((activeDetail.valueMultiplier - 1) * 100)}% Market Payout
                          </span>
                          <span className="text-[#656e7e]">·</span>
                          <span className="font-bold text-amber-300">
                            ${Math.round(inspectedFish.basePrice * activeDetail.valueMultiplier)} Base
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Unlocked Mutations Summary Banner */}
                <div className="flex items-center justify-between p-2.5 border border-[#2b303c] bg-[#15171d] text-xs">
                  <div>
                    <span className="text-[#8c94a2]">Discovered Strains: </span>
                    <strong className="text-amber-300">{unlockedMutationsCount} / 5</strong>
                  </div>
                  <span className="text-[10px] text-[#717885]">
                    Unlock via Hatchery breeding or ultra-rare wild strikes
                  </span>
                </div>

                {/* Mutations List */}
                <div className="space-y-2.5">
                  {ALL_MUTATIONS.map((m) => {
                    const isUnlocked = unlockedMutationsForInspected.has(m.id);
                    const isSelected = previewMutation === m.id;

                    if (isUnlocked) {
                      return (
                        <div
                          key={m.id}
                          onClick={() => setPreviewMutation(m.id)}
                          className={`p-3 border transition-colors cursor-pointer space-y-2 ${
                            isSelected
                              ? 'border-amber-400 bg-[#1c1e28]'
                              : 'border-[#2d323e] hover:border-amber-500/80 bg-[#14161c]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Rendered mutant sprite */}
                            <div className="w-16 h-14 shrink-0 flex items-center justify-center bg-[#0c0e12] border border-[#22252e] p-1">
                              <img
                                src={getFishSpriteUrl(inspectedFish)!}
                                alt={m.name}
                                className="w-full h-full object-contain select-none"
                                style={{
                                  ...getMutationFilterStyle(m.id),
                                  imageRendering: 'pixelated',
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="font-bold text-sm text-[#f1f3f5]">{m.name}</span>
                                <span className="text-[10px] px-2 py-0.5 border border-emerald-500/80 bg-emerald-950/60 text-emerald-300 font-bold uppercase">
                                  Unlocked
                                </span>
                              </div>
                              <p className="text-[11px] text-[#a0aec0] leading-snug">
                                {m.description}
                              </p>
                              <div className="flex items-center gap-2 pt-1 text-[10px]">
                                <span className="text-emerald-400 font-semibold">
                                  +{Math.round((m.valueMultiplier - 1) * 100)}% Market Value
                                </span>
                                <span className="text-[#555e6c]">·</span>
                                <span className="text-amber-300 font-semibold">
                                  ${Math.round(inspectedFish.basePrice * m.valueMultiplier)} Base
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Locked mutation
                    return (
                      <div
                        key={m.id}
                        className="p-3 border border-[#20232b] bg-[#111317]/80 opacity-75 space-y-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-14 shrink-0 flex items-center justify-center bg-[#0a0b0e] border border-[#1a1d24] p-1">
                            <img
                              src={getFishSpriteUrl(inspectedFish)!}
                              alt="Locked Morph"
                              className="w-full h-full object-contain select-none opacity-20 brightness-0"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-bold text-sm text-[#788294]">{m.name}</span>
                              <span className="text-[10px] px-2 py-0.5 border border-[#3b404d] bg-[#1a1c22] text-[#717885] font-semibold uppercase">
                                Locked
                              </span>
                            </div>
                            <p className="text-[11px] text-[#636c7c] italic leading-snug">
                              Undiscovered genetic morph. Breed in Hatchery tanks using specialized
                              feed, or hook as an ultra-rare strike in favored waters.
                            </p>
                            <div className="text-[10px] text-[#555e6c] pt-0.5">
                              Bounty Potential: +{Math.round((m.valueMultiplier - 1) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

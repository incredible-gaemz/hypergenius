/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HatcheryTank,
  HatcheryUpgradeId,
  FeedType,
  TankId,
  FEED_OPTIONS,
  HATCHERY_UPGRADES,
  MUTATION_DETAILS,
  calculateBreedingDuration,
  calculateClutchYield,
  calculateBatchValue,
  calculateBaitYield,
  getHatcheryTankMaxCapacity,
  getHatcheryBaitMaxCapacity,
} from '../game/hatcheryLogic';
import { CaughtFish, FISH_COLLECTION, getRarityTextStyle, getRarityBadgeStyle } from '../game/fishingLogic';

interface HatcheryTabProps {
  money: number;
  inventory: CaughtFish[];
  hatcheryTanks: HatcheryTank[];
  hatcheryUpgrades: HatcheryUpgradeId[];
  liveBaitCharges: number;
  onUnlockTank: (tankId: TankId) => void;
  onBuyUpgrade: (upgradeId: HatcheryUpgradeId) => void;
  onStartBreeding: (
    tankId: TankId,
    speciesId: number,
    feedType: FeedType,
    pairCount: number,
    parentMutation?: HatcheryMutation | 'normal'
  ) => void;
  onFeedTank: (tankId: TankId) => void;
  onSellBatch: (tankId: TankId) => void;
  onHarvestBait: (tankId: TankId) => void;
  onTransferToBox: (tankId: TankId) => void;
  onPartialHarvest: (tankId: TankId, action: 'sell' | 'box' | 'bait', harvestCount: number) => void;
  onClearTank: (tankId: TankId) => void;
  hatcheryUnlocked?: boolean;
  onUnlockHatchery?: () => void;
}

export const HatcheryTab: React.FC<HatcheryTabProps> = ({
  money,
  inventory,
  hatcheryTanks,
  hatcheryUpgrades,
  liveBaitCharges,
  onUnlockTank,
  onBuyUpgrade,
  onStartBreeding,
  onFeedTank,
  onSellBatch,
  onHarvestBait,
  onTransferToBox,
  onPartialHarvest,
  onClearTank,
  hatcheryUnlocked = true,
  onUnlockHatchery,
}) => {
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [selectedSpeciesByTank, setSelectedSpeciesByTank] = useState<Record<string, number | null>>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_hatchery_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.selectedSpeciesByTank === 'object') return parsed.selectedSpeciesByTank;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [selectedFeedByTank, setSelectedFeedByTank] = useState<Record<string, FeedType>>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_hatchery_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.selectedFeedByTank === 'object') return parsed.selectedFeedByTank;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [selectedPairsByTank, setSelectedPairsByTank] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_hatchery_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.selectedPairsByTank === 'object') return parsed.selectedPairsByTank;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [selectedMutationByTank, setSelectedMutationByTank] = useState<Record<string, HatcheryMutation | 'normal'>>({});

  // Track if user wants to keep a breeding pair (save 2 fish) when harvesting
  const [keepBreedersByTank, setKeepBreedersByTank] = useState<Record<string, boolean>>({});
  // Track custom harvest mode per tank
  const [showCustomTakeByTank, setShowCustomTakeByTank] = useState<Record<string, boolean>>({});
  const [customTakeCountByTank, setCustomTakeCountByTank] = useState<Record<string, number>>({});

  const clearTankCustomMode = (tankId: string) => {
    setShowCustomTakeByTank((prev) => {
      const copy = { ...prev };
      delete copy[tankId];
      return copy;
    });
    setCustomTakeCountByTank((prev) => {
      const copy = { ...prev };
      delete copy[tankId];
      return copy;
    });
  };

  // Persist user tank selections
  useEffect(() => {
    try {
      localStorage.setItem(
        'cozy_reel_hatchery_settings_v1',
        JSON.stringify({
          selectedSpeciesByTank,
          selectedFeedByTank,
          selectedPairsByTank,
        })
      );
    } catch {
      // ignore
    }
  }, [selectedSpeciesByTank, selectedFeedByTank, selectedPairsByTank]);

  // Live timer tick for progress bar updates
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Compute fish species in Box
  const fishInBoxMap: Record<number, number> = {};
  inventory.forEach((f) => {
    fishInBoxMap[f.fishId] = (fishInBoxMap[f.fishId] || 0) + 1;
  });

  const availableSpeciesInBox = FISH_COLLECTION.filter((f) => (fishInBoxMap[f.id] || 0) > 0);
  const tankMaxCap = getHatcheryTankMaxCapacity(hatcheryUpgrades);
  const baitMaxCap = getHatcheryBaitMaxCapacity(hatcheryUpgrades);

  // Unlocked facility screen
  if (!hatcheryUnlocked) {
    return (
      <div className="border border-[#2a2d34] bg-[#181a1f] p-6 text-[#e3e6eb]">
        <div className="max-w-md mx-auto text-center border border-[#2d313c] bg-[#14161c] p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
              Dockside Aquaculture
            </span>
            <h2 className="text-base font-bold text-[#f1f3f5]">Unlock Hatchery Raceways</h2>
            <p className="text-xs text-[#8c94a2] leading-relaxed">
              Acquire water rights to build nursery tanks, hatch fingerlings, raise broodstock, and produce live bait.
            </p>
          </div>

          <div className="p-3 border border-[#232730] bg-[#101215] text-xs text-[#a3aab8] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#717885]">Facility Cost:</span>
              <span className="font-bold text-emerald-400">$500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717885]">Available Money:</span>
              <span className={`font-bold ${money >= 500 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ${money.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            disabled={money < 500}
            onClick={onUnlockHatchery}
            className={`w-full py-2.5 font-bold border text-xs transition-colors ${
              money >= 500
                ? 'border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 cursor-pointer'
                : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
            }`}
          >
            {money >= 500 ? 'Unlock Hatchery Facility · $500' : 'Need $500 to Unlock'}
          </button>
        </div>
      </div>
    );
  }

  const unlockedTanksCount = hatcheryTanks.filter((t) => t.unlocked).length;

  return (
    <div className="border border-[#2a2d34] bg-[#181a1f] p-4 text-[#e3e6eb] space-y-4">
      {/* Top Header */}
      <div className="border-b border-[#292d36] pb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#f1f3f5] text-sm">Fish Hatchery</span>
          <span className="text-[#717885] text-xs">
            {unlockedTanksCount} of {hatcheryTanks.length} tanks active
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="border border-sky-800/60 bg-sky-950/40 px-2.5 py-1 text-sky-300 font-semibold flex items-center gap-1.5">
            <span className="text-[#717885]">Live Bait:</span>
            <span className="font-bold text-sky-200">{liveBaitCharges} / {baitMaxCap}</span>
          </div>
        </div>
      </div>

      {/* Tanks Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hatcheryTanks.map((tank) => {
            // Locked Tank Card
            if (!tank.unlocked) {
              const canUnlock = money >= tank.unlockCost;
              return (
                <div
                  key={tank.id}
                  className="p-4 border border-dashed border-[#2b2f3a] bg-[#14161b] flex flex-col justify-between space-y-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-[#f1f3f5] text-sm">{tank.name}</div>
                    <p className="text-[#717885] text-[11px]">
                      Additional breeding tank for running concurrent batches.
                    </p>
                  </div>

                  <button
                    disabled={!canUnlock}
                    onClick={() => onUnlockTank(tank.id)}
                    className={`w-full py-2 font-bold border text-xs transition-colors ${
                      canUnlock
                        ? 'border-emerald-600/80 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 cursor-pointer'
                        : 'border-[#282a32] bg-[#141518] text-[#555a64] cursor-not-allowed'
                    }`}
                  >
                    Unlock {tank.name} · ${tank.unlockCost}
                  </button>
                </div>
              );
            }

            const validSpecies =
              (selectedSpeciesByTank[tank.id] != null
                ? availableSpeciesInBox.find(
                    (f) => f.id === selectedSpeciesByTank[tank.id] && (fishInBoxMap[f.id] || 0) >= 2
                  ) ||
                  availableSpeciesInBox.find(
                    (f) => f.id === selectedSpeciesByTank[tank.id]
                  )
                : null) ||
              availableSpeciesInBox.find((f) => (fishInBoxMap[f.id] || 0) >= 2) ||
              availableSpeciesInBox[0] ||
              null;

            const currentSpeciesId = validSpecies ? validSpecies.id : null;
            const currentSpecies = validSpecies;
            const currentFeedId = selectedFeedByTank[tank.id] || 'pellets';
            const currentFeed = FEED_OPTIONS.find((f) => f.id === currentFeedId) || FEED_OPTIONS[0];

            // ACTIVE TANK (Growing or Ready)
            if (tank.stage !== 'empty' && tank.speciesId) {
              const brood = FISH_COLLECTION.find((f) => f.id === tank.speciesId);
              const elapsedSec = (nowTick - tank.startedAt) / 1000;
              const remainingSec = Math.max(0, Math.ceil(tank.durationSec - elapsedSec));
              const progressPct = Math.min(100, (elapsedSec / tank.durationSec) * 100);
              const isMature = tank.stage === 'mature' || remainingSec === 0;

              const batchVal = brood
                ? calculateBatchValue(
                    brood,
                    tank.clutchCount,
                    tank.trophyCount,
                    hatcheryUpgrades,
                    tank.mutationStrain,
                    tank.mutationCount
                  )
                : 0;
              const baitUnits = brood
                ? calculateBaitYield(brood, tank.clutchCount, tank.mutationStrain)
                : tank.clutchCount;

              const mutationInfo = MUTATION_DETAILS[tank.mutationStrain] || MUTATION_DETAILS.normal;

              // Keep breeder setting: default to true if population > 2
              const shouldKeepBreeders = keepBreedersByTank[tank.id] !== undefined
                ? keepBreedersByTank[tank.id]
                : tank.clutchCount > 2;

              const showCustom = showCustomTakeByTank[tank.id] || false;
              const customTake = Math.min(
                tank.clutchCount,
                Math.max(1, customTakeCountByTank[tank.id] || (tank.clutchCount > 2 && shouldKeepBreeders ? tank.clutchCount - 2 : tank.clutchCount))
              );

              // Actual take count for standard one-click harvest
              const defaultTakeCount = shouldKeepBreeders && tank.clutchCount > 2
                ? tank.clutchCount - 2
                : tank.clutchCount;

              const activeTakeCount = showCustom ? customTake : defaultTakeCount;

              // Pro-rated values for take count
              const takeFraction = tank.clutchCount > 0 ? activeTakeCount / tank.clutchCount : 1;
              const takeValue = Math.round(batchVal * takeFraction);
              const takeBaitUnits = Math.round(baitUnits * takeFraction);

              return (
                <div
                  key={tank.id}
                  className={`p-3.5 border space-y-3 text-xs transition-colors ${
                    isMature
                      ? 'border-emerald-700/70 bg-[#131d17]'
                      : 'border-[#292d37] bg-[#14161d]'
                  }`}
                >
                  {/* Tank Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#232731] pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f1f3f5] text-sm">{tank.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 border font-semibold ${
                            isMature
                              ? 'border-emerald-500/80 bg-emerald-950/80 text-emerald-300'
                              : 'border-sky-700/80 bg-sky-950/80 text-sky-300'
                          }`}
                        >
                          {isMature ? 'Ready to Harvest' : tank.stage === 'fingerlings' ? 'Nursery' : 'Spawning'}
                        </span>
                      </div>

                      <div className="text-xs text-[#a0a8b7] mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${brood ? getRarityTextStyle(brood.tier) : ''}`}>
                          {tank.clutchCount}x {brood?.name || 'Fish'}
                        </span>
                        {brood && (
                          <span className={`text-[9px] px-1 py-0.2 border uppercase ${getRarityBadgeStyle(brood.tier)}`}>
                            {brood.tier}
                          </span>
                        )}
                        {tank.trophyCount > 0 && (
                          <span className="text-[10px] text-amber-300 font-bold">
                            · {tank.trophyCount} Trophy
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-xs">
                        ${batchVal.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#717885]">
                        or {baitUnits} bait
                      </div>
                    </div>
                  </div>

                  {/* Strain / Mutation Tag (if any) */}
                  {tank.mutationCount > 0 && (
                    <div className="flex items-center justify-between text-[11px] px-2 py-1 bg-[#101318] border border-[#252833]">
                      <span className="text-[#8c94a2]">Special Strain:</span>
                      <span className={`px-1.5 py-0.2 text-[10px] border uppercase font-bold ${mutationInfo.badgeStyle}`}>
                        {tank.mutationCount}x {mutationInfo.name}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar & Stage Timer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8c94a2]">
                        {isMature
                          ? 'Clutch mature and healthy'
                          : tank.stage === 'fingerlings'
                          ? 'Fingerlings growing'
                          : 'Spawning eggs'}
                      </span>
                      <span className="font-mono font-bold text-[#f1f3f5]">
                        {isMature ? 'Ready' : remainingSec >= 60 ? `${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s` : `${remainingSec}s`}
                      </span>
                    </div>

                    <div className="w-full bg-[#0d0f13] border border-[#242732] h-2">
                      <div
                        className={`h-full transition-all duration-300 ${isMature ? 'bg-emerald-400' : 'bg-sky-400'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* MATURE TANK HARVEST CONTROLS (Clean, decluttered 3-button layout) */}
                  {isMature ? (
                    <div className="space-y-2.5 pt-1 border-t border-[#232731]">
                      {/* Resident Breeders Checkbox */}
                      {tank.clutchCount > 2 && !showCustom && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c0c6d2] select-none">
                          <input
                            type="checkbox"
                            checked={shouldKeepBreeders}
                            onChange={(e) =>
                              setKeepBreedersByTank((prev) => ({
                                ...prev,
                                [tank.id]: e.target.checked,
                              }))
                            }
                            className="accent-emerald-500 cursor-pointer w-3.5 h-3.5"
                          />
                          <span>Keep 2 breeders in tank</span>
                        </label>
                      )}

                      {/* Custom Harvest Toggle & Controls */}
                      {showCustom && (
                        <div className="p-2 border border-[#2b303d] bg-[#101217] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#8c94a2]">Select amount to harvest:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomTakeCountByTank((prev) => ({
                                    ...prev,
                                    [tank.id]: Math.max(1, (prev[tank.id] || customTake) - 1),
                                  }))
                                }
                                className="px-2 py-0.5 border border-[#373c49] bg-[#161820] text-[#f1f3f5] font-bold cursor-pointer hover:bg-[#20232e]"
                              >
                                -
                              </button>
                              <span className="font-bold text-[#f1f3f5] px-2">{customTake}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomTakeCountByTank((prev) => ({
                                    ...prev,
                                    [tank.id]: Math.min(tank.clutchCount, (prev[tank.id] || customTake) + 1),
                                  }))
                                }
                                className="px-2 py-0.5 border border-[#373c49] bg-[#161820] text-[#f1f3f5] font-bold cursor-pointer hover:bg-[#20232e]"
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomTakeCountByTank((prev) => ({
                                    ...prev,
                                    [tank.id]: tank.clutchCount,
                                  }))
                                }
                                className="text-[10px] text-sky-400 underline ml-1 cursor-pointer"
                              >
                                Max
                              </button>
                            </div>
                          </div>
                          <div className="text-[11px] text-[#717885] flex justify-between">
                            <span>Remaining in tank: {tank.clutchCount - customTake} fish</span>
                            <span>Est. Value: ${takeValue}</span>
                          </div>
                        </div>
                      )}

                      {/* Three Primary Harvest Actions */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => {
                            if (activeTakeCount === tank.clutchCount) {
                              clearTankCustomMode(tank.id);
                              onSellBatch(tank.id);
                            } else {
                              onPartialHarvest(tank.id, 'sell', activeTakeCount);
                            }
                          }}
                          className="py-2 px-1 border border-emerald-600 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-bold text-xs cursor-pointer text-center transition-colors"
                          title="Sell fish for cash"
                        >
                          Sell ${takeValue.toLocaleString()}
                        </button>

                        <button
                          onClick={() => {
                            if (activeTakeCount === tank.clutchCount) {
                              clearTankCustomMode(tank.id);
                              onTransferToBox(tank.id);
                            } else {
                              onPartialHarvest(tank.id, 'box', activeTakeCount);
                            }
                          }}
                          className="py-2 px-1 border border-[#3d4251] bg-[#1b1e26] hover:bg-[#252a35] text-[#f1f3f5] font-bold text-xs cursor-pointer text-center transition-colors"
                          title="Store fish into your personal Box"
                        >
                          To Box
                        </button>

                        <button
                          onClick={() => {
                            if (activeTakeCount === tank.clutchCount) {
                              clearTankCustomMode(tank.id);
                              onHarvestBait(tank.id);
                            } else {
                              onPartialHarvest(tank.id, 'bait', activeTakeCount);
                            }
                          }}
                          className="py-2 px-1 border border-sky-600 bg-sky-950/80 hover:bg-sky-900 text-sky-200 font-bold text-xs cursor-pointer text-center transition-colors"
                          title="Process into live bait charges"
                        >
                          Live Bait
                        </button>
                      </div>

                      {/* Bottom action links: Custom amount toggle & Reset tank */}
                      <div className="flex items-center justify-between text-[11px] pt-1 gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            setShowCustomTakeByTank((prev) => ({
                              ...prev,
                              [tank.id]: !prev[tank.id],
                            }))
                          }
                          className="px-2.5 py-1 text-[11px] font-bold border border-[#2e3340] bg-[#14161d] text-[#8c94a2] hover:text-[#cbd5e1] hover:border-[#424856] cursor-pointer inline-flex items-center transition-colors"
                        >
                          {showCustom ? 'Simple Harvest Options' : 'Custom Amount...'}
                        </button>

                        <button
                          onClick={() => {
                            clearTankCustomMode(tank.id);
                            onClearTank(tank.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:border-rose-600 cursor-pointer inline-flex items-center transition-colors"
                          title="Clear tank and start fresh"
                        >
                          Clear Tank
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Growing tank actions */
                    <div className="flex items-center justify-between pt-1 border-t border-[#232731] gap-2 flex-wrap">
                      {!tank.hasFood ? (
                        <button
                          disabled={money < currentFeed.price}
                          onClick={() => onFeedTank(tank.id)}
                          className="px-3 py-1 text-xs border border-amber-600 bg-amber-950 hover:bg-amber-900 text-amber-200 font-bold cursor-pointer"
                        >
                          Feed Tank ${currentFeed.price}
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-semibold">Feed active</span>
                      )}

                      <button
                        onClick={() => {
                          clearTankCustomMode(tank.id);
                          onClearTank(tank.id);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:border-rose-600 cursor-pointer inline-flex items-center transition-colors"
                        title="Cancel incubation and reset tank"
                      >
                        Clear Tank
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // EMPTY TANK (Clean, cozy broodstock setup)
            const countInBox = currentSpecies ? (fishInBoxMap[currentSpecies.id] || 0) : 0;
            const maxPairsPossible = Math.max(1, Math.min(4, Math.floor(countInBox / 2)));
            const selectedPairs = Math.min(
              maxPairsPossible,
              Math.max(1, selectedPairsByTank[tank.id] || 1)
            );
            const totalFeedCost = currentFeed.price * selectedPairs;

            const durationSec = currentSpecies
              ? calculateBreedingDuration(currentSpecies, currentFeedId, hatcheryUpgrades, 1.0, selectedPairs)
              : 0;
            const clutchYield = currentSpecies
              ? calculateClutchYield(currentSpecies, currentFeedId, hatcheryUpgrades, selectedPairs, 1.0)
              : 0;

            const canAffordFeed = money >= totalFeedCost;
            const hasBreedingPairs = countInBox >= selectedPairs * 2;
            const canStart = Boolean(currentSpecies && hasBreedingPairs && canAffordFeed);

            return (
              <div
                key={tank.id}
                className="p-3.5 border border-[#2b2e38] bg-[#14161d] flex flex-col justify-between space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-[#232731] pb-2">
                  <span className="font-bold text-[#f1f3f5] text-sm">{tank.name}</span>
                  <span className="text-[11px] text-[#717885]">Empty</span>
                </div>

                <div className="space-y-2.5">
                  {/* Select Species */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8c94a2]">Select Fish:</span>
                      {currentSpecies && (
                        <span className="text-sky-300 font-semibold">
                          {countInBox} in Box
                        </span>
                      )}
                    </div>

                    {availableSpeciesInBox.length === 0 ? (
                      <div className="p-2 border border-[#252832] bg-[#101216] text-[#717885] text-xs text-center">
                        Catch at least 2 fish of a kind to start breeding.
                      </div>
                    ) : (
                      <select
                        value={currentSpeciesId || ''}
                        aria-label="Select Broodstock Species"
                        onChange={(e) =>
                          setSelectedSpeciesByTank((prev) => ({
                            ...prev,
                            [tank.id]: Number(e.target.value),
                          }))
                        }
                        className="w-full border border-[#323640] bg-[#101215] px-2.5 py-1.5 text-xs text-[#f1f3f5] font-bold focus:outline-none cursor-pointer"
                      >
                        {availableSpeciesInBox.map((f) => {
                          const held = fishInBoxMap[f.id] || 0;
                          return (
                            <option key={f.id} value={f.id}>
                              {f.name} · {held} in Box
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  {/* Pairs Stepper & Feed Select */}
                  {currentSpecies && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#8c94a2] block mb-1">Breeding Pairs:</span>
                        <div className="flex items-center border border-[#323640] bg-[#101215]">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPairsByTank((prev) => ({
                                ...prev,
                                [tank.id]: Math.max(1, (prev[tank.id] || 1) - 1),
                              }))
                            }
                            className="px-2.5 py-1 text-[#f1f3f5] font-bold hover:bg-[#1a1d24] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="flex-1 text-center font-bold text-amber-300 text-xs">
                            {selectedPairs} {selectedPairs === 1 ? 'Pair' : 'Pairs'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedPairsByTank((prev) => ({
                                ...prev,
                                [tank.id]: Math.min(maxPairsPossible, (prev[tank.id] || 1) + 1),
                              }))
                            }
                            className="px-2.5 py-1 text-[#f1f3f5] font-bold hover:bg-[#1a1d24] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8c94a2] block mb-1">Feed Blend:</span>
                        <select
                          value={currentFeedId}
                          aria-label="Select Feed Blend"
                          onChange={(e) =>
                            setSelectedFeedByTank((prev) => ({
                              ...prev,
                              [tank.id]: e.target.value as FeedType,
                            }))
                          }
                          className="w-full border border-[#323640] bg-[#101215] px-2 py-1 text-xs text-[#f1f3f5] font-bold focus:outline-none cursor-pointer"
                        >
                          {FEED_OPTIONS.map((fd) => (
                            <option key={fd.id} value={fd.id}>
                              {fd.name} · ${fd.price * selectedPairs}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Optional Mutated Broodstock Strain Selector */}
                  {currentSpecies && (() => {
                    const availableStrainsForSpecies = Array.from(
                      new Set(
                        inventory
                          .filter(
                            (f) => f.fishId === currentSpecies.id && f.mutation && f.mutation !== 'normal'
                          )
                          .map((f) => f.mutation as HatcheryMutation)
                      )
                    );
                    if (availableStrainsForSpecies.length === 0) return null;
                    const selectedStrain = selectedMutationByTank[tank.id] || 'normal';

                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8c94a2]">Breeder Strain:</span>
                          <span
                            className={`text-[10px] font-bold ${
                              selectedStrain !== 'normal' ? 'text-cyan-300' : 'text-[#717885]'
                            }`}
                          >
                            {selectedStrain !== 'normal' ? '+8% Mutation Chance' : 'Base 1.5% Chance'}
                          </span>
                        </div>
                        <select
                          value={selectedStrain}
                          aria-label="Select Breeder Strain"
                          onChange={(e) =>
                            setSelectedMutationByTank((prev) => ({
                              ...prev,
                              [tank.id]: e.target.value as HatcheryMutation | 'normal',
                            }))
                          }
                          className="w-full border border-[#323640] bg-[#101215] px-2.5 py-1 text-xs text-[#f1f3f5] font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="normal">Normal Broodstock (Standard 1.5% Mutation Odds)</option>
                          {availableStrainsForSpecies.map((strain) => {
                            const detail = MUTATION_DETAILS[strain] || MUTATION_DETAILS.normal;
                            const held = inventory.filter(
                              (f) => f.fishId === currentSpecies.id && f.mutation === strain
                            ).length;
                            return (
                              <option key={strain} value={strain}>
                                {detail.name} Parent ({held} held · Higher ~8% Mutation Odds)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    );
                  })()}

                  {/* Clean summary preview */}
                  {currentSpecies && (
                    <div className="flex items-center justify-between text-[11px] text-[#8c94a2] border-t border-[#232731] pt-1.5">
                      <span>
                        Offspring: <strong className="text-emerald-400">~{clutchYield} fish</strong>
                      </span>
                      <span>
                        Time: <strong className="text-[#f1f3f5]">{durationSec}s</strong>
                      </span>
                      <span>
                        Feed: <strong className="text-amber-300">${totalFeedCost}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  disabled={!canStart}
                  onClick={() => {
                    if (currentSpeciesId) {
                      onStartBreeding(
                        tank.id,
                        currentSpeciesId,
                        currentFeedId,
                        selectedPairs,
                        selectedMutationByTank[tank.id] || 'normal'
                      );
                    }
                  }}
                  className={`w-full py-2 font-bold border text-xs transition-colors ${
                    canStart
                      ? 'border-emerald-600/80 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 cursor-pointer'
                      : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                  }`}
                >
                  {!currentSpecies
                    ? 'Need Fish in Box'
                    : !hasBreedingPairs
                    ? `Need ${selectedPairs * 2} Fish in Box`
                    : !canAffordFeed
                    ? `Need $${totalFeedCost} for Feed`
                    : `Start Breeding · $${totalFeedCost}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Facility Upgrades Section */}
      <div className="border border-[#2a2e38] bg-[#14161c] p-3.5 space-y-3">
        <div className="border-b border-[#252831] pb-2 text-xs flex items-center justify-between">
          <span className="font-bold text-[#f1f3f5] text-sm">Hatchery Upgrades</span>
          <span className="text-[11px] text-[#8c94a2]">Facility improvements across all tanks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {HATCHERY_UPGRADES.map((upgrade) => {
            const isInstalled = hatcheryUpgrades.includes(upgrade.id);
            const canAfford = money >= upgrade.price;

            return (
              <div
                key={upgrade.id}
                className="p-3 rounded-none border border-[#262f3f] bg-[#131720] flex flex-col justify-between text-xs space-y-2 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-[#f1f3f5]">{upgrade.name}</div>
                  <div className="text-[11px] text-[#8e97a7]">{upgrade.effect}</div>
                </div>

                <div className="border-t border-[#222938] pt-2 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-300">
                    {isInstalled ? (
                      <span className="text-emerald-400 font-semibold">Installed</span>
                    ) : (
                      `$${upgrade.price.toLocaleString()}`
                    )}
                  </span>

                  {!isInstalled && (
                    <button
                      disabled={!canAfford}
                      onClick={() => onBuyUpgrade(upgrade.id)}
                      className={`px-3 py-1 font-semibold rounded-none border text-[11px] transition-colors ${
                        canAfford
                          ? 'border-emerald-600/80 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 cursor-pointer shadow-sm'
                          : 'border-[#242a36] bg-[#12151d] text-[#555e6c] cursor-not-allowed'
                      }`}
                    >
                      Install
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

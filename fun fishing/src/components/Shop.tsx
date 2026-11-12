/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  RODS,
  REELS,
  LURES,
  Rod,
  Reel,
  Lure,
  getWaitSpeedLabel,
  getMaxRodWeight,
  getMinRodWeight,
  getRodSpriteUrl,
  getReelSpriteUrl,
  getLureSpriteUrl,
} from '../game/fishingLogic';
import {
  BOATS_CATALOG,
  BoatDefinition,
  FLEET_UPGRADES,
  FleetUpgrade,
  COMMERCIAL_BAITS,
  OwnedBoat,
  getBoatSpriteUrl,
} from '../game/commercialLogic';

interface ShopProps {
  money: number;
  ownedRodIds: string[];
  ownedReelIds: string[];
  ownedLureIds: string[];
  equippedRodId: string;
  equippedReelId: string;
  equippedLureId: string;
  unlockedCommercial: boolean;
  ownedBoats: OwnedBoat[];
  ownedUpgradeIds: string[];
  onBuyRod: (rod: Rod) => void;
  onBuyReel: (reel: Reel) => void;
  onBuyLure: (lure: Lure) => void;
  onEquipRod: (rodId: string) => void;
  onEquipReel: (reelId: string) => void;
  onEquipLure: (lureId: string) => void;
  onBuyBoat: (boat: BoatDefinition) => void;
  onBuyUpgrade: (upgrade: FleetUpgrade) => void;
}

export const Shop: React.FC<ShopProps> = ({
  money,
  ownedRodIds,
  ownedReelIds,
  ownedLureIds,
  equippedRodId,
  equippedReelId,
  equippedLureId,
  unlockedCommercial,
  ownedBoats,
  ownedUpgradeIds,
  onBuyRod,
  onBuyReel,
  onBuyLure,
  onEquipRod,
  onEquipReel,
  onEquipLure,
  onBuyBoat,
  onBuyUpgrade,
}) => {
  const [shopMode, setShopMode] = useState<'personal' | 'commercial'>('personal');
  const [personalTab, setPersonalTab] = useState<'rods' | 'reels' | 'lures'>('rods');
  const [commercialTab, setCommercialTab] = useState<'boats' | 'supplies' | 'upgrades'>('boats');

  // Sequential progression: next unlockable index in each gear tree
  const nextRodIndex = RODS.findIndex((r) => !ownedRodIds.includes(r.id));
  const nextReelIndex = REELS.findIndex((r) => !ownedReelIds.includes(r.id));
  const nextLureIndex = LURES.findIndex((l) => !ownedLureIds.includes(l.id));

  return (
    <div className="border border-[#2a2d34] bg-[#181a1f] p-4 text-[#e3e6eb] space-y-3">
      {/* Top Shop Mode Toggle: Buy Personal vs Buy Commercial */}
      <div className="flex items-center justify-between border-b border-[#292d36] pb-2 text-xs">
        <div className="flex gap-2">
          <button
            onClick={() => setShopMode('personal')}
            className={`px-3 py-1.5 border font-bold cursor-pointer transition-colors ${
              shopMode === 'personal'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-transparent text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Buy Personal Gear
          </button>
          {unlockedCommercial ? (
            <button
              onClick={() => setShopMode('commercial')}
              className={`px-3 py-1.5 border font-bold cursor-pointer transition-colors ${
                shopMode === 'commercial'
                  ? 'border-emerald-600/80 bg-emerald-950/40 text-emerald-300'
                  : 'border-transparent text-[#717885] hover:text-[#c0c5ce]'
              }`}
            >
              Buy Commercial Fleet
            </button>
          ) : (
            <div
              className="px-3 py-1.5 border border-[#22252c] bg-[#121316] text-[#4d5462] text-xs font-semibold select-none flex items-center gap-1.5"
              title="Charter your commercial fishing fleet for $400 in the Fleet tab"
            >
              <span>Commercial Fleet · Charter in Fleet tab · $400</span>
            </div>
          )}
        </div>
        <span className="text-[11px] text-[#717885] hidden sm:inline">
          {shopMode === 'personal' ? 'Handheld Tackle & Rods' : 'Vessels & Commercial Bulk Gear'}
        </span>
      </div>

      {/* PERSONAL GEAR SHOP */}
      {shopMode === 'personal' && (
        <div className="space-y-3">
          {/* Subtabs */}
          <div className="flex border-b border-[#292d36] pb-2 gap-2 text-xs">
            <button
              onClick={() => setPersonalTab('rods')}
              className={`px-3 py-1.5 border cursor-pointer ${
                personalTab === 'rods'
                  ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5] font-bold'
                  : 'border-transparent text-[#717885] hover:text-[#c0c5ce]'
              }`}
            >
              Rods
            </button>
            <button
              onClick={() => setPersonalTab('reels')}
              className={`px-3 py-1.5 border cursor-pointer ${
                personalTab === 'reels'
                  ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5] font-bold'
                  : 'border-transparent text-[#717885] hover:text-[#c0c5ce]'
              }`}
            >
              Reels
            </button>
            <button
              onClick={() => setPersonalTab('lures')}
              className={`px-3 py-1.5 border cursor-pointer ${
                personalTab === 'lures'
                  ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5] font-bold'
                  : 'border-transparent text-[#717885] hover:text-[#c0c5ce]'
              }`}
            >
              Bait/Lure
            </button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
            {/* RODS */}
            {personalTab === 'rods' &&
              RODS.map((rod, index) => {
                const isOwned = ownedRodIds.includes(rod.id);
                const isNextAvailable = index === nextRodIndex;
                const isAheadLocked = !isOwned && !isNextAvailable;

                if (isAheadLocked) {
                  return (
                    <div
                      key={rod.id}
                      className="p-3 border border-[#18191e] bg-[#0c0d10] flex items-center justify-between gap-3 text-xs opacity-50 select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm tracking-widest font-bold text-[#323640]">
                          ???
                        </span>
                        <span className="text-[10px] text-[#424754] uppercase tracking-wider font-semibold">
                          Locked Rod
                        </span>
                      </div>
                      <div className="text-[11px] text-[#363a45] italic">
                        Unlock preceding rod first
                      </div>
                    </div>
                  );
                }

                const isEquipped = equippedRodId === rod.id;
                const canAfford = money >= rod.price;
                const speed = getWaitSpeedLabel(rod.waitSeconds);
                const maxWeight = getMaxRodWeight(rod);
                const minWeight = getMinRodWeight(rod);

                return (
                  <div
                    key={rod.id}
                    className={`p-3 border flex items-center justify-between gap-3 text-xs ${
                      isEquipped
                        ? 'border-emerald-700/60 bg-[#122319]'
                        : isOwned
                        ? 'border-[#292d36] bg-[#1d2026]'
                        : 'border-[#23262d] bg-[#16181d]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getRodSpriteUrl(rod.id)}
                        alt={rod.name}
                        className="w-24 h-16 sm:w-32 sm:h-20 object-contain select-none shrink-0"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#f1f3f5]">
                          {rod.name}
                        </div>
                        <div className="text-[#8c94a2] mt-0.5">
                          {speed} wait · {rod.sizeMultiplier}x size · Rating: {minWeight > 0 ? `${minWeight} - ${maxWeight.toLocaleString()} lbs` : `Up to ${maxWeight.toLocaleString()} lbs`}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isOwned && (
                        <span className="font-bold text-[#c0c5ce]">
                          ${rod.price.toLocaleString()}
                        </span>
                      )}

                      {isEquipped ? (
                        <span className="px-3 py-1.5 text-emerald-400 font-bold border border-emerald-800 bg-[#0d2a1f]">
                          Equipped
                        </span>
                      ) : isOwned ? (
                        <button
                          onClick={() => onEquipRod(rod.id)}
                          className="px-3 py-1.5 border border-[#3b404c] bg-[#242730] hover:bg-[#2e333e] text-[#f1f3f5] font-bold cursor-pointer"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuyRod(rod)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 border font-bold ${
                            canAfford
                              ? 'border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer'
                              : 'border-[#282a32] bg-[#1a1c20] text-[#555a64] cursor-not-allowed'
                          }`}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* REELS */}
            {personalTab === 'reels' &&
              REELS.map((reel, index) => {
                const isOwned = ownedReelIds.includes(reel.id);
                const isNextAvailable = index === nextReelIndex;
                const isAheadLocked = !isOwned && !isNextAvailable;

                if (isAheadLocked) {
                  return (
                    <div
                      key={reel.id}
                      className="p-3 border border-[#18191e] bg-[#0c0d10] flex items-center justify-between gap-3 text-xs opacity-50 select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm tracking-widest font-bold text-[#323640]">
                          ???
                        </span>
                        <span className="text-[10px] text-[#424754] uppercase tracking-wider font-semibold">
                          Locked Reel
                        </span>
                      </div>
                      <div className="text-[11px] text-[#363a45] italic">
                        Unlock preceding reel first
                      </div>
                    </div>
                  );
                }

                const isEquipped = equippedReelId === reel.id;
                const canAfford = money >= reel.price;

                return (
                  <div
                    key={reel.id}
                    className={`p-3 border flex items-center justify-between gap-3 text-xs ${
                      isEquipped
                        ? 'border-emerald-700/60 bg-[#122319]'
                        : isOwned
                        ? 'border-[#292d36] bg-[#1d2026]'
                        : 'border-[#23262d] bg-[#16181d]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getReelSpriteUrl(reel.id)}
                        alt={reel.name}
                        className="w-14 h-12 object-contain select-none shrink-0"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#f1f3f5]">
                          {reel.name}
                        </div>
                        <div className="text-[#8c94a2] mt-0.5">
                          {reel.speedMultiplier}x reel speed · +{reel.lineStrength}% line strength &amp; bait defense
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isOwned && (
                        <span className="font-bold text-[#c0c5ce]">
                          ${reel.price.toLocaleString()}
                        </span>
                      )}

                      {isEquipped ? (
                        <span className="px-3 py-1.5 text-emerald-400 font-bold border border-emerald-800 bg-[#0d2a1f]">
                          Equipped
                        </span>
                      ) : isOwned ? (
                        <button
                          onClick={() => onEquipReel(reel.id)}
                          className="px-3 py-1.5 border border-[#3b404c] bg-[#242730] hover:bg-[#2e333e] text-[#f1f3f5] font-bold cursor-pointer"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuyReel(reel)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 border font-bold ${
                            canAfford
                              ? 'border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer'
                              : 'border-[#282a32] bg-[#1a1c20] text-[#555a64] cursor-not-allowed'
                          }`}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* LURES */}
            {personalTab === 'lures' &&
              LURES.map((lure, index) => {
                const isOwned = ownedLureIds.includes(lure.id);
                const isNextAvailable = index === nextLureIndex;
                const isAheadLocked = !isOwned && !isNextAvailable;

                if (isAheadLocked) {
                  return (
                    <div
                      key={lure.id}
                      className="p-3 border border-[#18191e] bg-[#0c0d10] flex items-center justify-between gap-3 text-xs opacity-50 select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm tracking-widest font-bold text-[#323640]">
                          ???
                        </span>
                        <span className="text-[10px] text-[#424754] uppercase tracking-wider font-semibold">
                          Locked Bait/Lure
                        </span>
                      </div>
                      <div className="text-[11px] text-[#363a45] italic">
                        Unlock preceding bait/lure first
                      </div>
                    </div>
                  );
                }

                const isEquipped = equippedLureId === lure.id;
                const canAfford = money >= lure.price;
                const rw = lure.rarityWeights;

                let rarityNote = 'Standard';
                if (lure.targetNote) {
                  rarityNote = `Target: ${lure.targetNote}`;
                } else if (rw.legendary > 2) {
                  rarityNote = 'Very high legendary odds';
                } else if (rw.epic > 8) {
                  rarityNote = 'High epic odds';
                } else if (rw.rare > 15) {
                  rarityNote = 'High rare odds';
                } else if (rw.uncommon > 25) {
                  rarityNote = 'Better uncommon odds';
                }

                return (
                  <div
                    key={lure.id}
                    className={`p-3 border flex items-center justify-between gap-3 text-xs ${
                      isEquipped
                        ? 'border-emerald-700/60 bg-[#122319]'
                        : isOwned
                        ? 'border-[#292d36] bg-[#1d2026]'
                        : 'border-[#23262d] bg-[#16181d]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getLureSpriteUrl(lure.id)}
                        alt={lure.name}
                        className="w-14 h-12 object-contain select-none shrink-0"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#f1f3f5]">
                          {lure.name}
                        </div>
                        <div className="text-[#8c94a2] mt-0.5">
                          {rarityNote}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isOwned && (
                        <span className="font-bold text-[#c0c5ce]">
                          ${lure.price.toLocaleString()}
                        </span>
                      )}

                      {isEquipped ? (
                        <span className="px-3 py-1.5 text-emerald-400 font-bold border border-emerald-800 bg-[#0d2a1f]">
                          Equipped
                        </span>
                      ) : isOwned ? (
                        <button
                          onClick={() => onEquipLure(lure.id)}
                          className="px-3 py-1.5 border border-[#3b404c] bg-[#242730] hover:bg-[#2e333e] text-[#f1f3f5] font-bold cursor-pointer"
                        >
                          Equip
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuyLure(lure)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 border font-bold ${
                            canAfford
                              ? 'border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer'
                              : 'border-[#282a32] bg-[#1a1c20] text-[#555a64] cursor-not-allowed'
                          }`}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* COMMERCIAL FLEET SHOP */}
      {shopMode === 'commercial' && (
        <div className="space-y-3">
          {/* Subtabs */}
          <div className="flex border-b border-[#292d36] pb-2 gap-2 text-xs">
            <button
              onClick={() => setCommercialTab('boats')}
              className={`px-3 py-1.5 border cursor-pointer ${
                commercialTab === 'boats'
                  ? 'border-emerald-600/80 bg-emerald-950/40 text-emerald-300 font-bold'
                  : 'border-transparent text-[#717885] hover:text-[#c0c5ce]'
              }`}
            >
              Vessels &amp; Boats
            </button>
            <button
              onClick={() => setCommercialTab('supplies')}
              className={`px-3 py-1.5 border cursor-pointer ${
                commercialTab === 'supplies'
                  ? 'border-emerald-600/80 bg-emerald-950/40 text-emerald-300 font-bold'
                  : 'border-transparent text-[#717885] hover:text-[#c0c5ce]'
              }`}
            >
              Bulk Fleet Provisions
            </button>
            <button
              onClick={() => setCommercialTab('upgrades')}
              className={`px-3 py-1.5 border cursor-pointer ${
                commercialTab === 'upgrades'
                  ? 'border-emerald-600/80 bg-emerald-950/40 text-emerald-300 font-bold'
                  : 'border-transparent text-[#717885] hover:text-[#c0c5ce]'
              }`}
            >
              Vessel Tech Upgrades
            </button>
          </div>

          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
            {/* BOATS CATALOG */}
            {commercialTab === 'boats' &&
              BOATS_CATALOG.map((boatDef) => {
                const canAfford = money >= boatDef.price;
                const ownedCount = ownedBoats.filter(
                  (b) => b.boatDefId === boatDef.id
                ).length;

                return (
                  <div
                    key={boatDef.id}
                    className="p-3.5 border border-[#2a2e38] bg-[#16181f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <img
                        src={getBoatSpriteUrl(boatDef.id)}
                        alt={boatDef.name}
                        className="w-32 h-20 sm:w-44 sm:h-26 object-contain shrink-0 select-none self-start sm:self-center"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#f1f3f5]">
                            {boatDef.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 border border-sky-800/60 bg-sky-950/40 text-sky-300 font-semibold uppercase">
                            Tier {boatDef.tier}
                          </span>
                          {ownedCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.2 border border-emerald-700/60 bg-emerald-950/40 text-emerald-300 font-bold">
                              {ownedCount} Owned
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[#8c94a2]">
                          {boatDef.description}
                        </div>

                        <div className="text-[11px] text-[#717885] flex flex-wrap gap-3 pt-0.5">
                          <span>
                            Crew Limit: <strong className="text-emerald-400">{boatDef.crewCapacity} crew</strong>
                          </span>
                          <span>
                            Cargo Hold: <strong className="text-sky-300">{boatDef.cargoCapacity} fish</strong>
                          </span>
                          <span>
                            Base Voyage: <strong className="text-[#f1f3f5]">{boatDef.baseVoyageSec}s</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-[#23262f] pt-2 sm:pt-0">
                      <span className="font-bold text-emerald-400 text-sm">
                        ${boatDef.price.toLocaleString()}
                      </span>

                      <button
                        onClick={() => onBuyBoat(boatDef)}
                        disabled={!canAfford}
                        className={`px-3.5 py-2 font-bold border text-xs transition-colors ${
                          canAfford
                            ? 'border-emerald-600/80 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 cursor-pointer shadow-xs'
                            : 'border-[#282a32] bg-[#141518] text-[#555a64] cursor-not-allowed'
                        }`}
                      >
                        Buy Vessel
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* BULK FLEET PROVISIONS */}
            {commercialTab === 'supplies' &&
              COMMERCIAL_BAITS.map((bait) => (
                <div
                  key={bait.id}
                  className="p-3 border border-[#2a2e38] bg-[#16181f] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-[#f1f3f5]">
                      {bait.name}
                    </div>
                    <div className="text-[11px] text-[#8c94a2]">
                      {bait.description}
                    </div>
                    <div className="text-[11px] text-emerald-300">
                      Commercial bulk provisioning · Selected per expedition in the Fleet tab
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="font-bold text-emerald-400 text-sm">
                      {bait.price > 0 ? `$${bait.price.toLocaleString()}` : 'Free'}
                    </div>
                    <div className="text-[10px] text-[#717885]">per voyage</div>
                  </div>
                </div>
              ))}

            {/* FLEET UPGRADES */}
            {commercialTab === 'upgrades' &&
              FLEET_UPGRADES.map((upgrade) => {
                const isOwned = ownedUpgradeIds.includes(upgrade.id);
                const canAfford = money >= upgrade.price;

                return (
                  <div
                    key={upgrade.id}
                    className={`p-3 border flex items-center justify-between gap-3 text-xs ${
                      isOwned
                        ? 'border-emerald-700/60 bg-[#122319]'
                        : 'border-[#2a2e38] bg-[#16181f]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#f1f3f5]">
                          {upgrade.name}
                        </span>
                        {isOwned && (
                          <span className="text-[10px] px-1.5 py-0.2 border border-emerald-700/60 bg-emerald-950/40 text-emerald-300 font-bold uppercase">
                            Fleet Installed
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8c94a2]">
                        {upgrade.description}
                      </div>
                      <div className="text-[11px] text-sky-300 font-semibold">
                        Effect: {upgrade.effect}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!isOwned && (
                        <span className="font-bold text-emerald-400 text-sm">
                          ${upgrade.price.toLocaleString()}
                        </span>
                      )}

                      {isOwned ? (
                        <span className="px-3 py-1.5 text-emerald-400 font-bold border border-emerald-800 bg-[#0d2a1f]">
                          Installed
                        </span>
                      ) : (
                        <button
                          onClick={() => onBuyUpgrade(upgrade)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 font-bold border ${
                            canAfford
                              ? 'border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer'
                              : 'border-[#282a32] bg-[#141518] text-[#555a64] cursor-not-allowed'
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
      )}
    </div>
  );
};

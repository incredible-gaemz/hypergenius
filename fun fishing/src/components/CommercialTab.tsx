/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BOATS_CATALOG,
  CrewMember,
  OwnedBoat,
  ActiveExpedition,
  COMMERCIAL_BAITS,
  FLEET_UPGRADES,
  calculateVoyageDuration,
  calculateExpeditionWageCost,
  getRecommendedCommercialBait,
  getCrewMoraleTitle,
  SearchFocus,
  getSearchFocusLabel,
  CommercialBaitId,
  CommercialStats,
  getBoatSpriteUrl,
} from '../game/commercialLogic';
import {
  AreaId,
  CaughtFish,
  CatalogEntry,
  FISHING_AREAS,
  FISH_COLLECTION,
  getRarityTextStyle,
  getRarityBadgeStyle,
  FishMarketOrder,
} from '../game/fishingLogic';

interface CommercialTabProps {
  money: number;
  ownedBoats: OwnedBoat[];
  hiredCrew: CrewMember[];
  availableJobSeekers: CrewMember[];
  onRefreshJobSeekers: () => void;
  unlockedAreaIds: string[];
  commercialStats: CommercialStats;
  catalogMap?: Record<number, CatalogEntry>;
  inventory?: CaughtFish[];
  marketOrders?: FishMarketOrder[];
  onHireCrew: (crew: CrewMember) => void;
  onAssignCrew: (boatInstanceId: string, crewId: string) => void;
  onUnassignCrew: (boatInstanceId: string, crewId: string) => void;
  onStartExpedition: (
    boatInstanceId: string,
    areaId: AreaId,
    focus: SearchFocus,
    baitId: CommercialBaitId,
    targetFishId?: number | null
  ) => void;
  onClaimHaulToBox: (boatInstanceId: string) => void;
  onSellHaulDirect: (boatInstanceId: string) => void;
  onRenameBoat: (boatInstanceId: string, newName: string) => void;
  onCallInEarly: (boatInstanceId: string) => void;
  onRetireBoat: (boatInstanceId: string) => void;
  onFulfillOrder?: (orderId: string) => void;
  onDeclineOrder?: (orderId: string) => void;
  onGiveCrewBonus?: (crewId: string, amount: number) => void;
  commercialBusinessName?: string | null;
  onStartCommercialBusiness?: (name: string) => void;
}

export const CommercialTab: React.FC<CommercialTabProps> = ({
  money,
  ownedBoats,
  hiredCrew,
  availableJobSeekers,
  onRefreshJobSeekers,
  unlockedAreaIds,
  commercialStats,
  catalogMap = {},
  inventory = [],
  marketOrders = [],
  onHireCrew,
  onAssignCrew,
  onUnassignCrew,
  onStartExpedition,
  onClaimHaulToBox,
  onSellHaulDirect,
  onRenameBoat,
  onCallInEarly,
  onRetireBoat,
  onFulfillOrder,
  onDeclineOrder,
  onGiveCrewBonus,
  commercialBusinessName = null,
  onStartCommercialBusiness,
}) => {
  const [subTab, setSubTab] = useState<'fleet' | 'crew' | 'stats'>('fleet');
  const [charterNameInput, setCharterNameInput] = useState('');
  const [selectedAreaByBoat, setSelectedAreaByBoat] = useState<Record<string, AreaId>>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_fleet_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.selectedAreaByBoat === 'object') return parsed.selectedAreaByBoat;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [selectedFocusByBoat, setSelectedFocusByBoat] = useState<Record<string, SearchFocus>>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_fleet_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.selectedFocusByBoat === 'object') return parsed.selectedFocusByBoat;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [selectedBaitByBoat, setSelectedBaitByBoat] = useState<Record<string, CommercialBaitId>>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_fleet_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.selectedBaitByBoat === 'object') return parsed.selectedBaitByBoat;
      }
    } catch {
      // ignore
    }
    return {};
  });

  const [selectedTargetFishByBoat, setSelectedTargetFishByBoat] = useState<Record<string, number | null>>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_fleet_settings_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.selectedTargetFishByBoat === 'object') return parsed.selectedTargetFishByBoat;
      }
    } catch {
      // ignore
    }
    return {};
  });

  // Persist fleet dispatch settings across tab switches and reloads
  useEffect(() => {
    try {
      localStorage.setItem(
        'cozy_reel_fleet_settings_v1',
        JSON.stringify({
          selectedAreaByBoat,
          selectedFocusByBoat,
          selectedBaitByBoat,
          selectedTargetFishByBoat,
        })
      );
    } catch {
      // ignore
    }
  }, [selectedAreaByBoat, selectedFocusByBoat, selectedBaitByBoat, selectedTargetFishByBoat]);
  const [fishDropdownOpenBoatId, setFishDropdownOpenBoatId] = useState<string | null>(null);
  const [fishSearchQuery, setFishSearchQuery] = useState<string>('');
  const [editingBoatNameId, setEditingBoatNameId] = useState<string | null>(null);
  const [tempBoatName, setTempBoatName] = useState<string>('');
  const [boatRetireConfirmId, setBoatRetireConfirmId] = useState<string | null>(null);

  // Live ticker for active voyage countdown and progress
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const availableAreas = FISHING_AREAS.filter((a) => unlockedAreaIds.includes(a.id));
  const assignedCrewIdsSet = new Set(ownedBoats.flatMap((b) => b.assignedCrewIds));

  const allCaughtSpecies = useMemo(() => {
    return FISH_COLLECTION.filter((f) => (catalogMap[f.id]?.caughtCount || 0) > 0);
  }, [catalogMap]);

  if (!commercialBusinessName) {
    return (
      <div className="border border-[#2a2d34] bg-[#181a1f] p-8 text-[#e3e6eb]">
        <div className="max-w-md mx-auto text-center border border-[#2d313c] bg-[#14161c] p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
              Harbor Commercial Charter
            </span>
            <h2 className="text-base font-bold text-[#f1f3f5]">Found Fishing Company</h2>
            <p className="text-xs text-[#8c94a2] leading-relaxed">
              Register your fleet with the harbor master to purchase vessels, hire deckhands, and run offshore expeditions.
            </p>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[11px] text-[#8c94a2] font-semibold">Company Name:</label>
            <input
              type="text"
              value={charterNameInput}
              onChange={(e) => setCharterNameInput(e.target.value)}
              placeholder="e.g. Pelican Point Fisheries"
              maxLength={28}
              className="w-full px-3 py-2 border border-[#353a47] bg-[#101216] text-[#f1f3f5] text-xs font-bold focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="p-3 border border-[#242730] bg-[#101216] text-xs text-[#a3aab8] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#717885]">Charter Fee:</span>
              <span className="font-bold text-sky-400">$1,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#717885]">Your Funds:</span>
              <span className={`font-bold ${money >= 1000 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ${money.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            disabled={money < 1000 || !charterNameInput.trim()}
            onClick={() => {
              if (onStartCommercialBusiness && charterNameInput.trim()) {
                onStartCommercialBusiness(charterNameInput.trim());
              }
            }}
            className={`w-full py-2.5 font-bold border text-xs transition-colors ${
              money >= 1000 && charterNameInput.trim()
                ? 'border-sky-600 bg-sky-950 hover:bg-sky-900 text-sky-200 cursor-pointer'
                : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
            }`}
          >
            {money < 1000
              ? 'Need $1,000 to Found Company'
              : !charterNameInput.trim()
              ? 'Enter Company Name'
              : 'Register Company · $1,000'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#2a2d34] bg-[#181a1f] p-4 text-[#e3e6eb] space-y-4">
      {/* Top Header & Sub-navigation */}
      <div className="border-b border-[#292d36] pb-3 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#f1f3f5] text-sm">{commercialBusinessName}</span>
          <span className="text-[11px] text-[#8c94a2]">
            {ownedBoats.length} {ownedBoats.length === 1 ? 'vessel' : 'vessels'} · {hiredCrew.length} crew
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSubTab('fleet')}
            className={`px-3 py-1.5 border text-xs font-bold cursor-pointer transition-colors ${
              subTab === 'fleet'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#262932] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Fleet
          </button>
          <button
            onClick={() => setSubTab('crew')}
            className={`px-3 py-1.5 border text-xs font-bold cursor-pointer transition-colors ${
              subTab === 'crew'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#262932] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Crew
          </button>
          <button
            onClick={() => setSubTab('stats')}
            className={`px-3 py-1.5 border text-xs font-bold cursor-pointer transition-colors ${
              subTab === 'stats'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#262932] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Stats
          </button>
        </div>
      </div>

      {/* FLEET SUBTAB */}
      {subTab === 'fleet' && (
        <div className="space-y-3">
          {ownedBoats.length === 0 ? (
            <div className="p-8 text-center border border-[#23262d] bg-[#15171b] space-y-2">
              <div className="text-[#8c94a2] text-xs">No commercial vessels owned yet.</div>
              <div className="text-[11px] text-[#636c7a]">
                Visit <strong className="text-[#c0c5ce]">Shop &gt; Boats</strong> to purchase your first vessel.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {ownedBoats.map((boat) => {
                const boatDef = BOATS_CATALOG.find((b) => b.id === boat.boatDefId) || BOATS_CATALOG[0];
                const assignedCrew = hiredCrew.filter((c) => boat.assignedCrewIds.includes(c.id));
                const installedUpgrades = FLEET_UPGRADES.filter((u) => boat.installedUpgradeIds.includes(u.id));

                const currentAreaId = selectedAreaByBoat[boat.instanceId] || availableAreas[0]?.id || 'pond';
                const currentFocus = selectedFocusByBoat[boat.instanceId] || 'quantity';
                const currentBaitId = selectedBaitByBoat[boat.instanceId] || 'bare_gear';
                const currentBait = COMMERCIAL_BAITS.find((b) => b.id === currentBaitId) || COMMERCIAL_BAITS[0];
                const currentTargetFishId = selectedTargetFishByBoat[boat.instanceId] ?? null;

                const targetedFish = currentTargetFishId
                  ? FISH_COLLECTION.find((f) => f.id === currentTargetFishId)
                  : null;

                const isDropdownOpen = fishDropdownOpenBoatId === boat.instanceId;
                const searchLower = fishSearchQuery.toLowerCase().trim();
                const candidateFishList = allCaughtSpecies.filter((f) => {
                  if (!searchLower) return f.areaId === currentAreaId;
                  const areaName = FISHING_AREAS.find((a) => a.id === f.areaId)?.name || '';
                  return (
                    f.name.toLowerCase().includes(searchLower) ||
                    f.tier.toLowerCase().includes(searchLower) ||
                    areaName.toLowerCase().includes(searchLower)
                  );
                });

                const voyageSec = calculateVoyageDuration(
                  boatDef,
                  assignedCrew,
                  installedUpgrades,
                  currentAreaId,
                  currentBaitId,
                  currentTargetFishId
                );
                const wageCost = calculateExpeditionWageCost(assignedCrew);
                const baitCost = currentBait.price;
                const totalVoyageCost = wageCost + baitCost;
                const canAffordDispatch = money >= totalVoyageCost;

                const expedition = boat.expedition;
                const isOnVoyage = expedition && !expedition.isCompleted;
                const isHaulReady = expedition && expedition.isCompleted;

                const elapsedSec = expedition ? (nowTick - expedition.startedAt) / 1000 : 0;
                const remainingSec = expedition ? Math.max(0, Math.ceil(expedition.durationSec - elapsedSec)) : 0;
                const progressPct = expedition ? Math.min(100, (elapsedSec / expedition.durationSec) * 100) : 0;

                const isEditingName = editingBoatNameId === boat.instanceId;
                const isRetireConfirming = boatRetireConfirmId === boat.instanceId;

                return (
                  <div key={boat.instanceId} className="border border-[#2d313c] bg-[#16181e] p-3 space-y-2.5">
                    {/* Vessel Header */}
                    <div className="flex flex-wrap items-center justify-between border-b border-[#252831] pb-2 text-xs gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={getBoatSpriteUrl(boatDef.id)}
                          alt={boatDef.name}
                          className="w-28 h-18 sm:w-36 sm:h-22 object-contain shrink-0 select-none"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <div>
                          {isEditingName ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempBoatName}
                                onChange={(e) => setTempBoatName(e.target.value)}
                                className="px-2 py-0.5 border border-[#3b404c] bg-[#101215] text-[#f1f3f5] font-bold text-xs"
                                maxLength={24}
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (tempBoatName.trim()) onRenameBoat(boat.instanceId, tempBoatName.trim());
                                  setEditingBoatNameId(null);
                                }}
                                className="px-2 py-0.5 border border-emerald-600 bg-emerald-950 text-emerald-300 font-bold text-[11px] cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingBoatNameId(null)}
                                className="px-2 py-0.5 border border-[#333742] bg-[#1c1e24] text-[#8c94a2] text-[11px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#f1f3f5] text-sm">{boat.customName}</span>
                              <button
                                onClick={() => {
                                  setEditingBoatNameId(boat.instanceId);
                                  setTempBoatName(boat.customName);
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold border border-[#3b414f] bg-[#16181f] text-[#8c94a2] hover:text-[#f1f3f5] hover:border-[#5a6272] cursor-pointer inline-flex items-center transition-colors"
                              >
                                Rename
                              </button>
                            </div>
                          )}

                          <span className="text-[11px] text-[#8c94a2]">
                            {boatDef.name} · Tier {boatDef.tier}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-[#8c94a2]">
                          Hold: <strong className="text-[#f1f3f5]">{boatDef.cargoCapacity}</strong>
                        </span>
                        <span className="text-[#8c94a2]">
                          Crew:{' '}
                          <strong className={assignedCrew.length >= boatDef.crewCapacity ? 'text-emerald-400' : 'text-[#f1f3f5]'}>
                            {assignedCrew.length}/{boatDef.crewCapacity}
                          </strong>
                        </span>

                        {!isOnVoyage && !isHaulReady && (
                          <div className="ml-1">
                            {isRetireConfirming ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    onRetireBoat(boat.instanceId);
                                    setBoatRetireConfirmId(null);
                                  }}
                                  className="px-2 py-0.5 border border-rose-600 bg-rose-950 text-rose-200 font-bold text-[11px] cursor-pointer"
                                >
                                  Confirm Scrap · $0
                                </button>
                                <button
                                  onClick={() => setBoatRetireConfirmId(null)}
                                  className="px-1.5 py-0.5 border border-[#333742] bg-[#1c1e24] text-[#8c94a2] text-[11px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setBoatRetireConfirmId(boat.instanceId)}
                                className="text-[10px] px-1.5 py-0.5 border border-[#2c303c] hover:border-rose-700 bg-[#14161c] text-[#8c94a2] hover:text-rose-300 cursor-pointer"
                              >
                                Scrap Boat · $0
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active Voyage State */}
                    {isOnVoyage && expedition && (
                      <div className="p-3 border border-sky-800/60 bg-[#101c24] space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-sky-300 font-bold">
                            {FISHING_AREAS.find((a) => a.id === expedition.destinationAreaId)?.name}
                            {expedition.targetFishId && (
                              <span className="text-amber-300 ml-1.5 font-normal">
                                · Targeting: {FISH_COLLECTION.find((f) => f.id === expedition.targetFishId)?.name}
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-sky-400 font-bold">
                            {remainingSec >= 60 ? `${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s left` : `${remainingSec}s left`}
                          </span>
                        </div>

                        <div className="w-full bg-[#182631] border border-[#233847] h-2 overflow-hidden">
                          <div className="bg-sky-400 h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#809cb5]">
                            Focus: <strong className="text-sky-200">{getSearchFocusLabel(expedition.searchFocus)}</strong>
                          </span>

                          <button
                            onClick={() => onCallInEarly(boat.instanceId)}
                            className="px-2.5 py-1 border border-amber-600/80 bg-amber-950/80 hover:bg-amber-900 text-amber-200 font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            {progressPct < 20
                              ? 'Recall to Port · 0 Fish'
                              : `Recall Early ${Math.round(progressPct)}%`}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Haul Ready State */}
                    {isHaulReady && expedition?.resolvedHaul && (
                      expedition.resolvedHaul.length === 0 ? (
                        <div className="p-3 border border-[#3b404d] bg-[#16181d] space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-[#c0c5ce]">Vessel Returned Empty</span>
                              <div className="text-[11px] text-[#717885]">
                                Recalled in transit before gear could soak. 0 fish landed.
                              </div>
                            </div>
                            <button
                              onClick={() => onClaimHaulToBox(boat.instanceId)}
                              className="px-3 py-1.5 border border-[#3b404d] bg-[#1f2229] hover:bg-[#282c35] text-[#f1f3f5] font-bold cursor-pointer"
                            >
                              Dock Vessel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 border border-emerald-600/70 bg-[#122217] space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-emerald-300">Expedition Complete</span>
                              <div className="text-[11px] text-[#9fc4a9]">
                                Harvest: {expedition.resolvedHaul.length} fish · Value: $
                                {expedition.resolvedHaul.reduce((s, f) => s + f.value, 0).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onClaimHaulToBox(boat.instanceId)}
                                className="px-3 py-1.5 border border-[#3b404d] bg-[#1f2229] hover:bg-[#282c35] text-[#f1f3f5] font-bold cursor-pointer"
                              >
                                To Box
                              </button>
                              <button
                                onClick={() => onSellHaulDirect(boat.instanceId)}
                                className="px-3 py-1.5 border border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold cursor-pointer"
                              >
                                Sell All Direct
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {/* Docked Configuration State */}
                    {!expedition && (
                      <div className="space-y-2.5 text-xs">
                        {/* Crew tags */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {assignedCrew.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 border border-[#2a2e38] bg-[#181a20] text-[11px] flex items-center gap-1.5"
                            >
                              <span className="font-bold text-[#f1f3f5]">{c.name}</span>
                              <button
                                onClick={() => onUnassignCrew(boat.instanceId, c.id)}
                                className="text-[10px] text-[#717885] hover:text-rose-400 cursor-pointer"
                              >
                                [x]
                              </button>
                            </span>
                          ))}

                          {assignedCrew.length < boatDef.crewCapacity && (
                            <select
                              aria-label="Assign Crew"
                              onChange={(e) => {
                                if (e.target.value) {
                                  onAssignCrew(boat.instanceId, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              defaultValue=""
                              className="border border-[#323640] bg-[#101215] px-2 py-1 text-[11px] text-[#c0c5ce] cursor-pointer"
                            >
                              <option value="" disabled>
                                + Assign Crew...
                              </option>
                              {hiredCrew
                                .filter((c) => !assignedCrewIdsSet.has(c.id))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.specialtyTitle})
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>

                        {/* 4 Expedition Controls Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                          {/* Waters */}
                          <div className="space-y-1">
                            <span className="text-[11px] text-[#8c94a2]">Waters:</span>
                            <select
                              value={currentAreaId}
                              aria-label="Destination Waters"
                              onChange={(e) => {
                                const newArea = e.target.value as AreaId;
                                setSelectedAreaByBoat((prev) => ({ ...prev, [boat.instanceId]: newArea }));
                                setSelectedTargetFishByBoat((prev) => ({ ...prev, [boat.instanceId]: null }));
                              }}
                              className="w-full border border-[#323640] bg-[#121418] px-2 py-1.5 text-xs text-[#f1f3f5] font-bold focus:outline-none cursor-pointer"
                            >
                              {availableAreas.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Target Species Searchable */}
                          <div className="space-y-1 relative">
                            <span className="text-[11px] text-[#8c94a2]">Target:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFishDropdownOpenBoatId(isDropdownOpen ? null : boat.instanceId);
                                setFishSearchQuery('');
                              }}
                              className="w-full border border-[#323640] hover:border-sky-600/70 bg-[#121418] px-2 py-1.5 text-xs text-left text-[#f1f3f5] font-bold flex items-center justify-between cursor-pointer focus:outline-none"
                            >
                              <span className="truncate">
                                {targetedFish ? `${targetedFish.name} · ${targetedFish.tier}` : 'Any Species'}
                              </span>
                              <span className="text-[10px] text-[#717885] ml-1">[select]</span>
                            </button>

                            {targetedFish && (
                              <div className="text-[10px] pt-0.5 leading-tight">
                                {currentBaitId === getRecommendedCommercialBait(targetedFish) ? (
                                  <span className="text-emerald-400 font-medium">
                                    Right bait loaded: guaranteed 2-4+ {targetedFish.name} in haul.
                                  </span>
                                ) : (
                                  <span className="text-amber-300 font-medium">
                                    Other bait: target rate reduced. Rig {COMMERCIAL_BAITS.find((b) => b.id === getRecommendedCommercialBait(targetedFish))?.name || 'favored bait'} for the full haul.
                                  </span>
                                )}
                              </div>
                            )}

                            {isDropdownOpen && (
                              <div className="absolute left-0 top-full z-40 mt-1 w-72 sm:w-80 bg-[#121418] border border-[#3a404e] shadow-2xl p-2 space-y-2">
                                <input
                                  type="text"
                                  placeholder="Search caught fish..."
                                  value={fishSearchQuery}
                                  onChange={(e) => setFishSearchQuery(e.target.value)}
                                  className="w-full px-2 py-1 text-xs bg-[#0b0c0e] border border-[#2e3340] text-[#f1f3f5] focus:outline-none focus:border-sky-500"
                                  autoFocus
                                />

                                <div className="max-h-52 overflow-y-auto space-y-1 pr-1 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTargetFishByBoat((prev) => ({ ...prev, [boat.instanceId]: null }));
                                      setFishDropdownOpenBoatId(null);
                                      setFishSearchQuery('');
                                    }}
                                    className={`w-full text-left px-2 py-1.5 text-[11px] font-semibold border transition-colors cursor-pointer ${
                                      !currentTargetFishId
                                        ? 'border-sky-600 bg-sky-950/80 text-sky-200'
                                        : 'border-[#242730] hover:bg-[#1a1c23] text-[#c0c5ce]'
                                    }`}
                                  >
                                    Any Species · General Harvest
                                  </button>

                                  {candidateFishList.map((f) => {
                                    const recBait = getRecommendedCommercialBait(f);
                                    const baitName = COMMERCIAL_BAITS.find((b) => b.id === recBait)?.name || recBait;
                                    const isSelected = currentTargetFishId === f.id;
                                    const isCurrentArea = f.areaId === currentAreaId;
                                    const areaDef = FISHING_AREAS.find((a) => a.id === f.areaId);

                                    return (
                                      <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedTargetFishByBoat((prev) => ({ ...prev, [boat.instanceId]: f.id }));
                                          if (f.areaId !== currentAreaId) {
                                            setSelectedAreaByBoat((prev) => ({ ...prev, [boat.instanceId]: f.areaId }));
                                          }
                                          setSelectedBaitByBoat((prev) => ({ ...prev, [boat.instanceId]: recBait }));
                                          setFishDropdownOpenBoatId(null);
                                          setFishSearchQuery('');
                                        }}
                                        className={`w-full text-left p-1.5 border transition-colors cursor-pointer ${
                                          isSelected
                                            ? 'border-sky-600 bg-sky-950/80 text-sky-200'
                                            : 'border-[#22252c] hover:border-[#383d4c] hover:bg-[#171920] text-[#e0e3ea]'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className={`font-bold text-xs ${getRarityTextStyle(f.tier)}`}>{f.name}</span>
                                          <span className={`text-[9px] px-1 py-0.2 border uppercase ${getRarityBadgeStyle(f.tier)}`}>
                                            {f.tier}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-[#8c94a2] flex items-center justify-between mt-0.5">
                                          <span>Favors {baitName}</span>
                                          {!isCurrentArea && <span className="text-amber-400 font-medium">In {areaDef?.name}</span>}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="pt-1 border-t border-[#22252c] flex items-center justify-between text-[10px] text-[#717885]">
                                  <span>{allCaughtSpecies.length} species discovered</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFishDropdownOpenBoatId(null);
                                      setFishSearchQuery('');
                                    }}
                                    className="text-[#8c94a2] hover:text-[#f1f3f5] cursor-pointer"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Search Focus: Quantity or Quality */}
                          <div className="space-y-1">
                            <span className="text-[11px] text-[#8c94a2]">Focus:</span>
                            <select
                              value={currentFocus === 'trophy' || currentFocus === 'quality' ? 'quality' : currentFocus === 'orders' ? 'orders' : 'quantity'}
                              aria-label="Search Focus"
                              onChange={(e) =>
                                setSelectedFocusByBoat((prev) => ({
                                  ...prev,
                                  [boat.instanceId]: e.target.value as SearchFocus,
                                }))
                              }
                              className="w-full border border-[#323640] bg-[#121418] px-2 py-1.5 text-xs text-[#f1f3f5] font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="quantity">Quantity</option>
                              <option value="quality">Quality</option>
                              <option value="orders">Contracts</option>
                            </select>
                          </div>

                          {/* Bait / Lure */}
                          <div className="space-y-1">
                            <span className="text-[11px] text-[#8c94a2]">Bait/Lure:</span>
                            <select
                              value={currentBaitId}
                              aria-label="Bulk Provisions and Bait/Lure"
                              onChange={(e) =>
                                setSelectedBaitByBoat((prev) => ({
                                  ...prev,
                                  [boat.instanceId]: e.target.value as CommercialBaitId,
                                }))
                              }
                              className="w-full border border-[#323640] bg-[#121418] px-2 py-1.5 text-xs text-[#f1f3f5] font-bold focus:outline-none cursor-pointer"
                            >
                              {COMMERCIAL_BAITS.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name} · {b.price > 0 ? `+$${b.price}` : 'Free'}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Dispatch Bar */}
                        <div className="flex flex-wrap items-center justify-between border-t border-[#23262f] pt-2 text-xs gap-2">
                          <div className="text-[11px] text-[#8c94a2]">
                            Duration: <strong className="text-[#f1f3f5]">{voyageSec >= 60 ? `${Math.floor(voyageSec / 60)}m ${voyageSec % 60}s` : `${voyageSec}s`}</strong> · Total Cost:{' '}
                            <strong className="text-emerald-400">${totalVoyageCost}</strong>
                          </div>

                          <button
                            disabled={assignedCrew.length === 0 || !canAffordDispatch}
                            onClick={() =>
                              onStartExpedition(
                                boat.instanceId,
                                currentAreaId,
                                currentFocus,
                                currentBaitId,
                                currentTargetFishId
                              )
                            }
                            className={`px-4 py-1.5 font-bold border text-xs transition-colors ${
                              assignedCrew.length > 0 && canAffordDispatch
                                ? 'border-emerald-600/80 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 cursor-pointer'
                                : 'border-[#282a32] bg-[#141518] text-[#555a64] cursor-not-allowed'
                            }`}
                          >
                            {assignedCrew.length === 0
                              ? 'Assign Crew to Launch'
                              : !canAffordDispatch
                              ? `Need $${totalVoyageCost}`
                              : `Launch Expedition · $${totalVoyageCost}`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREW SUBTAB */}
      {subTab === 'crew' && (
        <div className="space-y-4">
          {/* Harbor Job Seekers */}
          <div className="border border-[#2d313c] bg-[#14161c] p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#252831] pb-2 text-xs">
              <span className="font-bold text-[#f1f3f5]">Available Fishermen at Harbor</span>
              <button
                onClick={onRefreshJobSeekers}
                className="px-2 py-0.5 text-xs border border-[#3b404d] hover:border-sky-600 bg-[#1c1e24] text-[#c0c5ce] hover:text-sky-300 font-semibold cursor-pointer"
              >
                Ask Around Docks
              </button>
            </div>

            {availableJobSeekers.length === 0 ? (
              <div className="p-4 text-center border border-[#23262d] bg-[#121418] text-[#8c94a2] text-xs">
                No fishermen are currently looking for work. Check back soon.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableJobSeekers.map((applicant) => {
                  const canAfford = money >= applicant.hireCost;

                  return (
                    <div
                      key={applicant.id}
                      className="p-2.5 border border-[#282b34] bg-[#16181f] flex flex-col justify-between text-xs space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#f1f3f5]">{applicant.name}</span>
                          <span className="text-[9px] text-sky-400 border border-sky-800/60 bg-sky-950/40 px-1 py-0.2 font-semibold">
                            {applicant.specialtyTitle}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-300">{applicant.specialtyDescription}</div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#23262f] pt-1.5 text-[11px]">
                        <span className="text-[#8c94a2]">
                          ${applicant.wagePerVoyage}/voyage
                        </span>
                        <button
                          disabled={!canAfford}
                          onClick={() => onHireCrew(applicant)}
                          className={`px-2.5 py-1 font-bold border text-xs ${
                            canAfford
                              ? 'border-emerald-600/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer'
                              : 'border-[#282a32] bg-[#141518] text-[#555a64] cursor-not-allowed'
                          }`}
                        >
                          Hire ${applicant.hireCost}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Hired Crew */}
          <div className="border border-[#2d313c] bg-[#14161c] p-3 space-y-2.5">
            <div className="border-b border-[#252831] pb-2 text-xs flex items-center justify-between">
              <span className="font-bold text-[#f1f3f5]">Active Crew Roster · {hiredCrew.length} Hired</span>
            </div>

            {hiredCrew.length === 0 ? (
              <div className="p-4 text-center border border-[#23262d] bg-[#121418] text-[#8c94a2] text-xs">
                No crew hired yet. Hire candidates from the Harbor list above.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {hiredCrew.map((crew) => {
                  const assignedBoat = ownedBoats.find((b) => b.assignedCrewIds.includes(crew.id));
                  const moraleInfo = getCrewMoraleTitle(crew.moraleLevel || 0);
                  const canAfford50 = money >= 50;
                  const canAfford100 = money >= 100;
                  const isMaxMorale = (crew.moraleLevel || 0) >= 5;

                  return (
                    <div
                      key={crew.id}
                      className="p-2.5 border border-[#2b303c] bg-[#14161d] flex flex-col justify-between text-xs space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#f1f3f5]">{crew.name}</span>
                          <span className="text-[9px] text-sky-400 border border-sky-800/60 bg-sky-950/40 px-1 py-0.2 font-semibold">
                            {crew.specialtyTitle}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-300">{crew.specialtyDescription}</div>
                      </div>

                      {/* Morale Level & Efficiency Effects */}
                      <div className="p-1.5 border border-[#232731] bg-[#0f1115] space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#8c94a2]">Morale:</span>
                          <span className={`px-1.5 py-0.2 border text-[10px] font-semibold ${moraleInfo.badgeClass}`}>
                            {moraleInfo.title} · Tier {crew.moraleLevel || 0}/5
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8c94a2]">{moraleInfo.effectDesc}</div>
                        {(crew.bonusPaidTotal || 0) > 0 && (
                          <div className="text-[10px] text-emerald-400">
                            Total Bonuses Paid: ${(crew.bonusPaidTotal || 0).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Assignment & Wage */}
                      <div className="space-y-1.5 border-t border-[#23262f] pt-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8c94a2]">${crew.wagePerVoyage}/voyage</span>
                          <span className={assignedBoat ? 'text-emerald-400 font-bold' : 'text-sky-400'}>
                            {assignedBoat ? assignedBoat.customName : 'In Reserve'}
                          </span>
                        </div>

                        {/* Worker Bonuses Action */}
                        {onGiveCrewBonus && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {isMaxMorale ? (
                              <div className="w-full text-center py-1 text-[10px] border border-purple-800/60 bg-purple-950/40 text-purple-300 font-bold">
                                Max Crew Morale
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={!canAfford50}
                                  onClick={() => onGiveCrewBonus(crew.id, 50)}
                                  className={`flex-1 py-1 text-[10px] font-bold border transition-colors ${
                                    canAfford50
                                      ? 'border-emerald-600/80 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 cursor-pointer'
                                      : 'border-[#262830] bg-[#141518] text-[#555a64] cursor-not-allowed'
                                  }`}
                                  title="Give $50 bonus (+1 Morale Tier)"
                                >
                                  Bonus +$50
                                </button>
                                <button
                                  type="button"
                                  disabled={!canAfford100}
                                  onClick={() => onGiveCrewBonus(crew.id, 100)}
                                  className={`flex-1 py-1 text-[10px] font-bold border transition-colors ${
                                    canAfford100
                                      ? 'border-sky-600/80 bg-sky-950/50 hover:bg-sky-900/70 text-sky-300 cursor-pointer'
                                      : 'border-[#262830] bg-[#141518] text-[#555a64] cursor-not-allowed'
                                  }`}
                                  title="Give $100 bonus (+2 Morale Tiers)"
                                >
                                  Bonus +$100
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATS SUBTAB */}
      {subTab === 'stats' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 border border-[#2b2f3a] bg-[#14161c] space-y-1">
            <span className="text-[#8c94a2] text-[11px]">Total Revenue</span>
            <div className="text-lg font-bold text-emerald-400">
              ${(commercialStats?.totalFleetRevenue || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-3 border border-[#2b2f3a] bg-[#14161c] space-y-1">
            <span className="text-[#8c94a2] text-[11px]">Expeditions</span>
            <div className="text-lg font-bold text-sky-400">
              {(commercialStats?.totalExpeditionsCount || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-3 border border-[#2b2f3a] bg-[#14161c] space-y-1">
            <span className="text-[#8c94a2] text-[11px]">Fish Harvested</span>
            <div className="text-lg font-bold text-[#f1f3f5]">
              {(commercialStats?.totalFishLanded || 0).toLocaleString()}
            </div>
          </div>
          <div className="p-3 border border-[#2b2f3a] bg-[#14161c] space-y-1">
            <span className="text-[#8c94a2] text-[11px]">Fleet Size</span>
            <div className="text-lg font-bold text-amber-300">
              {ownedBoats.length} vessels
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

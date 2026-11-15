/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CrewMember } from '../game/commercialLogic';
import {
  SALVAGE_BOATS_CATALOG,
  SUNKEN_WRECK_SITES,
  TREASURE_CATALOG,
  SalvageState,
  SunkenWreckSite,
  getWreckRemainingTreasures,
  getWreckDiscoveredTreasures,
  getTreasureSpriteUrl,
  calculateExpeditionDurationSec,
  formatMinutesSeconds,
} from '../game/salvageLogic';

interface SalvageViewProps {
  money: number;
  hiredCrew: CrewMember[];
  salvageState: SalvageState;
  onUnlockSalvageCharter: () => void;
  onBuySalvageBoat: (boatDefId: string) => void;
  onUnlockWreckSite: (siteId: string) => void;
  onAssignCrewToSalvageBoat: (boatInstanceId: string, crewId: string) => void;
  onUnassignCrewFromSalvageBoat: (boatInstanceId: string, crewId: string) => void;
  onStartSalvageExpedition: (boatInstanceId: string, wreckSiteId: string) => void;
  onClaimSalvageExpedition: (expeditionId: string) => void;
  onListTreasureOnAuction: (treasureInstanceId: string, startingBid: number) => void;
  onRelistAuctionTreasure: (auctionId: string) => void;
  onCollectAuctionProceeds: (auctionId: string) => void;
}

export const SalvageView: React.FC<SalvageViewProps> = ({
  money,
  hiredCrew,
  salvageState,
  onUnlockSalvageCharter,
  onBuySalvageBoat,
  onUnlockWreckSite,
  onAssignCrewToSalvageBoat,
  onUnassignCrewFromSalvageBoat,
  onStartSalvageExpedition,
  onClaimSalvageExpedition,
  onListTreasureOnAuction,
  onRelistAuctionTreasure,
  onCollectAuctionProceeds,
}) => {
  const [salvageSection, setSalvageSection] = useState<'wrecks' | 'fleet' | 'auctions'>('wrecks');
  const [selectedLaunchBoatByWreck, setSelectedLaunchBoatByWreck] = useState<Record<string, string>>({});
  const [startingBids, setStartingBids] = useState<Record<string, number>>({});
  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if deep sea salvage charter is unlocked ($20,000)
  if (!salvageState.unlocked) {
    return (
      <div className="border border-[#2d323e] bg-[#14161c] p-6 text-center space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#f1f3f5]">Deep Sea Shipwreck Salvage</h2>
          <p className="text-xs text-[#8c94a2] max-w-lg mx-auto leading-relaxed">
            Acquire official deep-sea maritime exploration charts to survey 7 historical shipwrecks.
            Deploy specialized salvage vessels with your hired crew to recover priceless artifacts and auction them to private collectors.
          </p>
        </div>

        <div className="p-4 bg-[#0d0f14] border border-[#23262f] max-w-md mx-auto space-y-2 text-xs text-[#8c94a2]">
          <div className="flex justify-between items-center text-xs">
            <span>Maritime Salvage Charter:</span>
            <span className="font-mono text-amber-400 font-bold">$20,000</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>Historical Shipwrecks:</span>
            <span className="text-[#d6d9e0]">{SUNKEN_WRECK_SITES.length} Unique Exploration Sites</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>Artifact Discovery:</span>
            <span className="text-[#d6d9e0]">{TREASURE_CATALOG.length} Illustrated Historic Relics</span>
          </div>
        </div>

        <div>
          <button
            onClick={onUnlockSalvageCharter}
            disabled={money < 20000}
            className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold border transition-colors cursor-pointer touch-manipulation min-h-[40px] ${
              money >= 20000
                ? 'border-amber-600 bg-amber-950 hover:bg-amber-900 text-amber-200'
                : 'border-[#2d323e] bg-[#1a1d24] text-[#636c7a] cursor-not-allowed'
            }`}
          >
            {money >= 20000 ? 'Unlock Salvage Charter · $20,000' : 'Requires $20,000 to Unlock'}
          </button>
        </div>
      </div>
    );
  }

  const assignedCrewIds = new Set(
    salvageState.ownedSalvageBoatInstances.flatMap((b) => b.assignedCrewIds)
  );
  const activeExpeditionBoatIds = new Set(
    salvageState.activeExpeditions.map((e) => e.boatInstanceId)
  );

  return (
    <div className="space-y-4">
      {/* Top Header & Navigation */}
      <div className="border border-[#2d323e] bg-[#14161c] p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#f1f3f5]">Deep Sea Salvage</span>
          <span className="text-xs text-[#8c94a2]">·</span>
          <span className="text-xs text-amber-400 font-mono font-bold">${money.toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto text-[11px] sm:text-xs">
          <button
            onClick={() => setSalvageSection('wrecks')}
            className={`px-2 py-2 sm:px-3 sm:py-1.5 min-h-[38px] flex items-center justify-center border font-bold cursor-pointer transition-colors touch-manipulation text-center ${
              salvageSection === 'wrecks'
                ? 'border-amber-600 bg-amber-950/80 text-amber-200'
                : 'border-[#2a2d34] bg-[#161820] text-[#8c94a2] hover:text-[#f1f3f5]'
            }`}
          >
            <span className="hidden sm:inline">Shipwrecks</span>
            <span className="sm:hidden">Wrecks</span> ({SUNKEN_WRECK_SITES.length})
          </button>
          <button
            onClick={() => setSalvageSection('fleet')}
            className={`px-2 py-2 sm:px-3 sm:py-1.5 min-h-[38px] flex items-center justify-center border font-bold cursor-pointer transition-colors touch-manipulation text-center ${
              salvageSection === 'fleet'
                ? 'border-amber-600 bg-amber-950/80 text-amber-200'
                : 'border-[#2a2d34] bg-[#161820] text-[#8c94a2] hover:text-[#f1f3f5]'
            }`}
          >
            <span className="hidden sm:inline">Salvage Fleet</span>
            <span className="sm:hidden">Fleet</span> ({salvageState.ownedSalvageBoatInstances.length})
          </button>
          <button
            onClick={() => setSalvageSection('auctions')}
            className={`px-2 py-2 sm:px-3 sm:py-1.5 min-h-[38px] flex items-center justify-center border font-bold cursor-pointer transition-colors touch-manipulation text-center ${
              salvageSection === 'auctions'
                ? 'border-amber-600 bg-amber-950/80 text-amber-200'
                : 'border-[#2a2d34] bg-[#161820] text-[#8c94a2] hover:text-[#f1f3f5]'
            }`}
          >
            <span className="hidden sm:inline">Vault & Auctions</span>
            <span className="sm:hidden">Auctions</span> ({salvageState.recoveredVaultTreasures.length + salvageState.activeAuctions.length})
          </button>
        </div>
      </div>

      {/* ACTIVE EXPEDITIONS MONITOR (Sits directly under the tabs for multitasking) */}
      {salvageState.activeExpeditions.length > 0 && (
        <div className="border border-amber-900/60 bg-[#12151d] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Active Salvage Expeditions ({salvageState.activeExpeditions.length})
            </span>
            <span className="text-[11px] text-[#8c94a2]">
              Vessels operating on seabed coordinates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {salvageState.activeExpeditions.map((exp) => {
              const wreck = SUNKEN_WRECK_SITES.find((w) => w.id === exp.wreckSiteId);
              const boatDef = SALVAGE_BOATS_CATALOG.find((b) => b.id === exp.boatDefId);
              if (!wreck || !boatDef) return null;

              const timeLeft = Math.max(0, Math.ceil((exp.endTime - nowTick) / 1000));
              const progress = Math.min(1, Math.max(0, (exp.durationSec - timeLeft) / exp.durationSec));
              const isComplete = timeLeft === 0;

              return (
                <div
                  key={exp.expeditionId}
                  className="relative border border-[#333844] bg-[#0c0e13] overflow-hidden flex flex-col justify-between"
                  style={{ minHeight: '140px' }}
                >
                  {/* Background banner with dark gradient */}
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none"
                    style={{ backgroundImage: `url(${wreck.bannerImage})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e13] via-[#0c0e13]/70 to-transparent pointer-events-none" />

                  {/* Top info */}
                  <div className="relative z-10 p-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-[#f1f3f5]">{wreck.name}</div>
                      <div className="text-[11px] text-amber-300">
                        {wreck.depthMeters.toLocaleString()}m Depth · {boatDef.name} ({exp.assignedCrewIds.length} crew)
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 border text-[10px] font-bold ${
                      isComplete
                        ? 'border-emerald-600 bg-emerald-950/80 text-emerald-300'
                        : 'border-amber-600/70 bg-amber-950/70 text-amber-300'
                    }`}>
                      {isComplete ? 'Surfaced' : 'Dredging'}
                    </span>
                  </div>

                  {/* Bottom Controls & Progress */}
                  <div className="relative z-10 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8c94a2]">
                        {isComplete ? 'Seabed recoveries ready' : 'Expedition Time:'}
                      </span>
                      <span className="font-mono font-bold text-[#f1f3f5]">
                        {isComplete ? 'Complete' : formatMinutesSeconds(timeLeft)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#1c1f26] border border-[#2b2f3a] h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-1000"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>

                    {isComplete && (
                      <button
                        onClick={() => onClaimSalvageExpedition(exp.expeditionId)}
                        className="w-full py-1.5 border border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 font-bold text-xs cursor-pointer transition-colors"
                      >
                        Claim Recovered Relics
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 1: SHIPWRECKS */}
      {salvageSection === 'wrecks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs text-[#8c94a2]">
            <span>Charted Historical Shipwrecks across coastal and abyssal ocean floor</span>
            <span className="text-[#636c7a] sm:text-[#8c94a2]">Each shipwreck contains exclusive historical artifacts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUNKEN_WRECK_SITES.map((wreck) => {
              const isUnlocked = salvageState.unlockedWreckIds.includes(wreck.id);
              const remaining = getWreckRemainingTreasures(wreck, salvageState);
              const discoveredTreasures = getWreckDiscoveredTreasures(wreck, salvageState);
              const isFullyExplored = remaining === 0;

              const activeExpedition = salvageState.activeExpeditions.find(
                (e) => e.wreckSiteId === wreck.id
              );
              const expTimeLeft = activeExpedition
                ? Math.max(0, Math.ceil((activeExpedition.endTime - nowTick) / 1000))
                : 0;

              const readyBoats = salvageState.ownedSalvageBoatInstances.filter(
                (b) => !activeExpeditionBoatIds.has(b.instanceId) && b.assignedCrewIds.length > 0
              );

              const selectedBoatId =
                selectedLaunchBoatByWreck[wreck.id] || (readyBoats[0] ? readyBoats[0].instanceId : '');

              return (
                <div
                  key={wreck.id}
                  className="border border-[#2d323e] bg-[#14161c] overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Image Banner */}
                  <div className="relative w-full h-36 sm:h-44 bg-[#0a0c10] border-b border-[#2d323e] overflow-hidden">
                    {isUnlocked ? (
                      <img
                        src={wreck.bannerImage}
                        alt={wreck.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-[#08090d] text-center space-y-1">
                        <span className="text-xs font-mono tracking-widest text-[#555d6b] uppercase">
                          Uncharted Coordinates
                        </span>
                        <span className="text-[11px] text-[#424855]">
                          Survey license required to reveal bathymetric imaging
                        </span>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 border border-[#2d323e] text-[10px] font-mono text-[#d6d9e0]">
                      {wreck.depthMeters.toLocaleString()}m
                    </div>

                    {isUnlocked && isFullyExplored && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-950/90 border border-emerald-600 text-[10px] font-bold text-emerald-300">
                        Fully Scavenged · All Relics Found
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3 sm:p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#f1f3f5]">{wreck.name}</h3>
                          <span className="text-[11px] text-[#8c94a2]">{wreck.vesselType}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {discoveredTreasures.length} / {wreck.totalTreasureCount} Relics
                        </span>
                      </div>

                      <p className="text-xs text-[#8c94a2] leading-relaxed">
                        {wreck.description}
                      </p>
                    </div>

                    {/* DISCOVERED RELICS AT THIS WRECK */}
                    {isUnlocked && (
                      <div className="pt-2 border-t border-[#23262f] space-y-1.5">
                        <div className="text-[11px] font-bold text-[#8c94a2] flex justify-between">
                          <span>Recovered Relics from this Wreck:</span>
                          <span>{discoveredTreasures.length} of {wreck.totalTreasureCount}</span>
                        </div>

                        {discoveredTreasures.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {discoveredTreasures.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-1.5 p-1 bg-[#0f1116] border border-[#23262e] text-xs min-w-0"
                              >
                                <img
                                  src={getTreasureSpriteUrl(t.id)}
                                  alt={t.name}
                                  className="w-5 h-5 object-contain flex-shrink-0"
                                  style={{ imageRendering: 'pixelated' }}
                                />
                                <span className="text-[11px] text-[#d6d9e0] truncate" title={t.name}>
                                  {t.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#555d6b] italic py-1">
                            No relics recovered from this site yet.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Area */}
                    <div className="pt-2 border-t border-[#23262f]">
                      {!isUnlocked ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs text-[#8c94a2]">Unlock Chart:</span>
                          <button
                            onClick={() => onUnlockWreckSite(wreck.id)}
                            disabled={money < wreck.unlockCost}
                            className={`w-full sm:w-auto px-4 py-2 min-h-[38px] text-xs font-bold border transition-colors touch-manipulation cursor-pointer text-center ${
                              money >= wreck.unlockCost
                                ? 'border-amber-600 bg-amber-950 hover:bg-amber-900 text-amber-200'
                                : 'border-[#2d323e] bg-[#1a1d24] text-[#636c7a] cursor-not-allowed'
                            }`}
                          >
                            {money >= wreck.unlockCost
                              ? `Unlock · $${wreck.unlockCost.toLocaleString()}`
                              : `Requires $${wreck.unlockCost.toLocaleString()}`}
                          </button>
                        </div>
                      ) : activeExpedition ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-amber-400 font-bold">Expedition Active</span>
                            <span className="font-mono text-[#f1f3f5]">
                              {expTimeLeft > 0 ? formatMinutesSeconds(expTimeLeft) : 'Ready'}
                            </span>
                          </div>

                          {expTimeLeft === 0 && (
                            <button
                              onClick={() => onClaimSalvageExpedition(activeExpedition.expeditionId)}
                              className="w-full py-2 min-h-[38px] border border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 font-bold text-xs cursor-pointer transition-colors touch-manipulation"
                            >
                              Claim Recoveries
                            </button>
                          )}
                        </div>
                      ) : isFullyExplored ? (
                        <div className="text-xs text-[#636c7a] italic py-1 text-center">
                          All treasures on this shipwreck have been recovered.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {readyBoats.length === 0 ? (
                            <div className="text-[11px] text-[#8c94a2] italic py-1">
                              Assign crew to an available salvage boat to launch.
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <select
                                value={selectedBoatId}
                                onChange={(e) =>
                                  setSelectedLaunchBoatByWreck((prev) => ({
                                    ...prev,
                                    [wreck.id]: e.target.value,
                                  }))
                                }
                                className="w-full bg-[#101217] border border-[#2a2d34] text-xs text-[#e3e6eb] px-2 py-2 min-h-[38px] flex-1 focus:outline-none truncate"
                              >
                                {readyBoats.map((b) => {
                                  const def =
                                    SALVAGE_BOATS_CATALOG.find((cat) => cat.id === b.boatDefId) ||
                                    SALVAGE_BOATS_CATALOG[0];
                                  const estDuration = calculateExpeditionDurationSec(wreck, def);
                                  return (
                                    <option key={b.instanceId} value={b.instanceId}>
                                      {def.name} ({b.assignedCrewIds.length}/{def.maxCrew} crew · ~{formatMinutesSeconds(estDuration)})
                                    </option>
                                  );
                                })}
                              </select>

                              <button
                                onClick={() => {
                                  if (selectedBoatId) {
                                    onStartSalvageExpedition(selectedBoatId, wreck.id);
                                  }
                                }}
                                className="w-full sm:w-auto px-4 py-2 min-h-[38px] border border-amber-600 bg-amber-950 hover:bg-amber-900 text-amber-200 font-bold cursor-pointer text-xs transition-colors touch-manipulation text-center"
                              >
                                Launch
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: SALVAGE FLEET */}
      {salvageSection === 'fleet' && (
        <div className="space-y-6">
          {/* Owned Salvage Vessels */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs">
              <span className="font-bold uppercase tracking-wider text-[#8c94a2]">
                Commissioned Salvage Vessels ({salvageState.ownedSalvageBoatInstances.length})
              </span>
              <span className="text-[#8c94a2]">
                Assign hired crew to prepare ships for expeditions
              </span>
            </div>

            {salvageState.ownedSalvageBoatInstances.length === 0 ? (
              <div className="border border-[#2d323e] bg-[#14161c] p-6 text-center text-xs text-[#8c94a2]">
                No salvage vessels commissioned yet. Purchase a recovery vessel from the Shipyard below.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {salvageState.ownedSalvageBoatInstances.map((boat) => {
                  const def =
                    SALVAGE_BOATS_CATALOG.find((b) => b.id === boat.boatDefId) ||
                    SALVAGE_BOATS_CATALOG[0];
                  const isBusy = activeExpeditionBoatIds.has(boat.instanceId);
                  const availableToAssign = hiredCrew.filter(
                    (c) => !assignedCrewIds.has(c.id) || boat.assignedCrewIds.includes(c.id)
                  );

                  return (
                    <div
                      key={boat.instanceId}
                      className="border border-[#2d323e] bg-[#14161c] p-3 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 bg-[#0d0f14] border border-[#242730] flex items-center justify-center p-1 flex-shrink-0">
                          <img
                            src={def.spriteUrl}
                            alt={def.name}
                            className="max-h-10 max-w-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-[#f1f3f5] truncate">{def.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 border font-bold flex-shrink-0 ${
                              isBusy
                                ? 'border-amber-600 bg-amber-950 text-amber-300'
                                : 'border-[#333742] bg-[#1c1f26] text-[#8c94a2]'
                            }`}>
                              {isBusy ? 'At Sea' : 'Docked'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8c94a2] flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                            <span>Speed: <strong className="text-sky-300">{def.speedMultiplier}x</strong></span>
                            <span>Cargo: <strong className="text-amber-300">{def.cargoCapacity} relics</strong></span>
                            <span>Crew: <strong className="text-emerald-400">{boat.assignedCrewIds.length}/{def.maxCrew}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Crew Row */}
                      <div className="pt-2 border-t border-[#23262f] space-y-1.5">
                        <div className="text-[11px] text-[#8c94a2]">Assigned Crew:</div>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {boat.assignedCrewIds.length === 0 ? (
                            <span className="text-[11px] text-[#636c7a] italic">No crew assigned</span>
                          ) : (
                            boat.assignedCrewIds.map((cId) => {
                              const crew = hiredCrew.find((c) => c.id === cId);
                              return (
                                <span
                                  key={cId}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 border border-[#333742] bg-[#1c1f26] text-xs text-[#d6d9e0]"
                                >
                                  {crew ? `${crew.name}${crew.specialtyTitle ? ` (${crew.specialtyTitle})` : ''}` : 'Sailor'}
                                  {!isBusy && (
                                    <button
                                      onClick={() => onUnassignCrewFromSalvageBoat(boat.instanceId, cId)}
                                      className="text-red-400 hover:text-red-300 font-bold cursor-pointer ml-1 p-0.5 touch-manipulation"
                                      title="Remove crew"
                                    >
                                      x
                                    </button>
                                  )}
                                </span>
                              );
                            })
                          )}

                          {!isBusy && boat.assignedCrewIds.length < def.maxCrew && (
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  onAssignCrewToSalvageBoat(boat.instanceId, e.target.value);
                                }
                              }}
                              className="bg-[#101217] border border-[#2a2d34] text-xs text-[#e3e6eb] px-2 py-1.5 min-h-[34px] focus:outline-none"
                            >
                              <option value="">+ Assign Crew...</option>
                              {availableToAssign
                                .filter((c) => !boat.assignedCrewIds.includes(c.id))
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}{c.specialtyTitle ? ` (${c.specialtyTitle})` : ''}
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Salvage Shipyard */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8c94a2]">
              Salvage Shipyard (Purchase Vessels)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {SALVAGE_BOATS_CATALOG.map((boatDef) => (
                <div
                  key={boatDef.id}
                  className="border border-[#2d323e] bg-[#14161c] p-3 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="w-full h-24 bg-[#0d0f14] border border-[#23262f] flex items-center justify-center p-2">
                      <img
                        src={boatDef.spriteUrl}
                        alt={boatDef.name}
                        className="max-h-20 max-w-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>

                    <div>
                      <div className="font-bold text-xs text-[#f1f3f5]">{boatDef.name}</div>
                      <div className="text-xs font-mono font-bold text-amber-400">
                        ${boatDef.cost.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-[11px] text-[#8c94a2] space-y-0.5">
                      <div>Speed: <strong className="text-sky-300">{boatDef.speedMultiplier}x</strong></div>
                      <div>Capacity: <strong className="text-amber-300">{boatDef.cargoCapacity} relics</strong></div>
                      <div>Crew Limit: <strong className="text-emerald-400">{boatDef.maxCrew} crew</strong></div>
                    </div>

                    <p className="text-[11px] text-[#8c94a2] leading-tight">
                      {boatDef.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onBuySalvageBoat(boatDef.id)}
                    disabled={money < boatDef.cost}
                    className={`w-full py-2 min-h-[38px] border text-xs font-bold transition-colors touch-manipulation cursor-pointer ${
                      money >= boatDef.cost
                        ? 'border-amber-600 bg-amber-950 hover:bg-amber-900 text-amber-200'
                        : 'border-[#2d323e] bg-[#1a1d24] text-[#636c7a] cursor-not-allowed'
                    }`}
                  >
                    {money >= boatDef.cost ? `Buy · $${boatDef.cost.toLocaleString()}` : 'Need More Funds'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MARITIME VAULT & AUCTIONS */}
      {salvageSection === 'auctions' && (
        <div className="space-y-6">
          {/* Active Live Auctions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-400">
                Live Maritime Auctions ({salvageState.activeAuctions.length})
              </span>
              <span className="text-[#8c94a2]">
                Collectors submit bids over time; setting prices too high will result in passed lots
              </span>
            </div>

            {salvageState.activeAuctions.length === 0 ? (
              <div className="border border-[#2d323e] bg-[#14161c] p-6 text-center text-xs text-[#8c94a2]">
                No active auction listings. Select a recovered relic from the Vault below to list.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {salvageState.activeAuctions.map((auc) => {
                  const def =
                    TREASURE_CATALOG.find((t) => t.id === auc.treasure.treasureDefId) ||
                    TREASURE_CATALOG[0];
                  const timeLeft = Math.max(0, Math.ceil((auc.concludesAt - nowTick) / 1000));
                  const isSold = auc.status === 'sold';
                  const isUnsold = auc.status === 'unsold';

                  return (
                    <div
                      key={auc.auctionId}
                      className="border border-[#2d323e] bg-[#14161c] p-3 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        {/* Artifact Icon */}
                        <div className="w-14 h-14 bg-[#0d0f14] border border-[#23262f] flex items-center justify-center p-1 flex-shrink-0">
                          <img
                            src={getTreasureSpriteUrl(def.id)}
                            alt={def.name}
                            className="max-h-12 max-w-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-[#f1f3f5] truncate">{def.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 border font-bold flex-shrink-0 ${
                              isSold
                                ? 'border-emerald-600 bg-emerald-950 text-emerald-300'
                                : isUnsold
                                ? 'border-red-600 bg-red-950 text-red-300'
                                : 'border-amber-600 bg-amber-950 text-amber-300'
                            }`}>
                              {isSold ? 'Sold' : isUnsold ? 'Unsold' : 'Bidding'}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#8c94a2] mt-0.5">
                            {def.historicalPeriod} · Starting Bid: ${auc.startPrice.toLocaleString()}
                          </div>

                          <div className="mt-1 text-xs">
                            <span className="text-[#8c94a2]">Current Bid: </span>
                            <strong className="text-amber-400 font-mono text-sm">
                              ${auc.currentBid.toLocaleString()}
                            </strong>
                          </div>

                          <div className="text-[10px] text-[#8c94a2]">
                            {isUnsold
                              ? 'No bids placed (starting bid too high for collectors)'
                              : `Bidder: ${auc.highestBidderName} (${auc.bidsPlacedCount} bids placed)`}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action */}
                      <div className="pt-2 border-t border-[#23262f] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
                        <span className="text-[#8c94a2] font-mono">
                          {isSold || isUnsold ? 'Auction Concluded' : `Time Left: ${formatMinutesSeconds(timeLeft)}`}
                        </span>

                        {isSold && (
                          <button
                            onClick={() => onCollectAuctionProceeds(auc.auctionId)}
                            className="w-full sm:w-auto px-3 py-1.5 min-h-[36px] border border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 font-bold text-xs cursor-pointer transition-colors touch-manipulation text-center"
                          >
                            Collect ${auc.finalHammerPrice.toLocaleString()}
                          </button>
                        )}

                        {isUnsold && (
                          <button
                            onClick={() => onRelistAuctionTreasure(auc.auctionId)}
                            className="w-full sm:w-auto px-3 py-1.5 min-h-[36px] border border-amber-600 bg-amber-950 hover:bg-amber-900 text-amber-200 font-bold text-xs cursor-pointer transition-colors touch-manipulation text-center"
                          >
                            Relist Artifact
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recovered Relics Vault */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs">
              <span className="font-bold uppercase tracking-wider text-[#8c94a2]">
                Recovered Relics Vault ({salvageState.recoveredVaultTreasures.length})
              </span>
              <span className="text-[#8c94a2]">
                Set a realistic starting bid based on market interest
              </span>
            </div>

            {salvageState.recoveredVaultTreasures.length === 0 ? (
              <div className="border border-[#2d323e] bg-[#14161c] p-6 text-center text-xs text-[#8c94a2]">
                Your vault is currently empty. Send salvage boats on shipwreck expeditions to recover relics.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {salvageState.recoveredVaultTreasures.map((treasure) => {
                  const def =
                    TREASURE_CATALOG.find((t) => t.id === treasure.treasureDefId) ||
                    TREASURE_CATALOG[0];
                  const userStartingBid = startingBids[treasure.instanceId] ?? def.baseEstimatedValue;

                  return (
                    <div
                      key={treasure.instanceId}
                      className="border border-[#2d323e] bg-[#14161c] p-3 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Artifact Icon */}
                        <div className="w-full h-28 bg-[#0d0f14] border border-[#23262f] flex items-center justify-center p-2">
                          <img
                            src={getTreasureSpriteUrl(def.id)}
                            alt={def.name}
                            className="max-h-24 max-w-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>

                        <div>
                          <div className="font-bold text-xs text-[#f1f3f5] truncate" title={def.name}>
                            {def.name}
                          </div>
                          <div className="text-[11px] text-[#8c94a2]">
                            {def.historicalPeriod}
                          </div>
                        </div>

                        <div className="p-2 bg-[#0f1116] border border-[#23262f] text-xs">
                          <div className="flex justify-between items-center text-[#8c94a2]">
                            <span>Estimated Value:</span>
                            <span className="font-mono text-amber-300 font-bold">${def.baseEstimatedValue.toLocaleString()}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#8c94a2] leading-relaxed line-clamp-2">
                          {def.description}
                        </p>
                      </div>

                      {/* Starting Bid Input & List Button */}
                      <div className="pt-2 border-t border-[#23262f] space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-[#8c94a2]">Starting Bid:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[#8c94a2]">$</span>
                            <input
                              type="number"
                              min="10"
                              value={userStartingBid}
                              onChange={(e) => {
                                const val = Math.max(10, parseInt(e.target.value) || 0);
                                setStartingBids((prev) => ({
                                  ...prev,
                                  [treasure.instanceId]: val,
                                }));
                              }}
                              className="w-28 bg-[#0f1116] border border-[#2a2d34] text-xs font-mono font-bold text-amber-300 px-2 py-1 min-h-[34px] text-right focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => onListTreasureOnAuction(treasure.instanceId, userStartingBid)}
                          className="w-full py-2 min-h-[38px] border border-amber-600 bg-amber-950 hover:bg-amber-900 text-amber-200 font-bold text-xs cursor-pointer transition-colors touch-manipulation"
                        >
                          List on Maritime Auction
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

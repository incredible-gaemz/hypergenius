/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CivicInvestmentId,
  CIVIC_INVESTMENTS,
  ClubId,
  ANGLER_CLUBS,
  ClubMemberState,
  getClubRankTitle,
  getClubRankBonus,
  getNextRankProgress,
  getDailyCommodityTrends,
  TownBounty,
  isClubPerkActive,
  getSubscriptionTimeRemaining,
} from '../game/townLogic';
import {
  getCurrentWeatherRumor,
  isWeatherRumorActive,
  getRumorSpecies,
} from '../game/weatherRumorLogic';
import {
  FishMarketOrder,
  CaughtFish,
  AreaId,
  WeatherId,
  FISHING_AREAS,
  FISH_COLLECTION,
  WEATHER_TYPES,
  getRarityTextStyle,
  getRarityBadgeStyle,
} from '../game/fishingLogic';
interface TownTabProps {
  money: number;
  inventory: CaughtFish[];
  privateOrders: FishMarketOrder[];
  commercialOrders: FishMarketOrder[];
  townBounties: TownBounty[];
  civicInvestments: CivicInvestmentId[];
  clubState: ClubMemberState;
  currentAreaId: AreaId;
  currentWeatherId: WeatherId;
  weatherShiftRemainingSec: number;
  onFulfillPrivateOrder: (order: FishMarketOrder) => void;
  onDeclinePrivateOrder: (orderId: string) => void;
  onFulfillCommercialOrder: (order: FishMarketOrder) => void;
  onRerollCommercialOrder: (orderId: string) => void;
  onFulfillTownBounty: (bounty: TownBounty) => void;
  onBuyCivicInvestment: (investmentId: CivicInvestmentId) => void;
  onJoinClub: (clubId: ClubId) => void;
  onRenewSubscription?: () => void;
  onToggleAutoRenew?: () => void;
  onResignClub?: () => void;
}

type TownSubTab = 'contracts' | 'gazette' | 'civic' | 'clubs';
export const TownTab: React.FC<TownTabProps> = ({
  money,
  inventory,
  privateOrders,
  commercialOrders,
  townBounties,
  civicInvestments,
  clubState,
  currentAreaId,
  currentWeatherId,
  weatherShiftRemainingSec,
  onFulfillPrivateOrder,
  onDeclinePrivateOrder,
  onFulfillCommercialOrder,
  onRerollCommercialOrder,
  onFulfillTownBounty,
  onBuyCivicInvestment,
  onJoinClub,
  onRenewSubscription,
  onToggleAutoRenew,
  onResignClub,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<TownSubTab>('contracts');
  const [, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rumor = getCurrentWeatherRumor();
  const rumorSpecies = getRumorSpecies(rumor);
  const isRumorActiveNow = isWeatherRumorActive(rumor, currentAreaId, currentWeatherId);
  const rumorAreaDef = FISHING_AREAS.find((a) => a.id === rumor.areaId);
  const rumorWeatherDef = WEATHER_TYPES.find((w) => w.id === rumor.requiredWeather);
  const commodityTrends = getDailyCommodityTrends();

  const currentClub = ANGLER_CLUBS.find((c) => c.id === clubState.currentClubId) || null;
  const currentRep = currentClub ? clubState.reputationPoints[currentClub.id] || 0 : 0;
  const currentRankTitle = currentClub ? getClubRankTitle(currentRep) : 'Unenrolled';
  const currentRankBonus = currentClub ? getClubRankBonus(currentRep) : { percent: 0, label: 'Base Payouts' };
  const totalRep = Object.values(clubState.reputationPoints || {}).reduce((a, b) => a + b, 0);
  const isSubActive = currentClub ? isClubPerkActive(clubState, currentClub.id) : false;
  const subInfo = getSubscriptionTimeRemaining(clubState.subscriptionDueAt);

  // Count fish in Box
  const fishInBoxMap: Record<number, number> = {};
  inventory.forEach((f) => {
    fishInBoxMap[f.fishId] = (fishInBoxMap[f.fishId] || 0) + 1;
  });

  const totalContractsCount = privateOrders.length + commercialOrders.length + townBounties.length;

  return (
    <div className="border border-[#2a2d34] bg-[#181a1f] p-4 text-[#e3e6eb] space-y-4">
      {/* Top Header */}
      <div className="border-b border-[#292d36] pb-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#f1f3f5] text-sm tracking-wide">Harbor Town</span>
          <span className="text-[10px] px-1.5 py-0.2 border border-amber-600/70 bg-amber-950/50 text-amber-300 font-semibold">
            Docks & Exchange
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {currentClub ? (
            <div
              className={`px-2.5 py-1 border text-xs font-semibold ${
                isSubActive
                  ? 'border-sky-700/80 bg-sky-950/60 text-sky-200'
                  : 'border-amber-700/80 bg-amber-950/60 text-amber-300'
              }`}
            >
              {currentClub.name} · {currentRankTitle} ({currentRep} Rep) {currentRankBonus.percent > 0 ? `· ${currentRankBonus.label}` : ''} · {subInfo.label}
            </div>
          ) : (
            <div className="border border-[#2c303c] bg-[#14161c] px-2.5 py-1 text-[#8c94a2]">
              No Guild Active · {totalRep} Total Rep
            </div>
          )}
        </div>
      </div>

      {/* Town Sub-tabs */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 border-b border-[#262932] pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`py-2 px-3 min-h-[38px] flex items-center justify-center border font-bold cursor-pointer transition-colors touch-manipulation text-center ${
            activeSubTab === 'contracts'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Contracts · {totalContractsCount}
        </button>
        <button
          onClick={() => setActiveSubTab('gazette')}
          className={`py-2 px-3 min-h-[38px] flex items-center justify-center border font-bold cursor-pointer transition-colors touch-manipulation text-center ${
            activeSubTab === 'gazette'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Gazette {isRumorActiveNow && <span className="text-emerald-400 font-bold ml-1">• Active</span>}
        </button>
        <button
          onClick={() => setActiveSubTab('civic')}
          className={`py-2 px-3 min-h-[38px] flex items-center justify-center border font-bold cursor-pointer transition-colors touch-manipulation text-center ${
            activeSubTab === 'civic'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Civic ({civicInvestments.length}/{CIVIC_INVESTMENTS.length})
        </button>
        <button
          onClick={() => setActiveSubTab('clubs')}
          className={`py-2 px-3 min-h-[38px] flex items-center justify-center border font-bold cursor-pointer transition-colors touch-manipulation text-center ${
            activeSubTab === 'clubs'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Guilds
        </button>
      </div>

      {/* 1. CONTRACTS BOARD */}
      {activeSubTab === 'contracts' && (
        <div className="space-y-4 text-xs">
          {/* Private Collector Contracts */}
          <div className="border border-[#282b34] bg-[#14161c] p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#23262f] pb-1.5">
              <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                Private Collector Contracts
              </span>
              <span className="text-amber-400 font-bold text-[11px]">{privateOrders.length}/3 Open</span>
            </div>

            {privateOrders.length === 0 ? (
              <div className="p-3 border border-dashed border-[#282b34] bg-[#111317] text-center text-[#717885] text-xs">
                No open private contracts. Clients arrive periodically.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {privateOrders.map((order) => {
                  const held = fishInBoxMap[order.fishId] || 0;
                  const canFulfill = held >= order.requiredCount;
                  const isRare = order.category === 'luxury' || order.category === 'private';

                  return (
                    <div
                      key={order.id}
                      className={`p-2.5 border flex flex-col justify-between space-y-2 ${
                        isRare ? 'border-amber-600/70 bg-[#1c1810]' : 'border-[#292c36] bg-[#15171e]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${getRarityTextStyle(order.tier)}`}>
                            {order.fishName}
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 border uppercase ${getRarityBadgeStyle(order.tier)}`}>
                            {order.tier}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8c94a2]">{order.client} · {order.title}</div>
                      </div>

                      <div className="border-t border-[#23262f] pt-1.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8c94a2]">
                            Box: <strong className={canFulfill ? 'text-emerald-300' : 'text-amber-400'}>{held} / {order.requiredCount}</strong>
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400 text-xs">
                              ${order.rewardCash.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-sky-300 font-bold ml-1.5">
                              +{isRare ? 75 : 45} Rep
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={!canFulfill}
                            onClick={() => onFulfillPrivateOrder(order)}
                            className={`flex-1 py-1 font-bold border text-xs transition-colors ${
                              canFulfill
                                ? 'border-emerald-600 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 cursor-pointer'
                                : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                            }`}
                          >
                            Fulfill
                          </button>
                          <button
                            onClick={() => onDeclinePrivateOrder(order.id)}
                            className="px-2 py-1 border border-[#2a2d36] bg-[#121417] hover:border-rose-900 hover:text-rose-300 text-[#717885] font-bold text-xs cursor-pointer transition-colors"
                            title="Decline contract"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Commercial Wholesale Contracts */}
          <div className="border border-[#282b34] bg-[#14161c] p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#23262f] pb-1.5">
              <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                Commercial Wholesale Contracts
              </span>
              <span className="text-sky-400 font-bold text-[11px]">{commercialOrders.length}/3 Open</span>
            </div>

            {commercialOrders.length === 0 ? (
              <div className="p-3 border border-dashed border-[#282b34] bg-[#111317] text-center text-[#717885] text-xs">
                No open wholesale orders. Distributors post new shipments periodically.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {commercialOrders.map((order) => {
                  const held = fishInBoxMap[order.fishId] || 0;
                  const canFulfill = held >= order.requiredCount;

                  return (
                    <div
                      key={order.id}
                      className="p-2.5 border border-[#292c36] bg-[#15171e] flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${getRarityTextStyle(order.tier)}`}>
                            {order.fishName}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 border border-sky-800 bg-sky-950/40 text-sky-300 uppercase font-semibold">
                            Bulk
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8c94a2]">{order.client} · {order.title}</div>
                      </div>

                      <div className="border-t border-[#23262f] pt-1.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8c94a2]">
                            Box: <strong className={canFulfill ? 'text-emerald-300' : 'text-amber-400'}>{held} / {order.requiredCount}</strong>
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400 text-xs">
                              ${order.rewardCash.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-sky-300 font-bold ml-1.5">
                              +50 Rep
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={!canFulfill}
                            onClick={() => onFulfillCommercialOrder(order)}
                            className={`flex-1 py-1 font-bold border text-xs transition-colors ${
                              canFulfill
                                ? 'border-sky-600 bg-sky-950/70 hover:bg-sky-900 text-sky-200 cursor-pointer'
                                : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                            }`}
                          >
                            Fulfill
                          </button>
                          <button
                            onClick={() => onRerollCommercialOrder(order.id)}
                            className="px-2 py-1 border border-[#2a2d36] bg-[#121417] hover:border-amber-900 hover:text-amber-300 text-[#717885] font-bold text-xs cursor-pointer transition-colors"
                            title="Reroll contract"
                          >
                            Reroll
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Town Community Bounties */}
          <div className="border border-[#282b34] bg-[#14161c] p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#23262f] pb-1.5">
              <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                Town Bounties
              </span>
              <span className="text-emerald-400 font-bold text-[11px]">{townBounties.length} Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {townBounties.map((bounty) => {
                const held = fishInBoxMap[bounty.targetSpeciesId] || 0;
                const canFulfill = held >= bounty.requiredCount;

                return (
                  <div
                    key={bounty.id}
                    className="p-2.5 border border-[#292c36] bg-[#15171e] flex flex-col justify-between space-y-2"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#f1f3f5] text-xs">{bounty.title}</div>
                      <div className="text-[11px] text-amber-300/80 font-medium">{bounty.sponsor}</div>
                    </div>

                    <div className="border-t border-[#23262f] pt-1.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#8c94a2]">
                          {bounty.targetSpeciesName}: <strong className={canFulfill ? 'text-emerald-300' : 'text-amber-400'}>{held}/{bounty.requiredCount}</strong>
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400 text-xs">${bounty.rewardCash}</span>
                          <span className="text-[10px] text-sky-300 font-bold ml-1.5">+{bounty.rewardClubRep} Rep</span>
                        </div>
                      </div>

                      <button
                        disabled={!canFulfill}
                        onClick={() => onFulfillTownBounty(bounty)}
                        className={`w-full py-1 font-bold border text-xs transition-colors ${
                          canFulfill
                            ? 'border-emerald-600 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 cursor-pointer'
                            : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                        }`}
                      >
                        {canFulfill ? 'Deliver to Town Hall' : `Need ${bounty.requiredCount - held} More`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. DOCKSIDE GAZETTE & RUMORS */}
      {activeSubTab === 'gazette' && (
        <div className="space-y-3 text-xs">
          {/* Active Legendary Rumor Feature Card */}
          <div
            className={`border p-3.5 space-y-2.5 transition-colors ${
              isRumorActiveNow
                ? 'border-emerald-500 bg-[#122017]'
                : 'border-[#3b404d] bg-[#15181f]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282c36] pb-2">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  {rumor.source} · Dispatch
                </span>
                <div className="font-bold text-sm text-[#f1f3f5]">{rumor.headline}</div>
              </div>

              {isRumorActiveNow ? (
                <div className="border border-emerald-500 bg-emerald-950 px-2 py-0.5 text-emerald-200 font-bold text-xs animate-pulse">
                  Sighting Active in {rumorAreaDef?.name}!
                </div>
              ) : (
                <div className="border border-[#323642] bg-[#101216] px-2 py-0.5 text-[#8c94a2] text-xs">
                  Conditions: {rumorWeatherDef?.name} in {rumorAreaDef?.name}
                </div>
              )}
            </div>

            <p className="text-[#c0c5ce] leading-relaxed text-xs">{rumor.rumorText}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#252832] text-[11px]">
              <div>
                <span className="text-[#8c94a2]">Rare Lurker: </span>
                <strong className={`font-bold ${getRarityTextStyle(rumorSpecies.tier)}`}>
                  {rumorSpecies.name}
                </strong>
              </div>
              <div>
                <span className="text-[#8c94a2]">Habitat Area: </span>
                <strong className="text-[#f1f3f5]">{rumorAreaDef?.name}</strong>
              </div>
              <div>
                <span className="text-[#8c94a2]">Required Weather: </span>
                <strong className="text-amber-300">{rumorWeatherDef?.name}</strong>
              </div>
            </div>

            {isRumorActiveNow && (
              <div className="p-2 border border-emerald-700/60 bg-emerald-950/40 text-emerald-200 text-[11px]">
                Active bonus: +{Math.round((rumor.biteBonusMultiplier - 1) * 100)}% strike rate for {rumorSpecies.name} with adequate tackle in {rumorAreaDef?.name}!
              </div>
            )}
          </div>

          {/* Harbor Weather Station */}
          <div className="border border-[#282b34] bg-[#14161c] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#f1f3f5]">Harbor Weather:</span>
              {(() => {
                const curW = WEATHER_TYPES.find((w) => w.id === currentWeatherId);
                return (
                  <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                    {curW?.icon && (
                      <img
                        src={curW.icon}
                        alt={curW.name}
                        className="w-4 h-4 object-contain flex-shrink-0"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                    <span>{curW?.name}</span>
                  </span>
                );
              })()}
            </div>
            <div className="text-[#8c94a2] text-[11px]">
              Next Shift in: <span className="text-[#f1f3f5] font-mono font-bold">{Math.floor(weatherShiftRemainingSec / 60)}m {weatherShiftRemainingSec % 60}s</span>
            </div>
          </div>

          {/* Daily Commodity Market Trends */}
          <div className="border border-[#282b34] bg-[#14161c] p-3 space-y-2">
            <div className="border-b border-[#23262f] pb-1.5 text-xs flex items-center justify-between">
              <span className="font-bold text-[#f1f3f5]">Daily Harbor Commodity Trends</span>
              <span className="text-[11px] text-emerald-400 font-bold">Wholesale Value Premiums</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {commodityTrends.map((trend) => (
                <div
                  key={trend.fishId}
                  className="p-2.5 border border-[#262933] bg-[#16181f] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#f1f3f5]">{trend.speciesName}</span>
                    <span className="text-emerald-400 font-bold">+{trend.markupPercent}% Value</span>
                  </div>
                  <div className="text-[11px] text-[#717885]">{trend.marketReason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CIVIC INVESTMENTS */}
      {activeSubTab === 'civic' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CIVIC_INVESTMENTS.map((inv) => {
              const isFunded = civicInvestments.includes(inv.id);
              const canAfford = money >= inv.cost;

              return (
                <div
                  key={inv.id}
                  className={`p-3.5 border flex flex-col justify-between space-y-3 ${
                    isFunded
                      ? 'border-emerald-600/70 bg-[#121c15]'
                      : 'border-[#292c36] bg-[#15171e]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#f1f3f5] text-sm">{inv.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 border border-[#3b404d] text-[#8c94a2]">
                        {inv.sector}
                      </span>
                    </div>
                    <div className="text-emerald-300 font-bold text-xs">{inv.effect}</div>
                  </div>

                  <div className="border-t border-[#23262f] pt-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">
                      {isFunded ? 'Funded & Active' : `$${inv.cost.toLocaleString()}`}
                    </span>

                    {isFunded ? (
                      <span className="text-emerald-400 font-bold text-xs">Operational</span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyCivicInvestment(inv.id)}
                        className={`px-3 py-1.5 font-bold border text-xs transition-colors ${
                          canAfford
                            ? 'border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 cursor-pointer'
                            : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                        }`}
                      >
                        Fund Project
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. ANGLER CLUBS & GUILDS */}
      {activeSubTab === 'clubs' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ANGLER_CLUBS.map((club) => {
              const isMember = clubState.currentClubId === club.id;
              const rep = clubState.reputationPoints[club.id] || 0;
              const rank = getClubRankTitle(rep);
              const rankBonus = getClubRankBonus(rep);
              const nextRankInfo = getNextRankProgress(rep);
              const canAffordDues = money >= club.membershipDues;

              return (
                <div
                  key={club.id}
                  className={`p-3.5 border flex flex-col justify-between space-y-3 ${
                    isMember
                      ? isSubActive
                        ? 'border-sky-600/80 bg-[#111c26]'
                        : 'border-amber-700/80 bg-[#1f1a14]'
                      : 'border-[#292c36] bg-[#15171e]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#f1f3f5] text-sm">{club.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 border border-[#3b4150] bg-[#1a1d26] text-[#c2c9d6] font-semibold uppercase">
                          {club.tierName}
                        </span>
                      </div>
                      {isMember && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 border font-bold uppercase ${
                            isSubActive
                              ? 'border-sky-600 bg-sky-950 text-sky-200'
                              : 'border-amber-700 bg-amber-950 text-amber-300'
                          }`}
                        >
                          {isSubActive ? 'Enrolled' : 'Past Due'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-300/90 font-medium">{club.tagline}</div>
                    <div className="p-2 border border-sky-900/40 bg-[#0f141c] text-emerald-300 font-bold text-xs">
                      {club.primaryPerk}
                    </div>
                  </div>

                  <div className="border-t border-[#23262f] pt-2 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8c94a2]">
                        Rank: <strong className="text-[#f1f3f5]">{rank}</strong> · {rep} Rep
                      </span>
                      <span className="text-amber-300 font-bold">
                        ${club.membershipDues.toLocaleString()}/mo
                      </span>
                    </div>

                    {/* Rank Progress Bar & Contract Bonus */}
                    <div className="space-y-1 bg-[#101217] p-2 border border-[#23262f]">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#8c94a2]">Next: {nextRankInfo.nextRank}</span>
                        <span className="text-emerald-400 font-bold">{rankBonus.label}</span>
                      </div>
                      <div className="w-full bg-[#1b1e26] h-1.5 border border-[#2b303d] overflow-hidden">
                        <div
                          className="bg-sky-500 h-full transition-all duration-300"
                          style={{ width: `${nextRankInfo.pct}%` }}
                        />
                      </div>
                    </div>

                    {isMember ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] px-0.5">
                          <span className="text-[#8c94a2]">Subscription:</span>
                          <span className={isSubActive ? 'text-sky-300 font-bold' : 'text-amber-400 font-bold'}>
                            {subInfo.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isSubActive && onRenewSubscription && (
                            <button
                              disabled={!canAffordDues}
                              onClick={onRenewSubscription}
                              className={`flex-1 py-1 font-bold border text-xs transition-colors ${
                                canAffordDues
                                  ? 'border-emerald-600 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 cursor-pointer'
                                  : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                              }`}
                            >
                              Pay Dues · ${club.membershipDues}
                            </button>
                          )}

                          {onToggleAutoRenew && (
                            <button
                              onClick={onToggleAutoRenew}
                              className={`px-2 py-1 border text-xs font-semibold cursor-pointer transition-colors ${
                                clubState.autoRenew !== false
                                  ? 'border-sky-800 bg-sky-950/60 text-sky-300'
                                  : 'border-[#333742] bg-[#14161c] text-[#8c94a2]'
                              }`}
                              title="Toggle automatic monthly renewal"
                            >
                              Auto-Renew: {clubState.autoRenew !== false ? 'ON' : 'OFF'}
                            </button>
                          )}

                          {onResignClub && (
                            <button
                              onClick={onResignClub}
                              className="px-2 py-1 border border-[#2b2e38] bg-[#13151a] hover:border-rose-900 hover:text-rose-300 text-[#717885] text-xs font-semibold cursor-pointer transition-colors"
                              title="Resign guild membership"
                            >
                              Resign
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        disabled={!canAffordDues}
                        onClick={() => onJoinClub(club.id)}
                        className={`w-full py-1.5 font-bold border text-xs transition-colors ${
                          canAffordDues
                            ? 'border-sky-600 bg-sky-950 hover:bg-sky-900 text-sky-200 cursor-pointer'
                            : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                        }`}
                      >
                        {canAffordDues
                          ? `Subscribe · $${club.membershipDues}/mo`
                          : `Need $${club.membershipDues} Dues`}
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

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
import {
  RestaurantState,
  RESTAURANT_DISHES,
  RESTAURANT_EXPANSIONS,
  RESTAURANT_STAFF_CANDIDATES,
  getDailyWholesaleMarketFish,
  DinnerServiceResult,
  PREP_STYLES,
  findMatchingDishForFish,
  calculateDishSaleValue,
} from '../game/restaurantLogic';

interface TownTabProps {
  money: number;
  inventory: CaughtFish[];
  privateOrders: FishMarketOrder[];
  commercialOrders: FishMarketOrder[];
  townBounties: TownBounty[];
  civicInvestments: CivicInvestmentId[];
  clubState: ClubMemberState;
  restaurantState: RestaurantState;
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
  onStockFishToPantry: (speciesId: number, count?: number) => void;
  onStockAllFromBox: () => void;
  onUnstockFishFromPantry?: (speciesId: number, count?: number) => void;
  onUnstockAllToBox?: () => void;
  onBuyWholesaleFish: (speciesId: number, pricePerFish: number, count?: number) => void;
  onHireRestaurantStaff: (staffId: string) => void;
  onBuyRestaurantExpansion: (expansionId: string) => void;
  onRenameRestaurant: (name: string) => void;
  onRunDinnerService: (prepStyleId?: string, allowedDishIds?: string[]) => DinnerServiceResult | null;
  autoRushCountdownSec?: number;
  onToggleRestaurantAutomation?: (setting: 'autoDinnerRush' | 'autoRestockFromBox' | 'autoProcureWholesale') => void;
  onSelectPrepStyle?: (prepStyleId: string) => void;
}

type TownSubTab = 'contracts' | 'gazette' | 'civic' | 'clubs' | 'restaurant';
type RestaurantSubTab = 'kitchen' | 'pantry' | 'staff';

export const TownTab: React.FC<TownTabProps> = ({
  money,
  inventory,
  privateOrders,
  commercialOrders,
  townBounties,
  civicInvestments,
  clubState,
  restaurantState,
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
  onStockFishToPantry,
  onStockAllFromBox,
  onUnstockFishFromPantry,
  onUnstockAllToBox,
  onBuyWholesaleFish,
  onHireRestaurantStaff,
  onBuyRestaurantExpansion,
  onRenameRestaurant,
  onRunDinnerService,
  autoRushCountdownSec = 25,
  onToggleRestaurantAutomation,
  onSelectPrepStyle,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<TownSubTab>('contracts');
  const [restaurantSubTab, setRestaurantSubTab] = useState<RestaurantSubTab>('kitchen');
  const [selectedPrepStyleId, setSelectedPrepStyleId] = useState<string>('pan_fry');
  const [lastServiceResult, setLastServiceResult] = useState<DinnerServiceResult | null>(null);
  const [boxFilterQuery, setBoxFilterQuery] = useState<string>('');
  const [, setNowTick] = useState<number>(Date.now());
  const [isEditingRestaurantName, setIsEditingRestaurantName] = useState(false);
  const [tempRestaurantName, setTempRestaurantName] = useState(restaurantState.name);
  const [serviceFeedback, setServiceFeedback] = useState<string | null>(null);

  // Day/Night Restaurant Service Shift State
  const [isServiceRunning, setIsServiceRunning] = useState<boolean>(false);
  const [serviceProgress, setServiceProgress] = useState<number>(0);
  const [serviceClock, setServiceClock] = useState<string>('Doors Closed');
  const [servicePhase, setServicePhase] = useState<'morning' | 'afternoon' | 'sunset' | 'night' | 'closed'>('closed');
  const [serviceEvents, setServiceEvents] = useState<{ time: string; text: string }[]>([]);
  const serviceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (serviceTimerRef.current) clearInterval(serviceTimerRef.current);
    };
  }, []);

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
  const isSubActive = currentClub ? isClubPerkActive(clubState, currentClub.id) : false;
  const subInfo = getSubscriptionTimeRemaining(clubState.subscriptionDueAt);

  // Count fish in Box
  const fishInBoxMap: Record<number, number> = {};
  inventory.forEach((f) => {
    fishInBoxMap[f.fishId] = (fishInBoxMap[f.fishId] || 0) + 1;
  });

  const totalContractsCount = privateOrders.length + commercialOrders.length + townBounties.length;

  // Restaurant data
  const wholesaleFishList = useMemo(() => getDailyWholesaleMarketFish(), []);
  const pantryEntries = Object.entries(restaurantState.pantry).filter(([, count]) => count > 0);
  const totalPantryFishCount = pantryEntries.reduce((sum, [, count]) => sum + count, 0);

  const selectedPrepStyle =
    PREP_STYLES.find((p) => p.id === selectedPrepStyleId) || PREP_STYLES[0];

  const hasExtraTables = restaurantState.unlockedExpansionIds.includes('extra_tables');
  const baseTableCount = hasExtraTables ? 8 : 4;
  const maxTableCapacity = baseTableCount + selectedPrepStyle.bonusTableCapacity;

  const hiredStaffObjects = useMemo(() => {
    return RESTAURANT_STAFF_CANDIDATES.filter((c) =>
      restaurantState.hiredStaffIds.includes(c.id)
    );
  }, [restaurantState.hiredStaffIds]);

  const unlockedExpansionObjects = useMemo(() => {
    return RESTAURANT_EXPANSIONS.filter((e) =>
      restaurantState.unlockedExpansionIds.includes(e.id)
    );
  }, [restaurantState.unlockedExpansionIds]);

  const totalWagesPerService = hiredStaffObjects.reduce(
    (sum, s) => sum + s.wagePerService,
    0
  );

  // Distinct species in Box for stocking
  const boxSpeciesList = useMemo(() => {
    const ids = Array.from(new Set(inventory.map((f) => f.fishId)));
    return ids
      .map((id) => FISH_COLLECTION.find((f) => f.id === id))
      .filter((f): f is NonNullable<typeof f> => Boolean(f));
  }, [inventory]);

  const filteredBoxSpeciesList = useMemo(() => {
    if (!boxFilterQuery.trim()) return boxSpeciesList;
    const q = boxFilterQuery.toLowerCase().trim();
    return boxSpeciesList.filter((sp) => sp.name.toLowerCase().includes(q));
  }, [boxSpeciesList, boxFilterQuery]);

  // Dish readiness breakdown
  const dishReadiness = useMemo(() => {
    return RESTAURANT_DISHES.map((dish) => {
      let portionsReady = 0;
      for (const [idStr, count] of pantryEntries) {
        const sp = FISH_COLLECTION.find((f) => f.id === Number(idStr));
        if (!sp) continue;
        const matched = findMatchingDishForFish(sp);
        if (matched.id === dish.id) {
          portionsReady += count;
        }
      }

      let estimatedPrice = calculateDishSaleValue(
        dish,
        hiredStaffObjects,
        unlockedExpansionObjects
      );
      if (selectedPrepStyle.valueMultiplier !== 1.0) {
        estimatedPrice = Math.round(estimatedPrice * selectedPrepStyle.valueMultiplier);
      }

      return {
        dish,
        portionsReady,
        estimatedPrice,
      };
    });
  }, [pantryEntries, hiredStaffObjects, unlockedExpansionObjects, selectedPrepStyle]);

  const handleStartServiceShift = () => {
    if (isServiceRunning) return;
    if (totalPantryFishCount === 0) {
      setServiceFeedback('Pantry is empty. Stock fish into the kitchen pantry before opening.');
      return;
    }

    setIsServiceRunning(true);
    setServiceProgress(0);
    setServiceFeedback(null);
    setLastServiceResult(null);

    const shiftTimeline = [
      {
        progress: 15,
        clock: '9:00 AM · Morning Doors Open',
        phase: 'morning' as const,
        event: {
          time: '9:15 AM',
          text: 'Harbor bell tolls. Early fishermen and wharf pilots filter in for morning catch.',
        },
      },
      {
        progress: 40,
        clock: '12:30 PM · Midday Lunch Rush',
        phase: 'afternoon' as const,
        event: {
          time: '12:45 PM',
          text: 'Lunch bells ring. Merchant families and ferry travelers arrive and take tables.',
        },
      },
      {
        progress: 68,
        clock: '6:00 PM · Sunset Dinner Service',
        phase: 'sunset' as const,
        event: {
          time: '6:15 PM',
          text: 'Golden sunset over the bay. Waterfront patio lanterns light up as evening guests fill booths.',
        },
      },
      {
        progress: 88,
        clock: '8:45 PM · Nightcap & Late Orders',
        phase: 'night' as const,
        event: {
          time: '8:50 PM',
          text: 'Last dinner courses served. Cider glasses clink and diners leave generous tips.',
        },
      },
    ];

    let currentStep = 0;
    const totalSteps = 40; // 40 ticks * 200ms = 8 seconds total
    const spawnedEventIndexes = new Set<number>();

    setServiceEvents([
      {
        time: '8:30 AM',
        text: `Kitchen prep begins with ${selectedPrepStyle.name}. Pans seasoned and dining room polished.`,
      },
    ]);

    serviceTimerRef.current = setInterval(() => {
      currentStep += 1;
      const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setServiceProgress(pct);

      shiftTimeline.forEach((m, idx) => {
        if (pct >= m.progress && !spawnedEventIndexes.has(idx)) {
          spawnedEventIndexes.add(idx);
          setServiceClock(m.clock);
          setServicePhase(m.phase);
          setServiceEvents((prev) => [m.event, ...prev]);
        }
      });

      if (currentStep >= totalSteps) {
        if (serviceTimerRef.current) clearInterval(serviceTimerRef.current);
        serviceTimerRef.current = null;

        const result = onRunDinnerService(selectedPrepStyleId);
        setIsServiceRunning(false);
        setServicePhase('closed');
        setServiceClock('11:00 PM · Shift Concluded');

        if (!result || result.mealsServedCount === 0) {
          setServiceFeedback('No dishes could be served. Pantry stock was exhausted during service.');
          return;
        }

        setLastServiceResult(result);
        setServiceEvents((prev) => [
          {
            time: '11:00 PM',
            text: `Doors close for the night. Served ${result.mealsServedCount} tables. Net profit: +$${result.netProfit} deposited into till.`,
          },
          ...prev,
        ]);
        setServiceFeedback(
          `Day and night service shift complete: Served ${result.mealsServedCount} tables. Revenue $${result.revenue} + tips $${result.tips} · Net profit $${result.netProfit} after $${result.wagesPaid} staff wages.`
        );
      }
    }, 200);
  };

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
              {currentClub.name} · {currentRankTitle} · {currentRep} Rep · {subInfo.label}
            </div>
          ) : (
            <div className="border border-[#2c303c] bg-[#14161c] px-2.5 py-1 text-[#717885]">
              No Guild Active
            </div>
          )}
        </div>
      </div>

      {/* Town Sub-tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[#262932] pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('contracts')}
          className={`py-1.5 px-3 border font-bold cursor-pointer transition-colors ${
            activeSubTab === 'contracts'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Contracts · {totalContractsCount}
        </button>
        <button
          onClick={() => setActiveSubTab('gazette')}
          className={`py-1.5 px-3 border font-bold cursor-pointer transition-colors ${
            activeSubTab === 'gazette'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Gazette & Sighting {isRumorActiveNow && <span className="text-emerald-400 font-bold ml-1">• Active</span>}
        </button>
        <button
          onClick={() => setActiveSubTab('civic')}
          className={`py-1.5 px-3 border font-bold cursor-pointer transition-colors ${
            activeSubTab === 'civic'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Civic Works · {civicInvestments.length}/{CIVIC_INVESTMENTS.length}
        </button>
        <button
          onClick={() => setActiveSubTab('clubs')}
          className={`py-1.5 px-3 border font-bold cursor-pointer transition-colors ${
            activeSubTab === 'clubs'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Guilds
        </button>
        <button
          onClick={() => setActiveSubTab('restaurant')}
          className={`py-1.5 px-3 border font-bold cursor-pointer transition-colors ${
            activeSubTab === 'restaurant'
              ? 'border-amber-600 bg-amber-950/60 text-amber-200'
              : 'border-[#282b34] bg-[#14161c] text-[#7d8594] hover:text-[#c0c5ce]'
          }`}
        >
          Restaurant · {totalPantryFishCount} Stock
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
                          <span className="font-bold text-emerald-400 text-xs">
                            ${order.rewardCash.toLocaleString()}
                          </span>
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
                          <span className="font-bold text-emerald-400 text-xs">
                            ${order.rewardCash.toLocaleString()}
                          </span>
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
              <span className="text-amber-300 font-semibold">{WEATHER_TYPES.find((w) => w.id === currentWeatherId)?.name}</span>
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

      {/* 5. RESTAURANT SUBTAB */}
      {activeSubTab === 'restaurant' && (
        <div className="space-y-4 text-xs">
          {/* Restaurant Header & Status Banner */}
          <div className="border border-[#2d313c] bg-[#14161c] p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between border-b border-[#23262f] pb-2 gap-2">
              <div className="flex items-center gap-2">
                {isEditingRestaurantName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempRestaurantName}
                      onChange={(e) => setTempRestaurantName(e.target.value)}
                      className="px-2 py-0.5 border border-[#3b404d] bg-[#101215] text-[#f1f3f5] font-bold text-xs"
                      maxLength={30}
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (tempRestaurantName.trim()) {
                          onRenameRestaurant(tempRestaurantName.trim());
                        }
                        setIsEditingRestaurantName(false);
                      }}
                      className="px-2 py-0.5 border border-emerald-600 bg-emerald-950 text-emerald-300 font-bold text-[11px] cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingRestaurantName(false)}
                      className="px-2 py-0.5 border border-[#333742] bg-[#1c1e24] text-[#8c94a2] text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#f1f3f5] text-sm">{restaurantState.name}</span>
                    <button
                      onClick={() => {
                        setIsEditingRestaurantName(true);
                        setTempRestaurantName(restaurantState.name);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold border border-[#3b414f] bg-[#16181f] text-[#8c94a2] hover:text-[#f1f3f5] hover:border-[#5a6272] cursor-pointer inline-flex items-center transition-colors"
                    >
                      Rename
                    </button>
                  </div>
                )}
                <span className="text-[10px] px-1.5 py-0.2 border border-amber-600/70 bg-amber-950/50 text-amber-300 font-semibold">
                  Seafood Kitchen
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="text-[#8c94a2]">
                  Meals Served: <strong className="text-[#f1f3f5]">{restaurantState.totalMealsServed}</strong>
                </span>
                <span className="text-[#8c94a2]">
                  Total Revenue: <strong className="text-emerald-400">${restaurantState.totalEarnings.toLocaleString()}</strong>
                </span>
                <span className="text-[#8c94a2]">
                  Reputation: <strong className="text-sky-300">{restaurantState.reputation} Rep</strong>
                </span>
                <span className="text-[#8c94a2]">
                  Seating: <strong className="text-amber-300">{maxTableCapacity} Tables</strong>
                </span>
                <span className="text-[#8c94a2]">
                  Pantry Stock: <strong className="text-emerald-300">{totalPantryFishCount} Fish</strong>
                </span>
              </div>
            </div>

            {/* Restaurant Sub-Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRestaurantSubTab('kitchen')}
                  className={`px-3 py-1 font-bold border text-xs cursor-pointer transition-colors ${
                    restaurantSubTab === 'kitchen'
                      ? 'border-amber-600 bg-amber-950/70 text-amber-200'
                      : 'border-[#2d313c] bg-[#121418] text-[#8c94a2] hover:text-[#f1f3f5]'
                  }`}
                >
                  Kitchen & Service
                </button>
                <button
                  onClick={() => setRestaurantSubTab('pantry')}
                  className={`px-3 py-1 font-bold border text-xs cursor-pointer transition-colors ${
                    restaurantSubTab === 'pantry'
                      ? 'border-amber-600 bg-amber-950/70 text-amber-200'
                      : 'border-[#2d313c] bg-[#121418] text-[#8c94a2] hover:text-[#f1f3f5]'
                  }`}
                >
                  Pantry & Stocking · {totalPantryFishCount} Fish
                </button>
                <button
                  onClick={() => setRestaurantSubTab('staff')}
                  className={`px-3 py-1 font-bold border text-xs cursor-pointer transition-colors ${
                    restaurantSubTab === 'staff'
                      ? 'border-amber-600 bg-amber-950/70 text-amber-200'
                      : 'border-[#2d313c] bg-[#121418] text-[#8c94a2] hover:text-[#f1f3f5]'
                  }`}
                >
                  Staff & Expansions
                </button>
              </div>

              {restaurantSubTab !== 'kitchen' && (
                <button
                  onClick={() => {
                    setRestaurantSubTab('kitchen');
                  }}
                  className={`px-3 py-1 font-bold border text-xs transition-colors ${
                    totalPantryFishCount > 0
                      ? 'border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 cursor-pointer'
                      : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-pointer'
                  }`}
                >
                  {totalPantryFishCount > 0 ? 'Go to Service Station' : 'Stock Fish in Kitchen'}
                </button>
              )}
            </div>

            {serviceFeedback && (
              <div className="p-2 border border-emerald-700/60 bg-emerald-950/40 text-emerald-200 text-xs">
                {serviceFeedback}
              </div>
            )}
          </div>

          {/* VIEW A: KITCHEN & DINNER SERVICE */}
          {restaurantSubTab === 'kitchen' && (
            <div className="space-y-4">
              {/* Step 1: Prep Style Selector Station */}
              <div className="border border-[#282b34] bg-[#14161c] p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#23262f] pb-1.5">
                  <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                    Step 1 · Choose Culinary Prep Style
                  </span>
                  <span className="text-amber-400 font-semibold text-[11px]">
                    Active: {selectedPrepStyle.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {PREP_STYLES.map((style) => {
                    const isSelected = style.id === selectedPrepStyleId;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setSelectedPrepStyleId(style.id)}
                        className={`p-2.5 border cursor-pointer transition-all flex flex-col justify-between space-y-1.5 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/60'
                            : 'border-[#282b34] bg-[#111317] hover:border-[#3d424f]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#f1f3f5] text-xs">{style.name}</span>
                            {isSelected && (
                              <span className="text-[9px] px-1 py-0.2 border border-amber-500 bg-amber-900/60 text-amber-200 font-bold uppercase">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-300 font-medium mt-0.5">
                            {style.tagline}
                          </div>
                          <div className="text-[10px] text-[#8c94a2] mt-1 leading-normal">
                            {style.description}
                          </div>
                        </div>

                        <div className="pt-1 border-t border-[#23262f] flex flex-wrap gap-1 text-[10px]">
                          {style.valueMultiplier !== 1.0 && (
                            <span className="text-emerald-300 font-bold">
                              +{Math.round((style.valueMultiplier - 1) * 100)}% Price
                            </span>
                          )}
                          {style.tipMultiplier !== 1.0 && (
                            <span className="text-sky-300 font-bold">
                              +{Math.round((style.tipMultiplier - 1) * 100)}% Tips
                            </span>
                          )}
                          {style.bonusTableCapacity > 0 && (
                            <span className="text-amber-300 font-bold">
                              +{style.bonusTableCapacity} Tables
                            </span>
                          )}
                          {style.valueMultiplier === 1.0 &&
                            style.tipMultiplier === 1.0 &&
                            style.bonusTableCapacity === 0 && (
                              <span className="text-[#717885]">Balanced Base Cooking</span>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Recipe Readiness & Pantry Portion Matrix */}
              <div className="border border-[#282b34] bg-[#14161c] p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#23262f] pb-1.5">
                  <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                    Step 2 · Dinner Menu Recipes & Pantry Stock
                  </span>
                  <span className="text-emerald-400 font-semibold text-[11px]">
                    {pantryEntries.length} Species in Pantry · {totalPantryFishCount} Total Portions
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {dishReadiness.map(({ dish, portionsReady, estimatedPrice }) => {
                    const isReady = portionsReady > 0;
                    return (
                      <div
                        key={dish.id}
                        className={`p-2.5 border flex flex-col justify-between space-y-1.5 ${
                          isReady ? 'border-[#333a4a] bg-[#13161e]' : 'border-[#22252c] bg-[#101114]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#f1f3f5] text-xs">{dish.name}</span>
                            <span className="text-emerald-400 font-bold text-xs">${estimatedPrice}</span>
                          </div>
                          <div className="text-[10px] text-[#8c94a2] leading-tight">
                            {dish.description}
                          </div>
                          <div className="text-[10px] text-[#717885]">
                            Ingredients: {dish.requiredSpeciesKeywords.join(', ')}
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-[#23262f] flex items-center justify-between text-[11px]">
                          <span className="text-[#8c94a2]">Ready to Plate:</span>
                          <span
                            className={`font-bold px-1.5 py-0.2 border text-[10px] ${
                              isReady
                                ? 'border-emerald-600 bg-emerald-950/60 text-emerald-300'
                                : 'border-[#292c34] bg-[#14151a] text-[#555a64]'
                            }`}
                          >
                            {isReady ? `${portionsReady} Portions` : 'Missing Stock'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Service Rush Station Bar */}
              <div className="border border-[#2d323f] bg-[#151821] p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262b37] pb-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                      Step 3 · Open Dining Room for Day & Night Service
                    </span>
                    <div className="text-[11px] text-[#8c94a2]">
                      Prepared with <strong className="text-amber-300">{selectedPrepStyle.name}</strong> · Seats up to <strong className="text-[#f1f3f5]">{maxTableCapacity} guest tables</strong>.
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#8c94a2]">
                      Staff Wages Due: <strong className="text-amber-400">${totalWagesPerService}</strong>
                    </span>
                    <button
                      disabled={totalPantryFishCount === 0 || isServiceRunning}
                      onClick={handleStartServiceShift}
                      className={`px-4 py-2 font-bold border text-xs transition-colors ${
                        isServiceRunning
                          ? 'border-amber-600/80 bg-amber-950/60 text-amber-300 cursor-wait animate-pulse'
                          : totalPantryFishCount > 0
                          ? 'border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 cursor-pointer shadow-sm'
                          : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                      }`}
                    >
                      {isServiceRunning
                        ? `Service Shift Active · ${serviceProgress}%`
                        : totalPantryFishCount > 0
                        ? `Start Day & Night Service · ${selectedPrepStyle.name}`
                        : 'Pantry Empty · Stock Fish to Open'}
                    </button>
                  </div>
                </div>

                {/* Day/Night Shift Simulation Progress & Live Patrons */}
                {isServiceRunning && (
                  <div className="p-3 border border-[#3b4356] bg-[#11141c] space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 border font-bold text-[10px] uppercase tracking-wider ${
                            servicePhase === 'morning'
                              ? 'border-amber-500 bg-amber-950/80 text-amber-300'
                              : servicePhase === 'afternoon'
                              ? 'border-yellow-500 bg-yellow-950/80 text-yellow-200'
                              : servicePhase === 'sunset'
                              ? 'border-orange-500 bg-orange-950/80 text-orange-200'
                              : 'border-indigo-500 bg-indigo-950/80 text-indigo-200'
                          }`}
                        >
                          {servicePhase}
                        </span>
                        <span className="font-bold text-[#f1f3f5]">{serviceClock}</span>
                      </div>
                      <span className="text-[#8c94a2] text-[11px]">
                        Shift Progress: <strong className="text-emerald-400">{serviceProgress}%</strong>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#1b202c] border border-[#2b3345] h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500 transition-all duration-200"
                        style={{ width: `${serviceProgress}%` }}
                      />
                    </div>

                    {/* Live Diner Walk-in / Table Activity Log */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold text-[#8c94a2] uppercase tracking-wider">
                        Dining Room & Patio Activity
                      </span>
                      <div className="p-2 border border-[#232938] bg-[#0c0f16] space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
                        {serviceEvents.map((evt, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[#c2c8d4]">
                            <span className="text-amber-400 font-bold shrink-0">[{evt.time}]</span>
                            <span className="leading-snug">{evt.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Live Ticket Rail & Nightly Ledger */}
                {lastServiceResult && lastServiceResult.tickets.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    {/* Financial Summary Card */}
                    <div className="p-3 border border-emerald-600/70 bg-[#0e1c14] space-y-2">
                      <div className="flex flex-wrap items-center justify-between border-b border-emerald-900/60 pb-1.5 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                            Nightly Dinner Ledger
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 border border-emerald-500 bg-emerald-950 text-emerald-300 font-bold">
                            {lastServiceResult.serviceRating}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-emerald-300">
                          Net Profit: +${lastServiceResult.netProfit} Deposited
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                        <div>
                          <span className="text-[#8c94a2]">Tables Served:</span>
                          <div className="font-bold text-[#f1f3f5]">{lastServiceResult.mealsServedCount} Tables</div>
                        </div>
                        <div>
                          <span className="text-[#8c94a2]">Meal Revenue:</span>
                          <div className="font-bold text-emerald-400">${lastServiceResult.revenue}</div>
                        </div>
                        <div>
                          <span className="text-[#8c94a2]">Diner Tips:</span>
                          <div className="font-bold text-sky-400">+${lastServiceResult.tips}</div>
                        </div>
                        <div>
                          <span className="text-[#8c94a2]">Staff Wages:</span>
                          <div className="font-bold text-amber-400">-${lastServiceResult.wagesPaid}</div>
                        </div>
                        <div>
                          <span className="text-[#8c94a2]">Prep Style:</span>
                          <div className="font-bold text-[#f1f3f5] truncate">{lastServiceResult.prepStyleName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Rail */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-[#8c94a2]">
                        <span className="font-bold uppercase tracking-wider">Ticket Rail · Table Orders</span>
                        <span>{lastServiceResult.tickets.length} Dinner Receipts</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {lastServiceResult.tickets.map((t) => (
                          <div
                            key={t.tableNumber}
                            className="p-2 border border-[#2d323f] bg-[#111318] space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#f1f3f5]">
                                Table {t.tableNumber} · {t.dishName}
                              </span>
                              <span className="font-bold text-emerald-400 text-xs">
                                ${t.price + t.tip}
                              </span>
                            </div>

                            <div className="text-[10px] text-[#8c94a2] flex items-center justify-between">
                              <span>Cut: <strong className="text-[#f1f3f5]">{t.fishName}</strong></span>
                              <span className="text-sky-300">Tip: ${t.tip}</span>
                            </div>

                            <div className="text-[10px] text-amber-300/90 italic pt-0.5 border-t border-[#20232b]">
                              "{t.dinerComment}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW B: PANTRY & FISH STOCKING (Spacious, Clear Names, No Parentheses Clutter) */}
          {restaurantSubTab === 'pantry' && (
            <div className="space-y-4">
              {/* Top Quick Actions Bar */}
              <div className="border border-[#282b34] bg-[#14161c] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[#8c94a2]">Box Fish: </span>
                    <strong className="text-[#f1f3f5]">{inventory.length}</strong>
                  </div>
                  <div>
                    <span className="text-[#8c94a2]">Pantry Stocked: </span>
                    <strong className="text-emerald-300">{totalPantryFishCount}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {inventory.length > 0 && (
                    <button
                      onClick={onStockAllFromBox}
                      className="px-3 py-1 font-bold border border-sky-600 bg-sky-950/70 hover:bg-sky-900 text-sky-200 cursor-pointer text-xs"
                    >
                      Stock All from Box · {inventory.length} Fish
                    </button>
                  )}
                  {totalPantryFishCount > 0 && onUnstockAllToBox && (
                    <button
                      onClick={onUnstockAllToBox}
                      className="px-3 py-1 font-semibold border border-[#383d4a] bg-[#16181f] hover:border-amber-700 hover:text-amber-200 text-[#8c94a2] cursor-pointer text-xs"
                    >
                      Return All to Box · {totalPantryFishCount} Fish
                    </button>
                  )}
                </div>
              </div>

              {/* Box Inventory Transfer List (Readable, Spacious, No Truncation) */}
              <div className="border border-[#282b34] bg-[#14161c] p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between border-b border-[#23262f] pb-2 gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                      Transfer Catches from Tackle Box
                    </span>
                    <div className="text-[11px] text-[#8c94a2]">
                      Transfer fresh caught fish from your Box inventory into the kitchen pantry to prepare dinner dishes.
                    </div>
                  </div>

                  {boxSpeciesList.length > 4 && (
                    <input
                      type="text"
                      placeholder="Filter fish in box..."
                      value={boxFilterQuery}
                      onChange={(e) => setBoxFilterQuery(e.target.value)}
                      className="px-2.5 py-1 border border-[#343844] bg-[#101215] text-[#f1f3f5] text-xs focus:outline-none focus:border-amber-500 w-48"
                    />
                  )}
                </div>

                {boxSpeciesList.length === 0 ? (
                  <div className="p-6 border border-dashed border-[#282b34] bg-[#111317] text-center text-[#717885] text-xs space-y-1">
                    <p className="font-medium text-[#8c94a2]">Your Box is currently empty of fish.</p>
                    <p className="text-[11px]">Catch more fish with your rod or fleet, or purchase bulk fish from the harbor wholesale market below.</p>
                  </div>
                ) : filteredBoxSpeciesList.length === 0 ? (
                  <div className="p-4 border border-[#23262f] bg-[#111317] text-center text-[#717885] text-xs">
                    No species match "{boxFilterQuery}".
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {filteredBoxSpeciesList.map((sp) => {
                      const heldInBox = fishInBoxMap[sp.id] || 0;
                      const currentlyInPantry = restaurantState.pantry[sp.id] || 0;
                      const matchedDish = findMatchingDishForFish(sp);

                      return (
                        <div
                          key={sp.id}
                          className="p-2.5 border border-[#262933] bg-[#121419] flex flex-wrap items-center justify-between gap-2"
                        >
                          {/* Fish Details - Full Name, No Truncation */}
                          <div className="space-y-0.5 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold text-xs ${getRarityTextStyle(sp.tier)}`}>
                                {sp.name}
                              </span>
                              <span
                                className={`text-[9px] px-1 py-0.2 border uppercase ${getRarityBadgeStyle(
                                  sp.tier
                                )}`}
                              >
                                {sp.tier}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8c94a2]">
                              Prepares: <strong className="text-amber-300">{matchedDish.name}</strong> · Base ${matchedDish.basePrice}
                            </div>
                          </div>

                          {/* Inventory Status Counts */}
                          <div className="flex items-center gap-4 text-xs">
                            <div className="text-center">
                              <div className="text-[10px] text-[#717885] uppercase">In Box</div>
                              <div className="font-bold text-emerald-400">{heldInBox}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] text-[#717885] uppercase">In Pantry</div>
                              <div className="font-bold text-amber-300">{currentlyInPantry}</div>
                            </div>
                          </div>

                          {/* Transfer Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onStockFishToPantry(sp.id, 1)}
                              className="px-2.5 py-1 text-xs font-bold border border-emerald-600 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 cursor-pointer transition-colors"
                            >
                              +1 Stock
                            </button>

                            {heldInBox >= 2 && (
                              <button
                                onClick={() => onStockFishToPantry(sp.id, Math.min(5, heldInBox))}
                                className="px-2.5 py-1 text-xs font-bold border border-sky-600 bg-sky-950/70 hover:bg-sky-900 text-sky-200 cursor-pointer transition-colors"
                              >
                                +{Math.min(5, heldInBox)} Stock
                              </button>
                            )}

                            <button
                              onClick={() => onStockFishToPantry(sp.id, heldInBox)}
                              className="px-2.5 py-1 text-xs font-bold border border-[#3b404d] bg-[#181a20] hover:border-emerald-600 text-[#c0c5ce] cursor-pointer transition-colors"
                            >
                              Stock All · {heldInBox}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Kitchen Pantry Stocked Catches (Allows Returning to Box) */}
              <div className="border border-[#282b34] bg-[#14161c] p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-[#23262f] pb-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                      Current Kitchen Pantry Stock
                    </span>
                    <div className="text-[11px] text-[#8c94a2]">
                      Ingredients currently ready for tonight's dinner service rush.
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">
                    {totalPantryFishCount} Total Stocked
                  </span>
                </div>

                {pantryEntries.length === 0 ? (
                  <div className="p-4 border border-dashed border-[#262932] text-center text-[#717885] text-xs">
                    Pantry is currently empty. Transfer fish from your Box above or buy wholesale below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pantryEntries.map(([speciesIdStr, count]) => {
                      const spId = Number(speciesIdStr);
                      const sp = FISH_COLLECTION.find((f) => f.id === spId);
                      if (!sp) return null;
                      const matched = findMatchingDishForFish(sp);

                      return (
                        <div
                          key={speciesIdStr}
                          className="p-2.5 border border-[#2b2f3a] bg-[#111318] flex items-center justify-between text-xs gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${getRarityTextStyle(sp.tier)}`}>
                                {sp.name}
                              </span>
                              <span className="text-amber-300 font-bold ml-1">{count}x</span>
                            </div>
                            <div className="text-[10px] text-[#8c94a2]">
                              Prepares: {matched.name}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {onUnstockFishFromPantry && (
                              <button
                                onClick={() => onUnstockFishFromPantry(spId, 1)}
                                className="px-2 py-0.5 border border-[#3b404f] bg-[#181a22] hover:border-amber-600 text-[#8c94a2] hover:text-amber-200 text-[10px] font-semibold cursor-pointer"
                                title="Return 1 fish back to your Box"
                              >
                                -1 Return
                              </button>
                            )}
                            {onUnstockFishFromPantry && count > 1 && (
                              <button
                                onClick={() => onUnstockFishFromPantry(spId, count)}
                                className="px-2 py-0.5 border border-[#3b404f] bg-[#181a22] hover:border-amber-600 text-[#8c94a2] hover:text-amber-200 text-[10px] font-semibold cursor-pointer"
                                title="Return all of this fish back to your Box"
                              >
                                Return All
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Wholesale Fish Market (Purchasing fish directly for kitchen) */}
              <div className="border border-[#282b34] bg-[#14161c] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#23262f] pb-1.5">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                      Dockside Wholesale Market
                    </span>
                    <div className="text-[11px] text-[#8c94a2]">
                      Buy fresh catches directly from local harbor fishermen when your Box is empty.
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold">Daily Sourcing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {wholesaleFishList.map((wf) => {
                    const canAfford1 = money >= wf.pricePerFish;
                    const canAfford5 = money >= wf.pricePerFish * 5;

                    return (
                      <div
                        key={wf.speciesId}
                        className="p-2.5 border border-[#262933] bg-[#111317] flex flex-col justify-between space-y-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#f1f3f5]">{wf.name}</span>
                            <span className={`text-[9px] px-1 py-0.2 border uppercase ${getRarityBadgeStyle(wf.tier)}`}>
                              {wf.tier}
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
                            ${wf.pricePerFish} each
                          </div>
                        </div>

                        <div className="flex items-center gap-1 pt-1 border-t border-[#23262f]">
                          <button
                            disabled={!canAfford1}
                            onClick={() => onBuyWholesaleFish(wf.speciesId, wf.pricePerFish, 1)}
                            className={`flex-1 py-1 text-[10px] font-bold border transition-colors ${
                              canAfford1
                                ? 'border-emerald-600 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 cursor-pointer'
                                : 'border-[#262830] bg-[#121417] text-[#555a64] cursor-not-allowed'
                            }`}
                          >
                            Buy 1x · ${wf.pricePerFish}
                          </button>
                          <button
                            disabled={!canAfford5}
                            onClick={() => onBuyWholesaleFish(wf.speciesId, wf.pricePerFish, 5)}
                            className={`flex-1 py-1 text-[10px] font-bold border transition-colors ${
                              canAfford5
                                ? 'border-sky-600 bg-sky-950/60 hover:bg-sky-900 text-sky-200 cursor-pointer'
                                : 'border-[#262830] bg-[#121417] text-[#555a64] cursor-not-allowed'
                            }`}
                          >
                            Buy 5x · ${wf.pricePerFish * 5}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW C: RESTAURANT STAFF & EXPANSIONS */}
          {restaurantSubTab === 'staff' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Kitchen & Floor Staff */}
                <div className="border border-[#282b34] bg-[#14161c] p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#23262f] pb-1.5">
                    <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                      Kitchen & Floor Staff · {restaurantState.hiredStaffIds.length} Hired
                    </span>
                    <span className="text-[11px] text-[#8c94a2]">
                      Total Wages: ${totalWagesPerService}/service
                    </span>
                  </div>

                  <div className="space-y-2">
                    {RESTAURANT_STAFF_CANDIDATES.map((cand) => {
                      const isHired = restaurantState.hiredStaffIds.includes(cand.id);

                      return (
                        <div
                          key={cand.id}
                          className={`p-2.5 border flex flex-col justify-between space-y-1.5 ${
                            isHired ? 'border-sky-700/70 bg-[#101923]' : 'border-[#262933] bg-[#111317]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#f1f3f5]">{cand.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 border border-sky-800 bg-sky-950/50 text-sky-300 font-semibold">
                              {cand.roleTitle} · ${cand.wagePerService}/service
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-300">{cand.perkDescription}</div>

                          <div className="flex items-center justify-between border-t border-[#23262f] pt-1 text-[11px]">
                            <span className="text-[#717885] italic">{cand.bio}</span>
                            {isHired ? (
                              <span className="text-sky-300 font-bold text-[10px]">On Staff</span>
                            ) : (
                              <button
                                onClick={() => onHireRestaurantStaff(cand.id)}
                                className="px-2.5 py-0.5 border border-emerald-600 bg-emerald-950 text-emerald-200 font-bold text-[10px] cursor-pointer hover:bg-emerald-900"
                              >
                                Hire Staff
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Restaurant Expansions */}
                <div className="border border-[#282b34] bg-[#14161c] p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#23262f] pb-1.5">
                    <span className="font-bold text-[#f1f3f5] text-xs uppercase tracking-wider">
                      Dining Expansions · {restaurantState.unlockedExpansionIds.length}/{RESTAURANT_EXPANSIONS.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {RESTAURANT_EXPANSIONS.map((exp) => {
                      const isOwned = restaurantState.unlockedExpansionIds.includes(exp.id);
                      const canAfford = money >= exp.cost;

                      return (
                        <div
                          key={exp.id}
                          className={`p-2.5 border flex flex-col justify-between space-y-1.5 ${
                            isOwned ? 'border-emerald-700/70 bg-[#101b13]' : 'border-[#262933] bg-[#111317]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#f1f3f5]">{exp.name}</span>
                            <span className="font-bold text-amber-300 text-xs">
                              {isOwned ? 'Built' : `$${exp.cost.toLocaleString()}`}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-300 font-semibold">{exp.effect}</div>

                          <div className="flex items-center justify-between border-t border-[#23262f] pt-1 text-[11px]">
                            <span className="text-[#717885]">{exp.description}</span>
                            {isOwned ? (
                              <span className="text-emerald-400 font-bold text-[10px]">Active</span>
                            ) : (
                              <button
                                disabled={!canAfford}
                                onClick={() => onBuyRestaurantExpansion(exp.id)}
                                className={`px-2.5 py-0.5 font-bold border text-[10px] transition-colors ${
                                  canAfford
                                    ? 'border-emerald-600 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 cursor-pointer'
                                    : 'border-[#282a32] bg-[#121417] text-[#555a64] cursor-not-allowed'
                                }`}
                              >
                                Build
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RODS,
  REELS,
  LURES,
  FISHING_AREAS,
  FishingAreaDef,
  Rod,
  Reel,
  Lure,
  CaughtFish,
  JunkItem,
  CatalogEntry,
  rollWaitTime,
  rollHookedEncounter,
  HookedEncounter,
  FISH_COLLECTION,
  AreaId,
  ActiveTrap,
  calculateTrapCatch,
  TRAP_TYPES,
  TRAP_BAITS,
  TRAP_SLOT_PRICES,
  getFishTrapBaitMultiplier,
  WeatherId,
  WeatherDef,
  WEATHER_TYPES,
  FishMarketOrder,
  generateMarketOrders,
  generateCommercialOrders,
  createPrivateOrder,
  createCommercialOrder,
  createNewOrder,
  getPlayerFishingRank,
  getFishTrapBaitProfile,
  getRodSpriteUrl,
  getReelSpriteUrl,
  getLureSpriteUrl,
  getAreaBannerUrl,
  getWaitSpeedLabel,
} from './game/fishingLogic';
import { soundManager } from './game/audioLogic';
import { preloadGameAssets } from './game/preloadAssets';
import { SettingsModal } from './components/SettingsModal';
import { FishingArea, CastState } from './components/FishingArea';
import { AreasTab } from './components/AreasTab';
import { TrapsTab } from './components/TrapsTab';
import { Shop } from './components/Shop';
import { Inventory } from './components/Inventory';
import { Guide } from './components/Guide';
import { CommercialTab } from './components/CommercialTab';
import { HatcheryTab } from './components/HatcheryTab';
import { TownTab } from './components/TownTab';
import {
  HatcheryTank,
  TankId,
  FeedType,
  HatcheryUpgradeId,
  INITIAL_HATCHERY_TANKS,
  HATCHERY_UPGRADES,
  FEED_OPTIONS,
  MUTATION_DETAILS,
  calculateBreedingDuration,
  calculateClutchYield,
  calculateTrophyCount,
  calculateBatchValue,
  calculateBaitYield,
  rollClutchMutations,
  getHatcheryBaitMaxCapacity,
  getHatcheryTankMaxCapacity,
} from './game/hatcheryLogic';
import {
  CivicInvestmentId,
  ClubId,
  ClubMemberState,
  TownBounty,
  CIVIC_INVESTMENTS,
  ANGLER_CLUBS,
  generateTownBounties,
  isClubPerkActive,
  GUILD_SUBSCRIPTION_CYCLE_MS,
} from './game/townLogic';
import {
  getCurrentWeatherRumor,
  isWeatherRumorActive,
  getRumorSpecies,
} from './game/weatherRumorLogic';
import {
  RestaurantState,
  RESTAURANT_EXPANSIONS,
  RESTAURANT_STAFF_CANDIDATES,
  runDinnerService,
  DinnerServiceResult,
} from './game/restaurantLogic';
import {
  OwnedBoat,
  CrewMember,
  FleetUpgrade,
  SearchFocus,
  CommercialBaitId,
  CommercialStats,
  calculateVoyageDuration,
  calculateExpeditionWageCost,
  calculateExpeditionHaul,
  BOATS_CATALOG,
  HIREABLE_CREW,
  FLEET_UPGRADES,
  BoatDefinition,
  COMMERCIAL_BAITS,
  generateJobSeekers,
} from './game/commercialLogic';

const STORAGE_KEY = 'cozy_reel_save_v10';

type Tab =
  | 'fish'
  | 'inventory'
  | 'shop'
  | 'traps'
  | 'hatchery'
  | 'fleet'
  | 'town'
  | 'areas'
  | 'guide';

const DEFAULT_TRAPS: ActiveTrap[] = [
  {
    slotIndex: 0,
    trapTypeId: 'wire_minnow_trap',
    areaId: 'pond',
    placedAt: Date.now() - 30000,
    baitId: 'no_bait',
    lastCheckedAt: Date.now(),
  },
  {
    slotIndex: 1,
    trapTypeId: 'wire_minnow_trap',
    areaId: 'river',
    placedAt: Date.now(),
    baitId: 'no_bait',
    lastCheckedAt: Date.now(),
  },
  {
    slotIndex: 2,
    trapTypeId: 'wire_minnow_trap',
    areaId: 'lake',
    placedAt: Date.now(),
    baitId: 'no_bait',
    lastCheckedAt: Date.now(),
  },
  {
    slotIndex: 3,
    trapTypeId: 'wire_minnow_trap',
    areaId: 'ocean',
    placedAt: Date.now(),
    baitId: 'no_bait',
    lastCheckedAt: Date.now(),
  },
];

export default function App() {
  const [money, setMoney] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).money ?? 0;
    } catch {}
    return 0;
  });

  const [unlockedAreaIds, setUnlockedAreaIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Array.isArray(JSON.parse(saved).unlockedAreaIds)) {
        return JSON.parse(saved).unlockedAreaIds;
      }
    } catch {}
    return ['pond'];
  });

  const [selectedAreaId, setSelectedAreaId] = useState<AreaId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).selectedAreaId) {
        return JSON.parse(saved).selectedAreaId;
      }
    } catch {}
    return 'pond';
  });

  const [ownedRodIds, setOwnedRodIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).ownedRodIds ?? ['stick'];
    } catch {}
    return ['stick'];
  });

  const [ownedReelIds, setOwnedReelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).ownedReelIds ?? ['plastic_spool'];
    } catch {}
    return ['plastic_spool'];
  });

  const [ownedLureIds, setOwnedLureIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).ownedLureIds ?? ['none'];
    } catch {}
    return ['none'];
  });

  const [equippedRodId, setEquippedRodId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).equippedRodId ?? 'stick';
    } catch {}
    return 'stick';
  });

  const [equippedReelId, setEquippedReelId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).equippedReelId ?? 'plastic_spool';
    } catch {}
    return 'plastic_spool';
  });

  const [equippedLureId, setEquippedLureId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).equippedLureId ?? 'none';
    } catch {}
    return 'none';
  });

  const [inventory, setInventory] = useState<CaughtFish[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).inventory ?? [];
    } catch {}
    return [];
  });

  const [catalog, setCatalog] = useState<Record<number, CatalogEntry>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).catalog ?? {};
    } catch {}
    return {};
  });

  // Trapping state
  const [unlockedTrapSlots, setUnlockedTrapSlots] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof JSON.parse(saved).unlockedTrapSlots === 'number') {
        return JSON.parse(saved).unlockedTrapSlots;
      }
    } catch {}
    return 0; // Don't start with a trap; must buy first trap for $100
  });

  const [traps, setTraps] = useState<ActiveTrap[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Array.isArray(JSON.parse(saved).traps)) {
        return JSON.parse(saved).traps;
      }
    } catch {}
    return DEFAULT_TRAPS;
  });

  const [weatherId, setWeatherId] = useState<WeatherId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).weatherId) return JSON.parse(saved).weatherId;
    } catch {}
    return 'clear';
  });

  const [privateOrders, setPrivateOrders] = useState<FishMarketOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.privateOrders) && parsed.privateOrders.length > 0) {
          return parsed.privateOrders;
        }
        if (Array.isArray(parsed.marketOrders) && parsed.marketOrders.length > 0) {
          const priv = parsed.marketOrders.filter((o: FishMarketOrder) => !o.isCommercialBulk);
          if (priv.length > 0) return priv;
        }
      }
    } catch {}
    return generateMarketOrders(unlockedAreaIds, 3);
  });

  const [commercialOrders, setCommercialOrders] = useState<FishMarketOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.commercialOrders) && parsed.commercialOrders.length > 0) {
          return parsed.commercialOrders;
        }
        if (Array.isArray(parsed.marketOrders) && parsed.marketOrders.length > 0) {
          const comm = parsed.marketOrders.filter((o: FishMarketOrder) => o.isCommercialBulk);
          if (comm.length > 0) return comm;
        }
      }
    } catch {}
    return generateCommercialOrders(unlockedAreaIds, 4, 1);
  });

  const marketOrders = [...privateOrders, ...commercialOrders];

  // Commercial Fleet Empire state
  const [commercialBusinessName, setCommercialBusinessName] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cozy_reel_save_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.commercialBusinessName) return parsed.commercialBusinessName;
        if (Array.isArray(parsed.ownedBoats) && parsed.ownedBoats.length > 0) {
          return 'Harbor Commercial Fleet';
        }
      }
    } catch {}
    return null;
  });

  const [ownedBoats, setOwnedBoats] = useState<OwnedBoat[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cozy_reel_save_v7');
      if (saved && Array.isArray(JSON.parse(saved).ownedBoats)) {
        return JSON.parse(saved).ownedBoats;
      }
    } catch {}
    return [];
  });

  const [hiredCrew, setHiredCrew] = useState<CrewMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cozy_reel_save_v7');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.hiredCrew) && parsed.hiredCrew.length > 0) {
          return parsed.hiredCrew;
        }
        if (Array.isArray(parsed.hiredCrewIds) && parsed.hiredCrewIds.length > 0) {
          return HIREABLE_CREW.filter((c) => parsed.hiredCrewIds.includes(c.id));
        }
      }
    } catch {}
    return [];
  });

  const [availableJobSeekers, setAvailableJobSeekers] = useState<CrewMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.availableJobSeekers)) {
          return parsed.availableJobSeekers;
        }
      }
    } catch {}
    return generateJobSeekers([]);
  });

  // Preload all game audio and visual sprites for instant web play
  useEffect(() => {
    preloadGameAssets();
  }, []);

  // Rotate harbor job seekers periodically
  useEffect(() => {
    const jobTimer = setInterval(() => {
      setAvailableJobSeekers(generateJobSeekers(hiredCrew.map((c) => c.id)));
    }, 90000);
    return () => clearInterval(jobTimer);
  }, [hiredCrew]);

  const handleRefreshJobSeekers = () => {
    setAvailableJobSeekers(generateJobSeekers(hiredCrew.map((c) => c.id)));
  };

  const [ownedUpgradeIds, setOwnedUpgradeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cozy_reel_save_v7');
      if (saved && Array.isArray(JSON.parse(saved).ownedUpgradeIds)) {
        return JSON.parse(saved).ownedUpgradeIds;
      }
    } catch {}
    return [];
  });

  const [commercialStats, setCommercialStats] = useState<CommercialStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cozy_reel_save_v7');
      if (saved && JSON.parse(saved).commercialStats) {
        return JSON.parse(saved).commercialStats;
      }
    } catch {}
    return {
      totalFleetRevenue: 0,
      totalExpeditionsCount: 0,
      totalFishLanded: 0,
    };
  });

  // Hatchery state
  const [hatcheryUnlocked, setHatcheryUnlocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.hatcheryUnlocked === 'boolean') return parsed.hatcheryUnlocked;
        if (Array.isArray(parsed.hatcheryTanks) && parsed.hatcheryTanks.some((t: HatcheryTank) => t.unlocked)) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  const [hatcheryTanks, setHatcheryTanks] = useState<HatcheryTank[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Array.isArray(JSON.parse(saved).hatcheryTanks)) {
        const loaded = JSON.parse(saved).hatcheryTanks;
        return loaded.map((t: HatcheryTank) => {
          if (t.id === 'tank_1' && !t.unlocked) {
            return {
              ...t,
              unlockCost: 500,
            };
          }
          return t;
        });
      }
    } catch {}
    return INITIAL_HATCHERY_TANKS;
  });

  const [hatcheryUpgrades, setHatcheryUpgrades] = useState<HatcheryUpgradeId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Array.isArray(JSON.parse(saved).hatcheryUpgrades)) {
        return JSON.parse(saved).hatcheryUpgrades;
      }
    } catch {}
    return [];
  });

  const [liveBaitCharges, setLiveBaitCharges] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof JSON.parse(saved).liveBaitCharges === 'number') {
        return JSON.parse(saved).liveBaitCharges;
      }
    } catch {}
    return 0;
  });

  const [useLiveBait, setUseLiveBait] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof JSON.parse(saved).useLiveBait === 'boolean') {
        return JSON.parse(saved).useLiveBait;
      }
    } catch {}
    return true;
  });

  const [activeTab, setActiveTab] = useState<Tab>('fish');

  // Civic Investments & Economy Influence
  const [civicInvestments, setCivicInvestments] = useState<CivicInvestmentId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cozy_reel_save_v9');
      if (saved && Array.isArray(JSON.parse(saved).civicInvestments)) {
        return JSON.parse(saved).civicInvestments;
      }
    } catch {}
    return [];
  });

  // Angler Clubs & Guilds
  const [clubState, setClubState] = useState<ClubMemberState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cozy_reel_save_v9');
      if (saved && JSON.parse(saved).clubState) {
        const parsed = JSON.parse(saved).clubState;
        return {
          currentClubId: parsed.currentClubId || null,
          reputationPoints: parsed.reputationPoints || { casters: 0, commercial: 0, breeders: 0, explorers: 0 },
          subscriptionDueAt: parsed.subscriptionDueAt || (parsed.currentClubId ? Date.now() + GUILD_SUBSCRIPTION_CYCLE_MS : 0),
          autoRenew: parsed.autoRenew !== false,
          isSubscriptionActive: parsed.isSubscriptionActive !== false,
        };
      }
    } catch {}
    return {
      currentClubId: null,
      reputationPoints: { casters: 0, commercial: 0, breeders: 0, explorers: 0 },
      subscriptionDueAt: 0,
      autoRenew: true,
      isSubscriptionActive: false,
    };
  });

  // Town Community Bounties
  const [townBounties, setTownBounties] = useState<TownBounty[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('cozy_reel_save_v9');
      if (saved && Array.isArray(JSON.parse(saved).townBounties)) {
        return JSON.parse(saved).townBounties;
      }
    } catch {}
    return generateTownBounties();
  });

  // Town Restaurant state
  const [restaurantState, setRestaurantState] = useState<RestaurantState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).restaurantState) {
        return JSON.parse(saved).restaurantState;
      }
    } catch {}
    return {
      name: 'The Salty Anchor Tavern & Grill',
      unlocked: true,
      pantry: {},
      hiredStaffIds: [],
      unlockedExpansionIds: [],
      totalMealsServed: 0,
      totalEarnings: 0,
      reputation: 0,
    };
  });

  // Weather countdown timer (measured 360s / 6-minute cycle)
  const [weatherShiftRemainingSec, setWeatherShiftRemainingSec] = useState<number>(360);

  // Casting state machine
  const [castState, setCastState] = useState<CastState>('idle');
  const [reelingRemainingSec, setReelingRemainingSec] = useState<number>(0);
  const [reelingProgressPercent, setReelingProgressPercent] = useState<number>(0);

  const [pendingCatch, setPendingCatch] = useState<CaughtFish | null>(null);
  const [pendingJunk, setPendingJunk] = useState<JunkItem | null>(null);
  const [pendingTreasureGold, setPendingTreasureGold] = useState<number | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundManager.isMuted());

  const handleToggleSound = () => {
    const nextMuted = soundManager.toggleMute();
    setIsSoundMuted(nextMuted);
  };

  // Timers
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const biteWindowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reelingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const activeArea =
    FISHING_AREAS.find((a) => a.id === selectedAreaId) || FISHING_AREAS[0];
  const equippedRod = RODS.find((r) => r.id === equippedRodId) || RODS[0];
  const equippedReel = REELS.find((r) => r.id === equippedReelId) || REELS[0];
  const equippedLure = LURES.find((l) => l.id === equippedLureId) || LURES[0];
  const currentWeather: WeatherDef =
    WEATHER_TYPES.find((w) => w.id === weatherId) || WEATHER_TYPES[0];

  const currentRumor = getCurrentWeatherRumor();
  const isRumorActive = isWeatherRumorActive(currentRumor, selectedAreaId, weatherId);
  const rumorSpecies = getRumorSpecies(currentRumor);

  const totalCatchesCount = Object.values(catalog).reduce(
    (sum, c) => sum + (c?.caughtCount || 0),
    0
  );
  const playerRank = getPlayerFishingRank(
    unlockedAreaIds.length,
    totalCatchesCount,
    ownedBoats.length
  );

  // Dev Code: Typing 3157458141 normally anywhere on keyboard gives $10,000
  const [devCodeBanner, setDevCodeBanner] = useState<string | null>(null);

  useEffect(() => {
    let keyBuffer = '';
    const targetCode = '3157458141';

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        keyBuffer = (keyBuffer + e.key).slice(-15);
        if (keyBuffer.endsWith(targetCode)) {
          setMoney((prev) => prev + 10000);
          setDevCodeBanner('DEV CHEAT ACTIVATED: +$10,000 Credited to Account!');
          setTimeout(() => setDevCodeBanner(null), 4500);
          keyBuffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ambient soundscape for active area
  useEffect(() => {
    soundManager.playAreaAmbience(activeArea.id);
  }, [activeArea.id]);

  // Reeling SFX when reeling
  useEffect(() => {
    if (castState === 'reeling') {
      soundManager.startReelingSfx();
    } else {
      soundManager.stopReelingSfx();
    }
  }, [castState]);

  // Dynamically grant new contracts when player rank increases (rank up only, max 3)
  const prevRankRef = useRef(playerRank);
  useEffect(() => {
    if (playerRank > prevRankRef.current) {
      prevRankRef.current = playerRank;
      setPrivateOrders((prev) => {
        if (prev.length < 3) {
          const usedFishIds = prev.map((o) => o.fishId);
          return [...prev, createPrivateOrder(unlockedAreaIds, usedFishIds, playerRank)];
        }
        return prev;
      });
      setCommercialOrders((prev) => {
        if (prev.length < 3) {
          const usedFishIds = prev.map((o) => o.fishId);
          return [...prev, createCommercialOrder(unlockedAreaIds, usedFishIds, playerRank)];
        }
        return prev;
      });
    }
  }, [playerRank, unlockedAreaIds]);

  // Periodic private contract arrival: every 60s, a new private contract arrives (max 3)
  useEffect(() => {
    const timer = setInterval(() => {
      setPrivateOrders((prev) => {
        if (prev.length >= 3) return prev;
        const usedFishIds = prev.map((o) => o.fishId);
        return [...prev, createPrivateOrder(unlockedAreaIds, usedFishIds, playerRank)];
      });
    }, 60000);
    return () => clearInterval(timer);
  }, [unlockedAreaIds, playerRank]);

  // Periodic commercial contract arrival: every 75s, a new wholesale bulk order arrives (max 3)
  useEffect(() => {
    const timer = setInterval(() => {
      setCommercialOrders((prev) => {
        if (prev.length >= 3) return prev;
        const usedFishIds = prev.map((o) => o.fishId);
        return [...prev, createCommercialOrder(unlockedAreaIds, usedFishIds, playerRank)];
      });
    }, 75000);
    return () => clearInterval(timer);
  }, [unlockedAreaIds, playerRank]);

  // Weather cycling effect: shifts weather naturally every 360 seconds (6 minutes) with live countdown
  useEffect(() => {
    const weatherTimer = setInterval(() => {
      setWeatherShiftRemainingSec((prev) => {
        if (prev <= 1) {
          setWeatherId((cur) => {
            const pool: WeatherId[] = ['clear', 'overcast', 'rain', 'fog', 'windy'];
            const otherWeathers = pool.filter((w) => w !== cur);
            return otherWeathers[Math.floor(Math.random() * otherWeathers.length)];
          });
          return 360;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(weatherTimer);
  }, []);

  // Guild monthly subscription renewal check
  useEffect(() => {
    const subTimer = setInterval(() => {
      setClubState((prev) => {
        if (!prev.currentClubId || !prev.subscriptionDueAt) return prev;
        if (Date.now() < prev.subscriptionDueAt) return prev;

        const club = ANGLER_CLUBS.find((c) => c.id === prev.currentClubId);
        if (!club) return prev;

        const autoRenew = prev.autoRenew !== false;
        if (autoRenew && money >= club.membershipDues) {
          setMoney((m) => Math.max(0, m - club.membershipDues));
          return {
            ...prev,
            subscriptionDueAt: Date.now() + GUILD_SUBSCRIPTION_CYCLE_MS,
            isSubscriptionActive: true,
          };
        } else {
          if (prev.isSubscriptionActive) {
            return {
              ...prev,
              isSubscriptionActive: false,
            };
          }
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(subTimer);
  }, [money]);

  // Commercial expedition background resolution timer
  useEffect(() => {
    const expeditionTimer = setInterval(() => {
      const now = Date.now();
      setOwnedBoats((prev) => {
        let changed = false;
        const next = prev.map((boat) => {
          if (!boat.expedition || boat.expedition.isCompleted) return boat;

          const elapsedSec = (now - boat.expedition.startedAt) / 1000;
          if (elapsedSec >= boat.expedition.durationSec) {
            changed = true;
            const boatDef =
              BOATS_CATALOG.find((b) => b.id === boat.boatDefId) || BOATS_CATALOG[0];
            const assignedCrew = hiredCrew.filter((c) =>
              boat.assignedCrewIds.includes(c.id)
            );
            const installedUpgrades = FLEET_UPGRADES.filter((u) =>
              boat.installedUpgradeIds.includes(u.id)
            );

            const haul = calculateExpeditionHaul(
              boat,
              boatDef,
              assignedCrew,
              installedUpgrades,
              boat.expedition,
              commercialOrders,
              1.0,
              isClubPerkActive(clubState, 'commercial')
            );

            return {
              ...boat,
              expedition: {
                ...boat.expedition,
                isCompleted: true,
                resolvedHaul: haul.fishes,
              },
            };
          }
          return boat;
        });

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(expeditionTimer);
  }, [commercialOrders, hiredCrew]);

  // Hatchery breeding background progression
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setHatcheryTanks((prev) => {
        let changed = false;
        const next = prev.map((tank) => {
          if (!tank.unlocked || tank.stage === 'empty' || tank.stage === 'mature') return tank;
          const elapsedSec = (now - tank.startedAt) / 1000;
          if (elapsedSec >= tank.durationSec) {
            changed = true;
            return {
              ...tank,
              stage: 'mature' as const,
            };
          } else if (elapsedSec >= tank.durationSec * 0.5 && tank.stage === 'spawning') {
            changed = true;
            return {
              ...tank,
              stage: 'fingerlings' as const,
            };
          }
          return tank;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Restaurant staff background automation timer (Leo, Rosa, Milo, Genevieve)
  const [autoRushCountdownSec, setAutoRushCountdownSec] = useState<number>(25);
  const handleRunDinnerServiceRef = useRef<
    ((prepStyleId?: string, allowedDishIds?: string[]) => DinnerServiceResult | null) | null
  >(null);

  useEffect(() => {
    let tickCount = 0;
    const timer = setInterval(() => {
      tickCount += 1;
      setRestaurantState((curRest) => {
        if (!curRest.unlocked) return curRest;

        const hasRosa = curRest.hiredStaffIds.includes('staff_chef_rosa');
        const hasLeo = curRest.hiredStaffIds.includes('staff_prep_leo');
        const hasGenevieve = curRest.hiredStaffIds.includes('staff_host_genevieve');

        // 1. Leo Miller Auto-Restock: Every ~8s if pantry is low (<6 fish), transfers up to 2 fish from Box
        if (hasLeo && curRest.autoRestockFromBox !== false && tickCount % 8 === 0) {
          const totalPantry = Object.values(curRest.pantry).reduce((s, c) => s + c, 0);
          if (totalPantry < 6) {
            setInventory((curInv) => {
              if (curInv.length === 0) return curInv;
              const toTransfer = curInv.slice(0, 2);
              if (toTransfer.length === 0) return curInv;

              setTimeout(() => {
                setRestaurantState((prev) => {
                  const np = { ...prev.pantry };
                  toTransfer.forEach((f) => {
                    np[f.fishId] = (np[f.fishId] || 0) + 1;
                  });
                  return { ...prev, pantry: np };
                });
              }, 0);

              return curInv.slice(toTransfer.length);
            });
          }
        }

        // 2. Genevieve Dupond Auto-Procure Wholesale: Every ~12s if pantry is 0, auto-buys wholesale Yellow Perch at discount
        if (hasGenevieve && curRest.autoProcureWholesale !== false && tickCount % 12 === 0) {
          const totalPantry = Object.values(curRest.pantry).reduce((s, c) => s + c, 0);
          if (totalPantry === 0) {
            setMoney((curMoney) => {
              const discountedPrice = 14;
              const qty = 3;
              const cost = discountedPrice * qty;
              if (curMoney >= cost + 40) {
                setTimeout(() => {
                  setRestaurantState((prev) => ({
                    ...prev,
                    pantry: {
                      ...prev.pantry,
                      54: (prev.pantry[54] || 0) + qty,
                    },
                  }));
                }, 0);
                return curMoney - cost;
              }
              return curMoney;
            });
          }
        }

        // 3. Chef Rosa Perez Auto-Dinner Rush: Counts down and automatically serves diners every 25s
        if (hasRosa && curRest.autoDinnerRush !== false) {
          setAutoRushCountdownSec((sec) => {
            if (sec <= 1) {
              const totalPantry = Object.values(curRest.pantry).reduce((s, c) => s + c, 0);
              if (totalPantry > 0) {
                setTimeout(() => {
                  handleRunDinnerServiceRef.current?.(curRest.activePrepStyleId || 'pan_fry');
                }, 0);
              }
              return 25;
            }
            return sec - 1;
          });
        }

        return curRest;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-Save progress to local storage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          money,
          unlockedAreaIds,
          selectedAreaId,
          ownedRodIds,
          ownedReelIds,
          ownedLureIds,
          equippedRodId,
          equippedReelId,
          equippedLureId,
          inventory,
          catalog,
          unlockedTrapSlots,
          traps,
          weatherId,
          privateOrders,
          commercialOrders,
          marketOrders: [...privateOrders, ...commercialOrders],
          ownedBoats,
          hiredCrew,
          hiredCrewIds: hiredCrew.map((c) => c.id),
          availableJobSeekers,
          ownedUpgradeIds,
          commercialStats,
          hatcheryTanks,
          hatcheryUpgrades,
          hatcheryUnlocked,
          liveBaitCharges,
          useLiveBait,
          commercialBusinessName,
          civicInvestments,
          clubState,
          townBounties,
          restaurantState,
        })
      );
    } catch {}
  }, [
    money,
    unlockedAreaIds,
    selectedAreaId,
    ownedRodIds,
    ownedReelIds,
    ownedLureIds,
    equippedRodId,
    equippedReelId,
    equippedLureId,
    inventory,
    catalog,
    unlockedTrapSlots,
    traps,
    weatherId,
    privateOrders,
    commercialOrders,
    ownedBoats,
    hiredCrew,
    availableJobSeekers,
    ownedUpgradeIds,
    commercialStats,
    hatcheryTanks,
    hatcheryUpgrades,
    hatcheryUnlocked,
    liveBaitCharges,
    useLiveBait,
    commercialBusinessName,
    civicInvestments,
    clubState,
    townBounties,
    restaurantState,
  ]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      if (biteWindowTimerRef.current) clearTimeout(biteWindowTimerRef.current);
      if (reelingTimerRef.current) clearInterval(reelingTimerRef.current);
    };
  }, []);

  // Cast line with randomized wait duration
  const handleCast = useCallback(() => {
    if (
      castState !== 'idle' &&
      castState !== 'escaped' &&
      castState !== 'nothing' &&
      castState !== 'junk' &&
      castState !== 'treasure'
    ) {
      return;
    }

    setPendingCatch(null);
    setPendingJunk(null);
    setPendingTreasureGold(null);
    setCastState('waiting');

    const duration = rollWaitTime(equippedRod);
    const weatherSpeedMult = weatherId === 'rain' || weatherId === 'overcast' ? 0.85 : 1.0;
    const isLiveBaitActive = useLiveBait && liveBaitCharges > 0;
    const hatcheryBaitMult = isLiveBaitActive ? 0.60 : 1.0;
    const finalDuration = Math.max(1.5, duration * weatherSpeedMult * hatcheryBaitMult);
    startTimeRef.current = Date.now();

    if (waitTimerRef.current) clearInterval(waitTimerRef.current);

    waitTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, finalDuration - elapsed);

      if (remaining <= 1.2 && remaining > 0.2) {
        setCastState((prev) => (prev === 'waiting' ? 'nibble' : prev));
      }

      if (remaining <= 0) {
        if (waitTimerRef.current) clearInterval(waitTimerRef.current);
        setCastState('bite');

        biteWindowTimerRef.current = setTimeout(() => {
          setCastState('idle');
        }, 6500);
      }
    }, 100);
  }, [castState, equippedRod, weatherId, liveBaitCharges, useLiveBait]);

  // Reel in handler with dynamic duration based on fish weight, rod power, and reel speed
  const handleReelIn = useCallback(() => {
    if (biteWindowTimerRef.current) clearTimeout(biteWindowTimerRef.current);
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);

    if (castState !== 'bite') return;

    const isLiveBaitActive = useLiveBait && liveBaitCharges > 0;
    if (isLiveBaitActive) {
      setLiveBaitCharges((prev) => Math.max(0, prev - 1));
    }

    const currentRumor = getCurrentWeatherRumor();
    const isRumorActive = isWeatherRumorActive(currentRumor, selectedAreaId, weatherId);
    const isExplorersActive = isClubPerkActive(clubState, 'explorers');

    const encounter: HookedEncounter = rollHookedEncounter(
      selectedAreaId,
      equippedRod,
      equippedLure,
      equippedReel,
      {
        weather: weatherId,
        useLiveBait: isLiveBaitActive,
        weatherRumorActive: isRumorActive || (isExplorersActive && Math.random() < 0.15),
        rumorSpeciesId: currentRumor.speciesId,
      }
    );

    let reelDuration = encounter.reelDurationSec;
    const isCastersActive = isClubPerkActive(clubState, 'casters');
    if (isCastersActive && Math.random() < 0.10) {
      reelDuration = Math.min(0.4, reelDuration);
    }

    setCastState('reeling');
    setReelingRemainingSec(reelDuration);
    setReelingProgressPercent(0);

    const reelStart = Date.now();

    if (reelingTimerRef.current) clearInterval(reelingTimerRef.current);

    reelingTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - reelStart) / 1000;
      const remaining = Math.max(0, reelDuration - elapsed);
      const pct = Math.min(100, (elapsed / reelDuration) * 100);

      setReelingRemainingSec(remaining);
      setReelingProgressPercent(pct);

      if (remaining <= 0) {
        if (reelingTimerRef.current) clearInterval(reelingTimerRef.current);

        if (encounter.type === 'nothing') {
          setCastState('nothing');
          return;
        }

        if (encounter.type === 'treasure') {
          const mult = 0.5 + Math.random() * 1.0;
          const reward = Math.max(500, Math.round(money * mult));
          setPendingTreasureGold(reward);
          setCastState('treasure');
          return;
        }

        if (encounter.type === 'junk' && encounter.junkItem) {
          setPendingJunk(encounter.junkItem);
          setCastState('junk');
          return;
        }

        if (encounter.willEscape) {
          setCastState('escaped');
          return;
        }

        if (encounter.caughtFish) {
          const caught = encounter.caughtFish;
          const existing = catalog[caught.fishId];
          const isRecord = !existing || caught.weight > (existing.maxWeight || 0);
          setIsNewRecord(isRecord);

          setCatalog((prev) => {
            const cur = prev[caught.fishId] || {
              caughtCount: 0,
              maxWeight: 0,
              hasTrophy: false,
              firstCaughtAt: Date.now(),
              unlockedMutations: ['normal'],
            };
            const mSet = new Set(cur.unlockedMutations || ['normal']);
            mSet.add('normal');
            if (caught.mutation && caught.mutation !== 'normal') {
              mSet.add(caught.mutation);
            }
            return {
              ...prev,
              [caught.fishId]: {
                caughtCount: cur.caughtCount + 1,
                maxWeight: Math.max(cur.maxWeight, caught.weight),
                hasTrophy: cur.hasTrophy || caught.isTrophy,
                firstCaughtAt: cur.firstCaughtAt,
                unlockedMutations: Array.from(mSet),
              },
            };
          });

          setPendingCatch(caught);
          setCastState('caught');
        }
      }
    }, 75);
  }, [castState, selectedAreaId, equippedRod, equippedLure, equippedReel, catalog, weatherId, liveBaitCharges, useLiveBait]);

  const handleCancelCast = () => {
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    if (biteWindowTimerRef.current) clearTimeout(biteWindowTimerRef.current);
    if (reelingTimerRef.current) clearInterval(reelingTimerRef.current);
    setCastState('idle');
  };

  const handleKeepFish = () => {
    if (!pendingCatch) return;
    setInventory((prev) => [pendingCatch, ...prev]);
    setPendingCatch(null);
    setCastState('idle');
  };

  const handleDismissJunk = () => {
    if (pendingJunk) {
      if (pendingJunk.value > 0) {
        setMoney((prev) => prev + pendingJunk.value);
      }
      setPendingJunk(null);
    }
    setCastState('idle');
  };

  const handleClaimTreasure = () => {
    if (pendingTreasureGold != null && pendingTreasureGold > 0) {
      setMoney((prev) => prev + pendingTreasureGold);
      setPendingTreasureGold(null);
    }
    setCastState('idle');
  };

  const handleSellFish = (catchId: string) => {
    const item = inventory.find((f) => f.catchId === catchId);
    if (!item) return;
    const hasColdStorage = civicInvestments.includes('cold_storage');
    const finalVal = hasColdStorage ? Math.round(item.value * 1.15) : item.value;
    setMoney((prev) => prev + finalVal);
    setInventory((prev) => prev.filter((f) => f.catchId !== catchId));
  };

  const handleSellFishBatch = (catchIds: string[]) => {
    if (catchIds.length === 0) return;
    const idSet = new Set(catchIds);
    const itemsToSell = inventory.filter((f) => idSet.has(f.catchId));
    const hasColdStorage = civicInvestments.includes('cold_storage');
    const totalVal = itemsToSell.reduce(
      (sum, f) => sum + (hasColdStorage ? Math.round(f.value * 1.15) : f.value),
      0
    );
    setMoney((prev) => prev + totalVal);
    setInventory((prev) => prev.filter((f) => !idSet.has(f.catchId)));
  };

  const handleSellAll = () => {
    if (inventory.length === 0) return;
    const hasColdStorage = civicInvestments.includes('cold_storage');
    const totalVal = inventory.reduce(
      (sum, f) => sum + (hasColdStorage ? Math.round(f.value * 1.15) : f.value),
      0
    );
    setMoney((prev) => prev + totalVal);
    setInventory([]);
  };

  const handleUnlockArea = (area: FishingAreaDef) => {
    const totalCaughtSpecies = Object.keys(catalog).filter(
      (id) => catalog[Number(id)]?.caughtCount > 0
    ).length;

    if (totalCaughtSpecies < area.requiredSpecies) return;
    if (money < area.unlockCost) return;

    if (area.unlockCost > 0) {
      setMoney((prev) => prev - area.unlockCost);
    }
    setUnlockedAreaIds((prev) => [...prev, area.id]);
    setSelectedAreaId(area.id);
  };

  const handleSelectArea = (areaId: string) => {
    if (unlockedAreaIds.includes(areaId)) {
      setSelectedAreaId(areaId as AreaId);
    }
  };

  const handleBuyRod = (rod: Rod) => {
    if (money < rod.price || ownedRodIds.includes(rod.id)) return;
    setMoney((prev) => prev - rod.price);
    setOwnedRodIds((prev) => [...prev, rod.id]);
    setEquippedRodId(rod.id);
  };

  const handleBuyReel = (reel: Reel) => {
    if (money < reel.price || ownedReelIds.includes(reel.id)) return;
    setMoney((prev) => prev - reel.price);
    setOwnedReelIds((prev) => [...prev, reel.id]);
    setEquippedReelId(reel.id);
  };

  const handleBuyLure = (lure: Lure) => {
    if (money < lure.price || ownedLureIds.includes(lure.id)) return;
    setMoney((prev) => prev - lure.price);
    setOwnedLureIds((prev) => [...prev, lure.id]);
    setEquippedLureId(lure.id);
  };

  const handleEquipRod = (rodId: string) => setEquippedRodId(rodId);
  const handleEquipReel = (reelId: string) => setEquippedReelId(reelId);
  const handleEquipLure = (lureId: string) => setEquippedLureId(lureId);

  // Trapping Handlers
  const handleHarvestTrap = (slotIndex: number) => {
    const trap = traps[slotIndex];
    if (!trap) return;

    const soakBonus = isClubPerkActive(clubState, 'commercial') ? 1.10 : 1.0;
    const harvest = calculateTrapCatch(trap, Date.now(), soakBonus);
    if (harvest.count === 0 || harvest.fishes.length === 0) return;

    // Put all trapped fish directly into the inventory Box
    setInventory((prev) => [...harvest.fishes, ...prev]);

    // Record catches into log/catalog
    setCatalog((prev) => {
      const next = { ...prev };
      harvest.fishes.forEach((fish) => {
        const cur = next[fish.fishId] || {
          caughtCount: 0,
          maxWeight: 0,
          hasTrophy: false,
          firstCaughtAt: Date.now(),
        };
        next[fish.fishId] = {
          caughtCount: cur.caughtCount + 1,
          maxWeight: Math.max(cur.maxWeight, fish.weight),
          hasTrophy: cur.hasTrophy || fish.isTrophy,
          firstCaughtAt: cur.firstCaughtAt,
        };
      });
      return next;
    });

    // Reset trap soak time
    setTraps((prev) =>
      prev.map((t, idx) =>
        idx === slotIndex
          ? { ...t, placedAt: Date.now(), lastCheckedAt: Date.now() }
          : t
      )
    );
  };

  const handleSetTrapArea = (slotIndex: number, areaId: AreaId) => {
    const trap = traps[slotIndex];
    if (trap) {
      // Safely harvest any trapped fish into Box when moving waters
      const soakBonus = isClubPerkActive(clubState, 'commercial') ? 1.10 : 1.0;
      const harvest = calculateTrapCatch(trap, Date.now(), soakBonus);
      if (harvest.count > 0 && harvest.fishes.length > 0) {
        setInventory((prev) => [...harvest.fishes, ...prev]);
        setCatalog((prev) => {
          const next = { ...prev };
          harvest.fishes.forEach((fish) => {
            const cur = next[fish.fishId] || {
              caughtCount: 0,
              maxWeight: 0,
              hasTrophy: false,
              firstCaughtAt: Date.now(),
            };
            next[fish.fishId] = {
              caughtCount: cur.caughtCount + 1,
              maxWeight: Math.max(cur.maxWeight, fish.weight),
              hasTrophy: cur.hasTrophy || fish.isTrophy,
              firstCaughtAt: cur.firstCaughtAt,
            };
          });
          return next;
        });
      }
    }

    setTraps((prev) =>
      prev.map((t, idx) =>
        idx === slotIndex
          ? { ...t, areaId, placedAt: Date.now(), lastCheckedAt: Date.now() }
          : t
      )
    );
  };

  const handleFulfillPrivateOrder = (orderOrId: string | FishMarketOrder) => {
    const orderId = typeof orderOrId === 'string' ? orderOrId : orderOrId.id;
    const order = privateOrders.find((o) => o.id === orderId);
    if (!order) return;

    const matchingFish = inventory.filter((f) => f.fishId === order.fishId);
    if (matchingFish.length < order.requiredCount) return;

    const removeCatchIds = new Set(
      matchingFish.slice(0, order.requiredCount).map((f) => f.catchId)
    );
    setInventory((prev) => prev.filter((f) => !removeCatchIds.has(f.catchId)));

    const hasTourism = civicInvestments.includes('tourism_board');
    const reward = hasTourism ? Math.round(order.rewardCash * 1.35) : order.rewardCash;
    setMoney((prev) => prev + reward);

    // Vanishes until another contract arrives via timer (max 3)
    setPrivateOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleDeclinePrivateOrder = (orderId: string) => {
    // Declined private contract vanishes until another arrives via timer
    setPrivateOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleFulfillCommercialOrder = (orderOrId: string | FishMarketOrder) => {
    const orderId = typeof orderOrId === 'string' ? orderOrId : orderOrId.id;
    const order = commercialOrders.find((o) => o.id === orderId);
    if (!order) return;

    const matchingFish = inventory.filter((f) => f.fishId === order.fishId);
    if (matchingFish.length < order.requiredCount) return;

    const removeCatchIds = new Set(
      matchingFish.slice(0, order.requiredCount).map((f) => f.catchId)
    );
    setInventory((prev) => prev.filter((f) => !removeCatchIds.has(f.catchId)));
    setMoney((prev) => prev + order.rewardCash);

    // Vanishes until wholesale market order arrives via timer (max 3)
    setCommercialOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleRerollCommercialOrder = (orderId: string) => {
    // Declined commercial order vanishes until wholesale market rotates
    setCommercialOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  const handleBaitTrap = (slotIndex: number, baitId: string) => {
    const b = TRAP_BAITS.find((tb) => tb.id === baitId) || TRAP_BAITS[0];
    if (money < b.price) return;
    if (b.price > 0) {
      setMoney((prev) => prev - b.price);
    }
    setTraps((prev) =>
      prev.map((t, idx) =>
        idx === slotIndex
          ? {
              ...t,
              baitId,
              baitName: undefined,
              baitSpeedMultiplier: undefined,
              placedAt: Date.now(),
              lastCheckedAt: Date.now(),
            }
          : t
      )
    );
  };

  const handleBaitTrapWithFish = (slotIndex: number, catchId: string) => {
    const fish = inventory.find((f) => f.catchId === catchId);
    if (!fish) return;

    // Consume 1 fish from inventory
    setInventory((prev) => prev.filter((f) => f.catchId !== catchId));

    const profile = getFishTrapBaitProfile(fish);

    setTraps((prev) =>
      prev.map((t, idx) =>
        idx === slotIndex
          ? {
              ...t,
              baitId: 'custom_fish_cut',
              baitName: `${profile.baitName} (${fish.weight} lbs)`,
              baitSpeedMultiplier: profile.speedMultiplier,
              baitBuffTitle: profile.buffTitle,
              baitBuffDesc: profile.buffDescription,
              baitCategory: profile.category,
              baitAttractedKeywords: profile.attractedKeywords,
              baitWeightBonus: profile.weightBonus,
              baitRareBonus: profile.rareBonus,
              placedAt: Date.now(),
              lastCheckedAt: Date.now(),
            }
          : t
      )
    );
  };

  const handleUpgradeTrapModel = (slotIndex: number, trapTypeId: string) => {
    const model = TRAP_TYPES.find((m) => m.id === trapTypeId);
    if (!model || money < model.price) return;
    setMoney((prev) => prev - model.price);
    setTraps((prev) =>
      prev.map((t, idx) => (idx === slotIndex ? { ...t, trapTypeId } : t))
    );
  };

  const handleUnlockTrapSlot = () => {
    if (unlockedTrapSlots >= TRAP_SLOT_PRICES.length) return;
    const cost = TRAP_SLOT_PRICES[unlockedTrapSlots];
    if (money < cost) return;
    setMoney((prev) => prev - cost);
    const newSlotIndex = unlockedTrapSlots;
    setTraps((prev) =>
      prev.map((t, idx) =>
        idx === newSlotIndex
          ? { ...t, placedAt: Date.now(), lastCheckedAt: Date.now() }
          : t
      )
    );
    setUnlockedTrapSlots((prev) => prev + 1);
  };

  // Hatchery Aquaculture Handlers
  const handleUnlockHatchery = () => {
    if (money < 500 || hatcheryUnlocked) return;
    setMoney((prev) => prev - 500);
    setHatcheryUnlocked(true);
    setHatcheryTanks((prev) =>
      prev.map((t) => (t.id === 'tank_1' ? { ...t, unlocked: true } : t))
    );
  };

  const handleUnlockTank = (tankId: TankId) => {
    const tank = hatcheryTanks.find((t) => t.id === tankId);
    if (!tank || tank.unlocked || money < tank.unlockCost) return;
    setMoney((prev) => prev - tank.unlockCost);
    if (tankId === 'tank_1') {
      setHatcheryUnlocked(true);
    }
    setHatcheryTanks((prev) =>
      prev.map((t) => (t.id === tankId ? { ...t, unlocked: true } : t))
    );
  };

  const handleBuyHatcheryUpgrade = (upgradeId: HatcheryUpgradeId) => {
    const upDef = HATCHERY_UPGRADES.find((u) => u.id === upgradeId);
    if (!upDef || hatcheryUpgrades.includes(upgradeId) || money < upDef.price) return;
    setMoney((prev) => prev - upDef.price);
    setHatcheryUpgrades((prev) => [...prev, upgradeId]);
  };

  const handleStartBreeding = (
    tankId: TankId,
    speciesId: number,
    feedType: FeedType,
    pairCount: number = 1,
    parentMutation: HatcheryMutation | 'normal' = 'normal'
  ) => {
    const species = FISH_COLLECTION.find((f) => f.id === speciesId);
    const feed = FEED_OPTIONS.find((f) => f.id === feedType) || FEED_OPTIONS[0];
    const totalFeedCost = feed.price * pairCount;
    if (!species || money < totalFeedCost) return;

    const allMatching = inventory.filter((f) => f.fishId === speciesId);
    const mutantMatching = allMatching.filter((f) => f.mutation === parentMutation);
    const matchingBrood =
      parentMutation !== 'normal' && mutantMatching.length > 0
        ? [...mutantMatching, ...allMatching.filter((f) => f.mutation !== parentMutation)]
        : allMatching;

    const requiredBroodstock = pairCount * 2;
    if (matchingBrood.length < requiredBroodstock) return;

    const pairCatchIds = new Set(matchingBrood.slice(0, requiredBroodstock).map((f) => f.catchId));
    setInventory((prev) => prev.filter((f) => !pairCatchIds.has(f.catchId)));
    setMoney((prev) => prev - totalFeedCost);

    const isBreedersActive = isClubPerkActive(clubState, 'breeders');
    const growthMult = isBreedersActive ? 1.12 : 1.0;
    const durationSec = calculateBreedingDuration(species, feedType, hatcheryUpgrades, growthMult, pairCount);
    const clutchCount = calculateClutchYield(species, feedType, hatcheryUpgrades, pairCount, 1.0);
    const trophyCount = calculateTrophyCount(clutchCount, feedType, hatcheryUpgrades, 1.0);

    const mutationRoll = rollClutchMutations(
      clutchCount,
      hatcheryUpgrades,
      civicInvestments.includes('aquaculture_lab'),
      isBreedersActive,
      parentMutation
    );

    setHatcheryTanks((prev) =>
      prev.map((t) =>
        t.id === tankId
          ? {
              ...t,
              speciesId,
              stage: 'spawning',
              startedAt: Date.now(),
              durationSec,
              feedType,
              hasFood: true,
              clutchCount,
              trophyCount,
              avgWeight: Number(((species.minWeight + species.maxWeight) / 2).toFixed(2)),
              broodstockCount: requiredBroodstock,
              pairCount,
              growthRate: 1.0,
              fecundity: 1.0,
              hardiness: 1.0,
              mutationStrain: mutationRoll.mutationStrain,
              mutationCount: mutationRoll.mutationCount,
            }
          : t
      )
    );
  };

  const handleFeedTank = (tankId: TankId) => {
    const tank = hatcheryTanks.find((t) => t.id === tankId);
    if (!tank) return;
    const feed = FEED_OPTIONS.find((f) => f.id === tank.feedType) || FEED_OPTIONS[0];
    if (money < feed.price) return;
    setMoney((prev) => prev - feed.price);
    setHatcheryTanks((prev) =>
      prev.map((t) => (t.id === tankId ? { ...t, hasFood: true } : t))
    );
  };

  const handleSellHatcheryBatch = (tankId: TankId) => {
    const tank = hatcheryTanks.find((t) => t.id === tankId);
    if (!tank || !tank.speciesId) return;
    const species = FISH_COLLECTION.find((f) => f.id === tank.speciesId);
    if (!species) return;

    const batchVal = calculateBatchValue(
      species,
      tank.clutchCount,
      tank.trophyCount,
      hatcheryUpgrades,
      tank.mutationStrain,
      tank.mutationCount
    );
    setMoney((prev) => prev + batchVal);

    setHatcheryTanks((prev) =>
      prev.map((t) =>
        t.id === tankId
          ? {
              ...t,
              speciesId: null,
              stage: 'empty',
              startedAt: 0,
              durationSec: 0,
              hasFood: false,
              clutchCount: 0,
              trophyCount: 0,
              broodstockCount: 0,
              pairCount: 1,
              growthRate: 1.0,
              fecundity: 1.0,
              hardiness: 1.0,
              mutationStrain: 'normal',
              mutationCount: 0,
            }
          : t
      )
    );
  };

  const handleHarvestHatcheryBait = (tankId: TankId) => {
    const tank = hatcheryTanks.find((t) => t.id === tankId);
    if (!tank || !tank.speciesId) return;
    const species = FISH_COLLECTION.find((f) => f.id === tank.speciesId);
    if (!species) return;

    const maxBaitCap = getHatcheryBaitMaxCapacity(hatcheryUpgrades);
    const baitUnits = calculateBaitYield(species, tank.clutchCount, tank.mutationStrain);
    setLiveBaitCharges((prev) => Math.min(maxBaitCap, prev + baitUnits));

    setHatcheryTanks((prev) =>
      prev.map((t) =>
        t.id === tankId
          ? {
              ...t,
              speciesId: null,
              stage: 'empty',
              startedAt: 0,
              durationSec: 0,
              hasFood: false,
              clutchCount: 0,
              trophyCount: 0,
              broodstockCount: 0,
              pairCount: 1,
              growthRate: 1.0,
              fecundity: 1.0,
              hardiness: 1.0,
              mutationStrain: 'normal',
              mutationCount: 0,
            }
          : t
      )
    );
  };

  const handleTransferHatcheryToBox = (tankId: TankId) => {
    const tank = hatcheryTanks.find((t) => t.id === tankId);
    if (!tank || !tank.speciesId) return;
    const species = FISH_COLLECTION.find((f) => f.id === tank.speciesId);
    if (!species) return;

    const newFish: CaughtFish[] = [];
    const now = Date.now();
    const mutationDetail = MUTATION_DETAILS[tank.mutationStrain] || MUTATION_DETAILS.normal;

    for (let i = 0; i < tank.clutchCount; i++) {
      const isTrophy = i < tank.trophyCount;
      const isMutant = i < tank.mutationCount && tank.mutationStrain !== 'normal';
      const minW = species.minWeight;
      const maxW = isTrophy
        ? species.trophyWeight
        : species.minWeight + (species.maxWeight - species.minWeight) * 0.6;
      const weight = Number((minW + Math.random() * (maxW - minW)).toFixed(2));
      const trophyBonus = isTrophy ? 2.5 : 1.0;
      const mutantBonus = isMutant ? mutationDetail.valueMultiplier : 1.0;
      const value = Math.max(
        1,
        Math.round(species.basePrice * 1.35 * trophyBonus * mutantBonus)
      );

      newFish.push({
        catchId: `hatchery_${now}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        fishId: species.id,
        name: isMutant ? `${mutationDetail.name} ${species.name}` : species.name,
        tier: species.tier,
        weight,
        isTrophy,
        value,
        caughtAt: now,
        areaId: species.areaId,
        mutation: isMutant ? tank.mutationStrain : 'normal',
        mutationName: isMutant ? mutationDetail.name : undefined,
        growthRate: tank.growthRate,
        fecundity: tank.fecundity,
        hardiness: tank.hardiness,
      });
    }

    setInventory((prev) => [...prev, ...newFish]);

    if (tank.mutationStrain && tank.mutationStrain !== 'normal') {
      setCatalog((prev) => {
        const cur = prev[species.id] || {
          caughtCount: 1,
          maxWeight: species.maxWeight,
          hasTrophy: false,
          firstCaughtAt: Date.now(),
          unlockedMutations: ['normal'],
        };
        const mSet = new Set(cur.unlockedMutations || ['normal']);
        mSet.add('normal');
        mSet.add(tank.mutationStrain);
        return {
          ...prev,
          [species.id]: {
            ...cur,
            unlockedMutations: Array.from(mSet),
          },
        };
      });
    }

    setHatcheryTanks((prev) =>
      prev.map((t) =>
        t.id === tankId
          ? {
              ...t,
              speciesId: null,
              stage: 'empty',
              startedAt: 0,
              durationSec: 0,
              hasFood: false,
              clutchCount: 0,
              trophyCount: 0,
              broodstockCount: 0,
              pairCount: 1,
              growthRate: 1.0,
              fecundity: 1.0,
              hardiness: 1.0,
              mutationStrain: 'normal',
              mutationCount: 0,
            }
          : t
      )
    );
  };

  const handlePartialHarvest = (
    tankId: TankId,
    action: 'sell' | 'box' | 'bait',
    harvestCount: number
  ) => {
    const tank = hatcheryTanks.find((t) => t.id === tankId);
    if (!tank || !tank.speciesId || tank.clutchCount <= 0) return;
    const species = FISH_COLLECTION.find((f) => f.id === tank.speciesId);
    if (!species) return;

    const actualCount = Math.min(tank.clutchCount, Math.max(1, harvestCount));
    const remainingCount = tank.clutchCount - actualCount;

    const harvestTrophy = Math.min(tank.trophyCount, Math.round((actualCount / tank.clutchCount) * tank.trophyCount));
    const harvestMutation = Math.min(tank.mutationCount, Math.round((actualCount / tank.clutchCount) * tank.mutationCount));

    if (action === 'sell') {
      const val = calculateBatchValue(
        species,
        actualCount,
        harvestTrophy,
        hatcheryUpgrades,
        tank.mutationStrain,
        harvestMutation
      );
      setMoney((prev) => prev + val);
    } else if (action === 'bait') {
      const maxBaitCap = getHatcheryBaitMaxCapacity(hatcheryUpgrades);
      const baitUnits = calculateBaitYield(species, actualCount, tank.mutationStrain);
      setLiveBaitCharges((prev) => Math.min(maxBaitCap, prev + baitUnits));
    } else if (action === 'box') {
      const newFish: CaughtFish[] = [];
      const now = Date.now();
      const mutationDetail = MUTATION_DETAILS[tank.mutationStrain] || MUTATION_DETAILS.normal;

      for (let i = 0; i < actualCount; i++) {
        const isTrophy = i < harvestTrophy;
        const isMutant = i < harvestMutation && tank.mutationStrain !== 'normal';
        const minW = species.minWeight;
        const maxW = isTrophy
          ? species.trophyWeight
          : species.minWeight + (species.maxWeight - species.minWeight) * 0.6;
        const weight = Number((minW + Math.random() * (maxW - minW)).toFixed(2));
        const trophyBonus = isTrophy ? 2.5 : 1.0;
        const mutantBonus = isMutant ? mutationDetail.valueMultiplier : 1.0;
        const value = Math.max(1, Math.round(species.basePrice * 1.35 * trophyBonus * mutantBonus));

        newFish.push({
          catchId: `hatchery_${now}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          fishId: species.id,
          name: isMutant ? `${mutationDetail.name} ${species.name}` : species.name,
          tier: species.tier,
          weight,
          isTrophy,
          value,
          caughtAt: now,
          areaId: species.areaId,
          mutation: isMutant ? tank.mutationStrain : 'normal',
          mutationName: isMutant ? mutationDetail.name : undefined,
          growthRate: tank.growthRate,
          fecundity: tank.fecundity,
          hardiness: tank.hardiness,
        });
      }
      setInventory((prev) => [...prev, ...newFish]);

    if (tank.mutationStrain && tank.mutationStrain !== 'normal') {
      setCatalog((prev) => {
        const cur = prev[species.id] || {
          caughtCount: 1,
          maxWeight: species.maxWeight,
          hasTrophy: false,
          firstCaughtAt: Date.now(),
          unlockedMutations: ['normal'],
        };
        const mSet = new Set(cur.unlockedMutations || ['normal']);
        mSet.add('normal');
        mSet.add(tank.mutationStrain);
        return {
          ...prev,
          [species.id]: {
            ...cur,
            unlockedMutations: Array.from(mSet),
          },
        };
      });
    }
    }

    if (remainingCount >= 2) {
      // Resident broodstock continuous reproduction!
      const nextBroodstock = remainingCount;
      const nextPairs = Math.max(1, Math.floor(nextBroodstock / 2));
      const nextGrowthRate = Number((Math.min(2.5, (tank.growthRate || 1.0) * (1 + (Math.random() * 0.15 - 0.05)))).toFixed(2));
      const nextFecundity = Number((Math.min(2.2, (tank.fecundity || 1.0) * (1 + (Math.random() * 0.15 - 0.05)))).toFixed(2));
      const nextHardiness = Number((Math.min(2.0, (tank.hardiness || 1.0) * (1 + (Math.random() * 0.15 - 0.05)))).toFixed(2));

      const isBreedersActive = isClubPerkActive(clubState, 'breeders');
      const effectiveGrowthRate = isBreedersActive ? nextGrowthRate * 1.12 : nextGrowthRate;
      const durationSec = calculateBreedingDuration(species, tank.feedType, hatcheryUpgrades, effectiveGrowthRate, nextPairs);
      const clutchCount = calculateClutchYield(species, tank.feedType, hatcheryUpgrades, nextPairs, nextFecundity);
      const trophyCount = calculateTrophyCount(clutchCount, tank.feedType, hatcheryUpgrades, nextHardiness);

      const mutationRoll = rollClutchMutations(
        clutchCount,
        hatcheryUpgrades,
        civicInvestments.includes('aquaculture_lab'),
        isBreedersActive,
        tank.mutationStrain
      );

      setHatcheryTanks((prev) =>
        prev.map((t) =>
          t.id === tankId
            ? {
                ...t,
                stage: 'spawning',
                startedAt: Date.now(),
                durationSec,
                clutchCount,
                trophyCount,
                broodstockCount: nextBroodstock,
                pairCount: nextPairs,
                growthRate: nextGrowthRate,
                fecundity: nextFecundity,
                hardiness: nextHardiness,
                mutationStrain: mutationRoll.mutationStrain !== 'normal' ? mutationRoll.mutationStrain : tank.mutationStrain,
                mutationCount: mutationRoll.mutationCount,
              }
            : t
        )
      );
    } else {
      // Emptied below 2: reset
      setHatcheryTanks((prev) =>
        prev.map((t) =>
          t.id === tankId
            ? {
                ...t,
                speciesId: null,
                stage: 'empty',
                startedAt: 0,
                durationSec: 0,
                hasFood: false,
                clutchCount: 0,
                trophyCount: 0,
                broodstockCount: 0,
                pairCount: 1,
                growthRate: 1.0,
                fecundity: 1.0,
                hardiness: 1.0,
                mutationStrain: 'normal',
                mutationCount: 0,
              }
            : t
        )
      );
    }
  };

  const handleBuyCivicInvestment = (id: CivicInvestmentId) => {
    const inv = CIVIC_INVESTMENTS.find((c) => c.id === id);
    if (!inv || money < inv.cost || civicInvestments.includes(id)) return;
    setMoney((prev) => prev - inv.cost);
    setCivicInvestments((prev) => [...prev, id]);
  };

  const handleJoinClub = (clubId: ClubId) => {
    const club = ANGLER_CLUBS.find((c) => c.id === clubId);
    if (!club || money < club.membershipDues) return;
    setMoney((prev) => prev - club.membershipDues);
    setClubState((prev) => ({
      ...prev,
      currentClubId: clubId,
      subscriptionDueAt: Date.now() + GUILD_SUBSCRIPTION_CYCLE_MS,
      isSubscriptionActive: true,
      autoRenew: true,
    }));
  };

  const handleRenewSubscription = () => {
    if (!clubState.currentClubId) return;
    const club = ANGLER_CLUBS.find((c) => c.id === clubState.currentClubId);
    if (!club || money < club.membershipDues) return;
    setMoney((prev) => prev - club.membershipDues);
    setClubState((prev) => ({
      ...prev,
      subscriptionDueAt: Math.max(Date.now(), prev.subscriptionDueAt || 0) + GUILD_SUBSCRIPTION_CYCLE_MS,
      isSubscriptionActive: true,
    }));
  };

  const handleToggleAutoRenew = () => {
    setClubState((prev) => ({
      ...prev,
      autoRenew: prev.autoRenew === false ? true : false,
    }));
  };

  const handleResignClub = () => {
    setClubState((prev) => ({
      ...prev,
      currentClubId: null,
      isSubscriptionActive: false,
      subscriptionDueAt: 0,
    }));
  };

  const handleFulfillTownBounty = (bounty: TownBounty) => {
    const matching = inventory.filter((f) => f.fishId === bounty.targetSpeciesId);
    if (matching.length < bounty.requiredCount) return;

    const usedIds = new Set(matching.slice(0, bounty.requiredCount).map((f) => f.catchId));
    setInventory((prev) => prev.filter((f) => !usedIds.has(f.catchId)));
    setMoney((prev) => prev + bounty.rewardCash);

    setClubState((prev) => ({
      ...prev,
      reputationPoints: {
        ...prev.reputationPoints,
        [bounty.targetClubId]: (prev.reputationPoints[bounty.targetClubId] || 0) + bounty.rewardClubRep,
      },
    }));

    setTownBounties((prev) => {
      const remaining = prev.filter((b) => b.id !== bounty.id);
      const freshPool = generateTownBounties(Date.now() + 1000);
      const nextBounty = freshPool.find((b) => !remaining.some((r) => r.id === b.id)) || freshPool[0];
      return [...remaining, { ...nextBounty, id: `town_bounty_${Date.now()}` }];
    });
  };

  const handleClearHatcheryTank = (tankId: TankId) => {
    setHatcheryTanks((prev) =>
      prev.map((t) =>
        t.id === tankId
          ? {
              ...t,
              speciesId: null,
              stage: 'empty',
              startedAt: 0,
              durationSec: 0,
              hasFood: false,
              clutchCount: 0,
              trophyCount: 0,
            }
          : t
      )
    );
  };

  // Commercial Fleet Empire Handlers
  const handleStartCommercialBusiness = (name: string) => {
    const trimmed = name.trim();
    if (money < 400 || !trimmed || commercialBusinessName) return;
    setMoney((prev) => prev - 400);
    setCommercialBusinessName(trimmed);
  };

  const handleBuyBoat = (boatDef: BoatDefinition) => {
    if (money < boatDef.price) return;
    setMoney((prev) => prev - boatDef.price);

    const existingCount = ownedBoats.filter((b) => b.boatDefId === boatDef.id).length;
    const newBoat: OwnedBoat = {
      instanceId: `boat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      boatDefId: boatDef.id,
      customName: `${boatDef.name} #${existingCount + 1}`,
      assignedCrewIds: [],
      installedUpgradeIds: [...ownedUpgradeIds],
      expedition: null,
    };

    setOwnedBoats((prev) => [...prev, newBoat]);
  };

  const handleBuyUpgrade = (upgrade: FleetUpgrade) => {
    if (money < upgrade.price || ownedUpgradeIds.includes(upgrade.id)) return;
    setMoney((prev) => prev - upgrade.price);
    setOwnedUpgradeIds((prev) => [...prev, upgrade.id]);
    setOwnedBoats((prev) =>
      prev.map((b) => ({
        ...b,
        installedUpgradeIds: Array.from(new Set([...b.installedUpgradeIds, upgrade.id])),
      }))
    );
  };

  const handleHireCrew = (crew: CrewMember) => {
    if (money < crew.hireCost) return;
    setMoney((prev) => prev - crew.hireCost);
    setHiredCrew((prev) => [...prev, crew]);
    setAvailableJobSeekers((prev) => prev.filter((c) => c.id !== crew.id));
  };

  const handleGiveCrewBonus = (crewId: string, amount: number) => {
    if (money < amount) return;
    setMoney((prev) => prev - amount);
    setHiredCrew((prev) =>
      prev.map((c) => {
        if (c.id !== crewId) return c;
        const currentLevel = c.moraleLevel || 0;
        const moraleGain = amount >= 100 ? 2 : 1;
        return {
          ...c,
          moraleLevel: Math.min(5, currentLevel + moraleGain),
          bonusPaidTotal: (c.bonusPaidTotal || 0) + amount,
        };
      })
    );
  };

  const handleRetireBoat = (boatInstanceId: string) => {
    const boat = ownedBoats.find((b) => b.instanceId === boatInstanceId);
    if (!boat || boat.expedition) return;
    setOwnedBoats((prev) => prev.filter((b) => b.instanceId !== boatInstanceId));
  };

  const handleAssignCrew = (boatInstanceId: string, crewId: string) => {
    const boat = ownedBoats.find((b) => b.instanceId === boatInstanceId);
    if (!boat) return;
    const boatDef = BOATS_CATALOG.find((b) => b.id === boat.boatDefId) || BOATS_CATALOG[0];
    if (boat.assignedCrewIds.length >= boatDef.crewCapacity) return;

    setOwnedBoats((prev) =>
      prev.map((b) => ({
        ...b,
        assignedCrewIds:
          b.instanceId === boatInstanceId
            ? Array.from(new Set([...b.assignedCrewIds, crewId]))
            : b.assignedCrewIds.filter((id) => id !== crewId),
      }))
    );
  };

  const handleUnassignCrew = (boatInstanceId: string, crewId: string) => {
    setOwnedBoats((prev) =>
      prev.map((b) =>
        b.instanceId === boatInstanceId
          ? { ...b, assignedCrewIds: b.assignedCrewIds.filter((id) => id !== crewId) }
          : b
      )
    );
  };

  const handleStartExpedition = (
    boatInstanceId: string,
    areaId: AreaId,
    focus: SearchFocus,
    baitId: CommercialBaitId,
    targetFishId?: number | null
  ) => {
    const boat = ownedBoats.find((b) => b.instanceId === boatInstanceId);
    if (!boat || boat.expedition) return;

    const boatDef = BOATS_CATALOG.find((b) => b.id === boat.boatDefId) || BOATS_CATALOG[0];
    const assignedCrew = hiredCrew.filter((c) => boat.assignedCrewIds.includes(c.id));
    if (assignedCrew.length === 0) return;

    const installedUpgrades = FLEET_UPGRADES.filter((u) => boat.installedUpgradeIds.includes(u.id));
    const durationSec = calculateVoyageDuration(
      boatDef,
      assignedCrew,
      installedUpgrades,
      areaId,
      baitId,
      targetFishId
    );
    const wageCost = calculateExpeditionWageCost(assignedCrew);
    const baitDef = COMMERCIAL_BAITS.find((b) => b.id === baitId) || COMMERCIAL_BAITS[0];
    const totalCost = wageCost + baitDef.price;

    if (money < totalCost) return;
    setMoney((prev) => prev - totalCost);

    setOwnedBoats((prev) =>
      prev.map((b) =>
        b.instanceId === boatInstanceId
          ? {
              ...b,
              expedition: {
                startedAt: Date.now(),
                durationSec,
                destinationAreaId: areaId,
                searchFocus: focus,
                baitId,
                wageCost,
                targetFishId: targetFishId ?? null,
                isCompleted: false,
              },
            }
          : b
      )
    );
  };

  const handleClaimHaulToBox = (boatInstanceId: string) => {
    const boat = ownedBoats.find((b) => b.instanceId === boatInstanceId);
    if (!boat?.expedition?.resolvedHaul) return;

    const haul = boat.expedition.resolvedHaul;
    setInventory((prev) => [...haul, ...prev]);

    setCatalog((prev) => {
      const next = { ...prev };
      haul.forEach((fish) => {
        const cur = next[fish.fishId] || {
          caughtCount: 0,
          maxWeight: 0,
          hasTrophy: false,
          firstCaughtAt: Date.now(),
        };
        next[fish.fishId] = {
          caughtCount: cur.caughtCount + 1,
          maxWeight: Math.max(cur.maxWeight, fish.weight),
          hasTrophy: cur.hasTrophy || fish.isTrophy,
          firstCaughtAt: cur.firstCaughtAt,
        };
      });
      return next;
    });

    setCommercialStats((prev) => ({
      ...prev,
      totalExpeditionsCount: prev.totalExpeditionsCount + 1,
      totalFishLanded: prev.totalFishLanded + haul.length,
    }));

    setOwnedBoats((prev) =>
      prev.map((b) => (b.instanceId === boatInstanceId ? { ...b, expedition: null } : b))
    );
  };

  const handleSellHaulDirect = (boatInstanceId: string) => {
    const boat = ownedBoats.find((b) => b.instanceId === boatInstanceId);
    if (!boat?.expedition?.resolvedHaul) return;

    const haul = boat.expedition.resolvedHaul;
    const baseVal = haul.reduce((sum, f) => sum + f.value, 0);
    const wholesaleVal = Math.round(baseVal * 1.15);

    setMoney((prev) => prev + wholesaleVal);

    setCatalog((prev) => {
      const next = { ...prev };
      haul.forEach((fish) => {
        const cur = next[fish.fishId] || {
          caughtCount: 0,
          maxWeight: 0,
          hasTrophy: false,
          firstCaughtAt: Date.now(),
        };
        next[fish.fishId] = {
          caughtCount: cur.caughtCount + 1,
          maxWeight: Math.max(cur.maxWeight, fish.weight),
          hasTrophy: cur.hasTrophy || fish.isTrophy,
          firstCaughtAt: cur.firstCaughtAt,
        };
      });
      return next;
    });

    setCommercialStats((prev) => ({
      ...prev,
      totalFleetRevenue: prev.totalFleetRevenue + wholesaleVal,
      totalExpeditionsCount: prev.totalExpeditionsCount + 1,
      totalFishLanded: prev.totalFishLanded + haul.length,
    }));

    setOwnedBoats((prev) =>
      prev.map((b) => (b.instanceId === boatInstanceId ? { ...b, expedition: null } : b))
    );
  };

  const handleRenameBoat = (boatInstanceId: string, newName: string) => {
    setOwnedBoats((prev) =>
      prev.map((b) => (b.instanceId === boatInstanceId ? { ...b, customName: newName } : b))
    );
  };

  const handleCallInEarly = (boatInstanceId: string) => {
    const now = Date.now();
    setOwnedBoats((prev) =>
      prev.map((boat) => {
        if (boat.instanceId !== boatInstanceId || !boat.expedition || boat.expedition.isCompleted) {
          return boat;
        }

        const elapsedSec = (now - boat.expedition.startedAt) / 1000;
        const fraction = Math.min(1.0, Math.max(0, elapsedSec / Math.max(1, boat.expedition.durationSec)));

        const boatDef =
          BOATS_CATALOG.find((b) => b.id === boat.boatDefId) || BOATS_CATALOG[0];
        const assignedCrew = hiredCrew.filter((c) =>
          boat.assignedCrewIds.includes(c.id)
        );
        const installedUpgrades = FLEET_UPGRADES.filter((u) =>
          boat.installedUpgradeIds.includes(u.id)
        );

        const haul = calculateExpeditionHaul(
          boat,
          boatDef,
          assignedCrew,
          installedUpgrades,
          boat.expedition,
          commercialOrders,
          fraction,
          isClubPerkActive(clubState, 'commercial')
        );

        return {
          ...boat,
          expedition: {
            ...boat.expedition,
            isCompleted: true,
            resolvedHaul: haul.fishes,
          },
        };
      })
    );
  };

  // Town Restaurant Handlers
  const handleStockFishToPantry = (speciesId: number, count = 1) => {
    const matching = inventory.filter((f) => f.fishId === speciesId);
    if (matching.length === 0) return;
    const toTake = matching.slice(0, count);
    const takeIds = new Set(toTake.map((f) => f.catchId));

    setInventory((prev) => prev.filter((f) => !takeIds.has(f.catchId)));
    setRestaurantState((prev) => ({
      ...prev,
      pantry: {
        ...prev.pantry,
        [speciesId]: (prev.pantry[speciesId] || 0) + toTake.length,
      },
    }));
  };

  const handleStockAllFromBox = () => {
    if (inventory.length === 0) return;
    const counts: Record<number, number> = {};
    for (const f of inventory) {
      counts[f.fishId] = (counts[f.fishId] || 0) + 1;
    }
    setInventory([]);
    setRestaurantState((prev) => {
      const nextPantry = { ...prev.pantry };
      for (const [sId, qty] of Object.entries(counts)) {
        const idNum = Number(sId);
        nextPantry[idNum] = (nextPantry[idNum] || 0) + qty;
      }
      return {
        ...prev,
        pantry: nextPantry,
      };
    });
  };

  const handleUnstockFishFromPantry = (speciesId: number, count = 1) => {
    const currentCount = restaurantState.pantry[speciesId] || 0;
    if (currentCount <= 0) return;
    const toReturn = Math.min(currentCount, count);

    const species = FISH_COLLECTION.find((f) => f.id === speciesId);
    if (!species) return;

    const returnedFish: CaughtFish[] = [];
    const now = Date.now();
    for (let i = 0; i < toReturn; i++) {
      returnedFish.push({
        catchId: `pantry_return_${now}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        fishId: species.id,
        name: species.name,
        tier: species.tier,
        weight: Number(((species.minWeight + species.maxWeight) / 2).toFixed(2)),
        isTrophy: false,
        value: species.basePrice,
        caughtAt: now,
        areaId: species.areaId,
      });
    }

    setInventory((prev) => [...returnedFish, ...prev]);
    setRestaurantState((prev) => ({
      ...prev,
      pantry: {
        ...prev.pantry,
        [speciesId]: currentCount - toReturn,
      },
    }));
  };

  const handleUnstockAllToBox = () => {
    const returnedFish: CaughtFish[] = [];
    const now = Date.now();
    for (const [sIdStr, count] of Object.entries(restaurantState.pantry)) {
      const sId = Number(sIdStr);
      const species = FISH_COLLECTION.find((f) => f.id === sId);
      if (!species || count <= 0) continue;
      for (let i = 0; i < count; i++) {
        returnedFish.push({
          catchId: `pantry_return_all_${now}_${sId}_${i}`,
          fishId: species.id,
          name: species.name,
          tier: species.tier,
          weight: Number(((species.minWeight + species.maxWeight) / 2).toFixed(2)),
          isTrophy: false,
          value: species.basePrice,
          caughtAt: now,
          areaId: species.areaId,
        });
      }
    }
    if (returnedFish.length === 0) return;
    setInventory((prev) => [...returnedFish, ...prev]);
    setRestaurantState((prev) => ({
      ...prev,
      pantry: {},
    }));
  };

  const handleBuyWholesaleFish = (speciesId: number, pricePerFish: number, count = 1) => {
    const cost = pricePerFish * count;
    if (money < cost) return;
    setMoney((m) => m - cost);
    setRestaurantState((prev) => ({
      ...prev,
      pantry: {
        ...prev.pantry,
        [speciesId]: (prev.pantry[speciesId] || 0) + count,
      },
    }));
  };

  const handleHireRestaurantStaff = (staffId: string) => {
    const candidate = RESTAURANT_STAFF_CANDIDATES.find((s) => s.id === staffId);
    if (!candidate || money < candidate.wagePerService || restaurantState.hiredStaffIds.includes(staffId)) return;
    setMoney((m) => m - candidate.wagePerService);
    setRestaurantState((prev) => ({
      ...prev,
      hiredStaffIds: [...prev.hiredStaffIds, staffId],
    }));
  };

  const handleBuyRestaurantExpansion = (expansionId: string) => {
    const exp = RESTAURANT_EXPANSIONS.find((e) => e.id === expansionId);
    if (!exp || money < exp.cost || restaurantState.unlockedExpansionIds.includes(expansionId)) return;
    setMoney((m) => m - exp.cost);
    setRestaurantState((prev) => ({
      ...prev,
      unlockedExpansionIds: [...prev.unlockedExpansionIds, expansionId],
    }));
  };

  const handleRenameRestaurant = (name: string) => {
    if (!name.trim()) return;
    setRestaurantState((prev) => ({
      ...prev,
      name: name.trim(),
    }));
  };

  const handleRunDinnerService = (
    prepStyleId = 'pan_fry',
    allowedDishIds?: string[]
  ): DinnerServiceResult | null => {
    const hiredStaff = RESTAURANT_STAFF_CANDIDATES.filter((s) =>
      restaurantState.hiredStaffIds.includes(s.id)
    );
    const unlockedExpansions = RESTAURANT_EXPANSIONS.filter((e) =>
      restaurantState.unlockedExpansionIds.includes(e.id)
    );

    const result = runDinnerService(
      restaurantState.pantry,
      hiredStaff,
      unlockedExpansions,
      prepStyleId,
      allowedDishIds
    );

    if (result.mealsServedCount === 0) return null;

    setMoney((m) => m + result.netProfit);
    setRestaurantState((prev) => {
      const nextPantry = { ...prev.pantry };
      for (const [fishIdStr, consumedQty] of Object.entries(result.pantryConsumed)) {
        const fId = Number(fishIdStr);
        nextPantry[fId] = Math.max(0, (nextPantry[fId] || 0) - consumedQty);
      }
      return {
        ...prev,
        pantry: nextPantry,
        totalMealsServed: prev.totalMealsServed + result.mealsServedCount,
        totalEarnings: prev.totalEarnings + result.netProfit,
        reputation: prev.reputation + result.mealsServedCount * 2,
      };
    });

    return result;
  };

  handleRunDinnerServiceRef.current = handleRunDinnerService;

  const handleToggleRestaurantAutomation = (
    setting: 'autoDinnerRush' | 'autoRestockFromBox' | 'autoProcureWholesale'
  ) => {
    setRestaurantState((prev) => ({
      ...prev,
      [setting]: prev[setting] === false ? true : false,
    }));
  };

  const handleSelectPrepStyle = (prepStyleId: string) => {
    setRestaurantState((prev) => ({
      ...prev,
      activePrepStyleId: prepStyleId,
    }));
  };

  // Reset Game Progress
  const handleConfirmReset = () => {
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    if (biteWindowTimerRef.current) clearTimeout(biteWindowTimerRef.current);
    if (reelingTimerRef.current) clearInterval(reelingTimerRef.current);

    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('cozy_reel_save_v7');
    } catch {}

    setMoney(0);
    setUnlockedAreaIds(['pond']);
    setSelectedAreaId('pond');
    setOwnedRodIds(['stick']);
    setOwnedReelIds(['plastic_spool']);
    setOwnedLureIds(['none']);
    setEquippedRodId('stick');
    setEquippedReelId('plastic_spool');
    setEquippedLureId('none');
    setInventory([]);
    setCatalog({});
    setUnlockedTrapSlots(0);
    setTraps(DEFAULT_TRAPS);
    setWeatherId('clear');
    setPrivateOrders(generateMarketOrders(['pond'], 3));
    setCommercialOrders(generateCommercialOrders(['pond'], 4, 1));
    setOwnedBoats([]);
    setHiredCrew([]);
    setAvailableJobSeekers(generateJobSeekers([]));
    setOwnedUpgradeIds([]);
    setHatcheryTanks(INITIAL_HATCHERY_TANKS);
    setHatcheryUpgrades([]);
    setHatcheryUnlocked(false);
    setLiveBaitCharges(0);
    setCommercialBusinessName(null);
    setRestaurantState({
      name: 'The Salty Anchor Tavern & Grill',
      unlocked: true,
      pantry: {},
      hiredStaffIds: [],
      unlockedExpansionIds: [],
      totalMealsServed: 0,
      totalEarnings: 0,
      reputation: 0,
    });
    setCommercialStats({
      totalFleetRevenue: 0,
      totalExpeditionsCount: 0,
      totalFishLanded: 0,
    });
    setCastState('idle');
    setPendingCatch(null);
    setPendingJunk(null);
    setIsNewRecord(false);
    setShowResetConfirm(false);
    setActiveTab('fish');
  };

  const unlockedCommercial =
    Boolean(commercialBusinessName) ||
    ownedBoats.length > 0;

  const readyHaulsCount = ownedBoats.filter(
    (b) => b.expedition && b.expedition.isCompleted
  ).length;

  const readyHatcheryCount = hatcheryTanks.filter(
    (t) => t.unlocked && t.stage === 'mature'
  ).length;

  const caughtSpeciesCount = Object.keys(catalog).filter(
    (id) => catalog[Number(id)]?.caughtCount > 0
  ).length;

  const unlockedGuideCount = Object.keys(catalog).filter(
    (id) => (catalog[Number(id)]?.caughtCount || 0) >= 1
  ).length;

  return (
    <div
      className={`min-h-screen ${activeArea.theme.bgClass} text-[#e3e6eb] select-none p-3 sm:p-6 flex flex-col justify-start transition-colors duration-200`}
    >
      <div className="w-full max-w-2xl mx-auto space-y-3">
        {/* Header */}
        <header
          className={`border ${activeArea.theme.borderClass} ${activeArea.theme.panelClass} p-3.5 flex items-center justify-between text-xs transition-colors`}
        >
          <div className="font-bold text-sm text-[#f1f3f5] tracking-wide flex items-center gap-2">
            <span>Fishing</span>
            <span className="text-[11px] text-[#717885]">· {activeArea.name}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span
              className="text-amber-300 font-semibold text-[11px] border border-[#2d323c] bg-[#16181d] px-2 py-0.5"
              title={currentWeather.waterEffect}
            >
              Weather: {currentWeather.name}
            </span>
            <span className="font-bold text-emerald-400 text-sm">
              ${money.toLocaleString()}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="text-[11px] font-bold text-[#c5cbdb] hover:text-[#f1f3f5] border border-[#393f4e] hover:border-sky-500 bg-[#1a1c22] hover:bg-[#22252e] px-2.5 py-1 cursor-pointer transition-colors"
              title="Open Game Settings"
            >
              Settings
            </button>
          </div>
        </header>

        {/* Dev Code Activated Banner */}
        {devCodeBanner && (
          <div className="border border-emerald-500 bg-emerald-950/90 p-3 text-center text-xs font-bold text-emerald-200 animate-pulse">
            {devCodeBanner}
          </div>
        )}

        {/* In-app Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="border border-rose-800/80 bg-[#1c1214] p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-rose-900/50 pb-2">
              <span className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                Reset Game Progress
              </span>
              <span className="text-rose-400 font-bold">Are you sure?</span>
            </div>
            <p className="text-[#c9ced6] text-xs leading-relaxed">
              This will permanently wipe all catches, discovered species in your log, unlocked areas, trapping gear, commercial vessels, and purchased rods, reels, and bait. Your game will return to the starting stick at Willow Pond.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmReset}
                className="py-1.5 px-3.5 border border-rose-600 bg-rose-950/90 hover:bg-rose-900 text-rose-200 font-bold cursor-pointer text-xs transition-colors"
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-1.5 px-3.5 border border-[#3b404c] bg-[#22252c] hover:bg-[#2c303b] text-[#f1f3f5] font-bold cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs (9 Tabs: Fish, Box, Shop, Traps, Hatchery, Fleet, Town, Areas, Guide) */}
        <nav className="grid grid-cols-3 sm:grid-cols-9 gap-1 text-[11px] sm:text-xs">
          <button
            onClick={() => setActiveTab('fish')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors ${
              activeTab === 'fish'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Fish
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors ${
              activeTab === 'inventory'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Box
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors ${
              activeTab === 'shop'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Shop
          </button>
          <button
            onClick={() => setActiveTab('traps')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors ${
              activeTab === 'traps'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Traps
          </button>
          <button
            onClick={() => setActiveTab('hatchery')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors relative ${
              activeTab === 'hatchery'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            <span>Hatchery</span>
            {readyHatcheryCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors relative ${
              activeTab === 'fleet'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            <span>Fleet</span>
            {readyHaulsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('town')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors relative ${
              activeTab === 'town'
                ? 'border-amber-600 bg-amber-950/60 text-amber-200'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            <span>Town</span>
            {isRumorActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('areas')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors ${
              activeTab === 'areas'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Areas
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-1 border text-center font-bold cursor-pointer transition-colors ${
              activeTab === 'guide'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Guide
          </button>
        </nav>

        {/* Tab Content */}
        {activeTab === 'fish' && (
          <div className="space-y-3">
            {/* Gear & Setup Bar */}
            <div
              className={`border-2 ${activeArea.theme.borderClass} ${activeArea.theme.panelClass} p-3.5 text-xs space-y-3 transition-colors`}
            >
              {/* Area Location & Setup Info (No Area Description) */}
              <div className="flex items-center justify-between border-b border-[#242930] pb-2 text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#8c94a2] font-semibold">Area:</span>
                  <span className={`font-bold text-sm ${activeArea.theme.accentClass}`}>
                    {activeArea.name}
                  </span>
                </div>
                <div className="text-[11px] text-[#a0aec0] font-semibold">
                  {equippedRod.name} · {equippedReel.name} · {equippedLure.name} · {getWaitSpeedLabel(equippedRod.waitSeconds)} wait
                </div>
              </div>

              {/* Selectors Row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Rod */}
                <div className="flex items-center gap-3">
                  <img
                    src={getRodSpriteUrl(equippedRodId)}
                    alt="Equipped Rod"
                    className="w-28 h-20 sm:w-32 sm:h-22 object-contain select-none shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#8c94a2] font-semibold">Rod:</span>
                    <select
                      value={equippedRodId}
                      onChange={(e) => handleEquipRod(e.target.value)}
                      aria-label="Equipped Rod"
                      className="border-2 border-[#323640] bg-[#141518] px-2.5 py-1.5 text-[#f1f3f5] font-bold cursor-pointer focus:outline-none"
                    >
                      {ownedRodIds.map((id) => {
                        const r = RODS.find((rod) => rod.id === id);
                        return (
                          <option key={id} value={id}>
                            {r?.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Reel */}
                <div className="flex items-center gap-3">
                  <img
                    src={getReelSpriteUrl(equippedReelId)}
                    alt="Equipped Reel"
                    className="w-14 h-14 object-contain select-none shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#8c94a2] font-semibold">Reel:</span>
                    <select
                      value={equippedReelId}
                      onChange={(e) => handleEquipReel(e.target.value)}
                      aria-label="Equipped Reel"
                      className="border-2 border-[#323640] bg-[#141518] px-2.5 py-1.5 text-[#f1f3f5] font-bold cursor-pointer focus:outline-none"
                    >
                      {ownedReelIds.map((id) => {
                        const rl = REELS.find((reel) => reel.id === id);
                        return (
                          <option key={id} value={id}>
                            {rl?.name} · {rl?.speedMultiplier}x
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Bait / Lure */}
                <div className="flex items-center gap-3">
                  <img
                    src={getLureSpriteUrl(equippedLureId)}
                    alt="Equipped Bait/Lure"
                    className="w-14 h-14 object-contain select-none shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#8c94a2] font-semibold">Bait/Lure:</span>
                    <select
                      value={equippedLureId}
                      onChange={(e) => handleEquipLure(e.target.value)}
                      aria-label="Equipped Bait or Lure"
                      className="border-2 border-[#323640] bg-[#141518] px-2.5 py-1.5 text-[#f1f3f5] font-bold cursor-pointer focus:outline-none"
                    >
                      {ownedLureIds.map((id) => {
                        const l = LURES.find((lure) => lure.id === id);
                        return (
                          <option key={id} value={id}>
                            {l?.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Fishing Action Area */}
            <FishingArea
              castState={castState}
              rod={equippedRod}
              reel={equippedReel}
              lure={equippedLure}
              activeArea={activeArea}
              weather={currentWeather}
              reelingRemainingSec={reelingRemainingSec}
              reelingProgressPercent={reelingProgressPercent}
              pendingCatch={pendingCatch}
              pendingJunk={pendingJunk}
              pendingTreasureGold={pendingTreasureGold}
              isNewRecord={isNewRecord}
              liveBaitCharges={liveBaitCharges}
              useLiveBait={useLiveBait}
              weatherSightingActive={isRumorActive}
              weatherSightingSpeciesName={rumorSpecies.name}
              onToggleLiveBait={setUseLiveBait}
              onCast={handleCast}
              onReel={handleReelIn}
              onCancel={handleCancelCast}
              onKeep={handleKeepFish}
              onDismissJunk={handleDismissJunk}
              onClaimTreasure={handleClaimTreasure}
              onResetToIdle={() => setCastState('idle')}
            />
          </div>
        )}

        {activeTab === 'areas' && (
          <AreasTab
            money={money}
            unlockedAreaIds={unlockedAreaIds}
            selectedAreaId={selectedAreaId}
            catalogMap={catalog}
            onUnlockArea={handleUnlockArea}
            onSelectArea={handleSelectArea}
          />
        )}

        {activeTab === 'traps' && (
          <TrapsTab
            money={money}
            traps={traps}
            inventory={inventory}
            unlockedTrapSlots={unlockedTrapSlots}
            unlockedAreaIds={unlockedAreaIds}
            onHarvestTrap={handleHarvestTrap}
            onSetTrapArea={handleSetTrapArea}
            onBaitTrap={handleBaitTrap}
            onBaitTrapWithFish={handleBaitTrapWithFish}
            onUpgradeTrapModel={handleUpgradeTrapModel}
            onUnlockTrapSlot={handleUnlockTrapSlot}
          />
        )}

        {activeTab === 'hatchery' && (
          <HatcheryTab
            money={money}
            inventory={inventory}
            hatcheryTanks={hatcheryTanks}
            hatcheryUpgrades={hatcheryUpgrades}
            liveBaitCharges={liveBaitCharges}
            onUnlockTank={handleUnlockTank}
            onBuyUpgrade={handleBuyHatcheryUpgrade}
            onStartBreeding={handleStartBreeding}
            onFeedTank={handleFeedTank}
            onSellBatch={handleSellHatcheryBatch}
            onHarvestBait={handleHarvestHatcheryBait}
            onTransferToBox={handleTransferHatcheryToBox}
            onPartialHarvest={handlePartialHarvest}
            onClearTank={handleClearHatcheryTank}
            hatcheryUnlocked={hatcheryUnlocked}
            onUnlockHatchery={handleUnlockHatchery}
          />
        )}

        {activeTab === 'town' && (
          <TownTab
            money={money}
            inventory={inventory}
            privateOrders={privateOrders}
            commercialOrders={commercialOrders}
            townBounties={townBounties}
            civicInvestments={civicInvestments}
            clubState={clubState}
            restaurantState={restaurantState}
            currentAreaId={selectedAreaId}
            currentWeatherId={weatherId}
            weatherShiftRemainingSec={weatherShiftRemainingSec}
            onFulfillPrivateOrder={handleFulfillPrivateOrder}
            onDeclinePrivateOrder={handleDeclinePrivateOrder}
            onFulfillCommercialOrder={handleFulfillCommercialOrder}
            onRerollCommercialOrder={handleRerollCommercialOrder}
            onFulfillTownBounty={handleFulfillTownBounty}
            onBuyCivicInvestment={handleBuyCivicInvestment}
            onJoinClub={handleJoinClub}
            onRenewSubscription={handleRenewSubscription}
            onToggleAutoRenew={handleToggleAutoRenew}
            onResignClub={handleResignClub}
            onStockFishToPantry={handleStockFishToPantry}
            onStockAllFromBox={handleStockAllFromBox}
            onUnstockFishFromPantry={handleUnstockFishFromPantry}
            onUnstockAllToBox={handleUnstockAllToBox}
            onBuyWholesaleFish={handleBuyWholesaleFish}
            onHireRestaurantStaff={handleHireRestaurantStaff}
            onBuyRestaurantExpansion={handleBuyRestaurantExpansion}
            onRenameRestaurant={handleRenameRestaurant}
            onRunDinnerService={handleRunDinnerService}
            autoRushCountdownSec={autoRushCountdownSec}
            onToggleRestaurantAutomation={handleToggleRestaurantAutomation}
            onSelectPrepStyle={handleSelectPrepStyle}
          />
        )}

        {activeTab === 'fleet' && (
          <CommercialTab
            money={money}
            ownedBoats={ownedBoats}
            hiredCrew={hiredCrew}
            availableJobSeekers={availableJobSeekers}
            onRefreshJobSeekers={handleRefreshJobSeekers}
            unlockedAreaIds={unlockedAreaIds}
            commercialStats={commercialStats}
            catalogMap={catalog}
            inventory={inventory}
            commercialBusinessName={commercialBusinessName}
            onStartCommercialBusiness={handleStartCommercialBusiness}
            onHireCrew={handleHireCrew}
            onAssignCrew={handleAssignCrew}
            onUnassignCrew={handleUnassignCrew}
            onStartExpedition={handleStartExpedition}
            onClaimHaulToBox={handleClaimHaulToBox}
            onSellHaulDirect={handleSellHaulDirect}
            onRenameBoat={handleRenameBoat}
            onCallInEarly={handleCallInEarly}
            onRetireBoat={handleRetireBoat}
            onGiveCrewBonus={handleGiveCrewBonus}
          />
        )}

        {activeTab === 'shop' && (
          <Shop
            money={money}
            ownedRodIds={ownedRodIds}
            ownedReelIds={ownedReelIds}
            ownedLureIds={ownedLureIds}
            equippedRodId={equippedRodId}
            equippedReelId={equippedReelId}
            equippedLureId={equippedLureId}
            unlockedCommercial={unlockedCommercial}
            ownedBoats={ownedBoats}
            ownedUpgradeIds={ownedUpgradeIds}
            onBuyRod={handleBuyRod}
            onBuyReel={handleBuyReel}
            onBuyLure={handleBuyLure}
            onEquipRod={handleEquipRod}
            onEquipReel={handleEquipReel}
            onEquipLure={handleEquipLure}
            onBuyBoat={handleBuyBoat}
            onBuyUpgrade={handleBuyUpgrade}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            fishList={inventory}
            onSellFish={handleSellFish}
            onSellBatch={handleSellFishBatch}
            onSellAll={handleSellAll}
          />
        )}

        {activeTab === 'guide' && (
          <Guide
            catalogMap={catalog}
            currentWeather={currentWeather}
            inventory={inventory}
            hatcheryTanks={hatcheryTanks}
          />
        )}

        {/* Footer */}
        <footer className="pt-2 text-center text-[11px] text-[#555d6b] flex items-center justify-end border-t border-[#1d2026]">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-[#717885] hover:text-rose-400 underline underline-offset-2 cursor-pointer"
          >
            Reset Game Progress
          </button>
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isSoundMuted={isSoundMuted}
        onToggleMute={handleToggleSound}
        onRequestReset={() => setShowResetConfirm(true)}
      />
    </div>
  );
}

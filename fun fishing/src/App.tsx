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
  getFishSpriteUrl,
  getRarityBadgeStyle,
  getLureAreaEffectiveness,
} from './game/fishingLogic';
import { soundManager } from './game/audioLogic';
import { preloadGameAssets, preloadCriticalGameAssets } from './game/preloadAssets';
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
import { WhalingTab } from './components/WhalingTab';
import {
  isWhalingUnlocked,
  hasQualifyingWhalingRod,
  hasQualifyingWhalingReel,
  WHALING_UNLOCK_COST,
  WhaleCatalogEntry,
  WHALE_SPECIES,
  CaughtWhale,
} from './game/whalingLogic';
import {
  HatcheryTank,
  TankId,
  FeedType,
  HatcheryUpgradeId,
  HatcheryMutation,
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
  SalvageState,
  INITIAL_SALVAGE_STATE,
  SALVAGE_BOATS_CATALOG,
  SUNKEN_WRECK_SITES,
  rollRecoveredTreasuresForVoyage,
  calculateExpeditionDurationSec,
  createAuctionListing,
  getDiscoveredArtifactIds,
} from './game/salvageLogic';
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
  getBoatRetireValue,
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

  const [whalingUnlocked, setWhalingUnlocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof JSON.parse(saved).whalingUnlocked === 'boolean') {
        return JSON.parse(saved).whalingUnlocked;
      }
    } catch {}
    return false;
  });

  const hasWhaleRod = hasQualifyingWhalingRod(ownedRodIds);
  const hasWhaleReel = hasQualifyingWhalingReel(ownedReelIds);
  const isWhalingAvailable = isWhalingUnlocked(ownedRodIds, ownedReelIds, whalingUnlocked);

  const [inventory, setInventory] = useState<CaughtFish[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const rawInventory: CaughtFish[] = JSON.parse(saved).inventory ?? [];
        return rawInventory.map((f) => {
          const sp = FISH_COLLECTION.find((s) => s.id === f.fishId);
          if (sp && sp.trophyWeight) {
            return { ...f, isTrophy: f.weight >= sp.trophyWeight };
          }
          return f;
        });
      }
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

  const [whaleCatalog, setWhaleCatalog] = useState<Record<string, WhaleCatalogEntry>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).whaleCatalog) {
        return JSON.parse(saved).whaleCatalog;
      }
    } catch {}
    return {};
  });

  const handleWhaleCaught = (whale: CaughtWhale) => {
    setWhaleCatalog((prev) => {
      const existing = prev[whale.speciesId] || { caughtCount: 0, maxWeight: 0 };
      return {
        ...prev,
        [whale.speciesId]: {
          caughtCount: existing.caughtCount + 1,
          maxWeight: Math.max(existing.maxWeight, whale.weightLbs),
          firstCaughtAt: existing.firstCaughtAt || Date.now(),
        },
      };
    });
  };

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

  // Preload all game visual sprites and audio for instant web play
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatusText, setLoadingStatusText] = useState('Preparing rods, reels & lures...');
  const [loadingFish] = useState(() => {
    const candidates = FISH_COLLECTION.filter((f) => f.tier === 'common');
    if (candidates.length === 0) return FISH_COLLECTION[0];
    return candidates[Math.floor(Math.random() * candidates.length)];
  });

  useEffect(() => {
    let isMounted = true;
    let actualAssetsDone = false;
    let currentProgress = 0;

    preloadCriticalGameAssets().then(() => {
      actualAssetsDone = true;
    });

    const startTime = Date.now();
    const MINIMUM_LOADING_DURATION_MS = 3200; // Intentional 3.2s retro load duration

    const interval = setInterval(() => {
      if (!isMounted) return;
      const elapsed = Date.now() - startTime;
      const timeRatio = Math.min(1, elapsed / MINIMUM_LOADING_DURATION_MS);

      let targetPct = Math.round(timeRatio * 100);

      if (!actualAssetsDone && targetPct > 92) {
        targetPct = 92;
      }

      currentProgress = Math.max(currentProgress, targetPct);
      setLoadingProgress(currentProgress);

      if (currentProgress < 25) {
        setLoadingStatusText('Preparing rods, reels & lures...');
      } else if (currentProgress < 50) {
        setLoadingStatusText('Checking harbor tides & weather...');
      } else if (currentProgress < 75) {
        setLoadingStatusText('Stocking native fish waters...');
      } else if (currentProgress < 100) {
        setLoadingStatusText('Arranging the tackle box...');
      } else {
        setLoadingStatusText('Ready to cast!');
      }

      if (currentProgress >= 100 && actualAssetsDone) {
        clearInterval(interval);
        setTimeout(() => {
          if (isMounted) setIsLoadingAssets(false);
        }, 320);
      }
    }, 40);

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        clearInterval(interval);
        setLoadingProgress(100);
        setIsLoadingAssets(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
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
  const [fishingSubTab, setFishingSubTab] = useState<'rod' | 'whaling'>('rod');

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

  // Deep Sea Shipwreck Salvage State
  const [salvageState, setSalvageState] = useState<SalvageState>(() => {
    try {
      const saved = localStorage.getItem('cozy_reel_salvage_state_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SALVAGE_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cozy_reel_salvage_state_v1', JSON.stringify(salvageState));
    } catch {}
  }, [salvageState]);

  // Live auction bidding and salvage expedition ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSalvageState((prev) => {
        if (!prev.unlocked) return prev;
        const now = Date.now();
        let changed = false;

        const updatedAuctions = prev.activeAuctions.map((auc) => {
          if (auc.status === 'sold' || auc.status === 'unsold') return auc;
          if (now >= auc.concludesAt) {
            changed = true;
            const isUnsold = auc.startPrice > auc.maxBuyerWillingness || auc.bidsPlacedCount === 0;
            return {
              ...auc,
              currentBid: isUnsold ? auc.startPrice : auc.finalHammerPrice,
              status: (isUnsold ? 'unsold' : 'sold') as const,
            };
          }

          if (auc.startPrice > auc.maxBuyerWillingness) {
            // Price set higher than collectors are willing to pay; no bids placed
            return auc;
          }

          const elapsed = now - auc.startedAt;
          const progress = Math.min(1, Math.max(0, elapsed / (auc.durationSec * 1000)));
          const targetBid = Math.round(
            auc.startPrice + (auc.finalHammerPrice - auc.startPrice) * progress
          );

          if (targetBid > auc.currentBid) {
            changed = true;
            return {
              ...auc,
              currentBid: targetBid,
              bidsPlacedCount: Math.max(auc.bidsPlacedCount, Math.floor(progress * 6) + 1),
            };
          }
          return auc;
        });

        if (changed) {
          return {
            ...prev,
            activeAuctions: updatedAuctions,
          };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch {
      // Browsers may block fullscreen without direct user gesture or if embedded in an iframe
    }
  };

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

  // Ambient soundscape for active area
  useEffect(() => {
    if (activeTab === 'fish' && fishingSubTab === 'whaling' && isWhalingAvailable) {
      soundManager.playAreaAmbience('ocean');
    } else {
      soundManager.playAreaAmbience(activeArea.id);
    }
  }, [activeArea.id, activeTab, fishingSubTab, isWhalingAvailable]);

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
          whalingUnlocked,
          whaleCatalog,
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
    whalingUnlocked,
    whaleCatalog,
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

    const duration = rollWaitTime(equippedRod, equippedLure, activeArea.id);
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
          const highestAreaIndex = Math.max(
            ...unlockedAreaIds.map((id) => FISHING_AREAS.findIndex((a) => a.id === id)),
            0
          );
          // High-value windfall scaling with unlocked world progression:
          // pond: $3,500, river: $5,000, lake: $8,000, bayou: $15,000, glacial: $25,000, ocean: $50,000, reef: $100,000, trench: $250,000
          const tierMinimums = [3500, 5000, 8000, 15000, 25000, 50000, 100000, 250000];
          const minByProgression = tierMinimums[highestAreaIndex] ?? 5000;
          const randomBonus = Math.round(Math.random() * (minByProgression * 0.5));
          const wealthScaled = Math.round(money * (0.75 + Math.random() * 0.75));
          const reward = Math.max(minByProgression + randomBonus, wealthScaled);
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
      soundManager.playRegisterSfx();
      setMoney((prev) => prev + pendingTreasureGold);
      setPendingTreasureGold(null);
    }
    setCastState('idle');
  };

  // Global Keyboard Controls (Space / Enter for Cast, Bite Strike, and Reel-In; Esc to cancel or close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keystrokes when typing into text inputs, textareas, or selects
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Escape: Close open modals, or cancel active cast
      if (e.key === 'Escape') {
        if (showSettings) {
          e.preventDefault();
          setShowSettings(false);
          return;
        }
        if (showResetConfirm) {
          e.preventDefault();
          setShowResetConfirm(false);
          return;
        }
        if (activeTab === 'fish' && (castState === 'waiting' || castState === 'nibble')) {
          e.preventDefault();
          handleCancelCast();
          return;
        }
      }

      // Space or Enter: Cast Line, strike on bite, Reel In, dismiss/keep catch
      if (e.key === ' ' || e.key === 'Enter') {
        // Prevent default spacebar window scrolling
        if (e.key === ' ') {
          e.preventDefault();
        }

        if (activeTab === 'fish') {
          if (castState === 'idle') {
            e.preventDefault();
            handleCast();
          } else if (castState === 'bite') {
            e.preventDefault();
            handleReelIn();
          } else if (castState === 'caught') {
            e.preventDefault();
            handleKeepFish();
          } else if (castState === 'escaped' || castState === 'nothing') {
            e.preventDefault();
            setCastState('idle');
          } else if (castState === 'junk') {
            e.preventDefault();
            handleDismissJunk();
          } else if (castState === 'treasure') {
            e.preventDefault();
            handleClaimTreasure();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    castState,
    showSettings,
    showResetConfirm,
    handleCast,
    handleReelIn,
    handleCancelCast,
    handleKeepFish,
    handleDismissJunk,
    handleClaimTreasure,
  ]);

  const handleSellFish = (catchId: string) => {
    const item = inventory.find((f) => f.catchId === catchId);
    if (!item || item.isLocked) return;
    const hasColdStorage = civicInvestments.includes('cold_storage');
    const finalVal = hasColdStorage ? Math.round(item.value * 1.15) : item.value;
    soundManager.playRegisterSfx();
    setMoney((prev) => prev + finalVal);
    setInventory((prev) => prev.filter((f) => f.catchId !== catchId));
  };

  const handleSellFishBatch = (catchIds: string[]) => {
    if (catchIds.length === 0) return;
    const idSet = new Set(catchIds);
    const itemsToSell = inventory.filter((f) => idSet.has(f.catchId) && !f.isLocked);
    if (itemsToSell.length === 0) return;
    const hasColdStorage = civicInvestments.includes('cold_storage');
    const totalVal = itemsToSell.reduce(
      (sum, f) => sum + (hasColdStorage ? Math.round(f.value * 1.15) : f.value),
      0
    );
    soundManager.playRegisterSfx();
    setMoney((prev) => prev + totalVal);
    const soldIds = new Set(itemsToSell.map((f) => f.catchId));
    setInventory((prev) => prev.filter((f) => !soldIds.has(f.catchId)));
  };

  const handleSellAll = () => {
    const itemsToSell = inventory.filter((f) => !f.isLocked);
    if (itemsToSell.length === 0) return;
    const hasColdStorage = civicInvestments.includes('cold_storage');
    const totalVal = itemsToSell.reduce(
      (sum, f) => sum + (hasColdStorage ? Math.round(f.value * 1.15) : f.value),
      0
    );
    soundManager.playRegisterSfx();
    setMoney((prev) => prev + totalVal);
    setInventory((prev) => prev.filter((f) => f.isLocked));
    setSalvageState(INITIAL_SALVAGE_STATE);
  };

  const handleToggleLockFish = (catchId: string) => {
    setInventory((prev) =>
      prev.map((f) => (f.catchId === catchId ? { ...f, isLocked: !f.isLocked } : f))
    );
  };

  const handleUnlockArea = (area: FishingAreaDef) => {
    const totalCaughtSpecies = Object.keys(catalog).filter(
      (id) => catalog[Number(id)]?.caughtCount > 0
    ).length;

    if (totalCaughtSpecies < area.requiredSpecies) return;
    if (money < area.unlockCost) return;

    if (area.unlockCost > 0) {
      soundManager.playRegisterSfx();
      setMoney((prev) => prev - area.unlockCost);
    }
    setUnlockedAreaIds((prev) => [...prev, area.id]);
    setSelectedAreaId(area.id);
  };

  const handleSelectArea = (areaId: string) => {
    if (unlockedAreaIds.includes(areaId)) {
      setSelectedAreaId(areaId as AreaId);
      if (fishingSubTab === 'whaling') {
        setFishingSubTab('regular');
      }
      soundManager.playAreaAmbience(areaId as AreaId);
    }
  };

  const handleBuyRod = (rod: Rod) => {
    if (money < rod.price || ownedRodIds.includes(rod.id)) return;
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - rod.price);
    setOwnedRodIds((prev) => [...prev, rod.id]);
    setEquippedRodId(rod.id);
  };

  const handleBuyReel = (reel: Reel) => {
    if (money < reel.price || ownedReelIds.includes(reel.id)) return;
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - reel.price);
    setOwnedReelIds((prev) => [...prev, reel.id]);
    setEquippedReelId(reel.id);
  };

  const handleBuyLure = (lure: Lure) => {
    if (money < lure.price || ownedLureIds.includes(lure.id)) return;
    soundManager.playRegisterSfx();
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

  const handleHarvestAllTraps = () => {
    const soakBonus = isClubPerkActive(clubState, 'commercial') ? 1.10 : 1.0;
    const allCatches: CaughtFish[] = [];
    const harvestedIndices: number[] = [];

    traps.slice(0, unlockedTrapSlots).forEach((trap, slotIndex) => {
      const harvest = calculateTrapCatch(trap, Date.now(), soakBonus);
      if (harvest.count > 0 && harvest.fishes.length > 0) {
        allCatches.push(...harvest.fishes);
        harvestedIndices.push(slotIndex);
      }
    });

    if (allCatches.length === 0) return;

    setInventory((prev) => [...allCatches, ...prev]);

    setCatalog((prev) => {
      const next = { ...prev };
      allCatches.forEach((fish) => {
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

    setTraps((prev) =>
      prev.map((t, idx) =>
        harvestedIndices.includes(idx)
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
    soundManager.playRegisterSfx();
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
      soundManager.playRegisterSfx();
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
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - model.price);
    setTraps((prev) =>
      prev.map((t, idx) => (idx === slotIndex ? { ...t, trapTypeId } : t))
    );
  };

  const handleUnlockTrapSlot = () => {
    if (unlockedTrapSlots >= TRAP_SLOT_PRICES.length) return;
    const cost = TRAP_SLOT_PRICES[unlockedTrapSlots];
    if (money < cost) return;
    soundManager.playRegisterSfx();
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
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - 500);
    setHatcheryUnlocked(true);
    setHatcheryTanks((prev) =>
      prev.map((t) => (t.id === 'tank_1' ? { ...t, unlocked: true } : t))
    );
  };

  const handleUnlockTank = (tankId: TankId) => {
    const tank = hatcheryTanks.find((t) => t.id === tankId);
    if (!tank || tank.unlocked || money < tank.unlockCost) return;
    soundManager.playRegisterSfx();
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
    soundManager.playRegisterSfx();
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

    const depositedFish = matchingBrood.slice(0, requiredBroodstock);
    const pairCatchIds = new Set(depositedFish.map((f) => f.catchId));
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
              depositedBreeders: depositedFish,
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
    soundManager.playRegisterSfx();
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
    soundManager.playRegisterSfx();
    setMoney((prev) => prev + batchVal);

    // Return deposited breeders to box so original fish are never permanently lost
    if (tank.depositedBreeders && tank.depositedBreeders.length > 0) {
      setInventory((prev) => [...prev, ...tank.depositedBreeders!]);
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
              depositedBreeders: [],
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

    // Return deposited breeders to box so original fish are never permanently lost
    if (tank.depositedBreeders && tank.depositedBreeders.length > 0) {
      setInventory((prev) => [...prev, ...tank.depositedBreeders!]);
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
              depositedBreeders: [],
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
      const isTrophyCandidate = i < tank.trophyCount;
      const isMutant = i < tank.mutationCount && tank.mutationStrain !== 'normal';
      let weight: number;
      if (isTrophyCandidate) {
        // True trophy weight >= species.trophyWeight
        weight = Number((species.trophyWeight * (1.0 + Math.random() * 0.10)).toFixed(2));
      } else {
        const minW = species.minWeight;
        const maxW = species.trophyWeight * 0.95;
        weight = Number((minW + Math.random() * (maxW - minW)).toFixed(2));
      }
      const isTrophy = weight >= species.trophyWeight;
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

    // Return the original breeding pair to the box when not keeping breeders in tank
    const returnedBreeders: CaughtFish[] =
      tank.depositedBreeders && tank.depositedBreeders.length > 0
        ? tank.depositedBreeders
        : [
            {
              catchId: `breeder_${now}_1_${Math.random().toString(36).substring(2, 6)}`,
              fishId: species.id,
              name: species.name,
              tier: species.tier,
              weight: Number(((species.minWeight + species.maxWeight) / 2).toFixed(2)),
              value: Math.round(species.basePrice * 1.35),
              caughtAt: now,
              areaId: species.areaId,
            },
            {
              catchId: `breeder_${now}_2_${Math.random().toString(36).substring(2, 6)}`,
              fishId: species.id,
              name: species.name,
              tier: species.tier,
              weight: Number(((species.minWeight + species.maxWeight) / 2).toFixed(2)),
              value: Math.round(species.basePrice * 1.35),
              caughtAt: now,
              areaId: species.areaId,
            },
          ];

    setInventory((prev) => [...prev, ...returnedBreeders, ...newFish]);

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
              depositedBreeders: [],
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
        const isTrophyCandidate = i < harvestTrophy;
        const isMutant = i < harvestMutation && tank.mutationStrain !== 'normal';
        let weight: number;
        if (isTrophyCandidate) {
          // True trophy weight >= species.trophyWeight
          weight = Number((species.trophyWeight * (1.0 + Math.random() * 0.10)).toFixed(2));
        } else {
          const minW = species.minWeight;
          const maxW = species.trophyWeight * 0.95;
          weight = Number((minW + Math.random() * (maxW - minW)).toFixed(2));
        }
        const isTrophy = weight >= species.trophyWeight;
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
                depositedBreeders: tank.depositedBreeders && tank.depositedBreeders.length >= 2 ? tank.depositedBreeders.slice(0, 2) : undefined,
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
      // Return original breeders to box so they are never lost
      if (tank.depositedBreeders && tank.depositedBreeders.length > 0) {
        setInventory((prev) => [...prev, ...tank.depositedBreeders!]);
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
                depositedBreeders: [],
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
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - inv.cost);
    setCivicInvestments((prev) => [...prev, id]);
  };

  const handleJoinClub = (clubId: ClubId) => {
    const club = ANGLER_CLUBS.find((c) => c.id === clubId);
    if (!club || money < club.membershipDues) return;
    soundManager.playRegisterSfx();
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
    soundManager.playRegisterSfx();
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
    soundManager.playRegisterSfx();
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
    const tank = hatcheryTanks.find((t) => t.id === tankId);
    if (tank?.depositedBreeders && tank.depositedBreeders.length > 0) {
      setInventory((prev) => [...prev, ...tank.depositedBreeders!]);
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
              depositedBreeders: [],
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

  // Commercial Fleet Empire Handlers
  const handleStartCommercialBusiness = (name: string) => {
    const trimmed = name.trim();
    if (money < 1000 || !trimmed || commercialBusinessName) return;
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - 1000);
    setCommercialBusinessName(trimmed);
  };

  const handleBuyBoat = (boatDef: BoatDefinition) => {
    if (money < boatDef.price) return;
    soundManager.playRegisterSfx();
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
    soundManager.playRegisterSfx();
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
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - crew.hireCost);
    setHiredCrew((prev) => [...prev, crew]);
    setAvailableJobSeekers((prev) => prev.filter((c) => c.id !== crew.id));
  };

  const handleGiveCrewBonus = (crewId: string, amount: number) => {
    if (money < amount) return;
    soundManager.playRegisterSfx();
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
    const boatDef = BOATS_CATALOG.find((b) => b.id === boat.boatDefId) || BOATS_CATALOG[0];
    const { value } = getBoatRetireValue(boat, boatDef);
    setMoney((prev) => prev + value);
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
    soundManager.playRegisterSfx();
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

    soundManager.playRegisterSfx();
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

  // Salvage Charter & Expedition Handlers
  const handleUnlockSalvageCharter = () => {
    if (money < 40000) return;
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - 40000);
    setSalvageState((prev) => ({ ...prev, unlocked: true }));
  };

  const handleBuySalvageBoat = (boatDefId: string) => {
    const def = SALVAGE_BOATS_CATALOG.find((b) => b.id === boatDefId);
    if (!def || money < def.cost) return;
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - def.cost);
    setSalvageState((prev) => ({
      ...prev,
      ownedSalvageBoatInstances: [
        ...prev.ownedSalvageBoatInstances,
        {
          instanceId: `sb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          boatDefId,
          purchasedAt: Date.now(),
          assignedCrewIds: [],
        },
      ],
    }));
  };

  const handleUnlockWreckSite = (siteId: string) => {
    const wreck = SUNKEN_WRECK_SITES.find((w) => w.id === siteId);
    if (!wreck || money < wreck.unlockCost || salvageState.unlockedWreckIds.includes(siteId)) return;
    soundManager.playRegisterSfx();
    setMoney((prev) => prev - wreck.unlockCost);
    setSalvageState((prev) => ({
      ...prev,
      unlockedWreckIds: [...prev.unlockedWreckIds, siteId],
    }));
  };

  const handleAssignCrewToSalvageBoat = (boatInstanceId: string, crewId: string) => {
    setSalvageState((prev) => {
      const boat = prev.ownedSalvageBoatInstances.find((b) => b.instanceId === boatInstanceId);
      if (!boat) return prev;
      const def =
        SALVAGE_BOATS_CATALOG.find((b) => b.id === boat.boatDefId) || SALVAGE_BOATS_CATALOG[0];
      if (boat.assignedCrewIds.length >= def.maxCrew || boat.assignedCrewIds.includes(crewId)) return prev;

      return {
        ...prev,
        ownedSalvageBoatInstances: prev.ownedSalvageBoatInstances.map((b) =>
          b.instanceId === boatInstanceId
            ? { ...b, assignedCrewIds: [...b.assignedCrewIds, crewId] }
            : b
        ),
      };
    });
  };

  const handleUnassignCrewFromSalvageBoat = (boatInstanceId: string, crewId: string) => {
    setSalvageState((prev) => ({
      ...prev,
      ownedSalvageBoatInstances: prev.ownedSalvageBoatInstances.map((b) =>
        b.instanceId === boatInstanceId
          ? { ...b, assignedCrewIds: b.assignedCrewIds.filter((id) => id !== crewId) }
          : b
      ),
    }));
  };

  const handleStartSalvageExpedition = (boatInstanceId: string, wreckSiteId: string) => {
    const boat = salvageState.ownedSalvageBoatInstances.find((b) => b.instanceId === boatInstanceId);
    const wreck = SUNKEN_WRECK_SITES.find((w) => w.id === wreckSiteId);
    if (!boat || !wreck || boat.assignedCrewIds.length === 0) return;

    const isBoatBusy = salvageState.activeExpeditions.some((e) => e.boatInstanceId === boatInstanceId);
    const isWreckBusy = salvageState.activeExpeditions.some((e) => e.wreckSiteId === wreckSiteId);
    if (isBoatBusy || isWreckBusy) return;

    const boatDef =
      SALVAGE_BOATS_CATALOG.find((b) => b.id === boat.boatDefId) || SALVAGE_BOATS_CATALOG[0];
    const durationSec = calculateExpeditionDurationSec(wreck, boatDef);
    const now = Date.now();

    setSalvageState((prev) => ({
      ...prev,
      activeExpeditions: [
        ...prev.activeExpeditions,
        {
          expeditionId: `exp_${now}_${Math.random().toString(36).substring(2, 7)}`,
          boatInstanceId,
          boatDefId: boat.boatDefId,
          wreckSiteId,
          assignedCrewIds: [...boat.assignedCrewIds],
          startTime: now,
          durationSec,
          endTime: now + durationSec * 1000,
        },
      ],
    }));
  };

  const handleClaimSalvageExpedition = (expeditionId: string) => {
    const exp = salvageState.activeExpeditions.find((e) => e.expeditionId === expeditionId);
    if (!exp) return;
    const wreck = SUNKEN_WRECK_SITES.find((w) => w.id === exp.wreckSiteId);
    const boatDef = SALVAGE_BOATS_CATALOG.find((b) => b.id === exp.boatDefId);
    if (!wreck || !boatDef) return;

    const recovered = rollRecoveredTreasuresForVoyage(wreck, boatDef, salvageState);
    const newFoundCount = (salvageState.wreckTreasureFoundCounts[wreck.id] || 0) + recovered.length;
    const newDiscoveredIds = Array.from(
      new Set([
        ...(salvageState.discoveredArtifactIds || []),
        ...recovered.map((r) => r.treasureDefId),
      ])
    );

    setSalvageState((prev) => ({
      ...prev,
      activeExpeditions: prev.activeExpeditions.filter((e) => e.expeditionId !== expeditionId),
      recoveredVaultTreasures: [...prev.recoveredVaultTreasures, ...recovered],
      wreckTreasureFoundCounts: {
        ...prev.wreckTreasureFoundCounts,
        [wreck.id]: newFoundCount,
      },
      discoveredArtifactIds: newDiscoveredIds,
      totalExpeditionsCompleted: prev.totalExpeditionsCompleted + 1,
    }));
  };

  const handleListTreasureOnAuction = (treasureInstanceId: string, startingBid: number) => {
    const treasure = salvageState.recoveredVaultTreasures.find((t) => t.instanceId === treasureInstanceId);
    if (!treasure) return;

    const listing = createAuctionListing(treasure, startingBid, 45);
    setSalvageState((prev) => ({
      ...prev,
      recoveredVaultTreasures: prev.recoveredVaultTreasures.filter((t) => t.instanceId !== treasureInstanceId),
      activeAuctions: [listing, ...prev.activeAuctions],
    }));
  };

  const handleRelistAuctionTreasure = (auctionId: string) => {
    const auction = salvageState.activeAuctions.find((a) => a.auctionId === auctionId);
    if (!auction) return;
    setSalvageState((prev) => ({
      ...prev,
      activeAuctions: prev.activeAuctions.filter((a) => a.auctionId !== auctionId),
      recoveredVaultTreasures: [auction.treasure, ...prev.recoveredVaultTreasures],
    }));
  };

  const handleCollectAuctionProceeds = (auctionId: string) => {
    const auction = salvageState.activeAuctions.find((a) => a.auctionId === auctionId);
    if (!auction) return;

    soundManager.playRegisterSfx();
    setMoney((prev) => prev + auction.finalHammerPrice);
    setSalvageState((prev) => ({
      ...prev,
      activeAuctions: prev.activeAuctions.filter((a) => a.auctionId !== auctionId),
      totalEarningsFromAuctions: (prev.totalEarningsFromAuctions || 0) + auction.finalHammerPrice,
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
      localStorage.removeItem('cozy_reel_salvage_state_v1');
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
    setWhaleCatalog({});
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
    setWhalingUnlocked(false);
    setLiveBaitCharges(0);
    setCommercialBusinessName(null);

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

  if (isLoadingAssets) {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-[#0c0d10] text-[#e3e6eb] font-mono flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-sm border border-[#2b303c] bg-[#14161c] p-6 space-y-4 text-center shadow-2xl">
          <div className="space-y-1">
            <h1 className="text-lg font-bold tracking-wider text-amber-300">
              Cozy Reel
            </h1>
            <p className="text-[11px] text-[#8c94a2] tracking-wide uppercase">
              Classic Fishing Game
            </p>
          </div>

          <div className="py-4 flex flex-col items-center justify-center">
            <img
              src={getFishSpriteUrl(loadingFish) || './fish/rainbow_trout.png'}
              alt={loadingFish.name}
              className="w-64 h-36 max-w-full object-contain animate-pulse"
              style={{ imageRendering: 'pixelated' }}
            />
            <span className="text-[11px] text-[#717885] mt-1.5 italic tracking-wide">
              {loadingFish.name}
            </span>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between text-xs text-[#a3aab8] font-bold">
              <span className="truncate pr-2">{loadingStatusText}</span>
              <span className="text-emerald-400 font-mono flex-shrink-0">{loadingProgress}%</span>
            </div>
            <div className="w-full h-2.5 border border-[#3b404c] bg-[#0c0d10] p-0.5">
              <div
                className="h-full bg-emerald-500 transition-all duration-75"
                style={{ width: `${Math.max(8, loadingProgress)}%` }}
              />
            </div>
          </div>

          <div className="text-[10px] text-[#636b78] italic">
            Preloading visual sprites &amp; audio...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-[100dvh] min-h-screen ${activeArea.theme.bgClass} text-[#e3e6eb] select-none p-2 sm:p-4 md:p-6 flex flex-col justify-start transition-colors duration-200`}
    >
      <div className={`w-full ${isFullscreen ? 'max-w-4xl lg:max-w-5xl xl:max-w-6xl' : 'max-w-2xl lg:max-w-3xl xl:max-w-4xl'} mx-auto space-y-2.5 sm:space-y-3 pb-8 safe-pb transition-all duration-300`}>
        {/* Header */}
        <header
          className={`border ${activeArea.theme.borderClass} ${activeArea.theme.panelClass} p-3 sm:p-3.5 flex items-center justify-between text-xs transition-colors`}
        >
          <div className="font-bold text-sm text-[#f1f3f5] tracking-wide flex items-center gap-2 flex-wrap">
            <span>Fishing</span>
            <span className="text-[11px] text-[#717885]">·</span>
            {unlockedAreaIds.length > 1 ? (
              <select
                value={selectedAreaId}
                onChange={(e) => handleSelectArea(e.target.value)}
                aria-label="Quick Switch Fishing Location"
                className="border border-[#2d323c] bg-[#16181d] text-xs font-semibold text-[#f1f3f5] px-2 py-0.5 cursor-pointer focus:outline-none focus:border-sky-500 hover:border-[#454c5a] transition-colors"
              >
                {FISHING_AREAS.filter((a) => unlockedAreaIds.includes(a.id)).map((a) => (
                  <option key={a.id} value={a.id} className="bg-[#14161c] text-[#f1f3f5]">
                    {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-[#717885]">{activeArea.name}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span
              className="text-amber-300 font-semibold text-[11px] border border-[#2d323c] bg-[#16181d] px-2 py-0.5 flex items-center gap-1.5"
              title={currentWeather.waterEffect}
            >
              {currentWeather.icon && (
                <img
                  src={currentWeather.icon}
                  alt={currentWeather.name}
                  className="w-4 h-4 object-contain flex-shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
              <span>Weather: {currentWeather.name}</span>
            </span>
            <span className="font-bold text-emerald-400 text-sm">
              ${money.toLocaleString()}
            </span>
            <button
              onClick={handleToggleFullscreen}
              className="text-[11px] font-bold text-[#c5cbdb] hover:text-[#f1f3f5] border border-[#393f4e] hover:border-sky-500 bg-[#1a1c22] hover:bg-[#22252e] px-2 py-1 cursor-pointer transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? 'Exit Full' : 'Fullscreen'}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-[11px] font-bold text-[#c5cbdb] hover:text-[#f1f3f5] border border-[#393f4e] hover:border-sky-500 bg-[#1a1c22] hover:bg-[#22252e] px-2.5 py-1 cursor-pointer transition-colors"
              title="Open Game Settings"
            >
              Settings
            </button>
          </div>
        </header>

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
        <nav className="flex overflow-x-auto no-scrollbar gap-1.5 sm:grid sm:grid-cols-9 sm:gap-1 text-[11px] sm:text-xs py-1">
          <button
            onClick={() => setActiveTab('fish')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center ${
              activeTab === 'fish'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Fish
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center ${
              activeTab === 'inventory'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Box
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center ${
              activeTab === 'shop'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Shop
          </button>
          <button
            onClick={() => setActiveTab('traps')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center ${
              activeTab === 'traps'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Traps
          </button>
          <button
            onClick={() => setActiveTab('hatchery')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center relative ${
              activeTab === 'hatchery'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            <span>Hatchery</span>
            {readyHatcheryCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center relative ${
              activeTab === 'fleet'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            <span>Fleet</span>
            {readyHaulsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('town')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center relative ${
              activeTab === 'town'
                ? 'border-amber-600 bg-amber-950/60 text-amber-200'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            <span>Town</span>
            {isRumorActive && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('areas')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center ${
              activeTab === 'areas'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Areas
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`shrink-0 px-3.5 py-2.5 sm:py-2 sm:px-1 min-h-[42px] border text-center font-bold cursor-pointer transition-colors whitespace-nowrap touch-manipulation flex items-center justify-center ${
              activeTab === 'guide'
                ? 'border-[#4a505e] bg-[#22252c] text-[#f1f3f5]'
                : 'border-[#23262d] bg-[#16181d] text-[#717885] hover:text-[#c0c5ce]'
            }`}
          >
            Guide
          </button>
        </nav>

        {/* Tab Content - Persistent Panels to Prevent Image Reloading / Flashing */}
        <div className={activeTab === 'fish' ? 'space-y-3' : 'hidden'}>
          {/* Sub-Tabs: Rod & Reel vs Whaling */}
          <div className="flex items-center gap-2 border-b border-[#232730] pb-2 text-xs">
            <button
              onClick={() => setFishingSubTab('rod')}
              className={`px-3.5 py-2 min-h-[38px] flex items-center justify-center font-bold cursor-pointer transition-colors touch-manipulation ${
                fishingSubTab === 'rod'
                  ? 'border-b-2 border-sky-400 text-sky-200 bg-sky-950/40'
                  : 'text-[#8c94a2] hover:text-[#c0c5ce]'
              }`}
            >
              Rod & Reel
            </button>
            <button
              onClick={() => setFishingSubTab('whaling')}
              className={`px-3.5 py-2 min-h-[38px] flex items-center justify-center font-bold cursor-pointer transition-colors touch-manipulation ${
                fishingSubTab === 'whaling'
                  ? 'border-b-2 border-blue-400 text-blue-200 bg-blue-950/40'
                  : 'text-[#8c94a2] hover:text-blue-300'
              }`}
            >
              Whaling
            </button>
          </div>

          {fishingSubTab === 'whaling' ? (
            !isWhalingAvailable ? (
              <div className="border border-[#2a2d34] bg-[#14161b] p-5 text-[#e3e6eb] space-y-4 text-xs">
                <div className="border-b border-[#252830] pb-3">
                  <div className="text-sm font-bold text-[#f1f3f5]">Whaling</div>
                  <div className="text-[#8c94a2] text-xs mt-1">
                    Whaling requires heavy gear and a commercial whaling permit.
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <div className="flex items-center justify-between p-3 border border-[#232730] bg-[#101217]">
                    <div>
                      <div className="font-bold text-[#f1f3f5]">Heavy Rod</div>
                      <div className="text-[11px] text-[#717885]">At least Thicc rod ($175,000+)</div>
                    </div>
                    <span
                      className={`font-bold px-2 py-0.5 text-xs ${
                        hasWhaleRod ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {hasWhaleRod ? 'Owned' : 'Needed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-[#232730] bg-[#101217]">
                    <div>
                      <div className="font-bold text-[#f1f3f5]">Heavy Reel</div>
                      <div className="text-[11px] text-[#717885]">At least Gold Dual reel ($120,000+)</div>
                    </div>
                    <span
                      className={`font-bold px-2 py-0.5 text-xs ${
                        hasWhaleReel ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {hasWhaleReel ? 'Owned' : 'Needed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-[#232730] bg-[#101217]">
                    <div>
                      <div className="font-bold text-[#f1f3f5]">Whaling Permit</div>
                      <div className="text-[11px] text-[#717885]">${WHALING_UNLOCK_COST.toLocaleString()} one-time license</div>
                    </div>
                    <span
                      className={`font-bold px-2 py-0.5 text-xs ${
                        whalingUnlocked ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {whalingUnlocked ? 'Unlocked' : `$${WHALING_UNLOCK_COST.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!whalingUnlocked && (
                    <button
                      onClick={() => {
                        if (hasWhaleRod && hasWhaleReel && money >= WHALING_UNLOCK_COST) {
                          soundManager.playRegisterSfx();
                          setMoney((prev) => prev - WHALING_UNLOCK_COST);
                          setWhalingUnlocked(true);
                        }
                      }}
                      disabled={!hasWhaleRod || !hasWhaleReel || money < WHALING_UNLOCK_COST}
                      className={`px-4 py-2 font-bold border transition-colors touch-manipulation min-h-[40px] ${
                        hasWhaleRod && hasWhaleReel && money >= WHALING_UNLOCK_COST
                          ? 'border-emerald-500 bg-emerald-950 hover:bg-emerald-900 text-emerald-100 cursor-pointer'
                          : 'border-[#333842] bg-[#1a1c22] text-[#6b7280] cursor-not-allowed'
                      }`}
                    >
                      {money < WHALING_UNLOCK_COST && hasWhaleRod && hasWhaleReel
                        ? `Need $${(WHALING_UNLOCK_COST - money).toLocaleString()} more`
                        : `Unlock Whaling ($${WHALING_UNLOCK_COST.toLocaleString()})`}
                    </button>
                  )}

                  {(!hasWhaleRod || !hasWhaleReel) && (
                    <button
                      onClick={() => setActiveTab('shop')}
                      className="px-4 py-2 border border-sky-500 bg-sky-950 hover:bg-sky-900 text-sky-100 font-bold cursor-pointer touch-manipulation min-h-[40px]"
                    >
                      Go to Tackle Shop
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <WhalingTab
                money={money}
                ownedRodIds={ownedRodIds}
                ownedReelIds={ownedReelIds}
                onAddMoney={(amt) => setMoney((prev) => prev + amt)}
                onWhaleCaught={handleWhaleCaught}
              />
            )
          ) : (
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-stretch">
                {/* Rod */}
                <div className="flex items-center gap-3 bg-[#131519] border border-[#232730] p-2 sm:p-2.5 justify-between sm:justify-start">
                  <img
                    src={getRodSpriteUrl(equippedRodId)}
                    alt="Equipped Rod"
                    className="w-20 h-14 sm:w-24 sm:h-18 object-contain select-none shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <span className="text-[#8c94a2] font-semibold text-[11px] sm:text-xs shrink-0">Rod:</span>
                    <select
                      value={equippedRodId}
                      onChange={(e) => handleEquipRod(e.target.value)}
                      aria-label="Equipped Rod"
                      className="w-full border-2 border-[#323640] bg-[#141518] px-2 py-1 text-[#f1f3f5] font-bold cursor-pointer focus:outline-none text-xs truncate"
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
                <div className="flex items-center gap-3 bg-[#131519] border border-[#232730] p-2 sm:p-2.5 justify-between sm:justify-start">
                  <img
                    src={getReelSpriteUrl(equippedReelId)}
                    alt="Equipped Reel"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain select-none shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <span className="text-[#8c94a2] font-semibold text-[11px] sm:text-xs shrink-0">Reel:</span>
                    <select
                      value={equippedReelId}
                      onChange={(e) => handleEquipReel(e.target.value)}
                      aria-label="Equipped Reel"
                      className="w-full border-2 border-[#323640] bg-[#141518] px-2 py-1 text-[#f1f3f5] font-bold cursor-pointer focus:outline-none text-xs truncate"
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
                <div className="flex items-center gap-3 bg-[#131519] border border-[#232730] p-2 sm:p-2.5 justify-between sm:justify-start">
                  <img
                    src={getLureSpriteUrl(equippedLureId)}
                    alt="Equipped Bait/Lure"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain select-none shrink-0"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <span className="text-[#8c94a2] font-semibold text-[11px] sm:text-xs shrink-0">Bait:</span>
                    <div className="w-full min-w-0">
                      <select
                        value={equippedLureId}
                        onChange={(e) => handleEquipLure(e.target.value)}
                        aria-label="Equipped Bait or Lure"
                        className="w-full border-2 border-[#323640] bg-[#141518] px-2 py-1 text-[#f1f3f5] font-bold cursor-pointer focus:outline-none text-xs truncate"
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
                      {getLureAreaEffectiveness(equippedLureId, activeArea.id).isMismatched && (
                        <div
                          className="text-[10px] text-amber-400 font-semibold truncate pt-0.5"
                          title={getLureAreaEffectiveness(equippedLureId, activeArea.id).warningText}
                        >
                          Slow bites in {activeArea.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fishing Action Area */}
            <FishingArea
              isFullscreen={isFullscreen}
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
      </div>

        <div className={activeTab === 'areas' ? 'block' : 'hidden'}>
          <AreasTab
            money={money}
            unlockedAreaIds={unlockedAreaIds}
            selectedAreaId={selectedAreaId}
            catalogMap={catalog}
            onUnlockArea={handleUnlockArea}
            onSelectArea={handleSelectArea}
          />
        </div>

        <div className={activeTab === 'traps' ? 'block' : 'hidden'}>
          <TrapsTab
            money={money}
            traps={traps}
            inventory={inventory}
            unlockedTrapSlots={unlockedTrapSlots}
            unlockedAreaIds={unlockedAreaIds}
            onHarvestTrap={handleHarvestTrap}
            onHarvestAllTraps={handleHarvestAllTraps}
            onSetTrapArea={handleSetTrapArea}
            onBaitTrap={handleBaitTrap}
            onBaitTrapWithFish={handleBaitTrapWithFish}
            onUpgradeTrapModel={handleUpgradeTrapModel}
            onUnlockTrapSlot={handleUnlockTrapSlot}
          />
        </div>

        <div className={activeTab === 'hatchery' ? 'block' : 'hidden'}>
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
        </div>

        <div className={activeTab === 'town' ? 'block' : 'hidden'}>
          <TownTab
            money={money}
            inventory={inventory}
            privateOrders={privateOrders}
            commercialOrders={commercialOrders}
            townBounties={townBounties}
            civicInvestments={civicInvestments}
            clubState={clubState}
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
          />
        </div>

        <div className={activeTab === 'fleet' ? 'block' : 'hidden'}>
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
            salvageState={salvageState}
            onUnlockSalvageCharter={handleUnlockSalvageCharter}
            onBuySalvageBoat={handleBuySalvageBoat}
            onUnlockWreckSite={handleUnlockWreckSite}
            onAssignCrewToSalvageBoat={handleAssignCrewToSalvageBoat}
            onUnassignCrewFromSalvageBoat={handleUnassignCrewFromSalvageBoat}
            onStartSalvageExpedition={handleStartSalvageExpedition}
            onClaimSalvageExpedition={handleClaimSalvageExpedition}
            onListTreasureOnAuction={handleListTreasureOnAuction}
            onRelistAuctionTreasure={handleRelistAuctionTreasure}
            onCollectAuctionProceeds={handleCollectAuctionProceeds}
          />
        </div>

        <div className={activeTab === 'shop' ? 'block' : 'hidden'}>
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
        </div>

        <div className={activeTab === 'inventory' ? 'block' : 'hidden'}>
          <Inventory
            fishList={inventory}
            onSellFish={handleSellFish}
            onSellBatch={handleSellFishBatch}
            onSellAll={handleSellAll}
            onToggleLockFish={handleToggleLockFish}
          />
        </div>

        <div className={activeTab === 'guide' ? 'block' : 'hidden'}>
          <Guide
            catalogMap={catalog}
            whaleCatalog={whaleCatalog}
            currentWeather={currentWeather}
            inventory={inventory}
            hatcheryTanks={hatcheryTanks}
            discoveredArtifactIds={getDiscoveredArtifactIds(salvageState)}
          />
        </div>

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

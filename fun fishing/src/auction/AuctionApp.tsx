import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ShopId,
  OwnedItem,
  ShopItem,
  AuctionEvent,
  AuctionListing,
  SetDef,
  StorageLockerDef,
  ClientContract,
} from './auctionLogic';
import {
  SHOPS,
  SUPPLY_ITEMS,
  SETS,
  STORAGE_LOCKERS,
  VEHICLE_UPGRADES,
  generateShopInventory,
  generateAuctionEvent,
  generateDailyContracts,
  getRankForXp,
  getNextRank,
  getItemDef,
  getDirectSellValue,
  getSetSellValue,
  rollAuctionResult,
  applySupply,
  checkCompleteSets,
  openStorageLocker,
  assemblePart,
  appraiseItem,
  placeHouseLotBid,
  hammerHouseLot,
} from './auctionLogic';

import { ShopView } from './components/ShopView';
import { StorageView } from './components/StorageView';
import { WorkshopView } from './components/WorkshopView';
import { AuctionView } from './components/AuctionView';
import { ContractsView } from './components/ContractsView';
import { ItemImage } from './components/ItemImage';

const STORAGE_KEY = 'the_lot_save_v1';

type Tab = 'shops' | 'storage' | 'workshop' | 'auctions' | 'contracts' | 'sets';

export default function AuctionApp() {
  const [money, setMoney] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.money === 'number') return parsed.money;
      }
    } catch {}
    return 35;
  });

  const [gameDay, setGameDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.gameDay === 'number') return parsed.gameDay;
      }
    } catch {}
    return 1;
  });

  const [dealerXp, setDealerXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.dealerXp === 'number') return parsed.dealerXp;
      }
    } catch {}
    return 0;
  });

  const [vehicleTier, setVehicleTier] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.vehicleTier === 'number') return parsed.vehicleTier;
      }
    } catch {}
    return 1;
  });

  const currentVehicle = VEHICLE_UPGRADES[vehicleTier - 1] || VEHICLE_UPGRADES[0];
  const nextVehicle = VEHICLE_UPGRADES[vehicleTier] || null;
  const storageCapacity = currentVehicle.capacity;

  const [unlockedShopIds, setUnlockedShopIds] = useState<ShopId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.unlockedShopIds)) return parsed.unlockedShopIds;
      }
    } catch {}
    return ['thrift', 'flea'];
  });

  const [activeShopId, setActiveShopId] = useState<ShopId>('thrift');

  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.ownedItems)) return parsed.ownedItems;
      }
    } catch {}
    return [];
  });

  const [supplies, setSupplies] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.supplies) return parsed.supplies;
      }
    } catch {}
    return { microfiber_cloth: 1 };
  });

  const [contracts, setContracts] = useState<ClientContract[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.contracts) && parsed.contracts.length > 0) return parsed.contracts;
      }
    } catch {}
    return generateDailyContracts(1);
  });

  const [nextAuction, setNextAuction] = useState<AuctionEvent | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.nextAuction &&
          Array.isArray(parsed.nextAuction.houseLots) &&
          parsed.nextAuction.houseLots.length > 0
        ) {
          return parsed.nextAuction;
        }
      }
    } catch {}
    return generateAuctionEvent();
  });

  const [auctionListings, setAuctionListings] = useState<AuctionListing[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.auctionListings)) return parsed.auctionListings;
      }
    } catch {}
    return [];
  });

  const [auctionResults, setAuctionResults] = useState<AuctionListing[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.auctionResults)) return parsed.auctionResults;
      }
    } catch {}
    return [];
  });

  const [shopInventories, setShopInventories] = useState<
    Record<ShopId, { items: ShopItem[]; generatedAt: number }>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shopInventories) return parsed.shopInventories;
      }
    } catch {}

    const initial: Record<ShopId, { items: ShopItem[]; generatedAt: number }> = {} as any;
    for (const shop of SHOPS) {
      initial[shop.id] = {
        items: generateShopInventory(shop, null),
        generatedAt: Date.now(),
      };
    }
    return initial;
  });

  const [activeTab, setActiveTab] = useState<Tab>('shops');
  const [auctionDefaultSubTab, setAuctionDefaultSubTab] = useState<'floor' | 'consign'>('floor');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotice = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const dealerRank = useMemo(() => getRankForXp(dealerXp), [dealerXp]);
  const nextRank = useMemo(() => getNextRank(dealerRank.level), [dealerRank.level]);

  const addXp = useCallback((amount: number) => {
    setDealerXp((prev) => {
      const newTotal = prev + amount;
      const oldRank = getRankForXp(prev);
      const newRank = getRankForXp(newTotal);
      if (newRank.level > oldRank.level) {
        showNotice(`PROMOTED! You are now a ${newRank.title}! ${newRank.perkDescription}`);
      }
      return newTotal;
    });
  }, [showNotice]);

  // Save state to localStorage
  useEffect(() => {
    const state = {
      money,
      gameDay,
      dealerXp,
      vehicleTier,
      unlockedShopIds,
      ownedItems,
      supplies,
      contracts,
      nextAuction,
      auctionListings,
      auctionResults,
      shopInventories,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [
    money,
    gameDay,
    dealerXp,
    vehicleTier,
    unlockedShopIds,
    ownedItems,
    supplies,
    contracts,
    nextAuction,
    auctionListings,
    auctionResults,
    shopInventories,
  ]);

  // Guarantee house lots are present even if an older save was loaded
  useEffect(() => {
    if (!nextAuction || !nextAuction.houseLots || nextAuction.houseLots.length === 0) {
      setNextAuction(generateAuctionEvent());
    }
  }, [nextAuction]);

  const advanceDay = useCallback(() => {
    setGameDay((d) => d + 1);

    // Refresh shops
    const newInvs: Record<ShopId, { items: ShopItem[]; generatedAt: number }> = {} as any;
    for (const shop of SHOPS) {
      newInvs[shop.id] = {
        items: generateShopInventory(shop, null),
        generatedAt: Date.now(),
      };
    }
    setShopInventories(newInvs);

    // Refresh daily contracts
    setContracts(generateDailyContracts(gameDay + 1));

    // Auto-resolve any uncalled consignments
    if (auctionListings.length > 0 && nextAuction) {
      const resolvedResults: AuctionListing[] = [];
      const autoReturned: OwnedItem[] = [];
      let availableSlots = storageCapacity - ownedItems.length;

      for (const listing of auctionListings) {
        const def = getItemDef(listing.itemUid);
        if (def) {
          const outcome = rollAuctionResult(
            def,
            listing.condition || 'fair',
            nextAuction,
            null,
            listing.startingBid,
            listing.makerMark,
            dealerRank.hammerBonus
          );

          if (outcome.fined) {
            setMoney((m) => Math.max(0, m - outcome.fineAmount));
            showNotice(`Counterfeit lot confiscated. Fined $${outcome.fineAmount}.`);
          }

          if (outcome.sold) {
            addXp(30);
            resolvedResults.push({
              ...listing,
              finalPrice: outcome.finalPrice,
              bidCount: outcome.bidCount,
              status: 'sold',
            });
          } else {
            if (availableSlots > 0) {
              autoReturned.push({
                uid: 'own_' + Math.random().toString(36).substring(2, 9),
                itemId: listing.itemUid,
                condition: listing.condition || 'fair',
                boughtFor: listing.startingBid,
                boughtAt: Date.now(),
                restored: listing.condition === 'pristine',
                makerMark: listing.makerMark,
              });
              availableSlots--;
            } else {
              resolvedResults.push({
                ...listing,
                finalPrice: 0,
                bidCount: outcome.bidCount,
                status: 'unsold',
              });
            }
          }
        }
      }
      if (autoReturned.length > 0) {
        setOwnedItems((prev) => [...autoReturned, ...prev]);
      }
      setAuctionResults((prev) => [...prev, ...resolvedResults]);
      setAuctionListings([]);
    }

    setNextAuction(generateAuctionEvent());
    showNotice(`Day ${gameDay + 1} begins. Daily shops and contracts refreshed.`);
  }, [gameDay, auctionListings, nextAuction, storageCapacity, ownedItems.length, dealerRank.hammerBonus, addXp, showNotice]);

  const handleResolveAuctionListings = useCallback(() => {
    if (auctionListings.length === 0 || !nextAuction) return;

    const resolvedResults: AuctionListing[] = [];
    const autoReturned: OwnedItem[] = [];
    let soldCount = 0;
    let earnedXp = 0;
    let availableSlots = storageCapacity - ownedItems.length;

    for (const listing of auctionListings) {
      const def = getItemDef(listing.itemUid);
      if (def) {
        const outcome = rollAuctionResult(
          def,
          listing.condition || 'fair',
          nextAuction,
          null,
          listing.startingBid,
          listing.makerMark,
          dealerRank.hammerBonus
        );

        if (outcome.fined) {
          setMoney((m) => Math.max(0, m - outcome.fineAmount));
          showNotice(`Counterfeit lot confiscated. Fined $${outcome.fineAmount}.`);
        }

        if (outcome.sold) {
          soldCount++;
          earnedXp += 30;
          resolvedResults.push({
            ...listing,
            finalPrice: outcome.finalPrice,
            bidCount: outcome.bidCount,
            status: 'sold',
          });
        } else {
          if (availableSlots > 0) {
            autoReturned.push({
              uid: 'own_' + Math.random().toString(36).substring(2, 9),
              itemId: listing.itemUid,
              condition: listing.condition || 'fair',
              boughtFor: listing.startingBid,
              boughtAt: Date.now(),
              restored: listing.condition === 'pristine',
              makerMark: listing.makerMark,
            });
            availableSlots--;
          } else {
            resolvedResults.push({
              ...listing,
              finalPrice: 0,
              bidCount: outcome.bidCount,
              status: 'unsold',
            });
          }
        }
      }
    }

    if (autoReturned.length > 0) {
      setOwnedItems((prev) => [...autoReturned, ...prev]);
    }
    setAuctionResults((prev) => [...prev, ...resolvedResults]);
    setAuctionListings([]);

    if (earnedXp > 0) {
      addXp(earnedXp);
    }

    if (autoReturned.length > 0) {
      showNotice(`${soldCount} lots sold. ${autoReturned.length} unsold lots returned to storage.`);
    } else {
      showNotice(`${soldCount} of ${auctionListings.length} consignment lots sold.`);
    }
  }, [auctionListings, nextAuction, storageCapacity, ownedItems.length, dealerRank.hammerBonus, addXp, showNotice]);

  // Handle direct live auction sale from interactive podium
  const handleDirectLiveSale = useCallback(
    (listingUid: string, finalPrice: number, bidCount: number) => {
      const listing = auctionListings.find((l) => l.uid === listingUid);
      if (!listing) return;

      setAuctionListings((prev) => prev.filter((l) => l.uid !== listingUid));
      setAuctionResults((prev) => [
        ...prev,
        {
          ...listing,
          finalPrice,
          bidCount,
          status: 'sold',
        },
      ]);

      addXp(35);
      showNotice(`Hammer fell at $${finalPrice}! Lot sold.`);
    },
    [auctionListings, addXp, showNotice]
  );

  // Handle direct live pass from interactive podium
  const handleDirectLivePass = useCallback(
    (listingUid: string) => {
      const listing = auctionListings.find((l) => l.uid === listingUid);
      if (!listing) return;

      setAuctionListings((prev) => prev.filter((l) => l.uid !== listingUid));

      if (ownedItems.length < storageCapacity) {
        const returned: OwnedItem = {
          uid: 'own_' + Math.random().toString(36).substring(2, 9),
          itemId: listing.itemUid,
          condition: listing.condition || 'fair',
          boughtFor: listing.startingBid,
          boughtAt: Date.now(),
          restored: listing.condition === 'pristine',
          makerMark: listing.makerMark,
        };
        setOwnedItems((prev) => [returned, ...prev]);
        showNotice('Lot passed. Safely returned to storage.');
      } else {
        setAuctionResults((prev) => [
          ...prev,
          {
            ...listing,
            finalPrice: 0,
            bidCount: 0,
            status: 'unsold',
          },
        ]);
        showNotice('Lot passed. Free up storage to reclaim.');
      }
    },
    [auctionListings, ownedItems.length, storageCapacity, showNotice]
  );

  const handleBuyItem = (shopItem: ShopItem) => {
    if (money < shopItem.price) {
      showNotice('Not enough money');
      return;
    }
    if (ownedItems.length >= storageCapacity) {
      showNotice('Storage is full. Upgrade vehicle or sell items.');
      return;
    }

    setMoney((m) => m - shopItem.price);
    const newOwned: OwnedItem = {
      uid: 'own_' + Math.random().toString(36).substring(2, 9),
      itemId: shopItem.item.id,
      condition: shopItem.condition,
      boughtFor: shopItem.price,
      boughtAt: Date.now(),
      restored: false,
      makerMark: shopItem.makerMark,
    };
    setOwnedItems((prev) => [newOwned, ...prev]);

    setShopInventories((prev) => {
      const curr = prev[activeShopId];
      if (!curr) return prev;
      return {
        ...prev,
        [activeShopId]: {
          ...curr,
          items: curr.items.filter((i) => i.uid !== shopItem.uid),
        },
      };
    });

    addXp(10);
    showNotice(`Acquired ${shopItem.item.name}`);
  };

  const handleBuyLocker = (locker: StorageLockerDef) => {
    if (money < locker.cost) {
      showNotice('Not enough money');
      return;
    }
    if (ownedItems.length >= storageCapacity) {
      showNotice('Storage is full. Upgrade vehicle or sell items.');
      return;
    }

    setMoney((m) => m - locker.cost);
    const unpacked = openStorageLocker(locker);
    const availableSlots = storageCapacity - ownedItems.length;
    const toAdd: OwnedItem[] = unpacked.slice(0, availableSlots).map((u) => ({
      uid: 'own_' + Math.random().toString(36).substring(2, 9),
      itemId: u.item.id,
      condition: u.condition,
      boughtFor: Math.round(locker.cost / unpacked.length),
      boughtAt: Date.now(),
      restored: false,
      makerMark: u.makerMark,
    }));

    setOwnedItems((prev) => [...toAdd, ...prev]);
    addXp(40);
    showNotice(`Unpacked ${toAdd.length} items from ${locker.name}!`);
  };

  const handleAppraise = (itemUid: string) => {
    const rawFee = 25;
    const discountedFee = Math.round(rawFee * (1 - dealerRank.appraisalDiscount));

    if (money < discountedFee) {
      showNotice(`Need $${discountedFee} appraisal fee`);
      return;
    }
    const item = ownedItems.find((o) => o.uid === itemUid);
    if (!item || item.makerMark !== 'unverified') return;

    setMoney((m) => m - discountedFee);
    const res = appraiseItem(item);
    setOwnedItems((prev) =>
      prev.map((o) => (o.uid === itemUid ? { ...o, makerMark: res.newMark } : o))
    );

    addXp(20);
    if (res.result === 'authentic') {
      showNotice('Appraisal confirmed: Genuine antique (+150% value)!');
    } else {
      showNotice('Appraisal result: Counterfeit reproduction.');
    }
  };

  const handleAssemblePart = (incompleteUid: string, partUid: string) => {
    const res = assemblePart(incompleteUid, partUid, ownedItems);
    if (!res) {
      showNotice('Parts do not match');
      return;
    }
    setOwnedItems([res.assembled, ...res.remainingItems]);
    const def = getItemDef(res.assembled.itemId);
    addXp(50);
    showNotice(`Assembled complete ${def?.name ?? 'item'}! +50 XP`);
  };

  const handleSellDirect = (itemUid: string) => {
    const item = ownedItems.find((o) => o.uid === itemUid);
    if (!item) return;
    const def = getItemDef(item.itemId);
    if (!def) return;

    const sellVal = getDirectSellValue(def, item.condition, item.makerMark);
    setMoney((m) => m + sellVal);
    setOwnedItems((prev) => prev.filter((o) => o.uid !== itemUid));
    addXp(10);
    showNotice(`Sold for $${sellVal}`);
  };

  const handleSellSet = (setId: string) => {
    const setDef = SETS.find((s) => s.id === setId);
    if (!setDef) return;

    const setValue = getSetSellValue(setDef, ownedItems);
    setMoney((m) => m + setValue);

    setOwnedItems((prev) => {
      const remaining = [...prev];
      for (const reqId of setDef.itemIds) {
        const idx = remaining.findIndex((o) => o.itemId === reqId);
        if (idx !== -1) {
          remaining.splice(idx, 1);
        }
      }
      return remaining;
    });

    addXp(120);
    showNotice(`Assembled & sold complete set for $${setValue}! +120 XP`);
  };

  const handleListItem = (itemUid: string, startingBid?: number, navigateToAuction?: boolean) => {
    const item = ownedItems.find((o) => o.uid === itemUid);
    if (!item || !nextAuction) return;

    const def = getItemDef(item.itemId);
    if (!def) return;

    const finalStartingBid =
      startingBid && startingBid > 0
        ? startingBid
        : Math.max(1, Math.round(getDirectSellValue(def, item.condition, item.makerMark) * 1.1));

    const newListing: AuctionListing = {
      uid: 'auc_' + Math.random().toString(36).substring(2, 9),
      itemUid: def.id,
      auctionId: nextAuction.id,
      startingBid: finalStartingBid,
      currentBid: finalStartingBid,
      finalPrice: 0,
      status: 'active' as const,
      bidCount: 0,
      listedAt: Date.now(),
      makerMark: item.makerMark,
      condition: item.condition,
    };

    setAuctionListings((prev) => [...prev, newListing]);
    setOwnedItems((prev) => prev.filter((o) => o.uid !== itemUid));

    if (navigateToAuction) {
      setActiveTab('auctions');
      setAuctionDefaultSubTab('consign');
      showNotice(`Consigned ${def.name} to the block. Switched to Auction view.`);
    } else {
      showNotice(`Consigned ${def.name} at $${finalStartingBid} reserve.`);
    }
  };

  const handleCollectProceeds = (listingUid: string) => {
    const listing = auctionResults.find((r) => r.uid === listingUid);
    if (!listing) return;

    setMoney((m) => m + listing.finalPrice);
    setAuctionResults((prev) => prev.filter((r) => r.uid !== listingUid));
    showNotice(`Collected $${listing.finalPrice}`);
  };

  const handleCollectAllProceeds = useCallback(() => {
    const soldListings = auctionResults.filter((r) => r.status === 'sold');
    if (soldListings.length === 0) return;
    const total = soldListings.reduce((sum, r) => sum + r.finalPrice, 0);
    setMoney((m) => m + total);
    setAuctionResults((prev) => prev.filter((r) => r.status !== 'sold'));
    showNotice(`Collected $${total} auction proceeds!`);
  }, [auctionResults, showNotice]);

  const handleNewAuctionSession = useCallback(() => {
    setNextAuction(generateAuctionEvent());
    showNotice('New auction session called to the block');
  }, [showNotice]);

  const handleCancelListing = (listingUid: string) => {
    const listing = auctionListings.find((l) => l.uid === listingUid);
    if (!listing) return;

    if (ownedItems.length >= storageCapacity) {
      showNotice('Storage is full. Cannot return item.');
      return;
    }

    const returnedItem: OwnedItem = {
      uid: 'own_' + Math.random().toString(36).substring(2, 9),
      itemId: listing.itemUid,
      condition: listing.condition || 'fair',
      boughtFor: listing.startingBid,
      boughtAt: Date.now(),
      restored: listing.condition === 'pristine',
      makerMark: listing.makerMark,
    };

    setOwnedItems((prev) => [returnedItem, ...prev]);
    setAuctionListings((prev) => prev.filter((l) => l.uid !== listingUid));
    showNotice('Returned item to storage');
  };

  const handleReclaimUnsold = (listingUid: string) => {
    const listing = auctionResults.find((r) => r.uid === listingUid);
    if (!listing) return;

    if (ownedItems.length >= storageCapacity) {
      showNotice('Storage is full. Free up space to reclaim.');
      return;
    }

    const reclaimed: OwnedItem = {
      uid: 'own_' + Math.random().toString(36).substring(2, 9),
      itemId: listing.itemUid,
      condition: listing.condition || 'fair',
      boughtFor: listing.startingBid,
      boughtAt: Date.now(),
      restored: listing.condition === 'pristine',
      makerMark: listing.makerMark,
    };

    setOwnedItems((prev) => [reclaimed, ...prev]);
    setAuctionResults((prev) => prev.filter((r) => r.uid !== listingUid));
    showNotice('Returned item to storage');
  };

  const handleBidHouseLot = (lotUid: string, increment: number) => {
    if (!nextAuction || !nextAuction.houseLots) return;
    const lot = nextAuction.houseLots.find((l) => l.uid === lotUid);
    if (!lot) return;

    const res = placeHouseLotBid(lot, money, increment);
    if (!res.success) {
      showNotice(res.message);
      return;
    }

    setNextAuction((prev) => {
      if (!prev || !prev.houseLots) return prev;
      return {
        ...prev,
        houseLots: prev.houseLots.map((l) => (l.uid === lotUid ? res.updatedLot : l)),
      };
    });

    showNotice(res.message);
  };

  const handleHammerHouseLot = (lotUid: string) => {
    if (!nextAuction || !nextAuction.houseLots) return;
    const lot = nextAuction.houseLots.find((l) => l.uid === lotUid);
    if (!lot) return;

    const res = hammerHouseLot(lot);

    if (res.winner === 'player') {
      if (ownedItems.length >= storageCapacity) {
        showNotice('Storage is full. Cannot claim lot.');
        return;
      }

      setMoney((m) => Math.max(0, m - res.finalPrice));

      const wonItem: OwnedItem = {
        uid: 'own_' + Math.random().toString(36).substring(2, 9),
        itemId: lot.itemId,
        condition: lot.condition,
        boughtFor: res.finalPrice,
        boughtAt: Date.now(),
        restored: false,
        makerMark: lot.makerMark,
      };

      setOwnedItems((prev) => [wonItem, ...prev]);
      addXp(30);
      showNotice(`Gavel down! Won lot for $${res.finalPrice}. +30 XP`);
    } else if (res.winner === 'rival') {
      showNotice(`Gavel down. Sold to ${lot.highestBidder} for $${res.finalPrice}.`);
    } else {
      showNotice('Gavel down. Lot passed with no bids.');
    }

    setNextAuction((prev) => {
      if (!prev || !prev.houseLots) return prev;
      return {
        ...prev,
        houseLots: prev.houseLots.map((l) => (l.uid === lotUid ? res.updatedLot : l)),
      };
    });
  };

  const handleBuySupply = (supplyId: string) => {
    const supply = SUPPLY_ITEMS.find((s) => s.id === supplyId);
    if (!supply) return;
    if (money < supply.cost) {
      showNotice('Not enough money');
      return;
    }

    setMoney((m) => m - supply.cost);
    setSupplies((prev) => ({
      ...prev,
      [supplyId]: (prev[supplyId] ?? 0) + 1,
    }));
  };

  const handleApplySupply = (itemUid: string, supplyId: string) => {
    const item = ownedItems.find((o) => o.uid === itemUid);
    const supply = SUPPLY_ITEMS.find((s) => s.id === supplyId);
    if (!item || !supply) return;

    const def = getItemDef(item.itemId);
    if (!def) return;

    if ((supplies[supplyId] ?? 0) <= 0) return;

    const res = applySupply(item, supply, def);
    if (!res) return;

    setSupplies((prev) => ({
      ...prev,
      [supplyId]: Math.max(0, (prev[supplyId] ?? 1) - 1),
    }));

    setOwnedItems((prev) =>
      prev.map((o) =>
        o.uid === itemUid
          ? {
              ...o,
              condition: res.newCondition,
              restored: true,
            }
          : o
      )
    );

    addXp(25);
    if (res.newCondition === 'pristine') {
      showNotice(`Restored to PRISTINE condition! +25 XP`);
    } else {
      showNotice(`Cleaned to ${res.newCondition} (+25 XP)`);
    }
  };

  const handleUnlockShop = (shopId: ShopId) => {
    const shop = SHOPS.find((s) => s.id === shopId);
    if (!shop) return;
    if (money < shop.unlockCost) {
      showNotice('Not enough money');
      return;
    }

    setMoney((m) => m - shop.unlockCost);
    setUnlockedShopIds((prev) => [...prev, shopId]);
    setActiveShopId(shopId);
    addXp(50);
    showNotice(`Unlocked ${shop.name}! +50 XP`);
  };

  const handleUpgradeVehicle = () => {
    if (!nextVehicle) return;
    if (money < nextVehicle.cost) {
      showNotice(`Need $${nextVehicle.cost} for ${nextVehicle.name}`);
      return;
    }

    setMoney((m) => m - nextVehicle.cost);
    setVehicleTier((t) => t + 1);
    addXp(60);
    showNotice(`Acquired ${nextVehicle.name}! Storage expanded to ${nextVehicle.capacity} slots.`);
  };

  const handleFulfillContract = (contractId: string, itemUid: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    const item = ownedItems.find((o) => o.uid === itemUid);
    if (!contract || !item) return;

    setMoney((m) => m + contract.rewardMoney);
    setOwnedItems((prev) => prev.filter((o) => o.uid !== itemUid));
    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, completed: true } : c))
    );

    addXp(contract.rewardXp);
    showNotice(`Fulfilled contract for ${contract.clientName}! Earned $${contract.rewardMoney} & +${contract.rewardXp} XP.`);
  };

  const completedSets = useMemo(() => {
    return checkCompleteSets(ownedItems);
  }, [ownedItems]);

  const discoveredSets = useMemo(() => {
    const ownedPieceIds = new Set(ownedItems.map((o) => o.itemId));
    return SETS.filter((set) => set.itemIds.some((id) => ownedPieceIds.has(id)));
  }, [ownedItems]);

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-4 flex flex-col">
      {/* Header */}
      <header className="brass-bar p-3 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm tracking-widest text-[var(--wood-brass-bright)]">
            THE LOT
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            Day {gameDay}
          </span>
          <button
            onClick={advanceDay}
            className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#241d17] hover:bg-[#322820] text-[var(--text-parchment)] border border-[var(--wood-border)] rounded-xs"
            title="Advance to next business day"
          >
            Advance Day →
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Dealer Rank Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#100d0a] border border-[#3e2d1c] rounded-xs">
            <span className="text-[10px] uppercase font-bold text-[var(--wood-brass)]">
              Lv {dealerRank.level}
            </span>
            <span className="text-xs font-bold text-[var(--text-parchment)]">
              {dealerRank.title}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              ({dealerXp}{nextRank ? `/${nextRank.minXp}` : ''} XP)
            </span>
          </div>

          <span className="text-sm font-black text-[var(--wood-brass-bright)]">
            ${money.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Level XP Progress Bar (Mobile + Tablet) */}
      <div className="sm:hidden mb-2 px-2 py-1 bg-[#14100c] border border-[var(--wood-border)] flex items-center justify-between text-[11px]">
        <span className="font-bold text-[var(--wood-brass-bright)]">
          Lv {dealerRank.level}: {dealerRank.title}
        </span>
        <span className="text-[var(--text-muted)] font-mono">
          {dealerXp}{nextRank ? `/${nextRank.minXp} XP` : ' (MAX)'}
        </span>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="mb-2 px-3 py-1.5 text-xs bg-[var(--wood-panel)] border border-[var(--wood-border-bright)] text-[var(--text-parchment)] text-center shadow-md animate-fadeIn">
          {notification}
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-1 border-b border-[var(--wood-border)] mb-3 pb-1.5">
        <button
          onClick={() => setActiveTab('shops')}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'shops' ? 'curio-tab-active' : 'curio-tab-inactive'
          }`}
        >
          Shops
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'storage' ? 'curio-tab-active' : 'curio-tab-inactive'
          }`}
        >
          Storage ({ownedItems.length}/{storageCapacity})
        </button>
        <button
          onClick={() => setActiveTab('workshop')}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'workshop' ? 'curio-tab-active' : 'curio-tab-inactive'
          }`}
        >
          Workshop
        </button>
        <button
          onClick={() => {
            setActiveTab('auctions');
            setAuctionDefaultSubTab('floor');
          }}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'auctions' ? 'curio-tab-active' : 'curio-tab-inactive'
          }`}
        >
          Auctions {auctionListings.length > 0 ? `(${auctionListings.length} on block)` : auctionResults.length > 0 ? `(${auctionResults.length} done)` : ''}
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'contracts' ? 'curio-tab-active' : 'curio-tab-inactive'
          }`}
        >
          Contracts ({contracts.filter((c) => !c.completed).length})
        </button>
        <button
          onClick={() => setActiveTab('sets')}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'sets' ? 'curio-tab-active' : 'curio-tab-inactive'
          }`}
        >
          Sets {completedSets.length > 0 ? `(${completedSets.length} ready)` : discoveredSets.length > 0 ? `(${discoveredSets.length})` : ''}
        </button>
      </nav>

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'shops' && (
          <ShopView
            shops={SHOPS}
            activeShopId={activeShopId}
            shopInventories={shopInventories}
            money={money}
            ownedItems={ownedItems}
            storageCapacity={storageCapacity}
            onBuy={handleBuyItem}
            onBuyLocker={handleBuyLocker}
            onSwitchShop={(id) => setActiveShopId(id)}
            onUnlockShop={handleUnlockShop}
            unlockedShopIds={unlockedShopIds}
            contracts={contracts}
          />
        )}

        {activeTab === 'storage' && (
          <div className="flex flex-col gap-3">
            <StorageView
              ownedItems={ownedItems}
              money={money}
              nextAuction={nextAuction}
              onSellDirect={handleSellDirect}
              onListAuction={handleListItem}
              onApplySupply={handleApplySupply}
              onSellSet={handleSellSet}
              onAppraise={handleAppraise}
              onAssemblePart={handleAssemblePart}
              supplies={supplies}
              completeSets={completedSets.map((s) => s.id)}
              contracts={contracts}
            />

            {/* Vehicle & Storage Expansion Upgrade Bar */}
            <div className="curio-tray p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2 border border-[var(--wood-border)]">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--wood-brass-bright)] uppercase tracking-wider">
                    Transport: {currentVehicle.name}
                  </span>
                  <span className="seal-tag bg-[#1c140d] border-[#704d22] text-[var(--wood-brass-bright)] font-bold">
                    Capacity: {storageCapacity} slots
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {currentVehicle.description}
                </span>
              </div>

              {nextVehicle ? (
                <button
                  disabled={money < nextVehicle.cost}
                  onClick={handleUpgradeVehicle}
                  className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--wood-brass)] hover:bg-[var(--wood-brass-bright)] text-[#100d0a] border border-[var(--wood-brass-bright)] disabled:opacity-40 shadow shrink-0"
                >
                  Upgrade to {nextVehicle.name} ({nextVehicle.capacity} slots) - ${nextVehicle.cost}
                </button>
              ) : (
                <span className="seal-tag bg-[#18261b] text-[#81c784] border-[#2b5936] font-bold">
                  Maximum Vault Depository Reached
                </span>
              )}
            </div>
          </div>
        )}

        {activeTab === 'workshop' && (
          <WorkshopView
            ownedItems={ownedItems}
            supplies={supplies}
            money={money}
            onBuySupply={handleBuySupply}
            onApplySupply={handleApplySupply}
          />
        )}

        {activeTab === 'auctions' && (
          <AuctionView
            nextAuction={nextAuction}
            auctionListings={auctionListings}
            auctionResults={auctionResults}
            ownedItems={ownedItems}
            money={money}
            dealerLevelBonus={dealerRank.hammerBonus}
            onListItem={handleListItem}
            onCollectProceeds={handleCollectProceeds}
            onCollectAllProceeds={handleCollectAllProceeds}
            onReclaimUnsold={handleReclaimUnsold}
            onCancelListing={handleCancelListing}
            onBidHouseLot={handleBidHouseLot}
            onHammerHouseLot={handleHammerHouseLot}
            onResolveConsignments={handleResolveAuctionListings}
            onNewAuctionSession={handleNewAuctionSession}
            onDirectLiveSale={handleDirectLiveSale}
            onDirectLivePass={handleDirectLivePass}
            defaultSubTab={auctionDefaultSubTab}
          />
        )}

        {activeTab === 'contracts' && (
          <ContractsView
            contracts={contracts}
            ownedItems={ownedItems}
            onFulfillContract={handleFulfillContract}
          />
        )}

        {activeTab === 'sets' && (
          <div>
            {discoveredSets.length === 0 ? (
              <div className="curio-tray p-8 text-center text-xs text-[var(--text-muted)]">
                No sets discovered yet. Acquire antique items to uncover collections.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {discoveredSets.map((set) => {
                  const ownedPieceIds = new Set(ownedItems.map((o) => o.itemId));
                  const ownedCount = set.itemIds.filter((id) => ownedPieceIds.has(id)).length;
                  const isComplete = ownedCount === set.itemIds.length;
                  const setValue = isComplete ? getSetSellValue(set, ownedItems) : 0;

                  return (
                    <div
                      key={set.id}
                      className={`curio-tray p-3 flex flex-col justify-between ${
                        isComplete ? 'border-[var(--wood-brass)] shadow-md bg-[#16120e]' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--text-parchment)] uppercase">
                            {set.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {ownedCount}/{set.itemIds.length}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                          {set.itemIds.map((itemId) => {
                            const def = getItemDef(itemId);
                            const isOwned = ownedPieceIds.has(itemId);
                            return (
                              <div
                                key={itemId}
                                className="curio-slot flex items-center justify-between text-[11px] px-2.5 py-1.5"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <ItemImage
                                    itemId={itemId}
                                    category={def?.category}
                                    name={def?.name}
                                    className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
                                  />
                                  <span
                                    className="truncate text-xs font-bold"
                                    style={{ color: isOwned ? 'var(--text-parchment)' : 'var(--text-muted)' }}
                                  >
                                    {def?.name ?? itemId}
                                  </span>
                                </div>
                                <span
                                  className="font-bold text-[9px] uppercase seal-tag flex-shrink-0"
                                  style={{
                                    color: isOwned ? '#81c784' : '#8c7e6e',
                                    borderColor: isOwned ? '#2b6040' : '#352a20',
                                    backgroundColor: isOwned ? '#132b1e' : '#14100c',
                                  }}
                                >
                                  {isOwned ? 'OWNED' : 'MISSING'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[var(--wood-border)] flex items-center justify-between">
                        <span className="seal-tag bg-[#271d14] border-[#5c4323] text-[var(--wood-brass-bright)]">
                          {set.bonusMultiplier}x Multiplier
                        </span>
                        {isComplete && (
                          <button
                            onClick={() => {
                              handleSellSet(set.id);
                            }}
                            className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#1e3b2b] hover:bg-[#274f39] text-[#98e2b8] border border-[#2f6345]"
                          >
                            Sell Set (${setValue})
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

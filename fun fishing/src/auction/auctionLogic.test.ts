import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEM_CATALOG,
  SHOPS,
  SUPPLY_ITEMS,
  SETS,
  AUCTION_THEMES,
  STORAGE_LOCKERS,
  PART_ASSEMBLIES,
  getConditionMultiplier,
  getItemDef,
  generateShopInventory,
  getDirectSellValue,
  getAuctionEstimate,
  rollAuctionResult,
  applySupply,
  checkCompleteSets,
  getSetSellValue,
  generateNewsBulletin,
  generateAuctionEvent,
  openStorageLocker,
  assemblePart,
  appraiseItem,
  conditionsForShop,
  placeHouseLotBid,
  hammerHouseLot,
  getRankForXp,
  generateDailyContracts,
  VEHICLE_UPGRADES,
} from './auctionLogic';

test('Auction game catalog has broad diversity of items', () => {
  assert.ok(ITEM_CATALOG.length >= 60, `Catalog should have at least 60 items, found ${ITEM_CATALOG.length}`);

  const categories = new Set(ITEM_CATALOG.map((i) => i.category));
  assert.ok(categories.size >= 10, 'Catalog should cover at least 10 categories');

  const tiers = new Set(ITEM_CATALOG.map((i) => i.tier));
  assert.equal(tiers.size, 5, 'Catalog should have all 5 tiers');
});

test('Shops have balanced progression and starter accessibility', () => {
  const thrift = SHOPS.find((s) => s.id === 'thrift');
  const flea = SHOPS.find((s) => s.id === 'flea');
  assert.ok(thrift && thrift.unlockCost === 0, 'Thrift shop must be free starter shop');
  assert.ok(flea && flea.unlockCost === 0, 'Flea market must be free starter shop');

  // Storage and higher shops cost money to unlock
  const pawn = SHOPS.find((s) => s.id === 'pawn');
  const estate = SHOPS.find((s) => s.id === 'estate');
  const antique = SHOPS.find((s) => s.id === 'antique_mall');
  assert.ok(pawn && pawn.unlockCost > 0);
  assert.ok(estate && estate.unlockCost > pawn.unlockCost);
  assert.ok(antique && antique.unlockCost > estate.unlockCost);
});

test('Condition ladder works and junk has lower multiplier than pristine', () => {
  assert.equal(getConditionMultiplier('junk'), 0.3);
  assert.equal(getConditionMultiplier('dusty'), 0.5);
  assert.equal(getConditionMultiplier('fair'), 0.7);
  assert.equal(getConditionMultiplier('good'), 0.9);
  assert.equal(getConditionMultiplier('pristine'), 1.15);
});

test('Direct sell gives lowball returns making uncleaned flipping unprofitable', () => {
  const sample = ITEM_CATALOG.find((i) => i.id === 'brass_compass') || ITEM_CATALOG[0];
  const sellVal = getDirectSellValue(sample, 'fair');
  // At fair condition (0.7), 40-60% sell rate yields ~28-42% of baseValue
  assert.ok(sellVal < sample.baseValue * 0.7);
});

test('Restoring items increases condition and value', () => {
  const restorable = ITEM_CATALOG.find((i) => i.restorable && i.id === 'brass_lamp') || ITEM_CATALOG.find((i) => i.restorable)!;
  const rag = SUPPLY_ITEMS.find((s) => s.id === 'microfiber_cloth')!;

  const owned = {
    uid: 'test_1',
    itemId: restorable.id,
    condition: 'dusty' as const,
    boughtFor: 5,
    boughtAt: Date.now(),
    restored: false,
  };

  const outcome = applySupply(owned, rag, restorable);
  assert.ok(outcome !== null);
  assert.equal(outcome.newCondition, 'fair');
  assert.ok(outcome.valueGain > 0);
});

test('Auction theme bonus boosts estimates for matching categories', () => {
  const artItem = ITEM_CATALOG.find((i) => i.category === 'art')!;
  const fineArtAuction = {
    id: 'auc_test',
    theme: 'fine_art' as const,
    themeName: 'Fine Art Night',
    startsAt: Date.now(),
    durationMs: 60000,
    categoryBonuses: { art: 1.6 },
    fee: 0.1,
  };
  const generalAuction = {
    id: 'auc_gen',
    theme: 'general' as const,
    themeName: 'General Auction',
    startsAt: Date.now(),
    durationMs: 60000,
    categoryBonuses: {},
    fee: 0.1,
  };

  const fineArtEst = getAuctionEstimate(artItem, 'good', fineArtAuction, null);
  const genEst = getAuctionEstimate(artItem, 'good', generalAuction, null);

  assert.ok(fineArtEst.expected > genEst.expected, 'Fine Art theme should give higher expected hammer price for art');
});

test('Sets system correctly detects complete sets and awards bonus multipliers', () => {
  const setDef = SETS[0];
  const items = setDef.itemIds.map((id, idx) => ({
    uid: `item_${idx}`,
    itemId: id,
    condition: 'good' as const,
    boughtFor: 10,
    boughtAt: Date.now(),
    restored: false,
  }));

  const detectedSets = checkCompleteSets(items);
  assert.ok(detectedSets.some((s) => s.id === setDef.id), 'Should detect complete set');

  const setValue = getSetSellValue(setDef, items);
  assert.ok(setValue > 0);
});

test('Auction generation and news generation produce valid events', () => {
  const news = generateNewsBulletin();
  assert.ok(news.id);
  assert.ok(news.headline.length > 0);
  assert.ok(news.demandMultiplier >= 1.0);

  const auction = generateAuctionEvent();
  assert.ok(auction.id);
  assert.ok(auction.themeName.length > 0);
  assert.ok(auction.fee > 0 && auction.fee < 0.5);
});

test('Blind storage lockers unpack mystery items within bounds', () => {
  const locker = STORAGE_LOCKERS[0];
  const unpacked = openStorageLocker(locker);
  assert.ok(unpacked.length >= locker.minItems && unpacked.length <= locker.maxItems);
  assert.ok(unpacked.every((u) => u.item && u.condition));
});

test('Part matching assembly combines incomplete item and loose part into full item', () => {
  const assembly = PART_ASSEMBLIES[0]; // gramophone
  const incompleteOwned = {
    uid: 'inc_1',
    itemId: assembly.incompleteId,
    condition: 'fair' as const,
    boughtFor: 40,
    boughtAt: Date.now(),
    restored: false,
  };
  const partOwned = {
    uid: 'part_1',
    itemId: assembly.partId,
    condition: 'fair' as const,
    boughtFor: 25,
    boughtAt: Date.now(),
    restored: false,
  };

  const res = assemblePart('inc_1', 'part_1', [incompleteOwned, partOwned]);
  assert.ok(res !== null);
  assert.equal(res.assembled.itemId, assembly.assembledId);
  assert.equal(res.remainingItems.length, 0);
});

test('Appraisal reveals genuine or counterfeit status', () => {
  const item = {
    uid: 'item_app',
    itemId: 'telegraph_key',
    condition: 'good' as const,
    boughtFor: 50,
    boughtAt: Date.now(),
    restored: false,
    makerMark: 'unverified' as const,
  };

  const res = appraiseItem(item);
  assert.ok(res.result === 'authentic' || res.result === 'counterfeit');
});

test('Counterfeit items sold at auction risk fraud detection and fines', () => {
  const item = ITEM_CATALOG.find((i) => i.id === 'telegraph_key')!;
  const event = {
    id: 'auc_fraud',
    theme: 'general' as const,
    themeName: 'General Auction',
    startsAt: Date.now(),
    durationMs: 60000,
    categoryBonuses: {},
    fee: 0.1,
  };

  let caughtCount = 0;
  for (let i = 0; i < 50; i++) {
    const outcome = rollAuctionResult(item, 'fair', event, null, 10, 'counterfeit');
    if (outcome.fined) caughtCount++;
  }

  assert.ok(caughtCount > 0, 'Counterfeits should trigger fraud fines');
});

test('Shops have differentiated condition profiles matching tier realism', () => {
  const thriftConditions = conditionsForShop('thrift');
  assert.ok(thriftConditions.includes('junk'), 'Thrift store should include junk');

  const antiqueMallConditions = conditionsForShop('antique_mall');
  assert.ok(!antiqueMallConditions.includes('junk'), 'Antique mall should have no junk');
  assert.ok(antiqueMallConditions.includes('pristine'), 'Antique mall should feature pristine stock');
});

test('House auction lots generate rough/broken lots and support bidding & hammer mechanics', () => {
  const event = generateAuctionEvent();
  assert.ok(event.houseLots && event.houseLots.length >= 3, 'Should generate house lots');

  const lot = event.houseLots[0];
  assert.ok(lot.startingBid > 0);
  assert.equal(lot.status, 'active');

  // Test player bidding
  const bidRes = placeHouseLotBid(lot, 500, 10);
  assert.ok(bidRes.success, 'Player bid should succeed');
  assert.ok(bidRes.updatedLot.currentBid > lot.startingBid);

  // Test hammer
  const wonLot = { ...lot, highestBidder: 'player' as const, currentBid: 30 };
  const hammerRes = hammerHouseLot(wonLot);
  assert.equal(hammerRes.winner, 'player');
  assert.equal(hammerRes.finalPrice, 30);
  assert.equal(hammerRes.updatedLot.status, 'sold_to_player');
});

test('Catalog has over 80 unique non-overlapping items', () => {
  const ids = ITEM_CATALOG.map((i) => i.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size, 'Every item ID must be unique');
  assert.ok(ITEM_CATALOG.length >= 80, 'Catalog should have over 80 items');
});

test('Dealer career progression correctly maps XP to levels and unlocks perks', () => {
  const rank1 = getRankForXp(0);
  assert.equal(rank1.level, 1);
  assert.equal(rank1.title, 'Curio Scavenger');

  const rank2 = getRankForXp(120);
  assert.equal(rank2.level, 2);
  assert.equal(rank2.title, 'Yard Sale Picker');
  assert.ok(rank2.hammerBonus > 0);

  const rankMax = getRankForXp(5000);
  assert.equal(rankMax.level, 8);
  assert.equal(rankMax.title, 'Auction House Legend');
});

test('Daily contracts generate valid client orders with bounties and XP', () => {
  const contractsDay1 = generateDailyContracts(1);
  assert.ok(contractsDay1.length >= 3, 'Should generate at least 3 daily contracts');

  for (const contract of contractsDay1) {
    assert.ok(contract.id);
    assert.ok(contract.clientName);
    assert.ok(contract.rewardMoney > 0);
    assert.ok(contract.rewardXp > 0);
    assert.ok(['fair', 'good', 'pristine'].includes(contract.minCondition));
  }
});

test('Vehicle upgrades scale storage capacity progressively', () => {
  assert.ok(VEHICLE_UPGRADES.length >= 4);
  for (let i = 1; i < VEHICLE_UPGRADES.length; i++) {
    assert.ok(VEHICLE_UPGRADES[i].capacity > VEHICLE_UPGRADES[i - 1].capacity);
    assert.ok(VEHICLE_UPGRADES[i].cost > VEHICLE_UPGRADES[i - 1].cost);
  }
});

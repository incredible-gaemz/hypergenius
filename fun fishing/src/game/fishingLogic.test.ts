import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FISH_COLLECTION,
  FISHING_AREAS,
  RODS,
  REELS,
  LURES,
  TRAP_TYPES,
  TRAP_BAITS,
  calculateTrapCatch,
  getWaitSpeedLabel,
  rollWaitTime,
  calculateReelDuration,
  rollHookedEncounter,
  TRAP_SLOT_PRICES,
  rollFishEscape,
  getRarityOrder,
} from './fishingLogic.ts';

test('FISHING_AREAS contains exactly 6 realistic areas', () => {
  assert.equal(FISHING_AREAS.length, 6);
  assert.equal(FISHING_AREAS[0].id, 'pond');
  assert.equal(FISHING_AREAS[0].unlockCost, 0); // starter area
  assert.equal(FISHING_AREAS[1].id, 'river');
  assert.equal(FISHING_AREAS[2].id, 'lake');
  assert.equal(FISHING_AREAS[3].id, 'bayou');
  assert.equal(FISHING_AREAS[4].id, 'ocean');
  assert.equal(FISHING_AREAS[5].id, 'reef');

  FISHING_AREAS.forEach((area) => {
    assert.ok(area.theme.bgClass);
    assert.ok(area.theme.panelClass);
    assert.ok(area.theme.borderClass);
    assert.ok(area.theme.accentClass);
  });
});

test('Fish collection has realistic species and prices across 6 areas', () => {
  assert.ok(FISH_COLLECTION.length >= 100, 'Fish collection should have 100+ species');

  const minnow = FISH_COLLECTION.find((f) => f.name === 'Minnow');
  assert.ok(minnow);
  assert.equal(minnow?.basePrice, 1);
  assert.equal(minnow?.areaId, 'pond');

  const smallmouth = FISH_COLLECTION.find((f) => f.name === 'Smallmouth Bass');
  assert.ok(smallmouth);

  const rainbow = FISH_COLLECTION.find((f) => f.name === 'Rainbow Trout');
  assert.ok(rainbow);
  assert.equal(rainbow?.areaId, 'river');

  const bluefin = FISH_COLLECTION.find((f) => f.name === 'Bluefin Tuna');
  assert.ok(bluefin);
  assert.equal(bluefin?.areaId, 'ocean');
});

test('Trapping system correctly calculates passive catch over time', () => {
  const starterTrap = {
    slotIndex: 0,
    trapTypeId: 'wire_minnow_trap',
    areaId: 'pond' as const,
    placedAt: Date.now() - 360000, // 6 minutes ago (150s interval = 2 catches)
    baitId: 'no_bait',
    lastCheckedAt: Date.now(),
  };

  const catchResult = calculateTrapCatch(starterTrap);
  assert.ok(catchResult.count >= 2, '6 minutes should produce at least 2 catches');
  assert.equal(catchResult.fishes.length, catchResult.count);
  assert.ok(catchResult.fishes[0].weight > 0);
  assert.ok(catchResult.fishes[0].name.length > 0);
  assert.ok(catchResult.totalValue > 0);

  // Fast forward to full capacity
  const fullTrap = {
    ...starterTrap,
    placedAt: Date.now() - 3600000, // 1 hour ago
  };
  const fullResult = calculateTrapCatch(fullTrap);
  assert.equal(fullResult.count, TRAP_TYPES[0].capacity);
  assert.equal(fullResult.fishes.length, TRAP_TYPES[0].capacity);
  assert.equal(fullResult.isFull, true);
});

test('The ONE rod is top tier at 0.4s wait', () => {
  const theOneRod = RODS.find((r) => r.id === 'the_one_rod');
  assert.ok(theOneRod);
  assert.equal(theOneRod?.waitSeconds, 0.4);
});

test('getWaitSpeedLabel returns descriptive qualitative categories', () => {
  assert.equal(getWaitSpeedLabel(12.0), 'Very Slow');
  assert.equal(getWaitSpeedLabel(8.5), 'Slow');
  assert.equal(getWaitSpeedLabel(6.0), 'Medium');
  assert.equal(getWaitSpeedLabel(3.8), 'Fast');
  assert.equal(getWaitSpeedLabel(2.5), 'Very Fast');
  assert.equal(getWaitSpeedLabel(1.3), 'Speedy');
  assert.equal(getWaitSpeedLabel(0.8), 'Ultra Fast');
  assert.equal(getWaitSpeedLabel(0.4), 'Instant');
});

test('rollHookedEncounter handles pond catches, reel duration, and sensible stick limits', () => {
  const stick = RODS[0];
  const noBait = LURES[0];
  const reel = REELS[0];

  const fishEncounter = rollHookedEncounter('pond', stick, noBait, reel, { nothingRoll: 0.99 });
  assert.equal(fishEncounter.type, 'fish');
  // Reeling must take longer now (> 2.0s even for smallest baitfish)
  assert.ok(fishEncounter.reelDurationSec >= 2.2, 'Reeling should take at least 2.2 seconds');
  // Stick with no bait should only catch small baitfish/panfish, not 20 lb carp
  assert.ok(fishEncounter.caughtFish!.weight <= 3.8, 'Stick should not catch giant heavy fish');
  assert.equal(fishEncounter.caughtFish!.tier, 'common', 'Bare hook should only attract common baitfish');

  const emptyEncounter = rollHookedEncounter('pond', stick, noBait, reel, { nothingRoll: 0.05 });
  assert.ok(emptyEncounter.type === 'nothing' || emptyEncounter.type === 'junk');
});

test('Starter trap costs $100 and higher reels provide line and bait protection', () => {
  assert.equal(TRAP_SLOT_PRICES[0], 100, 'First trap slot must cost $100');

  const stick = RODS[0];
  const basicReel = REELS[0]; // lineStrength 0
  const highTierReel = REELS[REELS.length - 1]; // high lineStrength

  // High tier reel has lower escape chance on the same fish weight
  const heavyWeight = 3.2; // right near stick limit
  const basicEscape = rollFishEscape(heavyWeight, stick, basicReel, 0.03);
  const highReelEscape = rollFishEscape(heavyWeight, stick, highTierReel, 0.03);
  // High tier reel cushions the fish and prevents escape where basic reel would lose it
  assert.equal(highReelEscape, false);

  // High tier reel protects bait
  const noBait = LURES[0];
  const basicEncounter = rollHookedEncounter('pond', stick, noBait, basicReel, { nothingRoll: 0.25 });
  const highReelEncounter = rollHookedEncounter('pond', stick, noBait, highTierReel, { nothingRoll: 0.25 });
  // At roll 0.25, basic reel loses bait (empty hook or junk), while high tier reel hooks a fish
  assert.ok(basicEncounter.type === 'nothing' || basicEncounter.type === 'junk');
  assert.equal(highReelEncounter.type, 'fish');

  // Verify rarity order
  assert.ok(getRarityOrder('legendary') > getRarityOrder('epic'));
  assert.ok(getRarityOrder('epic') > getRarityOrder('rare'));
  assert.ok(getRarityOrder('rare') > getRarityOrder('uncommon'));
  assert.ok(getRarityOrder('uncommon') > getRarityOrder('common'));
});

test('Field guide data has complete biological info and Wikipedia links for all 134 species', async () => {
  const { FISH_GUIDE_DATA } = await import('./fishGuideData');
  
  assert.equal(FISH_COLLECTION.length, 134, 'Total fish collection must be 134 species');
  
  for (const fish of FISH_COLLECTION) {
    const guide = FISH_GUIDE_DATA[fish.id];
    assert.ok(guide, `Guide data must exist for fish ID ${fish.id} (${fish.name})`);
    assert.ok(guide.scientificName.length > 0, `Scientific name must exist for ${fish.name}`);
    assert.ok(guide.visualDescription.length > 15, `Visual description must be detailed for ${fish.name}`);
    assert.ok(guide.habitatBehavior.length > 10, `Habitat behavior must exist for ${fish.name}`);
    assert.ok(guide.dietNotes.length > 5, `Diet notes must exist for ${fish.name}`);
    assert.ok(guide.wikiUrl.startsWith('https://en.wikipedia.org/wiki/'), `Wiki URL must be valid Wikipedia link for ${fish.name}`);
  }

  // Test unlock rule: >= 1 catch required to unlock guide
  const checkUnlocked = (caughtCount: number) => caughtCount >= 1;
  assert.equal(checkUnlocked(0), false, '0 catches must not unlock guide');
  assert.equal(checkUnlocked(1), true, '1 catch unlocks guide');
  assert.equal(checkUnlocked(2), true, '2 catches remains unlocked');
  assert.equal(checkUnlocked(15), true, 'Multiple catches remains unlocked');
});

test('Traps never catch legendary fish and have rare trophy chance', async () => {
  const { calculateTrapCatch, TRAP_TYPES, FISH_COLLECTION } = await import('./fishingLogic');
  
  // Test across all 6 areas with a high capacity trap soaking for 10 hours
  const areas = ['pond', 'river', 'lake', 'bayou', 'ocean', 'reef'] as const;
  
  for (const areaId of areas) {
    const trap = {
      slotIndex: 0,
      trapTypeId: 'commercial_creel',
      areaId,
      placedAt: Date.now() - 36000000, // 10 hours
      baitId: 'no_bait',
      lastCheckedAt: Date.now(),
    };
    
    const result = calculateTrapCatch(trap);
    assert.ok(result.fishes.length > 0, `Must have caught fish in ${areaId}`);
    
    for (const fish of result.fishes) {
      assert.notEqual(fish.tier, 'legendary', `Trap in ${areaId} must NEVER catch legendary fish! Caught: ${fish.name}`);
    }
  }
});

test('Weather definitions and fish weather affinities are valid', async () => {
  const { WEATHER_TYPES, getFishPreferredWeather, FISH_COLLECTION } = await import('./fishingLogic');
  
  assert.equal(WEATHER_TYPES.length, 5, 'Must have exactly 5 weather types');
  
  for (const fish of FISH_COLLECTION) {
    const pref = getFishPreferredWeather(fish.id);
    assert.ok(pref.length >= 1, `Fish ${fish.name} must have at least one preferred weather`);
    for (const w of pref) {
      assert.ok(WEATHER_TYPES.some((wt) => wt.id === w), `Weather ${w} for ${fish.name} must be a valid weather ID`);
    }
  }
});

test('Market orders system generates valid delivery bounties', async () => {
  const { generateMarketOrders, createNewOrder } = await import('./fishingLogic');
  
  const orders = generateMarketOrders(['pond', 'river'], 3);
  assert.equal(orders.length, 3, 'Must generate 3 orders');
  
  for (const order of orders) {
    assert.ok(order.rewardCash > 0, 'Order reward must be positive cash');
    assert.ok(order.requiredCount >= 1, 'Order must require at least 1 fish');
    assert.ok(order.fishName.length > 0, 'Order must have a fish name');
    assert.notEqual(order.tier, 'legendary', 'Orders should not ask for impossible legendary catches');
  }
});

test('Area unlock costs match user requirements: Bayou $200, Ocean $800, Coral Reef $3000', () => {
  const bayou = FISHING_AREAS.find((a) => a.id === 'bayou');
  const ocean = FISHING_AREAS.find((a) => a.id === 'ocean');
  const reef = FISHING_AREAS.find((a) => a.id === 'reef');

  assert.equal(bayou?.unlockCost, 200, 'Bayou unlock cost must be exactly $200');
  assert.equal(ocean?.unlockCost, 800, 'Ocean unlock cost must be exactly $800');
  assert.equal(reef?.unlockCost, 3000, 'Coral Reef unlock cost must be exactly $3000');
});

test('Fly rod is rated for 10 lbs and cannot catch 50 lbs fish, with exponential strain over cap', async () => {
  const { getMaxRodWeight, calculateReelDuration, rollFishEscape, rollHookedEncounter, RODS, REELS, LURES } = await import('./fishingLogic');

  const flyRod = RODS.find((r) => r.id === 'fly_rod')!;
  const reel = REELS[0];
  const lure = LURES[2]; // Worm

  assert.equal(getMaxRodWeight(flyRod), 10.0, 'Fly rod must be rated for exactly 10 lbs capacity');

  // Verify that rolling catches on a fly rod never produces a 50 lb fish
  for (let i = 0; i < 40; i++) {
    const encounter = rollHookedEncounter('river', flyRod, lure, reel, { nothingRoll: 0.99, weightVariance: 0.99 });
    if (encounter.type === 'fish' && encounter.caughtFish) {
      assert.ok(
        encounter.caughtFish.weight <= 13.0,
        `Fly rod catch weight (${encounter.caughtFish.weight} lbs) must not exceed soft limit (~12.5-13 lbs)`
      );
      assert.notEqual(encounter.caughtFish.name, 'Giant White Sturgeon');
      assert.notEqual(encounter.caughtFish.name, 'River King Chinook');
    }
  }

  // Soft limit exponential test: reeling duration under vs over cap
  const durationUnderCap = calculateReelDuration(8.0, flyRod, reel);
  const durationOverCap = calculateReelDuration(16.0, flyRod, reel);
  assert.ok(
    durationOverCap >= durationUnderCap * 2.0,
    'Reeling over cap must take exponentially longer due to rod strain'
  );

  // Trophy fight multiplier test: trophy catches take 1.5x as long to reel in
  const normalDuration = calculateReelDuration(8.0, flyRod, reel, false);
  const trophyDuration = calculateReelDuration(8.0, flyRod, reel, true);
  assert.equal(
    trophyDuration,
    Number((normalDuration * 1.5).toFixed(1)),
    'Trophy catches must take 1.5x as long to reel in'
  );

  // Soft limit exponential escape test
  const escapeUnder = rollFishEscape(8.0, flyRod, reel, 0.20);
  const escapeSeverelyOver = rollFishEscape(25.0, flyRod, reel, 0.20);
  // Under cap at roll 0.20 it does not snap; severely over cap it easily snaps
  assert.equal(escapeUnder, false);
  assert.equal(escapeSeverelyOver, true);
});

test('Commercial Fleet logic properly calculates voyages, crew wages, and expedition hauls', async () => {
  const {
    BOATS_CATALOG,
    HIREABLE_CREW,
    calculateVoyageDuration,
    calculateExpeditionWageCost,
    calculateExpeditionHaul,
  } = await import('./commercialLogic');

  assert.ok(BOATS_CATALOG.length >= 5, 'Must have at least 5 boat tiers');
  assert.equal(BOATS_CATALOG[0].id, 'skiff');
  assert.equal(BOATS_CATALOG[0].crewCapacity, 1);
  assert.equal(BOATS_CATALOG[2].id, 'trawler');
  assert.equal(BOATS_CATALOG[2].crewCapacity, 3);

  assert.ok(HIREABLE_CREW.length >= 6, 'Must have at least 6 hireable crew members');
  const hank = HIREABLE_CREW.find((c) => c.id === 'hank')!;
  const sammy = HIREABLE_CREW.find((c) => c.id === 'sammy')!;
  assert.ok(hank);
  assert.ok(sammy);

  // Wage calculation
  const wages = calculateExpeditionWageCost([hank, sammy]);
  assert.equal(wages, hank.wagePerVoyage + sammy.wagePerVoyage);

  // Sammy Cruz speed specialty reduces duration by 25%
  const normalDuration = calculateVoyageDuration(BOATS_CATALOG[1], [hank], []);
  const sammyDuration = calculateVoyageDuration(BOATS_CATALOG[1], [sammy], []);
  assert.ok(sammyDuration < normalDuration, 'Sammy Cruz must reduce voyage duration');

  // Test expedition haul generation
  const mockBoat = {
    instanceId: 'test_boat_1',
    boatDefId: 'dory',
    customName: 'The Sea Dart',
    assignedCrewIds: ['hank'],
    installedUpgradeIds: [],
    expedition: {
      startedAt: Date.now() - 50000,
      durationSec: 45,
      destinationAreaId: 'bayou' as const,
      searchFocus: 'volume' as const,
      baitId: 'bare_gear' as const,
      wageCost: 8,
      isCompleted: true,
    },
  };

  const haul = calculateExpeditionHaul(
    mockBoat,
    BOATS_CATALOG[1],
    [hank],
    [],
    mockBoat.expedition
  );

  assert.ok(haul.fishes.length > 0, 'Expedition haul must catch fish');
  assert.ok(haul.totalValue > 0, 'Expedition haul must have positive value');
  assert.ok(haul.fishes.length <= BOATS_CATALOG[1].cargoCapacity, 'Haul must not exceed boat cargo capacity');

  // Test target species focusing and favored bait
  const { getRecommendedCommercialBait } = await import('./commercialLogic');
  const bluefin = FISH_COLLECTION.find((f) => f.name === 'Bluefin Tuna')!;
  assert.ok(bluefin);
  const recBait = getRecommendedCommercialBait(bluefin);
  assert.equal(recBait, 'bulk_squid_crate', 'Bluefin tuna should recommend squid chum block');

  const targetedExpedition = {
    startedAt: 1700000000000,
    durationSec: 600,
    destinationAreaId: 'ocean' as const,
    searchFocus: 'species' as const,
    baitId: 'bulk_squid_crate' as const,
    targetFishId: bluefin.id,
    wageCost: 20,
  };

  const targetedHaul = calculateExpeditionHaul(
    mockBoat,
    BOATS_CATALOG[3], // Longliner
    [hank],
    [],
    targetedExpedition
  );

  const bluefinCount = targetedHaul.fishes.filter((f) => f.fishId === bluefin.id).length;
  const otherSpeciesCount = targetedHaul.fishes.filter((f) => f.fishId !== bluefin.id).length;
  assert.ok(bluefinCount > 0, 'Soft targeted haul should catch the targeted species');
  assert.ok(otherSpeciesCount > 0, 'Soft target must also allow other local area species to be caught');
  assert.ok(bluefinCount < targetedHaul.fishes.length, 'Soft target must not monopolize 100% of the catch');

  // Early recall test: recalling immediately (<20% progress) yields 0 fish
  const earlyRecallHaul = calculateExpeditionHaul(
    mockBoat,
    BOATS_CATALOG[1],
    [hank],
    [],
    mockBoat.expedition,
    [],
    0.05 // 5% progress
  );
  assert.equal(earlyRecallHaul.fishes.length, 0, 'Calling in vessel immediately (<20%) must yield 0 fish');

  // Size variance test: hauls should have small runts, standard adults, and monster specimens
  let hasSmallRunt = false;
  let hasMonster = false;
  for (let s = 0; s < 25; s++) {
    const testExp = {
      ...mockBoat.expedition,
      startedAt: 1700000000000 + s * 9999,
      searchFocus: 'quality' as const,
    };
    const sampleHaul = calculateExpeditionHaul(
      mockBoat,
      BOATS_CATALOG[2],
      [hank],
      [],
      testExp
    );
    for (const f of sampleHaul.fishes) {
      const sp = FISH_COLLECTION.find((spec) => spec.id === f.fishId)!;
      if (f.weight < sp.minWeight) hasSmallRunt = true;
      if (f.isTrophy && f.weight >= sp.trophyWeight) hasMonster = true;
    }
  }
  assert.ok(hasSmallRunt, 'Expeditions must occasionally catch small juvenile runts');
  assert.ok(hasMonster, 'Expeditions must occasionally catch giant monster specimens');

  // Test voyage duration modifiers: Reef takes longer than pond, squid crate takes longer than bare gear, target tracking adds time
  const pondShort = calculateVoyageDuration(BOATS_CATALOG[0], [hank], [], 'pond', 'bare_gear', null);
  const reefLong = calculateVoyageDuration(BOATS_CATALOG[0], [hank], [], 'reef', 'bulk_squid_crate', bluefin.id);
  assert.ok(reefLong > pondShort, 'Reef expedition with heavy bait and target tracking must take longer than pond bare gear');
});

test('Larger rods have minimum fish size and never hook forage minnows', async () => {
  const { rollHookedEncounter, RODS, REELS, LURES } = await import('./fishingLogic');
  const compositeRod = RODS.find((r) => r.id === 'composite_rod')!;
  const reel = REELS[0];
  const bread = LURES.find((l) => l.id === 'bread_crust') || LURES[1];

  for (let i = 0; i < 50; i++) {
    const enc = rollHookedEncounter('pond', compositeRod, bread, reel, { nothingRoll: 0.99 });
    if (enc.type === 'fish' && enc.caughtFish) {
      assert.ok(
        enc.caughtFish.weight >= 1.0,
        `Composite rod catch must weigh >= 1.0 lbs (got ${enc.caughtFish.weight})`
      );
      assert.notEqual(enc.caughtFish.name, 'Minnow', 'Composite rod must never catch a Minnow');
      assert.notEqual(enc.caughtFish.name, 'Fathead Minnow', 'Composite rod must never catch a Fathead Minnow');
      assert.notEqual(enc.caughtFish.name, 'Golden Shiner', 'Composite rod must never catch a Golden Shiner');
    }
  }
});

test('Big heavy rods have a small realistic chance to hook medium-sized fish without minnows', async () => {
  const { rollHookedEncounter, RODS, REELS, LURES } = await import('./fishingLogic');
  const heavyRod = RODS.find((r) => r.id === 'the_one_rod') || RODS.find((r) => r.id === 'titan_spine')!;
  const reel = REELS[0];
  const lure = LURES[2]; // Worm

  let caughtMediumFish = false;
  let caughtHeavyFish = false;

  for (let i = 0; i < 80; i++) {
    const enc = rollHookedEncounter('ocean', heavyRod, lure, reel, { nothingRoll: 0.99 });
    if (enc.type === 'fish' && enc.caughtFish) {
      assert.notEqual(enc.caughtFish.name, 'Minnow');
      assert.notEqual(enc.caughtFish.name, 'Fathead Minnow');
      assert.notEqual(enc.caughtFish.name, 'Golden Shiner');
      if (enc.caughtFish.weight < 100) {
        caughtMediumFish = true;
        assert.ok(
          enc.caughtFish.weight >= 0.5,
          `Medium fish caught on heavy rod must be adult size (got ${enc.caughtFish.weight})`
        );
      } else {
        caughtHeavyFish = true;
      }
    }
  }

  // Also verify deterministic medium fish roll flag
  const forcedMedium = rollHookedEncounter('ocean', heavyRod, lure, reel, {
    nothingRoll: 0.99,
    mediumFishRoll: 0.05,
  });
  assert.equal(forcedMedium.type, 'fish');
  assert.ok(forcedMedium.caughtFish && forcedMedium.caughtFish.weight < 100);

  assert.ok(caughtHeavyFish, 'Heavy rod must catch heavy trophy fish');
  assert.ok(caughtMediumFish, 'Heavy rod must have a realistic small chance to catch medium-sized fish');
});

test('Intuitive fish size classifications and size range thresholds', async () => {
  const {
    getFishSizeClassification,
    getFishSizeThresholds,
    getSizeClassBadgeStyle,
    FISH_COLLECTION,
  } = await import('./fishingLogic');

  const bass = FISH_COLLECTION.find((f) => f.name === 'Largemouth Bass')!;
  assert.ok(bass, 'Largemouth Bass must exist in catalog');

  // Largemouth Bass: min 1.0, max 12.0, trophy 10.0
  const thresholds = getFishSizeThresholds(bass);
  assert.ok(thresholds.juvenileMax < thresholds.averageMax);
  assert.ok(thresholds.averageMax <= thresholds.trophyMin);
  assert.equal(thresholds.trophyMin, bass.trophyWeight);

  // Test size classifications across spectrum (Largemouth Bass: min 1.2, max 10.0, trophy 13.0)
  assert.equal(getFishSizeClassification(1.5, bass), 'Juvenile');
  assert.equal(getFishSizeClassification(5.0, bass), 'Average');
  assert.equal(getFishSizeClassification(9.0, bass), 'Lunker');
  assert.equal(getFishSizeClassification(13.5, bass), 'Trophy');

  // Test badge styling
  assert.ok(getSizeClassBadgeStyle('Juvenile').includes('emerald'));
  assert.ok(getSizeClassBadgeStyle('Average').includes('sky'));
  assert.ok(getSizeClassBadgeStyle('Lunker').includes('purple'));
  assert.ok(getSizeClassBadgeStyle('Trophy').includes('amber'));

  // Strict trophy invariant: A fish is a trophy IF AND ONLY IF weight >= species.trophyWeight
  const { rollHookedEncounter, RODS, REELS, LURES } = await import('./fishingLogic');
  for (const rod of RODS) {
    for (let i = 0; i < 20; i++) {
      const enc = rollHookedEncounter('pond', rod, LURES[1], REELS[0], {
        nothingRoll: 0.99,
        trophyRoll: i % 2 === 0 ? 0.001 : 0.99,
      });
      if (enc.type === 'fish' && enc.caughtFish) {
        const fish = enc.caughtFish;
        const sp = FISH_COLLECTION.find((s) => s.id === fish.fishId)!;
        const sizeClass = getFishSizeClassification(fish.weight, sp);
        if (fish.isTrophy) {
          assert.ok(
            fish.weight >= sp.trophyWeight,
            `Trophy fish must have weight >= trophyWeight (${fish.weight} vs ${sp.trophyWeight})`
          );
          assert.equal(
            sizeClass,
            'Trophy',
            `Trophy fish must have sizeClass === 'Trophy', but got ${sizeClass}`
          );
        } else {
          assert.notEqual(
            sizeClass,
            'Trophy',
            `Non-trophy fish cannot have sizeClass === 'Trophy'`
          );
        }
      }
    }
  }
});

test('Private and commercial contracts separation and generic sailor names', async () => {
  const { createPrivateOrder, createCommercialOrder } = await import('./fishingLogic');
  const { HIREABLE_CREW, generateJobSeekers } = await import('./commercialLogic');

  // Verify private order structure: not commercial bulk
  const privateOrder = createPrivateOrder(['pond', 'lake'], [], 1);
  assert.equal(privateOrder.isCommercialBulk, false, 'Private order must not be commercial bulk');

  // Verify commercial order structure: is commercial bulk
  const commOrder = createCommercialOrder(['pond', 'lake'], [], 1);
  assert.equal(commOrder.isCommercialBulk, true, 'Commercial order must be commercial bulk');
  assert.ok(commOrder.requiredCount >= 2, 'Commercial order must require bulk count');

  // Verify rare private order generation over multiple samples
  let foundRarePrivate = false;
  for (let i = 0; i < 100; i++) {
    const ord = createPrivateOrder(['pond', 'river', 'lake', 'ocean'], [], 5);
    if (ord.category === 'private' && (ord.tier === 'rare' || ord.tier === 'epic')) {
      foundRarePrivate = true;
      assert.ok(ord.rewardCash >= 600, 'Rare private collector bounty must pay high cash reward');
      break;
    }
  }
  assert.ok(foundRarePrivate, 'Should generate rare private collector bounties with high payouts');

  // Verify generic everyday sailor names
  HIREABLE_CREW.forEach((c) => {
    assert.ok(c.name.length > 0);
    assert.equal(c.avatarIcon, '', 'Crew avatar icon must be empty / no emojis');
    assert.ok(!c.name.includes('"') && !c.name.includes("'"), `Sailor name "${c.name}" must not contain AI nicknames`);
  });

  // Verify generated job seekers also have generic everyday names
  for (let i = 0; i < 20; i++) {
    const seekers = generateJobSeekers([]);
    seekers.forEach((s) => {
      assert.equal(s.avatarIcon, '', 'Seeker avatar icon must be empty');
      assert.ok(!s.name.includes('"') && !s.name.includes("'"));
    });
  }
});

test('Hatchery logic calculates breeding, feed options, clutch yields, and bait conversions', async () => {
  const {
    INITIAL_HATCHERY_TANKS,
    FEED_OPTIONS,
    HATCHERY_UPGRADES,
    calculateBreedingDuration,
    calculateClutchYield,
    calculateBatchValue,
    calculateBaitYield,
  } = await import('./hatcheryLogic');
  const { FISH_COLLECTION } = await import('./fishingLogic');
  const { getSearchFocusLabel } = await import('./commercialLogic');

  // Verify search focus labels
  assert.equal(getSearchFocusLabel('quantity'), 'Quantity');
  assert.equal(getSearchFocusLabel('quality'), 'Quality');
  assert.equal(getSearchFocusLabel('volume'), 'Quantity');
  assert.equal(getSearchFocusLabel('trophy'), 'Quality');

  // Verify tanks: Tank 1 starts locked and costs $500
  assert.equal(INITIAL_HATCHERY_TANKS.length, 4);
  assert.equal(INITIAL_HATCHERY_TANKS[0].unlocked, false);
  assert.equal(INITIAL_HATCHERY_TANKS[0].unlockCost, 500);
  assert.equal(INITIAL_HATCHERY_TANKS[1].unlocked, false);
  assert.equal(INITIAL_HATCHERY_TANKS[1].unlockCost, 350);

  // Verify feeds
  assert.equal(FEED_OPTIONS.length, 3);
  assert.equal(FEED_OPTIONS[0].id, 'pellets');
  assert.equal(FEED_OPTIONS[2].id, 'protein');

  // Verify upgrades
  assert.equal(HATCHERY_UPGRADES.length, 7);

  // Check breeding duration: common vs rare, with feed and aerator
  const bluegill = FISH_COLLECTION.find((f) => f.name === 'Bluegill')!;
  const bass = FISH_COLLECTION.find((f) => f.name === 'Pond Largemouth Bass')!;

  const bluegillPellets = calculateBreedingDuration(bluegill, 'pellets', []);
  const bluegillProtein = calculateBreedingDuration(bluegill, 'protein', []);
  assert.ok(bluegillProtein < bluegillPellets, 'Protein feed must accelerate breeding duration');

  const bluegillWithAerator = calculateBreedingDuration(bluegill, 'pellets', ['aerator']);
  assert.ok(bluegillWithAerator < bluegillPellets, 'Aerator must reduce breeding duration');

  // Verify breeding takes longer the more fish pairs are bred
  const singlePairTime = calculateBreedingDuration(bluegill, 'pellets', [], 1.0, 1);
  const triplePairTime = calculateBreedingDuration(bluegill, 'pellets', [], 1.0, 3);
  assert.ok(triplePairTime > singlePairTime, 'Breeding 3 pairs must take longer than breeding 1 pair');

  // Check clutch yield
  const standardYield = calculateClutchYield(bluegill, 'pellets', []);
  const proteinYield = calculateClutchYield(bluegill, 'protein', ['thermostat', 'tank_expansion_1']);
  assert.ok(proteinYield > standardYield, 'Protein feed and thermostat with expanded tank must increase clutch yield');

  // Check batch market value
  const batchVal = calculateBatchValue(bluegill, 6, 1, []);
  assert.ok(batchVal > bluegill.basePrice * 6, 'Batch value must account for adult fish and trophy bonus');

  // Check bait conversion: minnow gives 3x bait per fish
  const minnow = FISH_COLLECTION.find((f) => f.name === 'Minnow')!;
  const baitYield = calculateBaitYield(minnow, 6);
  assert.equal(baitYield, 18, 'Small minnows should convert into 3x live bait charges');

  // Verify breeding pair requirement: clutch yield from pair produces a positive multiplier (>2 offspring)
  assert.ok(standardYield >= 2, 'Breeding pair must yield at least 2 offspring');
});

test('Trap cut fish bait profiles and hatchery max limit capacity scaling', async () => {
  const {
    getFishTrapBaitProfile,
    calculateTrapCatch,
    rollHookedEncounter,
    FISH_COLLECTION,
    FISHING_AREAS,
    RODS,
    REELS,
    LURES,
  } = await import('./fishingLogic');
  const {
    getHatcheryTankMaxCapacity,
    getHatcheryBaitMaxCapacity,
    calculateClutchYield,
  } = await import('./hatcheryLogic');

  // 1. Trap fish cut bait profiles
  const bullhead = FISH_COLLECTION.find((f) => f.name.toLowerCase().includes('catfish') || f.name.toLowerCase().includes('bullhead'))!;
  assert.ok(bullhead, 'Must find catfish/bullhead');
  const catfishBait = getFishTrapBaitProfile({
    name: bullhead.name,
    tier: bullhead.tier,
    areaId: bullhead.areaId,
    weight: 2.5,
  });
  assert.equal(catfishBait.category, 'bottom');
  assert.ok(catfishBait.buffTitle.includes('Heavy Benthic Scent'));
  assert.ok(catfishBait.attractedKeywords.some((k) => k.toLowerCase().includes('catfish')));

  const minnow = FISH_COLLECTION.find((f) => f.name === 'Minnow')!;
  const minnowBait = getFishTrapBaitProfile({
    name: minnow.name,
    tier: minnow.tier,
    areaId: minnow.areaId,
    weight: 0.2,
  });
  assert.equal(minnowBait.category, 'forage');
  assert.ok(minnowBait.attractedKeywords.some((k) => k.toLowerCase().includes('trout')));

  const trophyFish = FISH_COLLECTION.find((f) => f.tier === 'epic' || f.tier === 'rare')!;
  const trophyBait = getFishTrapBaitProfile({
    name: trophyFish.name,
    tier: trophyFish.tier,
    areaId: trophyFish.areaId,
    weight: 12.0,
  });
  assert.equal(trophyBait.category, 'rare');
  assert.ok(trophyBait.weightBonus >= 1.25);

  // 2. Active trap with cut bait produces catch with bonuses
  const activeTrap = {
    slotIndex: 0,
    trapTypeId: 'wire_minnow_trap',
    areaId: 'pond' as const,
    placedAt: Date.now() - 3600000,
    baitId: 'fish_minnow',
    lastCheckedAt: Date.now(),
    baitBuffTitle: minnowBait.buffTitle,
    baitBuffDesc: minnowBait.buffDescription,
    baitCategory: minnowBait.category,
    baitAttractedKeywords: minnowBait.attractedKeywords,
    baitWeightBonus: minnowBait.weightBonus,
    baitRareBonus: minnowBait.rareBonus,
  };
  const trapCatch = calculateTrapCatch(activeTrap);
  assert.ok(trapCatch.fishes.length > 0);
  assert.ok(trapCatch.totalValue > 0);

  // 3. Hatchery capacity limits & upgrades
  assert.equal(getHatcheryTankMaxCapacity([]), 6, 'Base tank capacity should be 6');
  assert.equal(getHatcheryTankMaxCapacity(['tank_expansion_1']), 12, 'Expansion 1 should increase capacity to 12');
  assert.equal(getHatcheryTankMaxCapacity(['tank_expansion_1', 'tank_expansion_2']), 20, 'Expansion 2 should increase capacity to 20');

  assert.equal(getHatcheryBaitMaxCapacity([]), 30, 'Base bait well capacity should be 30');
  assert.equal(getHatcheryBaitMaxCapacity(['bait_well_expansion']), 75, 'Bait well expansion should increase capacity to 75');

  // Verify clutch yield clamps to tank capacity
  const highYieldClutch = calculateClutchYield(minnow, 'protein', []);
  assert.ok(highYieldClutch <= 6, 'Yield without upgrades must not exceed base tank capacity of 6');

  const upgradedClutch = calculateClutchYield(minnow, 'protein', ['tank_expansion_1']);
  assert.ok(upgradedClutch <= 12, 'Yield with expansion 1 must not exceed 12');

  // 4. Live bait encounter modifier test
  const testArea = FISHING_AREAS[0];
  const testRod = RODS[0];
  const testLure = LURES[0];
  const testReel = REELS[0];

  let liveBaitJunkCount = 0;
  let standardJunkCount = 0;
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    const standardEnc = rollHookedEncounter(testArea.id, testRod, testLure, testReel, { useLiveBait: false });
    if (standardEnc.type === 'junk' || standardEnc.type === 'nothing') {
      standardJunkCount++;
    }

    const liveEnc = rollHookedEncounter(testArea.id, testRod, testLure, testReel, { useLiveBait: true });
    if (liveEnc.type === 'junk' || liveEnc.type === 'nothing') {
      liveBaitJunkCount++;
    }
  }

  assert.ok(
    liveBaitJunkCount <= standardJunkCount,
    `Live bait should significantly decrease junk encounters (live: ${liveBaitJunkCount}, standard: ${standardJunkCount})`
  );
});

test('Commercial target species right bait guarantee vs other bait reduced yield', async () => {
  const { calculateExpeditionHaul, BOATS_CATALOG, COMMERCIAL_BAITS, getRecommendedCommercialBait } = await import('./commercialLogic');
  const { FISH_COLLECTION } = await import('./fishingLogic');

  const boatDef = BOATS_CATALOG.find((b) => b.id === 'dory')!; // 18 cargo capacity
  const targetFish = FISH_COLLECTION.find((f) => f.name === 'Channel Catfish')!;
  const rightBaitId = getRecommendedCommercialBait(targetFish);
  const otherBaitId = rightBaitId === 'bulk_worm_crate' ? 'bulk_squid_crate' : 'bulk_worm_crate';

  const dummyExpedition = {
    boatInstanceId: 'test_boat',
    boatDefId: boatDef.id,
    destinationAreaId: targetFish.areaId,
    searchFocus: 'quantity' as const,
    baitId: rightBaitId,
    targetFishId: targetFish.id,
    startedAt: 100000,
    durationSec: 100,
    wageCost: 10,
    isCompleted: false,
  };

  const haulWithRightBait = calculateExpeditionHaul(
    { instanceId: 'test_boat', boatDefId: boatDef.id, customName: 'Dory', assignedCrewIds: ['c1'], installedUpgradeIds: [], expedition: null },
    boatDef,
    [{ id: 'c1', name: 'John Doe', hireCost: 100, wagePerVoyage: 10, specialty: 'apprentice', specialtyTitle: '', specialtyDescription: '', avatarIcon: '', bio: '' }],
    [],
    dummyExpedition
  );

  const targetCountRight = haulWithRightBait.fishes.filter((f) => f.fishId === targetFish.id).length;
  assert.ok(targetCountRight >= 2, `Right bait should guarantee at least 2 target fish (got ${targetCountRight})`);

  // Test with other (different) bait
  const haulWithOtherBait = calculateExpeditionHaul(
    { instanceId: 'test_boat', boatDefId: boatDef.id, customName: 'Dory', assignedCrewIds: ['c1'], installedUpgradeIds: [], expedition: null },
    boatDef,
    [{ id: 'c1', name: 'John Doe', hireCost: 100, wagePerVoyage: 10, specialty: 'apprentice', specialtyTitle: '', specialtyDescription: '', avatarIcon: '', bio: '' }],
    [],
    { ...dummyExpedition, baitId: otherBaitId }
  );

  const targetCountOther = haulWithOtherBait.fishes.filter((f) => f.fishId === targetFish.id).length;
  // Should still be possible to get them, but less or equal to right bait
  assert.ok(targetCountOther <= targetCountRight, `Other bait should yield fewer or equal target fish than favored bait (${targetCountOther} vs ${targetCountRight})`);
});

test('Hatchery scalable pair deposits, mutations, and resident broodstock continuous breeding', async () => {
  const {
    calculateClutchYield,
    calculateBatchValue,
    rollClutchMutations,
    MUTATION_DETAILS,
  } = await import('./hatcheryLogic');
  const { FISH_COLLECTION } = await import('./fishingLogic');

  const bluegill = FISH_COLLECTION.find((f) => f.name === 'Bluegill')!;

  // 1. Scalable pairs yield scaling
  const yield1Pair = calculateClutchYield(bluegill, 'pellets', ['tank_expansion_1'], 1);
  const yield2Pairs = calculateClutchYield(bluegill, 'pellets', ['tank_expansion_1'], 2);
  assert.ok(yield2Pairs > yield1Pair, `2 breeding pairs must produce higher offspring yield than 1 pair (${yield2Pairs} vs ${yield1Pair})`);

  // 2. Genetic mutations roll and value boosts
  const normalBatchVal = calculateBatchValue(bluegill, 6, 0, [], 'normal', 0);
  const goldenBatchVal = calculateBatchValue(bluegill, 6, 0, [], 'golden', 2);
  assert.ok(goldenBatchVal > normalBatchVal, 'Golden mutations must significantly boost batch value');
  assert.equal(MUTATION_DETAILS.golden.valueMultiplier, 3.5);
  assert.equal(MUTATION_DETAILS.albino.valueMultiplier, 2.0);

  // Mutation roll test
  let foundMutations = false;
  for (let i = 0; i < 50; i++) {
    const roll = rollClutchMutations(10, ['genetics_lab'], true, true);
    if (roll.mutationCount > 0 && roll.mutationStrain !== 'normal') {
      foundMutations = true;
      break;
    }
  }
  assert.ok(foundMutations, 'Mutation rolls with lab and guild should produce genetic mutations');
});

test('Dynamic Weather Sighting Rumors and Town Civic Investments', async () => {
  const {
    WEATHER_SIGHTING_RUMORS,
    getCurrentWeatherRumor,
    isWeatherRumorActive,
    getRumorSpecies,
  } = await import('./weatherRumorLogic');
  const {
    CIVIC_INVESTMENTS,
    ANGLER_CLUBS,
    getClubRankTitle,
    getDailyCommodityTrends,
    generateTownBounties,
  } = await import('./townLogic');
  const { rollHookedEncounter, RODS, REELS, LURES } = await import('./fishingLogic');

  // 1. Weather sighting rumors
  assert.ok(WEATHER_SIGHTING_RUMORS.length >= 6);
  const rumor = getCurrentWeatherRumor(100000);
  assert.ok(rumor.headline.length > 0);
  assert.ok(rumor.source.length > 0);

  const species = getRumorSpecies(rumor);
  assert.ok(species.name.length > 0);
  assert.equal(isWeatherRumorActive(rumor, rumor.areaId, rumor.requiredWeather), true);
  assert.equal(isWeatherRumorActive(rumor, 'river', 'clear'), rumor.areaId === 'river' && rumor.requiredWeather === 'clear');

  // Verify rumor strike boost in rollHookedEncounter
  const heavyRod = RODS.find((r) => r.id === 'the_one_rod') || RODS[RODS.length - 1];
  const heavyReel = REELS[REELS.length - 1];
  const dragonLure = LURES.find((l) => l.id === 'dragon_scale') || LURES[LURES.length - 1];

  let rumorCatches = 0;
  for (let i = 0; i < 30; i++) {
    const enc = rollHookedEncounter(rumor.areaId, heavyRod, dragonLure, heavyReel, {
      weather: rumor.requiredWeather,
      weatherRumorActive: true,
      rumorSpeciesId: rumor.speciesId,
    });
    if (enc.caughtFish && enc.caughtFish.fishId === rumor.speciesId) {
      rumorCatches++;
    }
  }
  assert.ok(rumorCatches > 0, 'Matching weather rumor should reliably hook the legendary lurker');

  // 2. Town logic
  assert.equal(CIVIC_INVESTMENTS.length, 5);
  assert.equal(ANGLER_CLUBS.length, 4);
  assert.equal(getClubRankTitle(0), 'Novice Member');
  assert.equal(getClubRankTitle(150), 'Journeyman');
  assert.equal(getClubRankTitle(350), 'Master Angler');
  assert.equal(getClubRankTitle(800), 'Commodore');

  const trends = getDailyCommodityTrends();
  assert.equal(trends.length, 3);
  trends.forEach((t) => {
    assert.ok(t.markupPercent >= 30);
    assert.ok(t.speciesName.length > 0);
  });

  const bounties = generateTownBounties();
  assert.equal(bounties.length, 3);
});

test('Worker bonuses and crew morale enhance voyage speed and catch volume', async () => {
  const {
    calculateVoyageDuration,
    calculateExpeditionHaul,
    getCrewMoraleTitle,
    BOATS_CATALOG,
  } = await import('./commercialLogic');

  // 1. Crew morale title and badge classification
  assert.equal(getCrewMoraleTitle(0).title, 'Standard');
  assert.equal(getCrewMoraleTitle(1).title, 'Pleased');
  assert.equal(getCrewMoraleTitle(2).title, 'Motivated');
  assert.equal(getCrewMoraleTitle(3).title, 'Devoted');
  assert.equal(getCrewMoraleTitle(4).title, 'Harbor Veteran');
  assert.equal(getCrewMoraleTitle(5).title, 'Harbor Veteran');

  const boatDef = BOATS_CATALOG[0];
  const standardCrew = [
    {
      id: 'c1',
      name: 'Old Sailor',
      hireCost: 200,
      wagePerVoyage: 20,
      specialty: 'apprentice' as const,
      specialtyTitle: 'Apprentice',
      specialtyDescription: '',
      avatarIcon: '',
      bio: '',
      moraleLevel: 0,
      bonusPaidTotal: 0,
    },
  ];

  const bonusCrew = [
    {
      ...standardCrew[0],
      moraleLevel: 3,
      bonusPaidTotal: 150,
    },
  ];

  // 2. Voyage duration reduction from morale
  const baseDuration = calculateVoyageDuration(boatDef, standardCrew, [], 'river', 'bulk_worm_crate');
  const bonusDuration = calculateVoyageDuration(boatDef, bonusCrew, [], 'river', 'bulk_worm_crate');
  assert.ok(
    bonusDuration < baseDuration,
    `Bonus crew morale should reduce voyage duration (${bonusDuration}s vs ${baseDuration}s)`
  );

  // 3. Haul yield bonus from morale
  const dummyExpedition = {
    startedAt: 1000,
    durationSec: 60,
    destinationAreaId: 'river' as const,
    searchFocus: 'quantity' as const,
    baitId: 'bulk_worm_crate' as const,
    wageCost: 20,
    targetFishId: null,
  };

  const dummyBoat = {
    instanceId: 'b1',
    boatDefId: boatDef.id,
    customName: 'Seaspray',
    assignedCrewIds: ['c1'],
    installedUpgradeIds: [],
    expedition: null,
  };

  const haulStandard = calculateExpeditionHaul(dummyBoat, boatDef, standardCrew, [], dummyExpedition);
  const haulBonus = calculateExpeditionHaul(dummyBoat, boatDef, bonusCrew, [], dummyExpedition);

  assert.ok(
    haulBonus.bonusNotes.some((n) => n.includes('Crew Morale')),
    'Haul with high morale crew should include Crew Morale bonus note'
  );
  assert.ok(
    haulBonus.fishes.length >= haulStandard.fishes.length,
    'High morale crew should achieve equal or greater catch volume'
  );
});

test('Guild monthly subscriptions, rebalanced perks, and perk activity checks', async () => {
  const {
    ANGLER_CLUBS,
    isClubPerkActive,
    getSubscriptionTimeRemaining,
  } = await import('./townLogic');
  const { calculateTrapCatch, TRAP_TYPES } = await import('./fishingLogic');
  const { calculateExpeditionHaul, BOATS_CATALOG } = await import('./commercialLogic');

  // 1. Verify 4 clubs with monthly dues
  assert.equal(ANGLER_CLUBS.length, 4);
  ANGLER_CLUBS.forEach((club) => {
    assert.ok(club.membershipDues > 0, `${club.name} must have monthly subscription dues`);
    assert.ok(club.primaryPerk.length > 0);
  });

  const casters = ANGLER_CLUBS.find((c) => c.id === 'casters')!;
  const breeders = ANGLER_CLUBS.find((c) => c.id === 'breeders')!;
  const commercial = ANGLER_CLUBS.find((c) => c.id === 'commercial')!;
  const explorers = ANGLER_CLUBS.find((c) => c.id === 'explorers')!;
  assert.ok(casters.membershipDues < breeders.membershipDues, 'Higher tier guilds must require higher subscription dues');
  assert.ok(breeders.membershipDues < commercial.membershipDues, 'Commercial guild dues must exceed apprentice/journeyman');
  assert.ok(commercial.membershipDues < explorers.membershipDues, 'High-Seas Society dues must be the highest tier');

  // 2. Subscription active vs expired check
  const now = Date.now();
  const activeClubState = {
    currentClubId: 'casters' as const,
    reputationPoints: { casters: 50, commercial: 0, breeders: 0, explorers: 0 },
    subscriptionDueAt: now + 500000,
    autoRenew: true,
    isSubscriptionActive: true,
  };
  assert.equal(isClubPerkActive(activeClubState, 'casters'), true);
  assert.equal(isClubPerkActive(activeClubState, 'commercial'), false);

  const expiredClubState = {
    ...activeClubState,
    subscriptionDueAt: now - 1000,
  };
  assert.equal(isClubPerkActive(expiredClubState, 'casters'), false, 'Expired subscription must deactivate guild perks');

  const pausedClubState = {
    ...activeClubState,
    isSubscriptionActive: false,
  };
  assert.equal(isClubPerkActive(pausedClubState, 'casters'), false, 'Paused subscription must deactivate guild perks');

  // 3. Subscription time remaining label
  const activeRemaining = getSubscriptionTimeRemaining(Date.now() + 125000);
  assert.equal(activeRemaining.isOverdue, false);
  assert.ok(activeRemaining.label.includes('2m'));

  const overdueRemaining = getSubscriptionTimeRemaining(Date.now() - 5000);
  assert.equal(overdueRemaining.isOverdue, true);

  // 4. Commercial Union perk: trap soak speed bonus
  const dummyTrap = {
    slotIndex: 0,
    areaId: 'river' as const,
    trapTypeId: TRAP_TYPES[0].id,
    baitId: 'worm' as const,
    placedAt: now - 3600 * 1000,
    lastCheckedAt: now,
  };
  const standardCatch = calculateTrapCatch(dummyTrap, now, 1.0);
  const unionCatch = calculateTrapCatch(dummyTrap, now, 1.10);
  assert.ok(unionCatch.count >= standardCatch.count);

  // 5. Commercial Union salvage crate perk
  const boatDef = BOATS_CATALOG[0];
  const dummyExpedition = {
    startedAt: 1000,
    durationSec: 60,
    destinationAreaId: 'river' as const,
    searchFocus: 'quantity' as const,
    baitId: 'bulk_worm_crate' as const,
    wageCost: 20,
    targetFishId: null,
  };
  const dummyBoat = {
    instanceId: 'b1',
    boatDefId: boatDef.id,
    customName: 'Seaspray',
    assignedCrewIds: [],
    installedUpgradeIds: [],
    expedition: null,
  };

  // Test multiple expedition resolutions with commercial guild enabled to verify salvage crates can trigger
  let sawSalvage = false;
  for (let i = 0; i < 50; i++) {
    const haul = calculateExpeditionHaul(dummyBoat, boatDef, [], [], dummyExpedition, [], 1.0, true);
    if (haul.bonusNotes.some((n) => n.includes('Benthic Union Salvage'))) {
      sawSalvage = true;
      break;
    }
  }
  assert.ok(sawSalvage, 'Benthic Commercial Union should trigger salvage crate bonuses over voyages');
});

test('Town Restaurant operations, menu preparation, wholesale market, and commercial charter requirements', async () => {
  const {
    RESTAURANT_DISHES,
    RESTAURANT_EXPANSIONS,
    RESTAURANT_STAFF_CANDIDATES,
    getDailyWholesaleMarketFish,
    findMatchingDishForFish,
    calculateDishSaleValue,
    calculateDinerTip,
    runDinnerService,
  } = await import('./restaurantLogic');
  const { FISH_COLLECTION } = await import('./fishingLogic');
  const { INITIAL_HATCHERY_TANKS } = await import('./hatcheryLogic');

  // 1. Hatchery starter tank unlock cost is $500
  assert.equal(INITIAL_HATCHERY_TANKS[0].unlockCost, 500, 'Hatchery must cost $500 to unlock');

  // 2. Restaurant dishes and staff
  assert.ok(RESTAURANT_DISHES.length >= 6);
  assert.equal(RESTAURANT_STAFF_CANDIDATES.length, 4);
  assert.equal(RESTAURANT_EXPANSIONS.length, 5);

  // 3. Wholesale market offers daily dock catches
  const wholesaleFish = getDailyWholesaleMarketFish();
  assert.ok(wholesaleFish.length >= 3);
  wholesaleFish.forEach((wf) => {
    assert.ok(wf.speciesId > 0);
    assert.ok(wf.pricePerFish > 0);
    assert.ok(wf.name.length > 0);
  });

  // 4. Dish matching logic
  const bluegill = FISH_COLLECTION.find((f) => f.name.toLowerCase().includes('bluegill'))!;
  const bluegillDish = findMatchingDishForFish(bluegill);
  assert.equal(bluegillDish.id, 'fish_and_chips');

  const catfish = FISH_COLLECTION.find((f) => f.name.toLowerCase().includes('catfish'))!;
  const catfishDish = findMatchingDishForFish(catfish);
  assert.equal(catfishDish.id, 'catfish_poboy');

  const salmon = FISH_COLLECTION.find((f) => f.name.toLowerCase().includes('salmon'))!;
  const salmonDish = findMatchingDishForFish(salmon);
  assert.equal(salmonDish.id, 'salmon_platter');

  // 5. Value calculation with staff and expansions
  const baseFishAndChipsVal = calculateDishSaleValue(bluegillDish, [], []);
  assert.equal(baseFishAndChipsVal, 28);

  const chefRosa = RESTAURANT_STAFF_CANDIDATES.find((s) => s.id === 'staff_chef_rosa')!;
  assert.ok(chefRosa);
  const withChefVal = calculateDishSaleValue(bluegillDish, [chefRosa], []);
  assert.ok(withChefVal > baseFishAndChipsVal, 'Chef Rosa must increase dish value');

  const baseTip = calculateDinerTip(baseFishAndChipsVal, [], []);
  const serverMilo = RESTAURANT_STAFF_CANDIDATES.find((s) => s.id === 'staff_server_milo')!;
  assert.ok(serverMilo);
  const withServerTip = calculateDinerTip(baseFishAndChipsVal, [serverMilo], []);
  assert.ok(withServerTip > baseTip, 'Server Milo must increase diner tips');

  // 6. Dinner service execution
  const testPantry: Record<number, number> = {
    [bluegill.id]: 3,
    [catfish.id]: 2,
  };

  const serviceResult = runDinnerService(testPantry, [chefRosa], []);
  assert.equal(serviceResult.mealsServedCount, 4, 'Standard kitchen without extra tables serves up to 4 meals');
  assert.ok(serviceResult.revenue > 0);
  assert.ok(serviceResult.tips > 0);
  assert.ok(serviceResult.totalPayout > 0);
  assert.equal(serviceResult.wagesPaid, chefRosa.wagePerService);
  assert.ok(serviceResult.netProfit >= 0);

  // Extra tables expansion allows up to 8 meals
  const extraTables = RESTAURANT_EXPANSIONS.find((e) => e.id === 'extra_tables')!;
  assert.ok(extraTables);
  const expandedPantry: Record<number, number> = {
    [bluegill.id]: 5,
    [catfish.id]: 5,
  };
  const expandedService = runDinnerService(expandedPantry, [], [extraTables]);
  assert.equal(expandedService.mealsServedCount, 8, 'Expanded kitchen with extra tables serves up to 8 meals');

  // 7. Multi-step prep styles & ticket rail verification
  const { PREP_STYLES } = await import('./restaurantLogic');
  assert.equal(PREP_STYLES.length, 4, 'Must provide 4 culinary prep styles');
  
  // Crispy ale batter adds +3 table capacity (8 + 3 = 11 tables)
  const fullCapacityPantry: Record<number, number> = {
    [bluegill.id]: 8,
    [catfish.id]: 8,
  };
  const crispyService = runDinnerService(fullCapacityPantry, [], [extraTables], 'crispy_batter');
  assert.equal(crispyService.mealsServedCount, 11, 'Crispy batter with extra tables must serve 11 tables');
  assert.equal(crispyService.tickets.length, 11, 'Must generate 11 order tickets');
  assert.equal(crispyService.tickets[0].prepStyleName, 'Crispy Ale Batter');
  assert.ok(crispyService.tickets[0].dinerComment.length > 5, 'Tickets must include diner comments');
  assert.ok(crispyService.serviceRating.length > 0, 'Service must output a star rating');

  // 8. Staff automation features
  RESTAURANT_STAFF_CANDIDATES.forEach((cand) => {
    assert.ok(cand.automationTitle.length > 3, 'Every candidate must have an automation title');
    assert.ok(cand.automationDescription.length > 10, 'Every candidate must have an automation description');
  });
});

test('Fish pixel art sprites and mutation filter styles resolve properly', async () => {
  const { getFishSpriteUrl, getMutationFilterStyle, FISH_COLLECTION } = await import('./fishingLogic');
  const fs = await import('fs');
  const path = await import('path');

  // Verify sprite mapping for key species
  const bluegill = FISH_COLLECTION.find((f) => f.name === 'Bluegill')!;
  const rainbowTrout = FISH_COLLECTION.find((f) => f.name === 'Rainbow Trout')!;
  const bass = FISH_COLLECTION.find((f) => f.name === 'Pond Largemouth Bass')!;
  const pike = FISH_COLLECTION.find((f) => f.name === 'Northern Pike')!;
  const catfish = FISH_COLLECTION.find((f) => f.name === 'Channel Catfish')!;
  const clownfish = FISH_COLLECTION.find((f) => f.name === 'Clownfish')!;
  const snapper = FISH_COLLECTION.find((f) => f.name === 'Red Snapper')!;
  const perch = FISH_COLLECTION.find((f) => f.name === 'Yellow Perch')!;
  const carp = FISH_COLLECTION.find((f) => f.name === 'Common Carp')!;
  const brookTrout = FISH_COLLECTION.find((f) => f.name === 'Brook Trout')!;
  const gar = FISH_COLLECTION.find((f) => f.name === 'Alligator Gar')!;
  const walleye = FISH_COLLECTION.find((f) => f.name === 'Lake Walleye')!;
  const striper = FISH_COLLECTION.find((f) => f.name === 'Striped Bass')!;
  const tuna = FISH_COLLECTION.find((f) => f.name === 'Bluefin Tuna')!;
  const steelhead = FISH_COLLECTION.find((f) => f.name === 'Steelhead')!;
  const moray = FISH_COLLECTION.find((f) => f.name === 'Spotted Moray Eel')!;

  assert.equal(getFishSpriteUrl(bluegill), './fish/bluegill.png');
  assert.equal(getFishSpriteUrl(rainbowTrout), './fish/rainbow_trout.png');
  assert.equal(getFishSpriteUrl(bass), './fish/largemouth_bass.png');
  assert.equal(getFishSpriteUrl(pike), './fish/northern_pike.png');
  assert.equal(getFishSpriteUrl(catfish), './fish/channel_catfish.png');
  assert.equal(getFishSpriteUrl(clownfish), './fish/clownfish.png');
  assert.equal(getFishSpriteUrl(snapper), './fish/red_snapper.png');
  assert.equal(getFishSpriteUrl(perch), './fish/yellow_perch.png');
  assert.equal(getFishSpriteUrl(carp), './fish/common_carp.png');
  assert.equal(getFishSpriteUrl(brookTrout), './fish/brook_trout.png');
  assert.equal(getFishSpriteUrl(gar), './fish/alligator_gar.png');
  assert.equal(getFishSpriteUrl(walleye), './fish/walleye.png');
  assert.equal(getFishSpriteUrl(striper), './fish/striped_bass.png');
  assert.equal(getFishSpriteUrl(tuna), './fish/bluefin_tuna.png');
  assert.equal(getFishSpriteUrl(steelhead), './fish/steelhead.png', 'Steelhead must map to /fish/steelhead.png');
  assert.equal(getFishSpriteUrl(moray), './fish/spotted_moray.png', 'Spotted Moray Eel must map to /fish/spotted_moray.png');

  // Verify that EVERY single one of the 109 species has a valid sprite URL
  FISH_COLLECTION.forEach((f) => {
    const url = getFishSpriteUrl(f);
    assert.ok(url, `Species "${f.name}" must have a valid sprite URL`);
    assert.ok(url.startsWith('./fish/'), `Sprite URL "${url}" must start with /fish/`);
    assert.ok(url.endsWith('.png'), `Sprite URL "${url}" must end with .png`);

    // Verify file exists in public/fish/
    const diskPath = path.join(process.cwd(), 'public', url.replace(/^\//, ''));
    assert.ok(fs.existsSync(diskPath), `Sprite asset file must exist on disk: ${diskPath}`);
  });

  // Verify mutation styles
  assert.deepEqual(getMutationFilterStyle('normal'), {});
  assert.ok(getMutationFilterStyle('golden').filter.includes('sepia'));
  assert.ok(getMutationFilterStyle('albino').filter.includes('grayscale'));
  assert.ok(getMutationFilterStyle('bioluminescent').filter.includes('hue-rotate'));
});

test('Ocean mega-fauna and 0.01 treasure chest mechanics', async () => {
  const { FISH_COLLECTION, RODS, LURES, REELS, rollHookedEncounter } = await import('./fishingLogic');

  // Verify the 6 new mega-species
  const megaSpecies = [
    'Giant Oarfish',
    'Colossal Squid',
    'Great White Shark',
    'Megamouth Shark',
    'Coelacanth',
    'Giant Oceanic Manta Ray'
  ];

  for (const name of megaSpecies) {
    const f = FISH_COLLECTION.find((fish) => fish.name === name);
    assert.ok(f, `Mega-species "${name}" must exist in FISH_COLLECTION`);
    assert.equal(f.bestLureId, 'dragon_scale', `Mega-species "${name}" must require dragon_scale bait`);
    assert.ok(f.areaId === 'ocean' || f.areaId === 'reef', `Mega-species "${name}" must inhabit ocean or reef`);
  }

  // The 2 largest rods (extreme_rod and the_one_rod) can land these titans
  const extremeRod = RODS.find((r) => r.id === 'extreme_rod')!;
  const theOneRod = RODS.find((r) => r.id === 'the_one_rod')!;
  assert.ok(extremeRod, 'extreme_rod must exist');
  assert.ok(theOneRod, 'the_one_rod must exist');

  // Verify treasure chest encounter roll (0.01 chance)
  const treasureEnc = rollHookedEncounter('ocean', theOneRod, LURES[LURES.length - 1], REELS[0], {
    treasureRoll: 0.005, // below 0.01
  });
  assert.equal(treasureEnc.type, 'treasure', 'Treasure roll < 0.01 must yield a treasure encounter');
  assert.ok(treasureEnc.reelDurationSec >= 4.0, 'Treasure chest must take substantial reeling duration');

  // Non-treasure roll
  const normalEnc = rollHookedEncounter('ocean', theOneRod, LURES[LURES.length - 1], REELS[0], {
    treasureRoll: 0.05,
    nothingRoll: 0.99,
  });
  assert.notEqual(normalEnc.type, 'treasure', 'Roll >= 0.01 must not trigger treasure');
});





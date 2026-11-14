/**
 * Cozy Reel - Whaling Operations
 * High-stakes deep ocean cetacean hunting unlocked with max tier rods and reels.
 */

export interface WhaleSpecies {
  id: string;
  name: string;
  scientificName: string;
  minWeightLbs: number;
  maxWeightLbs: number;
  basePrice: number;
  fightDurationSec: number;
  rarityWeight: number;
  description: string;
  tier?: 'rare' | 'epic' | 'legendary';
}

export interface WhaleCatalogEntry {
  caughtCount: number;
  maxWeight: number;
  firstCaughtAt?: number;
}

export function getWhaleRarityTier(whale: WhaleSpecies): 'rare' | 'epic' | 'legendary' {
  if (whale.tier) return whale.tier;
  if (whale.rarityWeight >= 25) return 'rare';
  if (whale.rarityWeight >= 12) return 'epic';
  return 'legendary';
}

export interface WhaleGuideDetails {
  scientificName: string;
  visualDescription: string;
  habitatBehavior: string;
  dietNotes: string;
  wikiUrl: string;
}

export const WHALE_GUIDE_DATA: Record<string, WhaleGuideDetails> = {
  minke_whale: {
    scientificName: 'Balaenoptera acutorostrata',
    visualDescription: 'Smallest of the rorqual whales, featuring a slender, sharply pointed snout, dark slate-gray dorsum, and a distinct white band across each pectoral fin.',
    habitatBehavior: 'Inhabits temperate to polar offshore waters; fast, active swimmers known for inquisitive approaches toward boats.',
    dietNotes: 'Filter-feeds on swarming euphausiid krill, capelin, sand lance, and schooling herring.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Common_minke_whale',
  },
  beluga_whale: {
    scientificName: 'Delphinapterus leucas',
    visualDescription: 'Stocky arctic cetacean completely white to creamy yellow as adults. Lacks a dorsal fin, possessing a prominent bulbous forehead melon and flexible neck.',
    habitatBehavior: 'Frequents coastal arctic shelves, fjords, and ice margins; highly vocal pod dwellers often termed sea canaries.',
    dietNotes: 'Forages along sea bottoms for arctic cod, flounder, crabs, clams, and marine worms.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Beluga_whale',
  },
  narwhal: {
    scientificName: 'Monodon monoceros',
    visualDescription: 'Medium-sized arctic whale with mottled grey-black and white coloration. Males feature a spiraled straight ivory tusk up to ten feet long.',
    habitatBehavior: 'Inhabits dense arctic pack ice and deep cold channels, navigating breathing fissures in vast frozen sea expanses.',
    dietNotes: 'Performs deep dives up to 5,000 feet to hunt Greenland halibut, arctic cod, squid, and deepwater shrimp.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Narwhal',
  },
  gray_whale: {
    scientificName: 'Eschrichtius robustus',
    visualDescription: 'Slate-gray body heavily patterned with white mottling, barnacles, and whale lice colonies. Lacks a dorsal fin, featuring a series of low knuckles.',
    habitatBehavior: 'Known for epic coastal migrations between arctic feeding grounds and tropical breeding lagoons; forages by plowing shallow seafloors.',
    dietNotes: 'Rolls onto its right side to dredge up benthic amphipod crustaceans, mysids, and polychaete worms from mud.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Gray_whale',
  },
  sei_whale: {
    scientificName: 'Balaenoptera borealis',
    visualDescription: 'Streamlined steel-gray rorqual with fine galvanized skin markings, a tall hooked dorsal fin, and a single sharp ridge on the snout.',
    habitatBehavior: 'One of the fastest marine mammals, cruising offshore deep currents at speeds up to 30 knots in unpredictable migrations.',
    dietNotes: 'Skims near-surface swarms of calanoid copepods, krill, and small schooling pelagic fish.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Sei_whale',
  },
  humpback_whale: {
    scientificName: 'Megaptera novaeangliae',
    visualDescription: 'Robust blackish body with enormous wing-like white pectoral flippers, knobby sensory tubercles along the snout, and a serrated fluke edge.',
    habitatBehavior: 'Renowned for dynamic surface acrobatics, breaches, and cooperative bubble-net feeding, alongside complex acoustic songs.',
    dietNotes: 'Consumes huge quantities of antarctic krill and schooling baitfish trapped inside rising rings of exhaled bubbles.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Humpback_whale',
  },
  right_whale: {
    scientificName: 'Eubalaena glacialis',
    visualDescription: 'Very stocky black baleen whale without a dorsal fin, marked by rough white and yellow callosities on the head and a high arched jaw.',
    habitatBehavior: 'Slow coastal cruiser that skims plankton near surface shipping lanes, producing a distinct V-shaped blowhole spout.',
    dietNotes: 'Filter-feeds almost exclusively on dense blooms of microscopic Calanus copepods and larval krill.',
    wikiUrl: 'https://en.wikipedia.org/wiki/North_Atlantic_right_whale',
  },
  bowhead_whale: {
    scientificName: 'Balaena mysticetus',
    visualDescription: 'Massive dark body with a huge bow-shaped head, white chin patch, and baleen plates up to thirteen feet long, insulated by blubber up to two feet thick.',
    habitatBehavior: 'Spends entire lifespan in icy arctic seas, using its reinforced dome-shaped skull to break breathing holes through heavy ice floes.',
    dietNotes: 'Filters thousands of pounds of arctic krill, pteropods, and copepods daily through giant baleen racks.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Bowhead_whale',
  },
  sperm_whale: {
    scientificName: 'Physeter macrocephalus',
    visualDescription: 'Enormous toothed predator with a blunt barrel head making up a third of its body, wrinkled dark-slate skin, and an asymmetrical left blowhole.',
    habitatBehavior: 'World-champion deep-sea diver, plunging into lightless ocean trenches past 6,500 feet for over an hour using powerful acoustic clicks.',
    dietNotes: 'Apex deep-sea hunter battling giant squid, colossal squid, deepwater skates, and anglerfish in hadal depths.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Sperm_whale',
  },
  fin_whale: {
    scientificName: 'Balaenoptera physalus',
    visualDescription: 'The greyhound of the ocean; slender elongated dark grey frame with an asymmetrical head pattern—lower right jaw is brilliant white, lower left jaw is dark.',
    habitatBehavior: 'Fast pelagic swimmer cruising open oceanic basins and steep continental drop-offs at sustained high speeds.',
    dietNotes: 'Lunge-feeds on massive balls of krill, juvenile squids, capelin, and schooling herring.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Fin_whale',
  },
  blue_whale: {
    scientificName: 'Balaenoptera musculus',
    visualDescription: 'The largest animal known to have ever existed; shimmering mottled blue-gray body stretching up to 100 feet, with a broad U-shaped rostrum and small dorsal fin.',
    habitatBehavior: 'Majestic open-ocean giant roaming pelagic depths individually or in pairs, emitting deep low-frequency infrasonic rumbles.',
    dietNotes: 'Feeds almost exclusively on euphausiid krill, consuming up to four tons per day during feeding season.',
    wikiUrl: 'https://en.wikipedia.org/wiki/Blue_whale',
  },
};

export const WHALE_SPECIES: WhaleSpecies[] = [
  {
    id: 'minke_whale',
    name: 'Minke Whale',
    scientificName: 'Balaenoptera acutorostrata',
    minWeightLbs: 12000,
    maxWeightLbs: 20000,
    basePrice: 18000,
    fightDurationSec: 14.0,
    rarityWeight: 35,
    description: 'Smallest rorqual whale with a sharp pointed snout and white flipper bands.',
  },
  {
    id: 'beluga_whale',
    name: 'Beluga Whale',
    scientificName: 'Delphinapterus leucas',
    minWeightLbs: 2000,
    maxWeightLbs: 3500,
    basePrice: 22000,
    fightDurationSec: 15.0,
    rarityWeight: 30,
    description: 'Arctic white whale with a bulbous melon forehead and flexible neck.',
  },
  {
    id: 'narwhal',
    name: 'Narwhal',
    scientificName: 'Monodon monoceros',
    minWeightLbs: 1800,
    maxWeightLbs: 3500,
    basePrice: 28000,
    fightDurationSec: 16.0,
    rarityWeight: 25,
    description: 'Arctic toothed whale with a long spiraled ivory tusk.',
  },
  {
    id: 'gray_whale',
    name: 'Gray Whale',
    scientificName: 'Eschrichtius robustus',
    minWeightLbs: 40000,
    maxWeightLbs: 80000,
    basePrice: 38000,
    fightDurationSec: 18.0,
    rarityWeight: 20,
    description: 'Mottled gray baleen whale that feeds by scooping benthic amphipods from sea bottoms.',
  },
  {
    id: 'sei_whale',
    name: 'Sei Whale',
    scientificName: 'Balaenoptera borealis',
    minWeightLbs: 35000,
    maxWeightLbs: 65000,
    basePrice: 45000,
    fightDurationSec: 20.0,
    rarityWeight: 18,
    description: 'Fast open-ocean rorqual capable of high cruising speeds in offshore currents.',
  },
  {
    id: 'humpback_whale',
    name: 'Humpback Whale',
    scientificName: 'Megaptera novaeangliae',
    minWeightLbs: 55000,
    maxWeightLbs: 90000,
    basePrice: 55000,
    fightDurationSec: 22.0,
    rarityWeight: 15,
    description: 'Acrosport baleen whale with long knobby pectoral flippers and powerful breaches.',
  },
  {
    id: 'right_whale',
    name: 'North Atlantic Right Whale',
    scientificName: 'Eubalaena glacialis',
    minWeightLbs: 80000,
    maxWeightLbs: 140000,
    basePrice: 68000,
    fightDurationSec: 24.0,
    rarityWeight: 12,
    description: 'Heavy, slow-swimming baleen whale with rough callosities on its head.',
  },
  {
    id: 'bowhead_whale',
    name: 'Bowhead Whale',
    scientificName: 'Balaena mysticetus',
    minWeightLbs: 100000,
    maxWeightLbs: 180000,
    basePrice: 85000,
    fightDurationSec: 26.0,
    rarityWeight: 10,
    description: 'Massive arctic whale with a triangular skull strong enough to break sea ice.',
  },
  {
    id: 'sperm_whale',
    name: 'Sperm Whale',
    scientificName: 'Physeter macrocephalus',
    minWeightLbs: 65000,
    maxWeightLbs: 110000,
    basePrice: 98000,
    fightDurationSec: 28.0,
    rarityWeight: 8,
    description: 'Deep-diving toothed titan with a massive squarish head that hunts giant squid.',
  },
  {
    id: 'fin_whale',
    name: 'Fin Whale',
    scientificName: 'Balaenoptera physalus',
    minWeightLbs: 90000,
    maxWeightLbs: 160000,
    basePrice: 115000,
    fightDurationSec: 30.0,
    rarityWeight: 6,
    description: 'The second largest animal on earth, known as the greyhound of the open sea.',
  },
  {
    id: 'blue_whale',
    name: 'Blue Whale',
    scientificName: 'Balaenoptera musculus',
    minWeightLbs: 180000,
    maxWeightLbs: 380000,
    basePrice: 150000,
    fightDurationSec: 35.0,
    rarityWeight: 4,
    description: 'The largest organism ever known to have lived, ruling the open pelagic expanse.',
  },
];

export interface CaughtWhale {
  instanceId: string;
  speciesId: string;
  name: string;
  weightLbs: number;
  saleValue: number;
  caughtAt: number;
}

export const WHALING_UNLOCK_COST = 250000;

export const QUALIFYING_WHALING_ROD_IDS = [
  'thicc_rod',
  'extreme_rod',
  'the_one_rod',
];

export const QUALIFYING_WHALING_REEL_IDS = [
  'quantum_reel',
  'singularity_spool',
];

export const MAX_WHALING_ROD_ID = 'the_one_rod';
export const MAX_WHALING_REEL_ID = 'singularity_spool';

export const MEGA_WHALE_IDS = [
  'blue_whale',
  'fin_whale',
  'bowhead_whale',
  'sperm_whale',
];

export function isMegaWhale(whaleId: string): boolean {
  return MEGA_WHALE_IDS.includes(whaleId);
}

export function hasMaxWhalingGear(
  ownedRodIds: string[] = [],
  ownedReelIds: string[] = []
): boolean {
  return (
    ownedRodIds.includes(MAX_WHALING_ROD_ID) &&
    ownedReelIds.includes(MAX_WHALING_REEL_ID)
  );
}

export function hasQualifyingWhalingRod(ownedRodIds: string[]): boolean {
  return QUALIFYING_WHALING_ROD_IDS.some((id) => ownedRodIds.includes(id));
}

export function hasQualifyingWhalingReel(ownedReelIds: string[]): boolean {
  return QUALIFYING_WHALING_REEL_IDS.some((id) => ownedReelIds.includes(id));
}

export function hasWhalingGear(ownedRodIds: string[], ownedReelIds: string[]): boolean {
  return hasQualifyingWhalingRod(ownedRodIds) && hasQualifyingWhalingReel(ownedReelIds);
}

export function isWhalingUnlocked(
  ownedRodIds: string[],
  ownedReelIds: string[],
  whalingUnlocked: boolean = false
): boolean {
  return whalingUnlocked && hasWhalingGear(ownedRodIds, ownedReelIds);
}

export function rollWhaleEncounter(
  ownedRodIds: string[] = [],
  ownedReelIds: string[] = []
): {
  whale: WhaleSpecies;
  weightLbs: number;
  saleValue: number;
} {
  const hasMax = hasMaxWhalingGear(ownedRodIds, ownedReelIds);
  const eligiblePool = hasMax
    ? WHALE_SPECIES
    : WHALE_SPECIES.filter((w) => !isMegaWhale(w.id));

  const pool = eligiblePool.length > 0 ? eligiblePool : WHALE_SPECIES;
  const totalWeight = pool.reduce((sum, w) => sum + w.rarityWeight, 0);
  let roll = Math.random() * totalWeight;

  let selected = pool[0];
  for (const w of pool) {
    if (roll < w.rarityWeight) {
      selected = w;
      break;
    }
    roll -= w.rarityWeight;
  }

  const weightVariance = 0.85 + Math.random() * 0.3;
  const weightLbs = Math.round(
    selected.minWeightLbs + (selected.maxWeightLbs - selected.minWeightLbs) * Math.random()
  );
  const sizeFactor = weightLbs / ((selected.minWeightLbs + selected.maxWeightLbs) / 2);
  const saleValue = Math.round(selected.basePrice * sizeFactor);

  return {
    whale: selected,
    weightLbs,
    saleValue,
  };
}

export function getWhaleSpriteUrl(whaleId: string): string {
  return `./whales/${whaleId}.png`;
}

export interface WhaleFightStats {
  startDistanceM: number;
  maxDistanceM: number;
  pullStrength: number;
  runSpeedMps: number;
  reelSpeedMps: number;
  pullDurationSec: number;
  restDurationSec: number;
}

export function getWhaleFightStats(whale: WhaleSpecies, weightLbs: number): WhaleFightStats {
  // Normalize weight ratio logarithmically between Beluga (2,000 lbs) and Blue Whale (380,000 lbs)
  const weightRatio = Math.min(1.0, Math.max(0.05, (Math.log10(weightLbs) - 3.2) / 2.4));

  // Distance: 180m (Beluga) to 580m (Blue Whale)
  const startDistanceM = Math.round(160 + whale.fightDurationSec * 8 + weightRatio * 150);
  const maxDistanceM = Math.round(startDistanceM * 1.35);

  // Tension rate multiplier when battling surges
  const pullStrength = 1.6 + weightRatio * 3.2;

  // How fast the whale pulls out line when surging (mps)
  const runSpeedMps = 2.0 + weightRatio * 4.0;

  // How fast hydraulic winch reels in when whale rests (mps)
  const reelSpeedMps = Math.max(3.5, 9.0 - weightRatio * 4.8);

  return {
    startDistanceM,
    maxDistanceM,
    pullStrength,
    runSpeedMps,
    reelSpeedMps,
    pullDurationSec: 1.8 + weightRatio * 1.8,
    restDurationSec: 2.8 - weightRatio * 0.6,
  };
}

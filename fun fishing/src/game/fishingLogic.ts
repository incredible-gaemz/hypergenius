/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface FishSpecies {
  id: number;
  name: string;
  tier: RarityTier;
  minWeight: number; // lbs
  maxWeight: number; // lbs
  trophyWeight: number; // lbs
  basePrice: number; // $ realistic prices
  bestLureId: string;
  areaId: AreaId;
}

export interface Rod {
  id: string;
  name: string;
  price: number;
  waitSeconds: number; // base wait time (seconds)
  sizeMultiplier: number;
  power: number; // helps reel in heavier fish faster
  minWeight?: number; // Minimum target fish size in lbs (larger rods cannot catch tiny minnows)
}

export interface Reel {
  id: string;
  name: string;
  price: number;
  speedMultiplier: number; // reel-in speed multiplier
  lineStrength: number; // reduces escape chance
}

export interface Lure {
  id: string;
  name: string;
  price: number;
  rarityWeights: Record<RarityTier, number>;
  targetFishIds?: number[];
  targetNote?: string;
  emptyHookChance?: number; // chance to catch nothing (e.g. 0.28 without bait)
}

export interface JunkItem {
  id: string;
  name: string;
  value: number;
}

export interface CaughtFish {
  catchId: string;
  fishId: number;
  name: string;
  tier: RarityTier;
  weight: number;
  isTrophy: boolean;
  value: number;
  caughtAt: number;
  areaId: string;
  mutation?: 'normal' | 'albino' | 'melanistic' | 'bioluminescent' | 'piebald' | 'golden';
  mutationName?: string;
  growthRate?: number;
  fecundity?: number;
  hardiness?: number;
}

export interface CatalogEntry {
  caughtCount: number;
  maxWeight: number;
  hasTrophy: boolean;
  firstCaughtAt: number;
  unlockedMutations?: string[];
}

export type AreaId = 'pond' | 'river' | 'lake' | 'bayou' | 'ocean' | 'reef';

export interface FishingAreaDef {
  id: AreaId;
  name: string;
  description: string;
  unlockCost: number;
  requiredSpecies: number;
  bannerPosition?: string;
  theme: {
    name: string;
    bgClass: string;
    panelClass: string;
    borderClass: string;
    accentClass: string;
    accentBgClass: string;
    textMutedClass: string;
  };
}

export type WeatherId = 'clear' | 'overcast' | 'rain' | 'fog' | 'windy';

export interface WeatherDef {
  id: WeatherId;
  name: string;
  icon: string;
  description: string;
  waterEffect: string;
}

export const WEATHER_TYPES: WeatherDef[] = [
  {
    id: 'clear',
    name: 'Clear & Sunny',
    icon: '',
    description: 'Bright sunshine and calm water.',
    waterEffect: 'Surface panfish, sunfish & reef species active',
  },
  {
    id: 'overcast',
    name: 'Overcast',
    icon: '',
    description: 'Low glare and gray cloud cover.',
    waterEffect: 'Pike, walleye & aggressive gamefish cruising',
  },
  {
    id: 'rain',
    name: 'Rain',
    icon: '',
    description: 'Gentle raindrops disturbing the water surface.',
    waterEffect: 'Trout, catfish & carp feeding heavily',
  },
  {
    id: 'fog',
    name: 'Misty Fog',
    icon: '',
    description: 'Cold dense mist clinging to the water.',
    waterEffect: 'Bottom dwellers, bowfins & sturgeon prowling',
  },
  {
    id: 'windy',
    name: 'Windy',
    icon: '',
    description: 'Strong breeze creating surface ripples & chop.',
    waterEffect: 'Bass, snook & pelagic hunters on the move',
  },
];


/**
 * Exactly 6 realistic fishing areas
 */
export const FISHING_AREAS: FishingAreaDef[] = [
  {
    id: 'pond',
    name: 'Willow Pond',
    description: 'Calm farm pond shallows surrounded by reeds, lily pads, and sunfish.',
    unlockCost: 0,
    requiredSpecies: 0,
    theme: {
      name: 'Farm Pond',
      bgClass: 'bg-[#121612]',
      panelClass: 'bg-[#181f18]',
      borderClass: 'border-[#2d382d]',
      accentClass: 'text-emerald-400',
      accentBgClass: 'bg-emerald-950/40 border-emerald-600/70',
      textMutedClass: 'text-[#7e8f7e]',
    },
  },
  {
    id: 'river',
    name: 'Pine River',
    description: 'Cold, rushing mountain river with swift riffles, gravel runs, and trout eddies.',
    unlockCost: 10,
    requiredSpecies: 4,
    theme: {
      name: 'Mountain River',
      bgClass: 'bg-[#0f151b]',
      panelClass: 'bg-[#141d26]',
      borderClass: 'border-[#223344]',
      accentClass: 'text-sky-400',
      accentBgClass: 'bg-sky-950/40 border-sky-600/70',
      textMutedClass: 'text-[#77899c]',
    },
  },
  {
    id: 'lake',
    name: 'Emerald Lake',
    description: 'Deep freshwater glacial lake with sunken drop-offs, weed beds, and trophy gamefish.',
    unlockCost: 50,
    requiredSpecies: 9,
    theme: {
      name: 'Deep Glacial Lake',
      bgClass: 'bg-[#0c1616]',
      panelClass: 'bg-[#112121]',
      borderClass: 'border-[#1d3838]',
      accentClass: 'text-teal-400',
      accentBgClass: 'bg-teal-950/40 border-teal-600/70',
      textMutedClass: 'text-[#709090]',
    },
  },
  {
    id: 'bayou',
    name: 'Cypress Bayou',
    description: 'Murky swamp backwaters shrouded in Spanish moss, heavy catfish, and alligator gars.',
    unlockCost: 200,
    requiredSpecies: 18,
    theme: {
      name: 'Murky Bayou',
      bgClass: 'bg-[#15150f]',
      panelClass: 'bg-[#1e1d15]',
      borderClass: 'border-[#383524]',
      accentClass: 'text-amber-400',
      accentBgClass: 'bg-amber-950/40 border-amber-600/70',
      textMutedClass: 'text-[#8c947e]',
    },
  },
  {
    id: 'ocean',
    name: 'Coastal Ocean',
    description: 'Atlantic coastal pier and tidal surf where salt gamefish, flounder, and bass hunt.',
    unlockCost: 800,
    requiredSpecies: 28,
    theme: {
      name: 'Coastal Surf',
      bgClass: 'bg-[#0d161d]',
      panelClass: 'bg-[#12202a]',
      borderClass: 'border-[#1f374a]',
      accentClass: 'text-blue-400',
      accentBgClass: 'bg-blue-950/40 border-blue-600/70',
      textMutedClass: 'text-[#708aa0]',
    },
  },
  {
    id: 'reef',
    name: 'Tropical Coral Reef',
    description: 'Vibrant barrier reef drop-offs alive with snappers, barracudas, groupers, and pelagics.',
    unlockCost: 3000,
    requiredSpecies: 40,
    bannerPosition: 'center 15%',
    theme: {
      name: 'Coral Reef',
      bgClass: 'bg-[#121818]',
      panelClass: 'bg-[#172525]',
      borderClass: 'border-[#274040]',
      accentClass: 'text-cyan-300',
      accentBgClass: 'bg-cyan-950/40 border-cyan-500/70',
      textMutedClass: 'text-[#7ba0a0]',
    },
  },
];

export const JUNK_ITEMS: JunkItem[] = [
  { id: 'empty_hook', name: 'Empty Hook', value: 0 },
  { id: 'waterlogged_boot', name: 'Waterlogged Old Boot', value: 0 },
  { id: 'rusty_tin_can', name: 'Rusty Tin Can', value: 0 },
  { id: 'clump_of_seaweed', name: 'Clump of Tangled Seaweed', value: 0 },
  { id: 'sunken_driftwood', name: 'Sunken Driftwood Branch', value: 1 },
];

/**
 * 118 Grounded, realistic fish species
 */
export const FISH_COLLECTION: FishSpecies[] = [
  // --- POND (Willow Pond) ---
  { id: 1, name: 'Minnow', tier: 'common', minWeight: 0.05, maxWeight: 0.25, trophyWeight: 0.35, basePrice: 1, bestLureId: 'bread_crust', areaId: 'pond' },
  { id: 2, name: 'Creek Chub', tier: 'common', minWeight: 0.2, maxWeight: 0.9, trophyWeight: 1.2, basePrice: 2, bestLureId: 'bread_crust', areaId: 'pond' },
  { id: 3, name: 'Golden Shiner', tier: 'common', minWeight: 0.1, maxWeight: 0.6, trophyWeight: 0.8, basePrice: 2, bestLureId: 'bread_crust', areaId: 'pond' },
  { id: 4, name: 'Fathead Minnow', tier: 'common', minWeight: 0.05, maxWeight: 0.2, trophyWeight: 0.3, basePrice: 1, bestLureId: 'bread_crust', areaId: 'pond' },
  { id: 5, name: 'Bluegill', tier: 'common', minWeight: 0.3, maxWeight: 1.5, trophyWeight: 1.9, basePrice: 3, bestLureId: 'worm', areaId: 'pond' },
  { id: 6, name: 'Pumpkinseed Sunfish', tier: 'common', minWeight: 0.25, maxWeight: 1.2, trophyWeight: 1.6, basePrice: 3, bestLureId: 'worm', areaId: 'pond' },
  { id: 7, name: 'Green Sunfish', tier: 'common', minWeight: 0.3, maxWeight: 1.4, trophyWeight: 1.8, basePrice: 3, bestLureId: 'worm', areaId: 'pond' },
  { id: 8, name: 'Redear Sunfish', tier: 'common', minWeight: 0.4, maxWeight: 2.0, trophyWeight: 2.6, basePrice: 4, bestLureId: 'worm', areaId: 'pond' },
  { id: 9, name: 'Warmouth', tier: 'common', minWeight: 0.4, maxWeight: 1.8, trophyWeight: 2.4, basePrice: 4, bestLureId: 'worm', areaId: 'pond' },
  { id: 10, name: 'Rock Bass', tier: 'common', minWeight: 0.5, maxWeight: 2.0, trophyWeight: 2.6, basePrice: 4, bestLureId: 'jig', areaId: 'pond' },
  { id: 11, name: 'Yellow Bullhead', tier: 'common', minWeight: 0.8, maxWeight: 3.5, trophyWeight: 4.5, basePrice: 5, bestLureId: 'cheese_cube', areaId: 'pond' },
  { id: 12, name: 'Black Bullhead', tier: 'common', minWeight: 0.7, maxWeight: 3.2, trophyWeight: 4.2, basePrice: 5, bestLureId: 'cheese_cube', areaId: 'pond' },
  { id: 13, name: 'Brown Bullhead', tier: 'common', minWeight: 0.8, maxWeight: 3.8, trophyWeight: 4.8, basePrice: 5, bestLureId: 'cheese_cube', areaId: 'pond' },
  { id: 14, name: 'Pond Largemouth Bass', tier: 'uncommon', minWeight: 1.0, maxWeight: 6.5, trophyWeight: 8.5, basePrice: 12, bestLureId: 'crankbait', areaId: 'pond' },
  { id: 15, name: 'Common Carp', tier: 'uncommon', minWeight: 3.0, maxWeight: 22.0, trophyWeight: 28.0, basePrice: 12, bestLureId: 'sweet_corn', areaId: 'pond' },
  { id: 16, name: 'Mirror Carp', tier: 'uncommon', minWeight: 4.0, maxWeight: 25.0, trophyWeight: 32.0, basePrice: 14, bestLureId: 'sweet_corn', areaId: 'pond' },
  { id: 17, name: 'Grass Carp', tier: 'uncommon', minWeight: 5.0, maxWeight: 30.0, trophyWeight: 38.0, basePrice: 15, bestLureId: 'sweet_corn', areaId: 'pond' },
  { id: 18, name: 'Crucian Carp', tier: 'rare', minWeight: 2.0, maxWeight: 12.0, trophyWeight: 16.0, basePrice: 24, bestLureId: 'sweet_corn', areaId: 'pond' },
  { id: 19, name: 'Trophy Pond Bass', tier: 'epic', minWeight: 6.0, maxWeight: 13.0, trophyWeight: 15.5, basePrice: 65, bestLureId: 'crankbait', areaId: 'pond' },
  { id: 20, name: 'Golden Pond Koi', tier: 'legendary', minWeight: 8.0, maxWeight: 28.0, trophyWeight: 35.0, basePrice: 220, bestLureId: 'dragon_scale', areaId: 'pond' },

  // --- RIVER (Pine River) ---
  { id: 21, name: 'Brook Trout', tier: 'common', minWeight: 0.5, maxWeight: 3.5, trophyWeight: 4.5, basePrice: 10, bestLureId: 'mayfly', areaId: 'river' },
  { id: 22, name: 'Rainbow Trout', tier: 'common', minWeight: 0.8, maxWeight: 5.5, trophyWeight: 7.0, basePrice: 12, bestLureId: 'mayfly', areaId: 'river' },
  { id: 23, name: 'Brown Trout', tier: 'common', minWeight: 1.0, maxWeight: 7.0, trophyWeight: 9.5, basePrice: 14, bestLureId: 'spinner', areaId: 'river' },
  { id: 24, name: 'River Smallmouth Bass', tier: 'common', minWeight: 0.8, maxWeight: 5.0, trophyWeight: 6.8, basePrice: 12, bestLureId: 'jig', areaId: 'river' },
  { id: 25, name: 'Cutthroat Trout', tier: 'uncommon', minWeight: 0.9, maxWeight: 6.0, trophyWeight: 8.0, basePrice: 16, bestLureId: 'mayfly', areaId: 'river' },
  { id: 26, name: 'Golden Trout', tier: 'uncommon', minWeight: 0.6, maxWeight: 4.0, trophyWeight: 5.5, basePrice: 22, bestLureId: 'mayfly', areaId: 'river' },
  { id: 27, name: 'Mountain Whitefish', tier: 'uncommon', minWeight: 0.7, maxWeight: 3.8, trophyWeight: 5.0, basePrice: 15, bestLureId: 'jig', areaId: 'river' },
  { id: 28, name: 'Arctic Grayling', tier: 'uncommon', minWeight: 0.8, maxWeight: 4.5, trophyWeight: 6.0, basePrice: 24, bestLureId: 'mayfly', areaId: 'river' },
  { id: 29, name: 'River Walleye', tier: 'uncommon', minWeight: 1.2, maxWeight: 8.0, trophyWeight: 11.0, basePrice: 18, bestLureId: 'jig', areaId: 'river' },
  { id: 30, name: 'Sauger', tier: 'uncommon', minWeight: 1.0, maxWeight: 5.5, trophyWeight: 7.0, basePrice: 16, bestLureId: 'jig', areaId: 'river' },
  { id: 31, name: 'Fallfish', tier: 'uncommon', minWeight: 0.8, maxWeight: 3.0, trophyWeight: 4.0, basePrice: 11, bestLureId: 'worm', areaId: 'river' },
  { id: 32, name: 'River Redhorse', tier: 'rare', minWeight: 2.0, maxWeight: 12.0, trophyWeight: 16.0, basePrice: 28, bestLureId: 'crawfish', areaId: 'river' },
  { id: 33, name: 'Bull Trout', tier: 'rare', minWeight: 2.5, maxWeight: 16.0, trophyWeight: 22.0, basePrice: 38, bestLureId: 'spinner', areaId: 'river' },
  { id: 34, name: 'Tiger Trout', tier: 'rare', minWeight: 1.5, maxWeight: 9.0, trophyWeight: 12.0, basePrice: 45, bestLureId: 'spinner', areaId: 'river' },
  { id: 35, name: 'Steelhead', tier: 'epic', minWeight: 4.0, maxWeight: 24.0, trophyWeight: 30.0, basePrice: 75, bestLureId: 'spinner', areaId: 'river' },
  { id: 36, name: 'White Sturgeon', tier: 'epic', minWeight: 25.0, maxWeight: 180.0, trophyWeight: 240.0, basePrice: 140, bestLureId: 'stinky_clam', areaId: 'river' },
  { id: 37, name: 'River King Chinook', tier: 'epic', minWeight: 12.0, maxWeight: 55.0, trophyWeight: 70.0, basePrice: 160, bestLureId: 'shad', areaId: 'river' },
  { id: 38, name: 'Giant White Sturgeon', tier: 'legendary', minWeight: 80.0, maxWeight: 450.0, trophyWeight: 600.0, basePrice: 550, bestLureId: 'dragon_scale', areaId: 'river' },

  // --- LAKE (Emerald Lake) ---
  { id: 39, name: 'Largemouth Bass', tier: 'common', minWeight: 1.2, maxWeight: 10.0, trophyWeight: 13.0, basePrice: 16, bestLureId: 'crankbait', areaId: 'lake' },
  { id: 40, name: 'Smallmouth Bass', tier: 'common', minWeight: 1.0, maxWeight: 7.0, trophyWeight: 9.5, basePrice: 15, bestLureId: 'jig', areaId: 'lake' },
  { id: 41, name: 'Spotted Bass', tier: 'common', minWeight: 0.8, maxWeight: 6.0, trophyWeight: 8.0, basePrice: 14, bestLureId: 'jig', areaId: 'lake' },
  { id: 42, name: 'White Bass', tier: 'common', minWeight: 0.7, maxWeight: 4.5, trophyWeight: 6.0, basePrice: 12, bestLureId: 'spinner', areaId: 'lake' },
  { id: 43, name: 'Yellow Perch', tier: 'common', minWeight: 0.4, maxWeight: 2.2, trophyWeight: 2.8, basePrice: 8, bestLureId: 'minnow', areaId: 'lake' },
  { id: 44, name: 'Black Crappie', tier: 'common', minWeight: 0.5, maxWeight: 3.0, trophyWeight: 4.0, basePrice: 10, bestLureId: 'minnow', areaId: 'lake' },
  { id: 45, name: 'White Crappie', tier: 'common', minWeight: 0.5, maxWeight: 2.8, trophyWeight: 3.8, basePrice: 10, bestLureId: 'minnow', areaId: 'lake' },
  { id: 46, name: 'Lake Walleye', tier: 'uncommon', minWeight: 1.5, maxWeight: 11.0, trophyWeight: 15.0, basePrice: 22, bestLureId: 'jig', areaId: 'lake' },
  { id: 47, name: 'Lake Whitefish', tier: 'uncommon', minWeight: 1.2, maxWeight: 7.0, trophyWeight: 9.5, basePrice: 18, bestLureId: 'jig', areaId: 'lake' },
  { id: 48, name: 'Northern Pike', tier: 'rare', minWeight: 3.0, maxWeight: 24.0, trophyWeight: 30.0, basePrice: 42, bestLureId: 'spinner', areaId: 'lake' },
  { id: 49, name: 'Chain Pickerel', tier: 'rare', minWeight: 1.5, maxWeight: 7.5, trophyWeight: 9.5, basePrice: 32, bestLureId: 'spinner', areaId: 'lake' },
  { id: 50, name: 'Tiger Muskellunge', tier: 'rare', minWeight: 4.0, maxWeight: 30.0, trophyWeight: 40.0, basePrice: 55, bestLureId: 'crankbait', areaId: 'lake' },
  { id: 51, name: 'Muskellunge', tier: 'rare', minWeight: 6.0, maxWeight: 42.0, trophyWeight: 55.0, basePrice: 70, bestLureId: 'crankbait', areaId: 'lake' },
  { id: 52, name: 'Lake Trout (Mackinaw)', tier: 'rare', minWeight: 4.0, maxWeight: 35.0, trophyWeight: 45.0, basePrice: 52, bestLureId: 'crankbait', areaId: 'lake' },
  { id: 53, name: 'Burbot', tier: 'rare', minWeight: 2.5, maxWeight: 16.0, trophyWeight: 22.0, basePrice: 48, bestLureId: 'jig', areaId: 'lake' },
  { id: 54, name: 'Freshwater Drum', tier: 'rare', minWeight: 3.0, maxWeight: 22.0, trophyWeight: 28.0, basePrice: 36, bestLureId: 'crawfish', areaId: 'lake' },
  { id: 55, name: 'Lake Sturgeon', tier: 'epic', minWeight: 20.0, maxWeight: 150.0, trophyWeight: 190.0, basePrice: 190, bestLureId: 'stinky_clam', areaId: 'lake' },
  { id: 56, name: 'Ancient Lake Sturgeon', tier: 'legendary', minWeight: 60.0, maxWeight: 320.0, trophyWeight: 400.0, basePrice: 750, bestLureId: 'dragon_scale', areaId: 'lake' },

  // --- BAYOU (Cypress Bayou) ---
  { id: 57, name: 'Bowfin (Mudfish)', tier: 'common', minWeight: 2.0, maxWeight: 12.0, trophyWeight: 16.0, basePrice: 15, bestLureId: 'crawfish', areaId: 'bayou' },
  { id: 58, name: 'Channel Catfish', tier: 'common', minWeight: 2.0, maxWeight: 18.0, trophyWeight: 24.0, basePrice: 18, bestLureId: 'cheese_cube', areaId: 'bayou' },
  { id: 59, name: 'Flathead Catfish', tier: 'uncommon', minWeight: 4.0, maxWeight: 48.0, trophyWeight: 62.0, basePrice: 32, bestLureId: 'crawfish', areaId: 'bayou' },
  { id: 60, name: 'Blue Catfish', tier: 'uncommon', minWeight: 5.0, maxWeight: 65.0, trophyWeight: 85.0, basePrice: 38, bestLureId: 'cheese_cube', areaId: 'bayou' },
  { id: 61, name: 'Spotted Gar', tier: 'uncommon', minWeight: 1.5, maxWeight: 8.0, trophyWeight: 11.0, basePrice: 24, bestLureId: 'minnow', areaId: 'bayou' },
  { id: 62, name: 'Shortnose Gar', tier: 'uncommon', minWeight: 1.2, maxWeight: 7.0, trophyWeight: 9.0, basePrice: 22, bestLureId: 'minnow', areaId: 'bayou' },
  { id: 63, name: 'Longnose Gar', tier: 'rare', minWeight: 3.0, maxWeight: 25.0, trophyWeight: 34.0, basePrice: 48, bestLureId: 'spinner', areaId: 'bayou' },
  { id: 64, name: 'Bigmouth Buffalo', tier: 'rare', minWeight: 6.0, maxWeight: 45.0, trophyWeight: 60.0, basePrice: 55, bestLureId: 'sweet_corn', areaId: 'bayou' },
  { id: 65, name: 'Smallmouth Buffalo', tier: 'rare', minWeight: 5.0, maxWeight: 38.0, trophyWeight: 50.0, basePrice: 50, bestLureId: 'sweet_corn', areaId: 'bayou' },
  { id: 66, name: 'Paddlefish', tier: 'rare', minWeight: 10.0, maxWeight: 75.0, trophyWeight: 100.0, basePrice: 78, bestLureId: 'jig', areaId: 'bayou' },
  { id: 67, name: 'Alligator Gar', tier: 'epic', minWeight: 25.0, maxWeight: 190.0, trophyWeight: 250.0, basePrice: 160, bestLureId: 'bloodworm', areaId: 'bayou' },
  { id: 68, name: 'Monster Flathead Catfish', tier: 'epic', minWeight: 35.0, maxWeight: 110.0, trophyWeight: 140.0, basePrice: 175, bestLureId: 'crawfish', areaId: 'bayou' },
  { id: 69, name: 'Albino River Gar', tier: 'legendary', minWeight: 40.0, maxWeight: 230.0, trophyWeight: 300.0, basePrice: 850, bestLureId: 'dragon_scale', areaId: 'bayou' },

  // --- OCEAN (Coastal Ocean) ---
  { id: 70, name: 'Atlantic Mackerel', tier: 'common', minWeight: 0.8, maxWeight: 3.5, trophyWeight: 4.5, basePrice: 12, bestLureId: 'spinner', areaId: 'ocean' },
  { id: 71, name: 'Pacific Sardine', tier: 'common', minWeight: 0.2, maxWeight: 0.8, trophyWeight: 1.1, basePrice: 6, bestLureId: 'minnow', areaId: 'ocean' },
  { id: 72, name: 'Striped Mullet', tier: 'common', minWeight: 1.0, maxWeight: 4.0, trophyWeight: 5.5, basePrice: 10, bestLureId: 'bread_crust', areaId: 'ocean' },
  { id: 73, name: 'Summer Flounder', tier: 'common', minWeight: 1.5, maxWeight: 8.0, trophyWeight: 11.0, basePrice: 18, bestLureId: 'jig', areaId: 'ocean' },
  { id: 74, name: 'Winter Flounder', tier: 'common', minWeight: 1.0, maxWeight: 6.0, trophyWeight: 8.0, basePrice: 16, bestLureId: 'jig', areaId: 'ocean' },
  { id: 75, name: 'Black Sea Bass', tier: 'common', minWeight: 1.2, maxWeight: 6.5, trophyWeight: 8.5, basePrice: 18, bestLureId: 'jig', areaId: 'ocean' },
  { id: 76, name: 'Sheepshead', tier: 'uncommon', minWeight: 2.0, maxWeight: 12.0, trophyWeight: 16.0, basePrice: 28, bestLureId: 'crawfish', areaId: 'ocean' },
  { id: 77, name: 'Speckled Sea Trout', tier: 'uncommon', minWeight: 1.5, maxWeight: 8.5, trophyWeight: 11.5, basePrice: 26, bestLureId: 'minnow', areaId: 'ocean' },
  { id: 78, name: 'Striped Bass', tier: 'uncommon', minWeight: 4.0, maxWeight: 40.0, trophyWeight: 52.0, basePrice: 38, bestLureId: 'crankbait', areaId: 'ocean' },
  { id: 79, name: 'Red Drum (Redfish)', tier: 'uncommon', minWeight: 3.5, maxWeight: 35.0, trophyWeight: 48.0, basePrice: 36, bestLureId: 'crankbait', areaId: 'ocean' },
  { id: 80, name: 'Black Drum', tier: 'uncommon', minWeight: 5.0, maxWeight: 50.0, trophyWeight: 65.0, basePrice: 42, bestLureId: 'stinky_clam', areaId: 'ocean' },
  { id: 81, name: 'Bluefish', tier: 'uncommon', minWeight: 2.5, maxWeight: 18.0, trophyWeight: 24.0, basePrice: 32, bestLureId: 'spinner', areaId: 'ocean' },
  { id: 82, name: 'Snook', tier: 'rare', minWeight: 4.0, maxWeight: 28.0, trophyWeight: 36.0, basePrice: 65, bestLureId: 'jig', areaId: 'ocean' },
  { id: 83, name: 'Tarpon', tier: 'rare', minWeight: 15.0, maxWeight: 140.0, trophyWeight: 190.0, basePrice: 95, bestLureId: 'shad', areaId: 'ocean' },
  { id: 84, name: 'Cobia', tier: 'rare', minWeight: 10.0, maxWeight: 75.0, trophyWeight: 98.0, basePrice: 85, bestLureId: 'jig', areaId: 'ocean' },
  { id: 85, name: 'Pacific Halibut', tier: 'rare', minWeight: 15.0, maxWeight: 180.0, trophyWeight: 240.0, basePrice: 95, bestLureId: 'stinky_clam', areaId: 'ocean' },
  { id: 86, name: 'King (Chinook) Salmon', tier: 'rare', minWeight: 8.0, maxWeight: 50.0, trophyWeight: 65.0, basePrice: 75, bestLureId: 'shad', areaId: 'ocean' },
  { id: 87, name: 'Yellowfin Tuna', tier: 'epic', minWeight: 20.0, maxWeight: 160.0, trophyWeight: 210.0, basePrice: 220, bestLureId: 'squid', areaId: 'ocean' },
  { id: 88, name: 'Bluefin Tuna', tier: 'epic', minWeight: 50.0, maxWeight: 550.0, trophyWeight: 720.0, basePrice: 450, bestLureId: 'squid', areaId: 'ocean' },
  { id: 89, name: 'Giant Bluefin Tuna', tier: 'legendary', minWeight: 120.0, maxWeight: 980.0, trophyWeight: 1300.0, basePrice: 1800, bestLureId: 'dragon_scale', areaId: 'ocean' },

  // --- REEF (Tropical Coral Reef) ---
  { id: 90, name: 'Clownfish', tier: 'common', minWeight: 0.1, maxWeight: 0.4, trophyWeight: 0.6, basePrice: 15, bestLureId: 'bread_crust', areaId: 'reef' },
  { id: 91, name: 'Blue Tang', tier: 'common', minWeight: 0.3, maxWeight: 1.2, trophyWeight: 1.6, basePrice: 20, bestLureId: 'worm', areaId: 'reef' },
  { id: 92, name: 'Stoplight Parrotfish', tier: 'common', minWeight: 1.0, maxWeight: 4.5, trophyWeight: 6.0, basePrice: 25, bestLureId: 'jig', areaId: 'reef' },
  { id: 93, name: 'Queen Angelfish', tier: 'common', minWeight: 0.8, maxWeight: 3.5, trophyWeight: 4.8, basePrice: 22, bestLureId: 'worm', areaId: 'reef' },
  { id: 94, name: 'Yellowtail Snapper', tier: 'uncommon', minWeight: 1.5, maxWeight: 7.0, trophyWeight: 9.0, basePrice: 38, bestLureId: 'minnow', areaId: 'reef' },
  { id: 95, name: 'Mutton Snapper', tier: 'uncommon', minWeight: 3.0, maxWeight: 18.0, trophyWeight: 24.0, basePrice: 45, bestLureId: 'stinky_clam', areaId: 'reef' },
  { id: 96, name: 'Red Snapper', tier: 'uncommon', minWeight: 3.0, maxWeight: 26.0, trophyWeight: 34.0, basePrice: 42, bestLureId: 'stinky_clam', areaId: 'reef' },
  { id: 97, name: 'Lionfish', tier: 'uncommon', minWeight: 0.8, maxWeight: 3.2, trophyWeight: 4.2, basePrice: 42, bestLureId: 'spinner', areaId: 'reef' },
  { id: 98, name: 'Spotted Moray Eel', tier: 'uncommon', minWeight: 3.0, maxWeight: 18.0, trophyWeight: 24.0, basePrice: 50, bestLureId: 'crawfish', areaId: 'reef' },
  { id: 99, name: 'Great Barracuda', tier: 'rare', minWeight: 5.0, maxWeight: 42.0, trophyWeight: 55.0, basePrice: 85, bestLureId: 'crankbait', areaId: 'reef' },
  { id: 100, name: 'Giant Trevally', tier: 'rare', minWeight: 8.0, maxWeight: 68.0, trophyWeight: 90.0, basePrice: 105, bestLureId: 'crankbait', areaId: 'reef' },
  { id: 101, name: 'Wahoo', tier: 'rare', minWeight: 10.0, maxWeight: 75.0, trophyWeight: 100.0, basePrice: 115, bestLureId: 'crankbait', areaId: 'reef' },
  { id: 102, name: 'Mahi-Mahi', tier: 'rare', minWeight: 6.0, maxWeight: 45.0, trophyWeight: 60.0, basePrice: 95, bestLureId: 'squid', areaId: 'reef' },
  { id: 103, name: 'Goliath Grouper', tier: 'rare', minWeight: 35.0, maxWeight: 320.0, trophyWeight: 420.0, basePrice: 145, bestLureId: 'stinky_clam', areaId: 'reef' },
  { id: 104, name: 'Blacktip Reef Shark', tier: 'epic', minWeight: 18.0, maxWeight: 85.0, trophyWeight: 110.0, basePrice: 240, bestLureId: 'squid', areaId: 'reef' },
  { id: 105, name: 'Nurse Shark', tier: 'epic', minWeight: 25.0, maxWeight: 160.0, trophyWeight: 210.0, basePrice: 210, bestLureId: 'stinky_clam', areaId: 'reef' },
  { id: 106, name: 'Blue Marlin', tier: 'epic', minWeight: 60.0, maxWeight: 600.0, trophyWeight: 780.0, basePrice: 450, bestLureId: 'squid', areaId: 'reef' },
  { id: 107, name: 'Swordfish', tier: 'epic', minWeight: 45.0, maxWeight: 490.0, trophyWeight: 640.0, basePrice: 400, bestLureId: 'squid', areaId: 'reef' },
  { id: 108, name: 'Sailfish', tier: 'epic', minWeight: 30.0, maxWeight: 140.0, trophyWeight: 180.0, basePrice: 320, bestLureId: 'squid', areaId: 'reef' },
  { id: 109, name: 'Grand Sovereign Marlin', tier: 'legendary', minWeight: 150.0, maxWeight: 1100.0, trophyWeight: 1450.0, basePrice: 2500, bestLureId: 'dragon_scale', areaId: 'reef' },
  { id: 110, name: 'Longear Sunfish', tier: 'common', minWeight: 0.3, maxWeight: 1.6, trophyWeight: 2.1, basePrice: 4, bestLureId: 'worm', areaId: 'pond' },
  { id: 111, name: 'Dolly Varden Trout', tier: 'rare', minWeight: 1.5, maxWeight: 12.0, trophyWeight: 16.0, basePrice: 35, bestLureId: 'spinner', areaId: 'river' },
  { id: 112, name: 'Splake', tier: 'rare', minWeight: 2.0, maxWeight: 14.0, trophyWeight: 18.0, basePrice: 40, bestLureId: 'crankbait', areaId: 'lake' },
  { id: 113, name: 'Redfin Pickerel', tier: 'uncommon', minWeight: 0.5, maxWeight: 2.5, trophyWeight: 3.2, basePrice: 18, bestLureId: 'minnow', areaId: 'bayou' },
  { id: 114, name: 'Florida Pompano', tier: 'rare', minWeight: 1.5, maxWeight: 8.0, trophyWeight: 10.5, basePrice: 45, bestLureId: 'jig', areaId: 'ocean' },
  { id: 115, name: 'Picasso Triggerfish', tier: 'uncommon', minWeight: 0.8, maxWeight: 3.5, trophyWeight: 4.8, basePrice: 32, bestLureId: 'stinky_clam', areaId: 'reef' },
  { id: 116, name: 'Giant Oarfish', tier: 'legendary', minWeight: 150.0, maxWeight: 650.0, trophyWeight: 800.0, basePrice: 3200, bestLureId: 'dragon_scale', areaId: 'ocean' },
  { id: 117, name: 'Colossal Squid', tier: 'legendary', minWeight: 350.0, maxWeight: 1200.0, trophyWeight: 1450.0, basePrice: 4500, bestLureId: 'dragon_scale', areaId: 'ocean' },
  { id: 118, name: 'Great White Shark', tier: 'legendary', minWeight: 600.0, maxWeight: 4500.0, trophyWeight: 5200.0, basePrice: 6000, bestLureId: 'dragon_scale', areaId: 'ocean' },
  { id: 119, name: 'Megamouth Shark', tier: 'epic', minWeight: 400.0, maxWeight: 2800.0, trophyWeight: 3400.0, basePrice: 3800, bestLureId: 'dragon_scale', areaId: 'ocean' },
  { id: 120, name: 'Coelacanth', tier: 'legendary', minWeight: 80.0, maxWeight: 240.0, trophyWeight: 290.0, basePrice: 4800, bestLureId: 'dragon_scale', areaId: 'reef' },
  { id: 121, name: 'Giant Oceanic Manta Ray', tier: 'legendary', minWeight: 700.0, maxWeight: 3600.0, trophyWeight: 4400.0, basePrice: 5500, bestLureId: 'dragon_scale', areaId: 'reef' },
];

/**
 * Rods with descriptive qualitative speeds
 */
export const RODS: Rod[] = [
  { id: 'stick', name: 'Stick', price: 0, waitSeconds: 12.0, sizeMultiplier: 1.0, power: 1.0, minWeight: 0 },
  { id: 'bamboo_pole', name: 'Bamboo Pole', price: 12, waitSeconds: 10.0, sizeMultiplier: 1.08, power: 1.3, minWeight: 0 },
  { id: 'spinning_rod', name: 'Spinning Rod', price: 35, waitSeconds: 8.5, sizeMultiplier: 1.15, power: 1.6, minWeight: 0 },
  { id: 'casting_rod', name: 'Casting Rod', price: 90, waitSeconds: 7.2, sizeMultiplier: 1.3, power: 2.1, minWeight: 0.4 },
  { id: 'fly_rod', name: 'Fly Rod', price: 220, waitSeconds: 6.0, sizeMultiplier: 1.45, power: 2.7, minWeight: 0 },
  { id: 'composite_rod', name: 'Composite Rod', price: 500, waitSeconds: 5.2, sizeMultiplier: 1.6, power: 3.4, minWeight: 1.0 },
  { id: 'sturdy_rod', name: 'Sturdy rod', price: 1100, waitSeconds: 4.4, sizeMultiplier: 1.8, power: 4.2, minWeight: 2.0 },
  { id: 'baitcasting_rod', name: 'Baitcasting rod', price: 2600, waitSeconds: 3.8, sizeMultiplier: 2.1, power: 5.2, minWeight: 4.0 },
  { id: 'big_game_rod', name: 'Big game rod', price: 6000, waitSeconds: 3.1, sizeMultiplier: 2.5, power: 6.5, minWeight: 8.0 },
  { id: 'heavy_duty_rod', name: 'Heavy Duty Rod', price: 14000, waitSeconds: 2.5, sizeMultiplier: 3.0, power: 7.8, minWeight: 15.0 },
  { id: 'titan_spine', name: 'Broadbill Harpoon Outrigger', price: 32000, waitSeconds: 2.2, sizeMultiplier: 3.4, power: 8.8, minWeight: 20.0 },
  { id: 'legendary_rod', name: 'Custom 130lb Big-Game Chair Rod', price: 75000, waitSeconds: 1.8, sizeMultiplier: 4.2, power: 10.5, minWeight: 30.0 },
  { id: 'thicc_rod', name: 'Thicc rod', price: 175000, waitSeconds: 1.4, sizeMultiplier: 5.2, power: 12.5, minWeight: 45.0 },
  { id: 'extreme_rod', name: 'Mastercrafted Heirloom Grander Rod', price: 420000, waitSeconds: 1.0, sizeMultiplier: 7.5, power: 16.5, minWeight: 100.0 },
  { id: 'the_one_rod', name: 'Heavy Hydraulic Bent-Butt Boom', price: 10000000, waitSeconds: 0.4, sizeMultiplier: 16.0, power: 26.0, minWeight: 300.0 },
];

export function getWaitSpeedLabel(waitSeconds: number): string {
  if (waitSeconds >= 11) return 'Very Slow';
  if (waitSeconds >= 8) return 'Slow';
  if (waitSeconds >= 5.5) return 'Medium';
  if (waitSeconds >= 3.5) return 'Fast';
  if (waitSeconds >= 2.0) return 'Very Fast';
  if (waitSeconds >= 1.0) return 'Speedy';
  if (waitSeconds >= 0.6) return 'Ultra Fast';
  return 'Instant';
}

export function getRodSpriteUrl(rodId: string): string {
  return `./rods/${rodId}.png`;
}

export const REELS: Reel[] = [
  { id: 'plastic_spool', name: 'Plastic Spool', price: 0, speedMultiplier: 1.0, lineStrength: 0 },
  { id: 'wooden_reel', name: 'Wooden Reel', price: 15, speedMultiplier: 1.3, lineStrength: 3 },
  { id: 'aluminum_reel', name: 'Aluminum Reel', price: 45, speedMultiplier: 1.7, lineStrength: 5 },
  { id: 'graphite_reel', name: 'Graphite Reel', price: 120, speedMultiplier: 2.2, lineStrength: 8 },
  { id: 'bearing_reel', name: 'Bearing Reel', price: 350, speedMultiplier: 2.8, lineStrength: 10 },
  { id: 'titanium_reel', name: 'Titanium Reel', price: 900, speedMultiplier: 3.5, lineStrength: 13 },
  { id: 'magsealed_reel', name: 'Magsealed Reel', price: 2800, speedMultiplier: 4.4, lineStrength: 16 },
  { id: 'drag_master', name: 'Drag Master 9000', price: 8500, speedMultiplier: 5.4, lineStrength: 19 },
  { id: 'quantum_reel', name: 'Gold Dual-Speed 130W Offshore Reel', price: 120000, speedMultiplier: 8.2, lineStrength: 25 },
  { id: 'singularity_spool', name: 'Commercial Deep-Sea Hydraulic Winch Reel', price: 850000, speedMultiplier: 11.0, lineStrength: 28 },
];

export function getReelSpriteUrl(reelId: string): string {
  return `./reels/${reelId}.png`;
}

export function getLureSpriteUrl(lureId: string): string {
  return `./lures/${lureId}.png`;
}

export function getAreaBannerUrl(areaId: string): string {
  return `./areas/${areaId}.png`;
}

export function getJunkSpriteUrl(junkId: string): string {
  if (junkId === 'empty_hook') return './lures/none.png';
  return `./junk/${junkId}.png`;
}

export function getAreaThemeButtonClass(areaId: string): string {
  switch (areaId) {
    case 'pond':
      return 'border-2 border-emerald-500 bg-emerald-950/80 hover:bg-emerald-900 hover:border-emerald-400 text-emerald-100 shadow-lg shadow-emerald-950/50';
    case 'river':
      return 'border-2 border-sky-500 bg-sky-950/80 hover:bg-sky-900 hover:border-sky-400 text-sky-100 shadow-lg shadow-sky-950/50';
    case 'lake':
      return 'border-2 border-teal-500 bg-teal-950/80 hover:bg-teal-900 hover:border-teal-400 text-teal-100 shadow-lg shadow-teal-950/50';
    case 'bayou':
      return 'border-2 border-amber-600 bg-amber-950/80 hover:bg-amber-900 hover:border-amber-500 text-amber-100 shadow-lg shadow-amber-950/50';
    case 'ocean':
      return 'border-2 border-blue-500 bg-blue-950/80 hover:bg-blue-900 hover:border-blue-400 text-blue-100 shadow-lg shadow-blue-950/50';
    case 'reef':
      return 'border-2 border-cyan-400 bg-cyan-950/80 hover:bg-cyan-900 hover:border-cyan-300 text-cyan-100 shadow-lg shadow-cyan-950/50';
    default:
      return 'border-2 border-[#3b404c] bg-[#22252c] hover:bg-[#2a2e37] text-[#f1f3f5]';
  }
}

export const LURES: Lure[] = [
  {
    id: 'none',
    name: 'No bait',
    price: 0,
    rarityWeights: { common: 100, uncommon: 0, rare: 0, epic: 0, legendary: 0 },
    emptyHookChance: 0.35,
  },
  {
    id: 'bread_crust',
    name: 'Bread Crust',
    price: 3,
    rarityWeights: { common: 85, uncommon: 14, rare: 1, epic: 0, legendary: 0 },
    emptyHookChance: 0.12,
  },
  {
    id: 'worm',
    name: 'Worm',
    price: 8,
    rarityWeights: { common: 72, uncommon: 24, rare: 4, epic: 0, legendary: 0 },
    emptyHookChance: 0.08,
  },
  {
    id: 'cheese_cube',
    name: 'Cheese Cube',
    price: 20,
    rarityWeights: { common: 50, uncommon: 40, rare: 10, epic: 0, legendary: 0 },
    targetNote: 'Bottom Scent Trackers',
    emptyHookChance: 0.06,
  },
  {
    id: 'sweet_corn',
    name: 'Sweet Corn',
    price: 25,
    rarityWeights: { common: 65, uncommon: 30, rare: 5, epic: 0, legendary: 0 },
    targetNote: 'Herbivorous Grazers',
    emptyHookChance: 0.06,
  },
  {
    id: 'mayfly',
    name: 'Mayfly',
    price: 45,
    rarityWeights: { common: 35, uncommon: 52, rare: 13, epic: 0, legendary: 0 },
    targetNote: 'River Surface Feeders',
    emptyHookChance: 0.05,
  },
  {
    id: 'bobber',
    name: 'bobber',
    price: 75,
    rarityWeights: { common: 50, uncommon: 38, rare: 11, epic: 1, legendary: 0 },
    emptyHookChance: 0.05,
  },
  {
    id: 'minnow',
    name: 'minnow',
    price: 140,
    rarityWeights: { common: 38, uncommon: 42, rare: 18, epic: 2, legendary: 0 },
    emptyHookChance: 0.04,
  },
  {
    id: 'crawfish',
    name: 'Crawfish',
    price: 280,
    rarityWeights: { common: 28, uncommon: 44, rare: 24, epic: 4, legendary: 0 },
    targetNote: 'Deep Bottom Predators',
    emptyHookChance: 0.04,
  },
  {
    id: 'jig',
    name: 'Jig',
    price: 550,
    rarityWeights: { common: 20, uncommon: 44, rare: 29, epic: 6, legendary: 1 },
    emptyHookChance: 0.03,
  },
  {
    id: 'stinky_clam',
    name: 'Stinky Clam',
    price: 1100,
    rarityWeights: { common: 12, uncommon: 36, rare: 38, epic: 14, legendary: 0 },
    targetNote: 'Deep Saltwater Dwellers',
    emptyHookChance: 0.03,
  },
  {
    id: 'spinner',
    name: 'Spinner',
    price: 2200,
    rarityWeights: { common: 12, uncommon: 38, rare: 36, epic: 12, legendary: 2 },
    emptyHookChance: 0.02,
  },
  {
    id: 'crankbait',
    name: 'Crankbait',
    price: 4500,
    rarityWeights: { common: 8, uncommon: 32, rare: 42, epic: 15, legendary: 3 },
    targetNote: 'Aggressive Gamefish',
    emptyHookChance: 0.02,
  },
  {
    id: 'bloodworm',
    name: 'Bloodworm Cluster',
    price: 9000,
    rarityWeights: { common: 5, uncommon: 25, rare: 48, epic: 20, legendary: 2 },
    targetNote: 'Prehistoric Heavyweights',
    emptyHookChance: 0.02,
  },
  {
    id: 'shad',
    name: 'Shad',
    price: 18000,
    rarityWeights: { common: 5, uncommon: 22, rare: 46, epic: 22, legendary: 5 },
    targetNote: 'Coastal Gamefish',
    emptyHookChance: 0.02,
  },
  {
    id: 'squid',
    name: 'Squid',
    price: 35000,
    rarityWeights: { common: 2, uncommon: 14, rare: 45, epic: 30, legendary: 9 },
    targetNote: 'Pelagic Ocean Hunters',
    emptyHookChance: 0.01,
  },
  {
    id: 'dragon_scale',
    name: 'Abalone Pearl Trolling Skirt',
    price: 450000,
    rarityWeights: { common: 0, uncommon: 2, rare: 20, epic: 45, legendary: 33 },
    targetNote: 'Apex Pelagic Giants',
    emptyHookChance: 0.01,
  },
];

// ==========================================
// TRAPPING SYSTEM (PASSIVE SOAKING HARVEST)
// ==========================================

export interface TrapItem {
  id: string;
  name: string;
  type: 'bait' | 'catch';
  value: number; // sell value
  lureEquivalentId?: string; // converts into free bait
}

export interface TrapType {
  id: string;
  name: string;
  price: number;
  capacity: number;
  fillIntervalSec: number; // seconds per catch
  description: string;
}

export interface TrapBait {
  id: string;
  name: string;
  price: number;
  speedMultiplier: number;
  description: string;
}

export interface ActiveTrap {
  slotIndex: number;
  trapTypeId: string;
  areaId: AreaId;
  placedAt: number;
  baitId: string;
  baitName?: string;
  baitSpeedMultiplier?: number;
  baitBuffTitle?: string;
  baitBuffDesc?: string;
  baitCategory?: string;
  baitAttractedKeywords?: string[];
  baitWeightBonus?: number;
  baitRareBonus?: number;
  lastCheckedAt: number;
}

export const TRAP_SLOT_PRICES = [100, 300, 900, 2500];

export const TRAP_TYPES: TrapType[] = [
  {
    id: 'wire_minnow_trap',
    name: 'Wire Minnow Trap',
    price: 0,
    capacity: 6,
    fillIntervalSec: 150,
    description: 'Lightweight galvanized wire trap for shallows. Good for baitfish.',
  },
  {
    id: 'mesh_crawfish_pot',
    name: 'Mesh Crawfish Pot',
    price: 180,
    capacity: 10,
    fillIntervalSec: 120,
    description: 'Reinforced mesh pot with funnel entrances. Catches crawfish and minnows.',
  },
  {
    id: 'galvanized_crab_cage',
    name: 'Galvanized Crab Cage',
    price: 650,
    capacity: 15,
    fillIntervalSec: 90,
    description: 'Heavy gauge steel wire cage for riverbeds and bays. Higher capacity.',
  },
  {
    id: 'deepwire_lobster_pot',
    name: 'Heavy Deepwire Pot',
    price: 2200,
    capacity: 22,
    fillIntervalSec: 70,
    description: 'Weighted commercial offshore pot. Rapid soak rate and high volume.',
  },
  {
    id: 'commercial_creel',
    name: 'Commercial Creel Rig',
    price: 8500,
    capacity: 32,
    fillIntervalSec: 50,
    description: 'Industrial shellfish and bait rig with massive capacity.',
  },
];

export const TRAP_BAITS: TrapBait[] = [
  { id: 'no_bait', name: 'No Bait', price: 0, speedMultiplier: 1.0, description: 'Natural ambient soak.' },
  { id: 'bread_crumbs', name: 'Bread Crumbs', price: 2, speedMultiplier: 1.2, description: '+20% trap speed for baitfish.' },
  { id: 'fish_scraps', name: 'Fish Scraps', price: 8, speedMultiplier: 1.45, description: '+45% trap speed for crawfish & crabs.' },
  { id: 'stinky_chum', name: 'Stinky Chum', price: 25, speedMultiplier: 1.8, description: '+80% trap speed for premium crustaceans.' },
];

export const AREA_TRAP_POOL: Record<AreaId, TrapItem[]> = {
  pond: [
    { id: 'garden_worm', name: 'Garden Worm', type: 'bait', value: 2, lureEquivalentId: 'worm' },
    { id: 'fathead_minnow', name: 'Fathead Minnow', type: 'bait', value: 3, lureEquivalentId: 'minnow' },
    { id: 'pond_snail', name: 'Pond Snail', type: 'catch', value: 2 },
    { id: 'creek_crawfish', name: 'Creek Crawfish', type: 'bait', value: 5, lureEquivalentId: 'crawfish' },
    { id: 'tadpole_cluster', name: 'River Tadpole', type: 'catch', value: 2 },
  ],
  river: [
    { id: 'river_crayfish', name: 'Spiny River Crayfish', type: 'bait', value: 6, lureEquivalentId: 'crawfish' },
    { id: 'hellgrammite', name: 'Hellgrammite', type: 'bait', value: 5, lureEquivalentId: 'worm' },
    { id: 'stonefly_nymph', name: 'Stonefly Nymph', type: 'bait', value: 4, lureEquivalentId: 'mayfly' },
    { id: 'river_prawn', name: 'Freshwater Prawn', type: 'catch', value: 6 },
    { id: 'shiner_minnow', name: 'Golden Shiner Minnow', type: 'bait', value: 4, lureEquivalentId: 'minnow' },
  ],
  lake: [
    { id: 'lake_crawfish', name: 'Deep Lake Crawfish', type: 'bait', value: 7, lureEquivalentId: 'crawfish' },
    { id: 'nightcrawler', name: 'Nightcrawler', type: 'bait', value: 4, lureEquivalentId: 'worm' },
    { id: 'ghost_shrimp', name: 'Ghost Shrimp', type: 'bait', value: 6, lureEquivalentId: 'crawfish' },
    { id: 'lake_chub', name: 'Lake Chublet', type: 'bait', value: 5, lureEquivalentId: 'minnow' },
    { id: 'freshwater_clam', name: 'Freshwater Clam', type: 'catch', value: 8, lureEquivalentId: 'stinky_clam' },
  ],
  bayou: [
    { id: 'swamp_crawfish', name: 'Red Swamp Crawfish', type: 'bait', value: 8, lureEquivalentId: 'crawfish' },
    { id: 'blue_crawfish', name: 'Blue Bayou Crawfish', type: 'catch', value: 18, lureEquivalentId: 'crawfish' },
    { id: 'mud_crab', name: 'Brackish Mud Crab', type: 'catch', value: 12 },
    { id: 'river_leech', name: 'Giant River Leech', type: 'bait', value: 6, lureEquivalentId: 'worm' },
    { id: 'gar_fingerling', name: 'Gar Fry Fingerling', type: 'catch', value: 14 },
  ],
  ocean: [
    { id: 'blue_crab', name: 'Atlantic Blue Crab', type: 'catch', value: 16 },
    { id: 'sea_prawn', name: 'Coastal Sea Prawn', type: 'bait', value: 9, lureEquivalentId: 'crawfish' },
    { id: 'fiddler_crab', name: 'Fiddler Crab', type: 'bait', value: 7, lureEquivalentId: 'crawfish' },
    { id: 'clam_cluster', name: 'Salt Clam', type: 'catch', value: 12, lureEquivalentId: 'stinky_clam' },
    { id: 'sand_worm', name: 'Blood Sea Worm', type: 'bait', value: 8, lureEquivalentId: 'bloodworm' },
  ],
  reef: [
    { id: 'coral_shrimp', name: 'Banded Coral Shrimp', type: 'bait', value: 14, lureEquivalentId: 'crawfish' },
    { id: 'stone_crab', name: 'Stone Crab Claw', type: 'catch', value: 28 },
    { id: 'reef_squidlet', name: 'Baby Reef Squid', type: 'bait', value: 22, lureEquivalentId: 'squid' },
    { id: 'spiny_lobster_pup', name: 'Rock Lobster Juvenile', type: 'catch', value: 45 },
    { id: 'mantis_shrimp', name: 'Peacock Mantis Shrimp', type: 'catch', value: 35 },
  ],
};

export interface TrapCalculationResult {
  count: number;
  fishes: CaughtFish[];
  items: TrapItem[];
  isFull: boolean;
  secondsRemainingToNext: number;
  totalValue: number;
}

/**
 * Calculates how many items/fish a trap has accumulated passively based on elapsed time
 */
export function calculateTrapCatch(
  trap: ActiveTrap,
  now = Date.now(),
  soakSpeedBonus: number = 1.0
): TrapCalculationResult {
  const model = TRAP_TYPES.find((t) => t.id === trap.trapTypeId) || TRAP_TYPES[0];
  const standardBait = TRAP_BAITS.find((b) => b.id === trap.baitId);
  const baseSpeed =
    trap.baitSpeedMultiplier ?? (standardBait ? standardBait.speedMultiplier : 1.0);
  const speedMultiplier = baseSpeed * Math.max(0.5, soakSpeedBonus);

  const effectiveIntervalSec = Math.max(30, model.fillIntervalSec / speedMultiplier);
  const elapsedSec = Math.max(0, (now - trap.placedAt) / 1000);

  const rawCount = Math.floor(elapsedSec / effectiveIntervalSec);
  const count = Math.min(model.capacity, rawCount);
  const isFull = count >= model.capacity;

  const secondsRemainingToNext = isFull
    ? 0
    : Math.max(0, Math.ceil(effectiveIntervalSec - (elapsedSec % effectiveIntervalSec)));

  // Generate real fish from the area - TRAPS NEVER CATCH LEGENDARY FISH
  const areaSpecies = FISH_COLLECTION.filter((f) => f.areaId === trap.areaId && f.tier !== 'legendary');
  const trapFriendly = areaSpecies.filter(
    (f) => f.tier === 'common' || f.tier === 'uncommon' || f.tier === 'rare'
  );
  const speciesPool = trapFriendly.length > 0 ? trapFriendly : areaSpecies;

  const legacyPool = AREA_TRAP_POOL[trap.areaId] || AREA_TRAP_POOL.pond;
  const items: TrapItem[] = [];
  const fishes: CaughtFish[] = [];

  for (let i = 0; i < count; i++) {
    const seed = Math.abs(Math.floor(trap.placedAt + i * 47 + i * 19));

    // Traps catch predominantly common bottom-feeders and baitfish (92%), rarely uncommon (7.5%), very rarely rare (0.5%), never legendary
    // Bait rare bonus shifts thresholds:
    const rareShift = Math.round((trap.baitRareBonus || 0) * 1000);
    const uncommonThreshold = Math.max(700, 920 - rareShift);
    const rareThreshold = Math.max(880, 995 - Math.round(rareShift * 0.4));

    const rarityRoll = seed % 1000;
    let targetTier: RarityTier = 'common';
    if (rarityRoll < uncommonThreshold) {
      targetTier = 'common';
    } else if (rarityRoll < rareThreshold) {
      targetTier = 'uncommon';
    } else {
      targetTier = 'rare';
    }

    let candidates = trapFriendly.filter((f) => f.tier === targetTier);
    if (candidates.length === 0) candidates = speciesPool;

    // Attracted species filtering if fish bait has specific attraction keywords:
    if (trap.baitAttractedKeywords && trap.baitAttractedKeywords.length > 0) {
      const attractedMatches = candidates.filter((f) =>
        trap.baitAttractedKeywords!.some((kw) => f.name.toLowerCase().includes(kw.toLowerCase()))
      );
      if (attractedMatches.length > 0 && (seed % 100) < 60) {
        candidates = attractedMatches;
      }
    }

    const species = candidates[seed % candidates.length];

    // Traps have a rare chance for trophy weight (1 in 400 ~0.25%, boosted to 1 in 120 with prime trophy bait)
    const trophyOdds = trap.baitCategory === 'rare' ? 120 : 400;
    const isTrophy = (seed % trophyOdds) === 0;

    // Trapped fish are typically modest forage specimens unless a rare trophy miracle occurs
    const minW = species.minWeight;
    const maxW = isTrophy
      ? species.trophyWeight
      : species.minWeight + (species.maxWeight - species.minWeight) * 0.40;
    const variance = ((seed % 97) / 97);
    let rawWeight = minW + (maxW - minW) * Math.pow(variance, 1.6);
    if (trap.baitWeightBonus && trap.baitWeightBonus > 1.0) {
      rawWeight *= trap.baitWeightBonus;
    }
    const weight = Number(rawWeight.toFixed(2));
    const weightRatio = Math.max(1, weight / species.minWeight);
    const trophyBonus = isTrophy ? 2.5 : 1.0;
    const value = Math.max(
      1,
      Math.round(species.basePrice * 1.30 * Math.pow(weightRatio, 0.52) * trophyBonus)
    );

    const caughtFish: CaughtFish = {
      catchId: `trap_${trap.placedAt}_${i}_${species.id}`,
      fishId: species.id,
      name: species.name,
      tier: species.tier,
      weight,
      isTrophy,
      value,
      caughtAt: trap.placedAt + Math.floor(i * effectiveIntervalSec * 1000),
      areaId: trap.areaId,
    };

    fishes.push(caughtFish);

    const legacyIndex = seed % legacyPool.length;
    items.push(legacyPool[legacyIndex]);
  }

  const totalValue = fishes.reduce((sum, f) => sum + f.value, 0);

  return {
    count,
    fishes,
    items,
    isFull,
    secondsRemainingToNext,
    totalValue,
  };
}

export interface FishTrapBaitProfile {
  baitName: string;
  speedMultiplier: number;
  buffTitle: string;
  buffDescription: string;
  attractedKeywords: string[];
  weightBonus: number;
  rareBonus: number;
  category: 'forage' | 'bottom' | 'panfish' | 'predator' | 'marine' | 'rare';
}

export function getFishTrapBaitProfile(fish: {
  name: string;
  tier: RarityTier;
  areaId?: string;
  weight?: number;
}): FishTrapBaitProfile {
  const nameLower = fish.name.toLowerCase();
  const tier = fish.tier;

  // 1. Rare / Epic / Legendary (Premium Trophy Bait)
  if (tier === 'rare' || tier === 'epic' || tier === 'legendary') {
    const speed = tier === 'legendary' ? 3.2 : tier === 'epic' ? 2.6 : 2.2;
    return {
      baitName: `Prime Cut ${fish.name}`,
      speedMultiplier: speed,
      buffTitle: 'Prime Trophy Scent',
      buffDescription: `+${Math.round((speed - 1) * 100)}% Speed · Draws high-tier specimens & 3x trophy rate`,
      attractedKeywords: ['Trout', 'Bass', 'Salmon', 'Tuna', 'Grouper', 'Snapper', 'Pike', 'Walleye'],
      weightBonus: 1.30,
      rareBonus: 0.15,
      category: 'rare',
    };
  }

  // 2. Bottom dwellers & oily scavengers (Bullhead, Catfish, Carp, Sucker, Drum, Bowfin, Eel, Gar, Sturgeon)
  if (
    nameLower.includes('catfish') ||
    nameLower.includes('bullhead') ||
    nameLower.includes('carp') ||
    nameLower.includes('sucker') ||
    nameLower.includes('drum') ||
    nameLower.includes('bowfin') ||
    nameLower.includes('eel') ||
    nameLower.includes('gar') ||
    nameLower.includes('sturgeon')
  ) {
    return {
      baitName: `Oily Cut ${fish.name}`,
      speedMultiplier: 1.85,
      buffTitle: 'Heavy Benthic Scent',
      buffDescription: '+85% Speed · Heavy oil trail attracts Catfish, Bullheads & Crustaceans (+25% Weight)',
      attractedKeywords: ['Catfish', 'Bullhead', 'Carp', 'Sucker', 'Drum', 'Crab', 'Crayfish', 'Crawfish', 'Clam', 'Eel'],
      weightBonus: 1.25,
      rareBonus: 0.05,
      category: 'bottom',
    };
  }

  // 3. Panfish & Sunfish (Bluegill, Pumpkinseed, Sunfish, Warmouth, Crappie, Rock Bass)
  if (
    nameLower.includes('sunfish') ||
    nameLower.includes('bluegill') ||
    nameLower.includes('pumpkinseed') ||
    nameLower.includes('crappie') ||
    nameLower.includes('warmouth') ||
    nameLower.includes('rock bass')
  ) {
    return {
      baitName: `Sweet Cut ${fish.name}`,
      speedMultiplier: 1.70,
      buffTitle: 'Ambush Predator Lure',
      buffDescription: '+70% Speed · Iridescent scale flash draws Bass, Pike & Pickerel',
      attractedKeywords: ['Bass', 'Pike', 'Pickerel', 'Muskie', 'Walleye'],
      weightBonus: 1.15,
      rareBonus: 0.06,
      category: 'panfish',
    };
  }

  // 4. Saltwater & Reef baitfish (Mackerel, Mullet, Sardine, Herring, Anchovy, Snapper, Grunt)
  if (
    fish.areaId === 'ocean' ||
    fish.areaId === 'reef' ||
    nameLower.includes('mackerel') ||
    nameLower.includes('mullet') ||
    nameLower.includes('sardine') ||
    nameLower.includes('herring') ||
    nameLower.includes('anchovy')
  ) {
    return {
      baitName: `Salt-Chummed ${fish.name}`,
      speedMultiplier: 1.90,
      buffTitle: 'Briny Marine Chum',
      buffDescription: '+90% Speed · Salty lipid slick attracts Flounder, Sea Bass, Crabs & Lobsters',
      attractedKeywords: ['Flounder', 'Sea Bass', 'Snapper', 'Grouper', 'Crab', 'Lobster', 'Shrimp', 'Prawn'],
      weightBonus: 1.20,
      rareBonus: 0.08,
      category: 'marine',
    };
  }

  // 5. Forage minnows, shiners, chub (Minnow, Shiner, Chub, Dace)
  if (
    nameLower.includes('minnow') ||
    nameLower.includes('shiner') ||
    nameLower.includes('chub') ||
    nameLower.includes('dace')
  ) {
    return {
      baitName: `Fresh Live ${fish.name}`,
      speedMultiplier: 1.60,
      buffTitle: 'Darting Forage Scent',
      buffDescription: '+60% Speed · Natural baitfish scent draws Trout, Perch & Crappie',
      attractedKeywords: ['Trout', 'Perch', 'Crappie', 'Walleye', 'Smallmouth'],
      weightBonus: 1.05,
      rareBonus: 0.04,
      category: 'forage',
    };
  }

  // 6. Generic Gamefish (Default)
  return {
    baitName: `Fresh Cut ${fish.name}`,
    speedMultiplier: 1.65,
    buffTitle: 'Fresh Cut Bait',
    buffDescription: '+65% Speed · Fresh scent attracts local predatory species',
    attractedKeywords: ['Bass', 'Trout', 'Perch', 'Catfish'],
    weightBonus: 1.10,
    rareBonus: 0.05,
    category: 'predator',
  };
}

export function getFishTrapBaitMultiplier(tier: RarityTier): number {
  switch (tier) {
    case 'common':
      return 1.65; // +65% speed
    case 'uncommon':
      return 1.95; // +95% speed
    case 'rare':
      return 2.3; // +130% speed
    case 'epic':
      return 2.7; // +170% speed
    case 'legendary':
      return 3.2; // +220% speed
    default:
      return 1.5;
  }
}

export function getTrapBaitDisplay(trap: ActiveTrap): {
  name: string;
  speedMultiplier: number;
  buffTitle?: string;
  buffDescription?: string;
} {
  if (trap.baitName && trap.baitSpeedMultiplier) {
    return {
      name: trap.baitName,
      speedMultiplier: trap.baitSpeedMultiplier,
      buffTitle: trap.baitBuffTitle,
      buffDescription: trap.baitBuffDesc,
    };
  }
  const standard =
    TRAP_BAITS.find((b) => b.id === trap.baitId) || TRAP_BAITS[0];
  return {
    name: standard.name,
    speedMultiplier: standard.speedMultiplier,
    buffDescription: standard.description,
  };
}

export function rollWaitTime(rod: Rod): number {
  const variance = 0.75 + Math.random() * 0.6;
  return Math.max(0.3, Number((rod.waitSeconds * variance).toFixed(1)));
}

export function pickRarityTier(
  lure: Lure,
  randomFloat = Math.random()
): RarityTier {
  const weights = lure.rarityWeights;
  const total =
    weights.common +
    weights.uncommon +
    weights.rare +
    weights.epic +
    weights.legendary;
  let running = 0;
  const target = randomFloat * total;

  const tiers: RarityTier[] = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
  ];
  for (const t of tiers) {
    running += weights[t];
    if (target <= running) return t;
  }
  return 'common';
}

export const ROD_RATED_WEIGHTS: Record<string, number> = {
  stick: 3.0,
  bamboo_pole: 6.0,
  spinning_rod: 14.0,
  casting_rod: 24.0,
  fly_rod: 10.0, // Delicate river fly rod for trout & panfish (never 50 lbs!)
  composite_rod: 38.0,
  sturdy_rod: 65.0,
  baitcasting_rod: 120.0,
  big_game_rod: 350.0,
  heavy_duty_rod: 1200.0,
  thicc_rod: 2500.0,
  titan_spine: 6000.0,
  legendary_rod: 15000.0,
  extreme_rod: 40000.0,
  the_one_rod: 999999.0,
};

/**
 * Larger rods have a minimum fish target size.
 * Prevents catching a tiny forage minnow (0.05-0.2 lbs) on a heavy composite or ocean rod.
 */
export const ROD_MIN_WEIGHTS: Record<string, number> = {
  stick: 0,
  bamboo_pole: 0,
  spinning_rod: 0,
  fly_rod: 0, // Fly rod targets light trout & panfish
  casting_rod: 0.4,
  composite_rod: 1.0, // Explicitly no minnows on composite rod (minnows are 0.05 - 0.25 lbs)
  sturdy_rod: 2.0,
  baitcasting_rod: 4.0,
  big_game_rod: 8.0,
  heavy_duty_rod: 15.0,
  thicc_rod: 25.0,
  titan_spine: 40.0,
  legendary_rod: 60.0,
  extreme_rod: 100.0,
  the_one_rod: 300.0,
};

export function getMaxRodWeight(rod: Rod): number {
  if (ROD_RATED_WEIGHTS[rod.id]) {
    return ROD_RATED_WEIGHTS[rod.id];
  }
  return Math.round(2.5 * Math.pow(rod.power, 2.7) + 0.5);
}

export function getMinRodWeight(rod: Rod): number {
  if (rod.minWeight !== undefined) {
    return rod.minWeight;
  }
  if (ROD_MIN_WEIGHTS[rod.id] !== undefined) {
    return ROD_MIN_WEIGHTS[rod.id];
  }
  return 0;
}

export function calculateReelDuration(
  fishWeightLbs: number,
  rod: Rod,
  reel: Reel
): number {
  // Base fight time: 3.2 seconds minimum so even small catches have a real reeling phase
  const baseSeconds = 3.2;

  // Weight scaling: larger fish take noticeably longer to tire out and bring in
  const weightFactor = Math.log2(Math.max(1, fishWeightLbs * 2.2 + 0.6)) * 2.6;

  // Stronger rods give leverage
  const powerReduction = Math.max(0.45, 1 / (1 + (rod.power - 1) * 0.08));

  // Upgraded reels speed up the reeling process
  const speedReduction = Math.max(0.2, 1 / Math.pow(reel.speedMultiplier, 0.82));

  let rawSeconds = (baseSeconds + weightFactor * powerReduction) * speedReduction;

  // Soft limit penalty: exceeding rated rod weight multiplies fight time exponentially
  const ratedMax = getMaxRodWeight(rod);
  const strain = fishWeightLbs / Math.max(1, ratedMax);
  if (strain > 1.0) {
    rawSeconds *= Math.pow(strain, 2.2);
  }

  return Math.max(2.2, Math.min(30.0, Number(rawSeconds.toFixed(1))));
}

export function rollFishEscape(
  fishWeightLbs: number,
  rod: Rod,
  reel: Reel,
  randomFloat = Math.random()
): boolean {
  const baseMax = getMaxRodWeight(rod);
  // Better reels provide precision drag cushioning, boosting effective line threshold
  const effectiveMaxWeight = baseMax * (1 + (reel.lineStrength || 0) * 0.035);
  const strainRatio = fishWeightLbs / effectiveMaxWeight;

  if (fishWeightLbs < 1.0) return false;

  let finalChance: number;
  if (strainRatio <= 1.0) {
    // Under rated capacity: modest escape chance reduced by reel line strength
    const baseChance = Math.min(0.20, 0.015 + Math.max(0, strainRatio - 0.5) * 0.07);
    const reelProtection = (reel.lineStrength || 0) * 0.006;
    finalChance = Math.max(0.002, baseChance - reelProtection);
  } else {
    // Soft limit exceeded: EXPONENTIAL line snap and hook tear!
    // The higher over the cap, the exponentially harder it becomes to land
    const excess = strainRatio - 1.0;
    const exponentialSnap = Math.pow(excess * 2.8, 2.0);
    const reelProtection = (reel.lineStrength || 0) * 0.008;
    finalChance = Math.min(0.99, Math.max(0.22, 0.22 + exponentialSnap - reelProtection));
  }

  return randomFloat < finalChance;
}

export interface HookedEncounter {
  type: 'nothing' | 'junk' | 'fish' | 'treasure';
  fish?: CaughtFish;
  caughtFish?: CaughtFish;
  item?: JunkItem;
  junkItem?: JunkItem;
  reelDurationSec: number;
  willEscape: boolean;
  treasureReward?: number;
}

export function getFishPreferredWeather(fishId: number): WeatherId[] {
  // 1-10: Pond minnows & sunfish
  if (fishId <= 10) return ['clear', 'overcast'];
  // 11-13: Bullheads
  if (fishId <= 13) return ['rain', 'fog'];
  // 14, 19: Pond largemouth
  if (fishId === 14 || fishId === 19) return ['overcast', 'windy'];
  // 15-18: Carp
  if (fishId <= 18) return ['rain', 'overcast'];
  // 20: Golden Koi
  if (fishId === 20) return ['clear', 'fog'];

  // 21-26, 33-35: River Trout / Char / Steelhead
  if (
    (fishId >= 21 && fishId <= 26) ||
    fishId === 33 ||
    fishId === 34 ||
    fishId === 35
  ) {
    return ['clear', 'rain'];
  }
  // 24: River Smallmouth
  if (fishId === 24) return ['overcast', 'windy'];
  // 27-28, 31: Whitefish, Grayling, Fallfish
  if (fishId === 27 || fishId === 28 || fishId === 31) return ['clear', 'overcast'];
  // 29-30: Walleye, Sauger
  if (fishId === 29 || fishId === 30) return ['overcast', 'fog'];
  // 32: Redhorse
  if (fishId === 32) return ['rain', 'fog'];
  // 36, 38: White Sturgeon
  if (fishId === 36 || fishId === 38) return ['fog', 'rain'];
  // 37: King Chinook
  if (fishId === 37) return ['rain', 'windy'];

  // 39-42: Lake Bass
  if (fishId >= 39 && fishId <= 42) return ['overcast', 'windy'];
  // 43-45: Perch, Crappies
  if (fishId >= 43 && fishId <= 45) return ['clear', 'overcast'];
  // 46-47: Lake Walleye & Whitefish
  if (fishId === 46 || fishId === 47) return ['overcast', 'fog'];
  // 48-51: Pike, Pickerel, Muskies
  if (fishId >= 48 && fishId <= 51) return ['overcast', 'windy'];
  // 52-53: Lake Trout & Burbot
  if (fishId === 52 || fishId === 53) return ['fog', 'rain'];
  // 54: Freshwater Drum
  if (fishId === 54) return ['clear', 'rain'];
  // 55-56: Lake Sturgeon
  if (fishId === 55 || fishId === 56) return ['fog', 'rain'];

  // 57: Bowfin
  if (fishId === 57) return ['fog', 'overcast'];
  // 58-60, 68: Bayou Catfish
  if (fishId === 58 || fishId === 59 || fishId === 60 || fishId === 68) return ['rain', 'fog'];
  // 61-63, 67, 69: Gars
  if (fishId === 61 || fishId === 62 || fishId === 63 || fishId === 67 || fishId === 69) return ['clear', 'fog'];
  // 64-66: Buffalo, Paddlefish
  if (fishId >= 64 && fishId <= 66) return ['rain', 'overcast'];

  // 70-72: Ocean Mackerel, Sardine, Mullet
  if (fishId >= 70 && fishId <= 72) return ['clear', 'windy'];
  // 73-75: Flounder, Sea Bass
  if (fishId >= 73 && fishId <= 75) return ['overcast', 'fog'];
  // 76-80: Sheepshead, Sea Trout, Striper, Drums
  if (fishId >= 76 && fishId <= 80) return ['windy', 'rain'];
  // 81-84: Bluefish, Snook, Tarpon, Cobia
  if (fishId >= 81 && fishId <= 84) return ['overcast', 'windy'];
  // 85: Halibut
  if (fishId === 85) return ['fog', 'rain'];
  // 86-89: King Salmon, Tuna
  if (fishId >= 86 && fishId <= 89) return ['clear', 'windy'];

  // 90-93: Reef Panfish
  if (fishId >= 90 && fishId <= 93) return ['clear', 'overcast'];
  // 94-96: Snappers
  if (fishId >= 94 && fishId <= 96) return ['clear', 'windy'];
  // 97-98: Lionfish, Moray
  if (fishId === 97 || fishId === 98) return ['fog', 'rain'];
  // 99-102: Barracuda, Trevally, Wahoo, Mahi
  if (fishId >= 99 && fishId <= 102) return ['windy', 'clear'];
  // 103, 105: Goliath Grouper, Nurse Shark
  if (fishId === 103 || fishId === 105) return ['fog', 'overcast'];
  // 104, 106-109: Sharks, Marlin, Swordfish, Sailfish
  return ['clear', 'windy'];
}

export function rollHookedEncounter(
  areaId: AreaId,
  rod: Rod,
  lure: Lure,
  reel: Reel,
  options?: {
    weather?: WeatherId;
    useLiveBait?: boolean;
    weatherRumorActive?: boolean;
    rumorSpeciesId?: number;
    nothingRoll?: number;
    tierRoll?: number;
    weightVariance?: number;
    trophyRoll?: number;
    escapeRoll?: number;
    treasureRoll?: number;
  }
): HookedEncounter {
  // Extremely rare 0.01 (1%) chance to hook a Sunken Treasure Chest
  const treasureRoll = options?.treasureRoll ?? (options?.nothingRoll !== undefined ? 1.0 : Math.random());
  if (treasureRoll < 0.01) {
    return {
      type: 'treasure',
      reelDurationSec: 4.2,
      willEscape: false,
    };
  }

  const isLiveBait = options?.useLiveBait ?? false;
  // Better reels reduce the chance of losing bait or having missed bites
  const reelBaitProtection = Math.max(0.35, 1 - (reel.lineStrength || 0) * 0.03);
  const baseEmptyChance = lure.emptyHookChance ?? 0.04;
  // Live lively bait attracts aggressive strikes, drastically reducing missed bites / junk
  const emptyChance = isLiveBait ? baseEmptyChance * 0.25 : baseEmptyChance * reelBaitProtection;
  const nothingRoll = options?.nothingRoll ?? Math.random();

  if (nothingRoll < emptyChance) {
    if (nothingRoll < emptyChance * 0.45) {
      return {
        type: 'nothing',
        reelDurationSec: 2.2,
        willEscape: false,
      };
    }
    const junkPool = JUNK_ITEMS.slice(1);
    const item = junkPool[Math.floor(Math.random() * junkPool.length)];
    return {
      type: 'junk',
      item,
      junkItem: item,
      reelDurationSec: 3.0,
      willEscape: false,
    };
  }

  const maxRodWeight = getMaxRodWeight(rod);
  const minRodWeight = getMinRodWeight(rod);
  const pool = FISH_COLLECTION.filter((f) => f.areaId === areaId);
  const availablePool = pool.length > 0 ? pool : FISH_COLLECTION;

  // Sensible species pool based on gear and bait:
  // 1. A rod cannot land a species whose minimum weight exceeds the rod's max capacity
  let sensiblePool = availablePool.filter((f) => f.minWeight <= maxRodWeight);

  // 2. Larger rods have a strict minimum fish target size (no minnows on composite or ocean rods)
  if (minRodWeight > 0) {
    const heavyCandidates = sensiblePool.filter(
      (f) => f.maxWeight >= minRodWeight && !f.name.toLowerCase().includes('minnow')
    );
    if (heavyCandidates.length > 0) {
      sensiblePool = heavyCandidates;
    }
  }

  // 3. Bare hook (no bait): only small common baitfish / panfish will bite a bare hook!
  // If a heavy rod is equipped, bare hook will NOT hook tiny forage minnows.
  if (lure.id === 'none') {
    sensiblePool = sensiblePool.filter(
      (f) =>
        f.tier === 'common' &&
        f.minWeight <= Math.min(2.0, maxRodWeight) &&
        (minRodWeight === 0 || f.maxWeight >= minRodWeight)
    );
  }

  // Fallback if area has no matching fish for this rod (ensures catches are always possible)
  if (sensiblePool.length === 0) {
    if (minRodWeight > 0) {
      // Larger rods in small ponds target the heaviest available resident gamefish, never minnows
      const sortedByWeight = [...availablePool]
        .filter((f) => !f.name.toLowerCase().includes('minnow'))
        .sort((a, b) => b.maxWeight - a.maxWeight);
      sensiblePool = sortedByWeight.slice(0, Math.max(2, Math.floor(availablePool.length * 0.4)));
      if (sensiblePool.length === 0) sensiblePool = [availablePool[availablePool.length - 1]];
    } else {
      sensiblePool = availablePool;
    }
  }

  // When live bait is active, boost uncommon, rare, and epic tier weights
  let targetTier: RarityTier;
  if (isLiveBait) {
    const liveLure: Lure = {
      ...lure,
      rarityWeights: {
        common: Math.max(15, Math.round(lure.rarityWeights.common * 0.65)),
        uncommon: Math.round(lure.rarityWeights.uncommon * 1.6),
        rare: Math.round(lure.rarityWeights.rare * 2.0),
        epic: Math.round(lure.rarityWeights.epic * 2.2),
        legendary: Math.round(lure.rarityWeights.legendary * 1.5),
      },
    };
    targetTier = pickRarityTier(liveLure, options?.tierRoll);
  } else {
    targetTier = pickRarityTier(lure, options?.tierRoll);
  }

  // Weather Sighting Rumor: when fishing in the rumored area during the required atmospheric conditions,
  // the legendary monster has a dramatically elevated strike rate
  if (options?.weatherRumorActive && options?.rumorSpeciesId) {
    const rumorTarget = FISH_COLLECTION.find((f) => f.id === options.rumorSpeciesId);
    if (rumorTarget && rumorTarget.minWeight <= maxRodWeight) {
      const isHighTierBait = isLiveBait || (lure.rarityWeights.legendary || 0) > 0 || (lure.rarityWeights.epic || 0) > 0;
      const strikeChance = isHighTierBait ? 0.65 : 0.28;
      if (Math.random() < strikeChance) {
        targetTier = 'legendary';
      }
    }
  }

  let tierMatches = sensiblePool.filter((f) => f.tier === targetTier);

  if (tierMatches.length === 0) {
    tierMatches = sensiblePool;
  }

  // Best Lure & Weather Priority:
  // Favorite bait provides 4x weight; active preferred weather provides additional 2x weight boost
  const weightedCandidates: FishSpecies[] = [];
  const currentWeather = options?.weather;
  for (const s of tierMatches) {
    let weightFactor = s.bestLureId === lure.id ? 4 : 1;
    if (currentWeather && getFishPreferredWeather(s.id).includes(currentWeather)) {
      weightFactor *= 2;
    }
    if (options?.weatherRumorActive && s.id === options.rumorSpeciesId) {
      weightFactor *= 10;
    }
    for (let w = 0; w < weightFactor; w++) {
      weightedCandidates.push(s);
    }
  }

  const species =
    weightedCandidates[Math.floor(Math.random() * weightedCandidates.length)] ||
    tierMatches[0];

  const min = Math.max(species.minWeight, minRodWeight > 0 ? Math.min(species.maxWeight, minRodWeight) : species.minWeight);
  const max = Math.max(min, species.maxWeight);
  const weightSpread = Math.max(0.01, max - min);
  const variance = options?.weightVariance ?? Math.random();
  const rawWeight = min + weightSpread * Math.pow(variance, 1.7);
  let scaledWeight = rawWeight * rod.sizeMultiplier;
  if (minRodWeight > 0 && species.maxWeight >= minRodWeight) {
    scaledWeight = Math.max(minRodWeight, scaledWeight);
  }

  // Live bait attracts larger, healthier aggressive fish
  if (isLiveBait) {
    scaledWeight *= 1.15;
  }

  // Soft limit ceiling: Light gear cannot hook fish that are wildly beyond its rated capacity.
  // The soft limit permits fish to challenge the rod up to 1.25x rated weight (soft limit zone).
  // Anything over 1.25x is physically impossible to hook on delicate tackle (e.g. fly rod capped at ~12.5 lbs).
  const maxSoftLimitWeight = maxRodWeight * 1.25;
  if (scaledWeight > maxSoftLimitWeight) {
    scaledWeight = maxRodWeight * (1.02 + ((variance * 997) % 1) * 0.22);
  }

  // Trophy rules:
  // Strictly requires rod power >= 1.4 AND bait equipped AND scaledWeight reaches trophy threshold
  // Live bait doubles trophy strike probability (12% vs 5%)
  const canLandTrophy = rod.power >= 1.4 && lure.id !== 'none';
  const trophyRoll = options?.trophyRoll ?? Math.random();
  const trophyThreshold = isLiveBait ? 0.12 : 0.05;
  const isTrophy =
    canLandTrophy &&
    scaledWeight >= species.trophyWeight &&
    trophyRoll < trophyThreshold;

  const weightRatio = Math.max(1, scaledWeight / species.minWeight);
  const trophyBonus = isTrophy ? 2.5 : 1.0;

  // Wild mutation roll: extremely rare 0.02% chance (breeding in Hatchery is the primary source)
  let mutation: 'normal' | 'albino' | 'melanistic' | 'bioluminescent' | 'piebald' | 'golden' = 'normal';
  let mutationName: string | undefined = undefined;
  let mutationMultiplier = 1.0;
  if (Math.random() < 0.0002) {
    const mRoll = Math.random();
    if (mRoll < 0.35) {
      mutation = 'piebald';
      mutationName = 'Piebald Calico';
      mutationMultiplier = 1.9;
    } else if (mRoll < 0.65) {
      mutation = 'albino';
      mutationName = 'Ghost Albino';
      mutationMultiplier = 2.0;
    } else if (mRoll < 0.82) {
      mutation = 'melanistic';
      mutationName = 'Midnight Melanistic';
      mutationMultiplier = 2.2;
    } else if (mRoll < 0.94) {
      mutation = 'bioluminescent';
      mutationName = 'Bioluminescent Neon';
      mutationMultiplier = 2.8;
    } else {
      mutation = 'golden';
      mutationName = 'Gilded Golden Strain';
      mutationMultiplier = 3.5;
    }
  }

  // Boosted market payout: 1.30x base multiplier, weight scaling, trophy bonus, and mutation bonus
  const value = Math.max(
    1,
    Math.round(species.basePrice * 1.30 * Math.pow(weightRatio, 0.52) * trophyBonus * mutationMultiplier)
  );

  const caughtFish: CaughtFish = {
    catchId: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fishId: species.id,
    name: mutationName ? `${mutationName} ${species.name}` : species.name,
    tier: species.tier,
    weight: Number(scaledWeight.toFixed(2)),
    isTrophy,
    value,
    caughtAt: Date.now(),
    areaId,
    mutation,
    mutationName,
  };

  const reelDurationSec = calculateReelDuration(caughtFish.weight, rod, reel);
  const willEscape = rollFishEscape(
    caughtFish.weight,
    rod,
    reel,
    options?.escapeRoll
  );

  return {
    type: 'fish',
    fish: caughtFish,
    caughtFish,
    reelDurationSec,
    willEscape,
  };
}

export function isSecretFish(tier: RarityTier): boolean {
  return tier === 'legendary' || tier === 'epic';
}

export function getRarityTextStyle(tier: RarityTier): string {
  switch (tier) {
    case 'common':
      return 'text-[#e3e6eb] font-medium';
    case 'uncommon':
      return 'text-emerald-300 font-semibold tracking-wide';
    case 'rare':
      return 'text-sky-300 font-bold tracking-wider';
    case 'epic':
      return 'text-purple-300 font-extrabold tracking-wider italic';
    case 'legendary':
      return 'text-amber-300 font-black tracking-widest uppercase';
    default:
      return 'text-[#e3e6eb]';
  }
}

export function getRarityBadgeStyle(tier: RarityTier): string {
  switch (tier) {
    case 'common':
      return 'border-[#3a404d] bg-[#1a1d23] text-[#c0c5ce]';
    case 'uncommon':
      return 'border-emerald-700/70 bg-emerald-950/40 text-emerald-300';
    case 'rare':
      return 'border-sky-600/70 bg-sky-950/50 text-sky-200';
    case 'epic':
      return 'border-purple-600/70 bg-purple-950/50 text-purple-200';
    case 'legendary':
      return 'border-amber-500/80 bg-amber-950/60 text-amber-200 font-bold';
    default:
      return 'border-[#3a404d] bg-[#1a1d23] text-[#c0c5ce]';
  }
}

export function getRarityOrder(tier: RarityTier): number {
  switch (tier) {
    case 'legendary':
      return 5;
    case 'epic':
      return 4;
    case 'rare':
      return 3;
    case 'uncommon':
      return 2;
    case 'common':
      return 1;
    default:
      return 0;
  }
}

// ==========================================
// FISH MARKET ORDERS & COMMERCIAL CONTRACTS
// ==========================================

export type ContractCategory = 'local' | 'restaurant' | 'private' | 'wholesale' | 'luxury';

export interface FishMarketOrder {
  id: string;
  client: string;
  title: string;
  fishId: number;
  fishName: string;
  tier: RarityTier;
  category: ContractCategory;
  categoryLabel: string;
  requiredCount: number;
  rewardCash: number;
  description: string;
  isCommercialBulk?: boolean;
}

const PRIVATE_COLLECTOR_CLIENTS = [
  { client: 'Private Collector', title: 'Rare Specimen Acquisition' },
  { client: 'Bespoke Connoisseur', title: 'Private Collector Bounty' },
  { client: 'Exotic Aquarist', title: 'Exotic Specimen Commission' },
  { client: 'Fine Dining Guild', title: 'Grand Kitchen Acquisition' },
];

const LOCAL_CLIENTS = [
  { client: 'Willow Creek Diner', title: 'Lakeside Fish Fry' },
  { client: 'Old Town Bait & Tackle', title: 'Stock Tank Request' },
  { client: 'Sunny Acres Farmstand', title: 'Pond Forage Supply' },
  { client: 'Riverside Smokehouse', title: 'Cured Specialty Order' },
  { client: 'The Blue Heron Bistro', title: 'Catch of the Day Special' },
  { client: 'Old Harbor Tavern', title: 'Fisherman Stew Kettle' },
];

const COMMERCIAL_CLIENTS = [
  { client: 'Grand Atlantic Seafood Co.', title: 'Commercial Bulk Lot' },
  { client: 'Pacific Rim Fish Exchange', title: 'Wholesale Market Export' },
  { client: 'Metropolitan Supermarket Depot', title: 'Fresh Catch Crate' },
  { client: 'Michelin Star Omakase Bar', title: 'Pristine Sashimi Reserve' },
  { client: 'Oceanic Horizon Cruise Line', title: 'VIP Captains Banquet' },
  { client: 'Imperial Culinary Reserve', title: 'Grand Royal Banquet Bounty' },
];

export function getPlayerFishingRank(unlockedAreaCount: number, totalFishCaught: number, ownedBoatsCount: number): number {
  if (unlockedAreaCount >= 6 || ownedBoatsCount >= 4 || totalFishCaught >= 350) return 6;
  if (unlockedAreaCount >= 5 || ownedBoatsCount >= 3 || totalFishCaught >= 200) return 5;
  if (unlockedAreaCount >= 4 || ownedBoatsCount >= 2 || totalFishCaught >= 100) return 4;
  if (unlockedAreaCount >= 3 || ownedBoatsCount >= 1 || totalFishCaught >= 40) return 3;
  if (unlockedAreaCount >= 2 || totalFishCaught >= 12) return 2;
  return 1;
}

export function createPrivateOrder(
  unlockedAreaIds: string[],
  existingFishIds: number[] = [],
  playerRank: number = 1
): FishMarketOrder {
  // 22% rare chance for an elite private collector contract requesting a rare or epic fish with massive payout
  const isRareBounty = Math.random() < 0.22;

  let candidateFish: FishSpecies[];
  let clientInfo: { client: string; title: string };
  let category: ContractCategory = 'local';
  let categoryLabel = 'Private Order';
  let requiredCount = 1;
  let rewardCash = 0;
  let description = '';

  if (isRareBounty) {
    // Target rare or epic fish from unlocked waters
    candidateFish = FISH_COLLECTION.filter(
      (f) =>
        unlockedAreaIds.includes(f.areaId) &&
        (f.tier === 'rare' || f.tier === 'epic') &&
        !existingFishIds.includes(f.id)
    );
    if (candidateFish.length === 0) {
      candidateFish = FISH_COLLECTION.filter(
        (f) => unlockedAreaIds.includes(f.areaId) && f.tier === 'rare'
      );
    }
    if (candidateFish.length === 0) {
      candidateFish = FISH_COLLECTION.filter(
        (f) => unlockedAreaIds.includes(f.areaId) && f.tier === 'uncommon'
      );
    }
    if (candidateFish.length === 0) candidateFish = [FISH_COLLECTION[0]];

    const fish = candidateFish[Math.floor(Math.random() * candidateFish.length)];
    clientInfo = PRIVATE_COLLECTOR_CLIENTS[Math.floor(Math.random() * PRIVATE_COLLECTOR_CLIENTS.length)];
    category = 'private';
    categoryLabel = 'Rare Private Bounty';
    requiredCount = playerRank >= 5 && fish.tier === 'rare' ? 2 : 1;

    // Rare private bounties give massive cash (8x - 14x base value)
    const rareMultiplier = 8.0 + playerRank * 2.2;
    rewardCash = Math.max(
      600 * playerRank,
      Math.round(fish.basePrice * requiredCount * rareMultiplier)
    );
    description = `Exclusive private collector commission for an elusive ${fish.tier} specimen. Exceptional cash payout.`;

    return {
      id: `private_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      client: clientInfo.client,
      title: clientInfo.title,
      fishId: fish.id,
      fishName: fish.name,
      tier: fish.tier,
      category,
      categoryLabel,
      requiredCount,
      rewardCash,
      isCommercialBulk: false,
      description,
    };
  } else {
    // Standard private order for common/uncommon table fish
    const allowedTiers: RarityTier[] = playerRank >= 3 ? ['uncommon', 'common'] : ['common'];
    candidateFish = FISH_COLLECTION.filter(
      (f) =>
        unlockedAreaIds.includes(f.areaId) &&
        allowedTiers.includes(f.tier) &&
        !existingFishIds.includes(f.id)
    );
    if (candidateFish.length === 0) {
      candidateFish = FISH_COLLECTION.filter(
        (f) => unlockedAreaIds.includes(f.areaId) && f.tier !== 'legendary'
      );
    }
    if (candidateFish.length === 0) candidateFish = [FISH_COLLECTION[0]];

    const fish = candidateFish[Math.floor(Math.random() * candidateFish.length)];
    clientInfo = LOCAL_CLIENTS[Math.floor(Math.random() * LOCAL_CLIENTS.length)];
    category = Math.random() < 0.5 ? 'restaurant' : 'local';
    categoryLabel = category === 'restaurant' ? 'Restaurant Request' : 'Local Diner';
    requiredCount = playerRank >= 4 ? Math.floor(2 + Math.random() * 2) : (playerRank >= 2 ? 2 : 1);

    const normalMultiplier = 3.2 + playerRank * 1.1;
    rewardCash = Math.max(
      40 * playerRank * requiredCount,
      Math.round(fish.basePrice * requiredCount * normalMultiplier)
    );
    description = `Deliver ${requiredCount}x ${fish.name} from your Box.`;

    return {
      id: `private_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      client: clientInfo.client,
      title: clientInfo.title,
      fishId: fish.id,
      fishName: fish.name,
      tier: fish.tier,
      category,
      categoryLabel,
      requiredCount,
      rewardCash,
      isCommercialBulk: false,
      description,
    };
  }
}

export function createCommercialOrder(
  unlockedAreaIds: string[],
  existingFishIds: number[] = [],
  playerRank: number = 1
): FishMarketOrder {
  let allowedTiers: RarityTier[] = ['common', 'uncommon'];
  if (playerRank >= 5) {
    allowedTiers = Math.random() < 0.4 ? ['epic'] : ['rare', 'uncommon'];
  } else if (playerRank >= 3) {
    allowedTiers = Math.random() < 0.5 ? ['rare'] : ['uncommon', 'common'];
  }

  let candidateFish = FISH_COLLECTION.filter(
    (f) =>
      unlockedAreaIds.includes(f.areaId) &&
      allowedTiers.includes(f.tier) &&
      !existingFishIds.includes(f.id)
  );

  if (candidateFish.length === 0) {
    candidateFish = FISH_COLLECTION.filter(
      (f) => unlockedAreaIds.includes(f.areaId) && f.tier !== 'legendary'
    );
    if (candidateFish.length === 0) candidateFish = [FISH_COLLECTION[0]];
  }

  const fish = candidateFish[Math.floor(Math.random() * candidateFish.length)];
  const clientInfo = COMMERCIAL_CLIENTS[Math.floor(Math.random() * COMMERCIAL_CLIENTS.length)];
  const isLuxury = playerRank >= 4 && (fish.tier === 'rare' || fish.tier === 'epic');
  const category: ContractCategory = isLuxury ? 'luxury' : 'wholesale';
  const categoryLabel = isLuxury ? 'Luxury Wholesale Reserve' : 'Commercial Wholesale Lot';

  // Commercial bulk quantities
  let requiredCount = 3;
  if (fish.tier === 'common') {
    requiredCount = Math.floor(6 + Math.random() * 6); // 6-11
  } else if (fish.tier === 'uncommon') {
    requiredCount = Math.floor(4 + Math.random() * 4); // 4-7
  } else {
    requiredCount = Math.floor(2 + Math.random() * 3); // 2-4
  }

  const rankMultiplier = 4.0 + Math.pow(playerRank, 1.35) * 1.6;
  const categoryBonus = isLuxury ? 5.0 : 3.0;
  const totalMultiplier = rankMultiplier + categoryBonus;

  const rewardCash = Math.max(
    120 * playerRank * requiredCount,
    Math.round(fish.basePrice * requiredCount * totalMultiplier)
  );

  return {
    id: `commercial_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    client: clientInfo.client,
    title: clientInfo.title,
    fishId: fish.id,
    fishName: fish.name,
    tier: fish.tier,
    category,
    categoryLabel,
    requiredCount,
    rewardCash,
    isCommercialBulk: true,
    description: `Deliver bulk catch of ${requiredCount}x ${fish.name} from your Box or Fleet hauls.`,
  };
}

export function createNewOrder(
  unlockedAreaIds: string[],
  existingFishIds: number[] = [],
  playerRank: number = 1
): FishMarketOrder {
  // Legacy adapter: alternates or generates private order
  return createPrivateOrder(unlockedAreaIds, existingFishIds, playerRank);
}

export function generateMarketOrders(
  unlockedAreaIds: string[],
  countOrRank: number = 3,
  explicitPlayerRank?: number
): FishMarketOrder[] {
  let rank = 1;
  let count = 3;

  if (explicitPlayerRank !== undefined) {
    rank = explicitPlayerRank;
    count = countOrRank;
  } else {
    if (countOrRank <= 3) {
      count = countOrRank;
      rank = 1;
    } else {
      rank = countOrRank;
      count = Math.min(8, 2 + rank);
    }
  }

  const orders: FishMarketOrder[] = [];
  for (let i = 0; i < count; i++) {
    const existing = orders.map((o) => o.fishId);
    orders.push(createPrivateOrder(unlockedAreaIds, existing, rank));
  }
  return orders;
}

export function generateCommercialOrders(
  unlockedAreaIds: string[],
  count: number = 4,
  playerRank: number = 1
): FishMarketOrder[] {
  const orders: FishMarketOrder[] = [];
  for (let i = 0; i < count; i++) {
    const existing = orders.map((o) => o.fishId);
    orders.push(createCommercialOrder(unlockedAreaIds, existing, playerRank));
  }
  return orders;
}

export function getFishSpriteUrl(fish?: { id?: number; fishId?: number; name?: string } | null): string | null {
  if (!fish) return null;
  const id = fish.fishId ?? fish.id;
  const name = (fish.name || '').toLowerCase();

  // Ocean Deep Mega-Creatures & Relics
  if (name.includes('oarfish') || id === 116) {
    return './fish/giant_oarfish.png';
  }
  if (name.includes('colossal squid') || id === 117) {
    return './fish/colossal_squid.png';
  }
  if (name.includes('great white') || id === 118) {
    return './fish/great_white_shark.png';
  }
  if (name.includes('megamouth') || id === 119) {
    return './fish/megamouth_shark.png';
  }
  if (name.includes('coelacanth') || id === 120) {
    return './fish/coelacanth.png';
  }
  if (name.includes('manta') || id === 121) {
    return './fish/giant_oceanic_manta.png';
  }

  // 1. Nurse Shark
  if (name.includes('nurse shark') || id === 105) {
    return './fish/nurse_shark.png';
  }

  // 1b. Sharks & Cartilaginous Reef Predators
  if (name.includes('shark') || id === 104) {
    return './fish/blacktip_reef_shark.png';
  }

  // 2. Bowfin (Mudfish)
  if (name.includes('bowfin') || name.includes('mudfish') || id === 57) {
    return './fish/bowfin.png';
  }

  // 3. American Paddlefish
  if (name.includes('paddlefish') || id === 66) {
    return './fish/american_paddlefish.png';
  }

  // 4. Gar Species
  if (name.includes('albino') || id === 69) {
    return './fish/albino_river_gar.png';
  }
  if (name.includes('shortnose') || id === 62) {
    return './fish/shortnose_gar.png';
  }
  if (name.includes('spotted gar') || id === 61) {
    return './fish/spotted_gar.png';
  }
  if (name.includes('longnose') || id === 63) {
    return './fish/longnose_gar.png';
  }
  if (name.includes('gar') || id === 67) {
    return './fish/alligator_gar.png';
  }

  // 5. Sturgeon Species
  if (name.includes('ancient lake sturgeon') || id === 56) {
    return './fish/ancient_lake_sturgeon.png';
  }
  if (name.includes('lake sturgeon') || id === 55) {
    return './fish/lake_sturgeon.png';
  }
  if (name.includes('sturgeon') || id === 36 || id === 38) {
    return './fish/white_sturgeon.png';
  }

  // 6. Great Barracuda
  if (name.includes('barracuda') || id === 99) {
    return './fish/great_barracuda.png';
  }

  // 7. Mahi-Mahi / Dorado
  if (name.includes('mahi') || name.includes('dorado') || id === 102) {
    return './fish/mahi_mahi.png';
  }

  // 8. Billfish & Marlins
  if (name.includes('grand sovereign') || name.includes('sovereign marlin') || id === 109) {
    return './fish/grand_sovereign_marlin.png';
  }
  if (name.includes('marlin') || id === 106) {
    return './fish/blue_marlin.png';
  }
  if (name.includes('swordfish') || id === 107) {
    return './fish/swordfish.png';
  }
  if (name.includes('sailfish') || id === 108) {
    return './fish/sailfish.png';
  }

  // 9. Wahoo
  if (name.includes('wahoo') || id === 101) {
    return './fish/wahoo.png';
  }

  // 10. Atlantic Tarpon
  if (name.includes('tarpon') || id === 83) {
    return './fish/tarpon.png';
  }

  // 11. Flounder & Flatfish
  if (name.includes('winter flounder') || id === 74) {
    return './fish/winter_flounder.png';
  }
  if (name.includes('flounder') || id === 73) {
    return './fish/summer_flounder.png';
  }
  if (name.includes('halibut') || id === 85) {
    return './fish/pacific_halibut.png';
  }

  // 12. Moray Eels
  if (name.includes('spotted moray') || id === 98) {
    return './fish/spotted_moray.png';
  }
  if (name.includes('moray') || /\beel\b/.test(name) || name.endsWith(' eel')) {
    return './fish/green_moray.png';
  }

  // 13. Pike & Esocids
  if (name.includes('redfin pickerel') || id === 113) {
    return './fish/redfin_pickerel.png';
  }
  if (name.includes('muskellunge') || name.includes('muskie') || id === 50 || id === 51) {
    return './fish/muskellunge.png';
  }
  if (name.includes('pickerel') || id === 49) {
    return './fish/chain_pickerel.png';
  }
  if (name.includes('pike') || id === 48) {
    return './fish/northern_pike.png';
  }

  // 14. Schoolers & Pelagics
  if (name.includes('sardine') || id === 71) {
    return './fish/pacific_sardine.png';
  }
  if (name.includes('mackerel') || id === 70) {
    return './fish/atlantic_mackerel.png';
  }
  if (name.includes('mullet') || id === 72) {
    return './fish/striped_mullet.png';
  }
  if (name.includes('yellowfin') || id === 87) {
    return './fish/yellowfin_tuna.png';
  }
  if (name.includes('tuna') || id === 88 || id === 89) {
    return './fish/bluefin_tuna.png';
  }

  // 15. Drums
  if (name.includes('black drum') || id === 80) {
    return './fish/black_drum.png';
  }
  if (name.includes('freshwater drum') || name.includes('gaspergou') || id === 54) {
    return './fish/freshwater_drum.png';
  }
  if (name.includes('drum') || name.includes('redfish') || id === 79) {
    return './fish/red_drum.png';
  }

  // 16. Coastal Gamefish
  if (name.includes('pompano') || id === 114) {
    return './fish/florida_pompano.png';
  }
  if (name.includes('black sea bass') || (name.includes('sea bass') && !name.includes('striped')) || id === 75) {
    return './fish/black_sea_bass.png';
  }
  if (name.includes('sheepshead') || id === 76) {
    return './fish/sheepshead.png';
  }
  if (name.includes('seatrout') || name.includes('speckled trout') || id === 77) {
    return './fish/spotted_seatrout.png';
  }
  if (name.includes('trevally') || id === 100) {
    return './fish/giant_trevally.png';
  }
  if (name.includes('bluefish') || id === 81) {
    return './fish/bluefish.png';
  }
  if (name.includes('snook') || id === 82) {
    return './fish/snook.png';
  }
  if (name.includes('cobia') || id === 84) {
    return './fish/cobia.png';
  }
  if (name.includes('striped bass') || id === 78) {
    return './fish/striped_bass.png';
  }

  // 17. Coral Reef Exotics
  if (name.includes('triggerfish') || name.includes('picasso') || id === 115) {
    return './fish/picasso_triggerfish.png';
  }
  if (name.includes('lionfish') || id === 97) {
    return './fish/lionfish.png';
  }
  if (name.includes('angelfish') || id === 93) {
    return './fish/queen_angelfish.png';
  }
  if (name.includes('tang') || id === 91) {
    return './fish/blue_tang.png';
  }
  if (name.includes('parrotfish') || id === 92) {
    return './fish/stoplight_parrotfish.png';
  }
  if (name.includes('clownfish') || name.includes('anemone') || name.includes('damselfish') || id === 90) {
    return './fish/clownfish.png';
  }
  if (name.includes('grouper') || id === 103) {
    return './fish/goliath_grouper.png';
  }
  if (name.includes('mutton snapper') || id === 95) {
    return './fish/mutton_snapper.png';
  }
  if (name.includes('yellowtail snapper') || id === 94) {
    return './fish/yellowtail_snapper.png';
  }
  if (name.includes('snapper') || id === 96) {
    return './fish/red_snapper.png';
  }

  // 18. Catfish & Bullheads
  if (name.includes('flathead') || id === 59 || id === 68) {
    return './fish/flathead_catfish.png';
  }
  if (name.includes('blue catfish') || id === 60) {
    return './fish/blue_catfish.png';
  }
  if (name.includes('yellow bullhead') || id === 11) {
    return './fish/yellow_bullhead.png';
  }
  if (name.includes('black bullhead') || id === 12) {
    return './fish/black_bullhead.png';
  }
  if (name.includes('brown bullhead') || id === 13) {
    return './fish/brown_bullhead.png';
  }
  if (name.includes('catfish') || name.includes('bullhead') || id === 58) {
    return './fish/channel_catfish.png';
  }

  // 19. Percids & Cod
  if (name.includes('sauger') || id === 30) {
    return './fish/sauger.png';
  }
  if (name.includes('burbot') || id === 53) {
    return './fish/burbot.png';
  }
  if (name.includes('walleye') || id === 29) {
    return './fish/walleye.png';
  }
  if (name.includes('yellow perch') || id === 43 || id === 46) {
    return './fish/yellow_perch.png';
  }

  // 20. Crappies
  if (name.includes('white crappie') || id === 45) {
    return './fish/white_crappie.png';
  }
  if (name.includes('crappie') || id === 44) {
    return './fish/black_crappie.png';
  }

  // 21. Buffalo & Suckers
  if (name.includes('smallmouth buffalo') || id === 65) {
    return './fish/smallmouth_buffalo.png';
  }
  if (name.includes('buffalo') || id === 64) {
    return './fish/bigmouth_buffalo.png';
  }
  if (name.includes('redhorse') || id === 32) {
    return './fish/river_redhorse.png';
  }

  // 22. Carps & Koi
  if (name.includes('koi') || id === 20) {
    return './fish/golden_koi.png';
  }
  if (name.includes('crucian') || id === 18) {
    return './fish/crucian_carp.png';
  }
  if (name.includes('grass carp') || id === 17) {
    return './fish/grass_carp.png';
  }
  if (name.includes('mirror carp') || id === 16) {
    return './fish/mirror_carp.png';
  }
  if (name.includes('carp') || id === 15) {
    return './fish/common_carp.png';
  }

  // 23. Trout & Salmonids
  if (name.includes('splake') || id === 112) {
    return './fish/splake.png';
  }
  if (name.includes('dolly varden') || id === 111) {
    return './fish/dolly_varden.png';
  }
  if (name.includes('river king') || name.includes('king chinook') || id === 37) {
    return './fish/river_king_chinook.png';
  }
  if (name.includes('salmon') || id === 86) {
    return './fish/chinook_salmon.png';
  }
  if (name.includes('lake whitefish') || id === 47) {
    return './fish/lake_whitefish.png';
  }
  if (name.includes('mountain whitefish') || id === 27) {
    return './fish/mountain_whitefish.png';
  }
  if (name.includes('arctic grayling') || name.includes('grayling') || id === 28) {
    return './fish/arctic_grayling.png';
  }
  if (name.includes('lake trout') || name.includes('mackinaw') || id === 52) {
    return './fish/lake_trout.png';
  }
  if (name.includes('bull trout') || id === 33) {
    return './fish/bull_trout.png';
  }
  if (name.includes('tiger trout') || id === 34) {
    return './fish/tiger_trout.png';
  }
  if (name.includes('golden trout') || id === 26) {
    return './fish/golden_trout.png';
  }
  if (name.includes('cutthroat') || id === 25) {
    return './fish/cutthroat_trout.png';
  }
  if (name.includes('brown trout') || id === 23) {
    return './fish/brown_trout.png';
  }
  if (name.includes('brook trout') || id === 21) {
    return './fish/brook_trout.png';
  }
  if (name.includes('steelhead') || id === 35) {
    return './fish/steelhead.png';
  }
  if (name.includes('rainbow trout') || id === 22) {
    return './fish/rainbow_trout.png';
  }

  // 24. Black Bass & Sunfish
  if (name.includes('trophy pond bass') || id === 19) {
    return './fish/trophy_pond_bass.png';
  }
  if (name.includes('white bass') || id === 42) {
    return './fish/white_bass.png';
  }
  if (name.includes('smallmouth bass') || id === 24 || id === 40) {
    return './fish/smallmouth_bass.png';
  }
  if (name.includes('spotted bass') || id === 41) {
    return './fish/spotted_bass.png';
  }
  if (name.includes('rock bass') || name.includes('goggle-eye') || id === 10) {
    return './fish/rock_bass.png';
  }
  if (name.includes('bass') || id === 14) {
    return './fish/largemouth_bass.png';
  }
  if (name.includes('warmouth') || id === 9) {
    return './fish/warmouth.png';
  }
  if (name.includes('redear') || id === 8) {
    return './fish/redear_sunfish.png';
  }
  if (name.includes('green sunfish') || id === 7) {
    return './fish/green_sunfish.png';
  }
  if (name.includes('pumpkinseed') || id === 6) {
    return './fish/pumpkinseed_sunfish.png';
  }
  if (name.includes('longear') || id === 110) {
    return './fish/longear_sunfish.png';
  }

  // 25. Minnows & Small Forage
  if (name.includes('golden shiner') || name.includes('shiner') || id === 3) {
    return './fish/golden_shiner.png';
  }
  if (name.includes('fallfish') || id === 31) {
    return './fish/fallfish.png';
  }
  if (name.includes('creek chub') || name.includes('chub') || id === 2) {
    return './fish/creek_chub.png';
  }
  if (name.includes('fathead') || id === 4) {
    return './fish/fathead_minnow.png';
  }
  if (name.includes('minnow') || id === 1) {
    return './fish/minnow.png';
  }

  // Fallback: Bluegill
  return './fish/bluegill.png';
}

export function getMutationFilterStyle(mutation?: string | null): Record<string, string> {
  if (!mutation || mutation === 'normal') return {};
  if (mutation === 'golden') {
    return {
      filter:
        'sepia(1) saturate(5.5) hue-rotate(8deg) brightness(1.22) contrast(1.16) drop-shadow(0 0 6px rgba(250, 204, 21, 0.85)) drop-shadow(0 0 14px rgba(234, 179, 8, 0.45))',
    };
  }
  if (mutation === 'albino') {
    return {
      filter:
        'grayscale(1) brightness(1.36) contrast(1.32) drop-shadow(0 0 6px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 12px rgba(244, 114, 182, 0.4))',
    };
  }
  if (mutation === 'melanistic') {
    return {
      filter:
        'brightness(0.44) contrast(2.2) saturate(2.4) hue-rotate(250deg) drop-shadow(0 0 6px rgba(168, 85, 247, 0.75)) drop-shadow(0 0 14px rgba(139, 92, 246, 0.4))',
    };
  }
  if (mutation === 'bioluminescent') {
    return {
      filter:
        'invert(0.12) hue-rotate(160deg) saturate(4.2) brightness(1.2) contrast(1.35) drop-shadow(0 0 8px rgba(6, 182, 212, 0.95)) drop-shadow(0 0 16px rgba(14, 165, 233, 0.55))',
    };
  }
  if (mutation === 'piebald') {
    return {
      filter:
        'saturate(3.2) contrast(1.9) brightness(1.12) hue-rotate(325deg) drop-shadow(0 0 6px rgba(249, 115, 22, 0.75)) drop-shadow(0 0 14px rgba(234, 88, 12, 0.4))',
    };
  }
  return {};
}


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FishSpecies, FISH_COLLECTION } from './fishingLogic';

export type TankId = 'tank_1' | 'tank_2' | 'tank_3' | 'tank_4';
export type TankStage = 'empty' | 'spawning' | 'fingerlings' | 'mature';
export type FeedType = 'pellets' | 'plankton' | 'protein';
export type HatcheryUpgradeId =
  | 'aerator'
  | 'auto_feeder'
  | 'thermostat'
  | 'genetics_lab'
  | 'tank_expansion_1'
  | 'tank_expansion_2'
  | 'bait_well_expansion';

export type HatcheryMutation =
  | 'normal'
  | 'albino'
  | 'melanistic'
  | 'bioluminescent'
  | 'piebald'
  | 'golden';

export interface MutationDetail {
  id: HatcheryMutation;
  name: string;
  valueMultiplier: number;
  badgeStyle: string;
  description: string;
}

export const MUTATION_DETAILS: Record<HatcheryMutation, MutationDetail> = {
  normal: {
    id: 'normal',
    name: 'Wild Standard',
    valueMultiplier: 1.0,
    badgeStyle: 'border-[#3b404d] bg-[#1a1c22] text-[#9da5b4]',
    description: 'Standard natural pigmentation and morphology.',
  },
  piebald: {
    id: 'piebald',
    name: 'Piebald Calico',
    valueMultiplier: 1.9,
    badgeStyle: 'border-orange-600/70 bg-orange-950/60 text-orange-300 font-bold',
    description: 'Striking marbled calico pattern. +90% market value.',
  },
  albino: {
    id: 'albino',
    name: 'Ghost Albino',
    valueMultiplier: 2.0,
    badgeStyle: 'border-slate-300/80 bg-slate-100/10 text-slate-100 font-bold',
    description: 'Pure translucent white scales with ruby eyes. +100% market value.',
  },
  melanistic: {
    id: 'melanistic',
    name: 'Midnight Melanistic',
    valueMultiplier: 2.2,
    badgeStyle: 'border-purple-600/70 bg-purple-950/60 text-purple-300 font-bold',
    description: 'Hyper-pigmented obsidian dark scales. +120% market value.',
  },
  bioluminescent: {
    id: 'bioluminescent',
    name: 'Bioluminescent Neon',
    valueMultiplier: 2.8,
    badgeStyle: 'border-cyan-500/80 bg-cyan-950/70 text-cyan-300 font-bold',
    description: 'Soft glowing cyan hue. +180% market value & +50% live bait boost.',
  },
  golden: {
    id: 'golden',
    name: 'Gilded Golden Strain',
    valueMultiplier: 3.5,
    badgeStyle: 'border-amber-400/80 bg-amber-950/70 text-amber-200 font-bold',
    description: 'Radiant metallic gold sheen. +250% market value.',
  },
};

export interface FeedOption {
  id: FeedType;
  name: string;
  price: number;
  speedMultiplier: number;
  clutchBonus: number;
  trophyChance: number;
  description: string;
}

export const FEED_OPTIONS: FeedOption[] = [
  {
    id: 'pellets',
    name: 'Aqua Pellets',
    price: 15,
    speedMultiplier: 1.0,
    clutchBonus: 0,
    trophyChance: 0.03,
    description: 'Standard grain feed. Steady growth.',
  },
  {
    id: 'plankton',
    name: 'Plankton Blend',
    price: 45,
    speedMultiplier: 1.4,
    clutchBonus: 2,
    trophyChance: 0.08,
    description: '+40% growth speed and +2 clutch yield per pair.',
  },
  {
    id: 'protein',
    name: 'Protein Mash',
    price: 110,
    speedMultiplier: 1.85,
    clutchBonus: 4,
    trophyChance: 0.18,
    description: '+85% growth speed and higher trophy odds.',
  },
];

export interface HatcheryUpgrade {
  id: HatcheryUpgradeId;
  name: string;
  price: number;
  effect: string;
}

export const HATCHERY_UPGRADES: HatcheryUpgrade[] = [
  {
    id: 'aerator',
    name: 'Jet Aerator',
    price: 400,
    effect: '-25% breeding duration across all tanks',
  },
  {
    id: 'auto_feeder',
    name: 'Auto-Feeder Hopper',
    price: 950,
    effect: 'Automatically replenishes tank feed from funds',
  },
  {
    id: 'tank_expansion_1',
    name: 'Expanded Raceway Vats',
    price: 650,
    effect: '+6 tank holding capacity (holds up to 12 fish per tank)',
  },
  {
    id: 'bait_well_expansion',
    name: 'Aerated Live Bait Well',
    price: 850,
    effect: 'Expands live bait storage capacity from 30 to 75 units',
  },
  {
    id: 'thermostat',
    name: 'Water Thermostat',
    price: 1800,
    effect: '+2 clutch yield on all hatch cycles',
  },
  {
    id: 'tank_expansion_2',
    name: 'Industrial Bio-Recirculator',
    price: 2200,
    effect: '+8 tank holding capacity (holds up to 20 fish per tank)',
  },
  {
    id: 'genetics_lab',
    name: 'Broodstock Lab',
    price: 3600,
    effect: '+25% market sale value & 2x trophy / mutation odds',
  },
];

export interface HatcheryTank {
  id: TankId;
  name: string;
  unlocked: boolean;
  unlockCost: number;
  speciesId: number | null;
  stage: TankStage;
  startedAt: number;
  durationSec: number;
  feedType: FeedType;
  hasFood: boolean;
  clutchCount: number;
  trophyCount: number;
  avgWeight: number;
  // Scalable Broodstock & Resident Colony
  broodstockCount: number;
  pairCount: number;
  // Genetics & Stats
  growthRate: number; // 1.0x to 2.2x
  fecundity: number; // 1.0x to 2.0x
  hardiness: number; // 1.0x to 1.8x
  mutationStrain: HatcheryMutation;
  mutationCount: number;
}

export const INITIAL_HATCHERY_TANKS: HatcheryTank[] = [
  {
    id: 'tank_1',
    name: 'Tank 1 - Nursery',
    unlocked: false,
    unlockCost: 500,
    speciesId: null,
    stage: 'empty',
    startedAt: 0,
    durationSec: 0,
    feedType: 'pellets',
    hasFood: false,
    clutchCount: 0,
    trophyCount: 0,
    avgWeight: 0,
    broodstockCount: 0,
    pairCount: 1,
    growthRate: 1.0,
    fecundity: 1.0,
    hardiness: 1.0,
    mutationStrain: 'normal',
    mutationCount: 0,
  },
  {
    id: 'tank_2',
    name: 'Tank 2 - Grow-out',
    unlocked: false,
    unlockCost: 350,
    speciesId: null,
    stage: 'empty',
    startedAt: 0,
    durationSec: 0,
    feedType: 'pellets',
    hasFood: false,
    clutchCount: 0,
    trophyCount: 0,
    avgWeight: 0,
    broodstockCount: 0,
    pairCount: 1,
    growthRate: 1.0,
    fecundity: 1.0,
    hardiness: 1.0,
    mutationStrain: 'normal',
    mutationCount: 0,
  },
  {
    id: 'tank_3',
    name: 'Tank 3 - Deep Well',
    unlocked: false,
    unlockCost: 1200,
    speciesId: null,
    stage: 'empty',
    startedAt: 0,
    durationSec: 0,
    feedType: 'pellets',
    hasFood: false,
    clutchCount: 0,
    trophyCount: 0,
    avgWeight: 0,
    broodstockCount: 0,
    pairCount: 1,
    growthRate: 1.0,
    fecundity: 1.0,
    hardiness: 1.0,
    mutationStrain: 'normal',
    mutationCount: 0,
  },
  {
    id: 'tank_4',
    name: 'Tank 4 - Aquaculture',
    unlocked: false,
    unlockCost: 3500,
    speciesId: null,
    stage: 'empty',
    startedAt: 0,
    durationSec: 0,
    feedType: 'pellets',
    hasFood: false,
    clutchCount: 0,
    trophyCount: 0,
    avgWeight: 0,
    broodstockCount: 0,
    pairCount: 1,
    growthRate: 1.0,
    fecundity: 1.0,
    hardiness: 1.0,
    mutationStrain: 'normal',
    mutationCount: 0,
  },
];

export function calculateBreedingDuration(
  species: FishSpecies,
  feedType: FeedType,
  upgrades: HatcheryUpgradeId[] = [],
  growthRate: number = 1.0,
  pairCount: number = 1
): number {
  let baseSec = 120;
  if (species.tier === 'common') baseSec = 120;
  else if (species.tier === 'uncommon') baseSec = 210;
  else if (species.tier === 'rare') baseSec = 360;
  else if (species.tier === 'epic') baseSec = 540;
  else if (species.tier === 'legendary') baseSec = 900;

  const feed = FEED_OPTIONS.find((f) => f.id === feedType) || FEED_OPTIONS[0];
  let adjustedSec = baseSec / (feed.speedMultiplier * Math.max(0.5, growthRate));

  if (upgrades.includes('aerator')) {
    adjustedSec *= 0.75;
  }

  // Breeding takes longer the more fish pairs are in the tank (+35% duration per extra pair)
  const safePairs = Math.max(1, pairCount);
  const pairTimeMultiplier = 1 + (safePairs - 1) * 0.35;
  adjustedSec *= pairTimeMultiplier;

  return Math.max(12, Math.round(adjustedSec));
}

export function getHatcheryTankMaxCapacity(upgrades: HatcheryUpgradeId[] = []): number {
  let cap = 6; // Base tank holding capacity
  if (upgrades.includes('tank_expansion_1')) cap += 6; // 12
  if (upgrades.includes('tank_expansion_2')) cap += 8; // 20
  return cap;
}

export function getHatcheryBaitMaxCapacity(upgrades: HatcheryUpgradeId[] = []): number {
  let cap = 30; // Base live bait storage capacity
  if (upgrades.includes('bait_well_expansion')) cap += 45; // 75
  return cap;
}

export function calculateClutchYield(
  species: FishSpecies,
  feedType: FeedType,
  upgrades: HatcheryUpgradeId[] = [],
  pairCount: number = 1,
  fecundity: number = 1.0
): number {
  let basePerPair = 3;
  if (species.tier === 'common') basePerPair = 5;
  else if (species.tier === 'uncommon') basePerPair = 4;
  else if (species.tier === 'rare') basePerPair = 3;
  else basePerPair = 2;

  const feed = FEED_OPTIONS.find((f) => f.id === feedType) || FEED_OPTIONS[0];
  let pairYield = basePerPair + feed.clutchBonus;

  if (upgrades.includes('thermostat')) {
    pairYield += 2;
  }

  // Scale by pair count and genetic fecundity
  const rawTotal = Math.round(pairYield * pairCount * Math.max(0.8, fecundity));
  const maxCapacity = getHatcheryTankMaxCapacity(upgrades);
  return Math.min(maxCapacity, Math.max(pairCount * 2, rawTotal));
}

export function calculateTrophyCount(
  clutchCount: number,
  feedType: FeedType,
  upgrades: HatcheryUpgradeId[] = [],
  hardiness: number = 1.0
): number {
  const feed = FEED_OPTIONS.find((f) => f.id === feedType) || FEED_OPTIONS[0];
  let chance = feed.trophyChance * Math.max(0.7, hardiness);
  if (upgrades.includes('genetics_lab')) {
    chance *= 2.0;
  }

  let trophies = 0;
  for (let i = 0; i < clutchCount; i++) {
    if (Math.random() < chance) {
      trophies++;
    }
  }
  return trophies;
}

export function rollClutchMutations(
  clutchCount: number,
  upgrades: HatcheryUpgradeId[] = [],
  hasAquacultureLab: boolean = false,
  isBreedersClubMember: boolean = false,
  parentMutation?: HatcheryMutation | 'normal'
): { mutationStrain: HatcheryMutation; mutationCount: number } {
  // Really low base chance when breeding normal fish (~1.8%)
  // Re-breeding with a mutated broodstock gives a higher chance (~8%), but still comfortably low
  const isMutatedBrood = Boolean(parentMutation && parentMutation !== 'normal');
  let mutationRate = isMutatedBrood ? 0.08 : 0.02;

  if (upgrades.includes('genetics_lab')) mutationRate += isMutatedBrood ? 0.04 : 0.035;
  if (hasAquacultureLab) mutationRate += isMutatedBrood ? 0.025 : 0.025;
  if (isBreedersClubMember) mutationRate += isMutatedBrood ? 0.02 : 0.02;

  // Instead of every fish mutating, if you get lucky only 1 is mutated
  if (Math.random() < mutationRate) {
    let dominant: HatcheryMutation;
    if (isMutatedBrood && parentMutation && parentMutation !== 'normal') {
      // 80% chance to inherit parent's mutation strain, 20% random other strain
      if (Math.random() < 0.80) {
        dominant = parentMutation as HatcheryMutation;
      } else {
        const roll = Math.random();
        if (roll < 0.35) dominant = 'piebald';
        else if (roll < 0.65) dominant = 'albino';
        else if (roll < 0.82) dominant = 'melanistic';
        else if (roll < 0.94) dominant = 'bioluminescent';
        else dominant = 'golden';
      }
    } else {
      const roll = Math.random();
      if (roll < 0.35) dominant = 'piebald';
      else if (roll < 0.65) dominant = 'albino';
      else if (roll < 0.82) dominant = 'melanistic';
      else if (roll < 0.94) dominant = 'bioluminescent';
      else dominant = 'golden';
    }

    return { mutationStrain: dominant, mutationCount: 1 };
  }

  return { mutationStrain: 'normal', mutationCount: 0 };
}

export function calculateBatchValue(
  species: FishSpecies,
  clutchCount: number,
  trophyCount: number,
  upgrades: HatcheryUpgradeId[] = [],
  mutationStrain: HatcheryMutation = 'normal',
  mutationCount: number = 0
): number {
  const normalCount = Math.max(0, clutchCount - trophyCount - mutationCount);
  const normalVal = normalCount * Math.round(species.basePrice * 1.35);
  const trophyVal = trophyCount * Math.round(species.basePrice * 3.2);

  const mutationDetail = MUTATION_DETAILS[mutationStrain] || MUTATION_DETAILS.normal;
  const mutationVal = mutationCount * Math.round(species.basePrice * 1.35 * mutationDetail.valueMultiplier);

  let total = normalVal + trophyVal + mutationVal;

  if (upgrades.includes('genetics_lab')) {
    total = Math.round(total * 1.25);
  }

  return Math.max(1, total);
}

export function calculateBaitYield(
  species: FishSpecies,
  clutchCount: number,
  mutationStrain: HatcheryMutation = 'normal'
): number {
  // Small forage fish give high bait yield
  const isSmall = species.maxWeight <= 2.5;
  const isMedium = species.maxWeight <= 8.0;

  let multiplier = 1;
  if (isSmall) multiplier = 3;
  else if (isMedium) multiplier = 2;

  // Bioluminescent strain yields +50% bait charges
  if (mutationStrain === 'bioluminescent') {
    multiplier = Math.round(multiplier * 1.5);
  }

  return clutchCount * multiplier;
}

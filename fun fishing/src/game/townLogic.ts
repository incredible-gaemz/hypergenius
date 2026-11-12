/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FishSpecies, FISH_COLLECTION } from './fishingLogic';

// ==========================================
// CIVIC INVESTMENTS (ECONOMY INFLUENCE)
// ==========================================

export type CivicInvestmentId =
  | 'cold_storage'
  | 'aquaculture_lab'
  | 'tourism_board'
  | 'conservation_trust'
  | 'merchant_bank';

export interface CivicInvestment {
  id: CivicInvestmentId;
  name: string;
  cost: number;
  effect: string;
  description: string;
  sector: 'Market Wholesale' | 'Aquaculture' | 'Private Contracts' | 'Wild Fishery' | 'Commerce';
}

export const CIVIC_INVESTMENTS: CivicInvestment[] = [
  {
    id: 'cold_storage',
    name: 'Harbor Cold Storage',
    cost: 1500,
    sector: 'Market Wholesale',
    effect: '+15% wholesale fish sell value harbor-wide',
    description: 'Industrial blast chillers guarantee premium fresh dockside pricing.',
  },
  {
    id: 'aquaculture_lab',
    name: 'Hatchery Genetics Lab',
    cost: 2400,
    sector: 'Aquaculture',
    effect: '+50% mutation occurrence rate & +20% clutch yield',
    description: 'Marine biologists assist in selective breeding and broodstock care.',
  },
  {
    id: 'tourism_board',
    name: 'Port Tourism Bureau',
    cost: 3200,
    sector: 'Private Contracts',
    effect: '+35% private contract payouts & increased rare bounties',
    description: 'Brings high-paying collectors and restaurateurs to the docks.',
  },
  {
    id: 'conservation_trust',
    name: 'Marine Habitat Trust',
    cost: 4500,
    sector: 'Wild Fishery',
    effect: '+15% wild catch weight & +20% passive trap soak speed',
    description: 'Clean water initiatives and reef beds foster trophy fish.',
  },
  {
    id: 'merchant_bank',
    name: 'Maritime Merchant Bank',
    cost: 8000,
    sector: 'Commerce',
    effect: '10% discount on all tackle, vessels, and facility upgrades',
    description: 'Harbor trade credit lines lower shipyard and gear costs.',
  },
];

// ==========================================
// ANGLER CLUBS & GUILDS
// ==========================================

export type ClubId = 'casters' | 'commercial' | 'breeders' | 'explorers';

export type GuildTier = 'apprentice' | 'journeyman' | 'master' | 'high_seas';

export interface AnglerClub {
  id: ClubId;
  name: string;
  tagline: string;
  tier: GuildTier;
  tierName: string;
  membershipDues: number; // Monthly subscription dues
  primaryPerk: string;
  perksDescription: string;
  lore: string;
}

export const GUILD_SUBSCRIPTION_CYCLE_MS = 10 * 60 * 1000; // 10 minutes per in-game month

export const ANGLER_CLUBS: AnglerClub[] = [
  {
    id: 'casters',
    name: "Old Salt's Guild",
    tagline: 'Light tackle & record battles',
    tier: 'apprentice',
    tierName: 'Apprentice Tier',
    membershipDues: 120,
    primaryPerk: '+8% line tension cushion & 10% instant tire strike chance',
    perksDescription: 'Fine-tuned drag techniques ease line strain on heavy strikes.',
    lore: 'An old harbor tradition celebrating patience and fine tackle balance.',
  },
  {
    id: 'breeders',
    name: 'Aquaculture Circle',
    tagline: 'Morph genetics & raceways',
    tier: 'journeyman',
    tierName: 'Journeyman Tier',
    membershipDues: 480,
    primaryPerk: '+12% hatchery breeding cycle speed & 1.5x rare color morph odds',
    perksDescription: 'Broodstock nutrient conditioning produces vibrant color mutations.',
    lore: 'Dedicated to preserving bloodlines and cultivating rare morphs.',
  },
  {
    id: 'commercial',
    name: 'Benthic Seafarers Union',
    tagline: 'Trawlers, pots & offshore salvage',
    tier: 'master',
    tierName: 'Master Tier',
    membershipDues: 1250,
    primaryPerk: '+10% trap soak speed & 12% voyage salvage crate recovery (+$100)',
    perksDescription: 'Shared fleet telemetry speeds up soak times and spots adrift cargo.',
    lore: 'Working captains and deckhands sharing routes and haul rights.',
  },
  {
    id: 'explorers',
    name: 'Deepwater Society',
    tagline: 'Barometric tracking & lurker sightings',
    tier: 'high_seas',
    tierName: 'High-Seas Grand Society',
    membershipDues: 2800,
    primaryPerk: '+20% weather rumor duration & +15% monster lurker strike attraction',
    perksDescription: 'Telemetry buoys extend window forecasts for fabled leviathans.',
    lore: 'Veteran navigators who chase squall lines for legendary specimens.',
  },
];

export interface ClubMemberState {
  currentClubId: ClubId | null;
  reputationPoints: Record<ClubId, number>;
  subscriptionDueAt?: number;
  autoRenew?: boolean;
  isSubscriptionActive?: boolean;
}

export function isClubPerkActive(clubState: ClubMemberState, clubId: ClubId): boolean {
  if (clubState.currentClubId !== clubId) return false;
  if (clubState.isSubscriptionActive === false) return false;
  if (clubState.subscriptionDueAt && Date.now() > clubState.subscriptionDueAt) {
    return false;
  }
  return true;
}

export function getSubscriptionTimeRemaining(dueAt?: number): {
  isOverdue: boolean;
  label: string;
} {
  if (!dueAt) return { isOverdue: false, label: 'Active' };
  const diffSec = Math.max(0, Math.floor((dueAt - Date.now()) / 1000));
  if (diffSec <= 0) {
    return { isOverdue: true, label: 'Dues Past Due' };
  }
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return { isOverdue: false, label: `${mins}m ${secs}s` };
}

export function getClubRankTitle(points: number): string {
  if (points >= 750) return 'Commodore';
  if (points >= 300) return 'Master Angler';
  if (points >= 100) return 'Journeyman';
  return 'Novice Member';
}

// ==========================================
// DAILY COMMODITY MARKET TRENDS
// ==========================================

export interface CommodityTrend {
  fishId: number;
  speciesName: string;
  markupPercent: number; // e.g. 35 for +35%
  marketReason: string;
}

export function getDailyCommodityTrends(timestamp: number = Date.now()): CommodityTrend[] {
  // Stably changes every 20 minutes (1,200,000ms)
  const seed = Math.floor(timestamp / (20 * 60 * 1000));
  const pool = FISH_COLLECTION.filter((f) => f.tier !== 'legendary');

  const reasons = [
    'Export surge to upscale Tokyo sashimi markets',
    'High restaurant demand for regional seafood festivals',
    'Wholesale cannery contracts needing immediate supply',
    'Local smoking houses bidding top dollar for fatty cuts',
    'Luxury resort banquets paying premium dockside rates',
  ];

  const results: CommodityTrend[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.abs((seed * 31 + i * 47) % pool.length);
    const fish = pool[idx];
    const markup = 30 + ((seed + i * 11) % 25); // 30% to 54%
    const reasonIdx = (seed + i) % reasons.length;

    results.push({
      fishId: fish.id,
      speciesName: fish.name,
      markupPercent: markup,
      marketReason: reasons[reasonIdx],
    });
  }

  return results;
}

// ==========================================
// TOWN COMMUNITY BOUNTIES
// ==========================================

export interface TownBounty {
  id: string;
  title: string;
  sponsor: string;
  description: string;
  targetSpeciesName: string;
  targetSpeciesId: number;
  requiredCount: number;
  rewardCash: number;
  rewardClubRep: number;
  targetClubId: ClubId;
}

export function generateTownBounties(timestamp: number = Date.now()): TownBounty[] {
  const seed = Math.floor(timestamp / (30 * 60 * 1000)); // Every 30 mins
  return [
    {
      id: `town_bounty_${seed}_1`,
      title: 'Municipal Fish Fry Fundraiser',
      sponsor: 'Harbor Fire Department & Town Council',
      description: 'Supply fresh panfish for the annual community fish fry fundraiser.',
      targetSpeciesName: 'Bluegill',
      targetSpeciesId: 1, // Bluegill
      requiredCount: 6,
      rewardCash: 240,
      rewardClubRep: 60,
      targetClubId: 'casters',
    },
    {
      id: `town_bounty_${seed}_2`,
      title: 'Benthic River Survey Sample',
      sponsor: 'Waterways Inspection Authority',
      description: 'Provide channel catfish specimens for riverbed health monitoring.',
      targetSpeciesName: 'Channel Catfish',
      targetSpeciesId: 58, // Channel Catfish
      requiredCount: 4,
      rewardCash: 380,
      rewardClubRep: 85,
      targetClubId: 'commercial',
    },
    {
      id: `town_bounty_${seed}_3`,
      title: 'Aquaculture Broodstock Gene Drive',
      sponsor: 'Bayou Hatchery Cooperative',
      description: 'Collect healthy wild minnows to introduce genetic diversity to local raceways.',
      targetSpeciesName: 'Minnow',
      targetSpeciesId: 2, // Minnow
      requiredCount: 8,
      rewardCash: 180,
      rewardClubRep: 50,
      targetClubId: 'breeders',
    },
  ];
}

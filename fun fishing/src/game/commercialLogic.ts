/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AreaId,
  CaughtFish,
  FISH_COLLECTION,
  FishSpecies,
  RarityTier,
  FishMarketOrder,
} from './fishingLogic';

export type CrewSpecialty =
  | 'bottom'
  | 'gamefish'
  | 'speed'
  | 'pelagic'
  | 'apprentice'
  | 'volume'
  | 'reef'
  | 'broker'
  | 'monger';

export interface CrewMember {
  id: string;
  name: string;
  hireCost: number;
  wagePerVoyage: number;
  specialty: CrewSpecialty;
  specialtyTitle: string;
  specialtyDescription: string;
  avatarIcon: string;
  bio: string;
  bonusPaidTotal?: number;
  moraleLevel?: number; // 0 to 5
}

export function getCrewMoraleTitle(level: number = 0): {
  title: string;
  badgeClass: string;
  effectDesc: string;
} {
  switch (level) {
    case 1:
      return {
        title: 'Pleased',
        badgeClass: 'border-emerald-700/70 bg-emerald-950/50 text-emerald-300',
        effectDesc: '+6% catch volume & -4% voyage duration',
      };
    case 2:
      return {
        title: 'Motivated',
        badgeClass: 'border-sky-600/70 bg-sky-950/60 text-sky-300',
        effectDesc: '+12% catch volume & -8% voyage duration',
      };
    case 3:
      return {
        title: 'Devoted',
        badgeClass: 'border-amber-500/70 bg-amber-950/60 text-amber-300',
        effectDesc: '+18% catch volume & -12% voyage duration',
      };
    case 4:
    case 5:
      return {
        title: 'Harbor Veteran',
        badgeClass: 'border-purple-500/80 bg-purple-950/70 text-purple-200 font-bold',
        effectDesc: '+25% catch volume, -15% voyage duration & 1.5x trophy strike',
      };
    default:
      return {
        title: 'Standard',
        badgeClass: 'border-[#3a404d] bg-[#1a1d23] text-[#8c94a2]',
        effectDesc: 'Base contracted efficiency',
      };
  }
}

export interface BoatDefinition {
  id: string;
  name: string;
  price: number;
  crewCapacity: number;
  cargoCapacity: number;
  baseVoyageSec: number;
  description: string;
  tier: number;
}

export interface FleetUpgrade {
  id: string;
  name: string;
  price: number;
  effect: string;
  description: string;
}

export type CommercialBaitId =
  | 'bare_gear'
  | 'bulk_worm_crate'
  | 'bulk_minnow_crate'
  | 'bulk_squid_crate';

export interface CommercialBait {
  id: CommercialBaitId;
  name: string;
  price: number;
  description: string;
  catchBonusMultiplier: number;
  targetTierBonus: RarityTier[];
}

export type SearchFocus = 'volume' | 'trophy' | 'quantity' | 'quality' | 'orders' | 'species';

export function getSearchFocusLabel(focus: SearchFocus): string {
  if (focus === 'volume' || focus === 'quantity') return 'Quantity';
  if (focus === 'trophy' || focus === 'quality') return 'Quality';
  if (focus === 'orders') return 'Contracts';
  return 'Target Species';
}

export interface ActiveExpedition {
  startedAt: number;
  durationSec: number;
  destinationAreaId: AreaId;
  searchFocus: SearchFocus;
  baitId: CommercialBaitId;
  wageCost: number;
  targetFishId?: number | null;
  resolvedHaul?: CaughtFish[];
  isCompleted?: boolean;
}

export interface OwnedBoat {
  instanceId: string;
  boatDefId: string;
  customName: string;
  assignedCrewIds: string[];
  installedUpgradeIds: string[];
  expedition: ActiveExpedition | null;
}

export interface CommercialStats {
  totalFleetRevenue: number;
  totalExpeditionsCount: number;
  totalFishLanded: number;
}

// ==========================================
// CATALOG DEFINITIONS
// ==========================================

export const BOATS_CATALOG: BoatDefinition[] = [
  {
    id: 'skiff',
    name: 'Timber Jon Boat',
    price: 450,
    crewCapacity: 1,
    cargoCapacity: 8,
    baseVoyageSec: 240, // 4 minutes
    description: 'A humble flat-bottomed wooden skiff for quiet river eddies and farm ponds.',
    tier: 1,
  },
  {
    id: 'dory',
    name: 'Coastal Trolling Dory',
    price: 1400,
    crewCapacity: 2,
    cargoCapacity: 18,
    baseVoyageSec: 420, // 7 minutes
    description: 'Double-ended seaworthy dory with twin oarlocks, outriggers, and a livewell.',
    tier: 2,
  },
  {
    id: 'trawler',
    name: 'Commercial Gillnetter',
    price: 3800,
    crewCapacity: 3,
    cargoCapacity: 35,
    baseVoyageSec: 720, // 12 minutes
    description: 'Diesel-powered harbor workhorse with hydraulic net drum and insulated fish hold.',
    tier: 3,
  },
  {
    id: 'longliner',
    name: 'Offshore Longliner',
    price: 11000,
    crewCapacity: 5,
    cargoCapacity: 70,
    baseVoyageSec: 1080, // 18 minutes
    description: 'Heavy steel hull with refrigerated storage capable of braving deep ocean banks.',
    tier: 4,
  },
  {
    id: 'bering_crabber',
    name: 'Bering Sea Heavy Crabber',
    price: 32000,
    crewCapacity: 10,
    cargoCapacity: 140,
    baseVoyageSec: 1500, // 25 minutes
    description: 'Ice-strengthened hull engineered for rough northern seas with high-capacity hydraulic pot haulers.',
    tier: 5,
  },
  {
    id: 'factory_ship',
    name: 'Commercial Factory Ship',
    price: 75000,
    crewCapacity: 15,
    cargoCapacity: 240,
    baseVoyageSec: 1800, // 30 minutes
    description: 'Industrial flagship with on-board blast freezers, dual booms, and crew mess.',
    tier: 6,
  },
  {
    id: 'pelagic_superseiner',
    name: 'Oceanic Pelagic Superseiner',
    price: 180000,
    crewCapacity: 25,
    cargoCapacity: 420,
    baseVoyageSec: 2400, // 40 minutes
    description: 'Commercial purse seiner equipped with sonar helicopter pad, drone tracking, and massive brine tanks.',
    tier: 7,
  },
  {
    id: 'deepsea_leviathan',
    name: 'Grand Oceanic Factory Stern Trawler',
    price: 450000,
    crewCapacity: 35,
    cargoCapacity: 750,
    baseVoyageSec: 3600, // 60 minutes
    description: 'Ice-class commercial mega-trawler with twin stern ramps, industrial blast freezers, and limitless ocean range.',
    tier: 8,
  },
];

export function getBoatSpriteUrl(boatDefId: string): string {
  return `./boats/${boatDefId}.png`;
}

export const HIREABLE_CREW: CrewMember[] = [
  {
    id: 'junior',
    name: 'Jack Briggs',
    hireCost: 80,
    wagePerVoyage: 4,
    specialty: 'apprentice',
    specialtyTitle: 'Deckhand Apprentice',
    specialtyDescription: '+15% total catch volume',
    avatarIcon: '',
    bio: 'Young deckhand who grew up working docks. Hard worker on any vessel.',
  },
  {
    id: 'hank',
    name: 'Hank Miller',
    hireCost: 180,
    wagePerVoyage: 8,
    specialty: 'bottom',
    specialtyTitle: 'Channel Fisherman',
    specialtyDescription: '+35% yield in Bayou & Rivers for bottom dwellers',
    avatarIcon: '',
    bio: 'Decades of experience working bayous, channels, and riverbeds.',
  },
  {
    id: 'maya',
    name: 'Maya Brooks',
    hireCost: 260,
    wagePerVoyage: 12,
    specialty: 'gamefish',
    specialtyTitle: 'Gamefish Scout',
    specialtyDescription: '+30% market value for trout, bass, walleye & gamefish',
    avatarIcon: '',
    bio: 'Skilled line angler who tracks feeding lines and lake drop-offs.',
  },
  {
    id: 'sammy',
    name: 'Sam Cruz',
    hireCost: 350,
    wagePerVoyage: 16,
    specialty: 'speed',
    specialtyTitle: 'Helmsman',
    specialtyDescription: '-25% expedition voyage duration',
    avatarIcon: '',
    bio: 'Coastal pilot who charts fast paths through tidal currents.',
  },
  {
    id: 'vance',
    name: 'Tom Vance',
    hireCost: 650,
    wagePerVoyage: 28,
    specialty: 'pelagic',
    specialtyTitle: 'Offshore Navigator',
    specialtyDescription: '+45% saltwater yield in Ocean & Reef',
    avatarIcon: '',
    bio: 'Veteran open water captain who works deep ocean banks and offshore swells.',
  },
  {
    id: 'elena',
    name: 'Elena Ross',
    hireCost: 850,
    wagePerVoyage: 35,
    specialty: 'volume',
    specialtyTitle: 'Net Tender',
    specialtyDescription: '+50% bulk catch volume on Volume Haul expeditions',
    avatarIcon: '',
    bio: 'Experienced commercial netter who manages high-volume trawls.',
  },
  {
    id: 'kahu',
    name: 'David Reed',
    hireCost: 1400,
    wagePerVoyage: 55,
    specialty: 'reef',
    specialtyTitle: 'Reef Pilot',
    specialtyDescription: 'Significantly boosts rare and epic reef catches',
    avatarIcon: '',
    bio: 'Knows island passes, outer barrier reefs, and coral channels.',
  },
  {
    id: 'marcus',
    name: 'Marcus Sterling',
    hireCost: 2100,
    wagePerVoyage: 75,
    specialty: 'broker',
    specialtyTitle: 'Wholesale Broker',
    specialtyDescription: '+35% cash on fleet wholesale sales and bulk contracts',
    avatarIcon: '',
    bio: 'Commercial distributor with established links to wholesale fish markets.',
  },
  {
    id: 'yuki',
    name: 'Jim Tanaka',
    hireCost: 3400,
    wagePerVoyage: 110,
    specialty: 'monger',
    specialtyTitle: 'Fishmonger',
    specialtyDescription: 'Guarantees sashimi-grade (+40% value) and 2x trophy odds',
    avatarIcon: '',
    bio: 'Experienced market grader who inspects and preps premium export fish.',
  },
];

export const FLEET_UPGRADES: FleetUpgrade[] = [
  {
    id: 'fish_finder',
    name: 'Hydro-Sonic Sonar Array',
    price: 750,
    effect: '+35% rare & epic species attraction',
    description: 'Digital sonar transducer scans underwater drop-offs to locate dense schools and trophy targets.',
  },
  {
    id: 'refrigerated_hold',
    name: 'Blast-Chilled Hold Insulation',
    price: 1200,
    effect: '+20% market sale value on returned hauls',
    description: 'Sub-zero slush chilling keeps harvested fish in pristine sashimi-grade condition.',
  },
  {
    id: 'hydraulic_winch',
    name: 'Hydraulic Heavy Winch',
    price: 1800,
    effect: '-20% expedition voyage duration',
    description: 'Industrial high-torque winches pull lines and net cod-ends aboard twice as fast.',
  },
  {
    id: 'satellite_radio',
    name: 'Fleet Radio & Satellite Dispatch',
    price: 2400,
    effect: '+15% haul yield retention on early recall',
    description: 'Direct satellite telemetry coordinates instant early recalls with zero harbor docking penalty.',
  },
  {
    id: 'processing_deck',
    name: 'On-Board Processing & Filleting Station',
    price: 3600,
    effect: '+25% wholesale sale value on all catches',
    description: 'Commercial deck crew bleeds, scales, and blast-freezes fillets before returning to harbor.',
  },
  {
    id: 'reinforced_trawl_net',
    name: 'Reinforced Deep-Sea Trawl Netting',
    price: 5400,
    effect: '+35% cargo hold capacity & deeper benthic catches',
    description: 'Multi-ply Dyneema nets dredge deeper thermoclines without snagging on reef pinnacles.',
  },
  {
    id: 'cryo_flash_freezer',
    name: 'Cryogenic Sub-Zero Freezing Hold',
    price: 7200,
    effect: '+30% market sale value on all catches & boosts trophy quality',
    description: 'Instant cryogenic flash-freezing locks in ultra-premium freshness with export certification.',
  },
  {
    id: 'auto_chum_turret',
    name: 'Automated Chumming Turret',
    price: 8200,
    effect: '+30% catch yield & 50% discount on voyage bait',
    description: 'Computerized dispersal pumps scent trails to draw schools from miles around.',
  },
  {
    id: 'spotter_drone',
    name: 'Thermal Aerial Spotter Drone',
    price: 11500,
    effect: '+45% chance to hook rare & epic ocean pelagic gamefish',
    description: 'Autonomous aerial drone spots surface boils and tuna frenzies from kilometers away.',
  },
  {
    id: 'turbo_marine_diesel',
    name: 'High-Output Turbo Marine Diesel',
    price: 14000,
    effect: '-25% expedition voyage duration',
    description: 'Twin turbocharged marine diesels slice through swells and ocean chop at high cruising knots.',
  },
  {
    id: 'automatic_sorter',
    name: 'Conveyor Culling & Sorter Unit',
    price: 18500,
    effect: 'Discards lightweight forage, ensuring only heavy record-class fish fill cargo',
    description: 'Digital weight-sorting conveyor returns undersized fish alive, preserving cargo for prime specimens.',
  },
  {
    id: 'steam_cannery_line',
    name: 'Commercial Steam Cannery Unit',
    price: 26000,
    effect: '+40% bonus value on common & uncommon fish',
    description: 'Flash-cans surplus forage fish into gourmet canned delicacies with international export markup.',
  },
  {
    id: 'maritime_starlink',
    name: 'Maritime Starlink Telemetry Array',
    price: 34000,
    effect: '100% full catch yield retention with ZERO penalty when calling vessels in early',
    description: 'Continuous satellite positioning coordinates instant harbor vector with zero early-recall penalty.',
  },
  {
    id: 'longline_drum',
    name: 'Automated Continuous Longline Drum',
    price: 52000,
    effect: '+60% catch yield on all commercial expeditions',
    description: 'Hydraulic drum sets and retrieves thousands of baited circle hooks in a single sweep.',
  },
  {
    id: 'global_export_syndicate',
    name: 'Global Cold-Chain Export Syndicate',
    price: 95000,
    effect: '+50% cash payout across all wholesale sales and fulfilled contracts',
    description: 'Direct air-cargo link delivers catches to premium luxury auctions in Tokyo and London.',
  },
];

export const COMMERCIAL_BAITS: CommercialBait[] = [
  {
    id: 'bare_gear',
    name: 'Standard Fleet Gear',
    price: 0,
    description: 'Crews use unbaited hooks and ambient gill netting. Baseline haul.',
    catchBonusMultiplier: 1.0,
    targetTierBonus: ['common'],
  },
  {
    id: 'bulk_worm_crate',
    name: 'Bulk Grub & Worm Crate',
    price: 60,
    description: 'Provision crew with 50 lbs of live worms & insects. +25% volume in freshwater.',
    catchBonusMultiplier: 1.25,
    targetTierBonus: ['common', 'uncommon'],
  },
  {
    id: 'bulk_minnow_crate',
    name: 'Aerated Live Minnow Tank',
    price: 150,
    description: 'Supply crew with live baitfish for predatory bass, trout, and catfish. +40% gamefish.',
    catchBonusMultiplier: 1.4,
    targetTierBonus: ['uncommon', 'rare'],
  },
  {
    id: 'bulk_squid_crate',
    name: 'Frozen Squid & Chum Block',
    price: 380,
    description: 'Heavy scented chum and whole squid for ocean gamefish and deep reef pelagics. +60% catch yield.',
    catchBonusMultiplier: 1.6,
    targetTierBonus: ['rare', 'epic'],
  },
];

// ==========================================
// VOYAGE DURATION & COST CALCULATIONS
// ==========================================

export function calculateVoyageDuration(
  boatDef: BoatDefinition,
  crewMembers: CrewMember[],
  installedUpgrades: FleetUpgrade[],
  destinationAreaId?: AreaId,
  baitId?: CommercialBaitId,
  targetFishId?: number | null
): number {
  let duration = boatDef.baseVoyageSec;

  // 1. Destination waters distance modifier
  if (destinationAreaId) {
    const areaDistanceMultipliers: Record<AreaId, number> = {
      pond: 0.85,
      river: 0.95,
      lake: 1.05,
      bayou: 1.20,
      ocean: 1.35,
      reef: 1.50,
    };
    duration *= areaDistanceMultipliers[destinationAreaId] || 1.0;
  }

  // 2. Bait and gear deployment weight modifier
  if (baitId) {
    const baitDurationMultipliers: Record<CommercialBaitId, number> = {
      bare_gear: 0.92,
      bulk_worm_crate: 1.05,
      bulk_minnow_crate: 1.15,
      bulk_squid_crate: 1.25,
    };
    duration *= baitDurationMultipliers[baitId] || 1.0;
  }

  // 3. Target species tracking & scouting modifier
  if (targetFishId) {
    duration *= 1.20;
  }

  // 4. Crew staffing ratio modifier
  const capacity = Math.max(1, boatDef.crewCapacity);
  const staffedRatio = Math.min(1.0, crewMembers.length / capacity);
  if (staffedRatio < 1.0) {
    // Understaffed vessels take longer to deploy and haul gear
    duration *= 1 + (1 - staffedRatio) * 0.25;
  }

  // 5. Sammy Cruz / speed specialty crew (-25%)
  if (crewMembers.some((c) => c.specialty === 'speed')) {
    duration *= 0.75;
  }

  // 6. Upgrades: Hydraulic winch (-20%)
  if (installedUpgrades.some((u) => u.id === 'hydraulic_winch')) {
    duration *= 0.8;
  }

  // 7. Upgrades: High-output turbo marine diesel (-25%)
  if (installedUpgrades.some((u) => u.id === 'turbo_marine_diesel')) {
    duration *= 0.75;
  }

  // 8. Crew morale modifier from worker bonuses
  const totalMorale = crewMembers.reduce((sum, c) => sum + (c.moraleLevel || 0), 0);
  if (totalMorale > 0) {
    const durationReduction = Math.min(0.25, totalMorale * 0.04);
    duration *= 1 - durationReduction;
  }

  return Math.max(20, Math.round(duration));
}

export function calculateExpeditionWageCost(crewMembers: CrewMember[]): number {
  return crewMembers.reduce((sum, c) => sum + c.wagePerVoyage, 0);
}

export function getRecommendedCommercialBait(species: FishSpecies): CommercialBaitId {
  if (
    species.areaId === 'ocean' ||
    species.areaId === 'reef' ||
    species.tier === 'epic' ||
    species.tier === 'legendary'
  ) {
    return 'bulk_squid_crate';
  }
  if (
    ['minnow', 'crankbait', 'jig', 'spinner', 'spoon', 'crawfish'].includes(species.bestLureId) ||
    species.tier === 'rare' ||
    species.tier === 'uncommon'
  ) {
    return 'bulk_minnow_crate';
  }
  return 'bulk_worm_crate';
}

// ==========================================
// DOCK JOB SEEKERS GENERATOR
// ==========================================

export function generateJobSeekers(alreadyHiredIds: string[] = []): CrewMember[] {
  // Sometimes harbor docks are quiet and nobody is looking for work (25% chance)
  if (Math.random() < 0.25) {
    return [];
  }

  const results: CrewMember[] = [];
  const unhiredVeterans = HIREABLE_CREW.filter((c) => !alreadyHiredIds.includes(c.id));

  // If veterans remain unhired, chance to introduce one on the dock
  if (unhiredVeterans.length > 0 && Math.random() < 0.55) {
    const picked = unhiredVeterans[Math.floor(Math.random() * unhiredVeterans.length)];
    results.push(picked);
  }

  const targetCount = 1 + Math.floor(Math.random() * 3); // 1-3 total applicants
  const firstNames = [
    'John', 'Dave', 'Mike', 'Tom', 'Chris', 'Bob', 'Jim', 'Dan',
    'Paul', 'Mark', 'Steve', 'Joe', 'Bill', 'Sam', 'Ben', 'Nick',
    'Pete', 'Ray', 'Greg', 'Jack', 'George', 'Frank', 'Harry', 'Scott',
    'Gary', 'Brian', 'Kevin', 'Eric',
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis',
    'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris',
    'Martin', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young',
    'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson',
  ];

  const specialties: {
    specialty: CrewSpecialty;
    title: string;
    desc: string;
    icon: string;
    minHire: number;
    maxHire: number;
    minWage: number;
    maxWage: number;
  }[] = [
    {
      specialty: 'apprentice',
      title: 'Deckhand Apprentice',
      desc: '+15% total catch volume',
      icon: '',
      minHire: 75,
      maxHire: 120,
      minWage: 4,
      maxWage: 7,
    },
    {
      specialty: 'bottom',
      title: 'Channel Fisherman',
      desc: '+35% yield in Bayou & Rivers',
      icon: '',
      minHire: 160,
      maxHire: 240,
      minWage: 8,
      maxWage: 14,
    },
    {
      specialty: 'gamefish',
      title: 'Gamefish Scout',
      desc: '+30% market value for trout, bass & pike',
      icon: '',
      minHire: 240,
      maxHire: 350,
      minWage: 12,
      maxWage: 20,
    },
    {
      specialty: 'speed',
      title: 'Helmsman',
      desc: '-25% expedition voyage duration',
      icon: '',
      minHire: 320,
      maxHire: 480,
      minWage: 15,
      maxWage: 24,
    },
    {
      specialty: 'pelagic',
      title: 'Offshore Navigator',
      desc: '+45% saltwater yield in Ocean & Reef',
      icon: '',
      minHire: 580,
      maxHire: 850,
      minWage: 25,
      maxWage: 38,
    },
    {
      specialty: 'volume',
      title: 'Net Tender',
      desc: '+50% bulk catch volume on Volume Hauls',
      icon: '',
      minHire: 750,
      maxHire: 1100,
      minWage: 32,
      maxWage: 48,
    },
    {
      specialty: 'reef',
      title: 'Reef Pilot',
      desc: 'Drastically boosts rare & epic reef catches',
      icon: '',
      minHire: 1200,
      maxHire: 1700,
      minWage: 50,
      maxWage: 75,
    },
    {
      specialty: 'broker',
      title: 'Wholesale Broker',
      desc: '+35% cash on fleet wholesale sales',
      icon: '',
      minHire: 1800,
      maxHire: 2600,
      minWage: 70,
      maxWage: 100,
    },
    {
      specialty: 'monger',
      title: 'Fishmonger',
      desc: 'Sashimi-grade +40% value and 2x trophy odds',
      icon: '',
      minHire: 2800,
      maxHire: 3800,
      minWage: 95,
      maxWage: 140,
    },
  ];

  while (results.length < targetCount) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const spec = specialties[Math.floor(Math.random() * specialties.length)];
    const hireCost = Math.round(spec.minHire + Math.random() * (spec.maxHire - spec.minHire));
    const wagePerVoyage = Math.round(spec.minWage + Math.random() * (spec.maxWage - spec.minWage));
    const id = `crew_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    results.push({
      id,
      name: `${fn} ${ln}`,
      hireCost,
      wagePerVoyage,
      specialty: spec.specialty,
      specialtyTitle: spec.title,
      specialtyDescription: spec.desc,
      avatarIcon: '',
      bio: `Experienced deckhand looking for steady berths on commercial vessels.`,
    });
  }

  return results;
}

// ==========================================
// EXPEDITION HAUL GENERATOR
// ==========================================

export interface ExpeditionHaulResult {
  fishes: CaughtFish[];
  totalValue: number;
  bonusNotes: string[];
}

export function calculateExpeditionHaul(
  boat: OwnedBoat,
  boatDef: BoatDefinition,
  crewMembers: CrewMember[],
  installedUpgrades: FleetUpgrade[],
  expedition: ActiveExpedition,
  activeMarketOrders: FishMarketOrder[] = [],
  progressFraction: number = 1.0,
  hasCommercialGuild: boolean = false
): ExpeditionHaulResult {
  const bonusNotes: string[] = [];
  const areaSpecies = FISH_COLLECTION.filter((f) => f.areaId === expedition.destinationAreaId);
  const pool = areaSpecies.length > 0 ? areaSpecies : FISH_COLLECTION;

  const baitDef =
    COMMERCIAL_BAITS.find((b) => b.id === expedition.baitId) || COMMERCIAL_BAITS[0];

  // Upgrades: Reinforced trawl net expands cargo capacity by +35%
  const hasTrawlNet = installedUpgrades.some((u) => u.id === 'reinforced_trawl_net');
  const effectiveCargoCapacity = hasTrawlNet
    ? Math.round(boatDef.cargoCapacity * 1.35)
    : boatDef.cargoCapacity;

  if (hasTrawlNet) bonusNotes.push('Reinforced Trawl Net +35% cargo space');

  // Base catch count is determined by boat cargo capacity and crew fullness
  const crewEfficiency = Math.min(1.0, crewMembers.length / Math.max(1, boatDef.crewCapacity));
  let targetCatchCount = Math.max(2, Math.round(effectiveCargoCapacity * (0.6 + crewEfficiency * 0.4)));

  // Specialty boosts:
  if (crewMembers.some((c) => c.specialty === 'apprentice')) {
    targetCatchCount = Math.round(targetCatchCount * 1.15);
    bonusNotes.push('Junior Briggs +15% catch volume');
  }

  if (expedition.searchFocus === 'volume' || expedition.searchFocus === 'quantity') {
    targetCatchCount = Math.round(targetCatchCount * 1.35);
    if (crewMembers.some((c) => c.specialty === 'volume')) {
      targetCatchCount = Math.round(targetCatchCount * 1.5);
      bonusNotes.push("Elena Nets +50% volume");
    }
  }

  // Bait catch multiplier
  if (baitDef.catchBonusMultiplier > 1.0) {
    targetCatchCount = Math.round(targetCatchCount * baitDef.catchBonusMultiplier);
    bonusNotes.push(`${baitDef.name} +${Math.round((baitDef.catchBonusMultiplier - 1) * 100)}% yield`);
  }

  // Upgrade: Auto chum turret (+30% catch yield)
  const hasAutoChum = installedUpgrades.some((u) => u.id === 'auto_chum_turret');
  if (hasAutoChum) {
    targetCatchCount = Math.round(targetCatchCount * 1.30);
    bonusNotes.push('Auto Chumming Turret +30% school attraction');
  }

  // Upgrade: Automated Continuous Longline Drum (+60% catch yield)
  const hasLonglineDrum = installedUpgrades.some((u) => u.id === 'longline_drum');
  if (hasLonglineDrum) {
    targetCatchCount = Math.round(targetCatchCount * 1.60);
    bonusNotes.push('Longline Drum +60% catch yield');
  }

  // Crew morale bonus from worker bonuses (up to +50% yield)
  const totalMorale = crewMembers.reduce((sum, c) => sum + (c.moraleLevel || 0), 0);
  if (totalMorale > 0) {
    const moraleYieldBonus = Math.min(0.50, totalMorale * 0.06);
    targetCatchCount = Math.round(targetCatchCount * (1 + moraleYieldBonus));
    bonusNotes.push(`Crew Morale +${Math.round(moraleYieldBonus * 100)}% yield from worker bonuses`);
  }

  // Target species tracking configuration
  const targetFishSpecies = expedition.targetFishId
    ? FISH_COLLECTION.find((f) => f.id === expedition.targetFishId)
    : null;

  if (targetFishSpecies) {
    const favoredBaitId = getRecommendedCommercialBait(targetFishSpecies);
    const usingFavoredBait = expedition.baitId === favoredBaitId;
    const favoredBaitName = COMMERCIAL_BAITS.find((b) => b.id === favoredBaitId)?.name || 'Target Bait';
    bonusNotes.push(
      usingFavoredBait
        ? `Target: ${targetFishSpecies.name} (Right bait loaded - high targeting yield)`
        : `Target: ${targetFishSpecies.name} (Other bait used - reduced yield; favor ${favoredBaitName})`
    );
  }

  // Early recall handling (calling boats in early yields proportional catch)
  if (progressFraction < 0.99) {
    const transitFraction = 0.20; // First 20% of voyage is steaming out & deploying gear
    if (progressFraction < transitFraction) {
      targetCatchCount = 0;
      bonusNotes.push(
        `Recalled in transit (${Math.round(progressFraction * 100)}% progress) - gear not yet deployed`
      );
    } else {
      const activeFishingFraction = (progressFraction - transitFraction) / (1.0 - transitFraction);
      const hasSatelliteRadio = installedUpgrades.some((u) => u.id === 'satellite_radio');
      const retentionMult = hasSatelliteRadio ? 1.15 : 1.0;
      const effectiveFraction = Math.min(1.0, activeFishingFraction * retentionMult);
      targetCatchCount = Math.round(targetCatchCount * effectiveFraction);
      bonusNotes.push(
        hasSatelliteRadio
          ? `Early Recall at ${Math.round(progressFraction * 100)}% with Satellite Radio Bonus`
          : `Early Recall at ${Math.round(progressFraction * 100)}% completion`
      );
    }
  }

  // Clamp to effective cargo capacity
  const finalCatchCount = Math.min(effectiveCargoCapacity, Math.max(0, targetCatchCount));

  if (finalCatchCount === 0) {
    return {
      fishes: [],
      totalValue: 0,
      bonusNotes,
    };
  }

  // Determine specialties and upgrades present
  const hasBottomSpecialist = crewMembers.some((c) => c.specialty === 'bottom');
  const hasGamefishSpecialist = crewMembers.some((c) => c.specialty === 'gamefish');
  const hasPelagicSpecialist = crewMembers.some((c) => c.specialty === 'pelagic');
  const hasReefSpecialist = crewMembers.some((c) => c.specialty === 'reef');
  const hasBroker = crewMembers.some((c) => c.specialty === 'broker');
  const hasMonger = crewMembers.some((c) => c.specialty === 'monger');

  const hasSonarFinder = installedUpgrades.some((u) => u.id === 'fish_finder');
  const hasChillerHold = installedUpgrades.some((u) => u.id === 'refrigerated_hold');
  const hasProcessingDeck = installedUpgrades.some((u) => u.id === 'processing_deck');
  const hasCannery = installedUpgrades.some((u) => u.id === 'steam_cannery_line');
  const hasCryoFreezer = installedUpgrades.some((u) => u.id === 'cryo_flash_freezer');
  const hasSpotterDrone = installedUpgrades.some((u) => u.id === 'spotter_drone');
  const hasAutoSorter = installedUpgrades.some((u) => u.id === 'automatic_sorter');
  const hasExportSyndicate = installedUpgrades.some((u) => u.id === 'global_export_syndicate');

  if (hasSonarFinder) bonusNotes.push('Sonar Array +35% rare attraction');
  if (hasChillerHold) bonusNotes.push('Chilled Hold +20% wholesale value');
  if (hasProcessingDeck) bonusNotes.push('Processing Deck +25% value');
  if (hasCannery) bonusNotes.push('Steam Cannery +40% forage value');
  if (hasCryoFreezer) bonusNotes.push('Cryogenic Freezer +30% value and flash-frozen quality');
  if (hasSpotterDrone) bonusNotes.push('Spotter Drone +45% pelagic attraction');
  if (hasAutoSorter) bonusNotes.push('Weight Sorter culls light forage fish');
  if (hasExportSyndicate) bonusNotes.push('Export Syndicate +50% global export payout');
  if (hasBroker) bonusNotes.push('Marcus Sterling +35% wholesale price');
  if (hasMonger) bonusNotes.push('Yuki Tanaka Sashimi grade +40% value and 2x trophy odds');

  const catches: CaughtFish[] = [];

  for (let i = 0; i < finalCatchCount; i++) {
    const seed = Math.abs(Math.floor(expedition.startedAt + i * 79 + i * 23));

    // Determine candidate species
    let candidatePool = [...pool];

    // Search focus filtering:
    if (expedition.searchFocus === 'orders' && activeMarketOrders.length > 0) {
      const orderFishIds = activeMarketOrders.map((o) => o.fishId);
      const orderMatches = pool.filter((f) => orderFishIds.includes(f.id));
      if (orderMatches.length > 0 && (seed % 100) < 70) {
        candidatePool = orderMatches;
      }
    }

    // Specialty weighting
    if (hasBottomSpecialist && (expedition.destinationAreaId === 'bayou' || expedition.destinationAreaId === 'river')) {
      const bottomSpecies = candidatePool.filter(
        (f) => f.name.includes('Catfish') || f.name.includes('Bullhead') || f.name.includes('Drum') || f.name.includes('Carp')
      );
      if (bottomSpecies.length > 0 && (seed % 100) < 40) {
        candidatePool = bottomSpecies;
      }
    }

    if (hasPelagicSpecialist && (expedition.destinationAreaId === 'ocean' || expedition.destinationAreaId === 'reef')) {
      const pelagics = candidatePool.filter(
        (f) => f.name.includes('Tuna') || f.name.includes('Mahi') || f.name.includes('Wahoo') || f.name.includes('Trevally') || f.name.includes('Mackerel')
      );
      if (pelagics.length > 0 && (seed % 100) < 45) {
        candidatePool = pelagics;
      }
    }

    // Tier probability roll (Rebalanced: fleets catch predominantly common/uncommon commercial hauls, with significantly reduced rare/epic and exceedingly rare legendary odds):
    let rarityRoll = seed % 1000;
    if (expedition.searchFocus === 'trophy' || expedition.searchFocus === 'quality') rarityRoll += 50;
    if (hasSonarFinder) rarityRoll += 40;
    if (hasSpotterDrone) rarityRoll += 45;
    if (hasReefSpecialist && expedition.destinationAreaId === 'reef') rarityRoll += 45;

    let targetTier: RarityTier = 'common';
    if (rarityRoll < 760) {
      targetTier = 'common';
    } else if (rarityRoll < 935) {
      targetTier = 'uncommon';
    } else if (rarityRoll < 985) {
      targetTier = 'rare';
    } else if (rarityRoll < 998) {
      targetTier = 'epic';
    } else {
      // Exceedingly rare commercial encounter with a legendary titan
      targetTier = 'legendary';
    }

    // Target species roll:
    // With favored (right) bait: guarantees a baseline of target fish (at least 2-4 specimens) + roll on rest.
    // For legendary targets: fleets have an especially low catch rate (no bulk haul guarantee).
    let species: FishSpecies;
    const isFavoredBait = targetFishSpecies && expedition.baitId === getRecommendedCommercialBait(targetFishSpecies);

    let isTargetRoll = false;
    if (targetFishSpecies) {
      const isLegendaryTarget = targetFishSpecies.tier === 'legendary';
      const isEpicTarget = targetFishSpecies.tier === 'epic';

      if (isFavoredBait) {
        if (isLegendaryTarget) {
          // Fleets have an especially low chance to catch legendary titans: no free guarantee, ~4% roll
          isTargetRoll = (seed % 100) < 4;
        } else if (isEpicTarget) {
          const minGuaranteed = Math.min(1, finalCatchCount);
          if (i < minGuaranteed) {
            isTargetRoll = true;
          } else {
            isTargetRoll = (seed % 100) < 16;
          }
        } else {
          // Common, uncommon, rare species: standard baseline guarantee
          const minGuaranteed = Math.max(2, Math.min(finalCatchCount, Math.floor(finalCatchCount * 0.35)));
          if (i < minGuaranteed) {
            isTargetRoll = true;
          } else {
            isTargetRoll = (seed % 100) < 45;
          }
        }
      } else {
        // Other bait: heavily reduced rate
        if (isLegendaryTarget) {
          isTargetRoll = (seed % 1000) < 5; // 0.5%
        } else if (isEpicTarget) {
          isTargetRoll = (seed % 100) < 6;
        } else {
          const minGuaranteed = finalCatchCount >= 4 ? 1 : 0;
          if (i < minGuaranteed) {
            isTargetRoll = true;
          } else {
            isTargetRoll = (seed % 100) < 18;
          }
        }
      }
    }

    if (isTargetRoll && targetFishSpecies) {
      species = targetFishSpecies;
    } else {
      const tierMatches = candidatePool.filter((f) => f.tier === targetTier);
      const chosenList = tierMatches.length > 0 ? tierMatches : candidatePool;
      species = chosenList[seed % chosenList.length];
    }

    // Size and weight distribution: small runts, standard adults, and monster catches
    // Monster chance: base ~8%, boosted by quality focus (20%), monger (30%), or cryo freezer
    let monsterChance =
      expedition.searchFocus === 'trophy' || expedition.searchFocus === 'quality'
        ? 0.20
        : 0.08;
    if (hasMonger) monsterChance += 0.12;
    if (hasCryoFreezer) monsterChance += 0.05;
    if (crewMembers.some((c) => (c.moraleLevel || 0) >= 4)) {
      monsterChance *= 1.5;
    }

    // Small juvenile / runt chance: ~15%
    // Auto-sorter upgrade filters out lightweight forage/runts
    const smallRuntChance = hasAutoSorter ? 0.0 : 0.15;

    const sizeRoll = ((seed * 13 + i * 37) % 1000) / 1000;
    let weight: number;
    let isTrophy = false;

    if (sizeRoll < monsterChance) {
      // Monster / Giant catch!
      isTrophy = true;
      const monsterBase = species.trophyWeight;
      const monsterSpread = ((seed + i * 17) % 100) / 100;
      const monsterMultiplier = 1.0 + monsterSpread * 0.35; // 1.0x to 1.35x trophy weight
      weight = Number((monsterBase * monsterMultiplier).toFixed(2));
    } else if (sizeRoll < monsterChance + smallRuntChance) {
      // Small juvenile / runt catch!
      const runtSpread = ((seed + i * 29) % 100) / 100;
      const runtMin = Math.max(0.1, Number((species.minWeight * 0.65).toFixed(2)));
      const runtMax = Number((species.minWeight * 0.98).toFixed(2));
      weight = Number((runtMin + runtSpread * Math.max(0.05, runtMax - runtMin)).toFixed(2));
    } else {
      // Standard varied adult: full natural spread from minWeight to maxWeight
      const adultSpread = ((seed + i * 43) % 100) / 100;
      const factor = Math.pow(adultSpread, 1.15);
      weight = Number((species.minWeight + (species.maxWeight - species.minWeight) * factor).toFixed(2));
    }

    const weightRatio = Math.max(0.6, weight / species.minWeight);
    const trophyBonus = isTrophy ? 2.5 : 1.0;

    // Base commercial payout value
    let val = Math.round(species.basePrice * 1.30 * Math.pow(weightRatio, 0.52) * trophyBonus);

    // Maya Lin gamefish bonus (+30%)
    if (hasGamefishSpecialist && (species.name.includes('Trout') || species.name.includes('Bass') || species.name.includes('Walleye') || species.name.includes('Pike'))) {
      val = Math.round(val * 1.3);
    }

    // Chiller hold bonus (+20%)
    if (hasChillerHold) {
      val = Math.round(val * 1.2);
    }

    // Processing deck bonus (+25%)
    if (hasProcessingDeck) {
      val = Math.round(val * 1.25);
    }

    // Cannery unit (+40% on common and uncommon)
    if (hasCannery && (species.tier === 'common' || species.tier === 'uncommon')) {
      val = Math.round(val * 1.4);
    }

    // Cryo freezer bonus (+30%)
    if (hasCryoFreezer) {
      val = Math.round(val * 1.3);
    }

    // Global export syndicate bonus (+50%)
    if (hasExportSyndicate) {
      val = Math.round(val * 1.5);
    }

    // Marcus Sterling broker bonus (+35%)
    if (hasBroker) {
      val = Math.round(val * 1.35);
    }

    // Yuki Tanaka master monger bonus (+40%)
    if (hasMonger) {
      val = Math.round(val * 1.4);
    }

    const caught: CaughtFish = {
      catchId: `commercial_${boat.instanceId}_${expedition.startedAt}_${i}_${species.id}`,
      fishId: species.id,
      name: species.name,
      tier: species.tier,
      weight,
      isTrophy,
      value: Math.max(1, val),
      caughtAt: expedition.startedAt + Math.floor(i * 1200),
      areaId: expedition.destinationAreaId,
    };

    catches.push(caught);
  }

  // Automatic Weight Sorter: Culls the lightest 25% of catch to ensure dense high-weight cargo
  let finalCatches = catches;
  if (hasAutoSorter && catches.length > 4) {
    const sorted = [...catches].sort((a, b) => b.weight - a.weight);
    finalCatches = sorted.slice(0, Math.max(3, Math.floor(catches.length * 0.8)));
  }

  let totalValue = finalCatches.reduce((sum, f) => sum + f.value, 0);

  if (hasCommercialGuild && Math.random() < 0.12) {
    totalValue += 100;
    bonusNotes.push('Benthic Union Salvage: Recovered maritime salvage crate (+$100)');
  }

  return {
    fishes: finalCatches,
    totalValue,
    bonusNotes,
  };
}

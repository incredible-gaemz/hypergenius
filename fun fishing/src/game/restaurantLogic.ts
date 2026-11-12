/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FishSpecies, FISH_COLLECTION, RarityTier } from './fishingLogic';

export interface RestaurantStaff {
  id: string;
  name: string;
  role: 'prep' | 'chef' | 'server' | 'host';
  roleTitle: string;
  wagePerService: number;
  perkDescription: string;
  automationTitle: string;
  automationDescription: string;
  bio: string;
}

export interface RestaurantExpansion {
  id: string;
  name: string;
  cost: number;
  effect: string;
  description: string;
}

export interface RestaurantDish {
  id: string;
  name: string;
  description: string;
  requiredSpeciesKeywords: string[];
  basePrice: number;
}

export interface RestaurantState {
  name: string;
  unlocked: boolean;
  pantry: Record<number, number>; // fishId -> quantity in kitchen pantry
  hiredStaffIds: string[];
  unlockedExpansionIds: string[];
  totalMealsServed: number;
  totalEarnings: number;
  reputation: number;
  autoDinnerRush?: boolean;
  autoRestockFromBox?: boolean;
  autoProcureWholesale?: boolean;
  activePrepStyleId?: string;
}

export const RESTAURANT_DISHES: RestaurantDish[] = [
  {
    id: 'fish_and_chips',
    name: 'Dockside Fish & Chips',
    description: 'Golden beer-battered panfish fillets served with malt vinegar fries.',
    requiredSpeciesKeywords: ['bluegill', 'perch', 'sunfish', 'crappie', 'minnow'],
    basePrice: 28,
  },
  {
    id: 'catfish_poboy',
    name: 'Smoked Catfish Po Boy',
    description: 'Crispy cornmeal-crusted catfish on a toasted baguette with remoulade.',
    requiredSpeciesKeywords: ['catfish', 'bullhead', 'carp'],
    basePrice: 46,
  },
  {
    id: 'trout_amandine',
    name: 'Pan-Seared Trout Amandine',
    description: 'Brown butter trout garnished with toasted almonds and lemon herb drizzle.',
    requiredSpeciesKeywords: ['trout', 'char', 'grayling'],
    basePrice: 75,
  },
  {
    id: 'blackened_bass',
    name: 'Blackened Harbor Bass',
    description: 'Cast-iron seared bass steak rubbed in smoky bayou spices.',
    requiredSpeciesKeywords: ['bass', 'walleye', 'pike'],
    basePrice: 98,
  },
  {
    id: 'salmon_platter',
    name: 'Cedar Plank Salmon Platter',
    description: 'Slow-smoked fatty salmon finished with maple glaze and charred greens.',
    requiredSpeciesKeywords: ['salmon', 'steelhead', 'cod', 'halibut'],
    basePrice: 150,
  },
  {
    id: 'sashimi_tower',
    name: 'Harbor Master Sashimi Tower',
    description: 'Thinly sliced ocean cuts with wasabi, pickled ginger, and citrus ponzu.',
    requiredSpeciesKeywords: ['tuna', 'snapper', 'grouper', 'mahi', 'swordfish', 'barracuda'],
    basePrice: 240,
  },
];

export const RESTAURANT_EXPANSIONS: RestaurantExpansion[] = [
  {
    id: 'extra_tables',
    name: 'Dining Room Expansion',
    cost: 350,
    effect: '+4 guest tables, seating +3 diners per service',
    description: 'Oak tables and booths increase customer seating capacity.',
  },
  {
    id: 'char_grill',
    name: 'Commercial Char-Grill',
    cost: 650,
    effect: '+20% dish sale value & cooks 2 orders simultaneously',
    description: 'High-temperature cast iron grates impart smoky dockside flavor.',
  },
  {
    id: 'waterfront_patio',
    name: 'Harbor Waterfront Patio',
    cost: 1100,
    effect: '+35% diner tip earnings & attracts wealthy tourists',
    description: 'Outdoor seating overlooking the boat slips and lighthouse.',
  },
  {
    id: 'raw_bar_display',
    name: 'Chilled Raw Bar & Oyster Bar',
    cost: 1800,
    effect: '+50% payout on ocean/reef pelagic dishes',
    description: 'Crushed ice showcase for fresh daily sashimi and shellfish.',
  },
  {
    id: 'cider_taproom',
    name: 'Craft Cider & Ale Taproom',
    cost: 2800,
    effect: '+30% bonus drink revenue on all served tables',
    description: 'Locally brewed ales pair perfectly with pan-fried catches.',
  },
];

export const RESTAURANT_STAFF_CANDIDATES: RestaurantStaff[] = [
  {
    id: 'staff_prep_leo',
    name: 'Leo Miller',
    role: 'prep',
    roleTitle: 'Prep Cook',
    wagePerService: 15,
    perkDescription: '20% chance to not consume fish when cooking, yielding extra portions',
    automationTitle: 'Auto-Restock Kitchen',
    automationDescription: 'Automatically transfers caught fish from Box to pantry when kitchen stock runs low.',
    bio: 'Fast with a fillet knife and careful with kitchen yields.',
  },
  {
    id: 'staff_chef_rosa',
    name: 'Rosa Perez',
    role: 'chef',
    roleTitle: 'Head Line Chef',
    wagePerService: 35,
    perkDescription: '+25% dish sale value from expert culinary presentation',
    automationTitle: 'Auto-Dinner Rush',
    automationDescription: 'Automatically prepares dishes and serves dining tables every 25s when pantry has fish.',
    bio: 'Former coastal resort sous-chef with deep seafood recipe knowledge.',
  },
  {
    id: 'staff_server_milo',
    name: 'Milo Vance',
    role: 'server',
    roleTitle: 'Lead Floor Server',
    wagePerService: 20,
    perkDescription: '+40% customer tips on every meal served',
    automationTitle: 'Auto Table Turnover',
    automationDescription: 'Expedites dining room table turnover and sweeps extra tips directly into the register.',
    bio: 'Warm dockside charm keeps tables happy and glasses full.',
  },
  {
    id: 'staff_host_genevieve',
    name: 'Genevieve Dupond',
    role: 'host',
    roleTitle: 'Maitre D Host',
    wagePerService: 30,
    perkDescription: 'Attracts high-tipping food critics and private dining parties',
    automationTitle: 'Auto-Procure Wholesale',
    automationDescription: 'Automatically orders fresh dock catches at 15% discount if pantry runs empty.',
    bio: 'Connects with travelers arriving off the morning passenger ferries.',
  },
];

export interface MarketWholesaleFish {
  speciesId: number;
  name: string;
  tier: RarityTier;
  pricePerFish: number;
}

export function getDailyWholesaleMarketFish(): MarketWholesaleFish[] {
  return [
    { speciesId: 1, name: 'Bluegill', tier: 'common', pricePerFish: 10 },
    { speciesId: 2, name: 'Minnow', tier: 'common', pricePerFish: 4 },
    { speciesId: 54, name: 'Yellow Perch', tier: 'common', pricePerFish: 16 },
    { speciesId: 58, name: 'Channel Catfish', tier: 'uncommon', pricePerFish: 32 },
    { speciesId: 51, name: 'Rainbow Trout', tier: 'uncommon', pricePerFish: 48 },
    { speciesId: 4, name: 'Pond Largemouth Bass', tier: 'uncommon', pricePerFish: 62 },
    { speciesId: 30, name: 'Coastal Striped Bass', tier: 'rare', pricePerFish: 95 },
    { speciesId: 32, name: 'Atlantic Bluefin Tuna', tier: 'epic', pricePerFish: 190 },
  ];
}

export function findMatchingDishForFish(species: FishSpecies): RestaurantDish {
  const nameLower = species.name.toLowerCase();
  for (const dish of RESTAURANT_DISHES) {
    if (dish.requiredSpeciesKeywords.some((k) => nameLower.includes(k))) {
      return dish;
    }
  }
  return RESTAURANT_DISHES[0];
}

export function calculateDishSaleValue(
  dish: RestaurantDish,
  hiredStaff: RestaurantStaff[],
  unlockedExpansions: RestaurantExpansion[]
): number {
  let val = dish.basePrice;

  // Rosa chef bonus (+25%)
  if (hiredStaff.some((s) => s.id === 'staff_chef_rosa')) {
    val = Math.round(val * 1.25);
  }

  // Char-grill expansion (+20%)
  if (unlockedExpansions.some((e) => e.id === 'char_grill')) {
    val = Math.round(val * 1.20);
  }

  // Raw bar display (+50% for sashimi)
  if (dish.id === 'sashimi_tower' && unlockedExpansions.some((e) => e.id === 'raw_bar_display')) {
    val = Math.round(val * 1.50);
  }

  // Cider taproom (+30% drink add-on)
  if (unlockedExpansions.some((e) => e.id === 'cider_taproom')) {
    val = Math.round(val * 1.30);
  }

  return val;
}

export function calculateDinerTip(
  baseValue: number,
  hiredStaff: RestaurantStaff[],
  unlockedExpansions: RestaurantExpansion[]
): number {
  let tipPercent = 0.15; // standard 15% tip

  if (hiredStaff.some((s) => s.id === 'staff_server_milo')) {
    tipPercent += 0.20;
  }

  if (unlockedExpansions.some((e) => e.id === 'waterfront_patio')) {
    tipPercent += 0.18;
  }

  if (hiredStaff.some((s) => s.id === 'staff_host_genevieve')) {
    tipPercent += 0.12;
  }

  return Math.round(baseValue * tipPercent);
}

export interface PrepStyle {
  id: string;
  name: string;
  tagline: string;
  description: string;
  valueMultiplier: number;
  tipMultiplier: number;
  bonusTableCapacity: number;
}

export const PREP_STYLES: PrepStyle[] = [
  {
    id: 'pan_fry',
    name: 'Cast-Iron Skillet Fry',
    tagline: 'Classic dockside pan-sear with butter and sea salt',
    description: 'Crisped in foaming butter with cracked pepper and lemon wedges.',
    valueMultiplier: 1.0,
    tipMultiplier: 1.0,
    bonusTableCapacity: 0,
  },
  {
    id: 'cedar_smoke',
    name: 'Cedar Plank Smoke',
    tagline: '+25% meal value from slow aromatic wood smoke',
    description: 'Roasts fillets over aromatic cedar planks to seal in rich natural oils.',
    valueMultiplier: 1.25,
    tipMultiplier: 1.10,
    bonusTableCapacity: 0,
  },
  {
    id: 'crispy_batter',
    name: 'Crispy Ale Batter',
    tagline: '+3 guest tables with fast-turn pub frying',
    description: 'Golden beer-battered crunch served fast to seat more dinner tables.',
    valueMultiplier: 1.05,
    tipMultiplier: 1.0,
    bonusTableCapacity: 3,
  },
  {
    id: 'herb_butter',
    name: 'Brown Herb Butter Glaze',
    tagline: '+40% diner tips from gourmet culinary finish',
    description: 'Basted tableside with foaming garlic thyme butter and sea salt.',
    valueMultiplier: 1.15,
    tipMultiplier: 1.40,
    bonusTableCapacity: 1,
  },
];

export interface DinnerTicket {
  tableNumber: number;
  dishName: string;
  fishName: string;
  price: number;
  tip: number;
  prepStyleName: string;
  dinerComment: string;
}

export interface DinnerServiceResult {
  mealsServedCount: number;
  revenue: number;
  tips: number;
  totalPayout: number;
  wagesPaid: number;
  netProfit: number;
  dishesPrepared: { dishName: string; count: number; earnings: number }[];
  pantryConsumed: Record<number, number>;
  tickets: DinnerTicket[];
  prepStyleName: string;
  serviceRating: string;
}

export function runDinnerService(
  pantry: Record<number, number>,
  hiredStaff: RestaurantStaff[],
  unlockedExpansions: RestaurantExpansion[],
  prepStyleId = 'pan_fry',
  allowedDishIds?: string[]
): DinnerServiceResult {
  const prep = PREP_STYLES.find((p) => p.id === prepStyleId) || PREP_STYLES[0];
  const hasExtraTables = unlockedExpansions.some((e) => e.id === 'extra_tables');
  const baseTables = hasExtraTables ? 8 : 4;
  const maxMealsPerService = baseTables + prep.bonusTableCapacity;
  const hasLeoPrep = hiredStaff.some((s) => s.id === 'staff_prep_leo');

  const availableFishIds = Object.keys(pantry)
    .map(Number)
    .filter((id) => (pantry[id] || 0) > 0);

  const dishesMap: Record<string, { count: number; earnings: number }> = {};
  const consumed: Record<number, number> = {};
  const tickets: DinnerTicket[] = [];
  let totalRevenue = 0;
  let totalTips = 0;
  let mealsCount = 0;

  const commentsPool = [
    'Crisped to perfection with fresh harbor seasoning.',
    'Flaky, tender, and seasoned with fragrant herbs.',
    'Rich flavor! Best seafood meal in the port.',
    'Hot off the griddle and delicious.',
    'Flawless texture with a wonderful sear.',
    'Generous portions and lovely presentation.',
  ];

  for (const fishId of availableFishIds) {
    if (mealsCount >= maxMealsPerService) break;
    const species = FISH_COLLECTION.find((f) => f.id === fishId);
    if (!species) continue;

    const dish = findMatchingDishForFish(species);
    if (allowedDishIds && allowedDishIds.length > 0 && !allowedDishIds.includes(dish.id)) {
      continue;
    }

    const availableCount = pantry[fishId] || 0;
    const take = Math.min(availableCount, maxMealsPerService - mealsCount);

    for (let i = 0; i < take; i++) {
      let dishVal = calculateDishSaleValue(dish, hiredStaff, unlockedExpansions);
      if (prep.valueMultiplier !== 1.0) {
        dishVal = Math.round(dishVal * prep.valueMultiplier);
      }

      let tipVal = calculateDinerTip(dishVal, hiredStaff, unlockedExpansions);
      if (prep.tipMultiplier !== 1.0) {
        tipVal = Math.round(tipVal * prep.tipMultiplier);
      }

      totalRevenue += dishVal;
      totalTips += tipVal;
      mealsCount++;

      const comment = commentsPool[(mealsCount + fishId) % commentsPool.length];
      tickets.push({
        tableNumber: mealsCount,
        dishName: dish.name,
        fishName: species.name,
        price: dishVal,
        tip: tipVal,
        prepStyleName: prep.name,
        dinerComment: comment,
      });

      if (!dishesMap[dish.name]) {
        dishesMap[dish.name] = { count: 0, earnings: 0 };
      }
      dishesMap[dish.name].count += 1;
      dishesMap[dish.name].earnings += dishVal + tipVal;

      // Leo prep cook 20% chance to preserve ingredient
      const preserved = hasLeoPrep && Math.random() < 0.20;
      if (!preserved) {
        consumed[fishId] = (consumed[fishId] || 0) + 1;
      }
    }
  }

  const wagesPaid = hiredStaff.reduce((sum, s) => sum + s.wagePerService, 0);
  const totalPayout = totalRevenue + totalTips;
  const netProfit = Math.max(0, totalPayout - wagesPaid);

  const dishesPrepared = Object.entries(dishesMap).map(([dishName, data]) => ({
    dishName,
    count: data.count,
    earnings: data.earnings,
  }));

  const rating =
    totalTips > totalRevenue * 0.35
      ? 'Outstanding Service · 5 Stars'
      : totalTips > totalRevenue * 0.20
      ? 'Very Good Service · 4 Stars'
      : 'Satisfied Diners · 3 Stars';

  return {
    mealsServedCount: mealsCount,
    revenue: totalRevenue,
    tips: totalTips,
    totalPayout,
    wagesPaid,
    netProfit,
    dishesPrepared,
    pantryConsumed: consumed,
    tickets,
    prepStyleName: prep.name,
    serviceRating: rating,
  };
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaId, WeatherId, FishSpecies, FISH_COLLECTION } from './fishingLogic';

export interface WeatherSightingRumor {
  id: string;
  speciesId: number;
  areaId: AreaId;
  requiredWeather: WeatherId;
  headline: string;
  source: string; // e.g., 'Dockside Gazette', 'Coast Guard VHF Ch. 16'
  rumorText: string;
  lore: string;
  biteBonusMultiplier: number; // e.g. 8x higher chance for legendary strike
}

export const WEATHER_SIGHTING_RUMORS: WeatherSightingRumor[] = [
  {
    id: 'rumor_pond_koi',
    speciesId: 20, // Golden Koi
    areaId: 'pond',
    requiredWeather: 'clear',
    headline: 'Golden Koi Sighted in Pond Shallows',
    source: 'Willow Pond Anglers',
    rumorText: 'Bank anglers reported seeing the Golden Koi near the lily pads during clear skies.',
    lore: 'The Golden Koi tends to feed near the surface when sunlight hits the weedlines.',
    biteBonusMultiplier: 9.0,
  },
  {
    id: 'rumor_river_sturgeon',
    speciesId: 38, // Great White Sturgeon
    areaId: 'river',
    requiredWeather: 'rain',
    headline: 'Great White Sturgeon Active in River Channel',
    source: 'River Guide Post',
    rumorText: 'Guides reported the Great White Sturgeon moving through deep river trenches during rain.',
    lore: 'Rain runoff increases water flow and pulls sturgeon out of deep bedrock hollows.',
    biteBonusMultiplier: 8.5,
  },
  {
    id: 'rumor_lake_ancient_sturgeon',
    speciesId: 56, // Ancient Lake Sturgeon
    areaId: 'lake',
    requiredWeather: 'fog',
    headline: 'Ancient Lake Sturgeon Spotted Along Lake Drop-Off',
    source: 'Lake Marina Log',
    rumorText: 'Boaters noted a large silhouette moving along deep drop-offs under heavy fog.',
    lore: 'Heavy fog cuts down surface light, bringing ancient bottom sturgeon into midwater shelves.',
    biteBonusMultiplier: 8.0,
  },
  {
    id: 'rumor_bayou_albino_gar',
    speciesId: 69, // Albino River Gar
    areaId: 'bayou',
    requiredWeather: 'fog',
    headline: 'Albino River Gar Seen Near Cypress Knees',
    source: 'Bayou Outpost',
    rumorText: 'Locals spotted the rare Albino River Gar feeding around submerged cypress roots in foggy weather.',
    lore: 'Fog provides cover for the albino gar to hunt along shallow marsh edges.',
    biteBonusMultiplier: 9.0,
  },
  {
    id: 'rumor_ocean_bluefin',
    speciesId: 89, // Giant Bluefin Tuna
    areaId: 'ocean',
    requiredWeather: 'rain',
    headline: 'Giant Bluefin Tuna Feeding Off Outer Drop-Off',
    source: 'Harbor Fish Pier',
    rumorText: 'Offshore skippers reported Giant Bluefin Tuna chasing baitfish schools during ocean rain.',
    lore: 'Rain squalls pack surface bait schools together, triggering tuna feeding runs.',
    biteBonusMultiplier: 7.5,
  },
  {
    id: 'rumor_reef_marlin',
    speciesId: 109, // Grand Sovereign Marlin
    areaId: 'reef',
    requiredWeather: 'windy',
    headline: 'Grand Sovereign Marlin Sighted Past Outer Reef',
    source: 'Reef Patrol VHF',
    rumorText: 'Trolling skippers reported a massive Blue Marlin leaping beyond the reef wall in windy chop.',
    lore: 'Wind currents push nutrient plumes against the barrier reef, attracting pelagic billfish.',
    biteBonusMultiplier: 8.0,
  },
  {
    id: 'rumor_trench_greenland',
    speciesId: 145, // Greenland Shark
    areaId: 'trench',
    requiredWeather: 'fog',
    headline: 'Greenland Shark Detected Along Upper Trench Shelf',
    source: 'Benthic Acoustic Buoy',
    rumorText: 'Sonar logs picked up a massive Greenland Shark rising toward the upper trench rim in heavy fog.',
    lore: 'Cold-water upwellings during surface fog encourage deep trench sharks to move upward.',
    biteBonusMultiplier: 8.5,
  },
];

/**
 * Returns the current active rumor based on a time-seeded rotation.
 */
export function getCurrentWeatherRumor(timestamp: number = Date.now()): WeatherSightingRumor {
  // Changes every 15 minutes (900,000ms) or cycles stably
  const cycleIndex = Math.floor(timestamp / (15 * 60 * 1000)) % WEATHER_SIGHTING_RUMORS.length;
  return WEATHER_SIGHTING_RUMORS[cycleIndex];
}

/**
 * Checks if the player is currently in the rumored area under the matching weather condition.
 */
export function isWeatherRumorActive(
  rumor: WeatherSightingRumor,
  currentAreaId: AreaId,
  currentWeatherId: WeatherId
): boolean {
  return rumor.areaId === currentAreaId && rumor.requiredWeather === currentWeatherId;
}

/**
 * Returns the target legendary fish species for a given rumor.
 */
export function getRumorSpecies(rumor: WeatherSightingRumor): FishSpecies {
  return FISH_COLLECTION.find((f) => f.id === rumor.speciesId) || FISH_COLLECTION[0];
}

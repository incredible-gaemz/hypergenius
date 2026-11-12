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
    headline: 'Gilded Scales Seen Glinting in Willow Pond',
    source: 'The Willow Creek Gazette',
    rumorText: 'Local anglers report fleeting sightings of the legendary Golden Koi basking in sun-dappled shallows during Clear & Sunny skies.',
    lore: 'Old timers say the Golden Koi only rises to feed when direct sunlight illuminates the lily pad hollows.',
    biteBonusMultiplier: 9.0,
  },
  {
    id: 'rumor_river_sturgeon',
    speciesId: 38, // Great White Sturgeon
    areaId: 'river',
    requiredWeather: 'rain',
    headline: 'River Monster Stirred by Mountain Downpours',
    source: 'Timberline Radio Dispatch',
    rumorText: 'Swift runoff and churning silt have pushed the ancient Great White Sturgeon into deep river trench currents during Rain.',
    lore: 'Heavy rainfall oxygenates river bedrock channels, drawing prehistoric leviathans out of their gravel caves.',
    biteBonusMultiplier: 8.5,
  },
  {
    id: 'rumor_lake_ancient_sturgeon',
    speciesId: 56, // Ancient Lake Sturgeon
    areaId: 'lake',
    requiredWeather: 'fog',
    headline: 'Ghostly Silhouette Drifting Through Whispering Lake Mist',
    source: 'Lakeside Herald Special Bulletin',
    rumorText: 'Boaters describe a submarine-sized shadow cruising near sunken drop-offs under heavy Fog.',
    lore: 'Thick lake fog keeps surface predators disoriented while the Ancient Lake Sturgeon stalks thermoclines unbothered.',
    biteBonusMultiplier: 8.0,
  },
  {
    id: 'rumor_bayou_albino_gar',
    speciesId: 69, // Albino River Gar
    areaId: 'bayou',
    requiredWeather: 'fog',
    headline: 'Pale Phantom Gar Terrorizes Cypress Bayou Shallows',
    source: 'Bayou Marshland Telegraph',
    rumorText: 'Swamp guides warn of violent thrashing in the cypress knees under dense Fog - the Albino River Gar is on the prowl.',
    lore: 'With low visibility obscuring its stark white scales, the albino apex predator ambushes prey without warning.',
    biteBonusMultiplier: 9.0,
  },
  {
    id: 'rumor_ocean_bluefin',
    speciesId: 89, // Giant Bluefin Tuna
    areaId: 'ocean',
    requiredWeather: 'rain',
    headline: 'Pelagic Giant Breaching in Coastal Ocean Nor\'easter',
    source: 'Harbor Coast Guard Advisory',
    rumorText: 'Commercial longliners report enormous 900-lb Giant Bluefin Tuna breaching through foam crests in driving Rain.',
    lore: 'Choppy rain squalls drive bait schools into tight bait-balls, triggering ferocious feeding frenzies from ocean giants.',
    biteBonusMultiplier: 7.5,
  },
  {
    id: 'rumor_reef_marlin',
    speciesId: 109, // Grand Sovereign Marlin
    areaId: 'reef',
    requiredWeather: 'windy',
    headline: 'The Grand Sovereign Marlin Hunting Reef Drop-offs',
    source: 'Coral Cay Marine Radio',
    rumorText: 'Gamefish skippers report the legendary Grand Sovereign Marlin leaping beyond barrier reefs during howling Windy conditions.',
    lore: 'High wind currents churn nutrient upwellings along the continental shelf, drawing the monarch of all marlins.',
    biteBonusMultiplier: 8.0,
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

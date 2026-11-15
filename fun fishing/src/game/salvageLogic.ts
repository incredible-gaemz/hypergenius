/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SalvageBoatDef {
  id: string;
  name: string;
  cost: number;
  speedMultiplier: number;
  maxCrew: number;
  cargoCapacity: number; // Max treasures retrieved per voyage
  description: string;
  spriteUrl: string;
  fallbackSpriteUrl: string;
}

export const SALVAGE_BOATS_CATALOG: SalvageBoatDef[] = [
  {
    id: 'salvage_dory',
    name: 'Coastal Salvage Dory',
    cost: 2700,
    speedMultiplier: 1.0,
    maxCrew: 1,
    cargoCapacity: 1,
    description: 'Rugged aluminum dive skiff with manual rope winch and dive ladder.',
    spriteUrl: './boats/salvage_dory.png',
    fallbackSpriteUrl: './boats/dory.png',
  },
  {
    id: 'dredge_trawler',
    name: 'Offshore Dredge Trawler',
    cost: 9400,
    speedMultiplier: 1.35,
    maxCrew: 2,
    cargoCapacity: 3,
    description: 'Heavy North Sea side-trawler converted with hydraulic dredging A-frames and silt winches.',
    spriteUrl: './boats/dredge_trawler.png',
    fallbackSpriteUrl: './boats/trawler.png',
  },
  {
    id: 'salvage_tug',
    name: 'Deep-Sea Salvage Tug',
    cost: 23000,
    speedMultiplier: 1.9,
    maxCrew: 3,
    cargoCapacity: 6,
    description: 'High-bow ocean rescue tug boasting dual heavy winches and hydraulic boom cranes.',
    spriteUrl: './boats/salvage_tug.png',
    fallbackSpriteUrl: './boats/bering_crabber.png',
  },
  {
    id: 'oceanic_explorer',
    name: 'SS Oceanic Explorer',
    cost: 121000,
    speedMultiplier: 2.8,
    maxCrew: 5,
    cargoCapacity: 12,
    description: 'Legendary 729-foot deep ocean salvage flagship commissioned for deep-sea recovery.',
    spriteUrl: './boats/oceanic_explorer.png',
    fallbackSpriteUrl: './boats/deepsea_leviathan.png',
  },
];

export interface SunkenWreckSite {
  id: string;
  name: string;
  vesselType: string;
  depthMeters: number;
  unlockCost: number; // License/chart cost
  totalTreasureCount: number;
  description: string;
  bannerImage: string;
  baseVoyageDurationSec: number;
  treasureIds: string[];
}

export const SUNKEN_WRECK_SITES: SunkenWreckSite[] = [
  {
    id: 'smugglers_sloop',
    name: "The Smuggler's Sloop",
    vesselType: '18th-Century Blockade Runner',
    depthMeters: 25,
    unlockCost: 0, // Unlocked immediately upon purchasing $20,000 salvage charter
    totalTreasureCount: 13,
    description: 'Wrecked on coastal oyster shoals during an autumn storm, shallow and accessible.',
    bannerImage: './wrecks/smugglers_sloop.png',
    baseVoyageDurationSec: 60,
    treasureIds: [
      'barnacle_rum_bottle',
      'clay_pipe',
      'copper_sheathing_nail',
      'pewter_pocket_flask',
      'carved_wooden_trencher',
      'forged_marlinspike',
      'cast_iron_oarlock',
      'redware_mess_bowl',
      'sailor_horn_comb',
      'hardwood_bilge_bung',
      'oak_barrel_spigot',
      'brass_companionway_hook',
      'enamel_bunk_washbasin',
    ],
  },
  {
    id: 'resolute_frigate',
    name: 'HMS Resolute Frigate',
    vesselType: '36-Gun Naval Frigate',
    depthMeters: 65,
    unlockCost: 3500,
    totalTreasureCount: 15,
    description: 'Driven onto jagged barrier reefs, its cannons and armory lie strewn across coral ridges.',
    bannerImage: './wrecks/resolute_frigate.png',
    baseVoyageDurationSec: 110,
    treasureIds: [
      'iron_cannonball',
      'wooden_rigging_pulley',
      'pewter_mess_tankard',
      'flintlock_sea_service_pistol',
      'four_fluke_grapple',
      'sailmaker_leather_palm',
      'leather_belaying_pin',
      'bone_needle_horn',
      'carved_deadeye_block',
      'shipwright_curved_drawknife',
      'forged_deck_scraper',
      'tin_galley_lard_lamp',
      'brass_boatswain_fid',
      'wood_rope_serving_mallet',
      'stoneware_galley_crock',
    ],
  },
  {
    id: 'san_sebastian',
    name: 'Galleon San Sebastian',
    vesselType: 'Spanish Treasure Galleon',
    depthMeters: 180,
    unlockCost: 8000,
    totalTreasureCount: 16,
    description: 'Sunk along the continental shelf loaded with colonial silver ingots and bullion.',
    bannerImage: './wrecks/san_sebastian.png',
    baseVoyageDurationSec: 190,
    treasureIds: [
      'lead_sounding_weight',
      'terracotta_olive_jar',
      'silver_reales_clump',
      'silver_escudo_stack',
      'east_indies_lead_seal',
      'brass_sounding_tube',
      'lead_scupper_flap',
      'lead_hawse_plug',
      'bronze_hawse_flange',
      'brass_pocket_sundial',
      'leather_sailor_sea_boot',
      'brass_halyard_cleat',
      'bullion_dispatch_box',
      'royal_charter_sovereign_seal',
      'admiral_garnet_signet_ring',
      'jeweled_scrimshaw_flask',
    ],
  },
  {
    id: 'arctic_star',
    name: 'SS Arctic Star',
    vesselType: 'Glacial Steam Packet',
    depthMeters: 340,
    unlockCost: 15000,
    totalTreasureCount: 17,
    description: 'Crushed in pack ice along a fjord shelf, holding trade goods and gold-rush vaults.',
    bannerImage: './wrecks/arctic_star.png',
    baseVoyageDurationSec: 280,
    treasureIds: [
      'scrimshaw_whale_tooth',
      'leather_logbook_tin',
      'gold_sovereign_pouch',
      'sailor_ditty_box',
      'whalebone_rigging_fid',
      'copper_galley_saucepan',
      'steamship_china_plate',
      'cast_iron_galley_ladle',
      'stoneware_mustard_pot',
      'tin_mess_kettle',
      'wool_scarf_tin',
      'copper_rum_ration_tot',
      'sailor_sea_mittens',
      'canvas_ditty_bag',
      'tinned_salt_pork_canister',
      'copper_deck_coal_scoop',
      'galvanized_bucket_bracket',
    ],
  },
  {
    id: 'u_boat_9',
    name: 'U-Boat Derelict IX-C',
    vesselType: 'Submarine Patrol Vessel',
    depthMeters: 620,
    unlockCost: 28000,
    totalTreasureCount: 16,
    description: 'Resting upright on deep oceanic silt with secure military safes and chronometers.',
    bannerImage: './wrecks/u_boat_9.png',
    baseVoyageDurationSec: 400,
    treasureIds: [
      'brass_porthole_frame',
      'antique_oil_lantern',
      'brass_navigation_dividers',
      'ships_chronometer_box',
      'hatch_dog_wrench',
      'signal_pennants_tin',
      'brass_inclinometer',
      'porthole_dog_latch',
      'waterproof_match_safe',
      'brass_pump_foot_valve',
      'boiler_sight_glass',
      'iron_rigging_shackle',
      'copper_deck_funnel',
      'vulcanite_radio_headphones',
      'copper_engine_oil_feeder',
      'zinc_hull_sacrificial_anode',
    ],
  },
  {
    id: 'leviathan_ironclad',
    name: 'Leviathan Pre-Dreadnought',
    vesselType: 'Armored Warship',
    depthMeters: 1400,
    unlockCost: 50000,
    totalTreasureCount: 19,
    description: 'Lies half-buried on an abyssal cliff with massive brass instruments and strongboxes.',
    bannerImage: './wrecks/leviathan_ironclad.png',
    baseVoyageDurationSec: 560,
    treasureIds: [
      'tarnished_silver_spoons',
      'brass_gimbal_compass',
      'bronze_ships_bell',
      'iron_banded_strongbox',
      'glass_deck_prism',
      'ship_carpenter_adze',
      'binnacle_gimbal_lamp',
      'wheel_brass_hub_cap',
      'hardwood_caulking_mallet',
      'forged_caulking_iron',
      'pewter_salt_cellar',
      'copper_galley_skimmer',
      'heavy_capstan_pawl',
      'cast_bronze_port_plate',
      'leather_palm_fid',
      'presentation_naval_cutlass',
      'cast_iron_deadlight_frame',
      'iron_hatch_dog_cleat',
      'lead_sealing_pliers',
    ],
  },
  {
    id: 'fitzgerald_deep',
    name: 'SS Edmund Fitzgerald Deep',
    vesselType: 'Titan Great Lakes Ore Carrier',
    depthMeters: 2500,
    unlockCost: 95000,
    totalTreasureCount: 21,
    description: 'The ultimate deep salvage site split on the hadal seabed with immense historic wealth.',
    bannerImage: './wrecks/fitzgerald_deep.png',
    baseVoyageDurationSec: 780,
    treasureIds: [
      'brass_marine_telescope',
      'telegraph_engine_dial',
      'gold_pocket_chronograph',
      'engine_revolution_counter',
      'admiralty_parallel_ruler',
      'brass_speaking_trumpet',
      'brass_pelorus_dial',
      'steam_engine_indicator',
      'commercial_lead_silver_brick',
      'gold_fob_watch_chain',
      'brass_marking_gauge',
      'deck_log_inkwell',
      'boxwood_folding_rule',
      'boatswain_scale_hammer',
      'stoneware_pounce_pot',
      'braided_lanyard_knot',
      'mahogany_captains_tantalus',
      'gilded_brass_astrolabe',
      'silver_chronometer_movement',
      'brass_binnacle_gimbal_ring',
      'brass_draft_gauge_plaque',
    ],
  },
];

export interface TreasureItemDef {
  id: string;
  name: string;
  baseEstimatedValue: number;
  historicalPeriod: string;
  description: string;
  rarity?: string;
}

export const TREASURE_CATALOG: TreasureItemDef[] = [
  // --- Smuggler's Sloop (25m) ---
  {
    id: 'barnacle_rum_bottle',
    name: 'Barnacle-Encrusted Rum Bottle',
    baseEstimatedValue: 650,
    historicalPeriod: '18th Century',
    description: 'Dark green hand-blown glass onion bottle coated with fossilized barnacles.',
  },
  {
    id: 'clay_pipe',
    name: "Sailor's Clay Tobacco Pipe",
    baseEstimatedValue: 420,
    historicalPeriod: '19th Century',
    description: 'Intact white ball-clay smoking pipe with stamped maker mark on the heel.',
  },
  {
    id: 'copper_sheathing_nail',
    name: 'Forged Copper Hull Spikes',
    baseEstimatedValue: 380,
    historicalPeriod: 'Age of Sail',
    description: 'Square hand-forged copper sheathing nails recovered from oak keel ribs.',
  },
  {
    id: 'pewter_pocket_flask',
    name: "Sailor's Engraved Pewter Flask",
    baseEstimatedValue: 850,
    historicalPeriod: '18th Century',
    description: 'Curved kidney-shaped pocket flask engraved with an anchor and initials.',
  },
  {
    id: 'carved_wooden_trencher',
    name: "Sailor's Carved Wooden Trencher",
    baseEstimatedValue: 460,
    historicalPeriod: '18th Century',
    description: 'Shallow square wooden mess eating dish hollowed from beechwood, showing knife marks.',
  },
  {
    id: 'forged_marlinspike',
    name: 'Forged Rigging Marlinspike',
    baseEstimatedValue: 520,
    historicalPeriod: 'Age of Sail',
    description: 'Tapered wrought-iron rope splicing spike with a drilled lanyard eyelet.',
  },
  {
    id: 'cast_iron_oarlock',
    name: 'Heavy Cast Iron Oarlock',
    baseEstimatedValue: 410,
    historicalPeriod: '19th Century',
    description: 'Rugged U-shaped rowlock fitting from a ship timber cutter dinghy.',
  },
  {
    id: 'redware_mess_bowl',
    name: 'Redware Ceramic Mess Bowl',
    baseEstimatedValue: 490,
    historicalPeriod: '18th Century',
    description: 'Lead-glazed red clay soup bowl with a rounded rim and minor ocean chips.',
  },
  {
    id: 'sailor_horn_comb',
    name: "Sailor's Horn Pocket Comb",
    baseEstimatedValue: 520,
    historicalPeriod: '18th Century',
    description: 'Small folding pocket comb hand-carved from translucent cow horn with fine teeth.',
  },
  {
    id: 'hardwood_bilge_bung',
    name: 'Hardwood Bilge Bung Plug',
    baseEstimatedValue: 430,
    historicalPeriod: 'Age of Sail',
    description: 'Tapered turned pine bilge drain plug wrapped with tarred canvas twine.',
  },

  // --- HMS Resolute Frigate (65m) ---
  {
    id: 'iron_cannonball',
    name: 'Corroded Iron Cannonball',
    baseEstimatedValue: 1200,
    historicalPeriod: 'Age of Sail',
    description: 'Solid twelve-pound iron naval shot pitted with heavy ocean rust.',
  },
  {
    id: 'wooden_rigging_pulley',
    name: 'Hardwood Rigging Block',
    baseEstimatedValue: 950,
    historicalPeriod: '19th Century',
    description: 'Dense lignum-vitae pulley block with bronze sheave pin preserved in seabed silt.',
  },
  {
    id: 'pewter_mess_tankard',
    name: 'Dented Pewter Mess Tankard',
    baseEstimatedValue: 1100,
    historicalPeriod: '18th Century',
    description: 'Heavy leaded pewter drinking mug with handle inscribed with crew initials.',
  },
  {
    id: 'four_fluke_grapple',
    name: 'Four-Fluke Iron Grappling Anchor',
    baseEstimatedValue: 1450,
    historicalPeriod: '18th Century',
    description: 'Corroded four-arm iron grapnel used for kedging boats and snagging lost ground tackle.',
  },
  {
    id: 'sailmaker_leather_palm',
    name: "Sailmaker's Sewing Leather Palm",
    baseEstimatedValue: 820,
    historicalPeriod: '19th Century',
    description: 'Thick hide thumb-shield with dimpled iron driving thimble used to stitch heavy sails.',
  },
  {
    id: 'flintlock_sea_service_pistol',
    name: 'Flintlock Sea Service Pistol',
    baseEstimatedValue: 4800,
    historicalPeriod: 'Age of Sail',
    description: 'Naval issue belt pistol with brass furniture and walnut stock preserved in harbor clay.',
  },
  {
    id: 'leather_belaying_pin',
    name: 'Leather-Wrapped Belaying Pin',
    baseEstimatedValue: 480,
    historicalPeriod: 'Age of Sail',
    description: 'Turned oak belaying pin used on sailing vessels, showing heavy rope wear grooves.',
  },
  {
    id: 'bone_needle_horn',
    name: "Sailor's Bone Needle Horn",
    baseEstimatedValue: 680,
    historicalPeriod: '18th Century',
    description: 'Carved hollow bull horn container with wooden plug storing bone needles and thimble.',
  },
  {
    id: 'carved_deadeye_block',
    name: 'Lignum-Vitae Deadeye Block',
    baseEstimatedValue: 1150,
    historicalPeriod: 'Age of Sail',
    description: 'Circular three-hole hardwood deadeye block wrapped in tarred hemp rope lanyard.',
  },
  {
    id: 'shipwright_curved_drawknife',
    name: "Shipwright's Curved Drawknife",
    baseEstimatedValue: 1150,
    historicalPeriod: 'Age of Sail',
    description: 'Common two-handled forged iron ship carpenter drawknife with worn ash wood grips.',
  },
  {
    id: 'forged_deck_scraper',
    name: 'Forged Triangle Deck Scraper',
    baseEstimatedValue: 610,
    historicalPeriod: 'Age of Sail',
    description: 'Triangular forged iron scraper blade on a socket handle used to scrape old deck pitch.',
  },
  {
    id: 'tin_galley_lard_lamp',
    name: 'Tin Galley Lard Lamp',
    baseEstimatedValue: 670,
    historicalPeriod: '18th Century',
    description: 'Folded tin tallow oil lamp with a side ring handle and charred cotton wick spout.',
  },

  // --- Galleon San Sebastian (180m) ---
  {
    id: 'lead_sounding_weight',
    name: 'Lead Sounding Line Weight',
    baseEstimatedValue: 1800,
    historicalPeriod: 'Colonial Era',
    description: 'Octagonal lead navigational sounding weight with hollow tallow cup.',
  },
  {
    id: 'terracotta_olive_jar',
    name: 'Spanish Terracotta Olive Jar',
    baseEstimatedValue: 2600,
    historicalPeriod: '17th Century',
    description: 'Thick earthenware transport amphora once holding olive oil, encrusted with sea shells.',
  },
  {
    id: 'brass_sounding_tube',
    name: 'Brass Depth Sounding Tube',
    baseEstimatedValue: 2200,
    historicalPeriod: 'Colonial Era',
    description: 'Hollow brass tube with spring valve used to capture seabed silt samples.',
  },
  {
    id: 'east_indies_lead_seal',
    name: 'Merchant Fleet Lead Cargo Seal',
    baseEstimatedValue: 3400,
    historicalPeriod: 'Colonial Era',
    description: 'Heavy stamped lead bale token with company monogram proving tax clearance.',
  },
  {
    id: 'silver_escudo_stack',
    name: 'Stack of Tarnished Silver Escudos',
    baseEstimatedValue: 8500,
    historicalPeriod: 'Colonial Era',
    description: 'Five minted silver coins fused in a mineralized stack from an officer sea chest.',
  },
  {
    id: 'silver_reales_clump',
    name: 'Mineralized Silver Reales Clump',
    baseEstimatedValue: 14500,
    historicalPeriod: 'Colonial Era',
    description: 'Cluster of eight-reales Spanish cob coins cemented together by black silver sulfide coral.',
  },
  {
    id: 'lead_scupper_flap',
    name: 'Heavy Lead Scupper Flap',
    baseEstimatedValue: 620,
    historicalPeriod: 'Colonial Era',
    description: 'Rectangular heavy lead one-way deck scupper drain flap with rusted iron hinge.',
  },
  {
    id: 'lead_hawse_plug',
    name: 'Canvas & Lead Hawse Plug',
    baseEstimatedValue: 760,
    historicalPeriod: 'Age of Sail',
    description: 'Conical lead and canvas-wrapped oak bung plug used to block chain pipes in storms.',
  },
  {
    id: 'bronze_hawse_flange',
    name: 'Bronze Hawse Pipe Flange',
    baseEstimatedValue: 1400,
    historicalPeriod: 'Age of Sail',
    description: 'Circular cast bronze hull hawse ring with countersunk holes, weathered green verdigris.',
  },
  {
    id: 'brass_pocket_sundial',
    name: "Brass Traveler's Pocket Sundial",
    baseEstimatedValue: 3800,
    historicalPeriod: '18th Century',
    description: 'Pocket-sized round brass traveler sundial with a folding gnomon and compass rose.',
  },
  {
    id: 'leather_sailor_sea_boot',
    name: "Sailor's Oiled Sea Boot",
    baseEstimatedValue: 780,
    historicalPeriod: '19th Century',
    description: 'Tall heavy-soled oiled leather deck boot fastened with copper clinch nails.',
  },
  {
    id: 'brass_halyard_cleat',
    name: 'Cast Brass Halyard Cleat',
    baseEstimatedValue: 840,
    historicalPeriod: '19th Century',
    description: 'Two-horn cast brass deck cleat with countersunk screw holes and faint verdigris.',
  },
  {
    id: 'bullion_dispatch_box',
    name: 'Wax-Sealed Bullion Dispatch Box',
    baseEstimatedValue: 140000,
    historicalPeriod: 'Colonial Era',
    description: 'Heavy iron-riveted copper lockbox bearing red wax royal admiralty seals and stacked gold coins.',
  },

  // --- SS Arctic Star (340m) ---
  {
    id: 'sailor_ditty_box',
    name: "Carved Oak Sailor's Ditty Box",
    baseEstimatedValue: 3200,
    historicalPeriod: '19th Century',
    description: 'Small dovetailed oak box with geometric chip carvings holding mending threads and charms.',
  },
  {
    id: 'copper_galley_saucepan',
    name: "Copper Ship's Galley Saucepan",
    baseEstimatedValue: 2800,
    historicalPeriod: 'Victorian Era',
    description: 'Heavy tin-lined hammered copper pot recovered from the cookhouse wreck debris.',
  },
  {
    id: 'steamship_china_plate',
    name: 'Gilded Steamship Line Porcelain Plate',
    baseEstimatedValue: 3600,
    historicalPeriod: 'Steamship Era',
    description: 'Fine white ceramic dinner plate with gold-leaf rim and transfer-print shipping logo.',
  },
  {
    id: 'whalebone_rigging_fid',
    name: 'Carved Whalebone Rigging Fid',
    baseEstimatedValue: 4500,
    historicalPeriod: 'Whaling Era',
    description: 'Polished bone conical splicing spike used to work heavy hemp hawser ropes.',
  },
  {
    id: 'leather_logbook_tin',
    name: 'Sealed Tin Logbook Box',
    baseEstimatedValue: 7800,
    historicalPeriod: '19th Century',
    description: 'Solder-sealed document cylinder preserving the water-tight captain logbook pages.',
  },
  {
    id: 'scrimshaw_whale_tooth',
    name: 'Carved Scrimshaw Whale Tooth',
    baseEstimatedValue: 16000,
    historicalPeriod: 'Whaling Era',
    description: 'Polished sperm whale tooth engraved with a detailed portrait of a three-masted bark.',
  },
  {
    id: 'gold_sovereign_pouch',
    name: 'Lead-Weighted Sovereign Bag',
    baseEstimatedValue: 32000,
    historicalPeriod: 'Victorian Era',
    description: 'Waxed canvas dispatch pouch containing gold British sovereign coins meant for emergency port fees.',
  },
  {
    id: 'cast_iron_galley_ladle',
    name: 'Cast Iron Galley Ladle',
    baseEstimatedValue: 520,
    historicalPeriod: '18th Century',
    description: 'Sturdy cast iron stew ladle with a hooked hanging handle end and light ocean pitting.',
  },
  {
    id: 'stoneware_mustard_pot',
    name: 'Salt-Glazed Mustard Pot',
    baseEstimatedValue: 580,
    historicalPeriod: '19th Century',
    description: 'Stoneware condiment jar with stamped maker lettering and intact wax-sealed cork.',
  },
  {
    id: 'tin_mess_kettle',
    name: 'Tin-Plated Ship Mess Kettle',
    baseEstimatedValue: 720,
    historicalPeriod: 'Victorian Era',
    description: 'Dented round tin-iron boiling pot with wire bail handle and stove soot marks.',
  },
  {
    id: 'wool_scarf_tin',
    name: "Sailor's Wool Scarf Tin",
    baseEstimatedValue: 540,
    historicalPeriod: '19th Century',
    description: 'Flat solder-sealed rectangular tin with rolled corners that preserved sailor neckwear.',
  },
  {
    id: 'copper_rum_ration_tot',
    name: 'Copper Rum Ration Tot',
    baseEstimatedValue: 920,
    historicalPeriod: 'Victorian Era',
    description: 'Flared half-gill copper rum ration cup with a rolled lip and stamped broad arrow mark.',
  },
  {
    id: 'sailor_sea_mittens',
    name: 'Oiled Wool Sea Mittens',
    baseEstimatedValue: 510,
    historicalPeriod: 'Victorian Era',
    description: 'Pair of thick unbleached wool deck mittens reinforced with oiled leather palm patches.',
  },
  {
    id: 'canvas_ditty_bag',
    name: 'Canvas Sailor Ditty Bag',
    baseEstimatedValue: 580,
    historicalPeriod: '19th Century',
    description: 'Heavy duck canvas sailor gear pouch with brass eyelets and hemp cord drawstring.',
  },

  // --- U-Boat Derelict IX-C (620m) ---
  {
    id: 'hatch_dog_wrench',
    name: 'Cast Iron Hatch Dog Spanner',
    baseEstimatedValue: 4200,
    historicalPeriod: 'Steamship Era',
    description: 'Heavy curved socket wrench used to cinch down watertight cargo hatch clamps.',
  },
  {
    id: 'signal_pennants_tin',
    name: 'Water-Sealed Signal Flags Tin',
    baseEstimatedValue: 5600,
    historicalPeriod: '19th Century',
    description: 'Solder-sealed rectangular tin holding folded wool bunting maritime signal pennants.',
  },
  {
    id: 'brass_inclinometer',
    name: "Ship's Brass Clinometer Dial",
    baseEstimatedValue: 7200,
    historicalPeriod: '19th Century',
    description: 'Curved gravity-weighted brass pendulum dial measuring degrees of vessel list and roll.',
  },
  {
    id: 'brass_porthole_frame',
    name: 'Heavy Brass Porthole Frame',
    baseEstimatedValue: 9500,
    historicalPeriod: 'Steamship Era',
    description: 'Circular cast bronze frame with thick green verdigris patina and dog bolts.',
  },
  {
    id: 'antique_oil_lantern',
    name: 'Brass Marine Lantern',
    baseEstimatedValue: 11000,
    historicalPeriod: 'Steamship Era',
    description: 'Heavy cylindrical brass paraffin lantern with thick bullseye Fresnel lens.',
  },
  {
    id: 'brass_navigation_dividers',
    name: 'Navigational Chart Dividers',
    baseEstimatedValue: 14000,
    historicalPeriod: '19th Century',
    description: 'Friction-joint brass drafting dividers used for charting navigation courses.',
  },
  {
    id: 'ships_chronometer_box',
    name: 'Brass-Bound Chronometer Casket',
    baseEstimatedValue: 38000,
    historicalPeriod: 'Victorian Era',
    description: 'Three-tier mahogany maritime chronometer box with inset ivory maker plaque.',
  },
  {
    id: 'porthole_dog_latch',
    name: 'Threaded Brass Porthole Dog Latch',
    baseEstimatedValue: 820,
    historicalPeriod: 'Steamship Era',
    description: 'Heavy threaded T-bolt brass wingnut clamp used to seal round glass scuttles watertight.',
  },
  {
    id: 'waterproof_match_safe',
    name: 'Watertight Tin Match Safe',
    baseEstimatedValue: 640,
    historicalPeriod: 'Victorian Era',
    description: 'Ribbed cylindrical pocket match container with knurled screw top and striker base.',
  },
  {
    id: 'brass_pump_foot_valve',
    name: 'Brass Bilge Pump Foot Valve',
    baseEstimatedValue: 1650,
    historicalPeriod: 'Steamship Era',
    description: 'Cylindrical cast bronze check-valve housing with an internal hinged leather flapper.',
  },
  {
    id: 'boiler_sight_glass',
    name: 'Steam Boiler Sight Glass Tube',
    baseEstimatedValue: 2400,
    historicalPeriod: 'Steamship Era',
    description: 'Cylindrical heavy glass boiler water level tube held in ribbed brass threaded fittings.',
  },
  {
    id: 'iron_rigging_shackle',
    name: 'Wrought Iron Rigging Shackle',
    baseEstimatedValue: 980,
    historicalPeriod: '19th Century',
    description: 'Heavy U-shaped iron anchor chain shackle with a threaded cross pin.',
  },
  {
    id: 'copper_deck_funnel',
    name: 'Spun Copper Deck Funnel',
    baseEstimatedValue: 860,
    historicalPeriod: 'Victorian Era',
    description: 'Conical spun-copper fuel and oil funnel with rolled rim and solder seams.',
  },

  // --- Leviathan Pre-Dreadnought (1,400m) ---
  {
    id: 'glass_deck_prism',
    name: 'Heavy Glass Deck Prism',
    baseEstimatedValue: 8500,
    historicalPeriod: 'Age of Sail',
    description: 'Hexagonal molded crystal glass prism set into oak decks to channel sunlight below.',
  },
  {
    id: 'ship_carpenter_adze',
    name: "Shipwright's Curved Iron Adze",
    baseEstimatedValue: 9200,
    historicalPeriod: 'Age of Sail',
    description: 'Forged iron shipbuilding tool with razor-honed arched blade for shaping timbers.',
  },
  {
    id: 'binnacle_gimbal_lamp',
    name: 'Brass Binnacle Gimbal Oil Lamp',
    baseEstimatedValue: 12500,
    historicalPeriod: 'Age of Sail',
    description: 'Self-leveling brass oil lamp that illuminated the steering compass at night.',
  },
  {
    id: 'wheel_brass_hub_cap',
    name: "Embossed Helm Wheel Hub Cap",
    baseEstimatedValue: 18000,
    historicalPeriod: 'Age of Sail',
    description: 'Center decorative brass hub casting from the ship steering wheel with dolphin motif.',
  },
  {
    id: 'tarnished_silver_spoons',
    name: "Officers' Mess Silverware Set",
    baseEstimatedValue: 22000,
    historicalPeriod: 'Victorian Era',
    description: 'Pair of heavy silver-plated soup spoons engraved with naval admiralty crest.',
  },
  {
    id: 'brass_gimbal_compass',
    name: 'Gimballed Brass Binnacle Compass',
    baseEstimatedValue: 35000,
    historicalPeriod: '19th Century',
    description: 'Floating dry-card magnetic compass mounted on balanced double brass gimbal rings.',
  },
  {
    id: 'bronze_ships_bell',
    name: "Cast Bronze Ship's Bell",
    baseEstimatedValue: 55000,
    historicalPeriod: 'Steamship Era',
    description: 'Resonant ship bell cast in bell-metal bronze engraved with the ship name and launch year.',
  },
  {
    id: 'iron_banded_strongbox',
    name: 'Iron-Banded Paymaster Chest',
    baseEstimatedValue: 88000,
    historicalPeriod: 'Age of Sail',
    description: 'Heavy studded oak bullion safe reinforced with wrought-iron strapwork and double keyways.',
  },
  {
    id: 'hardwood_caulking_mallet',
    name: 'Live Oak Caulking Mallet',
    baseEstimatedValue: 890,
    historicalPeriod: '19th Century',
    description: 'Traditional two-faced live oak beetle mallet with iron barrel bands for hull seams.',
  },
  {
    id: 'forged_caulking_iron',
    name: 'Forged Seam Caulking Iron',
    baseEstimatedValue: 440,
    historicalPeriod: 'Age of Sail',
    description: 'Broad blunt-nosed forged iron wedge chisel used for driving oakum between ship planks.',
  },
  {
    id: 'pewter_salt_cellar',
    name: 'Footed Pewter Salt Cellar',
    baseEstimatedValue: 880,
    historicalPeriod: '18th Century',
    description: 'Small three-legged cast pewter salt shaker with domed cap from the officer wardroom.',
  },
  {
    id: 'copper_galley_skimmer',
    name: 'Perforated Copper Galley Skimmer',
    baseEstimatedValue: 940,
    historicalPeriod: 'Victorian Era',
    description: 'Flat round perforated copper straining spoon with a long riveted iron shank.',
  },
  {
    id: 'heavy_capstan_pawl',
    name: 'Heavy Iron Capstan Pawl',
    baseEstimatedValue: 1450,
    historicalPeriod: '19th Century',
    description: 'Thick triangular cast iron capstan ratchet pawl tooth with a pivot bolt hole.',
  },
  {
    id: 'cast_bronze_port_plate',
    name: 'Cast Bronze Deck Port Plate',
    baseEstimatedValue: 3200,
    historicalPeriod: 'Industrial Era',
    description: 'Heavy round threaded bronze coal hole deck plate with diamond anti-slip tread.',
  },
  {
    id: 'leather_palm_fid',
    name: "Sailor's Leather Palm Fid",
    baseEstimatedValue: 710,
    historicalPeriod: '19th Century',
    description: 'Short pointed boxwood splicing fid with indented brass base cap for pressing into rope.',
  },
  {
    id: 'presentation_naval_cutlass',
    name: 'Presentation Naval Cutlass',
    baseEstimatedValue: 85000,
    historicalPeriod: 'Victorian Era',
    description: "Officer's ceremonial silver-mounted dress cutlass with mother-of-pearl grip and lion-head pommel.",
  },

  // --- SS Edmund Fitzgerald Deep (2,500m) ---
  {
    id: 'engine_revolution_counter',
    name: 'Brass Engine Shaft Revolution Counter',
    baseEstimatedValue: 18000,
    historicalPeriod: 'Early Industrial',
    description: 'Mechanical odometer dial with brass drive gears that tracked main propeller turns.',
  },
  {
    id: 'admiralty_parallel_ruler',
    name: 'Rolling Brass Parallel Ruler',
    baseEstimatedValue: 24000,
    historicalPeriod: 'Maritime Explorer',
    description: 'Heavy knurled brass cylinder-roller parallel rule for transferring compass bearings.',
  },
  {
    id: 'brass_speaking_trumpet',
    name: "Captain's Brass Speaking Trumpet",
    baseEstimatedValue: 32000,
    historicalPeriod: 'Age of Sail',
    description: 'Flared horn megaphone engraved with ship motto used to shout across rough water.',
  },
  {
    id: 'brass_marine_telescope',
    name: 'Collapsible Brass Telescope',
    baseEstimatedValue: 45000,
    historicalPeriod: '19th Century',
    description: 'Four-draw brass spyglass with leather barrel grip and intact objective lens.',
  },
  {
    id: 'brass_pelorus_dial',
    name: 'Gimballed Brass Pelorus Sighting Dial',
    baseEstimatedValue: 62000,
    historicalPeriod: 'Early Industrial',
    description: 'Navigational sighting ring with folding shadow vanes used to take relative bearings.',
  },
  {
    id: 'commercial_lead_silver_brick',
    name: 'Refined Lead-Silver Ingot Brick',
    baseEstimatedValue: 78000,
    historicalPeriod: '19th Century',
    description: 'Twenty-pound stamped bullion brick with smelter assay certification marks.',
  },
  {
    id: 'steam_engine_indicator',
    name: 'Steam Engine Indicator Card Gauge',
    baseEstimatedValue: 95000,
    historicalPeriod: 'Steamship Era',
    description: 'Precision brass recording drum and pencil arm used to graph engine cylinder horsepower.',
  },
  {
    id: 'telegraph_engine_dial',
    name: 'Brass Engine Telegraph Dial',
    baseEstimatedValue: 125000,
    historicalPeriod: 'Steamship Era',
    description: 'Cast bronze bridge order telegraph with enameled Full Ahead and Stop signal markings.',
  },
  {
    id: 'gold_fob_watch_chain',
    name: 'Gold Albert Watch Chain and Fob',
    baseEstimatedValue: 165000,
    historicalPeriod: 'Victorian Era',
    description: 'Heavy curb-link fifteen-karat gold pocket watch chain with carved carnelian seal fob.',
  },
  {
    id: 'gold_pocket_chronograph',
    name: "Officer's Gold Pocket Watch",
    baseEstimatedValue: 240000,
    historicalPeriod: 'Steamship Era',
    description: 'Eighteen-karat gold hunter-case pocket watch stopped at the hour of the sinking.',
  },
  {
    id: 'brass_marking_gauge',
    name: "Shipwright's Brass Marking Gauge",
    baseEstimatedValue: 750,
    historicalPeriod: '19th Century',
    description: 'Brass and dark rosewood woodworking scribe gauge with thumbscrew and steel pin.',
  },
  {
    id: 'deck_log_inkwell',
    name: 'Stoneware Deck Log Inkwell',
    baseEstimatedValue: 780,
    historicalPeriod: '19th Century',
    description: 'Squat cylindrical ceramic ink bottle with a chipped lip and dark brown salt glaze.',
  },
  {
    id: 'boxwood_folding_rule',
    name: 'Hinged Boxwood Folding Rule',
    baseEstimatedValue: 1250,
    historicalPeriod: '19th Century',
    description: 'Two-foot folding boxwood carpenter ruler with brass hinges and stamped inches.',
  },
  {
    id: 'boatswain_scale_hammer',
    name: "Boatswain's Chain De-Scaling Hammer",
    baseEstimatedValue: 590,
    historicalPeriod: 'Industrial Era',
    description: 'Double-peen iron chipping hammer on a hickory handle used to knock rust off chains.',
  },
  {
    id: 'stoneware_pounce_pot',
    name: 'Stoneware Sand Pounce Pot',
    baseEstimatedValue: 720,
    historicalPeriod: '19th Century',
    description: 'Small salt-glazed stoneware sand shaker with perforated top used to blot wet logbook ink.',
  },
  {
    id: 'braided_lanyard_knot',
    name: 'Braided Sailor Lanyard Knot',
    baseEstimatedValue: 650,
    historicalPeriod: '19th Century',
    description: 'Intricately braided white cotton sailor lanyard ending in a decorative monkey fist knot.',
  },
  {
    id: 'mahogany_captains_tantalus',
    name: "Captain's Mahogany Tantalus",
    baseEstimatedValue: 48000,
    historicalPeriod: 'Victorian Era',
    description: 'Luxury brass-bound mahogany lockable liquor case holding three cut-crystal decanters.',
  },
  {
    id: 'gilded_brass_astrolabe',
    name: "Gilded Mariner's Astrolabe",
    baseEstimatedValue: 195000,
    historicalPeriod: '16th Century',
    description: 'Ornate gilded brass navigational astrolabe with rotating alidade sight and celestial rings.',
  },
  // --- Smuggler's Sloop (25m) Batch 5 ---
  {
    id: 'oak_barrel_spigot',
    name: 'Oak Cask Spigot',
    baseEstimatedValue: 540,
    historicalPeriod: '18th Century',
    description: 'Hand-carved white oak cask tap and turncock spigot used to dispense fresh water or grog.',
  },
  {
    id: 'brass_companionway_hook',
    name: 'Brass Companionway Hook',
    baseEstimatedValue: 620,
    historicalPeriod: '19th Century',
    description: 'Spring-loaded solid brass latch used to secure heavy companionway doors in rough seas.',
  },
  {
    id: 'enamel_bunk_washbasin',
    name: 'Enamel Bunk Washbasin',
    baseEstimatedValue: 480,
    historicalPeriod: '19th Century',
    description: 'Chipped white vitreous enamel sailor wash basin with rolled navy blue rim and minor sea wear.',
  },

  // --- HMS Resolute Frigate (65m) Batch 5 ---
  {
    id: 'brass_boatswain_fid',
    name: 'Turned Bronze Rigging Fid',
    baseEstimatedValue: 1150,
    historicalPeriod: 'Age of Sail',
    description: 'Heavy turned bronze splicing fid used for working thick manila lines and hemp standing rigging.',
  },
  {
    id: 'wood_rope_serving_mallet',
    name: 'Lignum-Vitae Serving Mallet',
    baseEstimatedValue: 950,
    historicalPeriod: 'Age of Sail',
    description: 'Dense dark hardwood serving mallet used to wind tarred marline tightly around standing shrouds.',
  },
  {
    id: 'stoneware_galley_crock',
    name: 'Salt-Glazed Galley Crock',
    baseEstimatedValue: 880,
    historicalPeriod: '18th Century',
    description: 'Cobalt-banded stoneware mess jar used to store sea-salted butter and pickled preserves.',
  },

  // --- Galleon San Sebastian (180m) Batch 5 ---
  {
    id: 'royal_charter_sovereign_seal',
    name: 'Royal Charter Sovereign Seal',
    baseEstimatedValue: 165000,
    historicalPeriod: '17th Century',
    description: 'Beeswax royal charter pendant medallion stamped with sovereign crest in a gilded silver pyx capsule.',
  },
  {
    id: 'admiral_garnet_signet_ring',
    name: "Admiral's Garnet Signet Ring",
    baseEstimatedValue: 110000,
    historicalPeriod: '17th Century',
    description: 'Solid 18k yellow gold signet ring featuring a deeply carved intaglio anchor in a cabochon garnet.',
  },
  {
    id: 'jeweled_scrimshaw_flask',
    name: 'Jeweled Scrimshaw Hip Flask',
    baseEstimatedValue: 62000,
    historicalPeriod: '18th Century',
    description: 'Marine ivory hip flask engraved with nautical scrimshaw, mounted with silver bands and small sapphires.',
  },

  // --- SS Arctic Star (340m) Batch 5 ---
  {
    id: 'tinned_salt_pork_canister',
    name: 'Tinned Salt Pork Canister',
    baseEstimatedValue: 2200,
    historicalPeriod: '19th Century',
    description: 'Sealed soldered tin ration canister stamped with naval victualling depot crest.',
  },
  {
    id: 'copper_deck_coal_scoop',
    name: 'Stokehold Copper Coal Scoop',
    baseEstimatedValue: 1850,
    historicalPeriod: 'Early 20th Century',
    description: 'Flared blackened copper and ash-wood coal shovel recovered from the boiler room debris.',
  },
  {
    id: 'galvanized_bucket_bracket',
    name: 'Galvanized Fire Bucket Bracket',
    baseEstimatedValue: 1400,
    historicalPeriod: 'Early 20th Century',
    description: 'Heavy galvanized marine wall bracket holding a flared stokehold safety fire bucket.',
  },

  // --- U-Boat Derelict IX-C (620m) Batch 5 ---
  {
    id: 'vulcanite_radio_headphones',
    name: 'Vulcanite Radio Headphones',
    baseEstimatedValue: 7800,
    historicalPeriod: 'Mid 20th Century',
    description: 'Twin wireless radio operator headphones with circular vulcanite ear-cups and braided cotton wiring.',
  },
  {
    id: 'copper_engine_oil_feeder',
    name: 'Reciprocating Engine Oil Feeder',
    baseEstimatedValue: 5200,
    historicalPeriod: '20th Century',
    description: 'Slender brass-tipped copper oiling can with thumb pump trigger used on heavy propulsion bearings.',
  },
  {
    id: 'zinc_hull_sacrificial_anode',
    name: 'Zinc Hull Sacrificial Anode',
    baseEstimatedValue: 3900,
    historicalPeriod: 'Mid 20th Century',
    description: 'Pitted teardrop marine zinc anode plate bolted to prevent electrolytic seawater corrosion.',
  },

  // --- Leviathan Pre-Dreadnought (1,400m) Batch 5 ---
  {
    id: 'cast_iron_deadlight_frame',
    name: 'Cast Iron Armor Deadlight Frame',
    baseEstimatedValue: 16500,
    historicalPeriod: 'Early 20th Century',
    description: 'Heavy circular bronze and iron armored viewport cover fitted with a thick green sea glass lens.',
  },
  {
    id: 'iron_hatch_dog_cleat',
    name: 'Forged Armor Hatch Dog Cleat',
    baseEstimatedValue: 12000,
    historicalPeriod: 'Early 20th Century',
    description: 'Drop-forged armor hatch locking dog with heavy threaded bronze wing tightening nut.',
  },
  {
    id: 'lead_sealing_pliers',
    name: 'Customs Cargo Sealing Pliers',
    baseEstimatedValue: 9400,
    historicalPeriod: 'Early 20th Century',
    description: 'Forged steel tamper-evident lever pliers with circular lead stamp dies used to secure freight holds.',
  },

  // --- SS Edmund Fitzgerald Deep (2,500m) Batch 5 ---
  {
    id: 'silver_chronometer_movement',
    name: 'Silvered Chronometer Movement',
    baseEstimatedValue: 78000,
    historicalPeriod: '19th Century',
    description: 'Precision spring-detent ship chronometer brass movement with gilded balance wheel and silvered dial.',
  },
  {
    id: 'brass_binnacle_gimbal_ring',
    name: 'Brass Binnacle Gimbal Ring',
    baseEstimatedValue: 28000,
    historicalPeriod: 'Early 20th Century',
    description: 'Heavy cast brass balanced double-pivot gimbal ring that maintained compass stability in heavy swells.',
  },
  {
    id: 'brass_draft_gauge_plaque',
    name: 'Stamped Bronze Draft Mark Plaque',
    baseEstimatedValue: 22000,
    historicalPeriod: '20th Century',
    description: 'Heavy stamped bronze Roman numeral waterline depth plate recovered from the bow stem.',
  },
];

export interface RecoveredTreasure {
  instanceId: string;
  treasureDefId: string;
  wreckSiteId: string;
  recoveredAt: number;
}

export interface ActiveAuctionListing {
  auctionId: string;
  treasure: RecoveredTreasure;
  startPrice: number;
  currentBid: number;
  finalHammerPrice: number;
  maxBuyerWillingness: number;
  bidsPlacedCount: number;
  durationSec: number;
  startedAt: number;
  concludesAt: number;
  highestBidderName: string;
  status: 'active' | 'sold' | 'unsold';
}

export interface ActiveSalvageExpedition {
  expeditionId: string;
  boatInstanceId: string;
  boatDefId: string;
  wreckSiteId: string;
  assignedCrewIds: string[];
  startTime: number;
  durationSec: number;
  endTime: number;
}

export interface SalvageState {
  unlocked: boolean; // Requires $20,000 charter
  unlockedWreckIds: string[]; // Site IDs
  wreckTreasureFoundCounts: Record<string, number>; // siteId -> count of treasures already recovered
  ownedSalvageBoatInstances: Array<{
    instanceId: string;
    boatDefId: string;
    purchasedAt: number;
    assignedCrewIds: string[];
  }>;
  recoveredVaultTreasures: RecoveredTreasure[];
  activeExpeditions: ActiveSalvageExpedition[];
  activeAuctions: ActiveAuctionListing[];
  totalEarningsFromAuctions: number;
  totalExpeditionsCompleted: number;
  discoveredArtifactIds: string[];
}

export const INITIAL_SALVAGE_STATE: SalvageState = {
  unlocked: false,
  unlockedWreckIds: ['smugglers_sloop'],
  wreckTreasureFoundCounts: {},
  ownedSalvageBoatInstances: [],
  recoveredVaultTreasures: [],
  activeExpeditions: [],
  activeAuctions: [],
  totalEarningsFromAuctions: 0,
  totalExpeditionsCompleted: 0,
  discoveredArtifactIds: [],
};

export function formatMinutesSeconds(totalSeconds: number): string {
  const sTotal = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(sTotal / 3600);
  const m = Math.floor((sTotal % 3600) / 60);
  const s = sTotal % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }
  if (m > 0) {
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }
  return `${s}s`;
}

export function getDiscoveredArtifactIds(state?: SalvageState | null): string[] {
  if (!state) return [];
  const ids = new Set<string>(state.discoveredArtifactIds || []);
  state.recoveredVaultTreasures?.forEach((t) => ids.add(t.treasureDefId));
  state.activeAuctions?.forEach((a) => ids.add(a.treasure.treasureDefId));
  return Array.from(ids);
}

export function getTreasureSpriteUrl(treasureDefId: string): string {
  return `./treasures/${treasureDefId}.png`;
}

export function getWreckRemainingTreasures(wreck: SunkenWreckSite, state: SalvageState): number {
  const allFound = new Set<string>([
    ...(state.discoveredArtifactIds || []),
    ...(state.recoveredVaultTreasures || []).map((t) => t.treasureDefId),
    ...(state.activeAuctions || []).map((a) => a.treasure.treasureDefId),
  ]);
  const unrecovered = wreck.treasureIds.filter((tid) => !allFound.has(tid));
  return unrecovered.length;
}

export function getWreckDiscoveredTreasures(wreck: SunkenWreckSite, state: SalvageState): TreasureItemDef[] {
  const allFound = new Set<string>([
    ...(state.discoveredArtifactIds || []),
    ...(state.recoveredVaultTreasures || []).map((t) => t.treasureDefId),
    ...(state.activeAuctions || []).map((a) => a.treasure.treasureDefId),
  ]);
  return TREASURE_CATALOG.filter((t) => wreck.treasureIds.includes(t.id) && allFound.has(t.id));
}

export function isWreckFullyScavenged(wreck: SunkenWreckSite, state: SalvageState): number {
  return getWreckRemainingTreasures(wreck, state) === 0 ? 1 : 0;
}

export function rollRecoveredTreasuresForVoyage(
  wreck: SunkenWreckSite,
  boat: SalvageBoatDef,
  state: SalvageState
): RecoveredTreasure[] {
  const allFound = new Set<string>([
    ...(state.discoveredArtifactIds || []),
    ...(state.recoveredVaultTreasures || []).map((t) => t.treasureDefId),
    ...(state.activeAuctions || []).map((a) => a.treasure.treasureDefId),
  ]);

  const pool = wreck.treasureIds.filter((tid) => !allFound.has(tid));
  if (pool.length === 0) return [];

  const take = Math.min(boat.cargoCapacity, pool.length);
  const now = Date.now();
  const results: RecoveredTreasure[] = [];

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  for (let i = 0; i < take; i++) {
    const chosenId = shuffled[i];
    results.push({
      instanceId: `t_${now}_${i}_${Math.random().toString(36).substring(2, 7)}`,
      treasureDefId: chosenId,
      wreckSiteId: wreck.id,
      recoveredAt: now,
    });
  }

  return results;
}

export function calculateExpeditionDurationSec(
  wreck: SunkenWreckSite,
  boatDef: SalvageBoatDef
): number {
  // Depth scaling: shallow coastal (0.61x) to hadal abyss (1.70x)
  const depthMultiplier = 0.6 + (wreck.depthMeters / 2500) * 1.1;

  // Base boat duration calibrated to boat size and cargo capacity:
  // Dory (1 cargo): ~12 min base
  // Trawler (3 cargo): ~26 min base
  // Tug (6 cargo): ~50 min base (32m to 1h 25m)
  // Oceanic Explorer (12 cargo): ~110 min base (1h 11m to 3h 07m)
  let baseBoatSec = 720;
  if (boatDef.id === 'dredge_trawler') {
    baseBoatSec = 1600;
  } else if (boatDef.id === 'salvage_tug') {
    baseBoatSec = 3000;
  } else if (boatDef.id === 'oceanic_explorer') {
    baseBoatSec = 6600;
  }

  const rawSec = Math.round(baseBoatSec * depthMultiplier);
  return Math.max(60, rawSec);
}

export function createAuctionListing(
  treasure: RecoveredTreasure,
  startingBid: number,
  durationSec = 50
): ActiveAuctionListing {
  const def = TREASURE_CATALOG.find((t) => t.id === treasure.treasureDefId) || TREASURE_CATALOG[0];
  
  // Random collector willingness to pay: between 0.85x and 1.95x base estimated value
  const buyerWillingnessMultiplier = 0.85 + Math.random() * 1.1;
  const maxBuyerWillingness = Math.round(def.baseEstimatedValue * buyerWillingnessMultiplier);

  const bidderNames = [
    'Lord Alistair Sterling',
    'Curator Evelyn Vance',
    'Marquis de Lafayette Gallery',
    'Sir Montgomery Fox',
    'Maritime Historical Society',
    'Captain Thaddeus Horn',
    'Duchess Helena of Solent',
    'Newport Antiquities Trust',
    'Admiral Finch Collectorate',
    'High Seas Numismatics',
  ];
  const highestBidderName = bidderNames[Math.floor(Math.random() * bidderNames.length)];

  const isTooHigh = startingBid > maxBuyerWillingness;
  let finalHammerPrice = startingBid;
  if (!isTooHigh) {
    const surge = 0.88 + Math.random() * 0.24;
    finalHammerPrice = Math.round(Math.max(startingBid, maxBuyerWillingness * surge));
  }

  const now = Date.now();
  return {
    auctionId: `auc_${now}_${Math.random().toString(36).substring(2, 7)}`,
    treasure,
    startPrice: startingBid,
    currentBid: startingBid,
    finalHammerPrice,
    maxBuyerWillingness,
    bidsPlacedCount: isTooHigh ? 0 : 1,
    durationSec,
    startedAt: now,
    concludesAt: now + durationSec * 1000,
    highestBidderName,
    status: 'active',
  };
}

// ============================================
// textures.js — Procedural Texture Atlas + Block Definitions
// ============================================
import * as THREE from 'three';
import { seededRandom } from './noise.js?v=116';

// Block type IDs
export const BLOCKS = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    SAND: 4,
    WATER: 5,
    WOOD: 6,
    LEAVES: 7,
    PLANKS: 8,
    OAK_PLANKS: 8,
    COBBLESTONE: 9,
    IRON_ORE: 10,
    GOLD_ORE: 11,
    CRYSTAL_ORE: 12,
    MANA_ORE: 13,
    OBSIDIAN: 14,
    GLOWSTONE: 15,
    DUNGEON_BRICK: 16,
    DUNGEON_FLOOR: 17,
    MUSHROOM_STEM: 18,
    MUSHROOM_CAP: 19,
    ALIEN_STONE: 20,
    ALIEN_GRASS: 21,
    ALIEN_CRYSTAL: 22,
    SNOW: 23,
    ICE: 24,
    LAVA: 25,
    PORTAL_FRAME: 26,
    PORTAL: 27,
    BEDROCK: 28,
    GRAVEL: 29,
    CLAY: 30,
    GLASS: 31,
    TORCH: 32,
    SANDSTONE: 33,
    RED_SAND: 34,
    TERRACOTTA: 35,
    DEAD_BUSH: 36,
    ALIEN_TALL_GRASS: 37,
    SAVANNA_GRASS: 38,
    ACACIA_WOOD: 39,
    ACACIA_LEAVES: 40,
    MUD: 41,
    SWAMP_GRASS: 42,
    SWAMP_WATER: 43,
    ALIEN_SPORE_STEM: 44,
    ALIEN_SPORE_BLOCK: 45,
    VINES: 46,
    TALL_GRASS: 47,
    RED_FLOWER: 48,
    CACTUS: 49,
    BLUE_FLOWER: 50,
    YELLOW_FLOWER: 51,
    FERN: 52,
    TALL_FERN: 143,
    TALL_FERN_TOP: 144,
    WHITE_FLOWER: 53,
    PURPLE_FLOWER: 185,
    ORANGE_FLOWER: 186,
    CHERRY_LOG: 54,
    CHERRY_LEAVES: 55,
    PINK_PETALS: 56,
    AUTUMN_WOOD: 57,
    AUTUMN_LEAVES: 58,
    FALLEN_LEAVES: 59,
    GLOW_STEM: 60,
    GLOW_LEAVES: 61,
    GLOW_SHROOM: 62,
    PALM_WOOD: 63,
    PALM_LEAVES: 64,
    OASIS_FERN: 65,
    DUNGEON_FIRE_BRICK: 66,
    DUNGEON_FIRE_FLOOR: 67,
    DUNGEON_ICE_BRICK: 68,
    DUNGEON_ICE_FLOOR: 69,
    DUNGEON_JUNGLE_BRICK: 70,
    DUNGEON_JUNGLE_FLOOR: 71,
    DUNGEON_DESERT_BRICK: 72,
    DUNGEON_DESERT_FLOOR: 73,
    DUNGEON_UNDEAD_BRICK: 74,
    DUNGEON_UNDEAD_FLOOR: 75,
    DUNGEON_DOOR: 76,
    DUNGEON_DOOR_TOP: 194,
    BOSS_SPAWNER: 77,
    COAL_ORE: 78,
    DIAMOND_ORE: 79,
    STONE_BRICKS: 80,
    BRICKS: 81,
    BOOKSHELF: 82,
    MOSSY_COBBLESTONE: 83,
    CHEST_BLOCK: 84,
    LADDER: 85,
    IRON_BLOCK: 86,
    GOLD_BLOCK: 87,
    DIAMOND_BLOCK: 88,
    WOOL: 89,
    FURNACE: 90,
    NETHERRACK: 91,
    SOUL_SAND: 92,
    NETHER_BRICKS: 93,
    CRIMSON_NYLIUM: 94,
    CRIMSON_STEM: 95,
    CRIMSON_LEAVES: 96,
    NETHER_WART_BLOCK: 97,
    TUBE_CORAL: 98,
    BRAIN_CORAL: 99,
    FIRE_CORAL: 100,
    HORN_CORAL: 101,
    PINE_WOOD: 102,
    PINE_LEAVES: 103,
    ACACIA_PLANKS: 104,
    CHERRY_PLANKS: 105,
    AUTUMN_PLANKS: 106,
    PALM_PLANKS: 107,
    PINE_PLANKS: 108,
    CRIMSON_PLANKS: 109,
    SUGARCANE: 110,
    FIRE: 111,
    TNT: 112,
    CRAFTING_TABLE: 113,
    AETHER_STONE: 114,
    AETHER_DIRT: 115,
    AETHER_GRASS: 116,
    AETHER_WOOD: 117,
    AETHER_LEAVES: 118,
    AETHER_PORTAL: 119,
    AETHER_CLOUD: 120,
    AETHER_TALL_GRASS: 121,
    AETHER_FLOWER: 122,
    AETHER_CRYSTAL: 123,
    CAVERN_STONE: 124,
    CAVERN_DIRT: 125,
    CAVERN_PORTAL: 126,
    MAGMA_STONE: 127,
    HIGHLANDS_STONE: 128,
    HIGHLANDS_DIRT: 129,
    HIGHLANDS_GRASS: 130,
    HIGHLANDS_PORTAL: 131,
    SEAGRASS: 132,
    KELP: 133,
    BUBBLE_CORAL: 134,
    LILY_PAD: 138,
    ALGAE: 139,
    RED_KELP: 140,
    BROWN_KELP: 141,
    QUICKSOIL: 187,
    HOLYSTONE: 188,
    ENCHANTED_AETHER_LOG: 189,
    ENCHANTED_AETHER_LEAVES: 190,
    DARK_OAK_WOOD: 191,
    DARK_OAK_LEAVES: 192,
    DARK_OAK_PLANKS: 193,
    CRYING_OBSIDIAN: 195,
    MYCELIUM: 196,
    WARPED_NYLIUM: 197,
    WARPED_STEM: 198,
    WARPED_WART_BLOCK: 199,
    WARPED_ROOTS: 200,
    TWISTING_VINES: 201,
    NETHER_SPROUTS: 202,
    SOUL_SOIL: 203,
    BONE_BLOCK: 204,
    SOUL_FIRE: 205,
    BASALT: 206,
    SMOOTH_BASALT: 207,
    MAGMA: 208,
    BLACKSTONE: 209,
    SHROOMLIGHT: 210,
    ZANITE_ORE: 211,
    GRAVITITE_ORE: 212,
    AMBROSIUM_ORE: 213,
    CARVED_HOLYSTONE: 214,
    SENTRY_STONE: 215,
    BLUE_AERCLOUD: 216,
    GOLDEN_AERCLOUD: 217,
    GOLDEN_OAK_WOOD: 218,
    GOLDEN_OAK_LEAVES: 219,
    MAGIC_WOOD: 220,
    MAGIC_LEAVES: 221,
    REDWOOD_LOG: 222,
    REDWOOD_LEAVES: 223,
    LAVENDER: 224,
    PODZOL: 225,
    RUBY_ORE: 226,
    SAPPHIRE_ORE: 227,
    FLETCHING_TABLE: 142,
    SMOKER: 145,
    STONECUTTER: 149,
    EMERALD_BLOCK: 150,
    LAPIS_BLOCK: 151,
    REDSTONE_BLOCK: 152,
    COAL_BLOCK: 153,
    RED_MUSHROOM: 228,
    BROWN_MUSHROOM: 229,
    BROWN_MUSHROOM_BLOCK: 230,
    MANGROVE_LOG: 231,
    MANGROVE_LEAVES: 232,
    MANGROVE_ROOTS: 233,
    MUDDY_MANGROVE_ROOTS: 234,
    MANGROVE_PLANKS: 235,
    MOSS_BLOCK: 236,
    ROOTED_DIRT: 237,
    CAVE_VINES: 238,
    SPORE_BLOSSOM: 239,
    AZALEA_LEAVES: 240,
    FLOWERING_AZALEA_LEAVES: 241,
    DRIPSTONE_BLOCK: 242,
    POINTED_DRIPSTONE_DOWN: 243,
    POINTED_DRIPSTONE_UP: 244,
    BIRCH_WOOD: 245,
    BIRCH_LEAVES: 246,
    BIRCH_PLANKS: 247,
    KELP_PLANT: 248,
    OAK_SLAB: 249,
    COBBLESTONE_SLAB: 250,
    STONE_SLAB: 251,
    BIRCH_SLAB: 252,
    OAK_STAIRS: 253,
    COBBLESTONE_STAIRS: 254,
    STONE_STAIRS: 255,
    BIRCH_STAIRS: 256,
    OAK_FENCE: 257,
    BIRCH_FENCE: 258,
    COBBLESTONE_WALL: 259,
    STONE_BRICK_WALL: 260,
    OAK_FENCE_GATE: 261,
    BIRCH_FENCE_GATE: 262,
    WHITE_WOOL: 89,
    RED_WOOL: 263,
    BLUE_WOOL: 264,
    YELLOW_WOOL: 265,
    GREEN_WOOL: 266,
    BLACK_WOOL: 267,
    PURPLE_WOOL: 268,
    ORANGE_WOOL: 269,
    PINK_WOOL: 270,
    CYAN_WOOL: 271,
    LIME_WOOL: 272,
    GRAY_WOOL: 273,
    LIGHT_BLUE_WOOL: 274,
    BROWN_WOOL: 275,
    MAGENTA_WOOL: 276,
    LIGHT_GRAY_WOOL: 277,
    RED_BED: 278,
    WHITE_BED: 279,
    BLUE_BED: 280,
    YELLOW_BED: 281,
    GREEN_BED: 282,
    BLACK_BED: 283,
    PURPLE_BED: 284,
    ORANGE_BED: 285,
    PINK_BED: 286,
    CYAN_BED: 287,
    LIME_BED: 288,
    GRAY_BED: 289,
    LIGHT_BLUE_BED: 290,
    BROWN_BED: 291,
    MAGENTA_BED: 292,
    LIGHT_GRAY_BED: 293,
    BED_HEAD: 294,

    // Additional Wood Fences & Gates
    SPRUCE_FENCE: 295,
    JUNGLE_FENCE: 296,
    ACACIA_FENCE: 297,
    DARK_OAK_FENCE: 298,
    MANGROVE_FENCE: 299,
    CHERRY_FENCE: 300,
    CRIMSON_FENCE: 301,
    AUTUMN_FENCE: 302,

    SPRUCE_FENCE_GATE: 303,
    JUNGLE_FENCE_GATE: 304,
    ACACIA_FENCE_GATE: 305,
    DARK_OAK_FENCE_GATE: 306,
    MANGROVE_FENCE_GATE: 307,
    CHERRY_FENCE_GATE: 308,
    CRIMSON_FENCE_GATE: 309,
    AUTUMN_FENCE_GATE: 310,

    // Additional Stone Walls
    MOSSY_COBBLESTONE_WALL: 311,
    STONE_WALL: 312,
    SANDSTONE_WALL: 313,
    BLACKSTONE_WALL: 314,
    HOLYSTONE_WALL: 315,

    // Additional Fences, Gates & Masonry
    WARPED_FENCE: 316,
    WARPED_FENCE_GATE: 317,
    BRICK_WALL: 318,
    NETHER_BRICK_WALL: 319,
    POLISHED_BLACKSTONE_BRICKS: 320,
    CHISELED_POLISHED_BLACKSTONE: 321,

    // Lanterns
    LANTERN: 322,
    SOUL_LANTERN: 323,

    // Packed & Blue Ice
    PACKED_ICE: 324,
    BLUE_ICE: 325,

    // The End Dimension Blocks
    END_PORTAL_FRAME_EYE: 326,
    END_PORTAL: 327,
    END_STONE: 328,
    DRAGON_EGG: 329,
    CHORUS_PLANT: 330,
    CHORUS_FLOWER: 331,
    CHORUS_FLOWER_DEAD: 332,
    END_GATEWAY: 333,
    SWEET_BERRY_BUSH: 334,
    EMERALD_ORE: 335,
    MELON: 336,
    JUNGLE_LOG: 337,
    JUNGLE_LEAVES: 338,
    ORANGE_TERRACOTTA: 339,
    YELLOW_TERRACOTTA: 340,
    WHITE_TERRACOTTA: 341,
    BROWN_TERRACOTTA: 342,
    RED_TERRACOTTA: 343,
    LIGHT_GRAY_TERRACOTTA: 344,
    NETHER_QUARTZ_ORE: 345,
    NETHER_GOLD_ORE: 346,

    // Farming & Crops
    FARMLAND: 347,
    FARMLAND_MOIST: 348,
    WHEAT_0: 349,
    WHEAT_1: 350,
    WHEAT_2: 351,
    WHEAT_3: 352,
    WHEAT_4: 353,
    WHEAT_5: 354,
    WHEAT_6: 355,
    WHEAT_7: 356,
    CARROTS_0: 357,
    CARROTS_1: 358,
    CARROTS_2: 359,
    CARROTS_3: 360,
    POTATOES_0: 361,
    POTATOES_1: 362,
    POTATOES_2: 363,
    POTATOES_3: 364,
    BEETROOTS_0: 365,
    BEETROOTS_1: 366,
    BEETROOTS_2: 367,
    PUMPKIN: 370,
    PUMPKIN_STEM: 371,
    MELON_STEM: 372,
    OAK_SAPLING: 373,
    SPRUCE_SAPLING: 374,
    BIRCH_SAPLING: 375,
    JUNGLE_SAPLING: 376,
    ACACIA_SAPLING: 377,
    DARK_OAK_SAPLING: 378,
    SCULK: 379,
    SCULK_CATALYST: 380,
    DIRT_PATH: 383,
    SLIME_BLOCK: 384
};

// Block properties
const BLOCK_PROPS = {
    [BLOCKS.FARMLAND]:              { name: 'Farmland',              health: 2, transparent: true, emissive: 0, solid: true, isFarmland: true, drops: BLOCKS.DIRT },
    [BLOCKS.FARMLAND_MOIST]:        { name: 'Moist Farmland',        health: 2, transparent: true, emissive: 0, solid: true, isFarmland: true, drops: BLOCKS.DIRT },
    [BLOCKS.PUMPKIN]:               { name: 'Pumpkin',               health: 5, transparent: false, emissive: 0, solid: true, drops: BLOCKS.PUMPKIN },
    [BLOCKS.WHEAT_0]:               { name: 'Wheat Crop',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'wheat_seeds' },
    [BLOCKS.WHEAT_1]:               { name: 'Wheat Crop',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'wheat_seeds' },
    [BLOCKS.WHEAT_2]:               { name: 'Wheat Crop',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'wheat_seeds' },
    [BLOCKS.WHEAT_3]:               { name: 'Wheat Crop',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'wheat_seeds' },
    [BLOCKS.WHEAT_4]:               { name: 'Wheat Crop',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'wheat_seeds' },
    [BLOCKS.WHEAT_5]:               { name: 'Wheat Crop',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'wheat_seeds' },
    [BLOCKS.WHEAT_6]:               { name: 'Wheat Crop',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'wheat_seeds' },
    [BLOCKS.WHEAT_7]:               { name: 'Wheat Crop',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'wheat' },
    [BLOCKS.CARROTS_0]:             { name: 'Carrots',               health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'carrot' },
    [BLOCKS.CARROTS_1]:             { name: 'Carrots',               health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'carrot' },
    [BLOCKS.CARROTS_2]:             { name: 'Carrots',               health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'carrot' },
    [BLOCKS.CARROTS_3]:             { name: 'Carrots',               health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'carrot' },
    [BLOCKS.POTATOES_0]:            { name: 'Potatoes',              health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'potato' },
    [BLOCKS.POTATOES_1]:            { name: 'Potatoes',              health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'potato' },
    [BLOCKS.POTATOES_2]:            { name: 'Potatoes',              health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'potato' },
    [BLOCKS.POTATOES_3]:            { name: 'Potatoes',              health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'potato' },
    [BLOCKS.BEETROOTS_0]:           { name: 'Beetroots',             health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'beetroot_seeds' },
    [BLOCKS.BEETROOTS_1]:           { name: 'Beetroots',             health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'beetroot_seeds' },
    [BLOCKS.BEETROOTS_2]:           { name: 'Beetroots',             health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'beetroot_seeds' },
    [BLOCKS.BEETROOTS_3]:           { name: 'Beetroots',             health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'beetroot' },
    [BLOCKS.PUMPKIN_STEM]:          { name: 'Pumpkin Stem',          health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'pumpkin_seeds' },
    [BLOCKS.MELON_STEM]:            { name: 'Melon Stem',            health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isCrop: true, drops: 'melon_seeds' },
    [BLOCKS.NETHER_QUARTZ_ORE]:     { name: 'Nether Quartz Ore',     health: 6, transparent: false, emissive: 0, solid: true, drops: 'quartz' },
    [BLOCKS.NETHER_GOLD_ORE]:       { name: 'Nether Gold Ore',       health: 6, transparent: false, emissive: 0, solid: true, drops: 'gold_nugget' },
    [BLOCKS.EMERALD_ORE]:           { name: 'Emerald Ore',           health: 8, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.MELON]:                 { name: 'Melon',                 health: 4, transparent: false, emissive: 0, solid: true, drops: 'melon_slice' },
    [BLOCKS.JUNGLE_LOG]:            { name: 'Jungle Log',            health: 6, transparent: false, emissive: 0, solid: true, drops: BLOCKS.JUNGLE_LOG, isLog: true, hasFacing: true },
    [BLOCKS.JUNGLE_LEAVES]:         { name: 'Jungle Leaves',         health: 1, transparent: true, emissive: 0, solid: true, drops: null, isLeaves: true, flammable: true },
    [BLOCKS.ORANGE_TERRACOTTA]:     { name: 'Orange Terracotta',     health: 8, transparent: false, emissive: 0, solid: true, drops: BLOCKS.ORANGE_TERRACOTTA },
    [BLOCKS.YELLOW_TERRACOTTA]:     { name: 'Yellow Terracotta',     health: 8, transparent: false, emissive: 0, solid: true, drops: BLOCKS.YELLOW_TERRACOTTA },
    [BLOCKS.WHITE_TERRACOTTA]:      { name: 'White Terracotta',      health: 8, transparent: false, emissive: 0, solid: true, drops: BLOCKS.WHITE_TERRACOTTA },
    [BLOCKS.BROWN_TERRACOTTA]:      { name: 'Brown Terracotta',      health: 8, transparent: false, emissive: 0, solid: true, drops: BLOCKS.BROWN_TERRACOTTA },
    [BLOCKS.RED_TERRACOTTA]:        { name: 'Red Terracotta',        health: 8, transparent: false, emissive: 0, solid: true, drops: BLOCKS.RED_TERRACOTTA },
    [BLOCKS.LIGHT_GRAY_TERRACOTTA]: { name: 'Light Gray Terracotta', health: 8, transparent: false, emissive: 0, solid: true, drops: BLOCKS.LIGHT_GRAY_TERRACOTTA },
    [BLOCKS.END_PORTAL_FRAME_EYE]:  { name: 'End Portal Frame',      health: 20, transparent: true, emissive: 0.6, solid: true, drops: null },
    [BLOCKS.END_PORTAL]:            { name: 'End Portal',            health: 0, transparent: true, emissive: 1.0, solid: false, drops: null, isEndPortal: true },
    [BLOCKS.END_STONE]:             { name: 'End Stone',             health: 15, transparent: false, emissive: 0, solid: true, drops: BLOCKS.END_STONE },
    [BLOCKS.DRAGON_EGG]:            { name: 'Dragon Egg',            health: 15, transparent: true, emissive: 0.4, solid: true, drops: BLOCKS.DRAGON_EGG },
    [BLOCKS.CHORUS_PLANT]:          { name: 'Chorus Plant',          health: 1, transparent: true, emissive: 0, solid: true, drops: null, isChorusPlant: true },
    [BLOCKS.CHORUS_FLOWER]:         { name: 'Chorus Flower',         health: 1, transparent: true, emissive: 0.25, solid: true, drops: BLOCKS.CHORUS_FLOWER, isChorusFlower: true },
    [BLOCKS.CHORUS_FLOWER_DEAD]:    { name: 'Dead Chorus Flower',    health: 1, transparent: true, emissive: 0, solid: true, drops: null },
    [BLOCKS.END_GATEWAY]:           { name: 'End Gateway',           health: -1, transparent: true, emissive: 1.0, solid: false, drops: null, isEndGateway: true },
    [BLOCKS.SWEET_BERRY_BUSH]:      { name: 'Sweet Berry Bush',      health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isFlora: true, drops: null },
    [BLOCKS.PACKED_ICE]:            { name: 'Packed Ice',            health: 4, transparent: false, emissive: 0, solid: true, drops: BLOCKS.PACKED_ICE },
    [BLOCKS.BLUE_ICE]:              { name: 'Blue Ice',              health: 5, transparent: false, emissive: 0.05, solid: true, drops: BLOCKS.BLUE_ICE },
    [BLOCKS.LANTERN]:               { name: 'Lantern',               health: 4, transparent: true, emissive: 1.0, solid: false, drops: BLOCKS.LANTERN, isLantern: true, lightLevel: 15 },
    [BLOCKS.SOUL_LANTERN]:          { name: 'Soul Lantern',          health: 4, transparent: true, emissive: 0.8, solid: false, drops: BLOCKS.SOUL_LANTERN, isLantern: true, isSoulLantern: true, lightLevel: 10 },
    [BLOCKS.SPRUCE_FENCE]:          { name: 'Spruce Fence',          health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.SPRUCE_FENCE, flammable: true, isFence: true },
    [BLOCKS.JUNGLE_FENCE]:          { name: 'Jungle Fence',          health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.JUNGLE_FENCE, flammable: true, isFence: true },
    [BLOCKS.ACACIA_FENCE]:          { name: 'Acacia Fence',          health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.ACACIA_FENCE, flammable: true, isFence: true },
    [BLOCKS.DARK_OAK_FENCE]:        { name: 'Dark Oak Fence',        health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.DARK_OAK_FENCE, flammable: true, isFence: true },
    [BLOCKS.MANGROVE_FENCE]:        { name: 'Mangrove Fence',        health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.MANGROVE_FENCE, flammable: true, isFence: true },
    [BLOCKS.CHERRY_FENCE]:          { name: 'Cherry Fence',          health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.CHERRY_FENCE, flammable: true, isFence: true },
    [BLOCKS.CRIMSON_FENCE]:         { name: 'Crimson Fence',         health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.CRIMSON_FENCE, flammable: true, isFence: true },
    [BLOCKS.AUTUMN_FENCE]:          { name: 'Autumn Fence',          health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.AUTUMN_FENCE, flammable: true, isFence: true },
    [BLOCKS.WARPED_FENCE]:          { name: 'Warped Fence',          health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.WARPED_FENCE, flammable: false, isFence: true },

    [BLOCKS.SPRUCE_FENCE_GATE]:     { name: 'Spruce Fence Gate',     health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.SPRUCE_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.JUNGLE_FENCE_GATE]:     { name: 'Jungle Fence Gate',     health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.JUNGLE_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.ACACIA_FENCE_GATE]:     { name: 'Acacia Fence Gate',     health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.ACACIA_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.DARK_OAK_FENCE_GATE]:   { name: 'Dark Oak Fence Gate',   health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.DARK_OAK_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.MANGROVE_FENCE_GATE]:   { name: 'Mangrove Fence Gate',   health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.MANGROVE_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.CHERRY_FENCE_GATE]:     { name: 'Cherry Fence Gate',     health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.CHERRY_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.CRIMSON_FENCE_GATE]:    { name: 'Crimson Fence Gate',    health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.CRIMSON_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.AUTUMN_FENCE_GATE]:     { name: 'Autumn Fence Gate',     health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.AUTUMN_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.WARPED_FENCE_GATE]:     { name: 'Warped Fence Gate',     health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.WARPED_FENCE_GATE, flammable: false, isFenceGate: true, hasFacing: true },

    [BLOCKS.MOSSY_COBBLESTONE_WALL]:{ name: 'Mossy Cobblestone Wall',health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.MOSSY_COBBLESTONE_WALL, isWall: true },
    [BLOCKS.STONE_WALL]:            { name: 'Stone Wall',            health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.STONE_WALL, isWall: true },
    [BLOCKS.SANDSTONE_WALL]:        { name: 'Sandstone Wall',        health: 5, transparent: true, emissive: 0, solid: true, drops: BLOCKS.SANDSTONE_WALL, isWall: true },
    [BLOCKS.BLACKSTONE_WALL]:       { name: 'Blackstone Wall',       health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BLACKSTONE_WALL, isWall: true },
    [BLOCKS.HOLYSTONE_WALL]:        { name: 'Holystone Wall',        health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.HOLYSTONE_WALL, isWall: true },
    [BLOCKS.BRICK_WALL]:            { name: 'Brick Wall',            health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BRICK_WALL, isWall: true },
    [BLOCKS.NETHER_BRICK_WALL]:     { name: 'Nether Brick Wall',     health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.NETHER_BRICK_WALL, isWall: true },
    [BLOCKS.POLISHED_BLACKSTONE_BRICKS]: { name: 'Polished Blackstone Bricks', health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CHISELED_POLISHED_BLACKSTONE]: { name: 'Chiseled Polished Blackstone', health: 8, transparent: false, emissive: 0, solid: true, drops: null },

    [BLOCKS.RED_WOOL]:              { name: 'Red Wool',              health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.RED_WOOL, flammable: true, isWool: true },
    [BLOCKS.BLUE_WOOL]:             { name: 'Blue Wool',             health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.BLUE_WOOL, flammable: true, isWool: true },
    [BLOCKS.YELLOW_WOOL]:           { name: 'Yellow Wool',           health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.YELLOW_WOOL, flammable: true, isWool: true },
    [BLOCKS.GREEN_WOOL]:            { name: 'Green Wool',            health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.GREEN_WOOL, flammable: true, isWool: true },
    [BLOCKS.BLACK_WOOL]:            { name: 'Black Wool',            health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.BLACK_WOOL, flammable: true, isWool: true },
    [BLOCKS.PURPLE_WOOL]:           { name: 'Purple Wool',           health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.PURPLE_WOOL, flammable: true, isWool: true },
    [BLOCKS.ORANGE_WOOL]:           { name: 'Orange Wool',           health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.ORANGE_WOOL, flammable: true, isWool: true },
    [BLOCKS.PINK_WOOL]:             { name: 'Pink Wool',             health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.PINK_WOOL, flammable: true, isWool: true },
    [BLOCKS.CYAN_WOOL]:             { name: 'Cyan Wool',             health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.CYAN_WOOL, flammable: true, isWool: true },
    [BLOCKS.LIME_WOOL]:             { name: 'Lime Wool',             health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.LIME_WOOL, flammable: true, isWool: true },
    [BLOCKS.GRAY_WOOL]:             { name: 'Gray Wool',             health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.GRAY_WOOL, flammable: true, isWool: true },
    [BLOCKS.LIGHT_BLUE_WOOL]:       { name: 'Light Blue Wool',       health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.LIGHT_BLUE_WOOL, flammable: true, isWool: true },
    [BLOCKS.BROWN_WOOL]:            { name: 'Brown Wool',            health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.BROWN_WOOL, flammable: true, isWool: true },
    [BLOCKS.MAGENTA_WOOL]:          { name: 'Magenta Wool',          health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.MAGENTA_WOOL, flammable: true, isWool: true },
    [BLOCKS.LIGHT_GRAY_WOOL]:       { name: 'Light Gray Wool',       health: 2, transparent: false, emissive: 0, solid: true, drops: BLOCKS.LIGHT_GRAY_WOOL, flammable: true, isWool: true },

    [BLOCKS.RED_BED]:               { name: 'Red Bed',               health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.RED_BED, flammable: true, isBed: true, bedColor: 'red', hasFacing: true },
    [BLOCKS.WHITE_BED]:             { name: 'White Bed',             health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.WHITE_BED, flammable: true, isBed: true, bedColor: 'white', hasFacing: true },
    [BLOCKS.BLUE_BED]:              { name: 'Blue Bed',              health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BLUE_BED, flammable: true, isBed: true, bedColor: 'blue', hasFacing: true },
    [BLOCKS.YELLOW_BED]:            { name: 'Yellow Bed',            health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.YELLOW_BED, flammable: true, isBed: true, bedColor: 'yellow', hasFacing: true },
    [BLOCKS.GREEN_BED]:             { name: 'Green Bed',             health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.GREEN_BED, flammable: true, isBed: true, bedColor: 'green', hasFacing: true },
    [BLOCKS.BLACK_BED]:             { name: 'Black Bed',             health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BLACK_BED, flammable: true, isBed: true, bedColor: 'black', hasFacing: true },
    [BLOCKS.PURPLE_BED]:            { name: 'Purple Bed',            health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.PURPLE_BED, flammable: true, isBed: true, bedColor: 'purple', hasFacing: true },
    [BLOCKS.ORANGE_BED]:            { name: 'Orange Bed',            health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.ORANGE_BED, flammable: true, isBed: true, bedColor: 'orange', hasFacing: true },
    [BLOCKS.PINK_BED]:              { name: 'Pink Bed',              health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.PINK_BED, flammable: true, isBed: true, bedColor: 'pink', hasFacing: true },
    [BLOCKS.CYAN_BED]:              { name: 'Cyan Bed',              health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.CYAN_BED, flammable: true, isBed: true, bedColor: 'cyan', hasFacing: true },
    [BLOCKS.LIME_BED]:              { name: 'Lime Bed',              health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.LIME_BED, flammable: true, isBed: true, bedColor: 'lime', hasFacing: true },
    [BLOCKS.GRAY_BED]:              { name: 'Gray Bed',              health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.GRAY_BED, flammable: true, isBed: true, bedColor: 'gray', hasFacing: true },
    [BLOCKS.LIGHT_BLUE_BED]:        { name: 'Light Blue Bed',        health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.LIGHT_BLUE_BED, flammable: true, isBed: true, bedColor: 'light_blue', hasFacing: true },
    [BLOCKS.BROWN_BED]:             { name: 'Brown Bed',             health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BROWN_BED, flammable: true, isBed: true, bedColor: 'brown', hasFacing: true },
    [BLOCKS.MAGENTA_BED]:           { name: 'Magenta Bed',           health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.MAGENTA_BED, flammable: true, isBed: true, bedColor: 'magenta', hasFacing: true },
    [BLOCKS.LIGHT_GRAY_BED]:        { name: 'Light Gray Bed',        health: 3, transparent: true, emissive: 0, solid: true, drops: BLOCKS.LIGHT_GRAY_BED, flammable: true, isBed: true, bedColor: 'light_gray', hasFacing: true },
    [BLOCKS.BED_HEAD]:              { name: 'Bed Head',              health: 3, transparent: true, emissive: 0, solid: true, drops: null, flammable: true, isBedHead: true },

    [BLOCKS.OAK_SLAB]:              { name: 'Oak Slab',              health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.OAK_SLAB, flammable: true, isSlab: true },
    [BLOCKS.COBBLESTONE_SLAB]:        { name: 'Cobblestone Slab',        health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.COBBLESTONE_SLAB, isSlab: true },
    [BLOCKS.STONE_SLAB]:              { name: 'Stone Slab',              health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.STONE_SLAB, isSlab: true },
    [BLOCKS.BIRCH_SLAB]:            { name: 'Birch Slab',            health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BIRCH_SLAB, flammable: true, isSlab: true },
    [BLOCKS.OAK_STAIRS]:            { name: 'Oak Stairs',            health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.OAK_STAIRS, flammable: true, isStair: true, hasFacing: true },
    [BLOCKS.COBBLESTONE_STAIRS]:    { name: 'Cobblestone Stairs',    health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.COBBLESTONE_STAIRS, isStair: true, hasFacing: true },
    [BLOCKS.STONE_STAIRS]:          { name: 'Stone Stairs',          health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.STONE_STAIRS, isStair: true, hasFacing: true },
    [BLOCKS.BIRCH_STAIRS]:          { name: 'Birch Stairs',          health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BIRCH_STAIRS, flammable: true, isStair: true, hasFacing: true },
    [BLOCKS.OAK_FENCE]:             { name: 'Oak Fence',             health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.OAK_FENCE, flammable: true, isFence: true },
    [BLOCKS.BIRCH_FENCE]:           { name: 'Birch Fence',           health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BIRCH_FENCE, flammable: true, isFence: true },
    [BLOCKS.COBBLESTONE_WALL]:      { name: 'Cobblestone Wall',      health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.COBBLESTONE_WALL, isWall: true },
    [BLOCKS.STONE_BRICK_WALL]:      { name: 'Stone Brick Wall',      health: 6, transparent: true, emissive: 0, solid: true, drops: BLOCKS.STONE_BRICK_WALL, isWall: true },
    [BLOCKS.OAK_FENCE_GATE]:        { name: 'Oak Fence Gate',        health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.OAK_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.BIRCH_FENCE_GATE]:      { name: 'Birch Fence Gate',      health: 4, transparent: true, emissive: 0, solid: true, drops: BLOCKS.BIRCH_FENCE_GATE, flammable: true, isFenceGate: true, hasFacing: true },
    [BLOCKS.BIRCH_WOOD]:              { name: 'Birch Wood',              health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.BIRCH_LEAVES]:            { name: 'Birch Leaves',            health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.BIRCH_PLANKS]:            { name: 'Birch Planks',            health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.MOSS_BLOCK]:              { name: 'Moss Block',              health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ROOTED_DIRT]:             { name: 'Rooted Dirt',             health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CAVE_VINES]:              { name: 'Cave Vines',              health: 1, transparent: true, emissive: 0.8, solid: false, isCross: true, drops: null },
    [BLOCKS.SPORE_BLOSSOM]:           { name: 'Spore Blossom',           health: 1, transparent: true, emissive: 0.3, solid: false, isCross: true, drops: null },
    [BLOCKS.AZALEA_LEAVES]:           { name: 'Azalea Leaves',           health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.FLOWERING_AZALEA_LEAVES]: { name: 'Flowering Azalea Leaves', health: 1, transparent: true, emissive: 0.1, solid: true, drops: null, flammable: true },
    [BLOCKS.DRIPSTONE_BLOCK]:         { name: 'Dripstone Block',         health: 4, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.POINTED_DRIPSTONE_DOWN]:  { name: 'Pointed Dripstone',       health: 2, transparent: true, emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.POINTED_DRIPSTONE_UP]:    { name: 'Pointed Dripstone',       health: 2, transparent: true, emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.RED_MUSHROOM]:          { name: 'Red Mushroom',          health: 1, transparent: true, emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.BROWN_MUSHROOM]:        { name: 'Brown Mushroom',        health: 1, transparent: true, emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.BROWN_MUSHROOM_BLOCK]:  { name: 'Brown Mushroom Block',  health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.MANGROVE_LOG]:          { name: 'Mangrove Log',          health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.MANGROVE_LEAVES]:       { name: 'Mangrove Leaves',       health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.MANGROVE_ROOTS]:        { name: 'Mangrove Roots',        health: 2, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.MUDDY_MANGROVE_ROOTS]:  { name: 'Muddy Mangrove Roots',  health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.MANGROVE_PLANKS]:       { name: 'Mangrove Planks',       health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.FLETCHING_TABLE]:   { name: 'Fletching Table',   health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.SMOKER]:            { name: 'Smoker',            health: 6, transparent: false, emissive: 0, solid: true, drops: null, hasFacing: true },
    [BLOCKS.STONECUTTER]:       { name: 'Stonecutter',       health: 6, transparent: true, emissive: 0, solid: true, drops: null, isStonecutter: true },
    [BLOCKS.EMERALD_BLOCK]:     { name: 'Emerald Block',     health: 8, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.LAPIS_BLOCK]:       { name: 'Lapis Block',       health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.REDSTONE_BLOCK]:    { name: 'Redstone Block',    health: 6, transparent: false, emissive: 0.6, solid: true, drops: null },
    [BLOCKS.COAL_BLOCK]:        { name: 'Coal Block',        health: 6, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.SLIME_BLOCK]:       { name: 'Slime Block',       health: 1, transparent: true,  emissive: 0, solid: true, drops: BLOCKS.SLIME_BLOCK },
    [BLOCKS.AIR]:           { name: 'Air',           health: 0, transparent: true,  emissive: 0, solid: false, drops: null },
    [BLOCKS.GRASS]:         { name: 'Grass',         health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT },
    [BLOCKS.DIRT]:          { name: 'Dirt',           health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.STONE]:         { name: 'Stone',          health: 6, transparent: false, emissive: 0, solid: true, drops: BLOCKS.COBBLESTONE },
    [BLOCKS.SAND]:          { name: 'Sand',           health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.WATER]:         { name: 'Water',          health: 0, transparent: true,  emissive: 0, solid: false, isLiquid: true, drops: null },
    [BLOCKS.WOOD]:          { name: 'Wood',           health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.LEAVES]:        { name: 'Leaves',         health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.PLANKS]:        { name: 'Oak Planks',     health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.COBBLESTONE]:   { name: 'Cobblestone',    health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.IRON_ORE]:      { name: 'Iron Ore',       health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GOLD_ORE]:      { name: 'Gold Ore',       health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CRYSTAL_ORE]:   { name: 'Crystal Ore',    health: 10, transparent: false, emissive: 0.3, solid: true, drops: null },
    [BLOCKS.MANA_ORE]:      { name: 'Mana Ore',       health: 10, transparent: false, emissive: 0.5, solid: true, drops: null },
    [BLOCKS.OBSIDIAN]:      { name: 'Obsidian',       health: 15, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CRAFTING_TABLE]:{ name: 'Crafting Table', health: 4, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GLOWSTONE]:     { name: 'Glowstone',      health: 4, transparent: false, emissive: 1.0, solid: true, drops: null },
    [BLOCKS.DUNGEON_BRICK]: { name: 'Dungeon Brick',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_FLOOR]: { name: 'Dungeon Floor',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.MUSHROOM_STEM]: { name: 'Mushroom Stem',  health: 3, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.MUSHROOM_CAP]:  { name: 'Mushroom Cap',   health: 2, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.ALIEN_STONE]:   { name: 'Alien Stone',    health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ALIEN_GRASS]:   { name: 'Alien Grass',    health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ALIEN_CRYSTAL]: { name: 'Alien Crystal',  health: 10, transparent: true, emissive: 0.8, solid: true, drops: null },
    [BLOCKS.SNOW]:          { name: 'Snow',           health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ICE]:           { name: 'Ice',            health: 3, transparent: true,  emissive: 0, solid: true, drops: null },
    [BLOCKS.LAVA]:          { name: 'Lava',           health: 0, transparent: false, emissive: 1.0, solid: false, isLiquid: true, drops: null },
    [BLOCKS.PORTAL_FRAME]:  { name: 'Portal Frame',   health: 20, transparent: true, emissive: 0.4, solid: true, drops: null },
    [BLOCKS.PORTAL]:        { name: 'Portal',         health: 0, transparent: true,  emissive: 1.0, solid: false, drops: null },
    [BLOCKS.BEDROCK]:       { name: 'Bedrock',        health: Infinity, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GRAVEL]:        { name: 'Gravel',         health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CLAY]:          { name: 'Clay',           health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GLASS]:         { name: 'Glass',          health: 1, transparent: true,  emissive: 0, solid: true, drops: null },
    [BLOCKS.TORCH]:         { name: 'Torch',          health: 1, transparent: true,  emissive: 1.0, solid: false, isCross: true, drops: null },
    [BLOCKS.SANDSTONE]:     { name: 'Sandstone',      health: 5, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.RED_SAND]:      { name: 'Red Sand',       health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.TERRACOTTA]:    { name: 'Terracotta',     health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DEAD_BUSH]:     { name: 'Dead Bush',      health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.ALIEN_TALL_GRASS]:{ name: 'Alien Spores', health: 1, transparent: true,  emissive: 0.3, solid: false, isCross: true, drops: null },
    [BLOCKS.SAVANNA_GRASS]: { name: 'Savanna Grass',  health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT },
    [BLOCKS.ACACIA_WOOD]:   { name: 'Acacia Wood',    health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.ACACIA_LEAVES]: { name: 'Acacia Leaves',  health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.MUD]:           { name: 'Mud',            health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SWAMP_GRASS]:   { name: 'Swamp Grass',    health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT },
    [BLOCKS.SWAMP_WATER]:   { name: 'Swamp Water',    health: 0, transparent: true,  emissive: 0, solid: false, isLiquid: true, drops: null },
    [BLOCKS.ALIEN_SPORE_STEM]:{name: 'Spore Stem',    health: 4, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.ALIEN_SPORE_BLOCK]:{name:'Spore Block',   health: 2, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.VINES]:         { name: 'Vines',          health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null, flammable: true },
    [BLOCKS.TALL_GRASS]:    { name: 'Tall Grass',     health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.RED_FLOWER]:    { name: 'Red Flower',     health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.CACTUS]:        { name: 'Cactus',         health: 2, transparent: true,  emissive: 0, solid: true, drops: BLOCKS.CACTUS },
    [BLOCKS.BLUE_FLOWER]:   { name: 'Blue Flower',    health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.YELLOW_FLOWER]: { name: 'Yellow Flower',  health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.FERN]:          { name: 'Fern',           health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: BLOCKS.AIR, flammable: true },
    [BLOCKS.TALL_FERN]:     { name: 'Large Fern',     health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: BLOCKS.AIR, flammable: true },
    [BLOCKS.TALL_FERN_TOP]: { name: 'Large Fern Top', health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: BLOCKS.AIR, flammable: true },
    [BLOCKS.WHITE_FLOWER]:  { name: 'White Flower',   health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.PURPLE_FLOWER]: { name: 'Purple Flower',  health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.ORANGE_FLOWER]: { name: 'Orange Flower',  health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.CHERRY_LOG]:    { name: 'Cherry Log',     health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.CHERRY_LEAVES]: { name: 'Cherry Leaves',  health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.PINK_PETALS]:   { name: 'Pink Petals',    health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null },
    [BLOCKS.AUTUMN_WOOD]:   { name: 'Autumn Wood',    health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.AUTUMN_LEAVES]: { name: 'Autumn Leaves',  health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.FALLEN_LEAVES]: { name: 'Fallen Leaves',  health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null, flammable: true },
    [BLOCKS.GLOW_STEM]:     { name: 'Glow Stem',      health: 4, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.GLOW_LEAVES]:   { name: 'Glow Leaves',    health: 1, transparent: true,  emissive: 0.5, solid: true, drops: null },
    [BLOCKS.GLOW_SHROOM]:   { name: 'Glow Shroom',    health: 1, transparent: true,  emissive: 0.8, solid: false, isCross: true, drops: null },
    [BLOCKS.PALM_WOOD]:     { name: 'Palm Wood',      health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.PALM_LEAVES]:   { name: 'Palm Leaves',    health: 1, transparent: true,  emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.OASIS_FERN]:    { name: 'Oasis Fern',     health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: null, flammable: true },
    [BLOCKS.DUNGEON_FIRE_BRICK]: { name: 'Fire Brick', health: 12, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.DUNGEON_FIRE_FLOOR]: { name: 'Fire Floor', health: 12, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.DUNGEON_ICE_BRICK]:  { name: 'Ice Brick',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_ICE_FLOOR]:  { name: 'Ice Floor',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_JUNGLE_BRICK]:{name: 'Jungle Brick',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_JUNGLE_FLOOR]:{name: 'Jungle Floor',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_DESERT_BRICK]:{name: 'Desert Brick',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_DESERT_FLOOR]:{name: 'Desert Floor',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_UNDEAD_BRICK]:{name: 'Undead Brick',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_UNDEAD_FLOOR]:{name: 'Undead Floor',health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DUNGEON_DOOR]:  { name: 'Oak Door',       health: 5, transparent: true, emissive: 0, solid: true, drops: BLOCKS.DUNGEON_DOOR, flammable: true, isDoor: true },
    [BLOCKS.DUNGEON_DOOR_TOP]:  { name: 'Oak Door Top', health: 5, transparent: true, emissive: 0, solid: true, drops: null, flammable: true, isDoor: true },
    [BLOCKS.BOSS_SPAWNER]:  { name: 'Boss Spawner',   health: Infinity, transparent: true, emissive: 0, solid: false, drops: null },
    [BLOCKS.COAL_ORE]:      { name: 'Coal Ore',       health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.DIAMOND_ORE]:   { name: 'Diamond Ore',    health: 10, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.STONE_BRICKS]:  { name: 'Stone Bricks',   health: 7, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.BRICKS]:        { name: 'Bricks',         health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.BOOKSHELF]:     { name: 'Bookshelf',      health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.MOSSY_COBBLESTONE]:{ name: 'Mossy Cobble', health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CHEST_BLOCK]:   { name: 'Chest',          health: 4, transparent: true, emissive: 0, solid: true, drops: null },
    [BLOCKS.LADDER]:        { name: 'Ladder',         health: 2, transparent: true,  emissive: 0, solid: false, isCross: true, isClimbable: true, drops: null },
    [BLOCKS.IRON_BLOCK]:    { name: 'Iron Block',     health: 10, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.GOLD_BLOCK]:    { name: 'Gold Block',     health: 10, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.DIAMOND_BLOCK]: { name: 'Diamond Block',  health: 12, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.WOOL]:          { name: 'Wool',           health: 2, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.FURNACE]:       { name: 'Furnace',        health: 6, transparent: false, emissive: 0, solid: true, drops: null, hasFacing: true },
    [BLOCKS.NETHERRACK]:    { name: 'Netherrack',     health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SOUL_SAND]:     { name: 'Soul Sand',      health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.NETHER_BRICKS]: { name: 'Nether Bricks',  health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CRIMSON_NYLIUM]:{ name: 'Crimson Nylium', health: 4, transparent: false, emissive: 0, solid: true, drops: 91 }, // drops netherrack
    [BLOCKS.CRIMSON_STEM]:  { name: 'Crimson Stem',   health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true }, // Will make it drop custom wood in drops logic if needed
    [BLOCKS.CRIMSON_LEAVES]:{ name: 'Crimson Leaves', health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.NETHER_WART_BLOCK]: { name: 'Nether Wart Block', health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SEAGRASS]:      { name: 'Seagrass',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.KELP]:          { name: 'Kelp',           health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: BLOCKS.KELP },
    [BLOCKS.KELP_PLANT]:    { name: 'Kelp Plant',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: BLOCKS.KELP },
    [BLOCKS.RED_KELP]:        { name: 'Red Kelp',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.BROWN_KELP]:      { name: 'Brown Kelp',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.TUBE_CORAL]:    { name: 'Tube Coral',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.BRAIN_CORAL]:   { name: 'Brain Coral',    health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.BUBBLE_CORAL]:  { name: 'Bubble Coral',   health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.FIRE_CORAL]:    { name: 'Fire Coral',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.HORN_CORAL]:    { name: 'Horn Coral',     health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.LILY_PAD]:      { name: 'Lily Pad',       health: 1, transparent: true, emissive: 0, solid: false, isCross: false, isLilyPad: true, drops: null },
    [BLOCKS.ALGAE]:         { name: 'Algae',          health: 1, transparent: true, emissive: 0, solid: false, isCross: true, isWaterlogged: true, drops: null },
    [BLOCKS.PINE_WOOD]:     { name: 'Pine Wood',      health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.PINE_LEAVES]:   { name: 'Pine Leaves',    health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.ACACIA_PLANKS]: { name: 'Acacia Planks',  health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.CHERRY_PLANKS]: { name: 'Cherry Planks',  health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.AUTUMN_PLANKS]: { name: 'Autumn Planks',  health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.PALM_PLANKS]:   { name: 'Palm Planks',    health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.PINE_PLANKS]:   { name: 'Pine Planks',    health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.CRIMSON_PLANKS]:{ name: 'Crimson Planks', health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.SUGARCANE]:     { name: 'Sugarcane',      health: 1, transparent: true,  emissive: 0, solid: false, isCross: true, drops: BLOCKS.SUGARCANE, flammable: true },
    [BLOCKS.FIRE]:          { name: 'Fire',           health: 0, transparent: true,  emissive: 1.0, solid: false, isCross: true, drops: null },
    [BLOCKS.TNT]:           { name: 'TNT',            health: 1, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.AETHER_STONE]:  { name: 'Aether Stone',   health: 10, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.AETHER_DIRT]:   { name: 'Aether Dirt',    health: 4, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.AETHER_GRASS]:  { name: 'Aether Grass',   health: 4, transparent: false, emissive: 0.1, solid: true, drops: 115 },
    [BLOCKS.AETHER_WOOD]:   { name: 'Aether Wood',    health: 7, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.DARK_OAK_WOOD]: { name: 'Dark Oak Wood',  health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.DARK_OAK_LEAVES]: { name: 'Dark Oak Leaves', health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.DARK_OAK_PLANKS]: { name: 'Dark Oak Planks', health: 4, transparent: false, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.CRYING_OBSIDIAN]: { name: 'Crying Obsidian', health: 15, transparent: false, emissive: 0.6, solid: true, drops: null },
    [BLOCKS.MYCELIUM]:      { name: 'Mycelium',       health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT },
    [BLOCKS.AETHER_LEAVES]: { name: 'Aether Leaves',  health: 1, transparent: true, emissive: 0.2, solid: true, drops: null, flammable: true },
    [BLOCKS.AETHER_PORTAL]: { name: 'Aether Portal',  health: 0, transparent: true, emissive: 0.5, solid: false, drops: null },
    [BLOCKS.AETHER_CLOUD]:  { name: 'Aether Cloud',   health: 1, transparent: true, emissive: 0.5, solid: true, drops: null },
    [BLOCKS.AETHER_TALL_GRASS]: { name: 'Aether Tall Grass', health: 1, transparent: true, emissive: 0.2, solid: false, isCross: true, drops: null },
    [BLOCKS.AETHER_FLOWER]: { name: 'Aether Flower',  health: 1, transparent: true, emissive: 0.4, solid: false, isCross: true, drops: null },
    [BLOCKS.AETHER_CRYSTAL]:{ name: 'Aether Crystal', health: 8, transparent: false, emissive: 0.8, solid: true, drops: null },
    [BLOCKS.CAVERN_STONE]:  { name: 'Cavern Stone',   health: 12, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CAVERN_DIRT]:   { name: 'Cavern Dirt',    health: 5, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.CAVERN_PORTAL]: { name: 'Cavern Portal',  health: 0, transparent: true, emissive: 1.0, solid: false, drops: null },
    [BLOCKS.MAGMA_STONE]:   { name: 'Magma Stone',    health: 15, transparent: false, emissive: 0.8, solid: true, drops: null },
    [BLOCKS.HIGHLANDS_STONE]:{ name: 'Highlands Stone',health: 10, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.HIGHLANDS_DIRT]:{ name: 'Highlands Dirt', health: 4, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.HIGHLANDS_GRASS]:{ name: 'Highlands Grass',health: 4, transparent: false, emissive: 0.1, solid: true, drops: 129 }, // drops HIGHLANDS_DIRT
    [BLOCKS.HIGHLANDS_PORTAL]:{ name: 'Highlands Portal',health: 0, transparent: true, emissive: 1.0, solid: false, drops: null },
    [BLOCKS.QUICKSOIL]:     { name: 'Quicksoil',      health: 2, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.HOLYSTONE]:     { name: 'Holystone',      health: 8, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.ENCHANTED_AETHER_LOG]: { name: 'Enchanted Log', health: 5, transparent: false, emissive: 0.2, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.ENCHANTED_AETHER_LEAVES]: { name: 'Enchanted Leaves', health: 1, transparent: true, emissive: 0.2, solid: true, drops: null, flammable: true },
    [BLOCKS.WARPED_NYLIUM]: { name: 'Warped Nylium',  health: 4, transparent: false, emissive: 0.1, solid: true, drops: BLOCKS.NETHERRACK },
    [BLOCKS.WARPED_STEM]:   { name: 'Warped Stem',    health: 5, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.WARPED_WART_BLOCK]: { name: 'Warped Wart Block', health: 2, transparent: false, emissive: 0.1, solid: true, drops: null },
    [BLOCKS.WARPED_ROOTS]:  { name: 'Warped Roots',   health: 1, transparent: true, emissive: 0.2, solid: false, isCross: true, drops: null },
    [BLOCKS.TWISTING_VINES]:{ name: 'Twisting Vines', health: 1, transparent: true, emissive: 0.2, solid: false, isCross: true, drops: null },
    [BLOCKS.NETHER_SPROUTS]:{ name: 'Nether Sprouts', health: 1, transparent: true, emissive: 0.2, solid: false, isCross: true, drops: null },
    [BLOCKS.SOUL_SOIL]:     { name: 'Soul Soil',      health: 3, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.BONE_BLOCK]:    { name: 'Bone Block',     health: 4, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.SOUL_FIRE]:     { name: 'Soul Fire',      health: 0, transparent: true, emissive: 1.0, solid: false, isCross: true, drops: null },
    [BLOCKS.BASALT]:        { name: 'Basalt',         health: 6, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.SMOOTH_BASALT]: { name: 'Smooth Basalt',  health: 6, transparent: false, emissive: 0, solid: true, drops: null, isLog: true },
    [BLOCKS.MAGMA]:         { name: 'Magma Block',    health: 3, transparent: false, emissive: 0.6, solid: true, drops: null },
    [BLOCKS.BLACKSTONE]:    { name: 'Blackstone',     health: 6, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SHROOMLIGHT]:   { name: 'Shroomlight',    health: 2, transparent: false, emissive: 1.0, solid: true, drops: null },
    [BLOCKS.ZANITE_ORE]:    { name: 'Zanite Ore',     health: 8, transparent: false, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.GRAVITITE_ORE]: { name: 'Gravitite Ore',  health: 10, transparent: false, emissive: 0.5, solid: true, drops: null },
    [BLOCKS.AMBROSIUM_ORE]: { name: 'Ambrosium Ore',  health: 6, transparent: false, emissive: 0.4, solid: true, drops: null },
    [BLOCKS.CARVED_HOLYSTONE]: { name: 'Carved Holystone', health: 9, transparent: false, emissive: 0, solid: true, drops: null },
    [BLOCKS.SENTRY_STONE]:  { name: 'Sentry Stone',   health: 12, transparent: false, emissive: 0.3, solid: true, drops: null },
    [BLOCKS.BLUE_AERCLOUD]: { name: 'Blue Aercloud',  health: 1, transparent: true, emissive: 0.2, solid: true, drops: null },
    [BLOCKS.GOLDEN_AERCLOUD]: { name: 'Golden Aercloud', health: 1, transparent: true, emissive: 0.3, solid: true, drops: null },
    [BLOCKS.GOLDEN_OAK_WOOD]: { name: 'Golden Oak Wood', health: 6, transparent: false, emissive: 0.1, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.GOLDEN_OAK_LEAVES]: { name: 'Golden Oak Leaves', health: 1, transparent: true, emissive: 0.4, solid: true, drops: null, flammable: true },
    [BLOCKS.MAGIC_WOOD]:    { name: 'Magic Wood',     health: 5, transparent: false, emissive: 0.2, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.MAGIC_LEAVES]:  { name: 'Magic Leaves',   health: 1, transparent: true, emissive: 0.5, solid: true, drops: null, flammable: true },
    [BLOCKS.REDWOOD_LOG]:   { name: 'Redwood Log',    health: 6, transparent: false, emissive: 0, solid: true, drops: null, flammable: true, isLog: true },
    [BLOCKS.REDWOOD_LEAVES]:{ name: 'Redwood Leaves', health: 1, transparent: true, emissive: 0, solid: true, drops: null, flammable: true },
    [BLOCKS.LAVENDER]:      { name: 'Lavender',       health: 1, transparent: true, emissive: 0, solid: false, isCross: true, drops: null, flammable: true },
    [BLOCKS.PODZOL]:        { name: 'Podzol',         health: 3, transparent: false, emissive: 0, solid: true, drops: BLOCKS.DIRT },
    [BLOCKS.RUBY_ORE]:      { name: 'Ruby Ore',       health: 8, transparent: false, emissive: 0.3, solid: true, drops: null },
    [BLOCKS.SAPPHIRE_ORE]:  { name: 'Sapphire Ore',   health: 8, transparent: false, emissive: 0.3, solid: true, drops: null },

    // Saplings
    [BLOCKS.OAK_SAPLING]:      { name: 'Oak Sapling',      health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isSapling: true, saplingType: 'oak', drops: BLOCKS.OAK_SAPLING },
    [BLOCKS.SPRUCE_SAPLING]:   { name: 'Spruce Sapling',   health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isSapling: true, saplingType: 'spruce', drops: BLOCKS.SPRUCE_SAPLING },
    [BLOCKS.BIRCH_SAPLING]:    { name: 'Birch Sapling',    health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isSapling: true, saplingType: 'birch', drops: BLOCKS.BIRCH_SAPLING },
    [BLOCKS.JUNGLE_SAPLING]:   { name: 'Jungle Sapling',   health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isSapling: true, saplingType: 'jungle', drops: BLOCKS.JUNGLE_SAPLING },
    [BLOCKS.ACACIA_SAPLING]:   { name: 'Acacia Sapling',   health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isSapling: true, saplingType: 'acacia', drops: BLOCKS.ACACIA_SAPLING },
    [BLOCKS.DARK_OAK_SAPLING]: { name: 'Dark Oak Sapling', health: 0.1, transparent: true, emissive: 0, solid: false, isCross: true, isSapling: true, saplingType: 'dark_oak', drops: BLOCKS.DARK_OAK_SAPLING },

    // Sculk Blocks
    [BLOCKS.SCULK]:            { name: 'Sculk',            health: 1.5, transparent: false, emissive: 0.1, solid: true, drops: BLOCKS.SCULK },
    [BLOCKS.SCULK_CATALYST]:   { name: 'Sculk Catalyst',   health: 4, transparent: false, emissive: 0.4, solid: true, drops: BLOCKS.SCULK_CATALYST },
    [BLOCKS.DIRT_PATH]:        { name: 'Dirt Path',        health: 2, transparent: true, emissive: 0, solid: true, isDirtPath: true, drops: BLOCKS.DIRT }
};

export function getBlockProperties(type) {
    return BLOCK_PROPS[type] || BLOCK_PROPS[BLOCKS.AIR];
}

export function getBlockName(type) {
    return (BLOCK_PROPS[type] || BLOCK_PROPS[BLOCKS.AIR]).name;
}

// Texture generation config
const TEX_SIZE = 16; // pixels per texture
const ATLAS_COLS = 8;
const BLOCK_COUNT = Object.keys(BLOCKS).length;
const ATLAS_ROWS = Math.ceil(BLOCK_COUNT / ATLAS_COLS);

export const BIOME_GRASS_HUES = {
    'Plains': '#91BD59',
    'Forest': '#79C05A',
    'Birch Forest': '#88BC70',
    'Jungle': '#59C93C',
    'Swamp': '#6A7039',
    'Savanna': '#BFB755',
    'Dark Forest': '#507A32',
    'Badlands': '#90814D',
    'Desert': '#BFB755',
    'Tundra': '#80B497',
    'Ice Spikes': '#80B497',
    'Taiga': '#86B783',
    'Mountains': '#84BE7D',
    'Beach': '#91BD59',
    'Deep Ocean': '#91BD59',
    'Cherry Grove': '#B6DB67',
    'Mushroom': '#55C93F'
};

export const ATLAS_SIZE = { cols: ATLAS_COLS, rows: ATLAS_ROWS, texSize: TEX_SIZE };

// ---- Minimal Fallback Texture Generator ----
function generateBlockTexture(ctx, blockType, face, rng) {
    // Missing texture fallback: black & magenta 2x2 checkerboard
    ctx.fillStyle = '#f0f';
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillRect(8, 8, 8, 8);
}

function hasFaceVariants(blockType) {
    return [
        BLOCKS.GRASS, BLOCKS.WOOD, BLOCKS.MUSHROOM_STEM, BLOCKS.SAVANNA_GRASS, BLOCKS.ACACIA_WOOD, BLOCKS.SWAMP_GRASS, BLOCKS.ALIEN_GRASS, BLOCKS.PORTAL_FRAME, BLOCKS.END_PORTAL_FRAME_EYE, BLOCKS.CHERRY_LOG, BLOCKS.AUTUMN_WOOD, BLOCKS.PALM_WOOD, BLOCKS.PINE_WOOD, BLOCKS.DARK_OAK_WOOD,
        BLOCKS.CHEST_BLOCK, BLOCKS.FURNACE, BLOCKS.CRIMSON_NYLIUM, BLOCKS.CRIMSON_STEM, BLOCKS.TNT, BLOCKS.CRAFTING_TABLE, BLOCKS.AETHER_GRASS, BLOCKS.AETHER_WOOD, BLOCKS.HIGHLANDS_GRASS,
        BLOCKS.CACTUS, BLOCKS.SANDSTONE, BLOCKS.BOOKSHELF, BLOCKS.MYCELIUM,
        BLOCKS.WARPED_NYLIUM, BLOCKS.WARPED_STEM, BLOCKS.BONE_BLOCK, BLOCKS.BASALT, BLOCKS.BLACKSTONE, BLOCKS.PODZOL, BLOCKS.GOLDEN_OAK_WOOD, BLOCKS.MAGIC_WOOD, BLOCKS.REDWOOD_LOG,
        BLOCKS.FLETCHING_TABLE, BLOCKS.SMOKER, BLOCKS.STONECUTTER,
        BLOCKS.MANGROVE_LOG, BLOCKS.MANGROVE_ROOTS, BLOCKS.MUDDY_MANGROVE_ROOTS, BLOCKS.ENCHANTED_AETHER_LOG,
        BLOCKS.BIRCH_WOOD, BLOCKS.FARMLAND, BLOCKS.FARMLAND_MOIST, BLOCKS.DIRT_PATH, BLOCKS.PUMPKIN, BLOCKS.JUNGLE_LOG,
        BLOCKS.SCULK_CATALYST,
        BLOCKS.POINTED_DRIPSTONE_DOWN, BLOCKS.POINTED_DRIPSTONE_UP
    ].includes(blockType);
}

// Build the atlas: for face-variant blocks, store 3 rows (top, side, bottom)
// For uniform blocks, store 1 texture and use the same UV for all faces


const MINECRAFT_ASSETS_BASE = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/";
const AETHER_ASSETS_BASE = "https://cdn.jsdelivr.net/gh/The-Aether-Team/The-Aether@1.21.1-develop/src/main/resources/assets/aether/textures/block/natural/";

const MC_TEXTURE_MAP = {
    [BLOCKS.GRASS]: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    [BLOCKS.DIRT]: 'dirt',
    [BLOCKS.STONE]: 'stone',
    [BLOCKS.SAND]: 'sand',
    [BLOCKS.WATER]: 'water_still',
    [BLOCKS.WOOD]: { top: 'oak_log_top', side: 'oak_log', bottom: 'oak_log_top' },
    [BLOCKS.LEAVES]: 'oak_leaves',
    [BLOCKS.PLANKS]: 'oak_planks',
    [BLOCKS.COBBLESTONE]: 'cobblestone',
    [BLOCKS.IRON_ORE]: 'iron_ore',
    [BLOCKS.GOLD_ORE]: 'gold_ore',
    [BLOCKS.CRYSTAL_ORE]: 'diamond_ore',
    [BLOCKS.MANA_ORE]: 'lapis_ore',
    [BLOCKS.OBSIDIAN]: 'obsidian',
    [BLOCKS.CRYING_OBSIDIAN]: 'crying_obsidian',
    [BLOCKS.GLOWSTONE]: 'glowstone',
    [BLOCKS.DUNGEON_DOOR]: 'oak_door_bottom',
    [BLOCKS.DUNGEON_DOOR_TOP]: 'oak_door_top',
    [BLOCKS.MUSHROOM_STEM]: 'mushroom_stem',
    [BLOCKS.MUSHROOM_CAP]: 'red_mushroom_block',
    [BLOCKS.RED_MUSHROOM]: 'red_mushroom',
    [BLOCKS.BROWN_MUSHROOM]: 'brown_mushroom',
    [BLOCKS.BROWN_MUSHROOM_BLOCK]: 'brown_mushroom_block',
    [BLOCKS.ALIEN_STONE]: 'end_stone',
    [BLOCKS.ALIEN_GRASS]: { top: 'mycelium_top', side: 'mycelium_side', bottom: 'end_stone' },
    [BLOCKS.MYCELIUM]: { top: 'mycelium_top', side: 'mycelium_side', bottom: 'dirt' },
    [BLOCKS.ALIEN_CRYSTAL]: 'purpur_block',
    [BLOCKS.SNOW]: 'snow',
    [BLOCKS.ICE]: 'ice',
    [BLOCKS.PACKED_ICE]: 'packed_ice',
    [BLOCKS.BLUE_ICE]: 'blue_ice',
    [BLOCKS.LAVA]: 'lava_still',
    [BLOCKS.PORTAL_FRAME]: { top: 'end_portal_frame_top', side: 'end_portal_frame_side', bottom: 'end_stone' },
    [BLOCKS.END_PORTAL_FRAME_EYE]: { top: 'end_portal_frame_top', eye: 'end_portal_frame_eye', side: 'end_portal_frame_side', bottom: 'end_stone' },
    [BLOCKS.END_PORTAL]: 'end_portal',
    [BLOCKS.END_STONE]: 'end_stone',
    [BLOCKS.DRAGON_EGG]: 'dragon_egg',
    [BLOCKS.PORTAL]: 'nether_portal',
    [BLOCKS.BEDROCK]: 'bedrock',
    [BLOCKS.GRAVEL]: 'gravel',
    [BLOCKS.CLAY]: 'clay',
    [BLOCKS.GLASS]: 'glass',
    [BLOCKS.TORCH]: 'torch',
    [BLOCKS.SANDSTONE]: { top: 'sandstone_top', side: 'sandstone', bottom: 'sandstone_bottom' },
    [BLOCKS.RED_SAND]: 'red_sand',
    [BLOCKS.TERRACOTTA]: 'terracotta',
    [BLOCKS.DEAD_BUSH]: 'dead_bush',
    [BLOCKS.ALIEN_TALL_GRASS]: 'crimson_roots',
    [BLOCKS.SAVANNA_GRASS]: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    [BLOCKS.ACACIA_WOOD]: { top: 'acacia_log_top', side: 'acacia_log', bottom: 'acacia_log_top' },
    [BLOCKS.ACACIA_LEAVES]: 'acacia_leaves',
    [BLOCKS.MUD]: 'mud',
    [BLOCKS.SWAMP_GRASS]: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    [BLOCKS.SWAMP_WATER]: 'water_still',
    [BLOCKS.ALIEN_SPORE_STEM]: 'warped_stem',
    [BLOCKS.ALIEN_SPORE_BLOCK]: 'warped_wart_block',
    [BLOCKS.VINES]: 'vine',
    [BLOCKS.TALL_GRASS]: 'tall_grass_top',
    [BLOCKS.RED_FLOWER]: 'poppy',
    [BLOCKS.CACTUS]: { top: 'cactus_top', side: 'cactus_side', bottom: 'cactus_bottom' },
    [BLOCKS.BLUE_FLOWER]: 'cornflower',
    [BLOCKS.YELLOW_FLOWER]: 'dandelion',
    [BLOCKS.FERN]: 'fern',
    [BLOCKS.TALL_FERN]: 'large_fern_bottom',
    [BLOCKS.TALL_FERN_TOP]: 'large_fern_top',
    [BLOCKS.WHITE_FLOWER]: 'lily_of_the_valley',
    [BLOCKS.PURPLE_FLOWER]: 'allium',
    [BLOCKS.ORANGE_FLOWER]: 'orange_tulip',
    [BLOCKS.CHERRY_LOG]: { top: 'cherry_log_top', side: 'cherry_log', bottom: 'cherry_log_top' },
    [BLOCKS.CHERRY_LEAVES]: 'cherry_leaves',
    [BLOCKS.PINK_PETALS]: 'pink_petals',
    [BLOCKS.AUTUMN_WOOD]: { top: 'pale_oak_log_top', side: 'pale_oak_log', bottom: 'pale_oak_log_top' },
    [BLOCKS.AUTUMN_LEAVES]: 'pale_oak_leaves',
    [BLOCKS.DARK_OAK_WOOD]: { top: 'dark_oak_log_top', side: 'dark_oak_log', bottom: 'dark_oak_log_top' },
    [BLOCKS.DARK_OAK_LEAVES]: 'dark_oak_leaves',
    [BLOCKS.DARK_OAK_PLANKS]: 'dark_oak_planks',
    [BLOCKS.BIRCH_WOOD]: { top: 'birch_log_top', side: 'birch_log', bottom: 'birch_log_top' },
    [BLOCKS.BIRCH_LEAVES]: 'birch_leaves',
    [BLOCKS.BIRCH_PLANKS]: 'birch_planks',
    [BLOCKS.FALLEN_LEAVES]: 'podzol_top',
    [BLOCKS.GLOW_STEM]: 'crimson_stem',
    [BLOCKS.GLOW_LEAVES]: 'shroomlight',
    [BLOCKS.GLOW_SHROOM]: 'red_mushroom',
    [BLOCKS.BOSS_SPAWNER]: 'spawner',
    [BLOCKS.COAL_ORE]: 'coal_ore',
    [BLOCKS.DIAMOND_ORE]: 'diamond_ore',
    [BLOCKS.STONE_BRICKS]: 'stone_bricks',
    [BLOCKS.BRICKS]: 'bricks',
    [BLOCKS.BOOKSHELF]: { top: 'oak_planks', bottom: 'oak_planks', side: 'bookshelf', front: 'bookshelf' },
    [BLOCKS.CHEST_BLOCK]: { top: 'chest://top', bottom: 'chest://bottom', side: 'chest://side', front: 'chest://front' },
    [BLOCKS.MOSSY_COBBLESTONE]: 'mossy_cobblestone',
    [BLOCKS.LADDER]: 'ladder',
    [BLOCKS.IRON_BLOCK]: 'iron_block',
    [BLOCKS.GOLD_BLOCK]: 'gold_block',
    [BLOCKS.DIAMOND_BLOCK]: 'diamond_block',
    [BLOCKS.EMERALD_BLOCK]: 'emerald_block',
    [BLOCKS.LAPIS_BLOCK]: 'lapis_block',
    [BLOCKS.REDSTONE_BLOCK]: 'redstone_block',
    [BLOCKS.COAL_BLOCK]: 'coal_block',
    [BLOCKS.FLETCHING_TABLE]: { top: 'fletching_table_top', side: 'fletching_table_side', bottom: 'birch_planks', front: 'fletching_table_front' },
    [BLOCKS.SMOKER]: { top: 'smoker_top', side: 'smoker_side', bottom: 'smoker_bottom', front: 'smoker_front' },
    [BLOCKS.STONECUTTER]: { top: 'stonecutter_top', side: 'stonecutter_side', bottom: 'stonecutter_bottom', front: 'stonecutter_saw' },
    [BLOCKS.WOOL]: 'white_wool',
    [BLOCKS.RED_WOOL]: 'red_wool',
    [BLOCKS.BLUE_WOOL]: 'blue_wool',
    [BLOCKS.YELLOW_WOOL]: 'yellow_wool',
    [BLOCKS.GREEN_WOOL]: 'green_wool',
    [BLOCKS.BLACK_WOOL]: 'black_wool',
    [BLOCKS.PURPLE_WOOL]: 'purple_wool',
    [BLOCKS.ORANGE_WOOL]: 'orange_wool',
    [BLOCKS.PINK_WOOL]: 'pink_wool',
    [BLOCKS.CYAN_WOOL]: 'cyan_wool',
    [BLOCKS.LIME_WOOL]: 'lime_wool',
    [BLOCKS.GRAY_WOOL]: 'gray_wool',
    [BLOCKS.LIGHT_BLUE_WOOL]: 'light_blue_wool',
    [BLOCKS.BROWN_WOOL]: 'brown_wool',
    [BLOCKS.MAGENTA_WOOL]: 'magenta_wool',
    [BLOCKS.LIGHT_GRAY_WOOL]: 'light_gray_wool',
    [BLOCKS.RED_BED]: 'red_wool',
    [BLOCKS.WHITE_BED]: 'white_wool',
    [BLOCKS.BLUE_BED]: 'blue_wool',
    [BLOCKS.YELLOW_BED]: 'yellow_wool',
    [BLOCKS.GREEN_BED]: 'green_wool',
    [BLOCKS.BLACK_BED]: 'black_wool',
    [BLOCKS.PURPLE_BED]: 'purple_wool',
    [BLOCKS.ORANGE_BED]: 'orange_wool',
    [BLOCKS.PINK_BED]: 'pink_wool',
    [BLOCKS.CYAN_BED]: 'cyan_wool',
    [BLOCKS.LIME_BED]: 'lime_wool',
    [BLOCKS.GRAY_BED]: 'gray_wool',
    [BLOCKS.LIGHT_BLUE_BED]: 'light_blue_wool',
    [BLOCKS.BROWN_BED]: 'brown_wool',
    [BLOCKS.MAGENTA_BED]: 'magenta_wool',
    [BLOCKS.LIGHT_GRAY_BED]: 'light_gray_wool',
    [BLOCKS.BED_HEAD]: 'white_wool',
    [BLOCKS.FURNACE]: { top: 'furnace_top', side: 'furnace_side', bottom: 'furnace_top', front: 'furnace_front' },
    [BLOCKS.NETHERRACK]: 'netherrack',
    [BLOCKS.SOUL_SAND]: 'soul_sand',
    [BLOCKS.NETHER_BRICKS]: 'nether_bricks',
    [BLOCKS.CRIMSON_NYLIUM]: { top: 'crimson_nylium', side: 'crimson_nylium_side', bottom: 'netherrack' },
    [BLOCKS.CRIMSON_STEM]: { top: 'crimson_stem_top', side: 'crimson_stem', bottom: 'crimson_stem_top' },
    [BLOCKS.CRIMSON_LEAVES]: 'nether_wart_block',
    [BLOCKS.NETHER_WART_BLOCK]: 'nether_wart_block',
    [BLOCKS.TUBE_CORAL]: 'tube_coral',
    [BLOCKS.BRAIN_CORAL]: 'brain_coral',
    [BLOCKS.FIRE_CORAL]: 'fire_coral',
    [BLOCKS.HORN_CORAL]: 'horn_coral',
    [BLOCKS.PINE_WOOD]: { top: 'spruce_log_top', side: 'spruce_log', bottom: 'spruce_log_top' },
    [BLOCKS.PINE_LEAVES]: 'spruce_leaves',
    [BLOCKS.ACACIA_PLANKS]: 'acacia_planks',
    [BLOCKS.CHERRY_PLANKS]: 'cherry_planks',
    [BLOCKS.AUTUMN_PLANKS]: 'spruce_planks',
    [BLOCKS.PALM_PLANKS]: 'jungle_planks',
    [BLOCKS.PINE_PLANKS]: 'spruce_planks',
    [BLOCKS.CRIMSON_PLANKS]: 'crimson_planks',
    [BLOCKS.SUGARCANE]: 'sugar_cane',
    [BLOCKS.FIRE]: 'fire_0',
    [BLOCKS.TNT]: { top: 'tnt_top', side: 'tnt_side', bottom: 'tnt_bottom' },
    [BLOCKS.CRAFTING_TABLE]: { top: 'crafting_table_top', side: 'crafting_table_side', bottom: 'oak_planks', front: 'crafting_table_front' },
    [BLOCKS.AETHER_STONE]: 'aether://holystone',
    [BLOCKS.AETHER_DIRT]: 'aether://aether_dirt',
    [BLOCKS.AETHER_GRASS]: { top: 'aether://aether_grass_block_top', side: 'aether://aether_grass_block_side', bottom: 'aether://aether_dirt' },
    [BLOCKS.AETHER_WOOD]: { top: 'aether://skyroot_log_top', side: 'aether://skyroot_log', bottom: 'aether://skyroot_log_top' },
    [BLOCKS.AETHER_LEAVES]: 'aether://golden_oak_leaves',
    [BLOCKS.AETHER_PORTAL]: 'aether_portal',
    [BLOCKS.AETHER_CLOUD]: 'white_wool',
    [BLOCKS.AETHER_TALL_GRASS]: 'aether://skyroot_leaves',
    [BLOCKS.AETHER_FLOWER]: 'aether://white_flower',
    [BLOCKS.AETHER_CRYSTAL]: 'sea_lantern',
    [BLOCKS.CAVERN_STONE]: 'andesite',
    [BLOCKS.CAVERN_DIRT]: 'dirt',
    [BLOCKS.CAVERN_PORTAL]: 'obsidian',
    [BLOCKS.MAGMA_STONE]: 'magma',
    [BLOCKS.HIGHLANDS_STONE]: 'diorite',
    [BLOCKS.HIGHLANDS_DIRT]: 'dirt',
    [BLOCKS.HIGHLANDS_GRASS]: { top: 'grass_block_top', side: 'grass_block_side', bottom: 'dirt' },
    [BLOCKS.HIGHLANDS_PORTAL]: 'emerald_block',
    [BLOCKS.SEAGRASS]: 'seagrass',
    [BLOCKS.KELP]: 'kelp',
    [BLOCKS.KELP_PLANT]: 'kelp_plant',
    [BLOCKS.BUBBLE_CORAL]: 'bubble_coral',
    [BLOCKS.LILY_PAD]: 'lily_pad',
    [BLOCKS.ALGAE]: 'seagrass',
    [BLOCKS.RED_KELP]: 'kelp',
    [BLOCKS.BROWN_KELP]: 'kelp_plant',
    [BLOCKS.QUICKSOIL]: 'aether://quicksoil',
    [BLOCKS.HOLYSTONE]: 'aether://holystone',
    [BLOCKS.ENCHANTED_AETHER_LOG]: { top: 'aether://golden_oak_log', side: 'aether://golden_oak_log', bottom: 'aether://golden_oak_log' },
    [BLOCKS.ENCHANTED_AETHER_LEAVES]: 'aether://crystal_leaves',
    [BLOCKS.WARPED_NYLIUM]: { top: 'warped_nylium', side: 'warped_nylium_side', bottom: 'netherrack' },
    [BLOCKS.WARPED_STEM]: { top: 'warped_stem_top', side: 'warped_stem', bottom: 'warped_stem_top' },
    [BLOCKS.WARPED_WART_BLOCK]: 'warped_wart_block',
    [BLOCKS.WARPED_ROOTS]: 'warped_roots',
    [BLOCKS.TWISTING_VINES]: 'twisting_vines',
    [BLOCKS.NETHER_SPROUTS]: 'nether_sprouts',
    [BLOCKS.SOUL_SOIL]: 'soul_soil',
    [BLOCKS.BONE_BLOCK]: { top: 'bone_block_top', side: 'bone_block_side', bottom: 'bone_block_top' },
    [BLOCKS.SOUL_FIRE]: 'soul_fire_0',
    [BLOCKS.BASALT]: { top: 'basalt_top', side: 'basalt_side', bottom: 'basalt_top' },
    [BLOCKS.SMOOTH_BASALT]: 'smooth_basalt',
    [BLOCKS.MAGMA]: 'magma',
    [BLOCKS.BLACKSTONE]: { top: 'blackstone_top', side: 'blackstone', bottom: 'blackstone_top' },
    [BLOCKS.SHROOMLIGHT]: 'shroomlight',
    [BLOCKS.PODZOL]: { top: 'podzol_top', side: 'podzol_side', bottom: 'dirt' },
    [BLOCKS.ZANITE_ORE]: 'zanite_ore',
    [BLOCKS.GRAVITITE_ORE]: 'gravitite_ore',
    [BLOCKS.AMBROSIUM_ORE]: 'ambrosium_ore',
    [BLOCKS.CARVED_HOLYSTONE]: 'carved_holystone',
    [BLOCKS.SENTRY_STONE]: 'sentry_stone',
    [BLOCKS.BLUE_AERCLOUD]: 'cold_aercloud',
    [BLOCKS.GOLDEN_AERCLOUD]: 'cold_aercloud',
    [BLOCKS.GOLDEN_OAK_WOOD]: { top: 'golden_oak_log', side: 'golden_oak_log', bottom: 'golden_oak_log' },
    [BLOCKS.GOLDEN_OAK_LEAVES]: 'golden_oak_leaves',
    [BLOCKS.MAGIC_WOOD]: { top: 'dark_oak_log_top', side: 'dark_oak_log', bottom: 'dark_oak_log_top' },
    [BLOCKS.MAGIC_LEAVES]: 'cherry_leaves',
    [BLOCKS.REDWOOD_LOG]: { top: 'spruce_log_top', side: 'spruce_log', bottom: 'spruce_log_top' },
    [BLOCKS.REDWOOD_LEAVES]: 'spruce_leaves',
    [BLOCKS.LAVENDER]: 'allium',
    [BLOCKS.RUBY_ORE]: 'ruby_ore',
    [BLOCKS.SAPPHIRE_ORE]: 'sapphire_ore',
    [BLOCKS.MANGROVE_LOG]: { top: 'mangrove_log_top', side: 'mangrove_log', bottom: 'mangrove_log_top' },
    [BLOCKS.MANGROVE_LEAVES]: 'mangrove_leaves',
    [BLOCKS.MANGROVE_ROOTS]: { top: 'mangrove_roots_top', side: 'mangrove_roots_side', bottom: 'mangrove_roots_top' },
    [BLOCKS.MUDDY_MANGROVE_ROOTS]: { top: 'muddy_mangrove_roots_top', side: 'muddy_mangrove_roots_side', bottom: 'muddy_mangrove_roots_top' },
    [BLOCKS.MANGROVE_PLANKS]: 'mangrove_planks',
    [BLOCKS.MOSS_BLOCK]: 'moss_block',
    [BLOCKS.ROOTED_DIRT]: 'rooted_dirt',
    [BLOCKS.CAVE_VINES]: 'cave_vines',
    [BLOCKS.SPORE_BLOSSOM]: 'spore_blossom',
    [BLOCKS.AZALEA_LEAVES]: 'azalea_leaves',
    [BLOCKS.FLOWERING_AZALEA_LEAVES]: 'flowering_azalea_leaves',
    [BLOCKS.DRIPSTONE_BLOCK]: 'dripstone_block',
    [BLOCKS.POINTED_DRIPSTONE_DOWN]: {
        tip: 'pointed_dripstone_down_tip',
        frustum: 'pointed_dripstone_down_frustum',
        middle: 'pointed_dripstone_down_middle',
        base: 'pointed_dripstone_down_base',
        merge: 'pointed_dripstone_down_tip_merge',
        side: 'pointed_dripstone_down_tip',
        top: 'pointed_dripstone_down_tip',
        bottom: 'pointed_dripstone_down_tip'
    },
    [BLOCKS.POINTED_DRIPSTONE_UP]: {
        tip: 'pointed_dripstone_up_tip',
        frustum: 'pointed_dripstone_up_frustum',
        middle: 'pointed_dripstone_up_middle',
        base: 'pointed_dripstone_up_base',
        merge: 'pointed_dripstone_up_tip_merge',
        side: 'pointed_dripstone_up_tip',
        top: 'pointed_dripstone_up_tip',
        bottom: 'pointed_dripstone_up_tip'
    },
    [BLOCKS.DUNGEON_BRICK]: 'deepslate_bricks',
    [BLOCKS.DUNGEON_FLOOR]: 'deepslate_tiles',
    [BLOCKS.PALM_WOOD]: { top: 'jungle_log_top', side: 'jungle_log', bottom: 'jungle_log_top' },
    [BLOCKS.PALM_LEAVES]: 'jungle_leaves',
    [BLOCKS.OASIS_FERN]: 'fern',
    [BLOCKS.DUNGEON_FIRE_BRICK]: 'red_nether_bricks',
    [BLOCKS.DUNGEON_FIRE_FLOOR]: 'nether_bricks',
    [BLOCKS.DUNGEON_ICE_BRICK]: 'prismarine_bricks',
    [BLOCKS.DUNGEON_ICE_FLOOR]: 'blue_ice',
    [BLOCKS.DUNGEON_JUNGLE_BRICK]: 'mossy_stone_bricks',
    [BLOCKS.DUNGEON_JUNGLE_FLOOR]: 'mossy_cobblestone',
    [BLOCKS.DUNGEON_DESERT_BRICK]: 'cut_sandstone',
    [BLOCKS.DUNGEON_DESERT_FLOOR]: 'sandstone',
    [BLOCKS.DUNGEON_UNDEAD_BRICK]: 'polished_blackstone_bricks',
    [BLOCKS.DUNGEON_UNDEAD_FLOOR]: 'polished_blackstone',
    [BLOCKS.OAK_SLAB]: 'oak_planks',
    [BLOCKS.COBBLESTONE_SLAB]: 'cobblestone',
    [BLOCKS.STONE_SLAB]: { top: 'smooth_stone', side: 'smooth_stone_slab_side', bottom: 'smooth_stone' },
    [BLOCKS.BIRCH_SLAB]: 'birch_planks',
    [BLOCKS.OAK_STAIRS]: 'oak_planks',
    [BLOCKS.COBBLESTONE_STAIRS]: 'cobblestone',
    [BLOCKS.STONE_STAIRS]: 'stone',
    [BLOCKS.BIRCH_STAIRS]: 'birch_planks',
    [BLOCKS.OAK_FENCE]: 'oak_planks',
    [BLOCKS.BIRCH_FENCE]: 'birch_planks',
    [BLOCKS.SPRUCE_FENCE]: 'spruce_planks',
    [BLOCKS.JUNGLE_FENCE]: 'jungle_planks',
    [BLOCKS.ACACIA_FENCE]: 'acacia_planks',
    [BLOCKS.DARK_OAK_FENCE]: 'dark_oak_planks',
    [BLOCKS.MANGROVE_FENCE]: 'mangrove_planks',
    [BLOCKS.CHERRY_FENCE]: 'cherry_planks',
    [BLOCKS.CRIMSON_FENCE]: 'crimson_planks',
    [BLOCKS.AUTUMN_FENCE]: 'spruce_planks',

    [BLOCKS.OAK_FENCE_GATE]: 'oak_planks',
    [BLOCKS.BIRCH_FENCE_GATE]: 'birch_planks',
    [BLOCKS.SPRUCE_FENCE_GATE]: 'spruce_planks',
    [BLOCKS.JUNGLE_FENCE_GATE]: 'jungle_planks',
    [BLOCKS.ACACIA_FENCE_GATE]: 'acacia_planks',
    [BLOCKS.DARK_OAK_FENCE_GATE]: 'dark_oak_planks',
    [BLOCKS.MANGROVE_FENCE_GATE]: 'mangrove_planks',
    [BLOCKS.CHERRY_FENCE_GATE]: 'cherry_planks',
    [BLOCKS.CRIMSON_FENCE_GATE]: 'crimson_planks',
    [BLOCKS.AUTUMN_FENCE_GATE]: 'spruce_planks',

    [BLOCKS.COBBLESTONE_WALL]: 'cobblestone',
    [BLOCKS.MOSSY_COBBLESTONE_WALL]: 'mossy_cobblestone',
    [BLOCKS.STONE_BRICK_WALL]: 'stone_bricks',
    [BLOCKS.STONE_WALL]: 'stone',
    [BLOCKS.SANDSTONE_WALL]: 'sandstone',
    [BLOCKS.BLACKSTONE_WALL]: 'blackstone',
    [BLOCKS.HOLYSTONE_WALL]: 'aether://holystone',
    [BLOCKS.BRICK_WALL]: 'bricks',
    [BLOCKS.NETHER_BRICK_WALL]: 'nether_bricks',
    [BLOCKS.WARPED_FENCE]: 'warped_planks',
    [BLOCKS.WARPED_FENCE_GATE]: 'warped_planks',
    [BLOCKS.POLISHED_BLACKSTONE_BRICKS]: 'polished_blackstone_bricks',
    [BLOCKS.LANTERN]: { top: 'lantern', side: 'lantern', bottom: 'lantern' },
    [BLOCKS.SOUL_LANTERN]: { top: 'soul_lantern', side: 'soul_lantern', bottom: 'soul_lantern' },
    [BLOCKS.CHORUS_PLANT]: 'chorus_plant',
    [BLOCKS.CHORUS_FLOWER]: 'chorus_flower',
    [BLOCKS.CHORUS_FLOWER_DEAD]: 'chorus_flower_dead',
    [BLOCKS.END_GATEWAY]: 'end_portal',
    [BLOCKS.SWEET_BERRY_BUSH]: 'sweet_berry_bush',
    [BLOCKS.EMERALD_ORE]: 'emerald_ore',
    [BLOCKS.MELON]: { top: 'melon_top', side: 'melon_side', bottom: 'melon_top' },
    [BLOCKS.JUNGLE_LOG]: { top: 'jungle_log_top', side: 'jungle_log', bottom: 'jungle_log_top' },
    [BLOCKS.JUNGLE_LEAVES]: 'jungle_leaves',
    [BLOCKS.ORANGE_TERRACOTTA]: 'orange_terracotta',
    [BLOCKS.YELLOW_TERRACOTTA]: 'yellow_terracotta',
    [BLOCKS.WHITE_TERRACOTTA]: 'white_terracotta',
    [BLOCKS.BROWN_TERRACOTTA]: 'brown_terracotta',
    [BLOCKS.RED_TERRACOTTA]: 'red_terracotta',
    [BLOCKS.LIGHT_GRAY_TERRACOTTA]: 'light_gray_terracotta',
    [BLOCKS.NETHER_QUARTZ_ORE]: 'nether_quartz_ore',
    [BLOCKS.NETHER_GOLD_ORE]: 'nether_gold_ore',

    // Farming & Crops
    [BLOCKS.FARMLAND]: { top: 'farmland', side: 'dirt', bottom: 'dirt' },
    [BLOCKS.FARMLAND_MOIST]: { top: 'farmland_moist', side: 'dirt', bottom: 'dirt' },
    [BLOCKS.PUMPKIN]: { top: 'pumpkin_top', side: 'pumpkin_side', bottom: 'pumpkin_top' },
    [BLOCKS.WHEAT_0]: 'wheat_stage0',
    [BLOCKS.WHEAT_1]: 'wheat_stage1',
    [BLOCKS.WHEAT_2]: 'wheat_stage2',
    [BLOCKS.WHEAT_3]: 'wheat_stage3',
    [BLOCKS.WHEAT_4]: 'wheat_stage4',
    [BLOCKS.WHEAT_5]: 'wheat_stage5',
    [BLOCKS.WHEAT_6]: 'wheat_stage6',
    [BLOCKS.WHEAT_7]: 'wheat_stage7',
    [BLOCKS.CARROTS_0]: 'carrots_stage0',
    [BLOCKS.CARROTS_1]: 'carrots_stage1',
    [BLOCKS.CARROTS_2]: 'carrots_stage2',
    [BLOCKS.CARROTS_3]: 'carrots_stage3',
    [BLOCKS.POTATOES_0]: 'potatoes_stage0',
    [BLOCKS.POTATOES_1]: 'potatoes_stage1',
    [BLOCKS.POTATOES_2]: 'potatoes_stage2',
    [BLOCKS.POTATOES_3]: 'potatoes_stage3',
    [BLOCKS.BEETROOTS_0]: 'beetroots_stage0',
    [BLOCKS.BEETROOTS_1]: 'beetroots_stage1',
    [BLOCKS.BEETROOTS_2]: 'beetroots_stage2',
    [BLOCKS.BEETROOTS_3]: 'beetroots_stage3',
    [BLOCKS.PUMPKIN_STEM]: 'pumpkin_stem',
    [BLOCKS.MELON_STEM]: 'melon_stem',

    // Saplings
    [BLOCKS.OAK_SAPLING]: 'oak_sapling',
    [BLOCKS.SPRUCE_SAPLING]: 'spruce_sapling',
    [BLOCKS.BIRCH_SAPLING]: 'birch_sapling',
    [BLOCKS.JUNGLE_SAPLING]: 'jungle_sapling',
    [BLOCKS.ACACIA_SAPLING]: 'acacia_sapling',
    [BLOCKS.DARK_OAK_SAPLING]: 'dark_oak_sapling',

    // Sculk
    [BLOCKS.SCULK]: 'sculk',
    [BLOCKS.SCULK_CATALYST]: { top: 'sculk_catalyst_top', side: 'sculk_catalyst_side', bottom: 'sculk_catalyst_bottom' },
    [BLOCKS.SLIME_BLOCK]: 'slime_block',
    [BLOCKS.DIRT_PATH]: { top: 'dirt_path_top', side: 'dirt_path_side', bottom: 'dirt' },
    [BLOCKS.OAK_PLANKS]: 'oak_planks',
    [BLOCKS.WHITE_WOOL]: 'white_wool',
    [BLOCKS.CHISELED_POLISHED_BLACKSTONE]: 'chiseled_polished_blackstone'
};

let _mcChestPromise = null;
function loadMinecraftChestTexture(face) {
    if (!_mcChestPromise) {
        _mcChestPromise = new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
                const cdnImg = new Image();
                cdnImg.crossOrigin = 'anonymous';
                cdnImg.onload = () => resolve(cdnImg);
                cdnImg.onerror = () => resolve(null);
                cdnImg.src = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/entity/chest/normal.png';
            };
            img.src = 'assets/mc/entity/chest/normal.png';
        });
    }
    return _mcChestPromise.then(img => {
        if (!img) return null;
        const c = document.createElement('canvas');
        c.width = TEX_SIZE; c.height = TEX_SIZE;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        if (face === 'top') {
            // Lid top exterior: (28, 0, 14, 14)
            ctx.drawImage(img, 28, 0, 14, 14, 0, 0, TEX_SIZE, TEX_SIZE);
        } else if (face === 'bottom') {
            // Base bottom: (28, 19, 14, 14)
            ctx.drawImage(img, 28, 19, 14, 14, 0, 0, TEX_SIZE, TEX_SIZE);
        } else if (face === 'side') {
            // Lid side (0, 14, 14, 5) -> top 5px
            ctx.drawImage(img, 0, 14, 14, 5, 0, 0, TEX_SIZE, 5);
            // Base side (0, 33, 14, 10) -> bottom 11px
            ctx.drawImage(img, 0, 33, 14, 10, 0, 5, TEX_SIZE, 11);
        } else if (face === 'front') {
            // Lid front (14, 14, 14, 5)
            ctx.drawImage(img, 14, 14, 14, 5, 0, 0, TEX_SIZE, 5);
            // Base front (14, 33, 14, 10)
            ctx.drawImage(img, 14, 33, 14, 10, 0, 5, TEX_SIZE, 11);
            // Latch (1, 1, 2, 4) at center (x: 7, y: 3)
            ctx.drawImage(img, 1, 1, 2, 4, 7, 3, 2, 5);
        }
        return c;
    });
}

const LOCAL_ASSET_MAP = {
    // Saplings
    "oak_sapling": "assets/mc/block/oak_sapling.png",
    "spruce_sapling": "assets/mc/block/spruce_sapling.png",
    "birch_sapling": "assets/mc/block/birch_sapling.png",
    "jungle_sapling": "assets/mc/block/jungle_sapling.png",
    "acacia_sapling": "assets/mc/block/acacia_sapling.png",
    "dark_oak_sapling": "assets/mc/block/dark_oak_sapling.png",

    // Lava
    "lava_still": "assets/mc/block/lava_still.png",
    "lava_flow": "assets/mc/block/lava_flow.png",

    // Sculk
    "sculk": "assets/mc/block/sculk.png",
    "sculk_catalyst_side": "assets/mc/block/sculk_catalyst_side.png",
    "sculk_catalyst_top": "assets/mc/block/sculk_catalyst_top.png",
    "sculk_catalyst_bottom": "assets/mc/block/sculk_catalyst_bottom.png",
    "lantern": "assets/mc/block/lantern.png",
    "soul_lantern": "assets/mc/block/soul_lantern.png",
    "item/lantern": "assets/mc/item/lantern.png",
    "item/soul_lantern": "assets/mc/item/soul_lantern.png",
    "iron_nugget": "assets/mc/item/iron_nugget.png",
    "item/iron_nugget": "assets/mc/item/iron_nugget.png",
    "gold_nugget": "assets/mc/item/gold_nugget.png",
    "item/gold_nugget": "assets/mc/item/gold_nugget.png",
    "aether_dirt": "assets/aether/block/aether_dirt.png",
    "aether_grass_side": "assets/aether/block/aether_grass_side.png",
    "aether_grass_top": "assets/aether/block/aether_grass_top.png",
    "ambrosium_ore": "assets/aether/block/ambrosium_ore.png",
    "carved_holystone": "assets/aether/block/carved_holystone.png",
    "cold_aercloud": "assets/aether/block/cold_aercloud.png",
    "golden_oak_leaves": "assets/aether/block/golden_oak_leaves.png",
    "golden_oak_log": "assets/aether/block/golden_oak_log.png",
    "gravitite_ore": "assets/aether/block/gravitite_ore.png",
    "holystone": "assets/aether/block/holystone.png",
    "sentry_stone": "assets/aether/block/sentry_stone.png",
    "zanite_ore": "assets/aether/block/zanite_ore.png",
    "ambrosium_shard": "assets/aether/item/ambrosium_shard.png",
    "gravitite_axe": "assets/aether/item/gravitite_axe.png",
    "gravitite_pickaxe": "assets/aether/item/gravitite_pickaxe.png",
    "gravitite_shovel": "assets/aether/item/gravitite_shovel.png",
    "gravitite_sword": "assets/aether/item/gravitite_sword.png",
    "zanite_axe": "assets/aether/item/zanite_axe.png",
    "zanite_gem": "assets/aether/item/zanite_gem.png",
    "zanite_pickaxe": "assets/aether/item/zanite_pickaxe.png",
    "zanite_shovel": "assets/aether/item/zanite_shovel.png",
    "zanite_sword": "assets/aether/item/zanite_sword.png",
    "acacia_leaves": "assets/mc/block/acacia_leaves.png",
    "acacia_log": "assets/mc/block/acacia_log.png",
    "acacia_log_top": "assets/mc/block/acacia_log_top.png",
    "acacia_planks": "assets/mc/block/acacia_planks.png",
    "allium": "assets/mc/block/allium.png",
    "andesite": "assets/mc/block/andesite.png",
    "basalt_side": "assets/mc/block/basalt_side.png",
    "basalt_top": "assets/mc/block/basalt_top.png",
    "bedrock": "assets/mc/block/bedrock.png",
    "blackstone": "assets/mc/block/blackstone.png",
    "blackstone_top": "assets/mc/block/blackstone_top.png",
    "bone_block_side": "assets/mc/block/bone_block_side.png",
    "bone_block_top": "assets/mc/block/bone_block_top.png",
    "bookshelf": "assets/mc/block/bookshelf.png",
    "brain_coral": "assets/mc/block/brain_coral.png",
    "bricks": "assets/mc/block/bricks.png",
    "bubble_coral": "assets/mc/block/bubble_coral.png",
    "cactus_bottom": "assets/mc/block/cactus_bottom.png",
    "cactus_side": "assets/mc/block/cactus_side.png",
    "cactus_top": "assets/mc/block/cactus_top.png",
    "cherry_leaves": "assets/mc/block/cherry_leaves.png",
    "cherry_log": "assets/mc/block/cherry_log.png",
    "cherry_log_top": "assets/mc/block/cherry_log_top.png",
    "cherry_planks": "assets/mc/block/cherry_planks.png",
    "clay": "assets/mc/block/clay.png",
    "coal_ore": "assets/mc/block/coal_ore.png",
    "cobblestone": "assets/mc/block/cobblestone.png",
    "cornflower": "assets/mc/block/cornflower.png",
    "crafting_table_front": "assets/mc/block/crafting_table_front.png",
    "crafting_table_side": "assets/mc/block/crafting_table_side.png",
    "crafting_table_top": "assets/mc/block/crafting_table_top.png",
    "crimson_nylium": "assets/mc/block/crimson_nylium.png",
    "crimson_nylium_side": "assets/mc/block/crimson_nylium_side.png",
    "crimson_planks": "assets/mc/block/crimson_planks.png",
    "crimson_roots": "assets/mc/block/crimson_roots.png",
    "crimson_stem": "assets/mc/block/crimson_stem.png",
    "crimson_stem_top": "assets/mc/block/crimson_stem_top.png",
    "crying_obsidian": "assets/mc/block/crying_obsidian.png",
    "dandelion": "assets/mc/block/dandelion.png",
    "dark_oak_leaves": "assets/mc/block/dark_oak_leaves.png",
    "dark_oak_log": "assets/mc/block/dark_oak_log.png",
    "dark_oak_log_top": "assets/mc/block/dark_oak_log_top.png",
    "dark_oak_planks": "assets/mc/block/dark_oak_planks.png",
    "dead_bush": "assets/mc/block/dead_bush.png",
    "diamond_block": "assets/mc/block/diamond_block.png",
    "diamond_ore": "assets/mc/block/diamond_ore.png",
    "diorite": "assets/mc/block/diorite.png",
    "dirt": "assets/mc/block/dirt.png",
    "emerald_block": "assets/mc/block/emerald_block.png",
    "lapis_block": "assets/mc/block/lapis_block.png",
    "redstone_block": "assets/mc/block/redstone_block.png",
    "coal_block": "assets/mc/block/coal_block.png",
    "birch_planks": "assets/mc/block/birch_planks.png",
    "birch_log": "assets/mc/block/birch_log.png",
    "birch_log_top": "assets/mc/block/birch_log_top.png",
    "birch_leaves": "assets/mc/block/birch_leaves.png",
    "fletching_table_top": "assets/mc/block/fletching_table_top.png",
    "fletching_table_side": "assets/mc/block/fletching_table_side.png",
    "fletching_table_front": "assets/mc/block/fletching_table_front.png",
    "smoker_top": "assets/mc/block/smoker_top.png",
    "smoker_side": "assets/mc/block/smoker_side.png",
    "smoker_bottom": "assets/mc/block/smoker_bottom.png",
    "smoker_front": "assets/mc/block/smoker_front.png",
    "stonecutter_top": "assets/mc/block/stonecutter_top.png",
    "stonecutter_side": "assets/mc/block/stonecutter_side.png",
    "stonecutter_bottom": "assets/mc/block/stonecutter_bottom.png",
    "stonecutter_saw": "assets/mc/block/stonecutter_saw.png",
    "emerald": "assets/mc/item/emerald.png",
    "redstone": "assets/mc/item/redstone.png",
    "bow": "assets/mc/item/bow.png",
    "arrow": "assets/mc/item/arrow.png",
    "golden_apple": "assets/mc/item/golden_apple.png",
    "flint": "assets/mc/item/flint.png",
    "feather": "assets/mc/item/feather.png",
    "string": "assets/mc/item/string.png",
    "sugar": "assets/mc/item/sugar.png",
    "paper": "assets/mc/item/paper.png",
    "book": "assets/mc/item/book.png",
    "wheat": "assets/mc/item/wheat.png",
    "compass": "assets/mc/item/compass.png",
    "clock": "assets/mc/item/clock.png",
    "leather": "assets/mc/item/leather.png",
    "item/leather": "assets/mc/item/leather.png",
    "head_leather": "assets/mc/item/head_leather.png",
    "helmet_leather": "assets/mc/item/leather_helmet.png",
    "leather_helmet": "assets/mc/item/leather_helmet.png",
    "item/leather_helmet": "assets/mc/item/leather_helmet.png",
    "item/head_leather": "assets/mc/item/head_leather.png",
    "chest_leather": "assets/mc/item/chest_leather.png",
    "leather_chestplate": "assets/mc/item/leather_chestplate.png",
    "item/leather_chestplate": "assets/mc/item/leather_chestplate.png",
    "item/chest_leather": "assets/mc/item/chest_leather.png",
    "legs_leather": "assets/mc/item/legs_leather.png",
    "leather_leggings": "assets/mc/item/leather_leggings.png",
    "item/leather_leggings": "assets/mc/item/leather_leggings.png",
    "item/legs_leather": "assets/mc/item/legs_leather.png",
    "boots_leather": "assets/mc/item/boots_leather.png",
    "leather_boots": "assets/mc/item/leather_boots.png",
    "item/leather_boots": "assets/mc/item/leather_boots.png",
    "item/boots_leather": "assets/mc/item/boots_leather.png",
    "wood_hammer": "assets/mc/item/wood_hammer.png",
    "wooden_hammer": "assets/mc/item/wooden_hammer.png",
    "stone_hammer": "assets/mc/item/stone_hammer.png",
    "iron_hammer": "assets/mc/item/iron_hammer.png",
    "gold_hammer": "assets/mc/item/gold_hammer.png",
    "golden_hammer": "assets/mc/item/golden_hammer.png",
    "diamond_hammer": "assets/mc/item/diamond_hammer.png",
    "netherite_hammer": "assets/mc/item/netherite_hammer.png",
    "hammer": "assets/mc/item/hammer.png",
    "wood_excavator": "assets/mc/item/wood_excavator.png",
    "wooden_excavator": "assets/mc/item/wooden_excavator.png",
    "stone_excavator": "assets/mc/item/stone_excavator.png",
    "iron_excavator": "assets/mc/item/iron_excavator.png",
    "gold_excavator": "assets/mc/item/gold_excavator.png",
    "golden_excavator": "assets/mc/item/golden_excavator.png",
    "diamond_excavator": "assets/mc/item/diamond_excavator.png",
    "netherite_excavator": "assets/mc/item/netherite_excavator.png",
    "excavator": "assets/mc/item/excavator.png",
    "item/hammer": "assets/mc/item/hammer.png",
    "item/diamond_hammer": "assets/mc/item/diamond_hammer.png",
    "item/wood_hammer": "assets/mc/item/wood_hammer.png",
    "item/stone_hammer": "assets/mc/item/stone_hammer.png",
    "item/iron_hammer": "assets/mc/item/iron_hammer.png",
    "item/gold_hammer": "assets/mc/item/gold_hammer.png",
    "item/netherite_hammer": "assets/mc/item/netherite_hammer.png",
    "item/excavator": "assets/mc/item/excavator.png",
    "item/diamond_excavator": "assets/mc/item/diamond_excavator.png",
    "item/wood_excavator": "assets/mc/item/wood_excavator.png",
    "item/stone_excavator": "assets/mc/item/stone_excavator.png",
    "item/iron_excavator": "assets/mc/item/iron_excavator.png",
    "item/gold_excavator": "assets/mc/item/gold_excavator.png",
    "item/netherite_excavator": "assets/mc/item/netherite_excavator.png",
    "item_frame": "assets/mc/item/item_frame.png",
    "destroy_stage_0": "assets/mc/block/destroy_stage_0.png",
    "destroy_stage_1": "assets/mc/block/destroy_stage_1.png",
    "destroy_stage_2": "assets/mc/block/destroy_stage_2.png",
    "destroy_stage_3": "assets/mc/block/destroy_stage_3.png",
    "destroy_stage_4": "assets/mc/block/destroy_stage_4.png",
    "destroy_stage_5": "assets/mc/block/destroy_stage_5.png",
    "destroy_stage_6": "assets/mc/block/destroy_stage_6.png",
    "destroy_stage_7": "assets/mc/block/destroy_stage_7.png",
    "destroy_stage_8": "assets/mc/block/destroy_stage_8.png",
    "destroy_stage_9": "assets/mc/block/destroy_stage_9.png",
    "aether_portal": "assets/mc/block/aether_portal.png",
    "end_gateway_beam": "assets/mc/block/end_gateway_beam.png",
    "end_portal_frame_side": "assets/mc/block/end_portal_frame_side.png",
    "end_portal_frame_top": "assets/mc/block/end_portal_frame_top.png",
    "end_portal_frame_eye": "assets/mc/block/end_portal_frame_eye.png",
    "end_portal": "assets/mc/block/end_portal.png",
    "dragon_egg": "assets/mc/block/dragon_egg.png",
    "end_stone": "assets/mc/block/end_stone.png",
    "fern": "assets/mc/block/fern.png",
    "fire_0": "assets/mc/block/fire_0.png",
    "fire_coral": "assets/mc/block/fire_coral.png",
    "furnace_front": "assets/mc/block/furnace_front.png",
    "furnace_side": "assets/mc/block/furnace_side.png",
    "furnace_top": "assets/mc/block/furnace_top.png",
    "glass": "assets/mc/block/glass.png",
    "glowstone": "assets/mc/block/glowstone.png",
    "gold_block": "assets/mc/block/gold_block.png",
    "gold_ore": "assets/mc/block/gold_ore.png",
    "grass_block_side": "assets/mc/block/grass_block_side.png",
    "grass_block_top": "assets/mc/block/grass_block_top.png",
    "gravel": "assets/mc/block/gravel.png",
    "horn_coral": "assets/mc/block/horn_coral.png",
    "ice": "assets/mc/block/ice.png",
    "packed_ice": "assets/mc/block/packed_ice.png",
    "blue_ice": "assets/mc/block/blue_ice.png",
    "iron_block": "assets/mc/block/iron_block.png",
    "iron_ore": "assets/mc/block/iron_ore.png",
    "jungle_planks": "assets/mc/block/jungle_planks.png",
    "kelp": "assets/mc/block/kelp.png",
    "kelp_plant": "assets/mc/block/kelp_plant.png",
    "ladder": "assets/mc/block/ladder.png",
    "lapis_ore": "assets/mc/block/lapis_ore.png",
    "lava_flow": "assets/mc/block/lava_flow.png",
    "lily_of_the_valley": "assets/mc/block/lily_of_the_valley.png",
    "lily_pad": "assets/mc/block/lily_pad.png",
    "magma": "assets/mc/block/magma.png",
    "moss_block": "assets/mc/block/moss_block.png",
    "rooted_dirt": "assets/mc/block/rooted_dirt.png",
    "dripstone_block": "assets/mc/block/dripstone_block.png",
    "pointed_dripstone_down_tip": "assets/mc/block/pointed_dripstone_down_tip.png",
    "pointed_dripstone_down_frustum": "assets/mc/block/pointed_dripstone_down_frustum.png",
    "pointed_dripstone_down_middle": "assets/mc/block/pointed_dripstone_down_middle.png",
    "pointed_dripstone_down_base": "assets/mc/block/pointed_dripstone_down_base.png",
    "pointed_dripstone_down_tip_merge": "assets/mc/block/pointed_dripstone_down_tip_merge.png",
    "pointed_dripstone_up_tip": "assets/mc/block/pointed_dripstone_up_tip.png",
    "pointed_dripstone_up_frustum": "assets/mc/block/pointed_dripstone_up_frustum.png",
    "pointed_dripstone_up_middle": "assets/mc/block/pointed_dripstone_up_middle.png",
    "pointed_dripstone_up_base": "assets/mc/block/pointed_dripstone_up_base.png",
    "pointed_dripstone_up_tip_merge": "assets/mc/block/pointed_dripstone_up_tip_merge.png",
    "spore_blossom": "assets/mc/block/spore_blossom.png",
    "cave_vines": "assets/mc/block/cave_vines.png",
    "azalea_leaves": "assets/mc/block/azalea_leaves.png",
    "flowering_azalea_leaves": "assets/mc/block/flowering_azalea_leaves.png",
    "mossy_cobblestone": "assets/mc/block/mossy_cobblestone.png",
    "mushroom_stem": "assets/mc/block/mushroom_stem.png",
    "mycelium_side": "assets/mc/block/mycelium_side.png",
    "mycelium_top": "assets/mc/block/mycelium_top.png",
    "nautilus_shell": "assets/mc/block/nautilus_shell.png",
    "netherrack": "assets/mc/block/netherrack.png",
    "nether_bricks": "assets/mc/block/nether_bricks.png",
    "nether_portal": "assets/mc/block/nether_portal.png",
    "nether_sprouts": "assets/mc/block/nether_sprouts.png",
    "nether_wart_block": "assets/mc/block/nether_wart_block.png",
    "oak_door_bottom": "assets/mc/block/oak_door_bottom.png",
    "oak_door_top": "assets/mc/block/oak_door_top.png",
    "oak_door": "assets/mc/item/oak_door.png",
    "iron_door": "assets/mc/item/iron_door.png",
    "oak_leaves": "assets/mc/block/oak_leaves.png",
    "oak_log": "assets/mc/block/oak_log.png",
    "oak_log_top": "assets/mc/block/oak_log_top.png",
    "oak_planks": "assets/mc/block/oak_planks.png",
    "mangrove_log": "assets/mc/block/mangrove_log.png",
    "mangrove_log_top": "assets/mc/block/mangrove_log_top.png",
    "mangrove_leaves": "assets/mc/block/mangrove_leaves.png",
    "mangrove_roots_side": "assets/mc/block/mangrove_roots_side.png",
    "mangrove_roots_top": "assets/mc/block/mangrove_roots_top.png",
    "muddy_mangrove_roots_side": "assets/mc/block/muddy_mangrove_roots_side.png",
    "muddy_mangrove_roots_top": "assets/mc/block/muddy_mangrove_roots_top.png",
    "mangrove_planks": "assets/mc/block/mangrove_planks.png",
    "obsidian": "assets/mc/block/obsidian.png",
    "orange_tulip": "assets/mc/block/orange_tulip.png",
    "pale_oak_leaves": "assets/mc/block/pale_oak_leaves.png",
    "pale_oak_log": "assets/mc/block/pale_oak_log.png",
    "pale_oak_log_top": "assets/mc/block/pale_oak_log_top.png",
    "pink_petals": "assets/mc/block/pink_petals.png",
    "podzol_side": "assets/mc/block/podzol_side.png",
    "podzol_top": "assets/mc/block/podzol_top.png",
    "poppy": "assets/mc/block/poppy.png",
    "purpur_block": "assets/mc/block/purpur_block.png",
    "redstone_ore": "assets/mc/block/redstone_ore.png",
    "red_mushroom": "assets/mc/block/red_mushroom.png",
    "red_mushroom_block": "assets/mc/block/red_mushroom_block.png",
    "brown_mushroom": "assets/mc/block/brown_mushroom.png",
    "brown_mushroom_block": "assets/mc/block/brown_mushroom_block.png",
    "red_sand": "assets/mc/block/red_sand.png",
    "sand": "assets/mc/block/sand.png",
    "sandstone": "assets/mc/block/sandstone.png",
    "sandstone_bottom": "assets/mc/block/sandstone_bottom.png",
    "sandstone_top": "assets/mc/block/sandstone_top.png",
    "seagrass": "assets/mc/block/seagrass.png",
    "sea_lantern": "assets/mc/block/sea_lantern.png",
    "shroomlight": "assets/mc/block/shroomlight.png",
    "smooth_basalt": "assets/mc/block/smooth_basalt.png",
    "smooth_stone": "assets/mc/block/smooth_stone.png",
    "smooth_stone_slab_side": "assets/mc/block/smooth_stone_slab_side.png",
    "snow": "assets/mc/block/snow.png",
    "soul_fire_0": "assets/mc/block/soul_fire_0.png",
    "soul_sand": "assets/mc/block/soul_sand.png",
    "soul_soil": "assets/mc/block/soul_soil.png",
    "spawner": "assets/mc/block/spawner.png",
    "spruce_leaves": "assets/mc/block/spruce_leaves.png",
    "spruce_log": "assets/mc/block/spruce_log.png",
    "spruce_log_top": "assets/mc/block/spruce_log_top.png",
    "spruce_planks": "assets/mc/block/spruce_planks.png",
    "stone": "assets/mc/block/stone.png",
    "stone_bricks": "assets/mc/block/stone_bricks.png",
    "sugar_cane": "assets/mc/block/sugar_cane.png",
    "tall_grass_top": "assets/mc/block/tall_grass_top.png",
    "terracotta": "assets/mc/block/terracotta.png",
    "tnt_bottom": "assets/mc/block/tnt_bottom.png",
    "tnt_side": "assets/mc/block/tnt_side.png",
    "tnt_top": "assets/mc/block/tnt_top.png",
    "torch": "assets/mc/block/torch.png",
    "tube_coral": "assets/mc/block/tube_coral.png",
    "turtle_scute": "assets/mc/block/turtle_scute.png",
    "twisting_vines": "assets/mc/block/twisting_vines.png",
    "vine": "assets/mc/block/vine.png",
    "warped_nylium": "assets/mc/block/warped_nylium.png",
    "warped_nylium_side": "assets/mc/block/warped_nylium_side.png",
    "warped_roots": "assets/mc/block/warped_roots.png",
    "warped_stem": "assets/mc/block/warped_stem.png",
    "warped_stem_top": "assets/mc/block/warped_stem_top.png",
    "warped_wart_block": "assets/mc/block/warped_wart_block.png",
    "water_flow": "assets/mc/block/water_flow.png",
    "water_still": "assets/mc/block/water_still.png",
    "white_wool": "assets/mc/block/white_wool.png",
    "red_wool": "assets/mc/block/red_wool.png",
    "blue_wool": "assets/mc/block/blue_wool.png",
    "yellow_wool": "assets/mc/block/yellow_wool.png",
    "green_wool": "assets/mc/block/green_wool.png",
    "black_wool": "assets/mc/block/black_wool.png",
    "purple_wool": "assets/mc/block/purple_wool.png",
    "orange_wool": "assets/mc/block/orange_wool.png",
    "pink_wool": "assets/mc/block/pink_wool.png",
    "cyan_wool": "assets/mc/block/cyan_wool.png",
    "lime_wool": "assets/mc/block/lime_wool.png",
    "gray_wool": "assets/mc/block/gray_wool.png",
    "light_blue_wool": "assets/mc/block/light_blue_wool.png",
    "brown_wool": "assets/mc/block/brown_wool.png",
    "magenta_wool": "assets/mc/block/magenta_wool.png",
    "light_gray_wool": "assets/mc/block/light_gray_wool.png",
    "red_dye": "assets/mc/item/red_dye.png",
    "yellow_dye": "assets/mc/item/yellow_dye.png",
    "blue_dye": "assets/mc/item/blue_dye.png",
    "white_dye": "assets/mc/item/white_dye.png",
    "black_dye": "assets/mc/item/black_dye.png",
    "green_dye": "assets/mc/item/green_dye.png",
    "purple_dye": "assets/mc/item/purple_dye.png",
    "orange_dye": "assets/mc/item/orange_dye.png",
    "pink_dye": "assets/mc/item/pink_dye.png",
    "cyan_dye": "assets/mc/item/cyan_dye.png",
    "lime_dye": "assets/mc/item/lime_dye.png",
    "magenta_dye": "assets/mc/item/magenta_dye.png",
    "brown_dye": "assets/mc/item/brown_dye.png",
    "gray_dye": "assets/mc/item/gray_dye.png",
    "light_blue_dye": "assets/mc/item/light_blue_dye.png",
    "light_gray_dye": "assets/mc/item/light_gray_dye.png",
    "bone_meal": "assets/mc/item/bone_meal.png",
    "bone": "assets/mc/item/bone.png",
    "white_bed": "assets/mc/item/white_bed.png",
    "orange_bed": "assets/mc/item/orange_bed.png",
    "magenta_bed": "assets/mc/item/magenta_bed.png",
    "light_blue_bed": "assets/mc/item/light_blue_bed.png",
    "yellow_bed": "assets/mc/item/yellow_bed.png",
    "lime_bed": "assets/mc/item/lime_bed.png",
    "pink_bed": "assets/mc/item/pink_bed.png",
    "gray_bed": "assets/mc/item/gray_bed.png",
    "light_gray_bed": "assets/mc/item/light_gray_bed.png",
    "cyan_bed": "assets/mc/item/cyan_bed.png",
    "purple_bed": "assets/mc/item/purple_bed.png",
    "blue_bed": "assets/mc/item/blue_bed.png",
    "brown_bed": "assets/mc/item/brown_bed.png",
    "green_bed": "assets/mc/item/green_bed.png",
    "red_bed": "assets/mc/item/red_bed.png",
    "black_bed": "assets/mc/item/black_bed.png",
    "gunpowder": "assets/mc/item/gunpowder.png",
    "apple": "assets/mc/item/apple.png",
    "beef": "assets/mc/item/beef.png",
    "blaze_rod": "assets/mc/item/blaze_rod.png",
    "blaze_powder": "assets/mc/item/blaze_powder.png",
    "bread": "assets/mc/item/bread.png",
    "bucket": "assets/mc/item/bucket.png",
    "chicken": "assets/mc/item/chicken.png",
    "coal": "assets/mc/item/coal.png",
    "cod": "assets/mc/item/cod.png",
    "cooked_beef": "assets/mc/item/cooked_beef.png",
    "cooked_chicken": "assets/mc/item/cooked_chicken.png",
    "cooked_cod": "assets/mc/item/cooked_cod.png",
    "cooked_mutton": "assets/mc/item/cooked_mutton.png",
    "cooked_porkchop": "assets/mc/item/cooked_porkchop.png",
    "diamond": "assets/mc/item/diamond.png",
    "diamond_axe": "assets/mc/item/diamond_axe.png",
    "diamond_boots": "assets/mc/item/diamond_boots.png",
    "diamond_chestplate": "assets/mc/item/diamond_chestplate.png",
    "diamond_helmet": "assets/mc/item/diamond_helmet.png",
    "diamond_leggings": "assets/mc/item/diamond_leggings.png",
    "diamond_pickaxe": "assets/mc/item/diamond_pickaxe.png",
    "diamond_shovel": "assets/mc/item/diamond_shovel.png",
    "diamond_sword": "assets/mc/item/diamond_sword.png",
    "ender_pearl": "assets/mc/item/ender_pearl.png",
    "eye_of_ender": "assets/mc/item/eye_of_ender.png",
    "flint_and_steel": "assets/mc/item/flint_and_steel.png",
    "golden_axe": "assets/mc/item/golden_axe.png",
    "golden_boots": "assets/mc/item/golden_boots.png",
    "golden_chestplate": "assets/mc/item/golden_chestplate.png",
    "golden_helmet": "assets/mc/item/golden_helmet.png",
    "golden_leggings": "assets/mc/item/golden_leggings.png",
    "golden_pickaxe": "assets/mc/item/golden_pickaxe.png",
    "golden_shovel": "assets/mc/item/golden_shovel.png",
    "golden_sword": "assets/mc/item/golden_sword.png",
    "gold_ingot": "assets/mc/item/gold_ingot.png",
    "iron_axe": "assets/mc/item/iron_axe.png",
    "iron_boots": "assets/mc/item/iron_boots.png",
    "iron_chestplate": "assets/mc/item/iron_chestplate.png",
    "iron_helmet": "assets/mc/item/iron_helmet.png",
    "iron_ingot": "assets/mc/item/iron_ingot.png",
    "iron_leggings": "assets/mc/item/iron_leggings.png",
    "iron_pickaxe": "assets/mc/item/iron_pickaxe.png",
    "iron_shovel": "assets/mc/item/iron_shovel.png",
    "iron_sword": "assets/mc/item/iron_sword.png",
    "lapis_lazuli": "assets/mc/item/lapis_lazuli.png",
    "lava_bucket": "assets/mc/item/lava_bucket.png",
    "mutton": "assets/mc/item/mutton.png",
    "netherite_axe": "assets/mc/item/netherite_axe.png",
    "netherite_ingot": "assets/mc/item/netherite_ingot.png",
    "netherite_pickaxe": "assets/mc/item/netherite_pickaxe.png",
    "netherite_shovel": "assets/mc/item/netherite_shovel.png",
    "netherite_sword": "assets/mc/item/netherite_sword.png",
    "nether_star": "assets/mc/item/nether_star.png",
    "porkchop": "assets/mc/item/porkchop.png",
    "prismarine_shard": "assets/mc/item/prismarine_shard.png",
    "raw_copper": "assets/mc/item/raw_copper.png",
    "raw_gold": "assets/mc/item/raw_gold.png",
    "raw_iron": "assets/mc/item/raw_iron.png",
    "stick": "assets/mc/item/stick.png",
    "stone_axe": "assets/mc/item/stone_axe.png",
    "stone_pickaxe": "assets/mc/item/stone_pickaxe.png",
    "stone_shovel": "assets/mc/item/stone_shovel.png",
    "stone_sword": "assets/mc/item/stone_sword.png",
    "water_bucket": "assets/mc/item/water_bucket.png",
    "wooden_axe": "assets/mc/item/wooden_axe.png",
    "wooden_pickaxe": "assets/mc/item/wooden_pickaxe.png",
    "wooden_shovel": "assets/mc/item/wooden_shovel.png",
    "wooden_sword": "assets/mc/item/wooden_sword.png",
    "icons": "assets/mc/icons.png",
    "mana_bar_bg": "assets/mc/mana_bar_bg.png",
    "mana_bar_fill": "assets/mc/mana_bar_fill.png",
    "steve": "assets/mc/steve.png",
    "widgets": "assets/mc/widgets.png",
    "aether_grass_block_top": "assets/aether/block/aether_grass_top.png",
    "aether_grass_block_side": "assets/aether/block/aether_grass_side.png",
    "skyroot_log": "assets/aether/block/golden_oak_log.png",
    "skyroot_log_top": "assets/aether/block/golden_oak_log.png",
    "skyroot_leaves": "assets/aether/block/golden_oak_leaves.png",
    "crystal_leaves": "assets/aether/block/crystal_leaves.png",
    "white_flower": "assets/mc/block/lily_of_the_valley.png",
    "quicksoil": "assets/mc/block/sand.png",
    "ruby_ore": "assets/mc/block/ruby_ore.png",
    "sapphire_ore": "assets/mc/block/sapphire_ore.png",
    "ruby": "assets/mc/item/ruby.png",
    "sapphire": "assets/mc/item/sapphire.png",
    "mud": "assets/mc/block/mud.png",
    "ruby_sword": "assets/mc/item/ruby_sword.png",
    "ruby_pickaxe": "assets/mc/item/ruby_pickaxe.png",
    "ruby_axe": "assets/mc/item/ruby_axe.png",
    "ruby_shovel": "assets/mc/item/ruby_shovel.png",
    "sapphire_sword": "assets/mc/item/sapphire_sword.png",
    "sapphire_pickaxe": "assets/mc/item/sapphire_pickaxe.png",
    "sapphire_axe": "assets/mc/item/sapphire_axe.png",
    "sapphire_shovel": "assets/mc/item/sapphire_shovel.png",
    "quartz": "assets/mc/item/quartz.png",
    "item/quartz": "assets/mc/item/quartz.png",
    "nether_quartz": "assets/mc/item/quartz.png",
    "item/nether_quartz": "assets/mc/item/quartz.png",
    "netherite_scrap": "assets/mc/item/netherite_scrap.png",
    "large_fern_bottom": "assets/mc/block/large_fern_bottom.png",
    "large_fern_top": "assets/mc/block/large_fern_top.png",
    "bat_spawn_egg": "assets/mc/item/bat_spawn_egg.png",
    "camel_spawn_egg": "assets/mc/item/camel_spawn_egg.png",
    "chicken_spawn_egg": "assets/mc/item/chicken_spawn_egg.png",
    "cod_spawn_egg": "assets/mc/item/cod_spawn_egg.png",
    "cow_spawn_egg": "assets/mc/item/cow_spawn_egg.png",
    "frog_spawn_egg": "assets/mc/item/frog_spawn_egg.png",
    "iron_golem_spawn_egg": "assets/mc/item/iron_golem_spawn_egg.png",
    "magma_cube_spawn_egg": "assets/mc/item/magma_cube_spawn_egg.png",
    "piglin_brute_spawn_egg": "assets/mc/item/piglin_brute_spawn_egg.png",
    "pig_spawn_egg": "assets/mc/item/pig_spawn_egg.png",
    "salmon_spawn_egg": "assets/mc/item/salmon_spawn_egg.png",
    "sheep_spawn_egg": "assets/mc/item/sheep_spawn_egg.png",
    "skeleton_spawn_egg": "assets/mc/item/skeleton_spawn_egg.png",
    "slime_spawn_egg": "assets/mc/item/slime_spawn_egg.png",
    "spider_spawn_egg": "assets/mc/item/spider_spawn_egg.png",
    "tropical_fish_spawn_egg": "assets/mc/item/tropical_fish_spawn_egg.png",
    "turtle_spawn_egg": "assets/mc/item/turtle_spawn_egg.png",
    "zombie_spawn_egg": "assets/mc/item/zombie_spawn_egg.png",
    "creeper_spawn_egg": "assets/mc/item/creeper_spawn_egg.png",
    "enderman_spawn_egg": "assets/mc/item/enderman_spawn_egg.png",
    "pufferfish_spawn_egg": "assets/mc/item/pufferfish_spawn_egg.png",
    "chorus_plant": "assets/mc/block/chorus_plant.png",
    "chorus_flower": "assets/mc/block/chorus_flower.png",
    "chorus_flower_dead": "assets/mc/block/chorus_flower_dead.png",
    "chorus_fruit": "assets/mc/item/chorus_fruit.png",
    "item/chorus_fruit": "assets/mc/item/chorus_fruit.png",
    "sweet_berry_bush": "assets/mc/block/sweet_berry_bush.png",
    "sweet_berries": "assets/mc/item/sweet_berries.png",
    "item/sweet_berries": "assets/mc/item/sweet_berries.png",
    "snowball": "assets/mc/item/snowball.png",
    "item/snowball": "assets/mc/item/snowball.png",
    "emerald_ore": "assets/mc/block/emerald_ore.png",
    "melon_side": "assets/mc/block/melon_side.png",
    "melon_top": "assets/mc/block/melon_top.png",
    "jungle_log": "assets/mc/block/jungle_log.png",
    "jungle_log_top": "assets/mc/block/jungle_log_top.png",
    "jungle_leaves": "assets/mc/block/jungle_leaves.png",
    "orange_terracotta": "assets/mc/block/orange_terracotta.png",
    "yellow_terracotta": "assets/mc/block/yellow_terracotta.png",
    "white_terracotta": "assets/mc/block/white_terracotta.png",
    "brown_terracotta": "assets/mc/block/brown_terracotta.png",
    "red_terracotta": "assets/mc/block/red_terracotta.png",
    "light_gray_terracotta": "assets/mc/block/light_gray_terracotta.png",
    "melon_slice": "assets/mc/item/melon_slice.png",
    "item/melon_slice": "assets/mc/item/melon_slice.png",
    "nether_quartz_ore": "assets/mc/block/nether_quartz_ore.png",
    "nether_gold_ore": "assets/mc/block/nether_gold_ore.png",
    "end_sky": "assets/mc/block/end_sky.png",

    // Farming & Crops Blocks
    "farmland": "assets/mc/block/farmland.png",
    "farmland_moist": "assets/mc/block/farmland_moist.png",
    "pumpkin_top": "assets/mc/block/pumpkin_top.png",
    "pumpkin_side": "assets/mc/block/pumpkin_side.png",
    "pumpkin_stem": "assets/mc/block/pumpkin_stem.png",
    "melon_stem": "assets/mc/block/melon_stem.png",
    "wheat_stage0": "assets/mc/block/wheat_stage0.png",
    "wheat_stage1": "assets/mc/block/wheat_stage1.png",
    "wheat_stage2": "assets/mc/block/wheat_stage2.png",
    "wheat_stage3": "assets/mc/block/wheat_stage3.png",
    "wheat_stage4": "assets/mc/block/wheat_stage4.png",
    "wheat_stage5": "assets/mc/block/wheat_stage5.png",
    "wheat_stage6": "assets/mc/block/wheat_stage6.png",
    "wheat_stage7": "assets/mc/block/wheat_stage7.png",
    "carrots_stage0": "assets/mc/block/carrots_stage0.png",
    "carrots_stage1": "assets/mc/block/carrots_stage1.png",
    "carrots_stage2": "assets/mc/block/carrots_stage2.png",
    "carrots_stage3": "assets/mc/block/carrots_stage3.png",
    "potatoes_stage0": "assets/mc/block/potatoes_stage0.png",
    "potatoes_stage1": "assets/mc/block/potatoes_stage1.png",
    "potatoes_stage2": "assets/mc/block/potatoes_stage2.png",
    "potatoes_stage3": "assets/mc/block/potatoes_stage3.png",
    "beetroots_stage0": "assets/mc/block/beetroots_stage0.png",
    "beetroots_stage1": "assets/mc/block/beetroots_stage1.png",
    "beetroots_stage2": "assets/mc/block/beetroots_stage2.png",
    "beetroots_stage3": "assets/mc/block/beetroots_stage3.png",

    // Farming & Food Items
    "wooden_hoe": "assets/mc/item/wooden_hoe.png",
    "stone_hoe": "assets/mc/item/stone_hoe.png",
    "iron_hoe": "assets/mc/item/iron_hoe.png",
    "golden_hoe": "assets/mc/item/golden_hoe.png",
    "diamond_hoe": "assets/mc/item/diamond_hoe.png",
    "netherite_hoe": "assets/mc/item/netherite_hoe.png",
    "wheat_seeds": "assets/mc/item/wheat_seeds.png",
    "carrot": "assets/mc/item/carrot.png",
    "potato": "assets/mc/item/potato.png",
    "baked_potato": "assets/mc/item/baked_potato.png",
    "poisonous_potato": "assets/mc/item/poisonous_potato.png",
    "beetroot": "assets/mc/item/beetroot.png",
    "beetroot_seeds": "assets/mc/item/beetroot_seeds.png",
    "pumpkin_seeds": "assets/mc/item/pumpkin_seeds.png",
    "melon_seeds": "assets/mc/item/melon_seeds.png",
    "cookie": "assets/mc/item/cookie.png",
    "item/cookie": "assets/mc/item/cookie.png",
    "pumpkin_pie": "assets/mc/item/pumpkin_pie.png",
    "item/pumpkin_pie": "assets/mc/item/pumpkin_pie.png",
    "beetroot_soup": "assets/mc/item/beetroot_soup.png",
    "item/beetroot_soup": "assets/mc/item/beetroot_soup.png",
    "slime_ball": "assets/mc/item/slime_ball.png",
    "item/slime_ball": "assets/mc/item/slime_ball.png",
    "magma_cream": "assets/mc/item/magma_cream.png",
    "item/magma_cream": "assets/mc/item/magma_cream.png",
    "cocoa_beans": "assets/mc/item/cocoa_beans.png",
    "item/cocoa_beans": "assets/mc/item/cocoa_beans.png",
    "slime_block": "assets/mc/block/slime_block.png",
    "block/slime_block": "assets/mc/block/slime_block.png",
    "dirt_path_top": "assets/mc/block/dirt_path_top.png",
    "dirt_path_side": "assets/mc/block/dirt_path_side.png",
    "deepslate_bricks": "assets/mc/block/deepslate_bricks.png",
    "deepslate_tiles": "assets/mc/block/deepslate_tiles.png",
    "red_nether_bricks": "assets/mc/block/red_nether_bricks.png",
    "prismarine_bricks": "assets/mc/block/prismarine_bricks.png",
    "mossy_stone_bricks": "assets/mc/block/mossy_stone_bricks.png",
    "cut_sandstone": "assets/mc/block/cut_sandstone.png",
    "polished_blackstone_bricks": "assets/mc/block/polished_blackstone_bricks.png",
    "polished_blackstone": "assets/mc/block/polished_blackstone.png",
    "warped_planks": "assets/mc/block/warped_planks.png",
    "chiseled_polished_blackstone": "assets/mc/block/chiseled_polished_blackstone.png",

    // Mod Items: Tinkers' Construct & Aether
    "slime_boots": "assets/mc/item/slime_boots.png",
    "boots_slime": "assets/mc/item/slime_boots.png",
    "cloud_parachute": "assets/mc/item/cloud_parachute.png",
    "cold_parachute": "assets/mc/item/cloud_parachute.png",
    "lead": "assets/mc/item/lead.png",
    "item/lead": "assets/mc/item/lead.png",
    "hammer": "assets/mc/item/hammer.png",
    "stone_hammer": "assets/mc/item/stone_hammer.png",
    "wood_hammer": "assets/mc/item/wood_hammer.png",
    "iron_hammer": "assets/mc/item/iron_hammer.png",
    "gold_hammer": "assets/mc/item/gold_hammer.png",
    "diamond_hammer": "assets/mc/item/diamond_hammer.png",
    "netherite_hammer": "assets/mc/item/netherite_hammer.png",
    "excavator": "assets/mc/item/excavator.png",
    "stone_excavator": "assets/mc/item/stone_excavator.png",
    "wood_excavator": "assets/mc/item/wood_excavator.png",
    "iron_excavator": "assets/mc/item/iron_excavator.png",
    "gold_excavator": "assets/mc/item/gold_excavator.png",
    "diamond_excavator": "assets/mc/item/diamond_excavator.png",
    "netherite_excavator": "assets/mc/item/netherite_excavator.png",
    "golden_feather": "assets/mc/item/golden_feather.png"
};

function loadMinecraftTexture(name) {
    if (name.startsWith('chest://')) {
        return loadMinecraftChestTexture(name.slice(8));
    }
    const cleanName = name.replace(/^aether:\/\//, '');
    const localPath = LOCAL_ASSET_MAP[cleanName] || LOCAL_ASSET_MAP[cleanName.replace(/^.*\//, '')];

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
            // Local fallback failed, try remote (jsdelivr CDN for reliability)
            const remoteImg = new Image();
            remoteImg.crossOrigin = 'anonymous';
            remoteImg.onload = () => resolve(remoteImg);
            remoteImg.onerror = () => {
                // Secondary fallback to raw github
                const rawImg = new Image();
                rawImg.crossOrigin = 'anonymous';
                rawImg.onload = () => resolve(rawImg);
                rawImg.onerror = () => resolve(null);
                const subPath = cleanName.includes('/') ? cleanName : ('block/' + cleanName);
                rawImg.src = MINECRAFT_ASSETS_BASE + subPath + '.png';
            };
            const subPath = cleanName.includes('/') ? cleanName : ('block/' + cleanName);
            if (cleanName === 'slime_boots' || cleanName === 'boots_slime') {
                remoteImg.src = "https://raw.githubusercontent.com/SlimeKnights/TinkersConstruct/1.12/resources/assets/tconstruct/textures/items/armor/slime_boots.png";
            } else if (cleanName === 'cloud_parachute' || cleanName === 'cold_parachute') {
                remoteImg.src = "https://raw.githubusercontent.com/Mr-Aerod/Jappafied-Aethers/1.20/assets/aether/textures/item/miscellaneous/cold_parachute.png";
            } else if (cleanName === 'golden_feather') {
                remoteImg.src = "https://raw.githubusercontent.com/Mr-Aerod/Jappafied-Aethers/1.20/assets/aether/textures/item/accessories/golden_feather.png";
            } else {
                remoteImg.src = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/" + subPath + '.png';
            }
        };

        if (localPath) {
            img.src = localPath;
        } else if (cleanName === 'slime_boots' || cleanName === 'boots_slime') {
            img.crossOrigin = 'anonymous';
            img.src = "https://raw.githubusercontent.com/SlimeKnights/TinkersConstruct/1.12/resources/assets/tconstruct/textures/items/armor/slime_boots.png";
        } else if (cleanName === 'cloud_parachute' || cleanName === 'cold_parachute') {
            img.crossOrigin = 'anonymous';
            img.src = "https://raw.githubusercontent.com/Mr-Aerod/Jappafied-Aethers/1.20/assets/aether/textures/item/miscellaneous/cold_parachute.png";
        } else if (cleanName === 'golden_feather') {
            img.crossOrigin = 'anonymous';
            img.src = "https://raw.githubusercontent.com/Mr-Aerod/Jappafied-Aethers/1.20/assets/aether/textures/item/accessories/golden_feather.png";
        } else {
            img.crossOrigin = 'anonymous';
            const subPath = cleanName.includes('/') ? cleanName : ('block/' + cleanName);
            img.src = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/" + subPath + '.png';
        }
    });
}

function applyNormalizedTint(ctx, width, height, hexColor) {
    if (!hexColor || hexColor === '#ffffff') return;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const tr = parseInt(hexColor.slice(1, 3), 16);
    const tg = parseInt(hexColor.slice(3, 5), 16);
    const tb = parseInt(hexColor.slice(5, 7), 16);

    let sumL = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 10) {
            sumL += (data[i] + data[i + 1] + data[i + 2]) / 3;
            count++;
        }
    }
    const avgL = count > 0 ? (sumL / count) : 128;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 10) {
            const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const scale = lum / avgL;
            data[i] = Math.min(255, Math.max(0, Math.round(tr * scale)));
            data[i + 1] = Math.min(255, Math.max(0, Math.round(tg * scale)));
            data[i + 2] = Math.min(255, Math.max(0, Math.round(tb * scale)));
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

export async function createTextureAtlas(useMinecraft = true) {
    // Calculate atlas layout
    // Each block gets at most 3 faces (top, side, bottom)
    // We lay them out linearly
    const entries = []; // { blockType, face, col, row }
    let col = 0, row = 0;

    const uvMap = {}; // blockType -> { top: {u,v}, side: {u,v}, bottom: {u,v} }

    for (const key of Object.keys(BLOCKS)) {
        const bt = BLOCKS[key];
        if (bt === BLOCKS.AIR) continue;

        if (hasFaceVariants(bt)) {
            uvMap[bt] = {};
            const faces = (bt === BLOCKS.END_PORTAL_FRAME_EYE)
                ? ['top', 'side', 'bottom', 'front', 'eye']
                : ((bt === BLOCKS.POINTED_DRIPSTONE_DOWN || bt === BLOCKS.POINTED_DRIPSTONE_UP)
                    ? ['tip', 'frustum', 'middle', 'base', 'merge', 'side', 'top', 'bottom']
                    : ['top', 'side', 'bottom', 'front']);
            if (bt === BLOCKS.GRASS) {
                for (const bName of Object.keys(BIOME_GRASS_HUES)) {
                    faces.push('side_' + bName);
                }
            }
            for (const face of faces) {
                entries.push({ blockType: bt, face, col, row });
                uvMap[bt][face] = { col, row };
                col++;
                if (col >= ATLAS_COLS) { col = 0; row++; }
            }
        } else {
            entries.push({ blockType: bt, face: 'all', col, row });
            uvMap[bt] = { top: { col, row }, side: { col, row }, bottom: { col, row }, front: { col, row } };
            col++;
            if (col >= ATLAS_COLS) { col = 0; row++; }
        }
    }

    if (uvMap[BLOCKS.GRASS]) {
        for (const bName of Object.keys(BIOME_GRASS_HUES)) {
            const sideEntry = uvMap[BLOCKS.GRASS]['side_' + bName];
            if (sideEntry) {
                if (uvMap[BLOCKS.SWAMP_GRASS]) uvMap[BLOCKS.SWAMP_GRASS]['side_' + bName] = sideEntry;
                if (uvMap[BLOCKS.SAVANNA_GRASS]) uvMap[BLOCKS.SAVANNA_GRASS]['side_' + bName] = sideEntry;
            }
        }
    }
    const totalRows = row + (col > 0 ? 1 : 0);
    const atlasW = ATLAS_COLS * TEX_SIZE;
    const nextPOT = (n) => Math.pow(2, Math.ceil(Math.log2(Math.max(16, n))));
    const atlasH = nextPOT(totalRows * TEX_SIZE);

    const canvas = document.createElement('canvas');
    canvas.width = atlasW;
    canvas.height = atlasH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    // Temp canvas for per-texture generation
    const tmp = document.createElement('canvas');
    tmp.width = TEX_SIZE;
    tmp.height = TEX_SIZE;
    const tmpCtx = tmp.getContext('2d', { willReadFrequently: true });
    tmpCtx.imageSmoothingEnabled = false;

    const rng = seededRandom(42);

    const animatedFrames = [];

    for (const entry of entries) {
        tmpCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
        generateBlockTexture(tmpCtx, entry.blockType, entry.face === 'all' ? 'side' : entry.face, rng);
        ctx.drawImage(tmp, entry.col * TEX_SIZE, entry.row * TEX_SIZE);

        if (entry.blockType === BLOCKS.WATER || entry.blockType === BLOCKS.LAVA || entry.blockType === BLOCKS.SWAMP_WATER || entry.blockType === BLOCKS.FIRE || entry.blockType === BLOCKS.SOUL_FIRE) {
            const fCanvas = document.createElement('canvas');
            fCanvas.width = TEX_SIZE; fCanvas.height = TEX_SIZE;
            fCanvas.getContext('2d').drawImage(tmp, 0, 0);
            animatedFrames.push({
                x: entry.col * TEX_SIZE,
                y: entry.row * TEX_SIZE,
                canvas: fCanvas
            });
        }
    }


    function tintGrassSideFringe(sideImg, hexColor) {
        const c = document.createElement('canvas');
        c.width = TEX_SIZE; c.height = TEX_SIZE;
        const ctx2 = c.getContext('2d', { willReadFrequently: true });
        ctx2.imageSmoothingEnabled = false;
        ctx2.drawImage(sideImg, 0, 0, TEX_SIZE, TEX_SIZE);
        const imgData = ctx2.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
        const data = imgData.data;
        const tr = parseInt(hexColor.slice(1, 3), 16);
        const tg = parseInt(hexColor.slice(3, 5), 16);
        const tb = parseInt(hexColor.slice(5, 7), 16);
        
        let sumL = 0, count = 0;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < TEX_SIZE; x++) {
                const idx = (y * TEX_SIZE + x) * 4;
                const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                if (g > r && g > b) {
                    sumL += (r * 0.299 + g * 0.587 + b * 0.114);
                    count++;
                }
            }
        }
        const avgL = count > 0 ? (sumL / count) : 119.3;
        
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < TEX_SIZE; x++) {
                const idx = (y * TEX_SIZE + x) * 4;
                const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                if (g > r && g > b) {
                    const lum = (r * 0.299 + g * 0.587 + b * 0.114);
                    const scale = lum / avgL;
                    data[idx] = Math.min(255, Math.max(0, Math.round(tr * scale)));
                    data[idx + 1] = Math.min(255, Math.max(0, Math.round(tg * scale)));
                    data[idx + 2] = Math.min(255, Math.max(0, Math.round(tb * scale)));
                }
            }
        }
        ctx2.putImageData(imgData, 0, 0);
        return c;
    }

    // Fetch Minecraft textures if enabled
    if (useMinecraft) {
        const promises = [];
        for (const entry of entries) {
            if (entry.face.startsWith('side_')) continue; // Sub-biome entries are populated when primary 'side' loads
            const bt = entry.blockType;
            let mcName = MC_TEXTURE_MAP[bt];
            if (!mcName) continue;
            
            let texName;
            if (typeof mcName === 'string') {
                texName = mcName;
            } else {
                texName = mcName[entry.face] || mcName['side'];
            }
            
            if (texName) {
                promises.push(loadMinecraftTexture(texName).then(img => {
                        if (img) {
                        ctx.clearRect(entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                        
                        // Dynamic colormap tinted textures are kept grayscale in atlas so vertex colors blend dynamically
                        const isWater = (texName === 'water_flow' || texName === 'water_still');
                        const isStem = (texName === 'pumpkin_stem' || texName === 'melon_stem');
                        const requiresTint = (texName === 'grass_block_top' || texName.includes('leaves') || texName === 'vine' || texName.includes('fern') || texName.includes('tall_grass') || texName === 'lily_pad' || isWater || isStem);
                        
                        // Helper: force all pixels in atlas region to fully opaque
                        const forceOpaque = (ax, ay) => {
                            const pd = ctx.getImageData(ax, ay, TEX_SIZE, TEX_SIZE);
                            for (let pi = 3; pi < pd.data.length; pi += 4) pd.data[pi] = 255;
                            ctx.putImageData(pd, ax, ay);
                        };

                        let tintColor = null;
                        if (requiresTint) {
                            // Draw the image first to a temporary canvas so we can tint it
                            const tCanvas = document.createElement('canvas');
                            tCanvas.width = TEX_SIZE; tCanvas.height = TEX_SIZE;
                            const tCtx = tCanvas.getContext('2d', { willReadFrequently: true });
                            tCtx.imageSmoothingEnabled = false;
                            
                            // Determine authentic Minecraft tint color
                            let tint = '#556d33'; // Authentic muted Minecraft plains grass green (matches Java edition)
                            
                            if (isWater) {
                                tint = (bt === BLOCKS.SWAMP_WATER) ? '#617B59' : '#3F76E4';
                            } else if (isStem) {
                                tint = '#c19b33'; // Authentic Minecraft golden-tan/brown stem color
                            } else if (texName === 'grass_block_top') {
                                if (bt === BLOCKS.SWAMP_GRASS) {
                                    tint = '#6A7039'; // Authentic dark murky swamp grass
                                } else if (bt === BLOCKS.SAVANNA_GRASS) {
                                    tint = '#BFB755'; // Authentic dry golden savanna grass
                                } else {
                                    tint = '#91BD59'; // Authentic official Minecraft plains grass (#91BD59)
                                }
                            } else if (texName.includes('leaves')) {
                                if (texName === 'azalea_leaves' || texName === 'flowering_azalea_leaves' || texName === 'cherry_leaves' || texName === 'pale_oak_leaves' || bt === BLOCKS.CHERRY_LEAVES) {
                                    tint = '#ffffff'; // Pre-colored textures in assets/mc/block/
                                } else if (bt === BLOCKS.PINE_LEAVES || texName === 'spruce_leaves') {
                                    tint = '#364c38'; // Authentic dark spruce needle green
                                } else if (bt === BLOCKS.BIRCH_LEAVES || texName === 'birch_leaves') {
                                    tint = '#4e682e'; // Authentic soft golden-olive birch foliage
                                } else if (bt === BLOCKS.JUNGLE_LEAVES || texName === 'jungle_leaves') {
                                    tint = '#2e5616'; // Authentic jungle foliage
                                } else if (bt === BLOCKS.DARK_OAK_LEAVES || texName === 'dark_oak_leaves') {
                                    tint = '#243a14'; // Authentic deep dark forest green
                                } else if (bt === BLOCKS.ACACIA_LEAVES || texName === 'acacia_leaves') {
                                    tint = '#4e5620'; // Authentic dry savanna foliage
                                } else if (bt === BLOCKS.MANGROVE_LEAVES || texName === 'mangrove_leaves') {
                                    tint = '#445c1e'; // Authentic mangrove swamp foliage
                                } else {
                                    tint = '#2e4a18'; // Authentic Minecraft oak foliage (matches in-game Java foliage)
                                }
                            } else if (texName === 'lily_pad') {
                                tint = '#1e5e24';
                            } else if (texName === 'vine') {
                                tint = '#ffffff'; // Kept grayscale in atlas so vertex colors dynamically apply authentic biome foliage color!
                            } else {
                                tint = '#556d33';
                            }

                            tCtx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
                            tintColor = tint;
                            if (tint && tint !== '#ffffff') {
                                applyNormalizedTint(tCtx, TEX_SIZE, TEX_SIZE, tint);
                            }
                            ctx.drawImage(tCanvas, entry.col * TEX_SIZE, entry.row * TEX_SIZE);
                            if (isWater) {
                                forceOpaque(entry.col * TEX_SIZE, entry.row * TEX_SIZE);
                            }
                        } else if (texName === 'end_portal_frame_side') {
                            ctx.drawImage(img, 0, 3, TEX_SIZE, 13, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                        } else if (texName === 'stonecutter_side') {
                            const ax = entry.col * TEX_SIZE;
                            const ay = entry.row * TEX_SIZE;
                            // In Minecraft assets, stonecutter_side.png has rows 0..6 transparent and rows 7..15 containing the 9-pixel solid stone plinth.
                            // When rendered with pushCustomBox(x, y, z, x + 1, y + 9/16, z + 1) where height is 9/16,
                            // the mesh UV samples v from 0 to 9/16 (rows 0 to 8).
                            // Copy rows 7..15 into rows 0..8 of the atlas tile, so the 9-pixel base maps 1:1!
                            ctx.drawImage(img, 0, 7, TEX_SIZE, 9, ax, ay, TEX_SIZE, 9);
                            // Fill remaining rows 9..15 with the stone texture as well
                            ctx.drawImage(img, 0, 7, TEX_SIZE, 7, ax, ay + 9, TEX_SIZE, 7);
                        } else if (img.width !== TEX_SIZE || img.height !== TEX_SIZE) {
                            if (img.height > img.width) {
                                ctx.drawImage(img, 0, 0, img.width, img.width, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                            } else {
                                ctx.drawImage(img, 0, 0, img.width, img.height, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                            }
                        } else {
                            if (texName === 'grass_block_side') {
                                const defaultSide = tintGrassSideFringe(img, BIOME_GRASS_HUES['Plains']);
                                ctx.drawImage(defaultSide, 0, 0, TEX_SIZE, TEX_SIZE, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                                // Also generate side for each biome
                                if (entry.blockType === BLOCKS.GRASS && entry.face === 'side') {
                                    for (const [bName, hex] of Object.entries(BIOME_GRASS_HUES)) {
                                        const bEntry = entries.find(e => e.blockType === BLOCKS.GRASS && e.face === ('side_' + bName));
                                        if (bEntry) {
                                            const bCvs = tintGrassSideFringe(img, hex);
                                            ctx.clearRect(bEntry.col * TEX_SIZE, bEntry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                                            ctx.drawImage(bCvs, 0, 0, TEX_SIZE, TEX_SIZE, bEntry.col * TEX_SIZE, bEntry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                                        }
                                    }
                                } else if (entry.blockType === BLOCKS.SWAMP_GRASS && entry.face === 'side') {
                                    const swampSide = tintGrassSideFringe(img, BIOME_GRASS_HUES['Swamp']);
                                    ctx.clearRect(entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                                    ctx.drawImage(swampSide, 0, 0, TEX_SIZE, TEX_SIZE, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                                } else if (entry.blockType === BLOCKS.SAVANNA_GRASS && entry.face === 'side') {
                                    const savannaSide = tintGrassSideFringe(img, BIOME_GRASS_HUES['Savanna']);
                                    ctx.clearRect(entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                                    ctx.drawImage(savannaSide, 0, 0, TEX_SIZE, TEX_SIZE, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                                }
                            } else {
                            ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE);
                        }
                        }

                        // For water blocks: force all atlas pixels fully opaque so material opacity controls transparency
                        if (isWater) {
                            forceOpaque(entry.col * TEX_SIZE, entry.row * TEX_SIZE);
                        }
                        
                        // If animated strip, save it to animatedFrames
                        if (img.height > img.width) {
                            const frameSize = img.width;
                            const numFrames = Math.floor(img.height / frameSize);
                            const forceOpaqueFlag = isWater;
                            let frameInfo = animatedFrames.find(f => f.x === entry.col * TEX_SIZE && f.y === entry.row * TEX_SIZE);
                            if (frameInfo) {
                                frameInfo.isMC = true;
                                frameInfo.img = img;
                                frameInfo.frameSize = frameSize;
                                frameInfo.frames = numFrames;
                                frameInfo.tint = tintColor;
                                frameInfo.forceOpaque = forceOpaqueFlag;
                                frameInfo.preProcessedCanvas = null;
                            } else {
                                frameInfo = {
                                    x: entry.col * TEX_SIZE,
                                    y: entry.row * TEX_SIZE,
                                    isMC: true,
                                    img: img,
                                    frameSize: frameSize,
                                    frames: numFrames,
                                    tint: tintColor,
                                    forceOpaque: forceOpaqueFlag,
                                    preProcessedCanvas: null,
                                };
                                animatedFrames.push(frameInfo);
                            }
                            prepareAnimatedFrame(frameInfo);
                        }
                    }
                }));
            }
        }
        await Promise.all(promises);

        // Preload all Minecraft item textures so slots never glitch or pop
        const itemPromises = [];
        for (const [subtype, mcName] of Object.entries(MC_ITEM_MAP)) {
            const isEgg = subtype.includes('spawn_egg');
            const cleanSub = subtype.replace(/^spawn_egg_/, '').replace(/_spawn_egg$/, '');
            const cacheKey = isEgg ? `spawn_egg_${cleanSub}` : subtype;
            if (!_itemCanvasCache.has(cacheKey)) {
                itemPromises.push(loadMinecraftTexture(mcName).then(img => {
                    if (img) {
                        const itemCvs = document.createElement('canvas');
                        itemCvs.width = TEX_SIZE; itemCvs.height = TEX_SIZE;
                        const ictx = itemCvs.getContext('2d');
                        ictx.imageSmoothingEnabled = false;
                        ictx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                        _itemCanvasCache.set(cacheKey, itemCvs);
                        _itemTextureCache.set(cacheKey, itemCvs.toDataURL());
                        _itemCanvasCache.set(subtype, itemCvs);
                        _itemTextureCache.set(subtype, itemCvs.toDataURL());
                        const bareSubtype = subtype.replace(/^item\//, '');
                        _itemCanvasCache.set(bareSubtype, itemCvs);
                        _itemTextureCache.set(bareSubtype, itemCvs.toDataURL());
                        if (isEgg) {
                            _itemCanvasCache.set(`${cleanSub}_spawn_egg`, itemCvs);
                            _itemTextureCache.set(`${cleanSub}_spawn_egg`, itemCvs.toDataURL());
                            _itemCanvasCache.set(`spawn_egg_${cleanSub}`, itemCvs);
                            _itemTextureCache.set(`spawn_egg_${cleanSub}`, itemCvs.toDataURL());
                        }
                    }
                }));
            }
        }
        await Promise.all(itemPromises);

        // Preload authentic spawn eggs for custom Aether mobs
        for (const eggType of ['swet', 'aerwhale', 'airwhale']) {
            const eggCvs = renderSpawnEggCanvas(eggType);
            _itemCanvasCache.set(`spawn_egg_${eggType}`, eggCvs);
            _itemTextureCache.set(`spawn_egg_${eggType}`, eggCvs.toDataURL());
            _itemCanvasCache.set(`${eggType}_spawn_egg`, eggCvs);
            _itemTextureCache.set(`${eggType}_spawn_egg`, eggCvs.toDataURL());
            _itemCanvasCache.set(eggType, eggCvs);
            _itemTextureCache.set(eggType, eggCvs.toDataURL());
        }
    }

    // Ensure Steve skin is initialized and fully loaded
    await initSteveSkin();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.anisotropy = 1;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    // UV helper: returns u,v coordinates (0-1) and size for a face
    const uUnit = TEX_SIZE / atlasW;
    const vUnit = TEX_SIZE / atlasH;
    // Sub-texel precision epsilon (prevents float rounding at 1.0 without cropping visible block pixels)
    const epsU = 0.002 / atlasW;
    const epsV = 0.002 / atlasH;

    function getUV(blockType, face, biomeName = null) {
        const map = uvMap[blockType];
        if (!map) return { u: 0, v: 0, uSize: uUnit, vSize: vUnit }; // fallback
        let faceKey = face;
        if (face === 'side' && biomeName && map['side_' + biomeName]) {
            faceKey = 'side_' + biomeName;
        } else if (face === 'top' || face === 'py') faceKey = 'top';
        else if (face === 'bottom' || face === 'ny') faceKey = 'bottom';
        else if (face === 'front' || face === 'pz') faceKey = 'front';
        else if (face === 'eye') faceKey = 'eye';
        else if (map && map[face]) faceKey = face;
        else faceKey = 'side';
        const entry = map[faceKey] || map.tip || map.side || map.top;
        
        return {
            u: entry.col * uUnit + epsU,
            v: 1 - (entry.row + 1) * vUnit + epsV, // flip Y for Three.js
            uSize: uUnit - 2 * epsU,
            vSize: vUnit - 2 * epsV
        };
    }

    // Generate small icon canvases for inventory display
    function getBlockIcon(blockType) {
        const SCALE = 4; // Upscale for crisp isometric rendering
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = TEX_SIZE * 2 * SCALE;
        iconCanvas.height = TEX_SIZE * 2 * SCALE;
        const iconCtx = iconCanvas.getContext('2d', { willReadFrequently: true });
        iconCtx.imageSmoothingEnabled = false;
        
        const props = getBlockProperties(blockType);
        
        const getFaceCanvas = (faceKey) => {
            const map = uvMap[blockType];
            const entry = map ? (map[faceKey] || map.side || map.top) : null;
            const faceCvs = document.createElement('canvas'); 
            faceCvs.width = TEX_SIZE; faceCvs.height = TEX_SIZE;
            const ctx = faceCvs.getContext('2d');
            if (entry && canvas) {
                ctx.drawImage(canvas, entry.col * TEX_SIZE, entry.row * TEX_SIZE, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE, TEX_SIZE);
            } else {
                generateBlockTexture(ctx, blockType, faceKey, seededRandom(blockType * 1000 + 77));
            }

            return faceCvs;
        };

        if (props.isCross || blockType === BLOCKS.CHORUS_PLANT || blockType === BLOCKS.CHORUS_FLOWER || blockType === BLOCKS.CHORUS_FLOWER_DEAD) {
            // Flat 2D for cross models and chorus plants/flowers - enlarged to fill slot nicely
            const tmp = getFaceCanvas('side');
            const pad = 2 * SCALE;
            const drawSize = (TEX_SIZE * 2 - 4) * SCALE;
            iconCtx.drawImage(tmp, 0, 0, TEX_SIZE, TEX_SIZE, pad, pad, drawSize, drawSize);
            return iconCanvas;
        }

        if (blockType === BLOCKS.DRAGON_EGG) {
            const eggFace = getFaceCanvas('top');
            const tiers = [
                [4, 0, 12, 1],
                [3, 1, 13, 3],
                [2, 3, 14, 8],
                [3, 8, 13, 11],
                [4, 11, 12, 13],
                [5, 13, 11, 14],
                [5, 14, 11, 15],
                [6, 15, 10, 16],
            ];
            const s = (TEX_SIZE * 2) * SCALE / 16;
            
            // Mask to egg silhouette
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = iconCanvas.width;
            maskCanvas.height = iconCanvas.height;
            const mCtx = maskCanvas.getContext('2d');
            mCtx.imageSmoothingEnabled = false;
            mCtx.fillStyle = '#000';
            for (const [x0, y0, x1, y1] of tiers) {
                const invY0 = 16 - y1;
                const invY1 = 16 - y0;
                mCtx.fillRect(x0 * s, invY0 * s, (x1 - x0) * s, (invY1 - invY0) * s);
            }
            
            iconCtx.drawImage(eggFace, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, iconCanvas.width, iconCanvas.height);
            iconCtx.globalCompositeOperation = 'destination-in';
            iconCtx.drawImage(maskCanvas, 0, 0);
            iconCtx.globalCompositeOperation = 'source-over';
            
            // Subtle 3D shading
            iconCtx.fillStyle = 'rgba(0,0,0,0.38)';
            for (const [x0, y0, x1, y1] of tiers) {
                const invY0 = 16 - y1;
                const invY1 = 16 - y0;
                iconCtx.fillRect((x1 - 2) * s, invY0 * s, 2 * s, (invY1 - invY0) * s);
            }
            return iconCanvas;
        }

        if (props.isDoor) {
            const doorItem = _itemCanvasCache.get('oak_door') || _itemCanvasCache.get('door');
            if (doorItem) {
                const pad = 2 * SCALE;
                const drawSize = (TEX_SIZE * 2 - 4) * SCALE;
                iconCtx.drawImage(doorItem, 0, 0, TEX_SIZE, TEX_SIZE, pad, pad, drawSize, drawSize);
                return iconCanvas;
            }
        }

        if (props.isLantern) {
            const key = props.isSoulLantern ? 'soul_lantern' : 'lantern';
            const lanternItem = _itemCanvasCache.get(key) || _itemCanvasCache.get(`item/${key}`);
            if (lanternItem) {
                iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
                const pad = 2 * SCALE;
                const drawSize = (TEX_SIZE * 2 - 4) * SCALE;
                iconCtx.drawImage(lanternItem, 0, 0, TEX_SIZE, TEX_SIZE, pad, pad, drawSize, drawSize);
                return iconCanvas;
            }
            if (typeof loadMinecraftTexture === 'function') {
                loadMinecraftTexture(`item/${key}`).then(img => {
                    if (img) {
                        const itemCvs = document.createElement('canvas');
                        itemCvs.width = TEX_SIZE; itemCvs.height = TEX_SIZE;
                        const ictx = itemCvs.getContext('2d');
                        ictx.imageSmoothingEnabled = false;
                        ictx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                        _itemCanvasCache.set(key, itemCvs);
                        _itemCanvasCache.set(`item/${key}`, itemCvs);
                        if (onLoaded) onLoaded(getBlockIcon(blockType));
                    }
                });
            }
            // Draw clean 2D lantern silhouette while loading so it never renders a distorted cube
            iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
            iconCtx.fillStyle = '#3c3c3c';
            iconCtx.fillRect(6 * SCALE, 2 * SCALE, 4 * SCALE, 2 * SCALE);
            iconCtx.fillRect(4 * SCALE, 4 * SCALE, 8 * SCALE, 3 * SCALE);
            iconCtx.fillStyle = props.isSoulLantern ? '#00e5ff' : '#ffa000';
            iconCtx.fillRect(5 * SCALE, 7 * SCALE, 6 * SCALE, 6 * SCALE);
            iconCtx.fillStyle = '#222222';
            iconCtx.fillRect(4 * SCALE, 13 * SCALE, 8 * SCALE, 2 * SCALE);
            return iconCanvas;
        }

        if (props.isBed || props.isBedHead) {
            const bedColor = props.bedColor || 'red';
            const itemKey = `${bedColor}_bed`;
            const bedCached = _itemCanvasCache.get(itemKey);
            if (bedCached) {
                iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
                const pad = 2 * SCALE;
                const drawSize = (TEX_SIZE * 2 - 4) * SCALE;
                iconCtx.drawImage(bedCached, 0, 0, TEX_SIZE, TEX_SIZE, pad, pad, drawSize, drawSize);
                return iconCanvas;
            }
            // Asynchronously preload if not yet in cache
            if (typeof loadMinecraftTexture === 'function') {
                loadMinecraftTexture(itemKey).then(img => {
                    if (img) {
                        const itemCvs = document.createElement('canvas');
                        itemCvs.width = TEX_SIZE; itemCvs.height = TEX_SIZE;
                        const ictx = itemCvs.getContext('2d');
                        ictx.imageSmoothingEnabled = false;
                        ictx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                        _itemCanvasCache.set(itemKey, itemCvs);
                        _itemTextureCache.set(itemKey, itemCvs.toDataURL());
                        if (onLoaded) onLoaded(generateItemTexture(blockType, onLoaded));
                    }
                });
            }

            const bedColorsHex = {
                white: '#eaeded', orange: '#f9801d', magenta: '#c74ebd', light_blue: '#3ab3da',
                yellow: '#fed83d', lime: '#80c71f', pink: '#f38baa', gray: '#474f52',
                light_gray: '#9d9d97', cyan: '#169c9c', purple: '#8932b8', blue: '#3c44aa',
                brown: '#835432', green: '#5e7c16', red: '#b02e26', black: '#1d1d21'
            };
            const blanketColor = bedColorsHex[props.bedColor || 'red'] || '#b02e26';
            const s = iconCanvas.width / 16;
            iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);

            // Bed shadow underneath
            iconCtx.fillStyle = 'rgba(0,0,0,0.18)';
            iconCtx.beginPath();
            iconCtx.ellipse(8 * s, 13 * s, 6.5 * s, 2 * s, 0, 0, Math.PI * 2);
            iconCtx.fill();

            // 4 Oak legs
            iconCtx.fillStyle = '#4e342e';
            iconCtx.fillRect(1.5 * s, 10.5 * s, 1.8 * s, 3.5 * s);
            iconCtx.fillRect(12.7 * s, 10.5 * s, 1.8 * s, 3.5 * s);
            iconCtx.fillStyle = '#3e2723';
            iconCtx.fillRect(3.2 * s, 9.5 * s, 1.5 * s, 2.5 * s);
            iconCtx.fillRect(11.3 * s, 9.5 * s, 1.5 * s, 2.5 * s);

            // Oak wooden frame
            iconCtx.fillStyle = '#8d6e63';
            iconCtx.fillRect(1 * s, 8.5 * s, 14 * s, 2.2 * s);
            iconCtx.fillStyle = '#5d4037';
            iconCtx.fillRect(1 * s, 10.2 * s, 14 * s, 0.6 * s);

            // White pillow at head end (left)
            iconCtx.fillStyle = '#ffffff';
            iconCtx.fillRect(1.5 * s, 4.5 * s, 4.5 * s, 3.8 * s);
            iconCtx.fillStyle = '#e0e0e0';
            iconCtx.fillRect(1.5 * s, 7.5 * s, 4.5 * s, 0.8 * s);
            iconCtx.fillStyle = '#b0b0b0';
            iconCtx.fillRect(1.5 * s, 8.1 * s, 4.5 * s, 0.4 * s);

            // Colored blanket
            iconCtx.fillStyle = blanketColor;
            iconCtx.fillRect(5.8 * s, 4.5 * s, 9 * s, 4 * s);

            // Blanket top highlight
            iconCtx.fillStyle = 'rgba(255,255,255,0.25)';
            iconCtx.fillRect(5.8 * s, 4.5 * s, 9 * s, 0.8 * s);
            // Blanket fold shadow
            iconCtx.fillStyle = 'rgba(0,0,0,0.22)';
            iconCtx.fillRect(5.8 * s, 8 * s, 9 * s, 0.8 * s);
            return iconCanvas;
        }

        // Generate 3 faces from atlas
        const top = getFaceCanvas('top');
        const side1 = getFaceCanvas('side');
        const hasFront = uvMap[blockType] && uvMap[blockType]['front'] && blockType !== BLOCKS.STONECUTTER;
        const side2 = getFaceCanvas(hasFront ? 'front' : 'side');

        // Darken faces for 3D effect
        const s2Ctx = side2.getContext('2d');
        s2Ctx.fillStyle = 'rgba(0,0,0,0.4)';
        s2Ctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);
        
        const s1Ctx = side1.getContext('2d');
        s1Ctx.fillStyle = 'rgba(0,0,0,0.15)';
        s1Ctx.fillRect(0,0,TEX_SIZE,TEX_SIZE);

        // Upscale canvases to prevent anti-aliasing blur during transform
        const topScaled = document.createElement('canvas'); topScaled.width = TEX_SIZE * SCALE; topScaled.height = TEX_SIZE * SCALE;
        const tCtx = topScaled.getContext('2d'); tCtx.imageSmoothingEnabled = false;
        tCtx.drawImage(top, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE * SCALE, TEX_SIZE * SCALE);

        const side1Scaled = document.createElement('canvas'); side1Scaled.width = TEX_SIZE * SCALE; side1Scaled.height = TEX_SIZE * SCALE;
        const s1sCtx = side1Scaled.getContext('2d'); s1sCtx.imageSmoothingEnabled = false;
        s1sCtx.drawImage(side1, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE * SCALE, TEX_SIZE * SCALE);

        const side2Scaled = document.createElement('canvas'); side2Scaled.width = TEX_SIZE * SCALE; side2Scaled.height = TEX_SIZE * SCALE;
        const s2sCtx = side2Scaled.getContext('2d'); s2sCtx.imageSmoothingEnabled = false;
        s2sCtx.drawImage(side2, 0, 0, TEX_SIZE, TEX_SIZE, 0, 0, TEX_SIZE * SCALE, TEX_SIZE * SCALE);

        if (props.isFence) {
            iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
            const s = iconCanvas.width / 16;
            const drawPlank = (rx, ry, rw, rh) => {
                const sx = Math.max(0, Math.min(15, Math.floor(rx) % 16));
                const sy = Math.max(0, Math.min(15, Math.floor(ry) % 16));
                const sw = Math.min(rw, 16 - sx);
                const sh = Math.min(rh, 16 - sy);
                iconCtx.drawImage(side1, sx, sy, sw, sh, rx * s, ry * s, rw * s, rh * s);
                iconCtx.fillStyle = 'rgba(255,255,255,0.22)';
                iconCtx.fillRect(rx * s, ry * s, rw * s, s);
                iconCtx.fillStyle = 'rgba(0,0,0,0.35)';
                iconCtx.fillRect(rx * s, (ry + rh - 1) * s, rw * s, s);
                iconCtx.fillRect((rx + rw - 1) * s, ry * s, s, rh * s);
            };
            // Left post
            drawPlank(2, 1, 3, 14);
            // Right post
            drawPlank(11, 1, 3, 14);
            // Upper cross rail
            drawPlank(0, 4, 16, 2.5);
            // Lower cross rail
            drawPlank(0, 9.5, 16, 2.5);
            return iconCanvas;
        }

        if (props.isFenceGate) {
            iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
            const s = iconCanvas.width / 16;
            const drawPlank = (rx, ry, rw, rh) => {
                const sx = Math.max(0, Math.min(15, Math.floor(rx) % 16));
                const sy = Math.max(0, Math.min(15, Math.floor(ry) % 16));
                const sw = Math.min(rw, 16 - sx);
                const sh = Math.min(rh, 16 - sy);
                iconCtx.drawImage(side1, sx, sy, sw, sh, rx * s, ry * s, rw * s, rh * s);
                iconCtx.fillStyle = 'rgba(255,255,255,0.22)';
                iconCtx.fillRect(rx * s, ry * s, rw * s, s);
                iconCtx.fillStyle = 'rgba(0,0,0,0.35)';
                iconCtx.fillRect(rx * s, (ry + rh - 1) * s, rw * s, s);
                iconCtx.fillRect((rx + rw - 1) * s, ry * s, s, rh * s);
            };
            // Outer posts
            drawPlank(1, 2, 3, 12);
            drawPlank(12, 2, 3, 12);
            // Swinging gate rails
            drawPlank(4, 4.5, 8, 2.2);
            drawPlank(4, 9.5, 8, 2.2);
            // Central vertical latch
            drawPlank(7, 3.5, 2, 9.2);
            return iconCanvas;
        }

        if (props.isWall) {
            iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
            const s = iconCanvas.width / 16;
            const drawStone = (rx, ry, rw, rh) => {
                const sx = Math.max(0, Math.min(15, Math.floor(rx) % 16));
                const sy = Math.max(0, Math.min(15, Math.floor(ry) % 16));
                const sw = Math.min(rw, 16 - sx);
                const sh = Math.min(rh, 16 - sy);
                iconCtx.drawImage(side1, sx, sy, sw, sh, rx * s, ry * s, rw * s, rh * s);
                iconCtx.fillStyle = 'rgba(255,255,255,0.2)';
                iconCtx.fillRect(rx * s, ry * s, rw * s, s);
                iconCtx.fillStyle = 'rgba(0,0,0,0.4)';
                iconCtx.fillRect(rx * s, (ry + rh - 1) * s, rw * s, s);
                iconCtx.fillRect((rx + rw - 1) * s, ry * s, s, rh * s);
            };
            // Side shoulders
            drawStone(1, 5, 3.5, 10);
            drawStone(11.5, 5, 3.5, 10);
            // Central wall post
            drawStone(4, 2, 8, 13);
            // Cap
            drawStone(3, 1.5, 10, 2);
            return iconCanvas;
        }

        if (blockType === BLOCKS.PORTAL_FRAME) {
            iconCtx.save();
            const yOffset = 3 * SCALE;
            // Top face (recessed down by 3 pixels to match 13/16 block height)
            iconCtx.setTransform(1, 0.5, -1, 0.5, TEX_SIZE * SCALE, yOffset);
            iconCtx.drawImage(topScaled, 0, 0);

            // Left face (side1 texture already has transparent rows 0..2 for 13/16 height)
            iconCtx.setTransform(1, 0.5, 0, 1, 0, TEX_SIZE * SCALE * 0.5);
            iconCtx.drawImage(side1Scaled, 0, 0);

            // Right face (shaded)
            iconCtx.setTransform(1, -0.5, 0, 1, TEX_SIZE * SCALE, TEX_SIZE * SCALE);
            iconCtx.drawImage(side2Scaled, 0, 0);

            iconCtx.restore();
            return iconCanvas;
        }

        if (blockType === BLOCKS.CACTUS) {
            iconCtx.save();
            // Cactus is a 14x16x14 block in Minecraft Java.
            // Top face (14x14 pixels, centered at top)
            iconCtx.setTransform(1, 0.5, -1, 0.5, TEX_SIZE * SCALE, 1 * SCALE);
            iconCtx.drawImage(topScaled, 1 * SCALE, 1 * SCALE, 14 * SCALE, 14 * SCALE, 0, 0, 14 * SCALE, 14 * SCALE);

            // Left face (14 pixels wide, 16 pixels tall, connected to top-left edge)
            iconCtx.setTransform(1, 0.5, 0, 1, 2 * SCALE, 8 * SCALE);
            iconCtx.drawImage(side1Scaled, 0, 0, 16 * SCALE, 16 * SCALE, 0, 0, 14 * SCALE, 16 * SCALE);

            // Right face (14 pixels wide, 16 pixels tall, connected to top-right edge)
            iconCtx.setTransform(1, -0.5, 0, 1, 16 * SCALE, 15 * SCALE);
            iconCtx.drawImage(side2Scaled, 0, 0, 16 * SCALE, 16 * SCALE, 0, 0, 14 * SCALE, 16 * SCALE);

            iconCtx.restore();
            return iconCanvas;
        }

        if (props.isStonecutter || blockType === BLOCKS.STONECUTTER) {
            iconCtx.save();
            const yOffset = 7 * SCALE;
            // Stone plinth top face (9/16 height, recessed by 7 pixels from top)
            iconCtx.setTransform(1, 0.5, -1, 0.5, TEX_SIZE * SCALE, yOffset);
            iconCtx.drawImage(topScaled, 0, 0);

            // Left face (9 pixels of plinth)
            iconCtx.setTransform(1, 0.5, 0, 1, 0, 15 * SCALE);
            iconCtx.drawImage(side1Scaled, 0, 0, 16 * SCALE, 9 * SCALE, 0, 0, 16 * SCALE, 9 * SCALE);

            // Right face (9 pixels of plinth)
            iconCtx.setTransform(1, -0.5, 0, 1, TEX_SIZE * SCALE, 23 * SCALE);
            iconCtx.drawImage(side2Scaled, 0, 0, 16 * SCALE, 9 * SCALE, 0, 0, 16 * SCALE, 9 * SCALE);

            // Center saw blade (front face texture, standing upright in the center slot: rows 9..15 of saw texture)
            const sawCanvas = getFaceCanvas('front');
            iconCtx.setTransform(1, 0.5, 0, 1, 8 * SCALE, 3 * SCALE);
            iconCtx.drawImage(sawCanvas, 1, 9, 14, 7, 0, 0, 14 * SCALE, 7 * SCALE);

            iconCtx.restore();
            return iconCanvas;
        }

        if (props.isSlab) {
            iconCtx.save();
            iconCtx.setTransform(1, 0.5, -1, 0.5, TEX_SIZE * SCALE, 8 * SCALE);
            iconCtx.drawImage(topScaled, 0, 0);

            iconCtx.setTransform(1, 0.5, 0, 1, 0, 16 * SCALE);
            iconCtx.drawImage(side1Scaled, 0, 8 * SCALE, 16 * SCALE, 8 * SCALE, 0, 0, 16 * SCALE, 8 * SCALE);

            iconCtx.setTransform(1, -0.5, 0, 1, TEX_SIZE * SCALE, 24 * SCALE);
            iconCtx.drawImage(side2Scaled, 0, 8 * SCALE, 16 * SCALE, 8 * SCALE, 0, 0, 16 * SCALE, 8 * SCALE);
            iconCtx.restore();
            return iconCanvas;
        }

        if (props.isStair) {
            iconCtx.save();
            // 1. Upper top tread (horizontal diamond, back half)
            iconCtx.setTransform(1, 0.5, -1, 0.5, TEX_SIZE * SCALE, 0);
            iconCtx.drawImage(topScaled, 0, 0, 16 * SCALE, 8 * SCALE, 0, 0, 16 * SCALE, 8 * SCALE);

            // 2. Lower top tread (horizontal diamond, front half shifted down by 8 * SCALE)
            iconCtx.setTransform(1, 0.5, -1, 0.5, TEX_SIZE * SCALE, 8 * SCALE);
            iconCtx.drawImage(topScaled, 0, 8 * SCALE, 16 * SCALE, 8 * SCALE, 0, 8 * SCALE, 16 * SCALE, 8 * SCALE);

            // 3. Vertical step riser connecting upper tread front edge to lower tread back edge
            iconCtx.setTransform(1, 0.5, 0, 1, 8 * SCALE, 4 * SCALE);
            iconCtx.drawImage(side1Scaled, 0, 8 * SCALE, 16 * SCALE, 8 * SCALE, 0, 0, 16 * SCALE, 8 * SCALE);

            // 4. Lower front face
            iconCtx.setTransform(1, 0.5, 0, 1, 0, 16 * SCALE);
            iconCtx.drawImage(side1Scaled, 0, 8 * SCALE, 16 * SCALE, 8 * SCALE, 0, 0, 16 * SCALE, 8 * SCALE);

            // 5. Right profile face (seamless authentic L-shape)
            iconCtx.setTransform(1, -0.5, 0, 1, TEX_SIZE * SCALE, 16 * SCALE);
            // Back half: full 16 height (u = 8*SCALE to 16*SCALE)
            iconCtx.drawImage(side2Scaled, 8 * SCALE, 0, 8 * SCALE, 16 * SCALE, 8 * SCALE, 0, 8 * SCALE, 16 * SCALE);
            // Front half: bottom 8 height (u = 0 to 8*SCALE)
            iconCtx.drawImage(side2Scaled, 0, 8 * SCALE, 8 * SCALE, 8 * SCALE, 0, 8 * SCALE, 8 * SCALE, 8 * SCALE);

            iconCtx.restore();
            return iconCanvas;
        }

        iconCtx.save();
        
        // Top face
        iconCtx.setTransform(1, 0.5, -1, 0.5, TEX_SIZE * SCALE, 0);
        iconCtx.drawImage(topScaled, 0, 0);

        // Left face
        iconCtx.setTransform(1, 0.5, 0, 1, 0, TEX_SIZE * SCALE * 0.5);
        iconCtx.drawImage(side1Scaled, 0, 0);

        // Right face
        iconCtx.setTransform(1, -0.5, 0, 1, TEX_SIZE * SCALE, TEX_SIZE * SCALE);
        iconCtx.drawImage(side2Scaled, 0, 0);
        
        iconCtx.restore();

        return iconCanvas;
    }

    function prepareAnimatedFrame(frame) {
        if (frame.preProcessedCanvas) return frame.preProcessedCanvas;
        const totalFrames = frame.frames || 1;
        const frameSize = frame.frameSize || TEX_SIZE;
        const pc = document.createElement('canvas');
        pc.width = TEX_SIZE;
        pc.height = totalFrames * TEX_SIZE;
        const pCtx = pc.getContext('2d', { willReadFrequently: true });
        pCtx.imageSmoothingEnabled = false;

        const fCanvas = document.createElement('canvas');
        fCanvas.width = TEX_SIZE;
        fCanvas.height = TEX_SIZE;
        const fCtx = fCanvas.getContext('2d', { willReadFrequently: true });
        fCtx.imageSmoothingEnabled = false;

        for (let f = 0; f < totalFrames; f++) {
            fCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            fCtx.globalCompositeOperation = 'source-over';
            fCtx.drawImage(frame.img, 0, f * frameSize, frameSize, frameSize, 0, 0, TEX_SIZE, TEX_SIZE);
            if (frame.tint && frame.tint !== '#ffffff') {
                applyNormalizedTint(fCtx, TEX_SIZE, TEX_SIZE, frame.tint);
            }
            if (frame.forceOpaque) {
                const pd = fCtx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
                for (let pi = 3; pi < pd.data.length; pi += 4) pd.data[pi] = 255;
                fCtx.putImageData(pd, 0, 0);
            }
            pCtx.drawImage(fCanvas, 0, f * TEX_SIZE);
        }
        frame.preProcessedCanvas = pc;
        return pc;
    }

    function updateAnimatedTextures(time) {
        if (animatedFrames.length === 0) return;
        const shift = Math.floor(time * 0.05) % TEX_SIZE;
        let didUpdate = false;
        
        for (const frame of animatedFrames) {
            if (frame.isMC) {
                const totalFrames = frame.frames || 1;
                const frameSize = frame.frameSize || TEX_SIZE;
                const src = (frame.img && frame.img.src) ? frame.img.src : '';
                let frameInterval = 100;
                if (src.includes('lava')) {
                    frameInterval = 160;
                } else if (src.includes('sculk') || src.includes('crimson')) {
                    frameInterval = 40; // Fast, snappy, authentic pulse for sculk and crimson flora animations
                }
                const currentFrame = Math.floor(time / frameInterval) % totalFrames;
                if (frame.lastFrame === currentFrame) continue;
                frame.lastFrame = currentFrame;
                
                if (!frame.preProcessedCanvas) {
                    prepareAnimatedFrame(frame);
                }

                ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(frame.preProcessedCanvas, 0, currentFrame * TEX_SIZE, TEX_SIZE, TEX_SIZE, frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                didUpdate = true;
            } else {
                if (useMinecraft) continue;
                if (texture.userData.lastShift === shift) continue;
                tmpCtx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                tmpCtx.drawImage(frame.canvas, 0, shift);
                tmpCtx.drawImage(frame.canvas, 0, shift - TEX_SIZE);
                ctx.clearRect(frame.x, frame.y, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(tmp, frame.x, frame.y);
                didUpdate = true;
            }
        }
        
        texture.userData.lastShift = shift;
        if (didUpdate) texture.needsUpdate = true;
    }

    return { texture, getUV, atlasW, atlasH, totalRows, getBlockIcon, updateAnimatedTextures };
}

// ----------------------------------------------------
// Procedural Item Pixel Art Generator
// ----------------------------------------------------

const MC_ITEM_MAP = {
    // Hoes
    'hoe_wood': 'wooden_hoe',
    'hoe_wooden': 'wooden_hoe',
    'wooden_hoe': 'wooden_hoe',
    'hoe_stone': 'stone_hoe',
    'stone_hoe': 'stone_hoe',
    'hoe_iron': 'iron_hoe',
    'iron_hoe': 'iron_hoe',
    'hoe_gold': 'golden_hoe',
    'golden_hoe': 'golden_hoe',
    'hoe_diamond': 'diamond_hoe',
    'diamond_hoe': 'diamond_hoe',
    'hoe_netherite': 'netherite_hoe',
    'netherite_hoe': 'netherite_hoe',

    // Seeds & Crops
    'wheat_seeds': 'wheat_seeds',
    'carrot': 'carrot',
    'potato': 'potato',
    'baked_potato': 'baked_potato',
    'poisonous_potato': 'poisonous_potato',
    'beetroot': 'beetroot',
    'beetroot_seeds': 'beetroot_seeds',
    'pumpkin_seeds': 'pumpkin_seeds',
    'melon_seeds': 'melon_seeds',

    'door': 'oak_door',
    'dungeon_door': 'oak_door',
    'oak_door': 'oak_door',
    'iron_door': 'iron_door',
    'red_dye': 'red_dye',
    'yellow_dye': 'yellow_dye',
    'blue_dye': 'blue_dye',
    'white_dye': 'white_dye',
    'black_dye': 'black_dye',
    'green_dye': 'green_dye',
    'purple_dye': 'purple_dye',
    'orange_dye': 'orange_dye',
    'pink_dye': 'pink_dye',
    'cyan_dye': 'cyan_dye',
    'lime_dye': 'lime_dye',
    'magenta_dye': 'magenta_dye',
    'brown_dye': 'brown_dye',
    'gray_dye': 'gray_dye',
    'light_blue_dye': 'light_blue_dye',
    'light_gray_dye': 'light_gray_dye',
    'bone_meal': 'bone_meal',
    'bone': 'bone',
    'white_bed': 'white_bed',
    'orange_bed': 'orange_bed',
    'magenta_bed': 'magenta_bed',
    'light_blue_bed': 'light_blue_bed',
    'yellow_bed': 'yellow_bed',
    'lime_bed': 'lime_bed',
    'pink_bed': 'pink_bed',
    'gray_bed': 'gray_bed',
    'light_gray_bed': 'light_gray_bed',
    'cyan_bed': 'cyan_bed',
    'purple_bed': 'purple_bed',
    'blue_bed': 'blue_bed',
    'brown_bed': 'brown_bed',
    'green_bed': 'green_bed',
    'red_bed': 'red_bed',
    'black_bed': 'black_bed',
    'iron_ingot': 'iron_ingot',
    'gold_ingot': 'gold_ingot',
    'iron_nugget': 'iron_nugget',
    'gold_nugget': 'gold_nugget',
    'netherite_scrap': 'netherite_scrap',
    'diamond': 'diamond',
    'coal': 'coal',
    'mana_crystal': 'lapis_lazuli',
    'boss': 'nether_star',
    'gunpowder': 'gunpowder',
    'stick': 'stick',
    'wood': 'oak_log',
    'stone': 'cobblestone',
    'apple': 'apple',
    'bread': 'bread',
    'cooked_beef': 'cooked_beef',
    'sword_wood': 'wooden_sword',
    'sword_stone': 'stone_sword',
    'sword_iron': 'iron_sword',
    'sword_gold': 'golden_sword',
    'sword_diamond': 'diamond_sword',
    'pickaxe_wood': 'wooden_pickaxe',
    'pickaxe_stone': 'stone_pickaxe',
    'pickaxe_iron': 'iron_pickaxe',
    'pickaxe_gold': 'golden_pickaxe',
    'pickaxe_diamond': 'diamond_pickaxe',
    'axe_wood': 'wooden_axe',
    'axe_stone': 'stone_axe',
    'axe_iron': 'iron_axe',
    'axe_gold': 'golden_axe',
    'axe_diamond': 'diamond_axe',
    'shovel_wood': 'wooden_shovel',
    'shovel_stone': 'stone_shovel',
    'shovel_iron': 'iron_shovel',
    'shovel_gold': 'golden_shovel',
    'shovel_diamond': 'diamond_shovel',
    'wood_shovel': 'wooden_shovel',
    'stone_shovel': 'stone_shovel',
    'iron_shovel': 'iron_shovel',
    'gold_shovel': 'golden_shovel',
    'golden_shovel': 'golden_shovel',
    'diamond_shovel': 'diamond_shovel',
    'raw_beef': 'beef',
    'beef': 'beef',
    'steak': 'cooked_beef',
    'cooked_beef': 'cooked_beef',
    'raw_porkchop': 'porkchop',
    'porkchop': 'porkchop',
    'cooked_porkchop': 'cooked_porkchop',
    'raw_chicken': 'chicken',
    'chicken': 'chicken',
    'cooked_chicken': 'cooked_chicken',
    'raw_mutton': 'mutton',
    'mutton': 'mutton',
    'cooked_mutton': 'cooked_mutton',
    'raw_fish': 'cod',
    'cooked_fish': 'cooked_cod',
    'cod': 'cod',
    'cooked_cod': 'cooked_cod',
    'raw_iron': 'raw_iron',
    'raw_gold': 'raw_gold',
    'raw_copper': 'raw_copper',
    'ender_pearl': 'ender_pearl',
    'eye_of_ender': 'eye_of_ender',
    'blaze_rod': 'blaze_rod',
    'blaze_powder': 'blaze_powder',
    'dragon_egg': 'dragon_egg',
    'chorus_fruit': 'chorus_fruit',
    'sweet_berries': 'sweet_berries',
    'snowball': 'snowball',
    'melon_slice': 'melon_slice',
    'emerald': 'emerald',
    'leather': 'item/leather',
    'head_leather': 'item/leather_helmet',
    'helmet_leather': 'item/leather_helmet',
    'leather_helmet': 'item/leather_helmet',
    'chest_leather': 'item/leather_chestplate',
    'leather_chestplate': 'item/leather_chestplate',
    'legs_leather': 'item/leather_leggings',
    'leather_leggings': 'item/leather_leggings',
    'boots_leather': 'item/leather_boots',
    'leather_boots': 'item/leather_boots',
    'item_frame': 'item/item_frame',
    'helmet_iron': 'iron_helmet',
    'chest_iron': 'iron_chestplate',
    'legs_iron': 'iron_leggings',
    'boots_iron': 'iron_boots',
    'helmet_gold': 'golden_helmet',
    'chest_gold': 'golden_chestplate',
    'legs_gold': 'golden_leggings',
    'boots_gold': 'golden_boots',
    'helmet_diamond': 'diamond_helmet',
    'chest_diamond': 'diamond_chestplate',
    'legs_diamond': 'diamond_leggings',
    'boots_diamond': 'diamond_boots',
    'flint_and_steel': 'flint_and_steel',
    'bucket': 'bucket',
    'water_bucket': 'water_bucket',
    'lava_bucket': 'lava_bucket',
    'netherite_ingot': 'netherite_ingot',
    'sword_netherite': 'netherite_sword',
    'pickaxe_netherite': 'netherite_pickaxe',
    'axe_netherite': 'netherite_axe',
    'shovel_netherite': 'netherite_shovel',
    'ruby': 'ruby',
    'sapphire': 'sapphire',
    'sword_ruby': 'ruby_sword',
    'pickaxe_ruby': 'ruby_pickaxe',
    'axe_ruby': 'ruby_axe',
    'shovel_ruby': 'ruby_shovel',
    'ruby_sword': 'ruby_sword',
    'ruby_pickaxe': 'ruby_pickaxe',
    'ruby_axe': 'ruby_axe',
    'ruby_shovel': 'ruby_shovel',
    'sword_sapphire': 'sapphire_sword',
    'pickaxe_sapphire': 'sapphire_pickaxe',
    'axe_sapphire': 'sapphire_axe',
    'shovel_sapphire': 'sapphire_shovel',
    'sapphire_sword': 'sapphire_sword',
    'sapphire_pickaxe': 'sapphire_pickaxe',
    'sapphire_axe': 'sapphire_axe',
    'sapphire_shovel': 'sapphire_shovel',
    'zanite_gem': 'zanite_gem',
    'zanite_gemstone': 'zanite_gem',
    'ambrosium_shard': 'ambrosium_shard',
    'sword_zanite': 'zanite_sword',
    'pickaxe_zanite': 'zanite_pickaxe',
    'axe_zanite': 'zanite_axe',
    'shovel_zanite': 'zanite_shovel',
    'gravitite_ingot': 'gravitite_sword',
    'gravitite_ore': 'gravitite_ore',
    'sword_gravitite': 'gravitite_sword',
    'pickaxe_gravitite': 'gravitite_pickaxe',
    'axe_gravitite': 'gravitite_axe',
    'shovel_gravitite': 'gravitite_shovel',
    'slime_boots': 'slime_boots',
    'boots_slime': 'slime_boots',
    'cloud_parachute': 'cloud_parachute',
    'lead': 'item/lead',
    'hammer': 'hammer',
    'stone_hammer': 'stone_hammer',
    'wood_hammer': 'wood_hammer',
    'iron_hammer': 'iron_hammer',
    'gold_hammer': 'gold_hammer',
    'diamond_hammer': 'diamond_hammer',
    'netherite_hammer': 'netherite_hammer',
    'wooden_hammer': 'wooden_hammer',
    'golden_hammer': 'golden_hammer',
    'excavator': 'excavator',
    'stone_excavator': 'stone_excavator',
    'wood_excavator': 'wood_excavator',
    'iron_excavator': 'iron_excavator',
    'gold_excavator': 'gold_excavator',
    'diamond_excavator': 'diamond_excavator',
    'netherite_excavator': 'netherite_excavator',
    'wooden_excavator': 'wooden_excavator',
    'golden_excavator': 'golden_excavator',
    'golden_feather': 'golden_feather',
    'quartz': 'quartz',
    'nether_quartz': 'quartz',
    'item/quartz': 'quartz',
    'netherite_scrap': 'netherite_scrap',
    'lapis_lazuli': 'lapis_lazuli',
    'lapis': 'lapis_lazuli',
    'emerald': 'emerald',
    'redstone': 'redstone',
    'bow': 'bow',
    'arrow': 'arrow',
    'golden_apple': 'golden_apple',
    'flint': 'flint',
    'feather': 'feather',
    'string': 'string',
    'sugar': 'sugar',
    'paper': 'paper',
    'book': 'book',
    'wheat': 'wheat',
    'compass': 'compass',
    'clock': 'clock',
    'emerald_block': 'emerald_block',
    'lapis_block': 'lapis_block',
    'redstone_block': 'redstone_block',
    'coal_block': 'coal_block',
    'fletching_table': 'fletching_table_front',
    'smoker': 'smoker_front',
    'cookie': 'cookie',
    'pumpkin_pie': 'pumpkin_pie',
    'beetroot_soup': 'beetroot_soup',
    'slime_ball': 'slime_ball',
    'slimeball': 'slime_ball',
    'magma_cream': 'magma_cream',
    'lavaslime_ball': 'magma_cream',
    'rotten_flesh': 'rotten_flesh',
    'item/rotten_flesh': 'rotten_flesh',
    'glowstone_dust': 'glowstone_dust',
    'item/glowstone_dust': 'glowstone_dust',
    'cocoa_beans': 'cocoa_beans',
    'stonecutter': 'stonecutter_side',
    'lantern': 'item/lantern',
    'soul_lantern': 'item/soul_lantern',
    'iron_nugget': 'iron_nugget',
    'gold_nugget': 'gold_nugget',
    'bat_spawn_egg': 'bat_spawn_egg',
    'camel_spawn_egg': 'camel_spawn_egg',
    'chicken_spawn_egg': 'chicken_spawn_egg',
    'cod_spawn_egg': 'cod_spawn_egg',
    'cow_spawn_egg': 'cow_spawn_egg',
    'frog_spawn_egg': 'frog_spawn_egg',
    'iron_golem_spawn_egg': 'iron_golem_spawn_egg',
    'magma_cube_spawn_egg': 'magma_cube_spawn_egg',
    'piglin_brute_spawn_egg': 'piglin_brute_spawn_egg',
    'pig_spawn_egg': 'pig_spawn_egg',
    'salmon_spawn_egg': 'salmon_spawn_egg',
    'sheep_spawn_egg': 'sheep_spawn_egg',
    'skeleton_spawn_egg': 'skeleton_spawn_egg',
    'slime_spawn_egg': 'slime_spawn_egg',
    'spider_spawn_egg': 'spider_spawn_egg',
    'tropical_fish_spawn_egg': 'tropical_fish_spawn_egg',
    'turtle_spawn_egg': 'turtle_spawn_egg',
    'zombie_spawn_egg': 'zombie_spawn_egg',
    'creeper_spawn_egg': 'creeper_spawn_egg',
    'enderman_spawn_egg': 'enderman_spawn_egg',
    'pufferfish_spawn_egg': 'pufferfish_spawn_egg',
    'spawn_egg_bat': 'bat_spawn_egg',
    'spawn_egg_camel': 'camel_spawn_egg',
    'spawn_egg_chicken': 'chicken_spawn_egg',
    'spawn_egg_cod': 'cod_spawn_egg',
    'spawn_egg_cow': 'cow_spawn_egg',
    'spawn_egg_creeper': 'creeper_spawn_egg',
    'spawn_egg_enderman': 'enderman_spawn_egg',
    'spawn_egg_frog': 'frog_spawn_egg',
    'spawn_egg_golem': 'iron_golem_spawn_egg',
    'spawn_egg_lavaslime': 'magma_cube_spawn_egg',
    'spawn_egg_piglin_bruiser': 'piglin_brute_spawn_egg',
    'spawn_egg_pig': 'pig_spawn_egg',
    'spawn_egg_pufferfish': 'pufferfish_spawn_egg',
    'spawn_egg_salmon': 'salmon_spawn_egg',
    'spawn_egg_sheep': 'sheep_spawn_egg',
    'spawn_egg_skeleton': 'skeleton_spawn_egg',
    'spawn_egg_slime': 'slime_spawn_egg',
    'spawn_egg_spider': 'spider_spawn_egg',
    'spawn_egg_tropical_fish': 'tropical_fish_spawn_egg',
    'spawn_egg_turtle': 'turtle_spawn_egg',
    'spawn_egg_zombie': 'zombie_spawn_egg'
};

const SPAWN_EGG_COLORS = {
    'cow':             { c: '#443626', d: '#2b2116', h: '#5e4c36', e: '#a1a1a1' },
    'pig':             { c: '#f0a5a2', d: '#db7d78', h: '#f7c3c1', e: '#db7d78' },
    'sheep':           { c: '#e7e7e7', d: '#bababa', h: '#ffffff', e: '#ffb5b5' },
    'chicken':         { c: '#a1a1a1', d: '#707070', h: '#c8c8c8', e: '#ff0000' },
    'zombie':          { c: '#00afaf', d: '#007070', h: '#00dfdf', e: '#799c65' },
    'skeleton':        { c: '#c1c1c1', d: '#919191', h: '#dedede', e: '#494949' },
    'creeper':         { c: '#0da70b', d: '#076106', h: '#12d60e', e: '#000000' },
    'enderman':        { c: '#161616', d: '#0a0a0a', h: '#2a2a2a', e: '#cc00ff' },
    'spider':          { c: '#342d27', d: '#1f1a16', h: '#4b4138', e: '#a80e0e' },
    'slime':           { c: '#51a03e', d: '#38732a', h: '#70cf57', e: '#7eb75b' },
    'lavaslime':       { c: '#340000', d: '#1c0000', h: '#540000', e: '#fcfc00' },
    'magma_cube':      { c: '#340000', d: '#1c0000', h: '#540000', e: '#fcfc00' },
    'bat':             { c: '#4c3e30', d: '#2e251b', h: '#6a5743', e: '#0f0f0f' },
    'piglin_bruiser':  { c: '#995f40', d: '#6b3f27', h: '#bf7952', e: '#ffd83d' },
    'piglin_brute':    { c: '#995f40', d: '#6b3f27', h: '#bf7952', e: '#ffd83d' },
    'golem':           { c: '#d0c8b0', d: '#9a9482', h: '#ece6d0', e: '#5e8238' },
    'iron_golem':      { c: '#d0c8b0', d: '#9a9482', h: '#ece6d0', e: '#5e8238' },
    'turtle':          { c: '#e7e7e7', d: '#a3a3a3', h: '#ffffff', e: '#00afaf' },
    'frog':            { c: '#597d36', d: '#38521f', h: '#78a649', e: '#9bb869' },
    'camel':           { c: '#c4975a', d: '#876435', h: '#dfb57b', e: '#6b4d24' },
    'cod':             { c: '#c1a176', d: '#876e4c', h: '#dec39e', e: '#e5cbb0' },
    'salmon':          { c: '#8f2525', d: '#5e1717', h: '#b83b3b', e: '#0e4435' },
    'tropical_fish':   { c: '#ef6915', d: '#ab4609', h: '#ff8a42', e: '#ffffff' },
    'pufferfish':      { c: '#e8a93a', d: '#a87720', h: '#ffc766', e: '#337ab7' },
    'swet':            { c: '#1b75bb', d: '#0d4870', h: '#38bdf8', e: '#cceeff' },
    'aerwhale':        { c: '#70889c', d: '#4b5c6b', h: '#9cb5c9', e: '#ffffff' },
    'airwhale':        { c: '#70889c', d: '#4b5c6b', h: '#9cb5c9', e: '#ffffff' }
};

const SPAWN_EGG_TEMPLATE = [
    " CC   HHHH   CC ",
    " CCC HSSSSD CCD ",
    " CCDDSSSSSCDCCD ",
    " CCDCSSSSSCDDCD ",
    " DDDCSSSSCCCDDD ",
    "  DCHSSSHCCSHD  ",
    "  DCHHSSCCCSSD  ",
    " HSHHHSHCCCCSHD ",
    " HSSHHCCCCCCCSD ",
    " HSSSCCCCCSSCCD ",
    " HSSSCCCCSSSSCD ",
    " DSSHCCCSSSSSCD ",
    " DCCCCCSSSSSSDD ",
    "  DCCCCSSSSSHD  ",
    "   DDCCCHSHDD   ",
    "     DDDDDD     "
];

function renderSpawnEggCanvas(eggType) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const clean = String(eggType || '').replace(/^spawn_egg_/, '').replace(/_spawn_egg$/, '');
    const pal = SPAWN_EGG_COLORS[clean] || SPAWN_EGG_COLORS[eggType] || { c: '#0284c7', d: '#0369a1', h: '#38bdf8', e: '#ffffff' };
    const cColor = pal.c || '#70889c';
    const dColor = pal.d || '#4b5c6b';
    const hColor = pal.h || '#9cb5c9';
    const sColor = pal.e || pal.s || '#ffffff';

    for (let y = 0; y < 16; y++) {
        const row = SPAWN_EGG_TEMPLATE[y];
        for (let x = 0; x < 16; x++) {
            const ch = row[x];
            if (ch === ' ' || !ch) continue;
            if (ch === 'C') ctx.fillStyle = cColor;
            else if (ch === 'D') ctx.fillStyle = dColor;
            else if (ch === 'H') ctx.fillStyle = hColor;
            else if (ch === 'S') ctx.fillStyle = sColor;
            ctx.fillRect(x, y, 1, 1);
        }
    }
    return canvas;
}

// Global cache: subtype -> canvas / data URL
const _itemTextureCache = new Map();
const _itemCanvasCache = new Map();

// Palettes and shapes for magic items (wands, spells, spell modifiers)
const MAGIC_WAND_PALETTES = {
    'wand':           { c: '#795548', d: '#4e342e', g: '#e0e0e0', h: '#a1887f' },
    'wand_basic':     { c: '#795548', d: '#4e342e', g: '#e0e0e0', h: '#a1887f' },
    'wand_fire':      { c: '#795548', d: '#4e342e', g: '#ff3d00', h: '#ff9e80' },
    'wand_ice':       { c: '#795548', d: '#4e342e', g: '#00b0ff', h: '#80d8ff' },
    'wand_nature':    { c: '#795548', d: '#4e342e', g: '#00e676', h: '#b9f6ca' },
    'wand_lightning': { c: '#795548', d: '#4e342e', g: '#ffff00', h: '#ffff88' },
    'wand_thunder':   { c: '#795548', d: '#4e342e', g: '#ffff00', h: '#ffff88' },
    'wand_earth':     { c: '#795548', d: '#4e342e', g: '#8b4513', h: '#c4a882' },
    'wand_wind':      { c: '#795548', d: '#4e342e', g: '#66cc99', h: '#ccffee' },
    'wand_void':      { c: '#212121', d: '#000000', g: '#aa00ff', h: '#e040fb' },
    'wand_meteor':    { c: '#bf360c', d: '#5d1000', g: '#ffab00', h: '#ffd54f' },
    'wand_master':    { c: '#311b92', d: '#1a0c4e', g: '#ffd700', h: '#fff176' }
};

const MAGIC_WAND_SHAPE = [
    "            OO  ",
    "           OGGO ",
    "          OGGGO ",
    "         OHGGO  ",
    "        OHDO    ",
    "       OHDO     ",
    "      OHDO      ",
    "     OHDO       ",
    "    OHDO        ",
    "   OHDO         ",
    "  OHDO          ",
    "  ODO           ",
    "  OO            ",
    "                ",
    "                ",
    "                "
];

const MAGIC_SPELL_PALETTES = {
    'FIRE':     { c: '#ff3d00', d: '#dd2c00', h: '#ff9e80' },
    'BURST':    { c: '#ff4422', d: '#cc2200', h: '#ff8866' },
    'METEOR':   { c: '#ffaa00', d: '#cc6600', h: '#ffdd66' },
    'ICE':      { c: '#00b0ff', d: '#0091ea', h: '#80d8ff' },
    'BOLT':     { c: '#0088ff', d: '#0055cc', h: '#66b3ff' },
    'MISSILE':  { c: '#4488ff', d: '#2255cc', h: '#88bbff' },
    'HEAL':     { c: '#00e676', d: '#00c853', h: '#b9f6ca' },
    'NATURE':   { c: '#00e676', d: '#00c853', h: '#b9f6ca' },
    'EARTH':    { c: '#8B4513', d: '#5D2906', h: '#C4A882' },
    'THUNDER':  { c: '#FFD700', d: '#CC8800', h: '#FFFF88' },
    'CHAIN':    { c: '#88CCFF', d: '#3388CC', h: '#DDF0FF' },
    'DARK':     { c: '#6600CC', d: '#440088', h: '#AA66FF' },
    'WIND':     { c: '#66CC99', d: '#339966', h: '#CCFFEE' },
    'POISON':   { c: '#33cc33', d: '#1f7a1f', h: '#80ff80' },
    'WATER':    { c: '#3399FF', d: '#1166CC', h: '#80CCFF' },
    'FROST':    { c: '#00FFFF', d: '#008888', h: '#88FFFF' },
    'LIGHT':    { c: '#FFFFAA', d: '#CCCC55', h: '#FFFFFF' },
    'VOID':     { c: '#8800CC', d: '#440066', h: '#CC66FF' },
    'LAVA':     { c: '#CC3300', d: '#991100', h: '#FF6600' },
    'BUILDER':  { c: '#AAAAAA', d: '#777777', h: '#CCCCCC' },
    'ARCANE':   { c: '#aa00ff', d: '#6600aa', h: '#e080ff' },
    'BASIC':    { c: '#e0e0e0', d: '#9e9e9e', h: '#ffffff' }
};

const MAGIC_SPELL_SHAPE = [
    "                ",
    "      OOOO      ",
    "    OOCHHDOO    ",
    "   OCHHHHCDDO   ",
    "  OCHHHHCCCCDO  ",
    "  OHHHCCCCCCDO  ",
    " OHHHCCCCCCCCDO ",
    " OHHCCCCCCCCCDO ",
    " OHHCCCCCCCCCDO ",
    " OHCCCCCCCCCCDO ",
    "  OCCCCCCCCDDO  ",
    "  OCDDDDDDDCDO  ",
    "   OODDDDDDOO   ",
    "    OOOOOOOO    ",
    "                ",
    "                "
];

const MAGIC_MODIFIER_PALETTES = {
    'DAMAGE_UP': { c: '#ff5555', d: '#aa0000', h: '#ffaaaa' },
    'SPEED_UP':  { c: '#55ffff', d: '#00aaaa', h: '#aaffff' },
    'MANA_EFF':  { c: '#ff55ff', d: '#aa00aa', h: '#ffaaff' },
    'PIERCE':    { c: '#55ff55', d: '#00aa00', h: '#aaffaa' },
    'HOMING':    { c: '#ffff55', d: '#aaaa00', h: '#ffffaa' },
    'BURN':      { c: '#ff6600', d: '#cc2200', h: '#ffaa44' },
    'MULTIPLY':  { c: '#33bbff', d: '#0066cc', h: '#88ddff' },
    'CAST_TWO':  { c: '#ffaa00', d: '#aa5500', h: '#ffff00' }
};

const MAGIC_MODIFIER_SHAPE = [
    "                ",
    "       OO       ",
    "      OHHO      ",
    "     OHCCHO     ",
    "    OHCCCCHO    ",
    "   OHCCCCCCHO   ",
    "  OHCCCCCCCCHO  ",
    " OHCCCCCCCCCCHO ",
    " OHCDDDDDDDDCHO ",
    "  OHDDDDDDDDHO  ",
    "   OHDDDDDDHO   ",
    "    OHDDDDHO    ",
    "     OHDCHO     ",
    "      OHHO      ",
    "       OO       ",
    "                "
];

const TOOL_TIER_PALETTES = {
    wood: { H: '#b8945f', C: '#8e6c3e', D: '#684e29', O: '#423016' },
    stone: { H: '#b4b4b4', C: '#888888', D: '#5f5f5f', O: '#373737' },
    iron: { H: '#ffffff', C: '#d8d8d8', D: '#969696', O: '#505050' },
    gold: { H: '#ffffaa', C: '#fed83d', D: '#ca9517', O: '#7a560a' },
    diamond: { H: '#befffa', C: '#2ce4ce', D: '#169c97', O: '#0c5a5e' },
    netherite: { H: '#72686e', C: '#453d41', D: '#2e282b', O: '#1a1618' }
};

const HAMMER_SHAPE = [
  '                ',
  '          OOOO  ',
  '        OOHHHHO ',
  '       OOHCCCCDO',
  '     OOOHCCCCCDO',
  '    OOHHCCCCCDDO',
  '   OHHHCCCCDDDDO',
  '   OHHCCCCDDDDDO',
  '   OHCCCCDDDDOO ',
  '   OHCCCDDDO    ',
  '    ODDDOO  S   ',
  '     OOO   sS   ',
  '          sS    ',
  '         sS     ',
  '        sS      ',
  '       sS       '
];

const EXCAVATOR_SHAPE = [
  '                ',
  '           OOO  ',
  '         OOHHHO ',
  '       OOHCCCCDO',
  '      OHHCCCCDDO',
  '     OHHCCCCDDDO',
  '    OHCCCCCDDDO ',
  '    OHCCCCDDDO  ',
  '    OHCCCDDDO   ',
  '     ODDDDOO    ',
  '      OOOO  S   ',
  '           sS   ',
  '          sS    ',
  '         sS     ',
  '        sS      ',
  '       sS       '
];

export function generateItemTexture(itemType, itemSubtype, onLoaded) {
    if (typeof window !== 'undefined' && !window.generateItemTexture) {
        window.generateItemTexture = generateItemTexture;
    }
    if (typeof itemSubtype !== 'string') {
        itemSubtype = (itemSubtype !== undefined && itemSubtype !== null) ? String(itemSubtype) : '';
    }

    if (itemSubtype === 'stonecutter' || itemType === 'stonecutter' || itemSubtype === BLOCKS.STONECUTTER || itemType === BLOCKS.STONECUTTER) {
        return getBlockIcon(BLOCKS.STONECUTTER, onLoaded);
    }

    const TEX_SIZE = 16;
    const canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const isSpawnEgg = itemType === 'spawn_egg' || itemSubtype.includes('spawn_egg');
    const cleanEgg = itemSubtype.replace(/^spawn_egg_/, '').replace(/_spawn_egg$/, '');
    const cacheKey = isSpawnEgg ? `spawn_egg_${cleanEgg}` : (itemType ? `${itemType}_${itemSubtype}` : itemSubtype);

    // If already cached in memory, draw immediately and return synchronously
    if (isSpawnEgg) {
        const cachedEgg = _itemCanvasCache.get(cacheKey) || _itemCanvasCache.get(`${cleanEgg}_spawn_egg`);
        if (cachedEgg) {
            ctx.drawImage(cachedEgg, 0, 0);
            return canvas;
        }
    } else {
        const cached = _itemCanvasCache.get(cacheKey) || _itemCanvasCache.get(itemSubtype);
        if (cached) {
            ctx.drawImage(cached, 0, 0);
            return canvas;
        }
    }

    // Clear transparent
    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);

    // 0. Tinkers' Construct Hammers & Excavators (authentic tiered color palettes)
    // 0. Tinkers' Construct Hammers & Excavators
    const isHammer = itemSubtype === 'hammer' || itemSubtype.endsWith('_hammer') || itemSubtype.includes('hammer');
    const isExcavator = itemSubtype === 'excavator' || itemSubtype.endsWith('_excavator') || itemSubtype.includes('excavator');
    if (isHammer || isExcavator) {
        let cleanName = itemSubtype;
        if (!cleanName.includes('hammer') && !cleanName.includes('excavator')) {
            cleanName = isHammer ? `${itemSubtype}_hammer` : `${itemSubtype}_excavator`;
        }
        const cached = _itemCanvasCache.get(cleanName) || _itemCanvasCache.get(cacheKey) || _itemCanvasCache.get(itemSubtype);
        if (cached) {
            ctx.drawImage(cached, 0, 0);
            return canvas;
        }

        // Draw initial fallback so slot is never empty
        let tier = 'stone';
        if (itemSubtype.includes('wood')) tier = 'wood';
        else if (itemSubtype.includes('iron')) tier = 'iron';
        else if (itemSubtype.includes('gold')) tier = 'gold';
        else if (itemSubtype.includes('diamond')) tier = 'diamond';
        else if (itemSubtype.includes('netherite')) tier = 'netherite';
        
        const palette = TOOL_TIER_PALETTES[tier] || TOOL_TIER_PALETTES['stone'];
        const shape = isHammer ? HAMMER_SHAPE : EXCAVATOR_SHAPE;
        for (let y = 0; y < 16; y++) {
            const row = shape[y];
            for (let x = 0; x < 16; x++) {
                const ch = row[x];
                if (ch === ' ' || !ch) continue;
                if (ch === 'S') ctx.fillStyle = '#89663f';
                else if (ch === 's') ctx.fillStyle = '#573b20';
                else if (palette[ch]) ctx.fillStyle = palette[ch];
                ctx.fillRect(x, y, 1, 1);
            }
        }

        // Upgrade with authentic mod PNG texture
        loadMinecraftTexture(cleanName).then(img => {
            if (img) {
                ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                const savedCvs = document.createElement('canvas');
                savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
                savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                _itemCanvasCache.set(cacheKey, savedCvs);
                _itemTextureCache.set(cacheKey, canvas.toDataURL());
                _itemCanvasCache.set(itemSubtype, savedCvs);
                _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                _itemCanvasCache.set(cleanName, savedCvs);
                _itemTextureCache.set(cleanName, canvas.toDataURL());
                if (onLoaded) onLoaded(canvas);
            }
        });

        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // Lead (authentic 16x16 pixel art with looped brown cord & silver clasp)
    if (itemSubtype === 'lead') {
        ctx.fillStyle = '#4a4a4a'; ctx.fillRect(4, 3, 3, 3);
        ctx.fillStyle = '#8e8e8e'; ctx.fillRect(5, 4, 1, 1);
        ctx.fillStyle = '#8b5a2b'; ctx.fillRect(6, 4, 6, 2); ctx.fillRect(11, 6, 2, 4); ctx.fillRect(8, 9, 4, 2); ctx.fillRect(7, 7, 2, 3);
        ctx.fillStyle = '#b8860b'; ctx.fillRect(7, 4, 4, 1); ctx.fillRect(11, 7, 1, 3); ctx.fillRect(9, 10, 3, 1);
        ctx.fillStyle = '#8b5a2b'; ctx.fillRect(4, 6, 2, 4); ctx.fillRect(3, 9, 2, 4); ctx.fillRect(2, 12, 2, 2);
        ctx.fillStyle = '#653e1a'; ctx.fillRect(4, 7, 1, 3); ctx.fillRect(3, 10, 1, 3);
        const savedCvs = document.createElement('canvas');
        savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
        _itemCanvasCache.set(cacheKey, savedCvs);
        _itemTextureCache.set(cacheKey, canvas.toDataURL());
        _itemCanvasCache.set(itemSubtype, savedCvs);
        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
        // Also allow local PNG to upgrade it if available
        loadMinecraftTexture('item/lead').then(img => {
            if (img) {
                ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                _itemTextureCache.set(cacheKey, canvas.toDataURL());
                _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                if (onLoaded) onLoaded(canvas);
            }
        });
        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // Dynamic Compass
    if (itemSubtype === 'compass') {
        const dynCanvas = drawDynamicCompassCanvas(0);
        ctx.drawImage(dynCanvas, 0, 0);
        const savedCvs = document.createElement('canvas');
        savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
        _itemCanvasCache.set(cacheKey, savedCvs);
        _itemTextureCache.set(cacheKey, canvas.toDataURL());
        _itemCanvasCache.set(itemSubtype, savedCvs);
        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
        loadMinecraftTexture('item/compass').then(img => {
            if (img) {
                ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                _itemTextureCache.set(cacheKey, canvas.toDataURL());
                _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                if (onLoaded) onLoaded(canvas);
            }
        });
        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // Dynamic Clock
    if (itemSubtype === 'clock') {
        const dynCanvas = drawDynamicClockCanvas(0.5);
        ctx.drawImage(dynCanvas, 0, 0);
        const savedCvs = document.createElement('canvas');
        savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
        _itemCanvasCache.set(cacheKey, savedCvs);
        _itemTextureCache.set(cacheKey, canvas.toDataURL());
        _itemCanvasCache.set(itemSubtype, savedCvs);
        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
        loadMinecraftTexture('item/clock').then(img => {
            if (img) {
                ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                _itemTextureCache.set(cacheKey, canvas.toDataURL());
                _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                if (onLoaded) onLoaded(canvas);
            }
        });
        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // Rotten Flesh (authentic zombie drop pixel art)
    if (itemSubtype === 'rotten_flesh' || itemSubtype.includes('rotten_flesh')) {
        ctx.fillStyle = '#834c38'; ctx.fillRect(4, 5, 8, 7);
        ctx.fillStyle = '#593222'; ctx.fillRect(3, 7, 2, 5); ctx.fillRect(11, 4, 2, 6);
        ctx.fillStyle = '#a05844'; ctx.fillRect(5, 4, 6, 2);
        ctx.fillStyle = '#4f7942'; ctx.fillRect(6, 6, 2, 2); ctx.fillRect(9, 8, 2, 2);
        const savedCvs = document.createElement('canvas');
        savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
        _itemCanvasCache.set(cacheKey, savedCvs);
        _itemTextureCache.set(cacheKey, canvas.toDataURL());
        _itemCanvasCache.set(itemSubtype, savedCvs);
        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
        loadMinecraftTexture('item/rotten_flesh').then(img => {
            if (img) {
                ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                _itemTextureCache.set(cacheKey, canvas.toDataURL());
                _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                if (onLoaded) onLoaded(canvas);
            }
        });
        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // Glowstone Dust (authentic glowing powder pixel art)
    if (itemSubtype === 'glowstone_dust' || itemSubtype.includes('glowstone_dust')) {
        ctx.fillStyle = '#e5a024'; ctx.fillRect(5, 7, 6, 6);
        ctx.fillStyle = '#ffdf40'; ctx.fillRect(6, 5, 4, 4);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(7, 6, 2, 2);
        ctx.fillStyle = '#b37812'; ctx.fillRect(4, 10, 8, 3);
        const savedCvs = document.createElement('canvas');
        savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
        _itemCanvasCache.set(cacheKey, savedCvs);
        _itemTextureCache.set(cacheKey, canvas.toDataURL());
        _itemCanvasCache.set(itemSubtype, savedCvs);
        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
        loadMinecraftTexture('item/glowstone_dust').then(img => {
            if (img) {
                ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                _itemTextureCache.set(cacheKey, canvas.toDataURL());
                _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                if (onLoaded) onLoaded(canvas);
            }
        });
        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // 1. Magic Wands (authentic 16x16 pixel art with wood shaft and glowing elemental gem)
    const isWand = itemType === 'wand' || itemSubtype.startsWith('wand') || itemSubtype === 'wand';
    if (isWand) {
        const p = MAGIC_WAND_PALETTES[itemSubtype] || MAGIC_WAND_PALETTES['wand_basic'];
        for (let y = 0; y < 16; y++) {
            const row = MAGIC_WAND_SHAPE[y];
            for (let x = 0; x < 16; x++) {
                const ch = row[x];
                if (ch === ' ') continue;
                if (ch === 'O') ctx.fillStyle = '#222222';
                else if (ch === 'G') ctx.fillStyle = p.g || '#e0e0e0';
                else if (ch === 'H') ctx.fillStyle = p.h || '#a1887f';
                else if (ch === 'D') ctx.fillStyle = p.d || '#4e342e';
                else if (ch === 'C') ctx.fillStyle = p.c || '#795548';
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const savedCvs = document.createElement('canvas');
        savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
        _itemCanvasCache.set(cacheKey, savedCvs);
        _itemTextureCache.set(cacheKey, canvas.toDataURL());
        _itemCanvasCache.set(itemSubtype, savedCvs);
        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // 2. Magic Spells (radiant elemental orb icons)
    const cleanSpellKey = itemSubtype.replace(/^spell_/, '').toUpperCase();
    const isSpell = itemType === 'spell' || itemSubtype.startsWith('spell') || MAGIC_SPELL_PALETTES[cleanSpellKey] !== undefined;
    if (isSpell) {
        const p = MAGIC_SPELL_PALETTES[cleanSpellKey] || MAGIC_SPELL_PALETTES['BASIC'];
        for (let y = 0; y < 16; y++) {
            const row = MAGIC_SPELL_SHAPE[y];
            for (let x = 0; x < 16; x++) {
                const ch = row[x];
                if (ch === ' ') continue;
                if (ch === 'O') ctx.fillStyle = '#1a1a2e';
                else if (ch === 'H') ctx.fillStyle = p.h || p.c;
                else if (ch === 'C') ctx.fillStyle = p.c;
                else if (ch === 'D') ctx.fillStyle = p.d;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const savedCvs = document.createElement('canvas');
        savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
        _itemCanvasCache.set(cacheKey, savedCvs);
        _itemTextureCache.set(cacheKey, canvas.toDataURL());
        _itemCanvasCache.set(itemSubtype, savedCvs);
        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // 3. Wand Modifiers (radiant runic diamond gems)
    const isModifier = itemType === 'modifier' || MAGIC_MODIFIER_PALETTES[itemSubtype] !== undefined;
    if (isModifier) {
        const p = MAGIC_MODIFIER_PALETTES[itemSubtype] || MAGIC_MODIFIER_PALETTES['DAMAGE_UP'];
        for (let y = 0; y < 16; y++) {
            const row = MAGIC_MODIFIER_SHAPE[y];
            for (let x = 0; x < 16; x++) {
                const ch = row[x];
                if (ch === ' ') continue;
                if (ch === 'O') ctx.fillStyle = '#111111';
                else if (ch === 'H') ctx.fillStyle = p.h;
                else if (ch === 'C') ctx.fillStyle = p.c;
                else if (ch === 'D') ctx.fillStyle = p.d;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const savedCvs = document.createElement('canvas');
        savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
        _itemCanvasCache.set(cacheKey, savedCvs);
        _itemTextureCache.set(cacheKey, canvas.toDataURL());
        _itemCanvasCache.set(itemSubtype, savedCvs);
        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
        if (onLoaded) onLoaded(canvas);
        return canvas;
    }

    // 4. Vanilla Minecraft Item Textures
    const useMC = true;
    if (useMC) {
        if (isSpawnEgg) {
            const eggCvs = renderSpawnEggCanvas(cleanEgg);
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.drawImage(eggCvs, 0, 0);
            const savedCvs = document.createElement('canvas');
            savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
            savedCvs.getContext('2d').drawImage(canvas, 0, 0);
            _itemCanvasCache.set(cacheKey, savedCvs);
            _itemTextureCache.set(cacheKey, canvas.toDataURL());
            _itemCanvasCache.set(`${cleanEgg}_spawn_egg`, savedCvs);
            _itemTextureCache.set(`${cleanEgg}_spawn_egg`, canvas.toDataURL());
            _itemCanvasCache.set(`spawn_egg_${cleanEgg}`, savedCvs);
            _itemTextureCache.set(`spawn_egg_${cleanEgg}`, canvas.toDataURL());
            _itemCanvasCache.set(itemSubtype, savedCvs);
            _itemTextureCache.set(itemSubtype, canvas.toDataURL());

            // If a local or official PNG exists, allow it to upgrade the texture
            const mcEggKey = MC_ITEM_MAP[`spawn_egg_${cleanEgg}`] || MC_ITEM_MAP[`${cleanEgg}_spawn_egg`];
            if (mcEggKey) {
                loadMinecraftTexture(mcEggKey).then(img => {
                    if (img) {
                        ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                        ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                        savedCvs.getContext('2d').clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                        savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                        _itemTextureCache.set(cacheKey, canvas.toDataURL());
                        _itemTextureCache.set(`${cleanEgg}_spawn_egg`, canvas.toDataURL());
                        _itemTextureCache.set(`spawn_egg_${cleanEgg}`, canvas.toDataURL());
                        _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                        if (onLoaded) onLoaded(canvas);
                    }
                });
            }
            if (onLoaded) onLoaded(canvas);
            return canvas;
        }

        let mcKey = MC_ITEM_MAP[itemSubtype] || MC_ITEM_MAP[cacheKey] || MC_ITEM_MAP[itemSubtype.replace(/^item\//, '')];
        const mcName = mcKey;
        if (mcName) {
            loadMinecraftTexture(mcName).then(img => {
                if (img) {
                    ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
                    ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
                    const savedCvs = document.createElement('canvas');
                    savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
                    savedCvs.getContext('2d').drawImage(canvas, 0, 0);
                    _itemCanvasCache.set(cacheKey, savedCvs);
                    _itemTextureCache.set(cacheKey, canvas.toDataURL());
                    _itemCanvasCache.set(itemSubtype, savedCvs);
                    _itemTextureCache.set(itemSubtype, canvas.toDataURL());
                    if (onLoaded) onLoaded(canvas);
                }
            });
        } else {
            // Fallback crystal icon so non-Minecraft items are never invisible
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(4, 4, 8, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(5, 5, 3, 3);
            ctx.fillStyle = '#0091ea';
            ctx.fillRect(4, 10, 8, 2);
            ctx.fillRect(10, 4, 2, 8);
            const savedCvs = document.createElement('canvas');
            savedCvs.width = TEX_SIZE; savedCvs.height = TEX_SIZE;
            savedCvs.getContext('2d').drawImage(canvas, 0, 0);
            _itemCanvasCache.set(cacheKey, savedCvs);
            _itemTextureCache.set(cacheKey, canvas.toDataURL());
            _itemCanvasCache.set(itemSubtype, savedCvs);
            _itemTextureCache.set(itemSubtype, canvas.toDataURL());
            if (onLoaded) onLoaded(canvas);
        }
    }

    return canvas;
}

export function generateSpellTexture(element) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Create a radial gradient for a glowing orb
    const cx = 16, cy = 16, r = 16;
    let colorInner, colorOuter;
    
    if (element === 'FIRE') { colorInner = 'rgba(255,255,255,1)'; colorOuter = 'rgba(255,64,0,0)'; }
    else if (element === 'ICE') { colorInner = 'rgba(200,255,255,1)'; colorOuter = 'rgba(0,128,255,0)'; }
    else if (element === 'HEAL') { colorInner = 'rgba(200,255,200,1)'; colorOuter = 'rgba(64,255,64,0)'; }
    else if (element === 'EARTH') { colorInner = 'rgba(200,160,100,1)'; colorOuter = 'rgba(139,69,19,0)'; }
    else if (element === 'THUNDER') { colorInner = 'rgba(255,255,200,1)'; colorOuter = 'rgba(255,255,0,0)'; }
    else if (element === 'DARK') { colorInner = 'rgba(180,100,255,1)'; colorOuter = 'rgba(102,0,204,0)'; }
    else if (element === 'WIND') { colorInner = 'rgba(200,255,220,1)'; colorOuter = 'rgba(153,255,204,0)'; }
    else if (element === 'POISON') { colorInner = 'rgba(150,255,150,1)'; colorOuter = 'rgba(51,204,51,0)'; }
    else if (element === 'FROST') { colorInner = 'rgba(150,255,255,1)'; colorOuter = 'rgba(0,255,255,0)'; }
    else if (element === 'LIGHT') { colorInner = 'rgba(255,255,150,1)'; colorOuter = 'rgba(255,200,0,0)'; }
    else if (element === 'VOID') { colorInner = 'rgba(150,0,200,1)'; colorOuter = 'rgba(80,0,150,0)'; }
    else if (element === 'LAVA') { colorInner = 'rgba(255,100,0,1)'; colorOuter = 'rgba(200,40,0,0)'; }
    else if (element === 'BUILDER') { colorInner = 'rgba(200,200,200,1)'; colorOuter = 'rgba(100,100,100,0)'; }
    else { colorInner = 'rgba(255,255,255,1)'; colorOuter = 'rgba(128,0,255,0)'; } // Arcane/Default
    
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    grad.addColorStop(0, colorInner);
    grad.addColorStop(0.3, colorOuter.replace(',0)', ',0.8)'));
    grad.addColorStop(1, colorOuter);
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    
    // Add some random spark pixels for detail
    for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 10;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(cx + Math.cos(a)*d, cy + Math.sin(a)*d, 1, 1);
    }
    
    return canvas;
}


// ============================================================
// MC Entity Skin Config — maps each mob to CDN URL + face UVs
// [sx, sy, sw, sh] = source rect in skin sheet → scaled to 16x16
// ============================================================
const _ENTITY_LOCAL_BASE = 'assets/mc/entity/';
const _ENTITY_CDN_BASE = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.4/assets/minecraft/textures/entity/';
const MC_MOB_SKIN_CONFIG = {
    // --- Quadrupeds ---
    COW: { path: 'cow/cow.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [18,20,10,14], leg: [0,16,4,16], horn: [22,0,4,4], snout: [1,5,4,3] },
    PIG: { path: 'pig/pig.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [28,16,8,14], leg: [0,16,4,16], snout: [16,16,4,3] },
    SHEEP: { path: 'sheep/sheep.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [28,16,8,14], leg: [0,16,4,16] },
    CHICKEN: { path: 'chicken.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [26,0,3,5], wing: [24,13,8,9] },
    // --- Humanoids ---
    ZOMBIE: { path: 'zombie/zombie.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [4,20,4,12], arm: [44,20,4,12] },
    SKELETON: { path: 'skeleton/skeleton.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [4,20,4,12], arm: [44,20,4,12] },
    CREEPER: { path: 'creeper/creeper.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [0,16,4,6] },
    ENDERMAN: { path: 'enderman/enderman.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [56,0,2,30], arm: [56,0,2,30] },
    PIGLIN_BRUISER: { path: 'piglin/piglin_brute.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [4,20,4,12], arm: [44,20,4,12] },
    GOLEM: { path: 'iron_golem/iron_golem.png',
        head_front: [6,10,8,10], head_back: [20,10,8,10], head_top: [6,0,8,6], head_bottom: [14,0,8,6], head_side: [0,10,6,10],
        body: [18,40,18,12], leg: [37,0,6,16], arm: [60,58,8,30] },
    WARDEN: { path: 'warden/warden.png',
        head_front: [16,48,16,16], head_back: [48,48,16,16], head_top: [16,32,16,16], head_bottom: [32,32,16,16], head_side: [0,48,16,16],
        body: [11,11,18,21], leg: [76,76,6,13], arm: [44,58,8,28] },
    VILLAGER: { path: 'villager/villager.png',
        head_front: [8,8,8,10], head_back: [24,8,8,10], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,10],
        body: [16,20,8,18], leg: [0,22,4,12], arm: [44,22,16,8] },
    WITCH: { path: 'witch/witch.png',
        head_front: [8,8,8,10], head_back: [24,8,8,10], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,10],
        body: [16,20,8,18], leg: [0,22,4,12], arm: [44,22,16,8],
        hat_brim: [0,64,10,2], hat_mid: [0,76,7,4], hat_top: [0,87,4,4] },
    POLAR_BEAR: { path: 'polar_bear/polarbear.png',
        head_front: [9,9,7,7], head_back: [25,9,7,7], head_top: [9,0,7,9], head_bottom: [16,0,7,9], head_side: [0,9,9,7],
        body: [10,29,12,10], leg: [50,30,4,10], snout: [3,47,5,3] },
    SNOW_GOLEM: { path: 'snow_golem/snow_golem.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [8,24,8,8], leg: [0,48,12,12], arm: [34,2,12,2] },
    // --- Other ---
    SPIDER: { path: 'spider/spider.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [20,20,8,12], leg: [0,16,16,8] },
    SLIME: { path: 'slime/slime.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [8,8,8,8] },
    LAVASLIME: { path: 'slime/magmacube.png',
        head_front: [8,8,8,8], head_back: [24,8,8,8], head_top: [8,0,8,8], head_bottom: [16,0,8,8], head_side: [0,8,8,8],
        body: [8,8,8,8] },
    BAT: { path: 'bat.png',
        head_front: [0,0,6,6], head_back: [12,0,6,6], head_top: [6,0,6,6], head_bottom: [12,0,6,6], head_side: [0,0,6,6],
        body: [0,6,6,10] },
    TURTLE: { path: 'turtle/big_sea_turtle.png',
        head_front: [9,6,6,5], head_back: [21,6,6,5], head_top: [9,0,6,6], head_bottom: [15,0,6,6], head_side: [3,6,6,5],
        body: [22,24,15,13], leg: [0,16,6,6] },
    FROG: { path: 'frog/temperate_frog.png',
        head_front: [23,13,7,5], head_back: [35,13,7,5], head_top: [23,8,7,5], head_bottom: [23,8,7,5], head_side: [18,13,5,5],
        body: [0,9,8,9], leg: [0,14,4,6] },
    CAMEL: { path: 'camel/camel.png',
        head_front: [60,24,7,8], head_back: [74,24,7,8], head_top: [60,10,7,14], head_bottom: [67,10,7,14], head_side: [46,24,14,8],
        body: [0,40,20,27], leg: [0,18,4,14] },
    // --- Fish ---
    COD: { path: 'fish/cod.png',
        head_front: [0,0,8,8], head_back: [16,0,8,8], head_top: [8,0,8,4], head_bottom: [16,0,8,4], head_side: [0,0,4,8],
        body: [0,8,8,8] },
    SALMON: { path: 'fish/salmon.png',
        head_front: [0,0,8,8], head_back: [16,0,8,8], head_top: [8,0,8,4], head_bottom: [16,0,8,4], head_side: [0,0,4,8],
        body: [0,8,8,8] },
    TROPICAL_FISH: { path: 'fish/tropical_a.png',
        head_front: [0,0,8,8], head_back: [16,0,8,8], head_top: [8,0,8,4], head_bottom: [16,0,8,4], head_side: [0,0,4,8],
        body: [0,8,8,8] },
    PUFFERFISH: { path: 'fish/pufferfish.png',
        head_front: [0,0,8,8], head_back: [0,0,8,8], head_top: [8,0,8,4], head_bottom: [0,0,8,4], head_side: [0,0,4,8],
        body: [0,8,8,8] },
};
// Preloaded skin image cache to avoid redundant network requests
const _mobSkinCache = {};

export function generateMobTexture(mobType, part = 'body', onLoaded = null) {
    if (typeof part === 'function') {
        onLoaded = part;
        part = 'body';
    }

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    // MC skin sheet handles all mob textures via MC_MOB_SKIN_CONFIG
    const cfg = MC_MOB_SKIN_CONFIG[mobType];
    if (cfg) {
        const uvs = cfg[part] || cfg.body || [0, 0, 8, 8];
        const skinUrl = _ENTITY_LOCAL_BASE + cfg.path;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            ctx.clearRect(0, 0, 16, 16);
            ctx.drawImage(img, uvs[0], uvs[1], uvs[2], uvs[3], 0, 0, 16, 16);
            if (onLoaded) onLoaded(canvas);
        };
        img.onerror = () => {
            const remote = new Image();
            remote.crossOrigin = 'anonymous';
            remote.onload = () => {
                ctx.clearRect(0, 0, 16, 16);
                ctx.drawImage(remote, uvs[0], uvs[1], uvs[2], uvs[3], 0, 0, 16, 16);
                if (onLoaded) onLoaded(canvas);
            };
            remote.src = _ENTITY_CDN_BASE + cfg.path;
        };
        img.src = skinUrl;
    }
    return canvas;
}

// Authentic Minecraft Steve Skin (64x64 PNG)
export const STEVE_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAdVBMVEUAAAAKvLwAzMwmGgokGAgrHg0zJBE/KhW3g2uzeV5SPYn///+qclmbY0mQWT8Af38AaGhVVVWUYD52SzOBUzmPXj5JJRBCHQp3QjVqQDA0JRIoKCg3Nzc/Pz9KSko6MYlBNZtGOqUDenoFiIgElZUApKQAr6/wvakZAAAAAXRSTlMAQObYZgAAAolJREFUeNrt1l1rHucZReFrj/whu5hSCCQtlOTE/f+/Jz4q9Cu0YIhLcFVpVg+FsOCVehi8jmZgWOzZz33DM4CXlum3gH95GgeAzQZVeL4gTm6Cbp4vqFkD8HwBazPY8wWbMq9utu3mNZ5fotVezbzOE3kBEFbaZuc8kb00NTMUbWJp678Xf2GV7RRtx1TDQQ6XBNvsmL2+2vHq1TftmMPIyAWujtN2cl274ua2jpVpZneXEjjo7XW1q53V9ds4ODO5xIuhvGHvfLI3aixauig415uuO2+vl9+cncfsFw25zL650fXn687jqnXuP68/X3+eV3zE7y6u9eB73MlfAcfbTf3yR8CfAX+if8S/H5/EAbAxj5LN48tULvEBOh8V1AageMTXe2YHAOwHbZxrzPkSR3+ffr8TR2JDzE/4Fj8CDgEwDsW+q+9GsR07hhg2CsALBgMo2v5wNxXnQXMeGQVW7gUAyKI2m6KDsJ8Au3++F5RZO+kKNQjQcLLWgjwUjBXLltFgWWMUUlviocBgNoxNGgMjSxiYAA7zgLFo2hgIENiDU8gQCzDOmViGFAsEuBcQSDCothhpJaDRA8E5fHqH2nTbYm5fHLo1V0u3B7DAuheoeScRYabjjjuzs17cHVaTrTXmK78m9swP34d9oK/dfeXSIH2PW/MXwPvxN/bJlxw8zlYAcEyeI6gNgA/O8P8neN8xe1IHP2gTzegjvhUDfuRygmwEs2GE4mkCDIAzm2R4yAuPsIdR9k8AvMc+3L9+2UEjo4WP0FpgP19O0MzCsqxIoMsdDBvYcQyGmO0ZJRoYCKjLJWY0BAhYwGUBCgkh8MRdOKt+ruqMwAB2OcEX94U1TPbYJP0PkyyAI1S6cSIAAAAASUVORK5CYII=';

let _steveImg = null;
let _steveCanvas = null;
let _stevePartCanvases = null;
const _activeSteveTextures = new Set();

function updateStevePartCanvases() {
    if (!_stevePartCanvases) return;
    const skin = getSteveSkinCanvas();
    const copy = (c, x, y, w, h) => {
        const ctx = c.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(skin, x, y, w, h, 0, 0, w, h);
    };

    const p = _stevePartCanvases;
    copy(p.head.right, 0, 8, 8, 8);
    copy(p.head.left, 16, 8, 8, 8);
    copy(p.head.top, 8, 0, 8, 8);
    copy(p.head.bottom, 16, 0, 8, 8);
    copy(p.head.back, 24, 8, 8, 8);
    copy(p.head.front, 8, 8, 8, 8);

    copy(p.torso.right, 16, 20, 4, 12);
    copy(p.torso.left, 28, 20, 4, 12);
    copy(p.torso.top, 20, 16, 8, 4);
    copy(p.torso.bottom, 28, 16, 8, 4);
    copy(p.torso.back, 32, 20, 8, 12);
    copy(p.torso.front, 20, 20, 8, 12);

    copy(p.rightArm.right, 40, 20, 4, 12);
    copy(p.rightArm.left, 48, 20, 4, 12);
    copy(p.rightArm.top, 44, 16, 4, 4);
    copy(p.rightArm.bottom, 48, 16, 4, 4);
    copy(p.rightArm.back, 52, 20, 4, 12);
    copy(p.rightArm.front, 44, 20, 4, 12);

    copy(p.leftArm.right, 32, 52, 4, 12);
    copy(p.leftArm.left, 40, 52, 4, 12);
    copy(p.leftArm.top, 36, 48, 4, 4);
    copy(p.leftArm.bottom, 40, 48, 4, 4);
    copy(p.leftArm.back, 44, 52, 4, 12);
    copy(p.leftArm.front, 36, 52, 4, 12);

    copy(p.rightLeg.right, 0, 20, 4, 12);
    copy(p.rightLeg.left, 8, 20, 4, 12);
    copy(p.rightLeg.top, 4, 16, 4, 4);
    copy(p.rightLeg.bottom, 8, 16, 4, 4);
    copy(p.rightLeg.back, 12, 20, 4, 12);
    copy(p.rightLeg.front, 4, 20, 4, 12);

    copy(p.leftLeg.right, 16, 52, 4, 12);
    copy(p.leftLeg.left, 24, 52, 4, 12);
    copy(p.leftLeg.top, 20, 48, 4, 4);
    copy(p.leftLeg.bottom, 24, 48, 4, 4);
    copy(p.leftLeg.back, 28, 52, 4, 12);
    copy(p.leftLeg.front, 20, 52, 4, 12);

    for (const tex of _activeSteveTextures) {
        tex.needsUpdate = true;
    }
}

export function getSteveSkinCanvas() {
    if (_steveCanvas) return _steveCanvas;
    const cvs = document.createElement('canvas');
    cvs.width = 64; cvs.height = 64;
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    // Synchronously paint procedural Steve immediately so the skin is never black!
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); updateStevePartCanvases(); };
    img.src = STEVE_B64;
    _steveCanvas = cvs;
    return cvs;
}

export async function initSteveSkin() {
    const cvs = getSteveSkinCanvas();
    const ctx = cvs.getContext('2d', { willReadFrequently: true });
    getStevePartTextures(); // Ensure canvases are allocated

    return new Promise((resolve) => {
        const local = new Image();
        local.crossOrigin = 'anonymous';
        local.onload = () => {
            _steveImg = local;
            ctx.clearRect(0, 0, 64, 64);
            ctx.drawImage(local, 0, 0);
            updateStevePartCanvases();
            resolve(cvs);
        };
        local.onerror = () => {
            // Fallback to base64 embedded Steve skin
            const b64 = new Image();
            b64.onload = () => {
                _steveImg = b64;
                ctx.clearRect(0, 0, 64, 64);
                ctx.drawImage(b64, 0, 0);
                updateStevePartCanvases();
                resolve(cvs);
            };
            b64.onerror = () => resolve(cvs);
            b64.src = STEVE_B64;
        };
        local.src = 'assets/mc/steve.png';
    });
}

export function getStevePartTextures() {
    if (_stevePartCanvases) return _stevePartCanvases;
    const make = (w, h) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    };

    _stevePartCanvases = {
        head: {
            right:  make(8, 8),
            left:   make(8, 8),
            top:    make(8, 8),
            bottom: make(8, 8),
            back:   make(8, 8),
            front:  make(8, 8)
        },
        torso: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(8, 4),
            bottom: make(8, 4),
            back:   make(8, 12),
            front:  make(8, 12)
        },
        rightArm: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(4, 4),
            bottom: make(4, 4),
            back:   make(4, 12),
            front:  make(4, 12)
        },
        leftArm: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(4, 4),
            bottom: make(4, 4),
            back:   make(4, 12),
            front:  make(4, 12)
        },
        rightLeg: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(4, 4),
            bottom: make(4, 4),
            back:   make(4, 12),
            front:  make(4, 12)
        },
        leftLeg: {
            right:  make(4, 12),
            left:   make(4, 12),
            top:    make(4, 4),
            bottom: make(4, 4),
            back:   make(4, 12),
            front:  make(4, 12)
        }
    };

    updateStevePartCanvases();
    return _stevePartCanvases;
}

export function createSteveBodyMaterials(partName) {
    const parts = getStevePartTextures()[partName];
    if (!parts) return null;
    const makeTex = (canvas) => {
        const t = new THREE.CanvasTexture(canvas);
        t.generateMipmaps = true;
        t.magFilter = THREE.NearestFilter;
        t.minFilter = THREE.NearestMipmapLinearFilter;
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
        _activeSteveTextures.add(t);
        return t;
    };
    const emissive = new THREE.Color(0x222222);
    return [
        new THREE.MeshLambertMaterial({ map: makeTex(parts.right), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.left), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.top), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.bottom), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.back), emissive }),
        new THREE.MeshLambertMaterial({ map: makeTex(parts.front), emissive })
    ];
}

// Procedural Player Character Skin Textures (Steve face on front, hair on back)
export function generatePlayerSkinTextures() {
    const parts = getStevePartTextures();
    return {
        headCanvas: parts.head.front,
        torsoCanvas: parts.torso.front,
        armCanvas: parts.rightArm.front,
        legCanvas: parts.rightLeg.front
    };
}

export function generatePlayerSkinTexture() {
    return generatePlayerSkinTextures().headCanvas;
}

// First-Person Steve Hand Texture
export function generateDetailedHandTexture() {
    const skin = getSteveSkinCanvas();
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // Steve right arm front: (x: 44, y: 20, w: 4, h: 12) stretched to 16x32
    ctx.drawImage(skin, 44, 20, 4, 12, 0, 0, 16, 32);
    return canvas;
}

// Procedural Carved Wand Staff Texture (rich grain + golden rune filigree)
export function generateWandShaftTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Rich dark carved mahogany/skyroot wood base
    ctx.fillStyle = '#3a2312';
    ctx.fillRect(0, 0, 32, 128);

    // Vertical wood grains
    for (let x = 0; x < 32; x += 3) {
        ctx.fillStyle = (x % 6 === 0) ? '#4a2f19' : '#29180b';
        ctx.fillRect(x, 0, 2, 128);
    }

    // Polished golden rings & rune bands
    ctx.fillStyle = '#d4af37';
    // Top collar (holding gem socket)
    ctx.fillRect(0, 0, 32, 10);
    ctx.fillStyle = '#ffdf78';
    ctx.fillRect(0, 2, 32, 3); // Gold highlight
    ctx.fillStyle = '#997a15';
    ctx.fillRect(0, 9, 32, 2); // Gold shadow

    // Middle grip band
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 56, 32, 8);
    ctx.fillStyle = '#ffdf78';
    ctx.fillRect(0, 58, 32, 2);

    // Pommel band at bottom
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(0, 118, 32, 10);
    ctx.fillStyle = '#ffdf78';
    ctx.fillRect(0, 120, 32, 2);

    // Mystical cyan glowing rune engravings down shaft
    ctx.fillStyle = '#00ffff';
    const runePattern = [14, 22, 34, 42, 70, 78, 90, 98, 106];
    for (const y of runePattern) {
        ctx.fillRect(14, y, 4, 3);
        ctx.fillRect(12, y + 1, 8, 1);
    }

    // Noise
    const id = ctx.getImageData(0, 0, 32, 128);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 12;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
        d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
    }
    ctx.putImageData(id, 0, 0);

    return canvas;
}

// ============================================================
// Authentic Minecraft Mob Box UV Materials
// Maps standard Minecraft entity skin box UVs onto Three.js BoxGeometry
// Face order for BoxGeometry: [+X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)]
// ============================================================
const _mobBoxMaterialCache = {};

export function getMobBoxMaterials(mobType, uvs, options = {}) {
    // mobType: e.g. 'COW', 'PIG', 'SHEEP', 'CHICKEN'
    // uvs: { u, v, w, h, d, l } standard MC box UV definition
    // options: { skinKey, emissive, emissiveIntensity, part, faceUVs, isBody }
    const isBody = !!options.isBody;
    const isOverlay = !!options.isOverlay;
    const key = `${mobType}_${uvs.u}_${uvs.v}_${uvs.w}_${uvs.h}_${uvs.d || uvs.l || ''}_${options.skinKey || ''}_${options.part || ''}_${isBody ? 'body' : ''}_${isOverlay ? 'ovl' : ''}`;
    if (_mobBoxMaterialCache[key]) {
        return _mobBoxMaterialCache[key];
    }

    const { u, v, w, h } = uvs;
    const d = uvs.d || uvs.l || 0;
    const l = uvs.l || uvs.d || d;
    const skinPath = options.skinKey || (MC_MOB_SKIN_CONFIG[mobType] ? MC_MOB_SKIN_CONFIG[mobType].path : null);

    const makeFaceCanvas = (fw, fh) => {
        const c = document.createElement('canvas');
        c.width = Math.max(1, fw); c.height = Math.max(1, fh);
        const cctx = c.getContext('2d', { willReadFrequently: true });
        cctx.imageSmoothingEnabled = false;
        return { c, ctx: cctx };
    };

    let lw, lh, rw, rh, tw, th, bw, bh, fw, fh, kw, kh;
    const custom = options.faceUVs;

    if (custom) {
        rw = custom.right[2];  rh = custom.right[3];
        lw = custom.left[2];   lh = custom.left[3];
        tw = custom.top[2];    th = custom.top[3];
        bw = custom.bottom[2]; bh = custom.bottom[3];
        fw = custom.front[2];  fh = custom.front[3];
        kw = custom.back[2];   kh = custom.back[3];
    } else if (isBody) {
        // Quadruped body in world space: BoxGeometry(w, h, l)
        // Face 0 (+X): Left flank (length l x height h)
        // Face 1 (-X): Right flank (length l x height h)
        // Face 2 (+Y): Spine/Top (width w x length l)
        // Face 3 (-Y): Belly/Bottom (width w x length l)
        // Face 4 (+Z): Chest/Front (width w x height h)
        // Face 5 (-Z): Butt/Rear (width w x height h)
        lw = l; lh = h;
        rw = l; rh = h;
        tw = w; th = l;
        bw = w; bh = l;
        fw = w; fh = h;
        kw = w; kh = h;
    } else {
        // Standard upright cuboid: BoxGeometry(w, h, d)
        // Face 0 (+X): Left side (depth d x height h)
        // Face 1 (-X): Right side (depth d x height h)
        // Face 2 (+Y): Top (width w x depth d)
        // Face 3 (-Y): Bottom (width w x depth d)
        // Face 4 (+Z): Front (width w x height h)
        // Face 5 (-Z): Back (width w x height h)
        lw = d; lh = h;
        rw = d; rh = h;
        tw = w; th = d;
        bw = w; bh = d;
        fw = w; fh = h;
        kw = w; kh = h;
    }

    const left   = makeFaceCanvas(lw, lh); // Face 0 (+X in Three.js)
    const right  = makeFaceCanvas(rw, rh); // Face 1 (-X in Three.js)
    const top    = makeFaceCanvas(tw, th); // Face 2 (+Y in Three.js)
    const bottom = makeFaceCanvas(bw, bh); // Face 3 (-Y in Three.js)
    const front  = makeFaceCanvas(fw, fh); // Face 4 (+Z in Three.js)
    const back   = makeFaceCanvas(kw, kh); // Face 5 (-Z in Three.js)

    const faces = [
        { name: 'left',   canvas: left.c,   ctx: left.ctx },
        { name: 'right',  canvas: right.c,  ctx: right.ctx },
        { name: 'top',    canvas: top.c,    ctx: top.ctx },
        { name: 'bottom', canvas: bottom.c, ctx: bottom.ctx },
        { name: 'front',  canvas: front.c,  ctx: front.ctx },
        { name: 'back',   canvas: back.c,   ctx: back.ctx }
    ];

    // Initialize faces with procedural fallback using appropriate part
    const partToUse = options.part || 'body';
    const procFallback = generateMobTexture(mobType, partToUse);
    for (const f of faces) {
        f.ctx.drawImage(procFallback, 0, 0, 16, 16, 0, 0, f.canvas.width, f.canvas.height);
    }

    const textures = faces.map(f => {
        const tex = new THREE.CanvasTexture(f.canvas);
        tex.generateMipmaps = true;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestMipmapLinearFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    });

    const applySkinImage = (img) => {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = iw; offCanvas.height = ih;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
        offCtx.drawImage(img, 0, 0);
        const imgData = offCtx.getImageData(0, 0, iw, ih);
        const sdata = imgData.data;

        const getPixel = (px, py) => {
            if (px < 0 || px >= iw || py < 0 || py >= ih) return [0, 0, 0, 0];
            const i = (py * iw + px) * 4;
            return [sdata[i], sdata[i + 1], sdata[i + 2], sdata[i + 3]];
        };

        if (custom) {
            const faceList = [
                { f: faces[0], r: custom.left },
                { f: faces[1], r: custom.right },
                { f: faces[2], r: custom.top },
                { f: faces[3], r: custom.bottom },
                { f: faces[4], r: custom.front },
                { f: faces[5], r: custom.back }
            ];
            for (const { f, r } of faceList) {
                const fbData = f.ctx.getImageData(0, 0, f.canvas.width, f.canvas.height);
                const outData = f.ctx.createImageData(f.canvas.width, f.canvas.height);
                for (let cy = 0; cy < f.canvas.height; cy++) {
                    for (let cx = 0; cx < f.canvas.width; cx++) {
                        const tx = r[0] + cx;
                        const ty = r[1] + cy;
                        const p = getPixel(tx, ty);
                        const di = (cy * f.canvas.width + cx) * 4;
                        if (p[3] > 10) {
                            outData.data[di] = p[0];
                            outData.data[di+1] = p[1];
                            outData.data[di+2] = p[2];
                            outData.data[di+3] = 255;
                        } else if (isOverlay) {
                            outData.data[di] = 0;
                            outData.data[di+1] = 0;
                            outData.data[di+2] = 0;
                            outData.data[di+3] = 0;
                        } else {
                            outData.data[di] = fbData.data[di];
                            outData.data[di+1] = fbData.data[di+1];
                            outData.data[di+2] = fbData.data[di+2];
                            outData.data[di+3] = 255;
                        }
                    }
                }
                f.ctx.putImageData(outData, 0, 0);
            }
        } else if (isBody) {
            // Authentic Minecraft Quadruped Body UV unrolling (Pig, Cow, Sheep, Chicken)
            // Face 0: +X (Left flank, length l x height h)
            const fb0 = faces[0].ctx.getImageData(0, 0, l, h);
            const leftData = faces[0].ctx.createImageData(l, h);
            for (let cy = 0; cy < h; cy++) {
                for (let cx = 0; cx < l; cx++) {
                    const tx = (u + h + w + h - 1) - cy;
                    const ty = (v + h) + cx;
                    const p = getPixel(tx, ty);
                    const di = (cy * l + cx) * 4;
                    if (p[3] > 10) {
                        leftData.data[di] = p[0]; leftData.data[di+1] = p[1]; leftData.data[di+2] = p[2]; leftData.data[di+3] = 255;
                    } else if (isOverlay) {
                        leftData.data[di] = 0; leftData.data[di+1] = 0; leftData.data[di+2] = 0; leftData.data[di+3] = 0;
                    } else {
                        leftData.data[di] = fb0.data[di]; leftData.data[di+1] = fb0.data[di+1]; leftData.data[di+2] = fb0.data[di+2]; leftData.data[di+3] = 255;
                    }
                }
            }
            faces[0].ctx.putImageData(leftData, 0, 0);

            // Face 1: -X (Right flank, length l x height h)
            const fb1 = faces[1].ctx.getImageData(0, 0, l, h);
            const rightData = faces[1].ctx.createImageData(l, h);
            for (let cy = 0; cy < h; cy++) {
                for (let cx = 0; cx < l; cx++) {
                    const tx = (u + h - 1) - cy;
                    const ty = (v + h) + (l - 1 - cx);
                    const p = getPixel(tx, ty);
                    const di = (cy * l + cx) * 4;
                    if (p[3] > 10) {
                        rightData.data[di] = p[0]; rightData.data[di+1] = p[1]; rightData.data[di+2] = p[2]; rightData.data[di+3] = 255;
                    } else if (isOverlay) {
                        rightData.data[di] = 0; rightData.data[di+1] = 0; rightData.data[di+2] = 0; rightData.data[di+3] = 0;
                    } else {
                        rightData.data[di] = fb1.data[di]; rightData.data[di+1] = fb1.data[di+1]; rightData.data[di+2] = fb1.data[di+2]; rightData.data[di+3] = 255;
                    }
                }
            }
            faces[1].ctx.putImageData(rightData, 0, 0);

            // Face 2: +Y (Spine / Top of back, width w x length l)
            const fb2 = faces[2].ctx.getImageData(0, 0, w, l);
            const topData = faces[2].ctx.createImageData(w, l);
            for (let cy = 0; cy < l; cy++) {
                for (let cx = 0; cx < w; cx++) {
                    const tx = (u + h + w + h) + cx;
                    const ty = (v + h) + cy;
                    const p = getPixel(tx, ty);
                    const di = (cy * w + cx) * 4;
                    if (p[3] > 10) {
                        topData.data[di] = p[0]; topData.data[di+1] = p[1]; topData.data[di+2] = p[2]; topData.data[di+3] = 255;
                    } else if (isOverlay) {
                        topData.data[di] = 0; topData.data[di+1] = 0; topData.data[di+2] = 0; topData.data[di+3] = 0;
                    } else {
                        topData.data[di] = fb2.data[di]; topData.data[di+1] = fb2.data[di+1]; topData.data[di+2] = fb2.data[di+2]; topData.data[di+3] = 255;
                    }
                }
            }
            faces[2].ctx.putImageData(topData, 0, 0);

            // Face 3: -Y (Belly / Bottom, width w x length l)
            const fb3 = faces[3].ctx.getImageData(0, 0, w, l);
            const botData = faces[3].ctx.createImageData(w, l);
            for (let cy = 0; cy < l; cy++) {
                for (let cx = 0; cx < w; cx++) {
                    const tx = (u + h) + cx;
                    const ty = (v + h) + (l - 1 - cy);
                    const p = getPixel(tx, ty);
                    const di = (cy * w + cx) * 4;
                    if (p[3] > 10) {
                        botData.data[di] = p[0]; botData.data[di+1] = p[1]; botData.data[di+2] = p[2]; botData.data[di+3] = 255;
                    } else if (isOverlay) {
                        botData.data[di] = 0; botData.data[di+1] = 0; botData.data[di+2] = 0; botData.data[di+3] = 0;
                    } else {
                        botData.data[di] = fb3.data[di]; botData.data[di+1] = fb3.data[di+1]; botData.data[di+2] = fb3.data[di+2]; botData.data[di+3] = 255;
                    }
                }
            }
            faces[3].ctx.putImageData(botData, 0, 0);

            // Face 4: +Z (Chest / Front, width w x height h)
            const fb4 = faces[4].ctx.getImageData(0, 0, w, h);
            const frontData = faces[4].ctx.createImageData(w, h);
            for (let cy = 0; cy < h; cy++) {
                for (let cx = 0; cx < w; cx++) {
                    const tx = (u + h) + cx;
                    const ty = v + cy;
                    const p = getPixel(tx, ty);
                    const di = (cy * w + cx) * 4;
                    if (p[3] > 10) {
                        frontData.data[di] = p[0]; frontData.data[di+1] = p[1]; frontData.data[di+2] = p[2]; frontData.data[di+3] = 255;
                    } else if (isOverlay) {
                        frontData.data[di] = 0; frontData.data[di+1] = 0; frontData.data[di+2] = 0; frontData.data[di+3] = 0;
                    } else {
                        frontData.data[di] = fb4.data[di]; frontData.data[di+1] = fb4.data[di+1]; frontData.data[di+2] = fb4.data[di+2]; frontData.data[di+3] = 255;
                    }
                }
            }
            faces[4].ctx.putImageData(frontData, 0, 0);

            // Face 5: -Z (Butt / Rear with tail, width w x height h)
            const fb5 = faces[5].ctx.getImageData(0, 0, w, h);
            const backData = faces[5].ctx.createImageData(w, h);
            for (let cy = 0; cy < h; cy++) {
                for (let cx = 0; cx < w; cx++) {
                    const tx = (u + h + w) + cx;
                    const ty = v + cy;
                    const p = getPixel(tx, ty);
                    const di = (cy * w + cx) * 4;
                    if (p[3] > 10) {
                        backData.data[di] = p[0]; backData.data[di+1] = p[1]; backData.data[di+2] = p[2]; backData.data[di+3] = 255;
                    } else if (isOverlay) {
                        backData.data[di] = 0; backData.data[di+1] = 0; backData.data[di+2] = 0; backData.data[di+3] = 0;
                    } else {
                        backData.data[di] = fb5.data[di]; backData.data[di+1] = fb5.data[di+1]; backData.data[di+2] = fb5.data[di+2]; backData.data[di+3] = 255;
                    }
                }
            }
            faces[5].ctx.putImageData(backData, 0, 0);
        } else {
            // Authentic Minecraft Standard Box UV unrolling (Head, Legs, Snout, Wings, Udder)
            // Face 0: +X (Mob's Left side: depth d x height h)
            const fb0 = faces[0].ctx.getImageData(0, 0, d, h);
            const leftData = faces[0].ctx.createImageData(d, h);
            for (let cy = 0; cy < h; cy++) {
                for (let cx = 0; cx < d; cx++) {
                    const tx = (u + d + w) + cx;
                    const ty = (v + d) + cy;
                    const p = getPixel(tx, ty);
                    const di = (cy * d + cx) * 4;
                    if (p[3] > 10) {
                        leftData.data[di] = p[0]; leftData.data[di+1] = p[1]; leftData.data[di+2] = p[2]; leftData.data[di+3] = 255;
                    } else if (isOverlay) {
                        leftData.data[di] = 0; leftData.data[di+1] = 0; leftData.data[di+2] = 0; leftData.data[di+3] = 0;
                    } else {
                        leftData.data[di] = fb0.data[di]; leftData.data[di+1] = fb0.data[di+1]; leftData.data[di+2] = fb0.data[di+2]; leftData.data[di+3] = 255;
                    }
                }
            }
            faces[0].ctx.putImageData(leftData, 0, 0);

            // Face 1: -X (Mob's Right side: depth d x height h)
            const fb1 = faces[1].ctx.getImageData(0, 0, d, h);
            const rightData = faces[1].ctx.createImageData(d, h);
            for (let cy = 0; cy < h; cy++) {
                for (let cx = 0; cx < d; cx++) {
                    const tx = u + cx;
                    const ty = (v + d) + cy;
                    const p = getPixel(tx, ty);
                    const di = (cy * d + cx) * 4;
                    if (p[3] > 10) {
                        rightData.data[di] = p[0]; rightData.data[di+1] = p[1]; rightData.data[di+2] = p[2]; rightData.data[di+3] = 255;
                    } else if (isOverlay) {
                        rightData.data[di] = 0; rightData.data[di+1] = 0; rightData.data[di+2] = 0; rightData.data[di+3] = 0;
                    } else {
                        rightData.data[di] = fb1.data[di]; rightData.data[di+1] = fb1.data[di+1]; rightData.data[di+2] = fb1.data[di+2]; rightData.data[di+3] = 255;
                    }
                }
            }
            faces[1].ctx.putImageData(rightData, 0, 0);

            // Face 2: +Y (Top of part: width w x depth d)
            const fb2 = faces[2].ctx.getImageData(0, 0, w, d);
            const topData = faces[2].ctx.createImageData(w, d);
            for (let cy = 0; cy < d; cy++) {
                for (let cx = 0; cx < w; cx++) {
                    const tx = (u + d) + cx;
                    const ty = v + (d - 1 - cy);
                    const p = getPixel(tx, ty);
                    const di = (cy * w + cx) * 4;
                    if (p[3] > 10) {
                        topData.data[di] = p[0]; topData.data[di+1] = p[1]; topData.data[di+2] = p[2]; topData.data[di+3] = 255;
                    } else if (isOverlay) {
                        topData.data[di] = 0; topData.data[di+1] = 0; topData.data[di+2] = 0; topData.data[di+3] = 0;
                    } else {
                        topData.data[di] = fb2.data[di]; topData.data[di+1] = fb2.data[di+1]; topData.data[di+2] = fb2.data[di+2]; topData.data[di+3] = 255;
                    }
                }
            }
            faces[2].ctx.putImageData(topData, 0, 0);

            // Face 3: -Y (Bottom of part: width w x depth d)
            const fb3 = faces[3].ctx.getImageData(0, 0, w, d);
            const botData = faces[3].ctx.createImageData(w, d);
            for (let cy = 0; cy < d; cy++) {
                for (let cx = 0; cx < w; cx++) {
                    const tx = (u + d + w) + cx;
                    const ty = v + (d - 1 - cy);
                    const p = getPixel(tx, ty);
                    const di = (cy * w + cx) * 4;
                    if (p[3] > 10) {
                        botData.data[di] = p[0]; botData.data[di+1] = p[1]; botData.data[di+2] = p[2]; botData.data[di+3] = 255;
                    } else if (isOverlay) {
                        botData.data[di] = 0; botData.data[di+1] = 0; botData.data[di+2] = 0; botData.data[di+3] = 0;
                    } else {
                        botData.data[di] = fb3.data[di]; botData.data[di+1] = fb3.data[di+1]; botData.data[di+2] = fb3.data[di+2]; botData.data[di+3] = 255;
                    }
                }
            }
            faces[3].ctx.putImageData(botData, 0, 0);

            // Face 4: +Z (Front face / Face: width w x height h)
            const fb4 = faces[4].ctx.getImageData(0, 0, w, h);
            const frontData = faces[4].ctx.createImageData(w, h);
            for (let cy = 0; cy < h; cy++) {
                for (let cx = 0; cx < w; cx++) {
                    const tx = (u + d) + cx;
                    const ty = (v + d) + cy;
                    const p = getPixel(tx, ty);
                    const di = (cy * w + cx) * 4;
                    if (p[3] > 10) {
                        frontData.data[di] = p[0]; frontData.data[di+1] = p[1]; frontData.data[di+2] = p[2]; frontData.data[di+3] = 255;
                    } else if (isOverlay) {
                        frontData.data[di] = 0; frontData.data[di+1] = 0; frontData.data[di+2] = 0; frontData.data[di+3] = 0;
                    } else {
                        frontData.data[di] = fb4.data[di]; frontData.data[di+1] = fb4.data[di+1]; frontData.data[di+2] = fb4.data[di+2]; frontData.data[di+3] = 255;
                    }
                }
            }
            faces[4].ctx.putImageData(frontData, 0, 0);

            // Face 5: -Z (Back of part: width w x height h)
            const fb5 = faces[5].ctx.getImageData(0, 0, w, h);
            const backData = faces[5].ctx.createImageData(w, h);
            for (let cy = 0; cy < h; cy++) {
                for (let cx = 0; cx < w; cx++) {
                    const tx = (u + d + w + d) + cx;
                    const ty = (v + d) + cy;
                    const p = getPixel(tx, ty);
                    const di = (cy * w + cx) * 4;
                    if (p[3] > 10) {
                        backData.data[di] = p[0]; backData.data[di+1] = p[1]; backData.data[di+2] = p[2]; backData.data[di+3] = 255;
                    } else if (isOverlay) {
                        backData.data[di] = 0; backData.data[di+1] = 0; backData.data[di+2] = 0; backData.data[di+3] = 0;
                    } else {
                        backData.data[di] = fb5.data[di]; backData.data[di+1] = fb5.data[di+1]; backData.data[di+2] = fb5.data[di+2]; backData.data[di+3] = 255;
                    }
                }
            }
            faces[5].ctx.putImageData(backData, 0, 0);
        }

        for (let i = 0; i < faces.length; i++) {
            textures[i].needsUpdate = true;
        }
    };

    if (skinPath) {
        const cached = _mobSkinCache[skinPath];
        if (cached instanceof HTMLImageElement && cached.complete && cached.naturalWidth > 0) {
            applySkinImage(cached);
        } else if (Array.isArray(cached)) {
            cached.push(applySkinImage);
        } else {
            const pending = [applySkinImage];
            _mobSkinCache[skinPath] = pending;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                _mobSkinCache[skinPath] = img;
                for (const cb of pending) cb(img);
            };
            img.onerror = () => {
                const cdnImg = new Image();
                cdnImg.crossOrigin = 'anonymous';
                cdnImg.onload = () => {
                    _mobSkinCache[skinPath] = cdnImg;
                    for (const cb of pending) cb(cdnImg);
                };
                cdnImg.onerror = () => {
                    _mobSkinCache[skinPath] = null;
                };
                cdnImg.src = _ENTITY_CDN_BASE + skinPath;
            };
            img.src = _ENTITY_LOCAL_BASE + skinPath;
        }
    }

    const emissive = options.emissive ? new THREE.Color(options.emissive) : new THREE.Color(0x000000);
    const emissiveIntensity = options.emissiveIntensity || 0;

    const isTransparent = options.transparent !== undefined ? options.transparent : isOverlay;
    const materials = textures.map(tex => new THREE.MeshLambertMaterial({
        map: tex,
        emissive,
        emissiveIntensity,
        transparent: isTransparent,
        alphaTest: isTransparent ? (options.alphaTest !== undefined ? options.alphaTest : 0.5) : 0,
        side: THREE.FrontSide
    }));

    _mobBoxMaterialCache[key] = materials;
    return materials;
}

/**
 * Creates an authentic 3D pixelated extruded mesh from a 16x16 item texture canvas
 * Generates front/back faces plus side edge quads with vertex colors matching the item pixels.
 */
export function createExtrudedItemMesh(sourceCanvas, scale = 0.5, thickness = 0.04) {
    const width = 16;
    const height = 16;
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;

    // Helper: is pixel solid
    const isSolid = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false;
        return d[(y * width + x) * 4 + 3] > 32; // Alpha threshold
    };

    const getPixelColor = (x, y) => {
        const i = (y * width + x) * 4;
        return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255];
    };

    const positions = [];
    const normals = [];
    const colors = [];

    const pixelW = scale / width;
    const pixelH = scale / height;
    const halfThick = thickness / 2;

    const addQuad = (p1, p2, p3, p4, norm, col) => {
        // Two triangles: p1, p2, p3 and p1, p3, p4
        positions.push(
            p1[0], p1[1], p1[2],
            p2[0], p2[1], p2[2],
            p3[0], p3[1], p3[2],
            p1[0], p1[1], p1[2],
            p3[0], p3[1], p3[2],
            p4[0], p4[1], p4[2]
        );
        for (let i = 0; i < 6; i++) {
            normals.push(norm[0], norm[1], norm[2]);
            colors.push(col[0], col[1], col[2]);
        }
    };

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!isSolid(x, y)) continue;

            const col = getPixelColor(x, y);
            const x0 = (x / width - 0.5) * scale;
            const x1 = x0 + pixelW;
            const y0 = ((height - 1 - y) / height - 0.5) * scale;
            const y1 = y0 + pixelH;

            // Front face (+Z)
            addQuad(
                [x0, y0, halfThick],
                [x1, y0, halfThick],
                [x1, y1, halfThick],
                [x0, y1, halfThick],
                [0, 0, 1],
                col
            );

            // Back face (-Z)
            addQuad(
                [x1, y0, -halfThick],
                [x0, y0, -halfThick],
                [x0, y1, -halfThick],
                [x1, y1, -halfThick],
                [0, 0, -1],
                [col[0] * 0.85, col[1] * 0.85, col[2] * 0.85] // Slight shading for back
            );

            // Left edge (-X) if adjacent is empty
            if (!isSolid(x - 1, y)) {
                addQuad(
                    [x0, y0, -halfThick],
                    [x0, y0, halfThick],
                    [x0, y1, halfThick],
                    [x0, y1, -halfThick],
                    [-1, 0, 0],
                    [col[0] * 0.75, col[1] * 0.75, col[2] * 0.75]
                );
            }

            // Right edge (+X) if adjacent is empty
            if (!isSolid(x + 1, y)) {
                addQuad(
                    [x1, y0, halfThick],
                    [x1, y0, -halfThick],
                    [x1, y1, -halfThick],
                    [x1, y1, halfThick],
                    [1, 0, 0],
                    [col[0] * 0.75, col[1] * 0.75, col[2] * 0.75]
                );
            }

            // Top edge (+Y) if adjacent above (y - 1) is empty
            if (!isSolid(x, y - 1)) {
                addQuad(
                    [x0, y1, halfThick],
                    [x1, y1, halfThick],
                    [x1, y1, -halfThick],
                    [x0, y1, -halfThick],
                    [0, 1, 0],
                    [col[0] * 0.9, col[1] * 0.9, col[2] * 0.9]
                );
            }

            // Bottom edge (-Y) if adjacent below (y + 1) is empty
            if (!isSolid(x, y + 1)) {
                addQuad(
                    [x0, y0, -halfThick],
                    [x1, y0, -halfThick],
                    [x1, y0, halfThick],
                    [x0, y0, halfThick],
                    [0, -1, 0],
                    [col[0] * 0.65, col[1] * 0.65, col[2] * 0.65]
                );
            }
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        side: THREE.FrontSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

// ============================================
// Dynamic 16x16 Compass & Clock Generators
// ============================================

export function drawDynamicCompassCanvas(angle = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Metallic circular casing
    ctx.fillStyle = '#20242c';
    ctx.fillRect(4, 1, 8, 1);
    ctx.fillRect(2, 2, 12, 1);
    ctx.fillRect(1, 4, 14, 8);
    ctx.fillRect(2, 13, 12, 1);
    ctx.fillRect(4, 14, 8, 1);

    // Bevel highlights & shadow
    ctx.fillStyle = '#7a8594';
    ctx.fillRect(4, 2, 8, 1);
    ctx.fillRect(2, 4, 1, 8);
    ctx.fillStyle = '#3a4452';
    ctx.fillRect(4, 13, 8, 1);
    ctx.fillRect(13, 4, 1, 8);

    // Dial background
    ctx.fillStyle = '#0f141a';
    ctx.fillRect(3, 3, 10, 10);

    // Rotating Needle
    ctx.save();
    ctx.translate(7.5, 7.5);
    ctx.rotate(angle);

    // North Needle (red) pointing upwards (-Y)
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(2, 0);
    ctx.lineTo(0, 1);
    ctx.lineTo(-2, 0);
    ctx.closePath();
    ctx.fill();

    // North Needle highlight
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 0);
    ctx.lineTo(-2, 0);
    ctx.closePath();
    ctx.fill();

    // South Needle (silver) pointing downwards (+Y)
    ctx.fillStyle = '#b0bec5';
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(2, 0);
    ctx.lineTo(0, -1);
    ctx.lineTo(-2, 0);
    ctx.closePath();
    ctx.fill();

    // Pivot center dot
    ctx.fillStyle = '#ffca28';
    ctx.fillRect(-1, -1, 2, 2);

    ctx.restore();
    return canvas;
}

export function drawDynamicClockCanvas(timeOfDay = 0.5) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Golden casing (outer frame)
    ctx.fillStyle = '#5c4300';
    ctx.fillRect(4, 1, 8, 1);
    ctx.fillRect(2, 2, 12, 1);
    ctx.fillRect(1, 4, 14, 8);
    ctx.fillRect(2, 13, 12, 1);
    ctx.fillRect(4, 14, 8, 1);

    // Gold highlights
    ctx.fillStyle = '#ffd54f';
    ctx.fillRect(4, 2, 8, 1);
    ctx.fillRect(2, 4, 1, 8);
    ctx.fillStyle = '#c48f00';
    ctx.fillRect(4, 13, 8, 1);
    ctx.fillRect(13, 4, 1, 8);

    // Lower decorative plate
    ctx.fillStyle = '#7a5a06';
    ctx.fillRect(3, 8, 10, 5);

    // Dial aperture window (semicircle window at center: x: 3..12, y: 3..8)
    ctx.save();
    ctx.beginPath();
    ctx.rect(3, 3, 10, 6);
    ctx.clip();

    // Rotating celestial disk
    // timeOfDay = 0.5 (noon) -> sun centered at top (-Y)
    // timeOfDay = 0.0 (midnight) -> moon centered at top (-Y)
    const angle = ((timeOfDay - 0.5 + 1.0) % 1.0) * Math.PI * 2;
    ctx.translate(7.5, 9.0);
    ctx.rotate(angle);

    // Disk background: top half sky blue, bottom half night navy
    ctx.fillStyle = '#42a5f5'; // day sky
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, -Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#0a1024'; // night sky
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI);
    ctx.fill();

    // Sun at top (noon position)
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(-2, -6, 4, 4);
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(-1, -7, 2, 1);
    ctx.fillRect(-1, -2, 2, 1);

    // Moon at bottom (midnight position)
    ctx.fillStyle = '#eceff1';
    ctx.fillRect(-2, 3, 4, 4);
    ctx.fillStyle = '#90a4ae';
    ctx.fillRect(-1, 3, 1, 3);

    // Stars around moon
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, 4, 1, 1);
    ctx.fillRect(4, 5, 1, 1);

    ctx.restore();

    // Horizon bar
    ctx.fillStyle = '#3e2e04';
    ctx.fillRect(3, 9, 10, 1);

    return canvas;
}




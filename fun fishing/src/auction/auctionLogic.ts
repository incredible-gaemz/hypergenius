// ============================================================
// Auction Collector Game — Core Logic Layer
// ============================================================

// ----------------------------------------------------------
// 1. TYPES & INTERFACES
// ----------------------------------------------------------

export type ItemCategory =
  | 'furniture'
  | 'electronics'
  | 'art'
  | 'jewelry'
  | 'books'
  | 'toys'
  | 'tools'
  | 'kitchenware'
  | 'clothing'
  | 'oddities'
  | 'sports'
  | 'music';

export type ItemCondition = 'junk' | 'dusty' | 'fair' | 'good' | 'pristine';

export type ItemTier = 'common' | 'uncommon' | 'rare' | 'vintage' | 'antique';

export type ShopId =
  | 'thrift'
  | 'flea'
  | 'pawn'
  | 'estate'
  | 'antique_mall'
  | 'storage';

export type AuctionTheme =
  | 'general'
  | 'fine_art'
  | 'vintage_tech'
  | 'home_estate'
  | 'curiosities'
  | 'luxury'
  | 'collectors_night';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  tier: ItemTier;
  baseValue: number;
  description: string;
  setId?: string;
  restorable: boolean;
  restoreCost: number;
  spriteHint: string;
  canHaveMakerMark?: boolean;
}

export interface OwnedItem {
  uid: string;
  itemId: string;
  condition: ItemCondition;
  boughtFor: number;
  boughtAt: number;
  restored: boolean;
  makerMark?: 'unverified' | 'authentic' | 'counterfeit';
}

export interface ShopDef {
  id: ShopId;
  name: string;
  description: string;
  unlockCost: number;
  tierRange: ItemTier[];
  markupRange: [number, number];
  inventorySize: number;
  refreshIntervalMs: number;
}

export interface ShopItem {
  item: ItemDef;
  condition: ItemCondition;
  price: number;
  uid: string;
  makerMark?: 'unverified' | 'authentic' | 'counterfeit';
}

export interface HouseAuctionLot {
  uid: string;
  itemId: string;
  condition: ItemCondition;
  makerMark?: 'unverified' | 'authentic' | 'counterfeit';
  startingBid: number;
  currentBid: number;
  highestBidder: 'house' | 'player' | string;
  bidCount: number;
  status: 'active' | 'sold_to_player' | 'sold_to_rival' | 'passed';
}

export interface AuctionEvent {
  id: string;
  theme: AuctionTheme;
  themeName: string;
  startsAt: number;
  durationMs: number;
  categoryBonuses: Partial<Record<ItemCategory, number>>;
  fee: number;
  houseLots?: HouseAuctionLot[];
}

export interface AuctionListing {
  uid: string;
  itemUid: string;
  auctionId: string;
  startingBid: number;
  currentBid: number;
  finalPrice: number;
  status: 'active' | 'sold' | 'unsold';
  bidCount: number;
  listedAt: number;
  condition?: ItemCondition;
  makerMark?: 'unverified' | 'authentic' | 'counterfeit';
}

export interface SetDef {
  id: string;
  name: string;
  itemIds: string[];
  bonusMultiplier: number;
  description: string;
}

export interface NewsBulletin {
  id: string;
  headline: string;
  affectedCategories: ItemCategory[];
  demandMultiplier: number;
  expiresAt: number;
}

export interface SupplyItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  applicableConditions: ItemCondition[];
  resultCondition: ItemCondition;
}

// ----------------------------------------------------------
// 2. DATA CONSTANTS
// ----------------------------------------------------------

// --- Seeded random helpers (pure, deterministic when needed) ---

let _seed = Date.now();

function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed & 0x7fffffff) / 0x7fffffff;
}

/** Unseeded random float in [min, max) */
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Random integer in [min, max] inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick random element from array */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Shuffle array (Fisher-Yates), returns new array */
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// --- ITEM CATALOG (60+ items) ---

export const ITEM_CATALOG: readonly ItemDef[] = [
  // ===== FURNITURE =====
  { id: 'wood_stool', name: 'Wooden Stool', category: 'furniture', tier: 'common', baseValue: 18, description: 'Three-legged pine stool with chipped paint.', restorable: true, restoreCost: 3, spriteHint: 'wooden stool' },
  { id: 'folding_chair', name: 'Folding Chair', category: 'furniture', tier: 'common', baseValue: 15, description: 'Metal folding chair. Still folds.', restorable: true, restoreCost: 3, spriteHint: 'metal folding chair' },
  { id: 'end_table', name: 'End Table', category: 'furniture', tier: 'uncommon', baseValue: 45, description: 'Oak end table with a drawer that sticks.', restorable: true, restoreCost: 8, spriteHint: 'oak end table' },
  { id: 'rocking_chair', name: 'Rocking Chair', category: 'furniture', tier: 'uncommon', baseValue: 85, description: 'Creaky rocking chair. Great patina.', restorable: true, restoreCost: 14, spriteHint: 'rocking chair' },
  { id: 'roll_top_desk', name: 'Roll-Top Desk', category: 'furniture', tier: 'rare', baseValue: 350, description: 'Solid walnut roll-top desk, circa 1920s.', setId: 'brass_desk_set', restorable: true, restoreCost: 45, spriteHint: 'roll top desk' },
  { id: 'chaise_lounge', name: 'Chaise Lounge', category: 'furniture', tier: 'vintage', baseValue: 450, description: 'Victorian-style chaise with velvet upholstery.', restorable: true, restoreCost: 65, spriteHint: 'velvet chaise lounge' },
  { id: 'grandfather_clock', name: 'Grandfather Clock', category: 'furniture', tier: 'antique', baseValue: 950, description: 'Tall case clock with Westminster chime. Needs servicing.', restorable: true, restoreCost: 120, spriteHint: 'grandfather clock' },

  // ===== ELECTRONICS =====
  { id: 'am_radio', name: 'AM Radio', category: 'electronics', tier: 'common', baseValue: 22, description: 'Plastic AM radio. Picks up two stations.', restorable: true, restoreCost: 4, spriteHint: 'am radio' },
  { id: 'cassette_player', name: 'Cassette Player', category: 'electronics', tier: 'common', baseValue: 30, description: 'Portable cassette player with foam headphones.', restorable: true, restoreCost: 5, spriteHint: 'cassette player' },
  { id: 'rotary_phone', name: 'Rotary Phone', category: 'electronics', tier: 'uncommon', baseValue: 65, description: 'Heavy black rotary phone. Satisfying dial.', setId: 'retro_office', restorable: true, restoreCost: 10, spriteHint: 'rotary phone' },
  { id: 'tube_tv', name: 'Tube TV', category: 'electronics', tier: 'uncommon', baseValue: 50, description: 'Small CRT television. Surprisingly heavy.', restorable: true, restoreCost: 10, spriteHint: 'crt television' },
  { id: 'polaroid_camera', name: 'Polaroid Camera', category: 'electronics', tier: 'rare', baseValue: 85, description: 'Polaroid OneStep. Film not included.', restorable: true, restoreCost: 15, spriteHint: 'polaroid camera' },
  { id: 'nixie_clock', name: 'Nixie Tube Clock', category: 'electronics', tier: 'vintage', baseValue: 260, description: 'Handmade clock with orange nixie tube display.', restorable: true, restoreCost: 45, spriteHint: 'nixie tube clock' },
  { id: 'telegraph_key', name: 'Telegraph Key', category: 'electronics', tier: 'antique', baseValue: 420, description: 'Brass telegraph key on mahogany base. Civil War era.', restorable: true, restoreCost: 60, spriteHint: 'brass telegraph key' },

  // ===== ART =====
  { id: 'paint_by_numbers', name: 'Paint-by-Numbers', category: 'art', tier: 'common', baseValue: 15, description: 'Completed mountain scene. Decent brushwork.', restorable: false, restoreCost: 0, spriteHint: 'paint by numbers' },
  { id: 'velvet_elvis', name: 'Velvet Elvis', category: 'art', tier: 'common', baseValue: 35, description: 'Black velvet Elvis portrait. A classic.', restorable: false, restoreCost: 0, spriteHint: 'velvet elvis painting' },
  { id: 'oil_landscape', name: 'Oil Landscape', category: 'art', tier: 'uncommon', baseValue: 75, description: 'Small oil painting of a countryside barn.', restorable: true, restoreCost: 12, spriteHint: 'oil landscape painting' },
  { id: 'bronze_bust', name: 'Bronze Bust', category: 'art', tier: 'rare', baseValue: 180, description: 'Small bronze bust. Unknown subject.', restorable: true, restoreCost: 24, spriteHint: 'bronze bust' },
  { id: 'art_deco_print', name: 'Art Deco Print', category: 'art', tier: 'rare', baseValue: 140, description: 'Framed 1930s advertising print in great colors.', restorable: true, restoreCost: 18, spriteHint: 'art deco poster' },
  { id: 'tiffany_lamp', name: 'Tiffany-Style Lamp', category: 'art', tier: 'vintage', baseValue: 420, description: 'Stained glass dragonfly lamp. Possibly reproduction.', restorable: true, restoreCost: 55, spriteHint: 'tiffany lamp' },
  { id: 'impressionist_oil', name: 'Impressionist Oil', category: 'art', tier: 'antique', baseValue: 950, description: 'Unsigned impressionist oil on canvas, gilt frame.', restorable: true, restoreCost: 100, spriteHint: 'impressionist painting' },

  // ===== JEWELRY =====
  { id: 'costume_brooch', name: 'Costume Brooch', category: 'jewelry', tier: 'common', baseValue: 25, description: 'Rhinestone brooch. Sparkles under fluorescent lights.', restorable: true, restoreCost: 4, spriteHint: 'rhinestone brooch' },
  { id: 'pearl_necklace', name: 'Faux Pearl Necklace', category: 'jewelry', tier: 'uncommon', baseValue: 45, description: 'Strand of faux pearls with a brass clasp.', restorable: true, restoreCost: 8, spriteHint: 'pearl necklace' },
  { id: 'silver_ring', name: 'Sterling Ring', category: 'jewelry', tier: 'uncommon', baseValue: 65, description: 'Sterling silver band with a turquoise stone.', setId: 'silver_collection', restorable: true, restoreCost: 10, spriteHint: 'silver turquoise ring' },
  { id: 'jade_pendant', name: 'Jade Pendant', category: 'jewelry', tier: 'rare', baseValue: 110, description: 'Carved jade pendant on a silk cord.', restorable: true, restoreCost: 15, spriteHint: 'jade pendant' },
  { id: 'silver_locket', name: 'Silver Locket', category: 'jewelry', tier: 'rare', baseValue: 85, description: 'Engraved silver locket. Photo inside is long faded.', setId: 'silver_collection', restorable: true, restoreCost: 12, spriteHint: 'silver locket' },
  { id: 'art_deco_watch', name: 'Art Deco Watch', category: 'jewelry', tier: 'vintage', baseValue: 320, description: 'Gold-plated wristwatch with geometric dial.', restorable: true, restoreCost: 55, spriteHint: 'art deco wristwatch' },
  { id: 'cameo_brooch', name: 'Cameo Brooch', category: 'jewelry', tier: 'antique', baseValue: 480, description: 'Hand-carved shell cameo in gold setting.', restorable: true, restoreCost: 60, spriteHint: 'cameo brooch' },

  // ===== BOOKS =====
  { id: 'paperback_mystery', name: 'Paperback Mystery', category: 'books', tier: 'common', baseValue: 8, description: 'Dog-eared detective novel. Coffee stain on page 42.', restorable: false, restoreCost: 0, spriteHint: 'paperback book' },
  { id: 'cookbook_1960', name: '1960s Cookbook', category: 'books', tier: 'common', baseValue: 18, description: 'Betty Crocker knockoff with jello mold recipes.', restorable: false, restoreCost: 0, spriteHint: 'vintage cookbook' },
  { id: 'atlas_1950', name: '1950s World Atlas', category: 'books', tier: 'uncommon', baseValue: 45, description: 'World atlas with countries that no longer exist.', restorable: true, restoreCost: 8, spriteHint: 'world atlas' },
  { id: 'first_edition_sci_fi', name: 'First Edition Sci-Fi', category: 'books', tier: 'rare', baseValue: 135, description: 'First printing of a classic sci-fi novel. Minor foxing.', restorable: true, restoreCost: 20, spriteHint: 'first edition book' },
  { id: 'illuminated_page', name: 'Illuminated Page', category: 'books', tier: 'vintage', baseValue: 260, description: 'Single leaf from a medieval manuscript. Genuine gold leaf.', restorable: true, restoreCost: 35, spriteHint: 'illuminated manuscript page' },
  { id: 'incunabulum', name: 'Incunabulum Fragment', category: 'books', tier: 'antique', baseValue: 750, description: 'Pages from a book printed before 1501. Remarkable condition.', restorable: true, restoreCost: 80, spriteHint: 'ancient printed pages' },

  // ===== TOYS =====
  { id: 'rubber_duck', name: 'Rubber Duck', category: 'toys', tier: 'common', baseValue: 6, description: 'Yellow rubber duck. Squeaks when you squeeze it.', restorable: false, restoreCost: 0, spriteHint: 'rubber duck' },
  { id: 'rubber_duck_collection', name: 'Rubber Duck Collection', category: 'oddities', tier: 'uncommon', baseValue: 40, description: 'Box of 30 rubber ducks in various outfits.', restorable: false, restoreCost: 0, spriteHint: 'box of rubber ducks' },
  { id: 'tin_robot', name: 'Tin Robot', category: 'toys', tier: 'rare', baseValue: 110, description: 'Wind-up tin robot. Sparks fly from its chest.', setId: 'vintage_toys', restorable: true, restoreCost: 15, spriteHint: 'tin wind up robot' },
  { id: 'model_train_car', name: 'Model Train Car', category: 'toys', tier: 'rare', baseValue: 65, description: 'HO scale boxcar in original paint.', setId: 'model_train_set', restorable: true, restoreCost: 10, spriteHint: 'model train boxcar' },
  { id: 'model_train_engine', name: 'Model Train Engine', category: 'toys', tier: 'rare', baseValue: 110, description: 'HO scale steam locomotive. Runs on the tracks.', setId: 'model_train_set', restorable: true, restoreCost: 18, spriteHint: 'model train engine' },
  { id: 'model_train_caboose', name: 'Model Train Caboose', category: 'toys', tier: 'rare', baseValue: 60, description: 'HO scale red caboose. Tiny lantern on top.', setId: 'model_train_set', restorable: true, restoreCost: 10, spriteHint: 'model train caboose' },
  { id: 'porcelain_doll', name: 'Porcelain Doll', category: 'toys', tier: 'vintage', baseValue: 180, description: 'Hand-painted porcelain doll in silk dress.', restorable: true, restoreCost: 30, spriteHint: 'porcelain doll' },
  { id: 'cast_iron_bank', name: 'Cast Iron Bank', category: 'toys', tier: 'antique', baseValue: 420, description: 'Mechanical coin bank. Dog jumps through hoop.', setId: 'vintage_toys', restorable: true, restoreCost: 55, spriteHint: 'cast iron mechanical bank' },

  // ===== TOOLS =====
  { id: 'hand_plane', name: 'Hand Plane', category: 'tools', tier: 'uncommon', baseValue: 35, description: 'Stanley No. 4 bench plane. Blade needs sharpening.', restorable: true, restoreCost: 6, spriteHint: 'hand plane' },
  { id: 'brace_drill', name: 'Brace Drill', category: 'tools', tier: 'uncommon', baseValue: 30, description: 'Hand-crank brace drill with three bits.', restorable: true, restoreCost: 6, spriteHint: 'brace drill' },
  { id: 'anvil_small', name: 'Small Anvil', category: 'tools', tier: 'rare', baseValue: 110, description: 'Jeweler\'s anvil. Surprisingly heavy for its size.', restorable: true, restoreCost: 15, spriteHint: 'small anvil' },
  { id: 'surveyor_transit', name: 'Surveyor Transit', category: 'tools', tier: 'vintage', baseValue: 260, description: 'Brass surveyor\'s transit in wooden case.', restorable: true, restoreCost: 40, spriteHint: 'brass surveyor transit' },

  // ===== KITCHENWARE =====
  { id: 'mason_jars', name: 'Mason Jars (lot)', category: 'kitchenware', tier: 'common', baseValue: 15, description: 'Box of mixed mason jars. Some with zinc lids.', restorable: false, restoreCost: 0, spriteHint: 'mason jars' },
  { id: 'cast_iron_skillet', name: 'Cast Iron Skillet', category: 'kitchenware', tier: 'uncommon', baseValue: 35, description: 'Well-seasoned cast iron skillet. Black as night.', restorable: true, restoreCost: 5, spriteHint: 'cast iron skillet' },
  { id: 'copper_kettle', name: 'Copper Kettle', category: 'kitchenware', tier: 'uncommon', baseValue: 55, description: 'Hammered copper kettle with wooden handle.', restorable: true, restoreCost: 8, spriteHint: 'copper kettle' },
  { id: 'fiesta_pitcher', name: 'Fiesta Pitcher', category: 'kitchenware', tier: 'rare', baseValue: 75, description: 'Vintage Fiesta disc pitcher in cobalt blue.', restorable: true, restoreCost: 10, spriteHint: 'fiesta pitcher' },
  { id: 'silver_tea_set', name: 'Silver Tea Set', category: 'kitchenware', tier: 'vintage', baseValue: 340, description: 'Five-piece silver-plated tea service. Needs polish.', restorable: true, restoreCost: 40, spriteHint: 'silver tea set' },

  // ===== CLOTHING =====
  { id: 'denim_jacket', name: 'Denim Jacket', category: 'clothing', tier: 'common', baseValue: 28, description: 'Faded denim jacket with band patches.', restorable: false, restoreCost: 0, spriteHint: 'denim jacket' },
  { id: 'fur_stole', name: 'Fur Stole', category: 'clothing', tier: 'uncommon', baseValue: 85, description: 'Mink stole. Slightly moth-eaten.', restorable: true, restoreCost: 15, spriteHint: 'fur stole' },
  { id: 'leather_boots', name: 'Cowboy Boots', category: 'clothing', tier: 'uncommon', baseValue: 65, description: 'Tooled leather cowboy boots. Broken in just right.', restorable: true, restoreCost: 10, spriteHint: 'cowboy boots' },
  { id: 'silk_kimono', name: 'Silk Kimono', category: 'clothing', tier: 'rare', baseValue: 160, description: 'Hand-embroidered silk kimono with crane motif.', restorable: true, restoreCost: 25, spriteHint: 'silk kimono' },
  { id: 'top_hat', name: 'Victorian Top Hat', category: 'clothing', tier: 'vintage', baseValue: 210, description: 'Beaver felt top hat in original box.', restorable: true, restoreCost: 30, spriteHint: 'victorian top hat' },

  // ===== ODDITIES =====
  { id: 'taxidermy_squirrel', name: 'Taxidermy Squirrel', category: 'oddities', tier: 'rare', baseValue: 185, description: 'Vintage mounted squirrel holding an acorn on a walnut plinth. Glass eyes.', restorable: true, restoreCost: 20, spriteHint: 'taxidermy squirrel' },
  { id: 'haunted_music_box', name: 'Haunted Music Box', category: 'oddities', tier: 'uncommon', baseValue: 120, description: 'Plays by itself at 3 AM. Or so the seller claims.', restorable: true, restoreCost: 15, spriteHint: 'music box' },
  { id: 'glass_eye_lot', name: 'Glass Eye Lot', category: 'oddities', tier: 'uncommon', baseValue: 95, description: 'Velvet pouch containing six vintage glass eyes.', restorable: false, restoreCost: 0, spriteHint: 'glass eyes in pouch' },
  { id: 'cabinet_of_curiosities', name: 'Cabinet of Curiosities', category: 'oddities', tier: 'vintage', baseValue: 380, description: 'Small display case of minerals, shells, and bones.', restorable: true, restoreCost: 45, spriteHint: 'curiosity cabinet' },
  { id: 'human_skull_replica', name: 'Anatomical Skull', category: 'oddities', tier: 'antique', baseValue: 520, description: 'Medical teaching skull, articulated jaw. Circa 1890.', restorable: true, restoreCost: 50, spriteHint: 'anatomical skull' },

  // ===== SPORTS =====
  { id: 'baseball_glove', name: 'Leather Glove', category: 'sports', tier: 'common', baseValue: 22, description: 'Broken-in leather baseball glove.', restorable: true, restoreCost: 4, spriteHint: 'baseball glove' },
  { id: 'wooden_tennis', name: 'Wooden Racket', category: 'sports', tier: 'uncommon', baseValue: 35, description: 'Wooden tennis racket with a leather grip.', restorable: true, restoreCost: 6, spriteHint: 'wooden tennis racket' },
  { id: 'boxing_gloves', name: 'Vintage Boxing Gloves', category: 'sports', tier: 'rare', baseValue: 95, description: 'Lace-up leather boxing gloves. Well worn.', restorable: true, restoreCost: 15, spriteHint: 'vintage boxing gloves' },
  { id: 'signed_baseball', name: 'Signed Baseball', category: 'sports', tier: 'vintage', baseValue: 240, description: 'Autographed ball in acrylic case. Signature faded.', restorable: false, restoreCost: 0, spriteHint: 'signed baseball' },

  // ===== MUSIC =====
  { id: 'harmonica', name: 'Harmonica', category: 'music', tier: 'common', baseValue: 18, description: 'Hohner Marine Band harmonica. Key of C.', restorable: true, restoreCost: 3, spriteHint: 'harmonica' },
  { id: 'ukulele', name: 'Ukulele', category: 'music', tier: 'uncommon', baseValue: 45, description: 'Soprano ukulele. Missing one string.', restorable: true, restoreCost: 8, spriteHint: 'ukulele' },
  { id: 'metronome', name: 'Metronome', category: 'music', tier: 'uncommon', baseValue: 40, description: 'Wooden pyramid metronome. Still keeps time.', setId: 'retro_office', restorable: true, restoreCost: 6, spriteHint: 'wooden metronome' },
  { id: 'trumpet', name: 'Brass Trumpet', category: 'music', tier: 'rare', baseValue: 140, description: 'Dented brass trumpet. Plays flat.', restorable: true, restoreCost: 22, spriteHint: 'brass trumpet' },
  { id: 'violin', name: 'Old Violin', category: 'music', tier: 'vintage', baseValue: 420, description: 'Unmarked violin in battered case. Sweet tone.', restorable: true, restoreCost: 60, spriteHint: 'old violin' },
  { id: 'phonograph', name: 'Phonograph', category: 'music', tier: 'antique', baseValue: 780, description: 'Edison cylinder phonograph with brass horn.', restorable: true, restoreCost: 95, spriteHint: 'edison phonograph' },

  // ===== SET PIECES (brass desk set) =====
  { id: 'brass_lamp', name: 'Brass Desk Lamp', category: 'furniture', tier: 'rare', baseValue: 85, description: 'Adjustable brass desk lamp with green glass shade.', setId: 'brass_desk_set', restorable: true, restoreCost: 14, spriteHint: 'brass desk lamp' },
  { id: 'brass_compass', name: 'Brass Compass', category: 'tools', tier: 'uncommon', baseValue: 45, description: 'Heavy brass compass in a wooden box.', setId: 'brass_desk_set', restorable: true, restoreCost: 8, spriteHint: 'brass compass' },
  { id: 'brass_letter_opener', name: 'Brass Letter Opener', category: 'tools', tier: 'common', baseValue: 20, description: 'Art nouveau letter opener with floral handle.', setId: 'brass_desk_set', restorable: true, restoreCost: 3, spriteHint: 'brass letter opener' },

  // ===== SET PIECES (silver collection) =====
  { id: 'silver_spoon', name: 'Silver Spoon', category: 'kitchenware', tier: 'uncommon', baseValue: 35, description: 'Ornate sterling silver serving spoon.', setId: 'silver_collection', restorable: true, restoreCost: 5, spriteHint: 'silver spoon' },
  { id: 'silver_frame', name: 'Silver Frame', category: 'art', tier: 'uncommon', baseValue: 50, description: 'Sterling picture frame, slightly tarnished.', setId: 'silver_collection', restorable: true, restoreCost: 8, spriteHint: 'silver picture frame' },

  // ===== SET PIECES (retro office) =====
  { id: 'typewriter', name: 'Typewriter', category: 'electronics', tier: 'rare', baseValue: 120, description: 'Royal Quiet Deluxe typewriter. Needs new ribbon.', setId: 'retro_office', restorable: true, restoreCost: 20, spriteHint: 'vintage typewriter' },

  // ===== SET PIECES (vintage toys) =====
  { id: 'tin_car', name: 'Tin Friction Car', category: 'toys', tier: 'uncommon', baseValue: 55, description: 'Japanese tin friction car, 1950s. Minor scratches.', setId: 'vintage_toys', restorable: true, restoreCost: 8, spriteHint: 'tin friction car' },
  { id: 'jack_in_box', name: 'Jack-in-the-Box', category: 'toys', tier: 'uncommon', baseValue: 40, description: 'Hand-cranked jack-in-the-box. Still startling.', setId: 'vintage_toys', restorable: true, restoreCost: 6, spriteHint: 'jack in the box' },

  // ===== INCOMPLETE PIECES & MATCHING PARTS =====
  { id: 'gramophone_incomplete', name: 'Gramophone (Missing Horn)', category: 'music', tier: 'vintage', baseValue: 75, description: 'Victor talking machine cabinet with turntable. Missing horn.', restorable: true, restoreCost: 20, spriteHint: 'incomplete gramophone' },
  { id: 'gramophone_horn', name: 'Embossed Brass Horn', category: 'tools', tier: 'rare', baseValue: 60, description: 'Morning glory flared brass horn for a talking machine.', restorable: true, restoreCost: 10, spriteHint: 'brass gramophone horn' },
  { id: 'gramophone_complete', name: 'Victor Talking Machine', category: 'music', tier: 'vintage', baseValue: 380, description: 'Complete vintage phonograph with flared brass horn.', restorable: true, restoreCost: 30, spriteHint: 'complete gramophone' },

  { id: 'clock_incomplete', name: 'Mantel Clock (Missing Pendulum)', category: 'furniture', tier: 'uncommon', baseValue: 45, description: 'Carved oak mantel clock. Movement intact but needs pendulum.', restorable: true, restoreCost: 12, spriteHint: 'incomplete clock' },
  { id: 'clock_pendulum', name: 'Ornate Brass Pendulum', category: 'tools', tier: 'common', baseValue: 30, description: 'Cast brass pendulum bob with floral relief.', restorable: true, restoreCost: 5, spriteHint: 'brass pendulum' },
  { id: 'clock_complete', name: 'Regulator Mantel Clock', category: 'furniture', tier: 'rare', baseValue: 260, description: 'Working 8-day mechanical clock with balanced brass pendulum.', restorable: true, restoreCost: 25, spriteHint: 'complete mantel clock' },

  { id: 'lamp_incomplete', name: 'Oil Lamp Base (Missing Chimney)', category: 'furniture', tier: 'common', baseValue: 22, description: 'Cast iron and glass oil font base. Needs glass chimney.', restorable: true, restoreCost: 4, spriteHint: 'oil lamp base' },
  { id: 'glass_chimney', name: 'Fluted Glass Chimney', category: 'kitchenware', tier: 'common', baseValue: 18, description: 'Clear vintage blown-glass lamp chimney.', restorable: false, restoreCost: 0, spriteHint: 'glass chimney' },
  { id: 'lamp_complete', name: 'Hurricane Oil Lamp', category: 'furniture', tier: 'uncommon', baseValue: 120, description: 'Classic hurricane kerosene lamp with glass shade.', restorable: true, restoreCost: 15, spriteHint: 'complete hurricane lamp' },

  { id: 'camera_incomplete', name: 'SLR Camera Body (Missing Lens)', category: 'electronics', tier: 'rare', baseValue: 65, description: 'All-metal manual 35mm SLR body. Bayonet lens mount open.', restorable: true, restoreCost: 15, spriteHint: 'camera body without lens' },
  { id: 'camera_lens', name: '50mm F/1.8 Prime Lens', category: 'electronics', tier: 'rare', baseValue: 55, description: 'Coated optical glass lens with manual aperture ring.', restorable: true, restoreCost: 10, spriteHint: 'camera lens' },
  { id: 'camera_complete', name: '35mm SLR Camera Kit', category: 'electronics', tier: 'vintage', baseValue: 320, description: 'Professional mechanical 35mm camera with 50mm f/1.8 lens.', restorable: true, restoreCost: 35, spriteHint: 'complete slr camera' },

  { id: 'watch_incomplete', name: 'Gold Pocket Watch (Missing Hands)', category: 'jewelry', tier: 'rare', baseValue: 75, description: '14k gold-filled pocket watch case and movement without hands.', restorable: true, restoreCost: 18, spriteHint: 'pocket watch without hands' },
  { id: 'watch_hand', name: 'Blued Steel Watch Hands', category: 'tools', tier: 'uncommon', baseValue: 35, description: 'Set of spade-style blued steel watch hands.', restorable: false, restoreCost: 0, spriteHint: 'watch hands' },
  { id: 'watch_complete', name: 'Waltham Gold Pocket Watch', category: 'jewelry', tier: 'vintage', baseValue: 420, description: 'Working pocket watch with blued steel hands and clean movement.', restorable: true, restoreCost: 40, spriteHint: 'complete pocket watch' },

  // ===== RETRO VINTAGE (1950s - 1990s COLLECTIBLES) =====
  { id: 'boombox_1980', name: 'Dual-Cassette Boombox', category: 'electronics', tier: 'uncommon', baseValue: 120, description: '1980s portable stereo with dual tape decks and chrome speaker grilles.', restorable: true, restoreCost: 15, spriteHint: '1980s boombox' },
  { id: 'retro_handheld', name: 'Atomic Game Handheld', category: 'toys', tier: 'uncommon', baseValue: 95, description: '1990s 8-bit portable console with translucent purple casing.', restorable: true, restoreCost: 12, spriteHint: 'translucent game handheld' },
  { id: 'lava_lamp', name: 'Rocket Lava Lamp', category: 'furniture', tier: 'common', baseValue: 35, description: '1970s brushed aluminum rocket base with slow-flowing orange wax.', restorable: true, restoreCost: 6, spriteHint: 'lava lamp' },
  { id: 'film_projector', name: '8mm Film Projector', category: 'electronics', tier: 'rare', baseValue: 160, description: 'Bell & Howell dual-spool mechanical movie projector in cast aluminum.', restorable: true, restoreCost: 25, spriteHint: '8mm film projector' },
  { id: 'walkman_cassette', name: 'Sports Cassette Player', category: 'electronics', tier: 'uncommon', baseValue: 75, description: 'Bright yellow water-resistant personal cassette player with belt clip.', restorable: true, restoreCost: 10, spriteHint: 'yellow sports walkman' },
  { id: 'sunburst_clock', name: 'Atomic Sunburst Clock', category: 'furniture', tier: 'rare', baseValue: 140, description: 'Mid-century modern brass and teak wood rayed starburst wall clock.', restorable: true, restoreCost: 20, spriteHint: 'atomic sunburst clock' },
  { id: 'vintage_skateboard', name: '1980s Skateboard Deck', category: 'sports', tier: 'rare', baseValue: 120, description: 'Wide fishtail 7-ply maple deck with neon retro skull graphic.', restorable: true, restoreCost: 15, spriteHint: '1980s skateboard deck' },
  { id: 'databank_watch', name: 'Calculator Wristwatch', category: 'jewelry', tier: 'common', baseValue: 40, description: 'Digital wrist watch with micro keypad and 8-digit LCD screen.', restorable: true, restoreCost: 6, spriteHint: 'calculator watch' },
  { id: 'fondue_set', name: 'Enamel Fondue Pot', category: 'kitchenware', tier: 'common', baseValue: 35, description: '1970s avocado-green porcelain enamel fondue pot on wrought iron burner stand.', restorable: true, restoreCost: 5, spriteHint: 'vintage fondue set' },
  { id: 'electric_guitar', name: 'Sunburst Electric Guitar', category: 'music', tier: 'rare', baseValue: 240, description: 'Three-tone sunburst solid body guitar with natural finish checking in tweed case.', restorable: true, restoreCost: 35, spriteHint: 'sunburst electric guitar' },
  { id: 'analog_synth', name: 'Analog Synthesizer', category: 'music', tier: 'vintage', baseValue: 310, description: 'Monophonic mini synthesizer with tactile pitch slider and filter resonance knobs.', restorable: true, restoreCost: 45, spriteHint: 'analog synthesizer keyboard' },
  { id: 'record_player', name: 'Wood Plinth Turntable', category: 'electronics', tier: 'rare', baseValue: 160, description: 'Audiophile belt-drive vinyl player on oiled walnut plinth with tinted dust cover.', restorable: true, restoreCost: 25, spriteHint: 'vinyl record player' },
  { id: 'atomic_fan', name: 'Cast Metal Desk Fan', category: 'furniture', tier: 'uncommon', baseValue: 60, description: 'Heavy cast-iron art deco oscillating fan with thick wire cage and aluminum blades.', restorable: true, restoreCost: 12, spriteHint: 'vintage metal desk fan' },
  { id: 'moka_pot', name: 'Stovetop Moka Pot', category: 'kitchenware', tier: 'common', baseValue: 28, description: 'Classic Italian octagonal aluminum espresso maker with bakelite handle.', restorable: true, restoreCost: 4, spriteHint: 'aluminum moka pot' },
  { id: 'cb_radio', name: '40-Channel CB Radio', category: 'electronics', tier: 'uncommon', baseValue: 55, description: 'Chrome mobile CB transceiver with needle signal meter and coiled microphone.', restorable: true, restoreCost: 10, spriteHint: 'vintage cb radio' },
  { id: 'metal_lunchbox', name: 'Space Explorer Lunchbox', category: 'toys', tier: 'uncommon', baseValue: 50, description: 'Embossed tin-plated lithograph lunchbox with matching glass-lined thermos.', restorable: true, restoreCost: 8, spriteHint: 'embossed metal lunchbox' },
  { id: 'viewmaster', name: '3D View-Master Viewer', category: 'toys', tier: 'common', baseValue: 22, description: 'Bright red plastic stereoscopic reel viewer with side advance lever.', restorable: false, restoreCost: 0, spriteHint: 'red view master' },
  { id: 'ship_bell', name: 'Cast Brass Ship Bell', category: 'oddities', tier: 'rare', baseValue: 160, description: 'Heavy cast naval bell with engraved anchor and braided cotton lanyard.', restorable: true, restoreCost: 20, spriteHint: 'brass ship bell' },
  { id: 'desk_intercom', name: 'Bakelite Office Intercom', category: 'electronics', tier: 'uncommon', baseValue: 48, description: 'Desk master intercom station with five spring-loaded talk/listen selector switches.', restorable: true, restoreCost: 10, spriteHint: 'vintage desk intercom' },
  { id: 'vintage_lighter', name: 'Engraved Petrol Lighter', category: 'tools', tier: 'common', baseValue: 35, description: 'Windproof brass flip-top lighter with etched crest and satisfying click.', restorable: true, restoreCost: 5, spriteHint: 'brass petrol lighter' },
  { id: 'leather_jacket', name: 'Biker Leather Jacket', category: 'clothing', tier: 'rare', baseValue: 175, description: 'Heavyweight black steerhide motorcycle jacket with asymmetrical brass zippers.', restorable: true, restoreCost: 25, spriteHint: 'vintage leather motorcycle jacket' },
  { id: 'neon_bar_sign', name: 'Neon Diner Sign', category: 'oddities', tier: 'vintage', baseValue: 340, description: 'Hand-blown red and turquoise glass neon sign mounted on a black metal grid frame.', restorable: true, restoreCost: 45, spriteHint: 'vintage neon sign' },
  { id: 'transit_compass', name: 'Brunton Pocket Transit', category: 'tools', tier: 'vintage', baseValue: 195, description: 'Professional geological sighting compass and clinometer in fitted leather pouch.', restorable: true, restoreCost: 30, spriteHint: 'brunton pocket transit' },
  { id: 'antique_microscope', name: 'Monocular Brass Microscope', category: 'tools', tier: 'antique', baseValue: 520, description: '19th-century lacquered brass scientific microscope with triple objective revolver in mahogany box.', restorable: true, restoreCost: 65, spriteHint: 'antique brass microscope' },
];

// --- SHOPS ---

export const SHOPS: readonly ShopDef[] = [
  {
    id: 'thrift',
    name: 'Thrift Store',
    description: 'Cheap finds, mostly junk. Occasional gem.',
    unlockCost: 0,
    tierRange: ['common', 'uncommon'],
    markupRange: [0.6, 0.85],
    inventorySize: 8,
    refreshIntervalMs: 3 * 60 * 1000, // 3 min
  },
  {
    id: 'flea',
    name: 'Flea Market',
    description: 'Eclectic mix. You never know what you\'ll find.',
    unlockCost: 0,
    tierRange: ['common', 'uncommon', 'rare'],
    markupRange: [0.65, 0.9],
    inventorySize: 10,
    refreshIntervalMs: 4 * 60 * 1000,
  },
  {
    id: 'pawn',
    name: 'Pawn Shop',
    description: 'Better electronics, jewelry, and tools.',
    unlockCost: 50,
    tierRange: ['uncommon', 'rare'],
    markupRange: [0.7, 0.9],
    inventorySize: 6,
    refreshIntervalMs: 5 * 60 * 1000,
  },
  {
    id: 'estate',
    name: 'Estate Sale',
    description: 'Whole-house cleanouts. Furniture and sets.',
    unlockCost: 200,
    tierRange: ['uncommon', 'rare', 'vintage'],
    markupRange: [0.65, 0.85],
    inventorySize: 12,
    refreshIntervalMs: 8 * 60 * 1000,
  },
  {
    id: 'antique_mall',
    name: 'Antique Mall',
    description: 'Curated pieces. High prices, high returns.',
    unlockCost: 500,
    tierRange: ['rare', 'vintage', 'antique'],
    markupRange: [0.75, 0.9],
    inventorySize: 8,
    refreshIntervalMs: 10 * 60 * 1000,
  },
  {
    id: 'storage',
    name: 'Storage Auction',
    description: 'Bid on mystery boxes. Could be treasure or trash.',
    unlockCost: 100,
    tierRange: ['common', 'uncommon', 'rare', 'vintage'],
    markupRange: [0.5, 0.8],
    inventorySize: 5,
    refreshIntervalMs: 6 * 60 * 1000,
  },
];

// --- SUPPLY ITEMS ---

export const SUPPLY_ITEMS: readonly SupplyItem[] = [
  {
    id: 'microfiber_cloth',
    name: 'Microfiber Cloth',
    cost: 3,
    description: 'Wipes surface grime. Dusty to fair.',
    applicableConditions: ['dusty'],
    resultCondition: 'fair',
  },
  {
    id: 'metal_polish',
    name: 'Brass & Metal Polish',
    cost: 9,
    description: 'Cuts tarnish and restores metal shine. Fair to good.',
    applicableConditions: ['fair'],
    resultCondition: 'good',
  },
  {
    id: 'wood_conditioner',
    name: 'Wood Wax & Finish',
    cost: 14,
    description: 'Nourishes dry wood and hides scratches. Fair to good.',
    applicableConditions: ['fair'],
    resultCondition: 'good',
  },
  {
    id: 'repair_epoxy',
    name: 'Repair Putty & Epoxy',
    cost: 18,
    description: 'Bonds broken ceramics, handles, and chips. Junk to fair.',
    applicableConditions: ['junk'],
    resultCondition: 'fair',
  },
  {
    id: 'electronics_cleaner',
    name: 'Contact Cleaner',
    cost: 24,
    description: 'Cleans corroded contacts and switches. Junk to fair.',
    applicableConditions: ['junk'],
    resultCondition: 'fair',
  },
  {
    id: 'jewelers_rouge',
    name: 'Jewelers Rouge & Buffer',
    cost: 38,
    description: 'Precision polishing compound. Good to pristine.',
    applicableConditions: ['good'],
    resultCondition: 'pristine',
  },
];

// --- SETS ---

export const SETS: readonly SetDef[] = [
  {
    id: 'brass_desk_set',
    name: 'Brass Desk Set',
    itemIds: ['brass_lamp', 'brass_compass', 'brass_letter_opener', 'roll_top_desk'],
    bonusMultiplier: 1.8,
    description: 'A complete brass-appointed desk ensemble.',
  },
  {
    id: 'silver_collection',
    name: 'Silver Collection',
    itemIds: ['silver_ring', 'silver_locket', 'silver_spoon', 'silver_frame'],
    bonusMultiplier: 1.7,
    description: 'Matching sterling silver pieces.',
  },
  {
    id: 'retro_office',
    name: 'Retro Office',
    itemIds: ['rotary_phone', 'typewriter', 'metronome'],
    bonusMultiplier: 1.6,
    description: 'Everything you need for a 1950s office.',
  },
  {
    id: 'vintage_toys',
    name: 'Vintage Toy Box',
    itemIds: ['tin_robot', 'tin_car', 'jack_in_box', 'cast_iron_bank'],
    bonusMultiplier: 1.9,
    description: 'A collector\'s dream toy chest.',
  },
  {
    id: 'model_train_set',
    name: 'Model Train Set',
    itemIds: ['model_train_engine', 'model_train_car', 'model_train_caboose'],
    bonusMultiplier: 2.0,
    description: 'Complete HO scale train with engine, car, and caboose.',
  },
  {
    id: 'oddity_cabinet',
    name: 'Oddity Cabinet',
    itemIds: ['taxidermy_squirrel', 'glass_eye_lot', 'cabinet_of_curiosities'],
    bonusMultiplier: 1.7,
    description: 'A curated collection of the bizarre.',
  },
  {
    id: 'music_corner',
    name: 'Music Corner',
    itemIds: ['harmonica', 'ukulele', 'trumpet'],
    bonusMultiplier: 1.6,
    description: 'A one-person band starter kit.',
  },
  {
    id: 'estate_kitchen',
    name: 'Estate Kitchen',
    itemIds: ['cast_iron_skillet', 'copper_kettle', 'fiesta_pitcher', 'silver_tea_set'],
    bonusMultiplier: 1.8,
    description: 'A fully outfitted vintage kitchen.',
  },
];

export const ITEM_SETS = SETS;

// --- PART MATCHING ASSEMBLIES ---

export interface PartAssemblyDef {
  id: string;
  name: string;
  incompleteId: string;
  partId: string;
  assembledId: string;
}

export const PART_ASSEMBLIES: readonly PartAssemblyDef[] = [
  {
    id: 'gramophone',
    name: 'Assemble Victor Gramophone',
    incompleteId: 'gramophone_incomplete',
    partId: 'gramophone_horn',
    assembledId: 'gramophone_complete',
  },
  {
    id: 'clock',
    name: 'Fit Clock Pendulum',
    incompleteId: 'clock_incomplete',
    partId: 'clock_pendulum',
    assembledId: 'clock_complete',
  },
  {
    id: 'oil_lamp',
    name: 'Fit Glass Lamp Chimney',
    incompleteId: 'lamp_incomplete',
    partId: 'glass_chimney',
    assembledId: 'lamp_complete',
  },
  {
    id: 'slr_camera',
    name: 'Mount 50mm Camera Lens',
    incompleteId: 'camera_incomplete',
    partId: 'camera_lens',
    assembledId: 'camera_complete',
  },
  {
    id: 'pocket_watch',
    name: 'Install Watch Hands',
    incompleteId: 'watch_incomplete',
    partId: 'watch_hand',
    assembledId: 'watch_complete',
  },
];

// --- BLIND STORAGE LOCKERS ---

export interface StorageLockerDef {
  id: string;
  name: string;
  cost: number;
  minItems: number;
  maxItems: number;
  description: string;
}

export const STORAGE_LOCKERS: readonly StorageLockerDef[] = [
  {
    id: 'attic_trunk',
    name: 'Estate Steamer Trunk',
    cost: 55,
    minItems: 3,
    maxItems: 4,
    description: 'Banded attic steamer trunk with rusted brass latches.',
  },
  {
    id: 'defaulted_unit',
    name: 'Defaulted Storage Locker',
    cost: 160,
    minItems: 3,
    maxItems: 5,
    description: 'Contents of an abandoned roll-up storage garage.',
  },
  {
    id: 'cargo_crate',
    name: 'Overseas Shipping Crate',
    cost: 420,
    minItems: 4,
    maxItems: 6,
    description: 'Reinforced customs cargo crate untouched since 1978.',
  },
  {
    id: 'safe',
    name: 'Cast Iron Cannonball Safe',
    cost: 850,
    minItems: 4,
    maxItems: 7,
    description: 'Heavy antique keyed iron safe with high-grade estate contents.',
  },
];

// --- AUCTION THEME DEFINITIONS ---

export const AUCTION_THEMES: readonly {
  theme: AuctionTheme;
  themeName: string;
  categoryBonuses: Partial<Record<ItemCategory, number>>;
  fee: number;
}[] = [
  {
    theme: 'general',
    themeName: 'General Auction',
    categoryBonuses: {},
    fee: 0.10,
  },
  {
    theme: 'fine_art',
    themeName: 'Fine Art Night',
    categoryBonuses: { art: 1.6, jewelry: 1.3 },
    fee: 0.12,
  },
  {
    theme: 'vintage_tech',
    themeName: 'Vintage Tech Expo',
    categoryBonuses: { electronics: 1.5, tools: 1.3 },
    fee: 0.10,
  },
  {
    theme: 'home_estate',
    themeName: 'Home & Estate',
    categoryBonuses: { furniture: 1.5, kitchenware: 1.4, clothing: 1.2 },
    fee: 0.10,
  },
  {
    theme: 'curiosities',
    themeName: 'Curiosities & Oddities',
    categoryBonuses: { oddities: 1.7, toys: 1.4, books: 1.3 },
    fee: 0.10,
  },
  {
    theme: 'luxury',
    themeName: 'Luxury Auction',
    categoryBonuses: { jewelry: 1.6, art: 1.4, clothing: 1.3 },
    fee: 0.15,
  },
  {
    theme: 'collectors_night',
    themeName: 'Collectors Night',
    categoryBonuses: { toys: 1.5, books: 1.5, music: 1.4, sports: 1.4 },
    fee: 0.10,
  },
];

// --- NEWS TEMPLATES ---

const NEWS_TEMPLATES: readonly {
  headline: string;
  affectedCategories: ItemCategory[];
  demandRange: [number, number]; // [min multiplier, max multiplier]
}[] = [
  { headline: 'Antique Roadshow filming in town -- furniture prices surge', affectedCategories: ['furniture'], demandRange: [1.4, 1.7] },
  { headline: 'Celebrity spotted wearing vintage jewelry', affectedCategories: ['jewelry'], demandRange: [1.5, 1.8] },
  { headline: 'Local museum exhibit drives art demand', affectedCategories: ['art'], demandRange: [1.3, 1.6] },
  { headline: 'Retro tech TikTok trend boosts electronics sales', affectedCategories: ['electronics'], demandRange: [1.4, 1.7] },
  { headline: 'Book club picks vintage editions as next read', affectedCategories: ['books'], demandRange: [1.3, 1.6] },
  { headline: 'Toy collectors convention announced for next month', affectedCategories: ['toys'], demandRange: [1.5, 1.8] },
  { headline: 'DIY woodworking craze increases tool demand', affectedCategories: ['tools'], demandRange: [1.3, 1.5] },
  { headline: 'Farmhouse kitchen aesthetic trending on social media', affectedCategories: ['kitchenware'], demandRange: [1.4, 1.6] },
  { headline: 'Vintage fashion show coming to the convention center', affectedCategories: ['clothing'], demandRange: [1.4, 1.7] },
  { headline: 'Oddities museum seeks new acquisitions', affectedCategories: ['oddities'], demandRange: [1.5, 1.8] },
  { headline: 'Local sports memorabilia auction breaks records', affectedCategories: ['sports'], demandRange: [1.4, 1.7] },
  { headline: 'Vinyl revival drives interest in musical instruments', affectedCategories: ['music'], demandRange: [1.3, 1.6] },
  { headline: 'Estate sale season heats up -- furniture and kitchenware in demand', affectedCategories: ['furniture', 'kitchenware'], demandRange: [1.3, 1.5] },
  { headline: 'Holiday gift guide features antique jewelry and art', affectedCategories: ['jewelry', 'art'], demandRange: [1.3, 1.6] },
  { headline: 'Quiet weekend -- no major market shifts', affectedCategories: [], demandRange: [1.0, 1.0] },
];

// ----------------------------------------------------------
// 3. CORE FUNCTIONS
// ----------------------------------------------------------

/** Condition -> value multiplier */
export function getConditionMultiplier(condition: ItemCondition): number {
  const map: Record<ItemCondition, number> = {
    junk: 0.3,
    dusty: 0.5,
    fair: 0.7,
    good: 0.9,
    pristine: 1.15,
  };
  return map[condition];
}

/** Ordered condition ladder for upgrades */
const CONDITION_ORDER: readonly ItemCondition[] = ['junk', 'dusty', 'fair', 'good', 'pristine'];

/** Determine which conditions can appear in a shop tier */
function conditionsForTier(tier: ItemTier): ItemCondition[] {
  switch (tier) {
    case 'common':
      return ['junk', 'dusty', 'fair'];
    case 'uncommon':
      return ['junk', 'dusty', 'fair', 'good'];
    case 'rare':
      return ['dusty', 'fair', 'good'];
    case 'vintage':
      return ['dusty', 'fair', 'good'];
    case 'antique':
      return ['fair', 'good', 'pristine'];
  }
}

/** Determine which conditions appear by shop type (thrift/pawn/storage have rough items, estate/antique mall have pristine/nice items) */
export function conditionsForShop(shopId: ShopId): ItemCondition[] {
  switch (shopId) {
    case 'thrift':
      return ['junk', 'junk', 'dusty', 'fair'];
    case 'flea':
      return ['dusty', 'dusty', 'fair', 'junk'];
    case 'pawn':
      return ['fair', 'fair', 'good', 'dusty'];
    case 'storage':
      return ['junk', 'dusty', 'dusty', 'fair'];
    case 'estate':
      return ['fair', 'good', 'good', 'pristine'];
    case 'antique_mall':
      return ['good', 'good', 'pristine', 'pristine'];
    default:
      return ['fair', 'good'];
  }
}

/** Look up an item definition by id */
export function getItemDef(itemId: string): ItemDef | undefined {
  return ITEM_CATALOG.find((i) => i.id === itemId);
}

/** Generate shop inventory for a given shop */
export function generateShopInventory(
  shop: ShopDef,
  _currentNews: NewsBulletin | null
): ShopItem[] {
  // Filter catalog to items matching shop's tier range
  const eligible = ITEM_CATALOG.filter((item) =>
    shop.tierRange.includes(item.tier)
  );

  if (eligible.length === 0) return [];

  // Deduplicate eligible items by ID so no duplicates exist in source
  const uniqueItemsMap = new Map<string, ItemDef>();
  for (const item of eligible) {
    if (!uniqueItemsMap.has(item.id)) {
      uniqueItemsMap.set(item.id, item);
    }
  }

  // Shuffle and pick unique items
  const selected = shuffle([...uniqueItemsMap.values()]).slice(0, shop.inventorySize);

  return selected.map((item) => {
    const condition = pick(conditionsForShop(shop.id));
    const conditionMult = getConditionMultiplier(condition);
    const markup = rand(shop.markupRange[0], shop.markupRange[1]);
    const price = Math.max(1, Math.round(item.baseValue * conditionMult * markup));

    const hasMark =
      (item.tier === 'rare' || item.tier === 'vintage' || item.tier === 'antique') &&
      Math.random() < 0.25;

    return {
      item,
      condition,
      price,
      uid: uid(),
      makerMark: hasMark ? 'unverified' : undefined,
    };
  });
}

/** Calculate effective base value taking into account maker mark / appraisals */
export function getEffectiveBaseValue(
  item: ItemDef,
  makerMark?: 'unverified' | 'authentic' | 'counterfeit'
): number {
  if (makerMark === 'authentic') return Math.round(item.baseValue * 2.5);
  if (makerMark === 'counterfeit') return Math.max(2, Math.round(item.baseValue * 0.25));
  return item.baseValue;
}

/** Calculate direct sell value (selling to a shop). Always a lowball. */
export function getDirectSellValue(
  item: ItemDef,
  condition: ItemCondition,
  makerMark?: 'unverified' | 'authentic' | 'counterfeit'
): number {
  const base = getEffectiveBaseValue(item, makerMark);
  const condMult = getConditionMultiplier(condition);
  const sellRate = rand(0.4, 0.6);
  return Math.max(1, Math.round(base * condMult * sellRate));
}

/** Estimate auction value range given theme and news */
export function getAuctionEstimate(
  item: ItemDef,
  condition: ItemCondition,
  event: AuctionEvent,
  currentNews: NewsBulletin | null,
  makerMark?: 'unverified' | 'authentic' | 'counterfeit'
): { low: number; high: number; expected: number } {
  const base = getEffectiveBaseValue(item, makerMark);
  const condMult = getConditionMultiplier(condition);
  const baseVal = base * condMult;

  // Theme bonus
  const themeBonus = event.categoryBonuses[item.category] ?? 1.0;

  // News bonus
  let newsBonus = 1.0;
  if (
    currentNews &&
    currentNews.affectedCategories.includes(item.category) &&
    currentNews.expiresAt > Date.now()
  ) {
    newsBonus = currentNews.demandMultiplier;
  }

  const combined = themeBonus * newsBonus;

  const low = Math.round(baseVal * 0.8 * combined * (1 - event.fee));
  const high = Math.round(baseVal * 1.8 * combined * (1 - event.fee));
  const expected = Math.round(baseVal * 1.2 * combined * (1 - event.fee));

  return { low: Math.max(1, low), high: Math.max(1, high), expected: Math.max(1, expected) };
}

/** Simulate an auction result with randomized bidding and authenticity fraud checks */
export function rollAuctionResult(
  item: ItemDef,
  condition: ItemCondition,
  event: AuctionEvent,
  currentNews: NewsBulletin | null,
  startingBid: number,
  makerMark?: 'unverified' | 'authentic' | 'counterfeit',
  hammerBonus: number = 0
): { finalPrice: number; bidCount: number; sold: boolean; fined: boolean; fineAmount: number } {
  // Fraud checks: selling counterfeit or unverified marks
  if (makerMark === 'counterfeit') {
    if (Math.random() < 0.75) {
      return { finalPrice: 0, bidCount: 0, sold: false, fined: true, fineAmount: 50 };
    }
  } else if (makerMark === 'unverified') {
    // Only a small 10% chance of an unverified lot being flagged, otherwise buyers bid cautiously
    if (Math.random() < 0.10) {
      return { finalPrice: 0, bidCount: 0, sold: false, fined: true, fineAmount: 20 };
    }
  }

  const estimate = getAuctionEstimate(item, condition, event, currentNews, makerMark);

  // Chance of going unsold increases if starting bid is high relative to estimate
  const bidToEstRatio = startingBid / estimate.expected;
  let unsoldChance = 0.05; // base 5% unsold
  if (bidToEstRatio > 1.0) unsoldChance += (bidToEstRatio - 1.0) * 0.4;
  if (bidToEstRatio > 1.5) unsoldChance = 0.75;

  if (Math.random() < unsoldChance) {
    return { finalPrice: 0, bidCount: randInt(0, 1), sold: false, fined: false, fineAmount: 0 };
  }

  // Roll between low and high, biased toward expected, plus dealer hammer bonus
  const roll = rand(0, 1);
  const range = estimate.high - estimate.low;
  const skew = 0.45 + roll * 0.55; // 0.45 to 1.0
  let rawPrice = (estimate.low + range * skew) * (1 + hammerBonus);

  if (makerMark === 'unverified') {
    rawPrice *= 0.88;
  }

  // If starting bid is higher than the rolled price, bump to just above or fail
  let finalPrice = Math.round(rawPrice);
  if (finalPrice < startingBid) {
    if (Math.random() < 0.65) {
      finalPrice = startingBid + randInt(1, Math.max(2, Math.round(startingBid * 0.1)));
    } else {
      return { finalPrice: 0, bidCount: randInt(0, 2), sold: false, fined: false, fineAmount: 0 };
    }
  }

  const bidCount = randInt(3, 14);
  return { finalPrice: Math.max(startingBid, finalPrice), bidCount, sold: true, fined: false, fineAmount: 0 };
}

/** Open a blind storage locker and unpack 3-6 items */
export function openStorageLocker(locker: StorageLockerDef): {
  item: ItemDef;
  condition: ItemCondition;
  makerMark?: 'unverified';
}[] {
  const count = randInt(locker.minItems, locker.maxItems);
  const results: { item: ItemDef; condition: ItemCondition; makerMark?: 'unverified' }[] = [];

  for (let i = 0; i < count; i++) {
    const item = pick(ITEM_CATALOG);
    const condition = pick(['junk', 'dusty', 'fair', 'good'] as ItemCondition[]);
    const hasMark = Math.random() < 0.3;
    results.push({
      item,
      condition,
      makerMark: hasMark ? 'unverified' : undefined,
    });
  }

  return results;
}

/** Combine an incomplete item with its matching part */
export function assemblePart(
  incompleteUid: string,
  partUid: string,
  ownedItems: OwnedItem[]
): { assembled: OwnedItem; remainingItems: OwnedItem[] } | null {
  const inc = ownedItems.find((o) => o.uid === incompleteUid);
  const part = ownedItems.find((o) => o.uid === partUid);
  if (!inc || !part) return null;

  const assembly = PART_ASSEMBLIES.find(
    (a) => a.incompleteId === inc.itemId && a.partId === part.itemId
  );
  if (!assembly) return null;

  const targetDef = getItemDef(assembly.assembledId);
  if (!targetDef) return null;

  const assembled: OwnedItem = {
    uid: 'own_' + Math.random().toString(36).substring(2, 9),
    itemId: targetDef.id,
    condition: inc.condition === 'junk' ? 'fair' : inc.condition,
    boughtFor: inc.boughtFor + part.boughtFor,
    boughtAt: Date.now(),
    restored: true,
    makerMark: inc.makerMark || part.makerMark,
  };

  const remaining = ownedItems.filter((o) => o.uid !== incompleteUid && o.uid !== partUid);
  return { assembled, remainingItems: remaining };
}

/** Appraise an item with an unverified maker mark */
export function appraiseItem(
  _item: OwnedItem
): { result: 'authentic' | 'counterfeit'; newMark: 'authentic' | 'counterfeit' } {
  // 65% genuine authentic stamp, 35% reproduction counterfeit
  const isAuth = Math.random() < 0.65;
  const newMark = isAuth ? 'authentic' : 'counterfeit';
  return { result: newMark, newMark };
}

/** Apply a supply item to restore/improve an owned item */
export function applySupply(
  ownedItem: OwnedItem,
  supply: SupplyItem,
  itemDef: ItemDef
): { newCondition: ItemCondition; valueGain: number } | null {
  if (!itemDef.restorable) return null;
  if (!supply.applicableConditions.includes(ownedItem.condition)) return null;

  const oldIdx = CONDITION_ORDER.indexOf(ownedItem.condition);
  const newIdx = CONDITION_ORDER.indexOf(supply.resultCondition);
  if (newIdx <= oldIdx) return null; // no downgrade

  const oldValue = itemDef.baseValue * getConditionMultiplier(ownedItem.condition);
  const newValue = itemDef.baseValue * getConditionMultiplier(supply.resultCondition);
  const valueGain = Math.round(newValue - oldValue);

  return {
    newCondition: supply.resultCondition,
    valueGain,
  };
}

/** Check which complete sets the player has */
export function checkCompleteSets(ownedItems: OwnedItem[]): SetDef[] {
  const ownedItemIds = new Set(ownedItems.map((o) => o.itemId));
  return SETS.filter((set) => set.itemIds.every((id) => ownedItemIds.has(id)));
}

/** Calculate what a complete set would sell for */
export function getSetSellValue(set: SetDef, ownedItems: OwnedItem[]): number {
  let sumOfParts = 0;
  for (const itemId of set.itemIds) {
    const owned = ownedItems.find((o) => o.itemId === itemId);
    const def = getItemDef(itemId);
    if (!owned || !def) continue;
    sumOfParts += def.baseValue * getConditionMultiplier(owned.condition);
  }
  return Math.round(sumOfParts * set.bonusMultiplier);
}

/** Generate a random news bulletin */
export function generateNewsBulletin(): NewsBulletin {
  const template = pick(NEWS_TEMPLATES);
  const mult =
    template.demandRange[0] === template.demandRange[1]
      ? template.demandRange[0]
      : parseFloat(rand(template.demandRange[0], template.demandRange[1]).toFixed(2));

  return {
    id: uid(),
    headline: template.headline,
    affectedCategories: template.affectedCategories,
    demandMultiplier: mult,
    expiresAt: Date.now() + randInt(5, 12) * 60 * 1000, // 5-12 minutes
  };
}

export const RIVAL_BIDDERS: readonly string[] = [
  'Collector Vance',
  'Dealer Sarah',
  'Bargain Hound',
  'Curio Curator',
  'Old Man Higgins',
  'Archivist Lin',
];

/** Generate the next auction event, featuring house lots with broken/dusty/unverified stock */
export function generateAuctionEvent(): AuctionEvent {
  const def = pick(AUCTION_THEMES);
  const startsAt = Date.now() + randInt(1, 4) * 60 * 1000;
  const durationMs = randInt(3, 6) * 60 * 1000;

  const incompleteIds = [
    'gramophone_incomplete',
    'clock_incomplete',
    'lamp_incomplete',
    'camera_incomplete',
    'watch_incomplete',
  ];

  const houseLots: HouseAuctionLot[] = [];
  const lotCount = randInt(3, 4);
  const usedItemIds = new Set<string>();

  for (let i = 0; i < lotCount; i++) {
    // 35% chance to feature incomplete item
    const isIncomplete = Math.random() < 0.35;
    let chosenItem: ItemDef | undefined;

    if (isIncomplete) {
      const availableIncomplete = incompleteIds.filter((id) => !usedItemIds.has(id));
      if (availableIncomplete.length > 0) {
        const pickedId = pick(availableIncomplete);
        chosenItem = getItemDef(pickedId);
      }
    }

    if (!chosenItem) {
      const themeCats = Object.keys(def.categoryBonuses) as ItemCategory[];
      const matchingItems = themeCats.length > 0
        ? ITEM_CATALOG.filter((it) => themeCats.includes(it.category) && !usedItemIds.has(it.id))
        : [];
      const pool = matchingItems.length > 0 && Math.random() < 0.65
        ? matchingItems
        : ITEM_CATALOG.filter((it) => !usedItemIds.has(it.id));
      chosenItem = pick(pool) || pick(ITEM_CATALOG);
    }

    usedItemIds.add(chosenItem.id);

    // Auctions specialize in rough liquidation / estate cleanouts: heavily junk & dusty
    const condition = pick(['junk', 'junk', 'dusty', 'dusty', 'fair', 'good'] as ItemCondition[]);
    const hasMark =
      (chosenItem.tier === 'rare' || chosenItem.tier === 'vintage' || chosenItem.tier === 'antique') &&
      Math.random() < 0.35;
    const condMult = getConditionMultiplier(condition);
    const startBid = Math.max(3, Math.round(chosenItem.baseValue * condMult * rand(0.35, 0.55)));

    houseLots.push({
      uid: 'hlot_' + Math.random().toString(36).substring(2, 9),
      itemId: chosenItem.id,
      condition,
      makerMark: hasMark ? 'unverified' : undefined,
      startingBid: startBid,
      currentBid: startBid,
      highestBidder: 'house',
      bidCount: 0,
      status: 'active',
    });
  }

  return {
    id: uid(),
    theme: def.theme,
    themeName: def.themeName,
    startsAt,
    durationMs,
    categoryBonuses: { ...def.categoryBonuses },
    fee: def.fee,
    houseLots,
  };
}

/** Place a bid on a house auction lot with live AI rival reactions */
export function placeHouseLotBid(
  lot: HouseAuctionLot,
  playerCash: number,
  increment: number
): {
  success: boolean;
  message: string;
  updatedLot: HouseAuctionLot;
} {
  if (lot.status !== 'active') {
    return { success: false, message: 'Lot is closed', updatedLot: lot };
  }

  const nextBid = lot.currentBid + increment;
  if (playerCash < nextBid) {
    return { success: false, message: `Need $${nextBid} to bid`, updatedLot: lot };
  }

  const itemDef = getItemDef(lot.itemId);
  const fairValue = itemDef
    ? itemDef.baseValue * getConditionMultiplier(lot.condition)
    : nextBid * 1.5;

  const lotAfterPlayer: HouseAuctionLot = {
    ...lot,
    currentBid: nextBid,
    highestBidder: 'player',
    bidCount: lot.bidCount + 1,
  };

  // AI rival counter-bid chance: only contest if player's bid is still a steep bargain
  const rivalCeiling = fairValue * rand(0.85, 1.15);
  // Rivals hesitate if bid approaches fair value or if player raised aggressively
  const isDeepDiscount = nextBid < fairValue * 0.7;
  const rivalWantsToBid = nextBid < rivalCeiling && (isDeepDiscount ? Math.random() < 0.45 : Math.random() < 0.2);

  if (rivalWantsToBid) {
    const rivalName = pick(RIVAL_BIDDERS);
    const rivalIncrement = randInt(2, Math.max(4, Math.round(increment * 0.7)));
    const rivalBid = nextBid + rivalIncrement;

    const lotAfterRival: HouseAuctionLot = {
      ...lotAfterPlayer,
      currentBid: rivalBid,
      highestBidder: rivalName,
      bidCount: lotAfterPlayer.bidCount + 1,
    };

    return {
      success: true,
      message: `You bid $${nextBid}. ${rivalName} counter-bid $${rivalBid}!`,
      updatedLot: lotAfterRival,
    };
  }

  return {
    success: true,
    message: `You hold high bid at $${nextBid}. Hammer is ready!`,
    updatedLot: lotAfterPlayer,
  };
}

/** Hammer the gavel on a house lot, claiming it or passing */
export function hammerHouseLot(
  lot: HouseAuctionLot
): {
  winner: 'player' | 'rival' | 'passed';
  finalPrice: number;
  updatedLot: HouseAuctionLot;
} {
  if (lot.highestBidder === 'player') {
    return {
      winner: 'player',
      finalPrice: lot.currentBid,
      updatedLot: { ...lot, status: 'sold_to_player' },
    };
  }

  if (lot.highestBidder !== 'house') {
    return {
      winner: 'rival',
      finalPrice: lot.currentBid,
      updatedLot: { ...lot, status: 'sold_to_rival' },
    };
  }

  return {
    winner: 'passed',
    finalPrice: 0,
    updatedLot: { ...lot, status: 'passed' },
  };
}

// ----------------------------------------------------------
// 4. GAME STATE HELPERS
// ----------------------------------------------------------

export interface GameState {
  cash: number;
  ownedItems: OwnedItem[];
  unlockedShops: ShopId[];
  shopInventories: Record<ShopId, { items: ShopItem[]; generatedAt: number }>;
  currentNews: NewsBulletin | null;
  currentAuction: AuctionEvent | null;
  auctionListings: AuctionListing[];
  totalEarned: number;
  totalSpent: number;
  itemsSold: number;
  day: number;
  storageCapacity: number;
}

export function createInitialGameState(): GameState {
  return {
    cash: 10,
    ownedItems: [],
    unlockedShops: ['thrift', 'flea'],
    shopInventories: {} as Record<ShopId, { items: ShopItem[]; generatedAt: number }>,
    currentNews: null,
    currentAuction: null,
    auctionListings: [],
    totalEarned: 0,
    totalSpent: 0,
    itemsSold: 0,
    day: 1,
    storageCapacity: 20,
  };
}

/** Check if shop inventory needs refresh */
export function shopNeedsRefresh(
  shop: ShopDef,
  inventory: { items: ShopItem[]; generatedAt: number } | undefined
): boolean {
  if (!inventory) return true;
  return Date.now() - inventory.generatedAt >= shop.refreshIntervalMs;
}

/** Persist game state to localStorage */
export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem('auction_collector_save', JSON.stringify(state));
  } catch {
    // quota exceeded or unavailable -- silently fail
  }
}

/** Load game state from localStorage */
export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem('auction_collector_save');
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

/** Format dollar amount */
export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

/** Get display label for condition */
export function conditionLabel(condition: ItemCondition): string {
  const labels: Record<ItemCondition, string> = {
    junk: 'Junk',
    dusty: 'Dusty',
    fair: 'Fair',
    good: 'Good',
    pristine: 'Pristine',
  };
  return labels[condition];
}

/** Get color class for condition (Tailwind) */
export function conditionColor(condition: ItemCondition): string {
  const colors: Record<ItemCondition, string> = {
    junk: 'text-red-400',
    dusty: 'text-yellow-500',
    fair: 'text-yellow-300',
    good: 'text-green-400',
    pristine: 'text-cyan-300',
  };
  return colors[condition];
}

/** Get display label for tier */
export function tierLabel(tier: ItemTier): string {
  const labels: Record<ItemTier, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    vintage: 'Vintage',
    antique: 'Antique',
  };
  return labels[tier];
}

/** Get color class for tier (Tailwind) */
export function tierColor(tier: ItemTier): string {
  const colors: Record<ItemTier, string> = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    vintage: 'text-purple-400',
    antique: 'text-amber-400',
  };
  return colors[tier];
}

/** Generate initials for placeholder sprites */
export function itemInitials(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ----------------------------------------------------------
// 7. DEALER CAREER & REPUTATION PROGRESSION
// ----------------------------------------------------------

export interface DealerRank {
  level: number;
  title: string;
  minXp: number;
  perkDescription: string;
  hammerBonus: number;
  appraisalDiscount: number;
}

export const DEALER_RANKS: readonly DealerRank[] = [
  { level: 1, title: 'Curio Scavenger', minXp: 0, perkDescription: 'Starting out in the trade', hammerBonus: 0, appraisalDiscount: 0 },
  { level: 2, title: 'Yard Sale Picker', minXp: 80, perkDescription: '+5% auction hammer price bonus', hammerBonus: 0.05, appraisalDiscount: 0 },
  { level: 3, title: 'Restoration Tinkerer', minXp: 200, perkDescription: '+8% auction hammer prices & faster cleaning', hammerBonus: 0.08, appraisalDiscount: 0 },
  { level: 4, title: 'Estate Scout', minXp: 400, perkDescription: '+10% auction hammer prices & 25% off appraisals', hammerBonus: 0.10, appraisalDiscount: 0.25 },
  { level: 5, title: 'Licensed Appraiser', minXp: 750, perkDescription: '50% cheaper appraisal fees & +12% hammer prices', hammerBonus: 0.12, appraisalDiscount: 0.5 },
  { level: 6, title: 'Master Antiquarian', minXp: 1300, perkDescription: '+15% auction hammer prices & VIP client bids', hammerBonus: 0.15, appraisalDiscount: 0.5 },
  { level: 7, title: 'Grand Auctioneer', minXp: 2100, perkDescription: '+20% auction hammer prices & high-roller interest', hammerBonus: 0.20, appraisalDiscount: 0.5 },
  { level: 8, title: 'Auction House Legend', minXp: 3200, perkDescription: '+25% auction hammer prices & 75% off appraisals', hammerBonus: 0.25, appraisalDiscount: 0.75 },
];

export function getRankForXp(xp: number): DealerRank {
  for (let i = DEALER_RANKS.length - 1; i >= 0; i--) {
    if (xp >= DEALER_RANKS[i].minXp) return DEALER_RANKS[i];
  }
  return DEALER_RANKS[0];
}

export function getNextRank(currentLevel: number): DealerRank | null {
  return DEALER_RANKS.find((r) => r.level === currentLevel + 1) || null;
}

// ----------------------------------------------------------
// 8. STORAGE VEHICLES & EXPANSION TIERS
// ----------------------------------------------------------

export interface VehicleUpgrade {
  tier: number;
  name: string;
  capacity: number;
  cost: number;
  description: string;
}

export const VEHICLE_UPGRADES: readonly VehicleUpgrade[] = [
  { tier: 1, name: 'Wooden Handcart', capacity: 20, cost: 0, description: 'Modest wooden handcart for local runs.' },
  { tier: 2, name: 'Estate Station Wagon', capacity: 35, cost: 75, description: 'Roomy fold-down trunk for estate sales.' },
  { tier: 3, name: 'Curio Cargo Van', capacity: 55, cost: 180, description: 'Commercial van with padded transport racks.' },
  { tier: 4, name: 'Flatbed Freight Truck', capacity: 85, cost: 420, description: 'Heavy hauling for whole-room cleanouts.' },
  { tier: 5, name: 'Antique Depository Vault', capacity: 130, cost: 950, description: 'Climate-controlled curio warehouse.' },
];

// ----------------------------------------------------------
// 9. COLLECTOR CONTRACTS & PRIVATE BOUNTIES
// ----------------------------------------------------------

export interface ClientContract {
  id: string;
  clientName: string;
  clientTitle: string;
  category: ItemCategory;
  minCondition: ItemCondition;
  rewardMoney: number;
  rewardXp: number;
  description: string;
  completed?: boolean;
}

export const CLIENT_PROFILES = [
  { name: 'Captain Barnaby', title: 'Maritime Historian', categories: ['tools', 'oddities'] as ItemCategory[], prompt: 'seeking seaworthy nautical or navigation tools' },
  { name: 'Dr. Aris Thorne', title: 'Museum Conservator', categories: ['art', 'books', 'tools'] as ItemCategory[], prompt: 'looking for authentic historical or scientific curios' },
  { name: 'Greta Van Horn', title: 'Retro Diner Proprietor', categories: ['kitchenware', 'furniture', 'electronics'] as ItemCategory[], prompt: 'needs classic mid-century Americana for display' },
  { name: 'Lady Eleanor Montgomery', title: 'Estate Collector', categories: ['jewelry', 'art', 'music'] as ItemCategory[], prompt: 'in the market for fine heirloom treasures' },
  { name: 'Julian Cross', title: 'Arcade Curator', categories: ['electronics', 'toys'] as ItemCategory[], prompt: 'hunting for retro gaming and mechanical wonders' },
  { name: 'Silas Vance', title: 'Oddity Collector', categories: ['oddities', 'sports', 'clothing'] as ItemCategory[], prompt: 'wants eccentric pieces with character' },
];

export function generateDailyContracts(day: number): ClientContract[] {
  const conditions: ItemCondition[] = ['fair', 'good', 'pristine'];
  const contracts: ClientContract[] = [];

  // Deterministically shuffle clients by day
  const shuffledClients = [...CLIENT_PROFILES].sort((a, b) => {
    const hashA = (a.name.charCodeAt(0) * 17 + day * 31) % 100;
    const hashB = (b.name.charCodeAt(0) * 17 + day * 31) % 100;
    return hashA - hashB;
  }).slice(0, 3);

  shuffledClients.forEach((client, idx) => {
    const catIdx = (day * 3 + idx) % client.categories.length;
    const cat = client.categories[catIdx];
    const condIdx = (day + idx) % conditions.length;
    const cond = conditions[condIdx];
    const condMult = getConditionMultiplier(cond);

    const baseReward = 45 + ((day * 13 + idx * 29) % 50);
    const rewardMoney = Math.round(baseReward * condMult * 1.8);
    const rewardXp = Math.round(35 + rewardMoney * 0.35);

    contracts.push({
      id: `contract_d${day}_${idx}_${cat}`,
      clientName: client.name,
      clientTitle: client.title,
      category: cat,
      minCondition: cond,
      rewardMoney,
      rewardXp,
      description: `${client.name} is ${client.prompt} (${cat.toUpperCase()}, ${cond.toUpperCase()}+ condition).`,
    });
  });

  return contracts;
}

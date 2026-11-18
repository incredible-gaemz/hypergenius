const Config = {
    MAP_WIDTH: 9000,
    MAP_HEIGHT: 9000,
    MAX_FOOD: 4500,
    MAX_VIRUSES: 26,
    MAX_MOTHER_CELLS: 12,    // Exactly 10-13 as requested
    MAX_BOTS: 36,
    
    // Mechanics
    FOOD_MASS: 1,
    EJECTED_MASS: 13,        // Mass of W pellet
    VIRUS_MASS: 100,         // Starting mass of a virus
    VIRUS_MAX_MASS: 180,     // Virus splits when it hits this mass
    MOTHER_CELL_MASS: 220,   // Base mass of a mother cell
    MOTHER_CELL_MAX_MASS: 500, // Capped: over this it bursts/stabilizes
    START_MASS: 15,          // Authentic Agar starting mass
    BASE_SPEED: 32,          // Movement speed baseline
    SPEED_SCALE: 0.44,       // Authentic Agar speed decay: speed = base * (mass ^ -0.44)
    SPAWN_IMMUNITY_MS: 800,  // Invincible time on spawn: 0.8 seconds
    
    // Speeds & Physics
    EJECT_SPEED: 36,
    SPLIT_SPEED: 46,
    SPEED_DECAY: 0.88,
    MAX_CELLS: 16,           // Standard Agar maximum split count
    MASS_DECAY_RATE: 0.0018, // 0.18% mass lost per second for cells > 100 mass
    
    // Minimums
    MIN_EJECT_MASS: 35,
    MIN_SPLIT_MASS: 36,
    
    // Merging
    MERGE_TIME_BASE: 25,     // Seconds before own cells can recombine
    MERGE_TIME_SCALE: 0.02,  // Extra seconds per mass unit
    
    // Bot configs
    BOT_VISION_RADIUS: 1100,
    BOT_UPDATE_INTERVAL: 3
};

if (typeof module !== 'undefined') module.exports = Config;

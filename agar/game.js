class Game {
    constructor() {
        this.entities = [];
        this.bots = [];
        this.nextId = 1;
        this.players = new Map(); // id -> { name, score, color }
        
        // Spatial hash grid
        this.gridSize = 700;
        this.gridCols = Math.ceil(Config.MAP_WIDTH / this.gridSize);
        this.numBins = this.gridCols * this.gridCols;
        this.grid = new Array(this.numBins);
        for (let i = 0; i < this.numBins; i++) {
            this.grid[i] = [];
        }

        // Pre-allocated arrays for garbage-collection-free performance
        this.cellsArray = [];
        this.ejectedArray = [];
        this.staticsArray = [];
        this.queryResult = [];
        this.motherCellTick = 0;

        this.init();
    }

    init() {
        // Spawn distributed mother cells across a 4x3 grid (exactly 12 across the whole map)
        const cols = 4;
        const rows = 3;
        const cellW = Config.MAP_WIDTH / cols;
        const cellH = Config.MAP_HEIGHT / rows;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const posX = (c + 0.5) * cellW + MathUtils.randomRange(-cellW * 0.22, cellW * 0.22);
                const posY = (r + 0.5) * cellH + MathUtils.randomRange(-cellH * 0.22, cellH * 0.22);
                this.spawnMotherCell(posX, posY);
            }
        }

        // Spawn initial viruses
        for (let i = 0; i < Config.MAX_VIRUSES; i++) {
            this.spawnVirus();
        }
        
        // Spawn initial food
        for (let i = 0; i < Config.MAX_FOOD; i++) {
            this.spawnFood();
        }
    }

    getId() {
        return this.nextId++;
    }

    spawnFood() {
        const x = MathUtils.randomRange(50, Config.MAP_WIDTH - 50);
        const y = MathUtils.randomRange(50, Config.MAP_HEIGHT - 50);
        const color = MathUtils.getRandomColor();
        this.entities.push(new Food(this.getId(), x, y, color));
    }

    spawnVirus() {
        const x = MathUtils.randomRange(300, Config.MAP_WIDTH - 300);
        const y = MathUtils.randomRange(300, Config.MAP_HEIGHT - 300);
        this.entities.push(new Virus(this.getId(), x, y));
    }

    spawnMotherCell(x = null, y = null) {
        const posX = x !== null ? x : MathUtils.randomRange(400, Config.MAP_WIDTH - 400);
        const posY = y !== null ? y : MathUtils.randomRange(400, Config.MAP_HEIGHT - 400);
        this.entities.push(new MotherCell(this.getId(), posX, posY));
    }

    addPlayer(id, name, colorCode = null, startMass = Config.START_MASS) {
        const x = MathUtils.randomRange(200, Config.MAP_WIDTH - 200);
        const y = MathUtils.randomRange(200, Config.MAP_HEIGHT - 200);
        const color = colorCode || MathUtils.getRandomColor();
        
        const cell = new Cell(this.getId(), id, name, x, y, startMass, color);
        cell.spawnTime = Date.now();
        this.entities.push(cell);
        
        // Spawn a pleasant cluster of food around new player for early foraging
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 260;
            const fx = x + Math.cos(angle) * dist;
            const fy = y + Math.sin(angle) * dist;
            if (fx > 50 && fx < Config.MAP_WIDTH - 50 && fy > 50 && fy < Config.MAP_HEIGHT - 50) {
                this.entities.push(new Food(this.getId(), fx, fy, MathUtils.getRandomColor()));
            }
        }
        
        this.players.set(id, { name: name, score: startMass, color: color });
        return { x, y, color };
    }

    addBot(isBoss = false) {
        const botId = "bot_" + this.getId();
        let name = MathUtils.generateBotName();
        if (isBoss) name = "★ " + name + " ★";
        
        const startMass = isBoss ? 500 : Config.START_MASS;
        const { color } = this.addPlayer(botId, name, null, startMass);
        
        const cell = this.entities[this.entities.length - 1];
        if (cell && cell.ownerId === botId) {
            cell.isBot = true;
        }
        
        const bot = new BotAI(this, botId, name, color);
        if (isBoss) bot.isBoss = true;
        this.bots.push(bot);
    }

    removePlayer(id) {
        this.entities = this.entities.filter(e => e.ownerId !== id);
        this.bots = this.bots.filter(b => b.id !== id);
        this.players.delete(id);
    }

    getPlayerScore(id) {
        let score = 0;
        for (let i = 0; i < this.cellsArray.length; i++) {
            const e = this.cellsArray[i];
            if (e.ownerId === id && !e.killedBy) {
                score += e.mass;
            }
        }
        return Math.floor(score);
    }

    getLeaderboard() {
        const scores = new Map();
        for (let i = 0; i < this.cellsArray.length; i++) {
            const c = this.cellsArray[i];
            if (!c.killedBy) {
                scores.set(c.ownerId, (scores.get(c.ownerId) || 0) + c.mass);
            }
        }

        const entries = [];
        for (let [id, score] of scores.entries()) {
            const p = this.players.get(id);
            if (p && score > 0) {
                entries.push({ id, name: p.name, score: Math.floor(score) });
            }
        }

        entries.sort((a, b) => b.score - a.score);
        return entries.slice(0, 10);
    }

    splitPlayer(ownerId) {
        const myCells = [];
        for (let i = 0; i < this.cellsArray.length; i++) {
            const c = this.cellsArray[i];
            if (c.ownerId === ownerId && !c.killedBy) {
                myCells.push(c);
            }
        }
        
        if (myCells.length === 0 || myCells.length >= Config.MAX_CELLS) return;

        // Sort descending by mass so largest split first
        myCells.sort((a, b) => b.mass - a.mass);

        for (let cell of myCells) {
            if (cell.mass < Config.MIN_SPLIT_MASS) continue;
            if (myCells.length >= Config.MAX_CELLS) break;

            const halfMass = Math.floor(cell.mass / 2);
            cell.mass = cell.mass - halfMass;
            cell.setMergeTime();
            cell.jiggle(Math.random() * Math.PI * 2, 2.0);

            let dx = cell.targetX - cell.x;
            let dy = cell.targetY - cell.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) { dx = 1; dy = 0; dist = 1; }

            const dirX = dx / dist;
            const dirY = dy / dist;

            const spawnX = cell.x + dirX * (cell.radius * 0.8);
            const spawnY = cell.y + dirY * (cell.radius * 0.8);

            const newCell = new Cell(this.getId(), cell.ownerId, cell.name, spawnX, spawnY, halfMass, cell.color);
            newCell.isBot = cell.isBot;
            newCell.vx = dirX * Config.SPLIT_SPEED;
            newCell.vy = dirY * Config.SPLIT_SPEED;
            newCell.targetX = cell.targetX;
            newCell.targetY = cell.targetY;
            newCell.setMergeTime();
            newCell.jiggle(Math.atan2(dirY, dirX), 2.5);

            this.entities.push(newCell);
            myCells.push(newCell);
        }
    }

    ejectMass(ownerId) {
        for (let i = 0; i < this.cellsArray.length; i++) {
            const cell = this.cellsArray[i];
            if (cell.ownerId !== ownerId || cell.killedBy) continue;
            if (cell.mass < Config.MIN_EJECT_MASS) continue;

            cell.mass -= Config.EJECTED_MASS;
            cell.jiggle(Math.random() * Math.PI * 2, 0.8);

            let dx = cell.targetX - cell.x;
            let dy = cell.targetY - cell.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) { dx = 1; dy = 0; dist = 1; }

            const dirX = dx / dist;
            const dirY = dy / dist;

            const spawnX = cell.x + dirX * (cell.radius + 6);
            const spawnY = cell.y + dirY * (cell.radius + 6);

            const vx = dirX * Config.EJECT_SPEED;
            const vy = dirY * Config.EJECT_SPEED;

            this.entities.push(new EjectedMass(this.getId(), spawnX, spawnY, cell.color, vx, vy));
        }
    }

    update(dt) {
        this.motherCellTick++;

        // Fast entity type filtering & spatial grid update
        this.buildGrid();

        // Count current populations
        let foodCount = 0;
        let motherCellCount = 0;
        let virusCount = 0;
        let bossCount = 0;

        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.killedBy) continue;
            if (e.type === 'food') foodCount++;
            else if (e.type === 'mothercell') motherCellCount++;
            else if (e.type === 'virus') virusCount++;
        }

        for (let i = 0; i < this.bots.length; i++) {
            if (this.bots[i].isBoss) bossCount++;
        }

        // Replenish bots smoothly
        while (this.bots.length < Config.MAX_BOTS) {
            this.addBot(bossCount < 2);
            if (bossCount < 2) bossCount++;
        }

        // Replenish food aggressively to keep floor dense with pellets
        let foodDeficit = Config.MAX_FOOD - foodCount;
        if (foodDeficit > 0) {
            let toSpawn = Math.min(60, foodDeficit);
            while (toSpawn > 0) {
                this.spawnFood();
                toSpawn--;
            }
        }

        // Replenish viruses
        while (virusCount < Config.MAX_VIRUSES) {
            this.spawnVirus();
            virusCount++;
        }

        // Replenish mother cells if needed
        while (motherCellCount < Config.MAX_MOTHER_CELLS) {
            this.spawnMotherCell();
            motherCellCount++;
        }

        // Update bot AI
        for (let i = 0; i < this.bots.length; i++) {
            this.bots[i].update();
        }

        // Update all entities
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].update(dt);
        }

        // Mother Cell continuous food fountain & stabilization
        for (let i = 0; i < this.staticsArray.length; i++) {
            const stat = this.staticsArray[i];
            if (stat.type !== 'mothercell' || stat.killedBy) continue;

            stat.spawnTimer = (stat.spawnTimer || 0) + 1;
            // Eject a food pellet every 4 frames outward into the arena
            if (stat.spawnTimer >= 4) {
                stat.spawnTimer = 0;
                if (foodCount < Config.MAX_FOOD + 400) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = MathUtils.randomRange(14, 26);
                    const spawnX = stat.x + Math.cos(angle) * (stat.radius + 8);
                    const spawnY = stat.y + Math.sin(angle) * (stat.radius + 8);

                    const f = new Food(this.getId(), spawnX, spawnY, MathUtils.getRandomColor());
                    f.vx = Math.cos(angle) * speed;
                    f.vy = Math.sin(angle) * speed;
                    this.entities.push(f);
                    foodCount++;
                }
            }

            // If mother cell reached max mass, burst into a large nova of pellets
            if (stat.mass >= Config.MOTHER_CELL_MAX_MASS) {
                stat.mass = Config.MOTHER_CELL_MASS;
                for (let p = 0; p < 32; p++) {
                    const angle = (p / 32) * Math.PI * 2 + (Math.random() * 0.1);
                    const speed = MathUtils.randomRange(18, 34);
                    const spawnX = stat.x + Math.cos(angle) * (stat.radius + 10);
                    const spawnY = stat.y + Math.sin(angle) * (stat.radius + 10);
                    const f = new Food(this.getId(), spawnX, spawnY, MathUtils.getRandomColor());
                    f.vx = Math.cos(angle) * speed;
                    f.vy = Math.sin(angle) * speed;
                    this.entities.push(f);
                }
            }
        }

        this.checkCollisions();

        // Clean dead entities efficiently
        const aliveBots = new Set();
        const activeEntities = [];

        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.killedBy !== null) continue;

            activeEntities.push(e);
            if (e.type === 'cell' && e.ownerId.startsWith("bot_")) {
                aliveBots.add(e.ownerId);
            }
        }
        this.entities = activeEntities;

        // Clean dead bots
        this.bots = this.bots.filter(b => aliveBots.has(b.id));
    }

    buildGrid() {
        // Clear bins
        for (let i = 0; i < this.numBins; i++) {
            this.grid[i].length = 0;
        }

        this.cellsArray.length = 0;
        this.ejectedArray.length = 0;
        this.staticsArray.length = 0;

        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (e.killedBy) continue;

            if (e.type === 'cell') this.cellsArray.push(e);
            else if (e.type === 'ejected') this.ejectedArray.push(e);
            else if (e.type === 'virus' || e.type === 'mothercell') this.staticsArray.push(e);

            const gx = Math.max(0, Math.min(this.gridCols - 1, Math.floor(e.x / this.gridSize)));
            const gy = Math.max(0, Math.min(this.gridCols - 1, Math.floor(e.y / this.gridSize)));
            this.grid[gy * this.gridCols + gx].push(e);
        }
    }

    queryGrid(x, y, radius) {
        this.queryResult.length = 0;
        const minGx = Math.max(0, Math.floor((x - radius) / this.gridSize));
        const maxGx = Math.min(this.gridCols - 1, Math.floor((x + radius) / this.gridSize));
        const minGy = Math.max(0, Math.floor((y - radius) / this.gridSize));
        const maxGy = Math.min(this.gridCols - 1, Math.floor((y + radius) / this.gridSize));

        for (let gy = minGy; gy <= maxGy; gy++) {
            const rowOffset = gy * this.gridCols;
            for (let gx = minGx; gx <= maxGx; gx++) {
                const bin = this.grid[rowOffset + gx];
                for (let i = 0; i < bin.length; i++) {
                    this.queryResult.push(bin[i]);
                }
            }
        }
        return this.queryResult;
    }

    checkCollisions() {
        for (let i = 0; i < this.cellsArray.length; i++) {
            const cell = this.cellsArray[i];
            if (cell.killedBy) continue;

            const searchRadius = Math.max(cell.radius * 2, 250);
            const nearby = this.queryGrid(cell.x, cell.y, searchRadius);

            for (let j = 0; j < nearby.length; j++) {
                const other = nearby[j];
                if (cell.id === other.id || other.killedBy) continue;

                const rSum = cell.radius + other.radius;
                const dx = cell.x - other.x;
                const dy = cell.y - other.y;

                // AABB fast reject
                if (Math.abs(dx) > rSum || Math.abs(dy) > rSum) continue;

                const distSq = dx * dx + dy * dy;
                if (distSq > rSum * rSum) continue;

                let dist = Math.sqrt(distSq);
                if (dist === 0) {
                    dist = 0.1;
                }

                // Handle cell-cell collision with same owner (recombination vs soft elastic push)
                if (other.type === 'cell' && cell.ownerId === other.ownerId) {
                    if (cell.timeToMerge === 0 && other.timeToMerge === 0) {
                        // Cells are ready to recombine
                        if (dist < rSum * 0.95) {
                            if (cell.mass >= other.mass) {
                                cell.mass += other.mass;
                                other.killedBy = cell.id;
                                cell.jiggle(Math.atan2(dy, dx), 1.5);
                            } else {
                                other.mass += cell.mass;
                                cell.killedBy = other.id;
                                other.jiggle(Math.atan2(-dy, -dx), 1.5);
                            }
                        }
                    } else {
                        // Elastic separation to prevent overlapping own split pieces
                        if (dist < rSum) {
                            const overlap = rSum - dist;
                            const pushForce = overlap * 0.45;
                            const pushX = (dx / dist) * pushForce;
                            const pushY = (dy / dist) * pushForce;

                            const totalM = cell.mass + other.mass;
                            cell.x += pushX * (other.mass / totalM);
                            cell.y += pushY * (other.mass / totalM);
                            other.x -= pushX * (cell.mass / totalM);
                            other.y -= pushY * (cell.mass / totalM);
                        }
                    }
                    continue;
                }

                // Eating logic: center of smaller cell must be inside perimeter of larger cell
                if (dist < cell.radius) {
                    const angle = Math.atan2(dy, dx);

                    if (other.type === 'food') {
                        cell.mass += other.mass;
                        other.killedBy = cell.id;
                        cell.jiggle(angle, 0.4);
                        continue;
                    }

                    if (other.type === 'ejected') {
                        if (cell.mass > other.mass * 1.1) {
                            cell.mass += other.mass;
                            other.killedBy = cell.id;
                            cell.jiggle(angle, 0.8);
                        }
                        continue;
                    }

                    // Immunity check (0.8 seconds on spawn)
                    const cellImmune = cell.spawnTime && (Date.now() - cell.spawnTime < (Config.SPAWN_IMMUNITY_MS || 800));
                    const otherImmune = other.spawnTime && (Date.now() - other.spawnTime < (Config.SPAWN_IMMUNITY_MS || 800));

                    if (other.type === 'cell') {
                        if (cellImmune || otherImmune) continue;
                        if (cell.mass > other.mass * 1.15) {
                            cell.mass += other.mass;
                            other.killedBy = cell.id;
                            cell.jiggle(angle, 2.0);
                        }
                    } else if (other.type === 'virus') {
                        if (cellImmune) continue;
                        if (cell.mass > other.mass * 1.15) {
                            // Cell pops into pieces!
                            this.popCell(cell);
                            other.killedBy = cell.id;
                        }
                    } else if (other.type === 'mothercell') {
                        if (cellImmune) continue;
                        if (cell.mass < 30) {
                            // Tiny cell gets eaten directly by mother cell
                            other.mass = Math.min(Config.MOTHER_CELL_MAX_MASS, other.mass + cell.mass);
                            cell.killedBy = other.id;
                        } else {
                            // Cells >= 30 mass pop on mother cell into pieces
                            this.popCell(cell);
                            other.mass = Math.min(Config.MOTHER_CELL_MAX_MASS, other.mass + Math.min(40, cell.mass * 0.15));
                            // Mother cell stays alive as the permanent arena spawner fixture!
                        }
                    }
                }
            }
        }

        // Virus and Mother Cell eating ejected mass
        for (let i = 0; i < this.ejectedArray.length; i++) {
            const mass = this.ejectedArray[i];
            if (mass.killedBy) continue;

            for (let j = 0; j < this.staticsArray.length; j++) {
                const stat = this.staticsArray[j];
                if (stat.killedBy) continue;

                const rSum = mass.radius + stat.radius;
                const dx = mass.x - stat.x;
                const dy = mass.y - stat.y;

                if (Math.abs(dx) > rSum || Math.abs(dy) > rSum) continue;

                const distSq = dx * dx + dy * dy;
                if (distSq < rSum * rSum) {
                    if (stat.type === 'virus') {
                        stat.mass += mass.mass;
                        mass.killedBy = stat.id;
                        if (stat.mass >= Config.VIRUS_MAX_MASS) {
                            this.splitVirus(stat, mass.vx, mass.vy);
                        }
                    } else if (stat.type === 'mothercell') {
                        stat.mass = Math.min(Config.MOTHER_CELL_MAX_MASS, stat.mass + mass.mass * 0.5);
                        mass.killedBy = stat.id;
                        // Spray food pellets in response to being fed!
                        for (let k = 0; k < 5; k++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = MathUtils.randomRange(16, 30);
                            const spawnX = stat.x + Math.cos(angle) * (stat.radius + 8);
                            const spawnY = stat.y + Math.sin(angle) * (stat.radius + 8);
                            const f = new Food(this.getId(), spawnX, spawnY, MathUtils.getRandomColor());
                            f.vx = Math.cos(angle) * speed;
                            f.vy = Math.sin(angle) * speed;
                            this.entities.push(f);
                        }
                    }
                }
            }
        }
    }

    popCell(cell) {
        // Explode into up to 16 pieces distributed radially
        const existingCount = this.cellsArray.filter(c => c.ownerId === cell.ownerId && !c.killedBy).length;
        const maxNewPieces = Math.max(1, Config.MAX_CELLS - existingCount);
        const numPieces = Math.min(10, maxNewPieces);

        const pieceMass = cell.mass / (numPieces + 1);
        if (pieceMass < Config.START_MASS) return;

        cell.mass = pieceMass;
        cell.setMergeTime();
        cell.jiggle(Math.random() * Math.PI * 2, 3.0);

        for (let i = 0; i < numPieces; i++) {
            const angle = (i / numPieces) * Math.PI * 2 + Math.random() * 0.2;
            const newCell = new Cell(this.getId(), cell.ownerId, cell.name, cell.x, cell.y, pieceMass, cell.color);
            newCell.vx = Math.cos(angle) * Config.SPLIT_SPEED;
            newCell.vy = Math.sin(angle) * Config.SPLIT_SPEED;
            newCell.targetX = cell.targetX;
            newCell.targetY = cell.targetY;
            newCell.setMergeTime();
            newCell.jiggle(angle, 3.0);
            this.entities.push(newCell);
        }
    }

    splitVirus(virus, hitVx, hitVy) {
        virus.mass = Config.VIRUS_MASS;

        let dist = Math.sqrt(hitVx * hitVx + hitVy * hitVy);
        if (dist === 0) { hitVx = 1; hitVy = 0; dist = 1; }

        const dirX = hitVx / dist;
        const dirY = hitVy / dist;

        const spawnX = virus.x + dirX * (virus.radius + 14);
        const spawnY = virus.y + dirY * (virus.radius + 14);

        const newVirus = new Virus(this.getId(), spawnX, spawnY);
        newVirus.vx = dirX * (Config.SPLIT_SPEED * 0.9);
        newVirus.vy = dirY * (Config.SPLIT_SPEED * 0.9);
        this.entities.push(newVirus);
    }
}

if (typeof module !== 'undefined') module.exports = Game;

class BotAI {
    constructor(game, id, name, color) {
        this.game = game;
        this.id = id;
        this.name = name;
        this.color = color;
        this.tickCount = Math.floor(Math.random() * Config.BOT_UPDATE_INTERVAL); // Stagger bot thinking
        this.targetX = MathUtils.randomRange(500, Config.MAP_WIDTH - 500);
        this.targetY = MathUtils.randomRange(500, Config.MAP_HEIGHT - 500);
        this.personality = Math.random() < 0.6 ? 'aggro' : 'timid';
        this.isBoss = false;
    }

    update() {
        this.tickCount++;
        
        // Stagger updates to keep framerate solid 60fps
        if (this.tickCount % Config.BOT_UPDATE_INTERVAL !== 0) {
            this.applyTarget();
            return;
        }

        const myCells = [];
        let myMass = 0;
        let cx = 0, cy = 0;

        for (let i = 0; i < this.game.cellsArray.length; i++) {
            const cell = this.game.cellsArray[i];
            if (cell.ownerId === this.id && !cell.killedBy) {
                myCells.push(cell);
                myMass += cell.mass;
                cx += cell.x * cell.mass;
                cy += cell.y * cell.mass;
            }
        }

        if (myCells.length === 0 || myMass === 0) return;

        cx /= myMass;
        cy /= myMass;

        const visionRadius = this.isBoss ? 1600 : (this.personality === 'timid' ? 1400 : 1100);
        const nearby = this.game.queryGrid(cx, cy, visionRadius);

        let bestFood = null;
        let bestFoodDistSq = Infinity;

        let bestPrey = null;
        let bestPreyScore = -Infinity;

        let worstThreat = null;
        let worstThreatDistSq = Infinity;

        for (let i = 0; i < nearby.length; i++) {
            const entity = nearby[i];
            if (entity.ownerId === this.id || entity.killedBy) continue;

            const dx = entity.x - cx;
            const dy = entity.y - cy;

            if (Math.abs(dx) > visionRadius || Math.abs(dy) > visionRadius) continue;

            const distSq = dx * dx + dy * dy;
            if (distSq > visionRadius * visionRadius) continue;

            if (entity.type === 'food' || entity.type === 'ejected') {
                if (distSq < bestFoodDistSq) {
                    bestFoodDistSq = distSq;
                    bestFood = entity;
                }
            } else if (entity.type === 'virus' || entity.type === 'mothercell') {
                // Threat if we are large enough to be popped
                if (myMass > entity.mass * 1.15) {
                    if (distSq < worstThreatDistSq) {
                        worstThreatDistSq = distSq;
                        worstThreat = entity;
                    }
                }
            } else if (entity.type === 'cell') {
                if (entity.mass > myMass * 1.15) {
                    // Threat cell
                    if (distSq < worstThreatDistSq) {
                        worstThreatDistSq = distSq;
                        worstThreat = entity;
                    }
                } else if (myMass > entity.mass * 1.15) {
                    // Prey cell
                    const score = entity.mass / (Math.sqrt(distSq) + 1);
                    if (score > bestPreyScore) {
                        bestPreyScore = score;
                        bestPrey = entity;
                    }
                }
            }
        }

        let isEvading = false;

        // 1. Evade Threats
        if (worstThreat) {
            const threatDist = Math.sqrt(worstThreatDistSq);
            const panicDist = this.personality === 'timid' ? 1000 : (this.isBoss ? 450 : 700);

            if (threatDist < panicDist) {
                let dx = cx - worstThreat.x;
                let dy = cy - worstThreat.y;
                if (dx === 0 && dy === 0) { dx = 1; dy = 1; }
                const dist = Math.sqrt(dx * dx + dy * dy);

                this.targetX = cx + (dx / dist) * 800;
                this.targetY = cy + (dy / dist) * 800;
                isEvading = true;
            }
        }

        // 2. Hunt Prey
        if (!isEvading && bestPrey) {
            this.targetX = bestPrey.x;
            this.targetY = bestPrey.y;

            // Split kill check
            const dist = Math.sqrt((bestPrey.x - cx) ** 2 + (bestPrey.y - cy) ** 2);
            if (myCells.length < Config.MAX_CELLS && myMass > bestPrey.mass * 2.4 && dist < 500 && Math.random() < 0.15) {
                this.game.splitPlayer(this.id);
            }
            isEvading = true;
        }

        // 3. Forage Food
        if (!isEvading && bestFood) {
            this.targetX = bestFood.x;
            this.targetY = bestFood.y;
            isEvading = true;
        }

        // 4. Wall Avoidance
        const wallMargin = 300;
        if (cx < wallMargin) this.targetX = cx + 600;
        else if (cx > Config.MAP_WIDTH - wallMargin) this.targetX = cx - 600;
        if (cy < wallMargin) this.targetY = cy + 600;
        else if (cy > Config.MAP_HEIGHT - wallMargin) this.targetY = cy - 600;

        // 5. Gentle wander
        if (!isEvading && Math.random() < 0.08) {
            this.targetX = cx + MathUtils.randomRange(-600, 600);
            this.targetY = cy + MathUtils.randomRange(-600, 600);
        }

        this.targetX = Math.max(100, Math.min(Config.MAP_WIDTH - 100, this.targetX));
        this.targetY = Math.max(100, Math.min(Config.MAP_HEIGHT - 100, this.targetY));

        this.applyTarget();
    }

    applyTarget() {
        for (let i = 0; i < this.game.cellsArray.length; i++) {
            const cell = this.game.cellsArray[i];
            if (cell.ownerId === this.id && !cell.killedBy) {
                cell.targetX = this.targetX;
                cell.targetY = this.targetY;
            }
        }
    }
}

if (typeof module !== 'undefined') module.exports = BotAI;

class BotAI {
    constructor(game, id, name, color) {
        this.game = game;
        this.id = id;
        this.name = name;
        this.color = color;
        this.tickCount = Math.floor(Math.random() * (Config.BOT_UPDATE_INTERVAL || 3));
        
        // Distribution: 50% noob, 35% casual, 15% veteran
        const rand = Math.random();
        if (rand < 0.50) {
            this.personality = 'noob';
            this.turnSpeed = 0.10;
        } else if (rand < 0.85) {
            this.personality = 'casual';
            this.turnSpeed = 0.16;
        } else {
            this.personality = 'veteran';
            this.turnSpeed = 0.22;
        }

        this.targetX = MathUtils.randomRange(500, Config.MAP_WIDTH - 500);
        this.targetY = MathUtils.randomRange(500, Config.MAP_HEIGHT - 500);
        this.smoothX = this.targetX;
        this.smoothY = this.targetY;
        this.isBoss = false;
        this.wanderTimer = 0;
    }

    update() {
        this.tickCount++;
        
        // Smooth mouse steering towards target every tick for human-like fluid movement
        this.smoothX = MathUtils.lerp(this.smoothX, this.targetX, this.turnSpeed);
        this.smoothY = MathUtils.lerp(this.smoothY, this.targetY, this.turnSpeed);
        this.applyTarget();

        // Stagger decision-making intervals to maintain 60 FPS
        const interval = Config.BOT_UPDATE_INTERVAL || 3;
        if (this.tickCount % interval !== 0) return;

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

        // Vision profiles
        let visionRadius = 800;
        let threatPanicDist = 480;

        if (this.personality === 'noob') {
            visionRadius = 550;
            threatPanicDist = 380; // Noobs are oblivious until predator is close!
        } else if (this.personality === 'casual') {
            visionRadius = 850;
            threatPanicDist = 520;
        } else { // veteran / boss
            visionRadius = this.isBoss ? 1500 : 1100;
            threatPanicDist = this.isBoss ? 450 : 640;
        }

        const nearby = this.game.queryGrid(cx, cy, visionRadius);

        let bestFood = null;
        let bestFoodDistSq = Infinity;

        let bestPrey = null;
        let bestPreyScore = -Infinity;

        let worstThreat = null;
        let worstThreatDistSq = Infinity;

        let nearestVirus = null;
        let nearestVirusDistSq = Infinity;

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
                if (distSq < nearestVirusDistSq) {
                    nearestVirusDistSq = distSq;
                    nearestVirus = entity;
                }
                // Threat to big cells that could pop
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

        let desiredDirX = 0;
        let desiredDirY = 0;
        let hasPriority = false;

        // 1. Evade Threats (Predators or dangerous Viruses/MotherCells)
        if (worstThreat) {
            const threatDist = Math.sqrt(worstThreatDistSq);
            if (threatDist < threatPanicDist) {
                let dx = cx - worstThreat.x;
                let dy = cy - worstThreat.y;
                if (dx === 0 && dy === 0) { dx = 1; dy = 1; }
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Run away vector
                desiredDirX += (dx / dist) * 1.5;
                desiredDirY += (dy / dist) * 1.5;
                hasPriority = true;
            }
        }

        // 2. Hunt Prey (Only casuals & veterans actively chase)
        if (!hasPriority && bestPrey && this.personality !== 'noob') {
            const dx = bestPrey.x - cx;
            const dy = bestPrey.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 1) {
                desiredDirX += (dx / dist);
                desiredDirY += (dy / dist);
                hasPriority = true;
            }

            // Opportunistic Split Kill for Veterans
            if (this.personality === 'veteran' && myCells.length < Config.MAX_CELLS) {
                if (myMass > bestPrey.mass * 2.3 && dist > 160 && dist < 380) {
                    // Check if virus is in the line of fire
                    let virusInWay = false;
                    if (nearestVirus && Math.sqrt(nearestVirusDistSq) < dist + 100) {
                        virusInWay = true;
                    }
                    if (!virusInWay && Math.random() < 0.25) {
                        this.game.splitPlayer(this.id);
                    }
                }
            }
        }

        // 3. Forage Food (Noobs and casuals love munching)
        if (!hasPriority && bestFood) {
            const dx = bestFood.x - cx;
            const dy = bestFood.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                desiredDirX += (dx / dist);
                desiredDirY += (dy / dist);
                hasPriority = true;
            }
        }

        // 4. Smooth Wall Deflection (Never get stuck bouncing head-on into borders)
        const wallMargin = 400;
        if (cx < wallMargin) desiredDirX += (wallMargin - cx) / wallMargin * 1.8;
        else if (cx > Config.MAP_WIDTH - wallMargin) desiredDirX -= (cx - (Config.MAP_WIDTH - wallMargin)) / wallMargin * 1.8;

        if (cy < wallMargin) desiredDirY += (wallMargin - cy) / wallMargin * 1.8;
        else if (cy > Config.MAP_HEIGHT - wallMargin) desiredDirY -= (cy - (Config.MAP_HEIGHT - wallMargin)) / wallMargin * 1.8;

        // 5. Gentle wander if idle or noob wandering
        this.wanderTimer++;
        if (!hasPriority || (this.personality === 'noob' && this.wanderTimer % 20 === 0)) {
            const wanderAngle = Math.random() * Math.PI * 2;
            desiredDirX += Math.cos(wanderAngle) * 0.4;
            desiredDirY += Math.sin(wanderAngle) * 0.4;
        }

        // Calculate final target coordinates
        const mag = Math.sqrt(desiredDirX * desiredDirX + desiredDirY * desiredDirY);
        if (mag > 0.01) {
            const targetDistance = this.personality === 'noob' ? 350 : 600;
            this.targetX = cx + (desiredDirX / mag) * targetDistance;
            this.targetY = cy + (desiredDirY / mag) * targetDistance;
        }

        // Clamp safely within boundaries
        this.targetX = Math.max(120, Math.min(Config.MAP_WIDTH - 120, this.targetX));
        this.targetY = Math.max(120, Math.min(Config.MAP_HEIGHT - 120, this.targetY));
    }

    applyTarget() {
        for (let i = 0; i < this.game.cellsArray.length; i++) {
            const cell = this.game.cellsArray[i];
            if (cell.ownerId === this.id && !cell.killedBy) {
                cell.targetX = this.smoothX;
                cell.targetY = this.smoothY;
            }
        }
    }
}

if (typeof module !== 'undefined') module.exports = BotAI;
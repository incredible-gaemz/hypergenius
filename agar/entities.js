class Entity {
    constructor(id, x, y, mass, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.killedBy = null;
        this.type = 'entity';
    }

    get radius() {
        return MathUtils.massToRadius(this.mass);
    }

    update(dt) {
        const dtClamped = Math.min(dt || 16.666, 50);
        const timeScale = dtClamped / 16.666;
        
        if (this.displayRadius === undefined) {
            this.displayRadius = this.radius;
        }
        // Smoothly interpolate visual size
        this.displayRadius = MathUtils.lerp(this.displayRadius, this.radius, 0.12 * timeScale);

        // Apply velocity (momentum)
        this.x += this.vx * timeScale;
        this.y += this.vy * timeScale;

        // Apply friction/decay to velocity
        const decay = Math.pow(Config.SPEED_DECAY, timeScale);
        this.vx *= decay;
        this.vy *= decay;

        if (Math.abs(this.vx) < 0.05) this.vx = 0;
        if (Math.abs(this.vy) < 0.05) this.vy = 0;

        // Keep within bounds
        const r = this.radius;
        this.x = Math.max(r, Math.min(Config.MAP_WIDTH - r, this.x));
        this.y = Math.max(r, Math.min(Config.MAP_HEIGHT - r, this.y));
    }
}

class Food extends Entity {
    constructor(id, x, y, color) {
        super(id, x, y, Config.FOOD_MASS, color);
        this.type = 'food';
    }
}

class Virus extends Entity {
    constructor(id, x, y) {
        super(id, x, y, Config.VIRUS_MASS, '#33ff33');
        this.type = 'virus';
        this.wobble = Math.random() * Math.PI * 2;
        this.spikes = 32;
    }

    update(dt) {
        super.update(dt);
        this.wobble += 0.03;
    }
}

class MotherCell extends Entity {
    constructor(id, x, y) {
        // Authentic Agar experimental mother cell: rich terracotta / crimson-brown
        super(id, x, y, Config.MOTHER_CELL_MASS, '#cd5344');
        this.type = 'mothercell';
        this.wobble = Math.random() * Math.PI * 2;
        this.spikes = 32;
        this.spawnTimer = Math.floor(Math.random() * 6);
    }

    update(dt) {
        super.update(dt);
        const dtClamped = Math.min(dt || 16.666, 50);
        const timeScale = dtClamped / 16.666;

        this.wobble += 0.02 * timeScale;

        // Strict mass cap to prevent infinite ballooning
        if (this.mass > Config.MOTHER_CELL_MAX_MASS) {
            this.mass = Config.MOTHER_CELL_MAX_MASS;
        }

        // If mother cell is above base mass, it slowly sheds excess mass into food pellets
        if (this.mass > Config.MOTHER_CELL_MASS) {
            const excess = this.mass - Config.MOTHER_CELL_MASS;
            this.mass -= excess * 0.005 * timeScale;
        }
    }
}

class EjectedMass extends Entity {
    constructor(id, x, y, color, vx, vy) {
        super(id, x, y, Config.EJECTED_MASS, color);
        this.type = 'ejected';
        this.vx = vx;
        this.vy = vy;
    }
}

class Cell extends Entity {
    constructor(id, ownerId, name, x, y, mass, color) {
        super(id, x, y, mass, color);
        this.ownerId = ownerId;
        this.name = name;
        this.type = 'cell';
        this.targetX = x;
        this.targetY = y;
        this.isBot = false;
        this.timeToMerge = 0;
        this.spawnTime = Date.now();

        // Jiggly blob spring simulation vertices
        this.numPoints = 20;
        this.points = [];
        this.pointVelocities = [];
        for (let i = 0; i < this.numPoints; i++) {
            this.points.push(0);           // Radial offset from base radius
            this.pointVelocities.push(0);   // Radial velocity
        }
        this.jiggleTime = Math.random() * 100;
    }

    jiggle(angle, intensity = 1.0) {
        const step = (Math.PI * 2) / this.numPoints;
        const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const hitIdx = Math.round(normalizedAngle / step) % this.numPoints;
        
        const force = Math.min(this.radius * 0.25, 12 * intensity);
        // Distribute impulse to nearby points
        for (let offset = -3; offset <= 3; offset++) {
            const idx = (hitIdx + offset + this.numPoints) % this.numPoints;
            const weight = Math.cos((offset / 3) * (Math.PI / 2));
            this.pointVelocities[idx] += (offset % 2 === 0 ? force : -force * 0.6) * weight;
        }
    }

    updatePoints(timeScale) {
        const stiffness = 0.08;
        const damping = 0.88;
        const neighborCoupling = 0.25;
        this.jiggleTime += 0.04 * timeScale;

        // Adjust point count based on cell size for smoother curves on giants
        const desiredPoints = this.radius > 120 ? 28 : (this.radius > 60 ? 24 : 18);
        if (this.numPoints !== desiredPoints) {
            this.numPoints = desiredPoints;
            this.points = new Array(desiredPoints).fill(0);
            this.pointVelocities = new Array(desiredPoints).fill(0);
        }

        const len = this.numPoints;
        const nextPoints = new Array(len);

        for (let i = 0; i < len; i++) {
            const prev = (i - 1 + len) % len;
            const next = (i + 1) % len;

            // Neighbor spring force (surface tension)
            const neighborForce = ((this.points[prev] - this.points[i]) + (this.points[next] - this.points[i])) * neighborCoupling;
            
            // Restoring spring force towards 0
            const restoreForce = -this.points[i] * stiffness;

            // Subtle organic breathing wave around the perimeter
            const angle = (i / len) * Math.PI * 2;
            const naturalWobble = Math.sin(this.jiggleTime * 2 + angle * 3) * (this.radius * 0.02);

            this.pointVelocities[i] += (restoreForce + neighborForce) * timeScale;
            this.pointVelocities[i] *= Math.pow(damping, timeScale);

            nextPoints[i] = this.points[i] + (this.pointVelocities[i] + naturalWobble * 0.1) * timeScale;

            // Clamp max displacement
            const maxDisp = this.radius * 0.35;
            if (nextPoints[i] > maxDisp) nextPoints[i] = maxDisp;
            else if (nextPoints[i] < -maxDisp) nextPoints[i] = -maxDisp;
        }

        this.points = nextPoints;
    }

    getPerimeterPoints() {
        const pts = [];
        const baseR = this.displayRadius || this.radius;
        const step = (Math.PI * 2) / this.numPoints;

        // Slight elongation in movement direction (squash & stretch)
        const speedSq = this.vx * this.vx + this.vy * this.vy;
        let stretchAngle = 0;
        let stretchAmount = 0;
        if (speedSq > 0.5) {
            stretchAngle = Math.atan2(this.vy, this.vx);
            stretchAmount = Math.min(0.12, Math.sqrt(speedSq) * 0.005);
        }

        for (let i = 0; i < this.numPoints; i++) {
            const angle = i * step;
            // Stretch along velocity, compress perpendicularly
            const align = Math.cos(angle - stretchAngle);
            const stretchMod = 1 + align * stretchAmount - (1 - Math.abs(align)) * (stretchAmount * 0.5);

            const r = Math.max(2, (baseR + (this.points[i] || 0)) * stretchMod);
            pts.push({
                x: this.x + Math.cos(angle) * r,
                y: this.y + Math.sin(angle) * r
            });
        }
        return pts;
    }

    update(dt) {
        super.update(dt);
        
        const dtClamped = Math.min(dt || 16.666, 50);
        const timeScale = dtClamped / 16.666;
        
        // Recombination timer
        if (this.timeToMerge > 0) {
            this.timeToMerge -= timeScale;
            if (this.timeToMerge < 0) this.timeToMerge = 0;
        }

        // Natural mass decay for larger cells
        if (this.mass > 100) {
            this.mass -= (this.mass * Config.MASS_DECAY_RATE * timeScale) / 60;
        }

        // Smooth steering towards mouse target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 1) {
            // Authentic Agar speed scaling
            const baseSpeed = Config.BASE_SPEED * Math.pow(this.mass, -Config.SPEED_SCALE) * timeScale;
            
            // Smooth arrival without oscillation
            const step = Math.min(baseSpeed, dist * 0.15);
            this.x += (dx / dist) * step;
            this.y += (dy / dist) * step;

            // Turn jiggle: subtle ripple when swinging direction
            const moveDir = Math.atan2(dy, dx);
            if (this.lastMoveDir !== undefined) {
                let turnAngle = moveDir - this.lastMoveDir;
                while (turnAngle > Math.PI) turnAngle -= Math.PI * 2;
                while (turnAngle < -Math.PI) turnAngle += Math.PI * 2;

                if (Math.abs(turnAngle) > 0.08 && dist > 20) {
                    this.jiggle(moveDir + Math.PI, Math.min(1.0, Math.abs(turnAngle) * 2.5));
                }
            }
            this.lastMoveDir = moveDir;
        }

        // Update jiggly skin physics
        this.updatePoints(timeScale);
    }
    
    setMergeTime() {
        const seconds = Config.MERGE_TIME_BASE + (this.mass * Config.MERGE_TIME_SCALE);
        this.timeToMerge = Math.floor(seconds * 60);
    }
}

if (typeof module !== 'undefined') module.exports = { Entity, Food, Virus, MotherCell, EjectedMass, Cell };

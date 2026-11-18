class Renderer {
    constructor(canvas, ctx, game) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.game = game;
        
        this.cameraX = Config.MAP_WIDTH / 2;
        this.cameraY = Config.MAP_HEIGHT / 2;
        this.zoom = 1;
        this.targetZoom = 1;
        this.lastMinimapUpdate = 0;
    }

    updateCamera(playerId) {
        let cx = 0, cy = 0, totalMass = 0;
        let count = 0;
        
        for (let i = 0; i < this.game.entities.length; i++) {
            const e = this.game.entities[i];
            if (e.type === 'cell' && e.ownerId === playerId && !e.killedBy) {
                cx += e.x * e.mass;
                cy += e.y * e.mass;
                totalMass += e.mass;
                count++;
            }
        }
        
        if (count === 0 || totalMass === 0) return;
        
        cx /= totalMass;
        cy /= totalMass;
        
        // Smooth camera interpolation
        this.cameraX = MathUtils.lerp(this.cameraX, cx, 0.1);
        this.cameraY = MathUtils.lerp(this.cameraY, cy, 0.1);
        
        // Zoom out smoothly as mass grows
        const targetZoom = Math.max(0.12, Math.min(1.2, Math.pow(Math.min(64 / totalMass, 1), 0.38) * 1.1));
        this.targetZoom = targetZoom;
        this.zoom = MathUtils.lerp(this.zoom, this.targetZoom, 0.06);
    }

    draw() {
        // Clear background
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        
        // Center camera and scale
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(-this.cameraX, -this.cameraY);

        this.drawGrid();

        // View bounds for culling
        const halfW = (this.canvas.width / 2) / this.zoom;
        const halfH = (this.canvas.height / 2) / this.zoom;
        const viewLeft = this.cameraX - halfW;
        const viewRight = this.cameraX + halfW;
        const viewTop = this.cameraY - halfH;
        const viewBottom = this.cameraY + halfH;

        // View culling: collect visible entities
        const visibleEntities = [];
        const entities = this.game.entities;
        
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.killedBy) continue;
            
            const r = entity.displayRadius !== undefined ? entity.displayRadius : entity.radius;
            if (entity.x + r < viewLeft || entity.x - r > viewRight ||
                entity.y + r < viewTop || entity.y - r > viewBottom) {
                continue;
            }
            visibleEntities.push(entity);
        }

        // Draw in correct z-order: food first, then ejected, then viruses/mothercells, then cells by radius
        visibleEntities.sort((a, b) => {
            if (a.type === 'food' && b.type !== 'food') return -1;
            if (b.type === 'food' && a.type !== 'food') return 1;
            if (a.type === 'ejected' && b.type === 'cell') return -1;
            if (b.type === 'ejected' && a.type === 'cell') return 1;
            return a.radius - b.radius;
        });

        for (let i = 0; i < visibleEntities.length; i++) {
            this.drawEntity(visibleEntities[i]);
        }

        // Draw Map Border
        this.ctx.strokeStyle = '#0f172a';
        this.ctx.lineWidth = 12;
        this.ctx.strokeRect(0, 0, Config.MAP_WIDTH, Config.MAP_HEIGHT);

        this.ctx.restore();
        
        // Draw minimap on HUD
        this.drawMinimap();
    }

    drawGrid() {
        if (this.zoom < 0.1) return;
        
        const gridSize = 60;
        const width = Config.MAP_WIDTH;
        const height = Config.MAP_HEIGHT;
        
        const halfW = (this.canvas.width / 2) / this.zoom;
        const halfH = (this.canvas.height / 2) / this.zoom;
        
        const startX = Math.max(0, Math.floor((this.cameraX - halfW) / gridSize) * gridSize);
        const endX = Math.min(width, Math.ceil((this.cameraX + halfW) / gridSize) * gridSize);
        const startY = Math.max(0, Math.floor((this.cameraY - halfH) / gridSize) * gridSize);
        const endY = Math.min(height, Math.ceil((this.cameraY + halfH) / gridSize) * gridSize);

        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
        this.ctx.lineWidth = 1;

        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();
    }

    drawEntity(entity) {
        if (entity.type === 'food') {
            const r = entity.radius;
            this.ctx.fillStyle = entity.color;
            this.ctx.beginPath();
            this.ctx.arc(entity.x, entity.y, r, 0, Math.PI * 2);
            this.ctx.fill();
            return;
        }

        if (entity.type === 'ejected') {
            const r = entity.radius;
            this.ctx.fillStyle = entity.color;
            this.ctx.beginPath();
            this.ctx.arc(entity.x, entity.y, r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = this.shadeColor(entity.color, -20);
            this.ctx.lineWidth = Math.max(2, r * 0.12);
            this.ctx.stroke();
            return;
        }

        if (entity.type === 'virus') {
            this.drawVirus(entity);
            return;
        }

        if (entity.type === 'mothercell') {
            this.drawMotherCell(entity);
            return;
        }

        // Draw Jiggly Cell
        if (entity.type === 'cell') {
            this.drawJigglyCell(entity);
        }
    }

    drawJigglyCell(cell) {
        this.ctx.save();

        // Spawn immunity visual indicator (0.8s)
        if (cell.spawnTime && Date.now() - cell.spawnTime < (Config.SPAWN_IMMUNITY_MS || 800)) {
            this.ctx.globalAlpha = 0.55;
        }

        // Get jiggly perimeter vertices
        const pts = cell.getPerimeterPoints();
        const len = pts.length;

        this.ctx.beginPath();
        if (len >= 3) {
            let midX = (pts[len - 1].x + pts[0].x) / 2;
            let midY = (pts[len - 1].y + pts[0].y) / 2;
            this.ctx.moveTo(midX, midY);

            for (let i = 0; i < len; i++) {
                const next = pts[(i + 1) % len];
                const nextMidX = (pts[i].x + next.x) / 2;
                const nextMidY = (pts[i].y + next.y) / 2;
                this.ctx.quadraticCurveTo(pts[i].x, pts[i].y, nextMidX, nextMidY);
            }
        } else {
            const r = cell.displayRadius || cell.radius;
            this.ctx.arc(cell.x, cell.y, r, 0, Math.PI * 2);
        }
        this.ctx.closePath();

        // Fill cell
        this.ctx.fillStyle = cell.color;
        this.ctx.fill();

        // Outline
        const borderWidth = Math.max(3, cell.radius * 0.08);
        this.ctx.lineWidth = borderWidth;
        this.ctx.strokeStyle = this.shadeColor(cell.color, -22);
        this.ctx.stroke();

        // Draw Cell Name & Mass
        if (cell.radius > 16) {
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const nameSize = Math.max(11, Math.min(38, cell.radius * 0.35));
            this.ctx.font = `700 ${nameSize}px "Space Grotesk", sans-serif`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
            this.ctx.lineWidth = Math.max(2, nameSize * 0.16);

            const hasName = Boolean(cell.name);
            const nameY = (cell.radius > 32 && hasName) ? cell.y - nameSize * 0.35 : cell.y;

            if (hasName) {
                this.ctx.strokeText(cell.name, cell.x, nameY);
                this.ctx.fillText(cell.name, cell.x, nameY);
            }

            // Draw mass below name if large enough
            if (cell.radius > 28) {
                const massSize = Math.max(9, nameSize * 0.65);
                this.ctx.font = `600 ${massSize}px "JetBrains Mono", monospace`;
                this.ctx.lineWidth = Math.max(2, massSize * 0.16);
                const massY = hasName ? cell.y + massSize * 0.85 : cell.y;
                const massText = Math.floor(cell.mass).toString();
                this.ctx.strokeText(massText, cell.x, massY);
                this.ctx.fillText(massText, cell.x, massY);
            }
        }

        this.ctx.restore();
    }

    drawVirus(virus) {
        const r = virus.displayRadius !== undefined ? virus.displayRadius : virus.radius;
        const spikes = 32;
        const step = (Math.PI * 2) / spikes;
        const outerR = r;
        const innerR = r * 0.88;

        this.ctx.save();
        this.ctx.translate(virus.x, virus.y);
        this.ctx.rotate(Math.sin(virus.wobble || 0) * 0.04);
        this.ctx.lineJoin = 'miter';

        // Sharp sawtooth spiky border
        this.ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
            const angle = i * step;
            const currentR = (i % 2 === 0) ? outerR : innerR;
            this.ctx.lineTo(Math.cos(angle) * currentR, Math.sin(angle) * currentR);
        }
        this.ctx.closePath();

        // Classic Agar vibrant green body
        this.ctx.fillStyle = '#33ff33';
        this.ctx.fill();
        this.ctx.lineWidth = Math.max(3.5, outerR * 0.065);
        this.ctx.strokeStyle = '#22aa22';
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawMotherCell(mc) {
        const r = mc.displayRadius !== undefined ? mc.displayRadius : mc.radius;
        const spikes = 32;
        const step = (Math.PI * 2) / spikes;
        const outerR = r;
        const innerR = r * 0.88;

        this.ctx.save();
        this.ctx.translate(mc.x, mc.y);
        this.ctx.rotate(Math.sin(mc.wobble || 0) * 0.03);
        this.ctx.lineJoin = 'miter';

        // Sharp sawtooth spiky outer membrane
        this.ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
            const angle = i * step;
            const currentR = (i % 2 === 0) ? outerR : innerR;
            this.ctx.lineTo(Math.cos(angle) * currentR, Math.sin(angle) * currentR);
        }
        this.ctx.closePath();

        // Authentic rich terracotta / crimson-brown
        this.ctx.fillStyle = '#cd5344';
        this.ctx.fill();
        this.ctx.lineWidth = Math.max(4, outerR * 0.07);
        this.ctx.strokeStyle = '#8a281e';
        this.ctx.stroke();

        // Clean concentric inner core for subtle depth
        this.ctx.beginPath();
        this.ctx.arc(0, 0, innerR * 0.65, 0, Math.PI * 2);
        this.ctx.fillStyle = '#b34133';
        this.ctx.fill();
        this.ctx.lineWidth = Math.max(2, outerR * 0.03);
        this.ctx.strokeStyle = '#7c2217';
        this.ctx.stroke();

        this.ctx.restore();
    }

    shadeColor(color, percent) {
        if (!color || color[0] !== '#') return color;
        let R = parseInt(color.substring(1,3), 16);
        let G = parseInt(color.substring(3,5), 16);
        let B = parseInt(color.substring(5,7), 16);

        R = Math.min(255, Math.max(0, parseInt(R * (100 + percent) / 100)));
        G = Math.min(255, Math.max(0, parseInt(G * (100 + percent) / 100)));
        B = Math.min(255, Math.max(0, parseInt(B * (100 + percent) / 100)));

        const RR = R.toString(16).padStart(2, '0');
        const GG = G.toString(16).padStart(2, '0');
        const BB = B.toString(16).padStart(2, '0');

        return `#${RR}${GG}${BB}`;
    }

    drawMinimap() {
        if (!this.game) return;
        
        const size = 140;
        const padding = 16;
        const x = this.canvas.width - size - padding;
        const y = this.canvas.height - size - padding;
        
        const now = Date.now();
        if (!this.minimapCanvas || !this.lastMinimapUpdate || now - this.lastMinimapUpdate > 600) {
            this.lastMinimapUpdate = now;
            
            if (!this.minimapCanvas) {
                this.minimapCanvas = document.createElement('canvas');
                this.minimapCanvas.width = size;
                this.minimapCanvas.height = size;
                this.minimapCtx = this.minimapCanvas.getContext('2d');
            }
            
            const mCtx = this.minimapCtx;
            mCtx.clearRect(0, 0, size, size);
            
            // Background
            mCtx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            mCtx.fillRect(0, 0, size, size);
            
            // Border
            mCtx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
            mCtx.lineWidth = 1;
            mCtx.strokeRect(0, 0, size, size);
            
            const scaleX = size / Config.MAP_WIDTH;
            const scaleY = size / Config.MAP_HEIGHT;
            
            for (let i = 0; i < this.game.entities.length; i++) {
                const entity = this.game.entities[i];
                if (entity.killedBy) continue;

                if (entity.type === 'cell') {
                    const mapX = entity.x * scaleX;
                    const mapY = entity.y * scaleY;
                    const mapR = Math.max(1.5, entity.radius * scaleX);
                    
                    mCtx.beginPath();
                    mCtx.arc(mapX, mapY, mapR, 0, Math.PI * 2);
                    
                    if (typeof myId !== 'undefined' && entity.ownerId === myId) {
                        mCtx.fillStyle = '#ffffff';
                        mCtx.strokeStyle = '#000000';
                        mCtx.lineWidth = 1;
                        mCtx.stroke();
                    } else {
                        mCtx.fillStyle = entity.color;
                    }
                    mCtx.fill();
                } else if (entity.type === 'mothercell') {
                    const mapX = entity.x * scaleX;
                    const mapY = entity.y * scaleY;
                    const mapR = Math.max(1.5, entity.radius * scaleX);
                    mCtx.beginPath();
                    mCtx.arc(mapX, mapY, mapR, 0, Math.PI * 2);
                    mCtx.fillStyle = '#cd5344';
                    mCtx.fill();
                }
            }
        }
        
        this.ctx.save();
        if (this.minimapCanvas) {
            this.ctx.drawImage(this.minimapCanvas, x, y);
        }
        
        // Draw Viewport on Minimap
        const scaleX = size / Config.MAP_WIDTH;
        const scaleY = size / Config.MAP_HEIGHT;
        const viewWidth = this.canvas.width / this.zoom;
        const viewHeight = this.canvas.height / this.zoom;
        const viewX = this.cameraX - viewWidth / 2;
        const viewY = this.cameraY - viewHeight / 2;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(
            x + viewX * scaleX, 
            y + viewY * scaleY, 
            viewWidth * scaleX, 
            viewHeight * scaleY
        );
        this.ctx.restore();
    }
}

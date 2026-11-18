class Player {
    constructor(game, id, name, color) {
        this.game = game;
        this.id = id;
        this.name = name;
        this.color = color;
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
    }

    updateTarget(cameraX, cameraY, zoom, screenW, screenH) {
        // Convert screen coordinates to world coordinates
        const worldX = (this.mouseX - screenW / 2) / zoom + cameraX;
        const worldY = (this.mouseY - screenH / 2) / zoom + cameraY;
        
        for (let i = 0; i < this.game.cellsArray.length; i++) {
            const cell = this.game.cellsArray[i];
            if (cell.ownerId === this.id && !cell.killedBy) {
                cell.targetX = worldX;
                cell.targetY = worldY;
            }
        }
    }
}

if (typeof module !== 'undefined') module.exports = { Player };

/** Treasure chest event — spawns a high-reward enemy periodically. */
export class TreasureEventManager {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
        this.game = game;
        this.intervalMs = 90000;
        this.lastSpawnTime = 0;
        this.treasuresOpened = 0;
    }

    reset() {
        this.lastSpawnTime = Date.now();
        this.treasuresOpened = 0;
    }

    /** @param {number} now */
    tick(now) {
        const s = this.game.state;
        if (s.gamePaused || s.gameOver) return;
        if (now - this.lastSpawnTime < this.intervalMs) return;

        this.lastSpawnTime = now;
        this.game.spawnTreasureChest();
    }

    recordOpen() {
        this.treasuresOpened += 1;
    }
}

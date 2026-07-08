/** Tracks consecutive kills for EXP/gold bonuses. */
export class KillStreakTracker {
    constructor() {
        this.streak = 0;
        this.bestStreak = 0;
        this.lastKillTime = 0;
        /** Ms window to maintain streak */
        this.windowMs = 2500;
    }

    reset() {
        this.streak = 0;
        this.bestStreak = 0;
        this.lastKillTime = 0;
    }

    /** @param {number} now @param {number} bonusPerKill @param {number} cap */
    recordKill(now, bonusPerKill, cap) {
        if (this.lastKillTime && now - this.lastKillTime > this.windowMs) {
            this.streak = 0;
        }
        this.streak += 1;
        this.lastKillTime = now;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;
        return Math.min(cap, this.streak * bonusPerKill);
    }

    /** Decay streak when no kills within window (call from game tick). */
    tick(now) {
        if (this.streak > 0 && this.lastKillTime && now - this.lastKillTime > this.windowMs) {
            this.streak = 0;
        }
    }
}

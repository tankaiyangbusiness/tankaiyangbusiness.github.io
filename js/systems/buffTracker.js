/**
 * Timed buff tracker — Path of Exile style icons with remaining duration.
 * Duration buffs dominate; permanent flags are supported for UI-only entries.
 */

/** @typedef {{
 *   id: string,
 *   name: string,
 *   icon: string,
 *   description: string,
 *   startedAt: number,
 *   expiresAt: number,
 *   durationMs: number,
 *   stacks?: number
 * }} ActiveBuff */

export class BuffTracker {
    constructor() {
        /** @type {Map<string, ActiveBuff>} */
        this.buffs = new Map();
    }

    /**
     * @param {object} opts
     * @param {string} opts.id
     * @param {string} opts.name
     * @param {string} opts.icon
     * @param {string} opts.description
     * @param {number} opts.durationMs
     * @param {number} [opts.now]
     * @param {number} [opts.stacks]
     */
    apply(opts) {
        const now = opts.now ?? Date.now();
        const durationMs = Math.max(0, opts.durationMs);
        this.buffs.set(opts.id, {
            id: opts.id,
            name: opts.name,
            icon: opts.icon,
            description: opts.description,
            startedAt: now,
            expiresAt: now + durationMs,
            durationMs,
            stacks: opts.stacks ?? 1
        });
        return this.buffs.get(opts.id);
    }

    /** @param {string} id */
    remove(id) {
        this.buffs.delete(id);
    }

    /** @param {string} id */
    has(id) {
        return this.buffs.has(id);
    }

    /** Expire finished buffs. @param {number} now @returns {string[]} removed ids */
    tick(now) {
        const removed = [];
        for (const [id, buff] of this.buffs) {
            if (buff.durationMs > 0 && now >= buff.expiresAt) {
                this.buffs.delete(id);
                removed.push(id);
            }
        }
        return removed;
    }

    /** Snapshot for HUD rendering. @param {number} now */
    getActiveBuffs(now = Date.now()) {
        return [...this.buffs.values()]
            .filter(b => b.durationMs <= 0 || now < b.expiresAt)
            .map(b => {
                const remainingMs = b.durationMs <= 0
                    ? Infinity
                    : Math.max(0, b.expiresAt - now);
                const remainingRatio = b.durationMs <= 0
                    ? 1
                    : remainingMs / b.durationMs;
                return {
                    ...b,
                    remainingMs,
                    remainingRatio: Math.max(0, Math.min(1, remainingRatio))
                };
            });
    }

    clear() {
        this.buffs.clear();
    }
}

/**
 * Tracks short-lived DOM nodes (skill projectiles, trails) and force-removes them
 * after a max lifetime so orphaned rAF loops cannot leak memory.
 */

/** Default safety TTL for any tracked transient node (ms). */
export const DEFAULT_TRANSIENT_DOM_MAX_MS = 15000;

/**
 * @typedef {object} TransientDomEntry
 * @property {HTMLElement} el
 * @property {number} bornAt
 * @property {() => void} [dispose]
 */

export class TransientDomRegistry {
    /**
     * @param {number} [maxLifetimeMs]
     */
    constructor(maxLifetimeMs = DEFAULT_TRANSIENT_DOM_MAX_MS) {
        this.maxLifetimeMs = Math.max(1000, maxLifetimeMs);
        /** @type {Map<HTMLElement, TransientDomEntry>} */
        this._entries = new Map();
    }

    /**
     * @param {HTMLElement} el
     * @param {() => void} [dispose] Optional extra cleanup (e.g. cancelAnimationFrame).
     */
    track(el, dispose) {
        if (!el) return;
        this._entries.set(el, {
            el,
            bornAt: Date.now(),
            dispose: typeof dispose === 'function' ? dispose : null
        });
    }

    /** @param {HTMLElement} el */
    untrack(el) {
        if (el) this._entries.delete(el);
    }

    /** @param {number} [now] */
    purgeExpired(now = Date.now()) {
        for (const [el, entry] of [...this._entries]) {
            const expired = now - entry.bornAt >= this.maxLifetimeMs;
            const detached = typeof el.isConnected === 'boolean' && !el.isConnected;
            if (expired || detached) {
                this._forceRemove(el, entry);
            }
        }
    }

    clearAll() {
        for (const [el, entry] of [...this._entries]) {
            this._forceRemove(el, entry);
        }
        this._entries.clear();
    }

    /** @returns {number} */
    get size() {
        return this._entries.size;
    }

    /** @param {HTMLElement} el @param {TransientDomEntry} entry */
    _forceRemove(el, entry) {
        try {
            entry.dispose?.();
        } catch { /* noop */ }
        try {
            el?.remove();
        } catch { /* noop */ }
        this._entries.delete(el);
    }
}

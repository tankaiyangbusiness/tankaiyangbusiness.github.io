/**
 * Reusable DOM element pool — acquire/release without create/destroy churn.
 */
export class DomPool {
    /**
     * @param {() => HTMLElement} factory
     * @param {number} [prewarm=0]
     */
    constructor(factory, prewarm = 0) {
        this._factory = factory;
        /** @type {HTMLElement[]} */
        this._free = [];
        for (let i = 0; i < prewarm; i++) {
            this._free.push(this._prepare(this._factory()));
        }
    }

    /** @param {HTMLElement} el */
    _prepare(el) {
        el.style.display = 'none';
        return el;
    }

    /** @returns {HTMLElement} */
    acquire() {
        const el = this._free.pop();
        if (el) {
            el.style.display = '';
            return el;
        }
        return this._factory();
    }

    /** @param {HTMLElement} el */
    release(el) {
        if (!el) return;
        el.style.display = 'none';
        this._free.push(el);
    }

    /** @param {HTMLElement} [container] */
    clear(container) {
        if (container) {
            this._free.forEach(el => {
                if (el.parentElement === container) el.remove();
            });
        }
        this._free = [];
    }
}

/**
 * Lightweight object pool to reduce GC pressure for transient DOM effects.
 */
export class ObjectPool {
    /** @param {() => object} factory @param {(item: object) => void} [reset] @param {number} [initialSize] */
    constructor(factory, reset = null, initialSize = 0) {
        this._factory = factory;
        this._reset = reset;
        this._pool = [];
        for (let i = 0; i < initialSize; i++) {
            this._pool.push(factory());
        }
    }

    acquire() {
        return this._pool.length > 0 ? this._pool.pop() : this._factory();
    }

    release(item) {
        if (this._reset) this._reset(item);
        this._pool.push(item);
    }

    clear() {
        this._pool.length = 0;
    }
}

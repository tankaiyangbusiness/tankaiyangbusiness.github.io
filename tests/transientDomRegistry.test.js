import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TransientDomRegistry, DEFAULT_TRANSIENT_DOM_MAX_MS } from '../js/utils/transientDomRegistry.js';

function createFakeEl() {
    let connected = true;
    return {
        get isConnected() { return connected; },
        remove() { connected = false; },
        parentElement: connected ? {} : null
    };
}

describe('TransientDomRegistry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('force-removes tracked nodes after max lifetime', () => {
        const registry = new TransientDomRegistry(15000);
        const el = createFakeEl();
        const dispose = vi.fn();
        registry.track(el, dispose);

        vi.advanceTimersByTime(14999);
        registry.purgeExpired();
        expect(registry.size).toBe(1);
        expect(dispose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(2);
        registry.purgeExpired();
        expect(registry.size).toBe(0);
        expect(dispose).toHaveBeenCalledTimes(1);
        expect(el.isConnected).toBe(false);
    });

    it('clears all tracked nodes on clearAll', () => {
        const registry = new TransientDomRegistry(DEFAULT_TRANSIENT_DOM_MAX_MS);
        const a = createFakeEl();
        const b = createFakeEl();
        registry.track(a);
        registry.track(b);
        registry.clearAll();
        expect(registry.size).toBe(0);
        expect(a.isConnected).toBe(false);
        expect(b.isConnected).toBe(false);
    });
});

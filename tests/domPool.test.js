import { describe, it, expect } from 'vitest';
import { DomPool } from '../js/utils/domPool.js';

describe('DomPool', () => {
    it('reuses elements instead of allocating each acquire', () => {
        let created = 0;
        const pool = new DomPool(() => {
            created += 1;
            return { style: { display: '' } };
        }, 2);

        const first = pool.acquire();
        const second = pool.acquire();
        pool.release(first);
        const third = pool.acquire();

        expect(created).toBe(2);
        expect(third).toBe(first);
    });
});

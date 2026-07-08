import { describe, it, expect } from 'vitest';
import {
    isBossWave,
    rollBossWaveSwarmCount,
    BOSS_WAVE_INTERVAL,
    BOSS_WAVE_HP_MULT
} from '../js/config/bossWaves.js';

describe('boss wave schedule', () => {
    it('triggers every 10 waves', () => {
        expect(BOSS_WAVE_INTERVAL).toBe(10);
        expect(isBossWave(10)).toBe(true);
        expect(isBossWave(20)).toBe(true);
        expect(isBossWave(1)).toBe(false);
        expect(isBossWave(15)).toBe(false);
    });

    it('rolls a multi-enemy swarm pack', () => {
        for (let i = 0; i < 20; i++) {
            const n = rollBossWaveSwarmCount();
            expect(n).toBeGreaterThanOrEqual(5);
            expect(n).toBeLessThanOrEqual(8);
        }
    });

    it('boosts boss HP markedly', () => {
        expect(BOSS_WAVE_HP_MULT).toBeGreaterThan(2);
    });
});

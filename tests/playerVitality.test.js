import { describe, it, expect } from 'vitest';
import {
    applyPlayerDamage,
    applyPlayerHeal,
    clampPlayerHp,
    isPlayerDefeated,
    resolvePlayerDefeat,
    tickPlayerRegen
} from '../js/systems/playerVitality.js';

function makeStats(overrides = {}) {
    return {
        hp: 100,
        maxHp: 100,
        hpRegen: 12,
        ...overrides
    };
}

function makeState(statsOverrides = {}) {
    return {
        stats: makeStats(statsOverrides),
        healthRegenInterval: 1000,
        healthRegenTime: 0,
        abilityList: { 'Regen To Damage': { level: 0 } }
    };
}

describe('playerVitality', () => {
    it('only treats 0 HP as defeated after clamping', () => {
        const stats = makeStats({ hp: -5 });
        expect(isPlayerDefeated(stats)).toBe(true);
        clampPlayerHp(stats);
        expect(stats.hp).toBe(0);
        expect(resolvePlayerDefeat(stats)).toBe(true);
    });

    it('does not defeat when HP is above 0 after regen in the same tick window', () => {
        const state = makeState({ hp: 4, hpRegen: 12 });
        applyPlayerDamage(state.stats, 16);
        expect(state.stats.hp).toBe(-12);
        tickPlayerRegen(state, 1000);
        expect(state.stats.hp).toBe(0);
        expect(resolvePlayerDefeat(state.stats)).toBe(true);

        const healed = makeState({ hp: 5, hpRegen: 12 });
        applyPlayerDamage(healed.stats, 10);
        tickPlayerRegen(healed, 1000);
        expect(healed.stats.hp).toBe(7);
        expect(resolvePlayerDefeat(healed.stats)).toBe(false);
    });

    it('simulates late-tick bomber damage healed by end-of-tick regen', () => {
        const state = makeState({ hp: 20, hpRegen: 12 });
        applyPlayerDamage(state.stats, 25);
        expect(state.stats.hp).toBe(-5);
        tickPlayerRegen(state, 1000);
        expect(state.stats.hp).toBe(7);
        expect(resolvePlayerDefeat(state.stats)).toBe(false);
    });

    it('caps heals and clamps overheal on display stats', () => {
        const stats = makeStats({ hp: 95 });
        applyPlayerHeal(stats, 20);
        expect(stats.hp).toBe(100);
        stats.hp = 140;
        clampPlayerHp(stats);
        expect(stats.hp).toBe(100);
    });
});

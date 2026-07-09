import { describe, it, expect } from 'vitest';
import { GameState } from '../js/game/gameState.js';
import { buildEnemyStats, pickEnemyType, ENEMY_TYPES, BASE_ENEMY_STATS, scaleEnemyDamage, scaleEnemyExp, scaleEnemyHpForDifficulty, computeEnemyEvadeChance } from '../js/config/enemies.js';
import { applyBalanceScale, applyEarlyWaveExpBonus, applyEarlyWaveHpReduction, applyEnemyMovePressure, BALANCE } from '../js/config/balance.js';
import { finalizeEnemyExpStat } from '../js/config/expProgression.js';
import { createAbilityLevelThresholds } from '../js/config/progression.js';
import { clamp, formatTime, calculateExpThreshold, distanceVw } from '../js/utils/math.js';

describe('GameState cleanup', () => {
    it('resets abilityLevelThreshold on each init (no leak)', () => {
        const state = new GameState();
        state.initForCharacter({
            hp: 100, maxHp: 100, buffList: {},
            skills: { fireball: 0, iceNova: 0, lightningArc: 0 }
        });
        const firstLen = state.abilityLevelThreshold.length;

        state.initForCharacter({
            hp: 100, maxHp: 100, buffList: {},
            skills: { fireball: 0, iceNova: 0, lightningArc: 0 }
        });
        expect(state.abilityLevelThreshold.length).toBe(firstLen);
        expect(state.abilityLevelThreshold.length).toBe(30);
    });

    it('initForCharacter clears pause and elapsed state for a fresh run', () => {
        const state = new GameState();
        state.gamePaused = true;
        state.elapsedSeconds = 42;
        state.initForCharacter({
            hp: 100, maxHp: 100, buffList: {},
            skills: { fireball: 0, iceNova: 0, lightningArc: 0 }
        });
        expect(state.gamePaused).toBe(false);
        expect(state.elapsedSeconds).toBe(0);
        expect(state.pauseTime).toBe(0);
    });

    it('clears enemies and bullets on fullCleanup', () => {
        const state = new GameState();
        const fakeEl = { remove: () => {} };
        state.enemies.push({ id: 'e1', element: fakeEl, moveAnimationId: null });
        state.bullets.push({ element: fakeEl, moveAnimationId: null });
        state.enemyAttackCooldown['e1'] = 100;

        state.fullCleanup();
        expect(state.enemies).toHaveLength(0);
        expect(state.bullets).toHaveLength(0);
        expect(state.enemyAttackCooldown).toEqual({});
    });

    it('restoreProgression resets skill list and ability thresholds', () => {
        const state = new GameState();
        state.skillList.fireball.level = 3;
        state.abilityLevelThreshold.push(999);
        state.restoreProgression();
        expect(state.skillList.fireball.level).toBe(0);
        expect(state.abilityLevelThreshold).toEqual(createAbilityLevelThresholds());
    });
});

describe('buildEnemyStats', () => {
    it('scales stats with difficulty', () => {
        const low = buildEnemyStats('grunt', 'normal', 0);
        const high = buildEnemyStats('grunt', 'normal', 20);
        expect(high.stats.hp).toBeGreaterThan(low.stats.hp);
        expect(high.stats.physicalDamage).toBeGreaterThan(low.stats.physicalDamage);
    });

    it('applies rarity multipliers for boss', () => {
        const normal = buildEnemyStats('grunt', 'normal', 5);
        const boss = buildEnemyStats('grunt', 'boss', 5);
        expect(boss.stats.hp).toBeGreaterThan(normal.stats.hp * 5);
    });

    it('gives tank enemies bonus armour', () => {
        const tank = buildEnemyStats('tank', 'normal', 0);
        expect(tank.stats.armour).toBeGreaterThan(0);
    });

    it('sets ranged attack range for archers', () => {
        const archer = buildEnemyStats('archer', 'normal', 0);
        expect(archer.stats.attackRange).toBe(260);
    });

    it('applies starting combat boost (+20% damage, +10% armour) without HP/moveSpeed', () => {
        const grunt = buildEnemyStats('grunt', 'normal', 0);
        const tank = buildEnemyStats('tank', 'normal', 0);
        expect(grunt.stats.moveSpeed).toBeCloseTo(
            applyEnemyMovePressure(BASE_ENEMY_STATS.moveSpeed, 0),
            5
        );
        expect(grunt.stats.attackSpeed).toBeCloseTo(BASE_ENEMY_STATS.attackSpeed * 1.2, 5);
        // Tank armourBonus 8 → ×1.1 → 8 (floor)
        expect(tank.stats.armour).toBe(Math.floor(8 * BALANCE.enemyBaseArmourBonus + 1e-9));
    });

    it('gives penetrator ignore-armour flag', () => {
        const pen = buildEnemyStats('penetrator', 'normal', 10);
        expect(pen.stats.ignoreArmour).toBe(true);
    });

    it('gives wraith scaling evade chance', () => {
        const low = buildEnemyStats('wraith', 'normal', 0);
        const high = buildEnemyStats('wraith', 'normal', 100);
        expect(low.stats.evadeChance).toBeGreaterThanOrEqual(5);
        expect(high.stats.evadeChance).toBeLessThanOrEqual(50);
        expect(high.stats.evadeChance).toBeGreaterThan(low.stats.evadeChance);
    });

    it('applies early-wave HP reduction and EXP bonus', () => {
        const early = buildEnemyStats('grunt', 'normal', 0);
        const expectedExp = finalizeEnemyExpStat(
            applyEarlyWaveExpBonus(
                applyBalanceScale(Math.floor(scaleEnemyExp(BASE_ENEMY_STATS.exp, 0)), 'exp'),
                0
            ),
            'grunt',
            0
        );
        const expectedHp = applyEarlyWaveHpReduction(
            applyBalanceScale(Math.floor(scaleEnemyHpForDifficulty(BASE_ENEMY_STATS.hp, 0)), 'hp'),
            0
        );
        expect(early.stats.exp).toBe(expectedExp);
        expect(early.stats.exp).toBeGreaterThanOrEqual(2);
        expect(early.stats.hp).toBe(expectedHp);
        expect(BALANCE.earlyWaveExpMultiplier).toBe(1.5);
        expect(BALANCE.earlyWaveHpMultiplier).toBe(0.7);
    });

    it('gives swarm less exp than grunt on wave 1', () => {
        const grunt = buildEnemyStats('grunt', 'normal', 0);
        const swarm = buildEnemyStats('swarm', 'normal', 0);
        expect(swarm.stats.exp).toBeLessThan(grunt.stats.exp);
    });

    it('does not use runtime global enemy damage multipliers', () => {
        expect(BALANCE.enemyDamageGlobalMultiplier).toBeUndefined();
        const grunt = buildEnemyStats('grunt', 'normal', 0);
        expect(grunt.stats.physicalDamage).toBeGreaterThan(0);
    });
});

describe('computeEnemyEvadeChance', () => {
    it('clamps between 5% and 50%', () => {
        expect(computeEnemyEvadeChance(0)).toBe(5);
        expect(computeEnemyEvadeChance(200)).toBe(50);
    });
});

describe('scaleEnemyDamage', () => {
    it('scales linearly with difficulty (no exponential blow-up)', () => {
        expect(scaleEnemyDamage(10, 0)).toBe(10);
        expect(scaleEnemyDamage(10, 100)).toBe(45);
        expect(scaleEnemyDamage(10, 200)).toBe(80);

        const perTier = scaleEnemyDamage(10, 1) - scaleEnemyDamage(10, 0);
        expect(perTier).toBeCloseTo(0.35, 2);
        expect(scaleEnemyDamage(10, 200)).toBeLessThan(10 * 12);
    });
});

describe('scaleEnemyExp', () => {
    it('ramps linearly in early waves', () => {
        expect(scaleEnemyExp(10, 10)).toBeCloseTo(10 * (1 + 10 * 0.10), 4);
    });

    it('grows slower than old logarithmic curve in late game', () => {
        const linearLate = scaleEnemyExp(10, 100);
        const oldLog = 10 + 10 * (1 + 0.6 * 100) * Math.log(1 + 100 + 100 * Math.pow(1.3, 100));
        expect(linearLate).toBeLessThan(oldLog * 0.5);
    });
});

describe('pickEnemyType', () => {
    it('returns grunt at low difficulty', () => {
        const types = new Set();
        for (let i = 0; i < 50; i++) types.add(pickEnemyType(0));
        expect(types.has('grunt')).toBe(true);
        expect(types.has('swarm')).toBe(false);
    });

    it('excludes swarm before unlock difficulty', () => {
        for (let i = 0; i < 100; i++) {
            expect(pickEnemyType(5)).not.toBe('swarm');
        }
    });

    it('includes advanced types at high difficulty', () => {
        const types = new Set();
        for (let i = 0; i < 300; i++) types.add(pickEnemyType(20));
        expect(types.has('bomber')).toBe(true);
        expect(types.has('penetrator')).toBe(true);
        expect(types.has('wraith')).toBe(true);
        expect(types.has('splitter')).toBe(true);
        expect(types.has('swarm')).toBe(true);
    });

    it('includes wraith from wave 12 onward', () => {
        const types = new Set();
        for (let i = 0; i < 200; i++) types.add(pickEnemyType(12));
        expect(types.has('wraith')).toBe(true);
    });
});

describe('math utilities', () => {
    it('clamps values', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-1, 0, 10)).toBe(0);
        expect(clamp(15, 0, 10)).toBe(10);
    });

    it('formats time correctly', () => {
        expect(formatTime(0)).toBe('0:00');
        expect(formatTime(65)).toBe('1:05');
        expect(formatTime(3661)).toBe('61:01');
    });

    it('calculates exp threshold', () => {
        expect(calculateExpThreshold(1, 8)).toBeGreaterThan(8);
    });

    it('calculates vw distance', () => {
        const dist = distanceVw(50, 50, 60, 50, 1000, 1000);
        expect(dist).toBe(100);
    });
});

describe('ENEMY_TYPES config', () => {
    it('has all required enemy archetypes', () => {
        const required = ['grunt', 'swarm', 'tank', 'archer', 'dasher', 'splitter', 'bomber', 'penetrator', 'wraith', 'splitFragment'];
        required.forEach(type => {
            expect(ENEMY_TYPES[type]).toBeDefined();
            expect(ENEMY_TYPES[type].behavior).toBeTruthy();
        });
    });

    it('excludes non-spawnable types from pickEnemyType pool', () => {
        for (let i = 0; i < 200; i++) {
            expect(pickEnemyType(20)).not.toBe('splitFragment');
        }
    });
});

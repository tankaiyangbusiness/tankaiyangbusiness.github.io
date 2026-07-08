import { describe, it, expect } from 'vitest';
import {
    bankExpLevelUps,
    peekPendingUpgrade,
    consumePendingUpgrade,
    consumePendingUpgradeByType,
    countPendingByType,
    completeLevelCycle,
    requiresPlayerChoice,
    buildStatUpgradeOptions,
    buildSkillUpgradeOptions,
    buildSkillUpgradeOptionsFromKeys,
    rollSkillUpgradeKeys,
    buildAbilityUpgradeOptions,
    pickRandomOptions,
    summarizeUpgradeQueue,
    formatAbilityDescription
} from '../js/systems/levelUp.js';
import { createAbilityLevelThresholds, createDefaultStatsList } from '../js/config/progression.js';
import { createDefaultSkillList } from '../js/config/skills.js';
import { calculateExpThreshold } from '../js/utils/math.js';

function createMockState(overrides = {}) {
    const stats = {
        level: 1,
        exp: 0,
        expThreshold: 14,
        maxHp: 600,
        hp: 600,
        physicalDamage: 30,
        attackRange: 150,
        attackSpeed: 2,
        hpRegen: 3,
        armour: 30,
        evade: 15,
        critChance: 5,
        critMultiplier: 150,
        expGain: 1.2,
        buffList: {},
        skills: {
            fireball: 0, iceNova: 0, lightningArc: 0, poisonBottle: 0, healingWave: 0,
            frostbolt: 0, righteousFire: 0, spark: 0, illusion: 0,
            poisonDagger: 0, hammerSweep: 0, throwSpear: 0
        },
        ...overrides.stats
    };

    return {
        stats,
        originalStats: { ...stats, expThreshold: stats.expThreshold },
        statsList: createDefaultStatsList(),
        skillList: {
            fireball: { level: 0, maxLevel: 5 },
            iceNova: { level: 0, maxLevel: 5 },
            lightningArc: { level: 0, maxLevel: 5 },
            poisonBottle: { level: 0, maxLevel: 5 },
            healingWave: { level: 0, maxLevel: 5 },
            frostbolt: { level: 0, maxLevel: 5 },
            righteousFire: { level: 0, maxLevel: 5 },
            spark: { level: 0, maxLevel: 5 },
            illusion: { level: 0, maxLevel: 5 },
            poisonDagger: { level: 0, maxLevel: 5 },
            hammerSweep: { level: 0, maxLevel: 5 },
            throwSpear: { level: 0, maxLevel: 5 }
        },
        abilityLevelThreshold: createAbilityLevelThresholds(),
        pendingUpgrades: [],
        abilityList: {
            thorns: { level: 0, maxLevel: 5, text: '??', progression: ['1'] },
            vampirism: { level: 0, maxLevel: 5, text: '??', progression: ['1'] },
            fortify: { level: 0, maxLevel: 5, text: '??', progression: ['1'] }
        },
        ...overrides
    };
}

describe('requiresPlayerChoice', () => {
    it('requires choice at skill milestones', () => {
        expect(requiresPlayerChoice(4, createAbilityLevelThresholds())).toBe(true);
    });

    it('does not require choice at normal stat levels', () => {
        expect(requiresPlayerChoice(2, createAbilityLevelThresholds())).toBe(false);
    });
});

describe('completeLevelCycle', () => {
    it('deducts exp and raises threshold', () => {
        const state = createMockState();
        state.stats.exp = 20;
        const prevThreshold = state.stats.expThreshold;

        completeLevelCycle(state.stats, state.originalStats);

        expect(state.stats.level).toBe(2);
        expect(state.stats.exp).toBe(20 - prevThreshold);
        expect(state.stats.expThreshold).toBe(calculateExpThreshold(2, 14));
    });
});

describe('bankExpLevelUps', () => {
    it('banks multiple levels without pausing', () => {
        const state = createMockState({ stats: { level: 1, exp: 80, expThreshold: 9 } });
        const result = bankExpLevelUps(state);

        expect(result.banked).toBeGreaterThan(1);
        expect(result.pendingCount).toBe(result.banked);
        expect(state.stats.level).toBeGreaterThan(1);
        expect(state.pendingUpgrades.length).toBe(result.pendingCount);
    });

    it('queues skill type at level 5 milestone', () => {
        const state = createMockState({ stats: { level: 4, exp: 50, expThreshold: 9 } });
        bankExpLevelUps(state);

        expect(state.pendingUpgrades.some(u => u.type === 'skill')).toBe(true);
    });

    it('does nothing when exp is below threshold', () => {
        const state = createMockState({ stats: { level: 1, exp: 5, expThreshold: 9 } });
        const result = bankExpLevelUps(state);

        expect(result.banked).toBe(0);
        expect(state.pendingUpgrades).toHaveLength(0);
    });
});

describe('pending upgrade queue', () => {
    it('peeks and consumes in order', () => {
        const state = createMockState();
        state.pendingUpgrades = [{ type: 'stat' }, { type: 'skill' }];

        expect(peekPendingUpgrade(state)?.type).toBe('stat');
        expect(consumePendingUpgrade(state)?.type).toBe('stat');
        expect(peekPendingUpgrade(state)?.type).toBe('skill');
    });

    it('consumes by type without fifo order', () => {
        const state = createMockState();
        state.pendingUpgrades = [{ type: 'stat' }, { type: 'ability' }, { type: 'stat' }];

        expect(consumePendingUpgradeByType(state, 'ability')?.type).toBe('ability');
        expect(state.pendingUpgrades).toHaveLength(2);
        expect(state.pendingUpgrades[0].type).toBe('stat');
    });

    it('counts pending by type', () => {
        const counts = countPendingByType([
            { type: 'stat' },
            { type: 'ability' },
            { type: 'stat' }
        ]);
        expect(counts.stat).toBe(2);
        expect(counts.ability).toBe(1);
        expect(counts.skill).toBe(0);
    });
});

describe('buildStatUpgradeOptions', () => {
    it('returns up to three random stat choices', () => {
        const statsList = createDefaultStatsList();
        const options = buildStatUpgradeOptions(statsList);

        expect(options.length).toBeGreaterThan(0);
        expect(options.length).toBeLessThanOrEqual(3);
        expect(options[0]).toHaveProperty('key');
        expect(options[0]).toHaveProperty('label');
    });

    it('can produce different rolls on subsequent calls', () => {
        const statsList = createDefaultStatsList();
        const rolls = new Set();
        for (let i = 0; i < 12; i++) {
            rolls.add(buildStatUpgradeOptions(statsList).map(o => o.key).join(','));
        }
        expect(rolls.size).toBeGreaterThan(1);
    });
});

describe('buildSkillUpgradeOptionsFromKeys', () => {
    it('keeps the same skill choices until keys are cleared', () => {
        const skillList = {
            fireball: { level: 0, maxLevel: 5 },
            iceNova: { level: 0, maxLevel: 5 },
            lightningArc: { level: 0, maxLevel: 5 },
            poisonBottle: { level: 0, maxLevel: 5 },
            healingWave: { level: 0, maxLevel: 5 },
            frostbolt: { level: 0, maxLevel: 5 },
            righteousFire: { level: 0, maxLevel: 5 },
            spark: { level: 0, maxLevel: 5 },
            illusion: { level: 0, maxLevel: 5 },
            poisonDagger: { level: 0, maxLevel: 5 },
            hammerSweep: { level: 0, maxLevel: 5 },
            throwSpear: { level: 0, maxLevel: 5 }
        };
        const keys = rollSkillUpgradeKeys(skillList);
        const first = buildSkillUpgradeOptionsFromKeys(skillList, keys).map(o => o.key);
        const second = buildSkillUpgradeOptionsFromKeys(skillList, keys).map(o => o.key);
        expect(first).toEqual(second);
        expect(first.length).toBeGreaterThan(0);
    });
});

describe('buildSkillUpgradeOptions', () => {
    it('returns up to five random unlockable skills', () => {
        const skillList = createDefaultSkillList();
        const options = buildSkillUpgradeOptions(skillList);
        expect(options.length).toBe(5);
    });

    it('returns all available when fewer than five unlockable', () => {
        const skillList = {
            fireball: { level: 0, maxLevel: 5 },
            iceNova: { level: 0, maxLevel: 5 },
            lightningArc: { level: 0, maxLevel: 5 },
            poisonBottle: { level: 0, maxLevel: 5 }
        };
        const options = buildSkillUpgradeOptions(skillList);
        expect(options.length).toBe(4);
    });
});

describe('buildAbilityUpgradeOptions', () => {
    it('returns all unlockable abilities (not random subset)', () => {
        const abilityList = {
            a: { level: 0, maxLevel: 5 },
            b: { level: 0, maxLevel: 5 },
            c: { level: 0, maxLevel: 5 },
            d: { level: 0, maxLevel: 5 }
        };
        const options = buildAbilityUpgradeOptions(abilityList, () => 'desc');
        expect(options.length).toBe(4);
    });
});

describe('pickRandomOptions', () => {
    it('never returns more than count', () => {
        const pool = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }];
        expect(pickRandomOptions(pool, 3)).toHaveLength(3);
        expect(pickRandomOptions(pool, 10)).toHaveLength(4);
    });
});

describe('summarizeUpgradeQueue', () => {
    it('counts upgrade types', () => {
        const summary = summarizeUpgradeQueue([
            { type: 'stat' },
            { type: 'stat' },
            { type: 'skill' }
        ]);
        expect(summary.stat).toBe(2);
        expect(summary.skill).toBe(1);
        expect(summary.ability).toBe(0);
    });
});

describe('formatAbilityDescription', () => {
    it('replaces placeholders with progression values', () => {
        const ability = {
            text: 'Return ??%(25%) damage',
            progression: ['5', '10'],
            level: 0,
            maxLevel: 5
        };
        expect(formatAbilityDescription(ability)).toContain('5');
    });
});

describe('calculateExpThreshold fast pace', () => {
    it('uses balanced scaling (slower than old 0.28 linear)', () => {
        expect(calculateExpThreshold(10, 14)).toBeGreaterThan(60);
    });
});

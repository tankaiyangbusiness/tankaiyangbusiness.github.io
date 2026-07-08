import { describe, it, expect } from 'vitest';
import {
    getFireballConfig,
    getIceNovaConfig,
    getLightningArcConfig,
    getPoisonBottleConfig,
    getHealingWaveConfig,
    getFrostboltConfig,
    getRighteousFireConfig,
    getSparkConfig,
    getIllusionConfig,
    findChainTargets,
    findEnemiesInRadius,
    syncPlayerSkillLevels,
    computeSkillDamage,
    computeSplashDamage,
    computeBurnTotal,
    computePoisonTickDamage,
    computePoisonPoolTicks,
    SKILL_IDS,
    createDefaultSkillList,
    getSkillDisplayRadius
} from '../js/config/skills.js';

describe('active skill configs', () => {
    it('returns inactive config at level 0', () => {
        expect(getFireballConfig(0).cooldown).toBe(Infinity);
        expect(getIceNovaConfig(0).radius).toBe(0);
        expect(getLightningArcConfig(0).chainCount).toBe(0);
        expect(getPoisonBottleConfig(0).poolRadius).toBe(0);
        expect(getHealingWaveConfig(0).healPercent).toBe(0);
        expect(getFrostboltConfig(0).castRange).toBe(0);
        expect(getRighteousFireConfig(0).radius).toBe(0);
        expect(getSparkConfig(0).sparkCount).toBe(0);
        expect(getIllusionConfig(0).damagePercent).toBe(0);
    });

    it('scales fireball with level and cast range', () => {
        const cfg = getFireballConfig(3);
        expect(cfg.directDamageMult).toBeCloseTo(1.05);
        expect(cfg.splashRadius).toBe(130);
        expect(cfg.castRange).toBe(265);
    });

    it('scales ice nova radius for visibility', () => {
        const cfg = getIceNovaConfig(5);
        expect(cfg.radius).toBe(180);
        expect(cfg.slowPercent).toBe(48);
    });

    it('scales lightning arc with cast range', () => {
        const cfg = getLightningArcConfig(4);
        expect(cfg.chainCount).toBe(4);
        expect(cfg.castRange).toBe(320);
    });

    it('scales poison bottle pool', () => {
        const cfg = getPoisonBottleConfig(3);
        expect(cfg.poolRadius).toBe(97);
        expect(cfg.poolDuration).toBe(6300);
        expect(cfg.tickInterval).toBe(360);
    });

    it('scales healing wave with level', () => {
        const cfg = getHealingWaveConfig(4);
        expect(cfg.healPercent).toBeGreaterThan(15);
        expect(cfg.cooldown).toBeLessThan(5500);
    });

    it('scales frostbolt travel, cooldown, and pierce', () => {
        const cfg = getFrostboltConfig(3);
        expect(cfg.damageMult).toBeCloseTo(0.85);
        expect(cfg.maxTravel).toBeGreaterThan(500);
        expect(cfg.projectileSpeed).toBeLessThan(0.5);
        expect(cfg.cooldown).toBeGreaterThan(2500);
        expect(cfg.pierceAll).toBe(true);
    });

    it('scales righteous fire aura', () => {
        const cfg = getRighteousFireConfig(4);
        expect(cfg.radius).toBe(127);
        expect(cfg.tickDamageMult).toBeGreaterThan(0.1);
    });

    it('scales spark count, duration, and wander', () => {
        const cfg = getSparkConfig(3);
        expect(cfg.sparkCount).toBe(5);
        expect(cfg.duration).toBeGreaterThan(2000);
        expect(cfg.speed).toBeLessThan(0.75);
        expect(cfg.wanderChance).toBeGreaterThan(0.2);
    });

    it('scales illusion clone damage cooldown and duration', () => {
        const low = getIllusionConfig(1);
        const high = getIllusionConfig(5);
        expect(low.damagePercent).toBe(30);
        expect(high.damagePercent).toBe(60);
        expect(high.duration).toBeGreaterThan(low.duration);
        expect(high.cooldown).toBeLessThan(low.cooldown);
    });
});

describe('skill damage helpers', () => {
    it('computes fireball direct damage', () => {
        expect(computeSkillDamage(100, 'fireball', 2)).toBe(95);
    });

    it('computes frostbolt and spark damage', () => {
        expect(computeSkillDamage(100, 'frostbolt', 2)).toBe(75);
        expect(computeSkillDamage(100, 'spark', 2)).toBe(40);
    });

    it('computes righteous fire tick damage', () => {
        expect(computeSkillDamage(100, 'righteousFire', 2)).toBeGreaterThanOrEqual(11);
    });

    it('computes poison tick damage', () => {
        expect(computePoisonTickDamage(100, 3)).toBe(17);
    });

    it('computes poison pool tick count', () => {
        expect(computePoisonPoolTicks(3)).toBeGreaterThan(10);
    });
});

describe('skill display radius', () => {
    it('returns cast range for fireball', () => {
        expect(getSkillDisplayRadius('fireball', 2)).toBe(230);
    });

    it('returns area radius for ice nova and righteous fire', () => {
        expect(getSkillDisplayRadius('iceNova', 3)).toBe(136);
        expect(getSkillDisplayRadius('righteousFire', 3)).toBe(109);
    });
});

describe('findChainTargets', () => {
    it('excludes source enemy', () => {
        const enemies = [
            { id: 'a', x: 50, y: 50, hp: 100 },
            { id: 'b', x: 52, y: 50, hp: 100 }
        ];
        const targets = findChainTargets(enemies, 50, 50, 'a', 5, 500, 1920, 1080);
        expect(targets.map(t => t.id)).toEqual(['b']);
    });
});

describe('syncPlayerSkillLevels', () => {
    it('syncs all skills including new PoE-style skills', () => {
        const skills = createDefaultSkillList();
        Object.keys(skills).forEach(k => { skills[k] = 0; });
        const skillList = createDefaultSkillList();
        skillList.spark.level = 2;
        skillList.frostbolt.level = 1;
        syncPlayerSkillLevels(skills, skillList);
        expect(skills.spark).toBe(2);
        expect(skills.frostbolt).toBe(1);
    });
});

describe('SKILL_IDS', () => {
    it('includes all nine active skills', () => {
        expect(SKILL_IDS).toContain('poisonBottle');
        expect(SKILL_IDS).toContain('healingWave');
        expect(SKILL_IDS).toContain('frostbolt');
        expect(SKILL_IDS).toContain('righteousFire');
        expect(SKILL_IDS).toContain('spark');
        expect(SKILL_IDS).toContain('illusion');
        expect(SKILL_IDS.length).toBe(9);
    });
});

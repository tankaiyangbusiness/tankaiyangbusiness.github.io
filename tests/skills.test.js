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
    getPoisonDaggerConfig,
    getHammerSweepConfig,
    getThrowSpearConfig,
    findChainTargets,
    findEnemiesInRadius,
    syncPlayerSkillLevels,
    computeSkillDamage,
    computeSplashDamage,
    computeBurnTotal,
    computePoisonTickDamage,
    computePoisonPoolTicks,
    computePoisonDaggerForkDamage,
    SKILL_IDS,
    SKILL_DEFINITIONS,
    createDefaultSkillList,
    getSkillDisplayRadius,
    getSkillTags,
    skillHasTag,
    formatSkillTagsHtml,
    formatSkillTooltipHtml
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
        expect(getPoisonDaggerConfig(0).forkCount).toBe(0);
        expect(getHammerSweepConfig(0).radius).toBe(0);
        expect(getThrowSpearConfig(0).castRange).toBe(0);
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
        expect(cfg.maxTravel).toBeGreaterThan(50);
        expect(cfg.maxTravel).toBeLessThan(120);
        expect(cfg.projectileSpeed).toBeGreaterThan(0.5);
        expect(cfg.projectileSpeed).toBeLessThan(1.2);
        expect(cfg.cooldown).toBeGreaterThan(2500);
        expect(cfg.pierceAll).toBe(true);
    });

    it('scales righteous fire aura from 12% at level 1', () => {
        const cfg = getRighteousFireConfig(1);
        expect(cfg.tickDamageMult).toBeCloseTo(0.12, 5);
        expect(getRighteousFireConfig(4).radius).toBe(191);
        expect(getRighteousFireConfig(4).tickDamageMult).toBeGreaterThan(0.1);
    });

    it('scales spark count, duration, wander, large AOE, and pierce 2', () => {
        const cfg = getSparkConfig(3);
        expect(cfg.sparkCount).toBe(7);
        expect(cfg.duration).toBeGreaterThan(2000);
        expect(cfg.speed).toBeLessThan(0.75);
        expect(cfg.wanderChance).toBeGreaterThan(0.3);
        expect(cfg.hitRadiusVw).toBeGreaterThan(6);
        expect(cfg.maxPierce).toBe(2);
    });

    it('scales illusion clone damage cooldown and duration', () => {
        const low = getIllusionConfig(1);
        const high = getIllusionConfig(5);
        expect(low.damagePercent).toBe(30);
        expect(high.damagePercent).toBe(60);
        expect(low.cooldown).toBe(9800);
        expect(high.cooldown).toBe(5000);
        expect(high.duration).toBeGreaterThan(low.duration);
        expect(high.cooldown).toBeLessThan(low.cooldown);
    });

    it('scales poison dagger fork count and damage', () => {
        const cfg = getPoisonDaggerConfig(3);
        expect(cfg.forkCount).toBe(4);
        expect(cfg.damageMult).toBeGreaterThan(0.5);
        expect(cfg.forkDamageMult).toBeGreaterThan(0.3);
        expect(computePoisonDaggerForkDamage(100, 3)).toBeGreaterThan(30);
    });

    it('scales hammer sweep to 96% at level 1 and throw spear pierce 6', () => {
        const hammer = getHammerSweepConfig(1);
        expect(hammer.damageMult).toBeCloseTo(0.96, 5);
        const hammer3 = getHammerSweepConfig(3);
        const spear = getThrowSpearConfig(3);
        expect(hammer3.radius).toBe(135);
        expect(spear.castRange).toBe(325);
        expect(spear.maxPierce).toBe(6);
        expect(getFireballConfig(1).maxPierce).toBe(0);
        expect(getFrostboltConfig(1).maxPierce).toBe(Infinity);
        expect(getSkillDisplayRadius('hammerSweep', 3)).toBe(135);
        expect(getSkillDisplayRadius('throwSpear', 3)).toBe(325);
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

    it('computes physical and chaos skill damage', () => {
        expect(computeSkillDamage(100, 'hammerSweep', 1)).toBe(96);
        expect(computeSkillDamage(100, 'throwSpear', 2)).toBeGreaterThan(70);
        expect(computeSkillDamage(100, 'poisonDagger', 2)).toBeGreaterThan(50);
        expect(computeSkillDamage(100, 'righteousFire', 1)).toBe(12);
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
        expect(getSkillDisplayRadius('righteousFire', 3)).toBe(164);
    });

    it('returns player attack range for illusion clone AOE ring', () => {
        expect(getSkillDisplayRadius('illusion', 3, 175)).toBe(175);
        expect(getSkillDisplayRadius('illusion', 3, 0)).toBe(0);
    });

    it('returns spark hit bubble radius in pixels for range UI', () => {
        const cfg = getSparkConfig(3);
        const expected = cfg.hitRadiusVw * 1000 / 100;
        expect(getSkillDisplayRadius('spark', 3)).toBeCloseTo(expected, 5);
        expect(getSkillDisplayRadius('spark', 3)).toBeGreaterThan(30);
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
    it('includes chaos, physical, and classic skills', () => {
        expect(SKILL_IDS).toContain('poisonBottle');
        expect(SKILL_IDS).toContain('poisonDagger');
        expect(SKILL_IDS).toContain('hammerSweep');
        expect(SKILL_IDS).toContain('throwSpear');
        expect(SKILL_IDS).toContain('healingWave');
        expect(SKILL_IDS).toContain('frostbolt');
        expect(SKILL_IDS).toContain('righteousFire');
        expect(SKILL_IDS).toContain('spark');
        expect(SKILL_IDS).toContain('illusion');
        expect(SKILL_IDS.length).toBe(12);
    });
});

describe('skill tags', () => {
    it('tags fire skills with fire and elemental', () => {
        expect(getSkillTags('fireball')).toContain('fire');
        expect(getSkillTags('fireball')).toContain('elemental');
        expect(skillHasTag('righteousFire', 'elemental')).toBe(true);
    });

    it('uses chaos tag instead of poison', () => {
        expect(getSkillTags('poisonBottle')).toContain('chaos');
        expect(getSkillTags('poisonBottle')).not.toContain('poison');
        expect(SKILL_DEFINITIONS.poisonBottle.element).toBe('chaos');
        expect(getSkillTags('poisonDagger')).toContain('fork');
        expect(getSkillTags('poisonDagger')).toContain('chaos');
    });

    it('tags physical skills', () => {
        expect(getSkillTags('hammerSweep')).toContain('physical');
        expect(getSkillTags('throwSpear')).toContain('physical');
        expect(SKILL_DEFINITIONS.hammerSweep.element).toBe('physical');
        expect(SKILL_DEFINITIONS.throwSpear.element).toBe('physical');
    });

    it('tags healing wave with healing not elemental', () => {
        expect(getSkillTags('healingWave')).toContain('healing');
        expect(skillHasTag('healingWave', 'elemental')).toBe(false);
    });

    it('builds tooltip html with tags', () => {
        const html = formatSkillTooltipHtml(SKILL_DEFINITIONS.spark, 3);
        expect(html).toContain('skill-tag-lightning');
        expect(html).toContain('skill-tag-elemental');
        expect(formatSkillTagsHtml(['fire', 'elemental'])).toContain('Fire');
        expect(formatSkillTagsHtml(['chaos'])).toContain('Chaos');
    });
});

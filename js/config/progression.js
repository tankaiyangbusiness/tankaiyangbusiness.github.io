import { buildAbilityProgression } from './abilityCombatScaling.js';

export function createDefaultStatsList() {
    return {
        'Upgrade Damage': { level: 0, maxLevel: 1000 },
        'Upgrade AoE': { level: 0, maxLevel: 25 },
        'Upgrade Attack Speed': { level: 0, maxLevel: 50 },
        'Upgrade HP (Recover 20% Life)': { level: 0, maxLevel: 1000 },
        'Upgrade HP Regen': { level: 0, maxLevel: 1000 },
        'Upgrade Armour': { level: 0, maxLevel: 1000 },
        'Upgrade Crit Chance': { level: 0, maxLevel: 40 },
        'Upgrade Crit Multiplier': { level: 0, maxLevel: 100 }
    };
}

/** Passive combat abilities — separate from active elemental skills */
export function createDefaultAbilityList() {
    return {
        Reflect: {
            text: 'Return ??%(50%) of your damage to attackers. Reduced by enemy armour.',
            progression: buildAbilityProgression('reflect'),
            level: 0, maxLevel: 5
        },
        Bounce: {
            text: 'Deal ??%(0%) less damage. Projectiles bounce ??(5) extra times',
            progression: ['40', '30', '20', '10', '0', '1', '2', '3', '4', '5'],
            level: 0, maxLevel: 5
        },
        'Attack Speed Buff': {
            text: 'Grant ??%(100%) attack speed for 5s, cooldown 10s',
            progression: buildAbilityProgression('attackSpeedBuff'),
            level: 0, maxLevel: 5
        },
        'Damage Reduction': {
            text: 'Grant ??%(50%) damage reduction',
            progression: buildAbilityProgression('damageReduction'),
            level: 0, maxLevel: 5
        },
        Lifesteal: {
            text: 'Grant ??%(25%) lifesteal',
            progression: buildAbilityProgression('lifesteal'),
            level: 0, maxLevel: 5
        },
        'HP To Damage': {
            text: 'Deal ??%(30%) of max HP as bonus damage',
            progression: ['6', '12', '18', '24', '30'],
            level: 0, maxLevel: 5
        },
        'Regen To Damage': {
            text: 'Deal ??%(250%) of Regen as damage. ??%(100%) faster regen',
            progression: ['50', '100', '150', '200', '250', '20', '40', '60', '80', '100'],
            level: 0, maxLevel: 5
        }
    };
}

/** Milestone levels for passive abilities (9, 19, 29 …) */
export function createAbilityLevelThresholds(count = 30) {
    const thresholds = [];
    for (let i = 0; i < count; i++) {
        thresholds.push(9 + 10 * i);
    }
    return thresholds;
}

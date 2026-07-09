import { createInitialPlayerSkills } from './skills.js';
import { EXP_CONFIG } from './expProgression.js';

const baseSkills = () => createInitialPlayerSkills();
const BASE_EXP = EXP_CONFIG.baseThreshold;

/** @typedef {import('../types.js').PlayerStats} PlayerStats */

/** @type {Array<{name: string, description: string, role: string, modelClass: string, stats: PlayerStats}>} */
export const CHARACTERS = [
    {
        name: 'Adventurer', role: 'Balanced', modelClass: 'adventurer',
        description: 'Well-rounded starter — passive grants +50% EXP from kills.',
        stats: {
            hp: 957, maxHp: 957, physicalDamage: 35, attackSpeed: 2,
            attackRange: 150, critChance: 6, critMultiplier: 150,
            armour: 30, evade: 14, hpRegen: 2, level: 1, exp: 0,
            expGain: 1.2, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Warrior', role: 'Tank', modelClass: 'warrior',
        description: 'Heavy armour and HP. Passive: 50% chance basic hits explode for 55% AoE damage.',
        stats: {
            hp: 1567, maxHp: 1567, physicalDamage: 30, attackSpeed: 1.25,
            attackRange: 85, critChance: 4, critMultiplier: 185,
            armour: 52, evade: 2, hpRegen: 6, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Ranger', role: 'Ranged', modelClass: 'ranger',
        description: 'Extreme range and attack speed. Illusion companion deals 60% of your damage.',
        stats: {
            hp: 528, maxHp: 528, physicalDamage: 41, attackSpeed: 2.6,
            attackRange: 310, critChance: 16, critMultiplier: 130,
            armour: 8, evade: 28, hpRegen: 0, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Assassin', role: 'Crit', modelClass: 'assassin',
        description: 'Lethal crits and evasion. Crits have 30% chance to splash 40% damage nearby.',
        stats: {
            hp: 462, maxHp: 462, physicalDamage: 48, attackSpeed: 2.2,
            attackRange: 105, critChance: 28, critMultiplier: 260,
            armour: 4, evade: 52, hpRegen: 0, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Healer', role: 'Support', modelClass: 'healer',
        description: 'Massive HP regen. Passive pulses 35% of regen as holy AoE every 2.5s.',
        stats: {
            hp: 1237, maxHp: 1237, physicalDamage: 24, attackSpeed: 1.7,
            attackRange: 195, critChance: 4, critMultiplier: 140,
            armour: 24, evade: 8, hpRegen: 117, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Necromancer', role: 'DoT', modelClass: 'necromancer',
        description: 'Chaos specialist. Raises a zombie every 12s that deals 100% of your damage.',
        stats: {
            hp: 561, maxHp: 561, physicalDamage: 28, attackSpeed: 1.9,
            attackRange: 175, critChance: 8, critMultiplier: 160,
            armour: 11, evade: 12, hpRegen: 1, level: 1, exp: 0,
            expGain: 1.15, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Paladin', role: 'Holy Tank', modelClass: 'paladin',
        description: 'Sacred frontline. Shield absorbs damage equal to 10% max HP, repairs every 15s.',
        stats: {
            hp: 1452, maxHp: 1452, physicalDamage: 33, attackSpeed: 1.45,
            attackRange: 95, critChance: 6, critMultiplier: 175,
            armour: 46, evade: 6, hpRegen: 9, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Berserker', role: 'Glass Cannon', modelClass: 'berserker',
        description: 'Raw power and speed. Passive grants +50% attack speed for 5s every 10s.',
        stats: {
            hp: 693, maxHp: 693, physicalDamage: 57, attackSpeed: 2.4,
            attackRange: 90, critChance: 12, critMultiplier: 220,
            armour: 0, evade: 8, hpRegen: 0, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Elementalist', role: 'Mage', modelClass: 'elementalist',
        description: 'Arcane focus. Fire, cold, and lightning skills deal +50% more damage.',
        stats: {
            hp: 495, maxHp: 495, physicalDamage: 22, attackSpeed: 1.65,
            attackRange: 240, critChance: 10, critMultiplier: 155,
            armour: 6, evade: 18, hpRegen: 1, level: 1, exp: 0,
            expGain: 1.1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Summoner', role: 'Summoner', modelClass: 'summoner',
        description: 'Commands two bears — each deals 30% of your weapon damage.',
        stats: {
            hp: 594, maxHp: 594, physicalDamage: 26, attackSpeed: 1.85,
            attackRange: 205, critChance: 8, critMultiplier: 165,
            armour: 15, evade: 14, hpRegen: 1, level: 1, exp: 0,
            expGain: 1.05, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Capybara', role: 'Zen Tank', modelClass: 'capybara',
        description: 'Unbothered tank. Every 4s deals 60% weapon damage, chills foes, and heals 3% max HP.',
        stats: {
            hp: 1518, maxHp: 1518, physicalDamage: 19, attackSpeed: 1.3,
            attackRange: 115, critChance: 3, critMultiplier: 130,
            armour: 44, evade: 5, hpRegen: 23, level: 1, exp: 0,
            expGain: 0.95, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Slayer', role: 'Physical', modelClass: 'slayer',
        description: 'Weapon specialist. Physical hits and skills deal +50% more damage.',
        stats: {
            hp: 858, maxHp: 858, physicalDamage: 44, attackSpeed: 1.85,
            attackRange: 120, critChance: 10, critMultiplier: 175,
            armour: 24, evade: 12, hpRegen: 2, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    }
];

/**
 * @deprecated Roster stats are authored directly on each character — kept for legacy imports.
 * @param {PlayerStats} stats
 * @returns {PlayerStats}
 */
export function applyCharacterBaseStatBonuses(stats) {
    return stats;
}

/** @deprecated Use applyCharacterBaseStatBonuses */
export function applyCharacterBaseHpBonus(stats) {
    return applyCharacterBaseStatBonuses(stats);
}

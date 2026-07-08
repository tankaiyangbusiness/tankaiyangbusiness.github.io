import { createInitialPlayerSkills } from './skills.js';
import { EXP_CONFIG } from './expProgression.js';

const baseSkills = () => createInitialPlayerSkills();
const BASE_EXP = EXP_CONFIG.baseThreshold;

/** @typedef {import('../types.js').PlayerStats} PlayerStats */

/** @type {Array<{name: string, description: string, role: string, modelClass: string, stats: PlayerStats}>} */
export const CHARACTERS = [
    {
        name: 'Adventurer', role: 'Balanced', modelClass: 'adventurer',
        description: 'Well-rounded — ideal for learning skills and survival.',
        stats: {
            hp: 580, maxHp: 580, physicalDamage: 32, attackSpeed: 2,
            attackRange: 150, critChance: 6, critMultiplier: 150,
            armour: 28, evade: 14, hpRegen: 3, level: 1, exp: 0,
            expGain: 1.2, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Warrior', role: 'Tank', modelClass: 'warrior',
        description: 'Heavy armor and HP. Holds the line against swarms.',
        stats: {
            hp: 950, maxHp: 950, physicalDamage: 28, attackSpeed: 1.25,
            attackRange: 85, critChance: 4, critMultiplier: 185,
            armour: 48, evade: 2, hpRegen: 8, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Ranger', role: 'Ranged', modelClass: 'ranger',
        description: 'Extreme range and attack speed. Stay at the edge of danger.',
        stats: {
            hp: 320, maxHp: 320, physicalDamage: 38, attackSpeed: 2.6,
            attackRange: 310, critChance: 16, critMultiplier: 130,
            armour: 8, evade: 28, hpRegen: 1, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Assassin', role: 'Crit', modelClass: 'assassin',
        description: 'Lethal crits and evasion. Kill fast or die fast.',
        stats: {
            hp: 280, maxHp: 280, physicalDamage: 44, attackSpeed: 2.2,
            attackRange: 105, critChance: 28, critMultiplier: 260,
            armour: 4, evade: 52, hpRegen: 1, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Healer', role: 'Support', modelClass: 'healer',
        description: 'Massive regen outlasts attrition. Lower damage output.',
        stats: {
            hp: 750, maxHp: 750, physicalDamage: 22, attackSpeed: 1.7,
            attackRange: 195, critChance: 4, critMultiplier: 140,
            armour: 22, evade: 8, hpRegen: 130, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Necromancer', role: 'DoT', modelClass: 'necromancer',
        description: 'Master of chaos and decay. Synergizes with Chaos Bottle & Poison Dagger.',
        stats: {
            hp: 340, maxHp: 340, physicalDamage: 26, attackSpeed: 1.9,
            attackRange: 175, critChance: 8, critMultiplier: 160,
            armour: 10, evade: 12, hpRegen: 2, level: 1, exp: 0,
            expGain: 1.15, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Paladin', role: 'Holy Tank', modelClass: 'paladin',
        description: 'Sacred armor and steady damage. Balanced frontline.',
        stats: {
            hp: 880, maxHp: 880, physicalDamage: 30, attackSpeed: 1.45,
            attackRange: 95, critChance: 6, critMultiplier: 175,
            armour: 42, evade: 6, hpRegen: 12, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Berserker', role: 'Glass Cannon', modelClass: 'berserker',
        description: 'Raw power and speed. Almost no defense.',
        stats: {
            hp: 420, maxHp: 420, physicalDamage: 52, attackSpeed: 2.4,
            attackRange: 90, critChance: 12, critMultiplier: 220,
            armour: 0, evade: 8, hpRegen: 1, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Elementalist', role: 'Mage', modelClass: 'elementalist',
        description: 'Arcane focus. Skills deal effectively higher damage.',
        stats: {
            hp: 300, maxHp: 300, physicalDamage: 20, attackSpeed: 1.65,
            attackRange: 240, critChance: 10, critMultiplier: 155,
            armour: 6, evade: 18, hpRegen: 2, level: 1, exp: 0,
            expGain: 1.1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Summoner', role: 'Summoner', modelClass: 'summoner',
        description: 'Commands spirits from afar. Strong skill synergy and range.',
        stats: {
            hp: 360, maxHp: 360, physicalDamage: 24, attackSpeed: 1.85,
            attackRange: 205, critChance: 8, critMultiplier: 165,
            armour: 14, evade: 14, hpRegen: 2, level: 1, exp: 0,
            expGain: 1.05, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Capybara', role: 'Zen Tank', modelClass: 'capybara',
        description: 'Unbothered. Massive HP and regen, low damage, supreme DEF.',
        stats: {
            hp: 920, maxHp: 920, physicalDamage: 18, attackSpeed: 1.3,
            attackRange: 115, critChance: 3, critMultiplier: 130,
            armour: 40, evade: 5, hpRegen: 28, level: 1, exp: 0,
            expGain: 0.95, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    },
    {
        name: 'Slayer', role: 'Physical', modelClass: 'slayer',
        description: 'Weapon specialist. Physical hits and skills strike much harder.',
        stats: {
            hp: 520, maxHp: 520, physicalDamage: 40, attackSpeed: 1.85,
            attackRange: 120, critChance: 10, critMultiplier: 175,
            armour: 22, evade: 12, hpRegen: 3, level: 1, exp: 0,
            expGain: 1, expThreshold: BASE_EXP, buffList: {}, skills: baseSkills()
        }
    }
];

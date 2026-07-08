/**
 * Unique character passives — one signature ability per hero.
 * Tunable numbers live here so future balance changes stay localized.
 */

/** @typedef {'adventurer'|'warrior'|'ranger'|'assassin'|'healer'|'necromancer'|'paladin'|'berserker'|'elementalist'|'summoner'|'capybara'|'slayer'} CharacterPassiveId */

/**
 * @typedef {object} CharacterPassiveDef
 * @property {CharacterPassiveId} id
 * @property {string} name
 * @property {string} icon
 * @property {string} description
 * @property {Record<string, number|string>} [params]
 */

/** @type {Record<string, CharacterPassiveDef>} keyed by character display name */
export const CHARACTER_PASSIVES = {
    Adventurer: {
        id: 'adventurer',
        name: "Explorer's Quill",
        icon: '📜',
        description: 'Gains +50% all EXP from kills (stacks with base expGain).',
        params: { expBonus: 0.5 }
    },
    Warrior: {
        id: 'warrior',
        name: 'War Cry Strike',
        icon: '💥',
        description: 'Basic attacks have 15% chance to explode in a small AoE.',
        params: { chance: 15, radiusPx: 90, splashMult: 0.55 }
    },
    Ranger: {
        id: 'ranger',
        name: 'Evershadow Companion',
        icon: '🏹',
        description: 'Always has a free-roaming illusion that deals 60% of your damage.',
        params: { damagePercent: 60, roamRadiusFraction: 0.85 }
    },
    Assassin: {
        id: 'assassin',
        name: 'Crit Echo',
        icon: '🗡️',
        description: 'Critical hits have 30% chance to splash nearby foes.',
        params: { chance: 30, radiusPx: 70, splashMult: 0.4 }
    },
    Healer: {
        id: 'healer',
        name: 'Sacred Pulse',
        icon: '💚',
        description: 'Every few seconds pulses AoE damage based on HP regen.',
        params: { intervalMs: 2500, radiusPx: 140, regenDamageMult: 0.35 }
    },
    Necromancer: {
        id: 'necromancer',
        name: 'Raise Zombie',
        icon: '🧟',
        description: 'Raises a melee zombie that deals 100% of your damage for a duration.',
        params: {
            cooldownMs: 12000,
            durationMs: 14000,
            damagePercent: 100,
            moveSpeed: 0.55,
            attackIntervalMs: 900,
            offsetVw: 3.5
        }
    },
    Paladin: {
        id: 'paladin',
        name: 'Aegis of Faith',
        icon: '🛡️',
        description: 'Gain a shield equal to 10% max HP; fully repaired every 15s.',
        params: { shieldPercent: 10, repairIntervalMs: 15000 }
    },
    Berserker: {
        id: 'berserker',
        name: 'Blood Frenzy',
        icon: '🩸',
        description: 'Periodically gains +50% attack speed for several seconds.',
        params: {
            bonusPercent: 50,
            durationMs: 5000,
            cooldownMs: 10000
        }
    },
    Elementalist: {
        id: 'elementalist',
        name: 'Elemental Attunement',
        icon: '✨',
        description: 'Fire, cold, and lightning skill damage deal +50% more.',
        params: { elementBonus: 0.5 }
    },
    Summoner: {
        id: 'summoner',
        name: 'Twin Bears',
        icon: '🐻',
        description: 'Commands two bears that each deal 30% of your damage.',
        params: {
            count: 2,
            damagePercent: 30,
            moveSpeed: 0.48,
            attackIntervalMs: 1100,
            orbitVw: 4.2
        }
    },
    Capybara: {
        id: 'capybara',
        name: 'Snack & Soak',
        icon: '🍊',
        description: 'Every few seconds soaks foes in chill water and snacks for a heal.',
        params: {
            intervalMs: 4000,
            radiusPx: 120,
            damageMult: 0.6,
            healPercent: 3,
            chillPercent: 25,
            chillDurationMs: 1800
        }
    },
    Slayer: {
        id: 'slayer',
        name: 'Weapon Mastery',
        icon: '⚔️',
        description: 'All physical damage deals +50% more (skills and basic attacks).',
        params: { physicalBonus: 0.5 }
    }
};

/** Elements boosted by Elementalist passive. */
export const ELEMENTALIST_ELEMENTS = new Set(['fire', 'cold', 'lightning']);

/** @param {string} characterName */
export function getCharacterPassive(characterName) {
    return CHARACTER_PASSIVES[characterName] || null;
}

/** @param {string} characterName */
export function getCharacterPassiveId(characterName) {
    return getCharacterPassive(characterName)?.id || null;
}

/** HTML tooltip body for HUD / character card hover. */
export function formatPassiveTooltipHtml(passive) {
    if (!passive) return '';
    return `
        <strong class="passive-tip-name">${passive.name}</strong>
        <span class="passive-tip-tag">Character Passive</span>
        <p class="passive-tip-desc">${passive.description}</p>
    `;
}

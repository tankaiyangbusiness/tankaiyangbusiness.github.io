/**
 * Unique character passives — one signature ability per hero.
 * Tunable numbers live in `params`; player-facing text is built from those values.
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

/** @param {number} ratio 0–1 */
function pctFromRatio(ratio) {
    return Math.round((ratio || 0) * 100);
}

/** @param {number} ms */
function secLabel(ms) {
    const s = (ms || 0) / 1000;
    return Number.isInteger(s) ? String(s) : s.toFixed(1);
}

/**
 * Player-facing passive text derived from tuning params — keeps UI in sync with balance.
 * @param {CharacterPassiveDef} passive
 * @returns {string}
 */
export function resolvePassiveDescription(passive) {
    if (!passive) return '';
    const p = passive.params || {};

    switch (passive.id) {
        case 'adventurer':
            return `Earn +${pctFromRatio(p.expBonus)}% bonus EXP from enemy kills.`;
        case 'warrior':
            return `Basic attacks have ${p.chance}% chance to explode, dealing ${pctFromRatio(p.splashMult)}% of hit damage in a ${p.radiusPx}px area.`;
        case 'ranger':
            return `A roaming illusion follows you and strikes for ${p.damagePercent}% of your weapon damage.`;
        case 'assassin':
            return `Critical hits have ${p.chance}% chance to splash ${pctFromRatio(p.splashMult)}% of crit damage to nearby foes (${p.radiusPx}px).`;
        case 'healer':
            return `Every ${secLabel(p.intervalMs)}s, pulse holy damage equal to ${pctFromRatio(p.regenDamageMult)}% of your HP Regen (${p.radiusPx}px AoE).`;
        case 'necromancer':
            return `Every ${secLabel(p.cooldownMs)}s, raise a zombie for ${secLabel(p.durationMs)}s that deals ${p.damagePercent}% of your weapon damage.`;
        case 'paladin':
            return `Gain a shield equal to ${p.shieldPercent}% max HP that absorbs damage first; fully repairs every ${secLabel(p.repairIntervalMs)}s.`;
        case 'berserker':
            return `Every ${secLabel(p.cooldownMs)}s, gain +${p.bonusPercent}% attack speed for ${secLabel(p.durationMs)}s.`;
        case 'elementalist':
            return `Fire, cold, and lightning skills deal +${pctFromRatio(p.elementBonus)}% more damage.`;
        case 'summoner':
            return `${p.count} spirit bears orbit you — each deals ${p.damagePercent}% of your weapon damage.`;
        case 'capybara':
            return `Every ${secLabel(p.intervalMs)}s: deal ${pctFromRatio(p.damageMult)}% weapon damage, chill ${p.chillPercent}% for ${secLabel(p.chillDurationMs)}s, and heal ${p.healPercent}% max HP.`;
        case 'slayer':
            return `Physical basic attacks and skills deal +${pctFromRatio(p.physicalBonus)}% more damage.`;
        default:
            return passive.description || '';
    }
}

/** @type {Record<string, Omit<CharacterPassiveDef, 'description'>>} keyed by character display name */
const CHARACTER_PASSIVE_DEFS = {
    Adventurer: {
        id: 'adventurer',
        name: "Explorer's Quill",
        icon: '📜',
        params: { expBonus: 0.5 }
    },
    Warrior: {
        id: 'warrior',
        name: 'War Cry Strike',
        icon: '💥',
        params: { chance: 50, radiusPx: 90, splashMult: 0.55 }
    },
    Ranger: {
        id: 'ranger',
        name: 'Evershadow Companion',
        icon: '🏹',
        params: { damagePercent: 60, roamRadiusFraction: 0.85 }
    },
    Assassin: {
        id: 'assassin',
        name: 'Crit Echo',
        icon: '🗡️',
        params: { chance: 30, radiusPx: 70, splashMult: 0.4 }
    },
    Healer: {
        id: 'healer',
        name: 'Sacred Pulse',
        icon: '💚',
        params: { intervalMs: 2500, radiusPx: 140, regenDamageMult: 0.35 }
    },
    Necromancer: {
        id: 'necromancer',
        name: 'Raise Zombie',
        icon: '🧟',
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
        params: { shieldPercent: 10, repairIntervalMs: 15000 }
    },
    Berserker: {
        id: 'berserker',
        name: 'Blood Frenzy',
        icon: '🩸',
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
        params: { elementBonus: 0.5 }
    },
    Summoner: {
        id: 'summoner',
        name: 'Twin Bears',
        icon: '🐻',
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
        params: { physicalBonus: 0.5 }
    }
};

/** @type {Record<string, CharacterPassiveDef>} */
export const CHARACTER_PASSIVES = Object.fromEntries(
    Object.entries(CHARACTER_PASSIVE_DEFS).map(([name, def]) => {
        const passive = { ...def, description: '' };
        passive.description = resolvePassiveDescription(/** @type {CharacterPassiveDef} */ (passive));
        return [name, passive];
    })
);

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
    const description = resolvePassiveDescription(passive);
    return `
        <strong class="passive-tip-name">${passive.name}</strong>
        <span class="passive-tip-tag">Character Passive</span>
        <p class="passive-tip-desc">${description}</p>
    `;
}

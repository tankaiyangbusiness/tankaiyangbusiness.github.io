import { GEAR_STAT_MULTIPLIER, gearIlvlMultiplier, boostGearStatValue } from '../config/gearBalance.js';
import { GEAR_SLOTS, getBaseForSlot } from '../config/gearSlots.js';
import { TIERED_PREFIXES, TIERED_SUFFIXES, pickTieredAffix, rollBaseStatsWithTiers } from '../config/gearAffixTiers.js';
import { getUniqueById } from '../config/gearUniques.js';
import { rollAffixCount, rarityFromAffixCount, RARITY_CONFIG } from '../config/gearRarity.js';

let _itemCounter = 0;

/** @returns {string} */
export function nextItemId() {
    _itemCounter += 1;
    return `item-${Date.now()}-${_itemCounter}`;
}

/** Reset counter for tests. */
export function resetItemIdCounter() {
    _itemCounter = 0;
}

/** Scale white base stats — low ilvl gear is weaker; boosted via gearBalance. */
export function scaleBaseStatsForIlvl(baseStats, ilvl) {
    const mult = gearIlvlMultiplier(ilvl);
    const scaled = {};
    Object.entries(baseStats).forEach(([k, v]) => {
        if (k === 'attackSpeed') {
            scaled[k] = Math.round(boostGearStatValue(v * mult, 'attackSpeed') * 100) / 100;
        } else {
            scaled[k] = Math.max(1, boostGearStatValue(v * mult, k));
        }
    });
    return scaled;
}

/** @param {number} playerLevel @param {number} [difficulty] */
export function computeDropIlvl(playerLevel, difficulty = 0) {
    return Math.max(1, Math.min(80, Math.floor(playerLevel + difficulty * 0.4)));
}

/**
 * Roll affixes then derive rarity from count.
 * @param {string} slot
 * @param {number} ilvl
 * @param {number} affixCount 0–8
 */
export function rollAffixesForItem(slot, ilvl, affixCount) {
    const prefixes = [];
    const suffixes = [];
    const used = new Set();
    let remaining = Math.min(8, Math.max(0, affixCount));
    const maxPerSide = 4;

    while (remaining > 0 && (prefixes.length < maxPerSide || suffixes.length < maxPerSide)) {
        const canPre = prefixes.length < maxPerSide;
        const canSuf = suffixes.length < maxPerSide;
        if (!canPre && !canSuf) break;

        const tryPrefix = canPre && (canSuf ? Math.random() < 0.5 : true);
        if (tryPrefix) {
            const a = pickTieredAffix(TIERED_PREFIXES, slot, used, ilvl);
            if (a) { prefixes.push(a); remaining--; continue; }
        }
        if (canSuf) {
            const a = pickTieredAffix(TIERED_SUFFIXES, slot, used, ilvl);
            if (a) { suffixes.push(a); remaining--; continue; }
        }
        break;
    }

    return { prefixes, suffixes };
}

/**
 * Generate gear from slot + item level. Rarity follows affix count rules.
 * @param {string} slot
 * @param {number} ilvl
 * @param {{ affixCount?: number, uniqueId?: string }} [options]
 */
export function generateGearItem(slot, ilvl = 1, options = {}) {
    const base = getBaseForSlot(slot);
    const affixCount = options.affixCount ?? 0;
    const { prefixes, suffixes } = rollAffixesForItem(slot, ilvl, affixCount);
    const totalAffixes = prefixes.length + suffixes.length;
    const { stats: baseStats, rolls: baseStatRolls } = rollBaseStatsWithTiers(base.stats, ilvl);

    /** @type {object} */
    const item = {
        id: nextItemId(),
        slot,
        ilvl,
        rarity: rarityFromAffixCount(totalAffixes),
        baseLabel: base.label,
        baseStats,
        baseStatRolls,
        prefixes,
        suffixes,
        uniqueId: null,
        name: base.label
    };

    if (options.uniqueId) {
        const unique = getUniqueById(options.uniqueId);
        if (unique) {
            item.uniqueId = unique.id;
            item.name = unique.name;
            item.rarity = 'unique';
            const rolled = rollBaseStatsWithTiers(unique.stats, ilvl);
            item.baseStats = rolled.stats;
            item.baseStatRolls = rolled.rolls;
            item.slot = unique.slot;
            item.prefixes = [];
            item.suffixes = [];
            return item;
        }
    }

    if (item.rarity === 'unique' && totalAffixes >= 7) {
        item.name = buildUniqueStyleName(item);
    } else {
        item.name = buildItemName(item);
    }

    return item;
}

/** Legacy helper for tests — maps old rarity hint to affix counts. */
export function generateGearItemByRarity(rarity, slot, ilvl = 1, uniqueId = null) {
    if (rarity === 'unique' && uniqueId) {
        return generateGearItem(slot, ilvl, { uniqueId, affixCount: 0 });
    }
    const affixTargets = { normal: 0, magic: 2, rare: 4, unique: 7 };
    return generateGearItem(slot, ilvl, { affixCount: affixTargets[rarity] ?? 0 });
}

/** @param {object} item */
export function buildItemName(item) {
    const pre = item.prefixes[0]?.label || '';
    const suf = item.suffixes[0]?.label || '';
    const base = item.baseLabel;
    if (pre && suf) return `${pre} ${base} ${suf}`;
    if (pre) return `${pre} ${base}`;
    if (suf) return `${base} ${suf}`;
    return base;
}

function buildUniqueStyleName(item) {
    const pre = item.prefixes[0]?.label || 'Exalted';
    return `${pre} ${item.baseLabel}`;
}

/** @param {string} enemyRarity @param {number} ilvl */
export function rollLootDrop(enemyRarity, ilvl = 1) {
    const slot = GEAR_SLOTS[Math.floor(Math.random() * GEAR_SLOTS.length)];
    const affixCount = rollAffixCount(enemyRarity);
    return generateGearItem(slot, ilvl, { affixCount });
}

/** @param {object} item */
export function countItemAffixes(item) {
    return (item.prefixes?.length || 0) + (item.suffixes?.length || 0);
}

/** Sum all stat contributions from an item. */
export function getItemStatTotals(item) {
    const totals = { ...item.baseStats };
    [...(item.prefixes || []), ...(item.suffixes || [])].forEach(affix => {
        totals[affix.stat] = (totals[affix.stat] || 0) + affix.value;
    });
    return totals;
}

/** @param {object} item */
export function formatItemTooltip(item) {
    const lines = [item.name, `Item Level ${item.ilvl}`];
    const totals = getItemStatTotals(item);
    Object.entries(totals).forEach(([k, v]) => {
        lines.push(`+${formatStat(k, v)} ${formatStatLabel(k)}`);
    });
    return lines.join('\n');
}

/** Rich HTML tooltip — base stats and affixes in separate sections. */
export function buildItemTooltipHtml(item, options = {}) {
    const { title = null, showHeader = true } = options;
    const r = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.normal;

    const tierByStat = new Map((item.baseStatRolls || []).map(roll => [roll.stat, roll.tier]));

    const baseLines = Object.entries(item.baseStats || {}).map(([k, v]) => {
        const tier = tierByStat.get(k);
        const tierTag = tier ? ` <span class="gear-tip-tier">T${tier}</span>` : '';
        return `<div class="gear-tip-line">+${formatStat(k, v)} ${formatStatLabel(k)}${tierTag}</div>`;
    });

    const affixes = [...(item.prefixes || []), ...(item.suffixes || [])];
    const affixLines = affixes.map(a => {
        const tierTag = a.tier ? ` <span class="gear-tip-tier">T${a.tier}</span>` : '';
        return `<div class="gear-tip-line">+${formatStat(a.stat, a.value)} ${formatStatLabel(a.stat)}${tierTag}</div>`;
    });

    let statsHtml = '';
    if (baseLines.length > 0) {
        statsHtml += `
            <div class="gear-tip-section">
                <div class="gear-tip-section-title">Base Stats</div>
                ${baseLines.join('')}
            </div>`;
    }
    if (affixLines.length > 0) {
        statsHtml += `
            <div class="gear-tip-section">
                <div class="gear-tip-section-title">Affixes (${affixLines.length})</div>
                ${affixLines.join('')}
            </div>`;
    }
    if (!statsHtml) {
        statsHtml = '<div class="gear-tip-line gear-tip-muted">No modifiers</div>';
    }

    const headerHtml = showHeader ? `
            <div class="gear-tip-header">
                <span class="gear-tip-name" style="color:${r.color}">${title || item.name}</span>
                <span class="gear-tip-ilvl">Item Level ${item.ilvl}</span>
            </div>
            <div class="gear-tip-divider"></div>` : '';

    return `
        <div class="gear-tip-inner ${r.cssClass}" style="--tip-rarity:${r.color}">
            ${headerHtml}
            <div class="gear-tip-body">${statsHtml}</div>
        </div>
    `;
}

/** Side-by-side hover vs equipped comparison. */
export function buildGearCompareTooltipHtml(hoveredItem, equippedItem, opts = {}) {
    const hoveredIsEquipped = Boolean(
        opts.hoveredIsEquipped
        || (equippedItem && hoveredItem?.id === equippedItem.id)
    );

    const hoverTitle = hoveredIsEquipped
        ? `${hoveredItem.name} — Equipped`
        : hoveredItem.name;

    const hoverCol = buildItemTooltipHtml(hoveredItem, { title: hoverTitle, showHeader: true });

    if (hoveredIsEquipped) {
        return `<div class="gear-tip-compare gear-tip-compare-single">${hoverCol}</div>`;
    }

    const equippedCol = equippedItem
        ? buildItemTooltipHtml(equippedItem, { title: `Equipped — ${equippedItem.name}`, showHeader: true })
        : `<div class="gear-tip-inner gear-tip-empty-slot">
            <div class="gear-tip-header">
                <span class="gear-tip-name">Equipped</span>
            </div>
            <div class="gear-tip-divider"></div>
            <div class="gear-tip-body"><div class="gear-tip-line gear-tip-muted">Empty slot</div></div>
           </div>`;

    return `
        <div class="gear-tip-compare">
            <div class="gear-tip-compare-col">${hoverCol}</div>
            <div class="gear-tip-compare-col gear-tip-compare-equipped">${equippedCol}</div>
        </div>
    `;
}

function formatStatLabel(stat) {
    const labels = {
        physicalDamage: 'Damage', armour: 'DEF', maxHp: 'HP', hpRegen: 'Regen',
        attackSpeed: 'ATK SPD', attackRange: 'AOE', critChance: 'Crit', critMultiplier: 'Crit Mult', evade: 'Evade'
    };
    return labels[stat] || stat;
}

function formatStat(stat, val) {
    if (stat === 'attackSpeed') return Number(val).toFixed(2);
    if (stat === 'critChance' || stat === 'critMultiplier' || stat === 'evade') return val;
    return Math.floor(val);
}

import { formatPassiveTooltipHtml } from '../config/characterPassives.js';

/** @param {string} text */
export function escapeTooltipHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * @param {string} description
 * @returns {string}
 */
export function buildCharacterDescTooltipHtml(description) {
    const text = (description || '').trim();
    if (!text) return '';
    return `<div class="floating-tooltip-inner floating-tooltip-inner--desc"><p class="floating-tooltip-desc">${escapeTooltipHtml(text)}</p></div>`;
}

/**
 * @param {import('../config/characterPassives.js').CharacterPassiveDef|null|undefined} passive
 * @returns {string}
 */
export function buildCharacterPassiveTooltipHtml(passive) {
    if (!passive) return '';
    return `<div class="floating-tooltip-inner floating-tooltip-inner--passive">${formatPassiveTooltipHtml(passive)}</div>`;
}

/**
 * @param {EventTarget|null} target
 * @returns {boolean}
 */
export function isPassiveHoverTarget(target) {
    if (!target || typeof /** @type {Element} */ (target).closest !== 'function') return false;
    return Boolean(/** @type {Element} */ (target).closest('.character-passive-reveal'));
}

/**
 * @param {{ overPassive: boolean, hasDesc: boolean, hasPassive: boolean }} ctx
 * @returns {'desc'|'passive'|'none'}
 */
export function resolveCharacterCardTooltipMode({ overPassive, hasDesc, hasPassive }) {
    if (overPassive && hasPassive) return 'passive';
    if (hasDesc) return 'desc';
    return 'none';
}

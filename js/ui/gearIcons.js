/** Slot icons — SVG for fragile glyphs, emoji for well-supported ones. */

const HELMET_SVG = `<svg class="gear-slot-svg gear-icon-helmet" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12 2C8.5 2 5.8 4.1 5 7.1V9H4v3h1.1c.4 3.5 2.8 6.4 6.2 7.4V22h3.4v-2.6c3.4-1 5.8-3.9 6.2-7.4H22V9h-1V7.1C20.2 4.1 17.5 2 14 2h-2zm0 2h2c2.2 0 4 1.5 4.4 3.5H7.6C8 5.5 9.8 4 12 4z"/>
</svg>`;

export const SLOT_ICON_DATA = {
    weapon: { emoji: '⚔️', className: 'gear-icon-weapon' },
    helmet: { svg: HELMET_SVG, className: 'gear-icon-helmet' },
    bodyArmour: { emoji: '👕', className: 'gear-icon-body' },
    boot: { emoji: '👢', className: 'gear-icon-boot' },
    ring: { emoji: '💍', className: 'gear-icon-ring' },
    amulet: { emoji: '📿', className: 'gear-icon-amulet' },
    glove: { emoji: '🧤', className: 'gear-icon-glove' }
};

/** @param {string} slot */
export function getSlotIconHtml(slot) {
    const data = SLOT_ICON_DATA[slot] || { emoji: '📦', className: 'gear-icon-default' };
    if (data.svg) return data.svg;
    return `<span class="gear-emoji ${data.className}" aria-hidden="true">${data.emoji}</span>`;
}

/** @param {string} slot */
export function getSlotShortLabel(slot) {
    const labels = {
        weapon: 'Weapon',
        helmet: 'Helm',
        bodyArmour: 'Body',
        boot: 'Boots',
        ring: 'Ring',
        amulet: 'Amulet',
        glove: 'Gloves'
    };
    return labels[slot] || slot;
}

/** PoE-style paper doll grid positions. */
export const GEAR_DOLL_LAYOUT = [
    { slot: null, area: 'pad-tl' },
    { slot: 'helmet', area: 'top' },
    { slot: 'amulet', area: 'top-right' },
    { slot: 'weapon', area: 'mid-left' },
    { slot: 'bodyArmour', area: 'mid' },
    { slot: null, area: 'pad-mr' },
    { slot: 'glove', area: 'bot-left' },
    { slot: 'boot', area: 'bot' },
    { slot: 'ring', area: 'bot-right' }
];

/** Escape for HTML attribute values. */
export function escapeTooltip(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

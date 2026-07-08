/**
 * SVG sprite library — detailed vector models for characters and enemies.
 */

const SVG_WRAP = (content, viewBox = '0 0 64 64') =>
    `<svg class="entity-svg" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content}</svg>`;

export const PLAYER_SVGS = {
    adventurer: SVG_WRAP(`
        <defs><linearGradient id="adv-body" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs>
        <ellipse cx="32" cy="38" rx="18" ry="20" fill="url(#adv-body)" stroke="#60a5fa" stroke-width="2"/>
        <circle cx="32" cy="18" r="12" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>
        <rect x="14" y="28" width="8" height="22" rx="2" fill="#64748b" stroke="#94a3b8"/>
        <path d="M46 26 L58 18 L56 32 L48 36 Z" fill="#cbd5e1" stroke="#64748b"/>
        <line x1="50" y1="20" x2="54" y2="42" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
    `),
    warrior: SVG_WRAP(`
        <defs><linearGradient id="war-armor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs>
        <rect x="16" y="22" width="32" height="34" rx="8" fill="url(#war-armor)" stroke="#64748b" stroke-width="2"/>
        <circle cx="32" cy="16" r="13" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
        <rect x="22" y="8" width="20" height="6" rx="2" fill="#64748b"/>
        <rect x="10" y="30" width="10" height="24" rx="3" fill="#475569" stroke="#64748b"/>
        <rect x="44" y="30" width="10" height="24" rx="3" fill="#475569" stroke="#64748b"/>
        <path d="M8 36 L4 52 L12 50 Z" fill="#334155"/>
    `),
    ranger: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="16" ry="18" fill="#16a34a" stroke="#4ade80" stroke-width="2"/>
        <circle cx="32" cy="17" r="11" fill="#fde68a"/>
        <path d="M18 8 L46 8 L32 22 Z" fill="#14532d"/>
        <path d="M48 30 Q58 20 58 40 Q58 55 48 48" fill="none" stroke="#92400e" stroke-width="3"/>
        <line x1="48" y1="30" x2="48" y2="50" stroke="#78350f" stroke-width="2"/>
    `),
    assassin: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="15" ry="17" fill="#1f2937" stroke="#6b7280" stroke-width="2"/>
        <circle cx="32" cy="18" r="10" fill="#374151"/>
        <path d="M20 6 L44 6 L32 20 Z" fill="#0f172a"/>
        <path d="M10 44 L20 36 M54 44 L44 36" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="32" cy="18" r="4" fill="#8b5cf6" opacity="0.8"/>
    `),
    healer: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="17" ry="19" fill="#d97706" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="32" cy="17" r="11" fill="#fde68a"/>
        <rect x="28" y="4" width="8" height="8" rx="2" fill="#fef08a"/>
        <line x1="46" y1="10" x2="46" y2="58" stroke="#78350f" stroke-width="3"/>
        <line x1="40" y1="14" x2="52" y2="14" stroke="#fef08a" stroke-width="4"/>
        <line x1="43" y1="11" x2="49" y2="17" stroke="#fef08a" stroke-width="3"/>
        <line x1="49" y1="11" x2="43" y2="17" stroke="#fef08a" stroke-width="3"/>
    `),
    necromancer: SVG_WRAP(`
        <ellipse cx="32" cy="42" rx="16" ry="18" fill="#4c1d95" stroke="#a78bfa" stroke-width="2"/>
        <circle cx="32" cy="18" r="11" fill="#1e1b4b"/>
        <ellipse cx="26" cy="17" rx="3" ry="4" fill="#22d3ee"/><ellipse cx="38" cy="17" rx="3" ry="4" fill="#22d3ee"/>
        <path d="M20 6 L44 6 L38 18 L26 18 Z" fill="#2e1065"/>
        <path d="M8 50 Q16 38 24 50" fill="none" stroke="#84cc16" stroke-width="2" opacity="0.8"/>
        <circle cx="12" cy="48" r="3" fill="#84cc16" opacity="0.6"/>
    `),
    paladin: SVG_WRAP(`
        <rect x="18" y="24" width="28" height="32" rx="6" fill="#e2e8f0" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="32" cy="16" r="12" fill="#fde68a" stroke="#d97706"/>
        <rect x="8" y="28" width="12" height="28" rx="3" fill="#fbbf24" stroke="#d97706"/>
        <path d="M12 32 L12 52 M8 36 L16 36" stroke="#92400e" stroke-width="2"/>
        <circle cx="32" cy="38" r="8" fill="#fbbf24" opacity="0.5"/>
    `),
    berserker: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="20" ry="22" fill="#b91c1c" stroke="#fca5a5" stroke-width="2"/>
        <circle cx="32" cy="16" r="13" fill="#fde68a"/>
        <path d="M18 10 L28 4 L32 14 L36 4 L46 10" fill="#7f1d1d"/>
        <path d="M6 38 L18 32 M58 38 L46 32" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
        <rect x="48" y="20" width="6" height="36" rx="2" fill="#78716c" transform="rotate(15 51 38)"/>
    `),
    elementalist: SVG_WRAP(`
        <ellipse cx="32" cy="42" rx="15" ry="17" fill="#312e81" stroke="#818cf8" stroke-width="2"/>
        <circle cx="32" cy="18" r="11" fill="#c4b5fd"/>
        <path d="M32 2 L36 14 L48 14 L38 22 L42 34 L32 26 L22 34 L26 22 L16 14 L28 14 Z" fill="#fbbf24" opacity="0.9"/>
        <circle cx="20" cy="50" r="5" fill="#f97316" opacity="0.7"/>
        <circle cx="44" cy="48" r="4" fill="#38bdf8" opacity="0.7"/>
        <circle cx="32" cy="54" r="4" fill="#a3e635" opacity="0.7"/>
    `),
    summoner: SVG_WRAP(`
        <ellipse cx="32" cy="42" rx="14" ry="16" fill="#581c87" stroke="#c084fc" stroke-width="2"/>
        <circle cx="32" cy="18" r="10" fill="#ede9fe"/>
        <path d="M22 8 L42 8 L32 20 Z" fill="#3b0764"/>
        <circle cx="48" cy="28" r="8" fill="#22d3ee" opacity="0.85"/>
        <circle cx="48" cy="28" r="4" fill="#ffffff" opacity="0.6"/>
        <path d="M38 30 Q44 28 48 28" stroke="#67e8f9" stroke-width="1.5" fill="none"/>
        <circle cx="16" cy="48" r="5" fill="#a78bfa" opacity="0.7"/>
    `),
    capybara: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="22" ry="16" fill="#92400e" stroke="#d97706" stroke-width="2"/>
        <ellipse cx="32" cy="32" rx="18" ry="14" fill="#b45309"/>
        <circle cx="32" cy="22" r="13" fill="#d97706" stroke="#92400e"/>
        <circle cx="26" cy="20" rx="2.5" ry="3" fill="#1f2937"/>
        <circle cx="38" cy="20" rx="2.5" ry="3" fill="#1f2937"/>
        <ellipse cx="32" cy="26" rx="4" ry="2.5" fill="#78350f"/>
        <ellipse cx="14" cy="38" rx="5" ry="3" fill="#92400e"/>
        <ellipse cx="50" cy="38" rx="5" ry="3" fill="#92400e"/>
    `),
    slayer: SVG_WRAP(`
        <defs><linearGradient id="slayer-armor" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#64748b"/></linearGradient></defs>
        <ellipse cx="32" cy="40" rx="16" ry="18" fill="url(#slayer-armor)" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="32" cy="17" r="11" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/>
        <path d="M22 8 L42 8 L32 16 Z" fill="#334155"/>
        <path d="M48 22 L60 14 L58 34 L50 36 Z" fill="#cbd5e1" stroke="#64748b"/>
        <line x1="52" y1="16" x2="54" y2="48" stroke="#e2e8f0" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M10 36 L18 30 L16 44 Z" fill="#94a3b8" stroke="#475569"/>
    `)
};

export const ENEMY_SVGS = {
    grunt: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="18" ry="6" fill="#000" opacity="0.3"/>
        <ellipse cx="32" cy="38" rx="18" ry="20" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
        <ellipse cx="32" cy="18" rx="11" ry="12" fill="#ef4444"/>
        <path d="M20 8 L24 16 M44 8 L40 16" stroke="#991b1b" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="26" cy="17" rx="3" ry="4" fill="#fef08a"/><ellipse cx="38" cy="17" rx="3" ry="4" fill="#fef08a"/>
    `),
    swarm: SVG_WRAP(`
        <ellipse cx="32" cy="50" rx="12" ry="4" fill="#000" opacity="0.25"/>
        <ellipse cx="32" cy="36" rx="14" ry="10" fill="#ea580c" stroke="#c2410c"/>
        <ellipse cx="24" cy="34" rx="8" ry="6" fill="#fb923c" opacity="0.75"/>
        <ellipse cx="40" cy="34" rx="8" ry="6" fill="#fb923c" opacity="0.75"/>
        <circle cx="26" cy="35" r="2.5" fill="#fef08a"/><circle cx="38" cy="35" r="2.5" fill="#fef08a"/>
    `),
    tank: SVG_WRAP(`
        <ellipse cx="32" cy="54" rx="22" ry="7" fill="#000" opacity="0.32"/>
        <rect x="12" y="22" width="40" height="32" rx="10" fill="#475569" stroke="#64748b" stroke-width="2"/>
        <rect x="18" y="28" width="28" height="18" rx="4" fill="#334155"/>
        <ellipse cx="32" cy="16" rx="10" ry="11" fill="#64748b"/>
        <rect x="6" y="30" width="8" height="20" rx="2" fill="#334155"/>
        <rect x="50" y="30" width="8" height="20" rx="2" fill="#334155"/>
    `),
    archer: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="16" ry="5" fill="#000" opacity="0.28"/>
        <ellipse cx="32" cy="38" rx="15" ry="17" fill="#16a34a" stroke="#15803d"/>
        <ellipse cx="32" cy="17" rx="9" ry="10" fill="#fde68a"/>
        <path d="M20 6 L44 6 L32 18 Z" fill="#14532d"/>
        <path d="M46 28 Q58 24 56 42" fill="none" stroke="#92400e" stroke-width="2.5"/>
        <line x1="46" y1="28" x2="46" y2="46" stroke="#78350f" stroke-width="2"/>
    `),
    dasher: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="17" ry="6" fill="#000" opacity="0.28"/>
        <ellipse cx="32" cy="38" rx="16" ry="18" fill="#7c3aed" stroke="#a78bfa"/>
        <ellipse cx="32" cy="17" rx="10" ry="11" fill="#c4b5fd"/>
        <path d="M32 36 L38 48 L32 44 L26 48 Z" fill="#5b21b6"/>
    `),
    splitter: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="19" ry="6" fill="#000" opacity="0.28"/>
        <path d="M32 10 L48 26 L44 48 L20 48 L16 26 Z" fill="#ca8a04" stroke="#fde68a" stroke-width="2"/>
        <path d="M32 18 L38 30 L32 42 L26 30 Z" fill="#fef08a" opacity="0.55"/>
        <line x1="32" y1="10" x2="32" y2="48" stroke="#a16207" stroke-width="1.5"/>
        <line x1="16" y1="26" x2="48" y2="26" stroke="#a16207" stroke-width="1.5"/>
    `),
    bomber: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="20" ry="7" fill="#000" opacity="0.28"/>
        <ellipse cx="32" cy="36" rx="20" ry="22" fill="#b91c1c" stroke="#ef4444" stroke-width="2"/>
        <ellipse cx="32" cy="32" rx="14" ry="16" fill="#dc2626"/>
        <path d="M22 16 L28 8 M42 16 L36 8 M32 10 L32 2" stroke="#fca5a5" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="32" r="9" fill="#fef08a" opacity="0.95"/>
        <text x="32" y="36" text-anchor="middle" font-size="11" font-weight="bold" fill="#7f1d1d">!</text>
    `),
    penetrator: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="18" ry="6" fill="#000" opacity="0.28"/>
        <path d="M20 44 L32 14 L44 44 Z" fill="#0891b2" stroke="#22d3ee" stroke-width="2"/>
        <path d="M26 38 L32 22 L38 38 Z" fill="#67e8f4" opacity="0.55"/>
        <rect x="30" y="10" width="4" height="10" rx="1" fill="#0e7490"/>
        <line x1="32" y1="20" x2="32" y2="44" stroke="#155e75" stroke-width="2"/>
    `),
    splitFragment: SVG_WRAP(`
        <ellipse cx="32" cy="50" rx="11" ry="4" fill="#000" opacity="0.22"/>
        <rect x="20" y="28" width="24" height="18" rx="4" fill="#fb923c" stroke="#f97316" stroke-width="2"/>
        <rect x="24" y="32" width="16" height="10" rx="2" fill="#fdba74" opacity="0.7"/>
    `),
    wraith: SVG_WRAP(`
        <defs><linearGradient id="wraith-grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#64748b"/></linearGradient></defs>
        <ellipse cx="32" cy="52" rx="16" ry="5" fill="#000" opacity="0.22"/>
        <path d="M18 46 Q32 8 46 46 Q40 52 32 50 Q24 52 18 46 Z" fill="url(#wraith-grad)" opacity="0.92"/>
        <ellipse cx="26" cy="28" rx="4" ry="5" fill="#0f172a" opacity="0.7"/>
        <ellipse cx="38" cy="28" rx="4" ry="5" fill="#0f172a" opacity="0.7"/>
        <path d="M28 38 Q32 42 36 38" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
    `),
    treasureChest: SVG_WRAP(`
        <defs>
            <linearGradient id="chest-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fde68a"/>
                <stop offset="55%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#b45309"/>
            </linearGradient>
            <linearGradient id="chest-lid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fef3c7"/>
                <stop offset="100%" stop-color="#d97706"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="54" rx="22" ry="6" fill="#000" opacity="0.35"/>
        <rect x="12" y="30" width="40" height="22" rx="4" fill="url(#chest-gold)" stroke="#92400e" stroke-width="2"/>
        <path d="M12 34 L52 34" stroke="#78350f" stroke-width="2"/>
        <rect x="10" y="18" width="44" height="18" rx="6" fill="url(#chest-lid)" stroke="#92400e" stroke-width="2"/>
        <rect x="28" y="26" width="8" height="14" rx="2" fill="#451a03"/>
        <circle cx="32" cy="33" r="3.5" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
        <path d="M16 22 Q32 12 48 22" fill="none" stroke="#fef08a" stroke-width="2" opacity="0.85"/>
        <circle cx="20" cy="24" r="2" fill="#fef9c3" opacity="0.9"/>
        <circle cx="44" cy="24" r="2" fill="#fef9c3" opacity="0.9"/>
    `)
};

/** Companion / minion SVGs (zombie, bear, illusion). */
export const COMPANION_SVGS = {
    zombie: SVG_WRAP(`
        <ellipse cx="32" cy="56" rx="16" ry="5" fill="#000" opacity="0.32"/>
        <ellipse cx="32" cy="40" rx="15" ry="16" fill="#3f6212" stroke="#84cc16" stroke-width="2"/>
        <circle cx="32" cy="18" r="11" fill="#4d7c0f" stroke="#a3e635" stroke-width="1.5"/>
        <ellipse cx="26" cy="17" rx="2.5" ry="3.5" fill="#22c55e"/>
        <ellipse cx="38" cy="17" rx="2.5" ry="3.5" fill="#22c55e"/>
        <path d="M24 24 Q32 28 40 24" fill="none" stroke="#14532d" stroke-width="2"/>
        <path d="M14 36 L8 48 M50 36 L56 48" stroke="#65a30d" stroke-width="3" stroke-linecap="round"/>
        <rect x="20" y="34" width="8" height="14" rx="2" fill="#365314" opacity="0.7"/>
        <rect x="36" y="34" width="8" height="14" rx="2" fill="#365314" opacity="0.7"/>
        <circle cx="20" cy="30" r="2" fill="#86efac" opacity="0.55"/>
        <circle cx="44" cy="32" r="1.5" fill="#86efac" opacity="0.45"/>
    `),
    bear: SVG_WRAP(`
        <ellipse cx="32" cy="56" rx="18" ry="5" fill="#000" opacity="0.3"/>
        <ellipse cx="32" cy="38" rx="20" ry="18" fill="#92400e" stroke="#b45309" stroke-width="2"/>
        <ellipse cx="18" cy="16" rx="7" ry="8" fill="#78350f" stroke="#a16207"/>
        <ellipse cx="46" cy="16" rx="7" ry="8" fill="#78350f" stroke="#a16207"/>
        <circle cx="32" cy="22" r="14" fill="#b45309" stroke="#f59e0b" stroke-width="1.5"/>
        <ellipse cx="26" cy="20" rx="2.2" ry="3" fill="#1c1917"/>
        <ellipse cx="38" cy="20" rx="2.2" ry="3" fill="#1c1917"/>
        <ellipse cx="32" cy="26" rx="5" ry="3.5" fill="#78350f"/>
        <circle cx="30" cy="25" r="1.2" fill="#fde68a"/><circle cx="34" cy="25" r="1.2" fill="#fde68a"/>
        <ellipse cx="14" cy="42" rx="5" ry="7" fill="#78350f"/>
        <ellipse cx="50" cy="42" rx="5" ry="7" fill="#78350f"/>
    `),
    illusion: SVG_WRAP(`
        <defs>
            <linearGradient id="illu-body" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#6d28d9"/>
            </linearGradient>
            <linearGradient id="illu-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#e9d5ff" stop-opacity="0.9"/><stop offset="100%" stop-color="#7c3aed" stop-opacity="0.3"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="56" rx="14" ry="4" fill="#7c3aed" opacity="0.35"/>
        <ellipse cx="32" cy="40" rx="14" ry="16" fill="url(#illu-body)" stroke="#a78bfa" stroke-width="2" opacity="0.88"/>
        <circle cx="32" cy="18" r="10" fill="url(#illu-glow)" stroke="#ddd6fe" stroke-width="1.5"/>
        <path d="M20 8 L44 8 L32 20 Z" fill="#4c1d95" opacity="0.85"/>
        <path d="M48 28 Q58 22 56 42" fill="none" stroke="#c4b5fd" stroke-width="2.5" opacity="0.8"/>
        <circle cx="18" cy="36" r="3" fill="#e9d5ff" opacity="0.55"/>
        <circle cx="46" cy="48" r="2.5" fill="#c4b5fd" opacity="0.5"/>
        <path d="M22 50 Q32 58 42 50" fill="none" stroke="#ddd6fe" stroke-width="1.5" opacity="0.6"/>
    `)
};

/** @param {string} characterName */
export function getPlayerSvg(characterName) {
    const key = characterName.toLowerCase();
    return PLAYER_SVGS[key] || PLAYER_SVGS.adventurer;
}

/** @param {string} enemyType */
export function getEnemySvg(enemyType) {
    return ENEMY_SVGS[enemyType] || ENEMY_SVGS.grunt;
}

/** Golden treasure chest sprite for bonus loot events. */
export function getTreasureChestSvg() {
    return ENEMY_SVGS.treasureChest;
}

/** @param {'zombie'|'bear'|'illusion'} type */
export function getCompanionSvg(type) {
    return COMPANION_SVGS[type] || COMPANION_SVGS.illusion;
}

/** Small preview SVG for character cards */
export function getCharacterPreviewSvg(characterName) {
    return getPlayerSvg(characterName).replace('class="entity-svg"', 'class="entity-svg entity-svg-preview"');
}

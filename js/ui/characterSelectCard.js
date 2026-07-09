import { getCharacterPreviewHtml } from './entityModels.js';
import {
    getCharacterRecord,
    hasCharacterBeatGame,
    getCharacterVictoryCount
} from '../systems/metaProgress.js';
import { getCharacterPassive, formatPassiveTooltipHtml } from '../config/characterPassives.js';
import { formatTime } from '../utils/math.js';

/** @typedef {import('../config/characters.js').CHARACTERS[number]} CharacterDef */

const STAT_FIELDS = [
    { label: 'HP', title: 'Hit Points', icon: '♥', stat: 'maxHp', tone: 'char-stat-hp' },
    { label: 'DMG', title: 'Damage', icon: '⚔', stat: 'physicalDamage', tone: 'char-stat-dmg' },
    { label: 'AoE', title: 'Attack Range', icon: '◎', stat: 'attackRange', tone: 'char-stat-aoe' },
    { label: 'DEF', title: 'Defence', icon: '🛡', stat: 'armour', tone: 'char-stat-def' }
];

const PASSIVE_INTERACTIVE_SELECTOR = '.character-passive-reveal, .character-passive-reveal *';

/**
 * @param {{ level?: number, wave?: number, kills?: number, time?: number }} record
 * @returns {string}
 */
export function formatCharacterBestRunText(record) {
    if (!record || (record.level ?? 0) <= 0) return '';
    return `Lv.${record.level} · Wave ${record.wave} · ${record.kills} kills · ${formatTime(record.time)}`;
}

/**
 * Campaign win count for champion badge — legacy beatGame without victoryCount → 1.
 * @param {number} victoryCount
 * @param {boolean} [beatGame]
 * @returns {number}
 */
export function formatCharacterWinCount(victoryCount, beatGame = false) {
    const count = Math.max(0, victoryCount || 0);
    if (!beatGame && count <= 0) return 0;
    return beatGame ? Math.max(1, count) : count;
}

/** @deprecated Use formatCharacterWinCount */
export function formatCharacterWinCountBadge(victoryCount, beatGame = false) {
    const wins = formatCharacterWinCount(victoryCount, beatGame);
    return wins ? String(wins) : '';
}

/**
 * @param {number} victoryCount
 * @param {boolean} [beatGame]
 * @returns {string}
 */
export function formatCharacterChampionLineText(victoryCount, beatGame = false) {
    const wins = formatCharacterWinCount(victoryCount, beatGame);
    if (!wins) return '';
    return `${wins} ★`;
}

/** @deprecated Use formatCharacterWinCount */
export function formatCharacterVictoryCountText(victoryCount) {
    const wins = formatCharacterWinCount(victoryCount, victoryCount > 0);
    return wins ? String(wins) : '';
}

/**
 * Badge under the character portrait — e.g. "3 ★".
 * @param {ReturnType<typeof getCharacterCardMeta>} cardMeta
 * @returns {string}
 */
export function buildCharacterChampionBadgeHtml(cardMeta) {
    const wins = formatCharacterWinCount(cardMeta.victoryCount, cardMeta.beatGame);
    if (!wins) return '';
    const winWord = wins === 1 ? 'win' : 'wins';
    return (
        `<span class="character-champion-badge" aria-label="${wins} campaign ${winWord}">` +
        `<span class="character-champion-count">${wins}</span>` +
        `<span class="character-champion-star" aria-hidden="true">★</span>` +
        `</span>`
    );
}

/**
 * @param {CharacterDef} char
 * @param {import('../systems/metaProgress.js').MetaProgress|null} meta
 * @returns {{
 *   bestRunText: string,
 *   championLineText: string,
 *   hasRecord: boolean,
 *   beatGame: boolean,
 *   victoryCount: number
 * }}
 */
export function getCharacterCardMeta(char, meta) {
    const record = meta ? getCharacterRecord(meta, char.name) : null;
    const hasRecord = Boolean(record && record.level > 0);
    const beatGame = meta ? hasCharacterBeatGame(meta, char.name) : false;
    const victoryCount = meta ? getCharacterVictoryCount(meta, char.name) : 0;
    const bestRunText = formatCharacterBestRunText(record);
    const championLineText = formatCharacterChampionLineText(victoryCount, beatGame);

    return {
        bestRunText,
        championLineText,
        hasRecord,
        beatGame,
        victoryCount
    };
}

/**
 * HTML for champion win badge + best run on character cards (two lines max).
 * Champions keep the yellow border via `character-card--champion`.
 * @param {ReturnType<typeof getCharacterCardMeta>} cardMeta
 * @returns {string}
 */
export function buildCharacterRecordLinesHtml(cardMeta) {
    const parts = [];

    if (cardMeta.bestRunText) {
        parts.push(
            `<span class="character-best-run has-record">${cardMeta.bestRunText}</span>`
        );
    } else if (!cardMeta.beatGame) {
        parts.push('<span class="character-best-run">No record yet</span>');
    }

    return `<div class="character-record-lines">${parts.join('')}</div>`;
}

/**
 * @param {CharacterDef['stats']} stats
 * @returns {string}
 */
export function buildCharacterStatsGridHtml(stats) {
    const cells = STAT_FIELDS.map(({ label, title, icon, stat, tone }) => {
        const value = stats[stat];
        return `<div class="char-stat-cell ${tone}" title="${title}">
            <span class="char-stat-ico ${tone}" aria-hidden="true">${icon}</span>
            <span class="char-stat-label">${label}</span>
            <span class="char-stat-value">${value}</span>
        </div>`;
    }).join('');
    return `<div class="character-stats-grid" role="group" aria-label="Base stats">${cells}</div>`;
}

/**
 * Tap/hold-friendly passive — icon in summary, full text in body (uses native <details>).
 * @param {import('../config/characterPassives.js').CharacterPassiveDef|null|undefined} passive
 * @returns {string}
 */
export function buildCharacterPassiveRevealHtml(passive) {
    if (!passive) return '';
    const tipHtml = formatPassiveTooltipHtml(passive);
    return `<details class="character-passive-reveal">
        <summary class="character-passive-reveal-summary" aria-label="Unique passive: ${passive.name}. Tap for details.">
            <span class="character-passive-reveal-icon" aria-hidden="true">${passive.icon}</span>
            <span class="character-passive-reveal-name">${passive.name}</span>
        </summary>
        <div class="character-passive-reveal-body" role="tooltip">
            ${tipHtml}
        </div>
    </details>`;
}

/** @deprecated Use buildCharacterPassiveRevealHtml */
export function buildCharacterPassiveHtml(passive) {
    return buildCharacterPassiveRevealHtml(passive);
}

/**
 * Wire select action without triggering when the user opens the passive details.
 * @param {HTMLElement} card
 * @param {(name: string) => void} onSelect
 */
export function bindCharacterCardSelect(card, onSelect) {
    const name = card.dataset.character;
    if (!name) return;

    const trySelect = (event) => {
        if (event.target.closest(PASSIVE_INTERACTIVE_SELECTOR)) return;
        onSelect(name);
    };

    card.addEventListener('click', trySelect);
    card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.target.closest(PASSIVE_INTERACTIVE_SELECTOR)) return;
        event.preventDefault();
        onSelect(name);
    });
}

/**
 * Build a compact character selection card (article — allows interactive passive details inside).
 * @param {CharacterDef} char
 * @param {number} index
 * @param {import('../systems/metaProgress.js').MetaProgress|null} meta
 * @param {(name: string) => void} [onSelect]
 * @returns {HTMLElement}
 */
export function buildCharacterCard(char, index, meta, onSelect) {
    const cardMeta = getCharacterCardMeta(char, meta);
    const passive = getCharacterPassive(char.name);
    const keyHint = index < 9 ? index + 1 : (index === 9 ? '0' : '-');

    const card = document.createElement('article');
    card.className = 'character-card' + (cardMeta.beatGame ? ' character-card--champion' : '');
    card.dataset.character = char.name;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Select ${char.name}`);
    card.innerHTML = `
        <span class="character-index">${keyHint}</span>
        <div class="character-card-inner">
            <div class="character-card-main">
                <div class="character-card-preview">${getCharacterPreviewHtml(char.name)}${buildCharacterChampionBadgeHtml(cardMeta)}</div>
                <div class="character-card-meta">
                    <h3>${char.name}</h3>
                    <span class="character-role">${char.role}</span>
                    ${buildCharacterRecordLinesHtml(cardMeta)}
                </div>
                ${buildCharacterPassiveRevealHtml(passive)}
            </div>
            ${buildCharacterStatsGridHtml(char.stats)}
            <p class="character-desc">${char.description}</p>
        </div>
    `;

    if (onSelect) bindCharacterCardSelect(card, onSelect);
    bindCharacterPassiveDesktopHover(card);
    return card;
}

/**
 * Desktop uses hover tooltips; prevent <details> toggle so [open] does not hide the tooltip body.
 * @param {HTMLElement} card
 */
export function bindCharacterPassiveDesktopHover(card) {
    if (typeof window === 'undefined') return;
    const details = card.querySelector('.character-passive-reveal');
    const summary = details?.querySelector('summary');
    if (!summary) return;

    const mq = window.matchMedia('(min-width: 769px)');
    summary.addEventListener('click', (event) => {
        if (mq.matches) event.preventDefault();
    });
}

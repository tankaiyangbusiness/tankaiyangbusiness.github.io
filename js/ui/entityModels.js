import { getPlayerSvg, getEnemySvg, getCharacterPreviewSvg, getCompanionSvg, getTreasureChestSvg } from './svgSprites.js';

/** Short badge labels shown on 2.5D enemy models (tooltip only — badge is a color cube). */
export const ENEMY_TYPE_BADGES = {
    grunt: 'Grunt',
    swarm: 'Swarm',
    tank: 'Tank',
    archer: 'Archer',
    dasher: 'Dasher',
    splitter: 'Splitter',
    bomber: 'Bomber',
    penetrator: 'Penetrator',
    wraith: 'Wraith',
    splitFragment: 'Fragment'
};

/** @param {{ type: string, label?: string }} typeConfig */
export function buildEnemyModelHtml(typeConfig) {
    const label = ENEMY_TYPE_BADGES[typeConfig.type] || typeConfig.label || typeConfig.type;
    return `
        <div class="enemy-model-25d enemy-type-${typeConfig.type}">
            <div class="enemy-ground-shadow" aria-hidden="true"></div>
            <div class="enemy-sprite enemy-sprite-${typeConfig.type}">${getEnemySvg(typeConfig.type)}</div>
            <span class="enemy-type-badge enemy-type-cube" title="${label}" aria-label="${label}"></span>
        </div>
    `;
}

/** Dedicated 2.5D model for treasure chest bonus enemies. */
export function buildTreasureChestModelHtml() {
    return `
        <div class="enemy-model-25d enemy-type-treasure">
            <div class="enemy-ground-shadow treasure-chest-shadow" aria-hidden="true"></div>
            <div class="enemy-sprite enemy-sprite-treasure">${getTreasureChestSvg()}</div>
        </div>
    `;
}

/** @param {HTMLElement} playerEl @param {string} characterName */
export function applyPlayerModel(playerEl, characterName) {
    const slug = characterName.toLowerCase();
    playerEl.classList.add('player-model', `player-${slug}`);
    playerEl.dataset.character = characterName;

    let sprite = playerEl.querySelector('.player-sprite');
    if (!sprite) {
        sprite = document.createElement('div');
        sprite.className = 'player-sprite';
        sprite.setAttribute('aria-hidden', 'true');
        playerEl.appendChild(sprite);
    }
    sprite.innerHTML = getPlayerSvg(characterName);
}

/** @param {HTMLElement} playerEl */
export function resetPlayerModel(playerEl) {
    playerEl.className = '';
    playerEl.removeAttribute('data-character');
    playerEl.querySelector('.player-sprite')?.remove();
}

/** @param {string} name */
export function getCharacterPreviewHtml(name) {
    return `<div class="char-preview-svg">${getCharacterPreviewSvg(name)}</div>`;
}

/**
 * HTML model for passive companions (zombie / bear / illusion).
 * @param {'zombie'|'bear'|'illusion'} type
 * @param {{ ranger?: boolean }} [opts]
 */
export function buildCompanionModelHtml(type, opts = {}) {
    const label = type === 'bear' ? 'Bear' : type === 'zombie' ? 'Zombie' : 'Illusion';
    const rangerClass = opts.ranger ? ' companion-illusion-ranger' : '';
    return `
        <div class="companion-model companion-${type}${rangerClass}" aria-label="${label}" title="${label}">
            <div class="companion-ground-shadow" aria-hidden="true"></div>
            <div class="companion-sprite companion-sprite-${type}">${getCompanionSvg(type)}</div>
        </div>
    `;
}

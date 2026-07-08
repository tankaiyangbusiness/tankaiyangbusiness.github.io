/** Returns the player sprite element for visual effects. @param {HTMLElement} playerEl */
export function getPlayerSprite(playerEl) {
    return playerEl.querySelector('.player-sprite') || playerEl;
}

/** @param {HTMLElement} playerEl @param {string} className @param {number} durationMs */
export function flashPlayerSprite(playerEl, className, durationMs) {
    const sprite = getPlayerSprite(playerEl);
    sprite.classList.add(className);
    setTimeout(() => sprite.classList.remove(className), durationMs);
}

/** @param {HTMLElement} anchorEl */
export function shakePlayerAnchor(anchorEl) {
    if (!anchorEl) return;
    anchorEl.classList.remove('player-damage-shake');
    void anchorEl.offsetWidth;
    anchorEl.classList.add('player-damage-shake');
}

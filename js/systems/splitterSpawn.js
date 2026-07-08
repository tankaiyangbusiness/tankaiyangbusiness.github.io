/**
 * Splitter death — spawns fast orange fragments at the death location only.
 */

/** @param {number} cx @param {number} cy @param {number} count */
export function getSplitterFragmentPositions(cx, cy, count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
        const dist = 0.6 + Math.random() * 1.1;
        positions.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist
        });
    }
    return positions;
}

/** @param {object} enemy @param {number} parentMaxHp */
export function configureSplitFragment(enemy, parentMaxHp) {
    enemy.isSplitFragment = true;
    const hp = Math.max(3, Math.floor(parentMaxHp * 0.18));
    enemy.stats.hp = hp;
    enemy.stats.maxHp = hp;
    enemy.stats.exp = Math.max(1, Math.floor(enemy.stats.exp * 0.35));
    enemy.element.classList.add('enemy-split-fragment');
    enemy.element.title = 'Splitter fragment';
}

/**
 * @param {import('../game/game.js').Game} game
 * @param {number} ex @param {number} ey
 * @param {number} splitCount @param {number} parentMaxHp
 */
export function spawnSplitterFragments(game, ex, ey, splitCount, parentMaxHp) {
    const positions = getSplitterFragmentPositions(ex, ey, splitCount);
    for (const at of positions) {
        const spawned = game._spawnEnemy('normal', 'splitFragment', {
            at,
            bypassCap: true,
            skipGroup: true,
            splitFragment: true
        });
        if (spawned) configureSplitFragment(spawned, parentMaxHp);
    }
}

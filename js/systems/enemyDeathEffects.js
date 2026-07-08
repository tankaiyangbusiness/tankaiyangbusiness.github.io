/**
 * Special enemy death behaviors — bomber blast, splitter fragments.
 */
import { spawnSplitterFragments } from './splitterSpawn.js';
import { distanceVw, rollChance } from '../utils/math.js';
import { calculatePlayerIncomingDamage } from './combat.js';

/**
 * @param {import('../game/game.js').Game} game
 * @param {object} enemy
 * @param {number} ex
 * @param {number} ey
 * @param {boolean} grantRewards
 */
export function handleEnemyDeathEffects(game, enemy, ex, ey, grantRewards) {
    if (!grantRewards || !enemy?.typeConfig) return;

    const type = enemy.typeConfig.type;

    if (type === 'bomber') {
        triggerBomberExplosion(game, enemy, ex, ey);
    }

    if (type === 'splitter' && enemy.rarity !== 'boss') {
        spawnSplitterFragments(
            game,
            ex,
            ey,
            enemy.typeConfig.splitCount || 3,
            enemy.stats.maxHp
        );
    }
}

/**
 * @param {import('../game/game.js').Game} game
 * @param {object} enemy
 * @param {number} ex
 * @param {number} ey
 */
export function triggerBomberExplosion(game, enemy, ex, ey) {
    const radiusPx = enemy.typeConfig.explosionRadius || 150;
    const damage = enemy.typeConfig.explosionDamage || 28;

    game.effects.spawnMegaExplosion(ex, ey, 'fire');
    game.effects.spawnHitEffect(ex, ey, 'fire');
    game.skillRanges?.showImpactArea(ex, ey, radiusPx, 'fire', 700);

    const s = game.state;
    const { x, y } = game.ui.getPlayerPosition();
    const dist = distanceVw(ex, ey, x, y, window.innerWidth, window.innerHeight);
    if (dist > radiusPx) return;
    if (rollChance(s.stats.evade)) return;

    const abilities = game._getAbilityLevels();
    const dealt = calculatePlayerIncomingDamage({
        enemyDamage: damage,
        playerArmour: s.stats.armour,
        damageReductionLevel: abilities.damageReductionLevel,
        ignoreArmour: false,
        elapsedSeconds: s.elapsedSeconds
    });

    s.stats.hp -= game.characterPassives?.absorbDamage(dealt) ?? dealt;
    game._onPlayerDamaged();
}

/**
 * Spark projectile simulation — isolated for tests and 4× performance tuning.
 */
import { findEnemiesInRadius } from '../config/skills.js';
import {
    projectilePointHitsEnemy,
    projectileSegmentHitsEnemy,
    hasExhaustedPierce
} from '../utils/projectileCollision.js';
import { RUNTIME_BUDGET } from '../config/runtimeBudget.js';

/** Movement tuning assumes ~60fps baseline before sim-delta scaling. */
export const SPARK_FRAME_MS = 1000 / 60;

/**
 * @param {object[]} enemies Live enemy entities from game state.
 * @returns {Array<{ id: string, x: number, y: number, hp: number, ref: object }>}
 */
export function mapEnemiesForRadiusQuery(enemies) {
    return enemies.map(e => ({
        id: e.id,
        x: parseFloat(e.element.style.left),
        y: parseFloat(e.element.style.top),
        hp: e.stats?.hp ?? 0,
        ref: e
    }));
}

/**
 * @typedef {object} SparkProjectile
 * @property {HTMLElement} el
 * @property {number} bx
 * @property {number} by
 * @property {number} vx
 * @property {number} vy
 * @property {number} expires
 * @property {Set<string>} hitIds
 * @property {number} damage
 * @property {number} wanderChance
 * @property {number} wanderTurn
 * @property {number} hitRadiusVw
 * @property {number} maxPierce
 */

/**
 * Advance spark projectiles in simulated time.
 * @param {SparkProjectile[]} sparks
 * @param {{
 *   simNow: number,
 *   simDeltaMs: number,
 *   gamePaused: boolean,
 *   gameOver: boolean,
 *   enemies: object[],
 *   innerWidth: number,
 *   innerHeight: number,
 *   onHit: (enemy: object, damage: number) => void
 * }} ctx
 * @returns {SparkProjectile[]}
 */
export function tickSparkProjectiles(sparks, ctx) {
    const {
        simNow,
        simDeltaMs,
        gamePaused,
        gameOver,
        enemies,
        innerWidth,
        innerHeight,
        onHit
    } = ctx;

    if (gamePaused || gameOver || sparks.length === 0) {
        return sparks.filter(spark => {
            if (gamePaused || gameOver) {
                spark.el?.remove();
                return false;
            }
            return true;
        });
    }

    const stepScale = Math.max(0.25, simDeltaMs / SPARK_FRAME_MS);
    const maxHits = RUNTIME_BUDGET.maxSparkHitApplicationsPerTick ?? 12;
    let hitsThisTick = 0;
    const remaining = [];

    for (const spark of sparks) {
        if (simNow >= spark.expires) {
            spark.el.remove();
            continue;
        }

        if (Math.random() < spark.wanderChance) {
            const turn = (Math.random() - 0.5) * spark.wanderTurn;
            const speed = Math.hypot(spark.vx, spark.vy) || 0.42;
            const angle = Math.atan2(spark.vy, spark.vx) + turn;
            spark.vx = Math.cos(angle) * speed;
            spark.vy = Math.sin(angle) * speed;
        }

        const prevBx = spark.bx;
        const prevBy = spark.by;
        spark.bx += spark.vx * stepScale;
        spark.by += spark.vy * stepScale;
        spark.el.style.left = `${spark.bx}vw`;
        spark.el.style.top = `${spark.by}vh`;

        const marginVw = (spark.hitRadiusVw ?? 3.2) + 3;
        const midX = (prevBx + spark.bx) * 0.5;
        const midY = (prevBy + spark.by) * 0.5;
        const radiusPx = marginVw * innerWidth / 100;
        const candidates = findEnemiesInRadius(
            mapEnemiesForRadiusQuery(enemies),
            midX,
            midY,
            radiusPx,
            innerWidth,
            innerHeight
        );

        let removeSpark = false;
        for (const target of candidates) {
            if (hitsThisTick >= maxHits) break;
            const enemy = target.ref;
            if (!enemy || enemy.stats.hp <= 0 || spark.hitIds.has(enemy.id)) continue;

            const hitRadius = spark.hitRadiusVw ?? 3.2;
            const hit = projectileSegmentHitsEnemy(
                prevBx, prevBy, spark.bx, spark.by,
                enemy, innerWidth, innerHeight, hitRadius
            ) || projectilePointHitsEnemy(
                spark.bx, spark.by, enemy, innerWidth, innerHeight, hitRadius
            );
            if (!hit) continue;

            spark.hitIds.add(enemy.id);
            onHit(enemy, spark.damage);
            hitsThisTick += 1;

            if (hasExhaustedPierce(spark.hitIds.size, spark.maxPierce ?? 1)) {
                spark.el.remove();
                removeSpark = true;
                break;
            }
        }

        if (!removeSpark) remaining.push(spark);
    }

    return remaining;
}

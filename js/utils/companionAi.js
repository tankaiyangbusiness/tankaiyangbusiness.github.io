/**
 * Shared companion / minion movement — chase, engage, leash to owner.
 * All steering runs in pixel space so vw/vh aspect ratio does not skew paths.
 */

import { distanceVw } from './math.js';

/**
 * @param {number} xVw @param {number} yVh
 * @param {number} innerWidth @param {number} innerHeight
 */
export function toPx(xVw, yVh, innerWidth, innerHeight) {
    return { x: xVw * innerWidth / 100, y: yVh * innerHeight / 100 };
}

/**
 * @param {number} xPx @param {number} yPx
 * @param {number} innerWidth @param {number} innerHeight
 */
export function toVw(xPx, yPx, innerWidth, innerHeight) {
    return { x: xPx * 100 / innerWidth, y: yPx * 100 / innerHeight };
}

/**
 * @param {object} opts
 * @param {number} opts.x @param {number} opts.y current px
 * @param {number} opts.targetX @param {number} opts.targetY seek px
 * @param {number} opts.speedPx per-frame step in pixels
 * @param {number} [opts.arriveDist=8]
 */
export function stepTowardPx(opts) {
    const { x, y, targetX, targetY, speedPx, arriveDist = 8 } = opts;
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);
    if (dist <= arriveDist) {
        return { x, y, arrived: true, dist };
    }
    const step = Math.min(speedPx, Math.max(0, dist - arriveDist * 0.1));
    return {
        x: x + (dx / dist) * step,
        y: y + (dy / dist) * step,
        arrived: false,
        dist
    };
}

/**
 * Pick nearest living enemy to a point (vw/vh).
 * @param {Array<object>} enemies
 * @param {number} x @param {number} y
 * @param {number} innerWidth @param {number} innerHeight
 */
export function findNearestEnemyAt(enemies, x, y, innerWidth, innerHeight) {
    let nearest = null;
    let min = Infinity;
    for (const enemy of enemies) {
        if (!enemy?.stats || enemy.stats.hp <= 0) continue;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        if (!Number.isFinite(ex) || !Number.isFinite(ey)) continue;
        const dist = distanceVw(x, y, ex, ey, innerWidth, innerHeight);
        if (dist < min) {
            min = dist;
            nearest = enemy;
        }
    }
    return nearest;
}

/**
 * AI step: chase/engage foes then return to owner flank; hard leash.
 * @param {object} agent { x, y } in vw/vh
 * @param {object} ctx
 * @param {'melee'|'ranged'} [ctx.style='melee']
 *   melee — close to hold distance beside the foe
 *   ranged — approach until within attackRange, then stop (illusion / archers)
 */
export function companionAiStep(agent, ctx) {
    const {
        ownerX,
        ownerY,
        enemies,
        speedVw = 0.35,
        leashVw = 12,
        homeOffsetX = 0,
        homeOffsetY = 0,
        attackRangePx = 45,
        style = 'melee',
        innerWidth,
        innerHeight
    } = ctx;

    const iw = innerWidth;
    const ih = innerHeight;
    let pos = toPx(agent.x, agent.y, iw, ih);
    const owner = toPx(ownerX, ownerY, iw, ih);
    const home = toPx(ownerX + homeOffsetX, ownerY + homeOffsetY, iw, ih);
    const speedPx = speedVw * iw / 100;
    const leashPx = leashVw * iw / 100;

    const nearest = findNearestEnemyAt(enemies, agent.x, agent.y, iw, ih);

    let targetX = home.x;
    let targetY = home.y;
    let mode = 'home';
    let arriveDist = 10;

    if (nearest) {
        const ex = parseFloat(nearest.element.style.left);
        const ey = parseFloat(nearest.element.style.top);
        const enemy = toPx(ex, ey, iw, ih);
        const toOwner = Math.hypot(enemy.x - owner.x, enemy.y - owner.y);

        // Pursue only foes inside extended leash — otherwise recall home
        if (toOwner <= leashPx * 1.45) {
            const dx = enemy.x - pos.x;
            const dy = enemy.y - pos.y;
            const dist = Math.hypot(dx, dy) || 1;

            if (style === 'ranged') {
                // Walk into shoot range, then halt — no melee orbiting
                if (dist > attackRangePx * 0.92) {
                    targetX = enemy.x;
                    targetY = enemy.y;
                    mode = 'chase';
                    arriveDist = Math.max(12, attackRangePx * 0.85);
                } else {
                    // Already in range — hold fire position
                    targetX = pos.x;
                    targetY = pos.y;
                    mode = 'engage';
                    arriveDist = 999;
                }
            } else {
                const hold = Math.max(18, attackRangePx * 0.7);
                targetX = enemy.x - (dx / dist) * hold;
                targetY = enemy.y - (dy / dist) * hold;
                mode = 'chase';
                arriveDist = 8;
            }
        }
    }

    // Hard leash: snap priority back to owner flank
    const fromOwner = Math.hypot(pos.x - owner.x, pos.y - owner.y);
    if (fromOwner > leashPx) {
        targetX = home.x;
        targetY = home.y;
        mode = 'leash';
        arriveDist = 14;
    }

    const next = stepTowardPx({
        x: pos.x,
        y: pos.y,
        targetX,
        targetY,
        speedPx: mode === 'leash' ? speedPx * 1.6 : speedPx,
        arriveDist
    });
    pos = { x: next.x, y: next.y };

    let inAttackRange = false;
    if (nearest) {
        const ex = parseFloat(nearest.element.style.left);
        const ey = parseFloat(nearest.element.style.top);
        const enemy = toPx(ex, ey, iw, ih);
        const dist = Math.hypot(pos.x - enemy.x, pos.y - enemy.y);
        inAttackRange = dist <= attackRangePx;
    }

    const vw = toVw(pos.x, pos.y, iw, ih);
    return {
        x: vw.x,
        y: vw.y,
        target: nearest,
        mode,
        inAttackRange
    };
}

/**
 * Projectile ↔ enemy hit tests — shared by frostbolt pierce and spark contact.
 */

/** @param {object} enemy @param {number} innerWidth */
export function getEnemyHitRadiusVw(enemy, innerWidth) {
    const sizePx = enemy.typeConfig?.size
        || enemy.element?.offsetWidth
        || 40;
    return (sizePx / Math.max(innerWidth, 1)) * 100 * 0.55;
}

/**
 * Point hit with optional extra radius (vw).
 * @param {number} px @param {number} py @param {object} enemy
 * @param {number} innerWidth @param {number} innerHeight @param {number} [extraRadiusVw]
 */
export function projectilePointHitsEnemy(px, py, enemy, innerWidth, innerHeight, extraRadiusVw = 0) {
    const ex = parseFloat(enemy.element.style.left);
    const ey = parseFloat(enemy.element.style.top);
    const r = getEnemyHitRadiusVw(enemy, innerWidth) + extraRadiusVw;
    const dx = (px - ex) * innerWidth / 100;
    const dy = (py - ey) * innerHeight / 100;
    return Math.hypot(dx, dy) <= r * innerWidth / 100;
}

/**
 * Segment pierce — true if the travel line passes through the enemy hit circle.
 * @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1
 */
export function projectileSegmentHitsEnemy(x0, y0, x1, y1, enemy, innerWidth, innerHeight, extraRadiusVw = 1.2) {
    const ex = parseFloat(enemy.element.style.left);
    const ey = parseFloat(enemy.element.style.top);
    const r = getEnemyHitRadiusVw(enemy, innerWidth) + extraRadiusVw;

    const ax = x0 * innerWidth / 100;
    const ay = y0 * innerHeight / 100;
    const bx = x1 * innerWidth / 100;
    const by = y1 * innerHeight / 100;
    const cx = ex * innerWidth / 100;
    const cy = ey * innerHeight / 100;
    const radiusPx = r * innerWidth / 100;

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 0.0001) {
        return Math.hypot(cx - ax, cy - ay) <= radiusPx;
    }

    const t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / lenSq));
    const closestX = ax + t * dx;
    const closestY = ay + t * dy;
    return Math.hypot(cx - closestX, cy - closestY) <= radiusPx;
}

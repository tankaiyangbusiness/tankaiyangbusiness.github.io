/**
 * Swarm spawn clusters — multiple enemies arrive together.
 * Early game uses smaller packs so players without skills can still clear.
 */

/** Absolute pack bounds (late-game ceiling). */
export const SWARM_GROUP_SIZE = { min: 2, max: 5 };
export const SWARM_GROUP_SPREAD_VW = 2.4;

/**
 * Pack size ramps with difficulty so early waves stay manageable.
 * @param {number} [difficulty=0]
 * @returns {{ min: number, max: number }}
 */
export function getSwarmGroupSizeRange(difficulty = 0) {
    const d = Math.max(0, Number(difficulty) || 0);
    if (d < 6) return { min: 2, max: 2 };
    if (d < 10) return { min: 2, max: 3 };
    if (d < 16) return { min: 2, max: 4 };
    return { min: SWARM_GROUP_SIZE.min, max: SWARM_GROUP_SIZE.max };
}

/** @param {number} anchorX @param {number} anchorY @param {number} count */
export function getSwarmGroupPositions(anchorX, anchorY, count) {
    const positions = [{ x: anchorX, y: anchorY }];
    for (let i = 1; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.8 + Math.random() * SWARM_GROUP_SPREAD_VW;
        positions.push({
            x: anchorX + Math.cos(angle) * dist,
            y: anchorY + Math.sin(angle) * dist
        });
    }
    return positions;
}

/**
 * @param {number} [difficulty=0]
 * @returns {number}
 */
export function rollSwarmGroupSize(difficulty = 0) {
    const { min, max } = getSwarmGroupSizeRange(difficulty);
    return min + Math.floor(Math.random() * (max - min + 1));
}

/** @param {number} edge 0–3 */
export function getEdgeSpawnAnchor(edge) {
    switch (edge) {
        case 0: return { x: 15 + Math.random() * 70, y: -2 };
        case 1: return { x: 102, y: 15 + Math.random() * 70 };
        case 2: return { x: 15 + Math.random() * 70, y: 102 };
        default: return { x: -2, y: 15 + Math.random() * 70 };
    }
}

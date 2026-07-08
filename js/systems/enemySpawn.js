/**
 * Swarm spawn clusters — multiple enemies arrive together.
 */

export const SWARM_GROUP_SIZE = { min: 3, max: 5 };
export const SWARM_GROUP_SPREAD_VW = 2.4;

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

/** @returns {number} */
export function rollSwarmGroupSize() {
    const { min, max } = SWARM_GROUP_SIZE;
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

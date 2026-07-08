/**
 * Distinct palette per enemy archetype — used by guide, badges, and CSS vars.
 */
export const ENEMY_TYPE_COLORS = {
    grunt: '#dc2626',
    swarm: '#f97316',
    tank: '#64748b',
    archer: '#16a34a',
    dasher: '#7c3aed',
    splitter: '#ca8a04',
    bomber: '#450a0a',
    penetrator: '#0891b2',
    wraith: '#94a3b8',
    splitFragment: '#fb923c'
};

/** @param {string} type */
export function getEnemyTypeColor(type) {
    return ENEMY_TYPE_COLORS[type] || '#94a3b8';
}

import { ENEMY_TYPES } from './enemies.js';
import { ENEMY_TYPE_COLORS } from './enemyColors.js';

/** Color-coded enemy guide entries for the in-game hint panel. */
export const ENEMY_GUIDE_ENTRIES = [
    {
        type: 'grunt',
        label: 'Grunt',
        color: ENEMY_TYPE_COLORS.grunt,
        tag: 'Melee',
        description: 'Standard chaser. Balanced HP and damage.'
    },
    {
        type: 'swarm',
        label: 'Swarm',
        color: ENEMY_TYPE_COLORS.swarm,
        tag: 'Fast',
        description: 'Small, fast, low HP. Spawns in groups of 3–5 from the edge.'
    },
    {
        type: 'tank',
        label: 'Tank',
        color: ENEMY_TYPE_COLORS.tank,
        tag: 'Armoured',
        description: 'High HP and armour. Slow but hits hard.'
    },
    {
        type: 'archer',
        label: 'Archer',
        color: ENEMY_TYPE_COLORS.archer,
        tag: 'Ranged',
        description: 'Stops at range and shoots green projectiles.'
    },
    {
        type: 'dasher',
        label: 'Dasher',
        color: ENEMY_TYPE_COLORS.dasher,
        tag: 'Dash',
        description: 'Spawns alone. Periodically dashes toward you for burst speed.'
    },
    {
        type: 'splitter',
        label: 'Splitter',
        color: ENEMY_TYPE_COLORS.splitter,
        tag: 'Split',
        description: 'On death, splits into fast orange fragments at the death spot.'
    },
    {
        type: 'bomber',
        label: 'Bomber',
        color: ENEMY_TYPE_COLORS.bomber,
        tag: 'Explode',
        description: 'Dark armored mine. Explodes on death if you are nearby.'
    },
    {
        type: 'penetrator',
        label: 'Penetrator',
        color: ENEMY_TYPE_COLORS.penetrator,
        tag: 'Pierce',
        description: 'Teal spike — attacks ignore your armour mitigation.'
    },
    {
        type: 'wraith',
        label: 'Wraith',
        color: ENEMY_TYPE_COLORS.wraith,
        tag: 'Evade',
        description: 'High evade — your attacks can miss. Evade rises with wave.'
    }
];

/** @param {string} type */
export function getEnemyGuideEntry(type) {
    return ENEMY_GUIDE_ENTRIES.find(e => e.type === type)
        || {
            type,
            label: ENEMY_TYPES[type]?.label || type,
            color: ENEMY_TYPE_COLORS[type] || '#94a3b8',
            tag: '?',
            description: ''
        };
}

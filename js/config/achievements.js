/** @typedef {{ id: string, title: string, description: string, check: (ctx: object) => boolean }} AchievementDef */

/** @type {AchievementDef[]} */
export const ACHIEVEMENTS = [
    {
        id: 'first_blood',
        title: 'First Blood',
        description: 'Defeat your first enemy.',
        check: ctx => ctx.killCount >= 1
    },
    {
        id: 'slayer_100',
        title: 'Centurion',
        description: 'Defeat 100 enemies in one run.',
        check: ctx => ctx.killCount >= 100
    },
    {
        id: 'slayer_500',
        title: 'Exterminator',
        description: 'Defeat 500 enemies in one run.',
        check: ctx => ctx.killCount >= 500
    },
    {
        id: 'level_10',
        title: 'Rising Star',
        description: 'Reach level 10 in one run.',
        check: ctx => ctx.level >= 10
    },
    {
        id: 'level_25',
        title: 'Veteran',
        description: 'Reach level 25 in one run.',
        check: ctx => ctx.level >= 25
    },
    {
        id: 'level_50',
        title: 'Elite Hunter',
        description: 'Reach level 50 in one run.',
        check: ctx => ctx.level >= 50
    },
    {
        id: 'survive_5m',
        title: 'Still Standing',
        description: 'Survive 5 minutes.',
        check: ctx => ctx.elapsedSeconds >= 300
    },
    {
        id: 'survive_15m',
        title: 'Iron Will',
        description: 'Survive 15 minutes.',
        check: ctx => ctx.elapsedSeconds >= 900
    },
    {
        id: 'streak_25',
        title: 'Unstoppable',
        description: 'Reach a 25 kill streak.',
        check: ctx => ctx.bestStreak >= 25
    },
    {
        id: 'treasure_5',
        title: 'Treasure Hunter',
        description: 'Open 5 treasure chests in one run.',
        check: ctx => ctx.treasuresOpened >= 5
    },
    {
        id: 'gear_rare',
        title: 'Well Equipped',
        description: 'Equip a rare item.',
        check: ctx => ctx.equippedRareCount >= 1
    },
    {
        id: 'gear_full',
        title: 'Fully Loaded',
        description: 'Equip items in all 7 slots.',
        check: ctx => ctx.equippedGearCount >= 7
    },
    {
        id: 'loot_20',
        title: 'Collector',
        description: 'Pick up 20 items in one run.',
        check: ctx => ctx.itemsLooted >= 20
    }
];

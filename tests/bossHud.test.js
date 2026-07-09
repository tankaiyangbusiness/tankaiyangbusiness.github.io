import { describe, it, expect } from 'vitest';
import { BossHud } from '../js/ui/bossHud.js';
import { MIDPOINT_VICTORY_WAVE, FINAL_VICTORY_WAVE } from '../js/config/milestoneBosses.js';

describe('BossHud', () => {
    function createHud() {
        const root = { hidden: true, classList: { add: () => {}, remove: () => {} } };
        const label = { textContent: '' };
        const fill = { style: { width: '' } };
        const value = { textContent: '' };

        const hud = Object.create(BossHud.prototype);
        hud._bossId = null;
        hud._priority = 0;
        hud.root = root;
        hud.label = label;
        hud.fill = fill;
        hud.value = value;
        return { hud, root, label, fill, value };
    }

    it('shows Wave 25 mini boss label', () => {
        const { hud, label } = createHud();
        hud.track({
            id: 'mini25',
            milestoneBossWave: 25,
            stats: { hp: 100, maxHp: 200 }
        });
        expect(label.textContent).toBe('Wave 25 Mini Boss');
    });

    it('syncFromEnemies tracks a living Wave 50 boss when HUD was not yet bound', () => {
        const { hud, root, label } = createHud();
        hud._bossId = null;
        const wave50Boss = {
            id: 'mid-50',
            milestoneBossWave: MIDPOINT_VICTORY_WAVE,
            stats: { hp: 9000, maxHp: 12000 }
        };

        hud.syncFromEnemies([wave50Boss]);
        expect(root.hidden).toBe(false);
        expect(hud.isTracking('mid-50')).toBe(true);
        expect(label.textContent).toBe('Wave 50 Boss');
    });

    it('syncFromEnemies clears HUD when milestone boss dies', () => {
        const { hud, root } = createHud();
        hud.track({
            id: 'mid',
            milestoneBossWave: MIDPOINT_VICTORY_WAVE,
            stats: { hp: 100, maxHp: 200 }
        });

        hud.syncFromEnemies([{
            id: 'mid',
            milestoneBossWave: MIDPOINT_VICTORY_WAVE,
            stats: { hp: 0, maxHp: 200 }
        }]);
        expect(root.hidden).toBe(true);
    });

    it('tracks and clears milestone boss HP display', () => {
        const { hud, root, label, fill, value } = createHud();
        const boss = {
            id: 'enemy-1',
            milestoneBossWave: FINAL_VICTORY_WAVE,
            stats: { hp: 2500, maxHp: 5000 }
        };

        hud.track(boss);
        expect(root.hidden).toBe(false);
        expect(label.textContent).toBe('Final Boss');
        expect(fill.style.width).toBe('50%');
        expect(value.textContent).toBe('2500 / 5000');

        hud.clear();
        expect(root.hidden).toBe(true);
        expect(hud.isTracking('enemy-1')).toBe(false);
    });

    it('shows Wave 50 label for midpoint boss', () => {
        const { hud, label } = createHud();
        hud.track({
            id: 'mid',
            milestoneBossWave: MIDPOINT_VICTORY_WAVE,
            stats: { hp: 100, maxHp: 200 }
        });
        expect(label.textContent).toBe('Wave 50 Boss');
    });

    it('Wave 100 takes HUD priority over Wave 50', () => {
        const { hud, label } = createHud();
        hud.track({
            id: 'mid',
            milestoneBossWave: MIDPOINT_VICTORY_WAVE,
            stats: { hp: 100, maxHp: 200 }
        });
        hud.track({
            id: 'final',
            milestoneBossWave: FINAL_VICTORY_WAVE,
            stats: { hp: 500, maxHp: 1000 }
        });
        expect(hud.isTracking('final')).toBe(true);
        expect(label.textContent).toBe('Final Boss');

        hud.track({
            id: 'mid-2',
            milestoneBossWave: MIDPOINT_VICTORY_WAVE,
            stats: { hp: 50, maxHp: 100 }
        });
        expect(hud.isTracking('final')).toBe(true);
    });

    it('retargets a living Wave 50 boss after Wave 100 boss dies', () => {
        const { hud, label } = createHud();
        const wave50Boss = {
            id: 'mid',
            milestoneBossWave: MIDPOINT_VICTORY_WAVE,
            stats: { hp: 80, maxHp: 200 }
        };
        const wave100Boss = {
            id: 'final',
            milestoneBossWave: FINAL_VICTORY_WAVE,
            stats: { hp: 0, maxHp: 1000 }
        };

        hud.track(wave100Boss);
        hud.onBossDeath(wave100Boss, [wave50Boss]);
        expect(hud.isTracking('mid')).toBe(true);
        expect(label.textContent).toBe('Wave 50 Boss');
    });
});

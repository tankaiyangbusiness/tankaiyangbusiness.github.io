import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SkillExecutor } from '../js/systems/skillExecutor.js';
import { getSparkConfig } from '../js/config/skills.js';
import { initGameClock, getProjectedSimMs } from '../js/systems/gameClock.js';
import { GameState } from '../js/game/gameState.js';

function makeGame(state) {
    const container = {
        children: [],
        appendChild(child) {
            child.parentElement = container;
            container.children.push(child);
        }
    };
    return {
        state,
        ui: {
            els: { gameContainer: container },
            getPlayerPosition: () => ({ x: 50, y: 50 })
        },
        skillRanges: { flash() {} },
        effects: { spawnCastFlash() {} },
        audio: { playSkillSfx() {} },
        _dealSkillDamageToEnemy() {}
    };
}

describe('SkillExecutor timed effects', () => {
    /** @type {GameState} */
    let state;
    /** @type {SkillExecutor} */
    let executor;
    /** @type {typeof document|undefined} */
    let originalDocument;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(3_000_000);
        originalDocument = globalThis.document;
        // @ts-expect-error test shim
        globalThis.document = {
            createElement() {
                return {
                    className: '',
                    style: { left: '', top: '', width: '', height: '', animationDelay: '' },
                    innerHTML: '',
                    parentElement: null,
                    classList: { add() {}, remove() {} },
                    querySelector() { return { style: { width: '', height: '' } }; },
                    remove() {}
                };
            }
        };

        state = new GameState();
        initGameClock(state);
        state.stats = {
            physicalDamage: 100,
            hp: 500,
            maxHp: 500,
            armour: 10,
            evade: 0,
            attackSpeed: 1,
            attackRange: 100,
            level: 5
        };
        vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 });
        state.skillList.spark = { level: 3, maxLevel: 5 };
        executor = new SkillExecutor(makeGame(state));
    });

    afterEach(() => {
        executor.cleanup();
        vi.useRealTimers();
        if (originalDocument) globalThis.document = originalDocument;
        else delete globalThis.document;
    });

    it('expires spark projectiles using simulated time', () => {
        const cfg = getSparkConfig(3);
        const simNow = getProjectedSimMs(state);
        executor.castSpark(50, 50, 3);
        expect(executor._activeSparks).toHaveLength(cfg.sparkCount);

        executor._tickSparks(simNow + cfg.duration - 1);
        expect(executor._activeSparks.length).toBeGreaterThan(0);

        executor._tickSparks(simNow + cfg.duration);
        expect(executor._activeSparks).toHaveLength(0);
    });
});

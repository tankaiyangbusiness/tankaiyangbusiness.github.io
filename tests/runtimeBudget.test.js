import { describe, it, expect } from 'vitest';
import {
    scaleCapForTimeScale,
    inverseSqrtCap,
    getRuntimeBudgets,
    RUNTIME_BUDGET_DEFAULTS
} from '../js/systems/runtimeBudget.js';
import { RUNTIME_BUDGET } from '../js/config/runtimeBudget.js';
import { BALANCE } from '../js/config/balance.js';

describe('runtimeBudget', () => {
    it('exposes legacy scale helpers for reference only', () => {
        expect(inverseSqrtCap(64, 1)).toBe(64);
        expect(inverseSqrtCap(64, 4)).toBe(32);
        expect(scaleCapForTimeScale(64, 4)).toBe(16);
    });

    it('returns fixed budgets identical at every game speed', () => {
        const budgets = getRuntimeBudgets();

        expect(budgets.maxEffects).toBe(RUNTIME_BUDGET.maxEffects);
        expect(budgets.maxEffects).toBe(RUNTIME_BUDGET_DEFAULTS.effects);
        expect(budgets.maxEnemies).toBe(BALANCE.maxEnemiesOnScreen);
        expect(budgets.maxProjectiles).toBe(RUNTIME_BUDGET.maxProjectiles);
        expect(budgets.projectileSpeedVwPerSec).toBe(RUNTIME_BUDGET.enemyProjectileSpeedVwPerSec);

        expect(getRuntimeBudgets()).toEqual(budgets);
    });
});

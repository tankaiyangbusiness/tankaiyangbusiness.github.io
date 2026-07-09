/**
 * Runtime DOM / timer budgets — single tuning surface for performance limits.
 * Caps are fixed at every game speed so 1×, 2×, and 4× share identical gameplay rules.
 */
import { BALANCE } from './balance.js';

export const RUNTIME_BUDGET = {
    maxEffects: 64,
    maxClassTimers: 120,
    maxSkillImpacts: 28,
    maxProjectiles: 48,
    maxEnemies: BALANCE.maxEnemiesOnScreen,
    /** Skip non-critical VFX when active nodes exceed this fraction of maxEffects. */
    cosmeticThrottleRatio: 0.55,
    /** Max floating damage numbers per budget window (scaled down at 4×). */
    damageNumberBudgetPerWindow: 10,
    /** Wall-clock ms for damage-number budget reset (divided by time scale). */
    damageNumberBudgetWindowMs: 80,
    /** Cap simultaneous skill spark projectiles. */
    maxActiveSparks: 24,
    /** Max spark damage applications per game tick (prevents 4× freeze in swarms). */
    maxSparkHitApplicationsPerTick: 12,
    /** Projectile travel speed in viewport widths per simulated second. */
    enemyProjectileSpeedVwPerSec: 52,
    /** Max vw moved per sub-step — prevents tunneling through the player at 4× sim deltas. */
    enemyProjectileMaxStepVw: 1.75,
    /** Player hit radius for enemy projectiles (pixels, matches distanceVw output). */
    enemyProjectileHitRadius: 30,
    /** Pre-allocated DOM nodes per pool — reduces churn under swarm pressure. */
    poolPrewarm: {
        projectiles: 16,
        hitEffects: 20,
        expOrbs: 16,
        damageNumbers: 12
    },
    /** Force-remove orphaned skill projectiles / trails after this wall-clock age. */
    maxTransientDomLifetimeMs: 15000
};

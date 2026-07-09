import { deepClone } from '../utils/clone.js';
import { createDefaultStatsList, createDefaultAbilityList, createAbilityLevelThresholds } from '../config/progression.js';
import { createDefaultSkillList, createSkillCooldowns } from '../config/skills.js';
import { BASE_ENEMY_STATS } from '../config/enemies.js';

/**
 * Centralized game state with guaranteed cleanup to prevent memory leaks.
 */
export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.characterSelection = true;
        this.gamePaused = false;
        this.gameOver = false;
        this.pendingUpgrades = [];

        this.stats = null;
        this.originalStats = null;
        this.enemyStats = deepClone(BASE_ENEMY_STATS);
        this.originalEnemyStats = deepClone(BASE_ENEMY_STATS);
        this.statsList = createDefaultStatsList();
        this.originalStatsList = createDefaultStatsList();
        this.abilityList = createDefaultAbilityList();
        this.originalAbilityList = createDefaultAbilityList();
        this.skillList = createDefaultSkillList();
        this.originalSkillList = createDefaultSkillList();
        this.abilityLevelThreshold = createAbilityLevelThresholds();
        this.skillCooldowns = createSkillCooldowns();

        this.enemies = [];
        this.bullets = [];
        this.effects = [];
        this.enemyAttackCooldown = {};
        this.statusEffects = {};
        this.pendingTimeouts = new Set();
        this.animationIds = new Set();

        this.gameLoopId = null;
        this.lastAttackTime = 0;
        this.elapsedSeconds = 0;
        this.timerStart = 0;
        this.pauseTime = 0;
        this.timeScale = 1;
        this.simulatedMs = 0;
        this.lastRealTickMs = 0;
        this.currentDifficultyLevel = 0;
        this.currentWave = 1;
        this.maxWaveReached = 1;
        this.previousDifficultyLevel = -1;
        this.previousWave = 0;
        this.nextEnemyId = 0;
        this.killCount = 0;
        this.itemsLooted = 0;
        this.elitesKilled = 0;
        this.bossesKilled = 0;
        this.maxHpReached = 0;
        this.runStatPeaks = null;
        this.finalVictoryAchieved = false;
        this.finalBossDefeatedThisRun = false;
        this.campaignVictoryRecorded = false;
        this.milestoneBossReinforceTime = 0;
        this.selectedCharacterName = '';
        this.selectedModelClass = '';

        this.healthRegenTime = 0;
        this.healthRegenInterval = 1000;
        this.normalSpawnTime = 0;
        this.normalSpawnInterval = 1000 * 60 / 50;
        this.rareEnemySpawnTime = 0;
        this.rareEnemySpawnInterval = 1000 * 60 / 15;
        this.eliteSpawnTime = 0;
        this.eliteSpawnInterval = 1000 * 60 / 3;
        this.bossSpawnTime = 0;
        this.bossSpawnInterval = 1000 * 60 / 1;
        this.difficultyIntervalTime = 10000;

        this.attackSpeedBuffTime = 0;
        this.attackSpeedBuffInterval = 10000;
        this.attackSpeedBuffDuration = 5000;
    }

    /** @param {object} characterStats */
    initForCharacter(characterStats) {
        this.reset();
        this.characterSelection = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.originalStats = deepClone(characterStats);
        this.stats = deepClone(characterStats);
        this.originalEnemyStats = deepClone(this.enemyStats);
        this.originalStatsList = deepClone(this.statsList);
        this.originalAbilityList = deepClone(this.abilityList);
        this.originalSkillList = deepClone(this.skillList);
        this.timerStart = Date.now();
        this.pauseTime = 0;
        this.elapsedSeconds = 0;
        this.healthRegenTime = 0;
        this.normalSpawnTime = 0;
        this.rareEnemySpawnTime = 0;
        this.eliteSpawnTime = 0;
        this.bossSpawnTime = 0;
        this.milestoneBossReinforceTime = 0;
        this.attackSpeedBuffTime = 0;
        this.lastAttackTime = 0;
        this.timeScale = 1;
        this.simulatedMs = 0;
        this.lastRealTickMs = 0;
        this.runStatPeaks = null;
        this.maxHpReached = 0;
    }

    trackTimeout(id) {
        this.pendingTimeouts.add(id);
        return id;
    }

    clearTimeout(id) {
        clearTimeout(id);
        this.pendingTimeouts.delete(id);
    }

    clearAllTimeouts() {
        this.pendingTimeouts.forEach(id => clearTimeout(id));
        this.pendingTimeouts.clear();
    }

    /**
     * Track a RAF id. Pass `previousId` when replacing a looping animation
     * so old ids do not accumulate (critical for long runs / memory).
     * @param {number} id
     * @param {number|null} [previousId]
     */
    trackAnimation(id, previousId = null) {
        if (previousId != null && previousId !== id) {
            this.animationIds.delete(previousId);
        }
        this.animationIds.add(id);
        return id;
    }

    cancelAnimation(id) {
        if (id) cancelAnimationFrame(id);
        this.animationIds.delete(id);
    }

    cancelAllAnimations() {
        this.animationIds.forEach(id => cancelAnimationFrame(id));
        this.animationIds.clear();
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    destroyEntities() {
        this.enemies.forEach(enemy => {
            this.cancelAnimation(enemy.moveAnimationId);
            enemy.element?.remove();
        });
        this.bullets.forEach(bullet => {
            this.cancelAnimation(bullet.moveAnimationId);
            bullet.element?.remove();
        });
        this.effects.forEach(effect => effect.element?.remove());

        this.enemies.length = 0;
        this.bullets.length = 0;
        this.effects.length = 0;
        this.enemyAttackCooldown = {};
        this.statusEffects = {};
    }

    fullCleanup() {
        this.cancelAllAnimations();
        this.clearAllTimeouts();
        this.destroyEntities();
    }

    restoreProgression() {
        this.enemyStats = deepClone(this.originalEnemyStats);
        this.statsList = deepClone(this.originalStatsList);
        this.abilityList = deepClone(this.originalAbilityList);
        this.skillList = deepClone(this.originalSkillList);
        this.abilityLevelThreshold = createAbilityLevelThresholds();
        this.skillCooldowns = createSkillCooldowns();
        this.pendingUpgrades = [];
    }
}

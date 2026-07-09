(() => {
  // js/config/skillScaling.js
  var SKILL_LEVEL_1_DAMAGE_FACTOR = 0.8;
  var SKILL_DAMAGE_RAMP_FACTOR = 2.5;
  function skillLevelDamageMult(level, constant, perLevelStep) {
    if (level <= 0) return 0;
    const legacyLv1 = constant + perLevelStep;
    const lv1 = legacyLv1 * SKILL_LEVEL_1_DAMAGE_FACTOR;
    if (level === 1) return lv1;
    const rampStep = perLevelStep * SKILL_DAMAGE_RAMP_FACTOR;
    return lv1 + (level - 1) * rampStep;
  }
  function skillLevelDamageFromBase(level, baseAtLv1, perLevelFrom2) {
    if (level <= 0) return 0;
    const lv1 = baseAtLv1 * SKILL_LEVEL_1_DAMAGE_FACTOR;
    if (level === 1) return lv1;
    const rampStep = perLevelFrom2 * SKILL_DAMAGE_RAMP_FACTOR;
    return lv1 + (level - 1) * rampStep;
  }
  function skillLevelDamagePercent(level, baseAtLv1, perLevelFrom2) {
    return Math.round(skillLevelDamageFromBase(level, baseAtLv1, perLevelFrom2));
  }

  // js/config/skills.js
  var SPARK_COOLDOWN_BASE_MS = 3600;
  var SPARK_COOLDOWN_FLOOR_MS = 2e3;
  var SPARK_COOLDOWN_PER_LEVEL_MS = 240;
  var SKILL_IDS = (
    /** @type {const} */
    [
      "fireball",
      "iceNova",
      "lightningArc",
      "poisonBottle",
      "healingWave",
      "frostbolt",
      "righteousFire",
      "spark",
      "illusion",
      "poisonDagger",
      "hammerSweep",
      "throwSpear"
    ]
  );
  function createDefaultSkillList() {
    return {
      fireball: { level: 0, maxLevel: 5 },
      iceNova: { level: 0, maxLevel: 5 },
      lightningArc: { level: 0, maxLevel: 5 },
      poisonBottle: { level: 0, maxLevel: 5 },
      healingWave: { level: 0, maxLevel: 5 },
      frostbolt: { level: 0, maxLevel: 5 },
      righteousFire: { level: 0, maxLevel: 5 },
      spark: { level: 0, maxLevel: 5 },
      illusion: { level: 0, maxLevel: 5 },
      poisonDagger: { level: 0, maxLevel: 5 },
      hammerSweep: { level: 0, maxLevel: 5 },
      throwSpear: { level: 0, maxLevel: 5 }
    };
  }
  function createInitialPlayerSkills() {
    return {
      fireball: 0,
      iceNova: 0,
      lightningArc: 0,
      poisonBottle: 0,
      healingWave: 0,
      frostbolt: 0,
      righteousFire: 0,
      spark: 0,
      illusion: 0,
      poisonDagger: 0,
      hammerSweep: 0,
      throwSpear: 0
    };
  }
  function createSkillCooldowns() {
    return {
      fireball: 0,
      iceNova: 0,
      lightningArc: 0,
      poisonBottle: 0,
      healingWave: 0,
      frostbolt: 0,
      righteousFire: 0,
      spark: 0,
      illusion: 0,
      poisonDagger: 0,
      hammerSweep: 0,
      throwSpear: 0
    };
  }
  var SKILL_TAG_LABELS = {
    fire: "Fire",
    cold: "Cold",
    lightning: "Lightning",
    chaos: "Chaos",
    holy: "Holy",
    arcane: "Arcane",
    physical: "Physical",
    elemental: "Elemental",
    healing: "Healing",
    area: "Area",
    projectile: "Projectile",
    chain: "Chain",
    fork: "Fork",
    aura: "Aura",
    minion: "Minion"
  };
  var SKILL_DEFINITIONS = {
    fireball: {
      id: "fireball",
      name: "Fireball",
      icon: "\u{1F525}",
      element: "fire",
      tags: ["fire", "elemental", "projectile", "area"],
      rangeType: "cast",
      description: "Hurls an explosive fireball. Direct hit + AoE splash + burn DoT.",
      formatText(level, nextLevel) {
        const cfg = getFireballConfig(nextLevel);
        return `Fireball Lv.${nextLevel}: ${Math.round(cfg.directDamageMult * 100)}% hit, ${Math.round(cfg.splashDamageMult * 100)}% splash, burn ${Math.round(cfg.burnTotalMult * 100)}%. Range ${cfg.castRange}px`;
      }
    },
    iceNova: {
      id: "iceNova",
      name: "Ice Nova",
      icon: "\u2744\uFE0F",
      element: "cold",
      tags: ["cold", "elemental", "area"],
      rangeType: "area",
      description: "Freezing wave around you. Damages all nearby enemies and slows them.",
      formatText(level, nextLevel) {
        const cfg = getIceNovaConfig(nextLevel);
        const freeze = cfg.freezeDuration > 0 ? `, freeze ${cfg.freezeDuration / 1e3}s` : "";
        return `Ice Nova Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% AoE, slow ${cfg.slowPercent}%${freeze}. Radius ${cfg.radius}px`;
      }
    },
    lightningArc: {
      id: "lightningArc",
      name: "Lightning Arc",
      icon: "\u26A1",
      element: "lightning",
      tags: ["lightning", "elemental", "chain"],
      rangeType: "cast",
      description: "Instant arc that chains through multiple enemies.",
      formatText(level, nextLevel) {
        const cfg = getLightningArcConfig(nextLevel);
        return `Lightning Arc Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% dmg, ${cfg.chainCount} chains. Range ${cfg.castRange}px`;
      }
    },
    poisonBottle: {
      id: "poisonBottle",
      name: "Chaos Bottle",
      icon: "\u{1F9EA}",
      element: "chaos",
      tags: ["chaos", "projectile", "area"],
      rangeType: "cast",
      description: "Throws a chaos flask that shatters into a toxic ground pool.",
      formatText(level, nextLevel) {
        const cfg = getPoisonBottleConfig(nextLevel);
        return `Chaos Bottle Lv.${nextLevel}: ${Math.round(cfg.directDamageMult * 100)}% impact, pool ${cfg.poolDuration / 1e3}s, ${Math.round(cfg.tickDamageMult * 100)}%/tick. Pool r${cfg.poolRadius}px`;
      }
    },
    healingWave: {
      id: "healingWave",
      name: "Healing Wave",
      icon: "\u{1F49A}",
      element: "heal",
      tags: ["holy", "healing"],
      rangeType: "self",
      description: "Restores a portion of your max HP. Auto-casts when injured.",
      formatText(level, nextLevel) {
        const cfg = getHealingWaveConfig(nextLevel);
        return `Healing Wave Lv.${nextLevel}: restore ${cfg.healPercent}% max HP. Cooldown ${(cfg.cooldown / 1e3).toFixed(1)}s`;
      }
    },
    frostbolt: {
      id: "frostbolt",
      name: "Frostbolt",
      icon: "\u{1F9CA}",
      element: "cold",
      tags: ["cold", "elemental", "projectile"],
      rangeType: "cast",
      description: "Slow frost shard \u2014 pierces every enemy in its path (once each). Long cooldown.",
      formatText(level, nextLevel) {
        const cfg = getFrostboltConfig(nextLevel);
        return `Frostbolt Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% cold, unlimited pierce, range ${cfg.castRange}px`;
      }
    },
    righteousFire: {
      id: "righteousFire",
      name: "Righteous Fire",
      icon: "\u{1F525}",
      element: "fire",
      tags: ["fire", "elemental", "aura", "area"],
      rangeType: "aura",
      description: "PoE-style burning aura \u2014 constant fire DoT around you while active.",
      formatText(level, nextLevel) {
        const cfg = getRighteousFireConfig(nextLevel);
        return `Righteous Fire Lv.${nextLevel}: ${Math.round(cfg.tickDamageMult * 100)}%/tick, radius ${cfg.radius}px`;
      }
    },
    spark: {
      id: "spark",
      name: "Spark",
      icon: "\u2728",
      element: "lightning",
      tags: ["lightning", "elemental", "projectile"],
      rangeType: "cast",
      description: "PoE-style sparks from your center \u2014 spider out in random directions with a large hit bubble. Pierce 2.",
      formatText(level, nextLevel) {
        const cfg = getSparkConfig(nextLevel);
        return `Spark Lv.${nextLevel}: ${cfg.sparkCount} sparks, ${Math.round(cfg.damageMult * 100)}% dmg, pierce ${cfg.maxPierce}, AOE ${cfg.hitRadiusVw.toFixed(1)}vw`;
      }
    },
    illusion: {
      id: "illusion",
      name: "Illusion",
      icon: "\u25C8",
      element: "arcane",
      tags: ["arcane", "minion"],
      rangeType: "self",
      description: "Summons an invulnerable clone beside you. Mirrors your basic attacks at reduced damage within your attack range (AOE).",
      formatText(level, nextLevel) {
        const cfg = getIllusionConfig(nextLevel);
        return `Illusion Lv.${nextLevel}: ${cfg.damagePercent}% clone damage, your AOE range, ${(cfg.duration / 1e3).toFixed(1)}s duration, ${(cfg.cooldown / 1e3).toFixed(1)}s cooldown`;
      }
    },
    poisonDagger: {
      id: "poisonDagger",
      name: "Poison Dagger",
      icon: "\u{1F5E1}\uFE0F",
      element: "chaos",
      tags: ["chaos", "projectile", "fork"],
      rangeType: "cast",
      description: "Throws a chaos dagger. On hit, forks into extra angled daggers that continue traveling.",
      formatText(level, nextLevel) {
        const cfg = getPoisonDaggerConfig(nextLevel);
        return `Poison Dagger Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% hit, fork \xD7${cfg.forkCount}, ${Math.round(cfg.forkDamageMult * 100)}% fork dmg. Range ${cfg.castRange}px`;
      }
    },
    hammerSweep: {
      id: "hammerSweep",
      name: "Hammer Sweep",
      icon: "\u{1F528}",
      element: "physical",
      tags: ["physical", "area"],
      rangeType: "area",
      description: "Sweeping hammer smash \u2014 deals physical damage to all enemies around you.",
      formatText(level, nextLevel) {
        const cfg = getHammerSweepConfig(nextLevel);
        return `Hammer Sweep Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% physical AoE. Radius ${cfg.radius}px`;
      }
    },
    throwSpear: {
      id: "throwSpear",
      name: "Throw Spear",
      icon: "\u{1F531}",
      element: "physical",
      tags: ["physical", "projectile"],
      rangeType: "cast",
      description: "Hurls a spear in a straight line. Pierces up to 6 enemies beyond the first (7 unique hits max).",
      formatText(level, nextLevel) {
        const cfg = getThrowSpearConfig(nextLevel);
        return `Throw Spear Lv.${nextLevel}: ${Math.round(cfg.damageMult * 100)}% physical, pierce ${cfg.maxPierce}, range ${cfg.castRange}px`;
      }
    }
  };
  function getFireballConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, castRange: 0, directDamageMult: 0, splashRadius: 0, splashDamageMult: 0, burnTotalMult: 0, burnDuration: 0, projectileSpeed: 0, maxPierce: 0 };
    }
    return {
      cooldown: Math.max(1200, 2500 - level * 200),
      castRange: 160 + level * 35,
      directDamageMult: skillLevelDamageMult(level, 0.75, 0.1),
      splashRadius: 85 + level * 15,
      splashDamageMult: skillLevelDamageMult(level, 0.32, 0.06),
      burnTotalMult: skillLevelDamageMult(level, 0.12, 0.05),
      burnDuration: 3500,
      projectileSpeed: 0.95 + level * 0.06,
      /** No pierce — first hit explodes */
      maxPierce: 0
    };
  }
  function getIceNovaConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, radius: 0, damageMult: 0, slowPercent: 0, slowDuration: 0, freezeDuration: 0 };
    }
    return {
      cooldown: Math.max(2e3, 4e3 - level * 300),
      radius: 70 + level * 22,
      damageMult: skillLevelDamageMult(level, 0.48, 0.11),
      slowPercent: 18 + level * 6,
      slowDuration: 2200 + level * 200,
      freezeDuration: level >= 3 ? (level - 2) * 550 : 0
    };
  }
  function getLightningArcConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, castRange: 0, chainCount: 0, damageMult: 0, chainRange: 0 };
    }
    return {
      cooldown: Math.max(900, 1800 - level * 150),
      castRange: 200 + level * 30,
      chainCount: level,
      damageMult: skillLevelDamageMult(level, 0.5, 0.09),
      chainRange: 190 + level * 28
    };
  }
  function getPoisonBottleConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, castRange: 0, directDamageMult: 0, poolRadius: 0, poolDuration: 0, tickInterval: 0, tickDamageMult: 0, projectileSpeed: 0 };
    }
    return {
      cooldown: Math.max(2200, 3800 - level * 280),
      castRange: 180 + level * 32,
      directDamageMult: skillLevelDamageMult(level, 0.35, 0.08),
      poolRadius: 55 + level * 14,
      poolDuration: 4500 + level * 600,
      tickInterval: Math.max(280, 450 - level * 30),
      tickDamageMult: skillLevelDamageMult(level, 0.07, 0.035),
      projectileSpeed: 0.75 + level * 0.05
    };
  }
  function getHealingWaveConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, healPercent: 0 };
    }
    return {
      cooldown: Math.max(2800, 5500 - level * 380),
      healPercent: 7 + level * 3.5
    };
  }
  function getFrostboltConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, castRange: 0, damageMult: 0, projectileSpeed: 0, maxTravel: 0, maxPierce: 0 };
    }
    return {
      cooldown: Math.max(2800, 4800 - level * 320),
      castRange: 200 + level * 35,
      damageMult: skillLevelDamageMult(level, 0.55, 0.1),
      projectileSpeed: 0.55 + level * 0.05,
      maxTravel: 55 + level * 8,
      /** Unlimited pierce — travel distance ends the bolt */
      maxPierce: Infinity,
      pierceAll: true
    };
  }
  function getRighteousFireConfig(level) {
    if (level <= 0) {
      return { radius: 0, tickDamageMult: 0, tickInterval: 0 };
    }
    const baseRadius = 55 + level * 18;
    return {
      radius: Math.round(baseRadius * 1.5),
      /** Lv.1 ≈ 9.6% tick, steep ramp per level (see skillScaling.js) */
      tickDamageMult: skillLevelDamageMult(level, 0.095, 0.025),
      tickInterval: Math.max(400, 650 - level * 40)
    };
  }
  function getSparkConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, sparkCount: 0, damageMult: 0, duration: 0, speed: 0, hitRadiusVw: 0, maxPierce: 0 };
    }
    return {
      cooldown: Math.max(SPARK_COOLDOWN_FLOOR_MS, SPARK_COOLDOWN_BASE_MS - level * SPARK_COOLDOWN_PER_LEVEL_MS),
      /** PoE-style swarm from center */
      sparkCount: 4 + level,
      damageMult: skillLevelDamageMult(level, 0.28, 0.06),
      duration: 2800 + level * 400,
      /** Slowish spider crawl */
      speed: 0.42 + level * 0.045,
      wanderChance: 0.38,
      wanderTurn: 2.2,
      /** Large hit bubble (vw) — PoE Spark AOE feel */
      hitRadiusVw: 6.8 + level * 0.55,
      /** Pierce 2: dies after 3 unique enemy hits */
      maxPierce: 2
    };
  }
  function getIllusionConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, duration: 0, damagePercent: 0, offsetVw: 0 };
    }
    return {
      /** Faster resummon — ~9.8s at Lv.1 down to 5s floor at Lv.5 */
      cooldown: Math.max(5e3, 11e3 - level * 1200),
      duration: 4500 + level * 900,
      /** 24% at Lv.1 → 99% at Lv.5 (see skillScaling.js) */
      damagePercent: skillLevelDamagePercent(level, 30, 7.5),
      offsetVw: 4.5
    };
  }
  function getPoisonDaggerConfig(level) {
    if (level <= 0) {
      return {
        cooldown: Infinity,
        castRange: 0,
        damageMult: 0,
        forkCount: 0,
        forkDamageMult: 0,
        projectileSpeed: 0,
        forkTravel: 0,
        hitRadiusVw: 0
      };
    }
    return {
      cooldown: Math.max(1400, 2800 - level * 220),
      castRange: 190 + level * 30,
      damageMult: skillLevelDamageMult(level, 0.5, 0.09),
      /** Primary dagger forks into this many secondary blades on first hit */
      forkCount: 1 + level,
      forkDamageMult: skillLevelDamageMult(level, 0.32, 0.06),
      forkSpreadRad: 0.55,
      projectileSpeed: 0.85 + level * 0.05,
      maxTravel: 48 + level * 6,
      forkTravel: 28 + level * 4,
      hitRadiusVw: 2.4 + level * 0.15
    };
  }
  function getHammerSweepConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, radius: 0, damageMult: 0 };
    }
    return {
      cooldown: Math.max(1800, 3600 - level * 280),
      radius: 75 + level * 20,
      /** Lv.1 ≈ 76.8% damage, steep ramp per level (see skillScaling.js) */
      damageMult: skillLevelDamageMult(level, 0.84, 0.12)
    };
  }
  function getThrowSpearConfig(level) {
    if (level <= 0) {
      return { cooldown: Infinity, castRange: 0, damageMult: 0, projectileSpeed: 0, maxTravel: 0, hitRadiusVw: 0, maxPierce: 0 };
    }
    return {
      cooldown: Math.max(1600, 3200 - level * 250),
      castRange: 220 + level * 35,
      damageMult: skillLevelDamageMult(level, 0.62, 0.1),
      projectileSpeed: 0.72 + level * 0.05,
      maxTravel: 58 + level * 8,
      hitRadiusVw: 2.6 + level * 0.2,
      /** Pierce 6: disappears after hitting a 7th unique enemy */
      maxPierce: 6
    };
  }
  function getSkillConfig(id, level) {
    switch (id) {
      case "fireball":
        return getFireballConfig(level);
      case "iceNova":
        return getIceNovaConfig(level);
      case "lightningArc":
        return getLightningArcConfig(level);
      case "poisonBottle":
        return getPoisonBottleConfig(level);
      case "healingWave":
        return getHealingWaveConfig(level);
      case "frostbolt":
        return getFrostboltConfig(level);
      case "righteousFire":
        return getRighteousFireConfig(level);
      case "spark":
        return getSparkConfig(level);
      case "illusion":
        return getIllusionConfig(level);
      case "poisonDagger":
        return getPoisonDaggerConfig(level);
      case "hammerSweep":
        return getHammerSweepConfig(level);
      case "throwSpear":
        return getThrowSpearConfig(level);
      default:
        return {};
    }
  }
  function getSkillDisplayRadius(id, level, playerAttackRange = 0) {
    const cfg = getSkillConfig(id, level);
    if (id === "illusion") return Math.max(0, Number(playerAttackRange) || 0);
    if (id === "iceNova" || id === "hammerSweep") return cfg.radius;
    if (id === "righteousFire") return cfg.radius;
    if (id === "healingWave") return 0;
    if (id === "spark") {
      return (cfg.hitRadiusVw || 0) * (typeof window !== "undefined" ? window.innerWidth : 1e3) / 100;
    }
    if (id === "fireball" || id === "lightningArc" || id === "poisonBottle" || id === "frostbolt" || id === "poisonDagger" || id === "throwSpear") {
      return cfg.castRange;
    }
    return 0;
  }
  function findEnemiesInRadius(enemies, cx, cy, radiusPx, innerWidth, innerHeight, excludeId = null) {
    return enemies.filter((e) => {
      if (excludeId && e.id === excludeId) return false;
      if (e.hp <= 0) return false;
      const dx = Math.abs(e.x - cx) * innerWidth / 100;
      const dy = Math.abs(e.y - cy) * innerHeight / 100;
      return Math.hypot(dx, dy) <= radiusPx;
    });
  }
  function findChainTargets(enemies, originX, originY, excludeId, maxCount, rangePx, innerWidth, innerHeight) {
    return enemies.filter((e) => e.id !== excludeId && e.hp > 0).map((e) => {
      const dx = Math.abs(e.x - originX) * innerWidth / 100;
      const dy = Math.abs(e.y - originY) * innerHeight / 100;
      return { ...e, dist: Math.hypot(dx, dy) };
    }).filter((e) => e.dist <= rangePx).sort((a, b) => a.dist - b.dist).slice(0, maxCount);
  }
  function syncPlayerSkillLevels(skills, skillList) {
    SKILL_IDS.forEach((id) => {
      skills[id] = skillList[id]?.level || 0;
    });
  }
  function computeSkillDamage(baseDamage, id, level) {
    const cfg = getSkillConfig(id, level);
    if (id === "fireball") return Math.floor(baseDamage * cfg.directDamageMult);
    if (id === "iceNova") return Math.floor(baseDamage * cfg.damageMult);
    if (id === "lightningArc") return Math.floor(baseDamage * cfg.damageMult);
    if (id === "poisonBottle") return Math.floor(baseDamage * cfg.directDamageMult);
    if (id === "frostbolt") return Math.floor(baseDamage * cfg.damageMult);
    if (id === "spark") return Math.floor(baseDamage * cfg.damageMult);
    if (id === "righteousFire") return Math.max(1, Math.floor(baseDamage * cfg.tickDamageMult));
    if (id === "poisonDagger") return Math.floor(baseDamage * cfg.damageMult);
    if (id === "hammerSweep") return Math.floor(baseDamage * cfg.damageMult);
    if (id === "throwSpear") return Math.floor(baseDamage * cfg.damageMult);
    return 0;
  }
  function computePoisonDaggerForkDamage(baseDamage, level) {
    const cfg = getPoisonDaggerConfig(level);
    return Math.max(1, Math.floor(baseDamage * cfg.forkDamageMult));
  }
  function computeSplashDamage(baseDamage, level) {
    return Math.floor(baseDamage * getFireballConfig(level).splashDamageMult);
  }
  function computeBurnTotal(baseDamage, level) {
    return Math.floor(baseDamage * getFireballConfig(level).burnTotalMult);
  }
  function computePoisonTickDamage(baseDamage, level) {
    return Math.max(1, Math.floor(baseDamage * getPoisonBottleConfig(level).tickDamageMult));
  }
  function getSkillTags(skillId) {
    return SKILL_DEFINITIONS[skillId]?.tags || [];
  }
  function formatSkillTagsHtml(tags = []) {
    if (!tags.length) return "";
    return tags.map((tag) => {
      const label = SKILL_TAG_LABELS[tag] || tag;
      return `<span class="skill-tag skill-tag-${tag}">${label}</span>`;
    }).join("");
  }
  function formatSkillTooltipHtml(def, level = 0) {
    if (!def) return "";
    const tagsHtml = formatSkillTagsHtml(def.tags || []);
    const statsLine = level > 0 && def.formatText ? def.formatText(level, level) : "";
    return `
        <strong class="skill-tip-name">${def.name}</strong>
        ${tagsHtml ? `<div class="skill-tip-tags">${tagsHtml}</div>` : ""}
        <p class="skill-tip-desc">${def.description}</p>
        ${statsLine ? `<p class="skill-tip-stats">${statsLine}</p>` : ""}
        ${level <= 0 ? '<p class="skill-tip-locked">Not learned \u2014 level up to unlock</p>' : ""}
    `;
  }

  // js/config/balance.js
  var BALANCE = {
    /** Seconds before difficulty tier increases — slower ramp for longer runs */
    /** 12s per wave → wave 100 at 20 minutes (1200s). */
    difficultyIntervalSec: 12,
    /** Extended warmup — gentler first ~3 minutes */
    /**
     * Warmup spawn curve — higher early density, identical asymptote (≥ warmupSeconds → 1.0).
     * Ease-out exponent (< 1) raises early waves without changing late/end-game rates.
     */
    warmupSeconds: 180,
    warmupSpawnMultiplier: 0.52,
    /** Curve power for early ramp: t^k with k&lt;1 → more enemies earlier, still hits 1.0 at end of warmup */
    warmupSpawnEase: 0.62,
    /** Hard cap — raised slightly, still capped to protect FPS/memory */
    maxEnemiesOnScreen: 55,
    /** Enemy damage reduced through early waves (0–11) — HP/EXP only; attack uses enemyAttackTime */
    earlyWaveCap: 12,
    /** @deprecated Wave-based damage reduction — use enemyAttackTime scaling at hit time instead */
    earlyWaveDamageMultiplier: 0.5,
    /**
     * Time-based enemy attack damage curve (uses run elapsedSeconds).
     * 0s: −10% damage → 8min: normal → +10% every 8min thereafter (16m +10%, 24m +20%…).
     */
    enemyAttackTime: {
      earlyPenalty: 0.1,
      normalizeAtSec: 480,
      rampIntervalSec: 480,
      rampStep: 0.1
    },
    /** Early-wave HP reduction (−30% through wave 11) */
    earlyWaveHpMultiplier: 0.7,
    /** Early-wave EXP bonus (+50% through wave 11) */
    earlyWaveExpMultiplier: 1.5,
    spawnsPerMinute: {
      normal: 22.5,
      rare: 8.625,
      elite: 1.8,
      boss: 0.525
    },
    spawnScaling: {
      normal: 2.9,
      rare: 1.35,
      elite: 0.5,
      boss: 0.04
    },
    maxDifficultyForSpawn: 300,
    /** Enemy HP scale — tuned with BASE_ENEMY_STATS.hp. */
    enemyHpScale: 0.52,
    /** Direct damage scale (includes prior global −19% folded in). */
    enemyDamageScale: 0.62261,
    /** +10% exp vs prior patch (0.842 × 1.1) */
    enemyExpScale: 0.926,
    /**
     * Flat multipliers from the start (not HP / moveSpeed).
     * Damage & attackSpeed +20%; armour +10%. Archer range bumped in ENEMY_TYPES.
     */
    enemyBaseDamageBonus: 1.2,
    enemyBaseAttackSpeedBonus: 1.2,
    enemyBaseArmourBonus: 1.1,
    playerPressure: {
      moveSpeedPerTier: 8e-3,
      moveSpeedCap: 1.28
    },
    /**
     * Fewer ambient spawns during the mid-campaign (waves 6–49) to reduce clutter
     * before the Wave 50 milestone.
     */
    midCampaignSpawnReduction: {
      afterWave: 5,
      beforeWave: 50,
      multiplier: 0.51
    }
  };
  function getSpawnIntervalMs(category, difficulty) {
    const cap = Math.min(difficulty, BALANCE.maxDifficultyForSpawn);
    const base = BALANCE.spawnsPerMinute[category];
    const scale = BALANCE.spawnScaling[category];
    const rate = base + scale * cap;
    return 1e3 * 60 / rate;
  }
  function getWaveSpawnDensityMultiplier(currentWave) {
    const cfg = BALANCE.midCampaignSpawnReduction;
    if (!cfg) return 1;
    if (currentWave > cfg.afterWave && currentWave < cfg.beforeWave) {
      return cfg.multiplier;
    }
    return 1;
  }
  function applyBalanceScale(stat, type) {
    if (type === "hp") return Math.floor(stat * BALANCE.enemyHpScale);
    if (type === "damage") return Math.floor(stat * BALANCE.enemyDamageScale);
    return Math.floor(stat * BALANCE.enemyExpScale);
  }
  function applyEnemyMovePressure(baseMoveSpeed, difficulty) {
    const bonus = Math.min(
      BALANCE.playerPressure.moveSpeedCap,
      1 + difficulty * BALANCE.playerPressure.moveSpeedPerTier
    );
    return baseMoveSpeed * bonus;
  }
  function getEnemyAttackTimeMultiplier(elapsedSeconds) {
    const cfg = BALANCE.enemyAttackTime;
    const t = Math.max(0, Number(elapsedSeconds) || 0);
    const { earlyPenalty, normalizeAtSec, rampIntervalSec, rampStep } = cfg;
    if (t < normalizeAtSec) {
      const progress = t / normalizeAtSec;
      return 1 - earlyPenalty + earlyPenalty * progress;
    }
    const blocksAfterNormalize = Math.floor((t - normalizeAtSec) / rampIntervalSec);
    return 1 + blocksAfterNormalize * rampStep;
  }
  function scaleEnemyAttackDamageForElapsed(baseDamage, elapsedSeconds) {
    const mult = getEnemyAttackTimeMultiplier(elapsedSeconds);
    return Math.max(1, Math.floor(baseDamage * mult + 1e-9));
  }
  function applyEarlyWaveHpReduction(hp, difficultyWave) {
    if (difficultyWave >= BALANCE.earlyWaveCap) return hp;
    return Math.max(1, Math.floor(hp * BALANCE.earlyWaveHpMultiplier));
  }
  function applyEarlyWaveExpBonus(exp, difficultyWave) {
    if (difficultyWave >= BALANCE.earlyWaveCap) return exp;
    return Math.max(1, Math.floor(exp * BALANCE.earlyWaveExpMultiplier));
  }
  function applyEnemyStartingCombatBoost(stats) {
    if (!stats) return stats;
    const dmgMult = BALANCE.enemyBaseDamageBonus || 1.2;
    const asMult = BALANCE.enemyBaseAttackSpeedBonus || 1.2;
    const armMult = BALANCE.enemyBaseArmourBonus || 1.1;
    if (typeof stats.physicalDamage === "number") {
      stats.physicalDamage = Math.max(1, Math.floor(stats.physicalDamage * dmgMult + 1e-9));
    }
    if (typeof stats.attackSpeed === "number") {
      stats.attackSpeed = Math.max(0.1, Number((stats.attackSpeed * asMult).toFixed(3)));
    }
    if (typeof stats.armour === "number" && stats.armour > 0) {
      stats.armour = Math.max(0, Math.floor(stats.armour * armMult + 1e-9));
    }
    return stats;
  }

  // js/config/expProgression.js
  var EXP_CONFIG = {
    baseThreshold: 14,
    linearFactor: 0.55,
    powerExponent: 1.85,
    powerMultiplier: 1.5,
    /**
     * Kill EXP = enemy.stats.exp × grantRatio × playerExpGain × streak.
     * 1.0 grants the full enemy exp stat (no hidden 10% tax).
     */
    enemyExpGrantRatio: 1,
    /** Early-wave minimum kill EXP by enemy category (waves 1–12). */
    earlyWaveKillExp: {
      standard: 2,
      swarm: 1
    },
    /** Additional reduction on swarm/split-fragment kill payout. */
    swarmKillMultiplier: 0.55,
    thresholdMultiplier: 1.2,
    goldPerExp: 0.45,
    streakBonusCap: 0.22,
    streakBonusPerKill: 0.018
  };
  var EXP_KILL_WAVE_MODIFIERS = {
    baseline: 0.95,
    afterWave50: { thresholdWave: 50, multiplier: 0.95 },
    afterWave100: { thresholdWave: 100, multiplier: 0.9 }
  };
  function getExpKillWaveMultiplier(waveIndex = 0) {
    const wave = Math.max(1, Math.floor(waveIndex) + 1);
    let mult = EXP_KILL_WAVE_MODIFIERS.baseline;
    if (wave > EXP_KILL_WAVE_MODIFIERS.afterWave50.thresholdWave) {
      mult *= EXP_KILL_WAVE_MODIFIERS.afterWave50.multiplier;
    }
    if (wave > EXP_KILL_WAVE_MODIFIERS.afterWave100.thresholdWave) {
      mult *= EXP_KILL_WAVE_MODIFIERS.afterWave100.multiplier;
    }
    return mult;
  }
  var enemyExpMultiplier = EXP_CONFIG.enemyExpGrantRatio;
  function calculateExpThreshold(level, baseThreshold) {
    const b = baseThreshold ?? EXP_CONFIG.baseThreshold;
    const raw = b + Math.floor(
      b * level * EXP_CONFIG.linearFactor + Math.pow(level, EXP_CONFIG.powerExponent) * EXP_CONFIG.powerMultiplier
    );
    return Math.floor(raw * EXP_CONFIG.thresholdMultiplier);
  }
  function calculateExpFromKill(enemyExp, expGain, streakBonus = 0, context = {}) {
    const { waveIndex = 0, enemyType = "grunt" } = context;
    const isSwarmLike = enemyType === "swarm" || enemyType === "splitFragment";
    let gained = Math.floor(
      enemyExp * EXP_CONFIG.enemyExpGrantRatio * expGain * (1 + streakBonus)
    );
    gained = Math.max(1, gained);
    if (isSwarmLike) {
      gained = Math.max(1, Math.floor(gained * EXP_CONFIG.swarmKillMultiplier));
    }
    gained = Math.max(1, Math.floor(gained * getExpKillWaveMultiplier(waveIndex)));
    if (waveIndex < BALANCE.earlyWaveCap) {
      if (isSwarmLike) {
        gained = Math.min(gained, EXP_CONFIG.earlyWaveKillExp.swarm);
      } else {
        gained = Math.max(EXP_CONFIG.earlyWaveKillExp.standard, gained);
      }
    }
    return gained;
  }
  function finalizeEnemyExpStat(exp, enemyType, difficultyIndex) {
    const value = Math.max(1, Math.floor(exp));
    if (difficultyIndex >= BALANCE.earlyWaveCap) return value;
    const isSwarmLike = enemyType === "swarm" || enemyType === "splitFragment";
    if (isSwarmLike) {
      return Math.max(1, Math.min(value, EXP_CONFIG.earlyWaveKillExp.swarm));
    }
    return Math.max(EXP_CONFIG.earlyWaveKillExp.standard, value);
  }

  // js/config/characters.js
  var baseSkills = () => createInitialPlayerSkills();
  var BASE_EXP = EXP_CONFIG.baseThreshold;
  var CHARACTERS = [
    {
      name: "Adventurer",
      role: "Balanced",
      modelClass: "adventurer",
      description: "Well-rounded starter \u2014 passive grants +50% EXP from kills.",
      stats: {
        hp: 957,
        maxHp: 957,
        physicalDamage: 35,
        attackSpeed: 2,
        attackRange: 150,
        critChance: 6,
        critMultiplier: 150,
        armour: 30,
        evade: 14,
        hpRegen: 2,
        level: 1,
        exp: 0,
        expGain: 1.2,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Warrior",
      role: "Tank",
      modelClass: "warrior",
      description: "Heavy armour and HP. Passive: 50% chance basic hits explode for 55% AoE damage.",
      stats: {
        hp: 1567,
        maxHp: 1567,
        physicalDamage: 30,
        attackSpeed: 1.25,
        attackRange: 85,
        critChance: 4,
        critMultiplier: 185,
        armour: 52,
        evade: 2,
        hpRegen: 6,
        level: 1,
        exp: 0,
        expGain: 1,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Ranger",
      role: "Ranged",
      modelClass: "ranger",
      description: "Extreme range and attack speed. Illusion companion deals 60% of your damage.",
      stats: {
        hp: 528,
        maxHp: 528,
        physicalDamage: 41,
        attackSpeed: 2.6,
        attackRange: 310,
        critChance: 16,
        critMultiplier: 130,
        armour: 8,
        evade: 28,
        hpRegen: 0,
        level: 1,
        exp: 0,
        expGain: 1,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Assassin",
      role: "Crit",
      modelClass: "assassin",
      description: "Lethal crits and evasion. Crits have 30% chance to splash 40% damage nearby.",
      stats: {
        hp: 462,
        maxHp: 462,
        physicalDamage: 48,
        attackSpeed: 2.2,
        attackRange: 105,
        critChance: 28,
        critMultiplier: 260,
        armour: 4,
        evade: 52,
        hpRegen: 0,
        level: 1,
        exp: 0,
        expGain: 1,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Healer",
      role: "Support",
      modelClass: "healer",
      description: "Massive HP regen. Passive pulses 35% of regen as holy AoE every 2.5s.",
      stats: {
        hp: 1237,
        maxHp: 1237,
        physicalDamage: 24,
        attackSpeed: 1.7,
        attackRange: 195,
        critChance: 4,
        critMultiplier: 140,
        armour: 24,
        evade: 8,
        hpRegen: 117,
        level: 1,
        exp: 0,
        expGain: 1,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Necromancer",
      role: "DoT",
      modelClass: "necromancer",
      description: "Chaos specialist. Raises a zombie every 12s that deals 100% of your damage.",
      stats: {
        hp: 561,
        maxHp: 561,
        physicalDamage: 28,
        attackSpeed: 1.9,
        attackRange: 175,
        critChance: 8,
        critMultiplier: 160,
        armour: 11,
        evade: 12,
        hpRegen: 1,
        level: 1,
        exp: 0,
        expGain: 1.15,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Paladin",
      role: "Holy Tank",
      modelClass: "paladin",
      description: "Sacred frontline. Shield absorbs damage equal to 10% max HP, repairs every 15s.",
      stats: {
        hp: 1452,
        maxHp: 1452,
        physicalDamage: 33,
        attackSpeed: 1.45,
        attackRange: 95,
        critChance: 6,
        critMultiplier: 175,
        armour: 46,
        evade: 6,
        hpRegen: 9,
        level: 1,
        exp: 0,
        expGain: 1,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Berserker",
      role: "Glass Cannon",
      modelClass: "berserker",
      description: "Raw power and speed. Passive grants +50% attack speed for 5s every 10s.",
      stats: {
        hp: 693,
        maxHp: 693,
        physicalDamage: 57,
        attackSpeed: 2.4,
        attackRange: 90,
        critChance: 12,
        critMultiplier: 220,
        armour: 0,
        evade: 8,
        hpRegen: 0,
        level: 1,
        exp: 0,
        expGain: 1,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Elementalist",
      role: "Mage",
      modelClass: "elementalist",
      description: "Arcane focus. Fire, cold, and lightning skills deal +50% more damage.",
      stats: {
        hp: 495,
        maxHp: 495,
        physicalDamage: 22,
        attackSpeed: 1.65,
        attackRange: 240,
        critChance: 10,
        critMultiplier: 155,
        armour: 6,
        evade: 18,
        hpRegen: 1,
        level: 1,
        exp: 0,
        expGain: 1.1,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Summoner",
      role: "Summoner",
      modelClass: "summoner",
      description: "Commands two bears \u2014 each deals 30% of your weapon damage.",
      stats: {
        hp: 594,
        maxHp: 594,
        physicalDamage: 26,
        attackSpeed: 1.85,
        attackRange: 205,
        critChance: 8,
        critMultiplier: 165,
        armour: 15,
        evade: 14,
        hpRegen: 1,
        level: 1,
        exp: 0,
        expGain: 1.05,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Capybara",
      role: "Zen Tank",
      modelClass: "capybara",
      description: "Unbothered tank. Every 4s deals 60% weapon damage, chills foes, and heals 3% max HP.",
      stats: {
        hp: 1518,
        maxHp: 1518,
        physicalDamage: 19,
        attackSpeed: 1.3,
        attackRange: 115,
        critChance: 3,
        critMultiplier: 130,
        armour: 44,
        evade: 5,
        hpRegen: 23,
        level: 1,
        exp: 0,
        expGain: 0.95,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    },
    {
      name: "Slayer",
      role: "Physical",
      modelClass: "slayer",
      description: "Weapon specialist. Physical hits and skills deal +50% more damage.",
      stats: {
        hp: 858,
        maxHp: 858,
        physicalDamage: 44,
        attackSpeed: 1.85,
        attackRange: 120,
        critChance: 10,
        critMultiplier: 175,
        armour: 24,
        evade: 12,
        hpRegen: 2,
        level: 1,
        exp: 0,
        expGain: 1,
        expThreshold: BASE_EXP,
        buffList: {},
        skills: baseSkills()
      }
    }
  ];

  // js/config/combatStyles.js
  var MELEE_MODEL_CLASSES = /* @__PURE__ */ new Set([
    "adventurer",
    "warrior",
    "assassin",
    "berserker",
    "paladin",
    "slayer",
    "capybara"
  ]);
  function usesMeleeBasicAttack(modelClass) {
    return MELEE_MODEL_CLASSES.has(modelClass);
  }

  // js/config/enemies.js
  var BASE_ENEMY_STATS = {
    hp: 14,
    maxHp: 14,
    physicalDamage: 7,
    attackSpeed: 1.4,
    attackRange: 50,
    armour: 0,
    hpRegen: 0.5,
    moveSpeed: 0.3,
    exp: 3
  };
  var ENEMY_TYPES = {
    grunt: {
      type: "grunt",
      cssClass: "enemy enemy-grunt",
      size: 40,
      hpMult: 1,
      damageMult: 1,
      expMult: 1,
      moveSpeedMult: 1,
      behavior: "chase",
      label: "Grunt"
    },
    swarm: {
      type: "swarm",
      cssClass: "enemy enemy-swarm",
      size: 28,
      hpMult: 0.45,
      damageMult: 0.6,
      expMult: 0.28,
      moveSpeedMult: 1.8,
      behavior: "chase",
      label: "Swarm"
    },
    tank: {
      type: "tank",
      cssClass: "enemy enemy-tank",
      size: 58,
      hpMult: 3.5,
      damageMult: 1.2,
      expMult: 2,
      moveSpeedMult: 0.45,
      behavior: "chase",
      label: "Tank",
      armourBonus: 8
    },
    archer: {
      type: "archer",
      cssClass: "enemy enemy-archer",
      size: 42,
      hpMult: 0.8,
      damageMult: 0.9,
      expMult: 1.5,
      moveSpeedMult: 0.7,
      behavior: "ranged",
      label: "Archer",
      rangedRange: 260
    },
    dasher: {
      type: "dasher",
      cssClass: "enemy enemy-dasher",
      size: 44,
      hpMult: 1.1,
      damageMult: 1.3,
      expMult: 1.8,
      moveSpeedMult: 1,
      behavior: "dash",
      label: "Dasher",
      dashCooldown: 3e3,
      dashSpeed: 2.5
    },
    splitter: {
      type: "splitter",
      cssClass: "enemy enemy-splitter",
      size: 48,
      hpMult: 1.5,
      damageMult: 0.8,
      expMult: 2,
      moveSpeedMult: 0.85,
      behavior: "chase",
      label: "Splitter",
      splitCount: 3
    },
    bomber: {
      type: "bomber",
      cssClass: "enemy enemy-bomber",
      size: 46,
      hpMult: 0.9,
      damageMult: 0.7,
      expMult: 1.6,
      moveSpeedMult: 1.1,
      behavior: "chase",
      label: "Bomber",
      explosionRadius: 150,
      explosionDamage: 28
    },
    penetrator: {
      type: "penetrator",
      cssClass: "enemy enemy-penetrator",
      size: 44,
      hpMult: 1.05,
      damageMult: 1.15,
      expMult: 1.4,
      moveSpeedMult: 0.95,
      behavior: "chase",
      label: "Penetrator",
      ignoreArmour: true
    },
    wraith: {
      type: "wraith",
      cssClass: "enemy enemy-wraith",
      size: 40,
      hpMult: 0.9,
      damageMult: 0.85,
      expMult: 1.5,
      moveSpeedMult: 1.25,
      behavior: "chase",
      label: "Wraith",
      evadeScaling: true
    },
    /** Spawned only when a splitter dies — not in pickEnemyType pool. */
    splitFragment: {
      type: "splitFragment",
      cssClass: "enemy enemy-split-fragment",
      size: 22,
      hpMult: 0.28,
      damageMult: 0.5,
      expMult: 0.3,
      moveSpeedMult: 2.4,
      behavior: "chase",
      label: "Fragment",
      spawnable: false
    }
  };
  var RARITY_CONFIG = {
    normal: { key: "normal", cssSuffix: "", hpMult: 1, damageMult: 1, expMult: 1, spawnWeight: 50 },
    rare: { key: "rare", cssSuffix: " rare-enemy", hpMult: 2, damageMult: 1.2, expMult: 2.5, spawnWeight: 15 },
    elite: { key: "elite", cssSuffix: " elite", hpMult: 5, damageMult: 1.35, expMult: 5, spawnWeight: 3 },
    boss: { key: "boss", cssSuffix: " boss", hpMult: 10, damageMult: 1.5, expMult: 12, spawnWeight: 1 }
  };
  function computeEnemyEvadeChance(difficulty) {
    const wave = Math.max(0, difficulty);
    const pct = 5 + wave * 0.45;
    return Math.min(50, Math.max(5, pct));
  }
  function buildEnemyStats(enemyType, rarity, difficulty) {
    const typeConfig = ENEMY_TYPES[enemyType] || ENEMY_TYPES.grunt;
    const rarityConfig = RARITY_CONFIG[rarity] || RARITY_CONFIG.normal;
    const base = { ...BASE_ENEMY_STATS };
    const hp = scaleEnemyHp(base.hp, difficulty) * typeConfig.hpMult * rarityConfig.hpMult;
    const damage = scaleEnemyDamage(base.physicalDamage, difficulty) * typeConfig.damageMult * rarityConfig.damageMult;
    const exp = scaleEnemyExp(base.exp, difficulty) * typeConfig.expMult * rarityConfig.expMult;
    const stats = {
      ...base,
      hp: applyEarlyWaveHpReduction(applyBalanceScale(Math.floor(hp), "hp"), difficulty),
      maxHp: applyEarlyWaveHpReduction(applyBalanceScale(Math.floor(hp), "hp"), difficulty),
      physicalDamage: applyBalanceScale(Math.floor(damage), "damage"),
      exp: finalizeEnemyExpStat(
        applyEarlyWaveExpBonus(applyBalanceScale(Math.floor(exp), "exp"), difficulty),
        typeConfig.type,
        difficulty
      ),
      moveSpeed: applyEnemyMovePressure(base.moveSpeed * typeConfig.moveSpeedMult, difficulty),
      armour: (typeConfig.armourBonus || 0) + (rarity === "elite" ? 4 : rarity === "boss" ? 8 : 0),
      ignoreArmour: Boolean(typeConfig.ignoreArmour),
      evadeChance: typeConfig.evadeScaling ? computeEnemyEvadeChance(difficulty) : 0
    };
    stats.maxHp = stats.hp;
    if (typeConfig.behavior === "ranged") {
      stats.attackRange = typeConfig.rangedRange || 180;
    }
    applyEnemyStartingCombatBoost(stats);
    return { stats, typeConfig, rarityConfig };
  }
  function scaleEnemyHp(base, difficulty) {
    const d = Math.min(difficulty, 80);
    return base + base * (1 + 0.1 * d) * Math.log(1 + d + d * Math.pow(1.4, d * 0.75));
  }
  function scaleEnemyDamage(base, difficulty) {
    const d = Math.min(difficulty, 300);
    return base * (1 + d * 0.035);
  }
  function scaleEnemyExp(base, difficulty) {
    const d = Math.min(difficulty, 200);
    const early = base * (1 + d * 0.1);
    if (d <= 50) return early;
    const midCap = base * (1 + 50 * 0.1);
    const lateExtra = base * (d - 50) * 0.035;
    return midCap + lateExtra;
  }
  var SWARM_UNLOCK_DIFFICULTY = 6;
  function pickEnemyType(difficulty) {
    const pool = ["grunt", "grunt", "grunt", "grunt"];
    if (difficulty >= SWARM_UNLOCK_DIFFICULTY && difficulty < 10) {
      pool.push("swarm");
    } else if (difficulty >= 10 && difficulty < 16) {
      pool.push("swarm", "swarm");
    } else if (difficulty >= 16) {
      pool.push("swarm", "swarm", "swarm");
    }
    if (difficulty >= 5) {
      pool.push("tank", "archer");
    }
    if (difficulty >= 10) pool.push("dasher", "splitter");
    if (difficulty >= 12) pool.push("wraith", "wraith");
    if (difficulty >= 15) pool.push("penetrator");
    if (difficulty >= 18) pool.push("bomber");
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // js/config/enemyColors.js
  var ENEMY_TYPE_COLORS = {
    grunt: "#dc2626",
    swarm: "#f97316",
    tank: "#64748b",
    archer: "#16a34a",
    dasher: "#7c3aed",
    splitter: "#ca8a04",
    bomber: "#450a0a",
    penetrator: "#0891b2",
    wraith: "#94a3b8",
    splitFragment: "#fb923c"
  };
  function getEnemyTypeColor(type) {
    return ENEMY_TYPE_COLORS[type] || "#94a3b8";
  }

  // js/utils/clone.js
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // js/config/abilityCombatScaling.js
  var ABILITY_COMBAT_SCALING = {
    reflect: { percentPerLevel: 10, maxPercent: 50, maxLevel: 5, damageBasis: "playerPhysicalDamage" },
    lifesteal: { percentPerLevel: 5, maxPercent: 25, maxLevel: 5 },
    damageReduction: { percentPerLevel: 10, maxPercent: 50, maxLevel: 5 },
    attackSpeedBuff: { percentPerLevel: 20, maxPercent: 100, maxLevel: 5 }
  };
  function getAbilityPercent(kind, level) {
    const cfg = ABILITY_COMBAT_SCALING[kind];
    if (!cfg || level <= 0) return 0;
    const cappedLevel = Math.min(level, cfg.maxLevel);
    return Math.min(cfg.maxPercent, cappedLevel * cfg.percentPerLevel);
  }
  function buildAbilityProgression(kind) {
    const cfg = ABILITY_COMBAT_SCALING[kind];
    if (!cfg) return [];
    const steps = [];
    for (let i = 1; i <= cfg.maxLevel; i++) {
      steps.push(String(getAbilityPercent(kind, i)));
    }
    return steps;
  }

  // js/config/progression.js
  function createDefaultStatsList() {
    return {
      "Upgrade Damage": { level: 0, maxLevel: 1e3 },
      "Upgrade AoE": { level: 0, maxLevel: 25 },
      "Upgrade Attack Speed": { level: 0, maxLevel: 50 },
      "Upgrade HP (Recover 20% Life)": { level: 0, maxLevel: 1e3 },
      "Upgrade HP Regen": { level: 0, maxLevel: 1e3 },
      "Upgrade Armour": { level: 0, maxLevel: 1e3 },
      "Upgrade Crit Chance": { level: 0, maxLevel: 40 },
      "Upgrade Crit Multiplier": { level: 0, maxLevel: 100 }
    };
  }
  function createDefaultAbilityList() {
    return {
      Reflect: {
        text: "Return ??%(50%) of your damage to attackers. Reduced by enemy armour.",
        progression: buildAbilityProgression("reflect"),
        level: 0,
        maxLevel: 5
      },
      Bounce: {
        text: "Deal ??%(0%) less damage. Projectiles bounce ??(5) extra times",
        progression: ["40", "30", "20", "10", "0", "1", "2", "3", "4", "5"],
        level: 0,
        maxLevel: 5
      },
      "Attack Speed Buff": {
        text: "Grant ??%(100%) attack speed for 5s, cooldown 10s",
        progression: buildAbilityProgression("attackSpeedBuff"),
        level: 0,
        maxLevel: 5
      },
      "Damage Reduction": {
        text: "Grant ??%(50%) damage reduction",
        progression: buildAbilityProgression("damageReduction"),
        level: 0,
        maxLevel: 5
      },
      Lifesteal: {
        text: "Grant ??%(25%) lifesteal",
        progression: buildAbilityProgression("lifesteal"),
        level: 0,
        maxLevel: 5
      },
      "HP To Damage": {
        text: "Deal ??%(30%) of max HP as bonus damage",
        progression: ["6", "12", "18", "24", "30"],
        level: 0,
        maxLevel: 5
      },
      "Regen To Damage": {
        text: "Deal ??%(250%) of Regen as damage. ??%(100%) faster regen",
        progression: ["50", "100", "150", "200", "250", "20", "40", "60", "80", "100"],
        level: 0,
        maxLevel: 5
      }
    };
  }
  function createAbilityLevelThresholds(count = 30) {
    const thresholds = [];
    for (let i = 0; i < count; i++) {
      thresholds.push(9 + 10 * i);
    }
    return thresholds;
  }

  // js/game/gameState.js
  var GameState = class {
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
      this.pendingTimeouts = /* @__PURE__ */ new Set();
      this.animationIds = /* @__PURE__ */ new Set();
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
      this.selectedCharacterName = "";
      this.selectedModelClass = "";
      this.healthRegenTime = 0;
      this.healthRegenInterval = 1e3;
      this.normalSpawnTime = 0;
      this.normalSpawnInterval = 1e3 * 60 / 50;
      this.rareEnemySpawnTime = 0;
      this.rareEnemySpawnInterval = 1e3 * 60 / 15;
      this.eliteSpawnTime = 0;
      this.eliteSpawnInterval = 1e3 * 60 / 3;
      this.bossSpawnTime = 0;
      this.bossSpawnInterval = 1e3 * 60 / 1;
      this.difficultyIntervalTime = 1e4;
      this.attackSpeedBuffTime = 0;
      this.attackSpeedBuffInterval = 1e4;
      this.attackSpeedBuffDuration = 5e3;
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
      this.pendingTimeouts.forEach((id) => clearTimeout(id));
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
      this.animationIds.forEach((id) => cancelAnimationFrame(id));
      this.animationIds.clear();
      if (this.gameLoopId) {
        cancelAnimationFrame(this.gameLoopId);
        this.gameLoopId = null;
      }
    }
    destroyEntities() {
      this.enemies.forEach((enemy) => {
        this.cancelAnimation(enemy.moveAnimationId);
        enemy.element?.remove();
      });
      this.bullets.forEach((bullet) => {
        this.cancelAnimation(bullet.moveAnimationId);
        bullet.element?.remove();
      });
      this.effects.forEach((effect) => effect.element?.remove());
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
  };

  // js/utils/math.js
  function distanceVw(x1, y1, x2, y2, innerWidth, innerHeight) {
    const dx = Math.abs(x1 - x2) * innerWidth / 100;
    const dy = Math.abs(y1 - y2) * innerHeight / 100;
    return Math.hypot(dx, dy);
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function distancePointToSegmentPx(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }
  function rollChance(chancePercent) {
    return Math.random() < chancePercent / 100;
  }
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  // js/config/characterPassives.js
  function pctFromRatio(ratio) {
    return Math.round((ratio || 0) * 100);
  }
  function secLabel(ms) {
    const s = (ms || 0) / 1e3;
    return Number.isInteger(s) ? String(s) : s.toFixed(1);
  }
  function resolvePassiveDescription(passive) {
    if (!passive) return "";
    const p = passive.params || {};
    switch (passive.id) {
      case "adventurer":
        return `Earn +${pctFromRatio(p.expBonus)}% bonus EXP from enemy kills.`;
      case "warrior":
        return `Basic attacks have ${p.chance}% chance to explode, dealing ${pctFromRatio(p.splashMult)}% of hit damage in a ${p.radiusPx}px area.`;
      case "ranger":
        return `A roaming illusion follows you and strikes for ${p.damagePercent}% of your weapon damage.`;
      case "assassin":
        return `Critical hits have ${p.chance}% chance to splash ${pctFromRatio(p.splashMult)}% of crit damage to nearby foes (${p.radiusPx}px).`;
      case "healer":
        return `Every ${secLabel(p.intervalMs)}s, pulse holy damage equal to ${pctFromRatio(p.regenDamageMult)}% of your HP Regen (${p.radiusPx}px AoE).`;
      case "necromancer":
        return `Every ${secLabel(p.cooldownMs)}s, raise a zombie for ${secLabel(p.durationMs)}s that deals ${p.damagePercent}% of your weapon damage.`;
      case "paladin":
        return `Gain a shield equal to ${p.shieldPercent}% max HP that absorbs damage first; fully repairs every ${secLabel(p.repairIntervalMs)}s.`;
      case "berserker":
        return `Every ${secLabel(p.cooldownMs)}s, gain +${p.bonusPercent}% attack speed for ${secLabel(p.durationMs)}s.`;
      case "elementalist":
        return `Fire, cold, and lightning skills deal +${pctFromRatio(p.elementBonus)}% more damage.`;
      case "summoner":
        return `${p.count} spirit bears orbit you \u2014 each deals ${p.damagePercent}% of your weapon damage.`;
      case "capybara":
        return `Every ${secLabel(p.intervalMs)}s: deal ${pctFromRatio(p.damageMult)}% weapon damage, chill ${p.chillPercent}% for ${secLabel(p.chillDurationMs)}s, and heal ${p.healPercent}% max HP.`;
      case "slayer":
        return `Physical basic attacks and skills deal +${pctFromRatio(p.physicalBonus)}% more damage.`;
      default:
        return passive.description || "";
    }
  }
  var CHARACTER_PASSIVE_DEFS = {
    Adventurer: {
      id: "adventurer",
      name: "Explorer's Quill",
      icon: "\u{1F4DC}",
      params: { expBonus: 0.5 }
    },
    Warrior: {
      id: "warrior",
      name: "War Cry Strike",
      icon: "\u{1F4A5}",
      params: { chance: 50, radiusPx: 90, splashMult: 0.55 }
    },
    Ranger: {
      id: "ranger",
      name: "Evershadow Companion",
      icon: "\u{1F3F9}",
      params: { damagePercent: 60, roamRadiusFraction: 0.85 }
    },
    Assassin: {
      id: "assassin",
      name: "Crit Echo",
      icon: "\u{1F5E1}\uFE0F",
      params: { chance: 30, radiusPx: 70, splashMult: 0.4 }
    },
    Healer: {
      id: "healer",
      name: "Sacred Pulse",
      icon: "\u{1F49A}",
      params: { intervalMs: 2500, radiusPx: 140, regenDamageMult: 0.35 }
    },
    Necromancer: {
      id: "necromancer",
      name: "Raise Zombie",
      icon: "\u{1F9DF}",
      params: {
        cooldownMs: 12e3,
        durationMs: 14e3,
        damagePercent: 100,
        moveSpeed: 0.55,
        attackIntervalMs: 900,
        offsetVw: 3.5
      }
    },
    Paladin: {
      id: "paladin",
      name: "Aegis of Faith",
      icon: "\u{1F6E1}\uFE0F",
      params: { shieldPercent: 10, repairIntervalMs: 15e3 }
    },
    Berserker: {
      id: "berserker",
      name: "Blood Frenzy",
      icon: "\u{1FA78}",
      params: {
        bonusPercent: 50,
        durationMs: 5e3,
        cooldownMs: 1e4
      }
    },
    Elementalist: {
      id: "elementalist",
      name: "Elemental Attunement",
      icon: "\u2728",
      params: { elementBonus: 0.5 }
    },
    Summoner: {
      id: "summoner",
      name: "Twin Bears",
      icon: "\u{1F43B}",
      params: {
        count: 2,
        damagePercent: 30,
        moveSpeed: 0.48,
        attackIntervalMs: 1100,
        orbitVw: 4.2
      }
    },
    Capybara: {
      id: "capybara",
      name: "Snack & Soak",
      icon: "\u{1F34A}",
      params: {
        intervalMs: 4e3,
        radiusPx: 120,
        damageMult: 0.6,
        healPercent: 3,
        chillPercent: 25,
        chillDurationMs: 1800
      }
    },
    Slayer: {
      id: "slayer",
      name: "Weapon Mastery",
      icon: "\u2694\uFE0F",
      params: { physicalBonus: 0.5 }
    }
  };
  var CHARACTER_PASSIVES = Object.fromEntries(
    Object.entries(CHARACTER_PASSIVE_DEFS).map(([name, def]) => {
      const passive = { ...def, description: "" };
      passive.description = resolvePassiveDescription(
        /** @type {CharacterPassiveDef} */
        passive
      );
      return [name, passive];
    })
  );
  var ELEMENTALIST_ELEMENTS = /* @__PURE__ */ new Set(["fire", "cold", "lightning"]);
  function getCharacterPassive(characterName) {
    return CHARACTER_PASSIVES[characterName] || null;
  }
  function formatPassiveTooltipHtml(passive) {
    if (!passive) return "";
    const description = resolvePassiveDescription(passive);
    return `
        <strong class="passive-tip-name">${passive.name}</strong>
        <span class="passive-tip-tag">Character Passive</span>
        <p class="passive-tip-desc">${description}</p>
    `;
  }

  // js/utils/viewport.js
  var MOBILE_BREAKPOINT_PX = 768;
  function isMobileViewport(width) {
    const w = typeof width === "number" ? width : typeof window !== "undefined" ? window.innerWidth : MOBILE_BREAKPOINT_PX + 1;
    return w <= MOBILE_BREAKPOINT_PX;
  }
  function panelsStartCollapsed(width) {
    return isMobileViewport(width);
  }

  // js/ui/characterSelectTooltipContent.js
  function escapeTooltipHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function buildCharacterDescTooltipHtml(description) {
    const text = (description || "").trim();
    if (!text) return "";
    return `<div class="floating-tooltip-inner floating-tooltip-inner--desc"><p class="floating-tooltip-desc">${escapeTooltipHtml(text)}</p></div>`;
  }
  function buildCharacterPassiveTooltipHtml(passive) {
    if (!passive) return "";
    return `<div class="floating-tooltip-inner floating-tooltip-inner--passive">${formatPassiveTooltipHtml(passive)}</div>`;
  }
  function isPassiveHoverTarget(target) {
    if (!target || typeof /** @type {Element} */
    target.closest !== "function") return false;
    return Boolean(
      /** @type {Element} */
      target.closest(".character-passive-reveal")
    );
  }
  function resolveCharacterCardTooltipMode({ overPassive, hasDesc, hasPassive }) {
    if (overPassive && hasPassive) return "passive";
    if (hasDesc) return "desc";
    return "none";
  }

  // js/utils/floatingTooltip.js
  function positionFloatingTooltip(el, clientX, clientY, opts = {}) {
    const margin = opts.margin ?? 14;
    const pad = opts.pad ?? 8;
    el.hidden = false;
    el.style.visibility = "hidden";
    el.style.left = "0px";
    el.style.top = "0px";
    const tipRect = el.getBoundingClientRect();
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    let left = clientX + margin;
    let top = clientY + margin;
    if (left + tipRect.width > vw - pad) {
      left = clientX - tipRect.width - margin;
    }
    if (left < pad) left = pad;
    if (top + tipRect.height > vh - pad) {
      top = clientY - tipRect.height - margin;
    }
    if (top < pad) top = pad;
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
    el.style.visibility = "visible";
  }

  // js/ui/floatingTooltipHost.js
  var FloatingTooltipHost = class {
    /**
     * @param {string} [className]
     * @param {HTMLElement} [parent]
     */
    constructor(className = "floating-tooltip", parent = document.body) {
      this.el = document.createElement("div");
      this.el.className = className;
      this.el.setAttribute("role", "tooltip");
      this.el.hidden = true;
      parent.appendChild(this.el);
      this._onMove = this._onMove.bind(this);
      this._trackingMove = false;
    }
    /**
     * @param {string} html
     * @param {number} clientX
     * @param {number} clientY
     */
    show(html, clientX, clientY) {
      this.el.innerHTML = html;
      this.el.hidden = false;
      this.reposition(clientX, clientY);
      this._bindDocumentMove();
    }
    /**
     * @param {number} clientX
     * @param {number} clientY
     */
    reposition(clientX, clientY) {
      if (this.el.hidden) return;
      positionFloatingTooltip(this.el, clientX, clientY);
    }
    hide() {
      this.el.hidden = true;
      this.el.innerHTML = "";
      this._unbindDocumentMove();
    }
    destroy() {
      this.hide();
      this.el.remove();
    }
    /** @private */
    _bindDocumentMove() {
      if (this._trackingMove) return;
      document.addEventListener("mousemove", this._onMove);
      this._trackingMove = true;
    }
    /** @private */
    _unbindDocumentMove() {
      if (!this._trackingMove) return;
      document.removeEventListener("mousemove", this._onMove);
      this._trackingMove = false;
    }
    /** @private */
    _onMove(event) {
      if (this.el.hidden) return;
      positionFloatingTooltip(this.el, event.clientX, event.clientY);
    }
  };

  // js/ui/characterSelectTooltips.js
  var CharacterSelectTooltips = class {
    constructor() {
      this.descTip = new FloatingTooltipHost("floating-tooltip floating-tooltip--desc");
      this.passiveTip = new FloatingTooltipHost("floating-tooltip floating-tooltip--passive");
      this._abort = null;
    }
    /** @param {HTMLElement|null} listEl */
    bind(listEl) {
      this.unbind();
      if (!listEl || isMobileViewport()) return;
      this._abort = new AbortController();
      const { signal } = this._abort;
      listEl.querySelectorAll(".character-card").forEach((card) => {
        const descHtml = buildCharacterDescTooltipHtml(
          card.querySelector(".character-desc")?.textContent || ""
        );
        const passiveHtml = buildCharacterPassiveTooltipHtml(
          getCharacterPassive(card.dataset.character || "")
        );
        const hasDesc = Boolean(descHtml);
        const hasPassive = Boolean(passiveHtml);
        if (!hasDesc && !hasPassive) return;
        const syncTooltip = (event) => {
          const mode = resolveCharacterCardTooltipMode({
            overPassive: isPassiveHoverTarget(event.target),
            hasDesc,
            hasPassive
          });
          this._showMode(mode, descHtml, passiveHtml, event.clientX, event.clientY);
        };
        card.addEventListener("mouseenter", syncTooltip, { signal });
        card.addEventListener("mousemove", syncTooltip, { signal });
        card.addEventListener("mouseleave", () => this._hideAll(), { signal });
      });
    }
    /**
     * @param {'desc'|'passive'|'none'} mode
     * @param {string} descHtml
     * @param {string} passiveHtml
     * @param {number} clientX
     * @param {number} clientY
     * @private
     */
    _showMode(mode, descHtml, passiveHtml, clientX, clientY) {
      if (mode === "passive") {
        this.descTip.hide();
        this.passiveTip.show(passiveHtml, clientX, clientY);
        return;
      }
      if (mode === "desc") {
        this.passiveTip.hide();
        this.descTip.show(descHtml, clientX, clientY);
        return;
      }
      this._hideAll();
    }
    /** @private */
    _hideAll() {
      this.descTip.hide();
      this.passiveTip.hide();
    }
    unbind() {
      this._abort?.abort();
      this._abort = null;
      this._hideAll();
    }
    destroy() {
      this.unbind();
      this.descTip.destroy();
      this.passiveTip.destroy();
    }
  };

  // js/ui/svgSprites.js
  var SVG_WRAP = (content, viewBox = "0 0 64 64") => `<svg class="entity-svg" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content}</svg>`;
  var PLAYER_SVGS = {
    adventurer: SVG_WRAP(`
        <defs><linearGradient id="adv-body" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs>
        <ellipse cx="32" cy="38" rx="18" ry="20" fill="url(#adv-body)" stroke="#60a5fa" stroke-width="2"/>
        <circle cx="32" cy="18" r="12" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>
        <rect x="14" y="28" width="8" height="22" rx="2" fill="#64748b" stroke="#94a3b8"/>
        <path d="M46 26 L58 18 L56 32 L48 36 Z" fill="#cbd5e1" stroke="#64748b"/>
        <line x1="50" y1="20" x2="54" y2="42" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
    `),
    warrior: SVG_WRAP(`
        <defs><linearGradient id="war-armor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#94a3b8"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs>
        <rect x="16" y="22" width="32" height="34" rx="8" fill="url(#war-armor)" stroke="#64748b" stroke-width="2"/>
        <circle cx="32" cy="16" r="13" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
        <rect x="22" y="8" width="20" height="6" rx="2" fill="#64748b"/>
        <rect x="10" y="30" width="10" height="24" rx="3" fill="#475569" stroke="#64748b"/>
        <rect x="44" y="30" width="10" height="24" rx="3" fill="#475569" stroke="#64748b"/>
        <path d="M8 36 L4 52 L12 50 Z" fill="#334155"/>
    `),
    ranger: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="16" ry="18" fill="#16a34a" stroke="#4ade80" stroke-width="2"/>
        <circle cx="32" cy="17" r="11" fill="#fde68a"/>
        <path d="M18 8 L46 8 L32 22 Z" fill="#14532d"/>
        <path d="M48 30 Q58 20 58 40 Q58 55 48 48" fill="none" stroke="#92400e" stroke-width="3"/>
        <line x1="48" y1="30" x2="48" y2="50" stroke="#78350f" stroke-width="2"/>
    `),
    assassin: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="15" ry="17" fill="#1f2937" stroke="#6b7280" stroke-width="2"/>
        <circle cx="32" cy="18" r="10" fill="#374151"/>
        <path d="M20 6 L44 6 L32 20 Z" fill="#0f172a"/>
        <path d="M10 44 L20 36 M54 44 L44 36" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="32" cy="18" r="4" fill="#8b5cf6" opacity="0.8"/>
    `),
    healer: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="17" ry="19" fill="#d97706" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="32" cy="17" r="11" fill="#fde68a"/>
        <rect x="28" y="4" width="8" height="8" rx="2" fill="#fef08a"/>
        <line x1="46" y1="10" x2="46" y2="58" stroke="#78350f" stroke-width="3"/>
        <line x1="40" y1="14" x2="52" y2="14" stroke="#fef08a" stroke-width="4"/>
        <line x1="43" y1="11" x2="49" y2="17" stroke="#fef08a" stroke-width="3"/>
        <line x1="49" y1="11" x2="43" y2="17" stroke="#fef08a" stroke-width="3"/>
    `),
    necromancer: SVG_WRAP(`
        <ellipse cx="32" cy="42" rx="16" ry="18" fill="#4c1d95" stroke="#a78bfa" stroke-width="2"/>
        <circle cx="32" cy="18" r="11" fill="#1e1b4b"/>
        <ellipse cx="26" cy="17" rx="3" ry="4" fill="#22d3ee"/><ellipse cx="38" cy="17" rx="3" ry="4" fill="#22d3ee"/>
        <path d="M20 6 L44 6 L38 18 L26 18 Z" fill="#2e1065"/>
        <path d="M8 50 Q16 38 24 50" fill="none" stroke="#84cc16" stroke-width="2" opacity="0.8"/>
        <circle cx="12" cy="48" r="3" fill="#84cc16" opacity="0.6"/>
    `),
    paladin: SVG_WRAP(`
        <rect x="18" y="24" width="28" height="32" rx="6" fill="#e2e8f0" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="32" cy="16" r="12" fill="#fde68a" stroke="#d97706"/>
        <rect x="8" y="28" width="12" height="28" rx="3" fill="#fbbf24" stroke="#d97706"/>
        <path d="M12 32 L12 52 M8 36 L16 36" stroke="#92400e" stroke-width="2"/>
        <circle cx="32" cy="38" r="8" fill="#fbbf24" opacity="0.5"/>
    `),
    berserker: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="20" ry="22" fill="#b91c1c" stroke="#fca5a5" stroke-width="2"/>
        <circle cx="32" cy="16" r="13" fill="#fde68a"/>
        <path d="M18 10 L28 4 L32 14 L36 4 L46 10" fill="#7f1d1d"/>
        <path d="M6 38 L18 32 M58 38 L46 32" stroke="#fbbf24" stroke-width="4" stroke-linecap="round"/>
        <rect x="48" y="20" width="6" height="36" rx="2" fill="#78716c" transform="rotate(15 51 38)"/>
    `),
    elementalist: SVG_WRAP(`
        <ellipse cx="32" cy="42" rx="15" ry="17" fill="#312e81" stroke="#818cf8" stroke-width="2"/>
        <circle cx="32" cy="18" r="11" fill="#c4b5fd"/>
        <path d="M32 2 L36 14 L48 14 L38 22 L42 34 L32 26 L22 34 L26 22 L16 14 L28 14 Z" fill="#fbbf24" opacity="0.9"/>
        <circle cx="20" cy="50" r="5" fill="#f97316" opacity="0.7"/>
        <circle cx="44" cy="48" r="4" fill="#38bdf8" opacity="0.7"/>
        <circle cx="32" cy="54" r="4" fill="#a3e635" opacity="0.7"/>
    `),
    summoner: SVG_WRAP(`
        <ellipse cx="32" cy="42" rx="14" ry="16" fill="#581c87" stroke="#c084fc" stroke-width="2"/>
        <circle cx="32" cy="18" r="10" fill="#ede9fe"/>
        <path d="M22 8 L42 8 L32 20 Z" fill="#3b0764"/>
        <circle cx="48" cy="28" r="8" fill="#22d3ee" opacity="0.85"/>
        <circle cx="48" cy="28" r="4" fill="#ffffff" opacity="0.6"/>
        <path d="M38 30 Q44 28 48 28" stroke="#67e8f9" stroke-width="1.5" fill="none"/>
        <circle cx="16" cy="48" r="5" fill="#a78bfa" opacity="0.7"/>
    `),
    capybara: SVG_WRAP(`
        <ellipse cx="32" cy="40" rx="22" ry="16" fill="#92400e" stroke="#d97706" stroke-width="2"/>
        <ellipse cx="32" cy="32" rx="18" ry="14" fill="#b45309"/>
        <circle cx="32" cy="22" r="13" fill="#d97706" stroke="#92400e"/>
        <circle cx="26" cy="20" rx="2.5" ry="3" fill="#1f2937"/>
        <circle cx="38" cy="20" rx="2.5" ry="3" fill="#1f2937"/>
        <ellipse cx="32" cy="26" rx="4" ry="2.5" fill="#78350f"/>
        <ellipse cx="14" cy="38" rx="5" ry="3" fill="#92400e"/>
        <ellipse cx="50" cy="38" rx="5" ry="3" fill="#92400e"/>
    `),
    slayer: SVG_WRAP(`
        <defs><linearGradient id="slayer-armor" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#64748b"/></linearGradient></defs>
        <ellipse cx="32" cy="40" rx="16" ry="18" fill="url(#slayer-armor)" stroke="#94a3b8" stroke-width="2"/>
        <circle cx="32" cy="17" r="11" fill="#f1f5f9" stroke="#64748b" stroke-width="1.5"/>
        <path d="M22 8 L42 8 L32 16 Z" fill="#334155"/>
        <path d="M48 22 L60 14 L58 34 L50 36 Z" fill="#cbd5e1" stroke="#64748b"/>
        <line x1="52" y1="16" x2="54" y2="48" stroke="#e2e8f0" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M10 36 L18 30 L16 44 Z" fill="#94a3b8" stroke="#475569"/>
    `)
  };
  var ENEMY_SVGS = {
    grunt: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="18" ry="6" fill="#000" opacity="0.3"/>
        <ellipse cx="32" cy="38" rx="18" ry="20" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
        <ellipse cx="32" cy="18" rx="11" ry="12" fill="#ef4444"/>
        <path d="M20 8 L24 16 M44 8 L40 16" stroke="#991b1b" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="26" cy="17" rx="3" ry="4" fill="#fef08a"/><ellipse cx="38" cy="17" rx="3" ry="4" fill="#fef08a"/>
    `),
    swarm: SVG_WRAP(`
        <ellipse cx="32" cy="50" rx="12" ry="4" fill="#000" opacity="0.25"/>
        <ellipse cx="32" cy="36" rx="14" ry="10" fill="#ea580c" stroke="#c2410c"/>
        <ellipse cx="24" cy="34" rx="8" ry="6" fill="#fb923c" opacity="0.75"/>
        <ellipse cx="40" cy="34" rx="8" ry="6" fill="#fb923c" opacity="0.75"/>
        <circle cx="26" cy="35" r="2.5" fill="#fef08a"/><circle cx="38" cy="35" r="2.5" fill="#fef08a"/>
    `),
    tank: SVG_WRAP(`
        <ellipse cx="32" cy="54" rx="22" ry="7" fill="#000" opacity="0.32"/>
        <rect x="12" y="22" width="40" height="32" rx="10" fill="#475569" stroke="#64748b" stroke-width="2"/>
        <rect x="18" y="28" width="28" height="18" rx="4" fill="#334155"/>
        <ellipse cx="32" cy="16" rx="10" ry="11" fill="#64748b"/>
        <rect x="6" y="30" width="8" height="20" rx="2" fill="#334155"/>
        <rect x="50" y="30" width="8" height="20" rx="2" fill="#334155"/>
    `),
    archer: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="16" ry="5" fill="#000" opacity="0.28"/>
        <ellipse cx="32" cy="38" rx="15" ry="17" fill="#16a34a" stroke="#15803d"/>
        <ellipse cx="32" cy="17" rx="9" ry="10" fill="#fde68a"/>
        <path d="M20 6 L44 6 L32 18 Z" fill="#14532d"/>
        <path d="M46 28 Q58 24 56 42" fill="none" stroke="#92400e" stroke-width="2.5"/>
        <line x1="46" y1="28" x2="46" y2="46" stroke="#78350f" stroke-width="2"/>
    `),
    dasher: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="17" ry="6" fill="#000" opacity="0.28"/>
        <ellipse cx="32" cy="38" rx="16" ry="18" fill="#7c3aed" stroke="#a78bfa"/>
        <ellipse cx="32" cy="17" rx="10" ry="11" fill="#c4b5fd"/>
        <path d="M32 36 L38 48 L32 44 L26 48 Z" fill="#5b21b6"/>
    `),
    splitter: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="19" ry="6" fill="#000" opacity="0.28"/>
        <path d="M32 10 L48 26 L44 48 L20 48 L16 26 Z" fill="#ca8a04" stroke="#fde68a" stroke-width="2"/>
        <path d="M32 18 L38 30 L32 42 L26 30 Z" fill="#fef08a" opacity="0.55"/>
        <line x1="32" y1="10" x2="32" y2="48" stroke="#a16207" stroke-width="1.5"/>
        <line x1="16" y1="26" x2="48" y2="26" stroke="#a16207" stroke-width="1.5"/>
    `),
    bomber: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="20" ry="7" fill="#000" opacity="0.28"/>
        <ellipse cx="32" cy="36" rx="20" ry="22" fill="#b91c1c" stroke="#ef4444" stroke-width="2"/>
        <ellipse cx="32" cy="32" rx="14" ry="16" fill="#dc2626"/>
        <path d="M22 16 L28 8 M42 16 L36 8 M32 10 L32 2" stroke="#fca5a5" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="32" r="9" fill="#fef08a" opacity="0.95"/>
        <text x="32" y="36" text-anchor="middle" font-size="11" font-weight="bold" fill="#7f1d1d">!</text>
    `),
    penetrator: SVG_WRAP(`
        <ellipse cx="32" cy="52" rx="18" ry="6" fill="#000" opacity="0.28"/>
        <path d="M20 44 L32 14 L44 44 Z" fill="#0891b2" stroke="#22d3ee" stroke-width="2"/>
        <path d="M26 38 L32 22 L38 38 Z" fill="#67e8f4" opacity="0.55"/>
        <rect x="30" y="10" width="4" height="10" rx="1" fill="#0e7490"/>
        <line x1="32" y1="20" x2="32" y2="44" stroke="#155e75" stroke-width="2"/>
    `),
    splitFragment: SVG_WRAP(`
        <ellipse cx="32" cy="50" rx="11" ry="4" fill="#000" opacity="0.22"/>
        <rect x="20" y="28" width="24" height="18" rx="4" fill="#fb923c" stroke="#f97316" stroke-width="2"/>
        <rect x="24" y="32" width="16" height="10" rx="2" fill="#fdba74" opacity="0.7"/>
    `),
    wraith: SVG_WRAP(`
        <defs><linearGradient id="wraith-grad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#64748b"/></linearGradient></defs>
        <ellipse cx="32" cy="52" rx="16" ry="5" fill="#000" opacity="0.22"/>
        <path d="M18 46 Q32 8 46 46 Q40 52 32 50 Q24 52 18 46 Z" fill="url(#wraith-grad)" opacity="0.92"/>
        <ellipse cx="26" cy="28" rx="4" ry="5" fill="#0f172a" opacity="0.7"/>
        <ellipse cx="38" cy="28" rx="4" ry="5" fill="#0f172a" opacity="0.7"/>
        <path d="M28 38 Q32 42 36 38" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
    `),
    treasureChest: SVG_WRAP(`
        <defs>
            <linearGradient id="chest-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fde68a"/>
                <stop offset="55%" stop-color="#f59e0b"/>
                <stop offset="100%" stop-color="#b45309"/>
            </linearGradient>
            <linearGradient id="chest-lid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fef3c7"/>
                <stop offset="100%" stop-color="#d97706"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="54" rx="22" ry="6" fill="#000" opacity="0.35"/>
        <rect x="12" y="30" width="40" height="22" rx="4" fill="url(#chest-gold)" stroke="#92400e" stroke-width="2"/>
        <path d="M12 34 L52 34" stroke="#78350f" stroke-width="2"/>
        <rect x="10" y="18" width="44" height="18" rx="6" fill="url(#chest-lid)" stroke="#92400e" stroke-width="2"/>
        <rect x="28" y="26" width="8" height="14" rx="2" fill="#451a03"/>
        <circle cx="32" cy="33" r="3.5" fill="#fde68a" stroke="#b45309" stroke-width="1.5"/>
        <path d="M16 22 Q32 12 48 22" fill="none" stroke="#fef08a" stroke-width="2" opacity="0.85"/>
        <circle cx="20" cy="24" r="2" fill="#fef9c3" opacity="0.9"/>
        <circle cx="44" cy="24" r="2" fill="#fef9c3" opacity="0.9"/>
    `)
  };
  var COMPANION_SVGS = {
    zombie: SVG_WRAP(`
        <ellipse cx="32" cy="56" rx="16" ry="5" fill="#000" opacity="0.32"/>
        <ellipse cx="32" cy="40" rx="15" ry="16" fill="#3f6212" stroke="#84cc16" stroke-width="2"/>
        <circle cx="32" cy="18" r="11" fill="#4d7c0f" stroke="#a3e635" stroke-width="1.5"/>
        <ellipse cx="26" cy="17" rx="2.5" ry="3.5" fill="#22c55e"/>
        <ellipse cx="38" cy="17" rx="2.5" ry="3.5" fill="#22c55e"/>
        <path d="M24 24 Q32 28 40 24" fill="none" stroke="#14532d" stroke-width="2"/>
        <path d="M14 36 L8 48 M50 36 L56 48" stroke="#65a30d" stroke-width="3" stroke-linecap="round"/>
        <rect x="20" y="34" width="8" height="14" rx="2" fill="#365314" opacity="0.7"/>
        <rect x="36" y="34" width="8" height="14" rx="2" fill="#365314" opacity="0.7"/>
        <circle cx="20" cy="30" r="2" fill="#86efac" opacity="0.55"/>
        <circle cx="44" cy="32" r="1.5" fill="#86efac" opacity="0.45"/>
    `),
    bear: SVG_WRAP(`
        <ellipse cx="32" cy="56" rx="18" ry="5" fill="#000" opacity="0.3"/>
        <ellipse cx="32" cy="38" rx="20" ry="18" fill="#92400e" stroke="#b45309" stroke-width="2"/>
        <ellipse cx="18" cy="16" rx="7" ry="8" fill="#78350f" stroke="#a16207"/>
        <ellipse cx="46" cy="16" rx="7" ry="8" fill="#78350f" stroke="#a16207"/>
        <circle cx="32" cy="22" r="14" fill="#b45309" stroke="#f59e0b" stroke-width="1.5"/>
        <ellipse cx="26" cy="20" rx="2.2" ry="3" fill="#1c1917"/>
        <ellipse cx="38" cy="20" rx="2.2" ry="3" fill="#1c1917"/>
        <ellipse cx="32" cy="26" rx="5" ry="3.5" fill="#78350f"/>
        <circle cx="30" cy="25" r="1.2" fill="#fde68a"/><circle cx="34" cy="25" r="1.2" fill="#fde68a"/>
        <ellipse cx="14" cy="42" rx="5" ry="7" fill="#78350f"/>
        <ellipse cx="50" cy="42" rx="5" ry="7" fill="#78350f"/>
    `),
    illusion: SVG_WRAP(`
        <defs>
            <linearGradient id="illu-body" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#6d28d9"/>
            </linearGradient>
            <linearGradient id="illu-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#e9d5ff" stop-opacity="0.9"/><stop offset="100%" stop-color="#7c3aed" stop-opacity="0.3"/>
            </linearGradient>
        </defs>
        <ellipse cx="32" cy="56" rx="14" ry="4" fill="#7c3aed" opacity="0.35"/>
        <ellipse cx="32" cy="40" rx="14" ry="16" fill="url(#illu-body)" stroke="#a78bfa" stroke-width="2" opacity="0.88"/>
        <circle cx="32" cy="18" r="10" fill="url(#illu-glow)" stroke="#ddd6fe" stroke-width="1.5"/>
        <path d="M20 8 L44 8 L32 20 Z" fill="#4c1d95" opacity="0.85"/>
        <path d="M48 28 Q58 22 56 42" fill="none" stroke="#c4b5fd" stroke-width="2.5" opacity="0.8"/>
        <circle cx="18" cy="36" r="3" fill="#e9d5ff" opacity="0.55"/>
        <circle cx="46" cy="48" r="2.5" fill="#c4b5fd" opacity="0.5"/>
        <path d="M22 50 Q32 58 42 50" fill="none" stroke="#ddd6fe" stroke-width="1.5" opacity="0.6"/>
    `)
  };
  function getPlayerSvg(characterName) {
    const key = characterName.toLowerCase();
    return PLAYER_SVGS[key] || PLAYER_SVGS.adventurer;
  }
  function getEnemySvg(enemyType) {
    return ENEMY_SVGS[enemyType] || ENEMY_SVGS.grunt;
  }
  function getTreasureChestSvg() {
    return ENEMY_SVGS.treasureChest;
  }
  function getCompanionSvg(type) {
    return COMPANION_SVGS[type] || COMPANION_SVGS.illusion;
  }
  function getCharacterPreviewSvg(characterName) {
    return getPlayerSvg(characterName).replace('class="entity-svg"', 'class="entity-svg entity-svg-preview"');
  }

  // js/ui/entityModels.js
  var ENEMY_TYPE_BADGES = {
    grunt: "Grunt",
    swarm: "Swarm",
    tank: "Tank",
    archer: "Archer",
    dasher: "Dasher",
    splitter: "Splitter",
    bomber: "Bomber",
    penetrator: "Penetrator",
    wraith: "Wraith",
    splitFragment: "Fragment"
  };
  function buildEnemyModelHtml(typeConfig) {
    const label = ENEMY_TYPE_BADGES[typeConfig.type] || typeConfig.label || typeConfig.type;
    return `
        <div class="enemy-model-25d enemy-type-${typeConfig.type}">
            <div class="enemy-ground-shadow" aria-hidden="true"></div>
            <div class="enemy-sprite enemy-sprite-${typeConfig.type}">${getEnemySvg(typeConfig.type)}</div>
            <span class="enemy-type-badge enemy-type-cube" title="${label}" aria-label="${label}"></span>
        </div>
    `;
  }
  function buildTreasureChestModelHtml() {
    return `
        <div class="enemy-model-25d enemy-type-treasure">
            <div class="enemy-ground-shadow treasure-chest-shadow" aria-hidden="true"></div>
            <div class="enemy-sprite enemy-sprite-treasure">${getTreasureChestSvg()}</div>
        </div>
    `;
  }
  function applyPlayerModel(playerEl, characterName) {
    const slug = characterName.toLowerCase();
    playerEl.classList.add("player-model", `player-${slug}`);
    playerEl.dataset.character = characterName;
    let sprite = playerEl.querySelector(".player-sprite");
    if (!sprite) {
      sprite = document.createElement("div");
      sprite.className = "player-sprite";
      sprite.setAttribute("aria-hidden", "true");
      playerEl.appendChild(sprite);
    }
    sprite.innerHTML = getPlayerSvg(characterName);
  }
  function resetPlayerModel(playerEl) {
    playerEl.className = "";
    playerEl.removeAttribute("data-character");
    playerEl.querySelector(".player-sprite")?.remove();
  }
  function getCharacterPreviewHtml(name) {
    return `<div class="char-preview-svg">${getCharacterPreviewSvg(name)}</div>`;
  }
  function buildCompanionModelHtml(type, opts = {}) {
    const label = type === "bear" ? "Bear" : type === "zombie" ? "Zombie" : "Illusion";
    const rangerClass = opts.ranger ? " companion-illusion-ranger" : "";
    return `
        <div class="companion-model companion-${type}${rangerClass}" aria-label="${label}" title="${label}">
            <div class="companion-ground-shadow" aria-hidden="true"></div>
            <div class="companion-sprite companion-sprite-${type}">${getCompanionSvg(type)}</div>
        </div>
    `;
  }

  // js/config/achievements.js
  function ach(id, title, description, icon, check) {
    return { id, title, description, icon, check };
  }
  var COMBO_ACHIEVEMENT_LIMITS = {
    /** Swarm types unlock ~wave 7; allow time for density to ramp. */
    blitzKills: 200,
    blitzMaxSeconds: 300,
    slayerTimeKills: 1e3,
    slayerTimeMaxSeconds: 720,
    earlyPressureKills: 100,
    earlyPressureMaxWave: 10,
    speedMinWave: 24,
    speedMaxSeconds: 600
  };
  var STAT_ACHIEVEMENT_THRESHOLDS = {
    maxHp: 1e4,
    critChance: 100,
    critMultiplier: 500,
    hpRegen: 1e3,
    physicalDamage: 3e3
  };
  var META_ACHIEVEMENT_THRESHOLDS = {
    charactersBeatGameTrio: 3,
    charactersBeatGameFullRoster: CHARACTERS.length
  };
  var ACHIEVEMENTS = [
    // —— Combat kills ——
    ach("first_blood", "First Blood", "Defeat your first enemy.", "\u{1FA78}", (ctx) => ctx.killCount >= 1),
    ach("slayer_10", "Warm-Up", "Defeat 10 enemies in one run.", "\u{1F5E1}\uFE0F", (ctx) => ctx.killCount >= 10),
    ach("slayer_25", "Skirmisher", "Defeat 25 enemies in one run.", "\u2694\uFE0F", (ctx) => ctx.killCount >= 25),
    ach("slayer_50", "Battler", "Defeat 50 enemies in one run.", "\u{1F6E1}\uFE0F", (ctx) => ctx.killCount >= 50),
    ach("slayer_100", "Centurion", "Defeat 100 enemies in one run.", "\u{1F4AF}", (ctx) => ctx.killCount >= 100),
    ach("slayer_250", "Raid Leader", "Defeat 250 enemies in one run.", "\u{1F3F9}", (ctx) => ctx.killCount >= 250),
    ach("slayer_500", "Exterminator", "Defeat 500 enemies in one run.", "\u{1F480}", (ctx) => ctx.killCount >= 500),
    ach("slayer_1000", "Legend Slayer", "Defeat 1000 enemies in one run.", "\u{1F3C6}", (ctx) => ctx.killCount >= 1e3),
    ach("slayer_2000", "Arena Nightmare", "Defeat 2000 enemies in one run.", "\u{1F479}", (ctx) => ctx.killCount >= 2e3),
    ach("slayer_10000", "Apocalypse", "Defeat 10,000 enemies in one run.", "\u2604\uFE0F", (ctx) => ctx.killCount >= 1e4),
    // —— Levels ——
    ach("level_5", "Getting Started", "Reach level 5 in one run.", "\u{1F331}", (ctx) => ctx.level >= 5),
    ach("level_10", "Rising Star", "Reach level 10 in one run.", "\u2B50", (ctx) => ctx.level >= 10),
    ach("level_15", "Seasoned", "Reach level 15 in one run.", "\u{1F320}", (ctx) => ctx.level >= 15),
    ach("level_25", "Veteran", "Reach level 25 in one run.", "\u{1F396}\uFE0F", (ctx) => ctx.level >= 25),
    ach("level_35", "Warlord", "Reach level 35 in one run.", "\u{1F451}", (ctx) => ctx.level >= 35),
    ach("level_50", "Elite Hunter", "Reach level 50 in one run.", "\u{1F48E}", (ctx) => ctx.level >= 50),
    ach("level_75", "Apex Predator", "Reach level 75 in one run.", "\u{1F406}", (ctx) => ctx.level >= 75),
    ach("level_100", "Centennial", "Reach level 100 in one run.", "\u{1F31F}", (ctx) => ctx.level >= 100),
    // —— Survival time ——
    ach("survive_1m", "One Minute", "Survive 1 minute.", "\u23F1\uFE0F", (ctx) => ctx.elapsedSeconds >= 60),
    ach("survive_3m", "Holding On", "Survive 3 minutes.", "\u23F3", (ctx) => ctx.elapsedSeconds >= 180),
    ach("survive_5m", "Still Standing", "Survive 5 minutes.", "\u{1F9CD}", (ctx) => ctx.elapsedSeconds >= 300),
    ach("survive_10m", "Tenacious", "Survive 10 minutes.", "\u{1F9F1}", (ctx) => ctx.elapsedSeconds >= 600),
    ach("survive_15m", "Iron Will", "Survive 15 minutes.", "\u{1F4AA}", (ctx) => ctx.elapsedSeconds >= 900),
    ach("survive_20m", "Endurance Ace", "Survive 20 minutes.", "\u{1F3C3}", (ctx) => ctx.elapsedSeconds >= 1200),
    ach("survive_30m", "Marathon Runner", "Survive 30 minutes.", "\u{1F3C5}", (ctx) => ctx.elapsedSeconds >= 1800),
    // —— Waves ——
    ach("wave_3", "Wave Rider", "Reach wave 3.", "\u{1F30A}", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 3),
    ach("wave_6", "Tide Breaker", "Reach wave 6.", "\u{1F300}", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 6),
    ach("wave_12", "Deep Waters", "Reach wave 12.", "\u{1F30A}", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 12),
    ach("wave_18", "Storm Caller", "Reach wave 18.", "\u26C8\uFE0F", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 18),
    ach("wave_24", "Twilight Tide", "Reach wave 24.", "\u{1F319}", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 24),
    ach("wave_36", "Abyss Walker", "Reach wave 36.", "\u{1F573}\uFE0F", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 36),
    ach("wave_48", "Wave Master", "Reach wave 48.", "\u{1F451}", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 48),
    ach("wave_100_champion", "Arena Champion", "Defeat the Wave 100 final boss.", "\u{1F3C6}", (ctx) => Boolean(ctx.finalVictoryAchieved)),
    // —— Kill streaks ——
    ach("streak_5", "On a Roll", "Reach a 5 kill streak.", "\u{1F525}", (ctx) => ctx.bestStreak >= 5),
    ach("streak_10", "Hot Streak", "Reach a 10 kill streak.", "\u{1F336}\uFE0F", (ctx) => ctx.bestStreak >= 10),
    ach("streak_25", "Unstoppable", "Reach a 25 kill streak.", "\u{1F4A5}", (ctx) => ctx.bestStreak >= 25),
    ach("streak_50", "Frenzy", "Reach a 50 kill streak.", "\u{1F32A}\uFE0F", (ctx) => ctx.bestStreak >= 50),
    ach("streak_100", "Rampage", "Reach a 100 kill streak.", "\u2622\uFE0F", (ctx) => ctx.bestStreak >= 100),
    // —— Treasure ——
    ach("treasure_1", "Lucky Find", "Open 1 treasure chest in one run.", "\u{1F381}", (ctx) => ctx.treasuresOpened >= 1),
    ach("treasure_3", "Chest Curious", "Open 3 treasure chests in one run.", "\u{1F4E6}", (ctx) => ctx.treasuresOpened >= 3),
    ach("treasure_5", "Treasure Hunter", "Open 5 treasure chests in one run.", "\u{1F5FA}\uFE0F", (ctx) => ctx.treasuresOpened >= 5),
    ach("treasure_lucky", "Shiny Surprise", "Open 7 treasure chests in one run.", "\u2728", (ctx) => ctx.treasuresOpened >= 7),
    // —— Gear ——
    ach("loot_1", "First Drop", "Pick up 1 item in one run.", "\u{1F392}", (ctx) => ctx.itemsLooted >= 1),
    ach("loot_5", "Scavenger", "Pick up 5 items in one run.", "\u{1F9F2}", (ctx) => ctx.itemsLooted >= 5),
    ach("loot_20", "Collector", "Pick up 20 items in one run.", "\u{1F4FF}", (ctx) => ctx.itemsLooted >= 20),
    ach("loot_50", "Hoarder", "Pick up 50 items in one run.", "\u{1F9FA}", (ctx) => ctx.itemsLooted >= 50),
    ach("gear_rare", "Well Equipped", "Equip a rare (or unique) item.", "\u2728", (ctx) => ctx.equippedRareCount >= 1),
    ach("gear_unique", "Relic Seeker", "Equip a unique item.", "\u{1F9E1}", (ctx) => (ctx.equippedUniqueCount ?? 0) >= 1),
    ach("gear_3", "Armed", "Equip items in 3 slots.", "\u{1F9E4}", (ctx) => ctx.equippedGearCount >= 3),
    ach("gear_5", "Geared Up", "Equip items in 5 slots.", "\u{1F9E4}", (ctx) => ctx.equippedGearCount >= 5),
    ach("gear_full", "Fully Loaded", "Equip items in all 7 slots.", "\u{1F9BE}", (ctx) => ctx.equippedGearCount >= 7),
    ach("hp_5000", "Iron Heart", "Reach 5,000 maximum HP in one run.", "\u2764\uFE0F\u200D\u{1F525}", (ctx) => (ctx.maxHpReached ?? ctx.maxHp ?? 0) >= 5e3),
    ach("hp_10000", "Absolute Unit", "Reach 10,000 maximum HP in one run.", "\u{1FAC0}", (ctx) => (ctx.maxHpReached ?? ctx.maxHp ?? 0) >= STAT_ACHIEVEMENT_THRESHOLDS.maxHp),
    ach("crit_100", "Crit Happens", "Reach 100% crit chance in one run.", "\u{1F3B2}", (ctx) => (ctx.critChanceReached ?? 0) >= STAT_ACHIEVEMENT_THRESHOLDS.critChance),
    ach("crit_dmg_500", "Overkill Energy", "Reach 500% crit damage in one run.", "\u{1F4A5}", (ctx) => (ctx.critMultiplierReached ?? 0) >= STAT_ACHIEVEMENT_THRESHOLDS.critMultiplier),
    ach("regen_1000", "Soup Kitchen Hero", "Reach 1,000 HP regen per tick in one run.", "\u{1F372}", (ctx) => (ctx.hpRegenReached ?? 0) >= STAT_ACHIEVEMENT_THRESHOLDS.hpRegen),
    ach("damage_3000", "Number Go Up", "Reach 3,000 physical damage in one run.", "\u{1F4C8}", (ctx) => (ctx.physicalDamageReached ?? 0) >= STAT_ACHIEVEMENT_THRESHOLDS.physicalDamage),
    // —— Skills ——
    ach("skill_any", "First Spell", "Learn any active skill (sum of levels \u2265 1).", "\u{1FA84}", (ctx) => (ctx.skillLevelSum ?? 0) >= 1),
    ach("skill_5", "Spell Student", "Reach 5 total skill levels.", "\u{1F4D8}", (ctx) => (ctx.skillLevelSum ?? 0) >= 5),
    // —— Meta roster victories ——
    ach("victory_trio", "Triple Threat", "Beat the game with 3 different characters.", "\u{1F3AD}", (ctx) => (ctx.charactersBeatGame ?? 0) >= META_ACHIEVEMENT_THRESHOLDS.charactersBeatGameTrio),
    ach("victory_full_roster", "Cast Party", `Beat the game with all ${META_ACHIEVEMENT_THRESHOLDS.charactersBeatGameFullRoster} characters.`, "\u{1F3AA}", (ctx) => (ctx.charactersBeatGame ?? 0) >= META_ACHIEVEMENT_THRESHOLDS.charactersBeatGameFullRoster),
    // —— Special enemies ——
    ach("elite_1", "Elite Hunter", "Defeat 1 elite enemy in one run.", "\u{1F7E3}", (ctx) => (ctx.elitesKilled ?? 0) >= 1),
    ach("elite_10", "Elite Slayer", "Defeat 10 elite enemies in one run.", "\u{1F49C}", (ctx) => (ctx.elitesKilled ?? 0) >= 10),
    ach("boss_1", "Boss Breaker", "Defeat 1 boss in one run.", "\u{1F432}", (ctx) => (ctx.bossesKilled ?? 0) >= 1),
    ach("boss_3", "Boss Bane", "Defeat 3 bosses in one run.", "\u{1F409}", (ctx) => (ctx.bossesKilled ?? 0) >= 3),
    ach("boss_5", "Dragon Killer", "Defeat 5 bosses in one run.", "\u{1F525}", (ctx) => (ctx.bossesKilled ?? 0) >= 5),
    // —— Combo challenges (tuned for swarm unlock ~wave 7 and warmup spawn curve) ——
    ach("combo_kills_wave", "Early Pressure", `Get ${COMBO_ACHIEVEMENT_LIMITS.earlyPressureKills} kills before wave ${COMBO_ACHIEVEMENT_LIMITS.earlyPressureMaxWave + 1}.`, "\u26A1", (ctx) => ctx.killCount >= COMBO_ACHIEVEMENT_LIMITS.earlyPressureKills && (ctx.maxWaveReached ?? ctx.currentWave ?? 99) <= COMBO_ACHIEVEMENT_LIMITS.earlyPressureMaxWave),
    ach("combo_level_streak", "Perfect Flow", "Reach level 15 with a best streak of 30+.", "\u{1F3AD}", (ctx) => ctx.level >= 15 && ctx.bestStreak >= 30),
    ach("combo_treasure_loot", "Fortune Favored", "Open 5 chests and loot 20 items in one run.", "\u{1F4B0}", (ctx) => ctx.treasuresOpened >= 5 && ctx.itemsLooted >= 20),
    ach("combo_tank", "Ironclad", "Survive 15 minutes with 5+ gear pieces equipped.", "\u{1F3F0}", (ctx) => ctx.elapsedSeconds >= 900 && ctx.equippedGearCount >= 5),
    ach("combo_glass", "Glass Cannon", "Reach wave 18 with fewer than 3 gear pieces equipped.", "\u{1F37E}", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= 18 && ctx.equippedGearCount < 3),
    /** Wave advances by clock (~20s); wave 24 ≈ 7.7 min — requiring ≤ 10 min leaves room for slow starts. */
    ach("combo_speed", "Speed Demon", `Reach wave ${COMBO_ACHIEVEMENT_LIMITS.speedMinWave} within ${COMBO_ACHIEVEMENT_LIMITS.speedMaxSeconds / 60} minutes.`, "\u{1F680}", (ctx) => (ctx.maxWaveReached ?? ctx.currentWave ?? 0) >= COMBO_ACHIEVEMENT_LIMITS.speedMinWave && ctx.elapsedSeconds <= COMBO_ACHIEVEMENT_LIMITS.speedMaxSeconds),
    ach("combo_slayer_time", "Efficient Killer", `Get ${COMBO_ACHIEVEMENT_LIMITS.slayerTimeKills} kills within ${COMBO_ACHIEVEMENT_LIMITS.slayerTimeMaxSeconds / 60} minutes.`, "\u{1F3B3}", (ctx) => ctx.killCount >= COMBO_ACHIEVEMENT_LIMITS.slayerTimeKills && ctx.elapsedSeconds <= COMBO_ACHIEVEMENT_LIMITS.slayerTimeMaxSeconds),
    ach("combo_blitz", "Blitz Pack", `Get ${COMBO_ACHIEVEMENT_LIMITS.blitzKills} kills within ${COMBO_ACHIEVEMENT_LIMITS.blitzMaxSeconds / 60} minutes.`, "\u26A1", (ctx) => ctx.killCount >= COMBO_ACHIEVEMENT_LIMITS.blitzKills && ctx.elapsedSeconds <= COMBO_ACHIEVEMENT_LIMITS.blitzMaxSeconds),
    ach("combo_endurance_kills", "War of Attrition", "Get 1500 kills in one run.", "\u{1FA93}", (ctx) => ctx.killCount >= 1500)
  ];
  function getAchievementTooltipText(def) {
    return def?.description ?? "";
  }

  // js/systems/metaProgress.js
  var STORAGE_KEY = "survivor-arena-meta";
  function createEmptyCharacterRecord() {
    return {
      level: 0,
      time: 0,
      kills: 0,
      wave: 0,
      beatGame: false,
      victoryCount: 0
    };
  }
  function normalizeCharacterRecord(raw) {
    const base = createEmptyCharacterRecord();
    if (!raw || typeof raw !== "object") return base;
    return {
      level: Math.max(0, Number(raw.level) || 0),
      time: Math.max(0, Number(raw.time) || 0),
      kills: Math.max(0, Number(raw.kills) || 0),
      wave: Math.max(0, Number(raw.wave) || 0),
      beatGame: Boolean(raw.beatGame),
      victoryCount: Math.max(0, Number(raw.victoryCount) || 0)
    };
  }
  function createDefaultMeta() {
    return {
      bestRun: { level: 0, time: 0, kills: 0, wave: 0, character: "" },
      characterRecords: {},
      unlockedAchievements: []
    };
  }
  function loadMetaProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultMeta();
      const parsed = JSON.parse(raw);
      const meta = { ...createDefaultMeta(), ...parsed };
      if (!meta.characterRecords) meta.characterRecords = {};
      if (parsed.totalGold !== void 0) delete meta.totalGold;
      const normalized = {};
      for (const [name, record] of Object.entries(meta.characterRecords)) {
        normalized[name] = normalizeCharacterRecord(record);
      }
      meta.characterRecords = normalized;
      return meta;
    } catch {
      return createDefaultMeta();
    }
  }
  function saveMetaProgress(meta) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    } catch {
    }
  }
  function getCharacterRecord(meta, characterName) {
    return normalizeCharacterRecord(meta.characterRecords[characterName]);
  }
  function hasCharacterBeatGame(meta, characterName) {
    return getCharacterRecord(meta, characterName).beatGame;
  }
  function getCharacterVictoryCount(meta, characterName) {
    return getCharacterRecord(meta, characterName).victoryCount;
  }
  function markCharacterVictory(meta, characterName) {
    if (!characterName) return;
    const prev = getCharacterRecord(meta, characterName);
    meta.characterRecords[characterName] = {
      ...prev,
      beatGame: true,
      victoryCount: prev.victoryCount + 1
    };
    saveMetaProgress(meta);
  }
  function recordCampaignVictoryIfPending(meta, characterName, runState) {
    if (!characterName || !runState?.finalBossDefeatedThisRun) return false;
    if (runState.campaignVictoryRecorded) return false;
    markCharacterVictory(meta, characterName);
    runState.campaignVictoryRecorded = true;
    runState.finalVictoryAchieved = true;
    return true;
  }
  function updateCharacterRecord(meta, run) {
    if (!run.character) return;
    const prev = getCharacterRecord(meta, run.character);
    const better = run.level > prev.level || run.level === prev.level && run.kills > prev.kills || run.level === prev.level && run.kills === prev.kills && run.time > prev.time;
    if (better) {
      meta.characterRecords[run.character] = {
        ...prev,
        level: run.level,
        time: run.time,
        kills: run.kills,
        wave: run.wave
      };
    }
    const global = meta.bestRun;
    const globalBetter = run.level > global.level || run.level === global.level && run.kills > global.kills;
    if (globalBetter) {
      meta.bestRun = { ...run };
    }
    saveMetaProgress(meta);
  }
  function countCharactersBeatGame(meta) {
    return Object.values(meta?.characterRecords || {}).filter((record) => normalizeCharacterRecord(record).beatGame).length;
  }
  function evaluateAchievements(meta, ctx) {
    const newlyUnlocked = [];
    ACHIEVEMENTS.forEach((def) => {
      if (meta.unlockedAchievements.includes(def.id)) return;
      if (def.check(ctx)) {
        meta.unlockedAchievements.push(def.id);
        newlyUnlocked.push(def.id);
      }
    });
    if (newlyUnlocked.length > 0) saveMetaProgress(meta);
    return newlyUnlocked;
  }
  function getAchievementById(id) {
    return ACHIEVEMENTS.find((a) => a.id === id);
  }

  // js/ui/characterSelectCard.js
  var STAT_FIELDS = [
    { label: "HP", title: "Hit Points", icon: "\u2665", stat: "maxHp", tone: "char-stat-hp" },
    { label: "DMG", title: "Damage", icon: "\u2694", stat: "physicalDamage", tone: "char-stat-dmg" },
    { label: "AoE", title: "Attack Range", icon: "\u25CE", stat: "attackRange", tone: "char-stat-aoe" },
    { label: "DEF", title: "Defence", icon: "\u{1F6E1}", stat: "armour", tone: "char-stat-def" }
  ];
  var PASSIVE_INTERACTIVE_SELECTOR = ".character-passive-reveal, .character-passive-reveal *";
  function formatCharacterBestRunText(record) {
    if (!record || (record.level ?? 0) <= 0) return "";
    return `Lv.${record.level} \xB7 Wave ${record.wave} \xB7 ${record.kills} kills \xB7 ${formatTime(record.time)}`;
  }
  function formatCharacterWinCount(victoryCount, beatGame = false) {
    const count = Math.max(0, victoryCount || 0);
    if (!beatGame && count <= 0) return 0;
    return beatGame ? Math.max(1, count) : count;
  }
  function formatCharacterChampionLineText(victoryCount, beatGame = false) {
    const wins = formatCharacterWinCount(victoryCount, beatGame);
    if (!wins) return "";
    return `${wins} \u2605`;
  }
  function buildCharacterChampionBadgeHtml(cardMeta) {
    const wins = formatCharacterWinCount(cardMeta.victoryCount, cardMeta.beatGame);
    if (!wins) return "";
    const winWord = wins === 1 ? "win" : "wins";
    return `<span class="character-champion-badge" aria-label="${wins} campaign ${winWord}"><span class="character-champion-count">${wins}</span><span class="character-champion-star" aria-hidden="true">\u2605</span></span>`;
  }
  function getCharacterCardMeta(char, meta) {
    const record = meta ? getCharacterRecord(meta, char.name) : null;
    const hasRecord = Boolean(record && record.level > 0);
    const beatGame = meta ? hasCharacterBeatGame(meta, char.name) : false;
    const victoryCount = meta ? getCharacterVictoryCount(meta, char.name) : 0;
    const bestRunText = formatCharacterBestRunText(record);
    const championLineText = formatCharacterChampionLineText(victoryCount, beatGame);
    return {
      bestRunText,
      championLineText,
      hasRecord,
      beatGame,
      victoryCount
    };
  }
  function buildCharacterRecordLinesHtml(cardMeta) {
    const parts = [];
    if (cardMeta.bestRunText) {
      parts.push(
        `<span class="character-best-run has-record">${cardMeta.bestRunText}</span>`
      );
    } else if (!cardMeta.beatGame) {
      parts.push('<span class="character-best-run">No record yet</span>');
    }
    return `<div class="character-record-lines">${parts.join("")}</div>`;
  }
  function buildCharacterStatsGridHtml(stats) {
    const cells = STAT_FIELDS.map(({ label, title, icon, stat, tone }) => {
      const value = stats[stat];
      return `<div class="char-stat-cell ${tone}" title="${title}">
            <span class="char-stat-ico ${tone}" aria-hidden="true">${icon}</span>
            <span class="char-stat-label">${label}</span>
            <span class="char-stat-value">${value}</span>
        </div>`;
    }).join("");
    return `<div class="character-stats-grid" role="group" aria-label="Base stats">${cells}</div>`;
  }
  function buildCharacterPassiveRevealHtml(passive) {
    if (!passive) return "";
    const tipHtml = formatPassiveTooltipHtml(passive);
    return `<details class="character-passive-reveal">
        <summary class="character-passive-reveal-summary" aria-label="Unique passive: ${passive.name}. Tap for details.">
            <span class="character-passive-reveal-icon" aria-hidden="true">${passive.icon}</span>
            <span class="character-passive-reveal-name">${passive.name}</span>
        </summary>
        <div class="character-passive-reveal-body" role="tooltip">
            ${tipHtml}
        </div>
    </details>`;
  }
  function bindCharacterCardSelect(card, onSelect) {
    const name = card.dataset.character;
    if (!name) return;
    const trySelect = (event) => {
      if (event.target.closest(PASSIVE_INTERACTIVE_SELECTOR)) return;
      onSelect(name);
    };
    card.addEventListener("click", trySelect);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest(PASSIVE_INTERACTIVE_SELECTOR)) return;
      event.preventDefault();
      onSelect(name);
    });
  }
  function buildCharacterCard(char, index, meta, onSelect) {
    const cardMeta = getCharacterCardMeta(char, meta);
    const passive = getCharacterPassive(char.name);
    const keyHint = index < 9 ? index + 1 : index === 9 ? "0" : "-";
    const card = document.createElement("article");
    card.className = "character-card" + (cardMeta.beatGame ? " character-card--champion" : "");
    card.dataset.character = char.name;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Select ${char.name}`);
    card.innerHTML = `
        <span class="character-index">${keyHint}</span>
        <div class="character-card-inner">
            <div class="character-card-main">
                <div class="character-card-preview">${getCharacterPreviewHtml(char.name)}${buildCharacterChampionBadgeHtml(cardMeta)}</div>
                <div class="character-card-meta">
                    <h3>${char.name}</h3>
                    <span class="character-role">${char.role}</span>
                    ${buildCharacterRecordLinesHtml(cardMeta)}
                </div>
                ${buildCharacterPassiveRevealHtml(passive)}
            </div>
            ${buildCharacterStatsGridHtml(char.stats)}
            <p class="character-desc">${char.description}</p>
        </div>
    `;
    if (onSelect) bindCharacterCardSelect(card, onSelect);
    bindCharacterPassiveDesktopHover(card);
    return card;
  }
  function bindCharacterPassiveDesktopHover(card) {
    if (typeof window === "undefined") return;
    const details = card.querySelector(".character-passive-reveal");
    const summary = details?.querySelector("summary");
    if (!summary) return;
    const mq = window.matchMedia("(min-width: 769px)");
    summary.addEventListener("click", (event) => {
      if (mq.matches) event.preventDefault();
    });
  }

  // js/config/milestoneBosses.js
  var MINI_BOSS_WAVES = [25, 75];
  var MIDPOINT_VICTORY_WAVE = 50;
  var FINAL_VICTORY_WAVE = 100;
  var FINAL_BOSS_HP_MULT = 50;
  var MIDPOINT_BOSS_HP_MULT = 30;
  var MINI_BOSS_HP_MULT = 10;
  var MILESTONE_BOSS_COMBAT_MULT = {
    damage: 2.25,
    armour: 2.1
  };
  var BOSS_WAVE_PROFILES = {
    25: {
      hpMult: MINI_BOSS_HP_MULT,
      hudLabel: "Wave 25 Mini Boss",
      worldLabel: "W25 BOSS",
      priority: 1,
      army: { swarmMin: 12, swarmMax: 18, gruntMin: 8, gruntMax: 12, eliteMin: 2, eliteMax: 4 },
      reinforceIntervalMs: 5200,
      reinforcementSwarmMin: 3,
      reinforcementSwarmMax: 6,
      guaranteesUniqueLoot: true
    },
    50: {
      hpMult: MIDPOINT_BOSS_HP_MULT,
      hudLabel: "Wave 50 Boss",
      worldLabel: "W50 BOSS",
      priority: 2,
      army: { swarmMin: 28, swarmMax: 36, gruntMin: 18, gruntMax: 24, eliteMin: 4, eliteMax: 8 },
      reinforceIntervalMs: 4800,
      reinforcementSwarmMin: 4,
      reinforcementSwarmMax: 8,
      guaranteesUniqueLoot: true
    },
    75: {
      hpMult: MINI_BOSS_HP_MULT,
      hudLabel: "Wave 75 Mini Boss",
      worldLabel: "W75 BOSS",
      priority: 3,
      army: { swarmMin: 16, swarmMax: 22, gruntMin: 10, gruntMax: 14, eliteMin: 3, eliteMax: 6 },
      reinforceIntervalMs: 5e3,
      reinforcementSwarmMin: 3,
      reinforcementSwarmMax: 7,
      guaranteesUniqueLoot: true
    },
    100: {
      hpMult: FINAL_BOSS_HP_MULT,
      hudLabel: "Final Boss",
      worldLabel: "FINAL BOSS",
      priority: 4,
      isFinalVictory: true,
      army: { swarmMin: 38, swarmMax: 52, gruntMin: 20, gruntMax: 30, eliteMin: 12, eliteMax: 18 },
      reinforceIntervalMs: 4800,
      reinforcementSwarmMin: 4,
      reinforcementSwarmMax: 8,
      guaranteesUniqueLoot: true
    }
  };
  var BOSS_HP_BY_WAVE = Object.fromEntries(
    Object.entries(BOSS_WAVE_PROFILES).map(([wave, profile]) => [Number(wave), profile.hpMult])
  );
  var BOSS_HUD_LABELS = Object.fromEntries(
    Object.entries(BOSS_WAVE_PROFILES).map(([wave, p]) => [wave, p.hudLabel])
  );
  var MILESTONE_BOSS_WORLD_LABELS = Object.fromEntries(
    Object.entries(BOSS_WAVE_PROFILES).map(([wave, p]) => [wave, p.worldLabel])
  );
  var BOSS_HUD_PRIORITY = Object.fromEntries(
    Object.entries(BOSS_WAVE_PROFILES).map(([wave, p]) => [Number(wave), p.priority])
  );
  var MILESTONE_BOSS_SPAWN_OPTS = {
    skipGroup: true,
    bypassCap: true
  };
  var MIDPOINT_VICTORY_ARMY = BOSS_WAVE_PROFILES[50].army;
  var FINAL_VICTORY_ARMY = BOSS_WAVE_PROFILES[100].army;
  function getBossWaveProfile(wave) {
    return BOSS_WAVE_PROFILES[wave] || null;
  }
  function milestoneBossGuaranteesUniqueLoot(wave) {
    return Boolean(getBossWaveProfile(wave)?.guaranteesUniqueLoot);
  }
  function isMidpointVictoryWave(wave) {
    return wave === MIDPOINT_VICTORY_WAVE;
  }
  function isFinalVictoryWave(wave) {
    return wave === FINAL_VICTORY_WAVE;
  }
  function isMilestoneBossWave(wave) {
    return Boolean(BOSS_WAVE_PROFILES[wave]);
  }
  function isMilestoneBossEnemy(enemy) {
    return Boolean(enemy?.milestoneBossWave && BOSS_WAVE_PROFILES[enemy.milestoneBossWave]);
  }
  function rollInt(min, max) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }
  function rollBossArmyCount(wave, kind) {
    const army = getBossWaveProfile(wave)?.army;
    if (!army) return 0;
    if (kind === "swarm") return rollInt(army.swarmMin, army.swarmMax);
    if (kind === "grunt") return rollInt(army.gruntMin, army.gruntMax);
    return rollInt(army.eliteMin, army.eliteMax);
  }
  function applyMilestoneBossCombatScaling(stats, wave = MIDPOINT_VICTORY_WAVE) {
    if (!stats) return stats;
    const profile = getBossWaveProfile(wave);
    const hpMult = profile?.hpMult ?? FINAL_BOSS_HP_MULT;
    stats.hp = Math.max(1, Math.floor(stats.hp * hpMult));
    stats.maxHp = stats.hp;
    stats.physicalDamage = Math.max(
      1,
      Math.floor(stats.physicalDamage * MILESTONE_BOSS_COMBAT_MULT.damage)
    );
    if (typeof stats.armour === "number") {
      stats.armour = Math.max(0, Math.floor(stats.armour * MILESTONE_BOSS_COMBAT_MULT.armour));
    }
    return stats;
  }
  function findLivingMilestoneBoss(enemies, preferredWave) {
    const living = enemies.filter(
      (e) => e.milestoneBossWave && BOSS_WAVE_PROFILES[e.milestoneBossWave] && (e.stats?.hp ?? 0) > 0
    );
    if (preferredWave != null) {
      return living.find((e) => e.milestoneBossWave === preferredWave) || null;
    }
    let best = null;
    let bestPriority = 0;
    for (const enemy of living) {
      const priority = BOSS_WAVE_PROFILES[enemy.milestoneBossWave]?.priority ?? 0;
      if (priority > bestPriority) {
        best = enemy;
        bestPriority = priority;
      }
    }
    return best;
  }
  function getMidpointReinforcementIntervalMs() {
    return BOSS_WAVE_PROFILES[MIDPOINT_VICTORY_WAVE].reinforceIntervalMs;
  }
  function getMilestoneReinforcementIntervalMs(milestoneWave) {
    return getBossWaveProfile(milestoneWave)?.reinforceIntervalMs ?? getMidpointReinforcementIntervalMs();
  }
  function rollMidpointReinforcementSwarmSize() {
    const p = BOSS_WAVE_PROFILES[MIDPOINT_VICTORY_WAVE];
    return rollInt(p.reinforcementSwarmMin, p.reinforcementSwarmMax);
  }
  function rollMilestoneReinforcementSwarmSize(milestoneWave) {
    const p = getBossWaveProfile(milestoneWave);
    if (!p) return rollMidpointReinforcementSwarmSize();
    return rollInt(p.reinforcementSwarmMin, p.reinforcementSwarmMax);
  }

  // js/utils/tooltipClamp.js
  function computeTooltipPlacement(tipRect, boundsRect, pad = 10) {
    const safePad = Math.max(0, pad);
    let shiftX = 0;
    if (tipRect.left < boundsRect.left + safePad) {
      shiftX = boundsRect.left + safePad - tipRect.left;
    } else if (tipRect.right > boundsRect.right - safePad) {
      shiftX = boundsRect.right - safePad - tipRect.right;
    }
    let placement = "below";
    if (tipRect.bottom > boundsRect.bottom - safePad) {
      placement = "above";
    }
    return { shiftX: Math.round(shiftX), placement };
  }

  // js/systems/playerVitality.js
  function clampPlayerHp(stats) {
    if (!stats) return;
    if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;
    if (stats.hp < 0) stats.hp = 0;
  }
  function isPlayerDefeated(stats) {
    return stats.hp <= 0;
  }
  function applyPlayerDamage(stats, amount) {
    stats.hp -= amount;
  }
  function tickPlayerRegen(state, now) {
    const s = state;
    const regenBoost = s.abilityList["Regen To Damage"].level > 0 ? s.abilityList["Regen To Damage"].level * 20 / 100 : 0;
    const interval = s.healthRegenInterval / (1 + regenBoost);
    if (now - s.healthRegenTime >= interval) {
      s.healthRegenTime = now;
      s.stats.hp += s.stats.hpRegen;
    }
  }
  function resolvePlayerDefeat(stats) {
    clampPlayerHp(stats);
    return isPlayerDefeated(stats);
  }

  // js/ui/manager.js
  var SKILL_ICON_HTML = {
    illusion: '<span class="skill-icon-illusion" aria-hidden="true">IL</span>'
  };
  var UIManager = class {
    constructor() {
      this.els = {
        characterSelection: document.getElementById("character-selection"),
        characterList: document.getElementById("character-list"),
        gameContainer: document.getElementById("game-container"),
        gameUI: document.getElementById("game-ui"),
        playerAnchor: document.getElementById("player-anchor"),
        player: document.getElementById("player"),
        attackRange: document.getElementById("attack-range"),
        timer: document.getElementById("timer"),
        level: document.getElementById("level"),
        hpBarFill: document.getElementById("hp-bar-fill"),
        hpValue: document.getElementById("hp-value"),
        expBarFill: document.getElementById("exp-bar-fill"),
        expValue: document.getElementById("exp-value"),
        damage: document.getElementById("damage"),
        aoe: document.getElementById("aoe"),
        attackSpeed: document.getElementById("attack-speed"),
        hpRegen: document.getElementById("hp-regen"),
        defence: document.getElementById("defence"),
        evade: document.getElementById("evade"),
        critChance: document.getElementById("crit-chance"),
        critMultiplier: document.getElementById("crit-multiplier"),
        kills: document.getElementById("kill-count"),
        difficulty: document.getElementById("difficulty-level"),
        streak: document.getElementById("streak-count"),
        skillBar: document.getElementById("skill-bar"),
        pauseOverlay: document.getElementById("pause-overlay"),
        gameOverOverlay: document.getElementById("game-over-overlay"),
        gameOverStats: document.getElementById("game-over-stats"),
        achievementToast: document.getElementById("achievement-toast"),
        waveToast: document.getElementById("wave-toast"),
        gearLootToast: document.getElementById("gear-loot-toast"),
        characterPassiveBtn: document.getElementById("character-passive-btn"),
        characterPassiveIcon: document.getElementById("character-passive-icon"),
        characterPassiveTip: document.getElementById("character-passive-tip"),
        shieldRow: document.getElementById("shield-row"),
        shieldBarFill: document.getElementById("shield-bar-fill"),
        shieldValue: document.getElementById("shield-value"),
        buffBar: document.getElementById("buff-bar"),
        achievementsOverlay: document.getElementById("achievements-overlay"),
        achievementsGrid: document.getElementById("achievements-grid"),
        achievementsProgress: document.getElementById("achievements-progress"),
        achievementsClose: document.getElementById("achievements-close"),
        treasurePing: null
      };
      this._achievementTimer = null;
      this._waveTimer = null;
      this._gearLootTimer = null;
      this._treasurePingTimer = null;
      this._lastStreak = 0;
      this.characterSelectTooltips = new CharacterSelectTooltips();
      this._initPauseMenu();
    }
    _initPauseMenu() {
      this.els.pauseResume = document.getElementById("pause-resume");
      this.els.pauseRestart = document.getElementById("pause-restart");
      this.els.pauseCharacter = document.getElementById("pause-character");
      this.els.pauseAchievements = document.getElementById("pause-achievements");
      this.els.audioMusicSliderChar = document.getElementById("audio-music-slider-char");
      this.els.audioMusicSliderPause = document.getElementById("audio-music-slider-pause");
      this.els.audioSfxSliderChar = document.getElementById("audio-sfx-slider-char");
      this.els.audioSfxSliderPause = document.getElementById("audio-sfx-slider-pause");
      this.els.audioMusicValueChar = document.getElementById("audio-music-value-char");
      this.els.audioMusicValuePause = document.getElementById("audio-music-value-pause");
      this.els.audioSfxValueChar = document.getElementById("audio-sfx-value-char");
      this.els.audioSfxValuePause = document.getElementById("audio-sfx-value-pause");
      this.els.achievementsClose?.addEventListener("click", () => this.closeAchievementsPanel());
    }
    /**
     * @param {{
     *   resume: () => void,
     *   restart: () => void,
     *   characterSelect: () => void,
     *   achievements?: () => void
     * }} handlers
     */
    bindPauseMenu(handlers) {
      this.els.pauseResume?.addEventListener("click", handlers.resume);
      this.els.pauseRestart?.addEventListener("click", handlers.restart);
      this.els.pauseCharacter?.addEventListener("click", handlers.characterSelect);
      this.els.pauseAchievements?.addEventListener("click", () => handlers.achievements?.());
    }
    /**
     * Renders the full achievement grid (locked + unlocked) with hover tips.
     * @param {{ unlockedAchievements?: string[] }} meta
     */
    openAchievementsPanel(meta) {
      const unlocked = new Set(meta?.unlockedAchievements || []);
      const grid = this.els.achievementsGrid;
      const overlay = this.els.achievementsOverlay;
      if (!grid || !overlay) return;
      const done = unlocked.size;
      const total = ACHIEVEMENTS.length;
      if (this.els.achievementsProgress) {
        this.els.achievementsProgress.textContent = `${done} / ${total} completed`;
      }
      grid.innerHTML = ACHIEVEMENTS.map((def) => {
        const isOn = unlocked.has(def.id);
        const tip = getAchievementTooltipText(def);
        const safeTip = tip.replace(/"/g, "&quot;");
        return `
                <button type="button" class="achievement-icon-btn ${isOn ? "achievement-unlocked" : "achievement-locked"}"
                    role="listitem"
                    data-id="${def.id}"
                    title="${safeTip}"
                    aria-label="${def.title}: ${safeTip}">
                    <span class="achievement-icon-emoji" aria-hidden="true">${def.icon || "\u{1F3C5}"}</span>
                    <span class="achievement-icon-title">${def.title}</span>
                    <span class="achievement-hover-tip">${tip}</span>
                </button>
            `;
      }).join("");
      this._bindAchievementTooltipLayout(grid);
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
    }
    /**
     * Clamp achievement hover tips inside the panel — flip above at bottom rows, shift at sides.
     * @param {HTMLElement} grid
     */
    _bindAchievementTooltipLayout(grid) {
      if (!grid) return;
      const panel = grid.closest(".achievements-panel");
      const resetTip = (tip) => {
        tip.classList.remove("achievement-hover-tip--above");
        tip.style.transform = "translateX(-50%)";
        tip.style.left = "50%";
      };
      const positionTip = (btn) => {
        const tip = btn.querySelector(".achievement-hover-tip");
        if (!tip) return;
        resetTip(tip);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const bounds = (panel || grid).getBoundingClientRect();
            let tipRect = tip.getBoundingClientRect();
            let { shiftX, placement } = computeTooltipPlacement(tipRect, bounds, 10);
            if (placement === "above") {
              tip.classList.add("achievement-hover-tip--above");
              tipRect = tip.getBoundingClientRect();
              const adjusted = computeTooltipPlacement(tipRect, bounds, 10);
              shiftX = adjusted.shiftX;
            }
            if (shiftX !== 0) {
              tip.style.transform = `translateX(calc(-50% + ${shiftX}px))`;
            }
          });
        });
      };
      grid.querySelectorAll(".achievement-icon-btn").forEach((btn) => {
        btn.addEventListener("mouseenter", () => positionTip(btn));
        btn.addEventListener("focus", () => positionTip(btn));
        btn.addEventListener("mouseleave", () => {
          const tip = btn.querySelector(".achievement-hover-tip");
          if (tip) resetTip(tip);
        });
        btn.addEventListener("blur", () => {
          const tip = btn.querySelector(".achievement-hover-tip");
          if (tip) resetTip(tip);
        });
      });
    }
    closeAchievementsPanel() {
      const overlay = this.els.achievementsOverlay;
      if (!overlay) return;
      overlay.style.display = "none";
      overlay.setAttribute("aria-hidden", "true");
    }
    /** @param {import('../systems/audioManager.js').AudioManager} audio */
    bindAudioControls(audio) {
      const sync = () => this.syncAudioVolumeUi(audio);
      const bindSlider = (slider, setter) => {
        if (!slider) return;
        const onInput = () => {
          audio.unlock?.();
          setter(Number(slider.value));
          sync();
        };
        slider.addEventListener("input", onInput);
        slider.addEventListener("change", () => {
          audio.unlock?.();
          audio.playSfx?.("ui");
        });
      };
      bindSlider(this.els.audioMusicSliderChar, (v) => audio.setBgmVolume(v));
      bindSlider(this.els.audioMusicSliderPause, (v) => audio.setBgmVolume(v));
      bindSlider(this.els.audioSfxSliderChar, (v) => audio.setSfxVolume(v));
      bindSlider(this.els.audioSfxSliderPause, (v) => audio.setSfxVolume(v));
      sync();
    }
    /** @param {import('../systems/audioManager.js').AudioManager} audio */
    syncAudioVolumeUi(audio) {
      const bgm = audio.getBgmVolume();
      const sfx = audio.getSfxVolume();
      const apply = (slider, label, value) => {
        if (slider) {
          slider.value = String(value);
          slider.setAttribute("aria-valuenow", String(value));
        }
        if (label) label.textContent = `${value}%`;
      };
      apply(this.els.audioMusicSliderChar, this.els.audioMusicValueChar, bgm);
      apply(this.els.audioMusicSliderPause, this.els.audioMusicValuePause, bgm);
      apply(this.els.audioSfxSliderChar, this.els.audioSfxValueChar, sfx);
      apply(this.els.audioSfxSliderPause, this.els.audioSfxValuePause, sfx);
    }
    /** @deprecated Use syncAudioVolumeUi */
    syncAudioToggleLabels(audio) {
      this.syncAudioVolumeUi(audio);
    }
    showCharacterSelection(onSelect, meta = null) {
      this.els.characterSelection.style.display = "grid";
      this.els.gameOverOverlay.style.display = "none";
      this.els.gameUI.style.display = "none";
      this.els.gameContainer.style.display = "none";
      this.els.characterList.innerHTML = "";
      CHARACTERS.forEach((char, index) => {
        this.els.characterList.appendChild(buildCharacterCard(char, index, meta, onSelect));
      });
      this.characterSelectTooltips.bind(this.els.characterList);
    }
    showGame() {
      this.els.characterSelection.style.display = "none";
      this.els.gameUI.style.display = "flex";
      this.els.gameContainer.style.display = "flex";
    }
    updateAttackRange(range) {
      const size = range * 2;
      this.els.attackRange.style.width = `${size}px`;
      this.els.attackRange.style.height = `${size}px`;
    }
    updateStats(stats, skillList) {
      clampPlayerHp(stats);
      const fmt = (n, dec = 2) => Number(n).toFixed(dec).replace(/\.?0+$/, "");
      const maxHp = Math.max(1, stats.maxHp || 1);
      const displayHp = Math.max(0, Math.floor(stats.hp));
      const hpPct = Math.min(100, Math.max(0, displayHp / maxHp * 100));
      this.els.hpBarFill.style.width = `${hpPct}%`;
      this.els.hpValue.textContent = `${displayHp} / ${maxHp}`;
      this.els.expBarFill.style.width = `${stats.exp / stats.expThreshold * 100}%`;
      this.els.expValue.textContent = `${stats.exp} / ${stats.expThreshold}`;
      this.els.level.textContent = `Lv. ${stats.level}`;
      this.els.damage.textContent = String(stats.physicalDamage);
      this.els.aoe.textContent = String(stats.attackRange);
      this.els.attackSpeed.textContent = fmt(stats.attackSpeed);
      this.els.hpRegen.textContent = String(stats.hpRegen);
      this.els.defence.textContent = String(stats.armour);
      this.els.evade.textContent = `${fmt(stats.evade)}%`;
      this.els.critChance.textContent = `${fmt(stats.critChance)}%`;
      this.els.critMultiplier.textContent = `${stats.critMultiplier}%`;
      syncPlayerSkillLevels(stats.skills, skillList);
      this.updateSkillBar(stats.skills, skillList);
    }
    /** Lightweight HP bar refresh after mid-tick damage (before end-of-tick regen). */
    syncPlayerHp(stats) {
      if (!stats || !this.els.hpBarFill || !this.els.hpValue) return;
      clampPlayerHp(stats);
      const maxHp = Math.max(1, stats.maxHp || 1);
      const displayHp = Math.max(0, Math.floor(stats.hp));
      const pct = Math.min(100, Math.max(0, displayHp / maxHp * 100));
      this.els.hpBarFill.style.width = `${pct}%`;
      this.els.hpValue.textContent = `${displayHp} / ${maxHp}`;
    }
    /** @param {import('../config/characterPassives.js').CharacterPassiveDef|null} passive */
    setCharacterPassive(passive) {
      const btn = this.els.characterPassiveBtn;
      const icon = this.els.characterPassiveIcon;
      const tip = this.els.characterPassiveTip;
      if (!btn || !icon || !tip) return;
      if (!passive) {
        btn.hidden = true;
        tip.innerHTML = "";
        btn.classList.remove("passive-tip-open");
        return;
      }
      btn.hidden = false;
      icon.textContent = passive.icon || "\u2605";
      btn.setAttribute("aria-label", `Passive: ${passive.name}`);
      tip.innerHTML = formatPassiveTooltipHtml(passive);
      if (!btn.dataset.passiveBound) {
        btn.dataset.passiveBound = "1";
        const open = () => btn.classList.add("passive-tip-open");
        const close = () => btn.classList.remove("passive-tip-open");
        btn.addEventListener("mouseenter", open);
        btn.addEventListener("mouseleave", close);
        btn.addEventListener("focus", open);
        btn.addEventListener("blur", close);
      }
    }
    clearCharacterPassive() {
      this.setCharacterPassive(null);
      if (this.els.shieldRow) this.els.shieldRow.hidden = true;
      if (this.els.shieldBarFill) this.els.shieldBarFill.style.width = "0%";
      if (this.els.shieldValue) this.els.shieldValue.textContent = "0 / 0";
    }
    /** @param {{ shield?: number, shieldMax?: number, frenzyActive?: boolean }} state */
    updatePassiveHud(state = {}) {
      const max = state.shieldMax || 0;
      const cur = Math.max(0, Math.floor(state.shield || 0));
      if (this.els.shieldRow) {
        this.els.shieldRow.hidden = max <= 0;
      }
      if (this.els.shieldBarFill && max > 0) {
        this.els.shieldBarFill.style.width = `${Math.min(100, cur / max * 100)}%`;
      }
      if (this.els.shieldValue && max > 0) {
        this.els.shieldValue.textContent = `${cur} / ${max}`;
      }
      this.els.characterPassiveBtn?.classList.toggle("passive-frenzy-active", Boolean(state.frenzyActive));
    }
    /**
     * PoE-style buff icons — depleting dark overlay from top as duration expires.
     * Updates in place so hover tooltips aren't destroyed every frame.
     * @param {Array<{ id: string, name: string, icon: string, description: string, remainingMs: number, remainingRatio: number }>} buffs
     */
    updateBuffBar(buffs = []) {
      const bar = this.els.buffBar;
      if (!bar) return;
      const nextIds = new Set(buffs.map((b) => b.id));
      [...bar.querySelectorAll(".buff-icon")].forEach((el) => {
        if (!nextIds.has(el.dataset.buffId)) el.remove();
      });
      buffs.forEach((b) => {
        let el = bar.querySelector(`.buff-icon[data-buff-id="${b.id}"]`);
        const secs = Number.isFinite(b.remainingMs) ? (b.remainingMs / 1e3).toFixed(1) : "\u221E";
        const cover = Math.max(0, Math.min(100, (1 - b.remainingRatio) * 100));
        if (!el) {
          el = document.createElement("div");
          el.className = "buff-icon";
          el.dataset.buffId = b.id;
          el.innerHTML = `
                    <span class="buff-icon-timer"></span>
                    <span class="buff-icon-glyph"></span>
                    <div class="buff-icon-tip">
                        <strong class="buff-tip-name"></strong>
                        <p class="buff-tip-desc"></p>
                        <span class="buff-tip-time"></span>
                    </div>
                `;
          el.querySelector(".buff-icon-glyph").textContent = b.icon;
          el.querySelector(".buff-tip-name").textContent = b.name;
          el.querySelector(".buff-tip-desc").textContent = b.description;
          bar.appendChild(el);
        }
        const timer = el.querySelector(".buff-icon-timer");
        if (timer) timer.style.height = `${cover}%`;
        const tipTime = el.querySelector(".buff-tip-time");
        if (tipTime) tipTime.textContent = `${secs}s remaining`;
        const tipDesc = el.querySelector(".buff-tip-desc");
        if (tipDesc && tipDesc.textContent !== b.description) {
          tipDesc.textContent = b.description;
        }
      });
    }
    updateSkillBar(skills, skillList) {
      const bar = this.els.skillBar;
      if (!bar) return;
      SKILL_IDS.forEach((id) => {
        const def = SKILL_DEFINITIONS[id];
        const level = skills[id] || 0;
        const maxed = skillList[id]?.level >= skillList[id]?.maxLevel;
        let slot = bar.querySelector(`[data-skill-id="${id}"]`);
        if (!slot) {
          slot = document.createElement("div");
          slot.className = "skill-slot";
          slot.dataset.skillId = id;
          slot.tabIndex = 0;
          slot.innerHTML = `
                    <span class="skill-slot-icon-wrap"></span>
                    <span class="skill-level-badge" hidden></span>
                    <div class="skill-slot-tip" role="tooltip"></div>
                `;
          const open = () => slot.classList.add("skill-tip-open");
          const close = () => slot.classList.remove("skill-tip-open");
          slot.addEventListener("mouseenter", open);
          slot.addEventListener("mouseleave", close);
          slot.addEventListener("focus", open);
          slot.addEventListener("blur", close);
          bar.appendChild(slot);
        }
        slot.className = `skill-slot skill-${def.element} ${level > 0 ? "skill-active" : "skill-locked"} ${maxed ? "skill-maxed" : ""}`;
        const iconWrap = slot.querySelector(".skill-slot-icon-wrap");
        if (iconWrap) {
          iconWrap.innerHTML = SKILL_ICON_HTML[id] || `<span class="skill-icon">${def.icon}</span>`;
        }
        const badge = slot.querySelector(".skill-level-badge");
        if (badge) {
          if (level > 0) {
            badge.hidden = false;
            badge.textContent = String(level);
          } else {
            badge.hidden = true;
          }
        }
        const tip = slot.querySelector(".skill-slot-tip");
        if (tip) tip.innerHTML = formatSkillTooltipHtml(def, level);
      });
    }
    updateTimer(seconds) {
      this.els.timer.textContent = formatTime(seconds);
    }
    updateMeta(kills, difficulty, streak) {
      this.els.kills.textContent = String(kills);
      this.els.difficulty.textContent = String(difficulty);
      if (this.els.streak) {
        this.els.streak.textContent = streak > 1 ? `\xD7${streak}` : "\u2014";
        this.els.streak.classList.toggle("streak-active", streak > 4);
        if (streak > this._lastStreak && streak > 1) {
          this.els.streak.classList.remove("kill-streak-pop");
          void this.els.streak.offsetWidth;
          this.els.streak.classList.add("kill-streak-pop");
        }
        this._lastStreak = streak;
      }
    }
    showPause(show) {
      this.els.pauseOverlay.style.display = show ? "flex" : "none";
      this.els.gameContainer.classList.toggle("game-paused", show);
      if (!show) this.closeAchievementsPanel();
    }
    showGameOver(stats, elapsedSeconds, kills, wave) {
      this.els.gameOverStats.innerHTML = `
            <p>Survived: <strong>${formatTime(elapsedSeconds)}</strong></p>
            <p>Level reached: <strong>${stats.level}</strong></p>
            <p>Wave reached: <strong>${wave}</strong></p>
            <p>Enemies defeated: <strong>${kills}</strong></p>
        `;
      this.els.gameOverOverlay.style.display = "flex";
    }
    hideGameOver() {
      this.els.gameOverOverlay.style.display = "none";
    }
    getCharacterButtons() {
      return this.els.characterList.querySelectorAll(".character-card");
    }
    getPlayerPosition() {
      const anchor = this.els.playerAnchor;
      return {
        x: parseFloat(anchor?.style.left) || 50,
        y: parseFloat(anchor?.style.top) || 50
      };
    }
    /** @param {string} achievementId */
    showAchievementUnlock(achievementId) {
      const def = getAchievementById(achievementId);
      if (!def || !this.els.achievementToast) return;
      const icon = def.icon ? `${def.icon} ` : "\u{1F3C6} ";
      this.els.achievementToast.innerHTML = `${icon}<strong>${def.title}</strong> \u2014 ${def.description}`;
      this.els.achievementToast.classList.add("toast-visible");
      clearTimeout(this._achievementTimer);
      this._achievementTimer = setTimeout(() => {
        this.els.achievementToast.classList.remove("toast-visible");
      }, 3200);
    }
    /** @param {number} wave */
    showWaveAnnouncement(wave) {
      if (!this.els.waveToast || wave <= 0) return;
      if (wave === FINAL_VICTORY_WAVE) {
        this.els.waveToast.textContent = `Wave ${wave} \u2014 The Final Boss approaches!`;
      } else if (wave === MIDPOINT_VICTORY_WAVE) {
        this.els.waveToast.textContent = `Wave ${wave} \u2014 Midpoint Boss approaches!`;
      } else if (MINI_BOSS_WAVES.includes(wave)) {
        this.els.waveToast.textContent = `Wave ${wave} \u2014 Mini Boss approaches!`;
      } else {
        this.els.waveToast.textContent = `Wave ${wave} \u2014 Difficulty rising!`;
      }
      this.els.waveToast.classList.remove("toast-victory", "toast-boss-final");
      this.els.waveToast.classList.add("toast-visible");
      clearTimeout(this._waveTimer);
      this._waveTimer = setTimeout(() => {
        this.els.waveToast.classList.remove("toast-visible");
      }, 2200);
    }
    /** @param {number} wave Mini-boss waves 25 & 75 */
    showMiniBossIncoming(wave) {
      if (!this.els.waveToast) return;
      this.els.waveToast.textContent = `\u26A0\uFE0F Wave ${wave} MINI BOSS \u2014 20\xD7 HP \xB7 Escorts incoming!`;
      this.els.waveToast.classList.remove("toast-victory");
      this.els.waveToast.classList.add("toast-visible", "toast-boss-final");
      clearTimeout(this._waveTimer);
      this._waveTimer = setTimeout(() => {
        this.els.waveToast.classList.remove("toast-visible", "toast-boss-final");
      }, 3600);
    }
    /** @param {number} wave */
    showMidpointVictoryBossIncoming(wave) {
      if (!this.els.waveToast) return;
      this.els.waveToast.textContent = `\u26A0\uFE0F Wave ${wave} MIDPOINT BOSS \u2014 50\xD7 HP \xB7 Army incoming!`;
      this.els.waveToast.classList.remove("toast-victory");
      this.els.waveToast.classList.add("toast-visible", "toast-boss-final");
      clearTimeout(this._waveTimer);
      this._waveTimer = setTimeout(() => {
        this.els.waveToast.classList.remove("toast-visible", "toast-boss-final");
      }, 3800);
    }
    /** @param {number} wave */
    showFinalVictoryBossIncoming(wave) {
      if (!this.els.waveToast) return;
      this.els.waveToast.textContent = `\u26A0\uFE0F Wave ${wave} FINAL BOSS \u2014 50\xD7 HP \xB7 2\xD7 damage \xB7 Army incoming!`;
      this.els.waveToast.classList.remove("toast-victory");
      this.els.waveToast.classList.add("toast-visible", "toast-boss-final");
      clearTimeout(this._waveTimer);
      this._waveTimer = setTimeout(() => {
        this.els.waveToast.classList.remove("toast-visible", "toast-boss-final");
      }, 4200);
    }
    /** @param {string} characterName */
    showFinalVictoryCelebration(characterName) {
      if (!this.els.waveToast) return;
      this.els.waveToast.textContent = `\u{1F3C6} VICTORY! ${characterName} defeated Wave ${FINAL_VICTORY_WAVE}! Campaign complete \u2014 keep fighting!`;
      this.els.waveToast.classList.remove("toast-boss-final");
      this.els.waveToast.classList.add("toast-visible", "toast-victory");
      clearTimeout(this._waveTimer);
      this._waveTimer = setTimeout(() => {
        this.els.waveToast.classList.remove("toast-visible", "toast-victory");
      }, 6500);
    }
    /** @param {number} [x] @param {number} [y] @param {number} [distVw] */
    showTreasureHint(x, y, distVw) {
      if (this.els.waveToast) {
        const rangeNote = Number.isFinite(distVw) ? ` (${Math.round(distVw)} units away)` : "";
        this.els.waveToast.textContent = `\u{1F381} Treasure chest spawned${rangeNote}! Defeat the golden CHEST enemy \u2014 it walks toward you.`;
        this.els.waveToast.classList.add("toast-visible");
        clearTimeout(this._waveTimer);
        this._waveTimer = setTimeout(() => {
          this.els.waveToast.classList.remove("toast-visible");
        }, 4500);
      }
      if (Number.isFinite(x) && Number.isFinite(y) && this.els.gameContainer) {
        this.els.treasurePing?.remove();
        const ping = document.createElement("div");
        ping.className = "treasure-screen-ping";
        ping.style.left = `${x}vw`;
        ping.style.top = `${y}vh`;
        ping.setAttribute("aria-hidden", "true");
        this.els.gameContainer.appendChild(ping);
        this.els.treasurePing = ping;
        clearTimeout(this._treasurePingTimer);
        this._treasurePingTimer = setTimeout(() => {
          ping.remove();
          if (this.els.treasurePing === ping) this.els.treasurePing = null;
        }, 2800);
      }
    }
    /** Brief HUD flash when HP or EXP changes. @param {'hp'|'exp'} type */
    flashHudBar(type) {
      const panel = this.els.gameUI?.querySelector(".stats-panel");
      if (!panel) return;
      const cls = type === "hp" ? "hud-flash-hp" : "hud-flash-exp";
      panel.classList.remove("hud-flash-hp", "hud-flash-exp");
      void panel.offsetWidth;
      panel.classList.add(cls);
      setTimeout(() => panel.classList.remove(cls), 500);
    }
    /** @param {string} itemName @param {string} rarityClass */
    showGearLoot(itemName, rarityClass) {
      if (!this.els.gearLootToast) return;
      this.els.gearLootToast.textContent = `Loot: ${itemName}`;
      this.els.gearLootToast.className = `gear-loot-toast toast-visible ${rarityClass}`;
      clearTimeout(this._gearLootTimer);
      this._gearLootTimer = setTimeout(() => {
        this.els.gearLootToast.classList.remove("toast-visible");
      }, 2200);
    }
  };

  // js/config/runtimeBudget.js
  var RUNTIME_BUDGET = {
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
    maxTransientDomLifetimeMs: 15e3
  };

  // js/systems/runtimeBudget.js
  var RUNTIME_BUDGET_DEFAULTS = {
    effects: RUNTIME_BUDGET.maxEffects,
    classTimers: RUNTIME_BUDGET.maxClassTimers,
    skillImpacts: RUNTIME_BUDGET.maxSkillImpacts,
    enemies: RUNTIME_BUDGET.maxEnemies,
    projectiles: RUNTIME_BUDGET.maxProjectiles
  };
  function getRuntimeBudgets() {
    return {
      maxEffects: RUNTIME_BUDGET.maxEffects,
      maxClassTimers: RUNTIME_BUDGET.maxClassTimers,
      maxSkillImpacts: RUNTIME_BUDGET.maxSkillImpacts,
      maxEnemies: RUNTIME_BUDGET.maxEnemies,
      maxProjectiles: RUNTIME_BUDGET.maxProjectiles,
      projectileSpeedVwPerSec: RUNTIME_BUDGET.enemyProjectileSpeedVwPerSec,
      projectileMaxStepVw: RUNTIME_BUDGET.enemyProjectileMaxStepVw,
      projectileHitRadius: RUNTIME_BUDGET.enemyProjectileHitRadius,
      cosmeticThrottleRatio: RUNTIME_BUDGET.cosmeticThrottleRatio
    };
  }
  function shouldThrottleCosmeticEffects(activeCount, maxEffects, ratio = RUNTIME_BUDGET.cosmeticThrottleRatio) {
    if (maxEffects <= 0) return true;
    return activeCount >= Math.floor(maxEffects * ratio);
  }

  // js/utils/domPool.js
  var DomPool = class {
    /**
     * @param {() => HTMLElement} factory
     * @param {number} [prewarm=0]
     */
    constructor(factory, prewarm = 0) {
      this._factory = factory;
      this._free = [];
      for (let i = 0; i < prewarm; i++) {
        this._free.push(this._prepare(this._factory()));
      }
    }
    /** @param {HTMLElement} el */
    _prepare(el) {
      el.style.display = "none";
      return el;
    }
    /** @returns {HTMLElement} */
    acquire() {
      const el = this._free.pop();
      if (el) {
        el.style.display = "";
        return el;
      }
      return this._factory();
    }
    /** @param {HTMLElement} el */
    release(el) {
      if (!el) return;
      el.style.display = "none";
      this._free.push(el);
    }
    /** @param {HTMLElement} [container] */
    clear(container) {
      if (container) {
        this._free.forEach((el) => {
          if (el.parentElement === container) el.remove();
        });
      }
      this._free = [];
    }
  };

  // js/systems/effects.js
  var EffectManager = class {
    /** @param {HTMLElement} container */
    constructor(container) {
      this.container = container;
      this.activeEffects = [];
      this._classTimers = [];
      const budgets = getRuntimeBudgets();
      this.maxEffects = budgets.maxEffects;
      this._maxClassTimers = budgets.maxClassTimers;
      this._timeScale = 1;
      this._damageNumberBudget = RUNTIME_BUDGET.damageNumberBudgetPerWindow;
      this._damageNumberBudgetWindowStart = 0;
      this._hitEffectPool = new DomPool(() => this._createHitEffectElement(), RUNTIME_BUDGET.poolPrewarm.hitEffects);
      this._expOrbPool = new DomPool(() => this._createExpOrbElement(), RUNTIME_BUDGET.poolPrewarm.expOrbs);
      this._damageNumberPool = new DomPool(
        () => this._createDamageNumberElement(),
        RUNTIME_BUDGET.poolPrewarm.damageNumbers ?? 12
      );
    }
    _createDamageNumberElement() {
      const el = document.createElement("div");
      el.className = "damage-number";
      return el;
    }
    _createHitEffectElement() {
      const el = document.createElement("div");
      el.className = "hit-effect hit-effect-physical particle-25d";
      el.innerHTML = '<span class="particle-25d-face"></span><span class="particle-25d-shadow"></span>';
      return el;
    }
    _createExpOrbElement() {
      const el = document.createElement("div");
      el.className = "world-exp-orb particle-25d";
      el.innerHTML = '<span class="particle-25d-face"></span><span class="particle-25d-shadow"></span>';
      return el;
    }
    /** @param {HTMLElement} el @param {'hit'|'exp'|'damage'} kind */
    _releasePooledElement(el, kind) {
      if (kind === "hit") this._hitEffectPool.release(el);
      else if (kind === "damage") this._damageNumberPool.release(el);
      else this._expOrbPool.release(el);
    }
    /** @param {number} scale — affects VFX lifetime only (sim-time), not spawn rules or caps. */
    setTimeScale(scale) {
      this._timeScale = Math.max(1, scale || 1);
      this._trimEffects();
      this._trimClassTimers();
    }
    _isCosmeticThrottled() {
      return shouldThrottleCosmeticEffects(this.activeEffects.length, this.maxEffects);
    }
    /** Public check for gameplay code that should skip heavy VFX under load. */
    isCosmeticThrottled() {
      return this._isCosmeticThrottled();
    }
    _consumeDamageNumberBudget() {
      const now = Date.now();
      const windowMs = RUNTIME_BUDGET.damageNumberBudgetWindowMs / this._timeScale;
      if (!this._damageNumberBudgetWindowStart || now - this._damageNumberBudgetWindowStart >= windowMs) {
        this._damageNumberBudgetWindowStart = now;
        const base = RUNTIME_BUDGET.damageNumberBudgetPerWindow;
        this._damageNumberBudget = Math.max(4, Math.floor(base / this._timeScale));
      }
      if (this._damageNumberBudget <= 0) return false;
      this._damageNumberBudget -= 1;
      return true;
    }
    /**
     * Register a transient node owned by this manager.
     * @param {HTMLElement} el
     * @param {number} lifetimeMs
     * @returns {HTMLElement}
     */
    _trackEffect(el, lifetimeMs, poolKind = null) {
      this.container.appendChild(el);
      const maxLife = RUNTIME_BUDGET.maxTransientDomLifetimeMs ?? 15e3;
      const scaledMs = Math.min(maxLife, Math.max(80, lifetimeMs / this._timeScale));
      const id = setTimeout(() => {
        if (poolKind) {
          this._releasePooledElement(el, poolKind);
        } else {
          el.remove();
        }
        this.activeEffects = this.activeEffects.filter((e) => e.el !== el);
      }, scaledMs);
      this.activeEffects.push({ el, id, poolKind });
      this._trimEffects();
      return el;
    }
    _trimClassTimers() {
      const cap = this._maxClassTimers ?? 120;
      while (this._classTimers.length > cap) {
        const old = this._classTimers.shift();
        if (!old) break;
        clearTimeout(old.id);
        old.el.classList.remove(old.className);
        old.onDone?.();
      }
    }
    _trimEffects() {
      while (this.activeEffects.length > this.maxEffects) {
        const old = this.activeEffects.shift();
        if (old) {
          clearTimeout(old.id);
          if (old.poolKind) this._releasePooledElement(old.el, old.poolKind);
          else old.el?.remove();
        }
      }
    }
    /** @param {number} x @param {number} y @param {string} type */
    spawnHitEffect(x, y, type = "physical") {
      if (this._isCosmeticThrottled()) return null;
      const el = this._hitEffectPool.acquire();
      el.className = `hit-effect hit-effect-${type} particle-25d`;
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      return this._trackEffect(el, 550, "hit");
    }
    /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 @param {boolean} [enhanced] */
    spawnLightningBolt(x1, y1, x2, y2, enhanced = false) {
      const el = document.createElement("div");
      el.className = enhanced ? "lightning-bolt lightning-bolt-enhanced" : "lightning-bolt";
      const dx = (x2 - x1) * window.innerWidth / 100;
      const dy = (y2 - y1) * window.innerHeight / 100;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      el.style.left = `${x1}vw`;
      el.style.top = `${y1}vh`;
      el.style.width = `${length}px`;
      el.style.transform = `rotate(${angle}deg)`;
      return this._trackEffect(el, enhanced ? 420 : 280);
    }
    /** @param {HTMLElement} enemyEl */
    applyBurnAura(enemyEl) {
      if (!enemyEl.querySelector(".status-burn")) {
        const aura = document.createElement("div");
        aura.className = "status-burn";
        enemyEl.appendChild(aura);
      }
    }
    removeBurnAura(enemyEl) {
      enemyEl.querySelector(".status-burn")?.remove();
    }
    /** @param {HTMLElement} enemyEl */
    applyFrostAura(enemyEl) {
      enemyEl.classList.add("status-frozen");
      const aura = enemyEl.querySelector(".status-frost") || document.createElement("div");
      aura.className = "status-frost";
      if (!aura.parentElement) enemyEl.appendChild(aura);
    }
    /** @param {HTMLElement} enemyEl */
    removeFrostAura(enemyEl) {
      enemyEl.classList.remove("status-frozen");
      enemyEl.querySelector(".status-frost")?.remove();
    }
    /** @param {HTMLElement} playerEl */
    triggerAttackAnimation(playerEl) {
      const sprite = playerEl.querySelector(".player-sprite") || playerEl;
      sprite.classList.remove("player-attacking", "player-melee-attacking");
      void sprite.offsetWidth;
      sprite.classList.add("player-attacking");
      this._trackClassTimeout(sprite, "player-attacking", 240);
    }
    /**
     * Melee lunge toward target — used by melee basic attacks.
     * @param {HTMLElement} playerEl
     * @param {number} fromX @param {number} fromY
     * @param {number} toX @param {number} toY
     */
    triggerMeleeAttackAnimation(playerEl, fromX, fromY, toX, toY) {
      const sprite = playerEl.querySelector(".player-sprite") || playerEl;
      const dx = (toX - fromX) * window.innerWidth / 100;
      const dy = (toY - fromY) * window.innerHeight / 100;
      const len = Math.hypot(dx, dy) || 1;
      const lungePx = 18;
      sprite.style.setProperty("--melee-lunge-x", `${dx / len * lungePx}px`);
      sprite.style.setProperty("--melee-lunge-y", `${dy / len * lungePx}px`);
      sprite.classList.remove("player-attacking", "player-melee-attacking");
      void sprite.offsetWidth;
      sprite.classList.add("player-melee-attacking");
      this._trackClassTimeout(sprite, "player-melee-attacking", 340, () => {
        sprite.style.removeProperty("--melee-lunge-x");
        sprite.style.removeProperty("--melee-lunge-y");
      });
      this.spawnMeleeSwordSlash(fromX, fromY, toX, toY);
    }
    /**
     * Visible sword arc from player to target — readable even with large AoE rings.
     * @param {number} fromX @param {number} fromY @param {number} toX @param {number} toY
     */
    spawnMeleeSwordSlash(fromX, fromY, toX, toY) {
      const iw = window.innerWidth || 1e3;
      const ih = window.innerHeight || 1e3;
      const dx = (toX - fromX) * iw / 100;
      const dy = (toY - fromY) * ih / 100;
      const len = Math.hypot(dx, dy) || 1;
      const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
      const slash = document.createElement("div");
      slash.className = "melee-sword-slash";
      slash.style.left = `${fromX}vw`;
      slash.style.top = `${fromY}vh`;
      slash.style.width = `${Math.min(len * 0.92, iw * 0.22)}px`;
      slash.style.transform = `translate(0, -50%) rotate(${angleDeg}deg)`;
      slash.innerHTML = '<span class="melee-sword-blade" aria-hidden="true"></span><span class="melee-sword-tip" aria-hidden="true"></span>';
      this._trackEffect(slash, 320);
      if (this._isCosmeticThrottled()) return slash;
      const spark = document.createElement("div");
      spark.className = "melee-sword-impact";
      spark.style.left = `${toX}vw`;
      spark.style.top = `${toY}vh`;
      this._trackEffect(spark, 280);
    }
    /** @param {HTMLElement} enemyEl */
    triggerEnemyHitAnimation(enemyEl) {
      enemyEl.classList.remove("enemy-hit");
      void enemyEl.offsetWidth;
      enemyEl.classList.add("enemy-hit");
      this._trackClassTimeout(enemyEl, "enemy-hit", 280);
    }
    /** @param {HTMLElement} enemyEl @param {number} [targetX] @param {number} [targetY] */
    triggerEnemyAttackAnimation(enemyEl, targetX, targetY) {
      const ex = parseFloat(enemyEl.style.left);
      const ey = parseFloat(enemyEl.style.top);
      const tx = targetX ?? ex;
      const ty = targetY ?? ey;
      const dx = (tx - ex) * window.innerWidth / 100;
      const dy = (ty - ey) * window.innerHeight / 100;
      const len = Math.hypot(dx, dy) || 1;
      const lungePx = 10;
      enemyEl.style.setProperty("--lunge-x", `${dx / len * lungePx}px`);
      enemyEl.style.setProperty("--lunge-y", `${dy / len * lungePx}px`);
      enemyEl.classList.remove("enemy-attacking");
      void enemyEl.offsetWidth;
      enemyEl.classList.add("enemy-attacking");
      this._trackClassTimeout(enemyEl, "enemy-attacking", 380, () => {
        enemyEl.style.removeProperty("--lunge-x");
        enemyEl.style.removeProperty("--lunge-y");
      });
    }
    /**
     * Temporary CSS class — tracked separately so VFX trim never removes the host element.
     * @param {HTMLElement} el
     * @param {string} className
     * @param {number} ms
     * @param {(() => void)|null} [onDone]
     */
    _trackClassTimeout(el, className, ms, onDone = null) {
      const scaledMs = Math.max(40, ms / this._timeScale);
      for (let i = this._classTimers.length - 1; i >= 0; i--) {
        const t = this._classTimers[i];
        if (t.el === el && t.className === className) {
          clearTimeout(t.id);
          this._classTimers.splice(i, 1);
        }
      }
      const id = setTimeout(() => {
        el.classList.remove(className);
        onDone?.();
        this._classTimers = this._classTimers.filter((t) => t.id !== id);
      }, scaledMs);
      this._classTimers.push({ el, className, id, onDone });
      this._trimClassTimers();
    }
    spawnDeathExplosion(x, y, type = "normal") {
      const el = document.createElement("div");
      el.className = `death-explosion death-explosion-${type}`;
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      return this._trackEffect(el, 700);
    }
    spawnMegaExplosion(x, y, type) {
      const el = document.createElement("div");
      el.className = `mega-explosion mega-explosion-${type}`;
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      return this._trackEffect(el, 850);
    }
    spawnCastFlash(x, y, type) {
      const el = document.createElement("div");
      el.className = `cast-flash cast-flash-${type}`;
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      return this._trackEffect(el, 480);
    }
    spawnDamageNumber(x, y, damage, isCrit, element = null) {
      if (this._isCosmeticThrottled()) return null;
      if (!this._consumeDamageNumberBudget()) return null;
      if (this.activeEffects.length >= this.maxEffects) return null;
      const el = this._damageNumberPool.acquire();
      let className = "damage-number";
      if (isCrit) className += " damage-crit";
      if (element) className += ` damage-${element}`;
      el.className = className;
      el.textContent = String(damage);
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      el.classList.remove("damage-float");
      this._trackEffect(el, 1100, "damage");
      requestAnimationFrame(() => {
        el.classList.add("damage-float");
      });
      return el;
    }
    /** @param {number} x @param {number} y */
    spawnLootBurst(x, y) {
      const el = document.createElement("div");
      el.className = "world-loot-burst";
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      return this._trackEffect(el, 650);
    }
    /** @param {number} x @param {number} y @param {number} [count] */
    spawnExpOrbs(x, y, count = 3) {
      if (this._isCosmeticThrottled()) {
        count = 1;
      }
      const n = Math.min(count, 4);
      for (let i = 0; i < n; i++) {
        const el = this._expOrbPool.acquire();
        const ox = (Math.random() - 0.5) * 4;
        el.style.left = `${x + ox}vw`;
        el.style.top = `${y}vh`;
        el.style.animationDelay = `${i * 0.06}s`;
        this._trackEffect(el, 750, "exp");
      }
    }
    /** @param {HTMLElement} enemyEl */
    playEnemySpawn(enemyEl) {
      enemyEl.classList.add("enemy-spawn-in");
      this._trackClassTimeout(enemyEl, "enemy-spawn-in", 480);
    }
    /** @param {HTMLElement} rangeEl */
    flashAttackRange(rangeEl) {
      if (!rangeEl) return;
      rangeEl.classList.remove("player-attacking-range");
      void rangeEl.offsetWidth;
      rangeEl.classList.add("player-attacking-range");
      this._trackClassTimeout(rangeEl, "player-attacking-range", 280);
    }
    cleanup() {
      this.activeEffects.forEach(({ el, id, poolKind }) => {
        clearTimeout(id);
        if (poolKind) this._releasePooledElement(el, poolKind);
        else el?.remove();
      });
      this.activeEffects = [];
      this._classTimers.forEach(({ el, className, id, onDone }) => {
        clearTimeout(id);
        el?.classList.remove(className);
        onDone?.();
      });
      this._classTimers = [];
    }
  };

  // js/systems/gameClock.js
  var GAME_SPEED_OPTIONS = [1, 2, 4];
  var MAX_REAL_DELTA_MS = 48;
  var MAX_SIM_ADVANCE_PER_FRAME_MS = 120;
  function initGameClock(state) {
    state.timeScale = 1;
    state.simulatedMs = 0;
    state.lastSimDeltaMs = 0;
    state.lastRealTickMs = Date.now();
  }
  function advanceGameClock(state, realNow = Date.now()) {
    if (state.lastRealTickMs == null) {
      state.lastRealTickMs = realNow;
    }
    const rawDelta = Math.max(0, realNow - state.lastRealTickMs);
    const realDelta = Math.min(rawDelta, MAX_REAL_DELTA_MS);
    state.lastRealTickMs = realNow;
    const scale = state.timeScale ?? 1;
    const simAdvance = Math.min(realDelta * scale, MAX_SIM_ADVANCE_PER_FRAME_MS);
    state.lastSimDeltaMs = simAdvance;
    state.simulatedMs = (state.simulatedMs ?? 0) + simAdvance;
    return state.simulatedMs;
  }
  function getLastSimDeltaMs(state) {
    return state.lastSimDeltaMs ?? 0;
  }
  function getSimulatedMs(state) {
    return state.simulatedMs ?? 0;
  }
  function getElapsedSeconds(state) {
    return Math.floor(getSimulatedMs(state) / 1e3);
  }
  function setTimeScale(state, scale, realNow = Date.now()) {
    if (!GAME_SPEED_OPTIONS.includes(scale)) return;
    advanceGameClock(state, realNow);
    state.timeScale = scale;
  }
  function getProjectedSimMs(state, realNow = Date.now()) {
    const rawDelta = Math.max(0, realNow - (state.lastRealTickMs ?? realNow));
    const realDelta = Math.min(rawDelta, MAX_REAL_DELTA_MS);
    const projected = realDelta * (state.timeScale ?? 1);
    return (state.simulatedMs ?? 0) + Math.min(projected, MAX_SIM_ADVANCE_PER_FRAME_MS);
  }
  function syncClockAfterResume(state) {
    state.lastRealTickMs = Date.now();
  }
  function intervalElapsed(lastSimMs, intervalMs, simNow) {
    return simNow - lastSimMs >= intervalMs;
  }
  function scaleMovementSpeed(state, baseSpeed) {
    return baseSpeed * (state.timeScale ?? 1);
  }
  function scaledRealTimeoutMs(state, durationMs) {
    const scale = state.timeScale ?? 1;
    return Math.max(16, durationMs / scale);
  }
  function scaledEffectLifetimeMs(state, durationMs) {
    const scale = Math.max(1, state?.timeScale ?? 1);
    return Math.max(80, durationMs / scale);
  }

  // js/ui/playerVisuals.js
  function getPlayerSprite(playerEl) {
    return playerEl.querySelector(".player-sprite") || playerEl;
  }
  function flashPlayerSprite(playerEl, className, durationMs) {
    const sprite = getPlayerSprite(playerEl);
    sprite.classList.add(className);
    setTimeout(() => sprite.classList.remove(className), durationMs);
  }
  function shakePlayerAnchor(anchorEl) {
    if (!anchorEl) return;
    anchorEl.classList.remove("player-damage-shake");
    void anchorEl.offsetWidth;
    anchorEl.classList.add("player-damage-shake");
  }

  // js/utils/transientDomRegistry.js
  var DEFAULT_TRANSIENT_DOM_MAX_MS = 15e3;
  var TransientDomRegistry = class {
    /**
     * @param {number} [maxLifetimeMs]
     */
    constructor(maxLifetimeMs = DEFAULT_TRANSIENT_DOM_MAX_MS) {
      this.maxLifetimeMs = Math.max(1e3, maxLifetimeMs);
      this._entries = /* @__PURE__ */ new Map();
    }
    /**
     * @param {HTMLElement} el
     * @param {() => void} [dispose] Optional extra cleanup (e.g. cancelAnimationFrame).
     */
    track(el, dispose) {
      if (!el) return;
      this._entries.set(el, {
        el,
        bornAt: Date.now(),
        dispose: typeof dispose === "function" ? dispose : null
      });
    }
    /** @param {HTMLElement} el */
    untrack(el) {
      if (el) this._entries.delete(el);
    }
    /** @param {number} [now] */
    purgeExpired(now = Date.now()) {
      for (const [el, entry] of [...this._entries]) {
        const expired = now - entry.bornAt >= this.maxLifetimeMs;
        const detached = typeof el.isConnected === "boolean" && !el.isConnected;
        if (expired || detached) {
          this._forceRemove(el, entry);
        }
      }
    }
    clearAll() {
      for (const [el, entry] of [...this._entries]) {
        this._forceRemove(el, entry);
      }
      this._entries.clear();
    }
    /** @returns {number} */
    get size() {
      return this._entries.size;
    }
    /** @param {HTMLElement} el @param {TransientDomEntry} entry */
    _forceRemove(el, entry) {
      try {
        entry.dispose?.();
      } catch {
      }
      try {
        el?.remove();
      } catch {
      }
      this._entries.delete(el);
    }
  };

  // js/utils/projectileCollision.js
  function getEnemyHitRadiusVw(enemy, innerWidth) {
    const sizePx = enemy.typeConfig?.size || enemy.element?.offsetWidth || 40;
    return sizePx / Math.max(innerWidth, 1) * 100 * 0.55;
  }
  function projectilePointHitsEnemy(px, py, enemy, innerWidth, innerHeight, extraRadiusVw = 0) {
    const ex = parseFloat(enemy.element.style.left);
    const ey = parseFloat(enemy.element.style.top);
    const r = getEnemyHitRadiusVw(enemy, innerWidth) + extraRadiusVw;
    const dx = (px - ex) * innerWidth / 100;
    const dy = (py - ey) * innerHeight / 100;
    return Math.hypot(dx, dy) <= r * innerWidth / 100;
  }
  function projectileSegmentHitsEnemy(x0, y0, x1, y1, enemy, innerWidth, innerHeight, extraRadiusVw = 1.2) {
    const ex = parseFloat(enemy.element.style.left);
    const ey = parseFloat(enemy.element.style.top);
    const r = getEnemyHitRadiusVw(enemy, innerWidth) + extraRadiusVw;
    const ax = x0 * innerWidth / 100;
    const ay = y0 * innerHeight / 100;
    const bx = x1 * innerWidth / 100;
    const by = y1 * innerHeight / 100;
    const cx = ex * innerWidth / 100;
    const cy = ey * innerHeight / 100;
    const radiusPx = r * innerWidth / 100;
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 1e-4) {
      return Math.hypot(cx - ax, cy - ay) <= radiusPx;
    }
    const t = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / lenSq));
    const closestX = ax + t * dx;
    const closestY = ay + t * dy;
    return Math.hypot(cx - closestX, cy - closestY) <= radiusPx;
  }
  function hasExhaustedPierce(hitCount, maxPierce) {
    if (maxPierce == null || maxPierce === Infinity) return false;
    return hitCount > maxPierce;
  }

  // js/systems/sparkProjectiles.js
  var SPARK_FRAME_MS = 1e3 / 60;
  function mapEnemiesForRadiusQuery(enemies) {
    return enemies.map((e) => ({
      id: e.id,
      x: parseFloat(e.element.style.left),
      y: parseFloat(e.element.style.top),
      hp: e.stats?.hp ?? 0,
      ref: e
    }));
  }
  function tickSparkProjectiles(sparks, ctx) {
    const {
      simNow,
      simDeltaMs,
      gamePaused,
      gameOver,
      enemies,
      innerWidth,
      innerHeight,
      onHit
    } = ctx;
    if (gamePaused || gameOver || sparks.length === 0) {
      return sparks.filter((spark) => {
        if (gamePaused || gameOver) {
          spark.el?.remove();
          return false;
        }
        return true;
      });
    }
    const stepScale = Math.max(0.25, simDeltaMs / SPARK_FRAME_MS);
    const maxHits = RUNTIME_BUDGET.maxSparkHitApplicationsPerTick ?? 12;
    let hitsThisTick = 0;
    const remaining = [];
    for (const spark of sparks) {
      if (simNow >= spark.expires) {
        spark.el.remove();
        continue;
      }
      if (Math.random() < spark.wanderChance) {
        const turn = (Math.random() - 0.5) * spark.wanderTurn;
        const speed = Math.hypot(spark.vx, spark.vy) || 0.42;
        const angle = Math.atan2(spark.vy, spark.vx) + turn;
        spark.vx = Math.cos(angle) * speed;
        spark.vy = Math.sin(angle) * speed;
      }
      const prevBx = spark.bx;
      const prevBy = spark.by;
      spark.bx += spark.vx * stepScale;
      spark.by += spark.vy * stepScale;
      spark.el.style.left = `${spark.bx}vw`;
      spark.el.style.top = `${spark.by}vh`;
      const marginVw = (spark.hitRadiusVw ?? 3.2) + 3;
      const midX = (prevBx + spark.bx) * 0.5;
      const midY = (prevBy + spark.by) * 0.5;
      const radiusPx = marginVw * innerWidth / 100;
      const candidates = findEnemiesInRadius(
        mapEnemiesForRadiusQuery(enemies),
        midX,
        midY,
        radiusPx,
        innerWidth,
        innerHeight
      );
      let removeSpark = false;
      for (const target of candidates) {
        if (hitsThisTick >= maxHits) break;
        const enemy = target.ref;
        if (!enemy || enemy.stats.hp <= 0 || spark.hitIds.has(enemy.id)) continue;
        const hitRadius = spark.hitRadiusVw ?? 3.2;
        const hit = projectileSegmentHitsEnemy(
          prevBx,
          prevBy,
          spark.bx,
          spark.by,
          enemy,
          innerWidth,
          innerHeight,
          hitRadius
        ) || projectilePointHitsEnemy(
          spark.bx,
          spark.by,
          enemy,
          innerWidth,
          innerHeight,
          hitRadius
        );
        if (!hit) continue;
        spark.hitIds.add(enemy.id);
        onHit(enemy, spark.damage);
        hitsThisTick += 1;
        if (hasExhaustedPierce(spark.hitIds.size, spark.maxPierce ?? 1)) {
          spark.el.remove();
          removeSpark = true;
          break;
        }
      }
      if (!removeSpark) remaining.push(spark);
    }
    return remaining;
  }

  // js/systems/skillExecutor.js
  var SkillExecutor = class {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
      this.game = game;
      this._rfLastTick = 0;
      this._rfLastSfx = 0;
      this._activeSparks = [];
      this._transientDom = new TransientDomRegistry(RUNTIME_BUDGET.maxTransientDomLifetimeMs);
    }
    /**
     * Tracks a skill projectile DOM node with a hard lifetime cap and safe disposal.
     * @param {HTMLElement} el
     * @param {import('../game/gameState.js').GameState} state
     */
    _trackSkillProjectile(el, state) {
      let animId = null;
      const dispose = () => {
        if (animId != null) {
          state.cancelAnimation(animId);
          animId = null;
        }
        this._transientDom.untrack(el);
        el.remove();
      };
      this._transientDom.track(el, dispose);
      return {
        setAnimId: (id) => {
          animId = id;
        },
        dispose
      };
    }
    /** @param {number} now @param {number} [simDeltaMs] */
    tick(now, simDeltaMs = 0) {
      const s = this.game.state;
      if (s.gamePaused || s.gameOver) return;
      this._transientDom.purgeExpired();
      const rfLevel = s.skillList.righteousFire?.level || 0;
      if (rfLevel > 0) this._tickRighteousFire(now, rfLevel);
      this._tickSparks(now, simDeltaMs);
      const illusionLevel = s.skillList.illusion?.level || 0;
      if (illusionLevel > 0) {
        this.game.illusionClone?.trySummon(illusionLevel, now);
      }
      SKILL_IDS.forEach((skillId) => {
        const level = s.skillList[skillId]?.level || 0;
        if (level <= 0) return;
        if (skillId === "righteousFire" || skillId === "illusion") return;
        const cfg = getSkillConfigFor(skillId, level);
        const lastCast = s.skillCooldowns[skillId] || 0;
        if (now - lastCast < cfg.cooldown) return;
        const { x: px, y: py } = this.game.ui.getPlayerPosition();
        const hasTarget = s.enemies.some((e) => e.stats.hp > 0);
        if (skillId === "iceNova") {
          s.skillCooldowns[skillId] = now;
          this.game.audio?.playSkillSfx?.("iceNova");
          this.castIceNova(px, py, level);
        } else if (skillId === "hammerSweep") {
          if (!hasTarget) return;
          s.skillCooldowns[skillId] = now;
          this.game.audio?.playSkillSfx?.("hammerSweep");
          this.castHammerSweep(px, py, level);
        } else if (skillId === "healingWave") {
          if (s.stats.hp < s.stats.maxHp * 0.92) {
            s.skillCooldowns[skillId] = now;
            this.game.audio?.playSkillSfx?.("healingWave");
            this.castHealingWave(px, py, level);
          }
        } else if (skillId === "spark") {
          s.skillCooldowns[skillId] = now;
          this.game.audio?.playSkillSfx?.("spark");
          this.castSpark(px, py, level, now);
        } else if (hasTarget) {
          s.skillCooldowns[skillId] = now;
          this.game.audio?.playSkillSfx?.(skillId);
          if (skillId === "fireball") this.castFireball(px, py, level);
          else if (skillId === "lightningArc") this.castLightningArc(px, py, level);
          else if (skillId === "poisonBottle") this.castPoisonBottle(px, py, level);
          else if (skillId === "frostbolt") this.castFrostbolt(px, py, level);
          else if (skillId === "poisonDagger") this.castPoisonDagger(px, py, level);
          else if (skillId === "throwSpear") this.castThrowSpear(px, py, level);
        }
      });
    }
    castFireball(px, py, level) {
      const s = this.game.state;
      const cfg = getFireballConfig(level);
      const nearest = this._findNearestEnemy(px, py, cfg.castRange);
      if (!nearest) return;
      this.game.skillRanges?.flash("fireball");
      this.game.effects.spawnCastFlash(px, py, "fire");
      const el = document.createElement("div");
      el.className = "skill-projectile skill-fireball";
      el.innerHTML = '<div class="skill-fireball-core"></div><div class="skill-fireball-trail"></div>';
      el.style.left = `${px}vw`;
      el.style.top = `${py}vh`;
      this.game.ui.els.gameContainer.appendChild(el);
      const tx = parseFloat(nearest.element.style.left);
      const ty = parseFloat(nearest.element.style.top);
      const angle = Math.atan2(ty - py, tx - px);
      let bx = px;
      let by = py;
      const tracker = this._trackSkillProjectile(el, s);
      let lastAnimId = null;
      const animate = () => {
        if (s.gamePaused || s.gameOver) {
          tracker.dispose();
          return;
        }
        bx += Math.cos(angle) * cfg.projectileSpeed;
        by += Math.sin(angle) * cfg.projectileSpeed;
        el.style.left = `${bx}vw`;
        el.style.top = `${by}vh`;
        let hit = null;
        for (const enemy of s.enemies) {
          if (enemy.stats.hp <= 0) continue;
          const ex = parseFloat(enemy.element.style.left);
          const ey = parseFloat(enemy.element.style.top);
          const ew = enemy.element.offsetWidth * 100 / window.innerWidth;
          const eh = enemy.element.offsetHeight * 100 / window.innerHeight;
          if (Math.abs(bx - ex) < ew / 2 && Math.abs(by - ey) < eh / 2) {
            hit = enemy;
            break;
          }
        }
        if (hit || distanceVw(bx, by, tx, ty, window.innerWidth, window.innerHeight) < 15) {
          tracker.dispose();
          this._fireballExplode(bx, by, level, hit);
          return;
        }
        const animId = requestAnimationFrame(animate);
        tracker.setAnimId(animId);
        s.trackAnimation(animId, lastAnimId);
        lastAnimId = animId;
      };
      animate();
    }
    _fireballExplode(bx, by, level, directHit) {
      const s = this.game.state;
      const base = s.stats.physicalDamage;
      const cfg = getFireballConfig(level);
      const directDmg = computeSkillDamage(base, "fireball", level);
      const splashDmg = computeSplashDamage(base, level);
      const burnTotal = computeBurnTotal(base, level);
      this.game.skillRanges?.showImpactArea(bx, by, cfg.splashRadius, "fire", 800);
      this.game.effects.spawnMegaExplosion(bx, by, "fire");
      this.game.effects.spawnHitEffect(bx, by, "fire");
      const hitSet = /* @__PURE__ */ new Set();
      if (directHit?.stats.hp > 0) {
        this.game._dealSkillDamageToEnemy(directHit, directDmg, "fire", false, "fireball");
        this.game._applyBurn(directHit, burnTotal, cfg.burnDuration);
        hitSet.add(directHit.id);
      }
      findEnemiesInRadius(
        s.enemies.map((e) => ({
          id: e.id,
          x: parseFloat(e.element.style.left),
          y: parseFloat(e.element.style.top),
          hp: e.stats.hp,
          ref: e
        })),
        bx,
        by,
        cfg.splashRadius,
        window.innerWidth,
        window.innerHeight
      ).forEach((t) => {
        if (hitSet.has(t.id) || !t.ref) return;
        this.game._dealSkillDamageToEnemy(t.ref, splashDmg, "fire", false, "fireball");
        this.game._applyBurn(t.ref, Math.floor(burnTotal * 0.5), cfg.burnDuration);
      });
    }
    castIceNova(px, py, level) {
      const s = this.game.state;
      const cfg = getIceNovaConfig(level);
      const damage = computeSkillDamage(s.stats.physicalDamage, "iceNova", level);
      this.game.skillRanges?.flash("iceNova");
      this.game.skillRanges?.showImpactArea(px, py, cfg.radius, "cold", 900);
      const ring = document.createElement("div");
      ring.className = "skill-ice-nova skill-ice-nova-enhanced";
      ring.style.left = `${px}vw`;
      ring.style.top = `${py}vh`;
      ring.style.width = `${cfg.radius * 2}px`;
      ring.style.height = `${cfg.radius * 2}px`;
      this.game.ui.els.gameContainer.appendChild(ring);
      s.trackTimeout(setTimeout(() => ring.remove(), 900));
      for (let i = 0; i < 8; i++) {
        const shard = document.createElement("div");
        shard.className = "ice-nova-shard";
        const a = i / 8 * Math.PI * 2;
        shard.style.left = `${px + Math.cos(a) * cfg.radius / window.innerWidth * 100 * 0.8}vw`;
        shard.style.top = `${py + Math.sin(a) * cfg.radius / window.innerHeight * 100 * 0.8}vh`;
        this.game.ui.els.gameContainer.appendChild(shard);
        s.trackTimeout(setTimeout(() => shard.remove(), 700));
      }
      this.game.effects.spawnCastFlash(px, py, "cold");
      flashPlayerSprite(this.game.ui.els.player, "player-casting-nova", 450);
      s.enemies.forEach((enemy) => {
        if (enemy.stats.hp <= 0) return;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        if (distanceVw(px, py, ex, ey, window.innerWidth, window.innerHeight) > cfg.radius) return;
        this.game._dealSkillDamageToEnemy(enemy, damage, "cold", false, "iceNova");
        this.game._applySlow(enemy, cfg.slowPercent, cfg.slowDuration);
        if (cfg.freezeDuration > 0) this.game._applyFreeze(enemy, cfg.freezeDuration);
      });
    }
    castLightningArc(px, py, level) {
      const s = this.game.state;
      const cfg = getLightningArcConfig(level);
      const damage = computeSkillDamage(s.stats.physicalDamage, "lightningArc", level);
      const enemyData = s.enemies.map((e) => ({
        id: e.id,
        x: parseFloat(e.element.style.left),
        y: parseFloat(e.element.style.top),
        hp: e.stats.hp,
        ref: e
      }));
      const first = findChainTargets(enemyData, px, py, null, 1, cfg.castRange, window.innerWidth, window.innerHeight);
      if (first.length === 0) return;
      this.game.skillRanges?.flash("lightningArc");
      this.game.effects.spawnCastFlash(px, py, "lightning");
      let prevX = px, prevY = py, excludeId = null;
      const chain = [];
      for (let i = 0; i <= cfg.chainCount; i++) {
        const targets = findChainTargets(enemyData, prevX, prevY, excludeId, 1, cfg.chainRange, window.innerWidth, window.innerHeight);
        if (!targets.length) break;
        const t = targets[0];
        chain.push(t);
        this.game.effects.spawnLightningBolt(prevX, prevY, t.x, t.y, true);
        prevX = t.x;
        prevY = t.y;
        excludeId = t.id;
      }
      chain.forEach((t) => {
        if (t.ref) this.game._dealSkillDamageToEnemy(t.ref, damage, "lightning", false, "lightningArc");
      });
      if (chain.length) this.game.effects.spawnMegaExplosion(chain[0].x, chain[0].y, "lightning");
    }
    castPoisonBottle(px, py, level) {
      const s = this.game.state;
      const cfg = getPoisonBottleConfig(level);
      const nearest = this._findNearestEnemy(px, py, cfg.castRange);
      if (!nearest) return;
      this.game.skillRanges?.flash("poisonBottle");
      this.game.effects.spawnCastFlash(px, py, "chaos");
      const el = document.createElement("div");
      el.className = "skill-projectile skill-poison-bottle skill-chaos-bottle";
      el.innerHTML = '<div class="poison-bottle-icon chaos-bottle-icon"></div>';
      el.style.left = `${px}vw`;
      el.style.top = `${py}vh`;
      this.game.ui.els.gameContainer.appendChild(el);
      const tx = parseFloat(nearest.element.style.left);
      const ty = parseFloat(nearest.element.style.top);
      const angle = Math.atan2(ty - py, tx - px);
      let bx = px, by = py;
      const tracker = this._trackSkillProjectile(el, s);
      let lastAnimId = null;
      const animate = () => {
        if (s.gamePaused || s.gameOver) {
          tracker.dispose();
          return;
        }
        bx += Math.cos(angle) * cfg.projectileSpeed;
        by += Math.sin(angle) * cfg.projectileSpeed;
        el.style.left = `${bx}vw`;
        el.style.top = `${by}vh`;
        el.style.transform = `translate(-50%, -50%) rotate(${Date.now() / 8 % 360}deg)`;
        let hit = null;
        for (const enemy of s.enemies) {
          if (enemy.stats.hp <= 0) continue;
          const ex = parseFloat(enemy.element.style.left);
          const ey = parseFloat(enemy.element.style.top);
          const ew = enemy.element.offsetWidth * 100 / window.innerWidth;
          const eh = enemy.element.offsetHeight * 100 / window.innerHeight;
          if (Math.abs(bx - ex) < ew / 2 && Math.abs(by - ey) < eh / 2) {
            hit = enemy;
            break;
          }
        }
        if (hit || distanceVw(bx, by, tx, ty, window.innerWidth, window.innerHeight) < 12) {
          tracker.dispose();
          this._poisonShatter(bx, by, level, hit);
          return;
        }
        const animId = requestAnimationFrame(animate);
        tracker.setAnimId(animId);
        s.trackAnimation(animId, lastAnimId);
        lastAnimId = animId;
      };
      animate();
    }
    _poisonShatter(bx, by, level, directHit) {
      const s = this.game.state;
      const cfg = getPoisonBottleConfig(level);
      const impactDmg = computeSkillDamage(s.stats.physicalDamage, "poisonBottle", level);
      this.game.effects.spawnMegaExplosion(bx, by, "chaos");
      if (directHit?.stats.hp > 0) {
        this.game._dealSkillDamageToEnemy(directHit, impactDmg, "chaos", false, "poisonBottle");
      }
      this.game.poisonPools.createPool(bx, by, level, s.stats.physicalDamage);
    }
    castHealingWave(px, py, level) {
      const s = this.game.state;
      const cfg = getHealingWaveConfig(level);
      const heal = Math.max(1, Math.floor(s.stats.maxHp * cfg.healPercent / 100));
      s.stats.hp = Math.min(s.stats.maxHp, s.stats.hp + heal);
      this.game.effects.spawnCastFlash(px, py, "heal");
      this.game.effects.spawnDamageNumber(px, py, heal, false, "heal");
      flashPlayerSprite(this.game.ui.els.player, "buff");
    }
    castFrostbolt(px, py, level) {
      const s = this.game.state;
      const cfg = getFrostboltConfig(level);
      const originX = Number.isFinite(px) ? px : 50;
      const originY = Number.isFinite(py) ? py : 50;
      const nearest = this._findNearestEnemy(originX, originY, cfg.castRange);
      if (!nearest) return;
      this.game.skillRanges?.flash("frostbolt");
      this.game.effects.spawnCastFlash(originX, originY, "cold");
      const el = document.createElement("div");
      el.className = "skill-projectile skill-frostbolt particle-25d skill-frostbolt-fly";
      el.innerHTML = '<span class="particle-25d-face"></span><span class="frostbolt-trail" aria-hidden="true"></span>';
      el.style.position = "absolute";
      el.style.left = `${originX}vw`;
      el.style.top = `${originY}vh`;
      this.game.ui.els.gameContainer.appendChild(el);
      const tx = parseFloat(nearest.element.style.left);
      const ty = parseFloat(nearest.element.style.top);
      const iw = window.innerWidth || 1;
      const ih = window.innerHeight || 1;
      const angle = Math.atan2((ty - originY) * ih / 100, (tx - originX) * iw / 100);
      el.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI}deg)`;
      const speedPx = cfg.projectileSpeed * iw / 100;
      const maxTravelPx = cfg.maxTravel * iw / 100;
      let bx = originX;
      let by = originY;
      let prevBx = originX;
      let prevBy = originY;
      let traveledPx = 0;
      const hitIds = /* @__PURE__ */ new Set();
      const tracker = this._trackSkillProjectile(el, s);
      let lastAnimId = null;
      const damage = computeSkillDamage(s.stats.physicalDamage, "frostbolt", level);
      const pierceRadius = 2.2 + level * 0.2;
      const maxPierce = cfg.maxPierce ?? Infinity;
      const animate = () => {
        if (s.gamePaused || s.gameOver) {
          tracker.dispose();
          return;
        }
        prevBx = bx;
        prevBy = by;
        const stepXvw = Math.cos(angle) * speedPx * 100 / iw;
        const stepYvh = Math.sin(angle) * speedPx * 100 / ih;
        bx += stepXvw;
        by += stepYvh;
        traveledPx += speedPx;
        el.style.left = `${bx}vw`;
        el.style.top = `${by}vh`;
        let exhausted = false;
        for (const enemy of s.enemies) {
          if (enemy.stats.hp <= 0 || hitIds.has(enemy.id)) continue;
          const hit = projectileSegmentHitsEnemy(
            prevBx,
            prevBy,
            bx,
            by,
            enemy,
            iw,
            ih,
            pierceRadius
          ) || projectilePointHitsEnemy(bx, by, enemy, iw, ih, pierceRadius);
          if (hit) {
            hitIds.add(enemy.id);
            this.game._dealSkillDamageToEnemy(enemy, damage, "cold", false, "frostbolt");
            this.game._applySlow(enemy, 12 + level * 3, 1500);
            if (hasExhaustedPierce(hitIds.size, maxPierce)) {
              exhausted = true;
              break;
            }
          }
        }
        const offscreen = bx < -8 || bx > 108 || by < -8 || by > 108;
        if (exhausted || traveledPx >= maxTravelPx || offscreen) {
          tracker.dispose();
          return;
        }
        const animId = requestAnimationFrame(animate);
        tracker.setAnimId(animId);
        s.trackAnimation(animId, lastAnimId);
        lastAnimId = animId;
      };
      animate();
    }
    /**
     * Chaos dagger that forks into angled secondary blades on first contact.
     * @param {number} px @param {number} py @param {number} level
     */
    castPoisonDagger(px, py, level) {
      const s = this.game.state;
      const cfg = getPoisonDaggerConfig(level);
      const nearest = this._findNearestEnemy(px, py, cfg.castRange);
      if (!nearest) return;
      this.game.skillRanges?.flash("poisonDagger");
      this.game.effects.spawnCastFlash(px, py, "chaos");
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const tx = parseFloat(nearest.element.style.left);
      const ty = parseFloat(nearest.element.style.top);
      const angle = Math.atan2((ty - py) * ih / 100, (tx - px) * iw / 100);
      const damage = computeSkillDamage(s.stats.physicalDamage, "poisonDagger", level);
      this._launchChaosDagger({
        px,
        py,
        angle,
        level,
        damage,
        maxTravelVw: cfg.maxTravel,
        speed: cfg.projectileSpeed,
        hitRadiusVw: cfg.hitRadiusVw,
        canFork: true
      });
    }
    /**
     * @param {{ px:number, py:number, angle:number, level:number, damage:number,
     *   maxTravelVw:number, speed:number, hitRadiusVw:number, canFork:boolean,
     *   sharedHitIds?: Set<string> }} opts
     */
    _launchChaosDagger(opts) {
      const s = this.game.state;
      const {
        px,
        py,
        angle,
        level,
        damage,
        maxTravelVw,
        speed,
        hitRadiusVw,
        canFork
      } = opts;
      const sharedHitIds = opts.sharedHitIds || /* @__PURE__ */ new Set();
      const cfg = getPoisonDaggerConfig(level);
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const el = document.createElement("div");
      el.className = "skill-projectile skill-poison-dagger particle-25d skill-poison-dagger-fly";
      el.innerHTML = '<span class="particle-25d-face"></span><span class="dagger-trail" aria-hidden="true"></span>';
      el.style.left = `${px}vw`;
      el.style.top = `${py}vh`;
      el.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI}deg)`;
      this.game.ui.els.gameContainer.appendChild(el);
      let bx = px;
      let by = py;
      let prevBx = px;
      let prevBy = py;
      let traveled = 0;
      const tracker = this._trackSkillProjectile(el, s);
      let lastAnimId = null;
      let forked = false;
      const animate = () => {
        if (s.gamePaused || s.gameOver) {
          tracker.dispose();
          return;
        }
        prevBx = bx;
        prevBy = by;
        bx += Math.cos(angle) * speed;
        by += Math.sin(angle) * speed;
        traveled += speed;
        el.style.left = `${bx}vw`;
        el.style.top = `${by}vh`;
        for (const enemy of s.enemies) {
          if (enemy.stats.hp <= 0 || sharedHitIds.has(enemy.id)) continue;
          const hit = projectileSegmentHitsEnemy(
            prevBx,
            prevBy,
            bx,
            by,
            enemy,
            iw,
            ih,
            hitRadiusVw
          ) || projectilePointHitsEnemy(bx, by, enemy, iw, ih, hitRadiusVw);
          if (!hit) continue;
          sharedHitIds.add(enemy.id);
          this.game._dealSkillDamageToEnemy(enemy, damage, "chaos", false, "poisonDagger");
          this.game.effects.spawnHitEffect(bx, by, "chaos");
          if (canFork && !forked) {
            forked = true;
            const forkDmg = computePoisonDaggerForkDamage(s.stats.physicalDamage, level);
            const count = cfg.forkCount;
            const spread = cfg.forkSpreadRad;
            for (let i = 0; i < count; i++) {
              const t = count === 1 ? 0 : i / (count - 1) * 2 - 1;
              const forkAngle = angle + t * spread;
              this._launchChaosDagger({
                px: bx,
                py: by,
                angle: forkAngle,
                level,
                damage: forkDmg,
                maxTravelVw: cfg.forkTravel,
                speed: speed * 0.92,
                hitRadiusVw,
                canFork: false,
                sharedHitIds
              });
            }
          }
        }
        const offscreen = bx < -8 || bx > 108 || by < -8 || by > 108;
        if (traveled >= maxTravelVw || offscreen) {
          tracker.dispose();
          return;
        }
        const animId = requestAnimationFrame(animate);
        tracker.setAnimId(animId);
        s.trackAnimation(animId, lastAnimId);
        lastAnimId = animId;
      };
      animate();
    }
    /** Physical self AoE hammer smash. */
    castHammerSweep(px, py, level) {
      const s = this.game.state;
      const cfg = getHammerSweepConfig(level);
      const damage = computeSkillDamage(s.stats.physicalDamage, "hammerSweep", level);
      this.game.skillRanges?.flash("hammerSweep");
      this.game.skillRanges?.showImpactArea(px, py, cfg.radius, "physical", 700);
      this.game.effects.spawnCastFlash(px, py, "physical");
      flashPlayerSprite(this.game.ui.els.player, "player-casting-nova", 400);
      const ring = document.createElement("div");
      ring.className = "skill-hammer-sweep";
      ring.style.left = `${px}vw`;
      ring.style.top = `${py}vh`;
      ring.style.width = `${cfg.radius * 2}px`;
      ring.style.height = `${cfg.radius * 2}px`;
      ring.innerHTML = '<span class="hammer-sweep-head" aria-hidden="true"></span>';
      this.game.ui.els.gameContainer.appendChild(ring);
      s.trackTimeout(setTimeout(() => ring.remove(), 700));
      for (let i = 0; i < 6; i++) {
        const shard = document.createElement("div");
        shard.className = "hammer-sweep-shard";
        const a = i / 6 * Math.PI * 2;
        const rFrac = 0.7;
        shard.style.left = `${px + Math.cos(a) * cfg.radius / window.innerWidth * 100 * rFrac}vw`;
        shard.style.top = `${py + Math.sin(a) * cfg.radius / window.innerHeight * 100 * rFrac}vh`;
        this.game.ui.els.gameContainer.appendChild(shard);
        s.trackTimeout(setTimeout(() => shard.remove(), 550));
      }
      s.enemies.forEach((enemy) => {
        if (enemy.stats.hp <= 0) return;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        if (distanceVw(px, py, ex, ey, window.innerWidth, window.innerHeight) > cfg.radius) return;
        this.game._dealSkillDamageToEnemy(enemy, damage, "physical", false, "hammerSweep");
        this.game.effects.spawnHitEffect(ex, ey, "physical");
      });
    }
    /** Line-pierce spear — every enemy on the flight path is hit once. */
    castThrowSpear(px, py, level) {
      const s = this.game.state;
      const cfg = getThrowSpearConfig(level);
      const nearest = this._findNearestEnemy(px, py, cfg.castRange);
      if (!nearest) return;
      this.game.skillRanges?.flash("throwSpear");
      this.game.effects.spawnCastFlash(px, py, "physical");
      const el = document.createElement("div");
      el.className = "skill-projectile skill-throw-spear particle-25d skill-throw-spear-fly";
      el.innerHTML = '<span class="particle-25d-face"></span><span class="spear-trail" aria-hidden="true"></span>';
      el.style.left = `${px}vw`;
      el.style.top = `${py}vh`;
      this.game.ui.els.gameContainer.appendChild(el);
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const tx = parseFloat(nearest.element.style.left);
      const ty = parseFloat(nearest.element.style.top);
      const angle = Math.atan2((ty - py) * ih / 100, (tx - px) * iw / 100);
      el.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI + 90}deg)`;
      const speedPx = cfg.projectileSpeed * iw / 100;
      const maxTravelPx = cfg.maxTravel * iw / 100;
      let bx = px;
      let by = py;
      let prevBx = px;
      let prevBy = py;
      let traveledPx = 0;
      const hitIds = /* @__PURE__ */ new Set();
      const tracker = this._trackSkillProjectile(el, s);
      let lastAnimId = null;
      const damage = computeSkillDamage(s.stats.physicalDamage, "throwSpear", level);
      const maxPierce = cfg.maxPierce ?? 2;
      const animate = () => {
        if (s.gamePaused || s.gameOver) {
          tracker.dispose();
          return;
        }
        prevBx = bx;
        prevBy = by;
        const stepXvw = Math.cos(angle) * speedPx * 100 / iw;
        const stepYvh = Math.sin(angle) * speedPx * 100 / ih;
        bx += stepXvw;
        by += stepYvh;
        traveledPx += speedPx;
        el.style.left = `${bx}vw`;
        el.style.top = `${by}vh`;
        let exhausted = false;
        for (const enemy of s.enemies) {
          if (enemy.stats.hp <= 0 || hitIds.has(enemy.id)) continue;
          const hit = projectileSegmentHitsEnemy(
            prevBx,
            prevBy,
            bx,
            by,
            enemy,
            iw,
            ih,
            cfg.hitRadiusVw
          ) || projectilePointHitsEnemy(bx, by, enemy, iw, ih, cfg.hitRadiusVw);
          if (hit) {
            hitIds.add(enemy.id);
            this.game._dealSkillDamageToEnemy(enemy, damage, "physical", false, "throwSpear");
            this.game.effects.spawnHitEffect(
              parseFloat(enemy.element.style.left),
              parseFloat(enemy.element.style.top),
              "physical"
            );
            if (hasExhaustedPierce(hitIds.size, maxPierce)) {
              exhausted = true;
              break;
            }
          }
        }
        const offscreen = bx < -8 || bx > 108 || by < -8 || by > 108;
        if (exhausted || traveledPx >= maxTravelPx || offscreen) {
          tracker.dispose();
          return;
        }
        const animId = requestAnimationFrame(animate);
        tracker.setAnimId(animId);
        s.trackAnimation(animId, lastAnimId);
        lastAnimId = animId;
      };
      animate();
    }
    _tickRighteousFire(now, level) {
      const s = this.game.state;
      const cfg = getRighteousFireConfig(level);
      if (now - this._rfLastTick < cfg.tickInterval) return;
      this._rfLastTick = now;
      const { x: px, y: py } = this.game.ui.getPlayerPosition();
      const damage = computeSkillDamage(s.stats.physicalDamage, "righteousFire", level);
      this.game.skillRanges?.flash("righteousFire");
      this.game.effects.spawnCastFlash(px, py, "fire");
      if (now - this._rfLastSfx >= 2e3) {
        this._rfLastSfx = now;
        this.game.audio?.playSkillSfx?.("righteousFire");
      }
      const aura = document.createElement("div");
      aura.className = "skill-righteous-fire-aura";
      aura.style.left = `${px}vw`;
      aura.style.top = `${py}vh`;
      aura.style.width = `${cfg.radius * 2}px`;
      aura.style.height = `${cfg.radius * 2}px`;
      this.game.ui.els.gameContainer.appendChild(aura);
      s.trackTimeout(setTimeout(() => aura.remove(), cfg.tickInterval));
      s.enemies.forEach((enemy) => {
        if (enemy.stats.hp <= 0) return;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        if (distanceVw(px, py, ex, ey, window.innerWidth, window.innerHeight) <= cfg.radius) {
          this.game._dealSkillDamageToEnemy(enemy, damage, "fire", false, "righteousFire");
          this.game._applyBurn(enemy, Math.floor(damage * 0.4), 2e3);
        }
      });
    }
    castSpark(px, py, level, simNow = getProjectedSimMs(this.game.state)) {
      const s = this.game.state;
      const cfg = getSparkConfig(level);
      const damage = computeSkillDamage(s.stats.physicalDamage, "spark", level);
      const iw = window.innerWidth;
      const aoePx = Math.max(48, (cfg.hitRadiusVw || 6.8) * iw / 100 * 2);
      this.game.skillRanges?.flash("spark");
      this.game.effects.spawnCastFlash(px, py, "spark");
      const origin = document.createElement("div");
      origin.className = "spark-origin-burst";
      origin.style.left = `${px}vw`;
      origin.style.top = `${py}vh`;
      this.game.ui.els.gameContainer.appendChild(origin);
      this._transientDom.track(origin, () => origin.remove());
      const count = cfg.sparkCount;
      const maxSparks = RUNTIME_BUDGET.maxActiveSparks ?? 24;
      const baseAngle = Math.random() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        if (this._activeSparks.length >= maxSparks) break;
        const el = document.createElement("div");
        el.className = "skill-spark skill-spark-arc particle-25d";
        el.innerHTML = `
                <span class="spark-aoe-ring" aria-hidden="true"></span>
                <span class="particle-25d-face"></span>
                <span class="spark-core-glow" aria-hidden="true"></span>
            `;
        el.style.left = `${px}vw`;
        el.style.top = `${py}vh`;
        const ring = el.querySelector(".spark-aoe-ring");
        if (ring) {
          ring.style.width = `${aoePx}px`;
          ring.style.height = `${aoePx}px`;
        }
        this.game.ui.els.gameContainer.appendChild(el);
        const spoke = baseAngle + i / count * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.55;
        const moveAngle = spoke + jitter;
        const spark = {
          el,
          bx: px,
          by: py,
          vx: Math.cos(moveAngle) * cfg.speed,
          vy: Math.sin(moveAngle) * cfg.speed,
          expires: simNow + cfg.duration,
          hitIds: /* @__PURE__ */ new Set(),
          damage,
          wanderChance: cfg.wanderChance ?? 0.38,
          wanderTurn: cfg.wanderTurn ?? 2.2,
          hitRadiusVw: cfg.hitRadiusVw ?? 6.8,
          maxPierce: cfg.maxPierce ?? 2,
          animId: null
        };
        this._activeSparks.push(spark);
      }
    }
    _tickSparks(now, simDeltaMs) {
      const s = this.game.state;
      this._activeSparks = tickSparkProjectiles(this._activeSparks, {
        simNow: now,
        simDeltaMs,
        gamePaused: s.gamePaused,
        gameOver: s.gameOver,
        enemies: s.enemies,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        onHit: (enemy, damage) => {
          this.game._dealSkillDamageToEnemy(enemy, damage, "lightning", false, "spark");
        }
      });
    }
    cleanup() {
      const s = this.game?.state;
      this._transientDom.clearAll();
      this._activeSparks.forEach((spark) => {
        if (spark.animId && s) s.cancelAnimation(spark.animId);
        spark.el?.remove();
      });
      this._activeSparks = [];
      this._rfLastTick = 0;
      this._rfLastSfx = 0;
    }
    _findNearestEnemy(fromX, fromY, range) {
      const s = this.game.state;
      let nearest = null;
      let minDist = range;
      s.enemies.forEach((enemy) => {
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        const dist = distanceVw(fromX, fromY, ex, ey, window.innerWidth, window.innerHeight);
        if (dist <= range && dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      });
      return nearest;
    }
  };
  function getSkillConfigFor(id, level) {
    switch (id) {
      case "fireball":
        return getFireballConfig(level);
      case "iceNova":
        return getIceNovaConfig(level);
      case "lightningArc":
        return getLightningArcConfig(level);
      case "poisonBottle":
        return getPoisonBottleConfig(level);
      case "healingWave":
        return getHealingWaveConfig(level);
      case "frostbolt":
        return getFrostboltConfig(level);
      case "righteousFire":
        return getRighteousFireConfig(level);
      case "spark":
        return getSparkConfig(level);
      case "poisonDagger":
        return getPoisonDaggerConfig(level);
      case "hammerSweep":
        return getHammerSweepConfig(level);
      case "throwSpear":
        return getThrowSpearConfig(level);
      default:
        return { cooldown: Infinity };
    }
  }

  // js/systems/progression.js
  function getLevelUpType(currentLevel, abilityThresholds) {
    const nextLevel = currentLevel + 1;
    if (isSkillLevel(nextLevel)) return "skill";
    if (abilityThresholds.includes(nextLevel)) return "ability";
    return "stat";
  }
  function isSkillLevel(level) {
    return level >= 5 && (level - 5) % 10 === 0;
  }

  // js/config/playerProgression.js
  function computeLevelUpDamageBonus(level, originalPhysicalDamage) {
    const nextLevel = level + 1;
    return Math.floor(
      0.75 + nextLevel / 5 + originalPhysicalDamage / 8
    );
  }
  function computeUpgradeDamageIncrement(statLevel, originalPhysicalDamage) {
    const tier = statLevel + 1;
    return Math.floor(
      0.75 + originalPhysicalDamage / 6 + tier * 0.75
    );
  }
  function computeLevelUpHpGain(levelAfterIncrement, originalHp) {
    return Math.floor(
      8 + 2.5 * levelAfterIncrement + originalHp / 100
    );
  }
  function computeLevelUpMaxHpGain(levelAfterIncrement, originalMaxHp) {
    return Math.floor(
      10 + 3.5 * levelAfterIncrement + originalMaxHp / 100
    );
  }
  function computeArmourUpgradeIncrement(statLevel, originalArmour) {
    return Math.floor(2 + statLevel * 1.25 + originalArmour / 20);
  }

  // js/systems/combat.js
  var ARMOUR_MITIGATION_K = 40;
  var ARMOUR_MITIGATION_CAP = 0.75;
  function calculateArmourMitigation(playerArmour, rawDamage) {
    if (playerArmour <= 0) return 0;
    const k = ARMOUR_MITIGATION_K + rawDamage * 0.35;
    const reduction = playerArmour / (playerArmour + k);
    return Math.min(reduction, ARMOUR_MITIGATION_CAP);
  }
  function calculatePlayerDamage(params) {
    const {
      physicalDamage,
      targetArmour,
      maxHp,
      hpRegen,
      isReflect = false,
      isBounce = false,
      critChance,
      critMultiplier,
      abilities
    } = params;
    let damage = physicalDamage - targetArmour;
    if (abilities.hpToDamageLevel > 0) {
      damage += maxHp * abilities.hpToDamageLevel * 6 / 100;
    }
    if (abilities.regenToDamageLevel > 0) {
      damage += hpRegen * abilities.regenToDamageLevel * 50 / 100;
    }
    if (isBounce && abilities.bounceLevel > 0) {
      damage = (60 + 10 * (abilities.bounceLevel - 1)) / 100 * damage;
    }
    const isCritical = !isReflect && rollChance(critChance);
    if (isCritical) {
      damage *= critMultiplier / 100;
    }
    return { damage: Math.floor(Math.max(1, damage)), isCritical };
  }
  function calculateReflectDamageToEnemy({ playerPhysicalDamage, reflectLevel, enemyArmour = 0 }) {
    if (reflectLevel <= 0 || playerPhysicalDamage <= 0) return 0;
    const pct = getAbilityPercent("reflect", reflectLevel) / 100;
    const raw = Math.floor(playerPhysicalDamage * pct);
    if (raw <= 0) return 0;
    return Math.max(1, raw - Math.max(0, enemyArmour));
  }
  function applyReflectDamageToAttacker({
    playerPhysicalDamage,
    reflectLevel,
    enemyArmour = 0,
    attackerHp
  }) {
    const hp = Math.max(0, Number(attackerHp) || 0);
    if (hp <= 0) return { reflected: 0, remainingHp: 0 };
    const reflected = calculateReflectDamageToEnemy({
      playerPhysicalDamage,
      reflectLevel,
      enemyArmour
    });
    if (reflected <= 0) return { reflected: 0, remainingHp: hp };
    return { reflected, remainingHp: hp - reflected };
  }
  function calculatePlayerIncomingDamage(params) {
    const {
      enemyDamage,
      playerArmour,
      damageReductionLevel,
      ignoreArmour = false,
      elapsedSeconds
    } = params;
    let scaledDamage = enemyDamage;
    if (typeof elapsedSeconds === "number") {
      scaledDamage = scaleEnemyAttackDamageForElapsed(enemyDamage, elapsedSeconds);
    }
    const mitigation = ignoreArmour ? 0 : calculateArmourMitigation(playerArmour, scaledDamage);
    let damage = scaledDamage * (1 - mitigation);
    if (damageReductionLevel > 0) {
      damage *= 1 - getAbilityPercent("damageReduction", damageReductionLevel) / 100;
    }
    return Math.max(1, Math.floor(damage));
  }
  function rollEnemyEvade(evadeChance) {
    if (!evadeChance || evadeChance <= 0) return false;
    return rollChance(evadeChance);
  }
  function calculateLifesteal(params) {
    const { damage, lifestealLevel } = params;
    if (lifestealLevel <= 0) return 0;
    return Math.floor(damage * getAbilityPercent("lifesteal", lifestealLevel) / 100);
  }
  function applyStatUpgrade(statName, stats, originalStats, statsList) {
    const statLevel = statsList[statName].level + 1;
    switch (statName) {
      case "Upgrade Damage":
        stats.physicalDamage += computeUpgradeDamageIncrement(statLevel, originalStats.physicalDamage);
        break;
      case "Upgrade AoE":
        stats.attackRange += 15;
        break;
      case "Upgrade Attack Speed":
        stats.attackSpeed += 0.05 + originalStats.attackSpeed / 60;
        break;
      case "Upgrade HP (Recover 20% Life)": {
        const hpGain = Math.floor(5 + originalStats.hp / 100 * statLevel + statLevel * Math.log(statLevel * 1.5 + 1));
        stats.hp += hpGain;
        stats.maxHp += hpGain;
        stats.hp += Math.floor(stats.maxHp * 20 / 100);
        break;
      }
      case "Upgrade HP Regen":
        stats.hpRegen += Math.floor(2 + statLevel * 2 + originalStats.hpRegen / 20);
        break;
      case "Upgrade Armour":
        stats.armour += computeArmourUpgradeIncrement(statLevel, originalStats.armour);
        break;
      case "Upgrade Crit Chance":
        stats.critChance += 2.5;
        break;
      case "Upgrade Crit Multiplier":
        stats.critMultiplier += 12.5;
        break;
      default:
        break;
    }
    statsList[statName].level += 1;
  }
  function applyLevelUpBonuses(stats, originalStats) {
    stats.level += 1;
    stats.physicalDamage += computeLevelUpDamageBonus(stats.level - 1, originalStats.physicalDamage);
    stats.armour += Math.floor(1 + stats.level / 8 + originalStats.armour / 40);
    stats.hpRegen += Math.floor(1 + stats.level / 15 + originalStats.hpRegen / 25);
    stats.hp += computeLevelUpHpGain(stats.level, originalStats.hp);
    stats.maxHp += computeLevelUpMaxHpGain(stats.level, originalStats.maxHp);
  }

  // js/systems/levelUp.js
  function completeLevelCycle(stats, originalStats) {
    applyLevelUpBonuses(stats, originalStats);
    stats.exp -= stats.expThreshold;
    stats.expThreshold = calculateExpThreshold(stats.level, originalStats.expThreshold);
  }
  function bankExpLevelUps(state) {
    if (!state.pendingUpgrades) state.pendingUpgrades = [];
    let banked = 0;
    while (state.stats.exp >= state.stats.expThreshold) {
      const type = getLevelUpType(state.stats.level, state.abilityLevelThreshold);
      state.pendingUpgrades.push(
        /** @type {PendingUpgrade} */
        { type }
      );
      completeLevelCycle(state.stats, state.originalStats);
      banked++;
    }
    return { banked, pendingCount: state.pendingUpgrades.length };
  }
  function consumePendingUpgradeByType(state, type) {
    if (!state.pendingUpgrades) return null;
    const idx = state.pendingUpgrades.findIndex((u) => u.type === type);
    if (idx === -1) return null;
    return state.pendingUpgrades.splice(idx, 1)[0];
  }
  function buildStatUpgradeOptions(statsList, count = 3) {
    const available = Object.keys(statsList).filter(
      (k) => statsList[k].level < statsList[k].maxLevel
    );
    if (available.length === 0) return [];
    const picked = [...available].sort(() => Math.random() - 0.5).slice(0, count);
    picked.sort((a, b) => available.indexOf(a) - available.indexOf(b));
    return picked.map((key) => ({
      key,
      label: key,
      level: statsList[key].level
    }));
  }
  function buildStatUpgradeOptionsFromKeys(statsList, cachedKeys) {
    if (!cachedKeys?.length) return buildStatUpgradeOptions(statsList);
    return cachedKeys.filter((k) => statsList[k] && statsList[k].level < statsList[k].maxLevel).map((key) => ({
      key,
      label: key,
      level: statsList[key].level
    }));
  }
  function rollStatUpgradeKeys(statsList, count = 3) {
    return buildStatUpgradeOptions(statsList, count).map((o) => o.key);
  }
  function buildSkillUpgradeOptions(skillList, count = 5) {
    const available = SKILL_IDS.filter((id) => skillList[id] && skillList[id].level < skillList[id].maxLevel).map((id) => ({
      key: id,
      level: skillList[id].level,
      label: SKILL_DEFINITIONS[id].formatText(
        skillList[id].level,
        skillList[id].level + 1
      )
    }));
    return pickRandomOptions(available, count);
  }
  function buildSkillUpgradeOptionsFromKeys(skillList, cachedKeys) {
    if (!cachedKeys?.length) return buildSkillUpgradeOptions(skillList);
    return cachedKeys.filter((k) => skillList[k] && skillList[k].level < skillList[k].maxLevel).map((key) => ({
      key,
      level: skillList[key].level,
      label: SKILL_DEFINITIONS[key].formatText(
        skillList[key].level,
        skillList[key].level + 1
      )
    }));
  }
  function rollSkillUpgradeKeys(skillList, count = 5) {
    return buildSkillUpgradeOptions(skillList, count).map((o) => o.key);
  }
  function buildAbilityUpgradeOptions(abilityList, formatAbilityText) {
    return Object.keys(abilityList).filter((k) => abilityList[k].level < abilityList[k].maxLevel).map((k) => ({
      key: k,
      level: abilityList[k].level,
      label: formatAbilityText(k)
    }));
  }
  function pickRandomOptions(available, count) {
    if (available.length === 0) return [];
    const picked = [...available].sort(() => Math.random() - 0.5).slice(0, count);
    return picked.sort((a, b) => available.indexOf(a) - available.indexOf(b));
  }
  function summarizeUpgradeQueue(pendingUpgrades) {
    const counts = { stat: 0, skill: 0, ability: 0 };
    (pendingUpgrades || []).forEach((u) => {
      counts[u.type]++;
    });
    return counts;
  }
  function formatAbilityDescription(ability) {
    let i = 0;
    return ability.text.replace(/\?\?/g, () => {
      const idx = ability.level + i * ability.maxLevel;
      i++;
      return ability.progression[idx] ?? "??";
    });
  }

  // js/systems/skillRangeDisplay.js
  var SkillRangeDisplay = class {
    /** @param {HTMLElement} container @param {HTMLElement} layer */
    constructor(container, layer) {
      this.container = container;
      this.layer = layer;
      this.rings = {};
      this._timeouts = /* @__PURE__ */ new Set();
      this._impactNodes = /* @__PURE__ */ new Set();
      this._maxSkillImpacts = getRuntimeBudgets().maxSkillImpacts;
      this._timeScale = 1;
    }
    /** @param {number} scale — VFX lifetime only; impact cap stays fixed. */
    setTimeScale(scale) {
      this._timeScale = Math.max(1, scale || 1);
      this._trimSkillImpacts();
    }
    /** @param {object} skillList @param {number} [playerAttackRange] */
    update(skillList, playerAttackRange = 0) {
      if (!this.layer) return;
      SKILL_IDS.forEach((id) => {
        const level = skillList[id]?.level || 0;
        const def = SKILL_DEFINITIONS[id];
        let ring = this.rings[id];
        if (level <= 0) {
          ring?.remove();
          delete this.rings[id];
          return;
        }
        const diameterPx = getSkillDisplayRadius(id, level, playerAttackRange) * 2;
        if (!ring) {
          ring = document.createElement("div");
          ring.className = `skill-range-ring skill-range-${def.element}`;
          ring.dataset.skill = id;
          const label = document.createElement("span");
          label.className = "skill-range-label";
          label.textContent = def.name;
          ring.appendChild(label);
          this.layer.appendChild(ring);
          this.rings[id] = ring;
        }
        ring.style.width = `${diameterPx}px`;
        ring.style.height = `${diameterPx}px`;
      });
    }
    flash(skillId) {
      const ring = this.rings[skillId];
      if (!ring) return;
      ring.classList.remove("skill-range-cast");
      void ring.offsetWidth;
      ring.classList.add("skill-range-cast");
    }
    showImpactArea(px, py, radiusPx, element, durationMs = 700) {
      this._trimSkillImpacts();
      const el = document.createElement("div");
      el.className = `skill-impact-area skill-impact-${element}`;
      el.style.left = `${px}vw`;
      el.style.top = `${py}vh`;
      el.style.width = `${radiusPx * 2}px`;
      el.style.height = `${radiusPx * 2}px`;
      this.container.appendChild(el);
      this._impactNodes.add(el);
      requestAnimationFrame(() => el.classList.add("skill-impact-active"));
      const lifetime = scaledEffectLifetimeMs({ timeScale: this._timeScale }, durationMs);
      const timeoutId = setTimeout(() => {
        el.remove();
        this._impactNodes.delete(el);
        this._timeouts.delete(timeoutId);
      }, lifetime);
      this._timeouts.add(timeoutId);
    }
    _trimSkillImpacts() {
      const cap = this._maxSkillImpacts ?? 28;
      while (this._impactNodes.size > cap) {
        const oldest = this._impactNodes.values().next().value;
        if (!oldest) break;
        oldest.remove();
        this._impactNodes.delete(oldest);
      }
    }
    _clearTransient() {
      this._timeouts.forEach((id) => clearTimeout(id));
      this._timeouts.clear();
      this._impactNodes.forEach((el) => el.remove());
      this._impactNodes.clear();
    }
    clear() {
      Object.values(this.rings).forEach((r) => r.remove());
      this.rings = {};
      this.layer?.replaceChildren();
      this._clearTransient();
    }
  };

  // js/systems/poisonPools.js
  var nextPoolId = 0;
  var PoisonPoolManager = class {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
      this.game = game;
      this.pools = [];
    }
    /** @param {number} x @param {number} y @param {number} level @param {number} baseDamage */
    createPool(x, y, level, baseDamage) {
      const cfg = getPoisonBottleConfig(level);
      const simNow = getProjectedSimMs(this.game.state);
      const el = document.createElement("div");
      el.className = "poison-pool";
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      el.style.width = `${cfg.poolRadius * 2}px`;
      el.style.height = `${cfg.poolRadius * 2}px`;
      el.innerHTML = '<div class="poison-pool-inner"></div><div class="poison-pool-bubbles"></div>';
      this.game.ui.els.gameContainer.appendChild(el);
      const pool = {
        id: `pool-${nextPoolId++}`,
        element: el,
        x,
        y,
        radius: cfg.poolRadius,
        level,
        tickDamage: computePoisonTickDamage(baseDamage, level),
        tickInterval: cfg.tickInterval,
        endTime: simNow + cfg.poolDuration,
        lastTick: simNow
      };
      this.pools.push(pool);
      this.game.skillRanges?.showImpactArea(x, y, cfg.poolRadius, "chaos", cfg.poolDuration);
      requestAnimationFrame(() => el.classList.add("poison-pool-active"));
      return pool;
    }
    /** @param {number} simNow Simulated milliseconds from the game clock */
    tick(simNow) {
      const s = this.game.state;
      if (s.gamePaused || s.gameOver) return;
      this.pools = this.pools.filter((pool) => {
        if (simNow >= pool.endTime) {
          pool.element.classList.add("poison-pool-fade");
          const fadeMs = scaledRealTimeoutMs(s, 500);
          const t = setTimeout(() => pool.element.remove(), fadeMs);
          s.trackTimeout(t);
          return false;
        }
        if (simNow - pool.lastTick >= pool.tickInterval) {
          pool.lastTick = simNow;
          this._damageEnemiesInPool(pool);
        }
        return true;
      });
    }
    _damageEnemiesInPool(pool) {
      const s = this.game.state;
      const targets = findEnemiesInRadius(
        s.enemies.map((e) => ({
          id: e.id,
          x: parseFloat(e.element.style.left),
          y: parseFloat(e.element.style.top),
          hp: e.stats.hp,
          ref: e
        })),
        pool.x,
        pool.y,
        pool.radius,
        window.innerWidth,
        window.innerHeight
      );
      targets.forEach((t) => {
        if (t.ref) {
          this.game._dealSkillDamageToEnemy(t.ref, pool.tickDamage, "chaos", false, "poisonBottle");
          t.ref.element.classList.add("enemy-chaos-dot");
          const tOut = setTimeout(() => t.ref.element.classList.remove("enemy-chaos-dot"), 300);
          s.trackTimeout(tOut);
        }
      });
      pool.element.querySelector(".poison-pool-inner")?.classList.add("poison-pool-tick");
      const tickOut = setTimeout(() => {
        pool.element.querySelector(".poison-pool-inner")?.classList.remove("poison-pool-tick");
      }, 200);
      s.trackTimeout(tickOut);
    }
    clear() {
      this.pools.forEach((p) => p.element.remove());
      this.pools = [];
    }
  };

  // js/ui/upgradePanel.js
  var UpgradePanel = class {
    /**
     * @param {(key: string) => void} onSelect
     * @param {(type: 'stat'|'skill'|'ability') => void} [onCategorySelect]
     * @param {() => void} [onToggle]
     */
    constructor(onSelect, onCategorySelect, onToggle) {
      this.onSelect = onSelect;
      this.onCategorySelect = onCategorySelect;
      this.onToggle = onToggle;
      this.expanded = !panelsStartCollapsed();
      this._view = "categories";
      this.els = {
        panel: document.getElementById("upgrade-panel"),
        toggle: document.getElementById("upgrade-panel-toggle"),
        badge: document.getElementById("upgrade-panel-count"),
        body: document.getElementById("upgrade-panel-body"),
        title: document.getElementById("upgrade-panel-title"),
        queue: document.getElementById("upgrade-panel-queue"),
        wrapper: document.getElementById("upgrade-button-wrapper")
      };
      this.els.toggle?.addEventListener("click", () => this.toggle());
      this._applyExpandedClasses();
    }
    _applyExpandedClasses() {
      this.els.panel?.classList.toggle("upgrade-panel-expanded", this.expanded);
      this.els.panel?.classList.toggle("upgrade-panel-collapsed", !this.expanded);
      this.els.toggle?.setAttribute("aria-expanded", String(this.expanded));
    }
    toggle(forceExpanded) {
      if (typeof forceExpanded === "boolean") {
        this.expanded = forceExpanded;
      } else {
        this.expanded = !this.expanded;
      }
      this._applyExpandedClasses();
      this.onToggle?.();
    }
    isExpanded() {
      return this.expanded;
    }
    /** @param {number} count */
    updateBadge(count) {
      if (!this.els.badge) return;
      this.els.badge.textContent = String(count);
      this.els.badge.classList.toggle("upgrade-panel-badge-hidden", count <= 0);
      this.els.panel?.classList.toggle("upgrade-panel-has-pending", count > 0);
    }
    /** @param {{ stat: number, skill: number, ability: number }} counts */
    updateQueueSummary(counts, total) {
      if (!this.els.queue) return;
      if (total <= 0) {
        this.els.queue.textContent = "No upgrades banked \u2014 keep fighting!";
        return;
      }
      const parts = [];
      if (counts.stat) parts.push(`${counts.stat} stat`);
      if (counts.skill) parts.push(`${counts.skill} skill`);
      if (counts.ability) parts.push(`${counts.ability} ability`);
      this.els.queue.textContent = `${total} banked (${parts.join(", ")})`;
    }
    /**
     * Step 1: pick which upgrade type to spend.
     * @param {{ stat: number, skill: number, ability: number }} counts
     */
    renderCategoryMenu(counts) {
      if (!this.els.wrapper) return;
      this._view = "categories";
      if (this.els.title) {
        this.els.title.textContent = "Spend Level-Up";
      }
      const categories = [
        { type: "stat", label: "Stat Upgrade", icon: "\u25C6", css: "upgrade-cat-stat", count: counts.stat },
        { type: "skill", label: "Active Skill", icon: "\u2726", css: "upgrade-cat-skill", count: counts.skill },
        { type: "ability", label: "Passive Ability", icon: "\u2605", css: "upgrade-cat-ability", count: counts.ability }
      ].filter((c) => c.count > 0);
      this.els.wrapper.innerHTML = '<div class="upgrade-category-grid"></div>';
      const grid = this.els.wrapper.querySelector(".upgrade-category-grid");
      if (!grid || categories.length === 0) {
        this.showEmptyState();
        return;
      }
      categories.forEach((cat, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `upgrade-category-btn choice-card ${cat.css}`;
        btn.innerHTML = `
                <span class="upgrade-choice-key">${index + 1}</span>
                <span class="upgrade-cat-icon">${cat.icon}</span>
                <span class="upgrade-cat-label">${cat.label}</span>
                <span class="upgrade-cat-count">${cat.count}</span>
            `;
        btn.addEventListener("click", () => this.onCategorySelect?.(cat.type));
        grid.appendChild(btn);
      });
    }
    /**
     * Step 2: pick an option for the chosen type.
     * @param {'stat' | 'skill' | 'ability'} choiceType
     * @param {Array<{ key: string, label: string, level: number }>} options
     * @param {() => void} [onBack]
     * @param {number} [remaining]
     */
    renderChoices(choiceType, options, onBack, remaining = 0) {
      if (!this.els.wrapper) return;
      this._view = "choices";
      const titles = {
        stat: remaining > 0 ? `Pick a Stat (${remaining} left)` : "Pick a Stat",
        ability: remaining > 0 ? `Pick a Passive (${remaining} left)` : "Pick a Passive Ability",
        skill: remaining > 0 ? `Pick a Skill (${remaining} left)` : "Pick an Active Skill"
      };
      if (this.els.title) {
        this.els.title.textContent = titles[choiceType] || "Choose Upgrade";
      }
      this.els.wrapper.innerHTML = "";
      if (onBack) {
        const back = document.createElement("button");
        back.type = "button";
        back.className = "upgrade-back-btn";
        back.textContent = "\u2190 Back to categories";
        back.addEventListener("click", onBack);
        this.els.wrapper.appendChild(back);
      }
      if (options.length === 0) {
        const empty = document.createElement("p");
        empty.className = "upgrade-empty";
        empty.textContent = "All options maxed for this type.";
        this.els.wrapper.appendChild(empty);
        return;
      }
      const choiceClass = `upgrade-choice-${choiceType}`;
      options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `upgrade-choice-btn choice-card ${choiceClass}`;
        btn.innerHTML = `
                <span class="upgrade-choice-key">${index + 1}</span>
                <span class="upgrade-choice-text">${opt.label}</span>
                <span class="upgrade-choice-level">${opt.level > 0 ? `Lv.${opt.level} \u2192 ${opt.level + 1}` : "Unlock"}</span>
            `;
        btn.addEventListener("click", () => this.onSelect(opt.key));
        this.els.wrapper.appendChild(btn);
      });
    }
    showEmptyState() {
      this._view = "empty";
      if (this.els.title) this.els.title.textContent = "Upgrades";
      if (this.els.wrapper) {
        this.els.wrapper.innerHTML = '<p class="upgrade-empty">No pending upgrades.</p>';
      }
    }
    getChoiceButtons() {
      return this.els.wrapper?.querySelectorAll(".choice-card") ?? [];
    }
    getCategoryButtons() {
      if (this._view !== "categories") return [];
      return this.els.wrapper?.querySelectorAll(".upgrade-category-btn") ?? [];
    }
    getView() {
      return this._view;
    }
    reset() {
      this.expanded = !panelsStartCollapsed();
      this._view = "categories";
      this._applyExpandedClasses();
      this.els.panel?.classList.remove("upgrade-panel-has-pending");
      this.updateBadge(0);
      this.showEmptyState();
      if (this.els.queue) this.els.queue.textContent = "";
    }
  };

  // js/config/waveProgression.js
  function getDifficultyIndex(elapsedSeconds) {
    return Math.floor(elapsedSeconds / BALANCE.difficultyIntervalSec);
  }
  function getWaveNumber(elapsedSeconds) {
    return getDifficultyIndex(elapsedSeconds) + 1;
  }

  // js/systems/killStreak.js
  var KillStreakTracker = class {
    constructor() {
      this.streak = 0;
      this.bestStreak = 0;
      this.lastKillTime = 0;
      this.windowMs = 2500;
    }
    reset() {
      this.streak = 0;
      this.bestStreak = 0;
      this.lastKillTime = 0;
    }
    /** @param {number} now @param {number} bonusPerKill @param {number} cap */
    recordKill(now, bonusPerKill, cap) {
      if (this.lastKillTime && now - this.lastKillTime > this.windowMs) {
        this.streak = 0;
      }
      this.streak += 1;
      this.lastKillTime = now;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      return Math.min(cap, this.streak * bonusPerKill);
    }
    /** Decay streak when no kills within window (call from game tick). */
    tick(now) {
      if (this.streak > 0 && this.lastKillTime && now - this.lastKillTime > this.windowMs) {
        this.streak = 0;
      }
    }
  };

  // js/systems/treasureEvents.js
  var TreasureEventManager = class {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
      this.game = game;
      this.intervalMs = 9e4;
      this.lastSpawnTime = 0;
      this.treasuresOpened = 0;
    }
    reset() {
      this.lastSpawnTime = Date.now();
      this.treasuresOpened = 0;
    }
    /** @param {number} now */
    tick(now) {
      const s = this.game.state;
      if (s.gamePaused || s.gameOver) return;
      if (now - this.lastSpawnTime < this.intervalMs) return;
      this.lastSpawnTime = now;
      this.game.spawnTreasureChest();
    }
    recordOpen() {
      this.treasuresOpened += 1;
    }
  };

  // js/config/gearSlots.js
  var GEAR_SLOTS = (
    /** @type {const} */
    [
      "weapon",
      "helmet",
      "bodyArmour",
      "boot",
      "ring",
      "amulet",
      "glove"
    ]
  );
  var GEAR_BASES = {
    weapon: { label: "Sword", stats: { physicalDamage: 14 } },
    helmet: { label: "Helm", stats: { armour: 10 } },
    bodyArmour: { label: "Chestplate", stats: { armour: 22, maxHp: 50 } },
    boot: { label: "Boots", stats: { evade: 8 } },
    ring: { label: "Ring", stats: { critChance: 5 } },
    amulet: { label: "Amulet", stats: { hpRegen: 5 } },
    glove: { label: "Gloves", stats: { attackSpeed: 0.12 } }
  };
  function getBaseForSlot(slot) {
    return GEAR_BASES[slot] || GEAR_BASES.weapon;
  }
  function createEmptyEquipment() {
    return Object.fromEntries(GEAR_SLOTS.map((s) => [s, null]));
  }

  // js/config/gearBalance.js
  var GEAR_STAT_MULTIPLIER = 2.4;
  var GEAR_BASE_ILVL = {
    intercept: 0.72,
    slope: 0.028
  };
  function gearIlvlMultiplier(ilvl) {
    return GEAR_BASE_ILVL.intercept + ilvl * GEAR_BASE_ILVL.slope;
  }
  function boostGearStatValue(value, stat = "") {
    const boosted = value * GEAR_STAT_MULTIPLIER;
    if (stat === "attackSpeed") return Math.round(boosted * 100) / 100;
    if (stat === "critChance" || stat === "critMultiplier" || stat === "evade") {
      return Math.round(boosted * 10) / 10;
    }
    return Math.floor(boosted);
  }

  // js/config/gearAffixTiers.js
  var TIER_MIN_ILVL = {
    1: 64,
    2: 56,
    3: 48,
    4: 40,
    5: 32,
    6: 24,
    7: 16,
    8: 1
  };
  var TIERED_PREFIXES = [
    {
      id: "heavy",
      label: "Heavy",
      stat: "physicalDamage",
      slots: ["weapon", "glove"],
      tiers: [
        { tier: 8, min: 1, max: 4 },
        { tier: 7, min: 2, max: 6 },
        { tier: 6, min: 4, max: 9 },
        { tier: 5, min: 6, max: 12 },
        { tier: 4, min: 8, max: 15 },
        { tier: 3, min: 11, max: 18 },
        { tier: 2, min: 14, max: 22 },
        { tier: 1, min: 18, max: 28 }
      ]
    },
    {
      id: "robust",
      label: "Robust",
      stat: "maxHp",
      slots: ["helmet", "bodyArmour", "amulet"],
      tiers: [
        { tier: 8, min: 6, max: 14 },
        { tier: 7, min: 10, max: 20 },
        { tier: 6, min: 14, max: 28 },
        { tier: 5, min: 20, max: 36 },
        { tier: 4, min: 26, max: 44 },
        { tier: 3, min: 32, max: 52 },
        { tier: 2, min: 38, max: 62 },
        { tier: 1, min: 46, max: 72 }
      ]
    },
    {
      id: "reinforced",
      label: "Reinforced",
      stat: "armour",
      slots: ["helmet", "bodyArmour", "glove"],
      tiers: [
        { tier: 8, min: 1, max: 4 },
        { tier: 7, min: 2, max: 6 },
        { tier: 6, min: 4, max: 9 },
        { tier: 5, min: 6, max: 12 },
        { tier: 4, min: 8, max: 15 },
        { tier: 3, min: 11, max: 18 },
        { tier: 2, min: 14, max: 22 },
        { tier: 1, min: 18, max: 28 }
      ]
    },
    {
      id: "quick",
      label: "Quick",
      stat: "attackSpeed",
      slots: ["weapon", "glove", "boot"],
      tiers: [
        { tier: 8, min: 0.01, max: 0.03 },
        { tier: 7, min: 0.02, max: 0.05 },
        { tier: 6, min: 0.04, max: 0.08 },
        { tier: 5, min: 0.06, max: 0.11 },
        { tier: 4, min: 0.08, max: 0.14 },
        { tier: 3, min: 0.11, max: 0.17 },
        { tier: 2, min: 0.14, max: 0.22 },
        { tier: 1, min: 0.18, max: 0.28 }
      ]
    },
    {
      id: "long",
      label: "Long",
      stat: "attackRange",
      slots: ["weapon"],
      tiers: [
        { tier: 8, min: 3, max: 8 },
        { tier: 7, min: 5, max: 12 },
        { tier: 6, min: 7, max: 15 },
        { tier: 5, min: 9, max: 18 },
        { tier: 4, min: 11, max: 22 },
        { tier: 3, min: 14, max: 26 },
        { tier: 2, min: 17, max: 30 },
        { tier: 1, min: 20, max: 36 }
      ]
    },
    {
      id: "deadly",
      label: "Deadly",
      stat: "critChance",
      slots: ["weapon", "ring", "glove"],
      tiers: [
        { tier: 8, min: 1, max: 2 },
        { tier: 7, min: 1, max: 3 },
        { tier: 6, min: 2, max: 4 },
        { tier: 5, min: 2, max: 5 },
        { tier: 4, min: 3, max: 6 },
        { tier: 3, min: 3, max: 7 },
        { tier: 2, min: 4, max: 8 },
        { tier: 1, min: 5, max: 10 }
      ]
    },
    {
      id: "cruel",
      label: "Cruel",
      stat: "critMultiplier",
      slots: ["weapon", "amulet", "glove"],
      tiers: [
        { tier: 8, min: 4, max: 8 },
        { tier: 7, min: 6, max: 12 },
        { tier: 6, min: 8, max: 15 },
        { tier: 5, min: 10, max: 18 },
        { tier: 4, min: 12, max: 22 },
        { tier: 3, min: 15, max: 26 },
        { tier: 2, min: 18, max: 30 },
        { tier: 1, min: 22, max: 36 }
      ]
    },
    {
      id: "regenerating",
      label: "Regenerating",
      stat: "hpRegen",
      slots: ["amulet", "bodyArmour", "ring"],
      tiers: [
        { tier: 8, min: 1, max: 3 },
        { tier: 7, min: 2, max: 4 },
        { tier: 6, min: 2, max: 6 },
        { tier: 5, min: 3, max: 7 },
        { tier: 4, min: 4, max: 9 },
        { tier: 3, min: 5, max: 11 },
        { tier: 2, min: 6, max: 13 },
        { tier: 1, min: 8, max: 16 }
      ]
    }
  ];
  var TIERED_SUFFIXES = [
    {
      id: "of_the_bear",
      label: "of the Bear",
      stat: "maxHp",
      slots: ["helmet", "bodyArmour", "ring"],
      tiers: [
        { tier: 8, min: 6, max: 14 },
        { tier: 7, min: 10, max: 20 },
        { tier: 6, min: 14, max: 28 },
        { tier: 5, min: 18, max: 34 },
        { tier: 4, min: 22, max: 40 },
        { tier: 3, min: 26, max: 46 },
        { tier: 2, min: 30, max: 52 },
        { tier: 1, min: 36, max: 60 }
      ]
    },
    {
      id: "of_the_armadillo",
      label: "of the Armadillo",
      stat: "armour",
      slots: ["helmet", "bodyArmour", "boot"],
      tiers: [
        { tier: 8, min: 2, max: 5 },
        { tier: 7, min: 3, max: 8 },
        { tier: 6, min: 5, max: 11 },
        { tier: 5, min: 6, max: 14 },
        { tier: 4, min: 8, max: 17 },
        { tier: 3, min: 10, max: 20 },
        { tier: 2, min: 12, max: 24 },
        { tier: 1, min: 15, max: 28 }
      ]
    },
    {
      id: "of_slaying",
      label: "of Slaying",
      stat: "physicalDamage",
      slots: ["weapon", "glove", "ring"],
      tiers: [
        { tier: 8, min: 1, max: 4 },
        { tier: 7, min: 2, max: 6 },
        { tier: 6, min: 3, max: 8 },
        { tier: 5, min: 4, max: 10 },
        { tier: 4, min: 5, max: 12 },
        { tier: 3, min: 6, max: 14 },
        { tier: 2, min: 8, max: 16 },
        { tier: 1, min: 10, max: 20 }
      ]
    },
    {
      id: "of_alacrity",
      label: "of Alacrity",
      stat: "attackSpeed",
      slots: ["glove", "boot", "weapon"],
      tiers: [
        { tier: 8, min: 0.01, max: 0.03 },
        { tier: 7, min: 0.02, max: 0.05 },
        { tier: 6, min: 0.04, max: 0.08 },
        { tier: 5, min: 0.06, max: 0.11 },
        { tier: 4, min: 0.08, max: 0.14 },
        { tier: 3, min: 0.11, max: 0.17 },
        { tier: 2, min: 0.14, max: 0.22 },
        { tier: 1, min: 0.18, max: 0.28 }
      ]
    },
    {
      id: "of_reach",
      label: "of Reach",
      stat: "attackRange",
      slots: ["weapon", "boot"],
      tiers: [
        { tier: 8, min: 2, max: 6 },
        { tier: 7, min: 4, max: 10 },
        { tier: 6, min: 6, max: 13 },
        { tier: 5, min: 8, max: 16 },
        { tier: 4, min: 10, max: 19 },
        { tier: 3, min: 12, max: 22 },
        { tier: 2, min: 14, max: 26 },
        { tier: 1, min: 18, max: 32 }
      ]
    },
    {
      id: "of_precision",
      label: "of Precision",
      stat: "critChance",
      slots: ["weapon", "ring", "glove"],
      tiers: [
        { tier: 8, min: 1, max: 2 },
        { tier: 7, min: 1, max: 3 },
        { tier: 6, min: 2, max: 4 },
        { tier: 5, min: 2, max: 5 },
        { tier: 4, min: 3, max: 6 },
        { tier: 3, min: 3, max: 7 },
        { tier: 2, min: 4, max: 8 },
        { tier: 1, min: 5, max: 9 }
      ]
    },
    {
      id: "of_ferocity",
      label: "of Ferocity",
      stat: "critMultiplier",
      slots: ["weapon", "amulet", "ring"],
      tiers: [
        { tier: 8, min: 5, max: 10 },
        { tier: 7, min: 8, max: 14 },
        { tier: 6, min: 10, max: 18 },
        { tier: 5, min: 12, max: 22 },
        { tier: 4, min: 15, max: 26 },
        { tier: 3, min: 18, max: 30 },
        { tier: 2, min: 22, max: 34 },
        { tier: 1, min: 26, max: 40 }
      ]
    },
    {
      id: "of_the_ghost",
      label: "of the Ghost",
      stat: "evade",
      slots: ["boot", "helmet", "glove"],
      tiers: [
        { tier: 8, min: 1, max: 3 },
        { tier: 7, min: 2, max: 5 },
        { tier: 6, min: 3, max: 7 },
        { tier: 5, min: 4, max: 8 },
        { tier: 4, min: 5, max: 10 },
        { tier: 3, min: 6, max: 12 },
        { tier: 2, min: 7, max: 14 },
        { tier: 1, min: 9, max: 17 }
      ]
    },
    {
      id: "of_regeneration",
      label: "of Regeneration",
      stat: "hpRegen",
      slots: ["amulet", "ring", "bodyArmour"],
      tiers: [
        { tier: 8, min: 1, max: 3 },
        { tier: 7, min: 2, max: 5 },
        { tier: 6, min: 3, max: 7 },
        { tier: 5, min: 4, max: 9 },
        { tier: 4, min: 5, max: 11 },
        { tier: 3, min: 6, max: 13 },
        { tier: 2, min: 7, max: 15 },
        { tier: 1, min: 9, max: 18 }
      ]
    }
  ];
  var BASE_STAT_TIER_DEF = {
    physicalDamage: "heavy",
    maxHp: "robust",
    armour: "reinforced",
    attackSpeed: "quick",
    attackRange: "long",
    critChance: "deadly",
    critMultiplier: "cruel",
    hpRegen: "regenerating",
    evade: "of_the_ghost"
  };
  function getLegalAffixTierBands(def, ilvl) {
    return def.tiers.filter((t) => ilvl >= TIER_MIN_ILVL[t.tier]).sort((a, b) => b.tier - a.tier);
  }
  function rollRandomAffixTierBand(def, ilvl) {
    const legal = getLegalAffixTierBands(def, ilvl);
    if (legal.length === 0) return def.tiers[def.tiers.length - 1];
    return legal[Math.floor(Math.random() * legal.length)];
  }
  function rollValueInTierBand(band, stat) {
    const raw = band.min + Math.random() * (band.max - band.min);
    return boostGearStatValue(raw, stat);
  }
  function rollTieredAffixValue(def, slot, ilvl) {
    if (def.slots && !def.slots.includes(slot)) return null;
    const band = rollRandomAffixTierBand(def, ilvl);
    const value = rollValueInTierBand(band, def.stat);
    return {
      id: def.id,
      label: def.label,
      stat: def.stat,
      value,
      tier: band.tier
    };
  }
  var AFFIX_STAT_WEIGHTS = {
    maxHp: 100,
    armour: 70,
    physicalDamage: 48,
    attackSpeed: 32,
    attackRange: 22,
    hpRegen: 28,
    /** Crit rolls intentionally rare on gear */
    critMultiplier: 5,
    critChance: 4,
    evade: 8
  };
  function pickWeightedAffixDef(candidates) {
    if (!candidates.length) return null;
    let total = 0;
    const weights = candidates.map((def) => {
      const w = AFFIX_STAT_WEIGHTS[def.stat] ?? 20;
      total += w;
      return w;
    });
    if (total <= 0) return candidates[Math.floor(Math.random() * candidates.length)];
    let roll = Math.random() * total;
    for (let i = 0; i < candidates.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }
  function pickTieredAffix(pool, slot, usedIds, ilvl) {
    const candidates = pool.filter((a) => (!a.slots || a.slots.includes(slot)) && !usedIds.has(a.id));
    if (candidates.length === 0) return null;
    const def = pickWeightedAffixDef(candidates);
    if (!def) return null;
    const rolled = rollTieredAffixValue(def, slot, ilvl);
    if (!rolled) return null;
    usedIds.add(def.id);
    return rolled;
  }
  function pickTieredAffixAllowDuplicate(pool, slot, usedIds, ilvl) {
    const candidates = pool.filter((a) => !a.slots || a.slots.includes(slot));
    if (candidates.length === 0) return null;
    const def = pickWeightedAffixDef(candidates);
    if (!def) return null;
    const rolled = rollTieredAffixValue(def, slot, ilvl);
    if (!rolled) return null;
    let dupKey = `${def.id}#2`;
    let n = 2;
    while (usedIds.has(dupKey)) {
      n += 1;
      dupKey = `${def.id}#${n}`;
    }
    usedIds.add(dupKey);
    return { ...rolled, id: dupKey };
  }
  function getTierDefForBaseStat(stat) {
    const prefixId = BASE_STAT_TIER_DEF[stat];
    if (!prefixId) return null;
    return TIERED_PREFIXES.find((p) => p.id === prefixId) || TIERED_SUFFIXES.find((s) => s.id === prefixId) || null;
  }
  function rollBaseStatsWithTiers(templateStats, ilvl) {
    const stats = {};
    const rolls = [];
    Object.entries(templateStats).forEach(([stat, templateVal]) => {
      const def = getTierDefForBaseStat(stat);
      if (def) {
        const band = rollRandomAffixTierBand(def, ilvl);
        const value = rollValueInTierBand(band, stat);
        stats[stat] = value;
        rolls.push({ stat, value, tier: band.tier });
      } else {
        const value = Math.max(1, boostGearStatValue(templateVal * gearIlvlMultiplier(ilvl), stat));
        stats[stat] = value;
        rolls.push({ stat, value, tier: 8 });
      }
    });
    return { stats, rolls };
  }

  // js/config/gearUniques.js
  var UNIQUE_ITEMS = [
    {
      id: "survivors_blade",
      name: "Survivor's Blade",
      slot: "weapon",
      stats: { physicalDamage: 22, critChance: 6, attackSpeed: 0.1 }
    },
    {
      id: "capybara_shell",
      name: "Capybara's Shell",
      slot: "bodyArmour",
      stats: { maxHp: 90, armour: 28, hpRegen: 5 }
    },
    {
      id: "summoner_focus",
      name: "Summoning Focus",
      slot: "amulet",
      stats: { attackRange: 40, physicalDamage: 8, hpRegen: 4 }
    },
    {
      id: "ring_of_endurance",
      name: "Ring of Endurance",
      slot: "ring",
      stats: { maxHp: 45, hpRegen: 8, evade: 5 }
    },
    {
      id: "windwalker_boots",
      name: "Windwalker Boots",
      slot: "boot",
      stats: { evade: 15, attackSpeed: 0.12, attackRange: 15 }
    },
    {
      id: "iron_crown",
      name: "Iron Crown",
      slot: "helmet",
      stats: { armour: 25, maxHp: 40, physicalDamage: 5 }
    },
    {
      id: "berserker_grip",
      name: "Berserker's Grip",
      slot: "glove",
      stats: { physicalDamage: 12, attackSpeed: 0.15, critMultiplier: 20 }
    }
  ];
  var UNIQUE_BOSS_DROP_CONFIG = {
    /** Rolled affixes on top of each unique's fixed base stats (7–8 total). */
    bonusAffixCountMin: 7,
    bonusAffixCountMax: 8,
    /** Minimum ilvl used when rolling boss bonus affix tiers (display ilvl unchanged). */
    minAffixIlvl: 48
  };
  function getUniqueById(id) {
    return UNIQUE_ITEMS.find((u) => u.id === id);
  }

  // js/config/gearRarity.js
  var RARITY_CONFIG2 = {
    normal: {
      key: "normal",
      label: "Normal",
      cssClass: "gear-normal",
      color: "#e2e8f0"
    },
    magic: {
      key: "magic",
      label: "Magic",
      cssClass: "gear-magic",
      color: "#60a5fa"
    },
    rare: {
      key: "rare",
      label: "Rare",
      cssClass: "gear-rare",
      color: "#facc15"
    },
    unique: {
      key: "unique",
      label: "Unique",
      cssClass: "gear-unique",
      color: "#ea580c"
    }
  };
  var BASE_DROP_CHANCE = {
    normal: 0.06,
    rare: 0.12,
    elite: 0.22,
    boss: 0.45,
    treasure: 0.65
  };
  var DROP_RATE_MULTIPLIER = 0.26334;
  var DROP_CHANCE = Object.fromEntries(
    Object.entries(BASE_DROP_CHANCE).map(([k, v]) => [k, v * DROP_RATE_MULTIPLIER])
  );
  var AFFIX_COUNT_WEIGHTS = {
    normal: [62, 26, 9, 2, 1, 0, 0, 0, 0],
    rare: [38, 30, 18, 9, 4, 1, 0, 0, 0],
    elite: [20, 24, 22, 16, 10, 5, 2, 1, 0],
    boss: [10, 14, 18, 20, 16, 12, 6, 3, 1],
    treasure: [12, 18, 22, 20, 14, 8, 4, 1, 1]
  };
  function rarityFromAffixCount(affixCount) {
    if (affixCount >= 7) return "unique";
    if (affixCount >= 3) return "rare";
    if (affixCount >= 1) return "magic";
    return "normal";
  }
  function getAdjustedAffixWeights(enemyRarity) {
    return [...AFFIX_COUNT_WEIGHTS[enemyRarity] || AFFIX_COUNT_WEIGHTS.normal];
  }
  function rollAffixCount(enemyRarity) {
    const weights = getAdjustedAffixWeights(enemyRarity);
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return 0;
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i;
    }
    return 0;
  }
  function getDropChance(enemyRarity, wave = 0) {
    const base = DROP_CHANCE[enemyRarity] || DROP_CHANCE.normal;
    if (wave <= 8) return base;
    const lateScale = Math.max(0.12, 1 - (wave - 8) * 0.032);
    return base * lateScale;
  }
  function shouldDropGear(enemyRarity, wave = 0) {
    return Math.random() < getDropChance(enemyRarity, wave);
  }

  // js/systems/gearGenerator.js
  var _itemCounter = 0;
  function nextItemId() {
    _itemCounter += 1;
    return `item-${Date.now()}-${_itemCounter}`;
  }
  function computeDropIlvl(playerLevel, difficulty = 0) {
    return Math.max(1, Math.min(80, Math.floor(playerLevel + difficulty * 0.4)));
  }
  function rollAffixesForItem(slot, ilvl, affixCount, options = {}) {
    const prefixes = [];
    const suffixes = [];
    const used = /* @__PURE__ */ new Set();
    let remaining = Math.min(8, Math.max(0, affixCount));
    const maxPerSide = 4;
    const guaranteeCount = Boolean(options.guaranteeCount);
    const pickFromPool = (pool, tryPrefix) => {
      let affix = pickTieredAffix(pool, slot, used, ilvl);
      if (!affix && guaranteeCount) {
        affix = pickTieredAffixAllowDuplicate(pool, slot, used, ilvl);
      }
      if (!affix) return false;
      if (tryPrefix) prefixes.push(affix);
      else suffixes.push(affix);
      return true;
    };
    while (remaining > 0 && (prefixes.length < maxPerSide || suffixes.length < maxPerSide)) {
      const canPre = prefixes.length < maxPerSide;
      const canSuf = suffixes.length < maxPerSide;
      if (!canPre && !canSuf) break;
      const tryPrefix = canPre && (canSuf ? Math.random() < 0.5 : true);
      if (tryPrefix) {
        if (pickFromPool(TIERED_PREFIXES, true)) {
          remaining--;
          continue;
        }
      }
      if (canSuf) {
        if (pickFromPool(TIERED_SUFFIXES, false)) {
          remaining--;
          continue;
        }
      }
      if (!guaranteeCount) break;
      if (tryPrefix && canSuf && pickFromPool(TIERED_SUFFIXES, false)) {
        remaining--;
        continue;
      }
      if (!tryPrefix && canPre && pickFromPool(TIERED_PREFIXES, true)) {
        remaining--;
        continue;
      }
      break;
    }
    return { prefixes, suffixes };
  }
  function generateGearItem(slot, ilvl = 1, options = {}) {
    const base = getBaseForSlot(slot);
    const affixCount = options.affixCount ?? 0;
    const rollIlvl = options.affixRollIlvl ?? ilvl;
    const affixOpts = options.guaranteeAffixCount ? { guaranteeCount: true } : {};
    const { prefixes, suffixes } = rollAffixesForItem(slot, rollIlvl, affixCount, affixOpts);
    const totalAffixes = prefixes.length + suffixes.length;
    const { stats: baseStats, rolls: baseStatRolls } = rollBaseStatsWithTiers(base.stats, ilvl);
    const item = {
      id: nextItemId(),
      slot,
      ilvl,
      rarity: rarityFromAffixCount(totalAffixes),
      baseLabel: base.label,
      baseStats,
      baseStatRolls,
      prefixes,
      suffixes,
      uniqueId: null,
      name: base.label
    };
    if (options.uniqueId) {
      const unique = getUniqueById(options.uniqueId);
      if (unique) {
        item.uniqueId = unique.id;
        item.name = unique.name;
        item.rarity = "unique";
        const rolled = rollBaseStatsWithTiers(unique.stats, ilvl);
        item.baseStats = rolled.stats;
        item.baseStatRolls = rolled.rolls;
        item.slot = unique.slot;
        item.prefixes = prefixes;
        item.suffixes = suffixes;
        return item;
      }
    }
    if (item.rarity === "unique" && totalAffixes >= 7) {
      item.name = buildUniqueStyleName(item);
    } else {
      item.name = buildItemName(item);
    }
    return item;
  }
  function buildItemName(item) {
    const pre = item.prefixes[0]?.label || "";
    const suf = item.suffixes[0]?.label || "";
    const base = item.baseLabel;
    if (pre && suf) return `${pre} ${base} ${suf}`;
    if (pre) return `${pre} ${base}`;
    if (suf) return `${base} ${suf}`;
    return base;
  }
  function buildUniqueStyleName(item) {
    const pre = item.prefixes[0]?.label || "Exalted";
    return `${pre} ${item.baseLabel}`;
  }
  function rollBossBonusAffixCount() {
    const cfg = UNIQUE_BOSS_DROP_CONFIG;
    const min = cfg.bonusAffixCountMin ?? cfg.bonusAffixCount ?? 7;
    const max = cfg.bonusAffixCountMax ?? min;
    if (max <= min) return min;
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  function rollGuaranteedUniqueDrop(ilvl = 1) {
    const unique = UNIQUE_ITEMS[Math.floor(Math.random() * UNIQUE_ITEMS.length)];
    const affixIlvl = Math.max(ilvl, UNIQUE_BOSS_DROP_CONFIG.minAffixIlvl ?? 48);
    return generateGearItem(unique.slot, ilvl, {
      uniqueId: unique.id,
      affixCount: rollBossBonusAffixCount(),
      guaranteeAffixCount: true,
      affixRollIlvl: affixIlvl
    });
  }
  function rollLootDrop(enemyRarity, ilvl = 1) {
    const slot = GEAR_SLOTS[Math.floor(Math.random() * GEAR_SLOTS.length)];
    const affixCount = rollAffixCount(enemyRarity);
    return generateGearItem(slot, ilvl, { affixCount });
  }
  function getItemStatTotals(item) {
    const totals = { ...item.baseStats };
    [...item.prefixes || [], ...item.suffixes || []].forEach((affix) => {
      totals[affix.stat] = (totals[affix.stat] || 0) + affix.value;
    });
    return totals;
  }
  function buildItemTooltipHtml(item, options = {}) {
    const { title = null, showHeader = true } = options;
    const r = RARITY_CONFIG2[item.rarity] || RARITY_CONFIG2.normal;
    const tierByStat = new Map((item.baseStatRolls || []).map((roll) => [roll.stat, roll.tier]));
    const baseLines = Object.entries(item.baseStats || {}).map(([k, v]) => {
      const tier = tierByStat.get(k);
      const tierTag = tier ? ` <span class="gear-tip-tier">T${tier}</span>` : "";
      return `<div class="gear-tip-line">+${formatStat(k, v)} ${formatStatLabel(k)}${tierTag}</div>`;
    });
    const affixes = [...item.prefixes || [], ...item.suffixes || []];
    const affixLines = affixes.map((a) => {
      const tierTag = a.tier ? ` <span class="gear-tip-tier">T${a.tier}</span>` : "";
      return `<div class="gear-tip-line">+${formatStat(a.stat, a.value)} ${formatStatLabel(a.stat)}${tierTag}</div>`;
    });
    let statsHtml = "";
    if (baseLines.length > 0) {
      statsHtml += `
            <div class="gear-tip-section">
                <div class="gear-tip-section-title">Base Stats</div>
                ${baseLines.join("")}
            </div>`;
    }
    if (affixLines.length > 0) {
      statsHtml += `
            <div class="gear-tip-section">
                <div class="gear-tip-section-title">Affixes (${affixLines.length})</div>
                ${affixLines.join("")}
            </div>`;
    }
    if (!statsHtml) {
      statsHtml = '<div class="gear-tip-line gear-tip-muted">No modifiers</div>';
    }
    const headerHtml = showHeader ? `
            <div class="gear-tip-header">
                <span class="gear-tip-name" style="color:${r.color}">${title || item.name}</span>
                <span class="gear-tip-ilvl">Item Level ${item.ilvl}</span>
            </div>
            <div class="gear-tip-divider"></div>` : "";
    return `
        <div class="gear-tip-inner ${r.cssClass}" style="--tip-rarity:${r.color}">
            ${headerHtml}
            <div class="gear-tip-body">${statsHtml}</div>
        </div>
    `;
  }
  function buildGearCompareTooltipHtml(hoveredItem, equippedItem, opts = {}) {
    const hoveredIsEquipped = Boolean(
      opts.hoveredIsEquipped || equippedItem && hoveredItem?.id === equippedItem.id
    );
    const hoverTitle = hoveredIsEquipped ? `${hoveredItem.name} \u2014 Equipped` : hoveredItem.name;
    const hoverCol = buildItemTooltipHtml(hoveredItem, { title: hoverTitle, showHeader: true });
    if (hoveredIsEquipped) {
      return `<div class="gear-tip-compare gear-tip-compare-single">${hoverCol}</div>`;
    }
    const equippedCol = equippedItem ? buildItemTooltipHtml(equippedItem, { title: `Equipped \u2014 ${equippedItem.name}`, showHeader: true }) : `<div class="gear-tip-inner gear-tip-empty-slot">
            <div class="gear-tip-header">
                <span class="gear-tip-name">Equipped</span>
            </div>
            <div class="gear-tip-divider"></div>
            <div class="gear-tip-body"><div class="gear-tip-line gear-tip-muted">Empty slot</div></div>
           </div>`;
    return `
        <div class="gear-tip-compare">
            <div class="gear-tip-compare-col">${hoverCol}</div>
            <div class="gear-tip-compare-col gear-tip-compare-equipped">${equippedCol}</div>
        </div>
    `;
  }
  function formatStatLabel(stat) {
    const labels = {
      physicalDamage: "Damage",
      armour: "DEF",
      maxHp: "HP",
      hpRegen: "Regen",
      attackSpeed: "ATK SPD",
      attackRange: "AOE",
      critChance: "Crit",
      critMultiplier: "Crit Mult",
      evade: "Evade"
    };
    return labels[stat] || stat;
  }
  function formatStat(stat, val) {
    if (stat === "attackSpeed") return Number(val).toFixed(2);
    if (stat === "critChance" || stat === "critMultiplier" || stat === "evade") return val;
    return Math.floor(val);
  }

  // js/systems/gearInventory.js
  var GearInventory = class {
    /** @param {number} maxSize */
    constructor(maxSize = 28) {
      this.maxSize = maxSize;
      this.items = [];
      this.equipped = createEmptyEquipment();
      this._appliedTotals = {};
    }
    reset() {
      this.items = [];
      this.equipped = createEmptyEquipment();
      this._appliedTotals = {};
    }
    /** @param {object} item @returns {boolean} */
    addItem(item) {
      if (this.items.length >= this.maxSize) return false;
      this.items.push(item);
      return true;
    }
    /** @param {string} itemId */
    removeItem(itemId) {
      const idx = this.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return null;
      return this.items.splice(idx, 1)[0];
    }
    /** @param {string[]} rarities @returns {number} count removed */
    removeByRarities(rarities) {
      const before = this.items.length;
      this.items = this.items.filter((i) => !rarities.includes(i.rarity));
      return before - this.items.length;
    }
    /** @param {string} itemId @param {object} stats — mutable player stats */
    equip(itemId, stats) {
      const idx = this.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      const item = this.items[idx];
      const slot = item.slot;
      if (this.equipped[slot]) {
        this.unequip(slot, stats);
      }
      this.items.splice(idx, 1);
      this.equipped[slot] = item;
      this._applyItemStats(item, stats, 1);
      return true;
    }
    /** @param {string} slot @param {object} stats */
    unequip(slot, stats) {
      const item = this.equipped[slot];
      if (!item) return null;
      this._applyItemStats(item, stats, -1);
      this.equipped[slot] = null;
      this.addItem(item);
      return item;
    }
    /** @param {object} item @param {object} stats @param {1|-1} dir */
    _applyItemStats(item, stats, dir) {
      const totals = getItemStatTotals(item);
      Object.entries(totals).forEach(([key, val]) => {
        if (stats[key] === void 0) return;
        stats[key] += val * dir;
        if (key === "maxHp" && dir === 1) stats.hp += val;
        if (key === "maxHp" && dir === -1) {
          stats.hp = Math.min(stats.hp, stats.maxHp);
        }
      });
    }
    /** Total stats from all equipped gear (read-only). */
    getEquippedTotals() {
      const totals = {};
      GEAR_SLOTS.forEach((slot) => {
        const item = this.equipped[slot];
        if (!item) return;
        const itemTotals = getItemStatTotals(item);
        Object.entries(itemTotals).forEach(([k, v]) => {
          totals[k] = (totals[k] || 0) + v;
        });
      });
      return totals;
    }
    getEquippedCount() {
      return GEAR_SLOTS.filter((s) => this.equipped[s]).length;
    }
  };

  // js/ui/gearIcons.js
  var HELMET_SVG = `<svg class="gear-slot-svg gear-icon-helmet" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12 2C8.5 2 5.8 4.1 5 7.1V9H4v3h1.1c.4 3.5 2.8 6.4 6.2 7.4V22h3.4v-2.6c3.4-1 5.8-3.9 6.2-7.4H22V9h-1V7.1C20.2 4.1 17.5 2 14 2h-2zm0 2h2c2.2 0 4 1.5 4.4 3.5H7.6C8 5.5 9.8 4 12 4z"/>
</svg>`;
  var SLOT_ICON_DATA = {
    weapon: { emoji: "\u2694\uFE0F", className: "gear-icon-weapon" },
    helmet: { svg: HELMET_SVG, className: "gear-icon-helmet" },
    bodyArmour: { emoji: "\u{1F455}", className: "gear-icon-body" },
    boot: { emoji: "\u{1F462}", className: "gear-icon-boot" },
    ring: { emoji: "\u{1F48D}", className: "gear-icon-ring" },
    amulet: { emoji: "\u{1F4FF}", className: "gear-icon-amulet" },
    glove: { emoji: "\u{1F9E4}", className: "gear-icon-glove" }
  };
  function getSlotIconHtml(slot) {
    const data = SLOT_ICON_DATA[slot] || { emoji: "\u{1F4E6}", className: "gear-icon-default" };
    if (data.svg) return data.svg;
    return `<span class="gear-emoji ${data.className}" aria-hidden="true">${data.emoji}</span>`;
  }
  function getSlotShortLabel(slot) {
    const labels = {
      weapon: "Weapon",
      helmet: "Helm",
      bodyArmour: "Body",
      boot: "Boots",
      ring: "Ring",
      amulet: "Amulet",
      glove: "Gloves"
    };
    return labels[slot] || slot;
  }
  var GEAR_DOLL_LAYOUT = [
    { slot: null, area: "pad-tl" },
    { slot: "helmet", area: "top" },
    { slot: "amulet", area: "top-right" },
    { slot: "weapon", area: "mid-left" },
    { slot: "bodyArmour", area: "mid" },
    { slot: null, area: "pad-mr" },
    { slot: "glove", area: "bot-left" },
    { slot: "boot", area: "bot" },
    { slot: "ring", area: "bot-right" }
  ];

  // js/ui/gearTooltip.js
  var GearTooltip = class {
    constructor() {
      this.el = document.createElement("div");
      this.el.id = "gear-tooltip";
      this.el.className = "gear-tooltip floating-tooltip";
      this.el.setAttribute("role", "tooltip");
      this.el.hidden = true;
      document.body.appendChild(this.el);
      this._clientX = 0;
      this._clientY = 0;
      this._onMove = this._onMove.bind(this);
    }
    /**
     * @param {object} item
     * @param {HTMLElement} anchor
     * @param {object|null} [equippedItem]
     * @param {number} [clientX]
     * @param {number} [clientY]
     */
    show(item, anchor, equippedItem = null, clientX, clientY) {
      this._anchor = anchor;
      const hoveredIsEquipped = Boolean(equippedItem && item?.id === equippedItem.id);
      this.el.innerHTML = buildGearCompareTooltipHtml(item, equippedItem, { hoveredIsEquipped });
      const rect = anchor.getBoundingClientRect();
      this._clientX = clientX ?? rect.left + rect.width / 2;
      this._clientY = clientY ?? rect.top + rect.height / 2;
      positionFloatingTooltip(this.el, this._clientX, this._clientY);
      document.addEventListener("mousemove", this._onMove);
    }
    hide() {
      this.el.hidden = true;
      this.el.innerHTML = "";
      this._anchor = null;
      document.removeEventListener("mousemove", this._onMove);
    }
    _onMove(event) {
      this._clientX = event.clientX;
      this._clientY = event.clientY;
      if (!this.el.hidden) {
        positionFloatingTooltip(this.el, this._clientX, this._clientY);
      }
    }
    /**
     * @param {HTMLElement} el
     * @param {object|null} item
     * @param {() => object|null} [getEquipped]
     */
    bind(el, item, getEquipped) {
      if (!item) return;
      el.addEventListener("mouseenter", (event) => {
        const equipped = getEquipped?.() ?? null;
        this.show(item, el, equipped, event.clientX, event.clientY);
      });
      el.addEventListener("mousemove", (event) => {
        if (this.el.hidden) return;
        this._clientX = event.clientX;
        this._clientY = event.clientY;
        positionFloatingTooltip(this.el, this._clientX, this._clientY);
      });
      el.addEventListener("mouseleave", () => this.hide());
      el.addEventListener("mousedown", () => this.hide());
    }
  };

  // js/systems/gearLootFilter.js
  var FILTERABLE_RARITIES = (
    /** @type {const} */
    ["normal", "magic", "rare"]
  );
  var GearLootFilter = class {
    constructor() {
      this.autoDelete = { normal: false, magic: false, rare: false };
    }
    reset() {
      this.autoDelete = { normal: false, magic: false, rare: false };
    }
    /** @param {AutoDeleteRarity} rarity */
    toggle(rarity) {
      if (!FILTERABLE_RARITIES.includes(rarity)) return false;
      this.autoDelete[rarity] = !this.autoDelete[rarity];
      return this.autoDelete[rarity];
    }
    /** @param {string} rarity */
    shouldAutoDelete(rarity) {
      return Boolean(this.autoDelete[rarity]);
    }
    /** @param {AutoDeleteRarity} rarity */
    isActive(rarity) {
      return Boolean(this.autoDelete[rarity]);
    }
  };

  // js/ui/gearPanel.js
  var BULK_DELETE_LABELS = {
    normal: "Normal (white)",
    magic: "Magic (blue)",
    rare: "Rare (yellow)"
  };
  var GearPanel = class {
    /**
     * @param {import('../systems/gearInventory.js').GearInventory} inventory
     * @param {(itemId: string) => void} onEquip
     * @param {(slot: string) => void} onUnequip
     * @param {(itemId: string) => void} [onDelete]
     * @param {(rarity: string) => void} [onBulkDelete]
     * @param {import('../systems/gearLootFilter.js').GearLootFilter} [lootFilter]
     */
    constructor(inventory, onEquip, onUnequip, onDelete, onBulkDelete, lootFilter) {
      this.inventory = inventory;
      this.lootFilter = lootFilter;
      this.onEquip = onEquip;
      this.onUnequip = onUnequip;
      this.onDelete = onDelete;
      this.onBulkDelete = onBulkDelete;
      this.expanded = !panelsStartCollapsed();
      this.tooltip = new GearTooltip();
      this._pendingBulkRarity = null;
      this.els = {
        panel: document.getElementById("gear-panel"),
        toggle: document.getElementById("gear-panel-toggle"),
        badge: document.getElementById("gear-panel-count"),
        slots: document.getElementById("gear-slots"),
        toolbar: document.getElementById("gear-inv-toolbar"),
        list: document.getElementById("gear-inventory-list"),
        bulkConfirm: document.getElementById("gear-bulk-confirm"),
        bulkConfirmText: document.getElementById("gear-bulk-confirm-text"),
        bulkConfirmYes: document.getElementById("gear-bulk-confirm-yes"),
        bulkConfirmNo: document.getElementById("gear-bulk-confirm-no"),
        filterBar: document.getElementById("gear-filter-bar")
      };
      this.els.toggle?.addEventListener("click", () => this.toggle());
      this._bindToolbar();
      this._bindFilterBar();
      this._bindBulkConfirm();
      this._applyExpandedClasses();
      if (this.expanded) this.refresh();
    }
    _bindToolbar() {
      this.els.toolbar?.querySelectorAll("[data-bulk-rarity]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this._requestBulkDelete(btn.dataset.bulkRarity);
        });
      });
    }
    _bindFilterBar() {
      this.els.filterBar?.querySelectorAll("[data-filter-rarity]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const rarity = btn.dataset.filterRarity;
          if (!this.lootFilter || !FILTERABLE_RARITIES.includes(rarity)) return;
          const active = this.lootFilter.toggle(rarity);
          btn.classList.toggle("gear-filter-active", active);
          btn.setAttribute("aria-pressed", String(active));
        });
      });
    }
    _bindBulkConfirm() {
      this.els.bulkConfirmYes?.addEventListener("click", () => {
        const rarity = this._pendingBulkRarity;
        this._hideBulkConfirm();
        if (rarity) this.onBulkDelete?.(rarity);
      });
      this.els.bulkConfirmNo?.addEventListener("click", () => this._hideBulkConfirm());
    }
    _requestBulkDelete(rarity) {
      const count = this.inventory.items.filter((i) => i.rarity === rarity).length;
      if (count <= 0) return;
      const label = BULK_DELETE_LABELS[rarity] || rarity;
      this._pendingBulkRarity = rarity;
      if (this.els.bulkConfirmText) {
        this.els.bulkConfirmText.textContent = `Delete all ${count} ${label} item${count > 1 ? "s" : ""}?`;
      }
      this.els.bulkConfirm?.classList.add("gear-bulk-confirm-visible");
    }
    _hideBulkConfirm() {
      this._pendingBulkRarity = null;
      this.els.bulkConfirm?.classList.remove("gear-bulk-confirm-visible");
    }
    _applyExpandedClasses() {
      this.els.panel?.classList.toggle("gear-panel-expanded", this.expanded);
      this.els.panel?.classList.toggle("gear-panel-collapsed", !this.expanded);
    }
    toggle(forceExpanded) {
      this.expanded = typeof forceExpanded === "boolean" ? forceExpanded : !this.expanded;
      this._applyExpandedClasses();
      if (!this.expanded) {
        this.tooltip.hide();
        this._hideBulkConfirm();
      }
      if (this.expanded) this.refresh();
    }
    isExpanded() {
      return this.expanded;
    }
    updateBadge(count) {
      if (!this.els.badge) return;
      this.els.badge.textContent = String(count);
      this.els.badge.classList.toggle("gear-panel-badge-hidden", count <= 0);
    }
    refresh() {
      this.updateBadge(this.inventory.items.length);
      this._renderDoll();
      this._renderInventory();
    }
    _renderDoll() {
      if (!this.els.slots) return;
      this.els.slots.innerHTML = GEAR_DOLL_LAYOUT.map((cell) => {
        if (!cell.slot) {
          return `<div class="gear-doll-cell gear-doll-empty" data-area="${cell.area}"></div>`;
        }
        const slot = cell.slot;
        const item = this.inventory.equipped[slot];
        const rarity = item ? RARITY_CONFIG2[item.rarity] : null;
        const icon = getSlotIconHtml(slot);
        const label = getSlotShortLabel(slot);
        if (!item) {
          return `
                    <div class="gear-doll-cell gear-slot gear-slot-empty" data-area="${cell.area}" data-slot="${slot}">
                        <span class="gear-slot-icon">${icon}</span>
                        <span class="gear-slot-label">${label}</span>
                    </div>
                `;
        }
        return `
                <div class="gear-doll-cell gear-slot gear-slot-filled ${rarity.cssClass}" data-area="${cell.area}" data-slot="${slot}"
                    style="--gear-rarity-color:${rarity.color}">
                    <span class="gear-slot-label">${label}</span>
                    <span class="gear-slot-divider" aria-hidden="true"></span>
                    <span class="gear-slot-icon">${icon}</span>
                    <button type="button" class="gear-unequip-btn" data-slot="${slot}" aria-label="Unequip ${label}">\xD7</button>
                </div>
            `;
      }).join("");
      this.els.slots.querySelectorAll(".gear-slot-filled").forEach((el) => {
        const slot = el.dataset.slot;
        const item = this.inventory.equipped[slot];
        this.tooltip.bind(el, item, () => this.inventory.equipped[slot]);
      });
      this.els.slots.querySelectorAll(".gear-unequip-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.tooltip.hide();
          this.onUnequip(btn.dataset.slot);
        });
      });
    }
    _renderInventory() {
      if (!this.els.list) return;
      if (this.inventory.items.length === 0) {
        this.els.list.innerHTML = '<p class="gear-empty">No items yet</p>';
        return;
      }
      this.els.list.innerHTML = this.inventory.items.map((item) => {
        const r = RARITY_CONFIG2[item.rarity];
        const icon = getSlotIconHtml(item.slot);
        return `
                <button type="button" class="gear-inv-item ${r.cssClass}" data-id="${item.id}"
                    style="--gear-rarity-color:${r.color}">
                    <span class="gear-inv-icon">${icon}</span>
                </button>
            `;
      }).join("");
      this.els.list.querySelectorAll(".gear-inv-item").forEach((btn) => {
        const item = this.inventory.items.find((i) => i.id === btn.dataset.id);
        this.tooltip.bind(btn, item, () => this.inventory.equipped[item.slot]);
        btn.addEventListener("click", (e) => {
          if (e.shiftKey) {
            this.tooltip.hide();
            this.onDelete?.(btn.dataset.id);
            return;
          }
          this.tooltip.hide();
          this.onEquip(btn.dataset.id);
        });
      });
    }
    reset() {
      this.expanded = !panelsStartCollapsed();
      this.tooltip.hide();
      this._hideBulkConfirm();
      this.lootFilter?.reset();
      this.els.filterBar?.querySelectorAll("[data-filter-rarity]").forEach((btn) => {
        btn.classList.remove("gear-filter-active");
        btn.setAttribute("aria-pressed", "false");
      });
      this._applyExpandedClasses();
      this.refresh();
    }
    pulseNewLoot() {
      this.els.panel?.classList.add("gear-panel-loot-pulse");
      setTimeout(() => this.els.panel?.classList.remove("gear-panel-loot-pulse"), 600);
    }
  };

  // js/systems/enemyPopulation.js
  var EnemyPopulationManager = class {
    /** @param {import('../game/gameState.js').GameState} state */
    constructor(state) {
      this.state = state;
    }
    get maxEnemies() {
      return getRuntimeBudgets().maxEnemies;
    }
    isAtCap() {
      const active = this.state.enemies.filter((e) => !e.isSplitFragment && !e.isSplitMinion);
      return active.length >= this.maxEnemies;
    }
    /** Skip spawn when at cap. */
    canSpawn() {
      return !this.isAtCap();
    }
    /**
     * Cull excess low-priority enemies when over cap (memory + performance).
     * Removes farthest normal/swarm enemies first.
     */
    enforceCap(game) {
      const s = this.state;
      if (s.enemies.length <= this.maxEnemies) return;
      const { x: px, y: py } = game.ui.getPlayerPosition();
      const excess = s.enemies.length - this.maxEnemies;
      const sorted = [...s.enemies].filter(
        (e) => e.rarity === "normal" && !e.isTreasure && !e.isSplitFragment && !e.isSplitMinion && !isMilestoneBossEnemy(e)
      ).map((e) => ({
        enemy: e,
        dist: Math.hypot(
          parseFloat(e.element.style.left) - px,
          parseFloat(e.element.style.top) - py
        )
      })).sort((a, b) => b.dist - a.dist);
      let removed = 0;
      for (const { enemy } of sorted) {
        if (removed >= excess) break;
        game._forceRemoveEnemy(enemy, false);
        removed++;
      }
    }
    /**
     * Spawn rate multiplier during warmup — ease-out so early waves get denser
     * packs while post-warmup (elapsed ≥ warmupSeconds) stays exactly 1.0.
     *
     * mult(t) = floor + (1 − floor) × t^ease
     * where t ∈ [0,1], floor = warmupSpawnMultiplier, ease ∈ (0,1] (default 0.62).
     *
     * @param {number} elapsedSeconds
     * @returns {number} in [warmupSpawnMultiplier, 1]
     */
    getSpawnMultiplier(elapsedSeconds) {
      const warmup = BALANCE.warmupSeconds || 180;
      if (elapsedSeconds >= warmup) return 1;
      const floor = BALANCE.warmupSpawnMultiplier ?? 0.52;
      const ease = BALANCE.warmupSpawnEase ?? 0.62;
      const t = Math.max(0, Math.min(1, elapsedSeconds / warmup));
      const shaped = Math.pow(t, ease);
      return floor + (1 - floor) * shaped;
    }
    /** Whether a spawn tick should fire this frame. @param {number} now */
    shouldSpawnNow(category, elapsedSeconds, lastSpawn, intervalMs, now = Date.now()) {
      if (!this.canSpawn()) return false;
      const warmupMult = this.getSpawnMultiplier(elapsedSeconds);
      const waveMult = getWaveSpawnDensityMultiplier(this.state.currentWave ?? 1);
      const mult = warmupMult * waveMult;
      const adjustedInterval = intervalMs / Math.max(0.35, mult);
      return now - lastSpawn >= adjustedInterval;
    }
  };

  // js/utils/companionAi.js
  function toPx(xVw, yVh, innerWidth, innerHeight) {
    return { x: xVw * innerWidth / 100, y: yVh * innerHeight / 100 };
  }
  function toVw(xPx, yPx, innerWidth, innerHeight) {
    return { x: xPx * 100 / innerWidth, y: yPx * 100 / innerHeight };
  }
  function stepTowardPx(opts) {
    const { x, y, targetX, targetY, speedPx, arriveDist = 8 } = opts;
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);
    if (dist <= arriveDist) {
      return { x, y, arrived: true, dist };
    }
    const step = Math.min(speedPx, Math.max(0, dist - arriveDist * 0.1));
    return {
      x: x + dx / dist * step,
      y: y + dy / dist * step,
      arrived: false,
      dist
    };
  }
  function findNearestEnemyAt(enemies, x, y, innerWidth, innerHeight) {
    let nearest = null;
    let min = Infinity;
    for (const enemy of enemies) {
      if (!enemy?.stats || enemy.stats.hp <= 0) continue;
      const ex = parseFloat(enemy.element.style.left);
      const ey = parseFloat(enemy.element.style.top);
      if (!Number.isFinite(ex) || !Number.isFinite(ey)) continue;
      const dist = distanceVw(x, y, ex, ey, innerWidth, innerHeight);
      if (dist < min) {
        min = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }
  function companionAiStep(agent, ctx) {
    const {
      ownerX,
      ownerY,
      enemies,
      speedVw = 0.35,
      leashVw = 12,
      homeOffsetX = 0,
      homeOffsetY = 0,
      attackRangePx = 45,
      style = "melee",
      innerWidth,
      innerHeight
    } = ctx;
    const iw = innerWidth;
    const ih = innerHeight;
    let pos = toPx(agent.x, agent.y, iw, ih);
    const owner = toPx(ownerX, ownerY, iw, ih);
    const home = toPx(ownerX + homeOffsetX, ownerY + homeOffsetY, iw, ih);
    const speedPx = speedVw * iw / 100;
    const leashPx = leashVw * iw / 100;
    const nearest = findNearestEnemyAt(enemies, agent.x, agent.y, iw, ih);
    let targetX = home.x;
    let targetY = home.y;
    let mode = "home";
    let arriveDist = 10;
    if (nearest) {
      const ex = parseFloat(nearest.element.style.left);
      const ey = parseFloat(nearest.element.style.top);
      const enemy = toPx(ex, ey, iw, ih);
      const toOwner = Math.hypot(enemy.x - owner.x, enemy.y - owner.y);
      if (toOwner <= leashPx * 1.45) {
        const dx = enemy.x - pos.x;
        const dy = enemy.y - pos.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (style === "ranged") {
          if (dist > attackRangePx * 0.92) {
            targetX = enemy.x;
            targetY = enemy.y;
            mode = "chase";
            arriveDist = Math.max(12, attackRangePx * 0.85);
          } else {
            targetX = pos.x;
            targetY = pos.y;
            mode = "engage";
            arriveDist = 999;
          }
        } else {
          const hold = Math.max(18, attackRangePx * 0.7);
          targetX = enemy.x - dx / dist * hold;
          targetY = enemy.y - dy / dist * hold;
          mode = "chase";
          arriveDist = 8;
        }
      }
    }
    const fromOwner = Math.hypot(pos.x - owner.x, pos.y - owner.y);
    if (fromOwner > leashPx) {
      targetX = home.x;
      targetY = home.y;
      mode = "leash";
      arriveDist = 14;
    }
    const next = stepTowardPx({
      x: pos.x,
      y: pos.y,
      targetX,
      targetY,
      speedPx: mode === "leash" ? speedPx * 1.6 : speedPx,
      arriveDist
    });
    pos = { x: next.x, y: next.y };
    let inAttackRange = false;
    if (nearest) {
      const ex = parseFloat(nearest.element.style.left);
      const ey = parseFloat(nearest.element.style.top);
      const enemy = toPx(ex, ey, iw, ih);
      const dist = Math.hypot(pos.x - enemy.x, pos.y - enemy.y);
      inAttackRange = dist <= attackRangePx;
    }
    const vw = toVw(pos.x, pos.y, iw, ih);
    return {
      x: vw.x,
      y: vw.y,
      target: nearest,
      mode,
      inAttackRange
    };
  }

  // js/systems/illusionClone.js
  var IllusionCloneManager = class {
    /** @param {object} game */
    constructor(game) {
      this.game = game;
      this.roamClone = null;
      this.skillClone = null;
    }
    /** @param {number} now */
    tick(now) {
      this._tickSlot(this.skillClone, now, { allowExpiry: true });
      this._tickSlot(this.roamClone, now, { allowExpiry: false });
    }
    /**
     * @param {IllusionCloneState|null} clone
     * @param {number} now
     * @param {{ allowExpiry: boolean }} opts
     */
    _tickSlot(clone, now, opts) {
      if (!clone) return;
      if (opts.allowExpiry && now >= clone.expiresAt) {
        this._removeSkillClone();
        return;
      }
      if (clone.roam) {
        this._tickRoamMovement(clone);
      } else {
        this._syncSkillPosition(clone);
      }
      this._tickCloneAttacks(clone, now);
    }
    /**
     * Permanent roaming companion (Ranger passive) — never expires; does not block the Illusion skill.
     * @param {number} now
     * @param {{ damagePercent: number, speedVw?: number, leashVw?: number }} opts
     */
    ensureRoamingCompanion(now, opts) {
      if (this.roamClone) {
        this.roamClone.damagePercent = opts.damagePercent ?? this.roamClone.damagePercent;
        if (opts.speedVw != null) this.roamClone.speedVw = opts.speedVw;
        if (opts.leashVw != null) this.roamClone.leashVw = opts.leashVw;
        return;
      }
      const { x, y } = this.game.ui.getPlayerPosition();
      const homeX = x + 3.2;
      const homeY = y;
      const el = document.createElement("div");
      el.className = "illusion-clone illusion-clone-ranger";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = buildCompanionModelHtml("illusion", { ranger: true });
      el.style.left = `${homeX}vw`;
      el.style.top = `${homeY}vh`;
      this.game.ui.els.gameContainer.appendChild(el);
      this.roamClone = {
        el,
        x: homeX,
        y: homeY,
        expiresAt: Number.MAX_SAFE_INTEGER,
        lastAttackTime: now,
        damagePercent: opts.damagePercent ?? 60,
        roam: true,
        speedVw: opts.speedVw ?? 0.55,
        leashVw: opts.leashVw ?? 14,
        homeOffsetX: 3.2,
        homeOffsetY: 0
      };
    }
    /** External roam step — move clone to new vw position. */
    setRoamPosition(x, y) {
      if (!this.roamClone) return;
      this.roamClone.x = x;
      this.roamClone.y = y;
      this.roamClone.el.style.left = `${x}vw`;
      this.roamClone.el.style.top = `${y}vh`;
    }
    /**
     * Summon skill clone if off cooldown — coexists with the Ranger roam companion.
     * @param {number} level
     * @param {number} now
     * @returns {boolean}
     */
    trySummon(level, now) {
      const s = this.game.state;
      const cfg = getIllusionConfig(level);
      if (level <= 0 || this.skillClone) return false;
      if (now - (s.skillCooldowns.illusion || 0) < cfg.cooldown) return false;
      s.skillCooldowns.illusion = now;
      this._spawnSkillClone(now, cfg);
      this.game.audio?.playSkillSfx?.("illusion");
      this.game.effects?.spawnCastFlash(
        parseFloat(this.skillClone.el.style.left),
        parseFloat(this.skillClone.el.style.top),
        "arcane"
      );
      return true;
    }
    /** @param {number} now @param {ReturnType<typeof getIllusionConfig>} cfg */
    _spawnSkillClone(now, cfg) {
      const { x, y } = this.game.ui.getPlayerPosition();
      const el = document.createElement("div");
      el.className = "illusion-clone";
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = buildCompanionModelHtml("illusion");
      el.style.left = `${x + cfg.offsetVw}vw`;
      el.style.top = `${y}vh`;
      this.game.ui.els.gameContainer.appendChild(el);
      this.skillClone = {
        el,
        x: x + cfg.offsetVw,
        y,
        expiresAt: now + cfg.duration,
        lastAttackTime: 0,
        damagePercent: cfg.damagePercent,
        roam: false
      };
      el.classList.add("illusion-spawn-in");
      const spawnMs = scaledRealTimeoutMs(this.game.state, 500);
      this.game.state.trackTimeout(setTimeout(() => {
        el.classList.remove("illusion-spawn-in");
      }, spawnMs));
    }
    /** @param {IllusionCloneState} clone */
    _tickRoamMovement(clone) {
      const { x: px, y: py } = this.game.ui.getPlayerPosition();
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const attackRangePx = this.game.state.stats.attackRange;
      const ax = Number.isFinite(clone.x) ? clone.x : parseFloat(clone.el.style.left);
      const ay = Number.isFinite(clone.y) ? clone.y : parseFloat(clone.el.style.top);
      const step = companionAiStep(
        { x: ax, y: ay },
        {
          ownerX: px,
          ownerY: py,
          enemies: this.game.state.enemies,
          speedVw: clone.speedVw ?? 0.55,
          leashVw: clone.leashVw ?? 14,
          homeOffsetX: clone.homeOffsetX ?? 3.2,
          homeOffsetY: clone.homeOffsetY ?? 0,
          attackRangePx,
          style: "ranged",
          innerWidth: iw,
          innerHeight: ih
        }
      );
      clone.x = step.x;
      clone.y = step.y;
      clone.el.style.left = `${step.x}vw`;
      clone.el.style.top = `${step.y}vh`;
    }
    /** @param {IllusionCloneState} clone */
    _syncSkillPosition(clone) {
      const cfg = getIllusionConfig(this.game.state.skillList.illusion?.level || 1);
      const { x, y } = this.game.ui.getPlayerPosition();
      clone.x = x + cfg.offsetVw;
      clone.y = y;
      clone.el.style.left = `${clone.x}vw`;
      clone.el.style.top = `${clone.y}vh`;
    }
    /** @param {IllusionCloneState} clone @param {number} now */
    _tickCloneAttacks(clone, now) {
      const s = this.game.state;
      if (!clone || s.gamePaused || s.gameOver) return;
      const interval = 1e3 / s.stats.attackSpeed;
      if (now - clone.lastAttackTime < interval) return;
      const x = Number.isFinite(clone.x) ? clone.x : parseFloat(clone.el.style.left);
      const y = Number.isFinite(clone.y) ? clone.y : parseFloat(clone.el.style.top);
      const { x: px, y: py } = this.game.ui.getPlayerPosition();
      clone.lastAttackTime = now;
      clone.el.classList.remove("illusion-attacking");
      void clone.el.offsetWidth;
      clone.el.classList.add("illusion-attacking");
      this.game._attackNearestEnemy(x, y, null, null, {
        rangeCenterX: px,
        rangeCenterY: py,
        damageMultiplier: clone.damagePercent / 100,
        skipPlayerAnim: true,
        projectileClass: "projectile-illusion"
      });
    }
    _removeSkillClone() {
      if (!this.skillClone) return;
      this.skillClone.el.remove();
      this.skillClone = null;
    }
    _removeRoamClone() {
      if (!this.roamClone) return;
      this.roamClone.el.remove();
      this.roamClone = null;
    }
    dismiss() {
      this._removeSkillClone();
      this._removeRoamClone();
    }
    cleanup() {
      this.dismiss();
    }
    isActive() {
      return Boolean(this.roamClone || this.skillClone);
    }
    /** @deprecated Prefer roamClone / skillClone — legacy alias for tests. */
    get clone() {
      return this.skillClone || this.roamClone;
    }
  };

  // js/systems/characterPassives.js
  var CharacterPassiveManager = class {
    /** @param {import('../game/game.js').Game} game */
    constructor(game) {
      this.game = game;
      this.def = null;
      this._lastPulse = 0;
      this._lastSnack = 0;
      this._frenzyUntil = 0;
      this._frenzyReadyAt = 0;
      this._frenzyBonus = 0;
      this._frenzyDurationMs = 0;
      this._shield = 0;
      this._shieldMax = 0;
      this._lastShieldRepair = 0;
      this._zombie = null;
      this._zombieReadyAt = 0;
      this._bears = [];
    }
    /** @param {string} characterName */
    activate(characterName) {
      this.cleanup();
      this.def = getCharacterPassive(characterName);
      if (!this.def) return;
      const now = this._getSimNow();
      if (this.def.id === "paladin") this._initShield(now);
      if (this.def.id === "summoner") this._spawnBears();
      if (this.def.id === "berserker") this._frenzyReadyAt = now;
      if (this.def.id === "necromancer") this._zombieReadyAt = now;
      this.game.ui?.setCharacterPassive?.(this.def);
      this.refreshPassiveHud(now);
    }
    /** @param {number} [now] */
    refreshPassiveHud(now = this._getSimNow()) {
      this.game.ui?.updatePassiveHud?.({
        shield: this._shield,
        shieldMax: this._shieldMax,
        frenzyActive: now < this._frenzyUntil
      });
    }
    _getSimNow() {
      return getSimulatedMs(this.game.state);
    }
    /** @param {number} now */
    tick(now) {
      if (!this.def || this.game.state.gamePaused || this.game.state.gameOver) return;
      switch (this.def.id) {
        case "healer":
          this._tickHealerPulse(now);
          break;
        case "necromancer":
          this._tickNecromancer(now);
          break;
        case "paladin":
          this._tickPaladinShield(now);
          break;
        case "berserker":
          this._tickBerserkerFrenzy(now);
          break;
        case "summoner":
          this._tickBears(now);
          break;
        case "capybara":
          this._tickCapybara(now);
          break;
        case "ranger":
          this._tickRangerIllusion(now);
          break;
        default:
          break;
      }
      this.refreshPassiveHud(now);
    }
    /**
     * @param {object} hitEnemy
     * @param {{ damage: number, isCritical: boolean, missed?: boolean }} result
     */
    onBasicHit(hitEnemy, result) {
      if (!this.def || result?.missed || !hitEnemy) return;
      const ex = parseFloat(hitEnemy.element.style.left);
      const ey = parseFloat(hitEnemy.element.style.top);
      if (this.def.id === "warrior" && rollChance(this.def.params.chance)) {
        this._splashAround(ex, ey, this.def.params.radiusPx, result.damage * this.def.params.splashMult, hitEnemy.id, "fire");
        this.game.effects?.spawnMegaExplosion?.(ex, ey, "fire");
      }
      if (this.def.id === "assassin" && result.isCritical && rollChance(this.def.params.chance)) {
        this._splashAround(ex, ey, this.def.params.radiusPx, result.damage * this.def.params.splashMult, hitEnemy.id, "crit");
      }
    }
    /**
     * @param {number} damage
     * @param {{ element?: string, skillId?: string, tags?: string[] }} [context]
     */
    modifySkillDamage(damage, context = {}) {
      if (!this.def) return damage;
      const tags = context.tags?.length ? context.tags : context.skillId ? getSkillTags(context.skillId) : [];
      if (this.def.id === "elementalist") {
        if (tags.includes("elemental")) {
          return Math.floor(damage * (1 + this.def.params.elementBonus));
        }
        if (context.element && ELEMENTALIST_ELEMENTS.has(context.element)) {
          return Math.floor(damage * (1 + this.def.params.elementBonus));
        }
      }
      if (this.def.id === "slayer") {
        const isPhysicalSkill = tags.includes("physical");
        const isPhysicalElement = context.element === "physical";
        if (isPhysicalSkill || isPhysicalElement) {
          return Math.floor(damage * (1 + this.def.params.physicalBonus));
        }
      }
      return damage;
    }
    /**
     * Flat physical/basic-attack multiplier (Slayer).
     * @param {number} damage
     */
    modifyPhysicalDamage(damage) {
      if (this.def?.id !== "slayer") return damage;
      return Math.floor(damage * (1 + this.def.params.physicalBonus));
    }
    /** @param {number} expGain */
    modifyExpGain(expGain) {
      if (this.def?.id !== "adventurer") return expGain;
      return expGain * (1 + this.def.params.expBonus);
    }
    /** @param {number} damage @returns {number} remaining HP damage */
    absorbDamage(damage) {
      if (this.def?.id !== "paladin" || this._shield <= 0) return damage;
      const blocked = Math.min(this._shield, damage);
      this._shield -= blocked;
      this.refreshPassiveHud();
      return damage - blocked;
    }
    getShieldState() {
      return { current: this._shield, max: this._shieldMax };
    }
    cleanup() {
      this._clearFrenzy();
      this._zombie?.el?.remove();
      this._zombie = null;
      this._bears.forEach((b) => b.el?.remove());
      this._bears = [];
      this._shield = 0;
      this._shieldMax = 0;
      this.def = null;
      this.game.ui?.clearCharacterPassive?.();
    }
    // --- implementation ---
    _initShield(now) {
      this._syncPaladinShieldCap();
      this._shield = this._shieldMax;
      this._lastShieldRepair = now;
    }
    _syncPaladinShieldCap() {
      if (this.def?.id !== "paladin") return;
      const maxHp = this.game.state.stats.maxHp;
      this._shieldMax = Math.max(1, Math.floor(maxHp * this.def.params.shieldPercent / 100));
      this._shield = Math.min(this._shield, this._shieldMax);
    }
    _tickPaladinShield(now) {
      this._syncPaladinShieldCap();
      if (!intervalElapsed(this._lastShieldRepair, this.def.params.repairIntervalMs, now)) return;
      this._lastShieldRepair = now;
      this._shield = this._shieldMax;
      const { x, y } = this.game.ui.getPlayerPosition();
      this.game.effects?.spawnCastFlash?.(x, y, "heal");
    }
    _tickHealerPulse(now) {
      if (now - this._lastPulse < this.def.params.intervalMs) return;
      this._lastPulse = now;
      const { x, y } = this.game.ui.getPlayerPosition();
      const damage = Math.max(1, Math.floor(this.game.state.stats.hpRegen * this.def.params.regenDamageMult));
      this._splashAround(x, y, this.def.params.radiusPx, damage, null, "heal");
      this.game.effects?.spawnCastFlash?.(x, y, "heal");
      this.game.skillRanges?.showImpactArea?.(x, y, this.def.params.radiusPx, "holy", 650);
    }
    _tickCapybara(now) {
      if (now - this._lastSnack < this.def.params.intervalMs) return;
      this._lastSnack = now;
      const s = this.game.state;
      const { x, y } = this.game.ui.getPlayerPosition();
      const damage = Math.max(1, Math.floor(s.stats.physicalDamage * this.def.params.damageMult));
      this._splashAround(x, y, this.def.params.radiusPx, damage, null, "cold");
      this.game.skillRanges?.showImpactArea?.(x, y, this.def.params.radiusPx, "cold", 700);
      const heal = Math.max(1, Math.floor(s.stats.maxHp * this.def.params.healPercent / 100));
      s.stats.hp = Math.min(s.stats.maxHp, s.stats.hp + heal);
      this.game.effects?.spawnDamageNumber?.(x, y - 2, heal, false, "heal");
      this.game.effects?.spawnCastFlash?.(x, y, "cold");
      s.enemies.forEach((enemy) => {
        if (enemy.stats.hp <= 0) return;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        if (distanceVw(x, y, ex, ey, window.innerWidth, window.innerHeight) <= this.def.params.radiusPx) {
          this.game._applySlow?.(enemy, this.def.params.chillPercent, this.def.params.chillDurationMs);
        }
      });
    }
    _tickBerserkerFrenzy(now) {
      if (now < this._frenzyUntil) return;
      this._clearFrenzy();
      if (now < this._frenzyReadyAt) return;
      const bonus = this.game.state.stats.attackSpeed * (this.def.params.bonusPercent / 100);
      this._frenzyBonus = bonus;
      this.game.state.stats.attackSpeed += bonus;
      this._frenzyDurationMs = this.def.params.durationMs;
      this._frenzyUntil = now + this._frenzyDurationMs;
      this._frenzyReadyAt = this._frenzyUntil + (this.def.params.cooldownMs - this.def.params.durationMs);
      this.game.buffTracker?.apply({
        id: "berserker-frenzy",
        name: "Blood Frenzy",
        icon: "\u{1FA78}",
        description: `+${this.def.params.bonusPercent}% attack speed`,
        durationMs: this.def.params.durationMs,
        now
      });
      const { x, y } = this.game.ui.getPlayerPosition();
      this.game.effects?.spawnCastFlash?.(x, y, "fire");
    }
    _clearFrenzy() {
      if (this._frenzyBonus > 0 && this.game.state?.stats) {
        this.game.state.stats.attackSpeed = Math.max(
          0.1,
          this.game.state.stats.attackSpeed - this._frenzyBonus
        );
      }
      this._frenzyBonus = 0;
      this._frenzyUntil = 0;
      this.game.buffTracker?.remove("berserker-frenzy");
    }
    _tickNecromancer(now) {
      if (this._zombie) {
        if (now >= this._zombie.expiresAt) {
          this._zombie.el.remove();
          this._zombie = null;
          this._zombieReadyAt = now + this.def.params.cooldownMs;
          this.game.buffTracker?.remove("raise-zombie");
          return;
        }
        this._tickCombatMinion(this._zombie, now, {
          homeOffsetX: this.def.params.offsetVw,
          homeOffsetY: 0,
          leashVw: 14
        });
        return;
      }
      if (now < this._zombieReadyAt) return;
      this._spawnZombie(now);
    }
    _spawnZombie(now) {
      const { x, y } = this.game.ui.getPlayerPosition();
      const el = document.createElement("div");
      el.className = "passive-minion passive-zombie";
      el.innerHTML = buildCompanionModelHtml("zombie");
      el.style.left = `${x + this.def.params.offsetVw}vw`;
      el.style.top = `${y}vh`;
      this.game.ui.els.gameContainer.appendChild(el);
      this._zombie = {
        el,
        x: x + this.def.params.offsetVw,
        y,
        expiresAt: now + this.def.params.durationMs,
        lastAttack: 0,
        damagePercent: this.def.params.damagePercent,
        moveSpeed: this.def.params.moveSpeed,
        attackIntervalMs: this.def.params.attackIntervalMs
      };
      this.game.buffTracker?.apply({
        id: "raise-zombie",
        name: "Raise Zombie",
        icon: "\u{1F9DF}",
        description: "A zombie fights beside you",
        durationMs: this.def.params.durationMs,
        now
      });
      this.game.effects?.spawnCastFlash?.(x, y, "chaos");
    }
    _spawnBears() {
      const { x, y } = this.game.ui.getPlayerPosition();
      const count = this.def.params.count;
      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * i / count;
        const ox = Math.cos(angle) * this.def.params.orbitVw;
        const oy = Math.sin(angle) * this.def.params.orbitVw;
        const el = document.createElement("div");
        el.className = "passive-minion passive-bear";
        el.innerHTML = buildCompanionModelHtml("bear");
        el.style.left = `${x + ox}vw`;
        el.style.top = `${y + oy}vh`;
        this.game.ui.els.gameContainer.appendChild(el);
        this._bears.push({
          el,
          x: x + ox,
          y: y + oy,
          homeOffsetX: ox,
          homeOffsetY: oy,
          lastAttack: 0,
          damagePercent: this.def.params.damagePercent,
          moveSpeed: this.def.params.moveSpeed,
          attackIntervalMs: this.def.params.attackIntervalMs
        });
      }
    }
    _tickBears(now) {
      this._bears.forEach((bear) => {
        this._tickCombatMinion(bear, now, {
          homeOffsetX: bear.homeOffsetX,
          homeOffsetY: bear.homeOffsetY,
          leashVw: 16
        });
      });
    }
    _tickRangerIllusion(now) {
      const cloneMgr = this.game.illusionClone;
      if (!cloneMgr) return;
      const iw = window.innerWidth;
      const leashVw = Math.max(
        12,
        this.game.state.stats.attackRange / iw * 100 * (this.def.params.roamRadiusFraction || 0.85) + 4
      );
      cloneMgr.ensureRoamingCompanion(now, {
        damagePercent: this.def.params.damagePercent,
        speedVw: 0.55,
        leashVw
      });
    }
    /**
     * Combat minion AI: chase foes, attack in melee, return home.
     */
    _tickCombatMinion(minion, now, opts) {
      const { x: px, y: py } = this.game.ui.getPlayerPosition();
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      const step = companionAiStep(
        { x: minion.x, y: minion.y },
        {
          ownerX: px,
          ownerY: py,
          enemies: this.game.state.enemies,
          speedVw: minion.moveSpeed,
          leashVw: opts.leashVw,
          homeOffsetX: opts.homeOffsetX,
          homeOffsetY: opts.homeOffsetY,
          attackRangePx: 48,
          innerWidth: iw,
          innerHeight: ih
        }
      );
      minion.x = step.x;
      minion.y = step.y;
      minion.el.style.left = `${step.x}vw`;
      minion.el.style.top = `${step.y}vh`;
      if (!step.target || !step.inAttackRange) return;
      if (now - minion.lastAttack < minion.attackIntervalMs) return;
      minion.lastAttack = now;
      const damage = Math.max(1, Math.floor(this.game.state.stats.physicalDamage * minion.damagePercent / 100));
      this.game._dealSkillDamageToEnemy?.(step.target, damage, "physical", false);
      const tx = parseFloat(step.target.element.style.left);
      const ty = parseFloat(step.target.element.style.top);
      const dx = (tx - minion.x) * iw / 100;
      const dy = (ty - minion.y) * ih / 100;
      const len = Math.hypot(dx, dy) || 1;
      minion.el.style.setProperty("--melee-lunge-x", `${dx / len * 10}px`);
      minion.el.style.setProperty("--melee-lunge-y", `${dy / len * 10}px`);
      minion.el.classList.remove("passive-minion-attack");
      void minion.el.offsetWidth;
      minion.el.classList.add("passive-minion-attack");
    }
    _getViewport() {
      return {
        innerWidth: typeof window !== "undefined" ? window.innerWidth : 1920,
        innerHeight: typeof window !== "undefined" ? window.innerHeight : 1080
      };
    }
    _splashAround(cx, cy, radiusPx, damage, excludeId, element) {
      const dmg = Math.max(1, Math.floor(damage));
      const { innerWidth, innerHeight } = this._getViewport();
      const targets = findEnemiesInRadius(
        this.game.state.enemies.map((e) => ({
          id: e.id,
          x: parseFloat(e.element.style.left),
          y: parseFloat(e.element.style.top),
          hp: e.stats.hp,
          ref: e
        })),
        cx,
        cy,
        radiusPx,
        innerWidth,
        innerHeight,
        excludeId
      );
      targets.forEach((t) => {
        if (t.ref) this.game._dealSkillDamageToEnemy?.(t.ref, dmg, element, false);
      });
    }
  };

  // js/systems/buffTracker.js
  var BuffTracker = class {
    constructor() {
      this.buffs = /* @__PURE__ */ new Map();
    }
    /**
     * @param {object} opts
     * @param {string} opts.id
     * @param {string} opts.name
     * @param {string} opts.icon
     * @param {string} opts.description
     * @param {number} opts.durationMs
     * @param {number} [opts.now]
     * @param {number} [opts.stacks]
     */
    apply(opts) {
      const now = opts.now ?? Date.now();
      const durationMs = Math.max(0, opts.durationMs);
      this.buffs.set(opts.id, {
        id: opts.id,
        name: opts.name,
        icon: opts.icon,
        description: opts.description,
        startedAt: now,
        expiresAt: now + durationMs,
        durationMs,
        stacks: opts.stacks ?? 1
      });
      return this.buffs.get(opts.id);
    }
    /** @param {string} id */
    remove(id) {
      this.buffs.delete(id);
    }
    /** @param {string} id */
    has(id) {
      return this.buffs.has(id);
    }
    /** Expire finished buffs. @param {number} now @returns {string[]} removed ids */
    tick(now) {
      const removed = [];
      for (const [id, buff] of this.buffs) {
        if (buff.durationMs > 0 && now >= buff.expiresAt) {
          this.buffs.delete(id);
          removed.push(id);
        }
      }
      return removed;
    }
    /** Snapshot for HUD rendering. @param {number} now */
    getActiveBuffs(now = Date.now()) {
      return [...this.buffs.values()].filter((b) => b.durationMs <= 0 || now < b.expiresAt).map((b) => {
        const remainingMs = b.durationMs <= 0 ? Infinity : Math.max(0, b.expiresAt - now);
        const remainingRatio = b.durationMs <= 0 ? 1 : remainingMs / b.durationMs;
        return {
          ...b,
          remainingMs,
          remainingRatio: Math.max(0, Math.min(1, remainingRatio))
        };
      });
    }
    clear() {
      this.buffs.clear();
    }
  };

  // js/systems/splitterSpawn.js
  function getSplitterFragmentPositions(cx, cy, count) {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + (Math.random() - 0.5) * 0.35;
      const dist = 0.6 + Math.random() * 1.1;
      positions.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist
      });
    }
    return positions;
  }
  function configureSplitFragment(enemy, parentMaxHp) {
    enemy.isSplitFragment = true;
    const hp = Math.max(3, Math.floor(parentMaxHp * 0.18));
    enemy.stats.hp = hp;
    enemy.stats.maxHp = hp;
    enemy.stats.exp = Math.max(1, Math.floor(enemy.stats.exp * 0.35));
    enemy.element.classList.add("enemy-split-fragment");
    enemy.element.title = "Splitter fragment";
  }
  function spawnSplitterFragments(game, ex, ey, splitCount, parentMaxHp) {
    const positions = getSplitterFragmentPositions(ex, ey, splitCount);
    for (const at of positions) {
      const spawned = game._spawnEnemy("normal", "splitFragment", {
        at,
        bypassCap: true,
        skipGroup: true,
        splitFragment: true
      });
      if (spawned) configureSplitFragment(spawned, parentMaxHp);
    }
  }

  // js/systems/enemyDeathEffects.js
  function handleEnemyDeathEffects(game, enemy, ex, ey, grantRewards) {
    if (!grantRewards || !enemy?.typeConfig) return;
    const type = enemy.typeConfig.type;
    if (type === "bomber") {
      triggerBomberExplosion(game, enemy, ex, ey);
    }
    if (type === "splitter" && enemy.rarity !== "boss") {
      spawnSplitterFragments(
        game,
        ex,
        ey,
        enemy.typeConfig.splitCount || 3,
        enemy.stats.maxHp
      );
    }
  }
  function triggerBomberExplosion(game, enemy, ex, ey) {
    const radiusPx = enemy.typeConfig.explosionRadius || 150;
    const damage = enemy.typeConfig.explosionDamage || 28;
    game.effects.spawnMegaExplosion(ex, ey, "fire");
    game.effects.spawnHitEffect(ex, ey, "fire");
    game.skillRanges?.showImpactArea(ex, ey, radiusPx, "fire", 700);
    const s = game.state;
    const { x, y } = game.ui.getPlayerPosition();
    const dist = distanceVw(ex, ey, x, y, window.innerWidth, window.innerHeight);
    if (dist > radiusPx) return;
    if (rollChance(s.stats.evade)) return;
    const abilities = game._getAbilityLevels();
    const dealt = calculatePlayerIncomingDamage({
      enemyDamage: damage,
      playerArmour: s.stats.armour,
      damageReductionLevel: abilities.damageReductionLevel,
      ignoreArmour: false,
      elapsedSeconds: s.elapsedSeconds
    });
    game.dealPlayerDamage(dealt);
  }

  // js/systems/enemySpawn.js
  var SWARM_GROUP_SIZE = { min: 2, max: 5 };
  var SWARM_GROUP_SPREAD_VW = 2.4;
  function getSwarmGroupSizeRange(difficulty = 0) {
    const d = Math.max(0, Number(difficulty) || 0);
    if (d < 6) return { min: 2, max: 2 };
    if (d < 10) return { min: 2, max: 3 };
    if (d < 16) return { min: 2, max: 4 };
    return { min: SWARM_GROUP_SIZE.min, max: SWARM_GROUP_SIZE.max };
  }
  function getSwarmGroupPositions(anchorX, anchorY, count) {
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
  function rollSwarmGroupSize(difficulty = 0) {
    const { min, max } = getSwarmGroupSizeRange(difficulty);
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  function getEdgeSpawnAnchor(edge) {
    switch (edge) {
      case 0:
        return { x: 15 + Math.random() * 70, y: -2 };
      case 1:
        return { x: 102, y: 15 + Math.random() * 70 };
      case 2:
        return { x: 15 + Math.random() * 70, y: 102 };
      default:
        return { x: -2, y: 15 + Math.random() * 70 };
    }
  }

  // js/config/bossWaves.js
  var BOSS_WAVE_INTERVAL = 10;
  var BOSS_WAVE_SWARM_COUNT = { min: 5, max: 8 };
  var BOSS_WAVE_HP_MULT = 2.4;
  function isBossWave(wave) {
    return wave > 0 && wave % BOSS_WAVE_INTERVAL === 0;
  }
  function rollBossWaveSwarmCount() {
    const { min, max } = BOSS_WAVE_SWARM_COUNT;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  // js/systems/enemyProjectiles.js
  var EnemyProjectileManager = class {
    /**
     * @param {import('../game/gameState.js').GameState} state
     * @param {HTMLElement} container
     */
    constructor(state, container) {
      this.state = state;
      this.container = container;
      const budgets = getRuntimeBudgets();
      this._maxProjectiles = budgets.maxProjectiles;
      this._speedVwPerSec = budgets.projectileSpeedVwPerSec;
      this._maxStepVw = budgets.projectileMaxStepVw;
      this._hitRadius = budgets.projectileHitRadius;
      this.projectiles = [];
      this._domPool = new DomPool(() => {
        const el = document.createElement("div");
        el.className = "enemy-projectile";
        return el;
      }, RUNTIME_BUDGET.poolPrewarm.projectiles);
    }
    get activeCount() {
      return this.projectiles.length;
    }
    /** @param {EnemyProjectileSpec} spec */
    spawn(spec) {
      while (this.projectiles.length >= this._maxProjectiles) {
        this._removeAt(0);
      }
      const el = this._domPool.acquire();
      if (!el.parentElement) this.container.appendChild(el);
      el.style.left = `${spec.x}vw`;
      el.style.top = `${spec.y}vh`;
      this.projectiles.push({
        el,
        x: spec.x,
        y: spec.y,
        ownerId: spec.ownerId ?? null,
        onHit: spec.onHit
      });
    }
    /** Remove all projectiles fired by a dead or despawned enemy. */
    removeForOwner(ownerId) {
      if (!ownerId) return;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        if (this.projectiles[i].ownerId === ownerId) {
          this._removeAt(i);
        }
      }
    }
    /**
     * Advance all live projectiles in simulated time (called from the main game tick).
     * @param {number} simDeltaMs
     * @param {EnemyProjectileTickContext} ctx
     */
    tick(simDeltaMs, ctx) {
      if (simDeltaMs <= 0 || this.projectiles.length === 0) return;
      if (this.state.gamePaused || this.state.gameOver) {
        this.clearAll();
        return;
      }
      const totalStepVw = this._speedVwPerSec * (simDeltaMs / 1e3);
      const { getPlayerPosition, innerWidth, innerHeight } = ctx;
      const { x: px, y: py } = getPlayerPosition();
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const projectile = this.projectiles[i];
        if (projectile.ownerId && !this._isOwnerAlive(projectile.ownerId)) {
          this._removeAt(i);
          continue;
        }
        if (this._isAtPlayer(projectile.x, projectile.y, px, py, innerWidth, innerHeight)) {
          projectile.onHit?.();
          this._removeAt(i);
          continue;
        }
        const hit = this._advanceTowardPlayer(
          projectile,
          totalStepVw,
          px,
          py,
          innerWidth,
          innerHeight
        );
        projectile.el.style.left = `${projectile.x}vw`;
        projectile.el.style.top = `${projectile.y}vh`;
        if (hit) {
          projectile.onHit?.();
          this._removeAt(i);
        }
      }
    }
    /**
     * Move in capped sub-steps with swept segment tests so large 4× sim deltas cannot tunnel.
     * @returns {boolean} true when the path intersects the player this tick
     */
    _advanceTowardPlayer(projectile, totalStepVw, px, py, innerWidth, innerHeight) {
      const angle = Math.atan2(py - projectile.y, px - projectile.x);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      let remaining = totalStepVw;
      while (remaining > 0) {
        const step = Math.min(this._maxStepVw, remaining);
        const fromX = projectile.x;
        const fromY = projectile.y;
        projectile.x += cos * step;
        projectile.y += sin * step;
        remaining -= step;
        if (this._segmentHitsPlayer(fromX, fromY, projectile.x, projectile.y, px, py, innerWidth, innerHeight)) {
          return true;
        }
      }
      return false;
    }
    _isAtPlayer(x, y, px, py, innerWidth, innerHeight) {
      return distanceVw(x, y, px, py, innerWidth, innerHeight) < this._hitRadius;
    }
    _segmentHitsPlayer(x1, y1, x2, y2, px, py, innerWidth, innerHeight) {
      if (this._isAtPlayer(x2, y2, px, py, innerWidth, innerHeight)) return true;
      const pxPx = px * innerWidth / 100;
      const pyPx = py * innerHeight / 100;
      const segX1 = x1 * innerWidth / 100;
      const segY1 = y1 * innerHeight / 100;
      const segX2 = x2 * innerWidth / 100;
      const segY2 = y2 * innerHeight / 100;
      return distancePointToSegmentPx(pxPx, pyPx, segX1, segY1, segX2, segY2) < this._hitRadius;
    }
    /** @param {string} ownerId */
    _isOwnerAlive(ownerId) {
      return this.state.enemies.some(
        (e) => e.id === ownerId && (e.stats?.hp ?? 0) > 0
      );
    }
    /** @param {number} index */
    _removeAt(index) {
      const entry = this.projectiles[index];
      if (!entry) return;
      this._domPool.release(entry.el);
      this.projectiles.splice(index, 1);
    }
    clearAll() {
      while (this.projectiles.length > 0) {
        this._removeAt(0);
      }
    }
    destroy() {
      this.clearAll();
      this._domPool.clear(this.container);
    }
  };

  // js/config/enemyGuide.js
  var ENEMY_GUIDE_ENTRIES = [
    {
      type: "grunt",
      label: "Grunt",
      color: ENEMY_TYPE_COLORS.grunt,
      tag: "Melee",
      description: "Standard chaser. Balanced HP and damage."
    },
    {
      type: "swarm",
      label: "Swarm",
      color: ENEMY_TYPE_COLORS.swarm,
      tag: "Fast",
      description: "Small, fast, low HP. Spawns in groups of 3\u20135 from the edge."
    },
    {
      type: "tank",
      label: "Tank",
      color: ENEMY_TYPE_COLORS.tank,
      tag: "Armoured",
      description: "High HP and armour. Slow but hits hard."
    },
    {
      type: "archer",
      label: "Archer",
      color: ENEMY_TYPE_COLORS.archer,
      tag: "Ranged",
      description: "Stops at range and shoots green projectiles."
    },
    {
      type: "dasher",
      label: "Dasher",
      color: ENEMY_TYPE_COLORS.dasher,
      tag: "Dash",
      description: "Spawns alone. Periodically dashes toward you for burst speed."
    },
    {
      type: "splitter",
      label: "Splitter",
      color: ENEMY_TYPE_COLORS.splitter,
      tag: "Split",
      description: "On death, splits into fast orange fragments at the death spot."
    },
    {
      type: "bomber",
      label: "Bomber",
      color: ENEMY_TYPE_COLORS.bomber,
      tag: "Explode",
      description: "Dark armored mine. Explodes on death if you are nearby."
    },
    {
      type: "penetrator",
      label: "Penetrator",
      color: ENEMY_TYPE_COLORS.penetrator,
      tag: "Pierce",
      description: "Teal spike \u2014 attacks ignore your armour mitigation."
    },
    {
      type: "wraith",
      label: "Wraith",
      color: ENEMY_TYPE_COLORS.wraith,
      tag: "Evade",
      description: "High evade \u2014 your attacks can miss. Evade rises with wave."
    }
  ];

  // js/ui/enemyGuidePanel.js
  var PANEL_WIDTH_PX = 300;
  var PANEL_GAP_PX = 8;
  var PLACEMENT_CLASSES = ["placement-right", "placement-left", "placement-center"];
  var EnemyGuidePanel = class {
    constructor() {
      this.root = document.getElementById("enemy-guide-panel");
      this.toggleBtn = document.getElementById("enemy-guide-toggle");
      this.body = document.getElementById("enemy-guide-body");
      this.expanded = false;
      this._pausedHidden = false;
      if (!this.root) return;
      this._resetDomState();
      this._renderEntries();
      this.toggleBtn?.addEventListener("click", () => this.toggle());
    }
    _resetDomState() {
      if (!this.root) return;
      this.root.classList.remove("expanded", ...PLACEMENT_CLASSES);
      this.root.classList.remove("enemy-guide-panel--paused-hidden");
      this.toggleBtn?.setAttribute("aria-expanded", "false");
      this.expanded = false;
      this._pausedHidden = false;
    }
    _renderEntries() {
      if (!this.body) return;
      this.body.innerHTML = ENEMY_GUIDE_ENTRIES.map((entry) => `
            <div class="enemy-guide-row" data-type="${entry.type}">
                <span class="enemy-guide-swatch" style="background:${entry.color}"></span>
                <div class="enemy-guide-text">
                    <div class="enemy-guide-title">
                        <strong style="color:${entry.color}">${entry.label}</strong>
                        <span class="enemy-guide-tag">${entry.tag}</span>
                    </div>
                    <p class="enemy-guide-desc">${entry.description}</p>
                </div>
            </div>
        `).join("");
    }
    toggle() {
      this.expanded = !this.expanded;
      this.root?.classList.toggle("expanded", this.expanded);
      if (this.toggleBtn) {
        this.toggleBtn.setAttribute("aria-expanded", String(this.expanded));
      }
      if (this.expanded) {
        this._updateBodyPlacement();
      } else {
        this.root?.classList.remove(...PLACEMENT_CLASSES);
      }
    }
    collapse() {
      this.expanded = false;
      this.root?.classList.remove("expanded", ...PLACEMENT_CLASSES);
      this.toggleBtn?.setAttribute("aria-expanded", "false");
    }
    /** Hide the entire panel while the game is paused (ESC menu). */
    setPausedHidden(hidden) {
      this._pausedHidden = hidden;
      if (!this.root) return;
      this.root.classList.toggle("enemy-guide-panel--paused-hidden", hidden);
      if (hidden) this.collapse();
    }
    isPausedHidden() {
      return this._pausedHidden;
    }
    /**
     * Prefer opening to the right of the toggle; flip left or center when cramped.
     * @param {number} [viewportWidth]
     */
    _updateBodyPlacement(viewportWidth = typeof window !== "undefined" ? window.innerWidth : MOBILE_BREAKPOINT_PX + 1) {
      if (!this.root || !this.toggleBtn) return;
      this.root.classList.remove(...PLACEMENT_CLASSES);
      if (isMobileViewport(viewportWidth)) {
        this.root.classList.add("placement-center");
        return;
      }
      const toggleRect = this.toggleBtn.getBoundingClientRect();
      const bodyWidth = Math.min(PANEL_WIDTH_PX, viewportWidth - 24);
      const spaceRight = viewportWidth - toggleRect.right - PANEL_GAP_PX;
      const spaceLeft = toggleRect.left - PANEL_GAP_PX;
      if (spaceRight >= bodyWidth) {
        this.root.classList.add("placement-right");
      } else if (spaceLeft >= bodyWidth) {
        this.root.classList.add("placement-left");
      } else {
        this.root.classList.add("placement-center");
      }
    }
  };

  // js/ui/bossHud.js
  var BossHud = class {
    constructor() {
      this.root = null;
      this.label = null;
      this.fill = null;
      this.value = null;
      this._bossId = null;
      this._priority = 0;
      this._ensureDom();
    }
    /** Lazy DOM bind — safe if constructed before first paint. */
    _ensureDom() {
      if (!this.root) this.root = document.getElementById("final-boss-hud");
      if (!this.label) this.label = document.getElementById("boss-hud-label");
      if (!this.fill) this.fill = document.getElementById("final-boss-hp-fill");
      if (!this.value) this.value = document.getElementById("final-boss-hp-value");
    }
    /** @param {{ id: string, milestoneBossWave?: number, stats: { hp: number, maxHp: number } }} enemy */
    track(enemy) {
      this._ensureDom();
      const wave = enemy?.milestoneBossWave;
      if (!this.root || !wave || !BOSS_HUD_LABELS[wave]) return;
      const priority = BOSS_HUD_PRIORITY[wave] ?? 0;
      if (this._bossId && this._priority > priority) return;
      this._bossId = enemy.id;
      this._priority = priority;
      if (this.label) this.label.textContent = BOSS_HUD_LABELS[wave];
      this._show();
      this.update(enemy);
    }
    /**
     * Self-healing sync — ensures the HUD tracks a living milestone boss even if
     * the initial track() was missed (e.g. spawn race or DOM not ready).
     * @param {Array<{ id: string, milestoneBossWave?: number, stats?: { hp?: number, maxHp?: number } }>} enemies
     */
    syncFromEnemies(enemies) {
      this._ensureDom();
      const living = findLivingMilestoneBoss(enemies);
      if (!living) {
        if (this._bossId && !enemies.some(
          (e) => e.id === this._bossId && (e.stats?.hp ?? 0) > 0
        )) {
          this.clear();
        }
        return;
      }
      if (!this._bossId || this._bossId !== living.id) {
        this.track(living);
        return;
      }
      this.update(living);
    }
    /** @param {{ id: string, milestoneBossWave?: number, stats: { hp: number, maxHp: number } }} enemy */
    update(enemy) {
      if (!this.root || !enemy?.milestoneBossWave || enemy.id !== this._bossId) return;
      const maxHp = Math.max(1, enemy.stats.maxHp);
      const hp = Math.max(0, Math.floor(enemy.stats.hp));
      const pct = Math.min(100, hp / maxHp * 100);
      if (this.fill) this.fill.style.width = `${pct}%`;
      if (this.value) this.value.textContent = `${hp} / ${maxHp}`;
    }
    /**
     * Clear tracking for a defeated boss; retarget a lower-priority milestone boss if one remains.
     * @param {{ id: string }} enemy
     * @param {Array<{ id: string, milestoneBossWave?: number, stats?: { hp?: number } }>} [enemies]
     */
    onBossDeath(enemy, enemies = []) {
      if (!enemy || enemy.id !== this._bossId) return;
      this.clear();
      const next = findLivingMilestoneBoss(enemies);
      if (next) this.track(next);
    }
    _show() {
      if (!this.root) return;
      this.root.hidden = false;
      this.root.classList.add("final-boss-hud--active");
    }
    clear() {
      this._bossId = null;
      this._priority = 0;
      if (this.root) {
        this.root.hidden = true;
        this.root.classList.remove("final-boss-hud--active");
      }
      if (this.fill) this.fill.style.width = "0%";
      if (this.value) this.value.textContent = "";
    }
    isTracking(enemyId) {
      return Boolean(this._bossId && this._bossId === enemyId);
    }
  };

  // js/config/enemyScaling.js
  var WAVE_100_HP_RAMP_SECONDS = 180;
  var WAVE_100_MAX_LATE_HP_BONUS = 0.45;
  var POST_FINAL_WAVE_STAT_STEP = 0.3;
  var WAVE_DAMAGE_RAMP = {
    startWave: 50,
    endWave: 100,
    totalBonus: 0.25
  };
  function getWaveDamageRampMultiplier(currentWave) {
    const { startWave, endWave, totalBonus } = WAVE_DAMAGE_RAMP;
    if (currentWave <= startWave) return 1;
    if (currentWave >= endWave) return 1 + totalBonus;
    const progress = (currentWave - startWave) / (endWave - startWave);
    return 1 + totalBonus * progress;
  }
  function getWave100LateGameHpMultiplier(elapsedSeconds, currentWave) {
    const wave = currentWave ?? getWaveNumber(elapsedSeconds);
    if (wave < FINAL_VICTORY_WAVE) return 1;
    const waveStartSec = (FINAL_VICTORY_WAVE - 1) * BALANCE.difficultyIntervalSec;
    const intoWave = Math.max(0, elapsedSeconds - waveStartSec);
    const t = Math.min(1, intoWave / WAVE_100_HP_RAMP_SECONDS);
    return 1 + WAVE_100_MAX_LATE_HP_BONUS * t;
  }
  function getPostFinalWaveStatMultiplier(currentWave) {
    if (currentWave <= FINAL_VICTORY_WAVE) return 1;
    const steps = currentWave - FINAL_VICTORY_WAVE;
    return 1 + POST_FINAL_WAVE_STAT_STEP * steps;
  }
  function getEnemyHpRuntimeMultiplier(elapsedSeconds, currentWave) {
    return getWave100LateGameHpMultiplier(elapsedSeconds, currentWave);
  }
  function applyPostFinalWaveStatScaling(stats, currentWave) {
    if (!stats) return stats;
    const mult = getPostFinalWaveStatMultiplier(currentWave);
    if (mult === 1) return stats;
    stats.hp = Math.max(1, Math.floor(stats.hp * mult + 1e-9));
    stats.maxHp = stats.hp;
    stats.physicalDamage = Math.max(1, Math.floor(stats.physicalDamage * mult + 1e-9));
    if (typeof stats.armour === "number") {
      stats.armour = Math.max(0, Math.floor(stats.armour * mult + 1e-9));
    }
    if (typeof stats.attackSpeed === "number" && stats.attackSpeed > 0) {
      stats.attackSpeed = stats.attackSpeed * mult;
    }
    return stats;
  }
  function applyRuntimeEnemyScaling(stats, elapsedSeconds, currentWave) {
    if (!stats) return stats;
    const wave = currentWave ?? getWaveNumber(elapsedSeconds);
    applyPostFinalWaveStatScaling(stats, wave);
    const dmgRamp = getWaveDamageRampMultiplier(wave);
    if (dmgRamp !== 1 && typeof stats.physicalDamage === "number") {
      stats.physicalDamage = Math.max(1, Math.floor(stats.physicalDamage * dmgRamp + 1e-9));
    }
    const hpMult = getEnemyHpRuntimeMultiplier(elapsedSeconds, currentWave);
    if (hpMult === 1) return stats;
    stats.hp = Math.max(1, Math.floor(stats.hp * hpMult + 1e-9));
    stats.maxHp = stats.hp;
    return stats;
  }
  function getFinalVictoryReinforcementIntervalMs(elapsedSeconds, currentWave) {
    const escalation = getWave100LateGameHpMultiplier(elapsedSeconds, currentWave);
    return Math.max(650, Math.floor(4200 / escalation));
  }
  function rollFinalVictoryReinforcementSwarmSize(elapsedSeconds, currentWave) {
    const escalation = getWave100LateGameHpMultiplier(elapsedSeconds, currentWave);
    const min = 4 + Math.floor(escalation * 4);
    const max = min + 4 + Math.floor(escalation * 6);
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  // js/systems/achievementContext.js
  function trackRunStatPeaks(state) {
    if (!state?.stats) return;
    if (!state.runStatPeaks) {
      state.runStatPeaks = createEmptyRunStatPeaks();
    }
    const st = state.stats;
    const peaks = state.runStatPeaks;
    peaks.maxHp = Math.max(peaks.maxHp, st.maxHp || 0);
    peaks.critChance = Math.max(peaks.critChance, st.critChance || 0);
    peaks.critMultiplier = Math.max(peaks.critMultiplier, st.critMultiplier || 0);
    peaks.hpRegen = Math.max(peaks.hpRegen, st.hpRegen || 0);
    peaks.physicalDamage = Math.max(peaks.physicalDamage, st.physicalDamage || 0);
    if (peaks.maxHp > (state.maxHpReached || 0)) {
      state.maxHpReached = peaks.maxHp;
    }
  }
  function createEmptyRunStatPeaks() {
    return {
      maxHp: 0,
      critChance: 0,
      critMultiplier: 0,
      hpRegen: 0,
      physicalDamage: 0
    };
  }
  function buildAchievementContext({ state, killStreak, treasureEvents, gearInventory, meta }) {
    trackRunStatPeaks(state);
    const peaks = state.runStatPeaks ?? createEmptyRunStatPeaks();
    const equipped = gearInventory?.equipped || {};
    const equippedValues = Object.values(equipped).filter(Boolean);
    const skillEntries = Object.values(state.skillList || {});
    return {
      killCount: state.killCount,
      level: state.stats?.level ?? 0,
      elapsedSeconds: state.elapsedSeconds,
      bestStreak: killStreak?.bestStreak ?? 0,
      treasuresOpened: treasureEvents?.treasuresOpened ?? 0,
      itemsLooted: state.itemsLooted ?? 0,
      equippedRareCount: equippedValues.filter((i) => i.rarity === "rare" || i.rarity === "unique").length,
      equippedUniqueCount: equippedValues.filter((i) => i.rarity === "unique").length,
      equippedGearCount: gearInventory?.getEquippedCount?.() ?? 0,
      currentWave: state.currentWave,
      maxWaveReached: state.maxWaveReached ?? state.currentWave,
      skillLevelSum: skillEntries.reduce((sum, sk) => sum + (sk?.level || 0), 0),
      skillsAtMax: skillEntries.filter((sk) => sk && sk.level >= (sk.maxLevel || 5)).length,
      elitesKilled: state.elitesKilled ?? 0,
      bossesKilled: state.bossesKilled ?? 0,
      maxHpReached: peaks.maxHp,
      maxHp: state.stats?.maxHp ?? 0,
      critChanceReached: peaks.critChance,
      critMultiplierReached: peaks.critMultiplier,
      hpRegenReached: peaks.hpRegen,
      physicalDamageReached: peaks.physicalDamage,
      charactersBeatGame: countCharactersBeatGame(meta),
      finalVictoryAchieved: Boolean(state.finalVictoryAchieved)
    };
  }
  function reconcileMetaAchievements(meta) {
    return evaluateAchievements(meta, buildMetaOnlyAchievementContext(meta));
  }
  function buildMetaOnlyAchievementContext(meta) {
    return {
      killCount: 0,
      level: 0,
      elapsedSeconds: 0,
      bestStreak: 0,
      treasuresOpened: 0,
      itemsLooted: 0,
      equippedRareCount: 0,
      equippedGearCount: 0,
      charactersBeatGame: countCharactersBeatGame(meta),
      finalVictoryAchieved: false
    };
  }

  // js/systems/audioManager.js
  var BGM_MP3_PATH = "audio/bgm.mp3";
  var STORAGE_BGM_VOL = "survivor-audio-bgm-vol";
  var STORAGE_SFX_VOL = "survivor-audio-sfx-vol";
  var DEFAULT_BGM_VOLUME = 50;
  var DEFAULT_SFX_VOLUME = 100;
  var BGM_MP3_LOAD_TIMEOUT_MS = 15e3;
  function volumePercentToGain(percent) {
    const p = clampVolume(percent) / 100;
    if (p <= 0) return 0;
    return Math.pow(p, 1.35) * 0.9;
  }
  function clampVolume(percent) {
    const n = Number(percent);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }
  var AudioManager = class {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.bgmGain = null;
      this.sfxGain = null;
      this._bgmNodes = [];
      this._bgmIntervalId = null;
      this._noiseBuffer = null;
      this._bgmAudioEl = null;
      this._bgmMediaSource = null;
      this._usingMp3 = false;
      this._mp3FallbackTimer = null;
      this.bgmVolume = DEFAULT_BGM_VOLUME;
      this.sfxVolume = DEFAULT_SFX_VOLUME;
      this._unlocked = false;
      this._bgmStep = 0;
      this._loadPrefs();
    }
    _loadPrefs() {
      try {
        const bgm = localStorage.getItem(STORAGE_BGM_VOL);
        const sfx = localStorage.getItem(STORAGE_SFX_VOL);
        if (bgm !== null) {
          this.bgmVolume = clampVolume(bgm);
        } else {
          const legacy = localStorage.getItem("survivor-audio-bgm-muted");
          this.bgmVolume = legacy === "0" ? 45 : DEFAULT_BGM_VOLUME;
        }
        if (sfx !== null) {
          this.sfxVolume = clampVolume(sfx);
        } else {
          const legacy = localStorage.getItem("survivor-audio-sfx-muted");
          this.sfxVolume = legacy === "1" ? 0 : DEFAULT_SFX_VOLUME;
        }
      } catch (_) {
      }
    }
    _savePrefs() {
      try {
        localStorage.setItem(STORAGE_BGM_VOL, String(this.bgmVolume));
        localStorage.setItem(STORAGE_SFX_VOL, String(this.sfxVolume));
      } catch (_) {
      }
    }
    getBgmVolume() {
      return this.bgmVolume;
    }
    getSfxVolume() {
      return this.sfxVolume;
    }
    isBgmMuted() {
      return this.bgmVolume <= 0;
    }
    isSfxMuted() {
      return this.sfxVolume <= 0;
    }
    isUsingMp3Bgm() {
      return this._usingMp3;
    }
    /**
     * @param {number} percent 0–100
     * @returns {number} applied volume
     */
    setBgmVolume(percent) {
      const next = clampVolume(percent);
      const wasSilent = this.bgmVolume <= 0;
      this.bgmVolume = next;
      this._savePrefs();
      this._applyVolumes();
      if (next > 0 && this._unlocked) {
        if (wasSilent || !this._bgmNodes.length && !this._usingMp3) this.startBgm();
      } else if (next <= 0) {
        this.stopBgm();
      }
      return this.bgmVolume;
    }
    /**
     * @param {number} percent 0–100
     * @returns {number} applied volume
     */
    setSfxVolume(percent) {
      this.sfxVolume = clampVolume(percent);
      this._savePrefs();
      this._applyVolumes();
      return this.sfxVolume;
    }
    /** Call after first user gesture to unlock AudioContext. */
    async unlock() {
      if (this._unlocked) {
        if (this.ctx?.state === "suspended") {
          try {
            await this.ctx.resume();
          } catch (_) {
          }
        }
        this._ensureBgmPlaying();
        return this.ctx;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 1;
      this._noiseBuffer = this._createNoiseBuffer(1.2);
      this._applyVolumes();
      this._unlocked = true;
      this._ensureBgmPlaying();
      return this.ctx;
    }
    /** Start or resume BGM when volume is up and audio is unlocked. */
    _ensureBgmPlaying() {
      if (!this._unlocked || this.bgmVolume <= 0) return;
      if (this._usingMp3 && this._bgmAudioEl && !this._bgmAudioEl.paused) return;
      if (this._usingMp3 && this._bgmAudioEl?.paused) {
        this._bgmAudioEl.play().catch(() => {
        });
        return;
      }
      if (!this._usingMp3 && !this._bgmNodes.length) this.startBgm();
    }
    _applyVolumes() {
      if (!this.bgmGain || !this.sfxGain) return;
      this.bgmGain.gain.value = volumePercentToGain(this.bgmVolume) * 1.15;
      this.sfxGain.gain.value = volumePercentToGain(this.sfxVolume);
      if (this._bgmAudioEl) {
        this._bgmAudioEl.volume = Math.min(1, volumePercentToGain(this.bgmVolume));
      }
    }
    _createNoiseBuffer(seconds = 1) {
      if (!this.ctx) return null;
      const len = Math.floor(this.ctx.sampleRate * seconds);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return buf;
    }
    /**
     * Prefer looping MP3 at BGM_MP3_PATH; fall back to fun procedural track.
     */
    startBgm() {
      if (!this.ctx || this.bgmVolume <= 0) return;
      if (this._usingMp3 || this._bgmNodes.length) return;
      this._tryStartMp3Bgm();
    }
    _clearMp3FallbackTimer() {
      if (this._mp3FallbackTimer != null) {
        clearTimeout(this._mp3FallbackTimer);
        this._mp3FallbackTimer = null;
      }
    }
    _tryStartMp3Bgm() {
      if (typeof Audio === "undefined") {
        this._startProceduralHappyBgm();
        return;
      }
      let settled = false;
      const fail = () => {
        if (settled) return;
        settled = true;
        this._clearMp3FallbackTimer();
        if (this._bgmAudioEl) {
          try {
            this._bgmAudioEl.pause();
            this._bgmAudioEl.removeAttribute("src");
            this._bgmAudioEl.load?.();
          } catch (_) {
          }
          this._bgmAudioEl = null;
        }
        this._usingMp3 = false;
        this._startProceduralHappyBgm();
      };
      const el = new Audio(BGM_MP3_PATH);
      el.loop = true;
      el.preload = "auto";
      el.volume = Math.min(1, volumePercentToGain(this.bgmVolume));
      this._bgmAudioEl = el;
      const onPlaying = () => {
        if (settled) return;
        settled = true;
        this._clearMp3FallbackTimer();
        this._usingMp3 = true;
        el.volume = Math.min(1, volumePercentToGain(this.bgmVolume));
      };
      const tryPlay = () => {
        if (settled || this._usingMp3 || this.bgmVolume <= 0) return;
        try {
          const playPromise = el.play();
          if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(onPlaying).catch(fail);
          } else {
            onPlaying();
          }
        } catch (_) {
          fail();
        }
      };
      el.addEventListener("error", fail, { once: true });
      el.addEventListener("loadeddata", tryPlay, { once: true });
      el.addEventListener("canplay", tryPlay, { once: true });
      el.addEventListener("canplaythrough", tryPlay, { once: true });
      try {
        el.load();
      } catch (_) {
        fail();
        return;
      }
      this._clearMp3FallbackTimer();
      this._mp3FallbackTimer = setTimeout(() => {
        if (!this._usingMp3 && !this._bgmNodes.length && this.bgmVolume > 0 && !settled) {
          fail();
        }
      }, BGM_MP3_LOAD_TIMEOUT_MS);
    }
    /** Soft major-key pad only — no arpeggio beeps / noise (avoids machine tune). */
    _startProceduralHappyBgm() {
      if (!this.ctx || this.bgmVolume <= 0 || this._bgmNodes.length || this._usingMp3) return;
      const now = this.ctx.currentTime;
      [
        { f: 130.81, g: 0.014 },
        { f: 196, g: 0.01 },
        { f: 261.63, g: 0.012 },
        { f: 329.63, g: 8e-3 }
      ].forEach(({ f, g }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = "sine";
        osc.frequency.value = f;
        filter.type = "lowpass";
        filter.frequency.value = 650;
        filter.Q.value = 0.4;
        gain.gain.value = g;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(now);
        this._bgmNodes.push(osc, filter, gain);
      });
      this._bgmStep = 0;
      this._bgmIntervalId = setInterval(() => this._swellHappyBgmPad(), 2400);
    }
    /** Soft amplitude swell — musical, not a beep metronome. */
    _swellHappyBgmPad() {
      if (!this.ctx || this.bgmVolume <= 0 || this._usingMp3 || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = "sine";
      osc.frequency.value = 392;
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(1e-4, t);
      gain.gain.linearRampToValueAtTime(0.012, t + 0.35);
      gain.gain.linearRampToValueAtTime(1e-4, t + 1.8);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(t);
      osc.stop(t + 1.9);
    }
    stopBgm() {
      this._clearMp3FallbackTimer();
      if (this._bgmIntervalId != null) {
        clearInterval(this._bgmIntervalId);
        this._bgmIntervalId = null;
      }
      if (this._bgmAudioEl) {
        try {
          this._bgmAudioEl.pause();
          this._bgmAudioEl.currentTime = 0;
        } catch (_) {
        }
        this._bgmAudioEl = null;
      }
      this._usingMp3 = false;
      this._bgmNodes.forEach((node) => {
        try {
          if ("stop" in node && typeof node.stop === "function") node.stop();
          node.disconnect?.();
        } catch (_) {
        }
      });
      this._bgmNodes = [];
    }
    /**
     * @param {SfxId|string} type
     */
    playSfx(type) {
      if (!this.ctx || this.sfxVolume <= 0) return;
      if (this.ctx.state === "suspended") this.ctx.resume();
      switch (type) {
        case "attack":
        case "hit":
          this._sfxAttack();
          break;
        case "hurt":
          this._sfxHurt();
          break;
        case "kill":
          this._sfxKill();
          break;
        case "loot":
          this._sfxLoot();
          break;
        case "levelup":
          this._sfxLevelUp();
          break;
        case "ui":
          this._sfxUi();
          break;
        case "fireball":
        case "righteousFire":
          this._sfxFire();
          break;
        case "iceNova":
        case "frostbolt":
          this._sfxIce(type === "iceNova");
          break;
        case "lightningArc":
        case "spark":
          this._sfxLightning();
          break;
        case "poisonBottle":
        case "poisonDagger":
          this._sfxPoison();
          break;
        case "hammerSweep":
          this._sfxPhysicalImpact();
          break;
        case "throwSpear":
          this._sfxSpear();
          break;
        case "healingWave":
          this._sfxHeal();
          break;
        case "illusion":
          this._sfxIllusion();
          break;
        case "skill":
          this._sfxUi();
          break;
        default:
          break;
      }
    }
    /** @param {string} skillId */
    playSkillSfx(skillId) {
      this.playSfx(skillId);
    }
    // --- Layered SFX ---
    /** Realistic sword/arrow cut — slash noise + steel body. */
    _sfxAttack() {
      this._noiseBurst({ dur: 0.045, vol: 0.14, filterFreq: 3200, filterType: "bandpass", slideFilter: 900 });
      this._tone({ freq: 220, dur: 0.08, type: "sawtooth", vol: 0.12, slide: -0.45, filterFreq: 1600 });
      this._tone({ freq: 780, dur: 0.035, type: "triangle", vol: 0.08, slide: -0.25, filterFreq: 4e3, delay: 0.01 });
      this._noiseBurst({ dur: 0.03, vol: 0.06, filterFreq: 5e3, filterType: "highpass", delay: 0.02 });
    }
    /** Heavy hammer thud. */
    _sfxPhysicalImpact() {
      this._tone({ freq: 90, dur: 0.12, type: "sine", vol: 0.16, slide: -0.35, filterFreq: 500 });
      this._noiseBurst({ dur: 0.08, vol: 0.12, filterFreq: 700, filterType: "lowpass" });
      this._tone({ freq: 180, dur: 0.06, type: "triangle", vol: 0.08, delay: 0.02, slide: -0.2 });
    }
    /** Spear whoosh + impact. */
    _sfxSpear() {
      this._noiseBurst({ dur: 0.07, vol: 0.1, filterFreq: 2800, filterType: "bandpass", slideFilter: 1200 });
      this._tone({ freq: 340, dur: 0.09, type: "triangle", vol: 0.11, slide: -0.3, filterFreq: 1800 });
      this._tone({ freq: 160, dur: 0.05, type: "sine", vol: 0.07, delay: 0.04 });
    }
    _sfxHurt() {
      this._tone({ freq: 110, dur: 0.16, type: "sine", vol: 0.14, slide: -0.25, filterFreq: 400 });
      this._noiseBurst({ dur: 0.1, vol: 0.05, filterFreq: 500, filterType: "lowpass" });
    }
    _sfxKill() {
      this._tone({ freq: 360, dur: 0.06, type: "triangle", vol: 0.12, slide: 0.15 });
      this._tone({ freq: 540, dur: 0.1, type: "sine", vol: 0.1, slide: 0.2, delay: 0.04 });
    }
    _sfxLoot() {
      this._tone({ freq: 880, dur: 0.07, type: "sine", vol: 0.11, slide: 0.05 });
      this._tone({ freq: 1175, dur: 0.1, type: "triangle", vol: 0.09, delay: 0.05 });
      this._tone({ freq: 1480, dur: 0.12, type: "sine", vol: 0.07, delay: 0.1 });
    }
    _sfxLevelUp() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        this._tone({ freq: f, dur: 0.16, type: "sine", vol: 0.11 - i * 0.012, delay: i * 0.08 });
      });
    }
    _sfxUi() {
      this._tone({ freq: 720, dur: 0.04, type: "sine", vol: 0.08 });
    }
    /** Fire whoosh + crackle. */
    _sfxFire() {
      this._noiseBurst({ dur: 0.2, vol: 0.18, filterFreq: 1200, filterType: "bandpass", slideFilter: 3e3 });
      this._tone({ freq: 140, dur: 0.14, type: "sawtooth", vol: 0.11, slide: 0.55, filterFreq: 900 });
      this._noiseBurst({ dur: 0.09, vol: 0.08, filterFreq: 3500, filterType: "highpass", delay: 0.04 });
    }
    /** Ice: crystalline ping + crunch. */
    _sfxIce(isNova) {
      this._tone({ freq: 920, dur: 0.08, type: "sine", vol: 0.12, slide: -0.08 });
      this._tone({ freq: 1380, dur: 0.1, type: "triangle", vol: 0.09, slide: -0.12, delay: 0.02 });
      this._noiseBurst({
        dur: isNova ? 0.14 : 0.08,
        vol: 0.11,
        filterFreq: 4200,
        filterType: "bandpass",
        delay: 0.01
      });
      if (isNova) {
        this._tone({ freq: 640, dur: 0.14, type: "sine", vol: 0.08, slide: -0.3, delay: 0.06 });
      }
    }
    _sfxLightning() {
      this._tone({ freq: 1800, dur: 0.04, type: "square", vol: 0.1, slide: -0.5, filterFreq: 5e3 });
      this._tone({ freq: 640, dur: 0.06, type: "sawtooth", vol: 0.09, slide: -0.35, filterFreq: 2500 });
      this._noiseBurst({ dur: 0.05, vol: 0.1, filterFreq: 6e3, filterType: "highpass" });
    }
    _sfxPoison() {
      this._tone({ freq: 220, dur: 0.1, type: "sine", vol: 0.12, slide: -0.2, filterFreq: 700 });
      this._tone({ freq: 140, dur: 0.14, type: "triangle", vol: 0.09, delay: 0.04, slide: 0.15 });
      this._noiseBurst({ dur: 0.08, vol: 0.07, filterFreq: 900, filterType: "lowpass", delay: 0.05 });
      this._noiseBurst({ dur: 0.05, vol: 0.05, filterFreq: 1600, filterType: "bandpass", delay: 0.1 });
    }
    _sfxHeal() {
      this._tone({ freq: 523.25, dur: 0.18, type: "sine", vol: 0.1 });
      this._tone({ freq: 659.25, dur: 0.2, type: "sine", vol: 0.08, delay: 0.05 });
      this._tone({ freq: 783.99, dur: 0.22, type: "triangle", vol: 0.06, delay: 0.1 });
    }
    _sfxIllusion() {
      this._tone({ freq: 480, dur: 0.12, type: "triangle", vol: 0.09, slide: 0.25 });
      this._tone({ freq: 720, dur: 0.16, type: "sine", vol: 0.07, delay: 0.05, slide: 0.2 });
      this._noiseBurst({ dur: 0.1, vol: 0.04, filterFreq: 2200, filterType: "bandpass", delay: 0.02 });
    }
    /**
     * @param {object} opts
     */
    _tone(opts) {
      if (!this.ctx || !this.sfxGain) return;
      const {
        freq,
        dur,
        type = "sine",
        vol = 0.1,
        slide = 0,
        delay = 0,
        filterFreq = 0
      } = opts;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) {
        osc.frequency.linearRampToValueAtTime(Math.max(20, freq * (1 + slide)), t + dur);
      }
      let node = (
        /** @type {AudioNode} */
        osc
      );
      if (filterFreq > 0) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = filterFreq;
        osc.connect(filter);
        node = filter;
      }
      gain.gain.setValueAtTime(1e-4, t);
      gain.gain.linearRampToValueAtTime(vol, t + 8e-3);
      gain.gain.exponentialRampToValueAtTime(1e-4, t + Math.max(0.02, dur));
      node.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    }
    /**
     * @param {object} opts
     */
    _noiseBurst(opts) {
      if (!this.ctx || !this.sfxGain || !this._noiseBuffer) return;
      const {
        dur = 0.1,
        vol = 0.1,
        filterFreq = 2e3,
        filterType = "bandpass",
        delay = 0,
        slideFilter = 0
      } = opts;
      const t = this.ctx.currentTime + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, t);
      if (slideFilter > 0) {
        filter.frequency.linearRampToValueAtTime(slideFilter, t + dur);
      }
      filter.Q.value = filterType === "bandpass" ? 1.2 : 0.7;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(1e-4, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(1e-4, t + Math.max(0.03, dur));
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      src.start(t);
      src.stop(t + dur + 0.02);
    }
  };

  // js/ui/mobileHud.js
  var MobileHudController = class {
    constructor() {
      this._onResize = null;
      this._onMenuPress = null;
      this._menuBtn = null;
      this._menuClickHandler = null;
      if (typeof document !== "undefined") {
        this._menuBtn = document.getElementById("mobile-menu-btn");
      }
      if (typeof window !== "undefined") {
        this._onResize = () => this.syncLayoutClass();
        window.addEventListener("resize", this._onResize);
        this.syncLayoutClass();
      }
    }
    /** Sync `layout-mobile` on <html> for CSS hooks + panel defaults. */
    syncLayoutClass() {
      if (typeof document === "undefined") return;
      document.documentElement.classList.toggle("layout-mobile", isMobileViewport());
      this._syncMenuButtonDom();
    }
    /**
     * Wire the mobile menu button to the same handler as keyboard Escape.
     * @param {() => void} onMenuPress
     */
    bindMenuButton(onMenuPress) {
      this._onMenuPress = onMenuPress;
      if (!this._menuBtn || this._menuClickHandler) return;
      this._menuClickHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._onMenuPress?.();
      };
      this._menuBtn.addEventListener("click", this._menuClickHandler);
    }
    /**
     * Show the menu button only during active gameplay on mobile viewports.
     * @param {boolean} visible
     */
    setGameplayMenuVisible(visible) {
      this._gameplayMenuVisible = visible;
      this._syncMenuButtonDom();
    }
    /**
     * Call after in-game panels are constructed for a new run.
     * @param {{ gearPanel?: { toggle: (v: boolean) => void }, upgradePanel?: { toggle: (v: boolean) => void }, enemyGuidePanel?: { collapse?: () => void } }} panels
     */
    applyForGame(panels) {
      this.syncLayoutClass();
      if (!isMobileViewport()) return;
      panels.gearPanel?.toggle(false);
      panels.upgradePanel?.toggle(false);
      panels.enemyGuidePanel?.collapse?.();
    }
    destroy() {
      if (this._menuBtn && this._menuClickHandler) {
        this._menuBtn.removeEventListener("click", this._menuClickHandler);
      }
      if (this._onResize && typeof window !== "undefined") {
        window.removeEventListener("resize", this._onResize);
      }
      this._onResize = null;
      this._onMenuPress = null;
      this._menuClickHandler = null;
      this._menuBtn = null;
    }
    /** @private */
    _syncMenuButtonDom() {
      if (!this._menuBtn) return;
      const show = Boolean(this._gameplayMenuVisible) && isMobileViewport();
      this._menuBtn.hidden = !show;
    }
  };

  // js/ui/gameSpeedControls.js
  var GameSpeedControls = class {
    /**
     * @param {import('../game/gameState.js').GameState} state
     * @param {HTMLElement} [root]
     */
    constructor(state, root = document.getElementById("game-speed-controls")) {
      this.state = state;
      this.root = root;
      this._buttons = [];
      if (!this.root) return;
      this._buttons = [...this.root.querySelectorAll("[data-speed]")];
      this._buttons.forEach((btn) => {
        btn.addEventListener("click", (event) => {
          event.stopPropagation();
          const speed = Number(btn.dataset.speed);
          this.setSpeed(speed);
        });
      });
      this.syncUi();
    }
    /** @param {number} speed */
    setSpeed(speed) {
      if (!GAME_SPEED_OPTIONS.includes(speed)) return;
      setTimeScale(this.state, speed);
      this._applyDomSpeed(speed);
      this.syncUi();
    }
    syncUi() {
      const active = this.state.timeScale ?? 1;
      this._buttons.forEach((btn) => {
        const speed = Number(btn.dataset.speed);
        const isActive = speed === active;
        btn.classList.toggle("game-speed-btn-active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });
    }
    /** @private */
    _applyDomSpeed(speed) {
      document.documentElement.style.setProperty("--game-speed", String(speed));
      const container = document.getElementById("game-container");
      container?.style.setProperty("--game-speed", String(speed));
    }
    destroy() {
      this._buttons = [];
      this.root = null;
    }
  };

  // js/ui/panelCoordinator.js
  function bindExclusiveGearUpgradePanels(gearPanel, upgradePanel, isMobileLayout = isMobileViewport) {
    if (!gearPanel || !upgradePanel) return;
    const gearToggle = gearPanel.toggle.bind(gearPanel);
    const upgradeToggle = upgradePanel.toggle.bind(upgradePanel);
    gearPanel.toggle = (forceExpanded) => {
      const wasExpanded = gearPanel.isExpanded();
      gearToggle(forceExpanded);
      if (isMobileLayout() && gearPanel.isExpanded() && !wasExpanded) {
        upgradeToggle(false);
      }
    };
    upgradePanel.toggle = (forceExpanded) => {
      const wasExpanded = upgradePanel.isExpanded();
      upgradeToggle(forceExpanded);
      if (isMobileLayout() && upgradePanel.isExpanded() && !wasExpanded) {
        gearToggle(false);
      }
    };
  }
  function collapseSidePanelsOnPause(gearPanel, upgradePanel) {
    gearPanel?.toggle(false);
    upgradePanel?.toggle(false);
  }

  // js/ui/statsPanelController.js
  var StatsPanelController = class {
    constructor() {
      this.els = {
        panel: document.getElementById("player-stats"),
        toggle: document.getElementById("stats-detail-toggle"),
        grid: document.querySelector("#player-stats .stats-grid")
      };
      this.expanded = !panelsStartCollapsed();
      this._onResize = () => this._syncDefaultForViewport();
      this.els.toggle?.addEventListener("click", (event) => {
        event.stopPropagation();
        this.toggle();
      });
      if (typeof window !== "undefined") {
        window.addEventListener("resize", this._onResize);
      }
      this.syncDom();
    }
    toggle(forceExpanded) {
      if (typeof forceExpanded === "boolean") {
        this.expanded = forceExpanded;
      } else {
        this.expanded = !this.expanded;
      }
      this.syncDom();
    }
    isExpanded() {
      return this.expanded;
    }
    syncDom() {
      this.els.panel?.classList.toggle("stats-panel--detail-expanded", this.expanded);
      this.els.panel?.classList.toggle("stats-panel--detail-collapsed", !this.expanded);
      this.els.toggle?.setAttribute("aria-expanded", String(this.expanded));
    }
    /** @private */
    _syncDefaultForViewport() {
      this.expanded = !panelsStartCollapsed();
      this.syncDom();
    }
    destroy() {
      if (this._onResize && typeof window !== "undefined") {
        window.removeEventListener("resize", this._onResize);
      }
    }
  };

  // js/game/game.js
  var Game = class {
    constructor() {
      this.state = new GameState();
      this.ui = new UIManager();
      this.audio = new AudioManager();
      this.mobileHud = new MobileHudController();
      this.effects = null;
      this.meta = loadMetaProgress();
      reconcileMetaAchievements(this.meta);
      this.killStreak = new KillStreakTracker();
      this._treasureGuideArrow = null;
      this._treasureGuideRing = null;
      this._pausedByTabHidden = false;
      this._bindEvents();
      this.ui.bindPauseMenu({
        resume: () => this.resumeGame(),
        restart: () => this.restartRun(),
        characterSelect: () => this.quitToCharacterSelect(),
        achievements: () => this.ui.openAchievementsPanel(this.meta)
      });
      this.mobileHud.bindMenuButton(() => this.handleMenuAction());
      this.ui.bindAudioControls(this.audio);
      this.ui.syncAudioVolumeUi(this.audio);
      this.mobileHud.setGameplayMenuVisible(false);
      this.ui.showCharacterSelection((name) => this.selectCharacter(name), this.meta);
    }
    _bindEvents() {
      document.addEventListener("keydown", (e) => this._onKeyDown(e));
      document.addEventListener("click", () => {
        this.audio?.unlock?.();
        if (this.state.gameOver && !this.state.gamePaused) this.restart();
      });
      document.addEventListener("pointerdown", () => this.audio?.unlock?.(), { once: false });
      this._onVisibilityChange = () => this._handleVisibilityChange();
      document.addEventListener("visibilitychange", this._onVisibilityChange);
    }
    /** Freeze gameplay when the tab is hidden so timers and spawns do not advance in the background. */
    _handleVisibilityChange() {
      const s = this.state;
      if (document.hidden) {
        if (!s.gamePaused && !s.gameOver && !s.characterSelection) {
          this._pausedByTabHidden = this.pauseGame({ silent: true });
        }
        return;
      }
      if (this._pausedByTabHidden) {
        this._pausedByTabHidden = false;
        this.resumeGame();
      }
    }
    _onKeyDown(event) {
      if (this.state.gameOver && !this.state.gamePaused) {
        this.restart();
        return;
      }
      if (event.key === "Escape" && !this.state.characterSelection) {
        this.handleMenuAction();
        return;
      }
      if (event.key === "u" || event.key === "U") {
        if (!this.state.characterSelection && !this.state.gameOver) {
          this.upgradePanel?.toggle();
          if (this.upgradePanel?.isExpanded()) this._refreshUpgradePanel();
        }
        return;
      }
      if (event.key === "g" || event.key === "G") {
        if (!this.state.characterSelection && !this.state.gameOver) {
          this.gearPanel?.toggle();
          if (this.gearPanel?.isExpanded()) this.gearPanel.refresh();
        }
        return;
      }
      const charIdx = this._getCharacterKeyIndex(event);
      if (charIdx >= 0 && this.state.characterSelection) {
        const buttons = this.ui.getCharacterButtons();
        if (charIdx < buttons.length) buttons[charIdx].click();
        return;
      }
      if (this.upgradePanel?.isExpanded() && !this.state.characterSelection && !this.state.gameOver && !this.state.gamePaused) {
        const idx = parseInt(event.key, 10) - 1;
        if (idx >= 0 && idx <= 8) {
          const view = this.upgradePanel.getView();
          if (view === "categories") {
            const buttons = this.upgradePanel.getCategoryButtons();
            if (idx < buttons.length) {
              buttons[idx].click();
              return;
            }
          } else if (view === "choices") {
            const buttons = this.upgradePanel.getChoiceButtons();
            if (idx < buttons.length) {
              buttons[idx].click();
              return;
            }
          }
        }
      }
    }
    /** Map keyboard key to character list index (supports 11 heroes). */
    _getCharacterKeyIndex(event) {
      if (event.key >= "1" && event.key <= "9") return parseInt(event.key, 10) - 1;
      if (event.key === "0") return 9;
      if (event.key === "-" || event.key === "_") return 10;
      return -1;
    }
    selectCharacter(name) {
      this.audio?.unlock?.();
      const character = CHARACTERS.find((c) => c.name === name);
      if (!character) return;
      this.state.fullCleanup();
      resetPlayerModel(this.ui.els.player);
      this.state.initForCharacter(deepClone(character.stats));
      this.state.selectedCharacterName = name;
      this.state.selectedModelClass = character.modelClass;
      this.state.itemsLooted = 0;
      this.killStreak.reset();
      this.gearInventory = new GearInventory();
      this.gearLootFilter = new GearLootFilter();
      this.enemyPopulation = new EnemyPopulationManager(this.state);
      this.treasureEvents = new TreasureEventManager(this);
      this.treasureEvents.reset();
      this.effects = new EffectManager(this.ui.els.gameContainer);
      this.skillExecutor = new SkillExecutor(this);
      this.illusionClone = new IllusionCloneManager(this);
      this.characterPassives = new CharacterPassiveManager(this);
      this.buffTracker = new BuffTracker();
      this.enemyProjectiles = new EnemyProjectileManager(this.state, this.ui.els.gameContainer);
      this.poisonPools = new PoisonPoolManager(this);
      this.skillRanges = new SkillRangeDisplay(
        this.ui.els.gameContainer,
        document.getElementById("skill-range-layer")
      );
      applyPlayerModel(this.ui.els.player, character.name);
      this._activeUpgradeCategory = null;
      this._upgradeOptionCache = { stat: null, skill: null };
      this.upgradePanel = new UpgradePanel(
        (key) => this._spendUpgrade(key),
        (type) => this._selectUpgradeCategory(type)
      );
      this.upgradePanel.reset();
      this.gearPanel = new GearPanel(
        this.gearInventory,
        (id) => this._equipGear(id),
        (slot) => this._unequipGear(slot),
        (id) => this._deleteGear(id),
        (rarity) => this._bulkDeleteGear(rarity),
        this.gearLootFilter
      );
      this.gearPanel.reset();
      this.enemyGuidePanel = new EnemyGuidePanel();
      this.bossHud = new BossHud();
      bindExclusiveGearUpgradePanels(this.gearPanel, this.upgradePanel);
      this.statsPanel = new StatsPanelController();
      this.gameSpeedControls = new GameSpeedControls(this.state);
      this.mobileHud.applyForGame({
        gearPanel: this.gearPanel,
        upgradePanel: this.upgradePanel,
        enemyGuidePanel: this.enemyGuidePanel
      });
      this.ui.showGame();
      this.mobileHud.setGameplayMenuVisible(true);
      this.ui.els.playerAnchor.style.left = "50vw";
      this.ui.els.playerAnchor.style.top = "50vh";
      this.ui.updateAttackRange(this.state.stats.attackRange);
      this.ui.updateStats(this.state.stats, this.state.skillList);
      this.ui.updateMeta(this.state.killCount, this.state.currentWave, this.killStreak.streak);
      this.ui.showWaveAnnouncement(this.state.currentWave);
      this.state.previousWave = this.state.currentWave;
      this.characterPassives?.activate(name);
      this._beginActiveRun();
    }
    /**
     * Unpause, reset the sim clock, refresh the timer UI, and start the main loop.
     * Must run at the end of character select / restart — keep free of optional side effects.
     */
    _beginActiveRun() {
      const s = this.state;
      s.gamePaused = false;
      s.gameOver = false;
      s.characterSelection = false;
      s.elapsedSeconds = 0;
      s.pauseTime = 0;
      initGameClock(s);
      this.ui.updateTimer(0);
      this._startGameLoop();
    }
    restart() {
      this.quitToCharacterSelect();
    }
    quitToCharacterSelect() {
      this.enemyGuidePanel?.setPausedHidden(false);
      this._endRun(false);
      this.state.characterSelection = true;
      this.state.gameOver = false;
      this.mobileHud.setGameplayMenuVisible(false);
      this.ui.hideGameOver();
      this.ui.showPause(false);
      this.ui.showCharacterSelection((name) => this.selectCharacter(name), this.meta);
    }
    /** Restart the current character without returning to selection. */
    restartRun() {
      const name = this.state.selectedCharacterName;
      if (!name) {
        this.quitToCharacterSelect();
        return;
      }
      this.state.gamePaused = false;
      this.ui.showPause(false);
      this.enemyGuidePanel?.setPausedHidden(false);
      this._endRun(false);
      this.selectCharacter(name);
    }
    /** @param {boolean} died */
    _endRun(died) {
      const s = this.state;
      if (s.stats && s.selectedCharacterName) {
        recordCampaignVictoryIfPending(this.meta, s.selectedCharacterName, s);
        updateCharacterRecord(this.meta, {
          character: s.selectedCharacterName,
          level: s.stats.level,
          time: s.elapsedSeconds,
          kills: s.killCount,
          wave: s.currentWave
        });
      }
      if (died && s.stats) {
      }
      s.fullCleanup();
      this._clearTreasureGuide();
      this.effects?.cleanup();
      this.poisonPools?.clear();
      this.skillRanges?.clear();
      this.upgradePanel?.reset();
      this.gearPanel?.reset();
      this.gearLootFilter?.reset();
      this.skillExecutor?.cleanup();
      this.illusionClone?.cleanup();
      this.characterPassives?.cleanup();
      this.buffTracker?.clear();
      this.ui?.updateBuffBar?.([]);
      this.enemyProjectiles?.clearAll();
      this.bossHud?.clear();
      this.gearInventory = null;
      if (died) s.gameOver = true;
    }
    /** Shared handler for Escape key and the mobile menu button. */
    handleMenuAction() {
      if (this.state.gameOver && !this.state.gamePaused) {
        this.restart();
        return;
      }
      if (this.state.characterSelection) return;
      if (this.ui.els.achievementsOverlay?.style.display === "flex") {
        this.ui.closeAchievementsPanel();
        return;
      }
      this.togglePause();
    }
    togglePause() {
      if (this.state.gamePaused) this.resumeGame();
      else this.pauseGame();
    }
    /**
     * @param {{ silent?: boolean }} [opts] silent=true skips the pause overlay (tab-hidden freeze).
     * @returns {boolean} Whether pause was applied.
     */
    pauseGame(opts = {}) {
      const { silent = false } = opts;
      const s = this.state;
      if (s.gamePaused || s.gameOver) return false;
      s.gamePaused = true;
      s.pauseTime = Date.now();
      if (!silent) this.ui.showPause(true);
      collapseSidePanelsOnPause(this.gearPanel, this.upgradePanel);
      this.enemyGuidePanel?.collapse();
      this.enemyGuidePanel?.setPausedHidden(true);
      if (s.gameLoopId) {
        s.cancelAnimation(s.gameLoopId);
        s.gameLoopId = null;
      }
      s.cancelAllAnimations();
      this.enemyProjectiles?.clearAll();
      s.enemies.forEach((e) => s.cancelAnimation(e.moveAnimationId));
      s.bullets.forEach((b) => s.cancelAnimation(b.moveAnimationId));
      return true;
    }
    resumeGame() {
      const s = this.state;
      if (!s.gamePaused) return;
      s.gamePaused = false;
      this._pausedByTabHidden = false;
      this.ui.showPause(false);
      this.enemyGuidePanel?.setPausedHidden(false);
      const elapsed = Date.now() - s.pauseTime;
      syncClockAfterResume(s);
      if (this.treasureEvents?.lastSpawnTime != null) {
        this.treasureEvents.lastSpawnTime += elapsed;
      }
      s.enemies.forEach((e) => {
        this._startEnemyMovement(e);
      });
      s.bullets.forEach((b) => this._startBulletMovement(b));
      this._startGameLoop();
    }
    _startGameLoop() {
      if (this.state.gameLoopId) {
        this.state.cancelAnimation(this.state.gameLoopId);
        this.state.gameLoopId = null;
      }
      const loop = () => {
        try {
          this._tick();
        } catch (err) {
          console.error("[Game] tick failed \u2014 loop continues", err);
        }
        const prev = this.state.gameLoopId;
        this.state.gameLoopId = requestAnimationFrame(loop);
        this.state.trackAnimation(this.state.gameLoopId, prev);
      };
      loop();
    }
    _tick() {
      const s = this.state;
      if (s.gamePaused || s.gameOver) return;
      const realNow = Date.now();
      const simNow = advanceGameClock(s, realNow);
      const simDeltaMs = getLastSimDeltaMs(s);
      if (simNow - s.lastAttackTime >= 1e3 / s.stats.attackSpeed) {
        const { x, y } = this.ui.getPlayerPosition();
        this._attackNearestEnemy(x, y);
      }
      this._tickBuffs(simNow);
      this.buffTracker?.tick(simNow);
      this.ui?.updateBuffBar?.(this.buffTracker?.getActiveBuffs(simNow) || []);
      this.effects?.setTimeScale(s.timeScale ?? 1);
      this.skillRanges?.setTimeScale(s.timeScale ?? 1);
      this.enemyProjectiles?.tick(simDeltaMs, {
        getPlayerPosition: () => this.ui.getPlayerPosition(),
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      });
      this._tickTimer(simNow);
      this._tickSpawns(simNow);
      this._tickEnemyAttacks(simNow);
      this._tickStatusEffects(simNow);
      this.skillExecutor?.tick(simNow, simDeltaMs);
      this.characterPassives?.tick(simNow);
      this.illusionClone?.tick(simNow);
      this.poisonPools?.tick(simNow);
      this.treasureEvents?.tick(simNow);
      this.killStreak.tick(simNow);
      this.skillRanges?.update(s.skillList, s.stats.attackRange);
      this.enemyPopulation?.enforceCap(this);
      this.bossHud?.syncFromEnemies(s.enemies);
      tickPlayerRegen(s, simNow);
      if (this._resolvePlayerVitalityEndOfTick()) return;
      this.ui.updateStats(s.stats, s.skillList);
      this.ui.updateMeta(s.killCount, s.currentWave, this.killStreak.streak);
      this._checkAchievements();
    }
    _checkAchievements() {
      const unlocked = evaluateAchievements(this.meta, buildAchievementContext({
        state: this.state,
        killStreak: this.killStreak,
        treasureEvents: this.treasureEvents,
        gearInventory: this.gearInventory,
        meta: this.meta
      }));
      unlocked.forEach((id) => this.ui.showAchievementUnlock(id));
    }
    _tickBuffs(now) {
      const s = this.state;
      const buffLevel = s.abilityList["Attack Speed Buff"].level;
      if (buffLevel <= 0) return;
      const elapsed = now - s.attackSpeedBuffTime;
      if (elapsed >= s.attackSpeedBuffInterval) {
        s.attackSpeedBuffTime = now;
        this._grantBuff("Attack Speed Buff", now);
      } else if (elapsed >= s.attackSpeedBuffDuration) {
        this._removeBuff("Attack Speed Buff");
      }
    }
    _grantBuff(name, now = Date.now()) {
      const s = this.state;
      if (s.stats.buffList[name]) this._removeBuff(name);
      if (name === "Attack Speed Buff") {
        const level = s.abilityList[name].level;
        const displayPct = getAbilityPercent("attackSpeedBuff", level);
        const bonus = s.stats.attackSpeed * displayPct / 100;
        s.stats.buffList[name] = bonus;
        s.stats.attackSpeed += bonus;
        this.buffTracker?.apply({
          id: "attack-speed-buff",
          name: "Attack Speed Buff",
          icon: "\u26A1",
          description: `+${displayPct}% attack speed`,
          durationMs: s.attackSpeedBuffDuration,
          now
        });
      }
    }
    _removeBuff(name) {
      const s = this.state;
      if (!s.stats.buffList[name]) return;
      if (name === "Attack Speed Buff") {
        s.stats.attackSpeed -= s.stats.buffList[name];
        this.buffTracker?.remove("attack-speed-buff");
      }
      delete s.stats.buffList[name];
    }
    _tickTimer(simNow) {
      const s = this.state;
      const elapsedSec = getElapsedSeconds(s);
      if (elapsedSec === s.elapsedSeconds) return;
      s.elapsedSeconds = elapsedSec;
      this.ui.updateTimer(s.elapsedSeconds);
      s.currentWave = getWaveNumber(s.elapsedSeconds);
      if (s.currentWave > (s.maxWaveReached || 1)) s.maxWaveReached = s.currentWave;
      s.currentDifficultyLevel = getDifficultyIndex(s.elapsedSeconds);
      const maxDiff = Math.min(s.currentDifficultyLevel, BALANCE.maxDifficultyForSpawn);
      if (s.previousWave !== s.currentWave) {
        this.ui.showWaveAnnouncement(s.currentWave);
        s.previousWave = s.currentWave;
        s.previousDifficultyLevel = s.currentDifficultyLevel;
        s.normalSpawnInterval = getSpawnIntervalMs("normal", maxDiff);
        s.rareEnemySpawnInterval = getSpawnIntervalMs("rare", maxDiff);
        s.eliteSpawnInterval = getSpawnIntervalMs("elite", maxDiff);
        s.bossSpawnInterval = getSpawnIntervalMs("boss", maxDiff);
        if (isMilestoneBossWave(s.currentWave) || isBossWave(s.currentWave)) {
          this._spawnBossWaveEvent(s.currentWave);
        }
      }
    }
    /**
     * Landmark boss encounter every 10 waves — bulky boss + mini swarm pack.
     * Wave 100 uses a unique final boss with a massive escort army.
     * @param {number} wave
     */
    _spawnBossWaveEvent(wave) {
      if (isMilestoneBossWave(wave)) {
        this._spawnTrackedBossEvent(wave);
        return;
      }
      const boss = this._spawnWithType("boss", pickEnemyType(this.state.currentDifficultyLevel));
      if (boss?.stats) {
        boss.stats.hp = Math.floor(boss.stats.hp * BOSS_WAVE_HP_MULT);
        boss.stats.maxHp = boss.stats.hp;
        boss.isWaveBoss = true;
        this._updateEnemyHealthBar(boss);
      }
      const pack = rollBossWaveSwarmCount();
      const edge = Math.floor(Math.random() * 4);
      const anchor = getEdgeSpawnAnchor(edge);
      for (let i = 0; i < pack; i++) {
        this._spawnEnemy("normal", "swarm", {
          at: {
            x: anchor.x + (Math.random() - 0.5) * 8,
            y: anchor.y + (Math.random() - 0.5) * 8
          },
          skipGroup: true,
          bypassCap: true
        });
      }
      if (this.ui.els?.waveToast) {
        this.ui.els.waveToast.textContent = `Wave ${wave} Boss \u2014 Swarm incoming!`;
        this.ui.els.waveToast.classList.add("toast-visible");
        clearTimeout(this.ui._waveTimer);
        this.ui._waveTimer = setTimeout(() => {
          this.ui.els.waveToast.classList.remove("toast-visible");
        }, 2800);
      }
    }
    /**
     * Tracked milestone boss (waves 25, 50, 75, 100) — scaled HP, escort army, HUD.
     * @param {number} wave
     */
    _spawnTrackedBossEvent(wave) {
      this._spawnMilestoneBoss(wave);
      const difficulty = this.state.currentDifficultyLevel;
      const edges = [0, 1, 2, 3];
      this._spawnVictoryArmyPack(edges[0], rollBossArmyCount(wave, "swarm"), "normal", "swarm");
      this._spawnVictoryArmyPack(edges[1], rollBossArmyCount(wave, "grunt"), "normal", "grunt");
      this._spawnVictoryArmyPack(edges[2], rollBossArmyCount(wave, "elite"), "elite", pickEnemyType(difficulty));
      this._spawnVictoryArmyPack(edges[3], rollBossArmyCount(wave, "swarm"), "normal", "swarm");
      if (isFinalVictoryWave(wave)) {
        this.ui.showFinalVictoryBossIncoming(wave);
      } else if (isMidpointVictoryWave(wave)) {
        this.ui.showMidpointVictoryBossIncoming(wave);
      } else {
        this.ui.showMiniBossIncoming(wave);
      }
    }
    /** @deprecated Use _spawnTrackedBossEvent */
    _spawnMidpointVictoryBossEvent(wave) {
      this._spawnTrackedBossEvent(wave);
    }
    /** @deprecated Use _spawnTrackedBossEvent */
    _spawnFinalVictoryBossEvent(wave) {
      this._spawnTrackedBossEvent(wave);
    }
    /**
     * Spawn a Wave 50 / Wave 100 milestone boss — bypasses population cap and applies HUD tracking.
     * @param {number} milestoneWave MIDPOINT_VICTORY_WAVE or FINAL_VICTORY_WAVE
     * @returns {object|null}
     */
    _spawnMilestoneBoss(milestoneWave) {
      const s = this.state;
      const difficulty = s.currentDifficultyLevel;
      const simNow = getSimulatedMs(s);
      const edge = Math.floor(Math.random() * 4);
      const anchor = getEdgeSpawnAnchor(edge);
      const boss = this._spawnEnemy("boss", pickEnemyType(difficulty), {
        ...MILESTONE_BOSS_SPAWN_OPTS,
        at: {
          x: anchor.x + (Math.random() - 0.5) * 8,
          y: anchor.y + (Math.random() - 0.5) * 8
        }
      });
      if (!boss?.stats) return null;
      applyMilestoneBossCombatScaling(boss.stats, milestoneWave);
      boss.milestoneBossWave = milestoneWave;
      boss.isWaveBoss = true;
      if (milestoneWave === FINAL_VICTORY_WAVE) {
        boss.isFinalVictoryBoss = true;
      }
      this._applyMilestoneBossPresentation(boss, milestoneWave);
      this._updateEnemyHealthBar(boss);
      this.bossHud.track(boss);
      s.milestoneBossReinforceTime = simNow;
      return boss;
    }
    /**
     * Larger in-world HP bar + label for milestone bosses (Wave 50 / 100).
     * @param {object} enemy
     * @param {number} milestoneWave
     */
    _applyMilestoneBossPresentation(enemy, milestoneWave) {
      enemy.element.classList.add("enemy-milestone-boss");
      const bar = enemy.element.querySelector(".enemy-health-bar");
      if (bar) {
        bar.classList.add("enemy-health-bar--milestone");
        const tag = bar.querySelector(".enemy-boss-label");
        if (tag) {
          tag.textContent = MILESTONE_BOSS_WORLD_LABELS[milestoneWave] || "BOSS";
        }
      }
    }
    /**
     * @param {number} edge @param {number} count @param {string} rarity @param {string} enemyType
     */
    _spawnVictoryArmyPack(edge, count, rarity, enemyType) {
      const anchor = getEdgeSpawnAnchor(edge);
      for (let i = 0; i < count; i++) {
        this._spawnEnemy(rarity, enemyType, {
          at: {
            x: anchor.x + (Math.random() - 0.5) * 10,
            y: anchor.y + (Math.random() - 0.5) * 10
          },
          skipGroup: true,
          bypassCap: true
        });
      }
    }
    _onFinalVictoryBossDefeated() {
      const s = this.state;
      if (s.finalVictoryAchieved) return;
      s.finalBossDefeatedThisRun = true;
      s.finalVictoryAchieved = true;
      if (!s.campaignVictoryRecorded) {
        markCharacterVictory(this.meta, s.selectedCharacterName);
        s.campaignVictoryRecorded = true;
      }
      this.ui.showFinalVictoryCelebration(s.selectedCharacterName);
      this._checkAchievements();
    }
    /** Victory requires killing the Wave 100 boss — wave 101+ alone does not count. */
    _hasCampaignVictory() {
      return Boolean(this.state.finalVictoryAchieved);
    }
    _tickSpawns(now) {
      const s = this.state;
      const elapsed = s.elapsedSeconds;
      const pop = this.enemyPopulation;
      if (pop?.shouldSpawnNow("boss", elapsed, s.bossSpawnTime, s.bossSpawnInterval, now)) {
        s.bossSpawnTime = now;
        this._spawnWithType("boss", pickEnemyType(s.currentDifficultyLevel));
      }
      if (pop?.shouldSpawnNow("elite", elapsed, s.eliteSpawnTime, s.eliteSpawnInterval, now)) {
        s.eliteSpawnTime = now;
        this._spawnWithType("elite", pickEnemyType(s.currentDifficultyLevel));
      }
      if (pop?.shouldSpawnNow("rare", elapsed, s.rareEnemySpawnTime, s.rareEnemySpawnInterval, now)) {
        s.rareEnemySpawnTime = now;
        this._spawnWithType("rare", pickEnemyType(s.currentDifficultyLevel));
      }
      if (pop?.shouldSpawnNow("normal", elapsed, s.normalSpawnTime, s.normalSpawnInterval, now)) {
        s.normalSpawnTime = now;
        this._spawnWithType("normal", pickEnemyType(s.currentDifficultyLevel));
      }
      this._tickMilestoneBossReinforcements(now);
    }
    /** Ongoing reinforcements while a Wave 50 or Wave 100 milestone boss lives. */
    _tickMilestoneBossReinforcements(now) {
      const s = this.state;
      const boss = findLivingMilestoneBoss(s.enemies);
      if (!boss?.milestoneBossWave) return;
      if (s.currentWave < boss.milestoneBossWave) return;
      const milestoneWave = boss.milestoneBossWave;
      const interval = milestoneWave === FINAL_VICTORY_WAVE ? getFinalVictoryReinforcementIntervalMs(s.elapsedSeconds, s.currentWave) : getMilestoneReinforcementIntervalMs(milestoneWave);
      if (now - (s.milestoneBossReinforceTime || 0) < interval) return;
      s.milestoneBossReinforceTime = now;
      const difficulty = s.currentDifficultyLevel;
      const edge = Math.floor(Math.random() * 4);
      if (milestoneWave === FINAL_VICTORY_WAVE) {
        const swarmCount = rollFinalVictoryReinforcementSwarmSize(s.elapsedSeconds, s.currentWave);
        this._spawnVictoryArmyPack(edge, swarmCount, "normal", "swarm");
        if (Math.random() < 0.55) {
          const edge2 = (edge + 1 + Math.floor(Math.random() * 3)) % 4;
          this._spawnVictoryArmyPack(
            edge2,
            2 + Math.floor(Math.random() * 4),
            Math.random() < 0.35 ? "elite" : "normal",
            pickEnemyType(difficulty)
          );
        }
        return;
      }
      this._spawnVictoryArmyPack(edge, rollMilestoneReinforcementSwarmSize(milestoneWave), "normal", "swarm");
      if (Math.random() < 0.45) {
        const edge2 = (edge + 2) % 4;
        this._spawnVictoryArmyPack(
          edge2,
          2 + Math.floor(Math.random() * 3),
          "normal",
          Math.random() < 0.25 ? "grunt" : "swarm"
        );
      }
    }
    /** Routes swarm to group spawn; dasher and others always spawn solo. */
    _spawnWithType(rarity, enemyType) {
      if (enemyType === "swarm") {
        return this._spawnSwarmGroup(rarity);
      }
      return this._spawnEnemy(rarity, enemyType, { skipGroup: true });
    }
    _spawnSwarmGroup(rarity) {
      const edge = Math.floor(Math.random() * 4);
      const anchor = getEdgeSpawnAnchor(edge);
      const count = rollSwarmGroupSize(this.state.currentDifficultyLevel);
      const positions = getSwarmGroupPositions(anchor.x, anchor.y, count);
      let lead = null;
      for (const at of positions) {
        const spawned = this._spawnEnemy(rarity, "swarm", { at, skipGroup: true });
        if (spawned && !lead) lead = spawned;
      }
      return lead;
    }
    _tickEnemyAttacks(now) {
      const enemies = [...this.state.enemies];
      enemies.forEach((enemy) => {
        if ((enemy.stats?.hp ?? 0) <= 0) return;
        const last = this.state.enemyAttackCooldown[enemy.id] || 0;
        if (now - last >= 1e3 / enemy.stats.attackSpeed) {
          this.state.enemyAttackCooldown[enemy.id] = now;
          this._enemyAttackPlayer(enemy);
        }
      });
    }
    _tickRegen(now) {
      tickPlayerRegen(this.state, now);
    }
    /**
     * Apply incoming damage to the player, refresh the HP bar, and return damage dealt after passives.
     * Defeat is only resolved at end-of-tick after regen (see resolvePlayerDefeat).
     * @param {number} rawDamage
     * @returns {number}
     */
    dealPlayerDamage(rawDamage) {
      const s = this.state;
      const dealt = this.characterPassives?.absorbDamage(rawDamage) ?? rawDamage;
      applyPlayerDamage(s.stats, dealt);
      this._onPlayerDamaged();
      this.ui.syncPlayerHp(s.stats);
      return dealt;
    }
    /** @returns {boolean} True when defeat was triggered. */
    _resolvePlayerVitalityEndOfTick() {
      const s = this.state;
      if (!resolvePlayerDefeat(s.stats)) return false;
      this._triggerPlayerDefeat();
      return true;
    }
    _triggerPlayerDefeat() {
      const s = this.state;
      if (s.gameOver) return;
      s.gameOver = true;
      s.cancelAllAnimations();
      this.enemyProjectiles?.clearAll();
      this.effects?.cleanup();
      this.skillExecutor?.cleanup();
      updateCharacterRecord(this.meta, {
        character: s.selectedCharacterName,
        level: s.stats.level,
        time: s.elapsedSeconds,
        kills: s.killCount,
        wave: s.currentWave
      });
      this.mobileHud.setGameplayMenuVisible(false);
      this.ui.syncPlayerHp(s.stats);
      this.ui.showGameOver(s.stats, s.elapsedSeconds, s.killCount, s.currentWave);
    }
    _tickStatusEffects(now) {
      const s = this.state;
      Object.keys(s.statusEffects).forEach((enemyId) => {
        const status = s.statusEffects[enemyId];
        const enemy = s.enemies.find((e) => e.id === enemyId);
        if (!enemy) {
          delete s.statusEffects[enemyId];
          return;
        }
        if (status.burn && now < status.burn.endTime) {
          if (now - status.burn.lastTick >= 500) {
            status.burn.lastTick = now;
            let tickDmg = Math.max(1, Math.floor(status.burn.damagePerTick));
            tickDmg = this.characterPassives?.modifySkillDamage(tickDmg, {
              element: "fire",
              skillId: "fireball",
              tags: ["fire", "elemental"]
            }) ?? tickDmg;
            enemy.stats.hp -= tickDmg;
            this.effects.spawnDamageNumber(
              parseFloat(enemy.element.style.left),
              parseFloat(enemy.element.style.top) - 2,
              tickDmg,
              false,
              "fire"
            );
            this._updateEnemyHealthBar(enemy);
            if (enemy.stats.hp <= 0) this._removeEnemy(enemy);
          }
        } else if (status.burn) {
          this.effects.removeBurnAura(enemy.element);
          delete status.burn;
        }
        if (status.freeze && now >= status.freeze.endTime) {
          enemy.frozen = false;
          enemy.stats.moveSpeed = enemy.baseMoveSpeed;
          this.effects.removeFrostAura(enemy.element);
          delete status.freeze;
        }
        if (status.slow && now >= status.slow.endTime) {
          enemy.stats.moveSpeed = enemy.baseMoveSpeed;
          if (!status.freeze || now >= status.freeze.endTime) {
            this.effects.removeFrostAura(enemy.element);
          }
          delete status.slow;
        }
      });
    }
    _spawnEnemy(rarity, enemyType, spawnOpts = {}) {
      const s = this.state;
      const earlyTypeConfig = ENEMY_TYPES[enemyType];
      if (earlyTypeConfig?.spawnable === false && !spawnOpts.splitFragment) return null;
      if (!spawnOpts.bypassCap && !spawnOpts.skipGroup && enemyType === "swarm" && !spawnOpts.at) {
        return this._spawnSwarmGroup(rarity);
      }
      if (!spawnOpts.bypassCap && this.enemyPopulation?.isAtCap()) return null;
      if (!spawnOpts.at && spawnOpts.splitFragment) return null;
      let x;
      let y;
      if (spawnOpts.at) {
        x = spawnOpts.at.x;
        y = spawnOpts.at.y;
      } else {
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
          case 0:
            x = Math.random() * 100;
            y = -2;
            break;
          case 1:
            x = 102;
            y = Math.random() * 100;
            break;
          case 2:
            x = Math.random() * 100;
            y = 102;
            break;
          default:
            x = -2;
            y = Math.random() * 100;
            break;
        }
      }
      const { stats, typeConfig, rarityConfig } = buildEnemyStats(
        enemyType,
        rarity,
        s.currentDifficultyLevel
      );
      applyRuntimeEnemyScaling(stats, s.elapsedSeconds, s.currentWave);
      const el = document.createElement("div");
      el.id = `enemy-${s.nextEnemyId++}`;
      el.className = typeConfig.cssClass + rarityConfig.cssSuffix;
      el.dataset.enemyType = typeConfig.type;
      el.style.setProperty("--enemy-type-color", getEnemyTypeColor(typeConfig.type));
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      el.title = `${typeConfig.label} (${rarity})`;
      el.insertAdjacentHTML("afterbegin", buildEnemyModelHtml(typeConfig));
      const healthBar = document.createElement("div");
      const isBoss = rarity === "boss";
      const isElite = rarity === "elite";
      healthBar.className = [
        "enemy-health-bar",
        isBoss ? "enemy-health-bar--boss" : "",
        isElite ? "enemy-health-bar--elite" : ""
      ].filter(Boolean).join(" ");
      const healthFill = document.createElement("div");
      healthFill.className = "enemy-health-bar-fill";
      healthFill.style.width = "100%";
      healthBar.appendChild(healthFill);
      if (isBoss) {
        const bossTag = document.createElement("span");
        bossTag.className = "enemy-boss-label";
        bossTag.textContent = "BOSS";
        healthBar.appendChild(bossTag);
      }
      el.appendChild(healthBar);
      this.ui.els.gameContainer.appendChild(el);
      const enemy = {
        id: el.id,
        element: el,
        stats,
        typeConfig,
        rarity,
        spawnTime: Date.now(),
        moveAnimationId: null,
        frozen: false,
        lastDashTime: 0,
        dashing: false,
        baseMoveSpeed: stats.moveSpeed
      };
      s.enemies.push(enemy);
      s.enemyAttackCooldown[enemy.id] = 0;
      this.effects?.playEnemySpawn(el);
      this._startEnemyMovement(enemy);
      return enemy;
    }
    /** Spawn a bonus treasure enemy within attack range — player is stationary, so chest must come to them. */
    spawnTreasureChest() {
      const s = this.state;
      const { x: px, y: py } = this.ui.getPlayerPosition();
      const iw = window.innerWidth || 1e3;
      const rangeVw = Math.max(6, s.stats.attackRange / iw * 100);
      const distVw = Math.max(4, rangeVw * (0.35 + Math.random() * 0.25));
      const angle = Math.random() * Math.PI * 2;
      const x = Math.max(8, Math.min(92, px + Math.cos(angle) * distVw));
      const y = Math.max(12, Math.min(88, py + Math.sin(angle) * distVw));
      const enemy = this._spawnEnemy("rare", "grunt", { at: { x, y }, bypassCap: true });
      if (!enemy) return;
      enemy.isTreasure = true;
      enemy.stats.exp = Math.floor(enemy.stats.exp * 5);
      enemy.stats.hp = Math.floor(enemy.stats.hp * 0.55);
      enemy.stats.maxHp = enemy.stats.hp;
      enemy.stats.moveSpeed = Math.max(enemy.stats.moveSpeed * 1.65, enemy.baseMoveSpeed * 1.4);
      enemy.baseMoveSpeed = enemy.stats.moveSpeed;
      this._applyTreasureChestVisual(enemy);
      enemy.element.classList.add("enemy-treasure");
      enemy.element.style.zIndex = "8";
      enemy.element.title = "Treasure Chest \u2014 defeat for bonus loot!";
      enemy.element.setAttribute("aria-label", "Treasure Chest");
      if (!enemy.element.querySelector(".treasure-chest-label")) {
        const label = document.createElement("span");
        label.className = "treasure-chest-label";
        label.textContent = "CHEST";
        enemy.element.appendChild(label);
      }
      this._showTreasureGuide(px, py, x, y);
      this.effects?.spawnCastFlash?.(x, y, "crit");
      this.ui.showTreasureHint(x, y, distVw);
    }
    /** Replace grunt model with a dedicated treasure chest sprite. */
    _applyTreasureChestVisual(enemy) {
      const el = enemy.element;
      el.classList.remove("enemy-grunt");
      el.classList.add("enemy-treasure-chest");
      el.querySelector(".enemy-model-25d")?.remove();
      el.querySelector(".enemy-type-badge")?.remove();
      el.insertAdjacentHTML("afterbegin", buildTreasureChestModelHtml());
    }
    /**
     * Arrow from player center toward the chest so stationary players know where to look.
     * @param {number} px @param {number} py @param {number} tx @param {number} ty
     */
    _showTreasureGuide(px, py, tx, ty) {
      const container = this.ui.els.gameContainer;
      if (!container) return;
      this._clearTreasureGuide();
      const iw = window.innerWidth || 1e3;
      const ih = window.innerHeight || 1e3;
      const dx = (tx - px) * iw / 100;
      const dy = (ty - py) * ih / 100;
      const len = Math.hypot(dx, dy) || 1;
      const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
      const arrow = document.createElement("div");
      arrow.className = "treasure-guide-arrow";
      arrow.style.left = `${px}vw`;
      arrow.style.top = `${py}vh`;
      arrow.style.width = `${Math.min(len * 0.55, iw * 0.12)}px`;
      arrow.style.transform = `translate(-2px, -50%) rotate(${angleDeg}deg)`;
      arrow.setAttribute("aria-hidden", "true");
      container.appendChild(arrow);
      this._treasureGuideArrow = arrow;
      const ring = document.createElement("div");
      ring.className = "treasure-guide-ring";
      ring.style.left = `${tx}vw`;
      ring.style.top = `${ty}vh`;
      ring.setAttribute("aria-hidden", "true");
      container.appendChild(ring);
      this._treasureGuideRing = ring;
      this.state.trackTimeout(setTimeout(() => this._clearTreasureGuide(), 12e3));
    }
    _clearTreasureGuide() {
      this._treasureGuideArrow?.remove();
      this._treasureGuideRing?.remove();
      this._treasureGuideArrow = null;
      this._treasureGuideRing = null;
    }
    _startEnemyMovement(enemy) {
      const s = this.state;
      if (enemy.moveAnimationId) s.cancelAnimation(enemy.moveAnimationId);
      let ex = parseFloat(enemy.element.style.left);
      let ey = parseFloat(enemy.element.style.top);
      const animate = () => {
        if (s.gamePaused || s.gameOver) return;
        if (enemy.frozen) {
          const prevFrozen = enemy.moveAnimationId;
          enemy.moveAnimationId = requestAnimationFrame(animate);
          s.trackAnimation(enemy.moveAnimationId, prevFrozen);
          return;
        }
        const { x: px, y: py } = this.ui.getPlayerPosition();
        const behavior = enemy.typeConfig.behavior;
        const simNow = getProjectedSimMs(s);
        let speed = scaleMovementSpeed(s, enemy.stats.moveSpeed);
        if (behavior === "dash" && !enemy.dashing && simNow - enemy.lastDashTime >= (enemy.typeConfig.dashCooldown || 3e3)) {
          enemy.dashing = true;
          enemy.lastDashTime = simNow;
          speed *= enemy.typeConfig.dashSpeed || 2.5;
          const dashTimeout = setTimeout(() => {
            enemy.dashing = false;
          }, scaledRealTimeoutMs(s, 400));
          s.trackTimeout(dashTimeout);
        }
        const angle = Math.atan2(py - ey, px - ex);
        const dist = distanceVw(ex, ey, px, py, window.innerWidth, window.innerHeight);
        const stopRange = behavior === "ranged" ? (enemy.typeConfig.rangedRange || 180) * 0.6 : enemy.stats.attackRange;
        if (dist > stopRange) {
          ex += Math.cos(angle) * speed;
          ey += Math.sin(angle) * speed;
          enemy.element.style.left = `${ex}vw`;
          enemy.element.style.top = `${ey}vh`;
        }
        const prevMove = enemy.moveAnimationId;
        enemy.moveAnimationId = requestAnimationFrame(animate);
        s.trackAnimation(enemy.moveAnimationId, prevMove);
      };
      animate();
    }
    _attackNearestEnemy(fromX, fromY, excludeTarget = null, remainingBounce = null, attackOpts = {}) {
      const s = this.state;
      const rangeX = attackOpts.rangeCenterX ?? fromX;
      const rangeY = attackOpts.rangeCenterY ?? fromY;
      let nearest = null;
      let minDist = s.stats.attackRange;
      s.enemies.forEach((enemy) => {
        if (excludeTarget && enemy.id === excludeTarget.id) return;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        const dist = distanceVw(rangeX, rangeY, ex, ey, window.innerWidth, window.innerHeight);
        if (dist <= s.stats.attackRange && dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      });
      if (!nearest) return;
      const forceProjectile = Boolean(attackOpts.forceProjectile || attackOpts.projectileClass);
      const isMelee = !forceProjectile && usesMeleeBasicAttack(s.selectedModelClass);
      if (!excludeTarget && !attackOpts.skipPlayerAnim) {
        s.lastAttackTime = getProjectedSimMs(s);
        const tx = parseFloat(nearest.element.style.left);
        const ty = parseFloat(nearest.element.style.top);
        if (isMelee) {
          this.effects.triggerMeleeAttackAnimation(this.ui.els.player, fromX, fromY, tx, ty);
        } else {
          this.effects.triggerAttackAnimation(this.ui.els.player);
        }
        this.effects.flashAttackRange(this.ui.els.attackRange);
        this.audio?.playSfx?.("attack");
      }
      if (isMelee) {
        this._dealDamageToEnemy(
          nearest,
          false,
          Boolean(excludeTarget),
          attackOpts.damageMultiplier ?? 1
        );
        const bounces = remainingBounce ?? s.abilityList.Bounce.level;
        if (bounces > 0) {
          this._attackNearestEnemy(fromX, fromY, nearest, bounces - 1, {
            ...attackOpts,
            forceProjectile: true
          });
        }
        return;
      }
      this._fireBullet(fromX, fromY, nearest, excludeTarget, remainingBounce, attackOpts);
    }
    _fireBullet(fromX, fromY, target, excludeTarget, remainingBounce, attackOpts = {}) {
      const s = this.state;
      const projectileClass = attackOpts.projectileClass || "projectile-physical";
      const el = document.createElement("div");
      el.className = `projectile ${projectileClass}`;
      el.innerHTML = '<span class="projectile-core"></span><span class="projectile-tail"></span>';
      el.style.left = `${fromX}vw`;
      el.style.top = `${fromY}vh`;
      this.ui.els.gameContainer.appendChild(el);
      const bullet = {
        element: el,
        remainingBounce: remainingBounce ?? s.abilityList.Bounce.level,
        targetEnemy: target,
        excludeTarget,
        moveAnimationId: null,
        elementType: "physical",
        damageMultiplier: attackOpts.damageMultiplier ?? 1,
        attackOpts
      };
      s.bullets.push(bullet);
      const timeoutId = setTimeout(() => {
        s.cancelAnimation(bullet.moveAnimationId);
        bullet.element.remove();
        const idx = s.bullets.indexOf(bullet);
        if (idx !== -1) s.bullets.splice(idx, 1);
        s.pendingTimeouts.delete(timeoutId);
      }, 5e3);
      s.trackTimeout(timeoutId);
      this._startBulletMovement(bullet);
    }
    _startBulletMovement(bullet) {
      const s = this.state;
      const target = bullet.targetEnemy;
      if (!target || !target.element.parentElement) {
        bullet.element.remove();
        const idx = s.bullets.indexOf(bullet);
        if (idx !== -1) s.bullets.splice(idx, 1);
        return;
      }
      if (bullet.moveAnimationId) s.cancelAnimation(bullet.moveAnimationId);
      let bx = parseFloat(bullet.element.style.left);
      let by = parseFloat(bullet.element.style.top);
      const tx = parseFloat(target.element.style.left);
      const ty = parseFloat(target.element.style.top);
      const angle = Math.atan2(ty - by, tx - bx);
      const speed = 1.2;
      const animate = () => {
        if (s.gamePaused || s.gameOver) return;
        bx += Math.cos(angle) * speed;
        by += Math.sin(angle) * speed;
        bullet.element.style.left = `${bx}vw`;
        bullet.element.style.top = `${by}vh`;
        let hit = null;
        for (const enemy of s.enemies) {
          if (bullet.excludeTarget && enemy.id === bullet.excludeTarget.id) continue;
          const ex = parseFloat(enemy.element.style.left);
          const ey = parseFloat(enemy.element.style.top);
          const ew = enemy.element.offsetWidth * 100 / window.innerWidth;
          const eh = enemy.element.offsetHeight * 100 / window.innerHeight;
          if (Math.abs(bx - ex) < ew / 2 && Math.abs(by - ey) < eh / 2 && enemy.stats.hp > 0) {
            hit = enemy;
            break;
          }
        }
        if (hit) {
          this._dealDamageToEnemy(
            hit,
            false,
            bullet.remainingBounce > 0,
            bullet.damageMultiplier ?? 1
          );
          if (bullet.remainingBounce > 0) {
            bullet.remainingBounce--;
            this._attackNearestEnemy(bx, by, hit, bullet.remainingBounce, bullet.attackOpts || {});
          }
          s.cancelAnimation(bullet.moveAnimationId);
          bullet.element.remove();
          const idx = s.bullets.indexOf(bullet);
          if (idx !== -1) s.bullets.splice(idx, 1);
        } else {
          const prev = bullet.moveAnimationId;
          bullet.moveAnimationId = requestAnimationFrame(animate);
          s.trackAnimation(bullet.moveAnimationId, prev);
        }
      };
      animate();
    }
    _getAbilityLevels() {
      const a = this.state.abilityList;
      return {
        reflectLevel: a.Reflect.level,
        bounceLevel: a.Bounce.level,
        hpToDamageLevel: a["HP To Damage"].level,
        regenToDamageLevel: a["Regen To Damage"].level,
        lifestealLevel: a.Lifesteal.level,
        damageReductionLevel: a["Damage Reduction"].level
      };
    }
    _dealDamageToEnemy(hitEnemy, isReflect, isBounce, damageMultiplier = 1) {
      const s = this.state;
      if (rollEnemyEvade(hitEnemy.stats.evadeChance)) {
        const ex2 = parseFloat(hitEnemy.element.style.left);
        const ey2 = parseFloat(hitEnemy.element.style.top);
        this.effects.spawnDamageNumber(ex2, ey2 - 2, "MISS", false);
        return { damage: 0, isCritical: false, missed: true };
      }
      const abilities = this._getAbilityLevels();
      const { damage: rawDamage, isCritical } = calculatePlayerDamage({
        physicalDamage: Math.max(1, Math.floor(s.stats.physicalDamage * damageMultiplier)),
        targetArmour: hitEnemy.stats.armour,
        maxHp: s.stats.maxHp,
        hpRegen: s.stats.hpRegen,
        isReflect,
        isBounce,
        critChance: s.stats.critChance,
        critMultiplier: s.stats.critMultiplier,
        abilities
      });
      const damage = this.characterPassives?.modifyPhysicalDamage?.(rawDamage) ?? rawDamage;
      hitEnemy.stats.hp -= damage;
      const ex = parseFloat(hitEnemy.element.style.left);
      const ey = parseFloat(hitEnemy.element.style.top);
      this.effects.triggerEnemyHitAnimation(hitEnemy.element);
      this.effects.spawnHitEffect(ex, ey, isCritical ? "crit" : "physical");
      this.effects.spawnDamageNumber(ex, ey - 2, damage, isCritical, "physical");
      this._updateEnemyHealthBar(hitEnemy);
      if (hitEnemy.stats.hp <= 0) {
        this._removeEnemy(hitEnemy);
      } else if (!isReflect && !isBounce) {
        const heal = calculateLifesteal({ damage, lifestealLevel: abilities.lifestealLevel });
        if (heal > 0) {
          s.stats.hp += heal;
        }
      }
      const result = { damage, isCritical };
      if (!isReflect && !isBounce) {
        this.characterPassives?.onBasicHit(hitEnemy, result);
      }
      return result;
    }
    /** Skill damage — bypasses bounce penalty, uses element for visuals */
    _dealSkillDamageToEnemy(hitEnemy, damage, element, isCrit = false, skillId = null) {
      const s = this.state;
      if (rollEnemyEvade(hitEnemy.stats.evadeChance)) {
        const ex2 = parseFloat(hitEnemy.element.style.left);
        const ey2 = parseFloat(hitEnemy.element.style.top);
        this.effects.spawnDamageNumber(ex2, ey2 - 2, "MISS", false);
        return { damage: 0, missed: true };
      }
      damage = this.characterPassives?.modifySkillDamage(damage, { element, skillId }) ?? damage;
      damage = Math.max(1, Math.floor(damage));
      hitEnemy.stats.hp -= damage;
      const ex = parseFloat(hitEnemy.element.style.left);
      const ey = parseFloat(hitEnemy.element.style.top);
      this.effects.triggerEnemyHitAnimation(hitEnemy.element);
      this.effects.spawnHitEffect(ex, ey, element);
      this.effects.spawnDamageNumber(ex, ey - 2, damage, isCrit, element);
      this._updateEnemyHealthBar(hitEnemy);
      if (hitEnemy.stats.hp <= 0) {
        this._removeEnemy(hitEnemy);
      }
    }
    _applyBurn(enemy, totalBurnDamage, duration) {
      if (totalBurnDamage <= 0) return;
      const s = this.state;
      const simNow = getProjectedSimMs(s);
      this.effects.applyBurnAura(enemy.element);
      if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
      s.statusEffects[enemy.id].burn = {
        damagePerTick: totalBurnDamage / 6,
        endTime: simNow + duration,
        lastTick: simNow
      };
    }
    _applySlow(enemy, slowPercent, duration) {
      const s = this.state;
      const simNow = getProjectedSimMs(s);
      this.effects.applyFrostAura(enemy.element);
      enemy.stats.moveSpeed = enemy.baseMoveSpeed * (1 - slowPercent / 100);
      if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
      s.statusEffects[enemy.id].slow = { endTime: simNow + duration };
    }
    _applyFreeze(enemy, duration) {
      const s = this.state;
      const simNow = getProjectedSimMs(s);
      enemy.frozen = true;
      if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
      s.statusEffects[enemy.id].freeze = { endTime: simNow + duration };
    }
    _enemyAttackPlayer(enemy) {
      if ((enemy.stats?.hp ?? 0) <= 0) return;
      const s = this.state;
      const { x: px, y: py } = this.ui.getPlayerPosition();
      const ex = parseFloat(enemy.element.style.left);
      const ey = parseFloat(enemy.element.style.top);
      const dist = distanceVw(ex, ey, px, py, window.innerWidth, window.innerHeight);
      if (enemy.typeConfig.behavior === "ranged" && dist <= (enemy.typeConfig.rangedRange || 220)) {
        this.effects.triggerEnemyAttackAnimation(enemy.element, px, py);
        this._fireEnemyProjectile(enemy);
        return;
      }
      if (dist <= enemy.stats.attackRange) {
        this.effects.triggerEnemyAttackAnimation(enemy.element, px, py);
        if (rollChance(s.stats.evade)) return;
        const abilities = this._getAbilityLevels();
        const damage = calculatePlayerIncomingDamage({
          enemyDamage: enemy.stats.physicalDamage,
          playerArmour: s.stats.armour,
          damageReductionLevel: abilities.damageReductionLevel,
          ignoreArmour: Boolean(enemy.stats.ignoreArmour),
          elapsedSeconds: s.elapsedSeconds
        });
        this.dealPlayerDamage(damage);
        this._applyReflectDamage(enemy);
      }
    }
    /**
     * Return-damage Reflect: % of player physical damage, reduced by enemy armour.
     * @param {object} enemy
     */
    _applyReflectDamage(enemy) {
      const s = this.state;
      if (!enemy) return;
      const { reflectLevel } = this._getAbilityLevels();
      if (reflectLevel <= 0) return;
      const { reflected, remainingHp } = applyReflectDamageToAttacker({
        playerPhysicalDamage: s.stats.physicalDamage,
        reflectLevel,
        enemyArmour: enemy.stats?.armour ?? 0,
        attackerHp: enemy.stats?.hp ?? 0
      });
      if (reflected <= 0) return;
      enemy.stats.hp = remainingHp;
      const ex = parseFloat(enemy.element.style.left);
      const ey = parseFloat(enemy.element.style.top);
      this.effects.triggerEnemyHitAnimation(enemy.element);
      if (!this.effects.isCosmeticThrottled()) {
        this.effects.spawnHitEffect(ex, ey, "reflect");
      }
      this.effects.spawnDamageNumber(ex, ey - 2, reflected, false, "reflect");
      this._updateEnemyHealthBar(enemy);
      if (enemy.stats.hp <= 0) this._removeEnemy(enemy);
    }
    _fireEnemyProjectile(enemy) {
      if ((enemy.stats?.hp ?? 0) <= 0) return;
      const s = this.state;
      const ex = parseFloat(enemy.element.style.left);
      const ey = parseFloat(enemy.element.style.top);
      const ignoreArmour = Boolean(enemy.stats.ignoreArmour);
      const damage = enemy.stats.physicalDamage;
      const ownerId = enemy.id;
      this.enemyProjectiles.spawn({
        x: ex,
        y: ey,
        ownerId,
        onHit: () => {
          if (!s.enemies.some((e) => e.id === ownerId && (e.stats?.hp ?? 0) > 0)) return;
          if (rollChance(s.stats.evade)) return;
          const abilities = this._getAbilityLevels();
          this.dealPlayerDamage(calculatePlayerIncomingDamage({
            enemyDamage: damage,
            playerArmour: s.stats.armour,
            damageReductionLevel: abilities.damageReductionLevel,
            ignoreArmour,
            elapsedSeconds: s.elapsedSeconds
          }));
          const attacker = s.enemies.find((e) => e.id === ownerId);
          if (attacker?.stats?.hp > 0) this._applyReflectDamage(attacker);
        }
      });
    }
    _removeEnemy(enemy) {
      this._forceRemoveEnemy(enemy, true);
    }
    /** @param {object} enemy @param {boolean} grantRewards */
    _forceRemoveEnemy(enemy, grantRewards) {
      const s = this.state;
      const ex = parseFloat(enemy.element.style.left);
      const ey = parseFloat(enemy.element.style.top);
      if (grantRewards) {
        s.killCount++;
        if (enemy.rarity === "elite") s.elitesKilled = (s.elitesKilled || 0) + 1;
        if (enemy.rarity === "boss") s.bossesKilled = (s.bossesKilled || 0) + 1;
        this.audio?.playSfx?.("kill");
        const now = Date.now();
        const streakBonus = this.killStreak.recordKill(
          now,
          EXP_CONFIG.streakBonusPerKill,
          EXP_CONFIG.streakBonusCap
        );
        const expGain = calculateExpFromKill(
          enemy.stats.exp,
          this.characterPassives?.modifyExpGain(s.stats.expGain) ?? s.stats.expGain,
          streakBonus,
          {
            waveIndex: s.currentDifficultyLevel,
            enemyType: enemy.typeConfig?.type || enemy.element?.dataset?.enemyType || "grunt"
          }
        );
        s.stats.exp += expGain;
        this.effects.spawnExpOrbs(ex, ey);
        this.ui.flashHudBar("exp");
        if (enemy.isTreasure) {
          this.treasureEvents?.recordOpen();
          this._clearTreasureGuide();
        }
        if (enemy.isFinalVictoryBoss) {
          this._onFinalVictoryBossDefeated();
        }
        this._tryDropGear(enemy, ex, ey);
        if (s.stats.exp >= s.stats.expThreshold) this._afterExpChange();
        this._checkAchievements();
      }
      this.effects.spawnDeathExplosion(ex, ey, enemy.rarity);
      delete s.statusEffects[enemy.id];
      handleEnemyDeathEffects(this, enemy, ex, ey, grantRewards);
      if (enemy.milestoneBossWave) {
        this.bossHud.onBossDeath(enemy, s.enemies);
      }
      s.cancelAnimation(enemy.moveAnimationId);
      delete s.enemyAttackCooldown[enemy.id];
      this.enemyProjectiles?.removeForOwner(enemy.id);
      enemy.element.remove();
      const idx = s.enemies.indexOf(enemy);
      if (idx !== -1) s.enemies.splice(idx, 1);
    }
    /** @param {object} enemy @param {number} x @param {number} y */
    _tryDropGear(enemy, x, y) {
      const ilvl = computeDropIlvl(
        this.state.stats.level,
        this.state.currentDifficultyLevel
      );
      if (enemy.milestoneBossWave && milestoneBossGuaranteesUniqueLoot(enemy.milestoneBossWave)) {
        this._grantGearItem(rollGuaranteedUniqueDrop(ilvl), x, y);
        return;
      }
      const category = enemy.isTreasure ? "treasure" : enemy.rarity;
      if (!shouldDropGear(category, this.state.currentWave)) return;
      this._grantGearItem(rollLootDrop(category, ilvl), x, y);
    }
    /** @param {object} item @param {number} x @param {number} y */
    _grantGearItem(item, x, y) {
      if (this.gearLootFilter?.shouldAutoDelete(item.rarity)) return;
      if (!this.gearInventory.addItem(item)) return;
      this.state.itemsLooted += 1;
      this.effects.spawnLootBurst(x, y);
      this.audio?.playSfx?.("loot");
      const r = RARITY_CONFIG2[item.rarity];
      this.ui.showGearLoot(item.name, r.cssClass);
      this.gearPanel?.pulseNewLoot();
      this.gearPanel?.refresh();
    }
    _onPlayerDamaged() {
      flashPlayerSprite(this.ui.els.player, "player-hit", 200);
      shakePlayerAnchor(this.ui.els.playerAnchor);
      this.ui.flashHudBar("hp");
      this.audio?.playSfx?.("hurt");
    }
    _equipGear(itemId) {
      if (!this.gearInventory?.equip(itemId, this.state.stats)) return;
      this.ui.updateStats(this.state.stats, this.state.skillList);
      this.ui.updateAttackRange(this.state.stats.attackRange);
      this.gearPanel?.refresh();
      this._checkAchievements();
    }
    _unequipGear(slot) {
      if (!this.gearInventory?.unequip(slot, this.state.stats)) return;
      this.ui.updateStats(this.state.stats, this.state.skillList);
      this.ui.updateAttackRange(this.state.stats.attackRange);
      this.gearPanel?.refresh();
    }
    _deleteGear(itemId) {
      if (!this.gearInventory?.removeItem(itemId)) return;
      this.gearPanel?.refresh();
    }
    _bulkDeleteGear(rarity) {
      const removed = this.gearInventory?.removeByRarities([rarity]) ?? 0;
      if (removed > 0) this.gearPanel?.refresh();
    }
    /** Bank earned levels and refresh the non-blocking upgrade panel. */
    _afterExpChange() {
      const s = this.state;
      const before = s.pendingUpgrades?.length || 0;
      bankExpLevelUps(s);
      if ((s.pendingUpgrades?.length || 0) > before) {
        this.audio?.playSfx?.("levelup");
      }
      this._refreshUpgradePanel();
      this.ui.updateStats(s.stats, s.skillList);
    }
    _refreshUpgradePanel() {
      const s = this.state;
      const pendingList = s.pendingUpgrades || [];
      const count = pendingList.length;
      const summary = summarizeUpgradeQueue(pendingList);
      this.upgradePanel?.updateBadge(count);
      this.upgradePanel?.updateQueueSummary(summary, count);
      if (count <= 0) {
        this._activeUpgradeCategory = null;
        this._upgradeOptionCache = { stat: null, skill: null };
        this.upgradePanel?.showEmptyState();
        return;
      }
      if (this._activeUpgradeCategory) {
        const options = this._buildUpgradeOptions(this._activeUpgradeCategory);
        const remaining = summary[this._activeUpgradeCategory] || 0;
        if (options.length === 0 || remaining <= 0) {
          this._clearUpgradeCache(this._activeUpgradeCategory);
          this._activeUpgradeCategory = null;
        } else {
          this.upgradePanel?.renderChoices(
            this._activeUpgradeCategory,
            options,
            () => {
              this._clearUpgradeCache(this._activeUpgradeCategory);
              this._activeUpgradeCategory = null;
              this._refreshUpgradePanel();
            },
            remaining
          );
          return;
        }
      }
      this.upgradePanel?.renderCategoryMenu(summary);
    }
    /** @param {'stat'|'skill'|'ability'} type */
    _buildUpgradeOptions(type) {
      const s = this.state;
      if (type === "stat") {
        if (this._upgradeOptionCache?.stat) {
          return buildStatUpgradeOptionsFromKeys(s.statsList, this._upgradeOptionCache.stat);
        }
        return buildStatUpgradeOptions(s.statsList);
      }
      if (type === "skill") {
        if (this._upgradeOptionCache?.skill) {
          return buildSkillUpgradeOptionsFromKeys(s.skillList, this._upgradeOptionCache.skill);
        }
        return buildSkillUpgradeOptions(s.skillList);
      }
      return buildAbilityUpgradeOptions(
        s.abilityList,
        (name) => formatAbilityDescription(s.abilityList[name])
      );
    }
    /** @param {'stat'|'skill'|'ability'} type */
    _clearUpgradeCache(type) {
      if (!this._upgradeOptionCache) return;
      if (type === "stat") this._upgradeOptionCache.stat = null;
      if (type === "skill") this._upgradeOptionCache.skill = null;
    }
    /** @param {'stat'|'skill'|'ability'} type */
    _ensureUpgradeCache(type) {
      if (!this._upgradeOptionCache) {
        this._upgradeOptionCache = { stat: null, skill: null };
      }
      const s = this.state;
      if (type === "stat" && !this._upgradeOptionCache.stat) {
        this._upgradeOptionCache.stat = rollStatUpgradeKeys(s.statsList);
      }
      if (type === "skill" && !this._upgradeOptionCache.skill) {
        this._upgradeOptionCache.skill = rollSkillUpgradeKeys(s.skillList);
      }
    }
    /** @param {'stat'|'skill'|'ability'} type */
    _selectUpgradeCategory(type) {
      const summary = summarizeUpgradeQueue(this.state.pendingUpgrades || []);
      if (!summary[type]) return;
      this._ensureUpgradeCache(type);
      this._activeUpgradeCategory = type;
      this._refreshUpgradePanel();
    }
    /** Spend one banked upgrade point while the game keeps running. */
    _spendUpgrade(choiceKey) {
      const s = this.state;
      const type = this._activeUpgradeCategory;
      if (!type) return;
      const consumed = consumePendingUpgradeByType(s, type);
      if (!consumed) return;
      if (type === "stat") {
        applyStatUpgrade(choiceKey, s.stats, s.originalStats, s.statsList);
      } else if (type === "ability") {
        s.abilityList[choiceKey].level += 1;
      } else if (type === "skill") {
        s.skillList[choiceKey].level += 1;
        syncPlayerSkillLevels(s.stats.skills, s.skillList);
      }
      const summary = summarizeUpgradeQueue(s.pendingUpgrades || []);
      this._clearUpgradeCache(type);
      if (!summary[type]) {
        this._activeUpgradeCategory = null;
      } else if (type === "stat" || type === "skill") {
        this._ensureUpgradeCache(type);
      }
      this.ui.updateAttackRange(s.stats.attackRange);
      this._refreshUpgradePanel();
      this.ui.updateStats(s.stats, s.skillList);
      if (s.stats.exp >= s.stats.expThreshold) {
        this._afterExpChange();
      }
    }
    _updateEnemyHealthBar(enemy) {
      const fill = enemy.element.querySelector(".enemy-health-bar-fill");
      if (fill) {
        fill.style.width = `${enemy.stats.hp / enemy.stats.maxHp * 100}%`;
      }
      if (enemy.milestoneBossWave) {
        this.bossHud.update(enemy);
      }
    }
  };

  // js/main.js
  document.addEventListener("DOMContentLoaded", () => {
    new Game();
  });
})();
//# sourceMappingURL=game.bundle.js.map

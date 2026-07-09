import { describe, it, expect } from 'vitest';
import {
    computeLevelUpHpGain,
    computeLevelUpMaxHpGain,
    computeArmourUpgradeIncrement
} from '../js/config/playerProgression.js';

describe('player progression HP and armour', () => {
    it('grants more HP per character level than the legacy curve', () => {
        const legacyHp = Math.floor(5 + 2 + 100 / 150);
        const legacyMaxHp = Math.floor(5 + 1.5 * 2 + 100 / 150);
        expect(computeLevelUpHpGain(2, 100)).toBeGreaterThan(legacyHp);
        expect(computeLevelUpMaxHpGain(2, 100)).toBeGreaterThan(legacyMaxHp);
    });

    it('scales armour upgrades with a stronger panel curve', () => {
        const legacyArmour = Math.floor(1 + 1 / 2 + 48 / 40);
        expect(computeArmourUpgradeIncrement(1, 48)).toBeGreaterThan(legacyArmour);
        expect(computeArmourUpgradeIncrement(10, 48)).toBeGreaterThan(10);
    });
});

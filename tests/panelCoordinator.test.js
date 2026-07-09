import { describe, it, expect } from 'vitest';
import { bindExclusiveGearUpgradePanels, collapseSidePanelsOnPause } from '../js/ui/panelCoordinator.js';

function createPanel(initialExpanded) {
    return {
        expanded: initialExpanded,
        isExpanded() { return this.expanded; },
        toggle(force) {
            if (typeof force === 'boolean') this.expanded = force;
            else this.expanded = !this.expanded;
        }
    };
}

describe('bindExclusiveGearUpgradePanels', () => {
    it('closes upgrade when gear expands on mobile only', () => {
        const gearPanel = createPanel(false);
        const upgradePanel = createPanel(true);

        bindExclusiveGearUpgradePanels(gearPanel, upgradePanel, () => true);
        gearPanel.toggle(true);
        expect(gearPanel.isExpanded()).toBe(true);
        expect(upgradePanel.isExpanded()).toBe(false);
    });

    it('keeps both panels open on desktop when toggling either panel', () => {
        const gearPanel = createPanel(false);
        const upgradePanel = createPanel(true);

        bindExclusiveGearUpgradePanels(gearPanel, upgradePanel, () => false);
        gearPanel.toggle(true);
        expect(gearPanel.isExpanded()).toBe(true);
        expect(upgradePanel.isExpanded()).toBe(true);

        upgradePanel.toggle(true);
        expect(upgradePanel.isExpanded()).toBe(true);
        expect(gearPanel.isExpanded()).toBe(true);
    });

    it('collapseSidePanelsOnPause closes both panels', () => {
        const gearPanel = createPanel(true);
        const upgradePanel = createPanel(true);

        collapseSidePanelsOnPause(gearPanel, upgradePanel);
        expect(gearPanel.isExpanded()).toBe(false);
        expect(upgradePanel.isExpanded()).toBe(false);
    });
});

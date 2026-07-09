/**
 * Gear / upgrade panel coordination — mutually exclusive on mobile, independent on desktop.
 */
import { isMobileViewport } from '../utils/viewport.js';

/**
 * @param {import('./gearPanel.js').GearPanel} gearPanel
 * @param {import('./upgradePanel.js').UpgradePanel} upgradePanel
 * @param {() => boolean} [isMobileLayout] Defaults to viewport width ≤ 768px.
 */
export function bindExclusiveGearUpgradePanels(
    gearPanel,
    upgradePanel,
    isMobileLayout = isMobileViewport
) {
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

/**
 * Collapse gear and upgrade panels when the pause overlay opens.
 * @param {import('./gearPanel.js').GearPanel|undefined|null} gearPanel
 * @param {import('./upgradePanel.js').UpgradePanel|undefined|null} upgradePanel
 */
export function collapseSidePanelsOnPause(gearPanel, upgradePanel) {
    gearPanel?.toggle(false);
    upgradePanel?.toggle(false);
}

/** @deprecated Alias */
export const bindGearUpgradePanelCoordinator = bindExclusiveGearUpgradePanels;

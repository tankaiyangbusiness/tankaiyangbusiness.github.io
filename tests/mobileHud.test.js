import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileHudController } from '../js/ui/mobileHud.js';

function createMenuButton() {
    const btn = {
        hidden: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    };
    return btn;
}

describe('MobileHudController', () => {
    /** @type {ReturnType<typeof createMenuButton>} */
    let menuBtn;

    beforeEach(() => {
        menuBtn = createMenuButton();
        vi.stubGlobal('window', {
            innerWidth: 390,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        });
        vi.stubGlobal('document', {
            documentElement: {
                classList: {
                    toggle: vi.fn()
                }
            },
            getElementById: vi.fn((id) => (id === 'mobile-menu-btn' ? menuBtn : null))
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('syncs layout-mobile class from viewport width', () => {
        const hud = new MobileHudController();
        hud.syncLayoutClass();
        expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('layout-mobile', true);

        window.innerWidth = 1200;
        hud.syncLayoutClass();
        expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('layout-mobile', false);
    });

    it('collapses in-game panels on mobile when applying for game', () => {
        const gearPanel = { toggle: vi.fn() };
        const upgradePanel = { toggle: vi.fn() };
        const enemyGuidePanel = { collapse: vi.fn() };

        const hud = new MobileHudController();
        hud.applyForGame({ gearPanel, upgradePanel, enemyGuidePanel });

        expect(gearPanel.toggle).toHaveBeenCalledWith(false);
        expect(upgradePanel.toggle).toHaveBeenCalledWith(false);
        expect(enemyGuidePanel.collapse).toHaveBeenCalled();
    });

    it('does not collapse panels on desktop viewport', () => {
        window.innerWidth = 1280;
        const gearPanel = { toggle: vi.fn() };
        const upgradePanel = { toggle: vi.fn() };

        const hud = new MobileHudController();
        hud.applyForGame({ gearPanel, upgradePanel });

        expect(gearPanel.toggle).not.toHaveBeenCalled();
        expect(upgradePanel.toggle).not.toHaveBeenCalled();
    });

    it('binds menu button click to the provided handler', () => {
        const onMenuPress = vi.fn();
        const hud = new MobileHudController();
        hud.bindMenuButton(onMenuPress);

        expect(menuBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        const handler = menuBtn.addEventListener.mock.calls[0][1];
        handler({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
        expect(onMenuPress).toHaveBeenCalledTimes(1);
    });

    it('shows gameplay menu button only on mobile when gameplay is active', () => {
        const hud = new MobileHudController();

        hud.setGameplayMenuVisible(true);
        expect(menuBtn.hidden).toBe(false);

        window.innerWidth = 1280;
        hud.syncLayoutClass();
        expect(menuBtn.hidden).toBe(true);

        window.innerWidth = 390;
        hud.syncLayoutClass();
        expect(menuBtn.hidden).toBe(false);

        hud.setGameplayMenuVisible(false);
        expect(menuBtn.hidden).toBe(true);
    });
});

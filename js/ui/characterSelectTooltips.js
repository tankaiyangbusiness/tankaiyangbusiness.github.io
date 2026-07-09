import { getCharacterPassive } from '../config/characterPassives.js';
import { isMobileViewport } from '../utils/viewport.js';
import {
    buildCharacterDescTooltipHtml,
    buildCharacterPassiveTooltipHtml,
    isPassiveHoverTarget,
    resolveCharacterCardTooltipMode
} from './characterSelectTooltipContent.js';
import { FloatingTooltipHost } from './floatingTooltipHost.js';

/**
 * Desktop character-select hover tooltips — one card-level handler so moving between
 * the card body and passive icon does not fire spurious mouseleave events.
 */
export class CharacterSelectTooltips {
    constructor() {
        this.descTip = new FloatingTooltipHost('floating-tooltip floating-tooltip--desc');
        this.passiveTip = new FloatingTooltipHost('floating-tooltip floating-tooltip--passive');
        /** @type {AbortController|null} */
        this._abort = null;
    }

    /** @param {HTMLElement|null} listEl */
    bind(listEl) {
        this.unbind();
        if (!listEl || isMobileViewport()) return;

        this._abort = new AbortController();
        const { signal } = this._abort;

        listEl.querySelectorAll('.character-card').forEach(card => {
            const descHtml = buildCharacterDescTooltipHtml(
                card.querySelector('.character-desc')?.textContent || ''
            );
            const passiveHtml = buildCharacterPassiveTooltipHtml(
                getCharacterPassive(card.dataset.character || '')
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

            card.addEventListener('mouseenter', syncTooltip, { signal });
            card.addEventListener('mousemove', syncTooltip, { signal });
            card.addEventListener('mouseleave', () => this._hideAll(), { signal });
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
        if (mode === 'passive') {
            this.descTip.hide();
            this.passiveTip.show(passiveHtml, clientX, clientY);
            return;
        }
        if (mode === 'desc') {
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
}

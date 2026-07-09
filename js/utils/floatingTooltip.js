/**
 * Shared fixed-position tooltip placement (gear items, character select, etc.).
 * @param {HTMLElement} el
 * @param {number} clientX
 * @param {number} clientY
 * @param {{ margin?: number, pad?: number }} [opts]
 */
export function positionFloatingTooltip(el, clientX, clientY, opts = {}) {
    const margin = opts.margin ?? 14;
    const pad = opts.pad ?? 8;

    el.hidden = false;
    el.style.visibility = 'hidden';
    el.style.left = '0px';
    el.style.top = '0px';

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
    el.style.visibility = 'visible';
}

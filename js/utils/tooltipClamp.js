/**
 * Clamp a tooltip inside a container by shifting horizontally and flipping above/below.
 * @param {DOMRect} tipRect
 * @param {DOMRect} boundsRect
 * @param {number} [pad]
 * @returns {{ shiftX: number, placement: 'above' | 'below' }}
 */
export function computeTooltipPlacement(tipRect, boundsRect, pad = 10) {
    const safePad = Math.max(0, pad);
    let shiftX = 0;

    if (tipRect.left < boundsRect.left + safePad) {
        shiftX = boundsRect.left + safePad - tipRect.left;
    } else if (tipRect.right > boundsRect.right - safePad) {
        shiftX = boundsRect.right - safePad - tipRect.right;
    }

    let placement = 'below';
    if (tipRect.bottom > boundsRect.bottom - safePad) {
        placement = 'above';
    }

    return { shiftX: Math.round(shiftX), placement };
}

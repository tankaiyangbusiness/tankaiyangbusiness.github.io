/** Max viewport width (px) treated as mobile layout — desktop UI unchanged above this. */
export const MOBILE_BREAKPOINT_PX = 768;

/**
 * @param {number} [width] Viewport width in px (defaults to window.innerWidth when available).
 * @returns {boolean}
 */
export function isMobileViewport(width) {
    const w = typeof width === 'number'
        ? width
        : (typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT_PX + 1);
    return w <= MOBILE_BREAKPOINT_PX;
}

/** In-game side panels start collapsed on mobile to maximize arena space. */
export function panelsStartCollapsed(width) {
    return isMobileViewport(width);
}

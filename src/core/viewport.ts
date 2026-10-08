import type { Bounds, Coordinate } from "./geometry";
const WORLD_RADIANS = 2 * Math.PI;
export const TILE_SIZE = 256;

export interface Viewport {
    width: number;
    height: number;

    translateX: number;
    translateY: number;

    scale: number;
}

export const scaleFromZoom = (zoom: number) => (TILE_SIZE * 2 ** zoom) / WORLD_RADIANS;
export const zoomFromScale = (scale: number) => Math.log2((scale * WORLD_RADIANS) / TILE_SIZE);

export function createViewport(width: number, height: number, zoom: number): Viewport {
    return { width, height, scale: scaleFromZoom(zoom), translateX: width / 2, translateY: height / 2 };
}
export function resizeViewport(view: Viewport, width: number, height: number): void {
    view.translateX += (width - view.width) / 2;
    view.translateY += (height - view.height) / 2;
    view.width = width;
    view.height = height;
}

export function panBy(view: Viewport, dx: number, dy: number): void {
    view.translateX += dx;
    view.translateY += dy;
}

export function zoomAt(view: Viewport, sx: number, sy: number, factor: number, minScale: number, maxScale: number): void {
    const next = Math.min(maxScale, Math.max(minScale, view.scale * factor));
    const ratio = next / view.scale;
    view.translateX = sx - (sx - view.translateX) * ratio;
    view.translateY = sy - (sy - view.translateY) * ratio;
    view.scale = next;
}

export function visibleBounds(view: Viewport): Bounds {
    return [
        [-view.translateX / view.scale, (view.translateY - view.height) / view.scale],
        [(view.width - view.translateX) / view.scale, view.translateY / view.scale],
    ];
}
import type { Coordinate } from "../core/geometry";

function clampLat(lat: number): number {
    return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

function clampLon(lon: number): number {
    return Math.max(-180, Math.min(180, lon));
}

function mercatorX(lon: number): number {
    return lon * Math.PI / 180;
}

function mercatorY(lat: number): number {
    const latRad = lat * Math.PI / 180;
    return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

export function lonLatToMercator([x, y]: Coordinate): Coordinate {
    return [mercatorX(clampLon(x)), mercatorY(clampLat(y))];
}

export function scaleToWebMercatorZoom(currentScale: number, tileSize: number = 256): number {
    if (currentScale <= 0) return 0;

    const zoom = Math.log2(currentScale / tileSize);

    return Math.max(0, zoom);
}

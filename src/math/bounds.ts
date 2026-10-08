import { lonLatToMercator } from "./projection";
import type { Bounds, Coordinate } from "../core/geometry"

export function updateBounds([minCorner, maxCorner]: Bounds, x: number, y: number) {
    minCorner[0] = Math.min(minCorner[0], x);
    minCorner[1] = Math.min(minCorner[1], y);
    maxCorner[0] = Math.max(maxCorner[0], x);
    maxCorner[1] = Math.max(maxCorner[1], y);
}

export function computeCoordsBounds(coords: number[][]): Bounds {
    const bounds: Bounds = [[Infinity, Infinity], [-Infinity, -Infinity]];

    coords.forEach(([lon, lat]) => {
        const [x, y] = lonLatToMercator([lon, lat]);
        updateBounds(bounds, x, y);

    });
    return bounds;
}

export function unionBounds(boxes: Bounds[]): Bounds {
    const result: Bounds = [[Infinity, Infinity], [-Infinity, -Infinity]];
    for (const b of boxes) {
        result[0][0] = Math.min(result[0][0], b[0][0]);
        result[0][1] = Math.min(result[0][1], b[0][1]);
        result[1][0] = Math.max(result[1][0], b[1][0]);
        result[1][1] = Math.max(result[1][1], b[1][1]);
    }
    return result;
}

export function boundsIntersect([minCorner1, maxCorner1]: Bounds, [minCorner2, maxCorner2]: Bounds) {
    return maxCorner1[0] >= minCorner2[0] && maxCorner2[0] >= minCorner1[0] && maxCorner1[1] >= minCorner2[1] && maxCorner2[1] >= minCorner1[1]
}

export function boundsContainsPoint(bounds: Bounds, point: Coordinate): boolean {
    return point[0] >= bounds[0][0] && point[0] <= bounds[1][0] &&
        point[1] >= bounds[0][1] && point[1] <= bounds[1][1];
}
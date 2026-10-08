import type { Bounds, Coordinate, BuiltGeometry } from "../core/geometry";
import { boundsIntersect, lonLatToMercator, vectorLength, vectorSubtract } from "../math";

export function flatten(points: Coordinate[]): Coordinate[] {
    const out = []
    for (let i = 0; i < points.length; i++) {
        const [x, y] = lonLatToMercator(points[i]);
        out.push([x, y] as Coordinate);
    }
    return out;
}

export function removeDuplicateEnds(ring: Coordinate[], epsilon = 1e-5): Coordinate[] {

    if (vectorLength(vectorSubtract(ring[ring.length - 1], ring[0])) < epsilon) {
        return ring.slice(0, -1);
    }

    return ring;
}

export function ringToPath(ring: Coordinate[], close = false) {
    const path = new Path2D();
    ring.forEach(([lon, lat], i) => {
        const [x, y] = lonLatToMercator([lon, lat]);
        i == 0 ? path.moveTo(x, y) : path.lineTo(x, y);
    });
    if (close) path.closePath();
    return path;
}

export function ringArea(ring: Coordinate[]): number {
    let area = 0;
    for (let i = 0; i < ring.length; i++) {
        const [x0, y0] = ring[i];
        const [x1, y1] = ring[(i + 1) % ring.length];
        area += x0 * y1 - x1 * y0;
    }
    return Math.abs(area / 2);
}

export function appendToPath(merged: Path2D, built: BuiltGeometry, visible: Bounds, zoomIndex: number): void {
    if (built.type === "MultiPolygon" || built.type === "MultiLineString") {
        for (const part of built.children) appendToPath(merged, part, visible, zoomIndex);
        return;
    }
    if (!boundsIntersect(built.bbox, visible)) return;
    const path = built.pathByZoom[zoomIndex];
    if (path) merged.addPath(path);
}
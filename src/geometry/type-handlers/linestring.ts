import type { BuiltGeometryMap, Coordinate, PreparedGeometryMap, RawCoordinateFormats, ZoomLevel } from "../../core/geometry";
import { computeCoordsBounds, lonLatToMercator } from "../../math";
import { setHandler } from "../registry";
import { buildRing, RingSimplifier } from "../simplification";
import { removeDuplicateEnds, ringArea } from "../utils";


export type PreparedLineString = PreparedGeometryMap["LineString"];
export type BuiltLineString = BuiltGeometryMap["LineString"];

export function prepareLineString(coordinates: RawCoordinateFormats["LineString"], zoomLevels: ZoomLevel[]): PreparedLineString {
    const bbox = computeCoordsBounds(coordinates);
    const simplifier = new RingSimplifier(buildRing(removeDuplicateEnds(coordinates), true), true)

    const coordinatesByZoom: Coordinate[][] = [];
    for (const zoomLevel of zoomLevels) {

        if (zoomLevel.areaThreshold != 0) simplifier.simplify(zoomLevel.areaThreshold);
        coordinatesByZoom.push(coordinates.map(position => lonLatToMercator(position)))

    }

    return { type: "LineString", bbox, coordinatesByZoom };
}

export function buildLineString(prepared: PreparedLineString): BuiltLineString {
    const pathByZoom: Path2D[] = [];
    prepared.coordinatesByZoom.forEach((pts, _) => {
        const path = new Path2D();
        if (pts.length >= 2) {
            path.moveTo(pts[0][0], pts[0][1]);
            for (let i = 2; i < pts.length; i += 2) path.lineTo(pts[i][0], pts[i][1]);
        }
        pathByZoom.push(path);
    });
    return { type: "LineString", bbox: prepared.bbox, pathByZoom };
}

setHandler("LineString", {
    prepare: (geometry, zoomLevels) => prepareLineString(geometry.coordinates, zoomLevels),
    build: buildLineString
});
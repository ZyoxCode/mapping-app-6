import type { BuiltGeometryMap, Coordinate, PreparedGeometryMap, RawCoordinateFormats, ZoomLevel } from "../../core/geometry";
import { computeCoordsBounds, lonLatToMercator } from "../../math";
import { setHandler } from "../registry";
import { buildRing, RingSimplifier } from "../simplification";
import { removeDuplicateEnds, ringArea } from "../utils";


export type PreparedPolygon = PreparedGeometryMap["Polygon"];
export type BuiltPolygon = BuiltGeometryMap["Polygon"];

export function preparePolygon(coordinates: RawCoordinateFormats["Polygon"], zoomLevels: ZoomLevel[]): PreparedPolygon {
    const bbox = computeCoordsBounds(coordinates[0]);
    let active = coordinates.map(ring =>
        new RingSimplifier(buildRing(removeDuplicateEnds(ring), true), true)
    );

    const coordinatesByZoom: Coordinate[][][] = [];
    for (const zoomLevel of zoomLevels) {
        const snapshots = active.map(r => {
            if (zoomLevel.areaThreshold != 0) r.simplify(zoomLevel.areaThreshold);
            return r.snapshot();
        });

        const keep = snapshots.map(ring =>
            ring.length >= 3 && (ring.length > 3 || ringArea(ring) >= zoomLevel.areaThreshold)
        );

        if (!keep[0]) {
            active = [];
            coordinatesByZoom.push([]);
            continue;
        }

        coordinatesByZoom.push(
            snapshots
                .filter((_, i) => keep[i])
                .map(ring => ring.map(position => lonLatToMercator(position)))
        );
        active = active.filter((_, i) => keep[i]);
    }

    return { type: "Polygon", bbox, coordinatesByZoom };
}

export function buildPolygon(prepared: PreparedPolygon): BuiltPolygon {
    const pathByZoom = prepared.coordinatesByZoom.map(rings => {
        const path = new Path2D();
        for (const ring of rings) {
            if (ring.length < 2) continue;
            path.moveTo(ring[0][0], ring[0][1]);
            for (let i = 1; i < ring.length; i++) path.lineTo(ring[i][0], ring[i][1]);
            path.closePath();
        }
        return path;
    });
    return { type: "Polygon", bbox: prepared.bbox, pathByZoom };
}


setHandler("Polygon", {
    prepare(geometry, zoomLevels) {
        return preparePolygon(geometry.coordinates, zoomLevels);
    },
    build(preparedGeometry) {
        return buildPolygon(preparedGeometry);
    }
})
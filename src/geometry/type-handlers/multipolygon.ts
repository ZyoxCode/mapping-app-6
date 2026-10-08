import type { BuiltGeometryMap, PreparedGeometryMap, RawCoordinateFormats, ZoomLevel } from "../../core/geometry";
import { computeCoordsBounds, unionBounds } from "../../math";
import { setHandler } from "../registry";
import { buildPolygon, preparePolygon } from "./polygon";

export type PreparedMultiPolygon = PreparedGeometryMap["MultiPolygon"];
export type BuiltMultiPolygon = BuiltGeometryMap["MultiPolygon"];

export function prepareMultiPolygon(coordinates: RawCoordinateFormats["MultiPolygon"], zoomLevels: ZoomLevel[]): PreparedMultiPolygon {
    return { type: "MultiPolygon", bbox: unionBounds(coordinates.map(coord => computeCoordsBounds(coord[0]))), children: coordinates.map(poly => preparePolygon(poly, zoomLevels)) };
}

export function buildMultiPolygon(prepared: PreparedMultiPolygon): BuiltMultiPolygon {
    return { type: "MultiPolygon", bbox: prepared.bbox, children: prepared.children.map(part => buildPolygon(part)) };
}

setHandler("MultiPolygon", {
    prepare: (geometry, zoomLevels) => prepareMultiPolygon(geometry.coordinates, zoomLevels),
    build: buildMultiPolygon,
});
import type { BuiltGeometryMap, PreparedGeometryMap, RawCoordinateFormats, ZoomLevel } from "../../core/geometry";
import { computeCoordsBounds, unionBounds } from "../../math";
import { setHandler } from "../registry";

import { buildLineString, prepareLineString } from "./linestring";

export type PreparedMultiLineString = PreparedGeometryMap["MultiLineString"];
export type BuiltMultiLineString = BuiltGeometryMap["MultiLineString"];

export function prepareMultiLineString(coordinates: RawCoordinateFormats["MultiLineString"], zoomLevels: ZoomLevel[]): PreparedMultiLineString {
    return { type: "MultiLineString", bbox: unionBounds(coordinates.map(coord => computeCoordsBounds(coord))), children: coordinates.map(poly => prepareLineString(poly, zoomLevels)) };
}

export function buildMultiLineString(prepared: PreparedMultiLineString): BuiltMultiLineString {
    return { type: "MultiLineString", bbox: prepared.bbox, children: prepared.children.map(part => buildLineString(part)) };
}

setHandler("MultiLineString", {
    prepare: (geometry, zoomLevels) => prepareMultiLineString(geometry.coordinates, zoomLevels),
    build: buildMultiLineString,
});



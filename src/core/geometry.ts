export type Coordinate = [number, number];
export type Bounds = [Coordinate, Coordinate];

export type SingleType = "Polygon" | "LineString"
export type MultiType = "MultiPolygon" | "MultiLineString"

export interface RawCoordinateFormats {
    LineString: Coordinate[];
    MultiLineString: Coordinate[][];
    Polygon: Coordinate[][];
    MultiPolygon: Coordinate[][][];
}

export type RawGeometry = {
    [K in keyof RawCoordinateFormats]: {
        type: K;
        coordinates: RawCoordinateFormats[K];
    }
}[keyof RawCoordinateFormats];

export interface ChildType {
    MultiLineString: "LineString";
    MultiPolygon: "Polygon";
}

export type PreparedSingle = {
    [K in SingleType]: {
        type: K,
        bbox: Bounds,
        coordinatesByZoom: RawCoordinateFormats[K][];
    }
}

export type PreparedMulti = {
    [K in MultiType]: {
        type: K,
        bbox: Bounds,
        children: PreparedSingle[ChildType[K]][];
    }
}

export type BuiltSingle = {
    [K in SingleType]: {
        type: K,
        bbox: Bounds,
        pathByZoom: Path2D[];
    }
}

export type BuiltMulti = {
    [K in MultiType]: {
        type: K,
        bbox: Bounds,
        children: BuiltSingle[ChildType[K]][],
    }
}

export type PreparedGeometryMap = PreparedSingle & PreparedMulti;
export type PreparedGeometry = PreparedGeometryMap[keyof PreparedGeometryMap];

export type BuiltGeometryMap = BuiltSingle & BuiltMulti;
export type BuiltGeometry = BuiltGeometryMap[keyof BuiltGeometryMap];

export interface ZoomLevel {
    upperZoomBound: number;
    areaThreshold: number;
}
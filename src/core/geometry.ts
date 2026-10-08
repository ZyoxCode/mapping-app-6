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

export type PreparedGeometry = PreparedSingle[SingleType] & PreparedMulti[MultiType];

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

export type BuiltGeometry = BuiltSingle[SingleType] & BuiltMulti[MultiType]

export interface ZoomLevel {
    upperZoomBound: number;
    areaThreshold: number;
}
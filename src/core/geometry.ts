export type Coordinate = [number, number];
export type Bounds = [Coordinate, Coordinate];

export interface RawCoordinateFormats {
    LineString: Coordinate[];
    MultiLineString: Coordinate[][];
    Polygon: Coordinate[][];
    MultiPolygon: Coordinate[][][];
}

export interface ZoomLevel {
    upperZoomBound: number;
    areaThreshold: number;
}
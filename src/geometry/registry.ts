import type { BuiltGeometry, PreparedGeometry, RawCoordinateFormats, ZoomLevel } from "../core/geometry";
export interface GeometryHandler<K extends keyof RawCoordinateFormats> {
    prepare(rawCoordinates: RawCoordinateFormats[K], zoomLevels: ZoomLevel[]): PreparedGeometry[K];
    build(prepared: PreparedGeometry[K]): BuiltGeometry[K];
}

const handlerRegistry = new Map<string, GeometryHandler<any>>();

export function setHandler<K extends keyof RawCoordinateFormats>(
    type: K,
    handler: GeometryHandler<K>
): void {
    handlerRegistry.set(type, handler);
}

export function getHandler<K extends keyof RawCoordinateFormats>(
    type: K
): GeometryHandler<K> | undefined {
    return handlerRegistry.get(type);
}
import type { BuiltGeometry, BuiltGeometryMap, PreparedGeometry, PreparedGeometryMap, RawCoordinateFormats, RawGeometry, ZoomLevel } from "../core/geometry";
export interface GeometryHandler<K extends keyof RawCoordinateFormats> {
    prepare(rawGeometry: Extract<RawGeometry, { type: K }>, zoomLevels: ZoomLevel[]): PreparedGeometryMap[K];
    build(prepared: PreparedGeometryMap[K]): BuiltGeometryMap[K];
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
): GeometryHandler<K> {
    const handler = handlerRegistry.get(type);
    if (!handler) throw new Error(`No geometry type of name ${type} in handler registry`);
    return handler as GeometryHandler<K>;
}

export function prepareGeometry(rawGeometry: RawGeometry, zoomLevels: ZoomLevel[]): PreparedGeometry | null {
    const handler = getHandler(rawGeometry.type);
    return handler.prepare(rawGeometry, zoomLevels) ?? null;
}

export function buildGeometry(preparedGeometry: PreparedGeometry): BuiltGeometry {
    const handler = getHandler(preparedGeometry.type);
    return handler.build(preparedGeometry);
}
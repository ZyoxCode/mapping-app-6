import type { BuiltGeometry, ZoomLevel } from "../../core/geometry";
import type { Viewport } from "../../core/viewport";
import { Layer, type LayerOptions } from "../layer";

export interface Feature {
    properties: Record<string, any>
}

export interface GeometryLayerOptions extends LayerOptions {
    zoomLevels?: ZoomLevel[];
}

export function zoomLevelIndex(webMercZoom: number, levels: ZoomLevel[]): number {
    const index = levels.findLastIndex(level => webMercZoom <= level.upperZoomBound);
    return index === -1 ? levels.length - 1 : index;
}

const DEFAULT_ZOOM_LEVELS: ZoomLevel[] = [
    { upperZoomBound: Infinity, areaThreshold: 0 },
    { upperZoomBound: 3, areaThreshold: 1 },

];

export abstract class GeometryLayer extends Layer {
    features: BuiltGeometry[] = [];
    constructor(options: GeometryLayerOptions) {
        super(options);
    }

    async load(ctx: CanvasRenderingContext2D): Promise<void> {

    }
    abstract loadFeatures(): Promise<Feature[]>;
    
    render(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
       
    }
}
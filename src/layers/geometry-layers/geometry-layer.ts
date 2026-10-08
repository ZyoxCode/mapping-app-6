import type { BuiltGeometry, RawGeometry, ZoomLevel } from "../../core/geometry";
import { visibleBounds, zoomFromScale, type Viewport } from "../../core/viewport";
import { buildGeometry, prepareGeometry } from "../../geometry";
import { appendToPath } from "../../geometry/utils";
import { resolveStyle, type Style } from "../../styles/stylerule";
import { Layer, type LayerOptions } from "../layer";

export interface RawFeature {
    properties: Record<string, any>;
    geometry: RawGeometry;
}

export interface BuiltFeature {
    properties: Record<string, any>;
    geometry: BuiltGeometry;
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
    features: BuiltFeature[] = [];
    zoomLevels: ZoomLevel[] = DEFAULT_ZOOM_LEVELS;

    constructor(options: GeometryLayerOptions) {
        super(options);
        this.zoomLevels = options.zoomLevels?.sort((a, b) => b.upperZoomBound - a.upperZoomBound)
            ?? DEFAULT_ZOOM_LEVELS; // making sure they are in descending order of zoom bound
    }

    abstract loadFeatures(): Promise<RawFeature[]>;

    async load(ctx: CanvasRenderingContext2D): Promise<void> {
        const rawFeatures = await this.loadFeatures();
        console.log(rawFeatures);
        this.features = rawFeatures.flatMap(feature => { // using flatmap and then returning [] for invalid ones and wrapping the valid ones in a list basically filters for me
            if (!feature.geometry || feature.geometry.coordinates.length == 0) return [];

            const prepared = prepareGeometry(feature.geometry, this.zoomLevels);
            if (!prepared) return [];

            return [{ ...feature, geometry: buildGeometry(prepared) }];

        })

        this.ready = true;
    }

    render(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
        const buckets = new Map<Style, Path2D>();

        const zoomIndex = zoomLevelIndex(zoomFromScale(viewport.scale), this.zoomLevels);

        for (const feature of this.features) {

            if (feature.properties.MIN_ZOOM >= zoomFromScale(viewport.scale)) continue;
            const geometry = feature.geometry;

            if (geometry && this.geometryStyle) {
                const style = resolveStyle(this.geometryStyle, feature.properties, zoomFromScale(viewport.scale));
                if (style) {
                    let path = buckets.get(style);

                    if (!path) {
                        path = new Path2D();
                        buckets.set(style, path);
                    }

                    if (style.enabled.fill || style.enabled.stroke) {
                        appendToPath(path, geometry, visibleBounds(viewport), zoomIndex);
                    }
                };
            }

        }

        if (!this.ready) return;


        for (const [style, path] of buckets) {
            style.apply(ctx, viewport.scale);
            if (style.enabled.stroke) ctx.stroke(path);
            if (style.enabled.fill) ctx.fill(path, 'evenodd');
        }
    }
}

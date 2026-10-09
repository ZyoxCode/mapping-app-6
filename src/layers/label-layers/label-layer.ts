import { toAbsoluteUrl } from "../../core/file";
import type { Coordinate } from "../../core/geometry";
import { visibleBounds, zoomFromScale, type Viewport } from "../../core/viewport";
import type { LabelQueueEntry } from "../../labels/label-queue";
import { buildLabelBounds, wrapText } from "../../labels/utils";
import { boundsContainsPoint, boundsIntersect, lonLatToMercator, offsetBounds } from "../../math";
import { resolveStyle } from "../../styles/stylerule";
import { Layer, type LayerOptions } from "../layer";


export interface LabelLayerOptions extends LayerOptions {
    path: string;
    targetPx?: number;
    maxChars?: number;
    layerOffset?: number;
}

export class LabelLayer extends Layer {
    path: string;
    labelEntries: LabelQueueEntry[] = [];
    targetPx: number; /* number of pixels the feature attached to the label should take up 
    on the screen before the label shows */
    maxChars: number; // per line before wrapping //
    layerOffset: number;
    constructor(options: LabelLayerOptions) {
        super(options);
        this.path = options.path;
        this.targetPx = options.targetPx ?? 30;
        this.maxChars = options.maxChars ?? 15;
        this.layerOffset = options.layerOffset ?? 0;

    }
    async load(ctx: CanvasRenderingContext2D): Promise<void> {
        if (!this.geometryStyle) return;
        const rawData: { point: Coordinate; properties: Record<string, any> }[] =
            await (await fetch(toAbsoluteUrl('./data/' + this.path))).json();

        this.labelEntries = rawData.flatMap(entry => {
            const text = entry.properties["name:en"] ?? entry.properties.name;
            if (!text) return [];
            const [x, y] = lonLatToMercator(entry.point);
            const area = entry.properties.area;

            if (!this.geometryStyle) return [];
            const style = resolveStyle(this.geometryStyle, entry.properties, 1);
            if (!style) return [];

            const lines = wrapText(text, this.maxChars);

            const { lineHeight, bounds } = buildLabelBounds(text, lines, style, ctx);

            return {
                lines: lines,
                style: style,
                x,
                y,
                minZoom: this.areaToMinLabel(area),
                bbox: bounds,
                lineHeight,
                layerOffset: this.layerOffset,
            } as LabelQueueEntry;
        }).sort((a, b) => b.minZoom - a.minZoom);

        this.ready = true;

    }

    /* 
    In this, the render function doesn't act as a render function, it just adds the labels to the main label queue.
    These are then rendered on the main map later.
    */
    render(ctx: CanvasRenderingContext2D, viewport: Viewport, labelQueue: LabelQueueEntry[]): void {

        // add culling for off screen //

        const zoomLevel = zoomFromScale(viewport.scale);
        const thresholdIndex = this.labelEntries.findIndex((entry) => entry.minZoom < zoomLevel);
        if (thresholdIndex == -1) return;

        for (let i = thresholdIndex; i < this.labelEntries.length; i++) {
            const entry = this.labelEntries[i];

            if (!boundsContainsPoint(visibleBounds(viewport), [entry.x, entry.y])) continue;
            labelQueue.push(this.labelEntries[i]);
        }

    }

    areaToMinLabel(areaDeg2: number): number {
        if (areaDeg2 <= 0) return 9; // single points: size unknown, show late
        return Math.log2((this.targetPx * 360) / (256 * Math.sqrt(areaDeg2)));
    }


}
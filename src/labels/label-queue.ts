import type { Bounds } from "../core/geometry";
import type { Viewport } from "../core/viewport";
import { boundsIntersect, offsetBounds } from "../math";
import type { Style } from "../styles/stylerule";

export interface LabelQueueEntry {
    lines: string[];
    style: Style;
    x: number;
    y: number;
    minZoom: number;
    bbox: Bounds; /*
    not adjusted for transform and at the default ctx scale and transform at 0, 0
    */
    lineHeight: number;
    layerOffset: number;
}

export function renderLabelQueue(ctx: CanvasRenderingContext2D, viewport: Viewport, queue: LabelQueueEntry[]): void {
    if (queue.length === 0) { return; }
    const sorted = queue.sort((a, b) => a.layerOffset - b.layerOffset || a.minZoom - b.minZoom) // ascending of minZoom so larger features get priority

    const placedBounds: Bounds[] = [];
    for (const entry of sorted) {

        const pointX = entry.x * viewport.scale + viewport.translateX;
        const pointY = -entry.y * viewport.scale + viewport.translateY;
        const currentBounds = offsetBounds(entry.bbox, pointX, pointY);

        const overlap = placedBounds.some(placedBounds =>
            boundsIntersect(currentBounds, placedBounds)
        );

        if (overlap) continue;

        placedBounds.push(currentBounds);

        entry.style.apply(ctx, 1);
        ctx.textBaseline = 'middle';

        const lineCount = entry.lines.length;
        entry.lines.forEach((line, i) => {
            const y = pointY - (lineCount - 1) * entry.lineHeight / 2 + i * entry.lineHeight;
            if (ctx.strokeStyle) ctx.strokeText(line, pointX, y);
            ctx.fillText(line, pointX, y);
        })

    }


}
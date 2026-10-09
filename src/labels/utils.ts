import type { Bounds } from "../core/geometry";
import type { Style } from "../styles/stylerule";

const PADDING = 4;

export function wrapText(text: string, maxChars: number): string[] {
    if (maxChars <= 0) return [text];

    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const testLine = current ? `${current} ${word}` : word;
        if (testLine.length > maxChars && current) {
            lines.push(current);
            current = word;
        } else {
            current = testLine;
        }
    }
    if (current) lines.push(current);

    return lines;
}


export function buildLabelBounds(text: string, lines: string[], style: Style, ctx: CanvasRenderingContext2D): { lineHeight: number, bounds: Bounds } {
    style.apply(ctx, 1); /* 
    has to set the style before measuring (because of font sizes and stuff)
    1 for scale doesn't matter because it's only used for the adjusted stroke width
    */

    const metrics = ctx.measureText(text);
    const textHeight = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) || 12;

    const widestLine = Math.max(0, ...lines.map(line => ctx.measureText(line).width));
    const halfWidth = widestLine / 2 + PADDING;
    const halfHeight = (textHeight * Math.max(lines.length, 1)) / 2 + PADDING;

    const lineHeight = textHeight + PADDING * 0.5;

    return { lineHeight, bounds: [[-halfWidth, -halfHeight], [halfWidth, halfHeight]] };
}
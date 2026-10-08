interface StyleOptions {
    fillColor?: string | null;
    strokeColor?: string | null;
    lineWidth?: number | null;
    font?: string | null;
    textAlign?: CanvasTextAlign | null;
    dashed?: [number, number] | [];
}

export const DEFAULT_STYLE_OPTIONS: Required<StyleOptions> = {
    fillColor: null,
    strokeColor: null,
    lineWidth: null,
    textAlign: 'center',
    font: null,
    dashed: [],
}

export class Style {
    styleOptions: Required<StyleOptions>;
    enabled: Record<string, boolean>;

    constructor(styleOptions: StyleOptions) {
        this.styleOptions = { ...DEFAULT_STYLE_OPTIONS, ...styleOptions };

        this.enabled = { 'fill': true, 'stroke': true, 'label': true };
        if (!this.styleOptions.fillColor) this.enabled.fill = false;
        if (!this.styleOptions.strokeColor) this.enabled.stroke = false;
        if (!this.styleOptions.font) this.enabled.label = false;
    }

    apply(ctx: CanvasRenderingContext2D, scale: number): void {
        const { fillColor, strokeColor, lineWidth, textAlign, font, dashed } = this.styleOptions;
        if (fillColor != null) ctx.fillStyle = fillColor;
        if (strokeColor != null) ctx.strokeStyle = strokeColor;
        if (lineWidth != null) ctx.lineWidth = lineWidth == 0 ? 0 : lineWidth / scale;
        if (textAlign != null) ctx.textAlign = textAlign;
        if (font != null) ctx.font = font;
        if (dashed != null) ctx.setLineDash(dashed.map(d => d / scale));
    }
}

export interface StyleRule<P = Record<string, any>> {
    when(properties: P, webMercZoom: number): boolean;
    style: Style;
}

export function resolveStyle<P>(rules: StyleRule<P>[], properties: P, webMercZoom: number): Style | null {
    const match = rules.find(rule => rule.when(properties, webMercZoom));
    return match ? match.style : null;
}

export function always(style: Style): StyleRule[] {
    return [{ when: () => true, style }];
}
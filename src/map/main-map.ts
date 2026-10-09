import { INITIAL_ZOOM } from "../config/defaults";
import { createViewport, resizeViewport, visibleBounds, zoomFromScale, type Viewport } from "../core/viewport";
import { attachPanZoom } from "../input/pan-zoom";
import { renderLabelQueue, type LabelQueueEntry } from "../labels/label-queue";
import type { Layer } from "../layers/layer";

export class GeoMap {

    viewport: Viewport;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    layers: Layer[];
    redraw: boolean = true;
    labelQueue: LabelQueueEntry[] = [];

    constructor(canvas: HTMLCanvasElement, layers: Layer[]) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        if (!this.ctx) throw new Error('Canvas context not found');
        this.viewport = createViewport(canvas.clientWidth, canvas.clientHeight, INITIAL_ZOOM);
        this.layers = layers;

        console.log('[Map] Initialized');

    }
    requestRedraw(): void {
        this.redraw = true;
    }

    async start(): Promise<void> {
        console.log('[Map] Starting');
        this.syncCanvasSize();

        attachPanZoom(this.canvas, this.viewport, () => this.requestRedraw())

        const observer = new ResizeObserver(() => {
            this.syncCanvasSize();
            this.requestRedraw();
        });

        observer.observe(this.canvas);

        requestAnimationFrame(this.renderLoop);

        for (const layer of this.layers) layer.onChange = () => this.requestRedraw(); // for tilelayer, makes sure it redraws everything when something loads

        await Promise.allSettled(this.layers.map(async layer => {
            try {
                await layer.load(this.ctx);
            } catch (e) {
                console.error(`[${layer.name}] failed to load`, e);
            }
            this.requestRedraw();
        }));

    }

    renderLoop = (): void => {
        if (this.redraw) {
            this.redraw = false;
            this.render();
        }
        requestAnimationFrame(this.renderLoop)
    }

    render(): void {
        const { ctx, viewport } = this;
        const dpr = window.devicePixelRatio || 1;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.labelQueue = [];

        for (const layer of this.layers) {
            if (!layer.ready) continue;
            ctx.save();
            ctx.setTransform(dpr * viewport.scale, 0, 0, -dpr * viewport.scale, dpr * viewport.translateX, dpr * viewport.translateY);
            layer.render(ctx, viewport, this.labelQueue);
            ctx.restore();
        }
        // console.log(this.labelQueue.length);
        renderLabelQueue(ctx, this.viewport, this.labelQueue);
    }

    syncCanvasSize(): void {
        const dpr = window.devicePixelRatio || 1;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        resizeViewport(this.viewport, w, h);
    }
}
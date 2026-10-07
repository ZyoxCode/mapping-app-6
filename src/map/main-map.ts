import type { Viewport } from "../core/viewport";

export class GeoMap {

    viewport: Viewport;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        if (!this.ctx) throw new Error('Canvas context not found');
        this.viewport = {
            last: [0, 0],
            offset: [0, 0],
            scale: 1,
            isDragging: false,
        }

        console.log('[Map] Initialized');

    }

    async load(): Promise<void> {
        console.log('[Map] Loading');


    }

    render() {

    }
}
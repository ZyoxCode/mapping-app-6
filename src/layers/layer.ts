import { mergeWithDefaults } from "../core/utils";
import type { Viewport } from "../core/viewport";

export interface LayerOptions {
    name: string;
    debug?: boolean;
}

const DEFAULT_LAYER_OPTIONS: Required<LayerOptions> = {
    name: "unnamed",
    debug: false,
}

export abstract class Layer {
    name: string;
    debug: boolean;
    ready: boolean;

    constructor(options: LayerOptions) {
        const merged = mergeWithDefaults(options, DEFAULT_LAYER_OPTIONS);
        this.name = merged.name;
        this.debug = merged.debug;
        this.ready = false;
    }

    abstract load(ctx: CanvasRenderingContext2D): Promise<void>;

    abstract render(ctx: CanvasRenderingContext2D, viewport: Viewport): void;

}
import { PbfReader } from "pbf";
import { VectorTile } from "@mapbox/vector-tile"
import { PMTiles } from "pmtiles";
import { Layer, type LayerOptions } from "../layer";
import { toAbsoluteUrl } from "../../core/file";
import type { Bounds } from "../../core/geometry";
import { visibleBounds, zoomFromScale, type Viewport } from "../../core/viewport";
import { resolveStyle } from "../../styles/stylerule";


export interface TileLayerOptions extends LayerOptions {
    path: string;
    sourceLayer: string;
    maxCachedTiles?: number;
}

interface TileData {
    path: Path2D | null;
    left: number;
    top: number;
    size: number;
}

const EMPTY: TileData = { path: null, left: 0, top: 0, size: 0 };
const key = (z: number, x: number, y: number) => `${z}/${x}/${y}`;


export class TileLayer extends Layer {
    path: string;
    sourceLayer: string;
    maxCachedTiles: number;
    tileArchive!: PMTiles;
    cachedTiles = new Map<string, TileData>();
    baseTiles = new Map<string, TileData>();
    loadingTiles = new Set<string>();

    minTileZoom: number = 0;
    maxTileZoom: number = 0;

    baseTileLayer: number = 2;

    constructor(options: TileLayerOptions) {
        super(options);
        this.path = options.path;
        this.sourceLayer = options.sourceLayer;
        this.maxCachedTiles = options.maxCachedTiles ?? 300;
    }

    async load(): Promise<void> {
        this.tileArchive = new PMTiles(toAbsoluteUrl('./data/' + this.path));
        const header = await this.tileArchive.getHeader();
        this.minTileZoom = header.minZoom;
        this.maxTileZoom = header.maxZoom;

        const jobs: Promise<void>[] = [];

        for (let z = this.minTileZoom; z <= Math.min(this.baseTileLayer, this.maxTileZoom); z++) {
            const n = 2 ** z;
            for (let x = 0; x < n; x++) {
                for (let y = 0; y < n; y++) jobs.push(this.loadBaseTile(z, x, y));
            }
        }
        await Promise.all(jobs);
        this.ready = true;

    }


    async loadBaseTile(z: number, x: number, y: number): Promise<void> {
        const res = await this.tileArchive.getZxy(z, x, y);
        this.baseTiles.set(key(z, x, y), res ? this.prepareTile(res.data, z, x, y) : EMPTY);
    }

    lookup(z: number, x: number, y: number): TileData | undefined {
        const k = key(z, x, y);
        return this.baseTiles.get(k) ?? this.cachedTiles.get(k);
    }

    render(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-Math.PI, -Math.PI, 2 * Math.PI, 2 * Math.PI);
        ctx.clip();

        const z = Math.min(this.maxTileZoom, Math.max(this.minTileZoom, Math.floor(zoomFromScale(viewport.scale))));
        const { x0, x1, y0, y1 } = tileRange(visibleBounds(viewport), z);

        const exact: TileData[] = [];
        const fallbacks = new Set<TileData>();

        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) {
                const tile = this.getTile(z, x, y);
                if (tile) exact.push(tile);
                else {
                    const ancestor = this.findAncestor(z, x, y);
                    if (ancestor) fallbacks.add(ancestor);
                }
            }
        }
        for (const tile of fallbacks) this.draw(ctx, tile, viewport.scale);
        for (const tile of exact) this.draw(ctx, tile, viewport.scale);


        // UNCOMMENT TO SHOW TILE BOUNDARY LINES
        // const n = 2 ** z;
        // const size = (2 * Math.PI) / n;
        // ctx.strokeStyle = "red";
        // ctx.lineWidth = 1 / viewport.scale;
        // for (let x = x0; x <= x1; x++) {
        //     for (let y = y0; y <= y1; y++) {
        //         const left = (x / n) * 2 * Math.PI - Math.PI;
        //         const top = Math.PI - (y / n) * 2 * Math.PI;
        //         ctx.strokeRect(left, top - size, size, size);
        //     }
        // }
        ctx.restore();
    }

    draw(ctx: CanvasRenderingContext2D, tile: TileData, scale: number): void {
        if (!this.geometryStyle || !tile.path) return;
        const style = resolveStyle(this.geometryStyle, {}, zoomFromScale(scale));
        if (!style) return;

        ctx.save();
        const e = 0.5 / scale;
        ctx.beginPath();
        ctx.rect(tile.left - e, tile.top - tile.size - e, tile.size + 2 * e, tile.size + 2 * e);
        ctx.clip();

        style.apply(ctx, scale);
        if (style.enabled.fill) ctx.fill(tile.path, "evenodd");
        if (style.enabled.stroke) ctx.stroke(tile.path);
        ctx.restore();
    }

    getTile(z: number, x: number, y: number): TileData | undefined {
        const k = key(z, x, y);
        const cached = this.cachedTiles.get(k);
        if (cached) {
            this.cachedTiles.delete(k);
            this.cachedTiles.set(k, cached);
            return cached;
        }
        if (!this.loadingTiles.has(k)) {
            this.loadingTiles.add(k);
            void this.fetchTile(z, x, y, k);
        }
        return undefined;
    }

    findAncestor(z: number, x: number, y: number): TileData | undefined {
        for (let az = z - 1; az >= this.minTileZoom; az--) {
            const shift = z - az;
            const tile = this.lookup(az, x >> shift, y >> shift);
            if (tile) return tile;
        }
        return undefined;
    }

    async fetchTile(z: number, x: number, y: number, k: string): Promise<void> {
        try {
            const res = await this.tileArchive.getZxy(z, x, y);
            this.cachedTiles.set(k, res ? this.prepareTile(res.data, z, x, y) : EMPTY);
        } catch (e) {
            console.error(`[${this.name}] tile ${k} failed`, e);
            this.cachedTiles.set(k, EMPTY);
        } finally {
            this.loadingTiles.delete(k);
        }

        while (this.cachedTiles.size > this.maxCachedTiles) {
            this.cachedTiles.delete(this.cachedTiles.keys().next().value!);
        }
        this.onChange();
    }

    prepareTile(buffer: ArrayBuffer, z: number, x: number, y: number): TileData {
        const layer = new VectorTile(new PbfReader(buffer)).layers[this.sourceLayer];
        if (!layer) return EMPTY;

        const n = 2 ** z;

        const worldX = (px: number) => ((x + px / layer.extent) / n) * 2 * Math.PI - Math.PI;
        const worldY = (py: number) => Math.PI - ((y + py / layer.extent) / n) * 2 * Math.PI;

        const path = new Path2D();

        for (let i = 0; i < layer.length; i++) {
            const feature = layer.feature(i);
            if (feature.type !== 2 && feature.type !== 3) continue;

            for (const ring of feature.loadGeometry()) {
                if (ring.length < 2) continue;
                path.moveTo(worldX(ring[0].x), worldY(ring[0].y));
                for (let j = 1; j < ring.length; j++) path.lineTo(worldX(ring[j].x), worldY(ring[j].y));
                if (feature.type === 3) { path.closePath(); }
            }
        }

        return { path, left: worldX(0), top: worldY(0), size: (2 * Math.PI) / n };
    }
}


function tileRange(bounds: Bounds, z: number) {
    const n = 2 ** z;
    const clamp = (v: number) => Math.min(n - 1, Math.max(0, v));
    return {
        x0: clamp(Math.floor(((bounds[0][0] + Math.PI) / (2 * Math.PI)) * n)),
        x1: clamp(Math.floor(((bounds[1][0] + Math.PI) / (2 * Math.PI)) * n)),
        y0: clamp(Math.floor(((Math.PI - bounds[1][1]) / (2 * Math.PI)) * n)), // top edge = max world y
        y1: clamp(Math.floor(((Math.PI - bounds[0][1]) / (2 * Math.PI)) * n)),
    };
}
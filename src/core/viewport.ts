import type { Coordinate } from "./geometry";

export interface Viewport {
    offset: Coordinate;
    last: Coordinate;
    scale: number;
    isDragging: boolean;
}
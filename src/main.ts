import { GeoMap } from "./map/main-map";

const canvas = document.querySelector<HTMLCanvasElement>('canvas');
if (!canvas) throw new Error('Canvas not found');


const map = new GeoMap(canvas);

map.load();
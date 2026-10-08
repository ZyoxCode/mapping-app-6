import { pathExists, toAbsoluteUrl } from "../../../core/file";
import { GeometryLayer, type GeometryLayerOptions, type RawFeature } from "../geometry-layer";
import shp from 'shpjs';

export const SAMPLE_RAW_FEATURE = {
    geometry: {
        type: "Polygon",
        coordinates: [
        ]
    },
    properties: {},
} as RawFeature

async function loadFeatures(path: string): Promise<RawFeature[]> {
    const split = (path).split(".")
    const fileExtension = split[split.length - 1];
    const absolute = toAbsoluteUrl('./data/' + path);

    let data: any;

    const exists = pathExists(absolute);
    if (!exists) throw new Error(`No file found at ${absolute}`);

    switch (fileExtension) {
        case "geojson":
            data = await fetch(absolute).then(res => res.json());
            break;
        case "zip":
            data = await shp(absolute);
            break;
        default:
            throw new Error(`File extension \'.${fileExtension}\' is not supported.`);
    };

    const collection = Array.isArray(data) ? data[0] : data;
    const features = collection.features as RawFeature[];


    return features;
}

export class FileLayer extends GeometryLayer {
    path: string;
    constructor(options: GeometryLayerOptions & { path: string }) {
        super(options);
        this.path = options.path;
    }

    async loadFeatures(): Promise<RawFeature[]> {
        return (await loadFeatures(this.path));
    }
}

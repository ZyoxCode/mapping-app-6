import { GeometryLayer, type GeometryLayerOptions, type RawFeature } from "../geometry-layer";

export class StaticLayer extends GeometryLayer {
    rawFeatures: RawFeature[];
    constructor(options: GeometryLayerOptions & { features: RawFeature[] }) {
        super(options);
        this.rawFeatures = options.features;
    }

    async loadFeatures(): Promise<RawFeature[]> {
        return this.rawFeatures;
    }
}
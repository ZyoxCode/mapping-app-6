import type { ZoomLevel } from "../core/geometry";
import { FileLayer } from "../layers/geometry-layers/file-layer/file-layer";
import { StaticLayer } from "../layers/geometry-layers/static-layer/static-layer";
import { LabelLayer } from "../layers/label-layers/label-layer";
import { TileLayer } from "../layers/tile-layers/tile-layer";
import { always, Style } from "../styles/stylerule";

const alwaysMaxDetail: ZoomLevel[] = [
    { upperZoomBound: Infinity, areaThreshold: 0 }
]

export const LAYERS = [

    new StaticLayer({
        name: 'Ocean',
        geometryStyle: always(new Style({ fillColor: "#4987a3" })),
        zoomLevels: alwaysMaxDetail,
        features: [
            {
                geometry: {
                    type: "Polygon",
                    coordinates: [
                        [
                            [-180, -90],
                            [-180, 90],
                            [180, 90],
                            [180, -90],
                        ]
                    ]
                },
                properties: {}
            }
        ]
    }),
    // new FileLayer({
    //     name: 'Test',
    //     path: 'ne_110m_land.zip',
    //     geometryStyle: always(new Style({ fillColor: "#90be8b" })),
    //     zoomLevels: alwaysMaxDetail,
    // }),
    new TileLayer({
        name: 'Land',
        path: 'land.pmtiles',
        sourceLayer: 'land',
        geometryStyle: always(new Style({ fillColor: "#90be8b" })),
    }),

    new LabelLayer({
        name: "Test Falklands Labels",
        path: "overpass-processed/export-1.json",
        geometryStyle: always(new Style({
            font: 'italic 500 12px "Outfit", sans-serif',
            fillColor: '#222222',
            strokeColor: '#ffffff',
            lineWidth: 1,
        })),
    }),

]
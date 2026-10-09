import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import polylabel from "polylabel";

type Position = [number, number];
type Polygon = Position[][];

const DROP_FIELDS = new Set(["type"]);

// 1. Parse command line arguments
const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
        mode: {
            type: "string",
            short: "m",
            default: "append",
        },
    },
    allowPositionals: true,
});

const [inputPath, outputPath] = positionals;
const mode = values.mode as "append" | "update" | "overwrite";

if (!inputPath || !outputPath || !["append", "update", "overwrite"].includes(mode)) {
    console.error(
        "Usage: tsx scripts/build-island-labels.ts <input.geojson> <output.json> [--mode append|update|overwrite]\n" +
        "  --mode append    (default) Skip items whose @id already exists\n" +
        "  --mode update    Overwrite matching @id items in place, append new items\n" +
        "  --mode overwrite Ignore existing file and replace entirely"
    );
    process.exit(1);
}

function ringArea(ring: Position[]): number {
    let sum = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    return Math.abs(sum / 2);
}

function labelPointOf(geometry: any): { point: Position; area: number } | null {
    switch (geometry?.type) {
        case "Point":
            return { point: geometry.coordinates, area: 0 };
        case "Polygon":
        case "MultiPolygon": {
            const polygons: Polygon[] =
                geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
            const largest = polygons.reduce((best, p) => (ringArea(p[0]) > ringArea(best[0]) ? p : best));
            if (largest[0].length < 4) return null;
            const [x, y] = polylabel(largest, 0.0001);
            return { point: [x, y], area: ringArea(largest[0]) };
        }
        default:
            return null;
    }
}

type LabelObject = { point: Position; properties: Record<string, unknown> };

// 2. Load existing items (unless mode is overwrite)
let existingObjects: LabelObject[] = [];
if (mode !== "overwrite" && existsSync(outputPath)) {
    try {
        existingObjects = JSON.parse(readFileSync(outputPath, "utf8"));
    } catch (err) {
        console.warn(`Warning: Could not parse existing output file at ${outputPath}. Starting fresh.`);
    }
}

// Map existing items by ID for O(1) lookup/replacement
const existingMap = new Map<unknown, number>();
existingObjects.forEach((item, index) => {
    const id = (item as any)["@id"] ?? item.properties?.["@id"];
    if (id !== undefined) {
        existingMap.set(id, index);
    }
});

// 3. Process GeoJSON features
const input = JSON.parse(readFileSync(inputPath, "utf8"));
const finalObjects: LabelObject[] = [...existingObjects];

let added = 0;
let updated = 0;
let skippedDuplicate = 0;
let skippedGeometry = 0;

for (const f of input.features) {
    const featureId = f["@id"] ?? f.id ?? f.properties?.["@id"];
    const exists = featureId !== undefined && existingMap.has(featureId);

    // Skip if in append mode and ID already exists
    if (mode === "append" && exists) {
        skippedDuplicate++;
        continue;
    }

    const label = labelPointOf(f.geometry);
    if (!label) {
        skippedGeometry++;
        continue;
    }

    const properties = Object.fromEntries(
        Object.entries(f.properties ?? {}).filter(([key]) => !DROP_FIELDS.has(key))
    );

    const newObj: LabelObject = {
        point: label.point,
        properties: { ...properties, area: label.area },
    };

    if (mode === "update" && exists) {
        // Replace existing item at its original index
        const indexToReplace = existingMap.get(featureId)!;
        finalObjects[indexToReplace] = newObj;
        updated++;
    } else {
        // Append new item
        finalObjects.push(newObj);
        added++;
        if (featureId !== undefined) {
            existingMap.set(featureId, finalObjects.length - 1);
        }
    }
}

// 4. Save output
writeFileSync(outputPath, JSON.stringify(finalObjects, null, 2));

console.log(`[Mode: ${mode}] Processed input features:`);
console.log(`  - Added: ${added}`);
if (mode === "update") console.log(`  - Updated in place: ${updated}`);
if (mode === "append") console.log(`  - Skipped duplicates: ${skippedDuplicate}`);
console.log(`  - Skipped (invalid geometry): ${skippedGeometry}`);
console.log(`Total items in output: ${finalObjects.length}`);
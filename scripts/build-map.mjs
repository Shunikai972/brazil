// Generates src/data/world.json: a dot-matrix of the planet (Natural Earth, public domain,
// via the `world-atlas` package) with France and Brazil flagged, plus their outlines.
// Run with: npm run map
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { feature } from 'topojson-client';

const load = (f) => JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${f}`, import.meta.url)));
const countries110 = load('countries-110m.json');
const countries50 = load('countries-50m.json');

const STEP = 1.8; // degrees between dots
const FRANCE = '250';
const BRAZIL = '076';

const polysOf = (geom) => (geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates);

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inPolys(lon, lat, polys) {
  for (const poly of polys) {
    if (!inRing(lon, lat, poly[0])) continue;
    let hole = false;
    for (let h = 1; h < poly.length; h++) if (inRing(lon, lat, poly[h])) hole = true;
    if (!hole) return true;
  }
  return false;
}

const feats = feature(countries110, countries110.objects.countries).features;
const shapes = feats.map((f) => ({ id: f.id, polys: polysOf(f.geometry) }));

const dots = [];
for (let lat = 82; lat >= -58; lat -= STEP) {
  for (let lon = -180 + STEP / 2; lon < 180; lon += STEP) {
    for (const s of shapes) {
      if (inPolys(lon, lat, s.polys)) {
        const flag = s.id === FRANCE ? 1 : s.id === BRAZIL ? 2 : 0;
        dots.push(+lon.toFixed(1), +lat.toFixed(1), flag);
        break;
      }
    }
  }
}

// Outlines (50m), simplified by keeping every Nth point; small islands dropped.
const feats50 = feature(countries50, countries50.objects.countries).features;
function outline(id, minPts = 12, every = 2) {
  const f = feats50.find((x) => x.id === id);
  return polysOf(f.geometry)
    .map((poly) => poly[0])
    .filter((ring) => ring.length >= minPts)
    .map((ring) => ring.filter((_, i) => i % every === 0).flatMap(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]));
}

const out = { step: STEP, dots, france: outline(FRANCE, 20, 2), brazil: outline(BRAZIL, 20, 3) };
mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/data/world.json', import.meta.url), JSON.stringify(out));
const count = (f) => dots.filter((_, i) => i % 3 === 2 && dots[i] === f).length;
console.log(`dots: ${dots.length / 3} (france ${count(1)}, brazil ${count(2)}), france rings ${out.france.length}`);

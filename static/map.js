"use strict";
// Watchpost attack map, focused on the Dominican Republic: hand-drawn, simplified coastlines of
// Hispaniola and its neighbours ([lon, lat] rings), a local equirectangular projection fitted to the
// box, rendered as a dot matrix. No tiles, no network, no library.
// Positions come from the server's synthetic geo table (/api/geo), never from a real geo lookup. The
// demo company's own sites (RFC 1918 ranges) are in the Dominican Republic. Attacker locations abroad
// lie far outside the frame, so each one enters at the frame edge along its true (great-circle)
// bearing from HQ, labeled with its fictional city and distance.

// The area the view always shows in full, with room around it for entry markers.
const FOCUS = { name: "Dominican Republic", west: -72.05, east: -68.3, south: 17.45, north: 19.95, padLon: 0.55, padLat: 0.36 };

// Dominican Republic–Haiti border, north to south.
const BORDER = [[-71.75, 19.71], [-71.71, 19.55], [-71.68, 19.32], [-71.66, 19.21], [-71.71, 19.08], [-71.70, 18.88],
  [-71.78, 18.72], [-71.92, 18.60], [-71.88, 18.49], [-71.80, 18.30], [-71.76, 18.04]];

// Dominican coast, clockwise from the northern end of the border to its southern end.
const DR_COAST = [[-71.75, 19.71], [-71.66, 19.84], [-71.66, 19.90], [-71.45, 19.89], [-71.20, 19.86], [-70.95, 19.89],
  [-70.69, 19.80], [-70.52, 19.77], [-70.40, 19.75], [-70.28, 19.64], [-70.08, 19.65], [-69.90, 19.64], [-69.85, 19.40],
  [-69.68, 19.30], [-69.53, 19.33], [-69.33, 19.33], [-69.17, 19.36], [-69.11, 19.29], [-69.20, 19.25], [-69.34, 19.20],
  [-69.61, 19.22], [-69.76, 19.17], [-69.62, 19.08], [-69.38, 19.06], [-69.04, 18.99], [-68.78, 18.95], [-68.55, 18.84],
  [-68.45, 18.70], [-68.32, 18.61], [-68.36, 18.51], [-68.45, 18.40], [-68.60, 18.37], [-68.70, 18.22], [-68.82, 18.19],
  [-68.85, 18.30], [-68.86, 18.36], [-68.97, 18.41], [-69.30, 18.45], [-69.45, 18.42], [-69.61, 18.44], [-69.88, 18.46],
  [-70.03, 18.41], [-70.10, 18.30], [-70.17, 18.22], [-70.33, 18.22], [-70.52, 18.20], [-70.56, 18.28], [-70.70, 18.36],
  [-70.88, 18.28], [-71.02, 18.30], [-71.10, 18.22], [-71.15, 18.05], [-71.25, 17.88], [-71.38, 17.65], [-71.43, 17.60],
  [-71.58, 17.77], [-71.66, 17.90], [-71.74, 18.03], [-71.76, 18.04]];

// Haitian coast, clockwise from the southern end of the border to its northern end.
const HT_COAST = [[-71.76, 18.04], [-71.95, 18.10], [-72.32, 18.23], [-72.53, 18.22], [-72.90, 18.20], [-73.40, 18.27],
  [-73.60, 18.20], [-73.75, 18.19], [-73.95, 18.05], [-74.20, 18.17], [-74.40, 18.32], [-74.43, 18.60], [-74.12, 18.65],
  [-73.80, 18.62], [-73.40, 18.52], [-73.09, 18.45], [-72.80, 18.47], [-72.63, 18.51], [-72.34, 18.55], [-72.45, 18.70],
  [-72.52, 18.77], [-72.62, 18.92], [-72.70, 19.11], [-72.80, 19.25], [-72.69, 19.45], [-72.95, 19.60], [-73.20, 19.65],
  [-73.38, 19.80], [-73.25, 19.93], [-72.83, 19.94], [-72.55, 19.85], [-72.20, 19.76], [-71.84, 19.68], [-71.75, 19.71]];

const inner = BORDER.slice(1, -1);
const LAND = [
  { name: "Dominican Republic", home: true, ring: [...DR_COAST, ...inner.slice().reverse()] },
  { name: "Haiti", ring: [...HT_COAST, ...inner] },
  { name: "Isla Saona", home: true, ring: [[-68.92, 18.15], [-68.75, 18.20], [-68.57, 18.17], [-68.62, 18.10], [-68.85, 18.10]] },
  { name: "Isla Beata", home: true, ring: [[-71.58, 17.62], [-71.50, 17.62], [-71.52, 17.55], [-71.57, 17.55]] },
  { name: "Gonâve", ring: [[-73.30, 18.92], [-72.95, 18.95], [-72.75, 18.85], [-72.80, 18.75], [-73.10, 18.73]] },
  { name: "Tortuga", ring: [[-72.95, 20.03], [-72.65, 20.06], [-72.60, 20.02], [-72.90, 19.98]] },
  { name: "Mona", ring: [[-67.95, 18.10], [-67.85, 18.12], [-67.82, 18.06], [-67.92, 18.05]] },
  { name: "Puerto Rico", ring: [[-67.27, 18.37], [-67.15, 18.51], [-66.60, 18.49], [-66.10, 18.47], [-65.62, 18.38],
    [-65.60, 18.22], [-65.85, 18.00], [-66.60, 17.98], [-67.19, 17.95], [-67.22, 18.20]] },
  { name: "Cuba", ring: [[-74.13, 20.24], [-74.50, 20.35], [-75.00, 20.68], [-75.70, 20.72], [-76.50, 21.10],
    [-77.20, 20.75], [-77.70, 19.85], [-76.80, 19.95], [-75.85, 19.97], [-75.10, 19.90], [-74.60, 20.05]] },
  { name: "Great Inagua", ring: [[-73.70, 21.10], [-73.15, 21.20], [-73.00, 21.05], [-73.20, 20.95], [-73.60, 20.95]] },
  { name: "Caicos", ring: [[-72.45, 21.75], [-71.65, 21.95], [-71.45, 21.75], [-72.00, 21.55]] },
];

// Lakes drawn over the land.
const WATER = [
  { name: "Lago Enriquillo", ring: [[-71.83, 18.50], [-71.70, 18.56], [-71.52, 18.53], [-71.40, 18.48], [-71.55, 18.44], [-71.75, 18.45]] },
  { name: "Étang Saumâtre", ring: [[-72.12, 18.58], [-71.98, 18.63], [-71.93, 18.58], [-72.05, 18.53]] },
];

// Reference towns (context only; Watchpost's own sites come from the geo table).
const PLACES = [["Puerto Plata", -70.69, 19.79], ["Samaná", -69.34, 19.21], ["San Juan", -71.23, 18.81],
  ["Barahona", -71.10, 18.21], ["Port-au-Prince", -72.34, 18.54]];

const AREAS = [["DOMINICAN REPUBLIC", -70.62, 18.93, "area"], ["HAITI", -72.55, 19.18, "area dim"],
  ["PUERTO RICO", -66.45, 18.25, "area dim"], ["CUBA", -75.4, 20.35, "area dim"],
  ["Caribbean Sea", -70.6, 17.66, "area sea"], ["Atlantic Ocean", -69.3, 19.74, "area sea"]];

const D2R = Math.PI / 180;
const r1 = (v) => Math.round(v * 10) / 10;
const xml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Fit FOCUS (plus padding) inside a w x h box, undistorted at the focus latitude. `reserveLeft` keeps the
// focus clear of an overlay along the left side; the land behind it is still drawn.
function fitView(w, h, { reserveLeft = 0 } = {}) {
  const lat0 = (FOCUS.south + FOCUS.north) / 2, lon0 = (FOCUS.west + FOCUS.east) / 2;
  const cos0 = Math.cos(lat0 * D2R);
  const spanX = (FOCUS.east - FOCUS.west + 2 * FOCUS.padLon) * cos0, spanY = FOCUS.north - FOCUS.south + 2 * FOCUS.padLat;
  const room = Math.max(w * 0.5, w - reserveLeft);
  const k = Math.min(room / spanX, h / spanY);  // px per degree of latitude
  return { w, h, k, kx: k * cos0, lon0, lat0, cx: w - room / 2, cy: h / 2 };
}

function project(lon, lat, v) {
  return [v.cx + (lon - v.lon0) * v.kx, v.cy - (lat - v.lat0) * v.k];
}

function unproject(x, y, v) {
  return [v.lon0 + (x - v.cx) / v.kx, v.lat0 - (y - v.cy) / v.k];
}

function inside(lon, lat, ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const bboxes = new Map();
function bbox(ring) {
  if (!bboxes.has(ring)) {
    const lons = ring.map((p) => p[0]), lats = ring.map((p) => p[1]);
    bboxes.set(ring, [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]);
  }
  return bboxes.get(ring);
}
const within = (lon, lat, ring) => { const b = bbox(ring); return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3] && inside(lon, lat, ring); };

// Static layer: graticule, coastlines, land dots (the Dominican Republic brighter), lakes, labels.
function baseMap(v) {
  const { w, h } = v;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" class="geomap" width="${r1(w)}" height="${r1(h)}" viewBox="0 0 ${r1(w)} ${r1(h)}" role="img" aria-label="Attack map of the Dominican Republic (synthetic geo)">`;
  const [west, south] = unproject(0, h, v), [east, north] = unproject(w, 0, v);
  out += `<g class="graticule">`;
  for (let lon = Math.ceil(west); lon <= east; lon++) {
    const [x] = project(lon, 0, v);
    out += `<line x1="${r1(x)}" x2="${r1(x)}" y1="0" y2="${r1(h)}"/>` + (x > 40 && x < w - 40 ? `<text class="gl" x="${r1(x + 3)}" y="${r1(h - 4)}">${-lon}°W</text>` : "");
  }
  for (let lat = Math.ceil(south); lat <= north; lat++) {
    const [, y] = project(0, lat, v);
    out += `<line x1="0" x2="${r1(w)}" y1="${r1(y)}" y2="${r1(y)}"/>` + (y > 30 && y < h - 30 ? `<text class="gl" x="4" y="${r1(y - 3)}">${lat}°N</text>` : "");
  }
  const path = (ring) => ring.map(([lon, lat], i) => { const [x, y] = project(lon, lat, v); return `${i ? "L" : "M"}${r1(x)} ${r1(y)}`; }).join("") + "Z";
  out += `</g><g class="coast">`;
  for (const l of LAND) out += `<path class="${l.home ? "home" : ""}" d="${path(l.ring)}"/>`;
  out += `</g><g class="land">`;
  const step = Math.max(4.5, Math.min(8, v.k * 0.055)), rad = r1(step * 0.3);
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      const [lon, lat] = unproject(x, y, v);
      const land = LAND.find((l) => within(lon, lat, l.ring));
      if (!land || WATER.some((l) => within(lon, lat, l.ring))) continue;
      out += `<circle${land.home ? ` class="home"` : ""} cx="${r1(x)}" cy="${r1(y)}" r="${rad}"/>`;
    }
  }
  out += `</g><g class="lakes">${WATER.map((l) => `<path d="${path(l.ring)}"/>`).join("")}</g><g class="areas">`;
  for (const [text, lon, lat, cls] of AREAS.filter((a) => w >= 480 || !a[3].includes("sea"))) {
    const [x, y] = project(lon, lat, v);
    const half = (text.length * (cls.includes("sea") ? 7.2 : 8.7)) / 2;  // letter-spaced, text-anchor middle
    if (x - half > 4 && x + half < w - 4 && y > 12 && y < h - 4) out += `<text class="${cls}" x="${r1(x)}" y="${r1(y)}">${xml(text)}</text>`;
  }
  out += `</g><g class="places">`;
  for (const [name, lon, lat] of w >= 480 ? PLACES : []) {  // too crowded on a phone
    const [x, y] = project(lon, lat, v);
    if (x > 0 && x < w && y > 0 && y < h) out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.6"/><text x="${r1(x + 4)}" y="${r1(y + 3)}">${xml(name)}</text>`;
  }
  return out + `</g><g class="arcs"></g><g class="marks"></g><g class="fx"></g></svg>`;
}

// Curved path between two screen points, bowed to one side.
function arcPath(p, q, bend = 0.16) {
  const [x1, y1] = p, [x2, y2] = q;
  const cx = (x1 + x2) / 2 - (y2 - y1) * bend, cy = (y1 + y2) / 2 + (x2 - x1) * bend;
  return `M${r1(x1)} ${r1(y1)}Q${r1(cx)} ${r1(cy)} ${r1(x2)} ${r1(y2)}`;
}

// Initial great-circle bearing in degrees (0 = north, 90 = east) and distance in km, between {lat, lon}.
function bearing(a, b) {
  const p1 = a.lat * D2R, p2 = b.lat * D2R, dl = (b.lon - a.lon) * D2R;
  const y = Math.sin(dl) * Math.cos(p2), x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) / D2R + 360) % 360;
}

function distanceKm(a, b) {
  const p1 = a.lat * D2R, p2 = b.lat * D2R;
  const s = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(((b.lon - a.lon) * D2R) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(Math.min(1, s)));
}

// Label for an entry marker: two lines (city, distance) beside the marker on the left and right edges,
// under it on the top edge and over it on the bottom edge. Returns the text anchor point and its box.
function entryLabel(side, x, y, r, city, km, v) {
  const tw = Math.max(city.length * 5.9, km.length * 5.3) + 4, th = 22;
  let anchor = "middle", lx = x, ly;
  if (side === "left" || side === "right") {
    anchor = side === "left" ? "start" : "end";
    lx = side === "left" ? x + r + 6 : x - r - 6;
    ly = y - 1;
  } else {
    ly = side === "top" ? y + r + 12 : y - r - 15;
    if (x - tw / 2 < 4) { anchor = "start"; lx = x - r; } else if (x + tw / 2 > v.w - 4) { anchor = "end"; lx = x + r; }
  }
  const x0 = anchor === "start" ? lx : anchor === "end" ? lx - tw : lx - tw / 2;
  return { x: lx, y: ly, anchor, box: { x0, y0: ly - 10, x1: x0 + tw, y1: ly - 10 + th } };
}

const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

// Place sources on the map. A source inside the frame sits at its position; any other enters at the frame
// edge along its bearing from `hub`. Entries then slide clockwise along the frame until their marker and
// label clear the `avoid` boxes ({x0, y0, x1, y1}: overlays, site markers and labels) and each other.
// Sources may carry `r` (marker radius). Returns [{...source, x, y, side, km, label}] where side is null for
// in-frame sources and "top" | "right" | "bottom" | "left" for entries.
function placeSources(sources, hub, v, { inset = { top: 16, right: 16, bottom: 46, left: 16 }, avoid = [] } = {}) {
  const f = { x0: inset.left, y0: inset.top, x1: v.w - inset.right, y1: v.h - inset.bottom };
  const W = f.x1 - f.x0, H = f.y1 - f.y0, P = 2 * (W + H);
  const toS = (x, y, side) => side === "top" ? x - f.x0 : side === "right" ? W + y - f.y0
    : side === "bottom" ? W + H + f.x1 - x : 2 * W + H + f.y1 - y;
  const fromS = (s) => {
    s = ((s % P) + P) % P;
    if (s < W) return [f.x0 + s, f.y0, "top"];
    if (s < W + H) return [f.x1, f.y0 + s - W, "right"];
    if (s < 2 * W + H) return [f.x1 - (s - W - H), f.y1, "bottom"];
    return [f.x0, f.y1 - (s - 2 * W - H), "left"];
  };
  const fmtKm = (km) => `${Math.round(km).toLocaleString("en-US")} km`;
  const [hx, hy] = project(hub.lon, hub.lat, v);
  const placed = [], entries = [];
  for (const src of sources) {
    const km = distanceKm(hub, src);
    const [x, y] = project(src.lon, src.lat, v);
    if (x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1) { placed.push({ ...src, x, y, side: null, km, label: null }); continue; }
    const b = bearing(hub, src) * D2R, dx = Math.sin(b), dy = -Math.cos(b);
    let t = Infinity;
    if (dx > 1e-9) t = Math.min(t, (f.x1 - hx) / dx);
    if (dx < -1e-9) t = Math.min(t, (f.x0 - hx) / dx);
    if (dy > 1e-9) t = Math.min(t, (f.y1 - hy) / dy);
    if (dy < -1e-9) t = Math.min(t, (f.y0 - hy) / dy);
    const ex = hx + dx * t, ey = hy + dy * t;
    const side = Math.abs(ey - f.y0) < 0.5 ? "top" : Math.abs(ex - f.x1) < 0.5 ? "right" : Math.abs(ey - f.y1) < 0.5 ? "bottom" : "left";
    entries.push({ src, km, s: toS(ex, ey, side) });
  }
  entries.sort((a, b) => a.s - b.s);
  const taken = [...avoid];
  for (const e of entries) {
    const r = e.src.r || 5;
    let spot;
    for (let step = 0; step < P; step += 3) {
      const [x, y, side] = fromS(e.s + step);
      const label = entryLabel(side, x, y, r, e.src.city, fmtKm(e.km), v);
      const mark = { x0: x - r - 3, y0: y - r - 3, x1: x + r + 3, y1: y + r + 3 };
      if (!taken.some((b) => overlaps(b, mark) || overlaps(b, label.box))) { spot = { x, y, side, label, mark }; break; }
    }
    if (!spot) {
      const [x, y, side] = fromS(e.s);
      spot = { x, y, side, label: entryLabel(side, x, y, r, e.src.city, fmtKm(e.km), v), mark: null };
    }
    if (spot.mark) taken.push(spot.mark, spot.label.box);
    placed.push({ ...e.src, x: spot.x, y: spot.y, side: spot.side, km: e.km, label: spot.label });
  }
  return placed;
}

globalThis.WPMap = Object.freeze({ FOCUS, LAND, WATER, fitView, project, unproject, inside, baseMap, arcPath, bearing, distanceKm, entryLabel, placeSources });

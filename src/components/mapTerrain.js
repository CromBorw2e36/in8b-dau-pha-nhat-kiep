// Vẽ sa bàn đại lục bằng canvas: địa hình sinh theo nhiễu có hạt giống cố định (lần nào cũng giống nhau),
// đổ bóng nổi khối, sắc độ theo khu vực, rồi một lớp lãnh thổ riêng phủ màu theo vùng đã chiếm.
import G from '../game/data.js';

// Không gian bản đồ trùng với viewBox của lớp SVG phía trên
export const MAP = { x0: 0, y0: -30, w: 640, h: 500 };
const RES = 1.5; // độ phân giải canvas so với viewBox
const CW = Math.round(MAP.w * RES), CH = Math.round(MAP.h * RES);

// ───── Nhiễu giá trị có hạt giống ─────
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const u = fade(xf), v = fade(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct = 4) {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += amp * noise(x * f, y * f); f *= 2.03; amp *= 0.5; }
  return s;
}
const ridge = (x, y) => { let s = 0, amp = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += amp * (1 - Math.abs(noise(x * f, y * f) * 2 - 1)); f *= 2.1; amp *= 0.5; } return s; };

// Mức độ núi non của từng khu vực
const MOUNT = [0.35, 0.15, 0.25, 0.45, 0.9, 0];
// Màu đất từng khu vực: [thấp, cao] (sắc trầm cho hợp nền sơn mài)
const BIOME = [
  [[78, 92, 52], [126, 112, 72]],   // Gia Mã: đồng cỏ, đồi
  [[150, 118, 70], [186, 150, 92]], // Tây Bắc: sa mạc
  [[92, 104, 54], [140, 124, 76]],  // Trung Châu: đồng bằng trù phú
  [[40, 70, 46], [74, 96, 60]],     // Thú Vực: rừng rậm
  [[104, 98, 88], [226, 222, 210]], // Cổ Giới: núi đá, đỉnh tuyết
  [[48, 32, 70], [96, 66, 132]],    // Hồn Giới: hư không
];

const toMap = (px, py) => [MAP.x0 + px / RES, MAP.y0 + py / RES];

let cache = null;
const initCache = () => { cache = { elev: new Float32Array(CW * CH), near: new Int8Array(CW * CH), terrain: null, built: 0 }; };
// Tính độ cao, khu vực và vùng gần nhất cho các hàng điểm ảnh [y0, y1)
function buildRows(y0, y1) {
  const { elev, near } = cache;
  const R = G.REGIONS;
  for (let py = y0; py < y1; py++) {
    for (let px = 0; px < CW; px++) {
      const [x, y] = toMap(px, py);
      // Vùng gần nhất (Voronoi) và khoảng cách tới nó
      let best = 0, bd = 1e9, d2 = 1e9;
      for (let i = 0; i < R.length; i++) {
        const dx = x - R[i].xy[0], dy = y - R[i].xy[1];
        const d = dx * dx + dy * dy;
        if (d < bd) { d2 = bd; bd = d; best = i; } else if (d < d2) d2 = d;
      }
      const z = R[best].z;
      const i = py * CW + px;
      near[i] = best;
      // Lục địa: nhiễu nền + gò quanh các vùng đất, mép bản đồ chìm xuống biển
      const bump = Math.exp(-bd / (2 * 52 * 52));
      const edge = Math.min(x - MAP.x0, MAP.x0 + MAP.w - x, y - MAP.y0, MAP.y0 + MAP.h - y) / 80;
      // Bờ biển lượn theo nhiễu, mép khung chìm sâu để lục địa không bị vuông
      let e = fbm(x / 110 + 7, y / 110 + 3) * 0.8 + bump * 0.8 - 0.55 + Math.min(0, edge - 1) * 1.1 + (fbm(x / 45 + 30, y / 45) - 0.5) * 0.25;
      if (z === 5) e = bump * 0.9 - 0.25 + fbm(x / 60, y / 60) * 0.3; // Hồn Giới: các đảo hư không lơ lửng
      else e += Math.max(0, e) * MOUNT[z] * (ridge(x / 70 + 11, y / 70 + 5) - 0.45) * 1.6;
      elev[i] = e;
    }
  }
}
function build() {
  if (!cache) initCache();
  buildRows(cache.built, CH);
  cache.built = CH;
}

function zoneAt(i) { return G.REGIONS[cache.near[i]].z; }

const L = [-0.6, -0.7, 0.4]; // ánh sáng từ tây bắc
// Tô màu các hàng [y0, y1) của ảnh địa hình
function paintRows(img, y0, y1) {
  const { elev } = cache;
  for (let py = y0; py < y1; py++) {
    for (let px = 0; px < CW; px++) {
      const i = py * CW + px;
      const e = elev[i];
      const z = zoneAt(i);
      let r, g, b;
      if (z === 5) {
        // Hư không: tím thẫm, có vệt sao
        const t = Math.max(0, Math.min(1, e * 1.4));
        const mist = fbm(px / 40, py / 40, 3);
        r = 18 + t * 70 + mist * 20; g = 10 + t * 40 + mist * 10; b = 32 + t * 110 + mist * 30;
        if (e > 0 && hash(px, py) > 0.996) { r = g = b = 230; }
      } else if (e <= 0) {
        // Biển: càng gần bờ càng sáng
        const d = Math.min(1, -e * 3);
        r = 26 - d * 14; g = 46 - d * 22; b = 52 - d * 24;
        const wave = noise(px / 6, py / 18) * 6;
        r += wave * 0.3; g += wave * 0.6; b += wave;
      } else {
        const [lo, hi] = BIOME[z];
        const t = Math.max(0, Math.min(1, e * 1.25));
        r = lo[0] + (hi[0] - lo[0]) * t; g = lo[1] + (hi[1] - lo[1]) * t; b = lo[2] + (hi[2] - lo[2]) * t;
        // Đổ bóng nổi khối theo độ dốc
        const ex = (elev[i + 1] ?? e) - (elev[i - 1] ?? e);
        const ey = (elev[i + CW] ?? e) - (elev[i - CW] ?? e);
        const nx = -ex * 26, ny = -ey * 26, nz = 1;
        const len = Math.hypot(nx, ny, nz);
        const shade = Math.max(0.3, Math.min(1.45, (nx * L[0] + ny * L[1] + nz * L[2]) / len / 0.6 + 0.2));
        r *= shade; g *= shade; b *= shade;
        // Vân riêng của từng khu vực: cồn cát ở sa mạc, tán cây ở vùng rừng
        if (z === 1) { const dune = Math.sin(px * 0.22 + py * 0.08 + fbm(px / 30, py / 30, 2) * 9); r += dune * 9; g += dune * 7; b += dune * 4; }
        if ((z === 3 || z === 0) && e < 0.55) {
          const tree = noise(px / 2.2, py / 2.2) * fbm(px / 40 + 50, py / 40, 2);
          if (tree > (z === 3 ? 0.32 : 0.42)) { r *= 0.62; g *= 0.74; b *= 0.6; }
        }
        // Hạt giấy và đường đồng mức mờ
        const grain = (hash(px * 3, py * 7) - 0.5) * 10;
        r += grain; g += grain; b += grain;
        if (Math.abs((e * 9) % 1) < 0.05 && e > 0.12) { r *= 0.86; g *= 0.86; b *= 0.86; }
      }
      // Bờ biển dát vàng
      if (z !== 5 && e > 0 && e < 0.025) { r = 214; g = 170; b = 92; }
      const o = i * 4;
      img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
  }
}
// Lớp phủ cuối: viền tối quanh mép như mép sa bàn
function finish(cv, ctx, img) {
  ctx.putImageData(img, 0, 0);
  // Viền tối quanh mép như mép sa bàn
  const vg = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.35, CW / 2, CH / 2, Math.max(CW, CH) * 0.7);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, CW, CH);
  cache.terrain = cv;
}
const newCanvas = () => { const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; return cv; };

// Ảnh địa hình, dựng một mạch (dùng khi cần ngay)
export function terrainCanvas() {
  build();
  if (cache.terrain) return cache.terrain;
  const cv = newCanvas();
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(CW, CH);
  paintRows(img, 0, CH);
  finish(cv, ctx, img);
  return cv;
}

// Dựng địa hình từng đợt nhỏ xen giữa các khung hình để giao diện không bị đứng.
// Trả về hàm hủy; lần sau gọi lại sẽ làm tiếp phần còn dở.
export function terrainAsync(done, step = 36) {
  if (cache?.terrain) { done(cache.terrain); return () => {}; }
  if (!cache) initCache();
  let stop = false, painting = false, y = cache.built, cv, ctx, img;
  const tick = () => {
    if (stop) return;
    const y1 = Math.min(CH, y + step);
    if (!painting) {
      buildRows(y, y1);
      cache.built = y = y1;
      if (y >= CH) { painting = true; y = 0; cv = newCanvas(); ctx = cv.getContext('2d'); img = ctx.createImageData(CW, CH); }
    } else {
      paintRows(img, y, y1);
      y = y1;
      if (y >= CH) { finish(cv, ctx, img); done(cv); return; }
    }
    setTimeout(tick, 0);
  };
  setTimeout(tick, 0);
  return () => { stop = true; };
}

// Lớp lãnh thổ: phủ son lên đất của ta, viền ranh giới, sương mù khu vực chưa mở
// own: Set id vùng của ta · closed: Set chỉ số khu vực chưa đủ cảnh giới · sel: chỉ số vùng đang chọn
export function drawTerritory(ctx, own, closed, sel) {
  build();
  const { elev, near } = cache;
  const img = ctx.createImageData(CW, CH);
  const ownIdx = new Uint8Array(G.REGIONS.length);
  G.REGIONS.forEach((r, i) => { if (own.has(r.id)) ownIdx[i] = 1; });
  for (let py = 1; py < CH - 1; py++) {
    for (let px = 1; px < CW - 1; px++) {
      const i = py * CW + px;
      const k = near[i];
      const z = G.REGIONS[k].z;
      if (elev[i] <= 0 && z !== 5) continue;
      const o = i * 4;
      const border = near[i + 1] !== k || near[i + CW] !== k;
      const mine = ownIdx[k];
      if (closed.has(z)) { img.data[o] = 8; img.data[o + 1] = 5; img.data[o + 2] = 4; img.data[o + 3] = 120 + noise(px / 14, py / 14) * 70; }
      if (mine) {
        if (border && (!ownIdx[near[i + 1]] || !ownIdx[near[i + CW]])) { img.data[o] = 244; img.data[o + 1] = 213; img.data[o + 2] = 143; img.data[o + 3] = 235; }
        else if (border) { img.data[o] = 120; img.data[o + 1] = 30; img.data[o + 2] = 18; img.data[o + 3] = 120; }
        else { img.data[o] = 205; img.data[o + 1] = 55; img.data[o + 2] = 35; img.data[o + 3] = k === sel ? 85 : 48; }
      } else if (border && !closed.has(z)) {
        img.data[o] = 20; img.data[o + 1] = 14; img.data[o + 2] = 10; img.data[o + 3] = 95;
      } else if (k === sel && !closed.has(z)) {
        img.data[o] = 244; img.data[o + 1] = 213; img.data[o + 2] = 143; img.data[o + 3] = 34;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

export const CANVAS = { w: CW, h: CH };

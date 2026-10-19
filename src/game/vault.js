import G from './data.js';
import { R, rand, clamp, give, earn, effLv, parseKey, itemName, beastGrade, tierFor, gearName, gearScore, fmtItems, fmtGold } from './util.js';
import { genGear, obtainGear, gearSell } from './gear.js';

// ───── Kho tông môn: sản lượng mỏ lãnh địa và chiến lợi phẩm đệ tử đổ về đây ─────
// Hàng trong kho không bị tự bán; lò rèn lấy nguyên liệu thẳng từ kho khi túi thiếu
export const vaultOf = (s) => (s.sect ? (s.sect.vault ||= { inv: {}, gear: [] }) : null);
export const vaultCount = (s, t, minG = 1) => {
  const v = vaultOf(s);
  if (!v) return 0;
  return Object.entries(v.inv).reduce((a, [k, n]) => { const [tt, g] = parseKey(k); return tt === t && g >= minG ? a + n : a; }, 0);
};
export function stock(s, t, g, n) {
  const v = vaultOf(s);
  g = clamp(Math.round(g), 1, 9);
  const k = `${t}:${g}`;
  v.inv[k] = Math.min((v.inv[k] || 0) + n, G.STACK_MAX);
  if (v.inv[k] <= 0) delete v.inv[k];
}
// Kho đầy trang bị: bán món kém nhất cho ngân khố
function stockGear(s, it) {
  const v = vaultOf(s);
  v.gear.push(it);
  if (v.gear.length > G.VAULT_GEAR_MAX) {
    v.gear.sort((a, b) => gearScore(b) - gearScore(a));
    earn(s, 'Kho tông môn thanh lý', gearSell(v.gear.pop()));
  }
}

// Phẩm quặng theo vùng; không thấp hơn phẩm bạn đang dùng để quặng luôn có ích
const ZONE_ORE = [2, 4, 6, 8, 9, 9];
export const mineGrade = (s, r) => Math.max(ZONE_ORE[r.z] ?? 9, G.ORE_FOR_TIER[tierFor(s)]);
// Hệ số Linh Khoáng Đường: +25% mỗi cấp hiệu quả
export const mineK = (s) => 1 + effLv(s.sect?.b?.khoang || 0) * 0.25;
// Sản lượng mỗi năm của một vùng: mọi vùng đều có mỏ, vùng quặng (item) cho gấp bội
export function regionYield(s, r) {
  const dev = 1 + (s.land[r.id]?.dev || 0) / 25;
  const k = mineK(s) * dev;
  const out = [['ore', mineGrade(s, r), (r.item === 'ore' ? 30 : 6) * k]];
  if (r.item === 'core') out.push(['core', beastGrade(s), 10 * k]);
  if (r.item === 'herb') out.push(['herb', Math.max(beastGrade(s), s.alch || 1), 12 * k]);
  return out;
}
export const mineTotal = (s) => {
  const m = {};
  for (const id of Object.keys(s.land || {})) {
    const r = G.REGIONS.find((x) => x.id === id);
    if (r) for (const [t, g, n] of regionYield(s, r)) m[`${t}:${g}`] = (m[`${t}:${g}`] || 0) + n;
  }
  return m;
};

// Số chuyến xuất chinh mỗi năm: cứ 40 đệ tử một chuyến
export const raidsPerYear = (s) => (s.sect ? Math.min(30, s.sect.members / 40) : 0);

export function vaultYearly(s, e, yrs) {
  if (!s.sect) return;
  const got = {};
  const add = (t, g, n) => { n = Math.round(n); if (n > 0) { stock(s, t, g, n); got[`${t}:${g}`] = (got[`${t}:${g}`] || 0) + n; } };

  // Mỏ lãnh địa
  for (const [k, n] of Object.entries(mineTotal(s))) add(...parseKey(k), n * yrs * rand(0.8, 1.2));

  // Đệ tử xuất chinh: săn ma thú, hái thuốc, đào quặng, thỉnh thoảng đoạt được trang bị
  const raids = Math.floor(raidsPerYear(s) * yrs * rand(0.6, 1.2));
  const bg = beastGrade(s);
  const vo = effLv(s.sect.b.vo || 0);
  const gear = [];
  for (let i = 0; i < raids; i++) {
    if (R() < 0.7) add('core', clamp(bg - (R() < 0.5 ? 1 : 0), 1, 9), 1 + R() * 2);
    if (R() < 0.4) add('herb', bg, 1 + R() * 3);
    if (R() < 0.5) add('ore', G.ORE_FOR_TIER[tierFor(s)], 2 + R() * 4);
    if (R() < 0.03 * (1 + vo * 0.1)) {
      const it = genGear(s, { boost: vo / 20 });
      stockGear(s, it);
      gear.push(gearName(it));
    }
  }

  const list = Object.entries(got).map(([k, n]) => [...parseKey(k), n]);
  if (!list.length && !gear.length) return;
  s.sect.vaultNew = (s.sect.vaultNew || 0) + gear.length + (list.length ? 1 : 0);
  e.items.push({ t: `Kho ${s.sect.name} nhận ${[fmtItems(list), ...gear].filter(Boolean).join(', ')}.`, k: gear.length ? 'good' : 'dim' });
}

// Chiến lợi phẩm khi chiếm một vùng: kho báu của chủ cũ dồn về kho
export function conquestLoot(s, r) {
  const k = 1 + r.z * 0.5;
  stock(s, 'ore', mineGrade(s, r), Math.round(rand(20, 40) * k));
  stock(s, 'core', beastGrade(s), Math.round(rand(5, 12) * k));
  const gear = [];
  const n = 1 + (R() < 0.5 ? 1 : 0) + (r.z >= 3 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const it = genGear(s, { tier: tierFor(s) + (R() < 0.25 ? 1 : 0), boost: 0.5 + r.z * 0.3 });
    stockGear(s, it);
    gear.push(gearName(it));
  }
  s.sect.vaultNew = (s.sect.vaultNew || 0) + 1;
  s.post.push({ t: `Kho báu của ${r.own} được chở về kho tông môn: huyền thiết, ma hạch và ${gear.join(', ')}.`, k: 'good' });
}

// ───── Lấy đồ ra ─────
export function takeItem(s, key, n) {
  const v = vaultOf(s);
  const [t, g] = parseKey(key);
  // Túi cũng có giới hạn mỗi chồng 9999
  n = Math.min(n, v?.inv[key] || 0, G.STACK_MAX - (s.inv[key] || 0));
  if (n <= 0) return v?.inv[key] ? `Túi đã đầy ${itemName(t, g).toLowerCase()} (tối đa ${G.STACK_MAX}).` : null;
  stock(s, t, g, -n);
  give(s, t, g, n);
  return `Lấy ${n} ${itemName(t, g).toLowerCase()} từ kho về túi.`;
}
export function takeGear(s, id) {
  const v = vaultOf(s);
  const i = v?.gear.findIndex((x) => x.id === id) ?? -1;
  if (i < 0) return null;
  return `Lấy ${obtainGear(s, v.gear.splice(i, 1)[0])} từ kho.`;
}
export function sellVaultGear(s, id) {
  const v = vaultOf(s);
  const i = v?.gear.findIndex((x) => x.id === id) ?? -1;
  if (i < 0) return null;
  const it = v.gear.splice(i, 1)[0];
  const p = gearSell(it);
  earn(s, 'Bán trang bị trong kho', p);
  return `Bán ${gearName(it)}, thu ${fmtGold(p)} kim tệ.`;
}
// Lấy từ kho phần nguyên liệu túi còn thiếu (ưu tiên đúng phẩm, rồi phẩm cao hơn)
export function takeFromVault(s, t, g, n) {
  const v = vaultOf(s);
  if (!v) return n;
  for (let gg = g; gg <= 9 && n > 0; gg++) {
    const use = Math.min(v.inv[`${t}:${gg}`] || 0, n);
    if (use) { stock(s, t, gg, -use); n -= use; }
  }
  return n;
}

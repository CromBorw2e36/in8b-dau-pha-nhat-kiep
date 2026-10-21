import G from './data.js';
import { R, pick, wpick, clamp, earn, spend, give, tierFor, gearScore, gearName, gearStat, pillNeed, fmtGold, levelPlan, fxSum, unit, qualityIdx } from './util.js';

// ───── Trang bị ─────
// boost: cộng thêm trọng số cho phẩm chất cao (lò rèn, sự kiện)
export function genGear(s, { sl, tier, q, boost = 0 } = {}) {
  sl ||= pick(['wep', 'wep', 'arm', 'acc', 'rng', 'boo']);
  tier = clamp(Math.round(tier ?? tierFor(s) - (R() < 0.4 ? 1 : 0)), 1, G.TIERS.length - 1);
  const luckK = 1 + (s.luck - 45) / 60;
  q ||= wpick(G.QUALITY, (x) => x[2] * (x[0] > 1 ? Math.max(0.3, luckK) * (1 + boost * (x[0] - 1)) : 1))[0];
  const it = { id: Date.now().toString(36) + Math.floor(R() * 1e6).toString(36), sl, tier, q, en: 0, n: `${pick(G.GEAR[sl].names)} (${G.TIERS[tier]})` };
  it.fx = rollAffixes(it);
  return it;
}
// Hiệu ứng pháp khí: phẩm chất càng cao càng nhiều, giá trị theo bậc và phẩm chất
export function rollAffixes(it) {
  const qi = G.QUALITY.findIndex((x) => x[0] === it.q);
  const [lo, hi] = G.AFFIX_COUNT[Math.max(0, qi)];
  const n = lo + Math.floor(R() * (hi - lo + 1)) + (qi === 0 && R() < 0.08 ? 1 : 0);
  return rollFresh(it, n, []);
}
// Giá trị một hiệu ứng: theo bậc và phẩm chất, dao động 80%..120%
export function affixVal(a, it, r = 0.8 + R() * 0.4) {
  const v = a.base * it.tier * it.q * r;
  return a.id === 'homenh' ? Math.min(0.6, v) : v;
}
export const isHeirFx = (id) => !!G.AFFIX.find((a) => a.id === id)?.heir;
// Tung n hiệu ứng mới, không trùng các mã trong `keep` (hiệu ứng truyền thừa chỉ thức tỉnh qua truyền thừa)
export function rollFresh(it, n, keep, heir = false) {
  const pool = G.AFFIX.filter((a) => !keep.includes(a.id) && !!a.heir === heir);
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const a = pool.splice(Math.floor(R() * pool.length), 1)[0];
    out.push({ id: a.id, v: affixVal(a, it) });
  }
  return out;
}
// Độ tốt của một lần tung: 0 (80%) .. 1 (120%)
export function rollPct(it, f) {
  const a = G.AFFIX.find((x) => x.id === f.id);
  if (f.id === 'homenh' && f.v >= 0.6) return 1;
  return clamp((f.v / (a.base * it.tier * it.q) - 0.8) / 0.4, 0, 1);
}

export const gearSell = (it) => Math.round(gearScore(it) * 0.6);
export const gearBuy = (it) => Math.round(gearScore(it) * 1.15);

export function gearDesc(it) {
  const st = gearStat(it);
  const parts = [`Chiến lực +${st.cp.toFixed(1)}`];
  if (st.def) parts.push(`giảm ${Math.round(st.def * 100)}% thương tổn`);
  if (st.qi) parts.push(`tu luyện +${Math.round(st.qi * 100)}%`);
  if (st.bt) parts.push(`đột phá +${(st.bt * 100).toFixed(1)}%`);
  if (st.dodge) parts.push(`thoát hiểm ${Math.round(st.dodge * 100)}%`);
  return parts.join(' · ');
}

// So với món đang mặc cùng ô: chênh lệch chiến lực (dương là tốt hơn)
export const gearDelta = (s, it) => gearStat(it).cp - (s.gear[it.sl] ? gearStat(s.gear[it.sl]).cp : 0);

// Nhận trang bị: tốt hơn đồ đang mặc thì tự trang bị, đồ cũ cất vào kho
export function obtainGear(s, it) {
  const cur = s.gear[it.sl];
  if (!cur || gearScore(it) > gearScore(cur)) {
    s.gear[it.sl] = it;
    if (cur) stash(s, cur);
    return `${gearName(it)} (đã tự trang bị)`;
  }
  return stash(s, it) ? `${gearName(it)} (đã tự bán ${fmtGold(gearSell(it))})` : gearName(it);
}
// Tự bán đồ trong túi từ phẩm này trở xuống (chỉ số trong G.QUALITY); -1 là tắt.
// Không bán đồ đã khóa hay tốt hơn món đang mặc cùng ô.
export const bagSellQ = (s) => s.auto?.gearQ ?? -1;
const bagSold = (s, it) => !it.lock && qualityIdx(it) <= bagSellQ(s) && !(s.gear[it.sl] && gearScore(it) > gearScore(s.gear[it.sl])) && !!s.gear[it.sl];
export function setBagSellQ(s, q) {
  s.auto.gearQ = q;
  const out = s.armory.filter((it) => bagSold(s, it));
  if (!out.length) return q < 0 ? 'Đã tắt tự bán trang bị trong túi.' : `Túi sẽ tự bán đồ ${G.QUALITY[q][1].toLowerCase()} trở xuống (kém hơn đồ đang mặc).`;
  const tot = out.reduce((a, it) => a + gearSell(it), 0);
  s.armory = s.armory.filter((it) => !out.includes(it));
  earn(s, 'Tự bán trang bị', tot);
  return `Đã bán ${out.length} món, thu ${fmtGold(tot)} kim tệ.`;
}
function stash(s, it) {
  if (bagSold(s, it)) { earn(s, 'Tự bán trang bị', gearSell(it)); return true; }
  s.armory.push(it);
  // Kho đầy: tự bán món kém nhất
  if (s.armory.length > G.ARMORY_MAX) {
    const out = dropWorst(s.armory);
    if (out) earn(s, 'Bán trang bị cũ', gearSell(out));
  }
}
// Rút món kém nhất chưa khóa ra khỏi danh sách; mọi món đều khóa thì giữ nguyên (kho được vượt hạn mức)
export function dropWorst(list) {
  let i = -1;
  list.forEach((x, k) => { if (!x.lock && (i < 0 || gearScore(x) < gearScore(list[i]))) i = k; });
  return i < 0 ? null : list.splice(i, 1)[0];
}
// Khóa đồ: không bị tự bán, bán đồ kém, bán tay hay ký gửi
export function toggleLock(it) {
  it.lock = !it.lock;
  return it.lock ? `Đã khóa ${gearName(it)}.` : `Đã mở khóa ${gearName(it)}.`;
}

export function equip(s, id) {
  const i = s.armory.findIndex((x) => x.id === id);
  if (i < 0) return null;
  const it = s.armory.splice(i, 1)[0];
  if (s.gear[it.sl]) s.armory.push(s.gear[it.sl]);
  s.gear[it.sl] = it;
  return `Đã trang bị ${gearName(it)}.`;
}
export function unequip(s, sl) {
  const it = s.gear[sl];
  if (!it) return null;
  s.gear[sl] = null;
  stash(s, it);
  return `Đã tháo ${gearName(it)}.`;
}
export function sellGear(s, id) {
  const i = s.armory.findIndex((x) => x.id === id);
  if (i < 0) return null;
  if (s.armory[i].lock) return 'Món này đang khóa.';
  const it = s.armory.splice(i, 1)[0];
  earn(s, 'Bán trang bị', gearSell(it));
  return `Đã bán ${gearName(it)}, thu ${fmtGold(gearSell(it))} kim tệ.`;
}
// Bán mọi món trong kho kém hơn đồ đang mặc cùng ô
export function sellWorse(s) {
  const worse = s.armory.filter((it) => !it.lock && s.gear[it.sl] && gearScore(it) <= gearScore(s.gear[it.sl]));
  if (!worse.length) return 'Không có món nào kém hơn đồ đang mặc.';
  const tot = worse.reduce((a, it) => a + gearSell(it), 0);
  s.armory = s.armory.filter((it) => !worse.includes(it));
  earn(s, 'Bán trang bị', tot);
  return `Đã bán ${worse.length} món, thu ${fmtGold(tot)} kim tệ.`;
}

// Binh khí phường: hàng đổi mới mỗi 3 lượt
export function forgeStock(s) {
  if (!s.forge || s.t - s.forge.t >= 3 || s.forge.tier !== tierFor(s)) {
    const tier = tierFor(s);
    s.forge = { t: s.t, tier, list: [...G.GEAR_SLOTS.map((sl) => genGear(s, { sl, tier })), genGear(s, { tier: tier - 1 })] };
  }
  return s.forge.list;
}
export function buyGear(s, id) {
  const list = forgeStock(s);
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return null;
  const it = list[i];
  if (!spend(s, 'Mua trang bị', gearBuy(it))) return 'Không đủ tiền.';
  list.splice(i, 1);
  return `Đã mua ${obtainGear(s, it)}.`;
}

// ───── Sản nghiệp ─────
export const estateLv = (s, id) => s.estates[id] || 0;
export const estateCost = (e, lv) => Math.round(e.price * Math.pow(G.ESTATE_GROW, lv));
export const estateOpen = (s, e) => !e.minR || s.R >= e.minR;
// Thu nhập một sản nghiệp: mỗi cấp +inc, cứ đủ 25 cấp thì toàn bộ ×2
export const estateInc = (e, lv) => e.inc * lv * Math.pow(2, Math.floor(lv / 25));
export function estatePlan(s, id, want) {
  const e = G.ESTATES.find((x) => x.id === id);
  return levelPlan((l) => estateCost(e, l), estateLv(s, id), G.ESTATE_MAX, s.gold, want);
}
export function buyEstate(s, id, want = 1) {
  const e = G.ESTATES.find((x) => x.id === id);
  const lv = estateLv(s, id);
  if (lv >= G.ESTATE_MAX || !estateOpen(s, e)) return null;
  const { n, tot } = estatePlan(s, id, want);
  if (!n) return 'Không đủ tiền.';
  spend(s, lv ? `Mở rộng ${e.n.toLowerCase()}` : `Mua ${e.n.toLowerCase()}`, tot);
  s.estates[id] = lv + n;
  return lv ? `${e.n} lên cấp ${lv + n}.` : `Bạn đã sở hữu một ${e.n.toLowerCase()}${n > 1 ? `, cấp ${n}` : ''}.`;
}
export const estateIncome = (s) => G.ESTATES.reduce((a, e) => a + estateInc(e, estateLv(s, e.id)), 0);
export const estateValue = (s) =>
  G.ESTATES.reduce((a, e) => { let v = 0; for (let l = 0; l < estateLv(s, e.id); l++) v += estateCost(e, l); return a + v * 0.6; }, 0);

// Hiệu ứng pháp khí mỗi năm: hồi phục, tăng chỉ số, sinh kim tệ
export function artifactYearly(s, yrs) {
  const add = (k, v) => { if (v) s[k] = Math.max(0, Math.min(100, s[k] + v * yrs)); };
  add('body', fxSum(s, 'hoixuan'));
  add('soul', fxSum(s, 'duonghon'));
  add('tam', fxSum(s, 'tinhtam'));
  const dh = fxSum(s, 'dehuyet'); // Đế Huyết: bồi bổ mọi mặt
  if (dh) for (const k of ['luck', 'body', 'soul', 'tam']) add(k, dh);
  const g = fxSum(s, 'kimquang');
  if (g) earn(s, 'Pháp khí Kim Quang', g * unit(s) * yrs);
}

export function estatesYearly(s, e, yrs) {
  const inc = estateIncome(s);
  if (!inc) return;
  earn(s, 'Sản nghiệp', inc * yrs * (0.85 + R() * 0.3));
  const herb = estateLv(s, 'dien');
  if (herb && R() < 0.4) give(s, 'herb', clamp(pillNeed(s), 1, 9), Math.ceil(herb / 4));
  const mine = estateLv(s, 'mo');
  if (mine) give(s, 'ore', clamp(G.ORE_FOR_TIER[tierFor(s)], 1, 9), Math.ceil((mine / 5) * yrs));
}

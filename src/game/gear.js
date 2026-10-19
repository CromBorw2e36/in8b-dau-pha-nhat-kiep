import G from './data.js';
import { R, pick, wpick, clamp, earn, spend, give, tierFor, gearScore, gearName, gearStat, pillNeed, fmtGold, levelPlan } from './util.js';

// ───── Trang bị ─────
// boost: cộng thêm trọng số cho phẩm chất cao (lò rèn, sự kiện)
export function genGear(s, { sl, tier, q, boost = 0 } = {}) {
  sl ||= pick(['wep', 'wep', 'arm', 'acc', 'rng', 'boo']);
  tier = clamp(Math.round(tier ?? tierFor(s) - (R() < 0.4 ? 1 : 0)), 1, G.TIERS.length - 1);
  const luckK = 1 + (s.luck - 45) / 60;
  q ||= wpick(G.QUALITY, (x) => x[2] * (x[0] > 1 ? Math.max(0.3, luckK) * (1 + boost * (x[0] - 1)) : 1))[0];
  return { id: Date.now().toString(36) + Math.floor(R() * 1e6).toString(36), sl, tier, q, en: 0, n: `${pick(G.GEAR[sl].names)} (${G.TIERS[tier]})` };
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
  stash(s, it);
  return gearName(it);
}
function stash(s, it) {
  s.armory.push(it);
  // Kho đầy: tự bán món kém nhất
  if (s.armory.length > G.ARMORY_MAX) {
    s.armory.sort((a, b) => gearScore(b) - gearScore(a));
    const out = s.armory.pop();
    earn(s, 'Bán trang bị cũ', gearSell(out));
  }
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
  const it = s.armory.splice(i, 1)[0];
  earn(s, 'Bán trang bị', gearSell(it));
  return `Đã bán ${gearName(it)}, thu ${fmtGold(gearSell(it))} kim tệ.`;
}
// Bán mọi món trong kho kém hơn đồ đang mặc cùng ô
export function sellWorse(s) {
  const worse = s.armory.filter((it) => s.gear[it.sl] && gearScore(it) <= gearScore(s.gear[it.sl]));
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

export function estatesYearly(s, e, yrs) {
  const inc = estateIncome(s);
  if (!inc) return;
  earn(s, 'Sản nghiệp', inc * yrs * (0.85 + R() * 0.3));
  const herb = estateLv(s, 'dien');
  if (herb && R() < 0.4) give(s, 'herb', clamp(pillNeed(s), 1, 9), Math.ceil(herb / 4));
  const mine = estateLv(s, 'mo');
  if (mine) give(s, 'ore', clamp(G.ORE_FOR_TIER[tierFor(s)], 1, 9), Math.ceil((mine / 5) * yrs));
}

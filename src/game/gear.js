import G from './data.js';
import { R, pick, wpick, clamp, earn, spend, give, tierFor, gearScore, gearName, gearStat, pillNeed, fmtGold } from './util.js';

// ───── Trang bị ─────
export function genGear(s, { sl, tier, q } = {}) {
  sl ||= pick(['wep', 'wep', 'arm', 'acc']);
  tier = clamp(Math.round(tier ?? tierFor(s) - (R() < 0.4 ? 1 : 0)), 1, 5);
  q ||= wpick(G.QUALITY, (x) => x[2] + (x[0] > 1 ? (s.luck - 45) / 10 : 0))[0];
  return { id: Date.now().toString(36) + Math.floor(R() * 1e6).toString(36), sl, tier, q, n: `${pick(G.GEAR[sl].names)} (${G.TIERS[tier]})` };
}

export const gearSell = (it) => Math.round(gearScore(it) * 0.6);
export const gearBuy = (it) => Math.round(gearScore(it) * 1.15);

export function gearDesc(it) {
  const st = gearStat(it);
  const parts = [`Chiến lực +${st.cp.toFixed(1)}`];
  if (st.def) parts.push(`giảm ${Math.round(st.def * 100)}% thương tổn`);
  if (st.qi) parts.push(`tu luyện +${Math.round(st.qi * 100)}%`);
  return parts.join(' · ');
}

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

// Binh khí phường: hàng đổi mới mỗi 3 lượt
export function forgeStock(s) {
  if (!s.forge || s.t - s.forge.t >= 3 || s.forge.tier !== tierFor(s)) {
    const tier = tierFor(s);
    s.forge = { t: s.t, tier, list: [genGear(s, { sl: 'wep', tier }), genGear(s, { sl: 'arm', tier }), genGear(s, { sl: 'acc', tier }), genGear(s, { tier: tier - 1 })] };
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
export const estateCost = (e, lv) => Math.round(e.price * Math.pow(1.7, lv));
export const estateOpen = (s, e) => !e.minR || s.R >= e.minR;
export function buyEstate(s, id) {
  const e = G.ESTATES.find((x) => x.id === id);
  const lv = estateLv(s, id);
  if (lv >= G.ESTATE_MAX || !estateOpen(s, e)) return null;
  if (!spend(s, lv ? `Mở rộng ${e.n.toLowerCase()}` : `Mua ${e.n.toLowerCase()}`, estateCost(e, lv))) return 'Không đủ tiền.';
  s.estates[id] = lv + 1;
  return lv ? `${e.n} lên cấp ${lv + 1}.` : `Bạn đã sở hữu một ${e.n.toLowerCase()}.`;
}
export const estateIncome = (s) => G.ESTATES.reduce((a, e) => a + e.inc * estateLv(s, e.id), 0);
export const estateValue = (s) =>
  G.ESTATES.reduce((a, e) => { let v = 0; for (let l = 0; l < estateLv(s, e.id); l++) v += estateCost(e, l); return a + v * 0.6; }, 0);

export function estatesYearly(s, e, yrs) {
  const inc = estateIncome(s);
  if (!inc) return;
  earn(s, 'Sản nghiệp', inc * yrs * (0.85 + R() * 0.3));
  const herb = estateLv(s, 'dien');
  if (herb && R() < 0.4) give(s, 'herb', clamp(pillNeed(s), 1, 9), herb);
}

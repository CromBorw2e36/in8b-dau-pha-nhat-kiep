import G from './data.js';
import { R, rand, pick, clamp, unit, earn, spend, give, countOf, tierFor, gearName, fmtGold, itemName, levelPlan, mkIdx } from './util.js';
import { genGear, obtainGear } from './gear.js';
import { vaultCount, takeFromVault } from './vault.js';

// ───── Luyện Khí Phòng (lò rèn riêng), cấp 0..100 ─────
export const smithLv = (s) => s.smithy?.lv || 0;
export const smithCost = (lv) => Math.round(G.SMITHY.price * Math.pow(G.SMITHY.grow, lv));
export const smithPlan = (s, want) => levelPlan(smithCost, smithLv(s), G.SMITHY.max, s.gold, want);
export function upgradeSmith(s, want = 1) {
  const lv = smithLv(s);
  if (lv >= G.SMITHY.max) return null;
  const { n, tot } = smithPlan(s, want);
  if (!n) return 'Không đủ tiền.';
  spend(s, lv ? 'Nâng cấp lò rèn' : 'Dựng lò rèn', tot);
  s.smithy.lv = lv + n;
  return lv ? `Lò rèn lên cấp ${lv + n}.` : `Bạn dựng một lò rèn riêng${n > 1 ? `, cấp ${n}` : ''}. Giờ có thể tự chế tạo trang bị.`;
}

// Bậc cao nhất rèn được: lò cấp 15 mở Hoàng giai, 30 Huyền giai, 45 Địa giai, 60 Thiên giai, 75 Thánh khí
export const craftTierCap = (s) => (smithLv(s) ? Math.min(G.TIERS.length - 1, 1 + Math.floor(smithLv(s) / 15), tierFor(s) + 1) : 0);
export const nextTierAt = (s) => {
  const cap = 1 + Math.floor(smithLv(s) / 15);
  return cap >= G.TIERS.length - 1 ? null : cap * 15;
};

const oreG = (tier) => G.ORE_FOR_TIER[tier];
export function craftCost(tier) {
  return {
    gold: Math.round(G.GEAR_PRICE[tier] * 0.4),
    ore: [oreG(tier), 2 + tier * 2],
    core: [Math.min(9, oreG(tier) + 1), 1],
  };
}
// Có đủ nguyên liệu (cho phép dùng nguyên liệu phẩm cao hơn), tính cả kho tông môn
export const matHave = (s, t, g) => countOf(s, t, g) + vaultCount(s, t, g);
const hasMat = (s, [g, n], t) => matHave(s, t, g) >= n;
// Dùng đồ trong túi trước, thiếu thì lấy từ kho
function takeMat(s, t, g, n) {
  for (let gg = g; gg <= 9 && n > 0; gg++) {
    const have = s.inv[`${t}:${gg}`] || 0;
    const use = Math.min(have, n);
    if (use) { give(s, t, gg, -use); n -= use; }
  }
  if (n > 0) takeFromVault(s, t, g, n);
}
export const canCraft = (s, tier) => {
  const c = craftCost(tier);
  return tier <= craftTierCap(s) && s.gold >= c.gold && hasMat(s, c.ore, 'ore') && hasMat(s, c.core, 'core');
};
// Thêm trọng số phẩm chất cao: cấp lò, dị hỏa, linh hồn
export const craftBoost = (s) => smithLv(s) / 20 + s.fires.length * 0.4 + Math.max(0, (s.soul - 50) / 50);

export function craft(s, sl, tier) {
  if (!canCraft(s, tier)) return 'Thiếu nguyên liệu hoặc kim tệ.';
  const c = craftCost(tier);
  spend(s, 'Chế tạo trang bị', c.gold);
  takeMat(s, 'ore', ...c.ore);
  takeMat(s, 'core', ...c.core);
  const it = genGear(s, { sl, tier, boost: craftBoost(s) });
  s.stats.crafted = (s.stats.crafted || 0) + 1;
  if (it.q >= 2) s.stats.legend = (s.stats.legend || 0) + 1;
  return `Lò rèn đỏ rực ba ngày ba đêm. Thành phẩm: ${obtainGear(s, it)}.`;
}

// ───── Cường hóa +0 → +100 ─────
export function enhanceCost(it) {
  const en = it.en || 0;
  return { gold: Math.round(G.GEAR_PRICE[it.tier] * 0.05 * Math.pow(1 + en, 1.3)), ore: [oreG(it.tier), 1 + Math.floor(en / 8)] };
}
// Dưới +10 chắc chắn thành công, sau đó giảm dần; lò rèn cấp cao bù lại
export const enhanceP = (s, it) => ((it.en || 0) < 10 ? 1 : clamp(1 - ((it.en || 0) - 9) * 0.011 + smithLv(s) * 0.003, 0.2, 1));
export const findGear = (s, id) => Object.values(s.gear).find((x) => x?.id === id) || s.armory.find((x) => x.id === id);

export function enhance(s, id) {
  const it = findGear(s, id);
  if (!it || (it.en || 0) >= G.ENHANCE_MAX) return null;
  if (!smithLv(s)) return 'Cần dựng lò rèn trước.';
  const c = enhanceCost(it);
  if (s.gold < c.gold || !hasMat(s, c.ore, 'ore')) return 'Thiếu nguyên liệu hoặc kim tệ.';
  spend(s, 'Cường hóa trang bị', c.gold);
  takeMat(s, 'ore', ...c.ore);
  if (R() < enhanceP(s, it)) {
    it.en = (it.en || 0) + 1;
    s.stats.enhance = Math.max(s.stats.enhance || 0, it.en);
    return { ok: true, t: `${gearName(it)}: cường hóa thành công!` };
  }
  return { ok: false, t: `Cường hóa thất bại, nguyên liệu tan thành tro. ${it.n} vẫn ở +${it.en || 0}.` };
}

// ───── Xưởng binh khí quân dụng ─────
// Giá vốn một bộ binh khí cho binh sĩ, tăng theo cảnh giới
export const armCost = (s) => Math.max(8, Math.round(unit(s) * 0.012));
export const armValue = (s) => Math.round(armCost(s) * 1.45 * mkIdx(s, 'arms'));
export const armRate = (s) => smithLv(s) * 4; // bộ mỗi năm

export function smithYearly(s, e, yrs) {
  if (!smithLv(s)) return;
  if (s.smithy.prod) {
    const c = armCost(s);
    const n = Math.min(Math.round(armRate(s) * yrs), Math.floor((s.gold * 0.25) / c));
    if (n > 0) {
      spend(s, 'Xưởng binh khí', n * c);
      s.arms += n;
    }
  }
  // Hợp đồng: hết hạn thì bỏ, thỉnh thoảng có đơn mới
  s.orders = s.orders.filter((o) => o.due > s.t);
  if (s.orders.length < 3 && R() < 0.35 * Math.sqrt(yrs)) s.orders.push(genOrder(s));
}

export function genOrder(s) {
  const list = G.BUYERS.filter((b) => s.R >= b.minR);
  const b = pick(list);
  const n = Math.round(rand(20, 90) * (1 + tierFor(s) * 0.6) * (1 + smithLv(s) / 40) / 5) * 5;
  return { id: Date.now().toString(36) + Math.floor(R() * 1e5), buyer: b.n, n, price: Math.round(armCost(s) * rand(1.6, 2.5)), due: s.t + Math.floor(rand(3, 7)) };
}

export function fulfill(s, id) {
  const i = s.orders.findIndex((o) => o.id === id);
  if (i < 0) return null;
  const o = s.orders[i];
  if (s.arms < o.n) return `Cần ${o.n} bộ, kho mới có ${s.arms}.`;
  s.arms -= o.n;
  s.orders.splice(i, 1);
  earn(s, `Hợp đồng ${o.buyer}`, o.n * o.price);
  s.fame += o.n >= 200 ? 1 : 0;
  s.stats.orders = (s.stats.orders || 0) + 1;
  return `Giao ${o.n} bộ binh khí cho ${o.buyer}, thu ${fmtGold(o.n * o.price)} kim tệ.`;
}

export function sellArms(s, n) {
  n = Math.min(n, s.arms);
  if (n <= 0) return null;
  const p = Math.round(armValue(s) * 0.85);
  s.arms -= n;
  earn(s, 'Bán binh khí quân dụng', n * p);
  return `Bán ${n} bộ binh khí cho thương nhân, thu ${fmtGold(n * p)} kim tệ.`;
}

export const matLabel = ([g, n], t) => `${n} ${itemName(t, g).toLowerCase()}`;

// Tỷ lệ ra từng phẩm chất khi chế tạo (để hiển thị)
export function qualityOdds(s) {
  const luckK = Math.max(0.3, 1 + (s.luck - 45) / 60);
  const b = craftBoost(s);
  const ws = G.QUALITY.map((x) => x[2] * (x[0] > 1 ? luckK * (1 + b * (x[0] - 1)) : 1));
  const tot = ws.reduce((a, w) => a + w, 0);
  return ws.map((w) => w / tot);
}

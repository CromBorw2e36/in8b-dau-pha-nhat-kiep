import G from './data.js';
import { R, rand, pick, clamp, unit, earn, spend, give, countOf, tierFor, gearName, fmtGold, itemName, levelPlan, mkIdx, qualityIdx, fxSum } from './util.js';
import { genGear, obtainGear, rollFresh, affixVal } from './gear.js';
import { vaultCount, takeFromVault } from './vault.js';
import { deFx } from './emperor.js';

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
export const craftBoost = (s) => smithLv(s) / 20 + s.fires.length * 0.4 + Math.max(0, (s.soul - 50) / 50) + deFx(s, 'craft') + fxSum(s, 'thienhoa');

// ───── Tế phẩm: dung luyện đồ cũ trong túi để tăng phẩm chất khi rèn hoặc tỷ lệ cường hóa ─────
export const FODDER_MAX = 5;
// Đồ dùng làm tế phẩm được: trong túi, chưa khóa
export const fodderList = (s, exceptId) => s.armory.filter((it) => !it.lock && it.id !== exceptId);
const pickFodder = (s, ids, exceptId) => fodderList(s, exceptId).filter((it) => ids.includes(it.id)).slice(0, FODDER_MAX);
// Giá trị một món tế phẩm so với bậc đích: phẩm chất cao, bậc gần và cường hóa nhiều thì quý hơn
const fodderPts = (it, tier) => (G.QUALITY[qualityIdx(it)][0] + (it.en || 0) / 3) * Math.min(1, it.tier / tier) ** 2;
export const fodderBoost = (s, ids, tier) => pickFodder(s, ids).reduce((a, it) => a + 0.4 * fodderPts(it, tier), 0);
export const fodderEnh = (s, ids, it) => pickFodder(s, ids, it.id).reduce((a, x) => a + 0.04 * fodderPts(x, it.tier), 0);
function burnFodder(s, ids, exceptId) {
  const used = pickFodder(s, ids, exceptId);
  s.armory = s.armory.filter((it) => !used.includes(it));
  return used.length;
}

export function craft(s, sl, tier, fodder = []) {
  if (!canCraft(s, tier)) return 'Thiếu nguyên liệu hoặc kim tệ.';
  const c = craftCost(tier);
  spend(s, 'Chế tạo trang bị', c.gold);
  takeMat(s, 'ore', ...c.ore);
  takeMat(s, 'core', ...c.core);
  const extra = fodderBoost(s, fodder, tier);
  burnFodder(s, fodder);
  const it = genGear(s, { sl, tier, boost: craftBoost(s) + extra });
  s.stats.crafted = (s.stats.crafted || 0) + 1;
  if (it.q >= 2) s.stats.legend = (s.stats.legend || 0) + 1;
  // name/q: giao diện tô màu tên món theo phẩm chất
  return { t: `Lò rèn đỏ rực ba ngày ba đêm. Thành phẩm: ${obtainGear(s, it)}.`, name: gearName(it), q: qualityIdx(it), it };
}

// ───── Cường hóa +0 → +12 ─────
export function enhanceCost(it) {
  const en = it.en || 0;
  return { gold: Math.round(G.GEAR_PRICE[it.tier] * 0.06 * Math.pow(1 + en, 1.6)), ore: [oreG(it.tier), 1 + en] };
}
// Tới +6 chắc chắn thành công, sau đó giảm dần theo G.ENHANCE_P; lò rèn cấp cao bù lại
export const enhanceP = (s, it, fodder = []) => {
  const base = G.ENHANCE_P[it.en || 0] ?? 0;
  return base >= 1 ? 1 : clamp(base + smithLv(s) * 0.002 + deFx(s, 'enh') + fxSum(s, 'luyenkhi') + fodderEnh(s, fodder, it), 0.1, 1);
};
export const findGear = (s, id) => Object.values(s.gear).find((x) => x?.id === id) || s.armory.find((x) => x.id === id);

export function enhance(s, id, fodder = []) {
  const it = findGear(s, id);
  if (!it || (it.en || 0) >= G.ENHANCE_MAX) return null;
  if (!smithLv(s)) return 'Cần dựng lò rèn trước.';
  const c = enhanceCost(it);
  if (s.gold < c.gold || !hasMat(s, c.ore, 'ore')) return 'Thiếu nguyên liệu hoặc kim tệ.';
  spend(s, 'Cường hóa trang bị', c.gold);
  takeMat(s, 'ore', ...c.ore);
  const p = enhanceP(s, it, fodder);
  if (enhanceP(s, it) < 1) burnFodder(s, fodder, it.id); // chắc chắn thành công thì không đốt tế phẩm
  if (R() < p) {
    it.en = (it.en || 0) + 1;
    s.stats.enhance = Math.max(s.stats.enhance || 0, it.en);
    return { ok: true, t: `${gearName(it)}: cường hóa thành công!` };
  }
  return { ok: false, t: `Cường hóa thất bại, nguyên liệu tan thành tro. ${it.n} vẫn ở +${it.en || 0}.` };
}

// ───── Tẩy luyện: đổ lại hiệu ứng pháp khí, giữ các hiệu ứng đã khóa ─────
const affixCap = (it) => G.AFFIX_COUNT[qualityIdx(it)][1];
// Món nào tẩy luyện được: phẩm chất cho phép có hiệu ứng, hoặc đã có sẵn hiệu ứng (nhờ dung luyện)
export const canRefineItem = (it) => affixCap(it) > 0 || (it.fx?.length || 0) > 0;
export function refineCost(it, locks = 0) {
  return { gold: Math.round(G.GEAR_PRICE[it.tier] * G.REFINE.gold * Math.pow(G.REFINE.lock, locks)), ore: [oreG(it.tier), 2 + it.tier] };
}
export const canAffordRefine = (s, it, locks = 0) => {
  const c = refineCost(it, locks);
  return smithLv(s) > 0 && s.gold >= c.gold && hasMat(s, c.ore, 'ore');
};
// locks: mã các hiệu ứng muốn giữ nguyên. Trả về { t, changed } hoặc chuỗi lỗi
export function refine(s, id, locks = []) {
  const it = findGear(s, id);
  if (!it || !canRefineItem(it)) return null;
  if (!smithLv(s)) return 'Cần dựng lò rèn trước.';
  const keep = (it.fx || []).filter((f) => locks.includes(f.id));
  if (keep.length && keep.length >= (it.fx?.length || 0)) return 'Phải để ít nhất một hiệu ứng không khóa.';
  const c = refineCost(it, keep.length);
  if (!canAffordRefine(s, it, keep.length)) return 'Thiếu nguyên liệu hoặc kim tệ.';
  spend(s, 'Tẩy luyện trang bị', c.gold);
  takeMat(s, 'ore', ...c.ore);
  // Số hiệu ứng: không ít hơn hiện có, có cơ hội lên tới mức tối đa của phẩm chất
  const [lo, hi] = G.AFFIX_COUNT[qualityIdx(it)];
  const n = Math.max(it.fx?.length || 0, lo + Math.floor(R() * (hi - lo + 1)), keep.length + 1);
  const fresh = rollFresh(it, n - keep.length, keep.map((f) => f.id));
  it.fx = [...keep, ...fresh];
  s.stats.refined = (s.stats.refined || 0) + 1;
  return { t: `${gearName(it)}: tẩy luyện xong.`, changed: fresh.map((f) => f.id) };
}
// Đã đạt mục tiêu tẩy luyện chưa: có đủ các hiệu ứng mong muốn, mỗi cái đạt ít nhất `min` (0..1) độ tốt
export function refineHit(it, want, min = 0, pct) {
  return want.length > 0 && want.every((id) => { const f = it.fx?.find((x) => x.id === id); return f && (!min || pct(it, f) >= min); });
}

// ───── Dung luyện: chuyển một hiệu ứng từ món phụ liệu sang món chính ─────
// fuseBase: số hiệu ứng chứa bình thường; vượt mức này là luyện hóa, khó hơn và đắt hơn, tới fuseCap thì hóa Chí Tôn
export const fuseBase = (it) => Math.max(1, affixCap(it) + G.FUSE.extra);
export const fuseCap = () => G.FUSE.max;
export const ASCEND_Q = G.QUALITY.length - 1;
// Số hiệu ứng vượt hạn sau lần dung luyện này (thay thế hay cộng dồn cùng loại thì không thêm ô)
export const fuseOver = (main, fxId, replaceId) => {
  const fx = main.fx || [];
  const grow = !fx.some((x) => x.id === fxId) && !fx.some((x) => x.id === replaceId) && fx.length < fuseCap();
  return Math.max(0, fx.length + (grow ? 1 : 0) - fuseBase(main));
};
export function fuseCost(it, over = 0) {
  return { gold: Math.round(G.GEAR_PRICE[it.tier] * G.FUSE.gold * Math.pow(G.FUSE.overGold, over)), core: [Math.min(9, oreG(it.tier) + 1), 1 + Math.floor(over / 3)] };
}
export const fuseP = (s, main, mat, over = 0) => clamp(G.FUSE.p + smithLv(s) * 0.0025 + (mat.tier >= main.tier ? 0.05 : -0.12 * (main.tier - mat.tier)) + deFx(s, 'enh') + fxSum(s, 'luyenkhi') - over * G.FUSE.over, 0.15, 0.97);
// Phụ liệu dùng được: trong túi, chưa khóa, có hiệu ứng
export const fuseMats = (s, mainId) => s.armory.filter((it) => !it.lock && it.id !== mainId && it.fx?.length);
// Giá trị hiệu ứng khi sang món chính: giữ nguyên độ tốt của lần tung gốc, tính lại theo bậc và phẩm chất món chính
export function fusedVal(main, mat, f) {
  const a = G.AFFIX.find((x) => x.id === f.id);
  const r = clamp(f.v / (a.base * mat.tier * mat.q), 0.8, 1.2);
  return affixVal(a, main, r);
}
// Đủ hiệu ứng thì hóa Chí Tôn: đổi phẩm chất, mọi hiệu ứng tính lại theo hệ số mới, giữ độ tốt
function ascend(it) {
  const q = G.QUALITY[ASCEND_Q][0];
  it.fx = it.fx.map((f) => ({ id: f.id, v: f.id === 'homenh' ? Math.min(0.6, f.v * q / it.q) : f.v * q / it.q }));
  it.q = q;
}
// replaceId: hiệu ứng của món chính bị thay (bỏ trống thì cộng thêm, vượt hạn là luyện hóa)
export function fuse(s, mainId, matId, fxId, replaceId) {
  const main = findGear(s, mainId);
  const mat = s.armory.find((x) => x.id === matId);
  const f = mat?.fx?.find((x) => x.id === fxId);
  if (!main || !mat || !f || mat.lock || main === mat) return null;
  if (!smithLv(s)) return 'Cần dựng lò rèn trước.';
  main.fx ||= [];
  const same = main.fx.find((x) => x.id === fxId);
  const swap = !same && main.fx.some((x) => x.id === replaceId);
  if (!same && !swap && main.fx.length >= fuseCap()) return 'Món chính đã đầy hiệu ứng, hãy chọn hiệu ứng để thay.';
  const over = fuseOver(main, fxId, replaceId);
  const c = fuseCost(main, over);
  if (s.gold < c.gold || !hasMat(s, c.core, 'core')) return 'Thiếu nguyên liệu hoặc kim tệ.';
  spend(s, over ? 'Luyện hóa trang bị' : 'Dung luyện trang bị', c.gold);
  takeMat(s, 'core', ...c.core);
  s.armory = s.armory.filter((x) => x !== mat);
  if (R() >= fuseP(s, main, mat, over)) return { ok: false, t: `${over ? 'Luyện hóa' : 'Dung luyện'} thất bại, ${mat.n} tan thành tro bụi.` };
  const v = fusedVal(main, mat, f);
  if (same) same.v = Math.max(same.v, v);
  else if (swap) main.fx = main.fx.map((x) => (x.id === replaceId ? { id: fxId, v } : x));
  else main.fx.push({ id: fxId, v });
  s.stats.fused = (s.stats.fused || 0) + 1;
  const n = G.AFFIX.find((a) => a.id === fxId).n;
  if (main.fx.length >= fuseCap() && qualityIdx(main) < ASCEND_Q) {
    ascend(main);
    s.stats.ascend = (s.stats.ascend || 0) + 1;
    return { ok: true, ascend: true, it: main, t: `${fuseCap()} đạo hiệu ứng hợp nhất, huyết quang xung thiên! ${main.n} hóa thành ${G.QUALITY[ASCEND_Q][1]}!`, fx: fxId };
  }
  return { ok: true, t: `${gearName(main)} hấp thụ hiệu ứng ${n}!`, fx: fxId };
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
export function qualityOdds(s, extra = 0) {
  const luckK = Math.max(0.3, 1 + (s.luck - 45) / 60);
  const b = craftBoost(s) + extra;
  const ws = G.QUALITY.map((x) => x[2] * (x[0] > 1 ? luckK * (1 + b * (x[0] - 1)) : 1));
  const tot = ws.reduce((a, w) => a + w, 0);
  return ws.map((w) => w / tot);
}

import G from './data.js';
import { unit, spend, give, parseKey, beastDef, activeBeast, beastVal, fmtGold } from './util.js';

// ───── Linh thú: thú cưng và thú cưỡi ─────
// s.beasts = { pets: [{id, lv, xp}], mounts: [...], pet: id đang theo, mount: id đang cưỡi }
export const LIST = { pet: 'pets', mount: 'mounts' };
export const KIND_N = { pet: 'Thú cưng', mount: 'Thú cưỡi' };
export const defsOf = (kind) => (kind === 'pet' ? G.PETS : G.MOUNTS);
export const ownedOf = (s, kind) => s.beasts?.[LIST[kind]] || [];
export const owns = (s, kind, id) => ownedOf(s, kind).some((b) => b.id === id);
export { activeBeast };

export function ensureBeasts(s) {
  s.beasts ||= { pets: [], mounts: [], pet: null, mount: null };
  // Bản lưu cũ: thú đồng hành chỉ có tên
  const legacy = G.PET_LEGACY[s.companion];
  if (legacy && !owns(s, 'pet', legacy)) { s.beasts.pets.push({ id: legacy, lv: 1, xp: 0 }); s.beasts.pet ||= legacy; }
  syncCompanion(s);
  return s.beasts;
}
// Tên thú cưng đang theo dùng cho các câu chuyện cũ (s.companion)
function syncCompanion(s) {
  const p = activeBeast(s, 'pet');
  if (p) s.companion = beastDef('pet', p.id).n;
}

export function addBeast(s, kind, id) {
  ensureBeasts(s);
  if (owns(s, kind, id)) return null;
  const b = { id, lv: 1, xp: 0 };
  s.beasts[LIST[kind]].push(b);
  s.beasts[kind] ||= id;
  syncCompanion(s);
  return b;
}
export function setActive(s, kind, id) {
  ensureBeasts(s);
  s.beasts[kind] = s.beasts[kind] === id ? null : id;
  syncCompanion(s);
  if (kind === 'pet' && !s.beasts.pet) s.companion = null;
  const d = beastDef(kind, id);
  return s.beasts[kind] ? (kind === 'pet' ? `${d.n} theo bên bạn.` : `Bạn cưỡi ${d.n}.`) : `${d.n} về chuồng nghỉ ngơi.`;
}

// Giá mua tính theo ma hạch cùng cấp cảnh giới
export const beastPrice = (s, d) => Math.round(d.price * unit(s));
export const canBuyBeast = (s, kind, d) => s.R >= d.minR && !owns(s, kind, d.id) && s.gold >= beastPrice(s, d);
export function buyBeast(s, kind, id) {
  const d = beastDef(kind, id);
  if (!d || owns(s, kind, id) || s.R < d.minR) return null;
  if (!spend(s, `Mua ${d.n}`, beastPrice(s, d))) return 'Không đủ tiền.';
  addBeast(s, kind, id);
  s.beasts[kind] = id;
  syncCompanion(s);
  return kind === 'pet' ? `${d.n} đã khế ước với bạn.` : `Bạn thuần phục được ${d.n}.`;
}

// Kinh nghiệm cần để lên cấp kế
export const xpNeed = (lv) => Math.round(8 * Math.pow(lv, 1.6));
// Cho ăn ma hạch: dùng loại phẩm cao nhất trong túi, phẩm càng cao càng nhiều kinh nghiệm
export function bestCore(s) {
  let g = 0;
  for (const k of Object.keys(s.inv)) { const [t, gg] = parseKey(k); if (t === 'core' && gg > g) g = gg; }
  return g;
}
export const coreXp = (g) => Math.round(2 * Math.pow(g, 1.5));
export function feed(s, kind, id, n = 1) {
  const b = ownedOf(s, kind).find((x) => x.id === id);
  if (!b || b.lv >= G.BEAST_MAX) return null;
  let used = 0, gained = 0;
  const lv0 = b.lv;
  while (used < n && b.lv < G.BEAST_MAX) {
    const g = bestCore(s);
    if (!g) break;
    give(s, 'core', g, -1);
    used++;
    gained += coreXp(g);
    b.xp += coreXp(g);
    while (b.lv < G.BEAST_MAX && b.xp >= xpNeed(b.lv)) { b.xp -= xpNeed(b.lv); b.lv++; }
  }
  if (b.lv >= G.BEAST_MAX) b.xp = 0;
  if (!used) return { t: 'Túi không còn ma hạch.' };
  const d = beastDef(kind, id);
  return { t: b.lv > lv0 ? `${d.n} lên cấp ${b.lv}!` : `${d.n} ăn ${used} khỏa ma hạch, +${gained} kinh nghiệm.`, up: b.lv > lv0 };
}

// Cộng (hoặc trừ) kinh nghiệm cho thú đang dùng, tự lên / xuống cấp. Trả về con thú hoặc null
export function beastXp(s, kind, n) {
  const b = activeBeast(s, kind);
  if (!b) return null;
  b.xp += n;
  while (b.lv < G.BEAST_MAX && b.xp >= xpNeed(b.lv)) { b.xp -= xpNeed(b.lv); b.lv++; }
  while (b.xp < 0 && b.lv > 1) { b.lv--; b.xp += xpNeed(b.lv); }
  b.xp = b.lv >= G.BEAST_MAX ? 0 : Math.max(0, b.xp);
  return b;
}

// Lớn dần theo năm tháng khi đang theo chủ
export function beastsYearly(s, yrs) {
  if (!s.beasts) return;
  for (const kind of ['pet', 'mount']) {
    const b = activeBeast(s, kind);
    if (!b || b.lv >= G.BEAST_MAX) continue;
    b.xp += Math.round(yrs * 1.5);
    while (b.lv < G.BEAST_MAX && b.xp >= xpNeed(b.lv)) { b.xp -= xpNeed(b.lv); b.lv++; }
  }
}

// Mô tả hiệu ứng hiện tại của một con, ví dụ ["Chiến lực +3.2", "Thoát hiểm 8%"]
const FX_N = { phagiap: 'Chiến lực', phucvan: 'Khí vận', tambao: 'Tầm bảo', hoixuan: 'Hồi thể/năm', dientho: 'Thọ', thongthien: 'Đột phá', dodge: 'Thoát hiểm' };
export function beastLines(s, kind, b, lv = b.lv) {
  const d = beastDef(kind, b.id);
  return Object.keys(d.fx).map((id) => {
    const v = beastVal(s, kind, { ...b, lv }, id);
    const pct = ['tambao', 'thongthien', 'dodge'].includes(id);
    return [FX_N[id] || id, pct ? `+${(v * 100).toFixed(1)}%` : id === 'dientho' ? `+${Math.round(v)} năm` : `+${v.toFixed(1)}`];
  });
}
export const beastPriceText = (s, d) => fmtGold(beastPrice(s, d));

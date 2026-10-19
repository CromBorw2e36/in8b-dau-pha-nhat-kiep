import G from './data.js';
import { R, rand, clamp, pick, earn, give, bankIn, fmtGold, lastEntry } from './util.js';
import { genGear } from './gear.js';
import { warPower, upPower } from './sect.js';
export { upPower };
import { armyLoss } from './army.js';
import { stock, vaultOf } from './vault.js';

// ───── Thượng giới: kiếp tiếp tục sau khi phá toái hư không ─────
// s.up = { at: lượt phi thăng, age, land: { id: { at } }, war: { id: lượt đánh gần nhất } }
export const upRegion = (id) => G.UP_REGIONS.find((r) => r.id === id);
export const inUpper = (s) => !!s.up;
export const upHeld = (s) => Object.keys(s.up?.land || {}).length;
export const upTurns = (s) => (s.up ? s.t - s.up.at : 0);

// Độ khó trùng sinh
export const ngK = (s, k) => 1 + (s.ng || 0) * G.NG[k];
export const upDef = (s, r) => Math.round(r.def * ngK(s, 'def'));

const ADJ = {};
for (const [a, b] of G.UP_ROADS) { (ADJ[a] ||= []).push(b); (ADJ[b] ||= []).push(a); }
export const upNeighbors = (id) => ADJ[id] || [];

export const settleLeft = (s, id) => Math.max(0, G.UP_SETTLE - (s.t - (s.up.land[id]?.t ?? -99)));

export function upBlock(s, r) {
  if (!s.up) return 'Chưa phi thăng';
  if (s.up.land[r.id]) return 'Đã chiếm';
  const near = upNeighbors(r.id).filter((id) => s.up.land[id]);
  if (upHeld(s) ? !near.length : !r.start) return upHeld(s) ? 'Không giáp vùng của ta' : 'Bắt đầu từ Phi Thăng Đài';
  // Bàn đạp phải bình định xong mới xuất quân được
  const wait = upHeld(s) ? Math.min(...near.map((id) => settleLeft(s, id))) : 0;
  if (wait > 0) return `Vùng giáp ranh đang bình định, còn ${wait} lượt`;
  if (s.t - (s.up.war[r.id] ?? -99) < 2) return 'Quân đang nghỉ';
  return null;
}
// Chinh phạt thượng giới: chênh lệch thế lực tính mềm hơn hạ giới một chút
export const upP = (s, r) => clamp(1 / (1 + Math.exp(-(warPower(s) - upDef(s, r)) / 12)), 0.03, 0.95);

export function ascendUp(s) {
  if (s.up || s.R < 11) return null;
  s.up = { at: s.t, age: s.age, land: {}, war: {} };
  s.flags.ascend = true;
  s.post = s.post || [];
  const t = 'Bạn xé toạc hư không, bước lên Thượng giới. Linh khí nơi đây đậm gấp trăm lần, nhưng ai cũng là Đấu Đế. Tông môn và quân đội theo bạn phi thăng.';
  lastEntry(s).items.push({ t, k: 'key' });
  return t;
}

export function attackUp(s, id) {
  const r = upRegion(id);
  if (!r || upBlock(s, r)) return null;
  s.up.war[id] = s.t;
  const p = upP(s, r);
  if (R() < p) {
    s.up.land[id] = { at: s.age, t: s.t };
    s.fame += 5;
    const ore = Math.round(rand(60, 120));
    if (vaultOf(s)) stock(s, 'ore', 9, ore); else give(s, 'ore', 9, ore);
    earn(s, `Chiến lợi phẩm ${r.n}`, r.inc * ngK(s, 'inc') * rand(0.4, 0.8));
    if (vaultOf(s)) vaultOf(s).gear.push(genGear(s, { tier: 6, q: pick([2, 2, 2.6]), boost: 3 }));
    armyLoss(s, rand(0.03, 0.08));
    s.stats.upLands = Math.max(s.stats.upLands || 0, upHeld(s));
    return `Cờ của bạn cắm trên ${r.n}! ${r.own} thần phục. Đế nguyên +${G.UP_POWER}, kho nhận ${ore} huyền thiết 9 phẩm và một món thần khí.`;
  }
  s.body = Math.max(5, s.body - 25);
  s.fame = Math.max(0, s.fame - 2);
  armyLoss(s, rand(0.08, 0.15));
  return `${r.own} đẩy lui đại quân của bạn khỏi ${r.n}. Bạn trọng thương, binh sĩ tổn thất nặng.`;
}

// Cống phẩm và quặng thần mỗi năm
export function upYearly(s, e, yrs) {
  if (!s.up) return;
  let inc = 0, ore = 0;
  for (const id of Object.keys(s.up.land)) {
    const r = upRegion(id);
    if (!r) continue;
    inc += r.inc * ngK(s, 'inc') * yrs * rand(0.85, 1.15);
    ore += 15 * yrs;
  }
  if (inc) bankIn(s, 'Cống phẩm thượng giới', inc);
  if (ore) { if (vaultOf(s)) stock(s, 'ore', 9, ore); else give(s, 'ore', 9, ore); }
  const left = dechienIn(s);
  if (left === 5) e.items.push({ t: 'Thiên Đế đã biết tới kẻ phi thăng từ hạ giới. Năm lượt nữa, Đế chiến sẽ nổ ra.', k: 'bad' });
}

// ───── Đế chiến ─────
export const bossPower = (s) => Math.round((G.UP_DECHIEN.base + upTurns(s) * G.UP_DECHIEN.grow) * ngK(s, 'def'));
// Đế chiến nổ ra khi chiếm trọn thượng giới, hoặc muộn nhất sau G.UP_DECHIEN.after lượt
export const dechienReady = (s) => !!s.up && !s.dead && (upHeld(s) >= G.UP_REGIONS.length || upTurns(s) >= G.UP_DECHIEN.after);
export const dechienIn = (s) => (s.up ? Math.max(0, G.UP_DECHIEN.after - upTurns(s)) : 0);
// Đế chiến tính mềm: kém thế lực vẫn còn cơ hội lật kèo
export const dechienP = (s, bonus = 0) => clamp(1 / (1 + Math.exp(-(warPower(s) - bossPower(s)) / 60)) + bonus, 0.05, 0.9);

// ───── Trùng sinh ─────
const KEY = 'dpnk_rebirth';
export function writeRebirth(s, win) {
  const R = { lv: (s.ng || 0) + (win ? 2 : 1), from: s.name, win };
  try { localStorage.setItem(KEY, JSON.stringify(R)); } catch {}
  s.flags.dechien = win ? 'win' : 'lose';
  return R;
}
export function readRebirth() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
export function clearRebirth() { try { localStorage.removeItem(KEY); } catch {} }

// Căn cốt trùng sinh: ít nhất Thiên tài, càng nhiều lần càng dễ ra thể chất đặc thù
export const rebirthRoot = (root, lv) => (root >= 5 ? 5 : R() < Math.min(0.9, 0.25 + lv * G.NG.special) ? 5 : Math.max(root, 4));
// Áp vào kiếp mới: ký ức kiếp trước giúp tu luyện nhanh (xem qiGain); đổi lại đại lục khó hơn
export function applyRebirth(s, Rb) {
  s.ng = Rb.lv;
  s.rebornFrom = Rb.from;
  s.luck = clamp(s.luck + Rb.lv * G.NG.luck);
}
export const ngLabel = (s) => (s.ng ? `Trùng sinh ${s.ng}` : '');
export const fmtBoss = (s) => fmtGold(bossPower(s));

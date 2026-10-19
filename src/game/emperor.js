import G from './data.js';
import { clamp, applyFx, gearName, fmtGold, tierFor } from './util.js';
import { obtainGear } from './gear.js';

// ───── Đế cảnh tinh tu: mốc mỗi 10 trọng Đấu Đế ─────
export const deStep = (s) => (s.R >= 11 ? s.step : 0);
export const deReached = (s) => G.DE_CANH.filter((m) => deStep(s) >= m.at);
export const deNext = (s) => G.DE_CANH.find((m) => deStep(s) < m.at) || null;
// Tổng hiệu quả một loại của các mốc đã đạt
export const deFx = (s, k) => deReached(s).reduce((a, m) => a + (m.fx[k] || 0), 0);

// ───── Nhất thống đại lục ─────
export const landsHeld = (s) => Object.keys(s.land || {}).length;
export const unifyLeft = (s) => G.REGIONS.filter((r) => !s.land?.[r.id]);
// Phần thưởng nhất thống chỉ có hiệu lực khi còn nắm trọn đại lục
export const unified = (s) => !!s.flags?.unified && landsHeld(s) >= G.REGIONS.length;
export const unifyFx = (s, k) => (unified(s) ? G.UNIFY_BONUS[k] || 0 : 0);

// Báo khi vừa ngộ ra đế pháp mới, hồi phục của «Thiên địa đồng thọ»
export function emperorYearly(s, e) {
  if (s.R < 11) return;
  const got = deReached(s).filter((m) => m.at > (s.deSeen || 0));
  for (const m of got) e.items.push({ t: `Đấu Đế ${m.at} trọng — ngộ ra đế pháp «${m.n}»: ${m.d}`, k: 'key' });
  if (got.length) s.deSeen = got[got.length - 1].at;
  if (deFx(s, 'regen')) applyFx(s, { body: 4, tam: 3 });
}

// ───── Truyền thừa ─────
const KEY = 'dpnk_legacy';
export const legacySlots = (s) => 1 + (s.flags?.heir ? 1 : 0) + deFx(s, 'slot');
export const canAscend = (s) => deFx(s, 'ascend') > 0;
export const bestGear = (s) => Object.values(s.gear || {}).filter(Boolean).sort((a, b) => b.tier * b.q - a.tier * a.q)[0] || null;

// Món nào mang được (một số cần kiếp này có sẵn)
export function legacyAvail(s, id) {
  if (id === 'gear') return !!bestGear(s);
  if (id === 'fire') return s.fires.length > 0;
  if (id === 'gong') return s.gong >= 2 || s.skill >= 2;
  if (id === 'gold') return s.gold > 0;
  if (id === 'sect') return !!s.sect;
  return true;
}
export const legacyGold = (s) => Math.round(Math.min(s.gold * 0.05, 200000));

// Ghi ngọc giản truyền thừa (picks: id → lựa chọn, ví dụ gear: id món, fire: tên dị hỏa)
export function writeLegacy(s, picks) {
  const L = { from: s.name, at: Date.now(), ascend: !!picks.ascend };
  for (const [id, v] of Object.entries(picks)) {
    if (id === 'ascend' || !legacyAvail(s, id)) continue;
    if (id === 'blood') L.blood = true;
    if (id === 'gear') {
      const it = Object.values(s.gear).find((x) => x?.id === v) || bestGear(s);
      L.gear = { ...it, en: Math.floor((it.en || 0) / 2) };
    }
    if (id === 'fire') L.fire = s.fires.includes(v) ? v : s.fires[0];
    if (id === 'gong') L.gong = { gong: Math.min(2, s.gong), skill: Math.min(2, s.skill) };
    if (id === 'gold') L.gold = legacyGold(s);
    if (id === 'sect') L.sect = { name: s.sect.name, b: Object.fromEntries(Object.entries(s.sect.b).map(([k, v]) => [k, Math.floor(v / 4)])) };
  }
  try { localStorage.setItem(KEY, JSON.stringify(L)); } catch {}
  s.flags.legacy = true;
  return L;
}
export function readLegacy() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
export function clearLegacy() { try { localStorage.removeItem(KEY); } catch {} }

// Áp truyền thừa vào kiếp mới (gọi trong newLife). Món cần chờ cảnh giới để ở s.legacy
export function applyLegacy(s, L) {
  s.heirOf = L.from;
  s.legacy = {};
  if (L.blood) { if (s.root < 4) s.root = Math.min(4, Math.max(s.root, 1) + 1); s.luck = clamp(s.luck + 8); }
  if (L.gong) { s.gong = Math.max(s.gong, L.gong.gong); s.skill = Math.max(s.skill, L.gong.skill); }
  if (L.gear) s.legacy.gear = L.gear;
  if (L.fire) s.legacy.fire = L.fire;
  if (L.gold) s.legacy.gold = L.gold;
  if (L.sect) s.legacy.sect = L.sect;
  const parts = [L.blood && 'đế huyết', L.gong && 'bí tịch', L.gear && gearName(L.gear), L.fire, L.gold && 'đế khố', L.sect && `di sản ${L.sect.name}`].filter(Boolean);
  return parts;
}

// Mở dần các món bị phong ấn khi kiếp mới đủ điều kiện
export function legacyYearly(s, e) {
  const L = s.legacy;
  if (!L) return;
  if (L.gold && s.age >= 16) {
    s.gold += L.gold;
    s.led.push(['Đế khố truyền thừa', L.gold]);
    e.items.push({ t: `Tròn mười sáu tuổi, ngọc giản truyền thừa mở ra đế khố: ${fmtGold(L.gold)} kim tệ.`, k: 'key' });
    delete L.gold;
  }
  if (L.fire && s.started && s.R >= 4) {
    if (!s.fires.includes(L.fire)) s.fires.push(L.fire);
    e.items.push({ t: `${L.fire} ngủ say trong huyết mạch bỗng thức tỉnh, hòa vào đấu khí của bạn.`, k: 'key' });
    delete L.fire;
  }
  if (L.gear && s.started && tierFor(s) >= L.gear.tier) {
    e.items.push({ t: `Phong ấn trên bản mệnh pháp bảo kiếp trước tan biến: ${obtainGear(s, L.gear)}.`, k: 'key' });
    delete L.gear;
  }
}

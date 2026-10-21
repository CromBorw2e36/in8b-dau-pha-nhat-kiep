import G from './data.js';
import { R, clamp, applyFx, gearName, fmtGold, tierFor, realmLabel, heirRank } from './util.js';
import { obtainGear, rollFresh } from './gear.js';

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
// Pháp bảo truyền thừa: chọn nhiều món, đang mặc hoặc trong túi
export const legacyGearMax = (s) => Math.min(G.HEIR.gearMax, 1 + legacySlots(s));
export const legacyGearList = (s) => [...G.GEAR_SLOTS.map((k) => s.gear[k]).filter(Boolean), ...s.armory];

// Một đời truyền thừa: ghi phả hệ, giữ nguyên cường hóa (mở thêm tầng 12 cấp),
// tung thêm thuộc tính cộng dồn và thử thức tỉnh một hiệu ứng mới (tỷ lệ thấp)
export function inheritGear(s, src) {
  const it = JSON.parse(JSON.stringify(src));
  const gen = (it.gen || 0) + 1;
  it.gen = gen;
  it.lock = true;
  it.heirs = [...(it.heirs || []), { n: s.name, R: realmLabel(s), en: it.en || 0, ng: s.ng || 0 }];
  it.attr ||= {};
  const H = G.HEIR;
  const got = { gen, attr: [], fx: null };
  const nA = H.attr[0] + Math.floor(R() * (H.attr[1] - H.attr[0] + 1)) + (gen >= 3 ? 1 : 0) + (gen >= 6 ? 1 : 0);
  const pool = [...G.HEIR_ATTR];
  for (let i = 0; i < nA && pool.length; i++) {
    const a = pool.splice(Math.floor(R() * pool.length), 1)[0];
    // Đời càng sâu, thuộc tính tung ra càng mạnh
    const v = a.base * it.tier * (0.6 + R() * 0.8) * (1 + 0.15 * (gen - 1));
    it.attr[a.id] = (it.attr[a.id] || 0) + v;
    got.attr.push([a.id, v]);
  }
  it.fx ||= [];
  const pFx = Math.max(H.fxMin, H.fxP - it.fx.length * H.fxDrop);
  if (R() < pFx) {
    const have = it.fx.map((f) => f.id);
    const heirOnes = G.AFFIX.filter((a) => a.heir && !have.includes(a.id)).length;
    const f = rollFresh(it, 1, have, heirOnes > 0 && R() < H.heirFx)[0] || rollFresh(it, 1, have)[0];
    if (f) { it.fx.push(f); got.fx = f.id; }
  }
  it.got = got;
  return it;
}

// Món nào mang được (một số cần kiếp này có sẵn)
export function legacyAvail(s, id) {
  if (id === 'gear') return legacyGearList(s).length > 0;
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
      const all = legacyGearList(s);
      const ids = Array.isArray(v) ? v : [v];
      let list = all.filter((x) => ids.includes(x.id)).slice(0, legacyGearMax(s));
      if (!list.length) list = [bestGear(s) || all[0]];
      L.gears = list.map((it) => inheritGear(s, it));
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
  const gears = L.gears || (L.gear ? [L.gear] : []); // ngọc giản cũ chỉ có một món
  if (gears.length) s.legacy.gears = gears;
  if (L.fire) s.legacy.fire = L.fire;
  if (L.gold) s.legacy.gold = L.gold;
  if (L.sect) s.legacy.sect = L.sect;
  const parts = [L.blood && 'đế huyết', L.gong && 'bí tịch', gears.length && gears.map(gearName).join(', '), L.fire, L.gold && 'đế khố', L.sect && `di sản ${L.sect.name}`].filter(Boolean);
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
  if (L.gear) { L.gears = [...(L.gears || []), L.gear]; delete L.gear; } // bản lưu cũ
  if (L.gears && s.started) {
    const ready = L.gears.filter((it) => tierFor(s) >= it.tier);
    for (const it of ready) {
      e.items.push({ t: `Phong ấn trên pháp bảo ${heirLine(it)} tan biến: ${obtainGear(s, it)}.`, k: 'key' });
      s.heirNew = [...(s.heirNew || []), it.id]; // giao diện diễn cảnh thức tỉnh
    }
    L.gears = L.gears.filter((it) => !ready.includes(it));
    if (!L.gears.length) delete L.gears;
  }
}
// «truyền N đời (Phẩm hiệu)»
export function heirLine(it) {
  const r = heirRank(it);
  return r ? `${r.n.toLowerCase()} ${it.gen} đời` : '';
}

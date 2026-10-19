import G from './data.js';

export const R = Math.random;
export const rand = (a, b) => a + R() * (b - a);
export const pick = (a) => a[Math.floor(R() * a.length)];
export const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export function wpick(items, wf) {
  let tot = 0;
  const ws = items.map((it) => { const w = Math.max(0, wf(it)); tot += w; return w; });
  if (tot <= 0) return null;
  let r = R() * tot;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

export const realm = (s) => G.REALMS[s.R];
export const nextRealm = (s) => G.REALMS[s.R + 1];
export const lifeOf = (s) => G.REALMS[s.R].life + (s.lifeBonus || 0);
// ───── Tiền & vật phẩm ─────
export const beastGrade = (s) => clamp(s.R, 1, 9); // cấp ma thú tương xứng với cảnh giới
export const pillNeed = (s) => G.PILL_NEED[s.R];
export const priceOf = (t, g) => Math.round(G.ITEMS[t].base * Math.pow(3, g - 1));
export const unit = (s) => priceOf('core', beastGrade(s)); // giá một khỏa ma hạch cùng cấp
export const itemName = (t, g) => G.ITEMS[t].n(g);
export const parseKey = (k) => { const [t, g] = k.split(':'); return [t, +g]; };

export function give(s, t, g, n = 1) {
  g = clamp(Math.round(g), 1, 9);
  const k = `${t}:${g}`;
  s.inv[k] = (s.inv[k] || 0) + n;
  if (s.inv[k] <= 0) delete s.inv[k];
}
export const countOf = (s, t, minG = 1) =>
  Object.entries(s.inv).reduce((a, [k, n]) => { const [tt, g] = parseKey(k); return tt === t && g >= minG ? a + n : a; }, 0);
export function peekBest(s, t) {
  let best = 0;
  for (const k of Object.keys(s.inv)) { const [tt, g] = parseKey(k); if (tt === t && g > best) best = g; }
  return best;
}
export function takeBest(s, t) {
  const g = peekBest(s, t);
  if (g) give(s, t, g, -1);
  return g;
}
export function earn(s, label, amt) {
  amt = Math.round(amt);
  if (amt <= 0) return;
  s.gold += amt;
  s.led.push([label, amt]);
}
export function spend(s, label, amt) {
  amt = Math.round(amt);
  if (s.gold < amt) return false;
  s.gold -= amt;
  if (amt > 0) s.led.push([label, -amt]);
  return true;
}
// Mất tiền bất kể đủ hay không (bị cướp, tổn thất…)
export function lose(s, label, amt) {
  amt = Math.min(s.gold, Math.round(amt));
  if (amt > 0) { s.gold -= amt; s.led.push([label, -amt]); }
  return amt;
}
export const fmtItems = (list) => list.map(([t, g, n]) => `${n} ${itemName(t, g).toLowerCase()}`).join(', ');

export const hasAttr = (s, a) => s.attrs.includes(a);
export const hasTrait = (s, id) => s.traits.includes(id);
export const trait = (id) => (id === 'ring' ? G.RING_TRAIT : G.TRAITS.find((t) => t.id === id));
export const lastEntry = (s) => s.log[s.log.length - 1];
export const focusObj = (s) => G.FOCUS.find((f) => f.id === s.focus) || null;
export const pronoun = (g) => (g === 'm' ? 'chàng' : 'nàng');

export const canAlch = (s) =>
  (hasAttr(s, 'Hỏa') || s.fires.length > 0 || !!s.master) &&
  (hasAttr(s, 'Mộc') || s.soul >= 55 || !!s.master);

export function realmLabel(s) {
  if (!s.started) return 'Chưa tu luyện';
  const r = realm(s);
  return r.st > 1 ? `${r.n} ${s.step} ${r.u}` : r.n;
}
export const level = (s) => (s.started ? s.R + s.step / realm(s).st : 0);

// Chiến lực
export function cp(s) {
  let v = s.R * 10 + s.step + (s.body - 50) / 10;
  v += s.skill * 2 * (0.5 + s.mastery / 200);
  v += s.fires.length * 3 + (s.companion ? 1.5 : 0) + (s.evil ? 1 : 0);
  if (hasTrait(s, 'fierce')) v += 2;
  v += gearSum(s, 'cp');
  return v;
}

// ───── Trang bị ─────
export function gearStat(it) {
  const D = G.GEAR[it.sl];
  return { cp: D.cp[it.tier] * it.q, def: (D.def?.[it.tier] || 0) * Math.min(it.q, 1.3), qi: (D.qi?.[it.tier] || 0) * it.q };
}
export const gearSum = (s, k) => Object.values(s.gear || {}).reduce((a, it) => a + (it ? gearStat(it)[k] : 0), 0);
export const gearScore = (it) => (it ? G.GEAR_PRICE[it.tier] * it.q : 0);
export const gearName = (it) => `${it.n}${it.q > 1 ? ` · ${G.QUALITY.find((x) => x[0] === it.q)?.[1] || ''}` : ''}`;
// Bậc trang bị tương xứng với cảnh giới
export const tierFor = (s) => (s.R <= 1 ? 1 : s.R <= 3 ? 2 : s.R <= 5 ? 3 : s.R <= 7 ? 4 : 5);
export const peer = (s, d = 0) => s.R * 10 + 5 + d;
export const winP = (s, enemy) => clamp(1 / (1 + Math.exp(-(cp(s) - enemy) / 3)), 0.03, 0.97);

export function die(s, cause, win = false) {
  s.dead = true;
  s.cause = cause;
  s.win = win;
  s.pending = null;
  s.needFocus = false;
  lastEntry(s).items.push({ t: win ? cause : `${cause}.`, k: win ? 'key' : 'death' });
}

// Cộng/trừ đấu khí, tự lên bậc. Trả về số bậc thay đổi.
export function addQi(s, v) {
  if (!s.started || s.R >= 11) return 0;
  const before = s.step;
  s.qi += v;
  const st = realm(s).st;
  while (s.qi >= 100) {
    if (s.step < st) { s.step++; s.qi -= 100; }
    else { s.qi = 100; s.ready = true; break; }
  }
  while (s.qi < 0) {
    if (s.step > 1) { s.step--; s.qi += 100; }
    else { s.qi = 0; break; }
  }
  if (s.qi < 100) s.ready = false;
  return s.step - before;
}

export function btChance(s, bonus = 0) {
  let extra = bonus + (s.tam - 50) / 200 + (s.soul - 50) / 300 + (s.luck - 50) / 400 + (s.wait || 0) * 0.05;
  if (hasTrait(s, 'firm')) extra += 0.03;
  // Đấu Thánh → Đấu Đế gần như bất khả: chỉ dị hỏa và công pháp Thiên giai mới giúp được chút ít
  if (s.R >= 10) return 0.001 + Math.min(0.012, s.fires.length * 0.008 + (s.gong === 4 ? 0.006 : 0) + bonus * 0.05);
  return clamp(realm(s).bt + extra, 0.01, 0.95);
}

export function advance(s) {
  s.R++;
  s.step = 1;
  s.qi = 0;
  s.ready = false;
  s.wait = 0;
  s.fame += s.R >= 5 ? s.R - 3 : 0;
  if (s.R >= 11) { die(s, 'Phá vỡ giới hạn thiên địa, thành tựu Đấu Đế — vạn cổ nhất nhân', true); return; }
  // Quà mừng đột phá — hiện sau dòng thông báo đột phá (xem s.post trong choose)
  s.post = s.post || [];
  if (s.wealth >= 1 && s.parents.alive && s.R <= 6) {
    const a = unit(s) * (1 + s.wealth);
    earn(s, 'Gia tộc ban thưởng', a);
    s.post.push({ t: `Gia tộc mở tiệc mừng, ban thưởng ${fmtGold(a)} kim tệ.`, k: 'good' });
  }
  if (s.faction && !s.evil && s.R <= 9) {
    give(s, 'tuk', pillNeed(s), 2);
    s.post.push({ t: `${s.faction} ban thưởng 2 viên ${itemName('tuk', pillNeed(s))}.`, k: 'good' });
  }
}

export function btFail(s) {
  s.qi = 55;
  if (s.R >= 9) s.qi = 0; // từ Bán Thánh trở lên, thất bại là mất sạch tích lũy
  if (s.R >= 10) s.step = Math.max(1, s.step - 3); // Đấu Thánh thất bại: tổn hại căn cơ
  s.ready = false;
  s.wait = 0;
}

const SNAP = ['body', 'soul', 'tam', 'luck', 'gold'];
export const snapshot = (s) => ({ ...Object.fromEntries(SNAP.map((k) => [k, s[k]])), lv: realmLabel(s), inv: { ...s.inv } });
export function diff(a, s) {
  const d = {};
  for (const k of SNAP) {
    const v = s[k] - a[k];
    if (Math.abs(v) >= (k === 'gold' ? 1 : 0.5)) d[k] = v;
  }
  if (a.lv !== realmLabel(s)) d.lv = realmLabel(s);
  const items = [];
  for (const k of new Set([...Object.keys(a.inv), ...Object.keys(s.inv)])) {
    const n = (s.inv[k] || 0) - (a.inv[k] || 0);
    if (n) items.push([...parseKey(k), n]);
  }
  if (items.length) d.items = items;
  return d;
}

export function applyFx(s, fx) {
  if (!fx) return;
  for (const [k, raw] of Object.entries(fx)) {
    let v = typeof raw === 'function' ? raw(s) : raw;
    if (k === 'body' || k === 'soul' || k === 'tam' || k === 'luck') {
      for (const id of s.traits) {
        const t = trait(id);
        if (v > 0 && t?.pos?.[k]) v *= t.pos[k];
        if (v < 0 && t?.neg?.[k]) v *= t.neg[k];
      }
      if (k === 'body' && v < 0) v *= 1 - gearSum(s, 'def'); // hộ giáp đỡ đòn
      s[k] = clamp(s[k] + v);
    } else if (k === 'gold') {
      // gold: tính theo số ma hạch cùng cấp; goldAbs: số kim tệ cụ thể
      if (v > 0) earn(s, fx.why || 'Thu nhập khác', v * unit(s));
      else lose(s, fx.why || 'Chi tiêu khác', -v * unit(s));
    } else if (k === 'goldAbs') {
      if (v > 0) earn(s, fx.why || 'Thu nhập khác', v);
      else lose(s, fx.why || 'Chi tiêu khác', -v);
    } else if (k === 'item') { if (v) for (const [t, g, n] of v) give(s, t, g, n); }
    else if (k === 'qi') addQi(s, v);
    else if (k === 'fame') s.fame += v;
    else if (k === 'life') s.lifeBonus = (s.lifeBonus || 0) + v;
  }
}

export function genName(g) {
  return pick(G.NAMES.s) + ' ' + pick(G.NAMES[g]);
}

export function fmtGold(v) {
  v = Math.round(v);
  if (v >= 1e9) return (v / 1e9).toFixed(1) + ' tỷ';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' tr';
  if (v >= 1e4) return (v / 1e3).toFixed(0) + 'k';
  return v.toLocaleString('vi-VN');
}

export function upgradeSkill(s) {
  s.skill = Math.min(4, s.skill + 1);
  s.mastery = 0;
  return `đấu kỹ ${G.GRADES[s.skill]}`;
}
export function upgradeGong(s) {
  s.gong = Math.min(4, s.gong + 1);
  return `công pháp ${G.GRADES[s.gong]}`;
}

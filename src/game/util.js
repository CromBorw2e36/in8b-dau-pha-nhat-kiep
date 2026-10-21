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
export const lifeOf = (s) => G.REALMS[s.R].life + (s.lifeBonus || 0) + Math.round(fxSum(s, 'dientho'));
// ───── Tiền & vật phẩm ─────
export const beastGrade = (s) => clamp(s.R, 1, 9); // cấp ma thú tương xứng với cảnh giới
export const pillNeed = (s) => G.PILL_NEED[s.R];
export const priceOf = (t, g) => Math.round(G.ITEMS[t].base * Math.pow(3, g - 1));
// Chỉ số giá thị trường của một nhóm hàng (mặc định 1)
export const mkIdx = (s, mk) => s?.mkt?.[mk] ?? 1;
export const unit = (s) => priceOf('core', beastGrade(s)); // giá một khỏa ma hạch cùng cấp
export const itemName = (t, g) => G.ITEMS[t].n(g);
export const parseKey = (k) => { const [t, g] = k.split(':'); return [t, +g]; };

// Còn chứa thêm được bao nhiêu trong chồng này (tối đa G.STACK_MAX)
export const roomOf = (s, key) => Math.max(0, G.STACK_MAX - (s.inv[key] || 0));

export function give(s, t, g, n = 1) {
  g = clamp(Math.round(g), 1, 9);
  const k = `${t}:${g}`;
  s.inv[k] = Math.min((s.inv[k] || 0) + n, G.STACK_MAX);
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
// ───── Ngân khố tông môn ─────
// Thu nhập của tông môn đổ vào ngân khố; chi phí tông môn trả từ ngân khố trước, thiếu mới lấy ví chính
export function bankIn(s, label, amt) {
  amt = Math.round(amt);
  if (amt <= 0) return;
  if (!s.sect) return earn(s, label, amt);
  s.sect.bank = (s.sect.bank || 0) + amt;
  (s.sect.bankYr ||= {})[label] = (s.sect.bankYr[label] || 0) + amt;
}
// Trả phần ngân khố có, phần thiếu lấy từ ví; không đủ cả hai thì không trả gì
export function sectPay(s, label, amt) {
  amt = Math.round(amt);
  if (amt <= 0) return true;
  const bank = s.sect?.bank || 0;
  if (bank + s.gold < amt) return false;
  const fromBank = Math.min(bank, amt);
  if (fromBank) { s.sect.bank -= fromBank; (s.sect.bankYr ||= {})[label] = (s.sect.bankYr[label] || 0) - fromBank; }
  return spend(s, label, amt - fromBank);
}
// Vét sạch ngân khố và ví khi không trả nổi
export function sectDrain(s, label) {
  if (s.sect?.bank) { (s.sect.bankYr ||= {})[label] = (s.sect.bankYr[label] || 0) - s.sect.bank; s.sect.bank = 0; }
  lose(s, label, s.gold);
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
  v += s.fires.length * 3 + (s.companion || activeBeast(s, 'pet') ? 1.5 : 0) + (s.evil ? 1 : 0);
  if (hasTrait(s, 'fierce')) v += 2;
  v += gearSum(s, 'cp');
  v += fxSum(s, 'phagiap');
  return v * (1 + fxSum(s, 'cuonghuyet'));
}

// ───── Trang bị ─────
// en: cấp cường hóa 0..12, mỗi cấp +10% chỉ số chính
// ───── Cường hóa nhiều tầng ─────
// Mỗi tầng 12 cấp; đồ mới 1 tầng, mỗi đời truyền thừa mở thêm một tầng
export const enMax = (it) => G.ENHANCE_MAX * (1 + (it?.gen || 0));
export const enTier = (en) => Math.floor((en || 0) / G.ENHANCE_MAX);
// Cấp hiệu dụng: cấp ở tầng k mạnh bằng (1 + gain·k) cấp tầng đầu
export function enEff(en) {
  en ||= 0;
  const N = G.ENHANCE_MAX, g = G.ENHANCE_TIER.gain, k = enTier(en);
  return N * (k + g * k * (k - 1) / 2) + (en - k * N) * (1 + g * k);
}
// Giá trị một hiệu ứng pháp khí của món (Tổ Ấn ...), không tính cường hóa
const ownFx = (it, id) => it.fx?.find((f) => f.id === id)?.v || 0;
export function gearStat(it) {
  const D = G.GEAR[it.sl];
  const en = enEff(it.en);
  const m = 1 + 0.1 * en;
  const A = it.attr || {};
  const all = 1 + ownFx(it, 'toan') * (1 + 0.03 * en); // Tổ Ấn: mọi chỉ số chính của món
  return {
    cp: (D.cp[it.tier] * it.q * m + (A.cp || 0)) * all,
    def: Math.min(0.7, ((D.def?.[it.tier] || 0) * Math.min(it.q, 1.3) * (1 + 0.03 * en) + (A.def || 0)) * all),
    qi: ((D.qi?.[it.tier] || 0) * it.q * m + (A.qi || 0)) * all,
    bt: ((D.bt?.[it.tier] || 0) * it.q * (1 + 0.05 * en) + (A.bt || 0)) * all,
    dodge: Math.min(0.6, ((D.dodge?.[it.tier] || 0) * Math.min(it.q, 1.6) * (1 + 0.03 * en) + (A.dodge || 0)) * all),
  };
}
export const gearSum = (s, k) => Object.values(s.gear || {}).reduce((a, it) => a + (it ? gearStat(it)[k] : 0), 0);
export const gearScore = (it) => (it ? G.GEAR_PRICE[it.tier] * it.q * (1 + 0.15 * enEff(it.en)) * (1 + 0.15 * (it.fx?.length || 0)) * (1 + 0.2 * (it.gen || 0)) : 0);
// Tổng giá trị một hiệu ứng pháp khí trên đồ đang mặc (cường hóa tăng thêm 3% mỗi cấp hiệu dụng)
export const fxVal = (it, f) => { const v = f.v * (1 + 0.03 * enEff(it.en)); return f.id === 'homenh' ? Math.min(0.6, v) : v; };
// Thuộc tính truyền thừa cộng như hiệu ứng pháp khí
const HEIR_FX = Object.fromEntries(G.HEIR_ATTR.filter((a) => a.fx).map((a) => [a.fx, a.id]));
export function fxSum(s, id) {
  let t = beastFx(s, id);
  const ha = HEIR_FX[id];
  for (const it of Object.values(s.gear || {})) {
    if (it?.fx) for (const f of it.fx) if (f.id === id) t += fxVal(it, f);
    if (ha && it?.attr?.[ha]) t += it.attr[ha];
  }
  return t;
}
// Phẩm hiệu pháp bảo truyền thừa theo số đời: { n, lv 1..6 } hoặc null
export function heirRank(it) {
  const g = it?.gen || 0;
  if (!g) return null;
  let i = 0;
  G.HEIR_RANK.forEach(([at], k) => { if (g >= at) i = k; });
  return { n: G.HEIR_RANK[i][1], lv: i + 1 };
}
// Dòng hiện một thuộc tính truyền thừa
export function attrText(id, v) {
  const a = G.HEIR_ATTR.find((x) => x.id === id);
  const val = a.fmt === 'pct' ? `+${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%` : a.fmt === 'yr' ? `+${Math.round(v)} năm` : a.fmt === 'gold' ? `${v.toFixed(2)} ma hạch` : `+${v.toFixed(v < 10 ? 1 : 0)}`;
  return { n: a.n, val, d: a.d || a.n.toLowerCase() };
}
// ───── Linh thú ─────
// Hiệu ứng tính theo số tuyệt đối (chiến lực, hồi phục, thọ) lớn dần theo bậc cảnh giới; tỷ lệ % thì không
const BEAST_SCALED = new Set(['phagiap', 'hoixuan', 'duonghon', 'tinhtam', 'dientho', 'kimquang']);
export const beastDef = (kind, id) => (kind === 'pet' ? G.PETS : G.MOUNTS).find((b) => b.id === id);
// Con đang theo bên mình (thú cưng) hoặc đang cưỡi
export const activeBeast = (s, kind) => {
  const b = s.beasts;
  const id = b?.[kind];
  return id ? b[kind === 'pet' ? 'pets' : 'mounts'].find((x) => x.id === id) || null : null;
};
export function beastVal(s, kind, b, id) {
  const v = beastDef(kind, b.id)?.fx[id];
  return v ? v * b.lv * (BEAST_SCALED.has(id) ? tierFor(s) : 1) : 0;
}
export function beastFx(s, id) {
  if (!s.beasts) return 0;
  let t = 0;
  for (const kind of ['pet', 'mount']) { const b = activeBeast(s, kind); if (b) t += beastVal(s, kind, b, id); }
  return t;
}
export function fxText(it, f) {
  const a = G.AFFIX.find((x) => x.id === f.id);
  const v = fxVal(it, f);
  const val = a.fmt === 'pct' ? `+${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%` : a.fmt === 'yr' ? `+${Math.round(v)} năm` : a.fmt === 'gold' ? `${v.toFixed(2)} ma hạch` : `+${v.toFixed(v < 1 ? 2 : 1)}`;
  return { n: a.n, val, d: a.d };
}
export const qualityIdx = (it) => Math.max(0, G.QUALITY.findIndex((x) => x[0] === it.q));
export const gearName = (it) => `${it.n}${it.en ? ` +${it.en}` : ''}${it.q > 1 ? ` · ${G.QUALITY[qualityIdx(it)][1]}` : ''}`;
// Giảm xác suất tử vong nhờ chiến ngoa và thú cưỡi
export const dodgeMult = (s) => Math.max(0.2, 1 - gearSum(s, 'dodge') - beastFx(s, 'dodge') - fxSum(s, 'thietcot'));
// Cấp hiệu dụng của công trình: 10 cấp đầu tính đủ, sau đó mỗi cấp 35%
export const effLv = (lv) => (lv <= 10 ? lv : 10 + (lv - 10) * 0.35);
// Mua nhiều cấp liền: trả về số cấp mua được và tổng giá (want = Infinity để mua tối đa)
export function levelPlan(cost, lv, max, gold, want) {
  let n = 0, tot = 0;
  while (lv + n < max && n < want) {
    const c = cost(lv + n);
    if (tot + c > gold) break;
    tot += c;
    n++;
  }
  return { n, tot, next: lv < max ? cost(lv) : 0 };
}
// Bậc trang bị tương xứng với cảnh giới
export const tierFor = (s) => (s.R <= 1 ? 1 : s.R <= 3 ? 2 : s.R <= 5 ? 3 : s.R <= 7 ? 4 : s.R <= 9 ? 5 : 6);
// Kẻ địch ngang tầm; trùng sinh càng nhiều lần đại lục càng hiểm
export const peer = (s, d = 0) => s.R * 10 + 5 + d + (s.ng || 0) * G.NG.peer;
export const winP = (s, enemy) => clamp(1 / (1 + Math.exp(-(cp(s) - enemy) / 3)), 0.03, 0.97);

// guard: cho phép pháp khí Hộ Mệnh đỡ cái chết (không áp dụng khi hết thọ nguyên)
export function die(s, cause, win = false, guard = true) {
  if (!win && guard && saveByArtifact(s, cause)) return;
  s.dead = true;
  s.cause = cause;
  s.win = win;
  s.pending = null;
  s.needFocus = false;
  lastEntry(s).items.push({ t: win ? cause : `${cause}.`, k: win ? 'key' : 'death' });
}

// Pháp khí Hộ Mệnh: tung xúc xắc theo từng món, đỡ được thì món đó mất hiệu ứng
function saveByArtifact(s, cause) {
  for (const it of Object.values(s.gear || {})) {
    const f = it?.fx?.find((x) => x.id === 'homenh');
    if (!f || R() >= fxVal(it, f)) continue;
    it.fx = it.fx.filter((x) => x !== f);
    s.body = Math.max(s.body, 15);
    s.stats = s.stats || {};
    s.stats.saved = (s.stats.saved || 0) + 1;
    lastEntry(s).items.push({ t: `${cause}… nhưng ${it.n} bỗng bừng sáng, Hộ Mệnh pháp khí vỡ tan, cứu bạn một mạng!`, k: 'key' });
    return true;
  }
  return false;
}

// Đấu Đế tự quy ẩn: kết thúc kiếp này với danh hiệu Đấu Đế
export function retire(s) {
  if (s.R < 11 || s.dead) return;
  const yrs = s.age - (s.emperorAt ?? s.age);
  if (s.up) return die(s, `Ngự trị ${yrs} năm, rồi từ Thượng giới quy ẩn vào hư không — vạn cổ nhất nhân`, true);
  die(s, yrs > 0 ? `Ngự trị đại lục ${yrs} năm, Đấu Đế quy ẩn ngoài thiên ngoại — vạn cổ nhất nhân` : 'Thành tựu Đấu Đế rồi quy ẩn ngoài thiên ngoại — vạn cổ nhất nhân', true);
}

// Cộng/trừ đấu khí, tự lên bậc. Trả về số bậc thay đổi.
export function addQi(s, v) {
  if (!s.started) return 0;
  const before = s.step;
  s.qi += v;
  const st = realm(s).st;
  while (s.qi >= 100) {
    if (s.step < st) { s.step++; s.qi -= 100; }
    else {
      // Đang củng cố: tu vi tràn ra không mất mà tích thành căn cơ (tối đa +10% tỷ lệ đột phá)
      if (holding(s)) s.base = Math.min(0.1, (s.base || 0) + ((s.qi - 100) / 100) * 0.02);
      s.qi = 100; s.ready = s.R < 11; break; // Đấu Đế 100 trọng là tận cùng
    }
  }
  while (s.qi < 0) {
    if (s.step > 1) { s.step--; s.qi += 100; }
    else { s.qi = 0; break; }
  }
  if (s.qi < 100) s.ready = false;
  return s.step - before;
}

// Đang trong thời gian củng cố căn cơ (tạm gác đột phá)
export const holding = (s) => (s.hold || 0) > s.t;
export const holdLeft = (s) => Math.max(0, (s.hold || 0) - s.t);
// Củng cố n lượt: không bị ép đột phá, vẫn lịch luyện và gặp sự kiện bình thường
export function hold(s, n) {
  s.wait = Math.min(3, (s.wait || 0) + 1);
  s.hold = s.t + n;
  s.qi = 100;
  s.ready = true;
}

export function btChance(s, bonus = 0) {
  const ring = gearSum(s, 'bt');
  let extra = bonus + ring + fxSum(s, 'thongthien') + (s.tam - 50) / 200 + (s.soul - 50) / 300 + (s.luck - 50) / 400 + (s.wait || 0) * 0.05 + (s.base || 0);
  if (hasTrait(s, 'firm')) extra += 0.03;
  // Đấu Thánh → Đấu Đế gần như bất khả: chỉ dị hỏa và công pháp Thiên giai mới giúp được chút ít
  if (s.R >= 10) return 0.001 + Math.min(0.016, s.fires.length * 0.008 + (s.gong === 4 ? 0.006 : 0) + bonus * 0.05 + ring * 0.05);
  return clamp(realm(s).bt + extra, 0.01, 0.95);
}

export function advance(s) {
  s.R++;
  s.step = 1;
  s.qi = 0;
  s.ready = false;
  s.wait = 0;
  s.hold = 0;
  s.base = 0;
  s.fame += s.R >= 5 ? s.R - 3 : 0;
  // Thành Đế không kết thúc kiếp này: thọ nguyên vô tận, tiếp tục xây tông môn, chinh phạt đến khi tự quy ẩn
  if (s.R >= 11) {
    s.emperorAt = s.age;
    s.fame += 20;
    s.post = s.post || [];
    s.post.push({ t: 'Phá vỡ giới hạn thiên địa, thành tựu Đấu Đế — vạn cổ nhất nhân! Thọ nguyên của bạn từ nay vô tận.', k: 'key' });
    s.post.push({ t: 'Con đường vẫn còn đó: mở rộng tông môn, chinh phạt đại lục… Khi đã mãn nguyện, hãy bấm «Quy ẩn» để khép lại kiếp này.', k: 'good' });
    return;
  }
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
  s.hold = 0;
  s.base = 0;
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

// Chiến lực / thế lực: dưới 100 000 giữ nguyên số, trên đó chia bậc, mỗi bậc gấp 1000 lần bậc trước
export const CP_TIERS = ['Huyền', 'Địa', 'Thiên', 'Thánh', 'Đế', 'Thần'];
export function fmtCp(v) {
  v = Math.round(v);
  if (Math.abs(v) < 1e5) return String(v);
  let t = Math.min(CP_TIERS.length, Math.floor(Math.log10(Math.abs(v)) / 3));
  if (Math.abs(Math.round(v / 10 ** (t * 3))) >= 1000 && t < CP_TIERS.length) t++; // 999 999 → 1 Địa, không phải 1000 Huyền
  const x = v / 10 ** (t * 3);
  return `${x.toFixed(Math.abs(x) >= 100 ? 0 : 1).replace(/\.0$/, '')} ${CP_TIERS[t - 1]}`;
}

export { upgradeSkill, upgradeGong } from './skills.js';

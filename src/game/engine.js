import G from './data.js';
import { EVENTS, MOMENTS, FILLERS } from './events.js';
import {
  R, rand, pick, wpick, clamp, realm, lifeOf, unit, hasAttr, hasTrait, trait, lastEntry, focusObj,
  canAlch, realmLabel, level, die, addQi, applyFx, snapshot, diff, genName, upgradeSkill,
  give, earn, pillNeed, priceOf, parseKey, fmtGold, gearSum, gearName, dodgeMult,
} from './util.js';
import { economy, cultivationPill, moneyLine, sellPrice } from './economy.js';
import { estatesYearly, estateValue, gearSell } from './gear.js';
import { sectYearly, bLv, landCount, sectTier } from './sect.js';
import { smithYearly, smithLv, armCost } from './forge.js';
import { marketTick, consignTick } from './exchange.js';
import { troopCount } from './army.js';

export const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
const NUM = ['', 'nhất', 'nhị', 'tam', 'tứ', 'ngũ', 'lục', 'thất', 'bát', 'cửu', 'thập'];

export function newLife() {
  const origin = wpick(G.ORIGINS, (o) => o.w);
  const g = R() < 0.5 ? 'm' : 'f';
  let root = wpick(G.ROOTS.map((_, i) => i), (i) => G.ROOTS[i].p);
  if (origin.rootUp && root < 5 && R() < 0.6) root++;
  const special = root === 5 ? pick(G.SPECIAL_BODIES) : null;

  const attrs = [origin.fireAttr || special === 'Viêm Mạch Chi Thể' ? 'Hỏa' : wpick(G.ATTRS, (a) => a[1])[0]];
  if (R() < 0.14) {
    let a2;
    do a2 = wpick(G.ATTRS, (a) => a[1])[0]; while (a2 === attrs[0]);
    attrs.push(a2);
  }

  const traits = [];
  while (traits.length < 2) {
    const t = pick(G.TRAITS).id;
    if (traits.includes(t)) continue;
    if (G.TRAIT_CONFLICT.some(([a, b]) => (a === t && traits.includes(b)) || (b === t && traits.includes(a)))) continue;
    traits.push(t);
  }
  if (R() < 0.04) traits.push('ring');

  const s = {
    v: 1, id: Date.now(), name: genName(g), g, origin: origin.id, originName: origin.n, wealth: origin.wealth,
    root, special, attrs, traits,
    age: 0, t: 0, started: false, R: 0, step: 0, qi: 0, ready: false, wait: 0, lifeBonus: 0,
    body: clamp(50 + rand(-8, 8)), soul: clamp(40 + rand(-10, 10)), tam: clamp(50 + rand(-8, 8)), luck: clamp(45 + rand(-15, 15)),
    gold: origin.gold, inv: {}, led: [], gear: Object.fromEntries(G.GEAR_SLOTS.map((k) => [k, null])), armory: [], estates: {}, sect: null, land: {}, war: {}, auto: { sell: true, buy: true }, salary: 0, dwelling: 0, post: [], gong: origin.wealth >= 2 ? 1 : 0, skill: 0, mastery: 0, fires: [], alch: 0, alchXp: 0,
    mkt: {}, cons: [], ex: null, exNew: 0, smithy: { lv: 0, prod: true }, arms: 0, orders: [], army: { n: {}, armed: 0, train: 0 }, stats: {},
    faction: null, master: null, partner: null, lostPartner: null, companion: null, evil: false, fame: 0, disciples: 0, cured: false,
    parents: { alive: origin.id !== 'orphan', age: Math.round(rand(20, 34)) },
    focus: null, needFocus: false, pending: null, tmp: null,
    seen: {}, last: {}, flags: {}, log: [], hist: [[0, 0]], dead: false, cause: null, win: false,
  };
  applyFx(s, origin.fx);
  for (const id of traits) applyFx(s, trait(id).init);
  if (special === 'Bất Diệt Kim Thân') s.body = clamp(s.body + 20);
  if (special === 'Linh Hồn Thiên Sinh') s.soul = clamp(s.soul + 25);
  if (special === 'Thiên Độc Thể') { s.soul = clamp(s.soul + 8); s.luck = clamp(s.luck - 10); }
  // Truyền thừa: kiếp trước thành Đế và lập người kế thừa thì kiếp này được hưởng phúc ấm
  const prev = readBook()[0];
  if (prev?.heir) {
    s.luck = clamp(s.luck + 8);
    s.gold += 2000 * (1 + origin.wealth);
    s.heirOf = prev.name;
  }
  s.baseLuck = s.luck;

  const intro = origin.id === 'orphan'
    ? `Bạn là một đứa trẻ bị bỏ rơi ở Hắc Giác Vực, được một bà lão nhặt về nuôi và đặt tên là ${s.name}.`
    : `Bạn chào đời — ${origin.n.charAt(0).toLowerCase() + origin.n.slice(1)}. Phụ mẫu đặt tên bạn là ${s.name}.`;
  s.log.push({ a: 0, st: 'Thơ ấu', items: [{ t: intro, k: 'key' }] });
  if (s.heirOf) s.log[0].items.push({ t: `Trong huyết mạch bạn còn vương chút đế uy của Đấu Đế ${s.heirOf}. Phúc ấm kiếp trước theo bạn vào đời.`, k: 'good' });
  return s;
}

export const rootOdds = (s) => Math.max(1, Math.round(100 / G.ROOTS[s.root].p));

function startCult(s, e) {
  s.started = true;
  s.R = 0;
  const m = G.ROOTS[s.root].m;
  s.step = clamp(Math.round(1 + m * rand(0.4, 1.6)), 1, 9);
  s.qi = rand(0, 60);
  const txt = s.root === 0
    ? 'Lễ trắc nghiệm đấu khí. Ma Thạch Bi chỉ lóe lên yếu ớt: «Đấu chi khí, nhất đoạn.» Xung quanh vang lên tiếng cười chế giễu.'
    : `Lễ trắc nghiệm đấu khí. Ma Thạch Bi hiện lên mấy chữ: «Đấu chi khí, ${NUM[s.step]} đoạn.»${s.root >= 4 ? ' Cả quảng trường xôn xao!' : ''}`;
  e.st = 'Bước vào con đường tu luyện';
  e.items.push({ t: txt, k: 'key' });
  s.needFocus = true;
}

function qiGain(s, yrs, f, pill) {
  const r = realm(s);
  let m = s.root === 0 && s.cured ? 0.9 : G.ROOTS[s.root].m;
  m *= f ? f.qi : 0.6;
  if (pill) m *= 1 + 0.45 * pill.power; // Tụ Khí Đan khi khổ tu
  m *= 1 + 0.12 * (s.dwelling || 0);     // động phủ
  m *= 1 + gearSum(s, 'qi');             // bảo vật
  m *= 1 + 0.06 * bLv(s, 'kinh');        // Tàng Kinh Các
  m *= G.GONG_MULT[s.gong];
  m *= 1 + Math.min(0.75, 0.25 * s.fires.length);
  for (const id of s.traits) if (trait(id)?.qi) m *= trait(id).qi;
  if (s.faction) m *= 1.12;
  if (s.master) m *= 1.25;
  if (s.evil) m *= 1.35;
  if (s.tam < 30) m *= 0.6;
  if (s.body < 25) m *= 0.7;
  return (100 / r.yps) * yrs * m * rand(0.8, 1.2);
}

function alchemy(s, e) {
  if (!canAlch(s)) {
    if (R() < 0.5) e.items.push({ t: 'Bạn thử luyện đan, nhưng không có hỏa thuộc tính nên không khống chế nổi ngọn lửa…', k: 'dim' });
    return;
  }
  s.alchXp += 22 * (s.soul / 50) * (s.fires.length ? 1.4 : 1) * (s.master ? 1.4 : 1) * rand(0.7, 1.3);
  const need = 100 * (s.alch + 1);
  const soulReq = 25 + s.alch * 8;
  if (s.alchXp >= need && s.alch < 9) {
    if (s.soul >= soulReq) {
      s.alch++;
      s.alchXp = 0;
      s.fame += Math.ceil(s.alch / 2);
      e.items.push({ t: `Bạn trở thành Luyện dược sư ${s.alch} phẩm!`, k: 'key' });
    } else {
      s.alchXp = need;
      if (R() < 0.3) e.items.push({ t: 'Linh hồn lực chưa đủ để nâng phẩm cấp luyện dược.', k: 'dim' });
    }
  }
}

function yearly(s, e, yrs) {
  const f = focusObj(s);
  if (f) {
    const k = rand(0.7, 1.3);
    applyFx(s, Object.fromEntries(Object.entries(f.fx).map(([a, v]) => [a, v * k])));
    if (f.alch) alchemy(s, e);
    if (f.skill) {
      if (s.skill === 0) { upgradeSkill(s); e.items.push({ t: 'Bạn bắt đầu tu luyện một môn đấu kỹ Hoàng giai.', k: 'good' }); }
      const was = s.mastery;
      s.mastery = Math.min(100, s.mastery + rand(8, 18));
      if (was < 100 && s.mastery >= 100) e.items.push({ t: `Đấu kỹ ${G.GRADES[s.skill]} của bạn đã luyện đến đại thành.`, k: 'good' });
    }
    // Tông môn ghi nhận người làm nhiệm vụ chăm chỉ
    if (f.id === 'nv' && s.faction && !s.evil && R() < 0.2) {
      if (s.gong < 2 && R() < 0.4) { s.gong++; e.items.push({ t: `Nhờ điểm cống hiến, tông môn truyền cho bạn một bộ công pháp ${G.GRADES[s.gong]}.`, k: 'good' }); }
      else { give(s, 'tuk', pillNeed(s), 1); e.items.push({ t: `Bạn dùng điểm cống hiến đổi lấy một viên Tụ Khí Đan ${pillNeed(s)} phẩm.`, k: 'dim' }); }
    }
  }
  s.tam = clamp(s.tam + (50 - s.tam) * 0.04 + rand(-1.5, 1.5));
  s.luck = clamp(s.luck + (s.baseLuck - s.luck) * 0.05);
  if (s.age / lifeOf(s) > 0.85) s.body = clamp(s.body - 1.5);
  else s.body = clamp(s.body + Math.max(0, 50 - s.body) * 0.08);

  marketTick(s, yrs);
  estatesYearly(s, e, yrs);
  sectYearly(s, e, yrs, f);
  smithYearly(s, e, yrs);
  economy(s, e, yrs, f);
  consignTick(s, e);

  if (s.started) {
    const before = realmLabel(s);
    const pill = f?.id === 'tu' ? cultivationPill(s) : null;
    if (pill) s.led.push([`Dùng 1 Tụ Khí Đan ${pill.g} phẩm`, 0]);
    const d = addQi(s, qiGain(s, yrs, f, pill));
    if (d > 0) e.items.push({ t: `Đấu khí tinh tiến, đạt tới ${realmLabel(s)}.`, k: 'up', lv: before });
  }
}

function family(s, e, yrs) {
  const P = s.parents;
  if (P.alive) {
    P.age += yrs;
    const p = clamp(yrs * 0.004 * Math.exp((P.age + s.age - 60) / 9), 0, 1);
    if (R() < p) {
      P.alive = false;
      e.items.push({ t: 'Phụ mẫu lần lượt qua đời. Bạn đứng lặng rất lâu trước mộ phần.', k: 'bad' });
      applyFx(s, { tam: -10 });
      const inh = Math.round(G.INHERIT[s.wealth] * rand(0.7, 1.3));
      earn(s, 'Thừa kế gia sản', inh);
      e.items.push({ t: `Bạn thừa kế ${fmtGold(inh)} kim tệ từ gia sản phụ mẫu để lại.`, k: 'dim' });
    }
  }
  const pt = s.partner;
  if (pt) {
    const pAge = pt.page + (s.age - pt.since);
    const lim = pt.mortal ? 75 : lifeOf(s) * rand(0.9, 1.2);
    if (pAge > lim * 0.8 && R() < yrs * (pt.mortal ? 0.08 : 0.01)) {
      e.items.push({ t: `${pt.name} đã ra đi${pt.mortal ? ' khi tóc đã bạc trắng, còn bạn vẫn trẻ như năm nào' : ''}.`, k: 'bad' });
      applyFx(s, { tam: -18 });
      s.lostPartner = pt.name;
      s.partner = null;
    }
  }
}

function okEv(s, ev) {
  if (ev.a && (s.age < ev.a[0] || s.age > ev.a[1])) return false;
  if (ev.r && (!s.started || s.R < ev.r[0] || Math.min(s.R, 10) > ev.r[1])) return false;
  if (ev.once && s.seen[ev.id]) return false;
  if (s.last[ev.id] != null && s.t - s.last[ev.id] < (ev.cd ?? 6)) return false;
  if (ev.if && !ev.if(s)) return false;
  return true;
}
const evW = (s, ev, f) => (typeof ev.w === 'function' ? ev.w(s) : ev.w ?? 1) * (f?.ev && ev.wild ? 2 : 1);

function setPending(s, ev) {
  if (ev.prep) ev.prep(s);
  s.pending = ev.id;
  s.seen[ev.id] = (s.seen[ev.id] || 0) + 1;
  s.last[ev.id] = s.t;
}

function deathCause(s) {
  if (s.age < 6) return 'Mắc bệnh nặng từ nhỏ, không qua khỏi';
  if (s.age / lifeOf(s) > 0.85) return pick(['Thọ nguyên khô kiệt, lặng lẽ tọa hóa trong động phủ', 'Tuổi già sức yếu, ra đi trong một đêm tuyết rơi']);
  if (s.focus === 'lich') return pick(['Gặp nạn trên đường lịch luyện', 'Vẫn lạc dưới móng vuốt ma thú', 'Bị cướp giết người đoạt bảo']);
  return pick(['Bị kẻ thù ám toán', 'Tẩu hỏa nhập ma khi tu luyện', 'Bệnh nặng không qua khỏi', 'Bị cuốn vào một trận đại chiến giữa các thế lực']);
}

export function tick(s) {
  if (s.dead || s.pending || s.needFocus) return;
  const yrs = s.started ? realm(s).yrs : 1;
  s.age += yrs;
  s.t++;
  s.led = [];
  const e = { a: s.age, items: [] };
  s.log.push(e);

  if (s.age >= lifeOf(s)) {
    die(s, `Thọ nguyên cạn kiệt, tọa hóa ở cảnh giới ${realmLabel(s)}`);
    s.hist.push([s.age, level(s)]);
    return;
  }
  const frac = s.age / lifeOf(s);
  let hz = (s.R >= 6 ? 0.0004 : 0.0008 * Math.min(yrs, 2)) + (s.body < 10 ? 0.03 : 0);
  if (frac > 0.85) hz += 0.04 * (frac - 0.85) / 0.15;
  if (s.age < 5) hz += 0.006;
  hz *= dodgeMult(s);
  if (s.R >= 11) hz = 0; // Đấu Đế không còn chết vì bệnh tật, tai nạn
  if (R() < hz) { die(s, deathCause(s)); s.hist.push([s.age, level(s)]); return; }

  if (!s.started && s.age >= 6) startCult(s, e);
  // Bảng nhiệm vụ: quyết định trước để kinh tế biết lượt này có nhiệm vụ lớn hay không
  if (s.focus === 'nv' && s.age >= 10 && R() < 0.55) setPending(s, EV.mission);
  yearly(s, e, yrs);
  family(s, e, yrs);
  if (s.started && !s.focus) s.needFocus = true;

  // Sự kiện bắt buộc (đột phá được ưu tiên hơn bảng nhiệm vụ)
  if (s.ready && s.pending !== 'breakthrough') setPending(s, EV.breakthrough);
  else if (s.pending) { /* đã có bảng nhiệm vụ */ }
  else if (s.flags.duel && s.age >= s.flags.duel) { delete s.flags.duel; setPending(s, EV.duel); }
  else if (s.started && !s.seen.lifeend && lifeOf(s) - s.age <= yrs * 3 && s.R < 10) setPending(s, EV.lifeend);

  // Khoảnh khắc
  if (R() < 0.38) {
    const list = MOMENTS.filter((m, i) => {
      if (m.a && (s.age < m.a[0] || s.age > m.a[1])) return false;
      if (m.r && (!s.started || s.R < m.r[0] || Math.min(s.R, 10) > m.r[1])) return false;
      if (m.once && s.seen['m' + i]) return false;
      if (s.last['m' + i] != null && s.t - s.last['m' + i] < 5) return false;
      return !m.if || m.if(s);
    });
    const m = list.length ? pick(list) : null;
    if (m) {
      const i = MOMENTS.indexOf(m);
      s.seen['m' + i] = 1;
      s.last['m' + i] = s.t;
      const text = typeof m.t === 'function' ? m.t(s) : m.t;
      applyFx(s, m.fx);
      if (m.do) m.do(s);
      e.items.push({ t: text });
    }
  }

  // Sự kiện ngẫu nhiên
  const f = focusObj(s);
  if (!s.pending && R() < (s.age < 6 ? 0.3 : 0.42 * (f?.ev || 1))) {
    const ev = wpick(EVENTS.filter((x) => !x.force && okEv(s, x)), (x) => evW(s, x, f));
    if (ev) setPending(s, ev);
  }

  if (!e.items.length && !s.pending) e.items.push({ t: pick(FILLERS[s.started ? s.focus || 'tu' : 'baby']), k: 'dim' });
  const ml = moneyLine(s);
  if (ml) e.items.push({ t: ml, k: 'money' });
  s.hist.push([s.age, level(s)]);
}

export const choicesOf = (s) => {
  const ev = EV[s.pending];
  if (!ev) return [];
  const list = typeof ev.ch === 'function' ? ev.ch(s) : ev.ch;
  return list.filter((c) => !c.if || c.if(s));
};

// Gợi ý ảnh hưởng của lựa chọn: [{k, sign}] + cờ may rủi/nguy hiểm
export function hints(ch) {
  const m = {};
  const add = (fx) => fx && Object.entries(fx).forEach(([k, v]) => {
    if (typeof v !== 'number' || !v || !G.ICON[k]) return;
    m[k] = m[k] && Math.sign(m[k]) !== Math.sign(v) ? 2 : Math.sign(v);
  });
  add(ch.fx); add(ch.ok?.fx); add(ch.fail?.fx);
  return {
    list: Object.entries(m).map(([k, v]) => ({ k, icon: G.ICON[k], sign: v })),
    risky: !!ch.roll,
    deadly: !!(ch.die || ch.fail?.die),
  };
}

export function choose(s, ch) {
  const e = lastEntry(s);
  const before = snapshot(s);
  let res = ch;
  let ok = null;
  if (ch.roll) {
    ok = R() < clamp(ch.roll(s) + (hasTrait(s, 'lucky') ? 0.04 : 0), 0.03, 0.97);
    res = ok ? ch.ok : ch.fail;
  }
  s.pending = null;
  if (ch.roll) applyFx(s, ch.fx);
  applyFx(s, res.fx);
  if (res.do) res.do(s);
  const text = typeof res.log === 'function' ? res.log(s) : res.log;
  if (text) e.items.push({ t: text, k: res.k || (ok === false ? 'bad' : ok ? 'good' : '') });
  if (s.post?.length) { e.items.push(...s.post); s.post = []; }
  if (res.die && !s.dead && s.R < 11) {
    const p = (res.dieP == null ? 1 : typeof res.dieP === 'function' ? res.dieP(s) : res.dieP) * (res.dieP == null ? 1 : dodgeMult(s));
    if (R() < p) die(s, res.die);
  }
  s.hist[s.hist.length - 1] = [s.age, level(s)];
  return { text, ok, delta: diff(before, s), dead: s.dead };
}

export function summary(s) {
  const r = realm(s);
  let title;
  const lands = landCount(s);
  if (s.win && (s.land?.daxa || lands >= 24)) title = ['Đế chủ đại lục', `Đấu Đế ngự trị ${lands} vùng đất, từ Ô Thản Thành đến tận Hồn Giới. Vạn cổ không ai sánh bằng.`];
  else if (s.win) title = ['Đấu Đế', 'Vạn cổ nhất nhân. Tên bạn sẽ được khắc vào lịch sử Đấu Khí Đại Lục.'];
  else if (lands >= 10) title = ['Bá chủ đại lục', `${s.sect.name} thống trị ${lands} vùng đất. Nửa đại lục nghe lệnh bạn.`];
  else if (s.sect && lands >= 5) title = ['Khai sơn tổ sư', `${s.sect.name} truyền thừa muôn đời, hậu bối mãi khắc ghi tên bạn.`];
  else if (s.R >= 10) title = ['Thánh giả một phương', 'Một ánh mắt có thể khiến cả đế quốc run rẩy.'];
  else if (s.R >= 8) title = ['Tôn giả Trung Châu', 'Đứng trên đỉnh cao mà vô số người chỉ dám ngước nhìn.'];
  else if (s.alch >= 6) title = ['Đại tông sư luyện dược', 'Một viên đan của bạn khiến các thế lực tranh giành đổ máu.'];
  else if (s.R >= 7 || s.sect) title = ['Tông chủ một phương', 'Lời bạn nói có thể quyết định vận mệnh của cả một tông môn.'];
  else if (s.R >= 5) title = ['Cường giả trấn quốc', 'Ở đế quốc nhỏ này, bạn đã là truyền thuyết.'];
  else if (s.R >= 3) title = ['Cao thủ một vùng', 'Đủ để được kính nể, chưa đủ để được nhớ mãi.'];
  else if (s.age < 6) title = ['Ngọn nến nhỏ', 'Một kiếp người quá ngắn ngủi.'];
  else title = ['Phàm nhân giữa hồng trần', 'Không phải ai cũng sinh ra để làm cường giả. Nhưng bạn đã sống.'];
  if (s.evil) title = ['Ma đầu ' + title[0].toLowerCase(), 'Bạn đã chọn con đường hắc ám. Đại lục nhắc tới bạn bằng giọng run sợ.'];

  const highlights = s.log.flatMap((e) => e.items.filter((i) => i.k === 'key' || i.k === 'death').map((i) => ({ a: e.a, t: i.t }))).slice(-10);
  return {
    title, realm: s.started ? realmLabel(s) : 'Chưa từng tu luyện', realmName: s.started ? r.n : '—',
    age: s.age, cause: s.cause, highlights,
    facts: [
      ['Tư chất', G.ROOTS[s.root].n + (s.special ? ` · ${s.special}` : '')],
      ['Thuộc tính', s.attrs.join(' · ')],
      ['Công pháp', G.GRADES[s.gong]],
      ['Đấu kỹ', G.GRADES[s.skill]],
      ['Dị hỏa', s.fires.length ? s.fires.join(', ') : 'Không'],
      ['Luyện dược', s.alch ? `${s.alch} phẩm` : 'Không'],
      ['Thế lực', s.faction || 'Tán tu'],
      ['Tông môn', s.sect ? `${s.sect.name} · ${sectTier(s)} · ${s.sect.members} đệ tử` : 'Không'],
      ['Lãnh địa', lands ? `${lands} vùng` : 'Không'],
      ['Quân đội', troopCount(s) ? `${troopCount(s)} binh sĩ · huấn luyện ${s.army.train}` : 'Không'],
      ['Lò rèn', smithLv(s) ? `Cấp ${smithLv(s)} · chế tạo ${s.stats?.crafted || 0} món` : 'Không'],
      ['Trang bị', Object.values(s.gear || {}).filter(Boolean).map(gearName).join(', ') || 'Không'],
      ['Đạo lữ', s.partner?.name || s.lostPartner || 'Không'],
      ['Đệ tử', s.disciples || 'Không'],
      ['Danh vọng', Math.round(s.fame)],
      ['Tài sản', `${fmtGold(netWorth(s))} kim tệ`],
      ['Động phủ', G.DWELLING[s.dwelling || 0][1] || 'Không'],
    ],
  };
}

export const netWorth = (s) =>
  s.gold + Object.entries(s.inv).reduce((a, [k, n]) => a + sellPrice(...parseKey(k)) * n, 0) + (G.DWELLING[s.dwelling || 0][0] || 0) * 0.7
    + estateValue(s) + [...Object.values(s.gear || {}), ...(s.armory || [])].reduce((a, it) => a + (it ? gearSell(it) : 0), 0)
    + (s.arms || 0) * armCost(s);

// ───── Lưu trữ ─────
const SAVE = 'dpnk_save';
const BOOK = 'dpnk_book';
export function save(s) { try { localStorage.setItem(SAVE, JSON.stringify(s)); } catch {} }
// Nâng cấp bản lưu từ phiên bản cũ
export function migrate(v) {
  if (!v.inv) { v.inv = v.pills ? { [`pha:${G.PILL_NEED[v.R]}`]: v.pills } : {}; delete v.pills; }
  v.led ||= []; v.auto ||= { sell: true, buy: true }; v.salary ||= 0; v.dwelling ||= 0; v.post ||= [];
  v.gear ||= {}; for (const k of G.GEAR_SLOTS) v.gear[k] ??= null;
  v.armory ||= []; v.estates ||= {}; v.sect ||= null; v.land ||= {}; v.war ||= {};
  if (v.land.thanhthanh) { delete v.land.thanhthanh; v.land.thanhdan ||= { at: v.age, dev: 0 }; } // vùng cũ đã đổi tên
  for (const id of Object.keys(v.land)) if (!G.REGIONS.some((r) => r.id === id)) delete v.land[id];
  v.mkt ||= {}; v.cons ||= []; v.exNew ||= 0; v.smithy ||= { lv: 0, prod: true }; v.arms ||= 0; v.orders ||= [];
  v.army ||= { n: {}, armed: 0, train: 0 }; v.stats ||= {};
  if (v.sect) for (const b of G.BUILDS) v.sect.b[b.id] ??= 0;
  if (v.focus === 'mon') v.focus = 'nv';
  return v;
}
export function load() {
  try {
    const v = JSON.parse(localStorage.getItem(SAVE));
    return v && !v.dead ? migrate(v) : null;
  } catch { return null; }
}
export function writeBook(book) { try { localStorage.setItem(BOOK, JSON.stringify(book.slice(0, 50))); } catch {} }
export function clearSave() { try { localStorage.removeItem(SAVE); } catch {} }
export function readBook() { try { return JSON.parse(localStorage.getItem(BOOK)) || []; } catch { return []; } }
export function addToBook(s) {
  const sm = summary(s);
  const book = readBook();
  if (book.some((b) => b.id === s.id)) return;
  book.unshift({ id: s.id, name: s.name, realm: sm.realm, R: s.R, age: s.age, title: sm.title[0], cause: s.cause, win: s.win, heir: !!(s.win && s.flags.heir), hist: s.hist });
  try { localStorage.setItem(BOOK, JSON.stringify(book.slice(0, 50))); } catch {}
}

// ───── Trưởng lão và lão sư: nhân vật riêng có cảnh giới, trang bị, tự tu luyện và tự rèn ─────
// s.sect.elders vẫn là số đếm (nhiều chỗ dùng); s.sect.roster giữ chi tiết từng người, luôn đồng bộ với số đếm.
// Không quá tay: cảnh giới luôn thấp hơn tông chủ, cường hóa có trần, không bao giờ tự lên Chí Tôn.
import G from './data.js';
import { R, rand, pick, clamp, genName, gearStat, gearName, gearScore, qualityIdx, tierFor, spend, fmtGold, unit } from './util.js';
import { genGear } from './gear.js';
import { troopCount } from './army.js';

const OUTFIT_M = ['vai', 'thanh', 'hac', 'dan', 'chien', 'ma'];
const OUTFIT_F = ['thanh', 'tuyet', 'dan', 'hac', 'ma'];
const TITLES = ['Truyền Công', 'Chấp Pháp', 'Luyện Đan', 'Tàng Kinh', 'Hộ Pháp', 'Ngoại Vụ', 'Luyện Khí', 'Thủ Sơn'];
// Trang bị trưởng lão: luck cố định, không nhận buff của tông chủ
const NPC = { luck: 42 };

export const ELDER_EN_MAX = 9;
// Trần cường hóa theo cảnh giới: Đấu Linh +6, Đấu Tông trở lên +9; tông chủ bồi dưỡng (kim tệ vượt trần) nâng thêm e.boost
export const enCap = (e) => Math.min(ELDER_EN_MAX, 2 + e.R) + (e.boost || 0);
// Trưởng lão không bao giờ vượt tông chủ, và không ai tới được Bán Thánh
export const realmCap = (s) => clamp(s.R - 1, 3, 8);
export const mentorCap = (s) => clamp(s.R + 1, 6, 9);

const newId = () => Date.now().toString(36) + Math.floor(R() * 1e6).toString(36);
const elderTier = (e) => tierFor({ R: e.R });

function starterGear(e) {
  const gear = {};
  const slots = e.R >= 7 ? ['wep', 'arm', 'acc'] : e.R >= 5 ? ['wep', 'arm'] : ['wep'];
  for (const sl of slots) {
    const it = genGear(NPC, { sl, tier: Math.max(1, elderTier(e) - (R() < 0.5 ? 1 : 0)) });
    it.en = Math.floor(R() * Math.min(4, enCap(e)));
    gear[sl] = it;
  }
  return gear;
}

export function genElder(s, o = {}) {
  const g = o.g || (R() < 0.7 ? 'm' : 'f');
  const e = {
    id: newId(), g, n: o.n || genName(g), R: clamp(o.R ?? Math.max(3, s.R - 1), 1, realmCap(s)),
    title: o.title || pick(TITLES), look: pick(g === 'f' ? OUTFIT_F : OUTFIT_M),
    loy: Math.round(o.loy ?? rand(50, 70)), at: s.t || 0, gear: {},
  };
  e.gear = o.gear || starterGear(e);
  return e;
}

// Đồng bộ danh sách với số đếm (bản lưu cũ chỉ có số đếm, hoặc chỗ khác tăng giảm số đếm)
export function ensureElders(s) {
  const S = s.sect;
  if (!S) return [];
  S.roster ||= [];
  while (S.roster.length < S.elders) S.roster.push(genElder(s));
  if (S.roster.length > S.elders) S.roster.sort((a, b) => b.loy - a.loy).length = Math.max(0, S.elders);
  return S.roster;
}
export function addElder(s, o) {
  ensureElders(s);
  const e = genElder(s, o);
  s.sect.roster.push(e);
  s.sect.elders = s.sect.roster.length;
  return e;
}
// pickFn chọn người rời đi; mặc định người kém trung thành nhất
export function removeElder(s, pickFn) {
  const list = ensureElders(s);
  if (!list.length) return null;
  const e = pickFn ? pickFn(list) : [...list].sort((a, b) => a.loy - b.loy)[0];
  s.sect.roster = list.filter((x) => x !== e);
  s.sect.elders = s.sect.roster.length;
  return e;
}
export const leastLoyal = (s) => [...ensureElders(s)].sort((a, b) => a.loy - b.loy)[0] || null;

// Chiến lực một trưởng lão (cùng thang với chiến lực bản thân)
export const elderCp = (e) => e.R * 10 + 5 + Object.values(e.gear || {}).reduce((a, it) => a + (it ? gearStat(it).cp : 0), 0);
// Đóng góp vào thực lực tông môn: khoảng 1,5 lúc mới về, 4–5 khi đã lên Đấu Tôn đồ tốt
export const elderPower = (e) => elderCp(e) * 0.033;
export const eldersPower = (s) => (s.sect ? ensureElders(s).reduce((a, e) => a + elderPower(e), 0) : 0) + (s.mentor && s.sect ? elderPower(s.mentor) * 1.5 : 0);

// Tự rèn: ô trống hoặc đồ kém bậc thì rèn món mới (giữ món tốt hơn), không thì đập cường hóa
function selfForge(e, out) {
  const sl = pick(G.GEAR_SLOTS);
  const old = e.gear[sl];
  const tier = elderTier(e);
  if (!old || old.tier < tier || R() < 0.15) {
    const it = genGear(NPC, { sl, tier });
    if (qualityIdx(it) > 4) it.q = G.QUALITY[4][0];
    if (!old || gearScore(it) > gearScore(old)) {
      e.gear[sl] = it;
      if (qualityIdx(it) >= 3) out.push({ t: `${e.title} trưởng lão ${e.n} tự rèn được ${gearName(it)}.`, k: 'good' });
    }
    return;
  }
  const en = old.en || 0;
  if (en >= enCap(e)) return;
  if (R() < (G.ENHANCE_P[en] ?? 0.25)) {
    old.en = en + 1;
    if (old.en >= 7) out.push({ t: `${e.title} trưởng lão ${e.n} cường hóa ${gearName(old)}.` });
  }
}
function grow(s, e, yrs, cap, out, who) {
  if (e.R < cap && R() < 0.07 * yrs) {
    e.R++;
    out.push({ t: `${who} đột phá ${G.REALMS[e.R].n}!`, k: 'good' });
  }
  for (let i = 0; i < Math.round(yrs * 2); i++) if (R() < 0.45) selfForge(e, out);
}

export function eldersYearly(s, e, yrs) {
  const out = [];
  if (s.sect) {
    for (const el of ensureElders(s)) {
      grow(s, el, yrs, realmCap(s), out, `${el.title} trưởng lão ${el.n}`);
      // Lòng trung thành: tông môn đủ ăn thì dần về mức 75, ngân khố cạn thì giảm
      el.loy = clamp(s.sect.broke ? el.loy - 4 * yrs : el.loy + (75 - el.loy) * clamp(0.05 * yrs, 0, 1), 0, 100);
    }
  }
  if (s.mentor) grow(s, s.mentor, yrs, mentorCap(s), out, `Lão sư ${s.mentor.n}`);
  // Không dội nhật ký: tối đa 3 dòng mỗi lượt
  e.items.push(...out.slice(0, 3));
}

// Món được ban thừa hưởng cấp cường hóa của món cũ cùng ô (luyện lại vào phôi mới), không vượt trần của người nhận
const giftEn = (e, it) => Math.min(enCap(e), Math.max(it.en || 0, e.gear[it.sl]?.en || 0));

// ───── Tông chủ ban thưởng: đưa đồ trong túi cho trưởng lão ─────
// Đồ cũ của trưởng lão chuyển cho đệ tử (không trả về túi), để không thể lấy đồ trưởng lão tự rèn.
// Món có thể nằm trong túi hoặc trong kho tông môn
export function giftGear(s, elderId, itemId) {
  const el = elderId === 'mentor' ? s.mentor : ensureElders(s).find((x) => x.id === elderId);
  const vault = s.sect?.vault?.gear || [];
  const it = s.armory.find((x) => x.id === itemId) || vault.find((x) => x.id === itemId);
  if (!el || !it) return null;
  if (it.lock) return 'Món này đang khóa.';
  s.armory = s.armory.filter((x) => x !== it);
  if (s.sect?.vault) s.sect.vault.gear = vault.filter((x) => x !== it);
  const old = el.gear[it.sl];
  el.gear[it.sl] = { ...it, en: giftEn(el, it) };
  const up = 6 + qualityIdx(it) * 4;
  el.loy = clamp((el.loy || 60) + up, 0, 100);
  const who = elderId === 'mentor' ? `Lão sư ${el.n}` : `${el.title} trưởng lão ${el.n}`;
  const capped = (it.en || 0) > enCap(el) ? ` (cảnh giới chưa đủ, chỉ phát huy tới +${enCap(el)})` : '';
  const kept = old?.en && old.en > (it.en || 0) ? `, luyện lại giữ nguyên +${el.gear[it.sl].en}` : '';
  return `${who} nhận ${gearName(it)}${kept}${capped}${old ? `, món cũ ${old.n} truyền lại cho đệ tử` : ''}. Trung thành +${up}.`;
}

export function dismissElder(s, elderId) {
  const e = removeElder(s, (list) => list.find((x) => x.id === elderId));
  return e ? `${e.title} trưởng lão ${e.n} rời khỏi ${s.sect.name}.` : null;
}

// ───── Lão sư tái tạo nhục thân: thành nhân vật có trang bị ─────
export function rebornMentor(s) {
  s.mentor = { id: 'mentor', n: s.master || 'Lão giả trong nhẫn', g: 'm', R: mentorCap(s), title: 'Lão sư', look: 'dan', loy: 100, at: s.t, gear: {} };
  s.mentor.gear = starterGear(s.mentor);
  return s.mentor;
}

// ───── Trưởng lão xin đồ trong kho ─────
// Chỉ xin món tông chủ không cần: không khóa, và không tốt hơn đồ tông chủ đang mặc cùng ô.
// Chọn cặp (người, món) nâng được nhiều nhất; không có thì thôi không hỏi.
export const whoOf = (e) => (e.id === 'mentor' ? `Lão sư ${e.n}` : `${e.title} trưởng lão ${e.n}`);
export function askTarget(s) {
  const people = [...(s.sect ? ensureElders(s) : []), ...(s.mentor ? [s.mentor] : [])];
  if (!people.length) return null;
  const pool = [...s.armory, ...(s.sect?.vault?.gear || [])]
    .filter((it) => !it.lock && s.gear[it.sl] && gearScore(it) <= gearScore(s.gear[it.sl]));
  let best = null;
  for (const e of people) {
    for (const it of pool) {
      const old = e.gear[it.sl];
      const gain = gearScore({ ...it, en: giftEn(e, it) }) - (old ? gearScore(old) : 0);
      if (gain > 0 && (!best || gain > best.gain)) best = { gain, eid: e.id, iid: it.id, who: whoOf(e), item: gearName(it), old: old ? gearName(old) : null, sl: it.sl, vault: !s.armory.includes(it) };
    }
  }
  return best;
}

// ───── Kim tệ vượt trần: ban phát cho trưởng lão, lão sư và đệ tử ─────
// Trưởng lão / lão sư: ô trống hay kém bậc thì được rèn món Huyền bảo trở lên, mọi món đập tới trần cường hóa.
// Quân đội (đệ tử ra trận): đủ binh khí, huấn luyện thêm. Phần tiền vượt coi như đã tiêu hết.
// Ô trống hay đồ kém bậc: rèn phôi mới bậc hiện tại, luyện lại giữ cấp cường hóa của món cũ.
// Trung thành chỉ nhích nhẹ: năm nào cũng ban phát thì ai cũng 100, hết phân biệt trung gian.
function endow(e) {
  let n = 0;
  const tier = elderTier(e);
  for (const sl of G.GEAR_SLOTS) {
    const old = e.gear[sl];
    if (old && old.tier >= tier) continue;
    const it = genGear(NPC, { sl, tier });
    it.q = G.QUALITY[clamp(qualityIdx(it), 3, 4)][0];
    it.en = Math.max(old?.en || 0, Math.min(ELDER_EN_MAX, 2 + e.R));
    e.gear[sl] = it;
    n++;
  }
  e.loy = clamp(e.loy + 2, 0, 100);
  return n;
}
// Bồi dưỡng: tiền thừa đổ vào cường hóa đồ của trưởng lão, luôn đập món rẻ nhất trước.
// Giá mỗi cấp như nhau với mọi bậc đồ (để bậc cao không bị thiệt), vượt trần thì nâng trần của người đó.
const fundCost = (it) => G.GEAR_PRICE[4] * 0.12 * Math.pow(1 + (it.en || 0), 1.6) * (1 + 0.5 * Math.floor((it.en || 0) / G.ENHANCE_MAX));
// Mỗi người có tư chất riêng (e.tal, cố định suốt đời) và mỗi lần một chút may rủi: người được chia nhiều, người ít
function fundGear(people, budget) {
  for (const p of people) p.tal ||= rand(0.5, 1.5);
  const w = people.map((p) => p.tal * rand(0.7, 1.3));
  const W = w.reduce((a, b) => a + b, 0);
  return people.reduce((a, p, i) => a + fundOne(p, (budget * w[i]) / W), 0);
}
function fundOne(p, budget) {
  // k: độ "hợp tay" từng món (lưu trên món, it.fk), để mỗi người có món được đập sâu hơn món khác
  const slots = Object.values(p.gear).filter(Boolean).map((it) => { const k = (it.fk ||= rand(0.7, 1.4)); return { p, it, k, c: fundCost(it) * k }; });
  let lv = 0;
  while (slots.length && lv < 5000) {
    const x = slots.reduce((a, b) => (b.c < a.c ? b : a));
    const pay = x.c / x.k;
    if (pay > budget) break;
    budget -= pay;
    x.it.en = (x.it.en || 0) + 1;
    x.p.boost = Math.max(x.p.boost || 0, x.it.en - Math.min(ELDER_EN_MAX, 2 + x.p.R));
    x.c = fundCost(x.it) * x.k;
    lv++;
  }
  return lv;
}
export function goldOverflow(s, e) {
  const over = Math.round(s.gold - G.GOLD_MAX);
  if (over <= 0) return;
  spend(s, 'Ban phát cho môn hạ', over);
  const people = [...(s.sect ? ensureElders(s) : []), ...(s.mentor ? [s.mentor] : [])];
  const pieces = people.reduce((a, p) => a + endow(p), 0);
  const lv = fundGear(people, over);
  const troops = s.army ? troopCount(s) : 0;
  if (troops) { s.army.armed = troops; s.army.train = Math.min(G.TRAIN_MAX, s.army.train + 2); }
  if (!people.length && !troops) s.fame += 1;
  // Không dội nhật ký: mỗi 10 lượt mới kể một lần, các lượt khác chỉ ghi vào sổ thu chi
  if (s.last.goldmax != null && s.t - s.last.goldmax < 10) return;
  s.last.goldmax = s.t;
  const nEl = people.length - (s.mentor ? 1 : 0);
  const heads = [nEl && `${nEl} vị trưởng lão`, s.mentor && `lão sư ${s.mentor.n}`].filter(Boolean).join(' và ');
  const done = [pieces && `${pieces} món rèn mới`, lv && `cường hóa thêm ${lv} cấp`].filter(Boolean).join(', ');
  const to = [people.length && `${heads}${done ? ` (${done})` : ''}`, troops && `${troops} đệ tử trong quân được phát binh khí, huấn luyện thêm`].filter(Boolean);
  e.items.push({
    t: to.length
      ? `Kim tệ chất cao như núi, vượt quá ${fmtGold(G.GOLD_MAX)}. Bạn đem ${fmtGold(over)} ban phát cho môn hạ: ${to.join('; ')}.`
      : `Kim tệ chất cao như núi, vượt quá ${fmtGold(G.GOLD_MAX)}. Bạn đem ${fmtGold(over)} tán cho bách tính, danh vọng lan xa.`,
    k: 'key',
  });
}

// ───── Chiêu mộ trưởng lão: Chiêu Hiền Bảng ─────
// Ghế trưởng lão: 3, mỗi cấp Chiêu Hiền Điện thêm một ghế, tối đa 12
export const elderMax = (s) => (s.sect ? 3 + Math.min(9, s.sect.b?.hien || 0) : 0);
export const elderRoom = (s) => (s.sect ? elderMax(s) - ensureElders(s).length : 0);
// Treo bảng tốn tiền, ra 3 ứng viên (một người mạnh, hai người vừa); 5 năm mới treo lại được
export const HIRE_CD = 5;
export const hireCost = (s) => Math.round(unit(s) * 2);
export const hireWait = (s) => (s.sect?.hire ? Math.max(0, HIRE_CD - (s.t - s.sect.hire.at)) : 0);
const STORY = [
  'tán tu ẩn cư nhiều năm trong Ma Thú Sơn Mạch', 'cựu trưởng lão của một tông môn đã tàn lụi', 'khách khanh rời bỏ gia tộc vì bất hòa',
  'luyện khí sư lang bạt khắp Trung Châu', 'truyền nhân duy nhất của một cổ phái thất truyền', 'kiếm khách từng có tên trên Thiên Bảng',
  'lão binh sống sót qua trận đại chiến với Hồn Điện', 'dược sư bị đuổi khỏi Đan Tháp vì dám cãi trưởng lão',
];
export function postHire(s) {
  if (!s.sect) return null;
  if (hireWait(s)) return `Còn ${hireWait(s)} năm nữa mới treo bảng lại được.`;
  if (!spend(s, 'Treo Chiêu Hiền Bảng', hireCost(s))) return 'Không đủ kim tệ.';
  const top = realmCap(s);
  const stories = [...STORY].sort(() => R() - 0.5);
  // Người mạnh nhất kiêu ngạo: phí cao, trung thành lúc đầu thấp
  const list = [[0, 3, 45], [1, 1.5, 60], [2, 0.8, 70]].map(([d, k, loy], i) => {
    const e = genElder(s, { R: Math.max(1, top - d), loy: loy + rand(-5, 10) });
    return { e, story: stories[i], fee: Math.round(unit(s) * k * rand(1, 1.5)) };
  });
  s.sect.hire = { at: s.t, list };
  return `Chiêu Hiền Bảng treo trước sơn môn. ${list.length} vị cao nhân tìm đến ứng tuyển.`;
}
export function hireElder(s, idx) {
  const h = s.sect?.hire;
  const c = h?.list[idx];
  if (!c) return null;
  if (elderRoom(s) <= 0) return 'Đã hết ghế trưởng lão. Nâng Chiêu Hiền Điện để thêm ghế.';
  if (!spend(s, 'Lễ nhập môn trưởng lão', c.fee)) return 'Không đủ kim tệ.';
  ensureElders(s).push({ ...c.e, at: s.t });
  s.sect.elders = s.sect.roster.length;
  h.list = h.list.filter((x) => x !== c);
  return `${whoOf(c.e)} nhận lễ bái, chính thức nhập ${s.sect.name}.`;
}

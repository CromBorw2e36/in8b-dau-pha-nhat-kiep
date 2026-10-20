// ───── Trưởng lão và lão sư: nhân vật riêng có cảnh giới, trang bị, tự tu luyện và tự rèn ─────
// s.sect.elders vẫn là số đếm (nhiều chỗ dùng); s.sect.roster giữ chi tiết từng người, luôn đồng bộ với số đếm.
// Không quá tay: cảnh giới luôn thấp hơn tông chủ, cường hóa có trần, không bao giờ tự lên Chí Tôn.
import G from './data.js';
import { R, rand, pick, clamp, genName, gearStat, gearName, gearScore, qualityIdx, tierFor } from './util.js';
import { genGear } from './gear.js';

const OUTFIT_M = ['vai', 'thanh', 'hac', 'dan', 'chien', 'ma'];
const OUTFIT_F = ['thanh', 'tuyet', 'dan', 'hac', 'ma'];
const TITLES = ['Truyền Công', 'Chấp Pháp', 'Luyện Đan', 'Tàng Kinh', 'Hộ Pháp', 'Ngoại Vụ', 'Luyện Khí', 'Thủ Sơn'];
// Trang bị trưởng lão: luck cố định, không nhận buff của tông chủ
const NPC = { luck: 42 };

export const ELDER_EN_MAX = 9;
// Trần cường hóa theo cảnh giới: Đấu Linh +6, Đấu Tông trở lên +9
export const enCap = (e) => Math.min(ELDER_EN_MAX, 2 + e.R);
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

// ───── Tông chủ ban thưởng: đưa đồ trong túi cho trưởng lão ─────
// Đồ cũ của trưởng lão chuyển cho đệ tử (không trả về túi), để không thể lấy đồ trưởng lão tự rèn.
export function giftGear(s, elderId, itemId) {
  const el = elderId === 'mentor' ? s.mentor : ensureElders(s).find((x) => x.id === elderId);
  const it = s.armory.find((x) => x.id === itemId);
  if (!el || !it) return null;
  if (it.lock) return 'Món này đang khóa.';
  s.armory = s.armory.filter((x) => x !== it);
  const old = el.gear[it.sl];
  el.gear[it.sl] = { ...it, en: Math.min(it.en || 0, enCap(el)) };
  const up = 6 + qualityIdx(it) * 4;
  el.loy = clamp((el.loy || 60) + up, 0, 100);
  const who = elderId === 'mentor' ? `Lão sư ${el.n}` : `${el.title} trưởng lão ${el.n}`;
  const capped = (it.en || 0) > enCap(el) ? ` (cảnh giới chưa đủ, chỉ phát huy tới +${enCap(el)})` : '';
  return `${who} nhận ${gearName(it)}${capped}${old ? `, món cũ ${old.n} truyền lại cho đệ tử` : ''}. Trung thành +${up}.`;
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

import G from './data.js';
import { R, rand, pick, clamp, cp, unit, earn, spend, lose, give, applyFx, pillNeed, beastGrade, fmtGold, lastEntry, effLv, levelPlan, tierFor } from './util.js';
import { armyPower, armyLoss, armyYearly } from './army.js';

// ───── Tông môn ─────
export const genSectName = () => pick(G.SECT_NAME.a) + ' ' + pick(G.SECT_NAME.b) + ' ' + pick(G.SECT_NAME.c);
export const bLv = (s, id) => s.sect?.b[id] || 0;
export const bEff = (s, id) => effLv(bLv(s, id));
// Cấp 1–6 giá gấp 2,2 mỗi cấp, từ cấp 7 chỉ gấp 1,08 để còn với tới cấp 100
export const buildCost = (b, lv) => Math.round(b.base * Math.pow(2.2, Math.min(lv, 6)) * Math.pow(1.08, Math.max(0, lv - 6)));
export const buildPlan = (s, id, want) => {
  const b = G.BUILDS.find((x) => x.id === id);
  return levelPlan((l) => buildCost(b, l), bLv(s, id), G.BUILD_MAX, s.gold, want);
};
export const landIds = (s) => Object.keys(s.land || {});
export const landCount = (s) => landIds(s).length;
export const region = (id) => G.REGIONS.find((r) => r.id === id);

export function sectReqs(s) {
  const q = G.SECT_REQ;
  return [
    [`Cảnh giới ${G.REALMS[q.R].n} trở lên`, s.R >= q.R],
    [`Danh vọng ${q.fame} trở lên (hiện ${Math.round(s.fame)})`, s.fame >= q.fame],
    [`${fmtGold(q.gold)} kim tệ để dựng sơn môn`, s.gold >= q.gold],
    ['Không thuộc Hồn Điện', !s.evil],
  ];
}
export const canFound = (s) => !s.sect && sectReqs(s).every((r) => r[1]);

export function foundSect(s, name) {
  if (!canFound(s)) return null;
  name = (name || '').trim().slice(0, 28) || genSectName();
  spend(s, 'Khai tông lập phái', G.SECT_REQ.gold);
  const left = s.faction && s.faction !== name ? s.faction : null;
  s.sect = { name, at: s.age, members: 8 + s.disciples * 3, elders: 0, b: Object.fromEntries(G.BUILDS.map((b) => [b.id, 0])) };
  s.faction = name;
  s.fame += 3;
  const msg = `Bạn khai tông lập phái, dựng nên ${name}${left ? `, rời khỏi ${left}` : ''}. Tám phương chấn động!`;
  lastEntry(s).items.push({ t: msg, k: 'key' });
  return msg;
}

export const memberCap = (s) => !s.sect ? 0 : Math.round(30 + bEff(s, 'hien') * 40 + landCount(s) * 10 + s.fame);

// Thực lực tông môn (cộng vào chiến lực khi chinh phạt / thủ thành)
export function sectPower(s) {
  if (!s.sect) return 0;
  const S = s.sect;
  return Math.sqrt(S.members) * (bLv(s, 'kinh') >= 3 ? 1 : 0.8) + S.elders * 2 + bEff(s, 'vo') * 2.5 + landCount(s) * 0.4 + Math.min(5, s.disciples);
}
// Càng bành trướng, các thế lực còn lại càng liên kết chống lại bạn
export const regionDef = (s, r) => Math.round(r.def * (1 + 0.03 * landCount(s)));
export const warPower = (s) => cp(s) + sectPower(s) + armyPower(s);
export const conquerP = (s, def, bonus = 0) => clamp(1 / (1 + Math.exp(-(warPower(s) - def) / 8)) + bonus, 0.04, 0.95);

export function sectTier(s) {
  if (!s.sect) return '';
  const blds = Object.values(s.sect.b).reduce((a, v) => a + v, 0);
  const score = s.sect.members + landCount(s) * 40 + blds * 8 + s.sect.elders * 15;
  const i = score >= 2600 ? 6 : score >= 900 ? 5 : score >= 550 ? 4 : score >= 320 ? 3 : score >= 170 ? 2 : score >= 70 ? 1 : 0;
  return G.SECT_TIERS[i];
}

export function upgradeBuild(s, id, want = 1) {
  const b = G.BUILDS.find((x) => x.id === id);
  const lv = bLv(s, id);
  if (!s.sect || lv >= G.BUILD_MAX) return null;
  const { n, tot } = buildPlan(s, id, want);
  if (!n) return 'Không đủ tiền.';
  spend(s, `Xây ${b.n}`, tot);
  s.sect.b[id] = lv + n;
  if (id === 'tran') s.sect.members += 2 * n;
  return `${b.n} đã lên cấp ${lv + n}.`;
}

// ───── Lãnh địa ─────
export const devLv = (s, id) => s.land[id]?.dev || 0;
export const devCost = (r, lv) => Math.round(r.inc * 0.5 * Math.pow(1.06, lv));
export const devPlan = (s, id, want) => levelPlan((l) => devCost(region(id), l), devLv(s, id), G.DEV_MAX, s.gold, want);
export function develop(s, id, want = 1) {
  if (!s.land[id]) return null;
  const { n, tot } = devPlan(s, id, want);
  if (!n) return devLv(s, id) >= G.DEV_MAX ? null : 'Không đủ tiền.';
  spend(s, `Khai phát ${region(id).n}`, tot);
  s.land[id].dev = devLv(s, id) + n;
  return `${region(id).n} khai phát lên cấp ${s.land[id].dev}.`;
}
// Mỗi cấp khai phát +8% thu nhập vùng đó
export const regionInc = (s, id) => (region(id)?.inc || 0) * (1 + 0.08 * devLv(s, id));
export const landIncome = (s) => landIds(s).reduce((a, id) => a + regionInc(s, id), 0);

const ADJ = {};
for (const [a, b] of G.ROADS) { (ADJ[a] ||= []).push(b); (ADJ[b] ||= []).push(a); }
export const neighbors = (id) => ADJ[id] || [];
export const zoneOpen = (s, r) => s.R >= (G.ZONES[r.z].minR || 0);
// Đánh được khi giáp lãnh địa của mình; chưa có đất thì bắt đầu ở khu vực khởi đầu
export function reachable(s, r) {
  if (s.land[r.id]) return false;
  if (!landCount(s)) return !!G.ZONES[r.z].start;
  return neighbors(r.id).some((id) => s.land[id]);
}
export function attackBlock(s, r) {
  if (!s.sect) return 'Cần có tông môn';
  if (!zoneOpen(s, r)) return `Cần cảnh giới ${G.REALMS[G.ZONES[r.z].minR].n}`;
  if (!reachable(s, r)) return landCount(s) ? 'Không giáp lãnh địa của ta' : 'Hãy bắt đầu từ Gia Mã hoặc Tây Bắc';
  if (!warReady(s, r.id)) return 'Quân đang nghỉ';
  return null;
}

// Thu chi tông môn & lãnh địa mỗi lượt
export function sectYearly(s, e, yrs, f) {
  if (!s.sect) return;
  const S = s.sect;
  const lead = f?.id === 'tong';
  // Đệ tử tìm đến theo danh vọng
  const cap = memberCap(s);
  const grow = (cap - S.members) * clamp(0.12 * yrs * (lead ? 2 : 1), 0, 0.8) * rand(0.6, 1.2);
  S.members = Math.max(0, Math.round(S.members + grow));

  const u = unit(s);
  earn(s, 'Đệ tử cống nạp', S.members * u * 0.003 * yrs * (lead ? 1.6 : 1));
  const inc = landIncome(s);
  if (inc) earn(s, 'Thuế lãnh địa', inc * yrs * rand(0.85, 1.15) * (lead ? 1.2 : 1));
  for (const id of landIds(s)) {
    const r = region(id);
    if (!r?.item || R() >= 0.5) continue;
    const g = r.item === 'ore' ? G.ORE_FOR_TIER[tierFor(s)] : beastGrade(s);
    give(s, r.item, g, 1 + Math.floor(R() * 2) + Math.floor(devLv(s, id) / 20));
  }

  // Chi phí: bổng lộc trưởng lão + duy trì công trình
  const builds = Object.values(S.b).reduce((a, v) => a + effLv(v), 0);
  const cost = (builds * u * 0.06 + S.elders * u * 0.25 + S.members * G.LIVING[Math.min(s.R, 6)] * 0.02) * yrs;
  if (!spend(s, 'Chi phí tông môn', cost)) {
    lose(s, 'Chi phí tông môn', s.gold);
    const gone = Math.ceil(S.members * 0.15);
    S.members -= gone;
    applyFx(s, { tam: -3, fame: -1 });
    e.items.push({ t: `Ngân khố cạn kiệt, ${gone} đệ tử bỏ ${S.name} mà đi.`, k: 'bad' });
  }

  // Đan Phòng
  const dan = Math.round(bEff(s, 'dan'));
  if (dan) {
    give(s, 'tuk', pillNeed(s), dan);
    if (R() < 0.5) give(s, 'lieu', pillNeed(s), Math.ceil(dan / 2));
  }
  armyYearly(s, e, yrs);
}

// ───── Chinh phạt ─────
export const warReady = (s, id) => s.t - (s.war?.[id] ?? -99) >= 2;
export function startConquest(s, id) {
  const r = region(id);
  if (!r || s.pending || s.dead || attackBlock(s, r)) return false;
  s.war ||= {};
  s.war[id] = s.t;
  s.tmp = id;
  s.pending = 'conquer';
  return true;
}

export function takeLand(s, id) {
  const r = region(id);
  s.land[id] = { at: s.age, dev: 0 };
  s.fame += Math.max(1, Math.round(r.def / 25));
  s.sect.members += 10;
  earn(s, `Chiến lợi phẩm ${r.n}`, r.inc * rand(0.5, 1));
  armyLoss(s, rand(0.03, 0.08));
}
export function loseLand(s, id) {
  delete s.land[id];
  if (s.sect) s.sect.members = Math.round(s.sect.members * 0.85);
}

// Phòng thủ: bản thân + đại trận + quân đội (trận pháp sư tính gấp đôi khi thủ)
const defPower = (s) => cp(s) + sectPower(s) + armyPower(s, true);
export const defendP = (s, atk) => clamp(1 / (1 + Math.exp(-(defPower(s) + bEff(s, 'tran') * 7 - atk) / 8)), 0.05, 0.95);
export const arrayP = (s, atk) => clamp(1 / (1 + Math.exp(-(sectPower(s) * 1.5 + bEff(s, 'tran') * 14 + cp(s) * 0.4 + armyPower(s, true) - atk) / 8)), 0.03, 0.9);

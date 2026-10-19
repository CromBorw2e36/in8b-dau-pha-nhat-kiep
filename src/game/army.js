import G from './data.js';
import { clamp, unit, spend, lose, give, countOf, beastGrade, fmtGold, levelPlan, applyFx } from './util.js';

// ───── Quân đội: cần tông môn và Doanh Trại ─────
const doanhLv = (s) => s.sect?.b?.doanh || 0;
export const armyCap = (s) => (doanhLv(s) ? 30 + doanhLv(s) * 40 : 0);
export const troopOpen = (s, t) => doanhLv(s) >= t.lv;
export const troopCount = (s) => G.TROOPS.reduce((a, t) => a + (s.army.n[t.id] || 0), 0);
export const recruitCost = (s, t) => Math.max(5, Math.round(unit(s) * t.cost));

// Sức chiến thô: tổng pow, có binh khí thì +60%, huấn luyện +2% mỗi cấp
export function armyRaw(s, defend = false) {
  const total = troopCount(s);
  if (!total) return 0;
  const raw = G.TROOPS.reduce((a, t) => a + (s.army.n[t.id] || 0) * t.pow * (defend && t.id === 'phap' ? 2 : 1), 0);
  const armed = Math.min(1, s.army.armed / total);
  return raw * (1 + 0.6 * armed) * (1 + 0.02 * s.army.train);
}
// Phần cộng vào thế lực khi chinh chiến (căn bậc hai để quân đông không áp đảo hoàn toàn)
export const armyPower = (s, defend = false) => 1.6 * Math.sqrt(armyRaw(s, defend));
export const armyUpkeep = (s) => G.TROOPS.reduce((a, t) => a + (s.army.n[t.id] || 0) * t.up, 0) * unit(s);

export function maxRecruit(s, t) {
  const room = armyCap(s) - troopCount(s);
  let n = Math.min(room, Math.floor(s.gold / recruitCost(s, t)));
  if (t.core) n = Math.min(n, countOf(s, 'core', beastGrade(s)) * 5);
  return Math.max(0, n);
}

export function recruit(s, id, n) {
  const t = G.TROOPS.find((x) => x.id === id);
  if (!t || !troopOpen(s, t)) return null;
  n = Math.min(n, maxRecruit(s, t));
  if (n <= 0) return troopCount(s) >= armyCap(s) ? 'Doanh trại đã đầy, hãy nâng cấp Doanh Trại.' : 'Không đủ kim tệ hoặc ma hạch.';
  spend(s, `Chiêu mộ ${t.n.toLowerCase()}`, n * recruitCost(s, t));
  if (t.core) takeCores(s, Math.ceil(n / 5));
  s.army.n[id] = (s.army.n[id] || 0) + n;
  issueArms(s);
  return `Chiêu mộ ${n} ${t.n.toLowerCase()}.`;
}
function takeCores(s, n) {
  for (let g = beastGrade(s); g <= 9 && n > 0; g++) {
    const have = s.inv[`core:${g}`] || 0;
    const use = Math.min(have, n);
    if (use) { give(s, 'core', g, -use); n -= use; }
  }
}
export function dismiss(s, id, n) {
  const have = s.army.n[id] || 0;
  n = Math.min(n, have);
  if (n <= 0) return null;
  s.army.n[id] = have - n;
  s.army.armed = Math.min(s.army.armed, troopCount(s));
  const t = G.TROOPS.find((x) => x.id === id);
  return `Giải ngũ ${n} ${t.n.toLowerCase()}.`;
}
// Phát binh khí trong kho cho binh sĩ chưa có
export function issueArms(s) {
  const need = troopCount(s) - s.army.armed;
  const n = Math.min(need, s.arms);
  if (n > 0) { s.arms -= n; s.army.armed += n; }
  return n;
}

// Huấn luyện 0..100
export const trainCost = (s, lv) => Math.round(unit(s) * 0.6 * Math.pow(1.07, lv));
export const trainPlan = (s, want) => levelPlan((l) => trainCost(s, l), s.army.train, G.TRAIN_MAX, s.gold, want);
export function train(s, want = 1) {
  if (!troopCount(s)) return 'Chưa có binh sĩ nào để huấn luyện.';
  const { n, tot } = trainPlan(s, want);
  if (!n) return s.army.train >= G.TRAIN_MAX ? null : 'Không đủ tiền.';
  spend(s, 'Huấn luyện quân đội', tot);
  s.army.train += n;
  return `Quân đội huấn luyện lên cấp ${s.army.train}.`;
}

// Tổn thất sau trận: frac là tỷ lệ binh sĩ mất
export function armyLoss(s, frac) {
  let lost = 0;
  for (const t of G.TROOPS) {
    const n = s.army.n[t.id] || 0;
    const d = Math.round(n * frac);
    s.army.n[t.id] = n - d;
    lost += d;
  }
  s.army.armed = Math.min(s.army.armed, troopCount(s));
  return lost;
}

export function armyYearly(s, e, yrs) {
  if (!troopCount(s)) return;
  issueArms(s);
  const cost = armyUpkeep(s) * yrs;
  if (!spend(s, 'Quân lương', cost)) {
    lose(s, 'Quân lương', s.gold);
    const gone = armyLoss(s, 0.2);
    applyFx(s, { tam: -2 });
    e.items.push({ t: `Thiếu quân lương, ${gone} binh sĩ bỏ trốn khỏi doanh trại.`, k: 'bad' });
  }
}

export const armyLine = (s) => `${troopCount(s)}/${armyCap(s)} quân · huấn luyện ${s.army.train} · ${fmtGold(armyUpkeep(s))} quân lương/năm`;
export const armedPct = (s) => (troopCount(s) ? clamp(Math.round((s.army.armed / troopCount(s)) * 100)) : 0);

import G from './data.js';
import { R, rand, pick, clamp, priceOf, pillNeed, beastGrade, tierFor, give, earn, spend, gearScore, gearName, itemName, fmtGold, parseKey, mkIdx, genName } from './util.js';
import { genGear, obtainGear } from './gear.js';

// ───── Giá thị trường: mỗi nhóm hàng dao động quanh 1, kéo dần về 1 ─────
export function marketTick(s, yrs) {
  for (const mk of Object.keys(G.MARKETS)) {
    let x = s.mkt[mk] ?? 1;
    x *= Math.exp(rand(-0.09, 0.09) * Math.sqrt(yrs));
    x += (1 - x) * 0.08;
    s.mkt[mk] = clamp(x, 0.55, 1.9);
  }
}
// Cú sốc giá do sự kiện (chiến tranh, mất mùa…)
export const shock = (s, mk, k) => { s.mkt[mk] = clamp((s.mkt[mk] ?? 1) * k, 0.55, 1.9); };
export const trend = (s, mk) => {
  const x = s.mkt[mk] ?? 1;
  return x >= 1.12 ? 'up' : x <= 0.88 ? 'down' : 'flat';
};

// Giá công bằng (giá thị trường) của một món
export const itemFair = (s, t, g) => priceOf(t, g) * mkIdx(s, G.ITEMS[t].mk);
export const gearFair = (s, it) => gearScore(it) * 0.85 * mkIdx(s, 'gear');
const fairOf = (s, x) => (x.kind === 'gear' ? gearFair(s, x.it) : itemFair(s, ...parseKey(x.key)));
export const listingName = (x) => (x.kind === 'gear' ? gearName(x.it) : itemName(...parseKey(x.key)));
// Nhãn rẻ/đắt so với giá thị trường
export const priceTag = (s, x) => {
  const r = x.price / fairOf(s, x);
  return r <= 0.85 ? 'cheap' : r >= 1.2 ? 'dear' : 'fair';
};

// ───── Ký gửi của người chơi ─────
const newId = () => Date.now().toString(36) + Math.floor(R() * 1e6).toString(36);
export function consignItem(s, key, n, price) {
  if (s.cons.length >= G.CONSIGN_MAX) return 'Quầy ký gửi đã đầy.';
  n = Math.min(n, s.inv[key] || 0);
  if (n <= 0 || price <= 0) return null;
  const [t, g] = parseKey(key);
  give(s, t, g, -n);
  s.cons.push({ id: newId(), kind: 'item', key, n, price: Math.round(price), t: s.t });
  return `Đã ký gửi ${n} ${itemName(t, g).toLowerCase()}, giá ${fmtGold(price)} mỗi món.`;
}
export function consignGear(s, id, price) {
  if (s.cons.length >= G.CONSIGN_MAX) return 'Quầy ký gửi đã đầy.';
  const i = s.armory.findIndex((x) => x.id === id);
  if (i < 0 || price <= 0) return null;
  const it = s.armory.splice(i, 1)[0];
  s.cons.push({ id: newId(), kind: 'gear', it, n: 1, price: Math.round(price), t: s.t });
  return `Đã ký gửi ${gearName(it)}, giá ${fmtGold(price)}.`;
}
export function cancelConsign(s, id) {
  const i = s.cons.findIndex((x) => x.id === id);
  if (i < 0) return null;
  const x = s.cons.splice(i, 1)[0];
  if (x.kind === 'gear') s.armory.push(x.it);
  else { const [t, g] = parseKey(x.key); give(s, t, g, x.n); }
  return `Đã rút ${listingName(x)} về.`;
}
// Xác suất có người mua mỗi lượt: đúng giá ~60%, đắt 50% gần như không ai mua
export const sellChance = (s, x) => clamp(1.6 - x.price / fairOf(s, x), 0.03, 0.9);

export function consignTick(s, e) {
  if (!s.cons.length) return;
  const sold = [];
  let rev = 0;
  for (const x of [...s.cons]) {
    const p = sellChance(s, x);
    if (R() >= p) continue;
    const n = x.kind === 'gear' ? 1 : Math.max(1, Math.ceil(x.n * p * rand(0.3, 1)));
    rev += n * x.price;
    x.n -= n;
    sold.push(`${n > 1 || x.kind === 'item' ? `${n} ` : ''}${x.kind === 'gear' ? gearName(x.it) : itemName(...parseKey(x.key)).toLowerCase()}`);
    if (x.n <= 0) s.cons = s.cons.filter((y) => y !== x);
  }
  if (!rev) return;
  const net = rev * (1 - (s.flags.vip ? 0.02 : G.CONSIGN_FEE));
  earn(s, 'Sàn giao dịch', net);
  s.exNew = (s.exNew || 0) + sold.length;
  s.stats.exSold = (s.stats.exSold || 0) + sold.length;
  e.items.push({ t: `Sàn Vạn Bảo: bán được ${sold.join(', ')}, thu ${fmtGold(net)} kim tệ sau phí.`, k: 'money' });
}

// ───── Hàng của thương nhân khác trên sàn, đổi mới mỗi 3 lượt ─────
const SELLERS = ['Mễ Đặc Nhĩ thương hội', 'Lão bản Hắc Giác Vực', 'Một tán tu vô danh', 'Đan Tháp phân bộ', 'Thương đội Xuất Vân', 'Kẻ đeo mặt nạ'];
export function npcList(s) {
  if (!s.ex || s.t - s.ex.t >= 3) {
    const need = pillNeed(s);
    const list = [];
    for (let i = 0; i < 5; i++) {
      const t = pick(['core', 'herb', 'ore', 'ore', 'tuk', 'lieu', 'pha', 'hon', 'calm', ...(s.R >= 4 && R() < 0.35 ? ['tho'] : [])]);
      const g = clamp((t === 'core' ? beastGrade(s) : t === 'ore' ? G.ORE_FOR_TIER[tierFor(s)] : need) + Math.round(rand(-1, 1)), 1, 9);
      const n = t === 'tho' ? 1 : Math.ceil(rand(1, t === 'ore' || t === 'herb' ? 12 : 5));
      list.push({ id: newId(), kind: 'item', key: `${t}:${g}`, n, price: Math.round(itemFair(s, t, g) * rand(0.65, 1.45)), seller: pick(SELLERS) });
    }
    for (let i = 0; i < 3; i++) {
      const it = genGear(s, { tier: tierFor(s) + (R() < 0.2 ? 1 : R() < 0.4 ? -1 : 0), boost: 0.8 });
      list.push({ id: newId(), kind: 'gear', it, n: 1, price: Math.round(gearFair(s, it) * rand(0.7, 1.5)), seller: R() < 0.3 ? genName(R() < 0.5 ? 'm' : 'f') : pick(SELLERS) });
    }
    s.ex = { t: s.t, list };
  }
  return s.ex.list;
}

export function buyListing(s, id, n = 1) {
  const list = npcList(s);
  const x = list.find((y) => y.id === id);
  if (!x) return null;
  n = Math.min(n, x.n);
  if (!spend(s, 'Mua trên sàn giao dịch', x.price * n)) return 'Không đủ tiền.';
  x.n -= n;
  if (x.n <= 0) s.ex.list = list.filter((y) => y !== x);
  if (x.kind === 'gear') return `Đã mua ${obtainGear(s, x.it)}.`;
  const [t, g] = parseKey(x.key);
  give(s, t, g, n);
  return `Đã mua ${n} ${itemName(t, g).toLowerCase()}.`;
}

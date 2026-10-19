import G from './data.js';
import { R, rand, pick, clamp, give, spend, itemName, pillNeed, tierFor, gearName, fmtGold, upgradeGong, upgradeSkill, genName } from './util.js';
import { genGear, obtainGear } from './gear.js';
import { itemFair, gearFair } from './exchange.js';
import { deFx } from './emperor.js';

// ───── Phòng đấu giá Mễ Đặc Nhĩ: mở phiên định kỳ, bán hàng hiếm không có ở chợ ─────
// s.auc = { at: lượt mở phiên, lots: [...] | null }. Phiên kéo dài G.AUCTION_OPEN lượt.
const RIVALS = ['Nạp Lan gia tộc', 'Mộc gia', 'Gia Hình Thiên', 'Vân Lam Tông', 'Đan Tháp trưởng lão', 'Thiên Xà phủ', 'Một hắc bào nhân', 'Phong Lôi Các'];
const newId = () => Date.now().toString(36) + Math.floor(R() * 1e6).toString(36);

export const aucOpen = (s) => !!s.auc?.lots && s.t < s.auc.at + G.AUCTION_OPEN;
export const aucWait = (s) => (s.auc ? Math.max(0, s.auc.at - s.t) : G.AUCTION_EVERY);
export const aucLeft = (s) => (aucOpen(s) ? s.auc.at + G.AUCTION_OPEN - s.t : 0);

function genLots(s) {
  const tier = tierFor(s);
  const need = pillNeed(s);
  const pool = [
    () => {
      const it = genGear(s, { tier: Math.min(G.TIERS.length - 1, tier + (R() < 0.35 ? 1 : 0)), q: pick([1.6, 1.6, 2, 2, 2.6]), boost: 2 });
      return { kind: 'gear', it, fair: gearFair(s, it) };
    },
    () => {
      const g = G.ORE_FOR_TIER[Math.min(G.TIERS.length - 1, tier + (R() < 0.5 ? 1 : 0))];
      const n = Math.round(rand(150, 400) / 10) * 10;
      return { kind: 'item', t: 'ore', g, n, fair: itemFair(s, 'ore', g) * n };
    },
    () => { const g = Math.min(9, need + 1); return { kind: 'item', t: 'pha', g, n: 3, fair: itemFair(s, 'pha', g) * 3 }; },
    () => { const g = Math.min(9, need + (R() < 0.4 ? 1 : 0)); return { kind: 'item', t: 'tho', g, n: 1, fair: itemFair(s, 'tho', g) * 1.5 }; },
    () => { const g = Math.min(9, need + 1); const n = 8; return { kind: 'item', t: 'core', g, n, fair: itemFair(s, 'core', g) * n }; },
  ];
  if (s.gong < 4) pool.push(() => ({ kind: 'gong', label: `Công pháp ${G.GRADES[s.gong + 1]}`, fair: G.GONG_PRICE[s.gong + 1] * 1.6 }));
  if (s.skill < 4) pool.push(() => ({ kind: 'skill', label: `Đấu kỹ ${G.GRADES[s.skill + 1]}`, fair: G.GONG_PRICE[s.skill + 1] * 1.1 }));
  // Luôn có ít nhất một trang bị, phần còn lại rút ngẫu nhiên
  const lots = [pool[0]()];
  const rest = pool.slice(1).sort(() => R() - 0.5).slice(0, 3 + (R() < 0.5 ? 1 : 0));
  for (const f of rest) lots.push(f());
  return lots.map((x) => {
    const start = Math.round(x.fair * rand(0.5, 0.7));
    return { ...x, id: newId(), price: start, lead: null, rival: R() < 0.3 ? genName(R() < 0.5 ? 'm' : 'f') : pick(RIVALS), cap: Math.round(x.fair * rand(0.9, 1.8)), sold: null };
  });
}

export const lotName = (s, x) => {
  if (x.kind === 'gear') return gearName(x.it);
  if (x.label) return x.label;
  return `${x.n > 1 ? `${x.n} ` : ''}${x.n > 1 ? itemName(x.t, x.g).toLowerCase() : itemName(x.t, x.g)}`;
};

// Bước giá tối thiểu 10%
export const minBid = (x) => Math.round(x.price * (x.lead ? 1.1 : 1));
// Gợi ý đối thủ còn hăng hay không (không lộ giá trần)
// Giá trần thực tế: đế uy khiến đối thủ chùn tay
const capOf = (s, x) => x.cap * (1 - deFx(s, 'auc'));
export const rivalMood = (s, x) => {
  const r = capOf(s, x) / x.price;
  return r > 1.4 ? 'còn rất hăng' : r > 1.12 ? 'vẫn bám theo' : r > 1 ? 'bắt đầu do dự' : 'sắp bỏ cuộc';
};

function deliver(s, x) {
  if (x.kind === 'gear') return obtainGear(s, x.it);
  if (x.kind === 'gong') return upgradeGong(s);
  if (x.kind === 'skill') return upgradeSkill(s);
  give(s, x.t, x.g, x.n);
  return `${x.n} ${itemName(x.t, x.g).toLowerCase()}`;
}

export function placeAucBid(s, id, bid) {
  if (!aucOpen(s)) return null;
  const x = s.auc.lots.find((y) => y.id === id);
  if (!x || x.sold) return null;
  bid = Math.max(Math.round(bid), minBid(x));
  if (s.gold < bid) return 'Không đủ kim tệ để ra giá này.';
  // Đối thủ theo nếu giá trần còn cao hơn; nếu không, búa gõ
  if (capOf(s, x) >= bid * 1.05) {
    x.price = Math.min(Math.round(capOf(s, x)), Math.round(bid * rand(1.05, 1.2)));
    x.lead = 'npc';
    return `Bạn ra ${fmtGold(bid)}. ${x.rival} lập tức nâng lên ${fmtGold(x.price)}!`;
  }
  spend(s, `Đấu giá ${lotName(s, x)}`, bid);
  const name = lotName(s, x);
  x.price = bid;
  x.lead = 'me';
  x.sold = 'me';
  const got = deliver(s, x);
  s.stats.auction = (s.stats.auction || 0) + 1;
  return `Búa gõ ba tiếng! ${x.rival} lắc đầu bỏ cuộc. Bạn thắng ${name} với giá ${fmtGold(bid)}${x.kind === 'gear' ? ` — ${got}` : ''}.`;
}

export function auctionTick(s, e) {
  if (!s.auc) s.auc = { at: s.t + G.AUCTION_EVERY, lots: null };
  const a = s.auc;
  // Mở phiên
  if (!a.lots && s.t >= a.at) {
    a.at = s.t;
    a.lots = genLots(s);
    s.aucNew = 1;
    e.items.push({ t: `Phòng đấu giá Mễ Đặc Nhĩ mở phiên trong ${G.AUCTION_OPEN} lượt, có ${a.lots.length} vật phẩm hiếm. Vào Chợ & sàn để ra giá.`, k: 'key' });
    return;
  }
  // Đóng phiên: món chưa ai thắng thì về tay đối thủ
  if (a.lots && s.t >= a.at + G.AUCTION_OPEN) {
    const lost = a.lots.filter((x) => !x.sold);
    if (lost.length) e.items.push({ t: `Phiên đấu giá khép lại. ${lost.map((x) => `${x.rival} mua ${lotName(s, x).toLowerCase()}`).slice(0, 2).join(', ')}${lost.length > 2 ? '…' : ''}.`, k: 'dim' });
    s.auc = { at: s.t + G.AUCTION_EVERY, lots: null };
    s.aucNew = 0;
    return;
  }
  if (!a.lots && a.at - s.t === 1) e.items.push({ t: 'Lượt sau phòng đấu giá Mễ Đặc Nhĩ mở phiên.', k: 'dim' });
}

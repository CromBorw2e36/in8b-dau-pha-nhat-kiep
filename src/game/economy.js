import G from './data.js';
import {
  R, rand, clamp, pick, priceOf, unit, beastGrade, pillNeed, give, takeBest, peekBest, countOf, earn, spend,
  parseKey, itemName, fmtGold, fmtItems, roomOf, applyFx, addQi, canAlch, winP, peer, lastEntry, mkIdx, tierFor, fxSum,
} from './util.js';
import { genGear, obtainGear } from './gear.js';

export const SELL_RATE = 0.7;
export const BUY_RATE = 1.15;
// s (tùy chọn): áp chỉ số giá thị trường hiện tại
export const sellPrice = (t, g, s) => Math.round(priceOf(t, g) * SELL_RATE * mkIdx(s, G.ITEMS[t].mk));
export const buyPrice = (t, g, s) => Math.round(priceOf(t, g) * BUY_RATE * mkIdx(s, G.ITEMS[t].mk));

// ───── Chợ ─────
export function sell(s, key, n = 1) {
  const [t, g] = parseKey(key);
  n = Math.min(n, s.inv[key] || 0);
  if (n <= 0) return 0;
  give(s, t, g, -n);
  const amt = sellPrice(t, g, s) * n;
  earn(s, `Bán ${G.ITEMS[t].n(g).toLowerCase()}`, amt);
  return amt;
}

export function buy(s, t, g, n = 1) {
  if (roomOf(s, `${t}:${g}`) < n) return false;
  if (!spend(s, `Mua ${G.ITEMS[t].n(g).toLowerCase()}`, buyPrice(t, g, s) * n)) return false;
  give(s, t, g, n);
  return true;
}

// Hiệu lực đan dược so với cảnh giới: đúng phẩm = 1, thấp 1 phẩm = 0.5, thấp hơn nữa gần như vô dụng
export const pillPower = (s, g) => (g >= pillNeed(s) ? 1 : g === pillNeed(s) - 1 ? 0.5 : 0.15);

export function useItem(s, key) {
  const [t, g] = parseKey(key);
  if (!s.inv[key]) return null;
  if (t === 'tuk') {
    give(s, t, g, -1);
    addQi(s, 30 * pillPower(s, g));
    return `Bạn uống ${itemName(t, g)}, đấu khí trong người cuộn trào.`;
  }
  if (t === 'lieu') {
    give(s, t, g, -1);
    applyFx(s, { body: 25 * pillPower(s, g) + 5 });
    return `Bạn uống ${itemName(t, g)}, vết thương lành dần.`;
  }
  if (t === 'hon') {
    give(s, t, g, -1);
    applyFx(s, { soul: 6 * pillPower(s, g) });
    return `Bạn uống ${itemName(t, g)}, linh hồn lực ngưng thực thêm một phần.`;
  }
  if (t === 'calm') {
    give(s, t, g, -1);
    applyFx(s, { tam: 10 * pillPower(s, g) });
    return `Bạn uống ${itemName(t, g)}, đạo tâm tĩnh lặng như mặt hồ.`;
  }
  if (t === 'tho') {
    give(s, t, g, -1);
    const yrs = Math.max(1, Math.round(g * 6 * Math.pow(0.8, s.thoUsed || 0)));
    s.thoUsed = (s.thoUsed || 0) + 1;
    applyFx(s, { life: yrs });
    return `Bạn uống ${itemName(t, g)}, thọ nguyên tăng thêm ${yrs} năm.`;
  }
  return null;
}

export function marketList(s) {
  const need = pillNeed(s);
  const grades = [...new Set([Math.max(1, need - 1), need])];
  const list = [];
  for (const t of ['tuk', 'lieu', 'pha', 'hon', 'calm']) for (const g of grades) list.push([t, g]);
  if (s.alch > 0) list.push(['herb', s.alch]);
  list.push(['ore', G.ORE_FOR_TIER[tierFor(s)]]);
  return list;
}

// Tự bán chiến lợi phẩm, giữ lại đồ còn dùng được
export function autoSell(s) {
  if (!s.auto.sell) return;
  const need = pillNeed(s);
  for (const key of Object.keys(s.inv)) {
    const [t, g] = parseKey(key);
    const n = s.inv[key];
    if (t === 'tho') continue; // Diên Thọ Đan không bao giờ tự bán
    if (t === 'core') {
      // Giữ ma hạch cho lò rèn và kỵ binh
      const keep = (s.smithy?.lv ? 6 : 0) + ((s.sect?.b?.doanh || 0) >= 15 ? 20 : 0);
      if (n > keep) sell(s, key, n - keep);
    } else if (t === 'ore') {
      const keep = s.smithy?.lv ? 80 : 0;
      if (n > keep) sell(s, key, n - keep);
    } else if (t === 'herb') {
      const keep = s.alch > 0 && g === s.alch ? 12 : 0;
      if (n > keep) sell(s, key, n - keep);
    } else {
      const keep = g >= need - 1 ? 4 : 0; // đan quá thấp phẩm thì bán
      if (n > keep) sell(s, key, n - keep);
    }
  }
}

// Tụ Khí Đan cho khổ tu: dùng có sẵn, thiếu thì tự mua nếu dư dả
export function cultivationPill(s) {
  const need = pillNeed(s);
  let g = peekBest(s, 'tuk');
  if ((!g || g < need - 1) && s.auto.buy && s.gold >= buyPrice('tuk', need, s) * 3) buy(s, 'tuk', need);
  g = takeBest(s, 'tuk');
  return g ? { g, power: pillPower(s, g) } : null;
}

// ───── Sổ thu chi mỗi lượt ─────
export function ledgerSummary(led) {
  const m = new Map();
  for (const [label, amt] of led) m.set(label, (m.get(label) || 0) + amt);
  const rows = [...m.entries()].sort((a, b) => b[1] - a[1]);
  return {
    rows,
    income: rows.filter((r) => r[1] > 0).reduce((a, r) => a + r[1], 0),
    expense: -rows.filter((r) => r[1] < 0).reduce((a, r) => a + r[1], 0),
  };
}

// ───── Kinh tế mỗi lượt ─────
const BORING = new Set(['Sinh hoạt phí', 'Gia đình chu cấp', 'Nguyệt lệ tông môn']);

export function economy(s, e, yrs, f) {
  // Gia đình chu cấp
  if (s.parents.alive && s.age < 20) {
    const a = G.ALLOWANCE[s.wealth] * yrs * (s.age < 16 ? 1 : 0.5);
    if (a) earn(s, 'Gia đình chu cấp', a * rand(0.8, 1.2));
  }
  // Nguyệt lệ tông môn, bổng lộc khách khanh
  if (s.faction && s.age >= 12) earn(s, s.evil ? 'Hồn Điện cấp phát' : 'Nguyệt lệ tông môn', unit(s) * 0.25 * yrs);
  if (s.salary) earn(s, 'Bổng lộc khách khanh', s.salary * yrs);

  // Thu nhập theo việc đang làm
  if (f?.id === 'lich') hunt(s, e, yrs);
  if (f?.id === 'nv' && s.pending !== 'mission') {
    // Không lên bảng nhiệm vụ thì làm việc vặt ở công hội
    earn(s, 'Nhiệm vụ lặt vặt', unit(s) * 0.35 * Math.sqrt(yrs) * rand(0.7, 1.3));
  }
  if (f?.id === 'duoc') alchemyBatches(s, e, yrs);

  // Trọng thương: tự uống Liệu Thương Đan
  if (s.body < 30) {
    if (!peekBest(s, 'lieu') && s.auto.buy && s.gold >= buyPrice('lieu', pillNeed(s), s) * 2) buy(s, 'lieu', pillNeed(s));
    const g = takeBest(s, 'lieu');
    if (g) { applyFx(s, { body: 25 * pillPower(s, g) + 5 }); e.items.push({ t: `Bạn uống ${itemName('lieu', g)} để chữa thương.`, k: 'dim' }); }
  }

  // Sinh hoạt phí từ 16 tuổi
  if (s.age >= 16) {
    const cost = G.LIVING[s.R] * yrs;
    if (!spend(s, 'Sinh hoạt phí', cost)) {
      if (s.gold > 0) s.led.push(['Sinh hoạt phí', -s.gold]);
      s.gold = 0;
      applyFx(s, { body: -1, tam: -1.5 });
      if (R() < 0.35) e.items.push({ t: pick(['Túi tiền rỗng tuếch, bạn phải sống kham khổ qua ngày.', 'Bạn nhịn đói tu luyện, đấu khí vận chuyển cũng trì trệ.', 'Không có tiền thuê trọ, bạn ngủ dưới mái hiên miếu hoang.']), k: 'bad' });
    }
  }
  autoSell(s);
}

export function moneyLine(s) {
  const interesting = s.led.some(([l, amt]) => amt !== 0 && !BORING.has(l));
  if (!interesting) return null;
  const { income, expense } = ledgerSummary(s.led);
  return `Thu ${fmtGold(income)} · Chi ${fmtGold(expense)} · Còn ${fmtGold(s.gold)} kim tệ`;
}

function hunt(s, e, yrs) {
  const bg = beastGrade(s);
  const got = [];
  const n = Math.floor(rand(0, 2.4) * Math.sqrt(yrs)) + (s.body > 60 ? 1 : 0);
  const cores = {};
  for (let i = 0; i < n; i++) { const g = clamp(bg - (R() < 0.5 ? 1 : 0), 1, 9); cores[g] = (cores[g] || 0) + 1; }
  for (const [g, c] of Object.entries(cores)) { give(s, 'core', +g, c); got.push(['core', +g, c]); }
  if (R() < 0.45) { const c = 1 + Math.floor(R() * 2); give(s, 'herb', bg, c); got.push(['herb', bg, c]); }
  if (R() < 0.3) { const og = G.ORE_FOR_TIER[tierFor(s)], c = 1 + Math.floor(R() * 3); give(s, 'ore', og, c); got.push(['ore', og, c]); }
  if (got.length) e.items.push({ t: `Thu hoạch: ${fmtItems(got)}.`, k: 'dim' });
  if (R() < 0.07 * Math.sqrt(yrs) * (0.7 + s.luck / 100) * (1 + fxSum(s, 'tambao'))) e.items.push({ t: `Bạn nhặt được ${obtainGear(s, genGear(s))}.`, k: 'good' });
}

function alchemyBatches(s, e, yrs) {
  if (s.alch < 1 || !canAlch(s)) {
    // Học việc: tốn dược liệu rẻ để luyện tay
    spend(s, 'Dược liệu luyện tập', priceOf('herb', 1) * 2 * Math.sqrt(yrs));
    return;
  }
  const g = s.alch;
  const batches = Math.min(4, 1 + Math.floor(yrs / 2));
  let ok = 0, fail = 0, made = {};
  for (let i = 0; i < batches; i++) {
    if (countOf(s, 'herb', g) < 2 && s.auto.buy) {
      if (!spend(s, `Mua dược liệu ${g} phẩm`, buyPrice('herb', g, s) * 2)) break;
      give(s, 'herb', g, 2);
    }
    if (countOf(s, 'herb', g) < 2) break;
    // dùng dược liệu đúng phẩm trước
    let left = 2;
    for (let gg = g; gg <= 9 && left > 0; gg++) {
      const have = s.inv[`herb:${gg}`] || 0;
      const use = Math.min(have, left);
      if (use) { give(s, 'herb', gg, -use); left -= use; }
    }
    const p = clamp(0.45 + s.soul / 250 + s.fires.length * 0.08 + (s.master ? 0.1 : 0), 0.1, 0.95);
    if (R() < p) {
      ok++;
      const t = pick(['tuk', 'tuk', 'lieu', 'pha', 'hon', 'calm', ...(s.alch >= 5 && R() < 0.3 ? ['tho'] : [])]);
      const c = 1 + Math.floor(R() * 3);
      give(s, t, g, c);
      made[t] = (made[t] || 0) + c;
    } else fail++;
  }
  if (ok || fail) {
    const list = Object.entries(made).map(([t, c]) => [t, g, c]);
    e.items.push({ t: `Luyện ${ok + fail} lò, thành ${ok}${list.length ? `: ${fmtItems(list)}` : ''}.`, k: ok ? 'dim' : 'bad' });
  } else e.items.push({ t: 'Không đủ tiền mua dược liệu, lò đan nguội lạnh.', k: 'bad' });
}

// ───── Bảng nhiệm vụ ─────
const DIFF = ['Dễ', 'Vừa', 'Khó', 'Cực khó'];
export function genMissions(s) {
  const bg = beastGrade(s);
  const pool = G.MISSIONS.map((m, i) => i).sort(() => R() - 0.5).slice(0, 3);
  return pool.map((i, j) => {
    const m = G.MISSIONS[i];
    const d = clamp(j + Math.floor(rand(-1, 1.5)), 0, 3); // 0..3
    const g = clamp(bg + d - 1, 1, 9);
    const pay = Math.round(priceOf('core', g) * m.pay * (1 + d * 0.6) * rand(0.85, 1.25) * (s.faction ? 1.15 : 1));
    return { i, d, g, pay, label: m.n(g), diff: DIFF[d] };
  });
}

export function missionChoice(s, ms) {
  const m = G.MISSIONS[ms.i];
  return {
    t: `[${ms.diff}] ${ms.label}`,
    sub: `Thù lao ${fmtGold(ms.pay)} kim tệ${m.item ? ` + ${itemName(m.item, ms.g).toLowerCase()}` : ''}`,
    roll: (s) => clamp(winP(s, peer(s, (ms.d - 1) * 3 * m.risk + m.risk * 2)) + 0.1),
    ok: {
      fx: { goldAbs: ms.pay, why: 'Thù lao nhiệm vụ', fame: m.fame || 0, item: m.item ? [[m.item, ms.g, 1 + Math.floor(R() * 2)]] : undefined },
      do: (s) => { if (R() < 0.12 + ms.d * 0.06) s.post.push({ t: `Chủ thuê còn tặng thêm ${obtainGear(s, genGear(s, { tier: undefined }))}.`, k: 'good' }); },
      log: () => `Hoàn thành nhiệm vụ «${ms.label}», nhận ${fmtGold(ms.pay)} kim tệ.`, k: 'good',
    },
    fail: {
      fx: { body: -Math.round(6 + 6 * m.risk * (1 + ms.d)), tam: -3 },
      log: () => `Nhiệm vụ «${ms.label}» thất bại, bạn bị thương trở về tay trắng.`,
      dieP: ms.d >= 2 ? 0.06 * m.risk : 0, die: 'Tử nạn khi đang làm nhiệm vụ',
    },
  };
}

// Giả lập nhiều kiếp để bắt lỗi runtime và kiểm tra cân bằng.
// Chạy: npm run sim            (mặc định 300 kiếp)
//       npm run sim -- 1000    (1000 kiếp)
// Bot chọn ngẫu nhiên mọi lựa chọn, tự khai tông, xây công trình, chinh phạt khi tỷ lệ thắng > 55%,
// dựng lò rèn, chế tạo, cường hóa, lập quân đội, ký gửi hàng lên sàn. Kết quả chỉ mang tính tham khảo.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/game/');
const imp = (f) => import(pathToFileURL(dir + f).href);

const G = (await imp('data.js')).default;
const { newLife, tick, choicesOf, choose, summary, netWorth } = await imp('engine.js');
const { canFound, foundSect, startConquest, conquerP, regionDef, upgradeBuild, landCount, attackBlock, develop, landIds } = await imp('sect.js');
const { buyEstate, forgeStock, buyGear, gearBuy } = await imp('gear.js');
const { retire, parseKey } = await imp('util.js');
const { upgradeSmith, craft, canCraft, craftTierCap, enhance, fulfill } = await imp('forge.js');
const { recruit, train, troopOpen, troopCount } = await imp('army.js');
const { consignItem, npcList, buyListing, itemFair } = await imp('exchange.js');

const N = +process.argv[2] || 300;
const TICK_SEC = 3.2; // thời gian một lượt ở tốc độ 1×
const st = { realm: {}, errors: 0, ages: 0, ticks: 0, events: 0, secs: 0, maxSecs: 0, sect: 0, lands: 0, wep: 0, emp: 0, smith: 0, troops: 0, en: 0, crafted: 0, maxLands: 0, deStep: 0, unify: 0 };
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

for (let i = 0; i < N; i++) {
  const s = newLife();
  let sec = 0;
  try {
    for (let guard = 0; !s.dead && guard < 20000; guard++) {
      // Thành Đế rồi thì bot ngự trị thêm 100 năm rồi quy ẩn
      if (s.R >= 11 && s.age - s.emperorAt >= 100) { st.emp++; st.deStep += s.step; retire(s); break; }
      if (s.needFocus) {
        s.focus = s.sect && Math.random() < 0.4 ? 'tong' : ['tu', 'lich', 'nv', 'tu', 'ky'][Math.floor(Math.random() * 5)];
        s.needFocus = false;
      }
      if (s.pending) { st.events++; const ch = choicesOf(s); choose(s, ch[Math.floor(Math.random() * ch.length)]); continue; }
      if (canFound(s)) foundSect(s, '');
      if (s.sect) {
        for (const b of G.BUILDS) if (Math.random() < 0.3) upgradeBuild(s, b.id, Math.random() < 0.3 ? 10 : 1);
        if (Math.random() < 0.3) for (const t of G.TROOPS) if (troopOpen(s, t)) recruit(s, t.id, 20);
        if (Math.random() < 0.1) train(s, 2);
        if (Math.random() < 0.1 && landCount(s)) develop(s, rnd(landIds(s)), 3);
        const target = G.REGIONS.find((r) => !attackBlock(s, r) && conquerP(s, regionDef(s, r)) > 0.55);
        if (target && startConquest(s, target.id)) continue;
      }
      if (Math.random() < 0.2) for (const e of G.ESTATES) buyEstate(s, e.id, Math.random() < 0.2 ? 10 : 1);
      if (Math.random() < 0.2) for (const it of [...forgeStock(s)]) if (s.gold > gearBuy(it) * 3) buyGear(s, it.id);
      // Lò rèn
      if (s.age >= 14 && Math.random() < 0.1) upgradeSmith(s, 2);
      if (craftTierCap(s) && Math.random() < 0.2) {
        const tier = craftTierCap(s);
        if (canCraft(s, tier)) craft(s, rnd(G.GEAR_SLOTS), tier);
      }
      if (s.smithy.lv && Math.random() < 0.3) { const it = s.gear[rnd(G.GEAR_SLOTS)]; if (it) enhance(s, it.id); }
      if (s.orders.length && Math.random() < 0.3) fulfill(s, s.orders[0].id);
      // Sàn giao dịch
      if (Math.random() < 0.05) {
        const keys = Object.keys(s.inv);
        const key = keys.length ? rnd(keys) : null;
        if (key) consignItem(s, key, s.inv[key], itemFair(s, ...parseKey(key)) * (0.9 + Math.random() * 0.4));
      }
      if (Math.random() < 0.05) { const l = npcList(s); if (l.length) buyListing(s, rnd(l).id); }
      sec += TICK_SEC * (s.started ? 1 : 0.6);
      tick(s);
      st.ticks++;
    }
    summary(s); netWorth(s);
  } catch (err) {
    st.errors++;
    if (st.errors <= 3) console.error(err);
  }
  const n = G.REALMS[s.R].n;
  st.realm[n] = (st.realm[n] || 0) + 1;
  st.ages += s.age;
  st.secs += sec;
  st.maxSecs = Math.max(st.maxSecs, sec);
  if (s.sect) { st.sect++; st.lands += landCount(s); st.troops += troopCount(s); }
  st.maxLands = Math.max(st.maxLands, landCount(s));
  if (s.flags.unified) st.unify++;
  st.wep += s.gear.wep?.tier || 0;
  st.smith += s.smithy.lv;
  st.en = Math.max(st.en, s.stats.enhance || 0);
  st.crafted += s.stats.crafted || 0;
}

const pct = (x) => ((x / N) * 100).toFixed(1) + '%';
console.log(`\n${N} kiếp · lỗi runtime: ${st.errors}`);
console.log('Cảnh giới cuối đời:');
for (const r of G.REALMS) if (st.realm[r.n]) console.log(`  ${r.n.padEnd(12)} ${pct(st.realm[r.n])}`);
console.log(`Tuổi thọ TB: ${Math.round(st.ages / N)} · lượt/kiếp: ${Math.round(st.ticks / N)} · sự kiện/kiếp: ${Math.round(st.events / N)}`);
console.log(`Thời gian/kiếp ở 1× (chưa tính lúc chọn): TB ${(st.secs / N / 60).toFixed(1)} phút, dài nhất ${(st.maxSecs / 60).toFixed(1)} phút`);
console.log(`Khai tông: ${pct(st.sect)} · lãnh địa TB mỗi tông: ${(st.lands / Math.max(1, st.sect)).toFixed(1)} (nhiều nhất ${st.maxLands}/${G.REGIONS.length}) · bậc vũ khí TB: ${(st.wep / N).toFixed(2)}`);
console.log(`Lò rèn TB: cấp ${(st.smith / N).toFixed(1)} · chế tạo TB ${(st.crafted / N).toFixed(1)} món · cường hóa cao nhất +${st.en} · quân TB ${Math.round(st.troops / Math.max(1, st.sect))}/tông`);
console.log(`Đấu Đế quy ẩn: ${st.emp} · TB ${(st.deStep / Math.max(1, st.emp)).toFixed(0)} trọng sau 100 năm làm Đế · nhất thống: ${st.unify}`);

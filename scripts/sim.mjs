// Giả lập nhiều kiếp để bắt lỗi runtime và kiểm tra cân bằng.
// Chạy: npm run sim            (mặc định 300 kiếp)
//       npm run sim -- 1000    (1000 kiếp)
// Bot chọn ngẫu nhiên mọi lựa chọn, tự khai tông, xây công trình, chinh phạt khi tỷ lệ thắng > 55%,
// thỉnh thoảng mua sản nghiệp và trang bị. Kết quả chỉ mang tính tham khảo.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/game/');
const imp = (f) => import(pathToFileURL(dir + f).href);

const G = (await imp('data.js')).default;
const { newLife, tick, choicesOf, choose, summary, netWorth } = await imp('engine.js');
const { canFound, foundSect, startConquest, conquerP, regionDef, upgradeBuild, landCount } = await imp('sect.js');
const { buyEstate, forgeStock, buyGear, gearBuy } = await imp('gear.js');

const N = +process.argv[2] || 300;
const TICK_SEC = 3.2; // thời gian một lượt ở tốc độ 1×
const st = { realm: {}, errors: 0, ages: 0, ticks: 0, events: 0, secs: 0, maxSecs: 0, sect: 0, lands: 0, wep: 0 };

for (let i = 0; i < N; i++) {
  const s = newLife();
  let sec = 0;
  try {
    for (let guard = 0; !s.dead && guard < 20000; guard++) {
      if (s.needFocus) {
        s.focus = s.sect && Math.random() < 0.4 ? 'tong' : ['tu', 'lich', 'nv', 'tu', 'ky'][Math.floor(Math.random() * 5)];
        s.needFocus = false;
      }
      if (s.pending) { st.events++; const ch = choicesOf(s); choose(s, ch[Math.floor(Math.random() * ch.length)]); continue; }
      if (canFound(s)) foundSect(s, '');
      if (s.sect) {
        for (const b of G.BUILDS) if (Math.random() < 0.3) upgradeBuild(s, b.id);
        const target = G.REGIONS.find((r) => !s.land[r.id] && conquerP(s, regionDef(s, r)) > 0.55);
        if (target && startConquest(s, target.id)) continue;
      }
      if (Math.random() < 0.2) for (const e of G.ESTATES) buyEstate(s, e.id);
      if (Math.random() < 0.2) for (const it of [...forgeStock(s)]) if (s.gold > gearBuy(it) * 3) buyGear(s, it.id);
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
  if (s.sect) { st.sect++; st.lands += landCount(s); }
  st.wep += s.gear.wep?.tier || 0;
}

const pct = (x) => ((x / N) * 100).toFixed(1) + '%';
console.log(`\n${N} kiếp · lỗi runtime: ${st.errors}`);
console.log('Cảnh giới cuối đời:');
for (const r of G.REALMS) if (st.realm[r.n]) console.log(`  ${r.n.padEnd(12)} ${pct(st.realm[r.n])}`);
console.log(`Tuổi thọ TB: ${Math.round(st.ages / N)} · lượt/kiếp: ${Math.round(st.ticks / N)} · sự kiện/kiếp: ${Math.round(st.events / N)}`);
console.log(`Thời gian/kiếp ở 1× (chưa tính lúc chọn): TB ${(st.secs / N / 60).toFixed(1)} phút, dài nhất ${(st.maxSecs / 60).toFixed(1)} phút`);
console.log(`Khai tông: ${pct(st.sect)} · lãnh địa TB mỗi tông: ${(st.lands / Math.max(1, st.sect)).toFixed(1)} · bậc vũ khí TB: ${(st.wep / N).toFixed(2)}`);

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import G from '../game/data.js';
import { tick, choose, choicesOf, hints, save, EV } from '../game/engine.js';
import { lifeOf, realmLabel, canAlch, cp, retire } from '../game/util.js';
import { smithLv } from '../game/forge.js';
import { troopCount } from '../game/army.js';
import { attackBlock, conquerP, regionDef, landCount } from '../game/sect.js';
import { checkAch } from '../game/ach.js';
import { Bar, Hints, Deltas, Sheet, StatHelp, Toasts } from './ui.jsx';
import { Seal, FOCUS_G, EV_G, NUM_G } from './glyphs.jsx';
import { stamp, burst, cascade, useCountUp } from './motion.js';
import Bag from './Bag.jsx';
import Sect from './Sect.jsx';
import Market from './Market.jsx';
import Forge from './Forge.jsx';

// ms mỗi lượt. Mặc định chậm để kịp đọc; tốc độ được nhớ giữa các lần chơi.
const SPEEDS = [3200, 2000, 1100, 500];
const SPEED_LABEL = ['1×', '1.5×', '3×', '6×'];
const SPEED_KEY = 'dpnk_speed';
const FEED_KEY = 'dpnk_feed';
const readKey = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const writeKey = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const readSpeed = () => { const v = +readKey(SPEED_KEY, 0); return v >= 0 && v < SPEEDS.length ? v : 0; };

// Một năm «bình lặng»: không có chuyện gì đáng kể, có thể gộp lại
const LOUD = new Set(['key', 'up', 'good', 'bad', 'death']);
const calmYear = (e) => !e.st && !e.items.some((it) => LOUD.has(it.k));
const MAJOR = new Set(['key', 'up', 'death']);

export default function Game({ s, ver, bump, onEnd, onHome, demo }) {
  const [paused, setPaused] = useState(!!demo);
  const [speed, setSpeedRaw] = useState(readSpeed);
  const setSpeed = (fn) => setSpeedRaw((v) => { const n = fn(v); writeKey(SPEED_KEY, n); return n; });
  const [panel, setPanel] = useState(demo?.panel || null); // 'bag' | 'forge' | 'market' | 'sect' | 'help'
  const [focusOpen, setFocusOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [peek, setPeek] = useState(false); // tạm ẩn bảng quyết định để xem thông số
  const [major, setMajor] = useState(() => readKey(FEED_KEY, '0') === '1');
  const [open, setOpen] = useState({}); // nhóm năm bình lặng đã mở
  const [toasts, setToasts] = useState([]);
  const feed = useRef(null);
  const seen = useRef(s.log.length);
  const goldRef = useCountUp(s.gold);

  const toast = (t, k, seal) => setToasts((l) => [...l, { id: Math.random(), t, k, seal }].slice(-4));

  // Mỗi quyết định mới đều hiện bảng ra trước
  useEffect(() => { setPeek(false); }, [s.pending, s.needFocus, result]);

  const blocked = paused || s.dead || s.pending || s.needFocus || focusOpen || result || panel;

  useEffect(() => {
    if (blocked) return;
    const id = setTimeout(() => { tick(s); save(s); bump(); }, SPEEDS[speed] * (s.started ? 1 : 0.6));
    return () => clearTimeout(id);
  }, [ver, blocked, speed]);

  // Sau mỗi thay đổi: báo nổi các đại sự mới trong nhật ký và thành tựu vừa mở
  useEffect(() => {
    const fresh = s.log.slice(seen.current).flatMap((e) => e.items);
    seen.current = s.log.length;
    for (const it of fresh) {
      if (it.k === 'up') toast(it.t, 'up', 'Tiến');
      else if (it.k === 'key' && it.t.length < 140) toast(it.t, 'key', 'Sự');
    }
    for (const a of checkAch(s)) toast(`Thành tựu: ${a.n}`, 'ach', a.g);
  }, [ver]);

  useEffect(() => {
    if (s.dead && !result) { const id = setTimeout(onEnd, 1400); return () => clearTimeout(id); }
  }, [s.dead, result]);

  useLayoutEffect(() => {
    const el = feed.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [ver, s.log.length, major]);

  // Phím tắt: Space = tạm dừng, Esc = xem thông số, 1–4 = chọn
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'Escape' && (s.pending || s.needFocus || result) && !panel) setPeek((p) => !p);
      const n = parseInt(e.key, 10);
      if (n >= 1 && s.pending && !result && !peek) {
        const ch = choicesOf(s)[n - 1];
        if (ch) pickChoice(ch);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pickChoice = (ch) => { const r = choose(s, ch); save(s); setResult(r); bump(); };
  const pickFocus = (id) => { s.focus = id; s.needFocus = false; setFocusOpen(false); save(s); bump(); };

  const life = lifeOf(s);
  const ev = s.pending ? EV[s.pending] : null;
  const showFocus = (s.needFocus || focusOpen) && !s.dead;
  const f = G.FOCUS.find((x) => x.id === s.focus);

  // Chấm báo trên thanh điều hướng
  const dots = {
    market: s.exNew > 0,
    forge: smithLv(s) > 0 && s.orders.some((o) => s.arms >= o.n),
    sect: !!s.sect && G.REGIONS.some((r) => !attackBlock(s, r) && conquerP(s, regionDef(s, r)) >= 0.6),
  };

  // Nhật ký: gộp các năm bình lặng liên tiếp (giữ nguyên 3 năm gần nhất), hoặc chỉ hiện đại sự
  const rows = useMemo(() => {
    const out = [];
    const L = s.log;
    for (let i = 0; i < L.length; i++) {
      const e = L[i];
      if (major) {
        const items = e.items.filter((it) => MAJOR.has(it.k));
        if (items.length || e.st) out.push({ e: { ...e, items }, i });
        continue;
      }
      if (calmYear(e) && i < L.length - 3) {
        let j = i;
        while (j + 1 < L.length - 3 && calmYear(L[j + 1])) j++;
        if (j - i >= 2 && !open[i]) { out.push({ group: [i, j] }); i = j; continue; }
      }
      out.push({ e, i });
    }
    return out;
  }, [s.log.length, ver, major, open]);

  const toggleMajor = () => setMajor((m) => { writeKey(FEED_KEY, m ? '0' : '1'); return !m; });

  return (
    <div className="screen game">
      <header className="hud">
        <div className="hud-top">
          <button className="icon-btn home" onClick={onHome} aria-label="Về trang chủ">‹</button>
          <div className="who">
            <div className="who-name">{s.name}</div>
            <div className="who-sub">{s.faction || 'Tán tu'}{s.evil ? ' · ma đạo' : ''}{s.heirOf ? ' · hậu duệ Đế' : ''}</div>
          </div>
          <div className="realm-badge" data-r={s.R}><span>{realmLabel(s)}</span></div>
        </div>

        <div className="meters">
          <div className="meter">
            <div className="meter-head"><span>{s.age} tuổi</span><span className="muted">/ {life === Infinity ? 'bất tử' : life}</span></div>
            <Bar value={s.age} max={life === Infinity ? s.age : life} tone="var(--life)" thin />
          </div>
          {s.started && (
            <div className="meter">
              <div className="meter-head"><span>Đấu khí</span><span className={s.ready || (s.R >= 11 && s.step >= 100) ? 'hot' : 'muted'}>{s.R >= 11 && s.step >= 100 ? 'Viên mãn' : s.ready ? 'Bình cảnh!' : `${Math.floor(s.qi)}%`}</span></div>
              <Bar value={s.R >= 11 && s.step >= 100 ? 100 : s.qi} tone="var(--qi)" thin />
            </div>
          )}
        </div>

        <button className="stats" onClick={() => setPanel('help')} title="Bấm để xem ý nghĩa các chỉ số">
          {G.STATS.map((st) => (
            <div key={st.k} className="stat" data-k={st.k}>
              <div className="stat-head"><span>{st.n}</span><b>{Math.round(s[st.k])}</b></div>
              <Bar value={s[st.k]} tone={`var(--${st.k})`} />
            </div>
          ))}
          <span className="stats-q" aria-label="Giải thích chỉ số">?</span>
        </button>

        <div className="chips scroll">
          {s.R >= 11 && !s.dead && (
            <button className="chip gold" onClick={() => { if (window.confirm('Quy ẩn sẽ khép lại kiếp này với danh hiệu Đấu Đế. Tiếp tục?')) { retire(s); save(s); bump(); } }}>Đấu Đế · Quy ẩn</button>
          )}
          <button className="chip gold-chip" onClick={() => setPanel('bag')}><span ref={goldRef} className="num" /> kim tệ</button>
          {s.started && <span className="chip">Chiến lực {Math.round(cp(s))}</span>}
          {s.gong > 0 && <span className="chip">Công pháp {G.GRADES[s.gong]}</span>}
          {s.skill > 0 && <span className="chip">Đấu kỹ {G.GRADES[s.skill]}</span>}
          {s.alch > 0 && <span className="chip gold">Luyện dược sư {s.alch} phẩm</span>}
          {s.fires.map((x) => <span key={x} className="chip fire">Dị hỏa · {x}</span>)}
          {s.salary > 0 && <span className="chip">Khách khanh {s.flags.guest}</span>}
          {s.sect && <button className="chip gold" onClick={() => setPanel('sect')}>Tông chủ {s.sect.name} · {s.sect.members} đệ tử</button>}
          {landCount(s) > 0 && <span className="chip">Lãnh địa {landCount(s)}/{G.REGIONS.length}</span>}
          {troopCount(s) > 0 && <span className="chip">Quân {troopCount(s)}</span>}
          {smithLv(s) > 0 && <button className="chip" onClick={() => setPanel('forge')}>Lò rèn cấp {smithLv(s)}</button>}
          {s.dwelling > 0 && <span className="chip">{G.DWELLING[s.dwelling][1]}</span>}
          {s.master && <span className="chip">Có sư phụ</span>}
          {s.partner && <span className="chip">Đạo lữ {s.partner.name}</span>}
          {s.companion && <span className="chip">{s.companion}</span>}
        </div>
      </header>

      <div className="feed-bar">
        <span className="label">Sử ký</span>
        <button className={'feed-toggle' + (major ? ' on' : '')} onClick={toggleMajor} aria-pressed={major}>{major ? 'Đang xem: đại sự' : 'Chỉ xem đại sự'}</button>
      </div>
      <main className="feed" ref={feed}>
        {rows.map((r) => r.group ? (
          <button key={'g' + r.group[0]} className="calm-group" onClick={() => setOpen((o) => ({ ...o, [r.group[0]]: true }))}>
            <span className="yr-age">{s.log[r.group[0]].a}–{s.log[r.group[1]].a}</span>
            <span>{r.group[1] - r.group[0] + 1} năm bình lặng · bấm để xem</span>
          </button>
        ) : (
          <div key={r.i}>
            {r.e.st && <div className="divider"><span>{r.e.st}</span></div>}
            {r.e.items.length > 0 && (
              <div className="yr">
                <div className="yr-age">{r.e.a}</div>
                <div className="yr-body">
                  {r.e.items.map((it, j) => <p key={j} className={it.k || ''}>{it.t}</p>)}
                </div>
              </div>
            )}
          </div>
        ))}
        {s.dead && <div className="divider end"><span>Một kiếp khép lại</span></div>}
      </main>

      {peek && (
        <div className="peek-bar">
          <span>{result ? 'Đang xem kết quả' : 'Đang chờ ngươi quyết định'}</span>
          <button className="btn primary" onClick={() => setPeek(false)}>Quay lại {result ? 'kết quả' : 'quyết định'}</button>
        </div>
      )}

      <footer className="ctrl">
        <div className="ctrl-row">
          <button className="icon-btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'}>
            {paused ? '▶' : '❚❚'}
          </button>
          <button className="focus-btn" disabled={!s.started || s.dead} onClick={() => setFocusOpen(true)}>
            {s.started ? (
              <><Seal ch={FOCUS_G[s.focus] || '?'} size="sm" /><span><small>Đang chuyên tâm</small>{f?.n || 'Chưa chọn'}</span><span className="muted">Đổi</span></>
            ) : (
              <><Seal ch="Thơ" size="sm" tone="outline" /><span><small>Thơ ấu</small>Lớn lên trong vòng tay phụ mẫu</span></>
            )}
          </button>
          <button className="icon-btn" onClick={() => setSpeed((v) => (v + 1) % SPEEDS.length)} aria-label="Tốc độ">{SPEED_LABEL[speed]}</button>
        </div>
        <nav className="nav" aria-label="Quản lý">
          {[
            ['bag', 'Túi', 'Túi đồ', true],
            ['forge', 'Rèn', 'Lò rèn', s.started && !s.dead],
            ['market', 'Thị', 'Chợ & sàn', true],
            ['sect', 'Môn', 'Tông môn', s.started && !s.dead],
          ].map(([id, g, n, ok]) => (
            <button key={id} className="nav-btn" disabled={!ok} onClick={() => setPanel(id)}>
              <Seal ch={g} size="sm" tone={dots[id] ? 'red' : 'outline'} />
              <span>{n}</span>
              {dots[id] && <i className="dot" aria-label="có việc mới" />}
            </button>
          ))}
        </nav>
      </footer>

      {panel === 'bag' && <Bag s={s} bump={bump} initTab={demo?.tab} onClose={() => setPanel(null)} />}
      {panel === 'forge' && <Forge s={s} bump={bump} initTab={demo?.tab} onClose={() => setPanel(null)} />}
      {panel === 'market' && <Market s={s} bump={bump} initTab={demo?.tab} onClose={() => setPanel(null)} />}
      {panel === 'sect' && <Sect s={s} bump={bump} initTab={demo?.tab} onClose={() => setPanel(null)} />}
      {panel === 'help' && <StatHelp onClose={() => setPanel(null)} />}

      {showFocus && !result && !peek && (
        <Sheet mark="Đạo" onClose={s.needFocus ? undefined : () => setFocusOpen(false)} onPeek={s.needFocus ? () => setPeek(true) : undefined}>
          <p className="eyebrow">{s.needFocus ? 'Con đường tu luyện bắt đầu' : realmLabel(s)}</p>
          <h3>Ngươi muốn dành thời gian cho điều gì?</h3>
          <div className="focus-grid">
            {G.FOCUS.map((x) => {
              const locked = (x.alch && !canAlch(s)) || (x.sect && !s.sect);
              const h = hints({ fx: { ...x.fx, ...(x.money ? { gold: x.money } : {}), qi: x.qi - 0.9 } });
              return (
                <button key={x.id} className={'focus-card' + (s.focus === x.id ? ' active' : '')} disabled={locked} onClick={() => pickFocus(x.id)}>
                  <Seal ch={FOCUS_G[x.id]} tone={s.focus === x.id ? 'red' : 'outline'} />
                  <b>{x.n}</b>
                  <small>{locked ? (x.sect ? 'Cần khai tông lập phái trước (mục «Tông môn»)' : 'Cần hỏa thuộc tính (hoặc dị hỏa, sư phụ) và linh hồn lực mạnh') : x.d}</small>
                  {!locked && <Hints h={h} />}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}

      {ev && !result && !s.dead && !peek && !showFocus && <EventSheet s={s} ev={ev} onPick={pickChoice} onPeek={() => setPeek(true)} />}

      {result && !peek && <ResultSheet s={s} result={result} onPeek={() => setPeek(true)} onDone={() => { setResult(null); if (s.dead) onEnd(); }} />}

      <Toasts list={toasts} onDone={(id) => setToasts((l) => l.filter((x) => x.id !== id))} />
    </div>
  );
}

function EventSheet({ s, ev, onPick, onPeek }) {
  const box = useRef(null);
  useLayoutEffect(() => { cascade(box.current?.querySelectorAll('.choice')); }, [ev.id]);
  return (
    <Sheet mark={EV_G[ev.id]} onPeek={onPeek}>
      <Seal ch={EV_G[ev.id] || 'Sự'} size="lg" className="ev-seal" />
      <p className="eyebrow">{s.age} tuổi · {realmLabel(s)}</p>
      {ev.title && <h3>{ev.title(s)}</h3>}
      <p className="ev-text">{ev.text(s)}</p>
      <div className="choices" ref={box}>
        {choicesOf(s).map((ch, i) => (
          <button key={i} className="choice" onClick={() => onPick(ch)}>
            <span className="choice-n">{NUM_G[i]}</span>
            <span className="choice-body">
              <span>{typeof ch.t === 'function' ? ch.t(s) : ch.t}</span>
              {ch.sub && <small className="choice-sub">{ch.sub}</small>}
              <Hints h={hints(ch)} />
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function ResultSheet({ s, result, onPeek, onDone }) {
  const sealRef = useRef(null);
  const wrap = useRef(null);
  const rings = useRef(null);
  const up = !!result.delta?.lv;
  useLayoutEffect(() => {
    stamp(sealRef.current, wrap.current);
    if (up) burst(rings.current?.querySelectorAll('i'));
  }, [result]);
  const ch = result.dead ? 'Tử' : result.ok ? 'Thành' : 'Bại';
  return (
    <Sheet mark={result.dead ? 'Tử' : result.ok === false ? 'Bại' : result.ok ? 'Thành' : null} onPeek={onPeek}>
      <div ref={wrap} className="result-wrap">
        {(result.dead || result.ok !== null) && (
          <div className={'result-badge ' + (result.dead ? 'death' : result.ok ? 'ok' : 'fail')}>
            <span className="seal-stage">
              {up && <span className="rings" ref={rings} aria-hidden="true"><i /><i /><i /></span>}
              <span ref={sealRef} className="seal-hold"><Seal ch={up ? 'Phá' : ch} tone={result.ok && !result.dead ? 'red' : 'ink'} size="lg" /></span>
            </span>
            <span>{result.dead ? 'Vẫn lạc' : up ? 'Đột phá thành công' : result.ok ? 'Thành công' : 'Thất bại'}</span>
          </div>
        )}
      </div>
      {result.text && <p className="ev-text">{result.text}</p>}
      {result.dead && <p className="ev-text death-text">{s.cause}.</p>}
      <Deltas d={result.delta} />
      <button className="btn primary" autoFocus onClick={onDone}>
        {result.dead ? 'Xem lại cả đời' : 'Tiếp tục'}
      </button>
    </Sheet>
  );
}

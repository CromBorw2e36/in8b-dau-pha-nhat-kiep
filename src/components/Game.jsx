import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import G from '../game/data.js';
import { tick, choose, choicesOf, hints, save, EV } from '../game/engine.js';
import { lifeOf, realmLabel, canAlch, fmtGold, cp } from '../game/util.js';
import { Bar, Hints, Deltas, Sheet } from './ui.jsx';
import { Seal, FOCUS_G, EV_G, NUM_G } from './glyphs.jsx';
import Bag from './Bag.jsx';
import Sect from './Sect.jsx';

// ms mỗi lượt. Mặc định chậm để kịp đọc; tốc độ được nhớ giữa các lần chơi.
const SPEEDS = [3200, 2000, 1100, 500];
const SPEED_LABEL = ['1×', '1.5×', '3×', '6×'];
const SPEED_KEY = 'dpnk_speed';
const readSpeed = () => { try { const v = +localStorage.getItem(SPEED_KEY); return v >= 0 && v < SPEEDS.length ? v : 0; } catch { return 0; } };

export default function Game({ s, ver, bump, onEnd, onHome }) {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeedRaw] = useState(readSpeed);
  const setSpeed = (fn) => setSpeedRaw((v) => { const n = fn(v); try { localStorage.setItem(SPEED_KEY, n); } catch {} return n; });
  const [sectOpen, setSectOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [peek, setPeek] = useState(false); // tạm ẩn bảng quyết định để xem thông số
  const feed = useRef(null);

  // Mỗi quyết định mới đều hiện bảng ra trước
  useEffect(() => { setPeek(false); }, [s.pending, s.needFocus, result]);

  const blocked = paused || s.dead || s.pending || s.needFocus || focusOpen || result || bagOpen || sectOpen;

  useEffect(() => {
    if (blocked) return;
    const id = setTimeout(() => { tick(s); save(s); bump(); }, SPEEDS[speed] * (s.started ? 1 : 0.6));
    return () => clearTimeout(id);
  }, [ver, blocked, speed]);

  useEffect(() => {
    if (s.dead && !result) { const id = setTimeout(onEnd, 1400); return () => clearTimeout(id); }
  }, [s.dead, result]);

  useLayoutEffect(() => {
    const el = feed.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [ver, s.log.length]);

  // Phím tắt: Space = tạm dừng, Esc = xem thông số, 1–4 = chọn
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); setPaused((p) => !p); }
      if (e.key === 'Escape' && (s.pending || s.needFocus || result) && !bagOpen) setPeek((p) => !p);
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

  return (
    <div className="screen game">
      <header className="hud">
        <div className="hud-top">
          <button className="icon-btn home" onClick={onHome} aria-label="Về trang chủ">‹</button>
          <div className="who">
            <div className="who-name">{s.name}</div>
            <div className="who-sub">{s.faction || 'Tán tu'}{s.evil ? ' · ma đạo' : ''}</div>
          </div>
          <div className="realm-badge" data-r={s.R}><span>{realmLabel(s)}</span></div>
        </div>

        <div className="meters">
          <div className="meter">
            <div className="meter-head"><span>{s.age} tuổi</span><span className="muted">/ {life === Infinity ? '∞' : life}</span></div>
            <Bar value={s.age} max={life === Infinity ? s.age : life} tone="var(--life)" thin />
          </div>
          {s.started && (
            <div className="meter">
              <div className="meter-head"><span>Đấu khí</span><span className={s.ready ? 'hot' : 'muted'}>{s.ready ? 'Bình cảnh!' : `${Math.floor(s.qi)}%`}</span></div>
              <Bar value={s.qi} tone="var(--qi)" thin />
            </div>
          )}
        </div>

        <div className="stats">
          {G.STATS.map((st) => (
            <div key={st.k} className="stat" data-k={st.k}>
              <div className="stat-head"><span>{st.n}</span><b>{Math.round(s[st.k])}</b></div>
              <Bar value={s[st.k]} tone={`var(--${st.k})`} />
            </div>
          ))}
        </div>

        <div className="chips scroll">
          <button className="chip gold-chip" onClick={() => setBagOpen(true)}>{fmtGold(s.gold)} kim tệ</button>
          {s.started && <span className="chip">Chiến lực {Math.round(cp(s))}</span>}
          {s.gong > 0 && <span className="chip">Công pháp {G.GRADES[s.gong]}</span>}
          {s.skill > 0 && <span className="chip">Đấu kỹ {G.GRADES[s.skill]}</span>}
          {s.alch > 0 && <span className="chip gold">Luyện dược sư {s.alch} phẩm</span>}
          {s.fires.map((x) => <span key={x} className="chip fire">Dị hỏa · {x}</span>)}
          {s.salary > 0 && <span className="chip">Khách khanh {s.flags.guest}</span>}
          {s.sect && <button className="chip gold" onClick={() => setSectOpen(true)}>Tông chủ {s.sect.name} · {s.sect.members} đệ tử</button>}
          {Object.keys(s.land || {}).length > 0 && <span className="chip">Lãnh địa {Object.keys(s.land).length}</span>}
          {s.gear?.wep && <span className="chip">{s.gear.wep.n}</span>}
          {s.dwelling > 0 && <span className="chip">{G.DWELLING[s.dwelling][1]}</span>}
          {s.master && <span className="chip">Có sư phụ</span>}
          {s.partner && <span className="chip">Đạo lữ {s.partner.name}</span>}
          {s.companion && <span className="chip">{s.companion}</span>}
        </div>
      </header>

      <main className="feed" ref={feed}>
        {s.log.map((e, i) => (
          <div key={i}>
            {e.st && <div className="divider"><span>{e.st}</span></div>}
            <div className="yr">
              <div className="yr-age">{e.a}</div>
              <div className="yr-body">
                {e.items.map((it, j) => <p key={j} className={it.k || ''}>{it.t}</p>)}
              </div>
            </div>
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
        <button className="icon-btn g-btn" onClick={() => setBagOpen(true)} aria-label="Túi đồ">Túi</button>
        <button className="icon-btn g-btn" disabled={!s.started || s.dead} onClick={() => setSectOpen(true)} aria-label="Tông môn và lãnh địa">Môn</button>
        <button className="icon-btn" onClick={() => setSpeed((v) => (v + 1) % SPEEDS.length)} aria-label="Tốc độ">{SPEED_LABEL[speed]}</button>
      </footer>

      {bagOpen && <Bag s={s} bump={bump} onClose={() => setBagOpen(false)} />}
      {sectOpen && <Sect s={s} bump={bump} onClose={() => setSectOpen(false)} />}

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
                  <small>{locked ? (x.sect ? 'Cần khai tông lập phái trước (nút «Môn»)' : 'Cần hỏa thuộc tính (hoặc dị hỏa, sư phụ) và linh hồn lực mạnh') : x.d}</small>
                  {!locked && <Hints h={h} />}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}

      {ev && !result && !s.dead && !peek && !showFocus && (
        <Sheet mark={EV_G[ev.id]} onPeek={() => setPeek(true)}>
          <Seal ch={EV_G[ev.id] || 'Sự'} size="lg" className="ev-seal" />
          <p className="eyebrow">{s.age} tuổi · {realmLabel(s)}</p>
          {ev.title && <h3>{ev.title(s)}</h3>}
          <p className="ev-text">{ev.text(s)}</p>
          <div className="choices">
            {choicesOf(s).map((ch, i) => (
              <button key={i} className="choice" onClick={() => pickChoice(ch)}>
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
      )}

      {result && !peek && (
        <Sheet mark={result.dead ? 'Tử' : result.ok === false ? 'Bại' : result.ok ? 'Thành' : null} onPeek={() => setPeek(true)}>
          {(result.dead || result.ok !== null) && (
            <div className={'result-badge ' + (result.dead ? 'death' : result.ok ? 'ok' : 'fail')}>
              <Seal ch={result.dead ? 'Tử' : result.ok ? 'Thành' : 'Bại'} tone={result.ok && !result.dead ? 'red' : 'ink'} size="lg" />
              <span>{result.dead ? 'Vẫn lạc' : result.ok ? 'Thành công' : 'Thất bại'}</span>
            </div>
          )}
          {result.text && <p className="ev-text">{result.text}</p>}
          {result.dead && <p className="ev-text death-text">{s.cause}.</p>}
          <Deltas d={result.delta} />
          <button className="btn primary" autoFocus onClick={() => { setResult(null); if (s.dead) onEnd(); }}>
            {result.dead ? 'Xem lại cả đời' : 'Tiếp tục'}
          </button>
        </Sheet>
      )}
    </div>
  );
}

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import G from '../game/data.js';
import { tick, choose, choicesOf, hints, save, EV, breakNow } from '../game/engine.js';
import { lifeOf, realmLabel, canAlch, cp, retire, holding, holdLeft } from '../game/util.js';
import { smithLv } from '../game/forge.js';
import { troopCount } from '../game/army.js';
import { attackBlock, conquerP, regionDef, landCount } from '../game/sect.js';
import { checkAch } from '../game/ach.js';
import { Bar, Hints, Deltas, Sheet, StatHelp, Toasts, STAT_NAME } from './ui.jsx';
import { Seal, EV_G, NUM_G } from './glyphs.jsx';
import { Ico, STAT_I, NAV_I, FOCUS_I, KIND_I, UI_I } from './icons.jsx';
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
  const [retireArm, setRetireArm] = useState(false);
  const feed = useRef(null);
  const seen = useRef(s.log.length);
  const goldRef = useCountUp(s.gold);

  const toast = (t, k, icon) => setToasts((l) => [...l, { id: Math.random(), t, k, icon }].slice(-4));

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
      if (it.k === 'up') toast(it.t, 'up', UI_I.up);
      else if (it.k === 'key' && it.t.length < 140) toast(it.t, 'key', KIND_I.key);
    }
    for (const a of checkAch(s)) toast(a.n, 'ach', UI_I.ach);
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
  const topped = s.R >= 11 && s.step >= 100;

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

  // Các chỉ báo nhỏ trên HUD: icon + số, di chuột/nhấn giữ để xem tên
  const chips = [
    // [icon, giá trị, nhãn ngắn, chú thích đầy đủ]
    s.started && [UI_I.cp, Math.round(cp(s)), 'Chiến lực', 'Chiến lực của bản thân'],
    s.fame >= 1 && [UI_I.fame, Math.round(s.fame), 'Danh vọng', 'Danh vọng'],
    s.gong > 0 && [UI_I.gong, G.GRADES[s.gong], 'Công pháp', `Công pháp ${G.GRADES[s.gong]}`],
    s.skill > 0 && [UI_I.skill, G.GRADES[s.skill], 'Đấu kỹ', `Đấu kỹ ${G.GRADES[s.skill]}`],
    s.alch > 0 && [UI_I.alch, `${s.alch} phẩm`, 'Luyện dược', `Luyện dược sư ${s.alch} phẩm`],
    s.fires.length > 0 && [UI_I.fire, s.fires.length, 'Dị hỏa', `Dị hỏa: ${s.fires.join(', ')}`],
    s.sect && [UI_I.members, s.sect.members, 'Đệ tử', `${s.sect.name} · ${s.sect.members} đệ tử`],
    landCount(s) > 0 && [UI_I.land, `${landCount(s)}/${G.REGIONS.length}`, 'Lãnh địa', 'Lãnh địa đã chiếm'],
    troopCount(s) > 0 && [UI_I.army, troopCount(s), 'Quân', 'Quân đội'],
    smithLv(s) > 0 && [NAV_I.forge, smithLv(s), 'Lò rèn', `Lò rèn cấp ${smithLv(s)}`],
  ].filter(Boolean);

  return (
    <div className="screen game">
      <header className="hud">
        <div className="hud-top">
          <button className="icon-btn home" onClick={onHome} aria-label="Về trang chủ" title="Về trang chủ"><Ico i={UI_I.home} size={18} /></button>
          <div className="who">
            <div className="who-name">{s.name}</div>
            <div className="who-sub">{s.faction || 'Tán tu'}{s.evil ? ' · ma đạo' : ''}{s.heirOf ? ' · hậu duệ Đế' : ''}</div>
          </div>
          <div className="realm-badge" data-r={s.R}><Ico i={UI_I.realm} size={14} /><span>{realmLabel(s)}</span></div>
        </div>

        <div className="meters">
          <div className="meter" title="Tuổi / thọ nguyên">
            <Ico i={STAT_I.life} size={16} className="m-ico" /><span className="m-name">Tuổi</span>
            <Bar value={s.age} max={life === Infinity ? s.age : life} tone="var(--life)" thin />
            <span className="m-val num">{s.age}<small>/{life === Infinity ? '∞' : life}</small></span>
          </div>
          {s.started && (
            <div className={'meter' + (s.ready ? ' hot' : '')} title="Tiến độ tu luyện">
              <Ico i={STAT_I.qi} size={16} className="m-ico" /><span className="m-name">Đấu khí</span>
              <Bar value={topped ? 100 : s.qi} tone="var(--qi)" thin />
              <span className="m-val num">{topped ? 'Viên mãn' : s.ready ? (holding(s) ? `Củng cố · ${holdLeft(s)} lượt` : 'Bình cảnh') : `${Math.floor(s.qi)}%`}</span>
            </div>
          )}
          {s.ready && holding(s) && !s.dead && (
            <button className="break-btn" onClick={() => { if (breakNow(s)) { save(s); bump(); } }} title="Xung kích cảnh giới mới ngay bây giờ">
              <Ico i={UI_I.up} size={16} /> Xung kích {G.REALMS[s.R + 1]?.n}
            </button>
          )}
        </div>

        <button className="stats" onClick={() => setPanel('help')} title="Bấm để xem ý nghĩa các chỉ số" aria-label="Chỉ số, bấm để xem giải thích">
          {G.STATS.map((st) => (
            <div key={st.k} className="stat" style={{ '--c': `var(--${st.k})` }}>
              <Ico i={STAT_I[st.k]} size={18} />
              <span className="s-name">{STAT_NAME[st.k]}</span>
              <b className="num">{Math.round(s[st.k])}</b>
              <Bar value={s[st.k]} tone={`var(--${st.k})`} />
            </div>
          ))}
        </button>

        <div className="res-row">
          <button className="res gold" onClick={() => setPanel('bag')} title="Kim tệ"><Ico i={UI_I.gold} size={16} /><span ref={goldRef} className="num" /><span className="r-name">kim tệ</span></button>
          <div className="res-scroll">
            {chips.map(([i, v, n, t]) => <span key={n} className="res" title={t}><Ico i={i} size={15} /><span className="r-name">{n}</span><b className="num">{v}</b></span>)}
          </div>
          {s.R >= 11 && !s.dead && (
            <button className={'res retire' + (retireArm ? ' armed' : '')} title="Quy ẩn: khép lại kiếp này với danh hiệu Đấu Đế"
              onClick={() => { if (!retireArm) { setRetireArm(true); setTimeout(() => setRetireArm(false), 3000); return; } retire(s); save(s); bump(); }}>
              <Ico i={UI_I.retire} size={16} />{retireArm ? 'Chắc chắn?' : 'Quy ẩn'}
            </button>
          )}
        </div>
      </header>

      <div className="feed-bar">
        <Ico i={KIND_I.key} size={16} /><span className="fb-title">Sử ký</span>
        <button className={'feed-toggle' + (major ? ' on' : '')} onClick={toggleMajor} aria-pressed={major} title="Chỉ xem đại sự">
          <Ico i={UI_I.ach} size={14} />{major ? 'Đại sự' : 'Tất cả'}
        </button>
      </div>
      <main className="feed" ref={feed}>
        {rows.map((r) => r.group ? (
          <button key={'g' + r.group[0]} className="calm-group" onClick={() => setOpen((o) => ({ ...o, [r.group[0]]: true }))}>
            <span className="yr-age num">{s.log[r.group[0]].a}–{s.log[r.group[1]].a}</span>
            <span>⋯ {r.group[1] - r.group[0] + 1} năm bình lặng</span>
          </button>
        ) : (
          <div key={r.i}>
            {r.e.st && <div className="divider"><span>{r.e.st}</span></div>}
            {r.e.items.length > 0 && (
              <div className="yr">
                <div className="yr-age num">{r.e.a}</div>
                <div className="yr-body">
                  {r.e.items.map((it, j) => (
                    <p key={j} className={'log ' + (it.k || '')}>
                      {KIND_I[it.k] && <Ico i={KIND_I[it.k]} size={15} className="log-ico" />}
                      <span>{it.t}</span>
                    </p>
                  ))}
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
          <button className="btn primary" onClick={() => setPeek(false)}>Quay lại</button>
        </div>
      )}

      <footer className="ctrl">
        <div className="ctrl-row">
          <button className="icon-btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'} title={paused ? 'Tiếp tục (Space)' : 'Tạm dừng (Space)'}>
            <Ico i={paused ? UI_I.play : UI_I.pause} size={20} />
          </button>
          <button className="focus-btn" disabled={!s.started || s.dead} onClick={() => setFocusOpen(true)} title="Đổi việc đang làm">
            <span className="f-ico"><Ico i={s.started ? FOCUS_I[s.focus] || UI_I.help : FOCUS_I.tinh} size={22} /></span>
            <span className="f-name">{s.started ? f?.n || 'Chọn việc' : 'Thơ ấu'}</span>
            <Ico i={UI_I.speed} size={14} className="f-more" />
          </button>
          <button className="icon-btn speed" onClick={() => setSpeed((v) => (v + 1) % SPEEDS.length)} aria-label="Tốc độ" title="Tốc độ thời gian">
            <Ico i={UI_I.speed} size={16} /><small>{SPEED_LABEL[speed]}</small>
          </button>
        </div>
        <nav className="nav" aria-label="Quản lý">
          {[
            ['bag', 'Túi', true],
            ['forge', 'Rèn', s.started && !s.dead],
            ['market', 'Chợ', true],
            ['sect', 'Môn', s.started && !s.dead],
          ].map(([id, n, ok]) => (
            <button key={id} className={'nav-btn' + (dots[id] ? ' alert' : '')} disabled={!ok} onClick={() => setPanel(id)} aria-label={n}>
              <Ico i={NAV_I[id]} size={24} />
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
        <Sheet onClose={s.needFocus ? undefined : () => setFocusOpen(false)} onPeek={s.needFocus ? () => setPeek(true) : undefined}>
          <p className="eyebrow">{s.needFocus ? 'Con đường tu luyện bắt đầu' : realmLabel(s)}</p>
          <h3>Dành thời gian cho việc gì?</h3>
          <div className="focus-grid">
            {G.FOCUS.map((x) => {
              const locked = (x.alch && !canAlch(s)) || (x.sect && !s.sect);
              const h = hints({ fx: { ...x.fx, ...(x.money ? { gold: x.money } : {}), qi: x.qi - 0.9 } });
              return (
                <button key={x.id} className={'focus-card' + (s.focus === x.id ? ' active' : '')} disabled={locked} onClick={() => pickFocus(x.id)}
                  title={locked ? (x.sect ? 'Cần khai tông lập phái trước' : 'Cần hỏa thuộc tính (hoặc dị hỏa, sư phụ) và linh hồn lực mạnh') : x.d}>
                  <span className="fc-ico"><Ico i={locked ? UI_I.lock : FOCUS_I[x.id]} size={30} /></span>
                  <b>{x.n}</b>
                  {!locked ? <Hints h={h} /> : <small>{x.sect ? 'Cần tông môn' : 'Cần hỏa thuộc tính'}</small>}
                </button>
              );
            })}
          </div>
          {f && <p className="note center">{f.d}</p>}
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

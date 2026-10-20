// Các cảnh diễn toàn màn hình: giao chiến, thiên mệnh (may rủi), xung kích cảnh giới.
// Mọi cảnh đều chạm để bỏ qua; máy bật giảm chuyển động thì kết thúc ngay.
import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import G from '../game/data.js';
import { cp } from '../game/util.js';
import Avatar from './Avatar.jsx';
import { Seal } from './glyphs.jsx';
import { Ico, UI_I, STAT_I, BEAST_I, EMP_I } from './icons.jsx';
import { calm, stamp, drawStroke } from './motion.js';
import { at, burst, sparks, ring, vortex, flash, shake, PAL } from '../fx/fx.js';
import { play } from '../fx/sfx.js';

// Đối thủ theo sự kiện: ma thú, linh hồn, hay người
const BEASTLY = { beast: BEAST_I.lang, beast_emperor: BEAST_I.giao, mount_tame: BEAST_I.su, companion: BEAST_I.ho };
const SOULISH = new Set(['hon', 'hon_hunt', 'hon_invasion']);
// Đánh thành, giữ thành: đối thủ là cả một thế lực
const WARLIKE = { conquer: UI_I.power, raid: UI_I.army, sect_war: UI_I.army, mutiny: UI_I.army, drill: UI_I.army, ancient_ally: UI_I.army };
export const foeIcon = (evId) => BEASTLY[evId] || WARLIKE[evId] || (SOULISH.has(evId) ? STAT_I.soul : evId === 'dechien' ? EMP_I.de : UI_I.foe);

// Hẹn giờ một chuỗi bước; trả về hàm hủy
function useScript(steps, onDone, deps = []) {
  const done = useRef(false);
  const finish = () => { if (!done.current) { done.current = true; onDone(); } };
  useEffect(() => {
    if (calm()) { const id = setTimeout(finish, 350); return () => clearTimeout(id); }
    const ids = steps().map(([ms, fn]) => setTimeout(fn, ms));
    return () => ids.forEach(clearTimeout);
  }, deps);
  return finish;
}

// Số sát thương bay lên tại một phần tử
function hitNum(host, el, text, cls) {
  if (!host || !el) return;
  const r = el.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  const n = document.createElement('span');
  n.className = 'hit-num ' + cls;
  n.textContent = text;
  n.style.left = `${r.left - h.left + r.width / 2 + (Math.random() - 0.5) * 40}px`;
  n.style.top = `${r.top - h.top + r.height * 0.3}px`;
  host.appendChild(n);
  animate(n, { translateY: [0, -70], scale: [1.6, 1], opacity: [1, 0], duration: 900, ease: 'outCubic', onComplete: () => n.remove() });
}

// ───── Giao chiến ─────
export function Clash({ s, ev, name, p, ok, onDone }) {
  const host = useRef(null);
  const me = useRef(null);
  const foe = useRef(null);
  const vs = useRef(null);
  const verdict = useRef(null);
  const FoeI = foeIcon(ev?.id);
  const myCp = Math.round(cp(s));

  const finish = useScript(() => {
    const mid = () => at(vs.current);
    const lunge = (who, dir) => animate(who, { translateX: [0, dir * 70, 0], duration: 320, ease: 'inOutQuad' });
    const knock = (who, dir) => animate(who, { translateX: [0, dir * 18, 0], rotate: [0, dir * 4, 0], duration: 260, ease: 'outQuad' });
    // Ba lần trao đổi: người thắng ra đòn nhiều hơn
    const seq = ok ? [1, -1, 1] : [-1, 1, -1];
    const steps = [
      [0, () => {
        play('whoosh');
        animate(me.current, { translateX: ['-60vw', 0], opacity: [0, 1], duration: 460, ease: 'outCubic' });
        animate(foe.current, { translateX: ['60vw', 0], opacity: [0, 1], duration: 460, ease: 'outCubic' });
      }],
      [480, () => { stamp(vs.current); play('drum'); }],
    ];
    seq.forEach((d, i) => {
      const t = 950 + i * 430;
      steps.push([t, () => lunge(d > 0 ? me.current : foe.current, d)]);
      steps.push([t + 160, () => {
        play(i === 1 ? 'hit' : 'clash');
        sparks(mid(), { n: 30, spread: Math.PI * 2, dir: 0, g: 0.18 });
        const target = d > 0 ? foe.current : me.current;
        knock(target, d);
        hitNum(host.current, target, `−${Math.round(myCp * (0.3 + Math.random() * 0.4) + 3)}`, d > 0 ? 'good' : 'bad');
      }]);
    });
    steps.push([2380, () => {
      const loser = ok ? foe.current : me.current;
      const d = ok ? 1 : -1;
      lunge(ok ? me.current : foe.current, d);
      play('boom');
      flash(ok ? '#f4d58f' : '#ea6a4e', 0.5, 500);
      ring(mid(), { color: ok ? '#f4d58f' : '#ea6a4e', to: 340, n: 2, gap: 120 });
      burst(at(loser), { n: 60, colors: ok ? PAL.gold : PAL.red, speed: 9 });
      shake(host.current, 12);
      animate(loser, { translateX: [0, d * 120], rotate: [0, d * 18], opacity: [1, 0.35], duration: 600, ease: 'outCubic' });
    }]);
    steps.push([2700, () => { verdict.current.style.opacity = 1; stamp(verdict.current); play(ok ? 'win' : 'fail'); }]);
    steps.push([3500, () => finish()]);
    return steps;
  }, onDone);

  return (
    <div className="stage clash" ref={host} onClick={() => finish()}>
      <div className="cl-slash" aria-hidden="true" />
      <div className="cl-side me" ref={me}>
        <Avatar s={s} size={150} beasts={false} still />
        <b>{s.name}</b>
        <small className="num"><Ico i={UI_I.cp} size={13} /> {myCp}</small>
      </div>
      <div className="cl-mid">
        <span ref={vs} className="seal seal-red seal-lg">Chiến</span>
        <small className="num">Thắng {Math.round(p * 100)}%</small>
      </div>
      <div className="cl-side foe" ref={foe}>
        <span className="cl-foe"><FoeI size={120} /></span>
        <b>{name || 'Đối thủ'}</b>
      </div>
      <div className="st-verdict" ref={verdict}><Seal ch={ok ? 'Thắng' : 'Bại'} tone={ok ? 'gold' : 'ink'} size="xl" /></div>
      <span className="st-skip">Chạm để bỏ qua</span>
    </div>
  );
}

// Cung tròn SVG từ góc a0 tới a1 (độ, 0 ở đỉnh, theo chiều kim đồng hồ)
function arc(cx, cy, r, a0, a1) {
  const pt = (a) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = pt(a0);
  const [x1, y1] = pt(a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

// ───── Thiên mệnh: vòng xoay may rủi, phần vàng là tỷ lệ thành công ─────
export function Fate({ p, ok, label, onDone }) {
  const needle = useRef(null);
  const disc = useRef(null);
  const verdict = useRef(null);
  const sweep = Math.max(4, Math.min(356, p * 360));
  // Kim dừng trong vùng vàng nếu thành, ngoài vùng vàng nếu bại
  const land = useRef(ok ? sweep * (0.12 + Math.random() * 0.76) : sweep + (360 - sweep) * (0.12 + Math.random() * 0.76)).current;

  const finish = useScript(() => [
    [0, () => { play('dice'); animate(disc.current, { scale: [0.4, 1], opacity: [0, 1], duration: 380, ease: 'outBack(1.6)' }); }],
    [200, () => animate(needle.current, { rotate: [0, 360 * 4 + land], duration: 1500, ease: 'outCubic' })],
    [500, () => play('dice')],
    [1000, () => play('dice')],
    [1720, () => {
      play(ok ? 'win' : 'fail');
      if (ok) { burst(disc.current, { n: 50, colors: PAL.gold, speed: 7 }); ring(disc.current, { to: 220 }); }
      else { burst(disc.current, { n: 30, colors: PAL.ink, kind: 'ink', speed: 4, g: 0 }); shake(disc.current, 6); }
      verdict.current.style.opacity = 1;
      stamp(verdict.current);
    }],
    [2500, () => finish()],
  ], onDone);

  return (
    <div className="stage fate" onClick={() => finish()}>
      <p className="eyebrow">{label || 'Thiên mệnh'}</p>
      <div className="fate-disc" ref={disc}>
        <svg viewBox="0 0 200 200" aria-label={`Tỷ lệ thành công ${Math.round(p * 100)}%`}>
          <circle cx="100" cy="100" r="86" fill="#0c0806" stroke="#8a672a" strokeWidth="2" />
          <path d={arc(100, 100, 74, 0, 360 - 0.01)} stroke="#6d1a0e" strokeWidth="16" fill="none" opacity=".75" />
          <path d={arc(100, 100, 74, 0, sweep)} stroke="#f4d58f" strokeWidth="16" fill="none" />
          {Array.from({ length: 24 }, (_, i) => <line key={i} x1="100" y1="10" x2="100" y2={i % 6 ? 16 : 20} stroke="#d9ad5b" strokeWidth="1.5" transform={`rotate(${i * 15} 100 100)`} />)}
          <g ref={needle} style={{ transformOrigin: '100px 100px' }}>
            <path d="M100 22 L106 100 L100 112 L94 100 Z" fill="#ea6a4e" stroke="#fff3df" strokeWidth="1.2" />
          </g>
          <circle cx="100" cy="100" r="16" fill="#1b130e" stroke="#d9ad5b" strokeWidth="2" />
        </svg>
        <span className="fate-ico"><Ico i={UI_I.realm} size={22} /></span>
      </div>
      <b className="fate-p num">{Math.round(p * 100)}%</b>
      <div className="st-verdict" ref={verdict}><Seal ch={ok ? 'Thành' : 'Bại'} tone={ok ? 'red' : 'ink'} size="xl" /></div>
      <span className="st-skip">Chạm để bỏ qua</span>
    </div>
  );
}

// ───── Xung kích cảnh giới ─────
export function Break({ s, ok, onDone }) {
  const core = useRef(null);
  const name = useRef(null);
  const crack = useRef(null);
  const realm = G.REALMS[s.R];

  const finish = useScript(() => [
    [0, () => {
      play('charge');
      vortex(at(core.current), { n: 160, radius: Math.min(innerWidth, 640) * 0.55, colors: s.R >= 7 ? PAL.fire : s.R >= 4 ? PAL.soul : PAL.qi, life: 1600 });
      animate(core.current, { scale: [0.6, 1.25], duration: 1500, ease: 'inQuad' });
    }],
    [1550, () => {
      const c = at(core.current);
      if (ok) {
        play('boom');
        flash('#fff3df', 0.9, 700);
        ring(c, { color: '#f4d58f', to: Math.max(innerWidth, innerHeight) * 0.7, n: 3, gap: 160, width: 6 });
        burst(c, { n: 140, colors: PAL.gold, speed: 12, life: 1300, g: 0.04 });
        shake(null, 14, 520);
        animate(core.current, { scale: [1.25, 1], duration: 600, ease: 'outBack(2)' });
        animate(name.current, { opacity: [0, 1], scale: [1.8, 1], letterSpacing: ['0.6em', '0.08em'], duration: 900, ease: 'outCubic' });
      } else {
        play('shatter');
        flash('#ea6a4e', 0.35, 500);
        crack.current.style.opacity = 1;
        drawStroke(crack.current.querySelectorAll('path'), { duration: 380, step: 40 });
        burst(c, { n: 50, colors: PAL.ink, kind: 'ink', speed: 6, g: 0.1 });
        shake(null, 10);
        animate(core.current, { scale: [1.25, 0.9], opacity: [1, 0.5], rotate: [0, -8], duration: 500, ease: 'outQuad' });
        animate(name.current, { opacity: [0, 1], translateY: [10, 0], duration: 600, ease: 'outQuad' });
      }
    }],
    [ok ? 2300 : 2000, () => play(ok ? 'up' : 'fail')],
    [3600, () => finish()],
  ], onDone);

  return (
    <div className={'stage break ' + (ok ? 'ok' : 'fail')} onClick={() => finish()}>
      <div className="bk-core" ref={core}><Seal ch="Phá" tone={ok ? 'gold' : 'red'} size="xl" /></div>
      <svg className="bk-crack" ref={crack} viewBox="0 0 200 200" aria-hidden="true">
        <path d="M100 100 L72 62 L60 30 M72 62 L40 58" />
        <path d="M100 100 L138 70 L150 26 M138 70 L174 82" />
        <path d="M100 100 L94 150 L110 186 M94 150 L62 170" />
        <path d="M100 100 L148 128 L182 140" />
      </svg>
      <div className="bk-name" ref={name}>
        {ok ? <><small>Đột phá thành công</small><b>{realm.n}</b></> : <><small>Xung kích thất bại</small><b>Đấu khí phản phệ</b></>}
      </div>
      <span className="st-skip">Chạm để bỏ qua</span>
    </div>
  );
}

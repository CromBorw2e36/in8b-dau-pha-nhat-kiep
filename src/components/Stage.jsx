// Các cảnh diễn toàn màn hình: giao chiến, thiên mệnh (may rủi), xung kích cảnh giới.
// Mọi cảnh đều chạm để bỏ qua; máy bật giảm chuyển động thì kết thúc ngay.
import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import G from '../game/data.js';
import { cp } from '../game/util.js';
import { SKILL_CATALOG, SKILL_TIERS } from '../game/skills.js';
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

// Kích hoạt hiệu ứng nguyên tố tương ứng với Đấu Kỹ:
// Hỏa: fire burst, Lôi: electric sparks, Kim: golden flashes, Dị Hỏa: twin fire rings
export function spawnElementalFx(elem, targetPos, midPos, hostEl) {
  const tPos = targetPos || at();
  const mPos = midPos || tPos;
  const e = (elem || '').toLowerCase();

  if (e.includes('dị hỏa') || e.includes('di hoa')) {
    // Dị Hỏa: twin fire rings (song hoàn dị hỏa bạo phát)
    ring(mPos, { color: '#ff4d00', to: 420, n: 1, width: 7, life: 1100 });
    ring(mPos, { color: '#00f0ff', to: 350, n: 1, width: 6, life: 1200, gap: 110 });
    burst(tPos, { n: 100, colors: ['#ff4500', '#00f0ff', '#ffd700', '#ffffff', '#a855f7'], speed: 13, life: 1200 });
    sparks(tPos, { n: 45, colors: ['#ff4500', '#00f0ff'], speed: 12, spread: Math.PI * 2 });
    flash('#ff6b35', 0.8, 600);
    shake(hostEl, 15, 520);
  } else if (e.includes('hỏa') || e.includes('hoa') || e.includes('fire')) {
    // Hỏa: fire burst (hỏa diễm cuồng bạo)
    burst(tPos, { n: 90, colors: PAL.fire, speed: 12, life: 1000, g: 0.12 });
    sparks(tPos, { n: 55, colors: PAL.fire, speed: 13, spread: Math.PI * 1.6, g: 0.22 });
    ring(mPos, { color: '#ea6a4e', to: 340, n: 2, gap: 120, width: 6 });
    flash('#ff5722', 0.65, 500);
    shake(hostEl, 13, 460);
  } else if (e.includes('lôi') || e.includes('loi') || e.includes('lightning') || e.includes('điện')) {
    // Lôi: electric sparks (lôi điện cuồng lôi)
    const lightningPal = ['#7df9ff', '#00f0ff', '#ffffff', '#bfdbfe', '#a78bfa'];
    sparks(tPos, { n: 80, colors: lightningPal, speed: 16, spread: Math.PI * 2, g: 0.04, life: 750, kind: 'spark' });
    burst(tPos, { n: 60, colors: lightningPal, speed: 14, life: 750, kind: 'spark' });
    ring(mPos, { color: '#7df9ff', to: 320, n: 2, gap: 80, width: 4 });
    flash('#7df9ff', 0.75, 400);
    shake(hostEl, 12, 420);
  } else if (e.includes('kim') || e.includes('gold')) {
    // Kim: golden flashes (kim quang chói lóa)
    flash('#ffd700', 0.9, 600);
    burst(tPos, { n: 90, colors: PAL.gold, speed: 12, life: 1100, g: 0.06 });
    sparks(tPos, { n: 50, colors: PAL.gold, speed: 11, spread: Math.PI * 2, g: 0.15 });
    ring(mPos, { color: '#f4d58f', to: 360, n: 3, gap: 100, width: 6 });
    shake(hostEl, 12, 450);
  } else if (e.includes('thổ') || e.includes('tho')) {
    // Thổ: khai sơn toái thạch
    burst(tPos, { n: 75, colors: ['#d9ad5b', '#8a672a', '#4a3520', '#fff3df'], speed: 10, g: 0.35, size: 4 });
    ring(mPos, { color: '#d9ad5b', to: 310, n: 2, gap: 130, width: 7 });
    flash('#d9ad5b', 0.55, 400);
    shake(hostEl, 15, 520);
  } else if (e.includes('nội kình') || e.includes('noi kinh')) {
    // Nội Kình: Bát Cực Băng ám kình dồn dập
    burst(tPos, { n: 85, colors: ['#e0f2fe', '#bae6fd', '#ffffff', '#38bdf8'], speed: 14, life: 850 });
    ring(tPos, { color: '#38bdf8', to: 290, n: 3, gap: 80, width: 5 });
    flash('#e0f2fe', 0.65, 450);
    shake(hostEl, 14, 480);
  } else {
    // Mặc định: chân khí bạo phát
    burst(tPos, { n: 70, colors: PAL.gold, speed: 10, life: 1000 });
    ring(mPos, { color: '#f4d58f', to: 340, n: 2, gap: 120, width: 5 });
    flash('#fff3df', 0.6, 480);
    shake(hostEl, 11, 440);
  }
}

// ───── Giao chiến ─────
export function Clash({ s, ev, name, p, ok, onDone }) {
  const host = useRef(null);
  const me = useRef(null);
  const foe = useRef(null);
  const vs = useRef(null);
  const verdict = useRef(null);
  const banner = useRef(null);
  const FoeI = foeIcon(ev?.id);
  const myCp = Math.round(cp(s));

  // 1. Tra cứu đấu kỹ bản mệnh đang kích hoạt từ s.skills?.skillId
  const activeSkill = SKILL_CATALOG.skill.find((sk) => sk.id === s?.skills?.skillId)
    || SKILL_CATALOG.skill.find((sk) => sk.tier === (s?.skill || 0))
    || SKILL_CATALOG.skill[0];

  const finish = useScript(() => {
    const mid = () => at(vs.current);
    const lunge = (who, dir) => animate(who, { translateX: [0, dir * 70, 0], duration: 320, ease: 'inOutQuad' });
    const knock = (who, dir) => animate(who, { translateX: [0, dir * 18, 0], rotate: [0, dir * 4, 0], duration: 260, ease: 'outQuad' });

    // Hiển thị banner đấu kỹ bạo kích
    const showCritBanner = () => {
      if (!banner.current) return;
      banner.current.style.opacity = 1;
      animate(banner.current, {
        scale: [0.65, 1.06, 1],
        translateY: [-24, 0],
        opacity: [0, 1],
        duration: 380,
        ease: 'outBack(2)',
      });
      play('charge');
    };

    const hideCritBanner = () => {
      if (!banner.current) return;
      animate(banner.current, {
        opacity: [1, 0],
        translateY: [0, -16],
        scale: [1, 0.92],
        duration: 300,
        ease: 'outQuad',
      });
    };

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
      // Nếu thua trận, người chơi thi triển đấu kỹ phản kích ở hiệp 2
      if (!ok && i === 1) {
        steps.push([t - 200, () => showCritBanner()]);
      }

      steps.push([t, () => lunge(d > 0 ? me.current : foe.current, d)]);
      steps.push([t + 160, () => {
        const target = d > 0 ? foe.current : me.current;
        if (d > 0 && !ok && i === 1) {
          play('boom');
          spawnElementalFx(activeSkill.elem, at(target), mid(), host.current);
          knock(target, d);
          hitNum(host.current, target, `BẠO KÍCH! −${Math.round(myCp * 0.9 + 15)}`, 'good');
        } else {
          play(i === 1 ? 'hit' : 'clash');
          sparks(mid(), { n: 30, spread: Math.PI * 2, dir: 0, g: 0.18 });
          knock(target, d);
          hitNum(host.current, target, `−${Math.round(myCp * (0.3 + Math.random() * 0.4) + 3)}`, d > 0 ? 'good' : 'bad');
        }
      }]);

      if (!ok && i === 1) {
        steps.push([t + 400, () => hideCritBanner()]);
      }
    });

    // 2. Khi thắng trận: Bật banner đấu kỹ bạo kích hoành tráng trước đòn kết liễu
    if (ok) {
      steps.push([2050, () => showCritBanner()]);
    }

    steps.push([2380, () => {
      const loser = ok ? foe.current : me.current;
      const winner = ok ? me.current : foe.current;
      const d = ok ? 1 : -1;
      lunge(winner, d);
      play('boom');

      if (ok) {
        // 3. Thi triển bạo kích nguyên tố theo hệ của Đấu Kỹ
        spawnElementalFx(activeSkill.elem, at(foe.current), mid(), host.current);
        knock(foe.current, 1);
        hitNum(host.current, foe.current, `BẠO KÍCH! −${Math.round(myCp * (1.8 + Math.random() * 0.4) + 40)}`, 'good');
        animate(foe.current, { translateX: [0, 130], rotate: [0, 18], opacity: [1, 0.3], duration: 600, ease: 'outCubic' });
      } else {
        flash('#ea6a4e', 0.5, 500);
        ring(mid(), { color: '#ea6a4e', to: 340, n: 2, gap: 120 });
        burst(at(me.current), { n: 60, colors: PAL.red, speed: 9 });
        shake(host.current, 12);
        knock(me.current, -1);
        hitNum(host.current, me.current, `−${Math.round(myCp * 1.4 + 25)}`, 'bad');
        animate(me.current, { translateX: [0, -120], rotate: [0, -18], opacity: [1, 0.35], duration: 600, ease: 'outCubic' });
      }
    }]);

    steps.push([2700, () => {
      if (ok) hideCritBanner();
      verdict.current.style.opacity = 1;
      stamp(verdict.current);
      play(ok ? 'win' : 'fail');
    }]);

    steps.push([3500, () => finish()]);
    return steps;
  }, onDone);

  return (
    <div className="stage clash" ref={host} onClick={() => finish()}>
      <div className="cl-slash" aria-hidden="true" />

      {/* Dramatic combat skill banner */}
      <div className="cl-crit-banner" ref={banner} aria-hidden="true">
        <div className="cl-crit-meta">
          <span className="cl-crit-elem" data-elem={activeSkill.elem}>{activeSkill.elem}</span>
          <span className="cl-crit-tier">{SKILL_TIERS[activeSkill.tier] || 'Đấu Kỹ'}</span>
          <span className="cl-crit-badge">TUYỆT KỸ BẠO KÍCH</span>
        </div>
        <div className="cl-crit-title">«{activeSkill.n}!»</div>
        {activeSkill.quote && <div className="cl-crit-quote">{activeSkill.quote}</div>}
      </div>

      <div className="cl-side me" ref={me}>
        <Avatar s={s} size={150} beasts={false} still />
        <b>{s.name}</b>
        <small className="num"><Ico i={UI_I.cp} size={13} /> {myCp}</small>
        <div className="cl-skill-tag" title={activeSkill.d}>
          <span className="cl-elem-dot" data-elem={activeSkill.elem} />
          <span>{activeSkill.n}</span>
        </div>
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

// 4. Bát Quái Trận & Linh Vân Phù Hoàn xoay vần quanh người chơi
const BAGUA_TRIGRAMS = [
  { sym: '☰', name: 'Càn', deg: 0 },
  { sym: '☱', name: 'Đoài', deg: 45 },
  { sym: '☲', name: 'Ly', deg: 90 },
  { sym: '☳', name: 'Chấn', deg: 135 },
  { sym: '☷', name: 'Khôn', deg: 180 },
  { sym: '☶', name: 'Cấn', deg: 225 },
  { sym: '☵', name: 'Khảm', deg: 270 },
  { sym: '☴', name: 'Tốn', deg: 315 },
];

function BaguaFormation({ baguaRef, cloudsRef }) {
  return (
    <div className="bk-formation-inner" aria-hidden="true">
      {/* Vòng linh vân xoay tròn (Swirling spiritual cloud rings) */}
      <svg className="bk-clouds-svg" ref={cloudsRef} viewBox="0 0 440 440">
        <defs>
          <radialGradient id="cloudGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#f4d58f" stopOpacity="0.22" />
            <stop offset="85%" stopColor="#ea6a4e" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#f4d58f" stopOpacity="0" />
          </radialGradient>
          {/* Mẫu hoa văn mây cuộn Tiên Hiệp (Spiritual cloud curl) */}
          <g id="cloud-curl">
            <path
              d="M-28,0 C-28,-15 -12,-26 6,-22 C24,-18 34,-2 30,14 C26,28 10,34 -4,28 C-16,22 -16,8 -6,2 C2,-3 10,2 10,8"
              fill="none"
              stroke="#f4d58f"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d="M-40,10 C-30,22 -10,28 12,24 C30,20 44,4 38,-14"
              fill="none"
              stroke="#e0602a"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.5"
            />
          </g>
        </defs>

        <circle cx="220" cy="220" r="195" fill="url(#cloudGlow)" />
        <circle cx="220" cy="220" r="185" stroke="rgba(244, 213, 143, 0.35)" strokeWidth="1.5" strokeDasharray="8 6" fill="none" />
        <circle cx="220" cy="220" r="125" stroke="rgba(244, 213, 143, 0.45)" strokeWidth="1.2" strokeDasharray="14 8" fill="none" />

        {/* Vòng mây ngoài (8 đóa linh vân) */}
        {Array.from({ length: 8 }, (_, i) => (
          <use key={`c-out-${i}`} href="#cloud-curl" transform={`rotate(${i * 45} 220 220) translate(220, 36) scale(0.95)`} />
        ))}

        {/* Vòng mây trong (6 đóa linh vân đối xứng) */}
        {Array.from({ length: 6 }, (_, i) => (
          <use key={`c-in-${i}`} href="#cloud-curl" transform={`rotate(${i * 60 + 30} 220 220) translate(220, 95) scale(0.65)`} />
        ))}
      </svg>

      {/* Bát quái trận đồ (Bagua trigram circles) */}
      <svg className="bk-bagua-svg" ref={baguaRef} viewBox="0 0 440 440">
        <circle cx="220" cy="220" r="212" stroke="rgba(217, 173, 91, 0.55)" strokeWidth="1.5" strokeDasharray="4 6" fill="none" />
        <circle cx="220" cy="220" r="204" stroke="rgba(244, 213, 143, 0.8)" strokeWidth="1.2" fill="none" />
        <circle cx="220" cy="220" r="150" stroke="rgba(244, 213, 143, 0.65)" strokeWidth="1.5" fill="none" />
        <circle cx="220" cy="220" r="142" stroke="rgba(217, 173, 91, 0.4)" strokeWidth="1" strokeDasharray="5 5" fill="none" />
        <circle cx="220" cy="220" r="76" stroke="rgba(244, 213, 143, 0.5)" strokeWidth="1.2" strokeDasharray="8 6" fill="none" />

        {/* 48 vạch tinh tú thiên tượng */}
        {Array.from({ length: 48 }, (_, i) => (
          <line
            key={`tick-${i}`}
            x1="220"
            y1="16"
            x2="220"
            y2={i % 6 === 0 ? "30" : i % 2 === 0 ? "24" : "20"}
            stroke="rgba(244, 213, 143, 0.65)"
            strokeWidth={i % 6 === 0 ? "2" : "1.2"}
            transform={`rotate(${i * 7.5} 220 220)`}
          />
        ))}

        {/* 8 Quái: Biểu tượng quái & Danh tự */}
        {BAGUA_TRIGRAMS.map((t) => (
          <g key={t.name} transform={`rotate(${t.deg} 220 220) translate(220, 56)`}>
            <text
              textAnchor="middle"
              y="0"
              fill="#fff3df"
              fontSize="26"
              fontWeight="bold"
              style={{ filter: 'drop-shadow(0 0 8px rgba(244, 213, 143, 0.8))' }}
            >
              {t.sym}
            </text>
            <text
              textAnchor="middle"
              y="18"
              fill="#d9ad5b"
              fontSize="11"
              fontWeight="bold"
              letterSpacing="0.05em"
              style={{ fontFamily: 'var(--ui)' }}
            >
              {t.name}
            </text>
          </g>
        ))}

        {/* Cung nối âm dương giữa các quái */}
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={`arc-${i}`}
            d={`M ${220 + 146 * Math.sin(((i * 45 + 10) * Math.PI) / 180)} ${220 - 146 * Math.cos(((i * 45 + 10) * Math.PI) / 180)} A 146 146 0 0 1 ${220 + 146 * Math.sin(((i * 45 + 35) * Math.PI) / 180)} ${220 - 146 * Math.cos(((i * 45 + 35) * Math.PI) / 180)}`}
            stroke="rgba(217, 173, 91, 0.65)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </svg>
    </div>
  );
}

// ───── Xung kích cảnh giới (Breakthrough) ─────
export function Breakthrough({ s, ok, onDone }) {
  const formation = useRef(null);
  const bagua = useRef(null);
  const clouds = useRef(null);
  const player = useRef(null);
  const core = useRef(null);
  const name = useRef(null);
  const crack = useRef(null);
  const realm = G.REALMS[s.R];

  const finish = useScript(() => [
    [0, () => {
      play('charge');
      vortex(at(core.current), {
        n: 180,
        radius: Math.min(innerWidth, 640) * 0.55,
        colors: s.R >= 7 ? PAL.fire : s.R >= 4 ? PAL.soul : PAL.qi,
        life: 1600,
      });
      animate(core.current, { scale: [0.6, 1.25], duration: 1500, ease: 'inQuad' });
      if (player.current) {
        animate(player.current, { translateY: [0, -12], duration: 1500, ease: 'inQuad' });
      }
      if (bagua.current) {
        animate(bagua.current, { rotate: [0, 180], duration: 1550, ease: 'inQuad' });
      }
      if (clouds.current) {
        animate(clouds.current, { rotate: [0, -220], scale: [0.9, 1.15], duration: 1550, ease: 'inQuad' });
      }
    }],
    [1550, () => {
      const c = at(core.current);
      if (ok) {
        play('boom');
        flash('#fff3df', 0.9, 700);
        ring(c, { color: '#f4d58f', to: Math.max(innerWidth, innerHeight) * 0.7, n: 3, gap: 160, width: 6 });
        ring(c, { color: '#ea6a4e', to: Math.max(innerWidth, innerHeight) * 0.45, n: 2, gap: 120, width: 4 });
        burst(c, { n: 150, colors: PAL.gold, speed: 13, life: 1400, g: 0.04 });
        shake(null, 14, 520);
        animate(core.current, { scale: [1.25, 1], duration: 600, ease: 'outBack(2)' });
        if (player.current) {
          animate(player.current, { translateY: [-12, 0], scale: [1.05, 1], duration: 600, ease: 'outBack(1.5)' });
        }
        if (formation.current) {
          animate(formation.current, { scale: [1, 1.06, 1], duration: 900, ease: 'outCubic' });
        }
        animate(name.current, { opacity: [0, 1], scale: [1.8, 1], letterSpacing: ['0.6em', '0.08em'], duration: 900, ease: 'outCubic' });
      } else {
        play('shatter');
        flash('#ea6a4e', 0.4, 500);
        crack.current.style.opacity = 1;
        drawStroke(crack.current.querySelectorAll('path'), { duration: 380, step: 40 });
        burst(c, { n: 60, colors: PAL.ink, kind: 'ink', speed: 6, g: 0.1 });
        burst(c, { n: 40, colors: PAL.red, speed: 7, g: 0.2 });
        shake(null, 12);
        animate(core.current, { scale: [1.25, 0.9], opacity: [1, 0.5], rotate: [0, -8], duration: 500, ease: 'outQuad' });
        if (player.current) {
          animate(player.current, { translateY: [-12, 8], rotate: [0, -5, 0], opacity: [1, 0.65], duration: 600, ease: 'outQuad' });
        }
        if (formation.current) {
          animate(formation.current, { opacity: [1, 0.35], rotate: '+=30deg', duration: 600, ease: 'outQuad' });
        }
        animate(name.current, { opacity: [0, 1], translateY: [10, 0], duration: 600, ease: 'outQuad' });
      }
    }],
    [ok ? 2300 : 2000, () => play(ok ? 'up' : 'fail')],
    [3600, () => finish()],
  ], onDone);

  return (
    <div className={'stage break ' + (ok ? 'ok' : 'fail')} onClick={() => finish()}>
      <div className="bk-stage-wrap">
        <div className="bk-formation-wrap" ref={formation}>
          <BaguaFormation baguaRef={bagua} cloudsRef={clouds} />
        </div>

        <div className="bk-player-wrap" ref={player}>
          <div className="bk-avatar-box">
            <Avatar s={s} size={140} still beasts={false} />
            <div className="bk-qi-glow" />
          </div>
          <div className="bk-core" ref={core}>
            <Seal ch="Phá" tone={ok ? 'gold' : 'red'} size="xl" />
          </div>
        </div>

        <svg className="bk-crack" ref={crack} viewBox="0 0 200 200" aria-hidden="true">
          <path d="M100 100 L72 62 L60 30 M72 62 L40 58" />
          <path d="M100 100 L138 70 L150 26 M138 70 L174 82" />
          <path d="M100 100 L94 150 L110 186 M94 150 L62 170" />
          <path d="M100 100 L148 128 L182 140" />
        </svg>
      </div>

      <div className="bk-name" ref={name}>
        {ok ? <><small>Đột phá thành công</small><b>{realm.n}</b></> : <><small>Xung kích thất bại</small><b>Đấu khí phản phệ</b></>}
      </div>
      <span className="st-skip">Chạm để bỏ qua</span>
    </div>
  );
}

export const Break = Breakthrough;

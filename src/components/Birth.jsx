import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import G from '../game/data.js';
import { rootOdds } from '../game/engine.js';
import { trait } from '../game/util.js';
import { Seal, TRAIT_G } from './glyphs.jsx';
import { calm, pulse } from './motion.js';
import { burst, ring, flash, ink, PAL } from '../fx/fx.js';
import { play } from '../fx/sfx.js';

const ROLL_MS = 1500;
const flip = {
  hidden: { opacity: 0, rotateX: -80, y: 10 },
  show: (i = 0) => ({ opacity: 1, rotateX: 0, y: 0, transition: { delay: i * 0.12, duration: 0.5, ease: [0.2, 0.9, 0.3, 1] } }),
};

// Tư chất quay như ống thăm rồi dừng lại ở kết quả thật
function RootRoll({ s, on, onLand }) {
  const [shown, setShown] = useState(G.ROOTS[0].n);
  const [done, setDone] = useState(false);
  const el = useRef(null);
  useEffect(() => {
    if (!on) return;
    const final = s.special || G.ROOTS[s.root].n;
    if (calm()) { setShown(final); setDone(true); onLand(el.current); return; }
    let t = 0, k = 0, id;
    // Chậm dần: mỗi lần đổi chữ cách nhau lâu hơn
    const spin = () => {
      const gap = 45 + Math.pow(t / ROLL_MS, 2.2) * 260;
      t += gap;
      if (t >= ROLL_MS) { setShown(final); setDone(true); onLand(el.current); return; }
      k = (k + 1 + Math.floor(Math.random() * 2)) % G.ROOTS.length;
      setShown(G.ROOTS[k].n);
      play('tap');
      id = setTimeout(spin, gap);
    };
    spin();
    return () => clearTimeout(id);
  }, [on, s.id]);
  return <p ref={el} className={'root-name' + (done ? ' landed' : ' rolling')}>{shown}</p>;
}

export default function Birth({ s, onGo, onReroll }) {
  const [step, setStep] = useState(0);
  const [landed, setLanded] = useState(false);
  const card = useRef(null);
  useEffect(() => {
    setStep(0);
    setLanded(false);
    ink({ x: innerWidth / 2, y: innerHeight * 0.18 }, { n: 22, spread: 180, size: 16, life: 1600 });
    const ids = [[1, 500], [2, 1100]].map(([n, ms]) => setTimeout(() => { setStep(n); play('whoosh'); }, ms));
    return () => ids.forEach(clearTimeout);
  }, [s.id]);
  // Tư chất dừng: hào quang theo độ hiếm, rồi mới hiện thiên phú
  const land = (el) => {
    setLanded(true);
    const r = s.root;
    if (r >= 4) { play('gong'); flash('#f4d58f', 0.45, 700); burst(el, { n: 110, colors: PAL.gold, speed: 10 }); ring(el, { to: 320, n: 3, gap: 160 }); }
    else if (r === 3) { play('bell'); burst(el, { n: 60, colors: PAL.soul, speed: 7 }); ring(el, { color: '#d6cbff', to: 200 }); }
    else if (r === 0) { play('fail'); ink(el, { n: 20, spread: 90 }); }
    else { play('stamp'); burst(el, { n: 24, colors: PAL.jade, speed: 4 }); }
    pulse(card.current, 1.04);
    setTimeout(() => setStep(3), calm() ? 0 : 650);
  };
  const skip = () => { if (step < 3) { setStep(3); setLanded(true); } };

  const root = G.ROOTS[s.root];
  const tier = s.root >= 4 ? 'legend' : s.root === 3 ? 'rare' : s.root === 0 ? 'cursed' : '';

  return (
    <div className="screen birth" onClick={skip}>
      <AnimatePresence mode="wait">
        <motion.div key={s.id} className="birth-in" initial={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }} transition={{ duration: 0.45 }}>
          <p className="eyebrow">Một sinh linh chào đời</p>
          <h2 className="birth-name" aria-label={s.name}>
            {[...s.name].map((ch, i) => (
              <motion.span key={i} initial={{ opacity: 0, y: -18, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}>{ch}</motion.span>
            ))}
          </h2>
          <p className="muted center">{s.g === 'm' ? 'Nam nhi' : 'Nữ nhi'}</p>

          <motion.div className="reveal frame on" variants={flip} initial="hidden" animate={step >= 1 ? 'show' : 'hidden'}>
            <span className="reveal-label">Xuất thân</span>
            <p>{s.originName}</p>
          </motion.div>

          <motion.div ref={card} className={'reveal frame on root ' + (landed ? tier : '')} variants={flip} initial="hidden" animate={step >= 2 ? 'show' : 'hidden'}>
            <span className="reveal-label">Tư chất đấu khí</span>
            {step >= 3 ? <p className="root-name landed">{s.special || root.n}</p> : <RootRoll s={s} on={step >= 2} onLand={land} />}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: landed ? 1 : 0 }}>
              <p className="muted">{root.d}</p>
              <p className="odds">Cứ <b>{rootOdds(s).toLocaleString('vi-VN')}</b> người mới có một kẻ như ngươi</p>
            </motion.div>
          </motion.div>

          <motion.div className="reveal frame on" variants={flip} initial="hidden" animate={step >= 3 ? 'show' : 'hidden'}>
            <span className="reveal-label">Thuộc tính & thiên phú</span>
            <div className="chips">
              {s.attrs.map((a, i) => <motion.span key={a} className="chip attr" initial={{ scale: 0 }} animate={{ scale: step >= 3 ? 1 : 0 }} transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 400, damping: 14 }}>{a} thuộc tính</motion.span>)}
            </div>
            <ul className="traits">
              {s.traits.map((id, i) => {
                const t = trait(id);
                return (
                  <motion.li key={id} variants={flip} custom={i + 2} initial="hidden" animate={step >= 3 ? 'show' : 'hidden'} onAnimationComplete={() => { if (step >= 3) play('stamp'); }}>
                    <Seal ch={TRAIT_G[id]} tone={id === 'ring' ? 'gold' : 'outline'} /><div><b>{t.n}</b><small>{t.d}</small></div>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="actions sticky" onClick={(e) => e.stopPropagation()}>
        <button className="btn primary" disabled={step < 3} onClick={onGo}>Bước vào hồng trần</button>
        <button className="btn ghost" onClick={() => { play('whoosh'); onReroll(); }}>Đầu thai lại</button>
      </div>
    </div>
  );
}

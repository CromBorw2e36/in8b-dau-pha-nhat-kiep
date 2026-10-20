import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { summary } from '../game/engine.js';
import { LifeChart } from './ui.jsx';
import { Seal } from './glyphs.jsx';
import Avatar from './Avatar.jsx';
import { stamp, drawStroke, rise as riseV } from './motion.js';
import { burst, rise, ring, PAL } from '../fx/fx.js';
import { play } from '../fx/sfx.js';

export default function End({ s, onNew, onHome }) {
  const sm = useMemo(() => summary(s), [s]);
  const seal = useRef(null);
  const card = useRef(null);
  useEffect(() => {
    const ids = [
      setTimeout(() => { stamp(seal.current); play('drum'); }, 350),
      setTimeout(() => {
        if (s.win) { burst(seal.current, { n: 90, colors: PAL.gold, speed: 9 }); ring(seal.current, { to: 300, n: 3 }); play('win'); }
        else burst(seal.current, { n: 30, colors: PAL.red, speed: 5 });
      }, 700),
    ];
    drawStroke(card.current?.querySelectorAll('.chart .line'), { duration: 1600, delay: 1100 });
    // Đế giả: kim quang bay lên mãi; người thường: tro tàn rơi lặng lẽ
    const emit = () => rise({ x: innerWidth / 2, y: innerHeight }, s.win ? { n: 16, w: innerWidth, colors: PAL.gold, life: 4000 } : { n: 8, w: innerWidth, colors: ['#7c6b54', '#b9a789'], life: 4200, speed: 0.6 });
    emit();
    const loop = setInterval(emit, 3000);
    return () => { ids.forEach(clearTimeout); clearInterval(loop); };
  }, []);

  return (
    <div className={'screen end' + (s.win ? ' win' : '')}>
      <p className="eyebrow">Một kiếp đã khép lại</p>
      <span ref={seal} className="end-seal-wrap"><Seal ch={s.win ? 'Đế' : 'Kết'} size="xl" tone={s.win ? 'gold' : 'red'} className="end-seal" /></span>
      <motion.h2 className="end-title" initial={{ opacity: 0, letterSpacing: '0.4em' }} animate={{ opacity: 1, letterSpacing: '0.02em' }} transition={{ delay: 0.6, duration: 1.1 }}>{sm.title[0]}</motion.h2>
      <motion.p className="muted center" variants={riseV} initial="hidden" animate="show" custom={12}>{sm.title[1]}</motion.p>

      <motion.div ref={card} className="end-card frame" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: [0.2, 0.9, 0.3, 1] }}>
        <div className="stele-label">Bia ký</div>
        <div className={'end-portrait' + (s.win ? ' gold' : '')}><Avatar s={s} size={130} still /></div>
        <div className="end-row">
          <div><small>Danh tính</small><b>{s.name}</b></div>
          <div><small>Hưởng thọ</small><b>{s.age} tuổi</b></div>
        </div>
        <div className="end-realm">{sm.realm}</div>
        <p className="end-cause">{s.cause}</p>
        <LifeChart hist={s.hist} />
      </motion.div>

      <section className="panel frame">
        <div className="panel-head static"><span>Những khoảnh khắc không thể quên</span></div>
        <ol className="moments">
          {sm.highlights.map((h, i) => (
            <motion.li key={i} variants={riseV} initial="hidden" animate="show" custom={18 + i}><span className="m-age">{h.a}</span><p>{h.t}</p></motion.li>
          ))}
        </ol>
      </section>

      <section className="panel frame">
        <div className="panel-head static"><span>Hành trang một đời</span></div>
        <dl className="facts">
          {sm.facts.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        </dl>
      </section>

      <div className="actions">
        <button className="btn primary" onClick={onNew}>Luân hồi · Bắt đầu kiếp mới</button>
        <button className="btn ghost" onClick={onHome}>Về trang chủ</button>
      </div>
    </div>
  );
}

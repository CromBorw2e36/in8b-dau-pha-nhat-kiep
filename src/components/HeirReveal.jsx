// Cảnh thức tỉnh pháp bảo truyền thừa: phong ấn vỡ, phả hệ hiện lần lượt, phẩm hiệu càng cao càng rực rỡ
import { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import G from '../game/data.js';
import { qualityIdx, heirRank, attrText, fxText, enMax } from '../game/util.js';
import { GearStats, FxList, HeirSeal, heirCls, ROMAN } from './gearUi.jsx';
import GearArt from './gearArt.jsx';
import { calm, cascade } from './motion.js';
import { burst, ring, vortex, rise, flash, shake, Q_PAL, PAL } from '../fx/fx.js';
import { play } from '../fx/sfx.js';

export default function HeirReveal({ it, s, onClose }) {
  const tile = useRef(null);
  const line = useRef(null);
  const q = qualityIdx(it);
  const r = heirRank(it);
  const got = it.got || {};
  useEffect(() => {
    const el = tile.current;
    const ids = [];
    const later = (ms, fn) => ids.push(setTimeout(fn, calm() ? 0 : ms));
    if (!calm()) animate(el, { scale: [0.3, 1.2, 1], rotate: [-40, 8, 0], opacity: [0, 1], duration: 900, ease: 'outBack(1.4)' });
    // Tụ khí trước khi phong ấn vỡ, phẩm hiệu cao thì xoáy lớn hơn
    if (r.lv >= 2) vortex(el, { n: 40 + r.lv * 20, colors: [...PAL.gold, ...Q_PAL[q]], radius: 140 + r.lv * 30, life: 1100 });
    later(520, () => {
      play(r.lv >= 4 ? 'boom' : 'gong');
      burst(el, { n: 40 + r.lv * 25, colors: [...PAL.gold, ...Q_PAL[q]], speed: 6 + r.lv });
      ring(el, { color: PAL.gold[0], to: 180 + r.lv * 40, n: Math.min(4, r.lv), gap: 160 });
      if (r.lv >= 3) flash(PAL.gold[2], 0.35 + r.lv * 0.08, 700);
      if (r.lv >= 5) shake(null, 10, 500);
      if (r.lv >= 4) rise(el, { n: 30 + r.lv * 8, w: 260, colors: PAL.gold });
    });
    later(900, () => { play('bell'); cascade(line.current?.querySelectorAll('li, .hr-got > *') || []); });
    return () => ids.forEach(clearTimeout);
  }, []);
  return (
    <div className="reveal-ov heir-ov" onClick={onClose}>
      <div className={`reveal-card heir-card q-b${q} ${heirCls(it)}`} onClick={(e) => e.stopPropagation()}>
        <span className="rv-clip" aria-hidden="true"><span className="rv-rays" /><span className="hr-seal-ring" /></span>
        <p className="eyebrow">Phong ấn tan biến · pháp bảo truyền thừa</p>
        <div className="rv-tile" ref={tile}><GearArt it={it} size={84} /><span className="anv-tier">{ROMAN[it.tier]}</span></div>
        <HeirSeal it={it} />
        <b className={'rv-name q' + q}>{it.n} <span className="num">+{it.en || 0}</span></b>
        <p className="muted small center">{G.QUALITY[q][1]} · {G.TIERS[it.tier]} · cường hóa tối đa +{enMax(it)}</p>
        <div className={'rv-info q-b' + q} ref={line}>
          {(got.attr?.length > 0 || got.fx) && (
            <div className="hr-got" aria-label="Đời này thức tỉnh">
              {got.attr?.map(([id, v]) => { const t = attrText(id, v); return <span key={id} className="fx-chip">{t.n} {t.val}</span>; })}
              {got.fx && <span className="fx-chip fx-new">Hiệu ứng mới: {fxText(it, it.fx.find((f) => f.id === got.fx) || { id: got.fx, v: 0 }).n}</span>}
            </div>
          )}
          <GearStats it={it} s={s} />
          <FxList it={it} />
          <ol className="heir-line">
            {it.heirs?.map((h, i) => <li key={i}><span className="num">Đời {i + 1}</span><b>{h.n}</b><small>{h.R} · trao lại +{h.en}</small></li>)}
          </ol>
        </div>
        <button className="btn primary" autoFocus onClick={onClose}>Nhận truyền thừa</button>
      </div>
    </div>
  );
}

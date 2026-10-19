import { useEffect, useState } from 'react';
import G from '../game/data.js';
import { rootOdds } from '../game/engine.js';
import { trait } from '../game/util.js';
import { Seal, TRAIT_G } from './glyphs.jsx';

export default function Birth({ s, onGo, onReroll }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    const ids = [1, 2, 3].map((n) => setTimeout(() => setStep(n), n * 650));
    return () => ids.forEach(clearTimeout);
  }, [s.id]);

  const root = G.ROOTS[s.root];
  const tier = s.root >= 4 ? 'legend' : s.root === 3 ? 'rare' : s.root === 0 ? 'cursed' : '';

  return (
    <div className="screen birth">
      <p className="eyebrow">Một sinh linh chào đời</p>
      <h2 className="birth-name">{s.name}</h2>
      <p className="muted center">{s.g === 'm' ? 'Nam nhi' : 'Nữ nhi'}</p>

      <div className={'reveal frame' + (step >= 1 ? ' on' : '')}>
        <span className="reveal-label">Xuất thân</span>
        <p>{s.originName}</p>
      </div>

      <div className={'reveal frame root ' + tier + (step >= 2 ? ' on' : '')}>
        <span className="reveal-label">Tư chất đấu khí</span>
        <p className="root-name">{s.special || root.n}</p>
        <p className="muted">{root.d}</p>
        <p className="odds">Cứ <b>{rootOdds(s).toLocaleString('vi-VN')}</b> người mới có một kẻ như ngươi</p>
      </div>

      <div className={'reveal frame' + (step >= 3 ? ' on' : '')}>
        <span className="reveal-label">Thuộc tính & thiên phú</span>
        <div className="chips">
          {s.attrs.map((a) => <span key={a} className="chip attr">{a} thuộc tính</span>)}
        </div>
        <ul className="traits">
          {s.traits.map((id) => {
            const t = trait(id);
            return <li key={id}><Seal ch={TRAIT_G[id]} tone={id === 'ring' ? 'gold' : 'outline'} /><div><b>{t.n}</b><small>{t.d}</small></div></li>;
          })}
        </ul>
      </div>

      <div className="actions sticky">
        <button className="btn primary" disabled={step < 3} onClick={onGo}>Bước vào hồng trần</button>
        <button className="btn ghost" onClick={onReroll}>Đầu thai lại</button>
      </div>
    </div>
  );
}

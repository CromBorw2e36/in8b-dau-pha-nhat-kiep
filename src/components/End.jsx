import { useMemo } from 'react';
import { summary } from '../game/engine.js';
import { LifeChart } from './ui.jsx';
import { Seal } from './glyphs.jsx';

export default function End({ s, onNew, onHome }) {
  const sm = useMemo(() => summary(s), [s]);
  return (
    <div className={'screen end' + (s.win ? ' win' : '')}>
      <p className="eyebrow">Một kiếp đã khép lại</p>
      <Seal ch={s.win ? 'Đế' : 'Kết'} size="xl" tone={s.win ? 'gold' : 'red'} className="end-seal" />
      <h2 className="end-title">{sm.title[0]}</h2>
      <p className="muted center">{sm.title[1]}</p>

      <div className="end-card frame">
        <div className="stele-label">Bia ký</div>
        <div className="end-row">
          <div><small>Danh tính</small><b>{s.name}</b></div>
          <div><small>Hưởng thọ</small><b>{s.age} tuổi</b></div>
        </div>
        <div className="end-realm">{sm.realm}</div>
        <p className="end-cause">{s.cause}</p>
        <LifeChart hist={s.hist} />
      </div>

      <section className="panel frame">
        <div className="panel-head static"><span>Những khoảnh khắc không thể quên</span></div>
        <ol className="moments">
          {sm.highlights.map((h, i) => (
            <li key={i}><span className="m-age">{h.a}</span><p>{h.t}</p></li>
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

import { useState } from 'react';
import G from '../game/data.js';
import { fmtGold, gearName, retire } from '../game/util.js';
import { save } from '../game/engine.js';
import {
  deStep, deReached, deNext, landsHeld, unifyLeft, unified, legacySlots, canAscend, legacyAvail, legacyGold, bestGear, writeLegacy,
} from '../game/emperor.js';
import { regionDef } from '../game/sect.js';
import { Sheet, SheetBody, SheetHead, Tabs, Card } from './ui.jsx';
import { Ico, EMP_I, LEG_I, UI_I, STAT_I } from './icons.jsx';

// Đế lộ: con đường sau khi thành Đấu Đế
export default function Emperor({ s, bump, onClose, initTab }) {
  const [tab, setTab] = useState(initTab || 'de');
  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={EMP_I.de} title="Đế lộ" sub={`Đấu Đế ${deStep(s)} trọng`} value={`${deReached(s).length}/${G.DE_CANH.length}`} valueIcon={EMP_I.de} valueLabel="Đế pháp" />
      <Tabs tab={tab} onTab={setTab} tabs={[['de', 'Đế cảnh', EMP_I.de], ['thong', 'Nhất thống', EMP_I.unify, unified(s)], ['truyen', 'Truyền thừa', EMP_I.legacy]]} />
      <SheetBody>
        {tab === 'de' && <DeCanh s={s} />}
        {tab === 'thong' && <Unify s={s} />}
        {tab === 'truyen' && <Legacy s={s} bump={bump} onClose={onClose} />}
      </SheetBody>
    </Sheet>
  );
}

function DeCanh({ s }) {
  const st = deStep(s);
  const next = deNext(s);
  const prev = next ? next.at - 10 : 100;
  return (
    <>
      <div className="stat-tiles">
        <div title="Trọng Đấu Đế hiện tại"><Ico i={UI_I.realm} size={20} /><b className="num">{st}<small>/100</small></b><small>trọng</small></div>
        <div title="Đế pháp đã ngộ"><Ico i={EMP_I.de} size={20} /><b className="num">{deReached(s).length}<small>/{G.DE_CANH.length}</small></b><small>đế pháp</small></div>
        <div title="Trọng kế tiếp mở đế pháp"><Ico i={UI_I.up} size={20} /><b className="num">{next ? next.at : '—'}</b><small>{next ? 'mốc kế tiếp' : 'viên mãn'}</small></div>
      </div>
      {next && (
        <div className="prog">
          <span className="sv"><Ico i={STAT_I.qi} size={14} />Tới «{next.n}»: <b className="num">{st - prev}/10</b> trọng</span>
          <div className="lv-track thick"><i style={{ width: `${((st - prev) / 10) * 100}%` }} /></div>
        </div>
      )}
      <p className="note">Mỗi 10 trọng Đấu Đế ngộ ra một đế pháp, hiệu quả cộng dồn và áp dụng ngay. Tu luyện, bế quan và khổ tu đều giúp tăng trọng.</p>
      <div className="cards">
        {G.DE_CANH.map((m) => {
          const ok = st >= m.at;
          return (
            <Card key={m.at} icon={ok ? EMP_I.de : UI_I.lock} q={ok ? 3 : 0} badge={m.at} title={m.n} dim={!ok}
              tag={ok ? <><Ico i={UI_I.ok} size={11} />Đã ngộ</> : <><Ico i={UI_I.lock} size={11} />{m.at} trọng</>} tone={ok ? 'good' : 'fair'}
              sub={<span className="c-desc">{m.d}</span>} />
          );
        })}
      </div>
    </>
  );
}

function Unify({ s }) {
  const held = landsHeld(s);
  const total = G.REGIONS.length;
  const left = unifyLeft(s);
  const B = G.UNIFY_BONUS;
  const path = s.flags.unified === 'rule' ? 'Đăng cơ Đế chủ' : s.flags.unified === 'peace' ? 'Phân phong chư hầu' : null;
  return (
    <>
      <div className="stat-tiles">
        <div title="Vùng đã chiếm"><Ico i={UI_I.land} size={20} /><b className="num">{held}<small>/{total}</small></b><small>lãnh địa</small></div>
        <div title="Vùng còn lại"><Ico i={UI_I.map} size={20} /><b className="num">{left.length}</b><small>còn lại</small></div>
        <div title="Trạng thái nhất thống"><Ico i={EMP_I.unify} size={20} /><b>{unified(s) ? 'Hiệu lực' : s.flags.unified ? 'Gián đoạn' : 'Chưa'}</b><small>nhất thống</small></div>
      </div>
      <div className="prog">
        <span className="sv"><Ico i={UI_I.land} size={14} />Tiến độ nhất thống <b className="num">{Math.round((held / total) * 100)}%</b></span>
        <div className="lv-track thick"><i style={{ width: `${(held / total) * 100}%` }} /></div>
      </div>
      {path && <p className="sv"><Ico i={EMP_I.unify} size={14} />Đã chọn: <b>{path}</b>{s.unifiedAt ? ` · năm ${s.unifiedAt} tuổi` : ''}</p>}
      <p className="sub-head"><Ico i={UI_I.ach} size={18} />Ân huệ nhất thống</p>
      <ul className="perk-list">
        <li><Ico i={UI_I.gold} size={16} />Thuế lãnh địa +{B.tax * 100}%</li>
        <li><Ico i={EMP_I.de} size={16} />Sản lượng mỏ +{B.mine * 100}%</li>
        <li><Ico i={UI_I.members} size={16} />Đệ tử tối đa +{B.members}</li>
        <li><Ico i={UI_I.fame} size={16} />Danh hiệu cuối đời «Nhất thống đại lục»</li>
        <li><Ico i={UI_I.ok} size={16} />Chọn phân phong: lãnh địa không còn bị tập kích</li>
      </ul>
      <p className="note">Ân huệ chỉ có hiệu lực khi còn nắm trọn {total} vùng. Mất vùng nào, chiếm lại là ân huệ trở lại.</p>
      {left.length > 0 && (
        <>
          <p className="sub-head"><Ico i={UI_I.map} size={18} />Vùng chưa chiếm</p>
          <div className="cards">
            {left.map((r) => (
              <Card key={r.id} icon={UI_I.land} title={r.n} sub={<span className="c-desc">{G.ZONES[r.z].n} · {r.own}</span>}
                right={<span className="price" title="Phòng thủ"><Ico i={UI_I.cp} size={13} />{regionDef(s, r)}</span>} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Legacy({ s, bump, onClose }) {
  const slots = legacySlots(s);
  const [picks, setPicks] = useState({});
  const [armed, setArmed] = useState(null);
  const n = Object.keys(picks).length;
  const gears = Object.values(s.gear).filter(Boolean);
  const toggle = (id, v = true) => setPicks((p) => {
    const q = { ...p };
    if (q[id] && v === true) delete q[id];
    else if (q[id] || Object.keys(q).length < slots) q[id] = v;
    return q;
  });
  const finish = (ascend) => {
    if (armed !== ascend) { setArmed(ascend); setTimeout(() => setArmed(null), 3000); return; }
    writeLegacy(s, { ...picks, ascend });
    retire(s, ascend);
    save(s);
    bump();
    onClose();
  };
  const detail = (id) => {
    if (id === 'gear') {
      const cur = picks.gear === true ? bestGear(s)?.id : picks.gear;
      return gears.map((it) => (
        <button key={it.id} className={'mini' + (cur === it.id ? ' buy' : '')} onClick={() => toggle('gear', it.id)}><Ico i={LEG_I.gear} />{gearName(it)}</button>
      ));
    }
    if (id === 'fire') {
      const cur = picks.fire === true ? s.fires[0] : picks.fire;
      return s.fires.map((f) => <button key={f} className={'mini' + (cur === f ? ' buy' : '')} onClick={() => toggle('fire', f)}><Ico i={LEG_I.fire} />{f}</button>);
    }
    if (id === 'gold') return <span className="sv"><Ico i={UI_I.gold} size={14} />{fmtGold(legacyGold(s))} kim tệ</span>;
    if (id === 'sect') return <span className="sv"><Ico i={LEG_I.sect} size={14} />{s.sect.name}</span>;
    return null;
  };
  return (
    <>
      <div className="stat-tiles">
        <div title="Số món mang được"><Ico i={EMP_I.legacy} size={20} /><b className="num">{n}<small>/{slots}</small></b><small>ô truyền thừa</small></div>
        <div title="Năm ngự trị"><Ico i={UI_I.time} size={20} /><b className="num">{s.age - (s.emperorAt ?? s.age)}</b><small>năm làm Đế</small></div>
      </div>
      <p className="note">Khi khép lại kiếp này, ngọc giản truyền thừa mang những món bạn chọn sang kiếp sau. Thêm ô nhờ khắc đế ấn (sự kiện) và đế pháp ở 50, 100 trọng.</p>
      <div className="cards">
        {G.LEGACY.map((L) => {
          const ok = legacyAvail(s, L.id);
          const on = !!picks[L.id];
          const full = !on && n >= slots;
          return (
            <Card key={L.id} icon={LEG_I[L.id]} q={on ? 3 : 0} title={L.n} dim={!ok || full}
              tag={on ? <><Ico i={UI_I.ok} size={11} />Đã chọn</> : !ok ? 'Chưa có' : null} tone={on ? 'good' : 'fair'}
              sub={<span className="c-desc">{L.d}</span>}
              open={on} onToggle={ok && !full ? () => toggle(L.id) : undefined}>
              {detail(L.id) && <div className="c-act">{detail(L.id)}</div>}
            </Card>
          );
        })}
      </div>
      <div className="end-acts">
        <button className={'btn' + (armed === false ? ' armed' : '')} onClick={() => finish(false)}>
          <Ico i={UI_I.retire} size={20} /> {armed === false ? 'Bấm lần nữa để quy ẩn' : 'Quy ẩn · khép lại kiếp này'}
        </button>
        {canAscend(s) && (
          <button className={'btn primary' + (armed === true ? ' armed' : '')} onClick={() => finish(true)}>
            <Ico i={EMP_I.ascend} size={20} /> {armed === true ? 'Bấm lần nữa để phi thăng' : 'Phá toái hư không · phi thăng'}
          </button>
        )}
      </div>
      {!canAscend(s) && <p className="note center">Đạt Đấu Đế 100 trọng để mở «Phá toái hư không».</p>}
    </>
  );
}

import { useState } from 'react';
import G from '../game/data.js';
import { fmtGold, itemName, countOf, gearName } from '../game/util.js';
import {
  smithLv, smithPlan, upgradeSmith, craftTierCap, nextTierAt, craftCost, canCraft, craft, qualityOdds,
  enhanceCost, enhanceP, enhance, armCost, armValue, armRate, fulfill, sellArms,
} from '../game/forge.js';
import { troopCount } from '../game/army.js';
import { save } from '../game/engine.js';
import { Sheet, SheetBody, SheetHead, Tabs, UpRow, LevelBuy } from './ui.jsx';
import { GearCard, ROMAN } from './gearUi.jsx';
import { Ico, ITEM_I, SLOT_I, NAV_I, UI_I, TROOP_I } from './icons.jsx';

export default function Forge({ s, bump, onClose, initTab }) {
  const lv = smithLv(s);
  const [tab, setTab] = useState(() => initTab || (lv && s.orders.length ? 'arms' : 'craft'));
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(typeof r === 'string' ? r : r.t); save(s); bump(); };

  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={NAV_I.forge} title="Lò rèn" sub={lv ? `Luyện Khí Phòng cấp ${lv}` : 'Chưa dựng lò'} value={fmtGold(s.gold)} valueIcon={UI_I.gold} valueLabel="Kim tệ" />
      <Tabs tab={tab} onTab={(t) => { setTab(t); setMsg(null); }} tabs={[['craft', 'Chế tạo', UI_I.craft], ['enh', 'Cường hóa', UI_I.up], ['arms', 'Xưởng', TROOP_I.bo, s.orders.some((o) => s.arms >= o.n)]]} />
      {msg && <p className="bag-msg">{msg}</p>}
      <SheetBody>
        {tab === 'craft' && <Craft s={s} act={act} />}
        {tab === 'enh' && <Enhance s={s} act={act} />}
        {tab === 'arms' && <Arms s={s} act={act} />}
      </SheetBody>
    </Sheet>
  );
}

function SmithUpgrade({ s, act }) {
  const lv = smithLv(s);
  const nt = nextTierAt(s);
  return (
    <ul className="up-list">
      <UpRow icon={NAV_I.forge} name={lv ? 'Lò rèn' : 'Dựng lò rèn'} lv={lv} max={G.SMITHY.max} on={lv > 0}
        eff={nt ? `${G.TIERS[Math.min(G.TIERS.length - 1, nt / 15 + 1)]} ở cấp ${nt}` : 'Mở mọi bậc'}
        desc="Mỗi cấp tăng phẩm chất đồ rèn, tỷ lệ cường hóa và sản lượng binh khí quân dụng. Cứ 15 cấp mở thêm một bậc chế tạo.">
        <LevelBuy lv={lv} max={G.SMITHY.max} gold={s.gold} plan={(w) => smithPlan(s, w)} onBuy={(w) => act(() => upgradeSmith(s, w))} />
      </UpRow>
    </ul>
  );
}

function Mat({ s, t, g, n }) {
  const have = countOf(s, t, g);
  return <span className={'mat ' + (have >= n ? 'ok' : 'no')} title={itemName(t, g)}><Ico i={ITEM_I[t]} size={16} /><small>{g}</small><b className="num">{have}/{n}</b></span>;
}

function Craft({ s, act }) {
  const cap = craftTierCap(s);
  const [sl, setSl] = useState('wep');
  const [tier, setTier] = useState(cap || 1);
  const t = Math.min(tier, cap || 1);
  const c = craftCost(t);
  const odds = qualityOdds(s);
  return (
    <>
      <SmithUpgrade s={s} act={act} />
      {cap > 0 && (
        <>
          <div className="forge-pick">
            {G.GEAR_SLOTS.map((k) => (
              <button key={k} className={'slot-btn' + (sl === k ? ' on' : '')} onClick={() => setSl(k)} title={G.GEAR[k].n} aria-label={G.GEAR[k].n}>
                <Ico i={SLOT_I[k]} size={26} />
              </button>
            ))}
          </div>
          <div className="tier-pick">
            {Array.from({ length: cap }, (_, i) => i + 1).map((k) => (
              <button key={k} className={t === k ? 'on' : ''} onClick={() => setTier(k)} title={G.TIERS[k]}>{ROMAN[k]}</button>
            ))}
          </div>
          <div className="recipe">
            <div className="recipe-title"><Ico i={SLOT_I[sl]} size={22} /><b>{G.GEAR[sl].n} · {G.TIERS[t]}</b></div>
            <div className="mats">
              <span className={'mat ' + (s.gold >= c.gold ? 'ok' : 'no')} title="Kim tệ"><Ico i={UI_I.gold} size={16} /><b className="num">{fmtGold(c.gold)}</b></span>
              <Mat s={s} t="ore" g={c.ore[0]} n={c.ore[1]} />
              <Mat s={s} t="core" g={c.core[0]} n={c.core[1]} />
            </div>
            <div className="odds-bar" title="Tỷ lệ phẩm chất">
              {G.QUALITY.map((q, i) => <i key={q[1]} className={'q-bg' + i} style={{ width: `${odds[i] * 100}%` }} />)}
            </div>
            <div className="odds-legend">
              {G.QUALITY.map((q, i) => <span key={q[1]} className={'q' + i}><i className={'q-bg' + i} />{(odds[i] * 100).toFixed(odds[i] < 0.01 ? 1 : 0)}%</span>)}
            </div>
          </div>
          <button className="btn primary" disabled={!canCraft(s, t)} onClick={() => act(() => craft(s, sl, t))}><Ico i={UI_I.craft} size={20} /> Khai lò</button>
          <p className="note">Nguyên liệu phẩm cao hơn cũng dùng được. Cấp lò, dị hỏa và linh hồn càng cao, đồ càng dễ ra phẩm chất tốt. Từ Tinh phẩm trở lên, đồ rèn ra có thể mang hiệu ứng pháp khí (Thần phẩm tới 3 hiệu ứng).</p>
        </>
      )}
    </>
  );
}

function Enhance({ s, act }) {
  const lv = smithLv(s);
  const [open, setOpen] = useState(null);
  const list = [...G.GEAR_SLOTS.map((k) => s.gear[k]).filter(Boolean), ...s.armory];
  if (!lv) return <p className="empty"><Ico i={NAV_I.forge} size={28} />Cần dựng lò rèn trước.</p>;
  if (!list.length) return <p className="empty">Chưa có trang bị nào.</p>;
  const tryN = (it, n) => {
    let ok = 0, last = null;
    for (let i = 0; i < n; i++) {
      const r = enhance(s, it.id);
      if (!r || typeof r === 'string') { last = r; break; }
      if (r.ok) ok++; else { last = r.t; break; }
    }
    return ok ? `${gearName(it)}: thành công ${ok} lần${last ? ', rồi thất bại' : ''}.` : last;
  };
  return (
    <>
      <p className="note">Mỗi cấp cường hóa +4% chỉ số chính và +1% hiệu ứng pháp khí. Dưới +10 chắc chắn thành công; thất bại chỉ mất nguyên liệu, không tụt cấp.</p>
      <div className="cards">
        {list.map((it) => {
          const c = enhanceCost(it);
          const p = enhanceP(s, it);
          const max = (it.en || 0) >= G.ENHANCE_MAX;
          const can = !max && s.gold >= c.gold && countOf(s, 'ore', c.ore[0]) >= c.ore[1];
          const worn = s.gear[it.sl]?.id === it.id;
          return (
            <GearCard key={it.id} it={it} s={s} tag={worn ? 'Đang mặc' : null} open={open === it.id} onToggle={() => setOpen(open === it.id ? null : it.id)}
              right={max ? <span className="lvl-max">+100</span> : <span className="price" title="Tỷ lệ thành công"><Ico i={UI_I.dice} size={13} />{Math.round(p * 100)}%</span>}>
              {!max && (
                <div className="mats">
                  <span className={'mat ' + (s.gold >= c.gold ? 'ok' : 'no')}><Ico i={UI_I.gold} size={16} /><b className="num">{fmtGold(c.gold)}</b></span>
                  <Mat s={s} t="ore" g={c.ore[0]} n={c.ore[1]} />
                  <span className="mat" title="Tỷ lệ thành công"><Ico i={UI_I.dice} size={16} />Thành công <b className="num">{Math.round(p * 100)}%</b></span>
                </div>
              )}
              <div className="lv-track"><i style={{ width: `${it.en || 0}%` }} /></div>
              {!max && <button className="mini buy" disabled={!can} onClick={() => act(() => tryN(it, 1))}><Ico i={UI_I.up} />Cường hóa lên +{(it.en || 0) + 1}</button>}
              {!max && <button className="mini" disabled={!can} onClick={() => act(() => tryN(it, 5))}>Liền 5 lần</button>}
            </GearCard>
          );
        })}
      </div>
    </>
  );
}

function Arms({ s, act }) {
  const lv = smithLv(s);
  if (!lv) return <p className="empty"><Ico i={NAV_I.forge} size={28} />Cần dựng lò rèn trước.</p>;
  const v = armValue(s);
  return (
    <>
      <div className="stat-tiles">
        <div title="Binh khí trong kho"><Ico i={TROOP_I.bo} size={20} /><b className="num">{s.arms}</b><small>trong kho</small></div>
        <div title="Sản lượng mỗi năm"><Ico i={UI_I.craft} size={20} /><b className="num">+{armRate(s)}</b><small>mỗi năm</small></div>
        <div title="Giá vốn một bộ"><Ico i={UI_I.buy} size={20} /><b className="num">{fmtGold(armCost(s))}</b><small>giá vốn</small></div>
        <div title="Thương nhân thu mua một bộ"><Ico i={UI_I.sell} size={20} /><b className="num">{fmtGold(Math.round(v * 0.85))}</b><small>bán ngay</small></div>
      </div>
      <label className="switch">
        <input type="checkbox" checked={!!s.smithy.prod} onChange={(e) => act(() => { s.smithy.prod = e.target.checked; return null; })} />
        <span>Xưởng chạy mỗi năm (tối đa 1/4 kim tệ đang có)</span>
      </label>
      {troopCount(s) > 0 && <p className="note">Binh khí tự phát cho binh sĩ chưa có vũ khí, quân có binh khí mạnh hơn 60%.</p>}

      <p className="sub-head">Hợp đồng quân đội</p>
      {s.orders.length ? (
        <ul className="orders">
          {s.orders.map((o) => (
            <li key={o.id} className={s.arms >= o.n ? 'ready' : ''}>
              <span className="up-ico"><Ico i={UI_I.army} size={22} /></span>
              <div className="o-main">
                <b>{o.buyer}</b>
                <span className="o-meta">
                  <span title="Số bộ cần"><Ico i={TROOP_I.bo} size={14} />{o.n}</span>
                  <span title="Giá mỗi bộ"><Ico i={UI_I.gold} size={14} />{fmtGold(o.price)}</span>
                  <span title="Lượt còn lại"><Ico i={UI_I.realm} size={14} />{o.due - s.t}</span>
                </span>
              </div>
              <button className="mini buy" disabled={s.arms < o.n} onClick={() => act(() => fulfill(s, o.id))} title={`Thu ${fmtGold(o.n * o.price)}`}>
                <Ico i={UI_I.ok} />{fmtGold(o.n * o.price)}
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="empty">Chưa có đơn hàng. Các đạo quân sẽ tìm đến khi nghe danh lò rèn.</p>}

      {s.arms > 0 && (
        <div className="row-btns">
          <button className="mini" onClick={() => act(() => sellArms(s, Math.ceil(s.arms / 2)))}><Ico i={UI_I.sell} />Bán ½</button>
          <button className="mini ghost" onClick={() => act(() => sellArms(s, s.arms))}>Bán hết</button>
        </div>
      )}
    </>
  );
}

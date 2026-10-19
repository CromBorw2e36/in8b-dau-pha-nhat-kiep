import { useState } from 'react';
import G from '../game/data.js';
import { fmtGold, itemName, countOf, gearName, qualityIdx } from '../game/util.js';
import { gearDesc } from '../game/gear.js';
import {
  smithLv, smithPlan, upgradeSmith, craftTierCap, nextTierAt, craftCost, canCraft, craft, qualityOdds,
  enhanceCost, enhanceP, enhance, armCost, armValue, armRate, fulfill, sellArms,
} from '../game/forge.js';
import { troopCount } from '../game/army.js';
import { save } from '../game/engine.js';
import { Sheet, SheetBody, Tabs, LevelBuy } from './ui.jsx';
import { Seal, SLOT_G } from './glyphs.jsx';

export default function Forge({ s, bump, onClose, initTab }) {
  const lv = smithLv(s);
  const [tab, setTab] = useState(() => initTab || (lv && s.orders.length ? 'arms' : 'craft'));
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(typeof r === 'string' ? r : r.t); save(s); bump(); };

  return (
    <Sheet onClose={onClose} mark="Rèn" tall>
      <div className="bag-head">
        <div>
          <small className="label">Luyện Khí Phòng</small>
          <div className="sect-name">{lv ? `Cấp ${lv}` : 'Chưa dựng'}</div>
        </div>
        <div className="right">
          <small className="label">Kim tệ</small>
          <div className="num">{fmtGold(s.gold)}</div>
        </div>
      </div>
      {lv > 0 && <div className="lv-track big"><i style={{ width: `${lv}%` }} /></div>}

      <Tabs tab={tab} onTab={(t) => { setTab(t); setMsg(null); }} tabs={[['craft', 'Chế tạo'], ['enh', 'Cường hóa'], ['arms', 'Xưởng', s.orders.some((o) => s.arms >= o.n)]]} />
      {msg && <p className="bag-msg">{msg}</p>}

      <SheetBody>
        {tab === 'craft' && <Craft s={s} act={act} />}
        {tab === 'enh' && <Enhance s={s} act={act} />}
        {tab === 'arms' && <Arms s={s} act={act} />}
      </SheetBody>
      <button className="btn" onClick={onClose}>Đóng</button>
    </Sheet>
  );
}

function SmithUpgrade({ s, act }) {
  const lv = smithLv(s);
  const nt = nextTierAt(s);
  return (
    <div className="upgrade-box">
      <div>
        <b>{lv ? `Nâng cấp lò rèn (${lv}/${G.SMITHY.max})` : 'Dựng lò rèn riêng'}</b>
        <small>
          {lv
            ? `Mỗi cấp tăng phẩm chất đồ rèn, tỷ lệ cường hóa và sản lượng binh khí quân dụng.${nt ? ` Cấp ${nt} mở bậc ${G.TIERS[Math.min(G.TIERS.length - 1, nt / 15 + 1)]}.` : ''}`
            : 'Tự rèn trang bị từ Huyền thiết và ma hạch, cường hóa tới +100, sản xuất binh khí bán cho quân đội.'}
        </small>
      </div>
      <LevelBuy lv={lv} max={G.SMITHY.max} gold={s.gold} label={lv ? 'Nâng' : 'Dựng'} plan={(w) => smithPlan(s, w)} onBuy={(w) => act(() => upgradeSmith(s, w))} />
    </div>
  );
}

function Mat({ s, t, g, n }) {
  const have = countOf(s, t, g);
  return <span className={have >= n ? 'mat ok' : 'mat no'}>{itemName(t, g)} <b className="num">{have}/{n}</b></span>;
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
          <p className="sub-head">Chế tạo</p>
          <div className="pick-row">
            <small className="label">Loại</small>
            <div className="chips filter">
              {G.GEAR_SLOTS.map((k) => <button key={k} className={'chip' + (sl === k ? ' on' : '')} onClick={() => setSl(k)}>{G.GEAR[k].n}</button>)}
            </div>
          </div>
          <div className="pick-row">
            <small className="label">Bậc</small>
            <div className="chips filter">
              {Array.from({ length: cap }, (_, i) => i + 1).map((k) => <button key={k} className={'chip' + (t === k ? ' on' : '')} onClick={() => setTier(k)}>{G.TIERS[k]}</button>)}
            </div>
          </div>
          <div className="recipe">
            <Seal ch={SLOT_G[sl]} size="lg" tone="ink" />
            <div className="it-main">
              <b>{G.GEAR[sl].n} {G.TIERS[t]}</b>
              <div className="mats">
                <span className={s.gold >= c.gold ? 'mat ok' : 'mat no'}>Kim tệ <b className="num">{fmtGold(c.gold)}</b></span>
                <Mat s={s} t="ore" g={c.ore[0]} n={c.ore[1]} />
                <Mat s={s} t="core" g={c.core[0]} n={c.core[1]} />
              </div>
              <div className="odds-bar" title="Tỷ lệ phẩm chất">
                {G.QUALITY.map((q, i) => <i key={q[1]} className={'q-bg' + i} style={{ width: `${odds[i] * 100}%` }} />)}
              </div>
              <small className="odds-legend">
                {G.QUALITY.map((q, i) => <span key={q[1]} className={'q' + i}>{q[1]} {(odds[i] * 100).toFixed(odds[i] < 0.01 ? 1 : 0)}%</span>)}
              </small>
            </div>
          </div>
          <button className="btn primary" disabled={!canCraft(s, t)} onClick={() => act(() => craft(s, sl, t))}>Khai lò rèn</button>
          <p className="note">Thiếu Huyền thiết? Lịch luyện, mua ở Chợ hoặc Sàn giao dịch, sở hữu Ma tinh khoáng mạch, hay chiếm vùng có mỏ (Tháp Qua Nhĩ, Thạch tộc). Dị hỏa, linh hồn và cấp lò càng cao, đồ càng dễ ra phẩm chất tốt.</p>
        </>
      )}
    </>
  );
}

function Enhance({ s, act }) {
  const lv = smithLv(s);
  if (!lv) return <p className="empty">Cần dựng lò rèn trước (tab Chế tạo).</p>;
  const list = [...G.GEAR_SLOTS.map((k) => s.gear[k]).filter(Boolean), ...s.armory];
  const tryN = (it, n) => {
    let ok = 0, last = null;
    for (let i = 0; i < n; i++) {
      const r = enhance(s, it.id);
      if (!r || typeof r === 'string') { last = r; break; }
      if (r.ok) ok++; else { last = r.t; break; }
    }
    return ok ? `${gearName(it)}: thành công ${ok} lần${last ? `, rồi thất bại` : ''}.` : last;
  };
  return (
    <>
      <p className="note">Mỗi cấp cường hóa +4% chỉ số chính. Dưới +10 chắc chắn thành công; cao hơn thì tỷ lệ giảm dần, thất bại chỉ mất nguyên liệu, không tụt cấp. Lò rèn cấp cao bù lại tỷ lệ.</p>
      <ul className="items">
        {list.map((it) => {
          const c = enhanceCost(it);
          const p = enhanceP(s, it);
          const max = (it.en || 0) >= G.ENHANCE_MAX;
          const can = !max && s.gold >= c.gold && countOf(s, 'ore', c.ore[0]) >= c.ore[1];
          const worn = s.gear[it.sl]?.id === it.id;
          return (
            <li key={it.id} className="row-wrap">
              <Seal ch={SLOT_G[it.sl]} tone={worn ? 'red' : 'outline'} />
              <div className="it-main">
                <b className={'q' + qualityIdx(it)}>{gearName(it)}{worn && <span className="muted"> · đang mặc</span>}</b>
                <small>{gearDesc(it)}</small>
                {!max && (
                  <div className="mats">
                    <span className={s.gold >= c.gold ? 'mat ok' : 'mat no'}>{fmtGold(c.gold)}</span>
                    <Mat s={s} t="ore" g={c.ore[0]} n={c.ore[1]} />
                    <span className="mat">Thành công <b className="num">{Math.round(p * 100)}%</b></span>
                  </div>
                )}
                <div className="lv-track"><i style={{ width: `${it.en || 0}%` }} /></div>
              </div>
              <div className="it-act">
                {max ? <span className="lvl-max">+100</span> : (
                  <>
                    <button className="mini buy" disabled={!can} onClick={() => act(() => tryN(it, 1))}>+{(it.en || 0) + 1}</button>
                    <button className="mini ghost" disabled={!can} onClick={() => act(() => tryN(it, 5))}>Liền 5 lần</button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!list.length && <p className="empty">Chưa có trang bị nào.</p>}
    </>
  );
}

function Arms({ s, act }) {
  const lv = smithLv(s);
  if (!lv) return <p className="empty">Cần dựng lò rèn trước (tab Chế tạo).</p>;
  const v = armValue(s);
  return (
    <>
      <div className="stat-grid">
        <div><small className="label">Trong kho</small><b className="num">{s.arms} bộ</b></div>
        <div><small className="label">Sản lượng</small><b className="num">{armRate(s)} bộ/năm</b></div>
        <div><small className="label">Giá vốn</small><b className="num">{fmtGold(armCost(s))}</b></div>
        <div><small className="label">Thương nhân thu</small><b className="num">{fmtGold(Math.round(v * 0.85))}</b></div>
      </div>
      <label className="switch">
        <input type="checkbox" checked={!!s.smithy.prod} onChange={(e) => act(() => { s.smithy.prod = e.target.checked; return null; })} />
        <span>Xưởng hoạt động mỗi năm (dùng tối đa 1/4 số kim tệ đang có để mua nguyên liệu)</span>
      </label>
      {troopCount(s) > 0 && <p className="note">Binh khí trong kho được tự động phát cho binh sĩ chưa có vũ khí. Quân có binh khí mạnh hơn 60%.</p>}

      <p className="sub-head">Hợp đồng quân đội</p>
      {s.orders.length ? (
        <ul className="items">
          {s.orders.map((o) => (
            <li key={o.id}>
              <Seal ch="Ước" tone={s.arms >= o.n ? 'red' : 'outline'} />
              <div className="it-main">
                <b>{o.buyer}</b>
                <small>Cần <b className="num">{o.n}</b> bộ · {fmtGold(o.price)} mỗi bộ · tổng <b className="num">{fmtGold(o.n * o.price)}</b> · còn {o.due - s.t} lượt</small>
              </div>
              <div className="it-act"><button className="mini buy" disabled={s.arms < o.n} onClick={() => act(() => fulfill(s, o.id))}>Giao hàng</button></div>
            </li>
          ))}
        </ul>
      ) : <p className="empty">Chưa có đơn hàng. Các đạo quân sẽ tìm đến khi nghe danh lò rèn của bạn.</p>}

      {s.arms > 0 && (
        <div className="row-btns">
          <button className="mini" onClick={() => act(() => sellArms(s, Math.ceil(s.arms / 2)))}>Bán một nửa cho thương nhân</button>
          <button className="mini ghost" onClick={() => act(() => sellArms(s, s.arms))}>Bán hết</button>
        </div>
      )}
    </>
  );
}

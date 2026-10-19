import { useState } from 'react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, gearScore, gearName, qualityIdx } from '../game/util.js';
import { equip, unequip, sellGear, sellWorse, gearSell } from '../game/gear.js';
import { sell, useItem, sellPrice } from '../game/economy.js';
import { netWorth, save } from '../game/engine.js';
import { Sheet, SheetBody, SheetHead, Tabs, Tile, Detail } from './ui.jsx';
import { GearTile, GearStats, gradeQ } from './gearUi.jsx';
import { Ico, ITEM_I, SLOT_I, NAV_I, UI_I } from './icons.jsx';

const ORDER = ['tho', 'pha', 'tuk', 'lieu', 'hon', 'calm', 'ore', 'herb', 'core'];

export default function Bag({ s, bump, onClose, initTab }) {
  const [tab, setTab] = useState(initTab || 'bag');
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };

  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={NAV_I.bag} title="Túi đồ" sub={`Tài sản ${fmtGold(netWorth(s))}`} value={fmtGold(s.gold)} valueIcon={UI_I.gold} valueLabel="Kim tệ" />
      <Tabs tab={tab} onTab={(t) => { setTab(t); setMsg(null); }} tabs={[['bag', 'Vật phẩm', NAV_I.bag], ['gear', 'Trang bị', SLOT_I.wep]]} />
      {msg && <p className="bag-msg">{msg}</p>}
      <SheetBody>
        {tab === 'bag' ? <Items s={s} act={act} /> : <Gear s={s} act={act} />}
        <div className="toggles">
          <label title="Giữ lại Huyền thiết và ma hạch nếu có lò rèn hay kỵ binh"><input type="checkbox" checked={s.auto.sell} onChange={(e) => { s.auto.sell = e.target.checked; save(s); bump(); }} /><Ico i={UI_I.sell} /> Tự bán đồ dư</label>
          <label><input type="checkbox" checked={s.auto.buy} onChange={(e) => { s.auto.buy = e.target.checked; save(s); bump(); }} /><Ico i={UI_I.buy} /> Tự mua đan dược</label>
        </div>
      </SheetBody>
    </Sheet>
  );
}

function Items({ s, act }) {
  const items = Object.entries(s.inv)
    .map(([k, n]) => { const [t, g] = parseKey(k); return { k, t, g, n }; })
    .sort((a, b) => ORDER.indexOf(a.t) - ORDER.indexOf(b.t) || b.g - a.g);
  const [selK, setSel] = useState(null);
  const sel = items.find((x) => x.k === selK) || items[0];
  if (!items.length) return <p className="empty"><Ico i={NAV_I.bag} size={28} />Túi trống. Đi lịch luyện hoặc nhận nhiệm vụ để có chiến lợi phẩm.</p>;
  return (
    <>
      {sel && (
        <Detail icon={ITEM_I[sel.t]} q={gradeQ(sel.g)} title={`${itemName(sel.t, sel.g)} ×${sel.n}`}
          actions={<>
            {G.ITEMS[sel.t].use && <button className="mini" onClick={() => act(() => useItem(s, sel.k))}>Dùng</button>}
            <button className="mini" onClick={() => act(() => `Đã bán, thu ${fmtGold(sell(s, sel.k, 1))} kim tệ.`)}><Ico i={UI_I.sell} />Bán 1</button>
            {sel.n > 1 && <button className="mini ghost" onClick={() => act(() => `Đã bán ${sel.n}, thu ${fmtGold(sell(s, sel.k, sel.n))} kim tệ.`)}>Bán hết</button>}
          </>}>
          <p className="d-desc">{G.ITEMS[sel.t].d}</p>
          <span className="sv"><Ico i={UI_I.sell} size={14} />Chợ thu {fmtGold(sellPrice(sel.t, sel.g, s))}</span>
        </Detail>
      )}
      <div className="grid">
        {items.map((x) => (
          <Tile key={x.k} icon={ITEM_I[x.t]} q={gradeQ(x.g)} badge={x.g} count={x.n} sel={sel?.k === x.k} onClick={() => setSel(x.k)} title={itemName(x.t, x.g)} />
        ))}
      </div>
    </>
  );
}

function Gear({ s, act }) {
  const [slot, setSlot] = useState('all');
  const [selId, setSel] = useState(null);
  const worn = G.GEAR_SLOTS.map((k) => s.gear[k]).filter(Boolean);
  const armory = s.armory
    .filter((it) => slot === 'all' || it.sl === slot)
    .sort((a, b) => G.GEAR_SLOTS.indexOf(a.sl) - G.GEAR_SLOTS.indexOf(b.sl) || gearScore(b) - gearScore(a));
  const sel = [...worn, ...s.armory].find((x) => x.id === selId) || worn[0] || armory[0];
  const isWorn = sel && s.gear[sel.sl]?.id === sel.id;

  return (
    <>
      {sel && (
        <Detail icon={SLOT_I[sel.sl]} q={qualityIdx(sel)} title={gearName(sel)}
          actions={isWorn
            ? <button className="mini ghost" onClick={() => act(() => unequip(s, sel.sl))}>Tháo</button>
            : <>
                <button className="mini" onClick={() => act(() => equip(s, sel.id))}>Mặc</button>
                <button className="mini ghost" onClick={() => act(() => sellGear(s, sel.id))}><Ico i={UI_I.sell} />{fmtGold(gearSell(sel))}</button>
              </>}>
          <GearStats it={sel} s={s} compare={!isWorn} />
        </Detail>
      )}

      <p className="sub-head">Đang mặc</p>
      <div className="grid doll">
        {G.GEAR_SLOTS.map((k) => (s.gear[k]
          ? <GearTile key={k} it={s.gear[k]} sel={sel?.id === s.gear[k].id} onClick={() => setSel(s.gear[k].id)} />
          : <Tile key={k} icon={SLOT_I[k]} dim title={`${G.GEAR[k].n} · trống`} />))}
      </div>

      <div className="sub-row">
        <p className="sub-head">Kho <span className="muted num">{s.armory.length}/{G.ARMORY_MAX}</span></p>
        {s.armory.length > 0 && <button className="mini ghost" onClick={() => act(() => sellWorse(s))} title="Bán mọi món kém hơn đồ đang mặc"><Ico i={UI_I.sell} />Bán đồ kém</button>}
      </div>
      {s.armory.length > 0 && (
        <div className="icon-filter">
          <button className={slot === 'all' ? 'on' : ''} onClick={() => setSlot('all')}>Tất cả</button>
          {G.GEAR_SLOTS.map((k) => <button key={k} className={slot === k ? 'on' : ''} onClick={() => setSlot(k)} title={G.GEAR[k].n} aria-label={G.GEAR[k].n}><Ico i={SLOT_I[k]} size={18} /></button>)}
        </div>
      )}
      {armory.length ? (
        <div className="grid">
          {armory.map((it) => <GearTile key={it.id} it={it} sel={sel?.id === it.id} onClick={() => setSel(it.id)}
            mark={s.gear[it.sl] && gearScore(it) > gearScore(s.gear[it.sl]) ? 'better' : null} />)}
        </div>
      ) : <p className="empty">{s.armory.length ? 'Không có món nào ở ô này.' : 'Kho trống. Đồ cũ thay ra sẽ được cất ở đây.'}</p>}
    </>
  );
}

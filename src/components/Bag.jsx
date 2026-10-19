import { useState } from 'react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, gearScore } from '../game/util.js';
import { equip, unequip, sellGear, sellWorse, gearSell } from '../game/gear.js';
import { sell, useItem, sellPrice } from '../game/economy.js';
import { netWorth, save } from '../game/engine.js';
import { Sheet, SheetBody, SheetHead, Tabs, Card } from './ui.jsx';
import { GearCard, LockBtn, gradeQ } from './gearUi.jsx';
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
  const [open, setOpen] = useState(null);
  const items = Object.entries(s.inv)
    .map(([k, n]) => { const [t, g] = parseKey(k); return { k, t, g, n }; })
    .sort((a, b) => ORDER.indexOf(a.t) - ORDER.indexOf(b.t) || b.g - a.g);
  if (!items.length) return <p className="empty"><Ico i={NAV_I.bag} size={28} />Túi trống. Đi lịch luyện hoặc nhận nhiệm vụ để có chiến lợi phẩm.</p>;
  return (
    <div className="cards">
      {items.map(({ k, t, g, n }) => (
        <Card key={k} icon={ITEM_I[t]} q={gradeQ(g)} badge={g} count={n} title={itemName(t, g)}
          sub={<span className="c-desc">{G.ITEMS[t].d}</span>}
          right={<span className="price"><Ico i={UI_I.sell} size={13} />{fmtGold(sellPrice(t, g, s))}</span>}
          open={open === k} onToggle={() => setOpen(open === k ? null : k)}>
          <p className="d-desc">{G.ITEMS[t].d}</p>
          <div className="c-act">
            {G.ITEMS[t].use && <button className="mini" onClick={() => act(() => useItem(s, k))}>Dùng</button>}
            <button className="mini" onClick={() => act(() => `Đã bán, thu ${fmtGold(sell(s, k, 1))} kim tệ.`)}><Ico i={UI_I.sell} />Bán 1</button>
            {n > 1 && <button className="mini ghost" onClick={() => act(() => `Đã bán ${n}, thu ${fmtGold(sell(s, k, n))} kim tệ.`)}>Bán hết {n}</button>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Gear({ s, act }) {
  const [slot, setSlot] = useState('all');
  const [open, setOpen] = useState(null);
  const toggle = (id) => setOpen(open === id ? null : id);
  const armory = s.armory
    .filter((it) => slot === 'all' || it.sl === slot)
    .sort((a, b) => G.GEAR_SLOTS.indexOf(a.sl) - G.GEAR_SLOTS.indexOf(b.sl) || gearScore(b) - gearScore(a));

  return (
    <>
      <p className="sub-head">Đang mặc</p>
      <div className="cards">
        {G.GEAR_SLOTS.map((k) => {
          const it = s.gear[k];
          if (!it) return <Card key={k} icon={SLOT_I[k]} dim title={`${G.GEAR[k].n} · trống`} sub={<span className="c-desc">Rơi khi lịch luyện, tự rèn ở lò rèn hoặc mua trên sàn.</span>} />;
          return (
            <GearCard key={k} it={it} s={s} open={open === it.id} onToggle={() => toggle(it.id)}>
              <button className="mini ghost" onClick={() => act(() => unequip(s, k))}>Tháo</button>
              <LockBtn it={it} act={act} />
            </GearCard>
          );
        })}
      </div>

      <div className="sub-row">
        <p className="sub-head">Kho <span className="muted num">{s.armory.length}/{G.ARMORY_MAX}</span></p>
        {s.armory.length > 0 && <button className="mini ghost" onClick={() => act(() => sellWorse(s))} title="Bán mọi món kém hơn đồ đang mặc"><Ico i={UI_I.sell} />Bán đồ kém</button>}
      </div>
      {s.armory.length > 0 && (
        <div className="icon-filter">
          <button className={slot === 'all' ? 'on' : ''} onClick={() => setSlot('all')}>Tất cả</button>
          {G.GEAR_SLOTS.map((k) => <button key={k} className={slot === k ? 'on' : ''} onClick={() => setSlot(k)} title={G.GEAR[k].n}><Ico i={SLOT_I[k]} size={16} /> {G.GEAR[k].n}</button>)}
        </div>
      )}
      {armory.length ? (
        <div className="cards">
          {armory.map((it) => (
            <GearCard key={it.id} it={it} s={s} compare open={open === it.id} onToggle={() => toggle(it.id)}
              tag={s.gear[it.sl] && gearScore(it) > gearScore(s.gear[it.sl]) ? 'Tốt hơn' : null}
              right={<span className="price"><Ico i={UI_I.sell} size={13} />{fmtGold(gearSell(it))}</span>}>
              <button className="mini buy" onClick={() => act(() => equip(s, it.id))}>Mặc vào</button>
              {!it.lock && <button className="mini ghost" onClick={() => act(() => sellGear(s, it.id))}><Ico i={UI_I.sell} />Bán {fmtGold(gearSell(it))}</button>}
              <LockBtn it={it} act={act} />
            </GearCard>
          ))}
        </div>
      ) : <p className="empty">{s.armory.length ? 'Không có món nào ở ô này.' : 'Kho trống. Đồ cũ thay ra sẽ được cất ở đây.'}</p>}
    </>
  );
}

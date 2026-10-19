import { useState } from 'react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, gearScore } from '../game/util.js';
import { equip, unequip, sellGear, sellWorse, gearSell } from '../game/gear.js';
import { sell, useItem, sellPrice } from '../game/economy.js';
import { netWorth, save } from '../game/engine.js';
import { Sheet, SheetBody, Tabs, GearRow } from './ui.jsx';
import { Seal, ITEM_G, SLOT_G } from './glyphs.jsx';

const ORDER = ['tho', 'pha', 'tuk', 'lieu', 'hon', 'calm', 'ore', 'herb', 'core'];

export default function Bag({ s, bump, onClose, initTab }) {
  const [tab, setTab] = useState(initTab || 'bag');
  const [slot, setSlot] = useState('all');
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };

  const items = Object.entries(s.inv)
    .map(([k, n]) => { const [t, g] = parseKey(k); return { k, t, g, n }; })
    .sort((a, b) => ORDER.indexOf(a.t) - ORDER.indexOf(b.t) || b.g - a.g);
  const armory = s.armory
    .filter((it) => slot === 'all' || it.sl === slot)
    .sort((a, b) => G.GEAR_SLOTS.indexOf(a.sl) - G.GEAR_SLOTS.indexOf(b.sl) || gearScore(b) - gearScore(a));

  return (
    <Sheet onClose={onClose} mark="Túi" tall>
      <div className="bag-head">
        <div>
          <small className="label">Kim tệ</small>
          <div className="bag-gold">{fmtGold(s.gold)}</div>
        </div>
        <div className="right">
          <small className="label">Tổng tài sản</small>
          <div className="num">{fmtGold(netWorth(s))}</div>
        </div>
      </div>

      <Tabs tab={tab} onTab={(t) => { setTab(t); setMsg(null); }} tabs={[['bag', `Túi đồ · ${items.length}`], ['gear', 'Trang bị']]} />
      {msg && <p className="bag-msg">{msg}</p>}

      <SheetBody>
        {tab === 'bag' && (
          items.length ? (
            <ul className="items">
              {items.map(({ k, t, g, n }) => (
                <li key={k}>
                  <Seal ch={ITEM_G[t]} tone="outline" />
                  <div className="it-main">
                    <b>{itemName(t, g)} <span className="muted num">×{n}</span></b>
                    <small>{G.ITEMS[t].d}</small>
                    <small className="price">Chợ thu {fmtGold(sellPrice(t, g, s))} mỗi món</small>
                  </div>
                  <div className="it-act">
                    {G.ITEMS[t].use && <button className="mini" onClick={() => act(() => useItem(s, k))}>Dùng</button>}
                    <button className="mini" onClick={() => act(() => `Đã bán, thu ${fmtGold(sell(s, k, 1))} kim tệ.`)}>Bán 1</button>
                    {n > 1 && <button className="mini ghost" onClick={() => act(() => `Đã bán ${n}, thu ${fmtGold(sell(s, k, n))} kim tệ.`)}>Bán hết</button>}
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="empty">Túi trống rỗng. Đi lịch luyện hoặc nhận nhiệm vụ để có chiến lợi phẩm.</p>
        )}

        {tab === 'gear' && (
          <>
            <p className="sub-head">Đang mặc</p>
            <ul className="items">
              {G.GEAR_SLOTS.map((sl) => {
                const it = s.gear[sl];
                return it ? (
                  <GearRow key={sl} it={it} s={s}>
                    <button className="mini ghost" onClick={() => act(() => unequip(s, sl))}>Tháo</button>
                  </GearRow>
                ) : (
                  <li key={sl}>
                    <Seal ch={SLOT_G[sl]} tone="outline" />
                    <div className="it-main"><b className="muted">{G.GEAR[sl].n} · trống</b><small>Rơi khi lịch luyện, thưởng nhiệm vụ, tự rèn ở lò rèn hoặc mua trên sàn.</small></div>
                  </li>
                );
              })}
            </ul>

            <div className="sub-row">
              <p className="sub-head">Kho binh khí <span className="muted num">{s.armory.length}/{G.ARMORY_MAX}</span></p>
              {s.armory.length > 0 && <button className="mini ghost" onClick={() => act(() => sellWorse(s))}>Bán đồ kém hơn</button>}
            </div>
            {s.armory.length > 0 && (
              <div className="chips filter">
                {[['all', 'Tất cả'], ...G.GEAR_SLOTS.map((k) => [k, G.GEAR[k].n])].map(([k, n]) => (
                  <button key={k} className={'chip' + (slot === k ? ' on' : '')} onClick={() => setSlot(k)}>{n}</button>
                ))}
              </div>
            )}
            {armory.length ? (
              <ul className="items">
                {armory.map((it) => (
                  <GearRow key={it.id} it={it} s={s} compare>
                    <button className="mini" onClick={() => act(() => equip(s, it.id))}>Mặc</button>
                    <button className="mini ghost" onClick={() => act(() => sellGear(s, it.id))}>Bán {fmtGold(gearSell(it))}</button>
                  </GearRow>
                ))}
              </ul>
            ) : <p className="empty">{s.armory.length ? 'Không có món nào ở ô này.' : 'Kho trống. Đồ cũ thay ra sẽ được cất ở đây.'}</p>}
          </>
        )}

        <div className="toggles">
          <label><input type="checkbox" checked={s.auto.sell} onChange={(e) => { s.auto.sell = e.target.checked; save(s); bump(); }} /> Tự bán chiến lợi phẩm dư (giữ lại nguyên liệu cho lò rèn và quân đội)</label>
          <label><input type="checkbox" checked={s.auto.buy} onChange={(e) => { s.auto.buy = e.target.checked; save(s); bump(); }} /> Tự mua đan dược, dược liệu khi dư dả</label>
        </div>
      </SheetBody>
      <button className="btn" onClick={onClose}>Đóng</button>
    </Sheet>
  );
}

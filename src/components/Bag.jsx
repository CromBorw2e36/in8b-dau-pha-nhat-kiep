import { useState } from 'react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, unit, gearName } from '../game/util.js';
import { gearDesc, gearSell, gearBuy, equip, unequip, sellGear, forgeStock, buyGear, estateLv, estateCost, estateOpen, buyEstate, estateIncome } from '../game/gear.js';
import { sell, buy, useItem, marketList, sellPrice, buyPrice, ledgerSummary } from '../game/economy.js';
import { netWorth, save } from '../game/engine.js';
import { Sheet } from './ui.jsx';
import { Seal, ITEM_G } from './glyphs.jsx';

const ORDER = ['pha', 'tuk', 'lieu', 'herb', 'core'];
const SLOT_G = { wep: 'Binh', arm: 'Giáp', acc: 'Bảo' };
const EST_G = { tra: 'Trà', dien: 'Điền', pho: 'Phô', mo: 'Khoáng', dg: 'Giá' };

export default function Bag({ s, bump, onClose }) {
  const [tab, setTab] = useState('bag');
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };

  const items = Object.entries(s.inv)
    .map(([k, n]) => { const [t, g] = parseKey(k); return { k, t, g, n }; })
    .sort((a, b) => ORDER.indexOf(a.t) - ORDER.indexOf(b.t) || b.g - a.g);
  const led = ledgerSummary(s.led || []);

  return (
    <Sheet onClose={onClose} mark="Túi">
      <div className="bag-head">
        <div>
          <small className="muted">Kim tệ</small>
          <div className="bag-gold">{fmtGold(s.gold)}</div>
        </div>
        <div className="right">
          <small className="muted">Tổng tài sản</small>
          <div>{fmtGold(netWorth(s))}</div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {[['bag', 'Túi đồ'], ['gear', 'Trang bị'], ['shop', 'Chợ'], ['estate', 'Sản nghiệp'], ['led', 'Thu chi']].map(([id, n]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setMsg(null); }}>{n}</button>
        ))}
      </div>

      {msg && <p className="bag-msg">{msg}</p>}

      {tab === 'bag' && (
        items.length ? (
          <ul className="items">
            {items.map(({ k, t, g, n }) => (
              <li key={k}>
                <Seal ch={ITEM_G[t]} tone="outline" />
                <div className="it-main">
                  <b>{itemName(t, g)} <span className="muted">×{n}</span></b>
                  <small>{G.ITEMS[t].d} · Bán {fmtGold(sellPrice(t, g))}</small>
                </div>
                <div className="it-act">
                  {G.ITEMS[t].use && <button className="mini" onClick={() => act(() => useItem(s, k))}>Dùng</button>}
                  <button className="mini" onClick={() => act(() => `Đã bán, thu ${fmtGold(sell(s, k, 1))} kim tệ.`)}>Bán</button>
                  {n > 1 && <button className="mini ghost" onClick={() => act(() => `Đã bán ${n}, thu ${fmtGold(sell(s, k, n))} kim tệ.`)}>Bán hết</button>}
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="muted center pad">Túi trống rỗng. Đi lịch luyện hoặc nhận nhiệm vụ để có chiến lợi phẩm.</p>
      )}

      {tab === 'gear' && (
        <>
          <ul className="items">
            {Object.entries(G.GEAR).map(([sl, D]) => {
              const it = s.gear[sl];
              return (
                <li key={sl}>
                  <Seal ch={SLOT_G[sl]} tone={it ? 'red' : 'outline'} />
                  <div className="it-main">
                    <b>{it ? gearName(it) : <span className="muted">{D.n} · trống</span>}</b>
                    <small>{it ? gearDesc(it) : 'Lịch luyện, làm nhiệm vụ, kỳ ngộ hoặc mua ở Binh Khí Phường.'}</small>
                  </div>
                  {it && <div className="it-act"><button className="mini ghost" onClick={() => act(() => unequip(s, sl))}>Tháo</button></div>}
                </li>
              );
            })}
          </ul>
          {s.armory.length > 0 && <p className="sub-head">Kho binh khí ({s.armory.length}/{G.ARMORY_MAX})</p>}
          <ul className="items">
            {s.armory.map((it) => (
              <li key={it.id}>
                <Seal ch={SLOT_G[it.sl]} tone="outline" />
                <div className="it-main"><b>{gearName(it)}</b><small>{gearDesc(it)}</small></div>
                <div className="it-act">
                  <button className="mini" onClick={() => act(() => equip(s, it.id))}>Mặc</button>
                  <button className="mini ghost" onClick={() => act(() => sellGear(s, it.id))}>Bán {fmtGold(gearSell(it))}</button>
                </div>
              </li>
            ))}
          </ul>
          <p className="sub-head">Binh Khí Phường <span className="muted">· hàng mới mỗi 3 lượt</span></p>
          <ul className="items">
            {forgeStock(s).map((it) => (
              <li key={it.id}>
                <Seal ch={SLOT_G[it.sl]} tone="outline" />
                <div className="it-main"><b>{gearName(it)}</b><small>{gearDesc(it)}</small></div>
                <div className="it-act">
                  <button className="mini buy" disabled={s.gold < gearBuy(it)} onClick={() => act(() => buyGear(s, it.id))}>{fmtGold(gearBuy(it))}</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'estate' && (
        <>
          <p className="muted small">Sản nghiệp đem lại thu nhập mỗi năm, kể cả khi bạn bế quan. Hiện thu {fmtGold(estateIncome(s))} kim tệ/năm.</p>
          <ul className="items">
            {G.ESTATES.map((e) => {
              const lv = estateLv(s, e.id);
              const cost = estateCost(e, lv);
              const open = estateOpen(s, e);
              const max = lv >= G.ESTATE_MAX;
              return (
                <li key={e.id}>
                  <Seal ch={EST_G[e.id]} tone={lv ? 'red' : 'outline'} />
                  <div className="it-main">
                    <b>{e.n} {lv > 0 && <span className="muted">cấp {lv}/{G.ESTATE_MAX}</span>}</b>
                    <small>{open ? `${e.d} +${fmtGold(e.inc)}/năm mỗi cấp.` : `Cần cảnh giới ${G.REALMS[e.minR].n}.`}</small>
                  </div>
                  <div className="it-act">
                    <button className="mini buy" disabled={!open || max || s.gold < cost} onClick={() => act(() => buyEstate(s, e.id))}>
                      {max ? 'Tối đa' : `${lv ? 'Mở rộng' : 'Mua'} ${fmtGold(cost)}`}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === 'shop' && (
        <ul className="items">
          {marketList(s).map(([t, g]) => {
            const p = buyPrice(t, g);
            return (
              <li key={t + g}>
                <Seal ch={ITEM_G[t]} tone="outline" />
                <div className="it-main">
                  <b>{itemName(t, g)}</b>
                  <small>{G.ITEMS[t].d}</small>
                </div>
                <div className="it-act">
                  <button className="mini buy" disabled={s.gold < p} onClick={() => act(() => (buy(s, t, g) ? `Đã mua ${itemName(t, g)}.` : 'Không đủ tiền.'))}>
                    {fmtGold(p)}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'led' && (
        <div className="ledger">
          <p className="muted">Lượt vừa rồi ({s.started ? `${G.REALMS[s.R].yrs} năm` : '1 năm'}). Một khỏa ma hạch cùng cấp đáng giá ~{fmtGold(unit(s))}.</p>
          {led.rows.length ? (
            <dl>
              {led.rows.filter((r) => r[1] !== 0).map(([l, a]) => (
                <div key={l}><dt>{l}</dt><dd className={a > 0 ? 'up' : 'down'}>{a > 0 ? '+' : '−'}{fmtGold(Math.abs(a))}</dd></div>
              ))}
              <div className="total"><dt>Chênh lệch</dt><dd>{led.income - led.expense >= 0 ? '+' : '−'}{fmtGold(Math.abs(led.income - led.expense))}</dd></div>
            </dl>
          ) : <p className="muted center pad">Chưa có khoản thu chi nào.</p>}
        </div>
      )}

      <div className="toggles">
        <label><input type="checkbox" checked={s.auto.sell} onChange={(e) => { s.auto.sell = e.target.checked; save(s); bump(); }} /> Tự bán chiến lợi phẩm dư</label>
        <label><input type="checkbox" checked={s.auto.buy} onChange={(e) => { s.auto.buy = e.target.checked; save(s); bump(); }} /> Tự mua đan dược, dược liệu khi dư dả</label>
      </div>
      <button className="btn" onClick={onClose}>Đóng</button>
    </Sheet>
  );
}

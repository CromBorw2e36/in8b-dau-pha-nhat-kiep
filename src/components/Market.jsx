import { useState } from 'react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, unit, gearName, qualityIdx } from '../game/util.js';
import { forgeStock, buyGear, gearBuy, estateLv, estateOpen, estatePlan, buyEstate, estateIncome, estateInc } from '../game/gear.js';
import { buy, marketList, buyPrice, ledgerSummary } from '../game/economy.js';
import {
  npcList, buyListing, consignItem, consignGear, cancelConsign, sellChance, itemFair, gearFair, listingName, priceTag, trend,
} from '../game/exchange.js';
import { save } from '../game/engine.js';
import { Sheet, SheetBody, Tabs, GearRow, LevelBuy, ConfirmBtn } from './ui.jsx';
import { Seal, ITEM_G, SLOT_G } from './glyphs.jsx';

const EST_G = { tra: 'Trà', dien: 'Điền', pho: 'Phô', mo: 'Khoáng', dg: 'Giá' };
const TAG = { cheap: ['Rẻ', 'good'], dear: ['Đắt', 'bad'], fair: ['Đúng giá', 'muted'] };

export default function Market({ s, bump, onClose, initTab }) {
  const [tab, setTab] = useState(() => initTab || (s.exNew ? 'ex' : 'shop'));
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };
  const go = (t) => { setTab(t); setMsg(null); if (t === 'ex') { s.exNew = 0; save(s); } };

  return (
    <Sheet onClose={onClose} mark="Thị" tall>
      <div className="bag-head">
        <div>
          <small className="label">Kim tệ</small>
          <div className="bag-gold">{fmtGold(s.gold)}</div>
        </div>
        <div className="right">
          <small className="label">Giá thị trường</small>
          <div className="mkt-strip">
            {['core', 'herb', 'ore', 'pill', 'gear', 'arms'].map((mk) => (
              <span key={mk} className={'mkt ' + trend(s, mk)} title={G.MARKETS[mk]}>
                {G.MARKETS[mk].split(' ')[0]} {Math.round((s.mkt[mk] ?? 1) * 100)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Tabs tab={tab} onTab={go} tabs={[['shop', 'Chợ'], ['ex', 'Sàn', s.exNew > 0], ['estate', 'Sản nghiệp'], ['led', 'Thu chi']]} />
      {msg && <p className="bag-msg">{msg}</p>}

      <SheetBody>
        {tab === 'shop' && <Shop s={s} act={act} />}
        {tab === 'ex' && <Exchange s={s} act={act} />}
        {tab === 'estate' && <Estates s={s} act={act} />}
        {tab === 'led' && <Ledger s={s} />}
      </SheetBody>
      <button className="btn" onClick={onClose}>Đóng</button>
    </Sheet>
  );
}

function Shop({ s, act }) {
  return (
    <>
      <p className="note">Hàng của chợ luôn có sẵn, giá cao hơn thị trường 15%. Muốn mua rẻ hoặc bán được giá, hãy lên Sàn giao dịch.</p>
      <ul className="items">
        {marketList(s).map(([t, g]) => {
          const p = buyPrice(t, g, s);
          return (
            <li key={t + g}>
              <Seal ch={ITEM_G[t]} tone="outline" />
              <div className="it-main">
                <b>{itemName(t, g)}</b>
                <small>{G.ITEMS[t].d}</small>
              </div>
              <div className="it-act">
                <button className="mini buy" disabled={s.gold < p} onClick={() => act(() => (buy(s, t, g) ? `Đã mua ${itemName(t, g)}.` : 'Không đủ tiền.'))}>{fmtGold(p)}</button>
                {s.gold >= p * 10 && <button className="mini ghost" onClick={() => act(() => (buy(s, t, g, 10) ? `Đã mua 10 ${itemName(t, g).toLowerCase()}.` : 'Không đủ tiền.'))}>Mua 10</button>}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="sub-head">Binh Khí Phường <span className="muted">· hàng mới mỗi 3 lượt</span></p>
      <ul className="items">
        {forgeStock(s).map((it) => (
          <GearRow key={it.id} it={it} s={s} compare>
            <ConfirmBtn cost={gearBuy(it)} gold={s.gold} disabled={s.gold < gearBuy(it)} onClick={() => act(() => buyGear(s, it.id))}>{fmtGold(gearBuy(it))}</ConfirmBtn>
          </GearRow>
        ))}
      </ul>
    </>
  );
}

function Exchange({ s, act }) {
  const [pick, setPick] = useState(null); // { kind, key | id }
  const [mult, setMult] = useState(1.1);
  const [qty, setQty] = useState(1);
  const list = npcList(s);

  const sellables = [
    ...Object.entries(s.inv).map(([k, n]) => ({ kind: 'item', key: k, n, name: itemName(...parseKey(k)), fair: itemFair(s, ...parseKey(k)) })),
    ...s.armory.map((it) => ({ kind: 'gear', id: it.id, it, n: 1, name: gearName(it), fair: gearFair(s, it) })),
  ];
  const sel = pick && sellables.find((x) => (x.kind === 'item' ? x.key === pick.key : x.id === pick.id));
  const price = sel ? Math.max(1, Math.round(sel.fair * mult)) : 0;
  const chance = sel ? sellChance(s, sel.kind === 'gear' ? { kind: 'gear', it: sel.it, price } : { kind: 'item', key: sel.key, price }) : 0;
  const fee = s.flags.vip ? 2 : Math.round(G.CONSIGN_FEE * 100);

  return (
    <>
      <p className="note">Sàn Vạn Bảo: bạn đặt giá, mỗi lượt sẽ có người mua nếu giá hợp lý. Giá càng sát thị trường càng bán nhanh. Phí sàn {fee}% khi bán được.</p>

      <div className="sub-row"><p className="sub-head">Quầy ký gửi của bạn <span className="muted num">{s.cons.length}/{G.CONSIGN_MAX}</span></p></div>
      {s.cons.length ? (
        <ul className="items">
          {s.cons.map((x) => (
            <li key={x.id}>
              <Seal ch={x.kind === 'gear' ? SLOT_G[x.it.sl] : ITEM_G[parseKey(x.key)[0]]} tone="red" />
              <div className="it-main">
                <b className={x.kind === 'gear' ? 'q' + qualityIdx(x.it) : ''}>{listingName(x)}{x.kind === 'item' && <span className="muted num"> ×{x.n}</span>}</b>
                <small>Giá {fmtGold(x.price)} mỗi món · khả năng bán mỗi lượt {Math.round(sellChance(s, x) * 100)}%</small>
              </div>
              <div className="it-act"><button className="mini ghost" onClick={() => act(() => cancelConsign(s, x.id))}>Rút về</button></div>
            </li>
          ))}
        </ul>
      ) : <p className="empty">Chưa ký gửi món nào.</p>}

      {s.cons.length < G.CONSIGN_MAX && (
        <div className="consign">
          <label className="field">
            <small className="label">Ký gửi thêm</small>
            <select value={pick ? (pick.key || pick.id) : ''} onChange={(e) => {
              const v = e.target.value;
              const x = sellables.find((y) => (y.key || y.id) === v);
              setPick(x ? (x.kind === 'item' ? { kind: 'item', key: x.key } : { kind: 'gear', id: x.id }) : null);
              setQty(x?.n || 1);
            }}>
              <option value="">Chọn món trong túi hoặc kho binh khí…</option>
              {sellables.map((x) => <option key={x.key || x.id} value={x.key || x.id}>{x.name}{x.n > 1 ? ` (có ${x.n})` : ''} · thị trường {fmtGold(x.fair)}</option>)}
            </select>
          </label>
          {sel && (
            <>
              {sel.kind === 'item' && sel.n > 1 && (
                <label className="field">
                  <small className="label">Số lượng: <b className="num">{qty}</b></small>
                  <input type="range" min="1" max={sel.n} value={qty} onChange={(e) => setQty(+e.target.value)} />
                </label>
              )}
              <label className="field">
                <small className="label">Giá: <b className="num">{fmtGold(price)}</b> ({Math.round(mult * 100)}% thị trường) · bán được mỗi lượt ~{Math.round(chance * 100)}%</small>
                <input type="range" min="0.6" max="1.6" step="0.05" value={mult} onChange={(e) => setMult(+e.target.value)} />
              </label>
              <button className="btn primary" onClick={() => act(() => {
                const r = sel.kind === 'item' ? consignItem(s, sel.key, qty, price) : consignGear(s, sel.id, price);
                setPick(null);
                return r;
              })}>Đưa lên sàn</button>
            </>
          )}
        </div>
      )}

      <p className="sub-head">Hàng trên sàn <span className="muted">· đổi mới mỗi 3 lượt</span></p>
      <ul className="items">
        {list.map((x) => {
          const [tg, tone] = TAG[priceTag(s, x)];
          const tagEl = <span className={'ptag ' + tone}>{tg}</span>;
          if (x.kind === 'gear') {
            return (
              <GearRow key={x.id} it={x.it} s={s} compare sub={<small>{x.seller} rao bán {tagEl}</small>}>
                <ConfirmBtn cost={x.price} gold={s.gold} disabled={s.gold < x.price} onClick={() => act(() => buyListing(s, x.id))}>{fmtGold(x.price)}</ConfirmBtn>
              </GearRow>
            );
          }
          const [t, g] = parseKey(x.key);
          return (
            <li key={x.id}>
              <Seal ch={ITEM_G[t]} tone="outline" />
              <div className="it-main">
                <b>{itemName(t, g)} <span className="muted num">×{x.n}</span></b>
                <small>{x.seller} rao bán {tagEl}</small>
              </div>
              <div className="it-act">
                <ConfirmBtn cost={x.price} gold={s.gold} disabled={s.gold < x.price} onClick={() => act(() => buyListing(s, x.id))}>{fmtGold(x.price)}</ConfirmBtn>
                {x.n > 1 && s.gold >= x.price * x.n && <button className="mini ghost" onClick={() => act(() => buyListing(s, x.id, x.n))}>Mua hết</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Estates({ s, act }) {
  return (
    <>
      <p className="note">Sản nghiệp đem lại thu nhập mỗi năm, kể cả khi bạn bế quan. Tối đa cấp {G.ESTATE_MAX}; cứ đủ 25 cấp thì thu nhập của sản nghiệp đó nhân đôi. Hiện thu <b className="num">{fmtGold(estateIncome(s))}</b> kim tệ/năm.</p>
      <ul className="items">
        {G.ESTATES.map((e) => {
          const lv = estateLv(s, e.id);
          const open = estateOpen(s, e);
          const nextMile = (Math.floor(lv / 25) + 1) * 25;
          return (
            <li key={e.id} className="row-wrap">
              <Seal ch={EST_G[e.id]} tone={lv ? 'red' : 'outline'} />
              <div className="it-main">
                <b>{e.n} {lv > 0 && <span className="muted num">cấp {lv}/{G.ESTATE_MAX}</span>}</b>
                <small>{open ? e.d : `Cần cảnh giới ${G.REALMS[e.minR].n}.`}</small>
                {open && <small className="price">{lv ? `Đang thu ${fmtGold(estateInc(e, lv))}/năm · ` : ''}cấp sau thu {fmtGold(estateInc(e, lv + 1))}/năm{lv < G.ESTATE_MAX && nextMile <= G.ESTATE_MAX ? ` · cấp ${nextMile} nhân đôi` : ''}</small>}
                {lv > 0 && <div className="lv-track"><i style={{ width: `${lv}%` }} /></div>}
              </div>
              {open && (
                <div className="it-act wide">
                  <LevelBuy lv={lv} max={G.ESTATE_MAX} gold={s.gold} label={lv ? 'Mở rộng' : 'Mua'} plan={(w) => estatePlan(s, e.id, w)} onBuy={(w) => act(() => buyEstate(s, e.id, w))} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Ledger({ s }) {
  const led = ledgerSummary(s.led || []);
  return (
    <div className="ledger">
      <p className="note">Lượt vừa rồi ({s.started ? `${G.REALMS[s.R].yrs} năm` : '1 năm'}). Một khỏa ma hạch cùng cấp đáng giá ~{fmtGold(unit(s))}.</p>
      {led.rows.length ? (
        <dl>
          {led.rows.filter((r) => r[1] !== 0).map(([l, a]) => (
            <div key={l}><dt>{l}</dt><dd className={a > 0 ? 'up' : 'down'}>{a > 0 ? '+' : '−'}{fmtGold(Math.abs(a))}</dd></div>
          ))}
          <div className="total"><dt>Chênh lệch</dt><dd>{led.income - led.expense >= 0 ? '+' : '−'}{fmtGold(Math.abs(led.income - led.expense))}</dd></div>
        </dl>
      ) : <p className="empty">Chưa có khoản thu chi nào.</p>}
    </div>
  );
}

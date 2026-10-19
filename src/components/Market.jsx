import { useState } from 'react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, unit, gearName, qualityIdx } from '../game/util.js';
import { forgeStock, buyGear, gearBuy, estateLv, estateOpen, estatePlan, buyEstate, estateIncome, estateInc } from '../game/gear.js';
import { buy, marketList, buyPrice, ledgerSummary } from '../game/economy.js';
import {
  npcList, buyListing, consignItem, consignGear, cancelConsign, sellChance, itemFair, gearFair, listingName, priceTag, trend,
} from '../game/exchange.js';
import { save } from '../game/engine.js';
import { Sheet, SheetBody, SheetHead, Tabs, Tile, Detail, UpRow, LevelBuy, ConfirmBtn } from './ui.jsx';
import { GearTile, GearStats, gradeQ } from './gearUi.jsx';
import { Ico, ITEM_I, SLOT_I, NAV_I, UI_I, EST_I, MK_I } from './icons.jsx';

const MK_SHORT = { core: 'Ma hạch', herb: 'Dược liệu', ore: 'Huyền thiết', pill: 'Đan', gear: 'Trang bị', arms: 'Binh khí' };
const TAG = { cheap: ['Rẻ', 'good'], dear: ['Đắt', 'bad'], fair: ['Đúng giá', 'fair'] };

export default function Market({ s, bump, onClose, initTab }) {
  const [tab, setTab] = useState(() => initTab || (s.exNew ? 'ex' : 'shop'));
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };
  const go = (t) => { setTab(t); setMsg(null); if (t === 'ex') { s.exNew = 0; save(s); } };

  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={NAV_I.market} title="Chợ & sàn" sub="Giá thị trường hôm nay" value={fmtGold(s.gold)} valueIcon={UI_I.gold} valueLabel="Kim tệ" />
      <div className="mkt-strip">
        {Object.keys(G.MARKETS).map((mk) => (
          <span key={mk} className={'mkt ' + trend(s, mk)} title={`${G.MARKETS[mk]}: ${Math.round((s.mkt[mk] ?? 1) * 100)}% giá gốc`}>
            <Ico i={MK_I[mk]} size={15} />{MK_SHORT[mk]} {Math.round((s.mkt[mk] ?? 1) * 100)}
          </span>
        ))}
      </div>
      <Tabs tab={tab} onTab={go} tabs={[['shop', 'Chợ', NAV_I.market], ['ex', 'Sàn', UI_I.tag, s.exNew > 0], ['estate', 'Sản nghiệp', EST_I.mo], ['led', 'Sổ', UI_I.ledger]]} />
      {msg && <p className="bag-msg">{msg}</p>}
      <SheetBody>
        {tab === 'shop' && <Shop s={s} act={act} />}
        {tab === 'ex' && <Exchange s={s} act={act} />}
        {tab === 'estate' && <Estates s={s} act={act} />}
        {tab === 'led' && <Ledger s={s} />}
      </SheetBody>
    </Sheet>
  );
}

function Shop({ s, act }) {
  const goods = marketList(s);
  const gear = forgeStock(s);
  const [sel, setSel] = useState(null); // 'i:t:g' hoặc 'g:id'
  const selItem = sel?.startsWith('i:') ? sel.slice(2).split(':') : null;
  const selGear = sel?.startsWith('g:') ? gear.find((x) => x.id === sel.slice(2)) : null;
  const [t, gs] = selItem || goods[0];
  const g = +gs;
  return (
    <>
      {selGear ? (
        <Detail icon={SLOT_I[selGear.sl]} q={qualityIdx(selGear)} title={gearName(selGear)}
          actions={<ConfirmBtn cost={gearBuy(selGear)} gold={s.gold} disabled={s.gold < gearBuy(selGear)} onClick={() => { act(() => buyGear(s, selGear.id)); setSel(null); }}><Ico i={UI_I.buy} />{fmtGold(gearBuy(selGear))}</ConfirmBtn>}>
          <GearStats it={selGear} s={s} compare />
        </Detail>
      ) : (
        <Detail icon={ITEM_I[t]} q={gradeQ(g)} title={itemName(t, g)}
          actions={<>
            <button className="mini buy" disabled={s.gold < buyPrice(t, g, s)} onClick={() => act(() => (buy(s, t, g) ? `Đã mua ${itemName(t, g)}.` : 'Không đủ tiền.'))}><Ico i={UI_I.buy} />{fmtGold(buyPrice(t, g, s))}</button>
            <button className="mini ghost" disabled={s.gold < buyPrice(t, g, s) * 10} onClick={() => act(() => (buy(s, t, g, 10) ? `Đã mua 10 ${itemName(t, g).toLowerCase()}.` : 'Không đủ tiền.'))}>×10</button>
          </>}>
          <p className="d-desc">{G.ITEMS[t].d}</p>
        </Detail>
      )}
      <p className="sub-head">Hàng chợ</p>
      <div className="grid">
        {goods.map(([tt, gg]) => (
          <Tile key={tt + gg} icon={ITEM_I[tt]} q={gradeQ(gg)} badge={gg} foot={fmtGold(buyPrice(tt, gg, s))}
            sel={!selGear && tt === t && gg === g} onClick={() => setSel(`i:${tt}:${gg}`)} title={itemName(tt, gg)} />
        ))}
      </div>
      <p className="sub-head">Binh Khí Phường <span className="muted">· đổi hàng mỗi 3 lượt</span></p>
      <div className="grid">
        {gear.map((it) => <GearTile key={it.id} it={it} sel={selGear?.id === it.id} onClick={() => setSel(`g:${it.id}`)} foot={fmtGold(gearBuy(it))} />)}
      </div>
    </>
  );
}

function Exchange({ s, act }) {
  const list = npcList(s);
  const [sel, setSel] = useState(() => (list[0] ? { k: 'npc', id: list[0].id } : null));
  const [mult, setMult] = useState(1.1);
  const [qty, setQty] = useState(1);
  const fee = s.flags.vip ? 2 : Math.round(G.CONSIGN_FEE * 100);

  const sellables = [
    ...Object.entries(s.inv).map(([k, n]) => ({ kind: 'item', key: k, n, fair: itemFair(s, ...parseKey(k)) })),
    ...s.armory.map((it) => ({ kind: 'gear', id: it.id, it, n: 1, fair: gearFair(s, it) })),
  ];
  const npc = sel?.k === 'npc' ? list.find((x) => x.id === sel.id) : null;
  const mine = sel?.k === 'mine' ? s.cons.find((x) => x.id === sel.id) : null;
  const src = sel?.k === 'src' ? sellables.find((x) => (x.key || x.id) === sel.id) : null;
  const price = src ? Math.max(1, Math.round(src.fair * mult)) : 0;
  const chance = src ? sellChance(s, src.kind === 'gear' ? { kind: 'gear', it: src.it, price } : { kind: 'item', key: src.key, price }) : 0;

  const lIcon = (x) => (x.kind === 'gear' ? SLOT_I[x.it.sl] : ITEM_I[parseKey(x.key)[0]]);
  const lQ = (x) => (x.kind === 'gear' ? qualityIdx(x.it) : gradeQ(parseKey(x.key)[1]));

  return (
    <>
      {npc && (
        <Detail icon={lIcon(npc)} q={lQ(npc)} title={`${listingName(npc)}${npc.n > 1 ? ` ×${npc.n}` : ''}`}
          actions={<>
            <ConfirmBtn cost={npc.price} gold={s.gold} disabled={s.gold < npc.price} onClick={() => act(() => buyListing(s, npc.id))}><Ico i={UI_I.buy} />{fmtGold(npc.price)}</ConfirmBtn>
            {npc.n > 1 && <button className="mini ghost" disabled={s.gold < npc.price * npc.n} onClick={() => act(() => buyListing(s, npc.id, npc.n))}>Mua hết</button>}
          </>}>
          {npc.kind === 'gear' && <GearStats it={npc.it} s={s} compare />}
          <span className="sv">{npc.seller} <span className={'ptag ' + TAG[priceTag(s, npc)][1]}>{TAG[priceTag(s, npc)][0]}</span></span>
        </Detail>
      )}
      {mine && (
        <Detail icon={lIcon(mine)} q={lQ(mine)} title={`${listingName(mine)}${mine.kind === 'item' ? ` ×${mine.n}` : ''}`}
          actions={<button className="mini ghost" onClick={() => { act(() => cancelConsign(s, mine.id)); setSel(null); }}>Rút về</button>}>
          <span className="sv"><Ico i={UI_I.tag} size={14} />{fmtGold(mine.price)} mỗi món</span>
          <span className="sv"><Ico i={UI_I.dice} size={14} />{Math.round(sellChance(s, mine) * 100)}% bán được mỗi lượt</span>
        </Detail>
      )}
      {sel?.k === 'pick' && (
        <div className="detail">
          <p className="d-desc">Chọn món muốn đem bán:</p>
          <div className="grid small">
            {sellables.map((x) => x.kind === 'gear'
              ? <GearTile key={x.id} it={x.it} onClick={() => { setSel({ k: 'src', id: x.id }); setQty(1); }} />
              : <Tile key={x.key} icon={ITEM_I[parseKey(x.key)[0]]} q={gradeQ(parseKey(x.key)[1])} badge={parseKey(x.key)[1]} count={x.n} title={itemName(...parseKey(x.key))}
                  onClick={() => { setSel({ k: 'src', id: x.key }); setQty(x.n); }} />)}
          </div>
          {!sellables.length && <p className="empty">Không có gì để bán.</p>}
        </div>
      )}
      {src && (
        <Detail icon={src.kind === 'gear' ? SLOT_I[src.it.sl] : ITEM_I[parseKey(src.key)[0]]} q={src.kind === 'gear' ? qualityIdx(src.it) : gradeQ(parseKey(src.key)[1])}
          title={src.kind === 'gear' ? gearName(src.it) : itemName(...parseKey(src.key))}
          actions={<button className="mini buy" onClick={() => { act(() => (src.kind === 'item' ? consignItem(s, src.key, qty, price) : consignGear(s, src.id, price))); setSel(null); }}><Ico i={UI_I.tag} />Đưa lên sàn</button>}>
          {src.kind === 'item' && src.n > 1 && (
            <label className="field"><span className="sv">Số lượng <b className="num">{qty}</b></span>
              <input type="range" min="1" max={src.n} value={qty} onChange={(e) => setQty(+e.target.value)} /></label>
          )}
          <label className="field">
            <span className="sv"><Ico i={UI_I.tag} size={14} /><b className="num">{fmtGold(price)}</b> · {Math.round(mult * 100)}% thị trường · <Ico i={UI_I.dice} size={14} />{Math.round(chance * 100)}%/lượt</span>
            <input type="range" min="0.6" max="1.6" step="0.05" value={mult} onChange={(e) => setMult(+e.target.value)} />
          </label>
        </Detail>
      )}

      <div className="sub-row"><p className="sub-head">Quầy của bạn <span className="muted num">{s.cons.length}/{G.CONSIGN_MAX}</span></p><span className="muted small">phí {fee}%</span></div>
      <div className="grid">
        {s.cons.map((x) => x.kind === 'gear'
          ? <GearTile key={x.id} it={x.it} foot={fmtGold(x.price)} sel={mine?.id === x.id} onClick={() => setSel({ k: 'mine', id: x.id })} />
          : <Tile key={x.id} icon={lIcon(x)} q={lQ(x)} badge={parseKey(x.key)[1]} count={x.n} foot={fmtGold(x.price)} sel={mine?.id === x.id} onClick={() => setSel({ k: 'mine', id: x.id })} title={listingName(x)} />)}
        {s.cons.length < G.CONSIGN_MAX && (
          <button className={'tile add' + (sel?.k === 'pick' || src ? ' sel' : '')} onClick={() => setSel({ k: 'pick' })} title="Ký gửi thêm" aria-label="Ký gửi thêm">
            <span className="plus">+</span><span className="t-foot">Ký gửi</span>
          </button>
        )}
      </div>

      <p className="sub-head">Hàng trên sàn <span className="muted">· đổi mới mỗi 3 lượt</span></p>
      <div className="grid">
        {list.map((x) => {
          const tag = priceTag(s, x);
          return x.kind === 'gear'
            ? <GearTile key={x.id} it={x.it} foot={fmtGold(x.price)} mark={tag} sel={npc?.id === x.id} onClick={() => setSel({ k: 'npc', id: x.id })} />
            : <Tile key={x.id} icon={lIcon(x)} q={lQ(x)} badge={parseKey(x.key)[1]} count={x.n} foot={fmtGold(x.price)} mark={tag} sel={npc?.id === x.id}
                onClick={() => setSel({ k: 'npc', id: x.id })} title={listingName(x)} />;
        })}
      </div>
      <p className="note"><span className="t-mark-demo cheap" /> rẻ hơn thị trường · <span className="t-mark-demo dear" /> đắt hơn. Giá ký gửi càng sát thị trường càng bán nhanh.</p>
    </>
  );
}

function Estates({ s, act }) {
  return (
    <>
      <div className="stat-tiles one">
        <div><Ico i={UI_I.gold} size={20} /><b className="num">{fmtGold(estateIncome(s))}</b><small>mỗi năm</small></div>
      </div>
      <ul className="up-list">
        {G.ESTATES.map((e) => {
          const lv = estateLv(s, e.id);
          const open = estateOpen(s, e);
          return (
            <UpRow key={e.id} icon={EST_I[e.id]} name={e.n} lv={lv} max={G.ESTATE_MAX} on={lv > 0} locked={!open}
              eff={open ? `+${fmtGold(estateInc(e, Math.max(lv, 1)))}/năm` : G.REALMS[e.minR].n}
              desc={`${e.d} Mỗi 25 cấp thu nhập nhân đôi.`}>
              {open && <LevelBuy lv={lv} max={G.ESTATE_MAX} gold={s.gold} plan={(w) => estatePlan(s, e.id, w)} onBuy={(w) => act(() => buyEstate(s, e.id, w))} />}
            </UpRow>
          );
        })}
      </ul>
    </>
  );
}

function Ledger({ s }) {
  const led = ledgerSummary(s.led || []);
  const net = led.income - led.expense;
  return (
    <div className="ledger">
      <div className="stat-tiles">
        <div><Ico i={UI_I.sell} size={20} /><b className="num up">+{fmtGold(led.income)}</b><small>thu</small></div>
        <div><Ico i={UI_I.buy} size={20} /><b className="num down">−{fmtGold(led.expense)}</b><small>chi</small></div>
        <div><Ico i={UI_I.ledger} size={20} /><b className={'num ' + (net >= 0 ? 'up' : 'down')}>{net >= 0 ? '+' : '−'}{fmtGold(Math.abs(net))}</b><small>lượt vừa rồi</small></div>
      </div>
      {led.rows.length ? (
        <dl>
          {led.rows.filter((r) => r[1] !== 0).map(([l, a]) => (
            <div key={l}><dt>{l}</dt><dd className={a > 0 ? 'up' : 'down'}>{a > 0 ? '+' : '−'}{fmtGold(Math.abs(a))}</dd></div>
          ))}
        </dl>
      ) : <p className="empty">Chưa có khoản thu chi nào.</p>}
      <p className="note">Một khỏa ma hạch cùng cấp đáng giá ~{fmtGold(unit(s))}.</p>
    </div>
  );
}

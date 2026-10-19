import { useState } from 'react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, unit, tierFor, pillNeed, roomOf } from '../game/util.js';
import { forgeStock, buyGear, gearBuy, estateLv, estateOpen, estatePlan, buyEstate, estateIncome, estateInc } from '../game/gear.js';
import { buy, marketList, buyPrice, ledgerSummary } from '../game/economy.js';
import {
  npcList, buyListing, consignItem, consignGear, cancelConsign, sellChance, itemFair, gearFair, listingName, priceTag, trend,
  placeBid, cancelBid, bidChance,
} from '../game/exchange.js';
import { aucOpen, aucWait, aucLeft, lotName, minBid, rivalMood, placeAucBid } from '../game/auction.js';
import { save } from '../game/engine.js';
import { Sheet, SheetBody, SheetHead, Tabs, Card, UpRow, LevelBuy, ConfirmBtn } from './ui.jsx';
import { GearCard, gradeQ } from './gearUi.jsx';
import { Ico, ITEM_I, NAV_I, UI_I, EST_I, MK_I, SLOT_I } from './icons.jsx';

const MK_SHORT = { core: 'Ma hạch', herb: 'Dược liệu', ore: 'Huyền thiết', pill: 'Đan', gear: 'Trang bị', arms: 'Binh khí' };
const TAG = { cheap: ['Rẻ', 'good'], dear: ['Đắt', 'bad'], fair: ['Đúng giá', 'fair'] };

export default function Market({ s, bump, onClose, initTab }) {
  const [tab, setTab] = useState(() => initTab || (s.aucNew && aucOpen(s) ? 'auc' : s.exNew ? 'ex' : 'shop'));
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };
  const go = (t) => { setTab(t); setMsg(null); if (t === 'ex') { s.exNew = 0; save(s); } if (t === 'auc') { s.aucNew = 0; save(s); } };

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
      <Tabs tab={tab} onTab={go} tabs={[['shop', 'Chợ', NAV_I.market], ['ex', 'Sàn', UI_I.tag, s.exNew > 0], ['auc', 'Đấu giá', UI_I.auction, s.aucNew > 0], ['estate', 'Sản nghiệp', EST_I.mo], ['led', 'Sổ', UI_I.ledger]]} />
      {msg && <p className="bag-msg">{msg}</p>}
      <SheetBody>
        {tab === 'shop' && <Shop s={s} act={act} />}
        {tab === 'ex' && <Exchange s={s} act={act} />}
        {tab === 'auc' && <Auction s={s} act={act} />}
        {tab === 'estate' && <Estates s={s} act={act} />}
        {tab === 'led' && <Ledger s={s} />}
      </SheetBody>
    </Sheet>
  );
}

function Shop({ s, act }) {
  const goods = marketList(s);
  const gear = forgeStock(s);
  const [open, setOpen] = useState(null);
  const toggle = (k) => setOpen(open === k ? null : k);
  return (
    <>
      <p className="note">Chợ luôn có hàng, giá cao hơn thị trường 15%. Muốn mua rẻ hoặc bán được giá, hãy lên Sàn.</p>
      <div className="cards">
        {goods.map(([t, g]) => {
          const k = t + g;
          const p = buyPrice(t, g, s);
          return (
            <Card key={k} icon={ITEM_I[t]} q={gradeQ(g)} badge={g} title={itemName(t, g)} sub={<span className="c-desc">{G.ITEMS[t].d}</span>}
              right={<span className="price"><Ico i={UI_I.gold} size={13} />{fmtGold(p)}</span>} open={open === k} onToggle={() => toggle(k)}>
              <p className="d-desc">{G.ITEMS[t].d}</p>
              <div className="c-act">
                <button className="mini buy" disabled={s.gold < p || roomOf(s, `${t}:${g}`) < 1} onClick={() => act(() => (buy(s, t, g) ? `Đã mua ${itemName(t, g)}.` : 'Không đủ tiền.'))}><Ico i={UI_I.buy} />Mua 1 · {fmtGold(p)}</button>
                <button className="mini" disabled={s.gold < p * 10 || roomOf(s, `${t}:${g}`) < 10} onClick={() => act(() => (buy(s, t, g, 10) ? `Đã mua 10 ${itemName(t, g).toLowerCase()}.` : 'Không đủ tiền.'))}><Ico i={UI_I.buy} />Mua 10 · {fmtGold(p * 10)}</button>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="sub-head"><Ico i={SLOT_I.wep} size={18} />Binh Khí Phường <span className="muted">· đổi hàng mỗi 3 lượt</span></p>
      <div className="cards">
        {gear.map((it) => (
          <GearCard key={it.id} it={it} s={s} compare open={open === it.id} onToggle={() => toggle(it.id)}
            right={<span className="price"><Ico i={UI_I.gold} size={13} />{fmtGold(gearBuy(it))}</span>}>
            <ConfirmBtn cost={gearBuy(it)} gold={s.gold} disabled={s.gold < gearBuy(it)} onClick={() => act(() => buyGear(s, it.id))}><Ico i={UI_I.buy} />Mua · {fmtGold(gearBuy(it))}</ConfirmBtn>
          </GearCard>
        ))}
      </div>
    </>
  );
}

function Exchange({ s, act }) {
  const list = npcList(s);
  const [open, setOpen] = useState(null);
  const [picking, setPicking] = useState(false);
  const [mult, setMult] = useState(1.1);
  const [qty, setQty] = useState(1);
  const toggle = (k) => setOpen(open === k ? null : k);
  const fee = s.flags.vip ? 2 : Math.round(G.CONSIGN_FEE * 100);

  const sellables = [
    ...Object.entries(s.inv).map(([k, n]) => ({ kind: 'item', key: k, n, fair: itemFair(s, ...parseKey(k)) })),
    ...s.armory.map((it) => ({ kind: 'gear', id: it.id, it, n: 1, fair: gearFair(s, it) })),
  ];
  const tagEl = (x) => { const [t, c] = TAG[priceTag(s, x)]; return <span className={'ptag ' + c}>{t}</span>; };
  const priceEl = (p) => <span className="price"><Ico i={UI_I.gold} size={13} />{fmtGold(p)}</span>;

  // Phần đặt giá khi mở một món định ký gửi
  const consignForm = (x) => {
    const price = Math.max(1, Math.round(x.fair * mult));
    const chance = sellChance(s, x.kind === 'gear' ? { kind: 'gear', it: x.it, price } : { kind: 'item', key: x.key, price });
    return (
      <div className="consign">
        {x.kind === 'item' && x.n > 1 && (
          <label className="field"><span className="sv"><Ico i={NAV_I.bag} size={14} />Số lượng <b className="num">{Math.min(qty, x.n)}</b> / {x.n}</span>
            <input type="range" min="1" max={x.n} value={Math.min(qty, x.n)} onChange={(e) => setQty(+e.target.value)} /></label>
        )}
        <label className="field">
          <span className="sv">Giá <b className="num">{fmtGold(price)}</b> · {Math.round(mult * 100)}% thị trường · <Ico i={UI_I.dice} size={14} />bán được ~{Math.round(chance * 100)}% mỗi lượt</span>
          <input type="range" min="0.6" max="1.6" step="0.05" value={mult} onChange={(e) => setMult(+e.target.value)} />
        </label>
        <div className="c-act">
          <button className="mini buy" onClick={() => { act(() => (x.kind === 'item' ? consignItem(s, x.key, Math.min(qty, x.n), price) : consignGear(s, x.id, price))); setOpen(null); setPicking(false); }}><Ico i={UI_I.tag} />Đưa lên sàn</button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="sub-row">
        <p className="sub-head"><Ico i={UI_I.tag} size={18} />Quầy của bạn <span className="muted num">{s.cons.length}/{G.CONSIGN_MAX}</span></p>
        <span className="muted small">phí sàn {fee}%</span>
      </div>
      <div className="cards">
        {s.cons.map((x) => {
          const body = (
            <>
              <span className="sv"><Ico i={UI_I.dice} size={14} />Bán được ~{Math.round(sellChance(s, x) * 100)}% mỗi lượt</span>
              <div className="c-act"><button className="mini ghost" onClick={() => { act(() => cancelConsign(s, x.id)); setOpen(null); }}><Ico i={UI_I.take} />Rút về</button></div>
            </>
          );
          return x.kind === 'gear'
            ? <GearCard key={x.id} it={x.it} s={s} right={priceEl(x.price)} tag="Đang bán" open={open === x.id} onToggle={() => toggle(x.id)}>{body}</GearCard>
            : <Card key={x.id} icon={ITEM_I[parseKey(x.key)[0]]} q={gradeQ(parseKey(x.key)[1])} badge={parseKey(x.key)[1]} count={x.n} title={listingName(x)} tag="Đang bán"
                sub={<span className="c-desc">Giá {fmtGold(x.price)} mỗi món</span>} right={priceEl(x.price)} open={open === x.id} onToggle={() => toggle(x.id)}>{body}</Card>;
        })}
        {s.cons.length < G.CONSIGN_MAX && (
          <button className={'card add' + (picking ? ' on' : '')} onClick={() => setPicking((v) => !v)}>
            <span className="plus">+</span><span>{picking ? 'Chọn món bên dưới để đặt giá' : 'Ký gửi thêm'}</span>
          </button>
        )}
      </div>

      {picking && (
        <>
          <p className="sub-head"><Ico i={NAV_I.bag} size={18} />Chọn món đem bán</p>
          {sellables.length ? (
            <div className="cards">
              {sellables.map((x) => {
                const k = 'src' + (x.key || x.id);
                return x.kind === 'gear'
                  ? <GearCard key={k} it={x.it} s={s} right={<span className="muted small">thị trường {fmtGold(x.fair)}</span>} open={open === k} onToggle={() => { toggle(k); setQty(1); }}>{consignForm(x)}</GearCard>
                  : <Card key={k} icon={ITEM_I[parseKey(x.key)[0]]} q={gradeQ(parseKey(x.key)[1])} badge={parseKey(x.key)[1]} count={x.n} title={itemName(...parseKey(x.key))}
                      sub={<span className="c-desc">Thị trường {fmtGold(x.fair)} mỗi món</span>} open={open === k} onToggle={() => { toggle(k); setQty(x.n); }}>{consignForm(x)}</Card>;
              })}
            </div>
          ) : <p className="empty"><Ico i={NAV_I.bag} size={28} />Không có gì để bán.</p>}
        </>
      )}

      <Bids s={s} act={act} />

      <p className="sub-head"><Ico i={NAV_I.market} size={18} />Hàng trên sàn <span className="muted">· đổi mới mỗi 3 lượt</span></p>
      <div className="cards">
        {list.map((x) => {
          const buyBtns = (
            <div className="c-act">
              <ConfirmBtn cost={x.price} gold={s.gold} disabled={s.gold < x.price} onClick={() => act(() => buyListing(s, x.id))}><Ico i={UI_I.buy} />Mua · {fmtGold(x.price)}</ConfirmBtn>
              {x.n > 1 && <button className="mini" disabled={s.gold < x.price * x.n} onClick={() => act(() => buyListing(s, x.id, x.n))}><Ico i={UI_I.buy} />Mua hết {x.n} · {fmtGold(x.price * x.n)}</button>}
            </div>
          );
          return x.kind === 'gear'
            ? <GearCard key={x.id} it={x.it} s={s} compare right={<>{priceEl(x.price)}{tagEl(x)}</>} open={open === x.id} onToggle={() => toggle(x.id)}>
                <span className="sv muted">Người bán: {x.seller}</span>{buyBtns}
              </GearCard>
            : <Card key={x.id} icon={ITEM_I[parseKey(x.key)[0]]} q={gradeQ(parseKey(x.key)[1])} badge={parseKey(x.key)[1]} count={x.n} title={listingName(x)}
                sub={<span className="c-desc">{x.seller}</span>} right={<>{priceEl(x.price)}{tagEl(x)}</>} open={open === x.id} onToggle={() => toggle(x.id)}>
                <p className="d-desc">{G.ITEMS[parseKey(x.key)[0]].d}</p>{buyBtns}
              </Card>;
        })}
      </div>
      <p className="note">Giá ký gửi càng sát thị trường càng bán nhanh. Đặt mua thì ngược lại: trả càng cao càng mau gom đủ, hàng phẩm cao khó gom hơn. Tiền cọc hoàn lại khi hủy đơn.</p>
    </>
  );
}

// Đơn đặt mua: treo giá, cọc tiền trước, mỗi lượt có người bán dần cho mình
function Bids({ s, act }) {
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState(false);
  const [t, setT] = useState('ore');
  const [g, setG] = useState(() => G.ORE_FOR_TIER[tierFor(s)]);
  const [qty, setQty] = useState(10);
  const [mult, setMult] = useState(1.1);
  const fair = itemFair(s, t, g);
  const price = Math.max(1, Math.round(fair * mult));
  const chance = bidChance(s, { key: `${t}:${g}`, price });
  const old = s.bids.find((x) => x.key === `${t}:${g}`);
  const deposit = (qty + (old?.n || 0)) * price - (old ? old.n * old.price : 0);
  const pickT = (k) => { setT(k); setG(k === 'ore' ? G.ORE_FOR_TIER[tierFor(s)] : k === 'core' || k === 'herb' ? g : pillNeed(s)); };
  return (
    <>
      <p className="sub-head"><Ico i={UI_I.buy} size={18} />Đơn đặt mua <span className="muted num">{s.bids.length}/{G.BID_MAX}</span></p>
      <div className="cards">
        {s.bids.map((x) => {
          const [bt, bg] = parseKey(x.key);
          return (
            <Card key={x.id} icon={ITEM_I[bt]} q={gradeQ(bg)} badge={bg} count={x.n} title={itemName(bt, bg)} tag={<><Ico i={UI_I.time} size={11} />Đang gom</>} tone="info"
              sub={<span className="c-desc">Còn thiếu {x.n} · cọc {fmtGold(x.n * x.price)}</span>}
              right={<span className="price"><Ico i={UI_I.gold} size={13} />{fmtGold(x.price)}</span>} open={open === x.id} onToggle={() => setOpen(open === x.id ? null : x.id)}>
              <div className="prog">
                <span className="sv"><Ico i={UI_I.ok} size={14} />Đã gom <b className="num">{x.got}/{x.got + x.n}</b></span>
                <div className="lv-track thick"><i style={{ width: `${(x.got / (x.got + x.n)) * 100}%` }} /></div>
              </div>
              <span className="sv"><Ico i={UI_I.dice} size={14} />Có người bán ~{Math.round(bidChance(s, x) * 100)}% mỗi lượt</span>
              <span className="sv"><Ico i={UI_I.gold} size={14} />Thị trường {fmtGold(itemFair(s, bt, bg))} · bạn trả {fmtGold(x.price)}</span>
              <div className="c-act"><button className="mini ghost" onClick={() => { act(() => cancelBid(s, x.id)); setOpen(null); }}><Ico i={UI_I.close} />Hủy, lấy lại cọc</button></div>
            </Card>
          );
        })}
        {(s.bids.length < G.BID_MAX || form) && (
          <button className={'card add' + (form ? ' on' : '')} onClick={() => setForm((v) => !v)}>
            <span className="plus">+</span><span>{form ? 'Thu gọn' : 'Đặt mua món đang thiếu'}</span>
          </button>
        )}
      </div>
      {form && (
        <div className="recipe">
          <div className="forge-pick">
            {Object.keys(G.ITEMS).map((k) => (
              <button key={k} className={'slot-btn' + (t === k ? ' on' : '')} onClick={() => pickT(k)} title={G.ITEMS[k].n(g)} aria-label={G.ITEMS[k].n(g)}>
                <Ico i={ITEM_I[k]} size={24} />
              </button>
            ))}
          </div>
          <div className="tier-pick">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((k) => <button key={k} className={g === k ? 'on' : ''} onClick={() => setG(k)}>{k}</button>)}
          </div>
          <div className="recipe-title"><Ico i={ITEM_I[t]} size={22} /><b>{itemName(t, g)}</b></div>
          <span className="sv muted"><Ico i={UI_I.help} size={14} />{G.ITEMS[t].d}</span>
          <span className="sv"><Ico i={UI_I.gold} size={14} />Thị trường {fmtGold(fair)} mỗi món{s.inv[`${t}:${g}`] ? `, đang có ${s.inv[`${t}:${g}`]}` : ''}.</span>
          <label className="field"><span className="sv">Số lượng <b className="num">{qty}</b>{old ? ` (gộp với ${old.n} đang gom)` : ''}</span>
            <input type="range" min="1" max={t === 'tho' ? 5 : 60} value={Math.min(qty, t === 'tho' ? 5 : 60)} onChange={(e) => setQty(+e.target.value)} /></label>
          <label className="field">
            <span className="sv"><Ico i={UI_I.gold} size={14} />Giá <b className="num">{fmtGold(price)}</b> · {Math.round(mult * 100)}% thị trường · <Ico i={UI_I.dice} size={14} />có hàng ~{Math.round(chance * 100)}% mỗi lượt</span>
            <input type="range" min="0.7" max="1.8" step="0.05" value={mult} onChange={(e) => setMult(+e.target.value)} />
          </label>
          <ConfirmBtn cost={deposit} gold={s.gold} disabled={s.gold < deposit || (!old && s.bids.length >= G.BID_MAX)}
            onClick={() => { act(() => placeBid(s, `${t}:${g}`, Math.min(qty, t === 'tho' ? 5 : 60), price)); setForm(false); }}>
            <Ico i={UI_I.tag} />Đặt mua · cọc {fmtGold(deposit)}
          </ConfirmBtn>
        </div>
      )}
    </>
  );
}

// Phòng đấu giá định kỳ: ra giá tranh với các thế lực khác, đối thủ có giá trần ẩn
function Auction({ s, act }) {
  const [open, setOpen] = useState(null);
  if (!aucOpen(s)) {
    const w = aucWait(s);
    return (
      <>
        <p className="empty"><Ico i={UI_I.auction} size={28} />Phòng đấu giá Mễ Đặc Nhĩ đang đóng cửa.<br />{w > 0 ? `Phiên tới mở sau ${w} lượt.` : 'Phiên tới sắp mở.'}</p>
        <p className="note">Mỗi {G.AUCTION_EVERY} lượt mở một phiên kéo dài {G.AUCTION_OPEN} lượt, bán trang bị Cực phẩm trở lên, lô huyền thiết lớn, đan dược hiếm, có khi cả công pháp. Mở bảng này thì thời gian tạm dừng.</p>
      </>
    );
  }
  const lots = s.auc.lots;
  const priceEl = (p) => <span className="price"><Ico i={UI_I.gold} size={13} />{fmtGold(p)}</span>;
  return (
    <>
      <div className="stat-tiles">
        <div title="Phiên còn mở bao nhiêu lượt"><Ico i={UI_I.time} size={20} /><b className="num">{aucLeft(s)}</b><small>lượt còn lại</small></div>
        <div title="Số món bạn đã thắng"><Ico i={UI_I.ach} size={20} /><b className="num">{lots.filter((x) => x.sold === 'me').length}<small>/{lots.length}</small></b><small>đã thắng</small></div>
        <div title="Kim tệ đang có"><Ico i={UI_I.gold} size={20} /><b className="num">{fmtGold(s.gold)}</b><small>kim tệ</small></div>
      </div>
      <p className="sub-head"><Ico i={UI_I.auction} size={18} />Vật phẩm lên sàn</p>
      <div className="cards">
        {lots.map((x) => {
          const mb = minBid(x);
          const [st, tone, si] = x.sold === 'me' ? ['Đã thắng', 'good', UI_I.ach] : x.lead === 'npc' ? ['Bị vượt giá', 'bad', UI_I.up] : ['Chưa ai ra giá', 'fair', UI_I.time];
          const status = <><Ico i={si} size={11} />{st}</>;
          const body = x.sold ? <span className="sv"><Ico i={UI_I.ok} size={14} />Bạn đã mua với giá {fmtGold(x.price)}.</span> : (
            <>
              <span className="sv"><Ico i={UI_I.members} size={14} />{x.lead === 'npc' ? `${x.rival} đang giữ giá, ${rivalMood(s, x)}` : `${x.rival} cũng đang để mắt`}</span>
              <span className="sv"><Ico i={UI_I.gold} size={14} />Ước giá trị {fmtGold(x.fair)} · giá hiện tại {fmtGold(x.price)}</span>
              <div className="c-act">
                {[[1, 'Ra giá'], [1.25, 'Nâng mạnh'], [1.6, 'Áp đảo']].map(([k, n]) => {
                  const b = Math.round(mb * k);
                  return <ConfirmBtn key={k} cost={b} gold={s.gold} className={k === 1 ? 'mini buy' : 'mini'} disabled={s.gold < b} onClick={() => act(() => placeAucBid(s, x.id, b))}><Ico i={UI_I.auction} />{n} · {fmtGold(b)}</ConfirmBtn>;
                })}
              </div>
            </>
          );
          return x.kind === 'gear'
            ? <GearCard key={x.id} it={x.it} s={s} compare tag={status} tone={tone} right={priceEl(x.price)} open={open === x.id} onToggle={() => setOpen(open === x.id ? null : x.id)}>{body}</GearCard>
            : <Card key={x.id} icon={x.kind === 'item' ? ITEM_I[x.t] : x.kind === 'gong' ? UI_I.gong : UI_I.skill} q={x.kind === 'item' ? gradeQ(x.g) : 3} badge={x.g} count={x.n > 1 ? x.n : null}
                title={lotName(s, x)} tag={status} tone={tone} dim={x.sold === 'me'}
                sub={<span className="c-desc">{x.kind === 'item' ? G.ITEMS[x.t].d : 'Nâng cảnh giới công pháp / đấu kỹ lên một bậc.'}</span>}
                right={priceEl(x.price)} open={open === x.id} onToggle={() => setOpen(open === x.id ? null : x.id)}>{body}</Card>;
        })}
      </div>
      <p className="note">Mỗi lần ra giá ít nhất cao hơn 10%. Đối thủ có giới hạn riêng không ai biết — nâng mạnh có thể khiến họ bỏ cuộc sớm, nhưng cũng có thể trả hớ. Hết phiên, món nào chưa thắng sẽ về tay người khác.</p>
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

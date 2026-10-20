import { useRef, useState } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, gearScore, gearName, cp, qualityIdx, countOf } from '../game/util.js';
import { equip, unequip, sellGear, sellWorse, gearSell, bagSellQ, setBagSellQ } from '../game/gear.js';
import { sell, useItem, sellPrice } from '../game/economy.js';
import { netWorth, save } from '../game/engine.js';
import {
  defsOf, ownedOf, owns, activeBeast, setActive, buyBeast, beastPrice, feed, xpNeed, beastLines, bestCore, coreXp, KIND_N, ensureBeasts,
} from '../game/beasts.js';
import { readWardrobe, outfitOf, outfitPrice, buyOutfit, wear } from '../game/wardrobe.js';
import { Sheet, SheetBody, SheetHead, Tabs, Card, Tile, ConfirmBtn } from './ui.jsx';
import { GearCard, GearTile, LockBtn, gradeQ } from './gearUi.jsx';
import Avatar from './Avatar.jsx';
import { Ico, ITEM_I, SLOT_I, NAV_I, UI_I, BEAST_I } from './icons.jsx';
import { pulse, useCountUp } from './motion.js';
import { burst, ring, PAL, Q_PAL } from '../fx/fx.js';
import { play } from '../fx/sfx.js';

const ORDER = ['tho', 'pha', 'tuk', 'lieu', 'hon', 'calm', 'ore', 'herb', 'core'];

export default function Bag({ s, bump, onClose, initTab }) {
  ensureBeasts(s);
  const [tab, setTab] = useState(initTab || 'gear');
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(typeof r === 'string' ? r : r.t); save(s); bump(); return r; };

  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={NAV_I.bag} title="Hành trang" sub={`Tài sản ${fmtGold(netWorth(s))}`} value={fmtGold(s.gold)} valueIcon={UI_I.gold} valueLabel="Kim tệ" />
      <Tabs tab={tab} onTab={(t) => { setTab(t); setMsg(null); play('tap'); }} tabs={[
        ['gear', 'Trang bị', SLOT_I.wep], ['beast', 'Linh thú', UI_I.beast], ['look', 'Ngoại trang', UI_I.outfit], ['bag', 'Vật phẩm', NAV_I.bag],
      ]} />
      <AnimatePresence mode="wait">{msg && <motion.p key={msg} className="bag-msg" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{msg}</motion.p>}</AnimatePresence>
      <SheetBody>
        <motion.div key={tab} className="tab-pane" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }}>
          {tab === 'gear' && <Gear s={s} act={act} />}
          {tab === 'beast' && <Beasts s={s} act={act} />}
          {tab === 'look' && <Look s={s} act={act} />}
          {tab === 'bag' && <Items s={s} act={act} />}
        </motion.div>
      </SheetBody>
    </Sheet>
  );
}

// ───── Trang bị: nhân vật ở giữa, các ô quanh người, kho đồ dạng lưới ─────
const LEFT = ['wep', 'arm', 'boo'];
const RIGHT = ['acc', 'rng'];

function Slot({ s, k, sel, onPick, refs }) {
  const it = s.gear[k];
  return (
    <div className={'doll-slot' + (sel ? ' sel' : '')} ref={(el) => { refs.current[k] = el; }}>
      {it ? (
        <motion.div layoutId={'g' + it.id} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
          <GearTile it={it} sel={sel} onClick={() => onPick(it.id)} />
        </motion.div>
      ) : <Tile icon={SLOT_I[k]} dim title={`${G.GEAR[k].n} trống`} />}
      <small>{G.GEAR[k].n}</small>
    </div>
  );
}

function Gear({ s, act }) {
  const [slot, setSlot] = useState('all');
  const [sel, setSel] = useState(null);
  const refs = useRef({});
  const cpRef = useCountUp(cp(s), (v) => Math.round(v));
  const worn = Object.values(s.gear).find((x) => x?.id === sel);
  const item = worn || s.armory.find((x) => x.id === sel);
  const armory = s.armory
    .filter((it) => slot === 'all' || it.sl === slot)
    .sort((a, b) => G.GEAR_SLOTS.indexOf(a.sl) - G.GEAR_SLOTS.indexOf(b.sl) || gearScore(b) - gearScore(a));
  const better = (it) => s.gear[it.sl] && gearScore(it) > gearScore(s.gear[it.sl]);

  const doEquip = (it) => {
    act(() => equip(s, it.id));
    setSel(it.id);
    play('hammer');
    // Sau khi ô trang bị bay về chỗ: lóe sáng theo màu phẩm chất
    setTimeout(() => {
      const el = refs.current[it.sl];
      burst(el, { n: 30, colors: Q_PAL[qualityIdx(it)], speed: 5 });
      ring(el, { color: Q_PAL[qualityIdx(it)][1], to: 70, life: 600, width: 3 });
      pulse(cpRef.current, 1.25);
    }, 380);
  };

  return (
    <LayoutGroup>
      <div className="split">
      <div className="split-l">
      <div className="doll">
        <div className="doll-col">{LEFT.map((k) => <Slot key={k} s={s} k={k} refs={refs} sel={sel && s.gear[k]?.id === sel} onPick={(id) => setSel(sel === id ? null : id)} />)}</div>
        <div className="doll-center">
          <Avatar s={s} size={200} />
          <div className="doll-cp"><Ico i={UI_I.cp} size={18} /><b ref={cpRef} className="num" /><small>chiến lực</small></div>
        </div>
        <div className="doll-col">{RIGHT.map((k) => <Slot key={k} s={s} k={k} refs={refs} sel={sel && s.gear[k]?.id === sel} onPick={(id) => setSel(sel === id ? null : id)} />)}
          <BeastSlot s={s} kind="pet" />
        </div>
      </div>

      <AnimatePresence>
        {item && (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="doll-detail">
            <GearCard it={item} s={s} compare={!worn} open tag={worn ? 'Đang mặc' : better(item) ? 'Tốt hơn' : null}>
              {worn ? (
                <button className="mini ghost" onClick={() => { act(() => unequip(s, item.sl)); setSel(null); play('close'); }}>Tháo</button>
              ) : (
                <>
                  <button className="mini buy" onClick={() => doEquip(item)}>Mặc vào</button>
                  {!item.lock && <button className="mini ghost" onClick={() => { act(() => sellGear(s, item.id)); setSel(null); play('coin'); }}><Ico i={UI_I.sell} />Bán {fmtGold(gearSell(item))}</button>}
                </>
              )}
              <LockBtn it={item} act={act} />
            </GearCard>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <div className="split-r">
      <div className="sub-row">
        <p className="sub-head">Kho <span className="muted num">{s.armory.length}/{G.ARMORY_MAX}</span></p>
        {s.armory.length > 0 && <button className="mini ghost" onClick={() => { act(() => sellWorse(s)); play('coin'); }} title="Bán mọi món kém hơn đồ đang mặc"><Ico i={UI_I.sell} />Bán đồ kém</button>}
      </div>
      {s.armory.length > 0 && (
        <div className="icon-filter">
          <button className={slot === 'all' ? 'on' : ''} onClick={() => setSlot('all')}>Tất cả</button>
          {G.GEAR_SLOTS.map((k) => <button key={k} className={slot === k ? 'on' : ''} onClick={() => setSlot(k)} title={G.GEAR[k].n} aria-label={G.GEAR[k].n}><Ico i={SLOT_I[k]} size={16} /></button>)}
        </div>
      )}
      {armory.length ? (
        <div className="grid">
          {armory.map((it) => (
            <motion.div key={it.id} layoutId={'g' + it.id} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
              <GearTile it={it} sel={sel === it.id} mark={better(it) ? 'better' : it.lock ? 'worn' : null} onClick={() => { setSel(sel === it.id ? null : it.id); play('tap'); }} />
            </motion.div>
          ))}
        </div>
      ) : <p className="empty">{s.armory.length ? 'Không có món nào ở ô này.' : 'Kho trống. Đồ cũ thay ra sẽ được cất ở đây.'}</p>}

      <div className="icon-filter auto-q" title="Đồ mới vào túi thuộc mức này mà kém hơn đồ đang mặc cùng ô sẽ tự bán; đồ đã khóa thì giữ">
        <span className="muted small"><Ico i={UI_I.sell} size={14} /> Tự bán:</span>
        <button className={bagSellQ(s) < 0 ? 'on' : ''} onClick={() => act(() => setBagSellQ(s, -1))}>Tắt</button>
        {G.QUALITY.slice(0, -1).map((q, i) => (
          <button key={q[1]} className={bagSellQ(s) === i ? 'on' : ''} onClick={() => act(() => setBagSellQ(s, i))} title={i ? `${q[1]} trở xuống` : q[1]}>
            <i className={'q-dot q-bg' + i} />{q[1]}{i ? '↓' : ''}
          </button>
        ))}
      </div>
      </div>
      </div>
    </LayoutGroup>
  );
}

// Ô thú cưng ngay bên cạnh nhân vật
function BeastSlot({ s, kind }) {
  const b = activeBeast(s, kind);
  return (
    <div className="doll-slot">
      <Tile icon={b ? BEAST_I[b.id] : UI_I.beast} q={b ? Math.min(4, Math.floor(b.lv / 2.5)) : 0} dim={!b} badge={b ? b.lv : null} title={b ? defsOf(kind).find((d) => d.id === b.id).n : `Chưa có ${KIND_N[kind].toLowerCase()}`} />
      <small>{KIND_N[kind]}</small>
    </div>
  );
}

// ───── Linh thú ─────
function Beasts({ s, act }) {
  return (
    <>
      {['pet', 'mount'].map((kind) => <BeastKind key={kind} s={s} act={act} kind={kind} />)}
      <p className="note">Linh thú đang theo bên mình cộng hiệu ứng cho bạn và tự lớn dần theo năm tháng. Cho ăn ma hạch để lên cấp nhanh; ma hạch phẩm càng cao càng bổ.</p>
    </>
  );
}

function BeastKind({ s, act, kind }) {
  const own = ownedOf(s, kind);
  const shop = defsOf(kind).filter((d) => !owns(s, kind, d.id));
  const icoRefs = useRef({});
  const g = bestCore(s);
  const doFeed = (b, n) => {
    const r = act(() => feed(s, kind, b.id, n));
    const el = icoRefs.current[b.id];
    if (r?.up) { play('up'); burst(el, { n: 50, colors: PAL.gold, speed: 7 }); ring(el, { to: 90 }); pulse(el, 1.3); }
    else if (r) { play('pick'); burst(el, { n: 14, colors: PAL.jade, speed: 3 }); pulse(el, 1.1); }
  };
  return (
    <section className="beast-sec">
      <p className="sub-head"><Ico i={kind === 'pet' ? UI_I.beast : UI_I.mount} size={18} />{KIND_N[kind]} <span className="muted num">{own.length}/{defsOf(kind).length}</span></p>
      {own.length > 0 ? (
        <div className="beasts">
          {own.map((b) => {
            const d = defsOf(kind).find((x) => x.id === b.id);
            const on = s.beasts[kind] === b.id;
            const max = b.lv >= G.BEAST_MAX;
            return (
              <div key={b.id} className={'beast' + (on ? ' on' : '')}>
                <span className="beast-ico" ref={(el) => { icoRefs.current[b.id] = el; }}><Ico i={BEAST_I[b.id]} size={46} /><b className="num">{b.lv}</b></span>
                <div className="beast-main">
                  <b>{d.n}</b>
                  <span className="beast-fx">{beastLines(s, kind, b).map(([n, v]) => <span key={n} className="sv">{n} <b>{v}</b></span>)}</span>
                  {!max ? <div className="lv-track thick" title={`${b.xp}/${xpNeed(b.lv)} kinh nghiệm`}><i style={{ width: `${(b.xp / xpNeed(b.lv)) * 100}%` }} /></div> : <span className="lvl-max"><Ico i={UI_I.ok} size={13} /> Cấp tối đa</span>}
                </div>
                <div className="beast-act">
                  <button className={'mini' + (on ? ' on' : '')} onClick={() => { act(() => setActive(s, kind, b.id)); play(on ? 'close' : 'roar'); }}>{on ? (kind === 'pet' ? 'Đang theo' : 'Đang cưỡi') : kind === 'pet' ? 'Mang theo' : 'Cưỡi'}</button>
                  {!max && <button className="mini buy" disabled={!g} onClick={() => doFeed(b, 1)} title={g ? `Cho ăn ${itemName('core', g).toLowerCase()} (+${coreXp(g)} kinh nghiệm)` : 'Túi không có ma hạch'}><Ico i={UI_I.feed} />Cho ăn</button>}
                  {!max && countOf(s, 'core') > 1 && <button className="mini ghost" onClick={() => doFeed(b, 10)}>×10</button>}
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="empty"><Ico i={kind === 'pet' ? UI_I.beast : UI_I.mount} size={26} />{kind === 'pet' ? 'Chưa có thú cưng. Cứu ma thú nhỏ khi lịch luyện, hoặc mua ở thú lan dưới đây.' : 'Chưa có tọa kỵ. Thuần phục dã thú trên thảo nguyên, hoặc mua ở thú lan.'}</p>}

      {shop.length > 0 && (
        <div className="beast-shop">
          {shop.map((d) => {
            const lock = s.R < d.minR;
            return (
              <div key={d.id} className={'shop-beast' + (lock ? ' lock' : '')} title={d.d}>
                <span className="sb-ico"><Ico i={lock ? UI_I.lock : BEAST_I[d.id]} size={32} /></span>
                <b>{d.n}</b>
                <small>{lock ? `Cần ${G.REALMS[d.minR].n}` : d.d}</small>
                {!lock && (
                  <ConfirmBtn cost={beastPrice(s, d)} gold={s.gold} disabled={s.gold < beastPrice(s, d)} onClick={() => { act(() => buyBeast(s, kind, d.id)); play('roar'); }}>
                    <Ico i={UI_I.buy} />Mua<span className="cost"><Ico i={UI_I.gold} size={12} />{fmtGold(beastPrice(s, d))}</span>
                  </ConfirmBtn>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ───── Ngoại trang ─────
function Look({ s, act }) {
  const own = readWardrobe();
  const [pick, setPick] = useState(outfitOf(s).id);
  const o = G.OUTFITS.find((x) => x.id === pick);
  const has = own.includes(o.id);
  const wearing = outfitOf(s).id === o.id;
  const stage = useRef(null);
  const put = () => {
    act(() => (has ? wear(s, o.id) : buyOutfit(s, o.id)));
    play('whoosh');
    setTimeout(() => { burst(stage.current, { n: 60, colors: [o.c[0], o.c[1], '#fff3df'], speed: 6 }); play('bell'); }, 150);
  };
  return (
    <div className="look">
      <div className="look-stage" ref={stage}>
        <AnimatePresence mode="wait">
          <motion.div key={o.id} initial={{ opacity: 0, scale: 0.92, filter: 'blur(6px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.32 }}>
            <Avatar s={s} look={o} size={220} />
          </motion.div>
        </AnimatePresence>
        <b className="look-name">{o.n}</b>
        {wearing ? <span className="c-tag info">Đang mặc</span>
          : has ? <button className="btn primary look-btn" onClick={put}>Thay y phục</button>
          : o.buy ? (
            <ConfirmBtn className="btn primary look-btn" cost={outfitPrice(s, o)} gold={s.gold} disabled={s.gold < outfitPrice(s, o)} onClick={put}>
              May bộ này · {fmtGold(outfitPrice(s, o))}
            </ConfirmBtn>
          ) : <span className="muted small"><Ico i={UI_I.lock} size={13} /> {o.how}</span>}
      </div>
      <div className="swatches">
        {G.OUTFITS.map((x) => {
          const ok = own.includes(x.id);
          return (
            <button key={x.id} className={'swatch' + (pick === x.id ? ' sel' : '') + (ok ? '' : ' lock')} onClick={() => { setPick(x.id); play('tap'); }} title={ok ? x.n : `${x.n}: ${x.how}`}>
              <span className="sw-dot" style={{ background: `linear-gradient(135deg, ${x.c[0]} 50%, ${x.c[1]} 50%)` }}>{!ok && <Ico i={UI_I.lock} size={14} />}{outfitOf(s).id === x.id && <Ico i={UI_I.ok} size={14} />}</span>
              <small>{x.n}</small>
            </button>
          );
        })}
      </div>
      <p className="note center">Ngoại trang chỉ đổi dáng vẻ. Bộ nào đã mở thì giữ mãi qua mọi kiếp.</p>
    </div>
  );
}

// ───── Vật phẩm ─────
function Items({ s, act }) {
  const [open, setOpen] = useState(null);
  const items = Object.entries(s.inv)
    .map(([k, n]) => { const [t, g] = parseKey(k); return { k, t, g, n }; })
    .sort((a, b) => ORDER.indexOf(a.t) - ORDER.indexOf(b.t) || b.g - a.g);
  const cur = items.find((x) => x.k === open);
  return (
    <>
      {items.length ? (
        <div className="grid">
          {items.map(({ k, t, g, n }) => (
            <Tile key={k} icon={ITEM_I[t]} q={gradeQ(g)} badge={g} count={n} sel={open === k} title={itemName(t, g)} onClick={() => { setOpen(open === k ? null : k); play('tap'); }} />
          ))}
        </div>
      ) : <p className="empty"><Ico i={NAV_I.bag} size={28} />Túi trống. Đi lịch luyện hoặc nhận nhiệm vụ để có chiến lợi phẩm.</p>}
      {cur && (
        <Card icon={ITEM_I[cur.t]} q={gradeQ(cur.g)} badge={cur.g} count={cur.n} title={itemName(cur.t, cur.g)} open
          right={<span className="price"><Ico i={UI_I.sell} size={13} />{fmtGold(sellPrice(cur.t, cur.g, s))}</span>}>
          <p className="d-desc">{G.ITEMS[cur.t].d}</p>
          <div className="c-act">
            {G.ITEMS[cur.t].use && <button className="mini" onClick={() => { act(() => useItem(s, cur.k)); play('fuse'); }}>Dùng</button>}
            <button className="mini" onClick={() => { act(() => `Đã bán, thu ${fmtGold(sell(s, cur.k, 1))} kim tệ.`); play('coin'); }}><Ico i={UI_I.sell} />Bán 1</button>
            {cur.n > 1 && <button className="mini ghost" onClick={() => { act(() => `Đã bán ${cur.n}, thu ${fmtGold(sell(s, cur.k, cur.n))} kim tệ.`); setOpen(null); play('coin'); }}>Bán hết {cur.n}</button>}
          </div>
        </Card>
      )}
      <div className="toggles">
        <label title="Giữ lại Huyền thiết và ma hạch nếu có lò rèn hay kỵ binh"><input type="checkbox" checked={s.auto.sell} onChange={(e) => act(() => { s.auto.sell = e.target.checked; })} /><Ico i={UI_I.sell} /> Tự bán đồ dư</label>
        <label><input type="checkbox" checked={s.auto.buy} onChange={(e) => act(() => { s.auto.buy = e.target.checked; })} /><Ico i={UI_I.buy} /> Tự mua đan dược</label>
      </div>
    </>
  );
}

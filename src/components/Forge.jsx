import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { motion, AnimatePresence } from 'motion/react';
import G from '../game/data.js';
import { fmtGold, itemName, countOf, gearName, gearScore, qualityIdx, fxText } from '../game/util.js';
import {
  smithLv, smithPlan, upgradeSmith, craftTierCap, nextTierAt, craftCost, canCraft, craft, qualityOdds,
  enhanceCost, enhanceP, enhance, armCost, armValue, armRate, fulfill, sellArms, matHave, fodderList, fodderBoost, FODDER_MAX, findGear,
  canRefineItem, refineCost, canAffordRefine, refine, refineHit, fuseBase, fuseCap, fuseOver, fuseCost, fuseP, fuseMats, fusedVal, fuse, ASCEND_Q,
} from '../game/forge.js';
import { rollPct } from '../game/gear.js';
import { troopCount } from '../game/army.js';
import { placeBid, bidFor, itemFair } from '../game/exchange.js';
import { save } from '../game/engine.js';
import { Sheet, SheetBody, SheetHead, Tabs, UpRow, LevelBuy } from './ui.jsx';
import { GearTile, GearStats, FxList, ROMAN } from './gearUi.jsx';
import GearArt from './gearArt.jsx';
import { Ico, ITEM_I, SLOT_I, NAV_I, UI_I, TROOP_I } from './icons.jsx';
import { calm, pulse, wobble } from './motion.js';
import { burst, sparks, ring, flash, Q_PAL, PAL } from '../fx/fx.js';
import { play } from '../fx/sfx.js';

export default function Forge({ s, bump, onClose, initTab }) {
  const lv = smithLv(s);
  const [tab, setTab] = useState(() => initTab || (lv && s.orders.length ? 'arms' : 'craft'));
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(typeof r === 'string' ? { t: r } : r); save(s); bump(); return r; };

  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={NAV_I.forge} title="Lò rèn" sub={lv ? `Luyện Khí Phòng cấp ${lv}` : 'Chưa dựng lò'} value={fmtGold(s.gold)} valueIcon={UI_I.gold} valueLabel="Kim tệ" />
      <Tabs tab={tab} onTab={(t) => { setTab(t); setMsg(null); play('tap'); }} tabs={[
        ['craft', 'Chế tạo', UI_I.craft], ['enh', 'Cường hóa', UI_I.up], ['refine', 'Tẩy luyện', UI_I.refine], ['fuse', 'Dung luyện', UI_I.fuse],
        ['arms', 'Xưởng', TROOP_I.bo, s.orders.some((o) => s.arms >= o.n)],
      ]} />
      {msg && <Msg {...msg} />}
      <SheetBody>
        <motion.div key={tab} className="tab-pane" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }}>
          {tab === 'craft' && <Craft s={s} act={act} />}
          {tab === 'enh' && <Enhance s={s} act={act} bump={bump} />}
          {tab === 'refine' && <Refine s={s} act={act} bump={bump} />}
          {tab === 'fuse' && <Fuse s={s} act={act} />}
          {tab === 'arms' && <Arms s={s} act={act} />}
        </motion.div>
      </SheetBody>
    </Sheet>
  );
}

// Thông báo, tên trang bị (nếu có) tô màu theo phẩm chất
function Msg({ t, name, q }) {
  const i = name ? t.indexOf(name) : -1;
  if (i < 0) return <p className="bag-msg">{t}</p>;
  return <p className="bag-msg">{t.slice(0, i)}<b className={'q' + q}>{name}</b>{t.slice(i + name.length)}</p>;
}

function SmithUpgrade({ s, act }) {
  const lv = smithLv(s);
  const nt = nextTierAt(s);
  return (
    <ul className="up-list">
      <UpRow icon={NAV_I.forge} name={lv ? 'Lò rèn' : 'Dựng lò rèn'} lv={lv} max={G.SMITHY.max} on={lv > 0}
        eff={nt ? `${G.TIERS[Math.min(G.TIERS.length - 1, nt / 15 + 1)]} ở cấp ${nt}` : 'Mở mọi bậc'}
        desc="Mỗi cấp tăng phẩm chất đồ rèn, tỷ lệ cường hóa, dung luyện và sản lượng binh khí quân dụng. Cứ 15 cấp mở thêm một bậc chế tạo.">
        <LevelBuy lv={lv} max={G.SMITHY.max} gold={s.gold} plan={(w) => smithPlan(s, w)} onBuy={(w) => { act(() => upgradeSmith(s, w)); play('hammer'); }} />
      </UpRow>
    </ul>
  );
}

// Chip nguyên liệu: bấm vào để mở đặt mua nhanh
function Mat({ s, t, g, n, on, onPick }) {
  const have = matHave(s, t, g);
  return (
    <button type="button" className={'mat ' + (have >= n ? 'ok' : 'no') + (on ? ' on' : '')} onClick={onPick}
      title={`${itemName(t, g)}: túi ${countOf(s, t, g)}, kho tông môn ${have - countOf(s, t, g)}. Bấm để đặt mua.`}>
      <Ico i={ITEM_I[t]} size={14} /><span>{itemName(t, g)}</span><b className="num">{have}/{n}</b>
    </button>
  );
}

// Đặt mua nhanh trên sàn với giá 115% thị trường: thiếu thì mua phần thiếu, đủ thì mua thêm một mẻ
function QuickBid({ s, act, t, g, n }) {
  const short = n - matHave(s, t, g);
  const bid = bidFor(s, `${t}:${g}`);
  if (bid) return <span className="sv muted"><Ico i={UI_I.time} size={14} />Sàn đang gom {bid.n} {itemName(t, g).toLowerCase()} cho bạn</span>;
  const q = short > 0 ? short : n;
  const price = Math.round(itemFair(s, t, g) * 1.15);
  return (
    <button className="mini" disabled={s.gold < q * price} onClick={() => act(() => placeBid(s, `${t}:${g}`, q, price))}>
      <Ico i={UI_I.buy} />{short > 0 ? 'Đặt mua' : 'Mua thêm'} {q} {itemName(t, g).toLowerCase()} · {fmtGold(q * price)}
    </button>
  );
}

// Danh sách nguyên liệu kèm ô đặt mua nhanh cho món đang chọn
function Mats({ s, act, gold, mats, extra }) {
  const [pick, setPick] = useState(null);
  const cur = mats.find((m) => `${m.t}:${m.g}` === pick);
  return (
    <>
      <div className="mats">
        {gold != null && <span className={'mat ' + (s.gold >= gold ? 'ok' : 'no')} title="Kim tệ"><Ico i={UI_I.gold} size={14} /><span>Kim tệ</span><b className="num">{fmtGold(gold)}</b></span>}
        {mats.map((m) => {
          const k = `${m.t}:${m.g}`;
          return <Mat key={k} s={s} {...m} on={pick === k} onPick={() => setPick(pick === k ? null : k)} />;
        })}
        {extra}
      </div>
      {cur && <QuickBid s={s} act={act} t={cur.t} g={cur.g} n={cur.buy || cur.n} />}
    </>
  );
}

// Chọn đồ cũ trong túi làm tế phẩm (đồ đã khóa không hiện)
function FodderPick({ s, sel, setSel, exceptId, hint }) {
  const list = fodderList(s, exceptId).sort((a, b) => gearScore(a) - gearScore(b));
  const ids = sel.filter((id) => list.some((it) => it.id === id));
  const flip = (id) => setSel(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < FODDER_MAX ? [...ids, id] : ids);
  // Gợi ý: những món kém hơn đồ đang mặc cùng ô, kém nhất trước
  const weak = list.filter((it) => s.gear[it.sl] && gearScore(it) < gearScore(s.gear[it.sl])).slice(0, FODDER_MAX).map((it) => it.id);
  if (!list.length) return null;
  return (
    <div className="fodder">
      <div className="sub-row">
        <span className="sv"><Ico i={UI_I.craft} size={14} />Tế phẩm <b className="num">{ids.length}/{FODDER_MAX}</b> · {hint}</span>
        {ids.length ? <button className="mini ghost" onClick={() => setSel([])}>Bỏ chọn</button>
          : weak.length > 0 && <button className="mini ghost" onClick={() => setSel(weak)}>Chọn đồ kém</button>}
      </div>
      <div className="mats">
        {list.map((it) => (
          <button key={it.id} type="button" className={'mat' + (ids.includes(it.id) ? ' on' : '')} onClick={() => flip(it.id)} title={gearName(it)}>
            <Ico i={SLOT_I[it.sl]} size={14} /><span className={'q' + qualityIdx(it)}>{G.QUALITY[qualityIdx(it)][1]}</span><b className="num">{ROMAN[it.tier]}{it.en ? ` +${it.en}` : ''}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

// ───── Đe rèn: món đồ đang làm, búa gõ, tia lửa ─────
function Anvil({ it, stageRef, children, big }) {
  const q = qualityIdx(it);
  return (
    <div className={`anvil q-b${q}` + (big ? ' big' : '')} ref={stageRef}>
      <span className="anv-rays" aria-hidden="true" />
      <span className="anv-hammer" aria-hidden="true"><Ico i={UI_I.craft} size={38} /></span>
      <div className="anv-item">
        <GearArt it={it} size={big ? 76 : 64} />
        <span className="anv-tier">{ROMAN[it.tier]}</span>
        <AnimatePresence mode="popLayout">
          <motion.span key={it.en || 0} className="anv-en num" initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>+{it.en || 0}</motion.span>
        </AnimatePresence>
      </div>
      <b className={'anv-name q' + q}>{it.n}</b>
      {children}
    </div>
  );
}
// Một nhát búa: thành thì lóe sáng, bại thì nứt và lắc. quiet: chế độ tự động, ít âm thanh hơn
function strike(el, ok, quiet) {
  if (!el) return;
  const hammer = el.querySelector('.anv-hammer');
  const tile = el.querySelector('.anv-item');
  if (!calm()) animate(hammer, { rotate: [-55, 20, -35], translateY: [0, 10, 0], duration: 280, ease: 'inQuad' });
  setTimeout(() => {
    play(quiet ? (ok ? 'tap' : 'hit') : 'hammer');
    sparks(tile, { n: quiet ? 10 : 28 });
    if (ok) { pulse(tile, 1.12); if (!quiet) ring(tile, { to: 100, life: 520, width: 3 }); }
    else { wobble(tile, 6); el.classList.add('cracked'); setTimeout(() => el.classList.remove('cracked'), 450); }
  }, calm() ? 0 : 150);
}

// Hàng chọn món đồ: đang mặc trước, sau đó là kho
function Picker({ list, sel, onPick, s }) {
  return (
    <div className="picker">
      {list.map((it) => (
        <GearTile key={it.id} it={it} sel={sel === it.id} mark={Object.values(s.gear).some((x) => x?.id === it.id) ? 'worn' : null} onClick={() => { onPick(it.id); play('tap'); }} />
      ))}
    </div>
  );
}

// Vòng lặp tự động: gọi step mỗi nhịp cho tới khi step trả về false hoặc bị dừng.
// alive chặn các nhịp còn sót lại giữa lúc dừng và lúc React dọn interval
function useAuto(step, ms) {
  const [run, setRun] = useState(false);
  const fn = useRef(step);
  const alive = useRef(false);
  fn.current = step;
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => {
      if (!alive.current) return;
      if (!fn.current()) { alive.current = false; setRun(false); }
    }, calm() ? 16 : ms);
    return () => { clearInterval(id); alive.current = false; };
  }, [run]);
  const set = (v) => { alive.current = v; setRun(v); };
  return [run, set];
}
const BUDGETS = [[0.25, '¼'], [0.5, '½'], [1, 'Tất cả']];

// ───── Chế tạo ─────
function Craft({ s, act }) {
  const cap = craftTierCap(s);
  const [sl, setSl] = useState('wep');
  const [tier, setTier] = useState(cap || 1);
  const t = Math.min(tier, cap || 1);
  const c = craftCost(t);
  const [fod, setFod] = useState([]);
  const [shown, setShown] = useState(null);
  const odds = qualityOdds(s, fodderBoost(s, fod, t));
  const doCraft = () => {
    play('hammer');
    const r = act(() => craft(s, sl, t, fod));
    setFod([]);
    if (r?.it) setShown(r.it);
  };
  return (
    <>
      <SmithUpgrade s={s} act={act} />
      {cap > 0 && (
        <>
          <div className="icon-filter">
            {G.GEAR_SLOTS.map((k) => (
              <button key={k} className={sl === k ? 'on' : ''} onClick={() => setSl(k)}>
                <Ico i={SLOT_I[k]} size={16} /> {G.GEAR[k].n}
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
            <Mats s={s} act={act} gold={c.gold} mats={[{ t: 'ore', g: c.ore[0], n: c.ore[1] }, { t: 'core', g: c.core[0], n: c.core[1] }]} />
            <div className="odds-bar" title="Tỷ lệ phẩm chất">
              {G.QUALITY.map((q, i) => q[2] > 0 && <i key={q[1]} className={'q-bg' + i} style={{ width: `${odds[i] * 100}%` }} />)}
            </div>
            <div className="odds-legend">
              {G.QUALITY.map((q, i) => q[2] > 0 && <span key={q[1]} className={'q' + i} title={q[1]}><i className={'q-bg' + i} />{(odds[i] * 100).toFixed(odds[i] < 0.01 ? 1 : 0)}%</span>)}
            </div>
            <FodderPick s={s} sel={fod} setSel={setFod} hint="đốt đồ cũ để tăng tỷ lệ phẩm chất tốt" />
          </div>
          <button className="btn primary" disabled={!canCraft(s, t)} onClick={doCraft}><Ico i={UI_I.craft} size={20} /> Khai lò</button>
        </>
      )}
      {shown && <Reveal it={shown} s={s} onClose={() => setShown(null)} />}
    </>
  );
}

// Trình diện món vừa rèn: hào quang theo phẩm chất, phẩm càng cao càng rực rỡ
// keep: món cũ được nâng phẩm (luyện hóa), không phải đồ mới rèn
function Reveal({ it, s, onClose, keep }) {
  const tile = useRef(null);
  const q = qualityIdx(it);
  const worn = Object.values(s.gear).some((x) => x?.id === it.id);
  useEffect(() => {
    const el = tile.current;
    if (!calm()) animate(el, { scale: [0.2, 1.15, 1], rotate: [-25, 6, 0], opacity: [0, 1], duration: 760, ease: 'outBack(1.6)' });
    const id = setTimeout(() => {
      play(q >= 3 ? 'gong' : q >= 1 ? 'bell' : 'hammer');
      burst(el, { n: 30 + q * 30, colors: Q_PAL[q], speed: 5 + q * 2 });
      if (q >= 2) ring(el, { color: Q_PAL[q][1], to: 160 + q * 40, n: q - 1, gap: 150 });
      if (q >= 4) flash(Q_PAL[q][0], 0.5, 600);
    }, calm() ? 0 : 420);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="reveal-ov" onClick={onClose}>
      <div className={`reveal-card q-b${q}`} onClick={(e) => e.stopPropagation()}>
        {/* Lớp cắt giữ tia sáng xoay trong khung, không làm bảng tràn sinh thanh cuộn */}
        <span className="rv-clip" aria-hidden="true"><span className="rv-rays" /></span>
        <div className="rv-tile" ref={tile}><GearArt it={it} size={84} /><span className="anv-tier">{ROMAN[it.tier]}</span></div>
        <p className="eyebrow">{G.QUALITY[q][1]} · {G.TIERS[it.tier]}</p>
        <b className={'rv-name q' + q}>{it.n}</b>
        {/* Tên và hình đã có ở trên: chỉ hiện chỉ số, so sánh và hiệu ứng */}
        <div className={'rv-info q-b' + q}>
          {worn && !keep && <span className="c-tag info">Đã tự trang bị</span>}
          <GearStats it={it} s={s} compare={!worn && !keep} />
          <FxList it={it} />
        </div>
        <button className="btn primary" autoFocus onClick={onClose}>Nhận</button>
      </div>
    </div>
  );
}

// ───── Cường hóa ─────
function Enhance({ s, act, bump }) {
  const lv = smithLv(s);
  const list = [...G.GEAR_SLOTS.map((k) => s.gear[k]).filter(Boolean), ...s.armory];
  const [id, setId] = useState(list[0]?.id);
  const [fod, setFod] = useState([]);
  const [target, setTarget] = useState(null);
  const [budget, setBudget] = useState(0.5);
  const [log, setLog] = useState(null);
  const stage = useRef(null);
  const it = findGear(s, id) || list[0];
  const tgt = Math.max((it?.en || 0) + 1, Math.min(G.ENHANCE_MAX, target ?? G.ENHANCE_MAX));
  const run0 = useRef(null);

  const [running, setRunning] = useAuto(() => {
    const st = run0.current;
    if (!it || (it.en || 0) >= st.target) return finishAuto(true);
    if (st.gold0 - s.gold >= st.budget) return finishAuto(false, 'Đã tiêu hết ngân sách.');
    const r = enhance(s, it.id);
    if (!r || typeof r === 'string') return finishAuto(false, r || 'Đã tới giới hạn.');
    st.n++;
    if (r.ok) st.ok++;
    strike(stage.current, r.ok, true);
    setLog({ ...st, spent: st.gold0 - s.gold });
    save(s);
    bump();
    if ((it.en || 0) >= st.target) return finishAuto(true);
    return true;
  }, 240);
  function finishAuto(hit, why) {
    const st = run0.current;
    setLog({ ...st, spent: st.gold0 - s.gold, done: hit ? `Đạt +${it.en}!` : why });
    if (hit) { play('win'); burst(stage.current?.querySelector('.anv-item'), { n: 70, colors: Q_PAL[qualityIdx(it)], speed: 8 }); ring(stage.current?.querySelector('.anv-item'), { to: 160, n: 2 }); }
    else play('fail');
    save(s);
    bump();
    return false;
  }

  if (!lv) return <p className="empty"><Ico i={NAV_I.forge} size={28} />Cần dựng lò rèn trước.</p>;
  if (!it) return <p className="empty">Chưa có trang bị nào.</p>;
  const c = enhanceCost(it);
  const base = enhanceP(s, it);
  const p = enhanceP(s, it, fod);
  const max = (it.en || 0) >= G.ENHANCE_MAX;
  const can = !max && s.gold >= c.gold && matHave(s, 'ore', c.ore[0]) >= c.ore[1];
  const tryN = (n) => {
    let ok = 0, last = null;
    for (let i = 0; i < n; i++) {
      const r = enhance(s, it.id, i ? [] : fod);
      if (!r || typeof r === 'string') { last = r; break; }
      if (r.ok) ok++; else { last = r.t; break; }
    }
    setFod([]);
    strike(stage.current, ok > 0 && !last);
    if (ok && !last && n === 1) setTimeout(() => play('bell'), 260);
    return ok ? { t: `${gearName(it)}: thành công ${ok} lần${last ? ', rồi thất bại' : ''}.`, name: gearName(it), q: qualityIdx(it) } : last;
  };
  const start = () => {
    run0.current = { target: tgt, budget: s.gold * budget, gold0: s.gold, n: 0, ok: 0 };
    setLog(null);
    play('charge');
    setRunning(true);
  };

  return (
    <>
      <div className="split">
      <div className="split-l">
      <Picker s={s} list={list} sel={it.id} onPick={(x) => { if (!running) { setId(x); setFod([]); setLog(null); } }} />
      <Anvil it={it} stageRef={stage} big>
        <div className="anv-bar">
          <div className="en-pips" aria-label={`Cường hóa ${it.en || 0}/${G.ENHANCE_MAX}`}>
            {Array.from({ length: G.ENHANCE_MAX }, (_, i) => <i key={i} className={(i < (it.en || 0) ? 'on' : '') + (i >= 6 ? ' risk' : '')} />)}
          </div>
          <span className="num">+{it.en || 0}/{G.ENHANCE_MAX}</span>
        </div>
        <span className={'anv-p num ' + (p >= 0.8 ? 'up' : p >= 0.5 ? '' : 'down')}><Ico i={UI_I.dice} size={15} /> {Math.round(p * 100)}%</span>
      </Anvil>
      </div>
      <div className="split-r">
      {!max && (
        <>
          <Mats s={s} act={act} gold={c.gold} mats={[{ t: 'ore', g: c.ore[0], n: c.ore[1], buy: c.ore[1] * 5 }]} />
          {base < 1 && !running && <FodderPick s={s} sel={fod} setSel={setFod} exceptId={it.id} hint="đốt đồ cũ để tăng tỷ lệ lần kế" />}
          <div className="row-btns">
            <button className="btn primary grow" disabled={!can || running} onClick={() => act(() => tryN(1))}><Ico i={UI_I.craft} size={20} />Đập +{(it.en || 0) + 1}</button>
            <button className="btn grow" disabled={!can || running} onClick={() => act(() => tryN(5))}><Ico i={UI_I.dice} size={18} />Liền 5</button>
          </div>
          <AutoBox running={running} onStart={start} onStop={() => { setRunning(false); finishAuto(false, 'Đã dừng.'); }} can={can} log={log}
            budget={budget} setBudget={setBudget}
            title={<>Đập tự động đến <b className="num">+{tgt}</b></>}>
            <div className="auto-target">
              {[6, 9, 10, 11, 12].filter((v) => v > (it.en || 0)).map((v) => (
                <button key={v} className={tgt === v ? 'on' : ''} disabled={running} onClick={() => setTarget(v)}>+{v}</button>
              ))}
              <input type="range" min={(it.en || 0) + 1} max={G.ENHANCE_MAX} value={tgt} disabled={running} onChange={(e) => setTarget(+e.target.value)} aria-label="Cấp mục tiêu" />
            </div>
          </AutoBox>
        </>
      )}
      {max && <p className="note center"><Ico i={UI_I.ok} /> Đã cường hóa tới cực hạn.</p>}
      <p className="note">Tối đa +{G.ENHANCE_MAX}. Mỗi cấp +10% chỉ số chính và +3% hiệu ứng pháp khí. Tới +6 chắc chắn thành công, từ +7 tỷ lệ giảm dần (+12 gốc chỉ 25%); lò rèn cấp cao và tế phẩm bù thêm. Thất bại chỉ mất nguyên liệu, không tụt cấp.</p>
      </div>
      </div>
    </>
  );
}

// Hộp điều khiển chế độ tự động dùng chung cho cường hóa và tẩy luyện
function AutoBox({ title, running, onStart, onStop, can, log, budget, setBudget, children }) {
  return (
    <div className={'auto-box' + (running ? ' run' : '')}>
      <div className="auto-head"><Ico i={UI_I.auto} size={18} /><span>{title}</span></div>
      {children}
      <div className="auto-row">
        <span className="muted small">Ngân sách</span>
        <div className="icon-filter">
          {BUDGETS.map(([v, n]) => <button key={v} className={budget === v ? 'on' : ''} disabled={running} onClick={() => setBudget(v)} title={`Tiêu tối đa ${n} số kim tệ đang có`}>{n}</button>)}
        </div>
        {running
          ? <button className="mini" onClick={onStop}><Ico i={UI_I.stop} />Dừng</button>
          : <button className="mini buy" disabled={!can} onClick={onStart}><Ico i={UI_I.auto} />Bắt đầu</button>}
      </div>
      {log && (
        <div className="auto-log">
          <span><Ico i={UI_I.dice} size={13} /> <b className="num">{log.n}</b> lần</span>
          {log.ok != null && <span className="up"><Ico i={UI_I.ok} size={13} /> <b className="num">{log.ok}</b></span>}
          <span><Ico i={UI_I.gold} size={13} /> <b className="num">{fmtGold(log.spent)}</b></span>
          {log.done && <b className="auto-done">{log.done}</b>}
        </div>
      )}
    </div>
  );
}

// Thanh độ tốt của một hiệu ứng (80%..120% giá trị chuẩn)
const RollBar = ({ v }) => <span className="roll-bar" title={`Độ tốt ${Math.round(v * 100)}%`}><i style={{ width: `${Math.max(6, v * 100)}%` }} className={v >= 0.8 ? 'hi' : v >= 0.4 ? 'mid' : 'lo'} /></span>;

// ───── Tẩy luyện ─────
function Refine({ s, act, bump }) {
  const lv = smithLv(s);
  const list = [...G.GEAR_SLOTS.map((k) => s.gear[k]).filter(Boolean), ...s.armory].filter(canRefineItem);
  const [id, setId] = useState(list[0]?.id);
  const [locks, setLocks] = useState([]);
  const [want, setWant] = useState([]);
  const [minQ, setMinQ] = useState(0);
  const [budget, setBudget] = useState(0.5);
  const [log, setLog] = useState(null);
  const [fresh, setFresh] = useState([]);
  const stage = useRef(null);
  const box = useRef(null);
  const it = findGear(s, id) || list[0];
  const lk = (it?.fx || []).filter((f) => locks.includes(f.id)).map((f) => f.id);
  const run0 = useRef(null);
  const flick = (changed) => {
    setFresh(changed);
    if (!calm()) animate(box.current?.querySelectorAll('.rf-row.new') || [], { opacity: [0, 1], translateX: [-10, 0], duration: 260, ease: 'outQuad' });
  };

  const [running, setRunning] = useAuto(() => {
    const st = run0.current;
    if (refineHit(it, st.want, st.min, rollPct)) return finishAuto(true);
    if (st.gold0 - s.gold >= st.budget) return finishAuto(false, 'Đã tiêu hết ngân sách.');
    const r = refine(s, it.id, st.locks);
    if (!r || typeof r === 'string') return finishAuto(false, r || 'Không thể tẩy luyện.');
    st.n++;
    strike(stage.current, true, true);
    flick(r.changed);
    setLog({ ...st, spent: st.gold0 - s.gold });
    save(s);
    bump();
    if (refineHit(it, st.want, st.min, rollPct)) return finishAuto(true);
    return true;
  }, 260);
  function finishAuto(hit, why) {
    const st = run0.current;
    setLog({ ...st, spent: st.gold0 - s.gold, done: hit ? 'Đã ra hiệu ứng mong muốn!' : why });
    if (hit) { play('win'); burst(stage.current?.querySelector('.anv-item'), { n: 80, colors: Q_PAL[qualityIdx(it)], speed: 8 }); flash(Q_PAL[qualityIdx(it)][0], 0.3, 500); }
    else play('fail');
    save(s);
    bump();
    return false;
  }

  if (!lv) return <p className="empty"><Ico i={NAV_I.forge} size={28} />Cần dựng lò rèn trước.</p>;
  if (!it) return <p className="empty"><Ico i={UI_I.refine} size={28} />Chưa có món nào tẩy luyện được. Đồ từ Tinh phẩm trở lên mới mang hiệu ứng pháp khí.</p>;
  const c = refineCost(it, lk.length);
  const allLocked = lk.length >= (it.fx?.length || 0) && lk.length > 0;
  const can = canAffordRefine(s, it, lk.length) && !allLocked;
  const once = () => {
    const r = act(() => refine(s, it.id, lk));
    if (r && typeof r !== 'string') { strike(stage.current, true); flick(r.changed); play('fuse'); }
  };
  const flipLock = (fid) => { setLocks(lk.includes(fid) ? lk.filter((x) => x !== fid) : [...lk, fid]); play('tap'); };
  const flipWant = (fid) => setWant(want.includes(fid) ? want.filter((x) => x !== fid) : [...want, fid]);
  const start = () => {
    run0.current = { want: [...want], min: minQ, locks: lk, budget: s.gold * budget, gold0: s.gold, n: 0 };
    setLog(null);
    play('charge');
    setRunning(true);
  };
  const [, hi] = G.AFFIX_COUNT[qualityIdx(it)];
  const slots = Math.max(hi, it.fx?.length || 0);

  return (
    <>
      <div className="split">
      <div className="split-l">
      <Picker s={s} list={list} sel={it.id} onPick={(x) => { if (!running) { setId(x); setLocks([]); setLog(null); setFresh([]); } }} />
      <Anvil it={it} stageRef={stage} />
      <ul className="rf-list" ref={box}>
        {(it.fx || []).map((f) => {
          const t = fxText(it, f);
          const on = lk.includes(f.id);
          return (
            <li key={f.id} className={'rf-row' + (on ? ' locked' : '') + (fresh.includes(f.id) ? ' new' : '') + (want.includes(f.id) ? ' wanted' : '')}>
              <b>{t.n}</b><span className="num">{t.val}</span><RollBar v={rollPct(it, f)} />
              <button className={'mini ghost' + (on ? ' on' : '')} disabled={running} onClick={() => flipLock(f.id)} title={on ? 'Bỏ khóa' : 'Khóa để giữ lại hiệu ứng này'}><Ico i={UI_I.lock} />{on ? 'Giữ' : ''}</button>
            </li>
          );
        })}
        {Array.from({ length: Math.max(0, slots - (it.fx?.length || 0)) }, (_, i) => <li key={'e' + i} className="rf-row empty-slot"><span className="muted small">Ô trống, có thể ra thêm hiệu ứng</span></li>)}
      </ul>
      </div>
      <div className="split-r">
      <Mats s={s} act={act} gold={c.gold} mats={[{ t: 'ore', g: c.ore[0], n: c.ore[1], buy: c.ore[1] * 5 }]}
        extra={lk.length > 0 && <span className="mat" title="Mỗi hiệu ứng khóa làm giá tăng"><Ico i={UI_I.lock} size={14} /><span>Khóa</span><b className="num">×{(G.REFINE.lock ** lk.length).toFixed(1)}</b></span>} />
      <button className="btn primary" disabled={!can || running} onClick={once}><Ico i={UI_I.refine} size={20} />Tẩy luyện</button>
      <AutoBox running={running} onStart={start} onStop={() => { setRunning(false); finishAuto(false, 'Đã dừng.'); }} can={can && want.length > 0} log={log} budget={budget} setBudget={setBudget}
        title={want.length ? <>Tự tẩy đến khi có <b>{want.length}</b> hiệu ứng đã chọn</> : 'Chọn hiệu ứng mong muốn rồi bắt đầu'}>
        <div className="want-chips">
          {G.AFFIX.map((a) => <button key={a.id} className={'fx-pick' + (want.includes(a.id) ? ' on' : '')} disabled={running || want.length >= slots && !want.includes(a.id)} onClick={() => flipWant(a.id)} title={a.d}>{a.n}</button>)}
        </div>
        <div className="auto-row">
          <span className="muted small">Độ tốt tối thiểu</span>
          <div className="icon-filter">
            {[[0, 'Bất kỳ'], [0.5, '≥ 50%'], [0.8, '≥ 80%']].map(([v, n]) => <button key={v} className={minQ === v ? 'on' : ''} disabled={running} onClick={() => setMinQ(v)}>{n}</button>)}
          </div>
        </div>
      </AutoBox>
      <p className="note">Khóa hiệu ứng muốn giữ, phần còn lại được đổ ngẫu nhiên lại cả loại lẫn giá trị. Thanh màu cho biết độ tốt của lần tung (80% → 120% giá trị chuẩn).</p>
      </div>
      </div>
    </>
  );
}

// ───── Dung luyện ─────
function Fuse({ s, act }) {
  const lv = smithLv(s);
  const all = [...G.GEAR_SLOTS.map((k) => s.gear[k]).filter(Boolean), ...s.armory];
  const [mainId, setMain] = useState(all[0]?.id);
  const main = findGear(s, mainId) || all[0];
  const mats = main ? fuseMats(s, main.id) : [];
  const [matId, setMat] = useState(null);
  const mat = mats.find((x) => x.id === matId) || null;
  const [fxId, setFx] = useState(null);
  const [rep, setRep] = useState(null);
  const left = useRef(null);
  const right = useRef(null);
  const core = useRef(null);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(null);

  if (!lv) return <p className="empty"><Ico i={NAV_I.forge} size={28} />Cần dựng lò rèn trước.</p>;
  if (!main) return <p className="empty">Chưa có trang bị nào.</p>;
  const f = mat?.fx?.find((x) => x.id === fxId);
  const same = f && main.fx?.some((x) => x.id === f.id);
  const nfx = main.fx?.length || 0;
  const full = !same && nfx >= fuseCap();
  // Vượt số ô bình thường thì cho chọn thay thế, bỏ trống là luyện hóa cộng thêm
  const canSwap = f && !same && nfx >= fuseBase(main);
  const over = f ? fuseOver(main, f.id, rep) : 0;
  const c = fuseCost(main, over);
  const p = mat ? fuseP(s, main, mat, over) : 0;
  const ready = f && (!full || main.fx.some((x) => x.id === rep)) && s.gold >= c.gold && matHave(s, 'core', c.core[0]) >= c.core[1];
  const red = qualityIdx(main) >= ASCEND_Q;

  const go = () => {
    setBusy(true);
    play('whoosh');
    const dx = left.current && right.current ? left.current.getBoundingClientRect().left - right.current.getBoundingClientRect().left : -120;
    if (!calm()) animate(right.current.querySelector('.tile'), { translateX: [0, dx * 0.55], scale: [1, 0.4], opacity: [1, 0], duration: 620, ease: 'inCubic' });
    setTimeout(() => {
      const r = act(() => fuse(s, main.id, mat.id, f.id, rep));
      const el = left.current;
      if (r?.ascend) { play('gong'); flash(Q_PAL[ASCEND_Q][1], 0.6, 900); burst(el, { n: 160, colors: Q_PAL[ASCEND_Q], speed: 10 }); ring(el, { color: Q_PAL[ASCEND_Q][1], to: 260, n: 4, gap: 140 }); setTimeout(() => setShown(r.it), calm() ? 0 : 700); }
      else if (r?.ok) { play('fuse'); setTimeout(() => play('win'), 250); burst(el, { n: 70, colors: PAL.soul, speed: 7 }); ring(el, { color: '#d6cbff', to: 150, n: 2 }); pulse(el, 1.2); }
      else if (r && typeof r !== 'string') { play('shatter'); burst(core.current, { n: 40, colors: PAL.ink, kind: 'ink', speed: 6 }); wobble(el); }
      setMat(null); setFx(null); setRep(null); setBusy(false);
    }, calm() ? 0 : 640);
  };

  const FxRows = ({ it, pick, on, onPick, preview }) => (
    <ul className="fz-fx">
      {(it.fx || []).map((x) => {
        const t = fxText(it, x);
        return (
          <li key={x.id}>
            <button className={(on === x.id ? 'on ' : '') + (pick ? 'pickable' : '')} disabled={!pick} onClick={() => { onPick?.(x.id); play('tap'); }}>
              <b>{t.n}</b><span className="num">{t.val}</span>
            </button>
          </li>
        );
      })}
      {preview}
      {!it.fx?.length && !preview && <li className="muted small">Chưa có hiệu ứng</li>}
    </ul>
  );

  return (
    <>
      <div className="split">
      <div className="split-l">
      <p className="sub-head"><Ico i={UI_I.target} size={16} />Món chính <span className="muted">giữ lại, nhận thêm hiệu ứng</span></p>
      <Picker s={s} list={all} sel={main.id} onPick={(x) => { setMain(x); setMat(null); setFx(null); setRep(null); }} />
      <div className="fuse">
        <div className="fz-side" ref={left}>
          <GearTile it={main} sel />
          <b className={'q' + qualityIdx(main)}>{main.n}</b>
          <div className={'fz-meter' + (red ? ' red' : '')} title={`Bình thường chứa ${fuseBase(main)}, luyện hóa vượt hạn tới ${fuseCap()} thì hóa ${G.QUALITY[ASCEND_Q][1]}`}>
            {Array.from({ length: fuseCap() }, (_, i) => <i key={i} className={(i < nfx ? 'on' : '') + (i >= fuseBase(main) ? ' over' : '')} />)}
            <span className="num">{nfx}/{fuseCap()}</span>
          </div>
          <FxRows it={main} pick={canSwap} on={rep} onPick={(x) => setRep(rep === x ? null : x)}
            preview={f && <li className="fz-new"><span><Ico i={UI_I.fuse} size={13} /> {fxText(main, { id: f.id, v: fusedVal(main, mat, f) }).n}</span><span className="num">{fxText(main, { id: f.id, v: fusedVal(main, mat, f) }).val}</span></li>} />
          {full && f && <small className="hot">Đã đầy, chọn một hiệu ứng để thay</small>}
          {!full && canSwap && <small className={rep ? 'muted' : 'hot'}>{rep ? 'Sẽ thay hiệu ứng đã chọn' : `Luyện hóa vượt hạn +${over}: tỷ lệ giảm, giá tăng. Hoặc chọn một hiệu ứng để thay`}</small>}
        </div>
        <div className="fz-core" ref={core}>
          <span className="fz-swirl"><Ico i={UI_I.fuse} size={34} /></span>
          {mat && <b className={'num ' + (p >= 0.7 ? 'up' : p >= 0.45 ? '' : 'down')}>{Math.round(p * 100)}%</b>}
        </div>
        <div className="fz-side" ref={right}>
          {mat ? <GearTile it={mat} sel /> : <div className="tile add"><span className="plus">+</span></div>}
          <b className={mat ? 'q' + qualityIdx(mat) : 'muted'}>{mat ? mat.n : 'Phụ liệu'}</b>
          {mat ? <FxRows it={mat} pick on={fxId} onPick={setFx} /> : <small className="muted">Chọn món phụ liệu bên dưới</small>}
        </div>
      </div>
      </div>
      <div className="split-r">
      <p className="sub-head"><Ico i={UI_I.fuse} size={16} />Phụ liệu <span className="muted">tan biến sau khi dung luyện</span></p>
      {mats.length ? (
        <div className="picker">
          {mats.map((x) => <GearTile key={x.id} it={x} sel={matId === x.id} onClick={() => { setMat(x.id); setFx(x.fx[0]?.id); setRep(null); play('tap'); }} />)}
        </div>
      ) : <p className="empty">Trong túi chưa có món nào mang hiệu ứng pháp khí (đồ đã khóa không dùng làm phụ liệu).</p>}
      {mat && <Mats s={s} act={act} gold={c.gold} mats={[{ t: 'core', g: c.core[0], n: c.core[1] }]} />}
      <button className={'btn primary' + (over ? ' ascend' : '')} disabled={!ready || busy} onClick={go}><Ico i={UI_I.fuse} size={20} />{over ? (nfx + 1 >= fuseCap() && !red ? `Luyện hóa ${G.QUALITY[ASCEND_Q][1]}` : 'Luyện hóa') : 'Dung luyện'}</button>
      <p className="note">Hiệu ứng chuyển sang giữ nguyên độ tốt của lần tung gốc, giá trị tính lại theo bậc và phẩm chất món chính. Phụ liệu kém bậc hơn món chính thì tỷ lệ thành công giảm. Thất bại thì phụ liệu vẫn mất.</p>
      <p className="note">Luyện hóa: nhồi quá số ô bình thường, mỗi ô vượt hạn giảm {Math.round(G.FUSE.over * 100)}% tỷ lệ và giá ×{G.FUSE.overGold}. Gom đủ {fuseCap()} hiệu ứng thì món đồ hóa <b className={'q' + ASCEND_Q}>{G.QUALITY[ASCEND_Q][1]}</b>: hệ số phẩm chất ×{G.QUALITY[ASCEND_Q][0]}, mọi hiệu ứng mạnh thêm theo.</p>
      </div>
      </div>
      {shown && <Reveal it={shown} s={s} keep onClose={() => setShown(null)} />}
    </>
  );
}

// ───── Xưởng binh khí ─────
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
              <button className="mini buy" disabled={s.arms < o.n} onClick={() => { act(() => fulfill(s, o.id)); play('coin'); }} title={`Thu ${fmtGold(o.n * o.price)}`}>
                <Ico i={UI_I.ok} />{fmtGold(o.n * o.price)}
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="empty">Chưa có đơn hàng. Các đạo quân sẽ tìm đến khi nghe danh lò rèn.</p>}

      {s.arms > 0 && (
        <div className="row-btns">
          <button className="mini" onClick={() => { act(() => sellArms(s, Math.ceil(s.arms / 2))); play('coin'); }}><Ico i={UI_I.sell} />Bán ½</button>
          <button className="mini ghost" onClick={() => { act(() => sellArms(s, s.arms)); play('coin'); }}>Bán hết</button>
        </div>
      )}
    </>
  );
}

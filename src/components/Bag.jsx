import { useRef, useState } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';
import G from '../game/data.js';
import { parseKey, itemName, fmtGold, gearScore, gearName, cp, fmtCp, qualityIdx, countOf } from '../game/util.js';
import { equip, unequip, sellGear, sellWorse, gearSell, bagSellQ, setBagSellQ } from '../game/gear.js';
import { sell, useItem, sellPrice } from '../game/economy.js';
import { netWorth, save } from '../game/engine.js';
import {
  defsOf, ownedOf, owns, activeBeast, setActive, buyBeast, beastPrice, feed, xpNeed, beastLines, bestCore, coreXp, KIND_N, ensureBeasts,
} from '../game/beasts.js';
import { readWardrobe, outfitOf, outfitPrice, buyOutfit, wear } from '../game/wardrobe.js';
import { ensureSkills, practiceSkill, canPractice, equipSkill, getMasteryLabel, artEffects, artDef, SKILL_CATALOG, SKILL_TIERS } from '../game/skills.js';
import { Sheet, SheetBody, SheetHead, Tabs, Card, Tile, ConfirmBtn } from './ui.jsx';
import { GearCard, GearTile, LockBtn, gradeQ } from './gearUi.jsx';
import Avatar from './Avatar.jsx';
import BeastArt, { BEAST_THEMES } from './beastArt.jsx';
import GearArt, { SlotFallbackArt } from './gearArt.jsx';
import { Ico, ITEM_I, SLOT_I, NAV_I, UI_I, STAT_I, FOCUS_I } from './icons.jsx';
import { pulse, useCountUp } from './motion.js';
import { burst, ring, PAL, Q_PAL } from '../fx/fx.js';
import { play } from '../fx/sfx.js';

const ORDER = ['tho', 'pha', 'tuk', 'lieu', 'hon', 'calm', 'ore', 'herb', 'core'];

export default function Bag({ s, bump, onClose, initTab }) {
  ensureBeasts(s);
  ensureSkills(s);
  const [tab, setTab] = useState(initTab || 'gear');
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(typeof r === 'string' ? r : r.t); save(s); bump(); return r; };

  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={NAV_I.bag} title="Hành trang Tu Tiên" sub={`Tài sản ${fmtGold(netWorth(s))}`} value={fmtGold(s.gold)} valueIcon={UI_I.gold} valueLabel="Kim tệ" />
      <Tabs tab={tab} onTab={(t) => { setTab(t); setMsg(null); play('tap'); }} tabs={[
        ['gear', 'Trang bị', SLOT_I.wep],
        ['beast', 'Linh thú', UI_I.beast],
        ['skill', 'Võ học', STAT_I.qi],
        ['look', 'Ngoại trang', UI_I.outfit],
        ['bag', 'Vật phẩm', NAV_I.bag],
      ]} />
      <AnimatePresence mode="wait">{msg && <motion.p key={msg} className="bag-msg" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{msg}</motion.p>}</AnimatePresence>
      <SheetBody>
        <motion.div key={tab} className="tab-pane" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }}>
          {tab === 'gear' && <Gear s={s} act={act} onOpenTab={setTab} />}
          {tab === 'beast' && <Beasts s={s} act={act} />}
          {tab === 'skill' && <SkillsView s={s} act={act} />}
          {tab === 'look' && <Look s={s} act={act} />}
          {tab === 'bag' && <Items s={s} act={act} />}
        </motion.div>
      </SheetBody>
    </Sheet>
  );
}

// ───── Trang bị: Nhân vật ở giữa, 4 ô mỗi bên cân đối tuyệt đối ─────
const LEFT = ['wep', 'arm', 'boo'];
const RIGHT = ['acc', 'rng'];

function Slot({ s, k, sel, onPick, refs }) {
  const it = s.gear[k];
  return (
    <div className={'doll-slot' + (sel ? ' sel' : '')} ref={(el) => { refs.current[k] = el; }}>
      {it ? (
        <motion.div layoutId={'g' + it.id} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
          <GearTile it={it} sel={sel} peek onClick={() => onPick(it.id)} />
        </motion.div>
      ) : (
        <button className="tile dim" onClick={() => onPick(null)} title={`${G.GEAR[k].n} trống`}>
          <SlotFallbackArt sl={k} size={40} dim />
        </button>
      )}
      <small>{G.GEAR[k].n}</small>
    </div>
  );
}

// Ô Linh Thú / Tọa Kỵ bên cạnh nhân vật
function BeastSlot({ s, kind, onOpenTab }) {
  const b = activeBeast(s, kind);
  const d = b ? defsOf(kind).find((x) => x.id === b.id) : null;
  return (
    <div
      className="doll-slot beast-slot"
      onClick={() => onOpenTab('beast')}
      title={b ? `${d.n} (Cấp ${b.lv}) — Bấm để quản lý ${KIND_N[kind]}` : `Chưa có ${KIND_N[kind].toLowerCase()} — Bấm để mở Thú Lan`}
      style={{ cursor: 'pointer' }}
    >
      {b ? (
        <BeastArt id={b.id} kind={kind} size={44} lv={b.lv} active />
      ) : (
        <Tile icon={kind === 'mount' ? UI_I.mount : UI_I.beast} dim title={`Chưa có ${KIND_N[kind].toLowerCase()}`} />
      )}
      <small>{KIND_N[kind]}</small>
    </div>
  );
}

// Ô Võ Học cạnh người
function SkillSlot({ s, onOpenTab }) {
  ensureSkills(s);
  const sk = SKILL_CATALOG.skill.find((x) => x.id === s.skills.skillId);
  return (
    <div
      className="doll-slot skill-slot"
      onClick={() => onOpenTab('skill')}
      title={sk ? `${sk.n} (${SKILL_TIERS[sk.tier]}) — Bấm để tham ngộ Võ Học` : 'Võ học — Bấm để tu luyện'}
      style={{ cursor: 'pointer' }}
    >
      <Tile icon={FOCUS_I.ky} q={sk ? sk.tier : 0} badge={sk?.tier ? ['', 'Hoàng', 'Huyền', 'Địa', 'Thiên'][sk.tier] : null} count={`${s.mastery | 0}%`} title={sk?.n || 'Võ học'} />
      <small>Võ học</small>
    </div>
  );
}

function Gear({ s, act, onOpenTab }) {
  const [slot, setSlot] = useState('all');
  const [sel, setSel] = useState(null);
  const refs = useRef({});
  const cpRef = useCountUp(cp(s), (v) => fmtCp(v));
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
            {/* Cột trái: Vũ Khí, Hộ Giáp, Chiến Ngoa, TỌA KỴ */}
            <div className="doll-col">
              {LEFT.map((k) => (
                <Slot key={k} s={s} k={k} refs={refs} sel={sel && s.gear[k]?.id === sel} onPick={(id) => setSel(sel === id ? null : id)} />
              ))}
              <BeastSlot s={s} kind="mount" onOpenTab={onOpenTab} />
            </div>

            {/* Trung tâm: Nhân vật Tiên Hiệp & Chiến lực */}
            <div className="doll-center">
              <Avatar s={s} size={210} />
              <div className="doll-cp">
                <Ico i={UI_I.cp} size={18} />
                <b ref={cpRef} className="num" />
                <small>chiến lực</small>
              </div>
            </div>

            {/* Cột phải: Bảo Vật, Giới Chỉ, THÚ CƯNG, VÕ HỌC */}
            <div className="doll-col">
              {RIGHT.map((k) => (
                <Slot key={k} s={s} k={k} refs={refs} sel={sel && s.gear[k]?.id === sel} onPick={(id) => setSel(sel === id ? null : id)} />
              ))}
              <BeastSlot s={s} kind="pet" onOpenTab={onOpenTab} />
              <SkillSlot s={s} onOpenTab={onOpenTab} />
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
            <p className="sub-head">Kho Pháp Bảo <span className="muted num">{s.armory.length}/{G.ARMORY_MAX}</span></p>
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
                  <GearTile it={it} sel={sel === it.id} peek={{ s, compare: true }} mark={better(it) ? 'better' : it.lock ? 'worn' : null} onClick={() => { setSel(sel === it.id ? null : it.id); play('tap'); }} />
                </motion.div>
              ))}
            </div>
          ) : <p className="empty"><Ico i={SLOT_I.wep} size={26} />Kho đồ rỗng. Rèn ở Lò rèn hoặc đi lịch luyện nhặt bảo vật.</p>}

          <div className="icon-filter auto-q" title="Đồ mới vào túi thuộc mức này mà kém hơn đồ đang mặc cùng ô sẽ tự bán; đồ đã khóa thì giữ">
            <span className="muted small"><Ico i={UI_I.sell} size={14} /> Tự bán:</span>
            <button className={bagSellQ(s) < 0 ? 'on' : ''} onClick={() => act(() => setBagSellQ(s, -1))}>Tắt</button>
            {G.QUALITY.slice(0, -2).map((q, i) => (
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

// ───── Linh Thú & Tọa Kỵ ─────
function Beasts({ s, act }) {
  return (
    <>
      {['mount', 'pet'].map((kind) => <BeastKind key={kind} s={s} act={act} kind={kind} />)}
      <p className="note center">
        Linh thú và Tọa kỵ cộng hưởng đạo quả cùng bạn, hỗ trợ sinh tồn và tăng tốc lịch luyện. Cho ăn ma hạch phẩm càng cao thì tiến hóa càng mau.
      </p>
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
      <p className="sub-head">
        <Ico i={kind === 'pet' ? UI_I.beast : UI_I.mount} size={18} />
        {KIND_N[kind]} <span className="muted num">{own.length}/{defsOf(kind).length}</span>
      </p>

      {own.length > 0 ? (
        <div className="beasts-grid-xianxia">
          {own.map((b) => {
            const d = defsOf(kind).find((x) => x.id === b.id);
            const on = s.beasts[kind] === b.id;
            const max = b.lv >= G.BEAST_MAX;
            const theme = BEAST_THEMES[b.id] || { c: '#d9ad5b', tier: 'Linh' };

            return (
              <div key={b.id} className={'beast-card-celestial' + (on ? ' on' : '')}>
                <div className="bc-top" ref={(el) => { icoRefs.current[b.id] = el; }}>
                  <BeastArt id={b.id} kind={kind} size={58} lv={b.lv} active={on} />
                  <div className="bc-info">
                    <div className="bc-header">
                      <b>{d.n}</b>
                      <span className="elem-pill" style={{ color: theme.c, borderColor: `${theme.c}55` }}>
                        {theme.tier} · {theme.elem || 'Linh'}
                      </span>
                    </div>
                    <span className="beast-fx">
                      {beastLines(s, kind, b).map(([n, v]) => (
                        <span key={n} className="sv">{n} <b>{v}</b></span>
                      ))}
                    </span>
                  </div>
                </div>

                <div className="bc-progress">
                  {!max ? (
                    <div className="lv-track thick" title={`${b.xp}/${xpNeed(b.lv)} kinh nghiệm`}>
                      <i style={{ width: `${(b.xp / xpNeed(b.lv)) * 100}%`, background: `linear-gradient(90deg, ${theme.c}, #ffd700)` }} />
                    </div>
                  ) : (
                    <span className="lvl-max"><Ico i={UI_I.ok} size={13} /> Thần thú viên mãn</span>
                  )}
                </div>

                <div className="bc-actions">
                  <button
                    className={'mini' + (on ? ' on' : '')}
                    onClick={() => { act(() => setActive(s, kind, b.id)); play(on ? 'close' : 'roar'); }}
                  >
                    {on ? (kind === 'pet' ? 'Đang theo' : 'Đang cưỡi') : kind === 'pet' ? 'Triệu hoán' : 'Ngự giá'}
                  </button>
                  {!max && (
                    <button
                      className="mini buy"
                      disabled={!g}
                      onClick={() => doFeed(b, 1)}
                      title={g ? `Cho ăn ${itemName('core', g).toLowerCase()} (+${coreXp(g)} kinh nghiệm)` : 'Túi không có ma hạch'}
                    >
                      <Ico i={UI_I.feed} />Cho ăn
                    </button>
                  )}
                  {!max && countOf(s, 'core') > 1 && (
                    <button className="mini ghost" onClick={() => doFeed(b, 10)}>x10</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty">
          <Ico i={kind === 'pet' ? UI_I.beast : UI_I.mount} size={28} />
          {kind === 'pet'
            ? 'Chưa có thú cưng. Cứu ma thú nhỏ khi lịch luyện, hoặc khế ước ở Thú Lan bên dưới.'
            : 'Chưa có tọa kỵ. Thuần phục thần thú trên đại lục, hoặc thuần dưỡng tại Thú Lan.'}
        </p>
      )}

      {shop.length > 0 && (
        <div className="beast-shop-container">
          <p className="sub-head"><Ico i={UI_I.buy} size={16} />Thú Lan — {kind === 'pet' ? 'Khế Ước Linh Thú' : 'Thuần Dưỡng Tọa Kỵ'}</p>
          <div className="beast-shop-grid">
            {shop.map((d) => {
              const lock = s.R < d.minR;
              const theme = BEAST_THEMES[d.id] || { c: '#d9ad5b', tier: 'Linh', elem: 'Linh' };
              return (
                <div key={d.id} className={'shop-beast-celestial' + (lock ? ' lock' : '')}>
                  <BeastArt id={d.id} kind={kind} size={50} lv={1} />
                  <div className="sb-text">
                    <b>{d.n}</b>
                    <small className="sb-tier" style={{ color: theme.c }}>{theme.tier} Giai · Hệ {theme.elem}</small>
                    <p className="sb-desc">{lock ? `Cần đạt cảnh giới ${G.REALMS[d.minR].n}` : d.d}</p>
                  </div>
                  {!lock && (
                    <ConfirmBtn
                      cost={beastPrice(s, d)}
                      gold={s.gold}
                      disabled={s.gold < beastPrice(s, d)}
                      onClick={() => { act(() => buyBeast(s, kind, d.id)); play('roar'); }}
                    >
                      <Ico i={UI_I.buy} />Thuần phục
                      <span className="cost"><Ico i={UI_I.gold} size={12} />{fmtGold(beastPrice(s, d))}</span>
                    </ConfirmBtn>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// ───── Võ Học: Công Pháp & Đấu Kỹ ─────
// Thẻ môn đang dùng: số liệu lấy từ artEffects nên khớp đúng công thức engine
function ArtCard({ s, act, kind }) {
  const id = kind === 'gong' ? s.skills.gongId : s.skills.skillId;
  const def = artDef(id);
  const m = s.skills.mastery[id] || 0;
  const rank = getMasteryLabel(m);
  const ref = useRef(null);
  const can = canPractice(s, id);
  const doPractice = () => {
    const r = act(() => practiceSkill(s, id));
    if (r?.gain) { play('charge'); burst(ref.current, { n: 26, colors: kind === 'gong' ? PAL.qi : PAL.fire, speed: 4 }); pulse(ref.current, 1.06); }
  };
  return (
    <div className={'art-card ' + kind + ' q-b' + def.tier} ref={ref}>
      <div className="art-head">
        <span className="art-seal"><Ico i={kind === 'gong' ? STAT_I.qi : FOCUS_I.ky} size={26} /></span>
        <div className="art-title">
          <small>{kind === 'gong' ? 'Công pháp' : 'Đấu kỹ'} · {SKILL_TIERS[def.tier]} · Hệ {def.elem}</small>
          <h4>{def.n}</h4>
        </div>
      </div>
      <p className="art-quote">{def.quote}</p>
      <p className="art-desc">{def.d}</p>
      <div className="art-rank">
        <span style={{ color: rank.color }}>{rank.label}</span>
        <div className="lv-track thick"><i style={{ width: `${m}%` }} /></div>
        <b className="num">{m}%</b>
      </div>
      <div className="art-fx">
        {artEffects(s, kind).map(([n, v]) => <span key={n} className="sv">{n} <b className="num">{v}</b></span>)}
      </div>
      <div className="art-act">
        <button className="mini buy" disabled={!can} onClick={doPractice} title="Mỗi môn tham ngộ được một lần mỗi lượt">
          <Ico i={kind === 'gong' ? FOCUS_I.tu : FOCUS_I.ky} />{m >= 100 ? 'Đại Viên Mãn' : can ? (kind === 'gong' ? 'Tham ngộ' : 'Khổ luyện') : 'Đã luyện lượt này'}
        </button>
      </div>
    </div>
  );
}

function SkillsView({ s, act }) {
  ensureSkills(s);
  const groups = ['gong', 'skill'].map((kind) => [kind, SKILL_CATALOG[kind]]);
  return (
    <div className="split">
      <div className="split-l art-stack">
        <ArtCard s={s} act={act} kind="gong" />
        <ArtCard s={s} act={act} kind="skill" />
        <p className="note">Công pháp quyết định tốc độ tu luyện, lĩnh ngộ càng sâu tu càng nhanh. Đấu kỹ cộng chiến lực theo độ thuần thục và quyết định chiêu bạo kích khi giao chiến. Chọn chuyên tâm «Luyện kỹ» để thuần thục tự tăng mỗi năm.</p>
      </div>
      <div className="split-r">
        {groups.map(([kind, list]) => (
          <section key={kind} className="art-lib">
            <p className="sub-head"><Ico i={kind === 'gong' ? STAT_I.qi : FOCUS_I.ky} size={16} />{kind === 'gong' ? 'Tàng Kinh · Công pháp' : 'Tàng Kinh · Đấu kỹ'}</p>
            {list.map((def) => {
              const own = s.skills.unlocked.includes(def.id);
              const active = (kind === 'gong' ? s.skills.gongId : s.skills.skillId) === def.id;
              const m = s.skills.mastery[def.id] || 0;
              return (
                <div key={def.id} className={'art-row q-b' + def.tier + (active ? ' active' : '') + (own ? '' : ' lock')}>
                  <i className={'q-dot q-bg' + def.tier} />
                  <div className="art-row-main">
                    <b>{own ? def.n : '??? ' + SKILL_TIERS[def.tier]}</b>
                    <small>{SKILL_TIERS[def.tier]} · {def.elem}{own ? ` · ${m}%` : ' · chưa lĩnh ngộ'}</small>
                  </div>
                  {active ? <span className="c-tag info">Đang dùng</span>
                    : own ? <button className="mini ghost" onClick={() => { act(() => equipSkill(s, def.id)); play('pick'); }}>Vận hành</button>
                    : <Ico i={UI_I.lock} size={14} />}
                </div>
              );
            })}
          </section>
        ))}
        <p className="note">Võ học mới có được qua tông môn, đấu giá, tỷ võ và kỳ ngộ khi lịch luyện. Đổi sang môn bậc thấp hơn sẽ dùng bậc của môn đó.</p>
      </div>
    </div>
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

import { useState } from 'react';
import G from '../game/data.js';
import { fmtGold, cp, effLv, parseKey, itemName } from '../game/util.js';
import { save } from '../game/engine.js';
import {
  sectReqs, canFound, foundSect, genSectName, memberCap, sectPower, warPower, sectTier, bLv, buildPlan, upgradeBuild,
  landCount, landIncome, regionDef, conquerP, attackBlock, startConquest, bEff, tribute, sectUpkeep, bankReserve, withdraw,
} from '../game/sect.js';
import {
  armyCap, troopCount, troopOpen, recruitCost, maxRecruit, recruit, dismiss, armyPower, armyUpkeep, armedPct, trainPlan, train,
} from '../game/army.js';
import { vaultOf, mineTotal, mineK, raidsPerYear, takeItem, takeGear, sellVaultGear, autoSellQ, setAutoSellQ } from '../game/vault.js';
import { gearSell } from '../game/gear.js';
import { Sheet, SheetBody, SheetHead, Tabs, UpRow, LevelBuy, Card } from './ui.jsx';
import { GearCard, LockBtn, gradeQ } from './gearUi.jsx';
import { Ico, NAV_I, UI_I, BUILD_I, TROOP_I, ITEM_I, SLOT_I, EMP_I } from './icons.jsx';
import WorldMap, { RegionCard } from './WorldMap.jsx';

// Hiệu quả ngắn gọn của từng công trình ở cấp hiện tại
const BUILD_EFF = {
  kinh: (e) => `+${Math.round(e * 6)}% tu luyện`,
  dan: (e) => `${Math.round(e)} đan/lượt`,
  vo: (e) => `+${(e * 2.5).toFixed(0)} thực lực`,
  tran: (e) => `+${Math.round(e * 7)} phòng thủ`,
  hien: (e) => `+${Math.round(e * 40)} đệ tử`,
  khoang: (e) => `+${Math.round(e * 25)}% sản lượng mỏ`,
  doanh: (e, s) => `${armyCap(s)} quân`,
};

export default function Sect({ s, bump, onClose, initTab }) {
  const [tab, setTab] = useState(initTab || 'sect');
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };
  const S = s.sect;
  const attack = (id) => { if (startConquest(s, id)) { save(s); bump(); onClose(); } };
  const go = (t) => { setTab(t); setMsg(null); if (t === 'vault' && S) { S.vaultNew = 0; save(s); } };
  const canHit = S && G.REGIONS.some((r) => !attackBlock(s, r) && conquerP(s, regionDef(s, r)) >= 0.6);

  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={NAV_I.sect} title={S ? S.name : 'Tông môn'} sub={S ? sectTier(s) : 'Chưa khai tông'} value={Math.round(warPower(s))} valueIcon={UI_I.power} valueLabel="Thế lực" />
      <Tabs tab={tab} onTab={go} tabs={[['sect', 'Tông môn', NAV_I.sect], ['vault', 'Kho', UI_I.vault, S?.vaultNew > 0], ['bank', 'Ngân khố', UI_I.gold], ['army', 'Quân đội', UI_I.army], ['map', 'Bản đồ', UI_I.map, canHit]]} />
      {msg && <p className="bag-msg">{msg}</p>}
      <SheetBody>
        {tab === 'sect' && !S && <Found s={s} act={act} />}
        {tab === 'sect' && S && <Builds s={s} act={act} />}
        {tab === 'vault' && <Vault s={s} act={act} />}
        {tab === 'bank' && <Bank s={s} act={act} />}
        {tab === 'army' && <Army s={s} act={act} />}
        {tab === 'map' && <MapTab s={s} act={act} attack={attack} />}
      </SheetBody>
    </Sheet>
  );
}

function Found({ s, act }) {
  const [name, setName] = useState(() => s.legacy?.sect?.name || genSectName());
  return (
    <div className="found">
      <ul className="reqs">
        {sectReqs(s).map(([t, ok]) => <li key={t} className={ok ? 'ok' : ''}><Ico i={ok ? UI_I.ok : UI_I.lock} size={16} />{t}</li>)}
      </ul>
      <label className="name-field">
        <span className="sv">Tên tông môn</span>
        <div className="name-row">
          <input value={name} maxLength={28} onChange={(e) => setName(e.target.value)} />
          <button className="mini" onClick={() => setName(genSectName())} title="Đổi tên ngẫu nhiên"><Ico i={UI_I.dice} /></button>
        </div>
      </label>
      <button className="btn primary" disabled={!canFound(s)} onClick={() => act(() => foundSect(s, name))}><Ico i={NAV_I.sect} size={20} /> Khai tông lập phái</button>
    </div>
  );
}

function Builds({ s, act }) {
  const S = s.sect;
  return (
    <>
      <div className="stat-tiles">
        <div title="Đệ tử / giới hạn"><Ico i={UI_I.members} size={20} /><b className="num">{S.members}<small>/{memberCap(s)}</small></b><small>đệ tử</small></div>
        <div title="Trưởng lão"><Ico i={UI_I.elder} size={20} /><b className="num">{S.elders}</b><small>trưởng lão</small></div>
        <div title="Lãnh địa"><Ico i={UI_I.land} size={20} /><b className="num">{landCount(s)}<small>/{G.REGIONS.length}</small></b><small>lãnh địa</small></div>
        <div title="Thuế lãnh địa mỗi năm"><Ico i={UI_I.gold} size={20} /><b className="num">{fmtGold(landIncome(s))}</b><small>thuế/năm</small></div>
        <div title="Chiến lực bản thân"><Ico i={UI_I.cp} size={20} /><b className="num">{Math.round(cp(s))}</b><small>bản thân</small></div>
        <div title="Thực lực tông môn"><Ico i={NAV_I.sect} size={20} /><b className="num">+{Math.round(sectPower(s))}</b><small>tông môn</small></div>
      </div>
      <ul className="up-list">
        {G.BUILDS.map((b) => {
          const lv = bLv(s, b.id);
          return (
            <UpRow key={b.id} icon={BUILD_I[b.id]} name={b.n} lv={lv} max={G.BUILD_MAX} on={lv > 0}
              eff={lv ? BUILD_EFF[b.id](bEff(s, b.id), s) : null}
              desc={`${b.d}${lv > 10 ? ` Hiệu quả hiện tương đương ${effLv(lv).toFixed(1)} cấp (từ cấp 11 mỗi cấp tính 35%).` : ''}`}>
              <LevelBuy lv={lv} max={G.BUILD_MAX} gold={s.gold} plan={(w) => buildPlan(s, b.id, w)} onBuy={(w) => act(() => upgradeBuild(s, b.id, w))} />
            </UpRow>
          );
        })}
      </ul>
    </>
  );
}

// Kho tông môn: mỏ lãnh địa và chiến lợi phẩm đệ tử đổ về, lấy ra khi cần
function Vault({ s, act }) {
  const [open, setOpen] = useState(null);
  if (!s.sect) return <p className="empty"><Ico i={NAV_I.sect} size={28} />Cần khai tông lập phái trước.</p>;
  const v = vaultOf(s);
  const toggle = (k) => setOpen(open === k ? null : k);
  const items = Object.entries(v.inv).sort(([a], [b]) => a.localeCompare(b));
  const mines = Object.entries(mineTotal(s));
  const oreYr = mines.filter(([k]) => k.startsWith('ore')).reduce((a, [, n]) => a + n, 0);
  return (
    <>
      <div className="stat-tiles">
        <div title="Huyền thiết từ mỏ lãnh địa mỗi năm"><Ico i={ITEM_I.ore} size={20} /><b className="num">{Math.round(oreYr)}</b><small>quặng/năm</small></div>
        <div title="Số chuyến đệ tử xuất chinh mỗi năm (40 đệ tử một chuyến)"><Ico i={UI_I.members} size={20} /><b className="num">{raidsPerYear(s).toFixed(1)}</b><small>chuyến/năm</small></div>
        <div title="Hệ số Linh Khoáng Đường"><Ico i={BUILD_I.khoang} size={20} /><b className="num">×{mineK(s).toFixed(2)}</b><small>sản lượng</small></div>
      </div>
      <p className="note">Mỗi vùng chiếm được có mỏ, vùng quặng cho gấp năm. Khai phát vùng và nâng Linh Khoáng Đường để tăng sản lượng. Lò rèn tự lấy nguyên liệu ở đây khi túi thiếu; đồ trong kho không bị tự bán.</p>
      {mines.length > 0 && <p className="sub-head"><Ico i={BUILD_I.khoang} size={18} />Sản lượng mỏ <span className="muted">· mỗi năm</span></p>}
      {mines.length > 0 && (
        <div className="mats">
          {mines.map(([k, n]) => { const [t, g] = parseKey(k); return <span key={k} className="mat" title={`${itemName(t, g)} mỗi năm`}><Ico i={ITEM_I[t]} size={16} /><small>{g}</small><b className="num">+{Math.round(n)}</b></span>; })}
        </div>
      )}
      <p className="sub-head"><Ico i={ITEM_I.ore} size={18} />Nguyên liệu <span className="muted">· tối đa {G.STACK_MAX} mỗi loại</span></p>
      {items.length ? (
        <div className="cards">
          {items.map(([k, n]) => {
            const [t, g] = parseKey(k);
            return (
              <Card key={k} icon={ITEM_I[t]} q={gradeQ(g)} badge={g} count={n} title={itemName(t, g)} tag={n >= G.STACK_MAX ? 'Đầy' : null} tone="bad"
                sub={<span className="c-desc">Trong kho {n} · trong túi {s.inv[k] || 0}</span>}
                open={open === k} onToggle={() => toggle(k)}>
                <div className="c-act">
                  {[10, 50].filter((x) => x < n).map((x) => <button key={x} className="mini" onClick={() => act(() => takeItem(s, k, x))}><Ico i={UI_I.take} />Lấy {x}</button>)}
                  <button className="mini buy" onClick={() => act(() => takeItem(s, k, n))}><Ico i={UI_I.take} />Lấy hết {n}</button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : <p className="empty"><Ico i={UI_I.vault} size={28} />Kho còn trống. Chiếm lãnh địa và chiêu mộ đệ tử để có hàng đổ về.</p>}
      <p className="sub-head"><Ico i={SLOT_I.wep} size={18} />Trang bị <span className="muted num">{v.gear.length}/{G.VAULT_GEAR_MAX}</span></p>
      {v.gear.length ? (
        <div className="cards">
          {v.gear.map((it) => (
            <GearCard key={it.id} it={it} s={s} compare open={open === it.id} onToggle={() => toggle(it.id)}>
              <button className="mini buy" onClick={() => { act(() => takeGear(s, it.id)); setOpen(null); }}><Ico i={UI_I.take} />Lấy về</button>
              {!it.lock && <button className="mini" onClick={() => { act(() => sellVaultGear(s, it.id)); setOpen(null); }}><Ico i={UI_I.sell} />Bán · {fmtGold(gearSell(it))}</button>}
              <LockBtn it={it} act={act} />
            </GearCard>
          ))}
        </div>
      ) : <p className="empty"><Ico i={SLOT_I.wep} size={28} />Chưa có trang bị nào. Đệ tử xuất chinh và chiếm vùng mới sẽ mang về.</p>}
      <div className="sub-row">
        <p className="sub-head"><Ico i={UI_I.sell} size={18} />Tự bán trang bị</p>
      </div>
      <div className="icon-filter">
        <button className={autoSellQ(s) < 0 ? 'on' : ''} onClick={() => act(() => setAutoSellQ(s, -1))}>Tắt</button>
        {G.QUALITY.slice(0, -2).map((q, i) => (
          <button key={q[1]} className={autoSellQ(s) === i ? 'on' : ''} onClick={() => act(() => setAutoSellQ(s, i))}>
            <i className={'q-dot q-bg' + i} />{i ? `${q[1]} trở xuống` : q[1]}
          </button>
        ))}
      </div>
      <p className="note">Trang bị chưa khóa thuộc mức đã chọn được bán ngay khi về kho, tiền vào ngân khố. Kho đầy thì món kém nhất chưa khóa cũng tự bán.</p>
    </>
  );
}

// Ngân khố: thu nhập tông môn dồn về đây, chi phí tông môn trả từ đây trước; tông chủ rút về ví khi cần
function Bank({ s, act }) {
  const S = s.sect;
  if (!S) return <p className="empty"><Ico i={NAV_I.sect} size={28} />Cần khai tông lập phái trước.</p>;
  const bank = S.bank || 0;
  const inc = tribute(s) + landIncome(s);
  const cost = sectUpkeep(s) + armyUpkeep(s);
  const reserve = bankReserve(s);
  const extra = Math.floor(bank - reserve);
  const yr = Object.entries(S.bankYr || {}).filter(([, v]) => v).sort((a, b) => b[1] - a[1]);
  const opts = [['Rút ¼', bank / 4], ['Rút ½', bank / 2], ['Rút phần dư', extra], ['Rút hết', bank]];
  return (
    <>
      <div className="stat-tiles">
        <div title="Kim tệ trong ngân khố tông môn"><Ico i={UI_I.vault} size={20} /><b className="num">{fmtGold(bank)}</b><small>ngân khố</small></div>
        <div title="Đệ tử cống nạp và thuế lãnh địa mỗi năm (ước tính)"><Ico i={UI_I.up} size={20} /><b className="num">+{fmtGold(inc)}</b><small>thu/năm</small></div>
        <div title="Chi phí tông môn và quân lương mỗi năm"><Ico i={UI_I.buy} size={20} /><b className="num">−{fmtGold(cost)}</b><small>chi/năm</small></div>
        <div title="Nên giữ lại hai năm chi phí để không thiếu hụt"><Ico i={UI_I.lock} size={20} /><b className="num">{fmtGold(reserve)}</b><small>dự trữ</small></div>
      </div>
      <div className="row-btns">
        {opts.map(([n, v]) => <button key={n} className={'mini' + (n === 'Rút phần dư' ? ' buy' : '')} disabled={v < 1} onClick={() => act(() => withdraw(s, v))}><Ico i={UI_I.take} />{n}{v >= 1 ? ` · ${fmtGold(v)}` : ''}</button>)}
      </div>
      <label className="switch">
        <input type="checkbox" checked={S.bankAuto !== false} onChange={(e) => act(() => { S.bankAuto = e.target.checked; return null; })} />
        <span>Mỗi năm tự chuyển phần dư trên mức dự trữ về ví</span>
      </label>
      <p className="sub-head"><Ico i={UI_I.time} size={18} />Thu chi năm nay</p>
      {yr.length ? (
        <ul className="bank-led">
          {yr.map(([k, v]) => <li key={k}><span>{k}</span><b className={'num ' + (v > 0 ? 'good' : 'bad')}>{v > 0 ? '+' : '−'}{fmtGold(Math.abs(v))}</b></li>)}
        </ul>
      ) : <p className="empty">Chưa có khoản thu chi nào trong năm.</p>}
      <p className="note">Ngân khố nhận đệ tử cống nạp, thuế lãnh địa, cống phẩm thượng giới, tiền bán trang bị trong kho và nguyên liệu dư khi kho đầy chồng. Chi phí tông môn và quân lương trả từ ngân khố trước, thiếu mới lấy ví của bạn; cả hai cạn thì đệ tử và binh sĩ bỏ đi.</p>
    </>
  );
}

function Army({ s, act }) {
  if (!s.sect) return <p className="empty"><Ico i={NAV_I.sect} size={28} />Cần khai tông lập phái trước.</p>;
  if (!armyCap(s)) return <p className="empty"><Ico i={BUILD_I.doanh} size={28} />Xây Doanh Trại ở tab Tông môn để chiêu mộ quân.</p>;
  const n = troopCount(s);
  return (
    <>
      <div className="stat-tiles">
        <div title="Quân số / giới hạn"><Ico i={UI_I.members} size={20} /><b className="num">{n}<small>/{armyCap(s)}</small></b><small>quân</small></div>
        <div title="Sức chiến cộng vào thế lực"><Ico i={UI_I.army} size={20} /><b className="num">+{Math.round(armyPower(s))}</b><small>sức chiến</small></div>
        <div title="Tỷ lệ binh sĩ có binh khí"><Ico i={TROOP_I.bo} size={20} /><b className="num">{armedPct(s)}%</b><small>có binh khí</small></div>
        <div title="Quân lương mỗi năm"><Ico i={UI_I.buy} size={20} /><b className="num">{fmtGold(armyUpkeep(s))}</b><small>lương/năm</small></div>
      </div>
      <ul className="up-list">
        <UpRow icon={UI_I.train} name="Huấn luyện" lv={s.army.train} max={G.TRAIN_MAX} on={s.army.train > 0} eff={`+${s.army.train * 2}% sức chiến`}
          desc="Mỗi cấp +2% sức chiến toàn quân. Quân có binh khí (từ xưởng ở Lò rèn) mạnh hơn 60%.">
          <LevelBuy lv={s.army.train} max={G.TRAIN_MAX} gold={s.gold} plan={(w) => trainPlan(s, w)} onBuy={(w) => act(() => train(s, w))} />
        </UpRow>
        {G.TROOPS.map((t) => {
          const open = troopOpen(s, t);
          const have = s.army.n[t.id] || 0;
          const mx = open ? maxRecruit(s, t) : 0;
          const c = recruitCost(s, t);
          return (
            <UpRow key={t.id} icon={TROOP_I[t.id]} name={t.n} on={have > 0} locked={!open}
              eff={open ? `${have} · ⚔${t.pow}` : `Doanh Trại ${t.lv}`}
              desc={`${t.d} Chiêu mộ ${fmtGold(c)} mỗi người, lương ${fmtGold((t.up * c) / t.cost)}/năm.`}>
              {open && (
                <div className="lvl-buy">
                  {[10, 50].map((k) => (
                    <button key={k} className="mini buy" disabled={mx < k} onClick={() => act(() => recruit(s, t.id, k))}>
                      +{k}<span className="cost"><Ico i={UI_I.gold} size={12} />{fmtGold(k * c)}</span>
                    </button>
                  ))}
                  {mx > 50 && <button className="mini buy" onClick={() => act(() => recruit(s, t.id, mx))}>max +{mx}<span className="cost"><Ico i={UI_I.gold} size={12} />{fmtGold(mx * c)}</span></button>}
                  {have > 0 && <button className="mini ghost" onClick={() => act(() => dismiss(s, t.id, Math.ceil(have / 4)))} title="Giải ngũ một phần tư">−¼</button>}
                </div>
              )}
            </UpRow>
          );
        })}
      </ul>
    </>
  );
}

function MapTab({ s, act, attack }) {
  const first = G.REGIONS.find((r) => !attackBlock(s, r)) || G.REGIONS.find((r) => !s.land[r.id]) || G.REGIONS[0];
  const [sel, setSel] = useState(first.id);
  return (
    <div className="map-layout">
      <WorldMap s={s} sel={sel} onSel={setSel} />
      <div className="wm-legend">
        <span><i className="own" />Của ta</span><span><i className="easy" />Dễ</span><span><i className="mid" />Cân sức</span><span><i className="hard" />Khó</span><span><i className="lock" />Chưa tới</span>
        <span className="muted">· kéo để di chuyển, cuộn hoặc chụm để phóng to</span>
      </div>
      <div className="prog">
        <span className="sv"><Ico i={EMP_I.unify} size={14} />Nhất thống đại lục <b className="num">{landCount(s)}/{G.REGIONS.length}</b>{s.flags.unified ? ' · đã nhất thống' : ''}</span>
        <div className="lv-track thick"><i style={{ width: `${(landCount(s) / G.REGIONS.length) * 100}%` }} /></div>
      </div>
      <RegionCard s={s} id={sel} onAttack={attack} act={act} />
    </div>
  );
}

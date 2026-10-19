import { useState } from 'react';
import G from '../game/data.js';
import { fmtGold, cp, effLv } from '../game/util.js';
import { save } from '../game/engine.js';
import {
  sectReqs, canFound, foundSect, genSectName, memberCap, sectPower, warPower, sectTier, bLv, buildPlan, upgradeBuild,
  landCount, landIncome, regionDef, conquerP, attackBlock, startConquest as startAttack,
} from '../game/sect.js';
import {
  armyCap, troopCount, troopOpen, recruitCost, maxRecruit, recruit, dismiss, armyPower, armyUpkeep, armedPct, trainPlan, train,
} from '../game/army.js';
import { Sheet, SheetBody, Tabs, LevelBuy } from './ui.jsx';
import { Seal, TROOP_G } from './glyphs.jsx';
import WorldMap, { RegionCard } from './WorldMap.jsx';

const BUILD_G = { kinh: 'Kinh', dan: 'Đan', vo: 'Võ', tran: 'Trận', hien: 'Hiền', doanh: 'Doanh' };

export default function Sect({ s, bump, onClose, initTab }) {
  const [tab, setTab] = useState(initTab || 'sect');
  const [msg, setMsg] = useState(null);
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };
  const S = s.sect;
  const attack = (id) => { if (startAttack(s, id)) { save(s); bump(); onClose(); } };
  const canHit = S && G.REGIONS.some((r) => !attackBlock(s, r) && conquerP(s, regionDef(s, r)) >= 0.6);

  return (
    <Sheet onClose={onClose} mark="Môn" tall>
      <div className="bag-head">
        <div>
          <small className="label">{S ? sectTier(s) : 'Tán tu'}</small>
          <div className="sect-name">{S ? S.name : 'Chưa có tông môn'}</div>
        </div>
        <div className="right">
          <small className="label">Thế lực</small>
          <div className="num big-num">{Math.round(warPower(s))}</div>
        </div>
      </div>

      <Tabs tab={tab} onTab={(t) => { setTab(t); setMsg(null); }} tabs={[['sect', 'Tông môn'], ['army', 'Quân đội'], ['map', 'Bản đồ', canHit]]} />
      {msg && <p className="bag-msg">{msg}</p>}

      <SheetBody>
        {tab === 'sect' && !S && <Found s={s} act={act} />}
        {tab === 'sect' && S && <Builds s={s} act={act} />}
        {tab === 'army' && <Army s={s} act={act} />}
        {tab === 'map' && <MapTab s={s} act={act} attack={attack} />}
      </SheetBody>
      <button className="btn" onClick={onClose}>Đóng</button>
    </Sheet>
  );
}

function Found({ s, act }) {
  const [name, setName] = useState(() => genSectName());
  return (
    <div className="found">
      <p className="note">Khai tông lập phái để thu nhận đệ tử, xây công trình, lập quân đội, mời trưởng lão và chinh phạt các vùng đất trên đại lục.</p>
      <ul className="reqs">
        {sectReqs(s).map(([t, ok]) => <li key={t} className={ok ? 'ok' : ''}><span>{ok ? '✓' : '·'}</span>{t}</li>)}
      </ul>
      <label className="name-field">
        <small className="label">Tên tông môn</small>
        <div className="name-row">
          <input value={name} maxLength={28} onChange={(e) => setName(e.target.value)} />
          <button className="mini" onClick={() => setName(genSectName())}>Đổi</button>
        </div>
      </label>
      <button className="btn primary" disabled={!canFound(s)} onClick={() => act(() => foundSect(s, name))}>Khai tông lập phái</button>
    </div>
  );
}

function Builds({ s, act }) {
  const S = s.sect;
  return (
    <>
      <dl className="sect-stats">
        <div><dt>Đệ tử</dt><dd>{S.members} / {memberCap(s)}</dd></div>
        <div><dt>Trưởng lão</dt><dd>{S.elders}</dd></div>
        <div><dt>Lãnh địa</dt><dd>{landCount(s)} / {G.REGIONS.length}</dd></div>
        <div><dt>Thuế lãnh địa/năm</dt><dd>{fmtGold(landIncome(s))}</dd></div>
        <div><dt>Chiến lực bản thân</dt><dd>{Math.round(cp(s))}</dd></div>
        <div><dt>Tông môn · quân đội</dt><dd>+{Math.round(sectPower(s))} · +{Math.round(armyPower(s))}</dd></div>
      </dl>
      <p className="note">Công trình tối đa cấp {G.BUILD_MAX}. Mười cấp đầu hiệu quả trọn vẹn, từ cấp 11 mỗi cấp tính 35%. Chọn chuyên tâm «Chưởng quản tông môn» để đệ tử tăng nhanh và cống nạp nhiều hơn.</p>
      <ul className="items">
        {G.BUILDS.map((b) => {
          const lv = bLv(s, b.id);
          return (
            <li key={b.id} className="row-wrap">
              <Seal ch={BUILD_G[b.id]} tone={lv ? 'red' : 'outline'} />
              <div className="it-main">
                <b>{b.n} <span className="muted num">cấp {lv}/{G.BUILD_MAX}</span></b>
                <small>{b.d}</small>
                {lv > 10 && <small className="price">Hiệu quả tương đương {effLv(lv).toFixed(1)} cấp</small>}
                <div className="lv-track"><i style={{ width: `${lv}%` }} /></div>
              </div>
              <div className="it-act wide">
                <LevelBuy lv={lv} max={G.BUILD_MAX} gold={s.gold} label={lv ? 'Nâng' : 'Xây'} plan={(w) => buildPlan(s, b.id, w)} onBuy={(w) => act(() => upgradeBuild(s, b.id, w))} />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Army({ s, act }) {
  if (!s.sect) return <p className="empty">Cần khai tông lập phái và xây Doanh Trại trước.</p>;
  if (!armyCap(s)) return <p className="empty">Xây Doanh Trại (tab Tông môn) để bắt đầu chiêu mộ quân đội.</p>;
  const n = troopCount(s);
  return (
    <>
      <div className="stat-grid">
        <div><small className="label">Quân số</small><b className="num">{n}/{armyCap(s)}</b></div>
        <div><small className="label">Sức chiến</small><b className="num">+{Math.round(armyPower(s))}</b></div>
        <div><small className="label">Có binh khí</small><b className="num">{armedPct(s)}%</b></div>
        <div><small className="label">Quân lương/năm</small><b className="num">{fmtGold(armyUpkeep(s))}</b></div>
      </div>
      <div className="upgrade-box">
        <div>
          <b>Huấn luyện <span className="muted num">{s.army.train}/{G.TRAIN_MAX}</span></b>
          <small>Mỗi cấp +2% sức chiến toàn quân. Binh khí từ xưởng quân dụng tự phát cho lính, quân có binh khí mạnh hơn 60%.</small>
        </div>
        <LevelBuy lv={s.army.train} max={G.TRAIN_MAX} gold={s.gold} label="Luyện" plan={(w) => trainPlan(s, w)} onBuy={(w) => act(() => train(s, w))} />
      </div>
      <ul className="items">
        {G.TROOPS.map((t) => {
          const open = troopOpen(s, t);
          const have = s.army.n[t.id] || 0;
          const mx = open ? maxRecruit(s, t) : 0;
          return (
            <li key={t.id} className="row-wrap">
              <Seal ch={TROOP_G[t.id]} tone={have ? 'red' : 'outline'} />
              <div className="it-main">
                <b>{t.n} <span className="muted num">{have}</span></b>
                <small>{open ? t.d : `Cần Doanh Trại cấp ${t.lv}.`}</small>
                {open && <small className="price">Sức chiến {t.pow} · chiêu mộ {fmtGold(recruitCost(s, t))} · lương {fmtGold(t.up * recruitCost(s, t) / t.cost)}/năm</small>}
              </div>
              {open && (
                <div className="it-act wide">
                  <div className="lvl-buy">
                    {[10, 50].map((k) => <button key={k} className="mini buy" disabled={mx < k} onClick={() => act(() => recruit(s, t.id, k))}>+{k}</button>)}
                    {mx > 50 && <button className="mini buy" onClick={() => act(() => recruit(s, t.id, mx))}>+{mx} · {fmtGold(mx * recruitCost(s, t))}</button>}
                    {have > 0 && <button className="mini ghost" onClick={() => act(() => dismiss(s, t.id, Math.ceil(have / 4)))}>Giải ngũ 1/4</button>}
                  </div>
                </div>
              )}
            </li>
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
    <>
      <WorldMap s={s} sel={sel} onSel={setSel} />
      <div className="wm-legend small">
        <span><i className="own" />Của ta</span><span><i className="easy" />Dễ</span><span><i className="mid" />Cân sức</span><span><i className="hard" />Khó</span><span><i className="lock" />Chưa tới được</span>
      </div>
      <RegionCard s={s} id={sel} onAttack={attack} act={act} />
      <p className="note">
        {s.sect
          ? `Thế lực của bạn (chiến lực + tông môn + quân đội): ${Math.round(warPower(s))}. Chỉ đánh được vùng giáp lãnh địa của mình. Mỗi vùng chiếm được làm các thế lực khác cảnh giác hơn (+3% thực lực). Đánh hỏng phải chờ 2 lượt.`
          : 'Cần có tông môn mới có thể chinh phạt lãnh địa.'}
      </p>
    </>
  );
}

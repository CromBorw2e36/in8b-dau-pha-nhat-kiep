import { useState } from 'react';
import G from '../game/data.js';
import { fmtGold, cp } from '../game/util.js';
import { save } from '../game/engine.js';
import {
  sectReqs, canFound, foundSect, genSectName, memberCap, sectPower, warPower, sectTier, bLv, buildCost, upgradeBuild,
  landCount, landIncome, conquerP, warReady, startConquest, regionDef,
} from '../game/sect.js';
import { Sheet } from './ui.jsx';
import { Seal } from './glyphs.jsx';

const BUILD_G = { kinh: 'Kinh', dan: 'Đan', vo: 'Võ', tran: 'Trận', hien: 'Hiền' };

export default function Sect({ s, bump, onClose }) {
  const [tab, setTab] = useState('sect');
  const [msg, setMsg] = useState(null);
  const [name, setName] = useState(() => genSectName());
  const act = (fn) => { const r = fn(); if (r) setMsg(r); save(s); bump(); };
  const S = s.sect;

  const attack = (id) => { if (startConquest(s, id)) { save(s); bump(); onClose(); } };

  return (
    <Sheet onClose={onClose} mark="Môn">
      <div className="bag-head">
        <div>
          <small className="muted">{S ? sectTier(s) : 'Tán tu'}</small>
          <div className="sect-name">{S ? S.name : 'Chưa có tông môn'}</div>
        </div>
        <div className="right">
          <small className="muted">Thế lực</small>
          <div>{Math.round(warPower(s))}</div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {[['sect', 'Tông môn'], ['map', 'Bản đồ']].map(([id, n]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setMsg(null); }}>{n}</button>
        ))}
      </div>

      {msg && <p className="bag-msg">{msg}</p>}

      {tab === 'sect' && !S && (
        <div className="found">
          <p className="muted">Khai tông lập phái để thu nhận đệ tử, xây dựng công trình, mời trưởng lão và chinh phạt các vùng đất trên đại lục.</p>
          <ul className="reqs">
            {sectReqs(s).map(([t, ok]) => <li key={t} className={ok ? 'ok' : ''}><span>{ok ? '✓' : '·'}</span>{t}</li>)}
          </ul>
          <label className="name-field">
            <small className="muted">Tên tông môn</small>
            <div className="name-row">
              <input value={name} maxLength={28} onChange={(e) => setName(e.target.value)} />
              <button className="mini" onClick={() => setName(genSectName())}>Đổi</button>
            </div>
          </label>
          <button className="btn primary" disabled={!canFound(s)} onClick={() => act(() => foundSect(s, name))}>Khai tông lập phái</button>
        </div>
      )}

      {tab === 'sect' && S && (
        <>
          <dl className="sect-stats">
            <div><dt>Đệ tử</dt><dd>{S.members} / {memberCap(s)}</dd></div>
            <div><dt>Trưởng lão</dt><dd>{S.elders}</dd></div>
            <div><dt>Lãnh địa</dt><dd>{landCount(s)}</dd></div>
            <div><dt>Thuế lãnh địa/năm</dt><dd>{fmtGold(landIncome(s))}</dd></div>
            <div><dt>Chiến lực bản thân</dt><dd>{Math.round(cp(s))}</dd></div>
            <div><dt>Thực lực tông môn</dt><dd>+{Math.round(sectPower(s))}</dd></div>
          </dl>
          <p className="muted small">Chọn chuyên tâm «Chưởng quản tông môn» để đệ tử tăng nhanh và cống nạp nhiều hơn. Trưởng lão tự tìm đến khi tông môn đủ danh tiếng.</p>
          <ul className="items">
            {G.BUILDS.map((b) => {
              const lv = bLv(s, b.id);
              const cost = buildCost(b, lv);
              const max = lv >= G.BUILD_MAX;
              return (
                <li key={b.id}>
                  <Seal ch={BUILD_G[b.id]} tone={lv ? 'red' : 'outline'} />
                  <div className="it-main">
                    <b>{b.n} <span className="muted">cấp {lv}/{G.BUILD_MAX}</span></b>
                    <small>{b.d}</small>
                  </div>
                  <div className="it-act">
                    <button className="mini buy" disabled={max || s.gold < cost} onClick={() => act(() => upgradeBuild(s, b.id))}>
                      {max ? 'Tối đa' : fmtGold(cost)}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tab === 'map' && (
        <>
          <p className="muted small">
            {S ? `Thế lực của bạn (chiến lực + tông môn): ${Math.round(warPower(s))}. Mỗi vùng chiếm được làm các thế lực khác cảnh giác hơn (+4% thực lực). Đánh hỏng phải chờ 2 lượt.` : 'Cần có tông môn mới có thể chinh phạt lãnh địa.'}
          </p>
          <ul className="items regions">
            {G.REGIONS.map((r, i) => {
              const mine = !!s.land[r.id];
              const def = regionDef(s, r);
              const p = conquerP(s, def);
              const zone = i === 0 || G.REGIONS[i - 1].z !== r.z;
              return (
                <li key={r.id} className={(mine ? 'mine' : '') + (zone ? ' zone' : '')} data-zone={zone ? r.z : undefined}>
                  <Seal ch={mine ? 'Ta' : 'Địch'} tone={mine ? 'red' : 'outline'} size="sm" />
                  <div className="it-main">
                    <b>{r.n}</b>
                    <small>{mine ? `Lãnh địa của ${S.name}` : `${r.own} · thực lực ${def}`} · {fmtGold(r.inc)}/năm{r.item ? ` + ${r.item === 'core' ? 'ma hạch' : 'dược liệu'}` : ''}</small>
                  </div>
                  <div className="it-act">
                    {mine ? <span className="tag-own">Đã chiếm</span> : (
                      <button className="mini" disabled={!S || !warReady(s, r.id)} onClick={() => attack(r.id)}>
                        {S ? (warReady(s, r.id) ? `Công · ${Math.round(p * 100)}%` : 'Nghỉ quân') : 'Công'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <button className="btn" onClick={onClose}>Đóng</button>
    </Sheet>
  );
}

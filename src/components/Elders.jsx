import { useState } from 'react';
import G from '../game/data.js';
import { gearName, qualityIdx, fmtCp, fmtGold } from '../game/util.js';
import { ensureElders, elderCp, elderPower, enCap, realmCap, mentorCap, giftGear, dismissElder, elderMax, elderRoom, hireCost, hireWait, postHire, hireElder, whoOf } from '../game/elders.js';
import { Tile, Bar } from './ui.jsx';
import { GearTile, GearStats, FxList } from './gearUi.jsx';
import Avatar from './Avatar.jsx';
import { Ico, NAV_I, UI_I, SLOT_I } from './icons.jsx';
import { play } from '../fx/sfx.js';

// Tab Trưởng lão: lão sư (khi đã có nhục thân) và các trưởng lão, mỗi người một bộ trang bị tự rèn
export default function Elders({ s, act }) {
  const list = s.sect ? ensureElders(s) : [];
  if (!s.mentor && !list.length && !s.sect) {
    return (
      <p className="empty"><Ico i={UI_I.elder} size={28} />
        Khai tông lập phái để chiêu mộ trưởng lão.
        {s.master && !s.mentor ? ' Lão sư trong nhẫn vẫn chỉ là hồn thể; tìm Bồ Đề Hóa Thể Tiên để tái tạo nhục thân.' : ''}
      </p>
    );
  }
  return (
    <>
      {s.sect && <HireBoard s={s} act={act} />}
      <p className="note">Trưởng lão tự tu luyện và tự rèn đồ mỗi năm, nhưng luôn kém tông chủ một cảnh giới (cao nhất {G.REALMS[realmCap(s)].n}) và chỉ cường hóa được tới +{Math.min(9, 2 + realmCap(s))}. Ban thưởng đồ trong túi để tăng trung thành; kẻ dưới 45 trung thành có thể phản bội.</p>
      <div className="elders">
        {s.mentor && <ElderCard s={s} e={s.mentor} id="mentor" act={act} cap={mentorCap(s)} />}
        {list.map((e) => <ElderCard key={e.id} s={s} e={e} id={e.id} act={act} cap={realmCap(s)} />)}
      </div>
    </>
  );
}

// Chiêu Hiền Bảng: treo bảng tốn tiền, chọn một trong các ứng viên; ngoài ra trưởng lão còn đến qua các sự kiện
function HireBoard({ s, act }) {
  const room = elderRoom(s);
  const wait = hireWait(s);
  const cands = s.sect.hire?.list || [];
  const cost = hireCost(s);
  return (
    <div className="hire-board">
      <div className="sub-row">
        <p className="sub-head">Chiêu Hiền Bảng <span className="muted num">{ensureElders(s).length}/{elderMax(s)} ghế</span></p>
        <button className="mini buy" disabled={!!wait || s.gold < cost || room <= 0} onClick={() => { act(() => postHire(s)); play('bell'); }}
          title="Mỗi lần treo bảng có 3 ứng viên; 5 năm mới treo lại được">
          <Ico i={UI_I.elder} />{wait ? `Treo lại sau ${wait} năm` : `Treo bảng (${fmtGold(cost)})`}
        </button>
      </div>
      {room <= 0 && <small className="muted">Đã đủ ghế. Nâng Chiêu Hiền Điện để thêm ghế trưởng lão (tối đa 12).</small>}
      {cands.length > 0 ? (
        <div className="hire-list">
          {cands.map((c, i) => (
            <div key={c.e.id} className="hire-cand">
              <div className="el-ava"><Avatar s={{ g: c.e.g, R: c.e.R, gear: c.e.gear, name: c.e.n }} look={G.OUTFITS.find((o) => o.id === c.e.look)} size={64} beasts={false} still /></div>
              <div className="hc-info">
                <b>{whoOf(c.e)}</b>
                <span className="muted small">{G.REALMS[c.e.R].n} · <Ico i={UI_I.cp} size={12} /> {fmtCp(elderCp(c.e))} · trung thành {Math.round(c.e.loy)}</span>
                <small className="muted">{c.story[0].toUpperCase() + c.story.slice(1)}.</small>
              </div>
              <button className="mini buy" disabled={room <= 0 || s.gold < c.fee} onClick={() => { act(() => hireElder(s, i)); play('coin'); }}>Mời ({fmtGold(c.fee)})</button>
            </div>
          ))}
        </div>
      ) : (
        <small className="muted">Treo bảng để cao nhân bốn phương đến ứng tuyển. Ngoài ra trưởng lão còn tự tìm đến qua cơ duyên: cứu người bị truy sát, ba lần lên núi mời ẩn sĩ, thu nhận trưởng lão địch quy hàng, dạy thành tài một thiếu niên dị bẩm.</small>
      )}
    </div>
  );
}

function ElderCard({ s, e, id, act, cap }) {
  const [gift, setGift] = useState(false);
  const [sel, setSel] = useState(null);
  const [armed, setArmed] = useState(false);
  const mentor = id === 'mentor';
  const look = G.OUTFITS.find((o) => o.id === e.look);
  const it = sel && e.gear[sel];
  const bag = s.armory.filter((x) => !x.lock);
  const tone = e.loy >= 70 ? 'good' : e.loy >= 45 ? '' : 'bad';
  return (
    <div className={'elder-card' + (mentor ? ' mentor' : '')}>
      <div className="el-top">
        <div className="el-ava"><Avatar s={{ g: e.g, R: e.R, gear: e.gear, name: e.n }} look={look} size={92} beasts={false} still /></div>
        <div className="el-info">
          <p className="eyebrow">{mentor ? 'Lão sư' : `${e.title} trưởng lão`}</p>
          <b className="el-name">{e.n}</b>
          <span className="el-realm">{G.REALMS[e.R].n}{e.R >= cap ? <small className="muted"> · đỉnh</small> : null}</span>
          <div className="el-stats">
            <span title="Chiến lực"><Ico i={UI_I.cp} size={14} /><b className="num">{fmtCp(elderCp(e))}</b></span>
            {s.sect && <span title="Đóng góp vào thực lực tông môn"><Ico i={NAV_I.sect} size={14} /><b className="num">+{fmtCp(elderPower(e) * (mentor ? 1.5 : 1))}</b></span>}
            <span title="Trần cường hóa theo cảnh giới"><Ico i={UI_I.craft} size={14} /><b className="num">+{enCap(e)}</b></span>
          </div>
          {!mentor && (
            <div className={'el-loy ' + tone} title="Trung thành">
              <small>Trung thành</small><Bar value={e.loy} max={100} thin tone={`var(--${tone || 'gold'})`} /><b className="num">{Math.round(e.loy)}</b>
            </div>
          )}
        </div>
      </div>
      <div className="el-gear">
        {G.GEAR_SLOTS.map((k) => (e.gear[k]
          ? <GearTile key={k} it={e.gear[k]} sel={sel === k} peek onClick={() => { setSel(sel === k ? null : k); play('tap'); }} />
          : <Tile key={k} icon={SLOT_I[k]} dim title={`${G.GEAR[k].n}: trống`} />))}
      </div>
      {it && (
        <div className={'el-detail q-b' + qualityIdx(it)}>
          <b className={'q' + qualityIdx(it)}>{gearName(it)}</b>
          <GearStats it={it} s={s} />
          <FxList it={it} />
        </div>
      )}
      <div className="row-btns">
        <button className="mini" disabled={!bag.length} onClick={() => { setGift(!gift); play('tap'); }}><Ico i={UI_I.gold} />{gift ? 'Đóng' : 'Ban thưởng'}</button>
        {!mentor && (
          <button className={'mini ghost' + (armed ? ' armed' : '')} onClick={() => { if (!armed) return setArmed(true); act(() => dismissElder(s, id)); }} onBlur={() => setArmed(false)}>
            {armed ? 'Chắc chắn trục xuất?' : 'Trục xuất'}
          </button>
        )}
      </div>
      {gift && (
        <>
          <small className="muted">Chọn món trong túi để ban. Món cũ cùng ô truyền lại cho đệ tử, không trả về túi.</small>
          <div className="picker">
            {bag.map((x) => {
              const cur = e.gear[x.sl];
              const mark = !cur || x.tier > cur.tier || (x.tier === cur.tier && qualityIdx(x) > qualityIdx(cur)) ? 'better' : null;
              return <GearTile key={x.id} it={x} peek mark={mark} onClick={() => { act(() => giftGear(s, id, x.id)); setGift(false); setSel(x.sl); play('coin'); }} />;
            })}
          </div>
        </>
      )}
    </div>
  );
}

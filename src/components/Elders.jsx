import { useState } from 'react';
import G from '../game/data.js';
import { gearName, qualityIdx } from '../game/util.js';
import { ensureElders, elderCp, elderPower, enCap, realmCap, mentorCap, giftGear, dismissElder } from '../game/elders.js';
import { Tile, Bar } from './ui.jsx';
import { GearTile, GearStats, FxList } from './gearUi.jsx';
import Avatar from './Avatar.jsx';
import { Ico, NAV_I, UI_I, SLOT_I } from './icons.jsx';
import { play } from '../fx/sfx.js';

// Tab Trưởng lão: lão sư (khi đã có nhục thân) và các trưởng lão, mỗi người một bộ trang bị tự rèn
export default function Elders({ s, act }) {
  const list = s.sect ? ensureElders(s) : [];
  if (!s.mentor && !list.length) {
    return (
      <p className="empty"><Ico i={UI_I.elder} size={28} />
        {s.sect ? 'Chưa có trưởng lão nào. Danh tiếng tông môn lên cao thì tán tu sẽ tìm đến xin nhập môn.' : 'Khai tông lập phái để chiêu mộ trưởng lão.'}
        {s.master && !s.mentor ? ' Lão sư trong nhẫn vẫn chỉ là hồn thể; tìm Bồ Đề Hóa Thể Tiên để tái tạo nhục thân.' : ''}
      </p>
    );
  }
  return (
    <>
      <p className="note">Trưởng lão tự tu luyện và tự rèn đồ mỗi năm, nhưng luôn kém tông chủ một cảnh giới (cao nhất {G.REALMS[realmCap(s)].n}) và chỉ cường hóa được tới +{Math.min(9, 2 + realmCap(s))}. Ban thưởng đồ trong túi để tăng trung thành; kẻ dưới 45 trung thành có thể phản bội.</p>
      <div className="elders">
        {s.mentor && <ElderCard s={s} e={s.mentor} id="mentor" act={act} cap={mentorCap(s)} />}
        {list.map((e) => <ElderCard key={e.id} s={s} e={e} id={e.id} act={act} cap={realmCap(s)} />)}
      </div>
    </>
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
            <span title="Chiến lực"><Ico i={UI_I.cp} size={14} /><b className="num">{Math.round(elderCp(e))}</b></span>
            {s.sect && <span title="Đóng góp vào thực lực tông môn"><Ico i={NAV_I.sect} size={14} /><b className="num">+{(elderPower(e) * (mentor ? 1.5 : 1)).toFixed(1)}</b></span>}
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
          ? <GearTile key={k} it={e.gear[k]} sel={sel === k} onClick={() => { setSel(sel === k ? null : k); play('tap'); }} />
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
              return <GearTile key={x.id} it={x} mark={mark} onClick={() => { act(() => giftGear(s, id, x.id)); setGift(false); setSel(x.sl); play('coin'); }} />;
            })}
          </div>
        </>
      )}
    </div>
  );
}

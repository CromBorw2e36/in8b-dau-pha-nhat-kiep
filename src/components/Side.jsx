// Hai cột bên của màn chơi trên máy tính rộng (≥ 1280px): nhân vật bên trái, thế cục bên phải.
// Màn hẹp hơn thì ẩn đi (CSS), mọi thông tin vẫn có trong các bảng.
import G from '../game/data.js';
import { cp, realmLabel, btChance, fmtGold, activeBeast, beastDef, holding } from '../game/util.js';
import { ACH, readAch } from '../game/ach.js';
import { outfitOf } from '../game/wardrobe.js';
import Avatar from './Avatar.jsx';
import { Tile } from './ui.jsx';
import { GearTile } from './gearUi.jsx';
import BeastArt from './beastArt.jsx';
import { SlotFallbackArt } from './gearArt.jsx';
import { Ico, UI_I, SLOT_I, NAV_I, FOCUS_I, BEAST_I, STAT_I } from './icons.jsx';

export function SideLeft({ s, onOpen }) {
  const pet = activeBeast(s, 'pet');
  const mount = activeBeast(s, 'mount');
  return (
    <aside className="side left" aria-label="Nhân vật">
      <button className="side-doll" onClick={() => onOpen('bag:gear')} title="Mở trang bị">
        <Avatar s={s} size={210} />
        <span className="side-cp"><Ico i={UI_I.cp} size={16} /><b className="num">{Math.round(cp(s))}</b><small>chiến lực</small></span>
      </button>
      <p className="side-look muted small"><Ico i={UI_I.outfit} size={13} /> {outfitOf(s).n}</p>
      <div className="side-slots">
        {G.GEAR_SLOTS.map((k) => (s.gear[k]
          ? <GearTile key={k} it={s.gear[k]} onClick={() => onOpen('bag:gear')} />
          : <button key={k} className="tile dim" title={`${G.GEAR[k].n} trống`} onClick={() => onOpen('bag:gear')}><SlotFallbackArt sl={k} size={36} dim /></button>))}
        {pet ? (
          <button className="tile beast-tile-btn" onClick={() => onOpen('bag:beast')} title={beastDef('pet', pet.id).n}>
            <BeastArt id={pet.id} kind="pet" size={38} lv={pet.lv} active />
          </button>
        ) : (
          <Tile icon={UI_I.beast} dim title="Chưa có thú cưng" onClick={() => onOpen('bag:beast')} />
        )}
        {mount ? (
          <button className="tile beast-tile-btn" onClick={() => onOpen('bag:beast')} title={beastDef('mount', mount.id).n}>
            <BeastArt id={mount.id} kind="mount" size={38} lv={mount.lv} active />
          </button>
        ) : (
          <Tile icon={UI_I.mount} dim title="Chưa có thú cưỡi" onClick={() => onOpen('bag:beast')} />
        )}
      </div>
    </aside>
  );
}

// Vòng tiến độ đấu khí
function QiRing({ s }) {
  const topped = s.R >= 11 && s.step >= 100;
  const v = topped ? 100 : Math.min(100, s.qi);
  const C = 2 * Math.PI * 52;
  return (
    <svg className="qi-ring" viewBox="0 0 120 120" aria-label={`Đấu khí ${Math.floor(v)}%`}>
      <circle cx="60" cy="60" r="52" className="qr-bg" />
      <circle cx="60" cy="60" r="52" className={'qr-fg' + (s.ready ? ' hot' : '')} strokeDasharray={C} strokeDashoffset={C * (1 - v / 100)} transform="rotate(-90 60 60)" />
      <text x="60" y="56" textAnchor="middle" className="qr-v">{topped ? '∞' : `${Math.floor(v)}%`}</text>
      <text x="60" y="76" textAnchor="middle" className="qr-l">{s.ready ? 'Bình cảnh' : 'Đấu khí'}</text>
    </svg>
  );
}

export function SideRight({ s, onOpen, onBreak }) {
  const f = G.FOCUS.find((x) => x.id === s.focus);
  const got = readAch();
  const achN = ACH.filter((a) => got[a.id]).length;
  // Thu chi của lượt vừa qua, gộp theo khoản
  const led = {};
  for (const [k, v] of s.led || []) led[k] = (led[k] || 0) + v;
  const rows = Object.entries(led).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 5);
  const net = Object.values(led).reduce((a, v) => a + v, 0);
  return (
    <aside className="side right" aria-label="Thế cục">
      <div className="side-card realm">
        <QiRing s={s} />
        <div>
          <small className="muted">Cảnh giới</small>
          <b>{realmLabel(s)}</b>
          {s.ready && s.R < 11 && <span className="side-bt"><Ico i={UI_I.up} size={14} />Đột phá {Math.round(btChance(s) * 100)}%</span>}
          {s.ready && holding(s) && <button className="mini buy" onClick={onBreak}><Ico i={UI_I.up} />Xung kích</button>}
        </div>
      </div>
      {s.started && f && (
        <div className="side-card focus">
          <span className="f-ico"><Ico i={FOCUS_I[f.id]} size={20} /></span>
          <div><small className="muted">Đang chuyên tâm</small><b>{f.n}</b></div>
        </div>
      )}
      <div className="side-card">
        <div className="side-h"><Ico i={UI_I.ledger} size={15} />Thu chi năm qua <b className={'num ' + (net >= 0 ? 'up' : 'down')}>{net >= 0 ? '+' : '−'}{fmtGold(Math.abs(net))}</b></div>
        {rows.length ? (
          <ul className="side-led">
            {rows.map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <i style={{ width: `${Math.min(100, (Math.abs(v) / Math.max(...rows.map((r) => Math.abs(r[1])))) * 100)}%` }} className={v >= 0 ? 'in' : 'out'} />
                <b className={'num ' + (v >= 0 ? 'up' : 'down')}>{fmtGold(Math.abs(v))}</b>
              </li>
            ))}
          </ul>
        ) : <p className="muted small">Một năm bình lặng.</p>}
      </div>
      <div className="side-quick">
        {[['bag:gear', 'Trang bị', SLOT_I.wep], ['bag:beast', 'Linh thú', UI_I.beast], ['bag:skill', 'Võ học', STAT_I.qi], ['bag:look', 'Ngoại trang', UI_I.outfit], ['forge', 'Lò rèn', NAV_I.forge, !s.started || s.dead], ['market', 'Chợ', NAV_I.market], ['sect', 'Tông môn', NAV_I.sect, !s.started || s.dead]].map(([id, n, i, off]) => (
          <button key={id} disabled={off} onClick={() => onOpen(id)}><Ico i={i} size={20} /><span>{n}</span></button>
        ))}
      </div>
      <div className="side-card ach">
        <Ico i={UI_I.ach} size={18} />
        <div className="side-ach-bar"><i style={{ width: `${(achN / ACH.length) * 100}%` }} /></div>
        <b className="num">{achN}/{ACH.length}</b>
      </div>
      <div className="side-card stats-mini">
        {G.STATS.map((st) => (
          <span key={st.k} title={st.n} style={{ '--c': `var(--${st.k})` }}><Ico i={STAT_I[st.k]} size={14} /><b className="num">{Math.round(s[st.k])}</b></span>
        ))}
      </div>
    </aside>
  );
}

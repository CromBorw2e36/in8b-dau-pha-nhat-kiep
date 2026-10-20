import { useEffect, useRef, useState } from 'react';
import G from '../game/data.js';
import { fmtGold, itemName } from '../game/util.js';
import { Ico, STAT_I, ITEM_I, UI_I } from './icons.jsx';
import { play, sfxOn, setSfx } from '../fx/sfx.js';

export function Bar({ value, max = 100, tone, thin }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={'bar' + (thin ? ' thin' : '')}>
      <i style={{ width: pct + '%', background: tone }} />
    </div>
  );
}

export const STAT_NAME = { body: 'Thể chất', soul: 'Linh hồn', tam: 'Tâm cảnh', luck: 'Khí vận', gold: 'Kim tệ', qi: 'Đấu khí', item: 'Vật phẩm', life: 'Thọ nguyên' };

// Gợi ý ảnh hưởng của một lựa chọn: icon chỉ số + mũi tên
// p: tỷ lệ thành công (nếu có tung xúc xắc) · fight: lựa chọn là một trận giao chiến
export function Hints({ h, p, fight }) {
  return (
    <span className="hints">
      {p != null && (
        <span className={'hint odds ' + (p >= 0.65 ? 'up' : p >= 0.4 ? 'mix' : 'down')} title={fight ? 'Tỷ lệ thắng' : 'Tỷ lệ thành công'}>
          <Ico i={fight ? UI_I.clash : UI_I.dice} size={15} /><b className="num">{Math.round(p * 100)}%</b>
        </span>
      )}
      {h.list.map(({ k, sign }) => (
        <span key={k} className={'hint ' + (sign === 2 ? 'mix' : sign > 0 ? 'up' : 'down')} title={`${STAT_NAME[k]} ${sign === 2 ? 'có thể tăng hoặc giảm' : sign > 0 ? 'tăng' : 'giảm'}`}>
          <Ico i={STAT_I[k]} size={15} /><span className="h-name">{STAT_NAME[k]}</span>{sign === 2 ? '±' : sign > 0 ? '▲' : '▼'}
        </span>
      ))}
      {h.risky && p == null && <span className="hint dice" title="Có tung xúc xắc"><Ico i={UI_I.dice} size={15} /><span className="h-name">May rủi</span></span>}
      {h.deadly && <span className="hint deadly" title="Thất bại có thể mất mạng"><Ico i={UI_I.deadly} size={15} /><span className="h-name">Nguy hiểm</span></span>}
    </span>
  );
}

export function Deltas({ d }) {
  const keys = Object.keys(d).filter((k) => ['body', 'soul', 'tam', 'luck', 'gold'].includes(k));
  if (!keys.length && !d.lv && !d.items) return null;
  return (
    <div className="deltas">
      {d.lv && <span className="delta up big"><Ico i={UI_I.up} />{d.lv}</span>}
      {d.items?.map(([t, g, n]) => (
        <span key={t + g} className={'delta ' + (n > 0 ? 'up' : 'down')} title={itemName(t, g)}>
          <Ico i={ITEM_I[t]} /><small>{g}</small>{n > 0 ? '+' : '−'}{Math.abs(n)}
        </span>
      ))}
      {keys.map((k) => (
        <span key={k} className={'delta ' + (d[k] > 0 ? 'up' : 'down')} title={STAT_NAME[k]}>
          <Ico i={STAT_I[k]} />{STAT_NAME[k]} {d[k] > 0 ? '+' : '−'}{k === 'gold' ? fmtGold(Math.abs(d[k])) : Math.round(Math.abs(d[k]))}
        </span>
      ))}
    </div>
  );
}

// onPeek: tạm ẩn bảng để xem thông số phía sau (bấm nền mờ cũng có tác dụng tương tự)
// mark: chữ in chìm trên nền bảng · tall: bảng cao cố định, nội dung trong <SheetBody> tự cuộn
export function Sheet({ children, onClose, onPeek, mark, tall }) {
  useEffect(() => { play('open'); }, []);
  return (
    <div className="sheet">
      <div className="sheet-backdrop" onClick={onClose || onPeek} />
      <div className={'sheet-card' + (tall ? ' tall' : '')}>
        {mark && <div className="watermark" aria-hidden="true">{mark}</div>}
        {onPeek && (
          <button className="peek-btn" onClick={onPeek} title="Tạm ẩn để xem thông số (Esc)" aria-label="Xem thông số"><Ico i={UI_I.realm} size={16} /> Xem</button>
        )}
        {onClose && <button className="close-btn" onClick={() => { play('close'); onClose(); }} aria-label="Đóng"><Ico i={UI_I.close} size={18} /></button>}
        {children}
      </div>
    </div>
  );
}

export function SheetBody({ children }) {
  return <div className="sheet-body">{children}</div>;
}

// Đầu bảng: icon lớn trong vòng vàng, tiêu đề, dòng phụ, và một con số chính bên phải
export function SheetHead({ icon, title, sub, value, valueIcon, valueLabel }) {
  return (
    <div className="sheet-head">
      <span className="head-ico"><Ico i={icon} size={26} /></span>
      <div className="head-text">
        {sub && <small>{sub}</small>}
        <h3>{title}</h3>
      </div>
      {value != null && (
        <div className="head-val" title={valueLabel}>
          <Ico i={valueIcon} size={16} /><b className="num">{value}</b>
        </div>
      )}
    </div>
  );
}

// Thanh tab: tabs = [[id, nhãn ngắn, icon, chấm báo?]]
export function Tabs({ tabs, tab, onTab }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([id, n, icon, dot]) => (
        <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => onTab(id)}>
          {icon && <Ico i={icon} size={18} />}<span>{n}</span>{dot ? <i className="dot" aria-label="có việc mới" /> : null}
        </button>
      ))}
    </div>
  );
}

// Ô vuông kiểu game: icon, phẩm chất (viền màu), nhãn ở góc trên, số lượng ở góc dưới
// countTone: lớp phụ cho số ở góc dưới (vd. sắc độ cấp cường hóa)
export function Tile({ icon, customArt, q = 0, badge, count, countTone, foot, sel, onClick, dim, title, mark }) {
  return (
    <button className={`tile q-b${q}` + (sel ? ' sel' : '') + (dim ? ' dim' : '') + (customArt ? ' has-art' : '')} onClick={onClick} title={title} aria-label={title} aria-pressed={!!sel}>
      {customArt || <Ico i={icon} size={30} />}
      {badge != null && <span className="t-badge">{badge}</span>}
      {count != null && <span className={'t-count num' + (countTone ? ' ' + countTone : '')}>{count}</span>}
      {mark && <span className={'t-mark ' + mark} />}
      {foot != null && <span className="t-foot num">{foot}</span>}
    </button>
  );
}

// Thẻ vật phẩm: hiện sẵn tên và thông tin chính, bấm vào thì mở rộng tại chỗ để xem thêm và thao tác
export function Card({ icon, customArt, q = 0, badge, count, countTone, title, sub, right, tag, tone, open, onToggle, children, fx, dim }) {
  return (
    <div className={`card q-b${q}` + (open ? ' open' : '') + (fx ? ' aura' : '') + (dim ? ' dim' : '')}>
      <button className="c-head" onClick={onToggle} aria-expanded={!!open} disabled={!onToggle}>
        <span className="c-ico">
          {customArt || <Ico i={icon} size={26} />}
          {badge != null && <span className="t-badge">{badge}</span>}
          {count != null && <span className={'t-count num' + (countTone ? ' ' + countTone : '')}>{count}</span>}
        </span>
        <span className="c-main">
          <b className={'q' + q}>{title}</b>
          {sub && <span className="c-sub">{sub}</span>}
        </span>
        {(right != null || tag) && <span className="c-right">{tag && <small className={'c-tag' + (tone ? ' ' + tone : '')}>{tag}</small>}{right}</span>}
      </button>
      {open && children && <div className="c-body">{children}</div>}
    </div>
  );
}

// Bảng chi tiết của ô đang chọn
export function Detail({ icon, q = 0, title, children, actions }) {
  return (
    <div className={`detail q-b${q}`}>
      <div className="d-top">
        <span className="d-ico"><Ico i={icon} size={34} /></span>
        <div className="d-main">
          <b className={'q' + q}>{title}</b>
          {children}
        </div>
      </div>
      {actions && <div className="d-act">{actions}</div>}
    </div>
  );
}

// Một dòng nâng cấp: icon, tên, cấp, hiệu quả ngắn; bấm vào tên để xem mô tả
export function UpRow({ icon, name, lv, max, eff, desc, children, on, locked }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={'up-row' + (on ? ' on' : '') + (locked ? ' locked' : '')}>
      <button className="up-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="up-ico"><Ico i={locked ? UI_I.lock : icon} size={24} /></span>
        <span className="up-name">{name}{lv != null && <small className="num">{lv}/{max}</small>}</span>
        {eff && <span className="up-eff num">{eff}</span>}
      </button>
      {lv != null && max ? <div className="lv-track"><i style={{ width: `${(lv / max) * 100}%` }} /></div> : null}
      {open && desc && <p className="up-desc">{desc}</p>}
      {children && <div className="up-act">{children}</div>}
    </li>
  );
}

// Nút chi tiền: khoản lớn (trên 40% số tiền đang có) phải bấm hai lần để xác nhận
function useArmed() {
  const [armed, setArmed] = useState(null);
  const tm = useRef(null);
  useEffect(() => () => clearTimeout(tm.current), []);
  const arm = (key) => { setArmed(key); clearTimeout(tm.current); tm.current = setTimeout(() => setArmed(null), 3000); };
  return [armed, arm, () => setArmed(null)];
}
export function ConfirmBtn({ cost, gold, onClick, className = 'mini buy', disabled, children }) {
  const [armed, arm, reset] = useArmed();
  const big = cost > gold * 0.4;
  return (
    <button className={className + (armed ? ' armed' : '')} disabled={disabled}
      onClick={() => { if (big && !armed) return arm(1); reset(); onClick(); }}>
      {armed ? <>Chắc chắn? {fmtGold(cost)}</> : children}
    </button>
  );
}

// Nút mua cấp: +1, +10, tối đa. plan(want) → { n, tot, next }
export function LevelBuy({ lv, max, gold, plan, onBuy }) {
  const [armed, arm, reset] = useArmed();
  if (lv >= max) return <span className="lvl-max"><Ico i={UI_I.ok} size={14} /> Tối đa</span>;
  return (
    <div className="lvl-buy">
      {[1, 10, Infinity].map((want) => {
        const p = plan(want);
        if (want !== 1 && p.n <= 1) return null;
        if (want === Infinity && p.n <= 10) return null;
        return (
          <button key={want} className={'mini buy' + (armed === want ? ' armed' : '')} disabled={!p.n}
            title={want === Infinity ? 'Mua tối đa số cấp có thể' : `Lên ${want === 1 ? 1 : p.n} cấp`}
            onClick={() => { if (p.tot > gold * 0.4 && armed !== want) return arm(want); reset(); onBuy(want); }}>
            {armed === want ? 'Chắc chắn?' : <><Ico i={UI_I.up} size={14} />{want === 1 ? '+1' : `${want === Infinity ? 'max ' : ''}+${p.n}`}</>}
            <span className="cost"><Ico i={UI_I.gold} size={12} />{fmtGold(want === 1 ? p.next : p.tot)}</span>
          </button>
        );
      })}
    </div>
  );
}

// Giải thích các chỉ số: bấm vào bảng chỉ số ở HUD để mở
const STAT_HELP = [
  { k: 'body', d: 'Sức khỏe thân thể. Cao thì chiến lực mạnh hơn, lịch luyện săn được nhiều ma hạch hơn. Dưới 30 là trọng thương, dưới 25 tu luyện chậm hẳn, dưới 10 rất dễ mất mạng. Tự hồi dần về 50.' },
  { k: 'soul', d: 'Linh hồn lực. Gốc của luyện dược (cần từ 55 nếu không có Mộc thuộc tính), giúp rèn đồ phẩm chất cao và đột phá dễ hơn. Dưỡng Hồn Đan tăng chỉ số này.' },
  { k: 'tam', d: 'Đạo tâm. Ảnh hưởng mạnh nhất tới tỷ lệ đột phá. Dưới 35 hay gặp tâm ma, dưới 30 tu luyện chậm gần một nửa. Tĩnh tâm và Thanh Tâm Đan giúp tăng.' },
  { k: 'luck', d: 'Vận may. Tăng tỷ lệ thành công khi may rủi, dễ nhặt được trang bị và trang bị phẩm chất cao.' },
  { k: 'qi', d: 'Tiến độ tu luyện. Đầy thì lên một tinh; hết tinh thì gặp bình cảnh và phải đột phá. Đấu Đế tu tới 100 trọng.' },
  { k: 'life', d: 'Thọ nguyên. Lên cảnh giới cao hoặc uống Diên Thọ Đan sẽ sống lâu hơn; Đấu Đế bất tử.' },
  { k: 'gold', d: 'Kim tệ. Mua đan dược, trang bị, sản nghiệp, xây tông môn, nuôi quân.' },
];
const MORE_HELP = [
  [UI_I.cp, 'Chiến lực', 'Sức đánh của riêng bạn: cảnh giới, thể chất, đấu kỹ, dị hỏa, trang bị.'],
  [UI_I.power, 'Thế lực', 'Chiến lực cộng thực lực tông môn và quân đội. Dùng khi chinh phạt và giữ lãnh địa.'],
  [UI_I.fame, 'Danh vọng', 'Cần để khai tông, thu hút đệ tử, ép địch quy hàng.'],
  [UI_I.dice, 'May rủi', 'Lựa chọn có tung xúc xắc, có thể thành hoặc bại.'],
  [UI_I.deadly, 'Nguy hiểm', 'Thất bại có thể mất mạng.'],
];

export function StatHelp({ onClose }) {
  return (
    <Sheet onClose={onClose} tall>
      <SheetHead icon={UI_I.help} title="Các chỉ số" sub="Bấm vào bảng chỉ số để xem lại bất cứ lúc nào" />
      <SheetBody>
        <ul className="help">
          {STAT_HELP.map((x) => (
            <li key={x.k}><span className="help-ico" style={{ color: `var(--${x.k})` }}><Ico i={STAT_I[x.k]} size={24} /></span><div><b>{STAT_NAME[x.k]}</b><p>{x.d}</p></div></li>
          ))}
          {MORE_HELP.map(([i, n, d]) => (
            <li key={n}><span className="help-ico"><Ico i={i} size={24} /></span><div><b>{n}</b><p>{d}</p></div></li>
          ))}
        </ul>
        <p className="note">Trên mỗi lựa chọn: icon chỉ số kèm ▲ là tăng, ▼ là giảm, ± là tùy may rủi. Mọi chỉ số từ 0 đến 100, mức 50 là bình thường.</p>
      </SheetBody>
    </Sheet>
  );
}

// Thông báo nổi ở đầu màn hình, tự tắt
export function Toasts({ list, onDone }) {
  useEffect(() => {
    if (!list.length) return;
    const id = setTimeout(() => onDone(list[0].id), 2600);
    return () => clearTimeout(id);
  }, [list]);
  if (!list.length) return null;
  return (
    <div className="toasts" aria-live="polite">
      {list.slice(0, 2).map((x) => (
        <div key={x.id} className={'toast t-' + (x.k || 'info')}>
          {x.icon && <span className="toast-ico"><Ico i={x.icon} size={20} /></span>}
          <span>{x.t}</span>
        </div>
      ))}
    </div>
  );
}

// Biểu đồ cảnh giới theo tuổi
export function LifeChart({ hist, height = 140 }) {
  if (!hist?.length) return null;
  const W = 320, H = height, P = 22;
  const maxA = Math.max(10, hist[hist.length - 1][0]);
  const maxL = Math.max(2, Math.ceil(Math.max(...hist.map((h) => h[1]))));
  const x = (a) => P + (a / maxA) * (W - P - 6);
  const y = (l) => H - 16 - (l / maxL) * (H - 28);
  const pts = hist.map(([a, l]) => `${x(a).toFixed(1)},${y(l).toFixed(1)}`).join(' ');
  const ticks = [];
  const stepR = maxL > 6 ? 2 : 1;
  for (let r = 0; r <= maxL; r += stepR) ticks.push(r);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ cảnh giới theo tuổi">
      {ticks.map((r) => (
        <g key={r}>
          <line x1={P} x2={W - 6} y1={y(r)} y2={y(r)} className="grid" />
          <text x={P - 4} y={y(r) + 3} className="axis" textAnchor="end">{r === 0 ? '' : G.REALMS[r]?.n.split(' ').map((w) => w[0]).join('')}</text>
        </g>
      ))}
      <polygon points={`${x(0)},${y(0)} ${pts} ${x(hist[hist.length - 1][0])},${y(0)}`} className="area" />
      <polyline points={pts} className="line" />
      <text x={P} y={H - 3} className="axis">0</text>
      <text x={W - 6} y={H - 3} className="axis" textAnchor="end">{maxA} tuổi</text>
    </svg>
  );
}

// Bật / tắt âm thanh (ghi nhớ trên máy)
export function SoundBtn({ className = '' }) {
  const [on, setOn] = useState(sfxOn);
  return (
    <button className={'icon-btn sfx-btn ' + className} onClick={() => { setSfx(!on); setOn(!on); }} aria-pressed={on} aria-label={on ? 'Tắt âm thanh' : 'Bật âm thanh'} title={on ? 'Tắt âm thanh' : 'Bật âm thanh'}>
      <Ico i={on ? UI_I.sfx : UI_I.sfxOff} size={18} />
    </button>
  );
}

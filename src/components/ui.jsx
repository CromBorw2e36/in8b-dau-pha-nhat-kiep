import { useEffect, useRef, useState } from 'react';
import G from '../game/data.js';
import { fmtGold, itemName, gearName, qualityIdx } from '../game/util.js';
import { gearDesc, gearDelta } from '../game/gear.js';
import { STAT_G, Seal, SLOT_G } from './glyphs.jsx';

export function Bar({ value, max = 100, tone, thin }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={'bar' + (thin ? ' thin' : '')}>
      <i style={{ width: pct + '%', background: tone }} />
    </div>
  );
}

const HINT_NAME = { body: 'Thể chất', soul: 'Linh hồn', tam: 'Tâm cảnh', luck: 'Khí vận', gold: 'Kim tệ', qi: 'Đấu khí', item: 'Vật phẩm', life: 'Thọ nguyên' };
export function Hints({ h }) {
  return (
    <span className="hints">
      {h.list.map(({ k, sign }) => (
        <span key={k} className={'hint ' + (sign === 2 ? 'mix' : sign > 0 ? 'up' : 'down')}>
          {HINT_NAME[k] || STAT_G[k]} {sign === 2 ? '±' : sign > 0 ? '↑' : '↓'}
        </span>
      ))}
      {h.risky && <span className="hint dice">may rủi</span>}
      {h.deadly && <span className="hint deadly">nguy hiểm tính mạng</span>}
    </span>
  );
}

const NAME = { body: 'Thể chất', soul: 'Linh hồn', tam: 'Tâm cảnh', luck: 'Khí vận', gold: 'Kim tệ' };
export function Deltas({ d }) {
  const keys = Object.keys(d).filter((k) => NAME[k]);
  if (!keys.length && !d.lv && !d.items) return null;
  return (
    <div className="deltas">
      {d.lv && <span className="delta up big">Đột phá: {d.lv}</span>}
      {d.items?.map(([t, g, n]) => (
        <span key={t + g} className={'delta ' + (n > 0 ? 'up' : 'down')}>
          {itemName(t, g)} {n > 0 ? '+' : '−'}{Math.abs(n)}
        </span>
      ))}
      {keys.map((k) => (
        <span key={k} className={'delta ' + (d[k] > 0 ? 'up' : 'down')}>
          {NAME[k]} {d[k] > 0 ? '+' : '−'}{k === 'gold' ? fmtGold(Math.abs(d[k])) : Math.round(Math.abs(d[k]))}
        </span>
      ))}
    </div>
  );
}

// onPeek: tạm ẩn bảng để xem thông số phía sau (bấm nền mờ cũng có tác dụng tương tự)
// mark: chữ Hán in chìm trên cuộn giấy
// tall: bảng cao cố định, phần đầu đứng yên, nội dung đặt trong <SheetBody> tự cuộn
export function Sheet({ children, onClose, onPeek, mark, tall }) {
  return (
    <div className="sheet">
      <div className="sheet-backdrop" onClick={onClose || onPeek} />
      <div className={'sheet-card' + (tall ? ' tall' : '')}>
        <div className="scroll-rod" aria-hidden="true" />
        {mark && <div className="watermark" aria-hidden="true">{mark}</div>}
        {onPeek && (
          <button className="peek-btn" onClick={onPeek} title="Tạm ẩn để xem thông số (Esc)">Xem thông số</button>
        )}
        {children}
      </div>
    </div>
  );
}

export function SheetBody({ children }) {
  return <div className="sheet-body">{children}</div>;
}

// Thanh tab: tabs = [[id, nhãn, chấm báo?]]
export function Tabs({ tabs, tab, onTab }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([id, n, dot]) => (
        <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => onTab(id)}>
          {n}{dot ? <i className="dot" aria-label="có việc mới" /> : null}
        </button>
      ))}
    </div>
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
      {armed ? `Chắc chắn? ${fmtGold(cost)}` : children}
    </button>
  );
}

// Nút mua cấp: +1, +10, tối đa. plan(want) → { n, tot, next }
export function LevelBuy({ lv, max, gold, plan, onBuy, label = 'Nâng' }) {
  const [armed, arm, reset] = useArmed();
  if (lv >= max) return <span className="lvl-max">Tối đa</span>;
  const opts = [[1, label], [10, '+10'], [Infinity, 'Tối đa']];
  return (
    <div className="lvl-buy">
      {opts.map(([want, txt]) => {
        const p = plan(want);
        if (want !== 1 && p.n <= 1) return null;
        if (want === Infinity && p.n <= 10) return null;
        const show = want === 1 ? `${txt} · ${fmtGold(p.next)}` : `${want === Infinity ? 'Tối đa ' : ''}+${p.n} · ${fmtGold(p.tot)}`;
        return (
          <button key={want} className={'mini buy' + (armed === want ? ' armed' : '')} disabled={!p.n}
            onClick={() => { if (p.tot > gold * 0.4 && armed !== want) return arm(want); reset(); onBuy(want); }}>
            {armed === want ? `Chắc chắn? ${fmtGold(p.tot)}` : show}
          </button>
        );
      })}
    </div>
  );
}

// Một dòng trang bị: dấu ô, tên theo màu phẩm chất, chỉ số, so sánh với đồ đang mặc
export function GearRow({ it, s, compare, children, sub }) {
  const d = compare ? gearDelta(s, it) : 0;
  return (
    <li className="gear-row">
      <Seal ch={SLOT_G[it.sl]} tone={compare ? 'outline' : 'red'} />
      <div className="it-main">
        <b className={'q' + qualityIdx(it)}>{gearName(it)}</b>
        <small>{gearDesc(it)}</small>
        {compare && Math.abs(d) >= 0.05 && <small className={'cmp ' + (d > 0 ? 'up' : 'down')}>{d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)} chiến lực so với đồ đang mặc</small>}
        {sub}
      </div>
      {children && <div className="it-act">{children}</div>}
    </li>
  );
}

// Giải thích các chỉ số: bấm vào bảng chỉ số ở HUD để mở
export const STAT_HELP = [
  { k: 'body', n: 'Thể chất', d: 'Sức khỏe thân thể. Cao thì chiến lực mạnh hơn, lịch luyện săn được nhiều ma hạch hơn. Dưới 30 là trọng thương (tự uống Liệu Thương Đan), dưới 25 tu luyện chậm hẳn, dưới 10 rất dễ mất mạng. Tự hồi dần về 50; về già sẽ suy giảm.' },
  { k: 'soul', n: 'Linh hồn', d: 'Linh hồn lực, tức sức mạnh tinh thần. Là gốc của nghề luyện dược: cần từ 55 để luyện đan (nếu không có Mộc thuộc tính), linh hồn càng mạnh càng lên phẩm nhanh, thành đan nhiều, rèn đồ phẩm chất cao. Cũng giúp đột phá dễ hơn một chút. Dưỡng Hồn Đan tăng chỉ số này.' },
  { k: 'tam', n: 'Tâm cảnh', d: 'Sự vững vàng của đạo tâm. Ảnh hưởng mạnh nhất tới tỷ lệ đột phá cảnh giới. Dưới 35 hay gặp tâm ma (có thể tẩu hỏa nhập ma), dưới 30 tu luyện chậm gần một nửa. Tự trôi dần về 50; «Tĩnh tâm» và Thanh Tâm Đan giúp tăng nhanh.' },
  { k: 'luck', n: 'Khí vận', d: 'Vận may. Tăng tỷ lệ thành công ở nhiều lựa chọn may rủi (thám hiểm, bỏ chạy, đấu giá…), dễ nhặt được trang bị và trang bị phẩm chất cao hơn, giúp đột phá thêm chút ít. Trôi dần về mức lúc mới sinh.' },
];
export const MORE_HELP = [
  ['Kim tệ', 'Tiền. Mua đan dược, trang bị, sản nghiệp, xây tông môn, nuôi quân.'],
  ['Đấu khí', 'Thanh tiến độ tu luyện. Đầy 100% thì lên một tinh; hết tinh thì gặp bình cảnh và phải đột phá. Đấu Đế tu tiếp tới 100 trọng.'],
  ['Thọ nguyên', 'Số năm còn sống. Lên cảnh giới cao hoặc uống Diên Thọ Đan sẽ sống lâu hơn; Đấu Đế thì bất tử.'],
  ['Chiến lực', 'Sức đánh của riêng bạn: cảnh giới, thể chất, đấu kỹ, dị hỏa, trang bị. Quyết định thắng thua khi giao chiến.'],
  ['Thế lực', 'Chiến lực của bạn cộng thực lực tông môn và quân đội. Dùng khi chinh phạt và giữ lãnh địa.'],
];

export function StatHelp({ onClose }) {
  return (
    <Sheet onClose={onClose} mark="Giải" tall>
      <h3>Các chỉ số nghĩa là gì?</h3>
      <SheetBody>
        <dl className="help">
          {STAT_HELP.map((x) => (
            <div key={x.k}>
              <dt><span className="help-dot" style={{ background: `var(--${x.k})` }} />{x.n} <span className="muted">({STAT_G[x.k]})</span></dt>
              <dd>{x.d}</dd>
            </div>
          ))}
          {MORE_HELP.map(([n, d]) => (<div key={n}><dt>{n}</dt><dd>{d}</dd></div>))}
        </dl>
        <p className="muted small">Ở mỗi lựa chọn, ký hiệu như «Tâm cảnh ↑» nghĩa là chỉ số đó sẽ tăng, «↓» là giảm, «±» là có thể tăng hoặc giảm tùy may rủi. Mọi chỉ số đều từ 0 đến 100, mức 50 là bình thường.</p>
      </SheetBody>
      <button className="btn" onClick={onClose}>Đã hiểu</button>
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
          {x.seal && <Seal ch={x.seal} size="sm" tone={x.k === 'ach' ? 'gold' : 'red'} />}
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

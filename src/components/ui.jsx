import G from '../game/data.js';
import { fmtGold, itemName } from '../game/util.js';
import { STAT_G } from './glyphs.jsx';

export function Bar({ value, max = 100, tone, thin }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={'bar' + (thin ? ' thin' : '')}>
      <i style={{ width: pct + '%', background: tone }} />
    </div>
  );
}

export function Hints({ h }) {
  return (
    <span className="hints">
      {h.list.map(({ k, sign }) => (
        <span key={k} className={'hint ' + (sign === 2 ? 'mix' : sign > 0 ? 'up' : 'down')}>
          <span className="hint-g">{STAT_G[k]}</span>{sign === 2 ? '±' : sign > 0 ? '↑' : '↓'}
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
export function Sheet({ children, onClose, onPeek, mark }) {
  return (
    <div className="sheet">
      <div className="sheet-backdrop" onClick={onClose || onPeek} />
      <div className="sheet-card">
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

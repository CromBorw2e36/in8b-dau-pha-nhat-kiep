import G from '../game/data.js';
import { upBlock, upP } from '../game/upper.js';

// Tinh đồ Thượng giới: các thánh vực là tinh điểm giữa hư không, nối bằng đường sáng
const POS = Object.fromEntries(G.UP_REGIONS.map((r) => [r.id, r.xy]));
// Sao nền cố định (không đổi giữa các lần vẽ)
const STARS = Array.from({ length: 70 }, (_, i) => {
  const h = (n) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return [h(1) * 400, h(2) * 300, 0.4 + h(3) * 1.1, 0.25 + h(4) * 0.6];
});

export function upState(s, r) {
  if (s.up?.land[r.id]) return 'own';
  const b = upBlock(s, r);
  if (b && b !== 'Quân đang nghỉ' && !b.startsWith('Vùng giáp ranh')) return 'lock';
  const p = upP(s, r);
  return p >= 0.6 ? 'easy' : p >= 0.3 ? 'mid' : 'hard';
}

export default function UpperMap({ s, sel, onSel }) {
  const own = (id) => !!s.up?.land[id];
  return (
    <svg className="um" viewBox="0 0 400 300" role="group" aria-label="Tinh đồ Thượng giới">
      <defs>
        <radialGradient id="um-sky" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#2b1f4a" />
          <stop offset="60%" stopColor="#140f26" />
          <stop offset="100%" stopColor="#07060f" />
        </radialGradient>
        <filter id="um-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter>
      </defs>
      <rect width="400" height="300" fill="url(#um-sky)" />
      {STARS.map(([x, y, r, o], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={o} />)}
      {G.UP_ROADS.map(([a, b]) => {
        const lit = own(a) && own(b);
        const [x1, y1] = POS[a], [x2, y2] = POS[b];
        return (
          <g key={a + b} className={'um-road' + (lit ? ' own' : '')}>
            {lit && <line x1={x1} y1={y1} x2={x2} y2={y2} className="um-halo" filter="url(#um-glow)" />}
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
          </g>
        );
      })}
      {G.UP_REGIONS.map((r) => {
        const st = upState(s, r);
        const [x, y] = r.xy;
        const boss = r.id === 'thiende';
        return (
          <g key={r.id} className={`um-node ${st}` + (sel === r.id ? ' sel' : '')} transform={`translate(${x},${y})`}
            tabIndex={0} role="button" aria-label={r.n} onClick={() => onSel(r.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSel(r.id)}>
            {sel === r.id && <circle r={boss ? 20 : 16} className="um-sel" />}
            <circle r={boss ? 14 : 10} className="um-aura" filter="url(#um-glow)" />
            <circle r={boss ? 11 : 7.5} className="um-core" />
            <text y={boss ? 26 : 21} className="um-label">{r.n}</text>
          </g>
        );
      })}
    </svg>
  );
}

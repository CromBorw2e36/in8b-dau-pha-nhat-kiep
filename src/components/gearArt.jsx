import { qualityIdx } from '../game/util.js';

// Màu phẩm chất Tiên Hiệp chuẩn nét Thiện Nữ 2
const Q_COLORS = [
  { main: '#94a3b8', glow: 'rgba(148,163,184,0.3)', edge: '#64748b', core: '#f1f5f9', name: 'Phàm' },
  { main: '#10b981', glow: 'rgba(16,185,129,0.45)', edge: '#047857', core: '#a7f3d0', name: 'Linh' },
  { main: '#38bdf8', glow: 'rgba(56,189,248,0.55)', edge: '#0284c7', core: '#bae6fd', name: 'Huyền' },
  { main: '#c084fc', glow: 'rgba(192,132,252,0.6)', edge: '#7e22ce', core: '#f3e8ff', name: 'Địa' },
  { main: '#fbbf24', glow: 'rgba(251,191,36,0.7)', edge: '#d97706', core: '#fef08a', name: 'Thiên' },
  { main: '#f43f5e', glow: 'rgba(244,63,94,0.8)', edge: '#be123c', core: '#ffe4e6', name: 'Chí Tôn' },
];

export function getQualityColor(qIdx) {
  return Q_COLORS[Math.max(0, Math.min(Q_COLORS.length - 1, qIdx || 0))];
}

// ───── 1. ĐỒ HỌA VŨ KHÍ (WEAPONS) ─────
function WeaponSvg({ name = '', qIdx = 0, size = 48 }) {
  const qc = getQualityColor(qIdx);
  const n = name.toLowerCase();

  // 1.1 Băng Phách Kiếm
  if (n.includes('băng phách') || n.includes('băng')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="38" fill="rgba(56,189,248,0.35)" filter="blur(8px)" />
        <g transform="rotate(-45 50 50)">
          {/* Lưỡi kiếm băng tinh đa diện */}
          <path d="M50 6 L56 22 L53 68 L47 68 L44 22 Z" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.2" />
          <line x1="50" y1="8" x2="50" y2="67" stroke="#ffffff" strokeWidth="1.8" />
          {/* Tinh thể băng tuyết quanh kiếm */}
          <polygon points="50,20 54,26 50,32 46,26" fill="#38bdf8" opacity="0.8" />
          <polygon points="50,40 53,44 50,48 47,44" fill="#38bdf8" opacity="0.8" />
          {/* Kiếm cách băng hoa */}
          <polygon points="34,68 50,62 66,68 50,74" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1" />
          <circle cx="50" cy="68" r="3" fill="#ffffff" />
          {/* Chuôi kiếm ngân bạch */}
          <rect x="48" y="72" width="4" height="18" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="50" cy="92" r="3.5" fill="#38bdf8" />
        </g>
      </svg>
    );
  }

  // 1.2 Huyền Trọng Xích
  if (n.includes('huyền trọng xích') || n.includes('trọng xích') || n.includes('xích')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <ellipse cx="50" cy="50" rx="38" ry="38" fill="rgba(249,115,22,0.35)" filter="blur(6px)" />
        <g transform="rotate(-45 50 50)">
          <path d="M42 12 L58 12 L61 68 L50 78 L39 68 Z" fill="#181310" stroke="#78350f" strokeWidth="2" />
          <path d="M48 20 L52 20 L52 64 L48 64 Z" fill="#f97316" opacity="0.85" />
          <path d="M45 28 L55 35 M45 42 L55 49 M45 56 L55 63" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="47" y="68" width="6" height="22" rx="2" fill="#451a03" stroke="#291003" strokeWidth="1.5" />
          <path d="M46 72 L54 75 M46 78 L54 81 M46 84 L54 87" stroke="#fbbf24" strokeWidth="1.2" />
          <circle cx="50" cy="92" r="4.5" fill="#fbbf24" stroke="#181310" strokeWidth="1.5" />
        </g>
      </svg>
    );
  }

  // 1.3 Phần Thiên Kích / Tử Kim Thương
  if (n.includes('kích') || n.includes('thương')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="38" fill={n.includes('phần thiên') ? 'rgba(239,68,68,0.35)' : qc.glow} filter="blur(8px)" />
        <g transform="rotate(-45 50 50)">
          <rect x="48.5" y="24" width="3" height="70" rx="1" fill="#3b0764" stroke="#9333ea" strokeWidth="0.8" />
          <path d="M50 4 L57 24 L52 26 L52 34 L48 34 L48 26 L43 24 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
          {n.includes('kích') && (
            <>
              <path d="M48 16 Q34 16 38 32 Q44 26 48 26 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
              <path d="M52 16 Q66 16 62 32 Q56 26 52 26 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
            </>
          )}
          <path d="M47 32 Q42 38 46 45 Q50 40 48 34 Z" fill="#e11d48" opacity="0.9" />
          <path d="M53 32 Q58 38 54 45 Q50 40 52 34 Z" fill="#ea580c" opacity="0.9" />
        </g>
      </svg>
    );
  }

  // 1.4 Hắc Long Đao
  if (n.includes('đao')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="38" fill={qc.glow} filter="blur(8px)" />
        <g transform="rotate(-45 50 50)">
          <path d="M46 10 Q58 20 62 45 Q64 58 54 68 L46 68 Q44 42 46 10 Z" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
          <path d="M44 14 L46 18 L44 22 L46 26 L44 30 L46 34 L44 38 L46 42 L44 46" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="50" cy="69" rx="9" ry="4" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
          <rect x="47.5" y="72" width="5" height="19" rx="1.5" fill="#0f172a" stroke="#334155" />
          <circle cx="50" cy="93" r="3.5" fill="#fbbf24" />
        </g>
      </svg>
    );
  }

  // 1.5 Lôi Âm Chùy
  if (n.includes('chùy') || n.includes('lôi')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="38" fill="rgba(192,132,252,0.35)" filter="blur(8px)" />
        <g transform="rotate(-45 50 50)">
          <rect x="48" y="38" width="4" height="52" fill="#334155" stroke="#0f172a" rx="1" />
          <polygon points="35,16 65,16 75,28 65,40 35,40 25,28" fill="#1e293b" stroke="#c084fc" strokeWidth="1.5" />
          <circle cx="50" cy="28" r="7" fill="#64748b" stroke="#fbbf24" strokeWidth="1.5" />
          <path d="M45 22 L52 28 L48 30 L55 36" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  // 1.6 Thanh Phong Kiếm & Kiếm mặc định
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="38" fill={qc.glow} filter="blur(8px)" />
      <g transform="rotate(-45 50 50)">
        <path d="M50 8 L54 24 L53 68 L47 68 L46 24 Z" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
        <line x1="50" y1="12" x2="50" y2="67" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M36 68 Q50 63 64 68 Q50 73 36 68 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
        <circle cx="50" cy="68" r="2.5" fill="#10b981" />
        <rect x="48" y="70" width="4" height="18" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        <circle cx="50" cy="90" r="3" fill="#fbbf24" />
        <path d="M50 93 Q54 97 52 101 Q48 103 50 106" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ───── 2. ĐỒ HỌA HỘ GIÁP (ARMOR) ─────
function ArmorSvg({ name = '', qIdx = 0, size = 48 }) {
  const qc = getQualityColor(qIdx);
  const n = name.toLowerCase();

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="38" fill={qc.glow} filter="blur(8px)" />
      <g transform="translate(0 2)">
        <path
          d="M28 26 L36 20 L50 24 L64 20 L72 26 L78 45 L68 84 L32 84 L22 45 Z"
          fill={n.includes('tử vân') ? '#2e1065' : n.includes('long lân') ? '#451a03' : n.includes('kim tàm') ? '#713f12' : n.includes('huyền quy') ? '#064e3b' : '#0f172a'}
          stroke={qc.main}
          strokeWidth="1.8"
        />
        <path d="M36 20 L50 48 L64 20" stroke="#fbbf24" strokeWidth="2.5" fill="none" />
        {/* Hộ Tâm Kính */}
        <circle cx="50" cy="50" r={n.includes('hộ tâm') ? 14 : 9} fill="#fbbf24" stroke="#fef08a" strokeWidth="1.6" />
        <circle cx="50" cy="50" r={n.includes('hộ tâm') ? 10 : 6} fill={qc.main} opacity="0.6" />
        {/* Long lân / Vảy cá */}
        <path d="M40 62 Q50 68 60 62 M38 72 Q50 78 62 72" stroke="#fbbf24" strokeWidth="1.4" fill="none" opacity="0.8" />
        {/* Giáp vai */}
        <path d="M22 28 Q14 36 24 46 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
        <path d="M78 28 Q86 36 76 46 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

// ───── 3. ĐỒ HỌA CHIẾN NGOA (BOOTS) ─────
function BootSvg({ name = '', qIdx = 0, size = 48 }) {
  const qc = getQualityColor(qIdx);
  const n = name.toLowerCase();

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="38" fill={qc.glow} filter="blur(8px)" />
      <g transform="translate(10 14)">
        {/* Hia sau */}
        <path d="M24 12 L38 12 L38 42 L52 48 L52 56 L22 56 L20 44 L24 28 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        {/* Hia trước */}
        <path
          d="M34 16 L50 16 L50 45 L68 52 Q72 56 68 62 L32 62 L28 46 L34 30 Z"
          fill={n.includes('phong hành') ? '#064e3b' : n.includes('lôi') ? '#1e1b4b' : n.includes('hư không') ? '#172554' : n.includes('lăng thiên') ? '#451a03' : '#1e293b'}
          stroke={qc.main}
          strokeWidth="1.8"
        />
        <path d="M68 56 Q76 56 74 50 Q70 48 64 53" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="34" y="16" width="16" height="5" fill="#fbbf24" rx="1" />
        {/* Cánh gió phong dực */}
        {n.includes('phong') && (
          <path d="M26 32 Q14 26 18 16 Q28 22 30 28" fill="#10b981" stroke="#fff" strokeWidth="1" opacity="0.85" />
        )}
        {/* Tia lôi điện */}
        {(n.includes('lôi') || n.includes('điện')) && (
          <path d="M42 24 L38 34 L46 36 L40 48" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        )}
      </g>
    </svg>
  );
}

// ───── 4. ĐỒ HỌA GIỚI CHỈ (RINGS) ─────
function RingSvg({ name = '', qIdx = 0, size = 48 }) {
  const qc = getQualityColor(qIdx);
  const n = name.toLowerCase();
  const gemColor = n.includes('tử ngọc') ? '#c084fc' : n.includes('cốt linh') ? '#38bdf8' : n.includes('hỏa vân') ? '#f97316' : n.includes('băng') ? '#bae6fd' : '#10b981';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="38" fill={qc.glow} filter="blur(8px)" />
      <circle cx="50" cy="56" r="24" stroke="#fbbf24" strokeWidth="6" fill="none" />
      <circle cx="50" cy="56" r="27.5" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" fill="none" />
      {/* Mặt nhẫn */}
      <g transform="translate(0 -2)">
        <polygon points="38,32 62,32 68,26 32,26" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
        <polygon points="36,25 64,25 58,12 42,12" fill={gemColor} stroke="#ffffff" strokeWidth="1.2" />
        <polygon points="42,12 58,12 50,18" fill="#ffffff" opacity="0.4" />
      </g>
      {/* Ngọn lửa lam của Cốt Linh Giới */}
      {n.includes('cốt linh') && (
        <path d="M48 10 Q50 2 52 10 Q54 6 51 0 Q46 6 48 10 Z" fill="#38bdf8" opacity="0.9" />
      )}
    </svg>
  );
}

// ───── 5. ĐỒ HỌA BẢO VẬT (ACCESSORIES) ─────
function AccessorySvg({ name = '', qIdx = 0, size = 48 }) {
  const qc = getQualityColor(qIdx);
  const n = name.toLowerCase();

  // Thần Hồn Châu / Thanh Tâm Linh Châu
  if (n.includes('hồn châu') || n.includes('linh châu') || n.includes('châu')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={qc.glow} filter="blur(10px)" />
        <circle cx="50" cy="50" r="32" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 3" fill="none" />
        <circle cx="50" cy="50" r="22" fill="#0f172a" stroke="#fff" strokeWidth="1.5" />
        <g transform="translate(50 50) scale(0.6) translate(-50 -50)">
          <path d="M50 25 A25 25 0 0 1 50 75 A12.5 12.5 0 0 1 50 50 A12.5 12.5 0 0 0 50 25 Z" fill="#ffffff" opacity="0.8" />
          <path d="M50 75 A25 25 0 0 1 50 25 A12.5 12.5 0 0 1 50 50 A12.5 12.5 0 0 0 50 75 Z" fill="#0284c7" opacity="0.8" />
        </g>
      </svg>
    );
  }

  // Tụ Linh Ngọc Bội / Huyết Ngọc Trâm / Cửu Thiên Hộ Phù
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="38" fill={qc.glow} filter="blur(8px)" />
      <path d="M50 6 L50 22" stroke="#e11d48" strokeWidth="2.5" />
      <circle cx="50" cy="20" r="3" fill="#fbbf24" />
      <circle cx="50" cy="46" r="22" fill="#064e3b" stroke="#34d399" strokeWidth="1.6" />
      <circle cx="50" cy="46" r="10" fill="#0f172a" stroke="#fbbf24" strokeWidth="1.5" />
      <circle cx="50" cy="46" r="16" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 2" fill="none" opacity="0.6" />
      <path d="M47 68 L44 94 M50 68 L50 96 M53 68 L56 94" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ───── Empty Slot Fallback Icon ─────
export function SlotFallbackArt({ sl, size = 48, dim = false }) {
  const glyphs = {
    wep: '劍',
    arm: '甲',
    boo: '靴',
    rng: '戒',
    acc: '佩',
    pet: '獸',
    mount: '騎',
    skill: '訣',
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ opacity: dim ? 0.45 : 0.85 }}>
      <polygon points="50,6 88,20 94,58 68,92 32,92 6,58 12,20" stroke="rgba(56,189,248,0.3)" strokeWidth="1.2" fill="rgba(15,23,42,0.6)" />
      <circle cx="50" cy="50" r="32" stroke="rgba(251,191,36,0.25)" strokeWidth="1" strokeDasharray="4 3" />
      <text x="50" y="58" textAnchor="middle" fill="#fbbf24" fontSize="26" fontFamily="'Bona Nova SC', serif" opacity="0.65" fontWeight="bold">
        {glyphs[sl] || '器'}
      </text>
    </svg>
  );
}

// ───── Component Hiển Thị Đồ Họa Trang Bị Chính ─────
export default function GearArt({ it, size = 48, className = '', glow = true }) {
  if (!it) return <SlotFallbackArt sl="wep" size={size} dim />;

  const qIdx = qualityIdx(it);
  const qc = getQualityColor(qIdx);

  let ArtComponent = WeaponSvg;
  if (it.sl === 'arm') ArtComponent = ArmorSvg;
  else if (it.sl === 'boo') ArtComponent = BootSvg;
  else if (it.sl === 'rng') ArtComponent = RingSvg;
  else if (it.sl === 'acc') ArtComponent = AccessorySvg;

  return (
    <div
      className={`gear-art-wrapper ${className}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-grid',
        placeItems: 'center',
        filter: glow && qIdx >= 2 ? `drop-shadow(0 0 8px ${qc.glow})` : undefined,
      }}
    >
      {/* Cấp cường hóa do khung bọc ngoài (Tile, Card, đe rèn) hiện, ở đây không vẽ lại */}
      <ArtComponent name={it.n || ''} qIdx={qIdx} size={size} />
    </div>
  );
}

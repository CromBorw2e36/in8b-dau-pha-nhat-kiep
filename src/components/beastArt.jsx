// Đồ họa Thú Cưỡi (Tọa Kỵ) & Linh Thú (Thú Cưng) phong cách Tiên Hiệp chuẩn nét Thiện Nữ 2
import { BEAST_I } from './icons.jsx';

// Màu hệ & khí tức của từng linh thú
export const BEAST_THEMES = {
  // Tọa kỵ
  lang: { n: 'Truy Phong Lang', elem: 'Phong', c: '#48c78e', glow: 'rgba(72,199,142,0.5)', bg: '#0b1d16', tier: 'Hoàng' },
  cau: { n: 'Liệt Hỏa Câu', elem: 'Hỏa', c: '#f56565', glow: 'rgba(245,101,101,0.5)', bg: '#220b0a', tier: 'Huyền' },
  su: { n: 'Tử Tinh Dực Sư', elem: 'Lôi', c: '#b794f4', glow: 'rgba(183,148,244,0.5)', bg: '#180e26', tier: 'Địa' },
  bang: { n: 'Kim Sí Đại Bằng', elem: 'Kim', c: '#ecc94b', glow: 'rgba(236,201,75,0.55)', bg: '#241b08', tier: 'Thiên' },
  giao: { n: 'Thanh Lân Giao Long', elem: 'Long', c: '#38bdf8', glow: 'rgba(56,189,248,0.6)', bg: '#081a28', tier: 'Thần Thú' },
  // Thú cưng
  ho: { n: 'Tiểu Hỏa Hồ', elem: 'Hỏa', c: '#fb923c', glow: 'rgba(251,146,60,0.5)', bg: '#220f06', tier: 'Hoàng' },
  tho: { n: 'Nguyệt Linh Thố', elem: 'Quang', c: '#e2e8f0', glow: 'rgba(226,232,240,0.5)', bg: '#0f172a', tier: 'Huyền' },
  ung: { n: 'Tử Tinh Ưng', elem: 'Phong', c: '#a855f7', glow: 'rgba(168,85,247,0.5)', bg: '#190a2c', tier: 'Huyền' },
  quy: { n: 'Huyền Vũ Quy', elem: 'Thủy', c: '#2dd4bf', glow: 'rgba(45,212,191,0.5)', bg: '#061c1b', tier: 'Địa' },
  mang: { n: 'Thôn Thiên Mãng', elem: 'Ám', c: '#c084fc', glow: 'rgba(192,132,252,0.6)', bg: '#190b2e', tier: 'Địa' },
  lan: { n: 'Bạch Ngọc Kỳ Lân', elem: 'Thánh', c: '#fde047', glow: 'rgba(253,224,71,0.65)', bg: '#262007', tier: 'Thần Thú' },
};

// ───── Đồ Họa Vector Từng Linh Thú Tiên Hiệp Đỉnh Cao ─────
export function BeastVectorSvg({ id, size = 56, active = false }) {
  const theme = BEAST_THEMES[id] || { c: '#fbbf24', glow: 'rgba(251,191,36,0.4)' };

  // 1. Tọa kỵ: Truy Phong Lang (Phong)
  if (id === 'lang') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.6" />
        {/* Phong nhẫn xoay quanh */}
        <path d="M18 56 Q24 72 40 68 M82 56 Q76 72 60 68" stroke="#34d399" strokeWidth="1.8" strokeDasharray="4 3" strokeLinecap="round" />
        <path d="M50 14 L64 28 L74 18 L68 44 L78 52 L64 64 L58 84 L50 90 L42 84 L36 64 L22 52 L32 44 L26 18 L36 28 Z" fill="#0f2b23" stroke="#34d399" strokeWidth="2" />
        <polygon points="32,24 37,34 30,35" fill="#34d399" opacity="0.65" />
        <polygon points="68,24 70,35 63,34" fill="#34d399" opacity="0.65" />
        {/* Trán ấn phong nguyệt */}
        <path d="M50 32 Q54 40 50 48 Q46 40 50 32 Z" fill="#6ee7b7" />
        <circle cx="50" cy="40" r="2.5" fill="#ffffff" />
        {/* Mắt sói ngọc bích phát quang */}
        <polygon points="41,47 46,50 41,53 37,49" fill="#a7f3d0" />
        <polygon points="59,47 63,49 59,53 54,50" fill="#a7f3d0" />
        {/* Mũi và nanh nhọn */}
        <polygon points="48,62 52,62 50,66" fill="#042f2e" />
        <path d="M46 68 L50 72 L54 68" stroke="#34d399" strokeWidth="1.5" />
        <polygon points="45,68 46,74 47,68" fill="#ffffff" />
        <polygon points="53,68 54,74 55,68" fill="#ffffff" />
      </svg>
    );
  }

  // 2. Tọa kỵ: Liệt Hỏa Câu (Hỏa)
  if (id === 'cau') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.7" />
        {/* Bờm lửa thần mã */}
        <path d="M50 8 Q60 0 66 10 Q72 4 75 18 Q82 16 80 32 Q86 32 80 48 Q85 52 76 64 L66 60 L60 38 L50 20 Z" fill="#ea580c" opacity="0.9" />
        <path d="M52 14 Q60 6 64 16 Q70 12 72 24 Q78 26 74 38 Q79 40 73 52 L66 48 L60 32 Z" fill="#facc15" opacity="0.85" />
        {/* Đầu tuấn mã */}
        <path d="M32 38 L48 18 L58 22 L56 38 L68 56 L62 76 L48 78 L38 60 L36 48 Z" fill="#380a0a" stroke="#ef4444" strokeWidth="2" />
        {/* Hoàng kim giáp mã */}
        <path d="M42 34 L54 36 L50 52 L38 50 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1.2" />
        <circle cx="46" cy="43" r="3.5" fill="#dc2626" />
        {/* Mắt rực lửa */}
        <polygon points="43,36 49,38 45,43 41,41" fill="#fef08a" />
        {/* Hơi thở liệt hỏa */}
        <circle cx="60" cy="71" r="2.5" fill="#f97316" />
        <path d="M63 73 Q74 76 80 72 Q75 80 67 76 Z" fill="#fb923c" />
      </svg>
    );
  }

  // 3. Tọa kỵ: Tử Tinh Dực Sư (Lôi)
  if (id === 'su') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.7" />
        {/* Cặp cánh lôi tinh phía sau */}
        <path d="M22 42 Q8 24 24 10 Q30 28 36 38 M78 42 Q92 24 76 10 Q70 28 64 38" fill="#3b0764" stroke="#c084fc" strokeWidth="1.6" />
        {/* Bờm sư tử kết tinh tử tinh thạch */}
        <path d="M30 30 L40 16 L50 22 L60 16 L70 30 L78 44 L74 66 L64 80 L50 88 L36 80 L26 66 L22 44 Z" fill="#1e0b36" stroke="#a855f7" strokeWidth="2" />
        {/* Lôi sừng hoàng kim trên trán */}
        <polygon points="50,6 54,24 46,24" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.2" />
        {/* Khuôn mặt lôi sư */}
        <path d="M38 40 L62 40 L58 72 L50 80 L42 72 Z" fill="#2e1065" stroke="#c084fc" strokeWidth="1.4" />
        <polygon points="41,46 47,48 43,52" fill="#f5d0fe" />
        <polygon points="59,46 57,52 53,48" fill="#f5d0fe" />
        <path d="M46 64 L50 68 L54 64" stroke="#c084fc" strokeWidth="1.5" />
        <polygon points="45,64 46,70 47,64" fill="#ffffff" />
        <polygon points="53,64 54,70 55,64" fill="#ffffff" />
      </svg>
    );
  }

  // 4. Tọa kỵ: Kim Sí Đại Bằng (Kim)
  if (id === 'bang') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.75" />
        <circle cx="50" cy="50" r="38" stroke="#fbbf24" strokeWidth="1" strokeDasharray="5 3" opacity="0.6" />
        {/* Đôi cánh hoàng kim tung hoành vạn dặm */}
        <path d="M50 44 L16 20 Q8 40 14 66 L36 56 L50 64 L64 56 L86 66 Q92 40 84 20 Z" fill="#5c2c06" stroke="#fde047" strokeWidth="2" />
        <path d="M22 26 L36 48 M78 26 L64 48" stroke="#fde047" strokeWidth="1.5" />
        {/* Đầu đại bằng & mỏ sắc như đao kiếm */}
        <path d="M43 24 L57 24 L59 46 L50 54 L41 46 Z" fill="#854d0e" stroke="#fde047" strokeWidth="1.5" />
        <polygon points="46,44 54,44 50,64" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
        <circle cx="45" cy="34" r="2.8" fill="#fef08a" />
        <circle cx="55" cy="34" r="2.8" fill="#fef08a" />
        <polygon points="50,12 54,24 46,24" fill="#fde047" />
      </svg>
    );
  }

  // 5. Tọa kỵ: Thanh Lân Giao Long (Long) - SVG fallback nếu chưa tải ảnh
  if (id === 'giao') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill="rgba(56,189,248,0.4)" filter="blur(8px)" />
        {/* Cặp rồng sừng băng tinh */}
        <path d="M40 26 Q32 10 24 8 Q34 18 36 26 M60 26 Q68 10 76 8 Q66 18 64 26" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        {/* Thân giao long uốn lượn */}
        <path d="M20 74 Q34 88 56 82 Q78 76 80 56 Q82 36 66 26" fill="none" stroke="#0284c7" strokeWidth="9" strokeLinecap="round" />
        <path d="M20 74 Q34 88 56 82 Q78 76 80 56 Q82 36 66 26" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
        {/* Đầu long tộc uy phong */}
        <path d="M38 28 L62 28 L66 48 L50 60 L34 48 Z" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
        {/* Long nhãn hoàng kim */}
        <polygon points="41,38 47,40 43,44" fill="#fbbf24" />
        <polygon points="59,38 57,44 53,40" fill="#fbbf24" />
        {/* Râu rồng phiêu dật */}
        <path d="M36 50 Q22 56 16 68 M64 50 Q78 56 84 68" stroke="#7dd3fc" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Long châu ngậm trong miệng */}
        <circle cx="50" cy="54" r="5" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.2" />
      </svg>
    );
  }

  // 6. Thú cưng: Tiểu Hỏa Hồ (Hỏa)
  if (id === 'ho') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.65" />
        {/* Đuôi hồ ly lửa */}
        <path d="M22 66 Q12 46 22 32 Q32 46 32 58 M78 66 Q88 46 78 32 Q68 46 68 58" fill="#ea580c" opacity="0.8" />
        {/* Đôi tai hồ ly nhọn */}
        <polygon points="34,22 46,38 28,42" fill="#c2410c" stroke="#fb923c" strokeWidth="1.5" />
        <polygon points="66,22 72,42 54,38" fill="#c2410c" stroke="#fb923c" strokeWidth="1.5" />
        <polygon points="35,26 43,36 31,38" fill="#ffedd5" />
        <polygon points="65,26 69,38 57,36" fill="#ffedd5" />
        {/* Mặt hồ ly tinh xảo */}
        <path d="M28 42 Q50 36 72 42 L68 64 L50 80 L32 64 Z" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />
        <polygon points="40,58 50,76 60,58" fill="#ffffff" />
        <circle cx="50" cy="72" r="2.5" fill="#431407" />
        <polygon points="38,48 44,50 40,54" fill="#fef08a" />
        <polygon points="62,48 60,54 56,50" fill="#fef08a" />
        {/* Hỏa cầu lơ lửng */}
        <circle cx="50" cy="22" r="7" fill="#f97316" filter="blur(2px)" />
        <circle cx="50" cy="22" r="4" fill="#fef08a" />
      </svg>
    );
  }

  // 7. Thú cưng: Nguyệt Linh Thố (Quang)
  if (id === 'tho') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.6" />
        {/* Vành trăng khuyết hộ thể */}
        <path d="M62 12 A36 36 0 1 0 76 72 A30 30 0 1 1 62 12 Z" fill="#e0f2fe" opacity="0.4" />
        {/* Thân ngọc thỏ */}
        <ellipse cx="50" cy="64" rx="17" ry="15" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
        <circle cx="50" cy="46" r="13" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
        {/* Đôi tai thỏ ngọc dài mềm mại */}
        <ellipse cx="43" cy="24" rx="4.5" ry="14" transform="rotate(-10 43 24)" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
        <ellipse cx="43" cy="24" rx="2" ry="9" transform="rotate(-10 43 24)" fill="#fbcfe8" />
        <ellipse cx="57" cy="24" rx="4.5" ry="14" transform="rotate(10 57 24)" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.2" />
        <ellipse cx="57" cy="24" rx="2" ry="9" transform="rotate(10 57 24)" fill="#fbcfe8" />
        {/* Mắt hồng ngọc lấp lánh */}
        <circle cx="44" cy="44" r="2.5" fill="#f43f5e" />
        <circle cx="56" cy="44" r="2.5" fill="#f43f5e" />
        <polygon points="49,50 51,50 50,52" fill="#f43f5e" />
      </svg>
    );
  }

  // 8. Thú cưng: Tử Tinh Ưng (Phong)
  if (id === 'ung') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.7" />
        {/* Đôi cánh ưng tím sải rộng */}
        <path d="M50 48 L20 26 Q12 42 22 66 L38 54 L50 60 L62 54 L78 66 Q88 42 80 26 Z" fill="#3b0764" stroke="#c084fc" strokeWidth="1.8" />
        <path d="M43 30 L57 30 L59 48 L50 54 L41 48 Z" fill="#581c87" stroke="#e9d5ff" strokeWidth="1.4" />
        <polygon points="46,46 54,46 50,62" fill="#a855f7" stroke="#7e22ce" strokeWidth="1.2" />
        <circle cx="45" cy="36" r="2.5" fill="#fef08a" />
        <circle cx="55" cy="36" r="2.5" fill="#fef08a" />
      </svg>
    );
  }

  // 9. Thú cưng: Huyền Vũ Quy (Thủy)
  if (id === 'quy') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.7" />
        {/* Mai rùa bát quái */}
        <ellipse cx="48" cy="58" rx="24" ry="20" fill="#042f2e" stroke="#2dd4bf" strokeWidth="2" />
        <polygon points="48,44 58,50 58,62 48,68 38,62 38,50" fill="#134e4a" stroke="#2dd4bf" strokeWidth="1.2" />
        <line x1="48" y1="44" x2="48" y2="38" stroke="#2dd4bf" strokeWidth="1.2" />
        <line x1="58" y1="50" x2="68" y2="46" stroke="#2dd4bf" strokeWidth="1.2" />
        <line x1="58" y1="62" x2="68" y2="66" stroke="#2dd4bf" strokeWidth="1.2" />
        <line x1="38" y1="50" x2="28" y2="46" stroke="#2dd4bf" strokeWidth="1.2" />
        <line x1="38" y1="62" x2="28" y2="66" stroke="#2dd4bf" strokeWidth="1.2" />
        {/* Đầu rùa */}
        <ellipse cx="48" cy="34" rx="6.5" ry="7.5" fill="#115e59" stroke="#2dd4bf" strokeWidth="1.2" />
        <circle cx="46" cy="33" r="1.5" fill="#fef08a" />
        <circle cx="50" cy="33" r="1.5" fill="#fef08a" />
        {/* Linh xà quấn quanh mai rùa */}
        <path d="M26 62 Q30 76 56 74 Q74 72 74 54 Q74 34 62 26 Q56 22 60 16" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="61" cy="15" rx="4.5" ry="3.5" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1" />
        <circle cx="62" cy="14" r="1.2" fill="#f43f5e" />
      </svg>
    );
  }

  // 10. Thú cưng: Thôn Thiên Mãng (Ám)
  if (id === 'mang') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.75" />
        {/* Thân mãng xà cuộn tròn */}
        <ellipse cx="50" cy="64" rx="26" ry="18" fill="#1b0c2e" stroke="#7e22ce" strokeWidth="1.8" />
        <path d="M30 46 Q50 36 70 46 L66 62 Q50 68 34 62 Z" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
        {/* Đầu thôn thiên mãng hình tam giác sát thủ */}
        <polygon points="50,20 66,36 50,58 34,36" fill="#240e3d" stroke="#c084fc" strokeWidth="1.8" />
        <polygon points="42,36 46,38 42,41 39,38" fill="#f0abfc" />
        <polygon points="58,36 61,38 58,41 54,38" fill="#f0abfc" />
        <line x1="50" y1="58" x2="50" y2="70" stroke="#f43f5e" strokeWidth="1.8" />
        <path d="M48 70 L45 75 M52 70 L55 75" stroke="#f43f5e" strokeWidth="1.4" />
      </svg>
    );
  }

  // 11. Thú cưng: Bạch Ngọc Kỳ Lân (Thánh)
  if (id === 'lan') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="40" fill={theme.glow} filter="blur(8px)" opacity="0.8" />
        {/* Tường vân tường thụy dưới chân */}
        <path d="M28 80 Q38 72 50 80 Q62 72 72 80" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        {/* Đầu kỳ lân bạch ngọc */}
        <path d="M36 40 L48 24 L52 24 L64 40 L60 68 L50 76 L40 68 Z" fill="#3a2505" stroke="#fbbf24" strokeWidth="2" />
        {/* Thần giác hoàng kim phóng thiên */}
        <path d="M50 24 L50 8 M47 16 L43 12 M53 16 L57 12" stroke="#fef08a" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="50" cy="7" r="3.5" fill="#ffffff" />
        {/* Trán ấn tường thụy */}
        <polygon points="50,34 55,42 50,50 45,42" fill="#fbbf24" />
        <circle cx="50" cy="42" r="2.2" fill="#ffffff" />
        <ellipse cx="43" cy="46" rx="2.8" ry="3.5" fill="#fde047" />
        <ellipse cx="57" cy="46" rx="2.8" ry="3.5" fill="#fde047" />
        <path d="M44 62 L50 66 L56 62" stroke="#fde047" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }

  // Mặc định: BEAST_I
  const IconComponent = BEAST_I[id];
  return IconComponent ? <IconComponent size={Math.round(size * 0.58)} /> : null;
}

export default function BeastArt({ id, kind = 'mount', size = 56, lv = 1, active = false, className = '' }) {
  const theme = BEAST_THEMES[id] || { c: '#d9ad5b', glow: 'rgba(217,173,91,0.3)', bg: '#0b1120', tier: 'Linh', elem: 'Linh' };

  return (
    <div
      className={`beast-art-container ${className} ${active ? 'active-mount' : ''}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-grid',
        placeItems: 'center',
        borderRadius: '50%',
        background: `radial-gradient(circle at 40% 35%, ${theme.c}28, ${theme.bg} 75%)`,
        boxShadow: active ? `0 0 18px ${theme.glow}, inset 0 0 10px ${theme.c}` : `0 4px 12px rgba(0,0,0,0.65)`,
        border: `1.5px solid ${active ? theme.c : 'rgba(56, 189, 248, 0.3)'}`,
        flexShrink: 0,
      }}
    >
      {/* Vòng hào quang tiên khí xoay */}
      {active && (
        <svg
          viewBox="0 0 100 100"
          style={{
            position: 'absolute',
            inset: -4,
            width: 'calc(100% + 8px)',
            height: 'calc(100% + 8px)',
            pointerEvents: 'none',
            animation: 'beastSpin 12s linear infinite',
          }}
        >
          <circle cx="50" cy="50" r="48" stroke={theme.c} strokeWidth="1.4" strokeDasharray="6 4 2 4" fill="none" opacity="0.85" />
        </svg>
      )}

      {/* Hiển thị tranh CGI hoặc đồ họa vector cao cấp */}
      {id === 'giao' ? (
        <span
          style={{
            width: Math.round(size * 0.84),
            height: Math.round(size * 0.84),
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
            boxShadow: `0 0 12px ${theme.glow}`,
          }}
        >
          <img
            src="./art/mounts/giao_dragon.png"
            alt={theme.n}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </span>
      ) : (
        <BeastVectorSvg id={id} size={Math.round(size * 0.86)} active={active} />
      )}

      {/* Huy hiệu Cấp độ linh thú */}
      {lv != null && (
        <span
          className="num"
          style={{
            position: 'absolute',
            bottom: -3,
            right: -3,
            background: 'linear-gradient(135deg, #111a33, #070a14)',
            color: theme.c,
            border: `1px solid ${theme.c}`,
            fontSize: Math.max(9, Math.round(size * 0.2)),
            fontWeight: 800,
            padding: '0px 4px',
            borderRadius: 6,
            lineHeight: 1.2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {lv}
        </span>
      )}

      {/* Huy hiệu Nguyên tố ở góc trên trái */}
      <span
        style={{
          position: 'absolute',
          top: -2,
          left: -2,
          background: theme.c,
          color: '#060b14',
          fontSize: Math.max(8, Math.round(size * 0.16)),
          fontWeight: 900,
          padding: '0px 3px',
          borderRadius: 4,
          lineHeight: 1.2,
          letterSpacing: '0.05em',
        }}
      >
        {theme.elem}
      </span>
    </div>
  );
}

// Thẻ Card Linh Thú chi tiết
export function BeastBannerCard({ kind = 'mount', beast, def, s, active, onRide, onFeed, canFeed, bestCoreVal, coreName, coreXpVal }) {
  const theme = BEAST_THEMES[beast.id] || { c: '#d9ad5b', glow: 'rgba(217,173,91,0.3)', bg: '#0b1120', tier: 'Linh', elem: 'Linh' };
  const BigIcon = BEAST_I[beast.id];

  return (
    <div
      className={`beast-card-xianxia ${active ? 'active-border' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 16px',
        borderRadius: 14,
        background: `linear-gradient(135deg, rgba(14,21,43,0.95), rgba(7,11,24,0.98))`,
        border: `1.5px solid ${active ? theme.c : 'rgba(56, 189, 248, 0.25)'}`,
        boxShadow: active ? `0 0 18px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.1)` : '0 4px 14px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* Nền hoa văn mây chìm */}
      <div
        style={{
          position: 'absolute',
          right: -10,
          bottom: -10,
          opacity: 0.08,
          pointerEvents: 'none',
          color: theme.c,
        }}
      >
        {BigIcon && <BigIcon size={110} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <BeastArt id={beast.id} kind={kind} size={64} lv={beast.lv} active={active} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 17, color: '#f8fafc', fontFamily: 'var(--title)' }}>{def.n}</b>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 4,
                background: `${theme.c}22`,
                color: theme.c,
                border: `1px solid ${theme.c}55`,
                fontWeight: 700,
              }}
            >
              {theme.tier} Giai · Hệ {theme.elem}
            </span>
            {active && (
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 7px',
                  borderRadius: 12,
                  background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                  color: '#060b14',
                  fontWeight: 800,
                }}
              >
                {kind === 'pet' ? 'Đang theo' : 'Đang cưỡi'}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>{def.d}</p>
        </div>
      </div>
    </div>
  );
}

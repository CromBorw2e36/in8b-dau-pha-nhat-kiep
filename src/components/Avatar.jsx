import { useId } from 'react';
import { activeBeast, qualityIdx } from '../game/util.js';
import { outfitOf } from '../game/wardrobe.js';
import { BEAST_THEMES, BeastVectorSvg } from './beastArt.jsx';

// Màu hào quang và đạo văn theo cảnh giới Tiên Hiệp
const AURA = (R = 0) => {
  if (R >= 11) return ['#fff6e0', '#ffd700', '#ff4500', '#ffffff']; // Đấu Đế - Kim Quang Viêm Đế
  if (R >= 10) return ['#ffe8d6', '#f5a623', '#d63031', '#ffd700']; // Đấu Thánh - Thánh Hỏa
  if (R >= 8) return ['#ede9fe', '#a855f7', '#6366f1', '#c084fc'];  // Đấu Tôn - Tử Vi Tinh Thần
  if (R >= 7) return ['#e0f2fe', '#38bdf8', '#0284c7', '#7dd3fc'];  // Đấu Tông - Hư Không Hàn Băng
  if (R >= 4) return ['#dcfce7', '#48c78e', '#15803d', '#86efac'];  // Đấu Linh/Vương - Thanh Mộc Linh Khí
  return ['#f5efe6', '#d9ad5b', '#7c6b54', '#e2dacf'];              // Đấu Sư/Đấu Giả - Huyền Hoàng
};

const Q_COLOR = ['#b0a48f', '#50c878', '#4da6ff', '#b366ff', '#ffd700', '#ff3355'];

export default function Avatar({ s, look, size = 220, beasts = true, still = false, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const o = look || outfitOf(s);
  const [robe, trim, sash, inner] = o?.c || ['#1d1714', '#c9432f', '#c9432f', '#e9dcc4'];
  const x = new Set(o?.x || []);
  const f = s?.g === 'f';
  const R = s?.R || 0;
  const [a1, a2, a3, a4] = AURA(R);
  const wep = s?.gear?.wep;
  const pet = beasts && s ? activeBeast(s, 'pet') : null;
  const mount = beasts && s ? activeBeast(s, 'mount') : null;
  const mountTheme = mount && BEAST_THEMES[mount.id];
  const petTheme = pet && BEAST_THEMES[pet.id];

  const wepName = (wep?.n || '').toLowerCase();
  const hair = '#120d09';
  const skin = '#f7e7d0';

  return (
    <svg
      className={'avatar' + (still ? ' still' : '') + (className ? ' ' + className : '')}
      viewBox="0 0 280 340"
      width={size}
      height={size * 1.22}
      role="img"
      aria-label={`${s?.name || 'Nhân vật'} mặc ${o.n.toLowerCase()}`}
    >
      <defs>
        {/* Hào quang Tiên Thiên */}
        <radialGradient id={`au${uid}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={a1} stopOpacity="0.75" />
          <stop offset="45%" stopColor={a2} stopOpacity="0.4" />
          <stop offset="75%" stopColor={a3} stopOpacity="0.15" />
          <stop offset="100%" stopColor={a3} stopOpacity="0" />
        </radialGradient>
        {/* Gradient áo tiên bào */}
        <linearGradient id={`rb${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={robe} />
          <stop offset="60%" stopColor={robe} />
          <stop offset="100%" stopColor="#0c0704" stopOpacity="0.85" />
        </linearGradient>
        {/* Bóng mờ thân áo */}
        <linearGradient id={`sh${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        {/* Ánh kim viền */}
        <linearGradient id={`goldTrim${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff2a3" />
          <stop offset="50%" stopColor={trim || '#d9ad5b'} />
          <stop offset="100%" stopColor="#8a672a" />
        </linearGradient>
        {/* Lửa Dị Hỏa ở chân áo */}
        <linearGradient id={`fl${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ───── 1. ĐẠO VĂN BÁT QUÁI & QUANG LUÂN PHÍA SAU ───── */}
      <g transform="translate(140 145)">
        {/* Vòng hào quang chính */}
        <circle r="125" fill={`url(#au${uid})`} />
        {/* Vòng bát quái tiên thiên xoay */}
        <circle r="105" stroke={a2} strokeWidth="1.2" strokeDasharray="8 6 3 6" fill="none" opacity="0.65" />
        <circle r="92" stroke={a3} strokeWidth="0.8" strokeDasharray="4 4" fill="none" opacity="0.4" />
        {/* Các tia linh khí hộ thể */}
        {R >= 4 && (
          <g opacity="0.6">
            <line x1="-115" y1="0" x2="-95" y2="0" stroke={a4} strokeWidth="1.5" />
            <line x1="95" y1="0" x2="115" y2="0" stroke={a4} strokeWidth="1.5" />
            <line x1="0" y1="-115" x2="0" y2="-95" stroke={a4} strokeWidth="1.5" />
            <line x1="0" y1="95" x2="0" y2="115" stroke={a4} strokeWidth="1.5" />
          </g>
        )}
      </g>

      {/* ───── 2. TỌA KỴ (MOUNT) LINH ẢNH PHÍA DƯỚI ───── */}
      {mountTheme && (
        <g transform="translate(140 280)">
          {/* Bệ mây tường vân tọa kỵ */}
          <ellipse cx="0" cy="8" rx="100" ry="24" fill={mountTheme.glow} filter="blur(8px)" />
          <ellipse cx="0" cy="8" rx="85" ry="18" fill="rgba(18,12,8,0.85)" stroke={mountTheme.c} strokeWidth="1.6" />
          {/* Vòng phù văn tọa kỵ */}
          <ellipse cx="0" cy="8" rx="72" ry="14" stroke={mountTheme.c} strokeWidth="1" strokeDasharray="5 3" fill="none" opacity="0.7" />
          {/* Thần thú linh ảnh uy dũng bên cạnh / phía sau */}
          <g transform="translate(-80 -70)" style={{ filter: `drop-shadow(0 0 10px ${mountTheme.glow})` }}>
            {mount.id === 'giao' ? (
              <g>
                <circle cx="28" cy="28" r="32" fill={mountTheme.bg} stroke={mountTheme.c} strokeWidth="1.8" />
                <clipPath id={`mountClip${uid}`}>
                  <circle cx="28" cy="28" r="30" />
                </clipPath>
                <image
                  href="./art/mounts/giao_dragon.png"
                  x="-2"
                  y="-2"
                  width="60"
                  height="60"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#mountClip${uid})`}
                />
              </g>
            ) : (
              <g>
                <circle cx="28" cy="28" r="32" fill={mountTheme.bg} stroke={mountTheme.c} strokeWidth="1.5" />
                <BeastVectorSvg id={mount.id} size={56} />
              </g>
            )}
          </g>
          {/* Huy hiệu tên Tọa Kỵ */}
          <rect x="-42" y="16" width="84" height="18" rx="9" fill="#120c08" stroke={mountTheme.c} strokeWidth="1" />
          <text x="0" y="29" textAnchor="middle" fill={mountTheme.c} fontSize="11" fontWeight="700" fontFamily="var(--ui)">
            {mountTheme.n}
          </text>
        </g>
      )}

      {/* ───── 3. VŨ KHÍ SAU LƯNG (DYNAMIC WEAPON) ───── */}
      {wep && (
        <g transform="translate(140 145) rotate(-35) translate(-140 -145)">
          {/* A. Huyền Trọng Xích */}
          {wepName.includes('xích') ? (
            <g>
              <rect x="131" y="-5" width="18" height="175" rx="3" fill="#1e1814" stroke="#4a3728" strokeWidth="2" />
              <rect x="135" y="10" width="10" height="135" fill="#e0602a" opacity="0.8" />
              <line x1="133" y1="35" x2="147" y2="45" stroke="#ffa500" strokeWidth="2" />
              <line x1="133" y1="70" x2="147" y2="80" stroke="#ffa500" strokeWidth="2" />
              <line x1="133" y1="105" x2="147" y2="115" stroke="#ffa500" strokeWidth="2" />
              <rect x="137" y="170" width="6" height="32" rx="2" fill="#5c4028" stroke="#120c08" />
              <circle cx="140" cy="205" r="5" fill="#d4af37" />
            </g>
          ) : wepName.includes('thương') || wepName.includes('kích') ? (
            /* B. Tử Kim Thương / Kích */
            <g>
              <rect x="138" y="-30" width="4" height="230" fill="#4a154b" stroke="#7e22ce" />
              <polygon points="140,-50 148,-25 140,-20 132,-25" fill="#ffd700" stroke="#d4af37" />
              <path d="M136,-15 Q125,-5 132,15 Q140,5 137,-10" fill="#e53e3e" />
            </g>
          ) : (
            /* C. Phi Kiếm / Đao */
            <g>
              <path d="M140 0 L148 24 L146 170 L134 170 L132 24 Z" fill={Q_COLOR[qualityIdx(wep)]} stroke="#120c08" strokeWidth="1.8" />
              <line x1="140" y1="12" x2="140" y2="165" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2" />
              <path d="M116 168 Q140 160 164 168 L162 178 Q140 171 118 178 Z" fill="#d9ad5b" stroke="#120c08" strokeWidth="1.5" />
              <rect x="136" y="178" width="8" height="30" rx="2" fill="#3a2818" />
              <circle cx="140" cy="212" r="5" fill="#d9ad5b" />
            </g>
          )}
        </g>
      )}

      {/* ───── 4. THÂN HÌNH & CHÂN DUNG TIÊN HIỆP ───── */}
      {!look ? (
        <g className="av-real-portrait" transform="translate(140 148)">
          <defs>
            <clipPath id={`avatarClip${uid}`}>
              <circle cx="0" cy="0" r="94" />
            </clipPath>
          </defs>
          {/* Vầng nguyệt luân / Trăng rằm & Đạo trận */}
          {/* Viền ngoài nhuộm màu ngoại trang đang mặc */}
          <circle cx="0" cy="0" r="104" fill={robe} fillOpacity="0.35" stroke={trim} strokeWidth="3" />
          <circle cx="0" cy="0" r="98" stroke="#ffe194" strokeWidth="1" strokeDasharray="6 4" fill="none" opacity="0.8" />
          {/* Tranh vẽ chân thực 3D CGI chuẩn Thiện Nữ 2 */}
          <image
            href={f ? './art/characters/female_cultivator.png' : './art/characters/male_cultivator.png'}
            x="-94"
            y="-94"
            width="188"
            height="188"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#avatarClip${uid})`}
            style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.85))' }}
          />
          {/* Khung viền kim tuyến Bát Quái ôm quanh chân dung */}
          <circle cx="0" cy="0" r="94" stroke={`url(#goldTrim${uid})`} strokeWidth="3" fill="none" style={{ filter: 'drop-shadow(0 0 10px rgba(217,173,91,0.6))' }} />
          {/* Phù văn tứ tượng bảo vệ */}
          <polygon points="0,-98 -4,-94 0,-90 4,-94" fill="#ffd700" />
          <polygon points="0,98 -4,94 0,90 4,94" fill="#ffd700" />
          <polygon points="-98,0 -94,-4 -90,0 -94,4" fill="#ffd700" />
          <polygon points="98,0 94,-4 90,0 94,4" fill="#ffd700" />
        </g>
      ) : (
        <g className="av-body" transform="translate(20 0)">
          {/* Áo choàng uy nghiêm */}
          {x.has('cape') && (
            <path
              className="av-cape"
              d="M84 108 Q36 195 24 295 L216 295 Q204 195 156 108 Z"
              fill={sash}
              opacity="0.95"
              stroke="#120c08"
              strokeWidth="1.5"
            />
          )}

          {/* Tóc tiên hiệp phía sau */}
          <path
            d={f ? 'M94 62 Q78 160 96 210 L144 210 Q162 160 146 62 Z' : 'M98 64 Q90 120 100 146 L140 146 Q150 120 142 64 Z'}
            fill={hair}
          />

          {/* Thân áo trường bào */}
          <path
            d="M86 112 Q120 98 154 112 L168 190 Q174 252 186 290 L54 290 Q66 252 72 190 Z"
            fill={`url(#rb${uid})`}
            stroke="#120c08"
            strokeWidth="2.2"
          />
          <path
            d="M86 112 Q120 98 154 112 L168 190 Q174 252 186 290 L54 290 Q66 252 72 190 Z"
            fill={`url(#sh${uid})`}
          />

          {/* Tay áo rộng phiêu dật */}
          <path className="av-sleeve l" d="M86 112 Q62 128 52 172 Q48 205 58 226 L92 218 Q84 182 94 146 Z" fill={robe} stroke="#120c08" strokeWidth="2.2" />
          <path className="av-sleeve r" d="M154 112 Q178 128 188 172 Q192 205 182 226 L148 218 Q156 182 146 146 Z" fill={robe} stroke="#120c08" strokeWidth="2.2" />

          {/* Viền tay áo kim thêu */}
          <path d="M58 226 L92 218" stroke={`url(#goldTrim${uid})`} strokeWidth="5.5" strokeLinecap="round" />
          <path d="M182 226 L148 218" stroke={`url(#goldTrim${uid})`} strokeWidth="5.5" strokeLinecap="round" />

          {/* Giáp vai chiến tướng */}
          {x.has('armor') && (
            <>
              <path d="M78 108 Q56 112 54 138 Q74 134 92 124 Z" fill={`url(#goldTrim${uid})`} stroke="#120c08" strokeWidth="2" />
              <path d="M162 108 Q184 112 186 138 Q166 134 148 124 Z" fill={`url(#goldTrim${uid})`} stroke="#120c08" strokeWidth="2" />
              <polygon points="98,124 142,124 138,160 102,160" fill={trim} opacity="0.6" stroke="#120c08" strokeWidth="1" />
            </>
          )}

          {/* Áo trong & Cổ áo Giao Lĩnh */}
          <path d="M104 108 L120 152 L136 108 Z" fill={inner} />
          <path d="M102 106 L120 154 L138 106" fill="none" stroke={`url(#goldTrim${uid})`} strokeWidth="5" strokeLinejoin="round" />

          {/* Đai lưng gấm & Bội ngọc */}
          <path d="M74 162 Q120 174 166 162 L168 180 Q120 192 72 180 Z" fill={sash} stroke="#120c08" strokeWidth="1.8" />
          <path className="av-tail" d="M112 180 L104 246 L116 242 Z" fill={sash} />
          <path className="av-tail" d="M128 180 L136 248 L124 244 Z" fill={sash} />
          <circle cx="120" cy="172" r="5" fill="#48c78e" stroke="#ffd700" strokeWidth="1.5" />

          {/* Viền chân áo thêu kim tuyến */}
          <path d="M54 290 Q120 298 186 290" fill="none" stroke={`url(#goldTrim${uid})`} strokeWidth="6.5" strokeLinecap="round" />

          {/* Hoa văn Dị Hỏa / Viêm Đế */}
          {x.has('flame') && (
            <path
              d="M66 286 Q78 260 88 280 Q98 248 110 278 Q120 242 130 278 Q142 248 152 280 Q162 260 174 286 Z"
              fill={`url(#fl${uid})`}
              opacity="0.9"
            />
          )}

          {/* Cổ và Đầu */}
          <rect x="113" y="90" width="14" height="18" rx="4" fill={skin} />
          {x.has('hood') && (
            <path
              d="M88 92 Q84 38 120 34 Q156 38 152 92 Q158 110 148 116 L92 116 Q82 110 88 92 Z"
              fill={sash}
              stroke="#120c08"
              strokeWidth="2.2"
            />
          )}
          <ellipse cx="120" cy="73" rx="19.5" ry="22.5" fill={skin} />

          {/* Ánh mắt kiên định & Mi mục */}
          <path d="M109 72 q4 2 7 -1 M124 71 q4 -3 7 1" stroke="#3a2518" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Ấn chú trán (Đế Ấn / Đạo Văn) theo cảnh giới */}
          {R >= 3 && (
            <path
              d="M120 57 L122 63 L120 67 L118 63 Z"
              fill={R >= 11 ? '#ffd700' : R >= 7 ? '#ff4d4d' : '#4da6ff'}
              stroke="#fff"
              strokeWidth="0.5"
            />
          )}

          {/* Tóc chải búi đạo sĩ & Tiên quan / Trâm cài */}
          {!x.has('hood') && (
            <>
              <path
                d={
                  f
                    ? 'M98 78 Q95 44 120 44 Q145 44 142 78 Q136 58 120 58 Q104 58 98 78 Z'
                    : 'M99 74 Q96 46 120 46 Q144 46 141 74 Q134 56 120 56 Q106 56 99 74 Z'
                }
                fill={hair}
              />
              {f ? (
                <>
                  <circle cx="102" cy="50" r="9" fill={hair} />
                  <circle cx="138" cy="50" r="9" fill={hair} />
                  <path d="M134 44 l15 -9" stroke={`url(#goldTrim${uid})`} strokeWidth="3" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="120" cy="40" r="11" fill={hair} />
                  <path d="M104 38 L136 43" stroke={`url(#goldTrim${uid})`} strokeWidth="3" strokeLinecap="round" />
                </>
              )}
            </>
          )}

          {/* Đế miện hoàng kim */}
          {x.has('crown') && (
            <path
              d="M104 50 L108 32 L115 44 L120 28 L125 44 L132 32 L136 50 Z"
              fill="#ffd700"
              stroke="#8a672a"
              strokeWidth="1.8"
            />
          )}
        </g>
      )}

      {/* ───── 5. LINH THÚ (PET) BAY BÊN CẠNH ───── */}
      {petTheme && (
        <g transform="translate(204 185)">
          <g className="av-pet" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.8))' }}>
            {/* Vòng khí tức thú cưng */}
            <circle cx="26" cy="26" r="28" fill={petTheme.bg} stroke={petTheme.c} strokeWidth="1.5" />
            <circle cx="26" cy="26" r="32" stroke={petTheme.c} strokeWidth="1" strokeDasharray="4 3" fill="none" opacity="0.6" />
            <BeastVectorSvg id={pet.id} size={52} />
          </g>
        </g>
      )}
    </svg>
  );
}

// Huy hiệu tròn nhỏ ở thanh trạng thái
export function AvatarBadge({ s, size = 42, onClick }) {
  const f = s?.g === 'f';
  return (
    <button
      className="av-badge"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        overflow: 'hidden',
        border: '1.8px solid #d9ad5b',
        boxShadow: '0 0 10px rgba(217,173,91,0.3)',
        background: '#120c08',
        padding: 0,
      }}
      onClick={onClick}
      aria-label="Xem nhân vật"
      title="Nhân vật · Pháp bảo"
    >
      <img
        src={f ? './art/characters/female_cultivator.png' : './art/characters/male_cultivator.png'}
        alt={s?.name || 'Nhân vật'}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </button>
  );
}

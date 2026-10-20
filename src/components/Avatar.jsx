import { useId } from 'react';
import { activeBeast, qualityIdx } from '../game/util.js';
import { outfitOf } from '../game/wardrobe.js';
import { BEAST_I } from './icons.jsx';

// Màu hào quang theo cảnh giới
const AURA = (R) => (R >= 10 ? ['#fff3df', '#f5c55e'] : R >= 7 ? ['#ffd2a8', '#e0602a'] : R >= 4 ? ['#e6defc', '#aa96f4'] : R >= 1 ? ['#d8f5e7', '#62b291'] : ['#d9cdb5', '#7c6b54']);
const Q_COLOR = ['#c9bba0', '#6cc39b', '#5fb7e2', '#b79bff', '#f5c55e'];

// Nhân vật vẽ bằng nhiều lớp SVG: áo, viền, đai, tóc, phụ kiện theo ngoại trang; vũ khí sau lưng theo phẩm chất;
// hào quang theo cảnh giới; thú cưỡi phía sau, thú cưng lơ lửng bên cạnh.
// look: ghi đè ngoại trang để xem thử trong tủ đồ
export default function Avatar({ s, look, size = 220, beasts = true, still = false, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const o = look || outfitOf(s);
  const [robe, trim, sash, inner] = o.c;
  const x = new Set(o.x || []);
  const f = s?.g === 'f';
  const [a1, a2] = AURA(s?.R || 0);
  const wep = s?.gear?.wep;
  const pet = beasts && s ? activeBeast(s, 'pet') : null;
  const mount = beasts && s ? activeBeast(s, 'mount') : null;
  const PetI = pet && BEAST_I[pet.id];
  const MountI = mount && BEAST_I[mount.id];
  const hair = '#17110d';
  const skin = '#e9d3b4';
  return (
    <svg className={'avatar' + (still ? ' still' : '') + (className ? ' ' + className : '')} viewBox="0 0 240 300" width={size} height={size * 1.25} role="img" aria-label={`${s?.name || 'Nhân vật'} mặc ${o.n.toLowerCase()}`}>
      <defs>
        <radialGradient id={`au${uid}`}>
          <stop offset="0" stopColor={a1} stopOpacity=".55" />
          <stop offset=".55" stopColor={a2} stopOpacity=".22" />
          <stop offset="1" stopColor={a2} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`rb${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={robe} />
          <stop offset="1" stopColor={robe} stopOpacity=".78" />
        </linearGradient>
        <linearGradient id={`sh${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".28" />
          <stop offset=".45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".32" />
        </linearGradient>
      </defs>

      {/* Hào quang và bệ mây */}
      <ellipse className="av-aura" cx="120" cy="150" rx="118" ry="140" fill={`url(#au${uid})`} />
      {MountI && <g transform="translate(40 150)" opacity=".5"><g className="av-mount"><MountI size={160} color={a2} style={{ filter: 'drop-shadow(0 4px 8px #000a)' }} /></g></g>}
      <ellipse cx="120" cy="286" rx="78" ry="9" fill="#000" opacity=".45" />

      <g className="av-body">
        {/* Vũ khí đeo sau lưng */}
        {wep && (
          <g transform="rotate(-32 120 150)">
            <path d="M120 8 L127 28 L127 160 L113 160 L113 28 Z" fill={Q_COLOR[qualityIdx(wep)]} stroke="#0c0806" strokeWidth="1.5" />
            <path d="M120 24 L120 154" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" />
            <path d="M98 158 Q120 151 142 158 L140 168 Q120 162 100 168 Z" fill="#d9ad5b" stroke="#0c0806" strokeWidth="1.2" />
            <rect x="116.5" y="167" width="7" height="30" rx="2" fill="#3a2818" />
            <circle cx="120" cy="201" r="5" fill="#d9ad5b" stroke="#0c0806" strokeWidth="1" />
          </g>
        )}
        {/* Áo choàng */}
        {x.has('cape') && <path className="av-cape" d="M84 108 Q46 190 34 292 L206 292 Q194 190 156 108 Z" fill={sash} opacity=".92" />}
        {/* Tóc dài sau lưng */}
        <path d={f ? 'M96 62 Q84 150 98 200 L142 200 Q156 150 144 62 Z' : 'M100 64 Q94 110 102 132 L138 132 Q146 110 140 64 Z'} fill={hair} />
        {/* Thân áo */}
        <path d="M86 112 Q120 100 154 112 L166 190 Q170 250 182 288 L58 288 Q70 250 74 190 Z" fill={`url(#rb${uid})`} stroke="#0c0806" strokeWidth="2" />
        <path d="M86 112 Q120 100 154 112 L166 190 Q170 250 182 288 L58 288 Q70 250 74 190 Z" fill={`url(#sh${uid})`} />
        {/* Tay áo rộng */}
        <path className="av-sleeve l" d="M86 112 Q64 128 56 170 Q52 200 62 220 L92 214 Q86 180 94 146 Z" fill={robe} stroke="#0c0806" strokeWidth="2" />
        <path className="av-sleeve r" d="M154 112 Q176 128 184 170 Q188 200 178 220 L148 214 Q154 180 146 146 Z" fill={robe} stroke="#0c0806" strokeWidth="2" />
        <path d="M62 220 L92 214" stroke={trim} strokeWidth="5" strokeLinecap="round" />
        <path d="M178 220 L148 214" stroke={trim} strokeWidth="5" strokeLinecap="round" />
        {/* Giáp vai */}
        {x.has('armor') && (
          <>
            <path d="M80 108 Q60 112 58 136 Q76 132 92 124 Z" fill={trim} stroke="#0c0806" strokeWidth="2" />
            <path d="M160 108 Q180 112 182 136 Q164 132 148 124 Z" fill={trim} stroke="#0c0806" strokeWidth="2" />
            <path d="M100 124 L140 124 L136 160 L104 160 Z" fill={trim} opacity=".55" />
          </>
        )}
        {/* Áo trong và cổ áo giao lĩnh */}
        <path d="M104 110 L120 150 L136 110 Z" fill={inner} />
        <path d="M102 108 L120 152 L138 108" fill="none" stroke={trim} strokeWidth="5" strokeLinejoin="round" />
        {/* Đai lưng và dải đai */}
        <path d="M76 162 Q120 172 164 162 L165 178 Q120 188 75 178 Z" fill={sash} stroke="#0c0806" strokeWidth="1.5" />
        <path className="av-tail" d="M114 178 L106 236 L116 233 Z" fill={sash} />
        <path className="av-tail" d="M126 178 L134 238 L124 234 Z" fill={sash} />
        <path d="M120 186 L120 288" stroke={trim} strokeWidth="2" opacity=".6" />
        <path d="M58 288 Q120 296 182 288" fill="none" stroke={trim} strokeWidth="6" strokeLinecap="round" />
        {/* Hoa văn lửa */}
        {x.has('flame') && (
          <path d="M70 284 Q80 262 90 280 Q98 250 110 278 Q120 246 130 278 Q142 250 150 280 Q160 262 170 284 Z" fill={trim} opacity=".85" />
        )}
        {/* Cổ, đầu */}
        <rect x="113" y="92" width="14" height="16" rx="4" fill={skin} />
        {x.has('hood') && <path d="M90 92 Q86 40 120 36 Q154 40 150 92 Q156 108 148 114 L92 114 Q84 108 90 92 Z" fill={sash} stroke="#0c0806" strokeWidth="2" />}
        <ellipse cx="120" cy="74" rx="19" ry="22" fill={skin} />
        <path d="M110 74 q3 2 6 0 M124 74 q3 2 6 0" stroke="#3a2818" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {/* Tóc trên đầu */}
        {!x.has('hood') && (
          <>
            <path d={f ? 'M99 78 Q96 46 120 46 Q144 46 141 78 Q136 60 120 60 Q104 60 99 78 Z' : 'M100 74 Q98 48 120 48 Q142 48 140 74 Q134 58 120 58 Q106 58 100 74 Z'} fill={hair} />
            {f ? (
              <>
                <circle cx="102" cy="52" r="9" fill={hair} />
                <circle cx="138" cy="52" r="9" fill={hair} />
                <path d="M134 46 l14 -8" stroke={trim} strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="120" cy="42" r="10" fill={hair} />
                <path d="M106 40 L134 44" stroke={trim} strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}
          </>
        )}
        {x.has('crown') && <path d="M106 52 L109 36 L116 46 L120 32 L124 46 L131 36 L134 52 Z" fill="#f4d58f" stroke="#8a672a" strokeWidth="1.5" />}
        {x.has('veil') && <path d="M98 58 Q90 130 96 200 L144 200 Q150 130 142 58 Z" fill="#fff" opacity=".14" />}
      </g>

      {PetI && <g transform="translate(178 196)"><g className="av-pet"><circle cx="24" cy="24" r="26" fill={a2} opacity=".18" /><PetI size={48} color={a1} style={{ filter: 'drop-shadow(0 3px 5px #000c)' }} /></g></g>}
    </svg>
  );
}

// Huy hiệu tròn nhỏ: chỉ phần đầu và vai, dùng ở thanh trạng thái
export function AvatarBadge({ s, size = 40, onClick }) {
  // Phóng to rồi canh cho đầu nhân vật (tọa độ 120, 74 trong khung 240 × 300) nằm giữa huy hiệu
  const W = size * 1.9;
  const H = W * 1.25;
  return (
    <button className="av-badge" style={{ width: size, height: size }} onClick={onClick} aria-label="Xem nhân vật" title="Nhân vật · trang bị">
      <span style={{ position: 'absolute', left: (size - W) / 2, top: size / 2 - (84 / 300) * H }}><Avatar s={s} size={W} beasts={false} still /></span>
    </button>
  );
}


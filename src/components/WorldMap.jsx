import { useEffect, useRef } from 'react';
import G from '../game/data.js';
import { fmtGold } from '../game/util.js';
import { regionDef, conquerP, attackBlock, devLv, devPlan, develop, regionInc, zoneOpen, warPower } from '../game/sect.js';
import { LevelBuy } from './ui.jsx';
import { Ico, UI_I, ITEM_I } from './icons.jsx';

// Vị trí nhãn: b dưới, a trên, l trái, r phải, bl dưới canh phải (sát mép bản đồ)
const LB = {
  otan: 'b', thanhson: 'r', mathu: 'a', vanlam: 'a', giama: 'b', thapqua: 'b', hacgiac: 'b', xuatvan: 'a', gianam: 'b',
  thienbac: 'b', danvuc: 'b', hoatong: 'l', phongloi: 'b', thanhdan: 'b', hondien: 'b',
  vanthu: 'a', thaihu: 'l', thienyeu: 'a', cuuu: 'bl', viem: 'b', duoctoc: 'b', loi: 'b', thach: 'bl', cotoc: 'bl',
  hvkg: 'b', thienhon: 'r', chudien: 'b', daxa: 'b',
};
const ZONE_TONE = ['z-gm', 'z-tb', 'z-tc', 'z-tv', 'z-cg', 'z-hg'];
// Nhãn khu vực đặt ở mép vùng, tránh đè lên tên các vùng đất: [x, y, canh lề]
const ZONE_AT = [[130, 464, 'middle'], [22, 116, 'start'], [300, 374, 'middle'], [556, 464, 'middle'], [548, 20, 'middle'], [356, -6, 'middle']];

// Bao lồi của các điểm trong một khu vực (monotone chain)
function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
const ZONES = G.ZONES.map((z, i) => {
  const pts = G.REGIONS.filter((r) => r.z === i).map((r) => r.xy);
  const h = hull(pts);
  return { ...z, i, d: h.map((q) => q.join(',')).join(' '), at: ZONE_AT[i] };
});
const POS = Object.fromEntries(G.REGIONS.map((r) => [r.id, r.xy]));

export function regionState(s, r) {
  if (s.land[r.id]) return 'own';
  if (!s.sect || attackBlock(s, r) && attackBlock(s, r) !== 'Quân đang nghỉ') return 'lock';
  const p = conquerP(s, regionDef(s, r));
  return p >= 0.6 ? 'easy' : p >= 0.3 ? 'mid' : 'hard';
}

export default function WorldMap({ s, sel, onSel }) {
  const wrap = useRef(null);
  // Cuộn tới vùng đang chọn khi bản đồ rộng hơn màn hình
  useEffect(() => {
    const el = wrap.current;
    const r = G.REGIONS.find((x) => x.id === sel);
    if (!el || !r || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: (r.xy[0] / 640) * el.scrollWidth - el.clientWidth / 2, behavior: 'smooth' });
  }, [sel]);
  const mine = (id) => !!s.land[id];
  return (
    <div className="world-wrap" ref={wrap}>
      <svg className="world" viewBox="0 -24 640 500" role="img" aria-label="Bản đồ Đấu Khí Đại Lục">
        {ZONES.map((z) => (
          <g key={z.n} className={'wm-zone ' + ZONE_TONE[z.i] + (zoneOpen(s, { z: z.i }) ? '' : ' closed')}>
            <polygon points={z.d} className="wm-zone-edge" />
            <polygon points={z.d} className="wm-zone-fill" />
            <text x={z.at[0]} y={z.at[1]} textAnchor={z.at[2]} className="wm-zone-label">{z.n}{z.minR && s.R < z.minR ? ` · cần ${G.REALMS[z.minR].n}` : ''}</text>
          </g>
        ))}
        {G.ROADS.map(([a, b]) => {
          const [x1, y1] = POS[a], [x2, y2] = POS[b];
          return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} className={'wm-road' + (mine(a) && mine(b) ? ' own' : '')} />;
        })}
        {G.REGIONS.map((r) => {
          const [x, y] = r.xy;
          const lb = LB[r.id] || 'b';
          const st = regionState(s, r);
          const tx = lb === 'l' ? x - 13 : lb === 'r' ? x + 13 : lb === 'bl' ? x + 8 : x;
          const ty = lb === 'a' ? y - 14 : lb === 'b' || lb === 'bl' ? y + 22 : y + 4;
          const anchor = lb === 'l' || lb === 'bl' ? 'end' : lb === 'r' ? 'start' : 'middle';
          return (
            <g key={r.id} className={'wm-node ' + st + (sel === r.id ? ' sel' : '')} onClick={() => onSel(r.id)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel(r.id); } }} aria-label={r.n}>
              <circle cx={x} cy={y} r="18" className="wm-hit" />
              {sel === r.id && <circle cx={x} cy={y} r="14" className="wm-ring" />}
              <circle cx={x} cy={y} r="8.5" className="wm-dot" />
              {st === 'own' && <text x={x} y={y + 3.4} className="wm-flag" textAnchor="middle">Ta</text>}
              <text x={tx} y={ty} className="wm-label" textAnchor={anchor}>{r.n}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Thẻ chi tiết vùng đang chọn trên bản đồ
export function RegionCard({ s, id, onAttack, act }) {
  const r = G.REGIONS.find((x) => x.id === id);
  if (!r) return null;
  const own = !!s.land[r.id];
  const def = regionDef(s, r);
  const p = s.sect ? conquerP(s, def) : 0;
  const block = attackBlock(s, r);
  const tone = p >= 0.6 ? 'easy' : p >= 0.3 ? 'mid' : 'hard';
  return (
    <div className={'region-card' + (own ? ' own' : '')}>
      <div className="rc-head">
        <div>
          <small>{G.ZONES[r.z].n} · {own ? s.sect?.name : r.own}</small>
          <b>{r.n}</b>
        </div>
        {!own && s.sect && !block && <span className={'rc-odds ' + tone} title="Tỷ lệ thắng khi đích thân dẫn quân">{Math.round(p * 100)}%</span>}
      </div>
      <p className="d-desc">{r.d}</p>
      <div className="rc-facts">
        {!own && <span className="sv" title="Thực lực trấn thủ"><Ico i={UI_I.army} size={15} />{def}</span>}
        {!own && s.sect && <span className="sv" title="Thế lực của bạn"><Ico i={UI_I.power} size={15} />{Math.round(warPower(s))}</span>}
        <span className="sv" title="Thu nhập mỗi năm"><Ico i={UI_I.gold} size={15} />{fmtGold(own ? regionInc(s, r.id) : r.inc)}/năm</span>
        {r.item && <span className="sv" title="Sản vật"><Ico i={ITEM_I[r.item]} size={15} />+</span>}
        {own && <span className="sv" title="Cấp khai phát, mỗi cấp +8% thu nhập"><Ico i={UI_I.up} size={15} />{devLv(s, r.id)}/{G.DEV_MAX}</span>}
      </div>
      {own ? (
        <LevelBuy lv={devLv(s, r.id)} max={G.DEV_MAX} gold={s.gold} plan={(w) => devPlan(s, r.id, w)} onBuy={(w) => act(() => develop(s, r.id, w))} />
      ) : (
        <button className="btn primary" disabled={!!block} onClick={() => onAttack(r.id)}>
          {block ? <><Ico i={UI_I.lock} size={18} /> {block}</> : <><Ico i={UI_I.army} size={20} /> Xuất binh</>}
        </button>
      )}
    </div>
  );
}

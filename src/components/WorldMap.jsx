import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import G from '../game/data.js';
import { fmtGold } from '../game/util.js';
import { regionDef, conquerP, attackBlock, devLv, devPlan, develop, regionInc, zoneOpen, warPower } from '../game/sect.js';
import { LevelBuy } from './ui.jsx';
import { Ico, UI_I, ITEM_I } from './icons.jsx';
import { GiCastle, GiSandCastle, GiPagoda, GiWolfHead, GiCrown, GiSpectre, GiTowerFlag } from 'react-icons/gi';
import { MAP, CANVAS, terrainAsync, drawTerritory } from './mapTerrain.js';

// Vị trí nhãn: b dưới, a trên, l trái, r phải, bl dưới canh phải (sát mép bản đồ)
const LB = {
  otan: 'b', thanhson: 'r', mathu: 'a', vanlam: 'a', giama: 'b', thapqua: 'b', hacgiac: 'b', xuatvan: 'a', gianam: 'b',
  thienbac: 'b', danvuc: 'b', hoatong: 'l', phongloi: 'b', thanhdan: 'b', hondien: 'b',
  vanthu: 'a', thaihu: 'l', thienyeu: 'a', cuuu: 'bl', viem: 'b', duoctoc: 'b', loi: 'b', thach: 'bl', cotoc: 'bl',
  hvkg: 'b', thienhon: 'r', chudien: 'b', daxa: 'b',
};
// Nhãn khu vực đặt ở mép vùng, tránh đè lên tên các vùng đất: [x, y, canh lề]
const ZONE_AT = [[130, 462, 'middle'], [22, 112, 'start'], [300, 372, 'middle'], [556, 462, 'middle'], [548, 18, 'middle'], [356, -12, 'middle']];
// Hình thành trì theo khu vực
const ZONE_ICON = [GiCastle, GiSandCastle, GiPagoda, GiWolfHead, GiCrown, GiSpectre];
const POS = Object.fromEntries(G.REGIONS.map((r) => [r.id, r.xy]));
const REG_IDX = Object.fromEntries(G.REGIONS.map((r, i) => [r.id, i]));

// Đường nối hơi cong cho giống đường đi thật
function roadPath([x1, y1], [x2, y2], k) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const bend = (k % 2 ? 1 : -1) * 0.12;
  return `M${x1},${y1} Q${mx - dy * bend},${my + dx * bend} ${x2},${y2}`;
}

export function regionState(s, r) {
  if (s.land[r.id]) return 'own';
  if (!s.sect || (attackBlock(s, r) && attackBlock(s, r) !== 'Quân đang nghỉ')) return 'lock';
  const p = conquerP(s, regionDef(s, r));
  return p >= 0.6 ? 'easy' : p >= 0.3 ? 'mid' : 'hard';
}

const KMIN = 1, KMAX = 4;

export default function WorldMap({ s, sel, onSel }) {
  const box = useRef(null);
  const stage = useRef(null);
  const terr = useRef(null);
  const land = useRef(null);
  const view = useRef({ k: 1, x: 0, y: 0 });
  const drag = useRef({ pts: new Map(), moved: false, d0: 0, k0: 1 });
  const [ready, setReady] = useState(false);
  const mine = (id) => !!s.land[id];

  // Áp phép biến đổi, giữ bản đồ luôn phủ kín khung
  const apply = (v) => {
    const el = box.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    v.k = Math.min(KMAX, Math.max(KMIN, v.k));
    v.x = Math.min(0, Math.max(W - W * v.k, v.x));
    v.y = Math.min(0, Math.max(H - H * v.k, v.y));
    view.current = v;
    stage.current.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.k})`;
  };
  const zoomAt = (f, cx, cy) => {
    const v = view.current;
    const k = Math.min(KMAX, Math.max(KMIN, v.k * f));
    apply({ k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k });
  };
  const centerOn = (id, k) => {
    const el = box.current;
    const r = G.REGIONS.find((x) => x.id === id);
    if (!el || !r) return;
    const W = el.clientWidth, H = el.clientHeight;
    const px = ((r.xy[0] - MAP.x0) / MAP.w) * W, py = ((r.xy[1] - MAP.y0) / MAP.h) * H;
    apply({ k, x: W / 2 - px * k, y: H / 2 - py * k });
  };

  // Lần đầu: điện thoại phóng to sẵn quanh vùng đang chọn cho dễ đọc
  useLayoutEffect(() => {
    if (box.current.clientWidth < 520) centerOn(sel, 1.8);
    else apply({ k: 1, x: 0, y: 0 });
  }, []);

  // Địa hình dựng từng đợt nhỏ (lần đầu mất chừng nửa giây), những lần sau lấy từ bộ nhớ
  useEffect(() => terrainAsync((cv) => {
    terr.current?.getContext('2d').drawImage(cv, 0, 0);
    setReady(true);
  }), []);
  const landKey = Object.keys(s.land).join();
  useEffect(() => {
    if (!ready) return;
    const closed = new Set(G.ZONES.map((z, i) => (zoneOpen(s, { z: i }) ? -1 : i)));
    drawTerritory(land.current.getContext('2d'), new Set(Object.keys(s.land)), closed, REG_IDX[sel]);
  }, [ready, sel, landKey, s.R]);

  // Lăn chuột để phóng to (cần listener không thụ động để chặn cuộn trang)
  useEffect(() => {
    const el = box.current;
    const onWheel = (e) => {
      e.preventDefault();
      const b = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - b.left, e.clientY - b.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Kéo một ngón để di chuyển, chụm hai ngón để phóng to
  const onDown = (e) => {
    const d = drag.current;
    d.pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (d.pts.size === 1) d.moved = false;
    if (d.pts.size === 2) {
      const [a, b] = [...d.pts.values()];
      d.d0 = Math.hypot(a[0] - b[0], a[1] - b[1]);
      d.k0 = view.current.k;
    }
  };
  const onMove = (e) => {
    const d = drag.current;
    const prev = d.pts.get(e.pointerId);
    if (!prev) return;
    const cur = [e.clientX, e.clientY];
    d.pts.set(e.pointerId, cur);
    if (d.pts.size === 1) {
      const dx = cur[0] - prev[0], dy = cur[1] - prev[1];
      if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
      if (d.moved) apply({ ...view.current, x: view.current.x + dx, y: view.current.y + dy });
    } else if (d.pts.size === 2) {
      d.moved = true;
      const [a, b] = [...d.pts.values()];
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const r = box.current.getBoundingClientRect();
      zoomAt((d.k0 * dist) / d.d0 / view.current.k, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
    }
  };
  const onUp = (e) => { drag.current.pts.delete(e.pointerId); };
  const pick = (id) => { if (!drag.current.moved) onSel(id); };
  const ctrl = (f) => zoomAt(f, (box.current?.clientWidth || 0) / 2, (box.current?.clientHeight || 0) / 2);

  return (
    <div className="world-wrap" ref={box} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
      <div className="world-stage" ref={stage}>
        <canvas ref={terr} width={CANVAS.w} height={CANVAS.h} className={'world-cv' + (ready ? ' on' : '')} />
        <canvas ref={land} width={CANVAS.w} height={CANVAS.h} className="world-cv on" />
        <svg className="world" viewBox={`${MAP.x0} ${MAP.y0} ${MAP.w} ${MAP.h}`} role="img" aria-label="Sa bàn Đấu Khí Đại Lục">
          {G.ZONES.map((z, i) => (
            <text key={z.n} x={ZONE_AT[i][0]} y={ZONE_AT[i][1]} textAnchor={ZONE_AT[i][2]} className={'wm-zone-label' + (zoneOpen(s, { z: i }) ? '' : ' closed')}>
              {z.n}{z.minR && s.R < z.minR ? ` · cần ${G.REALMS[z.minR].n}` : ''}
            </text>
          ))}
          {G.ROADS.map(([a, b], k) => (
            <path key={a + b} d={roadPath(POS[a], POS[b], k)} className={'wm-road' + (mine(a) && mine(b) ? ' own' : '')} />
          ))}
          {G.REGIONS.map((r) => {
            const [x, y] = r.xy;
            const lb = LB[r.id] || 'b';
            const st = regionState(s, r);
            const I = st === 'own' ? GiTowerFlag : ZONE_ICON[r.z];
            const tx = lb === 'l' ? x - 15 : lb === 'r' ? x + 15 : lb === 'bl' ? x + 10 : x;
            const ty = lb === 'a' ? y - 16 : lb === 'b' || lb === 'bl' ? y + 24 : y + 4;
            const anchor = lb === 'l' || lb === 'bl' ? 'end' : lb === 'r' ? 'start' : 'middle';
            return (
              <g key={r.id} className={'wm-node ' + st + (sel === r.id ? ' sel' : '')} onClick={() => pick(r.id)} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSel(r.id); } }} aria-label={r.n}>
                <circle cx={x} cy={y} r="20" className="wm-hit" />
                {sel === r.id && <circle cx={x} cy={y} r="16" className="wm-ring" />}
                <circle cx={x} cy={y} r="11" className="wm-plate" />
                <I x={x - 7.5} y={y - 7.5} size={15} className="wm-ico" />
                <text x={tx} y={ty} className="wm-label" textAnchor={anchor}>{r.n}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {!ready && <div className="world-loading">Đang dựng sa bàn…</div>}
      <div className="world-ctrl" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => ctrl(1.4)} aria-label="Phóng to" title="Phóng to">+</button>
        <button onClick={() => ctrl(1 / 1.4)} aria-label="Thu nhỏ" title="Thu nhỏ">−</button>
        <button onClick={() => apply({ k: 1, x: 0, y: 0 })} aria-label="Xem toàn bộ" title="Xem toàn bộ"><Ico i={UI_I.map} size={16} /></button>
      </div>
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

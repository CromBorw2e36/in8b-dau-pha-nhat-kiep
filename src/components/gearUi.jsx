// Phần hiển thị trang bị dùng chung cho Túi, Chợ, Sàn, Lò rèn
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import G from '../game/data.js';
import { gearName, gearStat, qualityIdx, fxText, enMax, enTier, heirRank, attrText, fmtCp } from '../game/util.js';
import { gearDelta, toggleLock } from '../game/gear.js';
import { Tile, Card } from './ui.jsx';
import { Ico, SLOT_I, STAT_I, UI_I } from './icons.jsx';
import GearArt from './gearArt.jsx';

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
// Phẩm của vật phẩm theo cấp/phẩm 1..9 → màu viền 0..4
export const gradeQ = (g) => (g >= 9 ? 4 : g >= 7 ? 3 : g >= 5 ? 2 : g >= 3 ? 1 : 0);
// Sắc độ nhãn cường hóa: thường, cao (+7), tầng truyền thừa (+13 trở lên), cực hạn
export const enTone = (it) => (it.en >= enMax(it) ? 'en en-max' : enTier(it.en) ? 'en en-heir' : it.en >= 7 ? 'en en-hi' : 'en');
// Lớp hào quang pháp bảo truyền thừa: heir heir-1..6 theo phẩm hiệu
export const heirCls = (it) => { const r = heirRank(it); return r ? `heir heir-${r.lv}` : ''; };

// Số chiến lực của một món: lẻ một chữ số khi nhỏ, chia bậc khi lớn
const cpNum = (v) => (Math.abs(v) >= 1e5 ? fmtCp(v) : v.toFixed(1));

// peek: rê chuột (chỉ chuột, không tính chạm) hiện khung xem nhanh; bấm mới mở chi tiết
// peek = true, hoặc { s, compare } để khung xem nhanh có so sánh với đồ đang mặc
export function GearTile({ it, sel, onClick, foot, mark, peek }) {
  const [at, setAt] = useState(null);
  const tile = (
    <Tile
      customArt={<GearArt it={it} size={44} />}
      icon={SLOT_I[it.sl]}
      q={qualityIdx(it)}
      badge={ROMAN[it.tier]}
      count={it.en ? `+${it.en}` : null}
      countTone={enTone(it)}
      foot={foot}
      mark={mark}
      sel={sel}
      onClick={onClick}
      title={peek ? undefined : gearName(it) + (it.gen ? ` · ${heirRank(it).n} ${it.gen} đời` : '')}
      cls={heirCls(it)}
    />
  );
  if (!peek) return tile;
  return (
    <span
      className="peek-host"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setAt(e.currentTarget.firstElementChild.getBoundingClientRect()); }}
      onPointerLeave={() => setAt(null)}
      onPointerDown={() => setAt(null)}
    >
      {tile}
      {at && <GearPeek it={it} at={at} s={peek.s} compare={peek.compare} />}
    </span>
  );
}

// Khung xem nhanh: tên, chỉ số chính, so sánh, tên các hiệu ứng. Đặt bên phải ô, tràn thì lật sang trái
const PEEK_FX = 4;
function GearPeek({ it, at, s, compare }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: at.right + 10, top: at.top, opacity: 0 });
  useLayoutEffect(() => {
    const { width: w, height: h } = ref.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const left = at.right + 10 + w <= vw - 8 ? at.right + 10 : Math.max(8, at.left - 10 - w);
    const top = Math.min(Math.max(8, at.top), vh - h - 8);
    setPos({ left, top, opacity: 1 });
  }, [at]);
  const rows = statRows(it);
  const d = compare && s ? gearDelta(s, it) : 0;
  const fx = it.fx || [];
  return createPortal(
    <div ref={ref} className={`gear-peek q-b${qualityIdx(it)}`} style={pos} role="tooltip">
      <div className="gp-head">
        <b className="gp-name">{it.lock && <Ico i={UI_I.lock} size={12} />}{gearName(it)}</b>
        <small className="muted">{G.GEAR[it.sl].n} · {G.TIERS[it.tier]}{it.en ? ` · +${it.en}/${enMax(it)}` : ''}</small>
      </div>
      <HeirSeal it={it} />
      <div className="gp-stats">
        {rows.map(([i, v, n]) => <span key={n} className="sv"><Ico i={i} size={13} />{n} <b className="num">{v}</b></span>)}
      </div>
      {Math.abs(d) >= 0.05 && <span className={'sv cmp ' + (d > 0 ? 'up' : 'down')}>{d > 0 ? '▲' : '▼'} {cpNum(Math.abs(d))} chiến lực so với đồ đang mặc</span>}
      {fx.length > 0 && (
        <div className="gp-fx">
          {fx.slice(0, PEEK_FX).map((f) => <span key={f.id} className="fx-chip">{fxText(it, f).n}</span>)}
          {fx.length > PEEK_FX && <span className="muted small">+{fx.length - PEEK_FX}</span>}
        </div>
      )}
      <small className="gp-hint muted">Bấm để xem chi tiết</small>
    </div>,
    document.body,
  );
}

// Các chỉ số của một món
function statRows(it) {
  const st = gearStat(it);
  return [
    [UI_I.cp, `+${cpNum(st.cp)}`, 'Chiến lực'],
    st.def ? [UI_I.lock, `−${Math.round(st.def * 100)}%`, 'Thương tổn'] : null,
    st.qi ? [STAT_I.qi, `+${Math.round(st.qi * 100)}%`, 'Tu luyện'] : null,
    st.bt ? [UI_I.up, `+${(st.bt * 100).toFixed(1)}%`, 'Đột phá'] : null,
    st.dodge ? [UI_I.retire, `${Math.round(st.dodge * 100)}%`, 'Thoát hiểm'] : null,
  ].filter(Boolean);
}

// Dòng tóm tắt hiện sẵn trên thẻ: chỉ số chính, so sánh và tên các hiệu ứng pháp khí
export function GearSummary({ it, s, compare }) {
  const rows = statRows(it).slice(0, 2);
  const d = compare ? gearDelta(s, it) : 0;
  return (
    <>
      {rows.map(([i, v, n]) => <span key={n} className="sv"><Ico i={i} size={13} />{n} {v}</span>)}
      {compare && Math.abs(d) >= 0.05 && <span className={'sv cmp ' + (d > 0 ? 'up' : 'down')}>{d > 0 ? '▲' : '▼'}{cpNum(Math.abs(d))}</span>}
      {it.fx?.map((f) => <span key={f.id} className="fx-chip">{fxText(it, f).n}</span>)}
    </>
  );
}

// Đầy đủ chỉ số khi mở thẻ
export function GearStats({ it, s, compare }) {
  const d = compare ? gearDelta(s, it) : 0;
  return (
    <div className="stat-line">
      <span className="muted small">{G.GEAR[it.sl].n} · {G.TIERS[it.tier]}{it.en || it.gen ? ` · cường hóa +${it.en || 0}/${enMax(it)}` : ''}</span>
      {statRows(it).map(([i, v, t]) => <span key={t} className="sv"><Ico i={i} size={14} />{t} {v}</span>)}
      {compare && Math.abs(d) >= 0.05 && <span className={'sv cmp ' + (d > 0 ? 'up' : 'down')} title="So với đồ đang mặc">{d > 0 ? '▲' : '▼'} {cpNum(Math.abs(d))} chiến lực</span>}
    </div>
  );
}

// Danh sách hiệu ứng pháp khí khi mở thẻ
export function FxList({ it }) {
  if (!it.fx?.length) return null;
  return (
    <ul className="fx-list">
      {it.fx.map((f) => {
        const t = fxText(it, f);
        return <li key={f.id} className={G.AFFIX.find((a) => a.id === f.id)?.heir ? 'fx-heir' : undefined}><b>{t.n}</b><span className="num">{t.val}</span><small>{t.d}</small></li>;
      })}
    </ul>
  );
}

// Ấn phẩm hiệu truyền thừa: tên phẩm và số đời
export function HeirSeal({ it }) {
  const r = heirRank(it);
  if (!r) return null;
  return <span className={'heir-seal h' + r.lv} title={`Đã truyền qua ${it.gen} đời`}>{r.n}<b className="num">{it.gen}</b></span>;
}

// Phả hệ và thuộc tính truyền thừa khi mở thẻ
export function HeirInfo({ it }) {
  if (!it.gen) return null;
  const r = heirRank(it);
  const attr = Object.entries(it.attr || {});
  return (
    <div className={'heir-info h' + r.lv}>
      <div className="hi-head"><HeirSeal it={it} /><span className="muted small">cường hóa tối đa +{enMax(it)} · tầng {enTier(it.en) + 1}/{1 + it.gen}</span></div>
      {attr.length > 0 && (
        <ul className="fx-list heir-attr">
          {attr.map(([id, v]) => { const t = attrText(id, v); return <li key={id}><b>{t.n}</b><span className="num">{t.val}</span><small>{t.d}</small></li>; })}
        </ul>
      )}
      {it.heirs?.length > 0 && (
        <ol className="heir-line" aria-label="Phả hệ truyền thừa">
          {it.heirs.map((h, i) => <li key={i}><span className="num">Đời {i + 1}</span><b>{h.n}</b><small>{h.R}{h.ng ? ` · trùng sinh ${h.ng}` : ''} · trao lại +{h.en}</small></li>)}
        </ol>
      )}
    </div>
  );
}

// Thẻ trang bị: tóm tắt hiện sẵn, mở ra xem đủ chỉ số, hiệu ứng và nút thao tác
export function GearCard({ it, s, open, onToggle, compare, right, tag, tone, children }) {
  return (
    <Card customArt={<GearArt it={it} size={36} />} icon={SLOT_I[it.sl]} q={qualityIdx(it)} badge={ROMAN[it.tier]} count={it.en ? `+${it.en}` : null} countTone={enTone(it)} fx={it.fx?.length > 0} cls={heirCls(it)}
      title={<>{it.lock && <span className="gear-lock" title="Đã khóa"><Ico i={UI_I.lock} size={13} /></span>}<HeirSeal it={it} />{gearName(it)}</>} sub={open ? null : <GearSummary it={it} s={s} compare={compare} />} right={right} tag={tag} tone={tone} open={open} onToggle={onToggle}>
      <GearStats it={it} s={s} compare={compare} />
      <FxList it={it} />
      <HeirInfo it={it} />
      {children && <div className="c-act">{children}</div>}
    </Card>
  );
}

// Nút khóa / mở khóa: đồ khóa không bị tự bán, bán đồ kém hay ký gửi
export function LockBtn({ it, act }) {
  return (
    <button className={'mini ghost' + (it.lock ? ' on' : '')} onClick={() => act(() => toggleLock(it))} title="Đồ khóa không bị tự bán, bán đồ kém hay ký gửi">
      <Ico i={UI_I.lock} />{it.lock ? 'Mở khóa' : 'Khóa'}
    </button>
  );
}

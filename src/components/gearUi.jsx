// Phần hiển thị trang bị dùng chung cho Túi, Chợ, Sàn, Lò rèn
import G from '../game/data.js';
import { gearName, gearStat, qualityIdx, fxText } from '../game/util.js';
import { gearDelta, toggleLock } from '../game/gear.js';
import { Tile, Card } from './ui.jsx';
import { Ico, SLOT_I, STAT_I, UI_I } from './icons.jsx';

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
// Phẩm của vật phẩm theo cấp/phẩm 1..9 → màu viền 0..4
export const gradeQ = (g) => (g >= 9 ? 4 : g >= 7 ? 3 : g >= 5 ? 2 : g >= 3 ? 1 : 0);

export function GearTile({ it, sel, onClick, foot, mark }) {
  return (
    <Tile icon={SLOT_I[it.sl]} q={qualityIdx(it)} badge={ROMAN[it.tier]} count={it.en ? `+${it.en}` : null} foot={foot} mark={mark}
      sel={sel} onClick={onClick} title={gearName(it)} />
  );
}

// Các chỉ số của một món
function statRows(it) {
  const st = gearStat(it);
  return [
    [UI_I.cp, `+${st.cp.toFixed(1)}`, 'Chiến lực'],
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
      {compare && Math.abs(d) >= 0.05 && <span className={'sv cmp ' + (d > 0 ? 'up' : 'down')}>{d > 0 ? '▲' : '▼'}{Math.abs(d).toFixed(1)}</span>}
      {it.fx?.map((f) => <span key={f.id} className="fx-chip">{fxText(it, f).n}</span>)}
    </>
  );
}

// Đầy đủ chỉ số khi mở thẻ
export function GearStats({ it, s, compare }) {
  const d = compare ? gearDelta(s, it) : 0;
  return (
    <div className="stat-line">
      <span className="muted small">{G.GEAR[it.sl].n} · {G.TIERS[it.tier]}{it.en ? ` · cường hóa +${it.en}` : ''}</span>
      {statRows(it).map(([i, v, t]) => <span key={t} className="sv"><Ico i={i} size={14} />{t} {v}</span>)}
      {compare && Math.abs(d) >= 0.05 && <span className={'sv cmp ' + (d > 0 ? 'up' : 'down')} title="So với đồ đang mặc">{d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)} chiến lực</span>}
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
        return <li key={f.id}><b>{t.n}</b><span className="num">{t.val}</span><small>{t.d}</small></li>;
      })}
    </ul>
  );
}

// Thẻ trang bị: tóm tắt hiện sẵn, mở ra xem đủ chỉ số, hiệu ứng và nút thao tác
export function GearCard({ it, s, open, onToggle, compare, right, tag, tone, children }) {
  return (
    <Card icon={SLOT_I[it.sl]} q={qualityIdx(it)} badge={ROMAN[it.tier]} count={it.en ? `+${it.en}` : null} fx={it.fx?.length > 0}
      title={it.lock ? <><span className="gear-lock" title="Đã khóa"><Ico i={UI_I.lock} size={13} /></span>{gearName(it)}</> : gearName(it)} sub={<GearSummary it={it} s={s} compare={compare} />} right={right} tag={tag} tone={tone} open={open} onToggle={onToggle}>
      <GearStats it={it} s={s} compare={compare} />
      <FxList it={it} />
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

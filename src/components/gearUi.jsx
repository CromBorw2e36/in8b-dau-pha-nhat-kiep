// Phần hiển thị trang bị dùng chung cho Túi, Chợ, Sàn, Lò rèn
import G from '../game/data.js';
import { gearName, gearStat, qualityIdx } from '../game/util.js';
import { gearDelta } from '../game/gear.js';
import { Tile } from './ui.jsx';
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

// Các dòng chỉ số của một món, kèm so sánh với đồ đang mặc
export function GearStats({ it, s, compare }) {
  const st = gearStat(it);
  const d = compare ? gearDelta(s, it) : 0;
  const rows = [
    [UI_I.cp, `+${st.cp.toFixed(1)}`, 'Chiến lực'],
    st.def ? [UI_I.lock, `−${Math.round(st.def * 100)}%`, 'Giảm thương tổn'] : null,
    st.qi ? [STAT_I.qi, `+${Math.round(st.qi * 100)}%`, 'Tốc độ tu luyện'] : null,
    st.bt ? [UI_I.up, `+${(st.bt * 100).toFixed(1)}%`, 'Tỷ lệ đột phá'] : null,
    st.dodge ? [UI_I.retire, `${Math.round(st.dodge * 100)}%`, 'Thoát hiểm'] : null,
  ].filter(Boolean);
  return (
    <div className="stat-line">
      <span className="muted small">{G.GEAR[it.sl].n} · {G.TIERS[it.tier]}</span>
      {rows.map(([i, v, t]) => <span key={t} className="sv" title={t}><Ico i={i} size={14} />{v}</span>)}
      {compare && Math.abs(d) >= 0.05 && <span className={'sv cmp ' + (d > 0 ? 'up' : 'down')} title="So với đồ đang mặc">{d > 0 ? '▲' : '▼'}{Math.abs(d).toFixed(1)}</span>}
    </div>
  );
}

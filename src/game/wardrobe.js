import G from './data.js';
import { unit, spend } from './util.js';

// Ngoại trang: đã mở khóa thì giữ qua mọi kiếp (lưu riêng trong trình duyệt), mỗi kiếp tự chọn mặc bộ nào
const KEY = 'dpnk_wardrobe';
const BASE = G.OUTFITS.filter((o) => !o.open && !o.buy).map((o) => o.id);

export function readWardrobe() {
  try { return [...new Set([...BASE, ...(JSON.parse(localStorage.getItem(KEY)) || [])])]; } catch { return BASE; }
}
function writeWardrobe(ids) { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch {} }
export const outfitOf = (s) => G.OUTFITS.find((o) => o.id === s?.outfit) || G.OUTFITS[s?.g === 'f' ? 1 : 0];
export const hasOutfit = (id) => readWardrobe().includes(id);

// Gọi sau mỗi lượt: trả về các bộ vừa mở khóa nhờ đạt điều kiện
export function checkOutfits(s) {
  const own = readWardrobe();
  const fresh = G.OUTFITS.filter((o) => o.open && !own.includes(o.id) && o.open(s));
  if (fresh.length) writeWardrobe([...own, ...fresh.map((o) => o.id)]);
  return fresh;
}
export const outfitPrice = (s, o) => Math.round(o.buy * unit(s));
export function buyOutfit(s, id) {
  const o = G.OUTFITS.find((x) => x.id === id);
  if (!o?.buy || hasOutfit(id)) return null;
  if (!spend(s, `May ${o.n.toLowerCase()}`, outfitPrice(s, o))) return 'Không đủ tiền.';
  writeWardrobe([...readWardrobe(), id]);
  s.outfit = id;
  return `Đã may ${o.n.toLowerCase()}.`;
}
export function wear(s, id) {
  if (!hasOutfit(id)) return null;
  s.outfit = id;
  return `Đã thay ${G.OUTFITS.find((o) => o.id === id).n.toLowerCase()}.`;
}
// Sao lưu mang theo tủ đồ
export const wardrobeData = () => readWardrobe();
export const restoreWardrobe = (ids) => { if (Array.isArray(ids)) writeWardrobe([...new Set([...readWardrobe(), ...ids])]); };

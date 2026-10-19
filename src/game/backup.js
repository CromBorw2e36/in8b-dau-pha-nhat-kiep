import { load, save, clearSave, readBook, writeBook, migrate } from './engine.js';
import { readLegacy } from './emperor.js';

// Mã sao lưu: "DPNK1." + 'z' (gzip) hoặc 'p' (không nén) + base64(JSON)
const PREFIX = 'DPNK1.';

async function gzip(bytes, mode) {
  const Stream = mode === 'c' ? globalThis.CompressionStream : globalThis.DecompressionStream;
  if (!Stream) return null;
  const out = new Blob([bytes]).stream().pipeThrough(new Stream('gzip'));
  return new Uint8Array(await new Response(out).arrayBuffer());
}
function toB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function fromB64(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function hasData() {
  return !!load() || readBook().length > 0;
}

export async function makeCode() {
  const data = { v: 1, at: Date.now(), save: load(), book: readBook(), legacy: readLegacy() };
  const raw = new TextEncoder().encode(JSON.stringify(data));
  const z = await gzip(raw, 'c');
  return PREFIX + (z ? 'z' : 'p') + toB64(z || raw);
}

export async function readCode(text) {
  const code = text.trim().replace(/\s+/g, '');
  if (!code.startsWith(PREFIX)) throw new Error('Đây không phải mã sao lưu của Đấu Phá · Nhất Kiếp.');
  let bytes;
  try { bytes = fromB64(code.slice(PREFIX.length + 1)); } catch { throw new Error('Mã bị thiếu hoặc sai ký tự. Hãy copy lại toàn bộ mã.'); }
  if (code[PREFIX.length] === 'z') {
    try { bytes = await gzip(bytes, 'd'); } catch { throw new Error('Mã bị hỏng, có thể bị copy thiếu.'); }
    if (!bytes) throw new Error('Trình duyệt này quá cũ, không giải nén được mã.');
  }
  let data;
  try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('Mã bị hỏng, có thể bị copy thiếu.'); }
  if (!data || data.v !== 1 || !Array.isArray(data.book)) throw new Error('Mã không đúng định dạng.');
  if (data.save && (typeof data.save.age !== 'number' || !data.save.name)) throw new Error('Dữ liệu kiếp đang chơi bị hỏng.');
  return data;
}

// Khôi phục: thay kiếp đang chơi, gộp Sổ luân hồi (không trùng lặp)
export function applyBackup(data) {
  if (data.save) save(migrate(data.save));
  else clearSave();
  const mine = readBook();
  const ids = new Set(mine.map((b) => b.id));
  const merged = [...mine, ...data.book.filter((b) => !ids.has(b.id))].sort((a, b) => b.id - a.id);
  writeBook(merged);
  // Ngọc giản truyền thừa chờ kiếp sau (mã cũ không có thì giữ nguyên của máy này)
  if (data.legacy) { try { localStorage.setItem('dpnk_legacy', JSON.stringify(data.legacy)); } catch {} }
}

export function describe(data) {
  const parts = [];
  if (data.save) parts.push(`kiếp đang chơi của ${data.save.name} (${data.save.age} tuổi)`);
  if (data.book.length) parts.push(`${data.book.length} kiếp trong Sổ luân hồi`);
  const when = new Date(data.at).toLocaleString('vi-VN');
  return `${parts.join(' và ') || 'không có dữ liệu'} · sao lưu lúc ${when}`;
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export function downloadText(text) {
  const d = new Date();
  const name = `dau-pha-saoluu-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.txt`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}

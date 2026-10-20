// Âm thanh tổng hợp bằng WebAudio: không cần tệp âm thanh, chơi offline được.
// Trình duyệt chỉ cho phát tiếng sau lần chạm đầu tiên, nên AudioContext được tạo muộn.
const KEY = 'dpnk_sfx';
let ac = null, master = null, noiseBuf = null;
let on = (() => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } })();

export const sfxOn = () => on;
export function setSfx(v) {
  on = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch {}
  if (v) play('tap');
}

function ctx() {
  if (ac) return ac;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ac = new AC();
  master = ac.createGain();
  master.gain.value = 0.42;
  const comp = ac.createDynamicsCompressor();
  master.connect(comp).connect(ac.destination);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ac;
}
// Mở khóa âm thanh ở lần chạm đầu tiên
if (typeof window !== 'undefined') {
  const unlock = () => { const c = ctx(); if (c?.state === 'suspended') c.resume(); };
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);
}

// Một nốt: dạng sóng, tần số (có thể trượt), bao âm
function tone({ f = 440, f2, type = 'sine', at = 0, a = 0.005, d = 0.3, v = 0.5, to = master }) {
  const t = ac.currentTime + at;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  o.connect(g).connect(to);
  o.start(t);
  o.stop(t + a + d + 0.05);
}
// Tiếng ồn qua bộ lọc (gió, va chạm, vỡ)
function noise({ at = 0, a = 0.005, d = 0.2, v = 0.4, type = 'bandpass', f = 1000, f2, q = 1 }) {
  const t = ac.currentTime + at;
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  const fl = ac.createBiquadFilter();
  fl.type = type;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
  fl.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  s.connect(fl).connect(g).connect(master);
  s.start(t, Math.random() * 0.5);
  s.stop(t + a + d + 0.05);
}
// Tiếng kim loại: nhiều họa âm không điều hòa
const metal = (f, d, v, at = 0) => [1, 2.76, 5.4, 8.93].forEach((m, i) => tone({ f: f * m, type: 'sine', at, a: 0.002, d: d / (1 + i * 0.6), v: v / (1 + i * 1.2) }));

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
const note = (base, i) => base * Math.pow(2, PENTA[i] / 12);

const SOUNDS = {
  tap: () => tone({ f: 720, f2: 520, d: 0.06, v: 0.12, type: 'triangle' }),
  pick: () => { tone({ f: 520, d: 0.08, v: 0.18, type: 'triangle' }); tone({ f: 780, at: 0.05, d: 0.12, v: 0.14, type: 'triangle' }); },
  open: () => noise({ f: 600, f2: 2400, d: 0.22, v: 0.12, q: 0.8 }),
  close: () => noise({ f: 2200, f2: 500, d: 0.18, v: 0.1, q: 0.8 }),
  stamp: () => { tone({ f: 140, f2: 55, d: 0.22, v: 0.7 }); noise({ type: 'lowpass', f: 900, d: 0.12, v: 0.4 }); },
  drum: () => { tone({ f: 90, f2: 42, d: 0.5, v: 0.9 }); noise({ type: 'lowpass', f: 300, d: 0.25, v: 0.35 }); },
  gong: () => { metal(110, 2.6, 0.5); tone({ f: 55, d: 2, v: 0.35 }); },
  bell: () => metal(520, 1.4, 0.32),
  hammer: () => { noise({ type: 'highpass', f: 2500, d: 0.05, v: 0.5 }); metal(880, 0.5, 0.3); tone({ f: 160, f2: 80, d: 0.12, v: 0.5 }); },
  clash: () => { noise({ f: 3000, d: 0.18, v: 0.55, q: 0.7 }); metal(640, 0.7, 0.35); tone({ f: 120, f2: 50, d: 0.2, v: 0.6 }); },
  hit: () => { noise({ type: 'lowpass', f: 1400, d: 0.1, v: 0.55 }); tone({ f: 200, f2: 70, d: 0.12, v: 0.5 }); },
  whoosh: () => noise({ f: 400, f2: 3000, a: 0.08, d: 0.3, v: 0.25, q: 1.4 }),
  shatter: () => { for (let i = 0; i < 6; i++) noise({ type: 'highpass', f: 2000 + i * 900, at: i * 0.03, d: 0.12, v: 0.35 }); tone({ f: 300, f2: 90, d: 0.4, v: 0.3, type: 'sawtooth' }); },
  coin: () => { tone({ f: 1320, d: 0.08, v: 0.15, type: 'square' }); tone({ f: 1760, at: 0.07, d: 0.18, v: 0.12, type: 'square' }); },
  up: () => [0, 2, 4, 5, 7].forEach((n, i) => tone({ f: note(392, n), at: i * 0.09, d: 0.5, v: 0.22, type: 'triangle' })),
  win: () => { [0, 2, 4, 7].forEach((n, i) => tone({ f: note(523, n), at: i * 0.07, d: 0.6, v: 0.2, type: 'triangle' })); metal(1046, 1, 0.12, 0.3); },
  fail: () => [4, 2, 0].forEach((n, i) => tone({ f: note(262, n), at: i * 0.12, d: 0.45, v: 0.22, type: 'sawtooth' })),
  charge: () => { noise({ f: 200, f2: 4000, a: 1.1, d: 0.2, v: 0.3, q: 2 }); tone({ f: 110, f2: 440, a: 1.1, d: 0.2, v: 0.25, type: 'sawtooth' }); },
  boom: () => { tone({ f: 70, f2: 30, d: 1.2, v: 1 }); noise({ type: 'lowpass', f: 600, f2: 80, d: 1, v: 0.6 }); metal(220, 2, 0.25, 0.05); },
  death: () => { metal(98, 3, 0.4); tone({ f: 49, d: 3, v: 0.4 }); },
  fuse: () => { tone({ f: 330, f2: 990, a: 0.4, d: 0.3, v: 0.2, type: 'triangle' }); tone({ f: 495, f2: 1485, a: 0.4, d: 0.3, v: 0.15, type: 'sine', at: 0.05 }); },
  dice: () => { for (let i = 0; i < 5; i++) noise({ type: 'bandpass', f: 1800 + Math.random() * 800, q: 4, at: i * 0.06, d: 0.04, v: 0.3 }); },
  roar: () => { noise({ type: 'lowpass', f: 500, f2: 200, a: 0.1, d: 0.8, v: 0.5 }); tone({ f: 90, f2: 60, a: 0.1, d: 0.8, v: 0.4, type: 'sawtooth' }); },
};

export function play(name) {
  if (!on) return;
  const c = ctx();
  if (!c || c.state !== 'running') { c?.resume?.(); if (c?.state !== 'running') return; }
  try { SOUNDS[name]?.(); } catch {}
}

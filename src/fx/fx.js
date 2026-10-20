// Lớp hiệu ứng hạt: một canvas phủ toàn màn hình, không chặn thao tác.
// Chỉ chạy vòng vẽ khi còn hạt sống; tắt hẳn khi máy bật «giảm chuyển động».
import { animate } from 'animejs';

export const calm = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

let cv = null, ctx = null, dpr = 1, raf = 0, last = 0;
const parts = [];
const rings = [];
const sprites = new Map();

// Bảng màu dùng chung
export const PAL = {
  gold: ['#f4d58f', '#d9ad5b', '#fff3df'],
  fire: ['#f2c063', '#e0602a', '#ea6a4e', '#fff3df'],
  qi: ['#f2c063', '#e0602a', '#8a2418'],
  jade: ['#9be0c0', '#62b291', '#e8fff4'],
  soul: ['#d6cbff', '#aa96f4', '#ffffff'],
  ink: ['#0c0806', '#1b130e', '#2f2118'],
  red: ['#ea6a4e', '#c9432f', '#ffd2c4'],
  white: ['#ffffff', '#fff3df'],
};
// Màu theo phẩm chất trang bị 0..4
export const Q_PAL = [['#d8ccb4', '#a9997e'], ['#9be0c0', '#6cc39b'], ['#a8dcf6', '#5fb7e2'], ['#d6c6ff', '#b79bff'], ['#ffe6a3', '#f5c55e', '#fff3df']];

export function mountFx(canvas) {
  cv = canvas;
  ctx = cv.getContext('2d');
  resize();
  addEventListener('resize', resize);
  return () => { removeEventListener('resize', resize); cancelAnimationFrame(raf); raf = 0; cv = ctx = null; parts.length = rings.length = 0; };
}
function resize() {
  if (!cv) return;
  dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
}

// Hạt sáng vẽ sẵn theo màu: drawImage nhanh hơn nhiều so với shadowBlur
function sprite(color) {
  let s = sprites.get(color);
  if (s) return s;
  s = document.createElement('canvas');
  s.width = s.height = 32;
  const g = s.getContext('2d');
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(0.18, color);
  gr.addColorStop(0.5, color + '55');
  gr.addColorStop(1, color + '00');
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  sprites.set(color, s);
  return s;
}

const pickC = (c) => (Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c);
const rnd = (a, b) => a + Math.random() * (b - a);

function start() {
  if (raf || !ctx) return;
  last = performance.now();
  raf = requestAnimationFrame(loop);
}

function loop(t) {
  // Khung đầu: dấu thời gian của rAF có thể nhỏ hơn performance.now() lúc gọi start()
  const dt = Math.max(0, Math.min(48, t - last)) / 16.67;
  last = t;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.delay > 0) { p.delay -= dt * 16.67; continue; }
    p.age += dt * 16.67;
    if (p.age >= p.life) { parts.splice(i, 1); continue; }
    const k = p.age / p.life;
    if (p.tx != null) {
      // Xoáy: quay quanh tâm và hút dần vào giữa
      p.ang += p.spin * dt;
      p.rad *= Math.pow(p.pull, dt);
      p.x = p.tx + Math.cos(p.ang) * p.rad;
      p.y = p.ty + Math.sin(p.ang) * p.rad * p.flat;
    } else {
      p.vx *= Math.pow(p.drag, dt);
      p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
      p.x += p.vx * dt + Math.sin((p.age + p.seed) / 260) * p.wob * dt;
      p.y += p.vy * dt;
    }
    const a = p.fade === 'in-out' ? Math.sin(k * Math.PI) : 1 - k * k;
    if (p.kind === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = a;
      ctx.lineWidth = p.size * (1 - k * 0.6);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4);
      ctx.stroke();
    } else if (p.kind === 'ink') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.6 + k * 1.6), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      const sz = p.size * 4 * (p.grow ? 0.4 + k * p.grow : 1);
      ctx.drawImage(sprite(p.color), p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    if (r.delay > 0) { r.delay -= dt * 16.67; continue; }
    r.age += dt * 16.67;
    if (r.age >= r.life) { rings.splice(i, 1); continue; }
    const k = r.age / r.life;
    const e = 1 - Math.pow(1 - k, 3);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (1 - k) * r.alpha;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width * (1 - k) + 0.5;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.from + (r.to - r.from) * e, (r.from + (r.to - r.from) * e) * r.flat, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (parts.length || rings.length) raf = requestAnimationFrame(loop);
  else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

function add(p) {
  if (parts.length > 900) return;
  parts.push({ age: 0, delay: 0, drag: 0.96, g: 0, wob: 0, seed: Math.random() * 1000, size: 3, kind: 'glow', fade: 'out', ...p });
}

// Tâm của một phần tử trên màn hình (hoặc giữa màn hình)
export function at(el) {
  if (!el?.getBoundingClientRect) return { x: innerWidth / 2, y: innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
const posOf = (p) => (p && p.getBoundingClientRect ? at(p) : p || at());

// Nổ tung: hạt bắn ra mọi hướng
export function burst(p, { n = 40, colors = PAL.gold, speed = 6, life = 900, size = 3, g = 0.08, kind = 'glow', spread = Math.PI * 2, dir = -Math.PI / 2, delay = 0 } = {}) {
  if (calm() || !ctx) return;
  const { x, y } = posOf(p);
  for (let i = 0; i < n; i++) {
    const a = dir + (Math.random() - 0.5) * spread;
    const v = speed * (0.35 + Math.random() * 0.9);
    add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * rnd(0.6, 1.2), size: size * rnd(0.6, 1.4), color: pickC(colors), g, kind, delay });
  }
  start();
}

// Tia lửa rèn: bắn lên thành hình quạt, rơi xuống vì trọng lực
export function sparks(p, opts = {}) {
  burst(p, { n: 26, colors: PAL.fire, speed: 9, life: 650, size: 2, g: 0.32, kind: 'spark', spread: 2.2, ...opts });
}

// Xoáy đấu khí: hạt xuất hiện trên vòng lớn rồi cuộn vào tâm
export function vortex(p, { n = 90, colors = PAL.qi, radius = 220, life = 1400, size = 3, flat = 0.55 } = {}) {
  if (calm() || !ctx) return;
  const { x, y } = posOf(p);
  for (let i = 0; i < n; i++) {
    add({
      x, y, tx: x, ty: y, ang: Math.random() * Math.PI * 2, rad: radius * rnd(0.6, 1.2), spin: rnd(0.05, 0.11), pull: rnd(0.955, 0.975), flat,
      life: life * rnd(0.6, 1), size: size * rnd(0.6, 1.4), color: pickC(colors), delay: Math.random() * life * 0.35, fade: 'in-out',
    });
  }
  start();
}

// Hạt bay lên chậm (than hồng, linh khí), rải theo bề ngang
export function rise(p, { n = 24, w = 200, colors = PAL.fire, life = 2600, size = 2.4, speed = 1.2 } = {}) {
  if (calm() || !ctx) return;
  const { x, y } = posOf(p);
  for (let i = 0; i < n; i++) {
    add({ x: x + rnd(-w / 2, w / 2), y: y + rnd(-10, 10), vx: rnd(-0.3, 0.3), vy: -speed * rnd(0.5, 1.3), drag: 0.995, wob: 0.35, life: life * rnd(0.6, 1.2), size: size * rnd(0.6, 1.3), color: pickC(colors), delay: Math.random() * life * 0.6, fade: 'in-out' });
  }
  start();
}

// Giọt mực loang (dùng ở màn mở đầu)
export function ink(p, { n = 26, spread = 120, colors = PAL.ink, life = 1600, size = 14 } = {}) {
  if (calm() || !ctx) return;
  const { x, y } = posOf(p);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = rnd(0.2, 1) * spread / 60;
    add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 0.94, life: life * rnd(0.7, 1.1), size: size * rnd(0.5, 1.4), color: pickC(colors), kind: 'ink' });
  }
  start();
}

// Sóng xung kích: vòng tròn loang rộng
export function ring(p, { color = '#f4d58f', from = 10, to = 260, life = 900, width = 5, n = 1, gap = 140, flat = 1, alpha = 0.9 } = {}) {
  if (calm() || !ctx) return;
  const { x, y } = posOf(p);
  for (let i = 0; i < n; i++) rings.push({ x, y, color, from, to, life, width, flat, alpha, age: 0, delay: i * gap });
  start();
}

// Rung một phần tử (mặc định cả ứng dụng)
export function shake(el, power = 8, duration = 420) {
  el ||= document.querySelector('.app');
  if (!el || calm()) return;
  const k = [0, -power, power * 0.8, -power * 0.6, power * 0.4, -power * 0.2, 0];
  // Xóa transform khi xong: transform còn sót lại làm hỏng vị trí các bảng position: fixed bên trong
  animate(el, { translateX: k, translateY: k.map((v) => v * 0.4), duration, ease: 'linear', onComplete: () => { el.style.transform = ''; } });
}

// Lóe sáng toàn màn hình
export function flash(color = '#fff3df', peak = 0.85, duration = 520) {
  if (calm()) return;
  const d = document.createElement('div');
  d.className = 'fx-flash';
  d.style.background = color;
  document.body.appendChild(d);
  animate(d, { opacity: [peak, 0], duration, ease: 'outQuad', onComplete: () => d.remove() });
}

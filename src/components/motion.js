import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { fmtGold } from '../game/util.js';
import { calm } from '../fx/fx.js';

// Mọi chuyển động tắt khi người chơi bật «giảm chuyển động» trong hệ điều hành
export { calm };

// Nhịp chuẩn (ms) và đường cong dùng chung cho cả game
export const T = { fast: 180, base: 360, slow: 700, grand: 1400 };
export const EASE = { out: [0.2, 0.9, 0.3, 1], back: [0.34, 1.56, 0.64, 1], ink: [0.65, 0, 0.35, 1] };
// Biến thể cho motion/react: hiện lần lượt từ dưới lên
export const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.42, ease: EASE.out } }),
};

// Con dấu son đóng xuống giấy: rơi từ trên, nảy nhẹ, giấy rung theo
export function stamp(el, shakeEl) {
  if (!el || calm()) return;
  animate(el, { scale: [2.4, 1], rotate: [-16, -4], opacity: [0, 1], duration: 520, ease: 'outBack(1.6)' });
  if (shakeEl) animate(shakeEl, { translateY: [0, 3, -1, 0], duration: 260, delay: 360, ease: 'outQuad' });
}

// Đột phá: các vòng mực loang ra từ con dấu
export function burst(rings) {
  if (!rings?.length || calm()) return;
  animate(rings, { scale: [0.2, 3.2], opacity: [0.55, 0], duration: 1300, delay: stagger(180), ease: 'outExpo' });
}

// Danh sách lựa chọn hiện lần lượt
export function cascade(els, start = 120) {
  if (!els?.length || calm()) return;
  animate(els, { translateY: [14, 0], opacity: [0, 1], duration: 420, delay: stagger(70, { start }), ease: 'outQuad' });
}

export function pulse(el, k = 1.18) {
  if (!el || calm()) return;
  animate(el, { scale: [1, k, 1], duration: 480, ease: 'outQuad' });
}

// Lắc ngang (thất bại, bị đánh)
export function wobble(el, power = 7) {
  if (!el || calm()) return;
  animate(el, { translateX: [0, -power, power, -power * 0.6, power * 0.4, 0], duration: 420, ease: 'linear' });
}

// Nảy lên khi được chọn
export function pop(el) {
  if (!el || calm()) return;
  animate(el, { scale: [0.6, 1.08, 1], opacity: [0, 1], duration: 520, ease: 'outBack(1.8)' });
}

// Vẽ nét bút: các path SVG hiện dần theo nét
export function drawStroke(paths, { duration = 1400, delay = 0, step = 120 } = {}) {
  if (!paths?.length) return;
  paths.forEach((p) => { const L = p.getTotalLength?.() || 600; p.style.strokeDasharray = L; p.style.strokeDashoffset = calm() ? 0 : L; });
  if (calm()) return;
  animate(paths, { strokeDashoffset: 0, duration, delay: stagger(step, { start: delay }), ease: 'inOutSine' });
}

// Một con số chạy đến giá trị đích
export function countTo(el, from, to, { duration = 700, fmt = (v) => Math.round(v) } = {}) {
  if (!el) return;
  if (calm() || from === to) { el.textContent = fmt(to); return; }
  const o = { v: from };
  return animate(o, { v: to, duration, ease: 'outCubic', onUpdate: () => { el.textContent = fmt(o.v); } });
}

// Số kim tệ chạy từ giá trị cũ tới giá trị mới
export function useCountUp(value, fmt = fmtGold) {
  const ref = useRef(null);
  const prev = useRef(value);
  useEffect(() => {
    const el = ref.current;
    const from = prev.current;
    prev.current = value;
    if (!el) return;
    if (calm() || from === value || Math.abs(value - from) < 1) { el.textContent = fmt(value); return; }
    const a = countTo(el, from, value, { fmt });
    if (value > from) pulse(el);
    return () => a?.pause();
  }, [value]);
  return ref;
}

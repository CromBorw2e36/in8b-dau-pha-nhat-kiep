import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { fmtGold } from '../game/util.js';

// Mọi chuyển động tắt khi người chơi bật «giảm chuyển động» trong hệ điều hành
const calm = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

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
export function cascade(els) {
  if (!els?.length || calm()) return;
  animate(els, { translateY: [10, 0], opacity: [0, 1], duration: 380, delay: stagger(60, { start: 120 }), ease: 'outQuad' });
}

export function pulse(el) {
  if (!el || calm()) return;
  animate(el, { scale: [1, 1.18, 1], duration: 480, ease: 'outQuad' });
}

// Số kim tệ chạy từ giá trị cũ tới giá trị mới
export function useCountUp(value) {
  const ref = useRef(null);
  const prev = useRef(value);
  useEffect(() => {
    const el = ref.current;
    const from = prev.current;
    prev.current = value;
    if (!el) return;
    if (calm() || from === value || Math.abs(value - from) < 1) { el.textContent = fmtGold(value); return; }
    const o = { v: from };
    const a = animate(o, { v: value, duration: 700, ease: 'outCubic', onUpdate: () => { el.textContent = fmtGold(o.v); } });
    if (value > from) pulse(el);
    return () => a.pause();
  }, [value]);
  return ref;
}

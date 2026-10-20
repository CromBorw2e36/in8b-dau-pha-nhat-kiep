import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { calm } from './motion.js';
import { ink, ring, rise, burst, flash, PAL } from '../fx/fx.js';
import { play } from '../fx/sfx.js';

const SEEN = 'dpnk_intro';
// Mỗi phiên chỉ chiếu một lần; máy bật giảm chuyển động thì bỏ qua
export const introDue = () => { try { return !calm() && !sessionStorage.getItem(SEEN); } catch { return false; } };

// Màn mở đầu: giọt mực rơi, núi non hiện lên, tên game viết bằng nét bút, con dấu đóng xuống
export default function Intro({ onDone }) {
  const root = useRef(null);
  const drop = useRef(null);
  const title = useRef(null);
  const seal = useRef(null);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    try { sessionStorage.setItem(SEEN, '1'); } catch {}
    animate(root.current, { opacity: [1, 0], duration: 600, ease: 'inQuad', onComplete: onDone });
  };

  useEffect(() => {
    const el = root.current;
    const q = (s) => el.querySelectorAll(s);
    const ids = [];
    const at = (ms, fn) => ids.push(setTimeout(fn, ms));
    const mid = () => ({ x: innerWidth / 2, y: innerHeight * 0.42 });

    // 1. Giọt mực rơi xuống giữa trang
    animate(drop.current, { translateY: [-innerHeight * 0.5, 0], scale: [0.6, 1], duration: 650, ease: 'inQuad' });
    at(650, () => {
      drop.current.style.opacity = 0;
      play('drum');
      ink(mid(), { n: 40, spread: 260, size: 22, life: 2200 });
      ring(mid(), { color: '#d9ad5b', to: Math.max(innerWidth, innerHeight) * 0.7, life: 1400, width: 3, n: 2, gap: 220 });
      animate(q('.in-wash'), { scale: [0, 1], opacity: [0, 1], duration: 1600, ease: 'outExpo' });
    });
    // 2. Núi non hiện dần từng lớp
    at(800, () => animate(q('.in-mt'), { translateY: ['40%', '0%'], opacity: [0, 1], duration: 1500, delay: stagger(180), ease: 'outCubic' }));
    // 3. Tên game: viết nét rồi đổ màu vàng
    at(1200, () => {
      const t = title.current.querySelectorAll('text');
      animate(t, { strokeDashoffset: [900, 0], duration: 1500, delay: stagger(220), ease: 'inOutSine' });
      play('whoosh');
    });
    at(2500, () => {
      animate(title.current.querySelectorAll('text'), { fillOpacity: [0, 1], duration: 700, ease: 'outQuad' });
      play('gong');
      rise({ x: innerWidth / 2, y: innerHeight * 0.75 }, { n: 60, w: innerWidth * 0.8, life: 3800, colors: PAL.fire });
    });
    // 4. Con dấu «Nhất Kiếp» đóng xuống
    at(3200, () => {
      animate(seal.current, { scale: [2.6, 1], rotate: [-18, -5], opacity: [0, 1], duration: 520, ease: 'outBack(1.6)' });
      at(330, () => { play('stamp'); burst(seal.current, { n: 30, colors: PAL.red, speed: 5, g: 0.05 }); });
    });
    at(3800, () => animate(q('.in-tag'), { opacity: [0, 1], translateY: [8, 0], duration: 700, ease: 'outQuad' }));
    at(4400, () => animate(q('.in-skip'), { opacity: [0, 0.8], duration: 500 }));
    at(5600, () => { flash('#f4d58f', 0.35, 700); finish(); });
    return () => ids.forEach(clearTimeout);
  }, []);

  return (
    <div className="intro" ref={root} onClick={finish} role="button" tabIndex={0} aria-label="Bỏ qua phần mở đầu" onKeyDown={finish}>
      <div className="in-wash" />
      <svg className="in-mts" viewBox="0 0 800 300" preserveAspectRatio="none" aria-hidden="true">
        <path className="in-mt" d="M0 190 C60 130 120 70 180 110 S260 40 330 95 S410 160 470 120 S560 30 630 90 S720 140 800 100 V300 H0Z" fill="#d9ad5b" fillOpacity=".07" />
        <path className="in-mt" d="M0 230 C70 180 130 150 200 185 S300 110 370 165 S470 210 540 170 S660 120 720 170 S780 200 800 185 V300 H0Z" fill="#d9ad5b" fillOpacity=".1" />
        <path className="in-mt" d="M0 265 C90 235 170 225 250 248 S390 220 470 245 S610 265 690 240 S770 250 800 248 V300 H0Z" fill="#000" fillOpacity=".65" />
      </svg>
      <div className="in-center">
        <span className="in-drop" ref={drop} />
        <svg className="in-title" ref={title} viewBox="0 0 600 150" aria-label="Đấu Phá">
          <defs>
            <linearGradient id="in-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff3df" />
              <stop offset=".45" stopColor="#f4d58f" />
              <stop offset="1" stopColor="#a77a28" />
            </linearGradient>
          </defs>
          <text x="150" y="112" textAnchor="middle">Đấu</text>
          <text x="420" y="112" textAnchor="middle">Phá</text>
        </svg>
        <span className="in-seal seal seal-red seal-xl" ref={seal}>Nhất Kiếp</span>
        <p className="in-tag">Một kiếp người · Vạn cổ lưu danh</p>
      </div>
      <span className="in-skip">Chạm để bỏ qua</span>
    </div>
  );
}

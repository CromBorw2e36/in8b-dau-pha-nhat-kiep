import { useEffect, useRef } from 'react';

// Hiệu ứng Linh Khí phiêu miểu (Atmospheric Cultivation Qi Wisps)
// Chạy mượt mà 60fps, tự dừng khi tab ẩn, tiêu thụ tài nguyên cực thấp.
export default function QiAtmosphere({ realm = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Kiểm tra prefers-reduced-motion
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = canvas.getContext('2d');
    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Bảng màu linh khí theo cảnh giới
    const colors = realm >= 10
      ? ['#ffd700', '#ffaa00', '#ffffff', '#ff7700']
      : realm >= 7
      ? ['#b366ff', '#805ad5', '#ffd700', '#e9d8fd']
      : realm >= 4
      ? ['#4da6ff', '#63b3ed', '#90cdf4', '#ffffff']
      : ['#50c878', '#68d391', '#d9ad5b', '#e2e8f0'];

    // Tạo mảng linh khí (36 hạt nhẹ nhàng)
    const particleCount = 36;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * (w || 800),
      y: Math.random() * (h || 600),
      r: 1 + Math.random() * 2.2,
      vy: -(0.25 + Math.random() * 0.45),
      vx: (Math.random() - 0.5) * 0.3,
      alpha: 0.15 + Math.random() * 0.45,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    }));

    // Tạo mảng lá vàng phiêu dật (16 lá thu phong cổ điển chuẩn Thiện Nữ / Tiên Hiệp)
    const leafColors = ['#f59e0b', '#d97706', '#fbbf24', '#b45309', '#fef08a'];
    const leafCount = 16;
    const leaves = Array.from({ length: leafCount }, () => ({
      x: Math.random() * (w || 800),
      y: Math.random() * (h || 600),
      size: 5 + Math.random() * 6.5,
      vy: 0.45 + Math.random() * 0.65,
      vx: 0.35 + Math.random() * 0.55,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.02 + Math.random() * 0.025,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 0.03 + Math.random() * 0.04,
      alpha: 0.35 + Math.random() * 0.45,
      color: leafColors[Math.floor(Math.random() * leafColors.length)],
    }));

    let lastTime = performance.now();

    const loop = (time) => {
      // Bỏ qua nếu tab không active
      if (document.hidden) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      ctx.clearRect(0, 0, w, h);

      // 1. Vẽ hạt linh khí bốc lên
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];

        p.y += p.vy * (dt / 16);
        p.x += p.vx * (dt / 16);
        p.pulse += p.pulseSpeed;

        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;

        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Vẽ lá vàng thu phong rơi lượn
      for (let i = 0; i < leafCount; i++) {
        const lf = leaves[i];
        lf.sway += lf.swaySpeed;
        lf.flip += lf.flipSpeed;
        lf.angle += lf.rotSpeed;

        lf.y += lf.vy * (dt / 16);
        lf.x += (lf.vx + Math.sin(lf.sway) * 0.75) * (dt / 16);

        if (lf.y > h + 20) {
          lf.y = -20;
          lf.x = Math.random() * (w * 1.2) - (w * 0.2);
        }
        if (lf.x > w + 20) {
          lf.x = -20;
        }

        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.angle);
        ctx.scale(Math.cos(lf.flip), 1);
        ctx.globalAlpha = lf.alpha;
        ctx.fillStyle = lf.color;
        ctx.shadowColor = '#d97706';
        ctx.shadowBlur = 4;

        // Hình dáng lá vàng ginkgo / lá phong uốn lượn
        ctx.beginPath();
        ctx.moveTo(0, -lf.size);
        ctx.bezierCurveTo(lf.size * 0.85, -lf.size * 0.4, lf.size * 0.9, lf.size * 0.6, 0, lf.size);
        ctx.bezierCurveTo(-lf.size * 0.9, lf.size * 0.6, -lf.size * 0.85, -lf.size * 0.4, 0, -lf.size);
        ctx.fill();

        // Gân lá kim tuyến
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = lf.alpha * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -lf.size * 0.7);
        ctx.lineTo(0, lf.size * 0.7);
        ctx.stroke();

        ctx.restore();
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [realm]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: -1,
        opacity: 0.75,
      }}
      aria-hidden="true"
    />
  );
}

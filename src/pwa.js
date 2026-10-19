import { useEffect, useState } from 'react';

// Bắt sự kiện "có thể cài đặt" càng sớm càng tốt (trước khi React render)
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', () => { deferred = null; notify(); });

  // Chỉ bật service worker ở bản build, tránh cache làm rối lúc phát triển
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

// 'prompt': có nút cài · 'ios': hướng dẫn thủ công trên Safari · null: đã cài hoặc không hỗ trợ
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  if (isStandalone()) return { mode: null };
  if (deferred) {
    return {
      mode: 'prompt',
      install: async () => {
        const e = deferred;
        deferred = null;
        e.prompt();
        await e.userChoice.catch(() => {});
        notify();
      },
    };
  }
  if (isIOS()) return { mode: 'ios' };
  return { mode: null };
}

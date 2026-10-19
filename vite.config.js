import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  // Bộ icon Game Icons có đường vẽ chi tiết (~1,5 kB mỗi icon), bundle khoảng 570 kB (200 kB nén) là bình thường
  build: { chunkSizeWarningLimit: 700 },
});

---
name: dpnk-motion
description: Quy ước chuyển động, hiệu ứng hạt và âm thanh của Đấu Phá · Nhất Kiếp. Dùng khi thêm hoặc sửa animation, cảnh diễn, hiệu ứng, âm thanh trong src/components hoặc src/fx.
---

# Chuyển động trong Đấu Phá · Nhất Kiếp

Phong cách: sơn mài, mực tàu, son đỏ, vàng thếp. Chuyển động có chủ đích: mỗi hiệu ứng báo một điều đã xảy ra (đóng dấu = quyết định, tia lửa = rèn, xoáy = tụ khí, nứt = thất bại). Không thêm chuyển động trang trí lặp vô nghĩa.

## Chọn công cụ

| Việc | Dùng |
|---|---|
| Component xuất hiện / biến mất, chuyển tab, trang bị bay vào ô (`layoutId`) | `motion/react` (`motion.div`, `AnimatePresence`, `LayoutGroup`) |
| Chuỗi nhiều bước có hẹn giờ, lắc, nảy, vẽ nét SVG, số chạy | `anime.js` qua các hàm trong `src/components/motion.js` (`stamp`, `pulse`, `wobble`, `pop`, `cascade`, `drawStroke`, `countTo`, `useCountUp`) |
| Hạt sáng, tia lửa, xoáy, sóng xung kích, mực loang, rung màn hình, lóe sáng | `src/fx/fx.js`: `burst`, `sparks`, `vortex`, `rise`, `ink`, `ring`, `shake`, `flash` (nhận phần tử DOM hoặc `{x, y}`) |
| Âm thanh | `play(name)` trong `src/fx/sfx.js` |
| Cảnh toàn màn hình sau một lựa chọn | `src/components/Stage.jsx` (`Clash`, `Fate`, `Break`) |
| Nền 3D (trăng, sao, núi, lá vàng, linh khí) | `src/fx/MoonScene.jsx` dùng three.js, tải lười bằng `import('three')`. Khoảnh khắc lớn (lên cảnh giới) dùng `animate()` của anime.js trên object `fx` (`glow`, `surge`) mà vòng lặp three đọc mỗi khung hình. Không WebGL thì dùng `QiAtmosphere.jsx`. Nằm ở `z-index: -1`, ngoài `.app`; màn chơi thêm lớp `dim`. |

## Quy tắc

- **Giảm chuyển động**: mọi hàm trong `motion.js` và `fx.js` đã tự kiểm tra `calm()`. Code mới viết tay bằng `animate()` phải kiểm tra `calm()` trước. Cảnh diễn phải kết thúc ngay khi `calm()` (xem `useScript` trong `Stage.jsx`).
- **Chạm để bỏ qua**: mọi cảnh dài hơn 1 giây phải có cách bỏ qua.
- **Không để lại transform** trên phần tử chứa bảng `position: fixed` (`.app`, `.screen`, `.scr`): transform hay filter còn sót sẽ làm bảng lệch chỗ. `shake()` đã tự xóa; khi dùng motion thì đặt `transitionEnd`.
- **Nhịp**: dùng `T` và `EASE` trong `motion.js` (nhanh 180ms, thường 360ms, chậm 700ms, trang trọng 1400ms). Cảnh diễn tối đa khoảng 3,5 giây.
- **Màu**: lấy từ `PAL` (gold, fire, qi, jade, soul, ink, red) và `Q_PAL[phẩm chất]` trong `fx.js` để hiệu ứng khớp màu phẩm chất trang bị.
- **Âm thanh** có sẵn: tap, pick, open, close, stamp, drum, gong, bell, hammer, clash, hit, whoosh, shatter, coin, up, win, fail, charge, boom, death, fuse, dice, roar. Thêm tiếng mới thì tổng hợp bằng `tone` / `noise` / `metal` trong `SOUNDS`, không thêm tệp âm thanh (game phải chạy offline). Thao tác lặp nhanh (đập tự động) dùng tiếng nhẹ (`tap`, `hit`).
- **Lựa chọn giao chiến**: lựa chọn có `roll` và là một trận đánh thì thêm `fight: 1` trong `events.js` để diễn cảnh `Clash`; `roll` không có `fight` sẽ diễn `Fate`; sự kiện `breakthrough` diễn `Break`.

## Kiểm tra

- `npm run build` và `npm run sim` (giả lập 300 kiếp, phải báo `lỗi runtime: 0`).
- Mở `http://localhost:5173/#demo` (màn chơi), `#demo/bag/gear|beast|look`, `#demo/forge/enh|refine|fuse|craft`, `#demo/event/duel` (giao chiến), `#demo/event/breakthrough` (đột phá), `#demo/event/treasure` (thiên mệnh). Xem ở cả khổ 390px và 1440px.

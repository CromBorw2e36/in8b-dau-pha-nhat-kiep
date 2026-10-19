# Đấu Phá · Nhất Kiếp

> Sống trọn một kiếp tu luyện trên Đấu Khí Đại Lục: từ phế vật bị người đời khinh rẻ đến Đấu Đế vạn cổ lưu danh.

Một game mô phỏng cuộc đời (life-sim) dạng chữ, chơi trên trình duyệt. Thể loại tương tự *BitLife* hay *Nhân Sinh Trùng Khai Mô Phỏng Khí*, lấy bối cảnh tiểu thuyết **«Đấu Phá Thương Khung»** của Thiên Tằm Thổ Đậu. Mỗi lần chơi là một kiếp người, sinh ra ngẫu nhiên, lớn lên, tu luyện, gặp kỳ ngộ, kết đạo lữ, khai tông lập phái, chinh phạt đại lục rồi chết đi. Mỗi kiếp được ghi vào *Sổ luân hồi*.

- Không cần tài khoản hay máy chủ. Tiến trình lưu ngay trong trình duyệt.
- Cài được lên điện thoại như ứng dụng (PWA) và chơi offline được.
- Giao diện kiểu thủy mặc (giấy xuyến, mực tàu, con dấu son), có chế độ sáng và tối theo hệ thống.

> **Lưu ý bản quyền:** đây là *fan game phi thương mại*. Tên nhân vật, địa danh và cảnh giới thuộc về tác phẩm gốc. Mọi con số và luật chơi là tự đặt.

---

## Mục lục

1. [Chạy thử](#chạy-thử)
2. [Cách chơi](#cách-chơi)
3. [Hệ thống trong game](#hệ-thống-trong-game)
   - [Cảnh giới & thời gian](#cảnh-giới--thời-gian)
   - [Tư chất, xuất thân, thiên phú](#tư-chất-xuất-thân-thiên-phú)
   - [Chỉ số](#chỉ-số)
   - [Chuyên tâm](#chuyên-tâm)
   - [Đột phá](#đột-phá)
   - [Kinh tế: kim tệ, chợ, sàn giao dịch](#kinh-tế-kim-tệ-chợ-sàn-giao-dịch)
   - [Trang bị](#trang-bị)
   - [Lò rèn (Luyện Khí Phòng)](#lò-rèn-luyện-khí-phòng)
   - [Sản nghiệp](#sản-nghiệp)
   - [Tông môn](#tông-môn)
   - [Quân đội](#quân-đội)
   - [Bản đồ & chinh phạt lãnh địa](#bản-đồ--chinh-phạt-lãnh-địa)
   - [Sự kiện & khoảnh khắc](#sự-kiện--khoảnh-khắc)
   - [Kết thúc một kiếp](#kết-thúc-một-kiếp)
4. [Lưu trữ & sao lưu](#lưu-trữ--sao-lưu)
5. [Phím tắt](#phím-tắt)
6. [Cấu trúc mã nguồn](#cấu-trúc-mã-nguồn)
7. [Chỉnh cân bằng game](#chỉnh-cân-bằng-game)
8. [Thêm sự kiện mới](#thêm-sự-kiện-mới)
9. [Triển khai (deploy)](#triển-khai-deploy)

---

## Chạy thử

Cần **Node.js 20+**.

```bash
npm install        # cài thư viện
npm run dev        # chạy bản phát triển tại http://localhost:5173 (mở được từ điện thoại cùng mạng LAN)
npm run build      # đóng gói ra thư mục dist/
npm run preview    # xem thử bản đã đóng gói (có service worker / chơi offline)
npm run sim        # giả lập 300 kiếp để kiểm tra lỗi & cân bằng (xem phần dưới)
```

Công nghệ: **React 19** + **Vite** + **anime.js** (vài chuyển động có chủ đích: con dấu đóng xuống, vòng mực khi đột phá, số kim tệ chạy; tự tắt khi máy bật *giảm chuyển động*). Không dùng thư viện UI hay state manager nào khác. Toàn bộ logic game là JavaScript thuần trong `src/game/`.

Khi chạy `npm run dev`, mở `http://localhost:5173/#demo` để vào thẳng một nhân vật hậu kỳ dựng sẵn (xem giao diện nhanh). Thêm đường dẫn để mở sẵn một bảng: `#demo/forge/craft`, `#demo/market/ex`, `#demo/sect/map`, `#demo/bag/gear`, hoặc một sự kiện: `#demo/event/hon_invasion`. Chế độ này không có trong bản build.

---

## Cách chơi

1. **Nhập thế**: game ngẫu nhiên xuất thân, tư chất, thuộc tính và thiên phú. Không ưng thì bấm **Đầu thai lại**.
2. **Thơ ấu (0–6 tuổi)**: thời gian tự trôi, đôi khi có sự kiện nhỏ.
3. **6 tuổi**: lễ trắc nghiệm đấu khí, bạn bước vào con đường tu luyện và chọn **chuyên tâm** (làm gì trong thời gian tới).
4. Thời gian tự trôi theo **lượt**. Mỗi lượt có thể xảy ra:
   - tu vi tăng, thu chi kim tệ;
   - **khoảnh khắc** (ghi lại trong nhật ký, không cần chọn);
   - **sự kiện** (game dừng lại chờ bạn chọn, có thể may rủi hoặc nguy hiểm tính mạng).
5. Khi đấu khí đầy và đạt bậc cuối, bạn gặp **bình cảnh** và phải quyết định có xung kích cảnh giới mới hay không.
6. Hết thọ nguyên hoặc tử nạn thì kiếp này khép lại (thành Đấu Đế thì bất tử, tự chọn lúc quy ẩn). Bạn xem bia ký, biểu đồ cảnh giới theo tuổi, rồi **luân hồi** sang kiếp mới.

**Thanh điều khiển dưới cùng:**

| Nút | Chức năng |
|---|---|
| ❚❚ / ▶ | Tạm dừng / tiếp tục |
| *Đang chuyên tâm* | Đổi việc đang làm |
| 1× / 1.5× / 3× / 6× | Tốc độ thời gian (được ghi nhớ) |
| **Túi đồ** | Vật phẩm, trang bị đang mặc, kho binh khí |
| **Lò rèn** | Chế tạo, cường hóa, xưởng binh khí quân dụng và hợp đồng |
| **Chợ & sàn** | Chợ, Binh Khí Phường, Sàn giao dịch, sản nghiệp, sổ thu chi |
| **Tông môn** | Công trình, quân đội, bản đồ chinh phạt |

Chấm đỏ trên nút báo có việc cần xem: hàng ký gửi vừa bán được, hợp đồng giao được, vùng đất dễ chiếm.

Trên máy tính (màn hình rộng từ 960px), game chia hai cột: thông tin nhân vật bên trái, nhật ký bên phải, các bảng hiện giữa màn hình. Trên điện thoại và app đã cài, bố cục dọc như cũ.

Trên mỗi lựa chọn có gợi ý ảnh hưởng: **Thể chất / Linh hồn / Tâm cảnh / Khí vận / Kim tệ / Đấu khí** kèm ↑ ↓ ± (bấm vào bảng chỉ số trên HUD để xem giải thích từng chỉ số), nhãn *may rủi* (có tung xúc xắc) và *nguy hiểm tính mạng*. Nút **Xem thông số** (hoặc phím `Esc`) tạm ẩn bảng sự kiện để bạn xem lại chỉ số trước khi chọn.

---

## Hệ thống trong game

Toàn bộ số liệu nằm trong [`src/game/data.js`](src/game/data.js).

### Cảnh giới & thời gian

| # | Cảnh giới | Bậc | Thọ nguyên | Năm / lượt | Tỷ lệ đột phá cơ bản lên cảnh giới sau |
|---|---|---|---|---|---|
| 1 | Đấu Chi Khí | 10 đoạn | 80 | 1 | 90% |
| 2 | Đấu Giả | 9 tinh | 90 | 1 | 85% |
| 3 | Đấu Sư | 9 tinh | 100 | 1 | 80% |
| 4 | Đại Đấu Sư | 9 tinh | 120 | 1 | 70% |
| 5 | Đấu Linh | 9 tinh | 150 | 1 | 60% |
| 6 | Đấu Vương | 9 tinh | 200 | 2 | 50% |
| 7 | Đấu Hoàng | 9 tinh | 280 | 2 | 40% |
| 8 | Đấu Tông | 9 tinh | 400 | 3 | 30% |
| 9 | Đấu Tôn | 9 tinh | 700 | 4 | 15% |
| 10 | Bán Thánh | — | 1000 | 5 | 8% |
| 11 | Đấu Thánh | 9 tinh | 1600 | 5 | gần như bất khả |
| 12 | Đấu Đế | 100 trọng | bất tử | 5 | không còn cảnh giới nào cao hơn |

**Tốc độ thời gian.** Một lượt ở tốc độ 1× kéo dài 3,2 giây (1.5× = 2s, 3× = 1,1s, 6× = 0,5s). Lúc thơ ấu, lượt nhanh hơn 40%. Ở cảnh giới cao, mỗi lượt trôi nhiều năm hơn để kiếp người không kéo dài hàng giờ.

| Giai đoạn | Giây cho 1 năm tuổi ở 1× |
|---|---|
| Thơ ấu | ~1,9 s |
| Đấu Chi Khí → Đấu Linh | 3,2 s |
| Đấu Vương, Đấu Hoàng | 1,6 s |
| Đấu Tông | ~1,07 s |
| Đấu Tôn | 0,8 s |
| Bán Thánh, Đấu Thánh | 0,64 s |

Một kiếp trung bình mất khoảng **9 phút** ở 1× (chưa tính lúc bạn suy nghĩ), kiếp dài nhất khoảng 25–30 phút.

### Tư chất, xuất thân, thiên phú

- **Tư chất** (hệ số tốc độ tu luyện): Kinh mạch bế tắc ×0,15 (3%) · Hạ phẩm ×0,6 (42%) · Trung phẩm ×1 (36%) · Thượng phẩm ×1,5 (14%) · Thiên tài ×2,2 (4,4%) · Thể chất đặc thù ×3 (0,6%; Viêm Mạch Chi Thể, Bất Diệt Kim Thân, Thiên Độc Thể, Linh Hồn Thiên Sinh). Người có kinh mạch bế tắc vẫn có cơ hội chữa khỏi qua sự kiện.
- **Xuất thân** quyết định gia sản ban đầu, tiền chu cấp và tiền thừa kế: cô nhi Hắc Giác Vực, con nhà nông, nhà buôn, chi thứ gia tộc, thiếu chủ đại gia tộc, con luyện dược sư, hậu duệ Viễn Cổ chủng tộc.
- **Thuộc tính**: Hỏa, Mộc, Thủy, Phong, Lôi, Thổ, Kim, Băng, Ám. Có 14% cơ hội mang song thuộc tính. *Hỏa* (hoặc dị hỏa, hoặc có sư phụ) là điều kiện để luyện dược.
- **Thiên phú** (2 cái): Kiên nghị, Ngộ tính cao, Thân thể cường tráng, Linh hồn nhạy bén, Phúc tinh, Hiếu chiến, Tâm cao khí ngạo, Đào hoa. Ngoài ra có 4% cơ hội nhận **chiếc nhẫn đen của mẹ**…

### Chỉ số

| Chỉ số | Ý nghĩa |
|---|---|
| **Thể chất** | Sức khỏe. Dưới 25 thì tu luyện chậm, dưới 10 rất dễ chết. Giảm khi bị thương, hồi dần theo thời gian. |
| **Linh hồn** | Điều kiện nâng phẩm luyện dược sư, tăng tỷ lệ đột phá. |
| **Tâm cảnh** | Dưới 30 thì tu luyện chậm, dễ gặp tâm ma, tẩu hỏa nhập ma. |
| **Khí vận** | Ảnh hưởng nhiều phép thử may rủi, phẩm chất trang bị rơi ra. |
| **Chiến lực** | Tính từ cảnh giới, thể chất, đấu kỹ, dị hỏa, ma thú đồng hành và trang bị. Quyết định thắng thua trong chiến đấu. |
| **Danh vọng** | Tăng khi thắng lớn hay đột phá cảnh giới cao. Cần để khai tông, thu hút đệ tử, ép địch quy hàng. |

Các thứ khác bạn có thể sở hữu: **công pháp** và **đấu kỹ** (Hoàng → Huyền → Địa → Thiên giai), **dị hỏa** (tối đa 3, theo Dị Hỏa Bảng), **động phủ** (3 cấp, +12% tu luyện mỗi cấp), **sư phụ**, **đạo lữ**, **ma thú đồng hành**, **đệ tử**, **khách khanh** cho gia tộc.

### Chuyên tâm

| Chuyên tâm | Tốc độ tu | Tác dụng |
|---|---|---|
| Khổ tu | ×1,5 | Tự dùng Tụ Khí Đan (thiếu thì tự mua nếu dư tiền). Tâm cảnh +, thể chất − nhẹ. |
| Lịch luyện | ×0,9 | Săn ma hạch, hái dược liệu, có thể nhặt trang bị. Gặp kỳ ngộ gấp đôi, nguy hiểm cũng nhiều hơn. |
| Nhận nhiệm vụ | ×0,8 | Bảng nhiệm vụ 3 mức khó, thù lao theo cấp. Điểm cống hiến tông môn đổi công pháp hoặc đan. |
| Luyện dược | ×0,6 | Lên phẩm luyện dược sư (1–9). Luyện đan để dùng hoặc bán. Cần hỏa thuộc tính và linh hồn mạnh. |
| Tu đấu kỹ | ×0,7 | Luyện đấu kỹ tới đại thành, tăng chiến lực. |
| Tĩnh tâm | ×0,5 | Hồi tâm cảnh mạnh, tăng linh hồn. |
| Chưởng quản tông môn | ×0,7 | *Chỉ khi đã có tông môn.* Đệ tử tăng gấp đôi, cống nạp ×1,6, thuế lãnh địa ×1,2. |

### Đột phá

Khi tu vi đầy bậc cuối, sự kiện **Bình cảnh** buộc bạn chọn:

- **Xung kích ngay**: tỷ lệ = tỷ lệ cơ bản + bonus từ tâm cảnh, linh hồn, khí vận, thiên phú *Kiên nghị*, số lần đã củng cố.
- **Uống / mua Phá Chướng Đan** rồi xung kích: tối đa +20% nếu đan đúng phẩm.
- **Củng cố căn cơ**: lùi lại một chút, lần sau thêm +5% (cộng dồn tối đa 3 lần).

Thất bại thì tu vi bị phản phệ. Từ Đấu Tông trở lên có thể chết. Từ Bán Thánh trở lên mất sạch tích lũy. Đột phá thành công thì tăng thọ nguyên, danh vọng, và có thể được gia tộc hay tông môn ban thưởng.

### Kinh tế: kim tệ, chợ, sàn giao dịch

- **Thu nhập**: gia đình chu cấp (đến 20 tuổi), nguyệt lệ tông môn, bổng lộc khách khanh, bán ma hạch hoặc dược liệu, thù lao nhiệm vụ, bán đan, thừa kế, sản nghiệp, thuế lãnh địa, cống nạp đệ tử, hợp đồng binh khí, hàng ký gửi trên sàn…
- **Chi tiêu**: sinh hoạt phí từ 16 tuổi (tăng theo cảnh giới), đan dược, dược liệu, đấu giá, trang bị, sản nghiệp, công trình, bổng lộc trưởng lão, quân lương, lò rèn. Hết tiền thì sống kham khổ, thể chất và tâm cảnh giảm.
- **Đơn vị giá**: giá ma hạch cùng cấp với cảnh giới. Mỗi cấp hoặc phẩm đắt gấp 3. Chợ thu mua 70% giá và bán ra 115% giá, nhân với **chỉ số thị trường**.
- **Giá thị trường**: 6 nhóm hàng (ma hạch, dược liệu, Huyền thiết, đan dược, trang bị, binh khí quân dụng) dao động mỗi lượt quanh mức 100, hiện ở đầu bảng **Thị**. Sự kiện như chiến tranh hay thương hội phá sản đẩy giá lên xuống.
- **Vật phẩm**: Ma hạch, Dược liệu, Huyền thiết (nguyên liệu rèn), Tụ Khí Đan (tăng tu vi), Liệu Thương Đan (hồi thể chất), Phá Chướng Đan (tăng tỷ lệ đột phá), Dưỡng Hồn Đan (+linh hồn), Thanh Tâm Đan (+tâm cảnh), Diên Thọ Đan (+thọ nguyên, uống càng nhiều càng kém). Đan thấp phẩm hơn cảnh giới thì gần như vô dụng.
- **Sàn Vạn Bảo** (Thị → Sàn): ký gửi tối đa 8 món với giá tự đặt. Giá càng sát thị trường càng dễ bán (đúng giá khoảng 60% mỗi lượt, đắt hơn 50% gần như không ai mua). Phí sàn 5% khi bán được (khách quý 2%). Thương nhân khác cũng rao hàng trên sàn, đổi mới mỗi 3 lượt, có món rẻ và món đắt hơn thị trường.
- **Thị → Thu chi** là sổ thu chi của lượt vừa rồi. Trong **Túi** có 2 công tắc: *tự bán chiến lợi phẩm dư* (giữ lại Huyền thiết và ma hạch nếu có lò rèn hay kỵ binh) và *tự mua đan dược / dược liệu khi dư dả*.

### Trang bị

Có 5 ô trang bị, xem ở **Túi → Trang bị**:

| Ô | Tác dụng |
|---|---|
| **Vũ khí** | Chiến lực +1,5 → +18 theo bậc |
| **Hộ giáp** | Chiến lực nhỏ + **giảm 8% → 45% thương tổn thể chất** |
| **Bảo vật** | Chiến lực nhỏ + **tốc độ tu luyện +4% → +45%** |
| **Giới chỉ** | Chiến lực nhỏ + **tỷ lệ đột phá +1% → +8%** |
| **Chiến ngoa** | Chiến lực nhỏ + **thoát hiểm 6% → 33%** (giảm xác suất tử vong) |

- **6 bậc**: Phàm khí, Hoàng giai, Huyền giai, Địa giai, Thiên giai, Thánh khí (từ Đấu Thánh). Bậc thường gặp tăng theo cảnh giới.
- **5 phẩm chất** (mỗi phẩm một màu): Thường ×1, Tinh phẩm ×1,25, Cực phẩm ×1,6, Huyền bảo ×2, Thần phẩm ×2,6. Khí vận cao thì dễ ra đồ tốt.
- **Cường hóa +0 → +100** ở lò rèn: mỗi cấp +4% chỉ số chính.
- **Nguồn**: lịch luyện, thưởng nhiệm vụ, nạp giới, sự kiện, **tự rèn ở lò rèn**, **Binh Khí Phường** (Thị → Chợ) và **Sàn giao dịch**.
- Món mới tốt hơn sẽ **tự trang bị**, đồ cũ vào **kho** (tối đa 40 món, kho đầy thì tự bán món kém nhất). Kho có lọc theo ô, mỗi món hiện chênh lệch chiến lực so với đồ đang mặc, và nút **Bán đồ kém hơn**.

### Lò rèn (Luyện Khí Phòng)

Mở bằng nút **Lò rèn**. Dựng lò rồi nâng cấp tới **cấp 100**.

- **Chế tạo**: chọn ô và bậc, tốn kim tệ, Huyền thiết và một khỏa ma hạch. Lò cấp 15 mở Hoàng giai, 30 Huyền giai, 45 Địa giai, 60 Thiên giai, 75 Thánh khí (không vượt quá bậc hợp cảnh giới +1). Cấp lò, dị hỏa và linh hồn càng cao thì càng dễ ra Huyền bảo, Thần phẩm. Bảng hiện sẵn tỷ lệ từng phẩm chất.
- **Cường hóa**: dưới +10 chắc chắn thành công, sau đó tỷ lệ giảm dần (thấp nhất 20%), lò cấp cao bù lại. Thất bại chỉ mất nguyên liệu, không tụt cấp.
- **Xưởng quân dụng**: mỗi năm sản xuất 4 bộ binh khí × cấp lò (dùng tối đa 1/4 số kim tệ đang có). Binh khí dùng để:
  - giao **hợp đồng quân đội** (Dong Binh Công Hội, cấm quân Gia Mã, Liên quân Trung Châu, Chiến đoàn Cổ tộc…), giá 1,6–2,5 lần giá vốn;
  - bán cho thương nhân bất cứ lúc nào;
  - tự động phát cho binh sĩ của bạn (quân có binh khí mạnh hơn 60%).
- Huyền thiết có từ lịch luyện, Chợ, Sàn, Ma tinh khoáng mạch, vùng có mỏ (Tháp Qua Nhĩ, Thạch tộc) và sự kiện *mạch Huyền thiết*.

### Sản nghiệp

**Thị → Sản nghiệp.** Mỗi loại tối đa **100 cấp**, giá cấp sau gấp 1,1 lần. Cứ đủ 25 cấp thì thu nhập của sản nghiệp đó **nhân đôi**. Thu nhập tính theo năm, kể cả khi đang bế quan. Có nút mua +1, +10 hoặc tối đa; khoản chi lớn hơn 40% số tiền đang có phải bấm hai lần để xác nhận.

| Sản nghiệp | Giá cấp 1 | Thu / năm mỗi cấp | Ghi chú |
|---|---|---|---|
| Trà lâu | 1.500 | 110 | |
| Dược điền | 8.000 | 600 | Thỉnh thoảng cho dược liệu |
| Đan dược phô | 40.000 | 3.200 | |
| Ma tinh khoáng mạch | 300.000 | 25.000 | Cần Đấu Linh. Mỗi năm đào thêm Huyền thiết |
| Phòng đấu giá | 3.000.000 | 260.000 | Cần Đấu Hoàng |

Có sản nghiệp thì có thể gặp sự kiện *địa đầu xà đòi tiền bảo kê*.

### Tông môn

Mở bằng nút **Tông môn**. **Điều kiện khai tông:** cảnh giới Đấu Vương, danh vọng ≥ 8, 60.000 kim tệ, không theo Hồn Điện. Bạn tự đặt tên tông môn (hoặc bấm *Đổi* để lấy tên ngẫu nhiên). Khi đủ điều kiện, game cũng sẽ gợi ý bằng một sự kiện.

- **Đệ tử** tự tìm đến theo danh vọng, tới giới hạn = 30 + 40 × cấp Chiêu Hiền Điện + 10 × số lãnh địa + danh vọng. Đệ tử cống nạp kim tệ mỗi năm.
- **Trưởng lão** tìm đến qua sự kiện (phí nhập môn + bổng lộc hằng năm). Trưởng lão tăng thực lực, có thể đi chinh phạt thay bạn, nhưng cũng có thể **phản bội** cuỗm ngân khố.
- **Chi phí**: duy trì công trình, bổng lộc trưởng lão, sinh hoạt đệ tử. Ngân khố cạn thì 15% đệ tử bỏ đi.
- **Hạng tông môn**: Tiểu môn phái → Tông môn tam lưu → nhị lưu → nhất lưu → Bá chủ một phương → Siêu cấp thế lực → Đế tông vạn cổ.

**Công trình** tối đa **100 cấp** (giá gấp 2,2 mỗi cấp tới cấp 6, sau đó chỉ gấp 1,08). Mười cấp đầu hiệu quả trọn vẹn, từ cấp 11 mỗi cấp tính 35%:

| Công trình | Giá cấp 1 | Tác dụng |
|---|---|---|
| Tàng Kinh Các | 30.000 | Tu luyện +6% / cấp. Từ cấp 3 đệ tử mạnh hơn. |
| Đan Phòng | 30.000 | Mỗi lượt sản xuất Tụ Khí Đan và Liệu Thương Đan |
| Diễn Võ Trường | 40.000 | Thực lực tông môn +2,5 / cấp |
| Hộ Sơn Đại Trận | 50.000 | Phòng thủ lãnh địa, mở lựa chọn *cố thủ bằng đại trận* |
| Chiêu Hiền Điện | 25.000 | +40 giới hạn đệ tử / cấp, thêm chỗ cho trưởng lão |
| Doanh Trại | 35.000 | Lập quân đội: +40 quân số / cấp, mở binh chủng ở cấp 5, 15, 30 |

**Thực lực tông môn** = √(đệ tử) × 0,8 (×1 nếu Tàng Kinh Các ≥ 3) + 2 × trưởng lão + 2,5 × cấp hiệu dụng Diễn Võ Trường + 0,4 × số lãnh địa + số đệ tử thân truyền (tối đa 5).
**Thế lực** khi chinh chiến = chiến lực bản thân + thực lực tông môn + sức chiến quân đội.

**Sự kiện tông môn**: trưởng lão xin gia nhập, trưởng lão phản bội, thiên tài xin bái sư, gia tộc xin làm phụ thuộc, tông môn khác tuyên chiến.

### Quân đội

**Tông môn → Quân đội**, cần Doanh Trại. Bốn binh chủng (giá tính theo giá ma hạch cùng cấp, nên càng về sau càng đắt):

| Binh chủng | Sức chiến | Mở ở Doanh Trại | Ghi chú |
|---|---|---|---|
| Bộ binh | 1 | cấp 1 | Rẻ, đông |
| Cung thủ | 1,5 | cấp 5 | |
| Ma thú kỵ binh | 4 | cấp 15 | Cứ 5 kỵ cần 1 ma hạch |
| Trận pháp sư | 3 | cấp 30 | Sức chiến ×2 khi thủ thành |

- **Sức chiến quân đội** = 1,6 × √(tổng sức chiến × (1 + 60% tỷ lệ có binh khí) × (1 + 2% × cấp huấn luyện)). Dùng căn bậc hai để quân đông mạnh nhưng không áp đảo hoàn toàn.
- **Huấn luyện** 0 → 100. **Quân lương** trả mỗi năm; thiếu thì 20% binh sĩ bỏ trốn.
- Có quân từ 50 người thì trận chinh phạt có thêm lựa chọn **Đại quân vây thành**: bạn không ra trận nên không có rủi ro tính mạng, nhưng thua thì mất 30% quân.
- Thắng trận mất 3–8% quân, thua mất 15–30%. Sự kiện riêng: binh biến đòi lương, đại diễn tập.

### Bản đồ & chinh phạt lãnh địa

**Tông môn → Bản đồ** là bản đồ đại lục vẽ tay với **28 vùng đất, 6 khu vực**. Bấm vào một vùng để xem chi tiết và xuất binh. Viền màu cho biết độ khó (xanh dễ, vàng cân sức, đỏ khó, nét đứt là chưa tới được), vùng đã chiếm tô đỏ, đường giữa hai lãnh địa của bạn được nối liền. Trên điện thoại, bản đồ cuộn ngang được.

| Khu vực | Mở từ | Vùng (thực lực trấn thủ) |
|---|---|---|
| Gia Mã Đế Quốc | khởi đầu | Ô Thản Thành (50) · Thanh Sơn Trấn (56) · Ma Thú Sơn Mạch (66, ma hạch) · Vân Lam Sơn (74) · Gia Mã Thánh Thành (82) |
| Tây Bắc | khởi đầu | Sa mạc Tháp Qua Nhĩ (86, Huyền thiết) · Hắc Giác Vực (98) · Xuất Vân Đế Quốc (106, dược liệu) · Già Nam Học Viện (116) |
| Trung Châu | | Thiên Bắc Thành (130) · Đan Vực (146, dược liệu) · Hoa Tông (158) · Phong Lôi Bắc Các (170) · Thánh Đan Thành (188, dược liệu) · Phân điện Hồn Điện (204) |
| Thú Vực | Đấu Tôn | Vạn Thú Lĩnh (226, ma hạch) · Thái Hư Cổ Long tộc (248) · Thiên Yêu Hoàng tộc (270) · Cửu U Địa Minh Mãng (292, ma hạch) |
| Cổ Giới | Bán Thánh | Viêm tộc (310) · Dược tộc (330, dược liệu) · Lôi tộc (350) · Thạch tộc (368, Huyền thiết) · Cổ tộc (395) |
| Hồn Giới | Đấu Thánh | Hư Vô Không Gian (430) · Thiên Hồn Thành (480) · Hồn tộc Chủ Điện (540) · Đà Xá Cổ Đế Động Phủ (620) |

- **Chỉ đánh được vùng giáp lãnh địa của mình** (theo đường nối trên bản đồ). Chưa có đất thì bắt đầu ở Gia Mã hoặc Tây Bắc.
- Trận chinh phạt có các lựa chọn: **đích thân dẫn quân**, **đại quân vây thành**, **phái trưởng lão**, **gửi chiến thư ép quy hàng**, hoặc thu quân.
- **Khai phát** lãnh địa của mình tới cấp 100: mỗi cấp +8% thu nhập vùng đó, vùng có tài nguyên cho thêm sản vật.
- **Chống bành trướng:** mỗi vùng bạn chiếm khiến mọi vùng còn lại mạnh thêm 3%. Đánh hỏng một vùng phải chờ 2 lượt.
- **Bị tập kích:** lãnh địa càng nhiều càng hay bị đánh. Bạn có thể đích thân ra trận (quân đội và trận pháp sư cùng thủ), cố thủ bằng Hộ Sơn Đại Trận, hoặc nhường đất.

### Sự kiện & khoảnh khắc

Hơn 60 loại sự kiện có lựa chọn, ví dụ:

- **Thơ ấu và thiếu niên**: bị chế giễu là phế vật, thoái hôn, chiếc nhẫn đen, Già Nam Học Viện, bái nhập tông môn.
- **Kỳ ngộ**: ma thú canh linh dược, động phủ viễn cổ, dị hỏa xuất thế, nạp giới, bí tịch ven đường, đấu giá, đốn ngộ, di tích Đấu Đế, mạch Huyền thiết.
- **Tranh đấu**: đối thủ khiêu chiến, đại hội tỷ võ, hẹn ước ba năm, Hồn Điện chiêu dụ hoặc truy sát, tâm ma.
- **Tiền bạc**: bảng nhiệm vụ, cướp đường, cứu thương đội, bạn cũ hỏi vay, động phủ rao bán, khách khanh, thương hội bán tháo, khách quý Sàn Vạn Bảo.
- **Lò rèn và quân đội**: chiến tranh làm giá binh khí tăng vọt, luyện khí đại sư ghé thăm, binh biến, đại diễn tập.
- **Hậu kỳ (Đấu Thánh, Đấu Đế)**: Hồn tộc xâm lấn, Thiên Mộ thí luyện, Cổ tộc kết minh, luyện Đế phẩm đan, thần thú Thú Vực, triều kiến Đấu Đế, khắc đế ấn truyền thừa.
- **Tình duyên**: kết đạo lữ (phàm nhân hay tu sĩ), đạo lữ bị bắt cóc.

Ngoài ra có hàng chục **khoảnh khắc** nhỏ không cần chọn. Nhật ký tự **gộp các năm bình lặng** (bấm để mở) và có nút **Chỉ xem đại sự**. Đột phá, đại sự và thành tựu mới hiện thông báo nổi ở đầu màn hình.

### Kết thúc một kiếp

Thành tựu **Đấu Đế** không kết thúc game: thọ nguyên vô tận, không còn chết vì bệnh tật hay hiểm nguy, và bạn tiếp tục tu luyện tới **Đấu Đế 100 trọng**, mở rộng tông môn, chinh phạt tới tận Hồn Giới. Khi đã mãn nguyện, bấm thẻ **Đấu Đế · Quy ẩn** trên HUD để khép lại kiếp này.

**Truyền thừa:** sự kiện *khắc đế ấn* cho phép kiếp sau được hưởng phúc ấm (thêm khí vận và gia sản lúc sinh ra).

Màn **Bia ký** gồm: danh hiệu (Phàm nhân giữa hồng trần, Cường giả trấn quốc, Tông chủ một phương, Khai sơn tổ sư, Bá chủ đại lục, Đấu Đế, Đế chủ đại lục…), nguyên nhân qua đời, biểu đồ cảnh giới theo tuổi, 10 khoảnh khắc đáng nhớ và *hành trang một đời* (tư chất, công pháp, dị hỏa, tông môn, lãnh địa, quân đội, lò rèn, trang bị, tài sản…). Kiếp đó được ghi vào **Sổ luân hồi** ở trang chủ (giữ 50 kiếp gần nhất).

**Thành tựu:** 27 thành tựu giữ qua mọi kiếp (Phế vật nghịch thiên, Tam hỏa đồng thể, Nhất thống đại lục, Cường hóa +100…), xem ở trang chủ.

---

## Lưu trữ & sao lưu

- Game tự lưu sau mỗi lượt vào `localStorage` của trình duyệt. Khóa `dpnk_save` là kiếp đang chơi, `dpnk_book` là Sổ luân hồi, `dpnk_ach` là thành tựu, `dpnk_speed` là tốc độ, `dpnk_feed` là chế độ xem nhật ký.
- Bản lưu cũ được nâng cấp tự động khi có tính năng mới (hàm `migrate` trong [`engine.js`](src/game/engine.js)).
- **Sao lưu / chuyển máy**: ở trang chủ có mục sao lưu, xuất ra một mã dạng `DPNK1.z…` (JSON nén gzip, mã hóa base64). Bạn có thể copy mã, tải về file `.txt`, rồi dán vào máy khác để khôi phục. Sổ luân hồi được gộp, không trùng lặp.

## Phím tắt

| Phím | Tác dụng |
|---|---|
| `Space` | Tạm dừng / tiếp tục |
| `Esc` | Ẩn / hiện bảng sự kiện để xem thông số |
| `1` – `6` | Chọn lựa chọn tương ứng |

---

## Cấu trúc mã nguồn

```
├── index.html               # khung HTML, font Google, manifest
├── public/
│   ├── manifest.webmanifest # thông tin PWA
│   ├── sw.js                # service worker (offline)
│   └── icons/
├── scripts/
│   └── sim.mjs              # giả lập nhiều kiếp (npm run sim)
└── src/
    ├── main.jsx             # điểm vào React
    ├── App.jsx              # điều hướng màn hình: start → birth → game → end
    ├── pwa.js               # đăng ký service worker, nút "cài ứng dụng"
    ├── styles.css           # toàn bộ giao diện (biến màu sáng/tối ở :root)
    ├── components/
    │   ├── Start.jsx        # trang chủ, Sổ luân hồi, thành tựu, bảng cảnh giới
    │   ├── Birth.jsx        # màn sinh ra, đầu thai lại
    │   ├── Game.jsx         # màn chính: HUD, nhật ký, điều khiển, bảng sự kiện, thông báo nổi
    │   ├── Bag.jsx          # túi đồ, trang bị, kho binh khí
    │   ├── Forge.jsx        # lò rèn: chế tạo, cường hóa, xưởng quân dụng
    │   ├── Market.jsx       # chợ, sàn giao dịch, sản nghiệp, thu chi
    │   ├── Sect.jsx         # tông môn, công trình, quân đội, bản đồ
    │   ├── WorldMap.jsx     # bản đồ đại lục (SVG) và thẻ vùng đất
    │   ├── End.jsx          # bia ký cuối đời
    │   ├── Backup.jsx       # sao lưu / khôi phục
    │   ├── ui.jsx           # Bar, Sheet, Tabs, LevelBuy, GearRow, Toasts, LifeChart…
    │   ├── motion.js        # chuyển động bằng anime.js
    │   └── glyphs.jsx       # chữ trên con dấu son
    └── game/                # logic thuần, không phụ thuộc React
        ├── data.js          # MỌI SỐ LIỆU: cảnh giới, tư chất, vật phẩm, trang bị, sản nghiệp, tông môn, bản đồ
        ├── engine.js        # vòng lặp lượt (tick), chọn lựa (choose), tổng kết, lưu/đọc
        ├── events.js        # sự kiện có lựa chọn, khoảnh khắc, câu độn
        ├── economy.js       # chợ, đan dược, săn bắn, luyện đan, bảng nhiệm vụ, thu chi
        ├── gear.js          # trang bị, binh khí phường, sản nghiệp
        ├── forge.js         # lò rèn, chế tạo, cường hóa, binh khí quân dụng, hợp đồng
        ├── army.js          # quân đội: chiêu mộ, huấn luyện, quân lương, tổn thất
        ├── exchange.js      # giá thị trường, ký gửi, hàng trên sàn
        ├── sect.js          # tông môn, công trình, lãnh địa, chinh phạt, phòng thủ
        ├── ach.js           # thành tựu
        ├── demo.js          # nhân vật dựng sẵn cho #demo (chỉ khi phát triển)
        ├── backup.js        # mã sao lưu
        └── util.js          # random, chiến lực, đột phá, áp hiệu ứng, định dạng tiền
```

**Luồng một lượt** (`tick` trong `engine.js`): tăng tuổi → kiểm tra thọ nguyên và rủi ro tử vong → (6 tuổi) trắc nghiệm đấu khí → hiệu ứng chuyên tâm, sản nghiệp, tông môn, kinh tế, tu vi → gia đình và đạo lữ → sự kiện bắt buộc (bình cảnh, hẹn ước, thọ nguyên cạn) → khoảnh khắc ngẫu nhiên → sự kiện ngẫu nhiên → ghi dòng thu chi.

Trạng thái nhân vật `s` là một object JSON thuần, được lưu nguyên vào `localStorage`. Giao diện đọc trực tiếp `s` và gọi `bump()` để vẽ lại.

---

## Chỉnh cân bằng game

Hầu hết mọi thứ chỉnh trong [`src/game/data.js`](src/game/data.js):

| Muốn… | Sửa |
|---|---|
| Thời gian trôi chậm / nhanh hơn | `yrs` trong `G.REALMS` (năm mỗi lượt) và `SPEEDS` trong [`Game.jsx`](src/components/Game.jsx) (ms mỗi lượt) |
| Tu luyện khó / dễ hơn | `yps` (năm cho 1 bậc), `G.ROOTS[].m`, `G.GONG_MULT` |
| Đột phá khó / dễ hơn | `bt` trong `G.REALMS`, hàm `btChance` trong [`util.js`](src/game/util.js) |
| Giàu / nghèo hơn | `G.LIVING`, `G.ALLOWANCE`, `G.ITEMS[].base`, `G.MISSIONS` |
| Trang bị mạnh / yếu hơn | `G.GEAR`, `G.GEAR_PRICE`, `G.QUALITY` |
| Sản nghiệp | `G.ESTATES`, `G.ESTATE_MAX`, `G.ESTATE_GROW` |
| Tông môn | `G.SECT_REQ`, `G.BUILDS`, `G.BUILD_MAX`; công thức `buildCost`, `memberCap`, `sectPower`, `sectYearly` trong [`sect.js`](src/game/sect.js), `effLv` trong [`util.js`](src/game/util.js) |
| Lò rèn | `G.SMITHY`, `G.ORE_FOR_TIER`, `G.BUYERS`; công thức trong [`forge.js`](src/game/forge.js) |
| Quân đội | `G.TROOPS`, `G.TRAIN_MAX`; công thức `armyPower` trong [`army.js`](src/game/army.js) |
| Sàn giao dịch | `G.MARKETS`, `G.CONSIGN_MAX`, `G.CONSIGN_FEE`; `sellChance`, `marketTick` trong [`exchange.js`](src/game/exchange.js) |
| Bản đồ, chinh phạt | `G.ZONES`, `G.REGIONS`, `G.ROADS`; hệ số 0,03 trong `regionDef`, công thức `conquerP` |

Sau khi chỉnh, chạy giả lập để xem ảnh hưởng:

```bash
npm run sim -- 1000
```

Kết quả gồm số lỗi runtime, phân bố cảnh giới cuối đời, tuổi thọ trung bình, số lượt và sự kiện mỗi kiếp, thời gian chơi ước tính ở 1×, tỷ lệ khai tông và số lãnh địa trung bình. Bot chọn ngẫu nhiên nên kết quả chỉ để so sánh tương đối giữa các lần chỉnh.

---

## Thêm sự kiện mới

Thêm một object vào mảng `EVENTS` trong [`src/game/events.js`](src/game/events.js):

```js
{
  id: 'vi_du',            // duy nhất; thêm chữ con dấu tương ứng vào EV_G trong glyphs.jsx
  a: [16, 9999],          // khoảng tuổi (tùy chọn)
  r: [3, 8],              // khoảng cảnh giới, chỉ số trong G.REALMS (tùy chọn)
  w: 0.6,                 // trọng số xuất hiện (số hoặc hàm s => số)
  cd: 8,                  // số lượt chờ trước khi lặp lại (mặc định 6)
  once: false,            // chỉ xảy ra một lần mỗi kiếp
  wild: true,             // gặp nhiều gấp đôi khi đang lịch luyện
  if: (s) => s.gold > 0,  // điều kiện thêm
  prep: (s) => { s.tmp = ... },       // chuẩn bị dữ liệu ngẫu nhiên, đọc lại qua s.tmp
  title: (s) => 'Tiêu đề',            // tùy chọn
  text: (s) => 'Mô tả tình huống.',
  ch: [
    { t: 'Lựa chọn chắc chắn', fx: { tam: 3 }, log: 'Kết quả.' },
    { t: 'Lựa chọn may rủi', roll: (s) => winP(s, peer(s, 1)),   // xác suất thành công 0..1
      ok:   { fx: { qi: 60, fame: 1 }, log: 'Thành công!', k: 'good' },
      fail: { fx: { body: -12 }, log: 'Thất bại.', dieP: 0.05, die: 'Nguyên nhân tử vong' } },
  ],
}
```

Các khóa của `fx`: `body`, `soul`, `tam`, `luck` (chỉ số) · `qi` (tu vi) · `gold` (tính theo số ma hạch cùng cấp) · `goldAbs` (số kim tệ cụ thể) · `why` (nhãn trong sổ thu chi) · `item: [[loại, phẩm, số lượng]]` · `fame` · `life` (thọ nguyên). Giá trị có thể là hàm `s => số`. Muốn có logic tùy ý thì dùng `do: (s) => {...}`.

---

## Triển khai (deploy)

`npm run build` tạo thư mục `dist/` gồm toàn file tĩnh, với `base: './'` nên chạy được ở bất kỳ đường dẫn con nào. Bạn có thể đưa lên:

- **GitHub Pages**: đẩy nội dung `dist/` lên nhánh `gh-pages`, hoặc dùng GitHub Actions build từ nhánh `main`.
- **Netlify / Vercel / Cloudflare Pages**: lệnh build là `npm run build`, thư mục xuất là `dist`.

Service worker chỉ bật ở bản build. HTML lấy từ mạng trước để luôn nhận bản mới. JS và CSS có mã hash trong tên file nên được cache lâu dài.

---

*Fan game phi thương mại, lấy cảm hứng từ «Đấu Phá Thương Khung» của Thiên Tằm Thổ Đậu.*

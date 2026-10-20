# Đấu Phá · Nhất Kiếp

> Sống trọn một kiếp tu luyện trên Đấu Khí Đại Lục: từ phế vật bị người đời khinh rẻ đến Đấu Đế vạn cổ lưu danh.

Game mô phỏng cuộc đời (life-sim) chơi trên trình duyệt, cùng thể loại với *BitLife* hay *Nhân Sinh Trùng Khai Mô Phỏng Khí*, lấy bối cảnh tiểu thuyết **«Đấu Phá Thương Khung»** của Thiên Tằm Thổ Đậu. Mỗi lần chơi là một kiếp người sinh ra ngẫu nhiên: lớn lên, tu luyện, gặp kỳ ngộ, kết đạo lữ, khai tông lập phái, chinh phạt đại lục, có khi phi thăng Thượng giới, rồi khép lại và được ghi vào *Sổ luân hồi*.

**Có gì trong game**

- 12 cảnh giới từ Đấu Chi Khí tới Đấu Đế, khoảng 70 loại sự kiện có lựa chọn và hàng chục khoảnh khắc nhỏ.
- Kinh tế đầy đủ: chợ, sàn ký gửi, đặt mua, phòng đấu giá, sản nghiệp, giá thị trường dao động.
- Trang bị 5 ô, 6 bậc, 5 phẩm chất, 11 hiệu ứng pháp khí; lò rèn để chế tạo, cường hóa, tẩy luyện, dung luyện.
- Linh thú (thú cưng, thú cưỡi) và ngoại trang đổi dáng vẻ nhân vật.
- Tông môn, quân đội 4 binh chủng, sa bàn 28 vùng đất để chinh phạt.
- Hậu kỳ: Đế lộ, nhất thống đại lục, Thượng giới, Đế chiến, truyền thừa và trùng sinh sang kiếp sau.
- Cảnh diễn có hoạt ảnh cho trận đánh, may rủi, đột phá; âm thanh tổng hợp ngay trong trình duyệt.

**Cách chạy**

- Không cần tài khoản hay máy chủ, tiến trình lưu ngay trong trình duyệt.
- Cài được lên điện thoại như ứng dụng (PWA) và chơi offline được.
- Giao diện kiểu sơn mài (nền đen nâu, viền vàng thếp, son đỏ), bố cục riêng cho điện thoại, máy tính bảng và máy tính.

> **Lưu ý bản quyền:** đây là *fan game phi thương mại*. Tên nhân vật, địa danh và cảnh giới thuộc về tác phẩm gốc. Mọi con số và luật chơi là tự đặt.

Lịch sử thay đổi: [CHANGELOG.md](CHANGELOG.md).

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
   - [Kinh tế](#kinh-tế)
   - [Trang bị](#trang-bị)
   - [Lò rèn](#lò-rèn)
   - [Linh thú](#linh-thú)
   - [Ngoại trang](#ngoại-trang)
   - [Sản nghiệp](#sản-nghiệp)
   - [Tông môn](#tông-môn)
   - [Quân đội](#quân-đội)
   - [Bản đồ & chinh phạt](#bản-đồ--chinh-phạt)
   - [Sự kiện & khoảnh khắc](#sự-kiện--khoảnh-khắc)
   - [Đấu Đế và Đế lộ](#đấu-đế-và-đế-lộ)
   - [Thượng giới, Đế chiến, trùng sinh](#thượng-giới-đế-chiến-trùng-sinh)
   - [Kết thúc một kiếp](#kết-thúc-một-kiếp)
4. [Giao diện & chuyển động](#giao-diện--chuyển-động)
5. [Lưu trữ & sao lưu](#lưu-trữ--sao-lưu)
6. [Phím tắt](#phím-tắt)
7. [Dành cho người phát triển](#dành-cho-người-phát-triển)
8. [Triển khai (deploy)](#triển-khai-deploy)

---

## Chạy thử

Cần **Node.js 20+**.

```bash
npm install        # cài thư viện
npm run dev        # bản phát triển tại http://localhost:5173 (mở được từ điện thoại cùng mạng LAN)
npm run build      # đóng gói ra thư mục dist/
npm run preview    # xem thử bản đã đóng gói (có service worker, chơi offline)
npm run sim        # giả lập 300 kiếp để kiểm tra lỗi và cân bằng
```

Khi chạy `npm run dev`, thêm `#demo` vào đường dẫn để vào thẳng một nhân vật hậu kỳ dựng sẵn (Đấu Tôn, có tông môn, lò rèn, linh thú). Chế độ này không có trong bản build.

| Đường dẫn | Mở sẵn |
|---|---|
| `#demo` | Màn chơi |
| `#demo/bag/gear` · `beast` · `look` | Hành trang: trang bị, linh thú, ngoại trang |
| `#demo/forge/craft` · `enh` · `refine` · `fuse` | Lò rèn: chế tạo, cường hóa, tẩy luyện, dung luyện |
| `#demo/market/ex` · `#demo/sect/map` | Sàn giao dịch, sa bàn tông môn |
| `#demo/event/<id>` | Một sự kiện bất kỳ, ví dụ `duel` (cảnh giao chiến), `breakthrough` (đột phá), `treasure` (thiên mệnh), `hon_invasion` |
| `#demo/end` | Bia ký cuối đời |

---

## Cách chơi

1. **Nhập thế**: game ngẫu nhiên xuất thân, tư chất, thuộc tính và thiên phú. Không ưng thì bấm **Đầu thai lại**.
2. **Thơ ấu (0–6 tuổi)**: thời gian tự trôi, đôi khi có sự kiện nhỏ.
3. **6 tuổi**: lễ trắc nghiệm đấu khí, bạn bước vào con đường tu luyện và chọn **chuyên tâm** (làm gì trong thời gian tới).
4. Thời gian tự trôi theo **lượt**. Mỗi lượt có thể có:
   - tu vi tăng, thu chi kim tệ;
   - **khoảnh khắc** (ghi vào nhật ký, không cần chọn);
   - **sự kiện** (game dừng chờ bạn chọn, có thể may rủi hoặc nguy hiểm tính mạng).
5. Khi đấu khí đầy ở bậc cuối, bạn gặp **bình cảnh** và quyết định có xung kích cảnh giới mới hay chưa.
6. Hết thọ nguyên hoặc tử nạn thì kiếp này khép lại. Thành Đấu Đế thì bất tử, tự chọn lúc quy ẩn hoặc phi thăng. Bạn xem bia ký rồi **luân hồi** sang kiếp mới.

### Thanh điều khiển

| Nút | Chức năng |
|---|---|
| ❚❚ / ▶ | Tạm dừng / tiếp tục |
| *Đang chuyên tâm* | Đổi việc đang làm |
| 🔊 | Bật / tắt âm thanh (được ghi nhớ) |
| 1× / 1.5× / 3× / 6× | Tốc độ thời gian (được ghi nhớ) |
| **Túi** | Hành trang: nhân vật và trang bị, linh thú, ngoại trang, vật phẩm |
| **Rèn** | Chế tạo, cường hóa, tẩy luyện, dung luyện, xưởng binh khí quân dụng |
| **Chợ** | Chợ, sàn giao dịch, phòng đấu giá, sản nghiệp, sổ thu chi |
| **Môn** | Tông môn, kho, ngân khố, quân đội, bản đồ |
| **Đế lộ** | Chỉ hiện khi đã thành Đấu Đế: đế cảnh, nhất thống, Thượng giới, truyền thừa |

Chấm đỏ trên nút báo có việc cần xem: hàng ký gửi vừa bán được, hợp đồng giao được, vùng đất dễ chiếm, có thể phi thăng.

### Đọc màn hình

- **Thanh trạng thái** trên cùng: ảnh nhân vật (bấm để mở trang bị), tên, cảnh giới, tuổi và thọ nguyên, thanh đấu khí, bốn chỉ số và các chip tài nguyên. Bấm vào bảng chỉ số để xem giải thích từng icon.
- **Sử ký** (nhật ký) ở giữa: các năm bình lặng tự gộp lại (bấm để mở), nút **Đại sự** chỉ hiện chuyện lớn. Thu chi và chiến lợi phẩm hiện bằng chip biểu tượng kèm số (di chuột để xem câu đầy đủ).
- **Mỗi lựa chọn** có gợi ý bằng icon chỉ số kèm ▲ ▼ ±, đầu lâu nếu *nguy hiểm tính mạng*, và **tỷ lệ thành công** nếu có tung xúc xắc (icon kiếm chéo là trận giao chiến, icon xúc xắc là may rủi). Nút **Xem** (hoặc phím `Esc`) tạm ẩn bảng để bạn xem lại chỉ số trước khi chọn.
- Sau khi chọn, game diễn một cảnh ngắn rồi mới hiện kết quả (chạm để bỏ qua):
  - **Giao chiến**: hai bên lao vào nhau, ba lần va chạm có số sát thương, bên thua bị đánh văng.
  - **Thiên mệnh**: vòng xoay có phần vàng đúng bằng tỷ lệ thành công, kim dừng ở đâu là số phận ở đó.
  - **Xung kích cảnh giới**: đấu khí cuộn xoáy rồi bùng nổ, viết tên cảnh giới mới; thất bại thì vết nứt lan ra và vỡ.

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
| 12 | Đấu Đế | 100 trọng | bất tử | 5 | đỉnh cao, chỉ còn phi thăng |

Một lượt ở tốc độ 1× kéo dài 3,2 giây (1.5× = 2 giây, 3× = 1,1 giây, 6× = 0,5 giây); lúc thơ ấu nhanh hơn 40%. Cảnh giới cao thì mỗi lượt trôi nhiều năm hơn để một kiếp không kéo dài hàng giờ. Một kiếp trung bình mất khoảng **9 phút** ở 1× (chưa tính lúc bạn suy nghĩ), kiếp dài nhất khoảng 25–30 phút.

### Tư chất, xuất thân, thiên phú

- **Tư chất** (hệ số tốc độ tu luyện): Kinh mạch bế tắc ×0,15 (3%) · Hạ phẩm ×0,6 (42%) · Trung phẩm ×1 (36%) · Thượng phẩm ×1,5 (14%) · Thiên tài ×2,2 (4,4%) · Thể chất đặc thù ×3 (0,6%; Viêm Mạch Chi Thể, Bất Diệt Kim Thân, Thiên Độc Thể, Linh Hồn Thiên Sinh). Kinh mạch bế tắc vẫn có thể chữa khỏi qua sự kiện. Màn đầu thai cho tư chất quay như ống thăm rồi dừng; càng hiếm hào quang càng rực.
- **Xuất thân** quyết định gia sản, tiền chu cấp và tiền thừa kế: cô nhi Hắc Giác Vực, con nhà nông, nhà buôn, chi thứ gia tộc, thiếu chủ đại gia tộc, con luyện dược sư, hậu duệ Viễn Cổ chủng tộc.
- **Thuộc tính**: Hỏa, Mộc, Thủy, Phong, Lôi, Thổ, Kim, Băng, Ám; 14% cơ hội mang song thuộc tính. *Hỏa* (hoặc dị hỏa, hoặc có sư phụ) là điều kiện luyện dược.
- **Thiên phú** (2 cái): Kiên nghị, Ngộ tính cao, Thân thể cường tráng, Linh hồn nhạy bén, Phúc tinh, Hiếu chiến, Tâm cao khí ngạo, Đào hoa. Có 4% cơ hội nhận thêm **chiếc nhẫn đen của mẹ**…

### Chỉ số

| Chỉ số | Ý nghĩa |
|---|---|
| **Thể chất** | Sức khỏe. Dưới 25 thì tu luyện chậm, dưới 10 rất dễ chết. Giảm khi bị thương, hồi dần về 50. |
| **Linh hồn** | Gốc của luyện dược, giúp rèn đồ phẩm chất cao và đột phá dễ hơn. |
| **Tâm cảnh** | Ảnh hưởng mạnh nhất tới tỷ lệ đột phá. Dưới 30 thì tu luyện chậm, dễ gặp tâm ma. |
| **Khí vận** | Ảnh hưởng các phép thử may rủi và phẩm chất trang bị rơi ra. |
| **Chiến lực** | Từ cảnh giới, thể chất, đấu kỹ, dị hỏa, linh thú và trang bị. Quyết định thắng thua khi giao chiến. |
| **Danh vọng** | Tăng khi thắng lớn hay đột phá cảnh giới cao. Cần để khai tông, thu hút đệ tử, ép địch quy hàng. |

Bạn còn có thể sở hữu **công pháp** và **đấu kỹ** (Hoàng → Huyền → Địa → Thiên giai), **dị hỏa** (tối đa 3, theo Dị Hỏa Bảng), **động phủ** (3 cấp, +12% tu luyện mỗi cấp), **sư phụ**, **đạo lữ**, **đệ tử**, chức **khách khanh** cho gia tộc.

### Chuyên tâm

| Chuyên tâm | Tốc độ tu | Tác dụng |
|---|---|---|
| Khổ tu | ×1,5 | Tự dùng Tụ Khí Đan (thiếu thì tự mua nếu dư tiền). Tâm cảnh +, thể chất − nhẹ. |
| Lịch luyện | ×0,9 | Săn ma hạch, hái dược liệu, có thể nhặt trang bị. Gặp kỳ ngộ gấp đôi, nguy hiểm cũng nhiều hơn. |
| Nhận nhiệm vụ | ×0,8 | Bảng nhiệm vụ 3 mức khó, thù lao theo cấp. Điểm cống hiến đổi công pháp hoặc đan. |
| Luyện dược | ×0,6 | Lên phẩm luyện dược sư (1–9), luyện đan để dùng hoặc bán. Cần hỏa thuộc tính và linh hồn mạnh. |
| Tu đấu kỹ | ×0,7 | Luyện đấu kỹ tới đại thành, tăng chiến lực. |
| Tĩnh tâm | ×0,5 | Hồi tâm cảnh mạnh, tăng linh hồn. |
| Chưởng quản tông môn | ×0,7 | *Cần có tông môn.* Đệ tử tăng gấp đôi, cống nạp ×1,6, thuế lãnh địa ×1,2. |

### Đột phá

Khi tu vi đầy bậc cuối, sự kiện **Bình cảnh** cho các lựa chọn:

- **Xung kích ngay**: tỷ lệ = tỷ lệ cơ bản + phần cộng từ tâm cảnh, linh hồn, khí vận, thiên phú *Kiên nghị*, giới chỉ, hiệu ứng Thông Thiên, linh thú và số lần đã củng cố.
- **Uống hoặc mua Phá Chướng Đan** rồi xung kích: tối đa +20% nếu đan đúng phẩm.
- **Củng cố căn cơ (3 lượt)** hoặc **Bế quan dài hạn (8 lượt)**: tạm gác đột phá, vẫn lịch luyện và gặp sự kiện như thường. Tu vi dư tích thành căn cơ (tối đa +10% tỷ lệ), mỗi lần củng cố thêm +5% (cộng dồn tối đa 3 lần). Muốn xung kích sớm thì bấm **Xung kích** dưới thanh đấu khí.

Thất bại thì tu vi bị phản phệ; từ Đấu Tông trở lên có thể chết, từ Bán Thánh trở lên mất sạch tích lũy. Thành công thì tăng thọ nguyên, danh vọng, có thể được gia tộc hay tông môn ban thưởng.

### Kinh tế

- **Thu nhập**: gia đình chu cấp (đến 20 tuổi), nguyệt lệ tông môn, bổng lộc khách khanh, bán ma hạch hay dược liệu, thù lao nhiệm vụ, bán đan, thừa kế, sản nghiệp, thuế lãnh địa, cống nạp đệ tử, hợp đồng binh khí, hàng ký gửi.
- **Chi tiêu**: sinh hoạt phí từ 16 tuổi (tăng theo cảnh giới), đan dược, dược liệu, đấu giá, trang bị, sản nghiệp, công trình, bổng lộc trưởng lão, quân lương, lò rèn, linh thú. Hết tiền thì sống kham khổ, thể chất và tâm cảnh giảm.
- **Đơn vị giá** là giá một khỏa ma hạch cùng cấp cảnh giới; mỗi cấp hoặc phẩm đắt gấp 3. Chợ thu mua 70% giá và bán ra 115% giá, nhân với **chỉ số thị trường** của 6 nhóm hàng (ma hạch, dược liệu, Huyền thiết, đan dược, trang bị, binh khí quân dụng), dao động mỗi lượt. Chiến tranh hay thương hội phá sản đẩy giá lên xuống.
- **Vật phẩm**: Ma hạch, Dược liệu, Huyền thiết (nguyên liệu rèn), Tụ Khí Đan (tu vi), Liệu Thương Đan (thể chất), Phá Chướng Đan (đột phá), Dưỡng Hồn Đan (linh hồn), Thanh Tâm Đan (tâm cảnh), Diên Thọ Đan (thọ nguyên, uống càng nhiều càng kém). Đan thấp phẩm hơn cảnh giới thì gần như vô dụng. Mỗi chồng vật phẩm tối đa 9999.
- **Chợ → Sàn** (Sàn Vạn Bảo):
  - **Ký gửi** tối đa 8 món với giá tự đặt. Giá càng sát thị trường càng dễ bán (đúng giá khoảng 60% mỗi lượt, đắt hơn 50% gần như không ai mua). Phí sàn 5% khi bán được (khách quý 2%).
  - **Đặt mua** tối đa 6 đơn cho bất kỳ vật phẩm nào: đặt cọc trước, sàn gom hàng dần mỗi lượt, giá càng cao càng mau đủ. Hủy đơn thì hoàn cọc phần chưa gom. Lò rèn có nút đặt mua nhanh nguyên liệu còn thiếu.
  - Thương nhân khác cũng rao hàng, đổi mới mỗi 3 lượt, có món rẻ có món đắt hơn thị trường.
- **Chợ → Đấu giá** (Phòng đấu giá Mễ Đặc Nhĩ): mỗi 6 lượt mở một phiên kéo dài 3 lượt, bán trang bị Cực phẩm trở lên, lô Huyền thiết lớn, đan dược hiếm, công pháp và đấu kỹ. Bạn ra giá tranh với các thế lực khác; đối thủ có giá trần ẩn và để lộ thái độ còn hăng hay sắp bỏ cuộc.
- **Chợ → Sổ** là sổ thu chi của lượt vừa rồi. Trong **Túi → Vật phẩm** có 2 công tắc: *tự bán chiến lợi phẩm dư* (giữ Huyền thiết và ma hạch nếu có lò rèn hay kỵ binh) và *tự mua đan dược khi dư dả*.

### Trang bị

Có 5 ô trang bị:

| Ô | Tác dụng |
|---|---|
| **Vũ khí** | Chiến lực +1,5 → +18 theo bậc |
| **Hộ giáp** | Chiến lực nhỏ + **giảm 8% → 45% thương tổn thể chất** |
| **Bảo vật** | Chiến lực nhỏ + **tốc độ tu luyện +4% → +45%** |
| **Giới chỉ** | Chiến lực nhỏ + **tỷ lệ đột phá +1% → +8%** |
| **Chiến ngoa** | Chiến lực nhỏ + **thoát hiểm 6% → 33%** (giảm xác suất tử vong) |

- **6 bậc**: Phàm khí, Hoàng giai, Huyền giai, Địa giai, Thiên giai, Thánh khí. Bậc thường gặp tăng theo cảnh giới.
- **5 phẩm chất** (mỗi phẩm một màu): Thường ×1, Tinh phẩm ×1,25, Cực phẩm ×1,6, Huyền bảo ×2, Thần phẩm ×2,6. Khí vận cao thì dễ ra đồ tốt.
- **Nguồn**: lịch luyện, nhiệm vụ, nạp giới, sự kiện, lò rèn, Binh Khí Phường (Chợ), Sàn giao dịch, phòng đấu giá, kho tông môn.
- **Hiệu ứng pháp khí** (Thường hiếm khi có, Tinh phẩm 0–1, Cực phẩm 1, Huyền bảo 1–2, Thần phẩm 2–3; dung luyện thêm được 1). Giá trị theo bậc và phẩm chất, cường hóa tăng thêm 1% mỗi cấp. Món có hiệu ứng phát hào quang; Huyền bảo, Thần phẩm có vệt sáng quét qua.

| Hiệu ứng | Tác dụng khi mặc |
|---|---|
| Tụ Linh | Tu luyện nhanh hơn |
| Hồi Xuân / Dưỡng Hồn / Tĩnh Tâm | Thể chất / linh hồn / tâm cảnh tăng mỗi năm |
| Phúc Vận | Khí vận cao hơn |
| Phá Giáp | Cộng thẳng chiến lực |
| Thông Thiên | Tăng tỷ lệ đột phá |
| Diên Thọ | Thêm thọ nguyên |
| Tầm Bảo | Lịch luyện dễ nhặt được bảo vật |
| Kim Quang | Tự sinh kim tệ mỗi năm |
| Hộ Mệnh | Có tỷ lệ (tối đa 60%) đỡ một lần tử vong, rồi hiệu ứng vỡ mất. Không cứu được khi hết thọ nguyên. |

**Túi → Trang bị** hiện hình nhân vật ở giữa, các ô trang bị xếp quanh người (vũ khí đeo sau lưng, màu theo phẩm chất). Kho đồ là lưới ô (tối đa 40 món); bấm một ô để xem chỉ số, so sánh với đồ đang mặc và thao tác. Bấm **Mặc vào** thì món đồ bay vào ô tương ứng.

- Món mới tốt hơn **tự trang bị**, đồ cũ vào kho; kho đầy thì tự bán món kém nhất.
- **Khóa** một món để nó không bao giờ bị tự bán, bán đồ kém, đem làm tế phẩm hay phụ liệu.
- **Tự bán theo phẩm chất**: chọn một mức (Thường, Tinh phẩm trở xuống…), đồ mới vào túi thuộc mức đó mà kém hơn đồ đang mặc cùng ô sẽ tự bán. Nút **Bán đồ kém** bán mọi món kém hơn đồ đang mặc.

### Lò rèn

Mở bằng nút **Rèn**. Dựng lò rồi nâng cấp tới **cấp 100**; mỗi cấp tăng phẩm chất đồ rèn, tỷ lệ cường hóa, dung luyện và sản lượng binh khí quân dụng.

- **Chế tạo**: chọn ô và bậc, tốn kim tệ, Huyền thiết và một khỏa ma hạch. Lò cấp 15 mở Hoàng giai, 30 Huyền giai, 45 Địa giai, 60 Thiên giai, 75 Thánh khí (không vượt bậc hợp cảnh giới +1). Cấp lò, dị hỏa và linh hồn càng cao càng dễ ra Huyền bảo, Thần phẩm; bảng hiện sẵn tỷ lệ từng phẩm chất. Món vừa rèn được **trình diện** giữa màn hình với hào quang theo phẩm chất.
- **Tế phẩm**: đốt tối đa 5 món cũ khi chế tạo để tăng tỷ lệ phẩm chất tốt, hoặc khi cường hóa để tăng tỷ lệ thành công lần kế. Món phẩm cao, bậc gần và cường hóa nhiều thì quý hơn.
- **Cường hóa +0 → +100**: mỗi cấp +4% chỉ số chính. Dưới +10 chắc chắn thành công, sau đó giảm dần (thấp nhất 20%), lò cấp cao bù lại. Thất bại chỉ mất nguyên liệu, không tụt cấp. Món đồ đặt trên đe, mỗi nhát búa bắn tia lửa.
- **Đập tự động**: chọn cấp mục tiêu và ngân sách (¼, ½ hoặc toàn bộ kim tệ đang có). Game đập liên tục tới khi đạt cấp, hết ngân sách hoặc hết nguyên liệu, có bảng đếm số lần thử và tiền đã tiêu.
- **Tẩy luyện**: đổ lại ngẫu nhiên các hiệu ứng pháp khí của một món, cả loại lẫn giá trị. Khóa những hiệu ứng muốn giữ (mỗi hiệu ứng khóa làm giá ×1,8). Thanh màu cạnh mỗi hiệu ứng là **độ tốt** của lần tung (80% → 120% giá trị chuẩn).
- **Tẩy tự động**: chọn các hiệu ứng mong muốn, độ tốt tối thiểu (bất kỳ, ≥ 50%, ≥ 80%) và ngân sách; game tẩy tới khi món đồ có đủ.
- **Dung luyện**: chuyển một hiệu ứng từ món phụ liệu sang món chính, phụ liệu tan biến. Hiệu ứng giữ nguyên độ tốt gốc, giá trị tính lại theo bậc và phẩm chất món chính. Món chính chứa được nhiều hơn mức thường một hiệu ứng (đồ Thường cũng mang được 1); khi đầy thì chọn hiệu ứng bị thay. Tỷ lệ thành công khoảng 72%, lò cấp cao tăng thêm, phụ liệu kém bậc thì giảm. Thất bại thì phụ liệu vẫn mất.
- **Xưởng quân dụng**: mỗi năm sản xuất 4 bộ binh khí × cấp lò (dùng tối đa ¼ số kim tệ đang có). Binh khí dùng để giao **hợp đồng quân đội** (Dong Binh Công Hội, cấm quân Gia Mã, Liên quân Trung Châu, Chiến đoàn Cổ tộc…, giá 1,6–2,5 lần giá vốn), bán cho thương nhân, hoặc tự phát cho binh sĩ của bạn (quân có binh khí mạnh hơn 60%).
- Nguyên liệu lấy từ túi trước, thiếu thì lấy từ kho tông môn. Huyền thiết có từ lịch luyện, Chợ, Sàn, Ma tinh khoáng mạch, mỏ lãnh địa và sự kiện *mạch Huyền thiết*.

### Linh thú

**Túi → Linh thú**. Mỗi lúc mang theo một **thú cưng** và cưỡi một **thú cưỡi**; con đang theo cộng hiệu ứng cho bạn và hiện bên cạnh hình nhân vật.

| Thú cưng | Hiệu ứng mỗi cấp | Cần | | Thú cưỡi | Hiệu ứng mỗi cấp | Cần |
|---|---|---|---|---|---|---|
| Tiểu Hỏa Hồ | chiến lực | Đấu Giả | | Truy Phong Lang | thoát hiểm, chiến lực | Đấu Giả |
| Nguyệt Linh Thố | khí vận, tầm bảo | Đấu Giả | | Liệt Hỏa Câu | thoát hiểm, tầm bảo | Đấu Sư |
| Tử Tinh Ưng | tầm bảo, chiến lực | Đấu Sư | | Tử Tinh Dực Sư | thoát hiểm, chiến lực | Đấu Linh |
| Huyền Vũ Quy | hồi thể, thọ nguyên | Đại Đấu Sư | | Kim Sí Đại Bằng | thoát hiểm, tầm bảo | Đấu Hoàng |
| Thôn Thiên Mãng | chiến lực lớn | Đấu Vương | | Thanh Lân Giao Long | thoát hiểm, chiến lực lớn | Đấu Tôn |
| Bạch Ngọc Kỳ Lân | tỷ lệ đột phá, khí vận | Đấu Tông | | | | |

- **Có được**: cứu ma thú nhỏ khi lịch luyện, thuần phục dã thú trên thảo nguyên (sự kiện *Dã thú vô chủ*: đánh cho phục hoặc dụ bằng 3 khỏa ma hạch), hoặc mua ở thú lan (giá tính theo ma hạch cùng cấp, cần đủ cảnh giới).
- **Lên cấp 1 → 10**: cho ăn ma hạch (phẩm càng cao càng nhiều kinh nghiệm, có nút ×10) và tự lớn dần theo năm tháng khi đang theo chủ.
- Chiến lực, hồi phục, thọ nguyên lớn theo bậc cảnh giới; tỷ lệ % thì không.
- Thoát hiểm của thú cưỡi cộng với chiến ngoa, xác suất tử nạn giảm tối đa còn 20%.

### Ngoại trang

**Túi → Ngoại trang**. Chỉ đổi dáng vẻ nhân vật (màu áo, viền, đai, áo choàng, mũ miện, mạng che, hoa văn lửa), không cộng chỉ số. Bộ nào đã mở thì **giữ mãi qua mọi kiếp**.

| Bộ | Cách có |
|---|---|
| Áo vải thô, Thanh sam thư sinh | Có sẵn |
| Hắc bào thiếu niên | Đạt Đấu Sư |
| Đan sư bào | Luyện dược sư 3 phẩm |
| Tuyết y | May bằng kim tệ |
| Huyết chiến giáp | Chiếm 3 vùng đất, hoặc may bằng kim tệ |
| Ma đạo hắc bào | Đi theo ma đạo |
| Tông chủ bào | Khai tông lập phái |
| Viêm đế bào | Thôn phệ 3 dị hỏa |
| Đế bào cửu long | Thành tựu Đấu Đế |

### Sản nghiệp

**Chợ → Sản nghiệp.** Mỗi loại tối đa **100 cấp**, giá cấp sau gấp 1,1 lần. Cứ đủ 25 cấp thì thu nhập sản nghiệp đó **nhân đôi**. Thu nhập tính theo năm, kể cả khi đang bế quan. Có nút mua +1, +10 hoặc tối đa; khoản chi lớn hơn 40% số tiền đang có phải bấm hai lần để xác nhận.

| Sản nghiệp | Giá cấp 1 | Thu / năm mỗi cấp | Ghi chú |
|---|---|---|---|
| Trà lâu | 1.500 | 110 | |
| Dược điền | 8.000 | 600 | Thỉnh thoảng cho dược liệu |
| Đan dược phô | 40.000 | 3.200 | |
| Ma tinh khoáng mạch | 300.000 | 25.000 | Cần Đấu Linh. Mỗi năm đào thêm Huyền thiết |
| Phòng đấu giá | 3.000.000 | 260.000 | Cần Đấu Hoàng |

Có sản nghiệp thì có thể gặp sự kiện *địa đầu xà đòi tiền bảo kê*.

### Tông môn

Mở bằng nút **Môn**. **Điều kiện khai tông:** Đấu Vương, danh vọng ≥ 8, 60.000 kim tệ, không theo Hồn Điện. Bạn tự đặt tên (hoặc bấm *Đổi* để lấy tên ngẫu nhiên); khi đủ điều kiện, game cũng gợi ý bằng một sự kiện.

- **Đệ tử** tự tìm đến theo danh vọng, tới giới hạn = 30 + 40 × cấp Chiêu Hiền Điện + 10 × số lãnh địa + danh vọng. Đệ tử cống nạp mỗi năm và có thể xuất chinh mang chiến lợi phẩm về kho.
- **Trưởng lão** tìm đến qua sự kiện (phí nhập môn + bổng lộc). Trưởng lão tăng thực lực, có thể đi chinh phạt thay bạn, nhưng cũng có thể **phản bội**.
- **Ngân khố**: cống nạp, thuế lãnh địa, tiền bán đồ trong kho đổ vào ngân khố. Chi phí tông môn và quân lương trả từ ngân khố trước, thiếu mới lấy ví. Rút về ví ¼, ½, phần dư hoặc hết; mặc định tự chuyển phần dư trên mức dự trữ hai năm. Ngân khố cạn thì 15% đệ tử bỏ đi.
- **Kho**: nơi chứa nguyên liệu từ mỏ lãnh địa, chiến lợi phẩm đệ tử mang về, kho báu thu được khi chiếm vùng (tối đa 30 món trang bị). Lấy về túi hoặc bán; có tự bán trang bị theo phẩm chất. Đồ trong kho không bị túi tự bán.
- **Hạng tông môn**: Tiểu môn phái → Tông môn tam lưu → nhị lưu → nhất lưu → Bá chủ một phương → Siêu cấp thế lực → Đế tông vạn cổ.

**Công trình** tối đa **100 cấp** (giá gấp 2,2 mỗi cấp tới cấp 6, sau đó gấp 1,08). Mười cấp đầu hiệu quả trọn vẹn, từ cấp 11 mỗi cấp tính 35%:

| Công trình | Giá cấp 1 | Tác dụng |
|---|---|---|
| Tàng Kinh Các | 30.000 | Tu luyện +6% mỗi cấp. Từ cấp 3 đệ tử mạnh hơn. |
| Đan Phòng | 30.000 | Mỗi lượt luyện Tụ Khí Đan và Liệu Thương Đan |
| Diễn Võ Trường | 40.000 | Thực lực tông môn +2,5 mỗi cấp |
| Hộ Sơn Đại Trận | 50.000 | Phòng thủ lãnh địa, mở lựa chọn *cố thủ bằng đại trận* |
| Chiêu Hiền Điện | 25.000 | +40 giới hạn đệ tử mỗi cấp, dễ chiêu mộ trưởng lão |
| Linh Khoáng Đường | 30.000 | Sản lượng mỏ lãnh địa đổ về kho +25% mỗi cấp |
| Doanh Trại | 35.000 | Lập quân đội: +40 quân số mỗi cấp, mở binh chủng ở cấp 5, 15, 30 |

**Thực lực tông môn** = √(đệ tử) × 0,8 (×1 nếu Tàng Kinh Các ≥ 3) + 2 × trưởng lão + 2,5 × cấp hiệu dụng Diễn Võ Trường + 0,4 × số lãnh địa + số đệ tử thân truyền (tối đa 5). **Thế lực** khi chinh chiến = chiến lực bản thân + thực lực tông môn + sức chiến quân đội.

### Quân đội

**Môn → Quân đội**, cần Doanh Trại. Giá binh chủng tính theo giá ma hạch cùng cấp, nên càng về sau càng đắt.

| Binh chủng | Sức chiến | Mở ở Doanh Trại | Ghi chú |
|---|---|---|---|
| Bộ binh | 1 | cấp 1 | Rẻ, đông |
| Cung thủ | 1,5 | cấp 5 | |
| Ma thú kỵ binh | 4 | cấp 15 | Cứ 5 kỵ cần 1 ma hạch |
| Trận pháp sư | 3 | cấp 30 | Sức chiến ×2 khi thủ thành |

- **Sức chiến quân đội** = 1,6 × √(tổng sức chiến × (1 + 60% tỷ lệ có binh khí) × (1 + 2% × cấp huấn luyện)). Căn bậc hai giúp quân đông mạnh nhưng không áp đảo hoàn toàn.
- **Huấn luyện** 0 → 100. **Quân lương** trả mỗi năm; thiếu thì 20% binh sĩ bỏ trốn.
- Có từ 50 quân thì trận chinh phạt có thêm lựa chọn **Đại quân vây thành**: bạn không ra trận nên không có rủi ro tính mạng, nhưng thua thì mất 30% quân.
- Thắng trận mất 3–8% quân, thua mất 15–30%. Sự kiện riêng: binh biến đòi lương, đại diễn tập.

### Bản đồ & chinh phạt

**Môn → Bản đồ** là **sa bàn** đại lục với **28 vùng đất trong 6 khu vực**, vẽ bằng canvas: bờ biển dát vàng, núi đổ bóng, cồn cát Tây Bắc, rừng rậm Thú Vực, núi tuyết Cổ Giới, hư không Hồn Giới. Đất của bạn phủ son viền vàng, khu vực chưa đủ cảnh giới bị sương mù che. Thành trì có viền màu theo độ khó (xanh dễ, vàng cân sức, đỏ khó, nét đứt là chưa tới được). Kéo để di chuyển, lăn chuột hoặc chụm hai ngón để phóng to.

| Khu vực | Mở từ | Vùng (thực lực trấn thủ) |
|---|---|---|
| Gia Mã Đế Quốc | khởi đầu | Ô Thản Thành (50) · Thanh Sơn Trấn (56) · Ma Thú Sơn Mạch (66, ma hạch) · Vân Lam Sơn (74) · Gia Mã Thánh Thành (82) |
| Tây Bắc | khởi đầu | Sa mạc Tháp Qua Nhĩ (86, Huyền thiết) · Hắc Giác Vực (98) · Xuất Vân Đế Quốc (106, dược liệu) · Già Nam Học Viện (116) |
| Trung Châu | | Thiên Bắc Thành (130) · Đan Vực (146, dược liệu) · Hoa Tông (158) · Phong Lôi Bắc Các (170) · Thánh Đan Thành (188, dược liệu) · Phân điện Hồn Điện (204) |
| Thú Vực | Đấu Tôn | Vạn Thú Lĩnh (226, ma hạch) · Thái Hư Cổ Long tộc (248) · Thiên Yêu Hoàng tộc (270) · Cửu U Địa Minh Mãng (292, ma hạch) |
| Cổ Giới | Bán Thánh | Viêm tộc (310) · Dược tộc (330, dược liệu) · Lôi tộc (350) · Thạch tộc (368, Huyền thiết) · Cổ tộc (395) |
| Hồn Giới | Đấu Thánh | Hư Vô Không Gian (430) · Thiên Hồn Thành (480) · Hồn tộc Chủ Điện (540) · Đà Xá Cổ Đế Động Phủ (620) |

- **Chỉ đánh được vùng giáp lãnh địa của mình**; chưa có đất thì bắt đầu ở Gia Mã hoặc Tây Bắc.
- Trận chinh phạt có các lựa chọn: **đích thân dẫn quân**, **đại quân vây thành**, **phái trưởng lão**, **gửi chiến thư ép quy hàng**, hoặc thu quân.
- **Khai phát** lãnh địa tới cấp 100: mỗi cấp +8% thu nhập vùng đó. Mọi vùng đều có mỏ Huyền thiết (vùng quặng gấp năm), vùng ma thú, dược liệu cho thêm sản vật; sản lượng đổ về kho tông môn.
- **Chống bành trướng:** mỗi vùng bạn chiếm khiến mọi vùng còn lại mạnh thêm 3%. Đánh hỏng một vùng phải chờ 2 lượt.
- **Bị tập kích:** lãnh địa càng nhiều càng hay bị đánh. Bạn có thể đích thân ra trận, cố thủ bằng Hộ Sơn Đại Trận, hoặc nhường đất.

### Sự kiện & khoảnh khắc

Khoảng 70 loại sự kiện có lựa chọn, ví dụ:

- **Thơ ấu và thiếu niên**: bị chế giễu là phế vật, thoái hôn, chiếc nhẫn đen, Già Nam Học Viện, bái nhập tông môn.
- **Kỳ ngộ**: ma thú canh linh dược, động phủ viễn cổ, dị hỏa xuất thế, nạp giới, bí tịch ven đường, đốn ngộ, di tích Đấu Đế, mạch Huyền thiết, cứu ma thú nhỏ, dã thú vô chủ.
- **Tranh đấu**: đối thủ khiêu chiến, đại hội tỷ võ, hẹn ước ba năm, Hồn Điện chiêu dụ hoặc truy sát, tâm ma.
- **Tiền bạc**: bảng nhiệm vụ, cướp đường, cứu thương đội, bạn cũ hỏi vay, động phủ rao bán, khách khanh, thương hội bán tháo, khách quý Sàn Vạn Bảo.
- **Lò rèn và quân đội**: chiến tranh làm giá binh khí tăng vọt, luyện khí đại sư ghé thăm, binh biến, đại diễn tập.
- **Hậu kỳ**: Hồn tộc xâm lấn, Thiên Mộ thí luyện, Cổ tộc kết minh, luyện Đế phẩm đan, thần thú Thú Vực, triều kiến Đấu Đế, nhất thống đại lục, Đế chiến.
- **Tình duyên**: kết đạo lữ (phàm nhân hay tu sĩ), đạo lữ bị bắt cóc.

Ngoài ra có hàng chục **khoảnh khắc** nhỏ không cần chọn. Đột phá, đại sự, thành tựu và ngoại trang mới hiện thông báo nổi ở đầu màn hình.

### Đấu Đế và Đế lộ

Thành **Đấu Đế** không kết thúc game: thọ nguyên vô tận, không còn chết vì bệnh tật hay hiểm nguy, bạn tu tiếp tới **100 trọng** (mỗi trọng khoảng 600 năm), mở rộng tông môn, chinh phạt tới tận Hồn Giới. Nút **Đế lộ** trên thanh điều hướng mở bốn phần:

**Đế cảnh**: mỗi 10 trọng ngộ ra một đế pháp.

| Trọng | Đế pháp | Tác dụng |
|---|---|---|
| 10 | Đế uy sơ hiện | Thế lực khi chinh chiến +15 |
| 20 | Đế pháp tự nhiên | Sản lượng mỏ lãnh địa +50% |
| 30 | Vạn pháp quy tông | Tỷ lệ cường hóa +10%, đồ rèn dễ ra phẩm chất cao |
| 40 | Đế ngôn xuất pháp | Phòng thủ của địch khi bị chinh phạt −15% |
| 50 | Đế vực | Phòng thủ lãnh địa +30, truyền thừa thêm 1 ô |
| 60 | Vạn tộc thần phục | Thuế lãnh địa +50%, đệ tử tối đa +300 |
| 70 | Đế uy áp chế | Đối thủ ở phòng đấu giá bỏ cuộc sớm hơn |
| 80 | Thiên địa đồng thọ | Mỗi lượt tự hồi thể chất và tâm cảnh |
| 90 | Bán bộ siêu thoát | Đệ tử xuất chinh gấp đôi, trang bị mang về tốt hơn |
| 100 | Đế cảnh viên mãn | Mở *Phá toái hư không* (phi thăng), truyền thừa thêm 1 ô |

**Nhất thống**: chiếm đủ 28 vùng thì có sự kiện chọn đăng cơ hay phân phong. Khi còn nắm trọn đại lục: thuế lãnh địa ×2, sản lượng mỏ +50%, đệ tử tối đa +500.

**Truyền thừa**: khi quy ẩn hoặc phi thăng, chọn món mang sang kiếp sau (1 ô, thêm ô nhờ đế ấn và đế pháp):

| Món | Kiếp sau nhận được |
|---|---|
| Đế huyết | Tư chất tăng một bậc (tối đa Thiên tài), khí vận +8 |
| Bản mệnh pháp bảo | Một món đang mặc, giữ nửa cấp cường hóa; phong ấn tới khi đủ cảnh giới dùng bậc đó |
| Dị hỏa | Một loại dị hỏa, tự thức tỉnh khi đạt Đấu Linh |
| Bí tịch | Khởi đầu với công pháp và đấu kỹ Huyền giai |
| Đế khố | 5% tài sản (tối đa 200k kim tệ), trao khi tròn 16 tuổi |
| Di sản tông môn | Khai tông lại cùng tên, công trình bắt đầu từ ¼ cấp cũ, phí khai tông giảm một nửa |

Khi đã mãn nguyện, bấm **Truyền thừa** trên thanh trạng thái để chọn món rồi quy ẩn.

### Thượng giới, Đế chiến, trùng sinh

- **Phá toái hư không** (Đấu Đế 100 trọng): ghi ngọc giản truyền thừa rồi phi thăng lên **Thượng giới**, tông môn và quân đội đi theo.
- **Tinh đồ Thượng giới** gồm 9 thánh vực (phòng thủ 680 → 950), bắt đầu từ Phi Thăng Đài, chỉ đánh vùng giáp ranh. Mỗi vùng chiếm được cho +45 thế lực (đế nguyên), cống phẩm, Huyền thiết 9 phẩm và cơ hội thần khí; vùng mới phải bình định 6 lượt mới làm bàn đạp đánh tiếp.
- **Đế chiến** với Thiên Đế diễn ra khi chiếm trọn Thượng giới, hoặc muộn nhất 60 lượt sau phi thăng (Thiên Đế mạnh lên mỗi lượt). Thắng hay thua đều khép kiếp.
- **Trùng sinh**: kiếp sau tư chất ít nhất Thiên tài, dễ ra thể chất đặc thù, tu luyện nhanh hơn, khí vận cao hơn. Đổi lại đại lục khó hơn (địch mạnh hơn 12% mỗi lần trùng sinh) và thưởng cũng nhiều hơn.

### Kết thúc một kiếp

Màn **Bia ký** có di ảnh nhân vật, danh hiệu (Phàm nhân giữa hồng trần, Cường giả trấn quốc, Khai sơn tổ sư, Bá chủ đại lục, Đấu Đế…), nguyên nhân qua đời, biểu đồ cảnh giới theo tuổi, những khoảnh khắc đáng nhớ và *hành trang một đời*. Kiếp đó được ghi vào **Sổ luân hồi** ở trang chủ (giữ 50 kiếp gần nhất).

**Thành tựu:** 33 thành tựu giữ qua mọi kiếp (Phế vật nghịch thiên, Tam hỏa đồng thể, Nhất thống đại lục, Cường hóa +100, Thượng giới chi chủ…), xem ở trang chủ.

---

## Giao diện & chuyển động

**Bố cục theo màn hình**

- **Điện thoại**: bố cục dọc; thanh trạng thái trên, nhật ký giữa, điều khiển dưới; các bảng trượt lên từ đáy.
- **Máy tính bảng**: thanh trạng thái và thanh điều khiển trải ngang.
- **Máy tính**: các bảng thành cửa sổ lớn giữa màn hình; Hành trang và Lò rèn chia hai cột (món đồ / nhân vật bên trái, thao tác bên phải).
- **Màn rộng từ 1280px**: thêm hai cột bên. Bên trái là **nhân vật** (hình nhân vật, ô trang bị, linh thú, chiến lực); bên phải là **thế cục** (vòng đấu khí, tỷ lệ đột phá, thu chi năm qua, lối tắt, tiến độ thành tựu).

**Chuyển động và âm thanh**

- **Mở đầu**: màn mở đầu (giọt mực, núi non, tên game viết bằng nét bút, con dấu) chiếu một lần mỗi phiên. Chuyển màn bằng hiệu ứng mực loang.
- **Cảnh diễn**: giao chiến, thiên mệnh, xung kích cảnh giới như mô tả ở [Đọc màn hình](#đọc-màn-hình). Ngoài ra có búa rèn, trình diện đồ rèn, tư chất quay số, bia ký dựng lên.
- **Hiệu ứng hạt** (đấu khí, tia lửa, sóng xung kích, mực loang) và **âm thanh** (chiêng, trống, búa, va chạm…) đều tạo ngay trong trình duyệt, không cần tệp nên vẫn chơi offline được.
- **Tắt**: âm thanh bật tắt bằng nút loa. Mọi chuyển động tự tắt khi máy bật *giảm chuyển động*. Mọi cảnh diễn đều chạm để bỏ qua.

---

## Lưu trữ & sao lưu

Game tự lưu sau mỗi lượt vào `localStorage` của trình duyệt.

| Khóa | Nội dung |
|---|---|
| `dpnk_save` | Kiếp đang chơi |
| `dpnk_book` | Sổ luân hồi (50 kiếp gần nhất) |
| `dpnk_ach` | Thành tựu |
| `dpnk_wardrobe` | Các bộ ngoại trang đã mở |
| `dpnk_legacy` | Ngọc giản truyền thừa chờ kiếp sau |
| `dpnk_rebirth` | Ngọc giản trùng sinh chờ kiếp sau |
| `dpnk_speed`, `dpnk_feed`, `dpnk_sfx` | Tốc độ, chế độ xem nhật ký, bật/tắt âm thanh |
| `dpnk_intro` (`sessionStorage`) | Đã xem màn mở đầu trong phiên này |

- Bản lưu cũ tự nâng cấp khi có tính năng mới (hàm `migrate` trong [`engine.js`](src/game/engine.js)); ví dụ thú đồng hành cũ tự thành thú cưng.
- **Sao lưu / chuyển máy**: mục sao lưu ở trang chủ xuất một mã `DPNK1.z…` (JSON nén gzip, mã hóa base64) gồm kiếp đang chơi, Sổ luân hồi, ngọc giản truyền thừa, trùng sinh và tủ ngoại trang. Copy mã hoặc tải file `.txt`, rồi dán vào máy khác để khôi phục. Sổ luân hồi và tủ đồ được gộp, không trùng lặp.

## Phím tắt

| Phím | Tác dụng |
|---|---|
| `Space` | Tạm dừng / tiếp tục |
| `Esc` | Ẩn / hiện bảng sự kiện để xem thông số |
| `1` – `6` | Chọn lựa chọn tương ứng |

---

## Dành cho người phát triển

**Công nghệ:** React 19 + Vite, không dùng thư viện UI hay state manager.

- **Logic game** là JavaScript thuần trong `src/game/`, không phụ thuộc React.
- **Chuyển động:** **anime.js** cho các chuỗi nhiều bước (con dấu, búa rèn, cảnh giao chiến); **motion** cho component xuất hiện / biến mất và trang bị bay vào ô.
- **Hiệu ứng và âm thanh:** lớp hạt canvas tự viết; âm thanh tổng hợp bằng WebAudio.
- **Icon:** **react-icons** với bộ [Game Icons](https://game-icons.net) (CC BY 3.0).

### Cấu trúc mã nguồn

```
├── index.html               # khung HTML, font Google, manifest
├── public/                  # manifest.webmanifest, sw.js (service worker), icons/
├── scripts/sim.mjs          # giả lập nhiều kiếp (npm run sim)
├── .claude/skills/dpnk-motion/  # quy ước hoạt ảnh, hiệu ứng, âm thanh
└── src/
    ├── main.jsx             # điểm vào React
    ├── App.jsx              # điều hướng màn hình intro → start → birth → game → end, chế độ #demo
    ├── pwa.js               # đăng ký service worker, nút "cài ứng dụng"
    ├── styles.css           # toàn bộ giao diện (biến màu ở :root)
    ├── fx/
    │   ├── fx.js            # lớp hạt canvas: burst, sparks, vortex, rise, ink, ring, shake, flash
    │   ├── FxLayer.jsx      # canvas phủ toàn màn hình, gắn một lần ở App
    │   └── sfx.js           # âm thanh tổng hợp WebAudio, bật/tắt
    ├── components/
    │   ├── Intro.jsx        # màn mở đầu
    │   ├── Start.jsx        # trang chủ, Sổ luân hồi, thành tựu, bảng cảnh giới
    │   ├── Birth.jsx        # màn sinh ra, đầu thai lại
    │   ├── Game.jsx         # màn chính: HUD, nhật ký, điều khiển, bảng sự kiện, thông báo nổi
    │   ├── Stage.jsx        # cảnh diễn: giao chiến, thiên mệnh, xung kích cảnh giới
    │   ├── Side.jsx         # hai cột bên trên màn rộng
    │   ├── Avatar.jsx       # hình nhân vật SVG nhiều lớp
    │   ├── Bag.jsx          # hành trang: trang bị, linh thú, ngoại trang, vật phẩm
    │   ├── Forge.jsx        # lò rèn: chế tạo, cường hóa, tẩy luyện, dung luyện, xưởng
    │   ├── Market.jsx       # chợ, sàn, đấu giá, sản nghiệp, sổ thu chi
    │   ├── Sect.jsx         # tông môn, kho, ngân khố, quân đội, bản đồ
    │   ├── WorldMap.jsx     # sa bàn đại lục; mapTerrain.js vẽ địa hình bằng canvas
    │   ├── Emperor.jsx      # Đế lộ: đế cảnh, nhất thống, Thượng giới, truyền thừa; UpperMap.jsx là tinh đồ
    │   ├── End.jsx          # bia ký
    │   ├── Backup.jsx       # sao lưu / khôi phục
    │   ├── ui.jsx           # Bar, Sheet, Tabs, Tile, Card, LevelBuy, Hints, Toasts, LifeChart…
    │   ├── gearUi.jsx       # ô và thẻ trang bị dùng chung
    │   ├── motion.js        # nhịp chuyển động chung, các hàm anime.js
    │   ├── icons.jsx        # bảng icon dùng chung
    │   └── glyphs.jsx       # chữ trên con dấu son
    └── game/
        ├── data.js          # MỌI SỐ LIỆU
        ├── engine.js        # vòng lặp lượt (tick), chọn lựa (choose), tổng kết, lưu/đọc, migrate
        ├── events.js        # sự kiện có lựa chọn, khoảnh khắc, câu độn
        ├── util.js          # random, chiến lực, đột phá, áp hiệu ứng, định dạng tiền
        ├── economy.js       # chợ, đan dược, săn bắn, luyện đan, nhiệm vụ, thu chi
        ├── exchange.js      # giá thị trường, ký gửi, đặt mua
        ├── auction.js       # phòng đấu giá
        ├── gear.js          # trang bị, binh khí phường, sản nghiệp
        ├── forge.js         # lò rèn, cường hóa, tẩy luyện, dung luyện, binh khí quân dụng
        ├── beasts.js        # linh thú
        ├── wardrobe.js      # ngoại trang
        ├── sect.js          # tông môn, công trình, lãnh địa, chinh phạt, phòng thủ, ngân khố
        ├── vault.js         # kho tông môn
        ├── army.js          # quân đội
        ├── emperor.js       # đế cảnh, nhất thống, truyền thừa
        ├── upper.js         # Thượng giới, Đế chiến, trùng sinh
        ├── ach.js           # thành tựu
        ├── backup.js        # mã sao lưu
        └── demo.js          # nhân vật dựng sẵn cho #demo
```

**Luồng một lượt** (`tick` trong `engine.js`): tăng tuổi → kiểm tra thọ nguyên và rủi ro tử vong → (6 tuổi) trắc nghiệm đấu khí → hiệu ứng chuyên tâm, sản nghiệp, tông môn, kinh tế, pháp khí, linh thú, tu vi → gia đình và đạo lữ → sự kiện bắt buộc (bình cảnh, hẹn ước, thọ nguyên cạn, Đế chiến) → khoảnh khắc ngẫu nhiên → sự kiện ngẫu nhiên → dòng thu chi.

Trạng thái nhân vật `s` là một object JSON thuần, lưu nguyên vào `localStorage`. Giao diện đọc trực tiếp `s` và gọi `bump()` để vẽ lại. Thêm trường mới vào `s` thì nhớ khởi tạo trong `newLife` và bổ sung giá trị mặc định trong `migrate`.

### Chỉnh cân bằng game

Hầu hết mọi thứ chỉnh trong [`src/game/data.js`](src/game/data.js):

| Muốn… | Sửa |
|---|---|
| Thời gian trôi chậm / nhanh hơn | `yrs` trong `G.REALMS` (năm mỗi lượt), `SPEEDS` trong [`Game.jsx`](src/components/Game.jsx) (ms mỗi lượt) |
| Tu luyện khó / dễ hơn | `yps` (năm cho 1 bậc), `G.ROOTS[].m`, `G.GONG_MULT` |
| Đột phá khó / dễ hơn | `bt` trong `G.REALMS`, hàm `btChance` trong [`util.js`](src/game/util.js) |
| Giàu / nghèo hơn | `G.LIVING`, `G.ALLOWANCE`, `G.ITEMS[].base`, `G.MISSIONS` |
| Trang bị | `G.GEAR`, `G.GEAR_PRICE`, `G.QUALITY`, `G.AFFIX`, `G.AFFIX_COUNT` |
| Tẩy luyện, dung luyện | `G.REFINE` (giá, hệ số khóa), `G.FUSE` (giá, tỷ lệ, số hiệu ứng thêm) |
| Lò rèn | `G.SMITHY`, `G.ORE_FOR_TIER`, `G.BUYERS`; công thức trong [`forge.js`](src/game/forge.js) |
| Linh thú | `G.PETS`, `G.MOUNTS` (hiệu ứng mỗi cấp, giá, cảnh giới), `G.BEAST_MAX`; `xpNeed`, `coreXp` trong [`beasts.js`](src/game/beasts.js) |
| Ngoại trang | `G.OUTFITS` (màu, phụ kiện, điều kiện mở, giá may) |
| Sản nghiệp | `G.ESTATES`, `G.ESTATE_MAX`, `G.ESTATE_GROW` |
| Tông môn | `G.SECT_REQ`, `G.BUILDS`, `G.BUILD_MAX`; `buildCost`, `memberCap`, `sectPower`, `sectYearly` trong [`sect.js`](src/game/sect.js) |
| Quân đội | `G.TROOPS`, `G.TRAIN_MAX`; `armyPower` trong [`army.js`](src/game/army.js) |
| Sàn, đấu giá | `G.MARKETS`, `G.CONSIGN_MAX`, `G.CONSIGN_FEE`, `G.BID_MAX`, `G.AUCTION_EVERY`, `G.AUCTION_OPEN` |
| Bản đồ, chinh phạt | `G.ZONES`, `G.REGIONS`, `G.ROADS`; `regionDef`, `conquerP` |
| Hậu kỳ | `G.DE_CANH`, `G.LEGACY`, `G.UNIFY_BONUS`, `G.UP_REGIONS`, `G.UP_POWER`, `G.UP_SETTLE`, `G.UP_DECHIEN`, `G.NG` |

Sau khi chỉnh, chạy giả lập để xem ảnh hưởng:

```bash
npm run sim -- 1000
```

Kết quả gồm số lỗi runtime, phân bố cảnh giới cuối đời, tuổi thọ trung bình, số lượt và sự kiện mỗi kiếp, thời gian chơi ước tính ở 1×, tỷ lệ khai tông, lò rèn, quân đội và số kiếp thành Đế. Bot chọn ngẫu nhiên nên kết quả chỉ để so sánh tương đối giữa các lần chỉnh.

### Thêm sự kiện mới

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
  title: (s) => 'Tiêu đề',            // tùy chọn; cũng là tên đối thủ trong cảnh giao chiến
  text: (s) => 'Mô tả tình huống.',
  ch: [
    { t: 'Lựa chọn chắc chắn', fx: { tam: 3 }, log: 'Kết quả.' },
    { t: 'Lựa chọn may rủi', fight: 1, roll: (s) => winP(s, peer(s, 1)),
      ok:   { fx: { qi: 60, fame: 1 }, log: 'Thành công!', k: 'good' },
      fail: { fx: { body: -12 }, log: 'Thất bại.', dieP: 0.05, die: 'Nguyên nhân tử vong' } },
  ],
}
```

- `roll` trả về xác suất thành công 0..1; giao diện hiện con số này trên lựa chọn. Thêm `fight: 1` nếu lựa chọn là một trận đánh để diễn cảnh **Giao chiến**; `roll` không có `fight` diễn cảnh **Thiên mệnh**.
- Các khóa của `fx`: `body`, `soul`, `tam`, `luck` (chỉ số) · `qi` (tu vi) · `gold` (tính theo số ma hạch cùng cấp) · `goldAbs` (số kim tệ cụ thể) · `why` (nhãn trong sổ thu chi) · `item: [[loại, phẩm, số lượng]]` · `fame` · `life` (thọ nguyên). Giá trị có thể là hàm `s => số`. Logic tùy ý thì dùng `do: (s) => {...}`.

### Thêm hoạt ảnh, hiệu ứng, âm thanh

Xem quy ước trong [`.claude/skills/dpnk-motion/SKILL.md`](.claude/skills/dpnk-motion/SKILL.md): chọn anime.js hay motion, cách gọi lớp hạt và âm thanh, quy tắc giảm chuyển động và chạm để bỏ qua.

---

## Triển khai (deploy)

`npm run build` tạo thư mục `dist/` gồm toàn file tĩnh, với `base: './'` nên chạy được ở bất kỳ đường dẫn con nào:

- **GitHub Pages**: đẩy nội dung `dist/` lên nhánh `gh-pages`, hoặc dùng GitHub Actions build từ nhánh `main`.
- **Netlify / Vercel / Cloudflare Pages**: lệnh build `npm run build`, thư mục xuất `dist`.

Service worker chỉ bật ở bản build. HTML lấy từ mạng trước để luôn nhận bản mới; JS và CSS có mã hash trong tên file nên được cache lâu dài.

---

*Fan game phi thương mại, lấy cảm hứng từ «Đấu Phá Thương Khung» của Thiên Tằm Thổ Đậu. Icon từ [game-icons.net](https://game-icons.net) (CC BY 3.0).*

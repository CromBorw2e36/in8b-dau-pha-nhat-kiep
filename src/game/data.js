// Đấu Phá · Nhất Kiếp — fan game phi thương mại lấy cảm hứng từ "Đấu Phá Thương Khung" (Thiên Tằm Thổ Đậu).
// Toàn bộ số liệu dưới đây là luật chơi tự đặt, có thể chỉnh tuỳ ý.
const G = {};
export default G;

// st: số bậc (đoạn/tinh) · life: thọ nguyên · yps: số năm tu cho 1 bậc (tư chất chuẩn)
// yrs: số năm trôi qua mỗi lượt · bt: tỷ lệ đột phá cơ bản lên cảnh giới kế tiếp
G.REALMS = [
  { n: 'Đấu Chi Khí', u: 'đoạn', st: 10, life: 80,   yps: 1,   yrs: 1,  bt: 0.9 },
  { n: 'Đấu Giả',     u: 'tinh', st: 9,  life: 90,   yps: 0.8, yrs: 1,  bt: 0.85 },
  { n: 'Đấu Sư',      u: 'tinh', st: 9,  life: 100,  yps: 1.2, yrs: 1,  bt: 0.8 },
  { n: 'Đại Đấu Sư',  u: 'tinh', st: 9,  life: 120,  yps: 2,   yrs: 1,  bt: 0.7 },
  { n: 'Đấu Linh',    u: 'tinh', st: 9,  life: 150,  yps: 5,   yrs: 1,  bt: 0.6 },
  { n: 'Đấu Vương',   u: 'tinh', st: 9,  life: 200,  yps: 10,  yrs: 2,  bt: 0.5 },
  { n: 'Đấu Hoàng',   u: 'tinh', st: 9,  life: 280,  yps: 22,  yrs: 2,  bt: 0.4 },
  { n: 'Đấu Tông',    u: 'tinh', st: 9,  life: 400,  yps: 45,  yrs: 3,  bt: 0.3 },
  { n: 'Đấu Tôn',     u: 'tinh', st: 9,  life: 700,  yps: 100, yrs: 4, bt: 0.15 },
  { n: 'Bán Thánh',   u: '',     st: 1,  life: 1000, yps: 1200, yrs: 5, bt: 0.08 },
  { n: 'Đấu Thánh',   u: 'tinh', st: 9,  life: 1600, yps: 250, yrs: 5, bt: 0.01 },
  { n: 'Đấu Đế',      u: '',     st: 1,  life: Infinity, yps: 1, yrs: 1, bt: 0 },
];

G.ROOTS = [
  { n: 'Kinh mạch bế tắc', m: 0.15, p: 3,   d: 'Đấu khí vừa ngưng tụ đã tiêu tán. Ai cũng gọi bạn là phế vật.' },
  { n: 'Hạ phẩm',          m: 0.6,  p: 42,  d: 'Tư chất bình thường như phần lớn người trên đại lục.' },
  { n: 'Trung phẩm',       m: 1.0,  p: 36,  d: 'Có chút thiên phú, đủ để trưởng bối để mắt tới.' },
  { n: 'Thượng phẩm',      m: 1.5,  p: 14,  d: 'Thiên phú hơn người, được kỳ vọng sẽ làm rạng danh gia tộc.' },
  { n: 'Thiên tài',        m: 2.2,  p: 4.4, d: 'Ngàn người mới có một. Tốc độ tu luyện khiến người khác kinh hãi.' },
  { n: 'Thể chất đặc thù', m: 3.0,  p: 0.6, d: 'Thể chất trời sinh hiếm thấy, vạn người khó gặp.' },
];
G.SPECIAL_BODIES = ['Viêm Mạch Chi Thể', 'Bất Diệt Kim Thân', 'Thiên Độc Thể', 'Linh Hồn Thiên Sinh'];

G.ATTRS = [['Hỏa', 14], ['Mộc', 12], ['Thủy', 14], ['Phong', 12], ['Lôi', 8], ['Thổ', 14], ['Kim', 12], ['Băng', 7], ['Ám', 5]];

// wealth: 0 nghèo · 1 khá · 2 giàu · 3 cổ tộc
G.ORIGINS = [
  { id: 'orphan',   w: 12, wealth: 0, gold: 0,     n: 'Cô nhi lưu lạc ở Hắc Giác Vực', fx: { body: 6, tam: -4, luck: 4 } },
  { id: 'farm',     w: 30, wealth: 0, gold: 20,    n: 'Con nhà nông ở một trấn nhỏ thuộc Gia Mã Đế Quốc', fx: { body: 3, tam: 3 } },
  { id: 'merchant', w: 20, wealth: 1, gold: 300,   n: 'Con nhà buôn ở thành Thanh Sơn', fx: { soul: 3 } },
  { id: 'clan',     w: 18, wealth: 1, gold: 500,   n: 'Con cháu chi thứ của một gia tộc ở Ô Thản Thành', clan: true, fx: {} },
  { id: 'clanmain', w: 8,  wealth: 2, gold: 3000,  n: 'Thiếu chủ một đại gia tộc ở Gia Mã Đế Quốc', clan: true, fx: { tam: -3 } },
  { id: 'alch',     w: 8,  wealth: 1, gold: 800,   n: 'Con một luyện dược sư ở Xuất Vân Đế Quốc', fireAttr: true, fx: { soul: 10 } },
  { id: 'ancient',  w: 2,  wealth: 3, gold: 30000, n: 'Hậu duệ một Viễn Cổ chủng tộc ở Trung Châu', clan: true, rootUp: true, fx: { body: 6, soul: 4 } },
];

G.TRAITS = [
  { id: 'firm',    icon: '🪨', n: 'Kiên nghị',         d: 'Tâm cảnh khó lay động', init: { tam: 8 }, neg: { tam: 0.7 } },
  { id: 'wise',    icon: '💡', n: 'Ngộ tính cao',      d: 'Tu luyện nhanh hơn 15%', init: { soul: 3 }, qi: 1.15 },
  { id: 'tough',   icon: '💪', n: 'Thân thể cường tráng', d: 'Thể chất vượt trội', init: { body: 10 }, neg: { body: 0.8 } },
  { id: 'soulful', icon: '👁️', n: 'Linh hồn nhạy bén', d: 'Linh hồn lực mạnh, hợp làm luyện dược sư', init: { soul: 10 }, pos: { soul: 1.3 } },
  { id: 'lucky',   icon: '🍀', n: 'Phúc tinh',         d: 'Hay gặp kỳ ngộ', init: { luck: 15 } },
  { id: 'fierce',  icon: '🔥', n: 'Hiếu chiến',        d: 'Chiến lực +2, hay vướng vào giao tranh', init: { body: 3 }, cp: 2 },
  { id: 'proud',   icon: '🦅', n: 'Tâm cao khí ngạo',  d: 'Vui buồn đều mãnh liệt', init: {}, pos: { tam: 1.3 }, neg: { tam: 1.3 } },
  { id: 'romance', icon: '🌸', n: 'Đào hoa',           d: 'Dễ gặp tri kỷ', init: { luck: 3 } },
];
G.TRAIT_CONFLICT = [['firm', 'proud']];
G.RING_TRAIT = { id: 'ring', icon: '💍', n: 'Chiếc nhẫn đen của mẹ', d: 'Bên trong dường như có thứ gì đó đang ngủ say…', init: {} };

// Dị hỏa: [tên, hạng trên Dị Hỏa Bảng]. Hạng càng nhỏ càng mạnh.
G.FIRES = [
  ['Hư Vô Thôn Viêm', 2], ['Tịnh Liên Yêu Hỏa', 3], ['Kim Đế Phần Thiên Viêm', 4], ['Sinh Linh Chi Diễm', 5],
  ['Bát Hoang Phá Diệt Diễm', 6], ['Cửu U Kim Tổ Hỏa', 7], ['Hồng Liên Nghiệp Hỏa', 8], ['Tam Thiên Diễm Viêm Hỏa', 9],
  ['Cửu U Phong Viêm', 10], ['Cốt Linh Lãnh Hỏa', 11], ['Cửu Long Lôi Cương Hỏa', 12], ['Vẫn Lạc Tâm Viêm', 13],
  ['Hải Tâm Diễm', 14], ['Thanh Liên Địa Tâm Hỏa', 19],
];

G.GRADES = ['—', 'Hoàng giai', 'Huyền giai', 'Địa giai', 'Thiên giai'];
G.GONG_MULT = [0.85, 1.0, 1.25, 1.6, 2.0];

G.STATS = [
  { k: 'body', icon: '💪', n: 'Thể chất' },
  { k: 'soul', icon: '👁️', n: 'Linh hồn' },
  { k: 'tam',  icon: '🪷', n: 'Tâm cảnh' },
  { k: 'luck', icon: '🍀', n: 'Khí vận' },
];
G.ICON = { body: '💪', soul: '👁️', tam: '🪷', luck: '🍀', gold: '💰', qi: '🌀', item: '🎒' };

// money: gợi ý dòng tiền (+ kiếm được, − tốn kém) chỉ để hiển thị
G.FOCUS = [
  { id: 'tu',   icon: '🧘', n: 'Khổ tu',         d: 'Bế quan ngưng luyện đấu khí. Uống Tụ Khí Đan (nếu có) để tu nhanh hơn.', qi: 1.5, fx: { tam: 0.6, body: -0.3 }, money: -1 },
  { id: 'lich', icon: '⚔️', n: 'Lịch luyện',     d: 'Săn ma thú lấy ma hạch, hái linh dược. Nhiều cơ duyên lẫn hiểm nguy.', qi: 0.9, fx: { body: 1.6, tam: 0.3 }, money: 1, ev: 1.7 },
  { id: 'nv',   icon: '📋', n: 'Nhận nhiệm vụ',  d: 'Nhận nhiệm vụ ở Dong Binh Công Hội hoặc tông môn để lấy thù lao.', qi: 0.8, fx: { tam: 0.2 }, money: 1 },
  { id: 'duoc', icon: '⚗️', n: 'Luyện dược',     d: 'Mua dược liệu, luyện đan để dùng hoặc đem bán. Nghề hái ra tiền.', qi: 0.6, fx: { soul: 1.6 }, alch: true, money: 1 },
  { id: 'ky',   icon: '📜', n: 'Tu đấu kỹ',      d: 'Khổ luyện đấu kỹ, tăng chiến lực.', qi: 0.7, fx: { body: 1.1 }, skill: true },
  { id: 'tinh', icon: '🍵', n: 'Tĩnh tâm',       d: 'Tham ngộ thiên địa, ổn định tâm cảnh.', qi: 0.5, fx: { tam: 2.2, soul: 0.6 } },
  { id: 'tong', icon: '🏯', n: 'Chưởng quản tông môn', d: 'Dạy dỗ đệ tử, mở rộng thế lực. Đệ tử tăng nhanh, cống nạp nhiều, lãnh địa yên ổn.', qi: 0.7, fx: { tam: 0.8, soul: 0.4 }, sect: true, money: 1 },
];

// ───── Trang bị ─────
// Bậc 1..5. Vũ khí tăng chiến lực, hộ giáp giảm thương tổn thể chất, bảo vật tăng tốc tu luyện.
G.TIERS = ['—', 'Phàm khí', 'Hoàng giai', 'Huyền giai', 'Địa giai', 'Thiên giai'];
G.GEAR = {
  wep: { n: 'Vũ khí', cp: [0, 1.5, 3, 5, 8, 12],
    names: ['Huyền Trọng Xích', 'Thanh Phong Kiếm', 'Tử Kim Thương', 'Hắc Long Đao', 'Lôi Âm Chùy', 'Băng Phách Kiếm', 'Phần Thiên Kích'] },
  arm: { n: 'Hộ giáp', cp: [0, 0.6, 1.2, 2, 3.2, 5], def: [0, 0.08, 0.14, 0.2, 0.27, 0.35],
    names: ['Hộ Tâm Kính', 'Ma Lân Giáp', 'Huyền Quy Giáp', 'Tử Vân Bào', 'Kim Tàm Y', 'Long Lân Chiến Giáp'] },
  acc: { n: 'Bảo vật', cp: [0, 0.3, 0.6, 1, 1.6, 2.5], qi: [0, 0.04, 0.08, 0.13, 0.2, 0.3],
    names: ['Tụ Linh Ngọc Bội', 'Thần Hồn Châu', 'Ẩn Linh Giới', 'Huyết Ngọc Trâm', 'Thanh Tâm Linh Châu', 'Cửu Thiên Hộ Phù'] },
};
G.GEAR_PRICE = [0, 400, 5000, 70000, 1000000, 18000000];
// Phẩm chất: [hệ số, tên, trọng số xuất hiện]
G.QUALITY = [[1, 'Thường', 70], [1.25, 'Tinh phẩm', 24], [1.6, 'Cực phẩm', 6]];
G.ARMORY_MAX = 10;

// ───── Sản nghiệp: mỗi cấp tăng một phần thu nhập/năm, giá cấp sau gấp 1.7 ─────
G.ESTATES = [
  { id: 'tra',  n: 'Trà lâu',            price: 1500,    inc: 110,    d: 'Nơi giang hồ tụ tập nghe ngóng tin tức. Lời ít mà đều.' },
  { id: 'dien', n: 'Dược điền',          price: 8000,    inc: 600,    d: 'Ruộng linh dược. Có tiền, thỉnh thoảng thu thêm dược liệu.', herb: true },
  { id: 'pho',  n: 'Đan dược phô',       price: 40000,   inc: 3200,   d: 'Cửa hàng đan dược ở thành lớn.' },
  { id: 'mo',   n: 'Ma tinh khoáng mạch', price: 300000,  inc: 25000,  d: 'Mỏ ma tinh, nguồn tài nguyên mà tông môn nào cũng thèm khát.', minR: 4 },
  { id: 'dg',   n: 'Phòng đấu giá',      price: 3000000, inc: 260000, d: 'Một chi nhánh phòng đấu giá. Tiền vào như nước.', minR: 6 },
];
G.ESTATE_MAX = 5;

// ───── Tông môn ─────
G.SECT_REQ = { R: 5, fame: 8, gold: 60000 };
G.SECT_TIERS = ['Tiểu môn phái', 'Tông môn tam lưu', 'Tông môn nhị lưu', 'Tông môn nhất lưu', 'Bá chủ một phương', 'Siêu cấp thế lực'];
G.BUILDS = [
  { id: 'kinh', n: 'Tàng Kinh Các',   base: 30000, d: 'Tốc độ tu luyện của bạn +6% mỗi cấp. Cấp 3 trở lên đệ tử mạnh hơn.' },
  { id: 'dan',  n: 'Đan Phòng',       base: 30000, d: 'Mỗi lượt luyện ra Tụ Khí Đan và Liệu Thương Đan cho bạn.' },
  { id: 'vo',   n: 'Diễn Võ Trường',  base: 40000, d: 'Thế lực tông môn +2.5 mỗi cấp khi chinh chiến.' },
  { id: 'tran', n: 'Hộ Sơn Đại Trận', base: 50000, d: 'Phòng thủ lãnh địa khi bị tập kích.' },
  { id: 'hien', n: 'Chiêu Hiền Điện', base: 25000, d: 'Thu nhận thêm 40 đệ tử mỗi cấp, dễ chiêu mộ trưởng lão.' },
];
G.BUILD_MAX = 5;
G.SECT_NAME = {
  a: ['Thiên', 'Huyền', 'Tử', 'Thanh', 'Viêm', 'Lôi', 'Băng', 'Vân', 'Thái Hư', 'Cửu U', 'Phần', 'Tinh'],
  b: ['Kiếm', 'Đan', 'Viêm', 'Vân', 'Long', 'Nguyệt', 'Hải', 'Phong', 'Huyết', 'Ngọc'],
  c: ['Tông', 'Môn', 'Cốc', 'Các', 'Điện', 'Phủ'],
};

// ───── Lãnh địa trên bản đồ ─────
// def: thực lực trấn thủ · inc: thu nhập mỗi năm khi chiếm được
G.REGIONS = [
  { id: 'otan',      n: 'Ô Thản Thành',          z: 'Gia Mã Đế Quốc',   own: 'Gia Liệt gia',           def: 50,  inc: 4000,    d: 'Thành nhỏ biên cương, ba đại gia tộc tranh hùng.' },
  { id: 'thanhson',  n: 'Thanh Sơn Trấn',        z: 'Gia Mã Đế Quốc',   own: 'Lang Đầu Dong Binh Đoàn', def: 56,  inc: 5500,    d: 'Cửa ngõ vào Ma Thú Sơn Mạch, dong binh đông như kiến.' },
  { id: 'mathu',     n: 'Ma Thú Sơn Mạch',       z: 'Gia Mã Đế Quốc',   own: 'Tử Tinh Dực Sư Vương',   def: 66,  inc: 9000,    d: 'Rừng sâu đầy ma thú. Chiếm được sẽ thu ma hạch mỗi năm.', item: 'core' },
  { id: 'giama',     n: 'Gia Mã Thánh Thành',    z: 'Gia Mã Đế Quốc',   own: 'Hoàng thất Gia Mã',      def: 78,  inc: 26000,   d: 'Kinh đô đế quốc, phồn hoa bậc nhất.' },
  { id: 'thapqua',   n: 'Sa mạc Tháp Qua Nhĩ',   z: 'Tây Bắc',          own: 'Xà Nhân tộc',            def: 84,  inc: 22000,   d: 'Biển cát mênh mông, nghe đồn có dị hỏa ẩn dưới lòng đất.' },
  { id: 'hacgiac',   n: 'Hắc Giác Vực',          z: 'Tây Bắc',          own: 'Hắc Ấn Thành',           def: 96,  inc: 60000,   d: 'Vùng đất hỗn loạn, kẻ mạnh làm vua.' },
  { id: 'xuatvan',   n: 'Xuất Vân Đế Quốc',      z: 'Tây Bắc',          own: 'Độc Tông',               def: 104, inc: 90000,   d: 'Đế quốc do độc sư nắm quyền.', item: 'herb' },
  { id: 'thienbac',  n: 'Thiên Bắc Thành',       z: 'Trung Châu',       own: 'Thiên Bắc Tống gia',     def: 125, inc: 260000,  d: 'Thành trì phía bắc Trung Châu, nơi giao thương sầm uất.' },
  { id: 'danvuc',    n: 'Đan Vực',               z: 'Trung Châu',       own: 'Đan Tháp phân bộ',       def: 142, inc: 700000,  d: 'Thánh địa của luyện dược sư.', item: 'herb' },
  { id: 'phongloi',  n: 'Phong Lôi Bắc Các',     z: 'Trung Châu',       own: 'Phong Lôi Các',          def: 160, inc: 1500000, d: 'Một trong tứ các của Trung Châu.' },
  { id: 'hondien',   n: 'Phân điện Hồn Điện',    z: 'Trung Châu',       own: 'Hồn Điện',               def: 178, inc: 3000000, d: 'Hang ổ của Hồn Điện. Tiêu diệt nơi này, cả đại lục sẽ biết tên bạn.' },
  { id: 'thanhthanh', n: 'Thánh Thành Trung Châu', z: 'Trung Châu',      own: 'Liên minh Cổ tộc',       def: 200, inc: 8000000, d: 'Trung tâm của Đấu Khí Đại Lục.' },
];

// ───── Kinh tế ─────
// Giá gốc ở cấp/phẩm 1, mỗi cấp đắt gấp 3. Chợ mua vào 70% giá, bán ra 115% giá.
G.ITEMS = {
  core: { icon: '🔮', n: (g) => `Ma hạch cấp ${g}`,         base: 100, d: 'Tinh hoa của ma thú. Đem bán hoặc đổi tài nguyên.' },
  herb: { icon: '🌿', n: (g) => `Dược liệu ${g} phẩm`,       base: 40,  d: 'Nguyên liệu luyện đan. Mỗi lò cần 2 phần.' },
  tuk:  { icon: '💊', n: (g) => `Tụ Khí Đan ${g} phẩm`,      base: 300, d: 'Tự động dùng khi khổ tu, giúp đấu khí ngưng tụ nhanh hơn.', use: true },
  lieu: { icon: '🩹', n: (g) => `Liệu Thương Đan ${g} phẩm`, base: 240, d: 'Hồi phục thể chất. Tự dùng khi trọng thương.', use: true },
  pha:  { icon: '⚡', n: (g) => `Phá Chướng Đan ${g} phẩm`,  base: 750, d: 'Dùng khi đột phá bình cảnh để tăng tỷ lệ thành công.' },
};
// Phẩm đan dược phù hợp với từng cảnh giới
G.PILL_NEED = [1, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 9];
// Sinh hoạt phí mỗi năm theo cảnh giới (ăn ở, y phục, đi lại)
G.LIVING = [60, 80, 120, 200, 350, 600, 1000, 1800, 3000, 5000, 8000, 0];
// Gia đình chu cấp mỗi năm theo xuất thân (đến 16 tuổi đủ, 16–19 một nửa)
G.ALLOWANCE = [0, 60, 400, 4000];
// Thừa kế khi phụ mẫu qua đời
G.INHERIT = [30, 400, 5000, 60000];
// Giá công pháp/đấu kỹ ở phòng đấu giá
G.GONG_PRICE = [0, 2000, 30000, 500000, 10000000];
// Giá động phủ: tăng 12% tốc độ tu luyện mỗi cấp
G.DWELLING = [[0, ''], [15000, 'Động phủ linh khí'], [150000, 'Động phủ trên linh mạch'], [2000000, 'Động phủ trên long mạch']];

// Bảng nhiệm vụ. risk: độ nguy hiểm · pay: hệ số thù lao (theo giá ma hạch cùng cấp)
G.MISSIONS = [
  { n: () => 'Canh giữ dược viên cho một gia tộc',         risk: 0.2, pay: 0.5 },
  { n: () => 'Giao một lô hàng quý đến thành bên',          risk: 0.35, pay: 0.7 },
  { n: () => 'Hộ tống thương đội băng qua Ma Thú Sơn Mạch', risk: 0.6, pay: 1.0 },
  { n: (g) => `Hái linh dược ${g} phẩm trên vách núi hiểm trở`, risk: 0.7, pay: 0.6, item: 'herb' },
  { n: (g) => `Săn ma thú cấp ${g}, mang về ma hạch`,       risk: 1.0, pay: 0.7, item: 'core' },
  { n: () => 'Tiêu diệt một băng đạo phỉ quấy nhiễu',       risk: 1.2, pay: 1.4, fame: 1 },
  { n: () => 'Truy bắt một tên phản đồ đang lẩn trốn',      risk: 1.3, pay: 1.6, fame: 1 },
];

G.NAMES = {
  s: ['Lâm', 'Mộ', 'Diệp', 'Hàn', 'Lăng', 'Tô', 'Bạch', 'Vân', 'Lạc', 'Mạc', 'Thạch', 'Phong', 'Cổ', 'Liễu', 'Hạ', 'Tần'],
  m: ['Thần', 'Phong', 'Vũ', 'Hạo', 'Dật', 'Trần', 'Uyên', 'Kiếm', 'Hiên', 'Viễn', 'Thiên Hành', 'Bất Phàm', 'Trường Không', 'Mặc'],
  f: ['Nguyệt', 'Tuyết', 'Linh', 'Dao', 'Vân Nhi', 'Huân', 'Yên', 'Tịch', 'Ngưng Sương', 'Thanh Tuyền', 'Uyển', 'Lưu Ly'],
};

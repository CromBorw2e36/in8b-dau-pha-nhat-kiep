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
  { n: 'Đấu Đế',      u: 'trọng', st: 100, life: Infinity, yps: 30, yrs: 5, bt: 0 },
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
// Bậc 1..6, 5 ô. Cường hóa +0 → +100: mỗi cấp +4% chỉ số chính.
G.TIERS = ['—', 'Phàm khí', 'Hoàng giai', 'Huyền giai', 'Địa giai', 'Thiên giai', 'Thánh khí'];
G.GEAR_SLOTS = ['wep', 'arm', 'acc', 'rng', 'boo'];
G.GEAR = {
  wep: { n: 'Vũ khí', cp: [0, 1.5, 3, 5, 8, 12, 18],
    names: ['Huyền Trọng Xích', 'Thanh Phong Kiếm', 'Tử Kim Thương', 'Hắc Long Đao', 'Lôi Âm Chùy', 'Băng Phách Kiếm', 'Phần Thiên Kích'] },
  arm: { n: 'Hộ giáp', cp: [0, 0.6, 1.2, 2, 3.2, 5, 7.5], def: [0, 0.08, 0.14, 0.2, 0.27, 0.35, 0.45],
    names: ['Hộ Tâm Kính', 'Ma Lân Giáp', 'Huyền Quy Giáp', 'Tử Vân Bào', 'Kim Tàm Y', 'Long Lân Chiến Giáp'] },
  acc: { n: 'Bảo vật', cp: [0, 0.3, 0.6, 1, 1.6, 2.5, 4], qi: [0, 0.04, 0.08, 0.13, 0.2, 0.3, 0.45],
    names: ['Tụ Linh Ngọc Bội', 'Thần Hồn Châu', 'Huyết Ngọc Trâm', 'Thanh Tâm Linh Châu', 'Cửu Thiên Hộ Phù'] },
  rng: { n: 'Giới chỉ', cp: [0, 0.3, 0.6, 1, 1.6, 2.5, 4], bt: [0, 0.01, 0.02, 0.03, 0.045, 0.06, 0.08],
    names: ['Tử Ngọc Giới', 'Huyền Băng Giới', 'Cốt Linh Giới', 'Hỏa Vân Giới', 'Thiên Hồn Giới', 'Ẩn Linh Giới'] },
  boo: { n: 'Chiến ngoa', cp: [0, 0.4, 0.8, 1.4, 2.2, 3.4, 5], dodge: [0, 0.06, 0.1, 0.15, 0.2, 0.26, 0.33],
    names: ['Phong Hành Ngoa', 'Truy Vân Ngoa', 'Lôi Ảnh Ngoa', 'Tử Điện Ngoa', 'Hư Không Ngoa', 'Lăng Thiên Ngoa'] },
};
G.GEAR_PRICE = [0, 400, 5000, 70000, 1000000, 18000000, 150000000];
// Phẩm chất: [hệ số, tên, trọng số xuất hiện]
G.QUALITY = [[1, 'Thường', 70], [1.25, 'Tinh phẩm', 24], [1.6, 'Cực phẩm', 6], [2, 'Huyền bảo', 1.2], [2.6, 'Thần phẩm', 0.25]];
G.ARMORY_MAX = 40;
G.ENHANCE_MAX = 100;
// Phẩm Huyền thiết cần cho từng bậc trang bị
G.ORE_FOR_TIER = [1, 1, 2, 4, 6, 8, 9];

// ───── Lò rèn (Luyện Khí Phòng): cấp 1..100 ─────
// Mở bậc chế tạo, tăng phẩm chất, tỷ lệ cường hóa và sản lượng binh khí quân dụng.
G.SMITHY = { price: 2500, grow: 1.11, max: 100 };
// Người mua binh khí quân dụng theo hợp đồng. minR: cảnh giới tối thiểu để họ tìm đến.
G.BUYERS = [
  { n: 'Dong Binh Công Hội Thanh Sơn', minR: 0 },
  { n: 'Cấm quân Gia Mã Đế Quốc', minR: 2 },
  { n: 'Biên quân Xuất Vân Đế Quốc', minR: 3 },
  { n: 'Hắc Ấn Thành', minR: 4 },
  { n: 'Hộ vệ Đan Tháp', minR: 6 },
  { n: 'Liên quân Trung Châu', minR: 7 },
  { n: 'Chiến đoàn Cổ tộc', minR: 9 },
];

// ───── Sản nghiệp: tối đa 100 cấp, giá cấp sau gấp 1,1. Cứ 25 cấp thu nhập ×2. ─────
G.ESTATES = [
  { id: 'tra',  n: 'Trà lâu',            price: 1500,    inc: 110,    d: 'Nơi giang hồ tụ tập nghe ngóng tin tức. Lời ít mà đều.' },
  { id: 'dien', n: 'Dược điền',          price: 8000,    inc: 600,    d: 'Ruộng linh dược. Có tiền, thỉnh thoảng thu thêm dược liệu.', herb: true },
  { id: 'pho',  n: 'Đan dược phô',       price: 40000,   inc: 3200,   d: 'Cửa hàng đan dược ở thành lớn.' },
  { id: 'mo',   n: 'Ma tinh khoáng mạch', price: 300000,  inc: 25000,  d: 'Mỏ ma tinh. Mỗi năm đào thêm Huyền thiết cho lò rèn.', minR: 4, ore: true },
  { id: 'dg',   n: 'Phòng đấu giá',      price: 3000000, inc: 260000, d: 'Một chi nhánh phòng đấu giá. Tiền vào như nước.', minR: 6 },
];
G.ESTATE_MAX = 100;
G.ESTATE_GROW = 1.1;

// ───── Tông môn ─────
G.SECT_REQ = { R: 5, fame: 8, gold: 60000 };
G.SECT_TIERS = ['Tiểu môn phái', 'Tông môn tam lưu', 'Tông môn nhị lưu', 'Tông môn nhất lưu', 'Bá chủ một phương', 'Siêu cấp thế lực', 'Đế tông vạn cổ'];
// Công trình tối đa 100 cấp. Hiệu quả: 10 cấp đầu tính đủ, từ cấp 11 mỗi cấp tính 35%.
G.BUILDS = [
  { id: 'kinh',  n: 'Tàng Kinh Các',   base: 30000, d: 'Tốc độ tu luyện của bạn +6% mỗi cấp. Cấp 3 trở lên đệ tử mạnh hơn.' },
  { id: 'dan',   n: 'Đan Phòng',       base: 30000, d: 'Mỗi lượt luyện ra Tụ Khí Đan và Liệu Thương Đan cho bạn.' },
  { id: 'vo',    n: 'Diễn Võ Trường',  base: 40000, d: 'Thế lực tông môn +2,5 mỗi cấp khi chinh chiến.' },
  { id: 'tran',  n: 'Hộ Sơn Đại Trận', base: 50000, d: 'Phòng thủ lãnh địa khi bị tập kích.' },
  { id: 'hien',  n: 'Chiêu Hiền Điện', base: 25000, d: 'Thu nhận thêm 40 đệ tử mỗi cấp, dễ chiêu mộ trưởng lão.' },
  { id: 'doanh', n: 'Doanh Trại',      base: 35000, d: 'Lập quân đội. Mỗi cấp thêm 40 quân số, mở binh chủng mới ở cấp 5, 15 và 30.' },
];
G.BUILD_MAX = 100;
G.SECT_NAME = {
  a: ['Thiên', 'Huyền', 'Tử', 'Thanh', 'Viêm', 'Lôi', 'Băng', 'Vân', 'Thái Hư', 'Cửu U', 'Phần', 'Tinh'],
  b: ['Kiếm', 'Đan', 'Viêm', 'Vân', 'Long', 'Nguyệt', 'Hải', 'Phong', 'Huyết', 'Ngọc'],
  c: ['Tông', 'Môn', 'Cốc', 'Các', 'Điện', 'Phủ'],
};

// ───── Quân đội ─────
// pow: sức chiến · cost/up: giá chiêu mộ và quân lương mỗi năm (tính theo giá ma hạch cùng cấp) · lv: cấp Doanh Trại cần
G.TROOPS = [
  { id: 'bo',   n: 'Bộ binh',        pow: 1,   cost: 0.04, up: 0.004, lv: 1,  d: 'Đệ tử ngoại môn cầm binh khí. Rẻ và đông.' },
  { id: 'cung', n: 'Cung thủ',       pow: 1.5, cost: 0.07, up: 0.006, lv: 5,  d: 'Bắn đấu khí tiễn từ xa, giữ thành rất tốt.' },
  { id: 'ky',   n: 'Ma thú kỵ binh', pow: 4,   cost: 0.22, up: 0.016, lv: 15, d: 'Cưỡi ma thú xung trận. Cứ 5 kỵ cần thêm 1 ma hạch cùng cấp.', core: true },
  { id: 'phap', n: 'Trận pháp sư',   pow: 3,   cost: 0.26, up: 0.02,  lv: 30, d: 'Bày trận. Khi thủ thành, sức chiến tính gấp đôi.' },
];
G.TRAIN_MAX = 100;

// ───── Bản đồ đại lục ─────
// def: thực lực trấn thủ · inc: thu nhập mỗi năm khi chiếm được · xy: vị trí trên bản đồ (640×440)
// Chỉ đánh được vùng liền kề lãnh địa của mình. Chưa có đất thì bắt đầu ở khu vực có start.
G.ZONES = [
  { n: 'Gia Mã Đế Quốc', start: true },
  { n: 'Tây Bắc', start: true },
  { n: 'Trung Châu' },
  { n: 'Thú Vực', minR: 8 },
  { n: 'Cổ Giới', minR: 9 },
  { n: 'Hồn Giới', minR: 10 },
];
G.REGIONS = [
  { id: 'otan',     z: 0, xy: [70, 404],  n: 'Ô Thản Thành',         own: 'Gia Liệt gia',            def: 50,  inc: 4000,      d: 'Thành nhỏ biên cương, ba đại gia tộc tranh hùng.' },
  { id: 'thanhson', z: 0, xy: [128, 360], n: 'Thanh Sơn Trấn',       own: 'Lang Đầu Dong Binh Đoàn', def: 56,  inc: 5500,      d: 'Cửa ngõ vào Ma Thú Sơn Mạch, dong binh đông như kiến.' },
  { id: 'mathu',    z: 0, xy: [52, 318],  n: 'Ma Thú Sơn Mạch',      own: 'Tử Tinh Dực Sư Vương',    def: 66,  inc: 9000,      d: 'Rừng sâu đầy ma thú. Mỗi năm thu thêm ma hạch.', item: 'core' },
  { id: 'vanlam',   z: 0, xy: [196, 326], n: 'Vân Lam Sơn',          own: 'Vân Lam Tông',            def: 74,  inc: 14000,     d: 'Tông môn lớn nhất Gia Mã, đệ tử khắp nơi.' },
  { id: 'giama',    z: 0, xy: [206, 404], n: 'Gia Mã Thánh Thành',   own: 'Hoàng thất Gia Mã',       def: 82,  inc: 26000,     d: 'Kinh đô đế quốc, phồn hoa bậc nhất.' },
  { id: 'thapqua',  z: 1, xy: [64, 240],  n: 'Sa mạc Tháp Qua Nhĩ',  own: 'Xà Nhân tộc',             def: 86,  inc: 22000,     d: 'Biển cát mênh mông, lòng đất đầy quặng Huyền thiết.', item: 'ore' },
  { id: 'hacgiac',  z: 1, xy: [178, 252], n: 'Hắc Giác Vực',         own: 'Hắc Ấn Thành',            def: 98,  inc: 60000,     d: 'Vùng đất hỗn loạn, kẻ mạnh làm vua.' },
  { id: 'xuatvan',  z: 1, xy: [86, 158],  n: 'Xuất Vân Đế Quốc',     own: 'Độc Tông',                def: 106, inc: 90000,     d: 'Đế quốc do độc sư nắm quyền. Dược liệu quý mọc khắp núi.', item: 'herb' },
  { id: 'gianam',   z: 1, xy: [198, 168], n: 'Già Nam Học Viện',     own: 'Viện trưởng Già Nam',     def: 116, inc: 120000,    d: 'Học viện mạnh nhất phương bắc, dưới lòng đất là Thiên Phần Luyện Khí Tháp.' },
  { id: 'thienbac', z: 2, xy: [286, 134], n: 'Thiên Bắc Thành',      own: 'Thiên Bắc Tống gia',      def: 130, inc: 260000,    d: 'Thành trì phía bắc Trung Châu, giao thương sầm uất.' },
  { id: 'danvuc',   z: 2, xy: [292, 310], n: 'Đan Vực',              own: 'Đan Tháp phân bộ',        def: 146, inc: 700000,    d: 'Thánh địa của luyện dược sư.', item: 'herb' },
  { id: 'hoatong',  z: 2, xy: [326, 222], n: 'Hoa Tông',             own: 'Hoa Tông',                def: 158, inc: 1100000,   d: 'Tông môn toàn nữ đệ tử, kiếm pháp như mưa hoa.' },
  { id: 'phongloi', z: 2, xy: [388, 128], n: 'Phong Lôi Bắc Các',    own: 'Phong Lôi Các',           def: 170, inc: 1500000,   d: 'Một trong tứ các của Trung Châu.' },
  { id: 'thanhdan', z: 2, xy: [410, 222], n: 'Thánh Đan Thành',      own: 'Đan Tháp tổng bộ',        def: 188, inc: 4000000,   d: 'Trung tâm của Trung Châu, nơi Đan Tháp đặt tổng bộ.', item: 'herb' },
  { id: 'hondien',  z: 2, xy: [392, 322], n: 'Phân điện Hồn Điện',   own: 'Hồn Điện',                def: 204, inc: 3000000,   d: 'Hang ổ của Hồn Điện. Tiêu diệt nơi này, cả đại lục sẽ biết tên bạn.' },
  { id: 'vanthu',   z: 3, xy: [486, 342], n: 'Vạn Thú Lĩnh',         own: 'Bách tộc ma thú',         def: 226, inc: 6000000,   d: 'Cửa vào Thú Vực, ma thú cấp tám nhiều như cỏ.', item: 'core' },
  { id: 'thaihu',   z: 3, xy: [512, 408], n: 'Thái Hư Cổ Long tộc',  own: 'Long Hoàng',              def: 248, inc: 9000000,   d: 'Long tộc viễn cổ, kho báu chất cao như núi.' },
  { id: 'thienyeu', z: 3, xy: [580, 330], n: 'Thiên Yêu Hoàng tộc',  own: 'Thiên Yêu Hoàng',         def: 270, inc: 12000000,  d: 'Hoàng tộc chim yêu, nhanh như sấm chớp.' },
  { id: 'cuuu',     z: 3, xy: [600, 408], n: 'Cửu U Địa Minh Mãng',  own: 'Mãng tộc',                def: 292, inc: 15000000,  d: 'Đầm lầy chín tầng địa ngục, ma hạch đen như mực.', item: 'core' },
  { id: 'viem',     z: 4, xy: [482, 198], n: 'Viêm tộc',             own: 'Viêm tộc tộc trưởng',     def: 310, inc: 20000000,  d: 'Một trong bát cổ tộc, sinh ra đã khống chế hỏa diễm.' },
  { id: 'duoctoc',  z: 4, xy: [500, 92],  n: 'Dược tộc',             own: 'Dược tộc',                def: 330, inc: 25000000,  d: 'Cổ tộc luyện dược, dược viên trải dài trăm dặm.', item: 'herb' },
  { id: 'loi',      z: 4, xy: [560, 150], n: 'Lôi tộc',              own: 'Lôi tộc',                 def: 350, inc: 30000000,  d: 'Cổ tộc mang huyết mạch lôi đình.' },
  { id: 'thach',    z: 4, xy: [606, 232], n: 'Thạch tộc',            own: 'Thạch tộc',               def: 368, inc: 35000000,  d: 'Thân thể cứng như kim thạch, mỏ quặng nhiều vô kể.', item: 'ore' },
  { id: 'cotoc',    z: 4, xy: [604, 74],  n: 'Cổ tộc',               own: 'Cổ tộc',                  def: 395, inc: 45000000,  d: 'Đứng đầu bát tộc, giữ cánh cửa vào Cổ Giới.' },
  { id: 'hvkg',     z: 5, xy: [282, 52],  n: 'Hư Vô Không Gian',     own: 'Hồn tộc tiên phong',      def: 430, inc: 60000000,  d: 'Khe nứt không gian dẫn vào Hồn Giới.' },
  { id: 'thienhon', z: 5, xy: [356, 30],  n: 'Thiên Hồn Thành',      own: 'Hồn tộc',                 def: 480, inc: 80000000,  d: 'Thành trì của Hồn tộc, linh hồn bị giam trong từng viên gạch.' },
  { id: 'chudien',  z: 5, xy: [432, 52],  n: 'Hồn tộc Chủ Điện',     own: 'Hồn Thiên Đế',            def: 540, inc: 100000000, d: 'Nơi Hồn Thiên Đế ngự trị.' },
  { id: 'daxa',     z: 5, xy: [356, 86],  n: 'Đà Xá Cổ Đế Động Phủ', own: 'Không ai làm chủ',        def: 620, inc: 150000000, d: 'Động phủ của Đà Xá Cổ Đế. Ai nắm được nơi này sẽ là chủ đại lục.' },
];
// Đường nối giữa các vùng (hai chiều)
G.ROADS = [
  ['otan', 'thanhson'], ['otan', 'giama'], ['thanhson', 'mathu'], ['thanhson', 'vanlam'], ['vanlam', 'giama'],
  ['mathu', 'thapqua'], ['vanlam', 'hacgiac'], ['thapqua', 'hacgiac'], ['thapqua', 'xuatvan'], ['hacgiac', 'gianam'], ['xuatvan', 'gianam'],
  ['gianam', 'thienbac'], ['hacgiac', 'danvuc'], ['giama', 'danvuc'], ['thienbac', 'hoatong'], ['thienbac', 'phongloi'], ['danvuc', 'hoatong'],
  ['danvuc', 'hondien'], ['hoatong', 'thanhdan'], ['phongloi', 'thanhdan'], ['thanhdan', 'hondien'],
  ['hondien', 'vanthu'], ['vanthu', 'thaihu'], ['vanthu', 'thienyeu'], ['thaihu', 'cuuu'], ['thienyeu', 'cuuu'],
  ['thanhdan', 'viem'], ['phongloi', 'duoctoc'], ['viem', 'loi'], ['duoctoc', 'loi'], ['loi', 'thach'], ['loi', 'cotoc'], ['duoctoc', 'cotoc'], ['thach', 'thienyeu'], ['viem', 'thach'],
  ['thienbac', 'hvkg'], ['phongloi', 'thienhon'], ['hvkg', 'thienhon'], ['thienhon', 'chudien'], ['chudien', 'duoctoc'],
  ['hvkg', 'daxa'], ['thienhon', 'daxa'], ['chudien', 'daxa'],
];
G.DEV_MAX = 100;

// ───── Kinh tế ─────
// Giá gốc ở cấp/phẩm 1, mỗi cấp đắt gấp 3. Chợ mua vào 70% giá, bán ra 115% giá, nhân với chỉ số thị trường.
// mk: nhóm hàng dùng chung một chỉ số giá
G.ITEMS = {
  core: { n: (g) => `Ma hạch cấp ${g}`,         base: 100,  mk: 'core', d: 'Tinh hoa của ma thú. Đem bán, rèn trang bị hoặc nuôi kỵ binh.' },
  herb: { n: (g) => `Dược liệu ${g} phẩm`,       base: 40,   mk: 'herb', d: 'Nguyên liệu luyện đan. Mỗi lò cần 2 phần.' },
  ore:  { n: (g) => `Huyền thiết ${g} phẩm`,     base: 60,   mk: 'ore',  d: 'Nguyên liệu chế tạo và cường hóa trang bị.' },
  tuk:  { n: (g) => `Tụ Khí Đan ${g} phẩm`,      base: 300,  mk: 'pill', d: 'Tự động dùng khi khổ tu, giúp đấu khí ngưng tụ nhanh hơn.', use: true },
  lieu: { n: (g) => `Liệu Thương Đan ${g} phẩm`, base: 240,  mk: 'pill', d: 'Hồi phục thể chất. Tự dùng khi trọng thương.', use: true },
  pha:  { n: (g) => `Phá Chướng Đan ${g} phẩm`,  base: 750,  mk: 'pill', d: 'Dùng khi đột phá bình cảnh để tăng tỷ lệ thành công.' },
  hon:  { n: (g) => `Dưỡng Hồn Đan ${g} phẩm`,   base: 520,  mk: 'pill', d: 'Tăng linh hồn lực. Đan đúng phẩm +6 linh hồn.', use: true },
  calm: { n: (g) => `Thanh Tâm Đan ${g} phẩm`,   base: 420,  mk: 'pill', d: 'Trấn tĩnh đạo tâm. Đan đúng phẩm +10 tâm cảnh.', use: true },
  tho:  { n: (g) => `Diên Thọ Đan ${g} phẩm`,    base: 2600, mk: 'pill', d: 'Kéo dài thọ nguyên. Uống càng nhiều càng kém hiệu quả.', use: true },
};
// Nhóm hàng trên thị trường, giá dao động mỗi lượt quanh mức 1
G.MARKETS = { core: 'Ma hạch', herb: 'Dược liệu', ore: 'Huyền thiết', pill: 'Đan dược', gear: 'Trang bị', arms: 'Binh khí quân dụng' };
G.CONSIGN_MAX = 8;
G.CONSIGN_FEE = 0.05;
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

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
  { n: 'Đấu Đế',      u: 'trọng', st: 100, life: Infinity, yps: 600, yrs: 5, bt: 0 }, // tu chậm: mỗi 10 trọng mở một đế pháp
];

// Đế cảnh tinh tu: mỗi 10 trọng Đấu Đế ngộ ra một đế pháp, hiệu quả cộng dồn
// fx: power thế lực · mine sản lượng mỏ · enh tỷ lệ cường hóa · craft phẩm chất đồ rèn · def làm yếu địch khi chinh phạt
//     guard phòng thủ · tax thuế lãnh địa · members đệ tử tối đa · auc hạ giá trần đối thủ đấu giá · regen hồi phục
//     raid đệ tử xuất chinh · slot ô truyền thừa · ascend mở phi thăng
G.DE_CANH = [
  { at: 10,  n: 'Đế uy sơ hiện',     d: 'Thế lực khi chinh chiến +15.', fx: { power: 15 } },
  { at: 20,  n: 'Đế pháp tự nhiên',  d: 'Sản lượng mỏ lãnh địa +50%.', fx: { mine: 0.5 } },
  { at: 30,  n: 'Vạn pháp quy tông', d: 'Tỷ lệ cường hóa +10%, đồ rèn dễ ra phẩm chất cao.', fx: { enh: 0.1, craft: 1 } },
  { at: 40,  n: 'Đế ngôn xuất pháp', d: 'Chinh phạt: phòng thủ của địch giảm 15%.', fx: { def: 0.15 } },
  { at: 50,  n: 'Đế vực',            d: 'Phòng thủ lãnh địa +30. Ngọc giản truyền thừa thêm 1 ô.', fx: { guard: 30, slot: 1 } },
  { at: 60,  n: 'Vạn tộc thần phục', d: 'Thuế lãnh địa +50%, đệ tử tối đa +300.', fx: { tax: 0.5, members: 300 } },
  { at: 70,  n: 'Đế uy áp chế',      d: 'Đối thủ ở phòng đấu giá bỏ cuộc sớm hơn (giá trần −20%).', fx: { auc: 0.2 } },
  { at: 80,  n: 'Thiên địa đồng thọ', d: 'Mỗi lượt tự hồi thể chất và tâm cảnh.', fx: { regen: 1 } },
  { at: 90,  n: 'Bán bộ siêu thoát', d: 'Đệ tử xuất chinh gấp đôi, trang bị mang về tốt hơn.', fx: { raid: 1 } },
  { at: 100, n: 'Đế cảnh viên mãn',  d: 'Mở «Phá toái hư không»: phi thăng thay vì quy ẩn. Truyền thừa thêm 1 ô.', fx: { slot: 1, ascend: 1 } },
];
// Truyền thừa: món mang sang kiếp sau khi Đấu Đế quy ẩn / phi thăng
G.LEGACY = [
  { id: 'blood', n: 'Đế huyết',        d: 'Kiếp sau tư chất tăng một bậc (tối đa Thiên tài), khí vận +8.' },
  { id: 'gear',  n: 'Bản mệnh pháp bảo', d: 'Một món trang bị đang mặc, giữ nửa cấp cường hóa. Phong ấn tới khi đủ cảnh giới dùng bậc đó.' },
  { id: 'fire',  n: 'Dị hỏa',          d: 'Một loại dị hỏa, tự thức tỉnh khi kiếp sau đạt Đấu Linh.' },
  { id: 'gong',  n: 'Bí tịch',         d: 'Kiếp sau khởi đầu với công pháp và đấu kỹ Huyền giai (nếu kiếp này đã có).' },
  { id: 'gold',  n: 'Đế khố',          d: 'Một phần tài sản (5%, tối đa 200k kim tệ) trao lại khi kiếp sau tròn 16 tuổi.' },
  { id: 'sect',  n: 'Di sản tông môn', d: 'Khai tông lại cùng tên, công trình khởi đầu bằng 1/4 cấp cũ, phí khai tông giảm một nửa.' },
];
G.UNIFY_BONUS = { tax: 1, mine: 0.5, members: 500 }; // phần thưởng khi nắm trọn đại lục

// ───── Thượng giới: mở sau khi phá toái hư không phi thăng ─────
// xy theo khung 400×300 của tinh đồ · def: phòng thủ · inc: cống phẩm mỗi năm
G.UP_REGIONS = [
  { id: 'phithang', xy: [52, 250],  n: 'Phi Thăng Đài',      own: 'Tiếp Dẫn Sứ',          def: 680,  inc: 2e8,   d: 'Nơi kẻ phi thăng từ hạ giới đặt chân, bị các thế lực canh giữ.', start: true },
  { id: 'vanlinh',  xy: [128, 196], n: 'Vạn Linh Thánh Vực',  own: 'Vạn Linh Tộc',          def: 710,  inc: 2.6e8, d: 'Thảo nguyên linh khí đặc quánh, linh thú thành bầy.' },
  { id: 'tinhha',   xy: [70, 120],  n: 'Tinh Hà Cổ Đạo',      own: 'Tinh Thần Các',         def: 740,  inc: 3.2e8, d: 'Con đường lát bằng tinh thần vụn, nối các thánh vực.' },
  { id: 'luyenthan',xy: [200, 250], n: 'Luyện Thần Lô',       own: 'Đan Thần Điện',         def: 770,  inc: 4e8,   d: 'Lò đan cổ cao vạn trượng, lửa chưa từng tắt.' },
  { id: 'thiencot', xy: [196, 140], n: 'Thiên Cốt Sơn',       own: 'Cổ Thần Tộc',           def: 800,  inc: 5e8,   d: 'Núi xếp từ xương thần thú viễn cổ.' },
  { id: 'hongmong', xy: [142, 58],  n: 'Hồng Mông Hải',       own: 'Hồng Mông Thánh Địa',   def: 830,  inc: 6.4e8, d: 'Biển hỗn độn, sóng là đạo văn chưa thành hình.' },
  { id: 'luanhoi',  xy: [282, 196], n: 'Luân Hồi Cốc',        own: 'Luân Hồi Điện',         def: 860,  inc: 8e8,   d: 'Nơi linh hồn đi qua trước khi chuyển thế.' },
  { id: 'cuuthien', xy: [272, 90],  n: 'Cửu Thiên Thần Khuyết', own: 'Cửu Thiên Đế Tộc',    def: 890, inc: 1e9,   d: 'Chín tầng cung khuyết lơ lửng giữa trời.' },
  { id: 'thiende',  xy: [352, 140], n: 'Thiên Đế Điện',       own: 'Thiên Đế',              def: 950, inc: 1.4e9, d: 'Ngai vàng của kẻ đứng đầu thượng giới.' },
];
G.UP_ROADS = [
  ['phithang', 'vanlinh'], ['phithang', 'luyenthan'], ['vanlinh', 'tinhha'], ['vanlinh', 'thiencot'], ['vanlinh', 'luyenthan'],
  ['tinhha', 'hongmong'], ['thiencot', 'hongmong'], ['thiencot', 'luanhoi'], ['luyenthan', 'luanhoi'], ['thiencot', 'cuuthien'],
  ['hongmong', 'cuuthien'], ['luanhoi', 'thiende'], ['cuuthien', 'thiende'],
];
G.UP_POWER = 45;      // đế nguyên: thế lực cộng thêm cho mỗi vùng thượng giới đã chiếm
G.UP_SETTLE = 6;      // vùng vừa chiếm cần ngần ấy lượt bình định mới làm bàn đạp đánh tiếp
G.UP_DECHIEN = { base: 1000, grow: 3, after: 60 }; // Đế chiến: thực lực Thiên Đế, tăng mỗi lượt; muộn nhất sau 60 lượt
// Trùng sinh sau Đế chiến: ng = số lần, mỗi lần đại lục khó hơn và thưởng nhiều hơn
G.NG = { def: 0.12, peer: 2, inc: 0.15, qi: 0.15, luck: 3, special: 0.15 };

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
// Bậc 1..6, 5 ô. Cường hóa +0 → +12: mỗi cấp +10% chỉ số chính.
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
// Phẩm chất: [hệ số, tên, trọng số xuất hiện]. Chí Tôn không rơi ra, chỉ đạt được bằng luyện hóa
G.QUALITY = [[1, 'Thường', 70], [1.25, 'Tinh phẩm', 24], [1.6, 'Cực phẩm', 6], [2, 'Huyền bảo', 1.2], [2.6, 'Thần phẩm', 0.25], [3.4, 'Chí Tôn', 0]];
G.ARMORY_MAX = 40;

// ───── Hiệu ứng pháp khí ─────
// Trang bị phẩm chất cao mang hiệu ứng đặc biệt. base: giá trị ở bậc 1, nhân theo bậc và phẩm chất khi rèn ra.
// fmt: cách hiện giá trị · d: mô tả ngắn
G.AFFIX = [
  { id: 'tulinh',     n: 'Tụ Linh',    base: 0.03,  fmt: 'pct', d: 'tu luyện nhanh hơn' },
  { id: 'hoixuan',    n: 'Hồi Xuân',   base: 0.4,   fmt: 'num', d: 'thể chất hồi mỗi năm' },
  { id: 'duonghon',   n: 'Dưỡng Hồn',  base: 0.15,  fmt: 'num', d: 'linh hồn tăng mỗi năm' },
  { id: 'tinhtam',    n: 'Tĩnh Tâm',   base: 0.25,  fmt: 'num', d: 'tâm cảnh tăng mỗi năm' },
  { id: 'phucvan',    n: 'Phúc Vận',   base: 2,     fmt: 'num', d: 'khí vận' },
  { id: 'phagiap',    n: 'Phá Giáp',   base: 1.2,   fmt: 'num', d: 'chiến lực' },
  { id: 'thongthien', n: 'Thông Thiên', base: 0.01, fmt: 'pct', d: 'tỷ lệ đột phá' },
  { id: 'dientho',    n: 'Diên Thọ',   base: 4,     fmt: 'yr',  d: 'thọ nguyên' },
  { id: 'tambao',     n: 'Tầm Bảo',    base: 0.12,  fmt: 'pct', d: 'cơ hội nhặt được bảo vật' },
  { id: 'kimquang',   n: 'Kim Quang',  base: 0.04,  fmt: 'gold', d: 'kim tệ tự sinh mỗi năm' },
  { id: 'homenh',     n: 'Hộ Mệnh',    base: 0.08,  fmt: 'pct', d: 'cơ hội đỡ một lần tử vong (pháp khí vỡ)' },
  { id: 'cuonghuyet', n: 'Cuồng Huyết', base: 0.012, fmt: 'pct', d: 'chiến lực nhân thêm' },
  { id: 'thietcot',   n: 'Thiết Cốt',  base: 0.01,  fmt: 'pct', d: 'giảm nguy cơ tử nạn' },
  { id: 'luyenkhi',   n: 'Luyện Khí',  base: 0.006, fmt: 'pct', d: 'tỷ lệ cường hóa và dung luyện' },
  { id: 'thienhoa',   n: 'Thiên Hỏa',  base: 0.06,  fmt: 'num', d: 'cơ hội rèn ra đồ phẩm cao' },
  { id: 'khoangmach', n: 'Khoáng Mạch', base: 0.03, fmt: 'pct', d: 'sản lượng mỏ tông môn' },
  { id: 'tutai',      n: 'Tụ Tài',     base: 0.02,  fmt: 'pct', d: 'thuế thu từ lãnh địa' },
  { id: 'dotkich',    n: 'Đột Kích',   base: 0.03,  fmt: 'pct', d: 'số lần tông môn đi cướp mỗi năm' },
];
// Số hiệu ứng theo phẩm chất: [tối thiểu, tối đa]
G.AFFIX_COUNT = [[0, 0], [0, 1], [1, 1], [1, 2], [2, 3], [9, 9]];
G.ENHANCE_MAX = 12;
// Tỷ lệ thành công gốc theo cấp hiện tại: +0..+5 chắc chắn, sau đó giảm dần tới +12
G.ENHANCE_P = [1, 1, 1, 1, 1, 1, 0.85, 0.72, 0.6, 0.48, 0.36, 0.25];
// Tẩy luyện: đổ lại các hiệu ứng chưa khóa. Giá theo giá trang bị, mỗi hiệu ứng khóa nhân thêm `lock`.
G.REFINE = { gold: 0.08, lock: 1.8 };
// Dung luyện: chuyển một hiệu ứng từ món phụ liệu sang món chính (phụ liệu mất đi).
// Món chính chứa bình thường (số hiệu ứng tối đa theo phẩm chất + extra), tối thiểu 1.
// Luyện hóa: nhồi vượt mức đó tới `max`; mỗi hiệu ứng vượt hạn giảm tỷ lệ `over` và nhân giá `overGold`.
// Đủ `max` hiệu ứng thì món đồ hóa Chí Tôn.
G.FUSE = { gold: 0.15, p: 0.72, extra: 1, max: 9, over: 0.05, overGold: 1.45 };

// ───── Linh thú: thú cưng (đồng hành chiến đấu) và thú cưỡi (tọa kỵ) ─────
// Nuôi bằng ma hạch tới cấp 10. fx: hiệu ứng mỗi cấp, dùng chung mã với hiệu ứng pháp khí, nhân theo bậc cảnh giới.
// dodge: giảm xác suất tử nạn (cộng với chiến ngoa). price: giá tính theo số ma hạch cùng cấp; minR: cảnh giới để mua.
G.BEAST_MAX = 10;
G.PETS = [
  { id: 'ho', n: 'Tiểu Hỏa Hồ', d: 'Hồ ly lửa tinh quái, phun lửa đỡ đòn cho chủ.', fx: { phagiap: 0.22 }, price: 40, minR: 1 },
  { id: 'tho', n: 'Nguyệt Linh Thố', d: 'Thỏ trắng ăn ánh trăng, đi đâu cũng gặp may.', fx: { phucvan: 0.7, tambao: 0.012 }, price: 60, minR: 1 },
  { id: 'ung', n: 'Tử Tinh Ưng', d: 'Chim ưng mắt tím, nhìn thấu bảo vật giấu kín.', fx: { tambao: 0.03, phagiap: 0.08 }, price: 90, minR: 2 },
  { id: 'quy', n: 'Huyền Vũ Quy', d: 'Rùa đen sống vạn năm, khí tức trường thọ lan sang chủ nhân.', fx: { hoixuan: 0.12, dientho: 0.8 }, price: 160, minR: 3 },
  { id: 'mang', n: 'Thôn Thiên Mãng', d: 'Mãng xà nuốt trời, lớn lên thành hung thú đáng sợ.', fx: { phagiap: 0.36 }, price: 320, minR: 5 },
  { id: 'lan', n: 'Bạch Ngọc Kỳ Lân', d: 'Thánh thú cát tường, giúp chủ nhân vượt bình cảnh.', fx: { thongthien: 0.0035, phucvan: 0.5 }, price: 600, minR: 7 },
];
G.MOUNTS = [
  { id: 'lang', n: 'Truy Phong Lang', d: 'Sói gió chạy như bay, thoát hiểm nhanh như chớp.', fx: { dodge: 0.008, phagiap: 0.05 }, price: 30, minR: 1 },
  { id: 'cau', n: 'Liệt Hỏa Câu', d: 'Ngựa lửa ngày đi nghìn dặm, lịch luyện thêm nhiều chiến lợi phẩm.', fx: { dodge: 0.008, tambao: 0.015 }, price: 70, minR: 2 },
  { id: 'su', n: 'Tử Tinh Dực Sư', d: 'Sư tử có cánh, cưỡi vào trận như hổ thêm cánh.', fx: { dodge: 0.01, phagiap: 0.16 }, price: 180, minR: 4 },
  { id: 'bang', n: 'Kim Sí Đại Bằng', d: 'Một cánh chín vạn dặm, chẳng hiểm cảnh nào giữ chân được.', fx: { dodge: 0.016, tambao: 0.02 }, price: 380, minR: 6 },
  { id: 'giao', n: 'Thanh Lân Giao Long', d: 'Giao long sắp hóa rồng, uy áp khiến kẻ địch run sợ.', fx: { dodge: 0.012, phagiap: 0.3 }, price: 800, minR: 8 },
];
// Thú đồng hành cũ (chỉ lưu tên) đổi sang thú cưng mới
G.PET_LEGACY = { 'Tiểu Hỏa Hồ': 'ho', 'Tử Tinh Ưng': 'ung', 'Thôn Thiên Mãng con': 'mang', 'Bạch Ngọc Kỳ Lân con': 'lan' };

// ───── Ngoại trang: chỉ đổi dáng vẻ, mở khóa giữ qua mọi kiếp ─────
// c: [áo, viền, đai, áo trong] · x: phụ kiện (cape, hood, crown, veil, armor, flame)
// open: điều kiện mở khóa trong một kiếp · buy: giá tính theo số ma hạch cùng cấp nếu mua được
G.OUTFITS = [
  { id: 'vai', n: 'Áo vải thô', c: ['#6b5a47', '#3a2f24', '#8a6b3a', '#d9cdb5'], how: 'Có sẵn' },
  { id: 'thanh', n: 'Thanh sam thư sinh', c: ['#3e6f86', '#cfe3ea', '#20414f', '#eef4f2'], how: 'Có sẵn' },
  { id: 'hac', n: 'Hắc bào thiếu niên', c: ['#1d1714', '#c9432f', '#c9432f', '#e9dcc4'], how: 'Đạt Đấu Sư', open: (s) => s.R >= 2 },
  { id: 'dan', n: 'Đan sư bào', c: ['#ece3cf', '#d9ad5b', '#b0402c', '#ffffff'], x: ['veil'], how: 'Luyện dược sư 3 phẩm', open: (s) => s.alch >= 3 },
  { id: 'tuyet', n: 'Tuyết y', c: ['#e8eef2', '#8fb6cc', '#5b7f96', '#ffffff'], x: ['veil'], how: 'Mua', buy: 120 },
  { id: 'chien', n: 'Huyết chiến giáp', c: ['#6d1a0e', '#d9ad5b', '#2b1a10', '#c9432f'], x: ['armor', 'cape'], how: 'Chiếm 3 vùng đất', open: (s) => Object.keys(s.land || {}).length >= 3, buy: 400 },
  { id: 'ma', n: 'Ma đạo hắc bào', c: ['#2a1834', '#8e4fd1', '#14091c', '#4d2a63'], x: ['hood'], how: 'Đi theo ma đạo', open: (s) => !!s.evil },
  { id: 'tong', n: 'Tông chủ bào', c: ['#4a2a6b', '#f4d58f', '#d9ad5b', '#efe2ff'], x: ['cape', 'crown'], how: 'Khai tông lập phái', open: (s) => !!s.sect },
  { id: 'viem', n: 'Viêm đế bào', c: ['#8a2418', '#f2c063', '#e0602a', '#ffd9a8'], x: ['flame', 'cape'], how: 'Thôn phệ 3 dị hỏa', open: (s) => s.fires.length >= 3 },
  { id: 'de', n: 'Đế bào cửu long', c: ['#b8862d', '#fff3df', '#6d1a0e', '#fff3df'], x: ['crown', 'cape', 'flame'], how: 'Thành tựu Đấu Đế', open: (s) => s.R >= 11 },
];
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
  { id: 'khoang', n: 'Linh Khoáng Đường', base: 30000, d: 'Quản các mỏ trên lãnh địa. Sản lượng huyền thiết, ma hạch, dược liệu đổ về kho +25% mỗi cấp.' },
  { id: 'doanh', n: 'Doanh Trại',      base: 35000, d: 'Lập quân đội. Mỗi cấp thêm 40 quân số, mở binh chủng mới ở cấp 5, 15 và 30.' },
];
G.BUILD_MAX = 100;
G.VAULT_GEAR_MAX = 30; // kho tông môn chứa tối đa bao nhiêu món trang bị
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
G.BID_MAX = 6; // số đơn đặt mua treo cùng lúc
G.AUCTION_EVERY = 6; // phòng đấu giá mở phiên mỗi 6 lượt
G.AUCTION_OPEN = 3; // mỗi phiên kéo dài 3 lượt
G.STACK_MAX = 999; // mỗi chồng vật phẩm cộng dồn tối đa 999 (túi và kho tông môn)
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

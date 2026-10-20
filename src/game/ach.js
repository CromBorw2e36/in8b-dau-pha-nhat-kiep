import G from './data.js';
import { landCount } from './sect.js';
import { troopCount } from './army.js';

// Thành tựu: giữ qua mọi kiếp, lưu riêng trong trình duyệt
const KEY = 'dpnk_ach';
export const ACH = [
  { id: 'r1', g: 'Giả', n: 'Bước chân đầu tiên', d: 'Đạt Đấu Giả.', t: (s) => s.R >= 1 },
  { id: 'r5', g: 'Vương', n: 'Xưng vương một cõi', d: 'Đạt Đấu Vương.', t: (s) => s.R >= 5 },
  { id: 'r7', g: 'Tông', n: 'Đấu Tông', d: 'Đạt Đấu Tông, có thể đạp không mà đi.', t: (s) => s.R >= 7 },
  { id: 'r10', g: 'Thánh', n: 'Thánh giả', d: 'Đạt Đấu Thánh.', t: (s) => s.R >= 10 },
  { id: 'r11', g: 'Đế', n: 'Vạn cổ nhất đế', d: 'Thành tựu Đấu Đế.', t: (s) => s.R >= 11 },
  { id: 'de50', g: 'Vực', n: 'Đế vực', d: 'Đấu Đế 50 trọng.', t: (s) => s.R >= 11 && s.step >= 50 },
  { id: 'r11x', g: 'Cực', n: 'Đế cảnh viên mãn', d: 'Đấu Đế 100 trọng.', t: (s) => s.R >= 11 && s.step >= 100 },
  { id: 'waste', g: 'Nghịch', n: 'Phế vật nghịch thiên', d: 'Sinh ra với kinh mạch bế tắc mà vẫn đạt Đấu Vương.', t: (s) => s.root === 0 && s.R >= 5 },
  { id: 'fire3', g: 'Hỏa', n: 'Tam hỏa đồng thể', d: 'Thôn phệ ba loại dị hỏa.', t: (s) => s.fires.length >= 3 },
  { id: 'alch9', g: 'Đan', n: 'Cửu phẩm luyện dược sư', d: 'Đạt luyện dược sư 9 phẩm.', t: (s) => s.alch >= 9 },
  { id: 'sect', g: 'Môn', n: 'Khai sơn lập phái', d: 'Lập tông môn của riêng mình.', t: (s) => !!s.sect },
  { id: 'land10', g: 'Thổ', n: 'Bá chủ một phương', d: 'Chiếm 10 vùng đất.', t: (s) => landCount(s) >= 10 },
  { id: 'daxa', g: 'Phủ', n: 'Chủ nhân động phủ', d: 'Chiếm Đà Xá Cổ Đế Động Phủ.', t: (s) => !!s.land?.daxa },
  { id: 'landall', g: 'Thiên', n: 'Nhất thống đại lục', d: 'Chiếm toàn bộ bản đồ.', t: (s) => landCount(s) >= G.REGIONS.length },
  { id: 'army', g: 'Quân', n: 'Thiên quân vạn mã', d: 'Có 1000 binh sĩ.', t: (s) => troopCount(s) >= 1000 },
  { id: 'train', g: 'Luyện', n: 'Thiết huyết chi sư', d: 'Huấn luyện quân đội tới cấp 100.', t: (s) => s.army?.train >= 100 },
  { id: 'smith', g: 'Rèn', n: 'Thần tượng', d: 'Lò rèn cấp 100.', t: (s) => s.smithy?.lv >= 100 },
  { id: 'legend', g: 'Bảo', n: 'Tay rèn Huyền bảo', d: 'Tự rèn ra một món Huyền bảo trở lên.', t: (s) => s.stats?.legend >= 1 },
  { id: 'en50', g: 'Cường', n: 'Cường hóa +10', d: 'Cường hóa một món lên +10.', t: (s) => s.stats?.enhance >= 10 },
  { id: 'en100', g: 'Cực', n: 'Cường hóa +12', d: 'Cường hóa một món lên +12, cực hạn của lò rèn.', t: (s) => s.stats?.enhance >= 12 },
  { id: 'orders', g: 'Ước', n: 'Lò rèn của quân đội', d: 'Hoàn thành 10 hợp đồng binh khí.', t: (s) => s.stats?.orders >= 10 },
  { id: 'trader', g: 'Sàn', n: 'Thương nhân Vạn Bảo', d: 'Bán được 20 món trên sàn giao dịch.', t: (s) => s.stats?.exSold >= 20 },
  { id: 'est100', g: 'Sản', n: 'Đại phú hào', d: 'Một sản nghiệp đạt cấp 100.', t: (s) => Object.values(s.estates || {}).some((v) => v >= 100) },
  { id: 'bld100', g: 'Điện', n: 'Kiến trúc vạn cổ', d: 'Một công trình tông môn đạt cấp 100.', t: (s) => Object.values(s.sect?.b || {}).some((v) => v >= 100) },
  { id: 'rich', g: 'Kim', n: 'Phú khả địch quốc', d: 'Có trong tay một tỷ kim tệ.', t: (s) => s.gold >= 1e9 },
  { id: 'hon', g: 'Hồn', n: 'Diệt Hồn', d: 'Ba lần đánh lui Hồn tộc xâm lấn.', t: (s) => s.stats?.honWins >= 3 },
  { id: 'old', g: 'Thọ', n: 'Ngàn năm', d: 'Sống tới 1000 tuổi.', t: (s) => s.age >= 1000 },
  { id: 'ascend', g: 'Thăng', n: 'Phá toái hư không', d: 'Đế cảnh viên mãn rồi phi thăng.', t: (s) => !!s.flags?.ascend },
  { id: 'upper', g: 'Thượng', n: 'Thượng giới', d: 'Phi thăng lên Thượng giới.', t: (s) => !!s.up },
  { id: 'dechien', g: 'Chiến', n: 'Thượng giới chi chủ', d: 'Thắng trận Đế chiến.', t: (s) => s.flags?.dechien === 'win' },
  { id: 'reborn', g: 'Sinh', n: 'Trùng sinh', d: 'Bắt đầu một kiếp trùng sinh sau Đế chiến.', t: (s) => (s.ng || 0) >= 1 },
  { id: 'legacy', g: 'Kế', n: 'Hậu duệ của Đế', d: 'Bắt đầu một kiếp với ngọc giản truyền thừa.', t: (s) => !!s.legacy },
  { id: 'heir', g: 'Truyền', n: 'Đế ấn truyền thừa', d: 'Để lại đế ấn cho kiếp sau.', t: (s) => !!s.flags?.heir },
];

export function readAch() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
// Kiểm tra sau mỗi lượt, trả về các thành tựu vừa mở
export function checkAch(s) {
  const got = readAch();
  const fresh = ACH.filter((a) => !got[a.id] && a.t(s));
  if (!fresh.length) return [];
  for (const a of fresh) got[a.id] = { name: s.name, at: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(got)); } catch {}
  return fresh;
}

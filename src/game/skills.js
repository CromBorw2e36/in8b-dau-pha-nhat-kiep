// Hệ Thống Võ Học: Công Pháp & Đấu Kỹ Tiên Hiệp
import G from './data.js';

const R = () => Math.random();

export const SKILL_TIERS = ['Căn bản', 'Hoàng giai', 'Huyền giai', 'Địa giai', 'Thiên giai'];

export const SKILL_CATALOG = {
  // ───── CÔNG PHÁP (Cultivation Arts) ─────
  gong: [
    {
      id: 'thonap',
      n: 'Thổ Nạp Căn Bản Quyết',
      tier: 0,
      elem: 'Căn bản',
      d: 'Hô hấp thổ nạp thiên địa linh khí, rèn đúc kinh mạch cơ sở.',
      fx: { qi: 0.05, body: 2 },
      quote: '«Vạn trượng cao lâu khởi ư bình địa.»',
    },
    {
      id: 'tuvan',
      n: 'Tử Vân Công',
      tier: 1,
      elem: 'Phong',
      d: 'Vận chuyển đấu khí tựa ráng mây tím, tốc độ tu luyện gia tăng, thân thể dẻo dai.',
      fx: { qi: 0.15, body: 5, tam: 4 },
      quote: '«Tử khí đông lai, khí quán kinh hoa.»',
    },
    {
      id: 'cuuchuyen',
      n: 'Cửu Chuyển Trọng Nguyên Công',
      tier: 2,
      elem: 'Kim',
      d: 'Nén đấu khí qua chín tầng xoay chuyển, chân khí tinh thuần dị thường, chiến lực tăng mạnh.',
      fx: { qi: 0.3, cp: 8, body: 10 },
      quote: '«Cửu chuyển quy nhất, đấu khí như cương.»',
    },
    {
      id: 'tamtinh',
      n: 'Tam Tinh Quy Hư Kinh',
      tier: 3,
      elem: 'Hư Không',
      d: 'Tham ngộ tam tinh nhật nguyệt, hồn phách dung nhập hư không, tỷ lệ đột phá bình cảnh tăng vọt.',
      fx: { qi: 0.5, bt: 0.06, soul: 15, tam: 12 },
      quote: '«Thức hải tinh thần, hư không vạn cổ.»',
    },
    {
      id: 'phanquyet',
      n: 'Phần Quyết (Thần Thao)',
      tier: 4,
      elem: 'Dị Hỏa',
      d: 'Vô thượng công pháp viễn cổ, thôn phệ dị hỏa để tiến hóa vô hạn, hủy thiên diệt địa.',
      fx: { qi: 0.85, cp: 25, bt: 0.12, body: 20, soul: 20 },
      quote: '«Vạn hỏa quy tông, Phần Quyết xưng vương!»',
    },
  ],

  // ───── ĐẤU KỸ (Combat Martial Arts) ─────
  skill: [
    {
      id: 'toaithach',
      n: 'Toái Thạch Quyền',
      tier: 0,
      elem: 'Thổ',
      d: 'Khai sơn toái thạch, quyền lực cương mãnh.',
      fx: { cp: 3 },
      quote: '«Quyền xuất thạch toái, dũng vãng trực tiền.»',
    },
    {
      id: 'thiemloi',
      n: 'Thiểm Lôi Bộ',
      tier: 1,
      elem: 'Lôi',
      d: 'Thân pháp lôi quang, di hình hoán ảnh tránh né công kích trong chớp mắt.',
      fx: { cp: 5, dodge: 0.04 },
      quote: '«Bộ như điện xuyệt, ảnh tích vô tung.»',
    },
    {
      id: 'batcuc',
      n: 'Bát Cực Băng',
      tier: 2,
      elem: 'Nội Kình',
      d: 'Cận chiến bộc phát, ẩn chứa 8 tầng ám kình dồn dập, một đòn nát lục phủ ngũ tạng.',
      fx: { cp: 12, phagiap: 4 },
      quote: '«Bát cực ám kình, thốn kình đoạn cốt!»',
    },
    {
      id: 'diemphan',
      n: 'Diễm Phân Phệ Lãng Xích',
      tier: 3,
      elem: 'Hỏa',
      d: 'Địa giai đấu kỹ, vung Trọng Xích chém ra biển lửa cuồng bạo, xé toạc thương khung lãng đào.',
      fx: { cp: 22, phagiap: 8 },
      quote: '«Xích mang trảm thiên, diễm phân phệ lãng!»',
    },
    {
      id: 'tamthien',
      n: 'Tam Thiên Lôi Động',
      tier: 3,
      elem: 'Lôi',
      d: 'Thân pháp đỉnh phong Địa giai, người lướt đi mang theo tiếng sấm sét rền vang, như phân thân hư ảo.',
      fx: { cp: 18, dodge: 0.12, tambao: 0.04 },
      quote: '«Tam thiên lôi động, phong lôi dẫn độ!»',
    },
    {
      id: 'phatno',
      n: 'Phật Nộ Hỏa Liên',
      tier: 4,
      elem: 'Dị Hỏa',
      d: 'Dung hợp nhiều loại dị hỏa ngưng tụ thành đài sen rực rỡ, bộc phát uy năng tận thế.',
      fx: { cp: 38, phagiap: 16, bt: 0.08 },
      quote: '«Liên hoa vừa nở, vạn dặm thành tro!»',
    },
    {
      id: 'deanquyet',
      n: 'Đế Ấn Quyết',
      tier: 4,
      elem: 'Đế Đạo',
      d: 'Bí truyền Cổ Tộc: Khai Sơn Ấn, Phiên Hải Ấn, Phúc Địa Ấn, Yên Thiên Ấn, Cổ Đế Ấn ngũ đại tuyệt học.',
      fx: { cp: 45, phagiap: 20, body: 15 },
      quote: '«Ngũ ấn hợp nhất, thần thông chấn thế!»',
    },
  ],
};

const ALL = () => [...SKILL_CATALOG.gong, ...SKILL_CATALOG.skill];
export const artDef = (id) => ALL().find((x) => x.id === id);
const kindOf = (id) => (SKILL_CATALOG.gong.some((x) => x.id === id) ? 'gong' : 'skill');
// Bậc cao nhất đã mở của một loại (công pháp / đấu kỹ)
const bestTier = (s, kind) => Math.max(0, ...s.skills.unlocked.map(artDef).filter((d) => d && kindOf(d.id) === kind).map((d) => d.tier));

// Môn đang dùng phải khớp bậc s.gong / s.skill mà engine tính. Sự kiện, truyền thừa, đấu giá
// có thể nâng thẳng s.gong / s.skill, nên mỗi lần gọi đều đồng bộ lại.
function sync(s, kind) {
  const key = kind === 'gong' ? 'gongId' : 'skillId';
  const tier = kind === 'gong' ? s.gong || 0 : s.skill || 0;
  const cur = artDef(s.skills[key]);
  if (cur && cur.tier === tier) return;
  const pool = SKILL_CATALOG[kind].filter((x) => x.tier === tier);
  const target = pool.find((x) => s.skills.unlocked.includes(x.id)) || pool[0] || SKILL_CATALOG[kind][0];
  if (!s.skills.unlocked.includes(target.id)) s.skills.unlocked.push(target.id);
  s.skills[key] = target.id;
  // Bản lưu cũ chỉ có s.mastery: giữ nguyên độ thuần thục đó cho môn được gán
  s.skills.mastery[target.id] ??= kind === 'gong' ? 30 : s.mastery || 0;
}

export function ensureSkills(s) {
  s.skills ||= { gongId: 'thonap', skillId: 'toaithach', unlocked: ['thonap', 'toaithach'], mastery: { thonap: 30, toaithach: s.mastery || 0 } };
  s.skills.mastery ||= {};
  s.skills.drill ||= {};
  sync(s, 'gong');
  sync(s, 'skill');
  // s.mastery là độ thuần thục của đấu kỹ đang dùng (engine cộng chiến lực theo nó)
  s.skills.mastery[s.skills.skillId] = Math.max(s.skills.mastery[s.skills.skillId] || 0, s.mastery || 0);
  s.mastery = s.skills.mastery[s.skills.skillId];
  return s.skills;
}

// Mở đấu kỹ bậc kế tiếp (tính từ bậc cao nhất đã mở, không phải môn đang dùng)
export function upgradeSkill(s) {
  ensureSkills(s);
  const tier = Math.min(4, Math.max(s.skill, bestTier(s, 'skill')) + 1);
  const pool = SKILL_CATALOG.skill.filter((x) => x.tier === tier);
  const target = pool.find((x) => !s.skills.unlocked.includes(x.id)) || pool[0];
  if (!s.skills.unlocked.includes(target.id)) s.skills.unlocked.push(target.id);
  s.skill = tier;
  s.skills.skillId = target.id;
  s.skills.mastery[target.id] ??= 0;
  s.mastery = s.skills.mastery[target.id];
  return `đấu kỹ ${G.GRADES[tier]} · ${target.n}`;
}

export function upgradeGong(s) {
  ensureSkills(s);
  const tier = Math.min(4, Math.max(s.gong, bestTier(s, 'gong')) + 1);
  const target = SKILL_CATALOG.gong.find((x) => x.tier === tier && !s.skills.unlocked.includes(x.id)) || SKILL_CATALOG.gong.find((x) => x.tier === tier);
  if (!s.skills.unlocked.includes(target.id)) s.skills.unlocked.push(target.id);
  s.gong = tier;
  s.skills.gongId = target.id;
  s.skills.mastery[target.id] ??= 30;
  return `công pháp ${G.GRADES[tier]} · ${target.n}`;
}

// Độ lĩnh ngộ công pháp: tới +10% tốc độ tu luyện
export const gongMasteryMult = (s) => 1 + (s.skills?.mastery?.[s.skills.gongId] || 0) / 1000;

// Hiệu quả thật của môn đang dùng, đúng công thức engine
export function artEffects(s, kind) {
  ensureSkills(s);
  if (kind === 'gong') {
    const m = s.skills.mastery[s.skills.gongId] || 0;
    return [['Tu luyện', `×${(G.GONG_MULT[s.gong] * gongMasteryMult(s)).toFixed(2)}`], ['Lĩnh ngộ', `+${(m / 10).toFixed(1)}%`]];
  }
  const out = [['Chiến lực', `+${(s.skill * 2 * (0.5 + s.mastery / 200)).toFixed(1)}`]];
  if (s.mastery < 100) out.push(['Khi viên mãn', `+${(s.skill * 2).toFixed(1)}`]);
  return out;
}

// Cảnh giới lĩnh ngộ võ học
export function getMasteryLabel(pct) {
  if (pct >= 100) return { label: 'Đại Viên Mãn', color: '#ffd700' };
  if (pct >= 75) return { label: 'Lô Hỏa Thuần Thanh', color: '#b366ff' };
  if (pct >= 50) return { label: 'Đăng Đường Nhập Thất', color: '#4da6ff' };
  if (pct >= 25) return { label: 'Lược Thông Bì Mao', color: '#50c878' };
  return { label: 'Sơ Khuy Môn Kính', color: '#b0a48f' };
}

// Mỗi môn chỉ tham ngộ được một lần mỗi lượt
export const canPractice = (s, id) => (s.skills?.drill?.[id] ?? -1) !== s.t && (s.skills?.mastery?.[id] || 0) < 100;

export function practiceSkill(s, id) {
  ensureSkills(s);
  const def = artDef(id);
  if (!def) return null;
  const cur = s.skills.mastery[id] || 0;
  if (cur >= 100) return `${def.n} đã đạt Đại Viên Mãn.`;
  if (!canPractice(s, id)) return 'Lượt này đã tham ngộ rồi, hãy đợi năm sau.';
  const gain = Math.max(2, Math.round(4 + R() * 6 + (s.soul - 50) / 15 + (s.tam - 50) / 25) - def.tier);
  const next = Math.min(100, cur + gain);
  s.skills.mastery[id] = next;
  s.skills.drill[id] = s.t;
  if (id === s.skills.skillId) s.mastery = next;
  return { t: `Bạn tĩnh tọa tham ngộ ${def.n}, lĩnh ngộ +${gain}% (${next}% · ${getMasteryLabel(next).label}).`, next, gain };
}

// Đổi môn đang dùng sang một môn đã mở. Bậc engine theo môn này.
export function equipSkill(s, id) {
  ensureSkills(s);
  const def = artDef(id);
  if (!def || !s.skills.unlocked.includes(id)) return null;
  if (kindOf(id) === 'gong') { s.skills.gongId = id; s.gong = def.tier; }
  else { s.skills.skillId = id; s.skill = def.tier; s.mastery = s.skills.mastery[id] || 0; }
  return `Đã vận hành ${def.n} làm bản mệnh.`;
}

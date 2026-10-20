// Chữ trong con dấu son, dùng từ Hán-Việt ngắn cho dễ hiểu.
export const STAT_G = { body: 'Thể', soul: 'Hồn', tam: 'Tâm', luck: 'Vận', gold: 'Kim', qi: 'Khí', item: 'Túi', life: 'Thọ' };
export const FOCUS_G = { tu: 'Tu', lich: 'Lịch', nv: 'Việc', duoc: 'Đan', ky: 'Kỹ', tinh: 'Tĩnh', tong: 'Tông' };
export const ITEM_G = { core: 'Hạch', herb: 'Dược', tuk: 'Khí', lieu: 'Thương', pha: 'Phá', ore: 'Thiết', hon: 'Hồn', calm: 'Tâm', tho: 'Thọ' };
export const SLOT_G = { wep: 'Binh', arm: 'Giáp', acc: 'Bảo', rng: 'Giới', boo: 'Ngoa' };
export const TRAIT_G = { firm: 'Kiên', wise: 'Ngộ', tough: 'Cường', soulful: 'Linh', lucky: 'Phúc', fierce: 'Chiến', proud: 'Ngạo', romance: 'Đào', ring: 'Nhẫn' };
export const TROOP_G = { bo: 'Bộ', cung: 'Cung', ky: 'Kỵ', phap: 'Trận' };
export const NUM_G = ['1', '2', '3', '4', '5', '6'];
export const EV_G = {
  breakthrough: 'Phá', duel: 'Ước', lifeend: 'Thọ', baby_fire: 'Lửa', baby_story: 'Mộng', mock: 'Nhục', regress: 'Suy', ring: 'Nhẫn',
  cure: 'Thuốc', betrothal: 'Hôn', academy: 'Viện', sect: 'Tông', hon: 'Hồn', hon_hunt: 'Sát', evil_regret: 'Hối', beast: 'Thú',
  cave: 'Động', fire: 'Hỏa', companion: 'Thú', treasure: 'Bảo', merchant: 'Chợ', auction: 'Giá', epiphany: 'Ngộ', rival: 'Địch',
  tournament: 'Võ', clan_crisis: 'Tộc', heart: 'Ma', pill_exam: 'Đan', disciple: 'Đồ', ruin: 'Đế', daolu: 'Duyên', kidnap: 'Cứu',
  mission: 'Việc', gear_find: 'Binh', smith: 'Khí', estate_trouble: 'Phố', found_hint: 'Tông', conquer: 'Chiến', raid: 'Thủ', elder: 'Lão', betray: 'Phản', sect_war: 'Chiến', genius: 'Tài', vassal: 'Thuộc', robbed: 'Cướp', rescue: 'Nghĩa', guest: 'Khách', guest_duty: 'Thủ', dwelling: 'Phủ', parent_ill: 'Hiếu', borrow: 'Vay',
  arms_boom: 'Binh', smith_master: 'Rèn', ore_vein: 'Thiết', mutiny: 'Loạn', drill: 'Luyện', ex_vip: 'Sàn', market_swing: 'Thị',
  hon_invasion: 'Hồn', mount_tame: 'Kỵ', thienmo: 'Mộ', ancient_ally: 'Minh', emperor_pill: 'Đan', beast_emperor: 'Long', heir: 'Truyền', court: 'Triều',
};

// Con dấu son. tone: 'red' (mặc định) | 'ink' | 'gold' | 'outline'
export function Seal({ ch, tone = 'red', size = 'md', className = '' }) {
  return <span className={`seal seal-${tone} seal-${size} ${className}`} aria-hidden="true">{ch}</span>;
}

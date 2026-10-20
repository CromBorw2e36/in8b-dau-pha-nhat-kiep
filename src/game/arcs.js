// Chuỗi sự kiện nhiều hồi và kỳ ngộ gắn với trang bị, linh thú, võ học.
// Mỗi chuỗi ghi tiến độ vào s.flags; hồi sau chỉ mở khi hồi trước xong và đủ thời gian.
import G from './data.js';
import {
  R, clamp, pick, winP, peer, cp, unit, give, countOf, takeBest, spend, upgradeSkill, upgradeGong,
  beastGrade, gearSum, tierFor, gearName, priceOf, fmtGold,
} from './util.js';
import { genGear, obtainGear } from './gear.js';
import { enhanceCost } from './forge.js';
import { addBeast, owns, beastXp } from './beasts.js';
import { activeBeast, beastDef } from './util.js';
import { ensureSkills } from './skills.js';
import { ensureElders, addElder, rebornMentor, elderCp, realmCap } from './elders.js';

const since = (s, k) => s.t - (s.flags[k] ?? -99);
const mark = (s, flag, v) => { s.flags[flag] = v; s.flags[flag + 'T'] = s.t; };
const loot = (s) => (R() < 0.5 && s.gong < 4 ? upgradeGong(s) : upgradeSkill(s));
const petName = (s) => beastDef('pet', activeBeast(s, 'pet').id).n;
const fmtG = (v) => fmtGold(Math.round(v));
const elderBy = (s, id) => ensureElders(s).find((e) => e.id === id) || { loy: 0, R: 1, n: '', title: '' };
const addLoy = (s, id, n) => { const e = elderBy(s, id); e.loy = clamp((e.loy || 0) + n, 0, 100); };
// Trưởng lão mạnh nhất (để giao việc khó)
const bestElder = (s) => (s.sect ? [...ensureElders(s)].sort((a, b) => elderCp(b) - elderCp(a))[0] : null);
// Tăng thuần thục đấu kỹ đang dùng (giữ đồng bộ với bảng võ học)
function addMastery(s, n) {
  ensureSkills(s);
  s.mastery = Math.min(100, s.mastery + n);
  s.skills.mastery[s.skills.skillId] = s.mastery;
}
function addGongMastery(s, n) {
  ensureSkills(s);
  const id = s.skills.gongId;
  s.skills.mastery[id] = Math.min(100, (s.skills.mastery[id] || 0) + n);
}

export const ARCS = [
  // ───────── Chuỗi 1: Huyết thù Mộ gia (3 hồi) ─────────
  {
    id: 'feud_start', a: [13, 80], r: [1, 5], once: true, w: 1.4, icon: '🩸',
    if: (s) => !s.flags.feud,
    title: () => 'Thiếu chủ Mộ gia',
    text: () => 'Giữa phường thị, Mộ Thiếu — con trai trưởng lão Mộ gia — giật lấy gốc linh dược bạn vừa hái, còn sai gia nô xô bạn ngã xuống bùn. Đám đông vây quanh cười ồ.',
    ch: [
      { t: 'Nuốt giận, khắc tên hắn vào tim', fx: { tam: 5 }, do: (s) => mark(s, 'feud', 1),
        log: 'Bạn lặng lẽ phủi bùn trên áo. Cái tên Mộ Thiếu từ nay nằm trong sổ nợ của bạn.', k: 'key' },
      { t: 'Ra tay ngay tại chỗ', fight: 1, roll: (s) => winP(s, peer(s, 2)),
        ok: { fx: { fame: 1, tam: 3, gold: 2, why: 'Đoạt lại từ Mộ Thiếu' }, do: (s) => mark(s, 'feud', 1),
              log: 'Một quyền đánh Mộ Thiếu lăn ra đất. Hắn ôm mặt gào lên: «Mộ gia sẽ không bỏ qua cho ngươi!»', k: 'good' },
        fail: { fx: { body: -10, tam: -3 }, do: (s) => mark(s, 'feud', 1),
                log: 'Gia nô Mộ gia vây đánh bạn bầm dập. Mộ Thiếu nhổ nước bọt rồi bỏ đi.' } },
      { t: 'Cúi đầu xin lỗi cho yên chuyện', fx: { tam: -6 }, do: (s) => mark(s, 'feud', -1),
        log: 'Bạn cúi đầu. Mộ Thiếu cười khẩy, ném trả gốc linh dược đã giẫm nát.' },
    ],
  },
  {
    id: 'feud_ambush', r: [2, 8], once: true, w: 3, icon: '🗡️',
    if: (s) => s.flags.feud === 1 && since(s, 'feudT') >= 4,
    title: () => 'Thích khách trong đêm',
    text: () => 'Nửa đêm, ba bóng áo đen lặng lẽ áp sát chỗ bạn nghỉ. Trên chuôi dao của chúng khắc chữ «Mộ».',
    ch: [
      { t: 'Phản sát', fight: 1, roll: (s) => winP(s, peer(s, 3)),
        ok: { fx: { tam: 4, item: (s) => [['core', beastGrade(s), 2]], gold: 4, why: 'Lục soát thích khách' }, do: (s) => mark(s, 'feud', 2),
              log: 'Ba thích khách nằm gục. Trong người kẻ cầm đầu có lệnh bài Mộ gia — bằng chứng đủ để bạn đòi nợ máu.', k: 'key' },
        fail: { fx: { body: -18 }, do: (s) => mark(s, 'feud', 2), dieP: 0.05, die: 'Bị thích khách Mộ gia ám sát trong đêm',
                log: 'Lưỡi dao tẩm độc sượt qua sườn. Bạn liều mạng phá vòng vây, máu nhuộm đỏ đường chạy.' } },
      { t: (s) => `Để ${petName(s)} cản hậu, bạn thoát thân`, if: (s) => !!activeBeast(s, 'pet'),
        do: (s) => { beastXp(s, 'pet', -20); mark(s, 'feud', 2); },
        log: (s) => `${petName(s)} lao vào đám thích khách, mang thương tích nặng nhưng vẫn kịp đuổi theo bạn. Món nợ này phải trả.`, k: 'bad' },
      { t: 'Bỏ trốn, mai danh ẩn tích', roll: (s) => clamp(0.45 + (s.luck - 50) / 120),
        ok: { fx: { tam: -4 }, do: (s) => mark(s, 'feud', -1), log: 'Bạn đổi tên, rời khỏi vùng đất này. Mộ gia mất dấu bạn từ đó.' },
        fail: { fx: { body: -8 }, do: (s) => mark(s, 'feud', 2), log: 'Bạn bị đuổi kịp ở cửa thành, may mắn thoát được nhưng Mộ gia đã biết bạn còn sống.' } },
    ],
  },
  {
    id: 'feud_end', r: [4, 11], w: 3, cd: 5, icon: '🏯',
    if: (s) => s.flags.feud === 2 && since(s, 'feudT') >= 5,
    title: () => 'Nợ máu Mộ gia',
    text: () => 'Mộ gia giờ đã sa sút, còn bạn đã không còn là thiếu niên năm xưa. Cổng lớn Mộ phủ đóng chặt trước mặt.',
    ch: [
      { t: 'Đạp cửa Mộ phủ', fight: 1, roll: (s) => winP(s, peer(s, 5)),
        ok: { fx: { fame: 5, tam: 6, gold: 25, why: 'Kho báu Mộ gia' }, do: (s) => { mark(s, 'feud', 3); s.tmp = obtainGear(s, genGear(s, { boost: 2 })); },
              log: (s) => `Trưởng lão Mộ gia quỳ dưới chân bạn. Kho báu gia tộc bị bạn lấy sạch, trong đó có ${s.tmp}. Món nợ năm xưa đã thanh toán.`, k: 'key' },
        fail: { fx: { body: -25, tam: -5 }, dieP: 0.08, die: 'Vẫn lạc dưới đại trận hộ phủ Mộ gia', do: (s) => { s.flags.feudT = s.t; },
                log: 'Đại trận hộ phủ bật lên, bạn trọng thương rút lui. Hẹn ngày tái chiến.' } },
      { t: 'Gửi chiến thư, quyết đấu công khai trước toàn thành', fight: 1, roll: (s) => winP(s, peer(s, 3)),
        ok: { fx: { fame: 8, tam: 8 }, do: (s) => mark(s, 'feud', 3),
              log: 'Trước mặt vạn người, Mộ Thiếu bại dưới tay bạn, tự phế tu vi tạ tội. Thanh danh bạn vang khắp vùng.', k: 'key' },
        fail: { fx: { fame: -3, tam: -6, body: -10 }, do: (s) => mark(s, 'feud', 3),
                log: 'Bạn bại trận trước toàn thành. Mộ gia vênh mặt, nhưng thù oán cũng theo đó khép lại.' } },
      { t: 'Buông bỏ thù hận', fx: { tam: 10 }, do: (s) => mark(s, 'feud', 3),
        log: 'Bạn nhìn cánh cổng hồi lâu rồi quay đi. Đạo tâm nhẹ bẫng như vừa trút được gánh nặng.', k: 'good' },
    ],
  },

  // ───────── Chuỗi 2: Bản đồ di tích Viễn Cổ (ghép 3 mảnh) ─────────
  {
    id: 'map_frag', r: [2, 9], wild: true, cd: 7, w: 1.2, icon: '🗺️',
    if: (s) => (s.flags.map || 0) < 3,
    title: (s) => `Mảnh bản đồ cổ (${(s.flags.map || 0) + 1}/3)`,
    text: (s) => (s.flags.map ? `Lại một mảnh da thú khắc cùng hoa văn với ${s.flags.map === 1 ? 'mảnh' : 'hai mảnh'} bạn đang giữ.` : 'Một thương nhân bày bán mảnh da thú cũ nát. Hoa văn trên đó khớp với truyền thuyết về một di tích Đấu Đế viễn cổ.'),
    ch: [
      { t: (s) => `Mua lại (${Math.round(6 * unit(s)).toLocaleString('vi-VN')} kim tệ)`, if: (s) => s.gold >= 6 * unit(s),
        do: (s) => { spend(s, 'Mua mảnh bản đồ cổ', 6 * unit(s)); s.flags.map = (s.flags.map || 0) + 1; },
        log: (s) => `Bạn có thêm một mảnh bản đồ (${s.flags.map}/3).`, k: 'good' },
      { t: 'Cướp từ tay đám đạo tặc đang tranh nó', fight: 1, roll: (s) => winP(s, peer(s, 1)),
        ok: { do: (s) => { s.flags.map = (s.flags.map || 0) + 1; }, fx: { fame: 1 }, log: (s) => `Đạo tặc tan tác, mảnh bản đồ về tay bạn (${s.flags.map}/3).`, k: 'good' },
        fail: { fx: { body: -10 }, log: 'Bạn bị đánh lui, mảnh bản đồ theo đám đạo tặc biến mất.' } },
      { t: 'Bỏ qua', fx: { tam: 1 }, log: 'Truyền thuyết thì nhiều, mạng thì chỉ một.' },
    ],
  },
  {
    id: 'map_ruin', r: [3, 11], once: true, w: 4, icon: '🏛️',
    if: (s) => (s.flags.map || 0) >= 3,
    title: () => 'Di tích Đấu Đế viễn cổ',
    text: () => 'Ba mảnh bản đồ ghép lại, ánh sáng mờ dẫn bạn tới một khe núi. Cánh cửa đá phủ rêu khắc đầy phù văn đã ngàn năm chưa ai chạm tới.',
    ch: [
      { t: 'Một mình tiến vào', roll: (s) => clamp(0.4 + (s.soul - 50) / 150 + (s.luck - 50) / 200 + (cp(s) - peer(s, 2)) / 60),
        ok: { fx: { qi: 300, tam: 6 }, do: (s) => { const a = loot(s); s.tmp = `${a}, cùng ${obtainGear(s, genGear(s, { tier: Math.min(6, tierFor(s) + 1), boost: 3 }))}`; },
              log: (s) => `Sâu trong di tích là ngọc giản và binh khí của một Đấu Đế: bạn lĩnh ngộ ${s.tmp}.`, k: 'key' },
        fail: { fx: { body: -22 }, dieP: 0.06, die: 'Vẫn lạc giữa cấm chế di tích viễn cổ', do: (s) => give(s, 'core', beastGrade(s) + 1, 3),
                log: 'Cấm chế bùng nổ, bạn chỉ kịp vơ vài khỏa ma hạch rồi bị hất văng ra ngoài.' } },
      { t: 'Dẫn đệ tử tông môn cùng khai quật', if: (s) => !!s.sect,
        fx: { fame: 3 }, do: (s) => { s.sect.members += 30; s.tmp = obtainGear(s, genGear(s, { boost: 2 })); },
        log: (s) => `Tông môn cùng khai quật an toàn, thu về ${s.tmp}. Tin đồn lan ra, 30 người tìm đến xin nhập môn.`, k: 'key' },
      { t: 'Bán bản đồ cho Mễ Đặc Nhĩ gia tộc', fx: { gold: 40, why: 'Bán bản đồ di tích' },
        log: 'Mễ Đặc Nhĩ trả giá hậu hĩnh. Có kim tệ trong tay, việc mạo hiểm cứ để người khác lo.' },
    ],
  },

  // ───────── Kỳ ngộ: thợ rèn lang thang ─────────
  {
    id: 'smith_wander', r: [2, 11], cd: 14, w: 0.6, icon: '⚒️',
    if: (s) => s.gear.wep && (s.gear.wep.en || 0) < G.ENHANCE_MAX,
    title: () => 'Lão thợ rèn lang thang',
    text: (s) => `Một lão già lưng còng gõ búa bên đường, liếc nhìn ${gearName(s.gear.wep)} của bạn: «Hàng tốt, nhưng còn non lửa. Muốn lão rèn thêm không?»`,
    ch: [
      { t: (s) => `Trả công, rèn chắc một nấc (${Math.round(enhanceCost(s.gear.wep).gold * 2).toLocaleString('vi-VN')} kim tệ)`,
        if: (s) => s.gold >= enhanceCost(s.gear.wep).gold * 2,
        do: (s) => { spend(s, 'Công thợ rèn lang thang', enhanceCost(s.gear.wep).gold * 2); s.gear.wep.en = (s.gear.wep.en || 0) + 1; s.stats.enhance = Math.max(s.stats.enhance || 0, s.gear.wep.en); },
        log: (s) => `Ba nhát búa, lưỡi binh khí sáng rực. ${gearName(s.gear.wep)}!`, k: 'good' },
      { t: 'Cược thiên hỏa: thành +2, bại −1', roll: (s) => clamp(0.5 + (s.luck - 50) / 150),
        ok: { do: (s) => { const w = s.gear.wep; w.en = Math.min(G.ENHANCE_MAX, (w.en || 0) + 2); s.stats.enhance = Math.max(s.stats.enhance || 0, w.en); },
              log: (s) => `Thiên hỏa bao trùm binh khí rồi thu lại. ${gearName(s.gear.wep)} — lão già cười khà khà bỏ đi.`, k: 'key' },
        fail: { do: (s) => { const w = s.gear.wep; w.en = Math.max(0, (w.en || 0) - 1); },
                log: (s) => `Lửa quá mạnh, lưỡi binh khí rạn một đường. ${gearName(s.gear.wep)}. Lão già đã biến mất.`, k: 'bad' } },
      { t: 'Từ chối', log: 'Bạn lắc đầu. Lão già nhún vai, tiếp tục gõ búa.' },
    ],
  },

  // ───────── Linh thú bạo bệnh ─────────
  {
    id: 'pet_sick', r: [1, 11], cd: 16, w: 0.5, icon: '🤒',
    if: (s) => !!activeBeast(s, 'pet'),
    title: (s) => `${petName(s)} lâm bệnh`,
    text: (s) => `${petName(s)} nằm thoi thóp mấy ngày, linh khí trong người rối loạn. Nếu không chữa, nó sẽ suy yếu.`,
    ch: [
      { t: 'Đút hai gốc linh dược tốt nhất', if: (s) => countOf(s, 'herb') >= 2,
        do: (s) => { takeBest(s, 'herb'); takeBest(s, 'herb'); beastXp(s, 'pet', 30); },
        log: (s) => `${petName(s)} khỏe lại, linh khí còn tinh thuần hơn trước.`, k: 'good' },
      { t: (s) => `Mời thú y (${Math.round(3 * unit(s)).toLocaleString('vi-VN')} kim tệ)`, if: (s) => s.gold >= 3 * unit(s),
        do: (s) => { spend(s, 'Chữa bệnh linh thú', 3 * unit(s)); beastXp(s, 'pet', 12); },
        log: (s) => `Thú y bốc thuốc, ${petName(s)} dần hồi phục.` },
      { t: 'Truyền đấu khí của mình sang', fx: { qi: -120, body: -3 }, do: (s) => beastXp(s, 'pet', 20),
        log: (s) => `Bạn mất mấy tháng tu vi, nhưng ${petName(s)} đã đứng dậy liếm tay bạn.`, k: 'good' },
      { t: 'Mặc kệ, để nó tự khỏi', do: (s) => beastXp(s, 'pet', -25),
        log: (s) => `${petName(s)} qua khỏi nhưng gầy rộc, sức mạnh giảm sút.`, k: 'bad' },
    ],
  },

  // ───────── Linh thú trứng ─────────
  {
    id: 'beast_egg', r: [2, 9], wild: true, once: true, w: 0.8, icon: '🥚',
    if: (s) => G.PETS.some((p) => s.R >= p.minR && !owns(s, 'pet', p.id)),
    prep: (s) => { const list = G.PETS.filter((p) => s.R >= p.minR && !owns(s, 'pet', p.id)); s.tmp = pick(list).id; },
    title: () => 'Quả trứng ấm nóng',
    text: () => 'Trong hang ma thú bỏ hoang, một quả trứng vỏ vân lấp lánh vẫn còn ấm. Bên trong có nhịp đập yếu ớt.',
    ch: [
      { t: 'Ấp bằng đấu khí của mình', fx: { qi: -100 },
        do: (s) => { addBeast(s, 'pet', s.tmp); s.beasts.pet = s.tmp; },
        log: (s) => `Ba tháng sau, vỏ trứng nứt ra: một con ${beastDef('pet', s.tmp).n} non dụi đầu vào tay bạn.`, k: 'key' },
      { t: 'Bán cho thương hội', fx: { gold: 15, why: 'Bán trứng linh thú' }, log: 'Thương hội trả giá cao. Bạn không hỏi họ sẽ làm gì với nó.' },
    ],
  },

  // ───────── Ngộ đạo ─────────
  {
    id: 'epiphany', r: [1, 11], cd: 12, w: 0.5, icon: '🍃',
    title: () => 'Ngộ đạo dưới cổ thụ',
    text: () => 'Ngồi dưới gốc cổ thụ ngàn năm, gió lay lá rụng, bạn chợt thấy thiên địa như mở ra một khe hở. Cảm ngộ chỉ đến một lần — dồn vào đâu?',
    ch: [
      { t: 'Ngộ công pháp', do: (s) => addGongMastery(s, 15 + Math.round(R() * 10)), fx: { qi: 60 },
        log: 'Đường vận hành công pháp bỗng thông suốt, đấu khí tuần hoàn nhanh hơn hẳn.', k: 'good' },
      { t: 'Ngộ đấu kỹ', do: (s) => addMastery(s, 15 + Math.round(R() * 10)),
        log: 'Từng chiêu thức hiện lên trong đầu, chậm rãi rồi mau dần. Đấu kỹ thuần thục thêm một tầng.', k: 'good' },
      { t: 'Ngộ thân pháp, tôi luyện nhục thân', fx: { body: 6, tam: 2 }, log: 'Bạn bắt chước gió lay cành, thân thể nhẹ và dẻo dai hơn.' },
    ],
  },

  // ───────── Đại hội luận kiếm (có cá cược) ─────────
  {
    id: 'tournament', r: [2, 10], cd: 12, w: 0.6, icon: '🏆',
    title: () => 'Đại hội luận kiếm',
    text: () => 'Thành chủ mở đại hội luận kiếm, người thắng được thưởng kim tệ và một quyển bí tịch. Sòng bạc ngoài thành đã mở kèo.',
    ch: [
      { t: 'Ghi danh xuất chiến', fight: 1, roll: (s) => winP(s, peer(s, 3)),
        ok: { fx: { fame: 3, gold: 12, why: 'Thưởng luận kiếm' }, do: (s) => { s.tmp = R() < 0.35 ? upgradeSkill(s) : null; },
              log: (s) => `Bạn đoạt ngôi quán quân!${s.tmp ? ` Phần thưởng là ${s.tmp}.` : ''}`, k: 'key' },
        fail: { fx: { body: -8, tam: -2 }, log: 'Bạn dừng bước ở vòng trong. Kẻ mạnh còn nhiều lắm.' } },
      { t: (s) => `Đặt cược cho chính mình (${Math.round(10 * unit(s)).toLocaleString('vi-VN')} kim tệ) rồi xuất chiến`, if: (s) => s.gold >= 10 * unit(s),
        fight: 1, roll: (s) => winP(s, peer(s, 3)),
        ok: { do: (s) => spend(s, 'Đặt cược luận kiếm', 10 * unit(s)), fx: { fame: 3, gold: 42, why: 'Thắng cược luận kiếm' },
              log: 'Bạn thắng giải lẫn thắng cược, ôm về gấp bốn lần tiền đặt. Nhà cái mặt xám như tro.', k: 'key' },
        fail: { do: (s) => spend(s, 'Đặt cược luận kiếm', 10 * unit(s)), fx: { body: -8, tam: -4 },
                log: 'Thua trận, mất luôn tiền cược. Hôm nay đúng là ngày xui.', k: 'bad' } },
      { t: 'Đứng ngoài xem, học lỏm', do: (s) => addMastery(s, 6), fx: { tam: 1 },
        log: 'Bạn ghi nhớ chiêu thức của các cao thủ, về nhà tự luyện.' },
    ],
  },

  // ───────── Chợ đen ─────────
  {
    id: 'black_market', r: [3, 11], cd: 14, w: 0.5, icon: '🕯️',
    title: () => 'Chợ đen dưới lòng đất',
    text: () => 'Một kẻ trùm mặt dẫn bạn xuống hầm ngầm. Ở đây bán những thứ không có ở sàn giao dịch: khoáng thạch lậu giá rẻ, cấm đan, cả tin tức.',
    ch: [
      { t: (s) => `Gom cả kho Huyền thiết lậu: 120 khối ${beastGrade(s)} phẩm (${Math.round(priceOf('ore', beastGrade(s)) * 120 * 0.45).toLocaleString('vi-VN')} kim tệ)`,
        if: (s) => s.gold >= priceOf('ore', beastGrade(s)) * 120 * 0.45,
        do: (s) => { spend(s, 'Huyền thiết chợ đen', priceOf('ore', beastGrade(s)) * 120 * 0.45); give(s, 'ore', beastGrade(s), 120); },
        log: 'Rẻ hơn nửa giá thị trường. Đủ cho lò rèn đỏ lửa cả năm.', k: 'good' },
      { t: 'Mua một viên cấm đan bạo khí', fx: { qi: 400, body: -6, tam: -5, gold: -8, why: 'Cấm đan chợ đen' },
        log: 'Đấu khí cuồn cuộn dâng lên, nhưng kinh mạch rát như có lửa đốt. Thứ này không thể dùng lần hai.' },
      { t: 'Mua tin tức về di tích', if: (s) => (s.flags.map || 0) < 3, fx: { gold: -5, why: 'Mua tin chợ đen' },
        do: (s) => { s.flags.map = (s.flags.map || 0) + 1; },
        log: (s) => `Kẻ trùm mặt đưa bạn một mảnh da thú cũ: mảnh bản đồ cổ (${s.flags.map}/3).`, k: 'good' },
      { t: 'Báo cho thành vệ', fx: { fame: 2, tam: 2 }, log: 'Hầm ngầm bị dẹp. Thành chủ ghi nhận công lao của bạn.' },
    ],
  },

  // ───────── Lôi kiếp (hậu kỳ) ─────────
  {
    id: 'tribulation', r: [8, 11], cd: 20, w: 0.7, icon: '🌩️',
    title: () => 'Thiên lôi giáng thế',
    text: () => 'Mây đen tụ lại trên đầu bạn, sấm rền chín tầng trời. Đây là lôi kiếp mà kẻ nghịch thiên tu hành buộc phải đối mặt.',
    ch: [
      { t: 'Lấy thân độ kiếp', roll: (s) => clamp(0.35 + (s.body - 50) / 120 + gearSum(s, 'def') * 0.6),
        ok: { fx: { body: 10, qi: 600, life: 50 }, log: 'Chín đạo thiên lôi đánh xuống, bạn đứng vững. Nhục thân được lôi điện tôi luyện, thọ nguyên tăng thêm 50 năm!', k: 'key' },
        fail: { fx: { body: -30, tam: -6 }, dieP: 0.12, die: 'Hồn phi phách tán dưới thiên lôi', log: 'Đạo thiên lôi thứ bảy đánh nát hộ thể đấu khí. Bạn gượng sống sót, toàn thân cháy đen.' } },
      { t: (s) => `Dùng ${s.gear.arm ? gearName(s.gear.arm) : 'hộ giáp'} chắn kiếp`, if: (s) => !!s.gear.arm,
        fx: { qi: 300, body: 3 }, do: (s) => { s.gear.arm.en = Math.max(0, (s.gear.arm.en || 0) - 2); },
        log: (s) => `Hộ giáp gánh phần lớn thiên lôi rồi rạn nứt, còn ${gearName(s.gear.arm)}. Bạn vượt kiếp an toàn.`, k: 'good' },
      { t: 'Trốn vào hư không', fx: { tam: -4 }, log: 'Bạn né được lôi kiếp lần này. Nhưng trời cao vẫn nhớ tên bạn.' },
    ],
  },
  // ───────── Chuỗi 3: Tam niên chi ước (3 hồi) ─────────
  {
    id: 'oath_break', a: [13, 22], r: [0, 3], once: true, w: 1.3, icon: '📜',
    if: (s) => !s.flags.oath,
    title: () => 'Hủy hôn trước cửa nhà',
    text: () => 'Thiếu tông chủ Vân Lam Tông đích thân tới phủ, trước mặt cả gia tộc đòi hủy hôn ước định từ thuở nhỏ: «Tu vi dậm chân ba năm, một kẻ phế vật thì lấy gì xứng đôi?» Cả sảnh đường im phăng phắc.',
    ch: [
      { t: 'Tự tay viết hưu thư, hẹn ba năm sau lên Vân Lam sơn', fx: { tam: 8, fame: 1 }, do: (s) => mark(s, 'oath', 1),
        log: '«Ba mươi năm hà đông, ba mươi năm hà tây, chớ khinh thiếu niên nghèo!» Bạn ném hưu thư xuống đất. Ước hẹn ba năm từ đây khắc vào tim.', k: 'key' },
      { t: 'Ra tay ngay giữa sảnh', fight: 1, roll: (s) => winP(s, peer(s, 3)),
        ok: { fx: { fame: 2, tam: 5 }, do: (s) => mark(s, 'oath', 1), log: 'Một chưởng đẩy lùi đối phương ba bước. Cả sảnh xôn xao. Bạn hẹn ba năm sau sẽ lên Vân Lam sơn đòi lại thể diện.', k: 'key' },
        fail: { fx: { body: -12, tam: 4 }, do: (s) => mark(s, 'oath', 1), log: 'Bạn bị đánh văng ra cửa. Lau vệt máu nơi khóe miệng, bạn chỉ nói: «Ba năm.»' } },
      { t: 'Cúi đầu chấp nhận', fx: { tam: -8 }, do: (s) => mark(s, 'oath', -1),
        log: 'Hôn ước bị hủy. Từ đó người trong trấn nhìn bạn bằng ánh mắt thương hại.' },
    ],
  },
  {
    id: 'oath_train', r: [0, 6], once: true, w: 3, icon: '⛰️',
    if: (s) => s.flags.oath === 1 && since(s, 'oathT') >= 1,
    title: () => 'Khổ tu ba năm',
    text: () => 'Thời hạn ước hẹn đang đến gần. Muốn đứng trên Vân Lam sơn với tư thế ngẩng cao đầu, bạn phải liều mạng một phen.',
    ch: [
      { t: 'Vào sâu Ma Thú sơn mạch, lấy chiến dưỡng chiến', fight: 1, roll: (s) => clamp(0.55 + (s.body - 50) / 120),
        ok: { fx: { body: 8, qi: 220, item: (s) => [['core', beastGrade(s), 3]] }, do: (s) => { addMastery(s, 10); mark(s, 'oath', 2); },
              log: 'Ngày giết ma thú, đêm luyện quyền. Bạn trở về với ánh mắt sắc như đao và một túi ma hạch.', k: 'good' },
        fail: { fx: { body: -15, qi: 120 }, dieP: 0.03, die: 'Táng thân trong Ma Thú sơn mạch khi khổ tu', do: (s) => mark(s, 'oath', 2),
                log: 'Bạn suýt chết dưới vuốt một đầu ma thú tứ giai, nhưng tu vi vẫn tiến lên một bậc.' } },
      { t: 'Bế quan dưới thác nước', fx: { qi: 300, tam: 4 }, do: (s) => mark(s, 'oath', 2),
        log: 'Nước thác đổ xuống như ngàn cân, đấu khí trong người bị ép tinh thuần từng chút một.', k: 'good' },
      { t: 'Theo lão sư học luyện dược', if: (s) => !!s.master, fx: { soul: 8, qi: 150 }, do: (s) => mark(s, 'oath', 2),
        log: 'Lão sư cười khà khà: «Đánh nhau thì cần gì đao kiếm, một viên đan là đủ khiến cả tông môn kiêng dè.»', k: 'good' },
    ],
  },
  {
    id: 'oath_duel', r: [1, 11], once: true, w: 4, icon: '🏔️',
    if: (s) => s.flags.oath === 2 && since(s, 'oathT') >= 2,
    title: () => 'Ước chiến Vân Lam sơn',
    text: () => 'Ba năm đã tới. Trên quảng trường Vân Lam Tông, hàng vạn đệ tử vây quanh lôi đài. Người từng hủy hôn đứng đó, kiếm đã tuốt khỏi vỏ.',
    ch: [
      { t: 'Bước lên lôi đài', fight: 1, roll: (s) => winP(s, peer(s, 2)),
        ok: { fx: { fame: 8, tam: 10 }, do: (s) => { mark(s, 'oath', 3); s.tmp = obtainGear(s, genGear(s, { boost: 1.5 })); },
              log: (s) => `Một chiêu cuối cùng, kiếm gãy làm đôi. Vân Lam Tông lặng ngắt. Tông chủ đích thân bước xuống, tặng bạn ${s.tmp} để giảng hòa.`, k: 'key' },
        fail: { fx: { fame: -3, tam: -8, body: -15 }, dieP: 0.02, die: 'Vẫn lạc trên lôi đài Vân Lam sơn', do: (s) => mark(s, 'oath', 3),
                log: 'Bạn ngã xuống lôi đài. Không ai cười, vì ai cũng thấy bạn đã chiến đấu tới hơi thở cuối.' } },
      { t: (s) => `Dẫn ${s.sect.elders} trưởng lão ${s.sect.name} lên núi tạo thế`, if: (s) => !!s.sect && s.sect.elders > 0,
        fight: 1, roll: (s) => clamp(winP(s, peer(s, 2)) + 0.12),
        ok: { fx: { fame: 10, tam: 8 }, do: (s) => { mark(s, 'oath', 3); ensureElders(s).forEach((e) => { e.loy = Math.min(100, e.loy + 6); }); },
              log: 'Các trưởng lão đứng sau lưng, khí thế áp đảo cả Vân Lam Tông. Bạn thắng gọn trên lôi đài, các trưởng lão càng thêm kính phục.', k: 'key' },
        fail: { fx: { fame: -2, tam: -5, body: -10 }, do: (s) => mark(s, 'oath', 3),
                log: 'Dù có trưởng lão hộ giá, bạn vẫn bại trận. Hai bên thu quân, ân oán tạm gác.' } },
      { t: 'Không đến', fx: { fame: -5, tam: -6 }, do: (s) => mark(s, 'oath', -1), log: 'Thiên hạ đồn rằng bạn sợ hãi bỏ hẹn. Lời đồn ấy theo bạn rất lâu.' },
    ],
  },

  // ───────── Chuỗi 4: Lão sư tái tạo nhục thân (3 hồi) ─────────
  {
    id: 'mentor_fade', r: [3, 10], once: true, w: 3, icon: '💍',
    if: (s) => !!s.master && !s.flags.body && !s.mentor,
    title: () => 'Hồn thể lão sư suy yếu',
    text: () => 'Ánh sáng trong nhẫn mờ dần qua từng đêm. Lão sư thở dài: «Hồn thể của ta sắp cạn. Nếu không có Bồ Đề Hóa Thể Tiên để tái tạo nhục thân, vài năm nữa ta sẽ tiêu tán khỏi thiên địa này.»',
    ch: [
      { t: 'Thề tìm cho được Bồ Đề quả', fx: { tam: 5 }, do: (s) => mark(s, 'body', 1),
        log: 'Lão sư cười, lần đầu tiên không châm chọc: «Tiểu tử ngươi cũng biết điều.»', k: 'key' },
      { t: 'Truyền đấu khí của mình nuôi hồn thể', fx: { qi: -200, soul: 5, tam: 3 }, do: (s) => mark(s, 'body', 1),
        log: 'Bạn mất mấy tháng tu vi, ánh sáng trong nhẫn sáng trở lại. Nhưng đó chỉ là kéo dài thời gian.', k: 'good' },
    ],
  },
  {
    id: 'mentor_herb', r: [3, 11], cd: 4, w: 2.5, icon: '🌳',
    if: (s) => s.flags.body === 1 && since(s, 'bodyT') >= 3,
    title: () => 'Bồ Đề Hóa Thể Tiên',
    text: () => 'Tin tức truyền về: sâu trong Ma Thú sơn mạch có một gốc Bồ Đề cổ thụ vừa kết quả, canh giữ bởi một đầu ma thú lục giai. Cùng lúc đó, đấu giá hội Ô Thản thành cũng rao bán một quả.',
    ch: [
      { t: 'Xông vào sơn mạch đoạt quả', fight: 1, roll: (s) => winP(s, peer(s, 4)),
        ok: { fx: { fame: 2, item: (s) => [['core', Math.min(9, beastGrade(s) + 1), 2]] }, do: (s) => mark(s, 'body', 2),
              log: 'Đầu ma thú gục xuống, quả Bồ Đề vàng óng nằm gọn trong tay bạn. Chiếc nhẫn khẽ rung lên.', k: 'key' },
        fail: { fx: { body: -20 }, dieP: 0.05, die: 'Bị ma thú lục giai xé xác bên gốc Bồ Đề', do: (s) => { s.flags.bodyT = s.t; },
                log: 'Bạn trọng thương tháo chạy. Quả Bồ Đề vẫn còn đó, chờ lần sau.' } },
      { t: (s) => `Đấu giá mua về (${fmtG(30 * unit(s))} kim tệ)`, if: (s) => s.gold >= 30 * unit(s),
        do: (s) => { spend(s, 'Mua Bồ Đề Hóa Thể Tiên', 30 * unit(s)); mark(s, 'body', 2); },
        log: 'Tiếng búa gõ ba lần. Cả hội trường nhìn bạn như nhìn kẻ điên, nhưng lão sư trong nhẫn cười ha hả.', k: 'good' },
      { t: (s) => `Phái ${bestElder(s).title} trưởng lão ${bestElder(s).n} đi đoạt`, if: (s) => !!bestElder(s),
        roll: (s) => clamp(0.3 + (elderCp(bestElder(s)) - peer(s, 4)) / 40, 0.1, 0.9),
        ok: { do: (s) => { const e = bestElder(s); e.loy = Math.min(100, e.loy + 10); s.tmp = e.n; mark(s, 'body', 2); },
              log: (s) => `${s.tmp} trở về, áo nhuốm máu, hai tay dâng lên quả Bồ Đề. Bạn ghi nhớ ân tình này.`, k: 'key' },
        fail: { do: (s) => { const e = bestElder(s); e.R = Math.max(1, e.R - 1); s.tmp = e.n; s.flags.bodyT = s.t; },
                log: (s) => `${s.tmp} bị ma thú đánh trọng thương, tu vi tụt một cảnh giới mà vẫn trắng tay.`, k: 'bad' } },
    ],
  },
  {
    id: 'mentor_reborn', r: [3, 11], cd: 3, w: 3, icon: '🔥',
    if: (s) => s.flags.body === 2 && since(s, 'bodyT') >= 1,
    title: () => 'Hóa Thể Đan',
    text: () => 'Bồ Đề quả đã có. Luyện thành Hóa Thể Đan cần ngọn lửa đủ mạnh, và một khi khai lò thì không thể dừng. Lão sư nghiêm giọng: «Bại thì quả hóa tro, ta lại phải chờ.»',
    ch: [
      { t: 'Dùng dị hỏa của mình khai lò', if: (s) => s.fires.length > 0, roll: (s) => clamp(0.5 + s.fires.length * 0.12 + (s.soul - 50) / 150),
        ok: { do: (s) => { rebornMentor(s); mark(s, 'body', 3); }, fx: { soul: 6, tam: 6 },
              log: (s) => `Đan thành, mây lành tụ trên đỉnh đầu. Một lão nhân tóc bạc bước ra khỏi nhẫn với thân thể thật, tu vi ${G.REALMS[s.mentor.R].n}: «Từ nay lão phu hộ đạo cho ngươi.» Xem ở tab Trưởng lão.`, k: 'key' },
        fail: { fx: { soul: -8 }, do: (s) => mark(s, 'body', 1), log: 'Lửa mất kiểm soát, quả Bồ Đề hóa thành tro. Lão sư im lặng rất lâu.', k: 'bad' } },
      { t: (s) => `Thuê lò Đan Tháp (${fmtG(12 * unit(s))} kim tệ)`, if: (s) => s.gold >= 12 * unit(s), roll: (s) => clamp(0.45 + (s.soul - 50) / 200),
        ok: { do: (s) => { spend(s, 'Thuê lò Đan Tháp', 12 * unit(s)); rebornMentor(s); mark(s, 'body', 3); }, fx: { tam: 5 },
              log: (s) => `Lò Đan Tháp rực sáng ba ngày. Lão sư bước ra, vươn vai, cười lớn: «${G.REALMS[s.mentor.R].n} thôi, nhưng đủ dùng!» Xem ở tab Trưởng lão.`, k: 'key' },
        fail: { do: (s) => { spend(s, 'Thuê lò Đan Tháp', 12 * unit(s)); mark(s, 'body', 1); }, fx: { soul: -5 }, log: 'Lò Đan Tháp không chịu nổi dược lực, đan nổ tung. Phải tìm quả khác.', k: 'bad' } },
    ],
  },
  {
    id: 'mentor_guard', r: [3, 11], cd: 14, w: 0.8, icon: '🛡️',
    if: (s) => !!s.mentor,
    title: () => 'Lão sư ra tay',
    text: () => 'Một lão quái mạnh hơn bạn cả một đại cảnh giới chặn đường, nhắm vào dị bảo trên người bạn. Sau lưng, lão sư khẽ hắng giọng.',
    ch: [
      { t: 'Mời lão sư ra tay', roll: (s) => clamp(0.35 + (elderCp(s.mentor) - peer(s, 8)) / 30, 0.15, 0.95),
        ok: { fx: { fame: 3, gold: 15, why: 'Chiến lợi phẩm lão quái' }, log: 'Lão sư phẩy tay áo, lão quái phun máu bỏ chạy, để lại cả túi trữ vật.', k: 'good' },
        fail: { do: (s) => { s.mentor.R = Math.max(5, s.mentor.R - 1); }, fx: { tam: -3 },
                log: (s) => `Lão sư đỡ cho bạn một chưởng chí mạng, nhục thân mới tổn thương, tu vi tụt về ${G.REALMS[s.mentor.R].n}.`, k: 'bad' } },
      { t: 'Tự mình nghênh chiến', fight: 1, roll: (s) => winP(s, peer(s, 6)),
        ok: { fx: { fame: 5, tam: 6 }, log: 'Bạn đánh lui lão quái bằng chính sức mình. Lão sư gật gù, lần đầu khen một câu.', k: 'key' },
        fail: { fx: { body: -14 }, log: 'Bạn bị đánh trọng thương, lão sư phải ra tay cứu nguy rồi mắng một trận.' } },
    ],
  },

  // ───────── Chuỗi 5: Tông môn và trưởng lão ─────────
  {
    id: 'elder_rival', r: [3, 11], cd: 18, w: 0.7, icon: '⚖️',
    if: (s) => !!s.sect && ensureElders(s).length >= 2,
    prep: (s) => { const [a, b] = [...ensureElders(s)].sort(() => R() - 0.5); s.tmp = { a: a.id, b: b.id, an: `${a.title} trưởng lão ${a.n}`, bn: `${b.title} trưởng lão ${b.n}` }; },
    title: () => 'Tranh ghế Đại trưởng lão',
    text: (s) => `${s.tmp.an} và ${s.tmp.bn} công khai tranh ghế Đại trưởng lão, đệ tử chia làm hai phe. Cả hai đều nhìn về phía tông chủ.`,
    ch: [
      { t: (s) => `Chọn ${s.tmp.an}`, do: (s) => { addLoy(s, s.tmp.a, 15); addLoy(s, s.tmp.b, -20); }, log: (s) => `${s.tmp.an} lên ghế Đại trưởng lão. ${s.tmp.bn} ôm hận trong lòng.` },
      { t: (s) => `Chọn ${s.tmp.bn}`, do: (s) => { addLoy(s, s.tmp.b, 15); addLoy(s, s.tmp.a, -20); }, log: (s) => `${s.tmp.bn} lên ghế Đại trưởng lão. ${s.tmp.an} ôm hận trong lòng.` },
      { t: 'Cho hai người tỷ thí, ai thắng người đó ngồi',
        do: (s) => {
          const a = elderBy(s, s.tmp.a), b = elderBy(s, s.tmp.b);
          const [w, l] = elderCp(a) >= elderCp(b) ? [a, b] : [b, a];
          addLoy(s, w.id, 8); addLoy(s, l.id, -5);
          s.tmp.w = `${w.title} trưởng lão ${w.n}`;
        },
        fx: { fame: 1 }, log: (s) => `Trận tỷ thí kéo dài từ sáng tới tối. ${s.tmp.w} thắng, cả tông môn tâm phục khẩu phục.`, k: 'good' },
      { t: 'Tông chủ kiêm nhiệm, không ai ngồi', fx: { tam: -2 }, do: (s) => { addLoy(s, s.tmp.a, -6); addLoy(s, s.tmp.b, -6); }, log: 'Cả hai đều không vui, nhưng chẳng ai dám cãi.' },
    ],
  },
  {
    id: 'elder_neck', r: [3, 11], cd: 12, w: 0.7, icon: '🧘',
    if: (s) => !!s.sect && ensureElders(s).some((e) => e.R < realmCap(s)),
    prep: (s) => { const e = pick(ensureElders(s).filter((x) => x.R < realmCap(s))); s.tmp = { id: e.id, n: `${e.title} trưởng lão ${e.n}`, to: G.REALMS[e.R + 1].n }; },
    title: () => 'Trưởng lão kẹt bình cảnh',
    text: (s) => `${s.tmp.n} kẹt ở bình cảnh nhiều năm, xin tông chủ giúp một tay để bước vào ${s.tmp.to}.`,
    ch: [
      { t: 'Ban một viên Phá Chướng Đan', if: (s) => countOf(s, 'pha') > 0,
        do: (s) => { takeBest(s, 'pha'); elderBy(s, s.tmp.id).R++; addLoy(s, s.tmp.id, 15); },
        log: (s) => `${s.tmp.n} nuốt đan, bế quan bảy ngày rồi phá quan bước vào ${s.tmp.to}. Lão quỳ xuống tạ ơn tông chủ.`, k: 'good' },
      { t: 'Đích thân hộ pháp', fx: { qi: -150 }, roll: (s) => clamp(0.45 + (s.R - elderBy(s, s.tmp.id).R) * 0.08),
        ok: { do: (s) => { elderBy(s, s.tmp.id).R++; addLoy(s, s.tmp.id, 10); }, log: (s) => `Có tông chủ hộ pháp, ${s.tmp.n} đột phá ${s.tmp.to}.`, k: 'good' },
        fail: { do: (s) => addLoy(s, s.tmp.id, 4), log: (s) => `${s.tmp.n} vẫn chưa phá được bình cảnh, nhưng cảm kích tấm lòng tông chủ.` } },
      { t: 'Tu hành là chuyện của mỗi người', do: (s) => addLoy(s, s.tmp.id, -10), log: (s) => `${s.tmp.n} lặng lẽ cáo lui, ánh mắt có phần thất vọng.` },
    ],
  },
  {
    id: 'prodigy_find', r: [4, 11], once: true, w: 0.8, icon: '🌱',
    if: (s) => !!s.sect && s.sect.members >= 60,
    title: () => 'Thiếu niên dị bẩm',
    text: (s) => `Trong đợt thu nhận đệ tử, một thiếu niên mười hai tuổi làm vỡ tung đá trắc nghiệm. Cả ${s.sect.name} chấn động.`,
    ch: [
      { t: (s) => `Thu làm thân truyền, tự tay dạy dỗ (${fmtG(5 * unit(s))} kim tệ)`, if: (s) => s.gold >= 5 * unit(s),
        do: (s) => { spend(s, 'Bồi dưỡng thân truyền', 5 * unit(s)); mark(s, 'prodigy', 1); s.disciples++; }, fx: { tam: 3 },
        log: 'Bạn thu nhận thiếu niên làm đệ tử thân truyền. Đứa bé dập đầu chín cái, ánh mắt sáng rực.', k: 'key' },
      { t: 'Giao cho trưởng lão dạy', if: (s) => s.sect.elders > 0, do: (s) => mark(s, 'prodigy', 2), log: 'Thiếu niên được đưa vào nội môn, giao cho các trưởng lão dạy dỗ.' },
      { t: 'Thả vào ngoại môn như mọi người', do: (s) => mark(s, 'prodigy', -1), log: 'Thiên tài hay không, cứ để thời gian trả lời.' },
    ],
  },
  {
    id: 'prodigy_grown', r: [4, 11], once: true, w: 3, icon: '🌳',
    if: (s) => !!s.sect && s.flags.prodigy > 0 && s.flags.prodigy < 3 && since(s, 'prodigyT') >= 8,
    title: () => 'Thiếu niên năm xưa',
    text: (s) => `Thiếu niên năm xưa giờ đã là ${G.REALMS[realmCap(s)].n}, kiếm khí ngút trời. ${s.flags.prodigy === 1 ? '«Sư tôn, đệ tử đã thành tài.»' : 'Trong nội môn không ai còn là đối thủ.'}`,
    ch: [
      { t: 'Phong làm trưởng lão', do: (s) => { s.tmp = addElder(s, { R: realmCap(s), loy: s.flags.prodigy === 1 ? 95 : 75, title: 'Thân Truyền' }); mark(s, 'prodigy', 3); },
        fx: { fame: 3 }, log: (s) => `${s.tmp.n} trở thành trưởng lão trẻ nhất trong lịch sử ${s.sect.name}.`, k: 'key' },
      { t: 'Để xuống núi lịch luyện', fx: { fame: 5, tam: 4 }, do: (s) => mark(s, 'prodigy', 3),
        log: 'Vài năm sau, tên tuổi đệ tử ấy vang khắp đại lục, ai cũng biết xuất thân từ tông môn của bạn.', k: 'good' },
    ],
  },
];

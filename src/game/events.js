import G from './data.js';
import {
  R, rand, pick, wpick, clamp, realm, nextRealm, lifeOf, unit, hasTrait, canAlch, realmLabel,
  winP, peer, cp, btChance, advance, btFail, hold, upgradeSkill, upgradeGong, genName, pronoun,
  beastGrade, pillNeed, priceOf, give, peekBest, takeBest, countOf, spend, earn, lose, itemName, fmtGold, tierFor, die,
} from './util.js';
import { genMissions, missionChoice, pillPower } from './economy.js';
import { genGear, obtainGear, gearDesc, estateIncome } from './gear.js';
import {
  region, regionDef, landIds, landCount, conquerP, warPower, defendP, arrayP, takeLand, loseLand, canFound, foundSect, genSectName, bLv, sectPower,
} from './sect.js';
import { smithLv, armValue } from './forge.js';
import { troopCount, armyPower, armyLoss } from './army.js';
import { shock, itemFair } from './exchange.js';
import { unified } from './emperor.js';
import { bossPower, dechienP, upHeld, writeRebirth } from './upper.js';
import { addBeast, owns, ensureBeasts } from './beasts.js';
import { ensureSkills } from './skills.js';
import { ARCS } from './arcs.js';
import { addElder, removeElder, leastLoyal, ensureElders } from './elders.js';

// Vây thành bằng quân đội: chỉ tính quân và tông môn, bạn không ra trận nên không có rủi ro tính mạng
const armySiegeP = (s) => clamp(1 / (1 + Math.exp(-(armyPower(s) + sectPower(s) + 10 - regionDef(s, region(s.tmp))) / 8)), 0.04, 0.92);
const phaBonus = (s) => { const g = peekBest(s, 'pha'); return g ? 0.2 * pillPower(s, g) : 0; };

const advLog = (s) => `Một tiếng nổ trầm đục vang lên trong đan điền. Bạn đã bước vào ${realm(s).n}! Thọ nguyên tăng lên ${lifeOf(s)} năm.`;
const loot = (s) => (R() < 0.5 && s.gong < 4 ? upgradeGong(s) : upgradeSkill(s));
const beastName = (s) => `ma thú cấp ${Math.min(9, s.R + 1)}`;
const feedCores = (s) => { for (let i = 0; i < 3; i++) takeBest(s, 'core'); };
const partnerWord = (s) => (s.partner ? s.partner.name : 'người ấy');

function pickFire(s) {
  const owned = new Set(s.fires);
  const req = (rank) => (rank <= 5 ? 8 : rank <= 9 ? 6 : rank <= 13 ? 4 : 3);
  const pool = G.FIRES.filter(([n, rank]) => !owned.has(n) && s.R >= req(rank) - 1);
  const f = wpick(pool, ([, rank]) => Math.pow(rank, 1.6));
  return f ? { n: f[0], rank: f[1], req: req(f[1]) } : null;
}

/* Lựa chọn: { t, if?, fx?, do?, log?, k?, roll?, ok?, fail?, die?, dieP? }
   Có roll: thành công dùng `ok`, thất bại dùng `fail`. */
export const EVENTS = [
  // ───────── Bắt buộc ─────────
  {
    id: 'breakthrough', force: true, icon: '⚡',
    title: (s) => `Bình cảnh ${nextRealm(s).n}`,
    text: (s) => `Đấu khí đã đạt đỉnh ${realmLabel(s)}, cuồn cuộn như muốn xé toạc kinh mạch. Đây là thời khắc xung kích ${nextRealm(s).n}.`,
    ch: [
      { t: 'Lập tức xung kích', roll: (s) => btChance(s, 0),
        ok: { do: advance, log: advLog, k: 'key' },
        fail: { do: btFail, fx: { body: -8, tam: -6 }, log: 'Đột phá thất bại, đấu khí phản phệ khiến kinh mạch đau như dao cắt.', dieP: (s) => (s.R >= 7 ? 0.1 : 0), die: 'Đột phá thất bại, đấu khí phản phệ mà chết' } },
      { t: (s) => `Uống ${itemName('pha', peekBest(s, 'pha'))} rồi xung kích`, if: (s) => peekBest(s, 'pha') > 0, roll: (s) => btChance(s, phaBonus(s)),
        ok: { do: (s) => { takeBest(s, 'pha'); advance(s); }, log: advLog, k: 'key' },
        fail: { fx: { body: -5, tam: -4 }, do: (s) => { takeBest(s, 'pha'); btFail(s); }, log: 'Dược lực tan hết mà bình cảnh vẫn không suy suyển.' } },
      { t: (s) => `Mua ${itemName('pha', pillNeed(s))} (${fmtGold(Math.round(priceOf('pha', pillNeed(s)) * 1.15))} kim tệ) rồi xung kích`,
        if: (s) => !peekBest(s, 'pha') && s.gold >= Math.round(priceOf('pha', pillNeed(s)) * 1.15),
        roll: (s) => btChance(s, 0.2),
        ok: { do: (s) => { spend(s, `Mua ${itemName('pha', pillNeed(s)).toLowerCase()}`, Math.round(priceOf('pha', pillNeed(s)) * 1.15)); advance(s); }, log: advLog, k: 'key' },
        fail: { fx: { body: -5, tam: -4 }, do: (s) => { spend(s, `Mua ${itemName('pha', pillNeed(s)).toLowerCase()}`, Math.round(priceOf('pha', pillNeed(s)) * 1.15)); btFail(s); }, log: 'Tiền mất, dược lực tan hết mà bình cảnh vẫn không suy suyển.' } },
      { t: 'Củng cố căn cơ một thời gian (3 lượt)', sub: 'Không bị ép đột phá, vẫn lịch luyện và gặp kỳ ngộ. Tu vi dư tích thành căn cơ.', fx: { tam: 3 },
        do: (s) => hold(s, 3),
        log: 'Bạn quyết định không vội vàng, tiếp tục mài giũa căn cơ. (Muốn xung kích sớm, bấm «Xung kích» trên thanh đấu khí.)' },
      { t: 'Bế quan dài hạn (8 lượt)', sub: 'Gác chuyện đột phá lâu hơn để làm việc khác. Căn cơ càng vững.', fx: { tam: 6 },
        do: (s) => hold(s, 8),
        log: 'Bạn gác lại bình cảnh, để đạo tâm tự nhiên chín muồi. (Có thể xung kích bất cứ lúc nào bằng nút «Xung kích».)' },
    ],
  },
  {
    id: 'duel', force: true, icon: '⚔️', title: () => 'Hẹn ước ba năm',
    text: () => 'Kỳ hạn ba năm đã đến. Bạn đứng giữa quảng trường tông môn, đối diện kẻ năm xưa đến tận nhà sỉ nhục mình. Hàng ngàn ánh mắt đổ dồn về đây.',
    ch: [
      { t: 'Toàn lực xuất thủ', fight: 1, roll: (s) => winP(s, 24),
        ok: { fx: { tam: 12, fame: 5 }, log: 'Một chiêu cuối cùng, đối thủ văng khỏi lôi đài. Cả tông môn chết lặng. Danh tiếng của bạn vang khắp đế quốc!', k: 'key' },
        fail: { fx: { body: -12, tam: -10 }, log: 'Bạn thất bại trước mặt hàng ngàn người. Nỗi nhục này còn đau hơn vết thương.' } },
      { t: 'Nhận thua, giữ lại mạng', fx: { tam: -8 }, log: 'Bạn cúi đầu rời khỏi quảng trường giữa tiếng cười nhạo.' },
    ],
  },
  {
    id: 'lifeend', force: true, icon: '⌛', title: () => 'Thọ nguyên sắp cạn',
    text: (s) => `Tóc bạn đã bạc trắng. Thọ nguyên ${lifeOf(s)} năm của ${realm(s).n} chỉ còn lại chút ít. Nếu không đột phá, bạn sẽ sớm tọa hóa.`,
    ch: [
      { t: 'Bế tử quan, dồn hết tiềm năng', roll: (s) => clamp(0.25 + (s.tam - 50) / 200 + (s.luck - 50) / 300),
        ok: { fx: { qi: 400, tam: 6 }, log: 'Trong cơn sinh tử, bạn chạm tới một tầng cảm ngộ mới. Đấu khí cuồn cuộn tăng vọt!', k: 'key' },
        fail: { die: 'Chết trong tử quan, hóa thành một bộ hài cốt khô' } },
      { t: 'Chấp nhận thiên mệnh, truyền lại sở học', fx: { tam: 20 }, do: (s) => { s.flags.legacy = true; },
        log: 'Bạn ghi chép tất cả những gì mình biết vào một quyển ngọc giản, để lại cho hậu nhân.', k: 'key' },
    ],
  },

  // ───────── Thơ ấu ─────────
  {
    id: 'baby_fire', a: [2, 5], once: true, icon: '🔥',
    text: () => 'Bạn bò ra sân, nhìn chằm chằm vào bếp lửa không chớp mắt.',
    ch: [
      { t: 'Đưa tay chạm vào ngọn lửa', fx: { body: -3, soul: 3 }, log: 'Bạn bị bỏng nhẹ. Nhưng từ đó, ngọn lửa như thân thuộc lạ thường.' },
      { t: 'Sợ hãi khóc ré lên', fx: { tam: -1, luck: 1 }, log: 'Mẹ chạy ra ôm bạn vào lòng.' },
    ],
  },
  {
    id: 'baby_story', a: [3, 5], once: true, icon: '📖',
    text: () => 'Ông lão đầu thôn kể chuyện về những cường giả Đấu Tông có thể đạp không mà đi, một chưởng san bằng núi non.',
    ch: [
      { t: '«Sau này con cũng sẽ như vậy!»', fx: { tam: 4 }, log: 'Một hạt giống nhỏ được gieo vào lòng bạn.' },
      { t: 'Chỉ muốn nghe chuyện ma', fx: { luck: 2, soul: 1 }, log: 'Bạn sợ đến mức không dám đi ngủ một mình.' },
    ],
  },

  // ───────── Thiếu niên ─────────
  {
    id: 'mock', a: [7, 16], icon: '😤', cd: 10,
    if: (s) => s.root <= 1,
    text: () => 'Đám thiếu niên cùng lứa chế giễu bạn là phế vật ngay giữa sân luyện võ.',
    ch: [
      { t: 'Nắm chặt tay, lặng lẽ rời đi', fx: { tam: 5 }, log: 'Bạn khắc sâu nỗi nhục này vào lòng.' },
      { t: 'Lao vào đánh nhau', fight: 1, roll: (s) => winP(s, cp(s) + 1),
        ok: { fx: { tam: 4, body: 2 }, log: 'Bạn đánh ngã kẻ cầm đầu. Từ đó không ai dám cười nữa.' },
        fail: { fx: { body: -6, tam: -4 }, log: 'Bạn bị đánh bầm dập, nằm liệt giường mấy ngày.' } },
    ],
  },
  {
    id: 'regress', a: [11, 14], once: true, w: (s) => (s.traits.includes('ring') ? 6 : 0.4), icon: '🥀',
    if: (s) => s.root >= 2 && s.started,
    text: () => 'Ba năm liền, đấu khí trong người bạn không những không tăng mà còn tiêu tán dần. Thiên tài năm nào giờ bị cả tộc gọi là phế vật.',
    ch: [
      { t: 'Cắn răng khổ luyện mỗi đêm', fx: { tam: 8, qi: -300 }, log: 'Đêm nào bạn cũng tu luyện đến kiệt sức, dù đấu khí vẫn cứ tan biến.' },
      { t: 'Buông xuôi', fx: { tam: -10, qi: -300 }, log: 'Bạn bỏ bê tu luyện, suốt ngày lang thang ngoài chợ.' },
    ],
  },
  {
    id: 'ring', a: [12, 17], once: true, w: 10, icon: '💍',
    if: (s) => s.traits.includes('ring') && !s.master,
    text: () => 'Đêm khuya, chiếc nhẫn đen trên tay bỗng phát sáng. Một bóng lão nhân hư ảo hiện ra, cười khà khà: «Mấy năm nay, đấu khí của tiểu tử ngươi đều bị lão phu hấp thu cả…»',
    ch: [
      { t: 'Quỳ xuống bái sư', fx: { soul: 12, tam: 6, qi: 250 },
        do: (s) => { s.master = 'Lão giả trong nhẫn'; },
        log: 'Bạn dập đầu bái sư. Lão nhân là một luyện dược sư lừng lẫy năm xưa. Đấu khí bị hút đi bắt đầu hoàn trả!', k: 'key' },
      { t: 'Sợ hãi ném nhẫn xuống hồ', fx: { tam: -3 },
        do: (s) => { s.traits = s.traits.filter((t) => t !== 'ring'); },
        log: 'Chiếc nhẫn chìm xuống đáy hồ. Có lẽ bạn vừa ném đi cơ duyên lớn nhất đời mình.' },
    ],
  },
  {
    id: 'cure', a: [8, 40], once: true, w: 2, icon: '🌿',
    if: (s) => s.root === 0 && !s.cured,
    text: () => 'Một lão dược sư lang thang nhìn ra kinh mạch bế tắc của bạn, bảo rằng có một phương thuốc có thể khai thông. Cái giá là bảy ngày bảy đêm đau như lửa thiêu.',
    ch: [
      { t: 'Chịu đựng', roll: (s) => clamp(0.55 + (s.body - 50) / 150),
        ok: { fx: { tam: 8 }, do: (s) => { s.cured = true; }, log: 'Bạn cắn nát môi mà không kêu một tiếng. Ngày thứ bảy, kinh mạch thông suốt!', k: 'key' },
        fail: { fx: { body: -10 }, log: 'Phương thuốc thất bại. Thân thể bạn yếu đi trông thấy.' } },
      { t: 'Từ chối, sống một đời bình thường', fx: { tam: 4 }, log: 'Bạn cảm ơn lão nhân rồi quay về làm việc của mình.' },
    ],
  },
  {
    id: 'betrothal', a: [14, 18], once: true, w: 2, icon: '📜',
    if: (s) => s.wealth >= 1,
    text: () => 'Người của một đại tông môn đến tận gia tộc, công khai đòi hủy hôn ước với bạn vì bạn «không xứng». Cả đại sảnh lặng ngắt.',
    ch: [
      { t: 'Lập hẹn ước ba năm: đến hạn sẽ lên tông môn quyết đấu', fx: { tam: 6 },
        do: (s) => { s.flags.duel = s.age + 3; },
        log: '«Ba mươi năm hướng đông, ba mươi năm hướng tây — chớ khinh thiếu niên nghèo!» Câu nói ấy truyền khắp thành.', k: 'key' },
      { t: 'Tự tay viết hưu thư ném trả', fx: { tam: 4, fame: 1 }, log: 'Bạn viết một tờ hưu thư, ném thẳng vào mặt sứ giả.' },
      { t: 'Nhẫn nhục chấp nhận', fx: { tam: -8 }, log: 'Bạn cúi đầu. Đêm đó bạn không ngủ được.' },
    ],
  },
  {
    id: 'academy', a: [13, 22], r: [1, 4], once: true, w: 2, icon: '🏛️',
    if: (s) => s.faction !== 'Già Nam Học Viện' && !s.sect,
    text: () => 'Già Nam Học Viện đến chiêu sinh. Nghe nói đó là học viện mạnh nhất đại lục, nội viện còn có Thiên Phần Luyện Khí Tháp.',
    ch: [
      { t: 'Tham gia khảo hạch', roll: (s) => clamp(0.15 + (s.R - 1) * 0.25 + s.step * 0.03 + (s.soul - 50) / 200),
        ok: { fx: { tam: 6 }, do: (s) => { s.faction = 'Già Nam Học Viện'; if (s.gong < 1) s.gong = 1; }, log: 'Bạn vượt qua khảo hạch, chính thức trở thành học viên Già Nam Học Viện!', k: 'key' },
        fail: { fx: { tam: -4 }, log: 'Bạn trượt khảo hạch. Giám khảo lắc đầu: «Thiên phú bình thường.»' } },
      { t: 'Không đi', fx: { tam: 1 }, log: 'Bạn chọn ở lại quê nhà.' },
    ],
  },
  {
    id: 'sect', a: [12, 40], r: [0, 5], once: true, icon: '🏯',
    if: (s) => !s.faction,
    prep: (s) => { s.tmp = pick(['Vân Lam Tông', 'Hoa Tông', 'Thiên Xà Phủ', 'Băng Hà Cốc']); },
    text: (s) => `${s.tmp} mở sơn môn thu nhận đệ tử. Trước cổng núi, hàng ngàn thiếu niên xếp hàng chờ khảo hạch.`,
    ch: [
      { t: (s) => `Bái nhập ${s.tmp}`, roll: (s) => clamp(0.3 + s.R * 0.12),
        ok: { do: (s) => { s.faction = s.tmp; if (s.gong < 1) s.gong = 1; }, fx: { tam: 4 }, log: (s) => `Bạn trở thành đệ tử ${s.tmp}, được truyền thụ công pháp Hoàng giai.`, k: 'key' },
        fail: { fx: { tam: -3 }, log: 'Bạn bị loại ngay vòng đầu.' } },
      { t: 'Làm tán tu tự do', fx: { tam: 2, luck: 2 }, log: 'Bạn thích tự do tự tại hơn khuôn phép tông môn.' },
    ],
  },
  {
    id: 'hon', a: [16, 9999], r: [3, 9], once: true, w: 0.6, icon: '🌑',
    if: (s) => !s.evil && !s.sect,
    text: () => 'Một hắc bào nhân của Hồn Điện tìm đến, hứa ban cho bạn sức mạnh vượt xa tưởng tượng nếu chịu quy thuận.',
    ch: [
      { t: 'Quy thuận Hồn Điện', fx: { tam: -12 },
        do: (s) => { s.evil = true; s.faction = 'Hồn Điện'; },
        log: 'Bạn khoác lên hắc bào. Tốc độ tu luyện tăng vọt — cái giá là linh hồn của kẻ khác.', k: 'key' },
      { t: 'Từ chối và ra tay', fight: 1, roll: (s) => winP(s, peer(s, 2)),
        ok: { fx: { tam: 4, fame: 1 }, do: (s) => { s.flags.honEnemy = true; }, log: 'Bạn đánh lui hắc bào nhân. Hồn Điện sẽ không bỏ qua chuyện này.' },
        fail: { fx: { body: -15 }, do: (s) => { s.flags.honEnemy = true; }, log: 'Bạn trọng thương nhưng may mắn thoát được.', dieP: 0.1, die: 'Bị Hồn Điện sát hại' } },
    ],
  },
  {
    id: 'hon_hunt', r: [3, 10], w: 0.7, cd: 12, icon: '🗡️',
    if: (s) => !s.evil && (s.flags.honEnemy || s.fires.length > 0),
    text: (s) => (s.fires.length ? `Hồn Điện đánh hơi được ${s.fires[0]} trong người bạn. Ba hắc bào nhân chặn đường giữa đêm.` : 'Người của Hồn Điện truy sát bạn để báo thù.'),
    ch: [
      { t: 'Liều chết nghênh chiến', fight: 1, roll: (s) => winP(s, peer(s, 3)),
        ok: { fx: { tam: 6, fame: 3, body: -5 }, log: 'Bạn chém giết hắc bào nhân, thu được nạp giới của chúng.', k: 'good' },
        fail: { fx: { body: -25 }, log: 'Bạn bị đánh trọng thương.', dieP: 0.35, die: 'Bị Hồn Điện truy sát đến chết, linh hồn bị luyện hóa' } },
      { t: 'Bỏ chạy', roll: (s) => clamp(0.4 + s.luck / 200),
        ok: { fx: { tam: -2 }, log: 'Bạn thoát được trong gang tấc.' },
        fail: { fx: { body: -15 }, log: 'Bạn bị đuổi kịp, mất nửa cái mạng mới chạy thoát.', dieP: 0.15, die: 'Bị Hồn Điện truy sát đến chết' } },
    ],
  },
  {
    id: 'evil_regret', w: 0.6, cd: 15, icon: '👻',
    if: (s) => s.evil,
    text: () => 'Những linh hồn bạn từng thu đoạt bắt đầu gào thét trong giấc mơ mỗi đêm.',
    ch: [
      { t: 'Phản bội Hồn Điện, quay đầu là bờ', fx: { tam: 10 },
        do: (s) => { s.evil = false; s.faction = null; s.flags.honEnemy = true; },
        log: 'Bạn xé nát hắc bào. Từ nay, cả Hồn Điện đều là kẻ thù của bạn.', k: 'key' },
      { t: 'Tiếp tục con đường này', fx: { tam: -8, qi: 40 }, log: 'Bạn nuốt thêm một linh hồn. Tiếng gào thét im bặt.' },
    ],
  },

  // ───────── Lịch luyện / kỳ ngộ ─────────
  {
    id: 'beast', a: [10, 9999], r: [0, 8], wild: true, cd: 3, icon: '🐺',
    text: (s) => `Sâu trong Ma Thú Sơn Mạch, một con ${beastName(s)} đang canh giữ một gốc linh dược ngàn năm.`,
    ch: [
      { t: 'Xông lên cướp linh dược', fight: 1, roll: (s) => winP(s, peer(s, 1)),
        ok: {
          fx: { qi: 60, item: (s) => [['core', beastGrade(s), 1], ['herb', beastGrade(s) + 1, 2]] },
          do: (s) => {
            ensureBeasts(s);
            if (!s.beasts.mount && s.R >= 1 && R() < 0.25) {
              const list = G.MOUNTS.filter((m) => s.R >= m.minR && !owns(s, 'mount', m.id));
              if (list.length) {
                const m = list[0];
                addBeast(s, 'mount', m.id);
                s.beasts.mount = m.id;
                s.post ||= [];
                s.post.push({ t: `Bên cạnh linh dược, bạn phát hiện một con ấu thú ${m.n} có linh tính. Bạn thu nhận và cưỡi nó làm tọa kỵ!`, k: 'key' });
              }
            }
          },
          log: (s) => `Bạn hạ được ma thú, thu về một khỏa ma hạch cấp ${beastGrade(s)} và hai gốc linh dược ${Math.min(9, beastGrade(s) + 1)} phẩm.`,
          k: 'good',
        },
        fail: { fx: { body: -15 }, log: 'Ma thú quá mạnh, bạn trọng thương bỏ chạy.', dieP: (s) => (s.body < 30 ? 0.15 : 0.03), die: 'Vẫn lạc dưới nanh vuốt ma thú' } },
      {
        t: 'Thuần phục ma thú làm tọa kỵ',
        if: (s) => s.R >= 1 && G.MOUNTS.some((m) => s.R >= m.minR && !owns(s, 'mount', m.id)),
        fight: 1,
        roll: (s) => winP(s, peer(s, 1.1)),
        ok: {
          do: (s) => {
            ensureBeasts(s);
            const list = G.MOUNTS.filter((m) => s.R >= m.minR && !owns(s, 'mount', m.id));
            const target = list[list.length - 1];
            if (target) {
              addBeast(s, 'mount', target.id);
              s.beasts.mount = target.id;
              s.tmp = target.n;
            }
          },
          fx: { qi: 40, tam: 2 },
          log: (s) => `Bạn áp chế được hung tính của ma thú, thành công thuần phục ${s.tmp || 'tọa kỵ'} làm thú cưỡi!`,
          k: 'key',
        },
        fail: {
          fx: { body: -18 },
          log: 'Hung tính ma thú bộc phát dữ dội, phản phệ khiến bạn trọng thương bỏ chạy.',
          dieP: (s) => (s.body < 30 ? 0.15 : 0.03),
          die: 'Vẫn lạc dưới nanh vuốt ma thú',
        },
      },
      { t: 'Lặng lẽ rút lui', fx: { tam: 1 }, log: 'Bạn nín thở lùi lại. Sống sót mới là quan trọng.' },
    ],
  },
  {
    id: 'cave', a: [10, 9999], wild: true, w: 0.7, cd: 8, icon: '🕳️',
    text: () => 'Bạn trượt chân rơi xuống vực sâu, phát hiện một động phủ phủ đầy rêu của một cường giả viễn cổ.',
    ch: [
      { t: 'Mạo hiểm tiến vào', roll: (s) => clamp(0.35 + s.luck / 150),
        ok: { do: (s) => { s.tmp = loot(s); }, fx: { qi: 40 }, log: (s) => `Trên bệ đá là một quyển ${s.tmp}! Bạn mừng như điên.`, k: 'key' },
        fail: { fx: { body: -12 }, log: 'Cấm chế trong động phủ bộc phát, bạn bị thương nặng.', dieP: 0.06, die: 'Chết trong cấm chế của động phủ viễn cổ' } },
      { t: 'Tìm đường leo lên', fx: { body: 1 }, log: 'Bạn mất ba ngày mới leo lên được.' },
    ],
  },
  {
    id: 'fire', r: [3, 10], w: (s) => (s.fires.length ? 0.35 : 0.8), cd: 10, icon: '🔥',
    if: (s) => s.fires.length < 3 && !!pickFire(s),
    prep: (s) => {
      const f = pickFire(s);
      s.tmp = { ...f, place: pick(['sa mạc Tháp Qua Nhĩ', 'đáy một hồ dung nham', 'nơi sâu nhất Ma Thú Sơn Mạch', 'một cổ mộ dưới lòng đất', 'đáy biển Hải Tâm']) };
    },
    text: (s) => `Có tin đồn ${s.tmp.n} — hạng ${s.tmp.rank} trên Dị Hỏa Bảng — vừa xuất hiện ở ${s.tmp.place}.`,
    ch: [
      { t: (s) => `Đi thu phục ${s.tmp.n}`,
        roll: (s) => clamp(0.4 + (s.R - s.tmp.req) * 0.12 + (s.body - 50) / 200 + (s.luck - 50) / 300 - s.fires.length * 0.08 + (s.master ? 0.1 : 0)),
        ok: { do: (s) => { s.fires.push(s.tmp.n); }, fx: { qi: 150, body: 5 },
              log: (s) => `Lửa thiêu đốt từng tấc xương thịt, nhưng bạn không gục ngã. ${s.tmp.n} đã bị bạn thôn phệ!`, k: 'key' },
        fail: { fx: { body: -25, tam: -5 }, log: 'Dị hỏa phản kháng dữ dội, thiêu cháy nửa người bạn.', dieP: 0.2, die: 'Bị dị hỏa thiêu thành tro bụi' } },
      { t: 'Không tranh đoạt', fx: { tam: 1 }, log: 'Bạn biết sức mình chưa đủ.' },
    ],
  },
  {
    id: 'companion', a: [8, 9999], wild: true, once: true, w: 0.6, icon: '🦊',
    text: () => 'Bạn bắt gặp một con ma thú nhỏ bị thương, nằm thoi thóp bên bờ suối.',
    ch: [
      { t: 'Cứu và thu nhận nó', fx: { luck: 6 },
        do: (s) => { const id = pick(['ho', 'ung', 'mang', 'lan', 'tho', 'quy'].filter((x) => !owns(s, 'pet', x))) || 'ho'; addBeast(s, 'pet', id); s.beasts.pet = id; s.companion = G.PETS.find((p) => p.id === id).n; },
        log: (s) => `Bạn băng bó cho nó. Từ đó, ${s.companion} không rời bạn nửa bước.`, k: 'key' },
      { t: 'Để mặc nó', fx: { tam: -1 }, log: 'Bạn bước đi, không ngoảnh lại.' },
    ],
  },
  {
    id: 'mount_tame', a: [14, 9999], r: [1, 11], wild: true, cd: 8, w: 0.5, icon: '🐺',
    if: (s) => G.MOUNTS.some((m) => s.R >= m.minR && !owns(s, 'mount', m.id)),
    prep: (s) => { const list = G.MOUNTS.filter((m) => s.R >= m.minR && !owns(s, 'mount', m.id)); s.tmp = list[list.length - 1].id; },
    title: () => 'Dã thú vô chủ',
    text: (s) => `Giữa thảo nguyên, một con ${G.MOUNTS.find((m) => m.id === s.tmp).n} hoang dã ngẩng đầu gầm vang. Nó chưa từng chịu khuất phục ai.`,
    ch: [
      { t: 'Đánh cho nó tâm phục khẩu phục', fight: 1, roll: (s) => winP(s, peer(s, 1)),
        ok: { do: (s) => { ensureBeasts(s); addBeast(s, 'mount', s.tmp); s.beasts.mount = s.tmp; }, log: (s) => `Sau ba ngày vật lộn, ${G.MOUNTS.find((m) => m.id === s.tmp).n} cúi đầu nhận bạn làm chủ.`, k: 'key' },
        fail: { fx: { body: -12 }, log: 'Nó hất bạn văng xa mấy trượng rồi phóng đi mất.', dieP: 0.04, die: 'Bị dã thú giẫm nát giữa thảo nguyên' } },
      { t: 'Dùng ma hạch dụ dỗ', if: (s) => countOf(s, 'core', beastGrade(s)) >= 3, roll: () => 0.55,
        ok: { do: (s) => { feedCores(s); ensureBeasts(s); addBeast(s, 'mount', s.tmp); s.beasts.mount = s.tmp; }, log: (s) => `Ăn xong ba khỏa ma hạch, ${G.MOUNTS.find((m) => m.id === s.tmp).n} ngoan ngoãn để bạn leo lên lưng.`, k: 'key' },
        fail: { do: feedCores, log: 'Nó ăn sạch ma hạch rồi bỏ chạy. Mất cả chì lẫn chài.', k: 'bad' } },
      { t: 'Để nó tự do', fx: { tam: 2 }, log: 'Bạn đứng nhìn nó lao vút về phía chân trời.' },
    ],
  },
  {
    id: 'treasure', a: [12, 9999], wild: true, w: 0.6, cd: 6, icon: '💍',
    text: () => 'Bạn nhặt được một chiếc nạp giới bên cạnh bộ hài cốt của một cường giả đã chết.',
    ch: [
      { t: 'Mở ra xem', roll: () => 0.6,
        ok: { fx: { gold: 4, why: 'Nhặt được nạp giới', item: (s) => [['tuk', pillNeed(s), 2], ['core', beastGrade(s), 1]] },
              do: (s) => { s.tmp = R() < 0.5 ? obtainGear(s, genGear(s)) : null; },
              log: (s) => `Bên trong có ${fmtGold(unit(s) * 4)} kim tệ, 2 viên ${itemName('tuk', pillNeed(s))}, một khỏa ma hạch${s.tmp ? ` và ${s.tmp}` : ''}!`, k: 'good' },
        fail: { fx: { body: -6 }, log: 'Bên trong có cấm chế, nổ tung ngay trước mặt bạn.' } },
      { t: 'Chôn cất hài cốt tử tế', fx: { tam: 4, luck: 3 }, log: 'Bạn chôn cất người đã khuất. Lòng bỗng thấy thanh thản.' },
    ],
  },
  {
    id: 'merchant', a: [10, 9999], w: 0.4, cd: 10, icon: '🧓',
    text: () => 'Một lão già bày sạp ven đường, nhất quyết bán cho bạn một quyển bí tịch rách nát với giá rẻ bèo.',
    ch: [
      { t: (s) => `Mua thử (${fmtGold(unit(s) * 0.3)} kim tệ)`, if: (s) => s.gold >= unit(s) * 0.3, fx: { gold: -0.3, why: 'Mua bí tịch ven đường' }, roll: (s) => clamp(0.2 + s.luck / 400),
        ok: { do: (s) => { s.tmp = upgradeSkill(s); }, log: (s) => `Không ngờ lại là ${s.tmp} thật!`, k: 'key' },
        fail: { log: 'Mở ra… toàn là tranh vẽ bậy. Bạn bị lừa rồi.' } },
      { t: 'Bỏ đi', log: 'Bạn không tin vào chuyện trên trời rơi xuống.' },
    ],
  },
  {
    id: 'auction', a: [14, 9999], w: 0.6, cd: 8, icon: '🔨',
    if: (s) => s.gold >= 1500,
    prep: (s) => {
      const opts = [];
      if (s.gong < 4) opts.push({ kind: 'gong', n: `công pháp ${G.GRADES[s.gong + 1]}`, start: G.GONG_PRICE[s.gong + 1] });
      if (s.skill < 4) opts.push({ kind: 'skill', n: `đấu kỹ ${G.GRADES[s.skill + 1]}`, start: G.GONG_PRICE[s.skill + 1] * 0.6 });
      opts.push({ kind: 'pill', n: `3 viên ${itemName('pha', pillNeed(s))}`, start: priceOf('pha', pillNeed(s)) * 2.4 });
      const o = pick(opts);
      // Giá chốt thực tế: cao hơn giá khởi điểm vì có người tranh
      s.tmp = { ...o, start: Math.round(o.start), final: Math.round(o.start * rand(1.3, 2.2)) };
    },
    text: (s) => `Phòng đấu giá Mễ Đặc Nhĩ mở phiên. Vật phẩm chủ chốt: ${s.tmp.n}. Giá khởi điểm ${fmtGold(s.tmp.start)} kim tệ. Bạn đang có ${fmtGold(s.gold)}.`,
    ch: [
      { t: (s) => `Theo đến cùng (dự kiến ~${fmtGold(s.tmp.final)})`, if: (s) => s.gold >= s.tmp.start,
        roll: (s) => clamp((s.gold - s.tmp.start) / (s.tmp.final - s.tmp.start + 1)),
        ok: {
          do: (s) => {
            spend(s, `Đấu giá ${s.tmp.n}`, Math.min(s.gold, s.tmp.final));
            if (s.tmp.kind === 'gong') upgradeGong(s);
            else if (s.tmp.kind === 'skill') upgradeSkill(s);
            else give(s, 'pha', pillNeed(s), 3);
          },
          log: (s) => `Sau một hồi tranh giá kịch liệt, bạn đã có được ${s.tmp.n}.`, k: 'good' },
        fail: { fx: { tam: -2 }, log: (s) => `Một đại gia tộc ra giá ${fmtGold(s.tmp.final)}. Bạn đành bỏ cuộc.` } },
      { t: 'Chỉ đến xem', log: 'Bạn ngồi xem các đại gia tộc tranh nhau ra giá.' },
    ],
  },
  {
    id: 'epiphany', r: [1, 10], w: 0.5, cd: 6, icon: '🌊',
    text: () => 'Ngồi bên thác nước, nhìn dòng nước va vào đá, bạn bỗng có một tia cảm ngộ về đấu khí.',
    ch: [
      { t: 'Lập tức nhập định', fx: { qi: 80, tam: 2 }, log: 'Bạn ngồi bất động suốt bảy ngày. Đấu khí tăng lên rõ rệt.', k: 'good' },
      { t: 'Ghi chép lại để nghiền ngẫm', fx: { soul: 4, tam: 1 }, log: 'Bạn ghi lại từng ý nghĩ vào sổ tay.' },
    ],
  },

  // ───────── Tranh đấu / danh tiếng ─────────
  {
    id: 'rival', a: [14, 9999], w: 0.6, cd: 10, icon: '🤺',
    prep: (s) => { s.tmp = genName(R() < 0.6 ? 'm' : 'f'); },
    text: (s) => `${s.tmp}, một thiên tài cùng lứa, tuyên bố trước mặt mọi người rằng sẽ giẫm bạn dưới chân.`,
    ch: [
      { t: 'Nhận lời khiêu chiến', fight: 1, roll: (s) => winP(s, cp(s) + rand(-3, 4)),
        ok: { fx: { tam: 6, fame: 2 }, log: (s) => `Bạn đánh bại ${s.tmp} chỉ sau mười chiêu.`, k: 'good' },
        fail: { fx: { body: -8, tam: -5 }, log: (s) => `${s.tmp} thắng bạn một chiêu. Bạn thề sẽ đòi lại.` } },
      { t: 'Phớt lờ', fx: { tam: 1 }, log: 'Bạn không phí thời gian với kẻ ồn ào.' },
    ],
  },
  {
    id: 'tournament', a: [15, 9999], r: [1, 7], w: 0.6, cd: 10, icon: '🏆',
    text: (s) => `Đại hội tỷ võ được tổ chức. Phần thưởng cho quán quân là một quyển đấu kỹ ${G.GRADES[Math.min(4, s.skill + 1)]}.`,
    ch: [
      { t: 'Báo danh tham gia', fight: 1, roll: (s) => winP(s, peer(s, 2)),
        ok: { do: (s) => { upgradeSkill(s); }, fx: { fame: 3, tam: 5 }, log: 'Bạn đoạt ngôi quán quân, cả khán đài reo hò tên bạn!', k: 'key' },
        fail: { fx: { body: -10 }, log: 'Bạn bị loại ở vòng bán kết.' } },
      { t: 'Đứng ngoài quan sát', fx: { soul: 2 }, log: 'Xem người khác giao đấu, bạn cũng học được không ít.' },
    ],
  },
  {
    id: 'clan_crisis', a: [16, 150], r: [3, 8], once: true, w: 1.2, icon: '🏚️',
    if: (s) => s.parents.alive && s.wealth >= 1,
    text: () => 'Tin dữ truyền tới: gia tộc bị một thế lực lớn vây đánh, phụ mẫu bạn đang lâm nguy.',
    ch: [
      { t: 'Lập tức quay về', fight: 1, roll: (s) => winP(s, peer(s, 1)),
        ok: { fx: { tam: 10, fame: 3 }, log: 'Bạn một mình xông vào giữa vòng vây, đẩy lui toàn bộ kẻ địch. Cả gia tộc quỳ xuống cảm tạ.', k: 'key' },
        fail: { fx: { body: -18, tam: -12 }, do: (s) => { s.parents.alive = false; }, log: 'Bạn về quá muộn. Trước mắt chỉ còn tro tàn.', k: 'bad' } },
      { t: 'Đang bế quan, không thể rời đi', fx: { tam: -15, qi: 60 }, do: (s) => { if (R() < 0.5) s.parents.alive = false; },
        log: (s) => (s.parents.alive ? 'Gia tộc may mắn cầm cự được, nhưng bạn day dứt mãi.' : 'Khi bạn xuất quan, phụ mẫu đã không còn.') },
    ],
  },
  {
    id: 'heart', r: [2, 10], w: (s) => (s.tam < 35 ? 2.5 : 0.35), cd: 8, icon: '🌀',
    text: () => 'Tâm ma trỗi dậy. Những ký ức đau đớn nhất hiện về chân thực như vừa xảy ra.',
    ch: [
      { t: 'Cưỡng ép trấn áp', roll: (s) => clamp(0.3 + s.tam / 120 + (s.soul - 50) / 200),
        ok: { fx: { tam: 12 }, log: 'Bạn chém tan tâm ma. Đạo tâm càng thêm vững chắc.', k: 'good' },
        fail: { fx: { tam: -15 }, log: 'Tâm ma chiếm thế thượng phong, đấu khí trong người hỗn loạn.', dieP: (s) => (s.tam < 20 ? 0.3 : 0.05), die: 'Tẩu hỏa nhập ma' } },
      { t: 'Tạm ngừng tu luyện để tĩnh tâm', fx: { qi: -60, tam: 8 }, log: 'Bạn rời động phủ, đi dạo giữa nhân gian để tìm lại bình yên.' },
    ],
  },
  {
    id: 'pill_exam', a: [14, 9999], w: 0.7, cd: 10, icon: '⚗️',
    if: (s) => s.alch >= 1,
    text: () => 'Đan Tháp tổ chức đại hội luyện dược sư. Luyện dược sư khắp đại lục đều tề tựu.',
    ch: [
      { t: 'Tham gia tranh tài', roll: (s) => clamp(0.3 + s.alch * 0.05 + (s.soul - 50) / 150 + s.fires.length * 0.08),
        ok: { fx: { goldAbs: (s) => priceOf('pha', s.alch) * 3, why: 'Giải thưởng Đan Tháp', soul: 4, fame: 3, item: (s) => [['herb', Math.min(9, s.alch + 1), 4]] },
              log: (s) => `Lò đan của bạn tỏa ra đan hương ngào ngạt. Bạn đoạt hạng nhất, nhận ${fmtGold(priceOf('pha', s.alch) * 3)} kim tệ và 4 phần dược liệu quý!`, k: 'key' },
        fail: { fx: { tam: -3 }, log: 'Lò đan nổ tung giữa chừng. Thật mất mặt.' } },
      { t: 'Không tham gia', log: 'Bạn không thích náo nhiệt.' },
    ],
  },
  {
    id: 'disciple', r: [6, 11], w: 0.5, cd: 12, icon: '🙇',
    text: () => 'Một thiếu niên áo rách quỳ trước động phủ của bạn ba ngày ba đêm, xin được bái sư.',
    ch: [
      { t: 'Thu làm đệ tử', fx: { tam: 5 }, do: (s) => { s.disciples++; }, log: 'Bạn nhận cậu bé làm đệ tử. Trong mắt cậu, bạn thấy bóng dáng mình năm xưa.', k: 'good' },
      { t: 'Đuổi đi', fx: { tam: -1 }, log: 'Bạn không có thời gian dạy dỗ ai.' },
    ],
  },
  {
    id: 'ruin', r: [7, 10], once: true, w: 0.8, icon: '🏺',
    text: () => 'Di tích của một vị Đấu Đế viễn cổ xuất thế. Cường giả khắp Trung Châu đổ về tranh đoạt.',
    ch: [
      { t: 'Tiến vào tranh đoạt', fight: 1, roll: (s) => winP(s, peer(s, 3)),
        ok: { fx: { qi: 300, life: 100 }, do: (s) => { s.gong = 4; }, log: 'Bạn đoạt được truyền thừa của Đấu Đế: một bộ công pháp Thiên giai và một viên đan tăng trăm năm thọ nguyên!', k: 'key' },
        fail: { fx: { body: -30 }, log: 'Bạn bị đánh văng ra khỏi di tích.', dieP: 0.3, die: 'Vẫn lạc trong di tích Đấu Đế' } },
      { t: 'Đứng ngoài quan sát', fx: { tam: 3 }, log: 'Bạn nhìn những cường giả khác chém giết nhau, lòng không gợn sóng.' },
    ],
  },

  // ───────── Tiền bạc ─────────
  {
    id: 'mission', force: true, icon: '📋', title: (s) => (s.faction && !s.evil ? `Bảng nhiệm vụ · ${s.faction}` : 'Bảng nhiệm vụ · Dong Binh Công Hội'),
    prep: (s) => { s.tmp = genMissions(s); },
    text: (s) => `Trên bảng có vài nhiệm vụ hợp với thực lực ${realmLabel(s)} của bạn. Thù lao càng cao, hiểm nguy càng lớn.`,
    ch: (s) => [
      ...s.tmp.map((ms) => missionChoice(s, ms)),
      { t: 'Không nhận nhiệm vụ nào lần này', fx: { tam: 1 }, log: 'Bạn chỉ làm vài việc vặt ở công hội.' },
    ],
  },
  {
    id: 'robbed', a: [14, 9999], r: [0, 7], w: 0.6, cd: 10, icon: '🗡️',
    if: (s) => s.gold >= unit(s),
    prep: (s) => { s.tmp = Math.round(s.gold * rand(0.25, 0.4)); },
    text: (s) => `Trên đường vắng, một toán cướp bịt mặt chặn bạn lại, đòi ${fmtGold(s.tmp)} kim tệ tiền mãi lộ.`,
    ch: [
      { t: (s) => `Nộp ${fmtGold(s.tmp)} kim tệ cho yên chuyện`, do: (s) => { lose(s, 'Nộp tiền mãi lộ', s.tmp); }, fx: { tam: -3 }, log: 'Bạn ném túi tiền cho chúng rồi đi tiếp, lòng đầy uất ức.' },
      { t: 'Rút vũ khí', fight: 1, roll: (s) => winP(s, peer(s, -1)),
        ok: { fx: { gold: 1.5, why: 'Thu chiến lợi phẩm của bọn cướp', tam: 3 }, log: 'Bạn đánh tan bọn cướp, lục soát được cả túi tiền của chúng.', k: 'good' },
        fail: { do: (s) => { lose(s, 'Bị cướp', s.gold * 0.6); }, fx: { body: -12 }, log: 'Bạn bị đánh gục, chúng lấy gần hết tiền trên người bạn.', k: 'bad' } },
    ],
  },
  {
    id: 'rescue', a: [14, 9999], r: [1, 8], wild: true, w: 0.7, cd: 8, icon: '🐎',
    text: () => 'Bạn bắt gặp một đoàn thương nhân đang bị ma thú vây công, xe hàng đổ ngổn ngang.',
    ch: [
      { t: 'Ra tay cứu người', fight: 1, roll: (s) => winP(s, peer(s, 0)),
        ok: { fx: { gold: 3, why: 'Thương đội tạ ơn', tam: 4, fame: 1, item: (s) => [['lieu', pillNeed(s), 1]] },
              log: (s) => `Lão chủ thương đội rối rít cảm tạ, dúi vào tay bạn ${fmtGold(unit(s) * 3)} kim tệ và một viên ${itemName('lieu', pillNeed(s))}.`, k: 'good' },
        fail: { fx: { body: -12 }, log: 'Ma thú quá đông, bạn chỉ kịp cứu vài người rồi rút lui.' } },
      { t: 'Đi đường vòng', fx: { tam: -2 }, log: 'Bạn lặng lẽ đi đường khác.' },
    ],
  },
  {
    id: 'guest', r: [5, 10], w: 0.6, cd: 20, icon: '🏮',
    if: (s) => !s.salary,
    prep: (s) => { s.tmp = { clan: pick(['Nạp Lan gia', 'Mễ Đặc Nhĩ gia', 'Gia Liệt gia', 'Mộc gia', 'Liễu gia']), pay: Math.round(unit(s) * rand(0.6, 1)) }; },
    text: (s) => `${s.tmp.clan} mời bạn làm khách khanh trưởng lão, bổng lộc ${fmtGold(s.tmp.pay)} kim tệ mỗi năm. Đổi lại, khi gia tộc gặp nạn, bạn phải ra tay.`,
    ch: [
      { t: 'Nhận lời', do: (s) => { s.salary = s.tmp.pay; s.flags.guest = s.tmp.clan; }, fx: { fame: 1 },
        log: (s) => `Bạn trở thành khách khanh của ${s.tmp.clan}. Mỗi năm có ${fmtGold(s.tmp.pay)} kim tệ đều đặn.`, k: 'key' },
      { t: 'Từ chối, giữ tự do', fx: { tam: 2 }, log: 'Bạn không muốn bị ràng buộc.' },
    ],
  },
  {
    id: 'guest_duty', r: [5, 11], w: 0.8, cd: 10, icon: '🛡️',
    if: (s) => !!s.flags.guest,
    text: (s) => `${s.flags.guest} bị kẻ thù tìm đến tận cửa. Gia chủ cầu bạn ra tay theo giao ước.`,
    ch: [
      { t: 'Giữ lời, ra tay', fight: 1, roll: (s) => winP(s, peer(s, 1)),
        ok: { fx: { gold: 4, why: 'Gia tộc tạ ơn', fame: 2, tam: 3 }, log: (s) => `Bạn đẩy lui kẻ địch. ${s.flags.guest} tạ ơn bạn hậu hĩnh.`, k: 'good' },
        fail: { fx: { body: -18 }, log: 'Bạn trọng thương, nhưng đã giữ trọn lời hứa.', dieP: 0.05, die: 'Chết khi bảo vệ gia tộc mình làm khách khanh' } },
      { t: 'Bỏ đi, cắt đứt giao ước', do: (s) => { s.salary = 0; delete s.flags.guest; }, fx: { tam: -6, fame: -2 }, log: 'Bạn bỏ đi trong đêm. Từ nay mất khoản bổng lộc, danh tiếng cũng sứt mẻ.' },
    ],
  },
  {
    id: 'dwelling', r: [4, 10], w: 0.8, cd: 12, icon: '⛰️',
    if: (s) => s.dwelling < 3 && s.gold >= G.DWELLING[s.dwelling + 1][0] * 0.8,
    prep: (s) => { const [p, n] = G.DWELLING[s.dwelling + 1]; s.tmp = { n, price: Math.round(p * rand(0.85, 1.15)) }; },
    text: (s) => `Có người rao bán một ${s.tmp.n.toLowerCase()} — linh khí nồng đậm, tu luyện ở đó nhanh hơn hẳn. Giá ${fmtGold(s.tmp.price)} kim tệ.`,
    ch: [
      { t: (s) => `Mua (${fmtGold(s.tmp.price)})`, if: (s) => s.gold >= s.tmp.price,
        do: (s) => { spend(s, `Mua ${s.tmp.n.toLowerCase()}`, s.tmp.price); s.dwelling++; },
        log: (s) => `Bạn dọn vào ${s.tmp.n.toLowerCase()}. Hít một hơi, linh khí thấm vào tận xương tủy.`, k: 'key' },
      { t: 'Để dành tiền', log: 'Bạn cân nhắc rồi quyết định chưa mua.' },
    ],
  },
  {
    id: 'parent_ill', a: [16, 200], w: 0.7, once: true, icon: '🏥',
    if: (s) => s.parents.alive && s.parents.age > 45,
    prep: (s) => { s.tmp = Math.round(Math.max(300, unit(s) * 2)); },
    text: (s) => `Thư nhà báo tin phụ mẫu lâm bệnh nặng. Đại phu nói cần Hồi Xuân Đan, giá ${fmtGold(s.tmp)} kim tệ.`,
    ch: [
      { t: (s) => `Bỏ tiền mua thuốc (${fmtGold(s.tmp)})`, if: (s) => s.gold >= s.tmp,
        do: (s) => { spend(s, 'Thuốc chữa bệnh cho phụ mẫu', s.tmp); s.parents.age -= 5; }, fx: { tam: 8 }, log: 'Phụ mẫu khỏi bệnh. Mẹ nắm tay bạn rất lâu.', k: 'good' },
      { t: 'Tự vào núi hái thuốc', roll: (s) => clamp(0.35 + s.luck / 200 + (s.alch ? 0.2 : 0)),
        ok: { fx: { tam: 8, body: -4 }, do: (s) => { s.parents.age -= 5; }, log: 'Bạn tìm được dược liệu, tự tay sắc thuốc. Phụ mẫu dần hồi phục.', k: 'good' },
        fail: { fx: { tam: -12, body: -6 }, do: (s) => { s.parents.alive = false; }, log: 'Bạn trở về với giỏ thuốc thì đã muộn.', k: 'bad' } },
    ],
  },
  {
    id: 'borrow', a: [16, 9999], w: 0.5, cd: 15, icon: '🤲',
    if: (s) => s.gold >= unit(s) * 2,
    prep: (s) => { s.tmp = { name: genName(R() < 0.5 ? 'm' : 'f'), amt: Math.round(s.gold * rand(0.2, 0.4)) }; },
    text: (s) => `${s.tmp.name}, bạn cũ từ thuở hàn vi, tìm đến hỏi vay ${fmtGold(s.tmp.amt)} kim tệ để cứu gia đình.`,
    ch: [
      { t: 'Cho vay', roll: () => 0.55,
        ok: { do: (s) => { lose(s, 'Cho bạn cũ vay', s.tmp.amt); s.flags.debtor = { ...s.tmp, due: s.t + 3 }; }, fx: { tam: 3 }, log: 'Bạn đưa tiền. Người kia rơm rớm nước mắt hứa sẽ trả.' },
        fail: { do: (s) => { lose(s, 'Cho bạn cũ vay (mất trắng)', s.tmp.amt); }, fx: { tam: -5 }, log: 'Sau đó người kia biệt tăm. Bạn mất cả tiền lẫn bạn.' } },
      { t: 'Từ chối khéo', fx: { tam: -2 }, log: 'Bạn viện cớ đang túng. Người kia lặng lẽ ra về.' },
    ],
  },

  // ───────── Tình duyên ─────────
  {
    id: 'daolu', a: [16, 9999], cd: 8, icon: '🌸',
    w: (s) => (hasTrait(s, 'romance') ? 1.6 : 0.8),
    if: (s) => !s.partner,
    prep: (s) => { const g = s.g === 'm' ? 'f' : 'm'; s.tmp = { name: genName(g), g, mortal: R() < 0.35 }; },
    text: (s) => `Bạn gặp ${s.tmp.name}, ${s.tmp.mortal ? 'một phàm nhân không có đấu khí' : 'một tu sĩ'}. Hai người nói chuyện dưới trăng đến tận khuya.`,
    ch: [
      { t: 'Kết thành đạo lữ', roll: (s) => clamp(0.5 + (s.tam - 50) / 200 + s.luck / 400),
        ok: { fx: { tam: 10 }, do: (s) => { s.partner = { ...s.tmp, since: s.age, page: Math.round(s.age + rand(-3, 3)) }; },
              log: (s) => `Bạn và ${s.partner.name} kết thành đạo lữ.${s.partner.mortal ? ' Nhưng phàm nhân chỉ sống được vài chục năm…' : ''}`, k: 'key' },
        fail: { fx: { tam: -4 }, log: 'Duyên phận chưa tới. Hai người đường ai nấy đi.' } },
      { t: 'Chuyên tâm tu luyện', fx: { tam: 1 }, log: 'Đại đạo vô tình. Bạn quay về động phủ.' },
    ],
  },
  {
    id: 'kidnap', r: [3, 10], once: true, w: 0.5, icon: '⛓️',
    if: (s) => !!s.partner,
    text: (s) => `${partnerWord(s)} bị kẻ thù bắt đi, chúng nhắn bạn một mình đến chuộc người.`,
    ch: [
      { t: 'Một mình xông vào cứu', fight: 1, roll: (s) => winP(s, peer(s, 2)),
        ok: { fx: { tam: 8, fame: 2 }, log: (s) => `Bạn giết sạch kẻ địch, ôm ${partnerWord(s)} trở về.`, k: 'key' },
        fail: { fx: { body: -20, tam: -15 }, do: (s) => { s.lostPartner = s.partner.name; s.partner = null; },
                log: 'Bạn đến nơi thì đã quá muộn.', k: 'bad', dieP: 0.2, die: 'Chết khi liều mình cứu đạo lữ' } },
      { t: 'Đành nhẫn nhịn', fx: { tam: -20 }, do: (s) => { s.lostPartner = s.partner.name; s.partner = null; },
        log: 'Bạn không đi. Nỗi day dứt ấy theo bạn đến cuối đời.', k: 'bad' },
    ],
  },

  // ───────── Trang bị ─────────
  {
    id: 'gear_find', a: [10, 9999], wild: true, w: 0.6, cd: 6, icon: '🗡️',
    prep: (s) => { s.tmp = genGear(s); },
    text: (s) => `Giữa một bãi chiến trường cũ, bạn thấy ${s.tmp.n.toLowerCase()} cắm sâu vào vách đá, linh quang vẫn còn le lói. Một con ma thú đang nằm canh bên cạnh.`,
    ch: [
      { t: 'Đánh đuổi ma thú, đoạt lấy', fight: 1, roll: (s) => winP(s, peer(s, 1)),
        ok: { do: (s) => { s.tmp = obtainGear(s, s.tmp); }, log: (s) => `Bạn rút được ${s.tmp} khỏi vách đá!`, k: 'good' },
        fail: { fx: { body: -12 }, log: 'Ma thú hung hãn hơn bạn tưởng, bạn đành rút lui.', dieP: 0.03, die: 'Vẫn lạc dưới nanh vuốt ma thú' } },
      { t: 'Không mạo hiểm', fx: { tam: 1 }, log: 'Bạn lặng lẽ rời đi.' },
    ],
  },
  {
    id: 'smith', a: [14, 9999], w: 0.5, cd: 10, icon: '🔨',
    if: (s) => s.gold >= G.GEAR_PRICE[tierFor(s)] * 0.7,
    prep: (s) => {
      const it = genGear(s, { tier: tierFor(s) + (R() < 0.3 ? 1 : 0), q: R() < 0.4 ? 1.25 : 1 });
      s.tmp = { it, price: Math.round(G.GEAR_PRICE[it.tier] * it.q * rand(0.7, 0.95)) };
    },
    text: (s) => `Một luyện khí sư lang bạt ghé qua, nói có thể rèn cho bạn ${s.tmp.it.n.toLowerCase()} (${gearDesc(s.tmp.it)}). Giá ${fmtGold(s.tmp.price)} kim tệ, nhưng nghề rèn khí vốn có rủi ro.`,
    ch: [
      { t: (s) => `Đặt rèn (${fmtGold(s.tmp.price)})`, if: (s) => s.gold >= s.tmp.price, roll: (s) => clamp(0.72 + (s.luck - 50) / 300),
        ok: { do: (s) => { spend(s, 'Thuê luyện khí sư', s.tmp.price); s.tmp.got = obtainGear(s, s.tmp.it); }, log: (s) => `Lò rèn đỏ rực ba ngày ba đêm. Bạn nhận được ${s.tmp.got}.`, k: 'good' },
        fail: { do: (s) => { spend(s, 'Thuê luyện khí sư', Math.round(s.tmp.price * 0.5)); }, fx: { tam: -3 }, log: 'Khí phôi nứt toác giữa chừng. Bạn mất nửa số tiền đặt cọc.' } },
      { t: 'Không cần', log: 'Bạn lắc đầu từ chối.' },
    ],
  },
  {
    id: 'estate_trouble', a: [16, 9999], w: 0.6, cd: 10, icon: '🏮',
    if: (s) => estateIncome(s) > 0,
    prep: (s) => { s.tmp = Math.round(estateIncome(s) * rand(1.5, 3)); },
    text: (s) => `Một băng địa đầu xà kéo đến cửa hàng của bạn, đòi ${fmtGold(s.tmp)} kim tệ «tiền bảo kê», không thì đập phá.`,
    ch: [
      { t: 'Đích thân dạy chúng một bài học', fight: 1, roll: (s) => winP(s, peer(s, -2)),
        ok: { fx: { fame: 1, tam: 3 }, log: 'Bạn đánh gãy chân tên cầm đầu. Từ đó cả con phố không ai dám bén mảng.', k: 'good' },
        fail: { fx: { body: -10 }, do: (s) => { lose(s, 'Cửa hàng bị đập phá', s.tmp * 1.5); }, log: 'Bạn bị thương, cửa hàng bị đập tan hoang.', k: 'bad' } },
      { t: (s) => `Nộp ${fmtGold(s.tmp)} cho yên chuyện`, do: (s) => { lose(s, 'Tiền bảo kê', s.tmp); }, fx: { tam: -2 }, log: 'Bạn nộp tiền. Làm ăn mà, nhịn một chút.' },
    ],
  },

  // ───────── Tông môn & lãnh địa ─────────
  {
    id: 'found_hint', r: [5, 11], w: 3, once: true, icon: '🏯',
    if: (s) => canFound(s),
    prep: (s) => { s.tmp = genSectName(); },
    text: (s) => `Danh tiếng của bạn đã vang khắp nơi. Vài tán tu và đệ tử cũ tìm đến, khẩn cầu bạn khai tông lập phái. Một người đề xuất tên: «${s.tmp}».`,
    ch: [
      { t: (s) => `Khai tông lập phái · ${s.tmp} (${fmtGold(G.SECT_REQ.gold)} kim tệ)`, if: canFound,
        do: (s) => { foundSect(s, s.tmp); }, log: () => 'Tiếng chuông khai sơn vang vọng trăm dặm. Từ nay bạn là Tông chủ! (Bấm nút «Môn» để quản lý tông môn và chinh phạt lãnh địa.)', k: 'key' },
      { t: 'Chưa phải lúc', fx: { tam: 1 }, log: 'Bạn muốn tự mình đi thêm một đoạn đường. (Có thể khai tông bất cứ lúc nào bằng nút «Môn».)' },
    ],
  },
  {
    id: 'conquer', force: true, icon: '⚔️',
    title: (s) => `Chinh phạt ${region(s.tmp).n}`,
    text: (s) => {
      const r = region(s.tmp);
      return `${r.d} Nơi này đang do ${r.own} trấn giữ (thực lực ~${regionDef(s, r)}). Thế lực của bạn cộng cả tông môn: ${Math.round(warPower(s))}. Chiếm được sẽ thu ${fmtGold(r.inc)} kim tệ mỗi năm.`;
    },
    ch: [
      { t: (s) => `Đích thân dẫn quân công phạt (~${Math.round(conquerP(s, regionDef(s, region(s.tmp))) * 100)}%)`, fight: 1, roll: (s) => conquerP(s, regionDef(s, region(s.tmp))),
        ok: { do: (s) => takeLand(s, s.tmp), fx: { tam: 6 }, log: (s) => `Cờ ${s.sect.name} cắm trên ${region(s.tmp).n}. ${region(s.tmp).own} quỳ xuống xin hàng!`, k: 'key' },
        fail: { fx: { body: -18, tam: -6 }, do: (s) => { s.sect.members = Math.round(s.sect.members * 0.85); armyLoss(s, 0.2); },
                log: (s) => `${region(s.tmp).own} phản công dữ dội. Bạn trọng thương, đệ tử tử thương vô số.`, k: 'bad',
                dieP: (s) => (regionDef(s, region(s.tmp)) > warPower(s) + 10 ? 0.12 : 0.03), die: 'Tử trận khi chinh phạt lãnh địa' } },
      { t: (s) => `Đại quân ${troopCount(s)} binh sĩ vây thành, bạn ngồi trong trướng (~${Math.round(armySiegeP(s) * 100)}%)`, if: (s) => troopCount(s) >= 50, fight: 1, roll: armySiegeP,
        ok: { do: (s) => { takeLand(s, s.tmp); armyLoss(s, 0.08); }, log: (s) => `Sau ba tháng vây hãm, ${region(s.tmp).n} mở cổng thành. Cờ ${s.sect.name} tung bay trên thành lâu.`, k: 'key' },
        fail: { do: (s) => { armyLoss(s, 0.3); }, fx: { tam: -4 }, log: (s) => `Quân ta tổn thất nặng dưới chân thành ${region(s.tmp).n}, phải lui binh.`, k: 'bad' } },
      { t: (s) => `Phái ${s.sect.elders} trưởng lão xuất chinh, bạn không ra mặt (~${Math.round(conquerP(s, regionDef(s, region(s.tmp)), -0.18) * 100)}%)`, if: (s) => s.sect.elders > 0, fight: 1, roll: (s) => conquerP(s, regionDef(s, region(s.tmp)), -0.18),
        ok: { do: (s) => takeLand(s, s.tmp), log: (s) => `Các trưởng lão khải hoàn trở về, dâng lên bản đồ ${region(s.tmp).n}.`, k: 'key' },
        fail: { do: (s) => { s.tmp2 = removeElder(s, (l) => pick(l)); s.sect.members = Math.round(s.sect.members * 0.9); }, fx: { tam: -4 }, log: (s) => `Quân ta đại bại. ${s.tmp2 ? `${s.tmp2.title} trưởng lão ${s.tmp2.n}` : 'Một vị trưởng lão'} tử trận.`, k: 'bad' } },
      { t: 'Gửi chiến thư, ép quy hàng', if: (s) => s.fame >= regionDef(s, region(s.tmp)) * 0.3,
        roll: (s) => clamp(0.12 + (s.fame - regionDef(s, region(s.tmp)) * 0.3) / 50 + (warPower(s) - regionDef(s, region(s.tmp))) / 80, 0.03, 0.85),
        ok: { do: (s) => takeLand(s, s.tmp), log: (s) => `Chỉ một phong thư, ${region(s.tmp).own} đã mở cổng quy hàng. Không tốn một giọt máu!`, k: 'key' },
        fail: { fx: { fame: -1, tam: -2 }, log: (s) => `${region(s.tmp).own} xé nát chiến thư, cười nhạo: «Chỉ dựa vào ngươi?»` } },
      { t: 'Thu quân, để sau', log: 'Bạn quyết định chờ thời cơ.' },
    ],
  },
  {
    id: 'raid', w: (s) => 0.5 + landCount(s) * 0.25, cd: 5, icon: '🔥',
    if: (s) => !!s.sect && landCount(s) > 0 && !(unified(s) && s.flags.unified === 'peace'),
    prep: (s) => {
      const id = pick(landIds(s));
      const r = region(id);
      s.tmp = { id, foe: R() < 0.5 ? r.own : pick(['Hồn Điện', 'Một liên minh tông môn', 'Tàn dư của ' + r.own, 'Một lão quái vật ẩn thế']), atk: Math.round(regionDef(s, r) * 0.9 + rand(-4, 10)) };
    },
    text: (s) => `${s.tmp.foe} bất ngờ tập kích ${region(s.tmp.id).n} — lãnh địa của ${s.sect.name}. Kẻ địch có thực lực ~${s.tmp.atk}, thế lực của bạn ${Math.round(warPower(s))}.`,
    ch: [
      { t: 'Đích thân ra trận', fight: 1, roll: (s) => defendP(s, s.tmp.atk),
        ok: { fx: { fame: 2, tam: 4, gold: 2, why: 'Thu chiến lợi phẩm' }, log: (s) => `Bạn đánh tan ${s.tmp.foe}. Lãnh địa vững như bàn thạch.`, k: 'good' },
        fail: { fx: { body: -18 }, do: (s) => { loseLand(s, s.tmp.id); armyLoss(s, 0.15); }, log: (s) => `Bạn thất bại. ${region(s.tmp.id).n} rơi vào tay ${s.tmp.foe}.`, k: 'bad', dieP: 0.04, die: 'Tử trận khi bảo vệ lãnh địa' } },
      { t: (s) => `Dựa vào Hộ Sơn Đại Trận cố thủ (cấp ${bLv(s, 'tran')})`, if: (s) => bLv(s, 'tran') > 0, fight: 1, roll: (s) => arrayP(s, s.tmp.atk),
        ok: { fx: { fame: 1 }, log: 'Đại trận bừng sáng, kẻ địch đâm đầu vào như thiêu thân rồi tháo chạy.', k: 'good' },
        fail: { do: (s) => loseLand(s, s.tmp.id), fx: { tam: -5 }, log: (s) => `Đại trận vỡ nát. ${region(s.tmp.id).n} thất thủ.`, k: 'bad' } },
      { t: 'Nhường lại, bảo toàn lực lượng', do: (s) => { delete s.land[s.tmp.id]; }, fx: { tam: -6, fame: -2 }, log: (s) => `Bạn rút khỏi ${region(s.tmp.id).n}. Thiên hạ cười chê ${s.sect.name} nhát gan.` },
    ],
  },
  {
    id: 'elder', w: 0.7, cd: 8, icon: '🧙',
    if: (s) => !!s.sect && s.sect.elders < 3 + bLv(s, 'hien'),
    prep: (s) => { const g = R() < 0.7 ? 'm' : 'f'; const r = Math.max(3, s.R - 1 - (R() < 0.5 ? 1 : 0)); s.tmp = { name: genName(g), g, R: r, realm: G.REALMS[r].n, fee: Math.round(unit(s) * rand(1, 2)) }; },
    text: (s) => `${s.tmp.name}, một ${s.tmp.realm} tán tu, mến danh ${s.sect.name} mà tìm đến, muốn làm trưởng lão. Lễ nhập môn cần ${fmtGold(s.tmp.fee)} kim tệ, sau đó mỗi năm phải trả bổng lộc.`,
    ch: [
      { t: (s) => `Mời làm trưởng lão (${fmtGold(s.tmp.fee)})`, if: (s) => s.gold >= s.tmp.fee,
        do: (s) => { spend(s, 'Lễ nhập môn trưởng lão', s.tmp.fee); s.tmp.e = addElder(s, { n: s.tmp.name, g: s.tmp.g, R: s.tmp.R }); }, fx: { fame: 1 },
        log: (s) => `${s.tmp.name} trở thành ${s.tmp.e.title} trưởng lão của ${s.sect.name}, mang theo binh khí tùy thân. Xem ở tab Trưởng lão.`, k: 'good' },
      { t: 'Từ chối', log: 'Bạn chưa tin tưởng người này.' },
    ],
  },
  {
    id: 'betray', w: 0.35, cd: 20, icon: '🐍',
    // Chỉ kẻ kém trung thành mới phản; ban thưởng đều tay thì tông môn yên ổn
    if: (s) => !!s.sect && s.sect.elders > 0 && s.gold > unit(s) * 3 && leastLoyal(s)?.loy < 45,
    prep: (s) => { const e = leastLoyal(s); s.tmp = { amt: Math.round(s.gold * rand(0.15, 0.3)), id: e.id, n: `${e.title} trưởng lão ${e.n}` }; },
    text: (s) => `${s.tmp.n} lén mở ngân khố, ôm ${fmtGold(s.tmp.amt)} kim tệ cùng toàn bộ trang bị bỏ trốn trong đêm.`,
    ch: [
      { t: 'Truy sát đến cùng', fight: 1, roll: (s) => winP(s, peer(s, -1)),
        ok: { fx: { fame: 1, tam: 3 }, do: (s) => { removeElder(s, (l) => l.find((x) => x.id === s.tmp.id)); }, log: (s) => `Bạn đuổi kịp ${s.tmp.n} ở biên giới. Tiền được thu hồi, kẻ phản đồ đền tội.`, k: 'good' },
        fail: { do: (s) => { removeElder(s, (l) => l.find((x) => x.id === s.tmp.id)); lose(s, 'Trưởng lão cuỗm tiền', s.tmp.amt); }, fx: { tam: -5 }, log: 'Hắn trốn thoát. Tiền mất, lòng người dao động.', k: 'bad' } },
      { t: 'Để hắn đi, chấn chỉnh môn quy', do: (s) => { removeElder(s, (l) => l.find((x) => x.id === s.tmp.id)); lose(s, 'Trưởng lão cuỗm tiền', s.tmp.amt); ensureElders(s).forEach((e) => { e.loy = Math.min(100, e.loy + 8); }); }, fx: { tam: 2 }, log: 'Bạn ban hành môn quy mới. Các trưởng lão còn lại thêm phần kính sợ.' },
    ],
  },
  {
    id: 'sect_war', w: 0.45, cd: 15, icon: '🚩',
    if: (s) => !!s.sect && s.sect.members >= 40,
    prep: (s) => { s.tmp = { foe: pick(['Thiên Xà Phủ', 'Vân Lam Tông', 'Hoa Tông', 'Băng Hà Cốc', 'Huyết Tông', 'Thiên Minh Tông', 'Hắc Hoàng Tông']), atk: Math.round(warPower(s) + rand(-10, 12)) }; },
    text: (s) => `${s.tmp.foe} tuyên chiến với ${s.sect.name}, đòi bạn giải tán tông môn. Hai bên dàn trận dưới chân núi (thực lực địch ~${s.tmp.atk}, ta ${Math.round(warPower(s))}).`,
    ch: [
      { t: 'Toàn tông nghênh chiến', fight: 1, roll: (s) => defendP(s, s.tmp.atk),
        ok: { fx: { fame: 5, tam: 6, gold: 5, why: 'Thu ngân khố địch' }, do: (s) => { s.sect.members += 20; },
              log: (s) => `${s.tmp.foe} đại bại. Đệ tử của chúng kéo nhau sang bái nhập ${s.sect.name}!`, k: 'key' },
        fail: { fx: { body: -20, tam: -8, fame: -3 }, do: (s) => { s.sect.members = Math.round(s.sect.members * 0.7); armyLoss(s, 0.3); const ids = landIds(s); if (ids.length) loseLand(s, pick(ids)); },
                log: 'Bạn thua trận. Tông môn tổn thất nặng nề, một vùng lãnh địa bị cắt nhượng.', k: 'bad', dieP: 0.05, die: 'Tử trận trong cuộc chiến giữa các tông môn' } },
      { t: 'Cầu hòa, nộp cống phẩm', do: (s) => { lose(s, 'Cống phẩm cầu hòa', s.gold * 0.3); }, fx: { tam: -6, fame: -2 }, log: (s) => `Bạn nhẫn nhục nộp cống. ${s.tmp.foe} rút quân.` },
    ],
  },
  {
    id: 'genius', w: 0.5, cd: 12, icon: '🌟',
    if: (s) => !!s.sect,
    text: (s) => `Một thiếu niên thiên phú dị bẩm vượt ngàn dặm tìm đến ${s.sect.name}, ba quỳ chín lạy xin bái bạn làm sư phụ.`,
    ch: [
      { t: 'Nhận làm thân truyền đệ tử', fx: { tam: 4, fame: 1 }, do: (s) => { s.disciples++; s.sect.members++; }, log: 'Bạn dốc lòng truyền dạy. Đứa trẻ này có thể là tương lai của tông môn.', k: 'good' },
      { t: 'Giao cho trưởng lão dạy', fx: { tam: 1 }, do: (s) => { s.sect.members++; }, log: 'Thiếu niên được đưa vào nội môn.' },
    ],
  },
  {
    id: 'vassal', w: 0.4, cd: 15, icon: '🎎',
    if: (s) => !!s.sect && s.fame >= 15,
    prep: (s) => { s.tmp = { n: pick(['Mộc gia', 'Liễu gia', 'Nạp Lan gia', 'Thạch gia', 'Một tiểu tông môn lân cận']), amt: Math.round(unit(s) * rand(2, 5)) }; },
    text: (s) => `${s.tmp.n} kính sợ uy danh ${s.sect.name}, xin làm phụ thuộc, dâng lễ ${fmtGold(s.tmp.amt)} kim tệ và một nhóm tử đệ.`,
    ch: [
      { t: 'Chấp nhận', fx: { goldAbs: (s) => s.tmp.amt, why: 'Lễ vật phụ thuộc', fame: 1 }, do: (s) => { s.sect.members += 8; }, log: (s) => `${s.tmp.n} trở thành phụ thuộc của ${s.sect.name}.`, k: 'good' },
      { t: 'Từ chối, không muốn ràng buộc', fx: { tam: 1 }, log: 'Bạn khéo léo từ chối.' },
    ],
  },

  // ───────── Lò rèn, quân đội, sàn giao dịch ─────────
  {
    id: 'arms_boom', r: [2, 11], w: 0.7, cd: 10, icon: '⚔️',
    if: (s) => smithLv(s) > 0 && s.arms >= 20,
    prep: (s) => { s.tmp = { a: pick(['Gia Mã Đế Quốc', 'Xuất Vân Đế Quốc', 'Hắc Ấn Thành', 'Thiên Bắc Tống gia']), b: pick(['Liên quân Xà Nhân', 'Độc Tông', 'Hắc Giác Vực', 'Phong Lôi Các']), n: s.arms, v: armValue(s) }; },
    text: (s) => `Chiến sự bùng nổ giữa ${s.tmp.a} và ${s.tmp.b}. Cả hai phe đều phái người đến lò rèn của bạn hỏi mua binh khí. Trong kho đang có ${s.tmp.n} bộ.`,
    ch: [
      { t: (s) => `Bán cho cả hai phe (~${fmtGold(s.tmp.n * s.tmp.v * 1.8)})`, fx: { goldAbs: (s) => s.tmp.n * s.tmp.v * 1.8, why: 'Bán binh khí thời chiến', fame: -2, tam: -3 },
        do: (s) => { s.arms = Math.max(0, s.arms - s.tmp.n); shock(s, 'arms', 1.25); }, log: 'Tiền vào như nước, nhưng giang hồ bắt đầu gọi bạn là kẻ buôn chiến tranh.', k: 'good' },
      { t: (s) => `Chỉ bán cho ${s.tmp.a} (~${fmtGold(s.tmp.n * s.tmp.v * 1.3)})`, fx: { goldAbs: (s) => s.tmp.n * s.tmp.v * 1.3, why: 'Bán binh khí thời chiến', fame: 2 },
        do: (s) => { s.arms = Math.max(0, s.arms - s.tmp.n); }, log: (s) => `${s.tmp.a} cảm kích, khắc tên lò rèn của bạn lên bia công thần.`, k: 'good' },
      { t: 'Giữ hàng, chờ giá lên cao hơn', do: (s) => { shock(s, 'arms', 1.5); }, log: 'Bạn đóng cửa lò rèn. Giá binh khí trên thị trường lập tức tăng vọt.' },
    ],
  },
  {
    id: 'smith_master', r: [2, 11], w: 0.5, cd: 20, icon: '🔨',
    if: (s) => smithLv(s) >= 5 && smithLv(s) < 100,
    prep: (s) => { s.tmp = Math.round(unit(s) * 3); },
    text: (s) => `Một luyện khí đại sư tóc bạc ghé qua lò rèn của bạn, chê lửa còn non. Lão bảo chỉ cần ${fmtGold(s.tmp)} kim tệ tiền rượu, lão sẽ truyền cho vài bí quyết.`,
    ch: [
      { t: (s) => `Mời lão ở lại (${fmtGold(s.tmp)})`, if: (s) => s.gold >= s.tmp,
        do: (s) => { spend(s, 'Mời luyện khí đại sư', s.tmp); s.smithy.lv = Math.min(100, s.smithy.lv + 3); }, fx: { soul: 2 },
        log: (s) => `Ba tháng sau, lão đi. Lò rèn của bạn đã lên cấp ${s.smithy.lv}.`, k: 'good' },
      { t: 'Nhờ lão rèn giúp một món', roll: () => 0.6,
        ok: { do: (s) => { s.tmp = obtainGear(s, genGear(s, { tier: tierFor(s), boost: 4 })); }, log: (s) => `Lão gõ búa đúng tám mươi mốt nhát. Thành phẩm: ${s.tmp}.`, k: 'good' },
        fail: { fx: { tam: -2 }, log: 'Lão say khướt, ngủ ba ngày rồi biến mất cùng một bình rượu quý của bạn.' } },
      { t: 'Không cần', log: 'Bạn tin vào tay nghề của mình.' },
    ],
  },
  {
    id: 'ore_vein', a: [12, 9999], r: [1, 11], wild: true, w: 0.5, cd: 8, icon: '⛏️',
    text: () => 'Sau một trận lở núi, vách đá lộ ra một mạch Huyền thiết lấp lánh. Nhưng hang sâu còn đang rung chuyển.',
    ch: [
      { t: 'Liều mình khai thác', roll: (s) => clamp(0.55 + (s.body - 50) / 150 + s.luck / 400),
        ok: { fx: { item: (s) => [['ore', G.ORE_FOR_TIER[tierFor(s)], 8 + Math.floor(R() * 10)]] }, log: 'Bạn đào được cả một sọt Huyền thiết trước khi hang sập.', k: 'good' },
        fail: { fx: { body: -12 }, log: 'Đá lở đè trúng chân bạn. Chỉ kịp nhặt vài mảnh.', dieP: 0.02, die: 'Bị vùi trong mỏ Huyền thiết' } },
      { t: 'Bán tin cho thương hội', fx: { gold: 1, why: 'Bán tin mỏ quặng' }, log: 'Thương hội trả bạn một khoản tiền nhỏ để mua tọa độ.' },
    ],
  },
  {
    id: 'mutiny', w: 0.5, cd: 15, icon: '🚩',
    if: (s) => troopCount(s) >= 100,
    prep: (s) => { s.tmp = Math.round(unit(s) * 0.006 * troopCount(s)); },
    text: (s) => `Quân sĩ tụ tập trước trướng, đòi tăng quân lương. Họ nói cần thêm ${fmtGold(s.tmp)} kim tệ, không thì sẽ giải giáp về quê.`,
    ch: [
      { t: (s) => `Chi thêm ${fmtGold(s.tmp)}`, if: (s) => s.gold >= s.tmp, do: (s) => { spend(s, 'Thưởng quân sĩ', s.tmp); s.army.train = Math.min(100, s.army.train + 1); },
        log: 'Binh sĩ reo hò, sĩ khí lên cao.', k: 'good' },
      { t: 'Chém kẻ cầm đầu, lập lại quân kỷ', roll: (s) => clamp(0.4 + (s.tam - 50) / 150 + s.fame / 200),
        ok: { fx: { tam: 2 }, log: 'Quân lệnh như núi. Không ai dám hé răng nữa.' },
        fail: { do: (s) => { s.tmp = armyLoss(s, 0.25); }, fx: { tam: -4 }, log: (s) => `Binh biến nổ ra, ${s.tmp} binh sĩ bỏ trốn.`, k: 'bad' } },
    ],
  },
  {
    id: 'drill', w: 0.5, cd: 12, icon: '🥁',
    if: (s) => troopCount(s) >= 50 && s.army.train < 100,
    prep: (s) => { s.tmp = pick(['Vân Lam Tông', 'Hoa Tông', 'Phong Lôi Các', 'Thiên Xà Phủ']); },
    text: (s) => `${s.tmp} mời quân đội của ${s.sect.name} cùng đại diễn tập ở biên giới.`,
    ch: [
      { t: 'Nhận lời, đấu một trận ra trò', fight: 1, roll: (s) => clamp(0.35 + armyPower(s) / 300),
        ok: { do: (s) => { s.army.train = Math.min(100, s.army.train + 3); }, fx: { fame: 1 }, log: 'Quân ta thắng áp đảo. Huấn luyện +3.', k: 'good' },
        fail: { do: (s) => { s.army.train = Math.min(100, s.army.train + 1); armyLoss(s, 0.04); }, log: 'Quân ta thua, nhưng học được nhiều điều. Huấn luyện +1.' } },
      { t: 'Từ chối', log: 'Bạn không muốn để lộ thực lực quân đội.' },
    ],
  },
  {
    id: 'ex_vip', r: [2, 11], w: 0.5, once: true, icon: '🏮',
    if: (s) => (s.stats.exSold || 0) >= 5,
    prep: (s) => { s.tmp = Math.round(unit(s) * 4); },
    text: (s) => `Lão bản Sàn Vạn Bảo để ý bạn giao dịch thường xuyên, mời bạn làm khách quý: phí ký gửi giảm từ 5% xuống 2%. Lệ phí ${fmtGold(s.tmp)} kim tệ.`,
    ch: [
      { t: (s) => `Nhận lời (${fmtGold(s.tmp)})`, if: (s) => s.gold >= s.tmp, do: (s) => { spend(s, 'Phí khách quý Sàn Vạn Bảo', s.tmp); s.flags.vip = true; }, log: 'Bạn nhận ngọc bài khách quý của Sàn Vạn Bảo.', k: 'good' },
      { t: 'Thôi khỏi', log: 'Bạn thấy chưa cần.' },
    ],
  },
  {
    id: 'market_swing', a: [14, 9999], r: [1, 11], w: 0.5, cd: 10, icon: '📉',
    prep: (s) => {
      const t = pick(['core', 'herb', 'ore']);
      const g = t === 'ore' ? G.ORE_FOR_TIER[tierFor(s)] : t === 'core' ? beastGrade(s) : pillNeed(s);
      s.tmp = { t, g, n: 10, p: Math.round(itemFair(s, t, g) * 0.6) };
    },
    text: (s) => `Một thương hội phá sản, phải bán tháo ${s.tmp.n} ${itemName(s.tmp.t, s.tmp.g).toLowerCase()} với giá ${fmtGold(s.tmp.p)} mỗi món, rẻ hơn thị trường gần một nửa.`,
    ch: [
      { t: (s) => `Gom hết (${fmtGold(s.tmp.p * s.tmp.n)})`, if: (s) => s.gold >= s.tmp.p * s.tmp.n,
        do: (s) => { spend(s, 'Gom hàng bán tháo', s.tmp.p * s.tmp.n); give(s, s.tmp.t, s.tmp.g, s.tmp.n); shock(s, G.ITEMS[s.tmp.t].mk, 0.85); },
        log: 'Bạn gom sạch số hàng. Đem lên sàn ký gửi đúng giá là có lời.', k: 'good' },
      { t: 'Đứng ngoài', log: 'Bạn không muốn dính vào chuyện làm ăn.' },
    ],
  },

  // ───────── Hậu kỳ: Đấu Thánh, Đấu Đế ─────────
  {
    id: 'hon_invasion', r: [10, 11], w: 0.9, cd: 10, icon: '👁️',
    if: (s) => !!s.sect,
    prep: (s) => { s.tmp = { atk: Math.round(250 + (s.R - 10) * 120 + landCount(s) * 6 + rand(-20, 40)) }; },
    text: (s) => `Không gian nứt toác. Đại quân Hồn tộc tràn vào đại lục, mũi nhọn chĩa thẳng vào ${s.sect.name} (thực lực ~${s.tmp.atk}, ta ${Math.round(warPower(s))}).`,
    ch: [
      { t: 'Toàn tông nghênh chiến', fight: 1, roll: (s) => defendP(s, s.tmp.atk),
        ok: { fx: { fame: 10, tam: 8, gold: 40, why: 'Chiến lợi phẩm Hồn tộc', item: [['tho', 9, 1], ['hon', 9, 3]] }, do: (s) => { armyLoss(s, 0.06); s.stats.honWins = (s.stats.honWins || 0) + 1; },
              log: 'Hồn tộc đại bại, xác chất thành núi. Cả đại lục quỳ lạy ơn cứu thế của bạn.', k: 'key' },
        fail: { fx: { body: -30, tam: -10, fame: -4 }, do: (s) => { armyLoss(s, 0.3); const ids = landIds(s); for (let i = 0; i < 2 && ids.length; i++) loseLand(s, ids.splice(Math.floor(R() * ids.length), 1)[0]); },
                log: 'Phòng tuyến vỡ nát. Hồn tộc chiếm mất lãnh địa, bạn phải rút về sơn môn.', k: 'bad', dieP: 0.1, die: 'Vẫn lạc trong cuộc chiến với Hồn tộc' } },
      { t: 'Liên kết bát tộc cùng chống giặc', fight: 1, roll: (s) => clamp(defendP(s, s.tmp.atk) + 0.15), fx: { gold: -10, why: 'Lễ vật liên minh' },
        ok: { fx: { fame: 5, tam: 4 }, log: 'Liên quân đánh lui Hồn tộc. Công lao chia đều, nhưng bạn giữ được tất cả.', k: 'good' },
        fail: { fx: { tam: -6 }, do: (s) => { armyLoss(s, 0.15); }, log: 'Liên quân tan rã vì nghi kỵ lẫn nhau. Hồn tộc cướp bóc rồi rút đi.', k: 'bad' } },
    ],
  },
  {
    id: 'thienmo', r: [10, 11], w: 0.7, cd: 8, icon: '🪦',
    text: () => 'Thiên Mộ mở cửa. Bên trong là năng lượng linh hồn của vô số cường giả viễn cổ, cũng là nơi chôn thân của kẻ tham lam.',
    ch: [
      { t: 'Tiến sâu vào tầng thứ ba', roll: (s) => clamp(0.4 + (s.soul - 50) / 150 + (s.tam - 50) / 200),
        ok: { fx: { qi: 400, soul: 6 }, log: 'Bạn luyện hóa một đạo tàn hồn viễn cổ. Đấu khí tăng vọt.', k: 'key' },
        fail: { fx: { body: -30, soul: -6 }, log: 'Tàn hồn phản phệ, bạn bị đánh văng ra ngoài.', dieP: 0.12, die: 'Linh hồn bị nuốt chửng trong Thiên Mộ' } },
      { t: 'Chỉ dạo tầng một', fx: { qi: 120, soul: 2 }, log: 'Bạn thu được chút ít năng lượng rồi lui ra.' },
    ],
  },
  {
    id: 'ancient_ally', r: [9, 11], once: true, w: 0.8, icon: '🏛️',
    text: () => 'Sứ giả Cổ tộc đến tận động phủ, mang theo lời mời kết minh. Họ muốn bạn đứng về phía bát tộc trong cuộc chiến sắp tới với Hồn tộc.',
    ch: [
      { t: 'Kết minh với Cổ tộc', fx: { fame: 6, tam: 3 }, do: (s) => { s.flags.ally = true; if (s.gong < 4) s.gong = 4; },
        log: 'Cổ tộc tặng bạn một bộ công pháp Thiên giai làm lễ kết minh.', k: 'key' },
      { t: 'Giữ thế trung lập', fx: { tam: 2 }, log: 'Bạn không muốn bị cuốn vào ân oán của các đại tộc.' },
    ],
  },
  {
    id: 'emperor_pill', r: [10, 11], w: 0.7, cd: 12, icon: '⚗️',
    if: (s) => s.alch >= 8,
    text: () => 'Bạn gom đủ dược liệu cho một lò Đế phẩm đan. Thành đan sẽ dẫn tới đan lôi, chỉ cần sơ sẩy là lò nổ người vong.',
    ch: [
      { t: 'Khai lò', roll: (s) => clamp(0.25 + (s.soul - 50) / 200 + s.fires.length * 0.1 + (s.master ? 0.1 : 0)),
        ok: { fx: { body: 10, soul: 10, fame: 6, item: [['tho', 9, 3]] }, log: 'Đan lôi giáng xuống chín lần. Một viên Đế phẩm đan tỏa hương khắp trăm dặm!', k: 'key' },
        fail: { fx: { body: -25, tam: -8 }, log: 'Lò đan nổ tung, dược liệu ngàn năm hóa thành tro.', dieP: 0.05, die: 'Bị đan lôi đánh trúng khi luyện Đế phẩm đan' } },
      { t: 'Chưa nắm chắc, để sau', log: 'Bạn cất dược liệu vào hộp ngọc.' },
    ],
  },
  {
    id: 'beast_emperor', r: [9, 11], wild: true, w: 0.6, cd: 10, icon: '🐉',
    text: () => 'Sâu trong Thú Vực, một thần thú viễn cổ thức giấc. Kẻ nào hạ được nó sẽ có vảy và xương để rèn Thánh khí.',
    ch: [
      { t: 'Khiêu chiến thần thú', fight: 1, roll: (s) => winP(s, peer(s, 6)),
        ok: { do: (s) => { s.tmp = obtainGear(s, genGear(s, { tier: 6, q: pick([1.6, 2, 2, 2.6]) })); }, fx: { fame: 4 }, log: (s) => `Thần thú gục ngã. Bạn rèn từ xương nó ra ${s.tmp}.`, k: 'key' },
        fail: { fx: { body: -35 }, log: 'Một tiếng gầm, bạn văng xa trăm trượng.', dieP: 0.15, die: 'Vẫn lạc dưới móng vuốt thần thú viễn cổ' } },
      {
        t: 'Thuần phục thần thú làm chí tôn tọa kỵ',
        if: (s) => !owns(s, 'mount', 'giao'),
        fight: 1,
        roll: (s) => winP(s, peer(s, 7)),
        ok: {
          do: (s) => {
            ensureBeasts(s);
            addBeast(s, 'mount', 'giao');
            s.beasts.mount = 'giao';
          },
          fx: { fame: 8, qi: 200 },
          log: 'Thần thú viễn cổ cúi đầu quy phục! Thanh Lân Giao Long nhận bạn làm chủ, trở thành tọa kỵ cái thế chấn nhiếp bát hoang.',
          k: 'key',
        },
        fail: {
          fx: { body: -40 },
          log: 'Long uy cuồng bạo xé toạc không gian, bạn bị chấn nát kinh mạch.',
          dieP: 0.2,
          die: 'Vẫn lạc dưới vuốt thần thú viễn cổ',
        },
      },
      { t: 'Không kinh động nó', fx: { tam: 1 }, log: 'Bạn lặng lẽ rời Thú Vực.' },
    ],
  },
  {
    // Ép xảy ra từ engine khi đủ điều kiện (xem dechienReady), không rút ngẫu nhiên
    id: 'dechien', w: 0, once: true, force: true, icon: '⚔️',
    text: (s) => `Trời thượng giới tối sầm. Thiên Đế đích thân giáng lâm, đế uy ép nát mây trời: kẻ phi thăng từ hạ giới không được phép đứng ngang hàng. Đế chiến không thể tránh (Thiên Đế ~${bossPower(s)}, ta ${Math.round(warPower(s))}).`,
    ch: [
      { t: (s) => `Nghênh chiến Thiên Đế (~${Math.round(dechienP(s) * 100)}%)`, fight: 1, roll: (s) => dechienP(s),
        ok: { do: (s) => { writeRebirth(s, true); die(s, 'Đánh bại Thiên Đế trong Đế chiến, đế thể vỡ nát, chân linh chuyển thế trùng tu', true, false); }, log: 'Một quyền xuyên thủng Thiên Đế Điện. Thiên Đế ngã xuống — nhưng đế thể của bạn cũng nứt toác như đồ sứ.', k: 'key' },
        fail: { do: (s) => { writeRebirth(s, false); die(s, 'Vẫn lạc trong Đế chiến trên Thượng giới, một tia chân linh rơi vào luân hồi', false, false); }, log: 'Đế uy của Thiên Đế nghiền nát đế thể của bạn.', k: 'bad' } },
      { t: (s) => `Thiêu đốt toàn bộ đế nguyên, liều chết một trận (~${Math.round(dechienP(s, 0.15) * 100)}%)`, if: (s) => upHeld(s) > 0, fight: 1, roll: (s) => dechienP(s, 0.15),
        ok: { do: (s) => { writeRebirth(s, true); die(s, 'Thiêu đốt đế nguyên đồng quy với Thiên Đế, chân linh chuyển thế trùng tu', true, false); }, log: 'Đế nguyên bùng cháy như mặt trời thứ hai. Thiên Đế tan biến cùng bạn trong ánh sáng.', k: 'key' },
        fail: { do: (s) => { writeRebirth(s, false); die(s, 'Thiêu đốt đế nguyên vẫn không địch nổi Thiên Đế, chân linh rơi vào luân hồi', false, false); }, log: 'Ngọn lửa đế nguyên tắt lịm trước Thiên Đế.', k: 'bad' } },
    ],
  },
  {
    id: 'unify', once: true, w: 50, icon: '🐉',
    if: (s) => !!s.sect && landCount(s) >= G.REGIONS.length,
    text: (s) => `Lá cờ cuối cùng cắm xuống. Từ Ô Thản Thành tới Hồn Giới, ${G.REGIONS.length} vùng đất đều nằm dưới trướng ${s.sect.name}. Chư hầu khắp đại lục quỳ rạp chờ một lời của bạn.`,
    ch: [
      { t: 'Đăng cơ Đế chủ, thiên hạ quy về một mối', fx: { fame: 30, tam: 8 }, do: (s) => { s.flags.unified = 'rule'; s.unifiedAt = s.age; },
        log: (s) => `Bạn đăng cơ trên Thánh Đan Thành. ${s.sect.name} nhất thống đại lục! Thuế khóa gấp đôi, mỏ quặng thêm 50%, đệ tử tối đa +500 — chừng nào còn giữ trọn mọi vùng.`, k: 'key' },
      { t: 'Phân phong chư hầu, giữ thiên hạ thái bình', fx: { fame: 20, tam: 15 }, do: (s) => { s.flags.unified = 'peace'; s.unifiedAt = s.age; },
        log: 'Bạn chia đất cho các thế lực quy hàng cai quản. Đại lục thái bình: lãnh địa không còn bị tập kích, cùng mọi ân huệ của nhất thống.', k: 'key' },
    ],
  },
  {
    id: 'heir', r: [11, 11], once: true, w: 3, icon: '📜',
    text: () => 'Đã thành Đế, bạn bắt đầu nghĩ tới hậu thế. Một đạo đế ấn để lại có thể che chở cho kiếp sau của chính bạn trên con đường luân hồi.',
    ch: [
      { t: 'Khắc đế ấn vào ngọc giản truyền thừa', fx: { tam: 6 }, do: (s) => { s.flags.heir = true; },
        log: 'Bạn khắc đế ấn vào ngọc giản. Ngọc giản truyền thừa có thêm một ô: khi quy ẩn, bạn mang được thêm một món sang kiếp sau.', k: 'key' },
      { t: 'Đế giả không cần hậu thế', fx: { tam: 2 }, log: 'Bạn cười nhạt. Con đường của kiếp sau, để kiếp sau tự đi.' },
    ],
  },
  {
    id: 'court', r: [11, 11], w: 0.8, cd: 6, icon: '👑',
    text: () => 'Cường giả khắp đại lục kéo đến bái kiến Đấu Đế, mang theo lễ vật chất cao như núi.',
    ch: [
      { t: 'Nhận lễ, ban lời chỉ điểm', fx: { gold: 30, why: 'Lễ vật bái kiến', fame: 3 }, log: 'Mỗi lời của bạn đều được ghi chép lại như kinh điển.', k: 'good' },
      { t: 'Đóng cửa bế quan', fx: { qi: 150, tam: 2 }, log: 'Bạn bế quan, mặc cho thiên hạ đứng chờ ngoài núi.' },
    ],
  },
  // Chuỗi nhiều hồi và kỳ ngộ gắn với trang bị, linh thú, võ học
  ...ARCS,
];

/* Khoảnh khắc: không có lựa chọn, chỉ ghi lại. */
export const MOMENTS = [
  { a: [1, 1], once: true, t: 'Bạn bập bẹ gọi tiếng đầu tiên.', fx: { tam: 1 } },
  { a: [1, 3], t: 'Bạn chập chững những bước đầu tiên trong sân nhà.', fx: { body: 1 } },
  { a: [2, 5], t: 'Bạn ngồi nhìn những tu sĩ bay ngang trời, mắt sáng rỡ.', fx: { tam: 2 } },
  { a: [1, 5], t: 'Bạn ốm một trận, phụ mẫu thức trắng mấy đêm.', fx: { body: -2 } },
  { a: [6, 9999], r: [0, 3], t: 'Một mùa đông dài, bạn ngồi luyện khí bên lò sưởi.', fx: { tam: 1 } },
  { a: [8, 9999], t: 'Bạn đọc được một quyển du ký về Trung Châu, ước một ngày được đến đó.', fx: { soul: 2 } },
  { a: [8, 9999], r: [0, 4], t: 'Nhặt được một khỏa ma hạch cấp 1 bên bờ suối.', fx: { item: [['core', 1, 1]] } },
  { a: [8, 15], if: (s) => s.wealth === 0, t: 'Bạn phụ giúp việc đồng áng, được trả vài chục kim tệ.', fx: { goldAbs: 30, why: 'Làm thuê' } },
  { a: [12, 9999], if: (s) => s.flags.debtor && s.t >= s.flags.debtor.due,
    t: (s) => `${s.flags.debtor.name} quay lại trả nợ, kèm theo cả tiền lãi và một bình rượu ngon.`,
    fx: { goldAbs: (s) => Math.round(s.flags.debtor.amt * 1.3), why: 'Bạn cũ trả nợ', tam: 4 },
    do: (s) => { delete s.flags.debtor; } },
  { a: [14, 9999], if: (s) => s.alch >= 2, t: 'Một gia tộc nhờ bạn luyện đan hộ, trả công hậu hĩnh.', fx: { goldAbs: (s) => priceOf('tuk', s.alch) * 2, why: 'Luyện đan thuê' } },
  { a: [16, 9999], if: (s) => s.partner && !s.partner.mortal, t: (s) => `${s.partner.name} tặng bạn một bình đan dược tự tay tìm được.`, fx: { item: (s) => [['tuk', pillNeed(s), 2]], tam: 2 } },
  { a: [6, 9999], r: [0, 2], t: 'Bị cảm phong hàn, nằm liệt giường cả tháng.', fx: { body: -3 } },
  { a: [10, 9999], t: 'Ngồi trên đỉnh núi nhìn biển mây cuồn cuộn, lòng bỗng thanh thản lạ kỳ.', fx: { tam: 3 } },
  { a: [12, 9999], t: 'Nghe tin một vị cường giả vẫn lạc ở Ma Thú Sơn Mạch. Đường tu luyện thật tàn khốc.', fx: { tam: -1 } },
  { a: [10, 30], if: (s) => s.parents.alive && s.wealth >= 1, t: 'Phụ mẫu gửi thư hỏi thăm, kèm theo một túi kim tệ.', fx: { goldAbs: (s) => G.ALLOWANCE[s.wealth] * 0.5, why: 'Phụ mẫu gửi tiền', tam: 2 } },
  { if: (s) => s.alch >= 1, t: 'Có người tìm đến tận cửa, trả giá rất cao để mua đan dược của bạn.', fx: { goldAbs: (s) => priceOf('pha', s.alch), why: 'Khách mua đan tận cửa' } },
  { if: (s) => !!s.master, a: [12, 9999], once: true, t: 'Lão sư trong nhẫn chỉ cho bạn một hang đá giấu dược liệu từ trăm năm trước.', fx: { item: (s) => [['herb', pillNeed(s) + 1, 6]] } },
  { if: (s) => !!s.partner, t: (s) => `${s.partner.name} pha cho bạn một chén trà nóng khi bạn xuất quan.`, fx: { tam: 3 } },
  { if: (s) => !!s.companion, t: (s) => `${s.companion} của bạn lớn thêm một vòng, đã biết tự săn mồi.`, fx: { luck: 1 } },
  { if: (s) => !!s.master, t: 'Lão sư trong nhẫn lẩm bẩm chỉ điểm vài câu. Bạn như được khai sáng.', fx: { soul: 2, qi: 20 } },
  { if: (s) => s.fires.length > 0, t: (s) => `${s.fires[s.fires.length - 1]} trong cơ thể nhảy múa, rèn luyện kinh mạch của bạn.`, fx: { body: 2 } },
  { a: [100, 9999], once: true, t: 'Bạn trở lại cố hương. Trấn nhỏ năm xưa giờ đã thành một tòa thành lớn, chẳng ai còn nhận ra bạn.', fx: { tam: 3 } },
  { a: [130, 9999], once: true, t: 'Những người quen năm xưa giờ đều đã hóa thành nắm đất vàng.', fx: { tam: -4 } },
  { if: (s) => s.fame >= 8, once: true, t: 'Tên của bạn bắt đầu được truyền tụng trong các quán trà khắp đế quốc.', fx: { tam: 3 } },
  { r: [2, 10], t: 'Đêm có mưa thiên thạch, đấu khí thiên địa dao động mãnh liệt.', fx: { qi: 25 } },
  { if: (s) => s.evil, t: 'Bạn thu thêm một linh hồn vào hồn phiên. Ánh mắt mọi người nhìn bạn đầy sợ hãi.', fx: { tam: -3, qi: 20 } },
  { if: (s) => s.disciples > 0, t: 'Đệ tử của bạn vừa đột phá, chạy đến khoe với bạn.', fx: { tam: 3 } },
  { if: (s) => !!s.sect, t: (s) => `Sáng sớm, tiếng hô luyện công của ${s.sect.members} đệ tử ${s.sect.name} vang vọng khắp núi.`, fx: { tam: 2 } },
  { if: (s) => landCount(s) >= 3, t: 'Dân chúng trong lãnh địa dựng bia ghi công cho bạn.', fx: { fame: 1, tam: 2 } },
  { if: (s) => !!s.gear?.wep, t: (s) => `${s.gear.wep.n} trong tay khẽ ngân lên, như đang khát máu.`, fx: { tam: 1 } },
  { if: (s) => s.smithy?.lv > 0, t: 'Tiếng búa trong lò rèn vang suốt đêm, tia lửa bắn sáng cả sân.', fx: { body: 1 } },
  { if: (s) => s.arms >= 100, t: (s) => `Kho binh khí đã chất ${s.arms} bộ, xếp thành hàng dài như rừng giáo.`, fx: { tam: 1 } },
  { if: (s) => (s.army?.train || 0) >= 20, t: 'Quân đội diễn trận trên bãi tập, tiếng hô chấn động sơn cốc.', fx: { tam: 1 } },
  { if: (s) => s.cons?.length > 0, t: 'Bạn ghé qua Sàn Vạn Bảo, xem hàng ký gửi của mình có ai hỏi mua chưa.', fx: { tam: 1 } },
  { r: [11, 11], t: 'Bạn đứng trên tầng mây cao nhất, nhìn xuống cả Đấu Khí Đại Lục.', fx: { tam: 3 } },
  { r: [11, 11], t: 'Thiên địa quy tắc thì thầm bên tai. Bạn cảm nhận rõ sự vận hành của vạn vật.', fx: { qi: 40 } },
];

export const FILLERS = {
  baby: ['Bạn lớn lên từng ngày trong vòng tay phụ mẫu.', 'Thế giới với bạn là một chuỗi những điều mới lạ.', 'Bạn chạy nhảy khắp đầu làng cuối xóm.'],
  tu: ['Bạn bế quan, ngày đêm vận chuyển đấu khí theo chu thiên.', 'Trong mật thất, chỉ có tiếng thở đều đặn của bạn.', 'Bạn ngồi thiền dưới thác nước suốt một mùa.'],
  lich: ['Bạn lang bạt khắp nơi, ngủ dưới trời sao.', 'Một chuyến săn ma thú dài ngày ở biên giới.', 'Bạn băng qua những vùng đất hoang vu.'],
  duoc: ['Lò đan đỏ rực suốt ngày đêm.', 'Bạn nghiên cứu dược phương đến quên ăn quên ngủ.', 'Mùi thảo dược thấm vào từng thớ áo bạn.'],
  ky: ['Bạn luyện đi luyện lại một chiêu thức đến hàng vạn lần.', 'Sân luyện võ in hằn dấu chân bạn.', 'Mỗi ngày bạn đối luyện với cọc gỗ đến kiệt sức.'],
  nv: ['Bạn nhận vài nhiệm vụ lặt vặt ở công hội: đưa thư, canh kho.', 'Một mùa chạy việc cho Dong Binh Công Hội.', 'Bạn hộ tống vài chuyến hàng ngắn quanh thành.'],
  tong: ['Bạn giảng đạo cho đệ tử nội môn suốt một mùa.', 'Bạn đi tuần khắp các lãnh địa, xử lý công vụ.', 'Tông môn ngày một hưng thịnh, khách đến bái phỏng không ngớt.'],
  tinh: ['Bạn ngồi uống trà, ngắm mây trôi.', 'Tâm như mặt hồ phẳng lặng.', 'Bạn đi giữa nhân gian, quan sát hỉ nộ ái ố.'],
};

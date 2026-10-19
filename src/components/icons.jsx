// Bộ icon của game, lấy từ Game Icons (game-icons.net, CC BY 3.0) qua react-icons.
// Mọi nơi trong giao diện dùng chung các bảng dưới đây để một khái niệm luôn có cùng một hình.
import {
  GiMuscleUp, GiSpectre, GiLotus, GiClover, GiHourglass, GiFlame, GiTwoCoins, GiCrossedSwords, GiLaurelCrown, GiCastle,
  GiCrystalGrowth, GiHerbsBundle, GiMetalBar, GiMedicinePills, GiHealthPotion, GiMagicPotion, GiSoulVessel, GiTeapotLeaves, GiPeach,
  GiBroadsword, GiBreastplate, GiGemPendant, GiDiamondRing, GiBoots,
  GiKnapsack, GiAnvil, GiShop, GiPagoda,
  GiMeditation, GiMountainRoad, GiScrollUnfurled, GiCauldron, GiSwordSpin, GiTeapot,
  GiBookshelf, GiPunchingBag, GiCheckedShield, GiTeacher, GiBarracksTent, GiMining, GiOpenTreasureChest, GiSwapBag,
  GiSpears, GiArcher, GiCavalry, GiWizardStaff,
  GiSprout, GiStandingPotion, GiGoldMine, GiGavel,
  GiUpgrade, GiSparkles, GiBrokenShield, GiTombstone,
  GiPauseButton, GiPlayButton, GiFastForwardButton, GiHelp, GiCancel, GiPadlock, GiCheckMark, GiDeathSkull, GiRollingDices,
  GiTrophyCup, GiReceiveMoney, GiPayMoney, GiPriceTag, GiMountaintop, GiTreasureMap, GiWizardFace, GiTowerFlag,
  GiImperialCrown, GiDragonHead, GiScrollQuill, GiPortal, GiDna1,
  GiAbacus, GiExitDoor, GiThreeFriends, GiTargetDummy, GiHammerDrop, GiFire, GiYinYang, GiOpenBook, GiSpellBook,
} from 'react-icons/gi';

export function Ico({ i: I, size = 18, className = '', title }) {
  if (!I) return null;
  return <I className={'ico ' + className} size={size} aria-hidden={title ? undefined : true} title={title} />;
}

export const STAT_I = { body: GiMuscleUp, soul: GiSpectre, tam: GiLotus, luck: GiClover, gold: GiTwoCoins, qi: GiFlame, item: GiKnapsack, life: GiHourglass };
export const ITEM_I = { core: GiCrystalGrowth, herb: GiHerbsBundle, ore: GiMetalBar, tuk: GiMedicinePills, lieu: GiHealthPotion, pha: GiMagicPotion, hon: GiSoulVessel, calm: GiTeapotLeaves, tho: GiPeach };
export const SLOT_I = { wep: GiBroadsword, arm: GiBreastplate, acc: GiGemPendant, rng: GiDiamondRing, boo: GiBoots };
export const NAV_I = { bag: GiKnapsack, forge: GiAnvil, market: GiShop, sect: GiPagoda };
export const FOCUS_I = { tu: GiMeditation, lich: GiMountainRoad, nv: GiScrollUnfurled, duoc: GiCauldron, ky: GiSwordSpin, tinh: GiTeapot, tong: GiPagoda };
export const BUILD_I = { kinh: GiBookshelf, dan: GiCauldron, vo: GiPunchingBag, tran: GiCheckedShield, hien: GiTeacher, doanh: GiBarracksTent, khoang: GiMining };
export const TROOP_I = { bo: GiSpears, cung: GiArcher, ky: GiCavalry, phap: GiWizardStaff };
export const EST_I = { tra: GiTeapot, dien: GiSprout, pho: GiStandingPotion, mo: GiGoldMine, dg: GiGavel };
export const KIND_I = { key: GiScrollUnfurled, up: GiUpgrade, good: GiSparkles, bad: GiBrokenShield, money: GiTwoCoins, death: GiTombstone };
export const MK_I = { core: GiCrystalGrowth, herb: GiHerbsBundle, ore: GiMetalBar, pill: GiMedicinePills, gear: GiBroadsword, arms: GiSpears };
// Đế lộ: đế cảnh, nhất thống, truyền thừa, phi thăng
export const EMP_I = { de: GiImperialCrown, unify: GiDragonHead, legacy: GiScrollQuill, ascend: GiPortal };
export const LEG_I = { blood: GiDna1, gear: GiBroadsword, fire: GiFire, gong: GiOpenBook, gold: GiTwoCoins, sect: GiPagoda };
export const UI_I = {
  pause: GiPauseButton, play: GiPlayButton, speed: GiFastForwardButton, help: GiHelp, close: GiCancel, lock: GiPadlock, ok: GiCheckMark,
  deadly: GiDeathSkull, dice: GiRollingDices, ach: GiTrophyCup, sell: GiReceiveMoney, buy: GiPayMoney, tag: GiPriceTag, retire: GiMountaintop,
  map: GiTreasureMap, army: GiCrossedSwords, elder: GiWizardFace, land: GiTowerFlag, ledger: GiAbacus, home: GiExitDoor, members: GiThreeFriends,
  train: GiTargetDummy, craft: GiHammerDrop, up: GiUpgrade, cp: GiCrossedSwords, fame: GiLaurelCrown, power: GiCastle, fire: GiFire,
  alch: GiCauldron, gong: GiOpenBook, skill: GiSpellBook, realm: GiYinYang, gold: GiTwoCoins, vault: GiOpenTreasureChest, auction: GiGavel, time: GiHourglass, take: GiSwapBag,
};

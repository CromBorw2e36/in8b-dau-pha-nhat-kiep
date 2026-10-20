// Chỉ dùng khi phát triển: dựng sẵn một nhân vật hậu kỳ để xem giao diện (mở bằng #demo trên URL)
import G from './data.js';
import { newLife, tick, choicesOf, choose } from './engine.js';
import { foundSect } from './sect.js';
import { genGear } from './gear.js';
import { give } from './util.js';

export function demoLife() {
  const s = newLife();
  s.name = 'Lâm Phong';
  // Chạy vài chục lượt để có nhật ký thật
  for (let i = 0; i < 60; i++) {
    if (s.dead) s.dead = false; // demo: không để nhân vật chết giữa chừng
    if (s.needFocus) { s.focus = 'lich'; s.needFocus = false; }
    if (s.pending) { const ch = choicesOf(s); choose(s, ch[ch.length - 1]); continue; }
    tick(s);
  }
  s.dead = false;
  Object.assign(s, { started: true, R: 8, step: 4, qi: 62, age: Math.max(s.age, 420), gold: 9.2e8, fame: 60, body: 72, soul: 81, tam: 64, luck: 58, alch: 6, gong: 3, skill: 3, mastery: 70 });
  s.fires = ['Thanh Liên Địa Tâm Hỏa'];
  s.R = 5; foundSect(s, 'Thiên Viêm Tông'); s.R = 8;
  Object.assign(s.sect, { members: 640, elders: 5, b: { kinh: 18, dan: 12, vo: 24, tran: 9, hien: 15, doanh: 32 } });
  for (const id of ['otan', 'thanhson', 'mathu', 'vanlam', 'giama', 'thapqua', 'hacgiac', 'danvuc', 'hoatong']) s.land[id] = { at: 300, dev: Math.floor(Math.random() * 30) };
  s.estates = { tra: 42, dien: 31, pho: 26, mo: 12, dg: 4 };
  s.smithy = { lv: 47, prod: true };
  s.arms = 860;
  s.army = { n: { bo: 900, cung: 300, ky: 120, phap: 40 }, armed: 1100, train: 36 };
  for (const sl of G.GEAR_SLOTS) s.gear[sl] = { ...genGear(s, { sl, tier: 4, q: sl === 'wep' ? 2 : 1.25 }), en: sl === 'wep' ? 11 : 6 };
  s.armory = Array.from({ length: 7 }, (_, i) => genGear(s, { tier: 3 + (i % 3), boost: 2 }));
  give(s, 'ore', 6, 64); give(s, 'core', 7, 14); give(s, 'tuk', 7, 6); give(s, 'pha', 7, 2); give(s, 'tho', 6, 1); give(s, 'hon', 7, 3); give(s, 'herb', 6, 9);
  s.mkt = { core: 1.21, herb: 0.84, ore: 1.05, pill: 0.97, gear: 1.33, arms: 1.48 };
  s.cons = [{ id: 'c1', kind: 'item', key: 'tuk:7', n: 4, price: 260000, t: s.t }];
  s.orders = [{ id: 'o1', buyer: 'Liên quân Trung Châu', n: 400, price: 5200, due: s.t + 4 }, { id: 'o2', buyer: 'Hộ vệ Đan Tháp', n: 1200, price: 4800, due: s.t + 2 }];
  s.exNew = 2;
  s.beasts = { pets: [{ id: 'mang', lv: 6, xp: 40 }, { id: 'ho', lv: 3, xp: 5 }], mounts: [{ id: 'su', lv: 4, xp: 12 }], pet: 'mang', mount: 'su' };
  s.companion = 'Thôn Thiên Mãng';
  s.outfit = 'thanh';
  s.focus = 'tong';
  s.needFocus = false;
  s.pending = null;
  return s;
}

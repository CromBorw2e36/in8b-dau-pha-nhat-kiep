import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import G from '../game/data.js';
import { load, readBook } from '../game/engine.js';
import Backup from './Backup.jsx';
import { useInstall } from '../pwa.js';
import { ACH, readAch } from '../game/ach.js';
import { Seal } from './glyphs.jsx';
import { rise as riseV } from './motion.js';
import { rise, PAL } from '../fx/fx.js';
import { SoundBtn } from './ui.jsx';

export default function Start({ onNew, onResume }) {
  const [saved, setSaved] = useState(() => load());
  const [book, setBook] = useState(() => readBook());
  const reload = () => { setSaved(load()); setBook(readBook()); };
  const inst = useInstall();
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [showRealms, setShowRealms] = useState(false);
  const [showAch, setShowAch] = useState(false);
  const ach = readAch();
  const achN = ACH.filter((a) => ach[a.id]).length;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const sec = (now - t0) / 1000;

  // Than hồng bay lên đều đặn từ chân núi
  useEffect(() => {
    const emit = () => { if (!document.hidden) rise({ x: innerWidth / 2, y: innerHeight - 30 }, { n: 14, w: innerWidth, life: 4200, colors: PAL.fire, speed: 0.9 }); };
    emit();
    const id = setInterval(emit, 2600);
    return () => clearInterval(id);
  }, []);
  const hero = useRef(null);
  // Màn rộng: núi trôi nhẹ theo con trỏ
  const onMove = (e) => {
    const x = (e.clientX / innerWidth - 0.5) * 2;
    hero.current?.parentElement?.style.setProperty('--px', x.toFixed(3));
  };

  return (
    <div className="screen start" onPointerMove={onMove}>
      <div className="mountains far" aria-hidden="true" />
      <div className="mountains" aria-hidden="true" />
      <SoundBtn className="start-sfx" />
      <motion.div className="hero" ref={hero} initial="hidden" animate="show">
        <div className="hero-sigil" aria-hidden="true" />
        <motion.img variants={riseV} custom={0} className="hero-logo" src="./icons/icon-192.png" alt="" width="96" height="96" />
        <motion.h1 variants={riseV} custom={1}>Đấu Phá</motion.h1>
        <motion.div variants={riseV} custom={2} className="subtitle"><span>Nhất</span><i>✦</i><span>Kiếp</span></motion.div>
        <motion.p variants={riseV} custom={3} className="lead">
          Phế vật bị người đời khinh rẻ,<br />hay Đấu Đế vạn cổ lưu danh?
        </motion.p>
        <motion.div variants={riseV} custom={4} className="counter">
          <b>{Math.floor(sec * 4.2).toLocaleString('vi-VN')}</b>
          <span>sinh linh vừa chào đời</span>
        </motion.div>
      </motion.div>

      <motion.div className="actions" initial="hidden" animate="show" variants={riseV} custom={5}>
        <button className="btn primary" onClick={onNew}>Nhập thế · Bắt đầu kiếp mới</button>
        {saved && (
          <button className="btn" onClick={onResume}>
            Tiếp tục kiếp của {saved.name} · {saved.age} tuổi
          </button>
        )}
        {inst.mode === 'prompt' && (
          <button className="btn ghost" onClick={inst.install}>Cài vào điện thoại như một ứng dụng</button>
        )}
        {inst.mode === 'ios' && (
          <p className="muted small center">Cài như ứng dụng: bấm nút <b>Chia sẻ</b> của Safari rồi chọn <b>Thêm vào MH chính</b>.</p>
        )}
      </motion.div>

      <section className="panel frame">
        <button className="panel-head" onClick={() => setShowRealms((v) => !v)}>
          <span>Hệ thống cảnh giới</span><span className="toggle">{showRealms ? '−' : '+'}</span>
        </button>
        {showRealms && (
          <ol className="realms">
            {G.REALMS.map((r, i) => (
              <li key={r.n}>
                <span className="r-idx">{i + 1}</span>
                <span className="r-name">{r.n}</span>
                <span className="r-life">{r.life === Infinity ? 'Bất tử' : `Thọ ${r.life} năm`}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="panel frame">
        <button className="panel-head" onClick={() => setShowAch((v) => !v)}>
          <span>Thành tựu</span><span className="muted num">{achN}/{ACH.length} <span className="toggle">{showAch ? '−' : '+'}</span></span>
        </button>
        {showAch && (
          <ul className="ach">
            {ACH.map((a) => (
              <li key={a.id} className={ach[a.id] ? 'got' : ''}>
                <Seal ch={a.g} size="sm" tone={ach[a.id] ? 'gold' : 'outline'} />
                <div><b>{a.n}</b><small>{a.d}{ach[a.id] ? ` · ${ach[a.id].name}` : ''}</small></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {book.length > 0 && (
        <section className="panel frame">
          <div className="panel-head static"><span>Sổ luân hồi</span><span className="muted">{book.length} kiếp</span></div>
          <ul className="book">
            {book.slice(0, 12).map((b) => (
              <li key={b.id} className={b.win ? 'win' : ''}>
                <div>
                  <b>{b.name}</b>
                  <small>{b.title} · hưởng thọ {b.age}{b.ng ? ` · trùng sinh ${b.ng}` : ''}{b.up ? ' · Thượng giới' : ''}</small>
                </div>
                <span className="tag">{b.realm.replace(/ \d+ (tinh|đoạn|trọng)/, '')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Backup onRestored={reload} />

      <p className="fineprint">Fan game phi thương mại, lấy cảm hứng từ «Đấu Phá Thương Khung» của Thiên Tằm Thổ Đậu.<br />Tiến trình được lưu trên trình duyệt này.<br />Icon: <a href="https://game-icons.net" target="_blank" rel="noreferrer">game-icons.net</a> (CC BY 3.0).</p>
    </div>
  );
}

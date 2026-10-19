import { useEffect, useState } from 'react';
import G from '../game/data.js';
import { load, readBook } from '../game/engine.js';
import Backup from './Backup.jsx';
import { useInstall } from '../pwa.js';

export default function Start({ onNew, onResume }) {
  const [saved, setSaved] = useState(() => load());
  const [book, setBook] = useState(() => readBook());
  const reload = () => { setSaved(load()); setBook(readBook()); };
  const inst = useInstall();
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [showRealms, setShowRealms] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const sec = (now - t0) / 1000;

  return (
    <div className="screen start">
      <div className="mountains" aria-hidden="true" />
      <div className="hero">
        <img className="hero-logo" src="./icons/icon-192.png" alt="" width="96" height="96" />
        <h1>Đấu Phá</h1>
        <div className="subtitle"><span>Nhất</span><i>✦</i><span>Kiếp</span></div>
        <p className="lead">
          Một kiếp người trên Đấu Khí Đại Lục.<br />Phế vật bị người đời khinh rẻ, hay Đấu Đế vạn cổ lưu danh?
        </p>
        <div className="counter">
          <span>Từ khi ngươi mở quyển sách này, đại lục có thêm</span>
          <b>{Math.floor(sec * 4.2).toLocaleString('vi-VN')}</b>
          <span>sinh linh chào đời</span>
        </div>
      </div>

      <div className="actions">
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
      </div>

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

      {book.length > 0 && (
        <section className="panel frame">
          <div className="panel-head static"><span>Sổ luân hồi</span><span className="muted">{book.length} kiếp</span></div>
          <ul className="book">
            {book.slice(0, 12).map((b) => (
              <li key={b.id} className={b.win ? 'win' : ''}>
                <div>
                  <b>{b.name}</b>
                  <small>{b.title} · hưởng thọ {b.age}</small>
                </div>
                <span className="tag">{b.realm.replace(/ \d+ (tinh|đoạn)/, '')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Backup onRestored={reload} />

      <p className="fineprint">Fan game phi thương mại, lấy cảm hứng từ «Đấu Phá Thương Khung» của Thiên Tằm Thổ Đậu.<br />Tiến trình được lưu trên trình duyệt này.</p>
    </div>
  );
}

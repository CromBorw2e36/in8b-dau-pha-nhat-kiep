import { useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { newLife, load, save, clearSave, addToBook } from './game/engine.js';
import Start from './components/Start.jsx';
import Birth from './components/Birth.jsx';
import Game from './components/Game.jsx';
import End from './components/End.jsx';
import Intro, { introDue } from './components/Intro.jsx';
import FxLayer from './fx/FxLayer.jsx';
import MoonScene from './fx/MoonScene.jsx';
import { play } from './fx/sfx.js';

// Chuyển màn: mực loang từ giữa ra (clip-path), xong thì bỏ clip để không cắt các bảng nổi
const SCREEN = {
  initial: { opacity: 0, clipPath: 'circle(0% at 50% 45%)' },
  animate: { opacity: 1, clipPath: 'circle(150% at 50% 45%)', transition: { duration: 0.75, ease: [0.65, 0, 0.35, 1] }, transitionEnd: { clipPath: 'none' } },
  exit: { opacity: 0, transition: { duration: 0.28 } },
};

export default function App() {
  const life = useRef(null);
  const [screen, setScreen] = useState('start');
  const [intro, setIntro] = useState(() => !location.hash.startsWith('#demo') && introDue());
  const [ver, bump] = useReducer((x) => x + 1, 0);

  // bump(): khi đang ở màn sinh ra mà đầu thai lại, screen không đổi nên phải ép vẽ lại
  const begin = () => { life.current = newLife(); save(life.current); setScreen('birth'); bump(); play('gong'); };
  const resume = () => { life.current = load(); if (life.current) { setScreen('game'); play('open'); } };
  const finish = () => { addToBook(life.current); clearSave(); setScreen('end'); play('death'); };

  // Chỉ khi phát triển: #demo/<bảng>/<tab> mở thẳng một nhân vật hậu kỳ để xem giao diện
  const [demo, setDemo] = useState(null);
  useEffect(() => {
    if (!import.meta.env.DEV || !location.hash.startsWith('#demo')) return;
    import('./game/demo.js').then(({ demoLife }) => {
      life.current = demoLife();
      const [, panel, tab] = location.hash.slice(1).split('/');
      // #demo/event/<id>: mở sẵn một sự kiện
      if (panel === 'event') import('./game/engine.js').then(({ EV }) => { EV[tab]?.prep?.(life.current); life.current.pending = tab; bump(); });
      // #demo/end: xem bia ký cuối đời
      // #demo/heir: xem cảnh thức tỉnh pháp bảo truyền thừa
      if (panel === 'heir') life.current.heirNew = [life.current.gear.wep.id];
      if (panel === 'end') { Object.assign(life.current, { dead: true, cause: 'Vẫn lạc trong trận Đế chiến' }); setScreen('end'); return; }
      setDemo({ panel: panel === 'event' ? null : panel, tab });
      setScreen('game');
    });
  }, []);

  const s = life.current;
  return (
    <>
      {/* Nền 3D nằm dưới mọi nội dung; ở màn chơi thì dịu đi để chữ nhật ký dễ đọc */}
      <MoonScene realm={s?.R || 0} dim={screen === 'game'} />
      <div className="app">
        <AnimatePresence mode="wait">
          {!intro && (
            <motion.div key={screen} className="scr" variants={SCREEN} initial="initial" animate="animate" exit="exit">
              {screen === 'start' && <Start onNew={begin} onResume={resume} />}
              {screen === 'birth' && <Birth s={s} ver={ver} onGo={() => { setScreen('game'); play('drum'); }} onReroll={begin} />}
              {screen === 'game' && <Game s={s} ver={ver} bump={bump} onEnd={finish} onHome={() => setScreen('start')} demo={demo} />}
              {screen === 'end' && <End s={s} onNew={begin} onHome={() => setScreen('start')} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {intro && <Intro onDone={() => setIntro(false)} />}
      <FxLayer />
    </>
  );
}

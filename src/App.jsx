import { useEffect, useReducer, useRef, useState } from 'react';
import { newLife, load, save, clearSave, addToBook } from './game/engine.js';
import Start from './components/Start.jsx';
import Birth from './components/Birth.jsx';
import Game from './components/Game.jsx';
import End from './components/End.jsx';

export default function App() {
  const life = useRef(null);
  const [screen, setScreen] = useState('start');
  const [ver, bump] = useReducer((x) => x + 1, 0);

  // bump(): khi đang ở màn sinh ra mà đầu thai lại, screen không đổi nên phải ép vẽ lại
  const begin = () => { life.current = newLife(); save(life.current); setScreen('birth'); bump(); };
  const resume = () => { life.current = load(); if (life.current) setScreen('game'); };
  const finish = () => { addToBook(life.current); clearSave(); setScreen('end'); };

  // Chỉ khi phát triển: #demo/<bảng>/<tab> mở thẳng một nhân vật hậu kỳ để xem giao diện
  const [demo, setDemo] = useState(null);
  useEffect(() => {
    if (!import.meta.env.DEV || !location.hash.startsWith('#demo')) return;
    import('./game/demo.js').then(({ demoLife }) => {
      life.current = demoLife();
      const [, panel, tab] = location.hash.slice(1).split('/');
      // #demo/event/<id>: mở sẵn một sự kiện
      if (panel === 'event') import('./game/engine.js').then(({ EV }) => { EV[tab]?.prep?.(life.current); life.current.pending = tab; bump(); });
      setDemo({ panel: panel === 'event' ? null : panel, tab });
      setScreen('game');
    });
  }, []);

  const s = life.current;
  return (
    <div className="app">
      {screen === 'start' && <Start onNew={begin} onResume={resume} />}
      {screen === 'birth' && <Birth s={s} onGo={() => setScreen('game')} onReroll={begin} />}
      {screen === 'game' && <Game s={s} ver={ver} bump={bump} onEnd={finish} onHome={() => setScreen('start')} demo={demo} />}
      {screen === 'end' && <End s={s} onNew={begin} onHome={() => setScreen('start')} />}
    </div>
  );
}

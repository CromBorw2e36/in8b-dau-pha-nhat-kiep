import { useReducer, useRef, useState } from 'react';
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

  const s = life.current;
  return (
    <div className="app">
      {screen === 'start' && <Start onNew={begin} onResume={resume} />}
      {screen === 'birth' && <Birth s={s} onGo={() => setScreen('game')} onReroll={begin} />}
      {screen === 'game' && <Game s={s} ver={ver} bump={bump} onEnd={finish} onHome={() => setScreen('start')} />}
      {screen === 'end' && <End s={s} onNew={begin} onHome={() => setScreen('start')} />}
    </div>
  );
}

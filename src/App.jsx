import { useCallback, useEffect, useState } from 'react';
import { api } from './lib/api.js';
import { safeStorage } from './lib/progress.js';
import { getSubject } from './data/subjects.js';
import { useTheme } from './hooks/useTheme.js';
import Header from './components/Header.jsx';
import Login from './components/Login.jsx';
import SubjectPicker from './components/SubjectPicker.jsx';
import Home from './components/Home.jsx';
import Game from './components/Game.jsx';
import Result from './components/Result.jsx';
import Flashcards from './components/Flashcards.jsx';
import Ranking from './components/Ranking.jsx';
import AtlasHub from './components/atlas/AtlasHub.jsx';
import AtlasStudy from './components/atlas/AtlasStudy.jsx';
import AtlasGame from './components/atlas/AtlasGame.jsx';
import AtlasEditor from './components/atlas/AtlasEditor.jsx';
import { Spinner } from './components/ui.jsx';

const PLAYER_KEY = 'nursehub:player';
const SUBJECT_KEY = 'nursehub:subject';
const NAV_OF = { home: 'home', game: 'home', result: 'home', flash: 'flash', ranking: 'ranking', atlas: 'atlas', atlasStudy: 'atlas', atlasGame: 'atlas', atlasEditor: 'atlas' };

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [player, setPlayer] = useState(null);
  const [subject, setSubject] = useState(null);
  const [systems, setSystems] = useState([]);
  const [screen, setScreen] = useState({ name: 'loading' });
  const [error, setError] = useState('');

  const go = (name, extra = {}) => { setScreen({ name, ...extra }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // Ativa uma matéria e carrega o progresso do jogador nela
  const enterSubject = useCallback(async (id, name) => {
    api.setSubject(id);
    safeStorage.set(SUBJECT_KEY, id);
    const [p, s] = await Promise.all([api.player(name), api.systems()]);
    setSubject(getSubject(id)); setPlayer(p); setSystems(s);
    go('home');
  }, []);

  const login = useCallback(async (name) => {
    try {
      const p = await api.player(name);
      setPlayer(p); setError('');
      safeStorage.set(PLAYER_KEY, p.name);
      const saved = safeStorage.get(SUBJECT_KEY);
      if (saved && getSubject(saved)) await enterSubject(saved, p.name);
      else go('subjects');
    } catch (e) {
      setError(e.message || 'Não foi possível iniciar.');
      go('login');
    }
  }, [enterSubject]);

  useEffect(() => {
    const saved = safeStorage.get(PLAYER_KEY);
    saved ? login(saved) : setScreen({ name: 'login' });
  }, [login]);

  const refreshPlayer = async () => { try { setPlayer(await api.player(player.name)); } catch { /* ignora */ } };
  const navigate = async (name) => { await refreshPlayer(); go(name); };

  const finish = (back) => async (data) => {
    const saved = await api.finish(player.name, data).catch(() => null);
    if (saved) setPlayer(saved.player);
    go('result', { data: { ...data, saved }, back });
  };

  const reset = async () => {
    if (!confirm(`Zerar seu progresso em ${subject.name} (estrelas, recordes e erros)?`)) return;
    await api.resetPlayer(player.name);
    await refreshPlayer();
  };

  const logout = () => { safeStorage.del(PLAYER_KEY); setPlayer(null); go('login'); };

  const s = screen;
  const ready = player && subject;
  return (
    <>
      <Header
        player={player}
        subject={s.name === 'subjects' ? null : subject}
        current={NAV_OF[s.name]}
        onNavigate={navigate}
        onSubjects={() => go('subjects')}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      />
      <main key={subject?.id} className="mx-auto max-w-5xl p-4 sm:p-6">
        {s.name === 'loading' && <Spinner />}
        {s.name === 'login' && <Login onLogin={login} error={error} />}
        {s.name === 'subjects' && player && <SubjectPicker player={player} current={subject?.id} onPick={(id) => enterSubject(id, player.name)} />}

        {ready && (
          <>
            {s.name === 'home' && (
              <Home player={player} subject={subject} systems={systems} onPlay={(mode) => go('game', { mode, key: Date.now() })} onNavigate={navigate} onReset={reset} />
            )}
            {s.name === 'game' && (
              <Game key={s.key} player={player} mode={s.mode} onFinish={finish({ name: 'game', mode: s.mode })} onExit={() => navigate('home')} />
            )}
            {s.name === 'result' && (
              <Result
                data={s.data}
                menuLabel={s.back.name === 'atlasGame' ? `Voltar ao ${subject.practice.nav}` : 'Início'}
                onReplay={() => go(s.back.name, { ...s.back, key: Date.now() })}
                onMenu={() => navigate(s.back.name === 'atlasGame' ? 'atlas' : 'home')}
              />
            )}
            {s.name === 'flash' && <Flashcards systems={systems} subject={subject} />}
            {s.name === 'ranking' && <Ranking systems={systems} me={player.name} subject={subject} />}

            {s.name === 'atlas' && (
              <AtlasHub
                player={player}
                subject={subject}
                onStudy={(figure) => go('atlasStudy', { figure })}
                onPlay={(figure, type) => go('atlasGame', { figure, type, key: Date.now() })}
                onEditor={() => go('atlasEditor')}
              />
            )}
            {s.name === 'atlasStudy' && (
              <AtlasStudy figureId={s.figure} onBack={() => go('atlas')} onPlay={(figure, type) => go('atlasGame', { figure, type, key: Date.now() })} />
            )}
            {s.name === 'atlasGame' && (
              <AtlasGame key={s.key} figure={s.figure} type={s.type} onFinish={finish({ name: 'atlasGame', figure: s.figure, type: s.type })} onExit={() => navigate('atlas')} />
            )}
            {s.name === 'atlasEditor' && <AtlasEditor subject={subject} onBack={() => navigate('atlas')} />}
          </>
        )}
      </main>
    </>
  );
}

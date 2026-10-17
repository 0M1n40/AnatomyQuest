import { useCallback, useEffect, useRef, useState } from 'react';

export const TIME = { mcq: 25, open: 150, organ: 40, name: 25, locate: 25 };
export const multiplier = (combo) => Math.min(1 + Math.floor(combo / 3), 4);

// Regras compartilhadas: vidas, tempo (por questão), pontos, combo e acertos parciais.
export function useGameEngine({ unlimitedLives = false, onTimeout }) {
  const [lives, setLives] = useState(3);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [log, setLog] = useState([]);
  const [limit, setLimit] = useState(TIME.mcq);
  const [time, setTime] = useState(TIME.mcq);
  const [answered, setAnswered] = useState(false);
  const [running, setRunning] = useState(false);
  const [anim, setAnim] = useState('');
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;

  useEffect(() => {
    if (!running || answered) return;
    if (time <= 0) { setRunning(false); timeoutRef.current?.(); return; }
    const t = setTimeout(() => setTime((s) => Math.max(0, +(s - 0.1).toFixed(1))), 100);
    return () => clearTimeout(t);
  }, [running, answered, time]);

  const start = useCallback((seconds = TIME.mcq) => {
    setLimit(seconds); setTime(seconds); setAnswered(false); setAnim(''); setRunning(true);
  }, []);
  const pause = useCallback(() => setRunning(false), []);

  // result: 'correct' | 'partial' | 'wrong'
  const register = useCallback((result, entry) => {
    setAnswered(true);
    setRunning(false);
    const base = Math.round(100 + (time / limit) * 100);
    if (result === 'correct') {
      const nc = combo + 1;
      setCombo(nc);
      setMaxCombo((m) => Math.max(m, nc));
      setPoints((p) => p + base * multiplier(nc));
      setAnim('animate-pop');
    } else if (result === 'partial') {
      setPoints((p) => p + Math.round(base / 2));
      setAnim('animate-pop');
    } else {
      setCombo(0);
      if (!unlimitedLives) setLives((l) => l - 1);
      setAnim('animate-shake');
    }
    setLog((l) => [...l, { ...entry, result, correct: result === 'correct' }]);
  }, [combo, time, limit, unlimitedLives]);

  const hits = log.reduce((s, l) => s + (l.result === 'correct' ? 1 : l.result === 'partial' ? 0.5 : 0), 0);
  return { lives, points, combo, maxCombo, log, hits, time, limit, answered, anim, running, start, pause, register, unlimitedLives };
}

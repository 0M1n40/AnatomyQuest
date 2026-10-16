import { useCallback, useEffect, useRef, useState } from 'react';

export const TIME = 25;
export const multiplier = (combo) => Math.min(1 + Math.floor(combo / 3), 4);

// Regras compartilhadas entre o Simulado e o Atlas: vidas, tempo, pontos e combo.
export function useGameEngine({ unlimitedLives = false, onTimeout }) {
  const [lives, setLives] = useState(3);
  const [points, setPoints] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [log, setLog] = useState([]);
  const [time, setTime] = useState(TIME);
  const [answered, setAnswered] = useState(false);
  const [running, setRunning] = useState(false);
  const [anim, setAnim] = useState('');
  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;

  useEffect(() => {
    if (!running || answered) return;
    if (time <= 0) { timeoutRef.current?.(); return; }
    const t = setTimeout(() => setTime((s) => Math.max(0, +(s - 0.1).toFixed(1))), 100);
    return () => clearTimeout(t);
  }, [running, answered, time]);

  const register = useCallback((correct, entry) => {
    setAnswered(true);
    if (correct) {
      const nc = combo + 1;
      setCombo(nc);
      setMaxCombo((m) => Math.max(m, nc));
      setPoints((p) => p + Math.round((100 + time * 4) * multiplier(nc)));
      setAnim('animate-pop');
    } else {
      setCombo(0);
      if (!unlimitedLives) setLives((l) => l - 1);
      setAnim('animate-shake');
    }
    setLog((l) => [...l, { ...entry, correct }]);
  }, [combo, time, unlimitedLives]);

  const resetTurn = useCallback(() => { setAnswered(false); setTime(TIME); setAnim(''); }, []);

  const hits = log.filter((l) => l.correct).length;
  return { lives, points, combo, maxCombo, log, hits, time, answered, anim, running, setRunning, register, resetTurn, unlimitedLives };
}

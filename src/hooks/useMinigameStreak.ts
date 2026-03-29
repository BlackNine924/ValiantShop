import { useState, useEffect, useCallback } from 'react';
import { safeStorage } from '../utils/storageUtils';

export type MinigameKey = 'pokegrid' | 'pokedle' | 'pokequiz';

interface StreakData {
  current: number;
  lastCompletedDate: string;
}

const getKey = (uid: string, game: MinigameKey) => `minigame_streak_${game}_${uid}`;
const getDateStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

export const useMinigameStreak = (uid: string | undefined, game: MinigameKey) => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const data: StreakData = safeStorage.getItem(getKey(uid, game), { current: 0, lastCompletedDate: '' });
    setStreak(data.current);
  }, [uid, game]);

  const registerWin = useCallback(() => {
    if (!uid) return;

    const today = getDateStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    const data: StreakData = safeStorage.getItem(getKey(uid, game), { current: 0, lastCompletedDate: '' });

    // Already registered today
    if (data.lastCompletedDate === today) return;

    let newStreak: number;
    if (data.lastCompletedDate === yesterdayStr) {
      // Consecutive day → extend streak
      newStreak = data.current + 1;
    } else {
      // Broken chain or first time → start fresh
      newStreak = 1;
    }

    const updated: StreakData = { current: newStreak, lastCompletedDate: today };
    safeStorage.setItem(getKey(uid, game), updated);
    setStreak(newStreak);
  }, [uid, game]);

  return { streak, registerWin };
};

/**
 * Returns all three minigame streaks at once (for Settings Modal display).
 */
export const useAllMinigameStreaks = (uid: string | undefined) => {
  const pokegrid = useMinigameStreak(uid, 'pokegrid');
  const pokedle  = useMinigameStreak(uid, 'pokedle');
  const pokequiz = useMinigameStreak(uid, 'pokequiz');
  return { pokegrid, pokedle, pokequiz };
};

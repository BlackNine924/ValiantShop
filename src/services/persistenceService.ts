import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserProgress {
  pokegrid?: any;
  pokedex?: {
    caught: number[];
  };
}

export const savePokeGridState = async (nick: string, gridId: string, state: any) => {
  if (!nick) return;
  const gridKey = `${nick.toLowerCase()}_${gridId}`;
  const gridRef = doc(db, 'grids', gridKey);
  await setDoc(gridRef, { 
    state, 
    userId: nick.toLowerCase(), 
    gridId,
    lastUpdated: new Date().toISOString() 
  }, { merge: true });
};

export const loadPokeGridState = async (nick: string, gridId: string) => {
  if (!nick) return null;
  const gridKey = `${nick.toLowerCase()}_${gridId}`;
  const gridRef = doc(db, 'grids', gridKey);
  const snap = await getDoc(gridRef);
  if (snap.exists()) {
    return snap.data().state || null;
  }
  return null;
};

export const savePokedexState = async (nick: string, caughtIds: number[]) => {
  if (!nick) return;
  const userRef = doc(db, 'users', nick.toLowerCase());
  await setDoc(userRef, { pokedex: { caught: caughtIds } }, { merge: true });
};

export const loadPokedexState = async (nick: string) => {
  if (!nick) return null;
  const userRef = doc(db, 'users', nick.toLowerCase());
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data().pokedex?.caught || [];
  }
  return [];
};

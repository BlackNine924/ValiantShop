import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface UserProgress {
  pokegrid?: any;
  pokedex?: {
    caught: number[];
  };
}

export const savePokeGridState = async (nick: string, state: any) => {
  if (!nick) return;
  const userRef = doc(db, 'users', nick.toLowerCase());
  await setDoc(userRef, { pokegrid: state }, { merge: true });
};

export const loadPokeGridState = async (nick: string) => {
  if (!nick) return null;
  const userRef = doc(db, 'users', nick.toLowerCase());
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data().pokegrid || null;
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

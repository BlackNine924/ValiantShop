import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserProgress {
  pokegrid?: any;
  pokedex?: {
    caught: number[];
  };
}

// Serializa o estado como string JSON pura antes de enviar ao Firestore.
// Isso resolve: functions (removidas pelo JSON.stringify), nested arrays (armazenados como string), etc.
export const savePokeGridState = async (userId: string, gridId: string, state: any) => {
  if (!userId) return;
  const stateJson = JSON.stringify(state); // JSON.stringify descarta funções automaticamente
  const gridKey = `${userId}_${gridId}`;
  const gridRef = doc(db, 'grids', gridKey);
  await setDoc(gridRef, { stateJson, userId, gridId, lastUpdated: new Date().toISOString() }, { merge: true });

  // Também salvar dentro do documento do usuário
  const userGridRef = doc(db, 'users', userId, 'gridProgress', gridId);
  await setDoc(userGridRef, { stateJson, lastUpdated: new Date().toISOString() }, { merge: true });
};


export const loadPokeGridState = async (userId: string, gridId: string) => {
  if (!userId) return null;
  
  // Tentar primeiro na coleção principal de grids
  const gridKey = `${userId}_${gridId}`;
  const gridRef = doc(db, 'grids', gridKey);
  const snap = await getDoc(gridRef);
  
  if (snap.exists()) {
    const data = snap.data();
    if (data.stateJson) return JSON.parse(data.stateJson); // novo formato
    return data.state || null; // fallback para formato antigo
  }

  // Fallback para a subcoleção do usuário
  const userGridRef = doc(db, 'users', userId, 'gridProgress', gridId);
  const userSnap = await getDoc(userGridRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    if (data.stateJson) return JSON.parse(data.stateJson);
    return data.state || null;
  }
  return null;
};

export const savePokeGridSettings = async (
  userId: string,
  settings: { enabledCriteriaIds: string[]; unlimitedMode: boolean; timerEnabled: boolean }
) => {
  if (!userId) return;
  const ref = doc(db, 'users', userId, 'settings', 'pokegrid');
  await setDoc(ref, { ...settings, lastUpdated: new Date().toISOString() }, { merge: true });
};

export const loadPokeGridSettings = async (userId: string) => {
  if (!userId) return null;
  const ref = doc(db, 'users', userId, 'settings', 'pokegrid');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
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

export const savePokedleState = async (userId: string | null, mode: string, date: string, state: any) => {
  const stateJson = JSON.stringify(state);
  const key = `pokedle_${mode}_${date}`;
  
  // Always save to localStorage for immediate persistence (Refresh/Same device)
  localStorage.setItem(key, stateJson);

  // If user is logged in, sync to Firestore
  if (userId) {
    const firestoreKey = `${userId}_${mode}_${date}`;
    const ref = doc(db, 'pokedle', firestoreKey);
    await setDoc(ref, { stateJson, userId, mode, date, lastUpdated: new Date().toISOString() }, { merge: true });
  }
};

export const loadPokedleState = async (userId: string | null, mode: string, date: string) => {
  const key = `pokedle_${mode}_${date}`;
  
  // Try localStorage first (fastest for current session/device)
  const localSaved = localStorage.getItem(key);
  if (localSaved) {
    return JSON.parse(localSaved);
  }

  // If user is logged in and no local save, try Firestore
  if (userId) {
    const firestoreKey = `${userId}_${mode}_${date}`;
    const ref = doc(db, 'pokedle', firestoreKey);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = JSON.parse(snap.data().stateJson);
      // Sink to local after loading from cloud
      localStorage.setItem(key, snap.data().stateJson);
      return data;
    }
  }
  return null;
};

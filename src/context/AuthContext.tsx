import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs, serverTimestamp, limit } from 'firebase/firestore';
import { safeStorage } from '../utils/storageUtils';

interface UserProfile {
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  isPrivate?: boolean;
  discordId?: string;
  googleId?: string;
  discordTag?: string;
  minecraftNick?: string;
  rank?: string;
  rankOverride?: string;
  nick_lowercase?: string;
  displayName?: string;
  totalSpent?: number;
  ordersCompletedCount?: number;
  pinnedPostId?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authenticate: (nick: string, discord: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Basic Firebase Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Profile Sync & Persistence Check
  useEffect(() => {
    let isMounted = true;
    let unsubscribeProfile: (() => void) | undefined;

    const syncProfile = async () => {
      if (!user?.uid) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        
        // Initial Check & Create if missing (Single one-off check to avoid recursive listener loops)
        const initialSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', user.uid)));
        if (initialSnap.empty) {
          // Attempt to get data from trainer_profile to mirror it
          const trainerSnap = await getDocs(query(collection(db, 'trainer_profiles'), where('uid', '==', user.uid)));
          const trainerData = !trainerSnap.empty ? trainerSnap.docs[0].data() : null;

          const initialProfile: UserProfile = {
            bio: safeStorage.getItem(`settings_bio_${user.uid}`, 'Apaixonado por Pokémon e batalhas competitivas!'),
            avatarUrl: safeStorage.getItem(`settings_avatar_${user.uid}`, user.photoURL || ''),
            bannerUrl: safeStorage.getItem(`settings_banner_${user.uid}`, 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'),
            minecraftNick: trainerData?.displayName || user.displayName || '',
            discordTag: trainerData?.discordTag || '',
          };
          await setDoc(userRef, initialProfile, { merge: true });
        } else {
          // Even if exists, ensure nick/discord are mirrored if missing (Retroactive fix)
          const data = initialSnap.docs[0].data();
          if (!data.minecraftNick || !data.discordTag) {
             const trainerSnap = await getDocs(query(collection(db, 'trainer_profiles'), where('uid', '==', user.uid)));
             const trainerData = !trainerSnap.empty ? trainerSnap.docs[0].data() : null;
             if (trainerData) {
               await setDoc(userRef, {
                 minecraftNick: trainerData.displayName || '',
                 discordTag: trainerData.discordTag || ''
               }, { merge: true });
             }
          }
        }

        // Trainer Profile check (Single one-off check)
        const trainerProfileRef = doc(db, 'trainer_profiles', user.uid);
        const trainerProfilesRef = collection(db, 'trainer_profiles');
        const trainerSnap = await getDocs(query(trainerProfilesRef, where('uid', '==', user.uid)));
        
        if (trainerSnap.empty) {
          let nick = user.displayName || user.email?.split('@')[0] || 'Treinador';
          const nickBase = nick;
          
          // Verificação de unicidade de Nick
          const nickCheck = await getDocs(query(
            trainerProfilesRef, 
            where('nick_lowercase', '==', nick.toLowerCase()),
            limit(1)
          ));
          
          if (!nickCheck.empty) {
            // Nick já em uso por outro UID! Gerar um alternativo
            nick = `${nickBase}_${Math.floor(1000 + Math.random() * 9000)}`;
          }

          await setDoc(trainerProfileRef, {
            uid: user.uid,
            displayName: nick,
            nick_lowercase: nick.toLowerCase(),
            bio: 'Apaixonado por Pokémon e batalhas competitivas!',
            avatarUrl: user.photoURL || '',
            bannerUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
            ordersCompletedCount: 0,
            glintCollection: [],
            favoriteTeam: [],
            createdAt: serverTimestamp(),
            isPrivate: false,
            friends: [] // Inicializa lista de amigos vazia
          }, { merge: true });
        }

        if (!isMounted) return;

        // Now start the listener for read-only sync
        unsubscribeProfile = onSnapshot(trainerProfileRef, (docSnap) => {
          if (isMounted && docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          }
        }, (err) => {
          console.error("Profile sync error (Firestore Guard):", err);
          if (isMounted) setLoading(false);
        });

      } catch (err) {
        console.error("AuthContext structural error:", err);
        if (isMounted) setLoading(false);
      }
    };

    if (user) {
      syncProfile();
    }

    return () => {
      isMounted = false;
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user?.uid]);

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, data, { merge: true });
  };

  const isDiscordValid = (_tag: string) => {
    // Permissivo: aceita qualquer string não vazia
    return true;
  };

  const authenticate = async (nick: string, discord: string) => {
    const cleanNick = nick.trim();
    const cleanNickId = cleanNick.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDiscord = discord.trim().toLowerCase();
    
    if (!cleanNickId || !discord.trim()) throw new Error("Preencha campos válidos.");
    
    if (!isDiscordValid(discord)) {
      throw new Error("O formato do Discord '" + discord + "' é inválido. Use usuario#0000 ou o novo formato (ex: joao.poke).");
    }

    // Pre-check: Does this Nick already exist in trainer_profiles?
    const profilesRef = collection(db, 'trainer_profiles');
    const q = query(profilesRef, where('nick_lowercase', '==', cleanNick.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);
    
    let existingDiscord = '';
    if (!querySnapshot.empty) {
      const profileData = querySnapshot.docs[0].data();
      existingDiscord = (profileData.discordTag || '').toLowerCase();
      
      // If profile exists and Discord is different, throw the divergence error early
      if (existingDiscord && existingDiscord !== cleanDiscord) {
        throw new Error(`Este Nick já está em uso por outro Treinador (Credenciais divergentes).`);
      }
    }

    const email = `${cleanNickId}@valiantshop.com`;
    const password = `${cleanDiscord}123456`.slice(0, 16);

    try {
      // Attempt login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Sync display name if needed
      if (userCredential.user.displayName !== cleanNick) {
        await updateProfile(userCredential.user, { displayName: cleanNick });
      }

      // If profile exists but didn't have discordTag (legacy), update it now
      if (!querySnapshot.empty && !existingDiscord) {
        await setDoc(doc(db, 'trainer_profiles', userCredential.user.uid), {
          discordTag: cleanDiscord
        }, { merge: true });
      }

      // ENSURE MIRROR IN 'users' COLLECTION
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        minecraftNick: cleanNick,
        discordTag: cleanDiscord
      }, { merge: true });

    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        // If login fails but we didn't find a divergent discord in the pre-check,
        // it might be a new user or a password mismatch for an account created with different logic.
        
        try {
          // Double check if email is in use (just in case)
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: cleanNick });
          
          // Initial profile creation is handled by the useEffect, 
          // but we want to ensure the discordTag is there.
          await setDoc(doc(db, 'trainer_profiles', userCredential.user.uid), {
            uid: userCredential.user.uid,
            displayName: cleanNick,
            nick_lowercase: cleanNick.toLowerCase(),
            discordTag: cleanDiscord,
            createdAt: serverTimestamp()
          }, { merge: true });

          // ENSURE MIRROR IN 'users' COLLECTION
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            minecraftNick: cleanNick,
            discordTag: cleanDiscord
          }, { merge: true });

        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            throw new Error("Este Nick já está em uso por outro Treinador (Credenciais divergentes).");
          }
          throw createErr;
        }
      } else {
        throw err;
      }
    }
  };


  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ 
        user, 
        profile, 
        loading, 
        authenticate, 
        logout,
        updateProfileData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

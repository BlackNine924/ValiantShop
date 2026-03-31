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
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { safeStorage } from '../utils/storageUtils';

interface UserProfile {
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  discordId?: string;
  googleId?: string;
  discordTag?: string;
  minecraftNick?: string;
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

    // 2. Real-time Profile Sync
    let unsubscribeProfile: (() => void) | undefined;
    
    if (user?.uid) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Pre-populate with defaults or migrated data if new
          const initialProfile: UserProfile = {
            bio: safeStorage.getItem(`settings_bio_${user.uid}`, 'Apaixonado por Pokémon e batalhas competitivas!'),
            avatarUrl: safeStorage.getItem(`settings_avatar_${user.uid}`, user.photoURL || ''),
            bannerUrl: safeStorage.getItem(`settings_banner_${user.uid}`, 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop'),
          };
          setDoc(userRef, initialProfile);
          setProfile(initialProfile);
        }
        setLoading(false);
      }, (err) => {
        console.error("Profile sync error:", err);
        setLoading(false);
      });
    }

    // 3. Removed Discord OAuth Hash Handler


    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [user?.uid]);

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, data, { merge: true });
  };

  const isDiscordValid = (tag: string) => {
    const oldTag = /^.{2,32}#\d{4}$/;
    const newTag = /^[a-z0-9_.]{2,32}$/;
    return oldTag.test(tag) || newTag.test(tag);
  };

  const authenticate = async (nick: string, discord: string) => {
    const cleanNick = nick.trim();
    const cleanNickId = cleanNick.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDiscord = discord.trim().toLowerCase();
    
    if (!cleanNickId || !cleanDiscord) throw new Error("Preencha campos válidos (letras e números).");
    
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!isDiscordValid(discord)) {
      throw new Error("A conta Discord '" + discord + "' não foi encontrada em nossos registros ou o formato é inválido.");
    }

    const email = `${cleanNickId}@valiantshop.com`;
    const password = `${cleanDiscord}123456`.slice(0, 16);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.displayName !== cleanNick) {
        await updateProfile(userCredential.user, { displayName: cleanNick });
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: cleanNick });
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            throw new Error("Este Nick já está em uso por outro Treinador (Discord divergente).");
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

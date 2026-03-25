import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  unlink
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { safeStorage } from '../utils/storageUtils';

interface UserProfile {
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  discordId?: string;
  googleId?: string;
  discordTag?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authenticate: (nick: string, discord: string) => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  linkDiscord: () => Promise<void>;
  linkGoogle: () => Promise<void>;
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

    // 3. Discord OAuth Hash Handler
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        
        fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
        .then(res => res.json())
        .then(async (discordUser) => {
          if (!discordUser.id) throw new Error("Falha ao obter dados do Discord.");
          
          const avatarUrl = discordUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null;

          const discordTag = `${discordUser.username}${discordUser.discriminator !== '0' ? '#' + discordUser.discriminator : ''}`;

          // If user is already logged in, we are LINKING
          if (auth.currentUser) {
            try {
              await registerSocialLink('discord', discordUser.id);
              await updateProfileData({ 
                discordId: discordUser.id, 
                discordTag: discordTag,
                avatarUrl: avatarUrl || undefined
              });
              alert("Discord vinculado com sucesso!");
            } catch (err: any) {
              alert(err.message);
            }
          } else {
            // New Login flow
            const credential = await signInAnonymously(auth);
            await updateProfile(credential.user, {
              displayName: discordUser.username,
              photoURL: avatarUrl
            });
            setUser({ ...credential.user, displayName: discordUser.username, photoURL: avatarUrl } as User);
          }
        })
        .catch(err => {
          console.error("Failed to authenticate with Discord", err);
          alert("Erro ao conectar com o Discord.");
        });
      }
    }

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

  const loginWithDiscord = async () => {
    const clientId = '1484668729165086881'; 
    const redirectUri = encodeURIComponent(window.location.origin);
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=identify`;
    window.location.href = discordAuthUrl;
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Failed to authenticate with Google", err);
      throw err;
    }
  };

  const registerSocialLink = async (type: 'google' | 'discord', socialId: string) => {
    if (!user) return;
    const linkId = `${type}_${socialId}`;
    const linkRef = doc(db, 'social_links', linkId);
    const linkSnap = await getDoc(linkRef);

    if (linkSnap.exists() && linkSnap.data().ownerUid !== user.uid) {
      throw new Error(`Esta conta ${type === 'google' ? 'Google' : 'Discord'} já está vinculada a outro perfil!`);
    }

    await setDoc(linkRef, { ownerUid: user.uid, type, updatedAt: new Date() });
  };

  const linkGoogle = async () => {
    if (!user) return;
    try {
      const result = await linkWithPopup(user, googleProvider);
      const googleId = result.user.providerData.find(p => p.providerId === 'google.com')?.uid;
      
      if (googleId) {
        try {
          await registerSocialLink('google', googleId);
          await updateProfileData({ googleId });
        } catch (linkErr) {
          // If already linked, unlink from current Firebase session to avoid phantom links
          await unlink(user, 'google.com');
          throw linkErr;
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/credential-already-in-use') {
        throw new Error("Esta conta Google já está em uso por outro Treinador.");
      }
      throw err;
    }
  };

  const linkDiscord = async () => {
    // Para simplificar, usamos o mesmo fluxo de Implicit Grant
    loginWithDiscord(); 
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ 
        user, 
        profile, 
        loading, 
        authenticate, 
        loginWithDiscord, 
        loginWithGoogle, 
        linkDiscord,
        linkGoogle,
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
